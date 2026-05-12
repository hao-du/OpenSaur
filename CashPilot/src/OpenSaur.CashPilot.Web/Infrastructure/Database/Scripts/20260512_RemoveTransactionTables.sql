-- Remove transaction module tables
-- Safe to run multiple times.

BEGIN;

DROP TABLE IF EXISTS "BankAccountTransactions";
DROP TABLE IF EXISTS "CashFlows";
DROP TABLE IF EXISTS "TransferTransactions";
DROP TABLE IF EXISTS "CurrencyExchangeTransactions";
DROP TABLE IF EXISTS "BankAccounts";
DROP TABLE IF EXISTS "Transfers";
DROP TABLE IF EXISTS "CurrencyExchanges";
DROP TABLE IF EXISTS "Transactions";

COMMIT;
