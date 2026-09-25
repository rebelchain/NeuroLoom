"use client";

import { useEffect, useRef } from "react";
import { mountMarkField } from "@/lib/mark-field";

export default function ParticleCore() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const cleanup = mountMarkField(mountRef.current);

    return () => {
      cleanup();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
