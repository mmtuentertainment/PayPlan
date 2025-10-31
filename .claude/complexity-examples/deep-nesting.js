/**
 * EXAMPLE: Deep Nesting (Nesting Depth: 6)
 *
 * Issues:
 * - 6 levels of nesting (threshold: 4)
 * - Cognitive overload
 * - Arrow-shaped code (rightward drift)
 *
 * Recommended Pattern: Guard Clauses / Early Return (Pattern 4)
 * Alternative: Extract Nested Blocks (Pattern 5)
 */

function validateAndProcessPayment(user, payment, options) {
  if (user) {                                    // Depth 1
    if (user.isActive) {                        // Depth 2
      if (payment) {                            // Depth 3
        if (payment.amount > 0) {               // Depth 4
          if (payment.method) {                 // Depth 5
            if (payment.method === 'card') {    // Depth 6 - EXCEEDS THRESHOLD
              // Process card payment
              console.log('Processing card payment');
              return { success: true };
            } else if (payment.method === 'paypal') {
              console.log('Processing PayPal payment');
              return { success: true };
            }
          } else {
            throw new Error('Payment method required');
          }
        } else {
          throw new Error('Invalid amount');
        }
      } else {
        throw new Error('Payment required');
      }
    } else {
      throw new Error('User not active');
    }
  } else {
    throw new Error('User required');
  }
}

// Max Nesting Depth: 6 (WARNING - exceeds threshold of 4)

/**
 * REFACTORED VERSION using Guard Clauses:
 *
 * function validateAndProcessPayment(user, payment, options) {
 *   // Guard clauses - fail fast
 *   if (!user) throw new Error('User required');
 *   if (!user.isActive) throw new Error('User not active');
 *   if (!payment) throw new Error('Payment required');
 *   if (payment.amount <= 0) throw new Error('Invalid amount');
 *   if (!payment.method) throw new Error('Payment method required');
 *
 *   // Happy path - main logic
 *   if (payment.method === 'card') {
 *     console.log('Processing card payment');
 *     return { success: true };
 *   }
 *
 *   if (payment.method === 'paypal') {
 *     console.log('Processing PayPal payment');
 *     return { success: true };
 *   }
 *
 *   throw new Error('Unsupported payment method');
 * }
 *
 * Nesting Depth: 1 ✅
 */
