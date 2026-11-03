import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      login(data.user, data.token);
      
      const returnTo = searchParams.get('returnTo');
      navigate(returnTo || '/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">{error}</div>}
      
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
        <input 
          type="text" 
          required 
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
          placeholder="John Doe"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
        <input 
          type="email" 
          required 
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
          placeholder="user@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
        <input 
          type="password" 
          required 
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
          placeholder="••••••••"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-4 mt-4 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 shadow-md transition disabled:opacity-50"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="text-center text-slate-500 text-sm mt-4 font-medium">
        Already have an account? <Link to={`/login?${searchParams.toString()}`} className="text-sky-600 font-bold hover:underline">Sign In</Link>
      </p>
    </form>
  );
}
