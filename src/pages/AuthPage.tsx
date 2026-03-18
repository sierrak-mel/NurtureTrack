import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Baby, Gift } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const inviteCode = searchParams.get('invite') || '';

  useEffect(() => {
    if (inviteCode) setMode('signup');
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) setError(error.message);
        else setMessage('Check your email for reset instructions.');
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password, displayName || 'Parent', inviteCode || undefined);
        if (error) setError(error.message);
        else setMessage('Check your email to confirm your account.');
      } else {
        const { error } = await signIn(email, password);
        if (error) setError(error.message);
        else navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Baby className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-quicksand font-bold text-foreground">NurtureTrack</h1>
          <p className="text-sm text-muted-foreground font-nunito mt-1">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'}
          </p>
        </div>

        {inviteCode && mode === 'signup' && (
          <div className="flex items-center gap-2 bg-accent/50 rounded-xl px-4 py-3 mb-4 border border-accent">
            <Gift className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm font-nunito text-foreground">
              You've been invited to join a family! Create an account to get started.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-sm space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Your Name</label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Mom, Dad, Grandma..."
              />
            </div>
          )}

          <div>
            <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="text-sm font-nunito font-semibold text-foreground mb-1 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm font-nunito min-h-[48px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive font-nunito">{error}</p>}
          {message && <p className="text-sm text-nurture-teal font-nunito">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold font-nunito text-base min-h-[48px] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>

          <div className="text-center space-y-2 pt-2">
            {mode === 'login' && (
              <>
                <button type="button" onClick={() => setMode('forgot')} className="text-sm text-primary font-nunito hover:underline block mx-auto">
                  Forgot password?
                </button>
                <p className="text-sm text-muted-foreground font-nunito">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-primary font-semibold hover:underline">Sign up</button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-sm text-muted-foreground font-nunito">
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-primary font-semibold hover:underline">Sign in</button>
              </p>
            )}
            {mode === 'forgot' && (
              <button type="button" onClick={() => setMode('login')} className="text-sm text-primary font-nunito hover:underline">
                Back to sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
