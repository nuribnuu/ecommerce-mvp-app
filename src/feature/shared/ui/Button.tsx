import { cva, type VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

const buttonStyles = cva(
  'flex justify-center items-center gap-1 sm:gap-2 py-3 sm:py-4 px-3 sm:px-4 rounded-full font-semibold text-sm sm:text-base cursor-pointer transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary-300 hover:bg-primary-400 text-white',
        secondary:
          'bg-white hover:bg-neutral-300 border border-neutral-300 text-neutral-950',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      disabled: {
        true: '!cursor-not-allowed opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      fullWidth: true,
      disabled: false, // Default is not disabled
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles>;

export const Button = ({
  className = '',
  children,
  variant,
  fullWidth,
  disabled = false,
  onClick,
  ...props
}: ButtonProps) => {
  return (
    <button
      {...props}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        buttonStyles({ variant, fullWidth, disabled }),
        className
      )}
    >
      {children}
    </button>
  );
};
