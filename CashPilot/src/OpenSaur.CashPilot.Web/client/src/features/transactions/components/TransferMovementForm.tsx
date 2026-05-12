import { Button, Grid, MenuItem, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { TransferLookupDto } from "../dtos/TransactionDto";

type Props = {
  transfers: TransferLookupDto[];
  currencies: CurrencyDto[];
  initialValue?: {
    transferId: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionDate: string;
    description?: string | null;
  } | null;
  submitLabel?: string;
  onSubmit: (payload: {
    transferId: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionDate: string;
    description?: string;
  }) => Promise<void>;
};

export function TransferMovementForm({ transfers, currencies, initialValue, submitLabel = "Add Transaction", onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [model, setModel] = useState({ transferId: transfers[0]?.id ?? "", currencyId: currencies[0]?.id ?? "", amount: "", direction: "1", transactionDate: today, description: "" });

  useEffect(() => {
    if (initialValue == null) {
      return;
    }

    setModel({
      amount: initialValue.amount.toString(),
      currencyId: initialValue.currencyId,
      description: initialValue.description ?? "",
      direction: initialValue.direction.toString(),
      transactionDate: initialValue.transactionDate,
      transferId: initialValue.transferId
    });
  }, [initialValue]);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}><TextField select label="Transfer" value={model.transferId} onChange={e => setModel({ ...model, transferId: e.target.value })} fullWidth>{transfers.map(x => <MenuItem key={x.id} value={x.id}>{`${x.counterpartyName} - ${x.transferType} - ${x.amount} - ${x.status} (remaining ${x.remainingAmount})`}</MenuItem>)}</TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField select label="Currency" value={model.currencyId} onChange={e => setModel({ ...model, currencyId: e.target.value })} fullWidth>{currencies.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}</TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField label="Amount" value={model.amount} onChange={e => setModel({ ...model, amount: e.target.value })} fullWidth /></Grid>
      <Grid size={{ xs: 12, md: 2 }}><TextField select label="Direction" value={model.direction} onChange={e => setModel({ ...model, direction: e.target.value })} fullWidth><MenuItem value="1">In</MenuItem><MenuItem value="2">Out</MenuItem></TextField></Grid>
      <Grid size={{ xs: 12, md: 2 }}><Button sx={{ height: "100%" }} fullWidth variant="outlined" onClick={() => onSubmit({ transferId: model.transferId, currencyId: model.currencyId, amount: Number(model.amount), direction: Number(model.direction), transactionDate: model.transactionDate, description: model.description })}>{submitLabel}</Button></Grid>
    </Grid>
  );
}
