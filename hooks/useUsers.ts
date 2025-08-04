import { useState, useEffect, useCallback } from "react";
import { UserService } from "@/lib/services/users";
import { User } from "@/lib/types";
import { useAuth } from "@/lib/context/AuthContext";

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user: currentUser } = useAuth();

  const loadUsers = useCallback(async () => {
    if (!token) {
      console.log("useUsers: No token, clearing users");
      setUsers([]);
      return;
    }

    console.log("useUsers: Loading users with token:", token);
    setLoading(true);
    setError(null);

    try {
      console.log("useUsers: Calling UserService.getUsers");
      const usersData = await UserService.getUsers();
      console.log("useUsers: Got users data:", usersData);

      // Kendi hesabımızı listeden çıkar
      const filteredUsers = usersData.filter(
        (user) => user.id !== currentUser?.id
      );
      console.log("useUsers: Filtered users (without self):", filteredUsers);

      setUsers(filteredUsers);
      console.log("useUsers: Successfully set users");
    } catch (err: any) {
      console.error("useUsers: Error loading users:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token, currentUser?.id]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const refreshUsers = useCallback(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    loading,
    error,
    refreshUsers,
  };
};
