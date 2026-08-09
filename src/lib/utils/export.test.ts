import { describe, it, expect } from 'vitest';
import { escapeCSV } from '$lib/utils/export';

describe('export.ts 工具函数', () => {
  describe('escapeCSV', () => {
    it('不含特殊字符时原样返回', () => {
      expect(escapeCSV('简单文本')).toBe('简单文本');
    });

    it('含逗号时用引号包裹', () => {
      const result = escapeCSV('文本,含逗号');
      expect(result.startsWith('"')).toBe(true);
      expect(result.endsWith('"')).toBe(true);
    });

    it('含双引号时转义', () => {
      const result = escapeCSV('文本"含"引号');
      expect(result).toContain('""');
    });

    it('含换行时用引号包裹', () => {
      const result = escapeCSV('第一行\n第二行');
      expect(result.startsWith('"')).toBe(true);
      expect(result.endsWith('"')).toBe(true);
    });

    it('含逗号和引号同时出现时正确处理', () => {
      const result = escapeCSV('hello, "world"');
      expect(result).toContain('"hello, ""world"""');
    });
  });
});
