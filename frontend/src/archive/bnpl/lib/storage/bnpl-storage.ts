/**
 * BNPL Payment Schedule Storage
 *
 * localStorage persistence layer for BNPL payment schedules.
 * Privacy-first: All data stays client-side, no server communication.
 *
 * Storage Format:
 * - Key: 'payplan_bnpl_schedules'
 * - Value: JSON array of BNPLPaymentSchedule objects
 */

import type { BNPLPaymentSchedule } from '../../types/bnpl';
import { BNPLErrorType } from '../../types/bnpl';
import { createUserFriendlyError } from '../bnpl-parser';

const STORAGE_KEY = 'payplan_bnpl_schedules';

/**
 * Save a BNPL payment schedule to localStorage
 *
 * @param schedule - Payment schedule to save
 * @returns Success status or error
 */
export function savePaymentSchedule(
  schedule: BNPLPaymentSchedule
): { success: boolean; error?: string } {
  try {
    // Get existing schedules
    const existingSchedules = getAllPaymentSchedules();

    // Check for duplicates
    const isDuplicate = existingSchedules.some(
      (existing) =>
        existing.merchant === schedule.merchant &&
        existing.totalAmount === schedule.totalAmount &&
        Math.abs(
          new Date(existing.createdAt).getTime() -
            new Date(schedule.createdAt).getTime()
        ) <
          60000 // Within 1 minute
    );

    if (isDuplicate) {
      return {
        success: false,
        error: createUserFriendlyError({
          type: BNPLErrorType.DUPLICATE_EMAIL,
          message:
            'This payment schedule appears to be a duplicate. It has the same merchant, amount, and was created recently.',
          suggestion:
            'If this is intentional, wait a minute and try again, or manually edit the merchant name.',
        }).message,
      };
    }

    // Add new schedule
    existingSchedules.push(schedule);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingSchedules));

    return { success: true };
  } catch (error) {
    console.error('Error saving payment schedule:', error);

    // Check if quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return {
        success: false,
        error: createUserFriendlyError({
          type: BNPLErrorType.STORAGE_ERROR,
          message: 'Storage limit reached. Cannot save payment schedule.',
          suggestion:
            'Please delete old payment schedules or clear browser data to continue.',
        }).message,
      };
    }

    return {
      success: false,
      error: 'Failed to save payment schedule. Please try again.',
    };
  }
}

/**
 * Get all saved payment schedules from localStorage
 *
 * @returns Array of payment schedules (empty if none)
 */
export function getAllPaymentSchedules(): BNPLPaymentSchedule[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }

    const schedules = JSON.parse(data) as BNPLPaymentSchedule[];

    // Sort by creation date (newest first)
    schedules.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return schedules;
  } catch (error) {
    console.error('Error reading payment schedules:', error);
    return [];
  }
}

/**
 * Get a payment schedule by ID
 *
 * @param id - Schedule ID
 * @returns Payment schedule or null if not found
 */
export function getPaymentScheduleById(
  id: string
): BNPLPaymentSchedule | null {
  const schedules = getAllPaymentSchedules();
  return schedules.find((s) => s.id === id) || null;
}

/**
 * Delete a payment schedule by ID
 *
 * @param id - Schedule ID to delete
 * @returns Success status
 */
export function deletePaymentSchedule(id: string): { success: boolean } {
  try {
    const schedules = getAllPaymentSchedules();
    const filtered = schedules.filter((s) => s.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    return { success: true };
  } catch (error) {
    console.error('Error deleting payment schedule:', error);
    return { success: false };
  }
}

/**
 * Delete all payment schedules (clear all data)
 *
 * @returns Success status
 */
export function deleteAllPaymentSchedules(): { success: boolean } {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('Error clearing payment schedules:', error);
    return { success: false };
  }
}

/**
 * Get payment schedules filtered by provider
 *
 * @param provider - BNPL provider name
 * @returns Array of payment schedules from that provider
 */
export function getPaymentSchedulesByProvider(
  provider: string
): BNPLPaymentSchedule[] {
  const schedules = getAllPaymentSchedules();
  return schedules.filter((s) => s.provider === provider);
}

/**
 * Get upcoming installments (due in the next N days)
 *
 * @param daysAhead - Number of days to look ahead (default: 7)
 * @returns Array of upcoming installments with schedule info
 */
export function getUpcomingInstallments(daysAhead: number = 7): Array<{
  schedule: BNPLPaymentSchedule;
  installment: BNPLPaymentSchedule['installments'][0];
}> {
  const schedules = getAllPaymentSchedules();
  const upcoming: Array<{
    schedule: BNPLPaymentSchedule;
    installment: BNPLPaymentSchedule['installments'][0];
  }> = [];

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  schedules.forEach((schedule) => {
    schedule.installments.forEach((installment) => {
      const dueDate = new Date(installment.dueDate);
      if (dueDate >= today && dueDate <= futureDate) {
        upcoming.push({ schedule, installment });
      }
    });
  });

  // Sort by due date (soonest first)
  upcoming.sort(
    (a, b) =>
      new Date(a.installment.dueDate).getTime() -
      new Date(b.installment.dueDate).getTime()
  );

  return upcoming;
}

/**
 * Get total debt across all BNPL schedules
 *
 * @returns Total remaining debt (sum of all installments)
 */
export function getTotalRemainingDebt(): number {
  const schedules = getAllPaymentSchedules();
  return schedules.reduce((total, schedule) => {
    const scheduleDebt = schedule.installments.reduce(
      (sum, installment) => sum + installment.amount,
      0
    );
    return total + scheduleDebt;
  }, 0);
}

/**
 * Check if duplicate schedule exists
 *
 * @param schedule - Schedule to check
 * @returns True if duplicate exists
 */
export function isDuplicateSchedule(schedule: {
  merchant: string;
  totalAmount: number;
  createdAt: string;
}): boolean {
  const existingSchedules = getAllPaymentSchedules();

  return existingSchedules.some(
    (existing) =>
      existing.merchant === schedule.merchant &&
      existing.totalAmount === schedule.totalAmount &&
      Math.abs(
        new Date(existing.createdAt).getTime() -
          new Date(schedule.createdAt).getTime()
      ) <
        60000 // Within 1 minute
  );
}
