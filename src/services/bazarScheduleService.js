import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  isFirebaseConfigured
} from './firebase';
import {
  createBazarScheduleModel,
  sanitizeBazarSchedule,
  BAZAR_DUTY_STATUS
} from '../models/bazarScheduleModel';

const BAZAR_SCHEDULE_STORAGE_PREFIX = 'mms_bazar_schedule_';
const getStorageKey = (monthId) => `${BAZAR_SCHEDULE_STORAGE_PREFIX}${monthId}`;

// Seed initial default demo schedules for active month when in local storage mode
const getLocalSchedules = (monthId) => {
  const key = getStorageKey(monthId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    // Generate a couple of demo duties for the current month
    const [year, month] = (monthId || '2026-10').split('-');
    const initial = [
      {
        id: 'sch_demo_01',
        monthId,
        date: `${year}-${month}-02`,
        memberId: 'm1',
        memberName: 'Rahim',
        memberPhone: '01711000001',
        notes: 'Fish, Rice, and green vegetables',
        estimatedBudget: 2500,
        status: BAZAR_DUTY_STATUS.COMPLETED,
        assignedBy: 'Administrator',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sch_demo_02',
        monthId,
        date: `${year}-${month}-05`,
        memberId: 'm2',
        memberName: 'Karim',
        memberPhone: '01811000002',
        notes: 'Chicken, Dal, Spices, and Cooking Oil',
        estimatedBudget: 3000,
        status: BAZAR_DUTY_STATUS.PENDING,
        assignedBy: 'Administrator',
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const saveLocalSchedules = (monthId, schedules) => {
  localStorage.setItem(getStorageKey(monthId), JSON.stringify(schedules));
};

export const bazarScheduleService = {
  /**
   * Real-time subscription to monthly bazar schedules
   * @param {string} monthId 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe
   */
  subscribeBazarSchedule(monthId, callback) {
    if (!monthId) return () => {};

    if (!isFirebaseConfigured()) {
      const load = () => {
        const list = getLocalSchedules(monthId);
        list.sort((a, b) => (a.date > b.date ? 1 : -1));
        callback(list);
      };
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    try {
      const schedRef = collection(db, 'bazarSchedules');
      const q = query(
        schedRef,
        where('monthId', '==', monthId),
        orderBy('date', 'asc')
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((docSnap) =>
            sanitizeBazarSchedule(docSnap.id, docSnap.data())
          );
          items.sort((a, b) => (a.date > b.date ? 1 : -1));
          callback(items);
        },
        (error) => {
          console.error('Error listening to bazar schedules:', error);
          callback(getLocalSchedules(monthId));
        }
      );
    } catch (err) {
      console.error('Error initiating bazar schedules listener:', err);
      callback(getLocalSchedules(monthId));
      return () => {};
    }
  },

  /**
   * Add a new bazar duty schedule
   * @param {Object} scheduleData 
   * @returns {Promise<Object>}
   */
  async addSchedule(scheduleData) {
    const model = createBazarScheduleModel(scheduleData);

    if (!isFirebaseConfigured()) {
      const list = getLocalSchedules(model.monthId);
      const newItem = {
        id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...model,
      };
      list.push(newItem);
      saveLocalSchedules(model.monthId, list);
      return { success: true, id: newItem.id, data: newItem };
    }

    try {
      const docRef = await addDoc(collection(db, 'bazarSchedules'), model);
      return { success: true, id: docRef.id, data: model };
    } catch (err) {
      console.error('Error adding bazar schedule:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Update an existing bazar schedule
   * @param {string} scheduleId 
   * @param {Object} updateData 
   * @returns {Promise<Object>}
   */
  async updateSchedule(scheduleId, updateData) {
    if (!isFirebaseConfigured()) {
      const monthId = updateData.monthId;
      const list = getLocalSchedules(monthId);
      const index = list.findIndex((item) => item.id === scheduleId);
      if (index !== -1) {
        list[index] = {
          ...list[index],
          ...updateData,
          updatedAt: new Date().toISOString(),
        };
        saveLocalSchedules(monthId, list);
        return { success: true };
      }
      return { success: false, error: 'Schedule item not found' };
    }

    try {
      const docRef = doc(db, 'bazarSchedules', scheduleId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (err) {
      console.error('Error updating bazar schedule:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Delete a bazar schedule entry
   * @param {string} scheduleId 
   * @param {string} monthId 
   * @returns {Promise<Object>}
   */
  async deleteSchedule(scheduleId, monthId) {
    if (!isFirebaseConfigured()) {
      const list = getLocalSchedules(monthId);
      const filtered = list.filter((item) => item.id !== scheduleId);
      saveLocalSchedules(monthId, filtered);
      return { success: true };
    }

    try {
      await deleteDoc(doc(db, 'bazarSchedules', scheduleId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting bazar schedule:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Toggle status between pending and completed
   * @param {string} scheduleId 
   * @param {string} currentStatus 
   * @param {string} monthId 
   * @returns {Promise<Object>}
   */
  async toggleStatus(scheduleId, currentStatus, monthId) {
    const nextStatus =
      currentStatus === BAZAR_DUTY_STATUS.COMPLETED
        ? BAZAR_DUTY_STATUS.PENDING
        : BAZAR_DUTY_STATUS.COMPLETED;

    return this.updateSchedule(scheduleId, {
      status: nextStatus,
      monthId,
    });
  },

  /**
   * Auto-rotate bazar duties among active members for a date range
   * @param {Object} params
   * @param {string} params.monthId
   * @param {number} params.startDay (1-31)
   * @param {number} params.endDay (1-31)
   * @param {number} [params.intervalDays=2]
   * @param {Array} params.selectedMembers [{ id, name, phone }]
   * @param {string} [params.assignedBy='Administrator']
   * @returns {Promise<Object>}
   */
  async autoRotateSchedule({
    monthId,
    startDay = 1,
    endDay = 31,
    intervalDays = 2,
    selectedMembers = [],
    assignedBy = 'Administrator',
  }) {
    if (!selectedMembers || selectedMembers.length === 0) {
      return { success: false, error: 'No members selected for duty rotation.' };
    }

    const [year, month] = monthId.split('-');
    const generated = [];
    let memberIndex = 0;

    for (let day = startDay; day <= endDay; day += intervalDays) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      const member = selectedMembers[memberIndex % selectedMembers.length];

      generated.push(
        createBazarScheduleModel({
          monthId,
          date: dateStr,
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone || '',
          notes: 'Regular scheduled mess bazar',
          status: BAZAR_DUTY_STATUS.PENDING,
          assignedBy,
        })
      );

      memberIndex++;
    }

    if (!isFirebaseConfigured()) {
      const currentList = getLocalSchedules(monthId);
      const combined = [
        ...currentList,
        ...generated.map((item) => ({
          id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          ...item,
        })),
      ];
      saveLocalSchedules(monthId, combined);
      return { success: true, count: generated.length };
    }

    try {
      const batchPromises = generated.map((item) =>
        addDoc(collection(db, 'bazarSchedules'), item)
      );
      await Promise.all(batchPromises);
      return { success: true, count: generated.length };
    } catch (err) {
      console.error('Error generating auto-rotated bazar schedule:', err);
      return { success: false, error: err.message };
    }
  },
};
