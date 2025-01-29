import winston from 'winston';
import { format } from 'winston';
const { combine, timestamp, printf, colorize } = format;

// Custom format for auth logging
const authLogFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create the auth logger
export const authLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    authLogFormat
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/auth-error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/auth.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  authLogger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      authLogFormat
    )
  }));
}

// Auth event types
export enum AuthEventType {
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  REGISTRATION_ATTEMPT = 'REGISTRATION_ATTEMPT',
  REGISTRATION_SUCCESS = 'REGISTRATION_SUCCESS',
  REGISTRATION_FAILURE = 'REGISTRATION_FAILURE',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS'
}

// Log authentication event with diagnostics
export function logAuthEvent(
  eventType: AuthEventType,
  username: string,
  req: any,
  error?: Error | string,
  additionalInfo?: Record<string, any>
) {
  const logData = {
    eventType,
    username,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    path: req.path,
    method: req.method,
    ...(error && { error: error instanceof Error ? error.message : error }),
    ...additionalInfo
  };

  const logLevel = error ? 'error' : 'info';
  const message = `${eventType}: ${username}`;

  authLogger.log(logLevel, message, logData);
}

// Helper function to sanitize error messages
export function sanitizeError(error: any): string {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}
