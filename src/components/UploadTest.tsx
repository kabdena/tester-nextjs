'use client';

import React, { useMemo, useRef, useState } from 'react';
import mammoth from 'mammoth';
import { getEndOfTheWord } from '@/utils/utils';
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

type TestFile = {
  name: string;
  questionsCount: number;
};

const UploadTest: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsCountPerTest, setQuestionsCountPerTest] = useState('100');

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    setIsLoading(true);

    if (
      file &&
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      try {
        if (process.env.NODE_ENV !== 'development') {
          const fd = new FormData();
          fd.append('file', file);

          await fetch('/api/upload', {
            method: 'POST',
            body: fd,
          });
        }

        const content = await readDocxFile(file);
        const parsedQuestions = parseQuestions(content);
        const testFileIsExists = testFiles.find(
          (testFile) => testFile.name === file.name,
        );

        if (testFileIsExists) {
          setError('Этот тест вы уже загружали');
          return;
        }

        setTestFiles((prevState) => [
          ...prevState,
          {
            name: file.name,
            questionsCount: parsedQuestions.length,
          },
        ]);
        setQuestions((prevState) => [...prevState, ...parsedQuestions]);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      } catch (err) {
        console.error(err);
        setError(
          'Не удалось разобрать .docx file. Пожалуйста, проверьте формат файла.',
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      setError('Пожалуйста, загрузите действительный файл .docx.');
    }
  };

  const startTest = () => {
    if (!Number.isInteger(+questionsCountPerTest)) {
      setError('Введите число в поле "Количество вопросов в тесте"');
      return;
    }

    if (+questionsCountPerTest <= 1) {
      setError('"Количество вопросов в тесте" должно быть больше 1');
      return;
    }

    const preparedQuestions = shuffleArray(questions)
      .map((q) => ({
        ...q,
        variants: shuffleArray(q.variants),
      }))
      .slice(0, Math.max(1, +questionsCountPerTest));

    localStorage.setItem('questions', JSON.stringify(preparedQuestions));
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
      return acc + curr.questionsCount;
    }, 0);
  }, [testFiles]);

  const handleDeleteTestFile = (index: number) => {
    setTestFiles((prevState) => [
      ...prevState.filter((_, fileIndex) => fileIndex !== index),
    ]);
  };

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
          onClick={() => {
            inputRef.current?.click();
          }}
        >
          {testFiles.length > 0 ? 'Загрузить еще' : 'Загрузить тест'}
        </Button>
        <Button disabled={testFiles.length === 0} onClick={startTest}>
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

      {/* Question count input */}
      <div className="flex gap-2 mt-4 items-center justify-center">
        <span className="text-xs text-text-muted">
          Количество вопросов в тесте
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
                  title={'Удалить тест'}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
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
        </div>
      )}
    </>
  );
};

export default UploadTest;
