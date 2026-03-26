"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StatusPoller({ orderId, isPending }: { orderId: string; isPending: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => {
      router.refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [isPending, router]);

  return null;
}
