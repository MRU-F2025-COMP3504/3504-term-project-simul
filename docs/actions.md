# Server Actions with next-safe-action

## What are Server Actions?

Server Actions are a NextJS feature that lets you run server-side code directly from your client-side components. Think of them as functions that run on the server, but can be called from the browser. Like a mini API endpoint.

## Why use next-safe-action?

`next-safe-action` makes Server Actions safer and easier to use by:

- **Validating input**: Makes sure the data sent from the client is correct
- **Type safety**: Catches errors at development time instead of runtime
- **Better error handling**: Gives you clear feedback when things go wrong

## Basic Setup

### 1. Create a Server Action

Server actions go in the `src/actions/` folder and must start with `"use server"`. Here's a simple example:

```typescript
"use server";

import { z } from "zod";

import { actionClient } from "~/lib/safe-action";

// Define what data we expect from the client
const inputSchema = z.object({
  message: z.string().min(1), // A message that's at least 1 character long
});

export const sendTestMessage = actionClient
  .inputSchema(inputSchema) // Tell it what to expect
  .action(async ({ parsedInput: { message } }) => {
    // This code runs on the server
    console.log("Message received:", message);

    return {
      serverResponse: `Server got: "${message}"`,
    };
  });
```

### 2. Use the Action in a Component

Now you can call this action from any client component:

```tsx
"use client";

import { useState } from "react";

import { sendTestMessage } from "~/actions/test-action";

export default function MyComponent() {
  const [response, setResponse] = useState("");

  const handleClick = async () => {
    const result = await sendTestMessage({
      message: "Hello from the client!"
    });

    if (result.data) {
      setResponse(result.data.serverResponse);
    }
  };

  return (
    <div>
      <button type="button" onClick={handleClick}>Send Message</button>
      {response && <p>{response}</p>}
    </div>
  );
}
```

## Key Concepts

### Input Validation with Zod

The `inputSchema` uses [Zod](https://zod.dev/) to validate data:

```typescript
const inputSchema = z.object({
  email: z.string().email(), // Must be a valid email
  age: z.number().min(18).max(120), // Number between 18-120
  name: z.string().min(1).max(50), // String 1-50 characters
});
```

### Error Handling

Actions can fail in different ways:

```typescript
const result = await myAction({ name: "John" });

// Check what happened
if (result.data) {
  // Success! Use result.data
  console.log("Success:", result.data);
}
else if (result.validationErrors) {
  // Input was invalid
  console.log("Validation errors:", result.validationErrors);
}
else if (result.serverError) {
  // Something went wrong on the server
  console.log("Server error:", result.serverError);
}
```

### Returning Custom Errors

You can send specific validation errors back to the client:

```typescript
import { returnValidationErrors } from "next-safe-action";

export const registerUser = actionClient
  .inputSchema(z.object({ email: z.string().email() }))
  .action(async ({ parsedInput: { email } }) => {
    // Check if email already exists
    const userExists = await checkIfEmailExists(email);

    if (userExists) {
      return returnValidationErrors(inputSchema, {
        email: { _errors: ["Email already registered"] }
      });
    }

    // Continue with registration...
    return { success: true };
  });
```

## Working with Forms

Forms are one of the most common uses for Server Actions. `next-safe-action` makes forms easy and type-safe using the `useAction` hook and `zod-form-data` (zfd) for validation.

### Creating a Form Action

Form actions use `zod-form-data` to validate HTML form data:

```typescript
"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";

import { actionClient } from "~/lib/safe-action";

// Define what form fields we expect
const inputSchema = zfd.formData({
  name: zfd.text(z.string().min(1).max(50)),
  email: zfd.text(z.string().email()),
  age: zfd.numeric(z.number().min(18).max(120)),
});

export const submitUserForm = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    // parsedInput.name, parsedInput.email, and parsedInput.age are now validated
    console.log("Form submitted:", parsedInput);

    // Save to database, send email, etc.

    return {
      success: true,
      message: `Welcome, ${parsedInput.name}!`,
    };
  });
```

### Using Forms with useAction Hook

The `useAction` hook makes forms stupidly simple:

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";

import { submitUserForm } from "~/actions/user-form";

export default function UserForm() {
  const { execute, result, isExecuting } = useAction(submitUserForm);

  return (
    <form action={execute}>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Your name"
          required
        />
      </div>

      <div>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="your@email.com"
          required
        />
      </div>

      <div>
        <label htmlFor="age">Age:</label>
        <input
          type="number"
          id="age"
          name="age"
          placeholder="25"
          required
        />
      </div>

      <button type="submit" disabled={isExecuting}>
        {isExecuting ? "Submitting..." : "Submit"}
      </button>

      {result.data && (
        <p style={{ color: "green" }}>
          {result.data.message}
        </p>
      )}

      {result.validationErrors && (
        <div style={{ color: "red" }}>
          <p>Please fix these errors:</p>
          <pre>{JSON.stringify(result.validationErrors, null, 2)}</pre>
        </div>
      )}
    </form>
  );
}
```
