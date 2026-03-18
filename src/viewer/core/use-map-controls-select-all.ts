import { useCallback, useLayoutEffect, useRef } from 'react';

export function useMapControlsSelectAll(
  layersVisible: boolean[],
  setAllLayersVisibility: (visible: boolean) => void,
) {
  const visibleCount = layersVisible.filter(Boolean).length;
  const n = layersVisible.length;
  const allVisible = n > 0 && visibleCount === n;
  const noneVisible = visibleCount === 0;
  const someVisible = !allVisible && !noneVisible;

  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (el) el.indeterminate = someVisible;
  }, [someVisible]);

  const handleSelectAllChange = useCallback(() => {
    setAllLayersVisibility(allVisible ? false : true);
  }, [allVisible, setAllLayersVisibility]);

  return {
    selectAllCheckboxRef,
    allVisible,
    noneVisible,
    someVisible,
    handleSelectAllChange,
  };
}
