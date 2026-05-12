import { Button, Grid, MenuItem, Stack, TextField } from "@mui/material";
import { useState } from "react";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { SaveBankAccountDetailRequestDto, SaveBankAccountFormRequestDto } from "../dtos/TransactionDto";

type Props = {
  banks: BankDto[];
  currencies: CurrencyDto[];
  initialValue?: SaveBankAccountFormRequestDto | null;
  onSubmit: (payload: SaveBankAccountFormRequestDto) => Promise<void>;
  submitLabel?: string;
};

type DetailEditor = {
  clientKey: string;
  id?: string;
  currencyId: string;
  amount: string;
  direction: string;
  transactionType: string;
  transactionDate: string;
  description: string;
  isActive: boolean;
};

function toDetailRequest(detail: DetailEditor): SaveBankAccountDetailRequestDto {
  return {
    id: detail.id,
    currencyId: detail.currencyId,
    amount: Number(detail.amount),
    direction: Number(detail.direction),
    transactionDate: detail.transactionDate,
    transactionType: Number(detail.transactionType),
    description: detail.description.trim().length === 0 ? undefined : detail.description.trim(),
    isActive: detail.isActive
  };
}

export function BankAccountForm({ banks, currencies, initialValue, onSubmit, submitLabel = "Create" }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [header, setHeader] = useState({
    id: initialValue?.id,
    bankId: initialValue?.bankId ?? banks[0]?.id ?? "",
    currencyId: initialValue?.currencyId ?? currencies[0]?.id ?? "",
    amount: initialValue?.amount?.toString() ?? "",
    interestRate: initialValue?.interestRate?.toString() ?? "",
    startDate: initialValue?.startDate ?? today,
    maturityDate: initialValue?.maturityDate ?? today,
    status: (initialValue?.status ?? 1).toString(),
    accountNumber: initialValue?.accountNumber ?? "",
    description: initialValue?.description ?? "",
    isActive: initialValue?.isActive ?? true
  });

  const [detailEditor, setDetailEditor] = useState<DetailEditor>({
    clientKey: crypto.randomUUID(),
    currencyId: currencies[0]?.id ?? "",
    amount: "",
    direction: "1",
    transactionType: "1",
    transactionDate: today,
    description: "",
    isActive: true
  });

  const [details, setDetails] = useState<DetailEditor[]>(
    (initialValue?.details ?? []).map(x => ({
      clientKey: crypto.randomUUID(),
      id: x.id,
      currencyId: x.currencyId,
      amount: x.amount.toString(),
      direction: x.direction.toString(),
      transactionType: x.transactionType.toString(),
      transactionDate: x.transactionDate,
      description: x.description ?? "",
      isActive: x.isActive
    }))
  );

  const [editingDetailId, setEditingDetailId] = useState<string | null>(null);

  const resetDetailEditor = () => {
    setDetailEditor({
      clientKey: crypto.randomUUID(),
      currencyId: currencies[0]?.id ?? "",
      amount: "",
      direction: "1",
      transactionType: "1",
      transactionDate: today,
      description: "",
      isActive: true
    } as DetailEditor);
    setEditingDetailId(null);
  };

  const upsertDetail = () => {
    if (detailEditor.amount.trim().length === 0) {
      return;
    }

    if (editingDetailId == null) {
      setDetails(prev => [...prev, { ...detailEditor, id: undefined }]);
      resetDetailEditor();
      return;
    }

    setDetails(prev => prev.map(x => x.clientKey === editingDetailId ? { ...detailEditor, id: x.id, clientKey: x.clientKey } : x));
    resetDetailEditor();
  };

  const editDetail = (clientKey: string) => {
    const found = details.find(x => x.clientKey === clientKey);
    if (found == null) {
      return;
    }

    setDetailEditor({ ...found });
    setEditingDetailId(clientKey);
  };

  const deleteDetail = (clientKey: string) => {
    setDetails(prev => prev.filter(x => x.clientKey !== clientKey));
    if (editingDetailId === clientKey) {
      resetDetailEditor();
    }
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}><TextField select label="Bank" value={header.bankId} onChange={e => setHeader({ ...header, bankId: e.target.value })} fullWidth>{banks.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}</TextField></Grid>
        <Grid size={{ xs: 12, md: 2 }}><TextField select label="Currency" value={header.currencyId} onChange={e => setHeader({ ...header, currencyId: e.target.value })} fullWidth>{currencies.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}</TextField></Grid>
        <Grid size={{ xs: 12, md: 2 }}><TextField label="Amount" value={header.amount} onChange={e => setHeader({ ...header, amount: e.target.value })} fullWidth /></Grid>
        <Grid size={{ xs: 12, md: 2 }}><TextField label="Interest %" value={header.interestRate} onChange={e => setHeader({ ...header, interestRate: e.target.value })} fullWidth /></Grid>
        <Grid size={{ xs: 12, md: 3 }}><TextField label="Description" value={header.description} onChange={e => setHeader({ ...header, description: e.target.value })} fullWidth /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}><TextField select label="Detail Currency" value={detailEditor.currencyId} onChange={e => setDetailEditor({ ...detailEditor, currencyId: e.target.value })} fullWidth>{currencies.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}</TextField></Grid>
        <Grid size={{ xs: 12, md: 2 }}><TextField label="Detail Amount" value={detailEditor.amount} onChange={e => setDetailEditor({ ...detailEditor, amount: e.target.value })} fullWidth /></Grid>
        <Grid size={{ xs: 12, md: 2 }}><TextField select label="Direction" value={detailEditor.direction} onChange={e => setDetailEditor({ ...detailEditor, direction: e.target.value })} fullWidth><MenuItem value="1">In</MenuItem><MenuItem value="2">Out</MenuItem></TextField></Grid>
        <Grid size={{ xs: 12, md: 2 }}><TextField select label="Type" value={detailEditor.transactionType} onChange={e => setDetailEditor({ ...detailEditor, transactionType: e.target.value })} fullWidth><MenuItem value="1">InitialDeposit</MenuItem><MenuItem value="2">InterestPayment</MenuItem><MenuItem value="3">PrincipalReturn</MenuItem></TextField></Grid>
        <Grid size={{ xs: 12, md: 3 }}><TextField label="Description" value={detailEditor.description} onChange={e => setDetailEditor({ ...detailEditor, description: e.target.value })} fullWidth /></Grid>
      </Grid>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button onClick={resetDetailEditor} variant="outlined">Clear</Button>
        <Button onClick={upsertDetail} variant="contained">{editingDetailId == null ? "Add Detail" : "Update Detail"}</Button>
      </Stack>

      <Stack spacing={1}>
        {details.map((detail, index) => (
          <Stack key={detail.clientKey ?? detail.id ?? `${index}`} direction="row" justifyContent="space-between" alignItems="center">
            <span>{`${detail.transactionDate} | ${detail.currencyId} | ${detail.amount} | ${detail.direction === "1" ? "In" : "Out"} | ${detail.transactionType}`}</span>
            <Stack direction="row" spacing={1}>
              <Button onClick={() => editDetail(detail.clientKey)} size="small">Edit</Button>
              <Button color="error" onClick={() => deleteDetail(detail.clientKey)} size="small">Delete</Button>
            </Stack>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" justifyContent="flex-end">
        <Button
          onClick={() => onSubmit({
            id: header.id,
            bankId: header.bankId,
            currencyId: header.currencyId,
            amount: Number(header.amount),
            interestRate: Number(header.interestRate),
            startDate: header.startDate,
            maturityDate: header.maturityDate,
            status: Number(header.status),
            accountNumber: header.accountNumber.trim().length === 0 ? undefined : header.accountNumber.trim(),
            description: header.description.trim().length === 0 ? undefined : header.description.trim(),
            isActive: header.isActive,
            details: details.map(toDetailRequest)
          })}
          variant="contained"
        >
          {submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
