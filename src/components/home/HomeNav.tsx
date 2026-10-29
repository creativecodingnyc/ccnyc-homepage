import type { CSSProperties } from "react";

// the label is split into blocks for the hover effect; screen readers get it whole
const segments = (parts: Array<[string, number]>) => parts.map(([text, offset], index) => (
  <span className="b" style={{ "--o": offset } as CSSProperties} key={`${text}-${index}`} aria-hidden="true">{text}</span>
));
const label = (text: string) => <span className="sr-only">{text}</span>;

export default function HomeNav() {
  return (
    <header className="topbar" id="topbar">
      <button type="button" className="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="menuPanel">menu</button>
      <nav className="menu-panel" id="menuPanel" hidden aria-label="Menu">
        <ul className="links">
          <li><a href="/?panel=about" id="infoBtn">{label("About")}{segments([["Abo", -1], ["ut", 0]])}</a></li>
          <li><a href="/?panel=agenda" id="agendaBtn">{label("Meeting agenda")}{segments([["Mee", -2], ["tin", -1], ["g", 0], ["\u00a0age", 1], ["nda", 2]])}</a></li>
          <li><a href="/?panel=demo-signup" id="signupBtn">{label("Demo signup")}{segments([["Dem", -1], ["o\u00a0", 0], ["signup", 1]])}</a></li>
          <li><a href="https://www.instagram.com/creativecodingnyc/" target="_blank" rel="noopener noreferrer">{label("Instagram (opens in a new tab)")}{segments([["Ins", -1], ["tag", 0], ["ram", 1]])}</a></li>
          <li><a href="/?panel=calendar" id="calendarBtn">{label("Calendar")}{segments([["Cal", -1], ["end", 0], ["ar", 1]])}</a></li>
          <li><a href="mailto:creativecodingnyc@gmail.com" id="contact">{label("Contact")}{segments([["Con", -1], ["tac", 0], ["t", 1]])}</a></li>
        </ul>
        <p className="mail" id="mail" hidden><span id="addr">creativecodingnyc@gmail.com</span> <button type="button" id="copy" aria-live="polite">copy</button></p>
      </nav>
      <a className="menu-btn" href="/?panel=calendar" id="calendarNavBtn">calendar</a>
      <a className="icon" href="https://www.instagram.com/creativecodingnyc/" target="_blank" rel="noopener noreferrer" aria-label="Instagram (opens in a new tab)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" className="dot"/></svg>
      </a>
      <a className="icon linkedin" href="https://www.linkedin.com/company/143076054/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn (opens in a new tab)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle className="fill" cx="6.5" cy="6.5" r="1.7"/><rect className="fill" x="5" y="10" width="3" height="9" rx=".35"/><path className="fill" d="M10.5 10h3v1.3c.9-1.15 2-1.7 3.45-1.7 3 0 3.55 1.95 3.55 4.55V19h-3.2v-4.35c0-1.05-.02-2.4-1.55-2.4-1.55 0-1.8 1.2-1.8 2.35V19h-3.45Z"/></svg>
      </a>
    </header>
  );
}
