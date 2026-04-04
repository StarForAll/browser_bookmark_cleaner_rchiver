# PLAN-01A 方案文档

## 目标

在纯 `plan` 阶段，把 `tmp/ui/` 参考资产可继承的视觉规则、页面结构和交互语气提炼出来，供后续真实实现参考，同时明确哪些内容绝对不能复用。

## 当前定位

- 当前阶段：`plan`
- 当前文档性质：视觉与交互约束方案，不代表已经开始实现 UI
- 当前允许产物：页面结构规则、视觉规则、交互优先级、禁止复用清单
- 当前禁止产物：从 `tmp/ui/` 复制任何代码、样式、组件、工具函数或依赖清单

## 输入依据

- [prototype-validation.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/prototype-validation.md)
- [visual-direction.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/visual-direction.md)
- [workspace.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/pages/workspace.md)
- [visual-system.md](/ops/projects/personal/browser_bookmark_cleaner_rchiver/.trellis/tasks/04-02-workflow-e2e-bookmark-cleaner/design/specs/visual-system.md)
- [tmp/ui/metadata.json](/ops/projects/personal/browser_bookmark_cleaner_rchiver/tmp/ui/metadata.json)

## 设计参考资产结论

`tmp/ui` 提供的可信信息只有这些：

- 视觉氛围：
  - calm
  - editorial
  - tactile
  - curated
- 空间组织：
  - 画布居中
  - 工具区次级
  - 状态区弱化
- 交互语气：
  - 面向专注整理，而不是面向后台管理

`tmp/ui` 不提供这些可信信息：

- 真实技术栈基线
- 可直接复用的组件实现
- 可直接复用的 CSS / Tailwind / utility
- 可直接复用的依赖清单
- 可直接复用的扩展入口结构

## 复用边界

### 允许继承

- 氛围关键词
- 页面分区顺序
- 控件显著性排序
- 色彩方向
- 中文界面下的信息密度目标
- 图谱画布始终为视觉中心的原则

### 禁止继承

- `tmp/ui/src/**`
- `tmp/ui/package.json`
- `tmp/ui/vite.config.ts`
- `tmp/ui/tsconfig.json`
- `tmp/ui/src/lib/utils.ts`
- 任意现成 class 名、组件拆分方式、状态写法、工具函数写法

## 规划冻结项

### 1. 氛围关键词

- editorial workspace
- calm premium productivity
- focused calm
- tactile depth
- quiet density

### 2. 页面视觉主次

主次顺序必须固定为：

1. 图谱画布
2. 节点与悬浮信息面
3. 顶部动作区与搜索区
4. 左下角操作提示区
5. 右下角结果历史区

规则：

- 任何辅助区都不能压过画布
- 顶部动作区必须清楚，但不能做成“管理后台主导航”
- 结果历史区只能承担反馈，不承担主操作

### 3. 色彩方向

- v1 只采用 warm-light 方向
- 基底是 warm off-white / paper-like neutral
- 强调色用 muted blue-gray / muted blue-green
- 高风险动作用清晰但克制的 warning contrast

必须避免：

- 紫色主导
- 纯白扁平企业后台风
- 过饱和霓虹高亮

### 4. 排版方向

- 中文文案是第一公民
- 标题应更像“策展型工作区”而不是通用 SaaS 后台
- 正文字号和密度要支撑高信息密度
- 组件宽度要预留未来更长的英文文案空间

### 5. 页面结构冻结

工作区必须包含：

- 顶部 shell
- 搜索与聚焦条
- 图谱画布
- 左下角操作提示区
- 右下角结果区

这五块是结构冻结项，后续实现时不能因为局部样式偏好而打散。

### 6. 七个显式动作按钮

顶部动作区必须直接暴露这七类动作：

1. 从浏览器覆盖当前草稿
2. 同步当前草稿到浏览器书签
3. 上传当前草稿到 WebDAV
4. 上传当前浏览器书签到 WebDAV
5. 下载 WebDAV 草稿版本到当前草稿
6. 下载 WebDAV 书签版本并覆盖浏览器书签
7. 撤销覆盖操作

约束：

- 用户只看按钮文本就能理解含义
- 不依赖额外说明气泡才知道按钮是做什么的
- 不要求额外分组，但允许通过视觉层级弱化次级按钮

### 7. 状态反馈语气

- 结果只在动作完成后出现
- 成功反馈弱于确认弹窗
- 失败反馈必须可读
- 高风险覆盖动作的确认强度高于普通上传动作

### 8. 空态语气

- 空数据时不渲染成“出错”
- 要表达“当前浏览器没有书签数据，但仍可继续编辑草稿”
- 空态不是营销页，不需要额外鼓励式语言

## 未来执行时的文档回写点

后续真正执行 `PLAN-01A` 或其下游实现时，优先回写这些文档，而不是直接去写 UI 代码：

- `design/pages/visual-direction.md`
- `design/pages/workspace.md`
- `design/specs/visual-system.md`

必要时再扩展到：

- 其他页面级设计文档
- 组件清单文档

## 非目标

- 不定义精确像素值
- 不锁定具体字体文件
- 不创建视觉 token 文件
- 不创建 React 组件
- 不创建 CSS 或 Tailwind 配置
- 不决定节点组件的具体 DOM 结构

## 执行门禁

后续只有在用户明确说“开始执行 PLAN-01A”或“开始落地 UI 基线”后，才允许把这些规则转成实现文件。

如果当前回合目标仍是“继续 plan”，则默认只允许：

- 改方案文档
- 改设计文档
- 改任务计划文档

## 验收口径

在纯 `plan` 阶段，`PLAN-01A` 只检查这些问题：

- 是否说清楚了哪些视觉特征可继承
- 是否说清楚了哪些代码和实现绝对不可复用
- 是否说清楚了工作区五大结构区
- 是否说清楚了视觉主次关系
- 是否说清楚了七个显式动作按钮的表达要求

不检查这些问题：

- 页面是否已实现
- 样式是否已落地
- 交互是否已可点击
- 扩展是否已可加载

## 风险与防误用

- 最大风险是把 `tmp/ui` 错当成“现成前端基线”
- 第二风险是只继承“看起来高级”的样式，忽略工作区主次和动作语义
- 第三风险是把视觉参考的英文品牌语气直接带入中文产品界面

防误用规则：

- 引用 `tmp/ui` 时，只允许使用“参考资产”“视觉参考”“氛围参考”这类说法
- 不能使用“基于 tmp/ui 改造”这类容易诱导代码复用的说法
- 任何实现阶段若出现从 `tmp/ui` 复制代码的倾向，应立即停止并回到设计约束层
