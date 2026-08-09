import type { Applicant } from '$lib/types';

export const MOCK_USERS: Applicant[] = [
  {
    id: '1',
    name: '张三',
    employeeId: 'E001',
    department: { id: 'd1', name: '技术部', parentId: 'root' },
    email: 'zhangsan@company.com'
  },
  {
    id: '2',
    name: '李四',
    employeeId: 'E002',
    department: { id: 'd2', name: '产品部', parentId: 'root' },
    email: 'lisi@company.com'
  },
  {
    id: '3',
    name: '王五',
    employeeId: 'E003',
    department: { id: 'd1', name: '技术部', parentId: 'root' },
    email: 'wangwu@company.com'
  },
  {
    id: '4',
    name: '赵六',
    employeeId: 'E004',
    department: { id: 'd3', name: '设计部', parentId: 'root' },
    email: 'zhaoliu@company.com'
  }
];

// 当前登录用户（mock）
export const CURRENT_USER = MOCK_USERS[0];
