import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx scripts/seed-db.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
