import { Metadata } from 'next';
import DevLayoutClient from './DevLayoutClient';

export const metadata: Metadata = {
  title: 'Dev Puerto Habana',
  manifest: '/manifest-dev.json',
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return <DevLayoutClient>{children}</DevLayoutClient>;
}
