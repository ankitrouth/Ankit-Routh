import React, { useState, useEffect } from 'react';
import { 
  FlashcardItem, 
  PaperCategory, 
  SyllabusItem 
} from '../types';
import { 
  Sparkles, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Search, 
  Shuffle, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Award, 
  Layers, 
  Star, 
  X, 
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FlashcardsProps {
  flashcards: FlashcardItem[];
  setFlashcards: React.Dispatch<React.SetStateAction<FlashcardItem[]>>;
  syllabus?: SyllabusItem[];
  initialTopicFilter?: string | null;
  onClearTopicFilter?: () => void;
  onNavigateToSyllabus?: () => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({
  flashcards,
  setFlashcards,
  syllabus = [],
  initialTopicFilter = null,
  onClearTopicFilter,
  onNavigateToSyllabus,
}) => {
  // Mode: 'practice' | 'manage'
  const [viewMode, setViewMode] = useState<'practice' | 'manage'>('practice');

  // Filters
  const [selectedPaper, setSelectedPaper] = useState<string>('All');
  const [masteryFilter, setMasteryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopicFilter, setActiveTopicFilter] = useState<string | null>(initialTopicFilter);
  const [onlyHighYield, setOnlyHighYield] = useState(false);

  // Sync external topic filter
  useEffect(() => {
    if (initialTopicFilter) {
      setActiveTopicFilter(initialTopicFilter);
    }
  }, [initialTopicFilter]);

  // Practice session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    mastered: 0,
    review: 0,
    learning: 0,
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardItem | null>(null);

  // New Card Form
  const [formPaper, setFormPaper] = useState<PaperCategory>('Prelims');
  const [formSubject, setFormSubject] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formFront, setFormFront] = useState('');
  const [formBack, setFormBack] = useState('');
  const [formHighYield, setFormHighYield] = useState(true);

  // AI Generator Form
  const [aiTopic, setAiTopic] = useState(initialTopicFilter || '');
  const [aiSubject, setAiSubject] = useState('');
  const [aiPaper, setAiPaper] = useState<PaperCategory>('Prelims');
  const [aiCount, setAiCount] = useState(4);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedCards, setAiGeneratedCards] = useState<Array<{
    front: string;
    back: string;
    highYield: boolean;
  }>>([]);

  const papers: Array<string> = ['All', 'Prelims', 'GS1', 'GS2', 'GS3', 'GS4', 'CSAT', 'Optional'];

  // Filter cards
  const filteredCards = flashcards.filter((card) => {
    const matchPaper = selectedPaper === 'All' || card.paper === selectedPaper;
    const matchMastery = masteryFilter === 'All' || card.masteryLevel === masteryFilter;
    const matchHighYield = !onlyHighYield || card.highYield;
    const matchTopicFilter = !activeTopicFilter || card.topic.toLowerCase() === activeTopicFilter.toLowerCase();
    const matchSearch =
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.subject.toLowerCase().includes(searchQuery.toLowerCase());

    return matchPaper && matchMastery && matchHighYield && matchTopicFilter && matchSearch;
  });

  // Reset practice index when filtered deck changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  }, [selectedPaper, masteryFilter, activeTopicFilter, onlyHighYield]);

  // Keyboard navigation for active recall practice
  useEffect(() => {
    if (viewMode !== 'practice' || filteredCards.length === 0 || sessionCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (isFlipped) {
        if (e.key === '1') handleRateCard('learning');
        if (e.key === '2') handleRateCard('review');
        if (e.key === '3') handleRateCard('mastered');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, filteredCards.length, isFlipped, currentIndex, sessionCompleted]);

  // Card Rating
  const handleRateCard = (level: 'learning' | 'review' | 'mastered') => {
    if (filteredCards.length === 0) return;
    const currentCard = filteredCards[currentIndex];

    // Update in flashcards state
    setFlashcards((prev) =>
      prev.map((c) =>
        c.id === currentCard.id
          ? {
              ...c,
              masteryLevel: level,
              lastReviewed: new Date().toISOString().split('T')[0],
            }
          : c
      )
    );

    // Update session stats
    setSessionStats((prev) => ({
      ...prev,
      [level]: prev[level] + 1,
    }));

    // Trigger celebration on mastered
    if (level === 'mastered') {
      try {
        confetti({ particleCount: 20, spread: 45, origin: { y: 0.7 } });
      } catch (e) {}
    }

    // Advance to next card or finish
    if (currentIndex < filteredCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      try {
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredCards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  const handleRestartPractice = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setSessionStats({ mastered: 0, review: 0, learning: 0 });
  };

  // Create Card
  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFront.trim() || !formBack.trim() || !formTopic.trim()) return;

    if (editingCard) {
      setFlashcards((prev) =>
        prev.map((c) =>
          c.id === editingCard.id
            ? {
                ...c,
                paper: formPaper,
                subject: formSubject.trim() || 'General Studies',
                topic: formTopic.trim(),
                front: formFront.trim(),
                back: formBack.trim(),
                highYield: formHighYield,
              }
            : c
        )
      );
      setEditingCard(null);
    } else {
      const newCard: FlashcardItem = {
        id: `fc-user-${Date.now()}`,
        paper: formPaper,
        subject: formSubject.trim() || 'General Studies',
        topic: formTopic.trim(),
        front: formFront.trim(),
        back: formBack.trim(),
        masteryLevel: 'learning',
        highYield: formHighYield,
        lastReviewed: new Date().toISOString().split('T')[0],
      };
      setFlashcards((prev) => [newCard, ...prev]);
    }

    setFormFront('');
    setFormBack('');
    setFormTopic('');
    setFormSubject('');
    setShowCreateModal(false);
  };

  const handleDeleteCard = (id: string) => {
    setFlashcards((prev) => prev.filter((c) => c.id !== id));
    if (currentIndex >= filteredCards.length - 1 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const openEditModal = (card: FlashcardItem) => {
    setEditingCard(card);
    setFormPaper(card.paper);
    setFormSubject(card.subject);
    setFormTopic(card.topic);
    setFormFront(card.front);
    setFormBack(card.back);
    setFormHighYield(card.highYield);
    setShowCreateModal(true);
  };

  // AI Flashcard Generation
  const handleGenerateAiCards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiGeneratedCards([]);

    try {
      const response = await fetch('/api/ai/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          subject: aiSubject.trim() || 'UPSC Syllabus',
          paper: aiPaper,
          count: aiCount,
        }),
      });

      const resJson = await response.json();
      if (resJson.success && resJson.data?.flashcards) {
        setAiGeneratedCards(resJson.data.flashcards);
      } else {
        setAiError(resJson.error || 'Failed to generate flashcards. Please try again.');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Network error communicating with AI server.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiCards = () => {
    if (aiGeneratedCards.length === 0) return;

    const newItems: FlashcardItem[] = aiGeneratedCards.map((c, i) => ({
      id: `fc-ai-${Date.now()}-${i}`,
      paper: aiPaper,
      subject: aiSubject.trim() || 'UPSC High Yield',
      topic: aiTopic.trim(),
      front: c.front,
      back: c.back,
      masteryLevel: 'learning',
      highYield: c.highYield ?? true,
      lastReviewed: new Date().toISOString().split('T')[0],
    }));

    setFlashcards((prev) => [...newItems, ...prev]);
    setAiGeneratedCards([]);
    setShowAiModal(false);

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
  };

  // Overall Stats
  const totalCards = flashcards.length;
  const masteredCount = flashcards.filter((c) => c.masteryLevel === 'mastered').length;
  const reviewCount = flashcards.filter((c) => c.masteryLevel === 'review').length;
  const learningCount = flashcards.filter((c) => c.masteryLevel === 'learning').length;
  const overallMasteryPct = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  const currentCard = filteredCards[currentIndex];

  return (
    <div className="space-y-5">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Active Recall &amp; Spaced Repetition
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">Quick UPSC Revision</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif-scholarly flex items-center gap-2">
              <span>High-Yield Revision Flashcards</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {totalCards} Cards
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Test your recall on Articles, Cases, Committees, Economic Concepts &amp; PYQ Hooks in rapid 30-second cycles.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setAiTopic(activeTopicFilter || '');
                setShowAiModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
              <span>AI Generate Cards</span>
            </button>

            <button
              onClick={() => {
                setEditingCard(null);
                setFormTopic(activeTopicFilter || '');
                setFormSubject('');
                setFormFront('');
                setFormBack('');
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Flashcard</span>
            </button>

            {/* Mode Toggle */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('practice')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'practice'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Play className="w-3 h-3" />
                <span>Practice</span>
              </button>
              <button
                onClick={() => setViewMode('manage')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'manage'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Browse Deck</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Pill (if coming from Syllabus) */}
        {activeTopicFilter && (
          <div className="mb-3 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between text-xs text-cyan-200">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                Filtered by Syllabus Topic: <strong className="text-white">{activeTopicFilter}</strong>
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTopicFilter(null);
                if (onClearTopicFilter) onClearTopicFilter();
              }}
              className="text-xs text-cyan-400 hover:text-cyan-200 underline cursor-pointer ml-3"
            >
              Show All Topics
            </button>
          </div>
        )}

        {/* Master Progress Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4">
          <div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Mastery Level</span>
              <span className="font-mono text-emerald-400 font-bold">{overallMasteryPct}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallMasteryPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white font-mono">{masteredCount}</div>
              <div className="text-[10px] text-slate-400">Mastered (Confident)</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white font-mono">{reviewCount}</div>
              <div className="text-[10px] text-slate-400">Needs Review</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white font-mono">{learningCount}</div>
              <div className="text-[10px] text-slate-400">Still Learning</div>
            </div>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
          {/* Paper filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {papers.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPaper(p)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedPaper === p
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Quick toggle filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setOnlyHighYield((prev) => !prev)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 border transition-all cursor-pointer ${
                onlyHighYield
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Star className="w-3 h-3 text-amber-400 fill-amber-400/30" />
              <span>High Yield Only</span>
            </button>

            <select
              value={masteryFilter}
              onChange={(e) => setMasteryFilter(e.target.value)}
              aria-label="Filter flashcards by mastery status"
              className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded-lg px-2 py-1 outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">All Mastery Levels</option>
              <option value="learning">Still Learning (🔴)</option>
              <option value="review">Needs Review (🟡)</option>
              <option value="mastered">Mastered (🟢)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= PRACTICE MODE ================= */}
      {viewMode === 'practice' && (
        <div className="max-w-3xl mx-auto space-y-4">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Flashcards In This Filter</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                No cards match your selected paper or topic filter. Create a new card or ask AI to generate high-yield cards for this topic!
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSelectedPaper('All');
                    setMasteryFilter('All');
                    setOnlyHighYield(false);
                    setActiveTopicFilter(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => {
                    setAiTopic(activeTopicFilter || 'Indian Polity');
                    setShowAiModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 cursor-pointer"
                >
                  Generate with AI
                </button>
              </div>
            </div>
          ) : sessionCompleted ? (
            /* Session Completed Screen */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white font-serif-scholarly">
                Session Complete! Revision Goal Achieved
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Consistent active recall builds long-term neural pathways for Prelims elimination and Mains rapid value addition.
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto my-4 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-lg font-bold text-emerald-400 font-mono">{sessionStats.mastered}</div>
                  <div className="text-[10px] text-slate-400">Mastered</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-lg font-bold text-amber-400 font-mono">{sessionStats.review}</div>
                  <div className="text-[10px] text-slate-400">Needs Review</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-lg font-bold text-rose-400 font-mono">{sessionStats.learning}</div>
                  <div className="text-[10px] text-slate-400">Still Learning</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleRestartPractice}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all cursor-pointer shadow-md"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Practice Deck Again</span>
                </button>
                <button
                  onClick={() => setViewMode('manage')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Manage Flashcards</span>
                </button>
                {onNavigateToSyllabus && (
                  <button
                    onClick={onNavigateToSyllabus}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/60 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Back to Syllabus Radar</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Active Card Viewer */
            <div className="space-y-4">
              {/* Card Meta & Controls Bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white font-bold">
                    Card {currentIndex + 1} of {filteredCards.length}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono font-semibold">
                    {currentCard.paper}
                  </span>
                  {currentCard.highYield && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      High Yield
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShuffle}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] cursor-pointer"
                    title="Shuffle Deck"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span className="hidden sm:inline">Shuffle</span>
                  </button>
                  <button
                    onClick={() => openEditModal(currentCard)}
                    className="text-slate-400 hover:text-white text-[11px] cursor-pointer px-2 py-1 rounded bg-slate-900 border border-slate-800"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Progress Tracker Bar */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/50">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / filteredCards.length) * 100}%` }}
                />
              </div>

              {/* Interactive 3D Flip Card Container */}
              <div
                onClick={() => setIsFlipped((prev) => !prev)}
                className="relative min-h-[320px] sm:min-h-[360px] bg-slate-900 hover:border-amber-500/40 border border-slate-800 rounded-3xl p-6 sm:p-8 cursor-pointer shadow-xl transition-all duration-200 select-none flex flex-col justify-between group"
              >
                {/* Top Corner Badges */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      {currentCard.subject}
                    </span>
                    <h4 className="text-xs font-mono text-amber-300/90 font-medium">
                      {currentCard.topic}
                    </h4>
                  </div>

                  {/* Flip Prompt Badge */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-amber-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 transition-colors">
                    <RotateCw className="w-3 h-3 transition-transform group-hover:rotate-180 duration-500" />
                    <span>{isFlipped ? 'Show Question' : 'Tap to Flip'}</span>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="py-6 flex-1 flex flex-col justify-center">
                  {!isFlipped ? (
                    /* Front: Prompt / Question */
                    <div className="space-y-3">
                      <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400/80 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Active Recall Challenge</span>
                      </div>
                      <p className="text-base sm:text-lg lg:text-xl font-bold text-white leading-relaxed font-serif-scholarly">
                        {currentCard.front}
                      </p>
                    </div>
                  ) : (
                    /* Back: Answer Notes / Framework / Articles */
                    <div className="space-y-3">
                      <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>High-Yield Answer &amp; Examiner Notes</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                        {currentCard.back}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span>Status:</span>
                    <span
                      className={`font-semibold capitalize ${
                        currentCard.masteryLevel === 'mastered'
                          ? 'text-emerald-400'
                          : currentCard.masteryLevel === 'review'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {currentCard.masteryLevel === 'mastered'
                        ? '🟢 Mastered'
                        : currentCard.masteryLevel === 'review'
                        ? '🟡 Needs Review'
                        : '🔴 Learning'}
                    </span>
                  </div>

                  <span className="hidden sm:inline text-slate-600">
                    Keyboard: Space to flip • 1, 2, 3 to rate • ← → arrows
                  </span>
                </div>
              </div>

              {/* Active Recall Rating Buttons (Shown on Back or Always for Quick Touch Rating) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4">
                <div className="text-xs text-center text-slate-400 mb-2 font-medium">
                  Rate your recall confidence for this flashcard:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleRateCard('learning')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 transition-all cursor-pointer active:scale-95"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mb-1" />
                    <span className="text-xs font-bold">Still Learning</span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">[1] Repeat soon</span>
                  </button>

                  <button
                    onClick={() => handleRateCard('review')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition-all cursor-pointer active:scale-95"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mb-1" />
                    <span className="text-xs font-bold">Needs Review</span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">[2] Moderate recall</span>
                  </button>

                  <button
                    onClick={() => handleRateCard('mastered')}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer active:scale-95"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mb-1" />
                    <span className="text-xs font-bold">Mastered!</span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline">[3] Solid recall</span>
                  </button>
                </div>

                {/* Card Navigation Arrows */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-xs">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer p-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-slate-500 font-mono text-[11px]">
                    {currentIndex + 1} / {filteredCards.length}
                  </span>

                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer p-1"
                  >
                    <span>{currentIndex === filteredCards.length - 1 ? 'Finish' : 'Next'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MANAGE / BROWSE DECK MODE ================= */}
      {viewMode === 'manage' && (
        <div className="space-y-4">
          {/* Search and stats bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search flashcard question, answer, topic or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Showing <strong className="text-white">{filteredCards.length}</strong> of {flashcards.length} cards
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCards.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-400 text-xs">
              No flashcards found matching your search and filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-950 border border-slate-800 text-cyan-300 uppercase">
                          {card.paper} • {card.subject}
                        </span>
                        {card.highYield && (
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            High Yield
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(card)}
                          className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-950 border border-slate-800 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 cursor-pointer"
                          title="Delete Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-amber-300/80 mb-1 font-semibold">
                      {card.topic}
                    </div>

                    {/* Front Question */}
                    <h4 className="text-xs sm:text-sm font-bold text-white mb-2 leading-snug">
                      Q: {card.front}
                    </h4>

                    {/* Back Preview */}
                    <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-3 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                      {card.back}
                    </div>
                  </div>

                  {/* Status Change Selector */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Mastery:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setFlashcards((prev) =>
                            prev.map((c) =>
                              c.id === card.id ? { ...c, masteryLevel: 'learning' } : c
                            )
                          );
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-medium cursor-pointer transition-all ${
                          card.masteryLevel === 'learning'
                            ? 'bg-rose-500 text-white font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        Learning
                      </button>
                      <button
                        onClick={() => {
                          setFlashcards((prev) =>
                            prev.map((c) =>
                              c.id === card.id ? { ...c, masteryLevel: 'review' } : c
                            )
                          );
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-medium cursor-pointer transition-all ${
                          card.masteryLevel === 'review'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        Review
                      </button>
                      <button
                        onClick={() => {
                          setFlashcards((prev) =>
                            prev.map((c) =>
                              c.id === card.id ? { ...c, masteryLevel: 'mastered' } : c
                            )
                          );
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded font-medium cursor-pointer transition-all ${
                          card.masteryLevel === 'mastered'
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        Mastered
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT FLASHCARD ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base font-serif-scholarly">
                {editingCard ? 'Edit Flashcard' : 'Create Custom UPSC Flashcard'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs p-1 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-3.5 py-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">UPSC Paper</label>
                  <select
                    value={formPaper}
                    onChange={(e) => setFormPaper(e.target.value as PaperCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-amber-500"
                  >
                    <option value="Prelims">Prelims GS-1</option>
                    <option value="GS1">GS-1 (History/Geo/Society)</option>
                    <option value="GS2">GS-2 (Polity/Gov/IR)</option>
                    <option value="GS3">GS-3 (Eco/Env/Sec/Sci)</option>
                    <option value="GS4">GS-4 (Ethics)</option>
                    <option value="CSAT">CSAT Paper-2</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Indian Polity, Economy"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Syllabus Topic / Subtopic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Basic Structure Doctrine or RBI Monetary Policy"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Front: Question / Active Recall Prompt
                </label>
                <textarea
                  rows={2}
                  placeholder="What is the test for constitutional amendments under Article 368?"
                  value={formFront}
                  onChange={(e) => setFormFront(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Back: Answer / Bullet Points / Articles / Cases
                </label>
                <textarea
                  rows={4}
                  placeholder="• Landmark Case: Kesavananda Bharati (1973)&#10;• Minerva Mills (1980) harmony between Part III & Part IV&#10;• Pro Tip: Parliament cannot alter the basic features."
                  value={formBack}
                  onChange={(e) => setFormBack(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-amber-500 font-mono text-[11px]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="highYieldCheckbox"
                  checked={formHighYield}
                  onChange={(e) => setFormHighYield(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="highYieldCheckbox" className="text-slate-300 font-medium cursor-pointer">
                  Mark as High-Yield UPSC topic (★)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
                >
                  {editingCard ? 'Update Flashcard' : 'Save Flashcard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: AI FLASHCARD GENERATOR ================= */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-4 h-4 fill-amber-400/30" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base font-serif-scholarly">
                    AI UPSC Flashcard Generator
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Instantly craft active-recall revision cards grounded in UPSC PYQs &amp; standard books.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAiModal(false);
                  setAiGeneratedCards([]);
                }}
                className="text-slate-400 hover:text-white text-xs p-1 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Form */}
              <form onSubmit={handleGenerateAiCards} className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Topic to Generate Flashcards For:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Monetary Policy Committee, Anti-Defection Law, Montreux Record..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-amber-500"
                    required
                  />
                  {syllabus.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] text-slate-500">Quick syllabus suggestions:</span>
                      {syllabus.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setAiTopic(item.topic);
                            setAiSubject(item.subject);
                            setAiPaper(item.paper);
                          }}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 transition-colors"
                        >
                          {item.topic}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Paper</label>
                    <select
                      value={aiPaper}
                      onChange={(e) => setAiPaper(e.target.value as PaperCategory)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-amber-500"
                    >
                      <option value="Prelims">Prelims</option>
                      <option value="GS1">GS-1</option>
                      <option value="GS2">GS-2</option>
                      <option value="GS3">GS-3</option>
                      <option value="GS4">GS-4</option>
                      <option value="CSAT">CSAT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Polity, Economy"
                      value={aiSubject}
                      onChange={(e) => setAiSubject(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Quantity</label>
                    <select
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200 outline-none focus:border-amber-500"
                    >
                      <option value={3}>3 Cards</option>
                      <option value={4}>4 Cards</option>
                      <option value={5}>5 Cards</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={aiLoading || !aiTopic.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {aiLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing High-Yield Cards with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span>Generate {aiCount} Flashcards</span>
                    </>
                  )}
                </button>
              </form>

              {aiError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Generated Cards Preview */}
              {aiGeneratedCards.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      Generated Cards Preview ({aiGeneratedCards.length})
                    </span>
                    <button
                      onClick={handleSaveAiCards}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Add All to My Deck</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {aiGeneratedCards.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px] text-amber-400 font-semibold">
                          <span>Card #{idx + 1}</span>
                          <span>★ High Yield</span>
                        </div>
                        <div className="font-bold text-white text-xs">Q: {c.front}</div>
                        <div className="text-[11px] text-slate-300 whitespace-pre-line bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                          {c.back}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
