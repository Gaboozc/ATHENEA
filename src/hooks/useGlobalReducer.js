import { useDispatch, useSelector } from 'react-redux';

export const useGlobalReducer = () => {
  const dispatch = useDispatch();
  const store = useSelector((state) => state);

  return { store, dispatch };
};

export default useGlobalReducer;