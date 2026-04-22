'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { signInSchema, type SignInFields } from '@/lib/auth-schemas';

type FieldErrors = Partial<Record<keyof SignInFields, string>>;

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const result = signInSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SignInFields;
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const { error } = await authClient.signIn.email(result.data);
    if (error) {
      setApiError(error.message ?? 'Anmeldung fehlgeschlagen.');
      setLoading(false);
      return;
    }

    router.push(from);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 gap-6">

      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Willkommen zurück
        </h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Melde dich mit deinem Account an
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 flex flex-col gap-3">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
              disabled={loading}
              className={`w-full rounded-xl border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 px-4 py-2.5 text-sm outline-none transition-colors disabled:opacity-50
                ${fieldErrors.email
                  ? 'border-red-400 dark:border-red-500 focus:border-red-400 dark:focus:border-red-500'
                  : 'border-zinc-200 dark:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-500'
                }`}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500">{fieldErrors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className={`w-full rounded-xl border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 px-4 py-2.5 text-sm outline-none transition-colors disabled:opacity-50
                ${fieldErrors.password
                  ? 'border-red-400 dark:border-red-500 focus:border-red-400 dark:focus:border-red-500'
                  : 'border-zinc-200 dark:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-500'
                }`}
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-500">{fieldErrors.password}</p>
            )}
          </div>

          {apiError && <p className="text-xs text-red-500">{apiError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? 'Anmelden…' : 'Anmelden'}
        </button>
      </form>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Noch kein Account?{' '}
        <Link href="/sign-up" className="text-zinc-700 dark:text-zinc-300 underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          Registrieren
        </Link>
      </p>

    </div>
  );
}
