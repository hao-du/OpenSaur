import { Button, Grid, MenuItem, TextField } from "@mui/material";
import { useState } from "react";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";

type Props = {
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  onSubmit: (payload: {
    counterpartyId: string;
    transferType: number;
    currencyId: string;
    amount: number;
    transactionDate: string;
    dueDate?: string;
    description?: string;
  }) => Promise<void>;
};

export function TransferHeaderForm({ counterparties, currencies, onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [model, setModel] = useState({ counterpartyId: counterparties[0]?.id ?? "", transferType: "1", currencyId: currencies[0]?.id ?? "", amount: "", transactionDate: today, dueDate: "", description: "" });

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 3 }}><TextField select label="Counterparty" value={model.counterpartyId} onChange={e => setModel({ ...model, counterpartyId: e.target.value })} fullWidth>{counterparties.map(x => <MenuItem key={x.id} value={x.id}>{x.fullName}</MenuItem>)}</TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField select label="Type" value={model.transferType} onChange={e => setModel({ ...model, transferType: e.target.value })} fullWidth><MenuItem value="1">Lend</MenuItem><MenuItem value="2">Borrow</MenuItem><MenuItem value="3">Give</MenuItem><MenuItem value="4">Receive</MenuItem></TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField select label="Currency" value={model.currencyId} onChange={e => setModel({ ...model, currencyId: e.target.value })} fullWidth>{currencies.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}</TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField label="Amount" value={model.amount} onChange={e => setModel({ ...model, amount: e.target.value })} fullWidth /></Grid>
      <Grid size={{ xs: 12, md: 3 }}><Button sx={{ height: "100%" }} fullWidth variant="contained" onClick={() => onSubmit({ counterpartyId: model.counterpartyId, transferType: Number(model.transferType), currencyId: model.currencyId, amount: Number(model.amount), transactionDate: model.transactionDate, dueDate: model.dueDate || undefined, description: model.description })}>Create Transfer</Button></Grid>
    </Grid>
  );
}
