import userReducer from './Slices/userSlice';
import maintenanceReducer from './Slices/maintenanceSlice';
import languageReducer from './Slices/languageSlice';
import mainDataReducer from './Slices/mainDataSlice';
import taxTypeSlice from './Slices/taxTypeSlice';
import cartSlice from './Slices/cartSlice';
import orderTypeSlice from './Slices/orderTypeSlice';
import favoritesSlice from './Slices/favoritesSlice'; // Add this import
import categoriesReducer from './Slices/CategoriesSlice';
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

const reducers = combineReducers({
  user: userReducer,
  maintenance: maintenanceReducer,
  language: languageReducer,
  mainData: mainDataReducer,
  cart: cartSlice,
  taxType: taxTypeSlice,
  orderType: orderTypeSlice,
  favorites: favoritesSlice, // Add favorites reducer
  categories: categoriesReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user', 'mainData', 'maintenance', 'language', 'favorites'], // Add 'favorites' to persisted state
};

const persistedReducer = persistReducer(persistConfig, reducers);

export const StoreApp = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export const persistor = persistStore(StoreApp);