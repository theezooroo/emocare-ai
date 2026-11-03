import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Target, Clock, Brain, FileWarning, TrendingUp, BarChart2, CheckCircle2, Download } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { generateSessionPDF } from '../utils/pdfExport';

// ── helpers ─────────────────────────────────────────────────────────────────

const emotionEmoji: Record<string, string> = {
  happy: '😊', neutral: '😐', uncomfortable: '😣'
};

function formatEmotionLabel(emotion: string): string {
  if (!emotion) return 'Neutral';
  const lower = emotion.toLowerCase();
  if (lower === 'happy') return 'Happy';
  if (lower === 'uncomfortable' || lower === 'angry' || lower === 'sad' || lower === 'fear' || lower === 'disgust' || lower === 'surprise') return 'Uncomfortable';
  return 'Neutral';
}

function confidenceGrade(pct: number): { label: string; color: string; ring: string; bar: string; bg: string } {
  if (pct >= 80) return { label: 'Excellent',   color: 'text-emerald-700', ring: 'ring-emerald-300', bar: 'bg-emerald-500', bg: 'bg-emerald-50' };
  if (pct >= 65) return { label: 'Good',         color: 'text-sky-700',     ring: 'ring-sky-300',     bar: 'bg-sky-500',     bg: 'bg-sky-50'     };
  if (pct >= 50) return { label: 'Moderate',     color: 'text-amber-700',   ring: 'ring-amber-300',   bar: 'bg-amber-400',   bg: 'bg-amber-50'   };
  if (pct >= 30) return { label: 'Low',           color: 'text-orange-700',  ring: 'ring-orange-300',  bar: 'bg-orange-400',  bg: 'bg-orange-50'  };
  return           { label: 'Very Low',     color: 'text-red-700',     ring: 'ring-red-300',     bar: 'bg-red-400',     bg: 'bg-red-50'     };
}

// Compact SVG arc gauge
function ConfidenceGauge({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const grade = confidenceGrade(pct);

  // Half-circle arc parameters
  const r = 54;
  const cx = 72;
  const cy = 72;
  const circumference = Math.PI * r; // half circle
  const dash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="144" height="80" viewBox="0 0 144 80">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={pct >= 80 ? '#10b981' : pct >= 65 ? '#0ea5e9' : pct >= 50 ? '#f59e0b' : pct >= 30 ? '#f97316' : '#ef4444'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}
        />
        {/* Centre value */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a">
          {pct}%
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748b">
          AVG CONFIDENCE
        </text>
      </svg>
      <span className={`text-sm font-bold px-3 py-0.5 rounded-full ring-2 ${grade.ring} ${grade.bg} ${grade.color}`}>
        {grade.label}
      </span>
    </div>
  );
}

// Mini bar chart of per-observation confidence over time
function ObservationChart({ observations }: { observations: Array<{ confidence: number; emotion: string; timestamp: string }> }) {
  if (!observations || observations.length === 0) return null;

  const maxBars = 30; // cap to last 30 for readability
  const shown = observations.slice(-maxBars);
  const barW = Math.max(4, Math.floor(100 / shown.length));

  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confidence Over Time</p>
      <div className="flex items-end gap-[2px] h-16 bg-slate-50 rounded-xl px-2 py-2 border border-slate-100">
        {shown.map((obs, i) => {
          const h = Math.max(4, (obs.confidence / 100) * 48);
          const g = confidenceGrade(obs.confidence);
          return (
            <div
              key={i}
              title={`${formatEmotionLabel(obs.emotion)} – ${obs.confidence}%`}
              className={`${g.bar} rounded-sm flex-1 cursor-pointer transition-opacity hover:opacity-80`}
              style={{ height: `${h}px`, minWidth: `${barW}px` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1 px-1">
        <span>Session Start</span>
        <span>Session End</span>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Results() {
  const { sessionId } = useParams();
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3001/api/sessions/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSession(data.message ? null : data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId, token]);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading report...</div>;

  if (!session) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-20">
        <FileWarning className="text-slate-300 mx-auto mb-4" size={64} />
        <h2 className="text-xl font-bold text-slate-900 mb-2">No reports available yet.</h2>
        <p className="text-slate-500 font-medium mb-8">Complete a therapy session to generate your first report.</p>
        <Link to="/dashboard" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">Go to Dashboard</Link>
      </div>
    );
  }

  const mins = Math.floor(session.duration / 60).toString().padStart(2, '0');
  const secs = (session.duration % 60).toString().padStart(2, '0');

  const avgConf = Math.round(session.avgConfidence ?? 0);
  const grade = confidenceGrade(avgConf);
  const hasObservations = session.observations && session.observations.length > 0;
  const noConf = avgConf === 0 && !hasObservations;

  // Emotion breakdown from observations (consolidated to 3 emotions)
  const emotionCounts: Record<string, number> = {};
  if (hasObservations) {
    for (const obs of session.observations) {
      const e = formatEmotionLabel(obs.emotion).toLowerCase();
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    }
  }
  const total = session.observations?.length ?? 0;

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col items-center">

      {/* Header */}
      <div className="w-full text-center mb-10">
        <span className="text-6xl mb-4 block">🎉</span>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Session Complete</h1>
        <p className="text-slate-500 font-medium mt-2">
          {session.exercise?.name} — {session.exercise?.category}
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl p-8 w-full space-y-8">

        {/* Row 1: Exercise · Duration · Emotion */}
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="bg-slate-50 p-5 rounded-2xl flex flex-col items-center text-center">
            <Target className="text-sky-500 mb-2" size={26} />
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Exercise</p>
            <p className="font-bold text-slate-900 text-base leading-tight">{session.exercise?.name}</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl flex flex-col items-center text-center">
            <Clock className="text-sky-500 mb-2" size={26} />
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              {session.targetDuration ? 'Completed / Target' : 'Duration'}
            </p>
            <p className="font-black text-slate-900 text-3xl tabular-nums font-mono">{mins}:{secs}</p>
            {session.targetDuration && (
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Target: {Math.floor(session.targetDuration / 60)}m ({Math.min(100, Math.round(((session.duration || 0) / session.targetDuration) * 100))}% completed)
              </p>
            )}
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl flex flex-col items-center text-center">
            <Brain className="text-sky-500 mb-2" size={26} />
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Dominant Emotion</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl">{emotionEmoji[formatEmotionLabel(session.dominantEmotion).toLowerCase()] || '😐'}</span>
              <p className="font-bold text-slate-900 text-xl">{formatEmotionLabel(session.dominantEmotion)}</p>
            </div>
          </div>
        </div>

        {/* ── CONFIDENCE SCORE SECTION ────────────────────────────────── */}
        <div className={`rounded-2xl border p-6 ${grade.bg} ${grade.ring.replace('ring-', 'border-')}`}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className={`${grade.color}`} size={20} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">AI Detection Confidence Score</h2>
          </div>

          {noConf ? (
            /* No observations at all */
            <div className="text-center py-4">
              <p className="text-slate-500 font-medium">No emotion observations were recorded during this session.</p>
              <p className="text-slate-400 text-sm mt-1">Enable the camera before starting the session to capture confidence data.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-8">

              {/* Arc gauge */}
              <div className="shrink-0">
                <ConfidenceGauge value={avgConf} />
              </div>

              {/* Detail panel */}
              <div className="flex-1 w-full space-y-4">

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Average Detection Confidence</span>
                    <span className={grade.color}>{avgConf}%</span>
                  </div>
                  <div className="h-3 w-full bg-white/60 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${grade.bar}`}
                      style={{ width: `${avgConf}%` }}
                    />
                  </div>
                </div>

                {/* Interpretation */}
                <div className="bg-white/60 rounded-xl p-3 border border-slate-100">
                  {avgConf >= 80 && (
                    <p className="text-sm text-emerald-700 font-medium">
                      <strong>Excellent confidence!</strong> The AI model detected your expressions with high reliability throughout the session.
                    </p>
                  )}
                  {avgConf >= 65 && avgConf < 80 && (
                    <p className="text-sm text-sky-700 font-medium">
                      <strong>Good confidence.</strong> Most frames were analysed reliably. Ensure your face stays well-lit for even better accuracy.
                    </p>
                  )}
                  {avgConf >= 50 && avgConf < 65 && (
                    <p className="text-sm text-amber-700 font-medium">
                      <strong>Moderate confidence.</strong> Some frames had uncertain detections. Better lighting and keeping your face visible will improve scores.
                    </p>
                  )}
                  {avgConf >= 30 && avgConf < 50 && (
                    <p className="text-sm text-orange-700 font-medium">
                      <strong>Low confidence.</strong> Many frames were difficult to analyse. Try ensuring your face is fully visible and well lit.
                    </p>
                  )}
                  {avgConf < 30 && avgConf > 0 && (
                    <p className="text-sm text-red-700 font-medium">
                      <strong>Very low confidence.</strong> The model struggled to detect expressions. This may affect the accuracy of your session report.
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">
                    Confidence represents AI model certainty, not a medical measurement. Results are estimates only.
                  </p>
                </div>

                {/* Stats row */}
                {hasObservations && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/60 rounded-xl p-2 border border-slate-100 text-center">
                      <p className="text-xs text-slate-400 font-medium">Observations</p>
                      <p className="font-black text-slate-800 text-lg">{total}</p>
                    </div>
                    <div className="bg-white/60 rounded-xl p-2 border border-slate-100 text-center">
                      <p className="text-xs text-slate-400 font-medium">High Conf. (&gt;70%)</p>
                      <p className={`font-black text-lg ${grade.color}`}>
                        {session.observations.filter((o: any) => o.confidence >= 70).length}
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-xl p-2 border border-slate-100 text-center">
                      <p className="text-xs text-slate-400 font-medium">Peak Conf.</p>
                      <p className="font-black text-slate-800 text-lg">
                        {Math.max(...session.observations.map((o: any) => o.confidence))}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Confidence timeline */}
                {hasObservations && <ObservationChart observations={session.observations} />}
              </div>
            </div>
          )}
        </div>

        {/* Emotion breakdown */}
        {hasObservations && Object.keys(emotionCounts).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-indigo-500" size={18} />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Emotion Breakdown</h2>
            </div>
            <div className="space-y-2">
              {Object.entries(emotionCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([emotion, count]) => {
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={emotion} className="flex items-center gap-3">
                      <span className="text-lg w-6 text-center">{emotionEmoji[emotion] || '😐'}</span>
                      <span className="text-sm font-semibold text-slate-700 w-32">{formatEmotionLabel(emotion)}</span>
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-500 w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Recommendation */}
        {session.recommendation ? (
          <div className="p-5 bg-green-50 rounded-2xl border border-green-200 flex gap-3">
            <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-green-800 mb-1">Personalised Recommendation</h3>
              <p className="text-green-700 font-medium italic">"{session.recommendation}"</p>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <h3 className="font-bold text-slate-600 mb-1">Recommendation</h3>
            <p className="text-slate-500 font-medium text-sm">Complete more sessions to unlock personalised guidance based on your emotional patterns.</p>
          </div>
        )}

        {/* Actions & PDF Download */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <button
            onClick={() => generateSessionPDF(session, user?.name, user?.email)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 w-full sm:w-auto"
          >
            <Download size={18} />
            Download PDF Report
          </button>
          <Link to="/dashboard" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition text-center w-full sm:w-auto">
            Go to Dashboard
          </Link>
          <Link to="/exercises" className="px-6 py-3 bg-sky-100 text-sky-700 rounded-xl font-bold hover:bg-sky-200 transition text-center w-full sm:w-auto">
            Start Another Session
          </Link>
          <Link to="/history" className="px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition text-center w-full sm:w-auto">
            View History
          </Link>
        </div>

      </div>
    </div>
  );
}
