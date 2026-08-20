# 12 — 聊天微交互缺口（quote / reply / edit-last / failed-send）

- 仓库：`https://github.com/jianwyao01/Rocket.Chat`
- 调查分支：`cursor/pm-atlas-merge-06-11-f8ed` @ `9a0eab0287`（基线 `develop` `e10bd504b9`）
- **GAP HUNT only。不改产品代码。不改写 00–11 已有 id。**
- 本合并文件：canonical = [PR #13](https://github.com/jianwyao01/Rocket.Chat/pull/13) `cursor/pm-atlas-12-chat-micro-gaps-b355`（35 行）。再并入 [PR #15](https://github.com/jianwyao01/Rocket.Chat/pull/15) `cursor/pm-atlas-chat-micro-gaps-97a2` **仅 unique** 9 行（§J / 12b）。不保留第二份冲突的 12。同字符串 4 行与近碰撞 `send.cancel.absent` 见 00「分册冲突 / canonical aliases」。
- 命名空间：`chat.micro.*`。一行 = 一个**尚未被 00/01/03/10/11 占用**、且用户能做（或必须钉死「做不到」）的动作。
- 诚实标记：`[读]` = 源码推断；`[待渲染实测]` = 未挂真实 RC Web 核对 role+name / 时序。
- 列约定：`触发后果三件套` = (1) DOM role+name 出现/消失 (2) endpoint/method (3) 刷新后仍在什么。
- 已有 id **只进文末「已覆盖对照」**，不在本节复行。

## 方法

1. 枚举 `onClick` / `onKeyDown` / `role=button` / `role=link`：
   - `apps/meteor/client/components/message/**`
   - `apps/meteor/client/views/room/body/**`
   - `apps/meteor/client/views/room/MessageList/**`
   - composer 引用条 `MessageBoxReplies.tsx` / `MessageBoxReply.tsx`
   - 发送失败 / pending / queued：`sendMessage.ts` + `runOptimisticSendMessage` + `RoomMessage isPending`
2. 每个入口在 00/01/03/10/11 搜稳定 id。命中 → 对照，**不**新建。
3. 未命中且用户能做 → NEW 8 列行。用户**做不到**且 MUST 要求裁决 → `.absent` 负向行 + `file:line`。

入口前缀：`房间消息` / `悬停工具栏` / `More` 同 01；`房间时间线` 同 10；`textarea[name=msg]` 同 03。

---

## MUST 裁决（每条必须有「有 / 无」）

| MUST 项 | 裁决 | 去向 |
| --- | --- | --- |
| 工具栏 Quote | **有** | 对照 `msg.quote`（01） |
| More→Quote | **无** | NEW `chat.micro.quote.more.absent` |
| 键盘 Quote | **无** | NEW `chat.micro.quote.keyboard.absent` |
| 去掉 quote chip | **有** | 对照 `implicit.quote.dismissOne`（03）/ `composer.state.quote.dismiss`（11） |
| 多条引用 | **有** | NEW `chat.micro.quote.multi`（03/11 只写了「出现 bar / 关一条」） |
| 从线程 Quote | **有** | 对照 `msg.quote`（01 入口含 `线程消息→Quote`；`ThreadsItems.tsx:18`） |
| 从搜索 Quote | **无** | NEW `chat.micro.quote.from-search.absent` |
| Reply-in-thread 工具栏 | **有** | 对照 `msg.thread.reply`（01） |
| Reply-in-thread More | **无**（图标在工具栏，不进 More） | NEW `chat.micro.reply.thread.more.absent` |
| Reply-in-thread 搜索结果 | **无** | NEW `chat.micro.reply.thread.from-search.absent` |
| Reply-in-thread 时间线 | **有** | 对照 `tl.thread.view` / `tl.thread.preview.open`（10） |
| Quote（与上两项不同动作） | **有** | 对照 `msg.quote` |
| Reply-in-DM More | **有** | 对照 `msg.reply.dm`（01） |
| Reply-in-DM 广播行 Reply | **有** | 对照 `tl.broadcast.reply`（10） |
| Reply-in-DM 搜索结果 | **无** | NEW `chat.micro.reply.dm.from-search.absent` |
| Arrow-Up 编上一条自己的 | **有** | 对照 `shortcut.composer.prevMessage`（03） |
| Arrow-Down 下一条 | **有** | 对照 `shortcut.composer.nextMessage`（03） |
| 失败/排队发送：Retry | **无** | NEW `chat.micro.send.retry.absent` |
| 失败/排队发送：Cancel | **无** | NEW `chat.micro.send.cancel-pending.absent` |
| 失败 toast | **有** | NEW `chat.micro.send.error-toast`（01/03/11 未拆出发送失败 toast） |
| 排队 UI（独立队列） | **无** | NEW `chat.micro.send.queued-ui.absent` |
| 发送中指示 | **有**（只展示、不可点） | NEW `chat.micro.send.pending.indicator` |
| 正文 Copy text（非 More） | **无**（代码块除外） | NEW `chat.micro.copy.text.from-body.absent`；代码块对照 `tl.body.code.copy` |
| 正文 Copy link（非 More） | **无** | NEW `chat.micro.copy.link.from-body.absent` |
| 长按 / 独立移动菜单 | **无**现行赋值 | NEW `chat.micro.long-press.absent` |
| `:smile:` composer 短码 | **有** | 对照 `composer.popup.emoji-colon`（03） |
| `+:smile:` 给上一条加反应 | **有** | NEW `chat.micro.reaction.plus-shortcode` |
| Ctrl/Cmd+B / +I | **有** | 对照 `shortcut.composer.formatBold` / `formatItalic`（03）+ `composer.fmt.*.apply`（11） |
| Ctrl+ 删除线/代码/链接 | **无**（未接线） | 对照 `composer.fmt.strike.apply` 等「无 command」；不另占 id |
| 收到消息里折叠引用块 | **无** | NEW `chat.micro.quote.collapse.absent` |
| 点引用跳原消息 | **有** | 对照 `tl.quote.jump` / `tl.quote.time`（10） |
| 删除上一条热键 | **无** | NEW `chat.micro.delete.last-hotkey.absent` |
| 菜单删除 | **有** | 对照 `msg.delete`（01） |
| 清空编辑再发送 = 删 | **有** | 对照 `composer.state.send.edit.empty-delete`（11） |
| 删除确认 Cancel | **有**（01 只写到 Yes） | NEW `chat.micro.delete.cancel` |
| Forward 打开+选房+Forward | **有** | 对照 `msg.forward`（01） |
| Forward 评论框 | **无**（`optionalMessage` 写死 `''`） | NEW `chat.micro.forward.comment.absent` |
| Forward 关/取消 | **有** | NEW `chat.micro.forward.close` |
| Forward 模态 Copy_Link | **有** | 对照 `msg.permalink.copy`（01） |
| Pin 确认 Yes | **有** | 对照 `msg.pin`（01 序列含 `Pin_Message`→`Yes_pin_message`） |
| Pin 确认 Cancel | **有**（01 未拆） | NEW `chat.micro.pin.cancel` |
| Star 确认模态 | **无**（直接 POST） | NEW `chat.micro.star.confirm.absent` |
| 反应 picker 搜索/肤色（从消息打开） | **有**（01 只写「选一个」） | NEW `chat.micro.reaction.picker.search` / `picker.tone` |
| 气泡已读勾可点 | **无** | NEW `chat.micro.read-receipt.tick.click.absent`；10 验过无点击 |

---

## A. Quote 缺口

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat.micro.quote.multi` | 已有一条引用时再 Quote 另一条，堆到 composer 上方 | `房间消息 A→悬停工具栏→Quote`（已有 bar）→ `房间消息 B→悬停工具栏→Quote` | `subscription`+`chat`；同 mid 再点只是 `filter` 去重后仍一条 `createComposerAPI.ts:114`。链长 `Message_QuoteChainLimit`（默认 2）裁嵌套附件，**不**限 bar 条数。[读] | `[读]` ①`MessageBoxReplies` 出现 **两条** `QuoteAttachment`（`maxHeight=x256` 可滚）`MessageBoxReplies.tsx:21-25`。[待渲染实测] 是否 `list`。②无 REST until send。③仅内存；刷新掉（除非 `?reply=`） | core+setting | `msg.quote`；`implicit.quote.barDisplay`；`composer.state.quote.add` | `createComposerAPI.ts:113-116`；`MessageBoxReplies.tsx:14-26` |
| `chat.micro.quote.more.absent` | More 菜单**没有** Quote | `房间消息→悬停工具栏→More` 找 Quote | Quote 只挂 `*Items` 图标，**不**进 `MessageToolbarActionMenu` 的 `use*Action` 表 | `[读]` ①More 无 `Quote` 项。②无。③负向。入口只有工具栏图标（+ 未赋值的 `message-mobile`） | core | `msg.quote` | `MessageToolbarActionMenu.tsx:46-77`（无 quote hook）；`DefaultItems.tsx:18` |
| `chat.micro.quote.keyboard.absent` | **没有** Quote 快捷键 | 焦点 textarea 或消息行 → 按任何修饰+Q / 帮助 modal 找 Quote | `KeyboardShortcutsModal` 9 条无 quote；`MessageBox` keydown 无 quote 分支 | `[读]` ①帮助 modal 无 Quote 行；按键不挂引用条。②无。③负向 | core | `shortcut.composer.prevMessage` | `KeyboardShortcutsModal.tsx:17-66`；`MessageBox.tsx:216-278` |
| `chat.micro.quote.from-search.absent` | 搜索结果工具栏**不能** Quote | `顶栏 Search_Messages→关键词→悬停结果` 找 Quote | `SearchItems` 只装配 Jump | `[读]` ①只有 `Jump_to_message`；无 Quote 图标、More 也无 quote hook（search context 不含 permalink/copy/quote）。②无 `quoteMessage`。③负向 | core | `msg.jump`；`msg.quote` | `SearchItems.tsx:11-16` |
| `chat.micro.quote.collapse.absent` | 已发出消息上的引用块**不能**折叠/展开 | `房间时间线→引用 blockquote` 点标题/chevron | `QuoteAttachment` 无 `CollapsibleContent`；blockquote 本身无 onClick（仅 hover 样式） | `[读]` ①无 Collapse/Uncollapse。折叠是附件/Link_Preview（`tl.attach.collapse`），不是引用。②无。③负向 | core | `tl.attach.collapse`；`tl.quote.jump` | `QuoteAttachment.tsx:46-82` |

**A 计数**：5。

---

## B. Reply-in-thread / Quote / Reply-in-DM 三条动作的缺口路径

三条**已存在**的动作本身是 01/10（对照）。这里只补「用户会去找、但源码没挂」的路径。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat.micro.reply.thread.more.absent` | More **没有** Reply_in_thread（它是工具栏图标） | `房间消息→More` 找 Reply_in_thread | hook 表无 reply-in-thread；图标在 `DefaultItems`/`FederatedItems`/`VideoconfItems`/`MobileItems` | `[读]` ①More 无该项。②无。③负向。threads context 连图标都没有（`ThreadsItems` 无 ReplyInThread） | core | `msg.thread.reply` | `MessageToolbarActionMenu.tsx:46-77`；`DefaultItems.tsx:19`；`ThreadsItems.tsx:14-21` |
| `chat.micro.reply.thread.from-search.absent` | 搜索结果**不能** Reply in thread | `Search_Messages→悬停结果` 找 Reply_in_thread | 同 SearchItems 只 Jump | `[读]` ①无该图标。②无 `router.navigate tab=thread`。③负向 | core | `msg.thread.reply`；`msg.jump` | `SearchItems.tsx:11-16` |
| `chat.micro.reply.dm.from-search.absent` | 搜索结果**不能** Reply in DM | `Search_Messages→悬停→More` 找 Reply_in_direct_message | `useReplyInDMAction.context` 不含 `search`；Search More 几乎只可能剩 webdav | `[读]` ①无 Reply_in_direct_message。②无 `openRouteLink('d',…,{reply})`。③负向 | core | `msg.reply.dm` | `useReplyInDMAction.ts:71`；`SearchItems.tsx:11-16` |

**B 计数**：3。Mentions 列表同样只有 Jump（`MentionsItems.tsx:11-16`），与搜索同构，不另占 id（见确认不存在清单）。

---

## C. 编辑上一条 / 删除

Arrow-Up / 菜单 Edit / 菜单 Delete / 清空编辑再发送 = 对照。这里只补删除模态 Cancel，以及「没有单独删上一条热键」。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat.micro.delete.cancel` | 关掉删除确认、不删 | `房间消息→More→Delete→Are_you_sure→Cancel`（或关） | 已打开 `DeleteMessageConfirmModal` | `[读]` ①danger modal 关；listitem 仍在；若当时在编辑该条则 `stop`+focus composer `requestMessageDeletion.ts:20-28`。②无 `chat.delete`。③消息仍在 | core | `msg.delete` | `DeleteMessageConfirmModal.tsx:54-64`；`requestMessageDeletion.ts:31-41` |
| `chat.micro.delete.last-hotkey.absent` | **没有**「一键删上一条」热键 | 帮助 modal 找 Delete；或空 composer 按 Backspace/Ctrl+D | 帮助 9 条无 delete；`MessageBox` 无 delete-last 分支。可达路径只有 More→Delete 或 ↑ 进编辑再清空 Send | `[读]` ①按键不删消息。②无。③负向。删上一条 = `shortcut.composer.prevMessage` + `composer.state.send.edit.empty-delete` | core | `msg.delete`；`composer.state.send.edit.empty-delete` | `KeyboardShortcutsModal.tsx:17-66`；`MessageBox.tsx:216-278` |

**C 计数**：2。

---

## D. 发送 pending / 失败 / 过长

11 写了 Send 启用公式与上传失败 chip，**没有**「消息已乐观进时间线之后」的失败重试，也没有过长转附件模态。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat.micro.send.pending.indicator` | 刚发出的自己的消息呈发送中（不可点） | 已订阅房间 → 非空 Send/Enter → 看刚出现的 `listitem` | `runOptimisticSendMessage` 写 `temp:true`（联邦房 **不**走乐观，`app/lib/client/methods/sendMessage.ts:30-32`）。`RoomMessage` `isPending` + `aria-busy` | `[读]` ①该 `role=listitem` `aria-busy=true` `isPending`；**无** Retry/Cancel 钮。[待渲染实测] fuselage pending 样式 name。②伴随 `POST /v1/chat.sendMessage`。③stream/REST 成功后清 `temp`；刷新不再 pending | core | `composer.send`；`composer.state.send.new` | `sendMessage.ts:49-59`；`app/lib/client/methods/sendMessage.ts:34-44`；`RoomMessage.tsx:113,120`；`ThreadMessage.tsx:41` |
| `chat.micro.send.error-toast` | 发送 REST 失败出 error toast，**不**在气泡上提供 Retry | 断网/服务端拒 → Send | `process()` 或 join 失败 `catch` | `[读]` ①error toast（文案=error）；乐观行可能仍 `temp`。[待渲染实测] 失败后 `aria-busy` 是否一直 true。②失败的 `POST /v1/chat.sendMessage`（或 join `POST /v1/rooms.join`）。③消息通常不 persist；无独立失败气泡 | core | `composer.state.send.e2ee.server-reject` | `sendMessage.ts:72-77,122-123,145-146` |
| `chat.micro.send.retry.absent` | 失败/pending 消息上**没有** Retry | 发送失败后点该 listitem / 找 Retry | 全 `components/message` + `sendMessage.ts` 无 retry 控件 | `[读]` ①无 Retry。②不会重发。③负向。用户只能再打一次 Send | core | `chat.micro.send.error-toast` | `sendMessage.ts:113-124`；`RoomMessage.tsx:102-148` |
| `chat.micro.send.cancel-pending.absent` | **不能**取消已乐观发出、仍 pending 的消息 | pending 行上找 Cancel | 无 cancel-temp API/按钮 | `[读]` ①无 Cancel。②无。③负向。composer 已 `clear()` | core | `chat.micro.send.pending.indicator` | `sendMessage.ts:48-49`；`RoomMessage.tsx:113` |
| `chat.micro.send.queued-ui.absent` | **没有**离线队列/queued 气泡 | 断网连发多条，找 queued/pending 队列条 | 无 queue store；失败只 toast | `[读]` ①无 queued 列表、无「等待发送」。②无。③负向。上传队列是 chip（11），不是消息发送队列 | core | `composer.state.upload.chip.loading` | `sendMessage.ts` 全文无 queue；`client/components/message` 无 queued |
| `chat.micro.send.too-long.as-attachment` | 超长文本改以 txt 附件发出 | textarea 文本 `> Message_MaxAllowedSize` → Send → 模态确认 | 非编辑；`FileUpload_Enabled`；`Message_AllowConvertLongMessagesToAttachment` | `[读]` ①`GenericModal` title=`Message_too_long` 文案 `Send_it_as_attachment_instead_question`；确认后 chip `username - {date}.txt`。[待渲染实测] confirm name。②`uploadFiles` → `POST /v1/rooms.media/:rid`（随后 confirm+send）。③附件消息 persist | core+setting | `composer.send`；`composer.action.file-upload` | `processTooLongMessage.ts:10-39,47-57` |
| `chat.micro.send.too-long.toast` | 不能转附件时只 toast，文本留在 composer | 超长 +（正在编辑 **或** 关上传 **或** 关转附件）→ Send | `mid` 或 `!FileUpload_Enabled` 或 `!Message_AllowConvertLongMessagesToAttachment` | `[读]` ①error toast `Message_too_long`；textarea **仍是**原文。②无 send。③未发出 | core+setting | `composer.state.send.edit.save` | `processTooLongMessage.ts:19-22` |
| `chat.micro.send.too-long.cancel` | 关掉超长转附件模态，不发 | 超长模态 → Cancel / 关 | 模态已开 | `[读]` ①modal 关；原文仍在 textarea。②无 upload。③未发出 | core | `chat.micro.send.too-long.as-attachment` | `processTooLongMessage.ts:42-54` |

**D 计数**：8。

---

## E. 正文复制 / 长按

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat.micro.copy.text.from-body.absent` | 消息体（非代码块、非 More）**没有** Copy text | `消息行→正文` 找 Copy；或长按 | Copy 只在 More `useCopyAction`；正文仅围栏代码 `title=Copy` | `[读]` ①body 无 Copy_text。②无。③负向。浏览器选区复制是原生，无 RC toast | core | `msg.copy.text`；`tl.body.code.copy` | `useCopyAction.ts:14-38`；`RoomMessageContent` 无 copy |
| `chat.micro.copy.link.from-body.absent` | 消息体/时间戳**没有** Copy link | `消息行→时间戳或正文` 找 Copy_link | permalink 只在 More（及 Forward 模态） | `[读]` ①`MessageTimestamp` 无 onClick `MessageHeader.tsx:74-76`。②无。③负向 | core | `msg.permalink.copy`；`tl.quote.time` | `MessageHeader.tsx:74-76`；`usePermalinkAction.ts:10-50` |
| `chat.micro.long-press.absent` | Web **没有**独立长按消息菜单；`message-mobile` 未赋值 | 移动宽度长按消息行 | `MessageToolbarHolder` 只 `IntersectionObserver`+菜单开着保活；全 `client` **0** 处 `context='message-mobile'` | `[读]` ①无 long-press handler / contextmenu 菜单。②无。③负向。`MobileItems` 已装配但无调用方（01 已记） | core | `msg.quote`；01 表 B.message-mobile | `MessageToolbarHolder.tsx:17-53`；`MobileItems.tsx:15-24` |

**E 计数**：3。

---

## F. 反应 picker 内部 / `+:shortcode`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat.micro.reaction.plus-shortcode` | 在 composer 发送 `+:smile:` 给**房间最后一条**加反应（不是发消息） | textarea 只输入 `+:name:`（`name` 在 `emoji.list`）→ Send | `^\+(:.*?:)$`；emoji 必须已注册；存在 `findLastMessage`（本房/本线程最后一条，**不限自己的**） | `[读]` ①composer `clear()`；最后一条反应条出现该 emoji；**不**新增 listitem。②`POST /v1/chat.react` `{emoji, messageId}`；先 `runOptimisticSetReaction`。失败 toast。③刷新后反应仍在 | core | `msg.reaction.add`；`composer.popup.emoji-plus` | `processSetReaction.ts:9-34`；`sendMessage.ts:21-22`；`data.ts:51-55` |
| `chat.micro.reaction.picker.search` | 从**消息**打开的 picker 里搜索再选（01 只写「选一个」） | `悬停工具栏→Add_Reaction` **或** `反应条→title=Add_Reaction` → dialog `aria-label=Search` 输入 | 与 `msg.reaction.add` / `tl.reaction.add` 同门；同一 `EmojiPicker`（`chat.emojiPicker.open`） | `[读]` ①`role=dialog` `Emoji_picker`；`aria-label=Search`；结果 `SearchingResult` / `No_emojis_found`。②选中才 `POST /v1/chat.react`。③`localStorage emoji.recent` | core+preference | `msg.reaction.add`；`composer.state.emoji.search` | `ReactionMessageAction.tsx:78-83`；`MessageListProvider.tsx:111-116`；`EmojiPicker.tsx:139-205` |
| `chat.micro.reaction.picker.tone` | 从**消息**打开的 picker 改肤色 | 同上 dialog → `Skin_tone` → tone 0–5 → 再点 emoji | 同 picker | `[读]` ①后续带肤色的 emoji 按 tone 插入/反应。②无 REST until 选中。③`localStorage emoji.tone` | core | `composer.state.emoji.tone`；`msg.reaction.add` | `EmojiPicker.tsx:240-241`；`EmojiPickerProvider.tsx:23,116` |

**F 计数**：3。composer 工具栏 Emoji 的 search/tone 仍是 11，不复行。

---

## G. Forward / Pin / Star 模态内部

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat.micro.forward.close` | 关掉转发模态、不发 | `悬停工具栏→Forward_message→ModalClose title=Close`（无独立 Cancel 文案钮） | 模态已开 | `[读]` ①`Forward_message` dialog 关。②无 `chat.postMessage`。③本房/目标房都不变 | core | `msg.forward` | `ForwardMessageModal.tsx:96,45-47`；`ForwardMessageAction.tsx:45-47` |
| `chat.micro.forward.comment.absent` | 转发模态**没有**附加评论框 | 打开 Forward 找 comment/textarea | `optionalMessage` 写死 `''`，只 `prependReplies` 原消息 | `[读]` ①只有 `Person_Or_Channel` + 引用预览 + `Copy_Link`/`Forward`。②`POST /v1/chat.postMessage` `{roomId: rooms, text: curMsg}` 无用户评论文本。③负向 | core | `msg.forward` | `ForwardMessageModal.tsx:51-59,98-136` |
| `chat.micro.pin.cancel` | 关掉钉选确认、不钉 | `More→Pin→Pin_Message 模态→Cancel` | 模态已开（`onCancel`） | `[读]` ①warning modal 关；钉选指示不出现。②无 `chat.pinMessage`。③`pinned` 仍 false | core | `msg.pin` | `usePinMessageAction.tsx:35`；`PinMessageModal.tsx:29` |
| `chat.micro.star.confirm.absent` | Star **没有**确认模态 | `More→Star` | `Message_AllowStarring`；非 omni；尚未 star | `[读]` ①无 modal，直接 toast `Message_has_been_starred`。②立刻 `POST /v1/chat.starMessage`。③负向「确认步」 | core | `msg.star` | `useStarMessageAction.ts:28-29` |

**G 计数**：4。选房+点 Forward = `msg.forward` 对照。Copy_Link = `msg.permalink.copy` 对照。Unpin/Unstar 本来就无确认（01 已写）。

---

## H. 已读勾

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat.micro.read-receipt.tick.click.absent` | 气泡上的单/双勾**不可点**（详情只在 More） | `自己的消息行→右上角 check-single/check-double` | `Message_Read_Receipt_Enabled` 才渲染；`role=status` 无 onClick | `[读]` ①`aria-label=Message_sent` 或 `Message_viewed`；点击无模态。②无。③负向。名单走 `msg.read-receipts` | core+setting+license | `msg.read-receipts` | `ReadReceiptIndicator.tsx:14-23` |

**H 计数**：1。

---

## I. 枚举扫到、且 01/03/10/11 未建 id：邀请页 / 列表崩溃

`RoomInviteBody` 在 `views/room/body/**`。`MessageListErrorBoundary` 在 `MessageList/**`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat.micro.invite.accept` | 接受房间/DM 邀请，进入时间线 | 打开 `subscription` 为邀请态的房间 → `Accept` | `Room.tsx` 走 `RoomInvite`；`POST /v1/rooms.invite` `{action:'accept'}` | `[读]` ①`StatesTitle=Message_request` + `Accept` loading 后换正常 `RoomBody`。[待渲染实测] button name。②`POST /v1/rooms.invite` `{roomId, action:'accept'}`。③刷新后已是订阅者 | core | `route.invite` | `RoomInviteBody.tsx:36-38`；`useRoomInvitation.ts:7-11`；`RoomInvite.tsx:49-54` |
| `chat.micro.invite.reject` | 点 Reject 打开拒绝确认 | 邀请页 → `Reject` | 同上 | `[读]` ①先出 danger `Reject_invitation` 模态，**尚未** POST。②无直到确认。③仍停在邀请页 | core | `chat.micro.invite.reject.confirm` | `RoomInviteBody.tsx:33-35`；`useRoomInvitation.ts:12-14` |
| `chat.micro.invite.reject.confirm` | 确认拒绝邀请并离开 | `Reject` → 模态 `Reject_invitation` 确认 | 模态 `resolve(true)` | `[读]` ①模态关；回 `/home`（`useGoToHomeOnRemoved`）。②`POST /v1/rooms.invite` `{roomId, action:'reject'}`。③刷新后不再是邀请/成员 | core | `chat.micro.invite.accept` | `useRoomRejectInvitationModal.tsx:31-39`；`useRoomInvitation.ts:12-14` |
| `chat.micro.invite.reject.cancel` | 关掉拒绝确认、仍留在邀请页 | 拒绝模态 → Cancel | 模态 `resolve(false)` | `[读]` ①模态关；`Accept`/`Reject` 仍在。②无 POST。③邀请态仍在 | core | `chat.micro.invite.reject` | `useRoomRejectInvitationModal.tsx:40-43` |
| `chat.micro.invite.learn-federation` | 联邦邀请页打开联邦文档 | 联邦房间邀请页 → `Learn_more_about_Federation` | `isRoomFederated(room)` 才有 `infoLink` | `[读]` ①新标签 `links.go.matrixFederation`。②无 RC endpoint。③邀请态不变 | core | `tl.e2ee.learn-more` | `RoomInvite.tsx:28`；`RoomInviteBody.tsx:40` |
| `chat.micro.list.reload` | 时间线 React 崩溃后整页重载 | 消息列表 ErrorBoundary fallback → `Reload` | `ErrorBoundary`；`resetKeys=[room._id]` | `[读]` ①`StatesTitle=Error` `Error_something_went_wrong`；点后 `location.reload()`。②无专用 REST。③整页刷新 | core | — | `MessageListErrorBoundary.tsx:15-30` |

**I 计数**：6。

---

## J. PR #15 unique（12b）

只并入 [PR #15](https://github.com/jianwyao01/Rocket.Chat/pull/15) 里、PR #13 **没有**的 id。原文表体第一列无反引号，这里改成与 A–I 相同的 `` `id` ``。不收录同字符串 4 行（`quote.multi` / `quote.keyboard.absent` / `quote.more.absent` / `send.retry.absent`）以及近碰撞 `chat.micro.send.cancel.absent`（canonical = `chat.micro.send.cancel-pending.absent`）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `chat.micro.quote.of-quote` | Quote 一条本身带引用链的消息时按链长截断嵌套 | `房间时间线→已含引用附件的消息→悬停工具栏→Quote` | `Message_QuoteChainLimit` 默认 **2** `MessageBox.tsx:120`；`settings/message.ts:230`。`limit < 2` 或当前层 `>= limit` 时剥掉更深的 quote 附件，**保留**非 quote 附件 `limitQuoteChain.ts:21-23`。 | `[读]` ①composer chip 里嵌套 quote 比原消息浅；发出后时间线引用链同样被截。②点击无 REST；发送 `POST /v1/chat.sendMessage`（`prependReplies` 先写 `[ ](permalink)` `prependReplies.ts:6-15`）。③发出后引用链 persist 为截断后的附件。[读] | core+setting | `msg.quote`；`composer.state.quote.add` | `createComposerAPI.ts:114`；`limitQuoteChain.ts:8-37` |
| `chat.micro.quote.same-readd` | 对同一条再点 Quote **不会**关掉引用，只是挪到数组末尾 | `已引用 mid=X 的 bar 仍在→同一条消息再点 Quote` | 该 mid 已在 `_quotedMessages` | `[读]` ①chip **不**消失；`filter(_id!==mid)` 后再 `push` 同一条 `createComposerAPI.ts:114`。②无 REST。③仍 session。PM 勿当成 toggle。负向：没有「再点 Quote 取消」 | core | `msg.quote`；`composer.state.quote.dismiss` | `createComposerAPI.ts:113-116` |
| `chat.micro.quote.bar.jump.absent` | composer 引用 chip **没有**时间线上的 jump / 作者链 | `已 Quote→看 composer 上方 chip`（不要点时间线引用块） | `MessageBoxReply` 手造 attachment：**无** `message_link`、**无** `author_link`；`attachments`/`collapsed` 皆 true `MessageBoxReply.tsx:31-40`。`QuoteAttachment` 只在这两个字段存在时才渲染可点链 | `[读]` ①chip 上看不到 `title=Jump_to_message`；作者名不是 `a`；时间戳无 href。可点的只有 `Dismiss_quoted_message`。②无。③无。与 10 `tl.quote.jump` **不是**同一入口。负向断言 | core | `tl.quote.jump`；`tl.quote.author`；`tl.quote.time`；`composer.state.quote.dismiss` | `MessageBoxReply.tsx:30-51`；`QuoteAttachment.tsx:59-67` |
| `chat.micro.send.toast.click.absent` | 发送失败 toast **不是**重试入口 | 触发 `chat.micro.send.retry.absent` 后 → 点 error toast | `dispatchToastMessage` 无 onClick 载荷 `toast.ts:22-25`；`ToastMessagesProvider` 只 `dispatchToastBar({ type, title, message })` `ToastMessagesProvider.tsx:50-69`。Fuselage ToastBar 点击通常只关掉条。[待渲染实测] 关 toast 的精确 role | `[读]` ①toast 消失或保持；composer / 乐观行 **不**因此重发。②无第二发 `chat.sendMessage`。③无。负向断言 | core | `chat.micro.send.retry.absent` | `toast.ts:22-25`；`ToastMessagesProvider.tsx:50-69` |
| `chat.micro.composer.resize.absent` | composer **没有**用户可拖的高度手柄 | 把指针移到 textarea 底边 / 右下角找 resize handle | `useAutoGrow` 只随输入把 `height` 设为 `scrollHeight` `useAutoGrow.ts:24-43`。`RoomBody` `onResize={handleComposerResize}` 是布局回调，不是手柄。textarea style **无** `resize:vertical`。 | `[读]` ①无 drag handle；高度随字数自动变。②无 REST。③不 persist。负向断言 | core | `composer.send` | `useAutoGrow.ts:11-62`；`RoomBody.tsx:237-238` |
| `chat.micro.composer.md-preview.absent` | composer **没有** Markdown 预览开关 | 看格式栏 / overflow `Message_Formatting_toolbox` / Send 旁 | `formattingButtons` 7 项：bold / italic / strike / inline-code / multiline-code / link / katex。全 `client/views/room/composer` **无** preview/markdown-preview 控件。`RoomBody.tsx:242-243` `previewUrls` 仍是 TODO，未挂发送前 URL 预览选择器。 | `[读]` ①无 Preview / 预览 tab。手打 markdown 发出后才在时间线渲染。②无。③无。负向断言 | core | `composer.fmt.quote.absent`；`composer.format.bold` | `messageBoxFormatting.ts:34-106`；`RoomBody.tsx:242-243` |
| `chat.micro.otr.absent` | 本仓库 **没有** OTR 房间动作 / 消息动作 | 打开 DM → 房间工具箱 / 消息 More / composer 找 OTR | `rg` `apps/meteor/client` `apps/meteor/app` `ee`：`OTR` / `OTR_Enabled` / `useOTR` **0** 命中。E2EE 走 10 `tl.e2ee.*` 与 11 `composer.state.send.e2ee.*`，不是 OTR。 | `[读]` ①无 OTR 按钮 / 会话条。②无 otr endpoint。③无。负向断言 | — | `tl.e2ee.save-password`；`composer.state.send.e2ee.hint` | 全 `client`/`app`/`ee` 无匹配 |
| `chat.micro.thread.title.jump.absent` | 线程栏标题 **不是**跳回父消息的控件 | `线程面板→header ContextualbarTitle`（主消息 HTML 标题） | `ThreadTitle` 只 `dangerouslySetInnerHTML`，无 onClick `ThreadTitle.tsx:11-16`。跳回主时间线走消息上的 `msg.jump`（threads Items）。 | `[读]` ①点标题不导航、不写 `?msg=`。②无 REST。③无。负向断言 | core | `msg.jump`；`thread.panel.close`；`thread.panel.backToList` | `ThreadTitle.tsx:11-16`；`Thread.tsx:111-115` |
| `chat.micro.slash.join.already-member` | `/join` 已在该房时客户端改写成 `/open` 并跳转 | `textarea` 行首 `/join #已加入的频道` → Send | 命令 permission `view-c-room`；`result` 看 `error-user-already-in-room` `slashcommands-join/client/client.ts:10-16`。这是 **slash result 回调**，不是 Join 按钮（03 `composer.join`）。 | `[读]` ①composer `clear()`；路由进该频道（`/open` clientOnly）。②先 `POST /v1/commands.run`（join）；already-in-room 后本地 `slashCommands.run({command:'open'})`，`/open` 用订阅路由，必要时 `POST /v1/im.create`。③落在该房。`[待渲染实测]` 是否闪错误 toast | core+permission | `composer.state.slash.execute`；`composer.join` | `slashcommands-join/client/client.ts:3-16`；`slashcommands-open/client/client.ts:9-42` |

**J 计数**：9。

---

## 验算

禁止收成一个「总功能」。数字是**本册 NEW 表体行**。

| 节 | 行 | 命令 |
| --- | --- | --- |
| A Quote | 5 | `rg -c '^\| `chat\.micro\.quote\.' docs/qa/pm-feature-atlas/12-chat-micro-gaps.md` |
| B Reply 路径缺口 | 3 | `rg -c '^\| `chat\.micro\.reply\.' …` |
| C 删除内部 | 2 | `rg -c '^\| `chat\.micro\.delete\.' …` |
| D 发送失败/过长 | 8 | `rg -c '^\| `chat\.micro\.send\.' …` |
| E 复制/长按 | 3 | `rg -c '^\| `chat\.micro\.(copy|long-press)\.' …` |
| F 反应 extras | 3 | `rg -c '^\| `chat\.micro\.reaction\.' …` |
| G 模态内部 | 4 | `rg -c '^\| `chat\.micro\.(forward|pin|star)\.' …` |
| H 已读勾 | 1 | `rg -c '^\| `chat\.micro\.read-receipt\.' …` |
| I 邀请/崩溃 | 6 | `rg -c '^\| `chat\.micro\.(invite|list)\.' …` |
| J PR #15 unique | 9 | 下式 `35+9=44`；unique 集合见本节表 |

```
5+3=8
8+2=10
10+8=18
18+3=21
21+3=24
24+4=28
28+1=29
29+6=35
35+9=44
```

去重稳定 id = 表体行 = **44**（PR #13 的 35 + PR #15 unique 9；无复行）。

```bash
rg -c '^\| `chat\.micro\.' docs/qa/pm-feature-atlas/12-chat-micro-gaps.md
# 44

rg -o '^\| `chat\.micro\.[^`]+' docs/qa/pm-feature-atlas/12-chat-micro-gaps.md | sort | uniq -d
# （应空）
```

---

## 已覆盖对照

只列本 hunt 扫到、且 00/01/03/10/11 **已有 id** 的入口。不新建。

| 已有 id | 出处分册 | 本 hunt 扫到的入口 |
| --- | --- | --- |
| `msg.quote` | 01 | 工具栏 Quote：`DefaultItems.tsx:18` `ThreadsItems.tsx:18` `FederatedItems.tsx:17` `QuoteMessageAction.tsx:38-52`。线程 = 同一 id |
| `msg.thread.reply` | 01 | 工具栏 Reply_in_thread：`DefaultItems.tsx:19` `ReplyInThreadMessageAction.tsx:20-57` |
| `msg.reply.dm` | 01 | More→Reply_in_direct_message：`useReplyInDMAction.ts:12-88` |
| `msg.edit` | 01 | More→Edit：`useEditMessageAction.ts:9-57` |
| `msg.delete` | 01 | More→Delete→Yes_delete_it：`useDeleteMessageAction.ts:10-53` |
| `msg.copy.text` | 01 | More→Copy_text：`useCopyAction.ts:14-38` |
| `msg.permalink.copy` | 01 | More→Copy_link；Forward 模态 `Copy_Link`：`usePermalinkAction.ts:10-50`；`ForwardMessageModal.tsx:129-131` |
| `msg.forward` | 01 | 工具栏 Forward→选房→Forward：`ForwardMessageAction.tsx:16-52`；`ForwardMessageModal.tsx:132-134` |
| `msg.pin` | 01 | More→Pin→Yes_pin_message：`usePinMessageAction.tsx:9-39` |
| `msg.star` | 01 | More→Star（无确认）：`useStarMessageAction.ts:8-33` |
| `msg.reaction.add` | 01 | 工具栏 quickReactions + Add_Reaction：`ReactionMessageAction.tsx:25-86` |
| `msg.read-receipts` | 01 | More→Read_Receipts |
| `msg.jump` | 01 | 搜索/钉选/收藏/提及/线程 Jump |
| `implicit.quote.barDisplay` | 03 | composer 上方引用预览：`MessageBoxReplies.tsx:16-26` |
| `implicit.quote.dismissOne` | 03 | chip `Dismiss_quoted_message`：`MessageBoxReply.tsx:44-51` |
| `implicit.quote.fromUrl` | 03 | `?reply=mid`：`useQuoteMessageByUrl.ts:7-27` |
| `composer.state.quote.add` | 11 | Quote 后 bar 出现 |
| `composer.state.quote.dismiss` | 11 | 关一条 |
| `composer.state.quote.send` | 11 | 带着引用发送 |
| `shortcut.composer.prevMessage` | 03 | 光标行首 ArrowUp：`MessageBox.tsx:251-260`；`ChatMessages.ts:53-91` |
| `shortcut.composer.nextMessage` | 03 | 文末 ArrowDown：`MessageBox.tsx:266-276` |
| `composer.edit.cancel` | 03 | Cancel / Esc 退出编辑 |
| `implicit.composer.hint.editing` | 03 | Editing_message hint |
| `composer.state.send.edit.save` | 11 | 编辑态 Send → `chat.update` |
| `composer.state.send.edit.empty-delete` | 11 | 编辑清空再 Send → 删除 |
| `composer.popup.emoji-colon` | 03 | `:smi` 补全（`:smile:` 短码） |
| `composer.popup.emoji-plus` | 03 | 行首 `+:` **插入**大表情前缀（与 F 节 `+:` **发送去反应**不是同一动作） |
| `composer.format.bold` / `shortcut.composer.formatBold` | 03 | Ctrl/Cmd+B |
| `composer.format.italic` / `shortcut.composer.formatItalic` | 03 | Ctrl/Cmd+I |
| `composer.fmt.bold.apply` 等 | 11 | 各 mark apply/remove；strike/code/link **无** command |
| `composer.fmt.quote.absent` | 11 | 格式栏无 blockquote mark（与消息 Quote **不是**同一动作） |
| `composer.state.emoji.search` / `tone` | 11 | **composer 工具栏** Emoji picker（入口不同，组件同一 `EmojiPicker`） |
| `tl.quote.jump` | 10 | 引用块 jump 图标：`QuoteAttachment.tsx:67` |
| `tl.quote.time` | 10 | 引用时间戳 href：`QuoteAttachment.tsx:64-66` |
| `tl.quote.author` | 10 | 引用作者外链 |
| `tl.thread.view` | 10 | View_thread |
| `tl.thread.preview.open` | 10 | 主列表线程预览 |
| `tl.broadcast.reply` | 10 | 广播房行内 Reply → DM+quote |
| `tl.reaction.toggle` / `tl.reaction.add` | 10 | 体上芯片 / 体上 + |
| `tl.body.code.copy` | 10 | 围栏代码 Copy |
| `tl.attach.collapse` / `tl.url.collapse` | 10 | 附件/预览折叠（**不是**引用块） |
| `tl.unread.*` / `tl.chrome.*` / `tl.select.*` | 10 | body 未读条/新消息/多选（对照 03 `implicit.*`） |
| `tl.identity.avatar` / `display-name` | 10 | 头像/显示名 |
| `implicit.layout.closeFlexTabOnClick` | 03 | `RoomBody` 点空白关侧栏 |
| `implicit.upload.*` | 03 | drop overlay / 进度条 |
| `composer.state.upload.chip.error` | 11 | 上传失败 chip **无 Retry**（附件，不是消息发送） |

---

## NEW id 列表（44）

**A** `chat.micro.quote.multi` `chat.micro.quote.more.absent` `chat.micro.quote.keyboard.absent` `chat.micro.quote.from-search.absent` `chat.micro.quote.collapse.absent`

**B** `chat.micro.reply.thread.more.absent` `chat.micro.reply.thread.from-search.absent` `chat.micro.reply.dm.from-search.absent`

**C** `chat.micro.delete.cancel` `chat.micro.delete.last-hotkey.absent`

**D** `chat.micro.send.pending.indicator` `chat.micro.send.error-toast` `chat.micro.send.retry.absent` `chat.micro.send.cancel-pending.absent` `chat.micro.send.queued-ui.absent` `chat.micro.send.too-long.as-attachment` `chat.micro.send.too-long.toast` `chat.micro.send.too-long.cancel`

**E** `chat.micro.copy.text.from-body.absent` `chat.micro.copy.link.from-body.absent` `chat.micro.long-press.absent`

**F** `chat.micro.reaction.plus-shortcode` `chat.micro.reaction.picker.search` `chat.micro.reaction.picker.tone`

**G** `chat.micro.forward.close` `chat.micro.forward.comment.absent` `chat.micro.pin.cancel` `chat.micro.star.confirm.absent`

**H** `chat.micro.read-receipt.tick.click.absent`

**I** `chat.micro.invite.accept` `chat.micro.invite.reject` `chat.micro.invite.reject.confirm` `chat.micro.invite.reject.cancel` `chat.micro.invite.learn-federation` `chat.micro.list.reload`

**J / 12b（PR #15 unique）** `chat.micro.quote.of-quote` `chat.micro.quote.same-readd` `chat.micro.quote.bar.jump.absent` `chat.micro.send.toast.click.absent` `chat.micro.composer.resize.absent` `chat.micro.composer.md-preview.absent` `chat.micro.otr.absent` `chat.micro.thread.title.jump.absent` `chat.micro.slash.join.already-member`

---

## 确认不存在清单（file:line）

MUST 负向 + 枚举时扫到、用户做不到的。每条有源码位置。

| 不存在的用户动作 | 证据 |
| --- | --- |
| More→Quote | `MessageToolbarActionMenu.tsx:46-77` 无 quote hook；Quote 只在 `DefaultItems.tsx:18` 等图标位 |
| 键盘 Quote | `KeyboardShortcutsModal.tsx:17-66` 无 quote；`MessageBox.tsx:216-278` 无 quote `case` |
| 搜索结果 Quote / Reply_in_thread / Reply_in_DM | `SearchItems.tsx:11-16` 仅 Jump；`useReplyInDMAction.ts:71` context 无 `search` |
| Mentions 列表 Quote/Reply | `MentionsItems.tsx:11-16` 仅 Jump（与搜索同构） |
| 引用块折叠 | `QuoteAttachment.tsx:46-82` 无 `CollapsibleContent` / 无 onClick |
| 点引用 blockquote 本体跳转 | 同文件：可点的只有 `author_link` / `message_link` 时间戳 / jump 图标（`tl.quote.*`） |
| 消息发送 Retry | `sendMessage.ts:122-123` 只 toast；`RoomMessage.tsx:102-148` pending 行无按钮 |
| 取消 pending 发送 | 无 cancel-temp；composer 已 `clear()` `sendMessage.ts:48-49` |
| 发送 queued 队列 UI | `sendMessage.ts` / `components/message` 无 queue/queued |
| 正文 Copy text | 除 `CodeBlock` 外无；`useCopyAction` 仅 More |
| 正文/时间戳 Copy link | `MessageHeader.tsx:74-76` `MessageTimestamp` 无 onClick |
| 长按独立菜单 | `MessageToolbarHolder.tsx:17-53` 仅 IntersectionObserver；`rg context='message-mobile'` 全 `client` **0** 赋值 |
| 一键删上一条热键 | `KeyboardShortcutsModal.tsx:17-66` 无 delete；`MessageBox` 无该分支 |
| Forward 评论 | `ForwardMessageModal.tsx:52` `optionalMessage = ''` |
| Star 确认模态 | `useStarMessageAction.ts:28-29` 直接 `starMessage` |
| 已读勾点击 | `ReadReceiptIndicator.tsx:14-23` `role=status` 无 onClick |
| Ctrl+S / Ctrl+U / Ctrl+K 格式化 | `messageBoxFormatting.ts:47-88` strike/code/link **无** `command`；`handleFormattingShortcut` 只认 `command` `MessageBox.tsx:59-76` |
| `message-mobile` 现行 Web 入口 | 01 已记；本仓库仍 0 赋值（复证） |
| 钉/星/译/钥 StatusIndicators 点击 | `StatusIndicators.tsx` 无 onClick（10 验过无点击） |

---

## [待渲染实测]

1. 多条 quote bar 的可访问结构（是否 `list`/`listitem`）。
2. pending `isPending` 在 fuselage `Message` 上的可见样式与 `aria-busy` 是否被读屏读出。
3. 发送失败后乐观行是否一直 `temp`，toast 文案的精确 accessible name。
4. 超长转附件模态的 confirm 按钮 name（GenericModal 默认 Yes?）。
5. 从消息打开的 Emoji picker 与 composer 打开的是否同一 `role=dialog` `aria-label=Emoji_picker`（源码同一组件）。
6. Forward `ModalClose` 的可访问名是 `Close` 还是 X-only。
7. Pin `GenericModal` Cancel 的可见文案。
8. 邀请页 `Accept`/`Reject` 在 en 下的 button name；联邦 `StatesLink` 是否 `role=link`。
9. `message-mobile` 是否被 Cordova/移动壳在仓库外赋值（本 repo grep 无）。
10. `+:unknown:` 未注册短码是否当普通消息发出（`processSetReaction` 返回 false → 走 send）。
11. 联邦房无乐观 `temp` 时，发送中指示是否完全不出现。
12. `Message_QuoteChainLimit=2` 时 composer chip 里还能看见几层嵌套 quote（12b `quote.of-quote`）。
13. 点 error toast 是关掉条还是无响应（12b `send.toast.click.absent`）。
14. `/join` 已在房：是否先闪 join 错误再跳 `/open`（12b `slash.join.already-member`）。

---

## 边界

- **不改** 00–11 任一 id。
- **不复述** 工具栏 26 个 `msg.*`、时间线 72 个 `tl.*`、composer 入口/状态（除本册明确写成「01 只打开了模态」的内部步）。
- **OUT**：admin、omnichannel 坐席页、marketplace 单 app。`MediaCallRoom` 无独立 onClick（只包一层 `MediaCallRoomActivity`）。
- **`:smile:` 发出后渲染**：`emojiParser` 把短码画成图，**不是**用户控件；交互面是 popup（03）或 `+:` 反应（本册 F）。
- **composer 引用条 jump**：`MessageBoxReply` 塞给 `QuoteAttachment` 的附件**没有** `message_link`（`MessageBoxReply.tsx:31-41`），条上可点的只有 Dismiss。

---

## 与现行 atlas

- 本册 **44** 个 `chat.micro.*` 全部 NEW（PR #13 的 35 + PR #15 unique 9）。
- 与 01–11 **无 id 字符串碰撞**（前缀 `chat.micro.`）。与 13 邀请页同控件见 00 alias（`chat.micro.invite.*` → `room.join.invite.*`）。
