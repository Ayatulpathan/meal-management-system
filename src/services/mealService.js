import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  isFirebaseConfigured
} from './firebase';
import {
  getMessCollection,
  getMessDoc,
  getRootCollection,
  getRootDoc,
  setMessDocData
} from './dbPaths';
import { createMealModel, sanitizeMeal } from '../models/mealModel';
import { calculateMemberTotalMeals } from '../utils/calculations';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

const LOCAL_STORAGE_KEY_PREFIX = 'mms_meals_';

const getLocalMealsKey = (monthId, messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
  return `${LOCAL_STORAGE_KEY_PREFIX}${targetMessId}_${cleanMonth}`;
};

const getLocalMonthlyMeals = (monthId, messId = DEFAULT_MESS_ID) => {
  const key = getLocalMealsKey(monthId, messId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    // Check un-prefixed fallback key for backwards compatibility
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
    const legacyKey = `${LOCAL_STORAGE_KEY_PREFIX}${cleanMonth}`;
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

const saveLocalMonthlyMeals = (monthId, meals, messId = DEFAULT_MESS_ID) => {
  localStorage.setItem(getLocalMealsKey(monthId, messId), JSON.stringify(meals));
};

export const mealService = {
  /**
   * Subscribe to real-time meal updates for a specific month in a mess
   * Path: messes/{messId}/months/{monthId}/meals
   */
  subscribeMonthlyMeals(monthId, callback, messId) {
    if (!monthId) return () => {};
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMonthlyMeals(cleanMonth, targetMessId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const mealsRef = getMessCollection(targetMessId, 'months', cleanMonth, 'meals');

    return onSnapshot(mealsRef, (snapshot) => {
      if (!snapshot.empty) {
        const meals = snapshot.docs.map(d => sanitizeMeal(d.id, d.data()));
        saveLocalMonthlyMeals(cleanMonth, meals, targetMessId);
        callback(meals);
        return;
      }

      // If Khadok Mess and empty, fallback to root months/{cleanMonth}/meals
      if (targetMessId === DEFAULT_MESS_ID) {
        getDocs(getRootCollection('months', cleanMonth, 'meals'))
          .then((rootSnap) => {
            if (!rootSnap.empty) {
              const rootMeals = rootSnap.docs.map(d => sanitizeMeal(d.id, d.data()));
              saveLocalMonthlyMeals(cleanMonth, rootMeals, DEFAULT_MESS_ID);
              callback(rootMeals);
            } else {
              callback([]);
            }
          })
          .catch(() => callback(getLocalMonthlyMeals(cleanMonth, targetMessId)));
        return;
      }

      callback([]);
    }, (error) => {
      console.warn(`Firestore meals listener fallback for month ${cleanMonth}:`, error);
      callback(getLocalMonthlyMeals(cleanMonth, targetMessId));
    });
  },

  /**
   * Fetch all meals for a month once
   */
  async getMonthlyMeals(monthId, messId) {
    if (!monthId) return [];
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      return getLocalMonthlyMeals(cleanMonth, targetMessId);
    }

    try {
      const mealsRef = getMessCollection(targetMessId, 'months', cleanMonth, 'meals');
      const snapshot = await getDocs(mealsRef);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => sanitizeMeal(d.id, d.data()));
      }

      if (targetMessId === DEFAULT_MESS_ID) {
        const rootSnap = await getDocs(getRootCollection('months', cleanMonth, 'meals'));
        if (!rootSnap.empty) {
          return rootSnap.docs.map(d => sanitizeMeal(d.id, d.data()));
        }
      }

      return [];
    } catch (err) {
      console.error(`Error fetching meals for month ${cleanMonth}:`, err);
      return getLocalMonthlyMeals(cleanMonth, targetMessId);
    }
  },

  /**
   * Update a single day's meal for a member in a specific month
   */
  async updateDayMeal(monthId, memberId, day, mealCount, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;

    const numCount = Number(mealCount);
    if (isNaN(numCount) || numCount < 0 || numCount > 10) {
      throw new Error('Meal value must be between 0 and 10.');
    }

    const dayKey = String(day);

    if (!isFirebaseConfigured()) {
      const allMeals = getLocalMonthlyMeals(cleanMonth, targetMessId);
      const memberIndex = allMeals.findIndex(m => m.memberId === memberId);

      let memberMeals = {};
      if (memberIndex !== -1) {
        memberMeals = { ...allMeals[memberIndex].meals, [dayKey]: numCount };
        const total = calculateMemberTotalMeals(memberMeals);
        allMeals[memberIndex] = {
          memberId,
          meals: memberMeals,
          totalMeal: total,
          updatedAt: new Date().toISOString(),
        };
      } else {
        memberMeals = { [dayKey]: numCount };
        allMeals.push({
          memberId,
          meals: memberMeals,
          totalMeal: numCount,
          updatedAt: new Date().toISOString(),
        });
      }

      saveLocalMonthlyMeals(cleanMonth, allMeals, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return { memberId, meals: memberMeals };
    }

    try {
      const mealDocRef = getMessDoc(targetMessId, 'months', cleanMonth, 'meals', memberId);
      const docSnap = await getDoc(mealDocRef);

      let currentMeals = {};
      if (docSnap.exists()) {
        currentMeals = docSnap.data().meals || {};
      } else if (targetMessId === DEFAULT_MESS_ID) {
        const rootSnap = await getDoc(getRootDoc('months', cleanMonth, 'meals', memberId));
        if (rootSnap.exists()) {
          currentMeals = rootSnap.data().meals || {};
        }
      }

      const updatedMeals = {
        ...currentMeals,
        [dayKey]: numCount,
      };

      const newTotal = calculateMemberTotalMeals(updatedMeals);

      const payload = {
        memberId,
        meals: updatedMeals,
        totalMeal: newTotal,
        updatedAt: new Date().toISOString(),
      };

      // Dual-write: updates messes/{messId}/months/{cleanMonth}/meals/{memberId} (and root if Khadok)
      await setMessDocData(targetMessId, ['months', cleanMonth, 'meals', memberId], payload);
      return payload;
    } catch (err) {
      console.error(`Error updating meal for member ${memberId} on day ${day}:`, err);
      throw new Error('Unable to save meal entry.');
    }
  },

  /**
   * Set batch/bulk meals for a member
   */
  async saveMemberMeals(monthId, memberId, mealsObj, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
    const model = createMealModel(memberId, mealsObj);

    if (!isFirebaseConfigured()) {
      const allMeals = getLocalMonthlyMeals(cleanMonth, targetMessId);
      const idx = allMeals.findIndex(m => m.memberId === memberId);
      if (idx !== -1) {
        allMeals[idx] = model;
      } else {
        allMeals.push(model);
      }
      saveLocalMonthlyMeals(cleanMonth, allMeals, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return model;
    }

    try {
      await setMessDocData(targetMessId, ['months', cleanMonth, 'meals', memberId], model);
      return model;
    } catch (err) {
      console.error('Error saving member meals:', err);
      throw new Error('Unable to save member meals.');
    }
  }
};
