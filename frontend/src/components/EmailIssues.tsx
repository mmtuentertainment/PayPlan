import type { Issue } from '../lib/email-extractor';

interface EmailIssuesProps {
  issues: Issue[];
}

export function EmailIssues({ issues }: EmailIssuesProps) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="mt-6" role="status" aria-live="polite">
      <h3 className="font-medium text-yellow-700 mb-2">
        Issues ({issues.length})
      </h3>
      <div className="space-y-2">
        {issues.map((issue) => (
          <div
            key={issue.id}
            role="group"
            aria-label={`Extraction issue: ${issue.reason}`}
            className="p-3 bg-yellow-50 border border-yellow-200 rounded"
          >
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ {issue.reason}
            </p>
            {issue.snippet && (
              <p className="text-xs text-gray-600 mt-1 font-mono" aria-describedby={`snippet-${issue.id}`}>
                <span id={`snippet-${issue.id}`}>"{issue.snippet}..."</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
