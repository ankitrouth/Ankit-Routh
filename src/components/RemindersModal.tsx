import React, { useState } from 'react';
import { 
  Bell, 
  Clock, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Volume2, 
  AlertCircle, 
  ShieldCheck,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyReminder } from '../types';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: StudyReminder[];
  setReminders: React.Dispatch<React.SetStateAction<StudyReminder[]>>;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  reminders,
  setReminders,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('07:00');
  const [category, setCategory] = useState('Prelims');
  const [label, setLabel] = useState('Deep Work Slot');
  const [testChimePlaying, setTestChimePlaying] = useState(false);

  if (!isOpen) return null;

  // Toggle reminder enabled
  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  // Play gentle bell chime
  const playReminderChime = () => {
    setTestChimePlaying(true);
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };

        playTone(587.33, 0, 0.5); // D5
        playTone(880.00, 0.2, 0.8); // A5
      }
    } catch (e) {}

    setTimeout(() => setTestChimePlaying(false), 1200);
  };

  // Request browser notification permission
  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('UPSC Study Reminder', {
          body: 'Reminders enabled! You will be alerted for your daily study slots.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newRem: StudyReminder = {
      id: `rem-${Date.now()}`,
      title: title.trim(),
      time,
      category,
      enabled: true,
      repeatDaily: true,
      label: label.trim() || 'Daily Target',
    };

    setReminders((prev) => [...prev, newRem]);
    setTitle('');
    setShowAddForm(false);
    try {
      confetti({ particleCount: 25, spread: 40 });
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                Daily Study Reminders
              </h3>
              <p className="text-[11px] text-slate-400">
                Punctual alerts for high-yield UPSC study sessions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Permission & Audio test row */}
        <div className="flex items-center justify-between py-2.5 px-3 bg-slate-950/70 border border-slate-800 rounded-xl my-3 text-xs">
          <button
            onClick={playReminderChime}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 cursor-pointer font-medium"
          >
            <Volume2 className={`w-3.5 h-3.5 ${testChimePlaying ? 'animate-bounce' : ''}`} />
            <span>Test Bell Chime</span>
          </button>

          {'Notification' in window && (
            <button
              onClick={requestBrowserPermission}
              className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium"
            >
              Enable Browser Alerts
            </button>
          )}
        </div>

        {/* Reminders List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No reminders set. Click "Add Reminder" below to create daily alerts!
            </div>
          ) : (
            reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  rem.enabled
                    ? 'bg-slate-950/90 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-center flex-shrink-0 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
                    <span className="font-mono font-bold text-xs text-amber-400 block">
                      {rem.time}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase">Daily</span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {rem.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {rem.category}
                      </span>
                      {rem.label && (
                        <span className="text-[10px] text-slate-500 truncate">
                          • {rem.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle switch */}
                  <button
                    onClick={() => toggleReminder(rem.id)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      rem.enabled ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                        rem.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => deleteReminder(rem.id)}
                    className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Form or Add Button */}
        {showAddForm ? (
          <form onSubmit={handleAddReminder} className="pt-3 border-t border-slate-800 space-y-2.5">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Reminder Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Evening Mains DAW Practice"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
                >
                  <option value="Prelims">Prelims GS</option>
                  <option value="Current Affairs">Current Affairs</option>
                  <option value="Answer Writing">Answer Writing</option>
                  <option value="Optional">Optional</option>
                  <option value="CSAT">CSAT</option>
                  <option value="Revision">Revision</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer"
              >
                Save Alert
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Custom Reminder</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
