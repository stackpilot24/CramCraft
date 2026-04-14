'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Eye,
  EyeOff,
  Pencil,
  Layers,
  BookOpen,
} from 'lucide-react';
import PDFUploader from '@/components/PDFUploader';
import GenerationProgress from '@/components/GenerationProgress';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import RevisionSheetCard from '@/components/RevisionSheet';
import type { GeneratedCard, GeneratedRevisionSheet, UnifiedGenerateResponse } from '@/lib/types';

type Stage = 'upload' | 'extracting' | 'generating' | 'preview';
type PreviewTab = 'notes' | 'flashcards';

interface GenerateApiResponse extends UnifiedGenerateResponse {
  pages?: number;
}

const CARDS_PER_PAGE = 10;
const SHEETS_PER_PAGE = 1;

export default function UploadPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('upload');
  const [generationStep, setGenerationStep] = useState(0);
  const [filename, setFilename] = useState('');
  const [generated, setGenerated] = useState<GenerateApiResponse | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [sheetPage, setSheetPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [previewTab, setPreviewTab] = useState<PreviewTab>('notes');
  const [cardPage, setCardPage] = useState(1);

  const handleUpload = async (file: File) => {
    setFilename(file.name);
    setError(null);
    setGenerationStep(0);

    // Step 1: Extract text in the browser (handles any file size)
    setStage('extracting');
    let text: string;
    let pageCount: number | undefined;

    try {
      const { extractFileText } = await import('@/lib/client-extractor');
      const result = await extractFileText(file);
      text = result.text;
      pageCount = result.pageCount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read the file.');
      setStage('upload');
      return;
    }

    // Step 2: Send extracted text to API for AI generation
    setStage('generating');
    const stepTimer = setInterval(() => {
      setGenerationStep((s) => Math.min(s + 1, 2));
    }, 2000);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, filename: file.name, pageCount }),
      });

      clearInterval(stepTimer);

      if (!res.ok) {
        let msg = 'Generation failed';
        try {
          const data = await res.json();
          msg = data.error || msg;
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      setGenerationStep(3);
      const data: GenerateApiResponse = await res.json();

      setTimeout(() => {
        setGenerated(data);
        setTitle(data.suggestedTitle);
        setDescription(data.description);
        setStage('preview');
        setCardPage(1);
        setSheetPage(1);
        setPreviewTab(data.revisionSheets?.length ? 'notes' : 'flashcards');
      }, 500);
    } catch (err) {
      clearInterval(stepTimer);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStage('upload');
    }
  };

  const handleSave = async () => {
    if (!generated) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          sourceFilename: filename,
          cards: generated.cards,
          revisionSheets: generated.revisionSheets,
        }),
      });
      if (!res.ok) throw new Error('Failed to save deck');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setIsSaving(false);
    }
  };

  const toggleCard = (i: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const removeCard = (globalIdx: number) => {
    if (!generated) return;
    setGenerated({ ...generated, cards: generated.cards.filter((_, idx) => idx !== globalIdx) });
    const totalPages = Math.ceil((generated.cards.length - 1) / CARDS_PER_PAGE);
    if (cardPage > totalPages && totalPages > 0) setCardPage(totalPages);
  };

  const getCardAnswer = (card: GeneratedCard) => {
    try {
      const parsed = JSON.parse(card.back);
      return parsed.answer ?? card.back;
    } catch {
      return card.back;
    }
  };

  const totalCards = generated?.cards.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCards / CARDS_PER_PAGE));
  const pagedCards = generated?.cards.slice(
    (cardPage - 1) * CARDS_PER_PAGE,
    cardPage * CARDS_PER_PAGE
  ) ?? [];
  const pageStart = (cardPage - 1) * CARDS_PER_PAGE;

  const canSave = !!generated && generated.cards.length > 0 && !!title.trim();

  const SaveButton = ({ compact = false }: { compact?: boolean }) => (
    <Button
      onClick={handleSave}
      loading={isSaving}
      disabled={!canSave}
      size={compact ? 'sm' : 'md'}
      className={compact ? 'gap-1.5' : 'gap-2 flex-1'}
    >
      <Save size={compact ? 14 : 16} />
      {compact
        ? 'Save deck'
        : `Save deck (${totalCards} cards · ${generated?.revisionSheets?.length ?? 0} sheets)`}
    </Button>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-serif text-gray-900 dark:text-gray-100">
            {stage === 'preview' ? 'Review your deck' : 'Create new deck'}
          </h1>
          {stage === 'preview' && generated && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-sans mt-0.5 truncate">
              {generated.revisionSheets?.length ?? 0} sheets · {totalCards} flashcards · {filename}
            </p>
          )}
        </div>

        {stage === 'preview' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="flex-shrink-0"
          >
            <SaveButton compact />
          </motion.div>
        )}
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-sans"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ── Upload ── */}
        {stage === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <PDFUploader onUpload={handleUpload} />
          </motion.div>
        )}

        {/* ── Extracting text (client-side) ── */}
        {stage === 'extracting' && (
          <motion.div
            key="extracting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-card border border-gray-100 dark:border-gray-700 text-center space-y-4"
          >
            <div className="flex justify-center">
              <motion.div
                className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <BookOpen className="h-7 w-7 text-primary" />
              </motion.div>
            </div>
            <div>
              <p className="font-serif text-gray-900 dark:text-gray-100 text-lg">Reading your file…</p>
              <p className="text-sm text-gray-400 font-sans mt-1 truncate max-w-xs mx-auto">{filename}</p>
            </div>
          </motion.div>
        )}

        {/* ── Generating ── */}
        {stage === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-card border border-gray-100 dark:border-gray-700"
          >
            <GenerationProgress step={generationStep} filename={filename} />
          </motion.div>
        )}

        {/* ── Preview ── */}
        {stage === 'preview' && generated && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Deck metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-card border border-gray-100 dark:border-gray-700 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-sans mb-1.5 uppercase tracking-wide">
                  Deck Title
                </label>
                {editingTitle ? (
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setEditingTitle(false)}
                    className="w-full text-xl font-serif bg-transparent border-b-2 border-primary outline-none text-gray-900 dark:text-gray-100 pb-1"
                  />
                ) : (
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="flex items-center gap-2 text-xl font-serif text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary-300 transition-colors group text-left"
                  >
                    <span>{title}</span>
                    <Pencil size={13} className="opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-sans mb-1.5 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full text-sm font-sans bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setPreviewTab('notes')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium font-sans transition-all ${
                  previewTab === 'notes'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <BookOpen size={14} />
                Revision Sheets ({generated.revisionSheets?.length ?? 0})
              </button>
              <button
                onClick={() => { setPreviewTab('flashcards'); setCardPage(1); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium font-sans transition-all ${
                  previewTab === 'flashcards'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Layers size={14} />
                Flashcards ({totalCards})
              </button>
            </div>

            {/* ── Revision Sheets ── */}
            {previewTab === 'notes' && (() => {
              const sheets = generated.revisionSheets ?? [];
              const totalSheets = sheets.length;
              const currentSheet = sheets[sheetPage - 1];
              return (
                <div className="space-y-3">
                  {totalSheets === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <p className="text-gray-400 font-sans text-sm">No revision sheets generated.</p>
                    </div>
                  ) : (
                    <>
                      {totalSheets > 1 && (
                        <div className="flex items-center justify-between gap-3 px-1">
                          <button
                            onClick={() => setSheetPage((p) => Math.max(1, p - 1))}
                            disabled={sheetPage === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-sans text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft size={15} /> Prev
                          </button>
                          <div className="flex items-center gap-1.5">
                            {sheets.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setSheetPage(i + 1)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  sheetPage === i + 1
                                    ? 'bg-primary w-5'
                                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                                }`}
                                aria-label={`Sheet ${i + 1}`}
                              />
                            ))}
                          </div>
                          <button
                            onClick={() => setSheetPage((p) => Math.min(totalSheets, p + 1))}
                            disabled={sheetPage === totalSheets}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-sans text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            Next <ChevronRight size={15} />
                          </button>
                        </div>
                      )}
                      {totalSheets > 1 && (
                        <p className="text-xs text-center text-gray-400 font-sans">
                          Sheet {sheetPage} of {totalSheets}
                        </p>
                      )}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={sheetPage}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.22 }}
                        >
                          {currentSheet && (
                            <RevisionSheetCard sheet={currentSheet} index={sheetPage - 1} />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </>
                  )}
                </div>
              );
            })()}

            {/* ── Flashcards ── */}
            {previewTab === 'flashcards' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                  <h2 className="font-serif text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                    {totalCards} Flashcards
                  </h2>
                  <button
                    onClick={() =>
                      setExpandedCards(
                        expandedCards.size === pagedCards.length
                          ? new Set()
                          : new Set(pagedCards.map((_, i) => pageStart + i))
                      )
                    }
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-sans transition-colors"
                  >
                    {expandedCards.size > 0 ? (
                      <><EyeOff size={13} /> Collapse</>
                    ) : (
                      <><Eye size={13} /> Expand all</>
                    )}
                  </button>
                </div>

                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {pagedCards.map((card, localIdx) => {
                    const globalIdx = pageStart + localIdx;
                    const isExpanded = expandedCards.has(globalIdx);
                    return (
                      <motion.div
                        key={globalIdx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: localIdx * 0.025 }}
                        className="px-4 sm:px-5 py-3"
                      >
                        <button className="w-full text-left" onClick={() => toggleCard(globalIdx)}>
                          <div className="flex items-start gap-3">
                            <span className="text-xs text-gray-300 dark:text-gray-600 font-mono mt-0.5 flex-shrink-0 w-5 text-right">
                              {globalIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="mb-0.5">
                                <Badge variant={card.type as Parameters<typeof Badge>[0]['variant']} />
                              </div>
                              <p className="text-sm font-serif text-gray-900 dark:text-gray-100 leading-snug">
                                {card.front}
                              </p>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="overflow-hidden"
                                  >
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-sans mt-2 border-l-2 border-primary/30 pl-3 leading-relaxed">
                                      {getCardAnswer(card)}
                                    </p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCard(globalIdx); }}
                              className="text-gray-300 hover:text-red-400 dark:hover:text-red-500 transition-colors text-xs font-sans flex-shrink-0 p-1"
                              title="Remove card"
                              aria-label="Remove card"
                            >
                              ✕
                            </button>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 font-sans">
                      {pageStart + 1}–{Math.min(cardPage * CARDS_PER_PAGE, totalCards)} of {totalCards}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setCardPage((p) => Math.max(1, p - 1)); setExpandedCards(new Set()); }}
                        disabled={cardPage === 1}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === totalPages || Math.abs(p - cardPage) <= 1)
                          .reduce<(number | '…')[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, i) =>
                            p === '…' ? (
                              <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-300 font-sans">…</span>
                            ) : (
                              <button
                                key={p}
                                onClick={() => { setCardPage(p as number); setExpandedCards(new Set()); }}
                                className={`w-7 h-7 rounded-lg text-xs font-sans font-medium transition-colors ${
                                  cardPage === p
                                    ? 'bg-primary text-[#2C1810]'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {p}
                              </button>
                            )
                          )}
                      </div>
                      <button
                        onClick={() => { setCardPage((p) => Math.min(totalPages, p + 1)); setExpandedCards(new Set()); }}
                        disabled={cardPage === totalPages}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom actions */}
            <div className="flex gap-3 pb-4">
              <Button
                variant="ghost"
                onClick={() => { setStage('upload'); setGenerated(null); }}
              >
                Start over
              </Button>
              <SaveButton />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
