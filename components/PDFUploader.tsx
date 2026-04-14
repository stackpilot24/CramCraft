'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Presentation, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './ui/Button';

interface PDFUploaderProps {
  onUpload: (file: File) => void;
  onUploadMultiple?: (files: File[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

function getFileType(file: File): 'pdf' | 'pptx' | null {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (
    type.includes('presentationml') ||
    type.includes('powerpoint') ||
    name.endsWith('.pptx') ||
    name.endsWith('.ppt')
  )
    return 'pptx';
  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const VERCEL_WARN_SIZE = 4 * 1024 * 1024; // 4 MB — warn before Vercel's 4.5 MB hard limit

function validateFile(file: File): string | null {
  if (!getFileType(file)) return 'Please upload a PDF or PowerPoint (PPTX) file.';
  if (file.size > MAX_SIZE) return `File too large. Max 500 MB (yours: ${formatFileSize(file.size)}).`;
  return null;
}

function warnFile(file: File): string | null {
  if (file.size > VERCEL_WARN_SIZE)
    return `Large file (${formatFileSize(file.size)}) — may fail on hosted servers. Try to keep files under 4 MB.`;
  return null;
}

export default function PDFUploader({ onUpload, onUploadMultiple, multiple = false, disabled }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    setError(null);
    const valid: File[] = [];
    let firstErr: string | null = null;

    for (const f of incoming) {
      const err = validateFile(f);
      if (err) { firstErr = err; continue; }
      // deduplicate by name+size
      if (!selectedFiles.some((s) => s.name === f.name && s.size === f.size)) {
        valid.push(f);
      }
    }

    if (firstErr) setError(firstErr);
    if (valid.length > 0) {
      setSelectedFiles((prev) => multiple ? [...prev, ...valid] : [valid[0]]);
      const w = valid.map(warnFile).find(Boolean) ?? null;
      setWarning(w);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiple, selectedFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = () => {
    if (selectedFiles.length === 0) return;
    if (multiple && onUploadMultiple) {
      onUploadMultiple(selectedFiles);
    } else {
      onUpload(selectedFiles[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer select-none',
          'transition-colors duration-150',
          isDragging
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : selectedFiles.length > 0
            ? 'border-green-400 bg-green-50/60 dark:bg-green-900/10'
            : error
            ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary/60 dark:hover:border-primary-400/60',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
        animate={isDragging ? { scale: 1.015 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        aria-label="Upload file"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.pptx,.ppt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
          multiple={multiple}
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled}
        />

        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div key="dragging" initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Upload className="mx-auto h-12 w-12 text-primary mb-3" />
              <p className="text-primary font-semibold font-sans text-lg">Drop it here!</p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shadow-sm">
                  <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 dark:text-red-400" />
                </div>
                <span className="text-gray-300 dark:text-gray-600 text-2xl font-light">|</span>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shadow-sm">
                  <Presentation className="h-7 w-7 sm:h-8 sm:w-8 text-orange-500 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-gray-800 dark:text-gray-200 font-semibold font-sans mb-1 text-base sm:text-lg">
                {multiple ? 'Drag & drop one or more files' : 'Drag & drop your file here'}
              </p>
              <p className="text-sm text-gray-400 font-sans mb-3">
                or{' '}
                <span className="text-primary dark:text-primary-300 underline underline-offset-2 font-medium">
                  browse to choose {multiple ? 'files' : 'a file'}
                </span>
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs font-sans font-medium text-red-600 dark:text-red-400">
                  <FileText size={11} /> PDF
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs font-sans font-medium text-orange-600 dark:text-orange-400">
                  <Presentation size={11} /> PPTX
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-sans text-gray-400">
                  Up to 500 MB each
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm font-sans">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning */}
      <AnimatePresence>
        {warning && !error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm font-sans">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {warning}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-2">
            {selectedFiles.map((file, idx) => {
              const ft = getFileType(file);
              return (
                <motion.div key={`${file.name}-${idx}`}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center gap-3 p-3.5 bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                    ft === 'pdf' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30')}>
                    {ft === 'pdf'
                      ? <FileText className="h-4 w-4 text-red-500 dark:text-red-400" />
                      : <Presentation className="h-4 w-4 text-orange-500 dark:text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-sans truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-sans flex items-center gap-1">
                      <CheckCircle2 size={10} className="text-green-500" />
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors flex-shrink-0">
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}

            {/* Add more button for multiple mode */}
            {multiple && (
              <button onClick={() => inputRef.current?.click()}
                className="w-full py-2 text-xs text-primary dark:text-primary-300 font-sans font-medium hover:underline transition-colors">
                + Add another file
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate button */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.05 }}>
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button onClick={handleGenerate} disabled={disabled} loading={disabled} size="lg" className="w-full gap-2">
                <Upload size={18} />
                {multiple && selectedFiles.length > 1
                  ? `Generate ${selectedFiles.length} Decks`
                  : 'Generate Study Deck'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
