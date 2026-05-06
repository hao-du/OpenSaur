export type BankDto = {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  isDefault: boolean;
};

export type UpsertBankRequestDto = {
  name: string;
  shortName: string;
  description: string | null;
  isDefault: boolean;
};

