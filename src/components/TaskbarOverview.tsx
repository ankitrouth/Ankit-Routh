import React, { useState } from 'react';
import { 
  Calendar, 
  Target, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  TrendingUp, 
  Award, 
  Plus, 
  ChevronRight,
  BarChart3,
  Layers,
  Check,
  Zap,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyGoal, MonthlyGoal, StudySession, MockTestRecord } from '../types';

interface TaskbarOverviewProps {
  goals: DailyGoal[];
  setGoals: React.Dispatch<React.SetStateAction<DailyGoal[]>>;
  monthlyGoals: MonthlyGoal[];
  setMonthlyGoals: React.Dispatch<React.SetStateAction<MonthlyGoal[]>>;
  sessions: StudySession[];
  mockTests: MockTestRecord[];
  streakDays: number;
  dailyTargetHours: number;
}

export const TaskbarOverview: React.FC<TaskbarOverviewProps> = ({
  goals,
  setGoals,
  monthlyGoals,
  setMonthlyGoals,
  sessions,
  mockTests,
  streakDays,
  dailyTargetHours,
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [showAddMonthlyModal, setShowAddMonthlyModal] = useState(false);

  // New monthly goal form
  const [newMTitle, setNewMTitle] = useState('');
  const [newMCategory, setNewMCategory] = useState<MonthlyGoal['category']>('Prelims');
  const [newMTarget, setNewMTarget] = useState('20');
  const [newMUnit, setNewMUnit] = useState('hours');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7); // '2026-10'

  // Current date calculations
  const todayDate = new Date();
  const daysInCurrentMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
  const currentDayOfMonth = todayDate.getDate();
  const monthDaysProgress = Math.round((currentDayOfMonth / daysInCurrentMonth) * 100);

  // Daily Calculations
  const todayCompletedTasks = goals.filter((g) => g.completed).length;
  const todayTotalTasks = goals.length;
  const dailyTaskPct = todayTotalTasks > 0 ? Math.round((todayCompletedTasks / todayTotalTasks) * 100) : 0;

  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const todayHours = (todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60);
  const dailyHoursPct = dailyTargetHours > 0 ? Math.min(100, Math.round((todayHours / dailyTargetHours) * 100)) : 0;

  // Monthly Calculations
  const currentMonthSessions = sessions.filter((s) => s.date.startsWith(currentMonthStr));
  const monthTotalStudyHours = currentMonthSessions.reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60;
  const currentMonthMocks = mockTests.filter((m) => m.date.startsWith(currentMonthStr)).length;

  const monthCompletedMilestones = monthlyGoals.filter((m) => m.completed).length;
  const monthTotalMilestones = monthlyGoals.length;
  const monthlyMilestonePct = monthTotalMilestones > 0 ? Math.round((monthCompletedMilestones / monthTotalMilestones) * 100) : 0;

  // Toggle monthly milestone
  const toggleMonthlyGoal = (id: string) => {
    setMonthlyGoals((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextCompleted = !m.completed;
          if (nextCompleted) {
            try {
              confetti({ particleCount: 50, spread: 60 });
            } catch (e) {}
          }
          return {
            ...m,
            completed: nextCompleted,
            currentValue: nextCompleted ? m.targetValue : Math.round(m.targetValue * 0.5),
          };
        }
        return m;
      })
    );
  };

  const handleAddMonthlyGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMTitle.trim()) return;

    const newGoal: MonthlyGoal = {
      id: `m-goal-${Date.now()}`,
      title: newMTitle.trim(),
      category: newMCategory,
      targetValue: parseFloat(newMTarget) || 10,
      currentValue: 0,
      unit: newMUnit,
      completed: false,
      month: currentMonthStr,
    };

    setMonthlyGoals((prev) => [newGoal, ...prev]);
    setNewMTitle('');
    setShowAddMonthlyModal(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Header & Daily/Monthly Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <span>Goal Check Taskbar</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {viewMode === 'daily' ? 'Today’s Quota' : `${todayDate.toLocaleString('default', { month: 'long' })} Overview`}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {viewMode === 'daily' 
                ? 'Check-list progress against today’s required study benchmarks' 
                : 'Month-to-date macro targets and milestone completion radar'}
            </p>
          </div>
        </div>

        {/* Mode Selector Pill Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Checkbar</span>
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Monthly Checkbar</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: DAILY CHECK TASKBAR */}
      {viewMode === 'daily' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Main Daily Metric Bars Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Daily Tasks Bar */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  Study Tasks:
                </span>
                <span className="text-amber-400 font-mono font-bold">
                  {todayCompletedTasks}/{todayTotalTasks} ({dailyTaskPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${dailyTaskPct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                {dailyTaskPct === 100 ? 'All scheduled chapters done! 🏆' : `${todayTotalTasks - todayCompletedTasks} tasks pending`}
              </span>
            </div>

            {/* 2. Daily Hours Bar */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Hours Target:
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  {todayHours.toFixed(1)}h / {dailyTargetHours}h ({dailyHoursPct}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${dailyHoursPct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                {todayHours >= dailyTargetHours ? 'Daily quota achieved! 🎯' : `${(dailyTargetHours - todayHours).toFixed(1)}h remaining today`}
              </span>
            </div>

            {/* 3. Consistency Streak & Energy */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Consistency Streak:
                </span>
                <span className="text-orange-400 font-mono font-bold">
                  {streakDays} Days
                </span>
              </div>
              <div className="flex gap-1 h-2 mt-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full ${
                      i < 6 ? 'bg-orange-500' : todayCompletedTasks > 0 ? 'bg-orange-400 animate-pulse' : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 block">
                7-day active consistency status verified
              </span>
            </div>
          </div>

          {/* Quick Checklist Stream */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
              <span>Quick Daily Checklist:</span>
              <span className="text-amber-400 font-mono">{todayCompletedTasks} of {todayTotalTasks} Cleared</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-2 transition-all ${
                    g.completed
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400 line-through'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${g.completed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="truncate max-w-[200px]">{g.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{g.targetHours}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MONTHLY CHECK TASKBAR */}
      {viewMode === 'monthly' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Monthly Macro Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Month Elapsed Bar */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Month Timeline:
                </span>
                <span className="text-cyan-400 font-mono font-bold">
                  Day {currentDayOfMonth} / {daysInCurrentMonth} ({monthDaysProgress}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${monthDaysProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                {daysInCurrentMonth - currentDayOfMonth} days remaining in {todayDate.toLocaleString('default', { month: 'short' })}
              </span>
            </div>

            {/* 2. Monthly Study Hours Logged */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Month Hours Logged:
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  {monthTotalStudyHours.toFixed(1)}h / 220h
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (monthTotalStudyHours / 220) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                Pacing at {(monthTotalStudyHours / (currentDayOfMonth || 1)).toFixed(1)}h/day average
              </span>
            </div>

            {/* 3. Monthly Milestone Quota */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Macro Milestones:
                </span>
                <span className="text-amber-400 font-mono font-bold">
                  {monthCompletedMilestones}/{monthTotalMilestones} ({monthlyMilestonePct}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${monthlyMilestonePct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                {monthCompletedMilestones} of {monthTotalMilestones} monthly targets cleared
              </span>
            </div>
          </div>

          {/* Monthly Check-list Items with Progress Bars */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Monthly Milestone Check-list ({todayDate.toLocaleString('default', { month: 'long' })} 2026):
              </span>
              <button
                onClick={() => setShowAddMonthlyModal(true)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Monthly Target</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {monthlyGoals.map((m) => {
                const pct = Math.min(100, Math.round((m.currentValue / (m.targetValue || 1)) * 100));
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border transition-all ${
                      m.completed
                        ? 'bg-slate-900/40 border-slate-800/70'
                        : 'bg-slate-900/90 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => toggleMonthlyGoal(m.id)}
                          className={`rounded-full transition-transform active:scale-90 flex-shrink-0 cursor-pointer ${
                            m.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 fill-emerald-950 text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span className={`text-xs font-medium truncate ${m.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                          {m.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {m.category}
                        </span>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {m.currentValue}/{m.targetValue} {m.unit}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          m.completed ? 'bg-emerald-400' : 'bg-amber-400'
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
      )}

      {/* Add Monthly Goal Modal */}
      {showAddMonthlyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              Add Monthly Study Milestone
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Set large-scale monthly checkpoints to guarantee systematic UPSC coverage.
            </p>

            <form onSubmit={handleAddMonthlyGoal} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Milestone Description</label>
                <input
                  type="text"
                  required
                  value={newMTitle}
                  onChange={(e) => setNewMTitle(e.target.value)}
                  placeholder="e.g. Complete 5 Mock Tests or Spectrum History Part 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Category</label>
                  <select
                    value={newMCategory}
                    onChange={(e) => setNewMCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Prelims">Prelims GS</option>
                    <option value="Mock Tests">Mock Tests</option>
                    <option value="Answer Writing">Answer Writing</option>
                    <option value="Optional">Optional</option>
                    <option value="Current Affairs">Current Affairs</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Target Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={newMTarget}
                    onChange={(e) => setNewMTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Unit</label>
                  <select
                    value={newMUnit}
                    onChange={(e) => setNewMUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="hours">Hours</option>
                    <option value="tests">Tests</option>
                    <option value="chapters">Chapters</option>
                    <option value="answers">Answers</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMonthlyModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
