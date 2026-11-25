'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const FormatHelp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center min-h-11 gap-1.5 text-sm text-text-muted hover:text-accent transition-colors duration-200"
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
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        В каком формате загружать тест?
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[85svh] overflow-y-auto p-6 sm:p-8 text-start animate-scale-in rounded-2xl border border-border-default bg-surface-raised shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Закрыть"
              className="absolute top-4 right-4 text-text-muted hover:text-error transition-colors duration-200 cursor-pointer"
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="font-display text-2xl text-text-primary mb-1 pr-8">
              Требования к файлу теста
            </h2>
            <p className="text-sm text-text-muted mb-6">
              Шрифт и оформление не важны — программа читает только теги и
              структуру абзацев.
            </p>

            <div className="space-y-5 text-sm">
              <section>
                <h3 className="text-text-primary font-medium mb-1.5">
                  1. Формат файла
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Только <span className="text-accent">.docx</span> (Word
                  2007+). Старый <code>.doc</code>, PDF, скан или картинка не
                  читаются. Если файл <code>.doc</code> — откройте его в Word и
                  пересохраните как «Word Document (.docx)».
                </p>
              </section>

              <section>
                <h3 className="text-text-primary font-medium mb-1.5">
                  2. Структура
                </h3>
                <p className="text-text-secondary leading-relaxed mb-2">
                  Каждый вопрос и каждый вариант — с новой строки (абзаца), тег
                  стоит в самом начале строки:
                </p>
                <pre className="glass-card-raised p-3 text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap">
                  {`<question>Столица Казахстана?
<variant>Астана+
<variant>Алматы
<variant>Шымкент`}
                </pre>
                <ul className="mt-2 space-y-1 text-text-secondary leading-relaxed list-disc pl-5">
                  <li>
                    <code>&lt;question&gt;</code> — вопрос (также есть{' '}
                    <code>&lt;question2&gt;</code>, <code>&lt;question3&gt;</code>
                    ).
                  </li>
                  <li>
                    <code>&lt;variant&gt;</code> — вариант ответа. Правильным
                    считается первый <code>&lt;variant&gt;</code> после вопроса
                    (можно пометить знаком <code>+</code> в конце).
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-text-primary font-medium mb-1.5">
                  3. Частые ошибки
                </h3>
                <ul className="space-y-1 text-text-secondary leading-relaxed list-disc pl-5">
                  <li>
                    Вопросы и ответы внутри таблицы — нужно вынести в обычные
                    абзацы.
                  </li>
                  <li>Несколько вопросов или вариантов в одном абзаце.</li>
                  <li>
                    Перед тегом стоит пробел или другой символ — строка должна
                    начинаться ровно с <code>&lt;question&gt;</code> или{' '}
                    <code>&lt;variant&gt;</code>.
                  </li>
                  <li>
                    Тег написан неверно (например <code>(question)</code>,{' '}
                    <code>&lt; question &gt;</code>).
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-text-primary font-medium mb-1.5">
                  4. Картинки
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  Можно вставить изображение в абзац вопроса — оно отобразится
                  вместе с вопросом.
                </p>
              </section>
            </div>
          </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default FormatHelp;