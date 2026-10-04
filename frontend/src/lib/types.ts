export type Role = "user" | "assistant";

export type ProjectSummary = {
  id: string;
  title: string;
  category: "backend" | "ai" | "fullstack";
  status: string;
  summary: string;
  stack: string[];
  github: string;
  live: string;
  featured: boolean;
};

export type ProjectDetail = ProjectSummary & {
  highlights: string[];
  limitations: string[];
};

export type Experience = { company: string; role: string; period: string; highlights: string[] };
export type Education = { school: string; degree: string; period: string; details: string };

export type AboutData = {
  name: string;
  nickname: string;
  role: string;
  location: string;
  status: string;
  bio: string[];
  tags: string[];
};

export type ExperienceData = {
  experience: Experience[];
  education: Education[];
  leadership: string[];
  achievements: string[];
};

export type ContactData = { email: string; linkedin: string; github: string; location: string };

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  kind: string;
  date: string;
  expires?: string;
  details?: string;
  /** Full-size image: a certificate scan, or a square badge. */
  image: string;
  /** Smaller version for the grid (optional; falls back to image). */
  thumb?: string;
  imageKind: "certificate" | "badge";
  verifyUrl: string;
  featured?: boolean;
};

export type Photo = { src: string; caption?: string };

export type Volunteering = {
  id: string;
  org: string;
  role: string;
  period: string;
  summary?: string;
  highlights: string[];
  photos: Photo[];
};

export type Card =
  | ({ type: "about" } & AboutData)
  | { type: "projects"; category: string; projects: ProjectDetail[] }
  | { type: "project"; project: ProjectDetail }
  | { type: "skills"; skills: Record<string, string[]> }
  | ({ type: "experience" } & ExperienceData)
  | ({ type: "contact" } & ContactData)
  | { type: "resume"; url: string; name: string }
  | { type: "certifications"; certifications: Certification[] }
  | { type: "volunteering"; volunteering: Volunteering[] };

export type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "card"; card: Card }
  | { type: "error"; message: string }
  | { type: "done" };

export type ChatMessage = {
  id: string;
  role: Role;
  text: string;
  cards: Card[];
  error?: string;
  pending?: boolean;
  stopped?: boolean;
  /** Quick-button intent the question was sent with (kept so "Try again" resends it). */
  intent?: string;
};

export type Profile = {
  name: string;
  nickname: string;
  role: string;
  headline: string;
  location: string;
  status: string;
  bio: string[];
  tags: string[];
  contact: { email: string; linkedin: string; github: string; resume: string };
  education: Education[];
  experience: Experience[];
  projects: ProjectDetail[];
  skills: Record<string, string[]>;
  achievements: string[];
  leadership: string[];
  certifications?: Certification[];
  volunteering?: Volunteering[];
  interests: string[];
};
