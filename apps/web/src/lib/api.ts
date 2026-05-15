export async function getEvents() {
  const res = await fetch('/api/security/events');
  return res.json();
}

export async function getAnalytics() {
  const res = await fetch('/api/security/analytics');
  return res.json();
}

export async function getTraces() {
  const res = await fetch('/api/security/traces');
  return res.json();
}

export async function runDemo(mode: 'protected' | 'vulnerable', prompt: string) {
  const res = await fetch(`/api/security/demo/${mode}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId: 'dashboard-session', prompt })
  });

  return res.json();
}
