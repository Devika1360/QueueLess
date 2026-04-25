import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('customer'); // 'customer' or 'admin'
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register' (for customers)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/user', { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 300));

    let result;

    if (mode === 'admin') {
      // Admin login
      result = await login(email, password);
      setIsLoading(false);
      if (result.success) {
        navigate('/admin', { replace: true });
      } else {
        setError(result.message);
      }
    } else if (authMode === 'register') {
      // Customer registration
      if (!name.trim()) {
        setIsLoading(false);
        setError('Please enter your full name');
        return;
      }
      result = await register(name, email, password);
      setIsLoading(false);
      if (result.success) {
        navigate('/user', { replace: true });
      } else {
        setError(result.message);
      }
    } else {
      // Customer login
      result = await login(email, password);
      setIsLoading(false);
      if (result.success) {
        navigate('/user', { replace: true });
      } else {
        setError(result.message);
      }
    }
  }

  function quickFillAdmin() {
    setMode('admin');
    setEmail('admin@queueless.com');
    setPassword('admin123');
  }

  const showNameField = mode === 'customer' && authMode === 'register';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-6 shadow-lg shadow-indigo-500/25">
              <span className="text-3xl font-extrabold text-white">Q</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
              Queue<span className="text-gradient">Less</span>
            </h1>
            <p className="text-gray-400 text-base">
              Smart Virtual Queue Management System
            </p>
          </div>

          {/* Login Card */}
          <div className="glass rounded-2xl p-8">
            {/* Mode Toggle: Customer / Staff */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setMode('customer'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  mode === 'customer'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => { setMode('admin'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  mode === 'admin'
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Staff Login
              </button>
            </div>

            <h2 className="text-xl font-semibold text-white mb-1">
              {mode === 'admin'
                ? 'Staff Login'
                : authMode === 'register'
                  ? 'Create Account'
                  : 'Customer Login'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {mode === 'admin'
                ? 'Sign in with admin credentials'
                : authMode === 'register'
                  ? 'Enter your details to create an account'
                  : 'Sign in to access the queue'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name (customer register only) */}
              {showNameField && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              )}

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'admin' ? 'admin@queueless.com' : 'you@example.com'}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-semibold text-white gradient-primary hover:opacity-90 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {authMode === 'register' ? 'Creating account…' : 'Signing in…'}
                  </span>
                ) : (
                  mode === 'admin'
                    ? 'Sign In'
                    : authMode === 'register'
                      ? 'Create Account'
                      : 'Sign In'
                )}
              </button>
            </form>

            {/* Toggle login/register for customers */}
            {mode === 'customer' && (
              <div className="mt-5 text-center">
                <p className="text-gray-400 text-sm">
                  {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}
                    className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            )}

            {/* Quick login helper for admin */}
            {mode === 'admin' && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-500 text-center mb-3">Quick login for demo</p>
                <button
                  onClick={quickFillAdmin}
                  className="w-full py-2.5 px-4 text-sm font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all cursor-pointer"
                >
                  Fill Admin Credentials
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-gray-600 text-xs mt-8">
            © 2026 QueueLess — Smart Virtual Queue Management
          </p>
        </div>
      </div>
    </div>
  );
}
