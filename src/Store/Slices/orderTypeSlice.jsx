import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orderType: null, // 'delivery' or 'takeaway'
  selectedAddressId: null,
  selectedBranchId: null,
};

const orderTypeSlice = createSlice({
  name: 'orderType',
  initialState,
  reducers: {
    setOrderType(state, action) {
      state.orderType = action.payload;
      // Save to localStorage
      localStorage.setItem('orderType', action.payload);
    },
    setSelectedAddress(state, action) {
      state.selectedAddressId = action.payload;
      // Save to localStorage
      localStorage.setItem('selectedAddressId', action.payload ? action.payload.toString() : '');
    },
    setSelectedBranch(state, action) {
      state.selectedBranchId = action.payload;
      // Save to localStorage
      localStorage.setItem('selectedBranchId', action.payload ? action.payload.toString() : '');
    },
    clearOrderType(state) {
      state.orderType = null;
      state.selectedAddressId = null;
      state.selectedBranchId = null;
      // Clear from localStorage
      localStorage.removeItem('orderType');
      localStorage.removeItem('selectedAddressId');
      localStorage.removeItem('selectedBranchId');
    },
  },
});

export const { setOrderType, setSelectedAddress, setSelectedBranch, clearOrderType } = orderTypeSlice.actions;
export default orderTypeSlice.reducer;