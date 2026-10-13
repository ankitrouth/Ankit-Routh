import React from 'react';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  PenTool, 
  ArrowRight, 
  RotateCw,
  Check,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DailyGoal, MonthlyGoal, StudySession, SyllabusItem, AspirantProfile, MockTestRecord, EvaluatedAnswerRecord, AiMotivationalQuote } from '../types';
import { PomodoroTimer } from './PomodoroTimer';
import { DailyGoalTracker } from './DailyGoalTracker';
import { TaskbarOverview } from './TaskbarOverview';
import { ClearanceOddsPredictor } from './ClearanceOddsPredictor';
import { AiMotivationBooster } from './AiMotivationBooster';
import { StudyStreakCalendar } from './StudyStreakCalendar';

interface DashboardProps {
  profile: AspirantProfile;
  goals: DailyGoal[];
  setGoals: React.Dispatch<React.SetStateAction<DailyGoal[]>>;
  monthlyGoals: MonthlyGoal[];
  setMonthlyGoals: React.Dispatch<React.SetStateAction<MonthlyGoal[]>>;
  sessions: StudySession[];
  onAddSession: (session: Omit<StudySession, 'id' | 'date'> & { date?: string }) => void;
  syllabus: SyllabusItem[];
  onUpdateSyllabusStatus: (id: string, newStatus: SyllabusItem['status']) => void;
  mockTests: MockTestRecord[];
  evaluations: EvaluatedAnswerRecord[];
  dailyHoursAverage: number;
  currentQuote: AiMotivationalQuote;
  setCurrentQuote: (q: AiMotivationalQuote) => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  goals,
  setGoals,
  monthlyGoals,
  setMonthlyGoals,
  sessions,
  onAddSession,
  syllabus,
  onUpdateSyllabusStatus,
  mockTests,
  evaluations,
  dailyHoursAverage,
  currentQuote,
  setCurrentQuote,
  onNavigateTab,
}) => {
  // Today's total study minutes
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.date === todayDateStr);
  const totalTodayMinutes = todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const todayHours = (totalTodayMinutes / 60).toFixed(1);

  // Daily target completion
  const completedGoalsCount = goals.filter((g) => g.completed).length;
  const totalGoalsCount = goals.length;
  const goalPercentage = totalGoalsCount > 0 ? Math.round((completedGoalsCount / totalGoalsCount) * 100) : 0;

  // Syllabus stats
  const totalSyllabusItems = syllabus.length;
  const masteredCount = syllabus.filter((s) => s.status === 'mastered_3').length;
  const revisedCount = syllabus.filter((s) => s.status === 'revised_2').length;
  const readingCount = syllabus.filter((s) => s.status === 'reading_1').length;
  const syllabusProgress = Math.round(((masteredCount * 1.0 + revisedCount * 0.7 + readingCount * 0.4) / (totalSyllabusItems || 1)) * 100);

  // Topics due for revision (status is reading_1 or revised_2)
  const revisionDueItems = syllabus
    .filter((s) => s.status === 'reading_1' || s.status === 'revised_2')
    .slice(0, 3);

  // Prelims average accuracy
  const prelimsTests = mockTests.filter((m) => m.stage === 'prelims');
  const averageAccuracy = prelimsTests.length > 0
    ? Math.round(prelimsTests.reduce((acc, curr) => acc + (curr.accuracyRate || 0), 0) / prelimsTests.length)
    : 70;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quote */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-5 sm:p-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                Aspirant Command Hub
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{profile.stageFocus.replace('_', ' ').toUpperCase()} MODE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-serif-scholarly">
              Welcome back, {profile.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 italic mt-1 max-w-2xl font-serif-scholarly text-amber-200/90">
              “Take up one idea. Make that one idea your life; dream of it; think of it; live on that idea. Let the brain, the body, muscles, nerves, every part of your body be full of that idea.”
              <span className="not-italic text-slate-400 text-xs ml-2">— Swami Vivekananda</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('evaluator')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Evaluate Mains Answer</span>
            </button>
            <button
              onClick={() => onNavigateTab('mentor')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Strategist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Personalized AI Motivational Quote Booster with Voice Synthesis */}
      <AiMotivationBooster
        profile={profile}
        currentQuote={currentQuote}
        setCurrentQuote={setCurrentQuote}
        tasksCompleted={completedGoalsCount}
        hoursStudied={parseFloat(todayHours)}
      />

      {/* 4 Core Vital Performance Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Hours Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Today's Study</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {todayHours} <span className="text-xs font-normal text-slate-400">/ {profile.dailyHoursTarget}h</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (parseFloat(todayHours) / profile.dailyHoursTarget) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-emerald-400 font-medium block mt-1.5">
            {parseFloat(todayHours) >= profile.dailyHoursTarget ? 'Target Achieved! 🎯' : `${(profile.dailyHoursTarget - parseFloat(todayHours)).toFixed(1)}h remaining`}
          </span>
        </div>

        {/* Goals Completed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Daily Targets</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {completedGoalsCount} <span className="text-xs font-normal text-slate-400">/ {totalGoalsCount}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${goalPercentage}%` }}
            />
          </div>
          <span className="text-[11px] text-amber-400 font-medium block mt-1.5">
            {goalPercentage}% checklist cleared
          </span>
        </div>

        {/* Syllabus Coverage */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Syllabus Radar</span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {syllabusProgress}% <span className="text-xs font-normal text-slate-400">weighted</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${syllabusProgress}%` }}
            />
          </div>
          <span className="text-[11px] text-cyan-400 font-medium block mt-1.5">
            {masteredCount} topics in 3rd revision
          </span>
        </div>

        {/* Mock Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Mock Accuracy</span>
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {averageAccuracy}% <span className="text-xs font-normal text-slate-400">avg hit rate</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-orange-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${averageAccuracy}%` }}
            />
          </div>
          <span className="text-[11px] text-orange-400 font-medium block mt-1.5">
            Safe zone for Prelims cutoff (&gt;65%)
          </span>
        </div>
      </div>

      {/* Visual Study Streak & Monthly Consistency Calendar View */}
      <StudyStreakCalendar
        sessions={sessions}
        onAddSession={onAddSession}
        mockTests={mockTests}
        profile={profile}
        dailyTargetHours={profile.dailyHoursTarget}
      />

      {/* Daily and Monthly Check Taskbar */}
      <TaskbarOverview
        goals={goals}
        setGoals={setGoals}
        monthlyGoals={monthlyGoals}
        setMonthlyGoals={setMonthlyGoals}
        sessions={sessions}
        mockTests={mockTests}
        streakDays={profile.streakDays}
        dailyTargetHours={profile.dailyHoursTarget}
      />

      {/* Realistic Prelims & Mains Clearance Odds Diagnostic */}
      <ClearanceOddsPredictor
        mockTests={mockTests}
        syllabus={syllabus}
        evaluations={evaluations}
        profile={profile}
        dailyHoursAverage={dailyHoursAverage}
      />

      {/* Main Grid: Left = Visual Daily Goal Tracker & Spaced Repetition | Right = Pomodoro Timer & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Visual Daily Goal Completion Component & Revision Radar */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual Daily Goal Completion Component */}
          <DailyGoalTracker
            goals={goals}
            setGoals={setGoals}
            dailyTargetHours={profile.dailyHoursTarget}
          />

          {/* Spaced Repetition Revision Radar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-slate-100 text-sm">
                  Spaced Repetition Radar (1-3-7 Rule)
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('syllabus')}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Full Syllabus <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Topics you recently completed that are due for active recall revision:
            </p>

            <div className="space-y-2">
              {revisionDueItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 font-mono">
                        {item.paper}
                      </span>
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {item.topic}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.subject} • Current: {item.status.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onNavigateTab('syllabus')}
                      className="px-2 py-1 text-xs rounded-lg font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                      title="Practice Flashcards"
                    >
                      <Layers className="w-3 h-3" />
                      <span>Cards</span>
                    </button>
                    <button
                      onClick={() => {
                        const next = item.status === 'reading_1' ? 'revised_2' : 'mastered_3';
                        onUpdateSyllabusStatus(item.id, next);
                        try {
                          confetti({ particleCount: 30, spread: 50 });
                        } catch (e) {}
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Advance</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Built-in Pomodoro Study Timer & Recent Logs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pomodoro Study Timer (Auto-logs completed 25m to daily session total) */}
          <PomodoroTimer
            onSessionComplete={onAddSession}
            todayStudiedMinutes={totalTodayMinutes}
          />

          {/* Today's Logged Study Sessions Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-slate-100 text-sm">
                  Today's Deep Work Sessions
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {todaySessions.length} logged ({(totalTodayMinutes / 60).toFixed(1)}h)
              </span>
            </div>

            {todaySessions.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No deep work slots logged today yet. Start a 25-minute Pomodoro session above to auto-log your hours!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {todaySessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">
                          {sess.subject}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 capitalize">
                          {sess.sessionType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {sess.topic}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {sess.durationMinutes}m
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {'⚡'.repeat(sess.energyRating)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
