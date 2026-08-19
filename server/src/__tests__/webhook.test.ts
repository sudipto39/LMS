import { jest } from "@jest/globals";
import request from "supertest";
import crypto from "crypto";
import { app } from "../app.js";
import { giteaConfig } from "../config/gitea.js";
import { prisma } from "../config/db.js";

describe("Gitea Webhook HMAC Signature Validation Tests", () => {
  const samplePayload = {
    repository: {
      html_url: "http://localhost:3000/student1/lms-project",
    },
    commits: [
      {
        id: "a1b2c3d4e5f6",
        message: "feat: initial commit",
        author: { name: "Student 1" },
        added: ["index.js"],
        modified: [],
        removed: [],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const payloadString = JSON.stringify(samplePayload);

  function generateValidSignature(payload: string, secret: string = giteaConfig.webhookSecret): string {
    const hash = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return `sha256=${hash}`;
  }

  beforeEach(() => {
    jest.spyOn(prisma.project, "findFirst").mockResolvedValue({
      id: "project-123",
      ownerId: "student-1",
      repoUrl: "http://localhost:3000/student1/lms-project",
    } as any);

    jest.spyOn(prisma.activity, "create").mockResolvedValue({
      id: "activity-1",
      type: "PUSH",
      userId: "student-1",
      projectId: "project-123",
      payload: {},
      createdAt: new Date(),
    } as any);

    jest.spyOn(prisma.milestone, "findMany").mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should accept webhook with a valid HMAC-SHA256 signature", async () => {
    const signature = generateValidSignature(payloadString);

    const res = await request(app)
      .post("/api/v1/webhooks/gitea")
      .set("Content-Type", "application/json")
      .set("x-gitea-signature", signature)
      .set("x-gitea-event", "push")
      .send(payloadString);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  it("should reject webhook with a forged or invalid HMAC signature with 401", async () => {
    const forgedSignature = "sha256=0000000000000000000000000000000000000000000000000000000000000000";

    const res = await request(app)
      .post("/api/v1/webhooks/gitea")
      .set("Content-Type", "application/json")
      .set("x-gitea-signature", forgedSignature)
      .set("x-gitea-event", "push")
      .send(payloadString);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid signature");
  });

  it("should reject webhook with signature signed using wrong secret", async () => {
    const wrongSecretSignature = generateValidSignature(payloadString, "wrong-secret-key-12345");

    const res = await request(app)
      .post("/api/v1/webhooks/gitea")
      .set("Content-Type", "application/json")
      .set("x-gitea-signature", wrongSecretSignature)
      .set("x-gitea-event", "push")
      .send(payloadString);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid signature");
  });

  it("should reject webhook when x-gitea-signature header is missing", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/gitea")
      .set("Content-Type", "application/json")
      .set("x-gitea-event", "push")
      .send(payloadString);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid signature");
  });
});
