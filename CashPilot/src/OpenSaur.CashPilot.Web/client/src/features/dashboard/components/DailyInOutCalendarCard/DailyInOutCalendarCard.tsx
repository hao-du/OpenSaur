import { ChevronLeft, ChevronRight } from "lucide-react";
import { Grid, IconButton, MenuItem, Paper, Select, Skeleton, Stack, Tooltip } from "@mui/material";
import { BodyText } from "../../../../components/atoms/BodyText";
import { PageTitleText } from "../../../../components/atoms/PageTitleText";
import { AppIcon } from "../../../../components/icons/AppIcon";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { TagDefinitionResponse } from "../../../tags/dtos/TagDto";
import { calendarCellSx, calendarPaperSx, monthNames } from "./DailyInOutCalendarCard.styles";
import { formatCurrencyAmount, useDailyInOutCalendarCardLogic } from "./hooks/useDailyInOutCalendarCardLogic";

type Props = {
  title: string;
  defaultCurrencyCode?: string;
  defaultMakerTagName?: string;
  markerOptions: TagDefinitionResponse[];
};

export function DailyInOutCalendarCard({ title, defaultCurrencyCode, defaultMakerTagName, markerOptions }: Props) {
  const {
    availableMarkerOptions,
    calendarMonth,
    calendarWeeks,
    calendarYear,
    handleDayClick,
    handleNextPeriod,
    handlePreviousPeriod,
    isLoading,
    isMarkerMode,
    monthLabel,
    monthlyLabel,
    periodLabel,
    selectedMode,
    setCalendarMonth,
    setCalendarYear,
    setSelectedMode,
    weekDays: calendarWeekDays,
    yearLabel,
    yearOptions,
  } = useDailyInOutCalendarCardLogic({ defaultCurrencyCode, defaultMakerTagName, markerOptions });
  const { t } = useSettings();

  const skeletonRows = 6;

  return (
    <Paper
      variant="outlined"
      sx={calendarPaperSx}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 1, md: 2 }}
        sx={{ alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between", mb: 1 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", minWidth: 0, width: "100%" }}>
          <PageTitleText variant="h6" sx={{ fontSize: { xs: "1.15rem", sm: "1.35rem" }, lineHeight: 1.15, wordBreak: "break-word" }}>
            {title}
          </PageTitleText>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: { xs: "flex-start", md: "flex-end" },
            width: "100%",
          }}
        >
          <Select
            size="small"
            value={selectedMode}
            onChange={e => setSelectedMode(e.target.value)}
            sx={{ minWidth: { xs: 110, sm: 140 } }}
          >
            <MenuItem value="__monthly__">{monthlyLabel}</MenuItem>
            {availableMarkerOptions.map(option => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </Select>

          <Tooltip title={isMarkerMode ? t("dashboard.previousPeriod") : t("dashboard.previousMonth")}>
            <span>
              <IconButton aria-label={isMarkerMode ? t("dashboard.previousPeriod") : t("dashboard.previousMonth")} onClick={isMarkerMode ? handlePreviousPeriod : undefined} size="small">
                <AppIcon icon={ChevronLeft} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={isMarkerMode ? t("dashboard.nextPeriod") : t("dashboard.nextMonth")}>
            <span>
              <IconButton aria-label={isMarkerMode ? t("dashboard.nextPeriod") : t("dashboard.nextMonth")} onClick={isMarkerMode ? handleNextPeriod : undefined} size="small">
                <AppIcon icon={ChevronRight} />
              </IconButton>
            </span>
          </Tooltip>

          {isMarkerMode ? (
            <BodyText
              sx={{
                fontWeight: 600,
                minWidth: { xs: "100%", sm: 160 },
                textAlign: { xs: "left", sm: "center" },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {periodLabel}
            </BodyText>
          ) : (
            <>
              <Select
                size="small"
                value={calendarMonth.toString()}
                onChange={e => setCalendarMonth(Number(e.target.value))}
                sx={{ minWidth: { xs: 96, sm: 120 } }}
              >
                {monthNames.map((m, index) => (
                  <MenuItem key={m} value={(index + 1).toString()}>{`${monthLabel} ${m}`}</MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                value={calendarYear.toString()}
                onChange={e => setCalendarYear(Number(e.target.value))}
                sx={{ minWidth: { xs: 92, sm: 120 } }}
              >
                {yearOptions.map(y => (
                  <MenuItem key={y} value={y.toString()}>{`${yearLabel} ${y}`}</MenuItem>
                ))}
              </Select>
            </>
          )}
        </Stack>
      </Stack>

      <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
        {isLoading ? (
          <Grid container columns={7} spacing={{ xs: 0.35, sm: 0.5 }}>
            {calendarWeekDays.map(day => (
              <Grid key={day} size={1}>
                <Skeleton height={24} width="55%" sx={{ mx: "auto" }} />
              </Grid>
            ))}

            {Array.from({ length: skeletonRows * 7 }).map((_, index) => (
              <Grid key={index} size={1}>
                <Stack sx={(theme) => calendarCellSx(theme, true)}>
                  <Skeleton height={24} width="18%" />
                  <Stack spacing={0.35} sx={{ mt: "auto" }}>
                    <Skeleton height={12} width="72%" />
                    <Skeleton height={12} width="64%" />
                  </Stack>
                </Stack>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container columns={7} spacing={{ xs: 0.35, sm: 0.5 }}>
            {calendarWeekDays.map(day => (
              <Grid key={day} size={1}>
                <BodyText sx={{ fontWeight: 600, textAlign: "center" }}>{day}</BodyText>
              </Grid>
            ))}

            {calendarWeeks.flatMap((week, weekIndex) =>
              week.map((cell, cellIndex) => {
                const key = `${weekIndex}-${cellIndex}-${cell.dayLabel ?? "blank"}`;
                const isClickable = cell.dateIso != null;
                const cellTooltip = cell.isInRange ? (
                  <Stack spacing={0.25} sx={{ fontSize: 12 }}>
                    <BodyText sx={{ color: "common.white", fontSize: 12, fontWeight: 700 }}>
                      {cell.dayLabel != null ? `${t("dashboard.day")} ${cell.dayLabel}` : t("dashboard.day")}
                    </BodyText>
                    <BodyText sx={{ color: "common.white", fontSize: 12 }}>
                      {`${t("dashboard.income")}: ${formatCurrencyAmount(cell.income)}`}
                    </BodyText>
                    <BodyText sx={{ color: "common.white", fontSize: 12 }}>
                      {`${t("dashboard.outcome")}: ${formatCurrencyAmount(cell.outcome)}`}
                    </BodyText>
                  </Stack>
                ) : null;

                return (
                  <Grid key={key} size={1}>
                    <Tooltip
                      arrow
                      disableInteractive={false}
                      title={cellTooltip}
                      placement="top"
                    >
                      <Stack
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : -1}
                        onClick={isClickable ? () => handleDayClick(cell.dateIso!) : undefined}
                        onKeyDown={isClickable ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleDayClick(cell.dateIso!);
                          }
                        } : undefined}
                        sx={(theme) => ({
                          ...calendarCellSx(theme, cell.isInRange),
                          cursor: isClickable ? "pointer" : "default",
                          outline: "none",
                          "&:focus-visible": isClickable ? { boxShadow: `0 0 0 2px ${theme.palette.primary.main}33` } : undefined,
                        })}
                      >
                        <BodyText sx={{ fontWeight: 700, color: cell.isInRange ? "text.primary" : "text.disabled" }}>
                          {cell.dayLabel ?? ""}
                        </BodyText>
                        {cell.isInRange ? (
                          <Stack spacing={0}>
                            <BodyText sx={{ color: "success.main", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                              {formatCurrencyAmount(cell.income)}
                            </BodyText>
                            <BodyText sx={{ color: "error.main", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                              {formatCurrencyAmount(cell.outcome)}
                            </BodyText>
                          </Stack>
                        ) : null}
                      </Stack>
                    </Tooltip>
                  </Grid>
                );
              }),
            )}
          </Grid>
        )}
      </Stack>
    </Paper>
  );
}
