import React, { useState } from 'react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { calculateBillPerPersonShare } from '../../utils/rentCalculations';
import { UTILITY_CATEGORIES } from '../../models/rentUtilityModel';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import {
  Zap,
  Flame,
  Droplets,
  Wifi,
  UserCheck,
  Trash2,
  Building2,
  Receipt,
  Plus,
  Edit2,
  Trash,
  Filter,
  Users,
} from 'lucide-react';

const CATEGORY_ICON_MAP = {
  electricity: { icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  gas: { icon: Flame, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  water: { icon: Droplets, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  internet: { icon: Wifi, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  maid: { icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  waste: { icon: Trash2, color: 'text-slate-600 bg-slate-100 border-slate-200' },
  service: { icon: Building2, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  other: { icon: Receipt, color: 'text-teal-600 bg-teal-50 border-teal-200' },
};

export const UtilityBillList = ({
  bills = [],
  activeMembers = [],
  activeMemberCount = 1,
  isAdmin = false,
  isClosed = false,
  onAddBill,
  onEditBill,
  onDeleteBill,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredBills = bills.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.category === selectedCategory;
  });

  const totalBillAmount = filteredBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            Monthly Utility Bills
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Total recorded bills: <span className="font-semibold text-slate-700">{formatCurrency(totalBillAmount)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-medium py-1.5 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-700"
            >
              <option value="all">All Categories</option>
              {UTILITY_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {isAdmin && !isClosed && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddBill}
              className="text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bill</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bill List */}
      {filteredBills.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {filteredBills.map((bill) => {
            const config = CATEGORY_ICON_MAP[bill.category] || CATEGORY_ICON_MAP.other;
            const IconComponent = config.icon;
            const shareInfo = calculateBillPerPersonShare(bill, activeMembers);
            const hasCustomSplit = Array.isArray(bill.includedMembers) && bill.includedMembers.length > 0;

            return (
              <div
                key={bill.id}
                className="p-4 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${config.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-900 text-sm">
                        {bill.title || bill.category}
                      </h4>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                        {bill.category}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        hasCustomSplit
                          ? 'bg-primary-50 text-primary-700 border border-primary-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Users className="w-3 h-3" />
                        {hasCustomSplit
                          ? `${shareInfo.participatingMembersCount} selected members`
                          : `All ${activeMembers.length || activeMemberCount} members`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span>Date: {formatDate(bill.date)}</span>
                      {bill.paidBy && <span>• Paid by: {bill.paidBy}</span>}
                      {bill.note && <span>• Note: {bill.note}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-right">
                    <p className="text-base font-bold text-slate-900">
                      {formatCurrency(bill.amount)}
                    </p>
                    <p className="text-[11px] text-amber-700 font-medium">
                      {formatCurrency(shareInfo.perPersonShare)} / person
                    </p>
                  </div>

                  {isAdmin && !isClosed && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditBill(bill)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Edit Bill"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteBill(bill)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Bill"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8">
          <EmptyState
            icon={Receipt}
            title="No utility bills recorded"
            message="Record electricity, gas, water, internet, or maid expenses and choose which members participate."
            action={
              isAdmin && !isClosed ? (
                <Button variant="primary" size="sm" onClick={onAddBill}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Utility Bill
                </Button>
              ) : null
            }
          />
        </div>
      )}
    </div>
  );
};
