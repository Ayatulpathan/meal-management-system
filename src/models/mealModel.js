/**
 * Meal Data Model
 * Structure:
 * Path: months/{monthId}/meals/{memberId}
 * {
 *   memberId: string,
 *   meals: { [day: string]: number (0 to 10) },
 *   totalMeal: number,
 *   updatedAt: Timestamp | Date | string
 * }
 */

import { calculateMemberTotalMeals } from '../utils/calculations';

export const createMealModel = (memberId, meals = {}) => {
  const sanitizedMeals = {};
  Object.entries(meals).forEach(([day, count]) => {
    const num = Number(count);
    if (!isNaN(num) && num >= 0 && num <= 10) {
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
