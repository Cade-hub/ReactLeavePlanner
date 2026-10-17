import { useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");
  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("lp-theme", next); } catch { /* private mode */ }
    setTheme(next);
  };
  return (
    <button type="button" className="theme" onClick={flip} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className={theme}>
        <circle className="disc" cx="12" cy="12" r="5" />
        <g className="rays">{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${a} 12 12)`} />)}</g>
        <circle className="bite" cx="16" cy="9" r="4.2" />
      </svg>
    </button>
  );
}
