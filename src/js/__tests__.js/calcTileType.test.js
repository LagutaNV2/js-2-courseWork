import { calcTileType } from '../utils';

describe('calcTileType', () => {
  const boardSize = 4;

  test('returns "top-left" for the top-left corner', () => {
    const result = calcTileType(0, boardSize);
    expect(result).toBe('top-left');
  });

  test('returns "top-right" for the top-right corner', () => {
    const result = calcTileType(3, boardSize);
    expect(result).toBe('top-right');
  });

  test('returns "top" for a top edge cell (not corner)', () => {
    const result = calcTileType(1, boardSize);
    expect(result).toBe('top');
  });

  test('returns "bottom-left" for the bottom-left corner', () => {
    const result = calcTileType(12, boardSize);
    expect(result).toBe('bottom-left');
  });

  test('returns "bottom-right" for the bottom-right corner', () => {
    const result = calcTileType(15, boardSize);
    expect(result).toBe('bottom-right');
  });

  test('returns "bottom" for a bottom edge cell (not corner)', () => {
    const result = calcTileType(13, boardSize);
    expect(result).toBe('bottom');
  });

  test('returns "left" for a left edge cell (not corner)', () => {
    const result = calcTileType(4, boardSize);
    expect(result).toBe('left');
  });

  test('returns "right" for a right edge cell (not corner)', () => {
    const result = calcTileType(7, boardSize);
    expect(result).toBe('right');
  });

  test('returns "center" for a center cell', () => {
    const result = calcTileType(5, boardSize);
    expect(result).toBe('center');
  });
});
