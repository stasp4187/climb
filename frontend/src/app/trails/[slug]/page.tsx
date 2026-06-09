"use client";

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { addReview, fetchTrail, fetchTrailPhotos } from '@/lib/api';
import { difficultyLabel, routeTypeLabel } from '@/lib/labels';
import { Trail, UserSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AppSidebar } from '@/components/app-sidebar';

const packingChecklist = ['Вода 1-2 л', 'Вітрозахисна куртка', 'Power bank', 'Аптечка', 'Офлайн-мапа'];

export default function TrailDetails() {
  const params = useParams<{ slug: string }>();
  const slug = useMemo(() => (Array.isArray(params?.slug) ? params.slug[0] : params?.slug), [params]);

  const [trail, setTrail] = useState<Trail | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [session, setSession] = useState<UserSession | null>(null);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Маршрут не знайдено.');
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([fetchTrail(slug), fetchTrailPhotos(slug)])
      .then(([trailData, photoData]) => {
        if (!active) return;
        setTrail(trailData);
        setPhotos(photoData.length ? photoData : [trailData.coverImage]);
        setActivePhoto(0);
      })
      .catch(() => {
        if (!active) return;
        setError('Не вдалося завантажити маршрут.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    const raw = localStorage.getItem('climb_session');
    if (raw) setSession(JSON.parse(raw));
  }, []);

  async function submitReview() {
    if (!session || !trail || !comment.trim()) return;
    const updated = await addReview(trail.slug, { userId: session.id, userName: session.name, rating, comment });
    setTrail(updated);
    setComment('');
    setRating(5);
  }

  if (loading) return <main><p>Завантаження...</p></main>;
  if (error || !trail) return <main><p>{error ?? 'Маршрут не знайдено.'}</p></main>;

  const hero = photos[activePhoto] ?? trail.coverImage;
  const heroBackground = `linear-gradient(to top, rgba(0,0,0,.58), rgba(0,0,0,.25)), url("${hero.replaceAll('"', '\\"')}")`;

  return (
    <main className="app-shell">
      <AppSidebar active={session ? 'account' : 'search'} authed={!!session} />

      <div>
        <section className="detail-hero" style={{ backgroundImage: heroBackground }}>
          <div>
            <p className="kicker">Маршрут</p>
            <h1>{trail.name}</h1>
            <p>{trail.region}, {trail.country}</p>
            <div className="meta">
              <Badge className="badge">{difficultyLabel(trail.difficulty)}</Badge>
              <Badge className="badge">{routeTypeLabel(trail.routeType)}</Badge>
            </div>
          </div>
        </section>

        <section className="photo-strip">
          {photos.map((photo, idx) => (
            <button
              key={`${photo}-${idx}`}
              type="button"
              aria-pressed={idx === activePhoto}
              className={`photo-thumb ${idx === activePhoto ? 'active' : ''}`}
              onClick={() => setActivePhoto(idx)}
            >
              <img src={photo} alt={`Фото маршруту ${idx + 1}`} />
            </button>
          ))}
        </section>

        <section className="detail-grid">
          <Card className="panel">
            <CardContent>
              <h2>Опис маршруту</h2>
              <p>{trail.summary}</p>
              <div className="meta">
                <span>{trail.distanceKm} км</span>
                <span>{trail.elevationM} м набору</span>
                <span>{trail.durationHours} год</span>
              </div>
              <div className="tags">{trail.tags.map((t) => <span key={t}>#{t}</span>)}</div>
            </CardContent>
          </Card>

          <Card className="panel">
            <CardContent>
              <h2>Швидка інформація</h2>
              <p>Найкращий сезон: травень — жовтень</p>
              <p>Покриття: стежки, лісові дороги, кам'янисті ділянки</p>
              <p>Сигнал: місцями слабкий, рекомендуємо офлайн-мапу</p>
            </CardContent>
          </Card>

          <Card className="panel">
            <CardContent>
              <h2>Що взяти з собою</h2>
              <ul className="checklist">
                {packingChecklist.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </CardContent>
          </Card>

          <Card className="panel">
            <CardContent>
              <h2>Відгуки</h2>
              {trail.reviews.map((r) => (
                <article key={r.id} className="review-item">
                  <strong>{r.userName}</strong>
                  <p>{'★'.repeat(r.rating)} · {r.date}</p>
                  <p>{r.comment}</p>
                </article>
              ))}
              <div className="review-form">
                <h3>Додати відгук</h3>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  <option value={5}>5</option>
                  <option value={4}>4</option>
                  <option value={3}>3</option>
                  <option value={2}>2</option>
                  <option value={1}>1</option>
                </select>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Як пройшов маршрут?" />
                <Button disabled={!session} onClick={submitReview}>{session ? 'Опублікувати' : 'Увійдіть для відгуку'}</Button>
                {!session && <Link href="/auth/login" className="reviews">Є акаунт? Увійдіть, щоб залишити відгук</Link>}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
