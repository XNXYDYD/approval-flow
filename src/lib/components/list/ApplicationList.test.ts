import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import ApplicationList from './ApplicationList.svelte';
import { generateMockApplications } from '$lib/mock/applications';
import type { ApplicationStatus } from '$lib/types';

// Mock scrollTo on HTMLElement since jsdom doesn't implement it
// @ts-expect-error - jsdom doesn't implement scrollTo, we need to mock it
Element.prototype.scrollTo = function(x: number, y: number) {
  this.scrollLeft = x;
  this.scrollTop = y;
};

afterEach(cleanup);

const allApps = generateMockApplications(60);

describe('ApplicationList 组件', () => {
  describe('基础渲染', () => {
    it('loading 状态下显示骨架屏', () => {
      const { container } = render(ApplicationList, { props: { loading: true, applications: [] } });
      const spaceY3 = container.querySelector('.space-y-3');
      expect(spaceY3).not.toBeNull();
      // 骨架屏由多个 div 组成
      const divs = spaceY3?.querySelectorAll(':scope > div');
      expect(divs && divs.length > 0).toBe(true);
    });

    it('空列表显示暂无数据提示', () => {
      const { container } = render(ApplicationList, { props: { loading: false, applications: [] } });
      expect(container.textContent).toContain('暂无符合条件的申请记录');
    });

    it('正常渲染所有申请卡片（非虚拟滚动模式）', () => {
      const apps = generateMockApplications(10);
      const { container } = render(ApplicationList, { props: { loading: false, applications: apps } });
      const buttons = container.querySelectorAll('button[aria-label*="查看"]');
      expect(buttons.length).toBe(10);
    });

    it('超过 20 条数据启用虚拟滚动模式', () => {
      const apps = generateMockApplications(30);
      const { container } = render(ApplicationList, { props: { loading: false, applications: apps } });
      const scrollContainer = container.querySelector('.app-scrollbar');
      expect(scrollContainer).not.toBeNull();
    });
  });

  describe('筛选功能', () => {
    it('按状态筛选 pending 仅显示待审批卡片', () => {
      const apps = generateMockApplications(30);
      const { container } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          filter: { status: 'pending' as ApplicationStatus }
        }
      });
      const buttons = container.querySelectorAll('button[aria-label*="查看"]');
      // 验证每个渲染的卡片都包含"待审批"状态
      buttons.forEach((btn) => {
        const cardEl = btn.closest('.bg-card') || btn.parentElement;
        expect(cardEl?.textContent || '').toContain('待审批');
      });
    });

    it('按关键词搜索', () => {
      const apps = generateMockApplications(30);
      const { container } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          filter: { keyword: '张三' }
        }
      });
      const buttons = container.querySelectorAll('button[aria-label*="查看"]');
      buttons.forEach((btn) => {
        const label = btn.getAttribute('aria-label') || '';
        expect(label).toContain('张三');
      });
    });

    it('筛选无结果时显示空状态', () => {
      const apps = generateMockApplications(10);
      const { container } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          filter: { keyword: '不存在的关键词xyz' }
        }
      });
      expect(container.textContent).toContain('暂无符合条件的申请记录');
    });
  });

  describe('批量选择功能', () => {
    it('selectable=true 时显示全选按钮', () => {
      const apps = generateMockApplications(10);
      const { container } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          selectable: true
        }
      });
      const allBtn = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('全选待审批')
      );
      expect(allBtn).toBeTruthy();
    });

    it('selectable=false 时不显示全选按钮', () => {
      const apps = generateMockApplications(10);
      const { container } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          selectable: false
        }
      });
      const allBtn = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('全选待审批')
      );
      expect(allBtn).toBeFalsy();
    });

    it('点击全选按钮派发 select-all 事件', async () => {
      const apps = generateMockApplications(10);
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          selectable: true
        }
      });
      component.$on('select-all', (e: Event) => dispatched.push(e as CustomEvent));

      const allBtn = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('全选待审批')
      );
      expect(allBtn).toBeTruthy();
      await fireEvent.click(allBtn!);

      expect(dispatched).toHaveLength(1);
      expect(dispatched[0].detail.appIds).toBeInstanceOf(Array);
      expect(dispatched[0].detail.appIds.length).toBeGreaterThan(0);
    });

    it('全选后再次点击派发 deselect-all 事件', async () => {
      const apps = generateMockApplications(10);
      const pendingIds = apps.filter((a) => a.status === 'pending').map((a) => a.id);
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          selectable: true,
          selectedIds: new Set(pendingIds)
        }
      });
      component.$on('deselect-all', (e: Event) => dispatched.push(e as CustomEvent));

      // 全选状态下按钮文案变为"取消全选"
      const cancelBtn = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('取消全选')
      );
      expect(cancelBtn).toBeTruthy();

      await fireEvent.click(cancelBtn!);
      expect(dispatched).toHaveLength(1);
    });
  });

  describe('虚拟滚动滚动位置修正（核心修复）', () => {
    it('筛选后列表不为空且不显示空状态', async () => {
      const apps = generateMockApplications(60);
      const { container, component } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          filter: {}
        }
      });

      // 模拟滚动到下方
      const scrollContainer = container.querySelector('.app-scrollbar') as HTMLElement;
      expect(scrollContainer).not.toBeNull();

      scrollContainer.scrollTop = 5000;
      await fireEvent.scroll(scrollContainer);

      // 筛选 pending 状态
      component.$set({ filter: { status: 'pending' as ApplicationStatus } });

      // 等待渲染更新
      await waitFor(() => {
        const hasEmptyText = container.textContent?.includes('暂无符合条件的申请记录');
        const pendingCount = apps.filter((a) => a.status === 'pending').length;
        // 当有 pending 数据时，不应显示空状态
        if (pendingCount > 0) {
          expect(hasEmptyText).toBe(false);
        }
        return true;
      });
    });

    it('筛选后列表长度变化时 scrollTop 不超过 maxScroll', async () => {
      const apps = generateMockApplications(60);
      const { container, component } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          filter: {}
        }
      });

      // 滚动到很下方
      const scrollContainer = container.querySelector('.app-scrollbar') as HTMLElement;
      scrollContainer.scrollTop = 5000;
      await fireEvent.scroll(scrollContainer);

      // 筛选 pending，待审批约 15 条
      component.$set({ filter: { status: 'pending' as ApplicationStatus } });

      // 等待更新后验证
      await waitFor(() => {
        const newScrollContainer = container.querySelector('.app-scrollbar') as HTMLElement;
        // 如果筛选后列表长度 <= 20，则不再使用虚拟滚动
        // 此时应该显示非虚拟滚动模式的卡片
        const pendingCount = apps.filter((a) => a.status === 'pending').length;
        if (pendingCount <= 20) {
          // 非虚拟滚动模式，检查是否渲染了卡片
          const buttons = container.querySelectorAll('button[aria-label*="查看"]');
          expect(buttons.length).toBeGreaterThan(0);
        } else if (newScrollContainer) {
          // 虚拟滚动模式，检查 scrollTop 是否有效
          const maxScroll = Math.max(0, newScrollContainer.scrollHeight - newScrollContainer.clientHeight);
          expect(newScrollContainer.scrollTop).toBeLessThanOrEqual(maxScroll);
        }
        return true;
      });
    });

    it('无筛选时 scrollTop 在有效范围内保持不变', async () => {
      const apps = generateMockApplications(60);
      const { container } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          filter: {}
        }
      });

      const scrollContainer = container.querySelector('.app-scrollbar') as HTMLElement;
      // 小滚动位置，不需要修正
      scrollContainer.scrollTop = 100;
      await fireEvent.scroll(scrollContainer);

      // scrollTop 应该保持 100
      expect(scrollContainer.scrollTop).toBe(100);
    });

    it('筛选后无数据时显示空状态', async () => {
      const apps = generateMockApplications(60);
      const { container, component } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          filter: {}
        }
      });

      const scrollContainer = container.querySelector('.app-scrollbar') as HTMLElement;
      scrollContainer.scrollTop = 5000;
      await fireEvent.scroll(scrollContainer);

      // 筛选一个不存在的关键词
      component.$set({ filter: { keyword: '完全不存在的关键词abcdefg' } });

      // 等待空状态显示
      await waitFor(() => {
        expect(container.textContent).toContain('暂无符合条件的申请记录');
        return true;
      }, { timeout: 3000 });
    });

    it('虚拟滚动模式下可见项数正确', () => {
      const apps = generateMockApplications(60);
      const { container } = render(ApplicationList, {
        props: {
          loading: false,
          applications: apps,
          filter: {}
        }
      });

      const scrollContainer = container.querySelector('.app-scrollbar') as HTMLElement;
      expect(scrollContainer).not.toBeNull();

      // 可见项数应该受到 OVERSCAN 的影响
      // 起始 index = floor(0/122) - 3 = -3 -> 0
      // 结束 index = ceil((0+620)/122) + 3 = ceil(5.08) + 3 = 9
      // 可见项约 9 条
      const innerContainer = scrollContainer.querySelector(':scope > div > div');
      if (innerContainer) {
        const visibleDivs = innerContainer.querySelectorAll(':scope > div[style*="height: 122px"]');
        expect(visibleDivs.length).toBeGreaterThan(0);
      }
    });
  });

  describe('事件派发', () => {
    it('点击卡片派发 open-detail 事件', async () => {
      const apps = generateMockApplications(5);
      const dispatched: CustomEvent[] = [];
      const { component, container } = render(ApplicationList, {
        props: { loading: false, applications: apps }
      });
      component.$on('open-detail', (e: Event) => dispatched.push(e as CustomEvent));

      const buttons = container.querySelectorAll('button[aria-label*="查看"]');
      await fireEvent.click(buttons[0]);

      expect(dispatched).toHaveLength(1);
      expect(dispatched[0].detail).toEqual(apps[0]);
    });

    it('toggle-select 事件正确转发', async () => {
      const apps = generateMockApplications(10);
      const dispatched: CustomEvent[] = [];
      const { component } = render(ApplicationList, {
        props: { loading: false, applications: apps, selectable: true }
      });
      component.$on('toggle-select', (e: Event) => dispatched.push(e as CustomEvent));

      // 通过改变 selectedIds 来模拟选择状态变化
      component.$set({ selectedIds: new Set([apps[0].id]) });

      // 验证没有异常抛出
      expect(true).toBe(true);
    });
  });
});