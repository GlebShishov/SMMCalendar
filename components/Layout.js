import Head from 'next/head';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaArrowLeft, FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children, title = 'SMM Content Calendar', showBackButton = false }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Social Media Content Calendar Editor" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col bg-background dark:bg-dark-background text-text dark:text-dark-text">
        {/* Header */}
        <header className="bg-white dark:bg-dark-card shadow">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              {showBackButton ? (
                <Link href="/projects">
                  <div className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    <FaArrowLeft className="mr-2" />
                    <span>Back to projects</span>
                  </div>
                </Link>
              ) : (
                <h1 className="text-xl font-bold text-primary">SMM Content Calendar</h1>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-600" />}
              </button>
              
              {session && (
                <>
                  <Link href="/projects">
                    <div className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                      Мои проекты
                    </div>
                  </Link>
                  <Link href="/projects/share">
                    <div className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                      Демонстрация
                    </div>
                  </Link>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Logged in as <span className="font-medium">{session.user.username}</span>
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-700 py-4">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} SMM Content Calendar. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
