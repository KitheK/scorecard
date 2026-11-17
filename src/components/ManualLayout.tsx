import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { manualTitleFromProjectName, PLATFORM_ATTRIBUTION } from "../lib/schemas";
import { wordmarkTextFromProjectName } from "../lib/pixelGlyphs";
import { useContent } from "../lib/ContentContext";
import { PageEnter } from "./PageEnter";
import { PixelWordmark } from "./PixelWordmark";

export function ManualLayout({ children }: { children: ReactNode }) {
  const { manual, scorecard } = useContent();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [chromeTheme, setChromeTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );

  const projectName = manual.projectName?.trim() || scorecard.projectName?.trim() || "Project";
  const manualTitle = manual.title?.trim() || manualTitleFromProjectName(projectName);
  const wordmark = wordmarkTextFromProjectName(projectName);

  useEffect(() => {
    document.documentElement.dataset.theme = chromeTheme;
  }, [chromeTheme]);

  return (
    <div className="shell manual-shell">
      <a className="skip" href="#manual-main">
        Skip to content
      </a>
      <button
        className="menu-button no-print"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close contents" : "Contents"}
      </button>
      {open ? (
        <button className="backdrop no-print" type="button" aria-label="Close contents" onClick={() => setOpen(false)} />
      ) : null}
      <aside className={open ? "sidebar open" : "sidebar"} aria-label="Manual contents">
        <Link className="mark" to="/" onClick={() => setOpen(false)}>
          <PixelWordmark text={wordmark} cell={3} />
          <span className="mark-title display">{manualTitle}</span>
        </Link>
        <nav aria-label="Chapters">
          {manual.parts.map((part) => (
            <div className="nav-part" key={part.id}>
              <p>
                {part.id} {part.title}
              </p>
              {manual.chapters
                .filter((chapter) => chapter.part === part.id)
                .map((chapter) => {
                  const href = `/chapters/${chapter.slug}`;
                  return (
                    <Link
                      key={chapter.slug}
                      className="nav-link"
                      to={href}
                      aria-current={pathname === href ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <span>{chapter.number}</span>
                      {chapter.title}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>
        <nav className="sidebar-util mono no-print" aria-label="Guide utilities">
          <NavLink to="/" end>
            Summary
          </NavLink>
          <NavLink to="/contents">Contents</NavLink>
          <NavLink to="/demos">Demos</NavLink>
          <NavLink to="/export">Export</NavLink>
          {import.meta.env.DEV ? <NavLink to="/write">Write</NavLink> : null}
        </nav>
      </aside>
      <div className="sheet">
        <div className="manual-chrome-bar no-print" aria-label="Reading chrome">
          <span className="mono manual-path">{pathname.replace(/^\//, "") || "summary"}</span>
          <div className="chrome-tabs mono" role="group" aria-label="Manual theme">
            <button
              type="button"
              className={chromeTheme === "light" ? "is-on" : ""}
              aria-pressed={chromeTheme === "light"}
              onClick={() => setChromeTheme("light")}
            >
              LIGHT
            </button>
            <button
              type="button"
              className={chromeTheme === "dark" ? "is-on" : ""}
              aria-pressed={chromeTheme === "dark"}
              onClick={() => setChromeTheme("dark")}
            >
              DARK
            </button>
          </div>
        </div>
        <div id="manual-main">
          <PageEnter>{children}</PageEnter>
        </div>
        <footer className="manual-colophon mono no-print">
          {PLATFORM_ATTRIBUTION} · Paleologue display · Nouveau ornaments
        </footer>
      </div>
    </div>
  );
}