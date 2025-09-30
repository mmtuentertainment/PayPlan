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
  problemType: typeof PROBLEM_TYPES[keyof typeof PROBLEM_TYPES],
  detail: string,
  host: string,
  instance?: string
): ProblemDetails {
  return {
    type: `https://${host}${problemType.type}`,
    title: problemType.title,
    status: problemType.status,
    detail,
    instance: instance || '/api/plan'
  };
}

export function sendProblem(res: ServerResponse, problem: ProblemDetails): void {
  res.statusCode = problem.status;
  res.setHeader('Content-Type', 'application/problem+json');
  res.end(JSON.stringify(problem));
}