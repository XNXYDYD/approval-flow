import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  errors,
  reportError,
  markErrorHandled,
  clearErrors,
  safeExecute,
  safeExecuteAsync,
  getUnhandledCount
} from '$lib/stores/error';

describe('error.ts 错误管理', () => {
  beforeEach(() => {
    clearErrors();
  });

  describe('reportError', () => {
    it('记录 Error 对象', () => {
      reportError(new Error('测试错误'));
      const list = get(errors);
      expect(list.length).toBe(1);
      expect(list[0].message).toBe('测试错误');
      expect(list[0].handled).toBe(false);
    });

    it('记录非 Error 值', () => {
      reportError('字符串错误');
      const list = get(errors);
      expect(list.length).toBe(1);
      expect(list[0].message).toBe('字符串错误');
    });

    it('支持自定义描述', () => {
      reportError(new Error('错误'), { description: '自定义描述' });
      const list = get(errors);
      expect(list[0].description).toBe('自定义描述');
    });

    it('返回唯一 ID', () => {
      const id1 = reportError(new Error('错误1'));
      const id2 = reportError(new Error('错误2'));
      expect(id1).not.toBe(id2);
    });
  });

  describe('markErrorHandled', () => {
    it('标记错误为已处理', () => {
      const id = reportError(new Error('测试'));
      markErrorHandled(id);
      const list = get(errors);
      expect(list[0].handled).toBe(true);
    });
  });

  describe('clearErrors', () => {
    it('清空所有错误', () => {
      reportError(new Error('错误1'));
      reportError(new Error('错误2'));
      expect(get(errors).length).toBe(2);
      clearErrors();
      expect(get(errors).length).toBe(0);
    });
  });

  describe('getUnhandledCount', () => {
    it('返回未处理错误数量', () => {
      const id1 = reportError(new Error('错误1'));
      reportError(new Error('错误2'));
      expect(getUnhandledCount()).toBe(2);
      markErrorHandled(id1);
      expect(getUnhandledCount()).toBe(1);
    });
  });

  describe('safeExecute', () => {
    it('成功执行返回结果', () => {
      const result = safeExecute(() => 42, '错误消息');
      expect(result).toBe(42);
    });

    it('异常时返回 undefined', () => {
      const result = safeExecute(() => {
        throw new Error('执行失败');
      }, '操作描述');
      expect(result).toBeUndefined();
    });

    it('异常时返回默认值', () => {
      const result = safeExecute(
        () => {
          throw new Error('失败');
        },
        '描述',
        'fallback'
      );
      expect(result).toBe('fallback');
    });
  });

  describe('safeExecuteAsync', () => {
    it('成功执行返回结果', async () => {
      const result = await safeExecuteAsync(async () => 'success', '描述');
      expect(result).toBe('success');
    });

    it('异常时返回 undefined', async () => {
      const result = await safeExecuteAsync(async () => {
        throw new Error('异步失败');
      });
      expect(result).toBeUndefined();
    });

    it('异常时返回默认值', async () => {
      const result = await safeExecuteAsync(
        async () => {
          throw new Error('失败');
        },
        '描述',
        0
      );
      expect(result).toBe(0);
    });
  });
});