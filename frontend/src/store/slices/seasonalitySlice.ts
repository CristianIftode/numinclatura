import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

interface DatePeriod {
  startDate: string;
  endDate: string;
}

interface SeasonalityTemplate {
  id: number;
  name: string;
  periods: DatePeriod[];
  created_at: string;
  updated_at: string;
}

interface SeasonalityState {
  list: SeasonalityTemplate[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SeasonalityState = {
  list: [],
  status: 'idle',
  error: null,
};

export const fetchSeasonality = createAsyncThunk('seasonality/fetchSeasonality', async () => {
  const response = await axios.get('/api/seasonality');
  return response.data;
});

export const addSeasonality = createAsyncThunk(
  'seasonality/addSeasonality',
  async ({ name, periods }: { name: string; periods: DatePeriod[] }) => {
    const response = await axios.post('/api/seasonality', { name, periods });
    return response.data;
  }
);

export const updateSeasonality = createAsyncThunk(
  'seasonality/updateSeasonality',
  async ({ id, name, periods }: { id: number; name: string; periods: DatePeriod[] }) => {
    const response = await axios.put(`/api/seasonality/${id}`, { name, periods });
    return response.data;
  }
);

export const deleteSeasonality = createAsyncThunk(
  'seasonality/deleteSeasonality',
  async (id: number) => {
    await axios.delete(`/api/seasonality/${id}`);
    return id;
  }
);

const seasonalitySlice = createSlice({
  name: 'seasonality',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeasonality.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSeasonality.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchSeasonality.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(addSeasonality.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateSeasonality.fulfilled, (state, action) => {
        const index = state.list.findIndex((template) => template.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteSeasonality.fulfilled, (state, action) => {
        state.list = state.list.filter((template) => template.id !== action.payload);
      });
  },
});

export default seasonalitySlice.reducer; 