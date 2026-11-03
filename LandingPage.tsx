import { Link } from 'react-router-dom';
import { BrainCircuit, Activity, Mic, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-sky-200">
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center relative z-10">
        <div className="text-2xl font-bold tracking-tight text-sky-600">
          EMOCARE<span className="text-slate-800">-AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#how-it-works" className="hover:text-sky-600 transition-colors">How It Works</a>
          <a href="#features" className="hover:text-sky-600 transition-colors">Features</a>
          <a href="#privacy" className="hover:text-sky-600 transition-colors">Privacy</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-sky-600">Login</Link>
          <Link to="/dashboard" className="px-5 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-full hover:bg-sky-700 shadow-md shadow-sky-200 transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center relative max-w-5xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-100 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
        <span className="inline-block py-1.5 px-4 rounded-full bg-sky-100 text-sky-700 font-semibold text-sm mb-6 border border-sky-200">
          Next-Generation AI Assistance
        </span>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-slate-900 relative z-10">
          Personalized Rehabilitation, <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">
            Powered by Emotional Intelligence.
          </span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed relative z-10">
          EMOCARE-AI uses facial emotion analysis and adaptive guidance to create a more personalized, responsive, and effective rehabilitation experience.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
          <Link to="/dashboard" className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all w-full sm:w-auto">
            Start Your Session
          </Link>
          <a href="#how-it-works" className="px-8 py-4 bg-white text-slate-700 rounded-full font-bold text-lg hover:bg-slate-50 shadow-md shadow-slate-200 transition-all border border-slate-200 w-full sm:w-auto text-center">
            How It Works
          </a>
        </div>
      </section>

      {/* Dashboard Preview Mockup Section */}
      <section className="container mx-auto px-6 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] shadow-2xl p-4 border border-slate-200">
          <div className="rounded-[1.5rem] bg-slate-50 border border-slate-100 overflow-hidden relative aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <BrainCircuit className="text-sky-600" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Conceptual Interface Demonstration</h3>
              <p className="text-slate-500 mt-2">Live camera emotion detection & personalized voice guidance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-16">Intelligent Patient Support</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BrainCircuit size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Emotion-Aware</h3>
              <p className="text-slate-600 leading-relaxed">Adapts guidance based on your real-time emotional responses during sessions.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mic size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Voice Control</h3>
              <p className="text-slate-600 leading-relaxed">Hands-free interaction using voice commands like "pause," "resume," and "slow down."</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Activity size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Progress Tracking</h3>
              <p className="text-slate-600 leading-relaxed">Detailed analytics and reports showing session completions and emotion trends over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <Shield size={48} className="mx-auto mb-6 text-sky-400" />
          <h2 className="text-3xl font-bold mb-6">Privacy-First Architecture</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Your privacy is critical. The camera is active only during your session, and raw video footage is never stored on our servers. Voice processing is similarly ephemeral and controlled explicitly by your permission.
          </p>
          <Link to="/dashboard" className="inline-block px-8 py-4 bg-sky-500 text-white rounded-full font-bold text-lg hover:bg-sky-400 transition-all">
            Start Your Journey
          </Link>
        </div>
      </section>
    </div>
  );
}
