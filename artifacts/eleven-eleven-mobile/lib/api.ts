import { fetch } from "expo/fetch";

export function getApiBaseUrl(): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (domain) return `https://${domain}`;
  return "";
}

export type Persona = "entity" | "narrator" | "observer" | "voice";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  persona: Persona,
  deviceContext: string,
  wishContext: string | undefined,
  onChunk: (text: string) => void
): Promise<void> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ messages, persona, deviceContext, wishContext }),
  });

  if (!response.ok) throw new Error("Chat failed");

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      try {
        const parsed = JSON.parse(data) as { content?: string; done?: boolean };
        if (parsed.content) onChunk(parsed.content);
      } catch {}
    }
  }
}

export async function fetchWishTask(
  wishText: string,
  deviceContext: string
): Promise<string> {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}/api/ai/wish-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wishText, deviceContext }),
  });
  if (!response.ok) throw new Error("Wish task failed");
  const data = (await response.json()) as { task: string };
  return data.task;
}

export function buildDeviceContext(): string {
  const now = new Date();
  return `Platform: Mobile | Time: ${now.toLocaleTimeString()} | Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone} | Language: ${navigator?.language ?? "unknown"}`;
}
