import React from 'react';

export const Card = ({
  children,
  className = '',
  hoverEffect = true,
  padding = 'p-6',
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm ${
        hoverEffect ? 'hover:shadow-md hover:border-slate-300 transition-all duration-200' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
