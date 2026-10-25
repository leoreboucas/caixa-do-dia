const pad2 = (value: number) => value.toString().padStart(2, '0');

export const formatDateTimeBR = (iso: string): string => {
  const date = new Date(iso);
  const day = `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  return `${day} às ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};
