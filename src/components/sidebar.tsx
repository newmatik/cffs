"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Landmark,
  FileSpreadsheet,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const adminOfficerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/loans", label: "Loans", icon: Landmark },
  { href: "/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
];

const memberLinks = [
  { href: "/my-account", label: "My Account", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = session?.user?.role;
  const isMember = role === "MEMBER";
  const isAdmin = role === "ADMIN";
  const links = isMember
    ? memberLinks
    : adminOfficerLinks.filter((link) => !("adminOnly" in link) || isAdmin);

  const navContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Image
            src="/cfi-logo.png"
            alt="CFCI Logo"
            width={28}
            height={34}
            className="object-contain brightness-0 invert"
          />
          <div>
            <h1 className="font-bold text-white text-sm">Christ Followers</h1>
            <p className="text-xs text-slate-400">Finance System</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              )}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-700">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-white truncate">
            {session?.user?.name}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {session?.user?.email}
          </p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
            {session?.user?.role}
          </span>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <Image
          src="/cfi-logo.png"
          alt="CFCI Logo"
          width={24}
          height={29}
          className="object-contain"
        />
        <span className="font-semibold text-sm">Christ Followers</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 flex flex-col transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-slate-900 flex-col">
        {navContent}
      </aside>
    </>
  );
}
