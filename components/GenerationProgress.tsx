'use client';

import { motion } from 'framer-motion';
import { Brain, FileText, Layers, CheckCircle2 } from 'lucide-react';

const steps = [
  { icon: FileText,      label: 'Parsing PDF',            description: 'Extracting text from your document' },
  { icon: Brain,         label: 'Analysing content',       description: 'Identifying key concepts and structure' },
  { icon: Layers,        label: 'Building revision sheets', description: 'Creating visual study notes with AI' },
  { icon: CheckCircle2,  label: 'Generating flashcards',   description: 'Almost ready!' },
];

interface GenerationProgressProps {
  step?: number; // 0-3
  filename?: string;
}

export default function GenerationProgress({ step = 0, filename }: GenerationProgressProps) {
  return (
    <div className="w-full max-w-md mx-auto text-center py-8">
      {/* Animated brain icon */}
      <motion.div
        className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(194,113,79,0.25)',
            '0 0 0 22px rgba(194,113,79,0)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <Brain className="w-10 h-10 text-primary" />
        </motion.div>
      </motion.div>

      <h3 className="text-xl font-serif text-gray-900 dark:text-gray-100 mb-1">
        Generating your study deck
      </h3>
      {filename && (
        <p className="text-sm text-gray-500 dark:text-gray-400 font-sans mb-6 truncate max-w-xs mx-auto">
          from {filename}
        </p>
      )}

      {/* Steps */}
      <div className="space-y-3 text-left">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done   = i < step;
          const active = i === step;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                done
                  ? 'bg-primary/8 dark:bg-primary/15'
                  : active
                  ? 'bg-primary/12 dark:bg-primary/20'
                  : 'bg-gray-50 dark:bg-gray-800/50 opacity-40'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-primary/80' : active ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {active ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  >
                    <Icon size={18} className="text-white" />
                  </motion.div>
                ) : (
                  <Icon size={18} className={done ? 'text-white' : 'text-gray-400'} />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium font-sans ${done || active ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                  {done ? '✓ ' : ''}{s.label}
                </p>
                {active && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-sans">{s.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 font-sans mt-6">
        This may take up to 30 seconds for longer PDFs
      </p>
    </div>
  );
}
