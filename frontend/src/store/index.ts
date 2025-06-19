import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import nomenclatureReducer from './slices/nomenclatureSlice';
import countriesReducer from './slices/countriesSlice';
import currencyReducer from './slices/currencySlice';
import currencyRatesReducer from './slices/currencyRatesSlice';
import seasonalityReducer from './slices/seasonalitySlice';
import countryControlReducer from './slices/countryControlSlice';
import brandsReducer from './slices/brandsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    nomenclature: nomenclatureReducer,
    countries: countriesReducer,
    currency: currencyReducer,
    currencyRates: currencyRatesReducer,
    seasonality: seasonalityReducer,
    countryControl: countryControlReducer,
    brands: brandsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 