import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "../../app/providers/AppProviders";
import { useLocalizedFormatting } from "../localization/formatting";
import { usePreferences } from "./PreferenceProvider";

function PreferenceProbe() {
  const { locale, setPreferences, t } = usePreferences();
  const { formatDate } = useLocalizedFormatting();

  return (
    <div>
      <div data-testid="locale">{locale}</div>
      <div data-testid="translated">{t("settings.title")}</div>
      <div data-testid="formatted">
        {formatDate("2026-03-29T08:30:00.000Z", {
          day: "2-digit",
          month: "long",
          timeZone: "Asia/Saigon",
          year: "numeric"
        })}
      </div>
      <button
        onClick={() => {
          setPreferences({
            locale: "vi",
            timeZone: "Asia/Saigon"
          });
        }}
        type="button"
      >
        Switch
      </button>
    </div>
  );
}

describe("PreferenceProvider", () => {
  it("updates translations and Intl formatting when the locale changes", async () => {
    render(
      <AppProviders>
        <PreferenceProbe />
      </AppProviders>
    );

    expect(screen.getByTestId("translated").textContent).toBe("Settings");
    expect(screen.getByTestId("formatted").textContent).toContain("March");

    fireEvent.click(screen.getByRole("button", { name: "Switch" }));

    expect((await screen.findByTestId("translated")).textContent).toBe("Cài đặt");
    expect(screen.getByTestId("formatted").textContent).toMatch(/tháng|Tháng/i);
  });
});
