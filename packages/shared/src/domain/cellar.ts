export type Cellar = {
  userId: string;
  usedSlots: number;
  maxSlots: number;
};

export type CellarEntry = {
  id: string;
  userId: string;
  batchId: string;
  storedAt: string;
};
