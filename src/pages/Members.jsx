import React, { useState } from 'react';
import { Plus, Users, UserCheck, UserX, Search } from 'lucide-react';
import { useMembers } from '../controllers/useMembers';
import { MemberTable } from '../components/members/MemberTable';
import { MemberForm } from '../components/members/MemberForm';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';

export const Members = () => {
  const {
    members,
    activeMembers,
    inactiveMembers,
    loading,
    actionLoading,
    addMember,
    updateMember,
    deactivateMember,
    activateMember,
  } = useMembers();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deactivatingMember, setDeactivatingMember] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'active', 'inactive'
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenAdd = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingMember) {
      const res = await updateMember(editingMember.id, formData);
      if (res.success) setIsFormOpen(false);
      return res;
    } else {
      const res = await addMember(formData);
      if (res.success) setIsFormOpen(false);
      return res;
    }
  };

  const handleConfirmDeactivate = async () => {
    if (deactivatingMember) {
      await deactivateMember(deactivatingMember.id);
      setDeactivatingMember(null);
    }
  };

  const handleActivate = async (member) => {
    await activateMember(member.id);
  };

  // Filter and search
  const displayedMembers = members
    .filter((m) => {
      if (filterTab === 'active') return m.status === 'active';
      if (filterTab === 'inactive') return m.status === 'inactive';
      return true;
    })
    .filter((m) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(query) ||
        (m.phone && m.phone.toLowerCase().includes(query)) ||
        (m.email && m.email.toLowerCase().includes(query))
      );
    });

  if (loading) {
    return <Loader message="Loading mess members..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Member Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage mess borders, contact info, and active membership status
          </p>
        </div>

        <Button variant="primary" onClick={handleOpenAdd} icon={Plus}>
          Add New Member
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'active'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active ({activeMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'inactive'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inactive ({inactiveMembers.length})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Member Table or Empty State */}
      {displayedMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No matching members' : 'No members registered'}
          description={
            searchQuery
              ? 'Try refining your search keyword.'
              : 'Add members to start logging meals, costs, and deposits.'
          }
          actionLabel={searchQuery ? null : 'Add First Member'}
          onAction={handleOpenAdd}
        />
      ) : (
        <MemberTable
          members={displayedMembers}
          onEdit={handleOpenEdit}
          onDeactivate={(member) => setDeactivatingMember(member)}
          onActivate={handleActivate}
          loading={actionLoading}
        />
      )}

      {/* Add / Edit Member Modal */}
      <MemberForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingMember}
        loading={actionLoading}
      />

      {/* Confirm Deactivation Dialog */}
      <ConfirmDialog
        isOpen={!!deactivatingMember}
        onClose={() => setDeactivatingMember(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Member"
        message={`Are you sure you want to deactivate ${deactivatingMember?.name}? Their historical meal and deposit records will be preserved forever, but they will be marked inactive.`}
        confirmText="Deactivate"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
};
