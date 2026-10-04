"use client";

import { useEffect, useState } from "react";
import {
  AboutCard,
  ContactCard,
  ExperienceCard,
  ProjectBody,
  ResumeCard,
  SkillsCard,
} from "@/components/Cards";
import { InfoButton, SwitchPill } from "@/components/HeaderBits";
import { fetchProfile } from "@/lib/api";
import type { Profile } from "@/lib/types";

/** Everything on one scrollable page, for visitors who'd rather not chat. */
export function ClassicView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => setSlow(true), 4000);
    setError(false);
    fetchProfile(controller.signal)
      .then(setProfile)
      .catch(() => !controller.signal.aborted && setError(true))
      .finally(() => clearTimeout(timer));
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [attempt]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <SwitchPill to="chat" />
          <InfoButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-6">
        {!profile && !error && (
          <div className="pt-20 text-center text-muted" role="status">
            <span className="dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <p className="mt-3">Loading the portfolio…</p>
            {slow && (
              <p className="mt-1 text-sm">
                The server sleeps when nobody&apos;s visiting, so this can take up to a minute the first time.
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="pt-20 text-center">
            <p>The portfolio data couldn&apos;t load. The server may still be waking up.</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-4 rounded-full bg-pill px-5 py-2 text-sm font-medium text-pill-fg"
            >
              Try again
            </button>
          </div>
        )}

        {profile && (
          <div className="appear space-y-16 pt-8">
            <AboutCard data={profile} />

            <section>
              <h2 className="text-[1.65rem] font-bold tracking-tight sm:text-3xl">Projects</h2>
              <div className="mt-5 space-y-5">
                {profile.projects.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
                    <ProjectBody project={p} headingLevel="h3" />
                  </div>
                ))}
              </div>
            </section>

            <ExperienceCard data={profile} />
            <SkillsCard skills={profile.skills} />

            <section className="space-y-4">
              <h2 className="text-[1.65rem] font-bold tracking-tight sm:text-3xl">Get in touch</h2>
              <ContactCard
                data={{
                  email: profile.contact.email,
                  linkedin: profile.contact.linkedin,
                  github: profile.contact.github,
                  location: profile.location,
                }}
              />
              <ResumeCard url={profile.contact.resume} name={profile.name} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
