# PM 功能测试图集（atlas）

合并四个文档-only 分册后的索引。**不改产品代码。** 基线 `develop` `e10bd504b9`。

## 文件

| 文件 | 内容 |
| --- | --- |
| [00-blueprint.md](00-blueprint.md) | **用户向交付物**：拼接 01–04 全部 8 列功能行 + 待渲染 UNION + 完备性 + OOS + id 差 + i18n 反查 + 分册冲突 |
| [01-message-toolbar.md](01-message-toolbar.md) | 消息工具栏 / `MessageActionContext`（[PR #2](https://github.com/jianwyao01/Rocket.Chat/pull/2)） |
| [02-room-user-nav.md](02-room-user-nav.md) | 房间工具箱 / 用户卡 / 顶栏 / 侧栏（[PR #1](https://github.com/jianwyao01/Rocket.Chat/pull/1)） |
| [03-composer-implicit.md](03-composer-implicit.md) | Composer + 房间隐式交互（[PR #4](https://github.com/jianwyao01/Rocket.Chat/pull/4)） |
| [04-routes-and-shell.md](04-routes-and-shell.md) | 路由目的地与壳层页（[PR #3](https://github.com/jianwyao01/Rocket.Chat/pull/3)） |
| [05-completeness.md](05-completeness.md) | views/ 完备性、i18n 抽样方法、OOS 量级（同 PR #3） |

## 如何回放（随机 10 行）

1. 打开 [00-blueprint.md](00-blueprint.md)，从任意 **8 列功能行表** 抽 10 个稳定语义 id（不要只抽同一分册）。
2. 在真实 RC Web 客户端按「完整入口点击序列」走到控件。
3. 核「触发后果三件套」：(1) 哪个元素 role+name 出现/消失 (2) 哪个 endpoint (3) 刷新后还在什么。
4. 对不上的记回该 id 的 `[待渲染实测]`，不要改产品代码来迁就文档。
5. 抽到 alias（见 00「分册冲突」）时按 canonical 行回放。

## 分册计数

禁止把下面四行收成一个「总功能」标题。数字是**表体行**或**去重 id**，命令写在旁边。

| 分册 | 表体行 | 去重稳定 id | 命令 |
| --- | --- | --- | --- |
| 01 | 193 | 26 | `rg -c '^\| msg\.' docs/qa/pm-feature-atlas/01-message-toolbar.md` → 193（含 B/C 复行）；去重：`rg -o '^\| msg\.[a-z0-9.-]+' … \| sort -u \| wc -l` → 26 |
| 02 | 107 | 107 | `rg -c '^\| (room\|user\|nav\|sidebar)\.' docs/qa/pm-feature-atlas/02-room-user-nav.md` → 107 |
| 03 | 117 | 117 | `rg -c '^\| `' docs/qa/pm-feature-atlas/03-composer-implicit.md` → 117 |
| 04 | 64 | 64 | `rg -c '^\| `route\.' 04` → 50；`account` 9；`directory` 4；`team` 1；`50+9+4+1=64` |

验算（只证明没丢表）：`193+107=300`；`300+117=417`；`417+64=481` 表体行写入 00。去重 id：`26+107=133`；`133+117=250`；`250+64=314`（附录算术，不是对外总功能数）。

05 不新建功能 id。`ls -1 apps/meteor/client/views/ | wc -l` → 27，00 完备性表 27 行立场。

## 诚实标记

`[读]` 源码推断；`[待渲染实测]` 未挂真实 UI。baseline atlas 在 develop 上为空，全部 id 都是 NEW。
