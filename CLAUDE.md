# PayPlan Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-17

## Active Technologies
- TypeScript 5.8 (frontend), Node.js 20.x (backend) + React 19, PapaParse 5.5.3 (CSV generation), Zod 4.1.11 (validation) (014-build-a-csv)
- TypeScript 5.8.3 (frontend), Node.js 20.x (backend) + React 19.1.1, Zod 4.1.11 (validation), uuid 13.0.0 (unique IDs), Vitest 3.2.4 (testing) (015-build-a-payment)
- Browser localStorage (privacy-first, no server persistence), Two-tier archive storage architecture (016-build-a-payment)
- React Router 7.0.2 (client-side routing), Performance monitoring utilities (016-build-a-payment)
- TypeScript 5.8.3, Node.js 20.x + React 19.1.1, React Router DOM 7.9.3, Radix UI, Tailwind CSS 4.1.13 (017-navigation-system)
- N/A (transient UI state only) (017-navigation-system)
- TypeScript 5.8.3 (frontend), Node.js 20.x (backend) + React 19.1.1, Zod 4.1.11 (validation), Vitest 3.2.4 (testing), PapaParse 5.5.3 (CSV), uuid 13.0.0 (018-technical-debt-cleanup)
- JavaScript (Node.js 20.x backend) + TypeScript 5.8.3 (type definitions) + None (native JavaScript `String` + `RegExp` + `Array` methods only) (019-pii-pattern-refinement)
- N/A (stateless transformation library) (019-pii-pattern-refinement)

## Project Structure
```
src/
  lib/archive/          # Archive business logic and storage
  components/archive/   # Archive UI components
  pages/               # Archive list and detail views
  hooks/               # Archive React hooks
tests/
```

## Commands
npm test               # Run all tests (Jest + Vitest)
npm run lint           # Run ESLint
npm run dev            # Start development server

## Code Style
TypeScript 5.8 (frontend), Node.js 20.x (backend): Follow standard conventions

## Archive System (Feature 016)
- **Storage**: localStorage with 50-archive limit, 5MB total size
- **Performance Targets**: <100ms index loading, <3s CSV export
- **Architecture**: Two-tier (index + individual archives) for optimal performance
- **Accessibility**: WCAG 2.1 AA compliant (ARIA labels, keyboard navigation)

## Recent Changes
- 019-pii-pattern-refinement: Added JavaScript (Node.js 20.x backend) + TypeScript 5.8.3 (type definitions) + None (native JavaScript `String` + `RegExp` + `Array` methods only)
- 018-technical-debt-cleanup: Added TypeScript 5.8.3 (frontend), Node.js 20.x (backend) + React 19.1.1, Zod 4.1.11 (validation), Vitest 3.2.4 (testing), PapaParse 5.5.3 (CSV), uuid 13.0.0
- 017-navigation-system: Added TypeScript 5.8.3, Node.js 20.x + React 19.1.1, React Router DOM 7.9.3, Radix UI, Tailwind CSS 4.1.13

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
