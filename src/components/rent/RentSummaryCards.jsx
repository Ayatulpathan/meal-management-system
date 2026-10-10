import React from 'react';
import { SummaryCard } from '../common/SummaryCard';
import { formatCurrency } from '../../utils/currencyUtils';
import { Building2, Zap, Users, Wallet, CheckCircle2, AlertCircle, Coins } from 'lucide-react';

export const RentSummaryCards = ({ summary }) => {
  const {
    totalHouseRent = 0,
    totalUtilities = 0,
    utilitySharePerMember = 0,
    totalRentDue = 0,
    totalRentPaid = 0,
    totalRentRemaining = 0,
    totalExtraToRefund = 0,
    totalSurplus = 0,
    membersWithExtraCount = 0,
    activeMemberCount = 0,
  } = summary || {};

  const extraAmount = totalExtraToRefund || totalSurplus || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <SummaryCard
        title="Total House Rent"
        value={formatCurrency(totalHouseRent)}
        subtitle={`${activeMemberCount} active members`}
        icon={Building2}
        variant="info"
      />

      <SummaryCard
        title="Total Utilities"
        value={formatCurrency(totalUtilities)}
        subtitle={`Share: ${formatCurrency(utilitySharePerMember)} / person`}
        icon={Zap}
        variant="warning"
      />

      <SummaryCard
        title="Total Rent Collected"
        value={formatCurrency(totalRentPaid)}
        subtitle={`Total Due: ${formatCurrency(totalRentDue)}`}
        icon={Wallet}
        variant="primary"
      />

      <SummaryCard
        title="Outstanding Due"
        value={formatCurrency(totalRentRemaining)}
        subtitle={totalRentRemaining <= 0 ? 'All dues cleared' : 'Pending from members'}
        icon={totalRentRemaining <= 0 ? CheckCircle2 : AlertCircle}
        variant={totalRentRemaining <= 0 ? 'default' : 'danger'}
      />

      <SummaryCard
        title="Extra Paid (Refundable)"
        value={extraAmount > 0 ? `+${formatCurrency(extraAmount)}` : formatCurrency(0)}
        subtitle={
          extraAmount > 0
            ? `${membersWithExtraCount} member${membersWithExtraCount > 1 ? 's' : ''} will get refund`
            : 'No extra payments'
        }
        icon={Coins}
        variant={extraAmount > 0 ? 'success' : 'default'}
      />
    </div>
  );
};
