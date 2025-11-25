import { CONSTRAINTS } from "~/lib/piston-validation";

/**
 * Sensitive patterns to remove from output/errors
 * These patterns might leak internal system information
 */
const SENSITIVE_PATTERNS = [
  /\/var\/lib\/piston\/\S*/g, // Internal Piston paths
  /\/home\/\S*\/\S*/g, // User home directories
  /\/usr\/local\/\S*/g, // System paths
  /\/etc\/\S*/g, // Config paths
  /DATABASE_URL=.*/g, // Env var values
  /BETTER_AUTH_SECRET=.*/g,
  /GH_SECRET=.*/g,
  /POSTGRES_PASSWORD=.*/g,
  /Bearer [\w\-.~+/]+=*/g, // Auth tokens
] as const;

/**
 * Sanitizes error messages by removing sensitive information
 */
export function sanitizeErrorMessage(error: string): string {
  if (!error)
    return "";

  let sanitized = error;

  // Remove sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  // Return the first line (stack traces may contain paths). If it's empty, return empty string.
  const firstLine = sanitized.split("\n")[0]?.trim() ?? "";
  return firstLine;
}

/**
 * Truncates output if it exceeds size limit
 */
export function truncateOutput(output: string): {
  content: string;
  truncated: boolean;
} {
  const maxSize = CONSTRAINTS.MAX_OUTPUT_SIZE_BYTES;

  if (output.length <= maxSize) {
    return { content: output, truncated: false };
  }

  const truncationMessage = `\n\n[Output truncated - exceeded ${maxSize / 1024 / 1024}MB limit]`;
  const truncateAt = maxSize - truncationMessage.length;

  const truncated = output.slice(0, truncateAt);

  return {
    content: truncated + truncationMessage,
    truncated: true,
  };
}

/**
 * Sanitizes the complete Piston execution result
 */
export function sanitizePistonResult(result: {
  stdout?: string;
  stderr?: string;
  output?: string;
  code?: number;
  signal?: string | null;
}) {
  // For stdout, sanitize sensitive info and then truncate (we still preserve multi-line structure)
  const sanitizeStdout = (field?: string) => {
    if (!field)
      return "";
    let sanitized = field;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
    const { content } = truncateOutput(sanitized);
    return content;
  };

  // For stderr/output, sanitize sensitive info and truncate
  const sanitizeField = (field?: string) => {
    if (!field)
      return "";
    // Remove sensitive patterns but keep multi-line output
    let sanitized = field;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[REDACTED]");
    }
    const { content } = truncateOutput(sanitized);
    return content;
  };

  return {
    stdout: sanitizeStdout(result.stdout),
    stderr: sanitizeField(result.stderr),
    output: sanitizeField(result.output),
    code: result.code,
    signal: result.signal,
  };
}
