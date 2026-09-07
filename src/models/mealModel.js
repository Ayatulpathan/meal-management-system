/**
 * Meal Data Model
 * Structure:
 * Path: months/{monthId}/meals/{memberId}
 * {
 *   memberId: string,
 *   meals: { [day: string]: 0 | 1 | 2 },
 *   totalMeal: number,
 *   updatedAt: Timestamp | Date | string
 * }
 */

import { calculateMemberTotalMeals } from '../utils/calculations';

export const createMealModel = (memberId, meals = {}) => {
  const sanitizedMeals = {};
  Object.entries(meals).forEach(([day, count]) => {
    const num = Number(count);
    if ([0, 1, 2].includes(num)) {
      sanitizedMeals[String(day)] = num;
    }
  });

  return {
    memberId,
    meals: sanitizedMeals,
    totalMeal: calculateMemberTotalMeals(sanitizedMeals),
    updatedAt: new Date().toISOString(),
  };
};

export const sanitizeMeal = (memberId, data = {}) => {
  const meals = data.meals || {};
  return {
    memberId,
    meals,
    totalMeal: data.totalMeal !== undefined ? data.totalMeal : calculateMemberTotalMeals(meals),
    updatedAt: data.updatedAt || null,
  };
};
