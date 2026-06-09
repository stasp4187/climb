"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchTrails } from '@/lib/api';
import { Trail, UserSession } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { AppSidebar } from '@/components/app-sidebar';

export default function SavedPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [checkedSession, setCheckedSession] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('climb_session');
    if (raw) {
      setSession(JSON.parse(raw));
      setCheckedSession(true);
      return;
    }
    setCheckedSession(true);
    router.replace('/auth/login');
  }, [router]);

  useEffect(() => {
    fetchTrails().then(setTrails);
  }, []);

  const saved = trails.filter((t) => session?.savedTrailIds.includes(t.id));

  if (!checkedSession) return null;
  if (!session) return null;

  return (
    <main className="app-shell">
      <AppSidebar active="saved" authed />

      <div>
        <section className="hero">
          <h1>Збережені маршрути</h1>
          <p className="sub">Тут зібрані треки, які ви позначили для майбутніх подорожей.</p>
        </section>
        <section className="grid">
          {saved.map((trail) => (
            <Card key={trail.id} className="card">
              <Link href={`/trails/${trail.slug}`}><img src={trail.coverImage} alt={trail.name} /></Link>
              <CardContent className="card-body">
                <h3><Link href={`/trails/${trail.slug}`}>{trail.name}</Link></h3>
                <p>{trail.region}, {trail.country}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
