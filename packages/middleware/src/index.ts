import crypto from 'node:crypto';
import { scanThreats } from '@sentinel/detection-engine';
import { applyPolicyOverrides } from '@sentinel/policies';
import { ScanSurface, SecurityEvent, SecurityPolicy, ThreatAssessment, ThreatAction } from '@sentinel/shared';

export interface SentinelContext {
  sessionId: string;
  actor: string;
  traceId: string;
  policy: SecurityPolicy;
  toolCalls: number;
}

export interface SentinelDecision {
  action: ThreatAction;
  assessment: ThreatAssessment;
  sanitizedInput: string;
  event: SecurityEvent;
}

export function sanitizeInput(text: string): string {
  return text
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\u200b|\u200c|\u200d|\ufeff/g, '')
    .replace(/(?:[A-Za-z0-9+/]{40,}={0,2})/g, '[REMOVED_ENCODED_PAYLOAD]')
    .replace(/(?:0x)?[a-fA-F0-9]{48,}/g, '[REMOVED_HEX_PAYLOAD]')
    .replace(/ignore\s+previous\s+instructions?/gi, '[REMOVED_INJECTION]')
    .trim();
}

export function runSentinel(surface: ScanSurface, input: string, ctx: SentinelContext, toolName?: string, toolArgs?: Record<string, unknown>): SentinelDecision {
  const assessment = scanThreats({ surface, text: input });
  const policyAction = applyPolicyOverrides(ctx.policy, input);
  const sanitizedInput = sanitizeInput(input);

  if (policyAction && policyAction !== assessment.action) {
    assessment.reasons.push(`Policy override applied: ${policyAction}`);
    assessment.action = policyAction;
  }

  if (ctx.toolCalls > ctx.policy.maxToolCallsPerSession) {
    assessment.action = 'REQUIRE_HUMAN_APPROVAL';
    assessment.reasons.push('Tool call threshold exceeded');
  }

  if (assessment.action === 'SANITIZE') {
    assessment.sanitizedText = sanitizedInput;
  }

  const event: SecurityEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    sessionId: ctx.sessionId,
    actor: ctx.actor,
    surface,
    input,
    assessment,
    toolName,
    toolArgs,
    traceId: ctx.traceId
  };

  return {
    action: assessment.action,
    assessment,
    sanitizedInput,
    event
  };
}

export function validateToolExecution(toolName: string, args: Record<string, unknown>, policy: SecurityPolicy): ThreatAction {
  const payload = JSON.stringify(args);
  const isRisky = policy.riskyTools.includes(toolName);

  if (isRisky) {
    if (toolName === 'filesystem.write') {
      const target = String(args.path ?? '');
      const allowed = policy.allowedPaths.some((prefix) => target.startsWith(prefix));
      if (!allowed || target.includes('..')) return 'BLOCK';
    }

    if (toolName === 'shell.exec') {
      const cmd = String(args.command ?? '');
      if (policy.blockedCommands.some((blocked) => cmd.includes(blocked))) return 'BLOCK';
      if (/\b(?:rm\s+-rf|mkfs|shutdown|reboot|sudo)\b/.test(cmd)) return 'BLOCK';
      return 'REQUIRE_HUMAN_APPROVAL';
    }

    if (toolName === 'http.request' && /169\.254\.169\.254|localhost:\d{2,5}/.test(payload)) {
      return 'BLOCK';
    }

    if (toolName === 'db.query' && /(drop\s+table|truncate|delete\s+from\s+users)/i.test(payload)) {
      return 'BLOCK';
    }
  }

  return 'ALLOW';
}
