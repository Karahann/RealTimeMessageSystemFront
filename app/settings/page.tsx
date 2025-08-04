"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Mail, Lock, Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Auth check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.username || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfileUpdate = async () => {
    try {
      setIsUpdating(true);

      // Validation
      if (!formData.username.trim()) {
        toast.error("Kullanıcı adı boş olamaz");
        return;
      }

      if (!formData.email.trim()) {
        toast.error("E-mail boş olamaz");
        return;
      }

      // Password validation if changing password
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          toast.error("Şifre değiştirmek için mevcut şifrenizi girin");
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error("Yeni şifreler eşleşmiyor");
          return;
        }
        if (formData.newPassword.length < 6) {
          toast.error("Yeni şifre en az 6 karakter olmalı");
          return;
        }
      }

      // Prepare update data
      const updateData: any = {
        username: formData.username,
        email: formData.email,
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      await updateProfile(updateData);

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      toast.success("Profil başarıyla güncellendi");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Profil güncellenirken hata oluştu");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      setIsUpdating(true);

      if (!formData.currentPassword) {
        toast.error("Mevcut şifrenizi girin");
        return;
      }

      if (!formData.newPassword) {
        toast.error("Yeni şifrenizi girin");
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("Yeni şifreler eşleşmiyor");
        return;
      }

      if (formData.newPassword.length < 6) {
        toast.error("Yeni şifre en az 6 karakter olmalı");
        return;
      }

      await updateProfile({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      toast.success("Şifre başarıyla güncellendi");
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(error.message || "Şifre güncellenirken hata oluştu");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/chat")}
            className="lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ayarlar</h1>
            <p className="text-muted-foreground">
              Profil bilgilerinizi yönetin
            </p>
          </div>
        </div>

        {/* Profile Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil Bilgileri
            </CardTitle>
            <CardDescription>
              Kullanıcı adınızı ve e-mail adresinizi güncelleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Kullanıcı adınızı girin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="E-mail adresinizi girin"
              />
            </div>

            <Button
              onClick={handleProfileUpdate}
              disabled={isUpdating}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? "Güncelleniyor..." : "Profili Güncelle"}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Şifre Değiştir
            </CardTitle>
            <CardDescription>
              Hesap güvenliğiniz için şifrenizi güncelleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mevcut Şifre</Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) =>
                  handleInputChange("currentPassword", e.target.value)
                }
                placeholder="Mevcut şifrenizi girin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) =>
                  handleInputChange("newPassword", e.target.value)
                }
                placeholder="Yeni şifrenizi girin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                placeholder="Yeni şifrenizi tekrar girin"
              />
            </div>

            <Button
              onClick={handlePasswordUpdate}
              disabled={isUpdating}
              className="w-full"
              variant="outline"
            >
              <Lock className="h-4 w-4 mr-2" />
              {isUpdating ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </Button>
          </CardContent>
        </Card>

        {/* Back to Chat Button for Desktop */}
        <div className="hidden lg:block mt-8">
          <Button
            variant="outline"
            onClick={() => router.push("/chat")}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Sohbete Dön
          </Button>
        </div>
      </div>
    </div>
  );
}
