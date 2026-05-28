import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YadavjiPDF - Made in India | Merge, Split, Compress & Convert PDFs Online",
  description: "YadavjiPDF is India's trusted online PDF toolkit. Merge, Split, Compress PDFs and convert between Word, Excel, and PDF formats. All processing on Indian servers.",
  keywords: ["YadavjiPDF", "PDF", "Merge PDF", "Split PDF", "Compress PDF", "Convert PDF", "India", "Made in India", "PDF tools"],
  authors: [{ name: "YadavjiPDF Team" }],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%232563eb'/><text x='50' y='70' font-size='60' font-family='Arial' font-weight='bold' fill='white' text-anchor='middle'>Y</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
