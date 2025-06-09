export interface SeasonalityPeriod {
  start_date: string | null;
  end_date: string | null;
}

export interface Seasonality {
  template_id: number | null;
  template_name?: string;
  periods: SeasonalityPeriod[];
}

export interface CountryInfo {
  id?: number;
  country_id: number;
  country_name?: string;
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