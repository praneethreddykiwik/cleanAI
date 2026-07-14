# 📝 Coding Standards & Naming Conventions

This project maintains high-quality engineering standards to ensure clean, readable, and highly maintainable components.

---

## 🏗️ Clean Code Architecture

1. **SOLID Principles**:
   - **S**ingle Responsibility: Reusable UI components handle visual presentation only; business logic belongs in hooks and services.
   - **O**pen/Closed: Make elements extensible via `className` and component properties extension.
2. **Feature-Based Layout**: Group page directories by role contexts.
3. **DRY (Don't Repeat Yourself)**: Extract commonly shared components like cards, badges, and headers into the root components module.

---

## 🎨 CSS Styling Rules

1. **Pure Tailwind CSS**: Never write raw custom CSS inside components. Use class utilities.
2. **Colors**: Colors are defined inside `globals.css` using CSS custom properties (`--primary`, `--background`, `--card`, `--border`) for robust light and dark mode mappings.
3. **Animations**: Standardize motion configurations. Use variants from `lib/animations.ts` rather than ad-hoc Framer Motion configurations.

---

## 🏷️ Naming Conventions

- **React Components**: Use PascalCase (e.g. `StatCard.tsx`, `DashboardLayout.tsx`).
- **Hooks**: Prefix with `use` and use camelCase (e.g. `useAuth.tsx`).
- **Utilities & Files**: Use camelCase or kebab-case for directories (e.g. `forgot-password`).
- **Database Schema**: PascalCase for entity schemas, camelCase for relation names.
- **REST Endpoints**: Lowercase, kebab-case (e.g., `/api/v1/auth/reset-password`).
