import { createSlice } from '@reduxjs/toolkit';

const CategoriesSlice = createSlice({
  name: 'categories',
  initialState: { data: null, loading: false },
  reducers: {
    setCategories: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    },
    setLoading: (state) => {
      state.loading = true;
    },
  },
});

export const { setCategories, setLoading } = CategoriesSlice.actions;
export default CategoriesSlice.reducer;