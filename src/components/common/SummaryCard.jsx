import React from 'react';

export const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className = '',
}) => {
  const variantMap = {
    default: {
      bg: 'bg-white',
      border: 'border-slate-200/80',
      iconBg: 'bg-slate-100 text-slate-700',
      valueColor: 'text-slate-900',
    },
    primary: {
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      border: 'border-emerald-400/30 shadow-emerald-500/10',
      iconBg: 'bg-white/20 text-white',
      valueColor: 'text-white',
      titleColor: 'text-emerald-100',
      subtitleColor: 'text-emerald-100/90',
    },
    info: {
      bg: 'bg-white',
      border: 'border-sky-100',
      iconBg: 'bg-sky-50 text-sky-600',
      valueColor: 'text-slate-900',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-amber-100',
      iconBg: 'bg-amber-50 text-amber-600',
      valueColor: 'text-slate-900',
    },
    danger: {
      bg: 'bg-white',
      border: 'border-rose-100',
      iconBg: 'bg-rose-50 text-rose-600',
      valueColor: 'text-slate-900',
    },
  };

  const style = variantMap[variant] || variantMap.default;
  const isCustomBg = variant === 'primary';

  return (
    <div className={`p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md ${style.bg} ${style.border} ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${isCustomBg ? style.titleColor : 'text-slate-500'}`}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className={`text-2xl font-bold tracking-tight ${style.valueColor}`}>
              {value}
            </h3>
            {trend && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {trend > 0 ? `+${trend}` : trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`mt-1.5 text-xs ${isCustomBg ? style.subtitleColor : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl shrink-0 ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};
