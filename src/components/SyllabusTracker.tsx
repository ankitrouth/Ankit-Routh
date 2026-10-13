import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  CheckCircle, 
  RotateCw, 
  Sparkles, 
  Plus, 
  ChevronRight, 
  Check, 
  FileText,
  AlertCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SyllabusItem, PaperCategory, RevisionStatus, FlashcardItem } from '../types';
import { Flashcards } from './Flashcards';

interface SyllabusTrackerProps {
  syllabus: SyllabusItem[];
  setSyllabus: React.Dispatch<React.SetStateAction<SyllabusItem[]>>;
  onUpdateStatus: (id: string, status: RevisionStatus) => void;
  flashcards: FlashcardItem[];
  setFlashcards: React.Dispatch<React.SetStateAction<FlashcardItem[]>>;
}

export const SyllabusTracker: React.FC<SyllabusTrackerProps> = ({
  syllabus,
  setSyllabus,
  onUpdateStatus,
  flashcards,
  setFlashcards,
}) => {
  // Sub-navigation view: 'syllabus' (radar) or 'flashcards'
  const [activeView, setActiveView] = useState<'syllabus' | 'flashcards'>('syllabus');
  const [flashcardTopicFilter, setFlashcardTopicFilter] = useState<string | null>(null);

  // Filters for Syllabus
  const [selectedPaper, setSelectedPaper] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeBreakdownTopic, setActiveBreakdownTopic] = useState<SyllabusItem | null>(null);
  const [aiBreakdownLoading, setAiBreakdownLoading] = useState(false);
  const [aiBreakdownData, setAiBreakdownData] = useState<any>(null);
  const [isGeneratingCardsFromModal, setIsGeneratingCardsFromModal] = useState(false);

  // New item form state
  const [newItemPaper, setNewItemPaper] = useState<PaperCategory>('Prelims');
  const [newItemSubject, setNewItemSubject] = useState('');
  const [newItemTopic, setNewItemTopic] = useState('');
  const [newItemSubtopics, setNewItemSubtopics] = useState('');

  const papers = ['All', 'Prelims', 'GS1', 'GS2', 'GS3', 'GS4', 'CSAT'];

  // Filter items
  const filteredItems = syllabus.filter((item) => {
    const matchesPaper = selectedPaper === 'All' || item.paper === selectedPaper;
    const matchesSearch =
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesPaper && matchesSearch && matchesStatus;
  });

  // Calculate stats for current paper
  const currentPaperItems = selectedPaper === 'All' ? syllabus : syllabus.filter((s) => s.paper === selectedPaper);
  const mastered = currentPaperItems.filter((s) => s.status === 'mastered_3').length;
  const revised = currentPaperItems.filter((s) => s.status === 'revised_2').length;
  const reading = currentPaperItems.filter((s) => s.status === 'reading_1').length;
  const notStarted = currentPaperItems.filter((s) => s.status === 'not_started').length;
  const completionScore = currentPaperItems.length > 0
    ? Math.round(((mastered * 1 + revised * 0.7 + reading * 0.4) / currentPaperItems.length) * 100)
    : 0;

  const handleStatusChange = (id: string, status: RevisionStatus) => {
    onUpdateStatus(id, status);
    if (status === 'mastered_3') {
      try {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
      } catch (e) {}
    }
  };

  const handleFetchAiBreakdown = async (item: SyllabusItem) => {
    setActiveBreakdownTopic(item);
    setAiBreakdownLoading(true);
    setAiBreakdownData(null);

    try {
      const response = await fetch('/api/ai/mentor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Give me a high-yield UPSC CSE revision breakdown for:
Topic: "${item.topic}" in Subject: "${item.subject}" (${item.paper}).
Provide:
1. 3 Most Probable Mains Question Angles
2. 3 High-Yield Prelims Facts / Constitutional Articles / Data points
3. Top PYQ Trend (how UPSC has tested this in recent 5 years)
4. Recommended Mnemonics or Flowchart hook`,
            },
          ],
        }),
      });

      const resJson = await response.json();
      if (resJson.success) {
        setAiBreakdownData(resJson.reply);
      } else {
        setAiBreakdownData('Failed to generate breakdown. Please try again.');
      }
    } catch (err: any) {
      setAiBreakdownData('Network error contacting AI server.');
    } finally {
      setAiBreakdownLoading(false);
    }
  };

  // Generate flashcards straight from the breakdown modal
  const handleGenerateCardsFromBreakdown = async (item: SyllabusItem) => {
    setIsGeneratingCardsFromModal(true);
    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: item.topic,
          subject: item.subject,
          paper: item.paper,
          count: 4,
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data?.flashcards) {
        const newCards: FlashcardItem[] = resJson.data.flashcards.map((c: any, i: number) => ({
          id: `fc-syl-${Date.now()}-${i}`,
          paper: item.paper,
          subject: item.subject,
          topic: item.topic,
          front: c.front,
          back: c.back,
          masteryLevel: 'learning',
          highYield: true,
          lastReviewed: new Date().toISOString().split('T')[0],
        }));

        setFlashcards((prev) => [...newCards, ...prev]);
        setActiveBreakdownTopic(null);
        setFlashcardTopicFilter(item.topic);
        setActiveView('flashcards');

        try {
          confetti({ particleCount: 45, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to generate flashcards from syllabus item:', err);
    } finally {
      setIsGeneratingCardsFromModal(false);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemSubject.trim() || !newItemTopic.trim()) return;

    const newItem: SyllabusItem = {
      id: `custom-syl-${Date.now()}`,
      paper: newItemPaper,
      subject: newItemSubject.trim(),
      topic: newItemTopic.trim(),
      subtopics: newItemSubtopics
        ? newItemSubtopics.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      status: 'not_started',
      highYield: true,
    };

    setSyllabus((prev) => [newItem, ...prev]);
    setNewItemSubject('');
    setNewItemTopic('');
    setNewItemSubtopics('');
    setShowAddModal(false);
  };

  // Helper to count flashcards for a syllabus item
  const getTopicCardsCount = (item: SyllabusItem) => {
    return flashcards.filter(
      (c) =>
        c.topic.toLowerCase() === item.topic.toLowerCase() ||
        c.front.toLowerCase().includes(item.topic.toLowerCase())
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Flow Navigation: Syllabus Radar vs Active Flashcards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white font-serif-scholarly">
              UPSC Syllabus &amp; Quick Revision Suite
            </h1>
            <p className="text-[11px] text-slate-400">
              Track 3-tier revision radar and test active recall using high-yield flashcards.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-stretch sm:self-auto">
          <button
            onClick={() => setActiveView('syllabus')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${
              activeView === 'syllabus'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Syllabus Radar ({syllabus.length})</span>
          </button>

          <button
            onClick={() => {
              setFlashcardTopicFilter(null);
              setActiveView('flashcards');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg font-medium transition-all cursor-pointer ${
              activeView === 'flashcards'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Revision Flashcards ({flashcards.length})</span>
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: SYLLABUS RADAR ================= */}
      {activeView === 'syllabus' && (
        <div className="space-y-6">
          {/* Overview Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
                    UPSC CSE Micro-Syllabus
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">3-Tier Revision Radar</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-scholarly">
                  Syllabus Mastery Tracker
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  UPSC requires at least 3 systematic revisions for high retention. Move topics from 1st reading to 3x Mastered.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Syllabus Topic</span>
                </button>
              </div>
            </div>

            {/* Progress Bar & Badges */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-200">
                  {selectedPaper} Progress: <span className="text-cyan-400 font-mono">{completionScore}%</span>
                </span>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {mastered} Mastered (3x)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {revised} Revised (2x)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {reading} 1st Read
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: currentPaperItems.length > 0 ? `${(mastered / currentPaperItems.length) * 100}%` : '0%',
                  }}
                  title="3x Mastered"
                />
                <div
                  className="bg-cyan-500 h-full transition-all duration-500"
                  style={{
                    width: currentPaperItems.length > 0 ? `${(revised / currentPaperItems.length) * 100}%` : '0%',
                  }}
                  title="2x Revised"
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{
                    width: currentPaperItems.length > 0 ? `${(reading / currentPaperItems.length) * 100}%` : '0%',
                  }}
                  title="1st Reading"
                />
              </div>
            </div>

            {/* Paper Tabs */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
              {papers.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPaper(p)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedPaper === p
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topics, subjects, micro-topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter syllabus topics by revision stage"
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="All">All Stages</option>
                <option value="not_started">Pending</option>
                <option value="reading_1">1st Reading</option>
                <option value="revised_2">2nd Revision</option>
                <option value="mastered_3">3x Mastered</option>
              </select>
            </div>
          </div>

          {/* Syllabus Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                No syllabus topics found matching your filters.
              </div>
            ) : (
              filteredItems.map((item) => {
                const cardCount = getTopicCardsCount(item);
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all"
                  >
                    <div>
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-cyan-950/60 border border-cyan-800/50 text-cyan-300 uppercase">
                            {item.paper} • {item.subject}
                          </span>
                          {item.highYield && (
                            <span className="ml-2 text-[10px] text-amber-400 font-semibold">
                              ★ High Yield
                            </span>
                          )}
                        </div>

                        {/* Top Action Buttons: Flashcard quick practice & AI breakdown */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Dedicated Flashcards Button for this Topic */}
                          <button
                            onClick={() => {
                              setFlashcardTopicFilter(item.topic);
                              setActiveView('flashcards');
                            }}
                            className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                            title={
                              cardCount > 0
                                ? `Practice ${cardCount} flashcards for this topic`
                                : `Generate flashcards for ${item.topic}`
                            }
                          >
                            <Layers className="w-3 h-3 text-amber-400" />
                            <span>{cardCount > 0 ? `${cardCount} Cards` : '+ Cards'}</span>
                          </button>

                          {/* AI Breakdown Button */}
                          <button
                            onClick={() => handleFetchAiBreakdown(item)}
                            className="flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                            title="Get AI PYQs and high-yield notes"
                          >
                            <Sparkles className="w-3 h-3 fill-cyan-400/20" />
                            <span>Breakdown</span>
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-100 mb-1.5 leading-snug">
                        {item.topic}
                      </h3>

                      {/* Subtopic chips */}
                      {item.subtopics && item.subtopics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {item.subtopics.map((sub, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-400"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Aspirant notes if any */}
                      {item.notes && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 mb-3">
                          📝 {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Status Selector Bar */}
                    <div className="pt-2 border-t border-slate-800/60">
                      <div className="text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">
                        Revision Stage:
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        <button
                          onClick={() => handleStatusChange(item.id, 'not_started')}
                          className={`text-[10px] py-1 rounded font-medium transition-all cursor-pointer ${
                            item.status === 'not_started'
                              ? 'bg-slate-700 text-white font-bold ring-1 ring-slate-500'
                              : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-slate-800'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, 'reading_1')}
                          className={`text-[10px] py-1 rounded font-medium transition-all cursor-pointer ${
                            item.status === 'reading_1'
                              ? 'bg-amber-500 text-slate-950 font-bold ring-1 ring-amber-300'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          1x Read
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, 'revised_2')}
                          className={`text-[10px] py-1 rounded font-medium transition-all cursor-pointer ${
                            item.status === 'revised_2'
                              ? 'bg-cyan-500 text-slate-950 font-bold ring-1 ring-cyan-300'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          2x Revised
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, 'mastered_3')}
                          className={`text-[10px] py-1 rounded font-medium transition-all cursor-pointer ${
                            item.status === 'mastered_3'
                              ? 'bg-emerald-500 text-slate-950 font-bold ring-1 ring-emerald-300 shadow-sm'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          3x Mastered
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: FLASHCARDS SUITE ================= */}
      {activeView === 'flashcards' && (
        <Flashcards
          flashcards={flashcards}
          setFlashcards={setFlashcards}
          syllabus={syllabus}
          initialTopicFilter={flashcardTopicFilter}
          onClearTopicFilter={() => setFlashcardTopicFilter(null)}
          onNavigateToSyllabus={() => setActiveView('syllabus')}
        />
      )}

      {/* AI Breakdown Modal */}
      {activeBreakdownTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  AI High-Yield Exam Breakdown
                </h3>
              </div>
              <button
                onClick={() => setActiveBreakdownTopic(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-2 border-b border-slate-800/60">
              <div className="text-amber-300/90 font-mono">
                TOPIC: {activeBreakdownTopic.topic} ({activeBreakdownTopic.subject})
              </div>

              {/* 1-Click Flashcard Creator Button */}
              <button
                onClick={() => handleGenerateCardsFromBreakdown(activeBreakdownTopic)}
                disabled={isGeneratingCardsFromModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingCardsFromModal ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Generating Cards...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5" />
                    <span>⚡ Create Flashcards for this Topic</span>
                  </>
                )}
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 py-3 text-xs text-slate-200 leading-relaxed space-y-3">
              {aiBreakdownLoading ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing UPSC PYQs, standard books &amp; high-yield hooks...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans">
                  {aiBreakdownData}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Syllabus Topic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Add Custom Syllabus Topic
            </h3>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Paper</label>
                <select
                  value={newItemPaper}
                  onChange={(e) => setNewItemPaper(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Prelims">Prelims GS-1</option>
                  <option value="GS1">Mains GS-1</option>
                  <option value="GS2">Mains GS-2</option>
                  <option value="GS3">Mains GS-3</option>
                  <option value="GS4">Mains GS-4 Ethics</option>
                  <option value="CSAT">CSAT Paper 2</option>
                  <option value="Optional">Optional Subject</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newItemSubject}
                  onChange={(e) => setNewItemSubject(e.target.value)}
                  placeholder="e.g. Indian Economy or Ethics Case Studies"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Topic Name</label>
                <input
                  type="text"
                  required
                  value={newItemTopic}
                  onChange={(e) => setNewItemTopic(e.target.value)}
                  placeholder="e.g. Monetary Policy Committee &amp; Repo Rate"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Subtopics (Comma separated)</label>
                <input
                  type="text"
                  value={newItemSubtopics}
                  onChange={(e) => setNewItemSubtopics(e.target.value)}
                  placeholder="e.g. Inflation targeting, SDF, Liquidity deficit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
