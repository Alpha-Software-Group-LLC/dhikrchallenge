import { useStore } from "@/data/store";
import { Link, useRouter } from "@/components/router";
import { Arabic, Button, SourceChip } from "@/components/ui";
import { ADHKAR_BY_ID, STRONGER_HEART } from "@/content";
import { Brand } from "@/components/shell";
import { track } from "@/lib/analytics";

export function LandingPage() {
  const { beginAsGuest, accountsAvailable } = useStore();
  const { navigate } = useRouter();
  const subhan = ADHKAR_BY_ID.subhanallah!;

  const begin = () => {
    track("onboarding_started", { from: "landing" });
    beginAsGuest();
    navigate("/");
  };

  return (
    <div className="page page-public">
      <div className="top-bar anim-up">
        <Brand />
        <div className="row">
          {accountsAvailable && (
            <Link to="/signin" className="btn quiet sm">
              Sign in
            </Link>
          )}
        </div>
      </div>

      <section className="hero anim-up d1">
        <div className="bismillah" lang="ar">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </div>
        <h1>
          Remember Allah.
          <br />
          <em>Together.</em>
        </h1>
        <p>Dhikr Challenge helps you build a daily practice of remembrance, understand what you are saying, and encourage the people you love to remember Allah with you.</p>
        <div className="cta">
          <Button size="lg" onClick={begin}>
            Begin the 30-Day Challenge
          </Button>
          <Button size="lg" variant="quiet" onClick={() => (accountsAvailable ? navigate("/signup") : begin())}>
            Create a Circle
          </Button>
        </div>
        <p className="small muted" style={{ marginTop: 14 }}>
          Free. Private by default. No account needed to begin.
        </p>
      </section>

      <section className="steps anim-up d2" aria-label="How it works">
        {[
          ["01", "Remember", "A few focused minutes every day. One dhikr, one target, one quiet screen."],
          ["02", "Understand", "Learn the meaning and the source behind each dhikr, word by word."],
          ["03", "Grow", "Watch consistency and understanding develop over thirty days, without shame or scores."],
          ["04", "Remember Together", "Create a private Circle with family and friends. The group is what's shown, never a leaderboard."],
        ].map(([n, t, p]) => (
          <div key={n} className="step">
            <div className="num" aria-hidden="true">
              {n}
            </div>
            <div>
              <h3>{t}</h3>
              <p>{p}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="landing-section anim-up d3">
        <div className="eyebrow">The journey</div>
        <h2 className="section-title">{STRONGER_HEART.title}</h2>
        <p className="body-text" style={{ color: "var(--text2)", marginBottom: 18 }}>
          {STRONGER_HEART.description}
        </p>
        <div className="stack">
          {STRONGER_HEART.weeks.map((w) => (
            <div key={w.number} className="card" style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div className="serif" style={{ fontSize: 30, color: "var(--gold)", minWidth: 44 }}>
                {w.number}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>
                  Week {w.number} · {w.title}
                </div>
                <div className="small" style={{ color: "var(--text2)" }}>
                  {w.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section anim-up d3">
        <div className="eyebrow">Day 1 looks like this</div>
        <div className="demo-card">
          <div className="row between">
            <span className="eyebrow" style={{ marginBottom: 0 }}>
              Day 1 · Remember
            </span>
            <SourceChip source={subhan.source} compact />
          </div>
          <div style={{ padding: "14px 0 4px" }}>
            <Arabic text={subhan.arabic} size={40} color="var(--text)" />
          </div>
          <div className="serif" style={{ textAlign: "center", fontStyle: "italic", color: "var(--gold2)", fontSize: 19 }}>
            {subhan.transliteration}
          </div>
          <p style={{ textAlign: "center", color: "var(--text2)", marginTop: 6 }}>{subhan.translation}</p>
          <p className="small muted" style={{ textAlign: "center", marginTop: 8 }}>
            33× · about 2 minutes
          </p>
          <div style={{ marginTop: 16 }}>
            <Button block size="lg" onClick={begin}>
              Begin Dhikr
            </Button>
          </div>
          <p className="small muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
            Afterwards: <em>Learn what you just said.</em> Subhan means far removed from every imperfection. Then one question, and one private reflection.
          </p>
        </div>
      </section>

      <section className="landing-section anim-up d4">
        <div className="eyebrow">Circles</div>
        <h2 className="section-title">A small halaqah in your pocket.</h2>
        <div className="card raised gold">
          <div className="card-title">Qureshi Family</div>
          <div className="card-note">Remember Allah together every day.</div>
          <div style={{ fontWeight: 600, marginTop: 14 }}>6 of 8 remembered Allah today</div>
          <div className="member-dots" style={{ marginTop: 8 }} aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <i key={i} className={i < 6 ? "on" : ""} />
            ))}
          </div>
          <div className="small muted" style={{ marginTop: 12, lineHeight: 1.7 }}>
            “Ahmed completed Day 12.” · “Maryam learned the meaning of Al-Wakil.” · “Your Circle remembered together today.”
          </div>
          <div className="grid-2" style={{ marginTop: 14 }}>
            <span className="btn secondary sm" aria-hidden="true">
              Continue our dhikr
            </span>
            <span className="btn quiet sm" aria-hidden="true">
              Encourage
            </span>
          </div>
        </div>
        <p className="body-text" style={{ color: "var(--text2)", marginTop: 14 }}>
          Invite-only. No followers, no likes, no public totals. Encouragement is a du'a, not a notification storm.
        </p>
      </section>

      <section className="landing-section anim-up d4">
        <div className="eyebrow">Authenticity</div>
        <h2 className="section-title">Every dhikr has a source path.</h2>
        <p className="body-text" style={{ color: "var(--text2)" }}>
          Qur'an by surah and ayah. Hadith by collection and number, with grading where it is known. No invented virtues, no hasanat calculators, no AI-written rulings. Where a grading is uncertain, we say so.
        </p>
      </section>

      <section className="landing-section anim-up d4">
        <div className="eyebrow">Privacy</div>
        <h2 className="section-title">Privacy is an amanah.</h2>
        <ul className="body-text" style={{ color: "var(--text2)", paddingLeft: 20 }}>
          <li>Private by default; you choose what a Circle sees.</li>
          <li>No ads, no selling of worship data, no contact uploads.</li>
          <li>Export or delete everything, any time.</li>
          <li>Enforced in the database, not only in the interface.</li>
        </ul>
      </section>

      <section className="card raised gold anim-up d4" style={{ textAlign: "center", padding: 28 }}>
        <Arabic text="فَٱذْكُرُونِىٓ أَذْكُرْكُمْ" size={30} color="var(--gold)" />
        <div className="small muted" style={{ marginTop: 6, marginBottom: 18 }}>
          Remember Me; I will remember you. · Qur'an 2:152
        </div>
        <Button size="lg" onClick={begin}>
          Begin Day 1
        </Button>
      </section>

      <footer className="site-footer">
        <div>
          Dhikr Challenge · {new Date().getFullYear()} · <Link to="/platforms">Install the app</Link>
        </div>
        <div>Arabic recordings by Hamad Al-Duraim (MIT licence). The challenge ends. The remembrance doesn't.</div>
      </footer>
    </div>
  );
}
