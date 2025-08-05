import "./globals.css";
import { SidebarProvider } from "@/context/SidebarContext";
import AdminLayout from "@/layout/AdminLayout";
import { ThemeProviders } from "@/components/ThemeProviders";

export const metadata = {
  title: "Dashboard",
  description: "Base layout con Sidebar y Header",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProviders>
          <SidebarProvider>
            <AdminLayout>{children}</AdminLayout>
          </SidebarProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}
