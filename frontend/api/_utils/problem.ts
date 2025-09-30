import type { ServerResponse } from 'http';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}

export const PROBLEM_TYPES = {
  VALIDATION_ERROR: {
    type: '/problems/validation-error',
    title: 'Validation Error',
    status: 400
  },
  METHOD_NOT_ALLOWED: {
    type: '/problems/method-not-allowed',
    title: 'Method Not Allowed',
    status: 405
  },
  IDEMPOTENCY_KEY_CONFLICT: {
    type: '/problems/idempotency-key-conflict',
    title: 'Idempotency Key Conflict',
    status: 409
  },
  RATE_LIMIT_EXCEEDED: {
    type: '/problems/rate-limit-exceeded',
    title: 'Rate Limit Exceeded',
    status: 429
  },
  INTERNAL_ERROR: {
    type: '/problems/internal-error',
    title: 'Internal Server Error',
    status: 500
  }
} as const;

export function buildProblem(
  params: {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance?: string;
  }
): ProblemDetails {
  // If type is relative path, make it absolute using current host
  // Otherwise use as-is (for flexibility)
  const typeUri = params.type.startsWith('/')
    ? `https://${process.env.VERCEL_URL || 'localhost'}${params.type}`
    : params.type;

  return {
    type: typeUri,
    title: params.title,
    status: params.status,
    detail: params.detail,
    instance: params.instance || '/api/plan'
  };
}

export function sendProblem(res: ServerResponse, problem: ProblemDetails): void {
  res.statusCode = problem.status;
  res.setHeader('Content-Type', 'application/problem+json');
  res.end(JSON.stringify(problem));
}