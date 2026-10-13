import React from 'react';
import { AspirantProfile } from '../types';
import { 
  Flame, 
  Target, 
  Award, 
  BookOpen, 
  BarChart3, 
  PenTool, 
  Sparkles, 
  Clock, 
  Calendar,
  Compass,
  Sun,
  Moon,
  TrendingUp,
  Bell
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: AspirantProfile;
  todayStudiedMinutes: number;
  onOpenReminders: () => void;
  activeRemindersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  todayStudiedMinutes,
  onOpenReminders,
  activeRemindersCount,
}) => {
  const { theme, toggleTheme } = useTheme();

  // Calculate days remaining until Prelims
  const calculateDaysLeft = () => {
    const today = new Date();
    const target = new Date(profile.examDatePrelims);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysLeft = calculateDaysLeft();
  const todayHours = (todayStudiedMinutes / 60).toFixed(1);
  const targetHours = profile.dailyHoursTarget.toFixed(1);
  const hoursProgress = Math.min(100, Math.round((todayStudiedMinutes / (profile.dailyHoursTarget * 60)) * 100));

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: Target },
    { id: 'odds', label: 'Clearance Odds & Cutoff', icon: TrendingUp, badge: 'HOT' },
    { id: 'syllabus', label: 'Syllabus & Flashcards', icon: BookOpen, badge: 'NEW' },
    { id: 'analytics', label: 'Mock Test Analytics', icon: BarChart3 },
    { id: 'evaluator', label: 'AI Mains Evaluator', icon: PenTool, badge: 'AI' },
    { id: 'mentor', label: 'AI UPSC Mentor', icon: Sparkles, badge: 'AI' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold border border-amber-400/40">
              <Compass className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-serif-scholarly">
                  UPSC <span className="text-amber-400">COMMAND</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  CSE {profile.targetYear}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Precision Goal Tracker &amp; Personalized AI Mentor
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="hidden md:flex items-center gap-3">
            {/* Countdown Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Prelims:</span>
              <span className="font-semibold text-amber-400 font-mono">{daysLeft}d left</span>
            </div>

            {/* Streak Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-950/40 border border-orange-800/40 text-xs text-orange-200">
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
              <span className="font-bold text-orange-300 font-mono">{profile.streakDays} Day</span>
              <span className="text-orange-400/80">Streak</span>
            </div>

            {/* Today's Target Hours */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Today:</span>
              <span className="font-semibold text-emerald-400 font-mono">
                {todayHours}h / {targetHours}h
              </span>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${hoursProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons: Reminders, Theme Toggle & Ask AI */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Reminders Bell Button */}
            <button
              onClick={onOpenReminders}
              className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
              title="Daily Study Reminders"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {activeRemindersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                  {activeRemindersCount}
                </span>
              )}
            </button>

            {/* High-Contrast Study Mode / Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-all cursor-pointer shadow-sm"
              title={theme === 'dark' ? 'Switch to High-Contrast Light / Daytime Study Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Daytime Study Mode</span>
                  <span className="sm:hidden">Day</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Dark Mode</span>
                  <span className="sm:hidden">Night</span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveTab('mentor')}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Ask AI Mentor</span>
              <span className="sm:hidden">AI</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 relative cursor-pointer ${
                  isActive
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                    isActive 
                      ? 'bg-amber-400 text-slate-950' 
                      : 'bg-slate-800 text-amber-300 border border-amber-400/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
