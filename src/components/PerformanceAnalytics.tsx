import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Sparkles, 
  Trash2, 
  Award, 
  Percent, 
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MockTestRecord, PerformanceDiagnostic, AspirantProfile } from '../types';

interface PerformanceAnalyticsProps {
  mockTests: MockTestRecord[];
  setMockTests: React.Dispatch<React.SetStateAction<MockTestRecord[]>>;
  profile: AspirantProfile;
  dailyHoursAverage: number;
  syllabusProgress: number;
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  mockTests,
  setMockTests,
  profile,
  dailyHoursAverage,
  syllabusProgress,
}) => {
  const [filterStage, setFilterStage] = useState<'all' | 'prelims' | 'mains'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<PerformanceDiagnostic | null>(null);

  // New mock test form
  const [testName, setTestName] = useState('');
  const [seriesName, setSeriesName] = useState('Vision IAS');
  const [stage, setStage] = useState<'prelims' | 'mains'>('prelims');
  const [paperType, setPaperType] = useState('GS Paper 1');
  const [maxMarks, setMaxMarks] = useState('200');
  const [correctCount, setCorrectCount] = useState('55');
  const [incorrectCount, setIncorrectCount] = useState('25');
  const [unattemptedCount, setUnattemptedCount] = useState('20');
  const [mainsScore, setMainsScore] = useState('95');
  const [weakTopicsStr, setWeakTopicsStr] = useState('');
  const [strongTopicsStr, setStrongTopicsStr] = useState('');
  const [testNotes, setTestNotes] = useState('');

  // Auto-calculated Prelims score
  const numCorrect = parseInt(correctCount) || 0;
  const numIncorrect = parseInt(incorrectCount) || 0;
  const numUnattempted = parseInt(unattemptedCount) || 0;
  const isPrelims = stage === 'prelims';
  const calculatedPrelimsScore = isPrelims
    ? Math.max(0, parseFloat(((numCorrect * 2) - (numIncorrect * (2 / 3))).toFixed(2)))
    : parseFloat(mainsScore) || 0;
  const negativePenalty = isPrelims ? parseFloat((numIncorrect * (2 / 3)).toFixed(2)) : 0;
  const calculatedAccuracy = numCorrect + numIncorrect > 0
    ? parseFloat(((numCorrect / (numCorrect + numIncorrect)) * 100).toFixed(1))
    : 0;

  // Filtered mock tests
  const filteredTests = mockTests.filter((m) => filterStage === 'all' || m.stage === filterStage);

  // High level aggregated stats
  const prelimsList = mockTests.filter((m) => m.stage === 'prelims');
  const totalNegativeMarksLost = prelimsList.reduce((acc, curr) => acc + (curr.negativeMarks || 0), 0);
  const avgAccuracy = prelimsList.length > 0
    ? Math.round(prelimsList.reduce((acc, curr) => acc + (curr.accuracyRate || 0), 0) / prelimsList.length)
    : 0;
  const avgPrelimsScore = prelimsList.length > 0
    ? (prelimsList.reduce((acc, curr) => acc + curr.totalScore, 0) / prelimsList.length).toFixed(1)
    : '0';

  const handleDeleteTest = (id: string) => {
    setMockTests((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreateMockTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    const newRecord: MockTestRecord = {
      id: `mock-${Date.now()}`,
      testName: testName.trim(),
      seriesName,
      date: new Date().toISOString().split('T')[0],
      stage,
      paperType,
      totalScore: calculatedPrelimsScore,
      maxMarks: parseFloat(maxMarks) || 200,
      correctCount: isPrelims ? numCorrect : undefined,
      incorrectCount: isPrelims ? numIncorrect : undefined,
      unattemptedCount: isPrelims ? numUnattempted : undefined,
      negativeMarks: isPrelims ? negativePenalty : undefined,
      accuracyRate: isPrelims ? calculatedAccuracy : undefined,
      weakTopics: weakTopicsStr ? weakTopicsStr.split(',').map((s) => s.trim()).filter(Boolean) : [],
      strongTopics: strongTopicsStr ? strongTopicsStr.split(',').map((s) => s.trim()).filter(Boolean) : [],
      notes: testNotes,
    };

    setMockTests((prev) => [newRecord, ...prev]);

    if (calculatedPrelimsScore >= 90) {
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch (e) {}
    }

    // Reset form
    setTestName('');
    setWeakTopicsStr('');
    setStrongTopicsStr('');
    setTestNotes('');
    setShowAddModal(false);
  };

  const handleRunAiDiagnostic = async () => {
    setDiagnosticLoading(true);
    setDiagnosticResult(null);

    try {
      const response = await fetch('/api/ai/analyze-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mockScores: mockTests,
          dailyStudyHoursAverage: dailyHoursAverage,
          syllabusCoveragePercentage: syllabusProgress,
          weakSubjects: mockTests.flatMap((m) => m.weakTopics).slice(0, 5),
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setDiagnosticResult(resJson.data);
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
        } catch (e) {}
      } else {
        alert('Diagnostic could not be generated: ' + (resJson.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Network error while running diagnostic.');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-orange-400">
                Exam Simulation &amp; Analytics
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Cutoff Readiness Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-scholarly">
              Mock Test Performance &amp; Negative Mark Leak Detector
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track Prelims &amp; Mains test series, detect where negative penalties eat into your score, and get AI diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRunAiDiagnostic}
              disabled={diagnosticLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{diagnosticLoading ? 'Analyzing Performance...' : 'Run AI Diagnostic'}</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span>Log Mock Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Analytics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs flex justify-between mb-1">
            <span>Avg Prelims Score</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{avgPrelimsScore}</div>
          <span className="text-[11px] text-amber-400 block mt-1">
            Target Cutoff: 88 - 95 Marks
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs flex justify-between mb-1">
            <span>Average Accuracy</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{avgAccuracy}%</div>
          <span className="text-[11px] text-emerald-400 block mt-1">
            High confidence threshold: &gt;70%
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs flex justify-between mb-1">
            <span>Negative Marks Lost</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            -{totalNegativeMarksLost.toFixed(1)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Total penalty across {prelimsList.length} prelims tests
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs flex justify-between mb-1">
            <span>Tests Logged</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{mockTests.length}</div>
          <span className="text-[11px] text-cyan-400 block mt-1">
            {prelimsList.length} Prelims • {mockTests.length - prelimsList.length} Mains
          </span>
        </div>
      </div>

      {/* AI Diagnostic Report Banner (if generated) */}
      {diagnosticResult && (
        <div className="bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl relative animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base sm:text-lg">
                  UPSC AI Diagnostic &amp; Strategy Verdict
                </h3>
              </div>
              <p className="text-xs text-amber-300/80 mt-1">
                Data-driven root cause analysis of your test attempts and negative marking leaks.
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-xs text-slate-400 block">Readiness Score</span>
              <span className="text-2xl font-bold font-mono text-amber-400">
                {diagnosticResult.overallReadinessScore}/100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Prelims Cutoff Survival</span>
              <span className="text-sm font-bold text-emerald-400">
                {diagnosticResult.prelimsSurvivalProbability}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Negative Marking Leak Risk</span>
              <span className={`text-sm font-bold ${
                diagnosticResult.negativeMarkingDiagnosis.severity === 'Critical' || diagnosticResult.negativeMarkingDiagnosis.severity === 'High'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}>
                {diagnosticResult.negativeMarkingDiagnosis.severity} Risk
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">Elimination Strategy</span>
              <p className="text-xs text-slate-300 leading-snug">
                {diagnosticResult.negativeMarkingDiagnosis.eliminationTechniqueFix}
              </p>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800/80 p-4 rounded-xl mb-4 text-xs text-slate-200 leading-relaxed">
            <h4 className="font-semibold text-amber-400 mb-1">Executive Summary:</h4>
            {diagnosticResult.diagnosticSummary}
          </div>

          {/* Next 14-day Sprint Action Plan */}
          {diagnosticResult.next14DaysActionSprint && diagnosticResult.next14DaysActionSprint.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Prescribed 14-Day Remedial Action Sprint:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {diagnosticResult.next14DaysActionSprint.map((sprint, idx) => (
                  <div key={idx} className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg text-xs">
                    <span className="text-amber-400 font-mono font-bold block mb-0.5">
                      {sprint.dayRange}
                    </span>
                    <p className="text-slate-200 font-medium mb-1">{sprint.targetTask}</p>
                    <span className="text-[11px] text-slate-400">Metric: {sprint.metricToTrack}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diagnosticResult.motivationalNudge && (
            <div className="text-xs text-amber-200/90 italic border-l-2 border-amber-400 pl-3 py-1 font-serif-scholarly">
              “{diagnosticResult.motivationalNudge}”
            </div>
          )}
        </div>
      )}

      {/* Stage Filter & Test List */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {(['all', 'prelims', 'mains'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStage(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterStage === s
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {s} Tests
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">{filteredTests.length} tests recorded</span>
      </div>

      {/* Mock Tests Cards */}
      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            No mock tests recorded under this category yet.
          </div>
        ) : (
          filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-800 text-amber-400">
                    {test.seriesName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-950 border border-slate-800 text-slate-300">
                    {test.paperType}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {test.date}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white mb-2">
                  {test.testName}
                </h3>

                {test.stage === 'prelims' && test.correctCount !== undefined && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {test.correctCount} Correct (+{(test.correctCount * 2).toFixed(1)})
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <XCircle className="w-3.5 h-3.5" />
                      {test.incorrectCount} Wrong (-{test.negativeMarks?.toFixed(2)})
                    </span>
                    <span className="text-slate-400">
                      {test.unattemptedCount} Skipped
                    </span>
                    <span className="text-amber-400 font-semibold font-mono">
                      Accuracy: {test.accuracyRate}%
                    </span>
                  </div>
                )}

                {test.weakTopics && test.weakTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] text-rose-400/90 font-medium">Weak spots:</span>
                    {test.weakTopics.map((w, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950/40 text-rose-300 border border-rose-900/40">
                        {w}
                      </span>
                    ))}
                  </div>
                )}

                {test.notes && (
                  <p className="text-[11px] text-slate-400 italic mt-2">
                    Note: {test.notes}
                  </p>
                )}
              </div>

              {/* Score Display & Delete */}
              <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 gap-2">
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
                    {test.totalScore}
                    <span className="text-xs font-normal text-slate-400 ml-1">/ {test.maxMarks}</span>
                  </div>
                  <span className={`text-[11px] font-semibold ${
                    test.totalScore >= 95 ? 'text-emerald-400' : test.totalScore >= 80 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {test.totalScore >= 95 ? 'Comfortable Safe Zone' : test.totalScore >= 80 ? 'Cutoff Boundary' : 'Below Cutoff'}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteTest(test.id)}
                  className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg transition-colors"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Mock Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Log Mock Test Result
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your test breakdown. Scores and negative mark penalties are auto-calculated.
            </p>

            <form onSubmit={handleCreateMockTest} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Test Name</label>
                <input
                  type="text"
                  required
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. Vision Abhyaas Mock 2 - Full Syllabus"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Institute / Series</label>
                  <select
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Vision IAS">Vision IAS</option>
                    <option value="ForumIAS">ForumIAS</option>
                    <option value="InsightsIAS">InsightsIAS</option>
                    <option value="Vajiram & Ravi">Vajiram &amp; Ravi</option>
                    <option value="Shankar IAS">Shankar IAS</option>
                    <option value="NextIAS">NextIAS</option>
                    <option value="UPSC Previous Year">UPSC PYQ Paper</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="prelims">Prelims</option>
                    <option value="mains">Mains</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Paper Type</label>
                  <input
                    type="text"
                    value={paperType}
                    onChange={(e) => setPaperType(e.target.value)}
                    placeholder="e.g. GS Paper 1 or CSAT"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {isPrelims ? (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-orange-400">
                    Prelims Question Count Breakdown:
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-emerald-400 block mb-1">Correct Qs</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={correctCount}
                        onChange={(e) => setCorrectCount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-rose-400 block mb-1">Incorrect Qs</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={incorrectCount}
                        onChange={(e) => setIncorrectCount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Unattempted</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={unattemptedCount}
                        onChange={(e) => setUnattemptedCount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Auto-calc summary */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-300">
                      Calculated Net Score: <strong className="text-amber-400 font-mono text-sm">{calculatedPrelimsScore}</strong>
                    </span>
                    <span className="text-rose-400">
                      Penalty Lost: -{negativePenalty}
                    </span>
                    <span className="text-emerald-400">
                      Accuracy: {calculatedAccuracy}%
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Mains Marks Awarded</label>
                  <input
                    type="number"
                    step="0.5"
                    value={mainsScore}
                    onChange={(e) => setMainsScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-300 block mb-1">Weak Topics (Comma separated)</label>
                <input
                  type="text"
                  value={weakTopicsStr}
                  onChange={(e) => setWeakTopicsStr(e.target.value)}
                  placeholder="e.g. Art & Architecture, River tributaries, Fiscal deficit definitions"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Aspirant Reflections / Mistakes Done</label>
                <textarea
                  rows={2}
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                  placeholder="e.g. Changed 4 correct answers to wrong in final 10 mins. Need to stop second-guessing."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
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
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-400 text-slate-950 shadow-md shadow-orange-500/20"
                >
                  Save Mock Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
