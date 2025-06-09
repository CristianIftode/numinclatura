import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import currencyReducer from './slices/currencySlice';
import currencyRatesReducer from './slices/currencyRatesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    currencies: currencyReducer,
    currencyRates: currencyRatesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 