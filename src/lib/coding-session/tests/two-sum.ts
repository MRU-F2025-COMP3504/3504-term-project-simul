import type { TestCase } from "~/types/coding-session";

/**
 * Starter code for the Two Sum problem
 */
export const TWO_SUM_STARTER_CODE = `// Two Sum Problem
// Given an array of integers nums and an integer target,
// return the indices of the two numbers that add up to the target.
// You may assume that each input has exactly one solution,
// and you may not use the same element twice.

function twoSum(nums, target) {
  // Your code here
  
}

// Return the result
return twoSum(nums, target);`;

/**
 * Test cases for the Two Sum problem
 */
export const TWO_SUM_TEST_CASES: TestCase[] = [
  {
    name: "Example 1",
    input: { nums: [2, 7, 11, 15], target: 9 },
    expected: [0, 1],
    description: "Pair at indices 0 and 1 produce the target 9.",
  },
  {
    name: "Example 2",
    input: { nums: [3, 2, 4], target: 6 },
    expected: [1, 2],
    description: "Indices 1 and 2 sum to 6.",
  },
  {
    name: "Example 3",
    input: { nums: [3, 3], target: 6 },
    expected: [0, 1],
    description: "Duplicate values should be handled correctly.",
  },
  {
    name: "Negative numbers",
    input: { nums: [-1, -2, -3, 5, 10], target: -5 },
    expected: [1, 2],
    description: "Works when the solution involves negative values.",
  },
];
