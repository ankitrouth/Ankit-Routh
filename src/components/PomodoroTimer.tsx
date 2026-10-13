import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Coffee, 
  Flame, 
  Volume2, 
  VolumeX, 
  Sparkles,
  BookOpen,
  ArrowRight,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySession } from '../types';

interface PomodoroTimerProps {
  onSessionComplete: (session: Omit<StudySession, 'id' | 'date'>) => void;
  todayStudiedMinutes: number;
}

type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work';

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  onSessionComplete,
  todayStudiedMinutes,
}) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Subject and Topic
  const [subject, setSubject] = useState('Indian Polity');
  const [topic, setTopic] = useState('Laxmikanth Ch 22: Parliament');
  const [sessionNotes, setSessionNotes] = useState('');

  // Auto-log notification toast
  const [autoLogToast, setAutoLogToast] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const subjects = [
    'Indian Polity',
    'Modern History',
    'Geography',
    'Indian Economy',
    'Environment & Ecology',
    'Ethics (GS4)',
    'Current Affairs (Newspaper)',
    'CSAT Paper II',
    'Optional Subject',
    'Answer Writing DAW',
  ];

  // Synthesized chime via Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Gentle celebratory arpeggio: C5 -> E5 -> G5 -> C6
      playTone(523.25, 0, 0.4);
      playTone(659.25, 0.15, 0.4);
      playTone(783.99, 0.3, 0.5);
      playTone(1046.50, 0.45, 0.8);
    } catch (e) {
      // AudioContext not allowed without gesture
    }
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleAutoFinishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, durationMinutes, mode, subject, topic]);

  // Handle Automatic Logging when Timer hits 0:00
  const handleAutoFinishSession = () => {
    playChime();

    if (mode === 'pomodoro' || mode === 'deep_work') {
      const completedMins = durationMinutes;
      // AUTOMATIC LOGGING to Study Session Tracker & Daily Total
      onSessionComplete({
        durationMinutes: completedMins,
        subject,
        topic: topic.trim() || `${subject} Focus Slot`,
        sessionType: mode === 'pomodoro' ? 'reading' : 'reading',
        energyRating: 5,
        notes: `Automated Pomodoro session (${completedMins} mins completed).`,
      });

      setPomodoroCount((prev) => prev + 1);

      // Trigger celebration
      try {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.65 },
        });
      } catch (e) {}

      setAutoLogToast(`🎉 ${completedMins}-Minute ${mode === 'pomodoro' ? 'Pomodoro' : 'Deep Work'} Finished! Automatically logged to daily total.`);
      setTimeout(() => setAutoLogToast(null), 6000);

      // Prompt next break
      setMode('short_break');
      setDurationMinutes(5);
      setTimeLeftSeconds(5 * 60);
    } else {
      // Break finished
      setAutoLogToast('☕ Break time over! Ready for your next high-yield study sprint?');
      setTimeout(() => setAutoLogToast(null), 5000);
      setMode('pomodoro');
      setDurationMinutes(25);
      setTimeLeftSeconds(25 * 60);
    }
  };

  // Manual Early Log
  const handleEarlyLog = () => {
    const elapsedMinutes = Math.max(1, Math.round((durationMinutes * 60 - timeLeftSeconds) / 60));
    if (elapsedMinutes > 0 && (mode === 'pomodoro' || mode === 'deep_work')) {
      onSessionComplete({
        durationMinutes: elapsedMinutes,
        subject,
        topic: topic.trim() || `${subject} Study Session`,
        sessionType: 'reading',
        energyRating: 4,
        notes: sessionNotes || `Logged ${elapsedMinutes} mins of study.`,
      });

      try {
        confetti({ particleCount: 40, spread: 50 });
      } catch (e) {}

      setAutoLogToast(`Logged ${elapsedMinutes} mins to daily study tracker.`);
      setTimeout(() => setAutoLogToast(null), 5000);
    }

    setIsRunning(false);
    setTimeLeftSeconds(durationMinutes * 60);
  };

  const handleModeSwitch = (newMode: TimerMode, mins: number) => {
    setIsRunning(false);
    setMode(newMode);
    setDurationMinutes(mins);
    setTimeLeftSeconds(mins * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeftSeconds(durationMinutes * 60);
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const progressPercent = ((durationMinutes * 60 - timeLeftSeconds) / (durationMinutes * 60)) * 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍅</span>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base leading-tight">
              Pomodoro Focus Engine
            </h3>
            <p className="text-[11px] text-slate-400">
              Auto-logs completed 25m to your daily total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={soundEnabled ? 'Chime sound enabled' : 'Chime muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-0.5 rounded-full">
            {pomodoroCount} 🍅 Today
          </span>
        </div>
      </div>

      {/* Auto-Log Success Banner */}
      {autoLogToast && (
        <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{autoLogToast}</span>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        <button
          onClick={() => handleModeSwitch('pomodoro', 25)}
          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
            mode === 'pomodoro'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          25m Focus
        </button>
        <button
          onClick={() => handleModeSwitch('short_break', 5)}
          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
            mode === 'short_break'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          5m Break
        </button>
        <button
          onClick={() => handleModeSwitch('long_break', 15)}
          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
            mode === 'long_break'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          15m Long
        </button>
        <button
          onClick={() => handleModeSwitch('deep_work', 50)}
          className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
            mode === 'deep_work'
              ? 'bg-purple-500 text-white shadow-sm'
              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          50m Deep
        </button>
      </div>

      {/* Subject & Topic inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Target Chapter / Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Laxmikanth Ch 22 or Spectrum 1857"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Big Digital Display with Circular / Gradient Line */}
      <div className="flex flex-col items-center justify-center my-3 py-4 bg-slate-950/70 rounded-xl border border-slate-800/80 relative">
        <div className="text-4xl sm:text-5xl font-mono font-bold tracking-wider text-slate-100 flex items-center gap-1">
          <span>{String(minutes).padStart(2, '0')}</span>
          <span className="text-amber-400 animate-pulse">:</span>
          <span>{String(seconds).padStart(2, '0')}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-52 sm:w-64 h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              mode === 'pomodoro'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                : mode === 'short_break' || mode === 'long_break'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-purple-500 to-indigo-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400 mt-2 font-medium">
          {isRunning 
            ? '🔥 Session active — focus with zero notifications'
            : mode === 'pomodoro' 
            ? 'Ready for 25-minute Pomodoro' 
            : 'Break time relaxation'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2.5">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95 cursor-pointer ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Start {durationMinutes}m Session
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {timeLeftSeconds < durationMinutes * 60 && (
          <button
            onClick={handleEarlyLog}
            className="px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Log elapsed minutes early"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Log Now</span>
          </button>
        )}
      </div>
    </div>
  );
};
