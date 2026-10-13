import React, { useState, useEffect } from 'react';
import { 
  DEFAULT_ASPIRANT_PROFILE, 
  INITIAL_DAILY_GOALS, 
  INITIAL_MONTHLY_GOALS,
  INITIAL_MOCK_TESTS, 
  INITIAL_STUDY_SESSIONS, 
  INITIAL_EVALUATED_ANSWERS,
  INITIAL_REMINDERS,
  INITIAL_MOTIVATIONAL_QUOTE,
  INITIAL_FLASHCARDS
} from './data/initialData';
import { INITIAL_SYLLABUS } from './data/initialSyllabus';
import { 
  AspirantProfile, 
  DailyGoal, 
  MonthlyGoal,
  MockTestRecord, 
  StudySession, 
  SyllabusItem, 
  EvaluatedAnswerRecord, 
  RevisionStatus,
  StudyReminder,
  AiMotivationalQuote,
  FlashcardItem
} from './types';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SyllabusTracker } from './components/SyllabusTracker';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { MainsEvaluator } from './components/MainsEvaluator';
import { AiMentor } from './components/AiMentor';
import { ClearanceOddsPredictor } from './components/ClearanceOddsPredictor';
import { ProfileModal } from './components/ProfileModal';
import { RemindersModal } from './components/RemindersModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { User, Compass } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);

  // 1. Profile State
  const [profile, setProfile] = useState<AspirantProfile>(() => {
    try {
      const saved = localStorage.getItem('upsc_profile') || localStorage.getItem('sankalp_profile');
      if (saved) {
        const parsed: AspirantProfile = JSON.parse(saved);
        if (parsed.name === 'Ankit Kumar' || parsed.name?.toLowerCase().includes('sankalp') || !parsed.name) {
          parsed.name = 'Ankit Routh';
        }
        return parsed;
      }
      return DEFAULT_ASPIRANT_PROFILE;
    } catch {
      return DEFAULT_ASPIRANT_PROFILE;
    }
  });

  // 2. Daily Goals
  const [goals, setGoals] = useState<DailyGoal[]>(() => {
    try {
      const saved = localStorage.getItem('upsc_goals') || localStorage.getItem('sankalp_goals');
      return saved ? JSON.parse(saved) : INITIAL_DAILY_GOALS;
    } catch {
      return INITIAL_DAILY_GOALS;
    }
  });

  // 2b. Monthly Goals
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>(() => {
    try {
      const saved = localStorage.getItem('upsc_monthly_goals') || localStorage.getItem('sankalp_monthly_goals');
      return saved ? JSON.parse(saved) : INITIAL_MONTHLY_GOALS;
    } catch {
      return INITIAL_MONTHLY_GOALS;
    }
  });

  // 3. Study Sessions
  const [sessions, setSessions] = useState<StudySession[]>(() => {
    try {
      const saved = localStorage.getItem('upsc_sessions') || localStorage.getItem('sankalp_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length <= 5) {
          return INITIAL_STUDY_SESSIONS;
        }
        return parsed;
      }
      return INITIAL_STUDY_SESSIONS;
    } catch {
      return INITIAL_STUDY_SESSIONS;
    }
  });

  // 4. Mock Tests
  const [mockTests, setMockTests] = useState<MockTestRecord[]>(() => {
    try {
      const saved = localStorage.getItem('upsc_mocks') || localStorage.getItem('sankalp_mocks');
      return saved ? JSON.parse(saved) : INITIAL_MOCK_TESTS;
    } catch {
      return INITIAL_MOCK_TESTS;
    }
  });

  // 5. Syllabus Tracker
  const [syllabus, setSyllabus] = useState<SyllabusItem[]>(() => {
    try {
      const saved = localStorage.getItem('upsc_syllabus') || localStorage.getItem('sankalp_syllabus');
      return saved ? JSON.parse(saved) : INITIAL_SYLLABUS;
    } catch {
      return INITIAL_SYLLABUS;
    }
  });

  // 6. Mains Evaluated Answers
  const [evaluations, setEvaluations] = useState<EvaluatedAnswerRecord[]>(() => {
    try {
      const saved = localStorage.getItem('upsc_evaluations') || localStorage.getItem('sankalp_evaluations');
      return saved ? JSON.parse(saved) : INITIAL_EVALUATED_ANSWERS;
    } catch {
      return INITIAL_EVALUATED_ANSWERS;
    }
  });

  // 7. Study Reminders
  const [reminders, setReminders] = useState<StudyReminder[]>(() => {
    try {
      const saved = localStorage.getItem('upsc_reminders') || localStorage.getItem('sankalp_reminders');
      return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
    } catch {
      return INITIAL_REMINDERS;
    }
  });

  // 8. Personalized AI Motivational Quote
  const [currentQuote, setCurrentQuote] = useState<AiMotivationalQuote>(() => {
    try {
      const saved = localStorage.getItem('upsc_quote') || localStorage.getItem('sankalp_quote');
      return saved ? JSON.parse(saved) : INITIAL_MOTIVATIONAL_QUOTE;
    } catch {
      return INITIAL_MOTIVATIONAL_QUOTE;
    }
  });

  // 9. High-Yield UPSC Flashcards
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>(() => {
    try {
      const saved = localStorage.getItem('upsc_flashcards') || localStorage.getItem('sankalp_flashcards');
      return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
    } catch {
      return INITIAL_FLASHCARDS;
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('upsc_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('upsc_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('upsc_monthly_goals', JSON.stringify(monthlyGoals));
  }, [monthlyGoals]);

  useEffect(() => {
    localStorage.setItem('upsc_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('upsc_mocks', JSON.stringify(mockTests));
  }, [mockTests]);

  useEffect(() => {
    localStorage.setItem('upsc_syllabus', JSON.stringify(syllabus));
  }, [syllabus]);

  useEffect(() => {
    localStorage.setItem('upsc_evaluations', JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem('upsc_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('upsc_quote', JSON.stringify(currentQuote));
  }, [currentQuote]);

  useEffect(() => {
    localStorage.setItem('upsc_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  // Compute today's studied minutes
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.date === todayStr);
  const todayStudiedMinutes = todaySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  // Compute average daily hours over last 7 days
  const dailyHoursAverage = parseFloat((todayStudiedMinutes / 60).toFixed(1)) || 7.2;

  // Active reminders count
  const activeRemindersCount = reminders.filter((r) => r.enabled).length;

  // Compute syllabus progress percentage
  const masteredCount = syllabus.filter((s) => s.status === 'mastered_3').length;
  const revisedCount = syllabus.filter((s) => s.status === 'revised_2').length;
  const readingCount = syllabus.filter((s) => s.status === 'reading_1').length;
  const syllabusProgress = Math.round(
    ((masteredCount * 1.0 + revisedCount * 0.7 + readingCount * 0.4) / (syllabus.length || 1)) * 100
  );

  // Handle adding new study session
  const handleAddSession = (sessionData: Omit<StudySession, 'id' | 'date'> & { date?: string }) => {
    const targetDate = sessionData.date || todayStr;
    const newSession: StudySession = {
      ...sessionData,
      id: `session-${Date.now()}`,
      date: targetDate,
    };
    setSessions((prev) => [newSession, ...prev]);

    // Update streak if needed
    if (targetDate === todayStr && profile.lastActiveDate !== todayStr) {
      setProfile((prev) => ({
        ...prev,
        streakDays: prev.streakDays + 1,
        lastActiveDate: todayStr,
      }));
    }
  };

  // Handle updating syllabus topic revision level
  const handleUpdateSyllabusStatus = (id: string, newStatus: RevisionStatus) => {
    setSyllabus((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              lastRevised: todayStr,
            }
          : item
      )
    );
  };

  // Reset to initial defaults
  const handleResetDefaults = () => {
    setProfile(DEFAULT_ASPIRANT_PROFILE);
    setGoals(INITIAL_DAILY_GOALS);
    setMonthlyGoals(INITIAL_MONTHLY_GOALS);
    setSessions(INITIAL_STUDY_SESSIONS);
    setMockTests(INITIAL_MOCK_TESTS);
    setSyllabus(INITIAL_SYLLABUS);
    setEvaluations(INITIAL_EVALUATED_ANSWERS);
    setReminders(INITIAL_REMINDERS);
    setCurrentQuote(INITIAL_MOTIVATIONAL_QUOTE);
    setFlashcards(INITIAL_FLASHCARDS);
    localStorage.clear();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200 transition-colors">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        todayStudiedMinutes={todayStudiedMinutes}
        onOpenReminders={() => setIsRemindersModalOpen(true)}
        activeRemindersCount={activeRemindersCount}
      />

      {/* Main Container - Added pb-20 on mobile for Bottom Navigation Bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            profile={profile}
            goals={goals}
            setGoals={setGoals}
            monthlyGoals={monthlyGoals}
            setMonthlyGoals={setMonthlyGoals}
            sessions={sessions}
            onAddSession={handleAddSession}
            syllabus={syllabus}
            onUpdateSyllabusStatus={handleUpdateSyllabusStatus}
            mockTests={mockTests}
            evaluations={evaluations}
            dailyHoursAverage={dailyHoursAverage}
            currentQuote={currentQuote}
            setCurrentQuote={setCurrentQuote}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'odds' && (
          <div className="space-y-6">
            <ClearanceOddsPredictor
              mockTests={mockTests}
              syllabus={syllabus}
              evaluations={evaluations}
              profile={profile}
              dailyHoursAverage={dailyHoursAverage}
            />
          </div>
        )}

        {(activeTab === 'syllabus' || activeTab === 'flashcards') && (
          <SyllabusTracker
            syllabus={syllabus}
            setSyllabus={setSyllabus}
            onUpdateStatus={handleUpdateSyllabusStatus}
            flashcards={flashcards}
            setFlashcards={setFlashcards}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <ClearanceOddsPredictor
              mockTests={mockTests}
              syllabus={syllabus}
              evaluations={evaluations}
              profile={profile}
              dailyHoursAverage={dailyHoursAverage}
            />
            <PerformanceAnalytics
              mockTests={mockTests}
              setMockTests={setMockTests}
              profile={profile}
              dailyHoursAverage={dailyHoursAverage}
              syllabusProgress={syllabusProgress}
            />
          </div>
        )}

        {activeTab === 'evaluator' && (
          <MainsEvaluator
            evaluations={evaluations}
            setEvaluations={setEvaluations}
          />
        )}

        {activeTab === 'mentor' && (
          <AiMentor
            profile={profile}
            setProfile={setProfile}
          />
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Reminders Modal */}
      <RemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        reminders={reminders}
        setReminders={setReminders}
      />

      {/* Quick Aspirant Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        setProfile={setProfile}
        onResetDefaults={handleResetDefaults}
      />

      {/* Footer (hidden or compact on mobile) */}
      <footer className="hidden md:block border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-500/80" />
            <span>
              UPSC CSE Command Suite • Mobile-First Study Experience
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Aspirant Settings ({profile.name})</span>
            </button>
            <span className="text-slate-800">•</span>
            <span className="text-[11px] text-slate-500 font-mono">
              Target: CSE {profile.targetYear}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
