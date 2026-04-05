"use client";

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No separate sidebar needed - main app Sidebar already handles it
  return <>{children}</>;
}