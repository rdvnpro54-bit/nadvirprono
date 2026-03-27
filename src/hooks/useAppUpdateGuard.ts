import { useEffect, useRef } from "react";

const VOLATILE_CACHE_KEYS = [
  "pronosia_matches_cache_v3",
  "pronosia_matches_ts_v3",
  "pronosia_matches_cache_v4",
  "pronosia_matches_ts_v4",
];

function extractAssetPathsFromDocument(doc: Document): string[] {
  return Array.from(doc.querySelectorAll("script[src], link[rel='modulepreload'][href]"))
    .map((node) => node.getAttribute("src") ?? node.getAttribute("href") ?? "")
    .filter(Boolean)
    .map((path) => new URL(path, window.location.origin).pathname)
    .sort();
}

function clearVolatileCaches() {
  for (const key of VOLATILE_CACHE_KEYS) {
    localStorage.removeItem(key);
  }
}

export function useAppUpdateGuard() {
  const checkingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const checkForAppUpdate = async () => {
      if (cancelled || checkingRef.current) return;
      checkingRef.current = true;

      try {
        const response = await fetch(`/?shell-check=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "cache-control": "no-cache",
            pragma: "no-cache",
          },
        });

        if (!response.ok) return;

        const html = await response.text();
        const nextDoc = new DOMParser().parseFromString(html, "text/html");
        const currentAssets = extractAssetPathsFromDocument(document);
        const nextAssets = extractAssetPathsFromDocument(nextDoc);

        if (currentAssets.length === 0 || nextAssets.length === 0) return;

        const hasUpdate = currentAssets.join("|") !== nextAssets.join("|");
        if (!hasUpdate) return;

        clearVolatileCaches();

        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("app-updated", Date.now().toString());
        window.location.replace(nextUrl.toString());
      } catch (error) {
        console.warn("[app-update] Vérification impossible", error);
      } finally {
        checkingRef.current = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void checkForAppUpdate();
      }
    };

    const onFocus = () => {
      void checkForAppUpdate();
    };

    void checkForAppUpdate();

    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    window.addEventListener("online", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    const interval = window.setInterval(() => {
      void checkForAppUpdate();
    }, 180000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      window.removeEventListener("online", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, []);
}