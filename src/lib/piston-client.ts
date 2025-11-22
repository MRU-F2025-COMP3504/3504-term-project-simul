import { serverEnv } from "~/lib/env";

export type PistonExecuteInput = {
  language: string;
  version: string;
  files: Array<{ name?: string; content: string }>;
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
};

export type PistonExecuteResult = {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
};

export const pistonClient = {
  async execute(input: PistonExecuteInput): Promise<PistonExecuteResult> {
    const response = await fetch(`${serverEnv.PISTON_URL}/api/v2/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Piston API error: ${response.statusText}`);
    }

    return response.json();
  },

  async getRuntimes() {
    const response = await fetch(`${serverEnv.PISTON_URL}/api/v2/runtimes`);

    if (!response.ok) {
      throw new Error(`Piston API error: ${response.statusText}`);
    }

    return response.json();
  },
};
