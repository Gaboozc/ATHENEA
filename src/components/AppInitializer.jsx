import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAchievements } from '../store/slices/statsSlice';

/**
 * AppInitializer - Initialize app features on mount
 * This runs once when the app starts
 */
const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const achievements = useSelector((state) => state.stats?.achievements);

  useEffect(() => {
    // Initialize achievements if they don't exist
    if (!achievements || achievements.length === 0) {
      dispatch(initializeAchievements());
    }
  }, [dispatch, achievements]);

  return children;
};

export default AppInitializer;
