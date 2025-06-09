import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface CurrencyRate {
  id: number;
  currency_id: number;
  rate_date: string;
  rate_value: number;
  created_at: string;
  updated_at: string;
  currency_name?: string;
  currency_code?: string;
}

export interface CurrencyRateState {
  items: CurrencyRate[];
  loading: boolean;
  error: string | null;
}

interface CurrencyRateForm {
  currency_id: number;
  rate_date: string;
  rate_value: number;
}

const initialState: CurrencyRateState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCurrencyRates = createAsyncThunk(
  'currencyRates/fetchAll',
  async () => {
    const response = await axios.get<CurrencyRate[]>('/api/currency-rates');
    return response.data;
  }
);

export const addCurrencyRate = createAsyncThunk(
  'currencyRates/add',
  async (data: CurrencyRateForm) => {
    const response = await axios.post<CurrencyRate>('/api/currency-rates', data);
    return response.data;
  }
);

export const updateCurrencyRate = createAsyncThunk(
  'currencyRates/update',
  async ({ id, data }: { id: number; data: CurrencyRateForm }) => {
    const response = await axios.put<CurrencyRate>(`/api/currency-rates/${id}`, data);
    return response.data;
  }
);

export const deleteCurrencyRate = createAsyncThunk(
  'currencyRates/delete',
  async (id: number) => {
    await axios.delete(`/api/currency-rates/${id}`);
    return id;
  }
);

const currencyRatesSlice = createSlice({
  name: 'currencyRates',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencyRates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencyRates.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCurrencyRates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch currency rates';
      })
      .addCase(addCurrencyRate.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateCurrencyRate.fulfilled, (state, action) => {
        const index = state.items.findIndex(rate => rate.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteCurrencyRate.fulfilled, (state, action) => {
        state.items = state.items.filter(rate => rate.id !== action.payload);
      });
  },
});

export default currencyRatesSlice.reducer; 