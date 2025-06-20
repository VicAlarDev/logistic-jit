---
trigger: model_decision
description: When working with UI
---

---

trigger: model_decision
description: This rule explains Tailwind CSS conventions, utility classes, and best practices for modern UI development.

---

# Tailwind CSS rules

- Use responsive prefixes for mobile-first design:

```html
<div class="w-full md:w-1/2 lg:w-1/3">
  <!-- Full width on mobile, half on medium, one-third on large screens -->
</div>
```

- Use state variants for interactive elements:

```html
<button class="bg-blue-500 hover:bg-blue-600 focus:ring-2">Click me</button>
```

- Use @apply for repeated patterns when necessary:

```css
@layer components {
  .btn-primary {
    @apply rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600;
  }
}
```

- Use arbitrary values for specific requirements:

```html
<div class="top-[117px] grid-cols-[1fr_2fr]">
  <!-- Custom positioning and grid layout -->
</div>
```

- Use spacing utilities for consistent layout:

```html
<div class="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```
