import { useEffect, useState, type ReactNode } from 'react';
export const screens = [
  'dashboard',
  'assessment',
  'results',
  'hospitals',
  'about',
] as const;
export type Screen = (typeof screens)[number];
const labels: Record<Screen, string> = {
  dashboard: 'Overview',
  assessment: 'Symptom assessment',
  results: 'Assessment results',
  hospitals: 'Hospital directory',
  about: 'Model & sources',
};
export function useScreen() {
  const read = (): Screen => {
    const key = location.hash.replace('#/', '');
    return screens.includes(key as Screen) ? (key as Screen) : 'dashboard';
  };
  const [screen, setScreen] = useState<Screen>(read);
  useEffect(() => {
    const update = () => setScreen(read());
    addEventListener('hashchange', update);
    return () => removeEventListener('hashchange', update);
  }, []);
  const navigate = (next: Screen) => {
    location.hash = '/' + next;
    setScreen(next);
    window.scrollTo?.({ top: 0, behavior: 'instant' });
  };
  return { screen, navigate };
}
export function AppShell({
  screen,
  navigate,
  children,
}: {
  screen: Screen;
  navigate: (s: Screen) => void;
  children: ReactNode;
}) {
  return (
    <div className="app-layout">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="brand" href="#/dashboard">
          <span className="brand-monogram">A</span>
          <span>
            Arovia<small>RESEARCH STUDIO</small>
          </span>
        </a>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {screens.map((item, i) => (
            <a
              key={item}
              href={'#/' + item}
              onClick={(e) => {
                e.preventDefault();
                navigate(item);
              }}
              aria-current={item === screen ? 'page' : undefined}
            >
              <span className="nav-number">0{i + 1}</span>
              {labels[item]}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">A STUDENT PROJECT</span>
          <p>
            Explore symptoms.
            <br />
            Understand the model.
          </p>
          <a
            href="https://github.com/surajsuman23/disease-hospital-recommender"
            target="_blank"
            rel="noreferrer"
          >
            View GitHub project ↗
          </a>
        </div>
        <div className="profile">
          <span>SS</span>
          <div>
            Suraj Suman<small>Cloud computing portfolio</small>
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="app-header">
          <span>
            Workspace <b>/ {labels[screen]}</b>
          </span>
          <span className="research-badge">Research use · Not a diagnosis</span>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="app-footer">
          <span>Arovia · Disease & hospital research</span>
          <a href="#/about">Data sources & limitations</a>
        </footer>
      </div>
    </div>
  );
}
