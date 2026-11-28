import Link from 'next/link';

const Footer = () => {
  return (
    <div className="text-text-muted text-xs tracking-wide text-center flex flex-col items-center gap-1 pb-16 sm:pb-0">
      <div className="flex items-center flex-wrap justify-center gap-x-1">
        &copy; {new Date().getFullYear()}{' '}Кабден Аян &middot;
        <a
          href="https://instagram.com/kabden.a"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center py-3.5 -my-3.5 text-accent hover:text-accent-hover transition-colors"
        >
          Instagram
        </a>
        &middot;
        <a
          href="https://t.me/kabdena"
          target="_blank"
          rel="noopener noreferrer"
          title="Пожелания и ошибки — пишите в Telegram"
          className="inline-flex items-center py-3.5 -my-3.5 text-accent hover:text-accent-hover transition-colors"
        >
          Telegram
        </a>
      </div>
      <Link
        href="/privacy"
        className="inline-flex items-center justify-center text-center py-3.5 -my-3.5 text-text-muted hover:text-accent underline underline-offset-2 sm:no-underline sm:hover:underline transition-colors"
      >
        Файлы не покидают устройство
      </Link>
    </div>
  );
};

export default Footer;
