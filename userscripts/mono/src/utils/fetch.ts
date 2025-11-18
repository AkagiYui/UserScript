export async function fetchWithParams<T>(baseUrl: string, params: Record<string, string | number> = {}): Promise<T> {
  // 创建一个 URLSearchParams 对象
  const searchParams = new URLSearchParams();
  
  // 将参数添加到 searchParams
  for (const [key, value] of Object.entries(params)) {
    searchParams.append(key, value.toString());
  }
  
  // 构造完整的 URL
  const url = `${baseUrl}?${searchParams.toString()}`;
  
  // 发送 GET 请求
  const response = await fetch(url);
  
  // 检查响应状态
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // 解析并返回响应数据
  return await response.json() as T;
}