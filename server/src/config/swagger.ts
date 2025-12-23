import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DoorAuthServer API',
            version: '1.0.0',
            description: 'Multi-Tenant Identity & Authorization System with SSO, RBAC, and Dynamic Menu Management',
            contact: {
                name: 'API Support',
                email: 'support@doorauthserver.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token',
                },
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            description: 'Indicates if the request was successful',
                        },
                        data: {
                            type: 'object',
                            description: 'Response data',
                        },
                        message: {
                            type: 'string',
                            description: 'Optional message',
                        },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            description: 'Error message',
                        },
                        data: {
                            type: 'null',
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: 'Authentication',
                description: 'User authentication endpoints',
            },
            {
                name: 'Two-Factor Authentication',
                description: '2FA management endpoints',
            },
            {
                name: 'Password Recovery',
                description: 'Password reset and recovery endpoints',
            },
            {
                name: 'Account Security',
                description: 'Account security and management endpoints',
            },
            {
                name: 'Tenants',
                description: 'Tenant management endpoints',
            },
        ],
    },
    apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
