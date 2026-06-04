import type { Metadata } from 'next';
import ConvertPage from '@/pages/ConvertPage';

const TITLE = 'Конвертер тестов в формат тестера';
const DESCRIPTION =
  'Конвертируйте тест из «нумерованного» формата (вопросы 1., 2., … и варианты списком, правильный ответ жирным или со знаком +) в формат тестера .docx. Можно сразу начать прохождение или скачать готовый файл.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'конвертер тестов',
    'конвертировать тест platonus',
    'преобразовать тест в docx',
    'формат тестера',
    'тест из нумерованного формата',
    'platonus тест конвертер',
  ],
  alternates: {
    canonical: '/convert',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: '/convert',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function Convert() {
  return <ConvertPage />;
}
