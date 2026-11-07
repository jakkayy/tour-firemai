import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import SiteFooter from "@/components/SiteFooter";
import CookieConsent from "@/components/CookieConsent";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "ทัวร์ไฟไหม้ | รวมทัวร์ลดราคาก่อนวันเดินทาง",
  description: "รวมทัวร์ที่ใกล้วันเดินทางแต่คนยังไม่ครบ ลดราคาสูงสุดเพื่อเติมที่นั่ง อัปเดตทุก 6 ชั่วโมง",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "ทัวร์ไฟไหม้ | รวมทัวร์ลดราคาก่อนวันเดินทาง",
    description: "รวมทัวร์ที่ใกล้วันเดินทางแต่คนยังไม่ครบ ลดราคาสูงสุดเพื่อเติมที่นั่ง อัปเดตทุก 6 ชั่วโมง",
    url: SITE_URL,
    siteName: "ทัวร์ไฟไหม้",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ทัวร์ไฟไหม้ | รวมทัวร์ลดราคาก่อนวันเดินทาง",
    description: "รวมทัวร์ที่ใกล้วันเดินทางแต่คนยังไม่ครบ ลดราคาสูงสุดเพื่อเติมที่นั่ง",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SiteFooter />
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  );
}
