const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function loginAPI(userId: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password })
  });
  return res.json();
}

export async function aiChatAPI(systemPrompt: string, userMessage: string, token: string) {
  const res = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ systemPrompt, userMessage })
  });
  return res.json();
}

export async function dropoutAnalysisAPI(studentData: any, token: string) {
  const res = await fetch(`${API_URL}/api/ai/dropout-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ studentData })
  });
  return res.json();
}

export async function saveInterventionAPI(data: any, token: string) {
  const res = await fetch(`${API_URL}/api/interventions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  return res.json();
}
