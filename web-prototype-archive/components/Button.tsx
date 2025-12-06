import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  pulse?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  pulse = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl";
  
  const variants = {
    primary: "bg-voltage-gradient text-charcoal-900 hover:scale-[1.02] shadow-[0_0_20px_rgba(255,214,10,0.3)] hover:shadow-[0_0_30px_rgba(255,214,10,0.5)] border-none",
    secondary: "bg-transparent text-white border-2 border-voltage hover:bg-voltage/10 hover:shadow-[inset_0_0_20px_rgba(255,214,10,0.2)]",
    tertiary: "bg-charcoal-700 text-white border border-charcoal-600 hover:bg-charcoal-600",
    ghost: "bg-transparent text-voltage hover:text-voltage-bright hover:underline decoration-2 underline-offset-4"
  };

  const sizes = {
    sm: "text-sm px-4 py-2",
    md: "text-base px-8 py-4",
    lg: "text-lg px-10 py-5"
  };

  const pulseAnimation = pulse ? "animate-voltage-pulse" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${pulseAnimation} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;