import React from "react";
import { Link } from "react-router-dom";
import { CheckSquare, Moon, Sun } from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { useTheme } from "../contexts/ThemeContext";

const Header: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <CheckSquare className="text-primary-600" size={24} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Task Manager</span>
          </Link>

          {/* Nawigacja */}
          <nav className="flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
          </nav>

          {/* Profil użytkownika */}
          <div className="flex items-center space-x-4">
            {/* Przełącznik motywu */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'light' ? 'Przełącz na tryb ciemny' : 'Przełącz na tryb jasny'}
            >
              {theme === 'light' ? (
                <Moon size={20} className="text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun size={20} className="text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            {isSignedIn && user ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <button className="flex items-center space-x-1 text-primary-600 hover:text-primary-800 text-sm font-medium">
                  <span>Zaloguj się</span>
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
