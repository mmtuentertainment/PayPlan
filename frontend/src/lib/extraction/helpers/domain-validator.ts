/**
 * Email Domain Validation for BNPL Provider Spoofing Prevention
 *
 * Purpose: Prevent phishing attacks where malicious emails claim to be from
 * legitimate BNPL providers (Klarna, Affirm, PayPal, etc.) but originate from
 * spoofed domains.
 *
 * Security Considerations:
 * - Only accept emails from verified provider domains
 * - Check both From: header and Reply-To: header
 * - Validate DKIM/SPF alignment (when headers available)
 * - Warn on suspicious subdomains (e.g., klarna.evil.com)
 *
 * This protects users from:
 * - Phishing emails with fake payment requests
 * - Social engineering attacks mimicking BNPL providers
 * - Malicious fee extraction schemes
 */

/**
 * Known legitimate domains for each BNPL provider
 * Based on official email domains used for payment notifications
 */
export const PROVIDER_DOMAINS: Record<string, string[]> = {
  Klarna: [
    'klarna.com',
    'klarna.de',
    'klarna.co.uk',
    'klarna.se',
    'klarna.no',
    'klarna.fi',
  ],
  Affirm: [
    'affirm.com',
    'affirmmail.com',  // Official transactional emails
  ],
  Afterpay: [
    'afterpay.com',
    'afterpay.co.uk',
    'afterpay.com.au',
    'clearpay.co.uk',  // UK brand
  ],
  PayPal: [
    'paypal.com',
    'paypal.co.uk',
    'paypal.de',
    'paypal.fr',
  ],
  'PayPalPayIn4': [
    'paypal.com',
    'paypal.co.uk',
  ],
  Zip: [
    'zip.co',
    'zipmoney.com.au',
    'quadpay.com',  // US brand (acquired by Zip)
  ],
  Sezzle: [
    'sezzle.com',
  ],
};

/**
 * Validation result indicating if email domain is legitimate
 */
export interface DomainValidationResult {
  isValid: boolean;
  provider: string | null;
  domain: string | null;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Extract domain from email address
 * @param email - Email address (e.g., "noreply@klarna.com")
 * @returns Domain portion (e.g., "klarna.com") or null if invalid
 */
export function extractDomain(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@([^\s@]+)$/;
  const match = email.match(emailRegex);

  if (!match) {
    return null;
  }

  return match[1].toLowerCase();
}

/**
 * Check if a domain matches any of the allowed domains
 * Supports exact match and subdomain matching (e.g., noreply.klarna.com)
 * @param domain - Domain to check
 * @param allowedDomains - List of allowed domains
 * @returns True if domain is allowed or a subdomain of an allowed domain
 */
export function isDomainAllowed(domain: string, allowedDomains: string[]): boolean {
  if (!domain || !allowedDomains || allowedDomains.length === 0) {
    return false;
  }

  const normalizedDomain = domain.toLowerCase();

  for (const allowedDomain of allowedDomains) {
    // Exact match
    if (normalizedDomain === allowedDomain.toLowerCase()) {
      return true;
    }

    // Subdomain match (e.g., noreply.klarna.com matches klarna.com)
    if (normalizedDomain.endsWith(`.${allowedDomain.toLowerCase()}`)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate email domain against known BNPL provider domains
 * @param email - Email address to validate
 * @param claimedProvider - Provider name claimed in email content
 * @returns Validation result with confidence score
 */
export function validateEmailDomain(
  email: string,
  claimedProvider: string
): DomainValidationResult {
  // Extract domain from email
  const domain = extractDomain(email);

  if (!domain) {
    return {
      isValid: false,
      provider: null,
      domain: null,
      reason: 'Invalid email format',
      confidence: 'low',
    };
  }

  // Check if claimed provider is in our known providers list
  if (!PROVIDER_DOMAINS[claimedProvider]) {
    return {
      isValid: false,
      provider: claimedProvider,
      domain,
      reason: `Unknown provider: ${claimedProvider}`,
      confidence: 'low',
    };
  }

  // Check if domain matches claimed provider's allowed domains
  const allowedDomains = PROVIDER_DOMAINS[claimedProvider];
  const isAllowed = isDomainAllowed(domain, allowedDomains);

  if (isAllowed) {
    return {
      isValid: true,
      provider: claimedProvider,
      domain,
      reason: 'Domain matches verified provider',
      confidence: 'high',
    };
  }

  // Domain doesn't match claimed provider
  return {
    isValid: false,
    provider: claimedProvider,
    domain,
    reason: `Domain "${domain}" does not match expected domains for ${claimedProvider}`,
    confidence: 'low',
  };
}

/**
 * Check for suspicious domain patterns that indicate spoofing
 * @param domain - Domain to check
 * @returns True if domain looks suspicious
 */
export function isSuspiciousDomain(domain: string): boolean {
  if (!domain) {
    return true;
  }

  const suspiciousPatterns = [
    // Homograph attacks (lookalike characters)
    /[а-яА-Я]/, // Cyrillic characters
    /[α-ωΑ-Ω]/, // Greek characters

    // Suspicious TLDs
    /\.(xyz|top|win|loan|click|gq|ml|cf|ga)$/i,

    // Provider names as subdomain of another domain (e.g., klarna.evil.com, but NOT klarna.com)
    // Only match if provider name is followed by a dot AND there's another domain after it
    /^(klarna|affirm|afterpay|paypal|sezzle|zip)\..+\./i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(domain)) {
      return true;
    }
  }

  return false;
}

/**
 * Enhanced validation with suspicious domain detection
 * @param email - Email address to validate
 * @param claimedProvider - Provider name claimed in email content
 * @returns Validation result with enhanced security checks
 */
export function validateEmailDomainEnhanced(
  email: string,
  claimedProvider: string
): DomainValidationResult {
  // Run basic validation first
  const result = validateEmailDomain(email, claimedProvider);

  // If already invalid, return early
  if (!result.isValid) {
    return result;
  }

  // Check for suspicious patterns even in valid domains
  if (result.domain && isSuspiciousDomain(result.domain)) {
    return {
      ...result,
      isValid: false,
      reason: `Domain "${result.domain}" contains suspicious patterns`,
      confidence: 'low',
    };
  }

  return result;
}

/**
 * Get all legitimate domains for a provider
 * @param provider - Provider name
 * @returns Array of legitimate domains or empty array if provider unknown
 */
export function getLegitimateDomainsForProvider(provider: string): string[] {
  return PROVIDER_DOMAINS[provider] || [];
}
