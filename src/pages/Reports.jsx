import React, { useState } from 'react';
import { Printer, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useMonthlySummary } from '../controllers/useMonthlySummary';
import { MonthlyReport } from '../components/reports/MonthlyReport';
import { MemberReport } from '../components/reports/MemberReport';
import { FinancialReport } from '../components/reports/FinancialReport';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { formatCurrency } from '../utils/currencyUtils';

export const Reports = () => {
  const { summary, loading, raw, monthData } = useMonthlySummary();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'summary', 'members', 'transactions'

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ['Meal Management System — Monthly Statement'],
      [`Month: ${monthData?.monthName}`],
      [''],
      ['Monthly Summary Statistics'],
      ['Total Members', summary.totalMembers],
      ['Total Meals', summary.totalMeals],
      ['Total Market Cost (BDT)', summary.totalMarketCost],
      ['Cost Per Meal (BDT)', summary.costPerMeal],
      ['Total Deposits (BDT)', summary.totalDeposits],
      ['Net Outstanding Due (BDT)', summary.totalOutstanding],
      [''],
      ['Member-wise Breakdown'],
      ['Member ID', 'Member Name', 'Total Meals', 'Meal Cost (BDT)', 'Total Deposit (BDT)', 'Balance (BDT)'],
      ...summary.memberSummaries.map((m) => [
        m.memberId,
        `"${m.memberName}"`,
        m.totalMeal,
        m.mealCost,
        m.totalDeposit,
        m.balance,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Meal_Report_${monthData?.month || 'month'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Loader message="Generating financial reports and calculating balances..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial & Meal Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete audited report and balance statement for <strong>{monthData?.monthName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            icon={Download}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* Report View Tabs (Hidden on print) */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm no-print max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Full Comprehensive Statement
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'summary'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Monthly Summary
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'members'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Member Ledger
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'transactions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ledger Breakdown
        </button>
      </div>

      {/* Print-only Header Banner */}
      <div className="hidden print-only mb-6 border-b-2 border-slate-800 pb-4">
        <h2 className="text-2xl font-bold text-slate-900">Meal Management System</h2>
        <p className="text-sm text-slate-600">
          Monthly Accounting Statement — {monthData?.monthName}
        </p>
      </div>

      {/* Content based on selected tab or full print */}
      {(activeTab === 'all' || activeTab === 'summary') && (
        <MonthlyReport
          summary={summary}
          monthName={monthData?.monthName}
        />
      )}

      {(activeTab === 'all' || activeTab === 'members') && (
        <MemberReport
          memberSummaries={summary.memberSummaries}
          costPerMeal={summary.costPerMeal}
        />
      )}

      {(activeTab === 'all' || activeTab === 'transactions') && (
        <FinancialReport
          marketCosts={raw.marketCosts}
          deposits={raw.deposits}
          members={raw.members}
        />
      )}
    </div>
  );
};
