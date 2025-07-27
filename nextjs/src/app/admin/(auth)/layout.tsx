import SessionProvider from '@/components/SessionProvider';
import { Toaster } from 'sonner';

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  );
} 