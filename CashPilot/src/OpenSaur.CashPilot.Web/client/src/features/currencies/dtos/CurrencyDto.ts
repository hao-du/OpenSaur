export type CurrencyDto = {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
  isDefault: boolean;
};

export type UpsertCurrencyRequestDto = {
  name: string;
  shortName: string;
  description: string | null;
  isDefault: boolean;
};
