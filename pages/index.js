import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/projects');
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Head>
        <title>SMM Content Calendar</title>
        <meta name="description" content="Social Media Content Calendar Editor" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading SMM Content Calendar...</h1>
        <p>Please wait while we redirect you...</p>
      </div>
    </div>
  );
}
