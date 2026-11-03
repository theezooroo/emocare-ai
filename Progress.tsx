import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { TrendingUp, FileText } from 'lucide-react';

export default function Progress() {
  const token = useAuthStore(state => state.token);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/users/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => setData(d));
  }, [token]);

  if (!data) return <div className="p-8 text-center text-slate-500 font-bold">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Progress Reports</h1>
      
      {data.isEmpty ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center mt-10">
          <TrendingUp className="text-slate-300 mx-auto mb-4" size={64} />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No progress data available yet.</h2>
          <p className="text-slate-500 font-medium">Complete therapy sessions to generate your progress information.</p>
        </div>
      ) : (
        <div className="grid gap-8">
           <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
             <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><FileText className="text-sky-600" /> Therapy Overview</h2>
             {data.sessions.length < 3 ? (
                <div className="py-10 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-slate-500 font-medium">More completed sessions are needed to display this trend.</p>
                </div>
             ) : (
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="bg-slate-50 p-6 rounded-2xl">
                     <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Emotion Distribution</p>
                     <p className="font-medium text-slate-800">Your most frequent emotion during therapy has been <strong className="text-sky-600">{data.sessions[0].dominantEmotion?.toLowerCase() === 'angry' ? 'Uncomfortable' : (data.sessions[0].dominantEmotion ? data.sessions[0].dominantEmotion.charAt(0).toUpperCase() + data.sessions[0].dominantEmotion.slice(1).toLowerCase() : 'Neutral')}</strong> across {data.stats.totalSessions} sessions.</p>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-2xl">
                     <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Consistency</p>
                     <p className="font-medium text-slate-800">You have completed {data.stats.totalDurationMinutes} minutes of recorded therapy time.</p>
                   </div>
                   <div className="col-span-2 bg-slate-50 p-6 rounded-2xl text-center">
                      <p className="text-sm font-medium text-slate-500 italic">Advanced charts will unlock naturally as more session data is accumulated in our system.</p>
                   </div>
                </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
}
