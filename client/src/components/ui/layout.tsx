import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Button } from "./button";
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart,
  LogOut,
  Menu,
  Dna,
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
  { icon: Dna, label: "navigation.genetic_profiles", href: "/genetic-profiles" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout } = useUser();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const Sidebar = () => (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Medical Admin</h2>
        <div className="space-y-1">
          {menuItems.map(({ icon: Icon, label, href }) => (
            <Link key={href} href={href}>
              <Button
                variant={location === href ? "secondary" : "ghost"}
                className="w-full justify-start"
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
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('actions.logout')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r">
        <ScrollArea className="h-screen">
          <Sidebar />
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="lg:hidden fixed left-4 top-4 z-40"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}