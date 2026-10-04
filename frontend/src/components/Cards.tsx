"use client";

import {
  ArrowUpRight,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Code,
  Copy,
  Database,
  Download,
  FileText,
  Layers,
  MapPin,
  MessageCircle,
  Server,
  Trophy,
  Users,
  Wrench,
  Briefcase,
  GraduationCap,
  Mail,
} from "lucide-react";
import { useRef, useState } from "react";
import type {
  AboutData,
  Card,
  ContactData,
  ExperienceData,
  ProjectDetail,
  ProjectSummary,
} from "@/lib/types";
import { site } from "@/lib/site";
import { Avatar } from "./Avatar";
import { Dialog } from "./Dialog";

/* ---------------------------------------------------------------------------
   Project look: every project gets its own gradient and category icon, so the
   carousel reads like a row of cover art even without screenshots.
--------------------------------------------------------------------------- */

const GRADIENTS = [
  "from-zinc-900 via-zinc-800 to-zinc-600",
  "from-indigo-700 via-violet-600 to-fuchsia-500",
  "from-emerald-700 via-teal-600 to-cyan-500",
  "from-orange-600 via-rose-500 to-pink-500",
  "from-sky-700 via-blue-600 to-indigo-500",
  "from-amber-600 via-orange-500 to-red-500",
  "from-slate-800 via-slate-700 to-sky-700",
  "from-fuchsia-700 via-purple-600 to-indigo-600",
];

function gradientFor(id: string) {
  let h = 1; // seed chosen so the current projects all get different colours
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

const CATEGORY = {
  backend: { label: "Backend", Icon: Server },
  ai: { label: "AI", Icon: Brain },
  fullstack: { label: "Full-stack", Icon: Layers },
} as const;

function StatusDot({ status, light = false }: { status: string; light?: boolean }) {
  const color = status === "Live" ? "bg-emerald-400" : status === "In progress" ? "bg-amber-400" : "bg-sky-400";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${light ? "text-white/85" : "text-muted"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {status}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[1.65rem] leading-tight font-bold tracking-tight sm:text-3xl">{children}</h2>;
}

/* ---------------------------------------------------------------------------
   Projects carousel
--------------------------------------------------------------------------- */

export function ProjectsCarousel({
  projects,
  category,
  onAsk,
}: {
  projects: ProjectDetail[];
  category?: string;
  onAsk?: (q: string) => void;
}) {
  const rail = useRef<HTMLUListElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  const title =
    category && category !== "all"
      ? `My ${CATEGORY[category as keyof typeof CATEGORY]?.label ?? ""} Projects`
      : "My Projects";

  const current = projects.find((p) => p.id === openId);

  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      {projects.length === 0 ? (
        <p className="mt-3 text-muted">Nothing in this category yet.</p>
      ) : (
        <>
          <ul
            ref={rail}
            className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
          >
            {projects.map((p) => (
              <li key={p.id} className="snap-start">
                <ProjectTile project={p} onOpen={() => setOpenId(p.id)} />
              </li>
            ))}
          </ul>
          {projects.length > 2 && (
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => scroll(-1)}
                aria-label="Previous projects"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-muted hover:text-fg"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                aria-label="Next projects"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-fg hover:bg-border"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!current} onClose={() => setOpenId(null)} label={current?.title ?? "Project"} wide>
        {current && (
          <ProjectBody
            project={{ ...current, highlights: current.highlights ?? [], limitations: current.limitations ?? [] }}
            onAsk={
              onAsk
                ? (q) => {
                    setOpenId(null);
                    onAsk(q);
                  }
                : undefined
            }
          />
        )}
      </Dialog>
    </section>
  );
}

function ProjectTile({ project, onOpen }: { project: ProjectSummary; onOpen: () => void }) {
  const { label, Icon } = CATEGORY[project.category];
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative flex h-[300px] w-[230px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-br p-5 text-left text-white shadow-soft transition-transform duration-300 hover:-translate-y-1 sm:h-[320px] sm:w-[250px] ${gradientFor(project.id)}`}
    >
      <span className="text-sm font-medium text-white/75">
        {label} project{project.featured ? " · Featured" : ""}
      </span>
      <span className="mt-1 text-2xl leading-tight font-bold tracking-tight">{project.title}</span>
      <Icon
        aria-hidden="true"
        strokeWidth={1.2}
        className="absolute -right-6 -bottom-6 h-40 w-40 text-white/15 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6"
      />
      <span className="mt-auto flex flex-col gap-3">
        <span className="flex flex-wrap gap-1.5">
          {project.stack.slice(0, 3).map((s) => (
            <span key={s} className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
              {s}
            </span>
          ))}
        </span>
        <span className="flex items-center justify-between">
          <StatusDot status={project.status} light />
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur transition-colors group-hover:bg-white group-hover:text-black">
            <ArrowUpRight size={16} />
          </span>
        </span>
      </span>
    </button>
  );
}

/** Shared by the project modal, the single-project card and the classic view. */
export function ProjectBody({
  project,
  onAsk,
  headingLevel = "h2",
}: {
  project: ProjectDetail;
  onAsk?: (q: string) => void;
  headingLevel?: "h2" | "h3";
}) {
  const { label, Icon } = CATEGORY[project.category];
  const Heading = headingLevel;
  return (
    <article>
      <header className={`relative overflow-hidden bg-gradient-to-br px-6 pt-8 pb-7 text-white ${gradientFor(project.id)}`}>
        <Icon aria-hidden="true" strokeWidth={1.2} className="absolute -right-4 -bottom-8 h-44 w-44 text-white/15" />
        <p className="text-sm font-medium text-white/75">{label} project</p>
        <Heading className="mt-1 max-w-[85%] text-3xl leading-tight font-bold tracking-tight">{project.title}</Heading>
        <div className="mt-3">
          <StatusDot status={project.status} light />
        </div>
      </header>

      <div className="space-y-5 px-6 py-6">
        <p className="text-[1.02rem]">{project.summary}</p>

        {project.highlights.length > 0 && (
          <div>
            <p className="text-sm font-semibold">Highlights</p>
            <ul className="mt-2 space-y-2">
              {project.highlights.map((h) => (
                <li key={h} className="flex gap-2.5 text-[0.95rem]">
                  <Check size={17} className="mt-[3px] shrink-0 text-emerald-500" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {project.limitations.length > 0 && (
          <div className="rounded-2xl bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Known limitations</p>
            <ul className="mt-1.5 space-y-1 text-sm text-muted">
              {project.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold">Tech stack</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {project.stack.map((s) => (
              <li key={s} className="rounded-md bg-pill px-2.5 py-1 text-xs font-medium text-pill-fg">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Live demo <ArrowUpRight size={15} />
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-pill px-4 py-2 text-sm font-medium text-pill-fg"
            >
              <Code size={15} /> Source code
            </a>
          )}
          {onAsk && (
            <button
              type="button"
              onClick={() => onAsk(`Tell me more about ${project.title}. What was the hardest part?`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              <MessageCircle size={15} /> Ask about this
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ProjectCard({ project, onAsk }: { project: ProjectDetail; onAsk?: (q: string) => void }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
      <ProjectBody project={project} onAsk={onAsk} headingLevel="h3" />
    </div>
  );
}

/* ---------------------------------------------------------------------------
   About me
--------------------------------------------------------------------------- */

export function AboutCard({ data }: { data: AboutData }) {
  return (
    <section className="grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-start">
      <div className="relative mx-auto flex aspect-square w-48 items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-sky-100 to-blue-200 sm:w-full dark:from-sky-950 dark:to-indigo-950">
        <Avatar size={site.avatar ? 240 : 132} className={site.avatar ? "h-full! w-full! rounded-none!" : ""} />
      </div>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{data.name}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-muted">
          <span>{data.role}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} /> {data.location}
          </span>
        </p>
        <div className="mt-4 space-y-2 text-[0.97rem]">
          <p>Hey 👋</p>
          {data.bio.slice(0, 2).map((b) => (
            <p key={b}>{b}</p>
          ))}
        </div>
        {data.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {data.tags.map((t) => (
              <li key={t} className="rounded-full bg-surface-2 px-3 py-1 text-sm">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Skills
--------------------------------------------------------------------------- */

const SKILL_ICONS: [RegExp, typeof Code][] = [
  [/language/i, Code],
  [/backend/i, Server],
  [/data|messag/i, Database],
  [/ai|ml/i, Brain],
  [/front/i, Layers],
  [/devops|test|tool/i, Wrench],
];

export function SkillsCard({ skills }: { skills: Record<string, string[]> }) {
  return (
    <section>
      <SectionTitle>Skills &amp; Expertise</SectionTitle>
      <div className="mt-5 space-y-5">
        {Object.entries(skills).map(([group, items]) => {
          const Icon = SKILL_ICONS.find(([re]) => re.test(group))?.[1] ?? Code;
          return (
            <div key={group}>
              <h3 className="flex items-center gap-2 font-semibold">
                <Icon size={17} /> {group}
              </h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {items.map((s) => (
                  <li key={s} className="rounded-md bg-pill px-2.5 py-1 text-xs font-medium text-pill-fg">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Experience (a real timeline, so the sequence markers mean something)
--------------------------------------------------------------------------- */

export function ExperienceCard({ data }: { data: ExperienceData }) {
  return (
    <section>
      <SectionTitle>Experience</SectionTitle>
      <ol className="mt-5 space-y-3">
        {data.experience.map((x) => (
          <li key={x.company} className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2">
              <Briefcase size={19} className="text-emerald-600 dark:text-emerald-400" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{x.role}</p>
              <p className="text-sm text-muted">
                {x.company} · {x.period}
              </p>
              {x.highlights.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.95rem]">
                  {x.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
        {data.education.map((e) => (
          <li key={e.school} className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2">
              <GraduationCap size={19} className="text-pink-500" />
            </span>
            <div>
              <p className="font-semibold">{e.degree}</p>
              <p className="text-sm text-muted">
                {e.school} · {e.period}
                {e.details ? ` · ${e.details}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {(data.achievements.length > 0 || data.leadership.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.achievements.length > 0 && (
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Trophy size={16} className="text-amber-500" /> Achievements
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {data.achievements.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {data.leadership.length > 0 && (
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Users size={16} className="text-violet-500" /> Leadership
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {data.leadership.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Contact & resume
--------------------------------------------------------------------------- */

export function ContactCard({ data }: { data: ContactData }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the mailto link still works */
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex items-center gap-3">
        <Avatar size={48} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{site.name}</p>
          <p className="flex items-center gap-1 text-sm text-muted">
            <MapPin size={13} /> {data.location}
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Open to work
        </span>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-surface-2 py-2 pr-2 pl-4">
        <Mail size={17} className="shrink-0 text-muted" />
        <a href={`mailto:${data.email}`} className="min-w-0 flex-1 truncate font-medium">
          {data.email}
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-sm font-medium shadow-sm hover:bg-bg"
        >
          {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a
          href={data.linkedin}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 font-medium hover:bg-surface-2"
        >
          LinkedIn <ArrowUpRight size={17} className="text-muted" />
        </a>
        <a
          href={data.github}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 font-medium hover:bg-surface-2"
        >
          GitHub <ArrowUpRight size={17} className="text-muted" />
        </a>
      </div>
    </section>
  );
}

export function ResumeCard({ url, name }: { url: string; name: string }) {
  return (
    <section className="flex items-center gap-4 rounded-3xl border border-border bg-surface p-5 shadow-soft">
      <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
        <FileText size={24} className="text-red-500" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{name}, Resume</p>
        <p className="text-sm text-muted">PDF · updated regularly</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2 sm:inline-flex"
        >
          View
        </a>
        <a
          href={url}
          download
          className="inline-flex items-center gap-1.5 rounded-full bg-pill px-4 py-2 text-sm font-medium text-pill-fg"
        >
          <Download size={15} /> Download
        </a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Dispatcher used by the chat
--------------------------------------------------------------------------- */

export function CardView({ card, onAsk }: { card: Card; onAsk?: (q: string) => void }) {
  switch (card.type) {
    case "about":
      return <AboutCard data={card} />;
    case "projects":
      return <ProjectsCarousel projects={card.projects} category={card.category} onAsk={onAsk} />;
    case "project":
      return <ProjectCard project={card.project} onAsk={onAsk} />;
    case "skills":
      return <SkillsCard skills={card.skills} />;
    case "experience":
      return <ExperienceCard data={card} />;
    case "contact":
      return <ContactCard data={card} />;
    case "resume":
      return <ResumeCard url={card.url} name={card.name} />;
    default:
      return null;
  }
}
