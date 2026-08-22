import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface GenerateButtonProps {
  isLoading: boolean;
  onClick?: () => void;
  text?: string;
  disabled?: boolean;
  className?: string;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  isLoading,
  onClick,
  text = 'Generate with AI',
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-md hover:shadow-lg focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Generating AI Response...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};
