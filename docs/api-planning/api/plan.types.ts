/**
 * Type definitions for /api/plan endpoint
 *
 * Provides type safety for PayPlan v0.1.1 API with hardening pipeline:
 * RateLimit → Idempotency → Validate → Process → Cache → Headers → Response
 *
 * @module plan.types
 */

/**
 * Raw installment item from request body
 * Matches the existing InstallmentSchema from src/lib/api.ts
 */
export interface InstallmentItem {
  provider: string;
  installment_no: number;
  due_date: string;
  amount: number;
  currency: string;
  autopay: boolean;
  late_fee: number;
}

/**
 * Normalized installment after processing
 * Used internally by the API for calculations
 */
export interface NormalizedInstallment {
  provider: string;
  installment_no: number;
  due_date: string;
  amount: number;
  currency: string;
  autopay: boolean;
  late_fee: number;
}

/**
 * Complete request body structure for /api/plan
 */
export interface PlanRequestBody {
  items: InstallmentItem[];
  paycheckDates?: string[];
  payCadence?: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  nextPayday?: string;
  minBuffer: number;
  timeZone: string;
  businessDayMode?: boolean;
  country?: 'US' | 'None';
  customSkipDates?: string[];
}

/**
 * Complete response structure for /api/plan
 */
export interface PlanResponseBody {
  summary: string;
  actionsThisWeek: string[];
  riskFlags: string[];
  ics: string;  // base64 encoded ICS calendar
  normalized: Array<{
    provider: string;
    dueDate: string;
    amount: number;
    autopay?: boolean;
    lateFee?: number;
    wasShifted?: boolean;
    originalDueDate?: string;
    shiftedDueDate?: string;
    shiftReason?: string;
  }>;
  movedDates?: Array<{
    provider: string;
    installment_no: number;
    originalDueDate: string;
    shiftedDueDate: string;
    reason: string;
  }>;
}

/**
 * Extended IncomingMessage with url property
 * Used for extracting request path
 */
export interface RequestWithUrl {
  url?: string;
  method?: string;
  headers: {
    [key: string]: string | string[] | undefined;
  };
}

/**
 * Type for loaded library modules
 * These are dynamically imported from src/lib/
 */
export interface PayPlanModules {
  calculatePaydays: (params: CalculatePaydaysParams) => string[];
  detectRisks: (
    installments: NormalizedInstallment[],
    paydays: string[],
    minBuffer: number,
    timeZone: string
  ) => RiskFlag[];
  generateWeeklyActions: (installments: NormalizedInstallment[], timeZone: string) => string[];
  generateSummary: (
    allInstallments: NormalizedInstallment[],
    weeklyInstallments: NormalizedInstallment[],
    riskFlags: RiskFlag[],
    timeZone: string
  ) => string;
  formatRiskFlags: (riskFlags: RiskFlag[]) => string[];
  normalizeOutput: (installments: NormalizedInstallment[]) => PlanResponseBody['normalized'];
  generateICSWithTZID: (installments: NormalizedInstallment[], timeZone: string) => string;
}

/**
 * Parameters for calculatePaydays function
 */
export interface CalculatePaydaysParams {
  paycheckDates?: string[];
  payCadence?: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
  nextPayday?: string;
  timezone: string;
}

/**
 * Risk flag structure from risk detector
 */
export interface RiskFlag {
  provider: string;
  installment_no: number;
  due_date: string;
  amount: number;
  risk_type: string;
  risk_severity: string;
  risk_message: string;
}

/**
 * Type for JSON response helper
 * Accepts any JSON-serializable value
 */
export type JsonResponseBody =
  | string
  | number
  | boolean
  | null
  | JsonResponseBody[]
  | { [key: string]: JsonResponseBody };
