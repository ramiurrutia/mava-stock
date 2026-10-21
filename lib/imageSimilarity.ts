// Small color thumbnails compare composition, independently of file name or encoding.
export const fingerprintSize = 16;
export const fingerprintLength = fingerprintSize * fingerprintSize * 3;

export function imageDifference(a: string, b: string) {
  if (a.length !== fingerprintLength || b.length !== fingerprintLength) {
    return Infinity;
  }
  let squared = 0;
  for (let index = 0; index < a.length; index++) {
    squared += (a.charCodeAt(index) - b.charCodeAt(index)) ** 2;
  }
  return Math.sqrt(squared / a.length) / 255;
}

export const similarImageThreshold = 0.085;
