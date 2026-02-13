export default function useFlattenArray<T>(input: unknown): T[] {
  if (!input) return [];

  // Vue ref / computed
  const v = (input as any)?.value ?? input;

  if (Array.isArray(v)) return v;
  if (Array.isArray((v as any)?.data)) return (v as any).data;

  return [];
}
