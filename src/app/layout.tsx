import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';
import Script from 'next/script';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Тестер для Platonus',
  description: 'Тестер для Platonus by Кабден Аян',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ru">
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
      <body>
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
