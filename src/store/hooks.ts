import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, AppStore, RootState } from './index';
import { selectIsCreator } from './slices/authSlice';

/** Typed hooks — use these instead of plain `useDispatch` / `useSelector`. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

/** Convenience: is the signed-in user a creator? */
export const useIsCreator = () => useAppSelector(selectIsCreator);
