export type ThreatAction = 'ALLOW' | 'WARN' | 'SANITIZE' | 'BLOCK' | 'REQUIRE_HUMAN_APPROVAL';

export type ThreatLevel = 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'CRITICAL';

export type ScanSurface =
  | 'user_prompt'
  | 'system_prompt'
  | 'tool_args'
  | 'memory_retrieval'
  | 'model_output'
  | 'intermediate_message';

export interface ThreatSignal {
  id: string;
  type:
    | 'PROMPT_INJECTION'
    | 'HIDDEN_INSTRUCTION'
    | 'ENCODED_PAYLOAD'
    | 'DATA_EXFIL'
    | 'TOOL_MANIPULATION'
    | 'CONTEXT_POISONING'
    | 'ROLE_CONFUSION';
  surface: ScanSurface;
  score: number;
  confidence: number;
  evidence: string;
}

export interface ThreatAssessment {
  totalScore: number;
  level: ThreatLevel;
  action: ThreatAction;
  signals: ThreatSignal[];
  sanitizedText?: string;
  reasons: string[];
}

export interface SecurityPolicyRule {
  name: string;
  match: string[];
  action: ThreatAction;
}

export interface SecurityPolicy {
  id: string;
  version: string;
  rules: SecurityPolicyRule[];
  riskyTools: string[];
  blockedCommands: string[];
  allowedPaths: string[];
  maxToolCallsPerSession: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  sessionId: string;
  actor: string;
  surface: ScanSurface;
  input: string;
  assessment: ThreatAssessment;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  traceId: string;
}
