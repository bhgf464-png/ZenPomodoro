import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon' | 'ghost';
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  active = false,
  className = '', 
  ...props 
}) => {
  const baseStyles = "transition-all duration-200 ease-in-out font-medium rounded-2xl flex items-center justify-center outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-offset-2 focus:ring-offset-gray-900";
  
  const variants = {
    primary: "bg-white text-gray-900 hover:bg-gray-100 active:scale-95 shadow-lg",
    secondary: `bg-gray-800 text-gray-300 hover:bg-gray-700 active:scale-95 ${active ? 'bg-gray-700 ring-1 ring-gray-600' : ''}`,
    icon: "p-3 rounded-full hover:bg-white/10 text-white active:scale-90",
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
