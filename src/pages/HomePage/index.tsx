'use client';

import { useEffect } from 'react';
import UploadTest from '@/components/UploadTest';
import Footer from '@/components/Footer';

const HomePage = () => {
  useEffect(() => {
    localStorage.setItem('results', JSON.stringify([]));
  }, []);

  return (
    <div className="min-h-svh flex flex-col items-center p-4 sm:p-8">
      <div className="flex-1" />
      <div className="text-center max-w-xl w-full">
        {/* Decorative accent line */}
        <div className="flex items-center justify-center gap-3 mb-8 animate-fade-up">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent/40" />
          <div className="size-1.5 rounded-full bg-accent/60" />
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent/40" />
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-text-primary mb-4 animate-fade-up delay-1 tracking-tight">
          Тестер для Platonus
        </h1>

        <p className="text-base sm:text-lg text-text-secondary mb-10 animate-fade-up delay-2 leading-relaxed">
          Проверьте свои знания, загрузив тест и ответив на вопросы.
        </p>

        <div className="animate-fade-up delay-3">
          <UploadTest />
        </div>
      </div>

      <div className="flex-1" />
      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
