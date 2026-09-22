import { CenteredCardLayout } from "../../../components/layouts/CenteredCardLayout";
import { useSettings } from "../../settings/provider/SettingProvider";

export function PrepareSessionPage() {
  const { t } = useSettings();

  return (
    <CenteredCardLayout
      description={t("auth.prepareDescription")}
      title={t("auth.prepareTitle")}
    >
      <div>
        <p>{t("auth.prepareGenericMessage")}</p>
      </div>
    </CenteredCardLayout>
  );
}
