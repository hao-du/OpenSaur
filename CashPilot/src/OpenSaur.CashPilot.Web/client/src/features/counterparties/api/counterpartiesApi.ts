import { client } from "../../../infrastructure/http/client";
import type { CounterpartyDto, CreateCounterpartyRequestDto, UpdateCounterpartyRequestDto } from "../dtos/CounterpartyDto";

export type CounterpartyFilterParams = {
  isActive: boolean;
  fullName: string;
  email: string;
  phoneNumber: string;
};

export async function getCounterparties(filters: CounterpartyFilterParams) {
  return client.get<CounterpartyDto[]>("/api/counterparties", {
    params: {
      isActive: filters.isActive,
      fullName: filters.fullName.trim().length > 0 ? filters.fullName.trim() : undefined,
      email: filters.email.trim().length > 0 ? filters.email.trim() : undefined,
      phoneNumber: filters.phoneNumber.trim().length > 0 ? filters.phoneNumber.trim() : undefined
    }
  });
}

export async function createCounterparty(request: CreateCounterpartyRequestDto) {
  return client.post<CounterpartyDto, CreateCounterpartyRequestDto>("/api/counterparties", request);
}

export async function updateCounterparty(id: string, request: UpdateCounterpartyRequestDto) {
  return client.put<CounterpartyDto, UpdateCounterpartyRequestDto>(`/api/counterparties/${id}`, request);
}

export async function deleteCounterparty(id: string) {
  await client.delete<void>(`/api/counterparties/${id}`);
}
