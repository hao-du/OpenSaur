type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      size?: "normal" | "flexible" | "compact";
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: (errorCode?: string) => void;
    }
  ) => string;
  reset: (widgetId?: string) => void;
};

type TurnstileWindow = Window & {
  turnstile?: TurnstileApi;
};

let scriptPromise: Promise<void> | null = null;

export function loadTurnstileScript(): Promise<void> {
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile="true"]');
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile script."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function renderTurnstile(
  container: HTMLElement,
  siteKey: string,
  onToken: (token: string) => void,
  onError: (errorCode?: string) => void
): string {
  const turnstileApi = (window as TurnstileWindow).turnstile;
  if (!turnstileApi) {
    throw new Error("Turnstile API is not available.");
  }

  return turnstileApi.render(container, {
    sitekey: siteKey,
    size: "flexible",
    callback: onToken,
    "expired-callback": () => onToken(""),
    "error-callback": onError
  });
}

export function resetTurnstile(widgetId?: string): void {
  (window as TurnstileWindow).turnstile?.reset(widgetId);
}
