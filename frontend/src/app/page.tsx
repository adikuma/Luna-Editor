"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    setIsRedirecting(true);
    const timeout = setTimeout(() => {
      router.push("/edit");
    }, 300); // Matches the header transition duration
    
    return () => clearTimeout(timeout);
  }, [router]);
  
  return (
    <div className={`fixed inset-0 bg-black transition-opacity duration-300 ${
      isRedirecting ? 'opacity-100' : 'opacity-0'
    }`} />
  );
}