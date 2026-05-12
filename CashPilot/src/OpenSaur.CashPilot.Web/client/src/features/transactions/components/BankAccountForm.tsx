import { Button, Checkbox, FormControlLabel, Grid, MenuItem, Stack, TextField } from "@mui/material";
import { useState } from "react";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { SaveBankAccountDetailRequestDto, SaveBankAccountFormRequestDto } from "../dtos/TransactionDto";
import { BankAccountTransactionForm, formatDisplayValue, handleNumberChange, type DetailEditor } from "./BankAccountTransactionForm";

type Props = {
  banks: BankDto[];
  currencies: CurrencyDto[];
  initialValue?: SaveBankAccountFormRequestDto | null;
  onSubmit: (payload: SaveBankAccountFormRequestDto) => Promise<void>;
  submitLabel?: string;
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
      isActive: x.isActive,
      isNew: false
    }))
  );

  const addNewDetail = () => {
    setDetails(prev => [...prev, {
      clientKey: crypto.randomUUID(),
      currencyId: currencies[0]?.id ?? "",
      amount: "",
      direction: "1",
      transactionType: "2",
      transactionDate: today,
      description: "",
      isActive: true,
      isNew: true
    }]);
  };

  const updateDetail = (clientKey: string, updated: DetailEditor) => {
    setDetails(prev => prev.map(x => x.clientKey === clientKey ? updated : x));
  };

  const removeDetail = (clientKey: string) => {
    setDetails(prev => prev.filter(x => x.clientKey !== clientKey));
  };

  const submitHandler = () => {
    const finalDetails = details.map(toDetailRequest);

    const initialDeposit = finalDetails.find(x => x.transactionType === 1);
    if (initialDeposit) {
      initialDeposit.amount = Number(header.amount);
      initialDeposit.transactionDate = header.startDate;
      initialDeposit.description = header.description.trim().length === 0 ? undefined : header.description.trim();
      initialDeposit.currencyId = header.currencyId;
      initialDeposit.direction = 2;
    } else {
      finalDetails.push({
        currencyId: header.currencyId,
        amount: Number(header.amount),
        direction: 2,
        transactionDate: header.startDate,
        transactionType: 1,
        description: header.description.trim().length === 0 ? undefined : header.description.trim(),
        isActive: header.isActive
      });
    }

    const matured = finalDetails.find(x => x.transactionType === 3);
    if (header.status === "2" || header.status === "3") {
      if (matured) {
        matured.amount = Number(header.amount);
        matured.transactionDate = header.maturityDate;
        matured.description = header.description.trim().length === 0 ? undefined : header.description.trim();
        matured.currencyId = header.currencyId;
        matured.direction = 1;
        matured.isActive = true;
      } else {
        finalDetails.push({
          currencyId: header.currencyId,
          amount: Number(header.amount),
          direction: 1,
          transactionDate: header.maturityDate,
          transactionType: 3,
          description: header.description.trim().length === 0 ? undefined : header.description.trim(),
          isActive: header.isActive
        });
      }
    } else if (matured) {
      matured.isActive = false;
    }

    onSubmit({
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
      details: finalDetails
    });
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField label="Account Number" value={header.accountNumber} onChange={e => setHeader({ ...header, accountNumber: e.target.value })} fullWidth />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField select label="Bank" value={header.bankId} onChange={e => setHeader({ ...header, bankId: e.target.value })} fullWidth>
            {banks.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField 
            label="Interest %" 
            value={formatDisplayValue(header.interestRate)} 
            onChange={e => handleNumberChange(e.target.value, val => setHeader({ ...header, interestRate: val }))} 
            fullWidth 
            autoComplete="off"
            inputMode="decimal"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField 
            label="Amount" 
            value={formatDisplayValue(header.amount)} 
            onChange={e => handleNumberChange(e.target.value, val => setHeader({ ...header, amount: val }))} 
            fullWidth 
            autoComplete="off"
            inputMode="decimal"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField select label="Currency" value={header.currencyId} onChange={e => setHeader({ ...header, currencyId: e.target.value })} fullWidth>
            {currencies.map(x => <MenuItem key={x.id} value={x.id}>{x.shortName}</MenuItem>)}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Start Date" type="date" value={header.startDate} onChange={e => setHeader({ ...header, startDate: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField label="Maturity Date" type="date" value={header.maturityDate} onChange={e => setHeader({ ...header, maturityDate: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField select label="Status" value={header.status} onChange={e => setHeader({ ...header, status: e.target.value })} fullWidth>
            <MenuItem value="1">Active</MenuItem>
            <MenuItem value="2">Matured</MenuItem>
            <MenuItem value="3">Closed Early</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel control={<Checkbox checked={header.isActive} onChange={e => setHeader({ ...header, isActive: e.target.checked })} />} label="Is Active" />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField label="Description" value={header.description} onChange={e => setHeader({ ...header, description: e.target.value })} multiline minRows={3} fullWidth />
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
        <h3 style={{ margin: 0 }}>Transaction Details</h3>
        <Button onClick={addNewDetail} variant="contained" color="secondary" size="small">
          Add Transaction
        </Button>
      </Stack>

      <Stack spacing={2}>
        {details.filter(d => d.transactionType === "2").map((detail) => (
          <BankAccountTransactionForm
            key={detail.clientKey}
            detail={detail}
            onAccept={(updated) => updateDetail(detail.clientKey, updated)}
            onDelete={() => removeDetail(detail.clientKey)}
            onCancelNew={() => removeDetail(detail.clientKey)}
          />
        ))}
      </Stack>

      <Stack direction="row" justifyContent="flex-end">
        <Button
          onClick={submitHandler}
          variant="contained"
        >
          {submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
}
