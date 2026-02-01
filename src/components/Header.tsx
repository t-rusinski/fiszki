import { useEffect, useState } from "react";
import { Moon, Sun, LogOut, User, Menu, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user?: {
    email: string | undefined;
    id: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Check localStorage and system preference on mount
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/auth/login";
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Left spacer for balance */}
        <div className="flex-1"></div>

        {/* Center: Logo and Menu */}
        <div className="flex items-center gap-6">
          <a href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
            Fiszki
          </a>

          {user && (
            <nav className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Menu className="h-4 w-4" />
                    <span className="hidden sm:inline">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuLabel>Nawigacja</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/flashcards" className="flex items-center gap-2 cursor-pointer">
                      <Layers className="h-4 w-4" />
                      <span>Moje fiszki</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/generate" className="flex items-center gap-2 cursor-pointer">
                      <Sparkles className="h-4 w-4" />
                      <span>Generuj fiszki</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          )}
        </div>

        {/* Right: User info, logout, and theme toggle */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {user && (
            <>
              <div className="flex items-center gap-2 px-3 py-1 text-sm text-muted-foreground" data-testid="user-info">
                <User className="h-4 w-4" data-testid="user-avatar" />
                <span>{user.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} disabled={isLoggingOut} aria-label="Wyloguj">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          )}
          {!user && (
            <Button variant="ghost" size="sm" asChild>
              <a href="/auth/login">Sign In</a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Przełącz na tryb ciemny" : "Przełącz na tryb jasny"}
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
