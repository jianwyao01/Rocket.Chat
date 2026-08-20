# PM 功能测试图集（atlas）

合并 01–11 文档-only 分册后的索引。**不改产品代码。** 基线 `develop` `e10bd504b9`。本工作从 `cursor/pm-atlas-merge-blueprint-d43d`（00–05 / PR #5）拼入 06–11。

## 文件

| 文件 | 内容 |
| --- | --- |
| [00-blueprint.md](00-blueprint.md) | **用户向交付物**：拼接 01–11 全部 8 列功能行 + 待渲染 UNION + 完备性 + OOS + id 差（06–11 NEW）+ i18n 反查 + 分册冲突 |
| [01-message-toolbar.md](01-message-toolbar.md) | 消息工具栏 / `MessageActionContext`（[PR #2](https://github.com/jianwyao01/Rocket.Chat/pull/2)） |
| [02-room-user-nav.md](02-room-user-nav.md) | 房间工具箱 / 用户卡 / 顶栏 / 侧栏（[PR #1](https://github.com/jianwyao01/Rocket.Chat/pull/1)） |
| [03-composer-implicit.md](03-composer-implicit.md) | Composer + 房间隐式交互（[PR #4](https://github.com/jianwyao01/Rocket.Chat/pull/4)） |
| [04-routes-and-shell.md](04-routes-and-shell.md) | 路由目的地与壳层页（[PR #3](https://github.com/jianwyao01/Rocket.Chat/pull/3)） |
| [05-completeness.md](05-completeness.md) | views/ 完备性、i18n 抽样方法、OOS 量级（同 PR #3） |
| [06-room-panel-interiors.md](06-room-panel-interiors.md) | 房间面板内部（打开 Members/Files/… 之后）（[PR #9](https://github.com/jianwyao01/Rocket.Chat/pull/9)） |
| [07-page-interiors.md](07-page-interiors.md) | 创建模态 / 账号 / Directory / Home / Admin / Audit 页内控件（[PR #10](https://github.com/jianwyao01/Rocket.Chat/pull/10)） |
| [08-omnichannel-product.md](08-omnichannel-product.md) | 全渠道坐席 / 经理 / 访客 widget（[PR #8](https://github.com/jianwyao01/Rocket.Chat/pull/8)） |
| [09-marketplace-product.md](09-marketplace-product.md) | 市场列表与每应用动作（同 PR #8） |
| [10-message-timeline.md](10-message-timeline.md) | 消息时间线正文（非工具栏）（[PR #7](https://github.com/jianwyao01/Rocket.Chat/pull/7)） |
| [11-composer-states.md](11-composer-states.md) | Composer 状态机（把 03 入口炸开）（[PR #6](https://github.com/jianwyao01/Rocket.Chat/pull/6)） |
| [14-account-gaps.md](14-account-gaps.md) | 账号操作缺口：对照 04 `account.*` + 07 全部 `page.account.*`，NEW `account.gap.*` |

05 不新建功能 id。分册原文除机械碰撞外未改（本合并精确 id 碰撞为 0）。

## 如何回放（随机 10 行，跨入口 + 内部）

评审员必须能抽出 **10 行且同时覆盖入口层与内部层**，不要 10 条都是「打开 X」。

1. 打开 [00-blueprint.md](00-blueprint.md)。
2. **入口层（01–04）抽 4–5 行**：例如 `msg.quote`、`nav.create.channel`、`composer.send`、`route.omnichannel`。按「完整入口点击序列」走到控件。
3. **内部层（06–11）抽 5–6 行**，并且尽量跟入口成对：
   - 02 `room.toolbox.members-list` → 06 `room.members.add.submit`
   - 02 `nav.create.channel` → 07 `page.create.channel.name` / `page.create.channel.submit`
   - 04 `route.omnichannel` → 08 `omni.agent.queue.take` 或 `omni.manager.departments.create`
   - 04 `route.marketplace` → 09 `mkt.app.enable`
   - 01 `msg.reaction.add` → 10 `tl.reaction.toggle`
   - 03 `composer.send` → 11 `composer.state.send.disabled.empty` 或 `composer.state.send.enter`
4. 核「触发后果三件套」：(1) 哪个元素 role+name 出现/消失 (2) 哪个 endpoint (3) 刷新后还在什么。
5. 对不上的记回该 id 的 `[待渲染实测]`，不要改产品代码来迁就文档。
6. 抽到 alias（见 00「分册冲突 / canonical aliases」）时按 canonical 行回放；「都留」则按该行自己的入口走。

## 分册计数

禁止把下面收成一个「总功能」标题。数字是**表体行**或**去重 id**，命令写在旁边。

| 分册 | 表体行 | 去重稳定 id | 命令 |
| --- | --- | --- | --- |
| 01 | 193 | 26 | `rg -c '^\| msg\.' docs/qa/pm-feature-atlas/01-message-toolbar.md` → 193（含 B/C 复行）；去重：`rg -o '^\| msg\.[a-z0-9.-]+' docs/qa/pm-feature-atlas/01-message-toolbar.md \| sort -u \| wc -l` → 26 |
| 02 | 107 | 107 | `rg -c '^\| (room\|user\|nav\|sidebar)\.' docs/qa/pm-feature-atlas/02-room-user-nav.md` → 107 |
| 03 | 117 | 117 | `rg -c '^\| `' docs/qa/pm-feature-atlas/03-composer-implicit.md` → 117 |
| 04 | 64 | 64 | `rg -c '^\| `route\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 50；`account` 9；`directory` 4；`team` 1；`50+9+4+1=64` |
| 06 | 306 | 306 | `rg -c '^\| (room\.\|sidebar\.roomMenu\.)' docs/qa/pm-feature-atlas/06-room-panel-interiors.md` → 306 |
| 07 | 623 | 623 | `rg -c '^\| `page\.[^`*]+\`' docs/qa/pm-feature-atlas/07-page-interiors.md` → 623（裸 `page.` 会把验算表 41 条 `page.*.*` 算进去 → 664） |
| 08 | 136 | 136 | `rg -c '^\| `omni\.agent\.' …/08-omnichannel-product.md` → 39；`omni.manager` 82；`omni.widget` 15；`39+82+15=136` |
| 09 | 29 | 29 | `rg -c '^\| `mkt\.explore\.[a-z]' …/09-marketplace-product.md` → 5；`installed` 5；`request` 1；`app` 18；`5+5+1+18=29` |
| 10 | 72 | 72 | `rg -c '^\| tl\.' docs/qa/pm-feature-atlas/10-message-timeline.md` → 72 |
| 11 | 133 | 133 | `rg -c '^\| `composer\.(state\|fmt\|popup)\.' docs/qa/pm-feature-atlas/11-composer-states.md` → 133 |

### 验算（只证明没丢表，不是对外总功能数）

先前 00（01–04）表体：`193+107=300`；`300+117=417`；`417+64=481`。去重 id：`26+107=133`；`133+117=250`；`250+64=314`。

NEW 06–11 表体/去重 id：`306+623=929`；`929+136=1065`；`1065+29=1094`；`1094+72=1166`；`1166+133=1299`。

写入 00 的 8 列表体（含 01 B/C 复行）：`481+306=787`；`787+623=1410`；`1410+136=1546`；`1546+29=1575`；`1575+72=1647`；`1647+133=1780`。

05 不新建功能 id。`ls -1 apps/meteor/client/views/ | wc -l` → 27，00 完备性表 27 行立场。Omni / marketplace **不再** sidebar-only OOS（08/09）。Admin settings 仍是组级，不是 972 key。

## 诚实标记

`[读]` 源码推断；`[待渲染实测]` 未挂真实 UI。相对先前本分支 00，NEW id 只在 06–11（见 00「与现行 atlas 的 id 集合差」）。
