import assert from "node:assert/strict";
import {
  calculateMonthlyCost,
  expandMonthsCovered,
  monthsBetweenInclusive,
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

assert.equal(monthsBetweenInclusive("2026-09-01", "2026-11-30"), 3);
assert.deepEqual(expandMonthsCovered("2026-09-01", "2026-11-30"), [
  "2026-09-01",
  "2026-10-01",
  "2026-11-01",
]);

console.log("calculate.test.ts: all assertions passed");
