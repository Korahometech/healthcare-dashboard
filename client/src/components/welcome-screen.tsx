import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface WelcomeScreenProps {
  name?: string;
  role?: 'doctor' | 'patient' | 'admin';
}

export function WelcomeScreen({ name = "User", role }: WelcomeScreenProps) {
  const { t } = useTranslation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("welcome.greeting.morning");
    if (hour < 18) return t("welcome.greeting.afternoon");
    return t("welcome.greeting.evening");
  };

  const getRoleSpecificMessage = () => {
    switch (role) {
      case 'doctor':
        return t("welcome.role.doctor");
      case 'patient':
        return t("welcome.role.patient");
      case 'admin':
        return t("welcome.role.admin");
      default:
        return t("welcome.role.default");
    }
  };

  return (
    <Card className="border-none shadow-none bg-gradient-to-r from-primary/10 via-primary/5 to-background">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{getGreeting()}</span>
        </div>
        <CardTitle className="text-2xl font-bold">
          {t("welcome.title", { name })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          {getRoleSpecificMessage()}
        </p>
      </CardContent>
    </Card>
  );
}