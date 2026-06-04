'use client';

import Link from 'next/link';
import TestConverter from '@/components/TestConverter';
import Footer from '@/components/Footer';

const ConvertPage = () => {
  return (
    <div className="min-h-svh flex flex-col items-center p-4 sm:p-8">
      <div className="flex-1" />
      <div className="text-center max-w-xl w-full">
        {/* Decorative accent line */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-up">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/40" />
          <div className="size-1.5 rounded-full bg-accent/60" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/40" />
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-text-primary mb-4 animate-fade-up delay-1 tracking-tight">
          Конвертер теста
        </h1>

        <p className="text-base sm:text-lg text-text-secondary mb-4 animate-fade-up delay-2 leading-relaxed">
          Распознаёт тест из «нумерованного» формата — можно сразу начать
          прохождение или скачать готовый файл .docx в формате тестера.
        </p>

        <div className="glass-card-raised border-accent/30! text-start mb-10 p-4 sm:p-5 animate-fade-up delay-2">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="size-4 text-accent shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="text-sm font-medium text-text-primary">
              Требования к исходному файлу
            </span>
          </div>
          <ul className="space-y-2 text-sm text-text-secondary leading-relaxed">
            <li className="flex gap-2">
              <span className="text-accent">•</span>
              <span>
                Вопросы <strong className="text-text-primary">пронумерованы</strong>{' '}
                (1., 2., …).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent">•</span>
              <span>
                Варианты идут <strong className="text-text-primary">списком</strong>{' '}
                под вопросом.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent">•</span>
              <span>
                Правильный ответ выделен{' '}
                <strong className="text-text-primary">жирным</strong> или помечен
                знаком{' '}
                <code className="text-accent font-semibold">+</code>.
              </span>
            </li>
          </ul>
        </div>

        <div className="animate-fade-up delay-3">
          <TestConverter />
          <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors duration-200"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              На главную
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1" />
      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </div>
  );
};

export default ConvertPage;
