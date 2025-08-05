"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { pageview } from "@/lib/gtag";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Enviar pageview cuando cambia la ruta
  useEffect(() => {
    if (pathname) {
      pageview(pathname);
    }
  }, [pathname]);

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

        {children}
      </body>
    </html>
  );
}
