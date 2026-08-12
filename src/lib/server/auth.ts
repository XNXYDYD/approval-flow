/**
 * 服务端用户鉴权（简化版）
 *
 * 说明：
 * - 当前为简化实现，直接返回 mock 用户
 * - 生产环境应从 session/cookie/jwt 中解析
 */
import { MOCK_USERS } from '$lib/mock/users';

export function getCurrentUser() {
  return MOCK_USERS[0];
}

export function getCurrentUserId(): string {
  return MOCK_USERS[0].id;
}
