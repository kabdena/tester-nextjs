import type { Metadata } from 'next';
import PrivacyPage from '@/pages/PrivacyPage';

export const metadata: Metadata = {
  title: 'Данные и приватность',
  description:
    'Тестер для Platonus не отправляет ваши файлы на сервер: вопросы, ответы и история хранятся только в браузере на вашем устройстве.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return <PrivacyPage />;
}
