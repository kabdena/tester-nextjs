import { ImageResponse } from 'next/og';

export const alt = 'Тестер для Platonus — онлайн-тренажёр тестов';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TITLE = 'Тестер для Platonus';
const SUBTITLE = 'Онлайн-тренажёр тестов перед сессией';
const BADGE = 'Загрузи .docx · без регистрации';
const URL = 'tester-ayan.vercel.app';

async function loadGoogleFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(
    text,
  )}`;
  const css = await (await fetch(url)).text();
  const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
  if (!src) throw new Error(`Не удалось загрузить шрифт ${family}`);
  return (await fetch(src[1])).arrayBuffer();
}

export default async function Image() {
  const [merriweather, sourceSans] = await Promise.all([
    loadGoogleFont('Merriweather', 900, TITLE),
    loadGoogleFont('Source+Sans+3', 600, SUBTITLE + BADGE + URL),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, #1e293b 0%, #0f172a 70%)',
          color: '#f1f5f9',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '2px',
              background: 'rgba(96, 165, 250, 0.4)',
            }}
          />
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '9999px',
              background: '#60a5fa',
            }}
          />
          <div
            style={{
              width: '60px',
              height: '2px',
              background: 'rgba(96, 165, 250, 0.4)',
            }}
          />
        </div>

        <div
          style={{
            fontFamily: 'Merriweather',
            fontSize: '88px',
            fontWeight: 900,
            letterSpacing: '-2px',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {TITLE}
        </div>

        <div
          style={{
            fontFamily: 'Source Sans 3',
            fontSize: '36px',
            fontWeight: 600,
            color: '#94a3b8',
            marginTop: '24px',
            textAlign: 'center',
          }}
        >
          {SUBTITLE}
        </div>

        <div
          style={{
            display: 'flex',
            fontFamily: 'Source Sans 3',
            fontSize: '26px',
            fontWeight: 600,
            color: '#60a5fa',
            background: 'rgba(96, 165, 250, 0.1)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            borderRadius: '9999px',
            padding: '14px 32px',
            marginTop: '48px',
          }}
        >
          {BADGE}
        </div>

        <div
          style={{
            fontFamily: 'Source Sans 3',
            fontSize: '24px',
            fontWeight: 600,
            color: '#64748b',
            position: 'absolute',
            bottom: '48px',
          }}
        >
          {URL}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Merriweather',
          data: merriweather,
          weight: 900,
          style: 'normal',
        },
        {
          name: 'Source Sans 3',
          data: sourceSans,
          weight: 600,
          style: 'normal',
        },
      ],
    },
  );
}
