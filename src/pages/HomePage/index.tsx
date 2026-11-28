'use client';

import { useState } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import UploadTest from '@/components/UploadTest';
import ContinueTest from '@/components/ContinueTest';
import FormatHelp from '@/components/FormatHelp';
import ShareButton from '@/components/ShareButton';
import Footer from '@/components/Footer';
import { reachGoal } from '@/utils/metrika';

const HomePage = () => {
  // null — файлы из IndexedDB ещё не восстановлены: шапку прячем (только её —
  // если хранилище зависнет, загрузка теста останется доступной), чтобы
  // у вернувшегося пользователя она не мигала полной → компактной.
  const [hasFiles, setHasFiles] = useState<boolean | null>(null);
  const compact = hasFiles === true;

  return (
    <div className="min-h-svh flex flex-col items-center p-4 sm:p-8">
      <div className="flex-1" />
      <div className="text-center max-w-xl w-full">
        <div className={classNames({ invisible: hasFiles === null })}>
          {/* С файлами шапка компактная: на первом экране — список и «Начать тест» */}
          {!compact && (
            <div className="flex items-center justify-center gap-3 mb-8 animate-fade-up">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/40" />
              <div className="size-1.5 rounded-full bg-accent/60" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/40" />
            </div>
          )}

          <h1
            className={classNames(
              'font-display text-text-primary animate-fade-up delay-1 tracking-tight',
              compact
                ? 'text-2xl sm:text-3xl mb-6'
                : 'text-4xl sm:text-5xl md:text-6xl mb-4',
            )}
          >
            Тестер для Platonus
          </h1>

          {!compact && (
            <p className="text-base sm:text-lg text-text-secondary mb-10 animate-fade-up delay-2 leading-relaxed">
              Проверьте свои знания, загрузив тест и ответив на вопросы.
            </p>
          )}
        </div>

        <div className="animate-fade-up delay-3">
          <ContinueTest />
          <UploadTest onHasFilesChange={setHasFiles} />
          <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 sm:gap-x-3 mt-4 max-sm:[&_svg:not(.keep-icon)]:hidden">
            <ShareButton />
            <span className="hidden sm:block size-1 rounded-full bg-text-muted/40" />
            <FormatHelp />
            <span className="hidden sm:block size-1 rounded-full bg-text-muted/40" />
            <Link
              href="/convert"
              onClick={() => reachGoal('convert_link_open')}
              className="inline-flex items-center min-h-11 gap-1.5 text-sm text-text-muted hover:text-accent transition-colors duration-200"
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
              Конвертер
              <span className="inline-flex items-center rounded-full bg-accent/15 text-accent-strong text-[11px] font-semibold uppercase tracking-wide px-1.5 py-0.5 leading-none">
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
