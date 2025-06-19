export interface DayRange {
  startDayOfYear: number;
  endDayOfYear: number;
  markupPercentage?: number | null;
  tolerancePercentage?: number | null;
}

export interface Seasonality {
  template_id: number | null;
  template_name?: string;
  periods: DayRange[];
}

export interface CountryInfo {
  id?: number;
  country_id: number;
  country_name?: string;
  brand_id?: number;
  brand_name?: string;
  sku_code: string;
  type: 'regular' | 'exclusive';
  is_new_until: string | null;
  seasonality: Seasonality;
}

export interface NomenclatureItem {
  id: number;
  name: string;
  countries: CountryInfo[];
  created_at?: string;
  updated_at?: string;
} 