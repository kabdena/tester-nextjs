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
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };

  const parseQuestions = (text: string): Question[] => {
    const questions: Question[] = [];
    const blocks = text.split('\n').map((line) => line.trim());
    let currentQuestion: Question | null = null;

    blocks.forEach((line) => {
      if (line.startsWith('<question>')) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          question: line.replace('<question>', ''),
          type: 'question',
          variants: [],
        };
      } else if (line.startsWith('<question2>')) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          question: line.replace('<question2>', ''),
          type: 'question2',
          variants: [],
        };
      } else if (line.startsWith('<question3>')) {
        if (currentQuestion) questions.push(currentQuestion);
        currentQuestion = {
          question: line.replace('<question3>', ''),
          type: 'question3',
          variants: [],
        };
      } else if (line.startsWith('<variant>')) {
        if (currentQuestion) {
          currentQuestion.variants.push({
            text: line.replace('<variant>', '').replace(/\+$/, '').trim(),
            correct: currentQuestion.variants.length === 0, // Первый вариант - правильный
          });
        }
      }
    });

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
        <p className="text-red-500 text-sm sm:text-base text-center mb-4">
          {error}
        </p>
      )}
      <div className="flex gap-2 flex-wrap justify-center">
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
      <div className={'flex gap-1 mt-2.5 items-center justify-center'}>
        <div className={'text-xs text-gray-400'}>
          Количество вопросов в тесте
        </div>
        <input
          className={
            'border-b border-gray-200 w-10 py-0.5 text-xs text-center text-gray-700'
          }
          min={10}
          max={999}
          value={questionsCountPerTest}
          onChange={(e) => {
            setError('');
            setQuestionsCountPerTest(e.target.value);
          }}
        />
      </div>
      {testFiles.length > 0 && (
        <div className={'flex flex-col items-center gap-2 mt-8'}>
          <div className={'flex flex-col'}>
            <div className={'text-sm'}>Загруженные файлы:</div>
            {testFiles.length > 1 && (
              <div className={'text-xs text-gray-500 mb-2'}>
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
          <div className={'flex gap-2 flex-wrap justify-center w-full'}>
            {testFiles.map((testFile, index) => (
              <div
                key={index}
                className={
                  'relative border border-gray-200 rounded-lg p-4 flex gap-4 items-center w-full sm:w-60'
                }
              >
                <div className={'flex-grow text-start truncate'}>
                  <div className={'text-sm truncate'} title={testFile.name}>
                    {testFile.name}
                  </div>
                  <div className={'text-gray-500 text-xs truncate'}>
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
                >
                  <svg
                    className="size-5 text-red-500 cursor-pointer"
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
