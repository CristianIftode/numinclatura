import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export interface Brand {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface BrandsState {
  list: Brand[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: BrandsState = {
  list: [],
  status: 'idle',
  error: null,
};

export const fetchBrands = createAsyncThunk('brands/fetchBrands', async () => {
  const response = await axios.get('/api/brands');
  return response.data;
});

export const addBrand = createAsyncThunk('brands/addBrand', async (name: string) => {
  const response = await axios.post('/api/brands', { name });
  return response.data;
});

export const updateBrand = createAsyncThunk(
  'brands/updateBrand',
  async ({ id, name }: { id: number; name: string }) => {
    const response = await axios.put(`/api/brands/${id}`, { name });
    return response.data;
  }
);

export const deleteBrand = createAsyncThunk('brands/deleteBrand', async (id: number) => {
  await axios.delete(`/api/brands/${id}`);
  return id;
});

const brandsSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(addBrand.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        const index = state.list.findIndex((brand) => brand.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.list = state.list.filter((brand) => brand.id !== action.payload);
      });
  },
});

export default brandsSlice.reducer; 