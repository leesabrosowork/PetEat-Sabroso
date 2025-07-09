"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null; // Prevents hydration mismatch

  return showSplash ? (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-blue-200 to-white transition-opacity duration-300">
      <Image src="/peteat-logo.png" alt="PetEat Logo" width={96} height={96} />
      <h1 className="mt-4 text-3xl font-bold text-blue-900 transition-opacity duration-300">PetEat</h1>
    </div>
  ) : (
    <>{children}</>
  );
} 