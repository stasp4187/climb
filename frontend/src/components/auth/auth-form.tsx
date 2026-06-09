"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { checkEmailAvailability, login, register } from '@/lib/api';
import { UserSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AuthMode = 'login' | 'register';

export function AuthForm({ mode, centered = false }: { mode: AuthMode; centered?: boolean }) {
  const router = useRouter();
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordRepeat, setAuthPasswordRepeat] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('climb_session');
    if (raw) {
      router.replace('/account');
      return;
    }
    setCheckedSession(true);
  }, [router]);

  async function validateRegistrationEmail(email: string, showToast = false) {
    if (mode !== 'register') return true;
    const normalized = email.trim();
    if (!normalized) return false;
    const result = await checkEmailAvailability(normalized);
    if (result.exists) {
      if (showToast) toast.error('Цей email вже зайнятий');
      return false;
    }
    return true;
  }

  async function handleAuthSubmit() {
    if (isAuthLoading) return;

    if (!authEmail.trim() || !authPassword.trim()) {
      toast.error('Вкажіть email та пароль');
      return;
    }

    if (mode === 'register') {
      if (!authName.trim()) {
        toast.error('Вкажіть імʼя');
        return;
      }
      if (authPassword !== authPasswordRepeat) {
        toast.error('Паролі не збігаються');
        return;
      }
      const isFree = await validateRegistrationEmail(authEmail, true);
      if (!isFree) return;
    }

    setIsAuthLoading(true);
    try {
      const next: UserSession =
        mode === 'login'
          ? await login({ email: authEmail, password: authPassword })
          : await register({ name: authName, email: authEmail, password: authPassword });

      localStorage.setItem('climb_session', JSON.stringify(next));
      toast.success(mode === 'login' ? 'Вхід успішний' : 'Реєстрація успішна');
      router.replace('/account');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;
        if (typeof message === 'string' && message.trim()) {
          toast.error(message);
          return;
        }
        if (Array.isArray(message) && message.length > 0) {
          toast.error(String(message[0]));
          return;
        }
      }
      toast.error('Не вдалося увійти. Перевірте дані або створіть акаунт');
    } finally {
      setIsAuthLoading(false);
    }
  }

  if (!checkedSession) return null;

  return (
    <Card className={`auth-card ${centered ? 'auth-panel-centered' : ''}`}>
      <CardHeader className="auth-card-header">
        <p className="auth-brand">Climb Atlas</p>
        <CardTitle className="auth-heading">{mode === 'login' ? 'Вхід в акаунт' : 'Реєстрація'}</CardTitle>
        <CardDescription className="auth-description">
          {mode === 'login'
            ? 'Увійдіть, щоб додавати маршрути в обране, залишати відгуки та працювати з збереженими.'
            : 'Створіть акаунт, щоб зберігати маршрути та синхронізувати власні добірки.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="auth-card-content">
        {mode === 'register' && (
          <div className="auth-field">
            <label className="auth-label">Імʼя</label>
            <Input className="auth-input" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Ваше імʼя" />
          </div>
        )}

        <div className="auth-field">
          <label className="auth-label">Email</label>
          <Input
            className="auth-input"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            onBlur={() => void validateRegistrationEmail(authEmail, true)}
            type="email"
            placeholder="name@company.com"
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">Пароль</label>
          <div className="auth-password-wrap">
            <Input className="auth-input auth-password-input" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Введіть пароль" />
            <button type="button" className="eye-btn" onClick={() => setShowPassword((s) => !s)} aria-label="Показати пароль">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {mode === 'register' && (
          <div className="auth-field">
            <label className="auth-label">Повторіть пароль</label>
            <div className="auth-password-wrap">
              <Input className="auth-input auth-password-input" value={authPasswordRepeat} onChange={(e) => setAuthPasswordRepeat(e.target.value)} type={showPasswordRepeat ? 'text' : 'password'} placeholder="Повторіть пароль" />
              <button type="button" className="eye-btn" onClick={() => setShowPasswordRepeat((s) => !s)} aria-label="Показати повтор пароля">
                {showPasswordRepeat ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        <Button className="auth-submit" onClick={handleAuthSubmit} disabled={isAuthLoading}>
          {isAuthLoading ? 'Завантаження...' : mode === 'login' ? 'Увійти' : 'Зареєструватися'}
        </Button>

        <p className="auth-switch">
          {mode === 'register' ? 'Вже є акаунт? ' : 'Немає акаунта? '}
          <Link href={mode === 'register' ? '/auth/login' : '/auth/register'}>
            {mode === 'register' ? 'Увійти' : 'Зареєструватися'}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
