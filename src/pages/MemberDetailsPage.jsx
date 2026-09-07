import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { useMonthlySummary } from '../controllers/useMonthlySummary';
import { MemberDetails } from '../components/members/MemberDetails';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';

export const MemberDetailsPage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { raw, summary, monthData, loading } = useMonthlySummary();

  const member = useMemo(() => {
    return raw.members.find((m) => m.id === memberId);
  }, [raw.members, memberId]);

  const memberSummary = useMemo(() => {
    return summary.memberSummaries.find((m) => m.memberId === memberId);
  }, [summary.memberSummaries, memberId]);

  const memberDeposits = useMemo(() => {
    return raw.deposits.filter((d) => d.memberId === memberId);
  }, [raw.deposits, memberId]);

  const mealRecord = useMemo(() => {
    return raw.mealRecords.find((r) => r.memberId === memberId);
  }, [raw.mealRecords, memberId]);

  if (loading) {
    return <Loader message="Loading member records..." fullScreen />;
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/members')} icon={ArrowLeft}>
          Back to Members
        </Button>
        <EmptyState
          icon={User}
          title="Member Not Found"
          description="The requested member record could not be found or has been deleted."
          actionLabel="View All Members"
          onAction={() => navigate('/members')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/members')}
          icon={ArrowLeft}
          className="text-slate-600 hover:text-slate-900"
        >
          Back to Members List
        </Button>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
          Month: {monthData?.monthName}
        </span>
      </div>

      <MemberDetails
        member={member}
        memberSummary={memberSummary}
        memberDeposits={memberDeposits}
        mealHistory={mealRecord?.meals || {}}
        daysCount={monthData?.days || 30}
      />
    </div>
  );
};
