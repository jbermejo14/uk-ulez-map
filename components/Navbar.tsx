"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon, ShieldCheck } from "lucide-react";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-[#0A0A0A]/90 border-b border-slate-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white leading-none">
              UK<span className="text-primary">CleanZone</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5">
              ULEZ &bull; CAZ &bull; LEZ Map (2026)
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/#checker"
            className="text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1.5"
          >
            Vehicle Checker
          </Link>
          <Link
            href="/#map-section"
            className="text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-colors flex items-center gap-1.5"
          >
            Interactive Map
          </Link>
          <Link
            href="/zone/london-ulez"
            className="text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            London ULEZ
          </Link>
          <Link
            href="/zone/birmingham-clean-air-zone"
            className="text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Birmingham CAZ
          </Link>
          <Link
            href="/zone/glasgow-lez"
            className="text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Scottish LEZs
          </Link>
        </nav>

        {/* Action & Theme Switcher */}
        <div className="flex items-center gap-3">
          <Link
            href="/#checker"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-sm transition-all"
          >
            Check My Reg
          </Link>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-primary hover:text-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
