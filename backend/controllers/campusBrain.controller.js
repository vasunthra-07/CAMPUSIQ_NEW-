/**
 * CampusIQ — Campus Brain Controller
 * ==================================
 * Provider-agnostic AI narration layer for Campus Brain.
 *
 * Business logic lives here, separated from the route definitions. The frontend
 * computes the entire campus context deterministically and sends a compact
 * digest; this controller's only job is to turn that digest into fluent natural
 * language using whichever LLM provider is configured.
 *
 * Configuration (backend/.env) — all optional, sensible defaults:
 *   AI_PROVIDER   "ollama" (default) | "openai"   ← "openai" = any OpenAI-compatible API
 *   AI_MODEL      model name (default "llama3.2")
 *   OLLAMA_URL    default "http://localhost:11434"
 *   AI_BASE_URL   for openai-compatible providers, e.g. "https://api.openai.com/v1"
 *                 or "https://api.groq.com/openai/v1"
 *   AI_API_KEY    bearer key for the cloud provider
 *
 * Switching from local Ollama to a cloud model is a pure env change — no code
 * edits. If the provider is unreachable, the controller returns { fallback:true }
 * and the frontend uses its deterministic narrator, so the feature never breaks.
 */

const AI_PROVIDER = (process.env.AI_PROVIDER || 'ollama').toLowerCase();
const AI_MODEL = process.env.AI_MODEL || 'llama3.2';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const AI_BASE_URL = process.env.AI_BASE_URL || '';
const AI_API_KEY = process.env.AI_API_KEY || '';

const BRAIN_PERSONA =
  'You are Campus Brain, the executive AI advisor for CampusIQ, a smart campus operating system. ' +
  'You speak to campus administrators (HOD, Principal, Chairman). ' +
  'You are given a pre-computed, factual CAMPUS CONTEXT digest. ' +
  'Rules: (1) Use ONLY facts present in the context — never invent numbers, names or events. ' +
  '(2) Be concise, executive and decisive. (3) Lead with what matters most. ' +
  '(4) When asked for actions, give concrete, prioritised steps. ' +
  '(5) If the context lacks the answer, say so plainly.';

/** Call a local Ollama generate endpoint. */
async function callOllama(prompt, maxTokens) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.4, num_predict: maxTokens },
    }),
  });
  const data = await response.json();
  return (data && data.response) ? String(data.response).trim() : '';
}

/** Call any OpenAI-compatible chat completion API (OpenAI, Groq, Together, ...). */
async function callOpenAICompatible(system, user, maxTokens) {
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });
  const data = await response.json();
  return data?.choices?.[0]?.message?.content
    ? String(data.choices[0].message.content).trim()
    : '';
}

/** Dispatch to the configured provider. Returns '' on any failure. */
async function generate(system, user, maxTokens = 400) {
  try {
    if (AI_PROVIDER === 'openai' && AI_BASE_URL && AI_API_KEY) {
      return await callOpenAICompatible(system, user, maxTokens);
    }
    // Default: Ollama (single combined prompt).
    const prompt = `${system}\n\n${user}\n\nCampus Brain:`;
    return await callOllama(prompt, maxTokens);
  } catch (err) {
    return '';
  }
}

// ─── Route handlers ──────────────────────────────────────────────────────────

/** POST /api/brain/summary  — narrate the executive situation summary. */
async function summary(req, res) {
  const { context, role } = req.body || {};
  if (!context) {
    return res.status(400).json({ error: 'Missing context', fallback: true });
  }
  const user =
    `CAMPUS CONTEXT:\n${context}\n\n` +
    `Task: Write a crisp executive situation summary for a ${role || 'campus administrator'}. ` +
    `5-7 short sentences. Lead with campus health, then the single most important issue, ` +
    `then notable operational signals. No preamble, no bullet symbols.`;
  const answer = await generate(BRAIN_PERSONA, user, 320);
  if (!answer) return res.json({ answer: '', fallback: true });
  return res.json({ answer, fallback: false, provider: AI_PROVIDER, model: AI_MODEL });
}

/** POST /api/brain/ask  — answer a grounded natural-language question. */
async function ask(req, res) {
  const { context, question, role } = req.body || {};
  if (!context || !question) {
    return res.status(400).json({ error: 'Missing context or question', fallback: true });
  }
  const user =
    `CAMPUS CONTEXT:\n${context}\n\n` +
    `A ${role || 'campus administrator'} asks: "${question}"\n\n` +
    `Answer using only the context above. Be specific and actionable. Under 140 words.`;
  const answer = await generate(BRAIN_PERSONA, user, 360);
  if (!answer) return res.json({ answer: '', fallback: true });
  return res.json({ answer, fallback: false, provider: AI_PROVIDER, model: AI_MODEL });
}

/** GET /api/brain/health — report which provider is configured. */
function providerHealth(_req, res) {
  res.json({
    provider: AI_PROVIDER,
    model: AI_MODEL,
    cloudConfigured: AI_PROVIDER === 'openai' ? Boolean(AI_BASE_URL && AI_API_KEY) : false,
    note: 'Campus Brain works without this endpoint via deterministic fallback.',
  });
}

module.exports = { summary, ask, providerHealth };
