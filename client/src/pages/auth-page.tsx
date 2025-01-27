import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { insertUserSchema } from "@db/schema";
import type { InsertUser } from "@db/schema";

export default function AuthPage() {
  const { login, register } = useUser();
  const { toast } = useToast();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: InsertUser) => {
    try {
      // First try to login
      try {
        await login(values);
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        return;
      } catch (loginError: any) {
        // If login fails, try to register
        if (loginError.message.includes("Incorrect username") || loginError.message.includes("Incorrect password")) {
          try {
            await register(values);
            toast({
              title: "Success",
              description: "Account created and logged in",
            });
            return;
          } catch (registerError: any) {
            toast({
              title: "Error",
              description: registerError.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Error",
            description: loginError.message,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <h2 className="text-2xl font-bold text-center">
            Medical Admin Dashboard
          </h2>
          <p className="text-center text-gray-500">
            Enter your credentials to continue
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} autoComplete="username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        {...field} 
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Login / Register"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}