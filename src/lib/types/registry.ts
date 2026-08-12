/**
 * 业务类型注册表
 *
 * 设计模式：注册表模式（Registry Pattern）
 * - 新增业务场景时只需调用 registerApplicationType()
 * - 表单渲染、校验、统计逻辑均可通过 getTypeConfig() 获取
 * - 实现"开闭原则"：对扩展开放，对修改关闭
 */
import type { ApplicationType, ApplicationTypeConfig } from './application';

const registry = new Map<ApplicationType, ApplicationTypeConfig>();

export function registerApplicationType(config: ApplicationTypeConfig): void {
  if (registry.has(config.type)) {
    console.warn(`[Registry] 类型 ${config.type} 已注册，将被覆盖`);
  }
  registry.set(config.type, config);
}

export function getTypeConfig(type: ApplicationType): ApplicationTypeConfig | undefined {
  return registry.get(type);
}

export function getAllTypeConfigs(): ApplicationTypeConfig[] {
  return Array.from(registry.values());
}

export function getTypeLabel(type: ApplicationType): string {
  return registry.get(type)?.label ?? type;
}

export function hasType(type: ApplicationType): boolean {
  return registry.has(type);
}
