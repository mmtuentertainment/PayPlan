# PayPlan - Privacy-First Budgeting App

**Live Demo:** https://payplan-khaki.vercel.app

Track your spending, budgets, and goals with zero tracking and local-only storage. Simple, visual, and completely free.

## 📍 Product Positioning

**Primary**: Privacy-first budgeting app (competes with YNAB, Monarch, PocketGuard)
**Differentiators**: Completely free, privacy-first (no bank sync), visual dashboards, gamification
**Target Users**: Low-income earners (18-35) managing paycheck-to-paycheck budgets

PayPlan is a comprehensive budgeting solution focused on visual insights and habit-building through gamification.

## 🚀 Quick Start

1. Visit the [live demo](https://payplan-khaki.vercel.app)
2. Navigate to **Categories** to create spending categories
3. Set **Budgets** for each category
4. Track **Transactions** manually or import from CSV
5. View your **Dashboard** with spending charts and insights

**Complete budget setup: <5 minutes**

## ✨ Features

### Core Features (All Free Forever)
- **Spending Categories**: Create and manage custom spending categories with budgets
- **Monthly Budgets**: Set budget limits per category with prorated tracking
- **Transaction Tracking**: Manual entry and CSV import of transactions
- **Dashboard with Charts**: Visual spending insights with pie charts and bar graphs
- **Goal Tracking**: Set and track savings goals with progress bars
- **Gamification**: Streaks, personalized insights, and wins to build financial habits
- **Privacy-First**: All data stored in localStorage, zero server storage, no tracking
- **Accessibility-First**: WCAG 2.1 AA compliant from day one

### Technical Features
- **CSV Import/Export**: RFC 4180 compliant, round-trip compatible
- **Prorated Budgets**: Accurate budget tracking by day of month
- **Smart Insights**: 30-day recency filter, 50% month-progress threshold
- **Loading States**: Accessible skeletons with screen reader support
- **Error Handling**: PII-safe error logging, user-friendly messages

## 🎯 Competitive Advantages

| Feature | YNAB | Monarch | PocketGuard | PayPlan |
|---------|------|---------|-------------|---------|
| Price | $109/year | $100/year | $75/year | **FREE** |
| Privacy | No | No | No | **Yes** |
| Visual Dashboards | No | Yes | Yes | **Yes** |
| Gamification | No | No | No | **Yes** |
| Accessibility | Partial | Partial | No | **WCAG 2.1 AA** |

**PayPlan wins on**:
- ✅ **Completely free** (vs $75-109/year)
- ✅ **Privacy-first** (no bank sync required)
- ✅ **Visual-first** (charts and gamification)
- ✅ **Accessible** (WCAG 2.1 AA from day one)

## 🏗️ Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Tailwind CSS 4.1, Vite 6.1
- **Charts**: Recharts (accessible, responsive)
- **Validation**: Zod 4.1
- **Storage**: localStorage (privacy-first)
- **Deployment**: Vercel
- **Accessibility**: Radix UI primitives

## 📦 Project Structure

```
PayPlan/
├── frontend/src/
│   ├── components/      # React components
│   ├── pages/           # Route pages (Dashboard, Categories, Budgets, etc.)
│   ├── lib/             # Business logic
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript definitions
├── specs/               # Feature specifications (Spec-Kit)
├── memory/              # Constitution and project context
├── docs/                # Architecture decisions and research
└── .claude/             # Claude Code configuration
```

## 🔒 Privacy & Security

- **Zero Tracking**: No analytics, no telemetry, no third-party scripts
- **localStorage Only**: All data stays on your device
- **No Authentication**: No signup, no login, no email required
- **PII Sanitization**: Error logs sanitize personal information
- **Open Source**: Full transparency

## 📊 Current Status

**Phase**: Phase 1 (Pre-MVP, 0-100 users)
**Version**: v0.2.0 (Dashboard complete)
**Features Complete**:
- ✅ Spending Categories & Budgets (Feature 061)
- ✅ Dashboard with Charts (Feature 062)
- ✅ Gamification (streaks, insights, wins)
- ✅ Transaction Management
- ✅ Goal Progress Tracking

**Next Up**:
- Manual Transaction Entry UI improvements
- Recurring Bill Detection
- Budget Analytics & Insights

## 🤝 Contributing

This project uses the Spec-Kit workflow with Claude Code for AI-assisted development. See [CLAUDE.md](CLAUDE.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

---

**Built with privacy, accessibility, and user trust as core values.**
**Constitution**: [memory/constitution.md](memory/constitution.md) v1.2
