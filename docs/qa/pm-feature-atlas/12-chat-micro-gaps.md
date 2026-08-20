# 12 — 聊天微交互缺口（quote / reply / edit-last / retry）

- 仓库：`https://github.com/jianwyao01/Rocket.Chat`（fork of RocketChat/Rocket.Chat）
- 调查分支：`cursor/pm-atlas-merge-06-11-f8ed` @ `9a0eab0287`（基线 `develop` `e10bd504b9`）
- **不改产品代码。** 本分册只猎 MESSAGE + COMPOSER + THREAD 上用户可感知、且 **01 / 03 / 10 / 11 还没有独立行** 的微交互。
- 诚实标记：`[读]` = 源码推断；`[待渲染实测]` = 未在真实 RC Web 核对 role+name / 时序。
- 列约定：`触发后果三件套` = (1) DOM 出现/消失的元素 role+name (2) endpoint/method (3) 刷新后仍在什么。
- 本分册命名空间：`chat.micro.*`。一行 = 一个新发现的用户可感知操作，**或** PM 必须知道的负向断言。
- **规则**：01 / 03 / 10 / 11 已有 id **不是**新行，只在「关联」列指向。先抽这些 id，再猎缺口。

入口前缀约定（可回放）：

- `房间消息` / `悬停工具栏` / `More` = 01。
- `房间时间线` / `消息行` = 10。
- `textarea[name=msg]` / composer bar = 03 / 11。
- `线程面板` = 顶栏 Threads → 打开某线程 → `rcx-thread-view`。

---

## 方法

1. `rg` 01 / 03 / 10 / 11 抽出 quote / reply / edit / copy / forward / retry / ArrowUp 相关 **已有** id（下表）。这些只 关联。
2. 从消息工具栏 Items、composer `MessageBox` / `createComposerAPI`、线程 `Thread.tsx` / `ThreadChat.tsx` / `ThreadTitle.tsx` 再扫一遍 **用户可点** 且无 atlas 行的入口。
3. 猎单里写了「若存在必须成行；若缺席写负向断言」的项（Arrow-up 编辑上一条、失败重试、键盘 Quote、长按菜单、OTR 等）：存在则 关联；缺席则本册给 `*.absent` 行。
4. 已消化路径写入 **## 确认已消化**，不得再复制成 `chat.micro.*`。

命令（本工作已跑）：

```
rg -n 'quote|reply|edit|copy|forward|retry|ArrowUp|arrow-up|prevMessage|read-receipt' \
  docs/qa/pm-feature-atlas/01-message-toolbar.md \
  docs/qa/pm-feature-atlas/03-composer-implicit.md \
  docs/qa/pm-feature-atlas/10-message-timeline.md \
  docs/qa/pm-feature-atlas/11-composer-states.md
```

---

## 已有 id（关联，不是新行）

从 01 / 03 / 10 / 11 抽出。表体 **不是** `chat.micro.*`。

| 已有 id | 分册 | 覆盖的微交互 | 出处锚 |
| --- | --- | --- | --- |
| `msg.quote` | 01 | 悬停工具栏 Quote（房间 / native 联邦 / **线程**）；**More 无此项** | `QuoteMessageAction.tsx`；`DefaultItems.tsx:18`；`ThreadsItems.tsx:18` |
| `msg.thread.reply` | 01 | Reply_in_thread 图标（非 threads context） | `ReplyInThreadMessageAction.tsx` |
| `msg.reply.dm` | 01 | More → Reply_in_direct_message | `useReplyInDMAction.ts` |
| `msg.forward` | 01 | 工具栏 Forward_message | `ForwardMessageAction.tsx` |
| `msg.permalink.copy` | 01 | More → Copy_link；Forward 模态 Copy_Link | `usePermalinkAction.ts` |
| `msg.copy.text` | 01 | More → Copy_text | `useCopyAction.ts` |
| `msg.edit` | 01 | More → Edit | `useEditMessageAction.ts` |
| `msg.read-receipts` | 01 | More → Read_Receipts（**不是**消息上的勾） | `useReadReceiptsDetailsAction.tsx` |
| `composer.edit.cancel` | 03 | 编辑态点 Cancel **或** Escape | `MessageBox.tsx:198-214,244-248,513` |
| `shortcut.composer.prevMessage` | 03 | 光标行首 ArrowUp → 编辑上一条自己的消息 | `MessageBox.tsx:251-260`；`ChatMessages.ts:53-73` |
| `shortcut.composer.nextMessage` | 03 | 光标文末 ArrowDown → 下一条可编辑 | `MessageBox.tsx:266-276` |
| `shortcut.composer.escape` | 03 | Esc 退出编辑或空内容回调 | `MessageBox.tsx:245-248` |
| `implicit.composer.hint.editing` | 03 | 编辑 hint `Editing_message` + 桌面 `Editing_message_hint` | `MessageBoxHint.tsx:36-51` |
| `implicit.quote.barDisplay` | 03 | composer 上方引用预览（进入来自 toolbar，本行只展示） | `MessageBoxReplies.tsx:16-26` |
| `implicit.quote.dismissOne` | 03 | 引用条 `aria-label=Dismiss_quoted_message` | `MessageBoxReply.tsx:44-51` |
| `implicit.quote.fromUrl` | 03 | `?reply={mid}` 自动挂引用 | `useQuoteMessageByUrl.ts:15-27` |
| `thread.panel.close` | 03 | 线程 header Close / 展开态 backdrop | `Thread.tsx:82-84` |
| `thread.panel.backToList` | 03 | 线程 header ContextualbarBack | `Thread.tsx:64-66` |
| `thread.panel.toggleFollow` | 03 | 线程 header bell / bell-off | `Thread.tsx:124-128` |
| `thread.composer.reply` | 03 | 线程 composer 发送（带 tmid） | `ThreadChat.tsx:113-137` |
| `thread.composer.alsoSendToChannel` | 03 | Also_send_to_channel 勾选 | `ThreadChat.tsx:124-135` |
| `thread.composer.escapeLeave` | 03 | 空线程 composer Esc 关面板 | `ThreadChat.tsx:50-52` |
| `tl.quote.jump` | 10 | 时间线引用块 jump 图标 | `QuoteAttachment.tsx:67` |
| `tl.quote.author` | 10 | 时间线引用作者 `author_link` | `QuoteAttachment.tsx:59-63` |
| `tl.quote.time` | 10 | 时间线引用时间戳走 `message_link` | `QuoteAttachment.tsx:64-66` |
| `tl.body.code.copy` | 10 | 围栏代码块 Copy | `CodeBlock.tsx:76-94` |
| `tl.thread.view` | 10 | 主消息 View_thread | `ThreadMetrics.tsx:43-52` |
| `tl.thread.follow` | 10 | 主消息铃铛跟随 | `ThreadMetricsFollow.tsx:39-45` |
| `tl.thread.preview.open` | 10 | 主列表线程预览行进线程 | `ThreadMessagePreview.tsx:59-81` |
| `tl.broadcast.reply` | 10 | 广播房他人消息 Reply → DM 引用 | `BroadcastMetrics.tsx:17-26` |
| `tl.attach.image.retry` | 10 | **图片加载**失败 Retry（不是发送失败） | `Retry.tsx:21-25` |
| `tl.unread.jump` | 10 | 未读 Bubble（icon=`arrow-up`）跳第一条未读；**不是**编辑上一条 | `UnreadMessagesIndicator.tsx:23-29` |
| `composer.state.send.edit.save` | 11 | 编辑态 Send → `chat.update` | `sendMessage.ts:44-46` |
| `composer.state.send.edit.empty-delete` | 11 | 编辑清空再 Send → delete | `sendMessage.ts:128-144` |
| `composer.fmt.quote.absent` | 11 | 格式栏 **没有** blockquote mark | `messageBoxFormatting.ts:34-106` |
| `composer.state.quote.add` | 11 | Quote 后 bar 出现（单条语境） | `createComposerAPI.ts:113-116` |
| `composer.state.quote.dismiss` | 11 | 关掉单条引用 chip | `MessageBoxReply.tsx:44-51` |
| `composer.state.quote.send` | 11 | 带引用发出，bar 乐观清空 | `sendMessage.ts:96-119` |
| `composer.state.upload.chip.error` | 11 | 失败 upload chip **无 Retry** | `MessageComposerGenericFile.tsx:35-37` |
| `composer.state.upload.chip.cancel` | 11 | 上传中 chip Cancel | 11 C |
| `composer.popup.emoji-colon` | 03 | `:name` 短码补全 | `ComposerPopupProvider.tsx:216-273` |
| `composer.popup.mention` / `composer.popup.mention.user.keyboard` | 03 / 11 | `@` 后 Tab/Enter 插入提及 | `useComposerBoxPopup.ts:181-190` |
| `composer.state.slash.execute` | 11 | `/cmd` 真正执行（含 `/me` `/join` `/invite`） | `processSlashCommand.ts:64-113` |
| `composer.state.thread.also-send-on` / `also-send-off` | 11 | 线程 also-send 开关状态 | `ThreadChat.tsx:122-134` |

**已有相关去重 id**：01 抽出 8；03 抽出 15（含 hint / unread.jumpToFirst 不进上表正文时可并 implicit）；10 抽出 10；11 抽出 12（含 upload cancel / slash / mention keyboard）。上表去重 **44**。命令见文末验算。

---

## 表 A. NEW `chat.micro.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| chat.micro.quote.multi | 已有一条引用时再 Quote 另一条，bar 堆第二条 chip | `房间消息 A→悬停工具栏→Quote`（01 `msg.quote`）→ `房间消息 B→悬停工具栏→Quote` | 同 `msg.quote`；`quotedMessages` 是数组 `createComposerAPI.ts:40,113-114`。同一 mid 不会变成两条（见 `same-readd`）。 | `[读]` ①composer 上方 `maxHeight=x256` 的块里出现 **两条** `QuoteAttachment` + 各自 `Dismiss_quoted_message` `MessageBoxReplies.tsx:21-25`。②两次点击皆无 REST。③仅内存；刷新掉（除非 URL `?reply=` 只恢复 **一条**）。`[待渲染实测]` 两条 chip 的 list/region name | core | `msg.quote`；`composer.state.quote.add`；`implicit.quote.barDisplay` | `createComposerAPI.ts:113-116`；`MessageBoxReplies.tsx:16-26` |
| chat.micro.quote.of-quote | Quote 一条本身带引用链的消息时按链长截断嵌套 | `房间时间线→已含引用附件的消息→悬停工具栏→Quote` | `Message_QuoteChainLimit` 默认 **2** `MessageBox.tsx:120`；`settings/message.ts:230`。`limit < 2` 或当前层 `>= limit` 时剥掉更深的 quote 附件，**保留**非 quote 附件 `limitQuoteChain.ts:21-23`。 | `[读]` ①composer chip 里嵌套 quote 比原消息浅；发出后时间线引用链同样被截。②点击无 REST；发送 `POST /v1/chat.sendMessage`（`prependReplies` 先写 `[ ](permalink)` `prependReplies.ts:6-15`）。③发出后引用链 persist 为截断后的附件。[读] | core+setting | `msg.quote`；`composer.state.quote.add` | `createComposerAPI.ts:114`；`limitQuoteChain.ts:8-37` |
| chat.micro.quote.same-readd | 对同一条再点 Quote **不会**关掉引用，只是挪到数组末尾 | `已引用 mid=X 的 bar 仍在→同一条消息再点 Quote` | 该 mid 已在 `_quotedMessages` | `[读]` ①chip **不**消失；`filter(_id!==mid)` 后再 `push` 同一条 `createComposerAPI.ts:114`。②无 REST。③仍 session。PM 勿当成 toggle。负向：没有「再点 Quote 取消」 | core | `msg.quote`；`composer.state.quote.dismiss` | `createComposerAPI.ts:113-116` |
| chat.micro.quote.keyboard.absent | **没有**键盘 Quote 和弦 | 焦点 textarea 或消息行 → 试 Ctrl/Cmd+Q 或任意未文档化和弦；打开 `Shift+?` 快捷键 modal | `KeyboardShortcutsModal.tsx` `SHORTCUTS` **9** 条无 quote；`MessageBox` keyboard switch 只有 Escape / ArrowUp / ArrowDown / Enter；`formattingButtons` 无 quote command | `[读]` ①modal 无 Quote 行；textarea 不出现引用条。②无。③无。负向断言 | core | `msg.quote`；`composer.fmt.quote.absent`；`shortcut.global.showShortcutsModal` | `KeyboardShortcutsModal.tsx:17-66`；`MessageBox.tsx:216-278` |
| chat.micro.quote.more.absent | Quote **不**出现在 More 菜单 | `房间消息→悬停工具栏→More` | Quote 只挂 `*Items` 图标（`DefaultItems` / `ThreadsItems` / `FederatedItems` / `MobileItems`）；`MessageToolbarActionMenu` 的 hook 列表 **无** quote | `[读]` ①More 里无 `Quote` 项；Quote 只在工具栏图标位。②无。③无。负向断言 | core | `msg.quote` | `DefaultItems.tsx:17-20`；`MessageToolbarActionMenu.tsx:46-77` |
| chat.micro.quote.bar.jump.absent | composer 引用 chip **没有**时间线上的 jump / 作者链 | `已 Quote→看 composer 上方 chip`（不要点时间线引用块） | `MessageBoxReply` 手造 attachment：**无** `message_link`、**无** `author_link`；`attachments`/`collapsed` 皆 true `MessageBoxReply.tsx:31-40`。`QuoteAttachment` 只在这两个字段存在时才渲染可点链 | `[读]` ①chip 上看不到 `title=Jump_to_message`；作者名不是 `a`；时间戳无 href。可点的只有 `Dismiss_quoted_message`。②无。③无。与 10 `tl.quote.jump` **不是**同一入口。负向断言 | core | `tl.quote.jump`；`tl.quote.author`；`tl.quote.time`；`composer.state.quote.dismiss` | `MessageBoxReply.tsx:30-51`；`QuoteAttachment.tsx:59-67` |
| chat.micro.send.retry.absent | 发送 REST 失败后 **没有**消息行 Retry | `已订阅房间→输入→Send`，让 `POST /v1/chat.sendMessage` reject（断网 / 4xx） | `process` 先 `runOptimisticSendMessage`（`temp:true`）再 REST `sendMessage.ts:48-51`；`catch` 只 `dispatchToastMessage` `sendMessage.ts:122-124`。时间线 **无** Retry 按钮。`tl.attach.image.retry` 是图片 onError，不是发送。 | `[读]` ①失败 toast（文案视 error）；该 `listitem` `isPending` / `aria-busy=true` 可能仍在 `RoomMessage.tsx:113,120`。[待渲染实测] pending 透明度与 toast name。②失败的是该 POST；**无**重发 endpoint 被 UI 再触发。③刷新后 temp 记录不在 server，行消失。负向断言 | core | `composer.send`；`tl.attach.image.retry`；`composer.state.upload.chip.error` | `sendMessage.ts:49-51,113-124`；`runOptimisticSendMessage` `app/lib/client/methods/sendMessage.ts:34-47` |
| chat.micro.send.cancel.absent | **没有**取消进行中 / 失败乐观发送的控件 | 同上：发出后、REST 未返回或已失败 → 在该 listitem / composer 找 Cancel | composer Cancel **只**在编辑态 `composer.edit.cancel`。upload chip Cancel 是附件 XHR，不是 chat.sendMessage。乐观行无 cancel handler。 | `[读]` ①无「取消发送」按钮；编辑 Cancel 不出现（`!mid`）。②无 abort。③失败 temp 行刷新掉。负向断言 | core | `composer.edit.cancel`；`composer.state.upload.chip.cancel` | `sendMessage.ts:113-124`；`RoomMessage.tsx:113-120` |
| chat.micro.send.toast.click.absent | 发送失败 toast **不是**重试入口 | 触发 `chat.micro.send.retry.absent` 后 → 点 error toast | `dispatchToastMessage` 无 onClick 载荷 `toast.ts:22-25`；`ToastMessagesProvider` 只 `dispatchToastBar({ type, title, message })` `ToastMessagesProvider.tsx:50-69`。Fuselage ToastBar 点击通常只关掉条。[待渲染实测] 关 toast 的精确 role | `[读]` ①toast 消失或保持；composer / 乐观行 **不**因此重发。②无第二发 `chat.sendMessage`。③无。负向断言 | core | `chat.micro.send.retry.absent` | `toast.ts:22-25`；`ToastMessagesProvider.tsx:50-69` |
| chat.micro.composer.resize.absent | composer **没有**用户可拖的高度手柄 | 把指针移到 textarea 底边 / 右下角找 resize handle | `useAutoGrow` 只随输入把 `height` 设为 `scrollHeight` `useAutoGrow.ts:24-43`。`RoomBody` `onResize={handleComposerResize}` 是布局回调，不是手柄。textarea style **无** `resize:vertical`。 | `[读]` ①无 drag handle；高度随字数自动变。②无 REST。③不 persist。负向断言 | core | `composer.send` | `useAutoGrow.ts:11-62`；`RoomBody.tsx:237-238` |
| chat.micro.composer.md-preview.absent | composer **没有** Markdown 预览开关 | 看格式栏 / overflow `Message_Formatting_toolbox` / Send 旁 | `formattingButtons` 7 项：bold / italic / strike / inline-code / multiline-code / link / katex。全 `client/views/room/composer` **无** preview/markdown-preview 控件。`RoomBody.tsx:242-243` `previewUrls` 仍是 TODO，未挂发送前 URL 预览选择器。 | `[读]` ①无 Preview / 预览 tab。手打 markdown 发出后才在时间线渲染。②无。③无。负向断言 | core | `composer.fmt.quote.absent`；`composer.format.bold` | `messageBoxFormatting.ts:34-106`；`RoomBody.tsx:242-243` |
| chat.micro.otr.absent | 本仓库 **没有** OTR 房间动作 / 消息动作 | 打开 DM → 房间工具箱 / 消息 More / composer 找 OTR | `rg` `apps/meteor/client` `apps/meteor/app` `ee`：`OTR` / `OTR_Enabled` / `useOTR` **0** 命中。E2EE 走 10 `tl.e2ee.*` 与 11 `composer.state.send.e2ee.*`，不是 OTR。 | `[读]` ①无 OTR 按钮 / 会话条。②无 otr endpoint。③无。负向断言 | — | `tl.e2ee.save-password`；`composer.state.send.e2ee.hint` | 全 `client`/`app`/`ee` 无匹配 |
| chat.micro.thread.title.jump.absent | 线程栏标题 **不是**跳回父消息的控件 | `线程面板→header ContextualbarTitle`（主消息 HTML 标题） | `ThreadTitle` 只 `dangerouslySetInnerHTML`，无 onClick `ThreadTitle.tsx:11-16`。跳回主时间线走消息上的 `msg.jump`（threads Items）。 | `[读]` ①点标题不导航、不写 `?msg=`。②无 REST。③无。负向断言 | core | `msg.jump`；`thread.panel.close`；`thread.panel.backToList` | `ThreadTitle.tsx:11-16`；`Thread.tsx:111-115` |
| chat.micro.slash.join.already-member | `/join` 已在该房时客户端改写成 `/open` 并跳转 | `textarea` 行首 `/join #已加入的频道` → Send | 命令 permission `view-c-room`；`result` 看 `error-user-already-in-room` `slashcommands-join/client/client.ts:10-16`。这是 **slash result 回调**，不是 Join 按钮（03 `composer.join`）。 | `[读]` ①composer `clear()`；路由进该频道（`/open` clientOnly）。②先 `POST /v1/commands.run`（join）；already-in-room 后本地 `slashCommands.run({command:'open'})`，`/open` 用订阅路由，必要时 `POST /v1/im.create`。③落在该房。`[待渲染实测]` 是否闪错误 toast | core+permission | `composer.state.slash.execute`；`composer.join` | `slashcommands-join/client/client.ts:3-16`；`slashcommands-open/client/client.ts:9-42` |

**A 计数**：14。

---

## 确认已消化

猎过、但 **已有 id 盖住**（或明确只读 / 无第二套入口）。每条 = 猎路径 + 已有 id。不另建 `chat.micro.*`。

| 猎路径 | 结论 | 已有 id |
| --- | --- | --- |
| 工具栏图标 Quote | 存在 | `msg.quote` |
| 线程消息 Quote | `ThreadsItems` 挂同一图标 | `msg.quote` |
| More → Quote | **无**此项 | 本册 `chat.micro.quote.more.absent` |
| 键盘 Quote | **无**绑定；modal 未列 | 本册 `chat.micro.quote.keyboard.absent` |
| 去掉引用 chip | 每条一个 dismiss | `implicit.quote.dismissOne`；`composer.state.quote.dismiss` |
| 多条引用堆叠 | 数组 API 在，03/11 只写了「出现块」单数语境 → **本册补** `chat.micro.quote.multi` | 关联 `composer.state.quote.add` |
| 引用的引用（链长） | 11 把门控写进 add，未写截断后果 → **本册补** `chat.micro.quote.of-quote` | 关联 `composer.state.quote.add` |
| 时间线引用 jump / 作者 / 时间 | 10 三行；blockquote 本身不可点 | `tl.quote.jump` `tl.quote.author` `tl.quote.time` |
| composer chip 上的 jump | 手造 attachment 无 link | 本册 `chat.micro.quote.bar.jump.absent` |
| `?reply=` 自动引用 | URL 入口 | `implicit.quote.fromUrl` |
| Reply vs Quote | 主列表 **没有** 名叫 Reply 的普通回复。Quote = 引用进当前 composer。 | `msg.quote` |
| Reply_in_thread | 工具栏图标 | `msg.thread.reply`；时间线 `tl.thread.view` |
| Reply_in_direct_message | More | `msg.reply.dm` |
| 广播房 Reply | 消息体 metrics，不是工具栏 | `tl.broadcast.reply` |
| Arrow-up 编辑上一条自己的消息 | **存在**（经典 RC）。光标 `selectionEnd===0`；跳过 videoconf；`canUpdateMessage`（`edit-message` 或 `Message_AllowEditing`+自己的+时限） | `shortcut.composer.prevMessage`；保存 `composer.state.send.edit.save`；More 进入 `msg.edit` |
| ArrowDown 下一条 | 存在 | `shortcut.composer.nextMessage` |
| Escape 取消编辑 | 存在（钮 + 键） | `composer.edit.cancel`；`shortcut.composer.escape` |
| 失败发送 Retry / Cancel / toast 当按钮 | **都不存在**（图片 Retry 是另一件事） | 本册三条 `chat.micro.send.*`；图片 `tl.attach.image.retry`；upload `composer.state.upload.chip.error` |
| 消息上的投递勾 / 已读勾点击 | `role=status`，**无** onClick；详情走 More | 10「验过无点击」→ `msg.read-receipts` |
| 移动长按菜单 | `message-mobile` Items **已注册**；develop **无** `context='message-mobile'` 赋值。`MessageToolbarHolder` 用 IntersectionObserver，**无** long-press / contextmenu handler | 01 表 B.message-mobile；`MessageToolbarHolder.tsx:19-22` |
| Tab 提及 | popup 开时 Tab = 选中 | `composer.popup.mention`；`composer.popup.mention.user.keyboard`；`shortcut.popup.select` |
| emoji 短码 `:name:` | colon popup | `composer.popup.emoji-colon`；picker 是 `composer.emoji.picker` |
| 行首 `+:` 大表情 | 另一套 popup | `composer.popup.emoji-plus` |
| composer 拖高手柄 | **无** | 本册 `chat.micro.composer.resize.absent` |
| markdown 预览 | **无** | 本册 `chat.micro.composer.md-preview.absent` |
| 线程 also-send-to-channel | 03 + 11 | `thread.composer.alsoSendToChannel`；`composer.state.thread.also-send-on/off` |
| 线程 Close X | header `ContextualbarClose` | `thread.panel.close` |
| 线程 header 跟随铃 | 同面板 | `thread.panel.toggleFollow` |
| 线程 header 标题跳父消息 | **不可点** | 本册 `chat.micro.thread.title.jump.absent`；跳转用 `msg.jump` |
| 线程返回列表 | Back | `thread.panel.backToList` |
| 广播 Reply 剩余 chrome | 自己的消息无此钮（10 已写） | `tl.broadcast.reply` |
| OTR | 仓库删除 | 本册 `chat.micro.otr.absent` |
| 单条 E2EE pending 解密按钮 | 只读占位；工具栏也藏 | 10 `tl.e2ee.*` +「验过无点击」 |
| MessageAction 已注册但不在 01 | `MessageAction.ts` 只剩 **类型**；无 `addButton`。More hook 21 个 + Stars apps = 01 表 A **26** 去重 id。本工作 `ls` `toolbar/use*Action*` 与 01 一一对应，**无漏挂** | 01 表 A |
| `/me` | 无额外 chrome：`params` 包成 `_{params}_` 再 `executeSendMessage` | `composer.state.slash.execute`；`server/slashcommands/me/me.ts:11-18` |
| `/invite` | 成功只 `invalidateQueries` members；palette / execute 已在 11；**无**第二套 UI | `composer.state.slash.execute`；`slashcommands-invite/client/client.ts:5-16` |
| `/join` 按钮 vs 命令 | Join **按钮**是未订阅页脚 | `composer.join`；`composer.state.join.preview` |
| `/join` 已在房 | result 改写 `/open` | 本册 `chat.micro.slash.join.already-member` |
| 编辑指示 / 钉 / 星 / 钥匙 | 只读 | 10「验过无点击」 |
| 快捷键 modal「移到行首/行尾」 | 03 已声明：浏览器 textarea 原生，无 RC handler | 03 B10 引言 |
| `message-mobile` 长按若将来赋值 | 01 已按「已注册未挂入口」收录整表 B | 01 |

---

## 已覆盖 checklist（quote / reply / edit-last / retry）

评审员按此回放，不要再发明同义 id。

| 主题 | 状态 | id |
| --- | --- | --- |
| Quote 工具栏图标 | 已覆盖 | `msg.quote` |
| Quote 来自线程 | 已覆盖（同一 id） | `msg.quote` |
| Quote 在 More | **缺席**（本册负向） | `chat.micro.quote.more.absent` |
| Quote 键盘 | **缺席**（本册负向） | `chat.micro.quote.keyboard.absent` |
| 去掉 quote chip | 已覆盖 | `implicit.quote.dismissOne` / `composer.state.quote.dismiss` |
| 多条 quote | **本册新行** | `chat.micro.quote.multi` |
| quote of quote 截断 | **本册新行** | `chat.micro.quote.of-quote` |
| 再点同一条 Quote | **本册新行**（非 toggle） | `chat.micro.quote.same-readd` |
| 时间线引用 jump | 已覆盖 | `tl.quote.jump` |
| composer chip jump | **缺席**（本册负向） | `chat.micro.quote.bar.jump.absent` |
| Reply（普通） | 不存在；用 Quote | `msg.quote` |
| Reply_in_thread | 已覆盖 | `msg.thread.reply` / `tl.thread.view` |
| Reply_in_DM | 已覆盖 | `msg.reply.dm` |
| 广播 Reply | 已覆盖 | `tl.broadcast.reply` |
| Arrow-up 编辑上一条 | **存在且已覆盖** | `shortcut.composer.prevMessage` |
| Escape / Cancel 退出编辑 | 已覆盖 | `composer.edit.cancel` |
| 发送失败 Retry | **缺席**（本册负向） | `chat.micro.send.retry.absent` |
| 发送失败 Cancel | **缺席**（本册负向） | `chat.micro.send.cancel.absent` |
| 失败 toast 当重试钮 | **缺席**（本册负向） | `chat.micro.send.toast.click.absent` |
| 图片加载 Retry | 已覆盖（别混） | `tl.attach.image.retry` |

---

## MessageAction 对账（01 无漏）

`ls apps/meteor/client/components/message/toolbar/use*Action*`（去 spec）与 01 表 A 对应：

| hook | 01 id |
| --- | --- |
| `useWebDAVMessageAction` | `msg.webdav.save` |
| `useNewDiscussionMessageAction` | `msg.discussion.start` |
| `useUnpinMessageAction` / `usePinMessageAction` | `msg.unpin` / `msg.pin` |
| `useStarMessageAction` / `useUnstarMessageAction` | `msg.star` / `msg.unstar` |
| `usePermalinkAction` | `msg.permalink.copy` |
| `useFollowMessageAction` / `useUnFollowMessageAction` | `msg.thread.follow` / `msg.thread.unfollow` |
| `useMarkAsUnreadMessageAction` | `msg.unread.mark` |
| `useTranslateAction` / `useViewOriginalTranslationAction` | `msg.translate` / `msg.translate.original` |
| `useReplyInDMAction` | `msg.reply.dm` |
| `useCopyAction` | `msg.copy.text` |
| `useEditMessageAction` | `msg.edit` |
| `useDeleteMessageAction` | `msg.delete` |
| `useReportMessageAction` | `msg.report` |
| `useShowMessageReactionsAction` | `msg.reaction.list` |
| `useReadReceiptsDetailsAction` | `msg.read-receipts` |
| `useMessageActionAppsActionButtons` | `msg.apps.action` / `msg.apps.ai` |

图标（非 hook）：`ReactionMessageAction` `QuoteMessageAction` `ReplyInThreadMessageAction` `ForwardMessageAction` `JumpToMessageAction` → `msg.reaction.add` `msg.quote` `msg.thread.reply` `msg.forward` `msg.jump`。

**无**第 27 个已注册用户动作漏出 01。

---

## 待渲染实测

1. 两条 quote chip 叠在 `maxHeight=x256` 里时的 list/region 可访问名。
2. `Message_QuoteChainLimit=2` 时 composer chip 里还能看见几层嵌套 quote。
3. 发送失败后乐观行是否保持 `aria-busy`、Fuselage `isPending` 样式，以及 toast 精确 name。
4. 点 error toast 是关掉条还是无响应（Fuselage ToastBar 默认）。
5. `/join` 已在房：是否先闪 join 错误再跳 `/open`。
6. 移动视口悬停工具栏是否被当成「长按菜单」（01 已标未实测；本册确认 **无** 独立 long-press 代码路径）。

---

## 验算

| 节 | 行 | 式 |
| --- | --- | --- |
| 已有 id 抽出表 | 44 | 上表行数（手算） |
| A NEW | 14 | quote 行为 3 + quote 负向 3 + send 负向 3 + composer 负向 2 + otr + thread title + slash.join |

命令：

```
rg -c '^\| chat\.micro\.' docs/qa/pm-feature-atlas/12-chat-micro-gaps.md
# → 14

rg -o '^\| chat\.micro\.[a-z0-9.-]+' docs/qa/pm-feature-atlas/12-chat-micro-gaps.md | sort -u | wc -l
# → 14
```

本工作实跑：表体 **14**，去重 **14**。

与 01–11 **无 id 字符串碰撞**（前缀 `chat.micro.`）。

---

## 边界

- **OUT**：01 工具栏已列动作不重做；10 时间线正文点击不重做；03/11 composer 入口与状态不重做。
- **IN**：同一按钮的 **第二种用户可感知后果**（多 quote、链截断、再点非 toggle），以及 PM 会以为存在的缺席。
- 不改 00-blueprint 拼接（本 PR 只加分册 + 索引行）。
