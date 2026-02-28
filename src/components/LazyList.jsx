import React, { useState, useEffect, useRef, useCallback } from 'react';
import './LazyList.css';

/**
 * LazyList - Virtual scrolling list with lazy loading
 * Optimizes performance for large lists by rendering only visible items
 */
const LazyList = ({ 
  items = [], 
  renderItem, 
  itemHeight = 80, 
  loadMoreThreshold = 5,
  onLoadMore,
  hasMore = false,
  loading = false,
  emptyMessage = 'No items found',
  EmptyComponent = null,
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  // Calculate visible items based on scroll position
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, clientHeight } = containerRef.current;
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.ceil((scrollTop + clientHeight) / itemHeight) + 5; // Buffer

    setVisibleRange({ start: Math.max(0, start - 5), end });

    // Trigger load more if near bottom
    const scrollBottom = scrollTop + clientHeight;
    const scrollHeight = containerRef.current.scrollHeight;
    
    if (scrollHeight - scrollBottom < itemHeight * loadMoreThreshold && hasMore && !loading) {
      onLoadMore?.();
    }
  }, [itemHeight, loadMoreThreshold, hasMore, loading, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Render visible items only
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  if (items.length === 0 && !loading) {
    return (
      <div className="lazy-list-empty">
        {EmptyComponent || <p>{emptyMessage}</p>}
      </div>
    );
  }

  return (
    <div className="lazy-list-container" ref={containerRef}>
      <div 
        className="lazy-list-content"
        style={{ height: `${items.length * itemHeight}px`, position: 'relative' }}
      >
        {visibleItems.map((item, index) => {
          const actualIndex = visibleRange.start + index;
          return (
            <div
              key={item.id || actualIndex}
              className="lazy-list-item"
              style={{
                position: 'absolute',
                top: `${actualIndex * itemHeight}px`,
                width: '100%',
                height: `${itemHeight}px`,
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
      
      {loading && (
        <div className="lazy-list-loader">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export default LazyList;
