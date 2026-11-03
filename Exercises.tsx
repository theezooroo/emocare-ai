import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface Exercise {
  id: string;
  name: string;
  category: string;
  duration: string;
  difficulty: string;
}

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3001/api/exercises')
      .then(res => res.json())
      .then(data => {
        setExercises(data);
        setLoading(false);
      });
  }, []);

  const handleStart = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior if wrapped in anchor (though it's a button here)
    if (!isAuthenticated) {
      navigate(`/login?returnTo=/session/${id}`);
    } else {
      navigate(`/session/${id}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading specific exercises...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Therapy Library</h1>
      <p className="text-slate-500 mb-8 font-medium">Browse our clinical physiotherapy guided sessions.</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises.map(ex => (
          <div key={ex.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full">
            <div className="h-40 bg-sky-100 relative group overflow-hidden">
                <div className="absolute inset-0 bg-sky-200/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button onClick={(e) => handleStart(ex.id, e)} className="px-5 py-2 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 shadow-md transform translate-y-4 group-hover:translate-y-0 transition-all">Start Session</button>
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">{ex.category}</span>
              <h3 className="font-bold text-lg text-slate-900 mt-1 mb-2">{ex.name}</h3>
              <div className="flex items-center justify-between text-sm text-slate-500 mb-4 flex-1">
                <span className="font-medium bg-slate-100 px-2.5 py-1 rounded-md">{ex.duration}</span>
                <span className="font-medium bg-slate-100 px-2.5 py-1 rounded-md">{ex.difficulty}</span>
              </div>
              <Link to={`/exercises/${ex.id}`} className="block w-full text-center py-2.5 bg-slate-50 font-semibold text-slate-700 rounded-xl hover:bg-slate-100 transition border border-slate-200">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
