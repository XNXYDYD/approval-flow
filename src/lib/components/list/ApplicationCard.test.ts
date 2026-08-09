import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, getAllByText } from '@testing-library/svelte';
import ApplicationCard from '$lib/components/list/ApplicationCard.svelte';
import { generateMockApplications } from '$lib/mock/applications';

afterEach(cleanup);

const apps = generateMockApplications(1);
const sampleApp = apps[0];

describe('ApplicationCard 组件', () => {
  it('渲染申请人姓名和部门', () => {
    const { container } = render(ApplicationCard, { props: { app: sampleApp } });
    // getByText 可能返回多个，用第一个
    const names = getAllByText(container as HTMLElement, sampleApp.applicant.name);
    expect(names.length).toBeGreaterThan(0);
    const depts = getAllByText(container as HTMLElement, sampleApp.applicant.department.name);
    expect(depts.length).toBeGreaterThan(0);
  });

  it('渲染加班时长相关文案', () => {
    const { container } = render(ApplicationCard, { props: { app: sampleApp } });
    const matches = getAllByText(container as HTMLElement, /时长/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('渲染加班事由', () => {
    const { container } = render(ApplicationCard, { props: { app: sampleApp } });
    const matches = getAllByText(container as HTMLElement, sampleApp.reason);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('点击卡片派发 open-detail 事件并传递 app', async () => {
    const { component, container } = render(ApplicationCard, { props: { app: sampleApp } });
    const dispatched: CustomEvent[] = [];
    component.$on('open-detail', (e: Event) => dispatched.push(e as CustomEvent));

    // 点击 Card 根节点的第一个子元素（实际渲染的 Card 根 div）
    const card = container.firstElementChild as HTMLElement;
    await fireEvent.click(card);

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].detail).toEqual(sampleApp);
  });

  it('Enter 键也派发 open-detail 事件（可访问性）', async () => {
    const { component, container } = render(ApplicationCard, { props: { app: sampleApp } });
    const dispatched: CustomEvent[] = [];
    component.$on('open-detail', (e: Event) => dispatched.push(e as CustomEvent));

    const card = container.firstElementChild as HTMLElement;
    await fireEvent.keyDown(card, { key: 'Enter' });

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].detail).toEqual(sampleApp);
  });

  it('非 Enter 键不派发事件', async () => {
    const { component, container } = render(ApplicationCard, { props: { app: sampleApp } });
    const dispatched: CustomEvent[] = [];
    component.$on('open-detail', (e: Event) => dispatched.push(e as CustomEvent));

    const card = container.firstElementChild as HTMLElement;
    await fireEvent.keyDown(card, { key: 'Escape' });

    expect(dispatched).toHaveLength(0);
  });

  it('tabindex 为 0（可键盘聚焦）', () => {
    const { container } = render(ApplicationCard, { props: { app: sampleApp } });
    const card = container.querySelector('[role="button"]');
    expect(card).toHaveAttribute('tabindex', '0');
  });
});
