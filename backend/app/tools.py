"""Tools the LLM can call. Each tool returns a "card" the frontend renders.

The model never writes card contents itself: the backend fills cards from
profile.json, so links and stacks shown on screen are always the real ones.
"""

import json
from typing import Any

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "show_about",
            "description": "Show the 'about me' card: photo, name, role, location, short intro and tags.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "show_projects",
            "description": "Show a grid of project cards. Optionally filter by category.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "enum": ["all", "backend", "ai", "fullstack"],
                        "description": "Which kind of projects to show. Use 'all' if not specified.",
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "show_project",
            "description": "Show one project in detail (highlights, stack, limitations, links).",
            "parameters": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "The project id, e.g. 'fintech'."}
                },
                "required": ["id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "show_skills",
            "description": "Show the skills / tech stack card.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "show_experience",
            "description": "Show internships, education, leadership and achievements.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "show_certifications",
            "description": "Show certificates and badges (AWS, NPTEL, Coursera, HackerRank) with images and verify links.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "show_volunteering",
            "description": "Show volunteering / social work (NSS) with photos.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "show_contact",
            "description": "Show the contact card (email, LinkedIn, GitHub).",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "show_resume",
            "description": "Show a card with a link to download the resume.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]

TOOL_NAMES = {t["function"]["name"] for t in TOOL_DEFINITIONS}


def _project_summary(p: dict) -> dict:
    return {
        "id": p["id"],
        "title": p["title"],
        "category": p["category"],
        "status": p["status"],
        "summary": p["summary"],
        "stack": p["stack"],
        "github": p.get("github", ""),
        "live": p.get("live", ""),
        "featured": p.get("featured", False),
    }


def run_tool(name: str, raw_args: str | None, profile: dict) -> tuple[dict | None, str]:
    """Executes a tool call.

    Returns (card, result_for_model). card is None if the call was invalid;
    the result string tells the model what happened so it can answer.
    """
    if name not in TOOL_NAMES:
        return None, f"Unknown tool '{name}'."

    try:
        args = json.loads(raw_args) if raw_args else {}
        if not isinstance(args, dict):
            args = {}
    except json.JSONDecodeError:
        args = {}

    if name == "show_projects":
        category = args.get("category") or "all"
        projects = profile["projects"]
        if category != "all":
            projects = [p for p in projects if p["category"] == category]
        projects = sorted(projects, key=lambda p: not p.get("featured", False))
        # Full details travel with the card so the frontend can open a project
        # without another request.
        card = {"type": "projects", "category": category,
                "projects": [{**_project_summary(p), "highlights": p["highlights"],
                              "limitations": p.get("limitations", [])} for p in projects]}
        facts = "; ".join(f"{p['title']} ({p['status']}): {p['summary']}" for p in projects) or "none"
        return card, f"Displayed {len(projects)} project cards. {facts}"

    if name == "show_project":
        pid = str(args.get("id", "")).strip().lower()
        match = next((p for p in profile["projects"] if p["id"] == pid), None)
        if match is None:
            ids = ", ".join(p["id"] for p in profile["projects"])
            return None, f"No project with id '{pid}'. Valid ids: {ids}."
        card = {"type": "project", "project": {**_project_summary(match),
                "highlights": match["highlights"],
                "limitations": match.get("limitations", [])}}
        facts = " ".join(match["highlights"][:4])
        return card, f"Displayed the detail card for {match['title']} ({match['status']}). {match['summary']} {facts}"

    if name == "show_about":
        card = {"type": "about", "name": profile["name"], "nickname": profile["nickname"],
                "role": profile.get("role", ""), "location": profile["location"],
                "status": profile["status"], "bio": profile["bio"], "tags": profile.get("tags", [])}
        return card, "Displayed the about-me card. " + " ".join(profile["bio"]) + f" Status: {profile['status']}"

    if name == "show_skills":
        groups = "; ".join(f"{g}: {', '.join(items)}" for g, items in profile["skills"].items())
        return {"type": "skills", "skills": profile["skills"]}, f"Displayed the skills card. {groups}"

    if name == "show_experience":
        card = {"type": "experience",
                "experience": profile["experience"],
                "education": profile["education"],
                "leadership": profile["leadership"],
                "achievements": profile["achievements"]}
        jobs = "; ".join(f"{x['role']} at {x['company']} ({x['period']})" for x in profile["experience"])
        edu = "; ".join(f"{e['degree']}, {e['school']} ({e['period']})" for e in profile["education"])
        extra = " ".join(profile["achievements"] + profile["leadership"])
        return card, (f"Displayed the experience card. Past internships (completed, not current): {jobs}. "
                      f"Education: {edu}. {extra}")

    if name == "show_certifications":
        certs = sorted(profile.get("certifications", []), key=lambda c: not c.get("featured", False))
        facts = "; ".join(f"{c['name']} by {c['issuer']} ({c.get('date', '')})" for c in certs) or "none"
        return ({"type": "certifications", "certifications": certs},
                f"Displayed {len(certs)} certifications, each with a verify link. {facts}")

    if name == "show_volunteering":
        vol = profile.get("volunteering", [])
        facts = "; ".join(f"{v['role']}, {v['org']}: {' '.join(v.get('highlights', []))}" for v in vol) or "none"
        return {"type": "volunteering", "volunteering": vol}, f"Displayed the volunteering card. {facts}"

    if name == "show_contact":
        c = profile["contact"]
        card = {"type": "contact", "email": c["email"], "linkedin": c["linkedin"],
                "github": c["github"], "location": profile["location"]}
        return card, f"Displayed the contact card. Email {c['email']}, plus LinkedIn and GitHub links. {profile['status']}"

    # show_resume
    return ({"type": "resume", "url": profile["contact"]["resume"], "name": profile["name"]},
            "Displayed the resume download card.")
