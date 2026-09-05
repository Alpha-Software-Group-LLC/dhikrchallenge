import { useEffect, useState } from "react";
import { Link } from "@/components/router";
import { Button, IconBack } from "@/components/ui";
import { Brand } from "@/components/shell";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function useInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
  useEffect(() => {
    const capture = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setPrompt(null);
  };
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return { prompt, installed, install, isIOS };
}

export function InstallCard() {
  const { prompt, installed, install, isIOS } = useInstall();
  return (
    <div className="card">
      <div className="eyebrow">On your phone</div>
      {installed ? (
        <div className="small" style={{ color: "var(--text2)" }}>
          Installed. Dhikr Challenge opens from your home screen and keeps working offline.
        </div>
      ) : (
        <>
          <div className="small" style={{ color: "var(--text2)", lineHeight: 1.6 }}>
            {isIOS ? "On iPhone or iPad: open the Share menu in Safari and choose “Add to Home Screen”." : prompt ? "Install Dhikr Challenge for a full-screen, offline-ready experience." : "Use your browser's Install or “Add to Home Screen” option for a full-screen, offline-ready experience."}
          </div>
          {prompt && (
            <div style={{ marginTop: 12 }}>
              <Button size="sm" variant="secondary" onClick={install}>
                Install app
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function InstallPage() {
  return (
    <div className="page page-public">
      <div className="top-bar">
        <Brand />
        <Link to="/" className="back-link">
          <IconBack /> Home
        </Link>
      </div>
      <header className="page-header anim-up">
        <div className="eyebrow">Install</div>
        <h1>Keep it close.</h1>
        <p>Dhikr Challenge is a web app that installs on any phone, tablet or computer. One account, every device, offline-ready.</p>
      </header>
      <div className="stack anim-up d1">
        <InstallCard />
        <div className="card">
          <div className="eyebrow">What installing gives you</div>
          <ul className="small" style={{ color: "var(--text2)", paddingLeft: 18, lineHeight: 1.8 }}>
            <li>A home-screen icon and full-screen practice, without browser chrome.</li>
            <li>Sessions that finish even when the connection drops; they sync when you're back.</li>
            <li>Gentle reminders in the windows you choose, while the app is open.</li>
          </ul>
        </div>
        <div className="card quiet">
          <div className="eyebrow">Native apps</div>
          <div className="small" style={{ color: "var(--text2)", lineHeight: 1.6 }}>
            Native iOS, Android and desktop builds are in development. Until then the installed web app is the recommended way to practise, and your account will carry over.
          </div>
        </div>
      </div>
    </div>
  );
}
