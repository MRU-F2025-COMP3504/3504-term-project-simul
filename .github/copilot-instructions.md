# Code Review Instructions

## General Instructions

When reviewing code, please keep the following general guidelines in mind:

- **TODO**: If you encounter any TODO comments in the code, please note that they should be marked as issues in our issue tracker for future resolution. Also note that the newly created issue number should be referenced in the TODO comment for clarity.
- **Documentation**: Ensure that any new features or significant changes are well-documented. This includes updating relevant documentation files and adding comments in the code where necessary. Major features should include an entry in the `docs/` directory.

## Front-end

When reviewing front-end code, please consider the following:

- **Linting and Formatting**: Our codebase follows specific linting and formatting rules. This includes rules regarding template literals, indentation, and spacing. When reviewing, ignore these aspects, as they are verified by automated tools before the PR is opened.
- **Shadcn UI Components**: If you come across components from the Shadcn UI library, please do not review their internal implementation. Instead, focus on how these components are integrated and used within our codebase. If you come across any UI using primitive HTML components instead of the Shadcn UI components, please suggest refactoring them to use the Shadcn UI components for consistency and maintainability. (e.g., using `<Button>` from Shadcn UI instead of a plain `<button>` element).

## Back-end

When reviewing back-end code, please consider the following:

- **Security**: Pay special attention to security aspects, such as input validation, authentication, and authorization. Ensure that sensitive data is handled appropriately.
- **Performance**: Evaluate the performance implications of the code changes. Look for potential bottlenecks and suggest optimizations where necessary.
- **Error Handling**: Check that the code includes proper error handling and logging mechanisms to facilitate debugging and maintenance.

