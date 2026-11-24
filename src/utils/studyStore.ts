// Локальная история обучения: попытки и статус каждого вопроса.
// Хранится только в IndexedDB этого устройства (см. docs/specs/001-local-profile).

import {
  idbGet,
  idbSet,
  loadQuestions,
  loadUploadedFiles,
  saveQuestions,
} from '@/utils/questionsStore';
import { withQuestionIds } from '@/utils/ids';
import {
  getAnswerResults,
  loadProgress,
  saveProgress,
  startAttempt,
  type QuizMode,
} from '@/utils/quizProgress';

const ATTEMPTS_KEY = 'attempts';
const QUESTION_STATS_KEY = 'questionStats';
// Хранить не больше стольких попыток — старые отбрасываем.
const MAX_ATTEMPTS = 300;
// «Знаю» = столько верных ответов подряд.
export const KNOWN_STREAK = 2;

export type StudyVariant = { text: string; correct: boolean };

export type StudyQuestion = {
  id?: string;
  fileId?: string;
  question: string;
  type: string;
  variants: StudyVariant[];
  images?: string[];
};

export type UploadedFile = {
  name: string;
  fileId?: string;
  questions: StudyQuestion[];
  autoConverted?: boolean;
  addedAt?: number;
};

export type Attempt = {
  id: string;
  mode: QuizMode;
  startedAt: number;
  finishedAt: number;
  fileIds: string[];
  total: number;
  answered: number;
  correct: number;
  elapsedSeconds: number;
};

export type QuestionStat = {
  seen: number;
  lastCorrect: boolean;
  correctStreak: number;
  updatedAt: number;
};

export type QuestionStats = Record<string, QuestionStat>;

export const loadAttempts = async (): Promise<Attempt[]> =>
  (await idbGet<Attempt[]>(ATTEMPTS_KEY)) ?? [];

export const loadQuestionStats = async (): Promise<QuestionStats> =>
  (await idbGet<QuestionStats>(QUESTION_STATS_KEY)) ?? {};

/**
 * Записывает завершённую попытку в историю (вызывается на странице результатов).
 * Статистика вопросов обновляется один раз за попытку; запись о попытке —
 * перезаписывается, если человек вернулся в тест и ответил ещё.
 * Возвращает true, если что-то записано.
 */
export const recordCurrentAttempt = async (
  questions: StudyQuestion[],
): Promise<boolean> => {
  const progress = loadProgress();
  const answeredCount = Object.keys(progress.selectedAnswers).length;
  if (questions.length === 0 || answeredCount === 0) return false;

  const withIds = await withQuestionIds(questions);
  const results = getAnswerResults(withIds, progress.selectedAnswers);
  const now = Date.now();
  const attemptId = progress.attemptId ?? `legacy-${now}`;

  const attempt: Attempt = {
    id: attemptId,
    mode: progress.mode ?? 'normal',
    startedAt:
      progress.startedAt ?? now - (progress.elapsedSeconds || 0) * 1000,
    finishedAt: now,
    fileIds: Array.from(
      new Set(withIds.map((q) => q.fileId).filter((id): id is string => !!id)),
    ),
    total: withIds.length,
    answered: results.filter((r) => r !== undefined).length,
    correct: results.filter((r) => r === true).length,
    elapsedSeconds: progress.elapsedSeconds,
  };

  const attempts = await loadAttempts();
  const nextAttempts = [
    ...attempts.filter((a) => a.id !== attemptId),
    attempt,
  ].slice(-MAX_ATTEMPTS);
  await idbSet(ATTEMPTS_KEY, nextAttempts);

  if (!progress.recordedAt) {
    const stats = await loadQuestionStats();
    withIds.forEach((q, i) => {
      const result = results[i];
      if (result === undefined || !q.id) return;
      const prev = stats[q.id];
      stats[q.id] = {
        seen: (prev?.seen ?? 0) + 1,
        lastCorrect: result,
        correctStreak: result ? (prev?.correctStreak ?? 0) + 1 : 0,
        updatedAt: now,
      };
    });
    await idbSet(QUESTION_STATS_KEY, stats);
  }

  saveProgress({ attemptId, recordedAt: progress.recordedAt ?? now });
  return true;
};

// Все известные вопросы: загруженные файлы + текущий набор теста
// (тест мог быть запущен из конвертера), без дублей по id.
const loadAllKnownQuestions = async (): Promise<StudyQuestion[]> => {
  const [files, current] = await Promise.all([
    loadUploadedFiles<UploadedFile>(),
    loadQuestions<StudyQuestion>(),
  ]);
  const all = await withQuestionIds([
    ...files.flatMap((f) => f.questions),
    ...current,
  ]);
  const seen = new Set<string>();
  return all.filter((q) => {
    if (!q.id || seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
};

// Вопросы, на которые в последний раз ответили неверно.
export const loadMistakeQuestions = async (): Promise<StudyQuestion[]> => {
  const [questions, stats] = await Promise.all([
    loadAllKnownQuestions(),
    loadQuestionStats(),
  ]);
  return questions.filter((q) => q.id && stats[q.id]?.lastCorrect === false);
};

export type FileStudyStats = {
  attempts: number;
  bestPercent: number | null;
  lastPercent: number | null;
  known: number;
  mistakes: number;
  unseen: number;
};

const percent = (a: Attempt) =>
  a.answered > 0 ? Math.round((a.correct / a.answered) * 100) : 0;

export const getFileStudyStats = (
  file: UploadedFile,
  attempts: Attempt[],
  stats: QuestionStats,
): FileStudyStats => {
  const fileAttempts = file.fileId
    ? attempts.filter((a) => a.fileIds.includes(file.fileId!))
    : [];
  let known = 0;
  let mistakes = 0;
  let unseen = 0;
  file.questions.forEach((q) => {
    const stat = q.id ? stats[q.id] : undefined;
    if (!stat) unseen += 1;
    else if (!stat.lastCorrect) mistakes += 1;
    else if (stat.correctStreak >= KNOWN_STREAK) known += 1;
  });
  return {
    attempts: fileAttempts.length,
    bestPercent: fileAttempts.length
      ? Math.max(...fileAttempts.map(percent))
      : null,
    lastPercent: fileAttempts.length
      ? percent(fileAttempts[fileAttempts.length - 1])
      : null,
    known,
    mistakes,
    unseen,
  };
};

const shuffle = <T>(array: T[]): T[] =>
  array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);

/**
 * Готовит и сохраняет набор вопросов для теста и начинает новую попытку.
 * Перемешивает вопросы и варианты, берёт не больше `count`.
 */
export const prepareTest = async (
  questions: StudyQuestion[],
  { count, mode = 'normal' }: { count?: number; mode?: QuizMode } = {},
): Promise<void> => {
  const withIds = await withQuestionIds(questions);
  const prepared = shuffle(withIds)
    .map((q) => ({ ...q, variants: shuffle(q.variants) }))
    .slice(0, count ? Math.max(1, count) : undefined);
  await saveQuestions(prepared);
  startAttempt(mode);
};
