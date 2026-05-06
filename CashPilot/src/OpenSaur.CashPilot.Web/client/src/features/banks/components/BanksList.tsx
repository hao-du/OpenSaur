import { Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { LinkButton } from "../../../components/atoms/LinkButton";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import type { BankDto } from "../dtos/BankDto";

type BanksListProps = {
  banks: BankDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  onDelete: (bank: BankDto) => void;
  onEdit: (bank: BankDto) => void;
};

export function BanksList({
  banks,
  isLoading,
  isSubmitting,
  onDelete,
  onEdit
}: BanksListProps) {
  if (isLoading) {
    return (
      <Paper elevation={0} sx={layoutStyles.loadingPanel}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={28} />
          <BodyText>Loading banks...</BodyText>
        </Stack>
      </Paper>
    );
  }

  if (banks.length === 0) {
    return (
      <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
        <Stack spacing={1.5}>
          <PageTitleText variant="h6">No banks found</PageTitleText>
          <BodyText>Create a bank to start managing your bank master data.</BodyText>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={layoutStyles.borderedPanelScrollable}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Short Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Is Default</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {banks.map(bank => (
            <TableRow hover key={bank.id}>
              <TableCell>{bank.name}</TableCell>
              <TableCell>{bank.shortName}</TableCell>
              <TableCell>{bank.description ?? "(None)"}</TableCell>
              <TableCell>
                {bank.isDefault ? (
                  <Chip
                    label="Yes"
                    size="small"
                    sx={{
                      bgcolor: "primary.main",
                      color: "white"
                    }}
                  />
                ) : (
                  <Chip
                    label="No"
                    size="small"
                    variant="outlined"
                  />
                )}
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <LinkButton
                    disabled={isSubmitting}
                    onClick={() => {
                      onEdit(bank);
                    }}
                  >
                    Edit
                  </LinkButton>
                  <LinkButton
                    color="error"
                    disabled={isSubmitting}
                    onClick={() => {
                      onDelete(bank);
                    }}
                  >
                    Delete
                  </LinkButton>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
