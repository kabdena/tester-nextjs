'use client';

import Button from '@/components/Button';
import Footer from '@/components/Footer';
import ShareButton from '@/components/ShareButton';
import AddToHomeHint from '@/components/AddToHomeHint';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { loadQuestions } from '@/utils/questionsStore';
import { reachGoal } from '@/utils/metrika';
import {
  formatElapsed,
  getAnswerResults,
  loadProgress,
  startAttempt,
} from '@/utils/quizProgress';
import {
  loadMistakeQuestions,
  prepareTest,
  recordCurrentAttempt,
  type StudyQuestion,
} from '@/utils/studyStore';

type Question = {
  question: string;
  type: string;
  variants: { text: string; correct: boolean }[];
  images?: string[];
};

const SITE_URL = 'https://tester-ayan.vercel.app';

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [mistakes, setMistakes] = useState<StudyQuestion[]>([]);

  useEffect(() => {
    const progress = loadProgress();
    setSelectedAnswers(progress.selectedAnswers);
    setElapsedSeconds(progress.elapsedSeconds);
    loadQuestions<Question>()
      .then(async (loaded) => {
        setQuestions(loaded);
        // Попытка попадает в локальную историю, а статусы вопросов —
        // в «Работу над ошибками».
        if (await recordCurrentAttempt(loaded)) {
          reachGoal('attempt_saved');
        }
        setMistakes(await loadMistakeQuestions());
      })
      .catch((err) => console.error(err));
  }, []);

  // Результаты считаем по индексу вопроса, а не по порядку ответов —
  // иначе при ответах вразнобой ошибки показывались не у тех вопросов.
  const results = useMemo(
    () => getAnswerResults(questions, selectedAnswers),
    [questions, selectedAnswers],
  );

  const wrongQuestions = useMemo(() => {
    return questions
      .map((q, i) => ({ question: q, index: i }))
      .filter((_, i) => results[i] === false);
  }, [questions, results]);

  const correctAnswers = results.filter((res) => res === true).length;
  const totalQuestions = results.filter((res) => res !== undefined).length;
  const percentage =
    totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  const router = useRouter();

  const telegramShareUrl = useMemo(() => {
    const text = `Мой результат в Тестере для Platonus: ${Math.round(percentage)}% (${correctAnswers} из ${totalQuestions}). Загружай свой .docx и готовься к сессии 👇`;
    return `https://t.me/share/url?url=${encodeURIComponent(`${SITE_URL}/?ref=result_tg`)}&text=${encodeURIComponent(text)}`;
  }, [percentage, correctAnswers, totalQuestions]);

  const getGrade = () => {
    if (percentage >= 90) return { label: 'Отлично', color: 'text-success' };
    if (percentage >= 70) return { label: 'Хорошо', color: 'text-accent' };
    if (percentage >= 50)
      return { label: 'Удовлетворительно', color: 'text-accent' };
    return { label: 'Нужно повторить', color: 'text-error' };
  };

  const grade = getGrade();

  // Вопросы остаются в IndexedDB, поэтому тест можно пройти заново
  // без повторного прикрепления файла — достаточно сбросить ответы.
  const handleRestart = () => {
    reachGoal('test_restart');
    startAttempt(loadProgress().mode);
    router.push('/quiz');
  };

  const handleMistakes = async () => {
    if (mistakes.length === 0) return;
    try {
      await prepareTest(mistakes, { mode: 'mistakes' });
    } catch (err) {
      console.error(err);
      return;
    }
    reachGoal('mistakes_mode_start');
    router.push('/quiz');
  };

  return (
    <div className="min-h-svh flex flex-col items-center p-4 sm:p-8">
      <div className="flex-1" />
      <div className="glass-card p-6 sm:p-12 max-w-md w-full text-center animate-scale-in">
        {/* Decorative accent line */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/40" />
          <div className="size-1.5 rounded-full bg-accent/60" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/40" />
        </div>

        <h2 className="font-display text-3xl sm:text-4xl text-text-primary mb-2">
          Результаты теста
        </h2>

        <p
          className={`text-lg font-medium ${grade.color} mb-1 animate-fade-up delay-1`}
        >
          {grade.label}
        </p>
        <p className="text-xs text-text-muted mb-8 animate-fade-up delay-1">
          Время: {formatElapsed(elapsedSeconds)}
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
                // Свечение в цвет акцента; раньше оставался оранжевый от старой темы.
                filter: 'drop-shadow(0 0 8px var(--color-accent-glow))',
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
            <div className="text-2xl font-bold text-success">
              {correctAnswers}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wider">
              Верно
            </div>
          </div>
          <div className="w-px bg-border-subtle" />
          <div>
            {/* Ноль ошибок — не повод для красного */}
            <div
              className={`text-2xl font-bold ${
                totalQuestions - correctAnswers > 0
                  ? 'text-error'
                  : 'text-text-primary'
              }`}
            >
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

        {/* Одна главная кнопка, остальное — второстепенное: раньше было
            пять равнозначных кнопок подряд. */}
        <div className="animate-fade-up delay-5 flex flex-col items-center gap-3">
          {mistakes.length > 0 ? (
            <Button className="w-full sm:w-auto" onClick={handleMistakes}>
              Работа над ошибками ({mistakes.length})
            </Button>
          ) : (
            questions.length > 0 && (
              <Button className="w-full sm:w-auto" onClick={handleRestart}>
                Пройти заново
              </Button>
            )
          )}

          <div className="flex items-center justify-center gap-5 text-sm">
            {mistakes.length > 0 && questions.length > 0 && (
              <button
                type="button"
                onClick={handleRestart}
                className="min-h-11 px-2 text-text-secondary hover:text-accent transition-colors"
              >
                Пройти заново
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push('/')}
              className="min-h-11 px-2 text-text-secondary hover:text-accent transition-colors"
            >
              На главную
            </button>
          </div>

          {totalQuestions > 0 && (
            <div className="flex items-center justify-center gap-6 pt-1 mt-1 border-t border-border-subtle w-full">
              <a
                href={telegramShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => reachGoal('share_telegram')}
                className="inline-flex items-center min-h-11 gap-1.5 whitespace-nowrap text-sm text-[#229ED9] hover:opacity-80 transition-opacity"
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M21.94 4.3a1.1 1.1 0 0 0-1.5-1.2L2.7 10.03c-.98.38-.97 1.77.02 2.13l4.43 1.6 1.7 5.28c.22.68 1.07.9 1.59.4l2.5-2.4 4.63 3.42c.62.46 1.5.12 1.66-.63L21.94 4.3zM9.86 13.94l-.37 3.33-1.23-3.83 9.3-6.1-7.7 6.6z" />
                </svg>
                Telegram
              </a>
              <ShareButton compact />
            </div>
          )}
        </div>
      </div>

      {totalQuestions > 0 && (
        <div className="w-full max-w-md mt-6">
          <AddToHomeHint />
        </div>
      )}

      {wrongQuestions.length > 0 && (
        <div className="w-full max-w-3xl mt-8 space-y-4">
          <h3 className="font-display text-xl text-text-primary text-center mb-6">
            Неправильные ответы ({wrongQuestions.length})
          </h3>
          {wrongQuestions.map(({ question, index }) => {
            const selectedIdx = selectedAnswers[index];
            const correctVariant = question.variants.find((v) => v.correct);
            const selectedVariant =
              selectedIdx !== undefined ? question.variants[selectedIdx] : null;

            return (
              <div key={index} className="glass-card p-5 text-left">
                <p className="text-sm sm:text-base text-text-primary mb-3">
                  <span className="text-accent font-medium mr-2">
                    {index + 1}.
                  </span>
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
