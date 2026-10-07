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
      iconBg: 'bg-slate-100/90 text-slate-700',
      valueColor: 'text-slate-900',
      titleColor: 'text-slate-500',
      subtitleColor: 'text-slate-400',
    },
    primary: {
      bg: 'bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white shadow-glow-primary',
      border: 'border-emerald-500/40',
      iconBg: 'bg-white/20 text-white backdrop-blur-xs',
      valueColor: 'text-white',
      titleColor: 'text-emerald-100/90',
      subtitleColor: 'text-emerald-100/80',
    },
    info: {
      bg: 'bg-white',
      border: 'border-sky-100 hover:border-sky-200',
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
      valueColor: 'text-slate-900',
      titleColor: 'text-slate-500',
      subtitleColor: 'text-slate-400',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-amber-100 hover:border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      valueColor: 'text-slate-900',
      titleColor: 'text-slate-500',
      subtitleColor: 'text-slate-400',
    },
    danger: {
      bg: 'bg-white',
      border: 'border-rose-100 hover:border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      valueColor: 'text-slate-900',
      titleColor: 'text-slate-500',
      subtitleColor: 'text-slate-400',
    },
  };

  const style = variantMap[variant] || variantMap.default;
  const isGradientBg = variant === 'primary';

  return (
    <div
      className={`relative overflow-hidden p-5 rounded-2xl border shadow-xs hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 ${style.bg} ${style.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${style.titleColor}`}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <h3 className={`text-2xl font-extrabold tracking-tight ${style.valueColor}`}>
              {value}
            </h3>
            {trend && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  trend > 0
                    ? 'bg-emerald-100/80 text-emerald-800'
                    : 'bg-rose-100/80 text-rose-800'
                }`}
              >
                {trend > 0 ? `+${trend}` : trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`mt-1.5 text-xs font-medium truncate ${style.subtitleColor}`}>
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-2xl shrink-0 ${style.iconBg} shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};
