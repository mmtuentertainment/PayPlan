interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ text = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div
      className="flex flex-col items-center justify-center py-8"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <div
        className={`${sizeClasses[size]} border-gray-300 border-t-blue-600 rounded-full animate-spin`}
        aria-hidden="true"
      />
      {text && (
        <p className="mt-3 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}
