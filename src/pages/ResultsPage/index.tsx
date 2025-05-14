'use client';

import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Index = () => {
  const [results, setResults] = useState<boolean[]>([]);

  useEffect(() => {
    setResults(JSON.parse(localStorage.getItem('results') || '[]'));
  }, []);

  const correctAnswers = results.filter((res) => res).length;
  const totalQuestions = results.length;
  const router = useRouter();

  return (
    <div className="min-h-svh flex items-center justify-center  p-4">
      <div className="p-6 sm:p-8 md:p-12 max-w-sm sm:max-w-md md:max-w-lg w-full text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-6 text-center">
          Результаты теста
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-4 text-center">
          Вы правильно ответили на{' '}
          <span className="font-bold text-green-600">{correctAnswers}</span> из{' '}
          <span className="font-bold text-blue-600">{totalQuestions}</span>{' '}
          вопросов.
        </p>
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div
            className="absolute top-0 left-0 h-full bg-green-500 transition-all"
            style={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
          ></div>
        </div>
        <Button onClick={() => router.push('/')}>Перейти на главную</Button>
      </div>
    </div>
  );
};

export default Index;
