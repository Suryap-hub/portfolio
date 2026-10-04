/**
 * Things the pages need instantly, before the backend has woken up.
 * Keep name, role and links in sync with backend/data/profile.json.
 */
export const site = {
  name: "Suryansh Pandey",
  nickname: "Surya",
  role: "Backend & AI Engineer",
  location: "New Delhi, India",
  // Put a square photo or memoji (transparent PNG looks best) at
  // frontend/public/avatar.png and change this to "/avatar.png".
  avatar: null as string | null,
  // Optional: a short looping memoji video (MP4/WebM with a white or transparent
  // background) at public/avatar.mp4, used on the landing page. e.g. "/avatar.mp4"
  avatarVideo: null as string | null,
  // The giant faded word behind the landing page.
  watermark: "Surya",
  email: "suryanshp991@gmail.com",
  github: "https://github.com/Suryap-hub",
  linkedin: "https://www.linkedin.com/in/suryansh-pandey-a58313288/",
  // Link to this portfolio's source code once it's on GitHub (shown in the info panel).
  repo: "",
};

export type QuickKey = "me" | "projects" | "skills" | "experience" | "certs" | "contact";

/** Which card a quick button shows straight away (no need for the AI to pick one). */
export type Intent =
  | "about"
  | "projects"
  | "skills"
  | "experience"
  | "contact"
  | "resume"
  | "certifications"
  | "volunteering";

/** The quick buttons under the input. */
export const quickQuestions: { key: QuickKey; label: string; question: string; intent: Intent }[] = [
  { key: "me", label: "Me", question: "Who are you? Tell me about yourself.", intent: "about" },
  { key: "projects", label: "Projects", question: "What projects have you built?", intent: "projects" },
  { key: "skills", label: "Skills", question: "What are your skills and tech stack?", intent: "skills" },
  {
    key: "experience",
    label: "Experience",
    question: "Tell me about your experience and education.",
    intent: "experience",
  },
  { key: "certs", label: "Certs", question: "What certifications do you have?", intent: "certifications" },
  { key: "contact", label: "Contact", question: "How can I contact you?", intent: "contact" },
];

/** Extra questions in the "More" menu. */
export const moreQuestions: { question: string; intent?: Intent }[] = [
  { question: "Can I see your resume?", intent: "resume" },
  { question: "What volunteering have you done with NSS?", intent: "volunteering" },
  { question: "Are you AWS certified?" },
  { question: "How did you prevent double spending in your FinTech system?" },
  { question: "What is Gita Mentor AI and how does it work?" },
  { question: "Are you open to internships?" },
  { question: "What are your achievements?" },
  { question: "Why should we hire you?" },
];

/**
 * Where the browser sends API calls.
 * Empty (the default): same origin, "/api/..." on this site, which Next.js
 * forwards to the backend (see next.config.ts). Works in every browser locally.
 * Set NEXT_PUBLIC_API_URL to your Render URL in production so each visitor's
 * real IP reaches the backend's rate limiter.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
