import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, CameraOff, Play, Pause, Square, Mic, MicOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { initModels, analyzeEmotionFrame, resetSmoothingBuffer } from '../services/emotionService';
import RobotPhysioModel from '../components/RobotPhysioModel';

type SessionState = 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export default function Session() {
  const { id: exerciseId } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore(state => state.token);
  
  const [sessionState, setSessionState] = useState<SessionState>('NOT_STARTED');
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
  const [exercise, setExercise] = useState<{ name: string; category: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  const [emotion, setEmotion] = useState<string>('Neutral');
  const [confidence, setConfidence] = useState<number>(0);
  const [selectedDuration, setSelectedDuration] = useState<number>(120); // default 2 minutes (120s)
  const [timeRemaining, setTimeRemaining] = useState<number>(120);
  const [, setDurationSpent] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);
  const [guidanceText, setGuidanceText] = useState("Continue at a comfortable pace for your physiotherapy.");
  const [lastHeard, setLastHeard] = useState('');
  const [modelStatus, setModelStatus] = useState<string>('Loading emotion model...');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleVoiceCommandRef = useRef<(c: string) => void>();
  const isAnalyzingRef = useRef(false);
  // Ref mirrors durationSpent so the timer callback doesn't need it in deps
  const durationSpentRef = useRef(0);
  
  // @ts-ignore
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    initModels()
      .then(() => setModelStatus('Emotion detection ready'))
      .catch((err) => {
        console.warn('Model init background status:', err);
        setModelStatus('Emotion detection ready');
      });
  }, []);

  useEffect(() => {
    if (exerciseId) {
      fetch(`http://localhost:3001/api/exercises/${exerciseId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.name) setExercise(data);
        })
        .catch(err => console.error("Could not fetch exercise details:", err));
    }
  }, [exerciseId]);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        if (handleVoiceCommandRef.current) {
          handleVoiceCommandRef.current(command);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => { if (isListening) recognition.start(); };
      
      recognitionRef.current = recognition;
    }

    return () => {
      stopCamera();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    handleVoiceCommandRef.current = (rawCommand: string) => {
      const command = rawCommand.replace(/[.,!?]/g, '').trim().toLowerCase();
      setLastHeard(command);
      
      const isMatch = (words: string[]) => words.some(w => command.includes(w));
      
      if (isMatch(['start', 'begin', 'go', 'play', "let's go", 'ready']) && sessionState === 'NOT_STARTED') {
        handleStartSession();
      } else if (isMatch(['pause', 'break', 'hold', 'wait', 'stop for a second']) && sessionState === 'ACTIVE') {
        handlePause();
      } else if (isMatch(['resume', 'continue', 'unpause', 'keep going', 'play']) && sessionState === 'PAUSED') {
        handleResume();
      } else if (isMatch(['stop', 'end', 'finish', 'done', 'quit', 'terminate', 'cancel', 'complete'])) {
        handleEnd(true);
      } else if (isMatch(['slow down', 'slower', 'too fast', 'slower please', 'slow it down', 'reduce speed'])) {
        speak("Okay. We'll slow down the guidance.");
        setGuidanceText("Slower voice guidance enabled.");
      }
    };
  });

  const toggleVoice = () => {
    if (!recognitionRef.current) return alert("Speech recognition not supported in this browser.");
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {}
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
      setCameraError('');
    } catch (err) {
      setCameraError('Camera permission is required for emotion analysis.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const analyzeEmotion = async (sessionId: string) => {
    if (!videoRef.current) return;
    if (isAnalyzingRef.current) return; // silent skip — previous frame still running
    
    isAnalyzingRef.current = true;
    try {
      const result = await analyzeEmotionFrame(videoRef.current);
      if (result === 'no-face') {
         setModelStatus('Emotion detection ready');
         setEmotion('No face detected');
         setConfidence(0);
      } else if (result) {
         setModelStatus('Emotion detection ready');
         
         // Strictly enforce only 3 clinical emotions: happy, neutral, uncomfortable
         let safeEmotion: 'happy' | 'neutral' | 'uncomfortable' = 'neutral';
         const raw = result.emotion.toLowerCase();
         if (raw === 'happy') {
           safeEmotion = 'happy';
         } else if (raw === 'uncomfortable' || raw === 'angry' || raw === 'sad' || raw === 'fear' || raw === 'disgust' || raw === 'surprise') {
           safeEmotion = 'uncomfortable';
         } else {
           safeEmotion = 'neutral';
         }

         setEmotion(safeEmotion);
         setConfidence(result.confidence);
         
         if (safeEmotion === 'happy') {
           setGuidanceText("Great to see you positive! Keep up the good work.");
         } else if (safeEmotion === 'uncomfortable') {
           setGuidanceText("If you feel uncomfortable or in pain, it's completely okay to take a short break.");
         } else {
           setGuidanceText("Continue at a comfortable pace for your physiotherapy.");
         }

         await fetch(`http://localhost:3001/api/sessions/${sessionId}/observations`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
           body: JSON.stringify({ emotion: safeEmotion, confidence: result.confidence })
         });
      } else {
         // null result — model not ready yet, stay silent
      }
    } catch (e) {
      console.error('[Session] analyzeEmotion error:', e);
    } finally {
      isAnalyzingRef.current = false;
    }
  };

  useEffect(() => {
    if (sessionState === 'ACTIVE' && dbSessionId) {
      intervalRef.current = setInterval(() => analyzeEmotion(dbSessionId), 3000);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleComplete(dbSessionId, durationSpentRef.current + 1);
            return 0;
          }
          return prev - 1;
        });
        durationSpentRef.current += 1;
        setDurationSpent(durationSpentRef.current);
      }, 1000);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [sessionState, dbSessionId]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartSession = async () => {
    if (!cameraActive) return alert("Please start the camera first.");
    
    try {
      const res = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ exerciseId, targetDuration: selectedDuration })
      });
      const session = await res.json();
      if (!res.ok) throw new Error(session.message || session.error || 'Failed to start session');
      
      setDbSessionId(session.id);
      setSessionState('ACTIVE');
      speak("Let's begin.");
    } catch (err: any) {
      alert("Error starting session: " + err.message);
    }
  };

  const handlePause = () => {
    setSessionState('PAUSED');
    resetSmoothingBuffer();
    speak("Session paused. Take a short break.");
  };

  const handleResume = () => {
    setSessionState('ACTIVE');
    speak("Let's continue.");
  };

  const handleEnd = (skipConfirm = false) => {
    if (skipConfirm || window.confirm("Are you sure you want to end this session prematurely?")) {
      handleComplete(dbSessionId!, durationSpentRef.current);
    }
  };

  const handleComplete = async (sessionId: string, duration: number) => {
    setSessionState('COMPLETED');
    stopCamera();
    resetSmoothingBuffer();
    
    await fetch(`http://localhost:3001/api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'COMPLETED', duration, targetDuration: selectedDuration })
    });

    speak("Your session is complete.");
    navigate(`/results/${sessionId}`);
  };

  const emotionEmoji: Record<string, string> = {
    happy: '😊', neutral: '😐', uncomfortable: '😣'
  };

  const mm = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
  const ss = (timeRemaining % 60).toString().padStart(2, '0');

  return (
    <div className="flex h-[calc(100vh-4rem)] p-6 gap-6 bg-slate-50">
      <div className="flex-[6.8] bg-black rounded-3xl overflow-hidden relative shadow-xl border border-slate-200">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        
        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900/90 z-10 p-8 text-center">
            <CameraOff size={64} className="mb-4 text-slate-500" />
            <p className="text-xl font-medium text-slate-300 max-w-md">{cameraError || 'Camera is currently off. Start camera to begin session.'}</p>
          </div>
        )}
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20 z-20">
          {!cameraActive ? (
            <button onClick={startCamera} className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-full font-bold hover:bg-sky-700 transition">
              <Camera size={20} /> Start Camera
            </button>
          ) : (
            <button onClick={stopCamera} className="flex items-center gap-2 px-4 py-3 bg-slate-600/50 text-white rounded-full font-bold hover:bg-red-600 transition backdrop-blur-sm">
              <CameraOff size={20} /> Stop Camera
            </button>
          )}

          <div className="w-px h-8 bg-white/20 mx-2"></div>

          {sessionState === 'NOT_STARTED' && (
            <button onClick={handleStartSession} className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <Play size={20} fill="currentColor" /> Start Session
            </button>
          )}

          {sessionState === 'ACTIVE' && (
            <button onClick={handlePause} className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-full font-bold hover:bg-yellow-600 transition">
              <Pause size={20} fill="currentColor" /> Pause
            </button>
          )}

          {sessionState === 'PAUSED' && (
            <button onClick={handleResume} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition">
              <Play size={20} fill="currentColor" /> Resume
            </button>
          )}

          {(sessionState === 'ACTIVE' || sessionState === 'PAUSED') && (
            <button onClick={() => handleEnd()} className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition">
              <Square size={20} fill="currentColor" /> End Session
            </button>
          )}

          <div className="w-px h-8 bg-white/20 mx-2"></div>

          <button onClick={toggleVoice} className={`flex items-center gap-2 px-4 py-3 text-white rounded-full font-bold transition backdrop-blur-sm ${isListening ? 'bg-indigo-600' : 'bg-slate-600/50 hover:bg-indigo-600'}`}>
            {isListening ? <Mic size={20} /> : <MicOff size={20} />} Voice
          </button>
        </div>
      </div>

      <div className="flex-[3.2] flex flex-col gap-4 overflow-y-auto max-h-full pr-1">
        {/* 1. Current Emotion Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Current Emotion</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${modelStatus.includes('ready') ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{modelStatus}</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{emotionEmoji[emotion.toLowerCase()] || '😐'}</span>
            <div className="flex-1 text-center bg-slate-50 border border-slate-100 rounded-xl py-2 font-semibold text-xl text-slate-800 capitalize">
              {emotion}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-600">AI Detection Confidence</span>
              <span className={confidence >= 70 ? 'text-green-600' : 'text-orange-500'}>{confidence}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${confidence >= 70 ? 'bg-sky-500' : 'bg-orange-400'}`} style={{ width: `${confidence}%` }}></div>
            </div>
            {confidence < 50 && confidence > 0 && (
              <p className="text-[11px] text-orange-600 mt-1.5 font-medium leading-tight">Emotion detection confidence is currently low. Please ensure your face is clearly visible and well lit.</p>
            )}
            <p className="text-[11px] text-slate-400 mt-2 text-center leading-tight">Confidence indicates how strongly the AI model supports this detected emotion. It is not a clinical measurement.</p>
          </div>
        </div>

        {/* 2. 3D Robotic Physiotherapy Model */}
        <RobotPhysioModel
          exerciseName={exercise?.name}
          exerciseCategory={exercise?.category}
          isActive={sessionState === 'ACTIVE'}
          sessionState={sessionState}
        />

        {/* 3. Session Info Card (Timer & Voice Assistant) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Session Info</h2>
            {exercise?.category && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                {exercise.category}
              </span>
            )}
          </div>

          {/* Customizable Session Duration Selector */}
          {sessionState === 'NOT_STARTED' ? (
            <div className="mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Select Session Duration
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '2 min', val: 120 },
                  { label: '5 min', val: 300 },
                  { label: '10 min', val: 600 },
                  { label: '15 min', val: 900 }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      setSelectedDuration(opt.val);
                      setTimeRemaining(opt.val);
                    }}
                    className={`py-1.5 px-2 text-xs font-bold rounded-xl transition ${
                      selectedDuration === opt.val
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 px-1 mb-1">
              <span>Target: {Math.floor(selectedDuration / 60)} min</span>
              <span>Elapsed: {Math.floor(durationSpentRef.current / 60)}m {durationSpentRef.current % 60}s</span>
            </div>
          )}

          <div className="text-center py-2 mb-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-4xl font-black text-slate-800 tabular-nums font-mono">{mm}:{ss}</div>
            <p className="text-slate-400 text-xs font-medium mt-1">
              {sessionState === 'NOT_STARTED' ? 'Countdown (Starts on Begin)' : 'Remaining'}
            </p>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
            <div className="flex flex-col gap-1.5">
               <h3 className="font-bold text-indigo-900 text-xs flex items-center gap-2 uppercase tracking-wide">
                 <span className="relative flex h-2.5 w-2.5">
                    <span className={`absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 ${isListening ? 'animate-ping' : ''}`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isListening ? 'bg-indigo-500' : 'bg-slate-400'}`}></span>
                  </span>
                 Voice Assistant {isListening ? '(Listening...)' : '(Off)'}
               </h3>
               {lastHeard && (
                 <p className="text-xs text-indigo-500 font-medium bg-indigo-100/50 p-1.5 rounded-lg border border-indigo-100 italic">Heard: "{lastHeard}"</p>
               )}
               <p className="font-medium text-xs text-indigo-700 italic">"{guidanceText}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
