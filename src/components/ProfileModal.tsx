import React, { useState } from 'react';
import { AspirantProfile } from '../types';
import { User, Target, Calendar, Clock, BookOpen, RotateCcw, Save, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AspirantProfile;
  setProfile: React.Dispatch<React.SetStateAction<AspirantProfile>>;
  onResetDefaults: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  setProfile,
  onResetDefaults,
}) => {
  const [name, setName] = useState(profile.name);
  const [targetYear, setTargetYear] = useState(profile.targetYear);
  const [targetAttempt, setTargetAttempt] = useState(profile.targetAttempt);
  const [aspirantType, setAspirantType] = useState(profile.aspirantType);
  const [stageFocus, setStageFocus] = useState(profile.stageFocus);
  const [optionalSubject, setOptionalSubject] = useState(profile.optionalSubject);
  const [dailyHoursTarget, setDailyHoursTarget] = useState(profile.dailyHoursTarget);
  const [examDatePrelims, setExamDatePrelims] = useState(profile.examDatePrelims);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      name,
      targetYear,
      targetAttempt,
      aspirantType,
      stageFocus,
      optionalSubject,
      dailyHoursTarget,
      examDatePrelims,
    });
    try {
      confetti({ particleCount: 30, spread: 45 });
    } catch (e) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <User className="w-5 h-5 text-amber-400" />
          Aspirant Profile &amp; Goals Configuration
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Personalize your targets. All AI mentoring strategies will adapt to your choices.
        </p>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="text-xs text-slate-300 block mb-1">Aspirant Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Target CSE Year</label>
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
              >
                <option value={2025}>CSE 2025</option>
                <option value={2026}>CSE 2026</option>
                <option value={2027}>CSE 2027</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Attempt</label>
              <select
                value={targetAttempt}
                onChange={(e) => setTargetAttempt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
              >
                <option value="1st Attempt">1st Attempt</option>
                <option value="2nd Attempt">2nd Attempt</option>
                <option value="3rd Attempt">3rd Attempt</option>
                <option value="4th Attempt+">4th Attempt or more</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Preparation Status</label>
              <select
                value={aspirantType}
                onChange={(e) => setAspirantType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
              >
                <option value="full_time">Full-Time Aspirant</option>
                <option value="working_professional">Working Professional</option>
                <option value="college_student">College Student</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Daily Target Hours</label>
              <input
                type="number"
                step="0.5"
                min="3"
                max="14"
                value={dailyHoursTarget}
                onChange={(e) => setDailyHoursTarget(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Optional Subject</label>
              <input
                type="text"
                value={optionalSubject}
                onChange={(e) => setOptionalSubject(e.target.value)}
                placeholder="e.g. PSIR, Sociology, Geography, History"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Target Prelims Date</label>
              <input
                type="date"
                value={examDatePrelims}
                onChange={(e) => setExamDatePrelims(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset goals, syllabus, and tests to default mock data?')) {
                  onResetDefaults();
                  onClose();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
