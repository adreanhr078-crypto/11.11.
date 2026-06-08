import OpenAI from "openai";

// GROQ integration — all AI calls go through Groq's OpenAI-compatible endpoint.
// The GROQ_API_KEY is set in Vercel Environment Variables (Project Settings → Environment Variables).
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const groqApiKey = process.env.GROQ_API_KEY ?? process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "";
const groqBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? GROQ_BASE_URL;

export const openai = new OpenAI({
  apiKey: groqApiKey,
  baseURL: groqBaseUrl,
});
