import { fixed } from './shared';
import type { Link } from './shared';

export function geo(coordinates: string): Link {
  const parts = coordinates.split(',').map((part) => part.trim());
  if (parts.length !== 2 || parts.some((part) => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(part))) {
    throw new TypeError('Coordinates must be latitude,longitude.');
  }
  const [latitude, longitude] = parts.map(Number);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new RangeError('Latitude must be between -90 and 90; longitude between -180 and 180.');
  }
  return fixed(`geo:${latitude},${longitude}`);
}
