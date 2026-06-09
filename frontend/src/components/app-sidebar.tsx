"use client";

import Link from 'next/link';

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" fill="currentColor" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M7 3h10a1 1 0 0 1 1 1v17l-6-3.5L6 21V4a1 1 0 0 1 1-1z" fill="currentColor" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-4.2 0-7.5 2.5-7.5 5.6 0 .8.7 1.4 1.5 1.4h12c.8 0 1.5-.6 1.5-1.4 0-3.1-3.3-5.6-7.5-5.6Z" fill="currentColor" />
    </svg>
  );
}

export function AppSidebar({ active, authed }: { active: 'search' | 'saved' | 'account'; authed?: boolean }) {
  return (
    <aside className="sidebar-nav" aria-label="Навігація">
      <Link href="/" className={active === 'search' ? 'active' : ''} title="Пошук">
        <span className="sidebar-icon"><IconHome /></span>
        <span>Пошук</span>
      </Link>
      <Link href="/saved" className={active === 'saved' ? 'active' : ''} title="Збережені">
        <span className="sidebar-icon"><IconBookmark /></span>
        <span>Збережені</span>
      </Link>
      <Link href={authed ? '/account' : '/auth/register'} className={active === 'account' ? 'active' : ''} title="Акаунт">
        <span className="sidebar-icon"><IconUser /></span>
        <span>{authed ? 'Акаунт' : 'Реєстрація'}</span>
      </Link>
    </aside>
  );
}
