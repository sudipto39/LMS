import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL;
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
process.env.CLIENT_URL = process.env.CLIENT_URL;
process.env.GITEA_BASE_URL = process.env.GITEA_BASE_URL;
process.env.GITEA_ADMIN_TOKEN = process.env.GITEA_ADMIN_TOKEN;
process.env.GITEA_WEBHOOK_SECRET = process.env.GITEA_WEBHOOK_SECRET;
