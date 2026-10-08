import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpendFlow",
  description:
    "Internal subscription and invoice reimbursement — upload, analyze, review, calculate, report.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="font-[family-name:var(--font-body)]">
        <div className="grid h-dvh grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
          <div className="flex min-h-0 flex-col overflow-y-auto">
            {children}
          </div>
          <SiteFooter />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
