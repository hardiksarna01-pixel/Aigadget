import { cn, formatPrice } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceTag({
  price,
  originalPrice,
  currency = "INR",
  size = "md",
  className,
}: PriceTagProps) {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn("font-bold text-foreground", {
          "text-sm": size === "sm",
          "text-lg": size === "md",
          "text-2xl": size === "lg",
        })}
      >
        {formatPrice(price, currency)}
      </span>
      {originalPrice && originalPrice > price && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(originalPrice, currency)}
          </span>
          <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {discount}% off
          </span>
        </>
      )}
    </div>
  );
}
