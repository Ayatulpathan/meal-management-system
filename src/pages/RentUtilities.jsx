import React, { useState } from 'react';
import { useRentUtilities } from '../controllers/useRentUtilities';
import { useMonthContext } from '../context/MonthContext';
import { useAuthContext } from '../context/AuthContext';
import { RentSummaryCards } from '../components/rent/RentSummaryCards';
import { MemberRentTable } from '../components/rent/MemberRentTable';
import { UtilityBillList } from '../components/rent/UtilityBillList';
import { RentPaymentList } from '../components/rent/RentPaymentList';
import { UtilityBillForm } from '../components/rent/UtilityBillForm';
import { RentPaymentForm } from '../components/rent/RentPaymentForm';
import { MemberRentConfigModal } from '../components/rent/MemberRentConfigModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import {
  Building2,
  Receipt,
  Wallet,
  Settings,
  Plus,
  Lock,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';

export const RentUtilities = () => {
  const { currentMonthData, isClosed } = useMonthContext();
  const { isAdmin, user } = useAuthContext();
  const {
    summary,
    utilityBills,
    rentPayments,
    memberRentsMap,
    activeMembers,
    loading,
    actionLoading,
    addUtilityBill,
    updateUtilityBill,
    deleteUtilityBill,
    addRentPayment,
    updateRentPayment,
    deleteRentPayment,
    saveMemberRents,
  } = useRentUtilities();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bills' | 'payments'

  // Modal states
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [deletingBill, setDeletingBill] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Utility Bill Handlers
  const handleOpenAddBill = () => {
    if (!isAdmin || isClosed) return;
    setEditingBill(null);
    setIsBillModalOpen(true);
  };

  const handleOpenEditBill = (bill) => {
    if (!isAdmin || isClosed) return;
    setEditingBill(bill);
    setIsBillModalOpen(true);
  };

  const handleBillSubmit = async (billData) => {
    if (editingBill) {
      const res = await updateUtilityBill(editingBill.id, billData);
      if (res.success) setIsBillModalOpen(false);
      return res;
    } else {
      const res = await addUtilityBill(billData);
      if (res.success) setIsBillModalOpen(false);
      return res;
    }
  };

  const handleConfirmDeleteBill = async () => {
    if (deletingBill) {
      await deleteUtilityBill(deletingBill.id);
      setDeletingBill(null);
    }
  };

  // Payment Handlers
  const handleOpenAddPayment = (preselectedMember = null) => {
    if (!isAdmin || isClosed) return;
    if (preselectedMember && preselectedMember.id) {
      setEditingPayment({
        memberId: preselectedMember.id,
        memberName: preselectedMember.name,
        amount: preselectedMember.dueRemaining > 0 ? preselectedMember.dueRemaining : '',
      });
    } else {
      setEditingPayment(null);
    }
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPayment = (payment) => {
    if (!isAdmin || isClosed) return;
    setEditingPayment(payment);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    if (editingPayment && editingPayment.id) {
      const res = await updateRentPayment(editingPayment.id, paymentData);
      if (res.success) setIsPaymentModalOpen(false);
      return res;
    } else {
      const res = await addRentPayment(paymentData);
      if (res.success) setIsPaymentModalOpen(false);
      return res;
    }
  };

  const handleConfirmDeletePayment = async () => {
    if (deletingPayment) {
      await deleteRentPayment(deletingPayment.id);
      setDeletingPayment(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Loader message="Loading house rent & utility records..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary-600" />
              House Rent & Utilities
            </h1>
            {isClosed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3 h-3" /> Read-only
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Separate rent, electricity, gas, water, internet and shared utilities ledger for{' '}
            <strong>{currentMonthData?.monthName || 'Active Month'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Statement</span>
          </Button>

          {isAdmin && !isClosed && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfigModalOpen(true)}
                className="text-xs inline-flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span>Set Rents</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenAddBill}
                className="text-xs inline-flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                <span>Add Bill</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAddPayment(null)}
                className="text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Record Payment</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Metric Cards */}
      <RentSummaryCards summary={summary} />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Member Rent Ledger</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {summary.activeMemberCount || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'bills'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Utility Bills</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {utilityBills.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Payment History</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
            {rentPayments.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <MemberRentTable
            memberSummaries={summary.memberSummaries}
            utilitySharePerMember={summary.utilitySharePerMember}
            isAdmin={isAdmin && !isClosed}
            onRecordPayment={(member) => handleOpenAddPayment(member)}
            onConfigureRent={() => setIsConfigModalOpen(true)}
          />
        </div>
      )}

      {activeTab === 'bills' && (
        <UtilityBillList
          bills={utilityBills}
          activeMemberCount={summary.activeMemberCount}
          isAdmin={isAdmin}
          isClosed={isClosed}
          onAddBill={handleOpenAddBill}
          onEditBill={handleOpenEditBill}
          onDeleteBill={(bill) => setDeletingBill(bill)}
        />
      )}

      {activeTab === 'payments' && (
        <RentPaymentList
          payments={rentPayments}
          isAdmin={isAdmin}
          isClosed={isClosed}
          onAddPayment={() => handleOpenAddPayment(null)}
          onEditPayment={handleOpenEditPayment}
          onDeletePayment={(payment) => setDeletingPayment(payment)}
        />
      )}

      {/* Modals & Dialogs */}
      <UtilityBillForm
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        onSubmit={handleBillSubmit}
        initialData={editingBill}
        currentUser={user}
        loading={actionLoading}
      />

      <RentPaymentForm
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        initialData={editingPayment}
        activeMembers={activeMembers}
        currentUser={user}
        loading={actionLoading}
      />

      <MemberRentConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={saveMemberRents}
        activeMembers={activeMembers}
        currentRentsMap={memberRentsMap}
        loading={actionLoading}
      />

      {/* Delete Utility Bill Confirm */}
      <ConfirmDialog
        isOpen={!!deletingBill}
        onClose={() => setDeletingBill(null)}
        onConfirm={handleConfirmDeleteBill}
        title="Delete Utility Bill"
        message={`Are you sure you want to delete the bill "${deletingBill?.title || deletingBill?.category}"?`}
        confirmText="Delete Bill"
        variant="danger"
        loading={actionLoading}
      />

      {/* Delete Payment Confirm */}
      <ConfirmDialog
        isOpen={!!deletingPayment}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleConfirmDeletePayment}
        title="Delete Rent Payment"
        message={`Are you sure you want to delete this payment record of ${deletingPayment?.memberName}?`}
        confirmText="Delete Payment"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};
