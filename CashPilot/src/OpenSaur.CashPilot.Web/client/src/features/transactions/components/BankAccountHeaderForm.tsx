import { Button, Grid, MenuItem, TextField } from "@mui/material";
import { useState } from "react";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";

type Props = {
  banks: BankDto[];
  currencies: CurrencyDto[];
  onSubmit: (payload: {
    bankId: string;
    currencyId: string;
    amount: number;
    interestRate: number;
    startDate: string;
    maturityDate: string;
    accountNumber?: string;
    description?: string;
  }) => Promise<void>;
};

export function BankAccountHeaderForm({ banks, currencies, onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [model, setModel] = useState({ bankId: banks[0]?.id ?? "", currencyId: currencies[0]?.id ?? "", amount: "", interestRate: "", startDate: today, maturityDate: today, accountNumber: "", description: "" });

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 3 }}><TextField select label="Bank" value={model.bankId} onChange={e => setModel({ ...model, bankId: e.target.value })} fullWidth>{banks.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}</TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField select label="Currency" value={model.currencyId} onChange={e => setModel({ ...model, currencyId: e.target.value })} fullWidth>{currencies.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}</TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField label="Amount" value={model.amount} onChange={e => setModel({ ...model, amount: e.target.value })} fullWidth /></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField label="Interest %" value={model.interestRate} onChange={e => setModel({ ...model, interestRate: e.target.value })} fullWidth /></Grid>
      <Grid size={{ xs: 12, md: 3 }}><Button sx={{ height: "100%" }} fullWidth variant="contained" onClick={() => onSubmit({ bankId: model.bankId, currencyId: model.currencyId, amount: Number(model.amount), interestRate: Number(model.interestRate), startDate: model.startDate, maturityDate: model.maturityDate, accountNumber: model.accountNumber, description: model.description })}>Create Bank Account</Button></Grid>
    </Grid>
  );
}
