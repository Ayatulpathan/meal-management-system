import React from 'react';

export const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  prefix = null,
  suffix = null,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-2xs">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
            {prefix}
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-xl text-xs sm:text-sm font-medium transition-all border ${
            error
              ? 'border-rose-300 bg-rose-50/20 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-200/90 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
          } ${prefix ? 'pl-9 sm:pl-10' : 'pl-3.5 sm:pl-4'} ${suffix ? 'pr-9 sm:pr-10' : 'pr-3.5 sm:pr-4'} py-2.5 bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none`}
          {...props}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>}
    </div>
  );
};
