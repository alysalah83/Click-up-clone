import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export const getformatDate = function (receivedDate: Date) {
  const date = new Date(receivedDate);

  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true });
  else if (isYesterday(date)) return `Yesterday at ${format(date, "h:mm a")}`;
  else return `${format(date, "MMMM d, yyyy")} at ${format(date, "h:mm a")}`;
};
