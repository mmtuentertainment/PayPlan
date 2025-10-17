import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Docs from './pages/Docs';
import Privacy from './pages/Privacy';
import Demo from './pages/Demo';
import Import from './pages/Import';
import { PreferenceSettings } from './components/preferences/PreferenceSettings';
import { ToastNotification } from './components/preferences/ToastNotification';
import { ErrorTest } from './components/ErrorTest';
import { usePreferences } from './hooks/usePreferences';
import { RESTORATION_TARGET_MS } from './lib/preferences/constants';
import { validatePreferenceUpdate } from './lib/preferences/schemas';
import { ZodError } from 'zod';
import { ArchiveListPage } from './pages/ArchiveListPage';
import { ArchiveDetailView } from './pages/ArchiveDetailView';

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
    if (perfMark.length > 0 && process.env.NODE_ENV === 'development') {
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/import" element={<Import />} />
        <Route path="/archives" element={<ArchiveListPage />} />
        <Route path="/archives/:id" element={<ArchiveDetailView />} />
        <Route
          path="/settings/preferences"
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
                    console.error('Preference validation failed:', err.issues);
                    setToast({
                      message: `Invalid preference value: ${err.issues[0]?.message || 'Unknown error'}`,
                      type: 'error',
                    });
                  } else {
                    console.error('Unexpected error during preference save:', err);
                    setToast({
                      message: 'Failed to save preference. Please try again.',
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
      <ErrorTest />

      {/* Global toast notification system */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </BrowserRouter>
  );
}

export default App;