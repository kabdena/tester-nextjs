// Определение окружения браузера — для подсказок и обезличенной аналитики.

export type InAppBrowser = 'telegram' | 'instagram' | 'none';

declare global {
  interface Window {
    TelegramWebviewProxy?: unknown;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export const getInAppBrowser = (): InAppBrowser => {
  if (typeof window === 'undefined') return 'none';
  const ua = navigator.userAgent;
  if (window.TelegramWebviewProxy || /Telegram/i.test(ua)) return 'telegram';
  if (/Instagram/i.test(ua)) return 'instagram';
  return 'none';
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ представляется как Mac, но с сенсорным экраном
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
};

// Открыт с экрана «Домой» как приложение.
export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    navigator.standalone === true
  );
};
