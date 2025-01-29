import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";
import { authLogger, logAuthEvent, AuthEventType, sanitizeError } from "./logger";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "healthcare-platform-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      path: '/',
      httpOnly: true
    },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      ...sessionSettings.cookie,
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        logAuthEvent(AuthEventType.LOGIN_ATTEMPT, username, { ip: 'unknown', headers: {}, path: '/api/login', method: 'POST' });

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          logAuthEvent(
            AuthEventType.LOGIN_FAILURE,
            username,
            { ip: 'unknown', headers: {}, path: '/api/login', method: 'POST' },
            'Incorrect username'
          );
          return done(null, false, { message: "Incorrect username." });
        }

        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          logAuthEvent(
            AuthEventType.LOGIN_FAILURE,
            username,
            { ip: 'unknown', headers: {}, path: '/api/login', method: 'POST' },
            'Incorrect password'
          );
          return done(null, false, { message: "Incorrect password." });
        }

        logAuthEvent(
          AuthEventType.LOGIN_SUCCESS,
          username,
          { ip: 'unknown', headers: {}, path: '/api/login', method: 'POST' }
        );
        return done(null, user);
      } catch (err) {
        console.error('Authentication error:', err);
        logAuthEvent(
          AuthEventType.LOGIN_FAILURE,
          username,
          { ip: 'unknown', headers: {}, path: '/api/login', method: 'POST' },
          sanitizeError(err)
        );
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        logAuthEvent(
          AuthEventType.UNAUTHORIZED_ACCESS,
          'unknown',
          { ip: 'unknown', headers: {}, path: '', method: '' },
          'User not found during session deserialization'
        );
        return done(new Error('User not found'));
      }
      done(null, user);
    } catch (err) {
      console.error('Deserialization error:', err);
      logAuthEvent(
        AuthEventType.UNAUTHORIZED_ACCESS,
        'unknown',
        { ip: 'unknown', headers: {}, path: '', method: '' },
        sanitizeError(err)
      );
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      logAuthEvent(AuthEventType.REGISTRATION_ATTEMPT, req.body.username || 'unknown', req);

      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        logAuthEvent(
          AuthEventType.REGISTRATION_FAILURE,
          req.body.username || 'unknown',
          req,
          'Invalid input',
          { validationErrors: result.error.issues }
        );
        return res.status(400).json({ 
          error: "Invalid input", 
          details: result.error.issues.map(i => i.message)
        });
      }

      const { username, password } = result.data;

      // Validation checks
      if (!username || !username.trim()) {
        logAuthEvent(
          AuthEventType.REGISTRATION_FAILURE,
          username,
          req,
          'Empty username'
        );
        return res.status(400).json({ error: "Username cannot be empty" });
      }

      if (password.length < 6) {
        logAuthEvent(
          AuthEventType.REGISTRATION_FAILURE,
          username,
          req,
          'Password too short'
        );
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }

      // Check existing user
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser.length > 0) {
        logAuthEvent(
          AuthEventType.REGISTRATION_FAILURE,
          username,
          req,
          'Username already exists'
        );
        return res.status(409).json({ error: "Username already exists" });
      }

      const hashedPassword = await crypto.hash(password);
      const [newUser] = await db
        .insert(users)
        .values({
          username: username.trim(),
          password: hashedPassword,
        })
        .returning();

      logAuthEvent(
        AuthEventType.REGISTRATION_SUCCESS,
        username,
        req,
        undefined,
        { userId: newUser.id }
      );

      req.login(newUser, (err) => {
        if (err) {
          console.error('Login after registration failed:', err);
          logAuthEvent(
            AuthEventType.LOGIN_FAILURE,
            username,
            req,
            'Login after registration failed'
          );
          return next(err);
        }

        req.session.save((err) => {
          if (err) {
            console.error('Session save failed:', err);
            logAuthEvent(
              AuthEventType.LOGIN_FAILURE,
              username,
              req,
              'Session save failed'
            );
            return next(err);
          }

          return res.json({
            message: "Registration successful",
            user: { id: newUser.id, username: newUser.username }
          });
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      logAuthEvent(
        AuthEventType.REGISTRATION_FAILURE,
        req.body.username || 'unknown',
        req,
        sanitizeError(error)
      );
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: IVerifyOptions) => {
      if (err) {
        console.error('Login error:', err);
        logAuthEvent(
          AuthEventType.LOGIN_FAILURE,
          req.body.username || 'unknown',
          req,
          sanitizeError(err)
        );
        return next(err);
      }

      if (!user) {
        logAuthEvent(
          AuthEventType.LOGIN_FAILURE,
          req.body.username || 'unknown',
          req,
          info.message || 'Login failed'
        );
        return res.status(401).json({ error: info.message ?? "Login failed" });
      }

      req.login(user, (err) => {
        if (err) {
          console.error('Login session creation failed:', err);
          logAuthEvent(
            AuthEventType.LOGIN_FAILURE,
            req.body.username,
            req,
            'Session creation failed'
          );
          return next(err);
        }

        req.session.save((err) => {
          if (err) {
            console.error('Session save failed:', err);
            logAuthEvent(
              AuthEventType.LOGIN_FAILURE,
              req.body.username,
              req,
              'Session save failed'
            );
            return next(err);
          }

          logAuthEvent(
            AuthEventType.LOGIN_SUCCESS,
            user.username,
            req
          );

          return res.json({
            message: "Login successful",
            user: { id: user.id, username: user.username }
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const username = req.user.username;
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        logAuthEvent(
          AuthEventType.LOGOUT,
          username,
          req,
          'Logout failed'
        );
        return res.status(500).json({ error: "Logout failed" });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          logAuthEvent(
            AuthEventType.LOGOUT,
            username,
            req,
            'Session cleanup failed'
          );
          return res.status(500).json({ error: "Session cleanup failed" });
        }

        logAuthEvent(
          AuthEventType.LOGOUT,
          username,
          req
        );

        res.json({ message: `Successfully logged out ${username}` });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const { id, username } = req.user;
      return res.json({ id, username });
    }
    logAuthEvent(
      AuthEventType.UNAUTHORIZED_ACCESS,
      'unknown',
      req,
      'Not authenticated'
    );
    res.status(401).json({ error: "Not authenticated" });
  });
}