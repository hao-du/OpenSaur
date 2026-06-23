import { useRef, useState } from "react";
import { WandSparkles } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { TransactionType, TransferMovementDraft } from "../dtos/TransactionPageState";
import type { CreateTransferFormRequestDto, UpdateTransferFormRequestDto } from "../dtos/TransactionDto";
import { TransferForm } from "./TransferForm";
import { useSettings } from "../../settings/provider/SettingProvider";

type Props = {
  editingMovement?: TransferMovementDraft | null;
  isOpen: boolean;
  onClose: () => void;
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  isAutoTagging?: boolean;
  onAutoTag?: (description: string, existingTags: string[], transactionType: TransactionType) => Promise<string[]>;
  onCreate: (payload: CreateTransferFormRequestDto) => Promise<void>;
  onEdit?: (id: string, payload: UpdateTransferFormRequestDto) => Promise<void>;
};

export function TransferFormDrawer({
  editingMovement,
  isOpen,
  onClose,
  counterparties,
  currencies,
  isAutoTagging = false,
  onAutoTag,
  onCreate,
  onEdit,
}: Props) {
  const { t } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isSubmitting || isAutoTagging;
  const autoTagActionRef = useRef<(() => Promise<void>) | null>(null);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingMovement == null ? t("transactions.createTransfer") : t("transactions.editTransfer")}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody>
        <TransferForm
          key={`${isOpen ? "open" : "closed"}-${editingMovement?.id ?? "new"}`}
          formId="transfer-form"
          counterparties={counterparties}
          currencies={currencies}
          isAutoTagging={isAutoTagging}
          isSubmitting={isSubmitting}
          onAutoTag={onAutoTag}
          onAutoTagActionChange={handler => {
            autoTagActionRef.current = handler;
          }}
          onCompleted={onClose}
          movementInitialValue={editingMovement == null ? null : {
            amount: editingMovement.amount,
            counterpartyId: editingMovement.counterpartyId,
            currencyId: editingMovement.currencyId,
            description: editingMovement.description,
            dueDate: editingMovement.dueDate,
            id: editingMovement.id,
            status: editingMovement.status,
            tags: editingMovement.tags,
            transactionDate: editingMovement.transactionDate,
            transferType: editingMovement.transferType,
          }}
          movementInitialDetails={editingMovement?.details ?? []}
          movementInitialTransactionItems={editingMovement?.transactionItems ?? []}
          onSave={async (payload) => {
            setIsSubmitting(true);
            try {
              if (editingMovement != null && onEdit != null) {
                await onEdit(editingMovement.id, payload as UpdateTransferFormRequestDto);
              } else {
                await onCreate(payload as CreateTransferFormRequestDto);
              }
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton
            key="autoTag"
            disabled={isBusy || onAutoTag == null}
            onClick={() => {
              void autoTagActionRef.current?.();
            }}
            startIcon={<WandSparkles size={16} />}
            variant="outlined"
          >
            {isBusy ? t("action.working") : t("transactions.autoTag")}
          </ActionButton>,
          <ActionButton key="submit" disabled={isBusy} form="transfer-form" type="submit">
            {isBusy ? t("action.working") : t("transactions.save")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}
