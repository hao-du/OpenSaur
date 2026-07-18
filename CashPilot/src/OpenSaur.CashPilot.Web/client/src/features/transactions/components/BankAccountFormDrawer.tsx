import { useRef, useState } from "react";
import { WandSparkles } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { CreateBankAccountFormRequestDto, SaveBankAccountFormRequestDto, UpdateBankAccountFormRequestDto } from "../dtos/TransactionDto";
import { BankAccountForm } from "./BankAccountForm";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { TransactionType } from "../dtos/TransactionPageState";

type Props = {
  editingBankAccount?: SaveBankAccountFormRequestDto | null;
  isOpen: boolean;
  onClose: () => void;
  banks: BankDto[];
  currencies: CurrencyDto[];
  isAutoTagging?: boolean;
  onAutoTag?: (description: string, existingTags: string[], transactionType: TransactionType) => Promise<string[]>;
  onCreate: (payload: CreateBankAccountFormRequestDto) => Promise<void>;
  onEdit?: (id: string, payload: UpdateBankAccountFormRequestDto) => Promise<void>;
};

export function BankAccountFormDrawer({
  editingBankAccount,
  isOpen,
  onClose,
  banks,
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
      title={editingBankAccount == null ? t("transactions.createBankAccount") : t("transactions.editBankAccount")}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody>
        <BankAccountForm
          key={`${isOpen ? "open" : "closed"}-${editingBankAccount?.id ?? "new"}`}
          formId="bank-account-form"
          banks={banks}
          currencies={currencies}
          initialValue={editingBankAccount}
          isAutoTagging={isAutoTagging}
          onAutoTag={onAutoTag}
          onAutoTagActionChange={handler => {
            autoTagActionRef.current = handler;
          }}
          onSubmit={async (payload) => {
            setIsSubmitting(true);
            try {
              if (editingBankAccount?.id && onEdit != null) {
                await onEdit(editingBankAccount.id, payload as UpdateBankAccountFormRequestDto);
              } else {
                await onCreate(payload as CreateBankAccountFormRequestDto);
              }
              onClose();
            } finally {
              setIsSubmitting(false);
            }
          }}
          isSubmitting={isSubmitting}
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
          <ActionButton key="submit" disabled={isBusy} form="bank-account-form" type="submit">
            {isBusy ? t("action.working") : editingBankAccount == null ? t("transactions.create") : t("transactions.save")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}
