export const ClosingStatus = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const;

export type ClosingStatus = (typeof ClosingStatus)[keyof typeof ClosingStatus];

export const closingStatusLabels: Record<ClosingStatus, string> = {
  [ClosingStatus.OPEN]: 'Em aberto',
  [ClosingStatus.CLOSED]: 'Fechado',
};

export const isClosed = (status: ClosingStatus) => status === ClosingStatus.CLOSED;
