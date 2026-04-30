import { Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { BodyText } from "../../../components/atoms/BodyText";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useSettings } from "../../settings/provider/SettingProvider";

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { t } = useSettings();

  return (
    <DefaultLayout
      subtitle={t("forbidden.subtitle")}
      title={t("forbidden.title")}
    >
      <Stack spacing={3}>
        <BodyText color="text.primary">
          {t("forbidden.body")}
        </BodyText>
        <BodyText>
          {t("forbidden.help")}
        </BodyText>
        <Stack direction={{ md: "row", xs: "column" }} spacing={2}>
          <ActionButton
            onClick={() => {
              navigate("/", { replace: true });
            }}
          >
            {t("action.backToDashboard")}
          </ActionButton>
          <ActionButton
            onClick={() => {
              navigate("/", { replace: true });
            }}
            variant="outlined"
          >
            {t("action.returnToDashboard")}
          </ActionButton>
        </Stack>
      </Stack>
    </DefaultLayout>
  );
}
