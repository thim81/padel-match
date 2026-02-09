import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

function isIosStandalonePwa() {
  const ua = window.navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return isIOS && isStandalone;
}

function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setVH();
setTimeout(setVH, 100);
setTimeout(setVH, 500);

window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', () => {
  setTimeout(setVH, 100);
  setTimeout(setVH, 500);
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(setVH, 100);
  }
});

if (isIosStandalonePwa()) {
  let hiddenAt = 0;
  let reloadTriggered = false;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      reloadTriggered = false;
      return;
    }

    setTimeout(setVH, 100);

    const backgroundDurationMs = hiddenAt ? Date.now() - hiddenAt : 0;
    if (!reloadTriggered && hiddenAt && backgroundDurationMs > 750) {
      reloadTriggered = true;
      window.location.reload();
    }
  });

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      window.location.reload();
    }
  });
}

window.addEventListener('appinstalled', () => {
  setTimeout(setVH, 100);
});

createRoot(document.getElementById("root")!).render(<App />);
