import type { ProblemDefinition } from "~/types/coding-session";

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
  
}`; // Remove the trailing return statement to avoid duplication (return twoSum(nums, target);)

/**
 * Input type for Two Sum test cases
 */
export type TwoSumInput = {
  nums: number[];
  target: number;
};

/**
 * Complete Two Sum problem definition
 */
export const TWO_SUM_PROBLEM: ProblemDefinition<TwoSumInput, [number, number]> = {
  title: "Two Sum",
  functionName: "twoSum",
  description: [
    "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to the target.",
    "You may assume that each input has exactly one solution, and you may not use the same element twice.",
    "You can return the answer in any order.",
  ],
  examples: [
    {
      title: "Example 1",
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "nums[0] + nums[1] = 2 + 7 = 9",
    },
    {
      title: "Example 2",
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
      explanation: "nums[1] + nums[2] = 2 + 4 = 6",
    },
    {
      title: "Example 3",
      input: "nums = [3,3], target = 6",
      output: "[0,1]",
    },
  ],
  constraints: [
    "2 ≤ nums.length ≤ 10⁴",
    "-10⁹ ≤ nums[i] ≤ 10⁹",
    "-10⁹ ≤ target ≤ 10⁹",
    "Only one valid answer exists.",
  ],
  starterCode: TWO_SUM_STARTER_CODE,
  testCases: [
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
  ],
  renderTestInput: (input) => {
    return `nums = ${JSON.stringify(input.nums)}, target = ${input.target}`;
  },
};

/**
 * Legacy export for backward compatibility
 * @deprecated Use TWO_SUM_PROBLEM.testCases instead
 */
export const TWO_SUM_TEST_CASES = TWO_SUM_PROBLEM.testCases;
