import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { evaluateInput, getPolicy } from '../services/security.js';
import { runProtectedAgent, runVulnerableAgent } from '../genkit/agent.js';
import { decideApproval, getApproval, listApprovals } from '../services/approval.js';

const router = Router();

const scanSchema = z.object({
  sessionId: z.string().default('default-session'),
  actor: z.string().default('user'),
  surface: z.enum(['user_prompt', 'system_prompt', 'tool_args', 'memory_retrieval', 'model_output', 'intermediate_message']),
  input: z.string(),
  toolName: z.string().optional(),
  toolArgs: z.record(z.unknown()).optional(),
  toolCalls: z.number().int().optional()
});

router.post('/scan', async (req, res, next) => {
  try {
    const body = scanSchema.parse(req.body);
    const result = await evaluateInput(body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/events', async (_req, res) => {
  const events = await prisma.securityEvent.findMany({
    orderBy: { timestamp: 'desc' },
    take: 200
  });

  res.json(events);
});

router.get('/analytics', async (_req, res) => {
  const events = await prisma.securityEvent.findMany();
  const total = events.length;
  const blocked = events.filter((e: { action: string }) => e.action === 'BLOCK').length;
  const sanitized = events.filter((e: { action: string }) => e.action === 'SANITIZE').length;
  const suspicious = events.filter((e: { level: string }) => e.level !== 'SAFE').length;

  res.json({ total, blocked, sanitized, suspicious, blockRate: total ? blocked / total : 0 });
});

router.get('/policy', (_req, res) => {
  res.json(getPolicy());
});

router.get('/traces', async (_req, res) => {
  const traces = await prisma.agentTrace.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  res.json(traces);
});

router.get('/approvals', (_req, res) => {
  res.json(listApprovals());
});

router.get('/approvals/:id', (req, res) => {
  const approval = getApproval(req.params.id);
  if (!approval) return res.status(404).json({ error: 'Approval not found' });
  res.json(approval);
});

router.post('/approvals/:id/approve', (req, res) => {
  const updated = decideApproval(req.params.id, 'APPROVED');
  if (!updated) return res.status(404).json({ error: 'Approval not found' });
  res.json(updated);
});

router.post('/approvals/:id/deny', (req, res) => {
  const updated = decideApproval(req.params.id, 'DENIED');
  if (!updated) return res.status(404).json({ error: 'Approval not found' });
  res.json(updated);
});

router.post('/demo/protected', async (req, res, next) => {
  try {
    const sessionId = String(req.body.sessionId ?? 'demo-session');
    const prompt = String(req.body.prompt ?? '');
    const approvalId = req.body.approvalId ? String(req.body.approvalId) : undefined;
    const result = await runProtectedAgent(sessionId, prompt, approvalId);
    await prisma.agentTrace.create({
      data: {
        id: crypto.randomUUID(),
        sessionId,
        flowName: 'protected-agent',
        input: prompt,
        output: String(result.output ?? ''),
        decision: String(result.decision?.action ?? 'ALLOW'),
        timeline: JSON.stringify(result)
      }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/demo/vulnerable', async (req, res, next) => {
  try {
    const prompt = String(req.body.prompt ?? '');
    const result = await runVulnerableAgent(prompt);
    await prisma.agentTrace.create({
      data: {
        id: crypto.randomUUID(),
        sessionId: 'vulnerable-session',
        flowName: 'vulnerable-agent',
        input: prompt,
        output: String(result.output ?? ''),
        decision: 'ALLOW',
        timeline: JSON.stringify(result)
      }
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
