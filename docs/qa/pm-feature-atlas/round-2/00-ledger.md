# Round 2 总账（e519470）

冻结 **`e519470d35b6caf5b228d81aef41c86aab3051f4`**（短 SHA `e519470`）。不扫 `develop`。

本文是 **分层覆盖账本**：索引各卷闭集大小、诚实标签、以及 Community seed 上关不掉的空洞。  
**不是功能清单。总账 ≠ 功能总数。禁止把纸面行数相加成「功能」。**

源 PR 均保持 draft。本文件是索引，不替代各卷正文。数字以各卷文件为准（2026-08-23 从对应分支读出），不以口头约数。

---

## 1. 冻结 + 本账能说什么

| 能说 | 不能说 |
| --- | --- |
| 某卷纸面闭集有多大、命令能否复跑 | 「一共有 N 个功能」 |
| 某卷已 live 走到哪、标签升到哪 | 任一行为卷 **live-closed** |
| leftover 仍是 leftover（Honesty > leftover=0） | 把 leftover 盖成 `[不可达]` 凑 0 |
| Community / 无 license 关不掉的洞 | 未点到 = 不可达 |

**闭集卷（纸面闭合）**：6 / 7 / 13 / 14 / 15 — 库存 + 可复跑命令。标签 **`[读]`**。纸面闭合 ≠ 已实测。

**行为卷（有 live 走查，全部未闭合）**：5 / 8 / 9 / 10 / 11 / 12。有 `[实测]` 也不等于 live-closed。

本环境 **未再起 Meteor**。live 标签引自各卷文件行号。产品 merge-base 仍是冻结 SHA。

---

## 2. 分卷表

| Vol | PR / 分支 | 闭合类型 | 纸面行数 | live 标签 | 纸面闭合？ | live 闭合？ |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | [#26](https://github.com/jianwyao01/Rocket.Chat/pull/26) `cursor/pm-atlas-r2-vol5-0dac` `05-live-behavior.md` | 00 UNION 去重 id | **1082** | **828** `[实测]` + **189** 真不可达 + **65** `[待渲染实测]` | 是（1082） | **否** |
| 6 | [#23](https://github.com/jianwyao01/Rocket.Chat/pull/23) `06-settings-impact.md` | client-read settings | **243**（235+8） | 全 `[读]` | 是 | **否**（文末 33 条高影响仍须 `[实测]`） |
| 7 | [#22](https://github.com/jianwyao01/Rocket.Chat/pull/22) `07-permissions-impact.md` | client-checked perms | **148** `SYMDIFF []` | 全 `[读]` | 是 | **否** |
| 8 | [#32](https://github.com/jianwyao01/Rocket.Chat/pull/32) `cursor/r2-vol8-states-95f3` `08-states.md` | JSX 条件渲染分支 | **4221**；TARGET_FILES **3817**；`VERIFY_OK 3817 4221` | **175** `[实测]` + **4046** `[待渲染实测]` + **0** `[不可达]` | 是（4221） | **否** |
| 9 | [#27](https://github.com/jianwyao01/Rocket.Chat/pull/27) `09-realtime.md` | stream/event bind | **44** `COUNT 44 SYMDIFF []` | **14** `[实测]` + **12** `[待渲染实测]` + **18** `[读]` | 是（44） | **否**（typing 从未出现） |
| 10 | [#30](https://github.com/jianwyao01/Rocket.Chat/pull/30) `10-errors.md` | 用户可见错误路径 | **390** `ROWS 390 SYMDIFF []` | **11** `[实测]` + **379** `[读]` | 是（390） | **否** |
| 11 | [#29](https://github.com/jianwyao01/Rocket.Chat/pull/29) `11-keyboard-timing.md` | tinykeys / 邻接 | paper：tinykeys 调用 **6** / 和弦 **10** / SHORTCUTS **9** / FocusScope **13** / debounce **107** / `runOptimistic` **2** | 和弦 live **7/10** `[实测]`（3 leftover `[读]`） | 是（各闭集） | **否** |
| 12 | [#31](https://github.com/jianwyao01/Rocket.Chat/pull/31) `12-environment.md` | 浏览器环境 API | **93** `COUNT 93 SYMDIFF []` | **52** `[实测]` + **41** leftover `[读]` | 是（93） | **否** |
| 13 | [#21](https://github.com/jianwyao01/Rocket.Chat/pull/21) `13-admin-settings-fields.md` | admin registry 字段 | **1044**（973+71）；public 430；client-read 229 | 全 `[读]` | 是 | **否** |
| 14 | [#20](https://github.com/jianwyao01/Rocket.Chat/pull/20) `14-pin-reverse-diff.md` | freeze vs develop `e10bd504b9` 反向差 | registry / settings.add / perms `only_freeze=0`；i18n `only_freeze=29`；8 列 **3** | 全 `[读]` | 是 | **否** |
| 15 | [#24](https://github.com/jianwyao01/Rocket.Chat/pull/24) + [#28](https://github.com/jianwyao01/Rocket.Chat/pull/28) | i18n VERB 反查 + MISS 8 列 | EXTRACTED **929** = HIT **423** + MISS **24** + OOS **482**；#28 把 24 MISS 写成 `fill.*` | 全 `[读]`（#28 未升实测） | 是（929 / 24） | **否** |

不要把上表行数相加。

---

## 3. 空洞图（必须可见）

Community seed（`hasValidLicense=false` `activeModules=[]`）上，剩余 live leftover **关不掉**。披露为空洞。禁止盖 `[不可达]`。

### 3.1 Vol 5 — Community seed 耗尽的用户范围 leftover

用户范围曾 **9** 条。已升 `[实测]`（不再算 leftover）：

- `user.action.add-to-room`（非成员用户卡 add-to-room）
- `page.create.channel.submit.permission-denied`（guest Create → `error-not-allowed`）
- `page.create.team.submit.permission-denied`（guest Create disabled）
- `composer.state.typing.truncated`（≥5 人 “and others are typing”）
- `sidebar.sidepanel.back`（tablet 副栏 Back）

**仍 leftover（4，不盖不可达）**：

| id | 为何关不掉 | 出处（#26 `05-live-behavior.md`） |
| --- | --- | --- |
| `msg.read-receipts` | 已开 `Message_Read_Receipt_*`；More 仍无 Read receipts（服务端另要 license `message-read-receipt`） | L178 |
| `page.account.profile.avatar.suggest` | `settings.oauth` services=[]；`GET users.getAvatarSuggestion` → `{}`；Profile 无建议头像钮 | L508 |
| `page.account.profile.delete.last-owner` | REST `users.deleteOwnAccount` 返 `[user-last-owner]`；UI 停在密码框，无 `ConfirmOwnerChangeModal`（REST only） | L531 |
| `page.account.preferences.login-email` | `Device_Management_*` GET 400 未注册；Notifications 无 Receive Login Detection Emails | L542 |

`828+189+65=1082`（#26 §5）。65 含下面 3.2 的范围外项。**leftover ≠ 0。**

### 3.2 用户范围外（EE / 通话 / Game / Outlook / …）— 列为范围外空洞

这些仍在 Vol 5 的 65 `[待渲染实测]` 里。**范围外 ≠ 已关闭。** 不并进用户范围 leftover=0。

| 范围外 | leftover id（#26 表体） |
| --- | --- |
| E2EE | `acct.gap.e2e.reset.2fa` |
| Video Call | `room.toolbox.calls` `room.members.action.video-call` `user.action.video-call` `room.chrome.sidebar.call-accept` `room.chrome.call.incoming.mute` `room.chrome.call.outgoing.cancel` |
| Game | `room.toolbox.game-center` |
| Outlook | `room.toolbox.outlook-calendar` `page.account.preferences.calendar-notify` |
| VoIP | `room.members.action.voice-call` `room.chrome.voip.forward` `room.chrome.voip.hangup` `nav.voip.call` `nav.voip.history` `page.admin.users.form.voip-extension` `page.account.preferences.mobile-ringing` |
| Apps | `msg.apps.action` `msg.apps.ai` `room.toolbox.ai-actions` `room.apps.toolbox-inject` `nav.user.apps-inject` `page.admin.ai-center.mcp` `page.admin.ai-center.section.save` |
| federation | `page.create.channel.members.external-rejected` `directory.external` `page.directory.tab.external` |
| SAML | `route.saml` `page.admin.settings.saml.import-metadata` |
| omni | `room.toolbox.canned-responses` `room.canned.use-from-list`；`omni.agent.sidepanel.priority` / `canned.*` / `resume` / `transcript.pdf` / `composer.denied`；`omni.manager.businesshours.create|delete` `omni.manager.security.save`；`omni.widget.transcript` / `department` / `finished.new` |
| admin / 其它 | `nav.user.status.visibility` `page.account.profile.status-visibility` `page.account.sessions.*` `page.admin.workspace.*` `page.admin.subscription.*` `page.admin.users.seats` `page.admin.permissions.role.delete` `route.token-login` `mkt.installed.update-server` |

真不可达 **189** 只含已走入口后页/控件不在者（Premium 模态、Audit 404、Marketplace 0 apps 的应用级控件等）。见 #26 §5。未点 ≠ 不可达。

### 3.3 Vol 8–12 live 剩余（全部未闭合）

| Vol | 剩余 | 不要写成 |
| --- | --- | --- |
| 8 | **4046** `[待渲染实测]`（只晋级已截图分支） | live-closed；用 `[不可达]` 清零 |
| 9 | **12** `[待渲染实测]` + **18** `[读]`。`notify-room/user-activity`：两真浏览器同房，composer 上方仍无 `is typing`（**Typing never appeared**） | leftover=0 |
| 10 | **379** `[读]`（只升了 11 条有 toast/inline 截图的） | leftover=0 |
| 11 | 和弦 leftover **3/10**：Alt legacy / Alt v2（行上无 kebab）/ Konami（无 license tab）。Ctrl+Esc = OS 抢走。FocusScope：invite / ImageGallery / VideoConf / VoIP / UiKit 未开。107 debounce **纸面** | 3 leftover 盖不可达；107 当功能数 |
| 12 | **41** leftover `[读]`：通知权限条、桌面 `setFavicon`、Outlook 日历通知、VoIP AudioContext/拨号音、E2EE/2FA clipboard、desktop 协议壳部分路径等 | leftover=0 |

### 3.4 纸面闭集卷仍开着的洞

- **Vol 6**：文末 **33** 条高影响 key 仍须事后 `[实测]`（`06-settings-impact.md` L368–404）。243 全 `[读]`。
- **Vol 7**：排除 Apps 运行时键、`manage-selected-settings` 开集、注释 `leave-team`、服务端-only fixtures。无 `[实测]`。
- **Vol 13**：client-read grep **229**（窄于 vol 6 的 243）。对不齐：`Chatops_Username`（无 `registry.add`）、`PageSize` vs `Search.defaultProvider.PageSize`。
- **Vol 14**：MatrixFederation 文件挪动在三闭集外。未发明第四闭集。
- **Vol 15**：MISS **24 ≠ 0**。#28 写成 8 列，仍 `[读]`。HIT 423 对的是 round-1 atlas id，不是本冻结 live UI。

---

## 4. 复跑命令（各卷文件；数字对不上 = 拒收该卷）

均在 **`e519470d35b6caf5b228d81aef41c86aab3051f4`** 上跑。本账不重数。长 python 以源文件为准。

### Vol 5 — `05-live-behavior.md` §2 / §5（L105–129，L1328–1339）

```bash
# 清单来源：PR #19 atlas。闭集 = 00 去重稳定 id = 1082（不发明 1117）
rg -c '^\| [a-z]' docs/qa/pm-feature-atlas/round-2/05-live-behavior.md
# 诚实：828 [实测] + 189 [不可达] + 65 [待渲染实测] = 1082
```

本环境未起产品。live 标签以该文件 §4 表体 + §5 为准。

### Vol 6 — `06-settings-impact.md` 闭合判据（L408+）

```bash
git rev-parse HEAD   # expect e519470d35b6caf5b228d81aef41c86aab3051f4

# 命令 A — 同行字面量 235
rg -n --no-heading \
  -o "(?:useSetting(?:<[^>]+>)?|settings\.peek(?:<[^>]+>)?|settings\.observe|useSettingStructure)\(\s*['\"]([A-Za-z0-9_.-]+)['\"]" \
  -r '$1' \
  --glob '*.{ts,tsx,js,jsx}' --glob '!**/*.spec.*' --glob '!**/*.test.*' --glob '!**/tests/**' --glob '!**/server/**' \
  apps/meteor/client apps/meteor/app \
  packages/ui-client packages/ui-contexts packages/web-ui-registration \
  packages/ui-voip packages/ui-video-conf packages/fuselage-ui-kit \
  | sed 's/.*://' | sort -u | wc -l
# expect 235

rg -c '^\| `set\.' docs/qa/pm-feature-atlas/round-2/06-settings-impact.md
rg -o '^\| `set\.[^`]+' docs/qa/pm-feature-atlas/round-2/06-settings-impact.md | sort -u | wc -l
# expect 243 243
```

`235+8=243`。分表 `51+30+25+16+19+20+13+13+5+5+5+5+4+9+23=243`。

### Vol 7 — `07-permissions-impact.md` 闭合判据（L200–274）

```bash
rg -c '^\| `perm\.' docs/qa/pm-feature-atlas/round-2/07-permissions-impact.md
rg -o '^\| `perm\.[^`]+`' docs/qa/pm-feature-atlas/round-2/07-permissions-impact.md | sort | uniq | wc -l
# expect 148 148
# 抽键 python：该文件 §闭合判据 #4 → COUNT 148 / TABLE 148 / SYMDIFF []
```

### Vol 8 — `08-states.md` §7（L4523–4568）

```bash
python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --verify
# TARGET_FILES 3817
# CLASS_SUM 3817
# STATES 4221
# UNIQUE_IDS 4221
# VERIFY_OK 3817 4221

rg -c '^\| `state\.' docs/qa/pm-feature-atlas/round-2/08-states.md
# expect 4221
```

kind：`1518+1518+146+146+524+346+23=4221`。`[待渲染实测]+[不可达]+[实测]=4221`。

### Vol 9 — `09-realtime.md` §5（L148–306）

```bash
rg -c '^\| `rt\.' docs/qa/pm-feature-atlas/round-2/09-realtime.md
# expect 44
# 抽键 python：该文件 §5 → COUNT 44 TABLE 44 SYMDIFF []
```

### Vol 10 — `10-errors.md` 闭合段（L1057–1106）

```bash
# 该文件闭合 python → ROWS 390 UNIQ 390 SYMDIFF_TOAST_API [] SYMDIFF_ISERROR []
rg -c '^\| `err\.[^`]+` .*\[实测\]' docs/qa/pm-feature-atlas/round-2/10-errors.md
# expect 11
# 298 toast + 14 qmeta + 78 inline = 390
# 11 [实测] + 379 [读] = 390
```

### Vol 11 — `11-keyboard-timing.md` §11（L268–341）

```bash
# tinykeys 调用（去 import）expect 6；`^\| \`kb\.reg\.` expect 10
# SHORTCUTS `id: '` expect 9；<FocusScope expect 13
# 77+20+1+8+1=107；runOptimistic expect 2
# 和弦拆分 python → COMBOS 10
```

命令全文在该文件 L270–341。

### Vol 12 — `12-environment.md` §12（L229+）

```bash
rg -c '^\| `env\.' docs/qa/pm-feature-atlas/round-2/12-environment.md
# expect 93
# 抽点 python §12.2 → COUNT 93 TABLE 93 SYMDIFF []
# 6+4+1+6+16+12+20+28=93
```

### Vol 13 — `13-admin-settings-fields.md` CLOSURE（L2360+）

```bash
node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --count
node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --verify
# fields.total 1044 = 973 + 71；public_yes 430；client_read.keys 229
```

`243` 与 `1044` 是不同闭集。不要相加。

### Vol 14 — `14-pin-reverse-diff.md` §4.3（L459+）

```bash
python3 -c "import json,subprocess; f=json.loads(subprocess.check_output(['git','show','e519470d35:packages/i18n/src/locales/en.i18n.json'])); d=json.loads(subprocess.check_output(['git','show','origin/develop:packages/i18n/src/locales/en.i18n.json'])); print(len(f),len(d),len(set(f)-set(d)),len(set(d)-set(f)))"
# expect 7385 7392 29 36
rg -c '^\| `rev\.' docs/qa/pm-feature-atlas/round-2/14-pin-reverse-diff.md
# expect 3
```

`7385-29=7356`；`1009+3=1012`；`199+1=200`；`only_freeze`（registry/settings/perms）=0。

### Vol 15 — `15-i18n-full.md` §2.1 / §3 + `15-i18n-must-fill-rows.md` §3

```bash
# EXTRACTED python：15-i18n-full.md §2.1 → TOTAL 7385 EXTRACTED 929
# 切片 python：§3 → HIT 423 MISS 24 OOS 482 SUM 929 MUST 24
rg -c '^\| `fill\.' docs/qa/pm-feature-atlas/round-2/15-i18n-must-fill-rows.md
# expect 24
```

`929=423+24+482`。24 ≠ 0。

---

## 5. 总账 ≠ 功能总数

- 不要加 `1082+243+148+4221+44+390+10+93+1044+3+929`。这些是 **不同闭集**（行为 id / settings / perms / JSX 分支 / stream / 错误路径 / 快捷键注册 / 环境 API / admin 字段 / 反向差 / i18n 动词）。
- Vol 8 的 4221 是条件渲染分支，不是 4221 个功能。
- Vol 11 的 6/10/9/13/107/2 是四套纸面闭集，不要加成「键盘功能」。
- `[实测]` 只表示该行有截图，不表示该卷做完。
- leftover 留下比写成 0 更诚实。

---

## 6. 怎么合

1. 源 PR **#20–#24、#26–#32 保持 draft**。本文件只做索引。
2. 本分支从冻结点长出，只改这一份 markdown。
3. 合树时取各卷文件，不在本 PR 重导出。
4. 以后某卷真的 live-closed，在 **该卷** 改标签，再回来改本表。不要在总账里静默翻成已闭合。
5. `file:line` 只保证在 `e519470` + 各卷文件上存在。不改产品代码。
