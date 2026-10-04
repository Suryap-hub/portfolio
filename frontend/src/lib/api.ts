import { API_URL } from "./site";
import type { Profile, Role, StreamEvent } from "./types";

/** Wakes the free-tier backend early so the first answer is faster. */
export function warmUp(): void {
  fetch(`${API_URL}/api/health`, { cache: "no-store" }).catch(() => {});
}

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  const res = await fetch(`${API_URL}/api/profile`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Profile request failed (${res.status})`);
  return res.json();
}

/**
 * Sends the conversation and calls onEvent for every Server-Sent Event.
 * Throws an Error with a readable message for HTTP errors (429, 422, 503...).
 */
export async function streamChat(
  messages: { role: Role; content: string }[],
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
  intent?: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(intent ? { messages, intent } : { messages }),
    signal,
  });

  if (!res.ok || !res.body) {
    let detail = `Request failed (${res.status}).`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") detail = data.detail;
      else if (Array.isArray(data.detail)) detail = "That message couldn't be sent. Try a shorter question.";
    } catch {
      /* body wasn't JSON */
    }
    throw new Error(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Events are separated by a blank line.
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      for (const line of raw.split("\n")) {
        if (line.startsWith("data: ")) {
          try {
            onEvent(JSON.parse(line.slice(6)) as StreamEvent);
          } catch {
            /* ignore a malformed event */
          }
        }
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
}
