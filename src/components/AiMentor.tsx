import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Compass, 
  Calendar, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle, 
  Newspaper, 
  Target, 
  ArrowRight,
  Flame,
  Award,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AspirantProfile, GeneratedStudyPlan, PrelimsQuestion } from '../types';

interface AiMentorProps {
  profile: AspirantProfile;
  setProfile: React.Dispatch<React.SetStateAction<AspirantProfile>>;
}

export const AiMentor: React.FC<AiMentorProps> = ({ profile, setProfile }) => {
  const [activeSubTab, setActiveSubTab] = useState<'strategy' | 'chat' | 'mcq_drill' | 'ca_mapper'>('strategy');

  // 1. Strategy Generator State
  const [targetYear, setTargetYear] = useState(profile.targetYear);
  const [aspirantType, setAspirantType] = useState(profile.aspirantType);
  const [stageFocus, setStageFocus] = useState(profile.stageFocus);
  const [dailyHours, setDailyHours] = useState(profile.dailyHoursTarget);
  const [optionalSubject, setOptionalSubject] = useState(profile.optionalSubject);
  const [weakAreas, setWeakAreas] = useState('CSAT Quant, Art & Culture, GS4 Ethics Case Studies');
  const [monthsLeft, setMonthsLeft] = useState(8);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedStudyPlan | null>(null);

  // 2. Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([
    {
      role: 'model',
      content:
        `Namaste ${profile.name}! I am your personalized UPSC Civil Services strategist and mentor. \n\nI can help you deconstruct complex GS concepts, map daily news to the syllabus, review mains answer structuring, or fix negative marking leaks in Prelims. How can I guide your preparation today?`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // 3. Prelims MCQ Drill State
  const [drillSubject, setDrillSubject] = useState('Indian Polity');
  const [drillTopic, setDrillTopic] = useState('Preamble & Basic Structure Doctrine');
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillQuestions, setDrillQuestions] = useState<PrelimsQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showDrillExplanations, setShowDrillExplanations] = useState<Record<string, boolean>>({});

  // 4. Current Affairs Mapper State
  const [caHeadline, setCaHeadline] = useState('India launches National Green Hydrogen Mission and carbon credit trading scheme');
  const [caDetails, setCaDetails] = useState('Cabinet approves ₹19,744 crore outlay for production targets of 5 MMT per annum by 2030.');
  const [caLoading, setCaLoading] = useState(false);
  const [caMappingResult, setCaMappingResult] = useState<any>(null);

  // Strategy Generator Handler
  const handleGenerateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingStrategy(true);

    try {
      const response = await fetch('/api/ai/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetYear,
          aspirantProfile: aspirantType,
          stageFocus,
          dailyHours,
          optionalSubject,
          weakAreas,
          currentMonthsLeft: monthsLeft,
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setGeneratedPlan(resJson.data);
        // Also update profile
        setProfile((prev) => ({
          ...prev,
          targetYear,
          aspirantType,
          stageFocus,
          dailyHoursTarget: dailyHours,
          optionalSubject,
        }));
        try {
          confetti({ particleCount: 60, spread: 70 });
        } catch (e) {}
      } else {
        alert(resJson.error || 'Failed to generate study plan.');
      }
    } catch (err: any) {
      alert('Error connecting to strategy planner.');
    } finally {
      setGeneratingStrategy(false);
    }
  };

  // Chat Handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputQuery;
    if (!text.trim() || chatLoading) return;

    const newHistory = [...chatMessages, { role: 'user' as const, content: text.trim() }];
    setChatMessages(newHistory);
    setInputQuery('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/ai/mentor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          userContext: {
            targetYear: profile.targetYear,
            dailyHours: profile.dailyHoursTarget,
            focus: profile.stageFocus,
            optional: profile.optionalSubject,
          },
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.reply) {
        setChatMessages((prev) => [...prev, { role: 'model', content: resJson.reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: 'model', content: 'An error occurred while thinking. Please rephrase.' },
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'model', content: 'Network error connecting to UPSC AI Mentor.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // MCQ Drill Handler
  const handleGenerateDrill = async () => {
    setDrillLoading(true);
    setDrillQuestions([]);
    setSelectedAnswers({});
    setShowDrillExplanations({});

    try {
      const response = await fetch('/api/ai/generate-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: drillSubject,
          topic: drillTopic,
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data?.questions) {
        setDrillQuestions(resJson.data.questions);
      } else {
        alert('Could not generate drill questions.');
      }
    } catch (e) {
      alert('Network error while generating MCQ drill.');
    } finally {
      setDrillLoading(false);
    }
  };

  // Current Affairs Mapper Handler
  const handleMapCurrentAffairs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caHeadline.trim()) return;

    setCaLoading(true);
    setCaMappingResult(null);

    try {
      const response = await fetch('/api/ai/map-current-affairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: caHeadline,
          articleSnippet: caDetails,
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setCaMappingResult(resJson.data);
      } else {
        alert(resJson.error || 'Failed to map current affairs.');
      }
    } catch (e) {
      alert('Network error while mapping news topic.');
    } finally {
      setCaLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                Personalized AI UPSC Strategist
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">24/7 Civil Service Guidance</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-scholarly">
              UPSC AI Mentor Suite
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized study timetables, live UPSC consultation, Prelims elimination drills, and syllabus news mapping.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('strategy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === 'strategy' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Study Timetable
            </button>
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === 'chat' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mentor Chat
            </button>
            <button
              onClick={() => setActiveSubTab('mcq_drill')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === 'mcq_drill' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              MCQ Elimination Drill
            </button>
            <button
              onClick={() => setActiveSubTab('ca_mapper')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === 'ca_mapper' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              News to Syllabus
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: STRATEGY & TIMETABLE GENERATOR */}
      {activeSubTab === 'strategy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Form (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Configure Your Aspirant Profile
            </h3>

            <form onSubmit={handleGenerateStrategy} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Target CSE Year</label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
                  >
                    <option value={2025}>CSE 2025</option>
                    <option value={2026}>CSE 2026</option>
                    <option value={2027}>CSE 2027</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Aspirant Profile</label>
                  <select
                    value={aspirantType}
                    onChange={(e) => setAspirantType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
                  >
                    <option value="full_time">Full-Time Aspirant</option>
                    <option value="working_professional">Working Professional</option>
                    <option value="college_student">College Student</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Daily Study Target</label>
                  <input
                    type="number"
                    step="0.5"
                    min="3"
                    max="14"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Stage Priority</label>
                  <select
                    value={stageFocus}
                    onChange={(e) => setStageFocus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
                  >
                    <option value="integrated">Integrated (Prelims + Mains)</option>
                    <option value="prelims_focused">Prelims Intensive</option>
                    <option value="mains_oriented">Mains DAW Intensive</option>
                    <option value="optional_deep_dive">Optional Deep-Dive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Optional Subject</label>
                <input
                  type="text"
                  value={optionalSubject}
                  onChange={(e) => setOptionalSubject(e.target.value)}
                  placeholder="e.g. PSIR, Sociology, Geography, Anthropology, PubAd"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Reported Weak Areas</label>
                <textarea
                  rows={2}
                  value={weakAreas}
                  onChange={(e) => setWeakAreas(e.target.value)}
                  placeholder="e.g. CSAT Comprehension, Art & Culture, Ancient History chronology"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={generatingStrategy}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{generatingStrategy ? 'Synthesizing High-Yield Timetable...' : 'Generate Bespoke UPSC Strategy'}</span>
              </button>
            </form>
          </div>

          {/* Results Output (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {generatingStrategy ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                <h4 className="font-bold text-white text-sm">Building Personalized Study Blueprint...</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Balancing static subjects, current affairs slots, daily answer writing, and spaced repetition cycles.
                </p>
              </div>
            ) : generatedPlan ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                    Bespoke Timetable
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {generatedPlan.strategyTitle}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {generatedPlan.executiveSummary}
                  </p>
                </div>

                {/* Daily Schedule Slots */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Optimal Daily Routine:
                  </h4>
                  <div className="space-y-2">
                    {generatedPlan.dailySchedule.map((slot, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-bold text-[11px] whitespace-nowrap">
                            {slot.timeSlot}
                          </span>
                          <span className="text-slate-200 font-medium">{slot.activity}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 italic">
                          💡 {slot.productivityTip}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Golden Advice & Weak Area Remedies */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Targeted Remedies for Weak Spots:
                  </h4>
                  <div className="space-y-1.5">
                    {generatedPlan.weakAreaRemedies.map((rem, idx) => (
                      <div key={idx} className="text-xs text-slate-300">
                        <strong className="text-rose-400">{rem.area}:</strong> {rem.specificAction}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-xs font-semibold text-slate-300 block mb-1">
                      Mentor's Golden Rules:
                    </span>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                      {generatedPlan.goldenAdvice.map((adv, idx) => (
                        <li key={idx}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
                <Calendar className="w-10 h-10 text-slate-600 mb-3" />
                <h4 className="font-bold text-slate-300 text-sm">No Timetable Generated Yet</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Adjust your parameters on the left and click "Generate Bespoke UPSC Strategy" to get a realistic, hour-by-hour schedule.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MENTOR CHAT */}
      {activeSubTab === 'chat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[600px]">
          {/* Quick Consultation Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none mb-3">
            {[
              'How to eliminate extreme trap options in Prelims?',
              'Give me a 5-step framework for GS4 Ethics Case Studies',
              'How to balance Current Affairs with static revisions?',
              'What should my daily answer writing schedule look like?',
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 whitespace-nowrap transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 py-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0 text-slate-950 font-bold mt-0.5">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium'
                      : 'bg-slate-950 text-slate-200 border border-slate-800/80 font-sans'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3 text-xs justify-start">
                <div className="w-7 h-7 rounded-lg bg-amber-500/50 flex items-center justify-center flex-shrink-0 text-slate-950">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-950 text-slate-400 p-3 rounded-2xl border border-slate-800">
                  AI Mentor is formulating guidance...
                </div>
              </div>
            )}
          </div>

          {/* Chat input bar */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything on UPSC strategy, syllabus concepts, or revision doubts..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-600"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={chatLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PRELIMS MCQ ELIMINATION DRILL */}
      {activeSubTab === 'mcq_drill' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-white text-sm">
                  UPSC Prelims MCQ Elimination Simulator
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generate authentic UPSC phrasing MCQs and master 50-50 elimination tactics.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={drillTopic}
                  onChange={(e) => setDrillTopic(e.target.value)}
                  placeholder="Topic e.g. Money Bill, Wetlands, Indus Valley"
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 w-52"
                />
                <button
                  onClick={handleGenerateDrill}
                  disabled={drillLoading}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-60 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{drillLoading ? 'Generating...' : 'Start Drill'}</span>
                </button>
              </div>
            </div>

            {/* Questions display */}
            {drillQuestions.length > 0 ? (
              <div className="space-y-5">
                {drillQuestions.map((q, qIdx) => {
                  const userAnswer = selectedAnswers[q.id || String(qIdx)];
                  const isAnswered = Boolean(userAnswer);
                  const isCorrect = userAnswer === q.correctOption;
                  const showExplanation = showDrillExplanations[q.id || String(qIdx)];

                  return (
                    <div
                      key={q.id || qIdx}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          Question {qIdx + 1}
                        </span>
                        {q.pyqReferenceTrend && (
                          <span className="text-[10px] text-slate-500 italic">
                            PYQ Trend: {q.pyqReferenceTrend}
                          </span>
                        )}
                      </div>

                      {q.context && (
                        <p className="text-xs text-slate-300 font-serif-scholarly leading-relaxed">
                          {q.context}
                        </p>
                      )}

                      {/* Statements list */}
                      {q.statements && q.statements.length > 0 && (
                        <div className="space-y-1.5 text-xs text-slate-200 font-serif-scholarly">
                          <p className="text-slate-400 not-italic">Consider the following statements:</p>
                          {q.statements.map((stmt, sIdx) => (
                            <div key={sIdx} className="pl-3">
                              {sIdx + 1}. {stmt}
                            </div>
                          ))}
                          <p className="text-slate-400 not-italic pt-1">
                            Which of the statements given above is/are correct?
                          </p>
                        </div>
                      )}

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt) => {
                          const isOptionSelected = userAnswer === opt.label;
                          let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

                          if (isAnswered) {
                            if (opt.label === q.correctOption) {
                              btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold';
                            } else if (isOptionSelected) {
                              btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-300';
                            }
                          }

                          return (
                            <button
                              key={opt.label}
                              disabled={isAnswered}
                              onClick={() => {
                                setSelectedAnswers((prev) => ({ ...prev, [q.id || String(qIdx)]: opt.label }));
                                setShowDrillExplanations((prev) => ({ ...prev, [q.id || String(qIdx)]: true }));
                                if (opt.label === q.correctOption) {
                                  try {
                                    confetti({ particleCount: 30, spread: 45 });
                                  } catch (e) {}
                                }
                              }}
                              className={`p-2.5 rounded-lg border text-xs text-left transition-all flex items-center gap-2 ${btnStyle}`}
                            >
                              <span className="font-mono font-bold w-4">{opt.label}.</span>
                              <span>{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation & Elimination logic */}
                      {showExplanation && (
                        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs space-y-2 mt-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isCorrect ? '✓ Correct Answer: ' : '✗ Incorrect. Correct: '} Option {q.correctOption}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">
                            {q.detailedExplanation}
                          </p>
                          <div className="p-2 bg-amber-950/30 border border-amber-800/40 rounded text-amber-200/90 text-[11px]">
                            <strong>🧠 Elimination Technique:</strong> {q.eliminationTechnique}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">
                Pick a topic above and hit "Start Drill" to practice high-yield elimination MCQs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CURRENT AFFAIRS TO SYLLABUS MAPPER */}
      {activeSubTab === 'ca_mapper' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-cyan-400" />
              Map Daily News to UPSC Syllabus
            </h3>
            <p className="text-xs text-slate-400">
              Never read the newspaper aimlessly. Learn exactly where editorials and govt policies plug into GS Papers.
            </p>

            <form onSubmit={handleMapCurrentAffairs} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">News Headline / Topic</label>
                <input
                  type="text"
                  required
                  value={caHeadline}
                  onChange={(e) => setCaHeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Key Context / Editorial Excerpt</label>
                <textarea
                  rows={4}
                  value={caDetails}
                  onChange={(e) => setCaDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={caLoading}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{caLoading ? 'Mapping to GS Papers...' : 'Deconstruct for UPSC CSE'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7">
            {caLoading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
                <h4 className="font-bold text-white text-sm">Mapping Article to UPSC Syllabus...</h4>
              </div>
            ) : caMappingResult ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  Syllabus Mapping:
                </h4>
                <div className="space-y-2">
                  {caMappingResult.paperMapping?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <span className="font-mono text-cyan-300 font-bold mr-2">[{item.paper}]</span>
                      <span className="text-slate-200 font-medium">{item.syllabusMicroTopic}</span>
                      <p className="text-slate-400 text-[11px] mt-1">{item.relevance}</p>
                    </div>
                  ))}
                </div>

                {/* Prelims Takeaways */}
                {caMappingResult.prelimsTakeaways && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-amber-400 font-semibold block mb-1">
                      📌 High-Yield Prelims Takeaways:
                    </span>
                    <ul className="text-slate-300 space-y-1 list-disc list-inside">
                      {caMappingResult.prelimsTakeaways.map((pt: string, idx: number) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Potential Mains Question */}
                {caMappingResult.mainsPotentialQuestion && (
                  <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl text-xs">
                    <span className="text-amber-400 font-semibold block mb-1">
                      ✍️ Probable Mains Question:
                    </span>
                    <p className="text-slate-200 font-serif-scholarly leading-relaxed italic">
                      “{caMappingResult.mainsPotentialQuestion}”
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                <Newspaper className="w-10 h-10 text-slate-600 mb-3" />
                <h4 className="font-bold text-slate-300 text-sm">Ready to Map News</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Enter an editorial topic on the left to see its exact UPSC GS Paper classification and Mains question hook.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
