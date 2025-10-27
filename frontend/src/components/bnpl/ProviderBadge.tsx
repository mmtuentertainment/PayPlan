/**
 * ProviderBadge Component
 *
 * Color-coded badge for BNPL providers
 * WCAG 2.1 AA compliant (4.5:1 contrast ratio)
 */

interface ProviderBadgeProps {
  provider: string;
  className?: string;
}

const providerColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  klarna: {
    bg: 'bg-pink-50',
    text: 'text-pink-800',
    border: 'border-pink-200',
  },
  affirm: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  afterpay: {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
  },
  sezzle: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  zip: {
    bg: 'bg-violet-50',
    text: 'text-violet-800',
    border: 'border-violet-200',
  },
  paypal: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
  },
};

export function ProviderBadge({ provider, className = '' }: ProviderBadgeProps) {
  const normalizedProvider = provider.toLowerCase().replace(/\s+/g, '');
  const colors =
    providerColors[normalizedProvider] || providerColors['klarna'];

  const displayName =
    provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
      role="status"
      aria-label={`Payment provider: ${displayName}`}
    >
      {displayName}
    </span>
  );
}
