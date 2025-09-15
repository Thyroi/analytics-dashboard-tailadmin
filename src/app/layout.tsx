import AdminLayout from "@/layout/AdminLayout";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Dashboard",
  description: "Base layout con Sidebar y Header",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <AdminLayout>{children}</AdminLayout>
        </Providers>
      </body>
    </html>
  );
}
