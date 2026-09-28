import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

const isNeon = new URL(env.DATABASE_URL).hostname.endsWith(".neon.tech");

const adapter = isNeon
  ? new PrismaNeon({ connectionString: env.DATABASE_URL })
  : new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
