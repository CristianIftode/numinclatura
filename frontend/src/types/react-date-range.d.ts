declare module 'react-date-range' {
  export interface Range {
    startDate?: Date;
    endDate?: Date;
    key: string;
  }

  export interface RangeKeyDict {
    [key: string]: Range;
  }

  export interface DateRangeProps {
    onChange?: (ranges: RangeKeyDict) => void;
    ranges: Range[];
    months?: number;
    direction?: 'horizontal' | 'vertical';
    moveRangeOnFirstSelection?: boolean;
    editableDateInputs?: boolean;
    locale?: Locale;
    className?: string;
  }

  export const DateRange: React.FC<DateRangeProps>;
} 