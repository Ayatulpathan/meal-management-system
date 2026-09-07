import React from 'react';
import { Wallet, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency, formatBalance } from '../../utils/currencyUtils';

export const FinancialSummary = ({ summary }) => {
  const { totalMarketCost = 0, totalDeposits = 0, totalOutstanding = 0, totalSurplus = 0, memberSummaries = [] } = summary || {};

  const netCashInHand = totalDeposits - totalMarketCost;
  const isCashPositive = netCashInHand >= 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Financial Balance</h3>
            <p className="text-xs text-slate-500">Fund vs Market Expenditure</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Net Mess Cash</span>
          <span className={`text-lg font-bold ${isCashPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatBalance(netCashInHand)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Deposits
          </span>
          <span className="text-base font-bold text-slate-800">
            {formatCurrency(totalDeposits)}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Expenses
          </span>
          <span className="text-base font-bold text-slate-800">
            {formatCurrency(totalMarketCost)}
          </span>
        </div>
      </div>

      {/* Member Balances quick snapshot */}
      <div className="mt-5 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Member Balance Highlights
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {memberSummaries.slice(0, 5).map(m => (
            <div key={m.memberId} className="flex items-center justify-between p-2 rounded-xl text-xs bg-slate-50/70">
              <span className="font-medium text-slate-700 truncate mr-2">{m.memberName}</span>
              <span className={`font-bold px-2 py-0.5 rounded-lg ${m.balance >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                {formatBalance(m.balance)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
