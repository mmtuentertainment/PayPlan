/**
 * EXAMPLE: High Cyclomatic Complexity (Complexity: 16)
 *
 * Issues:
 * - 15 decision points (if/else, switch, ternary)
 * - Hard to test (2^15 = 32,768 paths)
 * - Violates Single Responsibility
 *
 * Recommended Pattern: Extract Method (Pattern 1)
 * Alternative: Replace Conditional with Polymorphism (Pattern 2)
 */

function processUserOrder(user, order, options) {
  // Complexity starts at 1

  if (!user) {                          // +1 = 2
    throw new Error('User required');
  }

  if (!order || !order.items) {         // +1 = 3
    throw new Error('Order required');
  }

  let total = 0;

  for (let item of order.items) {       // +1 = 4
    if (item.quantity <= 0) {           // +1 = 5
      continue;
    }

    let itemTotal = item.price * item.quantity;

    // Discount logic
    if (item.discount) {                                    // +1 = 6
      if (item.discount.type === 'percentage') {           // +1 = 7
        itemTotal -= itemTotal * (item.discount.value / 100);
      } else if (item.discount.type === 'fixed') {         // +1 = 8
        itemTotal -= item.discount.value;
      } else if (item.discount.type === 'bogo') {          // +1 = 9
        itemTotal = item.quantity > 1 ? itemTotal / 2 : itemTotal;  // +1 = 10
      }
    }

    // User tier discounts
    if (user.tier === 'gold') {                            // +1 = 11
      itemTotal *= 0.9;  // 10% discount
    } else if (user.tier === 'platinum') {                 // +1 = 12
      itemTotal *= 0.85; // 15% discount
    } else if (user.tier === 'diamond') {                  // +1 = 13
      itemTotal *= 0.8;  // 20% discount
    }

    total += itemTotal;
  }

  // Shipping logic
  if (options && options.shipping) {                       // +1 = 14
    if (options.shipping === 'express' && total > 50) {    // +2 = 16
      total += 15;
    } else {
      total += 5;
    }
  }

  return total;
}

// Total Complexity: 16 (CRITICAL - exceeds threshold of 10)
