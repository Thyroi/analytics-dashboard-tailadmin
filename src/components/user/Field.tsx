type FieldProps = {
  label: string;
  value?: string;
  full?: boolean;
};

export default function Field({ label, value, full = false }: FieldProps) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
        {value ? value : <span className="text-gray-400">—</span>}
      </dd>
    </div>
  );
}
