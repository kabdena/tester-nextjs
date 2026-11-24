import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import VisitParams from '@/components/VisitParams';

const SITE_URL = 'https://tester-ayan.vercel.app';
const SITE_NAME = 'Тестер для Platonus';
const SITE_DESCRIPTION =
  'Бесплатный онлайн-тренажёр тестов для Platonus. Загрузите свой файл .docx с вопросами и прорешайте тест онлайн перед сессией или рубежным контролем — без регистрации. Прогресс сохраняется.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Тестер для Platonus — онлайн-тренажёр тестов',
    template: '%s — Тестер для Platonus',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'платонус тестер',
    'platonus тест',
    'тестер для platonus',
    'тесты онлайн',
    'подготовка к тестированию',
    'тренажёр тестов',
    'тесты для студентов',
    'прохождение тестов онлайн',
    'platonus',
    'тестер ayan',
    'подготовка к сессии',
    'рубежный контроль тест',
    'тесты к экзамену онлайн',
    'тренажёр тестов docx',
  ],
  authors: [{ name: 'Кабден Аян', url: 'https://t.me/kabdena' }],
  creator: 'Кабден Аян',
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: 'Тестер',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'Тестер для Platonus — онлайн-тренажёр тестов',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Тестер для Platonus — онлайн-тренажёр тестов',
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&family=Source+Sans+3:wght@300;400;500;600;700&subset=cyrillic,cyrillic-ext&display=swap"
          rel="stylesheet"
        />
        {/* Prevent flash: apply saved theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <Script id={'yandex-metrika'}>{`
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
         m[i].l=1*new Date();
         for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
         k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
         (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

         ym(101586893, "init", {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true
         });
        `}</Script>
      <body className="relative z-[1]">
        <ThemeToggle />
        <VisitParams />
        {children}
        <noscript>
          <div>
            <Image
              src="https://mc.yandex.ru/watch/101586893"
              style={{
                position: 'absolute',
                left: -9999,
              }}
              width="1"
              height="1"
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}
