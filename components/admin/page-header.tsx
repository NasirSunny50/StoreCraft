export function AdminPageHeader({
  title,
  testId,
  children,
}: {
  title: string;
  testId?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 data-testid={testId} className="text-xl font-bold text-ink">
        {title}
      </h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
