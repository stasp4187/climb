"use client";

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { fetchTrails, toggleSavedTrail } from '@/lib/api';
import { difficultyLabel } from '@/lib/labels';
import { Trail, UserSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppSidebar } from '@/components/app-sidebar';

const TrailsMap = dynamic(() => import('@/components/trails-map').then((m) => m.TrailsMap), { ssr: false });

export default function Home() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    fetchTrails({ q: query, difficulty }).then(setTrails);
  }, [query, difficulty]);

  useEffect(() => {
    const raw = localStorage.getItem('climb_session');
    if (raw) setSession(JSON.parse(raw));
  }, []);

  function saveSession(next: UserSession | null) {
    setSession(next);
    if (next) {
      localStorage.setItem('climb_session', JSON.stringify(next));
      return;
    }
    localStorage.removeItem('climb_session');
  }

  async function handleSave(trailId: string) {
    if (!session) return;
    const updated = await toggleSavedTrail(session.id, trailId);
    const next = { ...session, savedTrailIds: updated.savedTrailIds };
    saveSession(next);
  }

  const heroMetric = useMemo(() => trails.reduce((acc, t) => acc + t.distanceKm, 0).toFixed(1), [trails]);

  return (
    <main className="app-shell">
      <AppSidebar active="search" authed={!!session} />

      <div>
        <section className="hero">
          <h1>Відкривайте нові маршрути та плануйте похід на одній мапі</h1>
          <div className="hero-stats hero-stats-two">
            <div><strong>{trails.length}</strong><span>Маршрутів</span></div>
            <div><strong>{heroMetric} км</strong><span>Загальна довжина</span></div>
          </div>
        </section>

        {!session && (
          <section className="auth-panel" style={{ marginTop: 16 }}>
            <p className="auth-ok" style={{ marginBottom: 10 }}>Щоб зберігати маршрути, увійдіть або зареєструйтеся.</p>
            <div className="auth-panel-actions">
              <Link href="/auth/login"><Button className="auth-panel-primary">Увійти</Button></Link>
              <Link href="/auth/register"><Button className="auth-panel-secondary" variant="outline">Зареєструватися</Button></Link>
            </div>
          </section>
        )}

        <section className="controls">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук за назвою, регіоном або тегом" />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">Усі рівні</option>
            <option value="easy">Легкий</option>
            <option value="moderate">Середній</option>
            <option value="hard">Складний</option>
          </select>
        </section>

        <section className="map-wrap">
          <TrailsMap trails={trails} />
        </section>

        <section className="grid">
          {trails.map((trail) => {
            const saved = session?.savedTrailIds.includes(trail.id) ?? false;
            return (
              <Card key={trail.id} className="card">
                <Link href={`/trails/${trail.slug}`}><img src={trail.coverImage} alt={trail.name} /></Link>
                <CardContent className="card-body">
                  <h3><Link href={`/trails/${trail.slug}`}>{trail.name}</Link></h3>
                  <p>{trail.region}, {trail.country}</p>
                  <p>{trail.summary}</p>
                  <div className="meta">
                    <span>{trail.distanceKm} км</span>
                    <span>{trail.elevationM} м</span>
                    <span>{trail.durationHours} год</span>
                  </div>
                  <div className="tags">
                    <span>#{difficultyLabel(trail.difficulty).toLowerCase()}</span>
                    {trail.tags.map((t) => <span key={t}>#{t}</span>)}
                  </div>
                  <Button className="save-route-btn" disabled={!session} onClick={() => handleSave(trail.id)}>{saved ? 'Збережено' : 'Зберегти маршрут'}</Button>
                  <p className="reviews">Відгуків: {trail.reviews.length}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
