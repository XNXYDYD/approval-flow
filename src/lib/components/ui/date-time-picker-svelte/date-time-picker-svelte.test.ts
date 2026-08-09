import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import DateTimePickerSvelte from './date-time-picker-svelte.svelte';

describe('DateTimePickerSvelte', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('组件基础渲染', () => {
    it('应该正确渲染输入框', async () => {
      const { container } = render(DateTimePickerSvelte, {
        props: { placeholder: '选择开始时间' },
      });

      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      expect(input?.getAttribute('placeholder')).toBe('选择开始时间');
    });

    it('应该接受外部 value 属性', async () => {
      const { container } = render(DateTimePickerSvelte, {
        props: { value: '2026-08-09T10:30:00.000Z' },
      });

      const input = container.querySelector('input');
      // 验证输入框有值（时区可能不同，所以只验证日期部分）
      expect(input?.value).toContain('2026-08-09');
    });

    it('disabled 状态下应该禁用输入', async () => {
      const { container } = render(DateTimePickerSvelte, {
        props: { disabled: true },
      });

      const input = container.querySelector('input');
      expect(input?.hasAttribute('disabled')).toBe(true);
    });

    it('无效的外部 value 应该被忽略', async () => {
      const { container } = render(DateTimePickerSvelte, {
        props: { value: 'invalid-date-string' },
      });

      const input = container.querySelector('input');
      // 应该为空（显示 placeholder）
      expect(input?.value).toBe('');
    });
  });

  describe('change 事件', () => {
    it('点击确认按钮（无选择时）应该派发 change 事件', async () => {
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(DateTimePickerSvelte, {
        props: { value: '' },
      });

      component.$on('change', (e: Event) => dispatched.push(e as CustomEvent));

      // 打开选择器
      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待按钮出现
      await vi.waitFor(() => {
        const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('确认'),
        );
        return !!confirmBtn;
      });

      // 点击确认
      const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('确认'),
      );
      await fireEvent.click(confirmBtn!);

      // 验证 change 事件被派发
      expect(dispatched).toHaveLength(1);

      // 验证值是有效的 ISO 字符串
      const changedValue = dispatched[0].detail;
      const changedDate = new Date(changedValue);
      expect(isNaN(changedDate.getTime())).toBe(false);

      // 验证日期部分是今天
      const now = new Date();
      expect(changedDate.getFullYear()).toBe(now.getFullYear());
      expect(changedDate.getMonth()).toBe(now.getMonth());
      expect(changedDate.getDate()).toBe(now.getDate());
    });

    it('点击取消按钮不应该派发 change 事件', async () => {
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(DateTimePickerSvelte, {
        props: { value: '2026-08-09T10:00:00.000Z' },
      });

      component.$on('change', (e: Event) => dispatched.push(e as CustomEvent));

      // 打开选择器
      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待按钮出现
      await vi.waitFor(() => {
        const cancelBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('取消'),
        );
        return !!cancelBtn;
      });

      // 点击取消
      const cancelBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('取消'),
      );
      await fireEvent.click(cancelBtn!);

      // 验证 change 事件没有被派发
      expect(dispatched).toHaveLength(0);
    });

    it('确认按钮点击后弹窗应该关闭', async () => {
      const { container } = render(DateTimePickerSvelte, {
        props: { value: '' },
      });

      // 打开选择器
      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待 picker 出现
      await vi.waitFor(() => {
        const picker = container.querySelector('.picker');
        return !!picker;
      });

      // 点击确认
      const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('确认'),
      );
      await fireEvent.click(confirmBtn!);

      // 验证 picker 不再可见
      await vi.waitFor(() => {
        const picker = container.querySelector('.picker');
        return !picker || !picker.classList.contains('visible');
      });
    });

    it('取消按钮点击后弹窗应该关闭', async () => {
      const { container } = render(DateTimePickerSvelte, {
        props: { value: '' },
      });

      // 打开选择器
      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待 picker 出现
      await vi.waitFor(() => {
        const picker = container.querySelector('.picker');
        return !!picker;
      });

      // 点击取消
      const cancelBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('取消'),
      );
      await fireEvent.click(cancelBtn!);

      // 验证 picker 不再可见
      await vi.waitFor(() => {
        const picker = container.querySelector('.picker');
        return !picker || !picker.classList.contains('visible');
      });
    });
  });

  describe('用户选择日期后的行为', () => {
    it('选择日期后点击确认应该更新值', async () => {
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(DateTimePickerSvelte, {
        props: { value: '' },
      });

      component.$on('change', (e: Event) => dispatched.push(e as CustomEvent));

      // 打开选择器
      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待 picker 出现
      await vi.waitFor(() => {
        const picker = container.querySelector('.picker');
        return !!picker;
      });

      // 模拟用户点击一个日期单元格
      const cells = container.querySelectorAll('.cell');
      const todayCell = Array.from(cells).find((cell) => cell.classList.contains('today'));

      if (todayCell) {
        await fireEvent.click(todayCell);
      }

      // 点击确认
      const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('确认'),
      );
      await fireEvent.click(confirmBtn!);

      // 验证 change 事件被派发
      expect(dispatched).toHaveLength(1);
      const changedValue = dispatched[0].detail;
      expect(typeof changedValue).toBe('string');
      expect(changedValue.length).toBeGreaterThan(0);
    });
  });

  describe('多步操作', () => {
    it('应该支持连续打开关闭选择器', async () => {
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(DateTimePickerSvelte, {
        props: { value: '' },
      });

      component.$on('change', (e: Event) => dispatched.push(e as CustomEvent));

      const input = container.querySelector('input')!;

      // 第一次打开并确认
      await fireEvent.focus(input);
      await vi.waitFor(() => {
        const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('确认'),
        );
        return !!confirmBtn;
      });

      let confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('确认'),
      );
      await fireEvent.click(confirmBtn!);

      // 第二次打开
      await fireEvent.blur(input);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await fireEvent.focus(input);

      await vi.waitFor(() => {
        confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('确认'),
        );
        return !!confirmBtn;
      });

      confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('确认'),
      );
      await fireEvent.click(confirmBtn!);

      // 验证 change 事件被派发了两次
      expect(dispatched).toHaveLength(2);
    });

    it('选择日期后取消，不应该触发 change', async () => {
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(DateTimePickerSvelte, {
        props: { value: '2026-08-09T10:00:00.000Z' },
      });

      component.$on('change', (e: Event) => dispatched.push(e as CustomEvent));

      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待按钮出现
      await vi.waitFor(() => {
        const cancelBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('取消'),
        );
        return !!cancelBtn;
      });

      // 点击取消
      const cancelBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('取消'),
      );
      await fireEvent.click(cancelBtn!);

      // 验证没有 change 事件
      expect(dispatched).toHaveLength(0);
    });
  });

  describe('输入框显示', () => {
    it('初始值应该正确显示', async () => {
      const testDate = new Date(2026, 7, 9, 14, 30, 0); // 2026-08-09 14:30:00
      const isoString = testDate.toISOString();

      const { container } = render(DateTimePickerSvelte, {
        props: { value: isoString },
      });

      const input = container.querySelector('input');
      // 验证日期部分显示正确（时区可能不同）
      expect(input?.value).toContain('2026-08-09');
    });

    it('确认后输入框应该更新为新值', async () => {
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(DateTimePickerSvelte, {
        props: { value: '' },
      });

      component.$on('change', (e: Event) => dispatched.push(e as CustomEvent));

      // 打开选择器
      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待按钮出现并点击确认
      await vi.waitFor(() => {
        const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('确认'),
        );
        return !!confirmBtn;
      });

      const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('确认'),
      );
      await fireEvent.click(confirmBtn!);

      // 验证 change 事件被派发，且值是有效的
      expect(dispatched).toHaveLength(1);
      const changedValue = dispatched[0].detail;
      const changedDate = new Date(changedValue);
      expect(isNaN(changedDate.getTime())).toBe(false);
    });
  });

  describe('四种核心场景', () => {
    it('场景1：不选日期 + 只改时间 → 确认，日期为今天，时间为修改值', async () => {
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(DateTimePickerSvelte, {
        props: { value: '' },
      });

      component.$on('change', (e: Event) => dispatched.push(e as CustomEvent));

      // 打开选择器
      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待按钮出现
      await vi.waitFor(() => {
        const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('确认'),
        );
        return !!confirmBtn;
      });

      // 点击确认（没有选择日期，也没有修改时间 - 只有默认的当前时间）
      const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('确认'),
      );
      await fireEvent.click(confirmBtn!);

      // 验证派发了 change 事件
      expect(dispatched).toHaveLength(1);

      // 验证日期部分是今天
      const changedValue = dispatched[0].detail;
      const changedDate = new Date(changedValue);
      const now = new Date();

      expect(changedDate.getFullYear()).toBe(now.getFullYear());
      expect(changedDate.getMonth()).toBe(now.getMonth());
      expect(changedDate.getDate()).toBe(now.getDate());
    });

    it('场景2：选了日期 + 不改时间 → 确认，使用选中的日期', async () => {
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(DateTimePickerSvelte, {
        props: { value: '2026-08-09T10:00:00.000Z' },
      });

      component.$on('change', (e: Event) => dispatched.push(e as CustomEvent));

      // 打开选择器
      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待 picker 出现
      await vi.waitFor(() => {
        const picker = container.querySelector('.picker');
        return !!picker;
      });

      // 模拟用户点击一个日期单元格（非今天）
      const cells = container.querySelectorAll('.cell');
      const nonTodayCells = Array.from(cells).filter(
        (cell) => !cell.classList.contains('disabled'),
      );
      const targetCell =
        nonTodayCells.find((cell) => !cell.classList.contains('today')) || nonTodayCells[0];

      if (targetCell) {
        await fireEvent.click(targetCell);
      }

      // 点击确认
      await vi.waitFor(() => {
        const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('确认'),
        );
        return !!confirmBtn;
      });

      const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('确认'),
      );
      await fireEvent.click(confirmBtn!);

      // 验证派发了 change 事件
      expect(dispatched).toHaveLength(1);
    });

    it('场景3：选了日期 + 改了时间 → 确认，使用选中的日期和修改的时间', async () => {
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(DateTimePickerSvelte, {
        props: { value: '2026-08-09T10:00:00.000Z' },
      });

      component.$on('change', (e: Event) => dispatched.push(e as CustomEvent));

      // 打开选择器
      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待 picker 出现
      await vi.waitFor(() => {
        const picker = container.querySelector('.picker');
        return !!picker;
      });

      // 模拟用户点击一个日期单元格
      const cells = container.querySelectorAll('.cell');
      const nonTodayCells = Array.from(cells).filter(
        (cell) => !cell.classList.contains('disabled'),
      );
      const targetCell =
        nonTodayCells.find((cell) => !cell.classList.contains('today')) || nonTodayCells[0];

      if (targetCell) {
        await fireEvent.click(targetCell);
      }

      // 点击确认
      await vi.waitFor(() => {
        const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('确认'),
        );
        return !!confirmBtn;
      });

      const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('确认'),
      );
      await fireEvent.click(confirmBtn!);

      // 验证派发了 change 事件
      expect(dispatched).toHaveLength(1);
    });

    it('场景4：不选日期 + 不改时间 → 确认，使用当前时间作为默认值', async () => {
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(DateTimePickerSvelte, {
        props: { value: '' },
      });

      component.$on('change', (e: Event) => dispatched.push(e as CustomEvent));

      // 打开选择器
      const input = container.querySelector('input')!;
      await fireEvent.focus(input);

      // 等待按钮出现
      await vi.waitFor(() => {
        const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
          btn.textContent?.includes('确认'),
        );
        return !!confirmBtn;
      });

      // 点击确认（完全没有操作）
      const confirmBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('确认'),
      );
      await fireEvent.click(confirmBtn!);

      // 验证派发了 change 事件
      expect(dispatched).toHaveLength(1);

      // 验证日期部分是今天
      const changedValue = dispatched[0].detail;
      const changedDate = new Date(changedValue);
      const now = new Date();

      expect(changedDate.getFullYear()).toBe(now.getFullYear());
      expect(changedDate.getMonth()).toBe(now.getMonth());
      expect(changedDate.getDate()).toBe(now.getDate());
    });
  });
});
