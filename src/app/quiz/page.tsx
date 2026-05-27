import type { Metadata } from 'next';
import Index from '@/pages/QuizPage';

export const metadata: Metadata = {
  title: 'Прохождение теста',
  robots: { index: false, follow: false },
};

export default async function Page() {
  return <Index />;
}
