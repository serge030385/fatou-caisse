"use client";

import {
  CheckCircle2,
  Download,
  type LucideIcon,
  MonitorSmartphone,
  Share,
  Smartphone,
  SquarePlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GhostButton, Panel, PrimaryButton, StatusBadge } from "@/components/ui";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type DeviceKind = "android-chrome" | "iphone-safari" | "desktop" | "other-mobile";

export function PwaInstallCard() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [deviceKind, setDeviceKind] = useState<DeviceKind>("desktop");
  const [guideOpen, setGuideOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const initialStateTimer = window.setTimeout(() => {
      setInstalled(isStandaloneMode());
      setDeviceKind(detectDeviceKind());
    }, 0);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMessage("");
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setMessage("Application installée.");
    };

    const displayModeQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => setInstalled(isStandaloneMode());

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    displayModeQuery.addEventListener("change", onDisplayModeChange);

    return () => {
      window.clearTimeout(initialStateTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      displayModeQuery.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const deviceLabel = useMemo(() => {
    if (deviceKind === "android-chrome") {
      return "Android Chrome";
    }
    if (deviceKind === "iphone-safari") {
      return "iPhone Safari";
    }
    if (deviceKind === "other-mobile") {
      return "Téléphone";
    }
    return "Ordinateur";
  }, [deviceKind]);

  async function installApp() {
    if (installed) {
      setMessage("Fatou Caisse est déjà installée.");
      return;
    }

    if (deviceKind === "iphone-safari" || deviceKind === "other-mobile") {
      setGuideOpen(true);
      return;
    }

    if (!deferredPrompt) {
      setGuideOpen(true);
      setMessage("Si le prompt natif n'apparaît pas, utilise le menu du navigateur.");
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      setInstalled(true);
      setMessage("Installation lancée.");
    } else {
      setMessage("Installation annulée.");
    }
  }

  return (
    <>
      <Panel className="bg-[#fffaf5]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[1rem] bg-[var(--brand)] text-white shadow-sm">
              {installed ? <CheckCircle2 size={24} aria-hidden="true" /> : <Smartphone size={24} aria-hidden="true" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black">Application mobile</h2>
                <StatusBadge tone={installed ? "ok" : "warning"}>
                  {installed ? "Application installée" : "Installer"}
                </StatusBadge>
              </div>
              <p className="mt-1 text-sm font-bold leading-6 text-[var(--muted)]">
                Appareil détecté: {deviceLabel}. Fatou Caisse peut être ajoutée à
                l&apos;écran d&apos;accueil.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <PrimaryButton type="button" onClick={installApp} disabled={installed}>
            <span className="inline-flex items-center justify-center gap-2">
              {installed ? <CheckCircle2 size={20} aria-hidden="true" /> : <Download size={20} aria-hidden="true" />}
              {installed ? "Application installée" : "Installer l'application"}
            </span>
          </PrimaryButton>
          {message ? (
            <p className="text-center text-sm font-black text-[var(--brand-strong)]">{message}</p>
          ) : null}
        </div>
      </Panel>

      {guideOpen ? (
        <InstallGuideModal
          deviceKind={deviceKind}
          canUseNativePrompt={Boolean(deferredPrompt)}
          onClose={() => setGuideOpen(false)}
        />
      ) : null}
    </>
  );
}

function InstallGuideModal({
  deviceKind,
  canUseNativePrompt,
  onClose,
}: {
  deviceKind: DeviceKind;
  canUseNativePrompt: boolean;
  onClose: () => void;
}) {
  const isIphone = deviceKind === "iphone-safari" || deviceKind === "other-mobile";

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/45 px-3 pb-3 backdrop-blur-sm sm:place-items-center">
      <div className="w-full max-w-md rounded-[1.25rem] bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--brand)]">
              Installation
            </p>
            <h2 className="mt-1 text-xl font-black">Ajouter Fatou Caisse</h2>
          </div>
          <GhostButton type="button" onClick={onClose} aria-label="Fermer">
            <X size={19} aria-hidden="true" />
          </GhostButton>
        </div>

        {isIphone ? (
          <div className="space-y-3">
            <InstructionStep icon={MonitorSmartphone} title="Ouvrir dans Safari" />
            <InstructionStep icon={Share} title="Partager" />
            <InstructionStep icon={SquarePlus} title="Ajouter à l'écran d'accueil" />
            <p className="rounded-[1rem] bg-[#fff1d7] p-3 text-sm font-black leading-6 text-[#8a5605]">
              {"Ouvrir dans Safari → Partager → Ajouter à l'écran d'accueil"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <InstructionStep icon={Download} title="Utilise le menu du navigateur" />
            <InstructionStep icon={SquarePlus} title="Installer ou Ajouter à l'écran d'accueil" />
            <p className="rounded-[1rem] bg-[#eef7f3] p-3 text-sm font-black leading-6 text-[var(--leaf)]">
              {canUseNativePrompt
                ? "Le prompt natif est prêt. Ferme cette fenêtre et appuie sur Installer l'application."
                : "Sur Chrome ou Edge, ouvre le menu puis choisis Installer l'application."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InstructionStep({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1rem] border border-[var(--line)] bg-[#fffaf5] p-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--rose)] text-[var(--brand)]">
        <Icon size={20} aria-hidden="true" />
      </div>
      <p className="font-black">{title}</p>
    </div>
  );
}

function detectDeviceKind(): DeviceKind {
  const userAgent = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);
  const isChrome = /Chrome|CriOS/i.test(userAgent) && !/Edg|OPR|SamsungBrowser/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|Chrome|Android/i.test(userAgent);

  if (isIos && isSafari) {
    return "iphone-safari";
  }
  if (isIos) {
    return "other-mobile";
  }
  if (isAndroid && isChrome) {
    return "android-chrome";
  }
  if (isAndroid) {
    return "other-mobile";
  }
  return "desktop";
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}
