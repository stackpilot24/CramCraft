'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  GraduationCap,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
  Star,
  Info,
  Filter,
  BookOpen,
} from 'lucide-react';
import type { ExamSessionWithQuestions, ExamQuestion, QuestionImportance } from '@/lib/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

const importanceConfig: Record<
  QuestionImportance,
  { label: string; color: string; bg: string; border: string; dot: string; icon: React.ElementType }
> = {
  must_know: {
    label: 'Must Know',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
    icon: AlertCircle,
  },
  important: {
    label: 'Important',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    icon: Star,
  },
  good_to_know: {
    label: 'Good to Know',
    color: 'text-green-700 dark:text-green-300',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
    icon: Info,
  },
};

const typeLabels: Record<string, string> = {
  conceptual: 'Conceptual',
  application: 'Application',
  analysis: 'Analysis',
  definition: 'Definition',
  problem_solving: 'Problem Solving',
};

type FilterKey = 'all' | QuestionImportance;

export default function ExamSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<ExamSessionWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/exam/sessions/${id}`)
      .then((r) => r.json())
      .then((data) => setSession(data))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleExpand = (qId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await fetch(`/api/exam/sessions/${id}`, { method: 'DELETE' });
    router.push('/exam');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-sans">Session not found.</p>
        <button
          onClick={() => router.push('/exam')}
          className="mt-2 text-sm text-violet-600 hover:underline font-sans"
        >
          Back to Exam Prep
        </button>
      </div>
    );
  }

  const topics = Array.from(new Set(session.questions.map((q) => q.topic).filter(Boolean))) as string[];

  const filtered = session.questions.filter((q) => {
    const importanceMatch = filter === 'all' || q.importance === filter;
    const topicMatch = topicFilter === 'all' || q.topic === topicFilter;
    return importanceMatch && topicMatch;
  });

  const counts = {
    all: session.questions.length,
    must_know: session.questions.filter((q) => q.importance === 'must_know').length,
    important: session.questions.filter((q) => q.importance === 'important').length,
    good_to_know: session.questions.filter((q) => q.importance === 'good_to_know').length,
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push('/exam')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 font-sans mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Exam Prep
      </button>

      {/* Session header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card border border-gray-100 dark:border-gray-700 mb-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 mb-1">
                {session.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-xs text-gray-400 font-sans">
                {session.source_filename && (
                  <span className="flex items-center gap-1">
                    <FileText size={11} />
                    {session.source_filename}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {formatDate(session.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={11} />
                  {session.question_count} questions
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDeleteModal(true)}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
            title="Delete session"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {session.summary && (
          <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-800">
            <p className="text-sm text-violet-800 dark:text-violet-300 font-sans leading-relaxed">
              {session.summary}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {(['must_know', 'important', 'good_to_know'] as QuestionImportance[]).map((key) => {
            const cfg = importanceConfig[key];
            return (
              <div
                key={key}
                className={`rounded-xl p-3 border text-center ${cfg.bg} ${cfg.border}`}
              >
                <p className={`text-xl font-serif ${cfg.color}`}>{counts[key]}</p>
                <p className={`text-xs font-sans mt-0.5 ${cfg.color}`}>{cfg.label}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-wrap gap-2 mb-4"
      >
        <div className="flex items-center gap-1.5 mr-1">
          <Filter size={13} className="text-gray-400" />
          <span className="text-xs text-gray-400 font-sans">Filter:</span>
        </div>

        {([
          { key: 'all', label: `All (${counts.all})` },
          { key: 'must_know', label: `Must Know (${counts.must_know})` },
          { key: 'important', label: `Important (${counts.important})` },
          { key: 'good_to_know', label: `Good to Know (${counts.good_to_know})` },
        ] as { key: FilterKey; label: string }[]).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium font-sans transition-colors border ${
              filter === opt.key
                ? opt.key === 'must_know'
                  ? 'bg-red-500 text-white border-red-500'
                  : opt.key === 'important'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : opt.key === 'good_to_know'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-violet-600 text-white border-violet-600'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-violet-300'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {topics.length > 1 && (
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-sans bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-violet-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </motion.div>

      {/* Expand / collapse all */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() =>
            setExpandedIds(
              expandedIds.size === filtered.length
                ? new Set()
                : new Set(filtered.map((q) => q.id))
            )
          }
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-sans transition-colors"
        >
          {expandedIds.size === filtered.length ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Questions list */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 font-sans text-sm">
            No questions match this filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {filtered.map((q: ExamQuestion, i) => {
              const cfg = importanceConfig[q.importance];
              const Icon = cfg.icon;
              const isExpanded = expandedIds.has(q.id);

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`border-l-4 ${cfg.border}`}
                >
                  <button
                    className="w-full px-5 py-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                    onClick={() => toggleExpand(q.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}
                      >
                        <Icon size={13} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-medium font-sans ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {q.question_type && (
                            <span className="text-xs text-gray-400 font-sans">
                              · {typeLabels[q.question_type] ?? q.question_type}
                            </span>
                          )}
                          {q.topic && (
                            <span className="text-xs text-gray-400 font-sans">
                              · {q.topic}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-serif text-gray-900 dark:text-gray-100 leading-snug">
                          {q.question}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-gray-300 dark:text-gray-600 mt-0.5">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={`mx-5 mb-4 p-4 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                          <p className="text-xs font-medium font-sans text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            Model Answer
                          </p>
                          <p className="text-sm font-sans text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {q.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Delete modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete session?">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-sans mb-6">
          This will permanently delete{' '}
          <strong className="text-gray-900 dark:text-gray-100">{session.title}</strong> and all{' '}
          {session.question_count} questions. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteModal(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={isDeleting} className="flex-1">
            <Trash2 size={16} />
            Delete session
          </Button>
        </div>
      </Modal>
    </div>
  );
}
