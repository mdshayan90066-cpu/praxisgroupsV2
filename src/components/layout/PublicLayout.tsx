import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'rgba(10,10,10,0.45)' }}>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
