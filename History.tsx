import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  History as HistoryIcon,
  ArrowRight,
  GitCompare,
  Download,
  X,
  CheckCircle2,
  Clock,
  Target,
  BarChart2,
  Activity,
} from 'lucide-react';
import { generateComparisonPDF } from '../utils/pdfExport';

const emotionEmoji: Record<string, string> = {
  happy: '😊',
  neutral: '😐',
  uncomfortable: '😣',
};

function formatEmotionLabel(emotion?: string | null): string {
  if (!emotion) return 'Neutral';
  const lower = emotion.toLowerCase();
  if (lower === 'happy') return 'Happy';
  if (
    lower === 'uncomfortable' ||
    lower === 'angry' ||
    lower === 'sad' ||
    lower === 'fear' ||
    lower === 'disgust' ||
    lower === 'surprise'
  ) {
    return 'Uncomfortable';
  }
  return 'Neutral';
}

function formatDuration(sec: number = 0): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function History() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/users/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => setData(d));
  }, [token]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!data?.sessions) return;
    if (selectedIds.length === data.sessions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.sessions.map((s: any) => s.id));
    }
  };

  if (!data) return <div className="p-8 text-center text-slate-500 font-bold">Loading session history...</div>;

  const selectedSessions = (data.sessions || []).filter((s: any) =>
    selectedIds.includes(s.id)
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Session History</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track your rehabilitation records and compare historical progress.
          </p>
        </div>

        {/* Comparison Trigger Bar */}
        {selectedIds.length >= 2 && (
          <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-2xl animate-fade-in shadow-sm">
            <span className="text-xs font-bold text-indigo-900">
              {selectedIds.length} sessions selected
            </span>
            <button
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
            >
              <GitCompare size={15} />
              Compare Reports
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {data.isEmpty ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center mt-10">
          <HistoryIcon className="text-slate-300 mx-auto mb-4" size={64} />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No sessions yet.</h2>
          <p className="text-slate-500 font-medium mb-6">Your completed therapy sessions will appear here.</p>
          <Link
            to="/exercises"
            className="px-6 py-2.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition"
          >
            Start Your First Session
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Instruction banner if fewer than 2 selected */}
          <div className="flex justify-between items-center text-xs text-slate-500 px-1">
            <span className="font-medium">
              💡 Select two or more sessions to compare side-by-side progress and emotion trends.
            </span>
            <button
              onClick={handleSelectAll}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              {selectedIds.length === data.sessions.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 w-12 text-center">Select</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Exercise</th>
                    <th className="p-4">Duration (Actual / Target)</th>
                    <th className="p-4">Dominant Emotion</th>
                    <th className="p-4 text-center">AI Confidence</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.map((session: any) => {
                    const isSelected = selectedIds.includes(session.id);
                    const emo = formatEmotionLabel(session.dominantEmotion);
                    const targetSec = session.targetDuration || 120;
                    const actualSec = session.duration || 0;
                    const pct = Math.min(100, Math.round((actualSec / targetSec) * 100));

                    return (
                      <tr
                        key={session.id}
                        className={`border-b border-slate-100 transition ${
                          isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(session.id)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 font-medium text-slate-900 text-sm whitespace-nowrap">
                          {new Date(session.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4 text-slate-500 font-medium text-sm">
                          {session.exercise?.category}
                        </td>
                        <td className="p-4 font-semibold text-slate-800 text-sm">
                          {session.exercise?.name}
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                          <span>{formatDuration(actualSec)}</span>
                          <span className="text-slate-400 text-xs ml-1">/ {formatDuration(targetSec)}</span>
                          <span className={`ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            pct >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="p-4 font-medium text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <span>{emotionEmoji[emo.toLowerCase()] || '😐'}</span>
                            <span
                              className={
                                emo === 'Happy'
                                  ? 'text-emerald-700 font-semibold'
                                  : emo === 'Uncomfortable'
                                  ? 'text-red-600 font-semibold'
                                  : 'text-slate-700'
                              }
                            >
                              {emo}
                            </span>
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-sky-600 text-sm">
                          {Math.round(session.avgConfidence || 0)}%
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            to={`/results/${session.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                          >
                            View Report <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SIDE-BY-SIDE SESSION COMPARISON & PROGRESS CHARTS ────────── */}
      {showComparison && selectedSessions.length >= 2 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <GitCompare size={20} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Session Progress Comparison</h2>
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  Comparing {selectedSessions.length} rehabilitation sessions for {user?.name || 'Patient'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateComparisonPDF(selectedSessions, user?.name, user?.email)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
                >
                  <Download size={14} />
                  Download Comparison PDF
                </button>
                <button
                  onClick={() => setShowComparison(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Visual Progress Graphs */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Chart 1: AI Confidence Progression */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="text-sky-600" size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    AI Confidence Score Trend
                  </h3>
                </div>
                <div className="flex items-end gap-3 h-28 pt-4 px-2 border-b border-slate-200">
                  {selectedSessions.map((s: any, idx: number) => {
                    const conf = Math.round(s.avgConfidence || 0);
                    const h = Math.max(15, (conf / 100) * 80);
                    return (
                      <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-600">{conf}%</span>
                        <div
                          className="w-full bg-sky-500 rounded-t-lg transition-all"
                          style={{ height: `${h}px` }}
                        />
                        <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                          S{idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Session order (left to right) reflecting model detection stability.
                </p>
              </div>

              {/* Chart 2: Completed vs Target Duration */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="text-indigo-600" size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Duration & Adherence Comparison
                  </h3>
                </div>
                <div className="space-y-2.5 pt-1">
                  {selectedSessions.map((s: any, idx: number) => {
                    const targetSec = s.targetDuration || 120;
                    const actualSec = s.duration || 0;
                    const pct = Math.min(100, Math.round((actualSec / targetSec) * 100));
                    return (
                      <div key={s.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>
                            S{idx + 1}: {s.exercise?.name}
                          </span>
                          <span>
                            {formatDuration(actualSec)} / {formatDuration(targetSec)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 90 ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Side-by-Side Detailed Session Cards */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Side-by-Side Parameter Breakdown
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedSessions.map((s: any, idx: number) => {
                  const emo = formatEmotionLabel(s.dominantEmotion);
                  const targetSec = s.targetDuration || 120;
                  const actualSec = s.duration || 0;
                  const pct = Math.min(100, Math.round((actualSec / targetSec) * 100));

                  return (
                    <div
                      key={s.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-300 transition"
                    >
                      {/* Card Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            Session {idx + 1}
                          </span>
                          <h4 className="font-bold text-slate-900 text-base mt-1 leading-snug">
                            {s.exercise?.name}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {new Date(s.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Parameters Grid */}
                      <div className="space-y-2 text-xs border-t border-b border-slate-100 py-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" /> Target Duration:
                          </span>
                          <span className="font-bold text-slate-800">{formatDuration(targetSec)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Target size={13} className="text-slate-400" /> Completed:
                          </span>
                          <span className="font-bold text-sky-600">{formatDuration(actualSec)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-slate-400" /> Completion Rate:
                          </span>
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${
                              pct >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Dominant Emotion:</span>
                          <span className="font-bold flex items-center gap-1 text-slate-800">
                            <span>{emotionEmoji[emo.toLowerCase()] || '😐'}</span>
                            {emo}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">AI Confidence:</span>
                          <span className="font-bold text-sky-600">{Math.round(s.avgConfidence || 0)}%</span>
                        </div>
                      </div>

                      {/* Clinical Recommendation */}
                      {s.recommendation ? (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 italic">
                          "{s.recommendation}"
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic">No specific recommendation recorded.</div>
                      )}

                      <Link
                        to={`/results/${s.id}`}
                        className="block text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                      >
                        Open Full Session Report
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowComparison(false)}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
              >
                Close Comparison
              </button>
              <button
                onClick={() => generateComparisonPDF(selectedSessions, user?.name, user?.email)}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
              >
                <Download size={15} />
                Download Comparison PDF
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
