import type { Metadata } from 'next';
import ResultsPage from '@/pages/ResultsPage';

export const metadata: Metadata = {
  title: 'Результаты теста',
  robots: { index: false, follow: false },
};

export default async function Page() {
  return <ResultsPage />;
}
