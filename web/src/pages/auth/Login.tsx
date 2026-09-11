import React from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { AuthError, signIn, signInWithGoogleIdToken } from "@/lib/auth";
import { GoogleButton, googleClientId } from "@/components/google-button";
import { Navigation } from "@/components/navigation";
import { Loader2 } from "lucide-react";
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (user: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signIn(user.email, user.password);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      navigate("/");
    } catch (error) {
      const err = error as AuthError;
      if (err.code === "EMAIL_NOT_VERIFIED") {
        // The backend has already emailed a fresh code
        navigate(`/verify-account?email=${encodeURIComponent(user.email)}`);
      }
      toast({
        title: "Login Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleToken = async (idToken: string) => {
    try {
      await signInWithGoogleIdToken(idToken);
      toast({
        title: "Login Successful",
        description: "Welcome to Wasteless!",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Google Login Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Google Login Failed",
      description: "Please try again.",
      variant: "destructive",
    });
  };

  return (
    <div>
      <Navigation />
      <div className="flex flex-grow items-center justify-center py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Login</CardTitle>
              <CardDescription>
                Enter your email to sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleButton
                onToken={handleGoogleToken}
                onError={handleGoogleError}
                text="signin_with"
              />

              {googleClientId && (
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  OR CONTINUE WITH EMAIL
                </span>
              </div>
              )}

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="name@example.com" {...field} />
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
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}{" "}
                    Login
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                <span>Don't have an account? </span>
                <Link
                  to="/signup"
                  className="text-primary underline-offset-4 transition-colors hover:underline"
                >
                  Sign up
                </Link>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-primary underline-offset-4 transition-colors hover:underline"
              >
                Forgot password?
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Wasteless. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;
