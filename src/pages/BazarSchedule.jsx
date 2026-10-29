import React, { useState } from 'react';
import { useBazarSchedule } from '../controllers/useBazarSchedule';
import { useMonthContext } from '../context/MonthContext';
import { useAuthContext } from '../context/AuthContext';
import { SummaryCard } from '../components/common/SummaryCard';
import { BazarScheduleTable } from '../components/bazar/BazarScheduleTable';
import { BazarScheduleModal } from '../components/bazar/BazarScheduleModal';
import { AutoRotateDutyModal } from '../components/bazar/AutoRotateDutyModal';
import { BazarTodayAlert } from '../components/bazar/BazarTodayAlert';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Printer,
  Lock,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export const BazarSchedule = () => {
  const { currentMonthData, isClosed } = useMonthContext();
  const { isAdmin, user } = useAuthContext();
  const {
    schedules,
    todaySchedules,
    tomorrowSchedules,
    stats,
    activeMembers,
    loading,
    actionLoading,
    autoDispatchStatus,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleStatus,
    autoRotate,
    notifyOnWhatsApp,
    copyWhatsAppMessage,
  } = useBazarSchedule();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [isAutoRotateOpen, setIsAutoRotateOpen] = useState(false);

  const handleOpenAdd = (preselectedDate = null) => {
    if (!isAdmin || isClosed) return;
    setEditingSchedule(preselectedDate ? { date: preselectedDate } : null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schedule) => {
    if (!isAdmin || isClosed) return;
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    if (editingSchedule && editingSchedule.id) {
      const res = await updateSchedule(editingSchedule.id, formData);
      if (res.success) setIsModalOpen(false);
      return res;
    } else {
      const res = await addSchedule(formData);
      if (res.success) setIsModalOpen(false);
      return res;
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingSchedule) {
      await deleteSchedule(deletingSchedule.id);
      setDeletingSchedule(null);
    }
  };

  const handleAutoRotateSubmit = async (config) => {
    const res = await autoRotate(config);
    if (res.success) {
      setIsAutoRotateOpen(false);
    }
    return res;
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Loader message="Loading bazar duty schedule..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-emerald-600" />
              Bazar Schedule (বাজার শিডিউল)
            </h1>
            {isClosed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3 h-3" /> Read-only
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Assign, rotate, and notify members for market grocery shopping for{' '}
            <strong>{currentMonthData?.monthName || 'Active Month'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            icon={Printer}
            className="text-xs"
          >
            Print Schedule
          </Button>

          {isAdmin && !isClosed && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAutoRotateOpen(true)}
                icon={RefreshCw}
                className="text-xs"
              >
                Auto-Rotate Roster
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAdd(null)}
                icon={Plus}
                className="text-xs"
              >
                Assign Duty
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Auto Dispatch Status Alert */}
      {autoDispatchStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shadow-xs animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span><strong>Automatic WhatsApp Alert:</strong> {autoDispatchStatus}</span>
        </div>
      )}

      {/* Today's Duty Hero Banner */}
      <BazarTodayAlert
        todaySchedules={todaySchedules}
        tomorrowSchedules={tomorrowSchedules}
        isAdmin={isAdmin && !isClosed}
        onNotifyWhatsApp={notifyOnWhatsApp}
        onToggleStatus={toggleStatus}
        onAssignToday={() => handleOpenAdd(new Date().toISOString().split('T')[0])}
      />

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Scheduled Bazaars"
          value={stats.totalCount}
          subtitle="Across the entire month"
          icon={ShoppingCart}
          variant="info"
        />

        <SummaryCard
          title="Duties Today"
          value={stats.todayCount}
          subtitle={stats.todayCount > 0 ? `${todaySchedules[0]?.memberName} on duty` : 'None assigned'}
          icon={CalendarDays}
          variant={stats.todayCount > 0 ? 'primary' : 'default'}
        />

        <SummaryCard
          title="Completed Duties"
          value={stats.completedCount}
          subtitle="Bazaars marked done"
          icon={CheckCircle2}
          variant="success"
        />

        <SummaryCard
          title="Pending Duties"
          value={stats.pendingCount}
          subtitle="Upcoming duty turns"
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Schedule Table View with WhatsApp Actions */}
      <BazarScheduleTable
        schedules={schedules}
        todayDate={new Date().toISOString().split('T')[0]}
        isAdmin={isAdmin}
        isClosed={isClosed}
        onAddSchedule={() => handleOpenAdd(null)}
        onEditSchedule={handleOpenEdit}
        onDeleteSchedule={(schedule) => setDeletingSchedule(schedule)}
        onToggleStatus={toggleStatus}
        onNotifyWhatsApp={notifyOnWhatsApp}
        onCopyWhatsApp={copyWhatsAppMessage}
      />

      {/* Modals & Dialogs */}
      <BazarScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingSchedule}
        activeMembers={activeMembers}
        currentUser={user}
        loading={actionLoading}
        onNotifyWhatsApp={notifyOnWhatsApp}
      />

      <AutoRotateDutyModal
        isOpen={isAutoRotateOpen}
        onClose={() => setIsAutoRotateOpen(false)}
        onGenerate={handleAutoRotateSubmit}
        activeMembers={activeMembers}
        currentUser={user}
        loading={actionLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSchedule}
        onClose={() => setDeletingSchedule(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Bazar Duty"
        message={`Are you sure you want to remove the bazar duty for ${deletingSchedule?.memberName} on ${deletingSchedule?.date}?`}
        confirmText="Delete Duty"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};
