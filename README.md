# Guia_Touristica_Es_Examen_de_CN
This is my first working repo
This is repo is designed to facilitate preparation for Spanish Tour Guide Exam in China

## 翻译引擎（西 → 中）

选中词语/短语加入笔记本时，网页会请求 Cloudflare Worker 的 `/translate` 接口（地址自动取 `assets/config.js` 里的 `proxyUrl`）：

| Worker 配置 | 翻译效果 |
| --- | --- |
| 设置了 `LLM_API_KEY`（推荐 DeepSeek） | 大模型结合所在句子给出**语境释义**，并附原形、词性、变位/用法说明 |
| 没设置 Key | Google 翻译（免费），单词附带按词性列出的词典义项 |
| Worker 还是旧版本 | 自动退回原来的 MyMemory |

### 部署步骤

1. 打开 Cloudflare 后台 → Workers & Pages → 现有的 Worker → **Edit code**，把仓库里的 `cloudflare-worker.js` 全部内容粘贴进去，点 **Deploy**。它保留了原来的 Supabase 代理功能，笔记同步不受影响。
2. （推荐）到 [platform.deepseek.com](https://platform.deepseek.com) 注册、充值几块钱、创建 API Key。
3. Worker → Settings → Variables and Secrets → Add：名称 `LLM_API_KEY`，类型 **Secret**，值为你的 Key。
4. （可选）添加 `ALLOWED_ORIGINS` = 你的网页地址（如 `https://joekyrio.github.io`），防止别的网站调用你的翻译接口。
5. （可选）换用其他 OpenAI 兼容的大模型：设置 `LLM_BASE_URL` 和 `LLM_MODEL`。
