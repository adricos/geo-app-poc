export function MapControlsLayersIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
    >
      <polygon points='12 2 2 7 12 12 22 7 12 2' />
      <polyline points='2 17 12 22 22 17' />
    </svg>
  );
}

export function MapControlsChevronIcon({
  direction,
  className,
}: {
  direction: 'right' | 'down' | 'up';
  className: string;
}) {
  return (
    <span className={className} data-direction={direction}>
      <svg
        width='8'
        height='8'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden
      >
        <polyline points='9 18 15 12 9 6' />
      </svg>
    </span>
  );
}
