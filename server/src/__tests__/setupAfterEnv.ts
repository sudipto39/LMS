import { disconnectDB } from "../config/db.js";
import { disconnectRedis } from "../config/redis.js";

afterAll(async () => {
  await disconnectDB();
  await disconnectRedis();
});
