import { cva } from "class-variance-authority"

/**
 * Button variant styles
 * Extracted to separate file for React Fast Refresh compatibility
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Note: default and sm both use h-11 (44px) on mobile for WCAG 2.1 AA compliance
        // Differentiation on mobile: padding (px-4 vs px-3) and text size (text-sm vs text-xs)
        // Desktop sizes differ to provide visual hierarchy where touch targets are not required
        default: "h-11 px-4 py-2 md:h-9", // 44px mobile (WCAG ✅), 36px desktop
        sm: "h-11 rounded-md px-3 text-xs md:h-8", // 44px mobile (WCAG ✅), 32px desktop - text-xs (12px) maintains 3.57:1 aspect ratio per Material Design 3
        lg: "h-12 rounded-md px-8 md:h-10", // 48px mobile (WCAG ✅), 40px desktop
        icon: "h-11 w-11 md:h-9 md:w-9", // 44px mobile (WCAG ✅), 36px desktop
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
