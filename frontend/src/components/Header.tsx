import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckSquare, Moon, Sun, Menu, X } from "lucide-react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { useTheme } from "../contexts/ThemeContext";

const Header: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-[#181818] shadow-sm border-b border-gray-200 dark:border-[#404040]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <CheckSquare className="text-blue-600" size={24} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Taskyy</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
          </nav>

          {/* Desktop Profile */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#212121] dark:hover:bg-[#2a2a2a] transition-colors"
              title={theme === 'light' ? 'Przełącz na tryb ciemny' : 'Przełącz na tryb jasny'}
            >
              {theme === 'light' ? (
                <Moon size={20} className="text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun size={20} className="text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            {isSignedIn && user && (
              <UserButton afterSignOutUrl="/" />
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#212121] dark:hover:bg-[#2a2a2a] transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-[#404040] py-4">
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            </nav>
            
            <div className="flex flex-col items-center space-y-4 mt-4 pt-4 border-t border-gray-200 dark:border-[#404040]">
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#212121] dark:hover:bg-[#2a2a2a] transition-colors"
              >
                {theme === 'light' ? (
                  <Moon size={20} className="text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun size={20} className="text-gray-600 dark:text-gray-300" />
                )}
                <span className="text-sm">{theme === 'light' ? 'Ciemny' : 'Jasny'}</span>
              </button>
              
              {isSignedIn && user && (
                <UserButton afterSignOutUrl="/" />
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
