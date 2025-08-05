import "./globals.css";
import { SidebarProvider } from "@/context/SidebarContext";
import AdminLayout from "@/layout/AdminLayout";
import { ThemeProviders } from "@/components/ThemeProviders";
import Script from "next/script";

export const metadata = {
  title: "Dashboard",
  description: "Base layout con Sidebar y Header",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-setup" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        <ThemeProviders>
          <SidebarProvider>
            <AdminLayout>{children}</AdminLayout>
          </SidebarProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}

