import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Activity, Clock, ShieldAlert } from 'lucide-react';

interface DashboardStats {
  isEmpty: boolean;
  sessions: any[];
  stats: {
    totalSessions: number;
    totalDurationMinutes: number;
    averageConfidence: number;
  } | null;
}

export default function Dashboard() {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const [data, setData] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/users/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => setData(d));
  }, [token]);

  if (!data) return <div className="p-8 text-center text-slate-500 font-bold">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Good morning 👋</h1>
        <p className="text-slate-500 text-lg mt-1">Ready for today's session, {user?.name.split(' ')[0]}?</p>
      </header>

      {data.isEmpty ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back!</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">No therapy sessions recorded yet. Complete your first therapy session to begin tracking your rehabilitation progress.</p>
          <div className="flex justify-center gap-4">
            <Link to="/exercises" className="px-8 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition">
              Browse Exercises
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="col-span-2 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-center">
              <div className="relative z-10">
                <h2 className="text-sm font-bold text-sky-100 uppercase tracking-wider mb-2">Latest Session Overview</h2>
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-3xl font-bold">{data.sessions[0].dominantEmotion?.toLowerCase() === 'angry' ? 'Uncomfortable' : data.sessions[0].dominantEmotion}</p>
                    <p className="text-sky-100 font-medium">Avg AI Detection Confidence: {data.stats?.averageConfidence}%</p>
                  </div>
                </div>
                {data.sessions[0].recommendation ? (
                  <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm inline-block w-full max-w-md">
                    <p className="text-sm font-bold opacity-90">Personalized Recommendation:</p>
                    <p className="text-sm text-white mt-1 font-medium italic">"{data.sessions[0].recommendation}"</p>
                  </div>
                ) : (
                  <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm inline-block max-w-md">
                    <p className="text-sm font-bold opacity-90">Recommendation:</p>
                    <p className="text-sm text-white mt-1 font-medium">No personalized recommendation available for this session yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-4">
                <Activity size={32} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Continue Therapy</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">Pick up where you left off</p>
              <Link to="/exercises" className="w-full py-3 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl font-bold hover:bg-sky-100 transition">
                Start Next Session
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-100 text-green-600 flex items-center justify-center font-bold">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold uppercase">Total Sessions</p>
                <p className="text-3xl font-black text-slate-800">{data.stats?.totalSessions}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold uppercase">Total Therapy Time</p>
                <p className="text-3xl font-black text-slate-800">{data.stats?.totalDurationMinutes} min</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold uppercase">Avg AI Confidence</p>
                <p className="text-3xl font-black text-slate-800">{data.stats?.averageConfidence}%</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
