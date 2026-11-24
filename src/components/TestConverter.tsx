'use client';

import React, { useMemo, useRef, useState } from 'react';
import mammoth from 'mammoth';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { reachGoal } from '@/utils/metrika';
import {
  parseSourceHtml,
  buildTesterDocx,
  type ConvertQuestion,
} from '@/utils/convertTest';
import { getFileId, withQuestionIds } from '@/utils/ids';
import { prepareTest } from '@/utils/studyStore';
import { getEndOfTheWord } from '@/utils/utils';

const WORD_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type StoredQuestion = ConvertQuestion & {
  type: string;
  id?: string;
  fileId?: string;
};

type TestFile = {
  name: string;
  questionsCount: number;
  tablesFound: number;
  questionsWithoutCorrect: number;
};

const readDocxFile = async (arrayBuffer: ArrayBuffer): Promise<string> =>
  (await mammoth.convertToHtml({ arrayBuffer })).value;

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const TestConverter: React.FC = () => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [questions, setQuestions] = useState<StoredQuestion[]>([]);
  const [questionsCountPerTest, setQuestionsCountPerTest] = useState('100');

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    setIsLoading(true);
    setError(null);

    if (!file || file.type !== WORD_MIME) {
      setIsLoading(false);
      setError('Пожалуйста, загрузите действительный файл .docx.');
      reachGoal('convert_invalid_format');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (testFiles.some((f) => f.name === file.name)) {
      setIsLoading(false);
      setError('Этот файл вы уже добавили');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileId = await getFileId(arrayBuffer);
      const html = await readDocxFile(arrayBuffer);
      const { questions: parsed, warnings } = parseSourceHtml(html);

      if (parsed.length === 0) {
        setError(
          'Не удалось распознать ни одного вопроса. Убедитесь, что вопросы пронумерованы (1., 2., …), а варианты идут списком под ними.',
        );
        reachGoal('convert_empty');
        return;
      }

      // ID те же, что и при загрузке на главной, — история попыток общая.
      const stored = await withQuestionIds<StoredQuestion>(
        parsed.map((q) => ({ ...q, type: 'question' })),
        { fileId },
      );

      setTestFiles((prev) => [
        ...prev,
        {
          name: file.name,
          questionsCount: parsed.length,
          tablesFound: warnings.tablesFound,
          questionsWithoutCorrect: warnings.questionsWithoutCorrect,
        },
      ]);
      setQuestions((prev) => [...prev, ...stored]);
      reachGoal('convert_success');
    } catch (err) {
      console.error(err);
      setError(
        'Не удалось разобрать .docx файл. Пожалуйста, проверьте формат файла.',
      );
      reachGoal('convert_error');
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const startTest = async () => {
    if (questions.length === 0) {
      setError('Сначала добавьте хотя бы один файл');
      return;
    }
    if (!Number.isInteger(+questionsCountPerTest)) {
      setError('Введите число в поле «Сколько вопросов задать»');
      return;
    }
    if (+questionsCountPerTest <= 1) {
      setError('«Сколько вопросов задать» должно быть больше 1');
      return;
    }

    try {
      await prepareTest(questions, { count: +questionsCountPerTest });
    } catch (err) {
      console.error(err);
      setError(
        'Не удалось сохранить тест. Попробуйте уменьшить количество картинок.',
      );
      return;
    }
    reachGoal('convert_start_test');
    router.push('/quiz');
  };

  const downloadDocx = async () => {
    if (questions.length === 0) {
      setError('Сначала добавьте хотя бы один файл');
      return;
    }
    setIsDownloading(true);
    try {
      const blob = await buildTesterDocx(questions);
      const name =
        testFiles.length === 1
          ? `${testFiles[0].name.replace(/\.docx$/i, '')} (тестер).docx`
          : 'Тест (тестер).docx';
      downloadBlob(blob, name);
      reachGoal('convert_download');
    } catch (err) {
      console.error(err);
      setError('Не удалось сформировать файл.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteTestFile = (index: number) => {
    const removed = testFiles[index];
    reachGoal('convert_delete_file');
    setTestFiles((prev) => prev.filter((_, i) => i !== index));
    if (removed) {
      // Удаляем ровно столько вопросов, сколько добавил этот файл.
      setQuestions((prev) => {
        const before = testFiles
          .slice(0, index)
          .reduce((acc, f) => acc + f.questionsCount, 0);
        return [
          ...prev.slice(0, before),
          ...prev.slice(before + removed.questionsCount),
        ];
      });
    }
  };

  const totalQuestions = useMemo(
    () => testFiles.reduce((acc, f) => acc + f.questionsCount, 0),
    [testFiles],
  );
  const totalTables = useMemo(
    () => testFiles.reduce((acc, f) => acc + f.tablesFound, 0),
    [testFiles],
  );
  const totalWithoutCorrect = useMemo(
    () => testFiles.reduce((acc, f) => acc + f.questionsWithoutCorrect, 0),
    [testFiles],
  );

  return (
    <>
      {error && (
        <div className="glass-card border-error-border! bg-error-bg! text-error text-sm text-center mb-6 py-3 px-4 animate-scale-in">
          {error}
        </div>
      )}

      <div className="flex gap-3 flex-wrap justify-center">
        <Button
          variant={'outlined'}
          disabled={isLoading}
          onClick={() => inputRef.current?.click()}
        >
          {isLoading
            ? 'Обрабатываем…'
            : testFiles.length > 0
              ? 'Добавить ещё'
              : 'Выбрать .docx'}
        </Button>
        <Button onClick={startTest} disabled={isLoading}>
          Начать тест
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {testFiles.length > 0 && (
        <div className="flex flex-col items-center gap-1.5 mt-4 animate-fade-up">
          <div className="flex gap-2 items-center justify-center">
            <span className="text-xs text-text-muted">
              Сколько вопросов задать
            </span>
            <input
              className="bg-surface-raised border border-border-default rounded-lg w-14 py-1.5 text-xs text-center text-text-primary focus:border-accent transition-colors duration-200"
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
            Выберем случайно из {totalQuestions} распознанных
          </span>
        </div>
      )}

      {testFiles.length > 0 && (
        <div className="flex flex-col items-center gap-3 mt-8 animate-fade-up">
          <div className="flex flex-col items-center">
            <div className="text-sm text-text-secondary font-medium">
              Добавленные файлы:
            </div>
            {testFiles.length > 1 && (
              <div className="text-xs text-text-muted mt-1">
                ({testFiles.length}{' '}
                {getEndOfTheWord(testFiles.length, ['файл', 'файла', 'файлов'])}
                , {totalQuestions}{' '}
                {getEndOfTheWord(totalQuestions, [
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
                    {testFile.questionsCount}{' '}
                    {getEndOfTheWord(testFile.questionsCount, [
                      'вопрос',
                      'вопроса',
                      'вопросов',
                    ])}
                  </div>
                </div>

                <div
                  onClick={() => handleDeleteTestFile(index)}
                  title={'Удалить файл'}
                  className="shrink-0 p-2 -m-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
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
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={downloadDocx}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors duration-200 disabled:opacity-50 mt-1"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isDownloading
              ? 'Формируем файл…'
              : 'Скачать .docx в формате тестера'}
          </button>

          {(totalWithoutCorrect > 0 || totalTables > 0) && (
            <div className="text-[11px] text-text-muted/80 text-center max-w-sm leading-relaxed">
              {totalWithoutCorrect > 0 && (
                <span className="block text-error/80">
                  Без отметки правильного ответа: {totalWithoutCorrect}{' '}
                  {getEndOfTheWord(totalWithoutCorrect, [
                    'вопрос',
                    'вопроса',
                    'вопросов',
                  ])}
                  .
                </span>
              )}
              {totalTables > 0 && (
                <span className="block">
                  Найдено таблиц: {totalTables} — их содержимое не
                  конвертируется.
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TestConverter;
