"""Loads profile.json — the single source of truth for everything the AI knows."""

import json
from functools import lru_cache
from pathlib import Path

from .config import settings


@lru_cache
def load_profile(path: Path | None = None) -> dict:
    with open(path or settings.profile_path, encoding="utf-8") as f:
        return json.load(f)


def profile_as_text(profile: dict) -> str:
    """Turns the profile into plain text for the system prompt.

    The profile is small (a few KB), so the whole thing goes into the prompt.
    No RAG needed until it grows much larger.
    """
    lines: list[str] = []
    add = lines.append

    add(f"NAME: {profile['name']} (goes by {profile['nickname']})")
    if profile.get("role"):
        add(f"ROLE: {profile['role']}")
    add(f"HEADLINE: {profile['headline']}")
    add(f"LOCATION: {profile['location']}")
    add(f"STATUS: {profile['status']}")
    add("BIO:")
    for line in profile["bio"]:
        add(f"- {line}")

    c = profile["contact"]
    add(f"CONTACT: email {c['email']} | LinkedIn {c['linkedin']} | GitHub {c['github']}")

    add("EDUCATION:")
    for e in profile["education"]:
        details = f" — {e['details']}" if e.get("details") else ""
        add(f"- {e['degree']}, {e['school']} ({e['period']}){details}")

    add("EXPERIENCE (past internships, both completed; not currently working there):")
    for x in profile["experience"]:
        add(f"- {x['role']} at {x['company']} ({x['period']})")
        for h in x.get("highlights", []):
            add(f"  * {h}")
        if not x.get("highlights"):
            add("  * (no further details recorded — do not invent any)")

    add("PROJECTS:")
    for p in profile["projects"]:
        add(f"- [{p['id']}] {p['title']} — status: {p['status']}")
        add(f"  summary: {p['summary']}")
        add(f"  stack: {', '.join(p['stack'])}")
        for h in p["highlights"]:
            add(f"  * {h}")
        for lim in p.get("limitations", []):
            add(f"  limitation: {lim}")
        if p.get("github"):
            add(f"  github: {p['github']}")
        if p.get("live"):
            add(f"  live demo: {p['live']}")

    add("SKILLS:")
    for group, items in profile["skills"].items():
        add(f"- {group}: {', '.join(items)}")

    certs = profile.get("certifications", [])
    if certs:
        add("CERTIFICATIONS:")
        for cert in certs:
            when = cert.get("date", "")
            if cert.get("expires"):
                when += f", valid until {cert['expires']}"
            add(f"- {cert['name']} — {cert['issuer']} ({cert.get('kind', 'certificate')}, {when})")
            if cert.get("details"):
                add(f"  {cert['details']}")
            if cert.get("verifyUrl"):
                add(f"  verify: {cert['verifyUrl']}")

    vol = profile.get("volunteering", [])
    if vol:
        add("VOLUNTEERING / SOCIAL WORK:")
        for v in vol:
            period = f" ({v['period']})" if v.get("period") else ""
            add(f"- {v['role']}, {v['org']}{period}")
            if v.get("summary"):
                add(f"  {v['summary']}")
            for h in v.get("highlights", []):
                add(f"  * {h}")
            for photo in v.get("photos", []):
                if photo.get("caption"):
                    add(f"  photo: {photo['caption']}")

    add("ACHIEVEMENTS:")
    for a in profile["achievements"]:
        add(f"- {a}")
    add("LEADERSHIP:")
    for item in profile["leadership"]:
        add(f"- {item}")
    add(f"INTERESTS: {', '.join(profile['interests'])}")

    return "\n".join(lines)
