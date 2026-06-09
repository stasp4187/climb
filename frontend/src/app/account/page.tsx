"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { UserSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/app-sidebar';
import { changePassword } from '@/lib/api';
import { Input } from '@/components/ui/input';

export default function AccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('climb_session');
    if (!raw) {
      setCheckedSession(true);
      router.replace('/auth/login');
      return;
    }

    setSession(JSON.parse(raw));
    setCheckedSession(true);
  }, [router]);

  function logout() {
    localStorage.removeItem('climb_session');
    router.replace('/auth/login');
  }

  async function submitPasswordChange() {
    if (!session || savingPassword) return;
    if (!oldPassword.trim() || !newPassword.trim()) {
      toast.error('Заповніть обидва поля пароля');
      return;
    }
    if (newPassword.trim().length < 6) {
      toast.error('Новий пароль має бути щонайменше 6 символів');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({ userId: session.id, oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setPasswordModalOpen(false);
      toast.success('Пароль успішно змінено');
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
      toast.error('Не вдалося змінити пароль');
    } finally {
      setSavingPassword(false);
    }
  }

  if (!checkedSession || !session) return null;

  return (
    <main className="app-shell">
      <AppSidebar active="account" authed />

      <div>
        <section className="hero">
          <h1>{session.name}</h1>
          <div className="profile-actions">
            <p className="sub" style={{ margin: 0 }}>{session.email}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button className="account-password-btn" variant="outline" onClick={() => setPasswordModalOpen(true)}>Змінити пароль</Button>
              <Button className="account-logout-btn" variant="outline" onClick={logout}>Вийти</Button>
            </div>
          </div>
        </section>
      </div>

      {passwordModalOpen && (
        <div className="modal-backdrop" onClick={() => !savingPassword && setPasswordModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Зміна пароля</h3>
            <div className="auth-grid" style={{ marginTop: 10 }}>
              <div className="field-group">
                <label className="field-label">Старий пароль</label>
                <div className="password-field">
                  <Input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Введіть старий пароль"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowOldPassword((s) => !s)} aria-label="Показати старий пароль">
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Новий пароль</label>
                <div className="password-field">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Введіть новий пароль"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowNewPassword((s) => !s)} aria-label="Показати новий пароль">
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Button variant="outline" className="account-password-btn" onClick={() => setPasswordModalOpen(false)} disabled={savingPassword}>Скасувати</Button>
                <Button onClick={submitPasswordChange} disabled={savingPassword}>{savingPassword ? 'Збереження...' : 'Зберегти'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
