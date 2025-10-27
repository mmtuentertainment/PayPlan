/**
 * BNPL Parser Registry
 *
 * Auto-registers all provider parsers at module initialization.
 */

import { registerParser } from '../bnpl-parser';
import { klarnaParser } from './klarna';
import { affirmParser } from './affirm';
import { afterpayParser } from './afterpay';
import { sezzleParser } from './sezzle';
import { zipParser } from './zip';
import { paypalCreditParser } from './paypal-credit';

// Register all parsers
registerParser(klarnaParser);
registerParser(affirmParser);
registerParser(afterpayParser);
registerParser(sezzleParser);
registerParser(zipParser);
registerParser(paypalCreditParser);

// Re-export parsers for direct access if needed
export {
  klarnaParser,
  affirmParser,
  afterpayParser,
  sezzleParser,
  zipParser,
  paypalCreditParser,
};
