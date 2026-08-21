# Round 2 / 14 — 反向 diff（冻结点有、develop 删或改）

文档-only。不改产品代码。全部行为标 **`[读]`**（源码/闭集命令推断；未挂真实 UI）。

| 项 | 值 |
| --- | --- |
| `starting_ref` / 冻结点 | `e519470d35b6caf5b228d81aef41c86aab3051f4`（`refactor(apps): convert the Apps server orchestrator to TypeScript (#38357)`，2026-08-12） |
| 对照（只读，禁止当 出处） | `origin/develop` @ `e10bd504b9e4576d6f862393caa277e695d249ed`（fetch 后；47 commits ahead；`merge-base` = 冻结点本身） |
| 本分册任务 | 上一轮站在 develop 上，结构上看不到「冻结点有、后来被删/改」的能力。本文件用闭集差补那一块。 |
| 出处规则 | **只写冻结点 `e519470` 的 `file:line`。** 禁止把 develop 的 `file:line` 当成冻结 出处。 |

8 列与 atlas 01–16 同头：`稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处`。  
「功能一句话」= **冻结点上它做什么**；「触发后果」里写 **develop 对照做了什么**。空节允许：命令证明差集为空。

---

## 0. 对照预备（不切 develop）

```bash
git rev-parse HEAD
# e519470d35b6caf5b228d81aef41c86aab3051f4

git fetch origin develop --no-tags
git rev-parse origin/develop
# e10bd504b9e4576d6f862393caa277e695d249ed

git merge-base e519470d35 origin/develop
# e519470d35b6caf5b228d81aef41c86aab3051f4

git rev-list --count e519470d35..origin/develop
# 47
git rev-list --count origin/develop..e519470d35
# 0
```

---

## 1. 闭集 A — MessageActionContext / toolbar / roomActionHooks / composer / routes

### 1.1 命令（冻结 ∪ develop，id 集差）

```bash
# 需要已 fetch 的 origin/develop。在冻结工作树或任意 checkout 上跑均可（只读 git show）。
python3 - <<'PY'
import subprocess, re, os

FREEZE = "e519470d35b6caf5b228d81aef41c86aab3051f4"
DEV = "origin/develop"

def show(rev, path):
    p = subprocess.run(["git", "show", f"{rev}:{path}"], capture_output=True, text=True)
    return p.stdout if p.returncode == 0 else None

def ls(rev, path):
    p = subprocess.run(["git", "ls-tree", "-r", "--name-only", rev, "--", path], capture_output=True, text=True)
    return [l for l in p.stdout.splitlines() if l]

def dump(name, a, b):
    sa, sb = set(a), set(b)
    print(f"{name}\tfreeze={len(sa)}\tdevelop={len(sb)}\tonly_freeze={len(sa-sb)}\tonly_develop={len(sb-sa)}")
    for x in sorted(sa - sb):
        print("  ONLY_FREEZE", x)

# MessageActionContext union
def mac(text):
    chunk = text.split("export type MessageActionContext")[1].split(";")[0]
    return re.findall(r"'([a-z0-9-]+)'", chunk)

# toolbar / composer action ids（id: 与 id=）
def ids_under(rev, path, skip_suffixes=(".spec.ts", ".spec.tsx", ".snap", ".stories.tsx")):
    out = set()
    for f in ls(rev, path):
        if any(f.endswith(s) for s in skip_suffixes):
            continue
        t = show(rev, f) or ""
        out.update(re.findall(r"""\bid\s*[:=]\s*['\"]([a-z0-9._/-]+)['\"]""", t))
    return out

def hook_array(text, name):
    m = re.search(rf"export const {name} = \[([\s\S]*?)\]\s*satisfies", text)
    return re.findall(r"use[A-Za-z0-9]+", m.group(1)) if m else []

def formatting(text):
    return re.findall(r"label:\s*'([^']+)'", text)

ROUTE_FILES = [
    "apps/meteor/client/startup/routes.tsx",
    "apps/meteor/client/views/admin/routes.tsx",
    "apps/meteor/client/views/account/routes.tsx",
    "apps/meteor/client/views/omnichannel/routes.ts",
    "apps/meteor/client/views/marketplace/routes.tsx",
    "apps/meteor/client/startup/audit.tsx",
]

def routes(text):
    ids = set(re.findall(r"""(?:id|name):\s*['\"]([^'\"]+)['\"]""", text or ""))
    ids.update(re.findall(r"""^\s*'([^']+)':\s*\{""", text or "", re.M))
    return ids

def slash(rev):
    p = subprocess.run(
        ["git", "grep", "-nE", r"slashCommands\.add\(\s*['\"]", rev, "--", "apps/meteor"],
        capture_output=True, text=True)
    return set(re.findall(r"slashCommands\.add\(\s*['\"]([^'\"]+)", p.stdout))

def popup_titles(text):
    return re.findall(r"title:\s*t\('([^']+)'\)", text or "")

for label, fn in [
    ("MessageActionContext", lambda rev: mac(show(rev, "apps/meteor/app/ui-utils/client/lib/MessageAction.ts"))),
    ("toolbar.ids", lambda rev: ids_under(rev, "apps/meteor/client/components/message/toolbar")),
    ("toolbar.Items", lambda rev: [os.path.basename(f) for f in ls(rev, "apps/meteor/client/components/message/toolbar/items") if f.endswith("Items.tsx")]),
    ("roomActionHooks", lambda rev: hook_array(show(rev, "apps/meteor/client/ui.ts"), "roomActionHooks")),
    ("quickActionHooks", lambda rev: hook_array(show(rev, "apps/meteor/client/ui.ts"), "quickActionHooks")),
    ("formattingButtons", lambda rev: formatting(show(rev, "apps/meteor/app/ui-message/client/messageBox/messageBoxFormatting.ts"))),
    ("composer.action.ids", lambda rev: ids_under(rev, "apps/meteor/client/views/room/composer/messageBox/MessageBoxActionsToolbar")),
    ("composer.popup.titles", lambda rev: popup_titles(show(rev, "apps/meteor/client/views/room/providers/ComposerPopupProvider.tsx"))),
    ("routes.id/name", lambda rev: set().union(*[routes(show(rev, f)) for f in ROUTE_FILES])),
    ("slashCommands.add", slash),
]:
    dump(label, fn(FREEZE), fn(DEV))
PY
```

### 1.2 命令输出（本轮）

```
MessageActionContext	freeze=11	develop=11	only_freeze=0	only_develop=0
toolbar.ids	freeze=29	develop=29	only_freeze=0	only_develop=0
toolbar.Items	freeze=11	develop=11	only_freeze=0	only_develop=0
roomActionHooks	freeze=29	develop=29	only_freeze=0	only_develop=0
quickActionHooks	freeze=5	develop=5	only_freeze=0	only_develop=0
formattingButtons	freeze=7	develop=7	only_freeze=0	only_develop=0
composer.action.ids	freeze=7	develop=7	only_freeze=0	only_develop=0
composer.popup.titles	freeze=5	develop=5	only_freeze=0	only_develop=0
routes.id/name	freeze=126	develop=126	only_freeze=0	only_develop=0
slashCommands.add	freeze=43	develop=43	only_freeze=0	only_develop=0
```

冻结点集合（出处只标冻结）：

| 子集 | 冻结值 | 冻结 出处 |
| --- | --- | --- |
| `MessageActionContext` | `message` `threads` `message-mobile` `pinned` `direct` `starred` `mentions` `federated` `videoconf` `search` `videoconf-threads` | `MessageAction.ts:6-17` |
| `itemsByContext` 11 键 | 与上一行 11 字面量一一对应 | `MessageToolbar.tsx:44-59` |
| `*Items.tsx` | `Default` `Mobile` `Threads` `Videoconf` `VideoconfThreads` `Pinned` `Direct` `Starred` `Mentions` `Federated` `Search` | `toolbar/items/*Items.tsx` |
| toolbar 内部 id（29） | `reaction-message` `quote-message` `reply-in-thread` `forward-message` `jump-to-message` `jump-to-pin-message` `jump-to-star-message` `webdav-upload` `start-discussion` `pin-message` `unpin-message` `star-message` `unstar-message` `permalink` `permalink-star` `permalink-pinned` `follow-message` `unfollow-message` `mark-message-as-unread` `translate` `view-original` `reply-directly` `copy` `edit-message` `delete-message` `report-message` `reaction-list` `receipt-detail` `apps` | `ReactionMessageAction.tsx:75`；`QuoteMessageAction.tsx:40`；`ReplyInThreadMessageAction.tsx:37`；`ForwardMessageAction.tsx:35`；`JumpToMessageAction.tsx:8`；其余 `use*Action*` / `MessageToolbarActionMenu.tsx:53-58,131` |
| `roomActionHooks` 29 | `useChannelSettingsRoomAction` … `useMediaCallRoomAction` | `ui.ts:39-69` |
| `quickActionHooks` 5 | `useMoveQueueQuickAction` `useChatForwardQuickAction` `useTranscriptQuickAction` `useCloseChatQuickAction` `useOnHoldChatQuickAction` | `ui.ts:71-77` |
| `formattingButtons` 7 | `Bold` `Italic` `Strikethrough` `Inline_code` `Multi_line_code` `Link` `KaTeX` | `messageBoxFormatting.ts:34-106` |
| composer action id 7 | `audio-message` `video-message` `file-upload` `create-discussion` `share-location` `timestamp` `webdav-add` | `MessageBoxActionsToolbar/hooks/use*.ts(x)` |
| composer popup titles 5 | `People` `@`；`Channels` `#`；`Emoji` `:` / `\+:`；`Commands` `/`；`Canned_Responses` `!` | `ComposerPopupProvider.tsx:112-373` |
| `messageBox.actions.add` | **0 条调用**（`git grep messageBox.actions.add` 空） | `messageBox.ts:18` 只有 API |
| routes `id`/`name` | 126（startup + admin + account + omnichannel + marketplace + audit） | `startup/routes.tsx:127-273` 等 |

`git diff --stat e519470d35 origin/develop` 在上述注册文件上：**id 集无删。** 内容变动只有：

- `MessageBox.tsx`（编辑态 Escape / 关编辑时 popup 处理）→ 下面 8 列。
- `ComposerPopupProvider.tsx`：只改 `escapeRegExp` 的 import 包，popup 注册未动。
- `toolbar/.../TimestampPicker/index.ts`：删掉 `export * from './TimestampPickerModal'` 桶文件；`TimestampPickerModal.tsx` 仍在，composer `timestamp` id 仍在。**不是**用户可感知能力删除。
- Apps-Engine `MessageActionContext` 枚举仍是 4 值（`message` / `message-mobile` / `threads` / `starred`）。develop 只给 `hasOneRole` / `hasAllRoles` 加了注释（自定义角色名、房间 scope）。**id 未删**；匹配变宽是 develop 新增/修复，不记删除行。

### 1.3 删除的注册 id

（空 — `only_freeze=0` 十条子集全空。）

### 1.4 改过的用户可感知能力

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rev.composer.edit.escape-popup` | 冻结点：消息已进入 composer 编辑态时，Escape / 关编辑会 `reset()`；若正文被 reset（`reset===true`）则 **只 `popup.update()`、保持编辑态**；否则 `cancel`+`stop`+`popup.clear()`。[读] | `房间消息→More→Edit→改/不改文本→Escape` 或点关编辑。[读] | `chat.currentEditingMessage.getMID()` 真值（正在编辑）。`Message_AllowEditing` / `edit-message` 等是 **进入** 编辑的门，不在本回调里再查。[读] | (1) 冻结：reset 后 mention/emoji/slash popup **刷新仍可能开着**；未 reset 则编辑条消失、popup 清空。[读] develop 对照：无论 reset 与否都 `popup.clear()`；仅 `!reset` 时才 `cancel`+`stop`（正文被改回后仍留在编辑态，但 popup 关掉）。对应 develop「composer popup staying open after programmatic text changes」。能力本身（编辑/取消编辑）未删。(2) 点击无 REST；保存仍走 `POST /v1/chat.update`。(3) 未保存则刷新后编辑态消失。[读] | `chat.currentEditingMessage`；`popup`（`useComposerBoxPopup`） | `composer` 编辑态；popup `@` `#` `:` `/` `!` | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:198-214` |

表体行：**1**。删除 id：**0**。

---

## 2. 闭集 B — i18n verb-like 键：冻结有、develop 无

权威英文：`packages/i18n/src/locales/en.i18n.json`。VERB 定义对齐上一轮 15 分册（首词 ∈ VERB 集，且 DOMAIN ∧ CRA；短键 `Quote`/`Reply`/… 也算 VERB）。

### 2.1 命令

```bash
python3 - <<'PY'
import json, re, subprocess

FREEZE = "e519470d35b6caf5b228d81aef41c86aab3051f4"
DEV = "origin/develop"

def load(rev):
    return json.loads(subprocess.check_output(["git", "show", f"{rev}:packages/i18n/src/locales/en.i18n.json"]))

f, d = load(FREEZE), load(DEV)
only_f = sorted(set(f) - set(d))
only_d = sorted(set(d) - set(f))
print(f"keys\tfreeze={len(f)}\tdevelop={len(d)}\tonly_freeze={len(only_f)}\tonly_develop={len(only_d)}")

VERBS = {
  "Pin","Unpin","Star","Unstar","Edit","Delete","Invite","Join","Leave","Create",
  "Remove","Add","Save","Send","Reply","Forward","Share","Copy","Upload",
  "Download","Import","Export","Archive","Unarchive","Mute","Unmute","Block","Unblock",
  "Report","Search","Enable","Disable","Update","Cancel","Accept","Decline","Reject",
  "Approve","Assign","Transfer","Close","Open","Hide","Show","Follow","Unfollow",
  "Ignore","Mention","React","Quote","Prune","Reset","Restore","Ban","Kick",
  "Register","Login","Logout","Subscribe","Unsubscribe","Connect","Disconnect",
  "Install","Uninstall","Purchase","Request","Review","Publish",
  "Convert","Move","Start","Stop","Pause","Resume","Record","Play","Call",
  "Answer","Hold","Merge","Split","Lock","Unlock","Verify","Confirm","Submit",
  "Apply","Clear","Filter","Sort","Refresh","Reload","Expand","Collapse",
  "Select","Toggle","Change","Set","Grant","Revoke","Allow","Deny","Promote",
  "Encrypt","Decrypt","Backup","Wipe","Purge","Scan","Check","Forgot",
  "Translate","Favorite","Unfavorite","Mark","Jump","Reveal","Enter",
}
DOMAIN = re.compile(
  r"(?i)(Message_|Quote|Reply|Pin|Star|Edit|Delete|Forward|Copy|Upload|Record|"
  r"Join|Leave|Hide|Favorite|Ignore|Mute|Invite|Archive|Unread|Translate|"
  r"Thread|Discussion|Preference|Password|Two[-_ ]?factor|TwoFactor|"
  r"E2E|Token|Avatar|Logout)")
CRA = re.compile(
  r"(?i)(message|composer|room|channel|group|discussion|thread|chat|account|"
  r"profile|avatar|password|preference|e2e|e2ee|token|logout|unread|translate|"
  r"favorite|ignore|mute|invite|archive|quote|reply|pin|star|forward|upload|"
  r"record|join|leave|hide|permalink|webdav|receipt|two.?factor|2fa|"
  r"encryption|encrypted|personal.access|direct.?message|\bdm\b|mention|"
  r"reaction|follow|unstar|unpin|unarchive|unmute|unfollow)")
SHORT = {"Quote","Reply","Pin","Unpin","Star","Edit","Delete","Forward","Copy",
         "Upload","Record","Join","Leave","Hide","Favorite","Ignore","Mute",
         "Invite","Archive","Translate","Logout","Report","Unstar"}

def flat(v):
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        for k in ("other", "one", "zero"):
            if isinstance(v.get(k), str):
                return v[k]
    return ""

verb_domain_cra = []
verb_first = []
for k in only_f:
    v = flat(f[k])
    words = re.findall(r"[A-Za-z]+", v)
    first = words[0] if words else ""
    key_first = (re.findall(r"[A-Za-z]+", k.replace("_", " ")) or [""])[0]
    verb = first in VERBS or key_first in VERBS or k in SHORT or v.strip() in SHORT
    domain = bool(DOMAIN.search(k + " " + v))
    cra = bool(CRA.search(k + " " + v))
    if verb:
        verb_first.append(k)
    if verb and domain and cra:
        verb_domain_cra.append(k)
    print(f"KEY\t{k}\tverb={int(verb)}\tdomain={int(domain)}\tcra={int(cra)}\t{v[:80]}")

print("VERB_first_among_only_freeze", len(verb_first), verb_first)
print("VERB_and_DOMAIN_and_CRA", len(verb_domain_cra), verb_domain_cra)
PY
```

### 2.2 命令输出（本轮）

```
keys	freeze=7385	develop=7392	only_freeze=29	only_develop=36
VERB_first_among_only_freeze 2 ['Login_with', 'Purchase_for_price']
VERB_and_DOMAIN_and_CRA 0 []
```

29 个冻结独有键全部来自 develop `28a4ea3c97`（`replace positional translation parameters with named interpolation`）：键名带 `_s` / `%s` 的被删，同义句改成同键 `{{name}}` 或不再需要该键。`git grep Login_with` / `Purchase_for_price` / `Use_service_avatar` 在冻结点 **排除 `*.i18n.json` 后 0 调用方**。

同键改值（非缺键）：**21**（`%s` → `{{…}}`，能力还在）。develop 新增 36 键（状态可见性 / MCP / SAML metadata / Premium 告警等）——那是 develop 新能力，本分册不收。

### 2.3 VERB ∧ DOMAIN ∧ CRA 缺键 → 8 列

（空 — 命令证明 `VERB_and_DOMAIN_and_CRA=0`。）

### 2.4 未入 8 列（键删 ≠ 能力删）

| 键（冻结独有） | 冻结英文值 | 为何不建功能行 |
| --- | --- | --- |
| `Login_with` | `Login with %s`（`en.i18n.json:3462`） | VERB 首词 `Login`，但 DOMAIN∧CRA 失败；冻结 TS/TSX **无** `t('Login_with')`。[读] |
| `Purchase_for_price` | `Purchase for $%s`（`en.i18n.json:4461`） | VERB 首词 `Purchase`，DOMAIN∧CRA 失败；冻结无调用方。[读] |
| 其余 27 键 | 见下表 | 非 VERB-like，或只是 `%s` 错误/计数/WebRTC 来电文案键改名。 |

29 键全表（验算用，不是功能行）：

| 键 | 冻结值（截断） |
| --- | --- |
| `Created_at_s_by_s` | Created at `%s` by `%s` |
| `Created_at_s_by_s_triggered_by_s` | … triggered by `%s` |
| `Duplicate_archived_private_group_name` | An archived Private Group with name `'%s'` exists |
| `Duplicate_channel_name` | A Channel with name `'%s'` exists |
| `Duplicate_private_group_name` | A Private Group with name `'%s'` exists |
| `Invalid_Export_File` | The file uploaded isn't a valid `%s` export file. |
| `Invalid_notification_setting_s` | Invalid notification setting: `%s` |
| `Invalid_room_name` | `%s` is not a valid room name |
| `Invalid_setting_s` | Invalid setting: `%s` |
| `IssueLinks_LinkTemplate_Description` | Template for issue links; `%s` will be replaced… |
| `Login_with` | Login with `%s` |
| `N_new_messages` | `%s` new messages |
| `Post_to_s_as_s` | Post to `%s` as `%s` |
| `Purchase_for_price` | Purchase for `$%s` |
| `S_new_messages` | `%s` new messages |
| `S_new_messages_since_s` | `%s` new messages since `%s` |
| `Showing_archived_results` | Showing `%s` archived results |
| `Showing_results` | Showing `%s` results |
| `Snippet_Added` | Created on `%s` |
| `Use_service_avatar` | Use `%s` avatar |
| `User_has_been_muted_in_s` | User has been muted in `%s` |
| `WebRTC_direct_audio_call_from_%s` | Direct audio call from `%s` |
| `WebRTC_direct_video_call_from_%s` | Direct video call from `%s` |
| `WebRTC_group_audio_call_from_%s` | Group audio call from `%s` |
| `WebRTC_group_video_call_from_%s` | Group video call from `%s` |
| `WebRTC_monitor_call_from_%s` | Monitor call from `%s` |
| `conversation_with_s` | the conversation with `%s` |
| `n_messages` | `%s` messages |
| `since_creation` | since `%s` |

`User_has_been_muted_in_s` 冻结系统消息用的是 **`User_has_been_muted`**（`packages/message-types/src/registrations/common.ts:121`，两棵树都在），不是被删的 `_in_s` 键。

---

## 3. 闭集 C — `settings.add` / permission id

### 3.1 命令

```bash
python3 - <<'PY'
import subprocess, re
from collections import defaultdict

FREEZE = "e519470d35b6caf5b228d81aef41c86aab3051f4"
DEV = "origin/develop"
PERM_FILES = [
    "apps/meteor/server/lib/authorization/constant/permissions.ts",
    "apps/meteor/ee/server/lib/omnichannel/permissions.ts",
    "apps/meteor/ee/server/lib/canned-responses/permissions.ts",
    "apps/meteor/server/lib/messaging/discussions/permissions.ts",
    "apps/meteor/server/lib/autotranslate/permissions.ts",
    "apps/meteor/ee/server/lib/audit/startup.ts",
]

def settings(rev):
    p = subprocess.run(
        ["git", "grep", "-nE",
         r"\.(add|addHidden)\(\s*['\`\"][A-Za-z0-9_./-]+",
         rev, "--", "apps/meteor/server", "apps/meteor/ee", "apps/meteor/app"],
        capture_output=True, text=True)
    ids = set()
    for line in p.stdout.splitlines():
        if not re.search(r"(settingsRegistry|settings|_settings|this)\.(add|addHidden)\(", line):
            continue
        m = re.search(r"""\.(add|addHidden)\(\s*['\`\"]([^'\`\"]+)""", line)
        if m:
            ids.add(m.group(2))
    return ids

def perms(rev):
    ids = set()
    p = subprocess.run(
        ["git", "grep", "-nE", r"Permissions\.create\(\s*['\"][^'\"]+['\"]", rev, "--", "*.ts", "*.js"],
        capture_output=True, text=True)
    ids.update(re.findall(r"Permissions\.create\(\s*['\"]([^'\"]+)", p.stdout))
    for path in PERM_FILES:
        t = subprocess.run(["git", "show", f"{rev}:{path}"], capture_output=True, text=True)
        if t.returncode == 0:
            ids.update(re.findall(r"""_id:\s*['\"]([^'\"]+)['\"]""", t.stdout))
    return ids

sf, sd = settings(FREEZE), settings(DEV)
pf, pd = perms(FREEZE), perms(DEV)
print(f"settings.add\tfreeze={len(sf)}\tdevelop={len(sd)}\tonly_freeze={len(sf-sd)}\tonly_develop={len(sd-sf)}")
for x in sorted(sf - sd):
    print("  ONLY_FREEZE", x)
for x in sorted(sd - sf):
    print("  ONLY_DEVELOP", x)
print(f"permission\tfreeze={len(pf)}\tdevelop={len(pd)}\tonly_freeze={len(pf-pd)}\tonly_develop={len(pd-pf)}")
for x in sorted(pf - pd):
    print("  ONLY_FREEZE", x)
for x in sorted(pd - pf):
    print("  ONLY_DEVELOP", x)
PY
```

### 3.2 命令输出（本轮）

```
settings.add	freeze=1009	develop=1012	only_freeze=0	only_develop=3
  ONLY_DEVELOP Accounts_StatusVisibility_Enabled
  ONLY_DEVELOP MCP_Enabled
  ONLY_DEVELOP MCP_Expose_Extended_API
permission	freeze=199	develop=200	only_freeze=0	only_develop=1
  ONLY_DEVELOP access-mcp
```

`only_develop` 是上一轮站在 develop 上已经能看见的 **新** 设置/权限，本分册不收。

同 id 的 `settings.add` **选项** 在冻结→develop 之间，用户能看见的改动只有两条（都是加 `alert`，登录仍可用，到 9.0.0 才要 Premium）：

### 3.3 删除的 setting / permission id

（空 — `only_freeze=0`。）

### 3.4 改过的用户可感知能力

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rev.settings.ldap-enable` | 冻结点：管理台 LDAP 组里的总开关 `LDAP_Enable`（boolean, public）。打开后工作区走 LDAP 登录处理器。[读] | `管理台→Administration→LDAP→LDAP_Connection→LDAP_Enable`。[读] | 能进 Admin LDAP 组（`view-privileged-setting` / `edit-privileged-setting` 一类设置权）。设置本身冻结点 **无** `enterprise` / `modules` / `alert`。[读] | (1) 冻结：开关旁无 Premium 条。[读] develop 对照：同一 `_id` 仍在，只多 `alert: Premium_required_from_9_0_0_alert`（文案：9.0.0 起无对应 license 将不能用该认证）。登录 **现在仍放行**；develop 另在 LDAP handler 里打 server warn（不是关登录）。(2) 改设置走标准 settings API。(3) 刷新后开关值仍在。[读] | `LDAP_Enable`；后续 9.0 预告模块 `ldap-enterprise` | `rev.settings.saml-enable` | `apps/meteor/server/settings/ldap.ts:10` |
| `rev.settings.saml-enable` | 冻结点：每个 SAML 自定义 IdP 的总开关 `SAML_Custom_${name}`（boolean, public，标签 `Accounts_OAuth_Custom_Enable`）。打开后 `/saml/:token` 登录可用。[读] | `管理台→Administration→SAML→SAML_Connection→（该 IdP）Enable`。[读] | 同上设置权；`addSettings(name)` 在冻结点为每个 `name` 注册一组 `SAML_Custom_*`。[读] | (1) 冻结：开关无 Premium 条。[读] develop 对照：同一模板 id 仍在，只多同一 `alert`。SAML 登录 **现在仍放行** + server warn。路由 `saml` 未删（`startup/routes.tsx:246-248`）。(2) 改设置走 settings API。(3) 刷新后开关仍在。[读] | `SAML_Custom_${name}`；预告模块 `saml-enterprise` | `rev.settings.ldap-enable`；`route.saml` | `apps/meteor/server/lib/saml/lib/settings.ts:179-183` |

表体行：**2**。删除 id：**0**。

权限默认 `roles` 数组：`permissions.ts` 等文件 `git diff e519470d35 origin/develop -- …/permissions.ts` **空**，没有「同 id 换默认角色」。

---

## 4. CLOSURE / 验算

### 4.1 三条命令计数

| 闭集 | 冻结 | develop | only_freeze（删） | only_develop（本分册不收） | 用户可感知 8 列 |
| --- | --- | --- | --- | --- | --- |
| A MessageActionContext | 11 | 11 | 0 | 0 | — |
| A toolbar.ids | 29 | 29 | 0 | 0 | — |
| A toolbar.Items | 11 | 11 | 0 | 0 | — |
| A roomActionHooks | 29 | 29 | 0 | 0 | — |
| A quickActionHooks | 5 | 5 | 0 | 0 | — |
| A formattingButtons | 7 | 7 | 0 | 0 | — |
| A composer.action.ids | 7 | 7 | 0 | 0 | — |
| A composer.popup.titles | 5 | 5 | 0 | 0 | — |
| A routes.id/name | 126 | 126 | 0 | 0 | — |
| A slashCommands.add | 43 | 43 | 0 | 0 | — |
| A **CHANGED**（同 id 行为） | — | — | — | — | **1**（`rev.composer.edit.escape-popup`） |
| B en.i18n.json keys | 7385 | 7392 | 29 | 36 | — |
| B VERB∧DOMAIN∧CRA among 29 | 0 | — | 0 | — | **0** |
| C settings.add | 1009 | 1012 | 0 | 3 | — |
| C permission id | 199 | 200 | 0 | 1 | — |
| C **CHANGED**（同 id 选项） | — | — | — | — | **2**（LDAP / SAML alert） |

8 列表体合计：**1+0+2=3**。

### 4.2 算术

```
i18n:  7385 - 29 = 7356
       7392 - 36 = 7356
       7356 + 29 = 7385
       7356 + 36 = 7392

settings: 1009 + 3 = 1012
permission: 199 + 1 = 200

闭集 A 十条 only_freeze 之和: 0+0+0+0+0+0+0+0+0+0 = 0
闭集 B VERB∧DOMAIN∧CRA only_freeze: 0
闭集 C only_freeze: 0+0 = 0

8 列: 1 + 0 + 2 = 3
```

### 4.3 回放核对

```bash
# A：十条 only_freeze 必须都是 0
# B：
python3 -c "import json,subprocess; f=json.loads(subprocess.check_output(['git','show','e519470d35:packages/i18n/src/locales/en.i18n.json'])); d=json.loads(subprocess.check_output(['git','show','origin/develop:packages/i18n/src/locales/en.i18n.json'])); print(len(f),len(d),len(set(f)-set(d)),len(set(d)-set(f)))"
# 7385 7392 29 36

# 本文件 8 列行
rg -c '^\| `rev\.' docs/qa/pm-feature-atlas/round-2/14-pin-reverse-diff.md
# 3
```

---

## 5. 诚实边界

- 上一轮 atlas 基线就是这份 `origin/develop`（`e10bd504b9`）。本文件只回答「冻结点有而 develop 删/改」。develop **新增**（状态隐藏、MCP、SAML metadata URL、SAML deeplink 等）不在本闭集里。
- 冻结点之后 47 个 commit **没有**拆掉 toolbar / roomAction / composer 注册 / 路由 / setting id / permission id。
- LDAP/SAML：冻结点能力完整保留；develop 只加管理台告警 + 登录时 server warn。**不是**现在就关掉社区版 LDAP/SAML。
- 删除的客户端文件（`MatrixFederationSearch/*`、`useMatrixFederationItems.ts` 等）是 develop 把实现挪走/整理，**不在**本任务三个闭集的注册面上；未扩成第四闭集，避免假「删了联邦搜索入口」。
- `[读]` 全程。未渲染实测。
