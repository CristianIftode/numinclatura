import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import currencyReducer from './slices/currencySlice';
import currencyRatesReducer from './slices/currencyRatesSlice';
import countriesReducer from './slices/countriesSlice';
import seasonalityReducer from './slices/seasonalitySlice';
import nomenclatureReducer from './slices/nomenclatureSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    currencies: currencyReducer,
    currencyRates: currencyRatesReducer,
    countries: countriesReducer,
    seasonality: seasonalityReducer,
    nomenclature: nomenclatureReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 