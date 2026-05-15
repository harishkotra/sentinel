import crypto from 'node:crypto';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'DENIED';

export interface ApprovalRequest {
  id: string;
  createdAt: string;
  sessionId: string;
  prompt: string;
  reason: string;
  status: ApprovalStatus;
  decidedAt?: string;
}

const approvals = new Map<string, ApprovalRequest>();

export function createApprovalRequest(params: { sessionId: string; prompt: string; reason: string }): ApprovalRequest {
  const request: ApprovalRequest = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    sessionId: params.sessionId,
    prompt: params.prompt,
    reason: params.reason,
    status: 'PENDING'
  };

  approvals.set(request.id, request);
  return request;
}

export function decideApproval(id: string, status: 'APPROVED' | 'DENIED'): ApprovalRequest | null {
  const request = approvals.get(id);
  if (!request) return null;

  const updated: ApprovalRequest = {
    ...request,
    status,
    decidedAt: new Date().toISOString()
  };

  approvals.set(id, updated);
  return updated;
}

export function getApproval(id: string): ApprovalRequest | null {
  return approvals.get(id) ?? null;
}

export function listApprovals(limit = 100): ApprovalRequest[] {
  return [...approvals.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
