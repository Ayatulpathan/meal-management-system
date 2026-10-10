/**
 * House Rent & Utility Calculation Engine
 * Completely isolated from meal rate and grocery accounting.
 * Supports selective member participation for utility bills.
 */

/**
 * Calculates sum of all utility bills for a month
 * @param {Array} utilityBills 
 * @returns {number}
 */
export const calculateTotalUtilities = (utilityBills = []) => {
  if (!Array.isArray(utilityBills)) return 0;
  return utilityBills.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
};

/**
 * Calculates individual utility share for a specific bill among its participating members
 * @param {Object} bill 
 * @param {Array} activeMembers 
 * @param {Object} memberRentsMap 
 * @returns {Object} { participatingMembersCount, perPersonShare, participatingMemberIds }
 */
export const calculateBillPerPersonShare = (bill, activeMembers = [], memberRentsMap = {}) => {
  const amount = Number(bill?.amount) || 0;
  if (amount <= 0 || !activeMembers || activeMembers.length === 0) {
    return { participatingMembersCount: 0, perPersonShare: 0, participatingMemberIds: [] };
  }

  let participatingMemberIds = [];
  if (Array.isArray(bill.includedMembers) && bill.includedMembers.length > 0) {
    // If specific members are chosen for this bill, include them
    participatingMemberIds = activeMembers
      .filter(m => bill.includedMembers.includes(m.id))
      .map(m => m.id);
  } else {
    // If general bill (all active members), exclude members configured as exemptUtilities
    participatingMemberIds = activeMembers
      .filter(m => {
        const cfg = memberRentsMap?.[m.id];
        const isExempt = cfg && typeof cfg === 'object' && cfg.exemptUtilities;
        return !isExempt;
      })
      .map(m => m.id);
    
    // Fallback if everyone is exempt, avoid division by zero
    if (participatingMemberIds.length === 0) {
      participatingMemberIds = activeMembers.map(m => m.id);
    }
  }

  const count = participatingMemberIds.length;
  const perPersonShare = count > 0 ? Math.round((amount / count) * 100) / 100 : 0;

  return {
    participatingMembersCount: count,
    perPersonShare,
    participatingMemberIds,
  };
};

/**
 * Calculates average or global utility share per member
 * @param {number} totalUtilities 
 * @param {number} activeMembersCount 
 * @returns {number}
 */
export const calculateUtilitySharePerMember = (totalUtilities = 0, activeMembersCount = 0) => {
  if (!activeMembersCount || activeMembersCount <= 0) return 0;
  return Math.round(((Number(totalUtilities) || 0) / activeMembersCount) * 100) / 100;
};

/**
 * Calculates total payments made by a specific member
 * @param {string} memberId 
 * @param {Array} rentPayments 
 * @returns {number}
 */
export const calculateMemberRentPaid = (memberId, rentPayments = []) => {
  if (!memberId || !Array.isArray(rentPayments)) return 0;
  return rentPayments
    .filter(p => p.memberId === memberId)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
};

/**
 * Calculates individual member rent & utility statement with selective bill participation
 * @param {Array} members 
 * @param {Object} memberRentsMap { [memberId]: number | { seatRent: number, room: string, exemptUtilities?: boolean } }
 * @param {Array} utilityBills 
 * @param {Array} rentPayments 
 * @returns {Array}
 */
export const calculateMemberRentLedger = (
  members = [],
  memberRentsMap = {},
  utilityBills = [],
  rentPayments = []
) => {
  const activeMembers = Array.isArray(members)
    ? members.filter(m => (m.status === undefined || m.status === 'active'))
    : [];

  // Pre-calculate per-bill shares considering exemptions
  const billShares = utilityBills.map((bill) => ({
    bill,
    shareInfo: calculateBillPerPersonShare(bill, activeMembers, memberRentsMap),
  }));

  return activeMembers.map((member) => {
    let seatRent = 0;
    let room = member.room || '';
    let exemptUtilities = false;

    const rentConfig = memberRentsMap?.[member.id];
    if (typeof rentConfig === 'number') {
      seatRent = rentConfig;
    } else if (rentConfig && typeof rentConfig === 'object') {
      seatRent = Number(rentConfig.seatRent) || 0;
      if (rentConfig.room) room = rentConfig.room;
      if (rentConfig.exemptUtilities !== undefined) exemptUtilities = !!rentConfig.exemptUtilities;
    } else if (member.rent !== undefined || member.defaultRent !== undefined) {
      seatRent = Number(member.rent || member.defaultRent || 0);
    }

    // Calculate this member's utility share from bills they participate in
    let memberUtilityShare = 0;
    const participatedBills = [];

    billShares.forEach(({ bill, shareInfo }) => {
      if (shareInfo.participatingMemberIds.includes(member.id)) {
        memberUtilityShare += shareInfo.perPersonShare;
        participatedBills.push({
          billId: bill.id,
          category: bill.category,
          title: bill.title,
          share: shareInfo.perPersonShare,
        });
      }
    });

    memberUtilityShare = Math.round(memberUtilityShare * 100) / 100;
    const totalPayable = Math.round((seatRent + memberUtilityShare) * 100) / 100;
    const totalPaid = calculateMemberRentPaid(member.id, rentPayments);
    const balance = Math.round((totalPaid - totalPayable) * 100) / 100;

    let status = 'unpaid';
    if (totalPaid >= totalPayable && totalPayable > 0) {
      status = totalPaid > totalPayable ? 'overpaid' : 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    } else if (totalPayable === 0 && totalPaid === 0) {
      status = 'paid';
    }

    const dueRemaining = balance < 0 ? Math.abs(balance) : 0;
    const advanceAmount = balance > 0 ? balance : 0;
    const extraAmount = advanceAmount;
    const refundableAmount = extraAmount; // Amount the member will get back
    const willReceiveAmount = extraAmount;
    const hasExtraPayment = balance > 0;

    return {
      id: member.id,
      memberId: member.id,
      name: member.name,
      memberName: member.name,
      phone: member.phone || '',
      room,
      exemptUtilities,
      seatRent,
      utilityShare: memberUtilityShare,
      participatedBills,
      totalDue: totalPayable,
      totalPayable,
      rentPaid: totalPaid,
      totalPaid,
      balance,
      dueRemaining,
      advanceAmount,
      extraAmount,
      refundableAmount,
      willReceiveAmount,
      hasExtraPayment,
      status,
    };
  });
};

/**
 * Calculates complete monthly rent and utility summary
 * @param {Array} members 
 * @param {Object} memberRentsMap 
 * @param {Array} utilityBills 
 * @param {Array} rentPayments 
 * @returns {Object}
 */
export const calculateRentSummary = (
  members = [],
  memberRentsMap = {},
  utilityBills = [],
  rentPayments = []
) => {
  const ledger = calculateMemberRentLedger(members, memberRentsMap, utilityBills, rentPayments);
  const totalUtilities = calculateTotalUtilities(utilityBills);
  const totalHouseRent = ledger.reduce((sum, m) => sum + m.seatRent, 0);
  const totalMemberUtilityShareSum = ledger.reduce((sum, m) => sum + m.utilityShare, 0);
  const totalPayableGrand = Math.round((totalHouseRent + totalMemberUtilityShareSum) * 100) / 100;
  
  const totalCollected = Array.isArray(rentPayments)
    ? rentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    : 0;
  
  const totalDue = ledger.reduce((sum, m) => (m.balance < 0 ? sum + Math.abs(m.balance) : sum), 0);
  const totalSurplus = ledger.reduce((sum, m) => (m.balance > 0 ? sum + m.balance : sum), 0);
  const totalExtraToRefund = Math.round(totalSurplus * 100) / 100;
  const membersWithExtra = ledger.filter(m => m.balance > 0);

  const averageUtilityShare = ledger.length > 0
    ? Math.round((totalMemberUtilityShareSum / ledger.length) * 100) / 100
    : 0;

  return {
    totalMembers: ledger.length,
    activeMemberCount: ledger.length,
    totalHouseRent,
    totalUtilities,
    utilitySharePerMember: averageUtilityShare,
    totalRentDue: totalPayableGrand,
    totalPayableGrand,
    totalRentPaid: totalCollected,
    totalCollected,
    totalRentRemaining: Math.round(totalDue * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
    totalSurplus: totalExtraToRefund,
    totalExtraToRefund,
    membersWithExtraCount: membersWithExtra.length,
    membersWithExtra,
    memberSummaries: ledger,
    ledger,
  };
};
