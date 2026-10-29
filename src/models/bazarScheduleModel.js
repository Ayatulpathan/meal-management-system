/**
 * Bazar Schedule (বাজার শিডিউল) Data Model
 * Tracks which member is assigned to market/grocery duty on specific dates.
 */

export const BAZAR_DUTY_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const createBazarScheduleModel = (data = {}) => {
  return {
    monthId: data.monthId || '',
    date: data.date || '', // YYYY-MM-DD
    memberId: data.memberId || '',
    memberName: data.memberName?.trim() || '',
    memberPhone: data.memberPhone?.trim() || '',
    notes: data.notes?.trim() || '',
    estimatedBudget: Number(data.estimatedBudget) || 0,
    status: data.status || BAZAR_DUTY_STATUS.PENDING,
    assignedBy: data.assignedBy || 'Administrator',
    autoNotified: Boolean(data.autoNotified) || false,
    autoNotifiedAt: data.autoNotifiedAt || null,
    notificationStatus: data.notificationStatus || 'none',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const sanitizeBazarSchedule = (id, data = {}) => {
  return {
    id,
    monthId: data.monthId || '',
    date: data.date || '',
    memberId: data.memberId || '',
    memberName: data.memberName || 'Unnamed Member',
    memberPhone: data.memberPhone || '',
    notes: data.notes || '',
    estimatedBudget: Number(data.estimatedBudget) || 0,
    status: data.status || BAZAR_DUTY_STATUS.PENDING,
    assignedBy: data.assignedBy || 'Administrator',
    autoNotified: Boolean(data.autoNotified) || false,
    autoNotifiedAt: data.autoNotifiedAt || null,
    notificationStatus: data.notificationStatus || 'none',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};
