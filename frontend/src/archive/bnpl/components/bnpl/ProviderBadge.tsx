/**
 * ProviderBadge Component
 *
 * Color-coded badge for BNPL providers
 * WCAG 2.1 AA compliant (4.5:1 contrast ratio)
 *
 * Uses inline styles to avoid Tailwind purging issues
 */

interface ProviderBadgeProps {
  provider: string;
  className?: string;
}

const PROVIDER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  klarna: { bg: '#FCE7F3', text: '#9F1239', border: '#FBCFE8' }, // Pink
  affirm: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' }, // Blue
  afterpay: { bg: '#CCFBF1', text: '#115E59', border: '#99F6E4' }, // Teal
  sezzle: { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' }, // Purple
  zip: { bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE' }, // Violet
  paypal: { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' }, // Indigo
};

export function ProviderBadge({ provider, className = '' }: ProviderBadgeProps) {
  const normalizedProvider = provider.toLowerCase().replace(/\s+/g, '').replace('paypalcredit', 'paypal');
  const styles = PROVIDER_STYLES[normalizedProvider] || { bg: '#F3F4F6', text: '#1F2937', border: '#E5E7EB' };

  const displayName =
    provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        lineHeight: '1rem',
        fontWeight: 500,
        backgroundColor: styles.bg,
        color: styles.text,
        border: `1px solid ${styles.border}`,
      }}
      role="status"
      aria-label={`Payment provider: ${displayName}`}
    >
      {displayName}
    </span>
  );
}
