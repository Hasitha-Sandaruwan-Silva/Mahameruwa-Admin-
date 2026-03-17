"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authStorage } from "../utils/auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = authStorage.getUser();
    const token = authStorage.getToken();
    if (!token || !user) {
      router.replace("/auth/login");
    }
  }, [router]);

  return <>{children}</>;
}
