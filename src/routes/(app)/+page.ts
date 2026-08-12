/**
 * 首页客户端 load — 合并服务端数据
 *
 * 服务端已返回：apps、stats、user
 * 客户端在此基础上补充：筛选器状态等
 */
export async function load({ data, url }) {
  return {
    ...data,
    filter: {
      status: url.searchParams.get('status') ?? undefined,
      type: url.searchParams.get('type') ?? undefined,
    },
  };
}
