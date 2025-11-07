# PayPlan Code Context Summary

This document captures both the structural snapshot originally gathered (line counts, import counts, notable sections) and the contextual relevance for each audited file.

## Archive Service (`frontend/src/features/archive/lib/ArchiveService.ts`)
### Snapshot
- 663 lines, 9 imports
- Key sections: class export at line 61, validation comments around lines 92–214, rollback safeguards, helper utilities for metadata/payment aggregation through lines 640–660
### Contextual Relevance
- Central orchestrator for archive creation, enforcing name/payment/storage rules before persisting via `ArchiveStorage`
- Implements rollback logic to prevent orphaned data and generates metadata/stats consumed by Archive detail views

## Preference Storage (`frontend/src/lib/preferences/PreferenceStorageService.ts`)
### Snapshot
- 581 lines, 3 imports
- Sections cover adapter-backed service definition (lines 34–135) and schema/normalization/import-export helpers (lines 146–580)
### Contextual Relevance
- Backs user preference flows with adapter abstraction and schema-driven parsing to keep migrations safe
- Houses profile limit logic and import/export sanitization used by preference settings and backup/restore UX

## Archive Storage (`frontend/src/features/archive/lib/ArchiveStorage.ts`)
### Snapshot
- 475 lines, 5 imports
- Class definition at line 27; methods for index CRUD, serialization, byte-size calculations, and zod-based validation through lines 470
### Contextual Relevance
- Low-level persistence layer that `ArchiveService` depends on for archives, payments, and metadata indices
- Initializes storage structures on first run and guards against corrupt snapshots before higher-level services consume them

## Gamification (`frontend/src/features/dashboard/lib/gamification.ts`)
### Snapshot
- 488 lines, 6 imports
- Exported APIs include `GAMIFICATION_CONFIG`, streak helpers, async persistence routines, insight/win generators (sections starting lines 11, 61, 128, 186, 237, 280, 417)
### Contextual Relevance
- Powers dashboard engagement: streak tracking, achievement insights, and celebratory “recent win” surfacing
- Persists gamification state and analyzes transactions/budgets to feed dashboard UI and telemetry

## Goal Storage (`frontend/src/features/goals/lib/GoalStorageService.ts`)
### Snapshot
- 460 lines, 5 imports
- Exported types/functions for goal CRUD, quota checks, contributions, archive/unarchive flow (sections from lines 4–453)
### Contextual Relevance
- Authoritative storage + validation engine for Goal features
- Enforces business constraints (contribution limits, auto-complete behavior) and keeps archive interactions consistent with goal pages
