import { client } from "../../../infrastructure/http/client";
import type { BankDto, UpsertBankRequestDto } from "../dtos/BankDto";

export type BankFilterParams = {
  isActive: boolean;
  name: string;
  shortName: string;
};

export async function getBanks(filters: BankFilterParams) {
  return client.get<BankDto[]>("/api/banks", {
    params: {
      isActive: filters.isActive,
      name: filters.name.trim().length > 0 ? filters.name.trim() : undefined,
      shortName: filters.shortName.trim().length > 0 ? filters.shortName.trim() : undefined
    }
  });
}

export async function createBank(request: UpsertBankRequestDto) {
  return client.post<BankDto, UpsertBankRequestDto>("/api/banks", request);
}

export async function updateBank(id: string, request: UpsertBankRequestDto) {
  return client.put<BankDto, UpsertBankRequestDto>(`/api/banks/${id}`, request);
}

export async function deleteBank(id: string) {
  await client.delete<void>(`/api/banks/${id}`);
}
