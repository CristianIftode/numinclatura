import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Country {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface CountriesState {
  list: Country[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CountriesState = {
  list: [],
  status: 'idle',
  error: null,
};

export const fetchCountries = createAsyncThunk('countries/fetchCountries', async () => {
  const response = await axios.get('/api/countries');
  return response.data;
});

export const addCountry = createAsyncThunk('countries/addCountry', async (name: string) => {
  const response = await axios.post('/api/countries', { name });
  return response.data;
});

export const updateCountry = createAsyncThunk(
  'countries/updateCountry',
  async ({ id, name }: { id: number; name: string }) => {
    const response = await axios.put(`/api/countries/${id}`, { name });
    return response.data;
  }
);

export const deleteCountry = createAsyncThunk('countries/deleteCountry', async (id: number) => {
  await axios.delete(`/api/countries/${id}`);
  return id;
});

const countriesSlice = createSlice({
  name: 'countries',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountries.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(addCountry.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateCountry.fulfilled, (state, action) => {
        const index = state.list.findIndex((country) => country.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteCountry.fulfilled, (state, action) => {
        state.list = state.list.filter((country) => country.id !== action.payload);
      });
  },
});

export default countriesSlice.reducer; 