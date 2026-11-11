// ============================================================
// Cloudflare Worker：Supabase 中转代理 + 西→中翻译接口
// ============================================================
// 用法：把整份代码粘贴到你现有的 Worker（Cloudflare 后台 → Workers → 你的 Worker → Edit code），
// 点 Deploy 即可。网页里的 config.js 不用改，前端会自动请求 <proxyUrl>/translate。
//
// 详细图文步骤见仓库里的 TRANSLATION_SETUP.md
//
// 路由：
//   POST /translate   { text, context?, type? }  →  { meaning, note, provider }
//   GET  /translate?text=...&context=...           同上，方便直接在浏览器地址栏里测试
//   POST /grammar     { text, context? }  →  { summary, points: [{ title, explanation, examples }] }
//                     大模型从多个层面分析语法，网页里让用户勾选要保存的层面（需要 LLM_API_KEY；没配置返回 501）
//   GET  /grammar?text=...&context=...             同上，方便测试
//   其他所有路径       原样转发到 Supabase（与旧代理行为一致，笔记云同步继续可用）
//
// 翻译引擎（自动选择）：
//   1. 配置了 LLM_API_KEY  → 大模型结合「所在句子」给出语境释义 + 原形/词性/用法（质量最好）
//      支持任何 OpenAI 兼容接口，在 Worker → Settings → Variables and Secrets 里添加：
//        LLM_API_KEY   （类型选 Secret）你的 key
//        LLM_BASE_URL  接口地址，到 /v1 为止。硅基流动：https://api.siliconflow.cn/v1
//                      不填默认 DeepSeek 官方 https://api.deepseek.com
//        LLM_MODEL     模型名，硅基流动例：deepseek-ai/DeepSeek-V4.1-Flash（不填默认 deepseek-chat）
//   2. 没配置 Key，或大模型调用失败 → Google 翻译（免费，无需 Key），单词会附带词典义项；
//      此时返回结果里会带 llmError 字段，说明大模型为什么失败，方便排查
//
// 可选变量：
//   SUPABASE_URL      默认下面的常量
//   ALLOWED_ORIGINS   逗号分隔的允许来源，如 "https://joekyrio.github.io"。设置后其他网站不能调用 /translate，
//                     防止别人白嫖你的大模型额度（不设置则不限制）。
// ============================================================

const DEFAULT_SUPABASE_URL = 'https://dbskzvvnpgtfdrnzfemn.supabase.co';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || 'apikey,authorization,content-type,prefer,x-client-info',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (url.pathname === '/translate' || url.pathname === '/grammar') {
      if (request.method !== 'POST' && request.method !== 'GET') return json({ error: 'GET/POST only' }, 405, cors);
      if (!originAllowed(origin, env)) return json({ error: 'origin not allowed（请检查 ALLOWED_ORIGINS）' }, 403, cors);
      try {
        const body = request.method === 'GET' ? Object.fromEntries(url.searchParams) : await request.json();
        const text = String(body.text || '').trim().slice(0, url.pathname === '/grammar' ? 400 : 200);
        const context = String(body.context || '').trim().slice(0, 600);
        if (!text) return json({ error: 'empty text' }, 400, cors);
        if (url.pathname === '/grammar') {
          if (!env.LLM_API_KEY) return json({ error: '语法分析需要在 Worker 里配置 LLM_API_KEY' }, 501, cors);
          return json(await grammarLLM(text, context, env), 200, cors);
        }
        const type = body.type === 'phrase' ? 'phrase' : 'vocab';
        return json(await translate(text, context, type, env), 200, cors);
      } catch (e) {
        return json({ error: String(e && e.message || e) }, 502, cors);
      }
    }

    return proxySupabase(request, url, env, cors);
  },
};

// ---------- Supabase 转发 ----------
async function proxySupabase(request, url, env, cors) {
  const target = (env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '') + url.pathname + url.search;
  const headers = new Headers(request.headers);
  ['host', 'origin', 'referer', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'x-forwarded-for', 'x-real-ip'].forEach(h => headers.delete(h));
  const init = { method: request.method, headers, redirect: 'follow' };
  if (!['GET', 'HEAD'].includes(request.method)) init.body = await request.arrayBuffer();
  const res = await fetch(target, init);
  const out = new Headers(res.headers);
  Object.entries(cors).forEach(([k, v]) => out.set(k, v));
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
}

// ---------- 翻译 ----------
async function translate(text, context, type, env) {
  let llmError = '';
  if (env.LLM_API_KEY) {
    try { return await translateLLM(text, context, type, env); }
    catch (e) { llmError = String(e && e.message || e); console.log('LLM failed, fallback to Google:', llmError); }
  }
  const r = await translateGoogle(text);
  if (llmError) r.llmError = llmError;
  return r;
}

// 调用 OpenAI 兼容的大模型，返回解析好的 JSON 对象
async function llmJSON(env, system, user, maxTokens) {
  const base = (env.LLM_BASE_URL || 'https://api.deepseek.com').trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');   // 容错：多填了 /chat/completions 也能用
  const model = env.LLM_MODEL || 'deepseek-chat';
  const payload = {
    model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    temperature: 0.2,
    max_tokens: maxTokens,   // 留足余量：部分模型会先输出思考过程，太小会把答案截断
    response_format: { type: 'json_object' },
  };
  const call = body => fetch(base + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.LLM_API_KEY.trim() },
    body: JSON.stringify(body),
  });
  let res = await call(payload);
  // 有些模型/平台不支持 response_format，报 400 时去掉它重试一次
  if (res.status === 400) { delete payload.response_format; res = await call(payload); }
  if (!res.ok) throw new Error('LLM HTTP ' + res.status + ' ' + (await res.text()).slice(0, 300));
  const data = await res.json();
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
  const m = content.match(/\{[\s\S]*\}/);   // 兼容模型在 JSON 前后多说了几句话
  if (!m) throw new Error('LLM 没有返回 JSON：' + content.slice(0, 200));
  return JSON.parse(m[0]);
}

async function translateLLM(text, context, type, env) {
  const system = '你是给中国学生讲解西班牙语的老师，学生在准备西班牙语导游证考试。'
    + '学生会给你一个从导游词里选中的西语词或短语，以及它所在的句子。请严格按 JSON 输出，不要输出其他内容：\n'
    + '{"meaning": "它在这个句子里的中文意思，简洁准确，像词典释义，最多 20 个字；多个义项用；分隔",'
    + ' "lemma": "原形（动词给不定式，名词/形容词给阳性单数；本身就是原形或是短语则与原文相同）",'
    + ' "pos": "词性，如 动词/阳性名词/阴性名词/形容词/副词/介词短语/固定搭配",'
    + ' "usage": "一句话中文说明：变位形式（时态、人称）、固定搭配或在导游词里的常见用法，最多 50 个字"}';
  const user = `选中的${type === 'phrase' ? '短语' : '词'}：${text}\n所在句子：${context || '（无）'}`;
  const o = await llmJSON(env, system, user, 1024);
  if (!o.meaning) throw new Error('LLM returned no meaning');

  const parts = [];
  const lemma = String(o.lemma || '').trim();
  if (lemma && lemma.toLowerCase() !== text.toLowerCase()) parts.push('原形 ' + lemma);
  if (o.pos) parts.push(String(o.pos).trim());
  let note = parts.join(' · ');
  if (o.usage) note += (note ? '\n' : '') + String(o.usage).trim();
  return { meaning: String(o.meaning).trim(), note, provider: 'llm' };
}

// ---------- 语法分析：返回多个层面，让用户自己挑 ----------
async function grammarLLM(text, context, env) {
  const system = '你是给中国学生讲解西班牙语语法的老师，学生在准备西班牙语导游证口试，水平大约 B1。'
    + '学生会给你从导游词里选中的西语内容（可能是一个变位的词、一个短语或一整句话）以及它所在的句子。'
    + '一处语言现象往往涉及好几个语法层面，请从不同层面分别讲解，让学生自己挑选关心的那一个。'
    + '可以考虑的层面包括：动词原形与变位（时态、语式、人称）、该时态/语式在本句中的用法、代词或 se 的用法、'
    + '冠词与性数一致、介词或固定搭配、从句与句子结构、比较级等。只列出和所选内容真正相关的层面，'
    + '给 2～5 个，按对理解这句话的重要程度排序，不要重复。请严格按 JSON 输出，不要输出其他内容：\n'
    + '{"summary": "一句话概括所选内容，例如：sentirán = sentir 的陈述式将来时第三人称复数（ustedes）。最多 50 个字",'
    + ' "points": [{"title": "这个语法点的名称，中文加西语术语，最多 20 个字，例如：陈述式将来时 futuro simple",'
    + ' "explanation": "结合本句用中文讲清楚：规则是什么、在这句话里为什么这样用。80～150 个字",'
    + ' "examples": [{"es": "一个简单的导游场景西语例句", "zh": "中文翻译"}]}]}'
    + '\n每个 point 给 1～2 个例句。';
  const user = `选中的内容：${text}\n所在句子：${context || '（无）'}`;
  const o = await llmJSON(env, system, user, 2048);
  const points = (Array.isArray(o.points) ? o.points : []).map(p => ({
    title: String(p.title || '').trim(),
    explanation: String(p.explanation || '').trim(),
    examples: (Array.isArray(p.examples) ? p.examples : []).slice(0, 3)
      .map(e => ({ es: String(e.es || '').trim(), zh: String(e.zh || '').trim() })).filter(e => e.es),
  })).filter(p => p.title && p.explanation).slice(0, 6);
  if (!points.length) throw new Error('LLM returned no grammar points');
  return { summary: String(o.summary || '').trim(), points, provider: 'llm' };
}

async function translateGoogle(text) {
  const u = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=zh-CN&hl=zh-CN&dt=t&dt=bd&dj=1&q=' + encodeURIComponent(text);
  const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error('Google HTTP ' + res.status);
  const d = await res.json();
  const meaning = (d.sentences || []).map(s => s.trans || '').join('').trim();
  // 单词会有词典义项：按词性列出常见释义
  const note = (d.dict || []).slice(0, 4).map(e => `${e.pos}：${(e.terms || []).slice(0, 5).join('、')}`).join('\n');
  if (!meaning) throw new Error('Google returned no translation');
  return { meaning, note, provider: 'google' };
}

// ---------- 工具 ----------
function originAllowed(origin, env) {
  if (!env.ALLOWED_ORIGINS) return true;
  return env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean).includes(origin);
}
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors) });
}
