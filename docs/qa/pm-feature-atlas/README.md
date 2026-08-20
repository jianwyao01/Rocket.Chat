# PM 功能测试图集（atlas）

合并 01–16 文档-only 分册后的索引。**不改产品代码。** 基线 `develop` `e10bd504b9`。本工作从 `cursor/pm-atlas-merge-06-11-f8ed`（00–11 / PR #11）拼入 12–16。

## 文件

| 文件 | 内容 |
| --- | --- |
| [00-blueprint.md](00-blueprint.md) | **用户向交付物**：拼接 01–14 / 16 全部 8 列功能行 + 待渲染 UNION + 完备性 + OOS + id 差（12–16 NEW）+ i18n 反查 / 必须补行裁决 + `## 仍必须补` empty + 分册冲突 |
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
| [12-chat-micro-gaps.md](12-chat-micro-gaps.md) | 聊天微交互缺口（[PR #13](https://github.com/jianwyao01/Rocket.Chat/pull/13) canonical 35 + [PR #15](https://github.com/jianwyao01/Rocket.Chat/pull/15) unique 9 = 44） |
| [13-room-chrome-gaps.md](13-room-chrome-gaps.md) | 房间 chrome 缺口（[PR #14](https://github.com/jianwyao01/Rocket.Chat/pull/14)） |
| [14-account-gaps.md](14-account-gaps.md) | 账号操作缺口（[PR #12](https://github.com/jianwyao01/Rocket.Chat/pull/12) canonical 12 + [PR #16](https://github.com/jianwyao01/Rocket.Chat/pull/16) unique 7 = 19） |
| [15-i18n-chat-room-account.md](15-i18n-chat-room-account.md) | i18n VERB 反查 chat/room/account（[PR #17](https://github.com/jianwyao01/Rocket.Chat/pull/17)；无 NEW 功能 id） |
| [16-i18n-must-fill.md](16-i18n-must-fill.md) | 填 15 的 6 条必须补行（[PR #18](https://github.com/jianwyao01/Rocket.Chat/pull/18)；2 个 `fill.*`；`## 仍必须补` empty） |

05 / 15 不新建功能 id。12 / 14 因 unique 合并改过；不保留第二份冲突的 12。01–11 / 13 / 15 / 16 精确 id 未改名。

## 如何回放（随机 10 行，跨入口 + 内部 + 缺口）

评审员必须能抽出 **10 行且同时覆盖入口层与内部/缺口层**，不要 10 条都是「打开 X」。

1. 打开 [00-blueprint.md](00-blueprint.md)。
2. **入口层（01–04）抽 3–4 行**：例如 `msg.quote`、`nav.create.channel`、`composer.send`、`route.omnichannel`。
3. **内部层（06–11）抽 3–4 行**，尽量跟入口成对（见先前 00 的配对）。
4. **缺口层（12–14 / 16）抽 2–3 行**，例如：
   - 01 `msg.quote` → 12 `chat.micro.quote.multi` / 12b `chat.micro.quote.of-quote`
   - 02 `room.toolbox.start-video-call` → 13 `room.chrome.call.start.confirm`
   - 07 `page.account.security.e2e-enter-current` → 14 `account.gap.security.e2e-forgot`
   - 03 `composer.join` → 16 `fill.join.channel.fullpage`（整页空态，不是发送栏）
5. 核「触发后果三件套」：(1) 哪个元素 role+name 出现/消失 (2) 哪个 endpoint (3) 刷新后还在什么。
6. 对不上的记回该 id 的 `[待渲染实测]`，不要改产品代码来迁就文档。
7. 抽到 alias（见 00「分册冲突 / canonical aliases」）时按 canonical 行回放；「都留」则按该行自己的入口走。

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
| 12 | 44 | 44 | `rg -c '^\| `chat\.micro\.' docs/qa/pm-feature-atlas/12-chat-micro-gaps.md` → 44（PR #13 的 35 + PR #15 unique 9；`35+9=44`） |
| 13 | 31 | 31 | `rg -c '^\| room\.(chrome\|banner\|join)\.' docs/qa/pm-feature-atlas/13-room-chrome-gaps.md` → 31（`26+1+4=31`） |
| 14 | 19 | 19 | `rg -c '^\| `account\.gap\.' …/14-account-gaps.md` → 12；`rg -c '^\| `acct\.gap\.'` → 7；`12+7=19` |
| 15 | 0 | 0 | 无 8 列功能行。EXTRACTED 258 = HIT 90 + MISS 60 + OOS 108 |
| 16 | 2 | 2 | `rg -c '^\| `fill\.' docs/qa/pm-feature-atlas/16-i18n-must-fill.md` → 2 |

### 验算（只证明没丢表，不是对外总功能数）

先前 00（01–04）表体：`193+107=300`；`300+117=417`；`417+64=481`。去重 id：`26+107=133`；`133+117=250`；`250+64=314`。

NEW 06–11 表体/去重 id：`306+623=929`；`929+136=1065`；`1065+29=1094`；`1094+72=1166`；`1166+133=1299`。

NEW 12–16 表体/去重 id：`44+31=75`；`75+19=94`；`94+0=94`；`94+2=96`。

写入 00 的 8 列表体（含 01 B/C 复行）：`481+306=787`；`787+623=1410`；`1410+136=1546`；`1546+29=1575`；`1575+72=1647`；`1647+133=1780`；`1780+44=1824`；`1824+31=1855`；`1855+19=1874`；`1874+2=1876`。

05 / 15 不新建功能 id。`ls -1 apps/meteor/client/views/ | wc -l` → 27，00 完备性表 27 行立场。`## 仍必须补` empty。

## 诚实标记

`[读]` 源码推断；`[待渲染实测]` 未挂真实 UI。相对先前本分支 00，NEW id 只在 12–16（见 00「与现行 atlas 的 id 集合差」）。15 = 0 功能 id。
