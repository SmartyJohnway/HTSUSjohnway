import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    const classes = [
      'bg-white',
      'rounded-lg',
      'shadow-md',
      'p-6',
      'border',
      'border-gray-200',
      className,
    ].join(' ');

    return <div className={classes} ref={ref} {...props} />;
  }
);

Card.displayName = 'Card';

export default Card;
