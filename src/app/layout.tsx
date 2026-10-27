import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catboy Clicker — A Cozy Little Idle Game",
  description:
    "Collect fish snacks, care for your catboy companion, and grow your cozy little snack shop.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
