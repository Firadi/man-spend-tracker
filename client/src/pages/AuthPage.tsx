import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const loginForm = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "" },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10 justify-center">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="font-bold">K</span>
            </div>
            KPI Manager
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs space-y-6">
             <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight" data-testid="text-login-title">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Login to your account</p>
             </div>

             <Card className="border-0 shadow-none">
               <CardContent className="p-0 space-y-4">
                 <Form {...loginForm}>
                   <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                     <FormField
                       control={loginForm.control}
                       name="username"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Username</FormLabel>
                           <FormControl>
                             <Input placeholder="Enter your username" {...field} data-testid="input-login-username" />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <FormField
                       control={loginForm.control}
                       name="password"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Password</FormLabel>
                           <FormControl>
                             <Input type="password" placeholder="Enter your password" {...field} data-testid="input-login-password" />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <Button type="submit" className="w-full" disabled={loginMutation.isPending} data-testid="button-login">
                       {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       Sign In
                     </Button>
                   </form>
                 </Form>
                 <p className="text-xs text-center text-muted-foreground">
                   Contact your admin to get an account.
                 </p>
               </CardContent>
             </Card>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative h-full">
         <div className="absolute inset-0 bg-zinc-900" />
         <div className="absolute inset-0 flex items-center justify-center text-white p-10">
            <div className="max-w-md space-y-4 text-center">
               <h1 className="text-4xl font-bold">Manage Your E-commerce KPIs</h1>
               <p className="text-lg text-zinc-300">
                 Track products, simulate profitability, and analyze performance by country.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
