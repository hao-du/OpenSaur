import { Button, Grid, MenuItem, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { BankAccountLookupDto } from "../dtos/TransactionDto";

type Props = {
  currencies: CurrencyDto[];
  bankAccounts: BankAccountLookupDto[];
  initialValue?: {
    bankAccountId: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionType: number;
    transactionDate: string;
    description?: string | null;
  } | null;
  submitLabel?: string;
  onSubmit: (payload: {
    bankAccountId: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionType: number;
    transactionDate: string;
    description?: string;
  }) => Promise<void>;
};

export function BankAccountMovementForm({ currencies, bankAccounts, initialValue, submitLabel = "Add Movement", onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [model, setModel] = useState({ bankAccountId: bankAccounts[0]?.id ?? "", currencyId: currencies[0]?.id ?? "", amount: "", direction: "1", transactionType: "2", transactionDate: today, description: "" });

  useEffect(() => {
    if (initialValue == null) {
      return;
    }

    setModel({
      amount: initialValue.amount.toString(),
      bankAccountId: initialValue.bankAccountId,
      currencyId: initialValue.currencyId,
      description: initialValue.description ?? "",
      direction: initialValue.direction.toString(),
      transactionDate: initialValue.transactionDate,
      transactionType: initialValue.transactionType.toString()
    });
  }, [initialValue]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}><TextField select label="Bank Account" value={model.bankAccountId} onChange={e => setModel({ ...model, bankAccountId: e.target.value })} fullWidth>{bankAccounts.map(x => <MenuItem key={x.id} value={x.id}>{`${x.bankShortName} - ${x.currencyCode} - ${x.amount}`}</MenuItem>)}</TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField select label="Currency" value={model.currencyId} onChange={e => setModel({ ...model, currencyId: e.target.value })} fullWidth>{currencies.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}</TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField label="Amount" value={model.amount} onChange={e => setModel({ ...model, amount: e.target.value })} fullWidth /></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField select label="Movement" value={model.transactionType} onChange={e => setModel({ ...model, transactionType: e.target.value })} fullWidth><MenuItem value="1">InitialDeposit</MenuItem><MenuItem value="2">InterestPayment</MenuItem><MenuItem value="3">PrincipalReturn</MenuItem></TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><Button sx={{ height: "100%" }} fullWidth variant="outlined" onClick={() => onSubmit({ bankAccountId: model.bankAccountId, currencyId: model.currencyId, amount: Number(model.amount), direction: Number(model.direction), transactionType: Number(model.transactionType), transactionDate: model.transactionDate, description: model.description })}>{submitLabel}</Button></Grid>
    </Grid>
  );
}
