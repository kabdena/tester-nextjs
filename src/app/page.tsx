import HomePage from '@/pages/HomePage';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Тестер для Platonus',
  url: 'https://tester-ayan.vercel.app',
  description:
    'Бесплатный онлайн-тренажёр тестов для Platonus. Загрузите свой файл .docx с вопросами и прорешайте тест онлайн перед сессией — без регистрации.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  inLanguage: 'ru',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'KZT',
  },
  author: {
    '@type': 'Person',
    name: 'Кабден Аян',
    url: 'https://t.me/kabdena',
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage />
    </>
  );
}
