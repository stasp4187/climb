import { AuthForm } from '@/components/auth/auth-form';

export default function LoginPage() {
  return (
    <main className="auth-screen">
      <AuthForm mode="login" centered />
    </main>
  );
}
