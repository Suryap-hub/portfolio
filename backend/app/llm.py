"""LLM access, behind a small interface so tests can swap in a fake model.

A model's stream() yields normalised events:
  {"text": "..."}                                    a piece of the answer
  {"tool": {"index", "id", "name", "arguments"}}     a piece of a tool call
"""

from typing import Any, Iterator, Protocol

from .config import settings


class ChatModel(Protocol):
    def stream(self, messages: list[dict], tools: list[dict], allow_tools: bool) -> Iterator[dict]:
        ...


class GroqModel:
    def __init__(self, api_key: str, model: str, max_tokens: int, reasoning_effort: str):
        from groq import Groq  # imported here so tests don't need a key

        self.client = Groq(api_key=api_key, timeout=30.0, max_retries=1)
        self.model = model
        self.max_tokens = max_tokens
        self.reasoning_effort = reasoning_effort

    def stream(self, messages: list[dict], tools: list[dict], allow_tools: bool) -> Iterator[dict]:
        kwargs: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "tools": tools,
            "tool_choice": "auto" if allow_tools else "none",
            "temperature": 0.4,
            "max_completion_tokens": self.max_tokens,
            "stream": True,
        }
        if self.model.startswith("openai/gpt-oss") and self.reasoning_effort:
            kwargs["reasoning_effort"] = self.reasoning_effort

        for chunk in self.client.chat.completions.create(**kwargs):
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta.content:
                yield {"text": delta.content}
            for tc in delta.tool_calls or []:
                fn = tc.function
                yield {"tool": {
                    "index": tc.index,
                    "id": tc.id,
                    "name": fn.name if fn else None,
                    "arguments": fn.arguments if fn else None,
                }}


def create_default_model() -> ChatModel:
    return GroqModel(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        max_tokens=settings.max_output_tokens,
        reasoning_effort=settings.reasoning_effort,
    )
