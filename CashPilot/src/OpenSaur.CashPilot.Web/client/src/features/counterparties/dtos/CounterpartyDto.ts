export type CounterpartyDto = {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
};

export type CreateCounterpartyRequestDto = {
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  description: string | null;
  isDefault: boolean;
};

export type UpdateCounterpartyRequestDto = {
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
};
