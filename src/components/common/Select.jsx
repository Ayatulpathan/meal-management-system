import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error = '',
  required = false,
  disabled = false,
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
        <select
          id={name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-xl text-xs sm:text-sm font-medium transition-all appearance-none border ${
            error
              ? 'border-rose-300 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : 'border-slate-200/90 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
          } pl-3.5 pr-10 py-2.5 bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none cursor-pointer`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const labelText = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {labelText}
              </option>
            );
          })}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};
