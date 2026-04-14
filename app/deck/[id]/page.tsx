'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Download,
  Printer,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  X,
  Check,
  Plus,
  BookOpen,
  Layers,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import type { DeckWithCards, Card, RevisionSheet, CardType } from '@/lib/types';
import DeckStats from '@/components/DeckStats';
import { MasteryRing, MasteryBreakdown } from '@/components/MasteryChart';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import RevisionSheetCard, { parseRevisionSheet } from '@/components/RevisionSheet';

type ActiveTab = 'notes' | 'cards';

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deck, setDeck] = useState<DeckWithCards | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCardFront, setEditCardFront] = useState('');
  const [editCardBack, setEditCardBack] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addCardModal, setAddCardModal] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('notes');
  const [revisionSheets, setRevisionSheets] = useState<RevisionSheet[]>([]);
  const [cardTypeFilter, setCardTypeFilter] = useState<CardType | 'all'>('all');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/decks/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setDeck(data);
        if (data?.revisionSheets?.length) {
          setRevisionSheets(data.revisionSheets);
          // Keep default 'notes' tab since we have revision sheets
        } else {
          // No revision sheets — show practice cards directly
          setActiveTab('cards');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const handleDeleteDeck = async () => {
    setIsDeleting(true);
    await fetch(`/api/decks/${id}`, { method: 'DELETE' });
    router.push('/dashboard');
  };

  const handleEditDeck = async () => {
    if (!deck) return;
    setIsSaving(true);
    const res = await fetch(`/api/decks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, description: editDesc }),
    });
    const updated = await res.json();
    setDeck((d) => (d ? { ...d, ...updated } : d));
    setEditModal(false);
    setIsSaving(false);
  };

  const handleEditCard = async () => {
    if (!editCard) return;
    setIsSaving(true);
    const res = await fetch(`/api/cards/${editCard.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front: editCardFront, back: editCardBack }),
    });
    const updated = await res.json();
    setDeck((d) =>
      d
        ? { ...d, cards: d.cards.map((c) => (c.id === editCard.id ? updated : c)) }
        : d
    );
    setEditCard(null);
    setIsSaving(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
    setDeck((d) =>
      d ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d
    );
  };

  const handleAddCard = async () => {
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    setIsAddingCard(true);
    const res = await fetch(`/api/decks/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front: newCardFront, back: newCardBack, card_type: 'concept' }),
    });
    if (res.ok) {
      const card: Card = await res.json();
      setDeck((d) =>
        d ? { ...d, cards: [...d.cards, card], card_count: d.card_count + 1 } : d
      );
      setNewCardFront('');
      setNewCardBack('');
      setAddCardModal(false);
    }
    setIsAddingCard(false);
  };

  const handleRegenerateCard = async (cardId: string) => {
    setRegeneratingId(cardId);
    try {
      const res = await fetch(`/api/cards/${cardId}/regenerate`, { method: 'POST' });
      if (res.ok) {
        const updated: Card = await res.json();
        setDeck((d) =>
          d ? { ...d, cards: d.cards.map((c) => (c.id === cardId ? updated : c)) } : d
        );
      }
    } catch {
      // silent fail
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = `/api/decks/${id}/export`;
  };

  const handlePrintFlashcards = () => {
    window.open(`/deck/${id}/print`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-sans">Deck not found.</p>
        <Link href="/dashboard" className="text-primary mt-2 inline-block font-sans text-sm">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 font-sans mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Library
      </Link>

      {/* Deck header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-card border border-gray-100 dark:border-gray-700 mb-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-serif text-gray-900 dark:text-gray-100 mb-2">
              {deck.title}
            </h1>
            {deck.description && (
              <p className="text-gray-500 dark:text-gray-400 font-sans text-sm mb-3">
                {deck.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400 font-sans">
              {deck.source_filename && (
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  {deck.source_filename}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Created {formatDate(deck.created_at)}
              </span>
              {deck.last_studied_at && (
                <span className="flex items-center gap-1">
                  Last studied {formatRelativeDate(deck.last_studied_at)}
                </span>
              )}
            </div>
          </div>

          <MasteryRing
            percentage={Math.round(deck.mastery_percentage)}
            size={72}
            strokeWidth={7}
            label="Mastery"
          />
        </div>

        <ProgressBar value={deck.mastery_percentage} className="mt-4 mb-3" />

        <MasteryBreakdown
          mastered={deck.stats.mastered}
          learning={deck.stats.learning}
          newCards={deck.stats.new}
          total={deck.stats.total}
        />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Link href={`/deck/${id}/study`}>
            <Button disabled={deck.stats.dueToday === 0} className="gap-2">
              <Play size={16} />
              Study now
              {deck.stats.dueToday > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {deck.stats.dueToday} due
                </span>
              )}
            </Button>
          </Link>
          <Link href={`/deck/${id}/study?mode=all`}>
            <Button variant="outline" size="md">
              <GraduationCap size={15} />
              Study all
            </Button>
          </Link>
          <button
            onClick={() => {
              setEditTitle(deck.title);
              setEditDesc(deck.description ?? '');
              setEditModal(true);
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Edit deck"
          >
            <Pencil size={16} />
          </button>
          <div className="relative group">
            <button
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Download / Print"
            >
              <Download size={16} />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 min-w-[170px]">
              <button
                onClick={handlePrintFlashcards}
                className="w-full text-left px-3 py-2 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
              >
                <Printer size={13} className="text-primary dark:text-primary-300" />
                Print / Save as PDF
              </button>
              <button
                onClick={handleDownloadBackup}
                className="w-full text-left px-3 py-2 text-sm font-sans text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg flex items-center gap-2"
              >
                <Download size={13} className="text-gray-400" />
                Download backup (.txt)
              </button>
            </div>
          </div>
          <button
            onClick={() => setDeleteModal(true)}
            className="p-2 rounded-xl text-gray-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete deck"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <DeckStats stats={deck.stats} />
      </motion.div>

      {/* Tab bar — Study Notes first, Practice Cards second */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4"
      >
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium font-sans transition-all ${
            activeTab === 'notes'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <BookOpen size={14} />
          Study Notes ({revisionSheets.length})
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-sm font-medium font-sans transition-all ${
            activeTab === 'cards'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <Layers size={14} />
          Practice Cards ({deck.cards.length})
        </button>
      </motion.div>

      {/* Study Notes (Revision Sheets) panel */}
      {activeTab === 'notes' && (
        <motion.div
          key="notes-panel"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-5"
        >
          {revisionSheets.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-primary" />
              </div>
              <p className="text-sm font-serif text-gray-700 dark:text-gray-300 mb-1">No revision sheets yet</p>
              <p className="text-xs text-gray-400 font-sans max-w-xs mx-auto">
                Visual study notes are generated when you upload a PDF. Re-upload to generate them.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 font-sans flex items-center gap-1.5">
                <BookOpen size={12} />
                {revisionSheets.length} visual revision {revisionSheets.length === 1 ? 'sheet' : 'sheets'} — tap any card to expand
              </p>
              {revisionSheets.map((sheet, i) => (
                <RevisionSheetCard
                  key={sheet.id}
                  sheet={parseRevisionSheet(sheet)}
                  index={i}
                />
              ))}
              <div className="pt-2">
                <Link href={`/deck/${id}/study`}>
                  <button className="w-full py-3 rounded-xl font-sans text-sm font-semibold text-[#2C1810] transition-all hover:opacity-90 active:scale-[0.99]"
                    style={{ background: 'linear-gradient(135deg, #E6B566 0%, #D4994A 100%)' }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Play size={16} />
                      Start Practice Session ({deck.cards.length} cards)
                    </span>
                  </button>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Practice Cards panel */}
      {activeTab === 'cards' && (
        <motion.div
          key="cards-panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden mb-6"
        >
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-serif text-gray-900 dark:text-gray-100">
              {deck.cards.length} Practice Cards
            </h2>
            <button
              onClick={() => setAddCardModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium font-sans text-primary dark:text-primary-300 hover:bg-primary/8 dark:hover:bg-primary/15 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} />
              Add card
            </button>
          </div>

          {/* Card type filter */}
          {deck.cards.length > 0 && (() => {
            const typeSet: Record<string, boolean> = {};
            deck.cards.forEach((c) => { typeSet[c.card_type] = true; });
            const types = Object.keys(typeSet) as CardType[];
            if (types.length <= 1) return null;
            return (
              <div className="px-5 py-2.5 border-b border-gray-100 dark:border-gray-700 flex gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setCardTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium font-sans flex-shrink-0 transition-colors ${
                    cardTypeFilter === 'all'
                      ? 'bg-primary text-[#2C1810]'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All ({deck.cards.length})
                </button>
                {types.map((t) => {
                  const count = deck.cards.filter((c) => c.card_type === t).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setCardTypeFilter(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium font-sans flex-shrink-0 capitalize transition-colors ${
                        cardTypeFilter === t
                          ? 'bg-primary text-[#2C1810]'
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {t.replace('_', ' ')} ({count})
                    </button>
                  );
                })}
              </div>
            );
          })()}

          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {deck.cards
              .filter((c) => cardTypeFilter === 'all' || c.card_type === cardTypeFilter)
              .map((card, i) => (
              <div key={card.id} className="px-5 py-3.5">
                {editCard?.id === card.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editCardFront}
                      onChange={(e) => setEditCardFront(e.target.value)}
                      rows={2}
                      className="w-full text-sm font-serif bg-gray-50 dark:bg-gray-900 border border-primary rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 resize-none focus:outline-none"
                      placeholder="Question"
                    />
                    <textarea
                      value={editCardBack}
                      onChange={(e) => setEditCardBack(e.target.value)}
                      rows={3}
                      className="w-full text-sm font-sans bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:border-primary"
                      placeholder="Answer"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditCard}
                        disabled={isSaving}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-sans font-medium"
                      >
                        <Check size={13} /> Save
                      </button>
                      <button
                        onClick={() => setEditCard(null)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-sans"
                      >
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-gray-300 dark:text-gray-600 font-mono mt-1 flex-shrink-0 w-5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={card.card_type as Parameters<typeof Badge>[0]['variant']} />
                        {card.repetitions > 0 && (
                          <span className="text-xs text-gray-400 font-sans">
                            {card.repetitions}× reviewed
                          </span>
                        )}
                      </div>
                      <button className="text-left w-full" onClick={() => toggleCard(card.id)}>
                        <p className="text-sm font-serif text-gray-900 dark:text-gray-100">
                          {card.front}
                        </p>
                        {expandedCards.has(card.id) && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-gray-500 dark:text-gray-400 font-sans mt-2 border-l-2 border-primary/30 pl-3"
                          >
                            {(() => {
                              try {
                                const parsed = JSON.parse(card.back);
                                return parsed.answer ?? card.back;
                              } catch {
                                return card.back;
                              }
                            })()}
                          </motion.p>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleCard(card.id)}
                        className="p-1 text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      >
                        {expandedCards.has(card.id) ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditCard(card);
                          setEditCardFront(card.front);
                          setEditCardBack(card.back);
                        }}
                        className="p-1 text-gray-300 hover:text-primary dark:hover:text-primary-300 transition-colors"
                        title="Edit card"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleRegenerateCard(card.id)}
                        disabled={regeneratingId === card.id}
                        className="p-1 text-gray-300 hover:text-amber-500 transition-colors disabled:opacity-50"
                        title="Regenerate with AI"
                      >
                        <RefreshCw
                          size={13}
                          className={regeneratingId === card.id ? 'animate-spin' : ''}
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1 text-gray-300 hover:text-danger transition-colors"
                        title="Delete card"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Delete modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete deck?">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-sans mb-6">
          This will permanently delete{' '}
          <strong className="text-gray-900 dark:text-gray-100">{deck.title}</strong> and all{' '}
          {deck.cards.length} cards. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setDeleteModal(false)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteDeck} loading={isDeleting} className="flex-1">
            <Trash2 size={16} />
            Delete deck
          </Button>
        </div>
      </Modal>

      {/* Add card modal */}
      <Modal
        open={addCardModal}
        onClose={() => {
          setAddCardModal(false);
          setNewCardFront('');
          setNewCardBack('');
        }}
        title="Add a card"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">
              Question (Front)
            </label>
            <textarea
              autoFocus
              value={newCardFront}
              onChange={(e) => setNewCardFront(e.target.value)}
              rows={2}
              placeholder="What is the question?"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">
              Answer (Back)
            </label>
            <textarea
              value={newCardBack}
              onChange={(e) => setNewCardBack(e.target.value)}
              rows={3}
              placeholder="What is the answer?"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setAddCardModal(false);
                setNewCardFront('');
                setNewCardBack('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCard}
              loading={isAddingCard}
              disabled={!newCardFront.trim() || !newCardBack.trim()}
              className="flex-1"
            >
              <Plus size={16} />
              Add card
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit deck modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit deck">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">
              Title
            </label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 font-sans mb-1.5 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setEditModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleEditDeck} loading={isSaving} className="flex-1">
              Save changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
