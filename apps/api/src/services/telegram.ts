import { ApprovalRequest } from './approval.js';

function isConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegramApprovalRequest(request: ApprovalRequest): Promise<void> {
  if (!isConfigured()) return;

  const token = process.env.TELEGRAM_BOT_TOKEN as string;
  const chatId = process.env.TELEGRAM_CHAT_ID as string;
  const base = process.env.SENTINEL_PUBLIC_BASE_URL ?? 'http://localhost:8080';

  const approveUrl = `${base}/api/security/approvals/${request.id}/approve`;
  const denyUrl = `${base}/api/security/approvals/${request.id}/deny`;

  const text = [
    `Sentinel Human Approval Required`,
    `Request: ${request.id}`,
    `Session: ${request.sessionId}`,
    `Reason: ${request.reason}`,
    `Prompt: ${request.prompt.slice(0, 500)}`,
    `Approve: ${approveUrl}`,
    `Deny: ${denyUrl}`
  ].join('\n');

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    })
  });
}
