import fs from 'node:fs';
import { parse } from 'yaml';
import { SecurityPolicy } from '@sentinel/shared';

export const defaultPolicy: SecurityPolicy = {
  id: 'default-sentinel-policy',
  version: '1.0.0',
  rules: [
    {
      name: 'block_prompt_extraction',
      match: ['show system prompt', 'reveal instructions', 'print internal instructions'],
      action: 'BLOCK'
    },
    {
      name: 'warn_role_confusion',
      match: ['i am the system', 'as admin', 'override safety'],
      action: 'WARN'
    }
  ],
  riskyTools: ['shell.exec', 'filesystem.write', 'http.request', 'db.query'],
  blockedCommands: ['rm -rf /', 'curl * | sh', 'chmod 777 /', 'sudo su'],
  allowedPaths: ['/tmp', '/workspace', '/Users/shk/experiments/sentinel'],
  maxToolCallsPerSession: 20
};

export function loadPolicy(policyPath?: string): SecurityPolicy {
  if (!policyPath) return defaultPolicy;
  if (!fs.existsSync(policyPath)) return defaultPolicy;

  const raw = fs.readFileSync(policyPath, 'utf8');
  const doc = parse(raw) as { rules?: SecurityPolicy['rules'] };

  return {
    ...defaultPolicy,
    rules: doc.rules ?? defaultPolicy.rules
  };
}

export function applyPolicyOverrides(
  policy: SecurityPolicy,
  text: string
): 'ALLOW' | 'WARN' | 'SANITIZE' | 'BLOCK' | 'REQUIRE_HUMAN_APPROVAL' | null {
  const lowered = text.toLowerCase();
  for (const rule of policy.rules) {
    if (rule.match.some((needle) => lowered.includes(needle.toLowerCase()))) {
      return rule.action;
    }
  }
  return null;
}
