import { format, isSameDay } from "date-fns";

export const getFormattedRangeDate = function (
  range: { startDate: Date | null; endDate: Date | null },
  fullMonth = false,
) {
  const startDate = range?.startDate;
  const endDate = range?.endDate;

  const isDateExist = endDate && startDate;
  let dateString = "";

  if (isDateExist) {
    const isSameDate = isSameDay(endDate, startDate);
    dateString = isSameDate
      ? `During ${format(startDate, fullMonth ? "MMMM" : "MMM")} ${format(startDate, "d")}`
      : `${format(startDate, fullMonth ? "MMMM" : "MMM")} ${format(startDate, "d")} - ${format(endDate, fullMonth ? "MMMM" : "MMM")} ${format(endDate, "d")}`;
  }

  return dateString;
};
