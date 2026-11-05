"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Gem,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="no-print fixed top-0 left-0 right-0 z-40 border-b border-teal/15 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-3 md:h-16 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-teal">
          <Gem className="h-5 w-5" />
          <span className="text-lg font-bold tracking-tight">Hiraang Mini</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                href={to}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors md:px-3",
                  active
                    ? "bg-teal text-primary-foreground"
                    : "text-teal/80 hover:bg-teal-light hover:text-teal"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
