'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Presentation, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './ui/Button';

interface PDFUploaderProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
];

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

export default function PDFUploader({ onUpload, disabled }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const fileType = getFileType(file);
    if (!fileType) {
      return 'Please upload a PDF or PowerPoint (PPTX) file.';
    }
    if (file.size > MAX_SIZE) {
      return `File is too large. Maximum size is 500 MB (your file is ${formatFileSize(file.size)}).`;
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const fileType = selectedFile ? getFileType(selectedFile) : null;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer select-none',
          'transition-colors duration-150',
          isDragging
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : selectedFile
            ? 'border-green-400 bg-green-50/60 dark:bg-green-900/10'
            : error
            ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary/60 dark:hover:border-primary-400/60',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
        animate={isDragging ? { scale: 1.015 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled}
        />

        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <Upload className="mx-auto h-12 w-12 text-primary mb-3" />
              <p className="text-primary font-semibold font-sans text-lg">Drop it here!</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Icon row */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: isDragging ? -8 : 0 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shadow-sm"
                >
                  <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 dark:text-red-400" />
                </motion.div>
                <span className="text-gray-300 dark:text-gray-600 text-2xl font-light">|</span>
                <motion.div
                  animate={{ rotate: isDragging ? 8 : 0 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shadow-sm"
                >
                  <Presentation className="h-7 w-7 sm:h-8 sm:w-8 text-orange-500 dark:text-orange-400" />
                </motion.div>
              </div>

              <p className="text-gray-800 dark:text-gray-200 font-semibold font-sans mb-1 text-base sm:text-lg">
                Drag & drop your file here
              </p>
              <p className="text-sm text-gray-400 font-sans mb-3">
                or{' '}
                <span className="text-primary dark:text-primary-300 underline underline-offset-2 font-medium">
                  browse to choose a file
                </span>
              </p>

              {/* Supported formats badges */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs font-sans font-medium text-red-600 dark:text-red-400">
                  <FileText size={11} /> PDF
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-xs font-sans font-medium text-orange-600 dark:text-orange-400">
                  <Presentation size={11} /> PPTX
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-sans text-gray-400">
                  Up to 500 MB
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-red-600 dark:text-red-400 text-sm font-sans"
          >
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected file preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800 rounded-xl"
          >
            {/* File type icon */}
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              fileType === 'pdf'
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-orange-100 dark:bg-orange-900/30'
            )}>
              {fileType === 'pdf' ? (
                <FileText className="h-5 w-5 text-red-500 dark:text-red-400" />
              ) : (
                <Presentation className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 font-sans truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-sans mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-green-500 flex-shrink-0" />
                {formatFileSize(selectedFile.size)} · Ready to upload
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                setError(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              aria-label="Remove file"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate button */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.05 }}
          >
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => onUpload(selectedFile)}
                disabled={disabled}
                loading={disabled}
                size="lg"
                className="w-full gap-2"
              >
                <Upload size={18} />
                Generate Study Deck
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
