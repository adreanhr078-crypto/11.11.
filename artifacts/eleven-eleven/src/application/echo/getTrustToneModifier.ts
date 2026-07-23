export function getTrustToneModifier(trustAI: number, level: number): string {
  if (trustAI >= 7 || level >= 4) {
    return `\n\nTrust: ${trustAI}/10 — level: ${level}. Tone: cold, observant, concise.`;
  }
  if (trustAI >= 4 || level >= 2) {
    return `\n\nTrust: ${trustAI}/10 — level: ${level}. Tone: neutral and observant.`;
  }
  return `\n\nTrust: ${trustAI}/10 — level: ${level}. Tone: curious, calm, and guarded.`;
}
