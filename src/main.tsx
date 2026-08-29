import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import React from 'react'
import { Capacitor } from '@capacitor/core'

// Simple App Launcher
function startApp() {
  // ── Capacitor Keyboard: prevent the "layout explosion" on iOS ──
  // When the native keyboard slides up, WebKit would normally shrink
  // window.innerHeight and collapse every flex container. Setting
  // KeyboardResize.None tells Capacitor to keep the WebView at full
  // height and let the keyboard overlay. We then enable natural scroll
  // so the focused input is scrolled into view without layout breakage.
  if (Capacitor.isNativePlatform()) {
    import('@capacitor/keyboard').then(({ Keyboard, KeyboardResize }) => {
      Keyboard.setResizeMode({ mode: KeyboardResize.None })
      Keyboard.setScroll({ isDisabled: false })
    }).catch(() => {
      // Keyboard plugin not installed — degrades gracefully
    })
  }

  const rootElement = document.getElementById("app-shell")!;
  const root = createRoot(rootElement);
  
  root.render(
    import.meta.env.DEV ? (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    ) : (
      <App />
    )
  );
}

// Start when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
