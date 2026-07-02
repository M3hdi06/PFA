import { useCallback, useEffect, useRef, useState } from 'react';

import API_URL from '../config/api';

const STORAGE_PREFIX = 'prepfa.recommendations';
const PAGE_SIZE = 3;

const getStoredPosition = (userId) => {
  if (!userId) return { activeIndex: 0, loadedCount: 0 };

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${userId}`);
    if (!raw) return { activeIndex: 0, loadedCount: 0 };

    const parsed = JSON.parse(raw);
    return {
      activeIndex: Number(parsed.activeIndex) || 0,
      loadedCount: Number(parsed.loadedCount) || 0,
    };
  } catch {
    return { activeIndex: 0, loadedCount: 0 };
  }
};

const persistPosition = (userId, activeIndex, loadedCount) => {
  if (!userId) return;

  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}:${userId}`,
      JSON.stringify({ activeIndex, loadedCount })
    );
  } catch {
    // Ignore storage errors in non-blocking mode.
  }
};

export const useRecommendations = ({ userId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [visibleRecommendations, setVisibleRecommendations] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const sentinelRef = useRef(null);

  const loadMoreRecommendations = useCallback(async () => {
    if (!userId || isLoadingMore || !recommendations.length || loadedCount >= recommendations.length) {
      return;
    }

    setIsLoadingMore(true);

    const nextCount = Math.min(recommendations.length, loadedCount + PAGE_SIZE);
    const nextItems = recommendations.slice(0, nextCount);

    setVisibleRecommendations(nextItems);
    setLoadedCount(nextCount);
    setHasMore(nextCount < recommendations.length);
    setIsLoadingMore(false);
  }, [isLoadingMore, loadedCount, recommendations, userId]);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) {
      setRecommendations([]);
      setVisibleRecommendations([]);
      setLoadedCount(0);
      setActiveIndex(0);
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/recommendations/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors du chargement des recommandations');
      }

      const items = data.data || [];
      const persisted = getStoredPosition(userId);
      const targetCount = Math.max(
        PAGE_SIZE,
        Math.ceil((persisted.activeIndex + 1) / PAGE_SIZE) * PAGE_SIZE
      );
      const initialCount = Math.min(items.length, targetCount);

      setRecommendations(items);
      setVisibleRecommendations(items.slice(0, initialCount));
      setLoadedCount(initialCount);
      setHasMore(initialCount < items.length);
      setActiveIndex(Math.min(persisted.activeIndex, Math.max(items.length - 1, 0)));
    } catch (err) {
      setError(err.message || 'Impossible de charger les recommandations.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    persistPosition(userId, activeIndex, loadedCount);
  }, [activeIndex, loadedCount, userId]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isLoadingMore || isLoading) return;

    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreRecommendations();
        }
      },
      { rootMargin: '220px' }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadMoreRecommendations]);

  return {
    recommendations,
    visibleRecommendations,
    activeIndex,
    setActiveIndex,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    sentinelRef,
    loadMoreRecommendations,
  };
};

export default useRecommendations;
