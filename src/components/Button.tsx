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
        'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-full font-semibold transition duration-150',
        {
          'bg-blue-500 text-white enabled:hover:bg-blue-600':
            variant === 'primary',
          'border border-blue-500 text-blue-500 enabled:hover:text-white enabled:hover:bg-blue-500':
            variant === 'outlined',
          'border border-red-500 text-red-500 enabled:hover:text-white enabled:hover:bg-red-500':
            variant === 'errorOutlined',
          'py-2 px-6 text-base sm:text-lg': size === 'medium',
          'text-sm py-2 px-6': size === 'small',
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
