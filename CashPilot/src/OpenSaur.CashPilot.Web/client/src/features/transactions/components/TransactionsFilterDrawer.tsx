import { Stack } from "@mui/material";
import { useEffect, useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { MultiSelect } from "../../../components/atoms/MultiSelect";
import { Text } from "../../../components/atoms/Text";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import { useSettings } from "../../settings/provider/SettingProvider";

export type TransactionFilterValues = {
  description: string;
  fromDate: string;
  rangePreset: "Month" | "Year" | "ThisWeek" | "Today" | "Custom";
  toDate: string;
  types: Array<"CashFlow" | "BankAccount" | "Transfer" | "Exchange">;
  showOnlyInitialDeposits: boolean;
};

type Props = {
  initialValues: TransactionFilterValues;
  isOpen: boolean;
  onApply: (values: TransactionFilterValues) => void;
  onClose: () => void;
};

export function TransactionsFilterDrawer({
  initialValues,
  isOpen,
  onApply,
  onClose
}: Props) {
  const { t } = useSettings();
  const formId = "transactions-filter-form";
  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth();
  const formatDate = useCallback((date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`, []);

  const getCurrentMonthRange = useCallback(() => ({
    fromDate: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    toDate: `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`
  }), [year, month]);

  const getDefaultFilterValues = (): TransactionFilterValues => ({
    description: "",
    fromDate: getCurrentMonthRange().fromDate,
    rangePreset: "Month",
    showOnlyInitialDeposits: false,
    toDate: getCurrentMonthRange().toDate,
    types: ["CashFlow", "BankAccount", "Transfer", "Exchange"]
  });

  const getCurrentYearRange = useCallback(() => ({
    fromDate: `${year}-01-01`,
    toDate: `${year}-12-31`
  }), [year]);

  const getTodayRange = useCallback(() => {
    const today = formatDate(now);
    return { fromDate: today, toDate: today };
  }, [formatDate, now]);

  const getThisWeekRange = useCallback(() => {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const from = new Date(year, month, now.getDate() + mondayOffset);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return { fromDate: formatDate(from), toDate: formatDate(to) };
  }, [formatDate, year, month, now]);

  const normalizeYearDate = (value: string, suffix: string) => {
    if (/^\d{4}$/.test(value)) {
      return `${value}${suffix}`;
    }

    return value;
  };
  const form = useForm<TransactionFilterValues>({
    defaultValues: initialValues
  });
  // useWatch provides a subscription‑safe way to read form values.
  const rangePreset = useWatch({ control: form.control, name: "rangePreset" });
  const fromDate = useWatch({ control: form.control, name: "fromDate" });
  const toDate = useWatch({ control: form.control, name: "toDate" });
  const showOnlyInitialDeposits = useWatch({ control: form.control, name: "showOnlyInitialDeposits", defaultValue: false });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    form.reset(initialValues);
  }, [form, initialValues, isOpen]);

  useEffect(() => {
    if (fromDate.length === 0 || toDate.length === 0) {
      return;
    }

    if (toDate < fromDate) {
      form.setValue("toDate", fromDate);
    }
  }, [form, fromDate, toDate]);

  useEffect(() => {
    if (rangePreset === "Custom") {
      return;
    }
    if (rangePreset === "Month") {
      const range = getCurrentMonthRange();
      form.setValue("fromDate", range.fromDate);
      form.setValue("toDate", range.toDate);
      return;
    }
    if (rangePreset === "Year") {
      const range = getCurrentYearRange();
      form.setValue("fromDate", range.fromDate);
      form.setValue("toDate", range.toDate);
      return;
    }
    if (rangePreset === "Today") {
      const range = getTodayRange();
      form.setValue("fromDate", range.fromDate);
      form.setValue("toDate", range.toDate);
      return;
    }
    const range = getThisWeekRange();
    form.setValue("fromDate", range.fromDate);
    form.setValue("toDate", range.toDate);
  }, [form, rangePreset, getCurrentMonthRange, getCurrentYearRange, getTodayRange, getThisWeekRange]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={t("transactions.filterTitle")}>
      <DrawerHeader />
      <DrawerBody
        component="form"
        id={formId}
        noValidate
        onSubmit={form.handleSubmit(values => {
          let fromDate = values.fromDate;
          let toDate = values.toDate;

          if (values.rangePreset === "Month") {
            const [fromYear, fromMonth] = values.fromDate.split("-").map(Number);
            const [toYear, toMonth] = values.toDate.split("-").map(Number);
            fromDate = `${fromYear}-${String(fromMonth).padStart(2, "0")}-01`;
            toDate = `${toYear}-${String(toMonth).padStart(2, "0")}-${String(new Date(toYear, toMonth, 0).getDate()).padStart(2, "0")}`;
          } else if (values.rangePreset === "Year") {
            fromDate = normalizeYearDate(values.fromDate, "-01-01");
            toDate = normalizeYearDate(values.toDate, "-12-31");
          }

          onApply({
            ...values,
            description: values.description.trim(),
            fromDate,
            toDate
          });
        })}
      >
        <Stack spacing={2}>
          <CheckBox
            control={form.control}
            label={t("transactions.filter.showOnlyActiveBankAccounts")}
            name="showOnlyInitialDeposits"
          />
          {!showOnlyInitialDeposits && (
            <>
              <DropDown
                control={form.control}
                label={t("transactions.filter.dateRange")}
                name="rangePreset"
                options={[
                  { label: t("transactions.filter.month"), value: "Month" },
                  { label: t("transactions.filter.year"), value: "Year" },
                  { label: t("transactions.filter.thisWeek"), value: "ThisWeek" },
                  { label: t("transactions.filter.today"), value: "Today" },
                  { label: t("transactions.filter.custom"), value: "Custom" }
                ]}
              />
              <DatePicker
                control={form.control}
                disabled={rangePreset === "Today" || rangePreset === "ThisWeek"}
                label={t("transactions.filter.fromDate")}
                mode={rangePreset === "Month" ? "month" : rangePreset === "Year" ? "year" : "date"}
                name="fromDate"
              />
              <DatePicker
                control={form.control}
                disabled={rangePreset === "Today" || rangePreset === "ThisWeek"}
                label={t("transactions.filter.toDate")}
                minDate={fromDate}
                mode={rangePreset === "Month" ? "month" : rangePreset === "Year" ? "year" : "date"}
                name="toDate"
              />
              <MultiSelect
                control={form.control}
                label={t("transactions.filter.transactionType")}
                name="types"
                options={[
                  { label: t("transactions.cashFlow"), value: "CashFlow" },
                  { label: t("transactions.bankAccount"), value: "BankAccount" },
                  { label: t("transactions.transfer"), value: "Transfer" },
                  { label: t("transactions.exchange"), value: "Exchange" }
                ]}
              />
              <Text control={form.control} label={t("transactions.filter.findDescription")} name="description" />
            </>
          )}
        </Stack>
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton
            key="reset"
            onClick={() => {
              form.reset(getDefaultFilterValues());
            }}
            variant="outlined"
          >
            {t("transactions.filter.reset")}
          </ActionButton>,
          <ActionButton key="apply" form={formId} type="submit">
            {t("transactions.filter.apply")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}
