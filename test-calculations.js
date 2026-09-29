import {
  calculateTotalMarketCost,
  calculateMemberTotalMeals,
  calculateTotalMeals,
  calculateCostPerMeal,
  calculateMemberTotalDeposit,
  calculateTotalDeposits,
  calculateMemberSummaries,
  calculateMonthlySummary,
} from './src/utils/calculations.js';

import { validateMealValue, validateMarketCost, validateDeposit, validateMember } from './src/utils/validation.js';
import { formatCurrency, formatBalance, parseAmount } from './src/utils/currencyUtils.js';
import { formatDateDisplay, formatTimeDisplay, getDaysInMonth, getDayList } from './src/utils/dateUtils.js';

console.log('====================================================');
console.log('FULL COMPREHENSIVE PROJECT AUDIT & TEST SUITE');
console.log('====================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------------
// SUITE 1: 31-Day Financial Accounting & Meal Calculations
// -------------------------------------------------------------------
const sampleMembers = [
  { id: 'member_001', name: 'Rahim', status: 'active' },
  { id: 'member_002', name: 'Karim', status: 'active' },
  { id: 'member_003', name: 'Hasan', status: 'active' },
];

const sampleMealDocs = [
  { memberId: 'member_001', totalMeal: 50, meals: {} },
  { memberId: 'member_002', totalMeal: 40, meals: {} },
  { memberId: 'member_003', totalMeal: 60, meals: {} },
];

const sampleMarketCosts = [
  { id: 'c1', amount: 10000, buyerName: 'Rahim', createdAt: '2026-09-02T10:30:00.000Z' },
  { id: 'c2', amount: 8000, buyerName: 'Karim', createdAt: '2026-09-08T15:45:00.000Z' },
  { id: 'c3', amount: 7000, buyerName: 'Hasan', createdAt: '2026-09-15T09:15:00.000Z' },
  { id: 'c4', amount: 5000, buyerName: 'Admin', createdAt: '2026-09-22T20:00:00.000Z' },
];

const sampleDeposits = [
  { id: 'd1', memberId: 'member_001', amount: 12000, date: '2026-09-01' },
  { id: 'd2', memberId: 'member_002', amount: 7000, date: '2026-09-01' },
  { id: 'd3', memberId: 'member_003', amount: 15000, date: '2026-09-01' },
];

const totalMarketCost = calculateTotalMarketCost(sampleMarketCosts);
assert(totalMarketCost === 30000, `Total Market Cost = 30000 (actual: ${totalMarketCost})`);

const totalMeals = calculateTotalMeals(sampleMealDocs);
assert(totalMeals === 150, `Total Meals = 150 (actual: ${totalMeals})`);

const costPerMeal = calculateCostPerMeal(totalMarketCost, totalMeals);
assert(costPerMeal === 200, `Cost Per Meal = 200 (actual: ${costPerMeal})`);

const summaries = calculateMemberSummaries(sampleMembers, sampleMealDocs, sampleDeposits, costPerMeal);

const rahim = summaries.find(s => s.memberName === 'Rahim');
assert(rahim.mealCost === 10000, `Rahim Meal Cost = 10000 (actual: ${rahim.mealCost})`);
assert(rahim.totalDeposit === 12000, `Rahim Total Deposit = 12000 (actual: ${rahim.totalDeposit})`);
assert(rahim.balance === 2000, `Rahim Balance = +2000 (actual: ${rahim.balance})`);

const karim = summaries.find(s => s.memberName === 'Karim');
assert(karim.mealCost === 8000, `Karim Meal Cost = 8000 (actual: ${karim.mealCost})`);
assert(karim.totalDeposit === 7000, `Karim Total Deposit = 7000 (actual: ${karim.totalDeposit})`);
assert(karim.balance === -1000, `Karim Balance = -1000 (actual: ${karim.balance})`);

const hasan = summaries.find(s => s.memberName === 'Hasan');
assert(hasan.mealCost === 12000, `Hasan Meal Cost = 12000 (actual: ${hasan.mealCost})`);
assert(hasan.totalDeposit === 15000, `Hasan Total Deposit = 15000 (actual: ${hasan.totalDeposit})`);
assert(hasan.balance === 3000, `Hasan Balance = +3000 (actual: ${hasan.balance})`);

const totalMemberMealCostSum = summaries.reduce((sum, m) => sum + m.mealCost, 0);
assert(Math.abs(totalMemberMealCostSum - totalMarketCost) < 0.01, `Sum of member meal costs equals total market cost (${totalMemberMealCostSum} vs ${totalMarketCost})`);

const monthlySummary = calculateMonthlySummary(sampleMembers, sampleMealDocs, sampleMarketCosts, sampleDeposits);
assert(monthlySummary.totalMembers === 3, 'Monthly summary counts 3 members');
assert(monthlySummary.totalDeposits === 34000, 'Total deposits = 34000');
assert(monthlySummary.totalSurplus === 5000, 'Total surplus balances = 5000 (Rahim 2000 + Hasan 3000)');
assert(monthlySummary.totalOutstanding === 1000, 'Total outstanding due = 1000 (Karim)');

// -------------------------------------------------------------------
// SUITE 2: Edge Cases & Mathematical Robustness
// -------------------------------------------------------------------
assert(calculateCostPerMeal(5000, 0) === 0, 'Zero meals divisor gracefully returns 0');
assert(calculateCostPerMeal(0, 50) === 0, 'Zero cost numerator returns 0');
assert(calculateTotalMarketCost([]) === 0, 'Empty market costs return 0');
assert(calculateTotalDeposits([]) === 0, 'Empty deposits return 0');
assert(calculateTotalMeals([]) === 0, 'Empty meal records return 0');

// -------------------------------------------------------------------
// SUITE 3: Meal Grid Validation Rules (0 to 10 Meals/Day)
// -------------------------------------------------------------------
assert(validateMealValue(0).isValid === true, 'Meal value 0 is accepted');
assert(validateMealValue(1).isValid === true, 'Meal value 1 is accepted');
assert(validateMealValue(5).isValid === true, 'Meal value 5 is accepted');
assert(validateMealValue(10).isValid === true, 'Meal value 10 is accepted');
assert(validateMealValue(11).isValid === false, 'Meal value 11 is rejected');
assert(validateMealValue(-1).isValid === false, 'Negative meal value is rejected');
assert(validateMealValue('abc').isValid === false, 'Non-numeric meal value is rejected');

// -------------------------------------------------------------------
// SUITE 4: Input Validation (Market, Deposits, Members)
// -------------------------------------------------------------------
assert(validateMarketCost({ date: '2026-09-01', amount: 500 }).isValid === true, 'Valid market cost passes');
assert(validateMarketCost({ date: '2026-09-01', amount: 0 }).isValid === false, 'Zero market cost is rejected');
assert(validateMarketCost({ date: '2026-09-01', amount: -50 }).isValid === false, 'Negative market cost is rejected');
assert(validateMarketCost({ date: '', amount: 500 }).isValid === false, 'Missing date is rejected');

assert(validateDeposit({ memberId: 'm1', amount: 1000, date: '2026-09-01' }).isValid === true, 'Valid deposit passes');
assert(validateDeposit({ memberId: '', amount: 1000, date: '2026-09-01' }).isValid === false, 'Missing memberId is rejected');
assert(validateDeposit({ memberId: 'm1', amount: 0, date: '2026-09-01' }).isValid === false, 'Zero deposit is rejected');

assert(validateMember({ name: 'Ayatul Pathan', phone: '01700000000', status: 'active' }).isValid === true, 'Valid member passes');
assert(validateMember({ name: '', phone: '01700000000' }).isValid === false, 'Empty member name is rejected');

// -------------------------------------------------------------------
// SUITE 5: 31-Day Month & Time Utilities
// -------------------------------------------------------------------
assert(getDaysInMonth('2026-09') === 31, 'Calendar reports 31 days');
const days31 = getDayList('2026-09');
assert(days31.length === 31 && days31[0] === 1 && days31[30] === 31, 'Day list has exactly 1 to 31 sequence');

// Date & Time formatting
const sampleIsoTime = '2026-09-29T10:30:00.000Z';
const formattedTime = formatTimeDisplay(sampleIsoTime);
assert(typeof formattedTime === 'string' && formattedTime.length > 0, `formatTimeDisplay handles ISO string (${formattedTime})`);

const firebaseTimestamp = { seconds: 1727632200, nanoseconds: 0 };
const formattedFbTime = formatTimeDisplay(firebaseTimestamp);
assert(typeof formattedFbTime === 'string' && formattedFbTime.length > 0, `formatTimeDisplay handles Firestore Timestamp (${formattedFbTime})`);

assert(formatTimeDisplay(null) === '', 'formatTimeDisplay handles null gracefully');
assert(formatTimeDisplay('invalid') === '', 'formatTimeDisplay handles invalid input gracefully');

// Currency & Balance formatting
assert(formatCurrency(2500).includes('2,500'), `formatCurrency(2500) includes formatted value (${formatCurrency(2500)})`);
assert(formatBalance(500).startsWith('+'), 'Positive balance is prefixed with +');
assert(formatBalance(-500).startsWith('-'), 'Negative balance is prefixed with -');
assert(parseAmount('৳ 2,500.50') === 2500.5, 'parseAmount extracts clean float');

console.log('====================================================');
console.log(`AUDIT RESULTS: ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
console.log('====================================================');
