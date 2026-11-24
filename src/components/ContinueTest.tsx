'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadQuestions } from '@/utils/questionsStore';
import { loadProgress } from '@/utils/quizProgress';
import { reachGoal } from '@/utils/metrika';
import Button from '@/components/Button';

// Плашка «Продолжить тест» на главной: если тест начат и не доотвечен,
// предлагаем вернуться к нему с того же вопроса.
const ContinueTest = () => {
  const router = useRouter();
  const [state, setState] = useState<{
    answered: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    loadQuestions()
      .then((questions) => {
        const progress = loadProgress();
        const answered = Object.keys(progress.selectedAnswers).length;
        // recordedAt — тест уже завершён кнопкой «Завершить тест».
        if (
          !progress.recordedAt &&
          answered > 0 &&
          answered < questions.length
        ) {
          setState({ answered, total: questions.length });
        }
      })
      .catch(() => {
        // IndexedDB недоступна — плашку просто не показываем
      });
  }, []);

  if (!state) return null;

  return (
    <div className="glass-card-raised p-4 mb-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-between text-start animate-fade-up">
      <div className="min-w-0">
        <div className="text-sm text-text-primary font-medium">
          У вас есть незаконченный тест
        </div>
        <div className="text-xs text-text-muted">
          Отвечено {state.answered} из {state.total}
        </div>
      </div>
      <Button
        size={'small'}
        className="shrink-0 w-full sm:w-auto"
        onClick={() => {
          reachGoal('continue_test');
          router.push('/quiz');
        }}
      >
        Продолжить тест
      </Button>
    </div>
  );
};

export default ContinueTest;
