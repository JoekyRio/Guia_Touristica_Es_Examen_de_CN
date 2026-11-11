# Guia_Touristica_Es_Examen_de_CN
This is my first working repo
This is repo is designed to facilitate preparation for Spanish Tour Guide Exam in China

## 翻译引擎（西 → 中）

选中词语/短语加入笔记本时，网页会请求 Cloudflare Worker 的 `/translate` 接口（地址自动取 `assets/config.js` 里的 `proxyUrl`）：

| Worker 配置 | 翻译效果 |
| --- | --- |
| 设置了 `LLM_API_KEY`（如硅基流动上的 DeepSeek） | 大模型结合所在句子给出**语境释义**，并附原形、词性、变位/用法说明 |
| 没设置 Key，或大模型调用失败 | Google 翻译（免费），单词附带按词性列出的词典义项 |
| Worker 还是旧版本 | 自动退回原来的 MyMemory |

👉 **一步一步的设置方法见 [TRANSLATION_SETUP.md](TRANSLATION_SETUP.md)**（硅基流动注册、Cloudflare Worker 更新、变量填写、测试、常见问题）。
