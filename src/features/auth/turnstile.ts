"use client";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  execute: (id: string) => void;
  reset: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  scriptLoading ??= new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = SCRIPT;
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error("Turnstile could not load"));
    document.head.appendChild(tag);
  });
  return scriptLoading;
}

// Token de Turnstile en modo invisible; sin site key configurada devuelve null.
export async function getTurnstileToken(container: HTMLElement | null): Promise<string | null> {
  if (!SITE_KEY || !container) return null;
  await loadScript();
  const turnstile = window.turnstile;
  if (!turnstile) return null;

  container.replaceChildren();
  return new Promise((resolve) => {
    const id = turnstile.render(container, {
      sitekey: SITE_KEY,
      execution: "execute",
      appearance: "interaction-only",
      callback: (token: string) => resolve(token),
      "error-callback": () => resolve(null),
    });
    turnstile.execute(id);
  });
}
