import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User, Building2, Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-robinhood-black transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-robinhood-dark-gray shadow-sm border-b border-gray-200 dark:border-robinhood-light-gray transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-robinhood-green transition-colors duration-200 flex-shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-robinhood-text-light transition-colors duration-200 min-w-0">
                <span className="block sm:inline">SophistaVault</span>
                <span className="hidden sm:inline text-sm font-normal text-gray-600 dark:text-robinhood-text-muted ml-2">
                  Repositing since 2025
                </span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm text-gray-600 dark:text-robinhood-text-muted hover:text-gray-900 dark:hover:text-robinhood-text-light hover:bg-gray-100 dark:hover:bg-robinhood-light-gray rounded-lg transition-all duration-200"
                title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
                </span>
              </button>

              <div className="flex items-center space-x-1 sm:space-x-2 text-sm text-gray-600 dark:text-robinhood-text-muted">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="dark:text-robinhood-text-light max-w-20 sm:max-w-none truncate" title={user?.username}>
                  {user?.username}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-sm text-gray-600 dark:text-robinhood-text-muted hover:text-gray-900 dark:hover:text-robinhood-text-light hover:bg-gray-100 dark:hover:bg-robinhood-light-gray rounded-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 