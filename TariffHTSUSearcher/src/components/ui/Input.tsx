import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const classes = [
      'block',
      'w-full',
      'rounded-md',
      'border-gray-300',
      'shadow-sm',
      'focus:border-blue-500',
      'focus:ring-blue-500',
      'sm:text-sm',
      className,
    ].join(' ');

    return <input className={classes} ref={ref} {...props} />;
  }
);

Input.displayName = 'Input';

export default Input;
