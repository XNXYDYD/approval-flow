import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatusBadge from '$lib/components/common/StatusBadge.svelte';
import type { ApplicationStatus } from '$lib/types';

describe('StatusBadge 组件', () => {
  const cases: { status: ApplicationStatus; label: string }[] = [
    { status: 'draft', label: '草稿' },
    { status: 'pending', label: '待审批' },
    { status: 'approved', label: '已通过' },
    { status: 'rejected', label: '已驳回' },
    { status: 'cancelled', label: '已撤销' }
  ];

  it.each(cases)('$status 正确渲染文案 label', ({ status, label }) => {
    render(StatusBadge, { props: { status } });
    const el = screen.getByText(label);
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe('SPAN');
  });

  it('pending 渲染黄色类（对应待审批视觉）', () => {
    const { container } = render(StatusBadge, { props: { status: 'pending' } });
    const span = container.querySelector('span');
    expect(span?.className).toMatch(/yellow/);
  });

  it('approved 渲染绿色类', () => {
    const { container } = render(StatusBadge, { props: { status: 'approved' } });
    const span = container.querySelector('span');
    expect(span?.className).toMatch(/green/);
  });

  it('rejected 渲染红色类', () => {
    const { container } = render(StatusBadge, { props: { status: 'rejected' } });
    const span = container.querySelector('span');
    expect(span?.className).toMatch(/red/);
  });
});
