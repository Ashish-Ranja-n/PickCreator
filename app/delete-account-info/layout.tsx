import Link from 'next/link';

export default function DeleteAccountInfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="py-4 px-4 border-b mb-8">
        <Link href="/sign-up" className="text-blue-600 font-semibold">&larr; Back to Home</Link>
      </nav>
      {children}
    </div>
  );
}
