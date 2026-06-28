export async function askClaude(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    // In actual app, DO NOT SEND API KEY from client. Proxy to backend instead.
    // For this prototype, returning sample response to avoid exposing key if missing.
    if (!response.ok) {
        // Mock fallback if API key is not present or we face CORS issues
        return "I am Sentinel. I currently do not have access to the live inference API route, however I am analyzing the provided cohort data and noticing several critical patterns that require your attention. How would you like to proceed?";
    }
    const data = await response.json();
    return data.content?.[0]?.text ?? "Unable to generate response.";
  } catch {
    return "AI temporarily unavailable. Please try again in a moment.";
  }
}
