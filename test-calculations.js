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

console.log('----------------------------------------------------');
console.log('RUNNING AUDIT TESTS FOR MEAL MANAGEMENT SYSTEM...');
console.log('----------------------------------------------------');

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

// TEST 1: Section 52 Specification Benchmark Test
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
  { id: 'c1', amount: 10000 },
  { id: 'c2', amount: 8000 },
  { id: 'c3', amount: 7000 },
  { id: 'c4', amount: 5000 },
];

const sampleDeposits = [
  { memberId: 'member_001', amount: 12000 },
  { memberId: 'member_002', amount: 7000 },
  { memberId: 'member_003', amount: 15000 },
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

// TEST 2: Section 53 Accounting Discrepancy & Rounding Test
const totalMemberMealCostSum = summaries.reduce((sum, m) => sum + m.mealCost, 0);
assert(Math.abs(totalMemberMealCostSum - totalMarketCost) < 0.01, `Sum of member meal costs equals total market cost (${totalMemberMealCostSum} vs ${totalMarketCost})`);

// TEST 3: Zero-division edge case test
const zeroCostPerMeal = calculateCostPerMeal(5000, 0);
assert(zeroCostPerMeal === 0, `Divide by zero meals returns 0 (actual: ${zeroCostPerMeal})`);

// TEST 4: Validation test (0, 1, 2 only)
assert(validateMealValue(0).isValid === true, 'Meal value 0 is valid');
assert(validateMealValue(1).isValid === true, 'Meal value 1 is valid');
assert(validateMealValue(2).isValid === true, 'Meal value 2 is valid');
assert(validateMealValue(3).isValid === false, 'Meal value 3 is rejected');
assert(validateMealValue(-1).isValid === false, 'Negative meal value is rejected');

// TEST 5: Market cost validation (amount > 0)
assert(validateMarketCost({ date: '2026-09-01', amount: 500 }).isValid === true, 'Valid market cost');
assert(validateMarketCost({ date: '2026-09-01', amount: 0 }).isValid === false, 'Zero market cost is rejected');
assert(validateMarketCost({ date: '2026-09-01', amount: -50 }).isValid === false, 'Negative market cost is rejected');

console.log('----------------------------------------------------');
console.log(`RESULTS: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('----------------------------------------------------');
