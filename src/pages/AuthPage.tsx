import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Flower2 } from 'lucide-react';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sand-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-clay-700 mb-6">
            <Flower2 className="w-7 h-7 text-sand-50" />
          </div>
          <h1 className="text-4xl font-display font-light text-clay-900 tracking-wide-sm">
            Estúdio Aflora
          </h1>
          <p className="mt-2 text-sm text-clay-500 tracking-editorial uppercase">
            Ateliê Aflora · Biojoias Artesanais
          </p>
        </div>

        <div className="card p-8 animate-slide-up">
          <h2 className="text-2xl font-display font-light text-clay-800 mb-1">
            {mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </h2>
          <p className="text-sm text-clay-400 mb-8">
            {mode === 'signin'
              ? 'Acesse seu estúdio fotográfico'
              : 'Comece a fotografar suas biojoias'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label-field" htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Processando...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="btn-ghost"
            >
              {mode === 'signin'
                ? 'Não tem conta? Criar uma nova'
                : 'Já tem conta? Entrar'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-clay-400 mt-8 tracking-wide-sm">
          Estúdio fotográfico virtual · Preservando a essência de cada peça
        </p>
      </div>
    </div>
  );
}
