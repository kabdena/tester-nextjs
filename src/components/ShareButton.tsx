'use client';

import { useState } from 'react';
import { reachGoal } from '@/utils/metrika';

const SHARE_TITLE = 'Тестер для Platonus';
// Готовое сообщение для чата группы: что это и что сделать.
const SHARE_TEXT =
  'Тренажёр для подготовки к Platonus: загружаешь наш файл с вопросами (.docx) и прорешиваешь тест, ошибки потом можно отработать отдельно. Бесплатно, без регистрации, файл никуда не отправляется.';

// compact — короткая подпись для тесных мест (страница результатов).
const ShareButton = ({ compact = false }: { compact?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/?ref=share`;

    reachGoal('share');

    if (navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
        return;
      } catch {
        // пользователь отменил шэринг или он недоступен — падаем в копирование
      }
    }

    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard недоступен (нет https / старый браузер) — тихо игнорируем
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-text-muted hover:text-accent transition-colors duration-200"
    >
      {copied ? (
        <svg
          className="size-4 text-success"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
      {copied
        ? 'Скопировано'
        : compact
          ? 'В чат группы'
          : 'Отправить в чат группы'}
    </button>
  );
};

export default ShareButton;
