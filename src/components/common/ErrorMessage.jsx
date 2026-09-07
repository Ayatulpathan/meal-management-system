import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const ErrorMessage = ({
  title = 'Something went wrong',
  message = 'Unable to complete this action. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
          <p className="text-xs text-rose-700 mt-1 leading-relaxed">{message}</p>
          {onRetry && (
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={onRetry} icon={RefreshCw} className="bg-white border-rose-200 text-rose-700 hover:bg-rose-50">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
