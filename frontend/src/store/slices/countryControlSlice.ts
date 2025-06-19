import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from '../../config/axios';

interface CountryControl {
  id: number;
  name: string; // Название страны
  is_controlled: boolean;
}

interface CountryControlState {
  items: CountryControl[];
  loading: boolean;
  error: string | null;
}

const initialState: CountryControlState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCountryControl = createAsyncThunk(
  'countryControl/fetchCountryControl',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/country-control');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateCountryControl = createAsyncThunk(
  'countryControl/updateCountryControl',
  async ({ countryId, is_controlled }: { countryId: number; is_controlled: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/country-control/${countryId}`, { is_controlled });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const countryControlSlice = createSlice({
  name: 'countryControl',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountryControl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCountryControl.fulfilled, (state, action: PayloadAction<CountryControl[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCountryControl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateCountryControl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCountryControl.fulfilled, (state, action: PayloadAction<CountryControl>) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateCountryControl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default countryControlSlice.reducer; 