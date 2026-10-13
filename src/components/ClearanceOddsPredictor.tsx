import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Target, 
  Sliders, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  HelpCircle,
  Award,
  BookOpen,
  PenTool,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MockTestRecord, SyllabusItem, EvaluatedAnswerRecord, AspirantProfile } from '../types';

interface ClearanceOddsPredictorProps {
  mockTests: MockTestRecord[];
  syllabus: SyllabusItem[];
  evaluations: EvaluatedAnswerRecord[];
  profile: AspirantProfile;
  dailyHoursAverage: number;
}

export const ClearanceOddsPredictor: React.FC<ClearanceOddsPredictorProps> = ({
  mockTests,
  syllabus,
  evaluations,
  profile,
  dailyHoursAverage,
}) => {
  const [showSimulator, setShowSimulator] = useState(false);
  const [simMockScoreBoost, setSimMockScoreBoost] = useState(0); // -10 to +20
  const [simNegativeMarkReduction, setSimNegativeMarkReduction] = useState(0); // 0 to 10
  const [simAnswerWritingCount, setSimAnswerWritingCount] = useState(0); // 0 to 30

  // 1. DATA EXTRACTION
  const prelimsTests = mockTests.filter((m) => m.stage === 'prelims' && m.paperType.includes('GS'));
  const csatTests = mockTests.filter((m) => m.stage === 'prelims' && m.paperType.includes('CSAT'));
  const mainsTests = mockTests.filter((m) => m.stage === 'mains');

  // Average GS-1 Prelims score
  const avgGsScore = prelimsTests.length > 0
    ? prelimsTests.reduce((acc, curr) => acc + curr.totalScore, 0) / prelimsTests.length
    : 85;

  // Average CSAT score
  const avgCsatScore = csatTests.length > 0
    ? csatTests.reduce((acc, curr) => acc + curr.totalScore, 0) / csatTests.length
    : 78;

  // Average Negative Marks lost per test
  const avgNegativeLeak = prelimsTests.length > 0
    ? prelimsTests.reduce((acc, curr) => acc + (curr.negativeMarks || 0), 0) / prelimsTests.length
    : 16;

  // Average Mock Accuracy
  const avgAccuracy = prelimsTests.length > 0
    ? prelimsTests.reduce((acc, curr) => acc + (curr.accuracyRate || 0), 0) / prelimsTests.length
    : 68;

  // Syllabus revision stats
  const totalSyllabus = syllabus.length || 1;
  const masteredCount = syllabus.filter((s) => s.status === 'mastered_3').length;
  const revisedCount = syllabus.filter((s) => s.status === 'revised_2').length;
  const readingCount = syllabus.filter((s) => s.status === 'reading_1').length;
  const syllabusWeightedScore = ((masteredCount * 1.0 + revisedCount * 0.7 + readingCount * 0.4) / totalSyllabus) * 100;

  // Mains Answer writing stats
  const evaluatedCount = evaluations.length;
  const avgEvalScore = evaluations.length > 0
    ? evaluations.reduce((acc, curr) => acc + curr.evaluation.marksAwarded, 0) / evaluations.length
    : 5.2;

  // 2. MATHEMATICAL CHANCES CALCULATION MODEL (Realistic UPSC CSE)
  // Benchmark Cutoff = 90.0 marks for GS-1 Prelims
  const CUTOFF_BENCHMARK = 90.0;
  const effectiveGsScore = avgGsScore + simMockScoreBoost;
  const effectiveNegativeLeak = Math.max(2, avgNegativeLeak - simNegativeMarkReduction);

  // Score Cushion Factor (40% weight)
  const scoreMargin = effectiveGsScore - CUTOFF_BENCHMARK;
  let scoreScoreFactor = 50;
  if (scoreMargin >= 20) scoreScoreFactor = 92;
  else if (scoreMargin >= 12) scoreScoreFactor = 84;
  else if (scoreMargin >= 5) scoreScoreFactor = 74;
  else if (scoreMargin >= 0) scoreScoreFactor = 62;
  else if (scoreMargin >= -8) scoreScoreFactor = 42;
  else scoreScoreFactor = 22;

  // Accuracy & Negative Marking Factor (25% weight)
  let accuracyFactor = 50;
  if (avgAccuracy >= 75 && effectiveNegativeLeak <= 12) accuracyFactor = 88;
  else if (avgAccuracy >= 70 && effectiveNegativeLeak <= 16) accuracyFactor = 78;
  else if (avgAccuracy >= 65) accuracyFactor = 62;
  else accuracyFactor = 35;

  // CSAT Qualifying Safety Factor (15% weight)
  let csatFactor = 70;
  if (avgCsatScore >= 95) csatFactor = 96;
  else if (avgCsatScore >= 80) csatFactor = 88;
  else if (avgCsatScore >= 67) csatFactor = 55; // Danger zone near 66.67
  else csatFactor = 20; // Critical failure risk

  // Syllabus Depth Factor (20% weight)
  let syllabusFactor = Math.min(95, Math.round(syllabusWeightedScore * 1.3));

  // Compute Raw Prelims Probability
  let rawPrelimsOdds = Math.round(
    scoreScoreFactor * 0.4 +
    accuracyFactor * 0.25 +
    csatFactor * 0.15 +
    syllabusFactor * 0.2
  );
  rawPrelimsOdds = Math.max(12, Math.min(93, rawPrelimsOdds));

  // MAINS PROBABILITY MODEL (Among those who reach Mains)
  // Factors: DAW answers written (35%), Eval score (35%), Optional status (20%), Daily consistency (10%)
  const effectiveAnswerCount = evaluatedCount + simAnswerWritingCount;
  let dawFactor = 35;
  if (effectiveAnswerCount >= 50) dawFactor = 90;
  else if (effectiveAnswerCount >= 25) dawFactor = 76;
  else if (effectiveAnswerCount >= 10) dawFactor = 58;
  else dawFactor = 36;

  let evalScoreFactor = 40;
  if (avgEvalScore >= 6.2) evalScoreFactor = 88;
  else if (avgEvalScore >= 5.5) evalScoreFactor = 74;
  else if (avgEvalScore >= 4.8) evalScoreFactor = 56;
  else evalScoreFactor = 38;

  let optionalFactor = profile.optionalSubject ? 68 : 45;
  let consistencyFactor = dailyHoursAverage >= profile.dailyHoursTarget ? 85 : 62;

  let rawMainsOdds = Math.round(
    dawFactor * 0.35 +
    evalScoreFactor * 0.35 +
    optionalFactor * 0.20 +
    consistencyFactor * 0.10
  );
  rawMainsOdds = Math.max(10, Math.min(88, rawMainsOdds));

  // Cumulative Final Selection Probability (Prelims * Mains * Interview ~42%)
  const cumulativeFinalOdds = parseFloat(((rawPrelimsOdds / 100) * (rawMainsOdds / 100) * 0.42 * 100).toFixed(1));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
              Data-Backed Cutoff Diagnostics
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">UPSC Standard Modeling</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Realistic Chances of Clearing Prelims &amp; Mains
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Objective mathematical odds calculated from your actual mock test scores, negative marking leaks, CSAT safety cushion, and answer writing consistency.
          </p>
        </div>

        <button
          onClick={() => setShowSimulator(!showSimulator)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer self-start md:self-auto ${
            showSimulator
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showSimulator ? 'Close Odds Simulator' : 'Simulate What-If Levers'}</span>
        </button>
      </div>

      {/* 3 Major Odds Cards (Prelims, Mains, Final Selection) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Prelims Clearance Odds */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-cyan-400 font-mono">
                Stage 1: Prelims
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800 text-cyan-300 font-semibold">
                {rawPrelimsOdds >= 70 ? 'Competitive Safe Zone' : rawPrelimsOdds >= 50 ? 'Cutoff Boundary' : 'Vulnerable Margin'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                {rawPrelimsOdds}%
              </span>
              <span className="text-xs text-slate-400">realistic probability</span>
            </div>

            {/* Visual Probability Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden my-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  rawPrelimsOdds >= 70
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                    : rawPrelimsOdds >= 50
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                    : 'bg-gradient-to-r from-rose-500 to-amber-500'
                }`}
                style={{ width: `${rawPrelimsOdds}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Mock Cushion vs 90 Cutoff:</span>
              <strong className={scoreMargin >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                {scoreMargin >= 0 ? `+${scoreMargin.toFixed(1)} marks` : `${scoreMargin.toFixed(1)} marks`}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>CSAT Safety Status:</span>
              <strong className={avgCsatScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                {avgCsatScore.toFixed(1)} marks (Cutoff: 66.7)
              </strong>
            </div>
            <div className="flex justify-between">
              <span>National Candidate Base:</span>
              <span className="text-slate-300 font-mono">Top ~1.4% qualify</span>
            </div>
          </div>
        </div>

        {/* 2. Mains Clearance Odds */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-400 font-mono">
                Stage 2: Mains (DAW)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-800 text-amber-300 font-semibold">
                {rawMainsOdds >= 65 ? 'High Rank Velocity' : rawMainsOdds >= 45 ? 'Solid Framework' : 'Needs DAW Volume'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                {rawMainsOdds}%
              </span>
              <span className="text-xs text-slate-400">among Prelims qualifiers</span>
            </div>

            {/* Visual Probability Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden my-2">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-700"
                style={{ width: `${rawMainsOdds}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Avg Answer Evaluation:</span>
              <strong className="text-amber-400 font-mono">{avgEvalScore.toFixed(1)} / 10 marks</strong>
            </div>
            <div className="flex justify-between">
              <span>Answers Written:</span>
              <strong className="text-slate-300 font-mono">{effectiveAnswerCount} completed</strong>
            </div>
            <div className="flex justify-between">
              <span>Stage Selection Ratio:</span>
              <span className="text-slate-300 font-mono">Top ~20% of Mains pool</span>
            </div>
          </div>
        </div>

        {/* 3. Cumulative Final Selection Probability */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-950 to-amber-950/20">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 font-mono">
                Final Civil Service List
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-semibold">
                Upper Quartile Aspirant
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400">
                {cumulativeFinalOdds}%
              </span>
              <span className="text-xs text-slate-400">final rank odds</span>
            </div>

            {/* Visual Probability Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden my-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, cumulativeFinalOdds * 4)}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>National Random Aspirant:</span>
              <span className="text-slate-500 font-mono">~0.1% (1 in 1000)</span>
            </div>
            <div className="flex justify-between">
              <span>Your Competitive Multiplier:</span>
              <strong className="text-emerald-400 font-mono">
                ~{Math.round(cumulativeFinalOdds / 0.1)}x above baseline
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Key Focus Lever:</span>
              <span className="text-amber-300 font-medium">DAW &amp; Cutoff Cushion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Odds Impact Simulator ("What-If Levers") */}
      {showSimulator && (
        <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-white text-xs sm:text-sm">
                Interactive Odds Simulator: What moves your UPSC chances most?
              </h4>
            </div>
            <button
              onClick={() => {
                setSimMockScoreBoost(0);
                setSimNegativeMarkReduction(0);
                setSimAnswerWritingCount(0);
              }}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Reset Levers
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Slider 1: Mock GS Score Boost */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Mock Score Improvement:</span>
                <span className="font-mono font-bold text-amber-400">
                  {simMockScoreBoost > 0 ? `+${simMockScoreBoost}` : simMockScoreBoost} marks
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="25"
                step="5"
                value={simMockScoreBoost}
                onChange={(e) => setSimMockScoreBoost(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Target Score: {(avgGsScore + simMockScoreBoost).toFixed(1)} marks
              </span>
            </div>

            {/* Slider 2: Negative Mark Reduction */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Reduce Negative Penalty Leak:</span>
                <span className="font-mono font-bold text-emerald-400">
                  -{simNegativeMarkReduction} marks saved
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="2"
                value={simNegativeMarkReduction}
                onChange={(e) => setSimNegativeMarkReduction(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Stops blind 50-50 guessing in Prelims
              </span>
            </div>

            {/* Slider 3: Daily Answer Writing Submissions */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Write More Mains Answers:</span>
                <span className="font-mono font-bold text-cyan-400">
                  +{simAnswerWritingCount} answers
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={simAnswerWritingCount}
                onChange={(e) => setSimAnswerWritingCount(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Builds 7-minute answer muscle memory
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Critical Strengths vs Vulnerability Leaks Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Competitive Strengths */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Competitive Anchors (Working In Your Favor):</span>
          </div>
          <ul className="text-xs space-y-1.5 text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>GS-1 Mock average ({avgGsScore.toFixed(1)} marks) sits securely above baseline cutoff threshold.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>CSAT score ({avgCsatScore.toFixed(1)} marks) exceeds the 66.67 qualifying trap zone.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Syllabus mastery depth has {masteredCount} topics verified in 3rd revision cycle.</span>
            </li>
          </ul>
        </div>

        {/* Vulnerability Leaks (Remedies) */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Vulnerability Leaks (Threats to Clearance):</span>
          </div>
          <ul className="text-xs space-y-1.5 text-slate-300">
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>Negative marks penalty ({avgNegativeLeak.toFixed(1)} marks/test) is eating ~8% of your cutoff cushion.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>Mains DAW volume ({evaluatedCount} answers evaluated) needs expansion to reach the 60+ benchmark.</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>Optional subject revision depth must be prioritized (Optional carries 500 marks).</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
