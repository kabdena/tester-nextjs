'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import mammoth from 'mammoth';
import Link from 'next/link';
import { getEndOfTheWord } from '@/utils/utils';
import { reachGoal } from '@/utils/metrika';
import {
  loadUploadedFiles,
  saveQuestions,
  saveUploadedFiles,
} from '@/utils/questionsStore';
import { resetProgress } from '@/utils/quizProgress';
import { parseSourceHtml } from '@/utils/convertTest';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

type Question = {
  question: string;
  type: string;
  variants: Variant[];
  images: string[];
};

type Variant = {
  text: string;
  correct: boolean;
};

// Файл в списке «Загруженные файлы» вместе со своими вопросами — так удаление
// файла убирает именно его вопросы, а список переживает перезагрузку.
type TestFile = {
  name: string;
  questions: Question[];
  // распознан не в формате тестера, а автоматически «нумерованным» парсером
  autoConverted?: boolean;
};

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const UploadTest: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [suggestConverter, setSuggestConverter] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [isRestored, setIsRestored] = useState(false);
  const [questionsCountPerTest, setQuestionsCountPerTest] = useState('100');

  // Подтягиваем файлы, загруженные в прошлый раз.
  useEffect(() => {
    loadUploadedFiles<TestFile>()
      .then((files) => {
        if (files.length > 0) {
          setTestFiles(files);
          reachGoal('uploaded_files_restored');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsRestored(true));
  }, []);

  useEffect(() => {
    if (!isRestored) return;
    saveUploadedFiles(testFiles).catch((err) => console.error(err));
  }, [isRestored, testFiles]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    setIsLoading(true);
    setError(null);
    setNotice(null);
    setSuggestConverter(false);

    if (file && file.type === DOCX_MIME) {
      try {
        if (testFiles.some((testFile) => testFile.name === file.name)) {
          setError('Этот тест вы уже загружали');
          reachGoal('upload_duplicate');
          return;
        }

        if (process.env.NODE_ENV !== 'development') {
          const fd = new FormData();
          fd.append('file', file);

          await fetch('/api/upload', {
            method: 'POST',
            body: fd,
          });
        }

        const content = await readDocxFile(file);
        let parsedQuestions = parseQuestions(content);
        let autoConverted = false;

        // Нет тегов <question>/<variant> — пробуем «нумерованный» формат
        // (вопросы 1., 2., …, правильный ответ жирным или с «+»), как в конвертере.
        if (parsedQuestions.length === 0) {
          const { questions: converted, warnings } = parseSourceHtml(content);
          if (converted.length > 0) {
            parsedQuestions = converted.map((q) => ({
              ...q,
              type: 'question',
            }));
            autoConverted = true;
            reachGoal('upload_auto_converted');
            setNotice(
              `Файл не в формате тестера — распознали ${converted.length} ${getEndOfTheWord(
                converted.length,
                ['вопрос', 'вопроса', 'вопросов'],
              )} автоматически.` +
                (warnings.questionsWithoutCorrect > 0
                  ? ` Без отметки правильного ответа: ${warnings.questionsWithoutCorrect}.`
                  : ''),
            );
          }
        }

        if (parsedQuestions.length === 0) {
          setError(
            'В файле не найдено ни одного вопроса в формате тестера (теги <question> и <variant> в начале строки).',
          );
          setSuggestConverter(true);
          reachGoal('upload_empty');
          return;
        }

        setTestFiles((prevState) => [
          ...prevState,
          { name: file.name, questions: parsedQuestions, autoConverted },
        ]);
      } catch (err) {
        console.error(err);
        setError(
          'Не удалось разобрать .docx файл. Пожалуйста, проверьте формат файла.',
        );
        reachGoal('upload_parse_error');
      } finally {
        setIsLoading(false);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    } else {
      setIsLoading(false);
      setError('Пожалуйста, загрузите действительный файл .docx.');
      reachGoal('upload_invalid_format');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const startTest = async () => {
    if (testFiles.length === 0) {
      setError('Сначала загрузите тест');
      reachGoal('start_without_test');
      return;
    }

    if (!Number.isInteger(+questionsCountPerTest)) {
      setError('Введите число в поле "Количество вопросов в тесте"');
      return;
    }

    if (+questionsCountPerTest <= 1) {
      setError('"Количество вопросов в тесте" должно быть больше 1');
      return;
    }

    const allQuestions = testFiles.flatMap((testFile) => testFile.questions);
    const preparedQuestions = shuffleArray(allQuestions)
      .map((q) => ({
        ...q,
        variants: shuffleArray(q.variants),
      }))
      .slice(0, Math.max(1, +questionsCountPerTest));

    try {
      await saveQuestions(preparedQuestions);
    } catch (err) {
      console.error(err);
      setError(
        'Не удалось сохранить тест. Попробуйте уменьшить количество картинок.',
      );
      return;
    }
    resetProgress();
    router.push('/quiz');
  };

  const readDocxFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          resolve(result.value);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const parseQuestions = (html: string): Question[] => {
    const questions: Question[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = doc.body.children;
    let currentQuestion: Question | null = null;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const text = el.textContent?.trim() || '';
      const images = Array.from(el.querySelectorAll('img'))
        .map((img) => img.getAttribute('src') || '')
        .filter(Boolean);

      if (text.startsWith('<question3>')) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          question: text.replace('<question3>', ''),
          type: 'question3',
          variants: [],
          images,
        };
      } else if (text.startsWith('<question2>')) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          question: text.replace('<question2>', ''),
          type: 'question2',
          variants: [],
          images,
        };
      } else if (text.startsWith('<question>')) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          question: text.replace('<question>', ''),
          type: 'question',
          variants: [],
          images,
        };
      } else if (text.startsWith('<variant>') && currentQuestion) {
        currentQuestion.variants.push({
          text: text.replace('<variant>', '').replace(/\+$/, '').trim(),
          correct: currentQuestion.variants.length === 0,
        });
      } else if (currentQuestion && images.length > 0) {
        currentQuestion.images.push(...images);
      }
    }

    if (currentQuestion) questions.push(currentQuestion);

    return questions;
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    return array
      .map((item) => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ item }) => item);
  };

  const allTestFilesQuestionCount = useMemo(() => {
    return testFiles.reduce((acc, curr) => {
      return acc + curr.questions.length;
    }, 0);
  }, [testFiles]);

  const hasFiles = testFiles.length > 0;

  const handleDeleteTestFile = (index: number) => {
    setNotice(null);
    setTestFiles((prevState) => [
      ...prevState.filter((_, fileIndex) => fileIndex !== index),
    ]);
  };

  return (
    <>
      {error && (
        <div className="glass-card border-error-border! bg-error-bg! text-error text-sm text-center mb-6 py-3 px-4 animate-scale-in">
          {error}
          {suggestConverter && (
            <div className="mt-2 text-text-secondary">
              Похоже, тест в другом формате (вопросы 1., 2., … и варианты
              списком).{' '}
              <Link
                href="/convert"
                onClick={() => reachGoal('convert_hint_click')}
                className="text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
              >
                Попробуйте конвертер
              </Link>
              .
            </div>
          )}
        </div>
      )}

      {notice && (
        <div className="glass-card border-success-border! bg-success-bg! text-success text-sm text-center mb-6 py-3 px-4 animate-scale-in">
          {notice}
        </div>
      )}

      <div className="flex gap-3 flex-wrap justify-center">
        {/* Пока файла нет, главная кнопка — загрузка, а «Начать тест» неактивна:
            раньше почти каждый четвёртый визит жал «Начать» без файла. */}
        <Button
          variant={hasFiles ? 'outlined' : 'primary'}
          disabled={isLoading || !isRestored}
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          {isLoading
            ? 'Загружаем…'
            : hasFiles
              ? 'Загрузить еще'
              : 'Загрузить тест'}
        </Button>
        <Button
          variant={hasFiles ? 'primary' : 'outlined'}
          disabled={!hasFiles || isLoading}
          title={hasFiles ? undefined : 'Сначала загрузите файл с тестом'}
          onClick={startTest}
        >
          Начать тест
        </Button>
        <input
          ref={inputRef}
          id="file-upload"
          type="file"
          accept=".docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {isRestored && !hasFiles && (
        <p className="text-xs text-text-muted mt-3">
          Сначала загрузите файл .docx с вопросами — затем станет доступна
          кнопка «Начать тест»
        </p>
      )}

      {/* Question count input — only after a test is uploaded */}
      {hasFiles && (
        <div className="flex flex-col items-center gap-1.5 mt-4 animate-fade-up">
          <div className="flex gap-2 items-center justify-center">
            <span className="text-xs text-text-muted">
              Сколько вопросов задать
            </span>
            <input
              className="bg-surface-raised border border-border-default rounded-lg w-14 py-1.5 text-xs text-center text-text-primary focus:border-accent transition-colors duration-200"
              inputMode="numeric"
              min={10}
              max={999}
              value={questionsCountPerTest}
              onChange={(e) => {
                setError('');
                setQuestionsCountPerTest(e.target.value);
              }}
            />
          </div>
          <span className="text-[11px] text-text-muted/80">
            Выберем случайно из {allTestFilesQuestionCount} загруженных
          </span>
        </div>
      )}

      {/* Uploaded files list */}
      {testFiles.length > 0 && (
        <div className="flex flex-col items-center gap-3 mt-8 animate-fade-up">
          <div className="flex flex-col items-center">
            <div className="text-sm text-text-secondary font-medium">
              Загруженные файлы:
            </div>
            {testFiles.length > 1 && (
              <div className="text-xs text-text-muted mt-1">
                ({testFiles.length}{' '}
                {getEndOfTheWord(testFiles.length, ['файл', 'файла', 'файлов'])}
                , {allTestFilesQuestionCount}{' '}
                {getEndOfTheWord(allTestFilesQuestionCount, [
                  'вопрос',
                  'вопроса',
                  'вопросов',
                ])}
                )
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap justify-center w-full">
            {testFiles.map((testFile, index) => (
              <div
                key={index}
                className="glass-card-raised group p-4 flex gap-4 items-center w-full sm:w-64 hover:border-border-accent transition-colors duration-300"
              >
                {/* File icon */}
                <div className="shrink-0 size-9 rounded-lg bg-accent-subtle flex items-center justify-center">
                  <svg
                    className="size-4 text-accent"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>

                <div className="flex-grow min-w-0 text-start">
                  <div
                    className="text-sm text-text-primary truncate"
                    title={testFile.name}
                  >
                    {testFile.name}
                  </div>
                  <div className="text-text-muted text-xs truncate">
                    {testFile.questions.length}{' '}
                    {getEndOfTheWord(testFile.questions.length, [
                      'вопрос',
                      'вопроса',
                      'вопросов',
                    ])}
                    {testFile.autoConverted && ' · распознан автоматически'}
                  </div>
                </div>

                {/* На телефоне hover нет — иконка удаления видна всегда */}
                <button
                  type="button"
                  onClick={() => handleDeleteTestFile(index)}
                  title={'Удалить тест'}
                  aria-label={`Удалить ${testFile.name}`}
                  className="shrink-0 p-2 -m-2 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <svg
                    className="size-4 text-error hover:text-error/80 transition-colors"
                    focusable="false"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM8 9h8v10H8zm7.5-5-1-1h-5l-1 1H5v2h14V4z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default UploadTest;
