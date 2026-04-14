'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Upload,
  FileText,
  Presentation,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  Star,
  Info,
  Save,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import PDFUploader from '@/components/PDFUploader';
import GenerationProgress from '@/components/GenerationProgress';
import type { ExamSession, ExamGenerateResponse } from '@/lib/types';
import { formatRelativeDate } from '@/lib/utils';

type Stage = 'list' | 'upload' | 'generating' | 'preview';

const QUESTIONS_PER_PAGE = 10;

const importanceConfig = {
  must_know: {
    label: 'Must Know',
    color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    icon: AlertCircle,
  },
  important: {
    label: 'Important',
    color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    icon: Star,
  },
  good_to_know: {
    label: 'Good to Know',
    color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    icon: Info,
  },
};

export default function ExamPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('list');
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [generationStep, setGenerationStep] = useState(0);
  const [filename, setFilename] = useState('');
  const [generated, setGenerated] = useState<ExamGenerateResponse | null>(null);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [questionPage, setQuestionPage] = useState(1);

  useEffect(() => {
    fetch('/api/exam/sessions')
      .then((r) => r.json())
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, []);

  const handleUpload = async (file: File) => {
    setFilename(file.name);
    setStage('generating');
    setError(null);
    setGenerationStep(0);

    const stepTimer = setInterval(() => {
      setGenerationStep((s) => Math.min(s + 1, 2));
    }, 1800);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/exam/generate', { method: 'POST', body: formData });
      clearInterval(stepTimer);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      setGenerationStep(3);
      const data: ExamGenerateResponse = await res.json();

      setTimeout(() => {
        setGenerated(data);
        setTitle(data.suggestedTitle);
        setQuestionPage(1);
        setStage('preview');
      }, 500);
    } catch (err) {
      clearInterval(stepTimer);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStage('upload');
    }
  };

  const handleSave = async () => {
    if (!generated) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/exam/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          sourceFilename: filename,
          summary: generated.summary,
          questions: generated.questions,
        }),
      });
      if (!res.ok) throw new Error('Failed to save session');
      const session = await res.json();
      router.push(`/exam/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    await fetch(`/api/exam/sessions/${id}`, { method: 'DELETE' });
    setSessions((s) => s.filter((sess) => sess.id !== id));
    setDeletingId(null);
  };

  const mustKnow = generated?.questions.filter((q) => q.importance === 'must_know').length ?? 0;
  const important = generated?.questions.filter((q) => q.importance === 'important').length ?? 0;
  const goodToKnow = generated?.questions.filter((q) => q.importance === 'good_to_know').length ?? 0;

  // Pagination
  const totalQuestions = generated?.questions.length ?? 0;
  const totalQPages = Math.max(1, Math.ceil(totalQuestions / QUESTIONS_PER_PAGE));
  const pagedQuestions = generated?.questions.slice(
    (questionPage - 1) * QUESTIONS_PER_PAGE,
    questionPage * QUESTIONS_PER_PAGE
  ) ?? [];
  const qPageStart = (questionPage - 1) * QUESTIONS_PER_PAGE;

  const canSave = !!generated && generated.questions.length > 0 && !!title.trim();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={22} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-gray-900 dark:text-gray-100">Exam Prep</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-sans">
              Upload a PDF or PPTX — get AI exam questions with model answers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {stage === 'preview' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Button
                onClick={handleSave}
                loading={isSaving}
                disabled={!canSave}
                size="sm"
                className="gap-1.5"
              >
                <Save size={14} />
                Save session
              </Button>
            </motion.div>
          )}
          {stage === 'list' && (
            <Button onClick={() => setStage('upload')} className="gap-2">
              <Upload size={15} />
              New session
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-sans flex items-center gap-2"
          >
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ── List ── */}
        {stage === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {loadingSessions ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 sm:py-20">
                <div className="w-20 h-20 rounded-3xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-6">
                  <GraduationCap size={36} className="text-violet-300 dark:text-violet-600" />
                </div>
                <h2 className="text-xl font-serif text-gray-900 dark:text-gray-100 mb-2">
                  No exam sessions yet
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-sans mb-6 max-w-sm mx-auto text-sm">
                  Upload a PDF or PPTX — lecture notes, textbook chapters, or presentation slides — and get
                  a curated set of exam questions with model answers.
                </p>
                {/* Supported formats */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs font-medium text-red-600 dark:text-red-400 font-sans">
                    <FileText size={11} /> PDF
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs font-medium text-orange-600 dark:text-orange-400 font-sans">
                    <Presentation size={11} /> PPTX
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-400 font-sans">
                    Up to 500 MB
                  </span>
                </div>
                <Button onClick={() => setStage('upload')} size="lg" className="mx-auto gap-2">
                  <Upload size={18} />
                  Upload PDF or PPTX
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 2, transition: { duration: 0.15 } }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-card border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-violet-200 dark:hover:border-violet-700 transition-colors group"
                    onClick={() => router.push(`/exam/${session.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <GraduationCap size={18} className="text-violet-500 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-serif text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base">
                            {session.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 font-sans">
                            {session.source_filename && (
                              <span className="flex items-center gap-1 truncate max-w-[140px]">
                                <FileText size={10} />
                                {session.source_filename}
                              </span>
                            )}
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Clock size={10} />
                              {formatRelativeDate(session.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs sm:text-sm font-medium font-sans text-gray-500 dark:text-gray-400">
                          {session.question_count} q
                        </span>
                        <ChevronRight size={15} className="text-gray-300 group-hover:text-violet-400 transition-colors" />
                        <button
                          onClick={(e) => handleDelete(session.id, e)}
                          disabled={deletingId === session.id}
                          className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Upload ── */}
        {stage === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-4">
              <button
                onClick={() => { setStage('list'); setError(null); }}
                className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 font-sans flex items-center gap-1.5 transition-colors"
              >
                ← Back to sessions
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {Object.entries(importanceConfig).map(([key, cfg]) => (
                <div key={key} className={`rounded-xl p-3 border text-center ${cfg.color}`}>
                  <p className="text-xs sm:text-sm font-semibold font-sans">{cfg.label}</p>
                  <p className="text-xs mt-0.5 opacity-75 font-sans hidden sm:block">
                    {key === 'must_know' ? 'Core exam topics' : key === 'important' ? 'Key applications' : 'Bonus marks'}
                  </p>
                </div>
              ))}
            </div>
            <PDFUploader onUpload={handleUpload} />
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
          <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Metadata */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-card border border-gray-100 dark:border-gray-700 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 font-sans mb-1.5 uppercase tracking-wide">
                  Session Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xl font-serif bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 outline-none text-gray-900 dark:text-gray-100 pb-1 transition-colors"
                />
              </div>
              {generated.summary && (
                <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
                  <p className="text-sm text-violet-800 dark:text-violet-300 font-sans leading-relaxed">
                    {generated.summary}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'must_know', count: mustKnow, ...importanceConfig.must_know },
                  { key: 'important', count: important, ...importanceConfig.important },
                  { key: 'good_to_know', count: goodToKnow, ...importanceConfig.good_to_know },
                ].map((item) => (
                  <div key={item.key} className={`rounded-xl p-3 border text-center ${item.color}`}>
                    <p className="text-xl font-serif">{item.count}</p>
                    <p className="text-xs font-sans mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions with pagination */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-serif text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm sm:text-base">
                  <Sparkles size={15} className="text-violet-500" />
                  {totalQuestions} Exam Questions
                </h2>
              </div>

              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {pagedQuestions.map((q, localIdx) => {
                  const cfg = importanceConfig[q.importance];
                  return (
                    <motion.div
                      key={qPageStart + localIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: localIdx * 0.03 }}
                      className="px-4 sm:px-5 py-3.5 flex items-start gap-3"
                    >
                      <span className="text-xs text-gray-300 font-mono mt-1 w-5 flex-shrink-0 text-right">
                        {qPageStart + localIdx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-sans border ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                          {q.topic && (
                            <span className="text-xs text-gray-400 font-sans truncate">{q.topic}</span>
                          )}
                        </div>
                        <p className="text-sm font-serif text-gray-900 dark:text-gray-100 leading-snug">
                          {q.question}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalQPages > 1 && (
                <div className="px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400 font-sans">
                    {qPageStart + 1}–{Math.min(questionPage * QUESTIONS_PER_PAGE, totalQuestions)} of {totalQuestions}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuestionPage((p) => Math.max(1, p - 1))}
                      disabled={questionPage === 1}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalQPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalQPages || Math.abs(p - questionPage) <= 1)
                      .reduce<(number | '…')[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '…' ? (
                          <span key={`e${i}`} className="px-1 text-xs text-gray-300 font-sans">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setQuestionPage(p as number)}
                            className={`w-7 h-7 rounded-lg text-xs font-sans font-medium transition-colors ${
                              questionPage === p
                                ? 'bg-violet-600 text-white'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <button
                      onClick={() => setQuestionPage((p) => Math.min(totalQPages, p + 1))}
                      disabled={questionPage === totalQPages}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div className="flex gap-3 pb-4">
              <Button variant="ghost" onClick={() => { setStage('upload'); setGenerated(null); }}>
                Start over
              </Button>
              <Button
                onClick={handleSave}
                loading={isSaving}
                disabled={!canSave}
                className="flex-1 gap-2"
                size="lg"
              >
                <CheckCircle2 size={18} />
                Save session ({totalQuestions} questions)
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
