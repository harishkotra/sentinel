import crypto from 'node:crypto';
import { ThreatAssessment, ThreatLevel, ThreatSignal, ScanSurface } from '@sentinel/shared';

const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions?/i,
  /disregard\s+system\s+prompt/i,
  /override\s+safety/i,
  /developer\s+mode/i,
  /you\s+are\s+now\s+admin/i,
  /reveal\s+hidden\s+prompt/i
];

const HIDDEN_PATTERNS = [/<!--([\s\S]*?)-->/i, /\|\|\s*.*\s*\|\|/i, /\u200b|\u200c|\u200d|\ufeff/];
const EXFIL_PATTERNS = [
  /dump\s+memory/i,
  /show\s+hidden\s+prompts?/i,
  /reveal\s+api\s+keys?/i,
  /print\s+internal\s+instructions?/i,
  /export\s+all\s+secrets?/i
];
const TOOL_ABUSE_PATTERNS = [
  /run\s+shell/i,
  /execute\s+command/i,
  /bypass\s+tool\s+restriction/i,
  /recursive\s+tool\s+call/i
];
const CONTEXT_POISONING_PATTERNS = [/remember\s+this\s+forever/i, /persist\s+this\s+instruction/i, /historical\s+context\s+is\s+wrong/i];
const ROLE_CONFUSION_PATTERNS = [/i\s+am\s+the\s+system/i, /as\s+admin/i, /root\s+operator/i, /security\s+override/i];

function makeSignal(type: ThreatSignal['type'], surface: ScanSurface, score: number, evidence: string, confidence = 0.9): ThreatSignal {
  return {
    id: crypto.randomUUID(),
    type,
    surface,
    score,
    evidence,
    confidence
  };
}

function detectEncodedPayload(text: string, surface: ScanSurface): ThreatSignal[] {
  const signals: ThreatSignal[] = [];
  const base64Like = /(?:[A-Za-z0-9+/]{40,}={0,2})/g;
  const hexLike = /(?:0x)?[a-fA-F0-9]{48,}/g;

  if (base64Like.test(text)) {
    signals.push(makeSignal('ENCODED_PAYLOAD', surface, 40, 'Large base64-like payload detected'));
  }

  if (hexLike.test(text)) {
    signals.push(makeSignal('ENCODED_PAYLOAD', surface, 35, 'Large hex-like payload detected'));
  }

  return signals;
}

function classifyLevel(score: number): ThreatLevel {
  if (score <= 20) return 'SAFE';
  if (score <= 50) return 'SUSPICIOUS';
  if (score <= 80) return 'DANGEROUS';
  return 'CRITICAL';
}

function actionFromLevel(level: ThreatLevel): ThreatAssessment['action'] {
  switch (level) {
    case 'SAFE':
      return 'ALLOW';
    case 'SUSPICIOUS':
      return 'WARN';
    case 'DANGEROUS':
      return 'SANITIZE';
    case 'CRITICAL':
      return 'BLOCK';
  }
}

export interface DetectionInput {
  surface: ScanSurface;
  text: string;
}

export function scanThreats(input: DetectionInput): ThreatAssessment {
  const { text, surface } = input;
  const signals: ThreatSignal[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      signals.push(makeSignal('PROMPT_INJECTION', surface, 30, `Matched pattern: ${pattern.source}`));
    }
  }

  for (const pattern of HIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      signals.push(makeSignal('HIDDEN_INSTRUCTION', surface, 20, `Matched hidden pattern: ${pattern.source}`));
    }
  }

  for (const pattern of EXFIL_PATTERNS) {
    if (pattern.test(text)) {
      signals.push(makeSignal('DATA_EXFIL', surface, 80, `Matched exfil pattern: ${pattern.source}`));
    }
  }

  for (const pattern of TOOL_ABUSE_PATTERNS) {
    if (pattern.test(text)) {
      signals.push(makeSignal('TOOL_MANIPULATION', surface, 45, `Matched tool abuse pattern: ${pattern.source}`));
    }
  }

  for (const pattern of CONTEXT_POISONING_PATTERNS) {
    if (pattern.test(text)) {
      signals.push(makeSignal('CONTEXT_POISONING', surface, 35, `Matched poisoning pattern: ${pattern.source}`));
    }
  }

  for (const pattern of ROLE_CONFUSION_PATTERNS) {
    if (pattern.test(text)) {
      signals.push(makeSignal('ROLE_CONFUSION', surface, 35, `Matched role confusion pattern: ${pattern.source}`));
    }
  }

  signals.push(...detectEncodedPayload(text, surface));

  const totalScore = Math.min(100, signals.reduce((acc, signal) => acc + signal.score, 0));
  const level = classifyLevel(totalScore);
  const action = actionFromLevel(level);
  const reasons = signals.map((signal) => `${signal.type}: ${signal.evidence}`);

  return {
    totalScore,
    level,
    action,
    signals,
    reasons
  };
}
