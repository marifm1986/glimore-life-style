export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 py-12">
      {children}
    </div>
  );
}
