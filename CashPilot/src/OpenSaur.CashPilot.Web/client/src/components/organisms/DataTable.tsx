import { Paper, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { ListStatePanel } from "../atoms/ListStatePanel";
import { layoutStyles } from "../../infrastructure/theme/theme";

type DataTableColumn = {
  key: string;
  label: ReactNode;
  align?: "inherit" | "left" | "center" | "right" | "justify";
  sx?: SxProps<Theme>;
};

type DataTableProps<T> = {
  columns: DataTableColumn[];
  emptySubtitle: string;
  emptyTitle: string;
  isLoading: boolean;
  items: T[];
  loadingLabel: string;
  renderRow: (item: T, index: number) => ReactNode;
};

export function DataTable<T>({
  columns,
  emptySubtitle,
  emptyTitle,
  isLoading,
  items,
  loadingLabel,
  renderRow,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <ListStatePanel
        emptySubtitle={emptySubtitle}
        emptyTitle={emptyTitle}
        loadingLabel={loadingLabel}
        state="loading"
      />
    );
  }

  if (items.length === 0) {
    return (
      <ListStatePanel
        emptySubtitle={emptySubtitle}
        emptyTitle={emptyTitle}
        loadingLabel={loadingLabel}
        state="empty"
      />
    );
  }

  return (
    <Paper elevation={0} sx={layoutStyles.borderedPanelScrollable}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align}
                sx={[
                  layoutStyles.tableHeaderCell,
                  ...(Array.isArray(column.sx)
                    ? column.sx
                    : column.sx != null
                      ? [column.sx]
                      : []),
                ]}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => renderRow(item, index))}
        </TableBody>
      </Table>
    </Paper>
  );
}
