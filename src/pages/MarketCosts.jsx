import React, { useState } from 'react';
import { Plus, ShoppingCart, Lock } from 'lucide-react';
import { useMarketCosts } from '../controllers/useMarketCosts';
import { useMonthContext } from '../context/MonthContext';
import { MarketCostTable } from '../components/market/MarketCostTable';
import { MarketCostForm } from '../components/market/MarketCostForm';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { formatCurrency } from '../utils/currencyUtils';

export const MarketCosts = () => {
  const { currentMonthData, isClosed } = useMonthContext();
  const {
    marketCosts,
    totalMarketCost,
    loading,
    actionLoading,
    addMarketCost,
    updateMarketCost,
    deleteMarketCost,
  } = useMarketCosts();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  const [deletingCost, setDeletingCost] = useState(null);

  const handleOpenAdd = () => {
    setEditingCost(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cost) => {
    setEditingCost(cost);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingCost) {
      const res = await updateMarketCost(editingCost.id, formData);
      if (res.success) setIsFormOpen(false);
      return res;
    } else {
      const res = await addMarketCost(formData);
      if (res.success) setIsFormOpen(false);
      return res;
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingCost) {
      await deleteMarketCost(deletingCost.id);
      setDeletingCost(null);
    }
  };

  if (loading) {
    return <Loader message="Loading market expenses..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Market & Grocery Expenses
            </h1>
            {isClosed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3 h-3" /> Read-only
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log mess bazaars and food expenses for <strong>{currentMonthData?.monthName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-bold text-slate-800">
            Total Expense: {formatCurrency(totalMarketCost)}
          </div>
          {!isClosed && (
            <Button variant="primary" onClick={handleOpenAdd} icon={Plus}>
              Record Expense
            </Button>
          )}
        </div>
      </div>

      {/* Market Cost Table */}
      <MarketCostTable
        costs={marketCosts}
        totalCost={totalMarketCost}
        isClosed={isClosed}
        onEdit={handleOpenEdit}
        onDelete={(cost) => setDeletingCost(cost)}
        onAddCost={handleOpenAdd}
      />

      {/* Add / Edit Modal */}
      <MarketCostForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingCost}
        loading={actionLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCost}
        onClose={() => setDeletingCost(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Market Expense"
        message={`Are you sure you want to delete the expense of ${formatCurrency(deletingCost?.amount || 0)} for "${deletingCost?.description || 'Grocery'}"?`}
        confirmText="Delete Expense"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};
