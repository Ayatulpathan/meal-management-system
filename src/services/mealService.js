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
import { createMealModel, sanitizeMeal } from '../models/mealModel';
import { calculateMemberTotalMeals } from '../utils/calculations';

const LOCAL_STORAGE_KEY_PREFIX = 'mms_meals_';

const getLocalMealsKey = (monthId) => `${LOCAL_STORAGE_KEY_PREFIX}${monthId}`;

const getLocalMonthlyMeals = (monthId) => {
  const key = getLocalMealsKey(monthId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const saveLocalMonthlyMeals = (monthId, meals) => {
  localStorage.setItem(getLocalMealsKey(monthId), JSON.stringify(meals));
};

export const mealService = {
  /**
   * Subscribe to real-time meal updates for a specific month
   * Path: months/{monthId}/meals
   */
  subscribeMonthlyMeals(monthId, callback) {
    if (!monthId) return () => {};

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMonthlyMeals(monthId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const mealsRef = collection(db, 'months', monthId, 'meals');

    return onSnapshot(mealsRef, (snapshot) => {
      const meals = snapshot.docs.map(d => sanitizeMeal(d.id, d.data()));
      callback(meals);
    }, (error) => {
      console.warn(`Firestore meals listener fallback for month ${monthId}:`, error);
      callback(getLocalMonthlyMeals(monthId));
    });
  },

  /**
   * Fetch all meals for a month once
   */
  async getMonthlyMeals(monthId) {
    if (!monthId) return [];

    if (!isFirebaseConfigured()) {
      return getLocalMonthlyMeals(monthId);
    }

    try {
      const mealsRef = collection(db, 'months', monthId, 'meals');
      const snapshot = await getDocs(mealsRef);
      return snapshot.docs.map(d => sanitizeMeal(d.id, d.data()));
    } catch (err) {
      console.error(`Error fetching meals for month ${monthId}:`, err);
      return getLocalMonthlyMeals(monthId);
    }
  },

  /**
   * Update a single day's meal for a member in a specific month
   * Day count must be between 0 and 10.
   */
  async updateDayMeal(monthId, memberId, day, mealCount) {
    const numCount = Number(mealCount);
    if (isNaN(numCount) || numCount < 0 || numCount > 10) {
      throw new Error('Meal value must be between 0 and 10.');
    }

    const dayKey = String(day);

    if (!isFirebaseConfigured()) {
      const allMeals = getLocalMonthlyMeals(monthId);
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

      saveLocalMonthlyMeals(monthId, allMeals);
      window.dispatchEvent(new Event('storage'));
      return { memberId, meals: memberMeals };
    }

    try {
      const mealDocRef = doc(db, 'months', monthId, 'meals', memberId);
      const docSnap = await getDoc(mealDocRef);

      let currentMeals = {};
      if (docSnap.exists()) {
        currentMeals = docSnap.data().meals || {};
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

      await setDoc(mealDocRef, payload, { merge: true });
      return payload;
    } catch (err) {
      console.error(`Error updating meal for member ${memberId} on day ${day}:`, err);
      throw new Error('Unable to save meal entry.');
    }
  },

  /**
   * Set batch/bulk meals for a member
   */
  async saveMemberMeals(monthId, memberId, mealsObj) {
    const model = createMealModel(memberId, mealsObj);

    if (!isFirebaseConfigured()) {
      const allMeals = getLocalMonthlyMeals(monthId);
      const idx = allMeals.findIndex(m => m.memberId === memberId);
      if (idx !== -1) {
        allMeals[idx] = model;
      } else {
        allMeals.push(model);
      }
      saveLocalMonthlyMeals(monthId, allMeals);
      window.dispatchEvent(new Event('storage'));
      return model;
    }

    try {
      const mealDocRef = doc(db, 'months', monthId, 'meals', memberId);
      await setDoc(mealDocRef, model, { merge: true });
      return model;
    } catch (err) {
      console.error('Error saving member meals:', err);
      throw new Error('Unable to save member meals.');
    }
  }
};
