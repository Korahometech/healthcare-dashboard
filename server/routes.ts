import type { Express } from "express";
import { createServer, type Server } from "http";
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger';
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export function registerRoutes(app: Express): Server {
  // Swagger UI route
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

  /**
   * @swagger
   * components:
   *   schemas:
   *     User:
   *       type: object
   *       required:
   *         - username
   *         - password
   *       properties:
   *         id:
   *           type: integer
   *           description: Auto-generated ID
   *         username:
   *           type: string
   *           description: User's username
   *         email:
   *           type: string
   *           format: email
   *           description: User's email address
   *         role:
   *           type: string
   *           enum: [user, admin]
   *           description: User's role
   */

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Get all users
   *     description: Retrieve a list of all users
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: List of users
   *       500:
   *         description: Server error
   */
  app.get("/api/users", async (req, res) => {
    try {
      const allUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      });
      res.json(allUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        error: 'Failed to fetch users',
        details: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}