# Animation Plan

## 已接入资产

当前工程使用 `src/assets/spritesheet.png`：

- 8 列
- 11 行
- 单帧 192 × 208
- RGBA 透明背景

状态映射：

- `idle`
- `running-right`
- `running-left`
- `waving`
- `jumping`
- `failed`
- `waiting`
- `running`
- `review`
- `look-000-to-157.5`
- `look-180-to-337.5`

## 分工建议

本工程负责：

- 待机、点击、聊天等待、成功、失败等高频基础动作。
- 动作状态机、打断逻辑、透明窗口内播放。
- 后续新帧的导入和统一锚点。

Lovart 或专业设计平台负责：

- 生日庆祝短片。
- 入睡、醒来、惊喜等高表现转场。
- 更复杂的连续动作，例如绕屏走动、拿出礼物、特殊节日互动。

导入标准：

- 透明 PNG 序列优先。
- 固定画布和 bottom-center 锚点。
- 每组 6-12 帧为宜。
- 命名统一：`state_name_000.png`。
