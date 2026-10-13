import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Clock, BookOpen, Flame, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySession } from '../types';

interface FocusTimerProps {
  onSessionComplete: (session: Omit<StudySession, 'id' | 'date'>) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ onSessionComplete }) => {
  const [selectedSubject, setSelectedSubject] = useState('Indian Polity');
  const [topicName, setTopicName] = useState('');
  const [sessionType, setSessionType] = useState<StudySession['sessionType']>('reading');
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(50 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [energyRating, setEnergyRating] = useState(4);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Quick preset buttons tailored for UPSC study patterns
  const presets = [
    { label: '50m Deep Slot', minutes: 50, type: 'reading' as const },
    { label: '90m Static Block', minutes: 90, type: 'reading' as const },
    { label: '25m Pomodoro', minutes: 25, type: 'revision' as const },
    { label: '7m 10-Marker Sprint', minutes: 7, type: 'answer_writing' as const },
    { label: '11m 15-Marker Sprint', minutes: 11, type: 'answer_writing' as const },
  ];

  const subjects = [
    'Indian Polity',
    'Modern History',
    'Ancient & Medieval',
    'Geography',
    'Indian Economy',
    'Environment & Ecology',
    'Science & Technology',
    'Ethics (GS4)',
    'Current Affairs (Newspaper)',
    'CSAT Paper II',
    'Optional Subject',
    'Essay Writing',
  ];

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleTimerFinished();
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
  }, [isRunning]);

  const handleTimerFinished = () => {
    // Trigger confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore
    }
    setShowLogModal(true);
  };

  const setPreset = (mins: number, type: StudySession['sessionType']) => {
    setIsRunning(false);
    setDurationMinutes(mins);
    setTimeLeftSeconds(mins * 60);
    setSessionType(type);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeftSeconds(durationMinutes * 60);
  };

  const handleManualSave = () => {
    const elapsedMinutes = Math.max(1, Math.round((durationMinutes * 60 - timeLeftSeconds) / 60));
    onSessionComplete({
      durationMinutes: elapsedMinutes,
      subject: selectedSubject,
      topic: topicName || `${selectedSubject} Deep Work`,
      sessionType,
      energyRating,
      notes: sessionNotes,
    });

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    setShowLogModal(false);
    setTimeLeftSeconds(durationMinutes * 60);
    setIsRunning(false);
    setTopicName('');
    setSessionNotes('');
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const progressPercent = ((durationMinutes * 60 - timeLeftSeconds) / (durationMinutes * 60)) * 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
            UPSC Deep Focus Stopwatch
          </h3>
        </div>
        <span className="text-[11px] text-amber-300/80 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full font-mono">
          {sessionType.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setPreset(p.minutes, p.type)}
            className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
              durationMinutes === p.minutes && sessionType === p.type
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Subject & Topic input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">Subject Focus</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
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
          <label className="block text-[11px] text-slate-400 mb-1">Target Topic / Chapter</label>
          <input
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="e.g. Laxmikanth Ch 22 or GS3 Food Security"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Big Timer Display */}
      <div className="flex flex-col items-center justify-center my-4 py-4 bg-slate-950/60 rounded-xl border border-slate-800/80 relative">
        <div className="text-4xl sm:text-5xl font-mono font-bold tracking-wider text-slate-100 flex items-center gap-1">
          <span>{String(minutes).padStart(2, '0')}</span>
          <span className="text-amber-400 animate-pulse">:</span>
          <span>{String(seconds).padStart(2, '0')}</span>
        </div>
        
        {/* Progress line */}
        <div className="w-48 sm:w-64 h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400 mt-2">
          {isRunning ? '🔥 Deep Work in progress... eliminate all distractions' : 'Ready to start slot'}
        </p>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all active:scale-95 ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-500/20'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" /> Pause Slot
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> Start Deep Work
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Log Work</span>
        </button>
      </div>

      {/* Modal for saving completed session */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Save Study Session
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Add details to keep your UPSC consistency streak verified.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Subject & Topic</label>
                <div className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-amber-400">{selectedSubject}</span>
                  {topicName ? ` - ${topicName}` : ''}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Energy / Retention Level (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setEnergyRating(level)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        energyRating === level
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {level} {level === 5 ? '⚡' : level === 1 ? '😴' : '⭐'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Key Takeaways / Doubts (Optional)</label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g. Mastered Article 356 restrictions; need to re-read Punchhi commission report."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleManualSave}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
              >
                Confirm &amp; Log Hours
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
