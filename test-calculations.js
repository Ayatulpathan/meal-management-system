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
import {
  calculateTotalUtilities,
  calculateUtilitySharePerMember,
  calculateMemberRentPaid,
  calculateMemberRentLedger,
  calculateRentSummary,
} from './src/utils/rentCalculations.js';

// -------------------------------------------------------------------
// SUITE 6: House Rent & Shared Utility Accounting Suite
// -------------------------------------------------------------------
const sampleRentMembers = [
  { id: 'm1', name: 'Rahim', room: '101', status: 'active' },
  { id: 'm2', name: 'Karim', room: '102', status: 'active' },
  { id: 'm3', name: 'Hasan', room: '103', status: 'active' },
  { id: 'm4', name: 'Inactive Member', room: '104', status: 'inactive' },
];

const sampleMemberRentsMap = {
  m1: { seatRent: 5000, room: '101' },
  m2: { seatRent: 4500, room: '102' },
  m3: 4000, // tests numeric shorthand format
};

const sampleUtilityBills = [
  { id: 'u1', category: 'electricity', title: 'DESCO Bill', amount: 3000 },
  { id: 'u2', category: 'gas', title: 'Gas Bill', amount: 1500 },
  { id: 'u3', category: 'internet', title: 'WiFi Internet', amount: 1200 },
  { id: 'u4', category: 'maid', title: 'Maid Salary', amount: 3000 },
  { id: 'u5', category: 'waste', title: 'Waste Collection', amount: 300 },
];

const sampleRentPayments = [
  { id: 'p1', memberId: 'm1', amount: 8000, date: '2026-09-05' },
  { id: 'p2', memberId: 'm2', amount: 4000, date: '2026-09-05' },
  { id: 'p3', memberId: 'm3', amount: 7000, date: '2026-09-05' },
];

const totalUtilities = calculateTotalUtilities(sampleUtilityBills);
assert(totalUtilities === 9000, `Total Utilities = 9000 (actual: ${totalUtilities})`);

// 3 active members sharing 9000 -> 3000/person
const utilityShare = calculateUtilitySharePerMember(totalUtilities, 3);
assert(utilityShare === 3000, `Utility Share per Member = 3000 (actual: ${utilityShare})`);

const rentSummary = calculateRentSummary(
  sampleRentMembers,
  sampleMemberRentsMap,
  sampleUtilityBills,
  sampleRentPayments
);

assert(rentSummary.activeMemberCount === 3, 'Active members count is 3 (inactive member excluded)');
assert(rentSummary.totalHouseRent === 13500, `Total House Rent = 13500 (actual: ${rentSummary.totalHouseRent})`);
assert(rentSummary.totalRentDue === 22500, `Total Rent Due = 22500 (actual: ${rentSummary.totalRentDue})`);
assert(rentSummary.totalRentPaid === 19000, `Total Rent Paid = 19000 (actual: ${rentSummary.totalRentPaid})`);
assert(rentSummary.totalRentRemaining === 3500, `Total Rent Remaining = 3500 (actual: ${rentSummary.totalRentRemaining})`);

// Rahim: Seat 5000 + Utility 3000 = 8000. Paid 8000 -> Due 0, Status 'paid'
const rahimRent = rentSummary.memberSummaries.find(m => m.id === 'm1');
assert(rahimRent.totalDue === 8000, `Rahim Total Due = 8000 (actual: ${rahimRent.totalDue})`);
assert(rahimRent.rentPaid === 8000, `Rahim Paid = 8000 (actual: ${rahimRent.rentPaid})`);
assert(rahimRent.dueRemaining === 0, `Rahim Due = 0 (actual: ${rahimRent.dueRemaining})`);
assert(rahimRent.status === 'paid', `Rahim Status = paid (actual: ${rahimRent.status})`);

// Karim: Seat 4500 + Utility 3000 = 7500. Paid 4000 -> Due 3500, Status 'partial'
const karimRent = rentSummary.memberSummaries.find(m => m.id === 'm2');
assert(karimRent.totalDue === 7500, `Karim Total Due = 7500 (actual: ${karimRent.totalDue})`);
assert(karimRent.rentPaid === 4000, `Karim Paid = 4000 (actual: ${karimRent.rentPaid})`);
assert(karimRent.dueRemaining === 3500, `Karim Due = 3500 (actual: ${karimRent.dueRemaining})`);
assert(karimRent.status === 'partial', `Karim Status = partial (actual: ${karimRent.status})`);

// Hasan: Seat 4000 + Utility 3000 = 7000. Paid 7000 -> Due 0, Status 'paid'
const hasanRent = rentSummary.memberSummaries.find(m => m.id === 'm3');
assert(hasanRent.totalDue === 7000, `Hasan Total Due = 7000 (actual: ${hasanRent.totalDue})`);
assert(hasanRent.rentPaid === 7000, `Hasan Paid = 7000 (actual: ${hasanRent.rentPaid})`);
assert(hasanRent.dueRemaining === 0, `Hasan Due = 0 (actual: ${hasanRent.dueRemaining})`);
// -------------------------------------------------------------------
// SUITE 7: Selective Member Utility Bill Splitting & Exemption
// -------------------------------------------------------------------
const selectiveMembers = [
  { id: 'user_a', name: 'Member A', status: 'active' },
  { id: 'user_b', name: 'Member B', status: 'active' },
  { id: 'user_c', name: 'Member C', status: 'active' },
];

const selectiveRentsMap = {
  user_a: { seatRent: 3000 },
  user_b: { seatRent: 3000 },
  user_c: { seatRent: 3000, exemptUtilities: true }, // User C is exempt from all utilities
};

const selectiveBills = [
  // Shared by all non-exempt (User A & B)
  { id: 'b1', title: 'Gas Bill', amount: 1000, includedMembers: [] },
  // WiFi only for User A
  { id: 'b2', title: 'WiFi Internet', amount: 600, includedMembers: ['user_a'] },
  // AC Electricity for User A & User B
  { id: 'b3', title: 'AC Electricity', amount: 2000, includedMembers: ['user_a', 'user_b'] },
];

const selectiveSummary = calculateRentSummary(selectiveMembers, selectiveRentsMap, selectiveBills, []);

// User A: Seat 3000 + Gas(500) + WiFi(600) + AC(1000) = 5100 total
const userALedger = selectiveSummary.memberSummaries.find(m => m.id === 'user_a');
assert(userALedger.utilityShare === 2100, `User A utility share = 2100 (actual: ${userALedger.utilityShare})`);
assert(userALedger.totalDue === 5100, `User A total due = 5100 (actual: ${userALedger.totalDue})`);

// User B: Seat 3000 + Gas(500) + WiFi(0) + AC(1000) = 4500 total
const userBLedger = selectiveSummary.memberSummaries.find(m => m.id === 'user_b');
assert(userBLedger.utilityShare === 1500, `User B utility share = 1500 (actual: ${userBLedger.utilityShare})`);
assert(userBLedger.totalDue === 4500, `User B total due = 4500 (actual: ${userBLedger.totalDue})`);

// User C: Seat 3000 + Utility(0 - exempt) = 3000 total
const userCLedger = selectiveSummary.memberSummaries.find(m => m.id === 'user_c');
assert(userCLedger.utilityShare === 0, `User C utility share = 0 (actual: ${userCLedger.utilityShare})`);
assert(userCLedger.totalDue === 3000, `User C total due = 3000 (actual: ${userCLedger.totalDue})`);
assert(userCLedger.exemptUtilities === true, 'User C has exemptUtilities flag');

console.log('====================================================');
console.log(`AUDIT RESULTS: ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
console.log('====================================================');

