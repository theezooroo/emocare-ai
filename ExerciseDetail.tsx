import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface Exercise {
  id: string;
  name: string;
  category: string;
  duration: string;
  difficulty: string;
  description: string;
}

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const [exercise, setExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    fetch(`http://localhost:3001/api/exercises/${id}`)
      .then(res => res.json())
      .then(data => setExercise(data))
      .catch(() => setExercise(null)); // handle error ideally
  }, [id]);

  const handleStart = () => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=/session/${id}`);
    } else {
      navigate(`/session/${id}`);
    }
  };

  if (!exercise) return <div className="p-8 text-center text-slate-500 font-bold">Loading exercise details...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link to="/exercises" className="text-sm font-medium text-sky-600 hover:underline mb-6 inline-block">&larr; Back to Exercises</Link>
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
        <span className="text-sm font-bold tracking-wider uppercase text-sky-500">{exercise.category}</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2 mb-4">{exercise.name}</h1>
        <div className="flex gap-4 text-slate-700 font-medium mb-8">
          <span className="px-3 py-1 bg-slate-100 rounded-lg">Duration: {exercise.duration}</span>
          <span className="px-3 py-1 bg-slate-100 rounded-lg">Difficulty: {exercise.difficulty}</span>
        </div>
        
        <h3 className="text-xl font-bold mb-3">Description</h3>
        <p className="text-slate-600 leading-relaxed mb-8">{exercise.description}</p>
        
        <h3 className="text-xl font-bold mb-4">Instructions</h3>
        <ol className="list-decimal pl-5 space-y-2 text-slate-700 font-medium mb-8">
          <li>Position yourself comfortably.</li>
          <li>Follow the provided physiotherapy instructions closely.</li>
          <li>Continue at a comfortable pace.</li>
          <li>Stop if you experience pain or discomfort.</li>
        </ol>

        <div className="bg-sky-50 rounded-2xl p-6 mb-8 border border-sky-100">
          <h4 className="font-bold text-sky-800 mb-2">Safety Notes</h4>
          <p className="text-sky-700 text-sm font-medium">Follow your physiotherapist's instructions. If you experience pain or discomfort, stop and seek professional advice.</p>
          <p className="text-sky-700 text-sm font-medium mt-2">EMOCARE-AI provides AI-assisted wellness and rehabilitation guidance and is not a medical diagnostic system.</p>
        </div>

        <button onClick={handleStart} className="block w-full sm:w-auto text-center px-10 py-4 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition shadow-lg shadow-sky-600/20">
          {isAuthenticated ? 'Start Session' : 'Sign in to Start'}
        </button>
      </div>
    </div>
  );
}
