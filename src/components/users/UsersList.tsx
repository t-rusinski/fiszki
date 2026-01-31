import { useState, useEffect } from "react";
import type { User } from "../types";

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/users");

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-blue-100/90 text-lg">Ładowanie użytkowników...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-500/10 backdrop-blur-lg rounded-xl p-8 border border-red-500/20">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-4 text-xl font-semibold text-red-200">Wystąpił błąd</h3>
          <p className="mt-2 text-red-100/80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105"
          >
            <div className="flex items-start space-x-4">
              <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-white/20" />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200 truncate">
                  {user.name}
                </h3>
                <p className="text-sm text-blue-100/70 truncate">{user.email}</p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200">
                  {user.role}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-blue-100/50">
                Dołączył: {new Date(user.createdAt).toLocaleDateString("pl-PL")}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8 p-4 bg-yellow-500/10 backdrop-blur-lg rounded-lg border border-yellow-500/20">
        <p className="text-sm text-yellow-200/90">
          <strong>Uwaga:</strong> Wyświetlane dane są przykładowe (dummy data). Integracja z bazą danych Supabase
          zostanie dodana w kolejnym kroku.
        </p>
      </div>
    </div>
  );
}
