import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Home from './pages/Home';
import Import from './pages/Import';
import type { PreferenceCategoryType, UserPreference } from './lib/preferences/types';

// Lazy load heavy/infrequently used pages to reduce main bundle size
const Docs = lazy(() => import('./pages/Docs'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Demo = lazy(() => import('./pages/Demo'));
const BNPLParser = lazy(() => import('./pages/BNPLParser').then(m => ({ default: m.BNPLParser })));
const Categories = lazy(() => import('./pages/Categories'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
import { PreferenceSettings } from './components/preferences/PreferenceSettings';
import { ToastNotification } from './components/preferences/ToastNotification';
import { ErrorTest } from './components/ErrorTest';
import { usePreferences } from './hooks/usePreferences';
import { RESTORATION_TARGET_MS } from './lib/preferences/constants';
import { validatePreferenceUpdate } from './lib/preferences/schemas';
import { ZodError } from 'zod';
import { ArchiveListPage } from './pages/ArchiveListPage';
import { ArchiveDetailView } from './pages/ArchiveDetailView';
import { ROUTES } from './routes';
import { NavigationHeader } from './components/navigation/NavigationHeader';
import Breadcrumbs from './components/navigation/Breadcrumbs';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  // Initialize preferences hook at app level
  const {
    preferences,
    error,
    statusMessage,
    updatePreference,
    resetPreferences,
  } = usePreferences();

  // Toast state management
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Performance monitoring (T034: NFR-001 - <100ms restoration)
  useEffect(() => {
    const perfMark = performance.getEntriesByName('preferences-restore-complete');
    if (perfMark.length > 0 && import.meta.env.DEV) {
      const duration = perfMark[0].duration || 0;
      if (duration > RESTORATION_TARGET_MS) {
        console.warn(
          `⚠️ Preference restoration slow: ${duration.toFixed(2)}ms (target: <${RESTORATION_TARGET_MS}ms)`
        );
      } else {
        console.log(`✅ Preferences restored in ${duration.toFixed(2)}ms`);
      }
    }
  }, []);

  // Show toast for status messages
  useEffect(() => {
    if (statusMessage) {
      setToast({
        message: statusMessage,
        type: error ? 'error' : 'success',
      });
    }
  }, [statusMessage, error]);

  // Show toast for errors
  useEffect(() => {
    if (error && !statusMessage) {
      setToast({
        message: error.message,
        type: 'error',
      });
    }
  }, [error, statusMessage]);

  return (
    <BrowserRouter>
      <AppContent
        preferences={preferences}
        updatePreference={updatePreference}
        resetPreferences={resetPreferences}
        toast={toast}
        setToast={setToast}
      />
    </BrowserRouter>
  );
}

// Toast type for notification state
interface Toast {
  message: string;
  type: 'success' | 'error';
}

// AppContent props interface
interface AppContentProps {
  preferences: Map<PreferenceCategoryType, UserPreference>;
  updatePreference: (
    category: PreferenceCategoryType,
    value: unknown,
    optInStatus?: boolean
  ) => void;
  resetPreferences: (category?: PreferenceCategoryType) => void;
  toast: Toast | null;
  setToast: Dispatch<SetStateAction<Toast | null>>;
}

// Separate component to access useLocation inside BrowserRouter (needed for T045 performance logging)
function AppContent({
  preferences,
  updatePreference,
  resetPreferences,
  toast,
  setToast,
}: AppContentProps) {
  const location = useLocation();

  // T045: Performance logging for route navigation (SC-007: <200ms target)
  useEffect(() => {
    // Mark navigation start
    performance.mark('navigation-start');

    // Schedule measurement after next paint
    requestAnimationFrame(() => {
      performance.mark('navigation-end');

      try {
        performance.measure('route-navigation', 'navigation-start', 'navigation-end');
        const measure = performance.getEntriesByName('route-navigation').pop();

        if (measure && import.meta.env.DEV) {
          const duration = measure.duration;
          const TARGET_MS = 200; // SC-007 target

          if (duration > TARGET_MS) {
            console.warn(
              `⚠️ [Feature 018] Route navigation slow: ${duration.toFixed(2)}ms (target: <${TARGET_MS}ms) to ${location.pathname}`
            );
          } else {
            console.log(
              `✅ [Feature 018] Route navigation: ${duration.toFixed(2)}ms to ${location.pathname}`
            );
          }
        }

        // Clean up marks
        performance.clearMarks('navigation-start');
        performance.clearMarks('navigation-end');
        performance.clearMeasures('route-navigation');
      } catch (err) {
        // Log error only in development (CodeRabbit: prevent silent failures)
        if (import.meta.env.DEV) {
          console.debug('Performance API error:', err);
        }
      }
    });
  }, [location.pathname]);

  return (
    <>
      {/* Skip link for accessibility (WCAG 2.1 AA - Feature 017) */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Persistent navigation header (Feature 017) */}
      <NavigationHeader />

      {/* Breadcrumb navigation (Feature 017 - User Story 3) */}
      <Breadcrumbs />

      {/* Main content */}
      <main id="main-content" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div
                className="flex items-center justify-center min-h-screen"
                role="status"
                aria-live="polite"
                aria-label="Loading page content"
              >
                <span className="text-gray-600">Loading...</span>
              </div>
            }
          >
            <Routes>
            {/* Default route: Budget Dashboard (Feature 062 - Phase 1 pivot) */}
            <Route path="/" element={<Dashboard />} />

            {/* BNPL routes (archived, still accessible) */}
            <Route path="/bnpl-home" element={<Home />} />
            <Route path={ROUTES.BNPL_PARSER} element={<BNPLParser />} />

            {/* Budget app routes */}
          <Route path={ROUTES.CATEGORIES} element={<Categories />} />
          <Route path={ROUTES.BUDGETS} element={<Budgets />} />
          <Route path={ROUTES.TRANSACTIONS} element={<Transactions />} />
          <Route path={ROUTES.ARCHIVES} element={<ArchiveListPage />} />
          <Route path={ROUTES.ARCHIVE_DETAIL_PATTERN} element={<ArchiveDetailView />} />

          {/* System routes */}
            <Route path="/docs" element={<Docs />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/import" element={<Import />} />
          <Route
            path={ROUTES.SETTINGS}
            element={
            <PreferenceSettings
              preferences={{
                version: '1.0.0',
                preferences,
                totalSize: 0, // Will be calculated by service
                lastModified: new Date().toISOString(),
              }}
              onSave={(category, value, optIn) => {
                try {
                  // Validate inputs before calling updatePreference
                  const validated = validatePreferenceUpdate({ category, value, optIn });
                  updatePreference(validated.category, validated.value, validated.optIn);
                } catch (err) {
                  if (err instanceof ZodError) {
                    // Only log detailed validation errors in development (prevent PII leaks)
                    if (import.meta.env.DEV) {
                      console.error('Preference validation failed:', err.issues);
                    }
                    setToast({
                      message: `Invalid preference value: ${err.issues[0]?.message || 'Unknown error'}`,
                      type: 'error',
                    });
                  } else if (err instanceof Error) {
                    // Only log unexpected errors in development (prevent PII leaks)
                    if (import.meta.env.DEV) {
                      console.error('Unexpected error during preference save:', err);
                    }

                    // Provide specific error messages for common failure modes (P1: Claude review)
                    let errorMessage = 'Failed to save preference. Please try again.';

                    // Storage quota exceeded
                    if (err.name === 'QuotaExceededError' || err.message.includes('quota')) {
                      errorMessage = 'Storage quota exceeded. Please clear some browser data and try again.';
                    }
                    // Network errors (if preferences ever sync)
                    else if (err.message.includes('network') || err.message.includes('fetch')) {
                      errorMessage = 'Network error. Please check your connection and try again.';
                    }
                    // localStorage disabled/unavailable
                    else if (err.message.includes('localStorage') || err.message.includes('storage')) {
                      errorMessage = 'Browser storage is disabled. Please enable cookies/storage and try again.';
                    }

                    setToast({
                      message: errorMessage,
                      type: 'error',
                    });
                  } else {
                    // Non-Error thrown (shouldn't happen, but handle gracefully)
                    setToast({
                      message: 'An unexpected error occurred. Please try again.',
                      type: 'error',
                    });
                  }
                }
              }}
              onResetAll={() => resetPreferences()}
            />
          }
        />
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <ErrorTest />

      {/* Global toast notification system */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}

export default App;
