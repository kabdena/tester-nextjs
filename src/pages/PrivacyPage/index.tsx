'use client';

import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import { wipeAllData } from '@/utils/questionsStore';
import { reachGoal } from '@/utils/metrika';

const PrivacyPage = () => {
  const [state, setState] = useState<'idle' | 'confirm' | 'done'>('idle');

  const handleWipe = async () => {
    reachGoal('data_wiped');
    await wipeAllData();
    setState('done');
  };

  return (
    <div className="min-h-svh flex flex-col items-center p-4 sm:p-8">
      <div className="flex-1" />
      <div className="max-w-xl w-full">
        <h1 className="font-display text-2xl sm:text-4xl text-text-primary mb-6 text-center tracking-tight">
          Данные и приватность
        </h1>

        <div className="glass-card p-5 sm:p-8 space-y-5 text-sm sm:text-base text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-text-primary font-medium mb-1.5">
              Ваши файлы не покидают устройство
            </h2>
            <p>
              Файл .docx читается прямо в браузере. Мы не отправляем его на
              сервер, не храним у себя и никому не пересылаем. Вопросы, ответы,
              история попыток и ошибки сохраняются только в памяти браузера на
              этом устройстве.
            </p>
          </section>

          <section>
            <h2 className="text-text-primary font-medium mb-1.5">
              Что это значит для вас
            </h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>
                На другом телефоне или в другом браузере ваших файлов и истории
                не будет.
              </li>
              <li>Если очистить данные браузера, всё сохранённое пропадёт.</li>
              <li>
                На iPhone Safari может удалить данные сайта, если не заходить на
                него больше недели. Чтобы этого не случилось, добавьте тестер на
                экран «Домой»: «Поделиться» → «На экран „Домой“».
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-text-primary font-medium mb-1.5">
              Статистика посещений
            </h2>
            <p>
              Мы пользуемся Яндекс Метрикой, чтобы понимать, сколько людей
              заходит на сайт и какими функциями пользуются. Метрика получает
              обезличенные данные о визите (страницы, устройство, город) и
              события вроде «тест начат». Содержимое ваших файлов, вопросы и
              ответы в Метрику не передаются, запись экрана (Вебвизор) не
              включена.
            </p>
          </section>

          <section className="pt-2 border-t border-border-subtle">
            <h2 className="text-text-primary font-medium mb-1.5">
              Стереть всё на этом устройстве
            </h2>
            <p className="mb-4">
              Удалит загруженные файлы, текущий тест, историю попыток и ошибки.
              Пригодится на чужом или общем компьютере.
            </p>
            {state === 'idle' && (
              <Button
                variant={'errorOutlined'}
                size={'small'}
                onClick={() => setState('confirm')}
              >
                Стереть все данные
              </Button>
            )}
            {state === 'confirm' && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-error text-sm">
                  Точно стереть? Отменить нельзя.
                </span>
                <Button
                  variant={'errorOutlined'}
                  size={'small'}
                  onClick={handleWipe}
                >
                  Да, стереть
                </Button>
                <Button
                  variant={'outlined'}
                  size={'small'}
                  onClick={() => setState('idle')}
                >
                  Отмена
                </Button>
              </div>
            )}
            {state === 'done' && (
              <p className="text-success text-sm">
                Готово: данные тестера на этом устройстве удалены.
              </p>
            )}
          </section>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-accent transition-colors"
          >
            ← На главную
          </Link>
        </div>
      </div>
      <div className="flex-1" />
      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </div>
  );
};

export default PrivacyPage;
