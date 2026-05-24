'use client';

import CocinaSidebar from '@/components/CocinaSidebar';

export default function CocinaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-gray-50 dark:bg-black">
      <CocinaSidebar />
      <main className="flex-1 w-full lg:ml-64 px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:py-8 lg:pb-8 xl:px-12 xl:py-12 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
