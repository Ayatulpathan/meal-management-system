import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Plus, Lock, AlertCircle, Info } from 'lucide-react';
import { useMeals } from '../controllers/useMeals';
import { useMembers } from '../controllers/useMembers';
import { useMonthContext } from '../context/MonthContext';
import { MealGrid } from '../components/meals/MealGrid';
import { MemberForm } from '../components/members/MemberForm';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const Meals = () => {
  const navigate = useNavigate();
  const { selectedMonth, currentMonthData, isClosed } = useMonthContext();
  const { activeMembers, addMember, actionLoading: memberActionLoading } = useMembers();
  const {
    mealRecords,
    loading: mealsLoading,
    error,
    savingCell,
    daysCount,
    dailyTotals,
    totalMealsCount,
    setDayMeal,
  } = useMeals();

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const handleMealChange = async (memberId, day, value) => {
    await setDayMeal(memberId, day, value);
  };

  const handleAddMemberSubmit = async (formData) => {
    const res = await addMember(formData);
    if (res.success) setIsAddMemberOpen(false);
    return res;
  };

  if (mealsLoading) {
    return <Loader message="Loading spreadsheet meal grid..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Meal Entry Grid
            </h1>
            {isClosed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3 h-3" /> Read-only
              </span>
            ) : null}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record daily meals (0, 1, or 2) for <strong>{currentMonthData?.monthName}</strong> ({daysCount} days)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800">
            Total Monthly Meals: {totalMealsCount}
          </div>
          {!isClosed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddMemberOpen(true)}
              icon={Plus}
            >
              Add Member
            </Button>
          )}
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="Meal Update Error"
          message={error}
        />
      )}

      {/* Spreadsheet Meal Grid */}
      <MealGrid
        monthId={selectedMonth}
        daysCount={daysCount}
        members={activeMembers}
        mealRecords={mealRecords}
        dailyTotals={dailyTotals}
        totalMeals={totalMealsCount}
        isClosed={isClosed}
        savingCell={savingCell}
        onMealChange={handleMealChange}
        onAddMember={() => setIsAddMemberOpen(true)}
      />

      {/* Quick Add Member Modal */}
      <MemberForm
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSubmit={handleAddMemberSubmit}
        loading={memberActionLoading}
      />
    </div>
  );
};
