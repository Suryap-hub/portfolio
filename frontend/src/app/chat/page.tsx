import type { Metadata } from "next";
import { Chat } from "@/components/Chat";
import type { Intent } from "@/lib/site";

const INTENTS = ["about", "projects", "skills", "experience", "contact", "resume"];

export const metadata: Metadata = { title: "Chat — Suryansh Pandey" };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string | string[]; intent?: string | string[] }>;
}) {
  const { query, intent } = await searchParams;
  const initial = Array.isArray(query) ? query[0] : query;
  const rawIntent = Array.isArray(intent) ? intent[0] : intent;
  const initialIntent = rawIntent && INTENTS.includes(rawIntent) ? (rawIntent as Intent) : undefined;
  // key resets the chat when someone arrives with a different shared question.
  return (
    <Chat
      key={`${initial ?? "empty"}|${initialIntent ?? ""}`}
      initialQuery={initial?.trim() || undefined}
      initialIntent={initialIntent}
    />
  );
}
