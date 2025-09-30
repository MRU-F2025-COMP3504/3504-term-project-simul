This application supports light and dark themes. We accomplish this through the use of Tailwind utility classes, shadcn components, and next-themes.

### Theme Location

You can find the base themes defined in `src/app/globals.css`. Look at the styles for root (light theme) and dark (dark theme).

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --secondary: oklch(0.97 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
}
```

### Using Theme Colors

The base themes define classes that we can use for colours throughout our application. Instead of hardcoded colors, use the semantic color names that automatically adapt to the theme:

```tsx
// Do NOT use hardcoded colors (all the utility classes below use hardcoded colours)
<div className="bg-white text-black dark:bg-gray-900 dark:text-white">
  // Use theme colors. These utility classes adapt to the theme
  <div className="bg-background text-foreground"></div>
</div>
```

### Available Theme Colors

- `bg-background` / `text-foreground` - Main background and text
- `bg-card` / `text-card-foreground` - Card backgrounds
- `bg-primary` / `text-primary-foreground` - Primary brand colors
- `bg-secondary` / `text-secondary-foreground` - Secondary colors
- `bg-muted` / `text-muted-foreground` - Muted/subtle colors
- `bg-accent` / `text-accent-foreground` - Accent colors
- `bg-destructive` / `text-destructive` - Error/danger colors
- `border-border` - Border colors
- `ring-ring` - Focus ring colors

## When to use the useTheme Hook

**Important**: In most cases, you should use semantic color names (`bg-background`, `text-foreground`, etc) instead of the `useTheme` hook. The hook should only be used when you need programmatic access to the theme state.

### When to Use Semantic Colors

For 99% of styling needs, use semantic color names:

```jsx
// This works automatically with theme changes
<div className="bg-background text-foreground border-border">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Subtitle</p>
</div>;
```

### How to use the useTheme Hook

Only use the hook for:

1. **Theme Toggle Components** - When you are creating a component that needs to change the theme.
2. **Conditional Rendering** - When you need to show/hide content based on the current theme.
3. **Third-party Integration** - When using libraries that need to know the theme (such as the code editor!)

### Basic Usage

```jsx
"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
}
```

### Theme Values

- `theme`: The current theme setting ("light", "dark", or "system")
- `resolvedTheme`: The actual theme being used (resolves "system" to "light" or "dark")
- `setTheme(theme)`: Function to change the theme

### Examples of When NOT to Use useTheme

```jsx
// DON'T do this. Use semantic colors instead
function BadComponent() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={resolvedTheme === "dark"
      ? "bg-gray-900 text-white"
      : `bg-white text-black`}
    >
      Content
    </div>
  );
}

// Do this instead
function GoodComponent() {
  return (
    <div className="bg-background text-foreground">
      Content
    </div>
  );
}
```

## Best Practices

### 1. Use Semantic Color Names

Always prefer theme colors over hardcoded values:

```jsx
// Good
<div className="bg-background text-foreground border-border">

// Avoid
<div className="bg-white text-black dark:bg-gray-900 dark:text-white">
```

### 2. Use CSS Custom Properties

Use CSS custom properties in your components for complex styling:

```jsx
<div
  className="bg-card text-card-foreground"
  style={{
    "--custom-color": "var(--primary)",
    "--custom-opacity": "0.8"
  }}
>
  Custom styled content
</div>;
```

### 3. Create Component Variants

Use Class Variance Authority (CVA) for component variants that respect the theme:

```jsx
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  `
    inline-flex items-center justify-center rounded-md font-medium
    transition-colors
  `,
  {
    variants: {
      variant: {
        default: `
          bg-primary text-primary-foreground
          hover:bg-primary/90
        `,
        secondary: `
          bg-secondary text-secondary-foreground
          hover:bg-secondary/80
        `,
        outline: `
          border-input bg-background border
          hover:bg-accent hover:text-accent-foreground
        `,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
```
