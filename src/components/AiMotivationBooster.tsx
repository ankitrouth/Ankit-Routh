import React, { useState } from 'react';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  Copy, 
  Check, 
  Compass, 
  Flame, 
  Award,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AiMotivationalQuote, AspirantProfile } from '../types';

interface AiMotivationBoosterProps {
  profile: AspirantProfile;
  currentQuote: AiMotivationalQuote;
  setCurrentQuote: (q: AiMotivationalQuote) => void;
  tasksCompleted: number;
  hoursStudied: number;
}

export const AiMotivationBooster: React.FC<AiMotivationBoosterProps> = ({
  profile,
  currentQuote,
  setCurrentQuote,
  tasksCompleted,
  hoursStudied,
}) => {
  const [selectedMood, setSelectedMood] = useState('Feeling overwhelmed by syllabus backlog');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const moodOptions = [
    { label: 'Exhausted by Revision', query: 'Feeling overwhelmed by syllabus backlog and revision fatigue' },
    { label: 'Post-Mock Low Score', query: 'Demotivated after scoring low in recent Prelims mock test' },
    { label: 'Pre-Exam Anxiety', query: 'Anxious about the vast competition and exam pressure' },
    { label: 'Need Sharp Focus', query: 'Struggling with phone distractions and procrastination' },
    { label: 'LBSNAA Dream Fire', query: 'Hungry to push limits and build unbreakable civil service resolve' },
  ];

  const handleGenerateQuote = async (moodQuery?: string) => {
    const activeMood = moodQuery || selectedMood;
    setLoading(true);

    // Stop speaking if playing
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const response = await fetch('/api/ai/generate-motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aspirantName: profile.name,
          targetYear: profile.targetYear,
          streakDays: profile.streakDays,
          mood: activeMood,
          stageFocus: profile.stageFocus,
          tasksCompleted,
          hoursStudied,
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setCurrentQuote(resJson.data);
        try {
          confetti({
            particleCount: 35,
            spread: 50,
            origin: { y: 0.7 },
          });
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${currentQuote.quote}. By ${currentQuote.authorOrAttribution}. Mentor Note: ${currentQuote.personalMentorNote}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(`${currentQuote.quote} — ${currentQuote.authorOrAttribution}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden transition-all">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Label & Actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400 block">
              Personalized AI Motivational Booster
            </span>
            <span className="text-xs text-slate-400">
              Tailored for {profile.name} • {profile.streakDays}-Day Streak
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Read aloud toggle */}
          {'speechSynthesis' in window && (
            <button
              onClick={handleToggleSpeak}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title={isSpeaking ? 'Stop voice readout' : 'Listen to mentor quote'}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Copy quote */}
          <button
            onClick={handleCopyQuote}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Copy quote"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Generate Fresh Button */}
          <button
            onClick={() => handleGenerateQuote()}
            disabled={loading}
            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition-colors cursor-pointer disabled:opacity-60"
            title="Generate fresh AI quote"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quote Display Area */}
      <div className="my-2 py-2">
        <p className="text-sm sm:text-base text-slate-100 font-serif-scholarly leading-relaxed italic border-l-3 border-amber-400 pl-3.5 py-0.5">
          {currentQuote.quote}
        </p>
        <span className="text-xs font-semibold text-amber-400/90 block mt-1.5 pl-3.5 font-mono">
          — {currentQuote.authorOrAttribution}
        </span>
      </div>

      {/* Personal Mentor Direct Note */}
      {currentQuote.personalMentorNote && (
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl my-2.5 text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-amber-300 mr-1.5">Direct Mentor Note:</span>
          {currentQuote.personalMentorNote}
        </div>
      )}

      {/* Action for next hour & LBSNAA Mantra Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
        {currentQuote.actionForNextHour && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-amber-400 font-bold whitespace-nowrap">⚡ Next Step:</span>
            <span className="truncate">{currentQuote.actionForNextHour}</span>
          </div>
        )}

        {currentQuote.lbsnaaMantra && (
          <span className="px-2 py-0.5 rounded-md bg-amber-950/50 border border-amber-800/50 text-amber-300 font-mono text-[10px] self-start sm:self-auto font-medium">
            {currentQuote.lbsnaaMantra}
          </span>
        )}
      </div>

      {/* Mobile-Friendly Mood Booster Chips */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
          Select Your Current Mood for AI Calibration:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {moodOptions.map((m) => (
            <button
              key={m.label}
              disabled={loading}
              onClick={() => {
                setSelectedMood(m.query);
                handleGenerateQuote(m.query);
              }}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all cursor-pointer whitespace-nowrap"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
