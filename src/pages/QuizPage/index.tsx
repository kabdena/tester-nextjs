'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Footer from '@/components/Footer';

type Question = {
  question: string;
  type: string;
  variants: Variant[];
};

type Variant = {
  text: string;
  correct: boolean;
};

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    setQuestions(JSON.parse(localStorage.getItem('questions') || '[]'));
  }, []);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [selectedAnswersByQuestion, setSelectedAnswersByQuestion] = useState<
    Record<number, number>
  >({});
  const [countdown, setCountdown] = useState({
    hrs: '00',
    mins: '00',
    secs: '00',
  });
  const router = useRouter();

  const handleAnswer = useCallback(
    (index: number, questionIndex: number) => {
      setSelectedAnswersByQuestion((prevState) => ({
        ...prevState,
        [questionIndex]: index,
      }));

      const isCorrect = questions[currentQuestionIndex].variants[index].correct;
      const updatedResults = [...results, isCorrect];

      setResults(updatedResults);

      localStorage.setItem('results', JSON.stringify(updatedResults));
    },
    [questions, currentQuestionIndex, results],
  );

  const currentQuestion = questions[currentQuestionIndex];

  const setFormattedCountdown = useCallback((timer: number) => {
    const hrs = (timer / 3600).toFixed(0);
    const mins = (timer / 60).toFixed(0);
    const secs = (timer % 60).toFixed(0);

    setCountdown({
      hrs: hrs.toString().padStart(2, '0'),
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0'),
    });
  }, []);

  useEffect(() => {
    let seconds = 0;

    const timer = setInterval(() => {
      seconds++;

      setFormattedCountdown(seconds);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [setFormattedCountdown]);

  const showNextQuestionButton = useMemo(() => {
    return (
      selectedAnswersByQuestion[currentQuestionIndex] !== undefined &&
      currentQuestionIndex !== questions.length - 1
    );
  }, [selectedAnswersByQuestion, currentQuestionIndex, questions]);

  const showResultsButton = useMemo(() => {
    return Object.keys(selectedAnswersByQuestion).length === questions.length;
  }, [selectedAnswersByQuestion, questions]);

  const answeredCount = Object.keys(selectedAnswersByQuestion).length;

  return (
    <div className="min-h-svh flex flex-col p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6 mb-6 pb-4 border-b border-border-subtle sticky top-0 z-10 backdrop-blur-xl pt-4 -mx-4 md:-mx-8 px-4 md:px-8 -mt-4" style={{ backgroundColor: 'var(--color-backdrop-bg)' }}>
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-sm text-text-secondary tracking-wider">
              {countdown.mins}:{countdown.secs}
            </span>
          </div>

          {/* Progress */}
          {questions.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-1 w-20 sm:w-32 rounded-full bg-surface-overlay overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(answeredCount / questions.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-text-muted">
                {answeredCount}/{questions.length}
              </span>
            </div>
          )}
        </div>

        <Button
          size={'small'}
          variant={'errorOutlined'}
          onClick={() => {
            router.push('/results');
          }}
        >
          Завершить тест
        </Button>
      </div>

      {/* Question navigation */}
      <div className="mb-8 animate-fade-in">
        <div className="text-text-muted text-xs mb-2 tracking-wide uppercase">
          Прокрутите для просмотра других вопросов {'<'} {'>'}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
          {questions.map((_, index) => {
            const isCurrent = currentQuestionIndex === index;
            const isAnswered =
              selectedAnswersByQuestion[index] !== undefined &&
              !isCurrent;

            return (
              <div
                className={
                  'py-1.5 px-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 shrink-0' +
                  (isCurrent
                    ? ' bg-accent text-surface shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : '') +
                  (isAnswered
                    ? ' bg-accent/15 text-accent/80'
                    : '') +
                  (!isCurrent && !isAnswered
                    ? ' text-text-muted hover:text-text-secondary hover:bg-surface-overlay'
                    : '')
                }
                onClick={() => {
                  setCurrentQuestionIndex(index);
                }}
                key={index}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="animate-fade-up">
          <h2 className="font-display text-xl sm:text-2xl leading-snug text-text-primary mb-8">
            <span className="text-accent mr-2">{currentQuestionIndex + 1}.</span>
            {currentQuestion.question}
          </h2>

          <ul className="space-y-3">
            {currentQuestion.variants.map((variant, index) => {
              const isSelected =
                selectedAnswersByQuestion[currentQuestionIndex] === index;
              const isRevealed =
                selectedAnswersByQuestion[currentQuestionIndex] !== undefined;
              const isCorrect = variant.correct;

              let variantClasses =
                'glass-card-raised py-4 px-5 text-sm sm:text-base cursor-pointer transition-all duration-200 hover:border-border-accent';

              if (isRevealed) {
                if (isCorrect) {
                  variantClasses =
                    'py-4 px-5 text-sm sm:text-base rounded-xl border bg-success-bg border-success-border text-success';
                } else if (isSelected) {
                  variantClasses =
                    'py-4 px-5 text-sm sm:text-base rounded-xl border bg-error-bg border-error-border text-error';
                } else {
                  variantClasses =
                    'glass-card-raised py-4 px-5 text-sm sm:text-base opacity-50';
                }
              } else if (isSelected) {
                variantClasses =
                  'glass-card-raised py-4 px-5 text-sm sm:text-base border-accent!';
              }

              return (
                <li
                  key={index}
                  className={variantClasses}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() =>
                    !selectedAnswersByQuestion[currentQuestionIndex] &&
                    handleAnswer(index, currentQuestionIndex)
                  }
                >
                  <span className="text-text-muted mr-3 text-xs font-mono">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {variant.text}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Bottom action bar */}
      {(showNextQuestionButton || showResultsButton) && (
        <div className="py-5 sticky bottom-0 flex gap-3 backdrop-blur-xl mt-8 animate-fade-up -mx-4 md:-mx-8 px-4 md:px-8" style={{ backgroundColor: 'var(--color-backdrop-bg)' }}>
          {showNextQuestionButton && (
            <Button
              onClick={() => {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
              }}
            >
              Следующий вопрос
            </Button>
          )}
          {showResultsButton && (
            <Button
              variant={'outlined'}
              onClick={() => {
                router.push('/results');
              }}
            >
              Показать результаты тест
            </Button>
          )}
        </div>
      )}

      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
