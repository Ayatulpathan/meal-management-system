import React, { useState } from 'react';
import { Plus, Wallet, Lock } from 'lucide-react';
import { useDeposits } from '../controllers/useDeposits';
import { useMembers } from '../controllers/useMembers';
import { useMonthContext } from '../context/MonthContext';
import { useAuthContext } from '../context/AuthContext';
import { DepositTable } from '../components/deposits/DepositTable';
import { DepositForm } from '../components/deposits/DepositForm';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { formatCurrency } from '../utils/currencyUtils';

export const Deposits = () => {
  const { currentMonthData, isClosed } = useMonthContext();
  const { isAdmin, currentMemberId } = useAuthContext();
  const { members } = useMembers();
  const {
    deposits,
    totalDeposits,
    loading,
    actionLoading,
    addDeposit,
    updateDeposit,
    deleteDeposit,
  } = useDeposits();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState(null);
  const [deletingDeposit, setDeletingDeposit] = useState(null);

  const handleOpenAdd = () => {
    setEditingDeposit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (deposit) => {
    setEditingDeposit(deposit);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingDeposit) {
      const res = await updateDeposit(editingDeposit.id, formData);
      if (res.success) setIsFormOpen(false);
      return res;
    } else {
      const res = await addDeposit(formData);
      if (res.success) setIsFormOpen(false);
      return res;
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingDeposit) {
      await deleteDeposit(deletingDeposit.id);
      setDeletingDeposit(null);
    }
  };

  if (loading) {
    return <Loader message="Loading member deposits..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Member Deposits & Advances
            </h1>
            {isClosed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3 h-3" /> Read-only
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage advance money collected from members for <strong>{currentMonthData?.monthName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-xl text-xs font-bold text-emerald-800">
            Total Deposits: {formatCurrency(totalDeposits)}
          </div>
          {!isClosed && (
            <Button variant="primary" onClick={handleOpenAdd} icon={Plus}>
              Record Deposit
            </Button>
          )}
        </div>
      </div>

      {/* Deposit Table */}
      <DepositTable
        deposits={deposits}
        members={members}
        totalDeposits={totalDeposits}
        isClosed={isClosed}
        isAdmin={isAdmin}
        currentMemberId={currentMemberId}
        onEdit={handleOpenEdit}
        onDelete={(dep) => setDeletingDeposit(dep)}
        onAddDeposit={handleOpenAdd}
      />

      {/* Add / Edit Modal */}
      <DepositForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        members={isAdmin ? members : members.filter(m => m.id === currentMemberId)}
        initialData={editingDeposit}
        loading={actionLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingDeposit}
        onClose={() => setDeletingDeposit(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Deposit Record"
        message={`Are you sure you want to delete this deposit entry of ${formatCurrency(deletingDeposit?.amount || 0)}?`}
        confirmText="Delete Deposit"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};
