export const parseId = (raw: string | string[] | undefined): number | null => {
  if (typeof raw !== 'string') {
    return null;
  }

  const id = Number.parseInt(raw, 10);
  return Number.isNaN(id) ? null : id;
};
