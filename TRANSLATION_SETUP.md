# 翻译接口设置指南（硅基流动 + DeepSeek）

目标：网页里选中西语词/短语时，由 **硅基流动（SiliconFlow）上的 DeepSeek 模型** 结合所在句子给出中文释义、原形、词性和用法。

整体链路：

```
网页（GitHub Pages） ──POST /translate──▶ 你的 Cloudflare Worker ──▶ 硅基流动 API（DeepSeek）
                                              │  （大模型失败时）
                                              └──▶ Google 翻译（免费兜底）
```

API Key 只存在 Cloudflare Worker 的「密钥」里，**不会出现在网页代码或 GitHub 仓库中**，别人看不到。

一共四步，大约 15 分钟：

1. 在硅基流动拿到 API Key 和模型名
2. 更新 Cloudflare Worker 代码
3. 在 Worker 里填 3 个变量
4. 测试；然后把网页更新到新版本

---

## 第一步：硅基流动 —— 拿到 API Key 和模型名

### 1.1 注册 / 登录

1. 打开 <https://cloud.siliconflow.cn> ，用手机号注册并登录。
2. 部分模型需要先完成实名认证才能调用：左侧菜单「账户管理 → 实名认证」。如果后面测试时报错里出现「实名」字样，就回来做这一步。

### 1.2 确认模型名（一个字母都不能错）

1. 左侧菜单点「**模型广场**」，搜索 `DeepSeek-V4.1-Flash`。
2. 打开这个模型的详情页，点模型名旁边的「复制」图标。复制出来应该类似：

   ```
   deepseek-ai/DeepSeek-V4.1-Flash
   ```

   - 前面的 `deepseek-ai/` 不能省略；
   - 大小写必须完全一致；
   - 顺便看一下详情页里的价格。查一个词大约用几百到一千多个 token，Flash 档模型很便宜。

3. 先把模型名粘贴到记事本里备用。

### 1.3 创建 API Key

1. 左侧菜单点「**API 密钥**」→「**新建 API 密钥**」。
2. 描述随便填，例如 `guia-translate`，确认。
3. 点击复制生成的密钥（以 `sk-` 开头的一长串），也粘贴到记事本里。

   > ⚠️ 这个 Key 等于你的钱包，不要发到聊天里、不要写进 `config.js`、不要提交到 GitHub。

### 1.4 确认余额

左侧「余额充值」里看一下余额。新账号一般有赠送额度；不够的话充几块钱就能用很久。

---

## 第二步：更新 Cloudflare Worker 代码

你现在已有一个 Worker（地址是 `https://shy-hall-dbd0.zhangjietong.workers.dev`），它负责转发笔记同步。新代码**保留了原来的转发功能**，只是多加了一个 `/translate` 翻译接口。

### 2.1 找到你的 Worker

1. 打开 <https://dash.cloudflare.com> 并登录。
2. 左侧菜单点「**Workers & Pages**」（新版界面可能叫「Compute (Workers)」→「Workers & Pages」）。
3. 在列表里点 **shy-hall-dbd0**。

### 2.2 备份旧代码（以防万一）

1. 右上角点「**Edit code**」（编辑代码）。
2. 在左边的代码编辑区按 `Ctrl+A`（Mac 是 `Cmd+A`）全选，`Ctrl+C` 复制，粘贴到一个记事本文件保存下来。

### 2.3 粘贴新代码

1. 在 GitHub 上打开本仓库的 `cloudflare-worker.js` 文件。
   - 如果还没合并到 master，要先切换到分支 `claude/funny-mayer-7mdfno` 才能看到这个文件。
2. 点文件右上角的「**Copy raw file**」（复制图标），复制全部内容。
3. 回到 Cloudflare 的编辑器，`Ctrl+A` 全选，再 `Ctrl+V` 粘贴，把旧代码整个替换掉。
4. 点右上角蓝色的「**Deploy**」，等提示部署成功。

> 只做到这一步时，网页的笔记同步照常工作；翻译暂时用的是免费的 Google 翻译。

---

## 第三步：在 Worker 里填 3 个变量

1. 回到这个 Worker 的页面（可以点编辑器左上角的返回箭头），切到「**Settings（设置）**」标签。
2. 找到「**Variables and Secrets（变量和机密）**」，点「**+ Add**」。
3. 依次添加下面 3 个（每个都点一次 Add）：

| Type（类型） | Variable name（变量名） | Value（值） |
| --- | --- | --- |
| **Secret** | `LLM_API_KEY` | 你在 1.3 复制的 `sk-...` 密钥 |
| Text（明文） | `LLM_BASE_URL` | `https://api.siliconflow.cn/v1` |
| Text（明文） | `LLM_MODEL` | 你在 1.2 复制的模型名，如 `deepseek-ai/DeepSeek-V4.1-Flash` |

4. 点「**Deploy**」（或「Save and deploy」）保存。

注意：

- 变量名必须**全大写**，和表格一模一样；
- 值的前后不要加引号、不要有空格；
- `LLM_BASE_URL` 以 `/v1` 结尾即可，不需要加 `/chat/completions`；
- 地址是 `siliconflow.cn`（国内站），不是 `.com`（国际站）。在国际站注册的账号，要填 `https://api.siliconflow.com/v1`。

---

## 第四步：测试

### 4.1 直接在浏览器测试 Worker

把下面这个地址整个复制到浏览器地址栏打开：

```
https://shy-hall-dbd0.zhangjietong.workers.dev/translate?text=se%20encuentra&context=El%20Valle%20de%20Jiuzhaigou%20se%20encuentra%20en%20Sichuan.
```

**成功**时会看到类似下面的内容，关键是 `"provider":"llm"`：

```json
{"meaning":"位于；坐落于","note":"原形 encontrarse · 代词式动词\n陈述式现在时第三人称单数，se encuentra en 表示「位于」","provider":"llm"}
```

同一个 Worker 还负责**语法分析**（网页里选中文字后点「📐 语法」）。可以用下面的地址测试，成功时会看到 `"points":[...]`，里面是几个不同层面的语法讲解：

```
https://shy-hall-dbd0.zhangjietong.workers.dev/grammar?text=sentir%C3%A1n&context=Ustedes%20tambi%C3%A9n%20sentir%C3%A1n%20esta%20vida%20sin%20prisas.
```

语法分析只能用大模型，没有 Google 兜底：没配 `LLM_API_KEY` 时会返回 `语法分析需要在 Worker 里配置 LLM_API_KEY`，网页会自动改用本地语法库。

如果看到的是 `"provider":"google"`，后面还跟着一个 `"llmError":"..."`，说明大模型没调通，Worker 自动换成了 Google 翻译。按下面的「常见问题」，根据 `llmError` 的内容排查。

> 第一次调用可能要等几秒钟，这是正常的。

### 4.2 确认笔记同步没受影响

打开网页 → 打开「我的笔记本」→ 点「**测试连接**」，应该显示「连接正常」。

### 4.3 让网页用上新版本

网页的新代码目前在分支 `claude/funny-mayer-7mdfno` 上。GitHub Pages 一般是从 `master` 发布的，所以需要把这个分支**合并到 master**：在 GitHub 仓库页面开一个 Pull Request 再点 Merge 即可（也可以让 Claude 帮你开 PR）。

合并后等 1～2 分钟，用手机/电脑**强制刷新**网页（电脑 `Ctrl+F5`；手机可以在网址后面加 `?v=2` 再打开）。

### 4.4 在网页里实际试一下

选中范文中的一个词，点「📖 词汇」。弹窗里的标签应显示：

```
中文释义（来源：AI 语境释义，可修改）
```

「补充笔记」里会自动填上原形、词性和用法，你可以修改后再保存。

---

## （可选）第五步：只允许你的网页调用

Worker 的地址写在公开的 `config.js` 里，理论上别人也能调用它来消耗你的额度。如果想限制，可以再加一个变量：

| Type | Variable name | Value |
| --- | --- | --- |
| Text | `ALLOWED_ORIGINS` | 你网页的「协议 + 域名」，例如 `https://joekyrio.github.io` |

- 只写到域名，**后面不要有斜杠和路径**；
- 有多个网址时用英文逗号隔开；
- 设置之后，4.1 那种直接在地址栏打开的测试会返回 `origin not allowed`。这是正常的，说明限制生效了。所以要**先测试通过，再加这个变量**。

另外，硅基流动是预付费的，最坏情况也只会花掉账户里已有的余额。

---

## 常见问题

| 现象 / `llmError` 内容 | 原因 | 解决 |
| --- | --- | --- |
| `LLM HTTP 401` / `Invalid token` | Key 填错、复制不完整，或已被删除 | 重新复制 Key，更新 `LLM_API_KEY`（Secret 无法查看，直接编辑覆盖），再 Deploy |
| `LLM HTTP 400` 且提到 `model` / `Model does not exist` | 模型名不对 | 到模型广场重新复制模型名，`deepseek-ai/` 前缀不能少 |
| `LLM HTTP 403`，提到实名 | 该模型需要实名认证 | 硅基流动「账户管理 → 实名认证」 |
| 提到余额不足（如 `insufficient balance`） | 没钱了 | 充值 |
| `LLM HTTP 429` | 调用太频繁 | 稍等再试 |
| `LLM HTTP 404` | `LLM_BASE_URL` 写错 | 改成 `https://api.siliconflow.cn/v1` |
| 返回 `google` 但**没有** `llmError` | Worker 没读到 `LLM_API_KEY` | 检查变量名拼写；添加变量后要点 Deploy |
| `origin not allowed` | `ALLOWED_ORIGINS` 和网页地址不一致 | 把它改成浏览器地址栏里网页的 `https://域名`，或者先删掉这个变量 |
| 打开测试地址返回的是 Supabase 的错误（如 `{"message":"no Route matched"...}`） | Worker 还是旧代码 | 回到第二步，确认粘贴了新代码并点了 Deploy |
| 网页弹窗显示「MyMemory（备用）」 | Worker 是旧代码，或者请求超时（30 秒） | 同上；或稍后重试 |
| 网页弹窗没有「来源」字样 | 网页还是旧版本 | 完成 4.3：合并到 master，然后强制刷新 |
| 网页提示「AI 调用失败，详见 F12 控制台」 | 大模型出错，已用 Google 兜底 | 电脑上按 F12 → Console，能看到具体错误，再对照本表 |

想换其他模型（比如硅基流动上的 Qwen），只需要修改 `LLM_MODEL` 的值，再 Deploy，不用改代码。
