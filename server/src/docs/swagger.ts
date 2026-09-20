// src/docs/swagger.ts

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "GiteaForge LMS API",
    version: "1.0.0",
    description:
      "Enterprise Academic Project Management, Continuous Evaluation & Git Defense Platform API Documentation",
    contact: {
      name: "GiteaForge Platform Support",
      url: "https://github.com/sudipto39/LMS",
    },
  },
  servers: [
    {
      url: "/api/v1",
      description: "Default API Gateway (v1)",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Standard JWT Bearer token in the Authorization header.",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "clxyz123" },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          role: { type: "string", enum: ["STUDENT", "SUPERVISOR", "ADMIN"], example: "STUDENT" },
          department: { type: "string", example: "CSE" },
          universityId: { type: "string", example: "2024CS001" },
          giteaUsername: { type: "string", example: "john-doe" },
          isEmailVerified: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", example: "proj123" },
          title: { type: "string", example: "Autonomous Drone Navigation" },
          description: { type: "string", example: "Vision-based SLAM drone project" },
          status: { type: "string", enum: ["DRAFT", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED", "ARCHIVED"] },
          repoUrl: { type: "string", example: "http://localhost:3000/john-doe/drone-nav.git" },
          progress: { type: "number", example: 60 },
          technologies: { type: "array", items: { type: "string" } },
        },
      },
      ApiResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          message: { type: "string" },
          data: { type: "object" },
          meta: {
            type: "object",
            properties: {
              total: { type: "number" },
              page: { type: "number" },
              limit: { type: "number" },
              totalPages: { type: "number" },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          message: { type: "string", example: "Invalid credentials or unauthorized access" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Register new user account",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "universityId", "department", "phoneNumber"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  universityId: { type: "string" },
                  department: { type: "string" },
                  phoneNumber: { type: "string" },
                  batchId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User successfully registered" },
          "400": { description: "Validation error" },
          "409": { description: "User already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Sign in with email and password",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Successfully authenticated with JWT" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        summary: "Verify email with one-time 6-digit OTP code",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code"],
                properties: {
                  email: { type: "string" },
                  code: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Email successfully verified" },
          "400": { description: "Invalid or expired OTP" },
        },
      },
    },
    "/auth/csrf": {
      get: {
        summary: "Fetch CSRF token",
        tags: ["Authentication"],
        responses: {
          "200": { description: "CSRF token returned in header and payload" },
        },
      },
    },
    "/users/me": {
      get: {
        summary: "Get current authenticated profile",
        tags: ["Users"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Profile data returned" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/users/change-password": {
      patch: {
        summary: "Change account password",
        tags: ["Users"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Password successfully updated" },
          "400": { description: "Validation failure" },
        },
      },
    },
    "/projects/me": {
      get: {
        summary: "Get projects owned or joined by the current student",
        tags: ["Projects"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "List of student projects" },
        },
      },
    },
    "/projects/create": {
      post: {
        summary: "Create a new capstone project",
        tags: ["Projects"],
        security: [{ BearerAuth: [] }],
        responses: {
          "201": { description: "Project created" },
        },
      },
    },
    "/execute": {
      post: {
        summary: "Execute code in sandbox runner",
        tags: ["Code Execution"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["language", "sourceCode"],
                properties: {
                  language: { type: "string", example: "python" },
                  sourceCode: { type: "string", example: "print('Hello, World!')" },
                  stdin: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Sandbox execution result" },
        },
      },
    },
    "/execute/languages": {
      get: {
        summary: "List supported programming languages",
        tags: ["Code Execution"],
        responses: {
          "200": { description: "Supported execution languages" },
        },
      },
    },
    "/admin/stats": {
      get: {
        summary: "Get global system metrics",
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "System statistics" },
        },
      },
    },
    "/admin/users": {
      get: {
        summary: "List all platform users (paginated)",
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Paginated users list" },
        },
      },
    },
    "/admin/audit-logs": {
      get: {
        summary: "List system audit logs (paginated)",
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 100 } },
        ],
        responses: {
          "200": { description: "Audit trail events" },
        },
      },
    },
  },
};

export default swaggerSpec;
