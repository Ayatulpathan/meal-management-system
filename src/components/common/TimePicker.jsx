import React, { useMemo } from 'react';
import { Clock, Sun, Moon, Sparkles } from 'lucide-react';

const PRESETS = [
  { time: '06:00', label: '06:00 AM', bangla: 'ভোর ৬টা' },
  { time: '07:00', label: '07:00 AM', bangla: 'সকাল ৭টা' },
  { time: '08:00', label: '08:00 AM', bangla: 'সকাল ৮টা' },
  { time: '09:00', label: '09:00 AM', bangla: 'সকাল ৯টা' },
  { time: '12:00', label: '12:00 PM', bangla: 'দুপুর ১২টা' },
  { time: '17:00', label: '05:00 PM', bangla: 'বিকেল ৫টা' },
  { time: '20:00', label: '08:00 PM', bangla: 'রাত ৮টা' },
  { time: '22:00', label: '10:00 PM', bangla: 'রাত ১০টা' },
];

/**
 * Format 24-hour time "HH:mm" into a friendly readable 12-hour string with Bengali label
 */
export const formatTime12h = (time24) => {
  if (!time24 || typeof time24 !== 'string') return '07:00 AM';
  const parts = time24.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  if (isNaN(h)) h = 7;
  
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const formattedH = String(h12).padStart(2, '0');
  
  let banglaPeriod = 'সকাল';
  if (h >= 4 && h < 6) banglaPeriod = 'ভোর';
  else if (h >= 6 && h < 12) banglaPeriod = 'সকাল';
  else if (h >= 12 && h < 15) banglaPeriod = 'দুপুর';
  else if (h >= 15 && h < 18) banglaPeriod = 'বিকেল';
  else if (h >= 18 && h < 20) banglaPeriod = 'সন্ধ্যা';
  else banglaPeriod = 'রাত';

  return {
    display: `${formattedH}:${m} ${period}`,
    bangla: `${banglaPeriod} ${h12}:${m}`,
    hour12: h12,
    minute: m,
    period,
  };
};

/**
 * Convert 12-hour components back into 24-hour "HH:mm"
 */
export const to24h = (hour12, minute, period) => {
  let h = parseInt(hour12, 10);
  if (isNaN(h) || h < 1) h = 12;
  if (h > 12) h = 12;

  let m = parseInt(minute, 10);
  if (isNaN(m) || m < 0) m = 0;
  if (m > 59) m = 59;
  const mStr = String(m).padStart(2, '0');

  if (period === 'PM') {
    if (h < 12) h += 12;
  } else {
    if (h === 12) h = 0;
  }
  return `${String(h).padStart(2, '0')}:${mStr}`;
};

export const TimePicker = ({
  value = '07:00',
  onChange,
  label = 'Automatic Dispatch Time (স্বয়ংক্রিয় অ্যালার্টের সময়):',
  description = 'Select any hour and minute of the day for notifications.',
  className = '',
}) => {
  const parsed = useMemo(() => formatTime12h(value), [value]);

  const handleHourChange = (newH) => {
    const next24 = to24h(newH, parsed.minute, parsed.period);
    onChange && onChange(next24);
  };

  const handleMinuteChange = (newM) => {
    const next24 = to24h(parsed.hour12, newM, parsed.period);
    onChange && onChange(next24);
  };

  const handlePeriodChange = (newPeriod) => {
    const next24 = to24h(parsed.hour12, parsed.minute, newPeriod);
    onChange && onChange(next24);
  };

  const handleNativeChange = (e) => {
    if (e.target.value) {
      onChange && onChange(e.target.value);
    }
  };

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const commonMinutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div className={`p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5 ${className}`}>
      {/* Header and Live Display Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            {label}
          </label>
          {description && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* Current Active Time Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-blue-200 shadow-sm text-blue-900">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-mono font-bold text-sm text-blue-700">
            {parsed.display}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
            ({parsed.bangla})
          </span>
        </div>
      </div>

      {/* Main Interactive Controls: Hour, Minute, AM/PM, Native input */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Hour Dropdown */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-slate-500">Hour:</span>
          <select
            value={parsed.hour12}
            onChange={(e) => handleHourChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {hoursList.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-400 font-bold">:</span>

        {/* Minute Dropdown */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-slate-500">Min:</span>
          <select
            value={commonMinutes.includes(parsed.minute) ? parsed.minute : 'custom'}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                handleMinuteChange(e.target.value);
              }
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {commonMinutes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            {!commonMinutes.includes(parsed.minute) && (
              <option value="custom">{parsed.minute} (Custom)</option>
            )}
          </select>
        </div>

        {/* AM / PM Segmented Control */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 ml-1">
          <button
            type="button"
            onClick={() => handlePeriodChange('AM')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              parsed.period === 'AM'
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3 h-3 text-amber-700" />
            AM
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange('PM')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              parsed.period === 'PM'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Moon className="w-3 h-3 text-blue-200" />
            PM
          </button>
        </div>

        {/* Native 24h Time Picker Sync */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Exact:</span>
          <input
            type="time"
            value={value || '07:00'}
            onChange={handleNativeChange}
            className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            title="Pick exact time or custom minute"
          />
        </div>
      </div>

      {/* Quick Preset Chips */}
      <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Quick Presets (এক ক্লিকে নির্বাচন):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const isSelected = value === p.time;
            return (
              <button
                key={p.time}
                type="button"
                onClick={() => onChange && onChange(p.time)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30 font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{p.label}</span>
                <span className={`ml-1 text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {p.bangla}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
