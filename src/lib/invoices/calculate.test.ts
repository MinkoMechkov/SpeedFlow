import assert from "node:assert/strict";
import {
  calculateMonthlyCost,
  expandMonthsCovered,
  monthsCoveredByPeriod,
  monthsBetweenInclusive,
  recentMonthKeys,
} from "./calculate";

assert.equal(
  calculateMonthlyCost({
    amount: 90,
    billingCycle: "quarterly",
    periodStart: "2026-09-01",
    periodEnd: "2026-11-30",
  }),
  30,
);

assert.equal(
  calculateMonthlyCost({ amount: 120, billingCycle: "yearly" }),
  10,
);

assert.equal(
  calculateMonthlyCost({ amount: 15, billingCycle: "monthly" }),
  15,
);

// Cursor-style monthly period spanning two calendar months → still 1 month
assert.equal(monthsCoveredByPeriod("2026-09-27", "2026-10-27"), 1);
assert.equal(
  calculateMonthlyCost({
    amount: 21.05,
    billingCycle: "monthly",
    periodStart: "2026-09-27",
    periodEnd: "2026-10-27",
  }),
  21.05,
);
assert.deepEqual(expandMonthsCovered("2026-09-27", "2026-10-27"), [
  "2026-09-01",
]);

assert.equal(monthsCoveredByPeriod("2026-09-01", "2026-11-30"), 3);
assert.equal(monthsBetweenInclusive("2026-09-01", "2026-11-30"), 3);
assert.deepEqual(expandMonthsCovered("2026-09-01", "2026-11-30"), [
  "2026-09-01",
  "2026-10-01",
  "2026-11-01",
]);

assert.deepEqual(recentMonthKeys(3, "2026-10-01"), [
  "2026-10-01",
  "2026-09-01",
  "2026-08-01",
]);

console.log("calculate.test.ts: all assertions passed");
