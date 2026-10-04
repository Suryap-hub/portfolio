"""The chat loop: stream the answer, run tool calls, emit cards.

Typed question:
  call 1: model (full profile in the prompt) streams text and/or asks for a card
  if it asked for a card: show it, then
  call 2: short prompt + the card's facts -> a 1-3 sentence caption

Quick button (intent = "projects", "skills", ...):
  the card is known already, so it's shown immediately and only call 2 runs.
  That is instant for the visitor and ~4x cheaper on Groq's free tier.
"""

import logging
from typing import Iterator

from .llm import ChatModel
from .prompt import build_followup_prompt, build_system_prompt
from .tools import TOOL_DEFINITIONS, run_tool

log = logging.getLogger("portfolio.chat")

MAX_TOOL_CALLS_PER_ANSWER = 2

# Quick-button intents and the tool each one maps to.
INTENT_TOOLS = {
    "about": "show_about",
    "projects": "show_projects",
    "skills": "show_skills",
    "experience": "show_experience",
    "contact": "show_contact",
    "resume": "show_resume",
}


def _show_cards_and_caption(
    question: dict, calls: list[dict], text_so_far: str, model: ChatModel, profile: dict
) -> Iterator[dict]:
    """Runs the tool calls, emits their cards, then streams a short caption."""
    messages: list[dict] = [
        {"role": "system", "content": build_followup_prompt(profile)},
        question,
        {
            "role": "assistant",
            "content": text_so_far or None,
            "tool_calls": [
                {"id": c["id"], "type": "function",
                 "function": {"name": c["name"], "arguments": c["arguments"] or "{}"}}
                for c in calls
            ],
        },
    ]
    for call in calls:
        card, result = run_tool(call["name"], call["arguments"], profile)
        log.info("tool %s -> %s", call["name"], "card" if card else "no card")
        if card:
            yield {"type": "card", "card": card}
        messages.append({"role": "tool", "tool_call_id": call["id"], "content": result})

    for event in model.stream(messages, TOOL_DEFINITIONS, False):
        if "text" in event:
            yield {"type": "text", "delta": event["text"]}


def chat_events(
    history: list[dict], model: ChatModel, profile: dict, intent: str | None = None
) -> Iterator[dict]:
    question = history[-1]

    # Quick button: we already know which card to show.
    if intent in INTENT_TOOLS:
        call = {"id": "intent_0", "name": INTENT_TOOLS[intent], "arguments": "{}"}
        yield from _show_cards_and_caption(question, [call], "", model, profile)
        yield {"type": "done"}
        return

    # Typed question: let the model decide whether a card helps.
    messages: list[dict] = [{"role": "system", "content": build_system_prompt(profile)}, *history]
    text_parts: list[str] = []
    calls: dict[int, dict] = {}

    for event in model.stream(messages, TOOL_DEFINITIONS, True):
        if "text" in event:
            text_parts.append(event["text"])
            yield {"type": "text", "delta": event["text"]}
        elif "tool" in event:
            piece = event["tool"]
            call = calls.setdefault(piece["index"], {"id": None, "name": "", "arguments": ""})
            if piece.get("id"):
                call["id"] = piece["id"]
            if piece.get("name"):
                call["name"] += piece["name"]
            if piece.get("arguments"):
                call["arguments"] += piece["arguments"]

    if calls:
        ordered = [calls[i] for i in sorted(calls)][:MAX_TOOL_CALLS_PER_ANSWER]
        for n, call in enumerate(ordered):
            call["id"] = call["id"] or f"call_{n}"
        yield from _show_cards_and_caption(question, ordered, "".join(text_parts), model, profile)

    yield {"type": "done"}
