import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Healthcare Management API',
      version: '1.0.0',
      description: 'API documentation for the Healthcare Management Platform',
    },
    servers: [
      {
        url: '/api',
        description: 'Development server',
      },
    ],
  },
  apis: ['./server/routes.ts'], // Path to the API routes
};

export const specs = swaggerJsdoc(options);
