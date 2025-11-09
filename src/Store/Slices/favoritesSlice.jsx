import { createSlice } from '@reduxjs/toolkit';

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: {}, // Structure: { [productId]: boolean }
    lastUpdated: null,
  },
  reducers: {
    toggleFavorite: (state, action) => {
      const { productId, isFavorite } = action.payload;
      state.items[productId] = isFavorite;
      state.lastUpdated = new Date().toISOString();
    },
    setFavorite: (state, action) => {
      const { productId, isFavorite } = action.payload;
      state.items[productId] = isFavorite;
      state.lastUpdated = new Date().toISOString();
    },
    removeFavorite: (state, action) => {
      const productId = action.payload;
      delete state.items[productId];
      state.lastUpdated = new Date().toISOString();
    },
    setFavorites: (state, action) => {
      state.items = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    clearFavorites: (state) => {
      state.items = {};
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const { 
  toggleFavorite, 
  setFavorite, 
  removeFavorite, 
  setFavorites, 
  clearFavorites 
} = favoritesSlice.actions;

export default favoritesSlice.reducer;