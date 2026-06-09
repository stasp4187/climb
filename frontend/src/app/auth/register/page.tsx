import { AuthForm } from '@/components/auth/auth-form';

export default function RegisterPage() {
  return (
    <main className="auth-screen">
      <AuthForm mode="register" centered />
    </main>
  );
}
