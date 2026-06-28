export async function askClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const token = localStorage.getItem('CampusIQ_token') || '';
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ systemPrompt, userMessage })
    });
    const data = await res.json();
    return data.response || 'Unable to generate response.';
  } catch {
    return 'AI temporarily offline. Please try again.';
  }
}
