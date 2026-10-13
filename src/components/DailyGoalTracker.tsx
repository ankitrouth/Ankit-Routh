import React, { useState } from 'react';
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Flame, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Award,
  ChevronRight,
  Filter,
  Check,
  Zap,
  BarChart2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyGoal, PaperCategory } from '../types';

interface DailyGoalTrackerProps {
  goals: DailyGoal[];
  setGoals: React.Dispatch<React.SetStateAction<DailyGoal[]>>;
  dailyTargetHours: number;
}

export const DailyGoalTracker: React.FC<DailyGoalTrackerProps> = ({
  goals,
  setGoals,
  dailyTargetHours,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New goal form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DailyGoal['category']>('Prelims');
  const [newTargetHours, setNewTargetHours] = useState('2.0');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('high');

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculations
  const totalTasks = goals.length;
  const completedTasks = goals.filter((g) => g.completed).length;
  const taskProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalTargetHours = goals.reduce((acc, curr) => acc + curr.targetHours, 0);
  const totalCompletedHours = goals.reduce((acc, curr) => acc + (curr.completed ? curr.targetHours : curr.completedHours), 0);
  const hoursProgressPercent = totalTargetHours > 0 
    ? Math.min(100, Math.round((totalCompletedHours / totalTargetHours) * 100)) 
    : 0;

  // UPSC 4 Pillars category breakdown
  const categories = [
    { name: 'GS Static', filterKeys: ['Prelims', 'GS1', 'GS2', 'GS3', 'Revision'] },
    { name: 'Current Affairs', filterKeys: ['Current Affairs'] },
    { name: 'Answer Writing & Ethics', filterKeys: ['Answer Writing', 'GS4'] },
    { name: 'Optional & CSAT', filterKeys: ['Optional', 'CSAT'] },
  ];

  const pillarStats = categories.map((cat) => {
    const catGoals = goals.filter((g) => cat.filterKeys.includes(g.category));
    const catTarget = catGoals.reduce((acc, curr) => acc + curr.targetHours, 0);
    const catDone = catGoals.reduce((acc, curr) => acc + (curr.completed ? curr.targetHours : curr.completedHours), 0);
    const pct = catTarget > 0 ? Math.min(100, Math.round((catDone / catTarget) * 100)) : 0;
    return {
      name: cat.name,
      targetHours: catTarget,
      completedHours: catDone,
      percent: pct,
      count: catGoals.length,
    };
  });

  // Filtered goals
  const filteredGoals = goals.filter((goal) => {
    const matchesStatus =
      filter === 'all' ? true : filter === 'completed' ? goal.completed : !goal.completed;
    const matchesCategory =
      categoryFilter === 'all' ? true : goal.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  // Toggle full completion
  const handleToggleComplete = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextCompleted = !g.completed;
          if (nextCompleted) {
            try {
              confetti({
                particleCount: 45,
                spread: 55,
                origin: { y: 0.75 },
              });
            } catch (e) {}
          }
          return {
            ...g,
            completed: nextCompleted,
            completedHours: nextCompleted ? g.targetHours : 0,
          };
        }
        return g;
      })
    );
  };

  // Add partial hours (+0.5h or +1h)
  const handleAddHours = (id: string, deltaHours: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const newHours = Math.min(g.targetHours, parseFloat((g.completedHours + deltaHours).toFixed(1)));
          const isDone = newHours >= g.targetHours;
          if (isDone && !g.completed) {
            try {
              confetti({ particleCount: 35, spread: 50 });
            } catch (e) {}
          }
          return {
            ...g,
            completedHours: newHours,
            completed: isDone,
          };
        }
        return g;
      })
    );
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoal: DailyGoal = {
      id: `goal-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      targetHours: parseFloat(newTargetHours) || 1.5,
      completedHours: 0,
      completed: false,
      date: todayStr,
      priority: newPriority,
    };

    setGoals((prev) => [newGoal, ...prev]);
    setNewTitle('');
    setShowAddModal(false);
  };

  // Quick preset templates for UPSC
  const quickTemplates = [
    { title: 'Laxmikanth Polity Revision (2 Chapters)', category: 'Prelims' as const, hours: '2.0', priority: 'high' as const },
    { title: 'The Hindu Editorial Analysis & PIB Notes', category: 'Current Affairs' as const, hours: '1.5', priority: 'high' as const },
    { title: 'Write 2 Mains Answers (GS2/GS3 with Timer)', category: 'Answer Writing' as const, hours: '1.5', priority: 'high' as const },
    { title: 'CSAT Quant & Reading Comprehension Drill', category: 'CSAT' as const, hours: '1.5', priority: 'medium' as const },
    { title: 'Optional Subject Unit Deep-dive', category: 'Optional' as const, hours: '2.5', priority: 'high' as const },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Top Header & Overview Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                Daily Goal Completion
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Visual Progress &amp; Tasks</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" />
              Daily Study Task Checklist
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Study Task</span>
            </button>
          </div>
        </div>

        {/* Big Dual Visual Progress Summary Card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-500/5 to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: Overall Circular & Percentage Indicator (4 cols) */}
            <div className="md:col-span-4 flex items-center gap-4">
              {/* Circular Gauge */}
              <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Task Progress (Amber) */}
                  <path
                    className="text-amber-500 transition-all duration-700 ease-out"
                    strokeDasharray={`${taskProgressPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base sm:text-lg font-bold font-mono text-white">
                    {taskProgressPercent}%
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase font-medium">Done</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    taskProgressPercent === 100
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                      : taskProgressPercent >= 60
                      ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {taskProgressPercent === 100 ? 'Target Mastered 🎯' : taskProgressPercent >= 60 ? 'Cruising Strong ⚡' : 'In Progress ⏳'}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {completedTasks} of {totalTasks} tasks cleared
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {totalCompletedHours.toFixed(1)}h / {totalTargetHours.toFixed(1)}h logged
                </div>
              </div>
            </div>

            {/* Right: Master Dual Progress Bars (8 cols) */}
            <div className="md:col-span-8 space-y-3">
              {/* Task Completion Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    Task Clearance:
                  </span>
                  <span className="text-amber-400 font-mono font-bold">
                    {completedTasks} / {totalTasks} ({taskProgressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-amber-500/50"
                    style={{ width: `${taskProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Study Hours Completion Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Study Hours Invested:
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {totalCompletedHours.toFixed(1)}h / {totalTargetHours.toFixed(1)}h ({hoursProgressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
                    style={{ width: `${hoursProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* UPSC 4 Pillars Mini Progress Badges */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {pillarStats.map((pillar, idx) => (
              <div key={idx} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-400 truncate">{pillar.name}</span>
                  <span className="font-mono text-slate-200 font-bold">{pillar.percent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      pillar.percent === 100
                        ? 'bg-emerald-400'
                        : pillar.percent > 0
                        ? 'bg-amber-400'
                        : 'bg-slate-700'
                    }`}
                    style={{ width: `${pillar.percent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                  {pillar.completedHours.toFixed(1)} / {pillar.targetHours.toFixed(1)}h ({pillar.count} tasks)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Category Pills */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between pb-1">
        <div className="flex items-center gap-1.5">
          {(['all', 'pending', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === s
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Categories</option>
            <option value="Prelims">Prelims GS-1</option>
            <option value="GS1">GS-1 Mains</option>
            <option value="GS2">GS-2 Mains</option>
            <option value="GS3">GS-3 Mains</option>
            <option value="GS4">GS-4 Ethics</option>
            <option value="Current Affairs">Current Affairs</option>
            <option value="Answer Writing">Answer Writing</option>
            <option value="CSAT">CSAT</option>
            <option value="Optional">Optional</option>
          </select>
        </div>
      </div>

      {/* Task Checklist Items with Individual Progress Bars */}
      <div className="space-y-3">
        {filteredGoals.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 border border-slate-800/80 rounded-2xl text-slate-400 text-xs">
            No study tasks match the active filter. Click "Add Study Task" above to schedule chapters or drills!
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const currentDoneHours = goal.completed ? goal.targetHours : goal.completedHours;
            const itemPercent = Math.min(100, Math.round((currentDoneHours / (goal.targetHours || 1)) * 100));

            return (
              <div
                key={goal.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  goal.completed
                    ? 'bg-slate-950/50 border-slate-800/60'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700/80'
                }`}
              >
                {/* Top line: Checkbox, Title, Category Badge, Delete */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(goal.id)}
                      className={`mt-0.5 rounded-full transition-transform active:scale-90 flex-shrink-0 ${
                        goal.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={goal.completed ? 'Mark pending' : 'Mark completed'}
                    >
                      {goal.completed ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-950 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs sm:text-sm font-semibold leading-snug ${
                            goal.completed ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {goal.title}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                          {goal.category}
                        </span>

                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          goal.priority === 'high'
                            ? 'text-rose-400 bg-rose-950/40 border border-rose-900/40'
                            : goal.priority === 'medium'
                            ? 'text-amber-400 bg-amber-950/40 border border-amber-900/40'
                            : 'text-slate-400 bg-slate-800'
                        }`}>
                          {goal.priority.toUpperCase()}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          Goal: {goal.targetHours}h
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Individual Task Progress Bar */}
                <div className="space-y-1.5 pl-8 sm:pl-8">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">
                      Progress: <strong className={goal.completed ? 'text-emerald-400' : 'text-amber-400'}>
                        {currentDoneHours.toFixed(1)}h / {goal.targetHours}h
                      </strong>
                    </span>
                    <span className={`font-mono font-bold ${
                      itemPercent === 100 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {itemPercent}%
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        goal.completed || itemPercent === 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-amber-500 to-amber-400'
                      }`}
                      style={{ width: `${itemPercent}%` }}
                    />
                  </div>

                  {/* Quick Hour Increment Controls */}
                  {!goal.completed && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-500">Quick Log:</span>
                      <button
                        onClick={() => handleAddHours(goal.id, 0.5)}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      >
                        +30m
                      </button>
                      <button
                        onClick={() => handleAddHours(goal.id, 1.0)}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      >
                        +1.0h
                      </button>
                      <button
                        onClick={() => handleToggleComplete(goal.id)}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 transition-colors ml-auto flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark 100%</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Study Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Add Daily Study Task
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Break down your UPSC preparation into measurable daily targets with estimated hours.
            </p>

            {/* Quick Templates */}
            <div className="mb-4">
              <label className="text-[11px] text-slate-400 font-semibold block mb-1.5 uppercase tracking-wider">
                ⚡ 1-Click UPSC Templates:
              </label>
              <div className="space-y-1.5">
                {quickTemplates.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewTitle(tmpl.title);
                      setNewCategory(tmpl.category);
                      setNewTargetHours(tmpl.hours);
                      setNewPriority(tmpl.priority);
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between transition-colors group"
                  >
                    <span className="truncate group-hover:text-amber-400">{tmpl.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono ml-2 flex-shrink-0">
                      {tmpl.category} • {tmpl.hours}h
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Laxmikanth: Emergency Provisions & 44th Amendment"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Prelims">Prelims GS-1</option>
                    <option value="GS1">GS-1 Mains</option>
                    <option value="GS2">GS-2 Mains</option>
                    <option value="GS3">GS-3 Mains</option>
                    <option value="GS4">GS-4 Ethics</option>
                    <option value="Current Affairs">Current Affairs</option>
                    <option value="Answer Writing">Answer Writing</option>
                    <option value="CSAT">CSAT</option>
                    <option value="Optional">Optional</option>
                    <option value="Revision">Revision</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Target Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={newTargetHours}
                    onChange={(e) => setNewTargetHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
