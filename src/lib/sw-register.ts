export function registerServiceWorker(): void {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          "/chronos_history/sw.js",
          {
            scope: "/chronos_history/",
          },
        );
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "activated") {
                if (navigator.serviceWorker.controller) {
                  window.dispatchEvent(new CustomEvent("sw-update-available"));
                }
              }
            });
          }
        });
      } catch (error) {
        console.error("SW registration failed:", error);
      }
    });
  }
}

export function unregisterServiceWorker(): Promise<boolean> {
  if ("serviceWorker" in navigator) {
    return navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        return registration.unregister();
      }
      return false;
    });
  }
  return Promise.resolve(false);
}
