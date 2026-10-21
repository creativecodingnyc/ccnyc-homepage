"use client";

import { useEffect, useState } from "react";

export default function HomeNav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const close = () => setOpen(false);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("click", close);
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("click", close); window.removeEventListener("keydown", escape); };
  }, []);

  return (
    <header className="homeNav">
      <button type="button" className="navButton" aria-expanded={open} onClick={event => { event.stopPropagation(); setOpen(value => !value); }}>menu</button>
      <a className="navButton calendarLink" href="/?panel=calendar">calendar</a>
      <a className="social instagram" href="https://www.instagram.com/creativecodingnyc/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1" className="dot"/></svg></a>
      <a className="social linkedin" href="https://www.linkedin.com/company/143076054/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg viewBox="0 0 24 24"><circle className="fill" cx="6.5" cy="6.5" r="1.7"/><rect className="fill" x="5" y="10" width="3" height="9" rx=".35"/><path className="fill" d="M10.5 10h3v1.3c.9-1.15 2-1.7 3.45-1.7 3 0 3.55 1.95 3.55 4.55V19h-3.2v-4.35c0-1.05-.02-2.4-1.55-2.4-1.55 0-1.8 1.2-1.8 2.35V19h-3.45Z"/></svg></a>
      {open && <nav className="menuPanel" aria-label="Menu" onClick={event => event.stopPropagation()}><ul><li><a href="/?panel=about">About</a></li><li><a href="/?panel=agenda">Meeting agenda</a></li><li><a href="/build-a-poster">Build a poster</a></li><li><a href="/?panel=demo-signup">Demo signup</a></li><li><a href="https://www.instagram.com/creativecodingnyc/" target="_blank" rel="noopener noreferrer">Instagram</a></li><li><a href="/?panel=calendar">Calendar</a></li><li><a href="mailto:creativecodingnyc@gmail.com">Contact</a></li></ul></nav>}
    </header>
  );
}
