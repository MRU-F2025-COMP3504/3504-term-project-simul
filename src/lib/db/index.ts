import { drizzle } from "drizzle-orm/node-postgres";

import { serverEnv } from "../env";

const db = drizzle(serverEnv.DATABASE_URL!);

export { db };
