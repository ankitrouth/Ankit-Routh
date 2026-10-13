export type PaperCategory = 'Prelims' | 'GS1' | 'GS2' | 'GS3' | 'GS4' | 'CSAT' | 'Optional' | 'Essay';

export type RevisionStatus = 'not_started' | 'reading_1' | 'revised_2' | 'mastered_3';

export interface SyllabusItem {
  id: string;
  paper: PaperCategory;
  subject: string;
  topic: string;
  subtopics?: string[];
  status: RevisionStatus;
  highYield: boolean;
  lastRevised?: string;
  notes?: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  category: PaperCategory | 'Current Affairs' | 'Revision' | 'Answer Writing' | 'CSAT';
  targetHours: number;
  completedHours: number;
  completed: boolean;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MonthlyGoal {
  id: string;
  title: string;
  category: PaperCategory | 'Current Affairs' | 'Mock Tests' | 'Answer Writing' | 'Optional';
  targetValue: number;
  currentValue: number;
  unit: string; // 'hours' | 'tests' | 'chapters' | 'answers'
  completed: boolean;
  month: string; // '2026-10'
}

export interface StudyReminder {
  id: string;
  title: string;
  time: string; // "HH:MM" e.g. "06:30"
  enabled: boolean;
  category: string;
  repeatDaily: boolean;
  label: string;
}

export interface AiMotivationalQuote {
  quote: string;
  authorOrAttribution: string;
  personalMentorNote: string;
  lbsnaaMantra: string;
  actionForNextHour: string;
}

export interface FlashcardItem {
  id: string;
  paper: PaperCategory;
  subject: string;
  topic: string;
  front: string;
  back: string;
  masteryLevel: 'learning' | 'review' | 'mastered';
  lastReviewed?: string;
  highYield: boolean;
}

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  subject: string;
  topic: string;
  sessionType: 'reading' | 'revision' | 'answer_writing' | 'mock_test' | 'current_affairs';
  energyRating: number; // 1-5
  notes?: string;
}

export interface MockTestRecord {
  id: string;
  testName: string;
  seriesName: string; // e.g. Vision IAS, ForumIAS, InsightsIAS, Vajiram, Shankar IAS
  date: string;
  stage: 'prelims' | 'mains';
  paperType: string; // 'GS Paper 1', 'CSAT Paper 2', 'GS-1 Mains', etc.
  totalScore: number;
  maxMarks: number;
  // Prelims specific
  correctCount?: number;
  incorrectCount?: number;
  unattemptedCount?: number;
  negativeMarks?: number;
  accuracyRate?: number; // %
  // Mains specific
  evaluatedBy?: string;
  weakTopics: string[];
  strongTopics: string[];
  notes?: string;
}

export interface EvaluatedAnswerRecord {
  id: string;
  date: string;
  question: string;
  answer: string;
  gsPaper: string;
  maxMarks: number;
  targetWordCount: number;
  actualWordCount: number;
  evaluation: {
    marksAwarded: number;
    maxMarks: number;
    percentage: number;
    overallVerdict: string;
    structureAnalysis: {
      introductionScore: number;
      introductionFeedback: string;
      bodyScore: number;
      bodyFeedback: string;
      conclusionScore: number;
      conclusionFeedback: string;
    };
    dimensionsCovered: string[];
    dimensionsMissed: string[];
    valueAdditionSuggestions: {
      constitutionalArticles: string[];
      supremeCourtCasesOrCommittees: string[];
      schemesOrReports: string[];
      diagramOrFlowchartIdea: string;
    };
    actionableImprovements: string[];
    modelAnswerSnippet: string;
  };
}

export interface AspirantProfile {
  name: string;
  targetYear: number;
  targetAttempt: string;
  aspirantType: 'full_time' | 'working_professional' | 'college_student';
  stageFocus: 'prelims_focused' | 'mains_oriented' | 'integrated' | 'optional_deep_dive';
  optionalSubject: string;
  dailyHoursTarget: number;
  streakDays: number;
  lastActiveDate: string;
  examDatePrelims: string; // e.g., '2026-05-24'
}

export interface GeneratedStudyPlan {
  strategyTitle: string;
  executiveSummary: string;
  dailySchedule: Array<{
    timeSlot: string;
    activity: string;
    subjectFocus: string;
    productivityTip: string;
  }>;
  weeklyMilestones: Array<{
    day: string;
    coreFocus: string;
    deliverable: string;
  }>;
  revisionRule: string;
  recommendedResources: Array<{
    subject: string;
    standardBooks: string[];
    proTip: string;
  }>;
  weakAreaRemedies: Array<{
    area: string;
    specificAction: string;
  }>;
  goldenAdvice: string[];
}

export interface PerformanceDiagnostic {
  overallReadinessScore: number;
  prelimsSurvivalProbability: string;
  diagnosticSummary: string;
  negativeMarkingDiagnosis: {
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    analysis: string;
    eliminationTechniqueFix: string;
  };
  subjectWiseHealth: Array<{
    subject: string;
    status: 'Strong' | 'Average' | 'Vulnerable';
    actionNeeded: string;
  }>;
  next14DaysActionSprint: Array<{
    dayRange: string;
    targetTask: string;
    metricToTrack: string;
  }>;
  motivationalNudge: string;
}

export interface PrelimsQuestion {
  id: string;
  context?: string;
  statements: string[];
  options: Array<{
    label: 'A' | 'B' | 'C' | 'D';
    text: string;
  }>;
  correctOption: 'A' | 'B' | 'C' | 'D';
  detailedExplanation: string;
  eliminationTechnique: string;
  pyqReferenceTrend: string;
}
