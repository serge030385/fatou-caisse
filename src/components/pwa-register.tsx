"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    const canRegister =
      "serviceWorker" in navigator &&
      (window.location.protocol === "https:" || window.location.hostname === "localhost");

    if (canRegister) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Installation remains possible through the manifest even if SW registration fails.
      });
    }
  }, []);

  return null;
}
