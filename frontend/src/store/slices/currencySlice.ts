import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Currency {
  id: number;
  name: string;
  code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurrencyState {
  items: Currency[];
  loading: boolean;
  error: string | null;
}

const initialState: CurrencyState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCurrencies = createAsyncThunk(
  'currencies/fetchAll',
  async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:3001/api/currencies', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
);

export const addCurrency = createAsyncThunk(
  'currencies/add',
  async (currency: { name: string; code: string; is_default: boolean }) => {
    const token = localStorage.getItem('token');
    const response = await axios.post('http://localhost:3001/api/currencies', currency, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
);

export const updateCurrency = createAsyncThunk(
  'currencies/update',
  async ({ id, data }: { id: number; data: { name: string; code: string; is_default: boolean } }) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`http://localhost:3001/api/currencies/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
);

export const deleteCurrency = createAsyncThunk(
  'currencies/delete',
  async (id: number) => {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:3001/api/currencies/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return id;
  }
);

const currencySlice = createSlice({
  name: 'currencies',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch currencies
      .addCase(fetchCurrencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка при загрузке валют';
      })
      // Add currency
      .addCase(addCurrency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCurrency.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(addCurrency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка при добавлении валюты';
      })
      // Update currency
      .addCase(updateCurrency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCurrency.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateCurrency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка при обновлении валюты';
      })
      // Delete currency
      .addCase(deleteCurrency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCurrency.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload);
      })
      .addCase(deleteCurrency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка при удалении валюты';
      });
  },
});

export const { clearError } = currencySlice.actions;
export default currencySlice.reducer; 