import type { Transaction } from "@codemirror/state";

/**
 * A file entry with its name and content
 */
export type FileEntry = {
  name: string;
  content: string;
};

/**
 * A recorded event during a coding session
 * Can be a transaction, mouse event, file switch, or file creation
 */
export type RecordedEvent = {
  time: number; // epoch ms
  kind: "transaction" | "mouse" | "file-switch" | "file-create";
  fileName?: string; // which file (for transactions and file ops)
  transaction?: Transaction;
  selection?: { anchor: number; head: number }; // Selection range from transaction
  mouse?: { x: number; y: number; type?: string; button?: number };
  fileContent?: string; // for file-create events
};

/**
 * A test case for a coding challenge
 */
export type TestCase<TInput = any, TExpected = any> = {
  name: string;
  input: TInput;
  expected: TExpected;
  description: string;
};

/**
 * Example case for displaying in the problem description
 */
export type ProblemExample = {
  title: string;
  input: string;
  output: string;
  explanation?: string;
};

/**
 * Complete problem definition including description, examples, and constraints
 */
export type ProblemDefinition<TInput = any, TExpected = any> = {
  title: string;
  description: string[];
  examples: ProblemExample[];
  constraints: string[];
  starterCode: string;
  testCases: TestCase<TInput, TExpected>[];
  /**
   * Optional function to render test case inputs for display
   * If not provided, will use JSON.stringify
   */
  renderTestInput?: (input: TInput) => string;
};

/**
 * Detailed result for a single test case
 */
export type TestDetail = {
  name: string;
  passed: boolean;
  error?: string;
};

/**
 * Complete test results for a coding challenge submission
 */
export type TestResults = {
  passed: number;
  total: number;
  details: TestDetail[];
};
