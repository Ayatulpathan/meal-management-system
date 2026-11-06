import React, { useState } from 'react';
import { 
  Building2, 
  Copy, 
  CheckCheck,
  Sparkles
} from 'lucide-react';
import { useMessContext } from '../../context/MessContext';

export const MessSelector = () => {
  const { currentMess } = useMessContext();
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    if (currentMess?.inviteCode) {
      navigator.clipboard.writeText(currentMess.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/90 shadow-2xs">
      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
        <Building2 className="w-3.5 h-3.5" />
      </div>
      <div className="hidden sm:block min-w-0">
        <p className="text-xs font-black text-slate-800 leading-tight truncate">
          {currentMess?.name || 'Khadok Mess'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-bold text-slate-500">
            Invite Code:
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono text-[10px] font-black border border-emerald-200/80 transition-colors cursor-pointer"
            title="Click to copy invite code"
          >
            {copiedCode ? (
              <>
                <CheckCheck className="w-2.5 h-2.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-2.5 h-2.5 text-emerald-600" />
                <span>{currentMess?.inviteCode || 'KHD101'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
