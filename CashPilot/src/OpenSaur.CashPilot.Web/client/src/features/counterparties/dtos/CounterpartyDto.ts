export type CounterpartyDto = {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  description: string | null;
  isActive: boolean;
};

export type CreateCounterpartyRequestDto = {
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  description: string | null;
};

export type UpdateCounterpartyRequestDto = {
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  description: string | null;
  isActive: boolean;
};
