import { createSlice } from '@reduxjs/toolkit'

export const itemInteractionSlice = createSlice({
  name: 'itemInteraction',
  initialState: {
    selectedItemIndexes: [],
    hoveredItemIndex: null,
  },
  reducers: {
    setSelectedItemIndexes: (state, action) => {
      state.selectedItemIndexes = action.payload;
    },
    setHoveredItemIndex: (state, action) => {
      state.hoveredItemIndex = action.payload;
    },
  },
})

export const { setSelectedItemIndexes, setHoveredItemIndex } = itemInteractionSlice.actions

export default itemInteractionSlice.reducer
