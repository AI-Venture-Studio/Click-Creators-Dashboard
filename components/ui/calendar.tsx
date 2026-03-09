"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-3",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-xs font-medium text-gray-700 dark:text-gray-300",
        nav: "space-x-1 flex items-center",
        nav_button:
          "h-6 w-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors opacity-70 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-gray-400 dark:text-gray-600 rounded-md w-8 font-normal text-[10px] text-center",
        row: "flex w-full mt-1",
        cell: "h-8 w-8 text-center text-xs p-0 relative",
        day: "h-8 w-8 p-0 font-normal rounded-md text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors aria-selected:opacity-100 flex items-center justify-center w-full",
        day_selected:
          "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 focus:bg-gray-900 dark:focus:bg-white rounded-md",
        day_today:
          "bg-gray-100 dark:bg-gray-800 font-medium",
        day_outside: "text-gray-300 dark:text-gray-700 opacity-50",
        day_disabled: "text-gray-300 dark:text-gray-700 opacity-40 cursor-not-allowed hover:bg-transparent",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft size={12} strokeWidth={2} />,
        IconRight: () => <ChevronRight size={12} strokeWidth={2} />,
      }}
      {...props}
    />
  );
}
