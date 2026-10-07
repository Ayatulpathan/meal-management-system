/**
 * House Rent & Utility Calculation Engine
 * Completely isolated from meal rate and grocery accounting.
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
 * Calculates individual utility share per active member
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
 * Calculates individual member rent & utility statement
 * @param {Array} members 
 * @param {Object} memberRentsMap { [memberId]: number | { seatRent: number, room: string } }
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
  const totalUtilities = calculateTotalUtilities(utilityBills);
  const utilityShare = calculateUtilitySharePerMember(totalUtilities, activeMembers.length);

  return activeMembers.map((member) => {
    let seatRent = 0;
    let room = member.room || '';

    const rentConfig = memberRentsMap?.[member.id];
    if (typeof rentConfig === 'number') {
      seatRent = rentConfig;
    } else if (rentConfig && typeof rentConfig === 'object') {
      seatRent = Number(rentConfig.seatRent) || 0;
      if (rentConfig.room) room = rentConfig.room;
    } else if (member.rent !== undefined || member.defaultRent !== undefined) {
      seatRent = Number(member.rent || member.defaultRent || 0);
    }

    const totalPayable = Math.round((seatRent + utilityShare) * 100) / 100;
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

    return {
      id: member.id,
      memberId: member.id,
      name: member.name,
      memberName: member.name,
      phone: member.phone || '',
      room,
      seatRent,
      utilityShare,
      totalDue: totalPayable,
      totalPayable,
      rentPaid: totalPaid,
      totalPaid,
      balance,
      dueRemaining,
      advanceAmount,
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
  const totalPayableGrand = Math.round((totalHouseRent + totalUtilities) * 100) / 100;
  const totalCollected = Array.isArray(rentPayments)
    ? rentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    : 0;
  
  const totalDue = ledger.reduce((sum, m) => (m.balance < 0 ? sum + Math.abs(m.balance) : sum), 0);
  const totalSurplus = ledger.reduce((sum, m) => (m.balance > 0 ? sum + m.balance : sum), 0);
  const utilityShare = ledger.length > 0 ? ledger[0].utilityShare : 0;

  return {
    totalMembers: ledger.length,
    activeMemberCount: ledger.length,
    totalHouseRent,
    totalUtilities,
    utilitySharePerMember: utilityShare,
    totalRentDue: totalPayableGrand,
    totalPayableGrand,
    totalRentPaid: totalCollected,
    totalCollected,
    totalRentRemaining: Math.round(totalDue * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
    totalSurplus: Math.round(totalSurplus * 100) / 100,
    memberSummaries: ledger,
    ledger,
  };
};
