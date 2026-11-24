'use client';

import { useEffect, useState } from 'react';
import { getInAppBrowser, isIOS, isStandalone } from '@/utils/env';
import { reachGoal } from '@/utils/metrika';

const DISMISSED_KEY = 'a2hsHintDismissed';

// Подсказка для iPhone/iPad в Safari: Safari стирает данные сайта после 7 дней
// без визитов, а сайт на экране «Домой» под это правило не попадает.
// Показывается после завершённого теста, пока её не закроют.
const AddToHomeHint = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return;
    } catch {
      return;
    }
    // Во встроенном браузере Telegram/Instagram пункта «На экран Домой» нет.
    if (!isIOS() || isStandalone() || getInAppBrowser() !== 'none') return;
    setVisible(true);
    reachGoal('a2hs_hint_shown');
  }, []);

  if (!visible) return null;

  const close = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // не запомнится — покажем ещё раз, не страшно
    }
    reachGoal('a2hs_hint_closed');
    setVisible(false);
  };

  return (
    <div className="glass-card-raised border-accent/30! p-4 text-start text-sm text-text-secondary relative animate-fade-up">
      <button
        type="button"
        onClick={close}
        aria-label="Закрыть подсказку"
        className="absolute top-2 right-2 p-2 text-text-muted hover:text-text-primary"
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div className="text-text-primary font-medium mb-1 pe-6">
        Чтобы файлы и история не пропали
      </div>
      Safari удаляет данные сайтов, на которые не заходили неделю. Добавьте
      тестер на экран «Домой»: нажмите{' '}
      <svg
        className="inline size-4 -mt-1 text-accent"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Поделиться"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>{' '}
      «Поделиться» → «На экран „Домой“».
    </div>
  );
};

export default AddToHomeHint;
