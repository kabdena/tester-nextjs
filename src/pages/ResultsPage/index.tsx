'use client';

import Button from '@/components/Button';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Question = {
  question: string;
  type: string;
  variants: { text: string; correct: boolean }[];
  images?: string[];
};

const Index = () => {
  const [results, setResults] = useState<boolean[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    setResults(JSON.parse(localStorage.getItem('results') || '[]'));
    setQuestions(JSON.parse(localStorage.getItem('questions') || '[]'));
    setSelectedAnswers(JSON.parse(localStorage.getItem('selectedAnswers') || '{}'));
  }, []);

  const wrongQuestions = useMemo(() => {
    return questions
      .map((q, i) => ({ question: q, index: i }))
      .filter((_, i) => results[i] === false);
  }, [questions, results]);

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

      {wrongQuestions.length > 0 && (
        <div className="w-full max-w-3xl mt-8 space-y-4">
          <h3 className="font-display text-xl text-text-primary text-center mb-6">
            Неправильные ответы ({wrongQuestions.length})
          </h3>
          {wrongQuestions.map(({ question, index }) => {
            const selectedIdx = selectedAnswers[index];
            const correctVariant = question.variants.find((v) => v.correct);
            const selectedVariant = selectedIdx !== undefined ? question.variants[selectedIdx] : null;

            return (
              <div key={index} className="glass-card p-5 text-left">
                <p className="text-sm sm:text-base text-text-primary mb-3">
                  <span className="text-accent font-medium mr-2">{index + 1}.</span>
                  {question.question}
                </p>
                {selectedVariant && (
                  <div className="text-sm py-2 px-3 rounded-lg bg-error-bg border border-error-border text-error mb-2">
                    Ваш ответ: {selectedVariant.text}
                  </div>
                )}
                {correctVariant && (
                  <div className="text-sm py-2 px-3 rounded-lg bg-success-bg border border-success-border text-success">
                    Правильный ответ: {correctVariant.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1" />
      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
