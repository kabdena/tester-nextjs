'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { loadQuestions } from '@/utils/questionsStore';
import {
  formatElapsed,
  loadProgress,
  saveProgress,
} from '@/utils/quizProgress';

type Question = {
  question: string;
  type: string;
  variants: Variant[];
  images?: string[];
};

type Variant = {
  text: string;
  correct: boolean;
};

const Index = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isRestored, setIsRestored] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswersByQuestion, setSelectedAnswersByQuestion] = useState<
    Record<number, number>
  >({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  // Подсказку «прокрутите» показываем, только когда номерам тесно.
  const navRef = useRef<HTMLDivElement | null>(null);
  const [isNavOverflowing, setIsNavOverflowing] = useState(false);

  // Восстанавливаем вопросы и прогресс: после перезагрузки или выгрузки
  // вкладки тест продолжается с того же места.
  useEffect(() => {
    loadQuestions<Question>().then((loaded) => {
      const progress = loadProgress();
      setQuestions(loaded);
      setSelectedAnswersByQuestion(progress.selectedAnswers);
      setCurrentQuestionIndex(
        Math.min(progress.currentQuestionIndex, Math.max(loaded.length - 1, 0)),
      );
      setElapsedSeconds(progress.elapsedSeconds);
      setIsRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!isRestored) return;
    saveProgress({
      currentQuestionIndex,
      selectedAnswers: selectedAnswersByQuestion,
      elapsedSeconds,
    });
  }, [
    isRestored,
    currentQuestionIndex,
    selectedAnswersByQuestion,
    elapsedSeconds,
  ]);

  const handleAnswer = useCallback((index: number, questionIndex: number) => {
    setSelectedAnswersByQuestion((prev) =>
      prev[questionIndex] !== undefined
        ? prev
        : { ...prev, [questionIndex]: index },
    );
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    setCurrentImageIndex(0);
    // Держим текущий номер в зоне видимости ленты вопросов — важно после
    // восстановления прогресса, когда открываемся, например, на 40-м вопросе.
    document
      .getElementById(`question-nav-${currentQuestionIndex}`)
      ?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [currentQuestionIndex, isRestored]);

  const hasQuestions = questions.length > 0;

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const update = () =>
      setIsNavOverflowing(nav.scrollWidth > nav.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [hasQuestions, questions.length]);

  useEffect(() => {
    if (!isRestored || !hasQuestions) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isRestored, hasQuestions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        const images = questions[currentQuestionIndex]?.images;
        if (e.key === 'Escape') {
          setLightboxIndex(null);
        } else if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
          setLightboxIndex((prev) => prev! - 1);
        } else if (
          e.key === 'ArrowRight' &&
          images &&
          lightboxIndex < images.length - 1
        ) {
          setLightboxIndex((prev) => prev! + 1);
        }
      } else {
        if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
          setCurrentQuestionIndex((prev) => prev - 1);
        } else if (
          e.key === 'ArrowRight' &&
          currentQuestionIndex < questions.length - 1
        ) {
          setCurrentQuestionIndex((prev) => prev + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, questions, lightboxIndex]);

  const showResultsButton = useMemo(() => {
    return Object.keys(selectedAnswersByQuestion).length === questions.length;
  }, [selectedAnswersByQuestion, questions]);

  const answeredCount = Object.keys(selectedAnswersByQuestion).length;

  return (
    <div className="min-h-svh flex flex-col p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header bar */}
      {hasQuestions && (
        <div
          className="flex items-center justify-between gap-x-3 sm:gap-x-6 mb-6 pb-4 border-b border-border-subtle sticky top-0 z-10 backdrop-blur-xl pt-4 -mx-4 md:-mx-8 px-4 md:px-8 -mt-4"
          style={{ backgroundColor: 'var(--color-backdrop-bg)' }}
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Timer */}
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-sm text-text-secondary tracking-wider">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>

            {/* Progress */}
            {questions.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 sm:w-32 rounded-full bg-surface-overlay overflow-hidden">
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
            className="shrink-0 px-3! sm:px-5!"
            onClick={() => {
              router.push('/results');
            }}
          >
            Завершить тест
          </Button>
        </div>
      )}

      {/* Question navigation */}
      {hasQuestions && (
        <div className="mb-8 animate-fade-in">
          {isNavOverflowing && (
            <div className="text-text-muted text-xs mb-2 tracking-wide uppercase">
              Прокрутите для просмотра других вопросов {'<'} {'>'}
            </div>
          )}
          <div
            ref={navRef}
            className="flex items-center gap-1.5 overflow-x-auto pb-2"
          >
            {questions.map((_, index) => {
              const isCurrent = currentQuestionIndex === index;
              const selected = selectedAnswersByQuestion[index];
              const isAnswered = selected !== undefined && !isCurrent;
              // Ответ виден сразу, поэтому номер показывает итог:
              // зелёный — верно, красный — ошибка.
              const isAnsweredCorrect =
                isAnswered && questions[index]?.variants[selected]?.correct;

              return (
                <button
                  type="button"
                  id={`question-nav-${index}`}
                  aria-label={`Вопрос ${index + 1}${
                    isAnswered
                      ? isAnsweredCorrect
                        ? ', отвечен верно'
                        : ', отвечен неверно'
                      : ''
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={
                    'min-w-11 h-11 px-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 shrink-0 focus-visible:outline-2 focus-visible:outline-accent' +
                    (isCurrent
                      ? ' bg-accent text-on-accent shadow-[0_0_12px_var(--color-accent-glow)]'
                      : '') +
                    (isAnswered
                      ? isAnsweredCorrect
                        ? ' border bg-success-bg border-success-border text-success'
                        : ' border bg-error-bg border-error-border text-error'
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
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isRestored && !hasQuestions && (
        <div className="glass-card p-8 text-center animate-fade-up">
          <p className="text-text-secondary mb-6">
            Тест не найден. Загрузите файл с вопросами на главной.
          </p>
          <Button onClick={() => router.push('/')}>На главную</Button>
        </div>
      )}

      {/* Question */}
      {currentQuestion && (
        <div className="animate-fade-up">
          <h2 className="font-display text-xl sm:text-2xl leading-snug text-text-primary mb-8">
            <span className="text-accent mr-2">
              {currentQuestionIndex + 1}.
            </span>
            {currentQuestion.question}
          </h2>

          {currentQuestion.images && currentQuestion.images.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <img
                  src={
                    currentQuestion.images[currentImageIndex] ||
                    currentQuestion.images[0]
                  }
                  alt={`Изображение ${currentImageIndex + 1} к вопросу ${currentQuestionIndex + 1}`}
                  className="w-full h-60 sm:h-72 object-contain rounded-xl border border-border-subtle cursor-zoom-in hover:opacity-80 transition-opacity"
                  onClick={() => setLightboxIndex(currentImageIndex)}
                />
                {currentQuestion.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Предыдущее изображение"
                      className="absolute left-2 top-1/2 -translate-y-1/2 size-11 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors disabled:opacity-30"
                      disabled={currentImageIndex === 0}
                      onClick={() => setCurrentImageIndex((prev) => prev - 1)}
                    >
                      <svg
                        className="size-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label="Следующее изображение"
                      className="absolute right-2 top-1/2 -translate-y-1/2 size-11 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors disabled:opacity-30"
                      disabled={
                        currentImageIndex === currentQuestion.images.length - 1
                      }
                      onClick={() => setCurrentImageIndex((prev) => prev + 1)}
                    >
                      <svg
                        className="size-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {currentQuestion.images.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {currentQuestion.images.map((_, index) => (
                    <button
                      type="button"
                      key={index}
                      aria-label={`Изображение ${index + 1}`}
                      className={
                        'size-2 rounded-full transition-all' +
                        (index === currentImageIndex
                          ? ' bg-accent scale-125'
                          : ' bg-text-muted/30 hover:bg-text-muted/50')
                      }
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <ul className="space-y-3">
            {currentQuestion.variants.map((variant, index) => {
              const isSelected =
                selectedAnswersByQuestion[currentQuestionIndex] === index;
              const isRevealed =
                selectedAnswersByQuestion[currentQuestionIndex] !== undefined;
              const isCorrect = variant.correct;

              const base =
                'w-full flex items-start gap-3 text-left py-4 px-5 text-sm sm:text-base transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
              let variantClasses = `${base} glass-card-raised cursor-pointer hover:border-border-accent`;
              // Верно/неверно — не только цветом, но и значком с подписью
              // для экранного диктора.
              let mark: 'correct' | 'wrong' | null = null;

              if (isRevealed) {
                if (isCorrect) {
                  variantClasses = `${base} rounded-xl border bg-success-bg border-success-border text-success`;
                  mark = 'correct';
                } else if (isSelected) {
                  variantClasses = `${base} rounded-xl border bg-error-bg border-error-border text-error`;
                  mark = 'wrong';
                } else {
                  variantClasses = `${base} glass-card-raised opacity-50`;
                }
              } else if (isSelected) {
                variantClasses = `${base} glass-card-raised border-accent!`;
              }

              return (
                <li key={index}>
                  <button
                    type="button"
                    className={variantClasses}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    aria-disabled={isRevealed || undefined}
                    onClick={() => handleAnswer(index, currentQuestionIndex)}
                  >
                    <span className="text-text-muted text-xs font-mono leading-5 sm:leading-6 shrink-0">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{variant.text}</span>
                    {mark && (
                      <svg
                        className="size-5 shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        role="img"
                        aria-label={
                          mark === 'correct' ? 'Правильный ответ' : 'Неверный ответ'
                        }
                      >
                        {mark === 'correct' ? (
                          <polyline points="20 6 9 17 4 12" />
                        ) : (
                          <>
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </>
                        )}
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Bottom action bar */}
      {questions.length > 0 && (
        <div
          className="py-5 sticky bottom-0 flex flex-col-reverse sm:flex-row sm:justify-between gap-3 backdrop-blur-xl mt-8 animate-fade-up -mx-4 md:-mx-8 px-4 md:px-8"
          style={{ backgroundColor: 'var(--color-backdrop-bg)' }}
        >
          <div className="flex gap-3">
            <Button
              className="flex-1 sm:flex-none"
              variant={'outlined'}
              disabled={currentQuestionIndex === 0}
              onClick={() => {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              }}
            >
              Назад
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              variant={showResultsButton ? 'outlined' : 'primary'}
              disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
              }}
            >
              Вперёд
            </Button>
          </div>
          {/* Когда все вопросы отвечены, главное действие — результаты;
              раньше третья кнопка вылезала за экран на телефоне. */}
          {showResultsButton && (
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                router.push('/results');
              }}
            >
              Показать результаты
            </Button>
          )}
        </div>
      )}

      {/* Футер с автором и ссылками в тесте только отвлекает — он есть
          на главной и на результатах. */}

      {lightboxIndex !== null && currentQuestion?.images && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <img
            src={currentQuestion.images[lightboxIndex]}
            alt="Увеличенное изображение"
            className="max-w-full max-h-[80vh] rounded-xl object-contain cursor-zoom-out"
            onClick={() => setLightboxIndex(null)}
          />
          {currentQuestion.images.length > 1 && (
            <div
              className="flex gap-2 mt-4"
              onClick={(e) => e.stopPropagation()}
            >
              {currentQuestion.images.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Миниатюра ${index + 1}`}
                  className={
                    'h-16 w-20 object-cover rounded-lg border-2 cursor-pointer transition-all' +
                    (index === lightboxIndex
                      ? ' border-accent opacity-100'
                      : ' border-transparent opacity-50 hover:opacity-80')
                  }
                  onClick={() => setLightboxIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
