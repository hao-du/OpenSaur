import { Button, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";

type Props = {
  currencies: CurrencyDto[];
  initialValue?: {
    exchangeRate: number;
    exchangeDate: string;
    outCurrencyId: string;
    outAmount: number;
    inCurrencyId: string;
    inAmount: number;
    description?: string | null;
  } | null;
  submitLabel?: string;
  onSubmit: (payload: {
    exchangeRate: number;
    exchangeDate: string;
    outLeg: { currencyId: string; amount: number; description?: string };
    inLeg: { currencyId: string; amount: number; description?: string };
    description?: string;
  }) => Promise<void>;
};

export function ExchangeForm({ currencies, initialValue, submitLabel = "Create Exchange", onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [model, setModel] = useState({ exchangeRate: "", exchangeDate: today, outCurrencyId: currencies[0]?.id ?? "", outAmount: "", inCurrencyId: currencies[0]?.id ?? "", inAmount: "", description: "" });

  useEffect(() => {
    if (initialValue == null) {
      return;
    }

    setModel({
      description: initialValue.description ?? "",
      exchangeDate: initialValue.exchangeDate,
      exchangeRate: initialValue.exchangeRate.toString(),
      inAmount: initialValue.inAmount.toString(),
      inCurrencyId: initialValue.inCurrencyId,
      outAmount: initialValue.outAmount.toString(),
      outCurrencyId: initialValue.outCurrencyId
    });
  }, [initialValue]);

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
      <TextField label="Exchange Rate" value={model.exchangeRate} onChange={e => setModel({ ...model, exchangeRate: e.target.value })} fullWidth />
      <TextField select label="Out Currency" value={model.outCurrencyId} onChange={e => setModel({ ...model, outCurrencyId: e.target.value })} fullWidth>{currencies.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}</TextField>
      <TextField label="Out Amount" value={model.outAmount} onChange={e => setModel({ ...model, outAmount: e.target.value })} fullWidth />
      <TextField select label="In Currency" value={model.inCurrencyId} onChange={e => setModel({ ...model, inCurrencyId: e.target.value })} fullWidth>{currencies.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}</TextField>
      <TextField label="In Amount" value={model.inAmount} onChange={e => setModel({ ...model, inAmount: e.target.value })} fullWidth />
      <Button variant="contained" onClick={() => onSubmit({ exchangeRate: Number(model.exchangeRate), exchangeDate: model.exchangeDate, description: model.description, outLeg: { currencyId: model.outCurrencyId, amount: Number(model.outAmount) }, inLeg: { currencyId: model.inCurrencyId, amount: Number(model.inAmount) } })}>{submitLabel}</Button>
    </Stack>
  );
}
