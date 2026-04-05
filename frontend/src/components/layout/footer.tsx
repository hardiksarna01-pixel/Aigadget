import Link from "next/link";
import { Sparkles } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Trending", href: "/trending" },
    { label: "Compare", href: "/compare" },
    { label: "AI Chat", href: "/chat" },
    { label: "Deals", href: "/deals" },
  ],
  Categories: [
    { label: "Smartphones", href: "/category/smartphones" },
    { label: "Laptops", href: "/category/laptops" },
    { label: "Headphones", href: "/category/headphones" },
    { label: "Smartwatches", href: "/category/smartwatches" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">
                AI<span className="gradient-text">Gadget</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              AI-powered product discovery. Find the perfect gadget, instantly.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} AIGadget. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Prices and availability are subject to change. We may earn affiliate commissions.
          </p>
        </div>
      </div>
    </footer>
  );
}
