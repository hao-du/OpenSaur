import { useRef, useState } from "react";
import { WandSparkles } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { ExchangeDraft } from "../dtos/TransactionPageState";
import { ExchangeForm } from "./ExchangeForm";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { TransactionType } from "../dtos/TransactionPageState";

type Props = {
  editingExchange?: ExchangeDraft | null;
  isOpen: boolean;
  onClose: () => void;
  currencies: CurrencyDto[];
  isAutoTagging?: boolean;
  onAutoTag?: (description: string, existingTags: string[], transactionType: TransactionType) => Promise<string[]>;
  onSubmit: (payload: {
    exchangeRate?: number;
    exchangeDate: string;
    outLeg: { currencyId: string; amount: number; description?: string };
    inLeg: { currencyId: string; amount: number; description?: string };
    description?: string;
    tags: string[];
    transactionItems: Array<{ id?: string; name: string; amount: number }>;
  }) => Promise<void>;
  onUpdate?: (id: string, payload: {
    exchangeRate?: number;
    exchangeDate: string;
    outLeg: { currencyId: string; amount: number; description?: string };
    inLeg: { currencyId: string; amount: number; description?: string };
    description?: string;
    tags: string[];
    isActive: boolean;
    transactionItems: Array<{ id?: string; name: string; amount: number }>;
  }) => Promise<void>;
};

export function ExchangeFormDrawer({
  editingExchange,
  isOpen,
  onClose,
  currencies,
  isAutoTagging = false,
  onAutoTag,
  onSubmit,
  onUpdate,
}: Props) {
  const { t } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isSubmitting || isAutoTagging;
  const autoTagActionRef = useRef<(() => Promise<void>) | null>(null);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingExchange == null ? t("transactions.createExchange") : t("transactions.editExchange")}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody>
        <ExchangeForm
          formId="exchange-form"
          currencies={currencies}
          initialValue={editingExchange == null ? null : editingExchange}
          isAutoTagging={isAutoTagging}
          isSubmitting={isSubmitting}
          onAutoTag={onAutoTag}
          onAutoTagActionChange={handler => {
            autoTagActionRef.current = handler;
          }}
          onSubmit={async payload => {
            setIsSubmitting(true);
            try {
              if (editingExchange != null && onUpdate != null) {
                await onUpdate(editingExchange.id, { ...payload, isActive: editingExchange.isActive });
              } else {
                await onSubmit(payload);
              }
              onClose();
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
          <ActionButton key="submit" disabled={isBusy} form="exchange-form" type="submit">
            {isBusy ? t("action.working") : editingExchange == null ? t("transactions.createExchange") : t("transactions.saveExchange")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}
