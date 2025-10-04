import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

// eslint-disable-next-line node/no-process-env
const db = drizzle(process.env.DATABASE_URL!);

export { db };
