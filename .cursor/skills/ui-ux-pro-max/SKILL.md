# UI UX Pro Max

An AI skill that provides design intelligence for building professional UI/UX across multiple platforms and frameworks.

## Overview

This skill provides:
- **67 UI Styles** - Glassmorphism, Claymorphism, Minimalism, Brutalism, Neumorphism, Bento Grid, Dark Mode, AI-Native UI, and more
- **161 Color Palettes** - Industry-specific palettes aligned with product types
- **57 Font Pairings** - Curated typography combinations with Google Fonts
- **25 Chart Types** - Recommendations for dashboards and analytics
- **13 Tech Stacks** - React, Next.js, Astro, Vue, Nuxt.js, Svelte, SwiftUI, React Native, Flutter, HTML+Tailwind, shadcn/ui, Jetpack Compose
- **99 UX Guidelines** - Best practices, anti-patterns, and accessibility rules
- **161 Reasoning Rules** - Industry-specific design system generation

## When to Use

Use this skill when the user requests:
- Building UI components, pages, or full websites
- Designing dashboards, landing pages, or mobile apps
- Choosing color palettes, typography, or visual styles
- Getting UX recommendations or design patterns
- Creating design systems for specific industries

## Trigger Keywords

This skill activates when you detect these keywords in user requests:
- build, design, create, implement, review, fix, improve
- landing page, dashboard, mobile app, UI, UX
- color palette, typography, font, style, theme
- glassmorphism, neumorphism, minimalism, dark mode, etc.

## Usage

When activated, provide design recommendations based on:

1. **Product Type** - Identify the industry (SaaS, e-commerce, healthcare, finance, etc.)
2. **Style Selection** - Recommend matching UI styles from the 67 available
3. **Color Palette** - Select appropriate colors from 161 palettes
4. **Typography** - Choose font pairings from 57 options
5. **Tech Stack** - Apply stack-specific guidelines (React, Next.js, Tailwind, etc.)

## Quick Reference - Popular Styles

### Modern & Clean
| Style | Best For |
|-------|----------|
| Minimalism & Swiss Style | Enterprise apps, dashboards, documentation |
| Soft UI Evolution | Modern enterprise apps, SaaS |
| Bento Box Grid | Dashboards, product pages, portfolios |
| Glassmorphism | Modern SaaS, financial dashboards |

### Creative & Bold
| Style | Best For |
|-------|----------|
| Brutalism | Design portfolios, artistic projects |
| Neubrutalism | Gen Z brands, startups |
| Y2K Aesthetic | Fashion brands, music, Gen Z |
| Cyberpunk UI | Gaming, tech products, crypto apps |

### Premium & Specialized
| Style | Best For |
|-------|----------|
| Neumorphism | Health/wellness apps, meditation |
| Claymorphism | Educational apps, children apps |
| Liquid Glass | Premium SaaS, high-end e-commerce |
| Dark Mode (OLED) | Night-mode apps, coding platforms |

### Emerging & Tech
| Style | Best For |
|-------|----------|
| AI-Native UI | AI products, chatbots, copilots |
| Spatial UI (VisionOS) | Spatial computing apps, VR/AR |
| Dimensional Layering | Dashboards, card layouts, modals |

## Tech Stack Guidelines

When the user specifies a tech stack, apply these guidelines:

### React / Next.js
- Use functional components with hooks
- Implement proper state management
- Use TypeScript for type safety
- Follow component composition patterns

### Tailwind CSS
- Use utility classes for styling
- Implement responsive design with sm:, md:, lg:, xl: prefixes
- Use CSS variables for theming
- Follow Tailwind recommended class ordering

### shadcn/ui
- Use pre-built components from shadcn/ui
- Customize using CSS variables in globals.css
- Follow their component composition patterns

### Vue / Nuxt
- Use Composition API with script setup
- Implement proper reactivity
- Follow Vue best practices

### Mobile (React Native / Flutter / SwiftUI)
- Follow platform-specific design guidelines
- Implement proper navigation
- Handle platform-specific interactions

## Accessibility Requirements

Always include:
- **Color Contrast** - Minimum 4.5:1 for text, 3:1 for large text
- **Focus States** - Visible focus indicators for keyboard navigation
- **Semantic HTML** - Proper heading hierarchy, landmarks, labels
- **Reduced Motion** - Respect prefers-reduced-motion
- **Screen Reader** - Proper ARIA labels and alt text

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive breakpoints: 375px, 768px, 1024px, 1440px

## Example Prompts to Handle

`
User: Build a landing page for my SaaS product
â†’ Generate design system with recommended style, colors, typography

User: Create a dashboard for healthcare analytics
â†’ Recommend data-dense dashboard style with healthcare color palette

User: Design a portfolio website with dark mode
â†’ Suggest dark mode with portfolio-appropriate style and typography

User: Make a mobile app UI for e-commerce
â†’ Recommend mobile-first design with e-commerce appropriate colors

User: Build a fintech banking app with dark theme
â†’ Suggest professional dark theme with fintech-appropriate palette
`

## External Resources

- GitHub: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Website: https://uupm.cc

## Notes

- Always consider the user specific industry and product type
- Recommend styles that match the product target audience
- Avoid AI purple/pink gradients for professional industries (finance, healthcare, government)
- Prioritize accessibility in all recommendations
- Use Lucide or Heroicons for icons (not emojis)
