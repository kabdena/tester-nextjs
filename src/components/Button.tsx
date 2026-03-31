import classNames from 'classnames/dedupe';
import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

interface ButtonProps
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: 'primary' | 'outlined' | 'errorOutlined';
  size?: 'small' | 'medium' | 'large';
}

const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'medium',
  ...props
}: ButtonProps) => {
  return (
    <button
      className={classNames(
        'cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-medium tracking-wide transition-all duration-200 ease-out',
        'active:scale-[0.97]',
        {
          'bg-accent text-white hover:bg-accent-hover shadow-[0_0_20px_var(--color-accent-glow)] hover:shadow-[0_0_28px_var(--color-accent-glow)]':
            variant === 'primary',
          'border border-border-default text-text-primary hover:border-accent hover:text-accent hover:bg-accent-subtle':
            variant === 'outlined',
          'border border-error-border text-error hover:bg-error-bg':
            variant === 'errorOutlined',
          'py-2.5 px-7 text-base': size === 'medium',
          'text-sm py-2 px-5': size === 'small',
          'py-3 px-8 text-lg': size === 'large',
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
