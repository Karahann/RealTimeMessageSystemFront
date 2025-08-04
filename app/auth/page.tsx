import { AuthCard } from "../../components/auth-card";

export default function AuthPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-lg">
        <AuthCard />
      </div>
    </div>
  );
}
