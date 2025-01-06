"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const [theme, setTheme] = useState("light");
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="fixed w-full top-8 z-50">
      <div
        className={`
        absolute inset-x-0 -top-10 h-24 
        bg-gradient-to-b from-black via-black/50 to-transparent 
        transition-all duration-500
        ${isScrolled ? "opacity-100" : "opacity-0"}
      `}
      />

      <header
        className={`
        relative transition-all duration-500 ease-in-out
        ${isScrolled ? "py-4" : "py-6"}
      `}
      >
        <nav className="container mx-auto px-6 flex justify-between items-center">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <div
              className="relative flex items-center bg-white/5 backdrop-blur-lg rounded-full p-1 border border-white/20"
            >
              {[
                { href: "/generate", label: "Generate" },
                { href: "/edit", label: "Edit" },
                { href: "/enhance", label: "Enhance" },
              ].map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    relative px-6 py-2 text-sm font-medium rounded-full
                    transition-all duration-300 ease-in-out hover:scale-105
                    ${
                      pathname === tab.href
                        ? "text-black"
                        : "text-white/50 hover:text-white"
                    }
                  `}
                >
                  {tab.label}
                  {pathname === tab.href && (
                    <div className="absolute inset-0 -z-10">
                      <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse text-black" />
                      <div className="absolute inset-0 bg-white text-black rounded-full animate-spin-slow" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}
