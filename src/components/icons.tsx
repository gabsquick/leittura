// Ícones SVG recriados a partir do handoff de design.
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

export function SearchIcon({ size = 17, color = '#e8dfd0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 17 17" fill="none">
      <Circle cx="7" cy="7" r="5.2" stroke={color} strokeWidth={1.6} />
      <Path d="M11 11l4 4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 16, color = '#e8dfd0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M4 4l8 8M12 4l-8 8" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function ArrowLeftIcon({ size = 18, color = '#e8dfd0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M11 3.5L5.5 9l5.5 5.5M5.5 9H15" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShelfIcon({ size = 20, color = '#1c1917' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M4 6.5h12M4 10h12M4 13.5h8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 18, color = '#f4f1ea' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M9 3.5v11M3.5 9h11" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

export function ProfileIcon({ size = 20, color = '#a8a29e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="7" r="3.2" stroke={color} strokeWidth={1.7} />
      <Path d="M4 16c0-3 2.7-5 6-5s6 2 6 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 11, color = '#1c1917' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 11 11" fill="none">
      <Path d="M1.5 5.8L4 8.2L9.5 2.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GearIcon({ size = 17, color = '#e8dfd0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="2.4" stroke={color} strokeWidth={1.5} />
      <Path
        d="M9 1.8v1.7M9 14.5v1.7M16.2 9h-1.7M3.5 9H1.8M14.1 3.9l-1.2 1.2M5.1 12.9l-1.2 1.2M14.1 14.1l-1.2-1.2M5.1 5.1L3.9 3.9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function FlameIcon({ size = 16, color = '#c87a5e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 1.5c.6 2.2-1.4 3-1.4 5 0 .8.5 1.4 1.2 1.6-.1-.6.2-1.3.8-1.7.2 1.4 2 2.1 2 4.1A3.6 3.6 0 018 14a3.6 3.6 0 01-3.6-3.6c0-3.3 3.6-4.2 3.6-8.9z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = 18, color = '#57534e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M5 7.5a4 4 0 018 0c0 3.5 1 4.5 1 4.5H4s1-1 1-4.5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M7.5 14.5a1.6 1.6 0 003 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function MoonIcon({ size = 18, color = '#57534e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M14.5 10.2A5.8 5.8 0 017.8 3.5a5.8 5.8 0 102.9 8.7 5.8 5.8 0 003.8-2z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BookmarkIcon({ size = 18, color = '#57534e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M5 3.5h8v11l-4-2.6-4 2.6z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InfoIcon({ size = 18, color = '#57534e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Circle cx="9" cy="9" r="6.5" stroke={color} strokeWidth={1.5} />
      <Path d="M9 8.2v3.6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx="9" cy="5.9" r="0.5" fill={color} stroke={color} strokeWidth={0.7} />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 16, color = '#a8a29e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M6 4l4 4-4 4" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PencilIcon({ size = 15, color = '#e8dfd0' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M11 2.5l2.5 2.5M3 13l-.6 1.6 1.6-.6 9-9L11 2.5 3 10.5z" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DocIcon({ size = 18, color = '#57534e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M5 2.5h5l3 3v10H5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path d="M10 2.5v3h3M7 9.5h4M7 12h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrashIcon({ size = 18, color = '#57534e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M3.5 5h11M7 5V3.8h4V5M5 5l.6 8.4a1 1 0 001 .9h4.8a1 1 0 001-.9L13 5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
