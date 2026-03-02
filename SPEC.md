# 故事生成器 3.4.0 重新设计规格文档

## 一、核心设计理念

### 1.1 设计原则
- **模块化**: 每个功能都是独立模块，可插拔、可组合
- **可配置性**: 几乎所有内容都可由用户自定义
- **记忆延续**: 故事之间有连续性，不是孤立的单次体验
- **动态角色**: 角色会随故事成长和变化
- **用户主导**: 用户不是被动接受故事，而是深度参与

### 1.2 系统架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        应用层 (UI Layer)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │世界管理  │ │故事引擎  │ │小助手   │ │角色面板  │ │剧情存档  │  │
│  │界面     │ │界面     │ │ builder │ │界面     │ │界面     │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
└───────┼──────────┼──────────┼──────────┼──────────┼───────────┘
        │          │          │          │          │
┌───────┴──────────┴──────────┴──────────┴──────────┴───────────┐
│                     核心引擎层 (Core Engine)                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│  │世界管理器   │ │剧情引擎    │ │小助手引擎   │ │记忆引擎    ││
│  │WorldManager│ │StoryEngine │ │AssistantMgr│ │MemoryEngine││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘│
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │角色管理器   │ │时间管理器   │ │交互引擎    │              │
│  │CharManager │ │TimeManager │ │InteractMgr │              │
│  └────────────┘ └────────────┘ └────────────┘              │
└──────────────────────────────────────────────────────────────┘
        │          │          │          │          │
┌───────┴──────────┴──────────┴──────────┴──────────┴───────────┐
│                      数据层 (Data Layer)                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│  │世界数据    │ │剧情数据    │ │角色数据    │ │小助手配置  ││
│  │WorldData  │ │StoryData  │ │CharData   │ │AssistConfig││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘│
└──────────────────────────────────────────────────────────────┘
        │          │          │          │          │
┌───────┴──────────┴──────────┴──────────┴──────────┴───────────┐
│                      API层 (External API)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              MiniAI (统一API接口)                       │ │
│  │  支持: DeepSeek / OpenAI / Claude / 自定义API          │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 二、世界与剧情体系

### 2.1 世界 (World)

每个世界是独立的剧情空间，有自己的：
- **基础设定**: 背景、规则、氛围
- **剧情线**: 主线、支线、隐藏线
- **时间流速**: 现实1小时 = 世界N小时
- **角色库**: 世界专属角色
- **剧情存档**: 所有在这个世界发生的故事

```javascript
// 世界数据结构
{
  id: "world_xxx",
  name: "淫猎都市",
  type: "都市/奇幻/科幻/历史/自定义",
  
  // 基础设定
  settings: {
    background: "现代都市，灯红酒绿...",
    worldview: "弱肉强食",
    rules: ["不允许杀人", "力量即真理"],
    keywords: ["都市", "狩猎", "超自然"],
    tone: "黑暗/轻松/严肃/浪漫",
    timeSpeed: 24  // 1:24 比例
  },
  
  // 剧情线
  plotlines: {
    main: { name: "主线剧情", progress: 0, chapters: [] },
    side: [{ name: "支线A", progress: 0 }, ...],
    hidden: [{ name: "隐藏线", unlocked: false, ... }]
  },
  
  // 世界状态
  state: {
    currentTime: { year: 2024, month: 1, day: 1, hour: 8 },
    weather: "晴朗",
    atmosphere: "平静",
    activeEvents: []
  },
  
  // 关联数据
  characters: ["char_1", "char_2", ...],
  stories: ["story_1", "story_2", ...],
  worldArchives: ["archive_1", ...]
}
```

### 2.2 剧情 (Story/Episode)

剧情是用户在某个世界中的一次故事体验。

```javascript
// 剧情数据结构
{
  id: "ep_xxx",
  worldId: "world_xxx",
  
  // 剧情信息
  title: "第一章：初入都市",
  type: "main/side/hidden",
  chapter: 1,
  status: "in_progress/completed/archived",
  
  // 参与者
  participants: {
    protagonist: "char_main",  // 主角ID
    selected: ["char_2", "char_3"],  // 选中的配角
    temp: ["char_temp_1", ...]  // 临时角色
  },
  
  // 剧情内容
  scenes: [
    {
      id: "scene_1",
      timestamp: "2024-01-01T08:00:00Z",
      type: "narrative/dialogue/choice/interaction",
      content: "你走在繁华的街道上...",
      background: "城市街道",
      mood: "紧张",
      choices: [
        { id: "c1", text: "前往酒吧", next: "scene_2a" },
        { id: "c2", text: "回家休息", next: "scene_2b" }
      ],
      participants: ["char_main", "char_2"],
      characterStates: {  // 角色当时的状态快照
        "char_main": { emotion: "紧张", location: "街道" }
      }
    }
  ],
  
  // 用户选择记录
  userDecisions: [
    { sceneId: "scene_1", choice: "前往酒吧", timestamp: "..." }
  ],
  
  // 剧情摘要（用于记忆延续）
  summary: {
    opening: "主角初入都市...",
    keyEvents: ["遇到神秘女子", "发现超自然力量"],
    characterDevelopment: {
      "char_main": "从迷茫到坚定"
    },
    worldChanges: ["城市格局改变", "新势力出现"]
  },
  
  // 时间
  startTime: "2024-01-01T08:00:00Z",
  endTime: "2024-01-01T22:00:00Z",
  inWorldTime: { year: 2024, month: 1, day: 1, hour: 22 }
}
```

### 2.3 剧情线系统

```javascript
// 剧情线管理
{
  // 主线剧情 - 必须完成的剧情
  main: {
    id: "main_1",
    name: "成为都市王者",
    description: "在都市中建立自己的势力",
    chapters: [
      { id: "ch1", title: "初入都市", required: true, unlock: null },
      { id: "ch2", title: "第一桶金", required: true, unlock: "ch1完成" },
      { id: "ch3", title: "建立势力", required: true, unlock: "ch2完成" }
    ],
    currentChapter: "ch1",
    completedChapters: []
  },
  
  // 支线剧情 - 可选剧情
  side: [
    {
      id: "side_1",
      name: "神秘事件",
      description: "调查城市中的超自然现象",
      triggers: ["ch1完成后解锁", "特定角色相关"],
      scenes: [...],
      rewards: { stats: { "神秘": +10 }, items: ["神秘道具"] }
    }
  ],
  
  // 隐藏剧情 - 特殊条件触发
  hidden: [
    {
      id: "hidden_1",
      name: "城市的真相",
      description: "揭开都市最深层的秘密",
      conditions: { mainProgress: 3, stats: { "智慧": 50 }, choices: ["选择A而非B"] },
      scenes: [...],
      reward: { ending: "true_ending" }
    }
  ]
}
```

---

## 三、自定义小助手系统 (Assistant Builder)

### 3.1 小助手本质

小助手的本质是一个 **信息处理管道**：

```
读取信息 → 构建提示词 → 请求API → 解析响应 → 显示结果 → 写回数据
```

用户可以自定义这个管道的每个环节。

### 3.2 可读取的信息源 (Data Sources)

| 信息源ID | 名称 | 说明 | 参数 |
|---------|------|------|------|
| world | 世界信息 | 世界的所有设定 | - |
| worldState | 世界状态 | 当前时间、天气、氛围 | - |
| characters | 角色列表 | 所有角色的基本信息 | - |
| mainCharacter | 主角 | 当前世界的主角 | - |
| selectedCharacters | 选中角色 | 当前故事选中的角色 | - |
| tempCharacters | 临时角色 | 故事中生成的临时角色 | - |
| character | 指定角色 | 根据ID读取某个角色 | characterId |
| characterStats | 角色数值 | 所有角色的属性值 | - |
| characterProfiles | 角色档案 | 角色的详细设定 | - |
| relationships | 角色关系 | 角色之间的关系网络 | - |
| currentStory | 当前剧情 | 当前进行的故事 | - |
| storyHistory | 剧情历史 | 所有过去的故事 | count |
| storySummary | 剧情摘要 | 当前故事的摘要 | - |
| worldArchive | 世界存档 | 世界的历史记录 | type |
| time | 时间信息 | 当前世界时间 | - |
| task | 任务数据 | 任务系统状态 | - |
| inventory | 背包物品 | 角色的物品 | - |
| keywords | 关键词 | 世界关键词配置 | - |
| userInput | 用户输入 | 用户的当前输入 | - |
| context | 上下文 | 当前场景上下文 | - |
| apiResponse | API响应 | 上一次API返回结果 | - |

### 3.3 小助手配置结构

```javascript
// 小助手配置
{
  id: "assistant_xxx",
  name: "人设小助手",
  description: "根据故事内容更新角色档案",
  icon: "📝",
  color: "#3b82f6",
  
  // 读取配置 - 告诉小助手可以读取哪些信息
  read: {
    sources: ["world", "characters", "mainCharacter", "currentStory", "context"],
    params: {
      "character": { characterId: "mainCharacter" },
      "storyHistory": { count: 5 }
    },
    // 读取后如何处理
    process: {
      // 是否缓存，缓存时间
      cache: { enabled: true, ttl: 300000 },
      // 如何格式化读取的数据
      format: "json/text/template",
      template: "角色{{name}}的数值：{{stats}}"
    }
  },
  
  // 请求配置 - 如何构建API请求
  request: {
    enabled: true,
    // 系统提示词
    systemPrompt: `你是一个专业的故事分析师...`,
    // 用户提示词模板
    userPromptTemplate: `
【任务】
{{userInput}}

【世界背景】
{{world}}

【当前剧情】
{{currentStory}}

【角色信息】
{{characters}}
`,
    // 替换参数
    replacements: {
      userInput: "从交互中获取",
      world: "读取结果.world",
      currentStory: "读取结果.currentStory",
      characters: "读取结果.characters"
    },
    // API选项
    options: {
      model: "deepseek-chat",
      temperature: 0.7,
      maxTokens: 2000
    },
    // 响应解析方式
    parse: {
      type: "tag",  // json/tag/regex/custom
      // 标签解析配置
      tags: [
        { name: "角色描述", key: "description" },
        { name: "角色性格", key: "personality" },
        { name: "角色数值", key: "stats", format: "key:value" }
      ]
    }
  },
  
  // 显示配置 - 在哪里显示、如何显示
  display: {
    enabled: true,
    target: "modal",  // modal/sidebar/notification/panel/console/return/none
    options: {
      title: "分析结果",
      width: "500px",
      // 面板选择器（如果target是panel）
      selector: "#analysis-panel",
      // 通知类型（如果target是notification）
      type: "success",  // success/error/warning/info
      duration: 3000
    },
    // 自定义渲染函数
    render: function(content, results) {
      return `<div class="analysis-result">${content}</div>`;
    }
  },
  
  // 写入配置 - 可以修改哪些数据
  write: {
    enabled: true,
    actions: [
      {
        target: "character",
        trigger: "always",  // always/onCondition/manual
        params: {
          characterId: "mainCharacter",
          field: "dynamicProfile",
          value: "$parsed.description"
        }
      },
      {
        target: "characterStats",
        trigger: "onCondition",
        condition: "$parsed.stats",
        params: {
          characterId: "mainCharacter",
          statName: "$parsed.stats.name",
          value: "$parsed.stats.value"
        }
      },
      {
        target: "story",
        trigger: "onCondition",
        condition: "$parsed.diary",
        params: {
          title: "角色日记",
          content: "$parsed.diary"
        }
      }
    ]
  },
  
  // 交互配置 - 如何与用户交互
  interact: {
    mode: "none",  // none/button/form/select/confirm/prompt
    trigger: "auto",  // auto/manual/condition
    // 按钮模式
    button: {
      label: "更新档案",
      icon: "📝"
    },
    // 表单模式
    form: {
      fields: [
        { name: "focus", label: "关注点", type: "select", 
          options: ["性格变化", "数值变化", "关系发展", "全部"] }
      ]
    },
    // 选择模式
    select: {
      options: [
        { label: "更新数值", value: "stats" },
        { label: "更新描述", value: "description" },
        { label: "生成日记", value: "diary" }
      ]
    },
    // 确认模式
    confirm: {
      message: "确认更新角色档案？",
      onConfirm: "执行更新",
      onCancel: "取消"
    },
    // 输入模式
    prompt: {
      label: "请输入你想分析的内容",
      defaultValue: "分析当前场景"
    }
  },
  
  // 触发条件 - 什么时候运行
  triggers: [
    {
      event: "scene_generated",  // 场景生成后
      delay: 1000,  // 延迟ms
      condition: "assistant.enabled",  // 启用且
      priority: 10
    },
    {
      event: "story_ended",  // 故事结束时
      delay: 0,
      priority: 20
    },
    {
      event: "manual",  // 手动触发
      button: "触发分析"
    }
  ]
}
```

### 3.4 小助手模板市场

系统提供预设模板，用户可以：
- 直接使用模板
- 复制模板后修改
- 从零创建自定义小助手

```javascript
// 预设模板
const assistantTemplates = {
  // 故事生成小助手
  story: {
    name: "故事生成小助手",
    description: "生成故事场景和情节",
    read: { sources: ["world", "characters", "mainCharacter", "currentStory", "time"] },
    request: { 
      systemPrompt: "你是一个专业的小说作家...",
      userPromptTemplate: "根据以下信息生成故事..."
    },
    display: { target: "return" },
    write: { enabled: false },
    triggers: [{ event: "user_choice" }]
  },
  
  // 人设更新小助手
  profile: {
    name: "人设更新小助手",
    description: "根据故事内容更新角色档案",
    read: { sources: ["mainCharacter", "currentStory"] },
    request: { ... },
    display: { target: "notification" },
    write: { 
      enabled: true,
      actions: [
        { target: "character", params: {...} },
        { target: "characterStats", params: {...} }
      ]
    },
    triggers: [{ event: "scene_generated" }]
  },
  
  // 数值分析小助手
  stats: {
    name: "数值分析小助手",
    description: "分析并更新角色数值",
    read: { sources: ["characterStats", "currentStory"] },
    write: { 
      enabled: true,
      actions: [
        { target: "characterStats", params: {...} }
      ]
    },
    triggers: [{ event: "scene_generated" }]
  },
  
  // 时间管理小助手
  time: {
    name: "时间管理小助手",
    description: "跟踪和管理故事时间",
    read: { sources: ["time", "currentStory"] },
    write: { 
      enabled: true,
      actions: [
        { target: "time", params: {...} }
      ]
    }
  },
  
  // 日记生成小助手
  diary: {
    name: "日记生成小助手",
    description: "生成角色日记",
    read: { sources: ["mainCharacter", "currentStory"] },
    write: { 
      enabled: true,
      actions: [
        { target: "story", params: {...} }
      ]
    }
  },
  
  // 总结小助手
  summary: {
    name: "总结小助手",
    description: "生成故事总结和摘要",
    read: { sources: ["storyHistory"] },
    write: { enabled: false },
    triggers: [{ event: "story_ended" }]
  },
  
  // 任务小助手
  task: {
    name: "任务小助手",
    description: "管理故事中的任务",
    read: { sources: ["task", "currentStory"] },
    write: { 
      enabled: true,
      actions: [
        { target: "task", params: {...} }
      ]
    }
  }
};
```

### 3.5 小助手构建器界面

```javascript
// 小助手构建器的UI组件
{
  // 步骤1：基本信息
  basicInfo: {
    name: "输入名称",
    description: "输入描述",
    icon: "选择图标",
    color: "选择颜色"
  },
  
  // 步骤2：读取配置（信息源选择器）
  readConfig: {
    // 所有可用信息源
    availableSources: [...],
    // 已选信息源（可拖拽排序）
    selectedSources: [...],
    // 每个源的处理配置
    sourceSettings: {
      "character": { 
        params: { characterId: "mainCharacter" },
        format: "json"
      }
    }
  },
  
  // 步骤3：请求配置
  requestConfig: {
    systemPrompt: "编辑器",
    userPromptTemplate: "模板编辑器（支持变量替换）",
    options: { model, temperature, maxTokens },
    parseConfig: { type, tags }
  },
  
  // 步骤4：显示配置
  displayConfig: {
    target: "选择显示位置",
    options: {...}
  },
  
  // 步骤5：写入配置
  writeConfig: {
    // 可写入的目标
    availableTargets: [...],
    // 已配置的写入操作
    actions: [...]
  },
  
  // 步骤6：交互配置
  interactConfig: {
    mode: "选择交互模式",
    trigger: "选择触发方式",
    modeConfig: {...}
  },
  
  // 步骤7：触发条件
  triggerConfig: {
    events: [...],
    conditions: [...],
    priority: 10
  }
}
```

---

## 四、用户深度参与机制

### 4.1 参与方式

用户可以通过多种方式深度参与故事：

```javascript
// 用户参与类型
{
  // 1. 选择驱动 - 选择带来的分支
  choice: {
    type: "branch",
    options: 4,  // 每次提供4个选项
    style: "explicit",  // explicit(显式选项)/implicit(隐式选项+自由输入)
    allowCustom: true,  // 允许用户自定义输入
    // 选项生成方式
    generation: "ai",  // ai生成/预设/混合
    // 选项类型
    categories: [
      "exploration",  // 探索
      "interaction",  // 互动
      "combat",       // 冲突
      "development"  // 发展
    ]
  },
  
  // 2. 角色扮演 - 用户扮演角色
  roleplay: {
    enabled: true,
    // 可扮演的角色
    availableRoles: ["main", "selected", "any"],
    // 扮演模式
    mode: "dialogue",  // 对话/行动/混合
    // 自动生成后续
    autoContinue: true
  },
  
  // 3. 决策投票 - 用户群体决策
  vote: {
    enabled: true,
    // 投票问题
    question: "如何处理这个情况？",
    // 选项
    options: [...],
    // 投票后
    afterVote: "auto_continue"  // auto_continue/manual_continue
  },
  
  // 4. 实时反馈 - 对故事的反应
  feedback: {
    enabled: true,
    // 反馈类型
    types: ["emotion", "rating", "comment"],
    // 反馈处理
    onFeedback: "adapt_story"  // adapt_story/ignore/analyze_only
  },
  
  // 5. 世界修改 - 用户修改世界设定
  worldEdit: {
    enabled: true,
    // 可修改的内容
    allowed: ["item", "location", "event", "rule"],
    // 需要审批
    requireApproval: false,
    // 融入故事
    integrate: true
  },
  
  // 6. 提问系统 - 用户询问AI
  ask: {
    enabled: true,
    // 可提问的类型
    types: ["clarify", "character", "world", "suggest", "free"],
    // 回答方式
    answerIn: "modal",  // modal/inline/narration
    // 是否影响故事
    affectsStory: false
  }
}
```

### 4.2 参与深度等级

```javascript
// 用户参与深度等级
const participationLevels = {
  // 等级1：被动阅读
  level1: {
    name: "旁观者",
    description: "只是阅读AI生成的故事",
    features: ["阅读", "选择选项", "无自定义"]
  },
  
  // 等级2：选择驱动
  level2: {
    name: "参与者",
    description: "通过选择影响故事走向",
    features: ["阅读", "选择选项", "输入自定义", "角色扮演"]
  },
  
  // 等级3：深度互动
  level3: {
    name: "共创者",
    description: "与AI共同创作故事",
    features: ["阅读", "选择选项", "输入自定义", "角色扮演", 
               "修改世界", "实时反馈", "提问"]
  },
  
  // 等级4：完全主导
  level4: {
    name: "创世者",
    description: "完全主导故事走向",
    features: ["全部功能", "自定义剧情", "添加角色", 
               "修改规则", "设计结局"]
  }
};
```

### 4.3 参与界面设计

```javascript
// 故事参与界面
{
  // 底部输入区
  inputArea: {
    // 输入模式切换
    modes: ["choice", "roleplay", "free", "ask"],
    // 当前模式指示
    currentMode: "choice",
    // 选项网格
    choiceGrid: {
      columns: 2,
      showImages: false,
      showHints: true
    },
    // 自由输入
    freeInput: {
      placeholder: "输入你的选择或行动...",
      submitOnEnter: true,
      maxLength: 500
    },
    // 角色扮演
    roleplayInput: {
      characterSelect: true,
      showCharacterImage: true,
      dialogueOrAction: "both"
    }
  },
  
  // 侧边交互面板
  sidePanel: {
    // 角色状态
    characterStatus: {
      show: true,
      stats: ["欲望", "体力", "心情"],
      emotion: true
    },
    // 世界状态
    worldStatus: {
      show: true,
      time: true,
      location: true,
      weather: true
    },
    // 快速操作
    quickActions: [
      { label: "查看角色", action: "openCharacterPanel" },
      { label: "修改世界", action: "openWorldEdit" },
      { label: "提问", action: "openAskModal" },
      { label: "反馈", action: "openFeedback" }
    ]
  },
  
  // 顶部信息栏
  topBar: {
    // 剧情进度
    storyProgress: {
      show: true,
      type: "chapter",  // chapter/scene/choice
      label: "第1章"
    },
    // 当前场景
    currentScene: {
      show: true,
      elements: ["background", "mood", "participants"]
    }
  },
  
  // 浮动按钮
  floatingButtons: [
    { icon: "📖", label: "剧情概览", action: "showStoryOverview" },
    { icon: "👤", label: "角色", action: "showCharacterPanel" },
    { icon: "🌍", label: "世界", action: "showWorldPanel" },
    { icon: "💬", label: "反馈", action: "showFeedback" }
  ]
}
```

---

## 五、故事记忆体系

### 5.1 记忆层次结构

```javascript
// 记忆层次
{
  // 1. 瞬时记忆 - 当前场景
  immediate: {
    duration: "当前场景",
    content: "正在发生的剧情",
    capacity: "无限制",
    access: "快速"
  },
  
  // 2. 场景记忆 - 最近N个场景
  scene: {
    duration: "最近10个场景",
    content: "最近发生的事件",
    capacity: 10,
    access: "快速",
    // 用于构建下一个场景的上下文
    contextBuilding: true
  },
  
  // 3. 剧情记忆 - 当前故事的摘要
  episodic: {
    duration: "当前故事全程",
    content: "故事主线、关键事件、角色发展",
    capacity: "无限制",
    access: "中等",
    // 自动摘要频率
    autoSummary: "每3个场景"
  },
  
  // 4. 世界记忆 - 世界历史
  world: {
    duration: "世界存在期间",
    content: "所有故事、角色变化、世界改变",
    capacity: "无限制",
    access: "较慢",
    // 用于新故事的开头
    newStoryIntro: true
  }
}
```

### 5.2 记忆延续机制

```javascript
// 故事连接配置
{
  // 连接方式
  connectionType: "narrative",  // narrative(叙事衔接)/summary(摘要衔接)/independent(独立)
  
  // 叙事衔接 - 上一幕的直接延续
  narrative: {
    // 衔接文本模板
    introTemplate: "接着上次的故事，{{time}}...",
    // 可包含的元素
    include: {
      timePassage: true,      // 时间流逝说明
      location: true,         // 地点说明
      characterState: true,   // 角色状态
      pendingEvents: true,    // 待解决事件
      characterChanges: true  // 角色变化
    }
  },
  
  // 摘要衔接 - 使用故事摘要
  summary: {
    // 摘要长度
    summaryLength: 500,
    // 摘要内容
    include: {
      mainPlot: true,           // 主线
      keyEvents: true,          // 关键事件
      characterDevelopment: true, // 角色发展
      worldChanges: true,       // 世界变化
      unsolvedMysteries: true   // 未解之谜
    },
    // 摘要生成频率
    frequency: "everyScene"  // everyScene/everyChapter/manual
  },
  
  // 自动衔接判断
  autoConnect: {
    // 基于用户选择
    userChoice: true,
    // 基于时间间隔
    timeThreshold: 86400000,  // 24小时
    // 基于剧情进度
    storyProgress: "anyChapter"
  }
}
```

### 5.3 摘要生成

```javascript
// 智能摘要系统
{
  // 摘要类型
  types: {
    // 场景摘要 - 每个场景后生成
    scene: {
      length: 100,
      focus: ["发生了什么", "谁参与了"]
    },
    
    // 章节摘要 - 每个章节后生成
    chapter: {
      length: 300,
      focus: ["主线进展", "关键转折", "角色变化"]
    },
    
    // 故事摘要 - 故事结束后生成
    story: {
      length: 1000,
      focus: ["完整剧情", "角色弧光", "世界影响", "结局"]
    },
    
    // 世界摘要 - 定期更新
    world: {
      length: 2000,
      focus: ["历史事件", "势力变化", "重要角色命运"]
    }
  },
  
  // 摘要触发条件
  triggers: [
    { type: "scene", every: 3 },
    { type: "chapter", onEnd: true },
    { type: "story", onEnd: true },
    { type: "world", daily: true }
  ],
  
  // 摘要内容提取
  extraction: {
    // 关键事件提取
    keyEvents: {
      enabled: true,
      criteria: ["角色死亡", "重大决定", "关系变化", "获得/失去重要物品"]
    },
    
    // 角色变化追踪
    characterChanges: {
      enabled: true,
      track: ["性格", "数值", "关系", "位置"]
    },
    
    // 世界变化追踪
    worldChanges: {
      enabled: true,
      track: ["新角色出现", "地点变化", "规则改变", "势力消长"]
    }
  }
}
```

### 5.4 记忆检索

```javascript
// 记忆检索系统
{
  // 检索方式
  methods: {
    // 语义检索 - 基于含义
    semantic: {
      enabled: true,
      // 使用向量相似度
      similarity: 0.7,
      // 返回数量
      topK: 5
    },
    
    // 关键词检索
    keyword: {
      enabled: true,
      // 提取关键词
      extract: true,
      // 模糊匹配
      fuzzy: true
    },
    
    // 时间检索 - 基于时间范围
    timeRange: {
      enabled: true,
      // 支持相对时间
      relative: true  // "上次见面时", "昨天"
    },
    
    // 角色检索 - 基于角色
    character: {
      enabled: true,
      // 角色的所有相关记忆
      allRelated: true
    }
  },
  
  // 检索结果处理
  resultProcessing: {
    // 去重
    deduplicate: true,
    // 排序
    sortBy: "relevance",  // relevance/time/importance
    // 合并策略
    merge: "intelligent"  // none/simple/intelligent
  }
}
```

---

## 六、角色动态体系

### 6.1 角色分类

```javascript
// 角色类型
{
  // 主角 - 用户扮演或代入的角色
  protagonist: {
    isMain: true,
    isFixed: true,  // 不可删除
    // 基本设定（不变）
    fixedProfile: {
      name: "主角",
      appearance: "...",
      background: "...",
      personality: "...",
      goals: "...",
      fears: "..."
    },
    // 动态设定（随故事变化）
    dynamicProfile: {
      currentState: {...},
      relationships: [...],
      development: {...}
    },
    // 数值
    stats: [
      { name: "体力", value: 100, max: 100 },
      { name: "智慧", value: 50, max: 100 }
    ],
    // 命运
    fate: {
      locked: false,  // 是否锁定结局
      progress: 0
    }
  },
  
  // 固定配角 - 世界观自带的角色
  fixed: {
    isMain: false,
    isFixed: true,
    isTemporary: false,
    // 有完整设定
    fixedProfile: {...},
    // 可能有动态变化
    dynamicProfile: {...},
    // 命运可能与主线相关
    fate: {...}
  },
  
  // 临时角色 - 故事中自动生成
  temporary: {
    isMain: false,
    isFixed: false,
    isTemporary: true,
    // 临时的基本设定
    fixedProfile: {
      name: "酒保",
      role: "NPC",
      description: "酒吧的调酒师"
    },
    // 动态设定
    dynamicProfile: {...},
    // 生命周期
    lifecycle: {
      created: "第一次出现时",
      updated: "每次出现时",
      deleted: "场景结束N分钟后"  // 自动清理
    }
  }
}
```

### 6.2 角色动态系统

```javascript
// 角色动态更新
{
  // 更新触发
  triggers: [
    { event: "scene_generated", action: "updateState" },
    { event: "character_speaks", action: "updateEmotion" },
    { event: "choice_made", action: "updateRelationship" }
  ],
  
  // 状态更新
  state: {
    // 位置跟踪
    location: {
      track: true,
      history: 10,  // 保留最近10个位置
      // 更新时机
      updateOn: ["scene_start", "movement"]
    },
    
    // 情绪跟踪
    emotion: {
      track: true,
      // 情绪类型
      types: ["开心", "悲伤", "愤怒", "恐惧", "惊讶", "厌恶"],
      // 当前情绪
      current: "中性",
      // 情绪历史
      history: [...],
      // 情绪变化原因
      reasons: [...]
    },
    
    // 状态效果
    effects: {
      // 如"醉酒"、"中毒"等
      active: [],
      // 持续时间
      duration: true
    }
  },
  
  // 关系系统
  relationships: {
    // 关系类型
    types: ["friend", "enemy", "lover", "rival", "neutral"],
    // 关系强度
    levels: [-100, -50, 0, 50, 100],
    // 关系变化追踪
    changes: [
      {
        character: "角色B",
        type: "friend",
        from: 30,
        to: 60,
        reason: "帮助了她",
        timestamp: "..."
      }
    ]
  },
  
  // 数值变化
  stats: {
    // 变化规则
    rules: [
      {
        stat: "欲望",
        change: "analyze",  // analyze(分析得到)/fixed(固定值)/formula(公式)
        // 如果是analyze，会从故事中提取
      }
    ],
    // 变化历史
    history: true,
    // 最大/最小值
    min: 0,
    max: 100,
    // 临界点事件
    thresholds: [
      { stat: "理智", value: 0, event: "角色崩溃" }
    ]
  }
}
```

### 6.3 自动角色生成

```javascript
// 临时角色自动生成
{
  // 生成触发
  triggers: [
    { event: "new_scene", condition: "需要新角色", chance: 0.3 },
    { event: "story_start", condition: "需要路人角色", count: 3 }
  ],
  
  // 生成配置
  generation: {
    // 角色类型池
    pools: [
      { type: "shopkeeper", weight: 30 },
      { type: "passerby", weight: 30 },
      { type: "service_staff", weight: 20 },
      { type: "authority", weight: 10 },
      { type: "mysterious", weight: 10 }
    ],
    
    // 生成参数
    params: {
      // 名字来源
      nameSource: "random",  // random/ai/world_list
      // 年龄范围
      ageRange: [18, 60],
      // 外观描述
      appearance: "based_on_scene",  // based_on_scene/ai_generate/random
      // 性格
      personality: "random_compatible",  // random/ai_generate/compatible_with_scene
      // 与主角关系
      relationToMain: "neutral"
    },
    
    // 场景适配
    sceneAdapt: {
      // 角色符合当前场景
      match: true,
      // 差异化
      diversity: true
    }
  },
  
  // 生命周期管理
  lifecycle: {
    // 首次出现
    onAppear: {
      // 生成基本设定
      generateProfile: true,
      // 场景描述
      describeInScene: true
    },
    
    // 后续出现
    onReappear: {
      // 记忆之前互动
      rememberPast: true,
      // 更新状态
      updateState: true
    },
    
    // 消失条件
    onDisappear: {
      // 场景结束N分钟后
      afterSceneEnd: 300000,  // 5分钟
      // 手动删除
      manualDelete: true,
      // 保留条件
      keepIf: ["important", "recurring", "user_favorite"]
    },
    
    // 自动清理
    autoCleanup: {
      // 清理策略
      strategy: "least_recent",  // least_recent/least_important/manual
      // 保留数量
      keepCount: 20,
      // 保留最近N个场景的
      keepRecent: 10
    }
  }
}
```

---

## 七、引导体系

### 7.1 引导目标

```javascript
// 引导系统目标
{
  // 核心目标
  core: {
    // 自由与方向的平衡
    balance: {
      freedom: 70,  // 70%自由
      direction: 30  // 30%方向引导
    },
    
    // 用户主导
    userDriven: {
      // 用户选择优先
      choiceFirst: true,
      // AI建议而非决定
      aiAsAdvisor: true
    }
  },
  
  // 引导类型
  types: {
    // 1. 目标引导 - 告诉用户可以做什么
    goal: {
      // 当前目标
      currentGoals: [
        { text: "探索城市", status: "active" },
        { text: "建立势力", status: "pending" }
      ],
      // 目标提示
      hints: ["你可以去酒吧打听消息", "或去找之前的接头人"]
    },
    
    // 2. 上下文引导 - 基于当前情况
    context: {
      // 场景建议
      sceneSuggestions: [
        "这个情况你有几个选择"
      ],
      // 角色反应
      characterReactions: true
    },
    
    // 3. 知识引导 - 提供世界观信息
    knowledge: {
      // 可探索内容
      explorable: [
        { type: "location", name: "酒吧", hint: "可以打听到情报" },
        { type: "character", name: "神秘女子", hint: "似乎知道一些内幕" }
      ],
      // 知识解锁
      unlockOn: ["first_visit", "specific_choice", "achievement"]
    },
    
    // 4. 创意引导 - 激发用户想象力
    creative: {
      // 创意提示
      prompts: [
        "如果你想尝试不同的方式...",
        "还有一个大胆的想法..."
      ],
      // 鼓励创新
      encourageNovelty: true
    }
  }
}
```

### 7.2 引导界面

```javascript
// 引导界面组件
{
  // 1. 探索提示 - 侧边栏
  explorationPanel: {
    position: "right",
    width: 250,
    sections: [
      {
        type: "goals",
        title: "当前目标",
        items: [...]
      },
      {
        type: "hints",
        title: "线索提示",
        items: [...],
        collapsible: true
      },
      {
        type: "explorable",
        title: "可探索",
        items: [...]
      }
    ]
  },
  
  // 2. 场景提示 - 浮动
  sceneHint: {
    // 出现位置
    position: "bottom-right",
    // 显示条件
    showOn: ["new_scene", "user_confused", "choice_timeout"],
    // 内容
    content: {
      text: "你可以...",
      actions: [
        { label: "查看角色", action: "showCharacters" },
        { label: "查看地图", action: "showMap" },
        { label: "查看目标", action: "showGoals" }
      ]
    }
  },
  
  // 3. 新手引导 - 首次使用
  tutorial: {
    steps: [
      {
        target: "#start-story",
        content: "点击开始你的第一个故事",
        position: "bottom"
      },
      {
        target: "#character-select",
        content: "选择你想参与的角色",
        position: "right"
      }
    ],
    // 跳过选项
    skippable: true,
    // 重置选项
    resettable: true
  },
  
  // 4. 成就系统 - 引导探索
  achievements: {
    // 显示位置
    position: "top-bar",
    // 条件触发
    triggers: [
      { condition: "first_story", reward: "探索者徽章" },
      { condition: "all_characters_met", reward: "社交达人徽章" }
    ]
  }
}
```

### 7.3 智能引导

```javascript
// 智能引导系统
{
  // 用户状态判断
  userState: {
    // 检测用户是否困惑
    confused: {
      // 表现
      signs: [
        "长时间不选择",
        "反复回到之前的选择",
        "频繁查看帮助"
      ],
      // 应对
      response: "show_hints"
    },
    
    // 检测用户是否无聊
    bored: {
      signs: [
        "快速跳过内容",
        "重复相同选择",
        "不使用可选功能"
      ],
      response: "increase_interest"
    },
    
    // 检测用户是否投入
    engaged: {
      signs: [
        "详细阅读",
        "尝试各种选项",
        "使用高级功能"
      ],
      response: "deeper_content"
    }
  },
  
  // 自适应引导
  adaptive: {
    // 基于用户行为调整
    adjust: {
      // 引导频率
      frequency: "user_level_based",
      // 引导详细程度
      detailLevel: "progressive",
      // 引导方式
      style: "context_aware"
    },
    
    // 学习用户偏好
    learn: {
      // 记录用户选择模式
      choicePatterns: true,
      // 推断用户兴趣
      inferInterests: true,
      // 优化建议
      optimizeSuggestions: true
    }
  }
}
```

---

## 八、自由与自定义

### 8.1 自定义维度

```javascript
// 全方位自定义
{
  // 1. 世界自定义
  world: {
    // 基础设定
    settings: {
      background: "可编辑",
      worldview: "可编辑",
      rules: "可编辑",
      keywords: "可编辑",
      tone: "可选择"
    },
    // 剧情线
    plotlines: {
      main: "可编辑/添加/删除",
      side: "可编辑/添加/删除",
      hidden: "可编辑/添加/删除"
    },
    // 初始状态
    initialState: {
      time: "可设置",
      location: "可添加",
      characters: "可导入/创建"
    }
  },
  
  // 2. 角色自定义
  character: {
    // 创建角色
    create: {
      // 基本信息
      basic: ["名字", "年龄", "外观"],
      // 背景故事
      background: "自由编辑",
      // 性格设定
      personality: "可选择标签/自由描述",
      // 数值
      stats: "可自定义数值体系",
      // 命运
      fate: "可设定结局条件"
    },
    
    // 导入导出
    importExport: {
      format: "json",
      share: true
    }
  },
  
  // 3. 剧情自定义
  story: {
    // 开始方式
    start: {
      // 自动生成
      autoGenerate: true,
      // 模板选择
      templates: true,
      // 完全自定义
      custom: true
    },
    
    // 流程控制
    flow: {
      // 场景数量
      sceneLimit: "无限制",
      // 分支数量
      branchLimit: "无限制",
      // 结局数量
      endingLimit: "无限制"
    },
    
    // 存档管理
    archive: {
      // 手动存档
      manual: true,
      // 自动存档频率
      autoSave: "每个场景",
      // 云同步（未来）
      cloud: false
    }
  },
  
  // 4. 小助手自定义
  assistant: {
    // 所有组件可自定义
    allConfigurable: true,
    // 预设模板
    templates: true,
    // AI辅助创建
    aiHelper: true,
    // 分享小助手
    share: true
  },
  
  // 5. 界面自定义
  interface: {
    // 主题
    theme: {
      // 预设主题
      presets: ["light", "dark", "sepia", "custom"],
      // 自定义颜色
      customColors: true,
      // 字体
      font: "可选择/上传"
    },
    
    // 布局
    layout: {
      // 预设布局
      presets: ["classic", "immersive", "minimal"],
      // 组件开关
      components: {
        "topBar": true,
        "sidePanel": true,
        "inputArea": true,
        "characterPanel": true
      },
      // 组件位置
      positions: "可拖拽调整"
    },
    
    // 快捷键
    shortcuts: {
      customizable: true,
      presets: true
    }
  }
}
```

### 8.2 预设与模板

```javascript
// 预设系统
{
  // 世界预设
  worldPresets: [
    {
      id: "fantasy",
      name: "奇幻世界",
      description: "剑与魔法的世界",
      settings: {...}
    },
    {
      id: "scifi",
      name: "科幻世界",
      description: "未来科技世界",
      settings: {...}
    },
    {
      id: "modern",
      name: "现代都市",
      description: "当代都市背景",
      settings: {...}
    },
    {
      id: "history",
      name: "历史",
      description: "历史时期背景",
      settings: {...}
    },
    {
      id: "blank",
      name: "空白",
      description: "从零开始",
      settings: {...}
    }
  ],
  
  // 角色模板
  characterTemplates: [
    {
      id: "warrior",
      name: "战士",
      stats: { "体力": 80, "力量": 90, "智慧": 30 }
    },
    {
      id: "mage",
      name: "法师",
      stats: { "体力": 30, "力量": 20, "智慧": 95 }
    }
  ],
  
  // 剧情模板
  storyTemplates: [
    {
      id: "adventure",
      name: "冒险之旅",
      structure: "探索→挑战→成长→结局"
    },
    {
      id: "mystery",
      name: "悬疑推理",
      structure: "案发→调查→线索→推理→真相"
    },
    {
      id: "romance",
      name: "恋爱养成",
      structure: "相遇→了解→发展→告白→结局"
    }
  ],
  
  // 界面主题
  themes: [
    { id: "light", name: "明亮", colors: {...} },
    { id: "dark", name: "暗黑", colors: {...} },
    { id: "sepia", name: "复古", colors: {...} }
  ]
}
```

---

## 九、技术实现

### 9.1 核心模块

```javascript
// 核心模块列表
const modules = {
  // 世界管理
  WorldManager: {
    // 创建世界
    create: (config) => {...},
    // 加载世界
    load: (id) => {...},
    // 保存世界
    save: (world) => {...},
    // 删除世界
    delete: (id) => {...},
    // 导入导出
    export: (id) => {...},
    import: (data) => {...}
  },
  
  // 剧情引擎
  StoryEngine: {
    // 开始剧情
    start: (worldId, config) => {...},
    // 生成下一场景
    nextScene: (choice) => {...},
    // 结束剧情
    end: () => {...},
    // 存档读档
    save: () => {...},
    load: (id) => {...}
  },
  
  // 小助手引擎
  AssistantEngine: {
    // 创建小助手
    create: (config) => {...},
    // 运行小助手
    run: (assistantId, context) => {...},
    // 触发器管理
    trigger: (event, data) => {...}
  },
  
  // 记忆引擎
  MemoryEngine: {
    // 存储
    store: (type, data) => {...},
    // 检索
    recall: (query) => {...},
    // 摘要
    summarize: (type, scope) => {...},
    // 延续
    connect: (previousStoryId) => {...}
  },
  
  // 角色引擎
  CharacterEngine: {
    // 创建角色
    create: (config) => {...},
    // 更新角色
    update: (characterId, updates) => {...},
    // 生成临时角色
    generateTemp: (scene) => {...},
    // 清理临时角色
    cleanup: () => {...}
  },
  
  // 时间引擎
  TimeEngine: {
    // 更新时间
    update: (delta) => {...},
    // 设置时间
    set: (time) => {...},
    // 格式化
    format: () => {...}
  },
  
  // 交互引擎
  InteractionEngine: {
    // 处理选择
    handleChoice: (choice) => {...},
    // 处理角色扮演
    handleRoleplay: (input) => {...},
    // 处理用户反馈
    handleFeedback: (feedback) => {...}
  }
};
```

### 9.2 数据存储

```javascript
// 数据存储策略
{
  // localStorage
  local: {
    // 世界数据
    worlds: "worlds_v1",
    // 角色数据
    characters: "characters_v1",
    // 剧情数据
    stories: "stories_v1",
    // 小助手配置
    assistants: "assistants_v1",
    // 用户设置
    settings: "settings_v1",
    // 缓存
    cache: "cache_v1"
  },
  
  // 存储优化
  optimization: {
    // 压缩
    compress: true,
    // 懒加载
    lazyLoad: true,
    // 清理策略
    cleanup: {
      // 清理超过30天的临时数据
      tempData: 30 * 24 * 60 * 60 * 1000,
      // 清理超过100个的临时角色
      tempCharacters: 100
    }
  }
}
```

---

## 十、界面设计（不使用当前UI）

### 10.1 设计原则

- **沉浸式**: 减少干扰元素，专注故事内容
- **简洁**: 每个界面只显示必要信息
- **可定制**: 用户可以调整界面布局
- **响应式**: 适配不同屏幕尺寸

### 10.2 主要界面

```
┌────────────────────────────────────────────────────────────┐
│  [≡]  淫猎都市 - 第一章    [⚙]  [?]           ─ □ ×      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │           故事内容区域（沉浸式显示）                 │  │
│  │                                                      │  │
│  │     你走在繁华的街道上，霓虹灯闪烁...               │  │
│  │                                                      │  │
│  │     [神秘女子]                                       │  │
│  │     "这个人看起来不简单..."                          │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  场景提示：夜晚的酒吧街，可能有重要情报             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ☐ 前往酒吧打探消息    ☐ 跟踪神秘女子               │  │
│  │  ☐ 回家休息            ☐ [自定义输入...]            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘

（侧边栏可展开）
┌─────┐
│角色  │
│时间  │
│目标  │
│探索  │
└─────┘
```

---

## 十一、总结

这个重新设计方案实现了：

1. **不同世界不同剧情**: 每个世界有独立的剧情线系统
2. **高度自定义小助手**: 用户可以完全控制读取、请求、显示、写入、交互
3. **用户深度参与**: 多层次的参与方式，从被动阅读到完全主导
4. **新界面设计**: 沉浸式故事体验，减少干扰
5. **故事记忆延续**: 跨剧情的记忆系统，保证连贯性
6. **动态角色体系**: 主角保留基本设定，配角自动生成和清理
7. **智能引导**: 自适应用户状态，提供合适引导
8. **完全自由**: 所有内容都可自定义

这个系统将给用户极大的自由度，同时通过智能引导确保用户体验不会迷失方向。
