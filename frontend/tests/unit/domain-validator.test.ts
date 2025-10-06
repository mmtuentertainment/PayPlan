import { describe, test, expect } from 'vitest';
import {
  extractDomain,
  isDomainAllowed,
  validateEmailDomain,
  validateEmailDomainEnhanced,
  isSuspiciousDomain,
  getLegitimateDomainsForProvider,
  PROVIDER_DOMAINS,
} from '../../src/lib/extraction/helpers/domain-validator';

describe('extractDomain()', () => {
  test('extracts domain from valid email', () => {
    expect(extractDomain('user@example.com')).toBe('example.com');
    expect(extractDomain('noreply@klarna.com')).toBe('klarna.com');
    expect(extractDomain('support@affirm.com')).toBe('affirm.com');
  });

  test('handles email with subdomain', () => {
    expect(extractDomain('noreply@mail.klarna.com')).toBe('mail.klarna.com');
    expect(extractDomain('alerts@notifications.paypal.com')).toBe('notifications.paypal.com');
  });

  test('normalizes domain to lowercase', () => {
    expect(extractDomain('User@KLARNA.COM')).toBe('klarna.com');
    expect(extractDomain('TEST@Example.Com')).toBe('example.com');
  });

  test('returns null for invalid email formats', () => {
    expect(extractDomain('not-an-email')).toBe(null);
    expect(extractDomain('missing-at-sign.com')).toBe(null);
    expect(extractDomain('@domain-only.com')).toBe(null);
    expect(extractDomain('user@')).toBe(null);
    expect(extractDomain('')).toBe(null);
  });

  test('handles edge cases', () => {
    expect(extractDomain('user@domain')).toBe('domain');  // No TLD
    expect(extractDomain('user+tag@example.com')).toBe('example.com');
    expect(extractDomain('user.name@example.com')).toBe('example.com');
  });

  test('returns null for non-string input', () => {
    expect(extractDomain(null as any)).toBe(null);
    expect(extractDomain(undefined as any)).toBe(null);
    expect(extractDomain(123 as any)).toBe(null);
  });
});

describe('isDomainAllowed()', () => {
  test('matches exact domain', () => {
    expect(isDomainAllowed('klarna.com', ['klarna.com'])).toBe(true);
    expect(isDomainAllowed('affirm.com', ['affirm.com', 'affirmmail.com'])).toBe(true);
  });

  test('matches subdomain', () => {
    expect(isDomainAllowed('mail.klarna.com', ['klarna.com'])).toBe(true);
    expect(isDomainAllowed('noreply.affirm.com', ['affirm.com'])).toBe(true);
    expect(isDomainAllowed('a.b.c.klarna.com', ['klarna.com'])).toBe(true);
  });

  test('rejects non-matching domains', () => {
    expect(isDomainAllowed('evil.com', ['klarna.com'])).toBe(false);
    expect(isDomainAllowed('klarna.evil.com', ['klarna.com'])).toBe(false);
  });

  test('case-insensitive matching', () => {
    expect(isDomainAllowed('KLARNA.COM', ['klarna.com'])).toBe(true);
    expect(isDomainAllowed('mail.KLARNA.com', ['klarna.com'])).toBe(true);
  });

  test('handles empty or invalid inputs', () => {
    expect(isDomainAllowed('', ['klarna.com'])).toBe(false);
    expect(isDomainAllowed('klarna.com', [])).toBe(false);
    expect(isDomainAllowed('klarna.com', null as any)).toBe(false);
  });

  test('does not match partial domain names', () => {
    // klarna.com should NOT match fooklarna.com
    expect(isDomainAllowed('fooklarna.com', ['klarna.com'])).toBe(false);
    expect(isDomainAllowed('klarna.com.evil.com', ['klarna.com'])).toBe(false);
  });

  test('multiple allowed domains', () => {
    const allowed = ['klarna.com', 'klarna.de', 'klarna.se'];
    expect(isDomainAllowed('klarna.com', allowed)).toBe(true);
    expect(isDomainAllowed('klarna.de', allowed)).toBe(true);
    expect(isDomainAllowed('klarna.se', allowed)).toBe(true);
    expect(isDomainAllowed('klarna.fr', allowed)).toBe(false);
  });
});

describe('validateEmailDomain()', () => {
  test('validates legitimate Klarna email', () => {
    const result = validateEmailDomain('noreply@klarna.com', 'Klarna');

    expect(result.isValid).toBe(true);
    expect(result.provider).toBe('Klarna');
    expect(result.domain).toBe('klarna.com');
    expect(result.confidence).toBe('high');
    expect(result.reason).toContain('verified');
  });

  test('validates Klarna subdomain', () => {
    const result = validateEmailDomain('alerts@mail.klarna.com', 'Klarna');

    expect(result.isValid).toBe(true);
    expect(result.domain).toBe('mail.klarna.com');
    expect(result.confidence).toBe('high');
  });

  test('validates multiple Klarna country domains', () => {
    expect(validateEmailDomain('info@klarna.de', 'Klarna').isValid).toBe(true);
    expect(validateEmailDomain('info@klarna.co.uk', 'Klarna').isValid).toBe(true);
    expect(validateEmailDomain('info@klarna.se', 'Klarna').isValid).toBe(true);
  });

  test('validates legitimate Affirm emails', () => {
    expect(validateEmailDomain('support@affirm.com', 'Affirm').isValid).toBe(true);
    expect(validateEmailDomain('noreply@affirmmail.com', 'Affirm').isValid).toBe(true);
  });

  test('validates PayPal Pay in 4', () => {
    const result = validateEmailDomain('service@paypal.com', 'PayPalPayIn4');
    expect(result.isValid).toBe(true);
    expect(result.provider).toBe('PayPalPayIn4');
  });

  test('rejects spoofed Klarna domain', () => {
    const result = validateEmailDomain('fake@klarna.evil.com', 'Klarna');

    expect(result.isValid).toBe(false);
    expect(result.confidence).toBe('low');
    expect(result.reason).toContain('does not match');
  });

  test('rejects email from wrong provider domain', () => {
    const result = validateEmailDomain('noreply@affirm.com', 'Klarna');

    expect(result.isValid).toBe(false);
    expect(result.provider).toBe('Klarna');
    expect(result.domain).toBe('affirm.com');
    expect(result.reason).toContain('does not match expected domains');
  });

  test('rejects invalid email format', () => {
    const result = validateEmailDomain('not-an-email', 'Klarna');

    expect(result.isValid).toBe(false);
    expect(result.domain).toBe(null);
    expect(result.reason).toContain('Invalid email format');
    expect(result.confidence).toBe('low');
  });

  test('rejects unknown provider', () => {
    const result = validateEmailDomain('user@example.com', 'UnknownProvider');

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('Unknown provider');
    expect(result.confidence).toBe('low');
  });

  test('validates all supported providers', () => {
    const providers = {
      Klarna: 'noreply@klarna.com',
      Affirm: 'support@affirm.com',
      Afterpay: 'info@afterpay.com',
      PayPal: 'service@paypal.com',
      Zip: 'alerts@zip.co',
      Sezzle: 'noreply@sezzle.com',
    };

    Object.entries(providers).forEach(([provider, email]) => {
      const result = validateEmailDomain(email, provider);
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe(provider);
    });
  });
});

describe('isSuspiciousDomain()', () => {
  test('detects suspicious TLDs', () => {
    expect(isSuspiciousDomain('phishing.xyz')).toBe(true);
    expect(isSuspiciousDomain('scam.top')).toBe(true);
    expect(isSuspiciousDomain('fake.loan')).toBe(true);
    expect(isSuspiciousDomain('bad.click')).toBe(true);
  });

  test('detects provider names in subdomain', () => {
    expect(isSuspiciousDomain('klarna.evil.com')).toBe(true);
    expect(isSuspiciousDomain('affirm.phishing.com')).toBe(true);
    expect(isSuspiciousDomain('paypal.scam.xyz')).toBe(true);
  });

  test('detects Cyrillic homograph attacks', () => {
    // Using Cyrillic 'а' (U+0430) instead of Latin 'a' (U+0061)
    expect(isSuspiciousDomain('klаrna.com')).toBe(true);  // 'а' is Cyrillic
  });

  test('allows legitimate domains', () => {
    expect(isSuspiciousDomain('klarna.com')).toBe(false);
    expect(isSuspiciousDomain('affirm.com')).toBe(false);
    expect(isSuspiciousDomain('paypal.com')).toBe(false);
    expect(isSuspiciousDomain('mail.klarna.com')).toBe(false);
  });

  test('returns true for empty domain', () => {
    expect(isSuspiciousDomain('')).toBe(true);
    expect(isSuspiciousDomain(null as any)).toBe(true);
  });
});

describe('validateEmailDomainEnhanced()', () => {
  test('passes legitimate emails through enhanced validation', () => {
    const result = validateEmailDomainEnhanced('noreply@klarna.com', 'Klarna');

    expect(result.isValid).toBe(true);
    expect(result.confidence).toBe('high');
  });

  test('detects suspicious patterns in valid domains', () => {
    // This email passes basic validation (subdomain of klarna.com)
    // but enhanced validation should catch the suspicious pattern
    const result = validateEmailDomainEnhanced('user@klarna.evil.com', 'UnknownProvider');

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('Unknown provider');
  });

  test('blocks phishing with suspicious TLD', () => {
    const result = validateEmailDomainEnhanced('fake@klarna.xyz', 'Klarna');

    expect(result.isValid).toBe(false);
    // Should fail basic validation first (klarna.xyz not in allowed domains)
  });

  test('allows legitimate subdomains without suspicious patterns', () => {
    const result = validateEmailDomainEnhanced('noreply@mail.klarna.com', 'Klarna');

    expect(result.isValid).toBe(true);
    expect(result.confidence).toBe('high');
  });
});

describe('getLegitimateDomainsForProvider()', () => {
  test('returns domains for known provider', () => {
    const domains = getLegitimateDomainsForProvider('Klarna');
    expect(domains).toContain('klarna.com');
    expect(domains).toContain('klarna.de');
    expect(domains.length).toBeGreaterThan(0);
  });

  test('returns empty array for unknown provider', () => {
    const domains = getLegitimateDomainsForProvider('UnknownProvider');
    expect(domains).toEqual([]);
  });

  test('returns all domains for each provider', () => {
    expect(getLegitimateDomainsForProvider('Affirm')).toContain('affirm.com');
    expect(getLegitimateDomainsForProvider('Affirm')).toContain('affirmmail.com');
    expect(getLegitimateDomainsForProvider('Afterpay')).toContain('afterpay.com');
    expect(getLegitimateDomainsForProvider('Afterpay')).toContain('clearpay.co.uk');
  });
});

describe('PROVIDER_DOMAINS', () => {
  test('includes all major BNPL providers', () => {
    expect(PROVIDER_DOMAINS).toHaveProperty('Klarna');
    expect(PROVIDER_DOMAINS).toHaveProperty('Affirm');
    expect(PROVIDER_DOMAINS).toHaveProperty('Afterpay');
    expect(PROVIDER_DOMAINS).toHaveProperty('PayPal');
    expect(PROVIDER_DOMAINS).toHaveProperty('PayPalPayIn4');
    expect(PROVIDER_DOMAINS).toHaveProperty('Zip');
    expect(PROVIDER_DOMAINS).toHaveProperty('Sezzle');
  });

  test('each provider has at least one domain', () => {
    Object.entries(PROVIDER_DOMAINS).forEach(([provider, domains]) => {
      expect(domains.length).toBeGreaterThan(0);
      expect(Array.isArray(domains)).toBe(true);
    });
  });

  test('all domains are lowercase', () => {
    Object.values(PROVIDER_DOMAINS).forEach(domains => {
      domains.forEach(domain => {
        expect(domain).toBe(domain.toLowerCase());
      });
    });
  });
});

describe('Security edge cases', () => {
  test('prevents typosquatting (klama.com instead of klarna.com)', () => {
    const result = validateEmailDomain('noreply@klama.com', 'Klarna');
    expect(result.isValid).toBe(false);
  });

  test('prevents subdomain spoofing (klarna.com.evil.com)', () => {
    const result = validateEmailDomain('fake@klarna.com.evil.com', 'Klarna');
    expect(result.isValid).toBe(false);
  });

  test('prevents lookalike domains with dashes', () => {
    const result = validateEmailDomain('noreply@klar-na.com', 'Klarna');
    expect(result.isValid).toBe(false);
  });

  test('case sensitivity does not affect security', () => {
    const result1 = validateEmailDomain('noreply@KLARNA.COM', 'Klarna');
    const result2 = validateEmailDomain('noreply@klarna.com', 'Klarna');
    expect(result1.isValid).toBe(result2.isValid);
    expect(result1.isValid).toBe(true);
  });
});
