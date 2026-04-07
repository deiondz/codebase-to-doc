import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "./utils";

type MaxWidthContainerProps<T extends ElementType = "main"> = {
  /**
   * The HTML element to render. Defaults to "main".
   */
  as?: T;
  /**
   * Maximum width variant. Defaults to "2xl".
   * - "sm": max-w-screen-sm (640px)
   * - "md": max-w-screen-md (768px)
   * - "lg": max-w-screen-lg (1024px)
   * - "xl": max-w-screen-xl (1280px)
   * - "2xl": max-w-screen-2xl (1536px)
   * - "full": no max-width constraint
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /**
   * Padding variant. Defaults to "default".
   * - "none": no padding
   * - "sm": px-2.5 (10px)
   * - "default": px-2.5 md:px-20 (10px mobile, 80px desktop)
   * - "lg": px-4 md:px-24 (16px mobile, 96px desktop)
   */
  padding?: "none" | "sm" | "default" | "lg";
  /**
   * Additional CSS classes to apply.
   */
  className?: string;
  /**
   * Child elements to render inside the container.
   */
  children: ReactNode;
} & ComponentPropsWithoutRef<T>;

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "",
} as const;

const paddingClasses = {
  none: "",
  sm: "px-2.5",
  default: "px-2.5 md:px-20",
  lg: "px-4 md:px-24",
} as const;

/**
 * A flexible container component that centers content with a maximum width.
 *
 * @example
 * ```tsx
 * <MaxWidthContainer>
 *   <h1>Centered content</h1>
 * </MaxWidthContainer>
 * ```
 *
 * @example
 * ```tsx
 * <MaxWidthContainer as="div" maxWidth="lg" padding="sm">
 *   <p>Custom container</p>
 * </MaxWidthContainer>
 * ```
 */
export default function MaxWidthContainer<T extends ElementType = "main">({
  as,
  maxWidth = "2xl",
  padding = "default",
  className,
  children,
  ...props
}: MaxWidthContainerProps<T>) {
  const Component = as ?? ("main" as ElementType);
  const maxWidthClass = maxWidthClasses[maxWidth];
  const paddingClass = paddingClasses[padding];

  return (
    <Component
      className={cn("mx-auto w-full", maxWidthClass, paddingClass, className)}
      {...props}
    >
      {children}
    </Component>
  );
}
