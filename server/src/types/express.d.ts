import type { Role } from "../generated/prisma/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name?: string;
        email?: string;
        role: Role;
        isEmailVerified: boolean;
        giteaUsername?: string | null;
      };
    }
  }
}

export {};