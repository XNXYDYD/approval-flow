import { describe, it, expect } from 'vitest';
import { calcDuration, formatDuration } from './duration';

describe('calcDuration', () => {
  it('正常计算：3 小时', () => {
    expect(calcDuration('2026-08-07T18:00', '2026-08-07T21:00')).toBe(3);
  });

  it('跨天计算：10 小时', () => {
    expect(calcDuration('2026-08-07T20:00', '2026-08-08T06:00')).toBe(10);
  });

  it('半小时精度：1.5 小时', () => {
    expect(calcDuration('2026-08-07T18:00', '2026-08-07T19:30')).toBe(1.5);
  });

  it('结束早于开始：返回 0', () => {
    expect(calcDuration('2026-08-07T21:00', '2026-08-07T18:00')).toBe(0);
  });

  it('结束等于开始：返回 0', () => {
    expect(calcDuration('2026-08-07T18:00', '2026-08-07T18:00')).toBe(0);
  });

  it('空值：返回 0', () => {
    expect(calcDuration('', '2026-08-07T18:00')).toBe(0);
    expect(calcDuration('2026-08-07T18:00', '')).toBe(0);
    expect(calcDuration('', '')).toBe(0);
  });
});

describe('formatDuration', () => {
  it('整小时', () => {
    expect(formatDuration(3)).toBe('3小时');
  });

  it('带分钟', () => {
    expect(formatDuration(3.5)).toBe('3小时30分钟');
  });

  it('零值', () => {
    expect(formatDuration(0)).toBe('0小时');
  });

  it('负值', () => {
    expect(formatDuration(-1)).toBe('0小时');
  });
});
