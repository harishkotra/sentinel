import crypto from 'node:crypto';
import { runSentinel, validateToolExecution, SentinelContext } from '@sentinel/middleware';
import { loadPolicy } from '@sentinel/policies';
import { ScanSurface } from '@sentinel/shared';
import { prisma } from '../db.js';

const policy = loadPolicy(process.env.POLICY_FILE);

export async function evaluateInput(params: {
  surface: ScanSurface;
  input: string;
  sessionId: string;
  actor: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolCalls?: number;
}) {
  const ctx: SentinelContext = {
    sessionId: params.sessionId,
    actor: params.actor,
    traceId: crypto.randomUUID(),
    policy,
    toolCalls: params.toolCalls ?? 0
  };

  const decision = runSentinel(params.surface, params.input, ctx, params.toolName, params.toolArgs);

  await prisma.securityEvent.create({
    data: {
      id: decision.event.id,
      timestamp: new Date(decision.event.timestamp),
      sessionId: decision.event.sessionId,
      actor: decision.event.actor,
      surface: decision.event.surface,
      input: decision.event.input,
      action: decision.assessment.action,
      level: decision.assessment.level,
      totalScore: decision.assessment.totalScore,
      reasons: JSON.stringify(decision.assessment.reasons),
      signals: JSON.stringify(decision.assessment.signals),
      toolName: decision.event.toolName,
      toolArgs: decision.event.toolArgs ? JSON.stringify(decision.event.toolArgs) : null,
      traceId: decision.event.traceId
    }
  });

  return decision;
}

export function evaluateTool(toolName: string, args: Record<string, unknown>) {
  return validateToolExecution(toolName, args, policy);
}

export function getPolicy() {
  return policy;
}
