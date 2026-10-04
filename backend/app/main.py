"""FastAPI app: /health, /api/profile and the streaming /api/chat endpoint."""

import json
import logging
from typing import Iterator, Literal

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, field_validator

from .chat import chat_events
from .config import settings
from .llm import ChatModel, create_default_model
from .profile import load_profile
from .rate_limit import RateLimiter

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("portfolio")

app = FastAPI(title="Surya's AI Portfolio API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

rate_limiter = RateLimiter(limit=settings.rate_limit_per_hour)


# ---------- request models ----------

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message is empty")
        return v.strip()


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=50)
    # Set by the quick buttons so the card can be shown without asking the model first.
    intent: Literal[
        "about", "projects", "skills", "experience", "contact", "resume", "certifications", "volunteering"
    ] | None = None


# ---------- dependencies ----------

_model: ChatModel | None = None


def get_model() -> ChatModel:
    global _model
    if not settings.groq_api_key:
        raise HTTPException(503, "The AI is not configured yet (missing GROQ_API_KEY).")
    if _model is None:
        _model = create_default_model()
    return _model


def get_profile() -> dict:
    return load_profile()


def client_key(request: Request) -> str:
    # Render/Vercel put the real client IP in X-Forwarded-For. The last entry is
    # the one added by the host's proxy, so a visitor can't fake it.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


# ---------- routes ----------

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/profile")
def profile(p: dict = Depends(get_profile)) -> dict:
    return p


def _sse(events: Iterator[dict]) -> Iterator[str]:
    try:
        for event in events:
            yield f"data: {json.dumps(event)}\n\n"
    except Exception as exc:  # LLM/network errors mid-stream
        log.exception("chat stream failed")
        message = "The AI is having trouble right now. Please try again in a moment."
        if exc.__class__.__name__ == "RateLimitError":
            message = "The AI is getting a lot of questions right now. Please try again in a minute."
        yield f"data: {json.dumps({'type': 'error', 'message': message})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"


@app.post("/api/chat")
def chat(
    body: ChatRequest,
    request: Request,
    model: ChatModel = Depends(get_model),
    p: dict = Depends(get_profile),
):
    if body.messages[-1].role != "user":
        raise HTTPException(422, "The last message must come from the user.")
    if len(body.messages[-1].content) > settings.max_message_chars:
        raise HTTPException(422, f"Please keep questions under {settings.max_message_chars} characters.")

    allowed, retry_after = rate_limiter.check(client_key(request))
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"detail": "You've asked a lot of questions! Please try again later or email me directly."},
            headers={"Retry-After": str(retry_after)},
        )

    # Keep only recent turns, and cap old answers so the prompt stays small.
    history = [
        {"role": m.role, "content": m.content if m.role == "user" else m.content[:1500]}
        for m in body.messages[-settings.max_history_messages:]
    ]
    if history[0]["role"] != "user":
        history = history[1:]

    return StreamingResponse(
        _sse(chat_events(history, model, p, body.intent)),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
