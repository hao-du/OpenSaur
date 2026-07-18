import { client } from "../../../infrastructure/http/client";
import type { CurrencyDto, UpsertCurrencyRequestDto } from "../dtos/CurrencyDto";

export type CurrencyFilterParams = {
  isActive: boolean;
  name: string;
  shortName: string;
};

export async function getCurrencies(filters: CurrencyFilterParams) {
  return client.get<CurrencyDto[]>("/api/currencies", {
    params: {
      isActive: filters.isActive,
      name: filters.name.trim().length > 0 ? filters.name.trim() : undefined,
      shortName: filters.shortName.trim().length > 0 ? filters.shortName.trim() : undefined
    }
  });
}

export async function createCurrency(request: UpsertCurrencyRequestDto) {
  return client.post<CurrencyDto, UpsertCurrencyRequestDto>("/api/currencies", request);
}

export async function updateCurrency(id: string, request: UpsertCurrencyRequestDto) {
  return client.put<CurrencyDto, UpsertCurrencyRequestDto>(`/api/currencies/${id}`, request);
}

export async function deleteCurrency(id: string) {
  await client.delete<void>(`/api/currencies/${id}`);
}
