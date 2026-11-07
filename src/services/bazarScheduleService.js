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
  getMessCollection,
  getMessDoc,
  getRootCollection,
  getRootDoc,
  addMessDocData,
  updateMessDocData,
  deleteMessDocData
} from './dbPaths';
import {
  createBazarScheduleModel,
  sanitizeBazarSchedule,
  BAZAR_DUTY_STATUS
} from '../models/bazarScheduleModel';
import { getCurrentMonthId } from '../utils/dateUtils';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

const BAZAR_SCHEDULE_STORAGE_PREFIX = 'mms_bazar_schedule_';

const getStorageKey = (monthId, messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const activeMonth = monthId || getCurrentMonthId();
  const cleanMonth = activeMonth.includes('_') ? activeMonth.split('_').pop() : activeMonth;
  return `${BAZAR_SCHEDULE_STORAGE_PREFIX}${targetMessId}_${cleanMonth}`;
};

const getLocalSchedules = (monthId, messId = DEFAULT_MESS_ID) => {
  const activeMonth = monthId || getCurrentMonthId();
  const cleanMonth = activeMonth.includes('_') ? activeMonth.split('_').pop() : activeMonth;
  const key = getStorageKey(cleanMonth, messId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    const legacyKey = `${BAZAR_SCHEDULE_STORAGE_PREFIX}${cleanMonth}`;
    const legacyStored = localStorage.getItem(legacyKey);
    if (legacyStored && (messId === DEFAULT_MESS_ID || !messId)) {
      try { return JSON.parse(legacyStored); } catch (e) { return []; }
    }
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const saveLocalSchedules = (monthId, list, messId = DEFAULT_MESS_ID) => {
  const activeMonth = monthId || getCurrentMonthId();
  const cleanMonth = activeMonth.includes('_') ? activeMonth.split('_').pop() : activeMonth;
  localStorage.setItem(getStorageKey(cleanMonth, messId), JSON.stringify(list));
};

export const bazarScheduleService = {
  /**
   * Subscribe to real-time bazar duties for an active month in a mess
   * Path: messes/{messId}/months/{activeMonth}/bazarSchedules
   */
  subscribeBazarSchedule(activeMonth, callback, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = (activeMonth || getCurrentMonthId()).includes('_') 
      ? (activeMonth || getCurrentMonthId()).split('_').pop() 
      : (activeMonth || getCurrentMonthId());

    if (!isFirebaseConfigured()) {
      const load = () => {
        const list = getLocalSchedules(cleanMonth, targetMessId);
        list.sort((a, b) => (a.date > b.date ? 1 : -1));
        callback(list);
      };
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    try {
      const schedRef = getMessCollection(targetMessId, 'months', cleanMonth, 'bazarSchedules');
      const q = query(schedRef, orderBy('date', 'asc'));

      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((docSnap) =>
              sanitizeBazarSchedule(docSnap.id, docSnap.data())
            );
            items.sort((a, b) => (a.date > b.date ? 1 : -1));
            saveLocalSchedules(cleanMonth, items, targetMessId);
            callback(items);
            return;
          }

          if (targetMessId === DEFAULT_MESS_ID) {
            getDocs(query(getRootCollection('months', cleanMonth, 'bazarSchedules'), orderBy('date', 'asc')))
              .then((rootSnap) => {
                if (!rootSnap.empty) {
                  const rootItems = rootSnap.docs.map((docSnap) =>
                    sanitizeBazarSchedule(docSnap.id, docSnap.data())
                  );
                  rootItems.sort((a, b) => (a.date > b.date ? 1 : -1));
                  saveLocalSchedules(cleanMonth, rootItems, DEFAULT_MESS_ID);
                  callback(rootItems);
                } else {
                  callback([]);
                }
              })
              .catch(() => callback(getLocalSchedules(cleanMonth, targetMessId)));
            return;
          }

          callback([]);
        },
        (error) => {
          console.error('Error listening to bazar schedules:', error);
          callback(getLocalSchedules(cleanMonth, targetMessId));
        }
      );
    } catch (err) {
      console.error('Error initiating bazar schedules listener:', err);
      callback(getLocalSchedules(cleanMonth, targetMessId));
      return () => {};
    }
  },

  /**
   * Add a new bazar duty schedule
   */
  async addSchedule(scheduleData, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const model = createBazarScheduleModel(scheduleData);
    const targetMonth = (model.monthId || getCurrentMonthId()).includes('_')
      ? (model.monthId || getCurrentMonthId()).split('_').pop()
      : (model.monthId || getCurrentMonthId());

    if (!isFirebaseConfigured()) {
      const list = getLocalSchedules(targetMonth, targetMessId);
      const newItem = {
        id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ...model,
        monthId: targetMonth,
      };
      list.push(newItem);
      saveLocalSchedules(targetMonth, list, targetMessId);
      return { success: true, id: newItem.id, data: newItem };
    }

    try {
      const docRef = await addMessDocData(targetMessId, ['months', targetMonth, 'bazarSchedules'], model);
      return { success: true, id: docRef.id, data: model };
    } catch (err) {
      console.error('Error adding bazar schedule:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Update an existing bazar schedule
   */
  async updateSchedule(scheduleId, updateData, activeMonth, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const monthId = (updateData.monthId || activeMonth || getCurrentMonthId()).includes('_')
      ? (updateData.monthId || activeMonth || getCurrentMonthId()).split('_').pop()
      : (updateData.monthId || activeMonth || getCurrentMonthId());

    if (!isFirebaseConfigured()) {
      const list = getLocalSchedules(monthId, targetMessId);
      const idx = list.findIndex((item) => item.id === scheduleId);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...updateData,
          updatedAt: new Date().toISOString(),
        };
        saveLocalSchedules(monthId, list, targetMessId);
        return { success: true, data: list[idx] };
      }
      return { success: false, error: 'Schedule not found' };
    }

    try {
      await updateMessDocData(targetMessId, ['months', monthId, 'bazarSchedules', scheduleId], {
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
   */
  async deleteSchedule(scheduleId, monthId, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const activeMonth = (monthId || getCurrentMonthId()).includes('_')
      ? (monthId || getCurrentMonthId()).split('_').pop()
      : (monthId || getCurrentMonthId());

    if (!isFirebaseConfigured()) {
      const list = getLocalSchedules(activeMonth, targetMessId);
      const filtered = list.filter((item) => item.id !== scheduleId);
      saveLocalSchedules(activeMonth, filtered, targetMessId);
      return { success: true };
    }

    try {
      await deleteMessDocData(targetMessId, ['months', activeMonth, 'bazarSchedules', scheduleId]);
      return { success: true };
    } catch (err) {
      console.error('Error deleting bazar schedule:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Toggle status between pending and completed
   */
  async toggleStatus(scheduleId, currentStatus, monthId, messId) {
    const nextStatus =
      currentStatus === BAZAR_DUTY_STATUS.COMPLETED
        ? BAZAR_DUTY_STATUS.PENDING
        : BAZAR_DUTY_STATUS.COMPLETED;

    return this.updateSchedule(scheduleId, {
      status: nextStatus,
      monthId: monthId || getCurrentMonthId(),
    }, monthId, messId);
  },

  /**
   * Auto-rotate bazar duties among active members for a date range
   */
  async autoRotateSchedule({
    monthId,
    startDay = 1,
    endDay = 31,
    intervalDays = 2,
    selectedMembers = [],
    assignedBy = 'Administrator',
    messId
  }) {
    if (!selectedMembers || selectedMembers.length === 0) {
      return { success: false, error: 'No members selected for duty rotation.' };
    }

    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const rawMonth = monthId || getCurrentMonthId();
    const activeMonth = rawMonth.includes('_') ? rawMonth.split('_').pop() : rawMonth;
    const [year, month] = activeMonth.split('-');
    const generated = [];
    let memberIndex = 0;

    for (let day = startDay; day <= endDay; day += intervalDays) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      const member = selectedMembers[memberIndex % selectedMembers.length];

      generated.push(
        createBazarScheduleModel({
          monthId: activeMonth,
          date: dateStr,
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone || '',
          memberEmail: member.email || '',
          notes: 'Regular scheduled mess bazar',
          status: BAZAR_DUTY_STATUS.PENDING,
          assignedBy,
        })
      );

      memberIndex++;
    }

    if (!isFirebaseConfigured()) {
      const currentList = getLocalSchedules(activeMonth, targetMessId);
      const combined = [
        ...currentList,
        ...generated.map((item) => ({
          id: `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          ...item,
        })),
      ];
      saveLocalSchedules(activeMonth, combined, targetMessId);
      return { success: true, count: generated.length };
    }

    try {
      const batchPromises = generated.map((item) => 
        addMessDocData(targetMessId, ['months', activeMonth, 'bazarSchedules'], item)
      );
      await Promise.all(batchPromises);
      return { success: true, count: generated.length };
    } catch (err) {
      console.error('Error generating auto-rotated bazar schedule:', err);
      return { success: false, error: err.message };
    }
  },
};
