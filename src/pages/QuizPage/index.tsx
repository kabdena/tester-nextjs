'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

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

  return (
    <div className="min-h-svh flex flex-col !pt-0 p-4 md:p-8">
      <div
        className={
          'flex flex-wrap items-center justify-between gap-y-2 gap-x-8 mb-6 border-b border-gray-200 py-4 bg-white sticky top-0 z-10'
        }
      >
        <div>
          <span className={'text-gray-600'}>Время:</span> {countdown.mins}:
          {countdown.secs}
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
      <div className={'mb-6 flex flex-col gap-2'}>
        <div className={'text-gray-400 text-xs'}>
          Прокрутите для просмотра других вопросов {'<'} {'>'}
        </div>
        <div className={'flex items-center gap-2 overflow-x-auto'}>
          {questions.map((_, index) => (
            <div
              className={
                'py-1.5 px-3 rounded text-sm cursor-pointer hover:text-white hover:bg-blue-500 transition duration-300' +
                (currentQuestionIndex === index
                  ? ' text-white bg-blue-500'
                  : '') +
                (selectedAnswersByQuestion[index] !== undefined &&
                currentQuestionIndex !== index
                  ? ' bg-blue-500/50 text-white'
                  : '')
              }
              onClick={() => {
                setCurrentQuestionIndex(index);
              }}
              key={index}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>
      {currentQuestion && (
        <>
          <h2 className="text-lg sm:text-xl leading-snug font-semibold text-gray-700 mb-6">
            {currentQuestionIndex + 1}. {currentQuestion.question}
          </h2>
          <ul>
            {currentQuestion.variants.map((variant, index) => (
              <li
                key={index}
                className={`mb-4 border rounded-lg py-3 px-4 text-sm sm:text-base cursor-pointer 
                ${selectedAnswersByQuestion[currentQuestionIndex] === index ? 'border-blue-500' : 'border-gray-300'}
                ${
                  selectedAnswersByQuestion[currentQuestionIndex] !== undefined
                    ? variant.correct
                      ? 'bg-green-100 border-green-500'
                      : selectedAnswersByQuestion[currentQuestionIndex] ===
                          index
                        ? 'bg-red-100 border-red-500'
                        : ''
                    : ''
                }
              `}
                onClick={() =>
                  !selectedAnswersByQuestion[currentQuestionIndex] &&
                  handleAnswer(index, currentQuestionIndex)
                }
              >
                {variant.text}
              </li>
            ))}
          </ul>
        </>
      )}
      {(showNextQuestionButton || showResultsButton) && (
        <div className={'py-4 bg-white sticky bottom-0 flex gap-3'}>
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
      <div className={'mt-auto text-gray-400 text-xs'}>
        &copy; {new Date().getFullYear()}. Автор: Кабден Аян
      </div>
    </div>
  );
};

export default Index;
