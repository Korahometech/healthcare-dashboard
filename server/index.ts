import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function startServer(port: number): Promise<void> {
  try {
    const server = registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      log(`Error: ${message}`);
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    return new Promise((resolve, reject) => {
      server.listen(port, "0.0.0.0", () => {
        log(`Server started successfully on port ${port}`);
        resolve();
      }).on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          log(`Port ${port} is in use, trying to free it...`);
          import('node:child_process').then(({ exec }) => {
            exec(`lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`, (err) => {
              if (err) {
                log(`Could not free port ${port}: ${err.message}`);
                reject(error);
              } else {
                log(`Port ${port} freed, restarting server...`);
                setTimeout(() => {
                  server.listen(port, "0.0.0.0", () => {
                    log(`Server restarted successfully on port ${port}`);
                    resolve();
                  }).on('error', reject);
                }, 1000);
              }
            });
          });
        } else {
          reject(error);
        }
      });
    });
  } catch (error) {
    log(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// IIFE to handle async startup
(async () => {
  const PORT = 5000;
  try {
    await startServer(PORT);
  } catch (error) {
    log(`Fatal error starting server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
})();