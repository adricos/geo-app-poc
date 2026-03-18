export type MapControlsViewState = 'icon' | 'styles' | 'full';

export function cycleMapControlsViewState(
  prev: MapControlsViewState,
): MapControlsViewState {
  if (prev === 'icon') return 'styles';
  if (prev === 'styles') return 'full';
  return 'icon';
}

export function mapControlsChevronDirection(
  viewState: MapControlsViewState,
): 'right' | 'down' | 'up' {
  if (viewState === 'icon') return 'right';
  if (viewState === 'styles') return 'down';
  return 'up';
}
