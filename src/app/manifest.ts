import type { MetadataRoute } from 'next';

// Нужен, чтобы «На экран „Домой“» открывал тестер как приложение.
// На iOS это ещё и защищает локальные данные от автоудаления Safari (ITP).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Тестер для Platonus',
    short_name: 'Тестер',
    description:
      'Онлайн-тренажёр тестов: загрузите свой .docx с вопросами и прорешайте тест перед сессией.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    lang: 'ru',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
