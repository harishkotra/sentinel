import './env.js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function ensureSchema() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SecurityEvent" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "timestamp" DATETIME NOT NULL,
      "sessionId" TEXT NOT NULL,
      "actor" TEXT NOT NULL,
      "surface" TEXT NOT NULL,
      "input" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "level" TEXT NOT NULL,
      "totalScore" INTEGER NOT NULL,
      "reasons" TEXT NOT NULL,
      "signals" TEXT NOT NULL,
      "toolName" TEXT,
      "toolArgs" TEXT,
      "traceId" TEXT NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AgentTrace" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "sessionId" TEXT NOT NULL,
      "flowName" TEXT NOT NULL,
      "input" TEXT NOT NULL,
      "output" TEXT NOT NULL,
      "decision" TEXT NOT NULL,
      "timeline" TEXT NOT NULL
    );
  `);
}
