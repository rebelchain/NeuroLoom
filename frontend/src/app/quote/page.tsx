"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function QuoteTransitionPage() {
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    // Jeda 1 detik tetap ada untuk memberikan efek transisi dari "The Vacuum Drop"
    const timer = setTimeout(() => {
      setStartAnimation(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!startAnimation) {
    // Layar transisi disesuaikan dengan base background NeuroLoom (bukan hitam pekat)
    return <div className="w-screen h-screen bg-[#050814]" />;
  }

  return (
    // Menggunakan gradasi background yang persis dengan landing page NeuroLoom
    <div className="w-screen h-screen bg-[#050814] relative overflow-hidden flex flex-col items-center justify-center p-8 select-none">
      {/* Efek Glow Latar Belakang (Sama seperti landing page) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Kontainer Teks Utama */}
      <div className="max-w-4xl text-center relative z-10 flex flex-col gap-8">
        <motion.p
          initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-gray-300 text-2xl md:text-4xl font-light tracking-wide"
        >
          &quot;The biggest risk in modern DeFi isn&apos;t smart contract failure...
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          // Delay sedikit lebih cepat agar alurnya lebih dinamis
          transition={{ duration: 1.5, delay: 2, ease: "easeOut" }}
          className="text-white text-3xl md:text-5xl font-bold tracking-wide"
        >
          ...it&apos;s{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]">
            inefficient capital allocation
          </span>
          .&quot;
        </motion.p>
      </div>
    </div>
  );
}
