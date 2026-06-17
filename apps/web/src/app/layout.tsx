import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chateau Base",
  description: "Make wine, get judged, flex the bottle, and preserve meaningful vintages on Base."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
