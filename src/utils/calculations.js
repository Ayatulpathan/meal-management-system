/**
 * Centralized Calculation Engine for Meal Management System
 * Adheres strictly to Sections 15–23 and 51–53 of the specification.
 */

/**
 * Calculates total market/grocery cost
 * @param {Array<{ amount: number }>} marketCosts 
 * @returns {number}
 */
export const calculateTotalMarketCost = (marketCosts = []) => {
  if (!Array.isArray(marketCosts)) return 0;
  return marketCosts.reduce((total, item) => {
    const amount = Number(item?.amount) || 0;
    return total + (amount > 0 ? amount : 0);
  }, 0);
};

/**
 * Calculates total meals for a single member from their daily meal object
 * @param {Record<string, number>} mealsObj e.g. { "1": 2, "2": 1, "3": 0 }
 * @returns {number}
 */
export const calculateMemberTotalMeals = (mealsObj = {}) => {
  if (!mealsObj || typeof mealsObj !== 'object') return 0;
  return Object.values(mealsObj).reduce((sum, val) => {
    const num = Number(val) || 0;
    return sum + ([0, 1, 2].includes(num) ? num : 0);
  }, 0);
};

/**
 * Calculates total meals across all members in a given month
 * @param {Array<{ meals?: Record<string, number>, totalMeal?: number }>} mealDocs 
 * @returns {number}
 */
export const calculateTotalMeals = (mealDocs = []) => {
  if (!Array.isArray(mealDocs)) return 0;
  return mealDocs.reduce((sum, doc) => {
    if (doc?.totalMeal !== undefined && typeof doc.totalMeal === 'number') {
      return sum + doc.totalMeal;
    }
    return sum + calculateMemberTotalMeals(doc?.meals || {});
  }, 0);
};

/**
 * Calculates cost per meal: Total Market Cost / Total Meal
 * Never divides by zero (returns 0 if Total Meal = 0).
 * @param {number} totalMarketCost 
 * @param {number} totalMeals 
 * @returns {number}
 */
export const calculateCostPerMeal = (totalMarketCost = 0, totalMeals = 0) => {
  const cost = Number(totalMarketCost) || 0;
  const meals = Number(totalMeals) || 0;
  if (meals <= 0 || cost <= 0) return 0;
  return Number((cost / meals).toFixed(4));
};

/**
 * Calculates total deposits for a specific member
 * @param {Array<{ memberId: string, amount: number }>} deposits 
 * @param {string} memberId 
 * @returns {number}
 */
export const calculateMemberTotalDeposit = (deposits = [], memberId) => {
  if (!Array.isArray(deposits) || !memberId) return 0;
  return deposits
    .filter(d => d.memberId === memberId)
    .reduce((sum, d) => sum + (Number(d?.amount) || 0), 0);
};

/**
 * Calculates total deposits across all members
 * @param {Array<{ amount: number }>} deposits 
 * @returns {number}
 */
export const calculateTotalDeposits = (deposits = []) => {
  if (!Array.isArray(deposits)) return 0;
  return deposits.reduce((sum, d) => sum + (Number(d?.amount) || 0), 0);
};

/**
 * Generates member summary objects for all members
 * @param {Array<{ id: string, name: string, status?: string }>} members 
 * @param {Array<{ memberId: string, meals: Record<string, number>, totalMeal?: number }>} mealDocs 
 * @param {Array<{ memberId: string, amount: number }>} deposits 
 * @param {number} costPerMeal 
 * @returns {Array<{ memberId: string, memberName: string, status: string, totalMeal: number, mealCost: number, totalDeposit: number, balance: number }>}
 */
export const calculateMemberSummaries = (members = [], mealDocs = [], deposits = [], costPerMeal = 0) => {
  if (!Array.isArray(members)) return [];

  // Map mealDocs by memberId
  const mealMap = new Map();
  mealDocs.forEach(doc => {
    if (doc?.memberId) {
      const totalMeal = doc.totalMeal !== undefined ? doc.totalMeal : calculateMemberTotalMeals(doc.meals || {});
      mealMap.set(doc.memberId, { meals: doc.meals || {}, totalMeal });
    }
  });

  return members.map(member => {
    const memberId = member.id;
    const memberName = member.name || 'Unknown Member';
    const memberStatus = member.status || 'active';

    const mealData = mealMap.get(memberId) || { meals: {}, totalMeal: 0 };
    const totalMeal = mealData.totalMeal;
    const mealCost = Number((totalMeal * costPerMeal).toFixed(2));
    const totalDeposit = calculateMemberTotalDeposit(deposits, memberId);
    const balance = Number((totalDeposit - mealCost).toFixed(2));

    return {
      memberId,
      memberName,
      status: memberStatus,
      meals: mealData.meals,
      totalMeal,
      mealCost,
      totalDeposit,
      balance,
    };
  });
};

/**
 * Calculates daily meal totals for each day of the month
 * @param {Array<{ meals?: Record<string, number> }>} mealDocs 
 * @param {number} totalDays e.g. 30
 * @returns {Record<string, number>}
 */
export const calculateDailyMealTotals = (mealDocs = [], totalDays = 30) => {
  const dailyTotals = {};
  for (let day = 1; day <= totalDays; day++) {
    const dayKey = String(day);
    dailyTotals[dayKey] = 0;
  }

  mealDocs.forEach(doc => {
    const meals = doc?.meals || {};
    Object.entries(meals).forEach(([dayKey, count]) => {
      const num = Number(count) || 0;
      if (dailyTotals[dayKey] !== undefined && [0, 1, 2].includes(num)) {
        dailyTotals[dayKey] += num;
      }
    });
  });

  return dailyTotals;
};

/**
 * Generates the complete monthly summary object for Dashboard and Reports
 * @param {Array} members 
 * @param {Array} mealDocs 
 * @param {Array} marketCosts 
 * @param {Array} deposits 
 * @returns {{
 *   totalMembers: number,
 *   totalMeals: number,
 *   totalMarketCost: number,
 *   costPerMeal: number,
 *   totalDeposits: number,
 *   totalOutstanding: number,
 *   totalSurplus: number,
 *   memberSummaries: Array
 * }}
 */
export const calculateMonthlySummary = (members = [], mealDocs = [], marketCosts = [], deposits = []) => {
  const totalMarketCost = calculateTotalMarketCost(marketCosts);
  const totalMeals = calculateTotalMeals(mealDocs);
  const costPerMeal = calculateCostPerMeal(totalMarketCost, totalMeals);
  const totalDeposits = calculateTotalDeposits(deposits);

  const memberSummaries = calculateMemberSummaries(members, mealDocs, deposits, costPerMeal);

  // Total outstanding is the sum of all negative balances (what members owe)
  const totalOutstanding = memberSummaries
    .filter(m => m.balance < 0)
    .reduce((sum, m) => sum + Math.abs(m.balance), 0);

  // Total surplus is the sum of all positive balances
  const totalSurplus = memberSummaries
    .filter(m => m.balance > 0)
    .reduce((sum, m) => sum + m.balance, 0);

  return {
    totalMembers: members.length,
    totalMeals,
    totalMarketCost,
    costPerMeal,
    totalDeposits,
    totalOutstanding: Number(totalOutstanding.toFixed(2)),
    totalSurplus: Number(totalSurplus.toFixed(2)),
    memberSummaries,
  };
};
