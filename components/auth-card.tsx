"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function AuthCard({ className, ...props }: React.ComponentProps<"div">) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const router = useRouter();
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      console.log("AuthCard login submit start");
      await login({
        email: loginData.email,
        password: loginData.password,
      });

      console.log("AuthCard login submit success");
      toast({
        title: "Giriş başarılı!",
        description: "Chat sayfasına yönlendiriliyorsunuz...",
      });

      router.push("/chat");
    } catch (error: any) {
      console.error("AuthCard login submit error:", error);
      toast({
        title: "Giriş hatası",
        description:
          error.response?.data?.message || "Giriş yapılırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsLoading(true);

    // Password confirmation check
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Şifre hatası",
        description: "Şifreler eşleşmiyor",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log("AuthCard register submit start");
      await register({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
      });

      console.log("AuthCard register submit success");
      toast({
        title: "Kayıt başarılı!",
        description: "Chat sayfasına yönlendiriliyorsunuz...",
      });

      router.push("/chat");
    } catch (error: any) {
      console.error("AuthCard register submit error:", error);
      toast({
        title: "Kayıt hatası",
        description:
          error.response?.data?.message || "Kayıt olurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCard = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="relative w-full h-[550px] [perspective:1000px]">
        <div
          className={cn(
            "relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]",
            isFlipped && "[transform:rotateY(180deg)]"
          )}
        >
          {/* Login Card (Front) */}
          <Card className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden border-border bg-card text-card-foreground shadow-sm">
            <CardContent className="p-0 h-full">
              <form
                className="p-6 md:p-8 h-full flex flex-col justify-center"
                onSubmit={handleLoginSubmit}
              >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold text-foreground">
                      Welcome back
                    </h1>
                    <p className="text-balance text-muted-foreground">
                      Login to your Acme Inc account
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="login-email" className="text-foreground">
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="login-password" className="text-foreground">
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      required
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="border-input bg-background text-foreground focus:ring-ring"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? "Giriş yapılıyor..." : "Login"}
                  </Button>
                  <div className="text-center text-sm text-foreground">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={toggleCard}
                      className="underline underline-offset-4 hover:text-primary text-foreground"
                    >
                      Sign up
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Register Card (Back) */}
          <Card className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden border-border bg-card text-card-foreground shadow-sm">
            <CardContent className="p-0 h-full">
              <form
                className="p-6 md:p-8 h-full flex flex-col justify-center"
                onSubmit={handleRegisterSubmit}
              >
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold text-foreground">
                      Create an account
                    </h1>
                    <p className="text-balance text-muted-foreground">
                      Sign up for your Acme Inc account
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="register-name" className="text-foreground">
                      Username
                    </Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="johndoe"
                      required
                      value={registerData.username}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="register-email" className="text-foreground">
                      Email
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="register-password"
                      className="text-foreground"
                    >
                      Password
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      required
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="border-input bg-background text-foreground focus:ring-ring"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="confirm-password"
                      className="text-foreground"
                    >
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="border-input bg-background text-foreground focus:ring-ring"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? "Hesap oluşturuluyor..." : "Create Account"}
                  </Button>
                  <div className="text-center text-sm text-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={toggleCard}
                      className="underline underline-offset-4 hover:text-primary text-foreground"
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
