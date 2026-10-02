// ===== 同步配置 =====
// 国内网络直连 supabase.co 经常失败（ERR_CONNECTION_CLOSED）。
// 解决方案：用 Cloudflare Worker 做中转代理。
//   1. 部署 supabase-proxy-worker.js 到 Cloudflare Workers（免费）
//   2. 拿到 Worker 地址，如 https://my-proxy.xxx.workers.dev
//   3. 把 PROXY_URL 填到下面
// 填了 PROXY_URL 就走代理（推荐）；留空则直连 Supabase。

const SUPABASE_CONFIG = {
  // Supabase 直连地址（直连不稳定，建议用代理）
  url: "https://dbskzvvnpgtfdrnzfemn.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRic2t6dnZucGd0ZmRybnpmZW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNjQyNjQsImV4cCI6MjEwNDg0MDI2NH0.Td9dHUJiBhZo-ZZOoctoeNo39SMnkPVT66SUZCSQSDI",
  // Cloudflare Worker 代理地址，部署后填这里。例如 "https://my-proxy.xxx.workers.dev"
  proxyUrl: "https://shy-hall-dbd0.zhangjietong.workers.dev"
};