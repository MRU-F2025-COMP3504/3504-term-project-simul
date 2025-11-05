# Code Review Instructions

## General Guidelines

- **Security First**: Prioritize security vulnerabilities—hardcoded secrets, SQL injection, XSS, input validation, and authentication/authorization logic.
- **Performance Matters**: Flag N+1 queries, inefficient loops, memory leaks, and missing caching for expensive operations.
- **Be Specific and Actionable**: Explain the "why" behind recommendations. Acknowledge good patterns when you spot them.
- **Ask for Clarity**: When code intent is unclear, ask questions rather than assume.
- **TODO Comments**: Reference the issue tracker number in any TODO comments you find. If one doesn't exist, note that an issue should be created.

## Front-end

- **Ignore Linting/Formatting**: Automated tools catch these before PR submission.
- **Shadcn UI Integration**: Don't review Shadcn UI internals. Focus on how components are integrated. Suggest refactoring primitive HTML elements to Shadcn UI components for consistency.
- **Readability**: Extract validation logic, conditionals, and repeated patterns into focused, descriptive functions. This improves both readability and testability.

## Back-end

- **Input Validation & Sanitization**: Verify all inputs are validated and sanitized appropriately.
- **Performance**: Evaluate bottlenecks. Check for N+1 problems, inefficient loops, resource cleanup, and caching opportunities.
- **Error Handling & Logging**: Ensure proper error handling with adequate logging to support debugging and maintenance.

## Code Quality Across All Layers

- Functions should be focused and appropriately sized
- Use clear, descriptive naming
- Document significant changes and new features (including `docs/` entries for major features)
- Ensure proper error handling throughout

Always prioritize security and performance issues that impact users.