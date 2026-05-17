import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { MultiSelect } from "../../../components/atoms/MultiSelect";
import { Text } from "../../../components/atoms/Text";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";

export type TransactionFilterValues = {
  description: string;
  fromDate: string;
  rangePreset: "Month" | "Year" | "ThisWeek" | "Today" | "Custom";
  toDate: string;
  types: Array<"CashFlow" | "BankAccount" | "Transfer" | "Exchange">;
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
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const getCurrentMonthRange = () => ({
    fromDate: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    toDate: `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`
  });
  const getDefaultFilterValues = (): TransactionFilterValues => ({
    description: "",
    fromDate: getCurrentMonthRange().fromDate,
    rangePreset: "Month",
    toDate: getCurrentMonthRange().toDate,
    types: ["CashFlow", "BankAccount", "Transfer", "Exchange"]
  });
  const getCurrentYearRange = () => ({
    fromDate: `${year}-01-01`,
    toDate: `${year}-12-31`
  });
  const getTodayRange = () => {
    const today = formatDate(now);
    return { fromDate: today, toDate: today };
  };
  const getThisWeekRange = () => {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const from = new Date(year, month, now.getDate() + mondayOffset);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return { fromDate: formatDate(from), toDate: formatDate(to) };
  };
  const form = useForm<TransactionFilterValues>({
    defaultValues: initialValues
  });
  const rangePreset = form.watch("rangePreset");

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    form.reset(initialValues);
  }, [form, initialValues, isOpen]);

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
  }, [form, rangePreset]);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title="Filter Transactions">
      <Stack
        component="form"
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
            fromDate = `${values.fromDate}-01-01`;
            toDate = `${values.toDate}-12-31`;
          }

          onApply({
            ...values,
            description: values.description.trim(),
            fromDate,
            toDate
          });
        })}
        spacing={2}
        sx={layoutStyles.drawerBody}
      >
        <DropDown
          control={form.control}
          label="Date Range"
          name="rangePreset"
          options={[
            { label: "Month", value: "Month" },
            { label: "Year", value: "Year" },
            { label: "This Week", value: "ThisWeek" },
            { label: "Today", value: "Today" },
            { label: "Custom", value: "Custom" }
          ]}
        />
        <DatePicker
          control={form.control}
          disabled={rangePreset === "Today" || rangePreset === "ThisWeek"}
          label="From Date"
          mode={rangePreset === "Month" ? "month" : rangePreset === "Year" ? "year" : "date"}
          name="fromDate"
        />
        <DatePicker
          control={form.control}
          disabled={rangePreset === "Today" || rangePreset === "ThisWeek"}
          label="To Date"
          mode={rangePreset === "Month" ? "month" : rangePreset === "Year" ? "year" : "date"}
          name="toDate"
        />
        <MultiSelect
          control={form.control}
          label="Transaction Type"
          name="types"
          options={[
            { label: "CashFlow", value: "CashFlow" },
            { label: "BankAccount", value: "BankAccount" },
            { label: "Transfer", value: "Transfer" },
            { label: "Exchange", value: "Exchange" }
          ]}
        />
        <Text control={form.control} label="Find Description" name="description" />
        <Stack direction="row" spacing={1} sx={layoutStyles.formFooterRow}>
          <ActionButton type="submit">Apply</ActionButton>
          <ActionButton
            onClick={() => {
              form.reset(getDefaultFilterValues());
            }}
            variant="outlined"
          >
            Reset
          </ActionButton>
        </Stack>
      </Stack>
    </DrawerPanel>
  );
}
