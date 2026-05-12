-- Transaction System (PostgreSQL)

BEGIN;

CREATE TABLE IF NOT EXISTS "Transactions" (
    "Id" uuid PRIMARY KEY,
    "Description" character varying(255) NOT NULL DEFAULT '',
    "CreatedBy" uuid NOT NULL,
    "CreatedOn" timestamp with time zone NOT NULL,
    "UpdatedBy" uuid NULL,
    "UpdatedOn" timestamp with time zone NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CurrencyId" uuid NOT NULL REFERENCES "Currencies"("Id") ON DELETE RESTRICT,
    "Amount" numeric(18,4) NOT NULL,
    "Direction" smallint NOT NULL,
    "TransactionDate" date NOT NULL
);

CREATE TABLE IF NOT EXISTS "CashFlows" (
    "Id" uuid PRIMARY KEY,
    "Description" character varying(255) NOT NULL DEFAULT '',
    "CreatedBy" uuid NOT NULL,
    "CreatedOn" timestamp with time zone NOT NULL,
    "UpdatedBy" uuid NULL,
    "UpdatedOn" timestamp with time zone NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "TransactionId" uuid NOT NULL REFERENCES "Transactions"("Id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "BankAccounts" (
    "Id" uuid PRIMARY KEY,
    "Description" character varying(255) NOT NULL DEFAULT '',
    "CreatedBy" uuid NOT NULL,
    "CreatedOn" timestamp with time zone NOT NULL,
    "UpdatedBy" uuid NULL,
    "UpdatedOn" timestamp with time zone NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "BankId" uuid NOT NULL REFERENCES "Banks"("Id") ON DELETE RESTRICT,
    "AccountNumber" character varying(50) NULL,
    "CurrencyId" uuid NOT NULL REFERENCES "Currencies"("Id") ON DELETE RESTRICT,
    "Amount" numeric(18,4) NOT NULL,
    "InterestRate" numeric(8,4) NOT NULL,
    "StartDate" date NOT NULL,
    "MaturityDate" date NOT NULL,
    "Status" smallint NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "BankAccountTransactions" (
    "Id" uuid PRIMARY KEY,
    "Description" character varying(255) NOT NULL DEFAULT '',
    "CreatedBy" uuid NOT NULL,
    "CreatedOn" timestamp with time zone NOT NULL,
    "UpdatedBy" uuid NULL,
    "UpdatedOn" timestamp with time zone NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "BankAccountId" uuid NOT NULL REFERENCES "BankAccounts"("Id") ON DELETE RESTRICT,
    "TransactionId" uuid NOT NULL REFERENCES "Transactions"("Id") ON DELETE RESTRICT,
    "TransactionType" smallint NOT NULL
);

CREATE TABLE IF NOT EXISTS "Transfers" (
    "Id" uuid PRIMARY KEY,
    "Description" character varying(255) NOT NULL DEFAULT '',
    "CreatedBy" uuid NOT NULL,
    "CreatedOn" timestamp with time zone NOT NULL,
    "UpdatedBy" uuid NULL,
    "UpdatedOn" timestamp with time zone NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CounterpartyId" uuid NOT NULL REFERENCES "Counterparties"("Id") ON DELETE RESTRICT,
    "TransferType" smallint NOT NULL,
    "Amount" numeric(18,4) NOT NULL,
    "CurrencyId" uuid NOT NULL REFERENCES "Currencies"("Id") ON DELETE RESTRICT,
    "TransactionDate" date NOT NULL,
    "DueDate" date NULL,
    "Status" smallint NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "TransferTransactions" (
    "Id" uuid PRIMARY KEY,
    "Description" character varying(255) NOT NULL DEFAULT '',
    "CreatedBy" uuid NOT NULL,
    "CreatedOn" timestamp with time zone NOT NULL,
    "UpdatedBy" uuid NULL,
    "UpdatedOn" timestamp with time zone NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "TransferId" uuid NOT NULL REFERENCES "Transfers"("Id") ON DELETE RESTRICT,
    "TransactionId" uuid NOT NULL REFERENCES "Transactions"("Id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "CurrencyExchanges" (
    "Id" uuid PRIMARY KEY,
    "Description" character varying(255) NOT NULL DEFAULT '',
    "CreatedBy" uuid NOT NULL,
    "CreatedOn" timestamp with time zone NOT NULL,
    "UpdatedBy" uuid NULL,
    "UpdatedOn" timestamp with time zone NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "ExchangeRate" numeric(18,6) NOT NULL,
    "ExchangeDate" date NOT NULL
);

CREATE TABLE IF NOT EXISTS "CurrencyExchangeTransactions" (
    "Id" uuid PRIMARY KEY,
    "Description" character varying(255) NOT NULL DEFAULT '',
    "CreatedBy" uuid NOT NULL,
    "CreatedOn" timestamp with time zone NOT NULL,
    "UpdatedBy" uuid NULL,
    "UpdatedOn" timestamp with time zone NULL,
    "IsActive" boolean NOT NULL DEFAULT true,
    "CurrencyExchangeId" uuid NOT NULL REFERENCES "CurrencyExchanges"("Id") ON DELETE RESTRICT,
    "TransactionId" uuid NOT NULL REFERENCES "Transactions"("Id") ON DELETE RESTRICT
);

COMMIT;
