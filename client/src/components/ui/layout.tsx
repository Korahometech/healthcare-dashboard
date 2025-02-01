import { Link, useLocation } from "wouter";
import { Button } from "./button";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart,
  Menu,
  UserCog,
  FileText,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";
import { ScrollArea } from "./scroll-area";
import { useState } from "react";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "react-i18next";

const menuItems = [
  { icon: LayoutDashboard, label: "navigation.dashboard", href: "/" },
  { icon: BarChart, label: "navigation.analytics", href: "/analytics" },
  { icon: Calendar, label: "navigation.appointments", href: "/appointments" },
  { icon: Users, label: "navigation.patients", href: "/patients" },
  { icon: UserCog, label: "navigation.doctors", href: "/doctors" },
  { icon: FileText, label: "navigation.documents", href: "/document-translation" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const Sidebar = () => (
    <div className="space-y-6 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-4 px-4 text-xl font-semibold tracking-tight">
          Medical Admin
        </h2>
        <div className="space-y-1">
          {menuItems.map(({ icon: Icon, label, href }) => (
            <Link key={href} href={href}>
              <Button
                variant={location === href ? "secondary" : "ghost"}
                className="w-full justify-start transition-colors duration-200"
              >
                <Icon className="mr-2 h-4 w-4" />
                {t(label)}
              </Button>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <div className="mb-4">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <ScrollArea className="h-screen">
          <Sidebar />
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed left-4 top-4 z-40"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 lg:p-8 animate-in fade-in slide-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}