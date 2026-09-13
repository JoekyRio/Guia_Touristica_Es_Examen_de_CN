// 语法速查库（中文讲解），供「语法用法」匹配与学习使用
const grammarData = [
  {
    id: 'ser_estar',
    title: 'ser 与 estar 的区分',
    keywords: /\b(soy|eres|es|somos|sois|son|estoy|estás|está|estamos|estáis|están)\b/i,
    explanation: 'ser 表示本质、身份、来源、特征（是什么）；estar 表示位置、状态、临时状况（在哪里、怎么样）。描述景点位置常用 estar（está ubicado / se encuentra）；描述身份或名号用 ser（es conocido como...）。',
    examples: [
      { es: 'El Valle de Jiuzhaigou está en Sichuan.', zh: '九寨沟位于四川。' },
      { es: 'Es conocido como el «Paraíso en la Tierra».', zh: '它被称为「人间仙境」。' }
    ]
  },
  {
    id: 'haber_hay',
    title: '存在句 hay（haber 无人称）',
    keywords: /\b(hay|había|hubo|haber|habrá)\b/i,
    explanation: 'hay 是 haber 的无人称现在时，表示“有、存在”，永远用单数第三人称、不加冠词限定：Hay 108 lagos（有 108 个湖）。描述某地有什么时最常用。',
    examples: [
      { es: 'En el valle hay 108 lagos.', zh: '谷里有 108 个湖。' },
      { es: 'Hay que visitar este lugar.', zh: '必须参观这个地方。' }
    ]
  },
  {
    id: 'se_impersonal',
    title: 'se 无人称 / 被动（se encuentra, se puede）',
    keywords: /\b(se\s+\w+|se\s+encuentra|se\s+puede|se\s+trata|se\s+dice)\b/i,
    explanation: '“se + 动词第三人称”可表示无人称（大家/人们）或被动（被…）。导游解说中极常见：se encuentra（位于）、se puede ver（可以看到）、se distribuyen（分布着）。翻译时多译成“位于、可以、被”。',
    examples: [
      { es: 'El valle se encuentra en Sichuan.', zh: '山谷位于四川。' },
      { es: 'Se pueden apreciar varios colores.', zh: '可以看到多种颜色。' }
    ]
  },
  {
    id: 'genero_numero',
    title: '名词与形容词性、数一致',
    keywords: /(os|as|es|s)\b/i,
    explanation: '西班牙语名词分阴阳性（el/la、un/una），形容词、冠词、数量词要与名词性数一致：los lagos cristalinos（那些清澈的湖，阳性复数）。遇到成对出现的 -o/-a、加 -s/-es 时注意保持一致。',
    examples: [
      { es: 'los árboles frondosos', zh: '茂密的树木' },
      { es: 'una belleza incomparable', zh: '无与伦比的美' }
    ]
  },
  {
    id: 'preterito',
    title: '简单过去时 pretérito indefinido',
    keywords: /\b(fue|fueron|nació|construyó|creó|formó|se\s+convirtió|llegó|inició|comenzó)\b/i,
    explanation: '简单过去时（-ó / -ió / fue 等）用于叙述过去已经发生、完成的动作或历史事件：fue construido（被建造）、nació（诞生）。导游讲历史来源时常用。',
    examples: [
      { es: 'Debe su nombre a las nueve aldeas.', zh: '它因九个村寨而得名。' },
      { es: 'El templo fue construido en el siglo VII.', zh: '这座寺庙建于七世纪。' }
    ]
  },
  {
    id: 'imperfecto',
    title: '未完成过去时 imperfecto',
    keywords: /\b(era|eran|estaba|estaban|tenía|tenían|había|vivía|había)\b/i,
    explanation: '未完成过去时（-aba / -ía）用于描述过去的背景、习惯或持续状态，常与简单过去时搭配“背景+事件”。描述景区原来的样子、四时景象时常用。',
    examples: [
      { es: 'El agua era cristalina todo el año.', zh: '湖水常年清澈见底。' },
      { es: 'Los tibetanos vivían aquí.', zh: '藏族同胞曾生活在这里。' }
    ]
  },
  {
    id: 'subjuntivo',
    title: '虚拟式 subjuntivo（espero que / les ruego que）',
    keywords: /\b(espero\s+que|les\s+ruego\s+que|es\s+importante\s+que|ojalá|para\s+que|antes\s+de\s+que|a\s+fin\s+de\s+que)\b/i,
    explanation: '虚拟式用于表达愿望、请求、建议、可能性等，常见搭配 espero que + subj.（我希望…）、les ruego que + subj.（我恳请各位…）。导游在表达礼貌请求时常用。',
    examples: [
      { es: 'Espero que todos pasen un tiempo inolvidable.', zh: '希望大家度过难忘时光。' },
      { es: 'Les ruego que cuiden cada planta.', zh: '恳请各位爱护一草一木。' }
    ]
  },
  {
    id: 'condicional',
    title: '礼貌条件式 condicional（podría, debería）',
    keywords: /\b(podría|podrían|debería|deberían|querría|me\s+gustaría|habría)\b/i,
    explanation: '条件式（-ría）语气更委婉礼貌，用于提出建议或请求：podría（可以/能否）、debería（应当）、me gustaría（我想）。对游客说话时比直陈式更得体。',
    examples: [
      { es: '¿Podrían seguirme, por favor?', zh: '请您跟我来行吗？' },
      { es: 'Deberían llevar calzado cómodo.', zh: '你们应穿舒适的鞋。' }
    ]
  },
  {
    id: 'imperativo',
    title: '命令式 / 祈使（usted/ustedes 形式）',
    keywords: /\b(síganme|disfruten|tomen|miren|escuchen|venga|vengan|acompañenme|presten)\b/i,
    explanation: '对游客下指令常用“您/诸位”的命令式：-ar 动词变 -e(n)，-er/-ir 变 -a(n)。síganme（请跟我来）、disfruten（尽情享受）。注意正式礼貌场合用 usted/ustedes 形式。',
    examples: [
      { es: 'Síganme, por favor.', zh: '请跟我来。' },
      { es: 'Disfruten de la visita.', zh: '请尽情游览。' }
    ]
  },
  {
    id: 'gerundio',
    title: '副动词 gerundio（-ando / -iendo）',
    keywords: /\b\w+(ando|iendo)\b/i,
    explanation: '副动词（-ando/-iendo）表示正在进行的动作或伴随方式：caminando（走着）、disfrutando（享受着）。常与 estar 连用构成进行时。',
    examples: [
      { es: 'Estamos disfrutando del paisaje.', zh: '我们正欣赏着风景。' },
      { es: 'El agua cae fluyendo suavemente.', zh: '水缓缓流淌而下。' }
    ]
  },
  {
    id: 'por_para',
    title: 'por 与 para 的区分',
    keywords: /\b(por|para)\b/i,
    explanation: 'para 表目的、对象、终点（为了、给、前往）；por 表原因、手段、途径、被动施动者（因为、通过、被）。por todo ello（因此）、para este viaje（为了这次旅行）。',
    examples: [
      { es: 'Soy su guía para este viaje.', zh: '我是你们这次旅行的导游。' },
      { es: 'Por todo ello, es famoso.', zh: '正因为如此，它很有名。' }
    ]
  },
  {
    id: 'pron_obj',
    title: '宾语代词 lo/la/le/les + se',
    keywords: /\b(me|te|le|les|lo|la|los|las|se|nos|os)\b/i,
    explanation: '间接宾语代词 le/les 前面出现直接宾语 lo/la 时会变成 se；me/te/nos 等作宾语常粘在动词后（síganme=跟我）。les ruego（恳请各位）、les invito（邀请各位）是导游高频句。',
    examples: [
      { es: 'Les ruego que cuiden el lugar.', zh: '恳请各位爱护这里。' },
      { es: 'Síganme, por favor.', zh: '请跟我来。' }
    ]
  },
  {
    id: 'conectores',
    title: '顺序连接词（primero… luego… finalmente）',
    keywords: /\b(primero|en\s+primer\s+lugar|luego|después|finalmente|por\s+último|a\s+continuación|mientras|además)\b/i,
    explanation: '顺序连接词组织口语表达：primero（首先）、luego（接着）、después（然后）、finalmente（最后）、a continuación（接下来）。带团讲解时让叙述更有条理。',
    examples: [
      { es: 'Primero veremos los lagos; luego, las cascadas.', zh: '我们先看湖泊，然后看瀑布。' },
      { es: 'A continuación, visitaremos el templo.', zh: '接下来，我们参观寺庙。' }
    ]
  },
  {
    id: 'comparativo',
    title: '比较级 / 最高级（más… que / el más）',
    keywords: /\b(más|menos|mejor|peor|mayor|menor|tan|tanto)\b/i,
    explanation: 'más + 形容词 + que（比…更）、el/la/los/las + más + 形容词（最…）、tan… como（和…一样）。介绍“最宽瀑布”“最著名”时常用。',
    examples: [
      { es: 'Es la cascada más ancha de China.', zh: '它是中国最宽的瀑布。' },
      { es: 'El lago es más pequeño que el otro.', zh: '这个湖比另一个小。' }
    ]
  },
  {
    id: 'pasiva',
    title: '被动语态 ser + 过去分词',
    keywords: /\b(conocido|construido|ubicado|llamado|considerado|formado|rodeado|situado|declarado)\b/i,
    explanation: '被动语态用 ser + 过去分词（过去分词随性数变化 -o/-a/-os/-as）：es conocido（被称作）、fue construido（被建造）、está rodeado（被环绕）。导游描述景点时频繁出现。',
    examples: [
      { es: 'Está rodeado de montañas.', zh: '它被群山环绕。' },
      { es: 'Fue declarado Patrimonio de la Humanidad.', zh: '它被列为世界遗产。' }
    ]
  },
  {
    id: 'contraccion',
    title: '缩合 al / del',
    keywords: /\b(al|del)\b/i,
    explanation: 'a + el 缩合为 al；de + el 缩合为 del。其余不缩合（a la / de la）。sigue al río（沿河）、parte alta del arroyo（溪流上游）。',
    examples: [
      { es: 'al entrar en el valle', zh: '进入山谷时' },
      { es: 'la parte alta del arroyo', zh: '溪流的上游' }
    ]
  }
];