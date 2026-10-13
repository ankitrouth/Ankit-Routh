import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Flame, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Plus, 
  Sparkles, 
  Info, 
  X,
  Zap,
  PenTool,
  RotateCw,
  Trophy,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySession, MockTestRecord, AspirantProfile } from '../types';

interface StudyStreakCalendarProps {
  sessions: StudySession[];
  onAddSession: (session: Omit<StudySession, 'id' | 'date'> & { date?: string }) => void;
  mockTests: MockTestRecord[];
  profile: AspirantProfile;
  dailyTargetHours: number;
}

export const StudyStreakCalendar: React.FC<StudyStreakCalendarProps> = ({
  sessions,
  onAddSession,
  mockTests,
  profile,
  dailyTargetHours,
}) => {
  // Current real-world date
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Calendar navigation state (defaults to current year & month, e.g. Oct 2026)
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'month' | 'sprint'>('month');
  const [showLogModal, setShowLogModal] = useState<boolean>(false);

  // New session form state
  const [formSubject, setFormSubject] = useState('Indian Polity');
  const [formTopic, setFormTopic] = useState('');
  const [formDurationMinutes, setFormDurationMinutes] = useState(60);
  const [formSessionType, setFormSessionType] = useState<StudySession['sessionType']>('reading');
  const [formEnergyRating, setFormEnergyRating] = useState<number>(4);
  const [formNotes, setFormNotes] = useState('');

  // Pre-calculated sessions map by date string "YYYY-MM-DD"
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, StudySession[]>();
    sessions.forEach((s) => {
      const existing = map.get(s.date) || [];
      existing.push(s);
      map.set(s.date, existing);
    });
    return map;
  }, [sessions]);

  // Pre-calculated mock tests map by date
  const mockTestsByDate = useMemo(() => {
    const map = new Map<string, MockTestRecord[]>();
    mockTests.forEach((m) => {
      const existing = map.get(m.date) || [];
      existing.push(m);
      map.set(m.date, existing);
    });
    return map;
  }, [mockTests]);

  // Daily totals map: date -> total minutes
  const dailyTotals = useMemo(() => {
    const totals = new Map<string, number>();
    sessionsByDate.forEach((sessList, date) => {
      const totalMin = sessList.reduce((acc, curr) => acc + curr.durationMinutes, 0);
      totals.set(date, totalMin);
    });
    return totals;
  }, [sessionsByDate]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDateStr(todayStr);
  };

  // Month metadata
  const monthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleString('default', { month: 'long' });
  }, [currentYear, currentMonth]);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // 1st day of month day-of-week (Monday = 0, Sunday = 6)
  const firstDayOfWeek = useMemo(() => {
    const day = new Date(currentYear, currentMonth, 1).getDay();
    // JS getDay(): 0 = Sun, 1 = Mon. Convert so Mon = 0, Sun = 6
    return (day + 6) % 7;
  }, [currentYear, currentMonth]);

  // Calendar cells generation
  const calendarDays = useMemo(() => {
    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isFuture: boolean;
      totalMinutes: number;
      sessionsCount: number;
      hasMockTest: boolean;
      isStreakDay: boolean;
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const totalMinutes = dailyTotals.get(dateStr) || 0;
      const daySessions = sessionsByDate.get(dateStr) || [];
      const hasMock = mockTestsByDate.has(dateStr);
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      const isStreakDay = totalMinutes >= 30; // 30+ minutes counts towards consistency

      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday,
        isFuture,
        totalMinutes,
        sessionsCount: daySessions.length,
        hasMockTest: hasMock,
        isStreakDay,
      });
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth, dailyTotals, sessionsByDate, mockTestsByDate, todayStr]);

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    let activeDaysCount = 0;
    let totalMinutesMonth = 0;
    let daysWithMock = 0;
    let daysTargetMet = 0;

    calendarDays.forEach((d) => {
      if (d.totalMinutes > 0) {
        activeDaysCount++;
        totalMinutesMonth += d.totalMinutes;
        if (d.totalMinutes / 60 >= dailyTargetHours) {
          daysTargetMet++;
        }
      }
      if (d.hasMockTest) {
        daysWithMock++;
      }
    });

    const totalHours = (totalMinutesMonth / 60).toFixed(1);
    const avgHoursPerActiveDay = activeDaysCount > 0 ? (totalMinutesMonth / 60 / activeDaysCount).toFixed(1) : '0';
    
    // Elapsed days in month up to today
    const isThisCurrentRealMonth = currentYear === today.getFullYear() && currentMonth === today.getMonth();
    const elapsedDays = isThisCurrentRealMonth ? today.getDate() : daysInMonth;
    const consistencyPct = elapsedDays > 0 ? Math.round((activeDaysCount / elapsedDays) * 100) : 0;

    return {
      activeDaysCount,
      totalHours,
      avgHoursPerActiveDay,
      daysTargetMet,
      daysWithMock,
      consistencyPct: Math.min(100, consistencyPct),
      elapsedDays,
    };
  }, [calendarDays, currentYear, currentMonth, dailyTargetHours, daysInMonth, today]);

  // Calculate current active streak dynamically
  const computedStreak = useMemo(() => {
    // Check backwards from today or yesterday
    let streak = 0;
    const checkDate = new Date(today);
    
    // Check if studied today
    const todayMins = dailyTotals.get(todayStr) || 0;
    if (todayMins >= 30) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If haven't studied today yet, check if studied yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      if ((dailyTotals.get(yStr) || 0) < 30) {
        return Math.max(profile.streakDays, 0);
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Loop backwards
    for (let i = 0; i < 90; i++) {
      const y = checkDate.getFullYear();
      const m = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;
      const min = dailyTotals.get(dStr) || 0;
      if (min >= 30) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return Math.max(streak, profile.streakDays);
  }, [dailyTotals, todayStr, today, profile.streakDays]);

  // Milestone tiers
  const streakMilestones = [
    { days: 3, label: '3-Day Ignition', icon: '🥉' },
    { days: 7, label: '7-Day Momentum', icon: '🥈' },
    { days: 14, label: '14-Day Resolute', icon: '🥇' },
    { days: 21, label: '21-Day Habit Lock', icon: '💎' },
    { days: 30, label: '30-Day LBSNAA Cadet', icon: '👑' },
    { days: 60, label: '60-Day Unbreakable Ranker', icon: '🌟' },
  ];

  const nextMilestone = useMemo(() => {
    const next = streakMilestones.find((m) => m.days > computedStreak);
    return next || { days: 100, label: 'Centurion 100 Days', icon: '🏆' };
  }, [computedStreak]);

  const prevMilestoneDays = useMemo(() => {
    const prev = [...streakMilestones].reverse().find((m) => m.days <= computedStreak);
    return prev ? prev.days : 0;
  }, [computedStreak]);

  const milestoneProgressPct = useMemo(() => {
    const range = nextMilestone.days - prevMilestoneDays;
    const currentDiff = computedStreak - prevMilestoneDays;
    return Math.min(100, Math.max(0, Math.round((currentDiff / (range || 1)) * 100)));
  }, [computedStreak, nextMilestone, prevMilestoneDays]);

  // Selected Day Details
  const selectedDaySessions = useMemo(() => {
    return sessionsByDate.get(selectedDateStr) || [];
  }, [sessionsByDate, selectedDateStr]);

  const selectedDayMocks = useMemo(() => {
    return mockTestsByDate.get(selectedDateStr) || [];
  }, [mockTestsByDate, selectedDateStr]);

  const selectedDayTotalMinutes = useMemo(() => {
    return dailyTotals.get(selectedDateStr) || 0;
  }, [dailyTotals, selectedDateStr]);

  const selectedDayHours = (selectedDayTotalMinutes / 60).toFixed(1);

  // Form submit handler
  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || formDurationMinutes <= 0) return;

    onAddSession({
      subject: formSubject.trim(),
      topic: formTopic.trim() || 'Core Revision & Syllabus Consolidation',
      durationMinutes: formDurationMinutes,
      sessionType: formSessionType,
      energyRating: formEnergyRating,
      notes: formNotes.trim() || undefined,
      date: selectedDateStr,
    });

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {}

    setFormTopic('');
    setFormNotes('');
    setShowLogModal(false);
  };

  // Heatmap styling helper
  const getDayHeatmapClasses = (minutes: number, isFuture: boolean, isSelected: boolean) => {
    if (isFuture) {
      return isSelected 
        ? 'bg-slate-900/60 border-amber-500/80 ring-2 ring-amber-500/40 text-slate-500' 
        : 'bg-slate-950/40 border-slate-900/80 text-slate-600 hover:border-slate-800';
    }

    const hours = minutes / 60;
    let baseBg = '';
    let textColor = '';

    if (hours === 0) {
      baseBg = 'bg-slate-950/80 border-slate-800/60';
      textColor = 'text-slate-500';
    } else if (hours < 2.5) {
      baseBg = 'bg-amber-950/30 border-amber-900/60 hover:bg-amber-900/40';
      textColor = 'text-amber-300';
    } else if (hours < 5.5) {
      baseBg = 'bg-amber-900/40 border-amber-700/60 hover:bg-amber-800/50';
      textColor = 'text-amber-200';
    } else if (hours < 8.0) {
      baseBg = 'bg-emerald-950/50 border-emerald-700/70 hover:bg-emerald-900/60';
      textColor = 'text-emerald-300';
    } else {
      // 8h+ LBSNAA Beast Mode
      baseBg = 'bg-gradient-to-br from-amber-600/30 via-emerald-700/25 to-teal-800/30 border-amber-500/80 shadow-sm shadow-amber-500/20';
      textColor = 'text-amber-100 font-semibold';
    }

    const selectedRing = isSelected ? 'ring-2 ring-amber-400 border-amber-400 scale-[1.03] z-10' : '';

    return `${baseBg} ${textColor} ${selectedRing} transition-all duration-150`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Flame className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              Consistency Radar
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">UPSC CSE Habit Engine</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-serif-scholarly flex items-center gap-2">
            <span>Study Streak &amp; Consistency Calendar</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            Visual tracking of unbroken study days. In Civil Services, daily compounding beats erratic marathon cramming.
          </p>
        </div>

        {/* Month Switcher & Quick Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {/* Quick jump to Today */}
          <button
            onClick={handleJumpToToday}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 active:scale-95 cursor-pointer"
            title="Jump to today's date"
          >
            Today
          </button>

          {/* Month Steppers */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-xs sm:text-sm font-semibold text-slate-100 font-mono min-w-[130px] text-center">
              {monthName} {currentYear}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile view mode toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 border border-slate-800 rounded-xl sm:hidden">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                viewMode === 'month' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('sprint')}
              className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer ${
                viewMode === 'sprint' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400'
              }`}
            >
              Sprint
            </button>
          </div>
        </div>
      </div>

      {/* Streak Highlight Bar & Monthly Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        {/* Active Streak Badge */}
        <div className="relative bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-800/40 rounded-xl p-3.5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-300 font-medium flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30 animate-pulse" />
              Active Streak
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              UNBROKEN
            </span>
          </div>
          <div className="mt-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1.5">
              <span>{computedStreak}</span>
              <span className="text-xs sm:text-sm font-normal text-amber-200">Days Active</span>
            </div>
            <p className="text-[11px] text-amber-300/80 mt-0.5 truncate">
              {computedStreak >= 14 ? 'Top 5% aspirant discipline tier! 🚀' : 'Keep the chain going!'}
            </p>
          </div>
        </div>

        {/* Monthly Consistency Rate */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{monthName} Consistency</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1.5">
              <span>{monthlyStats.consistencyPct}%</span>
              <span className="text-xs font-normal text-slate-400">
                ({monthlyStats.activeDaysCount}/{monthlyStats.elapsedDays}d)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${monthlyStats.consistencyPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Monthly Deep Work Hours */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Month Deep Work</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1.5">
              <span>{monthlyStats.totalHours}</span>
              <span className="text-xs font-normal text-slate-400">Hours Logged</span>
            </div>
            <p className="text-[11px] text-cyan-400 mt-1 font-mono">
              Avg {monthlyStats.avgHoursPerActiveDay}h / study day
            </p>
          </div>
        </div>

        {/* Target Met Days & Mocks */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Targets &amp; Mocks</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Daily Target Hits</span>
                <span className="text-xl font-bold text-white font-mono">
                  {monthlyStats.daysTargetMet} <span className="text-xs text-slate-400 font-normal">days</span>
                </span>
              </div>
              <div className="border-l border-slate-800 pl-3">
                <span className="text-xs text-slate-400 block">Mocks Taken</span>
                <span className="text-xl font-bold text-amber-400 font-mono">
                  {monthlyStats.daysWithMock} <span className="text-xs text-slate-400 font-normal">tests</span>
                </span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Target: {dailyTargetHours}h / day
            </span>
          </div>
        </div>
      </div>

      {/* Streak Milestone Progress Strip */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-1.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="font-semibold text-slate-200">
              Current Rank: <span className="text-amber-400">14-Day Resolute Aspirant 🥇</span>
            </span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Next Milestone:{' '}
            <span className="text-emerald-300 font-semibold font-mono">
              {nextMilestone.icon} {nextMilestone.label} ({nextMilestone.days}d)
            </span>{' '}
            • <span className="text-amber-400">{Math.max(0, nextMilestone.days - computedStreak)} days remaining</span>
          </div>
        </div>

        <div className="relative w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${milestoneProgressPct}%` }}
          />
        </div>

        {/* Milestone Pills */}
        <div className="hidden sm:flex items-center justify-between gap-1 mt-2 pt-1 border-t border-slate-900 text-[10px]">
          {streakMilestones.map((m) => {
            const isAchieved = computedStreak >= m.days;
            return (
              <div
                key={m.days}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                  isAchieved 
                    ? 'text-amber-300 font-medium' 
                    : 'text-slate-500 opacity-70'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.days}d</span>
                {isAchieved && <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Calendar View */}
      {viewMode === 'month' ? (
        <div className="space-y-2">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-slate-400 pb-1">
            <span className="hidden sm:inline">Mon</span><span className="sm:hidden text-[10px]">M</span>
            <span className="hidden sm:inline">Tue</span><span className="sm:hidden text-[10px]">T</span>
            <span className="hidden sm:inline">Wed</span><span className="sm:hidden text-[10px]">W</span>
            <span className="hidden sm:inline">Thu</span><span className="sm:hidden text-[10px]">T</span>
            <span className="hidden sm:inline">Fri</span><span className="sm:hidden text-[10px]">F</span>
            <span className="hidden sm:inline text-amber-300/80">Sat</span><span className="sm:hidden text-[10px] text-amber-300/80">S</span>
            <span className="hidden sm:inline text-amber-300/80">Sun</span><span className="sm:hidden text-[10px] text-amber-300/80">S</span>
          </div>

          {/* Month Day Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty padding slots before 1st of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="h-16 sm:h-20 rounded-xl bg-slate-950/30 border border-slate-900/40 opacity-40"
              />
            ))}

            {/* Actual Month Days */}
            {calendarDays.map((day) => {
              const isSelected = day.dateStr === selectedDateStr;
              const hours = (day.totalMinutes / 60).toFixed(1);
              const heatmapClasses = getDayHeatmapClasses(day.totalMinutes, day.isFuture, isSelected);

              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`h-16 sm:h-20 rounded-xl border p-1 sm:p-2 text-left flex flex-col justify-between relative cursor-pointer active:scale-95 group ${heatmapClasses}`}
                >
                  {/* Top row: day number & badges */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] sm:text-xs font-mono font-bold ${
                        day.isToday
                          ? 'px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950'
                          : isSelected
                          ? 'text-white'
                          : 'text-slate-300'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    <div className="flex items-center gap-0.5">
                      {/* Streak flame indicator on active days */}
                      {day.isStreakDay && (
                        <Flame className="w-3 h-3 text-amber-400 fill-amber-400/40 flex-shrink-0" />
                      )}
                      {/* Mock test attempted icon */}
                      {day.hasMockTest && (
                        <span className="text-[10px]" title="Mock Test Attempted">
                          📝
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle / Bottom row: Study Hours and indicators */}
                  <div className="w-full mt-auto">
                    {day.totalMinutes > 0 ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-xs font-mono font-semibold">
                            {hours}h
                          </span>
                          {parseFloat(hours) >= dailyTargetHours && (
                            <span className="text-[9px] text-emerald-400 hidden sm:inline">
                              🎯
                            </span>
                          )}
                        </div>
                        {/* Mini sessions count indicator */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from({ length: Math.min(3, day.sessionsCount) }).map((_, i) => (
                            <div
                              key={i}
                              className="w-1 h-1 rounded-full bg-current opacity-80"
                            />
                          ))}
                        </div>
                      </div>
                    ) : day.isFuture ? (
                      <span className="text-[9px] text-slate-600 block">—</span>
                    ) : (
                      <span className="text-[9px] text-slate-600 block">Rest</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Mobile-friendly 7-Day Sprint View */
        <div className="space-y-3">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Recent 7-Day Sprint History</span>
            <span className="text-amber-400 font-mono text-[11px]">Unbroken Consistency</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {calendarDays.slice(-7).map((day) => {
              const isSelected = day.dateStr === selectedDateStr;
              const hours = (day.totalMinutes / 60).toFixed(1);
              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                        day.isToday
                          ? 'bg-amber-400 text-slate-950'
                          : day.totalMinutes > 0
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {day.dayNum}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">
                          {new Date(day.dateStr).toLocaleDateString('default', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {day.isToday && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                            TODAY
                          </span>
                        )}
                        {day.isStreakDay && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                            <Flame className="w-3 h-3 fill-amber-400" /> Streak
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {day.sessionsCount} deep work session{day.sessionsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-white">
                      {hours} <span className="text-[10px] font-normal text-slate-400">hrs</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {parseFloat(hours) >= dailyTargetHours ? 'Target Met 🎯' : 'Progressing'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">Study Intensity:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800 inline-block" title="0 hrs" />
            <span className="text-[10px] text-slate-500">0h</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-950/60 border border-amber-900 inline-block" title="< 2.5 hrs" />
            <span className="text-[10px] text-slate-500">1-3h</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-900/60 border border-amber-700 inline-block" title="3 - 5.5 hrs" />
            <span className="text-[10px] text-slate-500">3-5h</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-700 inline-block" title="5.5 - 8 hrs (Target Met)" />
            <span className="text-[10px] text-slate-500">6-8h</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-600/50 border border-amber-400 inline-block" title="8+ hrs (LBSNAA Beast Mode)" />
            <span className="text-[10px] text-amber-400 font-semibold">8h+</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-amber-300">
            <Flame className="w-3 h-3 fill-amber-400 text-amber-400" /> Unbroken Streak
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span>📝</span> Mock Test
          </span>
        </div>
      </div>

      {/* Selected Day Details Inspector */}
      <div className="mt-5 bg-slate-950/90 border border-slate-800 rounded-xl p-4 sm:p-5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                {new Date(`${selectedDateStr}T00:00:00`).toLocaleDateString('default', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              {selectedDateStr === todayStr && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400 text-slate-950">
                  TODAY
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDayTotalMinutes > 0
                ? `${selectedDayHours} hours studied across ${selectedDaySessions.length} session${selectedDaySessions.length !== 1 ? 's' : ''}`
                : 'No study sessions recorded for this day yet.'}
            </p>
          </div>

          {/* Quick Actions for Selected Day */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Study Session</span>
            </button>
          </div>
        </div>

        {/* Sessions & Mocks for Selected Day */}
        <div className="mt-3.5 space-y-3">
          {selectedDaySessions.length === 0 && selectedDayMocks.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p>No study activity logged on this date.</p>
              <button
                onClick={() => setShowLogModal(true)}
                className="mt-2 text-xs text-amber-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                + Add retroactive or planned study hours
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Mock tests on this date */}
              {selectedDayMocks.map((mock) => (
                <div
                  key={mock.id}
                  className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                        {mock.seriesName}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {mock.testName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Paper: {mock.paperType} • Score: {mock.totalScore} / {mock.maxMarks}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {mock.accuracyRate ? `${mock.accuracyRate}% Acc` : 'Evaluated'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Study Sessions on this date */}
              {selectedDaySessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {session.subject}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 capitalize font-medium">
                        {session.sessionType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">
                      {session.topic}
                    </p>
                    {session.notes && (
                      <p className="text-[10px] text-slate-400 italic truncate mt-0.5">
                        Note: {session.notes}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono font-bold text-amber-400">
                      {session.durationMinutes} min ({ (session.durationMinutes / 60).toFixed(1) }h)
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5" title={`Energy Rating: ${session.energyRating}/5`}>
                      {'⚡'.repeat(session.energyRating)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivation insight based on streak */}
        <div className="mt-4 pt-3 border-t border-slate-900 flex items-start gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed font-serif-scholarly">
            <span className="text-amber-300 font-semibold not-italic">Ranker's Retention Principle:</span>{' '}
            “Studying 6 hours every single day yields 3x higher synaptic retention than studying 14 hours every second day. An unbroken chain protects your syllabus momentum from psychological inertia.”
          </p>
        </div>
      </div>

      {/* Log Study Session Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Log Study Session
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => setSelectedDateStr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Indian Polity">Indian Polity (GS2 / Prelims)</option>
                  <option value="Modern History">Modern Indian History (GS1)</option>
                  <option value="Geography & Environment">Geography &amp; Environment (GS1/GS3)</option>
                  <option value="Economy">Economy &amp; Budget (GS3)</option>
                  <option value="Ethics GS4">Ethics, Integrity &amp; Aptitude (GS4)</option>
                  <option value="Optional Subject">Optional Subject (Paper 1 &amp; 2)</option>
                  <option value="CSAT Quant & Reasoning">CSAT Paper 2 (Quant &amp; Reasoning)</option>
                  <option value="Current Affairs">Current Affairs &amp; The Hindu Editorial</option>
                  <option value="Answer Writing">Mains Daily Answer Writing (DAW)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Topic / Subtopic Covered
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fundamental Rights, Monsoons, SDF vs Repo..."
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="720"
                    step="15"
                    value={formDurationMinutes}
                    onChange={(e) => setFormDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    = {(formDurationMinutes / 60).toFixed(1)} hours
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Session Type
                  </label>
                  <select
                    value={formSessionType}
                    onChange={(e) => setFormSessionType(e.target.value as StudySession['sessionType'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="reading">First Reading</option>
                    <option value="revision">Active Revision</option>
                    <option value="answer_writing">Answer Writing</option>
                    <option value="mock_test">Mock Test Practice</option>
                    <option value="current_affairs">Current Affairs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Energy &amp; Focus Rating (1 to 5 ⚡)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormEnergyRating(lvl)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        formEnergyRating >= lvl
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-600'
                      }`}
                    >
                      {lvl} ⚡
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Key Takeaway / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Key concepts grasped or areas needing second revision..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Session</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
