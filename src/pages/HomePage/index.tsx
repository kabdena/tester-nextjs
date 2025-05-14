'use client';

import { useEffect } from 'react';
import UploadTest from '@/components/UploadTest';

const HomePage = () => {
  useEffect(() => {
    localStorage.setItem('results', JSON.stringify([]));
  }, []);

  return (
    <div className="min-h-svh flex flex-col justify-center p-4">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          Тестер для Platonus
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8">
          Проверьте свои знания, загрузив тест и ответив на вопросы.
        </p>
        <UploadTest />
      </div>
    </div>
  );
};

export default HomePage;
