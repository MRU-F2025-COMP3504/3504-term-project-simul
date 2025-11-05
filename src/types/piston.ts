/**
 * Piston API types
 * https://github.com/engineer-man/piston
 */

/**
 * Response from Piston's /api/v2/execute endpoint
 * Contains execution results including stdout, stderr, and exit codes
 */
export type PistonExecuteResponse = {
  run: {
    /** Standard output from the executed code */
    stdout: string;
    /** Standard error output from the executed code */
    stderr: string;
    /** Exit code (0 for success, non-zero for errors) */
    code: number;
    /** Signal that terminated the process, if any */
    signal: string | null;
    /** Combined stdout and stderr output */
    output: string;
  };
  /** Programming language used for execution */
  language: string;
  /** Runtime version used for execution */
  version: string;
};

/**
 * A single file to be executed by Piston
 */
export type PistonFile = {
  /** File name (e.g., "main.js", "utils.py") */
  name: string;
  /** File content/source code */
  content: string;
};

/**
 * Request payload for Piston's /api/v2/execute endpoint
 * Defines the execution environment and code to run
 */
export type PistonExecuteRequest = {
  /** Programming language (e.g., "javascript", "python") */
  language: string;
  /** Runtime version (e.g., "20.11.1" for Node.js) */
  version: string;
  /** Array of files to execute (supports multi-file projects) */
  files: PistonFile[];
  /** Optional standard input to pass to the program */
  stdin?: string;
  /** Optional command-line arguments */
  args?: string[];
  /** Compilation timeout in milliseconds */
  compile_timeout?: number;
  /** Execution timeout in milliseconds */
  run_timeout?: number;
  /** Compilation memory limit in bytes */
  compile_memory_limit?: number;
  /** Execution memory limit in bytes */
  run_memory_limit?: number;
};
