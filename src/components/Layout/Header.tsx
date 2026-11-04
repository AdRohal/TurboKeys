'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Link, useNavigate } from '@/lib/router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const CHALLENGES = [
  { to: '/', label: 'Keyboard typing', hint: 'Typing speed test, 15 to 120 seconds' },
  { to: '/fast-thinking', label: 'Fast thinking', hint: '60 seconds of mental math' },
];
const NAV = [{ to: '/leaderboard', label: 'Leaderboard' }];

const icon = 'w-[18px] h-[18px]';
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const SunIcon = () => (
  <svg className={icon} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const MoonIcon = () => (
  <svg className={icon} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
  </svg>
);

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [challengesOpen, setChallengesOpen] = useState(false);
  const challengesRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
    setMobileOpen(false);
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!mobileRef.current?.contains(t) && !burgerRef.current?.contains(t)) setMobileOpen(false);
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (challengesRef.current && !challengesRef.current.contains(t)) setChallengesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMobileOpen(false);
        setChallengesOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setChallengesOpen(false);
  }, [pathname]);

  const active = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const inChallenges = CHALLENGES.some((c) => active(c.to));
  const navClass = (to: string) =>
    `relative px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      active(to)
        ? 'text-primary-950 dark:text-ember-300 after:absolute after:left-3 after:right-3 after:-bottom-[13px] after:h-px after:bg-primary-600 dark:after:bg-ember-300'
        : 'text-primary-700 hover:text-primary-950 dark:text-primary-300 dark:hover:text-ember-200'
    }`;
  const menuItem =
    'flex w-full items-center gap-2 px-3 py-2 text-sm rounded-md text-left text-primary-800 hover:bg-primary-100 dark:text-primary-200 dark:hover:bg-ember-300/10 transition-colors';

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-primary-200 bg-white/80 dark:border-ember-300/10 dark:bg-primary-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-primary-950 dark:text-ember-300" aria-label="TurboKeys home">
            <img src="/Logo/icon.png" alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-md object-contain" />
            <span className="text-[1.05rem]">TurboKeys</span>
          </Link>
          <nav aria-label="Main" className="hidden md:flex items-center gap-1">
            <div className="relative" ref={challengesRef}>
              <button
                type="button"
                onClick={() => setChallengesOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={challengesOpen}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  inChallenges
                    ? 'text-primary-950 dark:text-ember-300 after:absolute after:left-3 after:right-3 after:-bottom-[13px] after:h-px after:bg-primary-600 dark:after:bg-ember-300'
                    : 'text-primary-700 hover:text-primary-950 dark:text-primary-300 dark:hover:text-ember-200'
                }`}
              >
                Challenges
                <svg className={`h-4 w-4 transition-transform ${challengesOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {challengesOpen && (
                <div role="menu" className="absolute left-0 mt-3 w-72 rounded-xl border border-primary-200 bg-white p-1.5 shadow-lift dark:border-ember-300/15 dark:bg-primary-900 dark:shadow-panel">
                  {CHALLENGES.map((c) => (
                    <Link
                      key={c.to}
                      role="menuitem"
                      to={c.to}
                      onClick={() => setChallengesOpen(false)}
                      aria-current={active(c.to) ? 'page' : undefined}
                      className={`block rounded-lg px-3 py-2.5 transition-colors hover:bg-primary-100 dark:hover:bg-ember-300/10 ${active(c.to) ? 'bg-primary-50 dark:bg-ember-300/[0.07]' : ''}`}
                    >
                      <span className="block text-sm font-semibold text-primary-950 dark:text-ember-200">{c.label}</span>
                      <span className="block text-xs text-primary-600 dark:text-primary-400">{c.hint}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={navClass(n.to)} aria-current={active(n.to) ? 'page' : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-100 dark:border-ember-300/10 dark:text-primary-300 dark:hover:bg-ember-300/10 dark:hover:text-ember-300 transition-colors"
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>

          <div className="hidden md:block">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex h-10 items-center gap-2 rounded-lg border border-primary-200 pl-1.5 pr-3 text-sm font-medium text-primary-900 hover:bg-primary-100 dark:border-ember-300/10 dark:text-ember-200 dark:hover:bg-ember-300/10 transition-colors"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-primary-600 text-xs font-bold text-white dark:bg-ember-300 dark:text-primary-950">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  <span>{user.username}</span>
                  <svg className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-52 rounded-xl border border-primary-200 bg-white p-1.5 shadow-lift dark:border-ember-300/15 dark:bg-primary-900 dark:shadow-panel">
                    <Link role="menuitem" to="/account" className={menuItem} onClick={() => setMenuOpen(false)}>
                      Account
                    </Link>
                    <Link role="menuitem" to="/history" className={menuItem} onClick={() => setMenuOpen(false)}>
                      History and scores
                    </Link>
                    <div className="my-1 border-t border-primary-100 dark:border-ember-300/10" />
                    <button role="menuitem" onClick={handleLogout} className={`${menuItem} !text-red-600 dark:!text-red-300`}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary !min-h-[40px] !py-1.5 !px-4">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary !min-h-[40px] !py-1.5 !px-4">
                  Create account
                </Link>
              </div>
            )}
          </div>

          <button
            ref={burgerRef}
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden grid h-10 w-10 place-items-center rounded-lg border border-primary-200 text-primary-700 dark:border-ember-300/10 dark:text-primary-300"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <svg className={icon} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
              {mobileOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" ref={mobileRef} className="md:hidden border-t border-primary-200 bg-white dark:border-ember-300/10 dark:bg-primary-950">
          <nav aria-label="Mobile" className="flex flex-col gap-1 px-4 py-3">
            <p className="px-3 pt-1 text-xs font-medium text-primary-600 dark:text-primary-400">Challenges</p>
            {CHALLENGES.map((c) => (
              <Link key={c.to} to={c.to} className={`${menuItem} flex-col !items-start gap-0 ${active(c.to) ? 'bg-primary-100 dark:bg-ember-300/10' : ''}`} aria-current={active(c.to) ? 'page' : undefined}>
                <span className="font-semibold">{c.label}</span>
                <span className="text-xs text-primary-600 dark:text-primary-400">{c.hint}</span>
              </Link>
            ))}
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={`${menuItem} ${active(n.to) ? 'bg-primary-100 dark:bg-ember-300/10' : ''}`} aria-current={active(n.to) ? 'page' : undefined}>
                {n.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/account" className={menuItem}>
                  Account
                </Link>
                <Link to="/history" className={menuItem}>
                  History and scores
                </Link>
                <button onClick={handleLogout} className={`${menuItem} !text-red-600 dark:!text-red-300`}>
                  Sign out
                </button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Create account
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
