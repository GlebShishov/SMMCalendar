import Head from 'next/head';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function Layout({ children, title = 'SMM Content Calendar', showBackButton = false }) {
  const { data: session } = useSession();
  const router = useRouter();

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

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              {showBackButton ? (
                <Link href="/projects">
                  <div className="flex items-center text-gray-600 hover:text-gray-900">
                    <FaArrowLeft className="mr-2" />
                    <span>Back to projects</span>
                  </div>
                </Link>
              ) : (
                <h1 className="text-xl font-bold text-primary">SMM Content Calendar</h1>
              )}
            </div>
            
            {session && (
              <div className="flex items-center space-x-4">
                <Link href="/projects">
                  <div className="text-sm text-blue-600 hover:text-blue-800">
                    Мои проекты
                  </div>
                </Link>
                <Link href="/projects/share">
                  <div className="text-sm text-blue-600 hover:text-blue-800">
                    Демонстрация
                  </div>
                </Link>
                <span className="text-sm text-gray-600">
                  Logged in as <span className="font-medium">{session.user.username}</span>
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} SMM Content Calendar. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
