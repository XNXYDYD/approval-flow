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

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    await fireEvent.click(button!);

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].detail).toEqual(sampleApp);
  });

  it('Enter 键也派发 open-detail 事件（可访问性）', async () => {
    const { component, container } = render(ApplicationCard, { props: { app: sampleApp } });
    const dispatched: CustomEvent[] = [];
    component.$on('open-detail', (e: Event) => dispatched.push(e as CustomEvent));

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    await fireEvent.keyDown(button!, { key: 'Enter' });

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].detail).toEqual(sampleApp);
  });

  it('空格键也派发 open-detail 事件', async () => {
    const { component, container } = render(ApplicationCard, { props: { app: sampleApp } });
    const dispatched: CustomEvent[] = [];
    component.$on('open-detail', (e: Event) => dispatched.push(e as CustomEvent));

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    await fireEvent.keyDown(button!, { key: ' ' });

    expect(dispatched).toHaveLength(1);
  });

  it('非 Enter/空格 键不派发事件', async () => {
    const { component, container } = render(ApplicationCard, { props: { app: sampleApp } });
    const dispatched: CustomEvent[] = [];
    component.$on('open-detail', (e: Event) => dispatched.push(e as CustomEvent));

    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    await fireEvent.keyDown(button!, { key: 'Escape' });

    expect(dispatched).toHaveLength(0);
  });

  it('使用原生 button 元素作为可交互容器（无障碍性）', () => {
    const { container } = render(ApplicationCard, { props: { app: sampleApp } });
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('提供 aria-label 描述', () => {
    const { container } = render(ApplicationCard, { props: { app: sampleApp } });
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button).toHaveAttribute('aria-label');
  });

  it('支持 item prop（虚拟列表场景）', () => {
    const { container } = render(ApplicationCard, { props: { item: sampleApp } });
    const names = getAllByText(container as HTMLElement, sampleApp.applicant.name);
    expect(names.length).toBeGreaterThan(0);
  });
});
