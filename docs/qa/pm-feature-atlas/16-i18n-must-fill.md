# 16 — i18n 必须补行（停条件填空）

文档-only。不改产品代码。不改写 00–15 已有 id。

本文件接 [15](https://github.com/jianwyao01/Rocket.Chat/pull/17) 的停条件输入：15 在 00–11 UNION 上标了 **6** 条「必须补行」。12–14 后来可能已经盖住其中几条。本文件对这 6 条给出 **A / B / C** 裁决；缺的才在这里写 `fill.*` 8 列行。

- **A) 已覆盖** — 引用 12–16（或 00–11，若 15 判错）已有稳定 id
- **B) NEW** — 本文件 8 列行，命名空间 `fill.*`
- **C) 确认不是用户可点** — `file:line`

诚实标记：`[读]` = 源码 / 兄弟分册原文；`[待渲染实测]` = 未挂真实 UI。兄弟分册原文从 sibling 分支 **取出**，不发明覆盖。

基线：`cursor/pm-atlas-merge-06-11-f8ed` @ `9a0eab0287`。

---

## 1. 取出的兄弟文档（不发明）

| 分册 | 分支 / PR | 本工作读到的路径 |
| --- | --- | --- |
| 15 | `cursor/pm-atlas-i18n-cra-15-02ce` [PR #17](https://github.com/jianwyao01/Rocket.Chat/pull/17) | `15-i18n-chat-room-account.md` |
| 12 | `cursor/pm-atlas-12-chat-micro-gaps-b355` [PR #13](https://github.com/jianwyao01/Rocket.Chat/pull/13) | `12-chat-micro-gaps.md`（35 个 `chat.micro.*`） |
| 12′ | `cursor/pm-atlas-chat-micro-gaps-97a2` [PR #15](https://github.com/jianwyao01/Rocket.Chat/pull/15) | 同名文件（14 个 `chat.micro.*`） |
| 13 | `cursor/room-chrome-gaps-eee2` [PR #14](https://github.com/jianwyao01/Rocket.Chat/pull/14) | `13-room-chrome-gaps.md` |
| 14 | `cursor/pm-atlas-account-gaps-c5d3` [PR #12](https://github.com/jianwyao01/Rocket.Chat/pull/12) | `14-account-gaps.md`（`account.gap.*`） |
| 14′ | `cursor/account-gaps-78a0` [PR #16](https://github.com/jianwyao01/Rocket.Chat/pull/16) | 同名文件（`acct.gap.*`） |
| 00–11 | 本分支 | `docs/qa/pm-feature-atlas/00`–`11` |

本工作区 **没有** 入库 12–15；裁决只引用上面取出的原文 id。

---

## 2. 六条裁决

| # | i18n key | 15 给出的按钮 | 裁决 | 去向 |
| --- | --- | --- | --- | --- |
| 1 | `Join_channel` | `NotSubscribedRoom.tsx:37` | **B) NEW** | `fill.join.channel.fullpage`。12 无此入口。13 `room.join.preview-blocked` 写「Join 仍在 composer」；03 `composer.join` 是发送栏 `Join`（`MessageBox.tsx:506-509`），入口不同 |
| 2 | `Clear_all_unreads_question` | `useEscapeKeyStroke.ts:36`（标题 :35；钮 `Yes_clear_all`） | **B) NEW** | `fill.unread.clear-all.confirm`。03 `shortcut.global.markAllAsRead.documented-unbound` **写反**（client **已**绑）。13 `room.chrome.escape-mark-read` 是 **裸 Esc** 标当前房已读，不是 Shift/Ctrl+Esc 清全部 |
| 3 | `Forgot_E2EE_Password` | `EnterE2EPasswordModal.tsx:116` | **A) 已覆盖** | canonical `account.gap.security.e2e-forgot`（14 / PR #12）。别名 `acct.gap.e2e.enter.forgot`（14′ / PR #16）。07 `page.account.security.e2e-reset` 是 Security **页内** `Reset_E2EE_password`，15 说入口不同 — 对；但 14 已拆模态内链 |
| 4 | `Start_call` | `StartCallPopup.tsx:101` | **A) 已覆盖** | `room.chrome.call.start.confirm`（13 / PR #14）。02 `room.toolbox.start-video-call` 只写到弹层出现，15 没说错；13 补了确认钮 |
| 5 | `Mute_and_dismiss` | `IncomingPopup.tsx:92` | **A) 已覆盖** | `room.chrome.call.incoming.mute`（13 / PR #14）。06 `room.calls.*` 只盖 Calls 历史，15 没说错 |
| 6 | `Hide_chat` | `ActionToggleChat.tsx:12` | **A) 已覆盖** | `room.chrome.voip.toggle-chat`（13 / PR #14）。挂在 `MediaCallRoomSection.tsx:97`；双态 `Hide_chat` / `Show_chat` |

无 **C)**。6 条都是用户可点控件。

---

## 3. NEW 8 列行

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fill.join.channel.fullpage` | 未订阅且无预览权时，在整页空态点 Join 加入公开频道 | 已登录 → 打开公开频道 URL / Directory 进未加入的 `c` 房（无订阅、无 `preview-c-room`）→ 整页 States `Channel_not_joined` → `Join_channel` | `user && !sub && !hasPreviewPermission && isPublicRoom(room)` 才抛 `NotSubscribedToRoomError` `useOpenRoom.ts:134-135`。`RoomOpener.tsx:50-51` 与 `RoomOpenerEmbedded.tsx:71-72` 挂本页。有 `preview-c-room` 时走房间+发送栏 Join，**不是**本行 | `[读]` ①`StatesAction` name=`Join_channel` loading（`handleJoinClick.isPending`）后整页换成正常 `Room` `[待渲染实测]` role。②`POST /v1/rooms.join` `{roomId}` `useJoinRoom.ts:16-21`。③`invalidateQueries` 房间引用；刷新后已是订阅者 | core | `composer.join`；`room.join.preview-blocked` | `NotSubscribedRoom.tsx:36-38`；`useJoinRoom.ts:13-33`；`RoomOpener.tsx:50-51` `[读]` |
| `fill.unread.clear-all.confirm` | Shift/Ctrl+Esc 弹出确认后清空全部已开房间未读 | 已登录壳内（任意页）→ `Shift+Escape` 或 `Ctrl+Escape` → 确认框 title=`Clear_all_unreads_question` → `Yes_clear_all` | `AppLayout.tsx:56` 挂 `useEscapeKeyStroke`。`event.code==='Escape' && (shiftKey \|\| ctrlKey)` `useEscapeKeyStroke.ts:23-25`。帮助 modal 写的是这条和弦（`KeyboardShortcutsModal` `markAllAsRead`），不是裸 Esc | `[读]` ①warning `GenericModal` 关；各房未读条/侧栏角标按 server 清 `[待渲染实测]` 精确 name。②对每个 `open && (alert \|\| unread>0)` 的 subscription：`POST /v1/subscriptions.read` `{rid, readThreads:true}` `useClearUnreadAllMessagesMutation.ts:12-20`。③刷新后这些房已读 | core | `shortcut.global.markAllAsRead.documented-unbound`（03 **写反**，勿当负向）；`room.chrome.escape-mark-read`（裸 Esc，当前房）；`implicit.unread.markAllRead` | `useEscapeKeyStroke.ts:21-49`；`useClearUnreadAllMessagesMutation.ts:7-24`；`AppLayout.tsx:56` `[读]` |

**NEW 计数**：2。

```bash
rg -c '^\| `fill\.' docs/qa/pm-feature-atlas/16-i18n-must-fill.md
# 2
```

与 `composer.join` 的差：`composer.join` 文案是 `Join`（`MessageBox.tsx:506-509`），出现在**已能预览**的发送栏。本行文案是 `Join_channel`，出现在 **Room 从未挂载** 的整页 States。

与 `room.chrome.escape-mark-read` 的差：13 写「焦点不在 input 时 → `Escape`」→ `POST /v1/subscriptions.read` **当前 rid**。本行必须带 Shift 或 Ctrl，确认后再对**全部已开未读订阅**发 `read`。

---

## 4. A) 已覆盖的 4 条（引用原文，不复行）

| i18n key | canonical id | 册 | 原文出处（兄弟文档表行） |
| --- | --- | --- | --- |
| `Forgot_E2EE_Password` | `account.gap.security.e2e-forgot` | 14 / PR #12 | `14-account-gaps.md`：`EnterE2EPasswordModal.tsx:108-117,55-68`。PR #16 同控件写成 `acct.gap.e2e.enter.forgot`（`EnterE2EPasswordModal.tsx:107-117`） |
| `Start_call` | `room.chrome.call.start.confirm` | 13 / PR #14 | `13-room-chrome-gaps.md` 表 A：`StartCallPopup.tsx:49-102`；`VideoConfManager.ts:140-174`。序列：点 `Video_call` 后 `Start_a_call` 弹层 → `Start_call` |
| `Mute_and_dismiss` | `room.chrome.call.incoming.mute` | 13 / PR #14 | 同表：`IncomingPopup.tsx:92`；`TimedVideoConfPopup.tsx:59-61`。title=`Mute_and_dismiss`；`dismissIncomingCall`（本地 dismissed，不拒接） |
| `Hide_chat` | `room.chrome.voip.toggle-chat` | 13 / PR #14 | 同表：`MediaCallRoomActivity.tsx:31-49`；`MediaCallRoomSection.tsx:97`。控件即 `ActionToggleChat`；`pressed` 时 label=`Hide_chat` `ActionToggleChat.tsx:12`。门控：`MediaCallRoom.tsx:39-47`（1:1 DM + `ongoing` + `screen-share`） |

`Start_a_call` 是同一弹层**标题**（15 已从必须补行排除）。钮是 `Start_call`，已由 `room.chrome.call.start.confirm` 覆盖。

---

## 5. 15 剩余 MISS（60 − 6 = 54）

15 §4 MISS **60**。减去上表 6 条必须补行后剩 54。逐条核：是否「用户可点的 chat/room/account 控件」且 00–16 **仍无** id。

结论：**没有**再升格为 NEW / 仍必须补。分组如下（每组列出 key；已有 id 或「不是可点控件」都写明）。

### 5.1 已有动作的标题 / 确认文案 / 弱命中（15 已排除；00–14 有行）

| key | 为何不是新控件 | 已有 id |
| --- | --- | --- |
| `Edit_channel` `Edit_discussion` | EditRoomInfo 标题 | `room.info.action.edit`；`implicit.roomInfo.action.edit` |
| `Invite_Users` | 邀请面板标题 | `room.members.invite-link` |
| `Delete_roomType` | 删房/团队确认标题 | `implicit.roomInfo.action.delete` |
| `Discussion_title` | 创建讨论模态标题 | `msg.discussion.start`；`page.create.discussion` |
| `Teams_leave` | 离开团队模态标题 | `sidebar.roomMenu.leave` |
| `Hide_room` | Hide 房间（文案 `Hide`） | `room.info.action.hide`；`sidebar.roomMenu.hide` |
| `E2E_enable_encryption` | 开加密确认钮/标题 | `room.info.e2ee.enable.confirm`（06） |
| `E2E_disable_encryption` | 关加密确认钮/标题 | `room.info.e2ee.disable.confirm`（06） |
| `Enter_E2E_password` | 输入口令模态标题 | `tl.e2ee.enter-password`；14 再拆 `account.gap.security.e2e-enter-*` |
| `Upload_From` | WebDAV picker 标题 | `composer.state.webdav.pick` |
| `Upload_user_avatar` | 房间头像上传 title | `room.info.edit.avatar.upload` |
| `Change_E2EE_password` | Security 页 E2E 段 **h3**，非按钮 `ChangePassphrase.tsx:106` | `page.account.security.e2e-passphrase` |
| `Enable_two-factor_authentication` | Security Callout 标题 | `page.account.security.totp.toggle` |
| `Start_a_call` | outgoing 弹层标题 | `room.chrome.call.start.confirm` |
| `Enter_TOTP_password` | TOTP 挑战标题；钮是 `Verify` | `page.account.security.totp.*`；`route.2fa` |
| `Select_message_from_user` | 多选 checkbox 名 | `tl.select.enter` |
| `Start_of_conversation` | 时间线前言文案 | `tl.foreword.*` |

### 5.2 toast / 系统句 / 斜杠描述 / 快捷键说明（不可点）

`Call_started` `Upload_failed` `Search_message_search_failed` `Join_the_given_channel` `Leave_the_current_channel` `Keyboard_Shortcuts_Edit_Previous_Message`

### 5.3 登录壳 placeholder（04 只打开路由）

`Create_a_password` — 注册/重置 placeholder。`route.register` / `route.reset-password`。

### 5.4 无现行 `t('Key')` 绑定（client 用了更短的键或根本没挂）

本工作在 `apps/meteor/client` 复跑：下列 key **0** 处 `t('…')`。

`Cancel_message_input` `Confirm_new_password` `Confirm_your_password` `Copy_password` `Forgot_password_section` `E2E_enable` `Hide_video` `Join_audio_call` `Join_Chat` `Join_conference` `Join_video_call` `Jump_to_first_unread` `Mark_as_unread` `Mute_all_notifications` `Mute_microphone` `Open_thread` `Select_an_avatar` `Set_as_favorite` `Show_Avatars` `Star_Message` `Start_audio_call` `Start_Chat` `Start_conference_call` `Start_video_call` `Start_video_conference` `Toggle_original_translated` `Unmute_microphone` `Unpin_Message` `Upload_file_question`

补充：`Join_Chat` 只在 `apps/meteor/server/api/v1/misc.ts:292`（服务端文案），不是主 SPA 按钮。`Jump_to_first_unread` 未绑定；跳第一条未读走 `unread_messages_counter` Bubble = `implicit.unread.jumpToFirst` / `tl.unread.jump`。`Mark_as_unread` 未绑定；工具栏用 `Mark_unread` = `msg.unread.mark`。`Show_Avatars` 未绑定；偏好用 `Display_avatars` = `page.account.preferences.display-avatars`。弹层麦开关用 `Mic_on`/`Mic_off` = 13 `room.chrome.call.*.toggle-mic`。

以上 **不是**「用户可点却无 id」。不进 §6。

54 分组验算：§5.1 **18** + §5.2 **6** + §5.3 **1** + §5.4 **29** = **54**。`Edit_channel`+`Edit_discussion` 算 2；`E2E_enable` 在 5.4 不在 5.1。`Join_Chat` 算在 5.4。

---

## 6. 仍必须补

empty

---

## 7. 冲突（canonical）

只记同控件两套 id。本文件不改写兄弟分册。

### 12 vs 15（两份 `12-chat-micro-gaps.md`）

PR #13（b355，35 行）与 PR #15（97a2，14 行）并行。同字符串且同动作（任取其一，不另建 `fill.*`）：

- `chat.micro.quote.multi`
- `chat.micro.quote.keyboard.absent`
- `chat.micro.quote.more.absent`
- `chat.micro.send.retry.absent`

近碰撞（同一「不能取消 pending 发送」）：

| 别名 | canonical |
| --- | --- |
| `chat.micro.send.cancel.absent`（PR #15） | `chat.micro.send.cancel-pending.absent`（PR #13） |

其余 id 互补（PR #13 的 invite/pin/reaction 等；PR #15 的 `quote.of-quote` / `slash.join.already-member` 等），不互相覆盖本文件的 6 条。

### 12 vs 16（两份 `14-account-gaps.md`）

PR #12 用 `account.gap.*`；PR #16 用 `acct.gap.*`。与本文件第 3 条相关：

| 别名 | canonical |
| --- | --- |
| `acct.gap.e2e.enter.forgot`（PR #16） | `account.gap.security.e2e-forgot`（PR #12） |
| `acct.gap.e2e.enter.reset-confirm`（PR #16） | `account.gap.security.e2e-forgot-confirm`（PR #12） |

Forgot 链走 canonical。页内 Reset 仍是 07 `page.account.security.e2e-reset`。

### 另：12 vs 13 邀请页（与 6 条无关，避免以后再 fill）

| 别名 | canonical |
| --- | --- |
| `chat.micro.invite.accept`（12 / PR #13） | `room.join.invite.accept`（13 / PR #14） |
| `chat.micro.invite.reject` + `.confirm` | `room.join.invite.reject` |
| `chat.micro.invite.learn-federation` | `room.join.invite.federation-learn` |

### 03 写反（不改 03）

`shortcut.global.markAllAsRead.documented-unbound` 声称「client 无绑定」。`useEscapeKeyStroke` **已**挂。正向行是本册 `fill.unread.clear-all.confirm`。03 那一行当作过时负向，不要再当「无此功能」。

---

## 8. 计数 + 验算

| 桶 | N | 命令 / 算法 |
| --- | --- | --- |
| 15 必须补行 | 6 | 15 §5 表体 `^\| \`` |
| 本文件裁决行 | 6 | §2 表体（不含表头） |
| A 已覆盖 | 4 | Forgot / Start_call / Mute_and_dismiss / Hide_chat |
| B NEW `fill.*` | 2 | `rg -c '^\| `fill\.'` → 2 |
| C 非用户可点 | 0 | — |
| 15 剩余 MISS | 54 | 60 − 6 |
| 剩余 MISS 升格 | 0 | §5 |
| 仍必须补 | 0 | §6 empty |

```text
4 + 2 + 0 = 6
60 − 6 = 54
54 分组：18 + 6 + 1 + 29 = 54
仍必须补 = 0
```

去重稳定 id（本文件新建）= **2**：`fill.join.channel.fullpage` `fill.unread.clear-all.confirm`。

---

## 9. 停条件

**仍必须补 = empty。** 15 列出的这 6 个 chat/room/account 动词，停条件已清。

未宣称产品总掌握：00 的 **135** 条 `[待渲染实测]`（01=15 … 11=10）仍在；Admin `Settings.json` / `settings.add`（05：**约 972** 次）仍是组级、不按 key 建行。本文件只关掉 15 的动词清单。

---

## 10. 边界

- 不并入 `packages/livechat` widget（08 已处理）。
- 不把 13 `room.join.preview-blocked` 冒充整页 `Join_channel`。
- 不把 13 `room.chrome.escape-mark-read` 冒充 Shift/Ctrl+Esc 清全部未读。
- 不把 07 `page.account.security.e2e-reset` 冒充模态内 `Forgot_E2EE_Password`（canonical 是 14 的 forgot 行）。
- HIT/覆盖只证明有稳定 id 与入口，不证明 role+name 已实测。

调查日：2026-08-20。基线：`cursor/pm-atlas-merge-06-11-f8ed`。
