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
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-xs font-medium text-gray-700 dark:text-gray-300",
        nav: "space-x-1 flex items-center",
        button_previous:
          "absolute left-1 h-6 w-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors opacity-70 hover:opacity-100",
        button_next:
          "absolute right-1 h-6 w-6 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors opacity-70 hover:opacity-100",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-gray-400 dark:text-gray-600 rounded-md w-8 font-normal text-[10px] text-center",
        week: "flex w-full mt-1",
        day: "h-8 w-8 text-center text-xs p-0 relative",
        day_button:
          "h-8 w-8 p-0 font-normal rounded-md text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors aria-selected:opacity-100 flex items-center justify-center w-full",
        selected:
          "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 focus:bg-gray-900 dark:focus:bg-white rounded-md",
        today:
          "bg-gray-100 dark:bg-gray-800 font-medium",
        outside: "text-gray-300 dark:text-gray-700 opacity-50",
        disabled: "text-gray-300 dark:text-gray-700 opacity-40 cursor-not-allowed hover:bg-transparent",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft size={12} strokeWidth={2} />
          ) : (
            <ChevronRight size={12} strokeWidth={2} />
          ),
      }}
      {...props}
    />
  );
}
