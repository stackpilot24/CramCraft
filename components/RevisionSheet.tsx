'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { GeneratedRevisionSheet, RevisionSheetSection, SectionColor } from '@/lib/types';

// ─── Color palette ────────────────────────────────────────────────────────────

const SECTION_COLORS: Record<SectionColor, { bg: string; border: string; text: string; accent: string; header: string }> = {
  blue:   { bg: '#EFF6FF', border: '#93C5FD', text: '#1E40AF', accent: '#2563EB', header: '#DBEAFE' },
  green:  { bg: '#F0FDF4', border: '#86EFAC', text: '#166534', accent: '#16A34A', header: '#DCFCE7' },
  orange: { bg: '#FFF7ED', border: '#FDB97D', text: '#9A3412', accent: '#EA580C', header: '#FFEDD5' },
  purple: { bg: '#FAF5FF', border: '#C4B5FD', text: '#6B21A8', accent: '#9333EA', header: '#EDE9FE' },
  red:    { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', accent: '#DC2626', header: '#FEE2E2' },
  teal:   { bg: '#F0FDFA', border: '#5EEAD4', text: '#115E59', accent: '#0D9488', header: '#CCFBF1' },
  pink:   { bg: '#FDF2F8', border: '#F9A8D4', text: '#9D174D', accent: '#DB2777', header: '#FCE7F3' },
  yellow: { bg: '#FEFCE8', border: '#FDE68A', text: '#854D0E', accent: '#CA8A04', header: '#FEF9C3' },
};

// ─── Bold text parser ─────────────────────────────────────────────────────────

function parseBold(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} style={{ fontWeight: 700 }}>
            {part}
          </strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────

function DefinitionSection({ content, colors }: { content: Record<string, unknown>; colors: typeof SECTION_COLORS[SectionColor] }) {
  return (
    <div>
      <p style={{ color: colors.accent, fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
        {String(content.term ?? '')}
      </p>
      <p style={{ color: colors.text, fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 8 }}>
        {parseBold(String(content.definition ?? ''))}
      </p>
      {!!content.example && (
        <div style={{ background: colors.header, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 10px' }}>
          <p style={{ color: colors.text, fontSize: '0.8rem', fontStyle: 'italic' }}>
            <strong>Example:</strong> {parseBold(String(content.example))}
          </p>
        </div>
      )}
    </div>
  );
}

function ComparisonSection({ content, colors }: { content: Record<string, unknown>; colors: typeof SECTION_COLORS[SectionColor] }) {
  const rows = (content.rows as Array<Record<string, string>>) ?? [];
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 8px', textAlign: 'left', background: colors.header, color: colors.text, borderRadius: '6px 0 0 0', width: '30%' }}>
                Aspect
              </th>
              <th style={{ padding: '6px 8px', textAlign: 'left', background: colors.accent, color: 'white' }}>
                {String(content.leftTitle ?? 'Option A')}
              </th>
              <th style={{ padding: '6px 8px', textAlign: 'left', background: colors.text, color: 'white', borderRadius: '0 6px 0 0' }}>
                {String(content.rightTitle ?? 'Option B')}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : colors.header }}>
                <td style={{ padding: '5px 8px', color: colors.text, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>
                  {row.aspect}
                </td>
                <td style={{ padding: '5px 8px', color: colors.text, borderBottom: `1px solid ${colors.border}` }}>
                  {parseBold(row.left ?? '')}
                </td>
                <td style={{ padding: '5px 8px', color: colors.text, borderBottom: `1px solid ${colors.border}` }}>
                  {parseBold(row.right ?? '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!!content.summary && (
        <p style={{ marginTop: 8, color: colors.text, fontSize: '0.8rem', fontStyle: 'italic', fontWeight: 500 }}>
          {parseBold(String(content.summary))}
        </p>
      )}
    </div>
  );
}

function ListSection({ content, colors }: { content: Record<string, unknown>; colors: typeof SECTION_COLORS[SectionColor] }) {
  const items = (content.items as Array<Record<string, string>>) ?? [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}>{item.icon ?? '•'}</span>
          <div>
            <span style={{ fontWeight: 700, color: colors.accent, fontSize: '0.85rem' }}>{item.title}</span>
            {item.detail && (
              <span style={{ color: colors.text, fontSize: '0.82rem', marginLeft: 4 }}>
                — {parseBold(item.detail)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSection({ content, colors }: { content: Record<string, unknown>; colors: typeof SECTION_COLORS[SectionColor] }) {
  const headers = (content.headers as string[]) ?? [];
  const rows = (content.rows as string[][]) ?? [];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '6px 10px', textAlign: 'left', background: colors.accent, color: 'white', fontWeight: 600 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : colors.header }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '5px 10px', color: colors.text, borderBottom: `1px solid ${colors.border}` }}>
                  {parseBold(String(cell))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineSection({ content, colors }: { content: Record<string, unknown>; colors: typeof SECTION_COLORS[SectionColor] }) {
  const events = (content.events as Array<Record<string, string>>) ?? [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {events.map((event, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: colors.accent, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700
            }}>
              {event.icon ?? (i + 1)}
            </div>
            {i < events.length - 1 && (
              <div style={{ width: 2, flex: 1, minHeight: 12, background: colors.border, marginTop: 2 }} />
            )}
          </div>
          <div style={{ paddingBottom: i < events.length - 1 ? 8 : 0 }}>
            <p style={{ fontWeight: 700, color: colors.accent, fontSize: '0.82rem' }}>{event.label}</p>
            <p style={{ color: colors.text, fontSize: '0.8rem', marginTop: 2 }}>{parseBold(event.description ?? '')}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FormulaSection({ content, colors }: { content: Record<string, unknown>; colors: typeof SECTION_COLORS[SectionColor] }) {
  return (
    <div>
      <div style={{
        background: colors.accent, borderRadius: 10, padding: '10px 16px',
        marginBottom: 10, textAlign: 'center'
      }}>
        <p style={{ color: 'white', fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 700, letterSpacing: 1 }}>
          {String(content.formula ?? '')}
        </p>
      </div>
      {!!content.variables && (
        <p style={{ color: colors.text, fontSize: '0.82rem', marginBottom: 6 }}>
          <strong>Variables:</strong> {parseBold(String(content.variables))}
        </p>
      )}
      {!!content.example && (
        <div style={{ background: colors.header, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '6px 10px' }}>
          <p style={{ color: colors.text, fontSize: '0.8rem' }}>
            <strong>Example:</strong> {parseBold(String(content.example))}
          </p>
        </div>
      )}
    </div>
  );
}

function MnemonicSection({ content, colors }: { content: Record<string, unknown>; colors: typeof SECTION_COLORS[SectionColor] }) {
  const items = (content.items as string[]) ?? [];
  const acronym = String(content.acronym ?? '');
  const letters = acronym.split('');
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {letters.map((letter, i) => (
          <div key={i} style={{
            width: 36, height: 36, borderRadius: 8,
            background: colors.accent, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.1rem', flexShrink: 0
          }}>
            {letter}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: colors.header, border: `1px solid ${colors.border}`,
              color: colors.accent, fontWeight: 800, fontSize: '0.75rem'
            }}>
              {item[0]}
            </span>
            <span style={{ color: colors.text, fontSize: '0.82rem' }}>{item.slice(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExampleSection({ content, colors }: { content: Record<string, unknown>; colors: typeof SECTION_COLORS[SectionColor] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {!!content.scenario && (
        <div style={{ background: colors.header, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 12px' }}>
          <p style={{ color: colors.accent, fontWeight: 700, fontSize: '0.75rem', marginBottom: 3 }}>SCENARIO</p>
          <p style={{ color: colors.text, fontSize: '0.82rem' }}>{parseBold(String(content.scenario))}</p>
        </div>
      )}
      {!!content.solution && (
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 12px' }}>
          <p style={{ color: colors.accent, fontWeight: 700, fontSize: '0.75rem', marginBottom: 3 }}>SOLUTION</p>
          <p style={{ color: colors.text, fontSize: '0.82rem' }}>{parseBold(String(content.solution))}</p>
        </div>
      )}
      {!!content.keyTakeaway && (
        <div style={{ background: colors.accent, borderRadius: 8, padding: '8px 12px' }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', marginBottom: 3 }}>KEY TAKEAWAY</p>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.82rem' }}>{parseBold(String(content.keyTakeaway))}</p>
        </div>
      )}
    </div>
  );
}

function KeypointsSection({ content, colors }: { content: Record<string, unknown>; colors: typeof SECTION_COLORS[SectionColor] }) {
  const points = (content.points as Array<Record<string, string>>) ?? [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {points.map((point, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{point.icon ?? '✅'}</span>
          <p style={{ color: colors.text, fontSize: '0.83rem', lineHeight: 1.5 }}>
            {parseBold(point.text ?? '')}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SectionCard({ section, index }: { section: RevisionSheetSection; index: number }) {
  const colors = SECTION_COLORS[section.color] ?? SECTION_COLORS.blue;
  const content = section.content ?? {};

  const renderContent = () => {
    switch (section.type) {
      case 'definition':  return <DefinitionSection content={content} colors={colors} />;
      case 'comparison':  return <ComparisonSection content={content} colors={colors} />;
      case 'list':        return <ListSection content={content} colors={colors} />;
      case 'table':       return <TableSection content={content} colors={colors} />;
      case 'timeline':    return <TimelineSection content={content} colors={colors} />;
      case 'formula':     return <FormulaSection content={content} colors={colors} />;
      case 'mnemonic':    return <MnemonicSection content={content} colors={colors} />;
      case 'example':     return <ExampleSection content={content} colors={colors} />;
      case 'keypoints':   return <KeypointsSection content={content} colors={colors} />;
      default:            return <KeypointsSection content={content} colors={colors} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="dark:brightness-90 dark:contrast-95"
      style={{
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div style={{
        background: colors.header,
        borderBottom: `1px solid ${colors.border}`,
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: '1.1rem' }}>{section.icon}</span>
        <span style={{ color: colors.text, fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {section.title}
        </span>
      </div>

      {/* Section content */}
      <div style={{ padding: '12px 14px' }}>
        {renderContent()}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RevisionSheetProps {
  sheet: GeneratedRevisionSheet;
  index?: number;
}

export default function RevisionSheetCard({ sheet, index = 0 }: RevisionSheetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-card-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      {/* Card header */}
      <div
        className="px-6 py-5"
        style={{
          background: 'linear-gradient(135deg, #4A2C20 0%, #2C1810 100%)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-white/70 text-xs font-sans font-medium uppercase tracking-wider mb-1">
              {sheet.subtitle}
            </p>
            <h3 className="text-white font-serif text-lg font-bold leading-snug">
              {sheet.title}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">📋</span>
          </div>
        </div>
      </div>

      {/* Sections grid */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sheet.sections.map((section, i) => (
            <div
              key={i}
              className={
                // Full-width for comparison and table sections
                section.type === 'comparison' || section.type === 'table' || section.type === 'timeline'
                  ? 'md:col-span-2'
                  : ''
              }
            >
              <SectionCard section={section} index={i} />
            </div>
          ))}
        </div>

        {/* Mnemonics section */}
        {sheet.mnemonics && sheet.mnemonics.length > 0 && (
          <div className="mt-4 space-y-3">
            {sheet.mnemonics.map((mnemonic, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden border border-amber-200"
                style={{ background: '#FEFCE8' }}
              >
                <div className="px-4 py-2 flex items-center gap-2" style={{ background: '#FEF9C3', borderBottom: '1px solid #FDE68A' }}>
                  <span>🧠</span>
                  <span style={{ color: '#854D0E', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Mnemonic: {mnemonic.letters}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p style={{ color: '#854D0E', fontSize: '0.8rem', marginBottom: 8 }}>{mnemonic.meaning}</p>
                  <div className="flex flex-wrap gap-2">
                    {mnemonic.items.map((item, j) => (
                      <span
                        key={j}
                        className="inline-block text-xs font-sans rounded-lg px-2 py-1"
                        style={{ background: '#FEF9C3', border: '1px solid #FDE68A', color: '#854D0E' }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* One-line exam answer */}
        {sheet.oneLineAnswer && (
          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'linear-gradient(135deg, rgba(194,113,79,0.12) 0%, rgba(224,125,82,0.08) 100%)', border: '1.5px solid rgba(194,113,79,0.3)' }}
          >
            <span className="text-lg flex-shrink-0">⚡</span>
            <div>
              <p className="text-xs font-sans font-bold uppercase tracking-wider text-primary mb-1">
                1-Line Exam Answer
              </p>
              <p className="text-sm font-sans text-gray-800 dark:text-gray-200 leading-relaxed">
                {parseBold(sheet.oneLineAnswer)}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── DB row parser ────────────────────────────────────────────────────────────

import type { RevisionSheet } from '@/lib/types';

export function parseRevisionSheet(row: RevisionSheet): GeneratedRevisionSheet {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? '1-Page Exam Prep',
    sections: JSON.parse(row.sections) as GeneratedRevisionSheet['sections'],
    oneLineAnswer: row.one_line_answer ?? '',
    mnemonics: JSON.parse(row.mnemonics || '[]') as GeneratedRevisionSheet['mnemonics'],
  };
}
