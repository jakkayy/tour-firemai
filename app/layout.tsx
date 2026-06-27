import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const BASE_URL = "https://tour-firemai.vercel.app";

export const metadata: Metadata = {
  title: "ทัวร์ไฟไหม้ | รวมทัวร์ลดราคาก่อนวันเดินทาง",
  description: "รวมทัวร์ที่ใกล้วันเดินทางแต่คนยังไม่ครบ ลดราคาสูงสุดเพื่อเติมที่นั่ง อัปเดตทุก 6 ชั่วโมง",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "ทัวร์ไฟไหม้ | รวมทัวร์ลดราคาก่อนวันเดินทาง",
    description: "รวมทัวร์ที่ใกล้วันเดินทางแต่คนยังไม่ครบ ลดราคาสูงสุดเพื่อเติมที่นั่ง อัปเดตทุก 6 ชั่วโมง",
    url: BASE_URL,
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
        <Script id="clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","xdo6ug506l");
        `}</Script>
      </body>
    </html>
  );
}
