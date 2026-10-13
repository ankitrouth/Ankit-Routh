import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Sparkles, 
  Clock, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  HelpCircle, 
  Copy, 
  Share2, 
  Play, 
  Pause, 
  RotateCcw,
  BookOpen,
  Layers,
  ChevronDown,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CURATED_MAINS_QUESTIONS } from '../data/initialData';
import { EvaluatedAnswerRecord } from '../types';

interface MainsEvaluatorProps {
  evaluations: EvaluatedAnswerRecord[];
  setEvaluations: React.Dispatch<React.SetStateAction<EvaluatedAnswerRecord[]>>;
}

export const MainsEvaluator: React.FC<MainsEvaluatorProps> = ({
  evaluations,
  setEvaluations,
}) => {
  const [selectedQuestionPreset, setSelectedQuestionPreset] = useState(CURATED_MAINS_QUESTIONS[0].id);
  const [questionText, setQuestionText] = useState(CURATED_MAINS_QUESTIONS[0].question);
  const [answerText, setAnswerText] = useState('');
  const [gsPaper, setGsPaper] = useState(CURATED_MAINS_QUESTIONS[0].paper);
  const [maxMarks, setMaxMarks] = useState(CURATED_MAINS_QUESTIONS[0].maxMarks);
  const [targetWordCount, setTargetWordCount] = useState(CURATED_MAINS_QUESTIONS[0].wordCount);
  const [studentNotes, setStudentNotes] = useState('');

  // Timer state for answer writing test
  const defaultTimerSeconds = maxMarks === 10 ? 7 * 60 : 11 * 60;
  const [timerSeconds, setTimerSeconds] = useState(defaultTimerSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentResult, setCurrentResult] = useState<EvaluatedAnswerRecord['evaluation'] | null>(
    evaluations.length > 0 ? evaluations[0].evaluation : null
  );
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(
    evaluations.length > 0 ? evaluations[0].id : null
  );

  // Live word counter
  const words = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  // Handle Preset selection
  const handleSelectPreset = (id: string) => {
    setSelectedQuestionPreset(id);
    const item = CURATED_MAINS_QUESTIONS.find((q) => q.id === id);
    if (item) {
      setQuestionText(item.question);
      setGsPaper(item.paper);
      setMaxMarks(item.maxMarks);
      setTargetWordCount(item.wordCount);
      const newTime = item.maxMarks === 10 ? 7 * 60 : 11 * 60;
      setTimerSeconds(newTime);
      setIsTimerRunning(false);
    }
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const timerMin = Math.floor(timerSeconds / 60);
  const timerSec = timerSeconds % 60;

  const handleEvaluate = async () => {
    if (!questionText.trim()) {
      alert('Please provide a question.');
      return;
    }
    if (!answerText.trim() || words < 20) {
      alert('Please write an answer of at least 20 words for meaningful evaluation.');
      return;
    }

    setIsEvaluating(true);
    setCurrentResult(null);

    try {
      const response = await fetch('/api/ai/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          answer: answerText,
          gsPaper,
          maxMarks,
          targetWordCount,
          studentNotes,
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const evalData = resJson.data;
        setCurrentResult(evalData);

        const newRecord: EvaluatedAnswerRecord = {
          id: `eval-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          question: questionText,
          answer: answerText,
          gsPaper,
          maxMarks,
          targetWordCount,
          actualWordCount: words,
          evaluation: evalData,
        };

        setEvaluations((prev) => [newRecord, ...prev]);
        setViewingHistoryId(newRecord.id);

        if (evalData.marksAwarded >= (maxMarks * 0.55)) {
          try {
            confetti({
              particleCount: 70,
              spread: 65,
              origin: { y: 0.6 },
            });
          } catch (e) {}
        }
      } else {
        alert(resJson.error || 'Failed to evaluate answer. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error connecting to evaluation engine.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSelectHistory = (record: EvaluatedAnswerRecord) => {
    setViewingHistoryId(record.id);
    setCurrentResult(record.evaluation);
    setQuestionText(record.question);
    setAnswerText(record.answer);
    setGsPaper(record.gsPaper);
    setMaxMarks(record.maxMarks);
    setTargetWordCount(record.targetWordCount);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                UPSC Mains Paper Evaluation Suite
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Examiner Standard Rubrics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-scholarly">
              AI Mains Answer Writing &amp; Scoring Engine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant marks assessment, structure rating (Intro-Body-Conclusion), missed dimensions, constitutional citations &amp; model answers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Evaluations Saved: <strong className="text-amber-400 font-mono">{evaluations.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Writing Desk | Right = Live Evaluation Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Writing Studio */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            {/* Curated PYQ selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Select High-Yield Question or Write Your Own:
                </label>
                <span className="text-[10px] text-amber-400">UPSC Standard</span>
              </div>
              <select
                value={selectedQuestionPreset}
                onChange={(e) => handleSelectPreset(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {CURATED_MAINS_QUESTIONS.map((q) => (
                  <option key={q.id} value={q.id}>
                    [{q.paper}] ({q.maxMarks}M / {q.wordCount}W) - {q.question.slice(0, 70)}...
                  </option>
                ))}
                <option value="custom">-- Custom Question --</option>
              </select>
            </div>

            {/* Question Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Question Prompt:</span>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">{gsPaper}</span>
              </div>
              <textarea
                rows={3}
                value={questionText}
                onChange={(e) => {
                  setQuestionText(e.target.value);
                  setSelectedQuestionPreset('custom');
                }}
                placeholder="Enter or paste UPSC Mains question here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-serif-scholarly placeholder-slate-600"
              />
            </div>

            {/* Config bar: Paper, Marks, Word Target, Countdown Timer */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <label className="text-slate-400">Paper:</label>
                <select
                  value={gsPaper}
                  onChange={(e) => setGsPaper(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                >
                  <option value="GS-1">GS-1</option>
                  <option value="GS-2">GS-2</option>
                  <option value="GS-3">GS-3</option>
                  <option value="GS-4">GS-4 Ethics</option>
                  <option value="Essay">Essay</option>
                  <option value="Optional Paper 1">Optional 1</option>
                  <option value="Optional Paper 2">Optional 2</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-400">Marks:</label>
                <select
                  value={maxMarks}
                  onChange={(e) => {
                    const m = parseInt(e.target.value);
                    setMaxMarks(m);
                    setTargetWordCount(m === 10 ? 150 : 250);
                    setTimerSeconds(m === 10 ? 7 * 60 : 11 * 60);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                >
                  <option value={10}>10 Marks (150 words)</option>
                  <option value={15}>15 Marks (250 words)</option>
                  <option value={20}>20 Marks (300 words)</option>
                  <option value={125}>125 Marks (Essay)</option>
                </select>
              </div>

              {/* Exam Stopwatch */}
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono font-bold text-amber-400">
                  {String(timerMin).padStart(2, '0')}:{String(timerSec).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="p-1 rounded text-slate-300 hover:text-white ml-1"
                  title={isTimerRunning ? 'Pause' : 'Start countdown'}
                >
                  {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(maxMarks === 10 ? 7 * 60 : 11 * 60);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-slate-200"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Answer Writing Area */}
            <div>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="text-slate-300 font-medium">Your Answer:</span>
                <span className={`font-mono text-[11px] ${
                  words > targetWordCount * 1.15 ? 'text-rose-400' : words < targetWordCount * 0.7 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {words} / {targetWordCount} words
                </span>
              </div>
              <textarea
                rows={12}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write your answer using UPSC format:&#10;• Introduction (Definition/Context/Article)&#10;• Body Points with sub-headings & diagrams&#10;• Conclusion / Way Forward..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans placeholder-slate-700"
              />
            </div>

            {/* Optional student notes */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Optional note to AI Evaluator (e.g., "Evaluate strictly on 2nd ARC framework"):
              </label>
              <input
                type="text"
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="e.g. Focus on whether my constitutional articles are sufficient"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-700"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>
                {isEvaluating ? 'Evaluating with UPSC Rubrics...' : 'Evaluate Answer & Calculate Marks'}
              </span>
            </button>
          </div>

          {/* Past Evaluations History Accordion / List */}
          {evaluations.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-slate-100 text-xs uppercase tracking-wider">
                  Past Evaluated Answers
                </h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {evaluations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => handleSelectHistory(rec)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      viewingHistoryId === rec.id
                        ? 'bg-amber-950/40 border-amber-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-amber-400 font-bold">{rec.gsPaper}</span>
                        <span className="text-slate-400 text-[10px]">{rec.date}</span>
                      </div>
                      <p className="text-slate-300 truncate mt-0.5">{rec.question}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {rec.evaluation.marksAwarded}/{rec.maxMarks}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (6 cols): Comprehensive Evaluation Report */}
        <div className="lg:col-span-6 space-y-4">
          {isEvaluating ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className="text-base font-bold text-white mb-1">
                UPSC Examiner in Session
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Analyzing constitutional backing, structural balance (Intro/Body/Conclusion), PESTLE dimensions, and value-additions...
              </p>
            </div>
          ) : currentResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
              {/* Score header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                      Evaluation Verdict
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {currentResult.overallVerdict}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Assessed under standard UPSC CSE civil service answer key criteria.
                  </p>
                </div>

                <div className="text-right bg-slate-950 p-3 rounded-xl border border-slate-800 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Marks Awarded</span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
                    {currentResult.marksAwarded}
                    <span className="text-xs text-slate-500 font-normal"> / {currentResult.maxMarks}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 font-mono">
                    {currentResult.percentage}% yield
                  </span>
                </div>
              </div>

              {/* 3-Part Structure Analysis: Intro - Body - Conclusion */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Structural Scoring:
                </h4>
                <div className="space-y-2">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-cyan-300">1. Introduction</span>
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        {currentResult.structureAnalysis.introductionScore}/2
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentResult.structureAnalysis.introductionFeedback}
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-cyan-300">2. Body &amp; Arguments</span>
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        {currentResult.structureAnalysis.bodyScore}/6
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentResult.structureAnalysis.bodyFeedback}
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-cyan-300">3. Way Forward &amp; Conclusion</span>
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        {currentResult.structureAnalysis.conclusionScore}/2
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentResult.structureAnalysis.conclusionFeedback}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dimensions Covered vs Dimensions Missed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-emerald-950/20 border border-emerald-800/30 p-3.5 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Dimensions Covered:
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {currentResult.dimensionsCovered.map((dim, idx) => (
                      <li key={idx} className="leading-snug">{dim}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-950/20 border border-rose-800/30 p-3.5 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Crucial Dimensions Missed:
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {currentResult.dimensionsMissed.map((dim, idx) => (
                      <li key={idx} className="leading-snug">{dim}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* High-Yield Value Addition Toolkit */}
              <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Examiner Value-Addition Toolkit (Fetch +1 to +2 Extra Marks):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {currentResult.valueAdditionSuggestions.constitutionalArticles?.length > 0 && (
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                        Constitutional Articles / Provisions:
                      </span>
                      <p className="text-slate-200">
                        {currentResult.valueAdditionSuggestions.constitutionalArticles.join(', ')}
                      </p>
                    </div>
                  )}

                  {currentResult.valueAdditionSuggestions.supremeCourtCasesOrCommittees?.length > 0 && (
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                        Judgments &amp; Committees:
                      </span>
                      <p className="text-slate-200">
                        {currentResult.valueAdditionSuggestions.supremeCourtCasesOrCommittees.join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {currentResult.valueAdditionSuggestions.diagramOrFlowchartIdea && (
                  <div className="bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-lg text-xs">
                    <span className="text-[11px] text-amber-400 font-semibold block mb-0.5">
                      💡 Recommended Diagram / Schematic:
                    </span>
                    <p className="text-amber-200/90 leading-snug">
                      {currentResult.valueAdditionSuggestions.diagramOrFlowchartIdea}
                    </p>
                  </div>
                )}
              </div>

              {/* Model Answer Snippet */}
              {currentResult.modelAnswerSnippet && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <h4 className="font-semibold text-slate-200 mb-1.5 font-serif-scholarly">
                    Topper's Model Answer Snippet / Framing:
                  </h4>
                  <div className="text-slate-300 italic whitespace-pre-wrap leading-relaxed font-serif-scholarly pl-2 border-l-2 border-amber-500">
                    {currentResult.modelAnswerSnippet}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
              <PenTool className="w-10 h-10 text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-300 mb-1">
                No Answer Evaluated Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Select a high-yield question or paste your own, write your response on the desk, and hit "Evaluate Answer" to receive UPSC examiner grading.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
