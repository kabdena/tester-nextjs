'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import UploadTest from '@/components/UploadTest';
import FormatHelp from '@/components/FormatHelp';
import ShareButton from '@/components/ShareButton';
import Footer from '@/components/Footer';
import { reachGoal } from '@/utils/metrika';

const HomePage = () => {
  useEffect(() => {
    localStorage.setItem('results', JSON.stringify([]));
  }, []);

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
          Тестер для Platonus
        </h1>

        <p className="text-base sm:text-lg text-text-secondary mb-10 animate-fade-up delay-2 leading-relaxed">
          Проверьте свои знания, загрузив тест и ответив на вопросы.
        </p>

        <div className="animate-fade-up delay-3">
          <UploadTest />
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <ShareButton />
            <span className="size-1 rounded-full bg-text-muted/40" />
            <FormatHelp />
            <span className="size-1 rounded-full bg-text-muted/40" />
            <Link
              href="/convert"
              onClick={() => reachGoal('convert_link_open')}
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
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              Конвертировать из другого формата
              <span className="ml-1 inline-flex items-center rounded-full bg-accent/15 text-accent text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 leading-none">
                new
              </span>
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

export default HomePage;
