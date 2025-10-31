/**
 * EXAMPLE: Long Function (85 lines)
 *
 * Issues:
 * - Function length: 85 lines (threshold: 50)
 * - Multiple responsibilities
 * - Comment blocks indicating separate concerns
 *
 * Recommended Pattern: Replace Comments with Named Functions (Pattern 8)
 * Then: Extract Helper Methods (Pattern 7)
 */

function generateUserReport(userId) {
  // Validate input
  if (!userId) {
    throw new Error('User ID required');
  }

  // Fetch user data
  const user = database.users.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Calculate account age
  const accountAge = Date.now() - user.createdAt;
  const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));

  // Fetch user transactions
  const transactions = database.transactions.findByUser(userId);

  // Calculate total spending
  let totalSpent = 0;
  for (let txn of transactions) {
    if (txn.type === 'debit') {
      totalSpent += txn.amount;
    }
  }

  // Calculate average monthly spending
  const monthsActive = Math.max(1, accountAgeDays / 30);
  const avgMonthlySpending = totalSpent / monthsActive;

  // Determine user tier
  let tier = 'bronze';
  if (avgMonthlySpending > 1000) {
    tier = 'diamond';
  } else if (avgMonthlySpending > 500) {
    tier = 'platinum';
  } else if (avgMonthlySpending > 100) {
    tier = 'gold';
  }

  // Calculate loyalty points
  const basePoints = Math.floor(totalSpent / 10);
  const bonusPoints = accountAgeDays > 365 ? 500 : 0;
  const totalPoints = basePoints + bonusPoints;

  // Check for milestones
  const milestones = [];
  if (accountAgeDays >= 365) {
    milestones.push('1 Year Anniversary');
  }
  if (totalSpent >= 10000) {
    milestones.push('$10K Club');
  }
  if (transactions.length >= 100) {
    milestones.push('Century of Transactions');
  }

  // Format report
  const report = {
    userId: user.id,
    name: user.name,
    email: user.email,
    accountAgeDays,
    tier,
    stats: {
      totalTransactions: transactions.length,
      totalSpent: totalSpent.toFixed(2),
      avgMonthlySpending: avgMonthlySpending.toFixed(2),
      loyaltyPoints: totalPoints
    },
    milestones,
    generatedAt: new Date().toISOString()
  };

  return report;
}

// Function Length: 85 lines (WARNING - exceeds threshold of 50)
// Comment blocks indicate this should be multiple functions

/**
 * REFACTORED VERSION:
 *
 * function generateUserReport(userId) {
 *   const user = validateAndFetchUser(userId);
 *   const transactions = fetchUserTransactions(userId);
 *   const accountAgeDays = calculateAccountAge(user.createdAt);
 *
 *   return formatUserReport(user, transactions, accountAgeDays);
 * }
 *
 * function validateAndFetchUser(userId) { ... }
 * function fetchUserTransactions(userId) { ... }
 * function calculateAccountAge(createdAt) { ... }
 * function calculateUserTier(avgMonthlySpending) { ... }
 * function calculateLoyaltyPoints(totalSpent, accountAgeDays) { ... }
 * function detectMilestones(accountAgeDays, totalSpent, txnCount) { ... }
 * function formatUserReport(user, transactions, accountAgeDays) { ... }
 *
 * Main function: 6 lines ✅
 * Each helper: <15 lines ✅
 */
