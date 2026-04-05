import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ComparisonProduct {
  name: string;
  brand: string;
  aiScore?: number | null;
  specs: Array<{
    groupName: string;
    label: string;
    value: string;
    highlight?: boolean;
  }>;
  prices: Array<{
    platform: string;
    price: number;
    currency: string;
    inStock: boolean;
  }>;
}

interface ComparisonTableProps {
  products: ComparisonProduct[];
}

export function ComparisonTable({ products }: ComparisonTableProps) {
  if (products.length === 0) return null;

  // Collect all unique spec labels across products
  const specLabels = new Map<string, string>(); // label → group
  for (const p of products) {
    for (const s of p.specs) {
      if (!specLabels.has(s.label)) {
        specLabels.set(s.label, s.groupName);
      }
    }
  }

  // Group specs by group name
  const groups = new Map<string, string[]>();
  for (const [label, group] of specLabels) {
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(label);
  }

  // Get lowest price for each product
  const lowestPrices = products.map((p) => {
    const inStock = p.prices.filter((pr) => pr.inStock);
    return inStock.length > 0
      ? Math.min(...inStock.map((pr) => pr.price))
      : null;
  });

  const bestPrice = Math.min(...lowestPrices.filter((p): p is number => p !== null));
  const bestScore = Math.max(...products.map((p) => p.aiScore || 0));

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        {/* Header row with product names */}
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground min-w-[140px]">
              Specification
            </th>
            {products.map((p) => (
              <th key={p.name} className="px-4 py-3 text-center font-semibold min-w-[160px]">
                <div className="text-xs text-muted-foreground">{p.brand}</div>
                <div className="mt-0.5">{p.name}</div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* AI Score row */}
          <tr className="border-b border-border bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
            <td className="px-4 py-3 font-medium">AI Score</td>
            {products.map((p) => (
              <td key={p.name} className="px-4 py-3 text-center">
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg px-3 py-1 text-sm font-bold text-white",
                    p.aiScore === bestScore && bestScore > 0
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                      : "bg-gradient-to-r from-blue-500 to-blue-600"
                  )}
                >
                  {p.aiScore?.toFixed(1) || "N/A"}
                </span>
              </td>
            ))}
          </tr>

          {/* Price row */}
          <tr className="border-b border-border">
            <td className="px-4 py-3 font-medium">Best Price</td>
            {products.map((p, i) => (
              <td key={p.name} className="px-4 py-3 text-center">
                {lowestPrices[i] !== null ? (
                  <span
                    className={cn(
                      "font-bold",
                      lowestPrices[i] === bestPrice
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    )}
                  >
                    {formatPrice(lowestPrices[i]!, "INR")}
                    {lowestPrices[i] === bestPrice && (
                      <Badge variant="success" className="ml-1.5 text-[10px]">Best</Badge>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </td>
            ))}
          </tr>

          {/* Spec rows grouped */}
          {[...groups.entries()].map(([groupName, labels]) => (
            <>
              {/* Group header */}
              <tr key={`group-${groupName}`} className="border-b border-border bg-muted/30">
                <td colSpan={products.length + 1} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {groupName}
                </td>
              </tr>

              {/* Spec rows */}
              {labels.map((label) => {
                const values = products.map(
                  (p) => p.specs.find((s) => s.label === label)?.value || "—"
                );

                return (
                  <tr key={label} className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
                    {values.map((val, i) => (
                      <td key={i} className="px-4 py-2.5 text-center font-medium">
                        {val}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
