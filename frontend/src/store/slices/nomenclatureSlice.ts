import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { NomenclatureItem, CountryInfo } from '../../types/nomenclature';

interface Seasonality {
  template_id: number | null;
  template_name?: string;
  start_date: string | null;
  end_date: string | null;
}

interface AddNomenclaturePayload {
  name: string;
  countries: Omit<CountryInfo, 'id' | 'country_name'>[];
}

interface UpdateNomenclaturePayload extends AddNomenclaturePayload {
  id: number;
}

interface NomenclatureState {
  list: NomenclatureItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: NomenclatureState = {
  list: [],
  status: 'idle',
  error: null,
};

export const fetchNomenclature = createAsyncThunk(
  'nomenclature/fetchAll',
  async () => {
    const response = await axios.get('/api/nomenclature');
    return response.data;
  }
);

export const addNomenclature = createAsyncThunk(
  'nomenclature/add',
  async (data: AddNomenclaturePayload) => {
    const response = await axios.post('/api/nomenclature', data);
    return response.data;
  }
);

export const updateNomenclature = createAsyncThunk(
  'nomenclature/update',
  async (data: UpdateNomenclaturePayload) => {
    const response = await axios.put(`/api/nomenclature/${data.id}`, data);
    return response.data;
  }
);

export const deleteNomenclature = createAsyncThunk(
  'nomenclature/delete',
  async (id: number) => {
    await axios.delete(`/api/nomenclature/${id}`);
    return id;
  }
);

const nomenclatureSlice = createSlice({
  name: 'nomenclature',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNomenclature.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNomenclature.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchNomenclature.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || null;
      })
      .addCase(addNomenclature.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateNomenclature.fulfilled, (state, action) => {
        const index = state.list.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteNomenclature.fulfilled, (state, action) => {
        state.list = state.list.filter(item => item.id !== action.payload);
      });
  },
});

export default nomenclatureSlice.reducer; 