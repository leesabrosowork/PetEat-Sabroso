"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);
  return showSplash ? (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-blue-200 to-white animate-fade-in">
      <Image src="/peteat-logo.png" alt="PetEat Logo" width={96} height={96} className="animate-bounce" />
      <h1 className="mt-4 text-3xl font-bold text-blue-900 animate-fade-in">PetEat</h1>
    </div>
  ) : (
    <>{children}</>
  );
} 