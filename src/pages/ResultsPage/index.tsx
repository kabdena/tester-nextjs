'use client';

import Button from '@/components/Button';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Index = () => {
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    setResults(JSON.parse(localStorage.getItem('results') || '[]'));
  }, []);

  const correctAnswers = results.filter((res) => res).length;
  const totalQuestions = results.length;
  const percentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const router = useRouter();

  const getGrade = () => {
    if (percentage >= 90) return { label: 'Отлично', color: 'text-success' };
    if (percentage >= 70) return { label: 'Хорошо', color: 'text-accent' };
    if (percentage >= 50) return { label: 'Удовлетворительно', color: 'text-accent' };
    return { label: 'Нужно повторить', color: 'text-error' };
  };

  const grade = getGrade();

  return (
    <div className="min-h-svh flex flex-col items-center p-4 sm:p-8">
      <div className="flex-1" />
      <div className="glass-card p-8 sm:p-12 max-w-md w-full text-center animate-scale-in">
        {/* Decorative accent line */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/40" />
          <div className="size-1.5 rounded-full bg-accent/60" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/40" />
        </div>

        <h2 className="font-display text-3xl sm:text-4xl text-text-primary mb-2">
          Результаты теста
        </h2>

        <p className={`text-lg font-medium ${grade.color} mb-8 animate-fade-up delay-1`}>
          {grade.label}
        </p>

        {/* Score circle */}
        <div className="relative mx-auto mb-8 animate-fade-up delay-2">
          <svg className="size-40 mx-auto" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--color-surface-overlay)"
              strokeWidth="6"
            />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 3.14} ${314 - percentage * 3.14}`}
              strokeDashoffset="78.5"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.3))',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-text-primary font-mono">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-8 animate-fade-up delay-3">
          <div>
            <div className="text-2xl font-bold text-success">{correctAnswers}</div>
            <div className="text-xs text-text-muted uppercase tracking-wider">
              Верно
            </div>
          </div>
          <div className="w-px bg-border-subtle" />
          <div>
            <div className="text-2xl font-bold text-error">
              {totalQuestions - correctAnswers}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wider">
              Ошибки
            </div>
          </div>
          <div className="w-px bg-border-subtle" />
          <div>
            <div className="text-2xl font-bold text-text-primary">
              {totalQuestions}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wider">
              Всего
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-2 bg-surface-overlay rounded-full overflow-hidden mb-8 animate-fade-up delay-4">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-accent-hover rounded-full"
            style={{
              width: `${percentage}%`,
              animation: 'progressFill 1s ease-out',
            }}
          />
        </div>

        <div className="animate-fade-up delay-5">
          <Button onClick={() => router.push('/')}>Перейти на главную</Button>
        </div>
      </div>

      <div className="flex-1" />
      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
