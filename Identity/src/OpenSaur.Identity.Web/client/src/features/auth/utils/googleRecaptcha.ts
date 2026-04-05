type GoogleRecaptchaApi = {
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
  ready: (callback: () => void) => void;
};

declare global {
  interface Window {
    grecaptcha?: GoogleRecaptchaApi;
  }
}

const scriptId = "google-recaptcha-v3";
let loadedSiteKey: string | null = null;
let scriptPromise: Promise<void> | null = null;

function buildGoogleRecaptchaScriptUrl(siteKey: string) {
  const scriptUrl = new URL("https://www.google.com/recaptcha/api.js");
  scriptUrl.searchParams.set("render", siteKey);
  return scriptUrl.toString();
}

function loadGoogleRecaptchaScript(siteKey: string) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return Promise.reject(new Error("Google reCAPTCHA is only available in the browser."));
  }

  if (scriptPromise && loadedSiteKey === siteKey) {
    return scriptPromise;
  }

  const existingScript = document.getElementById(scriptId);
  if (existingScript) {
    existingScript.remove();
  }

  loadedSiteKey = siteKey;
  delete window.grecaptcha;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.src = buildGoogleRecaptchaScriptUrl(siteKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google reCAPTCHA could not be loaded."));
    document.head.append(script);
  });

  return scriptPromise;
}

export function prefetchGoogleRecaptcha(siteKey: string) {
  if (siteKey.trim().length === 0) {
    return;
  }

  void loadGoogleRecaptchaScript(siteKey);
}

export async function executeGoogleRecaptchaAction(siteKey: string, action: string) {
  if (siteKey.trim().length === 0) {
    throw new Error("Google reCAPTCHA site key is missing.");
  }

  await loadGoogleRecaptchaScript(siteKey);

  return await new Promise<string>((resolve, reject) => {
    const googleRecaptcha = window.grecaptcha;
    if (!googleRecaptcha) {
      reject(new Error("Google reCAPTCHA is unavailable."));
      return;
    }

    googleRecaptcha.ready(() => {
      googleRecaptcha.execute(siteKey, { action }).then(resolve, reject);
    });
  });
}
