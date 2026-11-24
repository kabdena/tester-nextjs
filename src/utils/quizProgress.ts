// Прогресс прохождения теста в localStorage: текущий вопрос, выбранные ответы
// и прошедшее время. Нужен, чтобы перезагрузка вкладки или возврат к ней на
// телефоне (браузер выгружает фоновые вкладки) не сбрасывал тест на начало.

const PROGRESS_KEY = 'quizProgress';
// Старые ключи — до появления quizProgress.
const LEGACY_KEYS = ['results', 'selectedAnswers'];

export type QuizMode = 'normal' | 'mistakes';

export type QuizProgress = {
  currentQuestionIndex: number;
  // индекс вопроса → индекс выбранного варианта
  selectedAnswers: Record<number, number>;
  elapsedSeconds: number;
  // Метаданные попытки — для истории попыток (studyStore).
  attemptId?: string;
  startedAt?: number;
  mode?: QuizMode;
  // попытка уже записана в историю — не записывать статистику повторно
  recordedAt?: number;
};

const EMPTY_PROGRESS: QuizProgress = {
  currentQuestionIndex: 0,
  selectedAnswers: {},
  elapsedSeconds: 0,
};

const randomId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const loadProgress = (): QuizProgress => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...EMPTY_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<QuizProgress>;
    return {
      ...parsed,
      currentQuestionIndex: Number(parsed.currentQuestionIndex) || 0,
      selectedAnswers: parsed.selectedAnswers ?? {},
      elapsedSeconds: Number(parsed.elapsedSeconds) || 0,
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
};

// Сливает переданные поля с сохранённым прогрессом, чтобы не терять
// метаданные попытки (attemptId, mode и т.д.).
export const saveProgress = (progress: Partial<QuizProgress>) => {
  try {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ ...loadProgress(), ...progress }),
    );
  } catch {
    // localStorage недоступен (приватный режим) — прогресс просто не сохранится
  }
};

export const resetProgress = () => {
  try {
    localStorage.removeItem(PROGRESS_KEY);
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // см. saveProgress
  }
};

// Начинает новую попытку: сбрасывает ответы и выдаёт новый attemptId.
export const startAttempt = (mode: QuizMode = 'normal') => {
  resetProgress();
  saveProgress({ attemptId: randomId(), startedAt: Date.now(), mode });
};

type AnswerableQuestion = { variants: { correct: boolean }[] };

// Результат по каждому вопросу: true/false для отвеченных, undefined — для пропущенных.
export const getAnswerResults = (
  questions: AnswerableQuestion[],
  selectedAnswers: Record<number, number>,
): (boolean | undefined)[] =>
  questions.map((q, i) => {
    const selected = selectedAnswers[i];
    if (selected === undefined) return undefined;
    return !!q.variants[selected]?.correct;
  });

export const formatElapsed = (totalSeconds: number): string => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0
    ? `${hrs}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;
};
