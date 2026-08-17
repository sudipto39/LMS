import { jest } from "@jest/globals";
import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma/index.js";
import { globalErrorHandler } from "../middlewares/globalErrorHandler.js";
import { AppError } from "../utils/appError.js";

describe("Global Error Handler & Prisma DB Resilience Tests", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;
  let responseStatusCode: number;

  beforeEach(() => {
    responseData = null;
    responseStatusCode = 200;
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockImplementation((code: number) => {
        responseStatusCode = code;
        return mockResponse as Response;
      }) as any,
      json: jest.fn().mockImplementation((data: any) => {
        responseData = data;
        return mockResponse as Response;
      }) as any,
    };
  });

  describe("Prisma Database Errors", () => {
    it("should handle P2002 (Duplicate unique constraint) with 409 Conflict", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`email`)",
        {
          code: "P2002",
          clientVersion: "7.7.0",
          meta: { target: ["email"] },
        }
      );

      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

      expect(responseStatusCode).toBe(409);
      expect(responseData.status).toBe("fail");
      expect(responseData.message).toBe("A record with this email already exists");
    });

    it("should handle P2025 (Record not found) with 404 Not Found", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "An operation failed because it depends on one or more records that were required but not found.",
        {
          code: "P2025",
          clientVersion: "7.7.0",
        }
      );

      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

      expect(responseStatusCode).toBe(404);
      expect(responseData.status).toBe("fail");
      expect(responseData.message).toBe("Record not found");
    });

    it("should handle P2003 (Foreign key violation) with 400 Bad Request", () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        "Foreign key constraint failed on the field: `projectId`",
        {
          code: "P2003",
          clientVersion: "7.7.0",
        }
      );

      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

      expect(responseStatusCode).toBe(400);
      expect(responseData.status).toBe("fail");
      expect(responseData.message).toBe("Related record not found");
    });

    it("should handle PrismaClientValidationError with 400 Bad Request", () => {
      const error = new Prisma.PrismaClientValidationError("Invalid `prisma.user.create()` invocation", {
        clientVersion: "7.7.0",
      });

      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

      expect(responseStatusCode).toBe(400);
      expect(responseData.status).toBe("fail");
      expect(responseData.message).toBe("Invalid data provided");
    });
  });

  describe("JWT Auth Errors", () => {
    it("should handle JsonWebTokenError with 401 Unauthorized", () => {
      const error = new Error("jwt malformed");
      error.name = "JsonWebTokenError";

      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

      expect(responseStatusCode).toBe(401);
      expect(responseData.status).toBe("fail");
      expect(responseData.message).toBe("Invalid token");
    });

    it("should handle TokenExpiredError with 401 Unauthorized", () => {
      const error = new Error("jwt expired");
      error.name = "TokenExpiredError";

      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

      expect(responseStatusCode).toBe(401);
      expect(responseData.status).toBe("fail");
      expect(responseData.message).toBe("Token expired. Please log in again");
    });
  });

  describe("Operational AppErrors & Fallback", () => {
    it("should pass through custom operational AppErrors with their status code", () => {
      const error = new AppError("You do not have permission to perform this action", 403);

      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

      expect(responseStatusCode).toBe(403);
      expect(responseData.status).toBe("fail");
      expect(responseData.message).toBe("You do not have permission to perform this action");
    });

    it("should handle unexpected generic Error with 500 status without crashing", () => {
      const error = new Error("Unexpected crash simulation");

      globalErrorHandler(error, mockRequest as Request, mockResponse as Response, jest.fn());

      expect(responseStatusCode).toBe(500);
      expect(responseData.status).toBe("error");
      expect(responseData.message).toBeDefined();
    });
  });
});
