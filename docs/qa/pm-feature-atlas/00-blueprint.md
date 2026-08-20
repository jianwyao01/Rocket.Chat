# PM 功能测试蓝图（合并）

## 1. 方法

- 调查基线：默认分支 `develop` @ `e10bd504b9e4576d6f862393caa277e695d249ed`（短 SHA `e10bd504b9`）。
- 本文件从分支 `cursor/pm-atlas-merge-blueprint-d43d`（已含 00–05 / PR #5）拼接 **01–11** 全部 8 列功能行。
- 源 PR / 分册（文档-only，未改产品代码）：
  1. [PR #2](https://github.com/jianwyao01/Rocket.Chat/pull/2) → `01-message-toolbar.md`
  2. [PR #1](https://github.com/jianwyao01/Rocket.Chat/pull/1) → `02-room-user-nav.md`
  3. [PR #4](https://github.com/jianwyao01/Rocket.Chat/pull/4) → `03-composer-implicit.md`
  4. [PR #3](https://github.com/jianwyao01/Rocket.Chat/pull/3) → `04-routes-and-shell.md` + `05-completeness.md`
  5. [PR #9](https://github.com/jianwyao01/Rocket.Chat/pull/9) `cursor/pm-atlas-room-panel-interiors-9c81` → `06-room-panel-interiors.md`
  6. [PR #10](https://github.com/jianwyao01/Rocket.Chat/pull/10) `cursor/pm-atlas-page-interiors-7f30` → `07-page-interiors.md`
  7. [PR #8](https://github.com/jianwyao01/Rocket.Chat/pull/8) `cursor/omni-mkt-product-atlas-cc26` → `08-omnichannel-product.md` + `09-marketplace-product.md`
  8. [PR #7](https://github.com/jianwyao01/Rocket.Chat/pull/7) `cursor/pm-atlas-message-timeline-c4d9` → `10-message-timeline.md`
  9. [PR #6](https://github.com/jianwyao01/Rocket.Chat/pull/6) `cursor/pm-atlas-composer-states-877b` → `11-composer-states.md`
- 诚实标记：`[读]` = 源码推断；`[待渲染实测]` = 未在真实 RC Web 客户端核对。本蓝图不发明分册没有的入口或后果。
- 分册原文完整保留在 `01`–`11`。本文件拼接 01–11 的每一张 **8 列功能行表**（05 无功能行）。04 的「供给 / 触发后果三件套」在本文件内按契约改写（见下），不回写分册。06–11 表体按分册原文拼接，不改写单元格。
- **机械 id 碰撞**：跨分册精确 id 集合交集为空。未改任何分册文件。等价动作见文末「分册冲突 / canonical aliases」。
- 04 契约改写（不发明事实）：
  - 触发后果三件套 = (1) DOM 出现/消失的元素 role+name (2) endpoint (3) 刷新后仍在什么。分册只写了「界面/导航/持久化」时：界面→(1)，能抽出的 `GET`/`POST`→(2)，否则 (2) 标 `[待渲染实测]`，持久化→(3)。
  - 供给 = **READ** 的设置/权限/路由参数/接口/上下文，不是 `core` vs `EE:module`。许可证留在门控。
- 删行规则：入口序列与观察（一句话）都空才删。本合并 **删除 0 行**。
- 回放：从本文件任一功能行表随机抽 10 行，**必须同时覆盖入口层（01–04）与内部层（06–11）**，按「完整入口点击序列」走，核「触发后果三件套」。

## 分册 01 — 消息工具栏 / 消息动作

入口前缀约定见 `01-message-toolbar.md`（`房间消息` / `悬停工具栏` / `More` / `顶栏`）。表 B/C 复用表 A 的门控与后果，不拆成新 id。

## 表 A. 用户可感知动作（跨 context 合并）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.reaction.add | 给消息添加或取消一个 emoji 回应 | `房间消息→悬停工具栏→前 3 个 quickReactions emoji 按钮`；`房间消息→悬停工具栏→Add_Reaction→emoji picker 选一个`；`联邦房间消息（isRoomFederated 且 native）→悬停工具栏→同上`；`视频会议系统消息（t=videoconf）→悬停工具栏→同上`；`顶栏 Threads→打开线程→线程消息悬停→同上`；`线程内 videoconf 消息→悬停→同上`。[待渲染实测] `message-mobile` 无赋值入口 | `subscription` 存在；非 omnichannel；`!message.private`；已登录；非联邦阻断（`isRoomFederated && !isRoomNativeFederated`）`ReactionMessageAction.tsx:32-40`；只读房需 `room.reactWhenReadOnly` 或非 `roomCoordinator.readOnly`（`post-readonly` 使只读重算，`ReactionMessageAction.tsx:36-47`）；`useLayoutHiddenActions.messageToolbox` 含 `reaction-message` 则图标隐藏 `MessageToolbarItem.tsx:17`。quickReactions 不受 hidden id 过滤。[读] | (1) 消息体反应条出现/消失对应 emoji；工具栏 `Add_Reaction` 按钮保持 [待渲染实测] 按钮 role+name。(2) `POST /v1/chat.react` `{emoji:':name:', messageId}` `ReactionMessageAction.tsx:62-64`。(3) 刷新后该 emoji 仍在 `message.reactions`（或已取消则消失）。[读] | `message._id` `message.private` `message.reactions`；`room` federated/omnichannel/ro/`reactWhenReadOnly`；`subscription`；`quickReactions`；endpoint `POST /v1/chat.react` | msg.reaction.list | `ReactionMessageAction.tsx:25-86` |
| msg.quote | 把该消息作为引用插入当前 composer | `房间消息→悬停工具栏→Quote`；`联邦房间（native）→悬停工具栏→Quote`；`线程消息（threads）→悬停工具栏→Quote`。[待渲染实测] `message-mobile` | `subscription` 存在；`chat` 存在；非联邦阻断 `QuoteMessageAction.tsx:30-36`。hidden id `quote-message`。none 之外的许可键：无。`QuoteMessageAction.tsx:34-36` 证明 subscription 是唯一硬门。 | (1) composer 上方出现引用预览（`MessageBoxReply` / quoted attachment）[待渲染实测] 精确 role+name。(2) 点击当时 **无** HTTP；发送时走 `POST /v1/chat.sendMessage`（`sendMessage.ts:51`）并带 quote。[读] (3) 未发送则刷新后引用条消失（仅本地 composer 状态）。[读] | `message`（若 AutoTranslate 正在展示译文则改写 `message.msg` 为 `translations[lang]`，`QuoteMessageAction.tsx:44-48`）；`subscription`；`chat.composer.quoteMessage` | msg.edit；msg.copy.text；msg.forward | `QuoteMessageAction.tsx:20-54` |
| msg.thread.reply | 在该消息下打开/进入讨论串并回复 | `房间消息→悬停工具栏→Reply_in_thread`；`联邦房间 native→悬停工具栏→Reply_in_thread`；`videoconf 系统消息→悬停工具栏→Reply_in_thread`。threads / videoconf-threads / pinned / starred / mentions / search / direct 的 `*Items` **不**挂此图标。[读] | `Threads_enabled`（默认 true）`ReplyInThreadMessageAction.tsx:22`；非 omnichannel；`subscription`；非联邦阻断 `ReplyInThreadMessageAction.tsx:25-32`。hidden id `reply-in-thread`。 | (1) 右侧/contextual bar 出现 `tab=thread`，`context=message.tmid \|\| message._id` [待渲染实测] 栏标题 role+name。(2) 点击无 REST；仅 `router.navigate` `ReplyInThreadMessageAction.tsx:45-53`。(3) 刷新后若 URL 仍含 thread tab/context 则线程栏仍在，否则回到房间。[读] | `Threads_enabled`；`message.tmid` `message._id`；`room` omnichannel/federated；`subscription`；当前 `routeName`+params | msg.thread.follow；msg.thread.unfollow | `ReplyInThreadMessageAction.tsx:20-57` |
| msg.forward | 把消息转发到其他房间或复制 permalink | `房间消息→悬停工具栏→Forward_message→选 Person_Or_Channel→Forward`；`线程消息→悬停工具栏→Forward_message→…`；`message-mobile Items 含 Forward`（无现行赋值）。联邦 / videoconf `*Items` **无** Forward。[读] 模态内 `Copy_Link` 与 `msg.permalink.copy` 同效果 | none 对显示：始终渲染按钮；`disabled` 当 `isE2EEMessage` 或 `room.abacAttributes` `ForwardMessageAction.tsx:20-38`。hidden id `forward-message`。license `abac` 体现在房间字段而非本组件直接查 license。[读] | (1) 出现 dialog 标题 i18n `Forward_message`；确认后 toast `Message_has_been_forwarded`，模态关闭 [待渲染实测] dialog role。(2) 打开前 `getPermaLink` 可能 `GET /v1/chat.getMessage`（本地缓存未命中时，`getPermaLink.ts:8`）；确认 `POST /v1/chat.postMessage` `{roomId, text}` `ForwardMessageModal.tsx:49-59`。(3) 目标房间刷新后可见引用转发消息；本房间消息不变。[读] | `message` 全文/附件；`room.abacAttributes`；`isE2EEMessage`；permalink | msg.permalink.copy；msg.quote | `ForwardMessageAction.tsx:16-52` |
| msg.jump | 从列表/侧栏跳回房间时间线该消息 | `顶栏 Pinned_Messages（或 Options→Pinned_Messages）→悬停钉选消息→Jump_to_message`（内部 id `jump-to-pin-message`）；`顶栏 Starred_Messages→悬停→Jump_to_message`（`jump-to-star-message`）；`顶栏 Mentions→悬停→Jump_to_message`；`顶栏 Search_Messages→搜索→悬停结果→Jump_to_message`；`顶栏 Threads→线程消息悬停→Jump_to_message`；`videoconf-threads 消息悬停→Jump_to_message`；`主列表 tmid 线程回复（getMessageContext→threads）→悬停→Jump_to_message`。[待渲染实测] `message-mobile` / `direct`：Items 已挂但无赋值入口。`direct` 内部 id 误用 `jump-to-pin-message`（`DirectItems.tsx:12`） | hidden id 按 **内部 id** 分三套：`jump-to-message` / `jump-to-pin-message` / `jump-to-star-message`（`MessageToolbarItem.tsx:17`）。`direct` 另需 `subscription` `DirectItems.tsx:12`。语义相同故不拆 id；hidden 分轨已说明。 | (1) 关闭侧栏时间线后目标消息滚动进入视口并高亮 [待渲染实测] highlight 的 role+name。(2) 无专用 REST；`router.navigate` 写 `?msg=<id>` `setMessageJumpQueryStringParameter.ts:10-16`。房间打开时可能再 `GET /v1/chat.getMessage`。[读] (3) 刷新保留 `?msg=` 则再次跳转。[读] | `message._id`；当前 pathname + search；内部 toolbar id | msg.permalink.copy | `JumpToMessageAction.tsx:12-24`；装配：`PinnedItems.tsx:14` `StarredItems.tsx:14` `MentionsItems.tsx:14` `SearchItems.tsx:14` `ThreadsItems.tsx:20` `MobileItems.tsx:22` `VideoconfThreadsItems.tsx:16` `DirectItems.tsx:12` |
| msg.webdav.save | 把消息附件存到已配置的 WebDAV | 任意已挂工具栏的 context（**hook 无 `context` 字段**，`!button.context` 放行，`MessageToolbarActionMenu.tsx:83`）：`…→悬停工具栏→More→Save_To_Webdav→选 account→保存`。mentions/search 上若仅此项且被门控掉，则 More 整栏不渲染（`data.length===0` 提前 return，`MessageToolbarActionMenu.tsx:92-94`，apps 也不会补上）。[读] | `Webdav_Integration_Enabled`；`subscription`；`useWebDAVAccountIntegrationsQuery` 至少 1 个账号；`message.file` `useWebDAVMessageAction.tsx:19`。hidden id `webdav-upload`。 | (1) 出现 `SaveToWebdavModal` [待渲染实测] 标题/role；成功 toast。[读] (2) 下载附件 URL 后 Meteor method `uploadFileToWebdav`（`SaveToWebdavModal.tsx:41,79`）。(3) RC 消息不变；远端 WebDAV 上文件仍在。[读] | `Webdav_Integration_Enabled`；`message.file` `message.attachments[0].title_link`；WebDAV accounts | （无同供给的其他 msg.*） | `useWebDAVMessageAction.tsx:9-43` |
| msg.discussion.start | 以该消息为父消息创建讨论 | `房间消息→悬停工具栏→More→Discussion_start→填表→确认`；`videoconf 系统消息→悬停工具栏→More→Discussion_start→…`。[待渲染实测] `message-mobile`。threads/federated/pinned/starred/mentions/search/direct/videoconf-threads 的 `context` 数组不含此项。[读] | `Discussion_enabled`（默认 false）`useNewDiscussionMessageAction.tsx:13,20`；`subscription`；非 livechat；已登录；本消息无 `drid` 且 `dcount` 非数字；自己的消息需 `start-discussion`，他人需 `start-discussion-other-user`（room scoped）`useNewDiscussionMessageAction.tsx:17-47`。hidden id `start-discussion`。 | (1) `CreateDiscussion` GenericModal 出现 [待渲染实测] 标题；成功后导航到新讨论房。[读] (2) `POST /v1/rooms.createDiscussion` `CreateDiscussion.tsx:82`。(3) 刷新后父消息带 `drid`/`dcount`，该项不再出现；新讨论房仍在。[读] | `Discussion_enabled`；`message.u._id` `drid` `dcount` `msg`；`room.prid` `_id` `encrypted`；permissions | msg.thread.reply | `useNewDiscussionMessageAction.tsx:8-69` |
| msg.pin | 将消息钉在房间钉选列表 | `房间消息→悬停工具栏→More→Pin→Pin_Message 模态→Yes_pin_message`；`线程消息→More→Pin→确认`；`videoconf / videoconf-threads→More→Pin→确认`；`顶栏 Pinned_Messages 列表中未钉选态不会出现（`message.pinned` 为真则 hook 返回 null）`；`direct` context 已注册但无赋值入口。[待渲染实测] `message-mobile`。federated/starred/mentions/search **不**含 pin。 | `Message_AllowPinning`；`pin-message`（room）；非 omnichannel；`!message.pinned`；`subscription` `usePinMessageAction.tsx:15-20`。hidden id `pin-message`。 | (1) warning 模态 `Pin_Message` / `Yes_pin_message` 出现后关闭；toast `Message_has_been_pinned`；消息钉选指示出现 [待渲染实测] 指示器 name。(2) `POST /v1/chat.pinMessage` `{messageId}` `usePinMessageMutation.ts:11`。(3) 刷新后消息仍 `pinned:true`；顶栏 Pinned_Messages 仍列出。[读] | `Message_AllowPinning`；`pin-message`；`message.pinned` `_id`；`subscription`；room omnichannel | msg.unpin；msg.jump | `usePinMessageAction.tsx:9-39` |
| msg.unpin | 取消钉选 | `房间消息（已钉选）→悬停工具栏→More→Unpin`；`顶栏 Pinned_Messages→悬停→More→Unpin`；`threads / videoconf / videoconf-threads` 同样；`direct` 已注册无入口。[待渲染实测] `message-mobile`。无确认模态（与 pin 不同）。[读] | `Message_AllowPinning`；`pin-message`；非 omnichannel；`message.pinned`；`subscription` `useUnpinMessageAction.ts:12-18`。hidden id `unpin-message`。 | (1) toast `Message_has_been_unpinned`；钉选指示消失；Pinned 列表该项消失 [待渲染实测]。(2) `POST /v1/chat.unPinMessage` `{messageId}` `useUnpinMessageMutation.ts:11`。(3) 刷新后 `pinned:false`，钉选列表无此项。[读] | 同 msg.pin，要求 `message.pinned===true` | msg.pin；msg.jump | `useUnpinMessageAction.ts:8-32` |
| msg.star | 为自己收藏该消息 | `房间消息→悬停工具栏→More→Star`；`联邦房间→More→Star`；`线程 / videoconf / videoconf-threads→More→Star`；`顶栏 Starred_Messages 中未收藏态不会出现（已 star 则返回 null）`。[待渲染实测] `message-mobile`。pinned/mentions/search/direct **不含**。 | `Message_AllowStarring`（默认 true）；非 omnichannel；当前用户不在 `message.starred[]` `useStarMessageAction.ts:10-20`。无 permission 键。hidden id `star-message`。 | (1) toast `Message_has_been_starred`；消息星标指示出现 [待渲染实测]。(2) `POST /v1/chat.starMessage` `{messageId}` `useStarMessageMutation.ts:15`。(3) 刷新后 `starred` 含自己；Starred_Messages 仍列出。[读] | `Message_AllowStarring`；`message.starred`；`user._id`；room omnichannel | msg.unstar；msg.jump | `useStarMessageAction.ts:8-33` |
| msg.unstar | 取消自己的收藏 | `房间消息（已 star）→悬停工具栏→More→Unstar_Message`；`顶栏 Starred_Messages→悬停→More→Unstar_Message`；federated/threads/videoconf/videoconf-threads 同样。[待渲染实测] `message-mobile`。 | `Message_AllowStarring`；非 omnichannel；`message.starred` 含自己 `useUnstarMessageAction.ts:10-20`。hidden id `unstar-message`。 | (1) toast `Message_has_been_unstarred`；星标消失；Starred 列表移除 [待渲染实测]。(2) `POST /v1/chat.unStarMessage` `{messageId}` `useUnstarMessageMutation.ts:15`。(3) 刷新后自己不在 `starred`。[读] | 同 msg.star，要求已 star | msg.star；msg.jump | `useUnstarMessageAction.ts:8-33` |
| msg.permalink.copy | 复制指向该消息的 permalink | `房间消息→悬停工具栏→More→Copy_link`（id `permalink`）；`联邦 / threads / videoconf / videoconf-threads→More→Copy_link`；`顶栏 Starred_Messages→More→Copy_link`（id `permalink-star`）；`顶栏 Pinned_Messages→More→Copy_link`（id `permalink-pinned`）；`msg.forward 模态→Copy_Link`。三个内部 id 仅 context/hidden 分轨，后果相同故不拆。[待渲染实测] `message-mobile`。direct/mentions/search 的 permalink hook **未**列入对应 context。 | 始终返回 config（无 permission）。`disabled` 当 E2EE 或 `room.abacAttributes` `usePermalinkAction.ts:19-48`。hidden 按 `permalink` / `permalink-star` / `permalink-pinned`。 | (1) toast `Copied`；无新 DOM 面板 [待渲染实测] 剪贴板无障碍提示。(2) 缓存未命中时 `GET /v1/chat.getMessage`；然后 `navigator.clipboard.writeText` 本地 URL `?msg=` `getPermaLink.ts:8,36-37`。(3) 刷新无服务器状态变化；剪贴板内容仍在直到用户覆盖。[读] | `message._id` `rid`；`Rooms`/`Subscriptions`；`isE2EEMessage`；`room.abacAttributes` | msg.jump；msg.forward | `usePermalinkAction.ts:10-50`；调用点 `MessageToolbarActionMenu.tsx:53-64` |
| msg.thread.follow | 跟随该线程以便收到回复通知 | `房间消息（自己不在 replies）→悬停工具栏→More→Follow_message`；`线程 / 联邦 / videoconf / videoconf-threads` 同样。[待渲染实测] `message-mobile`。pinned/starred/mentions/search/direct **不含**。 | `Threads_enabled`；非 omnichannel；已登录；`replies` 不含自己（可回落到父消息 `tmid`）`useFollowMessageAction.ts:31-48`。hidden id `follow-message`。 | (1) toast `You_followed_this_message`；菜单项换成 Unfollow [待渲染实测]；线程跟随图标 [待渲染实测]。(2) `POST /v1/chat.followMessage` `{mid: tmid\|\|_id}` `useToggleFollowingThreadMutation.ts:19,27`。(3) 刷新后 `replies` 含自己，只见 Unfollow。[读] | `Threads_enabled`；`message.replies` `tmid` `_id`；`user._id`；parent in `Messages` store | msg.thread.unfollow；msg.thread.reply | `useFollowMessageAction.ts:10-61` |
| msg.thread.unfollow | 取消跟随该线程 | `已 follow 的消息→悬停工具栏→More→Unfollow_message`（context 同 follow） | 同 follow，但要求 `replies` **含**自己 `useUnFollowMessageAction.ts:31-48`。hidden id `unfollow-message`。 | (1) toast `You_unfollowed_this_message`；菜单回到 Follow [待渲染实测]。(2) `POST /v1/chat.unfollowMessage` `{mid}` `useToggleFollowingThreadMutation.ts:20,31`。(3) 刷新后 `replies` 无自己。[读] | 同 msg.thread.follow | msg.thread.follow | `useUnFollowMessageAction.ts:10-62` |
| msg.unread.mark | 从该条开始把房间标为未读并离开 | `他人消息→悬停工具栏→More→Mark_unread`；`线程内他人消息→More→Mark_unread`。[待渲染实测] `message-mobile`。federated/videoconf/列表类 context **不含**。 | 非 omnichannel；已登录；`subscription`；`message.u._id !== user._id` `useMarkAsUnreadMessageAction.ts:17-27`。hidden id `mark-message-as-unread`。 | (1) 导航到 `/home`；该房间在列表呈未读 [待渲染实测] sidebar 项 name。(2) `POST /v1/subscriptions.unread` `{firstUnreadMessage:{_id}}`；先 `LegacyRoomManager.close` `useMarkAsUnreadMutation.ts:21-24`。(3) 刷新后房间仍未读，直到打开已读。[读] | `message.u._id` `_id`；`subscription`；`user._id`；room omnichannel | （无） | `useMarkAsUnreadMessageAction.ts:8-41` |
| msg.translate | 请求/展示自动翻译译文 | `他人消息（订阅已开 AutoTranslate 且尚无译文或处于 inverse）→悬停工具栏→More→Translate`；threads 同样。[待渲染实测] `message-mobile`。 | `AutoTranslate_Enabled`；permission `auto-translate`；已登录；非自己；`subscription.autoTranslate` 或 livechat；且（`autoTranslateShowInverse` **或** 缺译文）`useTranslateAction.ts:31-41`。hidden id `translate`。无直接 license 模块名（设置+权限）。[读] | (1) 消息正文切到译文；可能短暂 `autoTranslateFetching` [待渲染实测] 译文容器 name。(2) 无译文时 `POST /v1/autotranslate.translateMessage` `{messageId, targetLanguage}` `useTranslateAction.ts:18,57`；有译文则只改本地 `autoTranslateShowInverse`。(3) 服务器译文缓存仍在；`autoTranslateShowInverse` 是客户端字段，刷新后回到设置默认展示。[读] | `AutoTranslate_Enabled`；`auto-translate`；`subscription.autoTranslate` `autoTranslateLanguage`；`message.translations` `attachments` `u._id` `autoTranslateShowInverse` | msg.translate.original；msg.quote | `useTranslateAction.ts:11-68` |
| msg.translate.original | 从译文切回原文 | `正在展示译文的他人消息→悬停工具栏→More→View_original`；threads 同样。[待渲染实测] `message-mobile`。 | 同 translate，但要求 **已有** 译文且 **非** `autoTranslateShowInverse` `useViewOriginalTranslationAction.ts:31-40`。hidden id `view-original`。 | (1) 正文回到原文 [待渲染实测]。(2) 通常无新 HTTP（已有译文）；缺译文时同 `POST /v1/autotranslate.translateMessage` `useViewOriginalTranslationAction.ts:51-57`。(3) 刷新后按订阅 AutoTranslate 默认再显示译文。[读] | 同 msg.translate | msg.translate | `useViewOriginalTranslationAction.ts:11-68` |
| msg.reply.dm | 打开与作者的 DM 并引用该消息 | `频道/群组/团队中他人或自己的消息→悬停工具栏→More→Reply_in_direct_message`；`联邦 / threads` 同样。[待渲染实测] `message-mobile`。房间已是 `t==='d'` 或 livechat 或 embedded layout 则不出现。 | `subscription`；`room.t` 非 `d`/`l`；非 `useEmbeddedLayout`；若无 `create-d` 且目标非自己，须已有 DM 房间+订阅 `useReplyInDMAction.ts:51-64`。`disabled` 当 E2EE 或 ABAC `useReplyInDMAction.ts:86`。hidden id `reply-directly`。 | (1) 路由到 DM；composer 带 quote/reply [待渲染实测] reply 预览。(2) 点击无 REST；`roomCoordinator.openRouteLink('d', {name: username}, {reply: message._id})` `useReplyInDMAction.ts:75-82`。随后发送走 `chat.sendMessage`。(3) 刷新落在 DM 且 `?reply=` 仍在则引用仍在，否则视 URL。[读] | `create-d`；`room.t` `abacAttributes`；`message.u.username` `_id`；`isE2EEMessage`；embedded layout | msg.quote；msg.forward | `useReplyInDMAction.ts:12-88` |
| msg.copy.text | 把消息文本复制到剪贴板 | `房间消息→悬停工具栏→More→Copy_text`；`联邦 / threads` 同样。[待渲染实测] `message-mobile`。videoconf 与列表类 **不含**。 | `subscription` `useCopyAction.ts:21-23`。hidden id `copy`。`useCopyAction.ts:21-23` 即 ungated 证明点（仅订阅）。 | (1) toast `Copied`；无新面板。(2) **无** HTTP；`navigator.clipboard.writeText` 取 `msg` 或附件 description/title `useCopyAction.ts:7-11,32-34`。(3) 服务器无变化。[读] | `message.msg` `attachments[0].description\|title`；`subscription` | msg.quote；msg.edit | `useCopyAction.ts:14-38` |
| msg.edit | 把消息载入 composer 编辑并保存 | `自己的（或有权的）消息→悬停工具栏→More→Edit→改文本→发送`；`联邦房间仅自己的消息`；`threads` 同样。[待渲染实测] `message-mobile`。videoconf **不含**。 | `subscription`；联邦：仅 `message.u._id===user`。非联邦：`edit-message` **或**（`Message_AllowEditing` 且自己的）；时限 `Message_AllowEditing_BlockEditInMinutes` 可被 `bypass-time-limit-edit-and-delete` 绕过 `useEditMessageAction.ts:15-40`。真正进入编辑还经 `canUpdateMessage` `ChatMessages.ts:121`。hidden id `edit-message`。 | (1) 该 `listitem` `isEditing`；composer 进入 editing mode 并填入原文 [待渲染实测] composer name。(2) 点击无 HTTP；保存 `POST /v1/chat.update` `{msgId, roomId, text}` `data.ts:176-192` `processMessageEditing.ts:27`。(3) 刷新后正文为新文本，带 edited 标记。[读] | `Message_AllowEditing` `Message_AllowEditing_BlockEditInMinutes`；`edit-message` `bypass-time-limit-edit-and-delete`；`message.u._id` `ts` `msg`；federated room | msg.copy.text；msg.delete | `useEditMessageAction.ts:9-57` |
| msg.delete | 删除消息（确认后不可恢复） | `房间消息→悬停工具栏→More→Delete→Are_you_sure 模态→Yes_delete_it`；`联邦仅自己的`；`threads / videoconf / videoconf-threads` 同样。[待渲染实测] `message-mobile`。列表类 context **不含**。 | `subscription`；联邦：仅作者。非联邦：非 livechat；`chat.data.canDeleteMessage`：非系统消息；`force-delete-message` 或（`Message_AllowDeleting` 且（`delete-message` 或（`delete-own-message` 且自己的））且时限/`bypass-time-limit-edit-and-delete`）`data.ts:195-229` `useDeleteMessageAction.ts:17-35`。hidden id `delete-message`。 | (1) danger `GenericModal` `Are_you_sure` / `Yes_delete_it`；成功 toast `Your_entry_has_been_deleted`；该 `listitem` 消失 [待渲染实测]。(2) `POST /v1/chat.delete` `{msgId, roomId}` `data.ts:247`。(3) 刷新后消息不在时间线（讨论父消息另有文案 `The_message_is_a_discussion_you_will_not_be_able_to_recover`）。[读] | `Message_AllowDeleting` `Message_AllowDeleting_BlockDeleteInMinutes`；`force-delete-message` `delete-message` `delete-own-message` `bypass-time-limit-edit-and-delete`；`message.u._id` `ts` `drid` | msg.edit | `useDeleteMessageAction.ts:10-53` |
| msg.report | 向管理员举报他人消息 | `他人消息→悬停工具栏→More→Report→填 Report_reason→Report`；`联邦 / threads / videoconf / videoconf-threads` 同样。[待渲染实测] `message-mobile`。 | `subscription`；非 livechat；`message.u._id !== user._id` `useReportMessageAction.tsx:24-30`。hidden id `report-message`。 | (1) danger 模态 `Report_message`；成功 toast `Report_has_been_sent` 后关闭 [待渲染实测]。(2) `POST /v1/chat.reportMessage` `{messageId, description}` `ReportMessageModal.tsx:41,49`。(3) 刷新后消息仍在（举报在管理端）；菜单仍可再报。[读] | `message._id` `msg`/`attachments`；`user._id`；room livechat | （无） | `useReportMessageAction.tsx:15-52` |
| msg.reaction.list | 查看谁对哪些 emoji 做了回应 | `已有 reactions 的消息→悬停工具栏→More→Reactions`；`联邦 / threads / videoconf / videoconf-threads` 同样。[待渲染实测] `message-mobile`。 | `message.reactions` 真值 `useShowMessageReactionsAction.tsx:10-12`。hidden id `reaction-list`。`useShowMessageReactionsAction.tsx:10-12` 即门控证明。 | (1) info 模态 `Users_reacted` / 列表 `role=list` [待渲染实测] 行 name；Close 关闭。(2) **无** HTTP（用当前 `message.reactions`）`ReactionListModal.tsx:16-18`。(3) 刷新后若 reactions 仍在，菜单项仍在。[读] | `message.reactions` | msg.reaction.add | `useShowMessageReactionsAction.tsx:7-32` |
| msg.read-receipts | 查看谁已读该消息 | `房间消息→悬停工具栏→More→Read_Receipts`；`starred / threads / videoconf / videoconf-threads / federated` 同样。[待渲染实测] `message-mobile`。pinned/mentions/search/direct **不含**。 | 客户端：`Message_Read_Receipt_Enabled` 且（非联邦或 `Federation_Service_EDU_Process_Receipt`）且 `Message_Read_Receipt_Store_Users` `MessageListProvider.tsx:41-45` `useReadReceiptsDetailsAction.tsx:11-15`。服务端 GET 另要 license 模块 `message-read-receipt` `ee/server/api/chat.ts:51`。hidden id `receipt-detail`。 | (1) 模态 `Read_by`；空则 `No_results_found`；有则 `role=list` 行 [待渲染实测] 行 name。(2) `GET /v1/chat.getMessageReadReceipts?messageId=` `ReadReceiptsModal.tsx:26-30`；可选 WS `notify-room/${rid}/messagesRead` 使列表失效重拉。(3) 刷新后菜单仍在（设置未变）；已读集合随他人阅读增长。[读] | `Message_Read_Receipt_Enabled` `Message_Read_Receipt_Store_Users` `Federation_Service_EDU_Process_Receipt`；license `message-read-receipt`；`message._id` `rid` | （无） | `useReadReceiptsDetailsAction.tsx:8-36` |
| msg.apps.action | Apps-Engine `messageAction`（非 AI）注入 More→Apps | `房间消息→悬停工具栏→More→（section Apps）→具体 app 项`；默认 app context 仅 `message`/`message-mobile`/`threads`/`starred`（`IUIActionButtonDescriptor.ts:15-20` + `useMessageActionAppsActionButtons.ts:19-20`）。E2EE 时整节替换为 disabled `Unavailable` `MessageToolbarActionMenu.tsx:126-143`。**不枚举 marketplace 应用。** 若 `data.length===0`（无内置菜单项），More 不渲染，apps 无法单独出现 `MessageToolbarActionMenu.tsx:92-94`。[读] | App `when`：`hasOnePermission`/`hasAllPermissions`/`hasOneRole`/`hasAllRoles`/`roomTypes`/`messageActionContext`；再经 `useApplyButtonFilters('default')` `useApplyButtonFilters.ts:45-56`。hidden 按 `${appId}/${actionId}`。需 `GET /apps/actionButtons` 且连接状态 connected `useAppActionButtons.ts:15-19`。 | (1) More 下出现 Apps section 或 app 自绘 UiKit 模态/上下文栏 [待渲染实测] 具体 name。(2) `POST /apps/ui.interaction/${appId}` `{type:'actionButton', rid, tmid, mid, actionId, payload}` `ActionManager.ts:85-88`；目录 `GET /apps/actionButtons`。(3) 刷新后按钮仍在（app 仍启用）；交互副作用视 app。[读] | `GET /apps/actionButtons`；`IUIActionButton.when`；`message.rid` `tmid` `_id`；E2EE | msg.apps.ai | `useMessageActionAppsActionButtons.ts:25-77`；装配 `MessageToolbarActionMenu.tsx:87,98` |
| msg.apps.ai | Apps-Engine `messageAction` 且 `category==='ai'` 注入星星菜单 | `房间消息→悬停工具栏→AI_Actions（icon=stars）→具体 AI 项`。过滤 `useApplyButtonFilters('ai')` `MessageToolbarStarsActionMenu.tsx:22`。无 AI 按钮则整菜单不渲染 `MessageToolbarStarsActionMenu.tsx:26-28`。E2EE 时 apps 组变为 disabled `Unavailable`。context 默认同样只有 4 个 Apps-Engine 值。 | 同 msg.apps.action，但 `category==='ai'` `useApplyButtonFilters.ts:35-43`。 | (1) 工具栏出现 `title=AI_Actions` 的星星菜单；点击后 UiKit [待渲染实测]。(2) 同 `POST /apps/ui.interaction/${appId}`。(3) 刷新后若 app 仍启用则星星仍在。[读] | 同 msg.apps.action + `category:'ai'` | msg.apps.action | `MessageToolbarStarsActionMenu.tsx:21-80`；`useMessageActionAppsActionButtons.ts:25` |

本表数据行：**26**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.message

装配：`DefaultItems.tsx` + More + Stars。赋值：`getMessageContext` 默认；`RoomMessage` 主列表非联邦/非 videoconf/非 tmid。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.reaction.add | 见 A | `房间消息→悬停工具栏→Add_Reaction / quickReactions` | 见表 A | 见表 A | 见表 A | 见表 A | `DefaultItems.tsx:17` |
| msg.quote | 见 A | `房间消息→悬停工具栏→Quote` | 见表 A | 见表 A | 见表 A | 见表 A | `DefaultItems.tsx:18` |
| msg.thread.reply | 见 A | `房间消息→悬停工具栏→Reply_in_thread` | 见表 A | 见表 A | 见表 A | 见表 A | `DefaultItems.tsx:19` |
| msg.forward | 见 A | `房间消息→悬停工具栏→Forward_message` | 见表 A | 见表 A | 见表 A | 见表 A | `DefaultItems.tsx:20` |
| msg.webdav.save | 见 A | `房间消息→悬停工具栏→More→Save_To_Webdav` | 见表 A | 见表 A | 见表 A | 见表 A | `useWebDAVMessageAction.tsx:19`（无 context） |
| msg.discussion.start | 见 A | `房间消息→悬停工具栏→More→Discussion_start` | 见表 A | 见表 A | 见表 A | 见表 A | `useNewDiscussionMessageAction.tsx:55` |
| msg.unpin | 见 A | `房间消息（已钉）→悬停工具栏→More→Unpin` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnpinMessageAction.ts:26` |
| msg.pin | 见 A | `房间消息→悬停工具栏→More→Pin→确认` | 见表 A | 见表 A | 见表 A | 见表 A | `usePinMessageAction.tsx:33` |
| msg.star | 见 A | `房间消息→悬停工具栏→More→Star` | 见表 A | 见表 A | 见表 A | 见表 A | `useStarMessageAction.ts:27` |
| msg.unstar | 见 A | `房间消息（已 star）→悬停工具栏→More→Unstar_Message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnstarMessageAction.ts:27` |
| msg.permalink.copy | 见 A | `房间消息→悬停工具栏→More→Copy_link` | 见表 A | 见表 A | 见表 A | 见表 A | `MessageToolbarActionMenu.tsx:55-63` |
| msg.thread.follow | 见 A | `房间消息→悬停工具栏→More→Follow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useFollowMessageAction.ts:55` |
| msg.thread.unfollow | 见 A | `房间消息→悬停工具栏→More→Unfollow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnFollowMessageAction.ts:56` |
| msg.unread.mark | 见 A | `他人消息→悬停工具栏→More→Mark_unread` | 见表 A | 见表 A | 见表 A | 见表 A | `useMarkAsUnreadMessageAction.ts:33` |
| msg.translate | 见 A | `房间消息→悬停工具栏→More→Translate` | 见表 A | 见表 A | 见表 A | 见表 A | `useTranslateAction.ts:47` |
| msg.translate.original | 见 A | `房间消息→悬停工具栏→More→View_original` | 见表 A | 见表 A | 见表 A | 见表 A | `useViewOriginalTranslationAction.ts:47` |
| msg.reply.dm | 见 A | `房间消息→悬停工具栏→More→Reply_in_direct_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useReplyInDMAction.ts:71` |
| msg.copy.text | 见 A | `房间消息→悬停工具栏→More→Copy_text` | 见表 A | 见表 A | 见表 A | 见表 A | `useCopyAction.ts:29` |
| msg.edit | 见 A | `房间消息→悬停工具栏→More→Edit` | 见表 A | 见表 A | 见表 A | 见表 A | `useEditMessageAction.ts:50` |
| msg.delete | 见 A | `房间消息→悬停工具栏→More→Delete→确认` | 见表 A | 见表 A | 见表 A | 见表 A | `useDeleteMessageAction.ts:45` |
| msg.report | 见 A | `他人消息→悬停工具栏→More→Report` | 见表 A | 见表 A | 见表 A | 见表 A | `useReportMessageAction.tsx:36` |
| msg.reaction.list | 见 A | `有反应的消息→悬停工具栏→More→Reactions` | 见表 A | 见表 A | 见表 A | 见表 A | `useShowMessageReactionsAction.tsx:18` |
| msg.read-receipts | 见 A | `房间消息→悬停工具栏→More→Read_Receipts` | 见表 A | 见表 A | 见表 A | 见表 A | `useReadReceiptsDetailsAction.tsx:21` |
| msg.apps.action | 见 A | `房间消息→悬停工具栏→More→Apps` | 见表 A | 见表 A | 见表 A | 见表 A | `useMessageActionAppsActionButtons.ts:19` |
| msg.apps.ai | 见 A | `房间消息→悬停工具栏→AI_Actions` | 见表 A | 见表 A | 见表 A | 见表 A | `MessageToolbarStarsActionMenu.tsx:22` |

本表数据行：**25**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.message-mobile

装配：`MobileItems.tsx`（Default 四项 + jump）。**develop 无赋值调用方**（`rg` 无 `context='message-mobile'`）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.reaction.add | 见 A | `[待渲染实测] 无现行赋值；若赋值则 悬停工具栏→Add_Reaction` | 见表 A | 见表 A | 见表 A | 见表 A | `MobileItems.tsx:18` |
| msg.quote | 见 A | `[待渲染实测] 无现行赋值；若赋值则 悬停工具栏→Quote` | 见表 A | 见表 A | 见表 A | 见表 A | `MobileItems.tsx:19` |
| msg.thread.reply | 见 A | `[待渲染实测] 无现行赋值；若赋值则 悬停工具栏→Reply_in_thread` | 见表 A | 见表 A | 见表 A | 见表 A | `MobileItems.tsx:20` |
| msg.forward | 见 A | `[待渲染实测] 无现行赋值；若赋值则 悬停工具栏→Forward_message` | 见表 A | 见表 A | 见表 A | 见表 A | `MobileItems.tsx:21` |
| msg.jump | 见 A | `[待渲染实测] 无现行赋值；若赋值则 悬停工具栏→Jump_to_message` | 见表 A | 见表 A | 见表 A | 见表 A | `MobileItems.tsx:22` |
| msg.webdav.save | 见 A | `[待渲染实测] More→Save_To_Webdav` | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |
| msg.discussion.start | 见 A | `[待渲染实测] More→Discussion_start` | 见表 A | 见表 A | 见表 A | 见表 A | `useNewDiscussionMessageAction.tsx:55` |
| msg.unpin | 见 A | `[待渲染实测] More→Unpin` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnpinMessageAction.ts:26` |
| msg.pin | 见 A | `[待渲染实测] More→Pin` | 见表 A | 见表 A | 见表 A | 见表 A | `usePinMessageAction.tsx:33` |
| msg.star | 见 A | `[待渲染实测] More→Star` | 见表 A | 见表 A | 见表 A | 见表 A | `useStarMessageAction.ts:27` |
| msg.unstar | 见 A | `[待渲染实测] More→Unstar_Message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnstarMessageAction.ts:27` |
| msg.permalink.copy | 见 A | `[待渲染实测] More→Copy_link` | 见表 A | 见表 A | 见表 A | 见表 A | `MessageToolbarActionMenu.tsx:59` |
| msg.thread.follow | 见 A | `[待渲染实测] More→Follow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useFollowMessageAction.ts:55` |
| msg.thread.unfollow | 见 A | `[待渲染实测] More→Unfollow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnFollowMessageAction.ts:56` |
| msg.unread.mark | 见 A | `[待渲染实测] More→Mark_unread` | 见表 A | 见表 A | 见表 A | 见表 A | `useMarkAsUnreadMessageAction.ts:33` |
| msg.translate | 见 A | `[待渲染实测] More→Translate` | 见表 A | 见表 A | 见表 A | 见表 A | `useTranslateAction.ts:47` |
| msg.translate.original | 见 A | `[待渲染实测] More→View_original` | 见表 A | 见表 A | 见表 A | 见表 A | `useViewOriginalTranslationAction.ts:47` |
| msg.reply.dm | 见 A | `[待渲染实测] More→Reply_in_direct_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useReplyInDMAction.ts:71` |
| msg.copy.text | 见 A | `[待渲染实测] More→Copy_text` | 见表 A | 见表 A | 见表 A | 见表 A | `useCopyAction.ts:29` |
| msg.edit | 见 A | `[待渲染实测] More→Edit` | 见表 A | 见表 A | 见表 A | 见表 A | `useEditMessageAction.ts:50` |
| msg.delete | 见 A | `[待渲染实测] More→Delete` | 见表 A | 见表 A | 见表 A | 见表 A | `useDeleteMessageAction.ts:45` |
| msg.report | 见 A | `[待渲染实测] More→Report` | 见表 A | 见表 A | 见表 A | 见表 A | `useReportMessageAction.tsx:36` |
| msg.reaction.list | 见 A | `[待渲染实测] More→Reactions` | 见表 A | 见表 A | 见表 A | 见表 A | `useShowMessageReactionsAction.tsx:18` |
| msg.read-receipts | 见 A | `[待渲染实测] More→Read_Receipts` | 见表 A | 见表 A | 见表 A | 见表 A | `useReadReceiptsDetailsAction.tsx:21` |
| msg.apps.action | 见 A | `[待渲染实测] More→Apps`（枚举含 MESSAGE_MOBILE） | 见表 A | 见表 A | 见表 A | 见表 A | `IUIActionButtonDescriptor.ts:17` |
| msg.apps.ai | 见 A | `[待渲染实测] AI_Actions` | 见表 A | 见表 A | 见表 A | 见表 A | 同上 |

本表数据行：**26**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.threads

装配：`ThreadsItems.tsx`（无 Reply_in_thread 图标）。赋值：`ThreadMessage.tsx:32`；或主列表 `tmid` 经 `getMessageContext`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.reaction.add | 见 A | `顶栏 Threads→打开线程→悬停工具栏→Add_Reaction` | 见表 A | 见表 A | 见表 A | 见表 A | `ThreadsItems.tsx:17` |
| msg.quote | 见 A | `线程消息→悬停工具栏→Quote` | 见表 A | 见表 A | 见表 A | 见表 A | `ThreadsItems.tsx:18` |
| msg.forward | 见 A | `线程消息→悬停工具栏→Forward_message` | 见表 A | 见表 A | 见表 A | 见表 A | `ThreadsItems.tsx:19` |
| msg.jump | 见 A | `线程消息→悬停工具栏→Jump_to_message` | 见表 A | 见表 A | 见表 A | 见表 A | `ThreadsItems.tsx:20` |
| msg.webdav.save | 见 A | `线程消息→More→Save_To_Webdav` | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |
| msg.unpin | 见 A | `线程已钉消息→More→Unpin` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnpinMessageAction.ts:26` |
| msg.pin | 见 A | `线程消息→More→Pin→确认` | 见表 A | 见表 A | 见表 A | 见表 A | `usePinMessageAction.tsx:33` |
| msg.star | 见 A | `线程消息→More→Star` | 见表 A | 见表 A | 见表 A | 见表 A | `useStarMessageAction.ts:27` |
| msg.unstar | 见 A | `线程已 star→More→Unstar_Message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnstarMessageAction.ts:27` |
| msg.permalink.copy | 见 A | `线程消息→More→Copy_link` | 见表 A | 见表 A | 见表 A | 见表 A | `MessageToolbarActionMenu.tsx:59` |
| msg.thread.follow | 见 A | `线程消息→More→Follow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useFollowMessageAction.ts:55` |
| msg.thread.unfollow | 见 A | `线程消息→More→Unfollow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnFollowMessageAction.ts:56` |
| msg.unread.mark | 见 A | `线程他人消息→More→Mark_unread` | 见表 A | 见表 A | 见表 A | 见表 A | `useMarkAsUnreadMessageAction.ts:33` |
| msg.translate | 见 A | `线程消息→More→Translate` | 见表 A | 见表 A | 见表 A | 见表 A | `useTranslateAction.ts:47` |
| msg.translate.original | 见 A | `线程消息→More→View_original` | 见表 A | 见表 A | 见表 A | 见表 A | `useViewOriginalTranslationAction.ts:47` |
| msg.reply.dm | 见 A | `线程消息→More→Reply_in_direct_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useReplyInDMAction.ts:71` |
| msg.copy.text | 见 A | `线程消息→More→Copy_text` | 见表 A | 见表 A | 见表 A | 见表 A | `useCopyAction.ts:29` |
| msg.edit | 见 A | `线程消息→More→Edit` | 见表 A | 见表 A | 见表 A | 见表 A | `useEditMessageAction.ts:50` |
| msg.delete | 见 A | `线程消息→More→Delete→确认` | 见表 A | 见表 A | 见表 A | 见表 A | `useDeleteMessageAction.ts:45` |
| msg.report | 见 A | `线程他人消息→More→Report` | 见表 A | 见表 A | 见表 A | 见表 A | `useReportMessageAction.tsx:36` |
| msg.reaction.list | 见 A | `线程有反应消息→More→Reactions` | 见表 A | 见表 A | 见表 A | 见表 A | `useShowMessageReactionsAction.tsx:18` |
| msg.read-receipts | 见 A | `线程消息→More→Read_Receipts` | 见表 A | 见表 A | 见表 A | 见表 A | `useReadReceiptsDetailsAction.tsx:21` |
| msg.apps.action | 见 A | `线程消息→More→Apps` | 见表 A | 见表 A | 见表 A | 见表 A | Apps-Engine `THREADS` |
| msg.apps.ai | 见 A | `线程消息→AI_Actions` | 见表 A | 见表 A | 见表 A | 见表 A | 同上 |

本表数据行：**24**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.videoconf

装配：`VideoconfItems.tsx`。赋值：`getMessageContext` 当 `message.t==='videoconf'`（`IMessage.ts:393`）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.reaction.add | 见 A | `房间内 videoconf 系统消息→悬停工具栏→Add_Reaction` | 见表 A | 见表 A | 见表 A | 见表 A | `VideoconfItems.tsx:15` |
| msg.thread.reply | 见 A | `videoconf 消息→悬停工具栏→Reply_in_thread` | 见表 A | 见表 A | 见表 A | 见表 A | `VideoconfItems.tsx:16` |
| msg.webdav.save | 见 A | `videoconf 消息→More→Save_To_Webdav`（通常无 file，运行时隐藏） | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |
| msg.discussion.start | 见 A | `videoconf 消息→More→Discussion_start` | 见表 A | 见表 A | 见表 A | 见表 A | `useNewDiscussionMessageAction.tsx:55` |
| msg.unpin | 见 A | `已钉 videoconf 消息→More→Unpin` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnpinMessageAction.ts:26` |
| msg.pin | 见 A | `videoconf 消息→More→Pin→确认` | 见表 A | 见表 A | 见表 A | 见表 A | `usePinMessageAction.tsx:33` |
| msg.star | 见 A | `videoconf 消息→More→Star` | 见表 A | 见表 A | 见表 A | 见表 A | `useStarMessageAction.ts:27` |
| msg.unstar | 见 A | `已 star videoconf→More→Unstar_Message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnstarMessageAction.ts:27` |
| msg.permalink.copy | 见 A | `videoconf 消息→More→Copy_link` | 见表 A | 见表 A | 见表 A | 见表 A | `MessageToolbarActionMenu.tsx:59` |
| msg.thread.follow | 见 A | `videoconf 消息→More→Follow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useFollowMessageAction.ts:55` |
| msg.thread.unfollow | 见 A | `videoconf 消息→More→Unfollow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnFollowMessageAction.ts:56` |
| msg.delete | 见 A | `videoconf 消息→More→Delete→确认` | 见表 A | 见表 A | 见表 A | 见表 A | `useDeleteMessageAction.ts:45` |
| msg.report | 见 A | `他人 videoconf 消息→More→Report` | 见表 A | 见表 A | 见表 A | 见表 A | `useReportMessageAction.tsx:36` |
| msg.reaction.list | 见 A | `有反应 videoconf→More→Reactions` | 见表 A | 见表 A | 见表 A | 见表 A | `useShowMessageReactionsAction.tsx:18` |
| msg.read-receipts | 见 A | `videoconf 消息→More→Read_Receipts` | 见表 A | 见表 A | 见表 A | 见表 A | `useReadReceiptsDetailsAction.tsx:21` |

本表数据行：**15**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.videoconf-threads

装配：`VideoconfThreadsItems.tsx`。赋值：`ThreadMessage.tsx:32` 当线程里的消息 `t==='videoconf'`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.reaction.add | 见 A | `线程内 videoconf 消息→悬停工具栏→Add_Reaction` | 见表 A | 见表 A | 见表 A | 见表 A | `VideoconfThreadsItems.tsx:15` |
| msg.jump | 见 A | `线程内 videoconf 消息→悬停工具栏→Jump_to_message` | 见表 A | 见表 A | 见表 A | 见表 A | `VideoconfThreadsItems.tsx:16` |
| msg.webdav.save | 见 A | `More→Save_To_Webdav` | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |
| msg.unpin | 见 A | `More→Unpin` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnpinMessageAction.ts:26` |
| msg.pin | 见 A | `More→Pin→确认` | 见表 A | 见表 A | 见表 A | 见表 A | `usePinMessageAction.tsx:33` |
| msg.star | 见 A | `More→Star` | 见表 A | 见表 A | 见表 A | 见表 A | `useStarMessageAction.ts:27` |
| msg.unstar | 见 A | `More→Unstar_Message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnstarMessageAction.ts:27` |
| msg.permalink.copy | 见 A | `More→Copy_link` | 见表 A | 见表 A | 见表 A | 见表 A | `MessageToolbarActionMenu.tsx:59` |
| msg.thread.follow | 见 A | `More→Follow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useFollowMessageAction.ts:55` |
| msg.thread.unfollow | 见 A | `More→Unfollow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnFollowMessageAction.ts:56` |
| msg.delete | 见 A | `More→Delete→确认` | 见表 A | 见表 A | 见表 A | 见表 A | `useDeleteMessageAction.ts:45` |
| msg.report | 见 A | `More→Report` | 见表 A | 见表 A | 见表 A | 见表 A | `useReportMessageAction.tsx:36` |
| msg.reaction.list | 见 A | `More→Reactions` | 见表 A | 见表 A | 见表 A | 见表 A | `useShowMessageReactionsAction.tsx:18` |
| msg.read-receipts | 见 A | `More→Read_Receipts` | 见表 A | 见表 A | 见表 A | 见表 A | `useReadReceiptsDetailsAction.tsx:21` |

本表数据行：**14**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.pinned

装配：`PinnedItems.tsx`。赋值：`PinnedMessagesTab.tsx:41` → `MessageListTab` → `RoomMessage context='pinned'`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.jump | 见 A | `顶栏 Pinned_Messages（或 Options→Pinned_Messages）→悬停→Jump_to_message` | `Message_AllowPinning` 控制侧栏本身 `usePinnedMessagesRoomAction.ts:14`；联邦侧栏 disabled。jump 图标 none+`PinnedItems.tsx:14` | 见表 A | 见表 A | 见表 A | `PinnedItems.tsx:14` id `jump-to-pin-message` |
| msg.webdav.save | 见 A | `钉选列表消息（有 file）→More→Save_To_Webdav` | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |
| msg.unpin | 见 A | `钉选列表→悬停→More→Unpin` | 见表 A（此处 `message.pinned` 应为 true） | 见表 A | 见表 A | 见表 A | `useUnpinMessageAction.ts:26` |
| msg.pin | 见 A | 已注册 context 含 `pinned`，但 `message.pinned` 为真时 hook 返回 null，**钉选列表运行时不应出现** [读] | 见表 A | 见表 A | 见表 A | 见表 A | `usePinMessageAction.tsx:33` |
| msg.permalink.copy | 见 A | `钉选列表→More→Copy_link`（id `permalink-pinned`） | 见表 A | 见表 A | 见表 A | 见表 A | `MessageToolbarActionMenu.tsx:54` |

本表数据行：**5**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.direct

装配：`DirectItems.tsx`。**develop 无 `context='direct'` 调用方。** pin/unpin 的 context 数组含 `direct`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.jump | 见 A | `[待渲染实测] 无现行赋值；Items 在 subscription 存在时渲染 Jump（内部 id 却是 jump-to-pin-message）` | `DirectItems.tsx:12` `!!subscription` | 见表 A | 见表 A | 见表 A | `DirectItems.tsx:12` |
| msg.webdav.save | 见 A | `[待渲染实测] More→Save_To_Webdav` | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |
| msg.unpin | 见 A | `[待渲染实测] More→Unpin` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnpinMessageAction.ts:26` |
| msg.pin | 见 A | `[待渲染实测] More→Pin` | 见表 A | 见表 A | 见表 A | 见表 A | `usePinMessageAction.tsx:33` |

本表数据行：**4**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.starred

装配：`StarredItems.tsx`。赋值：`StarredMessagesTab.tsx:41`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.jump | 见 A | `顶栏 Starred_Messages（或 Options→Starred_Messages）→悬停→Jump_to_message` | hidden id `jump-to-star-message` | 见表 A | 见表 A | 见表 A | `StarredItems.tsx:14` |
| msg.webdav.save | 见 A | `收藏列表（有 file）→More→Save_To_Webdav` | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |
| msg.star | 见 A | context 含 `starred`，但已 star 时返回 null，**收藏列表运行时不应出现 Star** [读] | 见表 A | 见表 A | 见表 A | 见表 A | `useStarMessageAction.ts:27` |
| msg.unstar | 见 A | `收藏列表→More→Unstar_Message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnstarMessageAction.ts:27` |
| msg.permalink.copy | 见 A | `收藏列表→More→Copy_link`（id `permalink-star`） | 见表 A | 见表 A | 见表 A | 见表 A | `MessageToolbarActionMenu.tsx:53` |
| msg.read-receipts | 见 A | `收藏列表→More→Read_Receipts` | 见表 A | 见表 A | 见表 A | 见表 A | `useReadReceiptsDetailsAction.tsx:21` |
| msg.apps.action | 见 A | `收藏列表→More→Apps`（枚举含 STARRED；仍受 `data.length===0` 限制） | 见表 A | 见表 A | 见表 A | 见表 A | `IUIActionButtonDescriptor.ts:19` |
| msg.apps.ai | 见 A | `收藏列表→AI_Actions` | 见表 A | 见表 A | 见表 A | 见表 A | 同上 |

本表数据行：**8**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.mentions

装配：`MentionsItems.tsx`。赋值：`MentionsTab.tsx:40`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.jump | 见 A | `顶栏 Mentions（或 Options→Mentions；仅 channel/group/team，`useMentionsRoomAction.ts:10`）→悬停→Jump_to_message` | none+`MentionsItems.tsx:14` | 见表 A | 见表 A | 见表 A | `MentionsItems.tsx:14` |
| msg.webdav.save | 见 A | `Mentions 列表有 file→More→Save_To_Webdav`；否则 More 不出现 | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |

本表数据行：**2**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.federated

装配：`FederatedItems.tsx`。赋值：`getMessageContext` 当 `isRoomFederated(room)` 且未传入 context、且非 videoconf。线程面板显式传 `threads`，**不**走本表。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.reaction.add | 见 A | `联邦房间主列表→悬停工具栏→Add_Reaction`（native；blocked 隐藏） | 见表 A | 见表 A | 见表 A | 见表 A | `FederatedItems.tsx:16` |
| msg.quote | 见 A | `联邦房间→悬停工具栏→Quote` | 见表 A | 见表 A | 见表 A | 见表 A | `FederatedItems.tsx:17` |
| msg.thread.reply | 见 A | `联邦房间→悬停工具栏→Reply_in_thread` | 见表 A | 见表 A | 见表 A | 见表 A | `FederatedItems.tsx:18` |
| msg.webdav.save | 见 A | `More→Save_To_Webdav` | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |
| msg.star | 见 A | `More→Star` | 见表 A | 见表 A | 见表 A | 见表 A | `useStarMessageAction.ts:27` |
| msg.unstar | 见 A | `More→Unstar_Message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnstarMessageAction.ts:27` |
| msg.permalink.copy | 见 A | `More→Copy_link` | 见表 A | 见表 A | 见表 A | 见表 A | `MessageToolbarActionMenu.tsx:59` |
| msg.thread.follow | 见 A | `More→Follow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useFollowMessageAction.ts:55` |
| msg.thread.unfollow | 见 A | `More→Unfollow_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnFollowMessageAction.ts:56` |
| msg.reply.dm | 见 A | `More→Reply_in_direct_message` | 见表 A | 见表 A | 见表 A | 见表 A | `useReplyInDMAction.ts:71` |
| msg.copy.text | 见 A | `More→Copy_text` | 见表 A | 见表 A | 见表 A | 见表 A | `useCopyAction.ts:29` |
| msg.edit | 见 A | `More→Edit`（仅自己的） | 见表 A | 见表 A | 见表 A | 见表 A | `useEditMessageAction.ts:50` |
| msg.delete | 见 A | `More→Delete`（仅自己的） | 见表 A | 见表 A | 见表 A | 见表 A | `useDeleteMessageAction.ts:45` |
| msg.report | 见 A | `More→Report` | 见表 A | 见表 A | 见表 A | 见表 A | `useReportMessageAction.tsx:36` |
| msg.reaction.list | 见 A | `More→Reactions` | 见表 A | 见表 A | 见表 A | 见表 A | `useShowMessageReactionsAction.tsx:18` |
| msg.read-receipts | 见 A | `More→Read_Receipts`（另需 `Federation_Service_EDU_Process_Receipt`） | 见表 A | 见表 A | 见表 A | 见表 A | `useReadReceiptsDetailsAction.tsx:21` |

本表数据行：**16**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B. 按 MessageActionContext 可出现的 id

### 表 B.search

装配：`SearchItems.tsx`。赋值：`MessageSearchTab.tsx:102`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.jump | 见 A | `顶栏 Search_Messages（或 Options→Search_Messages）→输入关键词→悬停结果→Jump_to_message` | none+`SearchItems.tsx:14` | 见表 A | 见表 A | 见表 A | `SearchItems.tsx:14` |
| msg.webdav.save | 见 A | `搜索结果有 file→More→Save_To_Webdav`；否则无 More | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |

本表数据行：**2**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 C. 按注册/装配文件

### 表 C1. 出处文件（一文件一行或多 id）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.reaction.add | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `ReactionMessageAction.tsx:25` |
| msg.quote | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `QuoteMessageAction.tsx:20` |
| msg.thread.reply | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `ReplyInThreadMessageAction.tsx:20` |
| msg.forward | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `ForwardMessageAction.tsx:16` |
| msg.jump | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `JumpToMessageAction.tsx:12` |
| msg.webdav.save | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useWebDAVMessageAction.tsx:9` |
| msg.discussion.start | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useNewDiscussionMessageAction.tsx:8` |
| msg.unpin | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useUnpinMessageAction.ts:8` |
| msg.pin | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `usePinMessageAction.tsx:9` |
| msg.star | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useStarMessageAction.ts:8` |
| msg.unstar | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useUnstarMessageAction.ts:8` |
| msg.permalink.copy | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `usePermalinkAction.ts:10` |
| msg.thread.follow | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useFollowMessageAction.ts:10` |
| msg.thread.unfollow | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useUnFollowMessageAction.ts:10` |
| msg.unread.mark | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useMarkAsUnreadMessageAction.ts:8` |
| msg.translate | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useTranslateAction.ts:11` |
| msg.translate.original | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useViewOriginalTranslationAction.ts:11` |
| msg.reply.dm | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useReplyInDMAction.ts:12` |
| msg.copy.text | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useCopyAction.ts:14` |
| msg.edit | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useEditMessageAction.ts:9` |
| msg.delete | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useDeleteMessageAction.ts:10` |
| msg.report | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useReportMessageAction.tsx:15` |
| msg.reaction.list | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useShowMessageReactionsAction.tsx:7` |
| msg.read-receipts | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useReadReceiptsDetailsAction.tsx:8` |
| msg.apps.action | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useMessageActionAppsActionButtons.ts:25` |
| msg.apps.ai | 见 A | 见 A | 见 A | 见 A | 见 A | 见 A | `useMessageActionAppsActionButtons.ts:25` + `MessageToolbarStarsActionMenu.tsx:22` |

本表数据行：**26**。计数：`rg -c '^\| ` 对本节；见附录验算。

本分册表体行合计 **193**；稳定 id（首次出现去重）**26**。

## 分册 02 — Room / User / Nav chrome

Header 只挂 `Header`（无 HeaderV2）。RoomToolbox / UserCard / NavBar / Sidebar 规则见 `02-room-user-nav.md`。

## 表 A — Room toolbox（`room.*`）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.toolbox.channel-settings | 打开频道/私有组房间信息侧栏 | `房间头→工具栏→Room_Info`；溢出 `…→Options→Room_Info`；兼 `房间头→房间标题`（非 team/DM/live） | hook: none `useChannelSettingsRoomAction.ts:7-18`；groups∈{channel,group}；anonymous 可读 | DOM: [待渲染实测] complementary/dialog name≈Room_Info 出现，再点同一按钮消失；endpoint: [读] 打开用房间上下文，编辑 `POST /v1/rooms.saveRoomSettings` `EditRoomInfo.tsx`；persist: [读] URL `tab=channel-settings`，刷新由 `RoomToolboxProvider.tsx:90-102` 重开 | `useChannelSettingsRoomAction.ts:8-17` | `RoomToolbox.tsx:19-46` | `ui.ts:40` |
| room.toolbox.team-info | 打开团队信息侧栏 | `房间头→工具栏→Teams_Info`；溢出 `…→Options→Teams_Info`；兼 `房间头→房间标题`（teamMain） | hook: none `useTeamInfoRoomAction.ts:6-18`；groups∈{team} | DOM: [待渲染实测] complementary name≈Teams_Info；endpoint: [读] 打开用房间上下文，团队写接口 `/v1/teams.*`；persist: [读] URL `tab=team-info` | `useTeamInfoRoomAction.ts:8-16` | `RoomToolbox.tsx:19-46` | `ui.ts:41` |
| room.toolbox.user-info-group | 打开多人 DM 成员列表 | `房间头→工具栏→Members`；兼 `房间头→房间标题`（uids>2 的 d） | hook: none `useUserInfoGroupRoomAction.ts:6-17`；groups∈{direct_multiple} | DOM: [待渲染实测] complementary name≈Members；endpoint: [读] `GET /v1/im.members` 或 `GET /v1/rooms.membersOrderedByRole` `useMembersList.ts`；persist: [读] URL `tab=user-info-group` | `useUserInfoGroupRoomAction.ts:8-15` | `MemberListRouter.tsx` | `ui.ts:42` |
| room.toolbox.user-info | 打开 1:1 DM 对方资料侧栏 | `房间头→工具栏→User_Info`；兼 `房间头→房间标题`（uids≤2 的 d） | hook: none `useUserInfoRoomAction.ts:6-17`；groups∈{direct} | DOM: [待渲染实测] complementary name≈User_Info；endpoint: [读] `GET /v1/users.info` `useUserInfoQuery.ts:12`；persist: [读] URL `tab=user-info` | `useUserInfoRoomAction.ts:8-15` | `MemberListRouter.tsx` | `ui.ts:43` |
| room.toolbox.thread | 打开房间线程列表侧栏 | `房间头→工具栏→Threads`；溢出 `…→Options→Threads` | setting `Threads_enabled` 否则 undefined `useThreadRoomAction.tsx:25,36-37`；groups 无 live | DOM: [待渲染实测] complementary name=Threads，未读时 badge 出现；endpoint: [读] `GET /v1/chat.getThreadsList`；persist: [读] URL `tab=thread` | `useThreadRoomAction.tsx:40-47` | `RoomToolbox.tsx:23-37` 自定义 render | `ui.ts:44` |
| room.toolbox.autotranslate | 打开自动翻译设置侧栏 | `房间头→工具栏→Auto_Translate`；常在 Options（order=20） | permission `auto-translate` + setting `AutoTranslate_Enabled` `useAutotranslateRoomAction.ts:8-13` | DOM: [待渲染实测] complementary name=Auto_Translate；endpoint: [读] `GET /v1/autotranslate.getSupportedLanguages`，保存 `POST /v1/autotranslate.saveSettings`；persist: [读] URL tab + 订阅设置刷新仍在 | `useAutotranslateRoomAction.ts:16-25` | `RoomToolbox.tsx` | `ui.ts:45` |
| room.toolbox.calls | 打开视频会议历史侧栏 | `房间头→工具栏→Calls`；常在 Options（order=999） | license module `videoconference-enterprise` `useCallsRoomAction.ts:12,18-19`；federated 则 disabled+tooltip | DOM: [待渲染实测] complementary name=Calls（federated 时按钮 disabled）；endpoint: [读] `GET /v1/video-conference.list`；persist: [读] URL `tab=calls` | `useCallsRoomAction.ts:22-33` | `VideoConfList` | `ui.ts:46` |
| room.toolbox.canned-responses | 打开 Omnichannel 快捷回复侧栏 | live 房间 `房间头→工具栏→Canned_Responses` | license `canned-responses` + setting `Canned_Responses_Enable` `useCannedResponsesRoomAction.ts:10-15`；groups∈{live} | DOM: [待渲染实测] complementary name=Canned_Responses；endpoint: [读] `GET /v1/canned-responses`；persist: [读] URL `tab=canned-responses` | `useCannedResponsesRoomAction.ts:18-25` | Omnichannel header 共用 RoomToolbox | `ui.ts:47` |
| room.toolbox.clean-history | 打开清理历史（剪枝）侧栏 | `房间头→工具栏→Options→Prune_Messages` | permission `clean-channel-history`（room scoped）`useCleanHistoryRoomAction.ts:14,18-19`；federated disabled | DOM: [待渲染实测] complementary name=Prune_Messages；endpoint: [读] 打开无请求，提交 `POST /v1/rooms.cleanHistory`；persist: [读] 剪枝后消息刷新不在；tab URL 可重开表单 | `useCleanHistoryRoomAction.ts:22-35` | `PruneMessages` | `ui.ts:48` |
| room.toolbox.contact-profile | 打开 livechat 联系人资料 | live `房间头→工具栏→Contact_Info` | hook: none `useContactProfileRoomAction.ts:6-17`；groups∈{live} | DOM: [待渲染实测] complementary name=Contact_Info；endpoint: [读] `GET /v1/omnichannel/contacts.get`；persist: [读] URL `tab=contact-profile` | `useContactProfileRoomAction.ts:8-15` | `ContactInfoRouter` | `ui.ts:49` |
| room.toolbox.discussions | 打开讨论列表侧栏 | `房间头→工具栏→Discussions` | setting `Discussion_enabled` 且 `!room.prid` `useDiscussionsRoomAction.ts:14,18-19`；federated disabled | DOM: [待渲染实测] complementary name=Discussions；endpoint: [读] `GET /v1/chat.getDiscussions`；persist: [读] URL `tab=discussions` | `useDiscussionsRoomAction.ts:22-34` | `Discussions` | `ui.ts:50` |
| room.toolbox.e2e | 开关房间端到端加密（弹窗，无 tab） | `房间头→工具栏→Enable_E2E_encryption` 或 `Disable_E2E_encryption`；常在 Options（type=organization） | setting `E2E_Enable` + (`room.t==='d'` 或 (`edit-room` 且 `toggle-room-e2e-encryption`)) 且 E2EE ready/`room.encrypted` `useE2EERoomAction.ts:17-26,94-95`；groups 无 channel；federated disabled | DOM: [待渲染实测] dialog Enable/Disable E2EE 出现，确认后关闭且标题在 Enable/Disable 间切换；endpoint: [读] `POST /v1/rooms.saveRoomSettings` `{rid,encrypted}` `:45,74`；persist: [读] `room.encrypted` 服务端字段，刷新后图标/标题仍对 | `useE2EERoomAction.ts:98-109` | 无 tabComponent；`RoomHeader` Encrypted 徽章 | `ui.ts:51` |
| room.toolbox.export-messages | 打开导出消息侧栏 | `房间头→工具栏→Options→Export_Messages` | permission `mail-messages` `useExportMessagesRoomAction.ts:11,14-15` | DOM: [待渲染实测] complementary name=Export_Messages；endpoint: [读] 提交 `POST /v1/rooms.export`；persist: [读] URL tab；导出产物在服务端，刷新后表单空 [待渲染实测] | `useExportMessagesRoomAction.ts:18-28` | `ExportMessages` | `ui.ts:52` |
| room.toolbox.game-center | 打开 Game Center 侧栏 | `房间头→工具栏→Apps_Game_Center`（order=-1 靠前） | `GET /apps/externalComponents` 成功且 length>0 `useGameCenterRoomAction.ts:9-14` | DOM: [待渲染实测] complementary name=Apps_Game_Center；endpoint: [读] `GET /apps/externalComponents`；persist: [读] URL `tab=game-center` | `useGameCenterRoomAction.ts:17-24` | `GameCenter` | `ui.ts:53` |
| room.toolbox.banned-users | 打开房间封禁用户列表 | `房间头→工具栏→Options→Banned_Users` | permission `ban-user` `useBannedUsersRoomAction.ts:12,15-16`；groups∈{channel,group,team} | DOM: [待渲染实测] complementary name=Banned_Users；endpoint: [读] `GET /v1/rooms.bannedUsers`，解封 `POST /v1/rooms.unbanUser`；persist: [读] URL tab + 封禁记录刷新仍在 | `useBannedUsersRoomAction.ts:19-27` | `BannedUsers` | `ui.ts:54` |
| room.toolbox.members-list | 打开频道/组/团队成员列表 | `房间头→工具栏→Members` 或 `Teams_members` | broadcast 需 `view-broadcast-member-list`；非原生 federation 隐藏 `useMembersListRoomAction.ts:13-24` | DOM: [待渲染实测] complementary name=Members/Teams_members；endpoint: [读] `GET /v1/rooms.membersOrderedByRole`；persist: [读] URL `tab=members-list` | `useMembersListRoomAction.ts:27-34` | `MemberListRouter` | `ui.ts:55` |
| room.toolbox.mentions | 打开本房间提及消息列表 | `房间头→工具栏→Mentions` | hook: none `useMentionsRoomAction.ts:6-18`；groups∈{channel,group,team} | DOM: [待渲染实测] complementary name=Mentions；endpoint: [读] `GET /v1/chat.getMentionedMessages` `MentionsTab.tsx`；persist: [读] URL `tab=mentions` | `useMentionsRoomAction.ts:8-16` | `MentionsTab` | `ui.ts:56` |
| room.toolbox.omnichannel-external-frame | 打开 Omnichannel 外部 iframe 侧栏 | live `房间头→工具栏→Omnichannel_External_Frame` | setting `Omnichannel_External_Frame_Enabled` `useOmnichannelExternalFrameRoomAction.ts:8,11-12` | DOM: [待渲染实测] complementary 内 iframe 出现；endpoint: [读] 无 REST 拉内容，iframe 打开 `Omnichannel_External_Frame_URL`；persist: [读] URL `tab=omnichannel-external-frame` | `useOmnichannelExternalFrameRoomAction.ts:15-22` | `ExternalFrameContainer` | `ui.ts:57` |
| room.toolbox.outlook-calendar | 打开 Outlook 日历事件侧栏 | `房间头→工具栏→Outlook_calendar`（order=999） | setting `Outlook_Calendar_Enabled` `useOutlookCalenderRoomAction.ts:8,11-12`；groups∈{channel,group,team} | DOM: [待渲染实测] complementary name=Outlook_calendar；endpoint: [读] `GET /v1/calendar-events.list`；persist: [读] URL `tab=outlookCalendar` | `useOutlookCalenderRoomAction.ts:15-22` | `OutlookEventsRoute` | `ui.ts:58` |
| room.toolbox.pinned-messages | 打开置顶消息列表 | `房间头→工具栏→Pinned_Messages` | setting `Message_AllowPinning` `usePinnedMessagesRoomAction.ts:14,18-19`；federated disabled | DOM: [待渲染实测] complementary name=Pinned_Messages；endpoint: [读] `GET /v1/chat.getPinnedMessages`；persist: [读] URL `tab=pinned-messages` | `usePinnedMessagesRoomAction.ts:22-34` | `PinnedMessagesTab` | `ui.ts:59` |
| room.toolbox.push-notifications | 打开本房间通知偏好 | `房间头→工具栏→Notifications_Preferences` | 必须有 subscription `usePushNotificationsRoomAction.ts:9-14` | DOM: [待渲染实测] complementary name=Notifications_Preferences；endpoint: [读] 打开用 subscription；保存 `POST /v1/rooms.saveNotification`；persist: [读] URL tab + 偏好刷新仍在 | `usePushNotificationsRoomAction.ts:17-25` | `NotificationPreferences` | `ui.ts:60` |
| room.toolbox.rocket-search | 打开房间内消息搜索侧栏 | `房间头→工具栏→Search_Messages` | hook: none `useRocketSearchRoomAction.ts:6-17`（含 live） | DOM: [待渲染实测] complementary name=Search_Messages + 搜索框；endpoint: [读] Meteor `rocketchatSearch.getProvider` / `rocketchatSearch.search`；persist: [读] URL `tab=rocket-search`；查询串刷新是否保留 [待渲染实测] | `useRocketSearchRoomAction.ts:8-15` | `MessageSearchTab` | `ui.ts:61` |
| room.toolbox.room-info | 打开 livechat 会话信息 | live `房间头→工具栏→Room_Info`；兼 `房间头→房间标题`（t=l） | hook: none `useRoomInfoRoomAction.ts:6-17`；groups∈{live} | DOM: [待渲染实测] complementary name=Room_Info；endpoint: [读] `GET /v1/rooms.info` + `GET /v1/livechat/visitors.info`；persist: [读] URL `tab=room-info` | `useRoomInfoRoomAction.ts:8-15` | `ChatsContextualBar` | `ui.ts:62` |
| room.toolbox.starred-messages | 打开星标消息列表 | `房间头→工具栏→Starred_Messages` | hook: none `useStarredMessagesRoomAction.ts:6-18` | DOM: [待渲染实测] complementary name=Starred_Messages；endpoint: [读] `GET /v1/chat.getStarredMessages`；persist: [读] URL `tab=starred-messages` | `useStarredMessagesRoomAction.ts:8-16` | `StarredMessagesTab` | `ui.ts:63` |
| room.toolbox.team-channels | 打开团队频道列表 | team `房间头→工具栏→Team_Channels` | hook: none `useTeamChannelsRoomAction.ts:6-18`；groups∈{team} | DOM: [待渲染实测] complementary name=Team_Channels；endpoint: [读] `GET /v1/teams.listRooms`；persist: [读] URL `tab=team-channels` | `useTeamChannelsRoomAction.ts:8-16` | `TeamsChannels` | `ui.ts:64` |
| room.toolbox.uploaded-files-list | 打开房间文件列表 | `房间头→工具栏→Files` | hook: none `useUploadedFilesListRoomAction.ts:6-17`（含 live） | DOM: [待渲染实测] complementary name=Files；endpoint: [读] `GET /v1/channels.files` 或 `/v1/groups.files` 或 `/v1/im.files`；persist: [读] URL `tab=uploaded-files-list` | `useUploadedFilesListRoomAction.ts:8-16` | `RoomFiles` | `ui.ts:65` |
| room.toolbox.ai-actions | Apps-Engine AI 类房间动作聚合菜单（featured） | `房间头→工具栏→AI_Actions`（stars 图标）；子项再点 app 标签 | `GET /apps/actionButtons` 且 `useApplyButtonFilters('ai')` 非空 `useAppsRoomStarActions.tsx:16-30` | DOM: [待渲染实测] menu AI_Actions 展开，子项出现；endpoint: [读] 列表 `GET /apps/actionButtons`，点击 `POST /apps/ui.interaction/${appId}`；persist: [读] 按钮清单随 app 安装刷新仍在；单次 interaction 不持久 [待渲染实测] | `useAppsRoomStarActions.tsx:33-40` | featured `GenericMenu` | `ui.ts:66` |
| room.toolbox.start-video-call | 从房间头发起视频会议（featured，无 tab） | `房间头→工具栏→Video_call` | `call-management` + 对应 `VideoConf_Enable_DMs/Channels/Teams/Groups` 或 `Omnichannel_call_provider==='default-provider'`；非自己单人 DM；非 muted；federated/readonly/archived 则 disabled `useVideoCallRoomAction.ts:34-53,70-71` | DOM: [待渲染实测] Video_call 按钮出现，点击后 outgoing 弹层出现；endpoint: [读] `GET /v1/video-conference.capabilities` 后 `POST /v1/video-conference.start`；persist: [读] 会议记录在 Calls 列表刷新可见 [待渲染实测] | `useVideoCallRoomAction.ts:74-84` | featured 工具栏 | `ui.ts:67` |
| room.toolbox.start-voice-call | 从 1:1 DM 头发起/结束语音（featured，无 tab） | 1:1 DM `房间头→工具栏→Voice_call__user_`（文案动态） | 恰好一个 peer；voip 非 `unavailable`；非 blocked/blocker；非 federated `useMediaCallRoomAction.ts:35,55-59` | DOM: [待渲染实测] phone 按钮出现，点击 voip widget 出现/挂断后消失；endpoint: [读] 预取 `GET /v1/users.info` `useUserInfoQuery.ts:12`；widget 信令另计；persist: [读] 通话结束后 Call_history 可重放 [待渲染实测] | `useMediaCallRoomAction.ts:64-71` | featured；另见 `nav.voip.call` | `ui.ts:68` |
| room.apps.toolbox-inject | Apps-Engine 向房间工具箱注入非 AI `roomAction` 按钮 | `房间头→工具栏→Options` 下 Apps 分段（`type=apps` 永不进前 6） | `GET /apps/actionButtons` context=`roomAction` + `useApplyButtonFilters()`（roles/permissions/roomTypes）`useAppsRoomActions.ts:14-16,21` | DOM: [待渲染实测] Options→Apps 下出现 app 标签；endpoint: [读] 列表 `GET /apps/actionButtons`，点击 `POST /apps/ui.interaction/${appId}` `useAppsRoomActions.ts:34-40`；persist: [读] 安装 app 后刷新仍在；无 app 则整段不出现 | `useAppsRoomActions.ts:21-54` | `RoomToolboxProvider.tsx:72,83` | `useAppsRoomActions.ts:14` |

本表数据行：**30**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 B — Room header chrome（非 roomActionHooks，但是同一 Header 表面）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.header.title-open-info | 点房间标题打开对应 info tab | `房间头→房间标题按钮(aria-label=房间名)` | none（标题始终可点）`RoomTitle.tsx:39-43`；目标 tab 仍受该 tab 自身 groups 约束 | DOM: [待渲染实测] 标题为 button，点击后与 toolbox 同一 complementary 出现；endpoint: [读] 无独立请求，转 `openTab`；persist: [读] 写入 URL tab（team-info / room-info / user-info-group / user-info / channel-settings）`RoomTitle.tsx:17-34` | `RoomTitle.tsx:17-34` | 复用表 A 对应 tab | `RoomHeader.tsx:45` |
| room.header.favorite | 星标/取消星标当前房间 | `房间头→star/star-filled（title=Favorite/Unfavorite {name}）` | 已订阅 + setting `Favorite_Rooms` + `room.t ∈ {c,p,d,t}` `Favorite.tsx:16,29-30` | DOM: [待渲染实测] HeaderState 星标出现，点击后 filled/outline 与 title 在 Favorite/Unfavorite 间切换；endpoint: [读] `POST /v1/rooms.favorite` `useToggleFavoriteMutation.ts:14,19`；persist: [读] subscription.`f`，刷新后星标状态仍在 | `Favorite.tsx:19-25` | 侧栏 Favorites 分组 | `RoomHeader.tsx:46` |
| room.header.topic-add | 无主题且可编辑时点「添加主题」进编辑 | `房间头→Add_topic 链接` | `useCanEditRoom`=`edit-room`（federated 另需 Federation.isEditableByTheUser）且 public/private `RoomTopic.tsx:15,22`；`useCanEditRoom.ts:12-15`。已有 topic 只读，不进本行 | DOM: [待渲染实测] link name=Add_topic 出现，点击后 channel-settings 或 team-info 侧栏出现；endpoint: [读] 导航无请求，保存走房间设置 POST；persist: [读] href 含 tab 路径 `RoomTopic.tsx:19,30` | `RoomTopic.tsx:28-33` | `room.toolbox.channel-settings` / `team-info` | `RoomHeader.tsx:50` |

本表数据行：**3**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 C — User card / UserInfo（`user.*`）

共享：`useUserInfoActions` 14 hook 合成后按 `size` 切 featured vs kebab（UserCard size=3 `UserCardWithData.tsx:75-88`；UserInfo size=2；成员行 size=0 全进 kebab）。无 Apps-Engine user-card 注入（`UIActionButtonContext` 无该 context）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| user.card.open | 打开用户资料气泡卡片 | 消息头像 / 显示名 / @提及 → 卡片；线程头像；系统消息名（头像不可点） | none 于 `openUserCard(e,username)`；embedded 仍可开卡 | DOM: [待渲染实测] dialog name=User_card 出现；关：`Close` 或点外部消失；endpoint: [读] `GET /v1/users.info` `useUserInfoQuery.ts:12` + `GET /v1/rooms.isMember`；persist: [读] 卡片是 popover，刷新关闭 | `UserCardProvider` + `UserCardWithData.tsx:30` | `UserCard.tsx:52` | `UserCardWithData.tsx:25` |
| user.card.see-full-profile | 从卡片进入完整 UserInfo 侧栏 | `…→User_card→See_full_profile` | `!embedded` `UserCard.tsx:93` | DOM: [待渲染实测] User_card 消失，UserInfo complementary 出现；endpoint: [读] 再取 `GET /v1/users.info`；persist: [读] URL tab=members-list 或 user-info 或 user-info-group 或 room-info + username | `UserCardWithData.tsx:70-73` | 表 A members/user-info | `UserCard.tsx:95-96` |
| user.action.direct-message | 对目标用户开/跳转 DM | `User_card 或 UserInfo → Direct_Message`；溢出 `…→More→Direct_Message` | `create-d` 或已有同名 subscription；且 `!embedded` `useUserInfoActions.ts:95`；`useDirectMessageAction.ts:14-16` | DOM: [待渲染实测] 进入 1:1 房间，卡片关闭；endpoint: [读] 路由 `direct`（已有房间无 create）；persist: [读] 订阅刷新后侧栏仍有该 DM | `useDirectMessageAction.ts:18-23` | 卡片/侧栏/成员 kebab | `useUserInfoActions.ts:95` |
| user.action.video-call | 从资料面对该用户发起视频 | `User_card/UserInfo → Video_call`（常为前 2–3 个图标） | 已有 DM 房间；`!federated`；`user._id!==own`；setting `VideoConf_Enable_DMs`；permission `call-management`；非 ringing/calling `useVideoCallAction.ts:36-38,54-55` | DOM: [待渲染实测] 卡片关闭，outgoing video 弹层出现；endpoint: [读] capabilities + `POST /v1/video-conference.start`；persist: [读] Calls 列表刷新可见 [待渲染实测] | `useVideoCallAction.ts:39-60` | 与 `room.toolbox.start-video-call` 同栈 | `useUserInfoActions.ts:96` |
| user.action.voice-call | 从资料面对该用户发起语音 | `User_card/UserInfo → Voice_call__user_` | voip≠unavailable；非 federated；非 block；`user._id!==own` `useUserMediaCallAction.ts:22-38`；state≠available 时 disabled | DOM: [待渲染实测] 卡片关闭，voip widget 出现；endpoint: [读] 本 hook 无 REST，toggleWidget；persist: [读] 通话记录 [待渲染实测] | `useUserMediaCallAction.ts:42-54` | `room.toolbox.start-voice-call` | `useUserInfoActions.ts:97` |
| user.action.add-to-room | 把非成员加进当前房间 | `User_card/UserInfo → add-to-room`（仅 !isMember） | `!isMember`；`roomCanInvite`；`add-user-to-any-c-room` 或 `add-user-to-any-p-room` 或 `add-user-to-joined-room`；非 archived；非 blocked federation `useAddUserAction.ts:42-56` | DOM: [待渲染实测] 成功 toast User_added，该动作被 owner/mute 等替换；endpoint: [读] `POST /v1/channels.invite` 或 `/v1/groups.invite` `:20-23,58`；persist: [读] 成员列表刷新仍在 | `useAddUserAction.ts` | 仅非成员 | `useUserInfoActions.ts:98` |
| user.action.change-owner | 授予/撤销房间 owner | `User_card/UserInfo → More → Set_as_owner/Remove_as_owner` | `isMember`；`roomCanSetOwner`；非联邦需 `set-owner` `useChangeOwnerAction.tsx:54,66` | DOM: [待渲染实测] 文案在 Set/Remove 间切换；联邦先 warning dialog；endpoint: [读] `POST /v1/channels.addOwner` 或 `removeOwner` 或 groups 对应 `:43-48`；persist: [读] 房间角色刷新仍在 | `useChangeOwnerAction.tsx` | privileges 段 | `useUserInfoActions.ts:99` |
| user.action.change-leader | 授予/撤销房间 leader | `…→More→Set_as_leader/Remove_as_leader` | `isMember`；`roomCanSetLeader`；`set-leader` `useChangeLeaderAction.ts:29,37` | DOM: [待渲染实测] 文案切换；endpoint: [读] `POST /v1/channels.addLeader` 或 `removeLeader` 或 groups `:18-23`；persist: [读] 角色刷新仍在 | `useChangeLeaderAction.ts` | privileges | `useUserInfoActions.ts:100` |
| user.action.change-moderator | 授予/撤销房间 moderator | `…→More→Set_as_moderator/Remove_as_moderator` | `isMember`；`roomCanSetModerator`；非联邦 `set-moderator` `useChangeModeratorAction.tsx` | DOM: [待渲染实测] 文案切换；联邦 warning dialog；endpoint: [读] `POST /v1/channels.*Moderator` 或 groups；persist: [读] 角色刷新仍在 | `useChangeModeratorAction.tsx` | privileges | `useUserInfoActions.ts:101` |
| user.action.moderation-console | 跳到该用户的审核控制台 | `…→More→Moderation_Action_View_reports` | `isMember`；permission `view-moderation-console` `useRedirectModerationConsole.ts:9-14` | DOM: [待渲染实测] 离开房间进入 moderation-console；endpoint: [读] 路由 `moderation-console?uid=`；persist: [读] URL 刷新仍在该用户审核页 | `useRedirectModerationConsole.ts:17-26` | 管理后台审核 | `useUserInfoActions.ts:102` |
| user.action.ignore | 忽略/取消忽略该成员消息 | `…→More→Ignore/Unignore` | `isMember`；`roomCanIgnore`；`uid!==own` `useIgnoreUserAction.ts:31,48` | DOM: [待渲染实测] 文案 Ignore↔Unignore，被忽略消息样式变 [待渲染实测]；endpoint: [读] `GET /v1/chat.ignoreUser` `{rid,userId,ignore}` `:23,35`；persist: [读] subscription.ignored 刷新仍在 | `useIgnoreUserAction.ts:46-54` | management | `useUserInfoActions.ts:103` |
| user.action.mute | 禁言/解除禁言该成员 | `…→More→Mute_user/Unmute_user` | `isMember`；`roomCanMute`；`mute-user` `useMuteUserAction.tsx:44,61` | DOM: [待渲染实测] Mute 先出 danger dialog，确认后文案切换；endpoint: [读] `POST /v1/rooms.muteUser` 或 `unmuteUser` `:65`；persist: [读] `room.muted` 刷新仍在 | `useMuteUserAction.tsx` | management | `useUserInfoActions.ts:104` |
| user.action.block | 1:1 DM 拉黑/取消拉黑 | `User_card/UserInfo → Block/Unblock` | `roomCanBlock`（仅非群 DM）且 `uid!==own` `useBlockUserAction.ts:28,47`；`direct.ts` 仅 BLOCK | DOM: [待渲染实测] 文案 Block↔Unblock；endpoint: [读] `POST /v1/im.blockUser` `{roomId,block}` `:31-35`；persist: [读] subscription.blocker 刷新仍在 | `useBlockUserAction.ts:45-54` | 无 type 分段 | `useUserInfoActions.ts:105` |
| user.action.remove | 踢出房间/团队或撤销邀请 | `…→More→Remove_from_room 或 Remove_from_team 或 Revoke_invitation` | `isMember 或 isInvited`；`roomCanRemove`；`remove-user` 或联邦可编辑 `useRemoveUserAction.tsx:45-57` | DOM: [待渲染实测] danger dialog 出现，确认后该用户离开成员列表；endpoint: [读] team `POST /v1/teams.removeMember` 否则 `POST /v1/channels.kick` 或 `/v1/groups.kick` `:61,71-72`；persist: [读] 成员刷新不在 | `useRemoveUserAction.tsx` | moderation danger | `useUserInfoActions.ts:106` |
| user.action.ban | 从房间封禁用户 | `…→More→Ban_user_from_room` | `isMember 或 isInvited`；`ban-user` + `roomCanBan` `useBanUserAction.ts:25-33` | DOM: [待渲染实测] danger dialog 确认后成员消失，Banned_Users 出现该人；endpoint: [读] `POST /v1/rooms.banUser` `useBanUser.tsx`；persist: [读] 封禁列表刷新仍在 | `useBanUserAction.ts:31-42` | `room.toolbox.banned-users` | `useUserInfoActions.ts:107` |
| user.action.report | 举报用户 | `…→More→Report` | `ownUserId!==uid` `useReportUser.tsx:44`；无房间/权限键 | DOM: [待渲染实测] dialog Report_User 出现，提交后关闭+toast Report_has_been_sent；endpoint: [读] `POST /v1/moderation.reportUser` `:20-25`；persist: [读] 审核记录刷新仍在（需 `view-moderation-console` 查看） | `useReportUser.tsx:33-50` | moderation danger | `useUserInfoActions.ts:108` |

本表数据行：**16**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 D — Navbar（`nav.*`）

顶栏三段：Pages / Navigation / Controls（`NavBar.tsx:12-15`）。mobile 搜索展开时 Pages+Controls 隐藏。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nav.sidebar.toggle | 折叠/展开主侧栏 | `顶栏左→汉堡 SidebarToggler` | `sidebar.shouldToggle`：V2=tablet 或 mobile，V1=仅 mobile `LayoutProvider.tsx:35-36`；`NavBarPagesSection.tsx:12` | DOM: [待渲染实测] 侧栏消失/出现；endpoint: none `LayoutProvider.tsx:73` 仅 React state；persist: [读] **刷新不持久**（useState） | `SidebarToggler` | V1/V2 侧栏 | `NavBarPagesSection.tsx:12-16` |
| nav.pages.home | 打开 Home 并 toggle 侧栏 | desktop `顶栏左→Home`；tablet `顶栏左→Pages→Home` | setting `Layout_Show_Home_Button` `NavBarItemHomePage.tsx:11,20` | DOM: [待渲染实测] Home 页出现，Home 按钮 pressed；endpoint: [读] 客户端 `navigate('/home')`；persist: [读] URL `/home` | `NavBarItemHomePage.tsx:12-14` | `nav.pages.stack` | `NavBarPagesGroup.tsx:25` |
| nav.pages.directory | 打开人员/频道/团队目录 | desktop `顶栏左→Directory`；tablet `顶栏左→Pages→Directory` | none `NavBarItemDirectoryPage.tsx:8-25` | DOM: [待渲染实测] Directory 页+Users/Channels/Teams tabs；endpoint: [读] 目录各 tab 自有 REST（本行只到入口）；persist: [读] URL `/directory`，默认 tab=`Accounts_Directory_DefaultView` | `NavBarItemDirectoryPage.tsx:10-12` | 目录内部 field-level 域外 | `NavBarPagesGroup.tsx:26` |
| nav.pages.stack | tablet 把 Home+Directory 收进 Pages 菜单 | `顶栏左→Pages(stack)` | `isTablet` `NavBarPagesGroup.tsx:22`；Home 子项另需 `Layout_Show_Home_Button` | DOM: [待渲染实测] menu Pages 出现 Home/Directory；endpoint: 同对应子项；persist: 同子项 | `NavBarPagesStackMenu.tsx:26-42` | home/directory | `NavBarPagesGroup.tsx:22` |
| nav.marketplace.explore | 进入 Marketplace 浏览 | `顶栏左→Marketplace→Explore` | `access-marketplace` OR `manage-apps`，且 `!isMobile` `NavBarPagesGroup.tsx:16-29`；`useMarketPlaceMenu.tsx:10-13` | DOM: [待渲染实测] Marketplace Explore 列表；endpoint: [读] 市场列表 REST（域外展开）；persist: [读] URL `/marketplace/explore/list` | `useMarketPlaceMenu.tsx:19-25` | 市场侧栏 6 项 | `NavBarItemMarketPlaceMenu.tsx:20` |
| nav.marketplace.installed | 进入已安装应用列表 | `顶栏左→Marketplace→Installed` | 同上 marketplace 权限 | DOM: [待渲染实测] Installed 列表；endpoint: [读] 已安装 apps API；persist: [读] URL `/marketplace/installed/list` | `useMarketPlaceMenu.tsx:26-31` | 市场侧栏 | `useMarketPlaceMenu.tsx:27` |
| nav.marketplace.requested | 进入待审批应用 | `顶栏左→Marketplace→Requested` | permission `manage-apps` `useMarketPlaceMenu.tsx:34-49` | DOM: [待渲染实测] Requested 列表，未读 badge 可能出现；endpoint: [读] app request stats；persist: [读] URL `/marketplace/requested/list` | `useMarketPlaceMenu.tsx:34-49` | 仅管理员 | `useMarketPlaceMenu.tsx:35` |
| nav.sort.display.extended | 侧栏扩展行高 | `顶栏左→Display→Display→Extended` | `!isMobile` 才有 Sort 按钮 `NavBarPagesGroup.tsx:30`；**整段 Display 仅 secondarySidebar OFF** `useSortMenu.ts:18` | DOM: [待渲染实测] Extended 单选勾上，房间行变高；endpoint: [读] `POST /v1/users.setPreferences` `{sidebarViewMode:extended}` `useViewModeItems.tsx:10-13`；persist: [读] 用户偏好刷新仍在 | `useViewModeItems.tsx:28-34` | V1 侧栏 | `useViewModeItems.tsx:29` |
| nav.sort.display.medium | 侧栏中等行高 | `顶栏左→Display→Display→Medium` | 同上 Display 段 | DOM: [待渲染实测] Medium 勾上；endpoint: [读] `POST /v1/users.setPreferences` `{sidebarViewMode:medium}`；persist: [读] 偏好刷新仍在 | `useViewModeItems.tsx:35-41` | V1 | `useViewModeItems.tsx:36` |
| nav.sort.display.condensed | 侧栏紧凑行高 | `顶栏左→Display→Display→Condensed` | 同上 | DOM: [待渲染实测] Condensed 勾上；endpoint: [读] `{sidebarViewMode:condensed}`；persist: [读] 偏好刷新仍在 | `useViewModeItems.tsx:42-48` | V1 | `useViewModeItems.tsx:43` |
| nav.sort.display.avatars | 开关侧栏头像 | `顶栏左→Display→Display→Avatars` | 同上 Display 段 | DOM: [待渲染实测] Avatars 开关切换，行内头像出现/消失；endpoint: [读] `{sidebarDisplayAvatar:bool}` `useViewModeItems.tsx:22-24`；persist: [读] 偏好刷新仍在 | `useViewModeItems.tsx:49-55` | V1 | `useViewModeItems.tsx:50` |
| nav.sort.by.activity | 房间列表按活跃度排 | `顶栏左→Display→Sort_By→Activity` | `!isMobile`；none 于选项本身 `useSortModeItems.tsx:25-33` | DOM: [待渲染实测] Activity 单选勾上，列表重排；endpoint: [读] `POST /v1/users.setPreferences` `{sidebarSortby:activity}`；persist: [读] 偏好刷新仍在 | `useSortModeItems.tsx:26-33` | Omni disclaimer 仅描述 | `useSortModeItems.tsx:27` |
| nav.sort.by.name | 房间列表按名称排 | `顶栏左→Display→Sort_By→Name` | none 于选项 `useSortModeItems.tsx:34-41` | DOM: [待渲染实测] Name 勾上；endpoint: [读] `{sidebarSortby:alphabetical}`；persist: [读] 偏好刷新仍在 | `useSortModeItems.tsx:34-41` | | `useSortModeItems.tsx:35` |
| nav.sort.group.unread | 侧栏按未读分组 | `顶栏左→Display→Group_by→Unread` | none `useGroupingListItems.tsx:25-31` | DOM: [待渲染实测] Unread 勾选，Unread 组头出现/消失；endpoint: [读] `{sidebarShowUnread:bool}`；persist: [读] 偏好刷新仍在 | `useGroupingListItems.tsx:25-31` | `sidebar.group.collapse` | `useGroupingListItems.tsx:26` |
| nav.sort.group.favorites | 侧栏按收藏分组 | `顶栏左→Display→Group_by→Favorites` | **secondarySidebar OFF** 才渲染 `useGroupingListItems.tsx:32-38` | DOM: [待渲染实测] Favorites 组出现/消失；endpoint: [读] `{sidebarShowFavorites:bool}`；persist: [读] 偏好刷新仍在 | `useGroupingListItems.tsx:32-38` | `room.header.favorite` | `useGroupingListItems.tsx:33` |
| nav.sort.group.types | 侧栏按房间类型分组 | `顶栏左→Display→Group_by→Types` | none `useGroupingListItems.tsx:39-45` | DOM: [待渲染实测] Types 组头出现/消失；endpoint: [读] `{sidebarGroupByType:bool}`；persist: [读] 偏好刷新仍在 | `useGroupingListItems.tsx:39-45` | | `useGroupingListItems.tsx:40` |
| nav.create.dm | 打开创建私聊模态 | `顶栏左→Create_new→Direct_message` | permission `create-d` `useCreateNewItems.ts:14,23,73` | DOM: [待渲染实测] dialog CreateDirectMessage 出现；endpoint: [读] 提交后创建 DM（模态内 REST）；persist: [读] 新 DM 刷新后在侧栏 | `useCreateNewItems.ts:49-56` | | `useCreateNewItems.ts:50` |
| nav.create.discussion | 打开创建讨论模态 | `顶栏左→Create_new→Discussion` | `start-discussion` OR `start-discussion-other-user` + setting `Discussion_enabled` `useCreateNewItems.ts:15,19,24,74` | DOM: [待渲染实测] dialog CreateDiscussion；endpoint: [读] 讨论创建 API；persist: [读] 新讨论刷新仍在 | `useCreateNewItems.ts:57-64` | `room.toolbox.discussions` | `useCreateNewItems.ts:58` |
| nav.create.channel | 打开创建频道模态 | `顶栏左→Create_new→Channel` | `create-c` OR `create-p` `useCreateNewItems.ts:12,21,75` | DOM: [待渲染实测] dialog CreateChannelModal；endpoint: [读] channels/groups create；persist: [读] 新房间刷新仍在 | `useCreateNewItems.ts:33-40` | | `useCreateNewItems.ts:34` |
| nav.create.team | 打开创建团队模态 | `顶栏左→Create_new→Team` | `create-team` AND (`create-c` 或 `create-p`) `useCreateNewItems.ts:13,22,76` | DOM: [待渲染实测] dialog CreateTeamModal；endpoint: [读] teams.create；persist: [读] 新团队刷新仍在 | `useCreateNewItems.ts:41-48` | | `useCreateNewItems.ts:42` |
| nav.create.outbound | 打开外呼消息向导 | `顶栏左→Create_new→Outbound_message` | omnichannel enabled；若同时有 license `livechat-enterprise`+`outbound-messaging` 则还需 `outbound.send-messages`，否则放宽为 true `useOutboundMessageAccess.ts:6-20` | DOM: [待渲染实测] outbound wizard modal；endpoint: [读] 向导内 omnichannel REST（域外）；persist: [读] 发出消息刷新仍在 [待渲染实测] | `useCreateNewItems.ts:65-70` | Omni 入口级 | `useCreateNewItems.ts:66` |
| nav.search.rooms | 顶栏搜索房间/用户并跳转 | `顶栏中→Search_rooms`（可 Ctrl/Cmd+K/P） | `aiSearch` preview OFF `NavBarNavigation.tsx:19-21`；输入 none | DOM: [待渲染实测] listbox overlay 出现，选中行后关闭并进房间；endpoint: [读] `GET /v1/spotlight`（debounce）`useSearchItems.ts`；persist: [读] 导航 URL 刷新仍在目标房间；搜索框清空 | `NavBarSearch.tsx` | | `NavBarNavigation.tsx:20` |
| nav.search.ai | AI 增强顶栏搜索 | `顶栏中→Search_rooms_or_ask_AI` | preview `aiSearch` ON；AI 按钮另需 license `AI_LICENSE_MODULE` + setting `AI_Intelligent_Search_Enabled` `useNavBarAISearch.ts` | DOM: [待渲染实测] AI listbox/chips 出现；endpoint: [读] spotlight + AI search package；persist: [读] 导航持久，AI 会话刷新 [待渲染实测] | `NavBarAISearch.tsx` | | `NavBarNavigation.tsx:22-24` |
| nav.history.back | 路由后退 | `顶栏中→Back_in_history` | `!isMobile` `NavBarNavigation.tsx:27` | DOM: [待渲染实测] 上一页出现；endpoint: none `navigate(-1)`；persist: [读] 浏览器历史 | `NavBarNavigation.tsx:30` | | `NavBarNavigation.tsx:30` |
| nav.history.forward | 路由前进 | `顶栏中→Forward_in_history` | `!isMobile` | DOM: [待渲染实测] 下一页出现；endpoint: none `navigate(1)`；persist: [读] 浏览器历史 | `NavBarNavigation.tsx:31` | | `NavBarNavigation.tsx:31` |
| nav.manage.workspace | 进入管理后台 | `顶栏右→Manage→Workspace` | `useAtLeastOnePermission(ADMIN_PERMISSIONS)` 25 键含 `view-statistics`…`view-moderation-console` `useAdministrationMenu.ts:5-31,37` | DOM: [待渲染实测] Admin 二级侧栏+Workspace；endpoint: [读] `/admin` 后续 admin REST（域外）；persist: [读] URL `/admin` | `useAdministrationMenu.ts:40-44` | Admin 22 个 href | `useAdministrationMenu.ts:41` |
| nav.manage.omnichannel | 进入 Omnichannel 管理 | `顶栏右→Manage→Omnichannel` | permission `view-livechat-manager` `useAdministrationMenu.ts:38,45-49` | DOM: [待渲染实测] Omnichannel 二级侧栏；endpoint: [读] `/omnichannel`；persist: [读] URL `/omnichannel` | `useAdministrationMenu.ts:45-49` | Omni 13 个 href | `useAdministrationMenu.ts:46` |
| nav.audit.messages | 打开消息审计 | `顶栏右→Manage→Audit→Messages` | license `auditing` + permission `can-audit` `useAuditMenu.ts:11-13,37` | DOM: [待渲染实测] Audit Messages 页；endpoint: [读] `/audit`；persist: [读] URL `/audit` | `useAuditMenu.ts:16-20` | EE 审计 | `useAuditMenu.ts:17` |
| nav.audit.logs | 打开审计日志 | `顶栏右→Manage→Audit→Logs` | license `auditing` + `can-audit-log` `useAuditMenu.ts:14,38` | DOM: [待渲染实测] Audit Logs 页；endpoint: [读] `/audit-log`；persist: [读] URL `/audit-log` | `useAuditMenu.ts:22-26` | | `useAuditMenu.ts:23` |
| nav.audit.security | 打开安全日志 | `顶栏右→Manage→Audit→Security_logs` | license `auditing` + `can-audit` `useAuditMenu.ts:13,39` | DOM: [待渲染实测] Security logs 页；endpoint: [读] `/security-logs`；persist: [读] URL `/security-logs` | `useAuditMenu.ts:28-32` | | `useAuditMenu.ts:29` |
| nav.user.status.online | 把在线状态设为 online | `顶栏右→User_menu→Status→Online` | 已登录；`Presence_broadcast_disabled` 时改走 disabled 提示 `useStatusItems.tsx:53` | DOM: [待渲染实测] Online 勾上，头像状态点变绿；endpoint: [读] `POST /v1/users.setStatus` `useStatusItems.tsx:57`；persist: [读] 用户 status 刷新仍在 | `useStatusItems.tsx` | | `useUserMenu.tsx:46-48` |
| nav.user.status.away | 把在线状态设为 away | `顶栏右→User_menu→Status→Away` | 同上 | DOM: [待渲染实测] Away 勾上；endpoint: [读] `POST /v1/users.setStatus`；persist: [读] status 刷新仍在 | `useStatusItems.tsx` | | `useUserMenu.tsx:46-48` |
| nav.user.status.busy | 把在线状态设为 busy | `顶栏右→User_menu→Status→Busy` | 同上 | DOM: [待渲染实测] Busy 勾上；endpoint: [读] `POST /v1/users.setStatus`；persist: [读] status 刷新仍在 | `useStatusItems.tsx` | | `useUserMenu.tsx:46-48` |
| nav.user.status.offline | 把在线状态设为不可见/offline | `顶栏右→User_menu→Status→Offline` | setting `Accounts_AllowInvisibleStatusOption` `useStatusItems.tsx:24` | DOM: [待渲染实测] Offline 勾上；endpoint: [读] `POST /v1/users.setStatus`；persist: [读] status 刷新仍在 | `useStatusItems.tsx` | | `useUserMenu.tsx:46-48` |
| nav.user.status.custom-edit | 编辑自定义状态文案 | `顶栏右→User_menu→Status→(自定义编辑项)` | setting `Accounts_AllowUserStatusMessageChange` `useStatusItems.tsx:54` | DOM: [待渲染实测] EditStatusModal 出现；endpoint: [读] 保存走 `POST /v1/users.setStatus`；列表预取 `GET /v1/custom-user-status.list` `:28`；persist: [读] statusText 刷新仍在 | `useCustomStatusModalHandler` | | `useStatusItems.tsx:54` |
| nav.user.status.visibility | 配置状态对谁可见 | `顶栏右→User_menu→Status→(visibility)` | setting `Accounts_StatusVisibility_Enabled` `useStatusItems.tsx` | DOM: [待渲染实测] EditStatusVisibilityModal；endpoint: [读] 偏好/可见性写入 [待渲染实测 具体 path]；persist: [读] 刷新后对他人隐藏规则仍在 [待渲染实测] | `useStatusVisibilityModalHandler` | | `useStatusItems.tsx` |
| nav.user.account.profile | 打开我的资料 | `顶栏右→User_menu→Account→Profile` | none `useAccountItems.tsx:42-47` | DOM: [待渲染实测] Account Profile 页；endpoint: [读] `/account`；persist: [读] URL `/account` | `useAccountItems.tsx:14-16,42-47` | | `useAccountItems.tsx:43` |
| nav.user.account.preferences | 打开偏好设置 | `顶栏右→User_menu→Account→Preferences` | none `useAccountItems.tsx:48-53` | DOM: [待渲染实测] Preferences 页；endpoint: [读] `/account/preferences`；persist: [读] URL | `useAccountItems.tsx:17-19` | | `useAccountItems.tsx:49` |
| nav.user.account.accessibility | 打开无障碍与外观 | `顶栏右→User_menu→Account→Accessibility_and_Appearance` | none `useAccountItems.tsx:54-59` | DOM: [待渲染实测] Accessibility 页；endpoint: [读] `/account/accessibility-and-appearance`；persist: [读] URL | `useAccountItems.tsx:23-25` | | `useAccountItems.tsx:55` |
| nav.user.account.feature-preview | 打开功能预览（secondarySidebar/aiSearch） | `顶栏右→User_menu→Account→Feature_preview` | setting `Accounts_AllowFeaturePreview` 且 `defaultFeaturesPreview.length>0` `useAccountItems.tsx:12,60` | DOM: [待渲染实测] Feature preview 页，可能有 Unseen_features badge；endpoint: [读] `/account/feature-preview`；persist: [读] URL + 预览开关走用户偏好 | `useAccountItems.tsx:27-39,60` | 布局 V2 / AI 搜索 | `useAccountItems.tsx:28` |
| nav.user.keyboard | 打开键盘快捷键说明 | `顶栏右→User_menu→Keyboard_Shortcuts_Title` | none `useUserMenu.tsx:26-31` | DOM: [待渲染实测] KeyboardShortcutsModal 出现；endpoint: none（纯说明）；persist: [读] 模态刷新关闭 | `useKeyboardShortcutsModalHandler` | 快捷键域外 | `useUserMenu.tsx:54` |
| nav.user.apps-inject | Apps-Engine 注入用户下拉动作 | `顶栏右→User_menu→Apps→{app label}` | `GET /apps/actionButtons` context=`userDropdownAction` 且 filter 通过 `useUserDropdownAppsActionButtons.ts` | DOM: [待渲染实测] Apps 段出现动态项；endpoint: [读] `GET /apps/actionButtons` + `POST /apps/ui.interaction/${appId}`；persist: [读] 安装后刷新仍在 | `useUserDropdownAppsActionButtons.ts` | 与 room.apps 同类扩展面 | `useUserMenu.tsx:18,56` |
| nav.user.logout | 退出登录 | `顶栏右→User_menu→Logout` | none（已登录才有 User_menu）`useUserMenu.tsx:33-38` | DOM: [待渲染实测] 回到登录页，User_menu 被 Login 替换；endpoint: [读] logout/session 清除 `useLogout()`；persist: [读] 刷新仍未登录 | `useUserMenu.tsx:21-24,33-38` | `nav.user.login` | `useUserMenu.tsx:58` |
| nav.user.login | 未登录时强制登录 | `顶栏右→Login` | `!user` `NavBarControlsSection.tsx:26,38` | DOM: [待渲染实测] 登录流出现；endpoint: [读] session `forceLogin=true` `NavBarItemLoginPage.tsx:9-13`；persist: [读] 登录成功后刷新仍在会话 | `NavBarItemLoginPage.tsx:12-15` | | `NavBarItemLoginPage.tsx:13` |
| nav.voip.call | 顶栏发起语音通话 | desktop `顶栏右→Voice_Call→(动态 title)`；mobile `顶栏右→kebab→同项` | `useMediaCallAction()` 有值 `NavBarControlsSection.tsx:18,34` | DOM: [待渲染实测] voip widget 出现；endpoint: [读] voip 栈（同 room voice）；persist: [读] 通话史 [待渲染实测] | `NavBarVoipGroup.tsx:10-21` | `room.toolbox.start-voice-call` | `NavBarVoipGroup.tsx:21` |
| nav.voip.history | 打开通话记录页 | `顶栏右→Voice_Call→Call_history` | 同上，组随 callAction 显隐 `NavBarVoipGroup.tsx:15-17` | DOM: [待渲染实测] Call history 页；endpoint: [读] `/call-history`（页内另有历史 REST）；persist: [读] URL `/call-history` | `NavBarVoipGroup.tsx:12-14,22` | `media-call-history` 房间路由 | `NavBarVoipGroup.tsx:22` |
| nav.omnichannel.queue | 打开 livechat 队列 | `顶栏右→Omnichannel→Queue` | 组：`Livechat_enabled`+`view-l-room`（`useOmnichannelEnabled`）；项：`Livechat_show_queue_list_link`+agent available `useOmnichannelQueueAction.ts:9,15` | DOM: [待渲染实测] queue 页 pressed；endpoint: [读] `/livechat-queue`；persist: [读] URL | `useOmnichannelQueueAction.ts:14-19` | Omni 域外 | `useOmnichannelQueueAction.ts:18` |
| nav.omnichannel.contact | 打开联络中心目录 | `顶栏右→Omnichannel→Contact_Center` | 组级 omnichannel enabled；项 none `useOmnichannelContactAction.ts:10-14` | DOM: [待渲染实测] omnichannel-directory；endpoint: [读] `/omnichannel-directory`；persist: [读] URL | `useOmnichannelContactAction.ts:11-14` | | `useOmnichannelContactAction.ts:13` |
| nav.omnichannel.agent-toggle | 开关自己接听 livechat | `顶栏右→Omnichannel→Turn_on/off_answer_chats` | 组级 omnichannel enabled | DOM: [待渲染实测] 图标/title 在 on/off 间切换；endpoint: [读] `POST /v1/livechat/agent.status` `useOmnichannelLivechatToggle.ts:11-16`；persist: [读] agent 状态刷新仍在 | `useOmnichannelLivechatToggle.ts:22-27` | | `useOmnichannelLivechatToggle.ts:11` |

本表数据行：**49**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 表 E — Sidebar chrome（`sidebar.*`）

V2（`secondarySidebar` ON）才有主栏 filter tabs + 副栏。V1 仅分组房间列表，无本表 filter。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sidebar.filter.all | V2 主栏切到全部会话 | `主侧栏顶 tablist Team_collaboration_filters→All` | preview `secondarySidebar` ON；项 none `TeamCollabFilters.tsx:15` | DOM: [待渲染实测] tab All selected，副栏 tabpanel 列出全部；endpoint: none（本地订阅分组）；persist: [读] localStorage `sidePanelFilters` | `RoomListFiltersItem.tsx:27-41` | `RoomsNavigationContext` | `TeamCollabFilters.tsx:15` |
| sidebar.filter.favorites | V2 主栏切到收藏 | `主侧栏顶→Favorites` | secondarySidebar ON；项 none `TeamCollabFilters.tsx:16` | DOM: [待渲染实测] Favorites tab selected，副栏仅收藏；endpoint: none；persist: [读] localStorage `sidePanelFilters` | `RoomListFiltersItem.tsx` | `room.header.favorite` | `TeamCollabFilters.tsx:16` |
| sidebar.filter.discussions | V2 主栏切到讨论 | `主侧栏顶→Discussions` | secondarySidebar ON + setting `Discussion_enabled` `TeamCollabFilters.tsx:10,17` | DOM: [待渲染实测] Discussions tab 出现且 selected；endpoint: none；persist: [读] localStorage | `TeamCollabFilters.tsx:17` | `nav.create.discussion` | `TeamCollabFilters.tsx:17` |
| sidebar.filter.in-progress | V2 主栏切到进行中 livechat | `主侧栏顶 tablist Omnichannel_filters→In_progress` | secondarySidebar ON + omnichannel enabled + `view-l-room` `OmnichannelFilters.tsx:10,13-15,20` | DOM: [待渲染实测] In_progress selected，副栏进行中会话；endpoint: [读] 页内 livechat 列表 REST；persist: [读] localStorage filter | `OmnichannelFilters.tsx:20` | Omni 入口级 | `OmnichannelFilters.tsx:20` |
| sidebar.filter.queue | V2 主栏切到排队 | `主侧栏顶→Queue` | 上一项 + `view-livechat-queue` `OmnichannelFilters.tsx:11,21` | DOM: [待渲染实测] Queue tab 出现且 selected；endpoint: [读] 队列 REST；persist: [读] localStorage | `OmnichannelFilters.tsx:21` | `nav.omnichannel.queue` | `OmnichannelFilters.tsx:21` |
| sidebar.filter.on-hold | V2 主栏切到挂起 | `主侧栏顶→On_Hold` | `view-l-room` + omnichannel `OmnichannelFilters.tsx:22` | DOM: [待渲染实测] On_Hold selected；endpoint: [读] on-hold REST；persist: [读] localStorage | `OmnichannelFilters.tsx:22` | | `OmnichannelFilters.tsx:22` |
| sidebar.group.collapse | 折叠/展开侧栏分组头 | `主侧栏→(Unread/Teams/Channels/DMs 等组头)` | 分组本身由 Sort Group_by 偏好驱动；折叠控件 none `useCollapsedGroups.ts:6` | DOM: [待渲染实测] 组内房间列表消失/展开；endpoint: none；persist: [读] localStorage `sidebarGroups` `useCollapsedGroups.ts:6` | `useCollapsedGroups.ts:8-16` | V1 `RoomListCollapser` 同 hook | `useCollapsedGroups.ts:6` |
| sidebar.sidepanel.unread-toggle | 副栏只看未读 | `副栏顶 heading→Unread ToggleSwitch` | secondarySidebar ON；项 none `SidePanelInternal.tsx:48-51` | DOM: [待渲染实测] switch 勾上，副栏列表只剩未读；endpoint: none；persist: [读] `sidePanelFilters` unread 后缀 localStorage | `SidePanelInternal.tsx:48-51` | `nav.sort.group.unread` | `SidePanelInternal.tsx:51` |
| sidebar.sidepanel.back | tablet 关闭副栏 | `副栏顶→Back` | secondarySidebar ON + `isTablet` `SidePanelInternal.tsx:44` | DOM: [待渲染实测] 副栏 tabpanel 消失；endpoint: none `closeSidePanel()` layout state；persist: [读] **刷新不持久** | `SidePanelInternal.tsx:44` | `nav.sidebar.toggle` | `SidePanelInternal.tsx:44` |

本表数据行：**9**。计数：`rg -c '^\| ` 对本节；见附录验算。

本分册表体行合计 **107**；稳定 id（首次出现去重）**107**。

## 分册 03 — Composer 注册面 + 房间隐式交互

命名空间 `composer.*` / `implicit.*` / `thread.*` / `shortcut.*`。legacy `messageBox.actions.add` 全仓库 0 调用。

## A. Composer 注册面

### A1 发送与输入

`ls` 核心文件：`messageBox/MessageBox.tsx`、`ComposerMessage.tsx`、`lib/chats/flows/sendMessage.ts`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.send` | 把当前输入（文本/附件/引用/编辑）发出去 | 打开已订阅房间 → 焦点落在 `textarea[name=msg]` → 输入非空文本或已有附件 → 点 `aria-label=Send` 的发送钮 | `canSend`：`roomCoordinator.getRoomDirectives(room.t).canSendMessage(room)`；联邦须 `isRoomNativeFederated` + `federationMatrixEnabled`；`MessageBox.tsx:314-332`。钮 disabled 当 `!typing && !isEditing && !hasUploads` 或上传中 `MessageBox.tsx:517` | `[读]` ①发送钮 `aria-label=Send` 变可点；消息列表新增 `role=listitem`；引用条消失。②普通 `POST /v1/chat.sendMessage`（`sendMessage.ts:51`）；编辑 `POST /v1/chat.update`（`data.ts:192`）；带附件先 `POST /v1/rooms.media/:rid` 再 `POST /v1/rooms.mediaConfirm/:rid/:id`。③刷新后消息仍在（server） | core | `composer.send.enter-behavior`；`implicit.draft.flushServer`；`thread.composer.reply` | `MessageBox.tsx:182-196,514-521`；`sendMessage.ts:63-151` |
| `composer.send.enter-behavior` | 按用户偏好决定 Enter 发送还是换行 | 设置 → Preferences → `sendOnEnter` 选 normal/desktop/alternative → 回房间 → 在 textarea 按 Enter / Shift+Enter | `useUserPreference('sendOnEnter')`；mobile 或 `null`/`normal`/`desktop&&!isMobile` 时 `sendOnEnter=true`（Enter 发送）；`alternative` 则修饰键+Enter 才发送。`MessageBox.tsx:124-125,221-233` | `[读]` ①无独立控件；textarea 内容被发送或插入 `\n`。②同 `composer.send`。③偏好存在用户设置（server），刷新后和弦语义不变 | core+preference | `shortcut.composer.send`；`shortcut.composer.newLine` | `MessageBox.tsx:123-125,221-233` |
| `composer.edit.cancel` | 退出正在编辑的消息 | 用 ↑ 进入编辑（见 `shortcut.composer.prevMessage`）→ 点 `Cancel` **或** 按 Escape | `chat.composer.editing` 为真；`MessageBox.tsx:198-214,244-248,513` | `[读]` ①`Cancel` 按钮与 hint「Editing_message」消失；textarea 恢复非 editing variant。②无 REST（仅 `currentEditingMessage.reset/cancel/stop`）。③刷新后不会停在编辑态 | core | `shortcut.composer.escape`；`implicit.composer.hint.editing` | `MessageBox.tsx:198-214,456-461,513` |
| `composer.join` | 未订阅时用 Join 先加入再发 | 预览公开房间且 `canSend=false` → 点发送栏 `Join` | `!canSend` 才渲染 Join；`MessageBox.tsx:506-509`。`onJoin` → `chat.data.joinRoom()` | `[读]` ①`Join` 按钮 loading 后消失，textarea 解除 disabled。②`POST /v1/rooms.join` `{roomId}`（`data.ts:276-277`）。③刷新后已成为订阅者，composer 正常 | core | `composer.variant.join-password`；`composer.variant.read-only` | `ComposerMessage.tsx:34-41`；`MessageBox.tsx:338-340,506-509` |
| `composer.keyboard.auto-wrap` | 选中文字再敲配对符，自动包一层 | 选中 textarea 一段文字 → 敲 `` ` " ' ( < { [ * _ ~ `` 之一 | 须有非空选区且 `event.data` 命中 `wrapSelectionPatterns`；`wrapSelection.ts:3-15,41-52` | `[读]` ①选区变成 `*text*` / `` `text` `` 等，光标仍包在中间。②无 endpoint。③仅写入当前文本；随草稿 persist | core | `composer.format.bold`；`composer.format.italic` | `wrapSelection.ts:25-65`；`MessageBox.tsx:399-410` |
| `composer.slash.execute` | 发送 `/cmd params` 执行斜杠命令 | textarea 输入 `/topic hello`（或任意已注册命令）→ Send / Enter | `isSlashCommandAllowed = !E2E_Enable \|\| !room.encrypted \|\| E2E_Allow_Unencrypted_Messages`（`MessageBox.tsx:116-118`）。命令自身 `permission` → `hasAtLeastOnePermission`（`processSlashCommand.ts:66-68`）。未知命令看 `Message_AllowUnrecognizedSlashCommand`（`:56`） | `[读]` ①composer 被 `clear()`；未知/无权限时出现 rocket.cat 临时提示。②clientOnly 走本地 callback；否则 `POST /v1/commands.run` + `POST /v1/statistics.telemetry`。③命令副作用（改 topic 等）刷新后仍在 | core+app | `composer.popup.slash-command`；`composer.popup.slash-preview` | `processSlashCommand.ts:46-114` |

本表数据行：**6**。计数：`rg -c '^\| ` 对本节；见附录验算。

## A. Composer 注册面

### A2 格式化工具栏

`formattingButtons` 注册表 **7** 项（`messageBoxFormatting.ts:34-106`；`rg "label:"` 命中 8 含类型声明）。工具栏：`MessageBoxFormattingToolbar.tsx`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.format.bold` | 把选区包成 `*text*` | 选中文字 → 点 title=`Bold` 的粗体钮；或 `Ctrl/Cmd+B` | toolbar `disabled={isRecording \|\| !canSend}`（`MessageBox.tsx:487-493`）。formatter 来自 `chat.composer.formatters` | `[读]` ①选区变为 `*…*`。②无 REST。③随草稿；发出后刷新消息仍带 markdown | core | `shortcut.composer.formatBold` | `messageBoxFormatting.ts:35-40` |
| `composer.format.italic` | 把选区包成 `_text_` | 选中 → title=`Italic`；或 `Ctrl/Cmd+I` | 同格式化栏 | `[读]` ①选区变为 `_…_`。②无 REST。③同 bold | core | `shortcut.composer.formatItalic` | `messageBoxFormatting.ts:41-46` |
| `composer.format.strikethrough` | 把选区包成 `~text~` | 选中 → title=`Strikethrough` | 同格式化栏；无 command 快捷键 | `[读]` ①选区变为 `~…~`。②无 REST。③同 bold | core | `composer.keyboard.auto-wrap` | `messageBoxFormatting.ts:47-51` |
| `composer.format.inline-code` | 把选区包成行内代码 | 选中 → title=`Inline_code` | 同格式化栏 | `[读]` ①选区变为 `` `…` ``。②无 REST。③同 bold | core | `composer.keyboard.auto-wrap` | `messageBoxFormatting.ts:52-56` |
| `composer.format.multiline-code` | 把选区包成代码块 | 选中 → title=`Multi_line_code` | 同格式化栏 | `[读]` ①选区变为三反引号围栏。②无 REST。③同 bold | core | `composer.send` | `messageBoxFormatting.ts:57-61` |
| `composer.format.link` | 打开加链接弹窗，插入 `[text](url)` | 点 title=`Link` → 填 Text / URL → `Add` | 同格式化栏；URL 须 `isValidLink`（`AddLinkComposerActionModal.tsx:61-66`） | `[读]` ①modal `title=Add_link`、确认 `Add` 出现；确认后 modal 关、选区变 markdown 链接。②无 REST。③随草稿 | core | `composer.format.bold` | `messageBoxFormatting.ts:62-88`；`AddLinkComposerActionModal.tsx:39-46` |
| `composer.format.katex` | 打开 KaTeX 函数帮助外链 | 点 title=`KaTeX`（大屏为图标或 `$$KaTeX$$` 文本链） | `settings.peek('Katex_Enabled')`（默认 true）；文案还看 `Katex_Dollar_Syntax` / `Katex_Parenthesis_Syntax`。`messageBoxFormatting.ts:89-105` | `[读]` ①新窗口打开 `https://khan.github.io/KaTeX/function-support.html`；composer 文本不变。②无 RC endpoint。③无本地状态 | core+setting | — | `messageBoxFormatting.ts:89-105`；`MessageBoxFormattingToolbar.tsx:56-58` |
| `composer.format.overflow-dropdown` | 窄屏把除首项外的格式收入下拉 | 把窗口缩到 composer `inlineSize<480` → 点 `Message_Formatting_toolbox` 下拉 → 再点某 formatter | `variant==='small'` 时只外露第一项（通常 Bold），其余进 dropdown。`MessageBox.tsx:490`；`MessageBoxFormattingToolbar.tsx:20-37` | `[待渲染实测]` ①下拉菜单 role/name（Fuselage GenericMenu）。②无 REST。③纯布局，刷新后按宽度重算 | core | `composer.format.bold` | `FormattingToolbarDropdown.tsx`；`MessageBoxFormattingToolbar.tsx:20-37` |

本表数据行：**8**。计数：`rg -c '^\| ` 对本节；见附录验算。

## A. Composer 注册面

### A3 弹层补全

`ComposerPopupProvider.tsx` 里 `createMessageBoxPopupConfig` **7** 套（含 omnichannel `!` canned，本分册不登记，见边界）。弹层壳：`ComposerBoxPopup.tsx` `role='menu'` `name='ComposerBoxPopup'`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.popup.mention` | `@` 补全最近发言者 / @all / @here / spotlight 用户 | 在 textarea 输入 `@` 或 `@ali` → ↑↓ → Enter/Tab 或点击 option | 无额外 permission。建议条数 `Number_of_users_autocomplete_suggestions`（默认 5）。`ComposerPopupProvider.tsx:94,110-184` | `[读]` ①`role=menu` `name=ComposerBoxPopup` 标题 People；option `id=popup-item-{id}` `aria-selected`。②本地最近消息 + `GET /v1/spotlight?type={"users":true,"mentions":true}`。③选中写入文本，随草稿；刷新后 popup 关 | core+setting | `shortcut.popup.select` | `ComposerPopupProvider.tsx:110-184`；`ComposerBoxPopup.tsx:82-114` |
| `composer.popup.channel` | `#` 补全自己订过的 c/p 频道 | 输入 `#` + 过滤词 → Enter/Tab | 本地过滤 `!federated && (t==='c'\|\|'p')`。`ComposerPopupProvider.tsx:195-200` | `[读]` ①menu 标题 Channels。②本地 subscriptions + `GET /v1/spotlight?type={"rooms":true,"mentions":true}`。③写入 `#name `；popup 关 | core | `composer.popup.mention` | `ComposerPopupProvider.tsx:185-215` |
| `composer.popup.emoji-colon` | `:name` 内联 emoji 建议 | 输入至少 2 个触发字符（`triggerLength: 2`）如 `:smi` → 选一项 | `useUserPreference('useEmojis')` 为真才注册。`ComposerPopupProvider.tsx:99,216` | `[读]` ①menu 标题 Emoji。②仅本地 `emoji.list`，无 REST。③插入 unicode 或 `:name:`；`localStorage emoji.recent` 影响下次排序 | core+preference | `composer.emoji.picker` | `ComposerPopupProvider.tsx:216-273` |
| `composer.popup.emoji-plus` | `+:` 插入大表情前缀 | 行首输入 `+:` + 名 → 选一项 | 同 `useEmojis`；`triggerAnywhere: false`。`ComposerPopupProvider.tsx:274-279` | `[读]` ①menu 标题 Emoji。②本地 emoji.list。③插入 `+:name: `（prefix `+` + suffix 空格） | core+preference | `composer.popup.emoji-colon` | `ComposerPopupProvider.tsx:274-325` |
| `composer.popup.slash-command` | `/` 打开斜杠命令 palette | 行首输入 `/` 或 `/to` → ↑↓ → Enter/Tab 补全命令名 | `encrypted = isRoomEncrypted && E2E_Enable && !E2E_Allow_Unencrypted_Messages` 时整组 `disabled`。每条再 `command.permission`。`ComposerPopupProvider.tsx:101-103,327-360` | `[读]` ①menu 标题 Commands；加密不可用项 title=`Unavailable_in_encrypted_channels`。②仅本地 `slashCommands.commands`。③补全 `/cmd `，不立刻执行 | core+app | `composer.slash.execute` | `ComposerPopupProvider.tsx:327-363` |
| `composer.popup.slash-preview` | 带 preview 的命令横向预览并执行 | 输入 `/cmd ` + 参数（该命令 `providesPreview`）→ 点 preview option 或 Enter | `useComposerBoxPopupQueries` 要求 `slashCommands.commands[cmd].providesPreview`。`popup.option.preview` 才挂 `ComposerBoxPopupPreview`。`MessageBox.tsx:443-455` | `[读]` ①`role=menu` 内 `role=listbox`/`role=option`。②`GET /v1/commands.preview` 加载；选中 `POST /v1/commands.preview`。③composer `setText('')`；命令结果刷新后按命令语义 | core+app | `composer.slash.execute` | `ComposerBoxPopupPreview.tsx:31-76,106-133`；`ComposerPopupProvider.tsx:393-410` |

本表数据行：**6**。计数：`rg -c '^\| ` 对本节；见附录验算。

## A. Composer 注册面

### A4 动作工具栏 / 录音 / 附件 / Apps

`ls` hooks = **7**：audio / video / file-upload / webdav / discussion / location / timestamp。`data-qa-id` 硬编码：`audio-message` `video-message` `file-upload` `create-discussion` `share-location` `timestamp` `webdav-add` `menu-more-actions`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.emoji.picker` | 打开 emoji 选择器并插入 | 点 toolbar title=`Emoji` → 在 picker 点一个 emoji | `useUserPreference('useEmojis')`；录音/`!canSend` 时 disabled。`MessageBox.tsx:162,168-177,480-485` | `[读]` ①toolbar title=Emoji；picker `[读]` `role=dialog` `aria-label=Emoji_picker`（EmojiPicker 组件）。②无 REST，`chat.emojiPicker.open` → `insertText`。③`localStorage emoji.recent/frequent/tone` | core+preference | `composer.popup.emoji-colon` | `MessageBox.tsx:164-178,480-485` |
| `composer.action.audio-message` | 开始录音，完成后当 mp3 附件 | 宽屏点 `data-qa-id=audio-message`；窄屏在 featured 或 More→Create new。再走 `implicit.recording.finish` | `AudioRecorder.isSupported()`；`FileUpload_Enabled`；`Message_AudioRecorderEnabled`；黑白名单不含/含 `audio/mp3`；`!isMicrophoneDenied`；`disableBasicActions=!canSend\|\|isRecording\|\|isEditing`。`useAudioMessageAction.ts:14-31`；`MessageBoxActionsToolbar.tsx:57` | `[读]` ①录音条 `role=group` `aria-label=Audio_recorder` 出现，textarea disabled。②开始无 REST；完成走 `uploadFiles` → `POST /v1/rooms.media/:rid`；`UserAction` 发 `notify-room` recording。③录音态不持久；上传成功后附件随发送 persist | core+setting | `implicit.recording.cancel`；`implicit.recording.finish` | `useAudioMessageAction.ts:13-64`；`AudioMessageRecorder.tsx:106-126` |
| `composer.action.video-message` | 打开视频录制浮层 | 宽屏点 `data-qa-id=video-message`；窄屏 More→Create new→video | `Message_VideoRecorderEnabled`；`FileUpload_Enabled`；`navigator.mediaDevices`+`MediaRecorder`；camera 未拒；MIME 黑白名单 `video/webm`；`VideoRecorder.getSupportedMimeTypes()`。`useVideoMessageAction.ts:12-30` | `[读]` ①`role=dialog` `aria-label=Video_record`；Record/Stop `aria-label`；Cancel/Send。②完成 `uploadFiles` → `POST /v1/rooms.media/:rid`。③浮层不持久；文件随发送 | core+setting | `composer.action.more-menu` | `useVideoMessageAction.ts:11-62`；`VideoMessageRecorder.tsx:116-136` |
| `composer.action.file-upload` | 打开系统文件选择器多选上传 | 点 `data-qa-id=file-upload`（clip）→ 选文件 | `FileUpload_Enabled`；`disableBasicActions`。`useFileUploadAction.ts:13,50` | `[读]` ①系统 file picker；确认后 composer 出现 `aria-label=文件名` 的 chip，组名 Uploads。②`POST /v1/rooms.media/:rid`。③上传队列仅 session；发出并 `mediaConfirm` 后刷新仍在 | core+setting | `composer.paste.image`；`implicit.upload.dropFiles` | `useFileUploadAction.ts:11-52`；`uploads.ts:157` |
| `composer.paste.image` | 粘贴剪贴板图片当附件 | 焦点在 textarea → `Ctrl/Cmd+V` 一张图（剪贴板无 `text/plain`） | 同 file upload；有 `text/plain` 则走默认粘贴。`MessageBox.tsx:351-353` | `[读]` ①出现名为 `Clipboard - {datetime}.ext` 的 chip。②同 `rooms.media`。③同 file-upload | core+setting | `composer.action.file-upload` | `MessageBox.tsx:342-379` |
| `composer.action.create-discussion` | 从 composer 打开创建讨论弹窗 | More (`data-qa-id=menu-more-actions`) → Create new → `Discussion` | `Discussion_enabled`；`start-discussion` **或** `start-discussion-other-user`；`!isRoomFederated`。`useCreateDiscussionAction.tsx:21-25` | `[待渲染实测]` ①CreateDiscussion modal 字段树。②提交 `POST /v1/rooms.createDiscussion`。③新讨论房间刷新后仍在 | core+permission+setting | `composer.action.more-menu` | `useCreateDiscussionAction.tsx:8-34` |
| `composer.action.share-location` | 分享当前位置为 geo 消息 | More → Share → `Location` → 允许定位 → Share | `MapView_Enabled===true`；`navigator.geolocation.getCurrentPosition`；`MapView_GMapsAPIKey` 非空；`!isRoomFederated`。`useShareLocationAction.tsx:17-24` | `[待渲染实测]` ①ShareLocation GenericModal / 权限提示 / 地图。②`POST /v1/chat.sendMessage` 带 `location.Point`。③刷新后地图附件仍在 | core+setting | `composer.send` | `useShareLocationAction.tsx:9-33`；`ShareLocationModal.tsx:36-52` |
| `composer.action.timestamp` | 插入时间戳 markup | More → Insert → `Timestamp` → 选日期/格式/时区 → Add | disabled 仅当 `!canSend \|\| isRecording`（**编辑态仍可用**）。`MessageBoxActionsToolbar.tsx:65`；`useTimestampAction.tsx:8-26` | `[待渲染实测]` ①modal `Insert_timestamp`。②无 REST，`composer.insertText`。③随草稿 | core | `composer.send` | `useTimestampAction.tsx:8-27` |
| `composer.action.webdav-add` | 添加 WebDAV 服务器账号 | More → Create new → `Add_Server` | `Webdav_Integration_Enabled`；整组可被 `hiddenActions` 含 `webdav-add` 藏掉。Add 项 `disabled=!isSuccess`。`useWebdavActions.tsx:12-33`；`MessageBoxActionsToolbar.tsx:77` | `[待渲染实测]` ①AddWebdavAccountModal。②账号保存走 WebDAV 集成 API（非本分册深挖）。③账号刷新后仍在 More 菜单 | core+setting | `composer.action.webdav-upload` | `useWebdavActions.tsx:11-34` |
| `composer.action.webdav-upload` | 从已连 WebDAV 选文件上传 | More → Create new → 点账户名 → 在 picker 选文件 | 同上 setting + query success 且有账户。`useWebdavActions.tsx:35-43` | `[待渲染实测]` ①WebdavFilePickerModal。②选中后 `uploadFiles` → `POST /v1/rooms.media/:rid`。③同 file-upload | core+setting | `composer.action.file-upload` | `useWebdavActions.tsx:22-43` |
| `composer.action.more-menu` | 打开 + 更多操作菜单 | 点 `data-qa-id=menu-more-actions`（icon=plus，`title=More_actions`） | `disabled={isRecording \|\| !canSend}`。`MessageBoxActionsToolbar.tsx:152` | `[待渲染实测]` ①GenericMenu 分段 Create_new / Share / Insert / Apps。②无 REST。③关闭后不持久 | core | `composer.action.create-discussion` | `MessageBoxActionsToolbar.tsx:151-163` |
| `composer.action.apps` | 运行 Apps Engine 注册的 messageBox 按钮 | More → Apps → 点 `{appId}/{actionId}` | `GET` actionButtons `context==='messageBoxAction'`；`useApplyButtonFilters` 按房间类型/角色/权限过滤。`useMessageboxAppsActionButtons.ts:13-25` | `[待渲染实测]` ①运行时 app i18n label。②UiKit `emitInteraction` `type=actionButton`（非普通 REST）。③取决于 app | app | `composer.action.more-menu` | `useMessageboxAppsActionButtons.ts:12-61` |
| `composer.upload.remove` | 去掉待发送附件 chip | 上传完成的 chip 上点 `aria-label=Remove`（cross） | 非 loading；`isProcessingUploads` 时整组 disabled。`MessageComposerGenericFile.tsx:55-63,93` | `[读]` ①该 `aria-label=文件名` chip 消失。②无新 REST（本地 store remove）。③刷新不会回来 | core | `implicit.upload.composerChipPreview` | `MessageComposerGenericFile.tsx:55-64` |
| `composer.upload.cancel` | 取消进行中的上传 | loading chip 上点 `aria-label=Cancel` | `isLoading = !upload.url && !upload.error`。`MessageComposerGenericFile.tsx:33,55` | `[读]` ①chip 与进度条消失。②中止 XHR；无 mediaConfirm。③无残留 | core | `implicit.upload.progressBanner` | `MessageComposerGenericFile.tsx:55-63` |
| `composer.upload.edit` | 改附件文件名 / alt | 点非 loading chip → FileUpload modal 改 name/altText → `Update` | `!isLoading && !upload.error` 才能打开。`MessageComposerGenericFile.tsx:35-38` | `[读]` ①modal `aria-labelledby` 标题 FileUpload；确认 `Update`；关闭后 chip 文件名变。②此时无 REST；发送时带新名走 mediaConfirm。③未发送则刷新丢失 | core | `implicit.upload.modalConfirm` | `MessageComposerGenericFile.tsx:35-52`；`FileUploadModal.tsx:63-112` |

本表数据行：**15**。计数：`rg -c '^\| ` 对本节；见附录验算。

## A. Composer 注册面

### A5 容器变体（非 omnichannel）

路由顺序 `ComposerContainer.tsx:43-84`。Omnichannel 整支 OUT。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.variant.air-gapped` | 空窗限制时只读页脚，无输入框 | 工作区 `Cloud_Workspace_AirGapped_Restrictions_Remaining_Days===0` → 打开任意房间 | `useAirGappedRestriction()[0]`；天数 `<0` 视为有许可。`useAirGappedRestriction.ts:10-17`；`ComposerContainer.tsx:43-44` | `[读]` ①`MessageFooterCallout` 文案 `Composer_readonly_airgapped`；textarea 不出现。②无 REST。③设置未变则刷新仍只读 | core+license | — | `ComposerAirGappedRestricted.tsx:6-16` |
| `composer.variant.anonymous.sign-in` | 未登录点「登录后发言」 | 匿名可读工作区、未登录 → 进房间 → `Sign_in_to_start_talking` | `!uid`（`useMessageComposerIsAnonymous`）；`ComposerContainer.tsx:55-56` | `[读]` ①登录流出现（`forceLogin=true`）。②无房间 REST。③登录后刷新进正常 composer | core+setting | `composer.variant.anonymous.join` | `ComposerAnonymous.tsx:42-44` |
| `composer.variant.anonymous.join` | 以匿名用户开始说话 | 同上 → `Or_talk_as_anonymous` | 另需 `Accounts_AllowAnonymousWrite`。`ComposerAnonymous.tsx:15,45-48` | `[读]` ①按钮后出现可输入 composer。②Meteor method `registerUser` + `loginWithToken`。③token 会话刷新后仍在 | core+setting | `composer.variant.anonymous.sign-in` | `ComposerAnonymous.tsx:21-37,45-48` |
| `composer.variant.read-only` | 只读房间页脚；未订阅可 Join | 打开 `room.ro` 且无 `post-readonly` 的房间 | `roomCoordinator.readOnly` + `post-readonly` 依赖。`useMessageComposerIsReadOnly.ts:11-13` | `[读]` ①callout `room_is_read_only`；未订阅时 `Join`。②Join → `POST /v1/rooms.join`。③只读属性刷新仍在；Join 后仍可能只读 | core+permission | `composer.join` | `ComposerReadOnly.tsx:9-34` |
| `composer.variant.archived` | 归档房间不能输入 | 打开 `room.archived` 或 DM `subscription.archived` | `useMessageComposerIsArchived`。`ComposerContainer.tsx:63-64` | `[读]` ①callout `Room_archived`；无 textarea。②无 REST。③归档未解则刷新仍如此 | core | `implicit.editRoomInfo.save` | `ComposerArchived.tsx:8-10`；`useMessageComposerIsArchived.ts:3-4` |
| `composer.variant.join-password` | 用加入码加入加密加入的房间 | 无订阅 + `joinCodeRequired` + 无 `join-without-join-code` → 输入密码 → `Join_with_password` | `ComposerContainer.tsx:27-28,67-68` | `[读]` ①form `aria-label=Join_with_password`；成功后变正常 composer。②`POST /v1/rooms.join` `{roomId,joinCode}`。③刷新后已订阅 | core+permission | `composer.join` | `ComposerJoinWithPassword.tsx:13-47` |
| `composer.variant.blocked` | 被对方或自己屏蔽的 DM 不能输入 | 打开 DM 且 `subscription.blocked\|\|blocker` | 仅 DM。`useMessageComposerIsBlocked.ts:9-18` | `[读]` ①callout `room_is_blocked`。②无 REST。③屏蔽关系刷新仍在 | core | — | `ComposerBlocked.tsx:4-7` |
| `composer.variant.federation.invalid-version` | 非原生联邦房间禁止发送 | 打开 `isRoomFederated && !isRoomNativeFederated` | `ComposerContainer.tsx:39,51-52`；`ComposerFederation.tsx:17-18` | `[读]` ①callout `Federation_Matrix_Federated_Description_invalid_version` + 外链。②无 REST。③房间类型刷新不变 | core | `composer.variant.federation.disabled` | `ComposerFederationInvalidVersion.tsx:7-18` |
| `composer.variant.federation.disabled` | 联邦总开关关闭时不能发 | 原生联邦房间但 `useIsFederationEnabled()` 假 | `ComposerFederation.tsx:21-22` | `[读]` ①callout `Federation_Matrix_Federated_Description_disabled`。②无 REST。③设置刷新后仍禁 | core+setting | `composer.variant.federation.premium` | `ComposerFederationDisabled.tsx:7` |
| `composer.variant.federation.premium` | 无 federation 许可模块时不能加入/发 | 联邦已开但 `useHasLicenseModule('federation')` 假 | `ComposerFederation.tsx:15,25-26` | `[读]` ①callout `Federation_Matrix_join_public_rooms_is_premium`。②无 REST。③许可未变则刷新仍禁 | core+license | — | `ComposerFederationJoinRoomDisabled.tsx:7` |

本表数据行：**10**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B1 Room Info kebab + EditRoomInfo

进路依赖 toolbox 打开 `channel-settings`（标题点击是 toolbox，**本分册不登记标题**）。kebab / Edit / 保存不在 hooks 注册表。
`find` Info 目录 `.ts/.tsx` **26**（含 spec 则更多）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.roomInfo.kebab.open` | 打开 Room Info 溢出菜单 | 打开 Channel/Discussion Info → 点 kebab（`title=More`） | `actions.items.length > 2` 才生成 menu（默认 size=2）。`useSplitRoomActions.ts:16-18`；`RoomInfo.tsx:68-75` | `[待渲染实测]` ①GenericMenu 分段出现。②无 REST。③刷新后 menu 关，须重开 Info | core | `implicit.roomInfo.action.leave` | `RoomInfo.tsx:68-75` |
| `implicit.roomInfo.action.edit` | 从 Info 进入编辑表单 | Info 面板点 `Edit`（前 2 个按钮之一，或 kebab） | `useCanEditRoom` = `edit-room`；联邦再 `Federation.isEditableByTheUser`。`useCanEditRoom.ts:12-16`；`RoomInfoRouter.tsx:23-35` | `[读]` ①标题切到 `Edit_channel`/`Edit_team`/`Edit_discussion`；Save/Reset 出现。②无即时 REST。③`isEditing` 为 local state，刷新回 Info | core+permission | `implicit.editRoomInfo.save` | `RoomInfoRouter.tsx:26-36` |
| `implicit.roomInfo.action.hide` | 隐藏房间（关订阅） | Info → Hide →（若未勾 don't ask）确认 `Yes_hide_it` | 有订阅即可调 `useHideRoomAction`。`useRoomActions.ts:32-36` | `[读]` ①确认 modal；成功后导航 `/home`，侧栏该房间消失。②`POST /v1/channels.close` 或 `groups.close` / `im.close`。③刷新后仍隐藏直至再打开 | core | `implicit.roomInfo.action.leave` | `useHideRoomAction.tsx:23-39,65-88` |
| `implicit.roomInfo.action.leave` | 离开房间 | Info → Leave → WarningModal `Leave_room` | `leave-c`（频道）或 `leave-p`（私有）；`room.cl!==false`；有 subscription。`useRoomLeave.tsx:22` | `[读]` ①WarningModal 出现再关；进 `/home`。②`POST /v1/channels.leave` / `groups.leave` / `im.leave`。③刷新后不再是成员 | core+permission | `implicit.roomInfo.action.hide` | `useRoomLeave.tsx:17-56` |
| `implicit.roomInfo.action.delete` | 删除房间 | kebab 危险区 → Delete → `Yes_delete_it` | `delete-{room.t}`；团队房间还要 `delete-team-channel/group`；联邦不可删。`useDeleteRoom.tsx:27-30` | `[读]` ①danger modal `Delete_roomType`。②`POST /v1/rooms.delete`（团队主房间 `POST /v1/teams.delete`）。③房间不可恢复 | core+permission | `implicit.roomInfo.action.leave` | `useDeleteRoom.tsx:21-99`；`useRoomActions.ts:88-97` |
| `implicit.roomInfo.action.moveToTeam` | 把频道移进团队 | kebab → `Teams_move_channel_to_team` → 选团队确认 | `!federated && !teamId && !prid && canEdit`。`useRoomMoveToTeam.tsx:15` | `[读]` ①ChannelToTeamModal；toast `Rooms_added_successfully`。②`POST /v1/teams.addRooms`。③刷新后房间带 teamId | core+permission | `implicit.roomInfo.action.convertToTeam` | `useRoomMoveToTeam.tsx:15-36` |
| `implicit.roomInfo.action.convertToTeam` | 把频道转成团队 | kebab → Convert → GenericModal `Convert` | `create-team` + `canEdit` + `!teamId && !prid && !federated`。`useRoomConvertToTeam.tsx:14-17` | `[读]` ①warning modal `Converting_channel_to_a_team`；toast `Room_has_been_converted`。②`POST /v1/channels.convertToTeam` 或 `groups.convertToTeam`。③刷新后变为团队 | core+permission | `implicit.roomInfo.action.moveToTeam` | `useRoomConvertToTeam.tsx:14-44` |
| `implicit.editRoomInfo.save` | 保存房间设置 | Edit Room Info 改字段 → `Save` | 字段级：`edit-room`、`set-readonly`、`set-react-when-readonly`、`edit-room-retention-policy`、`archive-room`/`unarchive-room`、`create-c`/`create-p`（改类型）。`useEditRoomPermissions.ts:13-66`。Save `disabled={!isDirty}` | `[读]` ①toast `Room_updated_successfully`；回到 Info/关栏。②`POST /v1/rooms.saveRoomSettings`（归档另走 archive hook）。③刷新后字段仍在 | core+permission | `implicit.editRoomInfo.reset` | `EditRoomInfo.tsx:150-199,612-614` |
| `implicit.editRoomInfo.reset` | 把编辑表单打回默认值 | Edit 且已 dirty → `Reset` | `disabled={!isDirty \|\| isSubmitting}`。`EditRoomInfo.tsx:609` | `[读]` ①字段回 `defaultValues`；Save 再 disabled。②无 REST。③未保存则刷新仍是旧值 | core | `implicit.editRoomInfo.save` | `EditRoomInfo.tsx:609-610` |
| `implicit.editRoomInfo.back` | 从编辑返回 Info | Edit 顶栏 ContextualbarBack | 仅 `isEditing`。`RoomInfoRouter.tsx:26-27` | `[读]` ①Edit 表单消失，Info 再现。②无 REST。③local `isEditing=false` | core | `implicit.roomInfo.action.edit` | `RoomInfoRouter.tsx:26-27` |

本表数据行：**10**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B2 Drafts

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.draft.persistLocal` | 输入时写入 localStorage 草稿 | 在房间（或线程）composer 打字 | 有 rid；key=`messagebox_{rid}[-{tmid}]`。`useDraft.ts:5,8-16,28-33` | `[读]` ①textarea 值变化。②无 REST。③刷新同标签页可从 localStorage 恢复（在 flush 清掉之前） | core | `implicit.draft.restore` | `useDraft.ts:4-33` |
| `implicit.draft.flushServer` | 卸载 composer 时把草稿同步到服务器 | 输入后切到另一房间 / 关掉线程（textarea ref 变 null） | `draft!==serverDraft`；若 `tmid && !threadExists` 则跳过。`useDraft.ts:44-54` | `[读]` ①本地 key 在成功后被 remove。②`POST /v1/rooms.saveDraft` `{rid,draft,tmid?}`。③他端/刷新从 subscription.draft 回来 | core | `implicit.draft.persistLocal` | `useDraft.ts:36-55`；`MessageBox.tsx:144-146` |
| `implicit.draft.restore` | 打开房间/线程时预填草稿 | 在 A 房间打字离开 → 再进 A（或带 tmid 的线程） | 优先 `subscription.draft` / `threadDrafts[tmid]`，否则 localStorage。`useDraft.ts:19`；`MessageBox.tsx:135-140` | `[读]` ①textarea 预填。②读订阅字段（无单独 GET）。③server draft 跨刷新仍在 | core | `thread.composer.reply` | `useDraft.ts:19-20` |

本表数据行：**3**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B3 Drag-and-drop 上传

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.upload.dragEnterOverlay` | 拖入文件时盖一层 drop overlay | 从桌面拖文件进入 `.messages-container-main` | overlay 总在 dragenter 出现；文案看 enabled。`useDropTarget` + `RoomBody.tsx:173-174` | `[读]` ①`role=dialog` `data-qa=DropTargetOverlay` 文案 `Drop_to_upload_file`。②无 REST。③松手或离开即消失 | core | `implicit.upload.dropFiles` | `DropTargetOverlay.tsx:66-92` |
| `implicit.upload.dropFiles` | 放下文件开始上传 | overlay 可见且绿色 → drop | `FileUpload_Enabled`；未超 MAC；`post-readonly`/非只读；已订阅；非 editing。`useFileUploadDropTarget.ts:72-91` | `[读]` ①overlay 关；composer chips 出现。②`POST /v1/rooms.media/:rid`。③同 file-upload | core+setting+permission | `composer.action.file-upload` | `useFileUploadDropTarget.ts:47-68`；`DropTargetOverlay.tsx:35-59` |
| `implicit.upload.dragDisabledOverlay` | 无权限拖入时显示拒绝原因 | 只读/未订阅/编辑中/关上传 时 dragenter | `!FileUpload_Enabled \|\| MAC` → `FileUpload_Disabled`；否则 `error-not-allowed`。`useFileUploadDropTarget.ts:72-86` | `[读]` ①同 dialog，文字红色 danger。②无 upload。③松手无附件 | core+setting | `implicit.upload.dragEnterOverlay` | `useFileUploadDropTarget.ts:72-86` |

本表数据行：**3**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B4 发送前附件预览

chip 的 remove/cancel/edit 已在 A4，这里只登记预览与进度。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.upload.composerChipPreview` | 点 chip 打开发送前预览/改名 | 完成上传后的 chip → click | 非 loading 且无 error。`MessageComposerGenericFile.tsx:35-38` | `[读]` ①FileUpload modal 标题 FileUpload + 预览区。②无新 REST。③关 modal 不发消息 | core | `implicit.upload.modalConfirm` | `MessageComposerGenericFile.tsx:35-52` |
| `implicit.upload.modalConfirm` | 在预览里确认新文件名/alt | modal 改字段 → `Update` | `isDirty` 才可提交。`FileUploadModal.tsx:110-112` | `[读]` ①modal 关；chip `fileTitle` 变。②仍无 REST until send。③未发送刷新丢失 | core | `composer.upload.edit` | `FileUploadModal.tsx:39-117` |
| `implicit.upload.progressBanner` | 房间顶显示上传百分比 | 开始任一未完成 upload（选择/拖放/录音） | `isUploading`。`RoomBody.tsx:176` | `[读]` ①`role=status` Bubble `{n}% Uploading__count__file`。②伴随 media POST。③完成后消失，不刷新残留 | core | `composer.upload.cancel` | `UploadProgressIndicator.tsx:61-68` |

本表数据行：**3**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B5 Typing indicator

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.typing.start` | 自己输入时向房间广播 typing | 在非空 composer 按非 Enter/Esc/方向修饰键 | `onTyping` 且 `composer.text.trim()!==''`。`ComposerMessage.tsx:68-73`；`MessageBox.tsx:280` | `[读]` ①对方 `role=status` 出现 `is_typing`。②`sdk.publish notify-room {rid}/user-activity`。③约 15s 超时，不持久 | core | `implicit.typing.display` | `ComposerMessage.tsx:68-73` |
| `implicit.typing.stop` | 停止广播 typing | 清空输入 **或** 发送成功 | send 路径先 `action.stop('typing')`。`ComposerMessage.tsx:55,69-71` | `[读]` ①对方 status 该动作清空。②stop publish。③无残留 | core | `composer.send` | `ComposerMessage.tsx:54-56,69-71` |
| `implicit.typing.display` | 显示他人 typing/recording/uploading/playing | 被动：另一用户触发对应 UserAction | `UserAction.get(tmid\|\|rid)`。`ComposerUserActionIndicator.tsx:20-23` | `[读]` ①`.rc-message-box__activity-wrapper` `role=status` 拼接 `is_typing`/`are_recording` 等。②stream `notify-room`。③ephemeral | core | `implicit.recording.finish` | `ComposerUserActionIndicator.tsx:57-76` |

本表数据行：**3**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B6 Quote / preview bar

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.quote.barDisplay` | 在 composer 上方显示引用预览 | 用消息动作 Quote/Reply（toolbar OUT，只作前置）后看 composer | `quotedMessages.length>0`。`MessageBoxReplies.tsx:16-18` | `[读]` ①QuoteAttachment 块出现在 textarea 上。②无 REST until send。③仅 session；刷新掉（除非 URL `?reply=`） | core | `implicit.quote.dismissOne` | `MessageBoxReplies.tsx:16-26`；`MessageBox.tsx:427` |
| `implicit.quote.dismissOne` | 关掉单条引用 | 引用条右上 `aria-label=Dismiss_quoted_message` | 该 mid 仍在 quoted 列表。`MessageBoxReply.tsx:47-51` | `[读]` ①该引用块消失。②无 REST。③session only | core | `composer.send` | `MessageBoxReply.tsx:44-51` |
| `implicit.quote.fromUrl` | URL `?reply={mid}` 自动挂引用 | 导航到 `/channel/xxx?reply={mid}` | `useSearchParameter('reply')`。`useQuoteMessageByUrl.ts:7-27` | `[读]` ①quote bar 出现。②`GET /v1/chat.getMessage`（缓存未命中时，`data.ts:37-39`）。③带参刷新会再挂上 | core | `implicit.quote.barDisplay` | `useQuoteMessageByUrl.ts:15-27` |

本表数据行：**3**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B7 Thread 面板内部

`find` Threads **21** 文件。列表入口是 toolbox tab，**不登记「打开 Threads 工具」**；登记面板内操作。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `thread.panel.openFromList` | 从线程列表打开某条线程面板 | Threads tab（toolbox）→ 点列表项 | 列表已加载。`ThreadList.tsx:114-118` | `[读]` ①`rcx-thread-view` contextualbar；路由带 tmid。②拉主消息 query。③刷新带 tmid 可重开 | core | `thread.panel.backToList` | `ThreadList.tsx:115-118` |
| `thread.panel.backToList` | 从线程面板回到列表 | 面板 header ContextualbarBack | 面板已开。`Thread.tsx:64-66,112` | `[读]` ①ThreadChat 关，ThreadList 再现。②无 REST。③replace 路由 | core | `thread.panel.close` | `Thread.tsx:64-66` |
| `thread.panel.close` | 关掉线程面板 | header Close **或** 展开态点 backdrop | 始终可关。`Thread.tsx:60-62,82-84` | `[读]` ①contextualbar 消失。②`closeTab()`。③刷新无 tmid 则不再开 | core | `thread.composer.escapeLeave` | `Thread.tsx:82-84` |
| `thread.panel.toggleExpand` | 展开/折叠线程面板 | header `Expand`/`Collapse` | `useLayoutContextualBarExpanded()`。`Thread.tsx:49,117-122` | `[读]` ①portal 到 `#main-content` + backdrop；title 在 Expand/Collapse 间切。②无 REST。③`localStorage expand-threads` | core | `thread.panel.close` | `Thread.tsx:68-70,86-88,117-122` |
| `thread.panel.toggleFollow` | 关注/取关该线程 | header bell / bell-off | 主消息已加载。`Thread.tsx:72-79,124-128` | `[读]` ①`title` 在 Following / Not_Following 间切。②`POST /v1/chat.followMessage` 或 `unfollowMessage`。③刷新后 replies 仍含自己 | core | `thread.list.filter` | `useToggleFollowingThreadMutation.ts:19-31` |
| `thread.composer.reply` | 在线程 composer 回复 | 面板底部 `aria-label=Thread_composer` 输入 → Send | `ChatProvider tmid`；其余同 `canSend`。`ThreadChat.tsx:113-123` | `[读]` ①线程列表新增 listitem。②`POST /v1/chat.sendMessage` 带 `tmid`（及可选 `tshow`）。③刷新仍在线程 | core | `composer.send`；`thread.composer.alsoSendToChannel` | `ThreadChat.tsx:113-137` |
| `thread.composer.alsoSendToChannel` | 勾选后回复同时出现在频道 | 勾/去勾 `Also_send_to_channel` → 再发送 | 偏好 `alsoSendThreadToChannel`：always/never/default（首帖默认 `!tcount`）。`ThreadChat.tsx:29-40,124-135` | `[读]` ①checkbox `name=alsoSendThreadToChannel`。②发送体带 `tshow`。③频道刷新可见该回复 | core+preference | `thread.composer.reply` | `ThreadChat.tsx:124-135` |
| `thread.composer.escapeLeave` | 空内容 Esc 离开线程面板 | 焦点在线程 composer 且 trim 空 → Escape | `onEscape` → `closeTab`。`ThreadChat.tsx:50-52,119`；`MessageBox.tsx:247` | `[读]` ①面板关闭。②无 REST。③同 close | core | `shortcut.composer.escape` | `ThreadChat.tsx:50-52` |
| `thread.readOnNewMessage` | 线程内新回复自动标已读 | 面板开着时他人发 tmid 回复 | `msg.tmid===mainMessage._id` 且非 edited。`ThreadChat.tsx:66-75` | `[读]` ①未读点消失（列表 Following/Unread）。②`POST /v1/chat.readThread` `{tmid}`。③刷新 tunread 已清 | core | `implicit.unread.markAllRead` | `ThreadChat.tsx:65-75` |
| `thread.list.filter` | 搜索/筛选线程列表 | Threads 列表顶：搜索框 和/或 All\|Following\|Unread | following/unread 需已订阅 + uid。`ThreadList.tsx:46-72,83-107` | `[读]` ①列表项减少；`ResultsLiveRegion` 更新。②threads 列表 query。③`localStorage thread-list-type` | core | `thread.panel.openFromList` | `ThreadList.tsx:46-72,129+` |

本表数据行：**10**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B8 Room header（非 toolbox）

**SKIP**：`RoomTitle` 点击 → `openTab('channel-settings'|'team-info'|…)`，toolbox 独占（`RoomTitle.tsx:17-34`）。主题只读 Markdown 无点击。E2E/翻译徽章只展示。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.header.toggleFavorite` | 收藏/取消收藏房间 | 点 header star（`title=Favorite {name}` / `Unfavorite {name}`） | `Favorite_Rooms=true` 且 `room.t∈{c,p,d,t}` 且已订阅。`Favorite.tsx:16,29-31` | `[读]` ①icon `star`↔`star-filled`；toast 加入/移出收藏。②`POST /v1/rooms.favorite`。③刷新后星标仍在 | core+setting | — | `Favorite.tsx:16-39`；`useToggleFavoriteMutation.ts:14-19` |
| `implicit.header.addTopicLink` | 无主题时从 header 去加主题 | 点 header 链接 `Add_topic` | `canEdit && (public\|\|private)` 且无 topic。`RoomTopic.tsx:22-33` | `[读]` ①导航 `{route}/channel-settings` 或 `/team-info`（落地 toolbox 编辑）。②随后保存走 `rooms.saveRoomSettings`。③主题刷新后 header 变为 Markdown | core+permission | `implicit.editRoomInfo.save` | `RoomTopic.tsx:28-33` |
| `implicit.header.parentRoomBack` | 从讨论回到父房间 | 点 header 返回 `Back_to__roomName__channel` | 讨论有 prid。`ParentDiscussion.tsx:28-32` | `[读]` ①路由切到父房间。②房间订阅数据。③刷新停在父房间 | core | — | `ParentDiscussion.tsx:28-32` |

本表数据行：**3**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B9 Unread jump bar

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.unread.jumpToFirst` | 跳到第一条未读 | 未读 Bubble（arrow-up，文案 `unread_messages_counter`）→ 点气泡本体 | `unread.count>0` 且已订阅。`RoomBody.tsx:177-182`；`useUnreadMessages.ts:61-78` | `[读]` ①bar 消失；列表滚到该消息；URL `?msg=` jumpToUnread。②`readStateManager.markAsRead()`（subscriptions 已读）。③刷新后未读计数按 server ls | core | `implicit.unread.markAllRead` | `UnreadMessagesIndicator.tsx:23-30` |
| `implicit.unread.markAllRead` | 把未读条关掉并标已读 | 未读 Bubble 的 dismiss（`aria-label=Mark_as_read`） | 同上 | `[读]` ①bar 消失，不跳转。②`markAsRead()`。③刷新无未读条 | core | `shortcut.global.markAllAsRead.documented-unbound` | `UnreadMessagesIndicator.tsx:25-27`；`useUnreadMessages.ts:80-83` |

本表数据行：**2**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B10 Keyboard shortcuts

帮助 modal 文档 9 条（`KeyboardShortcutsModal.tsx` `id:` **9**）。其中搜索属 navbar OUT；光标到行首/行尾是浏览器 textarea 原生，无 RC handler。本表只登记 **房间内已绑定** + **文档有但 client 无绑定的 mark-all**（可测「按了不发生」）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `shortcut.composer.send` | 按发送和弦发出消息 | 焦点 textarea → Enter（normal）或 Ctrl/Cmd/Alt/Shift+Enter（alternative） | 同 `composer.send.enter-behavior` | `[读]` ①同 `composer.send`。②同 send endpoint。③同 send | core+preference | `composer.send` | `MessageBox.tsx:221-233` |
| `shortcut.composer.newLine` | 插入换行而不发送 | normal：Shift+Enter；alternative：裸 Enter | 同左 | `[读]` ①textarea 多一行。②无 REST。③随草稿 | core+preference | `composer.send.enter-behavior` | `MessageBox.tsx:224-230` |
| `shortcut.composer.escape` | Esc 退出编辑或空内容回调 | 编辑中或空 textarea → Escape | `closeEditing` 若有 mid；空则 `onEscape`。`MessageBox.tsx:245-248` | `[读]` ①编辑 hint/Cancel 消失或线程面板关。②无 REST。③不持久 | core | `thread.composer.escapeLeave` | `MessageBox.tsx:245-248` |
| `shortcut.composer.prevMessage` | 光标在行首时 ↑ 编辑上一条自己的消息 | 光标 `selectionEnd===0` → ArrowUp | `canSend`；存在可编辑历史 | `[读]` ①textarea 填入上条；hint Editing_message；Cancel 出现。②无 REST（本地消息缓存）。③刷新不保持编辑 | core | `composer.edit.cancel` | `MessageBox.tsx:251-260` |
| `shortcut.composer.nextMessage` | 光标在文末时 ↓ 下一条可编辑 | `selectionEnd===length` → ArrowDown | 正在编辑链中 | `[读]` ①内容切到下一条或退出编辑。②无 REST。③不持久 | core | `shortcut.composer.prevMessage` | `MessageBox.tsx:266-276` |
| `shortcut.composer.formatBold` | Ctrl/Cmd+B 加粗 | 选区或光标处 → Ctrl+B（Win）/ Cmd+B（Mac） | `handleFormattingShortcut` 找到 `command==='b'`。`MessageBox.tsx:59-76` | `[读]` ①包 `*…*`。②无 REST。③随草稿 | core | `composer.format.bold` | `messageBoxFormatting.ts:39` |
| `shortcut.composer.formatItalic` | Ctrl/Cmd+I 斜体 | Ctrl/Cmd+I | `command==='i'` | `[读]` ①包 `_…_`。②无 REST。③随草稿 | core | `composer.format.italic` | `messageBoxFormatting.ts:45` |
| `shortcut.composer.focusOnType` | 在非输入控件敲可打印键时拉回 composer | 点消息列表空白 → 敲字母/退格（非 Ctrl/Cmd） | 非 touch 才 autofocus 挂载；目标不能是 input/textarea/select。`useMessageBoxAutoFocus.ts:13-36` | `[读]` ①`textarea[name=msg]` 获焦并吃到该键。②无 REST。③无 | core | `composer.send` | `useMessageBoxAutoFocus.ts:13-36` |
| `shortcut.popup.navigateUp` | 补全弹层上移焦点 | popup 打开 → ArrowUp（无修饰键） | `useComposerBoxPopup` 有 option。`useComposerBoxPopup.ts:192-209` | `[读]` ①`aria-selected` 移到上一项，`aria-activedescendant=popup-item-*`。②无新 REST。③关 popup 即无 | core | `composer.popup.mention` | `useComposerBoxPopup.ts:192-209` |
| `shortcut.popup.navigateDown` | 补全弹层下移焦点 | ArrowDown | 同上 `:211-228` | `[读]` ①焦点下移循环。②无 REST。③无 | core | `shortcut.popup.navigateUp` | `useComposerBoxPopup.ts:211-228` |
| `shortcut.popup.select` | Enter/Tab 选中当前补全项 | popup 有 focused → Enter 或 Tab | `focused` 存在。`:181-190` | `[读]` ①popup 关；textarea 插入值。②mention/channel 可能已 spotlight。③随草稿 | core | `composer.popup.slash-command` | `useComposerBoxPopup.ts:181-190` |
| `shortcut.popup.dismiss` | Esc 关掉补全弹层 | popup 开 → Escape（默认 `closeOnEsc:true`） | `ComposerPopupContext.ts:37`；`:164-170` | `[读]` ①`role=menu` 消失；Esc 不冒泡到编辑取消。②无 REST。③无 | core | `shortcut.composer.escape` | `useComposerBoxPopup.ts:164-170` |
| `shortcut.messageList.tabToHeader` | 消息 listitem 上 Shift+Tab 回 header | 焦点在 `role=listitem` → Shift+Tab | `useMessageListNavigation.ts:40-47` | `[读]` ①焦点到 `.rcx-room-header` 第一可聚焦。②无 REST。③无 | core | `implicit.header.toggleFavorite` | `useMessageListNavigation.ts:40-47` |
| `shortcut.messageList.tabToComposer` | 线程/系统消息上 Tab 到 textarea | 焦点在 `.rcx-message-thread` 或 `.rcx-message-system` → Tab | `:48-55` | `[读]` ①焦点到 `TEXTAREA`。②无 REST。③无 | core | `thread.composer.reply` | `useMessageListNavigation.ts:48-55` |
| `shortcut.messageList.arrowNavigate` | 消息之间上下键移动焦点 | 焦点 listitem → ArrowUp/ArrowDown | `:58-67` | `[读]` ①相邻 `role=listitem` 获焦。②无 REST。③无 | core | `implicit.select.toggleMessage` | `useMessageListNavigation.ts:58-67` |
| `shortcut.history.loadMore` | 滚到顶/底或 PageUp 等加载更多历史 | 在消息滚动容器滚到顶 1/3 或底；或 PageUp/Down/Home/End 后触发 | `RoomHistoryManager.hasMore` / `hasMoreNext`。`useGetMore.ts:49-65,88-98` | `[读]` ①列表变长；可能短暂 loading。②历史订阅/load more。③刷新仍要重新拉 | core | `implicit.scroll.loadPrevious` | `useGetMore.ts:24-65` |
| `shortcut.global.showShortcutsModal` | Shift+? 打开快捷键说明 | 焦点不在 input/textarea/select/open dialog → `Shift+?` | `useKeyboardShortcutsHotkey.tsx:7-21,39-40` | `[读]` ①GenericModal `title=Keyboard_Shortcuts_Title` `dl[aria-label=…]`。②无 REST。③关后不持久 | core | `shortcut.global.markAllAsRead.documented-unbound` | `useKeyboardShortcutsHotkey.tsx:24-42`；`KeyboardShortcutsModal.tsx:94` |
| `shortcut.global.markAllAsRead.documented-unbound` | 帮助里写了标全已读，client 无绑定 | 打开快捷键 modal 看到 Mark_all_as_read → 关掉 → 在房间按 Shift+Esc（Mac）或 Ctrl+Esc（其他） | **无** `tinykeys`/keydown 绑定（全 `client` 仅 modal 文案）。`KeyboardShortcutsModal.tsx:32-34` | `[读]` ①modal 列出该和弦；按键后未读条**不**因此消失。②无 mark-all endpoint 被该键触发。③要用 B9 dismiss。`[待渲染实测]` 确认无遗漏全局 listener | core（文档） | `implicit.unread.markAllRead` | `KeyboardShortcutsModal.tsx:32-34` |

本表数据行：**18**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B11 Selection / 多选

进入点是 toolbox `ExportMessages` 调 `setIsSelecting(true)`（入口 OUT）。进入后的房间内操作在此。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.select.composerReplace` | 选择模式用计数条替换输入框 | Export Messages（toolbox）打开 → 看房间底部 | `useIsSelecting()`。`ComposerContainer.tsx:75-76` | `[读]` ①`MessageFooterCallout` `__count__messages_selected`；textarea 不出现。②无 REST。③关掉 export/清选择后恢复 | core | `implicit.select.clear` | `ComposerContainer.tsx:75-77`；`ComposerSelectMessages.tsx:15-28` |
| `implicit.select.toggleMessage` | 勾选/取消单条消息 | 选择模式下点消息、点 checkbox，或焦点 listitem 按 Space/Enter | `selecting===true`。`RoomMessage.tsx:82-98,109,136` | `[读]` ①checkbox `aria-label` 来自 `getCheckboxLabel`；`isSelected`。②无 REST。③store 仅内存，刷新清空 | core | `implicit.select.selectAll` | `RoomMessage.tsx:82-136` |
| `implicit.select.clear` | 清除全部选择 | 底栏 `Clear_selection` | `countSelected>0` 才可点。`ComposerSelectMessages.tsx:21-22` | `[读]` ①计数归 0；所有 checkbox 未勾。②无 REST。③无 | core | `implicit.select.composerReplace` | `SelectedMessagesContext.tsx:71-75` |
| `implicit.select.selectAll` | 全选当前已加载并滚到顶 | 底栏 `Select__count__messages` | `countAvailable>0`。`ComposerSelectMessages.tsx:24-25` | `[读]` ①计数=available；列表 `scrollTo({top:0})`。②无 REST。③仅已 mount 的 availableMessages | core | `implicit.select.toggleMessage` | `useSelectAllAndScrollToTop.ts:9-11` |

本表数据行：**4**。计数：`rg -c '^\| ` 对本节；见附录验算。

## B. 隐式交互层

### B12 额外隐式（房间视图、非注册表）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `implicit.scroll.newMessagesButton` | 不在底部时跳到新消息 | 他人发来新消息且自己未贴底 → 点底部 Bubble `New_messages` | `hasNewMessages && !atBottom`。`useHasNewMessages.ts:25-28,60-62`；`RoomBody.tsx:187` | `[读]` ①Bubble 消失；列表贴底；composer focus。②无 REST。③状态不持久 | core | `implicit.scroll.jumpToRecent` | `JumpToRecentMessageButton.tsx:41-55` |
| `implicit.scroll.jumpToRecent` | 正在看历史时跳回最新 | 有 `hasMoreNext`（从中间消息跳入）→ 点 `Jump_to_recent_messages` | `RoomHistoryManager.hasMoreNext`。`RoomBody.tsx:188-191` | `[读]` ①Bubble 淡出；历史缓存 clear 后贴底。②`getMoreIfIsEmpty`。③最新页刷新可见 | core | `shortcut.history.loadMore` | `useHasNewMessages.ts:31-35` |
| `implicit.scroll.loadPrevious` | 向上滚加载更早历史 | 用滚轮/触控把列表滚到顶部三分之一 | `hasMorePreviousMessages`。`useGetMore.ts:49-50` | `[读]` ①更早 listitem 出现。②RoomHistoryManager.getMore。③刷新重拉 | core | `shortcut.history.loadMore` | `useGetMore.ts:49-62` |
| `implicit.banner.announcementOpen` | 打开房间公告全文 | 点 header 下 AnnouncementBanner（或 Enter/Space）；点链接则跟链接 | `room.announcement` 且非 embedded。`RoomBody.tsx:164`；`RoomAnnouncement.tsx:34-59` | `[读]` ①GenericModal `title=Announcement` `Close`。②无 REST。③关后 banner 仍在（房间字段） | core | `implicit.editRoomInfo.save` | `RoomAnnouncement.tsx:18-60` |
| `implicit.banner.retentionWarning` | 展示保留策略将删消息的警告 | 打开启用 retention 的房间，看消息列表上方 | `retentionPolicy.isActive`。`RetentionPolicyWarning.tsx:15-20` | `[读]` ①`role=alert` `aria-label=Retention_policy_warning_banner`。②无 REST。③刷新仍在直到策略关 | core+setting | `implicit.editRoomInfo.save` | `RetentionPolicyWarning.tsx:15-20` |
| `implicit.recording.cancel` | 取消正在进行的语音录制 | 录音条 → title=`Cancel_recording`（circle-cross） | `isRecordingAudio`。`AudioMessageRecorder.tsx:77-79,118` | `[读]` ①`role=group` Audio_recorder 消失；textarea 恢复。②无 upload。③无文件 | core | `composer.action.audio-message` | `AudioMessageRecorder.tsx:77-79,116-118` |
| `implicit.recording.finish` | 完成录音并进入附件队列 | 录音条 → title=`Finish_recording`（circle-check） | 正在 recording 态。`AudioMessageRecorder.tsx:83-91,125` | `[读]` ①录音条关；出现 `Audio_record.mp3` chip。②`POST /v1/rooms.media/:rid`。③随发送 persist | core | `composer.action.audio-message` | `AudioMessageRecorder.tsx:83-91` |
| `implicit.composer.hint.editing` | 编辑态显示铅笔提示 | ↑ 进入编辑 | `isEditing`。`MessageBoxHint.tsx:36-37,49-54` | `[读]` ①hint 文案 `Editing_message` + 桌面 `Editing_message_hint`。②无 REST。③取消/发送后消失 | core | `composer.edit.cancel` | `MessageBoxHint.tsx:31-54` |
| `implicit.composer.hint.e2eeUnencrypted` | E2EE 房间密钥未就绪时提示将发明文 | 打开加密房间，E2E 允许明文，且 e2e 状态不是 READY/DISABLED | `E2E_Enable && E2E_Allow_Unencrypted_Messages && state∉{READY,DISABLED} && !editing && !ro`。`MessageBoxHint.tsx:22-29,42-43` | `[读]` ①hint `E2EE_Composer_Unencrypted_Message`。②无 REST。③密钥就绪后刷新消失 | core+setting | `composer.send` | `MessageBoxHint.tsx:22-43` |
| `implicit.layout.closeFlexTabOnClick` | 点消息区关闭侧栏 | 偏好 hideFlexTab 打开 → 开任意 toolbox 侧栏 → 点消息容器空白（非 button/link） | `useUserPreference('hideFlexTab')`。`RoomBody.tsx:59,126-154,170` | `[读]` ①contextualbar 关。②无 REST。③偏好刷新仍在；侧栏默认关 | core+preference | `thread.panel.close` | `RoomBody.tsx:59,126-154` |

本表数据行：**10**。计数：`rg -c '^\| ` 对本节；见附录验算。

本分册表体行合计 **117**；稳定 id（首次出现去重）**117**。

## 分册 04 — 路由注册目的地与壳层页面（供给/三件套已归一化）

下表已把 04 原文的 `界面/导航/持久化` 与 `core`/`EE:*` 改写成契约列。许可证仍在门控。

## 1. 登录 / 注册 / 向导

`/login` 路由本身立刻 `navigate('/home')`（`apps/meteor/client/startup/routes.tsx:136-142` `[读]`）。用户看见的登录页是 `MainLayout` → `AuthenticationCheck` 在无用户时渲染的 `LoginPage`，不是 `/login` 这个 URL。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `route.login` | 未登录用户打开登录表单并用账号密码（或登录服务）进入工作区 | ① 未登录访问需认证页（默认落到 `LoginPage`）② 或匿名可读时点顶栏 `Login`（`setForceLogin(true)`）③ 表单填用户名/邮箱+密码 → 提交 | 无用户；`Accounts_ShowFormLogin` 控制表单区；`Accounts_AllowAnonymousRead` 为真且未 `forceLogin` 时先不挡内容 `[读]` | (1) 登录表单 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：URL 仍常是 `/home` 而非 `/login` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 成功则建立会话；失败 toast/字段错误 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `Accounts_ShowFormLogin`；`Accounts_AllowAnonymousRead`；`forceLogin`；`/home`；`/login`。许可证/EE 见门控 | `route.register` `route.forgot-password` | `AuthenticationCheck.tsx:20-41` `LoginPage.tsx` `LoginForm.tsx:59-251` `NavBarItemLoginPage.tsx:8-16` `[读]` |
| `route.register` | 在登录壳内切到「创建账号」并提交注册 | 登录页页脚 `New here?` → `Create an account`（`setLoginRoute('register')`） | `Accounts_RegistrationForm`：`Public` 才走公开注册；`Secret URL` 时公开入口显示禁用页；`Disabled` 禁用 `[读]` | (1) 注册表单或禁用说明 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：仍无独立 Meteor path，是登录壳内状态 `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 成功则建用户+会话 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `Accounts_RegistrationForm`。许可证/EE 见门控 | `route.login` `route.register-secret-url` | `LoginForm.tsx:242-246` `RegisterSecretPageRouter.tsx:21-50` `[读]` |
| `route.forgot-password` | 在登录壳内申请密码重置邮件 | 登录页密码字段下 `Forgot your password?` | `Accounts_PasswordReset`（默认 true）为假则链不渲染 `[读]` | (1) 重置密码邮箱表单 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：登录壳内 `reset-password` 状态 `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 发重置邮件，不立刻改密 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `Accounts_PasswordReset`；`reset-password`。许可证/EE 见门控 | `route.reset-password` `route.login` | `LoginForm.tsx:88,219-229` `RegistrationPageRouter.tsx:36-41` `[读]` |
| `route.reset-password` | 用邮件里的 token 打开重置页并设置新密码 | 打开邮件链接 `/reset-password/:token` → 提交新密码 | 公开路由；token 无效时的 UI `[待渲染实测]` | (1) `ResetPasswordPage` `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/reset-password/:token` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 更新密码并通常转入登录 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `/reset-password/:token`。许可证/EE 见门控 | `route.forgot-password` | `startup/routes.tsx:230-233` `@rocket.chat/web-ui-registration` `[读]` |
| `route.setup-wizard` | 首次部署向导（组织/管理员） | 无用户且 `Show_Setup_Wizard==='pending'`，或 admin 且 `==='in_progress'` 时自动跳 `/setup-wizard`；完成后不可再进 | `Show_Setup_Wizard` ∈ {pending,in_progress,completed}；完成后/非 admin 被锁回 `/home` `[读]` | (1) `SetupWizardRoute` 分步页（不经 `MainLayout`）`[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/setup-wizard/:step?` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 写工作区设置并把向导标完成 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `Show_Setup_Wizard`；`/home`；`/setup-wizard/:step?`。许可证/EE 见门控 | `route.login` `route.home` | `startup/routes.tsx:215-218` `useRedirectToSetupWizard.ts:4-16` `packages/ui-client/.../useRouteLock.ts` `[读]` |
| `route.token-login` | 用一次性 login token 静默登录 | 打开 `/login-token/:token`（邮件/外链） | 公开；token 失败则 `navigate('/')` `[读]` | (1) 无自有 UI（`return null`）`[读]` [待渲染实测] 元素 role+name（导航：成功后 `/` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 建立会话 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `navigate('/')`；`/`。许可证/EE 见门控 | `route.login` | `startup/routes.tsx:225-228` `LoginTokenRoute.tsx:4-15` `[读]` |

本表数据行：**6**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 2. 已登录壳层目的地

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `route.home` | 打开工作区 Home（欢迎卡或自定义首页） | 桌面顶栏 Home 图标；或平板 `Pages` 堆叠菜单 → Home；登录后无 `defaultRoom` 时 `/` 也会落到 `/home` | 顶栏按钮：`Layout_Show_Home_Button`；页体：`Layout_Custom_Body_Only` 为真则只渲染自定义 Home `[读]` | (1) 欢迎文案+卡片（加用户/建频道/目录/客户端/文档）或自定义 HTML `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/home` `[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 打开本身不写库 `[读]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `Layout_Show_Home_Button`；`Layout_Custom_Body_Only`；`/home`。许可证/EE 见门控 | `route.directory` `directory.channels` | `startup/routes.tsx:149-156` `NavBarItemHomePage.tsx:8-22` `HomePage.tsx:6-13` `DefaultHomePage.tsx:16-48` `IndexRoute.tsx:12-28` `[读]` |
| `route.directory` | 打开目录页（再按默认 tab 纠正 URL） | 桌面顶栏 Directory 图标；或 Home 卡 `Open directory`；或直达 `/directory` | 页本身无权限门；无 tab / `external` 且联邦关则 replace 到 `Accounts_Directory_DefaultView`（默认 `users`）`[读]` | (1) 标题 Directory + 四个潜在 tab `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/directory` → `/directory/{defaultTab}` `[读]`） (2) [待渲染实测] endpoint（分册未写死 REST path） (3) 无 `[读]`；刷新后是否仍在 [待渲染实测] | READ `external`；`Accounts_Directory_DefaultView`；`users`；`/directory`；`/directory/{defaultTab}`。许可证/EE 见门控 | `directory.users` `directory.channels` `directory.teams` | `startup/routes.tsx:158-165` `NavBarItemDirectoryPage.tsx:10-24` `DirectoryPage.tsx:13-35` `JoinRoomsCard.tsx:11-22` `[读]` |
| `route.search` | 打开智能搜索结果页（跨房间来源+可选 AI 摘要） | 顶栏搜索（feature preview `aiSearch`）→ `View all results` → `/search?q=…` | 许可 `AI_LICENSE_MODULE` + preview `aiSearch` + 设置 `AI_Intelligent_Search_Enabled`；缺许可/开关时页上仍有 upsell/警告 `[读]` | (1) `Intelligent_Search` 页、来源列表、可选生成答案 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/search?q=` `[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 查询不写库；生成答案走 AI `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `AI_LICENSE_MODULE`；`aiSearch`；`AI_Intelligent_Search_Enabled`；`/search?q=`。许可证/EE 见门控 | — | `startup/routes.tsx:259-266` `SearchPage.tsx:15-22,68-161` `[读]` |
| `route.call-history` | 打开语音通话历史页 | 顶栏 VoIP 组时钟图标 `Call_history`；行点击进 `/call-history/details/:id` | 顶栏组：`useMediaCallAction()` 为空则整组不渲染（EE `teams-voip` + 语音权限）`[读]`；路由始终注册 | (1) 通话历史表；详情 contextual bar `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/call-history/:tab?/:historyId?` `[读]`） (2) GET /v1/call-history.list (3) `GET /v1/call-history.list` 只读 `[读]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `teams-voip`；`/call-history/:tab?/:historyId?`；`GET /v1/call-history.list`。接口 GET /v1/call-history.list。许可证/EE 见门控 | — | `startup/routes.tsx:250-257` `NavBarVoipGroup.tsx:10-23` `CallHistoryPage.tsx` `[读]` |
| `route.not-found` | 未匹配路径显示 404 | 访问未注册 path（`*`） | 无 | (1) `NotFoundPage` `[待渲染实测]`；元素 role+name [待渲染实测]（导航：任意未匹配 URL `[读]`） (2) [待渲染实测] endpoint（分册未写死 REST path） (3) 无 `[读]`；刷新后是否仍在 [待渲染实测] | READ `NotFoundPage`。许可证/EE 见门控 | — | `startup/routes.tsx:268-271` `[读]` |

本表数据行：**5**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 3. `directory.*`

`federationEnabled` 在源码写死 `false`（`DirectoryPage.tsx:17` `[读]`），External 页签当前不可见。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `directory.channels` | 在目录里浏览/搜索频道并点进房间 | `route.directory` → 点 `Channels` 页签 → 表格行 | tab：`view-c-room`，否则 `NotAuthorizedPage` `[读]` | (1) 频道表；无权限则未授权页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/directory/channels` `[读]`） (2) GET /v1/directory (3) `GET /v1/directory` 只读；行点击进 `/channel/:name` 或 `/group/:name`（进房交房间分册）`[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `view-c-room`；`/directory/channels`；`GET /v1/directory`；`/channel/:name`；`/group/:name`。接口 GET /v1/directory。许可证/EE 见门控 | `route.directory` | `DirectoryPage.tsx:43-59` `ChannelsTab.tsx:6-13` `[读]` |
| `directory.users` | 在目录里浏览/搜索用户并开 DM | `route.directory` → 点 `Users` 页签 → 表格行 | `view-outside-room` **且** `view-d-room`；邮箱列另需 `view-full-other-user-info` `[读]` | (1) 用户表 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/directory/users` `[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 只读列表；行点击走 `direct` 房间（交房间分册）`[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `view-outside-room`；`view-d-room`；`view-full-other-user-info`；`/directory/users`；`direct`。许可证/EE 见门控 | `route.directory` | `DirectoryPage.tsx:46-60` `UsersTab.tsx:10-18` `[读]` |
| `directory.teams` | 在目录里浏览/搜索团队并打开团队主房间 | `route.directory` → 点 `Teams` 页签 → 表格行 | `view-c-room` `[读]` | (1) 团队表 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/directory/teams` `[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 只读；行点击进团队主房间 `channel`/`group`（交房间分册）`[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `view-c-room`；`/directory/teams`；`channel`；`group`。许可证/EE 见门控 | `route.directory` `team.create` | `DirectoryPage.tsx:49-61` `TeamsTab.tsx:6-13` `[读]` |
| `directory.external` | 联邦「外部用户」目录页签 | 源码在 `federationEnabled===true` 时才渲染页签；**当前写死 false** | 与 `directory.users` 相同权限，外加联邦开关 `[读]` | (1) 当前不渲染页签 `[读]` [待渲染实测] 元素 role+name（导航：若 tab=external 会被 replace 回默认 tab `[读]`） (2) [待渲染实测] endpoint（分册未写死 REST path） (3) 无 `[读]`；刷新后是否仍在 [待渲染实测] | READ：门控里的设置/权限/路由参数 [读]（分册原写 core/EE；许可证见门控） | `directory.users` | `DirectoryPage.tsx:17,30-32,52-62` `[读]` |

本表数据行：**4**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 4. `account.*`

`/account`（`account-index`）replace 到 `/account/profile`（`AccountRouter.tsx:16-24` `[读]`）。侧栏由 `AccountSidebar` 经 portal 替换房间列表 `[读]`。顶栏用户菜单只直达 Profile / Preferences / Accessibility /（条件）Feature preview。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `account.profile` | 打开并编辑自己的资料（名/用户名/邮箱/头像；可登出其他端、删号） | 顶栏头像 → `Profile`（`/account`→profile）；或账号侧栏 `Profile` | 侧栏：`Accounts_AllowUserProfileChange`（peek 默认 true）；删号：`Accounts_AllowDeleteOwnAccount` `[读]` | (1) Profile 页+账号侧栏 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/account/profile` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 保存写用户文档；登出其他端/删号有确认框 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `Accounts_AllowUserProfileChange`；`Accounts_AllowDeleteOwnAccount`；`/account/profile`。许可证/EE 见门控 | `account.security` | `account/routes.tsx:57-59` `sidebarItems.tsx:13-17` `useAccountItems.tsx:14-47` `AccountProfilePage.tsx:25+` `[读]` |
| `account.preferences` | 打开并保存个人偏好（通知/声音/消息/本地化/高亮/在线；可选导出「我的数据」） | 顶栏头像 → `Preferences`；或账号侧栏 `Preferences` | 侧栏无门控；「我的数据」：`UserData_EnableDownload` `[读]` | (1) 手风琴分区+Save `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/account/preferences` `[读]`） (2) POST /v1/users.setPreferences (3) Save → `POST /v1/users.setPreferences`；打开不写 `[读]`；刷新后是否仍在 [待渲染实测] | READ `UserData_EnableDownload`；`/account/preferences`；`POST /v1/users.setPreferences`。接口 POST /v1/users.setPreferences。许可证/EE 见门控 | `account.accessibility-and-appearance` | `account/routes.tsx:52-54` `sidebarItems.tsx:19-22` `AccountPreferencesPage.tsx:20-69` `[读]` |
| `account.security` | 打开安全页：改密 / TOTP / 邮件 2FA / E2E 口令 | 账号侧栏 `Security`（用户菜单无此项） | 侧栏 OR：`Accounts_TwoFactorAuthentication_Enabled`（默认 true）\ | (1) `E2E_Enable`（默认 false）\ [待渲染实测] 元素 role+name (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) [待渲染实测] 刷新后是否仍在 | READ `Accounts_TwoFactorAuthentication_Enabled`；`E2E_Enable`。`Accounts_AllowPasswordChange`（默认 true）；分区再按对应设置裁剪 `[读]`。许可证/EE 见门控 | 界面: Security 手风琴 `[待渲染实测]` ／ 导航: `/account/security` `[读]` ／ 持久化: 改密/启用 2FA/E2E 各走对应 API `[待渲染实测]` | core | `account.profile` | `account/routes.tsx:62-64` `sidebarItems.tsx:24-31` `AccountSecurityPage.tsx:15-41` `[读]` |
| `account.integrations` | 查看并移除已关联的 WebDAV 账号 | 账号侧栏 `Integrations` | `Webdav_Integration_Enabled`（默认 false，侧栏 peek）`[读]` | (1) 选择 WebDAV 账号并 Remove `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/account/integrations` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 删除 WebDAV 集成记录 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `Webdav_Integration_Enabled`；`/account/integrations`。许可证/EE 见门控 | — | `account/routes.tsx:67-69` `sidebarItems.tsx:33-37` `AccountIntegrationsPage.tsx:14+` `[读]` |
| `account.tokens` | 创建/撤销个人访问令牌 | 账号侧栏 `Personal_Access_Tokens` | 权限 `create-personal-access-tokens` `[读]` | (1) PAT 表 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/account/tokens` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 创建/撤销 token `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `create-personal-access-tokens`；`/account/tokens`。许可证/EE 见门控 | — | `account/routes.tsx:72-74` `sidebarItems.tsx:39-43` `AccountTokensPage.tsx:6-16` `[读]` |
| `account.omnichannel` | 保存坐席侧全渠道偏好（关单后隐藏会话、PDF/邮件 transcript） | 账号侧栏 `Omnichannel` | `send-omnichannel-chat-transcript` OR `request-pdf-transcript` `[读]` | (1) Omnichannel 偏好页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/account/omnichannel` `[读]`） (2) POST /v1/users.setPreferences (3) Save → `POST /v1/users.setPreferences` `[读]`；刷新后是否仍在 [待渲染实测] | READ `send-omnichannel-chat-transcript`；`request-pdf-transcript`；`/account/omnichannel`；`POST /v1/users.setPreferences`。接口 POST /v1/users.setPreferences。许可证/EE 见门控 | `route.omnichannel` | `account/routes.tsx:77-79` `sidebarItems.tsx:45-49` `OmnichannelPreferencesPage.tsx:14-37` `[读]` |
| `account.feature-preview` | 开关实验功能（如 secondary sidebar、aiSearch） | 顶栏头像 → `Feature_preview`（有未读徽标时）；或账号侧栏 | `Accounts_AllowFeaturePreview` 且 `defaultFeaturesPreview.length>0` `[读]` | (1) 功能预览开关列表 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/account/feature-preview` `[读]`） (2) POST /v1/users.setPreferences (3) `POST /v1/users.setPreferences`；打开时若有 unseen 会记已读 `[读]`；刷新后是否仍在 [待渲染实测] | READ `Accounts_AllowFeaturePreview`；`defaultFeaturesPreview.length>0`；`/account/feature-preview`；`POST /v1/users.setPreferences`。接口 POST /v1/users.setPreferences。许可证/EE 见门控 | `route.search` `route.admin.feature-preview` | `account/routes.tsx:82-84` `sidebarItems.tsx:51-56` `useAccountItems.tsx:20-60` `AccountFeaturePreviewPage.tsx:28-40` `[读]` |
| `account.accessibility-and-appearance` | 改主题、字号、时间格式、是否显示角色 | 顶栏头像 → `Accessibility_and_Appearance`；或账号侧栏 | 侧栏无门控；角色显示受 `UI_DisplayRoles` `[读]` | (1) 无障碍与外观页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/account/accessibility-and-appearance` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) Save → `users.setPreferences`；字号会写 style 元素 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `UI_DisplayRoles`；`/account/accessibility-and-appearance`；`users.setPreferences`。许可证/EE 见门控 | `account.preferences` | `account/routes.tsx:87-89` `sidebarItems.tsx:58-61` `AccessibilityPage.tsx:30-37` `[读]` |
| `account.manage-devices` | 查看并登出自己的登录设备/会话 | 账号侧栏 `Manage_Devices`（许可证开启后才注册） | EE 模块 `device-management`（`onToggledFeature` 注册路由+侧栏）`[读]` | (1) 设备表 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/account/manage-devices` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 登出所选会话 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `device-management`；`/account/manage-devices`。许可证/EE 见门控 | `route.admin.device-management` | `startup/deviceManagement.ts:15-32` `DeviceManagementAccountPage.tsx:6-16` `[读]` |

本表数据行：**9**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 5. `team.*`

**没有** `/teams` 路由。团队主房间复用 `channel`/`group`。团队信息/频道/离开/删除/转频道是房间 toolbox，交其他分册。本册只写：目录浏览（上表 `directory.teams`）以及 **否则会漏的创建团队**（顶栏 `+` 菜单，无独立 route）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `team.create` | 用顶栏「新建」打开创建团队模态并建出团队主房间 | 顶栏 `+`（Create new）→ `Team` → 填名称等 → 提交 | 菜单项：`create-team` **且** (`create-c` OR `create-p`)；提交按钮再检 `create-team` `[读]` | (1) `CreateTeamModal` `[待渲染实测]`；元素 role+name [待渲染实测]（导航：成功后进入新团队主房间 URL（`channel`/`group`）`[待渲染实测]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 创建 team + 主房间 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `create-team`；`create-c`；`create-p`；`CreateTeamModal`；`channel`；`group`。许可证/EE 见门控 | `directory.teams` | `useCreateNewItems.ts:13-76` `CreateTeamModal.tsx:54,118+` `[读]` |

本表数据行：**1**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 6. 管理后台 — HOME + 侧栏项（不展开字段）

顶栏 `Manage`（齿轮）→ `Workspace` 进 `/admin`。`admin-index` 会 replace 到侧栏里 **第一个 `permissionGranted()` 为真的项**，否则 `/admin/workspace`（`AdministrationRouter.tsx:31-46` `[读]`）。侧栏头是 i18n `Administration`，**没有**单独的 Home 导航项。
`ADMIN_PERMISSIONS`（25 项）任一为真才出现 Workspace 菜单项（`useAdministrationMenu.ts:5-38` `[读]`）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `route.admin.home` | 打开管理后台壳并落到第一个有权侧栏页 | 顶栏 `Manage` → `Workspace` | `useAtLeastOnePermission(ADMIN_PERMISSIONS)` `[读]` | (1) 管理侧栏+默认页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin` → 第一有权 href（常 `/admin/info`）`[读]`） (2) [待渲染实测] endpoint（分册未写死 REST path） (3) 无 `[读]`；刷新后是否仍在 [待渲染实测] | READ `useAtLeastOnePermission(ADMIN_PERMISSIONS)`；`/admin`；`/admin/info`。许可证/EE 见门控 | `route.admin.workspace` | `useAdministrationMenu.ts:33-44` `AdministrationRouter.tsx:31-46` `admin/routes.tsx:118-122` `[读]` |
| `route.admin.workspace` | 打开工作区统计/信息页 | `route.admin.home` 或管理侧栏 `Workspace` | `view-statistics`；侧栏 href 是 `/admin/info`（deprecated fallback），另有 `/admin/workspace` `[读]` | (1) Workspace 页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/info` 或 `/admin/workspace` `[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 只读统计 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `view-statistics`；`/admin/info`；`/admin/workspace`。许可证/EE 见门控 | `route.admin.home` | `sidebarItems.ts:12-17` `admin/routes.tsx:129-137` `[读]` |
| `route.admin.subscription` | 打开订阅/Cloud 页 | 管理侧栏 `Subscription` | `manage-cloud` `[读]` | (1) Subscription 页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/subscription` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 以页内操作为准，本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `manage-cloud`；`/admin/subscription`。许可证/EE 见门控 | — | `sidebarItems.ts:18-23` `admin/routes.tsx:244-246` `[读]` |
| `route.admin.engagement` | 打开参与度仪表盘 | 管理侧栏 `Engagement` | 侧栏 `view-engagement-dashboard`；缺 EE 模块 `engagement-dashboard` 时路由层 upsell `[读]` | (1) Engagement 或 upsell `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/engagement/users`（侧栏）`[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 只读 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `view-engagement-dashboard`；`engagement-dashboard`；`/admin/engagement/users`。许可证/EE 见门控 | — | `sidebarItems.ts:24-29` `admin/routes.tsx:234-236` `[读]` |
| `route.admin.moderation` | 打开内容审核控制台 | 管理侧栏 `Moderation`（标 Beta） | `view-moderation-console` `[读]` | (1) Moderation 页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/moderation` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `view-moderation-console`；`/admin/moderation`。许可证/EE 见门控 | — | `sidebarItems.ts:30-36` `admin/routes.tsx:229-231` `[读]` |
| `route.admin.rooms` | 打开房间管理列表 | 管理侧栏 `Rooms` | `view-room-administration` `[读]` | (1) 房间管理 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/rooms` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `view-room-administration`；`/admin/rooms`。许可证/EE 见门控 | — | `sidebarItems.ts:37-42` `admin/routes.tsx:194-196` `[读]` |
| `route.admin.users` | 打开用户管理列表 | 管理侧栏 `Users` | `view-user-administration` `[读]` | (1) 用户管理 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/users` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `view-user-administration`；`/admin/users`。许可证/EE 见门控 | `account.profile` | `sidebarItems.ts:43-48` `admin/routes.tsx:189-191` `[读]` |
| `route.admin.ai-center` | 打开 AI Center | 管理侧栏 `AI_Center`（标 Beta） | 侧栏：`view-privileged-setting` OR `edit-privileged-setting` OR `manage-selected-settings`；页内另检 AI 许可 `[读]` | (1) AI Center 或许可提示 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/ai-center` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `view-privileged-setting`；`edit-privileged-setting`；`manage-selected-settings`；`/admin/ai-center`。许可证/EE 见门控 | `route.search` | `sidebarItems.ts:49-56` `admin/routes.tsx:199-201` `[读]` |
| `route.admin.invites` | 打开邀请链接管理 | 管理侧栏 `Invites` | `create-invite-links` `[读]` | (1) Invites 页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/invites` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `create-invite-links`；`/admin/invites`。许可证/EE 见门控 | `route.invite` | `sidebarItems.ts:57-62` `admin/routes.tsx:204-206` `[读]` |
| `route.admin.user-status` | 打开自定义用户状态 | 管理侧栏 `User_Status` | `manage-user-status` `[读]` | (1) 自定义状态列表 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/user-status` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `manage-user-status`；`/admin/user-status`。许可证/EE 见门控 | — | `sidebarItems.ts:63-68` `admin/routes.tsx:179-181` `[读]` |
| `route.admin.permissions` | 打开权限/角色页 | 管理侧栏 `Permissions` | `access-permissions` OR `access-setting-permissions` `[读]` | (1) 权限矩阵 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/permissions` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `access-permissions`；`access-setting-permissions`；`/admin/permissions`。许可证/EE 见门控 | — | `sidebarItems.ts:69-74` `admin/routes.tsx:214-216` `[读]` |
| `route.admin.abac` | 打开 ABAC 管理 | 管理侧栏 `ABAC` | `abac-management` 且（`manage-abac-admin-settings` OR `manage-abac-admin-room-attributes` OR `manage-abac-admin-rooms` OR `view-abac-admin-audit`）；路由要 EE `abac` `[读]` | (1) ABAC 页或未授权 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/ABAC` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `abac-management`；`manage-abac-admin-settings`；`manage-abac-admin-room-attributes`；`manage-abac-admin-rooms`；`view-abac-admin-audit`；`abac`；`/admin/ABAC`。许可证/EE 见门控 | — | `sidebarItems.ts:75-87` `admin/routes.tsx:254-256` `[读]` |
| `route.admin.device-management` | 打开全工作区设备管理 | 管理侧栏 `Device_Management` | 侧栏 `view-device-management`；缺模块时 upsell `[读]` | (1) 设备管理或 upsell `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/device-management` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `view-device-management`；`/admin/device-management`。许可证/EE 见门控 | `account.manage-devices` | `sidebarItems.ts:88-93` `admin/routes.tsx:239-241` `[读]` |
| `route.admin.email-inboxes` | 打开 Email Inbox 管理 | 管理侧栏 `Email_Inboxes`（标 Alpha） | `manage-email-inbox` `[读]` | (1) Email Inboxes `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/email-inboxes` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `manage-email-inbox`；`/admin/email-inboxes`。许可证/EE 见门控 | — | `sidebarItems.ts:94-100` `admin/routes.tsx:219-221` `[读]` |
| `route.admin.mailer` | 打开工作区群发邮件 | 管理侧栏 `Mailer` | `access-mailer`（`hasAllPermission`）`[读]` | (1) Mailer 页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/mailer` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `access-mailer`；`hasAllPermission`；`/admin/mailer`。许可证/EE 见门控 | `route.mailer-unsubscribe` | `sidebarItems.ts:101-106` `admin/routes.tsx:164-166` `[读]` |
| `route.admin.third-party-login` | 打开第三方 OAuth 应用管理 | 管理侧栏 `Third_party_login` | `manage-oauth-apps` `[读]` | (1) OAuth apps `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/third-party-login` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `manage-oauth-apps`；`/admin/third-party-login`。许可证/EE 见门控 | `route.oauth-authorize` | `sidebarItems.ts:107-112` `admin/routes.tsx:169-171` `[读]` |
| `route.admin.integrations` | 打开传入/传出集成 | 管理侧栏 `Integrations` | `manage-outgoing-integrations` OR `manage-own-outgoing-integrations` OR `manage-incoming-integrations` OR `manage-own-incoming-integrations` `[读]` | (1) Integrations `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/integrations` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `manage-outgoing-integrations`；`manage-own-outgoing-integrations`；`manage-incoming-integrations`；`manage-own-incoming-integrations`；`/admin/integrations`。许可证/EE 见门控 | `account.integrations` | `sidebarItems.ts:113-124` `admin/routes.tsx:174-176` `[读]` |
| `route.admin.import` | 打开导入历史/向导入口 | 管理侧栏 `Import` | `run-import` `[读]` | (1) Import 历史（子路由 new/prepare/progress 不展开）`[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/import` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `run-import`；`/admin/import`。许可证/EE 见门控 | — | `sidebarItems.ts:125-130` `admin/routes.tsx:140-161` `[读]` |
| `route.admin.reports` | 打开日志/分析报告 | 管理侧栏 `Reports` | `view-logs` `[读]` | (1) View logs / analytic reports `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/analytic-reports` `[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 只读 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `view-logs`；`/admin/analytic-reports`。许可证/EE 见门控 | — | `sidebarItems.ts:131-136` `admin/routes.tsx:209-211` `[读]` |
| `route.admin.sounds` | 打开自定义声音 | 管理侧栏 `Sounds` | `manage-sounds` `[读]` | (1) Custom sounds `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/sounds` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `manage-sounds`；`/admin/sounds`。许可证/EE 见门控 | — | `sidebarItems.ts:137-142` `admin/routes.tsx:124-126` `[读]` |
| `route.admin.emoji` | 打开自定义 emoji | 管理侧栏 `Emoji` | `manage-emoji` `[读]` | (1) Custom emoji `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/emoji` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `manage-emoji`；`/admin/emoji`。许可证/EE 见门控 | — | `sidebarItems.ts:143-148` `admin/routes.tsx:184-186` `[读]` |
| `route.admin.feature-preview` | 打开工作区级功能预览 | 管理侧栏 `Feature_preview` | 侧栏：`defaultFeaturesPreview.length>0`；路由另要 `manage-cloud` `[读]` | (1) Admin feature preview `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/feature-preview` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `defaultFeaturesPreview.length>0`；`manage-cloud`；`/admin/feature-preview`。许可证/EE 见门控 | `account.feature-preview` | `sidebarItems.ts:149-154` `admin/routes.tsx:249-251` `[读]` |
| `route.admin.settings` | 打开设置组列表（**不**逐字段） | 管理侧栏 `Settings` | `view-privileged-setting` OR `edit-privileged-setting` OR `manage-selected-settings` `[读]` | (1) 设置组索引 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/admin/settings/:group?` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 本行只覆盖打开组列表；字段级见 05 Out of scope `[读]`；刷新后是否仍在 [待渲染实测] | READ `view-privileged-setting`；`edit-privileged-setting`；`manage-selected-settings`；`/admin/settings/:group?`。许可证/EE 见门控 | — | `sidebarItems.ts:155-161` `admin/routes.tsx:224-226` `[读]` |

本表数据行：**23**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 7. 市场 / 全渠道 / 审计 — 仅入口

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `route.marketplace` | 打开市场壳（默认 Explore 列表） | 顶栏 Marketplace 菜单 → `Explore`；或直达 `/marketplace`（`context=all` 会 replace 到 explore/list） | `access-marketplace` OR `manage-apps`；无权限渲染 `NotFoundPage`；顶栏项桌面非 mobile `[读]` | (1) 市场侧栏+Explore 列表 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/marketplace` → `/marketplace/explore/list` `[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 打开只读；App 安装页不展开 `[读]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `access-marketplace`；`manage-apps`；`NotFoundPage`；`/marketplace`；`/marketplace/explore/list`。许可证/EE 见门控 | — | `marketplace/routes.tsx:18-26` `MarketplaceRouter.tsx:12-32` `useMarketPlaceMenu.tsx:10-55` `NavBarPagesGroup.tsx:16-29` `[读]` |
| `route.omnichannel` | 打开全渠道管理壳（默认当前会话/联系中心） | 顶栏 `Manage` → `Omnichannel` | 菜单：`view-livechat-manager`；index replace 到 `omnichannel-current-chats` `[读]` | (1) 全渠道侧栏+默认 Current `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/omnichannel` → `/omnichannel/current` `[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 打开本身不写库 `[读]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `view-livechat-manager`；`omnichannel-current-chats`；`/omnichannel`；`/omnichannel/current`。许可证/EE 见门控 | `account.omnichannel` | `useAdministrationMenu.ts:38-48` `OmnichannelRouter.tsx:16-24` `omnichannel/routes.ts:102-106` `[读]` |
| `route.audit` | 打开消息审计页（Rooms/Users/DMs/Omnichannel tabs） | 顶栏 `Manage` → Audit 段 `Messages` | EE 模块 `auditing` 才 `defineRoutes`；页 `can-audit`；菜单同样要许可+许可证 `[读]` | (1) Audit 页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/audit/:tab?` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 查询审计日志，本行只覆盖打开 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `auditing`；`defineRoutes`；`can-audit`；`/audit/:tab?`。许可证/EE 见门控 | `route.audit-log` `route.security-logs` | `startup/audit.tsx:43-55` `useAuditMenu.ts:11-20` `[读]` |
| `route.audit-log` | 打开审计操作日志 | 顶栏 `Manage` → Audit → `Logs` | EE `auditing` + `can-audit-log` `[读]` | (1) Audit log 页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/audit-log` `[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 只读 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `auditing`；`can-audit-log`；`/audit-log`。许可证/EE 见门控 | `route.audit` | `startup/audit.tsx:57-66` `useAuditMenu.ts:22-26` `[读]` |
| `route.security-logs` | 打开安全日志 | 顶栏 `Manage` → Audit → `Security_logs` | EE `auditing` + `can-audit` `[读]` | (1) Security logs 页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/security-logs` `[读]`） (2) 打开本身无写接口 [读]；页内 REST [待渲染实测] 除非出处已写 (3) 只读 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `auditing`；`can-audit`；`/security-logs`。许可证/EE 见门控 | `route.audit` | `startup/audit.tsx:68-80` `useAuditMenu.ts:28-32` `[读]` |

本表数据行：**5**。计数：`rg -c '^\| ` 对本节；见附录验算。

## 8. 外链 / 协议 / OAuth / 会议

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `route.invite` | 用邀请 hash 校验并登录/入房 | 打开 `/invite/:hash` | 公开；校验失败显示过期文案；已登录则 `useInviteTokenMutation` 入房 `[读]` | (1) 有效则 `LoginPage`，无效则 Hero 错误 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/invite/:hash` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 已登录则加入房间 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `useInviteTokenMutation`；`/invite/:hash`。许可证/EE 见门控 | `route.login` `route.admin.invites` | `startup/routes.tsx:205-208` `InvitePage.tsx:12-47` `[读]` |
| `route.register-secret-url` | 用秘密注册 URL 打开注册 | 打开 `/register/:hash` | 已登录立刻去 `/home`；注册模式须为 Secret URL `[读]` | (1) `RegistrationPageRouter` `secret-register` `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/register/:hash` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 注册成功建用户 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `/home`；`RegistrationPageRouter`；`secret-register`；`/register/:hash`。许可证/EE 见门控 | `route.register` | `startup/routes.tsx:200-203` `SecretURLPage.tsx:5-19` `[读]` |
| `route.conference` | 打开会议落地页（允许访客） | 打开 `/conference/:id?callUrl=…` | `AuthenticationCheck guest`；缺 `callUrl` 的失败 UI `[待渲染实测]` | (1) `ConferencePage` 或错误 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/conference/:id` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 不在本行展开入会信令 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `AuthenticationCheck guest`；`callUrl`；`ConferencePage`；`/conference/:id`。许可证/EE 见门控 | — | `startup/routes.tsx:210-213` `ConferenceRoute.tsx:4-8` `[读]` |
| `route.mailer-unsubscribe` | 邮件一键退订工作区群发 | 打开 `/mailer/unsubscribe/:_id/:createdAt` | 公开；参数齐全即 POST `[读]` | (1) 成功/失败 Callout `[待渲染实测]`；元素 role+name [待渲染实测]（导航：该 path `[读]`） (2) POST /v1/mailer.unsubscribe (3) `POST /v1/mailer.unsubscribe` `[读]`；刷新后是否仍在 [待渲染实测] | READ `POST /v1/mailer.unsubscribe`。接口 POST /v1/mailer.unsubscribe。许可证/EE 见门控 | `route.admin.mailer` | `startup/routes.tsx:220-223` `MailerUnsubscriptionPage.tsx:8-46` `[读]` |
| `route.terms-of-service` | 打开服务条款 CMS 页 | 直达 `/terms-of-service`（注册/页脚链 `[待渲染实测]`） | 公开 | (1) `CMSPage` `Layout_Terms_of_Service` `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/terms-of-service` `[读]`） (2) [待渲染实测] endpoint（分册未写死 REST path） (3) 无 `[读]`；刷新后是否仍在 [待渲染实测] | READ `CMSPage`；`Layout_Terms_of_Service`；`/terms-of-service`。许可证/EE 见门控 | `route.privacy-policy` `route.legal-notice` | `startup/routes.tsx:186-188` `[读]` |
| `route.privacy-policy` | 打开隐私政策 CMS 页 | 直达 `/privacy-policy` | 公开 | (1) `CMSPage` `Layout_Privacy_Policy` `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/privacy-policy` `[读]`） (2) [待渲染实测] endpoint（分册未写死 REST path） (3) 无 `[读]`；刷新后是否仍在 [待渲染实测] | READ `CMSPage`；`Layout_Privacy_Policy`；`/privacy-policy`。许可证/EE 见门控 | `route.terms-of-service` | `startup/routes.tsx:191-193` `[读]` |
| `route.legal-notice` | 打开法律声明 CMS 页 | 直达 `/legal-notice` | 公开 | (1) `CMSPage` `Layout_Legal_Notice` `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/legal-notice` `[读]`） (2) [待渲染实测] endpoint（分册未写死 REST path） (3) 无 `[读]`；刷新后是否仍在 [待渲染实测] | READ `CMSPage`；`Layout_Legal_Notice`；`/legal-notice`。许可证/EE 见门控 | `route.terms-of-service` | `startup/routes.tsx:196-198` `[读]` |
| `route.oauth-authorize` | 第三方应用 OAuth 授权同意 | 外站重定向 `/oauth/authorize?client_id=&redirect_uri=` | 未登录先登录壳；已登录拉 OAuth app 后同意/拒绝 `[读]` | (1) 授权表或登录 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/oauth/authorize` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 授权码回跳 client `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `/oauth/authorize`。许可证/EE 见门控 | `route.admin.third-party-login` | `startup/routes.tsx:235-238` `OAuthAuthorizationPage.tsx:10-31` `[读]` |
| `route.oauth-error` | 显示 OAuth 错误页 | 失败回跳 `/oauth/error/:error` | 公开 | (1) 错误页 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/oauth/error/:error` `[读]`） (2) [待渲染实测] endpoint（分册未写死 REST path） (3) 无 `[读]`；刷新后是否仍在 [待渲染实测] | READ `/oauth/error/:error`。许可证/EE 见门控 | `route.oauth-authorize` | `startup/routes.tsx:240-243` `[读]` |
| `route.saml` | SAML IdP 回调后登录 | IdP 重定向 `/saml/:token` | 公开；`Meteor.loginWithSamlToken`；可能再跟邀请 `[读]` | (1) 短暂加载后进工作区 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/saml/:token` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 建立会话 `[待渲染实测]`（刷新：按该持久化是否写服务器推断，未渲染实测） | READ `Meteor.loginWithSamlToken`；`/saml/:token`。许可证/EE 见门控 | `route.login` `route.invite` | `startup/routes.tsx:245-248` `SAMLLoginRoute.tsx` `[读]` |
| `route.2fa` | OAuth/现代登录流的 2FA 挑战 | 登录流送到 `/2fa/:method/:challengeId` | 公开挑战页 | (1) 2FA 挑战 `[待渲染实测]`；元素 role+name [待渲染实测]（导航：`/2fa/:method/:challengeId` `[读]`） (2) [待渲染实测] endpoint（分册只写了界面/导航/持久化，未拆出请求） (3) 验证通过完成登录 `[待渲染实测]`；刷新后是否仍在 [待渲染实测] | READ `/2fa/:method/:challengeId`。许可证/EE 见门控 | `route.login` `account.security` | `startup/routes.tsx:144-147` `OAuthTwoFactorAuthenticationRouter.tsx` `[读]` |

本表数据行：**11**。计数：`rg -c '^\| ` 对本节；见附录验算。

本分册表体行合计 **64**；稳定 id（首次出现去重）**64**。

## 分册 06 — Room panel interiors

打开 **之后** 的房间面板内部。02 的 `room.toolbox.*` 只是开口，本册不回收那些主键。原文：[`06-room-panel-interiors.md`](06-room-panel-interiors.md)（[PR #9](https://github.com/jianwyao01/Rocket.Chat/pull/9)）。

## 表 A — Room Info / Team Info / live Room Info 壳层

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.info.close | 关掉 Room Info 侧栏 | `…→channel-settings→header ×` | 面板已开 | DOM: [读] `button` name=`Close`；dialog `Channel_info`/`Discussion_info` 关；endpoint: none `closeTab`；persist: [读] URL tab 清掉 | `RoomInfo.tsx:57` | `room.toolbox.channel-settings` | `ContextualbarClose.tsx:9` |
| room.info.kebab | 打开 Room Info 溢出菜单 | `…→Channel_info→More(kebab)` | `actions.items.length>2` `useSplitRoomActions.ts:16-17` | DOM: [读] 触发钮 `title=More`；菜单项 name=Hide/Leave/…；endpoint: none（打开菜单）；persist: 菜单刷新关 | `RoomInfo.tsx:68-74` | | `RoomInfo.tsx:69` |
| room.info.action.hide | 从侧栏隐藏本房间 | `…→Channel_info→Hide`（前两槽常为按钮，否则 More→Hide） | 始终列入 `useRoomActions` 第一项 | DOM: [读] 按钮/menuitem name=`Hide`；确认 dialog confirm=`Yes_hide_it` cancel=`Cancel` 勾选 `Hide_room`；endpoint: [读] `POST /v1/channels.close`\|`/v1/groups.close`\|`/v1/im.close`；persist: [读] subscription.`open=false`，刷新侧栏无此房；导 `/home` | `useRoomActions.ts:32-36` | `sidebar.roomMenu.hide` | `useHideRoomAction.tsx:23-88` |
| room.info.action.edit | 进入 EditRoomInfo | `…→Channel_info→Edit` | `useCanEditRoom`=`edit-room`；联邦另需 owner/mod `useCanEditRoom.ts:12-15` | DOM: [读] 按钮 name=`Edit`；dialog 标题切到 `Edit_channel`/`Edit_team`/`Edit_discussion`；endpoint: none（本地 `setIsEditing`）；persist: [读] 未保存刷新回只读 Info | `useRoomActions.ts:48-56` | | `RoomInfoRouter.tsx:23,35` |
| room.info.action.leave | 离开本房间 | `…→Channel_info→Leave` | `leave-c`/`leave-p` + `room.cl!==false` + 有订阅 `useRoomLeave.tsx:22` | DOM: [读] name=`Leave`；确认 dialog；endpoint: [读] `POST /v1/channels.leave`\|`/v1/groups.leave`\|`/v1/im.leave`；persist: [读] 成员身份刷新不在；`/home` | `useRoomActions.ts:58-66` | `sidebar.roomMenu.leave` | `useRoomLeave.tsx:12-58` |
| room.info.action.move-to-team | 把独立频道/组移进团队 | `…→More→Teams_move_channel_to_team` | `!federated && !teamId && !prid && canEdit` | DOM: [读] menuitem name=`Teams_move_channel_to_team`；随后 modal；endpoint: [读] `POST /v1/teams.addRooms`；persist: [读] `room.teamId` 刷新仍在 | `useRoomActions.ts:68-76` | `room.teamChannels.add-existing` | `useRoomMoveToTeam.tsx:9-38` |
| room.info.action.convert-to-team | 把频道/组转成团队 | `…→More→Teams_convert_channel_to_team` | `create-team` + canEdit + `!teamId` + `!prid` + `!federated` | DOM: [读] name=`Teams_convert_channel_to_team`；确认 `Convert`；endpoint: [读] `POST /v1/channels.convertToTeam` 或 `/v1/groups.convertToTeam`；persist: [读] 房间变 teamMain | `useRoomActions.ts:78-86` | | `useRoomConvertToTeam.tsx:9-47` |
| room.info.action.delete | 删除房间（团队主房走团队删除弹层） | `…→More→Delete`（danger 段） | `delete-{t}`（团队子房另加 `delete-team-channel/group`）且 `!federated` | DOM: [读] name=`Delete`；确认 modal；endpoint: [读] `POST /v1/rooms.delete` 或 `POST /v1/teams.delete`；persist: [读] 房间刷新不在；`/home` | `useRoomActions.ts:88-97` | | `useDeleteRoom.tsx:12-102` |
| room.info.action.enter | 从 Info 进入房间 | `…→Channel_info→Enter` | 仅当传入 `onClickEnterRoom` | DOM: [读] name=`Enter`；endpoint: 调用方导航；persist: 进房 URL | `useRoomActions.ts:38-46` | | `RoomInfoRouter.tsx:13,37-39` |
| room.info.action.enter.unwired | Enter 在当前房间头路径未接线 | 同上，但从 `RoomTitle`/`toolbox` 打开的 Info | 仓库内房间头 **未传** `onEnterRoom` | DOM: [读] **不出现** Enter；endpoint: none；persist: n/a | `RoomInfoRouter.tsx:13` | | `rg onEnterRoom` 无房间头调用 |
| room.info.team.close | 关掉 Team Info | `…→team-info→×` | 面板已开 | DOM: [读] `button` `Close`；dialog name=`Teams_Info` 关；endpoint: none；persist: URL tab 清 | `TeamsInfo.tsx:51` | `room.toolbox.team-info` | `TeamsInfo.tsx:50` |
| room.info.team.kebab | 打开 Team Info More | `…→Teams_Info→More` | items>2 | DOM: [读] `title=More`；endpoint: none；persist: 菜单刷新关 | `TeamsInfo.tsx:64-71` | | `useSplitRoomActions.ts:14-27` |
| room.info.team.action.hide | 隐藏团队主房 | `…→Teams_Info→Hide` | 始终第一项 | DOM: [读] name=`Hide`；确认同 hide 弹层；endpoint: [读] close by `room.t`；persist: 订阅 `open=false` | `useTeamActions.ts:24-28` | `room.info.action.hide` | `useHideRoomAction.tsx:23-88` |
| room.info.team.action.edit | 打开编辑团队（同一 EditRoomInfo） | `…→Teams_Info→Edit` | `edit-team-channel` on `room._id` | DOM: [读] name=`Edit`；dialog 标题 `Edit_team`；endpoint: none；persist: 未保存刷新回 Info | `useTeamActions.ts:30-38` | `room.info.action.edit` | `TeamsInfoWithData.tsx:14,18-25` |
| room.info.team.action.leave | 离开团队 | `…→Teams_Info→Leave` | hook 始终返回（权限检查被注释） | DOM: [读] name=`Leave`；`LeaveTeam` modal；endpoint: [读] `POST /v1/teams.leave`；persist: 成员刷新不在；`/home` | `useTeamActions.ts:40-48` | | `useLeaveTeam.tsx:9-44` |
| room.info.team.action.convert-to-channel | 团队改回独立频道 | `…→More→Convert_to_channel` | `edit-team-channel` | DOM: [读] name=`Convert_to_channel`；`ConvertToChannelModal`；endpoint: [读] `POST /v1/teams.convertToChannel`；persist: 不再是 teamMain | `useTeamActions.ts:50-58` | | `useConvertToChannel.tsx:9-48` |
| room.info.team.action.delete | 删除团队（含子房选择） | `…→More→Delete` | 同 `useDeleteRoom`；联邦隐藏 | DOM: [读] name=`Delete`；`DeleteTeamModal`；endpoint: [读] `POST /v1/teams.delete`；persist: 团队刷新不在 | `useTeamActions.ts:60-69` | `room.info.action.delete` | `useDeleteRoom.tsx:70-82` |
| room.info.team.view-channels | 从 Team Info 跳到团队频道列表 | `…→Teams_Info→View_channels` | `onClickViewChannels` 始终传入 | DOM: [读] `button` name=`View_channels`；dialog 标题改 `Team_Channels`；endpoint: none `openTab('team-channels')`；persist: [读] URL `tab=team-channels` | `TeamsInfo.tsx:124-131` | `room.toolbox.team-channels` | `TeamsInfoWithData.tsx:16` |
| room.info.live.close | 关掉 livechat Room Info | live `…→room-info→×` | `groups∈{live}` | DOM: [读] `button` `Close`；dialog name=`Room_Info`；endpoint: none；persist: URL tab 清 | `ChatsContextualBar.tsx:42` | `room.toolbox.room-info` | `ChatsContextualBar.tsx:18-21,39-42` |
| room.info.live.edit | 从只读 ChatInfo 进编辑 | `…→Room_Info→Edit` | 有订阅 **或** 自己是 servedBy **或** `save-others-livechat-room-info` | DOM: [读] `button` name=`Edit`；标题改 `edit-room`；endpoint: none（改 route context=edit）；persist: [读] URL `tab=room-info&context=edit` | `ChatInfo.tsx:70-88,174-176` | | `ChatInfo.tsx:174` |
| room.info.live.edit.denied | 无编辑权点 Edit | 同上但三权皆无 | `!subscription && !hasLocal && !hasGlobal` | DOM: [读] 仍渲染 Edit 按钮；toast `Not_authorized`；**不进**编辑表；endpoint: none；persist: 仍停在 info | `ChatInfo.tsx:71-73` | | `ChatInfo.tsx:70-74` |

本表数据行：**21**。计数见附录验算。

## 表 B — EditRoomInfo（一控件一行）

父路径：`房间头→工具栏→Room_Info/Teams_Info→Edit`。Save 统一 `POST /v1/rooms.saveRoomSettings`（归档另 `POST /v1/rooms.changeArchivationState`）。`encrypted` **无控件**，见边界。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.info.edit.back | 从编辑回到 Info | `…→Edit_*→Back` | 始终 | DOM: [读] `button` title=`Back`；dialog 标题回到 `Channel_info`/`Teams_Info`；endpoint: none `setIsEditing(false)`；persist: 未保存丢 | `EditRoomInfo.tsx:242` | | `ContextualbarBack.tsx:9` |
| room.info.edit.close | 从编辑关掉整栏 | `…→Edit_*→×` | 始终 | DOM: [读] `button` `Close`；dialog 消失；endpoint: none `closeTab`；persist: URL tab 清 | `EditRoomInfo.tsx:244` | `room.info.close` | `EditRoomInfoWithData.tsx:9-11` |
| room.info.edit.avatar.upload | 上传房间头像 | `…→Edit→Upload` | 联邦 disabled | DOM: [读] `button` label=`Upload` title=`Upload_user_avatar`；选文件后 dirty；endpoint: 待 Save `{roomAvatar}`；persist: [读] 保存后头像刷新仍在 | `RoomAvatarEditor.tsx:65-67` | | `EditRoomInfo.tsx:249-253` |
| room.info.edit.avatar.reset | 头像恢复默认 | `…→Edit→头像 trash` | disabled: `!roomAvatar \|\| federated` | DOM: [读] `button` title=`Accounts_SetDefaultAvatar`；清 `roomAvatar`；endpoint: 待 Save；persist: 保存后默认头像 | `RoomAvatarEditor.tsx:69-76` | | `RoomAvatarEditor.tsx:74` |
| room.info.field.name | 改房间/团队名 | `…→Edit→Name` | 字段始终画；`disabled=!canViewName`（`RoomSettingsEnum.NAME`） | DOM: [读] `textbox` label=`Name` required；校验 `Required_field`；endpoint: Save `{roomName}`，预检 `GET /v1/rooms.nameExists`；persist: [读] `room.name` 刷新仍在 | `EditRoomInfo.tsx:256-280` | | `EditRoomInfo.tsx:202-213` |
| room.info.field.topic | 改主题 | `…→Edit→Topic` | `canViewTopic`；ABAC `disabled` | DOM: [读] `textbox` label=`Topic` hint=`Displayed_next_to_name`；endpoint: `{roomTopic}`；persist: 刷新仍在 | `EditRoomInfo.tsx:282-297` | `room.header.topic-add` | `useEditRoomPermissions.ts:57` |
| room.info.field.announcement | 改公告 | `…→Edit→Announcement` | `canViewAnnouncement`；联邦/ABAC disabled | DOM: [读] `textbox` label=`Announcement` hint=`Information_to_keep_top_of_mind`；endpoint: `{roomAnnouncement}`；persist: 刷新仍在 | `EditRoomInfo.tsx:299-319` | | `EditRoomInfo.tsx:311` |
| room.info.field.description | 改描述 | `…→Edit→Description` | `canViewDescription`；联邦/ABAC disabled | DOM: [读] `textbox`(textarea) label=`Description`；endpoint: `{roomDescription}`；persist: 刷新仍在 | `EditRoomInfo.tsx:321-333` | | `EditRoomInfo.tsx:329` |
| room.info.field.type | 公/私切换 | `…→Edit→Private` | `canViewType`；disabled: `!canChangeType \|\| federated` | DOM: [读] `switch` label=`Private` hint=`Only_invited_people`/`Anyone_can_access`；endpoint: `{roomType}`；persist: `room.t` c↔p | `EditRoomInfo.tsx:335-361` | | `useEditRoomPermissions.ts:24-29,61` |
| room.info.edit.accordion.advanced | 展开高级设置 | `…→Edit→Advanced_settings` | `showAdvancedSettings`（只读/归档/加入码/系统消息任一可见） | DOM: [读] AccordionItem title=`Advanced_settings`；展开后下列开关出现；endpoint: none；persist: UI only | `EditRoomInfo.tsx:364-367` | | `EditRoomInfo.tsx:234-237` |
| room.info.field.read-only | 只读模式 | `…→Advanced→Read_only` | `canViewReadOnly`（broadcast 房间类型才露出）；联邦 disabled | DOM: [读] `switch` label=`Read_only` hint=`Read_only_field_hint_enabled/disabled`；endpoint: `{readOnly}`；persist: `room.ro` | `EditRoomInfo.tsx:372-393` | | `public.ts:28-29` |
| room.info.field.react-when-readonly | 只读时仍可反应 | `…→Advanced→React_when_read_only` | 仅 `readOnly===true` 时渲染；disabled `!canSetReactWhenReadOnly` | DOM: [读] `switch` label=`React_when_read_only` hint=`Anyone_can_react_to_messages`/`Only_authorized_users_can_react_to_messages`；endpoint: `{reactWhenReadOnly}`；persist: 刷新仍在 | `EditRoomInfo.tsx:395-418` | | `useEditRoomPermissions.ts:31,65` |
| room.info.field.archived | 归档/解档 | `…→Advanced→Room_archivation_state_true` | `canViewArchived`；开关使能需 `archive-room`/`unarchive-room`；DM 隐藏 | DOM: [读] `switch` label=`Room_archivation_state_true` hint=`New_messages_cannot_be_sent`；endpoint: [读] **另** `POST /v1/rooms.changeArchivationState`；persist: `room.archived` | `EditRoomInfo.tsx:420-443` | | `useArchiveRoom.ts:9-17` |
| room.info.field.join-code-required | 开关加入密码 | `…→Advanced→Password_to_access` | `canViewJoinCode`（私有组指令返回 false）；联邦 disabled | DOM: [读] `switch` label=`Password_to_access`；开则露出密码框；endpoint: Save `{joinCode}`；persist: 刷新仍需码 | `EditRoomInfo.tsx:445-456` | | `useEditRoomPermissions.ts:64` |
| room.info.field.join-code | 填写加入密码 | `…→Advanced→Reset_password` | `joinCodeRequired===true` | DOM: [读] password `textbox` placeholder=`Reset_password`；endpoint: `{joinCode}`；persist: 新码刷新有效 | `EditRoomInfo.tsx:457-466` | | `EditRoomInfo.tsx:174` |
| room.info.field.hide-sys-mes | 隐藏系统消息总开关 | `…→Advanced→Hide_System_Messages` | `canViewHideSysMes`；联邦 disabled | DOM: [读] `switch` label=`Hide_System_Messages`；endpoint: `{systemMessages:[]\|selected}`；persist: 刷新仍藏 | `EditRoomInfo.tsx:470-487` | | `EditRoomInfo.tsx:175-177` |
| room.info.field.system-messages | 多选要藏的系统消息类型 | `…→Advanced→Select_messages_to_hide` | 上项开着；disabled `!hideSysMes \|\| federated` | DOM: [读] MultiSelect `aria-label=Select_messages_to_hide` placeholder 同；选项=`MessageTypesValues` i18n；endpoint: `{systemMessages}`；persist: 刷新仍选 | `EditRoomInfo.tsx:488-502` | | `EditRoomInfo.tsx:496-498` |
| room.info.edit.accordion.prune | 展开房间级保留策略 | `…→Edit→Prune` | `edit-room-retention-policy` 且 setting `RetentionPolicy_Enabled` | DOM: [读] AccordionItem title=`Prune`；endpoint: none；persist: UI | `EditRoomInfo.tsx:512-513` | `room.toolbox.clean-history` | `EditRoomInfo.tsx:235-236` |
| room.info.field.retention-enabled | 开房间保留 | `…→Prune→RetentionPolicyRoom_Enabled` | 在 prune 手风琴内 | DOM: [读] `switch` label=`RetentionPolicyRoom_Enabled`；endpoint: `{retentionEnabled}`；persist: 刷新仍在 | `EditRoomInfo.tsx:515-525` | | `EditRoomInfo.tsx:522` |
| room.info.field.retention-override-global | 覆盖全局保留 | `…→Prune→RetentionPolicyRoom_OverrideGlobal` | disabled `!retentionEnabled` | DOM: [读] `switch` label=`RetentionPolicyRoom_OverrideGlobal`；开后露出 max-age 等；endpoint: `{retentionOverrideGlobal}`；persist: 刷新仍在 | `EditRoomInfo.tsx:527-537` | | `EditRoomInfo.tsx:534` |
| room.info.field.retention-max-age | 保留天数 | `…→Prune→RetentionPolicyRoom_MaxAge` | `retentionOverrideGlobal` | DOM: [读] `spinbutton` label=`RetentionPolicyRoom_MaxAge`；endpoint: `{retentionMaxAge}`；persist: 刷新仍在 | `EditRoomInfo.tsx:544-560` | | `EditRoomInfo.tsx:68-77` |
| room.info.field.retention-exclude-pinned | 保留时排除置顶 | `…→Prune→RetentionPolicyRoom_ExcludePinned` | override on | DOM: [读] `switch` label=`RetentionPolicyRoom_ExcludePinned`；endpoint: `{retentionExcludePinned}`；persist: 刷新仍在 | `EditRoomInfo.tsx:562-572` | | `EditRoomInfo.tsx:569` |
| room.info.field.retention-files-only | 只剪文件 | `…→Prune→RetentionPolicyRoom_FilesOnly` | override on | DOM: [读] `switch` label=`RetentionPolicyRoom_FilesOnly`；endpoint: `{retentionFilesOnly}`；persist: 刷新仍在 | `EditRoomInfo.tsx:574-584` | | `EditRoomInfo.tsx:581` |
| room.info.field.retention-ignore-threads | 不剪线程 | `…→Prune→RetentionPolicy_DoNotPruneThreads` | override on | DOM: [读] `switch` label=`RetentionPolicy_DoNotPruneThreads`；endpoint: `{retentionIgnoreThreads}`；persist: 刷新仍在 | `EditRoomInfo.tsx:586-596` | `room.prune.threads` | `EditRoomInfo.tsx:593` |
| room.info.edit.reset | 丢弃未保存编辑 | `…→Edit→Reset` | disabled `!isDirty \|\| isSubmitting` | DOM: [读] `button` name=`Reset`；表单回 defaultValues；endpoint: none；persist: 无 | `EditRoomInfo.tsx:609-610` | | `EditRoomInfo.tsx:609` |
| room.info.edit.save | 提交脏字段 | `…→Edit→Save` | disabled `!isDirty` | DOM: [读] `button` name=`Save`；toast `Room_updated_successfully`；关栏；endpoint: [读] `POST /v1/rooms.saveRoomSettings` + 可选 `POST /v1/rooms.changeArchivationState`；persist: [读] 房间字段刷新仍在 | `EditRoomInfo.tsx:612-613,155-199` | | `EditRoomInfo.tsx:150` |

本表数据行：**26**。计数见附录验算。

## 表 B2 — live RoomEdit 字段

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.info.live.field.topic | 改会话主题 | `…→edit-room→Topic` | 编辑态已开 | DOM: [读] `textbox` label=`Topic`；endpoint: 待 Save `POST /v1/livechat/room.saveInfo` `{topic}`；persist: ChatInfo 主题刷新仍在 | `RoomEdit.tsx:137-142` | | `RoomEdit.tsx:59,94-104` |
| room.info.live.field.tags | 改会话标签 | `…→edit-room→Tags` | 编辑态 | DOM: [读] Tags 控件（多选/输入）；endpoint: `{tags}`；persist: 刷新仍在 | `RoomEdit.tsx:144-146` | `room.quick.closeChat.form.tags` | `Tags.tsx` |
| room.info.live.field.sla | 选 SLA | `…→edit-room→SLA_Policy` | `slaPolicies.length>0` | DOM: [读] select label=`SLA_Policy`；endpoint: `{slaId}`；persist: 刷新仍在 | `RoomEdit.tsx:148-150` | | `useSlaPolicies` |
| room.info.live.field.priority | 选优先级 | `…→edit-room→Priority` | `priorities.length>0` | DOM: [读] select label=`Priority`；endpoint: `{priorityId}`；persist: 刷新仍在 | `RoomEdit.tsx:152-154` | `sidebar.roomMenu.priority` | `useOmnichannelPriorities` |
| room.info.live.field.custom | 填房间自定义字段 | `…→edit-room→(metadata 字段)` | `view-livechat-room-customfields` 或 `edit-livechat-room-customfields` | DOM: [读] `CustomFieldsForm` 运行时字段；endpoint: `{livechatData}`；persist: 刷新仍在 | `RoomEdit.tsx:133-135` | | `useCustomFieldsMetadata` |
| room.info.live.cancel | 取消编辑回只读 | `…→edit-room→Cancel` | 编辑态 | DOM: [读] `button` name=`Cancel`；标题回 `Room_Info`；endpoint: none；persist: 未保存丢 | `RoomEdit.tsx:158-160` | | `ChatsContextualBar.tsx:31-33` |
| room.info.live.save | 保存 live 房间信息 | `…→edit-room→Save` | disabled `!isFormValid \|\| !isFormDirty` | DOM: [读] `button` name=`Save`；toast `Saved`；endpoint: [读] `POST /v1/livechat/room.saveInfo`；persist: [读] 房间 info query 失效后刷新仍在 | `RoomEdit.tsx:162-170` | | `RoomEdit.tsx:59,104` |

本表数据行：**7**。计数见附录验算。

## 表 C — Members 列表内部

父：`room.toolbox.members-list`（c/p/team）或 `room.toolbox.user-info-group`（direct_multiple）。1:1 `user-info` **没有**本表列表。成员行动作与 02 `user.action.*` 同源 hook，**仍写新 id**，关联旧 id。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.members.close | 关成员栏 | `…→Members→×` | 已开 | DOM: [读] `button` `Close`；dialog name=`Members` 或 `Teams_members` 关；endpoint: none；persist: URL tab 清 | `RoomMembers.tsx:147` | `room.toolbox.members-list` | `RoomMembers.tsx:146` |
| room.members.search | 按用户名过滤 | `…→Members→Search_by_username` | 始终渲染 | DOM: [读] `textbox` `aria-label=Search_by_username` placeholder 同；debounce 800ms 重拉列表；endpoint: [读] `GET /v1/rooms.membersOrderedByRole` 或 `GET /v1/im.members` `filter`；persist: [读] 过滤词不持久；类型见下行 | `RoomMembers.tsx:150-158` | | `RoomMembersWithData.tsx:58` |
| room.members.filter-status | Online / All | `…→Members→Select` | 始终 | DOM: [读] Select 选项 `Online`/`All`；endpoint: 同上 + `status`；persist: [读] `localStorage['members-list-type']` | `RoomMembers.tsx:160-165` | | `RoomMembersWithData.tsx:37` |
| room.members.load-more | 滚到底加载下一页 | `…→Members→列表底部交叉` | `hasNextPage` | DOM: [读] `InfiniteListAnchor` 无独立 name；计数文案 `Showing_current_of_total`；endpoint: 同上 offset；persist: query cache | `RoomMembers.tsx:203` | | `InfiniteListAnchor.tsx:19-23` |
| room.members.empty | 过滤后无成员 | `…→Members` 且 `members.length===0` | `isSuccess` | DOM: [读] empty title=`No_members_found`；endpoint: 列表已空；persist: n/a | `RoomMembers.tsx:190` | | `RoomMembers.tsx:190` |
| room.members.error | 列表请求失败 | `…→Members` query error | `error` | DOM: [读] `Callout` danger 文案=`error.message`；无重试钮；endpoint: 失败的 members GET；persist: n/a | `RoomMembers.tsx:175-178` | | `RoomMembers.tsx:177` |
| room.members.denied.broadcast | broadcast 且无权限则整 tab 不出现 | 房间头工具栏找 Members | `room.broadcast && !view-broadcast-member-list` | DOM: [读] **工具栏无** Members/`Teams_members`；endpoint: hook 返回 undefined；persist: 刷新仍无 | `useMembersListRoomAction.ts:19-20` | `room.toolbox.members-list` | `useMembersListRoomAction.ts:18-21` |
| room.members.denied.federation | 非原生联邦隐藏成员 tab | 同上 | `isRoomFederated && !isRoomNativeFederated` | DOM: [读] 工具栏无 Members；endpoint: undefined；persist: 刷新仍无 | `useMembersListRoomAction.ts:23-25` | | `useMembersListRoomAction.ts:15-16,23-25` |
| room.members.invite-link | 打开邀请链接子页 | `…→Members→Invite_Link` | `!isDirect` 且 `canCreateInviteLinks && canAddUsers`；ABAC 则 disabled | DOM: [读] `button` `aria-label=Invite_Link` name=`Invite_Link`；进 INVITE 子页 title=`Invite_Users`（包装）；endpoint: 子页再 `POST /v1/findOrCreateInvite`；persist: 子页状态 | `RoomMembers.tsx:219-229` | | `RoomMembersWithData.tsx:48-51,135` |
| room.members.invite-link.denied.abac | ABAC 房邀请钮禁用 | 同上 | `room.abacAttributes` | DOM: [读] 按钮 disabled `title=Not_available_for_ABAC_enabled_rooms`；endpoint: 不导航；persist: n/a | `RoomMembers.tsx:224-225` | | `RoomMembersWithData.tsx:137` |
| room.members.add-users | 打开加用户子页 | `…→Members→Add` | `!isDirect` 且 `canAddUsers` | DOM: [读] `button` name=`Add`；dialog 标题改 `Add_users`；endpoint: none 至提交；persist: 子页 | `RoomMembers.tsx:231-234` | | `RoomMembersWithData.tsx:64-72,136` |
| room.members.add-users.denied | 无加人权则无 Add/Invite 脚 | `…→Members` 底栏 | `!canAddUsers` 或 `isDirect` | DOM: [读] **不渲染** footer；无拒绝文案；endpoint: n/a；persist: n/a | `RoomMembers.tsx:216` | | `RoomMembersWithData.tsx:135-136` |
| room.members.row.open-user-info | 点成员行开 UserInfo | `…→Members→行(aria-label=显示名)` | 列表有该行 | DOM: [读] 行 `aria-label={nameOrUsername}`；换成 UserInfo dialog；endpoint: [读] `GET /v1/users.info`；persist: 子页至 Back | `RoomMembersItem.tsx:70-87` | `user.card.see-full-profile` | `RoomMembersWithData.tsx:78-84` |
| room.members.row.kebab | 打开成员行 More | `…→Members→行→More` | `useUserInfoActions` 非空；空则 disabled | DOM: [读] `button` title=`More`；分段菜单；endpoint: none；persist: n/a | `RoomMembersItem.tsx:104-117` | | `RoomMembersActions.tsx:16-28` |
| room.members.action.direct-message | 对成员开 DM | `…→行 More 或 UserInfo→Direct_Message` | `create-d` 或已有订阅；`!embedded` | DOM: [读] name=`Direct_Message`；进 1:1 房；endpoint: 路由 `direct`；persist: 侧栏 DM 刷新仍在 | `useDirectMessageAction.ts:18-24` | `user.action.direct-message` | `useUserInfoActions.ts:95` |
| room.members.action.video-call | 对成员发起视频 | `…→Video_call` | 已有 DM；`!federated`；非自己；`VideoConf_Enable_DMs`；`call-management` | DOM: [读] title=`Video_call`；outgoing 弹层 [待渲染实测] 弹层 role；endpoint: [读] `POST /v1/video-conference.start`；persist: Calls 列表 | `useVideoCallAction.ts:39-64` | `user.action.video-call` | `useUserInfoActions.ts:96` |
| room.members.action.voice-call | 对成员发起语音 | `…→Voice_call__user_` | voip 可用；非联邦/拉黑/自己 | DOM: [读] name=`Voice_call__user_`；voip widget；endpoint: widget 信令；persist: Call_history [待渲染实测] | `useUserMediaCallAction.ts:42-55` | `user.action.voice-call` | `useUserInfoActions.ts:97` |
| room.members.action.add-to-room | 把非成员拉进房 | UserInfo（非列表行）→ add-to-room | `!isMember`；invite 权；非归档 | DOM: [读] name=`add-to-room`；toast `User_added`；endpoint: [读] `POST /v1/channels.invite`\|`/v1/groups.invite`；persist: 成员刷新在 | `useAddUserAction.ts:85-96` | `user.action.add-to-room` | `useUserInfoActions.ts:98` |
| room.members.action.set-owner | 授/撤 owner | `…→More→Set_as_owner`/`Remove_as_owner` | `isMember`；`set-owner`；`roomCanSetOwner`；自己与对端文案双态 | DOM: [读] name=`Set_as_owner`/`Remove_as_owner`；toast owner 文案；endpoint: [读] `POST /v1/channels.addOwner`\|`removeOwner` 或 groups；persist: 角色刷新仍在 | `useChangeOwnerAction.tsx:135-148` | `user.action.change-owner` | `useUserInfoActions.ts:99` |
| room.members.action.set-owner.federated | 联邦改 owner 先警告 | 同上且原生联邦 | `Federation.actionAllowed` | DOM: [读] 先 dialog title=`Warning`/`Federation_Matrix_losing_privileges` confirm=`Yes_continue`；再打同一 POST；persist: 同 | `useChangeOwnerAction.tsx:104-126` | | `useChangeOwnerAction.tsx:104-126` |
| room.members.action.set-leader | 授/撤 leader | `…→Set_as_leader`/`Remove_as_leader` | `set-leader` + `roomCanSetLeader`；DM 指令为 false | DOM: [读] 双态 name；endpoint: [读] `POST /v1/channels.addLeader`\|`removeLeader` 或 groups；persist: 角色刷新 | `useChangeLeaderAction.ts:58-69` | `user.action.change-leader` | `useUserInfoActions.ts:100` |
| room.members.action.set-moderator | 授/撤 moderator | `…→Set_as_moderator`/`Remove_as_moderator` | `set-moderator` + `roomCanSetModerator` | DOM: [读] 双态 name；endpoint: channels/groups `*Moderator`；persist: 角色刷新 | `useChangeModeratorAction.tsx:149-160` | `user.action.change-moderator` | `useUserInfoActions.ts:101` |
| room.members.action.set-moderator.federated | 联邦改 mod 先警告 | 同上且联邦 | 同联邦规则 | DOM: [读] 同 `Yes_continue` 警告 dialog；再 POST；persist: 同 | `useChangeModeratorAction.tsx:101-136` | | `useChangeModeratorAction.tsx:101-136` |
| room.members.action.moderation-console | 跳该用户审核台 | `…→Moderation_Action_View_reports` | `view-moderation-console` | DOM: [读] name=`Moderation_Action_View_reports`；离开房间；endpoint: 路由 `moderation-console?uid=`；persist: URL | `useRedirectModerationConsole.ts:21-26` | `user.action.moderation-console` | `useUserInfoActions.ts:102` |
| room.members.action.ignore | 忽略/取消忽略对端（非自己） | `…→Ignore`/`Unignore` | `roomCanIgnore`；`uid!==own`（自己不出现） | DOM: [读] name=`Ignore`/`Unignore`；toast `User_has_been_ignored`/`User_has_been_unignored`；endpoint: [读] `GET /v1/chat.ignoreUser`；persist: subscription.ignored | `useIgnoreUserAction.ts:46-57` | `user.action.ignore` | `useUserInfoActions.ts:103` |
| room.members.action.mute | 禁言/解禁 | `…→Mute_user`/`Unmute_user` | `mute-user` + `roomCanMute` | DOM: [读] Mute 先 danger dialog 文案=`The_user_wont_be_able_to_type_in_s` confirm=`Yes_mute_user`；Unmute 无弹层；endpoint: [读] `POST /v1/rooms.muteUser`\|`unmuteUser`；persist: `room.muted` | `useMuteUserAction.tsx:67-109` | `user.action.mute` | `useUserInfoActions.ts:104` |
| room.members.action.block | 1:1 拉黑（频道成员列表不出现） | UserInfo in 1:1 → Block/Unblock | `roomCanBlock` 仅 1:1 DM；`uid!==own` | DOM: [读] name=`Block`/`Unblock`；endpoint: [读] `POST /v1/im.blockUser`；persist: subscription.blocker | `useBlockUserAction.ts:45-54` | `user.action.block` | `direct.ts:48-50` |
| room.members.action.kick | 踢出/移出团队/撤销邀请 | `…→Remove_from_room`/`Remove_from_team`/`Revoke_invitation` | `remove-user` 或联邦可编辑；`roomCanRemove` | DOM: [读] 三选一 name；确认 `Yes_remove_user` 或团队向导；endpoint: [读] `POST /v1/channels.kick`\|`/v1/groups.kick` 或 `POST /v1/teams.removeMember`；persist: 成员刷新不在 | `useRemoveUserAction.tsx:83-142` | `user.action.remove` | `useUserInfoActions.ts:106` |
| room.members.action.ban | 封禁 | `…→Ban_user_from_room` | `ban-user` + `roomCanBan` | DOM: [读] name=`Ban_user_from_room`；dialog `Are_you_sure` / `The_user_will_be_banned_from__roomName__` confirm=`Yes_ban_user`；endpoint: [读] `POST /v1/rooms.banUser`；persist: 成员消失，Banned_Users 出现 | `useBanUserAction.ts:36-42` | `user.action.ban` `room.banned.unban` | `useBanUser.tsx:48-58` |
| room.members.action.report | 举报对端 | `…→Report` | `ownUserId!==uid` | DOM: [读] name=`Report`；`ReportUserModal` textarea label=`Report_reason` confirm=`Report`；endpoint: [读] `POST /v1/moderation.reportUser`；persist: 审核记录 | `useReportUser.tsx:33-53` | `user.action.report` | `ReportUserModal.tsx` |
| room.members.user-info.back | UserInfo 回到列表 | `…→UserInfo→Back` | 从列表点进（有 `onClickBack`） | DOM: [读] title=`Back`；回到 Members dialog；endpoint: none；persist: 列表 | `UserInfoWithData.tsx:98` | | `ContextualbarBack.tsx:9` |
| room.members.user-info.close | 从 UserInfo 关栏 | `…→UserInfo→×` | 始终 | DOM: [读] `Close`；整栏关；endpoint: none；persist: URL 清 | `UserInfoWithData.tsx:101` | `room.members.close` | `UserInfoWithData.tsx:101` |
| room.members.add.back | 加用户页返回列表 | `…→Add_users→Back` | 子页 | DOM: [读] title=`Back`；回 Members；endpoint: none；persist: n/a | `AddUsers.tsx:116` | | `AddUsers.tsx:116` |
| room.members.add.picker | 多选要加的人 | `…→Add_users→Choose_users` | 子页 | DOM: [读] 多选 label/placeholder=`Choose_users`；选项 `aria-label=username`；endpoint: [读] `GET /v1/users.autocomplete`；persist: 表单至提交 | `AddUsers.tsx:123-137` | | `UserAutoCompleteMultiple.tsx:97-122` |
| room.members.add.submit | 提交邀请（非联邦） | `…→Add_users→Add_users` | `isDirty`；非联邦 | DOM: [读] `button` name=`Add_users`；toast `Users_added`；回列表；endpoint: [读] `POST /v1/channels.invite`\|`/v1/groups.invite`；persist: 成员刷新在 | `AddUsers.tsx:165-167` | | `AddUsers.tsx:44-46,66-68` |
| room.members.add.submit.federated | 联邦加用户（先核 Matrix） | `…→Add_users→Add_users` | 原生联邦；`!isFederationBlocked` | DOM: [读] 同钮；可能先 `AddMatrixUsersModal` confirm=`Yes_continue`；toast `Users_invited`；endpoint: [读] `GET /v1/federation/matrixIds.verify` 再 invite；persist: 成员刷新 | `AddUsers.tsx:149-162` | | `useAddMatrixUsers` |
| room.members.add.external-denied | 非联邦房拒外部 Matrix id | 选择 `@external` 用户 | `!isFederated && user.startsWith('@')` | DOM: [读] `alert` `You_cannot_add_external_users_to_non_federated_room`；提交被 validate 拦住；endpoint: 不发 invite；persist: n/a | `AddUsers.tsx:127-128,139-143` | | `AddUsers.tsx:24,127-128` |
| room.members.add.unban-confirm | 加被封用户时先解封 | 提交且 API `error-user-is-banned` | 目标在 banned 列表 | DOM: [读] modal title=`User_is_banned` checkbox=`Yes_unban_user` confirm=`Add_users`；endpoint: [读] `POST /v1/rooms.unbanUser` 再 invite；persist: 不再 banned 且在成员 | `AddUsers.tsx:78-104` | `room.banned.unban` | `BannedUsersUnbanModal.tsx:62-71` |
| room.members.invite.back | 邀请页返回 | `…→Invite→Back` | 子页 | DOM: [读] title=`Back`；回列表；endpoint: none | `InviteUsersWrapper.tsx:24` | | `InviteUsersWrapper.tsx:24` |
| room.members.invite.copy | 复制邀请 URL | `…→Invite_Link 字段旁 copy` | 已有 linkText | DOM: [读] 图标钮（UrlInput endAddon）；toast `Copied`；endpoint: 链接来自 `POST /v1/findOrCreateInvite`；persist: 剪贴板；链接服务端仍在 | `InviteLink.tsx:27` | | `useClipboardWithToast.ts:11` |
| room.members.invite.edit | 打开编辑邀请参数 | `…→Edit_Invite` | `onClickEdit` | DOM: [读] `button` name=`Edit_Invite`；露出天数/次数；endpoint: none 至 Generate | `InviteLink.tsx:38` | | `InviteLink.tsx:36-39` |
| room.members.invite.expiration | 选过期天数 | `…→Expiration_(Days)` | 编辑态 | DOM: [读] Select label=`Expiration_(Days)` 选项 1/7/15/30/`Never`；endpoint: 待 Generate；persist: 新链接参数 | `EditInviteLink.tsx:48-58` | | `EditInviteLink.tsx:22-30` |
| room.members.invite.max-uses | 选最大使用次数 | `…→Max_number_of_uses` | 编辑态 | DOM: [读] Select label=`Max_number_of_uses` 5…100/`No_Limit`；endpoint: 待 Generate；persist: 新链接 | `EditInviteLink.tsx:62-73` | | `EditInviteLink.tsx:33-42` |
| room.members.invite.generate | 生成新邀请链接 | `…→Generate_New_Link` | dirty 且非 submitting | DOM: [读] `button` name=`Generate_New_Link`；toast `Invite_link_generated`；endpoint: [读] `POST /v1/findOrCreateInvite`；persist: 新 URL/过期刷新仍在 | `EditInviteLink.tsx:76-77` | | `InviteUsersWithData` |

本表数据行：**44**。计数见附录验算。

## 表 D — Files

父：`room.toolbox.uploaded-files-list`。dialog name=`Files`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.files.close | 关文件栏 | `…→Files→×` | 已开 | DOM: [读] `button` `Close`；dialog `Files` 关；endpoint: none；persist: URL 清 | `RoomFiles.tsx:74` | `room.toolbox.uploaded-files-list` | `RoomFiles.tsx:73` |
| room.files.search | 按文件名搜 | `…→Files→Search_Files` | 始终 | DOM: [读] `textbox` `aria-label=Search_Files`；debounce 400ms；endpoint: [读] `GET /v1/channels.files`\|`/v1/groups.files`\|`/v1/im.files` `name`；persist: 会话内 | `RoomFiles.tsx:77-85` | | `useFilesList.ts:28-38` |
| room.files.type-filter | 按类型过滤 | `…→Files→type Select` | 始终 | DOM: [读] 选项 `All`/`Images`/`Videos`/`Audios`/`Texts`/`Files`；endpoint: 同上 `typeGroup`；persist: [读] `localStorage['file-list-type']` | `RoomFiles.tsx:57-67,86-88` | | `RoomFilesWithData.tsx:15` |
| room.files.empty | 无文件 | 过滤后 0 条 | `isSuccess && length===0` | DOM: [读] empty title=`No_files_found`；endpoint: 已空；persist: n/a | `RoomFiles.tsx:99` | | `RoomFiles.tsx:99` |
| room.files.load-more | 滚动加载 | `…→Files_list` 到底 | 有下一页 | DOM: [读] list `aria-label=Files_list`（包装）；endpoint: 同 files GET offset++；persist: cache | `RoomFiles.tsx:102-108` | | `useFilesList.ts:72-75` |
| room.files.file-row-preview | 打开可预览图片画廊 | `…→预览图行` | MIME 可预览图 | DOM: [读] 行 `aria-label={filename}`；画廊 `dialog` `aria-label=Image_gallery`；endpoint: [读] `GET /v1/rooms.images`；persist: 覆盖层刷新关 | `ImageItem.tsx:17-40` | | `ImageGalleryProvider.tsx:25-34` |
| room.files.file-row-download | 点非预览行下载 | `…→非预览文件链接` | 非预览图 | DOM: [读] `link` `aria-label`/`title`={filename} `download`；endpoint: 文件 URL / E2E SW；persist: 本地文件 | `FileItem.tsx:32-48` | | `FileItem.tsx:32-48` |
| room.files.file-menu | 打开单文件 More | `…→行→More` | 每行 | DOM: [读] `button` `aria-label=More` `title=More`；endpoint: none | `FileItemMenu.tsx:90` | | `FileItemMenu.tsx:90` |
| room.files.file-menu-download | 菜单下载 | `…→More→Download` | 非（加密且无 SW） | DOM: [读] menuitem name=`Download`；endpoint: `download()` 或 SW `attachment-download`；persist: 本地 | `FileItemMenu.tsx:50-76` | | `FileItemMenu.tsx:50-76` |
| room.files.file-menu-download.denied | 加密无 SW 时 Download 禁用 | 同上 | `fileData.encryption && !serviceWorker` | DOM: [读] menuitem `Download` disabled；endpoint: no-op；persist: n/a | `FileItemMenu.tsx:35,75` | | `FileItemMenu.tsx:35` |
| room.files.file-menu-delete | 开始删文件 | `…→More→Delete` | `useMessageDeletionIsAllowed` | DOM: [读] menuitem name=`Delete`（danger）；打开确认；endpoint: 待确认 | `FileItemMenu.tsx:77-87` | | `useMessageDeletionIsAllowed.ts:7-59` |
| room.files.file-menu-delete.denied | 无权则无 Delete | `…→More` | 删除不允许 | DOM: [读] 菜单无 Delete；endpoint: n/a | `FileItemMenu.tsx:77-87` | | `FileItemMenu.tsx:77` |
| room.files.delete.confirm | 确认删除 | `…→Delete→modal Delete` | 上项允许 | DOM: [读] confirm `button` name=`Delete` body=`Delete_File_Warning`；endpoint: [读] `POST /v1/chat.delete` `{fileId}`；persist: 列表刷新不在 | `useDeleteFile.tsx:13-30` | | `useDeleteFile.tsx:13-30` |
| room.files.delete.cancel | 取消删除 | `…→modal Cancel` | modal 开 | DOM: [读] `button` name=`Cancel`；endpoint: none；persist: 文件仍在 | `useDeleteFile.tsx:27` | | `useDeleteFile.tsx:27` |

本表数据行：**14**。计数见附录验算。

## 表 E — Notifications preferences（每一开关/下拉一行）

父：`room.toolbox.push-notifications`。dialog name=`Notifications_Preferences`。Save：`POST /v1/rooms.saveNotification`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.notif.close | 关通知栏（不保存） | `…→Notifications_Preferences→×` | 须有 subscription | DOM: [读] `Close`；dialog 关；未保存丢；endpoint: none；persist: 旧偏好仍在 | `NotificationPreferences.tsx:38` | `room.toolbox.push-notifications` | `usePushNotificationsRoomAction.ts:9-14` |
| room.notif.turn-on | 总开关房间通知 | `…→Turn_ON` | 有订阅 | DOM: [读] `switch` label=`Turn_ON` desc=`Receive_alerts`；endpoint: Save `disableNotifications`；persist: 订阅刷新 | `NotificationPreferencesForm.tsx:25-30` | | `NotificationPreferencesWithData.tsx:67,77-80` |
| room.notif.mute-group-mentions | 静音 @all/@here | `…→Mute_Group_Mentions` | 同 | DOM: [读] `switch` label=`Mute_Group_Mentions`；endpoint: `muteGroupMentions`；persist: 刷新仍在 | `NotificationPreferencesForm.tsx:32-37` | | `NotificationPreferencesWithData.tsx:68` |
| room.notif.show-counter | 未读计数 | `…→Show_counter` | 同 | DOM: [读] `switch` label=`Show_counter` desc=`Display_unread_counter`；关后露出 mentions 行；endpoint: `hideUnreadStatus` 取反；persist: 刷新 | `NotificationPreferencesForm.tsx:39-45` | | `NotificationPreferencesWithData.tsx:69` |
| room.notif.show-mentions | 仅提及计数 | `…→Show_mentions` | 仅 `showCounter===false` | DOM: [读] `switch` label=`Show_mentions` desc=`Display_mentions_counter`；endpoint: `hideMentionStatus` 取反；persist: 刷新 | `NotificationPreferencesForm.tsx:46-58` | | `NotificationPreferencesWithData.tsx:70` |
| room.notif.desktop-section | 展开 Desktop 段 | `…→Desktop` | 始终 | DOM: [读] accordion 标题=`Desktop`；endpoint: none；persist: UI | `NotificationPreferencesForm.tsx:61` | | `NotificationByDevice.tsx:13-24` |
| room.notif.desktop-alert | Desktop 提醒级别 | `…→Desktop→Alerts` | 段展开 | DOM: [读] 下拉 label=`Alerts` 选项 `Default`/`All_messages`/`Mentions`/`Nothing`；endpoint: `desktopNotifications`；persist: 刷新 | `NotificationPreferencesForm.tsx:62-73` | | `NotificationPreferencesWithData.tsx:71` |
| room.notif.desktop-sound | Desktop 声音 | `…→Desktop→Sound` | 段展开 | DOM: [读] 下拉 label=`Sound` 选项 `None`/`Default`+自定义；endpoint: `audioNotificationValue`；persist: 刷新 | `NotificationPreferencesForm.tsx:76-90` | | `NotificationPreferencesWithData.tsx:72` |
| room.notif.play-sound | 试听声音 | `…→Sound→Play` | 段展开 | DOM: [读] `button` `aria-label=Play`；endpoint: none `customSound.play`；persist: n/a | `NotificationPreferencesForm.tsx:87` | | `NotificationPreferencesWithData.tsx:60-62` |
| room.notif.mobile-section | 展开 Mobile 段 | `…→Mobile` | 始终 | DOM: [读] 标题=`Mobile`；endpoint: none | `NotificationPreferencesForm.tsx:93` | | `NotificationByDevice.tsx:13-24` |
| room.notif.mobile-alert | Mobile 提醒级别 | `…→Mobile→Alerts` | 段展开 | DOM: [读] label=`Alerts` 同选项；endpoint: `mobilePushNotifications`；persist: 刷新 | `NotificationPreferencesForm.tsx:94-106` | | `NotificationPreferencesWithData.tsx:73` |
| room.notif.email-section | 展开 Email 段 | `…→Email` | 始终 | DOM: [读] 标题=`Email`；endpoint: none | `NotificationPreferencesForm.tsx:108` | | `NotificationByDevice.tsx:13-24` |
| room.notif.email-alert | Email 提醒级别 | `…→Email→Alerts` | 段展开 | DOM: [读] label=`Alerts`；endpoint: `emailNotifications`；persist: 刷新 | `NotificationPreferencesForm.tsx:109-121` | | `NotificationPreferencesWithData.tsx:74` |
| room.notif.reset | 还原未保存 | `…→Reset` | disabled `!isDirty` | DOM: [读] `button` name=`Reset`；endpoint: none；persist: n/a | `NotificationPreferences.tsx:45-47` | | `NotificationPreferences.tsx:45` |
| room.notif.save | 保存全部通知偏好 | `…→Save` | disabled `!isDirty` | DOM: [读] `button` name=`Save`；toast `Room_updated_successfully`；endpoint: [读] `POST /v1/rooms.saveNotification`；persist: [读] 订阅刷新仍在 | `NotificationPreferences.tsx:48-50` | | `NotificationPreferencesWithData.tsx:20-24,64-80` |

本表数据行：**15**。计数见附录验算。

## 表 F — Prune（字段 + 提交 + 取消 + 结果）

父：`room.toolbox.clean-history`。dialog name=`Prune_Messages`。联邦工具箱 disabled。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.prune.close | 关剪枝栏（取消） | `…→Prune_Messages→×` | `clean-channel-history`；联邦不可达 | DOM: [读] `Close`；表单丢；endpoint: none；persist: 消息未剪 | `PruneMessages.tsx:41` | `room.toolbox.clean-history` | `useCleanHistoryRoomAction.ts:14-31` |
| room.prune.newer-date | Newer than 日期 | `…→Newer_than date` | 同上 | DOM: [读] `input[type=date]` `aria-label` 含 `Newer_than`+`Date`；endpoint: 提交作 `oldest`；persist: 成功后消息刷新不在 | `PruneMessagesDateTimeRow.tsx:19` | | `PruneMessagesWithData.tsx:62-64` |
| room.prune.newer-time | Newer than 时间 | `…→Newer_than time` | 同上 | DOM: [读] `input[type=time]` `Newer_than`+`Time`；并入 `oldest` | `PruneMessagesDateTimeRow.tsx:20` | | `PruneMessagesDateTimeRow.tsx:20` |
| room.prune.older-date | Older than 日期 | `…→Older_than date` | 同上 | DOM: [读] date `Older_than`+`Date`；提交 `latest` | `PruneMessagesDateTimeRow.tsx:19` | | `PruneMessagesWithData.tsx:66-68` |
| room.prune.older-time | Older than 时间 | `…→Older_than time` | 同上 | DOM: [读] time `Older_than`+`Time` | `PruneMessagesDateTimeRow.tsx:20` | | `PruneMessagesDateTimeRow.tsx:20` |
| room.prune.users | 只剪所选用户 | `…→Only_from_users` | 同上 | DOM: [读] 多选 placeholder=`Please_enter_usernames`；endpoint: 预取 `GET /v1/users.autocomplete`，提交 `users`；persist: 成功后那些人消息刷新不在 | `PruneMessages.tsx:47-54` | | `PruneMessagesWithData.tsx:89` |
| room.prune.inclusive | 含边界时刻 | `…→Inclusive` | 同上 | DOM: [读] `checkbox` label=`Inclusive`；payload `inclusive` | `PruneMessages.tsx:57-64` | | `PruneMessagesWithData.tsx:83` |
| room.prune.pinned | 不剪置顶 | `…→RetentionPolicy_DoNotPrunePinned` | 同上 | DOM: [读] `checkbox` 该 label；payload `excludePinned` | `PruneMessages.tsx:67-74` | `room.info.field.retention-exclude-pinned` | `PruneMessagesWithData.tsx:85` |
| room.prune.discussion | 不剪讨论 | `…→RetentionPolicy_DoNotPruneDiscussion` | 同上 | DOM: [读] `checkbox` 该 label；payload `ignoreDiscussion` | `PruneMessages.tsx:77-84` | | `PruneMessagesWithData.tsx:87` |
| room.prune.threads | 不剪线程 | `…→RetentionPolicy_DoNotPruneThreads` | 同上 | DOM: [读] `checkbox` 该 label；payload `ignoreThreads` | `PruneMessages.tsx:87-94` | `room.info.field.retention-ignore-threads` | `PruneMessagesWithData.tsx:88` |
| room.prune.attached | 只剪文件 | `…→Files_only` | 同上 | DOM: [读] `checkbox` label=`Files_only`；payload `filesOnly` | `PruneMessages.tsx:97-104` | | `PruneMessagesWithData.tsx:86` |
| room.prune.submit | 打开确认剪枝 | `…→Prune` | 无 `validateText` | DOM: [读] `button` name=`Prune`；警告 Callout `Prune_Warning_*`；再出确认；endpoint: 待确认 | `PruneMessages.tsx:111-113` | | `PruneMessagesWithData.tsx:123-155` |
| room.prune.submit.disabled | 日期非法禁用 Prune | 同上 | `from>to`→`Newer_than_may_not_exceed_Older_than`；非法日期 `error-invalid-date` | DOM: [读] `button` disabled + warning Callout；endpoint: none | `PruneMessages.tsx:111` | | `PruneMessagesWithData.tsx:157-167` |
| room.prune.confirm | 确认执行剪枝 | `…→Prune→Yes_prune_them` | modal 开 | DOM: [读] confirm name=`Yes_prune_them` body=`Prune_Modal`；endpoint: [读] `POST /v1/rooms.cleanHistory`；persist: 消息/文件永久无；表单 reset | `PruneMessagesWithData.tsx:70-119` | | `PruneMessagesWithData.tsx:110-119` |
| room.prune.cancel | 取消确认 | `…→modal Cancel` | modal 开 | DOM: [读] `button` `Cancel`；endpoint: none；persist: 未剪 | `PruneMessagesWithData.tsx:113-114` | | `PruneMessagesWithData.tsx:113` |
| room.prune.result.success | 剪枝成功 toast | 确认之后 count>0 | API 成功 | DOM: [读] toast `__count__message_pruned` 或 `__count__file_pruned`；endpoint: 已 cleanHistory；persist: 刷新仍无那些消息 | `PruneMessagesWithData.tsx:70-107` | | `PruneMessagesWithData.tsx:70-107` |
| room.prune.result.empty | 范围内无东西可剪 | 确认之后 0 | API 成功但 0 | DOM: [读] toast `No_messages_found_to_prune`/`No_files_found_to_prune`；endpoint: cleanHistory 空；persist: 消息仍在 | `PruneMessagesWithData.tsx` | | `PruneMessagesWithData.tsx` |

本表数据行：**17**。计数见附录验算。

## 表 G — Export（字段 + 提交 + 取消 + 结果）

父：`room.toolbox.export-messages`。dialog name=`Export_Messages`。权限 `mail-messages`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.export.close | 关导出栏 | `…→Export_Messages→×` | `mail-messages` | DOM: [读] `Close`；清 message selection；endpoint: none；persist: 表单丢 | `ExportMessages.tsx:192` | `room.toolbox.export-messages` | `ExportMessages.tsx:126-128` |
| room.export.method | 选导出方式 | `…→Method` | 非 E2E | DOM: [读] Select label=`Method` 选项 `Send_email`/`Send_file_via_email`/`Download_file`；endpoint: 分支提交；persist: n/a | `ExportMessages.tsx:197-213` | | `ExportMessages.tsx:71-77` |
| room.export.method.e2e | E2E 房锁死 Download | 同上 | `room.encrypted` | DOM: [读] Select disabled 默认 `download`；endpoint: 仅本地下载路径 | `ExportMessages.tsx:45,60,208` | `room.info.e2ee` | `ExportMessages.tsx:208` |
| room.export.format | 选输出格式 | `…→Output_format` | email 时锁 HTML；download 无 HTML；file 无 PDF；PDF 需 `export-messages-as-pdf` | DOM: [读] Select label=`Output_format` placeholder=`Format` 选项 `HTML`/`JSON`/`PDF`；endpoint: 随 method；persist: n/a | `ExportMessages.tsx:215-243` | | `ExportMessages.tsx:80-101` |
| room.export.date-from | file 方式起始日 | `…→Date_From` | `type==='file'` | DOM: [读] date label=`Date_From`；endpoint: `rooms.export` `dateFrom` | `ExportMessages.tsx:245-255` | | `ExportMessages.tsx:166-167` |
| room.export.date-to | file 方式结束日 | `…→Date_to` | `type==='file'` | DOM: [读] date label=`Date_to`；endpoint: `dateTo` | `ExportMessages.tsx:257-266` | | `ExportMessages.tsx:167` |
| room.export.to-users | email 收件人（站内） | `…→To_users` | `type==='email'` | DOM: [读] 多选 label=`To_users`；endpoint: 预取 autocomplete，提交 `toUsers` | `ExportMessages.tsx:269-304` | | `ExportMessages.tsx:173-176` |
| room.export.additional-emails | 站外邮箱 | `…→To_additional_emails` | `type==='email'` | DOM: [读] `textbox` label=`To_additional_emails` placeholder=`Email_Placeholder_any`；endpoint: `toEmails` | `ExportMessages.tsx:305-349` | | `ExportMessages.tsx:177` |
| room.export.subject | 邮件主题 | `…→Subject` | `type==='email'` | DOM: [读] textarea label=`Subject` 默认 `Mail_Messages_Subject`；endpoint: `subject` | `ExportMessages.tsx:351-359` | | `ExportMessages.tsx:66,178` |
| room.export.messages-validation | 未选消息时挡住提交 | 点 Send/Download 且 type≠file | 主列表未选消息 | DOM: [读] `alert` `Mail_Message_No_messages_selected_select_all`；endpoint: 不发；persist: n/a | `ExportMessages.tsx:363-377` | | `ExportMessages.tsx:121-133` |
| room.export.reset | 重置表单 | `…→Reset` | dirty | DOM: [读] `button` `Reset`；endpoint: none | `ExportMessages.tsx:385-387` | | `ExportMessages.tsx:385` |
| room.export.submit.email | 邮件发出所选消息 | `…→Send` | email + 收件人 + ≥1 消息 | DOM: [读] `button` `Send`；toast `Your_email_has_been_queued_for_sending`；endpoint: [读] `POST /v1/rooms.export` type=email；persist: 队列在服务端 | `ExportMessages.tsx:388-389,173-180` | | `useRoomExportMutation.ts:7-16` |
| room.export.submit.file | 按日期排队文件邮件 | `…→Send` | `type==='file'` | DOM: [读] `Send`；同 toast；endpoint: [读] `POST /v1/rooms.export` type=file；persist: 邮件队列 | `ExportMessages.tsx:162-169` | | `useRoomExportMutation.ts:7-16` |
| room.export.submit.download-json | 本地下载 JSON | `…→Download` | download+json | DOM: [读] `button` `Download`；toast `Messages_exported_successfully`；endpoint: **无 REST** 本地 Messages；persist: 本机文件 | `ExportMessages.tsx:154-158` | | `useDownloadExportMutation.ts:18-67` |
| room.export.submit.download-pdf | 本地下载 PDF | `…→Download` | download+pdf + 权限 | DOM: [读] `Download`；同 toast；endpoint: 客户端 PDF；persist: 本机文件 | `ExportMessages.tsx:149-151` | | `useExportMessagesAsPDFMutation.tsx:192-194` |

本表数据行：**15**。计数见附录验算。

## 表 H — Threads

父：`room.toolbox.thread`。dialog name=`Threads`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.threads.close | 关线程列表 | `…→Threads→×` | `Threads_enabled` | DOM: [读] `Close`；dialog `Threads` 关；endpoint: none | `ThreadList.tsx:127` | `room.toolbox.thread` | `ThreadList.tsx:124-127` |
| room.threads.filter-search | 搜线程正文 | `…→Search_Messages` | 始终 | DOM: [读] `textbox` `aria-label=Search_Messages`；debounce 400ms；endpoint: [读] `GET /v1/chat.getThreadsList` `{text}`；persist: 不持久查询串 | `ThreadList.tsx:130-138` | | `useThreadsList.ts:75-81` |
| room.threads.filter-type | All / Following / Unread | `…→type Select` | Following/Unread 需订阅 | DOM: [读] 选项 `All`/`Following`/`Unread`；endpoint: 同上 `type`/`tunread`；persist: [读] `localStorage['thread-list-type']` | `ThreadList.tsx:55-72,139-145` | | `ThreadList.tsx:64` |
| room.threads.list-item | 打开线程详情 | `…→线程行` | 行存在 | DOM: [读] 可点行 `tabIndex=0`；URL `tab=thread&context=tmid`；详情头 `Following`/`Not_Following`；endpoint: none 导航；persist: URL tmid | `ThreadListItem.tsx:34-71` | | `useGoToThread.ts:16-23` |
| room.threads.follow-list | 列表行上关注/取关 | `…→行铃铛`（停冒泡） | 已登录 uid | DOM: [读] `title=Following`/`Not_following`；endpoint: [读] `POST /v1/chat.followMessage`\|`unfollowMessage`；persist: replies 刷新仍在 | `ThreadListMessage.tsx:81` | | `ThreadMetricsFollow.tsx:29-45` |
| room.threads.follow-detail | 详情头关注/取关 | `…→线程详情→铃` | 主消息 loaded | DOM: [读] `title=Following`/`Not_Following`；同一 follow/unfollow POST；persist: 同 | `Thread.tsx:124-128` | | `useToggleFollowingThreadMutation.ts:25-36` |
| room.threads.expand | 详情加宽/收起 | `…→详情→Expand`/`Collapse` | `canExpand` | DOM: [读] title=`Expand`/`Collapse`；endpoint: none 布局；persist: [读] **刷新不持久** | `Thread.tsx:117-123` | | `Thread.tsx:117-123` |
| room.threads.empty | 无线程 | 过滤后 0 | success+0 | DOM: [读] empty title=`No_Threads` | `ThreadList.tsx:162` | | `ThreadList.tsx:162` |

本表数据行：**8**。计数见附录验算。

## 表 I — Discussions

父：`room.toolbox.discussions`。dialog name=`Discussions`。联邦工具箱 disabled。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.discussions.close | 关讨论列表 | `…→Discussions→×` | `Discussion_enabled` 且 `!prid` | DOM: [读] `Close`；dialog `Discussions` 关 | `DiscussionsList.tsx:69` | `room.toolbox.discussions` | `DiscussionsList.tsx:66-69` |
| room.discussions.filter-search | 搜讨论 | `…→Search_Messages` | 有 userId 才渲染栏 | DOM: [读] `textbox` `aria-label=Search_Messages`；endpoint: [读] `GET /v1/chat.getDiscussions` `{text}` | `DiscussionsList.tsx:72-80` | | `useDiscussionsList.ts:39-44` |
| room.discussions.list-item | 跳进讨论房 | `…→讨论行` | 行有 `data-drid` | DOM: [读] 可点行；进讨论房；endpoint: 或 `GET /v1/rooms.info`；persist: 房间 URL | `DiscussionsList.tsx:56-62,104-106` | `nav.create.discussion` | `useGoToRoom.ts:19-37` |
| room.discussions.empty | 无讨论 | 0 条 | success+0 | DOM: [读] empty title=`No_Discussions_found` | `DiscussionsList.tsx:96` | | `DiscussionsList.tsx:96` |

本表数据行：**4**。计数见附录验算。

## 表 J — Mentions / Pinned / Starred / Search

消息工具栏全集在 01，本表只收 **列表壳 + jump + 本 tab 特有 unpin/unstar + empty**。dialog 标题：`Mentions` / `Pinned_Messages` / `Starred_Messages` / `Search_Messages`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.search.mentions.close | 关提及列表 | `…→Mentions→×` | groups channel/group/team | DOM: [读] `Close`；dialog 标题来自 tab title Mentions；endpoint: none | `MessageListTab.tsx:54` | `room.toolbox.mentions` | `MentionsTab.tsx` |
| room.search.mentions.empty | 无提及 | 0 条 | success+0 | DOM: [读] empty title=`No_mentions_found` | `MessageListTab.tsx:64` | | `MentionsTab.tsx:39` |
| room.search.mentions.jump | 跳到原消息 | `…→行工具栏→Jump_to_message` | 工具栏可见 | DOM: [读] `button` title=`Jump_to_message`；URL `?msg=`；endpoint: none；persist: 查询串刷新仍跳 | `JumpToMessageAction.tsx:16-22` | `msg.jump`（01） | `MentionsItems.tsx:14` |
| room.search.pinned.close | 关置顶列表 | `…→Pinned_Messages→×` | `Message_AllowPinning`；联邦 disabled | DOM: [读] `Close`；dialog `Pinned_Messages` | `MessageListTab.tsx:54` | `room.toolbox.pinned-messages` | `PinnedMessagesTab.tsx` |
| room.search.pinned.empty | 无置顶 | 0 | success+0 | DOM: [读] empty title=`No_pinned_messages` | `MessageListTab.tsx:64` | | `PinnedMessagesTab.tsx:40` |
| room.search.pinned.jump | 跳到置顶消息 | `…→Jump_to_message` | 工具栏 | DOM: [读] title=`Jump_to_message`；`?msg=` | `JumpToMessageAction.tsx:16-22` | | `PinnedItems.tsx:14` |
| room.search.pinned.unpin | 取消置顶 | `…→More→Unpin` | `pin-message`；已 pinned；非 omni | DOM: [读] menuitem `Unpin`；endpoint: [读] `POST /v1/chat.unPinMessage`；persist: 列表刷新不在 | `useUnpinMessageAction.ts:17-29` | 01 unpin | `useUnpinMessageMutation.ts:17-29` |
| room.search.starred.close | 关星标列表 | `…→Starred_Messages→×` | 无特别 setting | DOM: [读] `Close`；dialog `Starred_Messages` | `MessageListTab.tsx:54` | `room.toolbox.starred-messages` | `StarredMessagesTab.tsx` |
| room.search.starred.empty | 无星标 | 0 | success+0 | DOM: [读] empty title=`No_starred_messages` | `MessageListTab.tsx:64` | | `StarredMessagesTab.tsx:40` |
| room.search.starred.jump | 跳到星标消息 | `…→Jump_to_message` | 工具栏 | DOM: [读] title=`Jump_to_message`；`?msg=` | `JumpToMessageAction.tsx` | | `StarredItems.tsx:14` |
| room.search.starred.unstar | 取消星标 | `…→More→Unstar_Message` | `Message_AllowStarring`；自己已 star；非 omni | DOM: [读] menuitem `Unstar_Message`；endpoint: [读] `POST /v1/chat.unStarMessage`；persist: 列表刷新不在 | `useUnstarMessageAction.ts:14-31` | 01 unstar | `useUnstarMessageMutation.ts:18-29` |
| room.search.close | 关搜索栏 | `…→Search_Messages→×` | 含 live | DOM: [读] `Close`；dialog `Search_Messages` | 搜索 tab 壳 | `room.toolbox.rocket-search` | `MessageSearchTab` |
| room.search.filter-text | 输入搜索 | `…→Search_Messages 框` | provider 已 load | DOM: [读] `textbox` `aria-label=Search_Messages`；debounce 300ms；endpoint: [读] Meteor `rocketchatSearch.search`；persist: 查询串刷新 [待渲染实测] | `MessageSearchForm.tsx:56-63` | | `useMessageSearchQuery.ts:20-26` |
| room.search.global-toggle | 全局 vs 本房 | `…→Global_Search` | `provider.settings.GlobalSearchEnabled` | DOM: [读] `switch` label=`Global_Search`；endpoint: search `{searchAll}`；persist: 开关不写偏好 | `MessageSearchForm.tsx:68-72` | | `MessageSearchForm.tsx:48,68-72` |
| room.search.empty | 无结果 | 有关键词且 0 | success+0 | DOM: [读] empty/`No_results_found` | `MessageSearchTab.tsx:68` | | `MessageSearchTab.tsx:68` |
| room.search.jump | 从结果跳原消息 | `…→结果行→Jump_to_message` | 工具栏 | DOM: [读] title=`Jump_to_message`；`?msg=` | `SearchItems.tsx:14` | | `JumpToMessageAction.tsx:16-22` |
| room.search.encrypted-callout | E2E 房不能搜密文 | 打开搜索且 `room.encrypted` | encrypted | DOM: [读] warning Callout `Encrypted_RoomType` + `Encrypted_content_cannot_be_searched`；endpoint: 仍可搜非密文索引 [待渲染实测]；persist: n/a | `MessageSearchForm.tsx:74-78` | `room.info.e2ee` | `MessageSearchForm.tsx:74-78` |

本表数据行：**17**。计数见附录验算。

## 表 K — Team channels

父：`room.toolbox.team-channels`。dialog name=`Team_Channels`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.teamChannels.close | 关团队频道栏 | `…→Team_Channels→×` | team 房 | DOM: [读] `Close`；dialog `Team_Channels` 关 | `TeamsChannels.tsx:88` | `room.toolbox.team-channels` | `TeamsChannels.tsx:85-88` |
| room.teamChannels.filter-search | 搜频道名 | `…→Search` | 始终 | DOM: [读] `textbox` placeholder=`Search`；debounce 800ms；endpoint: [读] `GET /v1/teams.listRooms` `{filter}` | `TeamsChannels.tsx:91-97` | | `useTeamsChannelList.ts:23-29` |
| room.teamChannels.filter-type | All / Auto-join | `…→type Select` | 始终 | DOM: [读] 选项 `All`/`Team_Auto-join`；endpoint: `{type}`；persist: [读] `localStorage['channels-list-type']` | `TeamsChannels.tsx:61-67,98-100` | | `TeamsChannelsWithData.tsx:27` |
| room.teamChannels.empty | 团队无频道 | 0 条 | `!loading && length===0` | DOM: [读] empty title=`No_channels_in_team` | `TeamsChannels.tsx:108` | | `TeamsChannels.tsx:108` |
| room.teamChannels.load-more | 滚动加载 | 列表底 | `channels.length < total` | DOM: [读] `InfiniteListAnchor`；endpoint: listRooms offset | `TeamsChannels.tsx:126` | | `TeamsChannels.tsx:71-81` |
| room.teamChannels.list-item | 打开该频道 | `…→频道行` | 行存在 | DOM: [读] 可点行；进该房；endpoint: `openRouteLink`；persist: 房间 URL | `TeamsChannelItem.tsx:56` | | `TeamsChannelsWithData.tsx:45-47` |
| room.teamChannels.item-menu | 打开行 More | `…→行→More` | `edit-team-channel` 或 `remove-team-channel` 或 delete 权 | DOM: [读] `button` title=`More`；最多 3 项 | `TeamsChannelItemMenu.tsx:43-54` | | `TeamsChannelItem.tsx:38-42` |
| room.teamChannels.toggle-auto-join | 开关自动加入 | `…→More→Team_Auto-join` | `edit-team-channel` | DOM: [读] menuitem name=`Team_Auto-join` + checkbox；endpoint: [读] `POST /v1/teams.updateRoom` `{isDefault}`；persist: `teamDefault` 刷新仍在 | `TeamsChannelItemMenu.tsx:18-24` | | `useToggleAutoJoin.ts:13-39` |
| room.teamChannels.remove-from-team | 从团队移除频道 | `…→More→Team_Remove_from_team` | `remove-team-channel` | DOM: [读] name=`Team_Remove_from_team`；确认后；endpoint: [读] `POST /v1/teams.removeRoom`；persist: 列表刷新不在 | `TeamsChannelItemMenu.tsx:26-31` | | `useRemoveRoomFromTeam.tsx:16-38` |
| room.teamChannels.delete | 删除该频道 | `…→More→Delete` | `delete-{t}` 且 `delete-team-channel/group` | DOM: [读] name=`Delete`；确认；endpoint: [读] `POST /v1/rooms.delete`；persist: 房间刷新不在 | `TeamsChannelItemMenu.tsx:34-40` | `room.info.action.delete` | `useDeleteRoom.tsx:21-40` |
| room.teamChannels.add-existing | 打开「加入已有频道」 | `…→Team_Add_existing` | `move-room-to-team` | DOM: [读] `button` name=`Team_Add_existing`；modal `aria-label=Team_Add_existing_channels` title 同；endpoint: 待提交 | `TeamsChannels.tsx:139-142` | `room.info.action.move-to-team` | `TeamsChannelsWithData.tsx:18,60` |
| room.teamChannels.add-existing.rooms | 选择要加入的房间 | `…→modal→Channels` | modal 开 | DOM: [读] 字段 label=`Channels` 自动完成；endpoint: 房间自动完成；persist: 待提交 | `AddExistingModal.tsx:74-80` | | `RoomsAvailableForTeamsAutoComplete` |
| room.teamChannels.add-existing.submit | 提交加入 | `…→modal→Add` | dirty | DOM: [读] `button` name=`Add`；toast `Channels_added`；endpoint: [读] `POST /v1/teams.addRooms`；persist: 列表刷新在 | `AddExistingModal.tsx:86-88` | | `AddExistingModal.tsx:37-51` |
| room.teamChannels.add-existing.cancel | 取消加入 | `…→modal→Cancel` 或 × | modal 开 | DOM: [读] `button` `Cancel` / ModalClose；endpoint: none | `AddExistingModal.tsx:71,85` | | `AddExistingModal.tsx:85` |
| room.teamChannels.create-new | 打开新建团队频道 | `…→Create_new` | `create-team-channel` 或 `create-team-group` | DOM: [读] `button` name=`Create_new`；`CreateChannelModal`（字段与 `nav.create.channel` 同模，本行只到打开）；endpoint: 模态内 create；persist: 新频道刷新在列表 | `TeamsChannels.tsx:144-147` | `nav.create.channel` | `TeamsChannelsWithData.tsx:19,61` |

本表数据行：**15**。计数见附录验算。

## 表 L — Banned users

父：`room.toolbox.banned-users`。dialog name=`Banned_Users`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.banned.close | 关封禁列表 | `…→Banned_Users→×` | `ban-user` | DOM: [读] `Close`；dialog `Banned_Users` 关 | `BannedUsers.tsx:39` | `room.toolbox.banned-users` | `BannedUsers.tsx:36-39` |
| room.banned.empty | 无人被封 | 0 | success+0 | DOM: [读] empty title=`No_banned_users` subtitle=`No_banned_users_description` | `BannedUsers.tsx:50-52` | | `BannedUsers.tsx:50-52` |
| room.banned.error | 加载失败 | query error | error | DOM: [读] empty title=`Banned_users_error` subtitle=`Please_try_again` | `BannedUsers.tsx:48` | | `BannedUsers.tsx:48` |
| room.banned.item-menu | 打开行 More | `…→行→More` | 有行 | DOM: [读] `button` title=`More` | `BannedUsersItem.tsx:47` | | `BannedUsersItem.tsx:46-48` |
| room.banned.unban | 解封 | `…→More→Unban_user_from_room` | `ban-user` | DOM: [读] menuitem name=`Unban_user_from_room`；确认后；endpoint: [读] `POST /v1/rooms.unbanUser`；persist: 列表刷新不在，可再被加回成员 | `BannedUsersItem.tsx:27-31` | `room.members.action.ban` | `useUnbanUser.tsx:21-53` |
| room.banned.load-more | 滚动加载 | 列表底 | 有下一页 | DOM: [读] Virtuoso `endReached`；endpoint: [读] `GET /v1/rooms.bannedUsers` | `BannedUsers.tsx:61` | | `useRoomBannedUsers.ts:16-27` |

本表数据行：**6**。计数见附录验算。

## 表 M — Autotranslate

父：`room.toolbox.autotranslate`。dialog name=`Auto_Translate`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.autotranslate.close | 关自动翻译栏 | `…→Auto_Translate→×` | `auto-translate` + `AutoTranslate_Enabled` | DOM: [读] `Close`；dialog `Auto_Translate` 关 | `AutoTranslate.tsx:34` | `room.toolbox.autotranslate` | `AutoTranslate.tsx:32-34` |
| room.autotranslate.toggle | 开/关本房自动翻译 | `…→Automatic_Translation` | 加密且当前关 → disabled | DOM: [读] `switch` label=`Automatic_Translation`；toast `AutoTranslate_Enabled_for_room`/`Disabled_for_room`；endpoint: [读] `POST /v1/autotranslate.saveSettings` `{field:'autoTranslate'}`；persist: subscription.`autoTranslate` | `AutoTranslate.tsx:46-51` | | `AutoTranslateWithData.tsx:48-65` |
| room.autotranslate.language | 选目标语言 | `…→Translate_to` | 总开关开着才使能 | DOM: [读] Select id=language label=`Translate_to`；toast `AutoTranslate_language_set_to`；endpoint: [读] saveSettings `{field:'autoTranslateLanguage'}`；persist: `autoTranslateLanguage`；语言表 `GET /v1/autotranslate.getSupportedLanguages` | `AutoTranslate.tsx:55-63` | | `AutoTranslateWithData.tsx:34-45` |
| room.autotranslate.e2ee-unavailable | 加密房提示不可用 | 打开栏且 `room.encrypted` | encrypted | DOM: [读] Callout title=`Automatic_translation_not_available` body=`Automatic_translation_not_available_info`；开关无法打开；endpoint: n/a | `AutoTranslate.tsx:38-42` | `room.info.e2ee` | `AutoTranslate.tsx:38-51` |

本表数据行：**4**。计数见附录验算。

## 表 N — Calls

父：`room.toolbox.calls`。dialog name=`Calls`。license `videoconference-enterprise`；联邦 disabled。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.calls.close | 关通话史 | `…→Calls→×` | license | DOM: [读] `Close`；dialog `Calls` 关 | `VideoConfList.tsx:42` | `room.toolbox.calls` | `VideoConfList.tsx:40-42` |
| room.calls.empty | 无历史 | total===0 | 非 loading | DOM: [读] empty title=`No_history` subtitle=`There_is_no_video_conference_history_in_this_room` | `VideoConfList.tsx:59-64` | | `VideoConfList.tsx:59-64` |
| room.calls.error | 加载失败 | error | error | DOM: [读] States title=`Something_went_wrong` subtitle=error；endpoint: `GET /v1/video-conference.list` 失败 | `VideoConfList.tsx:52-57` | | `VideoConfList.tsx:52-57` |
| room.calls.join | 加入未结束会议 | `…→Join_call` | `!endedAt` | DOM: [读] `button` name=`Join_call`；进会；endpoint: video-conf join；persist: 会议记录仍在列表 | `VideoConfListItem.tsx:92-94` | `room.toolbox.start-video-call` | `useVideoConfJoinCall` |
| room.calls.join.ended | 已结束不可加入 | 同上 | `endedAt` | DOM: [读] `button` name=`Call_ended` **disabled**；endpoint: none | `VideoConfListItem.tsx:92-94` | | `VideoConfListItem.tsx:92` |
| room.calls.join-discussion | 跳会议讨论房 | `…→Join_discussion` | 有 `discussionRid` | DOM: [读] IconButton title=`Join_discussion`；进讨论；endpoint: `useGoToRoom` | `VideoConfListItem.tsx:95-103` | `room.discussions.list-item` | `VideoConfListItem.tsx:96-102` |
| room.calls.load-more | 滚动加载 | 列表底 | 有更多 | DOM: [读] Virtuoso endReached；endpoint: video-conference.list | `VideoConfList.tsx:77` | | `VideoConfList.tsx:77` |

本表数据行：**7**。计数见附录验算。

## 表 O — Canned responses

父：`room.toolbox.canned-responses`。dialog name=`Canned_Responses`。仅 live。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.canned.close | 关快捷回复栏 | `…→Canned_Responses→×` | license + setting | DOM: [读] `Close`；dialog `Canned_Responses` 关 | `CannedResponseList.tsx:86` | `room.toolbox.canned-responses` | `CannedResponseList.tsx:84-86` |
| room.canned.search | 搜快捷回复 | `…→Search` | 始终 | DOM: [读] `textbox` placeholder=`Search`；endpoint: [读] `GET /v1/canned-responses` 过滤 | `CannedResponseList.tsx:92-98` | | `CannedResponseList.tsx:92` |
| room.canned.type-filter | 按类型过滤 | `…→Type Select` | 始终 | DOM: [读] Select `aria-label=Type`；endpoint: 列表 `type` | `CannedResponseList.tsx:100` | | `CannedResponseList.tsx:100` |
| room.canned.empty | 无快捷回复 | itemCount===0 | 空 | DOM: [读] empty title=`No_Canned_Responses` | `CannedResponseList.tsx:105` | | `CannedResponseList.tsx:105` |
| room.canned.list-item | 打开详情 | `…→行` | 有行 | DOM: [读] 行点击；详情头 `!{shortcut}`；endpoint: 已有数据 | `CannedResponseList.tsx:116-122` | | `CannedResponse.tsx:50` |
| room.canned.use-from-list | 从列表行使用 | `…→行 Use` | `!isRoomOverMacLimit` | DOM: [读] Use 钮（Item）；把文本插入 composer；endpoint: none 客户端；persist: 草稿 [待渲染实测] | `CannedResponseList.tsx:118-123` | 03 composer | Item onClickUse |
| room.canned.create | 打开创建 | `…→Create` | `useCanCreateCannedResponse` | DOM: [读] `button` name=`Create`；进创建流；endpoint: 创建 API（管理字段域外展开） | `CannedResponseList.tsx:130-135` | | `CannedResponseList.tsx:133` |
| room.canned.detail.back | 详情回列表 | `…→!shortcut→Back_to_canned_responses` | 详情 | DOM: [读] title=`Back_to_canned_responses`；回列表 dialog | `CannedResponse.tsx:49` | | `CannedResponse.tsx:49` |
| room.canned.detail.edit | 编辑该条 | `…→Edit` | `allowEdit` | DOM: [读] `button` name=`Edit`；进编辑表；endpoint: update canned-responses | `CannedResponse.tsx:101` | | `CannedResponse.tsx:101` |
| room.canned.detail.use | 从详情使用 | `…→Use` | `allowUse`；MAC 超限 disabled | DOM: [读] `button` name=`Use`；插入 composer；endpoint: none | `CannedResponse.tsx:102-104` | | `CannedResponse.tsx:102-104` |

本表数据行：**10**。计数见附录验算。

## 表 P — Contact profile

父：`room.toolbox.contact-profile`。dialog name=`Contact`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.contact.close | 关联系人栏 | `…→Contact→×` | live | DOM: [读] `Close`；dialog `Contact` 关 | `ContactInfo.tsx:47` | `room.toolbox.contact-profile` | `ContactInfo.tsx:44-47` |
| room.contact.edit | 进编辑联系人 | `…→pencil Edit` | `edit-omnichannel-contact` 且无冲突 | DOM: [读] IconButton title=`Edit`；route context=edit；endpoint: 编辑表另计；persist: URL context | `ContactInfo.tsx:61-67` | | `ContactInfo.tsx:35,61-67` |
| room.contact.edit.denied | 无编辑权或有冲突 | 同上 | `!canEdit` 或 `hasConflicts` | DOM: [读] 钮 disabled title=`Not_authorized`（无权）或仅 disabled（冲突）；endpoint: none | `ContactInfo.tsx:61-63` | | `ContactInfo.tsx:61-63` |
| room.contact.see-conflicts | 打开冲突审阅 | `…→See_conflicts` | `conflictingFields.length>0` | DOM: [读] `button` name=`See_conflicts`；Callout title=`Conflicts_found`；`ReviewContactModal`；endpoint: 审阅提交另计 | `ContactInfo.tsx:70-83` | | `ReviewContactModal` |
| room.contact.tab.details | 切到 Details | `…→Details` | 始终 | DOM: [读] tab name=`Details` selected；endpoint: 已有 contact 数据 | `ContactInfo.tsx:87-89` | | `ContactInfo.tsx:87` |
| room.contact.tab.channels | 切到 Channels | `…→Channels` | 始终 | DOM: [读] tab name=`Channels` | `ContactInfo.tsx:90-92` | | `ContactInfo.tsx:90` |
| room.contact.tab.history | 切到 History | `…→History` | 始终 | DOM: [读] tab name=`History` | `ContactInfo.tsx:93-95` | | `ContactInfo.tsx:93` |
| room.contact.phone.copy | 复制电话 | Details→phone→Copy | 有 phones | DOM: [读] IconButton title=`Copy`；toast Copied；endpoint: none | `ContactInfoPhoneEntry.tsx:25` | | `useClipboardWithToast` |
| room.contact.phone.outbound | 对该号发外呼 | Details→outbound | 非 unknown contact | DOM: [读] outbound 钮；unknown 时 disabled title=`error-unknown-contact`；endpoint: 外呼向导 | `ContactInfoPhoneEntry.tsx:27-32` | `nav.create.outbound` | `ContactInfoOutboundMessageButton` |
| room.contact.email.entry | 展示/点邮箱项 | Details→Email 行 | 有 emails | DOM: [读] 列表 `aria-labelledby={id}-emails` label=`Email`；项为展示+动作；endpoint: none | `ContactInfoDetails.tsx:30-38` | | `ContactInfoDetailsEntry` |

本表数据行：**10**。计数见附录验算。

## 表 Q — Game center

父：`room.toolbox.game-center`。dialog name=`Apps_Game_Center`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.game.close | 关 Game Center | `…→Apps_Game_Center→×` | `externalComponents.length>0` | DOM: [读] `Close`；dialog `Apps_Game_Center` 关 | `GameCenterList.tsx:46` | `room.toolbox.game-center` | `GameCenterList.tsx:45-46` |
| room.game.open | 打开某个游戏 | `…→表行 Name` | 有 games | DOM: [读] TableRow action；iframe title=`Apps_Game_Center` src=game.url；endpoint: 已有组件列表 `GET /apps/externalComponents` | `GameCenterList.tsx:61` | | `GameCenterContainer.tsx:32-33` |
| room.game.invite | 邀请好友进游戏 | `…→行 plus` | 行存在 | DOM: [读] Icon title=`Apps_Game_Center_Invite_Friends`；打开邀请 modal；endpoint: 邀请发送 [待渲染实测 path] | `GameCenterList.tsx:67-78` | | `GameCenterInvitePlayersModal` |
| room.game.back | 从游戏回列表 | 游戏容器→Back | 已打开游戏 | DOM: [读] title=`Back`；回列表；iframe 卸 | `GameCenterContainer.tsx:26` | | `GameCenter.tsx:23-26` |
| room.game.close-from-container | 从游戏关栏 | 游戏容器→× | 已打开 | DOM: [读] `Close`；整 tab 关 | `GameCenterContainer.tsx:30` | `room.game.close` | `GameCenter.tsx:21` |
| room.game.empty | 无外部组件 | games 空且非 loading | 列表空 | DOM: [读] 空表（无 empty i18n 标题）；endpoint: 列表空；persist: n/a | `GameCenterList.tsx:49-85` | | `GameCenterList.tsx:49` |

本表数据行：**6**。计数见附录验算。

## 表 R — Outlook

父：`room.toolbox.outlook-calendar`。dialog name=`Outlook_calendar`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.outlook.close | 关日历栏 | `…→Outlook_calendar→×` | `Outlook_Calendar_Enabled` | DOM: [读] `Close`；dialog `Outlook_calendar` 关 | `OutlookEventsList.tsx:52` | `room.toolbox.outlook-calendar` | `OutlookEventsList.tsx:49-52` |
| room.outlook.empty | 今日无事件 | total===0 | 非 pending | DOM: [读] States title=`No_history` | `OutlookEventsList.tsx:64-68` | | `OutlookEventsList.tsx:64-68` |
| room.outlook.error | 加载失败 | query error | error | DOM: [读] title=`Something_went_wrong` | `OutlookEventsList.tsx:57-62` | | `OutlookEventsList.tsx:57-62` |
| room.outlook.item-open | 打开事件详情 | `…→事件行` | 有事件 | DOM: [读] 可点行；`OutlookCalendarEventModal`；endpoint: 已有日历数据 | `OutlookEventItem.tsx:32-42,45-54` | | `OutlookCalendarEventModal` |
| room.outlook.join | 加入会议 | 行内 `Join` | 有 `meetingUrl` | DOM: [读] `button` name=`Join`；打开会议 URL；endpoint: 外链 | `OutlookEventItem.tsx:61-65` | | `useOutlookOpenCall` |
| room.outlook.calendar-settings | 打开日历设置 | `…→Calendar_settings` | `authEnabled` | DOM: [读] `button` name=`Calendar_settings`；`changeRoute`；endpoint: 路由 | `OutlookEventsList.tsx:88` | | `OutlookEventsList.tsx:88` |
| room.outlook.open-outlook | 外开 Outlook | `…→Open_Outlook` | `user.settings.calendar.outlook.Outlook_Url` | DOM: [读] `button` name=`Open_Outlook`；`window.open`；endpoint: 外链 | `OutlookEventsList.tsx:89-93` | | `OutlookEventsList.tsx:45,89-93` |
| room.outlook.sync | 同步 / 登录后同步 | `…→Sync` 或 `Log_in_to_sync` | `hasOutlookMethods`（非 NotOnDesktopError） | DOM: [读] `button` name=`Sync`/`Log_in_to_sync` loading；endpoint: [读] Outlook sync mutation；persist: 今日事件刷新 | `OutlookEventsList.tsx:95-102` | | `useMutationOutlookCalendarSync` |

本表数据行：**8**。计数见附录验算。

## 表 S — E2EE 弹层内部

父打开是 02 `room.toolbox.e2e`（无 tab）。本表只收 **确认/重置控件**。口令模态由全局 E2EE bootstrap 打开，不在 toolbox 点击链，见边界。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.info.e2ee.enable.confirm | 确认开启房间加密 | `工具栏→Enable_E2E_encryption→确认` | `E2E_Enable` + 权限矩阵；联邦 disabled | DOM: [读] 确认钮（`E2E_enable_encryption` 文案）；toast `E2E_Encryption_enabled_for_room`；endpoint: [读] `POST /v1/rooms.saveRoomSettings` `{encrypted:true}`；persist: `room.encrypted` | `EnableE2EEModal.tsx:19-20` | `room.toolbox.e2e` | `useE2EERoomAction.ts:73-90` |
| room.info.e2ee.enable.cancel | 取消开启 | 同上→Cancel | modal 开 | DOM: [读] `Cancel`；不改 encrypted | `EnableE2EEModal.tsx:21` | | `EnableE2EEModal.tsx:21` |
| room.info.e2ee.disable.confirm | 确认关闭加密 | `工具栏→Disable_E2E_encryption→确认` | 房间已加密 | DOM: [读] 确认；toast `E2E_Encryption_disabled_for_room`；endpoint: `{encrypted:false}`；persist: 刷新非加密 | `DisableE2EEModal.tsx:21-22` | | `useE2EERoomAction.ts` |
| room.info.e2ee.disable.cancel | 取消关闭 | →Cancel | modal 开 | DOM: [读] `Cancel` | `DisableE2EEModal.tsx:23` | | `DisableE2EEModal.tsx:23` |
| room.info.e2ee.reset-accordion | 展开重置密钥段 | Disable modal→`E2E_reset_encryption_keys` | `canResetRoomKey` | DOM: [读] Accordion title=`E2E_reset_encryption_keys` | `DisableE2EEModal.tsx:37` | | `DisableE2EEModal.tsx:37` |
| room.info.e2ee.reset-open | 打开重置密钥确认 | →`E2E_reset_encryption_keys_button` | 同上 | DOM: [读] 按钮该 i18n；换成 ResetKeys modal | `DisableE2EEModal.tsx:41-43` | | `BaseDisableE2EEModal.tsx:23-25` |
| room.info.e2ee.reset.confirm | 确认重置房间密钥 | ResetKeys→确认 | 重置 modal | DOM: [读] 确认；toast `E2E_reset_encryption_keys_success`；annotation `This_action_cannot_be_undone`；endpoint: [读] `POST /v1/e2e.resetRoomKey`；persist: 新密钥 | `ResetKeysE2EEModal.tsx:48` | | `useE2EEResetRoomKey.ts:15-31` |
| room.info.e2ee.reset.cancel | 取消重置 | →Cancel | modal | DOM: [读] `Cancel` | `ResetKeysE2EEModal.tsx:47` | | `ResetKeysE2EEModal.tsx:47` |
| room.info.e2ee.federated.disabled | 联邦房 E2EE 钮禁用 | 工具栏看钥匙 | federated | DOM: [读] 工具栏动作 disabled tooltip=`core.E2E_unavailable_for_federation`；无弹层；endpoint: none | `useE2EERoomAction.ts` | `room.toolbox.e2e` | `useE2EERoomAction.ts` |

本表数据行：**9**。计数见附录验算。

## 表 T — Omnichannel QuickActions（02 OOS，本册 IN）

`quickActionHooks` 实装 **5** 个：`useMoveQueueQuickAction` `useChatForwardQuickAction` `useTranscriptQuickAction` `useCloseChatQuickAction` `useOnHoldChatQuickAction`（`ui.ts:71-77`）。工具栏 `aria-label=Omnichannel_quick_actions`（`QuickActions.tsx:21`）。**Resume 不是 hook**，在 composer `ComposerOmnichannelOnHold`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| room.quick.moveQueue | 打开回队确认 | live 头→`Move_queue` | `returnQueue` 且 `room.u` 且 roomOpen 且未超 MAC | DOM: [读] 工具栏钮 title=`Move_queue`；modal `Return_to_the_queue` body=`Would_you_like_to_return_the_queue`；endpoint: 待确认 | `useMoveQueueQuickAction.ts:8-12` | | `useQuickActions.tsx:269,284-285` |
| room.quick.moveQueue.confirm | 确认回队 | modal→Confirm | modal | DOM: [读] `Confirm`；关房 `/home`；endpoint: [读] `POST /v1/livechat/inquiries.returnAsInquiry`；persist: 房间/订阅刷新不在进行中 | `ReturnChatQueueModal.tsx:17-19` | | `useReturnChatToQueueMutation.ts:11-17` |
| room.quick.moveQueue.cancel | 取消回队 | modal→Cancel | modal | DOM: [读] `Cancel`；endpoint: none | `ReturnChatQueueModal.tsx:18` | | `ReturnChatQueueModal.tsx:18` |
| room.quick.chatForward | 打开转接表 | 头→`Forward_chat` | `transfer-livechat-guest` 且 roomOpen 未超 MAC | DOM: [读] title=`Forward_chat`；modal 标题同；endpoint: 待提交 | `useChatForwardQuickAction.ts:8-12` | | `useQuickActions.tsx:286-287` |
| room.quick.chatForward.department | 选目标部门 | modal→`Forward_to_department` | 与 user 互斥 | DOM: [读] 自动完成 label=`Forward_to_department`；endpoint: departments list | `ForwardChatModal.tsx:112-128` | | `useDepartmentsList` |
| room.quick.chatForward.username | 选目标坐席 | modal→`Forward_to_user` | 与 dept 互斥；排除当前 servedBy | DOM: [读] label=`Forward_to_user`；endpoint: `GET /v1/users.info` | `ForwardChatModal.tsx:133-151` | | `ForwardChatModal.tsx:57-59` |
| room.quick.chatForward.comment | 转接备注 | modal→`Leave_a_comment` | 可选 | DOM: [读] textarea label=`Leave_a_comment` (`Optional`) | `ForwardChatModal.tsx:154-167` | | `ForwardChatModal.tsx:154` |
| room.quick.chatForward.confirm | 提交转接 | modal→`Forward` | 须 username **或** department（不能同时） | DOM: [读] `button` name=`Forward`；toast `Transferred`；`/home`；endpoint: [读] `POST /v1/livechat/room.forward`；persist: 分配刷新 | `ForwardChatModal.tsx:105-108` | | `ForwardChatModal.tsx:52-94` |
| room.quick.chatForward.cancel | 取消转接 | →Cancel | modal | DOM: [读] `Cancel` | `ForwardChatModal.tsx:104` | | `ForwardChatModal.tsx:104` |
| room.quick.transcript.toggle | 打开 transcript 子菜单 | 头→`Send_transcript` | email 权 **或**（企业+PDF 权） | DOM: [读] title=`Send_transcript`；下拉两项 | `useTranscriptQuickAction.ts:8-24` | | `QuickActionOptions.tsx:31` |
| room.quick.transcript.email | 打开邮件 transcript 表 | 下拉→`Send_via_email` | `send-omnichannel-chat-transcript`；访客无邮箱则 toast `Customer_without_registered_email` | DOM: [读] 项 name=`Send_via_email`；`Transcript` modal；预取 `GET /v1/livechat/visitors.info` | `useTranscriptQuickAction.ts:15` | | `useQuickActions.tsx:212-228` |
| room.quick.transcript.pdf | 请求 PDF transcript | 下拉→`Export_as_PDF` | `request-pdf-transcript` + 企业；**房间仍 open 则 disabled** tooltip=`Export_enabled_at_the_end_of_the_conversation` | DOM: [读] 项 name=`Export_as_PDF`；toast `Livechat_transcript_has_been_requested`；endpoint: [读] `POST /v1/omnichannel/:rid/request-transcript`；persist: 任务在服务端 | `useTranscriptQuickAction.ts:16-22` | | `useQuickActions.tsx:93-104,209-210` |
| room.quick.transcript.modal.email | 填 transcript 邮箱 | Transcript modal→`Email` | 无预填/无既有请求 | DOM: [读] 字段 label=`Email` 校验 `Required_field` | `TranscriptModal.tsx:81-98` | | `TranscriptModal.tsx:81` |
| room.quick.transcript.modal.subject | 填 transcript 主题 | →`Subject` | 同上 | DOM: [读] label=`Subject` `Required_field` | `TranscriptModal.tsx:100-113` | | `TranscriptModal.tsx:100` |
| room.quick.transcript.modal.request | 进行中会话请求邮件 | →`Request` | `roomOpen && !transcriptRequest` | DOM: [读] `button` name=`Request`；toast `Livechat_email_transcript_has_been_requested`；endpoint: [读] `POST /v1/livechat/transcript/:rid`；persist: 请求刷新仍在 | `TranscriptModal.tsx:124-127` | | handler `77-90` |
| room.quick.transcript.modal.send | 已关会话发送邮件 | →`Send` | `!roomOpen` | DOM: [读] name=`Send`；endpoint: [读] `POST /v1/livechat/transcript` | `TranscriptModal.tsx:129-132` | | handler `109-118` |
| room.quick.transcript.modal.undo | 撤销待发请求 | →`Undo_request` | `roomOpen && transcriptRequest` | DOM: [读] name=`Undo_request`；warning `Livechat_transcript_already_requested_warning`；toast `Livechat_transcript_request_has_been_canceled`；endpoint: [读] `DELETE /v1/livechat/transcript/:rid` | `TranscriptModal.tsx:119-122` | | handler `123-134` |
| room.quick.onHold | 打开挂起确认 | 头→`Omnichannel_onHold_Chat` | 企业 license + `Livechat_allow_manual_on_hold` + `!room.onHold` + `room.u`；可选须坐席最后发言 | DOM: [读] title=`Omnichannel_onHold_Chat`；modal body=`Would_you_like_to_place_chat_on_hold` | `useOnHoldChatQuickAction.ts:6-21` | | `useQuickActions.tsx:263-279,296-297` |
| room.quick.onHold.confirm | 确认挂起 | modal→`Omnichannel_onHold_Chat` | modal | DOM: [读] 确认该 i18n；toast `Chat_On_Hold_Successfully`；endpoint: [读] `POST /v1/livechat/room.onHold`；persist: `room.onHold`；composer 换 Resume | `PlaceChatOnHoldModal.tsx:35-37` | `room.quick.resume` | `usePutChatOnHoldMutation.ts:11-17` |
| room.quick.onHold.cancel | 取消挂起 | →Cancel | modal | DOM: [读] `Cancel` | `PlaceChatOnHoldModal.tsx:34` | | `useQuickActions.tsx:248-251` |
| room.quick.closeChat | 打开关闭会话 | 头→`End_conversation` | roomOpen 且 `close-livechat-room` 或 `close-others-livechat-room` | DOM: [读] title=`End_conversation`（danger）；简单确认 **或** 完整 wrap-up | `useCloseChatQuickAction.ts:8-14` | | `useQuickActions.tsx:236-241,294-295` |
| room.quick.closeChat.simple.confirm | 无表单直接关 | 简单 modal→Confirm | `!commentRequired && !tagRequired && !canSendTranscript` | DOM: [读] title=`Are_you_sure_you_want_to_close_this_chat` confirm=`Confirm`；toast `Chat_closed_successfully`；endpoint: [读] `POST /v1/livechat/room.closeByUser`；persist: 房间关闭 | `CloseChatModal.tsx:253-261` | | `CloseChatModal.tsx:140-169` |
| room.quick.closeChat.simple.cancel | 取消简单关闭 | →Cancel | 简单态 | DOM: [读] `Cancel` | `CloseChatModal.tsx:258` | | `CloseChatModal.tsx:258` |
| room.quick.closeChat.form.comment | 关闭评语 | wrap-up→`Comment` | `Livechat_request_comment_when_closing_conversation` 则必填 | DOM: [读] 文本 label=`Comment` placeholder=`Please_add_a_comment` 错=`Required_field` | `CloseChatModal.tsx:169-177` | | `CloseChatModal.tsx:169` |
| room.quick.closeChat.form.tags | 关闭标签 | →`Tags` | 企业+部门标签 或 自由输入 | DOM: [读] 多选/输入 label=`Tags` 错=`error-tags-must-be-assigned-before-closing-chat`/`Enter_a_tag` | `Tags.tsx:74-99` | `room.info.live.field.tags` | `CurrentChatTags.tsx` |
| room.quick.closeChat.form.transcriptPdf | 关闭时出 PDF | checkbox `Omnichannel_transcript_pdf` | `request-pdf-transcript` + 企业 | DOM: [读] `checkbox` 该 label；payload `generateTranscriptPdf`；默认来自用户偏好 | `CloseChatModal.tsx:190-196` | `room.quick.transcript.pdf` | `CloseChatModal.tsx:190` |
| room.quick.closeChat.form.transcriptEmail | 关闭时发电邮 | checkbox `Omnichannel_transcript_email` | `send-omnichannel-chat-transcript` + 访客邮箱 + 非 always | DOM: [读] `checkbox` 该 label；露出 subject | `CloseChatModal.tsx:198-205` | `room.quick.transcript.email` | `CloseChatModal.tsx:198` |
| room.quick.closeChat.form.subject | 关闭电邮主题 | →`Subject` | transcript email 勾上则必填 | DOM: [读] 文本 label=`Subject` `Required_field` 默认 `Transcript_of_your_livechat_conversation` | `CloseChatModal.tsx:214-225` | | `CloseChatModal.tsx:214` |
| room.quick.closeChat.form.confirm | 提交 wrap-up 关闭 | →`Confirm` | 必填齐 | DOM: [读] `Confirm`；toast `Chat_closed_successfully`；endpoint: [读] `POST /v1/livechat/room.closeByUser`；persist: 关闭+标签 | `CloseChatModal.tsx:244-246` | | `CloseChatModal.tsx:90-114` |
| room.quick.closeChat.form.cancel | 取消 wrap-up | →`Cancel` | 表单态 | DOM: [读] `Cancel` | `CloseChatModal.tsx:243` | | `CloseChatModal.tsx:243` |
| room.quick.resume | 从挂起恢复（composer，非 hook） | 挂起房 composer→`Resume` | `room.onHold && room.open` | DOM: [读] `button` name=`Resume`；banner `chat_on_hold_due_to_inactivity` 消失、composer 恢复；endpoint: [读] `POST /v1/livechat/room.resumeOnHold`；persist: `onHold=false` | `ComposerOmnichannelOnHold.tsx:17-21` | `room.quick.onHold` | `ComposerOmnichannel.tsx:44-50` |

本表数据行：**31**。计数见附录验算。

## 表 U — V1 sidebar RoomMenu kebab（02 OOS，本册 IN）

V1：`sidebar/RoomMenu.tsx` + `hooks/useRoomMenuActions.ts`。触发 `GenericMenu` `title=Options` `aria-keyshortcuts=alt`。V2 同名组件多通知段，用独立 id。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sidebar.roomMenu.trigger | 打开房间行 Options | V1 侧栏行→`Options` | 菜单非空否则 disabled | DOM: [读] `button` title=`Options`；endpoint: none | `RoomMenu.tsx:26` | | `RoomMenu.tsx:26` |
| sidebar.roomMenu.hide | 隐藏房间 | Options→`Hide` | `!hideDefaultOptions` 且 `type!=='l'` | DOM: [读] menuitem name=`Hide`；确认 `Yes_hide_it` / `Hide_room`；endpoint: [读] close by type；persist: `open=false` **不**跳 /home（`redirect:false`） | `useRoomMenuActions.ts:62-67` | `room.info.action.hide` | `useHideRoomAction.tsx:50,65-88` |
| sidebar.roomMenu.toggleRead | 标已读/未读 | Options→`Mark_read`/`Mark_unread` | 始终（在默认项里） | DOM: [读] 双态 name；endpoint: [读] `POST /v1/subscriptions.read` 或 `POST /v1/subscriptions.unread`；persist: 未读态刷新 | `useRoomMenuActions.ts:68-72` | | `useToggleReadAction.ts:24-47` |
| sidebar.roomMenu.toggleFavorite | 收藏/取消 | Options→`Favorite`/`Unfavorite` | setting `Favorite_Rooms` | DOM: [读] 双态 name；endpoint: [读] `POST /v1/rooms.favorite`；persist: subscription.`f` | `useRoomMenuActions.ts:74-78` | `room.header.favorite` | `useToggleFavoriteAction` |
| sidebar.roomMenu.leave | 离开房间 | Options→`Leave_room` | 非 d/l；`cl!==false`；`leave-c`/`leave-p` | DOM: [读] name=`Leave_room`；确认；endpoint: [读] channels/groups/im leave；persist: 成员刷新不在 | `useRoomMenuActions.ts:80-85` | `room.info.action.leave` | `useLeaveRoom.tsx:34` |
| sidebar.roomMenu.hide.denied.omni | live 行无 Hide | type=`l` | omni | DOM: [读] 菜单无 `Hide`；endpoint: n/a | `useRoomMenuActions.ts:62` | | `useRoomMenuActions.ts:55,62` |
| sidebar.roomMenu.leave.denied | DM/live/cl=false 无 Leave | Options | `d`/`l` 或 `cl===false` 或无 leave 权 | DOM: [读] 无 `Leave_room` | `useRoomMenuActions.ts:40-48,80` | | `useRoomMenuActions.ts:40-48` |
| sidebar.roomMenu.hideDefaultOptions | 排队项隐藏默认菜单 | 队列行 kebab | `hideDefaultOptions===true` | DOM: [读] 默认项空；或仅 Priorities；endpoint: n/a | `useRoomMenuActions.ts:59-60` | | `SidebarItemTemplateWithData.tsx:150` |
| sidebar.roomMenu.v2.notifications-toggle | V2 行开关房间通知 | V2 Options→`Turn_ON`/`Turn_OFF` | secondarySidebar ON；有 subscription；非 omni | DOM: [读] name=`Turn_ON`/`Turn_OFF`；toast `Room_notifications_on/off`；endpoint: [读] `POST /v1/rooms.saveNotification`；persist: `disableNotifications` | V2 `useRoomMenuActions.ts:117-122` | `room.notif.turn-on` | `useToggleNotificationAction` |
| sidebar.roomMenu.v2.notifications-prefs | V2 跳通知偏好栏 | V2→`Preferences` | 同上 + href | DOM: [读] name=`Preferences`；打开 push-notifications 栏；endpoint: 路由；persist: URL tab | V2 `useRoomMenuActions.ts:124-128` | `room.toolbox.push-notifications` | V2 `:124-128` |
| sidebar.roomMenu.priority.unprioritized | 清除 live 优先级 | live Options→`Unprioritized` | type=l 且有优先级列表 | DOM: [读] name=`Unprioritized` 段标题=`Priorities`；endpoint: [读] `DELETE /v1/livechat/room/:rid/priority`；persist: 优先级刷新空 | `useOmnichannelPrioritiesMenu.ts:35-41` | `room.info.live.field.priority` | `useOmnichannelPrioritiesMenu.ts:35-41` |
| sidebar.roomMenu.priority.set | 设置 live 优先级 | →动态优先级名 | 同上 | DOM: [读] 动态 name；endpoint: [读] `POST /v1/livechat/room/:rid/priority`；persist: 刷新仍在 | `useOmnichannelPrioritiesMenu.ts:43-52` | | `useOmnichannelPrioritiesMenu.ts:43-52` |

本表数据行：**12**。计数见附录验算。

## 分册 07 — 页面内部控件

把 02/04 只写成入口的页面/模态炸成每个可操作控件一行。id 全部 `page.*`。Admin settings **只到组**，不拆 972 key。原文：[`07-page-interiors.md`](07-page-interiors.md)（[PR #10](https://github.com/jianwyao01/Rocket.Chat/pull/10)）。

## A. 创建模态（完整表单）

### A1 Create Channel — `CreateChannelModal.tsx`

表单 `aria-labelledby` → 标题 i18n `Create_channel`。提交：私有 `POST /v1/groups.create`，公开 `POST /v1/channels.create`。重名预检 `GET /v1/rooms.nameExists`。成功 toast `Room_has_been_created`，无 `teamId` 时 `goToRoom`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.create.channel.name` | 填写必填频道名 | `顶栏+→Channel` 或 `Home卡→Create_channel` → textbox `Name`（required） | 菜单：`create-c` OR `create-p`；正则 `UTF8_Channel_Names_Validation`；`UI_Allow_room_names_with_special_chars` 关则禁特殊字符 `[读]` | 界面: `[待渲染实测]` textbox `Name` + 尾图标 hashtag/hashtag-lock ／ 导航: 模态仍开 `[读]` ／ 持久化: 仅本地 RHF，提交才写库 `[读]` | core；提交见 `page.create.channel.submit` | `nav.create.channel` `page.home.create-channel` | `CreateChannelModal.tsx:204-227` `[读]` |
| `page.create.channel.name.required` | 空名提交时拦下 | 同上 → 名空 → `Create` | 同 name | 界面: `[待渲染实测]` `FieldError`=`Required_field(Name)` ／ 导航: 不关模态 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.channel.name` | `CreateChannelModal.tsx:211-213` `[读]` |
| `page.create.channel.name.special-chars` | 特殊字符名被客户端拒 | 关特殊名设置 → 输入空格/符号 → 失焦/提交 | `!UI_Allow_room_names_with_special_chars` `[读]` | 界面: `[待渲染实测]` error=`Name_cannot_have_special_characters` + hint `No_spaces_or_special_characters` ／ 导航: 不关 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.channel.name` | `CreateChannelModal.tsx:144-146,226` `[读]` |
| `page.create.channel.name.duplicate` | 重名被 rooms.nameExists 拒 | 输入已存在房间名 → 失焦/提交 | 无额外权 | 界面: `[待渲染实测]` error=`Channel_already_exist` ／ 导航: 不关 `[读]` ／ 持久化: `GET /v1/rooms.nameExists` 只读；不 create `[读]` | core | `page.create.channel.name` | `CreateChannelModal.tsx:91,148-151` `[读]` |
| `page.create.channel.topic` | 填写可选主题 | 模态 → textbox `Topic` | 无 | 界面: `[待渲染实测]` textbox `Topic` + hint `Displayed_next_to_name` ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit 进 `extraData.topic` `[读]` | core；同 create POST | `page.create.channel.submit` | `CreateChannelModal.tsx:228-234` `[读]` |
| `page.create.channel.members` | 添加初始成员 | 模态 → combobox `Add_people`（label `Members`） | 无；联邦关时外部分员另见 error 行 | 界面: `[待渲染实测]` `UserAutoCompleteMultiple` placeholder=`Add_people` ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit `members[]` `[读]` | core | `page.create.channel.members.external-rejected` | `CreateChannelModal.tsx:235-247` `[读]` |
| `page.create.channel.members.external-rejected` | 非联邦房拒绝 @external 成员 | 联邦关 → 成员含 `@…` → 提交 | `!federated` 且 `hasExternalMembers` `[读]` | 界面: `[待渲染实测]` error=`You_cannot_add_external_users_to_non_federated_room` ／ 导航: 不关 `[读]` ／ 持久化: 无 create `[读]` | core | `page.create.channel.federated` | `CreateChannelModal.tsx:71,241-243` `[读]` |
| `page.create.channel.private` | 开关私有/公开 | 模态 → switch `Private` | `useCreateChannelTypePermission` 若只剩一种类型则 disabled 并锁死 `[读]` | 界面: `[待渲染实测]` switch `Private`；hint 在 `People_can_only_join_by_being_invited` / `Anyone_can_access` 间切；公开时强制关加密 `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 决定走 groups vs channels create `[读]` | core | `page.create.channel.encrypted` | `CreateChannelModal.tsx:248-264,129-133` `[读]` |
| `page.create.channel.advanced` | 展开高级设置手风琴 | 模态 → accordion `Advanced_settings` | 无 | 界面: `[待渲染实测]` `AccordionItem` `Advanced_settings` 展开，露出 Security_and_permissions 四开关 ／ 导航: 仍开 `[读]` ／ 持久化: 无 `[读]` | core | `page.create.channel.federated` | `CreateChannelModal.tsx:266-268` `[读]` |
| `page.create.channel.federated` | 开关矩阵联邦 | 高级 → switch `Federation_Matrix_Federated` | 许可模块 `federation` + `useIsFederationEnabled` + `access-federation`；否则 disabled，hint 分别为 premium / disabled / not-authorized `[读]` | 界面: `[待渲染实测]` switch + hint 四态之一；开则强制关 encrypted/broadcast/readOnly `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit `extraData.federated` `[读]` | EE:federation（完整可用）；无模块仍见 disabled 开关 | `page.create.channel.members.external-rejected` | `CreateChannelModal.tsx:55-89,272-282` `[读]` |
| `page.create.channel.encrypted` | 开关频道 E2E | 高级 → switch `Encrypted` | `E2E_Enable`；仅私有；联邦时 disabled；默认值 `E2E_Enabled_Default_PrivateRooms` `[读]` | 界面: `[待渲染实测]` switch `Encrypted` + `useEncryptedRoomDescription('channel')` hint ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit `extraData.encrypted` `[读]` | core（E2E 设置） | `page.create.channel.private` | `CreateChannelModal.tsx:283-293,188` `[读]` |
| `page.create.channel.readonly` | 开关只读 | 高级 → switch `Read_only` | `set-readonly`（scoped owner）；broadcast 或 federated 时 disabled `[读]` | 界面: `[待渲染实测]` switch；hint `Read_only_field_hint_enabled` / `Anyone_can_send_new_messages` ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit `readOnly` `[读]` | core | `page.create.channel.broadcast` | `CreateChannelModal.tsx:294-308` `[读]` |
| `page.create.channel.broadcast` | 开关广播（并连带只读） | 高级 → switch `Broadcast` | federated 时 disabled `[读]` | 界面: `[待渲染实测]` switch；开则 hint `Broadcast_hint_enabled` 且 readOnly 被 set true `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 随 submit `extraData.broadcast` `[读]` | core | `page.create.channel.readonly` | `CreateChannelModal.tsx:309-319,135-137` `[读]` |
| `page.create.channel.cancel` | 取消不建房 | 模态 → `Cancel` 或 `Close` | 无 | 界面: `[待渲染实测]` dialog `Create_channel` 消失 ／ 导航: 回打开前页 `[读]` ／ 持久化: 无 `[读]` | core | `nav.create.channel` | `CreateChannelModal.tsx:201,326` `[读]` |
| `page.create.channel.submit` | 提交创建频道 | 填完 → `Create` | 同打开菜单；服务端再检 create-c/create-p `[读]` | 界面: `[待渲染实测]` 成功 toast `Room_has_been_created`，模态关；失败 toast error `[读]` ／ 导航: 无 teamId 则进新房；有 teamId 只 reload 列表不跳房 `[读]` ／ 持久化: `POST /v1/groups.create` 或 `/v1/channels.create` `[读]` | core | `nav.create.channel` `team.create` | `CreateChannelModal.tsx:156-186,327-329` `[读]` |
| `page.create.channel.submit.permission-denied` | 无权时提交失败 | 菜单因缓存仍可见但服务端拒（或只剩一种类型的锁）→ `Create` | 缺 `create-c`/`create-p` 或类型被锁 `[读]` | 界面: `[待渲染实测]` toast error（服务端 error-not-authorized）／ 导航: 不进房 `[读]` ／ 持久化: create 失败 `[读]` | core | `page.create.channel.submit` | `CreateChannelModal.tsx:183-185` `[读]` |
| `page.create.channel.team-parent` | 从团队频道列表建房时带上 teamId | 团队主房 → toolbox `Team_Channels` → 新建频道（`teamId`+`mainRoom`）→ 同表单 → `Create` | 团队内 `create-team-channel` / `create-team-group` 经 `useCreateChannelTypePermission(mainRoom._id)` `[读]` | 界面: `[待渲染实测]` **无额外字段**；Private 可能被锁 ／ 导航: **不** `goToRoom`，只 `reload` 团队频道表 `[读]` ／ 持久化: create `extraData.teamId` `[读]` | core | `room.toolbox.team-channels` `page.create.channel.submit` | `CreateChannelModal.tsx:38-42,97,167-178` `[读]` |

本表数据行：**17**。计数见附录验算。

### A2 Create Team — `CreateTeamModal.tsx`

标题 `Teams_New_Title`。提交 `POST /v1/teams.create`。重名 `GET /v1/rooms.nameExists`。成功 toast `Team_has_been_created` 后 `goToRoom(team.roomId)`。**无联邦开关。**

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.create.team.name` | 填写必填团队名 | `顶栏+→Team` → textbox `Teams_New_Name_Label` | 菜单：`create-team` AND (`create-c` OR `create-p`) `[读]` | 界面: `[待渲染实测]` textbox + team/team-lock 图标 ／ 导航: 仍开 `[读]` ／ 持久化: 仅本地 `[读]` | core；提交 `POST /v1/teams.create` | `nav.create.team` `team.create` | `CreateTeamModal.tsx:169-191` `[读]` |
| `page.create.team.name.required` | 空名提交被拦 | 名空 → `Create` | 同 name | 界面: `[待渲染实测]` `Required_field(Name)` ／ 导航: 不关 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.team.name` | `CreateTeamModal.tsx:176` `[读]` |
| `page.create.team.name.special-chars` | 特殊字符名被拒 | 关特殊名 → 非法字符 → 提交 | `!UI_Allow_room_names_with_special_chars` `[读]` | 界面: `[待渲染实测]` `Name_cannot_have_special_characters` ／ 导航: 不关 `[读]` ／ 持久化: 无 `[读]` | core | `page.create.team.name` | `CreateTeamModal.tsx:74-76,190` `[读]` |
| `page.create.team.name.duplicate` | 重名被拒 | 已存在名 → 提交 | 无 | 界面: `[待渲染实测]` `Teams_Errors_Already_exists` ／ 导航: 不关 `[读]` ／ 持久化: `GET /v1/rooms.nameExists` `[读]` | core | `page.create.team.name` | `CreateTeamModal.tsx:56,78-81` `[读]` |
| `page.create.team.topic` | 填写可选主题 | 模态 → `Topic` | 无 | 界面: `[待渲染实测]` textbox `Topic` ／ 导航: 仍开 `[读]` ／ 持久化: `room.extraData.topic` `[读]` | core | `page.create.team.submit` | `CreateTeamModal.tsx:192-200` `[读]` |
| `page.create.team.members` | 添加初始成员 | 模态 → `Teams_New_Add_members_Label` / `Add_people` | 无 | 界面: `[待渲染实测]` 成员多选 ／ 导航: 仍开 `[读]` ／ 持久化: `members[]` `[读]` | core | `page.create.team.submit` | `CreateTeamModal.tsx:201-210` `[读]` |
| `page.create.team.private` | 开关私有团队 | 模态 → switch `Teams_New_Private_Label` | `canOnlyCreateOneType` 则 disabled `[读]` | 界面: `[待渲染实测]` switch；公开则关加密 `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: `type` 1/0 `[读]` | core | `page.create.team.encrypted` | `CreateTeamModal.tsx:211-228` `[读]` |
| `page.create.team.advanced` | 展开高级设置 | 模态 → `Advanced_settings` | 无 | 界面: `[待渲染实测]` 手风琴展开 ／ 导航: 仍开 `[读]` ／ 持久化: 无 `[读]` | core | `page.create.team.encrypted` | `CreateTeamModal.tsx:230-232` `[读]` |
| `page.create.team.encrypted` | 开关团队 E2E | 高级 → `Teams_New_Encrypted_Label` | 仅私有且 `E2E_Enable` `[读]` | 界面: `[待渲染实测]` switch + team 加密 hint ／ 导航: 仍开 `[读]` ／ 持久化: `room.extraData.encrypted` `[读]` | core | `page.create.team.private` | `CreateTeamModal.tsx:236-248` `[读]` |
| `page.create.team.readonly` | 开关只读 | 高级 → `Teams_New_Read_only_Label` | `set-readonly`；broadcast 时 disabled `[读]` | 界面: `[待渲染实测]` switch + team 只读 hint ／ 导航: 仍开 `[读]` ／ 持久化: `room.readOnly` `[读]` | core | `page.create.team.broadcast` | `CreateTeamModal.tsx:249-263` `[读]` |
| `page.create.team.broadcast` | 开关广播 | 高级 → `Teams_New_Broadcast_Label` | 无联邦锁（团队无 federated 字段）`[读]` | 界面: `[待渲染实测]` switch；开则 hint `Teams_New_Broadcast_Description` 且 readOnly=true `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: `room.extraData.broadcast` `[读]` | core | `page.create.team.readonly` | `CreateTeamModal.tsx:264-274,104-110` `[读]` |
| `page.create.team.cancel` | 取消不建团队 | `Cancel` 或 `Close` | 无 | 界面: `[待渲染实测]` dialog `Teams_New_Title` 消失 ／ 导航: 回前页 `[读]` ／ 持久化: 无 `[读]` | core | `nav.create.team` | `CreateTeamModal.tsx:162,281` `[读]` |
| `page.create.team.submit` | 提交创建团队 | `Create` | 按钮 `disabled={!canCreateTeam}`（`create-team`）`[读]` | 界面: `[待渲染实测]` toast `Team_has_been_created` ／ 导航: 进 `team.roomId` `[读]` ／ 持久化: `POST /v1/teams.create` `[读]` | core | `team.create` `directory.teams` | `CreateTeamModal.tsx:118-149,282-284` `[读]` |
| `page.create.team.submit.permission-denied` | 无 create-team 时按钮不可点 | 侧门打开模态但缺 `create-team` → `Create` disabled | `!create-team` `[读]` | 界面: `[待渲染实测]` `Create` disabled ／ 导航: 不进房 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.team.submit` | `CreateTeamModal.tsx:54,282` `[读]` |

本表数据行：**14**。计数见附录验算。

### A3 Create Discussion — `CreateDiscussion.tsx`

`GenericModal` 标题 `Discussion_title`，`confirmText=Create` `cancelText=Cancel`。提交 `POST /v1/rooms.createDiscussion`。加密父房时首条回复被丢掉（`reply: encrypted ? undefined : firstMessage`）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.create.discussion.parent` | 选择父房间 | `顶栏+→Discussion` → combobox `Discussion_target_channel` / `Search_options` | 菜单：(`start-discussion` OR `start-discussion-other-user`) + `Discussion_enabled`；从消息「创建讨论」时 `defaultParentRoom` 只读 `[读]` | 界面: `[待渲染实测]` `RoomAutoComplete` 或只读 `DefaultParentRoomField`；加密父房显示 key 图标 `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 提交 `prid` `[读]` | core | `nav.create.discussion` `room.toolbox.discussions` | `CreateDiscussion.tsx:120-150` `[读]` |
| `page.create.discussion.parent.required` | 未选父房被拦 | 无 defaultParent → 不选房 → `Create` | `!defaultParentRoom` `[读]` | 界面: `[待渲染实测]` `Required_field(Discussion_target_channel)` ／ 导航: 不关 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.discussion.parent` | `CreateDiscussion.tsx:134` `[读]` |
| `page.create.discussion.name` | 填写讨论名 | 模态 → `Name`（required，气球图标） | 可带 `nameSuggestion` 预填 `[读]` | 界面: `[待渲染实测]` textbox `Name` ／ 导航: 仍开 `[读]` ／ 持久化: 提交 `t_name` `[读]` | core | `page.create.discussion.submit` | `CreateDiscussion.tsx:151-164` `[读]` |
| `page.create.discussion.name.required` | 空名被拦 | 名空 → `Create` | 同 name | 界面: `[待渲染实测]` `Required_field(Name)` ／ 导航: 不关 `[读]` ／ 持久化: 无 `[读]` | core | `page.create.discussion.name` | `CreateDiscussion.tsx:157` `[读]` |
| `page.create.discussion.topic` | 填写可选主题 | 模态 → `Topic` | 无 | 界面: `[待渲染实测]` textbox + `Displayed_next_to_name` ／ 导航: 仍开 `[读]` ／ 持久化: `topic` `[读]` | core | `page.create.discussion.submit` | `CreateDiscussion.tsx:165-173` `[读]` |
| `page.create.discussion.members` | 添加讨论成员 | 模态 → `Members` / `Add_people` | 无 | 界面: `[待渲染实测]` 多选 ／ 导航: 仍开 `[读]` ／ 持久化: `users` `[读]` | core | `page.create.discussion.submit` | `CreateDiscussion.tsx:174-183` `[读]` |
| `page.create.discussion.reply` | 填写首条消息 | 模态 → textarea `Discussion_first_message_title` | 加密时 disabled，hint `Discussion_first_message_disabled_due_to_e2e` `[读]` | 界面: `[待渲染实测]` textarea 5 行；加密则不可输入 `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 非加密才作为 `reply` `[读]` | core | `page.create.discussion.encrypted` | `CreateDiscussion.tsx:184-198,99` `[读]` |
| `page.create.discussion.encrypted` | 开关讨论加密 | 模态 → switch `Encrypted` | 父房已加密则 disabled 且默认开 `[读]` | 界面: `[待渲染实测]` switch + discussion 加密 hint；开则禁用首条 `[读]` ／ 导航: 仍开 `[读]` ／ 持久化: 加密时 `reply` 被丢掉 `[读]` | core | `page.create.discussion.reply` | `CreateDiscussion.tsx:199-209,72-78` `[读]` |
| `page.create.discussion.cancel` | 取消不建讨论 | `Cancel` | 无 | 界面: `[待渲染实测]` warning dialog 消失 ／ 导航: 回前页 `[读]` ／ 持久化: 无 `[读]` | core | `nav.create.discussion` | `CreateDiscussion.tsx:108-116` `[读]` |
| `page.create.discussion.submit` | 提交创建讨论 | `Create` | 同菜单；mutation pending 时 confirmLoading `[读]` | 界面: `[待渲染实测]` 模态关 ／ 导航: `goToRoom(discussion._id)` `[读]` ／ 持久化: `POST /v1/rooms.createDiscussion`（可选 `pmid`）`[读]` | core | `nav.create.discussion` | `CreateDiscussion.tsx:82-103` `[读]` |

本表数据行：**10**。计数见附录验算。

### A4 Create Direct Message — `CreateDirectMessage.tsx`

标题 `Create_direct_message`。提交 `POST /v1/dm.create` `{usernames: join(',')}`。成功 `goToRoom(rid)`；`onSettled` 关模态。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.create.dm.users` | 选择私聊对象（可多人） | `顶栏+→Direct_message` → 多选（label=`Direct_message_creation_description`） | 菜单 `create-d`；人数上限 `DirectMesssage_maxUsers`（含自己 +1）`[读]` | 界面: `[待渲染实测]` `UserAutoCompleteMultiple` federated + hint `Direct_message_creation_description_hint` ／ 导航: 仍开 `[读]` ／ 持久化: 仅本地 `[读]` | core | `nav.create.dm` | `CreateDirectMessage.tsx:67-96` `[读]` |
| `page.create.dm.users.required` | 未选用户被拦 | 空选 → `Create` | 同 users | 界面: `[待渲染实测]` `Direct_message_creation_error` ／ 导航: 不关 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.create.dm.users` | `CreateDirectMessage.tsx:74` `[读]` |
| `page.create.dm.users.max` | 超过人数上限被拦 | 选超过 `maxUsers-1` 人 → `Create` | `DirectMesssage_maxUsers` `[读]` | 界面: `[待渲染实测]` `error-direct-message-max-user-exceeded` ／ 导航: 不关 `[读]` ／ 持久化: 无 `[读]` | core | `page.create.dm.users` | `CreateDirectMessage.tsx:75-78` `[读]` |
| `page.create.dm.cancel` | 取消不建 DM | `Cancel` 或 `ModalClose` | 无 | 界面: `[待渲染实测]` dialog 消失 ／ 导航: 回前页 `[读]` ／ 持久化: 无 `[读]` | core | `nav.create.dm` | `CreateDirectMessage.tsx:64,101` `[读]` |
| `page.create.dm.submit` | 提交创建/打开 DM | `Create` | `create-d`；loading 为 isSubmitting 或 isValidating `[读]` | 界面: `[待渲染实测]` 关模态；失败 toast 仍关（onSettled）`[读]` ／ 导航: `goToRoom(rid)` `[读]` ／ 持久化: `POST /v1/dm.create` `[读]` | core | `nav.create.dm` `user.action.direct-message` | `CreateDirectMessage.tsx:30-55,102-104` `[读]` |
| `page.create.dm.submit.error` | 服务端拒建（含无权） | 选人 → `Create` → API 错 | 服务端 create-d / 联邦 / 封锁等 `[读]` | 界面: `[待渲染实测]` toast error **且模态仍关** ／ 导航: 不进房 `[读]` ／ 持久化: 无新 DM `[读]` | core | `page.create.dm.submit` | `CreateDirectMessage.tsx:45-50` `[读]` |

本表数据行：**6**。计数见附录验算。

## B. 账号页内部控件

### B1 Profile — `/account/profile`

页标题 `Profile`。资料保存走 `POST /v1/users.updateOwnBasicInfo` + 条件 `POST /v1/users.setStatus` + 条件 `POST /v1/users.setPreferences`（仅 statusVisibilityDenied）+ 头像 `useUpdateAvatar`。页脚 `Save_changes` / `Cancel` 是同一表单。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.account.profile.avatar.upload` | 上传本地图作头像 | 顶栏头像→`Profile` → 按钮 title=`Upload` → 选文件 | `Accounts_AllowUserAvatarChange`；否则 disabled `[读]` | 界面: `[待渲染实测]` 预览换成 dataURL；非法格式 toast `Avatar_format_invalid` ／ 导航: 仍在 profile `[读]` ／ 持久化: 点 `Save_changes` 才 `POST /v1/users.setAvatar` `[读]` | core；与 `page.account.profile.save` 同保存 | `account.profile` `nav.user.account.profile` | `UserAvatarEditor.tsx:51,121` `useUpdateAvatar.ts` `[读]` |
| `page.account.profile.avatar.url` | 输入头像 URL | Profile → textbox `Use_url_for_avatar` | 同上 | 界面: `[待渲染实测]` 输入框；未点 Add 不改预览 ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地 `[读]` | core | `page.account.profile.avatar.add-url` | `UserAvatarEditor.tsx:124-150` `[读]` |
| `page.account.profile.avatar.add-url` | 用 URL 更新头像预览 | URL 非空 → title=`Add_URL` 或 Enter | URL 须 `isSafeAvatarUrl` 且有效图；空则按钮 disabled `[读]` | 界面: `[待渲染实测]` 预览更新 + toast `Avatar_preview_updated`；非法 `error-invalid-image-url` ／ 导航: 仍在页 `[读]` ／ 持久化: Save 时 `POST /v1/users.setAvatar` `{avatarUrl}` `[读]` | core | `page.account.profile.avatar.url` | `UserAvatarEditor.tsx:55-74,130-137` `[读]` |
| `page.account.profile.avatar.reset` | 重置为默认字母头像 | Profile → 按钮 title=`Accounts_SetDefaultAvatar` | 同上 avatar 设置 | 界面: `[待渲染实测]` 预览变 `/avatar/@…` ／ 导航: 仍在页 `[读]` ／ 持久化: Save 时 `POST /v1/users.resetAvatar` `[读]` | core | `page.account.profile.save` | `UserAvatarEditor.tsx:76-79,118-120` `[读]` |
| `page.account.profile.avatar.suggest` | 选用 OAuth 建议头像 | Profile → 各服务名按钮（`UserAvatarSuggestions`） | 有 `GET /v1/users.getAvatarSuggestion` 结果；avatar 设置关则 disabled `[读]` | 界面: `[待渲染实测]` 预览换成 suggestion.blob ／ 导航: 仍在页 `[读]` ／ 持久化: Save 时 `POST /v1/users.setAvatar` 带 service `[读]` | core | `page.account.profile.save` | `UserAvatarEditor.tsx:91-97,122` `[读]` |
| `page.account.profile.name` | 改显示名 | Profile → textbox `Name` | `Accounts_AllowRealNameChange`；`Accounts_RequireNameForSignUp` 时 required `[读]` | 界面: `[待渲染实测]` textbox；禁用时 hint `RealName_Change_Disabled` ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `updateOwnBasicInfo.data.name` `[读]` | core；`POST /v1/users.updateOwnBasicInfo` | `account.profile` | `AccountProfileForm.tsx:216-230` `[读]` |
| `page.account.profile.name.required` | 必填名为空被拦 | requireName 开 → 清空 Name → Save | `Accounts_RequireNameForSignUp` `[读]` | 界面: `[待渲染实测]` `Required_field(Name)` ／ 导航: 不离开 `[读]` ／ 持久化: 无 POST `[读]` | core | `page.account.profile.name` | `AccountProfileForm.tsx:222` `[读]` |
| `page.account.profile.username` | 改用户名 | Profile → textbox `Username`（@ 尾标） | `Accounts_AllowUsernameChange`；正则 `UTF8_User_Names_Validation` `[读]` | 界面: `[待渲染实测]` textbox；禁用 hint `Username_Change_Disabled` ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `data.username`；可用性 `GET /v1/users.checkUsernameAvailability` `[读]` | core | `account.profile` | `AccountProfileForm.tsx:231-254,108-125` `[读]` |
| `page.account.profile.username.invalid` | 用户名不合正则 | 改成非法字符 → 失焦/Save | 同上 regex `[读]` | 界面: `[待渲染实测]` `error-invalid-username` ／ 导航: 不离开 `[读]` ／ 持久化: 无 update `[读]` | core | `page.account.profile.username` | `AccountProfileForm.tsx:117-119` `[读]` |
| `page.account.profile.username.taken` | 用户名已被占用 | 改成他人名 → Save | 无 | 界面: `[待渲染实测]` `Username_already_exist` ／ 导航: 不离开 `[读]` ／ 持久化: availability=false，无 update `[读]` | core | `page.account.profile.username` | `AccountProfileForm.tsx:121-124` `[读]` |
| `page.account.profile.status-type` | 改在线状态点 | Profile → Status 输入框左侧 `UserStatusMenu` | `Accounts_AllowUserStatusMessageChange` 同时管文案；菜单本身随表单 `[读]` | 界面: `[待渲染实测]` 状态点颜色切 ／ 导航: 仍在页 `[读]` ／ 持久化: Save 且 status dirty → `POST /v1/users.setStatus` `{status}` `[读]` | core | `nav.user.status.online` | `AccountProfileForm.tsx:277-281,177-183` `[读]` |
| `page.account.profile.status-text` | 改状态文案（可 emoji） | Profile → textbox placeholder=`StatusMessage_Placeholder` | `Accounts_AllowUserStatusMessageChange`；最长 120 `[读]` | 界面: `[待渲染实测]` textbox；禁用 hint `StatusMessage_Change_Disabled` ／ 导航: 仍在页 `[读]` ／ 持久化: 同 setStatus `{message}` `[读]` | core | `nav.user.status.custom-edit` | `AccountProfileForm.tsx:257-290` `[读]` |
| `page.account.profile.status-duration` | 选择状态自动清除 | Profile → select `Status_clear_after` | 状态可改；online 且无文案时 disabled `[读]` | 界面: `[待渲染实测]` select；custom 时再露日期/时间 ／ 导航: 仍在页 `[读]` ／ 持久化: setStatus `{expiresAt}` `[读]` | core | `page.account.profile.status-text` | `AccountProfileForm.tsx:291-349` `[读]` |
| `page.account.profile.status-custom-date` | 自定义状态过期日期 | duration=`custom` → `aria-label=Status_expiration_date` | 同上 | 界面: `[待渲染实测]` date input ／ 导航: 仍在页 `[读]` ／ 持久化: 并入 expiresAt `[读]` | core | `page.account.profile.status-duration` | `AccountProfileForm.tsx:315-328` `[读]` |
| `page.account.profile.status-custom-time` | 自定义状态过期时间 | duration=`custom` → `aria-label=Status_expiration_time` | 同上 | 界面: `[待渲染实测]` time input ／ 导航: 仍在页 `[读]` ／ 持久化: 并入 expiresAt `[读]` | core | `page.account.profile.status-duration` | `AccountProfileForm.tsx:330-345` `[读]` |
| `page.account.profile.status-visibility` | 选择对谁隐藏状态 | Profile → `Accounts_StatusVisibility_HideStatusFromUsers` 多选 | `Accounts_StatusVisibility_Enabled` 才渲染 `[读]` | 界面: `[待渲染实测]` `UserAutoCompleteMultiple` placeholder=`Select_users` ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `POST /v1/users.setPreferences` `{statusVisibilityDenied}` `[读]` | core | `nav.user.status.visibility` | `AccountProfileForm.tsx:350-369,173-175` `[读]` |
| `page.account.profile.nickname` | 改昵称 | Profile → textbox `Nickname` | 无独立设置门 | 界面: `[待渲染实测]` textbox + edit 图标 ／ 导航: 仍在页 `[读]` ／ 持久化: `updateOwnBasicInfo.data.nickname` `[读]` | core | `page.account.profile.save` | `AccountProfileForm.tsx:371-380` `[读]` |
| `page.account.profile.bio` | 改个人简介 | Profile → textarea `Bio` | 最长 260 `[读]` | 界面: `[待渲染实测]` textarea 3 行；超长 `Max_length_is` ／ 导航: 仍在页 `[读]` ／ 持久化: `data.bio` `[读]` | core | `page.account.profile.save` | `AccountProfileForm.tsx:381-402` `[读]` |
| `page.account.profile.email` | 改自己的邮箱 | Profile → textbox `Email` | `Accounts_AllowEmailChange`；required + `validateEmail` `[读]` | 界面: `[待渲染实测]` textbox；已验证尾标 circle-check，未验证 mail；禁用 hint `Email_Change_Disabled` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅当与旧邮箱不同才写入 `data.email` `[读]` | core | `account.profile` | `AccountProfileForm.tsx:403-440` `[读]` |
| `page.account.profile.email.invalid` | 非法邮箱被拦 | 输入非邮箱 → Save | 同 email | 界面: `[待渲染实测]` `error-invalid-email-address` ／ 导航: 不离开 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.profile.email` | `AccountProfileForm.tsx:417-419` `[读]` |
| `page.account.profile.resend-verification` | 重发验证邮件 | 未验证 → 按钮 `Resend_verification_email` | 邮箱未改（`email===previousEmail`）否则 disabled `[读]` | 界面: `[待渲染实测]` toast `Verification_email_sent` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.sendConfirmationEmail`（不改资料）`[读]` | core | `page.account.profile.email` | `AccountProfileForm.tsx:432-436,52,100-106` `[读]` |
| `page.account.profile.custom-fields` | 填写工作区自定义资料字段 | Profile → `CustomFieldsForm` 各运行时字段 | `useAccountsCustomFields()` 有 metadata 才渲染；字段集运行时 `[读]` | 界面: `[待渲染实测]` 动态字段 ／ 导航: 仍在页 `[读]` ／ 持久化: `updateOwnBasicInfo.customFields` `[读]` | core | `page.account.profile.save` | `AccountProfileForm.tsx:441` `[读]` |
| `page.account.profile.cancel` | 放弃未保存资料 | 页脚 `Cancel`（dirty 才可点） | `isDirty` `[读]` | 界面: `[待渲染实测]` 表单 reset 回 `getProfileInitialValues` ／ 导航: 仍在 profile `[读]` ／ 持久化: 无 `[读]` | core | `page.account.profile.save` | `AccountProfilePage.tsx:141-144` `[读]` |
| `page.account.profile.save` | 保存资料/状态/头像 | 页脚 `Save_changes` | dirty 且非 loggingOut `[读]` | 界面: `[待渲染实测]` toast `Profile_saved_successfully` 或 error ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.updateOwnBasicInfo` ± `setStatus` ± `setPreferences` ± setAvatar/resetAvatar `[读]` | core | `account.profile` | `AccountProfileForm.tsx:132-191` `AccountProfilePage.tsx:145-147` `[读]` |
| `page.account.profile.logout-others` | 登出其他客户端 | Profile → `Logout_Others` | 无额外权 | 界面: `[待渲染实测]` toast `Logged_out_of_other_clients_successfully`；本会话仍在 ／ 导航: 仍在 profile `[读]` ／ 持久化: `POST /v1/users.logoutOtherClients` `[读]` | core | `page.account.sessions.logout` `nav.user.logout` | `AccountProfilePage.tsx:49-64,128-130` `[读]` |
| `page.account.profile.delete` | 删除自己的账号 | Profile → danger `Delete_my_account` → 模态 `Delete_account?` 填密码或用户名 → `Delete_account` | `Accounts_AllowDeleteOwnAccount`；有本地密码则密码框，否则用户名框 `[读]` | 界面: `[待渲染实测]` 确认 dialog；成功 toast `User_has_been_deleted` ／ 导航: 成功后 `logout()` `[读]` ／ 持久化: `POST /v1/users.deleteOwnAccount` `{password: SHA256(…)}` `[读]` | core | `account.profile` | `AccountProfilePage.tsx:93-114,131-135` `ActionConfirmModal.tsx:39-45` `[读]` |
| `page.account.profile.delete.invalid-password` | 删号密码错误 | 确认框填错密码 → 确认 | 有本地密码 `[读]` | 界面: `[待渲染实测]` 字段 error `Invalid_password`（不关模态）／ 导航: 仍在模态 `[读]` ／ 持久化: delete 失败 `[读]` | core | `page.account.profile.delete` | `ActionConfirmModal.tsx:31-34` `AccountProfilePage.tsx:105-107` `[读]` |
| `page.account.profile.delete.last-owner` | 末位房主删号需二次确认 | 删号 API 返 `user-last-owner` → `ConfirmOwnerChangeModal` → `Delete` | 用户是某些房最后 owner `[读]` | 界面: `[待渲染实测]` 二次模态列出 shouldChangeOwner / shouldBeRemoved，文案 `Delete_User_Warning_{erasureType}` ／ 导航: 确认后 logout `[读]` ／ 持久化: 再 `deleteOwnAccount` `{confirmRelinquish:true}` `[读]` | core | `page.account.profile.delete` | `AccountProfilePage.tsx:66-91,99-103` `[读]` |

本表数据行：**28**。计数见附录验算。

### B2 Preferences — `/account/preferences`

一手风琴 + **一个** `POST /v1/users.setPreferences`（`getDirtyFields` 只提交脏字段）。My Data 两按钮独立 `GET /v1/users.requestDataDownload`。Messages 里三条 FieldLink 只跳外观页，不保存本页。
共享供给：`core；脏字段走 POST /v1/users.setPreferences`（除 My Data / 桌面通知权限）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.account.preferences.language` | 改界面语言 | 顶栏头像→`Preferences` → 手风琴 `Localization`（默认展开）→ select `Language` | 侧栏无门 | 界面: `[待渲染实测]` 语言选项来自 `useLanguages()` ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `language` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesLocalizationSection.tsx:18-26` `[读]` |
| `page.account.preferences.dont-ask-again` | 管理「不再询问」列表 | 手风琴 `Global` → `Dont_ask_me_again_list` MultiSelect | 列表来自已有 `dontAskAgainList` 偏好 `[读]` | 界面: `[待渲染实测]` 多选 placeholder=`Nothing_found` ／ 导航: 仍在页 `[读]` ／ 持久化: Save 写成 `{action,label}[]` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesGlobalSection.tsx:17-32` `AccountPreferencesPage.tsx:61-67` `[读]` |
| `page.account.preferences.auto-away` | 开关自动离开 | 手风琴 `User_Presence` → switch `Enable_Auto_Away` | 无 | 界面: `[待渲染实测]` switch + hint ／ 导航: 仍在页 `[读]` ／ 持久化: `enableAutoAway` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesUserPresenceSection.tsx:13-23` `[读]` |
| `page.account.preferences.idle-time` | 设置空闲秒数 | 同上 → number `Idle_Time_Limit` | 无 | 界面: `[待渲染实测]` NumberInput ／ 导航: 仍在页 `[读]` ／ 持久化: `idleTimeLimit` `[读]` | 共享 setPreferences | `page.account.preferences.auto-away` | `PreferencesUserPresenceSection.tsx:24-35` `[读]` |
| `page.account.preferences.desktop-permission` | 向浏览器要通知权或发测试通知 | 手风琴 `Notifications` → `Desktop_Notifications` 主按钮 | `window.Notification`；denied 只显示文案无按钮 `[读]` | 界面: `[待渲染实测]` granted→`Test_Desktop_Notifications`；未决→`Enable_Desktop_Notifications`；denied→`Desktop_Notifications_Disabled` ／ 导航: 浏览器权限框 `[待渲染实测]` ／ 持久化: 测试走本地 notify，**不** setPreferences；授权是浏览器权限 `[读]` | core（浏览器 Notification API） | `account.preferences` | `PreferencesNotificationsSection.tsx:99-114` `[读]` |
| `page.account.preferences.desktop-require-interaction` | 开关桌面通知需交互才消失 | Notifications → switch `Notification_RequireInteraction` | 无；hint 写明 Chrome>50 `[读]` | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `desktopNotificationRequireInteraction` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:115-125` `[读]` |
| `page.account.preferences.desktop-default` | 选桌面通知默认范围 | Notifications → select `Notification_Desktop_Default_For` | 选项 all/mentions/nothing + Default(工作区默认) `[读]` | 界面: `[待渲染实测]` select ／ 导航: 仍在页 `[读]` ／ 持久化: `desktopNotifications` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:126-135` `[读]` |
| `page.account.preferences.desktop-voice` | 开关桌面语音来电通知 | Notifications → switch `Notification_Desktop_show_voice_calls` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `desktopNotificationVoiceCalls` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:136-145` `[读]` |
| `page.account.preferences.push-default` | 选移动推送默认范围 | Notifications → select `Notification_Push_Default_For` | 同上三档 + 工作区默认 `[读]` | 界面: `[待渲染实测]` select ／ 导航: 仍在页 `[读]` ／ 持久化: `pushNotifications` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:146-155` `[读]` |
| `page.account.preferences.email-mode` | 选邮件通知模式 | Notifications → select `Email_Notification_Mode` | `Accounts_AllowEmailNotifications` 否则 disabled `[读]` | 界面: `[待渲染实测]` select；hint 验证邮箱或 `Email_Notifications_Change_Disabled` ／ 导航: 仍在页 `[读]` ／ 持久化: `emailNotificationMode` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:156-169` `[读]` |
| `page.account.preferences.login-email` | 开关登录检测邮件 | Notifications → switch `Receive_Login_Detection_Emails` | `Device_Management_Enable_Login_Emails` AND `Device_Management_Allow_Login_Email_preference` `[读]` | 界面: `[待渲染实测]` 条件渲染 switch ／ 导航: 仍在页 `[读]` ／ 持久化: `receiveLoginDetectionEmail` `[读]` | 共享 setPreferences | `account.manage-devices` | `PreferencesNotificationsSection.tsx:170-182` `[读]` |
| `page.account.preferences.calendar-notify` | 开关日历事件通知 | Notifications → switch `Notify_Calendar_Events` | `user.settings.calendar.outlook.Enabled` `[读]` | 界面: `[待渲染实测]` 条件渲染 switch ／ 导航: 仍在页 `[读]` ／ 持久化: `notifyCalendarEvents` `[读]` | 共享 setPreferences | `room.toolbox.outlook-calendar` | `PreferencesNotificationsSection.tsx:183-194` `[读]` |
| `page.account.preferences.mobile-ringing` | 开关移动端响铃 | Notifications → switch `VideoConf_Mobile_Ringing` | `VideoConf_Mobile_Ringing` OR `VoIP_TeamCollab_Mobile_Ringing_Enabled` `[读]` | 界面: `[待渲染实测]` 条件渲染 switch ／ 导航: 仍在页 `[读]` ／ 持久化: `enableMobileRinging` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesNotificationsSection.tsx:195-206` `[读]` |
| `page.account.preferences.unread-alert` | 开关托盘未读提示 | 手风琴 `Messages` → switch `Unread_Tray_Icon_Alert` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `unreadAlert` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:37-46` `[读]` |
| `page.account.preferences.threads-in-main` | 开关线程回复进主频道 | Messages → switch `Always_show_thread_replies_in_main_channel` | 无 | 界面: `[待渲染实测]` switch + 描述 hint ／ 导航: 仍在页 `[读]` ／ 持久化: `showThreadsInMainChannel` `[读]` | 共享 setPreferences | `composer.send` | `PreferencesMessagesSection.tsx:47-57` `[读]` |
| `page.account.preferences.thread-to-channel` | 选「同时发到频道」默认 | Messages → select `Also_send_thread_message_to_channel_behavior` | 无 | 界面: `[待渲染实测]` default/always/never ／ 导航: 仍在页 `[读]` ／ 持久化: `alsoSendThreadToChannel` `[读]` | 共享 setPreferences | `thread.composer.reply` | `PreferencesMessagesSection.tsx:58-68` `[读]` |
| `page.account.preferences.link-clock` | 跳到外观页改时间格式 | Messages → link `Go_to_accessibility_and_appearance`（旁 label `Message_TimeFormat`） | 无 | 界面: `[待渲染实测]` 链 `href=/account/accessibility-and-appearance#clockMode` ／ 导航: 到外观页锚点 `[读]` ／ 持久化: 无（本页不存）`[读]` | core | `page.account.accessibility.clock-mode` | `PreferencesMessagesSection.tsx:69-74` `[读]` |
| `page.account.preferences.use-emojis` | 开关使用 emoji | Messages → switch `Use_Emojis` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `useEmojis` `[读]` | 共享 setPreferences | `composer.format` | `PreferencesMessagesSection.tsx:75-84` `[读]` |
| `page.account.preferences.ascii-emoji` | 开关 ASCII 转 emoji | Messages → switch `Convert_Ascii_Emojis` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `convertAsciiEmoji` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:85-94` `[读]` |
| `page.account.preferences.auto-images` | 开关自动加载图片 | Messages → switch `Auto_Load_Images` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `autoImageLoad` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:95-104` `[读]` |
| `page.account.preferences.mobile-bandwidth` | 开关节省移动流量 | Messages → switch `Save_Mobile_Bandwidth` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `saveMobileBandwidth` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:105-114` `[读]` |
| `page.account.preferences.collapse-media` | 开关默认折叠嵌入媒体 | Messages → switch `Collapse_Embedded_Media_By_Default` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `collapseMediaByDefault` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:115-124` `[读]` |
| `page.account.preferences.link-usernames` | 跳到外观页改是否显示用户名 | Messages → link（旁 `Hide_usernames`） | 无 | 界面: `[待渲染实测]` href `#hideUsernames` ／ 导航: 外观页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.accessibility.show-usernames` | `PreferencesMessagesSection.tsx:125-130` `[读]` |
| `page.account.preferences.link-roles` | 跳到外观页改是否显示角色 | Messages → link（旁 `Hide_roles`） | 无 | 界面: `[待渲染实测]` href `#hideRoles` ／ 导航: 外观页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.accessibility.show-roles` | `PreferencesMessagesSection.tsx:131-136` `[读]` |
| `page.account.preferences.hide-flextab` | 开关隐藏右侧 flextab | Messages → switch `Hide_flextab` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `hideFlexTab` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesMessagesSection.tsx:137-146` `[读]` |
| `page.account.preferences.display-avatars` | 开关消息头像 | Messages → switch `Display_avatars` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `displayAvatars` `[读]` | 共享 setPreferences | `nav.sort.display.avatars` | `PreferencesMessagesSection.tsx:147-156` `[读]` |
| `page.account.preferences.send-on-enter` | 选 Enter 发送行为 | Messages → select `Enter_Behaviour` | 无；选项 normal/alternative/desktop `[读]` | 界面: `[待渲染实测]` select + `Enter_Behaviour_Description` ／ 导航: 仍在页 `[读]` ／ 持久化: `sendOnEnter` `[读]` | 共享 setPreferences | `composer.send.enter-behavior` `shortcut.composer.send` | `PreferencesMessagesSection.tsx:157-164` `[读]` |
| `page.account.preferences.highlights` | 编辑高亮词列表 | 手风琴 `Highlights` → textarea `Highlights_List` | 无 | 界面: `[待渲染实测]` 4 行 + `Highlights_How_To` ／ 导航: 仍在页 `[读]` ／ 持久化: Save 按 `,`/`\n` 拆成数组 `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesHighlightsSection.tsx:11-21` `AccountPreferencesPage.tsx:50-58` `[读]` |
| `page.account.preferences.master-volume` | 调主音量 | 手风琴 `Sound` → slider `Master_volume` | 无 | 界面: `[待渲染实测]` 0–100 slider ／ 导航: 仍在页 `[读]` ／ 持久化: `masterVolume` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesSoundSection.tsx:25-31` `[读]` |
| `page.account.preferences.notification-volume` | 调通知音量（并试听） | Sound → slider `Notification_volume` | 无 | 界面: `[待渲染实测]` 拖动即 `customSound.play(newMessageNotification)` `[读]` ／ 导航: 仍在页 `[读]` ／ 持久化: `notificationsSoundVolume` `[读]` | 共享 setPreferences | `page.account.preferences.new-message-sound` | `PreferencesSoundSection.tsx:32-53` `[读]` |
| `page.account.preferences.ringer-volume` | 调来电铃声音量（并试听） | Sound → slider `Call_ringer_volume` | 无 | 界面: `[待渲染实测]` 拖动 play `telephone` ／ 导航: 仍在页 `[读]` ／ 持久化: `voipRingerVolume` `[读]` | 共享 setPreferences | `nav.voip.call` | `PreferencesSoundSection.tsx:54-75` `[读]` |
| `page.account.preferences.new-room-sound` | 选新房间提示音 | Sound → select `New_Room_Notification` | 选项来自 `useCustomSound().list` `[读]` | 界面: `[待渲染实测]` 改选项即试听 ／ 导航: 仍在页 `[读]` ／ 持久化: `newRoomNotification` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesSoundSection.tsx:76-93` `[读]` |
| `page.account.preferences.new-message-sound` | 选新消息提示音 | Sound → select `New_Message_Notification` | 同上 | 界面: `[待渲染实测]` 改选项即试听 ／ 导航: 仍在页 `[读]` ／ 持久化: `newMessageNotification` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesSoundSection.tsx:94-113` `[读]` |
| `page.account.preferences.mute-focused` | 开关静音已聚焦会话 | Sound → switch `Mute_Focused_Conversations` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `muteFocusedConversations` `[读]` | 共享 setPreferences | `account.preferences` | `PreferencesSoundSection.tsx:114-123` `[读]` |
| `page.account.preferences.download-my-data` | 申请下载自己的数据（非完整导出） | 手风琴 `My Data` → `Download_My_Data` | `UserData_EnableDownload` 才渲染整段 `[读]` | 界面: `[待渲染实测]` `MyDataModal` 标题 `UserDataDownload_Requested`（三种已存在/排队文案）／ 导航: 模态叠在偏好页 `[读]` ／ 持久化: `GET /v1/users.requestDataDownload?fullExport=false` `[读]` | core | `account.preferences` | `PreferencesMyDataSection.tsx:75-83,16-73` `[读]` |
| `page.account.preferences.export-my-data` | 申请完整导出自己的数据 | `My Data` → `Export_My_Data` | 同上 | 界面: `[待渲染实测]` 同模态族 ／ 导航: 模态 `[读]` ／ 持久化: `GET /v1/users.requestDataDownload?fullExport=true` `[读]` | core | `page.account.preferences.download-my-data` | `PreferencesMyDataSection.tsx:76-86` `[读]` |
| `page.account.preferences.cancel` | 放弃未保存偏好 | 页脚 `Cancel` | 无 | 界面: `[待渲染实测]` reset 回 `useAccountPreferencesValues` ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.preferences.save` | `AccountPreferencesPage.tsx:95` `[读]` |
| `page.account.preferences.save` | 保存所有脏偏好 | 页脚 `Save_changes` | dirty `[读]` | 界面: `[待渲染实测]` toast `Preferences_saved` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.setPreferences` `{data: dirtyFields}` `[读]` | core | `account.preferences` | `AccountPreferencesPage.tsx:36-70,96-98` `[读]` |

本表数据行：**38**。计数见附录验算。

### B3 Security — `/account/security`

侧栏 OR：`Accounts_TwoFactorAuthentication_Enabled` | `E2E_Enable` | `Accounts_AllowPasswordChange`。改密与 2FA/E2E **不是**同一 POST。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.account.security.password` | 输入新密码 | 账号侧栏 `Security` → 手风琴 `Password` → `New_password` | `Accounts_AllowPasswordChange` + `useAllowPasswordChange`；否则 disabled + `Password_Change_Disabled` `[读]` | 界面: `[待渲染实测]` PasswordInput + `PasswordVerifier` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地，页脚 Save 才写 `[读]` | core；`POST /v1/users.updateOwnBasicInfo` `{newPassword}` | `account.security` | `ChangePassword.tsx:62-97` `[读]` |
| `page.account.security.password-confirm` | 确认新密码 | Password → `Confirm_password` | 新密码复杂度未过则 disabled `[读]` | 界面: `[待渲染实测]` 不匹配 `Passwords_do_not_match` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地 `[读]` | core | `page.account.security.password` | `ChangePassword.tsx:98-127` `[读]` |
| `page.account.security.password.cancel` | 清空未保存新密 | 页脚 `Cancel` | dirty `[读]` | 界面: `[待渲染实测]` 两框清空 ／ 导航: 仍在 security `[读]` ／ 持久化: 无 `[读]` | core | `page.account.security.password.save` | `AccountSecurityPage.tsx:84` `[读]` |
| `page.account.security.password.save` | 提交改密 | 页脚 `Save_changes`（绑 password 表单） | dirty 且复杂度过 `[读]` | 界面: `[待渲染实测]` toast `Password_changed_successfully` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.updateOwnBasicInfo` `{data:{newPassword}}` `[读]` | core | `account.security` | `ChangePassword.tsx:43-57` `AccountSecurityPage.tsx:85-87` `[读]` |
| `page.account.security.totp.toggle` | 开关 TOTP 二次验证 | 手风琴 `Two Factor Authentication` → switch `Two-factor_authentication_via_TOTP` | `Accounts_TwoFactorAuthentication_Enabled` + `Accounts_TwoFactorAuthentication_By_TOTP_Enabled` `[读]` | 界面: `[待渲染实测]` 开→进入登记；关→`TwoFactorTotpModal` 要验证码 ／ 导航: 仍在页 `[读]` ／ 持久化: 开 `POST /v1/users.enableTotp`；关 `POST /v1/users.disableTotp` `{code}` `[读]` | core | `account.security` `route.2fa` | `TwoFactorTOTP.tsx:31-32,100-106,151-154` `[读]` |
| `page.account.security.totp.secret` | 复制 TOTP 密钥（替代扫码） | 登记中 → `TextCopy` 密钥 | 刚 enable、尚未 verify `[读]` | 界面: `[待渲染实测]` 密钥可复制 + QR `img` aria-hidden ／ 导航: 仍在页 `[读]` ／ 持久化: 密钥来自 enableTotp 响应，未 verify 前未启用 `[读]` | core | `page.account.security.totp.toggle` | `TwoFactorTOTP.tsx:156-161` `[读]` |
| `page.account.security.totp.verify` | 用应用码完成 TOTP 启用 | 登记中 → `Enter_code_provided_by_authentication_app` → `Verify` | 登记态 `[读]` | 界面: `[待渲染实测]` 成功 toast `Two-factor_authentication_enabled` + `BackupCodesModal`；错码 `Invalid_two_factor_code` ／ 导航: 模态叠在页上 `[读]` ／ 持久化: `POST /v1/users.validateTotp` `{code}` `[读]` | core | `page.account.security.totp.toggle` | `TwoFactorTOTP.tsx:111-128,162-170` `[读]` |
| `page.account.security.totp.regenerate` | 重新生成备份码 | TOTP 已启用 → `Regenerate_codes` → 再输入 TOTP | 已启用；剩余数 `GET /v1/users.totpCodesRemaining` `[读]` | 界面: `[待渲染实测]` 文案 `You_have_n_codes_remaining`；确认后 BackupCodesModal ／ 导航: 模态 `[读]` ／ 持久化: `POST /v1/users.regenerateTotpCodes` `{code}` `[读]` | core | `page.account.security.totp.toggle` | `TwoFactorTOTP.tsx:130-145,173-180` `[读]` |
| `page.account.security.email-2fa` | 开关邮件二次验证 | 2FA 手风琴 → switch `Two-factor_authentication_email` | 2FA 总开 + `Accounts_TwoFactorAuthentication_By_Email_Enabled`；OAuth 用户另要 `Accounts_twoFactorAuthentication_email_available_for_OAuth_users` `[读]` | 界面: `[待渲染实测]` switch 立即切；toast enabled/disabled ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.2fa.enableEmail` 或 `disableEmail` `[读]` | core | `account.security` `route.2fa` | `TwoFactorEmail.tsx:18-37,43-47` `[读]` |
| `page.account.security.e2e-passphrase` | 输入新 E2E 口令 | 手风琴 `End-to-end_encryption` → `New_E2EE_password` | `E2E_Enable`；本地密钥须 READY/SAVE_PASSWORD 否则 disabled `[读]` | 界面: `[待渲染实测]` PasswordInput + 30 位策略 `PasswordVerifierList` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地 `[读]` | core | `account.security` | `ChangePassphrase.tsx:109-161` `[读]` |
| `page.account.security.e2e-passphrase-confirm` | 确认新 E2E 口令 | 策略通过后出现 `Confirm_new_E2EE_password` | 同上；策略未过不渲染 `[读]` | 界面: `[待渲染实测]` 不匹配 `Passwords_do_not_match` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地 `[读]` | core | `page.account.security.e2e-passphrase` | `ChangePassphrase.tsx:162-193` `[读]` |
| `page.account.security.e2e-enter-current` | 先输入当前 E2E 口令才能改 | 密钥未解码 → hint 链「enter your current E2EE password」 | keysExist=false `[读]` | 界面: `[待渲染实测]` 链点击走 `e2e.decodePrivateKeyFlow()`（另模态）／ 导航: 解码流模态 `[待渲染实测]` ／ 持久化: 本地解开私钥，不 reset 服务端 `[读]` | core | `page.account.security.e2e-passphrase` | `ChangePassphrase.tsx:145-159` `[读]` |
| `page.account.security.e2e-save` | 保存新 E2E 口令 | 段内 `Save_changes`（**不是**页脚改密 Save） | keysExist && valid && isValid `[读]` | 界面: `[待渲染实测]` toast `Encryption_key_saved_successfully` ／ 导航: 仍在页 `[读]` ／ 持久化: `e2e.changePassword`（客户端 E2E，非 REST 改密）`[读]` | core | `account.security` | `ChangePassphrase.tsx:87-97,195-197` `[读]` |
| `page.account.security.e2e-reset` | 重置 E2E 密钥并登出 | `Reset_E2EE_password` 按钮 | `E2E_Enable` `[读]` | 界面: `[待渲染实测]` toast `E2EE_password_reset` ／ 导航: `logout()` `[读]` ／ 持久化: `POST /v1/users.resetE2EKey` `{}` `[读]` | core | `page.account.security.e2e-passphrase` | `ResetPassphrase.tsx:6-18` `useResetE2EPasswordMutation.ts:10-17` `[读]` |

本表数据行：**14**。计数见附录验算。

### B4 Accessibility / Appearance — `/account/accessibility-and-appearance`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.account.accessibility.link-statement` | 打开无障碍声明外链 | 顶栏头像→`Accessibility_and_Appearance` → `Accessibility_statement` | 无 | 界面: `[待渲染实测]` 外链 `links.go.accessibilityStatement` ／ 导航: 新标签 `[待渲染实测]` ／ 持久化: 无 `[读]` | core | `account.accessibility-and-appearance` | `AccessibilityPage.tsx:100-102` `[读]` |
| `page.account.accessibility.link-glossary` | 打开简写术语表外链 | 同上 → `Glossary_of_simplified_terms` | 无 | 界面: `[待渲染实测]` 外链 glossary ／ 导航: 外站 `[待渲染实测]` ／ 持久化: 无 `[读]` | core | `page.account.accessibility.link-statement` | `AccessibilityPage.tsx:103-105` `[读]` |
| `page.account.accessibility.link-docs` | 打开无障碍功能文档 | 同上 → `Accessibility_feature_documentation` | 无 | 界面: `[待渲染实测]` 外链 ／ 导航: 外站 `[待渲染实测]` ／ 持久化: 无 `[读]` | core | `page.account.accessibility.link-statement` | `AccessibilityPage.tsx:106-108` `[读]` |
| `page.account.accessibility.theme.light` | 选浅色主题 | 手风琴 `Theme` → radio `Theme_light` | 无；四选一 `themeAppearence` `[读]` | 界面: `[待渲染实测]` radio 勾上 ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `themeAppearence=light` `[读]` | 共享 `POST /v1/users.setPreferences` | `account.accessibility-and-appearance` | `themeItems.ts:9-13` `AccessibilityPage.tsx:113-137` `[读]` |
| `page.account.accessibility.theme.dark` | 选深色主题 | Theme → radio `Theme_dark` | 无 | 界面: `[待渲染实测]` radio ／ 导航: 仍在页 `[读]` ／ 持久化: `themeAppearence=dark` `[读]` | 共享 setPreferences | `page.account.accessibility.theme.light` | `themeItems.ts:14-18` `[读]` |
| `page.account.accessibility.theme.high-contrast` | 选高对比主题 | Theme → radio `Theme_high_contrast` | 无 | 界面: `[待渲染实测]` radio ／ 导航: 仍在页 `[读]` ／ 持久化: `themeAppearence=high-contrast` `[读]` | 共享 setPreferences | `page.account.accessibility.theme.light` | `themeItems.ts:19-23` `[读]` |
| `page.account.accessibility.theme.auto` | 选跟随系统主题 | Theme → radio `Theme_match_system` | 无 | 界面: `[待渲染实测]` radio ／ 导航: 仍在页 `[读]` ／ 持久化: `themeAppearence=auto` `[读]` | 共享 setPreferences | `page.account.accessibility.theme.light` | `themeItems.ts:24-28` `[读]` |
| `page.account.accessibility.font-size` | 改字号 | 手风琴 `Adjustable_layout` → select `Font_size` | 无 | 界面: `[待渲染实测]` select；Save 后 `createFontStyleElement` 写 style `[读]` ／ 导航: 仍在页 `[读]` ／ 持久化: `fontSize` `[读]` | 共享 setPreferences | `account.accessibility-and-appearance` | `AccessibilityPage.tsx:144-150,69-72` `[读]` |
| `page.account.accessibility.mentions-symbol` | 开关 @ 提及符号 | Adjustable_layout → switch `Mentions_with_@_symbol` | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `mentionsWithSymbol` `[读]` | 共享 setPreferences | `account.accessibility-and-appearance` | `AccessibilityPage.tsx:151-168` `[读]` |
| `page.account.accessibility.clock-mode` | 选消息时间格式 | `#clockMode` → select `Message_TimeFormat` | 无；0 Default / 1 12h / 2 24h `[读]` | 界面: `[待渲染实测]` select ／ 导航: 仍在页（可从偏好 FieldLink 深链）`[读]` ／ 持久化: `clockMode` `[读]` | 共享 setPreferences | `page.account.preferences.link-clock` | `AccessibilityPage.tsx:169-178` `[读]` |
| `page.account.accessibility.show-usernames` | 开关显示作者用户名 | `#hideUsernames` → switch `Show_usernames`（存值取反 `hideUsernames`） | 无 | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `hideUsernames`（UI 是 Show）`[读]` | 共享 setPreferences | `page.account.preferences.link-usernames` | `AccessibilityPage.tsx:179-191` `[读]` |
| `page.account.accessibility.show-roles` | 开关显示作者角色 | `#hideRoles` → switch `Show_roles`（存值取反 `hideRoles`） | `UI_DisplayRoles` `[读]` | 界面: `[待渲染实测]` 条件渲染 switch ／ 导航: 仍在页 `[读]` ／ 持久化: `hideRoles` `[读]` | 共享 setPreferences | `page.account.preferences.link-roles` | `AccessibilityPage.tsx:192-206` `[读]` |
| `page.account.accessibility.cancel` | 放弃未保存外观 | 页脚 `Cancel` | dirty | 界面: `[待渲染实测]` reset ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.accessibility.save` | `AccessibilityPage.tsx:214` `[读]` |
| `page.account.accessibility.save` | 保存外观与无障碍 | 页脚 `Save_changes` | dirty `[读]` | 界面: `[待渲染实测]` toast `Preferences_saved`；字号即时写 style `[读]` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.setPreferences` `[读]` | core | `account.accessibility-and-appearance` | `AccessibilityPage.tsx:63-78,215-217` `[读]` |

本表数据行：**14**。计数见附录验算。

### B5 Feature preview — `/account/feature-preview`

`defaultFeaturesPreview` 目前 **2** 个开关（`useFeaturePreviewList.ts:21-38`）。打开页若有 unseen 会先 `setPreferences` 记已读。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.account.feature-preview.empty` | 无预览功能时看空态 | 进入页且 `featuresPreview.length===0` | `Accounts_AllowFeaturePreview` 且列表可被滤空 `[读]` | 界面: `[待渲染实测]` States `No_feature_to_preview` ／ 导航: 仍在页 `[读]` ／ 持久化: 无新写（unseen 逻辑不跑）`[读]` | core | `account.feature-preview` | `AccountFeaturePreviewPage.tsx:82-87` `[读]` |
| `page.account.feature-preview.secondary-sidebar` | 开关二级侧栏预览 | 手风琴 Navigation → switch `Filters_and_secondary_sidebar` | 功能在 defaultFeaturesPreview 且 enabled `[读]` | 界面: `[待渲染实测]` switch id=`secondarySidebar` + 预览图 ／ 导航: 仍在页 `[读]` ／ 持久化: Save → `featuresPreview[{name,value}]` `[读]` | 共享 setPreferences | `sidebar.filter.all` `nav.user.account.feature-preview` | `useFeaturePreviewList.ts:22-30` `AccountFeaturePreviewPage.tsx:100-111` `[读]` |
| `page.account.feature-preview.ai-search` | 开关智能搜索预览 | 手风琴 AI → switch `Intelligent_Search` | 同上 | 界面: `[待渲染实测]` switch id=`aiSearch` ／ 导航: 仍在页 `[读]` ／ 持久化: 同上 `[读]` | 共享 setPreferences | `nav.search.ai` `route.search` | `useFeaturePreviewList.ts:31-37` `[读]` |
| `page.account.feature-preview.cancel` | 放弃未保存预览开关 | 页脚 `Cancel` | dirty | 界面: `[待渲染实测]` reset 回当前 features ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.feature-preview.save` | `AccountFeaturePreviewPage.tsx:130` `[读]` |
| `page.account.feature-preview.save` | 保存功能预览开关 | 页脚 `Save_changes` | dirty `[读]` | 界面: `[待渲染实测]` toast `Preferences_saved` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.setPreferences` `{featuresPreview}` `[读]` | core | `account.feature-preview` | `AccountFeaturePreviewPage.tsx:58-68,131-133` `[读]` |

本表数据行：**5**。计数见附录验算。

### B6 Integrations (WebDAV) — `/account/integrations`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.account.integrations.select` | 选择要移除的 WebDAV 账号 | 账号侧栏 `Integrations` → select `WebDAV_Accounts` | `Webdav_Integration_Enabled` `[读]` | 界面: `[待渲染实测]` 选项=`getWebdavServerName`；空则无 option ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地选中 `[读]` | core | `account.integrations` | `AccountIntegrationsPage.tsx:48-61` `[读]` |
| `page.account.integrations.remove` | 移除所选 WebDAV 账号 | 选中 → danger `Remove` | required `accountSelected` `[读]` | 界面: `[待渲染实测]` toast `Webdav_account_removed`；未选 `Required_field(WebDAV_Accounts)` ／ 导航: 仍在页 `[读]` ／ 持久化: `useRemoveWebDAVAccountIntegrationMutation`（删集成记录）`[读]` | core | `account.integrations` | `AccountIntegrationsPage.tsx:31-42,58-60` `[读]` |

本表数据行：**2**。计数见附录验算。

### B7 Personal access tokens — `/account/tokens`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.account.tokens.name` | 填写新令牌名 | 账号侧栏 `Personal_Access_Tokens` → placeholder=`API_Add_Personal_Access_Token` | `create-personal-access-tokens` `[读]` | 界面: `[待渲染实测]` textbox data-qa=`PersonalTokenField` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅本地 `[读]` | core | `account.tokens` | `AddToken.tsx:74-86` `[读]` |
| `page.account.tokens.name.required` | 空名被拦 | 空名 → `Add` | 同 | 界面: `[待渲染实测]` `Please_provide_a_name_for_your_token` ／ 导航: 不弹成功模态 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.tokens.name` | `AddToken.tsx:77` `[读]` |
| `page.account.tokens.bypass-2fa` | 选令牌是否绕过 2FA | 同行 select：`Require_Two_Factor_Authentication` / `Ignore_Two_Factor_Authentication` | 无 | 界面: `[待渲染实测]` select ／ 导航: 仍在页 `[读]` ／ 持久化: 随 Add `bypassTwoFactor` bool `[读]` | core | `page.account.tokens.add` | `AddToken.tsx:34-40,88-93` `[读]` |
| `page.account.tokens.add` | 生成个人访问令牌 | `Add` | 同页权限 | 界面: `[待渲染实测]` 成功模态 `API_Personal_Access_Token_Generated` 展示 token+userId（只此一次）／ 导航: 模态；确认后 reload 表 `[读]` ／ 持久化: `POST /v1/users.generatePersonalAccessToken` `[读]` | core | `account.tokens` | `AddToken.tsx:42-65,95-97` `[读]` |
| `page.account.tokens.regenerate` | 重新生成某令牌 | 行 → title=`Refresh` → 警告模态 `API_Personal_Access_Tokens_Regenerate_It` | 同行有 name `[读]` | 界面: `[待渲染实测]` 再出 Generated 模态显示新 token ／ 导航: 仍在 tokens `[读]` ／ 持久化: `POST /v1/users.regeneratePersonalAccessToken` `{tokenName}` `[读]` | core | `page.account.tokens.add` | `AccountTokensTable.tsx:66-101` `AccountTokensRow.tsx:31` `[读]` |
| `page.account.tokens.remove` | 撤销某令牌 | 行 → title=`Remove` → danger `API_Personal_Access_Tokens_Remove_Modal` → `Remove` | 同 | 界面: `[待渲染实测]` toast `Token_has_been_removed` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.removePersonalAccessToken` `[读]` | core | `page.account.tokens.add` | `AccountTokensTable.tsx:103-123` `AccountTokensRow.tsx:32` `[读]` |
| `page.account.tokens.pagination` | 翻页浏览令牌 | 表底 `Pagination` | 有 token `[读]` | 界面: `[待渲染实测]` 切片 `tokens.slice` ／ 导航: 仍在页 `[读]` ／ 持久化: 仅客户端分页；列表 `GET /v1/users.getPersonalAccessTokens` `[读]` | core | `page.account.tokens.add` | `AccountTokensTable.tsx:41-50,172-180` `[读]` |
| `page.account.tokens.empty` | 无令牌时空态 | 列表空 | 同 | 界面: `[待渲染实测]` `GenericNoResults` ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.tokens.add` | `AccountTokensTable.tsx:183` `[读]` |
| `page.account.tokens.retry` | 加载失败后重试 | 错误 States → `Retry` | 查询 error `[读]` | 界面: `[待渲染实测]` `Something_went_wrong` / `We_Could_not_retrive_any_data` ／ 导航: 仍在页 `[读]` ／ 持久化: invalidate `personalAccessTokens` `[读]` | core | `page.account.tokens.pagination` | `AccountTokensTable.tsx:125-140` `[读]` |

本表数据行：**9**。计数见附录验算。

### B8 Sessions / Manage Devices — `/account/manage-devices`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.account.sessions.sort.client` | 按客户端排序会话 | 账号侧栏 `Manage_Devices` → 表头 `Client` | EE `device-management` `[读]` | 界面: `[待渲染实测]` 排序箭头 ／ 导航: 仍在页 `[读]` ／ 持久化: `GET /v1/sessions/list` `{sort: device.name}` `[读]` | EE:device-management | `account.manage-devices` | `DeviceManagementAccountTable.tsx:42-44` `[读]` |
| `page.account.sessions.sort.os` | 按操作系统排序 | 表头 `OS` | 同上 | 界面: `[待渲染实测]` 重排 ／ 导航: 仍在页 `[读]` ／ 持久化: sort `device.os.name` `[读]` | EE:device-management | `page.account.sessions.sort.client` | `DeviceManagementAccountTable.tsx:45-47` `[读]` |
| `page.account.sessions.sort.login-at` | 按最后登录排序 | 表头 `Last_login`（默认） | 同上 | 界面: `[待渲染实测]` 重排 ／ 导航: 仍在页 `[读]` ／ 持久化: sort `loginAt` `[读]` | EE:device-management | `page.account.sessions.sort.client` | `DeviceManagementAccountTable.tsx:48-50` `[读]` |
| `page.account.sessions.pagination` | 翻页会话 | 表底 Pagination | 同上 | 界面: `[待渲染实测]` 换页 ／ 导航: 仍在页 `[读]` ／ 持久化: list `count/offset` `[读]` | EE:device-management | `page.account.sessions.sort.client` | `DeviceManagementAccountTable.tsx:20,72-77` `[读]` |
| `page.account.sessions.logout` | 登出某一设备（含当前） | 行 → `Logout` | 同上；当前行文案带 `(current)` `[读]` | 界面: `[待渲染实测]` 行消失或当前会话被踢 ／ 导航: 若登出当前则回登录 `[待渲染实测]` ／ 持久化: `POST /v1/sessions/logout.me` `[读]` | EE:device-management | `page.account.profile.logout-others` | `DeviceManagementAccountRow.tsx:24,42-44` `[读]` |

本表数据行：**5**。计数见附录验算。

### B9 Account Omnichannel — `/account/omnichannel`

04 有入口 `account.omnichannel`。本表拆可保存控件（同 `users.setPreferences`）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.account.omnichannel.hide-after-close` | 开关关单后隐藏会话 | 账号侧栏 `Omnichannel` → switch `Omnichannel_hide_conversation_after_closing` | 侧栏：`send-omnichannel-chat-transcript` OR `request-pdf-transcript` `[读]` | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `omnichannelHideConversationAfterClosing` `[读]` | 共享 setPreferences | `account.omnichannel` | `PreferencesGeneral.tsx:11-21` `[读]` |
| `page.account.omnichannel.transcript-pdf` | 开关 PDF transcript | 手风琴 `Conversational_transcript` → `Omnichannel_transcript_pdf` | EE `livechat-enterprise` + `request-pdf-transcript`；否则 disabled + Premium/No_permission 标签 `[读]` | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `omnichannelTranscriptPDF` `[读]` | EE:livechat-enterprise（完整） | `account.omnichannel` | `PreferencesConversationTranscript.tsx:22-40` `[读]` |
| `page.account.omnichannel.transcript-email` | 开关邮件 transcript | 同上 → `Omnichannel_transcript_email` | `send-omnichannel-chat-transcript`；`Livechat_transcript_send_always` 则 disabled `[读]` | 界面: `[待渲染实测]` switch ／ 导航: 仍在页 `[读]` ／ 持久化: `omnichannelTranscriptEmail` `[读]` | core（全渠道） | `account.omnichannel` | `PreferencesConversationTranscript.tsx:41-56` `[读]` |
| `page.account.omnichannel.cancel` | 放弃未保存坐席偏好 | 页脚 `Cancel` | dirty | 界面: `[待渲染实测]` reset ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.account.omnichannel.save` | `OmnichannelPreferencesPage.tsx:64` `[读]` |
| `page.account.omnichannel.save` | 保存坐席全渠道偏好 | 页脚 `Save_changes` | dirty `[读]` | 界面: `[待渲染实测]` toast `Preferences_saved` ／ 导航: 仍在页 `[读]` ／ 持久化: `POST /v1/users.setPreferences` `[读]` | core | `account.omnichannel` | `OmnichannelPreferencesPage.tsx:37-47,65-66` `[读]` |

本表数据行：**5**。计数见附录验算。

## C. Directory — `/directory`

04 只写 tab 入口（`directory.channels|users|teams|external`）。本表写搜索/排序/分页/行点击。列表一律 `GET /v1/directory`（`useDirectoryQuery` 500ms debounce）。`FilterByText` **无搜索按钮**，输入即滤。`federationEnabled` 写死 false，External 页签不渲染。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.directory.tab.channels` | 切到频道目录 | 顶栏 Directory 或 Home `Open_directory` → tab `Channels` | tab 内容：`view-c-room` 否则 `NotAuthorizedPage` `[读]` | 界面: `[待渲染实测]` tab selected；无权则未授权页 ／ 导航: `/directory/channels` `[读]` ／ 持久化: 无 `[读]` | core | `directory.channels` `route.directory` | `DirectoryPage.tsx:43-45,59` `ChannelsTab.tsx:6-13` `[读]` |
| `page.directory.tab.users` | 切到用户目录 | Directory → tab `Users` | `view-outside-room` AND `view-d-room` `[读]` | 界面: `[待渲染实测]` Users 表或未授权 ／ 导航: `/directory/users` `[读]` ／ 持久化: 无 `[读]` | core | `directory.users` | `DirectoryPage.tsx:46-48,60` `UsersTab.tsx:10-18` `[读]` |
| `page.directory.tab.teams` | 切到团队目录 | Directory → tab `Teams` | `view-c-room` `[读]` | 界面: `[待渲染实测]` Teams 表或未授权 ／ 导航: `/directory/teams` `[读]` ／ 持久化: 无 `[读]` | core | `directory.teams` | `DirectoryPage.tsx:49-51,61` `TeamsTab.tsx:6-13` `[读]` |
| `page.directory.tab.external` | 联邦外部用户页签（当前不渲染） | 源码 `federationEnabled===true` 才有 tab `External_Users` | 写死 false `[读]` | 界面: `[待渲染实测]` 页签不出现；直达 `/directory/external` 被 replace 回默认 tab `[读]` ／ 导航: replace `[读]` ／ 持久化: 无 `[读]` | core（旧联邦已移除） | `directory.external` | `DirectoryPage.tsx:17,30-32,52-62` `[读]` |
| `page.directory.channels.search` | 搜索频道 | Channels 表 → textbox placeholder=`Search_Channels` | `view-c-room` `[读]` | 界面: `[待渲染实测]` 输入 500ms 后表刷新；空=`GenericNoResults` ／ 导航: 仍在 `/directory/channels` `[读]` ／ 持久化: `GET /v1/directory` text 参数，只读 `[读]` | core | `directory.channels` | `ChannelsTable.tsx:26,101` `useDirectoryQuery.ts` `[读]` |
| `page.directory.channels.sort.name` | 按名称排序频道 | 表头 `Name`（默认） | 同 | 界面: `[待渲染实测]` 排序指示 ／ 导航: 仍在页 `[读]` ／ 持久化: directory sort name `[读]` | core | `page.directory.channels.search` | `ChannelsTable.tsx:37-39` `[读]` |
| `page.directory.channels.sort.users` | 按人数排序频道 | 表头 `Users` | 同 | 界面: `[待渲染实测]` 重排 ／ 导航: 仍在页 `[读]` ／ 持久化: sort usersCount `[读]` | core | `page.directory.channels.sort.name` | `ChannelsTable.tsx:40-49` `[读]` |
| `page.directory.channels.sort.created` | 按创建时间排序 | 表头 `Created_at`（≥768px） | mediaQuery `[读]` | 界面: `[待渲染实测]` 中屏才见列 ／ 导航: 仍在页 `[读]` ／ 持久化: sort createdAt `[读]` | core | `page.directory.channels.sort.name` | `ChannelsTable.tsx:50-61` `[读]` |
| `page.directory.channels.sort.last-message` | 按最后消息排序 | 表头 `Last_Message`（≥768px） | mediaQuery `[读]` | 界面: `[待渲染实测]` 中屏列 ／ 导航: 仍在页 `[读]` ／ 持久化: sort lastMessage `[读]` | core | `page.directory.channels.sort.name` | `ChannelsTable.tsx:62-74` `[读]` |
| `page.directory.channels.col.belongs-to` | 只读「所属团队」列 | 表头 `Belongs_To`（≥768px，**不可点排序**） | mediaQuery `[读]` | 界面: `[待渲染实测]` 列出现 ／ 导航: 无 ／ 持久化: 展示字段 `[读]` | core | `page.directory.channels.sort.name` | `ChannelsTable.tsx:75-78` `[读]` |
| `page.directory.channels.pagination` | 翻页频道 | 表底 Pagination | 有结果 `[读]` | 界面: `[待渲染实测]` 换页 ／ 导航: 仍在页 `[读]` ／ 持久化: directory count/offset `[读]` | core | `page.directory.channels.search` | `ChannelsTable.tsx:120-128` `[读]` |
| `page.directory.channels.row` | 点行进入频道/私组 | 行 `role=link` 单击或 Enter | 行有 name `[读]` | 界面: `[待渲染实测]` 离开目录进房间 ／ 导航: `t==='c'` → `/channel/:name` 否则 `/group/:name` `[读]` ／ 持久化: 进房交房间分册；本行不写订阅 `[读]` | core | `directory.channels` | `ChannelsTable.tsx:90-97` `ChannelsTableRow.tsx:24` `[读]` |
| `page.directory.channels.empty` | 无匹配频道 | 搜索无结果 | 同 tab | 界面: `[待渲染实测]` `GenericNoResults` ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.directory.channels.search` | `ChannelsTable.tsx:131` `[读]` |
| `page.directory.channels.error` | 目录加载失败后重载 | States → `Reload_page` | query error `[读]` | 界面: `[待渲染实测]` `Something_went_wrong` ／ 导航: 仍在页 `[读]` ／ 持久化: refetch directory `[读]` | core | `page.directory.channels.search` | `ChannelsTable.tsx:132-139` `[读]` |
| `page.directory.channels.not-authorized` | 无 view-c-room 看未授权页 | 有 Directory 入口但无 `view-c-room` → Channels | `!view-c-room` `[读]` | 界面: `[待渲染实测]` `NotAuthorizedPage`（无表）／ 导航: URL 仍可是 `/directory/channels` `[读]` ／ 持久化: 无 `[读]` | core | `directory.channels` | `ChannelsTab.tsx:6-13` `[读]` |
| `page.directory.users.search` | 搜索用户 | Users 表 → placeholder=`Search_Users` | `view-outside-room`+`view-d-room` `[读]` | 界面: `[待渲染实测]` 500ms 后刷新 ／ 导航: `/directory/users` `[读]` ／ 持久化: directory type=users `[读]` | core | `directory.users` | `UsersTable.tsx:105` `[读]` |
| `page.directory.users.sort.name` | 按姓名排序用户 | 表头 `Name` | 同 | 界面: `[待渲染实测]` 重排 ／ 导航: 仍在页 `[读]` ／ 持久化: sort name `[读]` | core | `page.directory.users.search` | `UsersTable.tsx:42-44` `[读]` |
| `page.directory.users.sort.email` | 按邮箱排序 | 表头 `Email`（≥1024px） | `view-full-other-user-info` + mediaQuery `[读]` | 界面: `[待渲染实测]` 列+排序；无权限无列 `[读]` ／ 导航: 仍在页 `[读]` ／ 持久化: sort email `[读]` | core | `page.directory.users.search` | `UsersTable.tsx:45-56` `[读]` |
| `page.directory.users.sort.created` | 按加入时间排序 | 表头 `Joined_at`（≥1024px） | mediaQuery `[读]` | 界面: `[待渲染实测]` 宽屏列 ／ 导航: 仍在页 `[读]` ／ 持久化: sort createdAt `[读]` | core | `page.directory.users.sort.name` | `UsersTable.tsx:69-80` `[读]` |
| `page.directory.users.pagination` | 翻页用户 | 表底 Pagination | 有结果 | 界面: `[待渲染实测]` 换页 ／ 导航: 仍在页 `[读]` ／ 持久化: count/offset `[读]` | core | `page.directory.users.search` | `UsersTable.tsx:131-139` `[读]` |
| `page.directory.users.row` | 点行打开与该用户的 DM | 行单击/Enter | 行有 username `[读]` | 界面: `[待渲染实测]` 进 1:1 ／ 导航: `direct` route `{rid: username}` `[读]` ／ 持久化: 进房交房间分册 `[读]` | core | `directory.users` `user.action.direct-message` | `UsersTable.tsx:93-101` `[读]` |
| `page.directory.users.empty` | 无匹配用户 | 搜索无结果 | 同 tab | 界面: `[待渲染实测]` `GenericNoResults` ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.directory.users.search` | `UsersTable.tsx:142` `[读]` |
| `page.directory.users.error` | 用户目录失败重载 | `Reload_page` | error | 界面: `[待渲染实测]` warning States ／ 导航: 仍在页 `[读]` ／ 持久化: refetch `[读]` | core | `page.directory.users.search` | `UsersTable.tsx:143-150` `[读]` |
| `page.directory.users.not-authorized` | 缺 outside/d 权限看未授权 | 无 `view-outside-room` 或 `view-d-room` | 见门控 | 界面: `[待渲染实测]` `NotAuthorizedPage` ／ 导航: URL 可仍是 users `[读]` ／ 持久化: 无 `[读]` | core | `directory.users` | `UsersTab.tsx:11-18` `[读]` |
| `page.directory.teams.search` | 搜索团队 | Teams → placeholder=`Teams_Search_teams` | `view-c-room` | 界面: `[待渲染实测]` 500ms 刷新 ／ 导航: `/directory/teams` `[读]` ／ 持久化: directory type=teams `[读]` | core | `directory.teams` | `TeamsTable.tsx:26,77` `[读]` |
| `page.directory.teams.sort.name` | 按名称排序团队 | 表头 `Name` | 同 | 界面: `[待渲染实测]` 重排 ／ 导航: 仍在页 `[读]` ／ 持久化: sort name `[读]` | core | `page.directory.teams.search` | `TeamsTable.tsx:34-36` `[读]` |
| `page.directory.teams.col.channels` | 只读频道数（不排序） | 表头 `Channels` | 同 | 界面: `[待渲染实测]` 列 `roomsCount` ／ 导航: 无 ／ 持久化: 展示 `[读]` | core | `page.directory.teams.sort.name` | `TeamsTable.tsx:37-39` `[读]` |
| `page.directory.teams.sort.created` | 按创建时间排序团队 | 表头 `Created_at`（≥768px） | mediaQuery | 界面: `[待渲染实测]` 中屏列 ／ 导航: 仍在页 `[读]` ／ 持久化: sort createdAt `[读]` | core | `page.directory.teams.sort.name` | `TeamsTable.tsx:40-51` `[读]` |
| `page.directory.teams.pagination` | 翻页团队 | Pagination | 有结果 | 界面: `[待渲染实测]` 换页 ／ 导航: 仍在页 `[读]` ／ 持久化: count/offset `[读]` | core | `page.directory.teams.search` | `TeamsTable.tsx:101-109` `[读]` |
| `page.directory.teams.row` | 点行进入团队主房间 | 行单击/Enter | 有 name | 界面: `[待渲染实测]` 进主房 ／ 导航: public→channel 否则 group `[读]` ／ 持久化: 进房交房间分册 `[读]` | core | `directory.teams` `team.create` | `TeamsTable.tsx:66-73` `[读]` |
| `page.directory.teams.empty` | 无匹配团队 | 无结果 | 同 | 界面: `[待渲染实测]` `GenericNoResults` ／ 导航: 仍在页 `[读]` ／ 持久化: 无 `[读]` | core | `page.directory.teams.search` | `TeamsTable.tsx:112` `[读]` |
| `page.directory.teams.error` | 团队目录失败重载 | `Reload_page` | error | 界面: `[待渲染实测]` States ／ 导航: 仍在页 `[读]` ／ 持久化: refetch `[读]` | core | `page.directory.teams.search` | `TeamsTable.tsx:113-120` `[读]` |
| `page.directory.teams.not-authorized` | 无 view-c-room 看未授权 | 缺权限进 Teams | `!view-c-room` | 界面: `[待渲染实测]` `NotAuthorizedPage` ／ 导航: URL 可仍是 teams `[读]` ／ 持久化: 无 `[读]` | core | `directory.teams` | `TeamsTab.tsx:6-13` `[读]` |

本表数据行：**33**。计数见附录验算。

## D. Home — `/home`

04 `route.home` 把卡片写进一行。本表按卡/CTA 拆。`Layout_Custom_Body_Only` 为真则只渲染 `CustomHomePage`（无默认卡）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.home.customize` | 从 Home 头进入 Layout 设置 | Home 页头 `Customize` | `view-privileged-setting` AND `edit-privileged-setting` AND `manage-selected-settings` `[读]` | 界面: `[待渲染实测]` 按钮 pencil ／ 导航: `/admin/settings/Layout` `[读]` ／ 持久化: 无（打开设置组）`[读]` | core | `route.home` `page.admin.settings.open.layout` | `HomePageHeader.tsx:10-18` `[读]` |
| `page.home.add-users` | 从欢迎卡去用户管理 | 卡 `Add_users` → 主按钮 `Add_users` | `view-user-administration` 才渲染卡 `[读]` | 界面: `[待渲染实测]` 卡 title=`Add_users` ／ 导航: `/admin/users` `[读]` ／ 持久化: 无 `[读]` | core | `route.admin.users` `page.admin.users.new` | `AddUsersCard.tsx:11-23` `DefaultHomePage.tsx:18,37` `[读]` |
| `page.home.create-channel` | 从欢迎卡打开创建频道 | 卡 `Create_channels` → `Create_channel` | `create-c` OR `create-p` `[读]` | 界面: `[待渲染实测]` 叠 `CreateChannelModal` ／ 导航: 仍在 `/home` 直到提交 `[读]` ／ 持久化: 见 `page.create.channel.submit` `[读]` | core | `nav.create.channel` `page.create.channel.name` | `CreateChannelsCard.tsx:12-21` `DefaultHomePage.tsx:38` `[读]` |
| `page.home.open-directory` | 从欢迎卡打开目录 | 卡 `Join_rooms` → `Open_directory` | 卡始终渲染（有 Home）`[读]` | 界面: `[待渲染实测]` ／ 导航: `/directory` `[读]` ／ 持久化: 无 `[读]` | core | `route.directory` `page.directory.tab.users` | `JoinRoomsCard.tsx:11-22` `DefaultHomePage.tsx:39` `[读]` |
| `page.home.mobile.google` | 打开 Google Play | 卡 `Mobile_apps` → link `Google_Play` | 无 | 界面: `[待渲染实测]` role=link ／ 导航: 外链 `links.go.mobileAppGoogle` `[读]` ／ 持久化: 无 `[读]` | core | `route.home` | `MobileAppsCard.tsx:21-23` `[读]` |
| `page.home.mobile.apple` | 打开 App Store | 卡 `Mobile_apps` → link `App_Store` | 无 | 界面: `[待渲染实测]` role=link ／ 导航: `links.go.mobileAppApple` `[读]` ／ 持久化: 无 `[读]` | core | `page.home.mobile.google` | `MobileAppsCard.tsx:24-26` `[读]` |
| `page.home.desktop.windows` | 打开 Windows 客户端下载 | 卡 `Desktop_apps` → `Platform_Windows` | 无 | 界面: `[待渲染实测]` role=link ／ 导航: `links.go.desktopAppWindows` `[读]` ／ 持久化: 无 `[读]` | core | `route.home` | `DesktopAppsCard.tsx:22-24` `[读]` |
| `page.home.desktop.linux` | 打开 Linux 客户端下载 | 同上 → `Platform_Linux` | 无 | 界面: `[待渲染实测]` ／ 导航: `desktopAppLinux` `[读]` ／ 持久化: 无 `[读]` | core | `page.home.desktop.windows` | `DesktopAppsCard.tsx:25-27` `[读]` |
| `page.home.desktop.mac` | 打开 Mac 客户端下载 | 同上 → `Platform_Mac` | 无 | 界面: `[待渲染实测]` ／ 导航: `desktopAppMac` `[读]` ／ 持久化: 无 `[读]` | core | `page.home.desktop.windows` | `DesktopAppsCard.tsx:28-30` `[读]` |
| `page.home.docs` | 打开产品文档 | 卡 `Documentation` → `See_documentation` | 无 | 界面: `[待渲染实测]` role=link ／ 导航: `links.go.documentation` `[读]` ／ 持久化: 无 `[读]` | core | `route.home` | `DocumentationCard.tsx:20-22` `[读]` |
| `page.home.custom.body` | 阅读自定义 Home HTML | 自定义卡/仅自定义页 body | 非 admin：`Layout_Home_Custom_Block_Visible` 且 body 非空；admin 即使空也见默认说明 `[读]` | 界面: `[待渲染实测]` `CustomHomepageContent` `role=status` aria-label=HTML；或 `Homepage_Custom_Content_Default_Message` ／ 导航: 仍在 `/home` `[读]` ／ 持久化: 只读设置 `Layout_Home_Body` `[读]` | core | `route.home` | `CustomContentCard.tsx:52-99` `HomePage.tsx:6-13` `[读]` |
| `page.home.custom.edit-layout` | admin 从自定义卡去改 Layout | 自定义卡 → `Customize_Content`（title=`Layout_Home_Page_Content`） | admin 角色 `[读]` | 界面: `[待渲染实测]` ／ 导航: `/admin/settings/Layout` `[读]` ／ 持久化: 无 `[读]` | core | `page.home.customize` | `CustomContentCard.tsx:63-65` `[读]` |
| `page.home.custom.visibility` | admin 对工作区显示/隐藏自定义块 | 自定义卡 → `Show_To_Workspace` / `Hide_On_Workspace` | admin；body 空则 disabled；visible+only 时 hide disabled `[读]` | 界面: `[待渲染实测]` Tag `Visible_To_Workspace`/`Not_Visible_To_Workspace` 切换 ／ 导航: 仍在 Home `[读]` ／ 持久化: 写设置 `Layout_Home_Custom_Block_Visible` `[读]` | core | `page.home.custom.body` | `CustomContentCard.tsx:24-30,66-74` `[读]` |
| `page.home.custom.only` | admin 开关「只显示自定义」 | 自定义卡 → `Show_Only_This_Content` / `Show_default_content` | admin + Enterprise；自定义未对工作区可见则 disabled `[读]` | 界面: `[待渲染实测]` title `Premium_only` 或显示/隐藏其他卡 ／ 导航: 仍在 Home；开 only 后整页变 `CustomHomePage` `[读]` ／ 持久化: `Layout_Custom_Body_Only` `[读]` | EE（only 需要 isEnterprise） | `page.home.custom.visibility` | `CustomContentCard.tsx:32-38,75-83` `[读]` |

本表数据行：**14**。计数见附录验算。

## E. Admin 侧栏 22 页内部控件

### E1 Workspace `/admin/info` — `page.admin.workspace.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.workspace.download-info` | 下载工作区信息 JSON | 管理侧栏 Workspace → Download_Info | view-statistics [读] | 界面: [待渲染实测] 触发本地下载 ／ 导航: 仍在 /admin/info [读] ／ 持久化: 无 REST，客户端拼 statistics JSON [读] | core | route.admin.workspace | WorkspacePage.tsx [读] |
| `page.admin.workspace.refresh` | 刷新工作区统计 | Workspace → Refresh | view-statistics [读] | 界面: [待渲染实测] 卡片数字更新 ／ 导航: 仍在页 [读] ／ 持久化: GET statistics（useWorkspaceInfo refetch）[读] | core | page.admin.workspace.download-info | WorkspaceRoute.tsx [读] |
| `page.admin.workspace.register` | 打开注册工作区向导 | VersionCard → RegisterWorkspace_Button | 未注册 [读] | 界面: [待渲染实测] RegisterWorkspaceModal ／ 导航: 模态叠在 info [读] ／ 持久化: 无请求至选方式 [读] | core | route.admin.workspace | VersionCard.tsx [读] |
| `page.admin.workspace.register.token` | 用 token 注册工作区 | 注册模态 → Use_token → 填 token → 确认 | 未注册 [读] | 界面: [待渲染实测] RegisterWorkspaceTokenModal ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/cloud.connectWorkspace [读] | core | page.admin.workspace.register | RegisterWorkspaceTokenModal.tsx [读] |
| `page.admin.workspace.register.intent` | 走 Cloud 注册意图/轮询 | 注册向导 StepOne → 继续 → StepTwo 自动轮询 | 未注册 [读] | 界面: [待渲染实测] 两步模态 ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/cloud.createRegistrationIntent 后 GET /v1/cloud.confirmationPoll [读] | core | page.admin.workspace.register | RegisterWorkspaceSetupStepTwoModal.tsx [读] |
| `page.admin.workspace.sync` | 已注册工作区同步 Cloud | RegisteredWorkspaceModal → 同步 | 已注册 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/cloud.syncWorkspace [读] | core | page.admin.subscription.sync | RegisteredWorkspaceModal.tsx [读] |
| `page.admin.workspace.update` | 打开版本更新外链 | VersionCard → Update_version | 有新版本提示 [读] | 界面: [待渲染实测] 按钮 ／ 导航: 外链更新文档/下载 [读] ／ 持久化: 无 REST [读] | core | page.admin.workspace.download-info | VersionCard.tsx [读] |
| `page.admin.workspace.manage-subscription` | 从版本卡去订阅页 | VersionCard → Manage_subscription | view-statistics [读] | 界面: [待渲染实测] 链 ／ 导航: /admin/subscription [读] ／ 持久化: 无 [读] | core | page.admin.subscription.sync | VersionCard.tsx [读] |
| `page.admin.workspace.instances` | 查看部署实例列表 | DeploymentCard → 实例按钮 → InstancesModal | 多实例部署 [读] | 界面: [待渲染实测] 只读实例表 ／ 导航: 模态 [读] ／ 持久化: 无新写，展示已拉 statistics [读] | core | page.admin.workspace.download-info | DeploymentCard.tsx InstancesModal.tsx [读] |

本表数据行：**9**。计数见附录验算。

### E2 Subscription `/admin/subscription` — `page.admin.subscription.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.subscription.sync` | 同步许可证状态 | 管理侧栏 Subscription → Sync_license_update | manage-cloud [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 /admin/subscription [读] ／ 持久化: POST /v1/cloud.syncWorkspace [读] | core | route.admin.subscription | SubscriptionPage.tsx useWorkspaceSync [读] |
| `page.admin.subscription.checkout` | 打开购买/升级结账 | Subscription → Manage_subscription / Upgrade | manage-cloud [读] | 界面: [待渲染实测] 外链按钮 ／ 导航: Cloud checkout URL [读] ／ 持久化: 无本站 REST [读] | core | page.admin.subscription.sync | SubscriptionPage.tsx useCheckoutUrl [读] |
| `page.admin.subscription.cancel` | 取消订阅 | PlanCard → Cancel_subscription → 确认 | 有有效许可证 [读] | 界面: [待渲染实测] 确认模态 ／ 导航: 仍在订阅页 [读] ／ 持久化: 取消流（源码 useCancelSubscriptionModal）[读] | core | page.admin.subscription.sync | useCancelSubscriptionModal.tsx [读] |
| `page.admin.subscription.license-text` | 粘贴许可证密钥 | ManageLicenseModal → textarea | manage-cloud [读] | 界面: [待渲染实测] 多行文本 ／ 导航: 模态仍开 [读] ／ 持久化: 仅本地至 Apply [读] | core；提交见 apply | page.admin.subscription.apply | ManageLicenseModal.tsx [读] |
| `page.admin.subscription.apply` | 应用许可证密钥 | ManageLicenseModal → Apply_license | 文本非空 [读] | 界面: [待渲染实测] 校验状态 ／ 导航: 关模态或留错 [读] ／ 持久化: POST /v1/licenses.validate + 写设置 Enterprise_License [读] | core | page.admin.subscription.license-text | ManageLicenseModal.tsx useValidateLicense [读] |
| `page.admin.subscription.upload` | 上传许可证文件 | ManageLicenseModal → 选文件 | manage-cloud [读] | 界面: [待渲染实测] LicenseFilePreview ／ 导航: 仍在模态 [读] ／ 持久化: 读文件后再走 apply [读] | core | page.admin.subscription.apply | useLicenseFileInput.ts [读] |
| `page.admin.subscription.remove` | 移除许可证密钥 | ManageLicenseModal → Remove_license_key | 已有许可证 [读] | 界面: [待渲染实测] 确认后卡变社区 ／ 导航: 仍在订阅页 [读] ／ 持久化: POST /v1/cloud.removeLicense [读] | core | page.admin.subscription.apply | useRemoveLicense.ts [读] |
| `page.admin.subscription.copy-url` | 复制站点 URL / 哈希 | PlanCardLicenseDetails → Copy | 有许可证详情 [读] | 界面: [待渲染实测] 剪贴板 ／ 导航: 无 ／ 持久化: 无请求 [读] | core | page.admin.subscription.sync | PlanCardLicenseDetails.tsx [读] |

本表数据行：**8**。计数见附录验算。

### E3 Engagement `/admin/engagement/:tab` — `page.admin.engagement.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.engagement.timezone` | 改报表默认时区 | Engagement → select Default_Timezone_For_Reporting | view-engagement-dashboard + EE [读] | 界面: [待渲染实测] select ／ 导航: 仍在页 [读] ／ 持久化: 无写库；随后图表按此时区 GET [读] | EE:engagement-dashboard | route.admin.engagement | EngagementDashboardPage.tsx [读] |
| `page.admin.engagement.tab.users` | 切到 Users 分析 | Engagement → tab Users | 同上 [读] | 界面: [待渲染实测] Users 卡片组 ／ 导航: /admin/engagement/users [读] ／ 持久化: 无至图表 hook [读] | EE:engagement-dashboard | route.admin.engagement | EngagementDashboardPage.tsx [读] |
| `page.admin.engagement.tab.messages` | 切到 Messages 分析 | Engagement → tab Messages | 同上 | 界面: [待渲染实测] ／ 导航: /admin/engagement/messages [读] ／ 持久化: 无至图表 [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | EngagementDashboardPage.tsx [读] |
| `page.admin.engagement.tab.channels` | 切到 Channels 分析 | Engagement → tab Channels | 同上 | 界面: [待渲染实测] ／ 导航: /admin/engagement/channels [读] ／ 持久化: 无至图表 [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | EngagementDashboardPage.tsx [读] |
| `page.admin.engagement.users.new.period` | 改新用户图周期 | Users → NewUsersSection → Select_period | 同上 | 界面: [待渲染实测] 重绘 ／ 导航: 仍在 users [读] ／ 持久化: GET /v1/engagement-dashboard/users/new-users [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | users/NewUsersSection.tsx [读] |
| `page.admin.engagement.users.new.download` | 下载新用户图数据 | Users → NewUsersSection → download | 同上 | 界面: [待渲染实测] 本地下载 ／ 导航: 仍在页 [读] ／ 持久化: 无 REST，客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.users.new.period | users/NewUsersSection.tsx [读] |
| `page.admin.engagement.users.active.download` | 下载活跃用户图数据 | Users → ActiveUsersSection → download | 同上 | 界面: [待渲染实测] 下载 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/engagement-dashboard/users/active-users 后客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | users/ActiveUsersSection.tsx [读] |
| `page.admin.engagement.users.tod.period` | 改日内时段用户图周期 | Users → UsersByTimeOfTheDaySection → Select_period | 同上 | 界面: [待渲染实测] 重绘 ／ 导航: 仍在页 [读] ／ 持久化: GET .../users/users-by-time-of-the-day-in-a-week [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | users/UsersByTimeOfTheDaySection.tsx [读] |
| `page.admin.engagement.users.tod.download` | 下载日内时段用户图 | UsersByTimeOfTheDaySection → download | 同上 | 界面: [待渲染实测] 下载 ／ 导航: 仍在页 [读] ／ 持久化: 客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.users.tod.period | users/UsersByTimeOfTheDaySection.tsx [读] |
| `page.admin.engagement.users.busiest.period` | 改最忙时段粒度 Hours/Days | Users → BusiestChatTimesSection → Select_period | 同上 | 界面: [待渲染实测] Hours/Days 切 ／ 导航: 仍在页 [读] ／ 持久化: GET hourly/weekly chat activity [读] | EE:engagement-dashboard | page.admin.engagement.tab.users | users/BusiestChatTimesSection.tsx [读] |
| `page.admin.engagement.users.busiest.prev` | 最忙时段上一窗口 | BusiestChatTimes → previous | 同上 | 界面: [待渲染实测] 日期后退 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET 换日期 [读] | EE:engagement-dashboard | page.admin.engagement.users.busiest.period | users/ContentForHours.tsx [读] |
| `page.admin.engagement.users.busiest.next` | 最忙时段下一窗口 | BusiestChatTimes → next | 同上 | 界面: [待渲染实测] 日期前进 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET [读] | EE:engagement-dashboard | page.admin.engagement.users.busiest.prev | users/ContentForHours.tsx [读] |
| `page.admin.engagement.messages.sent.period` | 改发送消息图周期 | Messages → MessagesSentSection → Select_period | 同上 | 界面: [待渲染实测] 重绘 ／ 导航: 仍在 messages [读] ／ 持久化: GET /v1/engagement-dashboard/messages/messages-sent [读] | EE:engagement-dashboard | page.admin.engagement.tab.messages | messages/MessagesSentSection.tsx [读] |
| `page.admin.engagement.messages.sent.download` | 下载发送消息图 | MessagesSentSection → download | 同上 | 界面: [待渲染实测] 下载 ／ 导航: 仍在页 [读] ／ 持久化: 客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.messages.sent.period | messages/MessagesSentSection.tsx [读] |
| `page.admin.engagement.messages.channel.period` | 改热门频道图周期 | Messages → MessagesPerChannelSection → Select_period | 同上 | 界面: [待渲染实测] 重绘 ／ 导航: 仍在页 [读] ／ 持久化: GET .../messages/top-five-popular-channels [读] | EE:engagement-dashboard | page.admin.engagement.tab.messages | messages/MessagesPerChannelSection.tsx [读] |
| `page.admin.engagement.messages.channel.download` | 下载热门频道图 | MessagesPerChannelSection → download | 同上 | 界面: [待渲染实测] 下载 ／ 导航: 仍在页 [读] ／ 持久化: 客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.messages.channel.period | messages/MessagesPerChannelSection.tsx [读] |
| `page.admin.engagement.channels.period` | 改频道总览周期 | Channels → ChannelsOverview → Select_period | 同上 | 界面: [待渲染实测] 表刷新 ／ 导航: 仍在 channels [读] ／ 持久化: GET /v1/engagement-dashboard/channels/list [读] | EE:engagement-dashboard | page.admin.engagement.tab.channels | channels/ChannelsOverview.tsx [读] |
| `page.admin.engagement.channels.download` | 下载频道总览 | ChannelsOverview → download | 同上 | 界面: [待渲染实测] 下载 ／ 导航: 仍在页 [读] ／ 持久化: 客户端导出 [读] | EE:engagement-dashboard | page.admin.engagement.channels.period | channels/ChannelsOverview.tsx [读] |
| `page.admin.engagement.channels.pagination` | 翻页频道总览 | ChannelsOverview → Pagination | 有多页 [读] | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET count/offset [读] | EE:engagement-dashboard | page.admin.engagement.channels.period | channels/ChannelsOverview.tsx [读] |

本表数据行：**19**。计数见附录验算。

### E4 Moderation `/admin/moderation` — `page.admin.moderation.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.moderation.tab.messages` | 打开已举报消息 | 管理侧栏 Moderation → tab Reported_Messages | view-moderation-console [读] | 界面: [待渲染实测] 举报表 ／ 导航: /admin/moderation [读] ／ 持久化: GET /v1/moderation.reportsByUsers [读] | core | route.admin.moderation | ModerationConsolePage.tsx [读] |
| `page.admin.moderation.tab.users` | 打开已举报用户 | Moderation → tab Reported_Users | 同上 | 界面: [待渲染实测] 用户举报表 ／ 导航: 切 tab [读] ／ 持久化: GET /v1/moderation.userReports [读] | core | page.admin.moderation.tab.messages | ModerationConsolePage.tsx [读] |
| `page.admin.moderation.row` | 点行打开举报详情 | 举报表 → 行单击 | 同上 | 界面: [待渲染实测] 详情上下文 ／ 导航: context=info [读] ／ 持久化: 无至详情 GET [读] | core | page.admin.moderation.tab.messages | ModerationConsoleTableRow.tsx [读] |
| `page.admin.moderation.see-messages` | 菜单查看该用户被举报消息 | 行菜单 → Moderation_See_messages | 同上 | 界面: [待渲染实测] 进详情 Messages ／ 导航: 详情 [读] ／ 持久化: GET /v1/moderation.user.reportedMessages [读] | core | page.admin.moderation.row | ModerationConsoleActions.tsx [读] |
| `page.admin.moderation.dismiss-user` | 驳回该用户全部举报 | 行菜单或详情脚 → Moderation_Dismiss_user_reports / Dismiss_all_reports | manage-moderation-actions [读] | 界面: [待渲染实测] 行消失/toast ／ 导航: 仍在控制台 [读] ／ 持久化: POST /v1/moderation.dismissUserReports [读] | core | page.admin.moderation.row | useDismissUserAction.tsx [读] |
| `page.admin.moderation.delete-all-messages` | 删除该用户全部被举报消息 | 行菜单或详情脚 → Moderation_Delete_all_messages | 同上 | 界面: [待渲染实测] 确认后刷新 ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/moderation.user.deleteReportedMessages [读] | core | page.admin.moderation.row | useDeleteMessagesAction.tsx [读] |
| `page.admin.moderation.deactivate` | 停用被举报用户 | 行菜单或详情 More → Moderation_Deactivate_User | 同上 | 界面: [待渲染实测] 用户 inactive ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/users.setActiveStatus [读] | core | page.admin.users.action.deactivate | useDeactivateUserAction [读] |
| `page.admin.moderation.reset-avatar` | 重置被举报用户头像 | 行菜单或详情 More → Moderation_Reset_avatar | 同上 | 界面: [待渲染实测] 头像回默认 ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/users.resetAvatar [读] | core | page.admin.moderation.row | useResetAvatarAction.tsx [读] |
| `page.admin.moderation.dismiss-reports` | 驳回单条消息举报 | 详情 Messages → Moderation_Dismiss_reports | 同上 | 界面: [待渲染实测] 该条消失 ／ 导航: 仍在详情 [读] ／ 持久化: POST /v1/moderation.dismissReports [读] | core | page.admin.moderation.see-messages | ContextMessage.tsx [读] |
| `page.admin.moderation.goto-message` | 跳到原消息 | 详情 → Moderation_Go_to_message | 消息仍在 [读] | 界面: [待渲染实测] 离开管理进房间 ／ 导航: permalink [读] ／ 持久化: 无 [读] | core | page.admin.moderation.see-messages | ContextMessage.tsx [读] |
| `page.admin.moderation.delete-message` | 删除单条被举报消息 | 详情 → Moderation_Delete_message | manage-moderation-actions [读] | 界面: [待渲染实测] 确认后消息删 ／ 导航: 仍在详情 [读] ／ 持久化: 消息删除 endpoint（useDeleteMessage）[读] | core | page.admin.moderation.see-messages | useDeleteMessage.tsx [读] |

本表数据行：**11**。计数见附录验算。

### E5 Rooms `/admin/rooms` — `page.admin.rooms.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.rooms.search` | 搜索房间 | 管理侧栏 Rooms → Search_rooms | view-room-administration [读] | 界面: [待渲染实测] 表过滤 ／ 导航: 仍在 /admin/rooms [读] ／ 持久化: GET /v1/rooms.adminRooms [读] | core | route.admin.rooms | RoomsTableFilters.tsx [读] |
| `page.admin.rooms.filter.type` | 按房间类型过滤 | Rooms → Filter_by_room 多选 | 同上 | 界面: [待渲染实测] 芯片 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET types [读] | core | page.admin.rooms.search | RoomsTableFilters.tsx [读] |
| `page.admin.rooms.sort` | 排序房间列 | Rooms → 可点列表头 | 同上 | 界面: [待渲染实测] 排序指示 [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | core | page.admin.rooms.search | RoomsTable.tsx [读] |
| `page.admin.rooms.pagination` | 翻页房间 | Rooms → Pagination | 有多页 [读] | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET count/offset [读] | core | page.admin.rooms.search | RoomsTable.tsx [读] |
| `page.admin.rooms.row` | 打开房间编辑面板 | Rooms → 行单击 | 同上 | 界面: [待渲染实测] 右侧 EditRoom ／ 导航: /admin/rooms/:context/:id [读] ／ 持久化: 无至改字段 [读] | core | page.admin.rooms.edit.save | RoomsTable.tsx [读] |
| `page.admin.rooms.edit.avatar` | 改房间头像 | 编辑面板 → roomAvatar | edit-room [读] | 界面: [待渲染实测] 预览 ／ 导航: 面板仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomAvatar [读] |
| `page.admin.rooms.edit.name` | 改房间名 | 编辑面板 → Name | edit-room [读] | 界面: [待渲染实测] textbox ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomName [读] |
| `page.admin.rooms.edit.owner` | 查看房主（只读） | 编辑面板 → Owner | 同上 | 界面: [待渲染实测] 只读 Owner ／ 导航: 无 ／ 持久化: 无请求 [读] | core | page.admin.rooms.edit.name | EditRoom.tsx name=roomOwner [读] |
| `page.admin.rooms.edit.description` | 改房间描述 | 编辑面板 → Description | 同上 | 界面: [待渲染实测] textarea ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomDescription [读] |
| `page.admin.rooms.edit.announcement` | 改房间公告 | 编辑面板 → Announcement | 同上 | 界面: [待渲染实测] ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomAnnouncement [读] |
| `page.admin.rooms.edit.topic` | 改房间主题 | 编辑面板 → Topic | 同上 | 界面: [待渲染实测] ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomTopic [读] |
| `page.admin.rooms.edit.private` | 切换私有/公开 | 编辑面板 → Private | 非 DM [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save（roomType）[读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=roomType [读] |
| `page.admin.rooms.edit.readonly` | 切换只读 | 编辑面板 → Read_only | 非 DM [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=readOnly [读] |
| `page.admin.rooms.edit.react-when-readonly` | 只读时仍可反应 | 编辑面板 → React_when_read_only | readOnly [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.readonly | EditRoom.tsx name=reactWhenReadOnly [读] |
| `page.admin.rooms.edit.archived` | 归档/取消归档 | 编辑面板 → Room_archivation_state_true | 非 DM [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 归档动作 + Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=archived [读] |
| `page.admin.rooms.edit.default` | 设为默认房间 | 编辑面板 → Default | 非 DM [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=isDefault [读] |
| `page.admin.rooms.edit.favorite` | 默认收藏 | 编辑面板 → Favorite | isDefault [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.default | EditRoom.tsx name=favorite [读] |
| `page.admin.rooms.edit.featured` | 精选房间 | 编辑面板 → Featured | 非 DM [读] | 界面: [待渲染实测] switch ／ 导航: 仍开 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/rooms.saveRoomSettings | page.admin.rooms.edit.save | EditRoom.tsx name=featured [读] |
| `page.admin.rooms.edit.reset` | 重置未保存房间编辑 | 编辑面板 → Reset | dirty [读] | 界面: [待渲染实测] 回滚 ／ 导航: 仍开 [读] ／ 持久化: 无请求 [读] | core | page.admin.rooms.edit.save | EditRoom.tsx [读] |
| `page.admin.rooms.edit.save` | 保存房间设置 | 编辑面板 → Save | dirty + edit-room [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 rooms [读] ／ 持久化: POST /v1/rooms.saveRoomSettings [读] | core | page.admin.rooms.row | EditRoom.tsx [读] |
| `page.admin.rooms.edit.delete` | 删除房间 | 编辑面板 → Delete | delete-room [读] | 界面: [待渲染实测] 确认后行消失 ／ 导航: 回列表 [读] ／ 持久化: rooms.delete（useDeleteRoom）[读] | core | page.admin.rooms.row | EditRoom.tsx useDeleteRoom [读] |

本表数据行：**21**。计数见附录验算。

### E6 Users `/admin/users` — `page.admin.users.*`

`rg name=` AdminUserForm + SetRandomPassword：avatar email verified name username freeSwitchExtension setRandomPassword requirePasswordChange password passwordConfirmation roles joinDefaultChannels sendWelcomeEmail statusText bio nickname customFields。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.users.tab.all` | 看全部用户 | 管理侧栏 Users → tab All | view-user-administration [读] | 界面: [待渲染实测] 全量表 ／ 导航: /admin/users [读] ／ 持久化: GET /v1/users.listByStatus [读] | core | route.admin.users | AdminUsersPage.tsx [读] |
| `page.admin.users.tab.pending` | 看待处理用户 | Users → tab Pending | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 同 GET pending [读] | core | page.admin.users.tab.all | AdminUsersPage.tsx [读] |
| `page.admin.users.tab.active` | 看活跃用户 | Users → tab Active | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 同 GET active [读] | core | page.admin.users.tab.all | AdminUsersPage.tsx [读] |
| `page.admin.users.tab.deactivated` | 看已停用用户 | Users → tab Deactivated | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 同 GET deactivated [读] | core | page.admin.users.tab.all | AdminUsersPage.tsx [读] |
| `page.admin.users.search` | 搜索用户 | Users → Search_Users | 同上 | 界面: [待渲染实测] 表过滤 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET text [读] | core | page.admin.users.tab.all | UsersTableFilters.tsx [读] |
| `page.admin.users.filter.role` | 按角色过滤用户 | Users → Filter_by_role | 同上 | 界面: [待渲染实测] 多选角色 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET roles [读] | core | page.admin.users.search | UsersTableFilters.tsx [读] |
| `page.admin.users.sort` | 排序用户列 | Users → 可点列表头 | 同上 | 界面: [待渲染实测] 排序指示 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | core | page.admin.users.search | UsersTable.tsx [读] |
| `page.admin.users.pagination` | 翻页用户 | Users → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET count/offset [读] | core | page.admin.users.search | UsersTable.tsx [读] |
| `page.admin.users.invite` | 打开邀请面板 | Users → Invite | bulk-register-user [读] | 界面: [待渲染实测] AdminInviteUsers ／ 导航: /admin/users/invite [读] ／ 持久化: 无至 Send [读] | core | page.admin.users.invite.send | UsersPageHeaderContent.tsx [读] |
| `page.admin.users.invite.emails` | 填写邀请邮箱列表 | Invite 面板 → 邮箱 textarea | 同上 | 界面: [待渲染实测] 多邮箱 ／ 导航: 仍在面板 [读] ／ 持久化: 仅本地至 Send [读] | core；提交 POST /v1/sendInvitationEmail | page.admin.users.invite.send | AdminInviteUsers.tsx [读] |
| `page.admin.users.invite.send` | 发送邀请邮件 | Invite 面板 → Send | SMTP 已配 + 权限 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 users [读] ／ 持久化: POST /v1/sendInvitationEmail [读] | core | page.admin.users.invite.emails | AdminInviteUsers.tsx [读] |
| `page.admin.users.invite.setup-smtp` | 无 SMTP 时去配邮件 | Invite 面板 → Setup_SMTP | SMTP 未配 [读] | 界面: [待渲染实测] 按钮 ／ 导航: /admin/settings/Email [读] ／ 持久化: 无 [读] | core | page.admin.settings.open.email | AdminInviteUsers.tsx [读] |
| `page.admin.users.new` | 打开新建用户表单 | Users → New_user | create-user [读] | 界面: [待渲染实测] AdminUserForm ／ 导航: /admin/users/new [读] ／ 持久化: 无至 Save [读] | core | page.admin.users.form.save | UsersPageHeaderContent.tsx [读] |
| `page.admin.users.seats` | 购买更多席位 | Users → Buy_more_seats | 席位上限 [读] | 界面: [待渲染实测] ／ 导航: Cloud checkout [读] ／ 持久化: 无本站 REST [读] | core | page.admin.subscription.checkout | UsersPageHeaderContent.tsx SeatsCapUsage [读] |
| `page.admin.users.row` | 打开用户详情 | Users → 行单击 | view-user-administration [读] | 界面: [待渲染实测] info 面板 ／ 导航: context=info [读] ／ 持久化: 无 [读] | core | page.admin.users.action.edit | UsersTableRow.tsx [读] |
| `page.admin.users.form.avatar` | 设用户头像 | New/Edit → avatar | create-user / edit-other-user-info [读] | 界面: [待渲染实测] 头像编辑器 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=avatar [读] |
| `page.admin.users.form.email` | 填 Email | New/Edit → Email | 同上 | 界面: [待渲染实测] textbox ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=email [读] |
| `page.admin.users.form.verified` | 标记邮箱已验证 | New/Edit → Mark_email_as_verified | 同上 | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.email | AdminUserForm.tsx name=verified [读] |
| `page.admin.users.form.name` | 填 Name | New/Edit → Name | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=name [读] |
| `page.admin.users.form.username` | 填 Username | New/Edit → Username | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=username [读] |
| `page.admin.users.form.voip-extension` | 填 Voice_call_extension | New/Edit → Voice_call_extension | VoIP 扩展可见（useShowVoipExtension）[读] | 界面: [待渲染实测] 条件字段 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=freeSwitchExtension [读] |
| `page.admin.users.form.set-random-pwd` | 选随机密码并邮件发送 | New/Edit → Set_randomly_and_send_by_email | SMTP；与手动密码互斥 [读] | 界面: [待渲染实测] radio ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save（setRandomPassword=true）[读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.password | AdminUserSetRandomPasswordRadios.tsx [读] |
| `page.admin.users.form.set-manual-pwd` | 选手动设置密码 | New/Edit → Set_manually | 同上 | 界面: [待渲染实测] radio 露出密码框 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.password | AdminUserSetRandomPasswordRadios.tsx [读] |
| `page.admin.users.form.require-change` | 要求下次改密 | New/Edit → Require_password_change | 同上 | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserSetRandomPasswordContent.tsx name=requirePasswordChange [读] |
| `page.admin.users.form.password` | 填 Password | Set_manually → Password | 手动密码模式 [读] | 界面: [待渲染实测] PasswordInput ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserSetRandomPasswordContent.tsx name=password [读] |
| `page.admin.users.form.password-confirm` | 确认 Password | Set_manually → Confirm_password | 手动密码模式 [读] | 界面: [待渲染实测] 不匹配拦提交 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地 [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.password | AdminUserSetRandomPasswordContent.tsx name=passwordConfirmation [读] |
| `page.admin.users.form.roles` | 分配 Roles | New/Edit → Roles | 同上 | 界面: [待渲染实测] 多选 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=roles [读] |
| `page.admin.users.form.join-default` | 加入默认频道 | New → Join_default_channels | 新建 [读] | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=joinDefaultChannels [读] |
| `page.admin.users.form.send-welcome` | 发送欢迎邮件 | New/Edit → Send_welcome_email | SMTP [读] | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 创建时可 POST /v1/users.sendWelcomeEmail [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=sendWelcomeEmail [读] |
| `page.admin.users.form.show-additional` | 展开/收起附加字段 | New/Edit → Show/Hide_additional_fields | 同上 | 界面: [待渲染实测] 露出 Status/Bio/Nickname ／ 导航: 仍在表单 [读] ／ 持久化: 无请求 [读] | core | page.admin.users.form.status-text | AdminUserForm.tsx [读] |
| `page.admin.users.form.status-text` | 填 StatusMessage | 附加字段 → StatusMessage | 已展开 [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=statusText [读] |
| `page.admin.users.form.bio` | 填 Bio | 附加字段 → Bio | 已展开 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=bio [读] |
| `page.admin.users.form.nickname` | 填 Nickname | 附加字段 → Nickname | 已展开 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=nickname [读] |
| `page.admin.users.form.custom-fields` | 填自定义字段 | New/Edit → CustomFields | 配置了自定义字段 [读] | 界面: [待渲染实测] 动态字段 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/users.create 或 /v1/users.update | page.admin.users.form.save | AdminUserForm.tsx name=customFields.* [读] |
| `page.admin.users.form.save` | 保存用户 | New/Edit → Add_user / Save_user | 校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 回列表或 info [读] ／ 持久化: POST /v1/users.create 或 /v1/users.update [读] | core | page.admin.users.new | AdminUserForm.tsx [读] |
| `page.admin.users.action.dm` | 从详情开直连消息 | 用户 info → Direct_Message | create-d [读] | 界面: [待渲染实测] 离开管理 ／ 导航: DM 房间 [读] ／ 持久化: 进房交房间分册 [读] | core | page.create.dm.submit | useAdminUserInfoActions.ts [读] |
| `page.admin.users.action.edit` | 从详情进入编辑 | 用户 info → Edit | edit-other-user-info [读] | 界面: [待渲染实测] 同表单 ／ 导航: context=edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.users.form.save | useAdminUserInfoActions.ts [读] |
| `page.admin.users.action.admin` | 授予/撤销管理员 | info → Grant/Remove admin | assign-admin-role [读] | 界面: [待渲染实测] 角色变化 ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/roles.addUserToRole 或 removeUserFromRole [读] | core | page.admin.users.row | useChangeAdminStatusAction.ts [读] |
| `page.admin.users.action.deactivate` | 停用/启用用户 | info → Activate/Deactivate | 权限 [读] | 界面: [待渲染实测] 状态切 ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/users.setActiveStatus [读] | core | page.admin.users.tab.deactivated | useChangeUserStatusAction.ts [读] |
| `page.admin.users.action.reset-e2e` | 重置用户 E2E 密钥 | info → Reset E2E | 权限 [读] | 界面: [待渲染实测] 确认 ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/users.resetE2EKey [读] | core | page.account.security.e2e-reset | useResetE2EEKeyAction.tsx [读] |
| `page.admin.users.action.reset-totp` | 重置用户 TOTP | info → Reset TOTP | 权限 [读] | 界面: [待渲染实测] 确认 ／ 导航: 仍在 info [读] ／ 持久化: POST /v1/users.resetTOTP [读] | core | page.account.security.totp.toggle | useResetTOTPAction.tsx [读] |
| `page.admin.users.action.delete` | 删除用户 | info → Delete | delete-user [读] | 界面: [待渲染实测] 确认（可含 owner 变更）／ 导航: 回列表 [读] ／ 持久化: POST /v1/users.delete [读] | core | page.admin.users.row | useDeleteUserAction.tsx [读] |

本表数据行：**42**。计数见附录验算。

### E7 AI Center `/admin/ai-center` — `page.admin.ai-center.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.ai-center.view-options` | 无 AI 许可时去看订阅选项 | 管理侧栏 AI_Center → Callout → View_options | view/edit-privileged-setting 或 manage-selected-settings；无 AI 许可模块才渲染 [读] | 界面: [待渲染实测] Callout AI_Center_license_required_title ／ 导航: /admin/subscription [读] ／ 持久化: 无 [读] | EE:ai | page.admin.subscription.checkout | AICenterOverview.tsx [读] |
| `page.admin.ai-center.search` | 配置智能搜索 | AI Center 卡 Intelligent_Search → Configure | 同上；无许可卡标 Locked [读] | 界面: [待渲染实测] 卡 status Enabled/Disabled/Locked ／ 导航: /admin/ai-center/search [读] ／ 持久化: 打开设置组 Intelligent_Search，无请求至 Save [读] | EE:ai；组内字段不拆（同 Settings 约定） | page.admin.settings.save | AICenterOverview.tsx AISettingsSection.tsx section=Intelligent_Search [读] |
| `page.admin.ai-center.llm` | 管理 LLM 提供方 | 卡 AI_Center_LLM_Providers → Manage | 同上 | 界面: [待渲染实测] 卡 status Available/Locked ／ 导航: /admin/ai-center/llm-providers [读] ／ 持久化: 打开设置组 AI_LLM_Provider，无请求至 Save [读] | EE:ai；组内字段不拆 | page.admin.settings.save | AICenterOverview.tsx AISettingsSection.tsx section=AI_LLM_Provider [读] |
| `page.admin.ai-center.mcp` | 配置 MCP | 卡 MCP → Configure | 同上 | 界面: [待渲染实测] 卡 status Enabled/Disabled/Locked ／ 导航: /admin/ai-center/mcp [读] ／ 持久化: 打开设置组 MCP，无请求至 Save [读] | EE:ai；组内字段不拆 | page.admin.settings.save | AICenterOverview.tsx AISettingsSection.tsx section=MCP [读] |
| `page.admin.ai-center.section.save` | 保存当前 AI 设置段 | search/llm/mcp 段 → Save_changes | edit-privileged-setting [读] | 界面: [待渲染实测] toast ／ 导航: 仍在该 section [读] ／ 持久化: 设置 dispatch（同 Settings Save）[读] | core；共享设置保存 | page.admin.ai-center.search | AISettingsSection.tsx [读] |

本表数据行：**5**。计数见附录验算。

### E8 Invites `/admin/invites` — `page.admin.invites.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.invites.list` | 查看邀请链接表 | 管理侧栏 Invites | create-invite-links [读] | 界面: [待渲染实测] 表或空态 ／ 导航: /admin/invites [读] ／ 持久化: GET /v1/listInvites [读] | core | route.admin.invites | InvitesPage.tsx [读] |
| `page.admin.invites.remove` | 撤销一条邀请 | Invites → 行 → 删除叉 | 同上 | 界面: [待渲染实测] 行消失 ／ 导航: 仍在页 [读] ／ 持久化: DELETE /v1/removeInvite/:_id [读] | core | page.admin.invites.list | InviteRow.tsx [读] |
| `page.admin.invites.reload` | 加载失败后重载邀请表 | Invites → Reload_page | query error [读] | 界面: [待渲染实测] 错误态 ／ 导航: 仍在页 [读] ／ 持久化: 再 GET /v1/listInvites [读] | core | page.admin.invites.list | InvitesPage.tsx [读] |

本表数据行：**3**。计数见附录验算。

### E9 User Status `/admin/user-status` — `page.admin.user-status.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.user-status.new` | 打开新建自定义状态 | 管理侧栏 User_Status → New_custom_status | manage-user-status [读] | 界面: [待渲染实测] 表单 ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | core | page.admin.user-status.save | CustomUserStatusRoute.tsx [读] |
| `page.admin.user-status.presence-service` | 去 Presence 服务设置 | User Status → Presence_service | 同上 | 界面: [待渲染实测] 按钮 ／ 导航: 相关 Settings 组 [读] ／ 持久化: 无 [读] | core | page.admin.settings.open.general | CustomUserStatusRoute.tsx [读] |
| `page.admin.user-status.row` | 打开编辑自定义状态 | 表 → 行 | 同上 | 界面: [待渲染实测] 表单预填 ／ 导航: context=edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.user-status.save | CustomUserStatusRoute.tsx [读] |
| `page.admin.user-status.name` | 填状态 Name | 表单 → Name | 同上 | 界面: [待渲染实测] textbox ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/custom-user-status.create 或 .update | page.admin.user-status.save | CustomUserStatusForm.tsx name=name [读] |
| `page.admin.user-status.type` | 选 Presence 类型 | 表单 → Presence | 同上 | 界面: [待渲染实测] select ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 create/update | page.admin.user-status.save | CustomUserStatusForm.tsx name=statusType [读] |
| `page.admin.user-status.cancel` | 取消未保存状态 | 表单 → Cancel | dirty 或任意 [读] | 界面: [待渲染实测] 关面板 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.user-status.save | CustomUserStatusForm.tsx [读] |
| `page.admin.user-status.save` | 保存自定义状态 | 表单 → Save | 校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/custom-user-status.create 或 .update [读] | core | page.admin.user-status.name | CustomUserStatusForm.tsx [读] |
| `page.admin.user-status.delete` | 删除自定义状态 | 编辑表单 → Delete | 已有记录 [读] | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/custom-user-status.delete [读] | core | page.admin.user-status.row | CustomUserStatusForm.tsx [读] |

本表数据行：**8**。计数见附录验算。

### E10 Permissions `/admin/permissions` — `page.admin.permissions.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.permissions.tab.permissions` | 看权限矩阵 | 管理侧栏 Permissions → tab Permissions | access-permissions 或 access-setting-permissions [读] | 界面: [待渲染实测] 矩阵 ／ 导航: /admin/permissions [读] ／ 持久化: 权限查询 [读] | core | route.admin.permissions | PermissionsPage.tsx [读] |
| `page.admin.permissions.tab.settings` | 看设置权限 | Permissions → tab Settings | access-setting-permissions [读] | 界面: [待渲染实测] 设置权表 ／ 导航: 切 tab [读] ／ 持久化: 权限查询 [读] | core | page.admin.permissions.tab.permissions | PermissionsPage.tsx [读] |
| `page.admin.permissions.search` | 搜索权限名 | 矩阵 → Search | 同上 | 界面: [待渲染实测] 客户端过滤 ／ 导航: 仍在页 [读] ／ 持久化: 无 REST [读] | core | page.admin.permissions.tab.permissions | PermissionsTableFilter.tsx [读] |
| `page.admin.permissions.toggle` | 切换某角色某权限单元格 | 矩阵 → 权限×角色 checkbox | access-permissions [读] | 界面: [待渲染实测] 勾选即时变 ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/permissions.addRole 或 .removeRole [读] | core | page.admin.permissions.tab.permissions | RoleCell.tsx PermissionsTable.tsx [读] |
| `page.admin.permissions.pagination` | 翻页权限矩阵 | 矩阵 → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 权限查询切片 [读] | core | page.admin.permissions.search | PermissionsTable.tsx [读] |
| `page.admin.permissions.role.new` | 打开新建角色 | Permissions → New_role | access-permissions [读] | 界面: [待渲染实测] RoleForm ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | core | page.admin.permissions.role.save | PermissionsPage.tsx [读] |
| `page.admin.permissions.role.name` | 填角色名 | 角色表单 → Role | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/roles.create 或 .update | page.admin.permissions.role.save | RoleForm.tsx name=name [读] |
| `page.admin.permissions.role.description` | 填角色描述 | 角色表单 → Description | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 create/update | page.admin.permissions.role.save | RoleForm.tsx name=description [读] |
| `page.admin.permissions.role.scope` | 选角色 Scope | 角色表单 → Scope | 同上 | 界面: [待渲染实测] select ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 create/update | page.admin.permissions.role.save | RoleForm.tsx name=scope [读] |
| `page.admin.permissions.role.mandatory-2fa` | 强制该角色 2FA | 角色表单 → Users must use Two Factor Authentication | 同上 | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 create/update | page.admin.permissions.role.save | RoleForm.tsx name=mandatory2fa [读] |
| `page.admin.permissions.role.save` | 保存角色 | 角色表单 → Save | 校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 回权限页 [读] ／ 持久化: POST /v1/roles.create 或 .update [读] | core | page.admin.permissions.role.name | EditRolePage.tsx [读] |
| `page.admin.permissions.role.delete` | 删除角色 | 角色表单 → Delete | 非受保护角色 [读] | 界面: [待渲染实测] 确认 ／ 导航: 回权限页 [读] ／ 持久化: POST /v1/roles.delete [读] | core | page.admin.permissions.role.new | EditRolePage.tsx [读] |
| `page.admin.permissions.users-in-role` | 打开角色成员 | 角色表单 → Users_in_role | 同上 | 界面: [待渲染实测] 成员表 ／ 导航: users-in-role [读] ／ 持久化: GET /v1/roles.getUsersInRole [读] | core | page.admin.permissions.users-in-role.add | EditRolePage.tsx [读] |
| `page.admin.permissions.users-in-role.room` | 按房间筛角色成员 | Users_in_role → Choose_a_room | scope 需房间时 [读] | 界面: [待渲染实测] RoomAutoComplete ／ 导航: 仍在页 [读] ／ 持久化: 再 GET getUsersInRole {rid} [读] | core | page.admin.permissions.users-in-role | UsersInRolePage.tsx name=rid [读] |
| `page.admin.permissions.users-in-role.users` | 选择要加入的用户 | Users_in_role → Add_users | 同上 | 界面: [待渲染实测] 多选 ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Add [读] | core；提交 POST /v1/roles.addUserToRole | page.admin.permissions.users-in-role.add | UsersInRolePage.tsx name=users [读] |
| `page.admin.permissions.users-in-role.add` | 把用户加入角色 | Users_in_role → Add | 已选用户 [读] | 界面: [待渲染实测] 行出现 ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/roles.addUserToRole [读] | core | page.admin.permissions.users-in-role.users | UsersInRolePage.tsx [读] |
| `page.admin.permissions.users-in-role.remove` | 从角色移除用户 | 成员行 → Remove | 同上 | 界面: [待渲染实测] 行消失 ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/roles.removeUserFromRole [读] | core | page.admin.permissions.users-in-role.add | UsersInRoleTableRow.tsx [读] |
| `page.admin.permissions.users-in-role.pagination` | 翻页角色成员 | Users_in_role → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET getUsersInRole offset [读] | core | page.admin.permissions.users-in-role | UsersInRolePage.tsx [读] |

本表数据行：**18**。计数见附录验算。

### E11 ABAC `/admin/ABAC` — `page.admin.abac.*`

ABAC Settings 页签渲染 `ee/server/settings/abac.ts` 具名键（挂在 General 组 section=ABAC*）。本表按这些键一行一个，因它们挂在 **ABAC 侧栏页** 而非 Settings 索引。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.abac.sync-ldap` | 立即 LDAP 同步（ABAC 头） | 管理侧栏 ABAC → LDAP_Sync_Now | abac-management + 对应 tab 权；ABAC 与 LDAP 均开否则 disabled [读] | 界面: [待渲染实测] 按钮 title=Enable_ABAC_and_LDAP_to_sync ／ 导航: 仍在 /admin/ABAC [读] ／ 持久化: LDAP sync hook [读] | EE:abac | page.admin.settings.ldap.sync-now | AdminABACPage.tsx [读] |
| `page.admin.abac.learn-more` | 打开 ABAC 文档 | ABAC → ABAC_Learn_More | abac-management [读] | 界面: [待渲染实测] 外链 ／ 导航: 文档站 [读] ／ 持久化: 无 [读] | EE:abac | route.admin.abac | AdminABACPage.tsx [读] |
| `page.admin.abac.tab.settings` | 打开 ABAC 设置页签 | ABAC → tab Settings | manage-abac-admin-settings [读] | 界面: [待渲染实测] SettingField 列表 ／ 导航: /admin/ABAC/settings [读] ／ 持久化: 无至改字段 [读] | EE:abac | page.admin.abac.setting.enabled | AdminABACTabs.tsx [读] |
| `page.admin.abac.tab.attributes` | 打开房间属性页签 | ABAC → tab ABAC_Room_Attributes | manage-abac-admin-room-attributes；外部 store 时不渲染 [读] | 界面: [待渲染实测] 属性表 ／ 导航: /admin/ABAC/room-attributes [读] ／ 持久化: GET /v1/abac/attributes [读] | EE:abac | page.admin.abac.attr.search | AdminABACTabs.tsx [读] |
| `page.admin.abac.tab.rooms` | 打开 ABAC 房间页签 | ABAC → tab Rooms | manage-abac-admin-rooms [读] | 界面: [待渲染实测] 房间表 ／ 导航: /admin/ABAC/rooms [读] ／ 持久化: GET /v1/abac/rooms [读] | EE:abac | page.admin.abac.rooms.search | AdminABACTabs.tsx [读] |
| `page.admin.abac.tab.logs` | 打开 ABAC 审计日志页签 | ABAC → tab ABAC_Logs | view-abac-admin-audit [读] | 界面: [待渲染实测] 日志表 [待渲染实测] ／ 导航: /admin/ABAC/logs [读] ／ 持久化: ABAC audit GET [读] | EE:abac | route.admin.abac | AdminABACTabs.tsx [读] |
| `page.admin.abac.setting.enabled` | 开关 ABAC | ABAC → Settings → ABAC_Enabled | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] boolean 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Enabled [读] |
| `page.admin.abac.setting.pdp-type` | 选 PDP 类型 local/virtru | ABAC → Settings → ABAC_PDP_Type | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] select 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_PDP_Type [读] |
| `page.admin.abac.setting.attribute-store` | 选属性存储 | ABAC → Settings → ABAC_Attribute_Store | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] select 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Attribute_Store [读] |
| `page.admin.abac.setting.show-in-rooms` | 房间内显示属性 | ABAC → Settings → ABAC_ShowAttributesInRooms | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] boolean 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_ShowAttributesInRooms [读] |
| `page.admin.abac.setting.banners-enabled` | 开关分级横幅 | ABAC → Settings → ABAC_Classification_Banners_Enabled | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] boolean 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Classification_Banners_Enabled [读] |
| `page.admin.abac.setting.banners-config` | 编辑分级横幅 JSON | ABAC → Settings → ABAC_Classification_Banners_Config | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] code 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Classification_Banners_Config [读] |
| `page.admin.abac.setting.cache-seconds` | 设决策缓存秒数 | ABAC → Settings → Abac_Cache_Decision_Time_Seconds | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] int 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts Abac_Cache_Decision_Time_Seconds [读] |
| `page.admin.abac.setting.virtru-url` | 填 Virtru Base URL | ABAC → Settings → ABAC_Virtru_Base_URL | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] string 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Base_URL [读] |
| `page.admin.abac.setting.virtru-client-id` | 填 Virtru Client ID | ABAC → Settings → ABAC_Virtru_Client_ID | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] string 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Client_ID [读] |
| `page.admin.abac.setting.virtru-secret` | 填 Virtru Client Secret | ABAC → Settings → ABAC_Virtru_Client_Secret | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] password 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Client_Secret [读] |
| `page.admin.abac.setting.virtru-oidc` | 填 Virtru OIDC Endpoint | ABAC → Settings → ABAC_Virtru_OIDC_Endpoint | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] string 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_OIDC_Endpoint [读] |
| `page.admin.abac.setting.virtru-entity-key` | 选默认实体键 | ABAC → Settings → ABAC_Virtru_Default_Entity_Key | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] select 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Default_Entity_Key [读] |
| `page.admin.abac.setting.virtru-namespace` | 填属性命名空间 | ABAC → Settings → ABAC_Virtru_Attribute_Namespace | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] string 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Attribute_Namespace [读] |
| `page.admin.abac.setting.virtru-sync` | 填同步 cron | ABAC → Settings → ABAC_Virtru_Sync_Interval | manage-abac-admin-settings + enableQuery（多数要 ABAC_Enabled）[读] | 界面: [待渲染实测] string 控件 ／ 导航: 仍在 Settings 页签 [读] ／ 持久化: 仅本地至页级 Save [读] | EE:abac；共享 Settings dispatch（ABAC 页 Settings 页签，非 972 全拆） | page.admin.abac.setting.save | ee/server/settings/abac.ts ABAC_Virtru_Sync_Interval [读] |
| `page.admin.abac.setting.test-virtru` | 测试 Virtru PDP 连接 | ABAC → Settings → ABAC_Virtru_Test_Connection | PDP=virtru [读] | 界面: [待渲染实测] 动作按钮 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/abac/pdp/health [读] | EE:abac | page.admin.abac.setting.pdp-type | abac.ts ABAC_Virtru_Test_Connection [读] |
| `page.admin.abac.setting.save` | 保存 ABAC 设置页签 | ABAC Settings → Save | dirty [读] | 界面: [待渲染实测] toast ／ 导航: 仍在页 [读] ／ 持久化: 设置 dispatch 批量写上表键 [读] | EE:abac | page.admin.abac.tab.settings | ABACSettingTab/SettingsPage.tsx [读] |
| `page.admin.abac.attr.search` | 搜索房间属性 | Room Attributes → ABAC_Search_attributes | manage-abac-admin-room-attributes [读] | 界面: [待渲染实测] 表过滤 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/abac/attributes [读] | EE:abac | page.admin.abac.tab.attributes | AttributesPage.tsx [读] |
| `page.admin.abac.attr.new` | 新建房间属性 | Room Attributes → ABAC_New_attribute | 同上 | 界面: [待渲染实测] AttributesForm ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | EE:abac | page.admin.abac.attr.save | AttributesPage.tsx [读] |
| `page.admin.abac.attr.pagination` | 翻页房间属性 | Room Attributes → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET [读] | EE:abac | page.admin.abac.attr.search | AttributesPage.tsx [读] |
| `page.admin.abac.attr.name` | 填属性 Name | 属性表单 → Name | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac；共享 POST/PUT /v1/abac/attributes | page.admin.abac.attr.save | AttributesForm.tsx name=name [读] |
| `page.admin.abac.attr.value` | 编辑/添加属性值 | 属性表单 → Values / Add_Value | 同上 | 界面: [待渲染实测] 可增删行 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac；共享 attributes 写 | page.admin.abac.attr.save | AttributesForm.tsx attributeValues.*.value [读] |
| `page.admin.abac.attr.remove-value` | 删除某一属性值 | 属性表单 → ABAC_Remove_attribute（值行） | 同上 | 界面: [待渲染实测] 行消失 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac | page.admin.abac.attr.value | AttributesForm.tsx [读] |
| `page.admin.abac.attr.save` | 保存房间属性 | 属性表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST/PUT /v1/abac/attributes [读] | EE:abac | page.admin.abac.attr.name | AttributesForm.tsx [读] |
| `page.admin.abac.attr.delete` | 删除整个属性 | 属性行菜单 → Delete | 未被房间占用否则不能删 [读] | 界面: [待渲染实测] 确认或 ABAC_Cannot_delete_attribute ／ 导航: 仍在列表 [读] ／ 持久化: DELETE /v1/abac/attributes/:_id [读] | EE:abac | page.admin.abac.attr.search | useAttributeOptions.tsx [读] |
| `page.admin.abac.rooms.search` | 搜索 ABAC 房间 | Rooms 页签 → ABAC_Search_rooms | manage-abac-admin-rooms [读] | 界面: [待渲染实测] 表过滤 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/abac/rooms [读] | EE:abac | page.admin.abac.tab.rooms | RoomsPage.tsx [读] |
| `page.admin.abac.rooms.filter` | 按 All/Rooms/Attributes/Values 过滤 | Rooms 页签 → 类型 select | 同上 | 界面: [待渲染实测] 过滤 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET [读] | EE:abac | page.admin.abac.rooms.search | RoomsPage.tsx [读] |
| `page.admin.abac.rooms.add` | 把房间纳入 ABAC | Rooms 页签 → Add_room | 同上 | 界面: [待渲染实测] RoomForm ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | EE:abac | page.admin.abac.rooms.save | RoomsPage.tsx [读] |
| `page.admin.abac.rooms.pagination` | 翻页 ABAC 房间 | Rooms 页签 → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET [读] | EE:abac | page.admin.abac.rooms.search | RoomsPage.tsx [读] |
| `page.admin.abac.rooms.room` | 选择要托管的房间 | 房间表单 → ABAC_Room_to_be_managed | 同上 | 界面: [待渲染实测] 房间选择 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac；共享房间映射 POST | page.admin.abac.rooms.save | RoomForm.tsx name=room [读] |
| `page.admin.abac.rooms.attr-key` | 为房间选属性键 | 房间表单 → Attribute key | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac；共享房间映射 POST | page.admin.abac.rooms.save | RoomFormAttributeField.tsx name=attributes.*.key [读] |
| `page.admin.abac.rooms.attr-values` | 为房间选属性值 | 房间表单 → Attribute values | 同上 | 界面: [待渲染实测] 多选 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | EE:abac；共享房间映射 POST | page.admin.abac.rooms.save | RoomFormAttributeField.tsx name=attributes.*.values [读] |
| `page.admin.abac.rooms.add-attr` | 再加一条房间属性 | 房间表单 → ABAC_Add_Attribute | 同上 | 界面: [待渲染实测] 新行 ／ 导航: 仍在表单 [读] ／ 持久化: 无请求 [读] | EE:abac | page.admin.abac.rooms.attr-key | RoomForm.tsx [读] |
| `page.admin.abac.rooms.save` | 保存房间 ABAC 映射 | 房间表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST ABAC room save [读] | EE:abac | page.admin.abac.rooms.room | RoomForm.tsx [读] |
| `page.admin.abac.rooms.remove` | 从 ABAC 移除房间 | 房间行菜单 → Remove | 同上 | 界面: [待渲染实测] 确认 ABAC_Delete_room ／ 导航: 仍在列表 [读] ／ 持久化: DELETE 房间映射 [读] | EE:abac | page.admin.abac.rooms.search | useRoomItems.tsx [读] |

本表数据行：**40**。计数见附录验算。

### E12 Device Management `/admin/device-management` — `page.admin.devices.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.devices.search` | 搜索设备/用户会话 | 管理侧栏 Device_Management → Search_Devices_Users | view-device-management + EE [读] | 界面: [待渲染实测] 表过滤 ／ 导航: /admin/device-management [读] ／ 持久化: GET /v1/sessions/list.all [读] | EE:device-management | route.admin.device-management | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.sort.client` | 按 Client 排序 | 表头 Client | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | EE:device-management | page.admin.devices.search | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.sort.os` | 按 OS 排序 | 表头 OS | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | EE:device-management | page.admin.devices.search | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.sort.user` | 按 User 排序 | 表头 User | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | EE:device-management | page.admin.devices.search | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.sort.login` | 按 Last_login 排序 | 表头 Last_login | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | EE:device-management | page.admin.devices.search | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.pagination` | 翻页设备会话 | 表底 Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET count/offset [读] | EE:device-management | page.admin.devices.search | DeviceManagementAdminTable.tsx [读] |
| `page.admin.devices.row` | 打开设备详情 | 行单击 | 同上 | 界面: [待渲染实测] info 面板 ／ 导航: context=info [读] ／ 持久化: 无 [读] | EE:device-management | page.admin.devices.logout | DeviceManagementAdminRow.tsx [读] |
| `page.admin.devices.logout` | 登出该设备 | 详情 → Logout_Device | 同上 | 界面: [待渲染实测] 行消失 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/sessions/logout [读] | EE:device-management | page.account.sessions.logout | DeviceManagementInfo.tsx [读] |

本表数据行：**8**。计数见附录验算。

### E13 Email Inboxes `/admin/email-inboxes` — `page.admin.email-inbox.*`

`rg name=` EmailInboxForm.tsx → 16 字段（active…imapSecure）。另 Cancel/Save/Delete/Send_Test。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.email-inbox.new` | 打开新建收件箱 | 管理侧栏 Email_Inboxes → New | manage-email-inbox [读] | 界面: [待渲染实测] 表单 ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | core | page.admin.email-inbox.save | EmailInboxPage.tsx [读] |
| `page.admin.email-inbox.row` | 打开编辑收件箱 | 表 → 行 | 同上 | 界面: [待渲染实测] 表单预填 ／ 导航: context=edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.email-inbox.save | EmailInboxPage.tsx [读] |
| `page.admin.email-inbox.active` | 开关收件箱启用 | 表单 → Active | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=active [读] |
| `page.admin.email-inbox.name` | 填收件箱名 | 表单 → Name | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=name [读] |
| `page.admin.email-inbox.email` | 填收件箱邮箱 | 表单 → Email | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save；失焦可 GET /v1/email-inbox.search 校验 [读] | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=email [读] |
| `page.admin.email-inbox.description` | 填描述 | 表单 → Description | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=description [读] |
| `page.admin.email-inbox.sender-info` | 填发件人信息 | 表单 → Sender_Info | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=senderInfo [读] |
| `page.admin.email-inbox.department` | 选部门 | 表单 → Department | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=department [读] |
| `page.admin.email-inbox.smtp-server` | 填 SMTP 主机 | 表单 → SMTP Server | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=smtpServer [读] |
| `page.admin.email-inbox.smtp-port` | 填 SMTP 端口 | 表单 → SMTP Port | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=smtpPort [读] |
| `page.admin.email-inbox.smtp-username` | 填 SMTP 用户名 | 表单 → SMTP Username | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=smtpUsername [读] |
| `page.admin.email-inbox.smtp-password` | 填 SMTP 密码 | 表单 → SMTP Password | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=smtpPassword [读] |
| `page.admin.email-inbox.smtp-secure` | 开关 SMTP TLS | 表单 → SMTP Connect_SSL_TLS | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=smtpSecure [读] |
| `page.admin.email-inbox.imap-server` | 填 IMAP 主机 | 表单 → IMAP Server | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapServer [读] |
| `page.admin.email-inbox.imap-port` | 填 IMAP 端口 | 表单 → IMAP Port | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapPort [读] |
| `page.admin.email-inbox.imap-username` | 填 IMAP 用户名 | 表单 → IMAP Username | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapUsername [读] |
| `page.admin.email-inbox.imap-password` | 填 IMAP 密码 | 表单 → IMAP Password | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapPassword [读] |
| `page.admin.email-inbox.imap-retries` | 填 IMAP 重试次数 | 表单 → Retry_Failed_Messages | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapRetries [读] |
| `page.admin.email-inbox.imap-secure` | 开关 IMAP TLS | 表单 → IMAP Connect_SSL_TLS | manage-email-inbox [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save | core；共享 POST /v1/email-inbox | page.admin.email-inbox.save | EmailInboxForm.tsx name=imapSecure [读] |
| `page.admin.email-inbox.cancel` | 取消未保存收件箱 | 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.email-inbox.save | EmailInboxForm.tsx [读] |
| `page.admin.email-inbox.save` | 保存收件箱 | 表单 → Save | 校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/email-inbox [读] | core | page.admin.email-inbox.name | EmailInboxForm.tsx [读] |
| `page.admin.email-inbox.delete` | 删除收件箱 | 编辑表单 → Delete | 已有记录 [读] | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: DELETE /v1/email-inbox/:_id [读] | core | page.admin.email-inbox.row | EmailInboxForm.tsx [读] |
| `page.admin.email-inbox.send-test` | 发送测试邮件 | 表行 → Send_Test_Email | 已保存 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在列表 [读] ／ 持久化: POST /v1/email-inbox.send-test/:_id [读] | core | page.admin.email-inbox.row | SendTestButton.tsx [读] |

本表数据行：**23**。计数见附录验算。

### E14 Mailer `/admin/mailer` — `page.admin.mailer.*`

`rg name=` MailerPage：fromEmail dryRun query subject emailBody。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.mailer.from` | 填 From | 管理侧栏 Mailer → From | access-mailer [读] | 界面: [待渲染实测] ／ 导航: 仍在 /admin/mailer [读] ／ 持久化: 仅本地至 Send [读] | core；共享 POST /v1/mailer | page.admin.mailer.send | MailerPage.tsx name=fromEmail [读] |
| `page.admin.mailer.dry-run` | 开关 Dry_run | Mailer → Dry_run | 同上 | 界面: [待渲染实测] switch；开则只发给自己 [读] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Send [读] | core；共享 POST /v1/mailer | page.admin.mailer.send | MailerPage.tsx name=dryRun [读] |
| `page.admin.mailer.query` | 填用户 Query | Mailer → Query | 同上 | 界面: [待渲染实测] JSON 查询 ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Send [读] | core；共享 POST /v1/mailer | page.admin.mailer.send | MailerPage.tsx name=query [读] |
| `page.admin.mailer.subject` | 填 Subject | Mailer → Subject | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Send [读] | core；共享 POST /v1/mailer | page.admin.mailer.send | MailerPage.tsx name=subject [读] |
| `page.admin.mailer.body` | 填 Email_body | Mailer → Email_body | 同上 | 界面: [待渲染实测] HTML ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Send [读] | core；共享 POST /v1/mailer | page.admin.mailer.send | MailerPage.tsx name=emailBody [读] |
| `page.admin.mailer.cancel` | 重置未发送邮件 | Mailer → Cancel | dirty [读] | 界面: [待渲染实测] 表单 reset ／ 导航: 仍在页 [读] ／ 持久化: 无 [读] | core | page.admin.mailer.send | MailerPage.tsx [读] |
| `page.admin.mailer.send` | 发送群发邮件 | Mailer → Send_email | 校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在页 [读] ／ 持久化: POST /v1/mailer [读] | core | route.admin.mailer | MailerPage.tsx [读] |

本表数据行：**7**。计数见附录验算。

### E15 Third party login `/admin/third-party-login` — `page.admin.oauth-apps.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.oauth-apps.new` | 打开新建 OAuth App | 管理侧栏 Third_party_login → New | manage-oauth-apps [读] | 界面: [待渲染实测] OAuthAddApp ／ 导航: /new [读] ／ 持久化: 无至 Save [读] | core | page.admin.oauth-apps.save | OAuthAppsPage.tsx [读] |
| `page.admin.oauth-apps.row` | 打开编辑 OAuth App | 表 → 行 | 同上 | 界面: [待渲染实测] EditOauthApp ／ 导航: edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.oauth-apps.save | OAuthAppsTable.tsx [读] |
| `page.admin.oauth-apps.active` | 开关 Active | 表单 → Active | 同上 | 界面: [待渲染实测] switch ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/oauth-apps.create 或 .update | page.admin.oauth-apps.save | OAuthAddApp.tsx / EditOauthApp.tsx name=active [读] |
| `page.admin.oauth-apps.name` | 填 Application_Name | 表单 → Application_Name | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/oauth-apps.create 或 .update | page.admin.oauth-apps.save | name=name [读] |
| `page.admin.oauth-apps.redirect-uri` | 填 Redirect_URI | 表单 → Redirect_URI | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/oauth-apps.create 或 .update | page.admin.oauth-apps.save | name=redirectUri [读] |
| `page.admin.oauth-apps.cancel` | 取消未保存 OAuth App | 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.oauth-apps.save | OAuthAddApp.tsx EditOauthApp.tsx [读] |
| `page.admin.oauth-apps.save` | 保存 OAuth App | 表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/oauth-apps.create 或 .update [读] | core | page.admin.oauth-apps.name | OAuthAddApp.tsx EditOauthApp.tsx [读] |
| `page.admin.oauth-apps.delete` | 删除 OAuth App | 编辑表单 → Delete | 已有记录 | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/oauth-apps.delete [读] | core | page.admin.oauth-apps.row | EditOauthApp.tsx [读] |

本表数据行：**8**。计数见附录验算。

### E16 Integrations `/admin/integrations` — `page.admin.integrations.*`

Incoming `name=`：enabled name channel username alias avatar emoji overrideDestinationChannelEnabled scriptEnabled scriptEngine script = **11**。
Outgoing `name=`：event enabled name channel triggerWords targetRoom urls impersonateUser username alias avatar emoji token scriptEnabled scriptEngine script retryFailedCalls retryCount retryDelay triggerWordAnywhere runOnEdits = **21**。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.integrations.new` | 打开新建集成 | 管理侧栏 Integrations → New | manage-incoming/outgoing 或 own 变体 [读] | 界面: [待渲染实测] 选 incoming/outgoing ／ 导航: new [读] ／ 持久化: 无至 Save [读] | core | page.admin.integrations.incoming.save | IntegrationsPage.tsx [读] |
| `page.admin.integrations.tab.all` | 看全部集成 | Integrations → tab All | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: GET /v1/integrations.list [读] | core | route.admin.integrations | IntegrationsPage.tsx [读] |
| `page.admin.integrations.tab.incoming` | 只看 Incoming | Integrations → tab Incoming | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 同 GET type=webhook-incoming [读] | core | page.admin.integrations.tab.all | IntegrationsPage.tsx [读] |
| `page.admin.integrations.tab.outgoing` | 只看 Outgoing | Integrations → tab Outgoing | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 同 GET type=webhook-outgoing [读] | core | page.admin.integrations.tab.all | IntegrationsPage.tsx [读] |
| `page.admin.integrations.tab.zapier` | 打开 Zapier 说明页签 | Integrations → tab Zapier | 同上 | 界面: [待渲染实测] Zapier 说明 [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 无写 [读] | core | page.admin.integrations.tab.all | IntegrationsPage.tsx [读] |
| `page.admin.integrations.tab.bots` | 看 Bots 页签 | Integrations → tab Bots | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 列表查询 [读] | core | page.admin.integrations.tab.all | IntegrationsPage.tsx [读] |
| `page.admin.integrations.search` | 搜索集成 | 表 → 搜索 | 同上 | 界面: [待渲染实测] 过滤 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/integrations.list [读] | core | page.admin.integrations.tab.all | IntegrationsTable.tsx [读] |
| `page.admin.integrations.sort` | 排序集成列 | 表 → 列表头 | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | core | page.admin.integrations.search | IntegrationsTable.tsx [读] |
| `page.admin.integrations.pagination` | 翻页集成 | 表 → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET offset [读] | core | page.admin.integrations.search | IntegrationsTable.tsx [读] |
| `page.admin.integrations.row` | 打开编辑集成 | 表 → 行 | 同上 | 界面: [待渲染实测] incoming/outgoing 表单 ／ 导航: edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.integrations.incoming.save | IntegrationsTable.tsx [读] |
| `page.admin.integrations.incoming.enabled` | 开关启用 | Incoming 表单 → Enabled | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.name` | 填名称 | Incoming 表单 → Name | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.channel` | 选投递频道 | Incoming 表单 → Post_to_Channel | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.username` | 填投递用户名 | Incoming 表单 → Post_as | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.alias` | 填别名 | Incoming 表单 → Alias | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.avatar` | 填头像 URL | Incoming 表单 → Avatar_URL | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.emoji` | 填 emoji | Incoming 表单 → Emoji | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.override-channel` | 允许覆盖目标频道 | Incoming 表单 → Override_Destination_Channel | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.script-enabled` | 开脚本 | Incoming 表单 → Script_Enabled | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.script-engine` | 选脚本引擎 | Incoming 表单 → Script_Engine | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.script` | 编辑脚本 | Incoming 表单 → Script | manage-incoming-integrations 或 own [读] | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.copy-url` | 复制 Webhook URL | Incoming 编辑 → Copy Webhook_URL | 已保存 [读] | 界面: [待渲染实测] 剪贴板 ／ 导航: 仍在表单 [读] ／ 持久化: 无请求 [读] | core | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.copy-token` | 复制 Token | Incoming 编辑 → Copy Token | 已保存 | 界面: [待渲染实测] 剪贴板 ／ 导航: 仍在表单 [读] ／ 持久化: 无请求 [读] | core | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.copy-curl` | 复制 Curl 示例 | Incoming 编辑 → Copy Curl | 已保存 | 界面: [待渲染实测] 剪贴板 ／ 导航: 仍在表单 [读] ／ 持久化: 无请求 [读] | core | page.admin.integrations.incoming.save | IncomingWebhookForm.tsx [读] |
| `page.admin.integrations.incoming.cancel` | 取消 Incoming 未保存 | Incoming 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.integrations.incoming.save | EditIncomingWebhook.tsx [读] |
| `page.admin.integrations.incoming.save` | 保存 Incoming webhook | Incoming 表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/integrations.create 或 PUT /v1/integrations.update [读] | core | page.admin.integrations.incoming.name | EditIncomingWebhook.tsx [读] |
| `page.admin.integrations.incoming.delete` | 删除 Incoming webhook | Incoming 编辑 → Delete | 已有记录 | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/integrations.remove [读] | core | page.admin.integrations.row | EditIncomingWebhook.tsx [读] |
| `page.admin.integrations.outgoing.event` | 选事件触发器 | Outgoing 表单 → Event_Trigger | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.enabled` | 开关启用 | Outgoing 表单 → Enabled | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.name` | 填名称 | Outgoing 表单 → Name | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.channel` | 选频道（条件） | Outgoing 表单 → Channel | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.trigger-words` | 填触发词（条件） | Outgoing 表单 → Trigger_Words | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.target-room` | 填目标房间（条件） | Outgoing 表单 → TargetRoom | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.urls` | 填回调 URL | Outgoing 表单 → URLs | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.impersonate` | 开关冒充用户 | Outgoing 表单 → Impersonate_user | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.username` | 填投递用户名 | Outgoing 表单 → Post_as | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.alias` | 填别名 | Outgoing 表单 → Alias | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.avatar` | 填头像 URL | Outgoing 表单 → Avatar_URL | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.emoji` | 填 emoji | Outgoing 表单 → Emoji | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.token` | 填/看 Token | Outgoing 表单 → Token | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.script-enabled` | 开脚本 | Outgoing 表单 → Script_Enabled | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.script-engine` | 选脚本引擎 | Outgoing 表单 → Script_Engine | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.script` | 编辑脚本 | Outgoing 表单 → Script | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.retry-failed` | 开关失败重试 | Outgoing 表单 → Integration_Retry_Failed_Url_Calls | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.retry-count` | 填重试次数 | Outgoing 表单 → Retry_Count | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.retry-delay` | 填重试延迟 | Outgoing 表单 → Integration_Retry_Delay | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.trigger-anywhere` | 触发词可在任意位置（sendMessage） | Outgoing 表单 → Integration_Word_Trigger_Placement | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.run-on-edits` | 编辑消息也跑（sendMessage） | Outgoing 表单 → Integration_Run_When_Message_Is_Edited | manage-outgoing-integrations 或 own [读] | 界面: [待渲染实测] 条件字段随 event 显隐 [读] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/integrations.create 或 PUT /v1/integrations.update | page.admin.integrations.outgoing.save | OutgoingWebhookForm.tsx [读] |
| `page.admin.integrations.outgoing.cancel` | 取消 Outgoing 未保存 | Outgoing 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.integrations.outgoing.save | EditOutgoingWebhook.tsx [读] |
| `page.admin.integrations.outgoing.save` | 保存 Outgoing webhook | Outgoing 表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/integrations.create 或 PUT update [读] | core | page.admin.integrations.outgoing.name | EditOutgoingWebhook.tsx [读] |
| `page.admin.integrations.outgoing.delete` | 删除 Outgoing webhook | Outgoing 编辑 → Delete | 已有记录 | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/integrations.remove [读] | core | page.admin.integrations.row | EditOutgoingWebhook.tsx [读] |
| `page.admin.integrations.outgoing.history` | 打开输出历史 | Outgoing 编辑 → History | outgoing 已保存 [读] | 界面: [待渲染实测] 历史表 ／ 导航: history [读] ／ 持久化: GET /v1/integrations.history [读] | core | page.admin.integrations.outgoing.history.replay | EditOutgoingWebhook.tsx OutgoingWebhookHistoryPage.tsx [读] |
| `page.admin.integrations.outgoing.history.clear` | 清空输出历史 | History → Clear history | 同上 | 界面: [待渲染实测] 表空 ／ 导航: 仍在 history [读] ／ 持久化: POST /v1/integrations.clearHistory [读] | core | page.admin.integrations.outgoing.history | OutgoingWebhookHistoryPage.tsx [读] |
| `page.admin.integrations.outgoing.history.replay` | 重放一条历史 | History 行 → Replay | 同上 | 界面: [待渲染实测] toast ／ 导航: 仍在 history [读] ／ 持久化: POST /v1/integrations.replayOutgoing [读] | core | page.admin.integrations.outgoing.history | HistoryItem.tsx [读] |
| `page.admin.integrations.outgoing.history.pagination` | 翻页输出历史 | History → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET history offset [读] | core | page.admin.integrations.outgoing.history | OutgoingWebhookHistoryPage.tsx [读] |

本表数据行：**55**。计数见附录验算。

### E17 Import `/admin/import` — `page.admin.import.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.import.new` | 开始新导入 | 管理侧栏 Import → Import_New_File | run-import [读] | 界面: [待渲染实测] 向导 ／ 导航: /admin/import/new [读] ／ 持久化: 无至选文件 [读] | core | page.admin.import.start-upload | ImportHistoryPage.tsx [读] |
| `page.admin.import.download-files` | 下载待导入文件 | Import 历史 → Download_Pending_Files | 同上 | 界面: [待渲染实测] 进度 ／ 导航: 仍在历史 [读] ／ 持久化: POST /v1/downloadPendingFiles [读] | core | route.admin.import | ImportHistoryPage.tsx [读] |
| `page.admin.import.download-avatars` | 下载待导入头像 | Import 历史 → Download_Pending_Avatars | 同上 | 界面: [待渲染实测] 进度 ／ 导航: 仍在历史 [读] ／ 持久化: POST /v1/downloadPendingAvatars [读] | core | page.admin.import.download-files | ImportHistoryPage.tsx [读] |
| `page.admin.import.history.row` | 查看某次导入进度 | 历史行 | 同上 | 界面: [待渲染实测] 进度页 ／ 导航: /admin/import/progress [读] ／ 持久化: GET /v1/getCurrentImportOperation 与 getImportProgress [读] | core | page.admin.import.progress | ImportHistoryPage.tsx ImportProgressPage.tsx [读] |
| `page.admin.import.type` | 选导入器类型 | New → Import_Type | 同上 | 界面: [待渲染实测] select ／ 导航: 仍在 new [读] ／ 持久化: GET /v1/importers.list 只读选项 [读] | core；提交见 start-upload | page.admin.import.start-upload | NewImportPage.tsx [读] |
| `page.admin.import.file-type` | 选文件来源 upload/url/path | New → File_Type | 同上 | 界面: [待渲染实测] select 切输入 ／ 导航: 仍在 new [读] ／ 持久化: 仅本地 [读] | core；提交见 start-upload | page.admin.import.start-upload | NewImportPage.tsx [读] |
| `page.admin.import.file` | 选择本地导入文件 | File_Type=upload → Importer_Source_File | upload 模式 [读] | 界面: [待渲染实测] file input ／ 导航: 仍在 new [读] ／ 持久化: 仅本地至 Import [读] | core；提交 POST /v1/uploadImportFile | page.admin.import.start-upload | NewImportPage.tsx [读] |
| `page.admin.import.url` | 填导入文件 URL | File_Type=url → File_URL | url 模式 [读] | 界面: [待渲染实测] ／ 导航: 仍在 new [读] ／ 持久化: 仅本地至 Import [读] | core；提交 POST /v1/downloadPublicImportFile | page.admin.import.start-upload | NewImportPage.tsx [读] |
| `page.admin.import.path` | 填服务器文件路径 | File_Type=path → File_Path | path 模式 [读] | 界面: [待渲染实测] ／ 导航: 仍在 new [读] ／ 持久化: 仅本地至 Import [读] | core；提交 downloadPublicImportFile/本地路径 | page.admin.import.start-upload | NewImportPage.tsx [读] |
| `page.admin.import.start-upload` | 提交导入文件进入准备 | New → Import（头按钮） | 已选类型+来源 [读] | 界面: [待渲染实测] 进入 prepare ／ 导航: /admin/import/prepare [读] ／ 持久化: POST /v1/uploadImportFile 或 /v1/downloadPublicImportFile [读] | core | page.admin.import.prepare.start | NewImportPage.tsx [读] |
| `page.admin.import.prepare.tab.users` | 准备页 Users 页签 | Prepare → Users | 有用户数据 [读] | 界面: [待渲染实测] 用户勾选表 ／ 导航: 仍在 prepare [读] ／ 持久化: GET /v1/getImportFileData [读] | core | page.admin.import.prepare.start | PrepareImportPage.tsx [读] |
| `page.admin.import.prepare.tab.contacts` | 准备页 Contacts 页签 | Prepare → Contacts | 有联系人数据 [读] | 界面: [待渲染实测] ／ 导航: 仍在 prepare [读] ／ 持久化: 同 GET [读] | core | page.admin.import.prepare.start | PrepareImportPage.tsx [读] |
| `page.admin.import.prepare.tab.channels` | 准备页 Channels 页签 | Prepare → Channels | 有频道数据 [读] | 界面: [待渲染实测] ／ 导航: 仍在 prepare [读] ／ 持久化: 同 GET [读] | core | page.admin.import.prepare.start | PrepareImportPage.tsx [读] |
| `page.admin.import.prepare.tab.messages` | 准备页 Messages 页签 | Prepare → Messages | 有消息统计 [读] | 界面: [待渲染实测] 只读计数 [待渲染实测] ／ 导航: 仍在 prepare [读] ／ 持久化: 同 GET [读] | core | page.admin.import.prepare.start | PrepareImportPage.tsx [读] |
| `page.admin.import.prepare.users.select-all` | 全选/取消导入用户 | Users 表 → select-all | 同上 | 界面: [待渲染实测] 全勾 ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 POST /v1/startImport | page.admin.import.prepare.start | PrepareUsers.tsx [读] |
| `page.admin.import.prepare.users.toggle` | 勾选单个用户是否导入 | Users 行 → do_import | 同上 | 界面: [待渲染实测] checkbox ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 startImport | page.admin.import.prepare.start | PrepareUsers.tsx [读] |
| `page.admin.import.prepare.users.pagination` | 翻页准备用户 | Users → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 客户端切片 [读] | core | page.admin.import.prepare.tab.users | PrepareUsers.tsx [读] |
| `page.admin.import.prepare.channels.select-all` | 全选/取消导入频道 | Channels 表 → select-all | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 startImport | page.admin.import.prepare.start | PrepareChannels.tsx [读] |
| `page.admin.import.prepare.channels.toggle` | 勾选单个频道是否导入 | Channels 行 → do_import | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 startImport | page.admin.import.prepare.start | PrepareChannels.tsx [读] |
| `page.admin.import.prepare.channels.pagination` | 翻页准备频道 | Channels → Pagination | 有多页 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 客户端切片 [读] | core | page.admin.import.prepare.tab.channels | PrepareChannels.tsx [读] |
| `page.admin.import.prepare.contacts.select-all` | 全选/取消导入联系人 | Contacts → select-all | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 startImport | page.admin.import.prepare.start | PrepareContacts.tsx [读] |
| `page.admin.import.prepare.contacts.toggle` | 勾选单个联系人是否导入 | Contacts 行 → do_import | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Start [读] | core；提交 startImport | page.admin.import.prepare.start | PrepareContacts.tsx [读] |
| `page.admin.import.prepare.contacts.pagination` | 翻页准备联系人 | Contacts → Pagination | 有多页 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 客户端切片 [读] | core | page.admin.import.prepare.tab.contacts | PrepareContacts.tsx [读] |
| `page.admin.import.prepare.start` | 开始导入选中项 | Prepare → Importer_Prepare_Start_Import | 已选至少一项 [读] | 界面: [待渲染实测] 进进度 ／ 导航: /admin/import/progress [读] ／ 持久化: POST /v1/startImport [读] | core | page.admin.import.progress | PrepareImportPage.tsx [读] |
| `page.admin.import.progress` | 观看导入进度（只读） | Progress 页自动刷新 | 有进行中操作 [读] | 界面: [待渲染实测] 进度条/状态 ／ 导航: /admin/import/progress [读] ／ 持久化: GET /v1/getImportProgress + stream importers；无用户写 [读] | core | page.admin.import.prepare.start | ImportProgressPage.tsx [读] |

本表数据行：**25**。计数见附录验算。

### E18 Reports `/admin/analytic-reports` — `page.admin.reports.*`

侧栏 i18n=`Reports`，页标题 `Analytic_reports`。`ViewLogsPage` 只嵌 `AnalyticsReports`：**无表单字段**。内部可操作面是文档链与只读 JSON。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.reports.docs` | 打开日志访问变更文档 | 管理侧栏 Reports → Callout 链 logsDocs | view-logs [读] | 界面: [待渲染实测] Callout Server_logs_access_has_changed_callout_title ／ 导航: 外链 links.go.logsDocs [读] ／ 持久化: 无 [读] | core | route.admin.reports | AnalyticsReports.tsx [读] |
| `page.admin.reports.view-json` | 阅读用量统计 JSON（只读） | Reports → 统计 pre | view-logs [读] | 界面: [待渲染实测] JSON.stringify(statistics)；加载 Skeleton；失败 Something_went_wrong_try_again_later ／ 导航: 仍在 /admin/analytic-reports [读] ／ 持久化: GET statistics（useStatistics），无用户写 [读] | core | route.admin.reports | AnalyticsReports.tsx ViewLogsPage.tsx [读] |

本表数据行：**2**。计数见附录验算。

### E19 Sounds `/admin/sounds` — `page.admin.sounds.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.sounds.search` | 搜索自定义声音 | 管理侧栏 Sounds → 搜索 | manage-sounds [读] | 界面: [待渲染实测] 表过滤 ／ 导航: /admin/sounds [读] ／ 持久化: GET 自定义声音列表 [读] | core | route.admin.custom-sounds | CustomSoundsTable.tsx [读] |
| `page.admin.sounds.sort` | 排序声音列 | Sounds → 列表头 | 同上 | 界面: [待渲染实测] 重排 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET sort [读] | core | page.admin.sounds.search | CustomSoundsTable.tsx [读] |
| `page.admin.sounds.pagination` | 翻页声音 | Sounds → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: 同 GET [读] | core | page.admin.sounds.search | CustomSoundsTable.tsx [读] |
| `page.admin.sounds.new` | 打开新建声音 | Sounds → New | 同上 | 界面: [待渲染实测] AddCustomSound ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | core | page.admin.sounds.save | CustomSoundsPage.tsx [读] |
| `page.admin.sounds.row` | 打开编辑声音 | 表 → 行 | 同上 | 界面: [待渲染实测] EditSound ／ 导航: edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.sounds.save | CustomSoundsTable.tsx [读] |
| `page.admin.sounds.name` | 填声音 Name | 表单 → Name | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/custom-sounds.create 或更新 | page.admin.sounds.save | AddCustomSound.tsx EditSound.tsx [读] |
| `page.admin.sounds.file` | 上传声音文件 | 表单 → Sound File | 同上 | 界面: [待渲染实测] 文件按钮 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；随 create/update 上传 | page.admin.sounds.save | AddCustomSound.tsx [读] |
| `page.admin.sounds.cancel` | 取消未保存声音 | 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.sounds.save | AddCustomSound.tsx [读] |
| `page.admin.sounds.save` | 保存自定义声音 | 表单 → Save | Name+文件校验通过 [读] | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/custom-sounds.create 或更新 [读] | core | page.admin.sounds.name | AddCustomSound.tsx EditSound.tsx [读] |
| `page.admin.sounds.delete` | 删除自定义声音 | 编辑 → Delete | 已有记录 | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: 自定义声音 delete endpoint [读] | core | page.admin.sounds.row | EditSound.tsx [读] |

本表数据行：**10**。计数见附录验算。

### E20 Emoji `/admin/emoji` — `page.admin.emoji.*`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.emoji.new` | 打开新建自定义 emoji | 管理侧栏 Emoji → New | manage-emoji [读] | 界面: [待渲染实测] 表单 ／ 导航: context=new [读] ／ 持久化: 无至 Save [读] | core | page.admin.emoji.save | CustomEmojiRoute.tsx [读] |
| `page.admin.emoji.row` | 打开编辑 emoji | 表 → 行 | 同上 | 界面: [待渲染实测] EditCustomEmoji ／ 导航: edit [读] ／ 持久化: 无至 Save [读] | core | page.admin.emoji.save | CustomEmojiRoute.tsx [读] |
| `page.admin.emoji.name` | 填 emoji Name | 表单 → Name | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 POST /v1/emoji-custom.update 或 create | page.admin.emoji.save | EditCustomEmoji.tsx [读] |
| `page.admin.emoji.aliases` | 填 Aliases | 表单 → Aliases | 同上 | 界面: [待渲染实测] ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 emoji-custom 写 | page.admin.emoji.save | EditCustomEmoji.tsx [读] |
| `page.admin.emoji.file` | 上传 emoji 图 | 表单 → 上传 | 同上 | 界面: [待渲染实测] 文件按钮 ／ 导航: 仍在表单 [读] ／ 持久化: 仅本地至 Save [读] | core；随保存上传 | page.admin.emoji.save | EditCustomEmoji.tsx [读] |
| `page.admin.emoji.cancel` | 取消未保存 emoji | 表单 → Cancel | 同上 | 界面: [待渲染实测] 关表单 ／ 导航: 回列表 [读] ／ 持久化: 无 [读] | core | page.admin.emoji.save | EditCustomEmoji.tsx [读] |
| `page.admin.emoji.save` | 保存自定义 emoji | 表单 → Save | 校验通过 | 界面: [待渲染实测] toast ／ 导航: 回列表 [读] ／ 持久化: POST /v1/emoji-custom.update（或 create）[读] | core | page.admin.emoji.name | EditCustomEmoji.tsx [读] |
| `page.admin.emoji.delete` | 删除自定义 emoji | 编辑 → Delete | 已有记录 | 界面: [待渲染实测] 确认 ／ 导航: 回列表 [读] ／ 持久化: POST /v1/emoji-custom.delete [读] | core | page.admin.emoji.row | EditCustomEmoji.tsx [读] |

本表数据行：**8**。计数见附录验算。

### E21 Admin Feature Preview `/admin/feature-preview` — `page.admin.feature-preview.*`

`useFeaturePreviewList.ts` 现行 **2** 项：secondarySidebar、aiSearch。另有设置 `Accounts_AllowFeaturePreview`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.feature-preview.allow` | 开关允许用户使用功能预览 | 管理侧栏 Feature_preview → Setting Accounts_AllowFeaturePreview | 侧栏：defaultFeaturesPreview.length>0 [读] | 界面: [待渲染实测] Setting 控件；关则下列开关 disabled [读] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 settings dispatch | page.admin.feature-preview.save | AdminFeaturePreviewPage.tsx [读] |
| `page.admin.feature-preview.secondary-sidebar` | 默认打开二级侧栏预览 | 手风琴 Navigation → Filters_and_secondary_sidebar | allow 开 [读] | 界面: [待渲染实测] switch id=secondarySidebar + 预览图 ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Save（写入 Accounts_Default_User_Preferences_featuresPreview）[读] | core；共享 Save | page.account.feature-preview.secondary-sidebar | AdminFeaturePreviewPage.tsx useFeaturePreviewList.ts [读] |
| `page.admin.feature-preview.ai-search` | 默认打开智能搜索预览 | 手风琴 AI → Intelligent_Search | allow 开 [读] | 界面: [待渲染实测] switch id=aiSearch ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Save [读] | core；共享 Save | page.account.feature-preview.ai-search | AdminFeaturePreviewPage.tsx [读] |
| `page.admin.feature-preview.cancel` | 放弃未保存管理端预览 | 页脚 Cancel | dirty 或 allow 脏 [读] | 界面: [待渲染实测] reset ／ 导航: 仍在页 [读] ／ 持久化: 无 [读] | core | page.admin.feature-preview.save | AdminFeaturePreviewPage.tsx [读] |
| `page.admin.feature-preview.save` | 保存管理端功能预览默认值 | 页脚 Save_changes | dirty 或 allow 脏 [读] | 界面: [待渲染实测] toast Preferences_saved ／ 导航: 仍在页 [读] ／ 持久化: settings dispatch Accounts_AllowFeaturePreview + Accounts_Default_User_Preferences_featuresPreview [读] | core | route.admin.feature-preview | AdminFeaturePreviewPage.tsx [读] |

本表数据行：**5**。计数见附录验算。

### E22 Settings `/admin/settings` — `page.admin.settings.*`

组来自 `settingsRegistry.addGroup`（core `server/settings` + EE）。客户端 `useSettingsGroups` 滤 `type===group`。 **禁止**把组内 ~972 key 拆行。每组一行「打开」+ 共用 Save/Cancel/Reset + 具名危险动作。
本组清单 **41** 个唯一 addGroup id。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.admin.settings.search` | 搜索设置组卡片 | 管理侧栏 Settings → Search | view-privileged-setting 或 edit 或 manage-selected-settings [读] | 界面: [待渲染实测] 400ms debounce 过滤卡片；空则 GenericNoResults ／ 导航: 仍在 /admin/settings [读] ／ 持久化: 无 REST，useSettingsGroups 客户端滤 [读] | core | route.admin.settings | SettingsPage.tsx [读] |
| `page.admin.settings.open.accounts` | 打开 Accounts 设置组 | Settings 索引 → 卡 Accounts | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Accounts [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Accounts') SettingsGroupCard [读] |
| `page.admin.settings.open.analytics` | 打开 Analytics 设置组 | Settings 索引 → 卡 Analytics | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Analytics [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Analytics') SettingsGroupCard [读] |
| `page.admin.settings.open.assets` | 打开 Assets 设置组 | Settings 索引 → 卡 Assets | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Assets [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Assets') SettingsGroupCard [读] |
| `page.admin.settings.open.atlassian-crowd` | 打开 Atlassian Crowd 设置组 | Settings 索引 → 卡 Atlassian Crowd | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/AtlassianCrowd [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('AtlassianCrowd') SettingsGroupCard [读] |
| `page.admin.settings.open.bots` | 打开 Bots 设置组 | Settings 索引 → 卡 Bots | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Bots [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Bots') SettingsGroupCard [读] |
| `page.admin.settings.open.cas` | 打开 CAS 设置组 | Settings 索引 → 卡 CAS | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/CAS [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('CAS') SettingsGroupCard [读] |
| `page.admin.settings.open.custom-sounds-fs` | 打开 Custom Sounds Filesystem 设置组 | Settings 索引 → 卡 Custom Sounds Filesystem | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/CustomSoundsFilesystem [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('CustomSoundsFilesystem') SettingsGroupCard [读] |
| `page.admin.settings.open.discussion` | 打开 Discussion 设置组 | Settings 索引 → 卡 Discussion | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Discussion [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Discussion') SettingsGroupCard [读] |
| `page.admin.settings.open.email` | 打开 Email 设置组 | Settings 索引 → 卡 Email | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Email [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Email') SettingsGroupCard [读] |
| `page.admin.settings.open.emoji-custom-fs` | 打开 Emoji Custom Filesystem 设置组 | Settings 索引 → 卡 Emoji Custom Filesystem | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/EmojiCustomFilesystem [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('EmojiCustomFilesystem') SettingsGroupCard [读] |
| `page.admin.settings.open.e2e` | 打开 E2E 设置组 | Settings 索引 → 卡 E2E | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/End-to-end_encryption [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('End-to-end_encryption') SettingsGroupCard [读] |
| `page.admin.settings.open.enterprise` | 打开 Enterprise 设置组 | Settings 索引 → 卡 Enterprise | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Enterprise [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Enterprise') SettingsGroupCard [读] |
| `page.admin.settings.open.federation` | 打开 Federation 设置组 | Settings 索引 → 卡 Federation | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Federation [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Federation') SettingsGroupCard [读] |
| `page.admin.settings.open.fileupload` | 打开 File Upload 设置组 | Settings 索引 → 卡 File Upload | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/FileUpload [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('FileUpload') SettingsGroupCard [读] |
| `page.admin.settings.open.general` | 打开 General 设置组 | Settings 索引 → 卡 General | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/General [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('General') SettingsGroupCard [读] |
| `page.admin.settings.open.irc` | 打开 IRC 设置组 | Settings 索引 → 卡 IRC | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/IRC_Federation [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('IRC_Federation') SettingsGroupCard [读] |
| `page.admin.settings.open.ldap` | 打开 LDAP 设置组 | Settings 索引 → 卡 LDAP | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/LDAP [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('LDAP') SettingsGroupCard [读] |
| `page.admin.settings.open.layout` | 打开 Layout 设置组 | Settings 索引 → 卡 Layout | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Layout [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Layout') SettingsGroupCard [读] |
| `page.admin.settings.open.logs` | 打开 Logs 设置组 | Settings 索引 → 卡 Logs | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Logs [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Logs') SettingsGroupCard [读] |
| `page.admin.settings.open.message` | 打开 Message 设置组 | Settings 索引 → 卡 Message | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Message [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Message') SettingsGroupCard [读] |
| `page.admin.settings.open.meta` | 打开 Meta 设置组 | Settings 索引 → 卡 Meta | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Meta [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Meta') SettingsGroupCard [读] |
| `page.admin.settings.open.mobile` | 打开 Mobile 设置组 | Settings 索引 → 卡 Mobile | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Mobile [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Mobile') SettingsGroupCard [读] |
| `page.admin.settings.open.oauth` | 打开 OAuth 设置组 | Settings 索引 → 卡 OAuth | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/OAuth [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('OAuth') SettingsGroupCard [读] |
| `page.admin.settings.open.omnichannel` | 打开 Omnichannel 设置组 | Settings 索引 → 卡 Omnichannel | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Omnichannel [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Omnichannel') SettingsGroupCard [读] |
| `page.admin.settings.open.outlook` | 打开 Outlook Calendar 设置组 | Settings 索引 → 卡 Outlook Calendar | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Outlook_Calendar [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Outlook_Calendar') SettingsGroupCard [读] |
| `page.admin.settings.open.push` | 打开 Push 设置组 | Settings 索引 → 卡 Push | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Push [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Push') SettingsGroupCard [读] |
| `page.admin.settings.open.rate-limiter` | 打开 Rate Limiter 设置组 | Settings 索引 → 卡 Rate Limiter | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Rate Limiter [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Rate Limiter') SettingsGroupCard [读] |
| `page.admin.settings.open.retention` | 打开 Retention Policy 设置组 | Settings 索引 → 卡 Retention Policy | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/RetentionPolicy [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('RetentionPolicy') SettingsGroupCard [读] |
| `page.admin.settings.open.saml` | 打开 SAML 设置组 | Settings 索引 → 卡 SAML | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/SAML [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('SAML') SettingsGroupCard [读] |
| `page.admin.settings.open.sms` | 打开 SMS 设置组 | Settings 索引 → 卡 SMS | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/SMS [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('SMS') SettingsGroupCard [读] |
| `page.admin.settings.open.search` | 打开 Search 设置组 | Settings 索引 → 卡 Search | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Search [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Search') SettingsGroupCard [读] |
| `page.admin.settings.open.setup-wizard` | 打开 Setup Wizard 设置组 | Settings 索引 → 卡 Setup Wizard | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Setup_Wizard [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Setup_Wizard') SettingsGroupCard [读] |
| `page.admin.settings.open.slackbridge` | 打开 SlackBridge 设置组 | Settings 索引 → 卡 SlackBridge | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/SlackBridge [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('SlackBridge') SettingsGroupCard [读] |
| `page.admin.settings.open.smarsh` | 打开 Smarsh 设置组 | Settings 索引 → 卡 Smarsh | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Smarsh [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Smarsh') SettingsGroupCard [读] |
| `page.admin.settings.open.threads` | 打开 Threads 设置组 | Settings 索引 → 卡 Threads | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Threads [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Threads') SettingsGroupCard [读] |
| `page.admin.settings.open.troubleshoot` | 打开 Troubleshoot 设置组 | Settings 索引 → 卡 Troubleshoot | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Troubleshoot [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Troubleshoot') SettingsGroupCard [读] |
| `page.admin.settings.open.user-data-download` | 打开 User Data Download 设置组 | Settings 索引 → 卡 User Data Download | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/UserDataDownload [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('UserDataDownload') SettingsGroupCard [读] |
| `page.admin.settings.open.video-conference` | 打开 Video Conference 设置组 | Settings 索引 → 卡 Video Conference | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Video_Conference [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Video_Conference') SettingsGroupCard [读] |
| `page.admin.settings.open.voip` | 打开 VoIP 设置组 | Settings 索引 → 卡 VoIP | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/VoIP_TeamCollab [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('VoIP_TeamCollab') SettingsGroupCard [读] |
| `page.admin.settings.open.webdav` | 打开 Webdav 设置组 | Settings 索引 → 卡 Webdav | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Webdav Integration [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Webdav Integration') SettingsGroupCard [读] |
| `page.admin.settings.open.device-management` | 打开 Device Management 设置组 | Settings 索引 → 卡 Device Management | 同上；Enterprise 组另要 EE [读] | 界面: [待渲染实测] 组页字段（不在本册拆 key）／ 导航: /admin/settings/Device_Management [读] ／ 持久化: 无请求至 Save [读] | core；组内字段共享 page.admin.settings.save | page.admin.settings.save | addGroup('Device_Management') SettingsGroupCard [读] |
| `page.admin.settings.save` | 保存当前设置组 | 任意组 → Save_changes | dirty + edit-privileged-setting [读] | 界面: [待渲染实测] toast ／ 导航: 仍在组页 [读] ／ 持久化: settings dispatch 批量 [读] | core | page.admin.settings.search | SettingsGroupPage.tsx [读] |
| `page.admin.settings.cancel` | 取消未保存设置 | 任意组 → Cancel | dirty [读] | 界面: [待渲染实测] 回滚本地 editable ／ 导航: 仍在组页 [读] ／ 持久化: 无 [读] | core | page.admin.settings.save | SettingsGroupPage.tsx [读] |
| `page.admin.settings.reset-setting` | 重置单个设置为包装默认 | 组内某字段 → Reset | 权限 [读] | 界面: [待渲染实测] 该字段回 package value ／ 导航: 仍在组 [读] ／ 持久化: 仅本地至 Save（ResetSettingButton）[读] | core | page.admin.settings.save | ResetSettingButton.tsx [读] |
| `page.admin.settings.ldap.test-connection` | LDAP 测试连接 | Settings → LDAP → Test_Connection | LDAP 组 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 LDAP [读] ／ 持久化: POST /v1/ldap.testConnection [读] | core | page.admin.settings.open.ldap | LDAPGroupPage.tsx [读] |
| `page.admin.settings.ldap.test-search` | LDAP 测试搜索 | LDAP → Test_LDAP_Search → 填用户名 → 确认 | 同上 | 界面: [待渲染实测] 用户名模态 ／ 导航: 仍在 LDAP [读] ／ 持久化: POST /v1/ldap.testSearch [读] | core | page.admin.settings.open.ldap | LDAPGroupPage.tsx [读] |
| `page.admin.settings.ldap.sync-now` | LDAP 立即同步 | LDAP → LDAP_Sync_Now | 同上 | 界面: [待渲染实测] 耗时动作 [待渲染实测] ／ 导航: 仍在 LDAP [读] ／ 持久化: LDAP sync hook [读] | core | page.admin.settings.open.ldap | LDAPGroupPage.tsx [读] |
| `page.admin.settings.oauth.refresh` | 刷新 OAuth 服务 | Settings → OAuth → Refresh_oauth_services | OAuth 组 [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 OAuth [读] ／ 持久化: POST /v1/settings.refreshOAuthServices [读] | core | page.admin.settings.open.oauth | OAuthGroupPage.tsx [读] |
| `page.admin.settings.oauth.add-custom` | 添加自定义 OAuth | OAuth → Add_custom_oauth | 同上 | 界面: [待渲染实测] 新 section ／ 导航: 仍在 OAuth [读] ／ 持久化: POST /v1/settings.addCustomOAuth [读] | core | page.admin.settings.open.oauth | OAuthGroupPage.tsx [读] |
| `page.admin.settings.oauth.remove-custom` | 删除自定义 OAuth | OAuth → 自定义 section → Remove | 已有自定义 [读] | 界面: [待渲染实测] section 消失 ／ 导航: 仍在 OAuth [读] ／ 持久化: POST /v1/settings.removeCustomOAuth [读] | core | page.admin.settings.oauth.add-custom | OAuthGroupPage.tsx [读] |
| `page.admin.settings.saml.import-metadata` | 导入 SAML metadata | Settings → SAML → SAML_Import_metadata → 贴 XML → Apply | SAML 组 [读] | 界面: [待渲染实测] SamlMetadataModal ／ 导航: 仍在 SAML [读] ／ 持久化: POST /v1/saml.parseMetadata；Apply 写入可编辑设置，须再 Save_changes [读] | core | page.admin.settings.open.saml | SAMLGroupPage.tsx SamlMetadataModal.tsx [读] |
| `page.admin.settings.email.send-test` | 给自己发 SMTP 测试信 | Settings → Email → Send_a_test_mail_to_my_user | Email 组 + SMTP [读] | 界面: [待渲染实测] toast ／ 导航: 仍在 Email [读] ／ 持久化: Meteor method sendSMTPTestEmail（SMTP_Test_Button）[读] | core | page.admin.settings.open.email | server/settings/email.ts MethodActionInput [读] |

本表数据行：**53**。计数见附录验算。

## F. 键盘快捷键说明模态（只显示）

02 `nav.user.keyboard`、03 `shortcut.global.showShortcutsModal` 已覆盖打开与按键绑定。本册 **一行**：模态本身只展示 9 条说明，无绑定、无 REST。绑定见 03，不在此复写 9 条 shortcut。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.account.keyboard.display` | 查看键盘快捷键说明（只读） | 顶栏右→`User_menu`→`Keyboard_Shortcuts_Title` 或房间内 `Shift+?`（焦点不在 input/dialog） | 无 | 界面: `[待渲染实测]` `GenericModal` title=`Keyboard_Shortcuts_Title` `variant=info` icon=keyboard；`dl[aria-label=Keyboard_Shortcuts_Title]` 列出 9 条 `dt/dd`；`Close` 关掉 ／ 导航: 模态叠在当前页，刷新关闭 `[读]` ／ 持久化: **无 endpoint** `[读]` | core | `nav.user.keyboard` `shortcut.global.showShortcutsModal` `shortcut.global.markAllAsRead.documented-unbound` | `KeyboardShortcutsModal.tsx:17-66,89-132` `[读]` |

本表数据行：**1**。计数见附录验算。

## G. Audit 页内部 `page.audit.*`

父入口：`route.audit` / `route.audit-log` / `route.security-logs`（04）。本表是表单与查询控件。`AuditForm` RHF：`msg` `dateRange` + 页签字段 `rid`/`users`/`visitor`/`agent`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `page.audit.messages.tab.rooms` | 审计 Rooms 页签 | Audit → tab Rooms | can-audit [读] | 界面: [待渲染实测] 房间表单 ／ 导航: /audit [读] ／ 持久化: 无请求至 Apply [读] | EE:auditing | route.audit | AuditPage.tsx [读] |
| `page.audit.messages.tab.users` | 审计 Users 页签 | Audit → tab Users | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 无至 Apply [读] | EE:auditing | route.audit | AuditPage.tsx [读] |
| `page.audit.messages.tab.dms` | 审计 Direct_Messages 页签 | Audit → tab Direct_Messages | 同上 | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 无至 Apply [读] | EE:auditing | route.audit | AuditPage.tsx [读] |
| `page.audit.messages.tab.omnichannel` | 审计 Omnichannel 页签 | Audit → tab Omnichannel | can-audit + omnichannel [读] | 界面: [待渲染实测] ／ 导航: 切 tab [读] ／ 持久化: 无至 Apply [读] | EE:auditing | route.audit | AuditPage.tsx [读] |
| `page.audit.messages.msg` | 填消息关键词 | Audit → Message | 同上 | 界面: [待渲染实测] search ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | AuditForm.tsx name=msg [读] |
| `page.audit.messages.daterange` | 选审计日期范围 | Audit → Date | 同上 | 界面: [待渲染实测] date-range ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | AuditForm.tsx name=dateRange [读] |
| `page.audit.messages.room` | 选房间 | Rooms 页签 → Channel_name | Rooms 页签 [读] | 界面: [待渲染实测] autocomplete ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | tabs/RoomsTab.tsx name=rid [读] |
| `page.audit.messages.users` | 选用户（Users 页签） | Users 页签 → Users | Users 页签 [读] | 界面: [待渲染实测] 多选 ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | tabs/UsersTab.tsx name=users [读] |
| `page.audit.messages.dm-users` | 选 DM 双方（至少 2） | DMs 页签 → Users | DMs 页签 [读] | 界面: [待渲染实测] 多选 ≥2 [读] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | tabs/DirectTab.tsx name=users [读] |
| `page.audit.messages.visitor` | 选 Omnichannel 访客 | Omnichannel → Visitor | Omnichannel 页签 [读] | 界面: [待渲染实测] autocomplete ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | tabs/OmnichannelTab.tsx name=visitor [读] |
| `page.audit.messages.agent` | 选 Omnichannel 坐席 | Omnichannel → Agent | 同上 | 界面: [待渲染实测] autocomplete ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply [读] | EE:auditing；共享 Apply POST | page.audit.messages.apply | tabs/OmnichannelTab.tsx name=agent [读] |
| `page.audit.messages.apply` | 执行审计查询 | Audit → Apply | 表单有效 [读] | 界面: [待渲染实测] 结果表或空 [读] ／ 导航: 仍在 /audit [读] ／ 持久化: POST /v1/audit.messages 或 /v1/audit.omnichannelMessages [读] | EE:auditing | page.audit.messages.msg | AuditForm.tsx useAuditMutation.ts [读] |
| `page.audit.messages.export-pdf` | 导出 PDF | Audit → Export PDF | 已有结果 [读] | 界面: [待渲染实测] 浏览器打印框 ／ 导航: 仍在页 [读] ／ 持久化: 无 REST，window.print() [读] | EE:auditing | page.audit.messages.apply | AuditForm.tsx [读] |
| `page.audit.log.daterange` | 改审计日志日期 | Audit Log → Date | can-audit-log [读] | 界面: [待渲染实测] 表刷新 ／ 导航: /audit-log [读] ／ 持久化: GET /v1/audit.auditions（改日期即拉）[读] | EE:auditing | route.audit-log | AuditLogTable.tsx [读] |
| `page.audit.security.daterange` | 改设置日志日期 | Security Logs → Date | 设置审计权限 [读] | 界面: [待渲染实测] ／ 导航: /security-logs [读] ／ 持久化: 仅本地至 Apply_filters [读] | EE:auditing；共享 GET /v1/audit.settings | page.audit.security.apply | SecurityLogsTable.tsx [读] |
| `page.audit.security.setting` | 按设置项过滤日志 | Security Logs → Setting select | 同上 | 界面: [待渲染实测] ／ 导航: 仍在页 [读] ／ 持久化: 仅本地至 Apply_filters [读] | EE:auditing；共享 audit.settings | page.audit.security.apply | SecurityLogsTable.tsx [读] |
| `page.audit.security.clear` | 清空安全日志过滤 | Security Logs → Clear_filters | 同上 | 界面: [待渲染实测] 条件复位 ／ 导航: 仍在页 [读] ／ 持久化: 重置查询 [读] | EE:auditing | page.audit.security.apply | SecurityLogsTable.tsx [读] |
| `page.audit.security.apply` | 应用安全日志过滤 | Security Logs → Apply_filters | 同上 | 界面: [待渲染实测] 表刷新 ／ 导航: 仍在页 [读] ／ 持久化: GET /v1/audit.settings [读] | EE:auditing | route.security-logs | SecurityLogsTable.tsx [读] |
| `page.audit.security.row` | 打开一条设置变更详情 | Security Logs → 行单击 | 同上 | 界面: [待渲染实测] 只读模态 ／ 导航: 模态叠在页上 [读] ／ 持久化: 无新请求（展示行数据）[读] | EE:auditing | page.audit.security.apply | SecurityLogsTable.tsx [读] |
| `page.audit.security.pagination` | 翻页设置日志 | Security Logs → Pagination | 有多页 | 界面: [待渲染实测] 换页 ／ 导航: 仍在页 [读] ／ 持久化: GET audit.settings offset [读] | EE:auditing | page.audit.security.apply | SecurityLogsTable.tsx [读] |

本表数据行：**20**。计数见附录验算。

## 分册 08 — Omnichannel 产品交互

全渠道当作产品写，不再是侧栏入口一行。命名空间 `omni.agent.*` / `omni.manager.*` / `omni.widget.*`。侧栏 13+7 枚举见分册 §0。原文：[`08-omnichannel-product.md`](08-omnichannel-product.md)（[PR #8](https://github.com/jianwyao01/Rocket.Chat/pull/8)）。

## 1. 坐席工作台 `omni.agent.*`

入口前缀：`顶栏右→Omnichannel`（组：`useOmnichannelEnabled`）；V2 `主侧栏顶 tablist Omnichannel_filters`；live 房间 `/live/:id`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.agent.queue.open` | 打开坐席工作量表（只读，不是接手 UI） | `顶栏右→Omnichannel→Queue`；或直达 `/livechat-queue` | 组：`Livechat_enabled`+`view-l-room`；项：`view-livechat-queue` + 设置 `Livechat_show_queue_list_link` + `!autoAssignAgent` + **`agentAvailable`**（关则顶栏 Queue 消失）`OmnichannelProvider.tsx:47,58,122-123,204` `useOmnichannelQueueAction.ts:9-18` | (1) 页标题 `Livechat_Queue` + 筛 + 表 `[待渲染实测]`。(2) `GET /v1/livechat/queue` `QueueListTable.tsx:110-113`。(3) URL `/livechat-queue`；筛值 localStorage。[读] | `servedBy` `status` `department`；routing `showQueue` | `nav.omnichannel.queue`（只写入口，本行展开页） | `QueueListPage.tsx:11` `startup/routes.tsx:177-183` `[读]` |
| `omni.agent.queue.filter` | 按接待人/部门/状态筛工作量表 | `/livechat-queue` → 筛 `Served_By` `Department` `Status` | 同 `omni.agent.queue.open` | (1) 表行刷新 `[待渲染实测]`。(2) 再 `GET /v1/livechat/queue`。(3) `QueueListFilter.tsx:22-24` localStorage。[读] | 筛字段 | `omni.agent.queue.open` | `QueueListFilter.tsx:53-62` `[读]` |
| `omni.agent.queue.take` | 从预览态接手排队会话 | `V2 主栏 Queue→询价行→/live/{rid}→composer 脚注 Take_it` | 房间 `!servedBy && queuedAt`；`user.status!==offline` 否则 title `You_cant_take_chats_offline`；`agentAvailable` 否则 `You_cant_take_chats_unavailable`；按钮 disabled `ComposerOmnichannelInquiry.tsx:41-56` | (1) callout `you_are_in_preview_mode_of_incoming_livechat` 换成 `ComposerMessage` `[待渲染实测]`。(2) `GET /v1/livechat/inquiries.getOne` 后 `POST /v1/livechat/inquiries.take` `{inquiryId,options:{clientAction:true}}` `:15-35`。(3) 刷新后 `servedBy` 仍是自己。[读] | inquiry `_id`；`user.status`；`agentAvailable` | `omni.agent.status.consequences` `sidebar.filter.queue` | `ComposerOmnichannelInquiry.tsx:9-62` `[读]` |
| `omni.agent.directory.open` | 打开联络中心（Chats/Contacts） | `顶栏右→Omnichannel→Contact_Center` → `/omnichannel-directory`；**同页**也可 `顶栏 Manage→Omnichannel→Contact_Center` → `/omnichannel/current` | `view-omnichannel-contact-center` `OmnichannelDirectoryRouter.tsx:7-10`；无 tab 则落到 `chats` `OmnichannelDirectoryPage.tsx:22-28`；MAC 超限危险 callout `The_workspace_has_exceeded_the_monthly_limit_of_active_contacts` `:46-50` | (1) 标题 `Omnichannel_Contact_Center` + tab `Chats`/`Contacts` 或 `NotAuthorizedPage` `[待渲染实测]`。(2) 打开无写库。(3) URL tab 仍在。[读] | tab 参数；MAC | `nav.omnichannel.contact` `omni.manager.current.open` | `OmnichannelDirectoryRouter.tsx:6-13` `routes.ts:158-161` `[读]` |
| `omni.agent.directory.chats.search` | 按访客/房间名搜会话表 | 联络中心 → `Chats` → `Search` | 子页 `view-l-room` 否则 `NotAuthorizedPage` `ChatsTab.tsx:7-13` | (1) 表 `Omnichannel_Contact_Center_Chats` 行变化 `[待渲染实测]`。(2) `GET /v1/livechat/rooms` `useCurrentChats.ts:8`。(3) 查询 `newConversationsQuery` localStorage `ChatsProvider.tsx:14`。[读] | `roomName`；sort `fname`/`ts` | `omni.manager.current.chats.search` | `ChatsTable.tsx:49-62` `[读]` |
| `omni.agent.directory.chats.filter` | 打开筛条并 Apply（日期/接待/状态/部门/标签/Units/自定义字段） | `Chats` → `Filters` → 填 → `Apply`；`Clear_filters` 清空 | Units：许可证 `livechat-enterprise` `ChatsFiltersContextualBar.tsx:34,161`；`Served_By`：`view-livechat-rooms` `:32,101`；自定义字段：`view-livechat-room-customfields` `:33,177` | (1) complementary `Filters`；Apply 后芯片出现 `[待渲染实测]`。(2) `GET /v1/livechat/rooms`（`open`/`onhold`/`queued`/`agents[]`/`departmentId[]`/`tags[]`/`units[]`）。(3) 筛在 localStorage 直至 Clear。[读] | 状态选项 `All` `Closed` `Room_Status_Open` `On_Hold_Chats` `Queued` | `omni.agent.directory.chats.search` | `ChatsFiltersContextualBar.tsx:73-224` `[读]` |
| `omni.agent.directory.chats.open` | 看历史并进 `/live` | `Chats` 行 → 栏 `Conversation` → `Open_chat` | 同 chats tab | (1) 消息列表 + footer `Open_chat`；点后进 live 房 `[待渲染实测]`。(2) `GET /v1/livechat/:rid/messages` `useHistoryMessageList.ts:17`。(3) 落到 `/live/{id}`。[读] | `rid` | `omni.agent.queue.take` | `ChatsContextualBar.tsx:13-21` `ContactHistoryMessagesList.tsx:146` `[读]` |
| `omni.agent.directory.chats.remove` | 删除一条已关会话 | 已关行 → 垃圾桶 `Remove` → `Delete` | `remove-closed-livechat-room` `ChatsTable.tsx:27,66` | (1) 确认后行消失；toast `Chat_removed` `[待渲染实测]`。(2) `POST /v1/livechat/rooms.delete` `useRemoveCurrentChatMutation.ts:9`。(3) 刷新后该房不在表。[读] | 房间 `closed` | `omni.manager.current.chats.remove` | `RemoveChatButton.tsx:27-37` `[读]` |
| `omni.agent.directory.chats.remove-all-closed` | 批量删全部已关会话 | `Chats` → `More` → 删全部已关 → `Delete` | `remove-closed-livechat-rooms` `ChatsTableFilter.tsx:20,40` | (1) 已关行清空；toast `Chat_removed` `[待渲染实测]`。(2) `POST /v1/livechat/rooms.removeAllClosedRooms` `:19,27`。(3) 刷新后已关集合空。[读] | — | `omni.agent.directory.chats.remove` | `ChatsTableFilter.tsx:40-53` `[读]` |
| `omni.agent.directory.contacts.search` | 搜联系人表 | `Contacts` → `Search` | 子页 `view-l-room` `ContactTab.tsx:7-13` | (1) 表 `Omnichannel_Contact_Center_Contacts` `[待渲染实测]`。(2) `GET /v1/omnichannel/contacts.search` `useCurrentContacts.ts:11`。(3) 只读列表。[读] | 列 `Name` `Last_channel` `Contact_Manager` `Last_Chat` | `omni.manager.current.contacts.search` | `ContactTable.tsx:32-124` `[读]` |
| `omni.agent.directory.contact.new` | 新建联系人 | `Contacts` → `New_contact` → 填 `Name`/邮箱/电话/`Contact_Manager` → `Save` | API `create-livechat-contact`；第 2 个邮箱/电话无许可证 `contact-id-verification` → `AdvancedContactModal` `EditContactInfo.tsx:76,241,283` | (1) 栏 `context=new`；成功 toast `Contact_has_been_created` `[待渲染实测]`。(2) 校验 `GET /v1/omnichannel/contacts.checkExistence`；写 `POST /v1/omnichannel/contacts` `useCreateContact.ts:10`。(3) 刷新后表中仍在。[读] | 自定义字段（`view-livechat-room-customfields`） | `omni.agent.unknown-contact` | `ContactTable.tsx:45-99` `EditContactInfo.tsx:81-289` `[读]` |
| `omni.agent.directory.contact.edit` | 改已有联系人 | 行 `More_actions`→`Edit` 或详情铅笔 `Edit` → `Save` | 菜单：`update-livechat-contact` `ContactItemMenu.tsx:22,38-43`；铅笔：`edit-omnichannel-contact` 且无 conflicts `ContactInfo.tsx:35,62-66` | (1) 编辑栏；toast `Contact_has_been_updated` `[待渲染实测]`。(2) `POST /v1/omnichannel/contacts.update` `useEditContact.ts:10`。(3) 刷新后字段仍在。[读] | contact id | `omni.agent.contact.edit` | `ContactItemMenu.tsx:37-43` `[读]` |
| `omni.agent.directory.contact.delete` | 删除联系人 | 行 `More_actions`→`Delete` → 键入确认 → `Delete` | `delete-livechat-contact` `ContactItemMenu.tsx:23,50` | (1) 模态后行消失；toast `Contact_has_been_deleted` `[待渲染实测]`。(2) `POST /v1/omnichannel/contacts.delete` `RemoveContactModal.tsx:22,34`。(3) 刷新后不在表。[读] | contact id | `omni.manager.current.contact.delete` | `RemoveContactModal.tsx:22-64` `[读]` |
| `omni.agent.directory.contact.details` | 看联系人 Details/Channels | 行点击 → tab `Details` / `Channels` | 拉详情要 `view-livechat-room-customfields` 否则 `Contact_not_found` `ContactInfoWithData.tsx:14-20` | (1) 栏 tab 切换 `[待渲染实测]`。(2) `GET /v1/omnichannel/contacts.get`；频道 `GET /v1/omnichannel/contacts.channels`。(3) URL `context`。[读] | conflicts → `See_conflicts` | `room.toolbox.contact-profile` | `ContactInfo.tsx:46-108` `[读]` |
| `omni.agent.directory.contact.history` | 按来源筛并钻取历史会话 | 联系人 → `History` → `Filter` → 点条目 → `Search` / `Open_chat` | 非 `All` 筛无 `contact-id-verification` → `AdvancedContactModal` `ContactInfoHistory.tsx:30-43` | (1) 历史列表再进消息；footer `Open_chat` `[待渲染实测]`。(2) `GET /v1/omnichannel/contacts.history`；消息 `GET /v1/livechat/:rid/messages`。(3) 筛 `contact-history-type` localStorage。[读] | `source` | `omni.agent.directory.chats.open` | `ContactInfoHistory.tsx:28-88` `ContactInfoHistoryMessages.tsx:73-126` `[读]` |
| `omni.agent.directory.contact.block` | 拉黑/解除联系人频道 | `Channels` 行 ⋮ → `Block`/`Unblock`；或未知联系人 callout `Block` | 确认要 `contact-id-verification` 否则 upsell `useBlockChannel.tsx:32-34` | (1) toast `Contact_blocked`/`Contact_unblocked` `[待渲染实测]`。(2) `POST /v1/omnichannel/contacts.block` / `.unblock` `:18-19`。(3) 刷新后频道仍封/解。[读] | channel id | `omni.agent.unknown-contact` | `useBlockChannel.tsx:18-38` `[读]` |
| `omni.agent.sidepanel.in-progress` | 副栏列出进行中 live 房并点进 | `主侧栏 Omnichannel_filters→In_progress` → 行 | V2 `secondarySidebar` + `view-l-room` + omnichannel enabled `OmnichannelFilters.tsx:10-20` | (1) 副栏标题 `In_progress`，`!onHold` 房间 `[待渲染实测]`。(2) 订阅流，无专用 REST。(3) tab `sidePanelFilters` localStorage。[读] | rooms `onHold` | `sidebar.filter.in-progress`（只写 tab） | `SidePanelInProgress.tsx:13` `[读]` |
| `omni.agent.sidepanel.on-hold` | 副栏列出挂起会话 | `主侧栏→On_Hold` | 许可证 **`livechat-enterprise`**，否则 tab 隐并回 `all` `SidepanelOnHold.tsx:17-21` | (1) 标题 `On_Hold` `[待渲染实测]`。(2) 订阅流。(3) localStorage tab。[读] | `room.onHold` | `sidebar.filter.on-hold` `omni.agent.hold` | `SidepanelOnHold.tsx:17-31` `[读]` |
| `omni.agent.sidepanel.priority` | 从副栏行菜单改优先级 | 进行中/挂起 行 ⋮ → `Priorities` / `Unprioritized` | 优先级启用 = omnichannel + enterprise 配置 `OmnichannelProvider.tsx:73-86` `useRoomMenuActions.ts:137` | (1) 行优先级图标变 `[待渲染实测]`。(2) `POST` 或 `DELETE /v1/livechat/room/:rid/priority` `useOmnichannelPrioritiesMenu.ts:15-26`。(3) 刷新后优先级仍在。[读] | `rid`；优先级目录 | `omni.manager.priorities.edit` | `useOmnichannelPrioritiesMenu.ts:15-52` `[读]` |
| `omni.agent.room.info` | 打开会话 Room_Info（含访客 UA） | live `房间头→工具栏→info-circled` / `Room_Info` | hook 对 `live` 组始终注册 `useRoomInfoRoomAction.ts:9-14`；UA 段仅 visitor 有 `userAgent` `VisitorClientInfo.tsx:35-36` | (1) complementary 字段 Topic/Tags/SLA/Priority/Queue_Time；可有 `OS` `Browser` `Host` `IP` `[待渲染实测]`。(2) 房间 info hook；访客 `GET /v1/livechat/visitors.info` `:18-28`。(3) URL tab。[读] | room / visitor | `room.toolbox` 房间信息 | `ChatInfo.tsx:93-179` `[读]` |
| `omni.agent.room.edit` | 保存会话 Topic/Tags/自定义字段/SLA/Priority | Room_Info → `Edit` → `Save` | 须订阅或接待人或 `save-others-livechat-room-info` `ChatInfo.tsx:61-73`；自定义字段 `view/edit-livechat-room-customfields` `RoomEdit.tsx:57`；SLA/Priority 控件要 **`livechat-enterprise`** `SlaPoliciesSelect.tsx:16-21` `PrioritiesSelect.tsx:22-51` | (1) 回到只读 info `[待渲染实测]`。(2) `POST /v1/livechat/room.saveInfo`（`slaId`/`priorityId`/tags/topic）`RoomEdit.tsx:59,104`。(3) 刷新后字段仍在。[读] | department tags `useLivechatTags` | `omni.agent.sidepanel.priority` `omni.agent.close` | `RoomEdit.tsx:137-170` `[读]` |
| `omni.agent.contact.info` | 在 live 房打开 Contact_Info | `房间头→工具栏→Contact_Info` | toolbox hook none `useContactProfileRoomAction.ts:6-17`；详情拉数同 directory | (1) complementary `Contact_Info` + Details/Channels/History `[待渲染实测]`。(2) `GET /v1/omnichannel/contacts.get`。(3) URL `tab=contact-profile`。[读] | contact id | `room.toolbox.contact-profile`（只写开口） | `useContactProfileRoomAction.ts:8-15` `[读]` |
| `omni.agent.contact.edit` | 从房间资料改联系人 | Contact_Info 铅笔 `Edit` → `Save` | `edit-omnichannel-contact`；conflicts 则禁用 `ContactInfo.tsx:35,62-66` | (1) 编辑栏；toast `Contact_has_been_updated` `[待渲染实测]`。(2) `POST /v1/omnichannel/contacts.update` `useEditContact.ts:10`。(3) 刷新后字段仍在。[读] | contact id | `omni.agent.directory.contact.edit` | `ContactInfo.tsx:61-67` `[读]` |
| `omni.agent.canned.list` | 打开房间内快捷回复列表并搜/按 Type 筛 | live `房间头→Canned_Responses` → `Search` / `Type` | 许可证 **`canned-responses`** + 设置 `Canned_Responses_Enable` `useCannedResponsesRoomAction.ts:10-15`；composer `!` 补全另要 `view-canned-responses` `useCannedResponsesQuery.ts:15-18` | (1) complementary `Canned_Responses` `[待渲染实测]`。(2) `GET /v1/canned-responses` `useCannedResponseList.ts:8,16`。(3) Type `canned-response-list-type` localStorage；URL `tab=canned-responses`。[读] | scope/type | `room.toolbox.canned-responses`（只写开口） | `CannedResponseList.tsx:85-100` `[读]` |
| `omni.agent.canned.use` | 把一条快捷回复插入 composer | 列表悬停 `Use` 或详情 footer `Use` | MAC 超限则 `allowUse=false` `CannedResponseList.tsx:72,118` | (1) composer 出现快捷回复正文 `[待渲染实测]`。(2) **无** HTTP（本地插入）。(3) 未发送则刷新后消失。[读] | canned shortcut/text | `omni.agent.canned.list` | `Item.tsx:52-59` `WrapCannedResponseList.tsx:58-64` `[读]` |
| `omni.agent.canned.create` | 坐席创建快捷回复 | 栏 footer `Create` → 填 → 保存 | `save-canned-responses` OR `save-department-canned-responses` `useCanCreateCannedResponse.ts:4-7` | (1) 模态 `Create_canned_response` 关闭后列表多一行 `[待渲染实测]`。(2) `POST /v1/canned-responses` `CreateCannedResponseModal.tsx:39,44`。(3) 刷新后仍在。[读] | shortcut/message/scope | `omni.manager.canned.create` | `CreateCannedResponseModal.tsx:39-69` `[读]` |
| `omni.agent.canned.edit` | 坐席改自己可见的快捷回复 | 详情 → `Edit` → 保存 | `useCanEditCannedResponse` `useCanEditCannedResponse.ts:4-14` | (1) 模态 `Edit_Canned_Response` `[待渲染实测]`。(2) `POST /v1/canned-responses`。(3) 刷新后正文仍在。[读] | canned `_id` | `omni.agent.canned.create` | `CannedResponse.tsx:101` `[读]` |
| `omni.agent.forward` | 将会话转部门或转人 | live 头 `Omnichannel_quick_actions` → `Forward_chat`（balloon-arrow-top-right）→ `Forward_to_department` 和/或 `Forward_to_user` + `Leave_a_comment` → `Forward` | `transfer-livechat-guest`；房间开且非 MAC `useQuickActions.tsx:270,286-287`；须选部门或人 `:107`；闲置坐席受 `Livechat_enabled_when_agent_idle` `ForwardChatModal.tsx:29,146` | (1) 模态关；进 `/home`；本房从自己列表消失 `[待渲染实测]`。(2) 可选 `GET /v1/users.info`；`POST /v1/livechat/room.forward` `ForwardChatModal.tsx:28,50,86`。(3) 刷新后接待人/部门已变。[读] | dept/user/comment；`rid` | `omni.agent.return-queue` | `useChatForwardQuickAction.ts:10` `ForwardChatModal.tsx:103-149` `[读]` |
| `omni.agent.close` | 关会话（wrap-up：评论/标签/transcript） | 头 → `End_conversation`（balloon-close-top-right）→ 表单或确认 → `Confirm` | `close-livechat-room` OR `close-others-livechat-room` 且房间开 `useQuickActions.tsx:274-275,294-295`；评论强制：`Livechat_request_comment_when_closing_conversation` `CloseChatModal.tsx:66`；部门 `requestTagBeforeClosingChat` 则 Tags 必填 `:126-128`；PDF：`request-pdf-transcript` + **`livechat-enterprise`** `:78-83`；邮件：`send-omnichannel-chat-transcript` + 访客邮箱 `:80-82`；`Livechat_transcript_send_always` 跳过邮件勾选 `:67,94` | (1) 标题 `Wrap_up_conversation` 或 `Are_you_sure_you_want_to_close_this_chat`；成功 toast `Chat_closed_successfully`；composer 变 `This_conversation_is_already_closed` `[待渲染实测]`。(2) `POST /v1/livechat/room.closeByUser` `{rid,comment,tags,generateTranscriptPdf,transcriptEmail}` `useQuickActions.tsx:136,148-161`。(3) 刷新后仍关；inquiry discarded。[读] | 偏好 `omnichannelTranscriptPDF/Email` | `account.omnichannel` `omni.widget.close` | `CloseChatModal.tsx:66-261` `[读]` |
| `omni.agent.hold` | 手动挂起会话 | 头 → `Omnichannel_onHold_Chat`（pause-unfilled）→ `Would_you_like_to_place_chat_on_hold` → 确认 | 许可证 **`livechat-enterprise`**（hook 才注册）`useOnHoldChatQuickAction.ts:7-11`；设置 `Livechat_allow_manual_on_hold` `useQuickActions.tsx:263,279`；未挂起且有接待人；若 `Livechat_allow_manual_on_hold_upon_agent_engagement_only` 则须坐席已发言 `:276-279`；房间开 `:296-297` | (1) 确认后进 on-hold composer `[待渲染实测]`。(2) `POST /v1/livechat/room.onHold` `usePutChatOnHoldMutation.ts:11,17`。(3) 刷新后 `room.onHold` 仍真。[读] | `rid` | `omni.agent.sidepanel.on-hold` | `PlaceChatOnHoldModal.tsx:25-36` `[读]` |
| `omni.agent.resume` | 从挂起恢复会话 | 挂起房 composer → `Resume` | 房间 `onHold`（`ComposerOmnichannel.tsx:44-49`） | (1) callout `chat_on_hold_due_to_inactivity` 换成 `ComposerMessage` `[待渲染实测]`。(2) `POST /v1/livechat/room.resumeOnHold` `useResumeChatOnHoldMutation.ts:11,19`。(3) 刷新后可写。[读] | `rid` | `omni.agent.hold` | `ComposerOmnichannelOnHold.tsx:16-22` `[读]` |
| `omni.agent.return-queue` | 把已接会话退回队列 | 头 → `Move_queue`（burger-arrow-left）→ `Return_to_the_queue` → `Confirm` | routing `returnQueue` 且房间有 `u` `useQuickActions.tsx:269,285`；非 MAC；房间开 | (1) 进 `/home`；本房从进行中消失 `[待渲染实测]`。(2) `POST /v1/livechat/inquiries.returnAsInquiry` `useReturnChatToQueueMutation.ts:11,17`。(3) 刷新后回 Queue 询价。[读] | `rid` | `omni.agent.queue.take` `omni.agent.forward` | `ReturnChatQueueModal.tsx:16-21` `[读]` |
| `omni.agent.transcript.email` | 单独发邮件 transcript（非关单附带） | 头 `Send_transcript` → `Send_via_email` → 填邮箱/主题 | `send-omnichannel-chat-transcript` `useQuickActions.tsx:271,290-291`；非 MAC | (1) `TranscriptModal`；可 Discard `[待渲染实测]`。(2) `POST /v1/livechat/transcript/:rid` 或 `/v1/livechat/transcript`；丢弃 `DELETE /v1/livechat/transcript/:rid` `:75-134`。(3) 请求挂在房间上。[读] | visitor email | `omni.agent.close` `account.omnichannel` | `TranscriptModal.tsx:74-132` `[读]` |
| `omni.agent.transcript.pdf` | 请求 PDF transcript | 头 → `Export_as_PDF` | `request-pdf-transcript` + **`livechat-enterprise`** `useQuickActions.tsx:272-273,292-293`；PDF 在未关房时 disabled `useTranscriptQuickAction.ts:19-22` | (1) 立即请求或按钮灰 `[待渲染实测]`。(2) `POST /v1/omnichannel/:rid/request-transcript`。(3) 关房后可再下。[读] | 房间 closed | `omni.agent.close` | `useTranscriptQuickAction.ts:19-22` `[读]` |
| `omni.agent.file.send` | 在可写 live composer 发文件 | 进行中且已订阅 → composer `Upload_file` / 拖放 | `FileUpload_Enabled` `useFileUploadAction.ts:13,50`；inquiry/onHold/closed/MAC/join **替换** `ComposerMessage` 故无上传 `ComposerOmnichannel.tsx:26-75` | (1) 附件 chip 后发出 `[待渲染实测]`。(2) 常规聊天上传流。(3) 刷新后消息仍在。[读] | 媒体黑白名单 | `composer` 他册上传 | `ComposerOmnichannel.tsx:71-75` `[读]` |
| `omni.agent.join` | 加入并非自己接待的开房 | 开房且未订阅且非接待人 → composer `Join` | `!isSubscribed && !isSameAgent` `ComposerOmnichannel.tsx:62-67` | (1) 变成可写 composer `[待渲染实测]`。(2) `GET /v1/livechat/room.join` `ComposerOmnichannelJoin.tsx:9,20-22`。(3) 刷新后仍订阅。[读] | `rid` | `omni.agent.queue.take` | `ComposerOmnichannelJoin.tsx:16-28` `[读]` |
| `omni.agent.status.consequences` | 顶栏开关接听后的后果与拒绝态（**不重写入口**） | 入口见 `nav.omnichannel.agent-toggle`（`Turn_on/off_answer_chats`）。本行只写后果 | API `view-l-room` `agent.ts:81`；自己点：营业时间关 → `error-business-hours-are-closed` `:128-129`；停用坐席 `error-user-deactivated` `:99-100`；经理改他人要 `manage-livechat-agents` `:113-114`（BH 关时经理静默不改 `:117-125`） | (1) **ON** `icon=message` title `Turn_off_answer_chats`；Queue 链/询价流可出现。(1b) **OFF** `icon=message-disabled` title `Turn_on_answer_chats`；顶栏 Queue 消失 `OmnichannelProvider.tsx:204`；询价侧栏空 `:122-146`；`Take_it` disabled `You_cant_take_chats_unavailable`。(1c) 拒绝：toast 错误，图标不变 `[待渲染实测]`。(2) `POST /v1/livechat/agent.status` `{}` `useOmnichannelLivechatToggle.ts:11-16`。(3) `statusLivechat` 写在用户上，刷新仍在。[读] | `statusLivechat`；BH；`agent.active` | **`nav.omnichannel.agent-toggle`**（入口，勿复） `omni.agent.queue.take` `omni.manager.agents.edit` | `useOmnichannelLivechatToggle.ts:8-27` `agent.ts:79-134` `[读]` |
| `omni.agent.unknown-contact` | 处理未知联系人 callout | 未知联系人 live 房 composer 上 → `Add_contact` / `Block` / Dismiss | contact `unknown` 且未 dismiss `ComposerOmnichannelCallout.tsx:35-36` | (1) callout `Unknown_contact_callout_description`；Dismiss 后当次消失 `[待渲染实测]`。(2) `GET /v1/omnichannel/contacts.get` `:27-28`；Add 只导航 `/live/{rid}/contact-profile/edit`。(3) dismiss **sessionStorage**，刷新可再出。[读] | contact unknown | `omni.agent.directory.contact.new` `omni.agent.directory.contact.block` | `ComposerOmnichannelCallout.tsx:25-57` `[读]` |
| `omni.agent.composer.denied` | 六态 composer 谁可写谁拒绝 | 打开任意 live 房看脚注（非独立按钮） | 状态机 `ComposerOmnichannel.tsx:26-76`：关 / MAC / onHold / inquiry / join / 可写 | (1) 关：`This_conversation_is_already_closed`；MAC：`Workspace_exceeded_MAC_limit_disclaimer`；onHold：`chat_on_hold_due_to_inactivity`+`Resume`；inquiry：preview+`Take_it`；未订阅：`room_is_read_only`+`Join`；可写：`ComposerMessage`（上传/emoji 与普通房同）`[待渲染实测]`。(2) 无点击则无 HTTP。(3) 随房间字段刷新再算。[读] | `open` `onHold` `servedBy` `queuedAt` MAC | `omni.agent.file.send` `omni.agent.take/resume/join` | `ComposerOmnichannel.tsx:14-76` `[读]` |

本表数据行：**39**。计数见附录验算。

## 2. 经理控制台 `omni.manager.*`

### 2.1 Contact_Center `/omnichannel/current`

与 `/omnichannel-directory` 同组件。入口序列用经理侧栏。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.current.open` | 打开经理联络中心默认页 | `Manage→Omnichannel`（index→current）或侧栏 `Contact_Center` | `view-omnichannel-contact-center` `sidebarItems.tsx:14` `OmnichannelDirectoryRouter.tsx:7` | (1) 侧栏+`Chats`/`Contacts` `[待渲染实测]`。(2) 无。(3) `/omnichannel/current`。[读] | tab | `route.omnichannel` `omni.agent.directory.open` | `OmnichannelRouter.tsx:16-24` `routes.ts:158-161` `[读]` |
| `omni.manager.current.chats.search` | 经理侧搜会话 | 侧栏 Contact_Center → `Chats` → `Search` / 列头排序 / 分页 | `view-l-room` `ChatsTab.tsx:7-13` | (1) 表 `Omnichannel_Contact_Center_Chats` 行变 `[待渲染实测]`。(2) `GET /v1/livechat/rooms` `useCurrentChats.ts:8`。(3) `newConversationsQuery` localStorage。[读] | `roomName` | `omni.agent.directory.chats.search` | `ChatsTable.tsx` `[读]` |
| `omni.manager.current.chats.filter` | 经理侧 Apply 筛 | `Filters` → From/To/Served_By/Status/Department/Tags/Units → `Apply` | Units：`livechat-enterprise` `ChatsFiltersContextualBar.tsx:34,161`；`Served_By`：`view-livechat-rooms`；自定义字段：`view-livechat-room-customfields` | (1) complementary `Filters`；芯片出现 `[待渲染实测]`。(2) `GET /v1/livechat/rooms`。(3) 筛 localStorage 直至 Clear。[读] | 状态/部门/标签 | `omni.agent.directory.chats.filter` | `ChatsFiltersContextualBar.tsx` `[读]` |
| `omni.manager.current.chats.open` | 经理侧打开会话历史 | 行 → `Open_chat` | `view-l-room` | (1) 消息列表 + footer `Open_chat` `[待渲染实测]`。(2) `GET /v1/livechat/:rid/messages`。(3) 可落到 `/live/{id}`。[读] | `rid` | `omni.agent.directory.chats.open` | `ChatsContextualBar.tsx` `[读]` |
| `omni.manager.current.chats.remove` | 经理删一条已关 | 已关行 `Remove` | `remove-closed-livechat-room` | (1) 行消失；toast `Chat_removed` `[待渲染实测]`。(2) `POST /v1/livechat/rooms.delete`。(3) 刷新后不在表。[读] | 房间 closed | `omni.agent.directory.chats.remove` | `RemoveChatButton.tsx` `[读]` |
| `omni.manager.current.chats.remove-all` | 经理批量删已关 | `More` → 删全部已关 | `remove-closed-livechat-rooms` | (1) 已关行清空；toast `Chat_removed` `[待渲染实测]`。(2) `POST /v1/livechat/rooms.removeAllClosedRooms`。(3) 刷新后已关集合空。[读] | — | `omni.agent.directory.chats.remove-all-closed` | `ChatsTableFilter.tsx:40-53` `[读]` |
| `omni.manager.current.contacts.search` | 经理侧搜联系人 | `Contacts` → `Search` / 排序 / 分页 | `view-l-room` | (1) 表 `Omnichannel_Contact_Center_Contacts` `[待渲染实测]`。(2) `GET /v1/omnichannel/contacts.search`。(3) 只读列表。[读] | text | `omni.agent.directory.contacts.search` | `ContactTable.tsx` `[读]` |
| `omni.manager.current.contact.new` | 经理新建联系人 | `New_contact` → `Save` | `create-livechat-contact`；多邮箱/电话要 `contact-id-verification` | (1) toast `Contact_has_been_created` `[待渲染实测]`。(2) `POST /v1/omnichannel/contacts`。(3) 刷新后表中仍在。[读] | name/email | `omni.agent.directory.contact.new` | `useCreateContact.ts:10` `[读]` |
| `omni.manager.current.contact.edit` | 经理改联系人 | `Edit` → `Save` | `update-livechat-contact` / `edit-omnichannel-contact` | (1) toast `Contact_has_been_updated` `[待渲染实测]`。(2) `POST /v1/omnichannel/contacts.update`。(3) 刷新后字段仍在。[读] | contact id | `omni.agent.directory.contact.edit` | `useEditContact.ts:10` `[读]` |
| `omni.manager.current.contact.delete` | 经理删联系人 | `Delete` → 确认 | `delete-livechat-contact` | (1) 行消失；toast `Contact_has_been_deleted` `[待渲染实测]`。(2) `POST /v1/omnichannel/contacts.delete`。(3) 刷新后不在表。[读] | contact id | `omni.agent.directory.contact.delete` | `RemoveContactModal.tsx` `[读]` |

本表数据行：**10**。计数见附录验算。

### 2.2 Analytics `/omnichannel/analytics`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.analytics.open` | 打开分析页（会话/产能总览+图+坐席表） | 侧栏 `Analytics` | 侧栏 `view-livechat-analytics` `sidebarItems.tsx:20`；**路由不再检** | (1) `Type`/`Departments`/`Start`/`End`/`Chart` `[待渲染实测]`。(2) `GET /v1/livechat/analytics/overview` `Overview.tsx:32`；图 `.../dashboards/charts-data` `InterchangeableChart.tsx:58`；坐席 `.../agent-overview` `AgentOverview.tsx:36`。(3) 只读。[读] | `departmentId` `start` `end` `onlyMyDepartments` | `omni.manager.realtime.open` | `AnalyticsPage.tsx` `routes.ts:173-176` `[读]` |
| `omni.manager.analytics.filter` | 改类型/部门/日期/图并重拉 | `Type`=`Conversations`/`Productivity`；`Departments`；日期或 `Date_range_presets`；`Chart` | 同 open | (1) 卡片/图重绘 `[待渲染实测]`。(2) 同上 GET 带新参。(3) 客户端状态，刷新回默认。[读] | 预设 Today/Yesterday 等 `DateRangePicker.tsx:72-144` | `omni.manager.analytics.open` | `AnalyticsPage.tsx:65-72` `[读]` |

本表数据行：**2**。计数见附录验算。

### 2.3 Real_Time_Monitoring `/omnichannel/realtime-monitoring`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.realtime.open` | 打开实时监控墙 | 侧栏 `Real_Time_Monitoring` | `view-livechat-real-time-monitoring` `sidebarItems.tsx:26` | (1) 多图+数字 `[待渲染实测]`。(2) 轮询：`.../conversation-totalizers` `.../charts/chats` `.../chats-per-agent` `.../chats-totalizers` `.../charts/agents-status` `.../chats-per-department` `.../agents-productivity-totalizers` `.../charts/timings` `.../productivity-totalizers`。(3) 只读快照。[读] | `departmentId` | `omni.manager.analytics.open` | `RealTimeMonitoringPage.tsx` `routes.ts:168-171` `[读]` |
| `omni.manager.realtime.filter` | 改部门或刷新间隔 | `Departments`（`All`）或 `Update_every`（5/10/30/60 秒或分） | 同 open | (1) 间隔后图刷新 `[待渲染实测]`。(2) invalidate `omnichannelQueryKeys.analytics.all` `:35-37`。(3) 间隔不落库。[读] | interval | `omni.manager.realtime.open` | `RealTimeMonitoringPage.tsx:47-81` `[读]` |

本表数据行：**2**。计数见附录验算。

### 2.4 Managers `/omnichannel/managers`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.managers.open` | 打开经理角色表 | 侧栏 `Managers` | `manage-livechat-managers` `sidebarItems.tsx:32` `ManagersRoute.tsx:10-13` | (1) 表+`Add_manager` `[待渲染实测]`。(2) `GET /v1/livechat/users/manager` `ManagersTable.tsx:49`。(3) URL `/omnichannel/managers`。[读] | 分页 | `omni.manager.agents.open` | `ManagersRoute.tsx` `[读]` |
| `omni.manager.managers.search` | 搜经理 | `Search` / 列头 Name Username Email | 同 open | (1) 行过滤 `[待渲染实测]`。(2) GET 带 text/sort。(3) 不写库。[读] | text | `omni.manager.managers.open` | `ManagersTable.tsx:49` `[读]` |
| `omni.manager.managers.add` | 按用户名加经理 | `Username` → `Add_manager` | 同 open | (1) 新行；toast `Manager_added` `[待渲染实测]`。(2) `POST /v1/livechat/users/manager` `AddManager.tsx:21`。(3) 刷新仍在。[读] | username | `omni.manager.managers.remove` | `AddManager.tsx:21` `[读]` |
| `omni.manager.managers.remove` | 撤经理 | 行 `Remove` → `Delete` | 同 open | (1) 行消失；toast `Manager_removed` `[待渲染实测]`。(2) `DELETE /v1/livechat/users/manager/:_id` `RemoveManagerButton.tsx:17`。(3) 刷新后不在。[读] | `_id` | `omni.manager.managers.add` | `RemoveManagerButton.tsx:17` `[读]` |

本表数据行：**4**。计数见附录验算。

### 2.5 Agents `/omnichannel/agents`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.agents.open` | 打开坐席表 | 侧栏 `Agents` | `manage-livechat-agents` `sidebarItems.tsx:38` `AgentsPage.tsx:13-21` | (1) 表+`Add_agent` `[待渲染实测]`。(2) `GET /v1/livechat/users/agent` `useAgentsQuery.ts:8`。(3) `/omnichannel/agents`。[读] | — | `omni.manager.managers.open` | `AgentsPage.tsx` `routes.ts:118-121` `[读]` |
| `omni.manager.agents.search` | 搜/排序坐席 | `Search`；列 Name/Username/Email/`Livechat_status` | 同 open | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text/sort | `omni.manager.agents.open` | `useAgentsQuery.ts:8` `[读]` |
| `omni.manager.agents.add` | 加坐席 | `Username` → `Add_agent` | 同 open | (1) toast `Agent_added` `[待渲染实测]`。(2) `POST /v1/livechat/users/agent` `AddAgent.tsx:20`。(3) 刷新仍在。[读] | username | `omni.manager.agents.remove` | `AddAgent.tsx:20` `[读]` |
| `omni.manager.agents.info` | 打开坐席信息栏 | 行点击 | 同 open | (1) complementary info `[待渲染实测]`。(2) `GET /v1/livechat/users/agent/:_id` `AgentInfo.tsx:29`。(3) URL `/omnichannel/agents/info/{id}`。[读] | id | `omni.manager.agents.edit` | `AgentInfo.tsx:29-64` `[读]` |
| `omni.manager.agents.edit` | 改坐席接听状态与部门并保存 | info → `Edit` → `Status`（Available/Not_Available）+ `Departments` → `Save`（`Reset` 回滚表单） | 同 open；改他人状态服务端 `manage-livechat-agents` `agent.ts:113` | (1) toast `Success`；栏可关 `[待渲染实测]`。(2) `POST /v1/livechat/agent.status` + `POST /v1/livechat/agents.saveInfo` `AgentEdit.tsx:79-90`。(3) 刷新后状态/部门仍在。[读] | departments；`statusLivechat` | `omni.agent.status.consequences` | `AgentEdit.tsx:79-90` `[读]` |
| `omni.manager.agents.remove` | 撤坐席 | 行或 info `Remove` → `Delete` | 同 open | (1) toast `Agent_removed` `[待渲染实测]`。(2) `DELETE /v1/livechat/users/agent/:_id` `useRemoveAgent.tsx:16`。(3) 刷新后不在。[读] | `_id` | `omni.manager.agents.add` | `useRemoveAgent.tsx:16` `[读]` |

本表数据行：**6**。计数见附录验算。

### 2.6 Departments `/omnichannel/departments`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.departments.open` | 打开部门 All/Archived | 侧栏 `Departments` | 侧栏 `view-livechat-departments` `:44`；**页** `manage-livechat-departments` `DepartmentsRoute.tsx:7-10` | (1) tab `All`/`Archived` `[待渲染实测]`。(2) `GET /v1/livechat/department` 或 `.../departments/archived` `DepartmentsTable.tsx:24-39`。(3) URL。[读] | tab | — | `DepartmentsPage.tsx:47-53` `[读]` |
| `omni.manager.departments.search` | 搜/排序部门 | `Search`；列 Name/Description/Num_Agents/Enabled/Show_on_registration | 同页权 | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text | `omni.manager.departments.open` | `DepartmentsTable.tsx` `[读]` |
| `omni.manager.departments.create` | 新建部门（或撞限额 upsell） | `Create_department` | 先 `GET /v1/livechat/department/isDepartmentCreationAvailable` `NewDepartment.tsx:18`；false → `EnterpriseDepartmentsModal`（`Premium_capability`/`Upgrade`） | (1) 新表单或 upsell `[待渲染实测]`。(2) 可用则随后 POST 见 edit。(3) 限额是许可证态。[读] | 部门数限额 | `omni.manager.departments.edit` | `NewDepartment.tsx:18-26` `EnterpriseDepartmentsModal.tsx:49-65` `[读]` |
| `omni.manager.departments.edit` | 保存部门（含 Agents 段与 EE 字段） | 行 `Options`→`Edit` 或 new 表单 → `Enabled`/Name/Email/… + Agents 加减 → `Save` | 同页权；`Unit` 要 `manage-livechat-units` + **`livechat-enterprise`** `EditDepartment.tsx:63-64,348-354`；EE 字段 Max chats / waiting queue / forward / BH | (1) toast `Saved` 回列表 `[待渲染实测]`。(2) `POST /v1/livechat/department` 或 `PUT /v1/livechat/department/:_id`；坐席 `POST .../department/:_id/agents` `:82-116`；加坐席预取 `GET /v1/livechat/users/agent/:_id`。(3) 刷新后仍在。[读] | agents count/order | `omni.manager.units.edit` | `EditDepartment.tsx:82-116,258-354` `[读]` |
| `omni.manager.departments.archive` | 归档或恢复部门 | 行菜单 `Archive`/`Unarchive` | 同页权 | (1) 进 Archived 或回 All；toast `[待渲染实测]`。(2) `POST /v1/livechat/department/:_id/archive` 或 `.../unarchive` `DepartmentItemMenu.tsx:11-47`。(3) 刷新后 tab 归属变。[读] | `_id` | `omni.manager.departments.open` | `DepartmentItemMenu.tsx:31-47` `[读]` |
| `omni.manager.departments.delete` | 删除部门 | 菜单 `Delete` → 确认 | 设置 `Omnichannel_enable_department_removal` 否则 tooltip `Department_Removal_Disabled` `DepartmentItemMenu.tsx:28,85-86` | (1) 行消失 `[待渲染实测]`。(2) `DELETE /v1/livechat/department/:_id` `RemoveDepartmentModal.tsx:20`。(3) 刷新后不在。[读] | `_id` | `omni.manager.departments.archive` | `RemoveDepartmentModal.tsx:20` `[读]` |

本表数据行：**6**。计数见附录验算。

### 2.7 Custom_Fields `/omnichannel/customfields`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.customfields.open` | 打开自定义字段表 | 侧栏 `Custom_Fields` | `view-livechat-customfields` `sidebarItems.tsx:50` `CustomFieldsRoute.tsx:7-10` | (1) 表+`Create_custom_field` `[待渲染实测]`。(2) 列表 query。(3) URL。[读] | — | — | `CustomFieldsPage.tsx` `[读]` |
| `omni.manager.customfields.search` | 搜字段 | `Search` | 同 open | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text | `omni.manager.customfields.open` | `useCustomFieldsQuery` `[读]` |
| `omni.manager.customfields.create` | 新建字段 | `Create_custom_field` → 填 Field/Label/Scope/Visible/Searchable/Validation → `Save` | 同 open | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/custom-fields.save` `EditCustomFields.tsx:78`。(3) 刷新仍在。[读] | scope visitor/room | `omni.manager.customfields.edit` | `EditCustomFields.tsx:78` `[读]` |
| `omni.manager.customfields.edit` | 改字段 | 行 → 改 → `Save` | 同 open；预取 `GET /v1/livechat/custom-fields/:_id` `EditCustomFieldsWithData.tsx:13` | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/custom-fields.save` `EditCustomFields.tsx:78`。(3) 刷新仍在。[读] | `_id` | `omni.manager.customfields.create` | `EditCustomFieldsWithData.tsx:13` `[读]` |
| `omni.manager.customfields.delete` | 删字段 | 行 `Remove` 或编辑 `Delete` | 同 open | (1) toast `Custom_Field_Removed` `[待渲染实测]`。(2) `POST /v1/livechat/custom-fields.delete` `useRemoveCustomField.tsx:13`。(3) 刷新后不在。[读] | `_id` | `omni.manager.customfields.edit` | `useRemoveCustomField.tsx:13` `[读]` |

本表数据行：**5**。计数见附录验算。

### 2.8 Livechat_Triggers `/omnichannel/triggers`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.triggers.open` | 打开触发器表 | 侧栏 `Livechat_Triggers` | `view-livechat-triggers` `sidebarItems.tsx:56` `TriggersRoute.tsx:7-10` | (1) 表+`Create_trigger` `[待渲染实测]`。(2) 列表 GET。(3) URL。[读] | — | `omni.widget.trigger.start` | `TriggersPage.tsx` `[读]` |
| `omni.manager.triggers.create` | 新建触发器 | `Create_trigger` | `view-livechat-triggers` `TriggersRoute.tsx:7-10` | (1) 进 `/triggers/new` 空表单 `[待渲染实测]`。(2) 打开无写库；保存走 edit 的 `POST /v1/livechat/triggers`。(3) 未保存则刷新回列表。[读] | — | `omni.manager.triggers.edit` | `TriggersPage.tsx` `[读]` |
| `omni.manager.triggers.edit` | 保存触发器（条件/动作/Enabled/Run once） | 行或 new → `Enabled` `Run_only_once_for_each_visitor` `Condition` `Action`（`Send_a_message` / `Send_a_message_external_service`）→ `Save` | 同 open；外部服务动作无 **`livechat-enterprise`** 则 disabled+`Premium` `ActionForm.tsx:43,54,97` | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/triggers` `EditTrigger.tsx:81`；预取 `GET /v1/livechat/triggers/:_id`。(3) 刷新仍在。[读] | condition/action | `omni.manager.triggers.test` | `EditTrigger.tsx:81` `[读]` |
| `omni.manager.triggers.delete` | 删触发器 | 行 `Remove` → `Delete` | 同 open | (1) toast `Trigger_removed` `[待渲染实测]`。(2) `DELETE /v1/livechat/triggers/:_id` `TriggersRow.tsx:15,37`。(3) 刷新后不在。[读] | `_id` | `omni.manager.triggers.edit` | `TriggersRow.tsx:15-37` `[读]` |
| `omni.manager.triggers.test` | 测外部服务 URL | 动作=外部服务 → `Send_Test` | 同 edit + EE 动作可用 | (1) 测试结果 toast `[待渲染实测]`。(2) `POST /v1/livechat/triggers/external-service/test` `ActionExternalServiceUrl.tsx:32,93`。(3) 不改触发器文档。[读] | URL | `omni.manager.triggers.edit` | `ActionExternalServiceUrl.tsx:32-93` `[读]` |

本表数据行：**5**。计数见附录验算。

### 2.9 Livechat_Installation `/omnichannel/installation`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.installation.open` | 打开安装说明与 widget 代码 | 侧栏 `Livechat_Installation` | `view-livechat-installation` `sidebarItems.tsx:62`；路由无再检 | (1) 代码块 `[待渲染实测]`。(2) 无 REST（拼 `Site_Url`）。(3) 只读。[读] | `Site_Url` | `omni.widget.start` | `Installation.tsx:11-21` `routes.ts:108-111` `[读]` |
| `omni.manager.installation.copy` | 复制 embed 代码 | 页内 `Copy`（成功 `Copied`） | 同 open | (1) 剪贴板；按钮名变 `Copied` `[待渲染实测]`。(2) 无 HTTP。(3) 服务端无变化。[读] | snippet | `omni.manager.installation.open` | `Installation.tsx:35` `[读]` |

本表数据行：**2**。计数见附录验算。

### 2.10 Livechat_Appearance `/omnichannel/appearance`

页级保存整表，**不**逐字段拆行（对照 05 设置 OOS）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.appearance.open` | 打开外观手风琴（含 CE 禁用的 Premium 控件） | 侧栏 `Livechat_Appearance` | `view-livechat-appearance` `AppearancePageContainer.tsx:24-27` | (1) 段 `General` `Livechat_online` `Livechat_offline` `Livechat_registration_form` `Conversation_finished`；无 EE 时 `Livechat_hide_watermark`/`Livechat_background`/`Livechat_widget_position_on_the_screen`/`Livechat_hide_system_messages` disabled+`Premium` `[待渲染实测]`。(2) `GET /v1/livechat/appearance` `:15-20`。(3) 只读直到 Save。[读] | 许可证 **`livechat-enterprise`** `AppearanceForm.tsx:26` | `omni.widget.start` | `AppearancePageContainer.tsx` `AppearanceForm.tsx:70,84,106,130` `[读]` |
| `omni.manager.appearance.save` | 保存外观（含访客可否关聊） | 改字段（如 `Omnichannel_allow_visitors_to_close_conversation`）→ `Save_changes`；`Cancel` 重置 | 同 open；Premium 字段无许可证改不了 | (1) toast `Settings_updated` `[待渲染实测]`。(2) `POST /v1/livechat/appearance` `AppearancePage.tsx:49`。(3) 刷新后 widget 用新外观。[读] | 表单整包 | `omni.widget.close` | `AppearancePage.tsx:49-71` `[读]` |

本表数据行：**2**。计数见附录验算。

### 2.11 Webhooks `/omnichannel/webhooks`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.webhooks.open` | 打开 webhook 集成表 | 侧栏 `Webhooks` | `view-livechat-webhooks` `WebhooksPageContainer.tsx:32-35` | (1) `Webhook_URL` `Secret_token` `Send_request_on` `Http_timeout` `[待渲染实测]`。(2) `GET /v1/livechat/integrations.settings` `:21-28`。(3) 只读直到 Save。[读] | 8 个事件布尔 | — | `WebhooksPageContainer.tsx` `[读]` |
| `omni.manager.webhooks.save` | 保存 webhook | 改 URL/token/事件/超时 → `Save`；`Reset` 回表单 | 同 open | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/omnichannel/integrations` `WebhooksPage.tsx:100,123-135`。(3) 刷新后仍在。[读] | URL/token/events | `omni.manager.webhooks.test` | `WebhooksPage.tsx:100-135` `[读]` |
| `omni.manager.webhooks.test` | 对已存 URL 发测试 | `Send_Test`（`Sending`） | 同 open；须已有 URL | (1) toast `It_works` 或错 `[待渲染实测]`。(2) `POST /v1/livechat/webhook.test` `:101,145-147`。(3) 不改设置。[读] | 已存 URL | `omni.manager.webhooks.save` | `WebhooksPage.tsx:145-147` `[读]` |

本表数据行：**3**。计数见附录验算。

### 2.12 Business_Hours `/omnichannel/businessHours`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.businesshours.open` | 打开营业时间（关则引导去设置） | 侧栏 `Business_Hours` | 侧栏 `view-livechat-business-hours` `:80`；设置 `Livechat_enable_business_hours` 假 → `BusinessHoursDisabledPage` + `Enable_business_hours` 链到 `/admin/settings/Omnichannel` `BusinessHoursRouter.tsx:25-26`；单 BH 自动 `/businessHours/edit/default` `:19-22` | (1) 表或禁用页或单条编辑 `[待渲染实测]`。(2) 多 BH：`GET /v1/livechat/business-hours` `BusinessHoursTable.tsx:37`。(3) URL。[读] | 单/多模式 | `omni.agent.status.consequences` | `BusinessHoursRouter.tsx:19-26` `[读]` |
| `omni.manager.businesshours.create` | 新增多条营业时间 | 多 BH 列表 `New` | 多 BH 模式 | (1) `/businessHours/new` 表单 `[待渲染实测]`。(2) 保存见 save。(3) —。[读] | — | `omni.manager.businesshours.save` | `BusinessHoursMultiplePage.tsx:17-18` `[读]` |
| `omni.manager.businesshours.save` | 保存时区与开闭时间 | 编辑 `Timezone` `Open_days_of_the_week` `Open` `Close` → `Save` | 同 open 且功能开启；预取 `GET /v1/livechat/business-hour` `EditBusinessHoursWithData.tsx:16` | (1) toast `Business_hours_updated` `[待渲染实测]`。(2) `POST /v1/livechat/business-hours.save` `EditBusinessHours.tsx:43,74`。(3) 刷新后仍在；影响坐席能否 ON。[读] | days/hours | `omni.agent.status.consequences` | `EditBusinessHours.tsx:43-74` `[读]` |
| `omni.manager.businesshours.delete` | 删一条（非单 BH） | 表 `Remove` 或编辑 `Delete` | 非 single 模式 | (1) 行消失 `[待渲染实测]`。(2) `POST /v1/livechat/business-hours.remove` `useRemoveBusinessHour.tsx:11`。(3) 刷新后不在。[读] | `_id` | `omni.manager.businesshours.create` | `useRemoveBusinessHour.tsx:11` `[读]` |

本表数据行：**4**。计数见附录验算。

### 2.13 Security_and_privacy `/omnichannel/security-privacy`

页级保存 Contact_identification 组（不是 972 字段展开）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.security.open` | 打开联系人识别设置组 | 侧栏 `Security_and_privacy` | `view-privileged-setting` OR `edit-privileged-setting` OR `manage-selected-settings` `sidebarItems.tsx:86` `SecurityPrivacyPage.tsx:11-15`；设置定义挂 EE `livechat-enterprise`+`contact-id-verification` `ee/server/settings/contact-verification.ts:34-35` | (1) 组 `Contact_identification` 或 `NotAuthorizedPage` `[待渲染实测]`。(2) 设置 GET。(3) URL。[读] | 三设置 id | `omni.agent.unknown-contact` | `SecurityPrivacyPage.tsx:8-15` `[读]` |
| `omni.manager.security.save` | 保存拦截未知/未验证与校验策略 | 改 `Livechat_Block_Unknown_Contacts` / `Livechat_Block_Unverified_Contacts` / `Livechat_Require_Contact_Verification`（`Never`/`Once`/`On_All_Contacts`）→ Save | 同 open + 能编辑设置 | (1) toast `Settings_updated` `[待渲染实测]`。(2) `POST /v1/settings` 批量 `SettingsProvider.tsx:105,139`。(3) 刷新后策略仍在。[读] | 三 key | `omni.manager.security.open` | `SettingsGroupPage.tsx:63-84` `[读]` |

本表数据行：**2**。计数见附录验算。

### 2.14 Reports `/omnichannel/reports`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.reports.open` | 打开五张会话分布卡 | 侧栏 `Reports` | `view-livechat-reports` **且** **`livechat-enterprise`** `ReportsPage.tsx:15-19` `livechatSideNavItems.ts:8` 否则 `NotAuthorizedPage` | (1) 卡 Status/Channels/Departments/Tags/Agents `[待渲染实测]`。(2) `GET .../conversations-by-status` `-source` `-department` `-tags` `-agent`。(3) 只读。[读] | period | `omni.manager.analytics.open` | `ReportsPage.tsx` `[读]` |
| `omni.manager.reports.period` | 改报表周期 | 任一卡 PeriodSelector（today / this week / last 15 days / this month / last 6 months / this year） | 同 open | (1) 图/表变；空则 `No_data_available_for_the_selected_period`；错则 `Retry` `[待渲染实测]`。(2) 同上 GET+period。(3) 不落库。[读] | `constants.ts:44` | `omni.manager.reports.open` | `ReportCard.tsx:41-42` `[读]` |
| `omni.manager.reports.download` | 下载当前卡 CSV | 卡 → Download CSV | 同 open | (1) 文件下载 `[待渲染实测]`。(2) 同卡数据经 `useDefaultDownload`。(3) 服务端报表不变。[读] | 当前 period | `omni.manager.reports.period` | `ReportCard.tsx:41-42` `[读]` |

本表数据行：**3**。计数见附录验算。

### 2.15 Livechat_Monitors `/omnichannel/monitors`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.monitors.open` | 打开监控员表 | 侧栏 `Livechat_Monitors` | 侧栏 `manage-livechat-monitors` `:15`；容器只检 **`livechat-enterprise`** `MonitorsPageContainer.tsx:7-14`（**不再检权限**） | (1) 表或 `NotAuthorizedPage` `[待渲染实测]`。(2) `GET /v1/livechat/monitors` `MonitorsTable.tsx:50`。(3) URL。[读] | — | `omni.manager.units.edit` | `MonitorsPageContainer.tsx:7-14` `[读]` |
| `omni.manager.monitors.add` | 加监控员 | `Username` → `Add_monitor` | 同 open | (1) toast `Monitor_added` `[待渲染实测]`。(2) `POST /v1/livechat/monitors.create` `MonitorsTable.tsx:53,89`。(3) 刷新仍在。[读] | username | `omni.manager.monitors.remove` | `MonitorsTable.tsx:53-89` `[读]` |
| `omni.manager.monitors.remove` | 撤监控员 | `Remove` → `Delete` | 同 open | (1) toast `Monitor_removed` `[待渲染实测]`。(2) `POST /v1/livechat/monitors.delete` `:52,104`。(3) 刷新后不在。[读] | `_id` | `omni.manager.monitors.add` | `MonitorsTable.tsx:52-104` `[读]` |

本表数据行：**3**。计数见附录验算。

### 2.16 Units `/omnichannel/units`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.units.open` | 打开业务单元表 | 侧栏 `Units` | `manage-livechat-units` + **`livechat-enterprise`** `UnitsRoute.tsx:8-12` `livechatSideNavItems.ts:22` | (1) 表+`Create_unit` `[待渲染实测]`。(2) `GET /v1/livechat/units` `UnitsTable.tsx:43`。(3) URL。[读] | — | `omni.manager.departments.edit` | `UnitsPage.tsx` `[读]` |
| `omni.manager.units.search` | 搜单元 | `Search` | 同 open | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text | `omni.manager.units.open` | `UnitsTable.tsx:43` `[读]` |
| `omni.manager.units.create` | 新建单元 | `Create_unit` → 填 Name/Visibility/Departments/Monitors → `Save` | 同 open | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/units` `UnitEdit.tsx:50,117`。(3) 刷新仍在。[读] | depts/monitors | `omni.manager.units.edit` | `UnitEdit.tsx:50-117` `[读]` |
| `omni.manager.units.edit` | 改单元 | 行 → 改 → `Save` | 同 open；预取 unit+monitors+departments `UnitEditWithData.tsx:14-16` | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/units/:id`。(3) 刷新仍在。[读] | id | `omni.manager.monitors.open` | `UnitEdit.tsx:117` `[读]` |
| `omni.manager.units.delete` | 删单元 | 行 `Remove` 或编辑 `Delete` | 同 open | (1) toast `Unit_removed` `[待渲染实测]`。(2) `DELETE /v1/livechat/units/:id` `useRemoveUnit.tsx:13`。(3) 刷新后不在。[读] | id | `omni.manager.units.create` | `useRemoveUnit.tsx:13` `[读]` |

本表数据行：**5**。计数见附录验算。

### 2.17 Canned_Responses `/omnichannel/canned-responses`（EE 侧栏）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.canned.open` | 打开经理快捷回复表 | 侧栏 `Canned_Responses` | `manage-livechat-canned-responses` `CannedResponsesRoute.tsx:7-10` `livechatSideNavItems.ts:29`（路由**不**检 `canned-responses` 模块） | (1) 表+`Create_canned_response` `[待渲染实测]`。(2) `GET /v1/canned-responses` `CannedResponsesTable.tsx:59`。(3) URL。[读] | — | `omni.agent.canned.list` | `CannedResponsesPage.tsx` `[读]` |
| `omni.manager.canned.search` | 搜并按 Sharing/Created_by 筛 | `Search`；`Sharing`=`All`/`Private`/`Public`/`Department`；`Created_by` | 同 open；部门监控员不可进行全局行 `CannedResponsesTable.tsx:69-73` | (1) 行变 `[待渲染实测]`。(2) GET `scope`/`createdBy`。(3) 不写库。[读] | filters | `omni.manager.canned.open` | `CannedResponseFilter.tsx:24-45` `[读]` |
| `omni.manager.canned.create` | 经理创建快捷回复 | `Create_canned_response` → Shortcut/Message/Sharing/Department/Tags → `Save` | 同 open | (1) toast `[待渲染实测]`。(2) `POST /v1/canned-responses` `CannedResponseEdit.tsx:41`。(3) 刷新仍在。[读] | scope | `omni.agent.canned.create` | `CannedResponseEdit.tsx:41` `[读]` |
| `omni.manager.canned.edit` | 改快捷回复 | 行 → 改 → `Save` | 同 open + 预取 GET `/:_id` | (1) toast `[待渲染实测]`。(2) `POST /v1/canned-responses` `CannedResponseEdit.tsx:41`。(3) 刷新后正文仍在。[读] | `_id` | `omni.manager.canned.create` | `CannedResponsesTable.tsx:69-73` `[读]` |
| `omni.manager.canned.delete` | 删快捷回复 | 行 `Remove` 或编辑 `Delete` | 同 open | (1) toast `Canned_Response_Removed` `[待渲染实测]`。(2) `DELETE /v1/canned-responses/:_id` `useRemoveCannedResponse.tsx:15`。(3) 刷新后不在。[读] | `_id` | `omni.manager.canned.edit` | `useRemoveCannedResponse.tsx:15` `[读]` |

本表数据行：**5**。计数见附录验算。

### 2.18 Tags `/omnichannel/tags`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.tags.open` | 打开标签表 | 侧栏 `Tags` | `manage-livechat-tags` `TagsRoute.tsx:7-10` `livechatSideNavItems.ts:36` | (1) 表+`Create_tag` `[待渲染实测]`。(2) `GET /v1/livechat/tags` `TagsTable.tsx:49`。(3) URL。[读] | — | `omni.agent.room.edit` `omni.agent.close` | `TagsPage.tsx` `[读]` |
| `omni.manager.tags.search` | 搜标签 | `Search` | 同 open | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text | `omni.manager.tags.open` | `TagsTable.tsx:49` `[读]` |
| `omni.manager.tags.create` | 新建标签 | `Create_tag` → Name/Description/Departments → `Save` | 同 open | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/tags.save` `TagEdit.tsx:38,64`。(3) 刷新仍在。[读] | depts | `omni.manager.tags.edit` | `TagEdit.tsx:38-64` `[读]` |
| `omni.manager.tags.edit` | 改标签 | 行 → 改 → `Save` | 同 open；预取 `GET /v1/livechat/tags/:tagId` | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/tags.save` `TagEdit.tsx:38,64`。(3) 刷新仍在。[读] | tagId | `omni.manager.tags.create` | `TagEdit.tsx:64` `[读]` |
| `omni.manager.tags.delete` | 删标签 | 行 `Remove` 或编辑 `Delete` | 同 open | (1) toast `Tag_removed` `[待渲染实测]`。(2) `POST /v1/livechat/tags.delete` `useRemoveTag.tsx:11`。(3) 刷新后不在。[读] | tagId | `omni.manager.tags.create` | `useRemoveTag.tsx:11` `[读]` |

本表数据行：**5**。计数见附录验算。

### 2.19 SLA_Policies `/omnichannel/sla-policies`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.sla.open` | 打开 SLA 表 | 侧栏 `SLA_Policies` | `manage-livechat-sla` `SlaRoute.tsx:7-10` `livechatSideNavItems.ts:43` | (1) 表+`Create_SLA_policy` `[待渲染实测]`。(2) `GET /v1/livechat/sla` `SlaTable.tsx:46`。(3) URL。[读] | — | `omni.agent.room.edit` | `SlaPage.tsx` `[读]` |
| `omni.manager.sla.search` | 搜 SLA | `Search` | 同 open | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text | `omni.manager.sla.open` | `SlaTable.tsx:46` `[读]` |
| `omni.manager.sla.create` | 新建 SLA | `Create_SLA_policy` → Name/Description/Estimated wait time → `Save` | 同 open | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/sla` `SlaEdit.tsx:25-26,76`。(3) 刷新仍在。[读] | wait time | `omni.manager.sla.edit` | `SlaEdit.tsx:25-76` `[读]` |
| `omni.manager.sla.edit` | 改 SLA | 行 → 改 → `Save`/`Reset` | 同 open；预取 `GET /v1/livechat/sla/:slaId` `SlaEditWithData.tsx:15` | (1) toast `Saved` `[待渲染实测]`。(2) `PUT /v1/livechat/sla/:slaId`。(3) 刷新仍在。[读] | slaId | `omni.manager.sla.create` | `SlaEdit.tsx:25-76` `[读]` |
| `omni.manager.sla.delete` | 删 SLA | 行 `Remove` | 同 open | (1) toast `SLA_removed` `[待渲染实测]`。(2) `DELETE /v1/livechat/sla/:slaId` `RemoveSlaButton.tsx:14`。(3) 刷新后不在。[读] | slaId | `omni.manager.sla.create` | `RemoveSlaButton.tsx:14` `[读]` |

本表数据行：**5**。计数见附录验算。

### 2.20 Priorities `/omnichannel/priorities`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.manager.priorities.open` | 打开优先级表（无新建，只有改名） | 侧栏 `Priorities` | `manage-livechat-priorities` `PrioritiesRoute.tsx:7-12` `livechatSideNavItems.ts:50` | (1) 表 Icon/Name；脏时出现 `Reset` `[待渲染实测]`。(2) `GET /v1/livechat/priorities` `useOmnichannelPriorities`。(3) URL。[读] | — | `omni.agent.sidepanel.priority` | `PrioritiesPage.tsx` `[读]` |
| `omni.manager.priorities.edit` | 改一条优先级显示名 | 行 → 栏填 `Name` → `Save`（`Reset` 回该条默认） | 同 open | (1) toast `Priority_saved` `[待渲染实测]`。(2) `PUT /v1/livechat/priorities/:priorityId`（可选 `{reset:true}`）`PrioritiesPage.tsx:30,70`。(3) 刷新后名称仍在。[读] | priorityId | `omni.manager.priorities.reset` | `PrioritiesPage.tsx:30-70` `[读]` |
| `omni.manager.priorities.reset` | 重置全部优先级 | 列表 `Reset` → `Reset_priorities` 确认 | 同 open 且有脏数据 | (1) toast `Priorities_restored` `[待渲染实测]`。(2) `POST /v1/livechat/priorities.reset` `PrioritiesPage.tsx:31,43`。(3) 刷新后回出厂名。[读] | — | `omni.manager.priorities.edit` | `PrioritiesPage.tsx:31-43` `[读]` |

本表数据行：**3**。计数见附录验算。

## 3. 访客 widget `omni.widget.*`

独立 bundle：`packages/livechat`（`webpack.config.ts` → `dist/livechat/`）。挂载 `packages/livechat/src/entry.ts` → `components/App/App.tsx:176-184` 七条路由。主 SPA 不走这些 path。i18n：`packages/livechat/src/i18n/en.json`（嵌套 `translation`）。访客可感知动作**全部入行**。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `omni.widget.start` | 开始（或恢复）聊天会话 | 嵌入页打开 widget；或 trigger `start_chat`；或注册后自动 `/` | `config.enabled`；在线否则去 offline；GDPR 未同意先 `/gdpr`；需登记则 `/register` `App.tsx:83-100` | (1) `Chat` 路由 composer `[待渲染实测]`。(2) 首条消息前：`POST /v1/livechat/visitor` → `GET /v1/livechat/room` + 订阅流 `lib/room.ts:133-157`。(3) `localStorage` key `store`（token/user/room）；cookie `rc_rid`/`rc_token`。[读] | config；token | `omni.manager.installation.copy` | `App.tsx:176-184` `routes/Chat/index.tsx:62-107` `[读]` |
| `omni.widget.register` | 填登记表并开聊 | 自动 `/register` 或 footer `chat_now` → 填 `name`/`email`/`i_need_help_with`/自定义字段 → `start_chat` | `registrationForm` + 可见字段 + 无预登记 trigger + 无 token `App.tsx:94-100`；字段受 `nameFieldRegistrationForm`/`emailFieldRegistrationForm`；部门 `showOnRegistration` | (1) 提交后回 `/` Chat `[待渲染实测]`。(2) `POST /v1/livechat/visitor` `Register/index.tsx:75-108`。(3) `user`+customFields 进 store。[读] | depts；customFields | `omni.widget.start` `omni.manager.appearance.save` | `Register/index.tsx:75-199` `[读]` |
| `omni.widget.send` | 发送一条访客消息 | Chat composer `type_your_message_here` → aria `Send` 或 Enter | 已有 room；非登记拦截态 `ChatFooter.tsx:232-235` | (1) 消息进列表 `[待渲染实测]`。(2) `POST /v1/livechat/message`；输入中 `stream-notify-room` `{rid}/user-activity` `LivechatClientImpl.ts:242-248`。(3) 经 `room-messages` 流；刷新靠 history GET。[读] | rid；token | `omni.widget.emoji` | `ChatFooter.tsx:91-107,241-265` `[读]` |
| `omni.widget.upload` | 上传文件 | Plus aria `Add attachment` 或拖放 `drop_here_to_upload_a_file` | `settings.fileUpload` 否则 alert `file_upload_disabled` `Chat/index.tsx:138-141`；过大/类型错 `file_exceeds_allowed_size_of_size` / `media_types_not_accepted` | (1) 文件消息或 alert `[待渲染实测]`。(2) `POST /v1/livechat/upload/{rid}` header `x-visitor-token` `LivechatClientImpl.ts:290-313`。(3) 流推消息仍在。[读] | fileUpload | `omni.agent.file.send` | `routes/Chat/index.tsx:119-194` `[读]` |
| `omni.widget.emoji` | 插入 emoji | composer 笑脸（aria 硬编码 `Add emoji`）→ picker | 非登记拦截态 `ChatFooter.tsx:249-251` | (1) 文本插入 emoji；**无** HTTP `[待渲染实测]`。(2) 无。(3) 未发送则刷新消失。[读] | — | `omni.widget.send` | `ChatFooter.tsx:249-251` `ChatContent.tsx:83-93` `[读]` |
| `omni.widget.close` | 访客结束会话 | ⋮ → `finish_this_chat` → 确认 `are_you_sure_you_want_to_finish_this_chat` | `visitorsCanCloseChat`（外观 `Omnichannel_allow_visitors_to_close_conversation`）且已 connecting/有房 `ChatFooter.tsx:109-134,221-224` | (1) 进 finished 或清房 `[待渲染实测]`。(2) `POST /v1/livechat/room.close` `LivechatClientImpl.ts:226-230`。(3) room 清；可整 store 重置。[读] | visitorsCanCloseChat | `omni.agent.close` `omni.manager.appearance.save` | `ChatFooter.tsx:109-134` `[读]` |
| `omni.widget.transcript` | 关聊后要邮件副本 | 关聊后自动确认 `would_you_like_a_copy_of_this_chat_emailed` | `settings.transcript` + 访客有 email `lib/transcript.ts:7-64` | (1) 成功文案 `transcript_success` `[待渲染实测]`。(2) `POST /v1/livechat/transcript`。(3) 邮件在服务端发，widget 无副本文件。[读] | email | `omni.agent.transcript.email` | `lib/transcript.ts:7-64` `lib/room.ts:21-24,97-98` `[读]` |
| `omni.widget.department` | 切换部门 | Chat ⋮ → `change_department` → 选部门 → `start_chat`（确认 `are_you_sure_you_want_to_switch_the_department`）；`cancel` 回 `/` | `allowSwitchingDepartments` 且 >1 个 `showOnRegistration` 部门 `ChatFooter.tsx:159-214` | (1) 成功 alert `department_switched`；失败 `no_available_agents_to_transfer` `[待渲染实测]`。(2) 无房：`POST /v1/livechat/visitor`；有房：`POST /v1/livechat/visitor/department.transfer` + `loadConfig` `SwitchDepartment/index.tsx:56-98`。(3) `iframe.guest.department` 仍在。[读] | depts | `omni.widget.register` | `SwitchDepartment/index.tsx:56-137` `[读]` |
| `omni.widget.offline` | 离线留言 | 自动 `/leave-message`；填 `name`/`email`/`message`/`i_need_help_with` → `send` | `!config.online` `App.tsx:88-92`；`displayOfflineForm` 假则只文案 `offline_form_not_available` `LeaveMessage/index.tsx:170-175`；部门 `showOnOfflineForm` | (1) 成功 `ModalManager.alert`（`offlineSuccessMessage`）`[待渲染实测]`。(2) `POST /v1/livechat/offline.message` `:60-87`。(3) 不建 room。[读] | offline form 设置 | `omni.manager.appearance.open` | `LeaveMessage/index.tsx:60-181` `[读]` |
| `omni.widget.gdpr` | 同意数据处理 | 自动 `/gdpr` → `i_agree` | `forceAcceptDataProcessingConsent && !gdpr.accepted` `App.tsx:83-86` | (1) 同意后放行原路由 `[待渲染实测]`。(2) **无** HTTP。(3) `gdpr.accepted` localStorage。[读] | `dataProcessingConsentText` | `omni.widget.forget` | `GDPRAgreement/index.tsx:20-45` `[读]` |
| `omni.widget.forget` | 删除我的访客数据 | ⋮ → `forget_remove_my_data` → 确认 | `forceAcceptDataProcessingConsent` `ChatFooter.tsx:136-157,216-219` | (1) 进 finished；配置重载 `[待渲染实测]`。(2) `DELETE /v1/livechat/visitor/{token}` `LivechatClientImpl.ts:335-339`。(3) token/房被清。[读] | token | `omni.widget.gdpr` | `ChatFooter.tsx:136-157` `[读]` |
| `omni.widget.finished.new` | 结束后再开新聊天 | `/chat-finished` → `new_chat` | 关聊或删数据后自动到此 `ChatFinished/index.tsx:26-36` | (1) 回 `/`；可能再登记 `[待渲染实测]`。(2) 无（路由）。(3) 旧 room 已清。[读] | — | `omni.widget.start` | `ChatFinished/index.tsx:20-36` `[读]` |
| `omni.widget.trigger.start` | 从主动触发消息开聊 | `/trigger-messages` → footer `start_chat` | `config.online && config.enabled`；经理配置的 triggers | (1) `parentCall('openWidget')` 后进 Chat `[待渲染实测]`。(2) 触发动作可打外部服务；开聊同 start。(3) `renderedTriggers`。[读] | triggers | `omni.manager.triggers.edit` | `TriggerMessage/index.tsx:21-69` `[读]` |
| `omni.widget.minimize` | 最小化/恢复/弹出 | 头 `minimize_chat` / `restore_chat` / `expand_chat`；或浮钮 | `!triggered`；expand 还要 `!theme.hideExpandChat && !expanded && !windowed` `Header.tsx:123-134` | (1) 窗收起或 popout `[待渲染实测]`。(2) `parentCall`：`minimizeWindow` / `restoreWindow` / `openPopout`。(3) `minimized`/`undocked` localStorage。[读] | theme | `omni.widget.start` | `Header.tsx:110-134` `ScreenProvider.tsx:130-155` `[读]` |
| `omni.widget.sound` | 开关通知声 | 头铃 `enable_notifications` / `disable_notifications`（`sound_is_on`/`sound_is_off`） | 头可见即有 | (1) 铃状态切 `[待渲染实测]`。(2) 无 HTTP。(3) `sound.enabled` localStorage。[读] | sound | `omni.widget.send` | `Header.tsx:110-120` `ScreenProvider.tsx:122-128` `[读]` |

本表数据行：**15**。计数见附录验算。

## 分册 09 — Marketplace 产品交互

市场不再是「只开壳」。命名空间 `mkt.explore.*` / `mkt.installed.*` / `mkt.request.*` / `mkt.app.*`。不枚举第三方 App 设置 key。原文：[`09-marketplace-product.md`](09-marketplace-product.md)（[PR #8](https://github.com/jianwyao01/Rocket.Chat/pull/8)）。

## 1. 列表与侧栏 `mkt.explore.*` `mkt.installed.*` `mkt.request.*`

入口前缀：`顶栏左→Marketplace`（桌面非 mobile，`NavBarPagesGroup.tsx:16-29`）或已在市场侧栏。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mkt.explore.open` | 打开 Explore 目录列表 | `顶栏→Marketplace→Explore`；或侧栏 `Explore`；或 `/marketplace`（`all`→explore/list） | `access-marketplace` OR `manage-apps` `sidebarItems.tsx:16` `MarketplaceRouter.tsx:15`；两权皆无 `NotFoundPage` | (1) 侧栏头 `Marketplace` + Explore 卡列表 `[待渲染实测]`。(2) `GET /apps/marketplace?isAdminUser=` + 已安装编排 `useApps.ts:133-155`；流 `apps`（added/removed/updated/statusUpdate/settingUpdated）`:122-126`。(3) URL `/marketplace/explore/list`。[读] | `isAdminUser` 改变目录元数据 | `route.marketplace` `nav.marketplace.explore` | `sidebarItems.tsx:12-17` `AppsRoute.tsx:43-60` `[读]` |
| `mkt.explore.search` | 在当前 context 搜 App | Explore/Premium/Installed/Private/Requested 列表 → 搜索框 | 同该 context 进入权 | (1) 卡过滤 `[待渲染实测]`。(2) **无**新 HTTP（客户端滤缓存）。(3) 刷新回全量缓存。[读] | 已拉 apps | `mkt.explore.filter` | `AppsPageContent.tsx:29-30,112-122` `[读]` |
| `mkt.explore.filter` | 按价格/状态/分类/排序筛 | `Filter_By_Price` `Filter_By_Status` 分类；`Sort_By`（含 `Most_recent_updated` / `Least_recent_updated`） | 同 search | (1) 列表重排 `[待渲染实测]`。(2) 客户端。(3) 不落库。**这不是 Updates 页。**[读] | 筛选项 | `mkt.explore.search` `mkt.app.update` | `AppsPageContent.tsx:41-92` `[读]` |
| `mkt.explore.premium` | 打开 Premium 列表 | 侧栏 `Premium` | 同 Explore `sidebarItems.tsx:22` | (1) Premium 卡 `[待渲染实测]`。(2) 同市集 GET，context=`premium`。(3) `/marketplace/premium/list`。[读] | context | `mkt.explore.open` `mkt.app.subscribe` | `sidebarItems.tsx:18-23` `[读]` |
| `mkt.explore.docs` | 打开开发文档外链 | 侧栏 `Documentation` | 同 Explore `sidebarItems.tsx:49` | (1) 新窗口文档 `[待渲染实测]`。(2) 无 RC REST；URL `https://go.rocket.chat/i/developing-an-app` `lib/links.ts:8`。(3) 本工作区无状态。[读] | externalUrl | `mkt.explore.open` | `sidebarItems.tsx:44-50` `[读]` |
| `mkt.installed.open` | 打开已安装列表 | `顶栏→Marketplace→Installed` 或侧栏 `Installed` | 同 Explore `sidebarItems.tsx:28` | (1) 已安装行（可有更新蓝点）`[待渲染实测]`。(2) `getInstalledApps()` `useApps.ts:146-155`。(3) `/marketplace/installed/list`。[读] | installed apps | `nav.marketplace.installed` `mkt.app.enable` | `sidebarItems.tsx:24-29` `[读]` |
| `mkt.installed.private` | 打开私有 App 列表 | 侧栏 `Private_Apps` | 同 Explore `sidebarItems.tsx:41` | (1) 私有列表；无私有许可时计数 tooltip `Private_apps_premium_message` `[待渲染实测]`。(2) 已安装/私有编排。(3) `/marketplace/private/list`。[读] | private license | `mkt.installed.upload` | `sidebarItems.tsx:37-42` `MarketplaceHeader.tsx:49-56` `[读]` |
| `mkt.installed.upload` | 上传私有 .zip（或无许可时升级） | Private 列表头 `Upload_private_app` → 选文件 → `Install`；无许可则头 `Upgrade` | **`manage-apps`** `MarketplaceHeader.tsx:32-39,69`；`page=install` 无此权 → `NotAuthorizedPage` `AppsRoute.tsx:51`；私有许可不足走升级/限制模态 | (1) `App_Installation`/`Browse_Files`；成功后进已安装 `[待渲染实测]`。(2) `POST /apps` 或已存在则 `POST /apps/update` `useInstallApp.tsx:25-44,115-134`；覆盖确认 `AppUpdateModal` `Apps_Manual_Update_Modal_Title`。(3) 刷新后 Installed/Private 仍有。[读] | file；app count limit | `mkt.app.permissions` `mkt.app.install` | `AppInstallPage.tsx:34-63` `MarketplaceHeader.tsx:69-74` `[读]` |
| `mkt.installed.unlimited` | 打开「无限 App」upsell | Explore/Installed 头 `Enable_unlimited_apps`（非 private、未无限） | **`manage-apps`** `MarketplaceHeader.tsx:60-67` | (1) `UnlimitedAppsUpsellModal` `[待渲染实测]`。(2) 结账/许可流（外链）`[待渲染实测]`。(3) 买后限额变。[读] | `hasUnlimitedApps` | `mkt.app.enable` | `MarketplaceHeader.tsx:60-67` `[读]` |
| `mkt.installed.update-server` | 市集版本不受支持时去升级 RC | 头 `Update`（`Marketplace_Unsupported_Version`） | **`manage-apps`** `MarketplaceHeader.tsx:76` | (1) `UpdateRocketChatButton` 外链 `[待渲染实测]`。(2) 文档链，非 App API。(3) 本工作区 App 列表仍旧。[读] | 版本旗标 | — | `UpdateRocketChatButton.tsx:10` `[读]` |
| `mkt.request.open` | 打开他人请求安装的 App 列表 | `顶栏→Marketplace→Requested` 或侧栏 `Requested`（可有 badge） | **仅 `manage-apps`** `sidebarItems.tsx:35` `useMarketPlaceMenu.tsx:34-49` `AppsRoute.tsx:51`；仅有 `access-marketplace`：侧栏隐、进 URL 得 `NotAuthorizedPage` | (1) Requested 表；badge 来自 `GET /apps/app-request/stats` `MarketplaceRequestBadge.tsx:5-17` `useAppRequestStats.ts:5,15`（无 manage-apps 则 query disabled）。(2) 市集+请求数据。(3) `/marketplace/requested/list`。[读] | unseen count | `nav.marketplace.requested` `mkt.app.requests` | `sidebarItems.tsx:30-36` `[读]` |

本表数据行：**11**。计数见附录验算。

## 2. 每应用 `mkt.app.*`

主按钮文案由 `appButtonProps` 决定：非管理员只有 `Request`/`Requested`；管理员为 `Install` / `Update` / `Subscribe` / `See_Pricing` / `Try_now` / `Buy`（`helpers.ts:13-17,56-163`）。菜单装配 `useAppMenu.tsx:336-447`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mkt.app.details` | 打开某 App 详情（默认 Details tab） | 任一列表行/`Card[role=link]` `data-qa-type=app-row`（或 Enter） | 该 context 进入权 | (1) 页 `App_Info`；tab 至少 `Details`；状态 Tag `Enabled`/`Disabled`/`Trial_period` 等 `[待渲染实测]`。(2) App info（已在缓存或再拉）。(3) `/marketplace/{context}/info/{id}/…/details`。[读] | app id/version | `mkt.explore.open` | `AppRow.tsx:21-63` `AppDetailsPage.tsx:110` `[读]` |
| `mkt.app.install` | 安装免费/已购 App | 行 ⋮ `More_options`→`Install` 或详情主按钮 `Install` → 权限审 → 确认 | **`manage-apps`**（非管理员走 request）；已安装则无 Install `helpers.ts:87-88`；addon 缺失可 `Install_anyway` `AddonRequiredModal.tsx:41`；不兼容走 incompatible 模态；达限额 `AppInstallModal` `useAppInstallationHandler.tsx:130-141` | (1) 权限模态后列表出现该 App；状态 Enabled/Disabled `[待渲染实测]`。(2) `POST /apps` `orchestrator.ts:109-116` `useAppInstallationHandler.tsx:69-90`。(3) 刷新后 Installed 仍在。[读] | `isPurchased`；version | `mkt.app.permissions` `mkt.app.enable` | `useAppMenu.tsx:353-366` `helpers.ts:90-104` `[读]` |
| `mkt.app.subscribe` | 订阅 / 试用 / 看定价（付费订阅型） | ⋮ 或主按钮 `Subscribe` / `Try_now` / `See_Pricing` → iframe 结账；已订则菜单 `Subscription` 管理 | **`manage-apps`**；`purchaseType==='subscription'` `helpers.ts:107-136`；已订且 active/trialing 才有管理项 `useAppMenu.tsx:337-350` | (1) `IframeModal`；成功后可装 `[待渲染实测]`。(2) `GET /apps/buildExternalUrl` → iframe；`POST /apps/{id}/sync` `useAppMenu.tsx:156-183`。(3) 订阅状态在服务端，刷新仍在。[读] | pricingPlans；trialDays | `mkt.app.buy` `mkt.app.install` | `helpers.ts:107-136` `[读]` |
| `mkt.app.buy` | 一次性购买标价 App | ⋮ 或主按钮 `Buy` → iframe | **`manage-apps`**；`price>0` 且非订阅枝 `helpers.ts:140-153` | (1) 结账 iframe `[待渲染实测]`。(2) 同 purchase：`buildExternalUrl` + 随后 `POST /apps`。(3) `isPurchased` 刷新仍真。[读] | price | `mkt.app.subscribe` `mkt.app.install` | `helpers.ts:140-153` `[读]` |
| `mkt.app.request` | 非管理员请求安装 | 未装行 ⋮ 或详情主按钮 `Request`（已请求则 `Requested` disabled） | **`access-marketplace` 且无 `manage-apps`** `helpers.ts:56-67` `AppStatus.tsx:154-158`；管理员看不到 Request（他们直接 Install） | (1) 按钮变 `Requested`；管理员 Requested 列表可出现 `[待渲染实测]`。(2) iframe `buildExternalAppRequest`；`POST /apps/notify-admins` `useAppInstallationHandler.tsx:98-119`。(3) `requestedEndUser` 刷新仍在。[读] | app id | `mkt.request.open` `mkt.app.requests` | `helpers.ts:56-67` `useAppMenu.tsx:353-366` `[读]` |
| `mkt.app.enable` | 启用已装且当前禁用的 App | Installed/详情 ⋮ → `Enable` | **`manage-apps`**；`installed && !enabled`；enterprise-only 要工作区许可（除非 `migrated`）`useAppMenu.tsx:369-375`；达启用限额则 disabled `:377-381,426` | (1) Tag→`Enabled` `[待渲染实测]`。(2) `POST /apps/{id}/status` `{MANUALLY_ENABLED}` `:81,423-434`。(3) 刷新后仍启用。[读] | enabled count/limit | `mkt.app.disable` `mkt.installed.unlimited` | `useAppMenu.tsx:369-434` `[读]` |
| `mkt.app.disable` | 停用已启用 App | ⋮ → `Disable` | **`manage-apps`**；当前 enabled `:410-422` | (1) 确认后 Tag→`Disabled` `[待渲染实测]`。(2) `POST /apps/{id}/status` `{MANUALLY_DISABLED}` `:198-211`。(3) 刷新后仍停。[读] | app id | `mkt.app.enable` | `useAppMenu.tsx:198-211,410-422` `[读]` |
| `mkt.app.uninstall` | 卸载 App | ⋮ → `Uninstall` → 确认（订阅/祖父级另模态） | **`manage-apps`**；`installed` `:435-446`；订阅中：`Apps_Marketplace_Uninstall_Subscribed_App_Prompt`；`app.migrated`：`UninstallGrandfatheredAppModal` | (1) 行从 Installed 消失 `[待渲染实测]`。(2) `DELETE /apps/{id}` `:84,224-282`。(3) 刷新后 Installed 无此项；市集仍可再装。[读] | subscription/migrated | `mkt.app.install` | `useAppMenu.tsx:224-282,435-446` `[读]` |
| `mkt.app.update` | 更新到市集较新版本 | 行蓝点或 ⋮/`Update` 或详情主按钮 `Update` → 权限审 | **`manage-apps`**；`installed && version < marketplaceVersion` `useAppMenu.tsx:334,397-408` `helpers.ts:70-84`；不兼容走 warning 模态 | (1) 版本号升；蓝点消失 `[待渲染实测]`。(2) 权限后 `POST /apps/{id}` `useMarketplaceActions.ts:38-40` `orchestrator.ts:119-125`。(3) 刷新后 version 仍新。[读] | semver | `mkt.explore.filter` | `AppRow.tsx:49,78` `useAppMenu.tsx:323-408` `[读]` |
| `mkt.app.permissions` | 审阅并同意 App 权限（安装/更新门） | Install/Update/Purchase 确认后出现 `Apps_Permissions_Review_Modal_Title` → 看 `AppPermissionsList` → `Agree` | 管理员安装流（request 流也可经此）`useOpenAppPermissionsReviewModal.tsx:26` | (1) 模态关，安装/更新继续 `[待渲染实测]`。(2) 权限数组随 `POST /apps` 或 `POST /apps/{id}`。(3) 同意本身不单独落库。[读] | permissions | `mkt.app.install` `mkt.app.update` | `AppPermissionsReviewModal.tsx:18-31` `[读]` |
| `mkt.app.logs` | 打开已装 App 的 Logs tab | ⋮ `View_Logs`（非详情页）或详情 tab `Logs` | **`manage-apps`** + `installed` `AppDetailsPageTabs.tsx:64-68` `useAppMenu.tsx:384-396`；`access-marketplace` 无此 tab | (1) tab `Logs` 选中 `[待渲染实测]`。(2) `GET /apps/{id}/logs` `useLogs.ts:40-44`。(3) URL `tab=logs`。[读] | app id | `mkt.app.logs.filter` | `AppDetailsPageTabs.tsx:64-68` `[读]` |
| `mkt.app.logs.filter` | 筛/刷新/导出日志 | Logs → `Event` `Time` `Instance` `Severity`；`Refresh_logs`；`Export` | 同 logs；Instance 仅集群 `AppLogsFilter.tsx:82-91`；紧凑布局走 contextual `filter-logs` `AppDetailsPage.tsx:162-166` | (1) 手风琴条目变；Export 出 `ExportLogsModal` `[待渲染实测]`。(2) 再 `GET /apps/{id}/logs` 带 query；导出另 endpoint。(3) 筛不落库。[读] | startDate/endDate/instanceId/logLevel | `mkt.app.logs` | `AppLogsFilter.tsx:63-117` `[读]` |
| `mkt.app.settings` | 打开该 App 的设置表单（**不**逐字段） | 详情 tab `Settings` | **`manage-apps`** + installed + `settings` 非空 `AppDetailsPageTabs.tsx:59-63` | (1) `AppSettings` 手风琴+`AppSetting` 控件 `[待渲染实测]`。(2) 读 App info 内 settings。(3) URL `tab=settings`。[读] | ISettings | `mkt.app.settings.save` | `AppSettings/AppSettings.tsx:31-44` `[读]` |
| `mkt.app.settings.save` | 保存该 App 设置脏表单 | Settings 改字段 → footer `Save_changes`（`Cancel` 丢脏） | **`manage-apps`** + installed + dirty `AppDetailsPage.tsx:154-157,88-104`；无 manage-apps **无 footer** | (1) footer 消失；toast `[待渲染实测]`。(2) `POST /apps/{id}/settings` `orchestrator.ts:105-107`。(3) 刷新后值仍在。[读] | dirty settings | `mkt.app.settings` | `AppDetailsPage.tsx:88-158` `[读]` |
| `mkt.app.requests` | 看该 App 的安装请求并标已读 | 详情 tab `Requests` | **`manage-apps`** 且 context≠private `AppDetailsPageTabs.tsx:44-48` | (1) 请求列表；未读点仅管理员 `AppRequestItem.tsx:23` `[待渲染实测]`。(2) `GET /apps/{id}/app-requests`；`POST /apps/app-request/markAsSeen` `AppRequests.tsx:29-55`。(3) unseen 刷新后减。[读] | requests | `mkt.request.open` `mkt.app.request` | `AppDetailsPageTabs.tsx:44-48` `[读]` |
| `mkt.app.security` | 看权限/隐私/ToS 说明 | 详情 tab `Security` | `isSecurityVisible`（有 permissions/privacy/tos）`AppDetailsPageTabs.tsx:49-53`；**两权用户只要 tab 可见都能进** | (1) Security 面板 `[待渲染实测]`。(2) 只读详情字段。(3) URL `tab=security`。[读] | privacy/tos | `mkt.app.permissions` | `AppDetailsPageTabs.tsx:49-53` `[读]` |
| `mkt.app.releases` | 看版本发布说明 | 详情 tab `Releases` | context≠private `AppDetailsPageTabs.tsx:54-58` | (1) 版本列表 `[待渲染实测]`。(2) releases API。(3) URL `tab=releases`。[读] | versions | `mkt.app.update` | `AppDetailsPageTabs.tsx:54-58` `[读]` |
| `mkt.app.instances` | 看集群实例状态 | 详情 tab `Instances` | **`manage-apps`** + installed + `hasCluster` `AppDetailsPageTabs.tsx:69-73` | (1) 实例表 `[待渲染实测]`。(2) instances API。(3) URL `tab=instances`。[读] | cluster | `mkt.app.logs.filter` | `AppDetailsPageTabs.tsx:69-73` `[读]` |

本表数据行：**18**。计数见附录验算。

## 分册 10 — 消息时间线正文

时间线 **body** 可点控件（非 01 悬停工具栏）。命名空间 `tl.*`。只读指示见分册「验过无点击」，不计入功能行。原文：[`10-message-timeline.md`](10-message-timeline.md)（[PR #7](https://github.com/jianwyao01/Rocket.Chat/pull/7)）。

## 表 A. 身份 / 头像 / 显示名

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.identity.avatar | 点消息头像打开用户卡 | `房间时间线→非 sequential 消息行→左侧 MessageAvatar` | `!sequential && message.u.username && !selecting && showUserAvatar`（偏好 `displayAvatars`）`RoomMessage.tsx:124`。选择模式头像换成 checkbox。系统行头像 **不可点**（无 onClick）`SystemMessage.tsx:90`。线程预览头像 **不可点** `ThreadMessagePreview.tsx:117-121`。[读] | (1) 出现 User_card [待渲染实测] dialog name。(2) `GET /v1/users.info`（`user.card.open`）。(3) 卡片是 popover，刷新关闭。[读] | `message.u.username`；`displayAvatars`；`sequential`；`selecting` | user.card.open | `RoomMessage.tsx:124-134`；`ThreadMessage.tsx:50-60` |
| tl.identity.display-name | 点消息头显示名打开用户卡 | `房间时间线→非 sequential 消息行→MessageNameContainer`（`aria-label=displayName`，`id={mid}-displayName`） | `!sequential` 才渲染 `MessageHeader` `RoomMessage.tsx:140`。`useButtonPattern` + `openUserCard` `MessageHeader.tsx:38,53-58`。偏好 `hideUsernames` 只给列表加 class `hide-usernames`，header 仍挂载 [待渲染实测] 点空白名是否仍开卡。 | (1) 同 User_card。(2) 同 `GET /v1/users.info`。(3) 刷新关闭。[读] | `message.u`；`UI_Use_Real_Name`；`hideUsernames`；`useUserDisplayName` | user.card.open；tl.identity.avatar | `MessageHeader.tsx:51-72` |
| tl.foreword.dm-user | 从 DM 时间线顶端对方标签跳到其 DM | `房间时间线滚到顶（无更早历史）→RoomForeword→对方 Tag` | 仅 `isDirectMessageRoom` 且 `usernames` 去掉自己后非空；`hasMorePreviousMessages===false` 才渲染 Foreword `MessageList.tsx:284-290` `RoomForeword.tsx:14-26`。公开频道只显示只读文案 `Start_of_conversation`。 | (1) 导航到 `href=router.getRoomRoute('d',{name})` [待渲染实测] Tag role。(2) 路由无独立 REST；`GET /v1/users.info` 填显示名 `RoomForewordUsernameListItem.tsx:13`。(3) 刷新落在该 DM。[读] | `room.usernames` `room.t`；当前 `user.username` | user.card.open；user.action.direct-message | `RoomForewordUsernameList.tsx:14-18`；`RoomForewordUsernameListItem.tsx:17` |

本表数据行：**3**。计数见附录验算。

## 表 B. 正文 markdown / 提及 / 忽略

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.body.mention.user | 点 @用户提及打开该用户卡 | `消息行→正文 role=document aria-roledescription=message_body→MessageHighlight title=Mentions_user 或 Mentions_you` | 解析到 `mentions[]` 且非 `@all`/`@here`；`GazzodownText.tsx:61-76`。自己的提及 `variant=critical` `title=Mentions_you`，他人 `variant=other` `title=Mentions_user` `UserMentionElement.tsx:44-48`。`@all`/`@here` **高亮不可点**（无 clickable）。未解析到的 `@name` 纯文本。 | (1) User_card 出现 [待渲染实测]。(2) `GET /v1/users.info`。(3) 刷新关闭。[读] | `message.mentions`；`ownUserId`；偏好 `mentionsWithSymbol` | user.card.open | `UserMentionElement.tsx:15-55`；`GazzodownText.tsx:78-90` |
| tl.body.mention.channel | 点 #频道提及跳进该房间 | `消息行→正文→MessageHighlight title=Mentions_channel` | `channels[]` 命中 `name` `GazzodownText.tsx:96`。未解析则纯文本 `#name`。 | (1) 离开当前时间线进入目标房间 [待渲染实测] highlight role。(2) 已订阅则本地路由；否则 `GET /v1/rooms.info` `useGoToRoom.ts:30`。embedded 另 `fireGlobalEvent('click-mention-link')`。(3) 刷新落在目标房。[读] | `message.channels`；embedded layout | tl.discussion.open | `ChannelMentionElement.tsx:14-29`；`GazzodownText.tsx:100-115` |
| tl.body.link.external | 点正文外链在新标签打开 | `消息行→正文→a[title=href][target=_blank]` | `isExternal(sanitizedHref)` `LinkSpan.tsx:47`。href 经 `sanitizeUrl`。 | (1) 新标签打开 URL；时间线不换页。(2) 无 RC endpoint。(3) 无本地状态。[读] | `message.md` 链接节点 | tl.oembed.open | `LinkSpan.tsx:47-52` |
| tl.body.link.internal | 点正文站内链同标签跳转 | `消息行→正文→a[title=Go_to_href]` | 非 external `LinkSpan.tsx:55-58`。 | (1) 同标签导航 [待渲染实测] 是否进房间/管理页。(2) 视 href；无专用 REST。(3) 刷新保留新 URL。[读] | 同左 | msg.jump | `LinkSpan.tsx:55-58` |
| tl.body.image.markdown | 点 markdown 行内图打开原图 | `消息行→正文→a[title=alt]→img` | markdown `![alt](url)` `ImageElement.tsx:53-56`。走 `<a target=_blank>`，**不**进房间图库。 | (1) 新标签打开图片 URL。(2) 无 RC endpoint。(3) 无。[读] | md IMAGE 节点 | tl.attach.image.lightbox | `ImageElement.tsx:49-56` |
| tl.body.spoiler | 点模糊剧透揭开正文 | `消息行→正文→role=button aria-label=Spoiler_hidden_activate_to_reveal`（或 i18n `Spoiler_hidden_activate_to_reveal`） | spoiler markup。揭开后不可再藏 `SpoilerSpan.tsx:72-79`。 | (1) `aria-expanded` 从 false 消失，模糊滤镜去掉，SR 文案消失 [待渲染实测] 揭开后 role。(2) 无 REST。(3) 刷新恢复模糊。[读] | md SPOILER | tl.ignored.reveal | `SpoilerSpan.tsx:52-79` |
| tl.body.code.copy | 复制围栏代码块 | `消息行→正文→role=region 代码块上 title=Copy` | 仅 fenced code。 | (1) toast `Copied`（失败 `Failed_to_copy`）。(2) **无** HTTP；`navigator.clipboard.writeText` `CodeBlock.tsx:76-79`。(3) 服务器无变化。[读] | 代码块文本 | msg.copy.text | `CodeBlock.tsx:76-94` |
| tl.ignored.reveal | 展开被忽略用户的消息正文 | `消息行→role=button 文案 Message_Ignored`（chevron-left） | `ignoredUser`（`subscription.ignored` 含作者）或 `message.ignored`，且尚未 toggle `RoomMessage.tsx:78-79,141-144`。线程预览忽略只显示文本、**无**揭示按钮 `ThreadMessagePreview.tsx:94-96,127-128`。 | (1) `Message_Ignored` 按钮消失，正文/附件出现 [待渲染实测]。(2) 无 REST（本地 `useToggle`）。(3) 刷新回到忽略占位。[读] | `subscription.ignored`；`message.ignored` | user.action.ignore | `IgnoredContent.tsx:23-31` |

本表数据行：**8**。计数见附录验算。

## 表 C. 反应条（消息体，非工具栏）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.reaction.toggle | 点已有 emoji 芯片切换自己的反应 | `消息行→反应条→aria-label=React_with__reaction__ 的芯片` | `message.reactions` 至少 1 个 key `RoomMessageContent.tsx:107`。mutation 要求已登录 `useToggleReactionMutation.ts:19-20`。**无** omnichannel 门（与工具栏 `msg.reaction.add` 不同）。自己已反应则 `mine` 样式。 | (1) 该芯片 `mine`/计数变化或整芯片消失 [待渲染实测] toolbar role+name。(2) `POST /v1/chat.react` `{messageId, reaction}` `useToggleReactionMutation.ts:15,23`。(3) 刷新后 `message.reactions` 仍反映 toggl 结果。[读] | `message._id` `reactions`；`uid`；endpoint `POST /v1/chat.react` | msg.reaction.add | `Reactions.tsx:29-39`；`Reaction.tsx:38-42` |
| tl.reaction.add | 从消息体「+」打开 picker 再加反应 | `消息行→反应条→title=Add_Reaction` | 反应条已渲染（已有 reactions）；`uid` 才真正打开 picker `MessageListProvider.tsx:111-116`。未登录 `useOpenEmojiPicker` 为空函数。 | (1) emoji picker 出现；选后芯片出现/计数+1 [待渲染实测] picker role。(2) `POST /v1/chat.react` `{messageId, reaction: emoji}` `:115`。(3) 刷新后该 emoji 仍在 `reactions`。[读] | 同 tl.reaction.toggle；`chat.emojiPicker` | msg.reaction.add | `Reactions.tsx:41`；`MessageListProvider.tsx:111-116` |
| tl.reaction.hover-users | 悬停芯片看谁反应了（不是 More→Reactions 模态） | `消息行→反应条→把指针停在芯片上`（mouseenter，不是 click） | 芯片存在。`showRealName` 且还有他人反应时 `GET /v1/chat.getMessage` 取 `reactions[].names` `ReactionTooltip.tsx:48-72`。仅自己反应则不请求。 | (1) tooltip 文案 `You_reacted_with` / `You_and_users_Reacted_with` / `Users_reacted_with` / `*_and_more_*` [待渲染实测] tooltip role；**不会**出现 `Users_reacted` 模态。(2) 需要真名时 `GET /v1/chat.getMessage` `{msgId}`。(3) tooltip 随 mouseleave 关；无持久状态。[读] | `message.reactions`；`UI_Use_Real_Name` | msg.reaction.list | `Reaction.tsx:45-64`；`ReactionTooltip.tsx:38-96` |

本表数据行：**3**。计数见附录验算。

## 表 D. 线程 / 讨论 / 广播

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.thread.view | 从主消息「View_thread」打开线程栏 | `房间时间线→线程主消息（isThreadMainMessage）→MessageMetricsReply 文案 View_thread` | `chat` 存在且 `isThreadMainMessage` `RoomMessageContent.tsx:109`。`__count__replies` / `__count__replies__date__` 标签 **不可点** `ThreadMetrics.tsx:55-61`。 | (1) URL `tab=thread` `context=mid`；线程 contextual bar 出现 [待渲染实测] 栏 name。(2) 无 REST；`router.navigate` `useGoToThread.ts:16-23`。(3) 刷新若 URL 仍含 tab/context 则栏仍在。[读] | `message.tcount` `tlm` `replies`；`Threads_enabled`（主消息字段仍在） | msg.thread.reply | `ThreadMetrics.tsx:43-52` |
| tl.thread.follow | 从线程 metrics 铃铛跟随/取消跟随 | `线程主消息→title=Following 或 Not_following 的铃铛` | 线程 metrics 已渲染。铃铛旁未读 badge 看 `unread`/`mention`/`all`（来自 `subscription.tunread*`）。 | (1) title 在 Following↔Not_following 间切换；toast 错时才出 [待渲染实测] 成功无 toast。(2) follow `POST /v1/chat.followMessage` `{mid}`；unfollow `POST /v1/chat.unfollowMessage` `{mid}` `useToggleFollowingThreadMutation.ts:19-31`。(3) 刷新后 `replies` 含/不含自己。[读] | `message.replies` `_id` `rid`；`uid` | msg.thread.follow；msg.thread.unfollow | `ThreadMetricsFollow.tsx:39-45` |
| tl.thread.preview.open | 点主列表线程回复预览进入线程 | `房间时间线→线程预览行 role=link` | `isThreadMessage` 且 `!isSelecting`。非 sequential：跳到父消息；sequential：跳到本回复 `ThreadMessagePreview.tsx:61-67`。选择模式改为勾选。 | (1) 同线程栏；search 可带 `?msg=`。(2) 无 REST；`useGoToThread`。父消息 `useParentMessage` 可能 `GET /v1/chat.getMessage`。(3) URL 保留则刷新仍在线程。[读] | `message.tmid` `_id` `rid` | msg.thread.reply；msg.jump | `ThreadMessagePreview.tsx:59-81` |
| tl.discussion.open | 从讨论计数/Reply 进入讨论房 | `房间时间线→带 drid 的消息→MessageMetricsReply 文案 message_counter 或 Reply` | `isDiscussionMessage` = `!!message.drid` `IMessage.ts:328`。含服务端 `t=discussion-created`（客户端未当系统消息）。`No_messages_yet` 时钟标签 **不可点** `DiscussionMetrics.tsx:33-36`。 | (1) 进入讨论房间 [待渲染实测] Reply 按钮 role。(2) 已订阅则路由；否则 `GET /v1/rooms.info` `useGoToRoom.ts:22-34`。(3) 刷新落在讨论房。[读] | `message.drid` `dcount` `dlm` | msg.discussion.start | `DiscussionMetrics.tsx:30-32`；`createDiscussion.ts:26-36` |
| tl.broadcast.reply | 广播房点他人消息的 Reply 去 DM 引用 | `广播房间时间线→他人消息行→MessageMetricsReply 文案 Reply` | `subscription.broadcast` 且 `message.u._id !== uid` 且作者有 username `RoomMessageContent.tsx:134`。自己的消息 **无** 此钮。 | (1) 路由到与作者的 DM，composer 带 `?reply=mid` [待渲染实测] 引用条。(2) 点击无 REST；`roomCoordinator.openRouteLink('d',{name:username},{reply})` `replyBroadcast.ts:9-16`。(3) 刷新若 URL 仍含 reply 则引用仍在。[读] | `subscription.broadcast`；`message.u.username` `_id` | msg.reply.dm；msg.quote | `BroadcastMetrics.tsx:17-26` |

本表数据行：**5**。计数见附录验算。

## 表 E. 附件 / 引用 / 位置

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.attach.collapse | 折叠/展开附件或预览内容 | `消息行→附件标题行 title=Collapse 或 Uncollapse` | 文件附件走 `MessageCollapsible`；Slack 式 default 走 `DefaultAttachment`。初始 `useAttachmentIsCollapsedByDefault \|\| attachment.collapsed` `useCollapse.ts:6-7`。 | (1) 图标 chevron-down↔chevron-left；子内容消失/出现 [待渲染实测] button name。(2) 无 REST。(3) 刷新按默认折叠设置重算。[读] | 偏好 collapse-by-default；`attachment.collapsed` | tl.url.collapse | `CollapsibleContent.tsx:8-10`；`MessageCollapsible.tsx:28` |
| tl.attach.download | 下载附件文件 | `消息行→附件标题行 title=Download`（disabled 时 `Download_Disabled`） | `hasDownload && link`。加密 `href` 含 `/file-decrypt/` 走 SW `AttachmentDownload.tsx:10-16`。 | (1) 浏览器下载或 SW 解密下载 [待渲染实测]。(2) GET `href?download`；加密走 service worker。(3) 消息不变；本地多一个文件。[读] | `title_link` `title_link_download` | msg.webdav.save | `AttachmentDownloadBase.tsx:12-21` |
| tl.attach.image.load | 未自动载图时点「Click_to_load」 | `消息行→图片附件→文案 Click_to_load` | `useAttachmentAutoLoadEmbedMedia()` 为假时 `loadImage===false` `useLoadImage.ts:4-6`。 | (1) 占位换成 `<img class=gallery-item>`。(2) 无 REST（随后 img GET 媒体 URL）。(3) 刷新若偏好仍关则再出现 Click_to_load。[读] | `Auto_Load_Images` / autoLoadEmbedMedia | tl.attach.image.lightbox | `Load.tsx:22-26` |
| tl.attach.image.retry | 图片加载失败后重试 | `消息行→图片附件→文案 Retry` | `img.onError` 后 `AttachmentImage.tsx:62-63`。 | (1) Retry 消失，再请求 img。(2) GET 媒体 URL。(3) 仍失败则 Retry 再出现。[读] | 媒体 URL | tl.attach.image.load | `Retry.tsx:21-25` |
| tl.attach.image.lightbox | 点缩略图打开房间图库 | `消息行→图片附件→img.gallery-item` | 图已加载（非 Load/Retry）。`ImageGalleryProvider` 委托 click `classList.contains('gallery-item')`。引用块内 `.rcx-attachment__details` 改走单图 `ImageGalleryProvider.tsx:19-27`。 | (1) `role=dialog` `aria-label=Image_gallery` `aria-modal=true` 出现 [读]。(2) 房间图库 `GET /v1/rooms.images` `{roomId, startingFromId, offset, count:5}` `useImagesList.ts:10-21`；单图无该 GET。(3) 关图库后不持久；刷新不自动开。[读] | `message.files[0]._id`；房间 rid | tl.gallery.close | `AttachmentImage.tsx:81-85`；`ImageGalleryProvider.tsx:16-36` |
| tl.gallery.close | 关闭图片图库 | `图库 dialog→aria-label=Close_gallery`；或点 overlay；或 Esc | 图库已开 `ImageGallery.tsx:193`。 | (1) dialog 消失。(2) 无新 REST。(3) 无。[读] | — | tl.attach.image.lightbox | `ImageGallery.tsx:159-167,135,193` |
| tl.gallery.zoom-in | 图库放大 | `图库→title=Zoom_in` | 图库已开。 | (1) `data-qa-zoom-scale` 增大 [待渲染实测]。(2) 无 REST。(3) 关闭后重置。[读] | swiper zoom | tl.gallery.zoom-out | `ImageGallery.tsx:158` |
| tl.gallery.zoom-out | 图库缩小 | `图库→title=Zoom_out` | `zoomScale===1` 时 disabled `ImageGallery.tsx:156`。 | (1) scale 减小。(2) 无 REST。(3) 无。[读] | swiper zoom | tl.gallery.resize | `ImageGallery.tsx:148-156` |
| tl.gallery.resize | 图库恢复 1:1 | `图库→title=Resize` | 仅 `zoomScale!==1` 才渲染 `ImageGallery.tsx:137-146`。 | (1) scale 回到 1，Resize 钮消失。(2) 无 REST。(3) 无。[读] | swiper zoom | tl.gallery.zoom-in | `ImageGallery.tsx:137-146` |
| tl.gallery.next | 图库下一张 | `图库→aria-label=Next_image`（class `rcx-swiper-prev-button`，与 chevron-right 绑在一起） | 多图房间图库。到开头会 `onReachBeginning→fetchNextPage`。按钮名与 prev class **对调** [待渲染实测] 哪边是下一张。 | (1) 幻灯片切换；可能再拉页。(2) 可能再 `GET /v1/rooms.images`。(3) 关后不持久。[读] | `GET /v1/rooms.images` | tl.gallery.prev | `ImageGallery.tsx:169-181,200` |
| tl.gallery.prev | 图库上一张 | `图库→aria-label=Previous_image`（class `rcx-swiper-next-button`） | 同左。 | (1) 幻灯片切换。(2) 通常无新 GET。(3) 无。[读] | 同左 | tl.gallery.next | `ImageGallery.tsx:176-181` |
| tl.attach.audio.toggle | 播放/暂停音频附件 | `消息行→音频附件→AudioPlayerControls 播放钮` | 音频 file attachment。共享 `MediaPlayerProvider`：点另一条会切轨。 | (1) `isPlaying` 切换 [待渲染实测] 控件 name。(2) GET 音频流 URL；无 chat REST。(3) 播放位置不随刷新持久。[读] | `audio_url`；`source.mid` | composer.action.audio-message | `AudioAttachment.tsx:75-80` |
| tl.attach.audio.seek | 拖进度条跳到指定时间 | `消息行→音频附件→进度条` | 同音频附件。未激活轨上 seek 会先 `play(track)` `AudioAttachment.tsx:81`。 | (1) currentTime 变。(2) 无 REST。(3) 不持久。[读] | 同左 | tl.attach.audio.toggle | `AudioAttachment.tsx:81` |
| tl.attach.audio.rate | 循环切换音频倍速 | `消息行→音频附件→倍速控件` | 同音频附件。 | (1) playbackSpeed 循环 [待渲染实测] 显示值。(2) 无 REST。(3) 不持久。[读] | MediaPlayerProvider | tl.attach.audio.toggle | `AudioAttachment.tsx:82` |
| tl.attach.video.controls | 用原生 video 控件播/暂停/拖动 | `消息行→视频附件→video[controls]` | 视频 file attachment。 | (1) 浏览器原生控件 [待渲染实测] 无 RC i18n name。(2) GET 视频流。(3) 不持久。[读] | `video_url` `video_type` | tl.attach.audio.toggle | `VideoAttachment.tsx:32-34` |
| tl.attach.file.open | 打开通用文件/PDF | `消息行→GenericFile 标题 MessageGenericPreviewTitle` | `title_link` 存在。桌面 `openDocumentViewer`：PDF 可 inline；加密 PDF 超大小则改下载 `useOpenEncryptedPdf.ts:36-39`。无桌面 API 则当普通链。失败 toast `FileUpload_Error_Trying_To_Open_File`。 | (1) 桌面 PDF 查看器或浏览器打开/下载 [待渲染实测]。(2) GET file URL（`contentDisposition=inline` 或 SW decrypt）。(3) 文件仍在消息上。[读] | `format` `title_link` `size`；桌面 API | tl.attach.download | `GenericFileAttachment.tsx:42-72,94-96` |
| tl.quote.jump | 从引用附件跳回原消息 | `消息行→引用块→title=Jump_to_message 的 jump 图标` | `attachment.message_link` `QuoteAttachment.tsx:67`。 | (1) 浏览器跟随 href（通常 `?msg=`）[待渲染实测] 是否高亮。(2) 可能 `GET /v1/chat.getMessage`（跳转加载）。(3) URL 保留则刷新再跳。[读] | `attachment.message_link` | msg.jump | `AttachmentMessageLink.tsx:11`；`QuoteAttachment.tsx:67` |
| tl.quote.author | 点引用作者名打开 author_link | `消息行→引用块→作者名` | `attachment.author_link` 才渲染为 `a[target=_blank]` `QuoteAttachment.tsx:59-62`。 | (1) 新标签打开 author_link。(2) 无 RC endpoint。(3) 无。[读] | `author_link` `author_name` | tl.identity.display-name | `QuoteAttachment.tsx:59-63` |
| tl.quote.time | 点引用时间戳走 message_link | `消息行→引用块→AttachmentAuthorTimestamp` | `attachment.ts && message_link` `QuoteAttachment.tsx:64-66`。blockquote 本身 **不可点**（仅 hover 样式）。 | (1) 同跳转 href。(2) 同 tl.quote.jump。(3) 同。[读] | `message_link` `ts` | tl.quote.jump | `QuoteAttachment.tsx:64-66` |
| tl.attach.default.title | 点 Slack 式附件标题外链 | `消息行→DefaultAttachment 标题 a` | `attachment.title_link` `DefaultAttachment.tsx:60-66`。 | (1) 新标签打开 title_link。(2) 无 RC endpoint。(3) 无。[读] | `title_link` | tl.body.link.external | `DefaultAttachment.tsx:58-71` |
| tl.attach.default.author | 点 Slack 式附件作者外链 | `消息行→DefaultAttachment 作者名` | `author_link` `DefaultAttachment.tsx:46-52`。 | (1) 新标签打开 author_link。(2) 无 RC endpoint。(3) 无。[读] | `author_link` | tl.quote.author | `DefaultAttachment.tsx:43-57` |
| tl.attach.action.url | 点废弃 action attachment 的 URL 按钮 | `消息行→附件按钮 role=link` | `isActionAttachment` 且 `type=button` 且有 `url`。注释 **DEPRECATED** `DefaultAttachment.tsx:103-104`。 | (1) `useExternalLink` 打开 url。(2) 无 RC endpoint。(3) 无。[读] | `actions[].url` `text` | tl.body.link.external | `ActionAttachtment.tsx:22-27` |
| tl.attach.action.msg | 点 action attachment 向 composer/聊天回消息 | `消息行→附件 Button（无 url）` | `msg_in_chat_window` 且 `msg`/`msgId`。`processingType` 默认 `sendMessage`。 | (1) 发送一条消息 / composer 填入 / 引用条出现，视 `sendMessage`/`respondWithMessage`/`respondWithQuotedMessage`。(2) send 走 `chat.flows.sendMessage` → `POST /v1/chat.sendMessage`；quote 可能 `GET /v1/chat.getMessage` `usePerformActionMutation.ts:26-41`。(3) send 刷新仍在；quote 未发则丢失。[读] | `msg` `msgId` `msg_processing_type` | composer.send；msg.quote | `ActionAttachmentButton.tsx:27-40` |
| tl.location.open | 点位置附件打开 Google 地图导航 | `消息行→img alt=Shared_Location` 或文字链 `Shared_Location` | `message.location` 有 lat/lng `Location.tsx:10-16`。有 `MapView_GMapsAPIKey` 且静态图加载成功走图片；否则 fallback 文字链。 | (1) 新标签 `https://maps.google.com/maps?daddr=lat,lng`。(2) 静态图 GET maps.googleapis.com；无 RC endpoint。(3) 无。[读] | `MapView_GMapsAPIKey`；`location.coordinates` | composer.action.share-location | `MapViewImage.tsx:13-15`；`MapViewFallback.tsx:15-16` |

本表数据行：**24**。计数见附录验算。

## 表 F. URL unfurl / oembed

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.url.collapse | 折叠/展开链接预览 | `消息行→文案 Link_Preview 旁 title=Collapse/Uncollapse` | `API_Embed`（`apiEmbedEnabled`）且 `message.urls` 能抽出 preview `RoomMessageContent.tsx:94` `MessageListProvider.tsx:46`。headers 预览初始折叠当 `!autoLoadEmbedMedia` `UrlPreview.tsx:12`。oembed 走 `MessageCollapsible`。 | (1) 预览主体消失/出现。(2) 无 REST（meta 已在消息上）。(3) 刷新按 autoLoad 重算。[读] | `API_Embed`；`message.urls`；autoLoadEmbedMedia | tl.attach.collapse | `UrlPreview.tsx:17-21`；`OEmbedCollapsible.tsx:14-16` |
| tl.url.image.lightbox | 点 headers 图片预览开单图灯箱 | `消息行→Link_Preview 展开→img.preview-image` | headers content-type `image/*` `UrlPreviews.tsx:57-58`。 | (1) 单图 `ImageGallery`（`setSingleImageUrl`）[待渲染实测] 与房间图库是否同一 dialog name。(2) 无 `rooms.images`。(3) 关后不持久。[读] | `urls[].headers.contentType` | tl.attach.image.lightbox | `UrlImagePreview.tsx:11`；`ImageGalleryProvider.tsx:22-23` |
| tl.url.audio | 播放 URL 音频预览 | `消息行→Link_Preview 展开→AudioPlayer` | headers `audio/*`。 | (1) 原生/Fuselage 播放器 [待渲染实测] name。(2) GET 该 URL。(3) 不持久。[读] | `urls[].url` | tl.attach.audio.toggle | `UrlAudioPreview.tsx:7` |
| tl.url.video | 播放 URL 视频预览 | `消息行→Link_Preview 展开→video[controls]` | headers `video/*`。 | (1) 原生 video 控件。(2) GET 该 URL。(3) 不持久。[读] | 同左 | tl.attach.video.controls | `UrlVideoPreview.tsx:4-8` |
| tl.oembed.open | 打开 oembed 标题/封面外链 | `消息行→oembed 标题 MessageGenericPreviewTitle` 或封面 `ExternalLink` | `urls[].meta` 能 `normalizeMeta` 且 `isValidPreviewMeta`。type `rich`/`video` 还嵌入净化后的 iframe `OEmbedHtmlPreview.tsx:21`。type `photo` 封面图 **无** click handler `OEmbedImagePreview.tsx:8`。 | (1) 新标签打开 `meta` url；或 iframe 内交互 [待渲染实测] iframe 可访问名。(2) 无 RC endpoint。(3) 无。[读] | `urls[].meta` | tl.body.link.external | `OEmbedPreviewContent.tsx:22-25`；`OEmbedLinkPreview.tsx:10-12` |

本表数据行：**5**。计数见附录验算。

## 表 G. 系统消息（共享动作）

已注册 `system:true` 类型（动作相同，不拆 id）：`uj` `ul` `r` `au` `ui` `uir` `added-user-to-team` `ru` `removed-user-from-team` `ult` `user-converted-to-team` `user-converted-to-channel` `user-removed-room-from-team` `user-deleted-room-from-team` `user-added-room-to-team` `ujt` `ut` `wm` `rm` `user-muted` `user-unmuted` `user-banned` `user-unbanned` `subscription-role-added` `subscription-role-removed` `room-archived` `room-unarchived` `room-removed-read-only` `room-set-read-only` `room-allowed-reacting` `room-disallowed-reacting` `room_changed_privacy` `room_changed_topic` `room_changed_avatar` `room_changed_announcement` `room_changed_description` `message_pinned` `abac-removed-user-from-room`；E2EE：`room_e2e_enabled` `room_e2e_disabled` `message_pinned_e2e`；omnichannel：`omnichannel_placed_chat_on_hold` `omnichannel_on_hold_chat_resumed` `omnichannel_priority_change_history` `omnichannel_sla_change_history`；livechat：`livechat-started` `livechat-close` `livechat_video_call` `livechat_navigation_history` `livechat_transfer_history` `livechat_transfer_history_fallback` `livechat_transcript_history`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.sys.actor | 点系统消息作者名打开用户卡 | `系统行→MessageNameContainer（显示名，可带 @username）` | 所有已注册系统类型共用。`!isSelecting`。头像 **不可点** `SystemMessage.tsx:90`。正文 `aria-roledescription=system_message_body` **不可点**。 | (1) User_card。(2) `GET /v1/users.info`。(3) 刷新关闭。[读] | `message.u`；`message.t` | user.card.open；tl.identity.display-name | `SystemMessage.tsx:65,95-103` |

本表数据行：**1**。计数见附录验算。

## 表 H. E2EE 占位（替换整条时间线或单条正文）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.e2ee.save-password | 加密房要求先保存 E2EE 密码 | `打开加密房且 e2eeState===SAVE_PASSWORD→StatesAction 文案 Save_E2EE_password` | `RoomE2EESetup` 替换 `RoomBody` `RoomE2EESetup.tsx:31-40`。需 `STORAGE_KEYS.E2EE_RANDOM_PASSWORD`。 | (1) 时间线不出现；States 标题 `__roomName__is_encrypted`；点后保存密码模态 [待渲染实测] modal name。(2) 本地 `e2e.openSaveE2EEPasswordModal`；无 chat REST。(3) 存完刷新进时间线。[读] | E2EE state；`room.name` | room.toolbox.e2e | `RoomE2EESetup.tsx:21-40`；`RoomE2EENotAllowed.tsx:41-48` |
| tl.e2ee.enter-password | 输入 E2EE 密码才能看时间线 | `打开加密房且 e2eeState===ENTER_PASSWORD→StatesAction 文案 Enter_your_E2E_password` | `RoomE2EESetup.tsx:43-52`。 | (1) 时间线不出现；点后解码私钥流 [待渲染实测]。(2) `e2e.decodePrivateKeyFlow`。(3) 成功后刷新可见消息。[读] | E2EE state | tl.e2ee.save-password | `RoomE2EESetup.tsx:29,43-52` |
| tl.e2ee.back-home | 从 E2EE 阻断页回首页 | `SAVE_PASSWORD 或 ENTER_PASSWORD 页→role=link 文案 Back_to_home` | 仅 `action` 有值时渲染（WAITING_KEYS **无**此钮）`RoomE2EENotAllowed.tsx:41-45`。 | (1) 导航 `/home`。(2) 无 REST。(3) 刷新在 home。[读] | — | route 见 04 | `RoomE2EENotAllowed.tsx:31-45` |
| tl.e2ee.learn-more | 打开 E2EE 文档外链 | `任一 E2EE States 页→StatesLink 文案 Learn_more_about_E2EE` | 三态都渲染（含 WAITING_KEYS）。 | (1) 新标签 `links.go.e2eeGuide`。(2) 无 RC endpoint。(3) 无。[读] | docs URL | tl.e2ee.enter-password | `RoomE2EENotAllowed.tsx:51-53` |

本表数据行：**4**。计数见附录验算。

## 表 I. 时间线 chrome（未读 / 新消息 / 历史）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.unread.jump | 点未读条跳到第一条未读 | `房间时间线上方 Bubble 文案 unread_messages_counter（icon=arrow-up）→点气泡本体` | `unread.count>0` 且已订阅 `RoomBody.tsx:177-182`。 | (1) 条消失；列表滚到该消息；URL `?msg=` `jumpToUnread` [待渲染实测] 高亮 name。(2) `readStateManager.markAsRead()`（订阅已读）。(3) 刷新后未读计数按 server ls。[读] | `subscription.ls`；`RoomHistoryManager.firstUnread` | implicit.unread.jumpToFirst；msg.jump | `UnreadMessagesIndicator.tsx:23-29`；`useUnreadMessages.ts:61-78` |
| tl.unread.mark-read | 关掉未读条并标已读（不跳转） | `未读 Bubble→dismiss title/aria-label=Mark_as_read` | 同左。 | (1) 条消失，不改 `?msg=`。(2) `markAsRead()`。(3) 刷新无未读条。[读] | 同左 | implicit.unread.markAllRead | `UnreadMessagesIndicator.tsx:25-27`；`useUnreadMessages.ts:80-83` |
| tl.chrome.new-messages | 不在底部时跳到刚到的新消息 | `列表未贴底且他人发来新消息→底部 Bubble 文案 New_messages` | `hasNewMessages && !atBottom`；自己的消息会直接贴底 `useHasNewMessages.ts:50-62`。 | (1) Bubble 淡出；列表贴底；composer focus。(2) 无 REST。(3) 状态不持久。[读] | streamNewMessage | implicit.scroll.newMessagesButton | `RoomBody.tsx:187`；`JumpToRecentMessageButton.tsx:46-54` |
| tl.chrome.jump-recent | 从历史夹缝跳回最新页 | `hasMoreNextMessages（从中间 ?msg= 跳入）→底部 Bubble 文案 Jump_to_recent_messages` | `RoomHistoryManager.hasMoreNext` `RoomBody.tsx:188-191`。 | (1) Bubble 淡出；历史 clear 后贴底。(2) `RoomHistoryManager.getMoreIfIsEmpty(rid)`。(3) 最新页刷新可见。[读] | hasMoreNext | implicit.scroll.jumpToRecent | `useHasNewMessages.ts:31-35` |
| tl.history.load-older | 向上滚加载更早历史 | `房间时间线→滚轮/触控/PageUp 等到顶部约 1/3` | `hasMorePreviousMessages`；须先有用户滚动交互（observer 不自动连拉）`useGetMore.ts:49-50,68-74`。无独立点击控件。列表顶 `load-more` 仅 loading 指示。 | (1) 更早 `listitem` 出现；可能 `LoadingMessagesIndicator`。(2) `RoomHistoryManager.getMore`。(3) 刷新重拉。[读] | RoomHistoryManager | implicit.scroll.loadPrevious；shortcut.history.loadMore | `useGetMore.ts:49-62` |
| tl.history.load-newer | 向下滚加载更新历史 | `已跳到中间历史→滚到底` | `hasMoreNext` `useGetMore.ts:63-64`。 | (1) 更新 listitem 出现。(2) `RoomHistoryManager.getMoreNext`。(3) 刷新重拉。[读] | hasMoreNext | shortcut.history.loadMore | `useGetMore.ts:63-64` |

本表数据行：**6**。计数见附录验算。

## 表 J. 选择模式（时间线勾选 + 导出批量）

进入点是 toolbox `Export_Messages`（`room.toolbox.export-messages`）。`type!=='file'` 时 `setIsSelecting(true)`；关栏 `reset()` `ExportMessages.tsx:121-128`。时间线上的勾选是本分册表面。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.select.enter | 进入多选：行上出现 checkbox、工具栏隐藏 | `房间头→工具栏→Options→Export_Messages`（Method 非 Send_file_via_email） | permission `mail-messages`（toolbox）；E2EE 房默认 Method=`download` 仍进入选择 `ExportMessages.tsx:60,122-123`。`type==='file'` **不**进入选择。 | (1) 每行 checkbox `aria-label=Select_message_from_user(_with_preview)`；底栏 `__count__messages_selected`；`MessageToolbarHolder` 不挂 `RoomMessage.tsx:147`。(2) 打开栏无 REST。(3) store 仅内存，刷新/关栏清空。[读] | Export tab type | implicit.select.composerReplace；room.toolbox.export-messages | `ExportMessages.tsx:121-128`；`RoomMessage.tsx:136` |
| tl.select.toggle | 勾选/取消单条（含系统行、线程预览） | `选择模式→点消息行 / 点 checkbox / 焦点 listitem 按 Space 或 Enter` | `selecting===true`。系统行同样 `SystemMessage.tsx:83-91`。线程预览 `handleThreadClick` 改为 toggle `ThreadMessagePreview.tsx:62-70`。 | (1) checkbox checked 与 `isSelected`；底栏计数变。(2) 无 REST。(3) 刷新清空。[读] | `message._id` `msg` `u`；`getCheckboxLabel` | implicit.select.toggleMessage | `RoomMessage.tsx:91-109,136`；`getCheckboxLabel.tsx:4-12` |
| tl.select.select-all | 全选已加载消息并滚到顶 | `选择模式→底栏 Select__count__messages` | `countAvailable>0` `ComposerSelectMessages.tsx:24-25`。 | (1) 计数=available；列表 `scrollTo({top:0})`。(2) 无 REST。(3) 仅已 mount 的 availableMessages。[读] | availableMessages | implicit.select.selectAll | `useSelectAllAndScrollToTop.ts:9-11` |
| tl.select.clear | 清除全部勾选（不退出模式） | `选择模式→底栏 Clear_selection` | `countSelected>0` 否则 disabled。 | (1) 计数 0；checkbox 全未勾；仍留在选择模式。(2) 无 REST。(3) 无。[读] | selected set | implicit.select.clear | `ComposerSelectMessages.tsx:21-22` |
| tl.select.cancel | 关掉导出栏退出选择 | `Export_Messages 栏→ContextualbarClose` | 栏已开。cleanup `selectedMessageStore.reset()`。 | (1) checkbox/底栏消失；composer 恢复；工具栏可再出现。(2) 无 REST。(3) 无。[读] | — | implicit.select.composerReplace | `ExportMessages.tsx:126-127,192` |
| tl.select.export.email | 把已选消息邮件发出 | `选择模式→Export Method=Send_email→填 To_users/To_additional_emails/Subject→Send` | 非 E2EE 默认此项。须 `messagesCount>0` 否则 Callout `Mail_Message_No_messages_selected_select_all`。 | (1) toast `Your_email_has_been_queued_for_sending` [待渲染实测]。(2) `POST /v1/rooms.export` `{rid,type:'email',toUsers,toEmails,subject,messages}` `ExportMessages.tsx:173-180`。(3) 邮件在队列；勾选仍在直到关栏。[读] | `mail-messages`；所选 mids | room.toolbox.export-messages | `useRoomExportMutation.ts:7` |
| tl.select.export.file | 按日期把房间文件邮件发出（不勾选） | `Export Method=Send_file_via_email→Date_From/Date_to→Send` | `type==='file'` **退出**选择模式。format 无 PDF。 | (1) 同 queued toast。(2) `POST /v1/rooms.export` `{rid,type:'file',dateFrom?,dateTo?,format}`。(3) 邮件队列。[读] | 日期字段 | tl.select.export.email | `ExportMessages.tsx:162-169` |
| tl.select.export.download | 下载已选为 JSON 或 PDF | `Export Method=Download_file→Output_format=JSON 或 PDF→Download` | E2EE 房强制 download。PDF 需 `export-messages-as-pdf`。JSON 客户端打包 `downloadJsonAs`（无 REST）。PDF 客户端 `@react-pdf/renderer` 生成（无 REST）。 | (1) 浏览器下载文件 [待渲染实测] 文件名。(2) **无** rooms.export；纯本地。(3) 本地文件仍在。[读] | `export-messages-as-pdf`；Messages store | tl.select.toggle | `useDownloadExportMutation.ts:19`；`useExportMessagesAsPDFMutation.tsx` |

本表数据行：**8**。计数见附录验算。

## 表 K. 消息内按钮 / UiKit

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.action.link | 点消息/系统行 actionLinks 按钮 | `消息行或系统行→Button data-method-id` 文案 `t(i18nLabel)` 或 `label` | `message.actionLinks.length`。embedded 只 `fireGlobalEvent('click-action-link')`。非 embedded 需 `actionLinks.actions` 已 `register`；**develop 客户端 0 处 register**，点击会 `error-invalid-actionlink` [读]。 | (1) 已注册则跑 handler；未注册抛错 toast [待渲染实测]。(2) 视 handler；embedded 无 REST。(3) 视 handler。[读] | `actionLinks[]` `method_id` | tl.uikit.block | `MessageActions.tsx:24-36`；`actionLinks.ts:12-36` |
| tl.uikit.block | 点 Apps UiKit 消息块控件 | `消息行→blocks 内按钮/选择` | `message.blocks` `RoomMessageContent.tsx:90-91`。默认 `emitInteraction`。 | (1) app 自绘 UiKit 更新/模态 [待渲染实测] 运行时 name。(2) `POST /apps/ui.interaction/${appId}` `{type:'blockAction', actionId, payload:{blockId,value}, container:{type:'message',id:mid}, rid, mid}` `useMessageBlockContextValue.ts:64-77`。(3) 视 app。[读] | `message.blocks`；appId | msg.apps.action | `UiKitMessageBlock.tsx:15-26` |
| tl.uikit.videoconf.join | 点 videoconf 块加入通话 | `videoconf 消息→块内 join` | `appId==='videoconf-core'` 且 `actionId==='join'`。calling/ringing 时 no-op `useMessageBlockContextValue.ts:28-30,46-50`。 | (1) 加入会议 UI [待渲染实测]。(2) `joinCall(blockId)`（非 apps interaction）。(3) 会议记录见 Calls。[读] | videoconf-core | room.toolbox.start-video-call | `useMessageBlockContextValue.ts:46-50` |
| tl.uikit.videoconf.callback | 点 videoconf 块回拨 | `videoconf 消息→块内 callBack` | `actionId==='callBack'`。 | (1) outgoing 弹层 [待渲染实测]。(2) capabilities + `dispatchPopup({rid:blockId})`。(3) 同通话。[读] | videoconf-core | room.toolbox.start-video-call | `useMessageBlockContextValue.ts:53-55` |
| tl.uikit.media-call.history | 从媒体通话块打开通话历史 | `消息行→块内 open-history` | `appId==='media-call-core'` `actionId==='open-history'`。 | (1) toolbox tab `media-call-history` `context=blockId` [待渲染实测]。(2) 无该点击的 REST。(3) URL tab 刷新可重开。[读] | media-call-core | room.toolbox.start-voice-call | `useMessageBlockContextValue.ts:58-61` |

本表数据行：**5**。计数见附录验算。

## 分册 11 — Composer 状态机

把 03 入口行炸成可进入的状态。不复述 `composer.send` / `composer.format.*` 等入口 id。命名空间 `composer.state.*` / `composer.fmt.*` / `composer.popup.*`（带后缀）。原文：[`11-composer-states.md`](11-composer-states.md)（[PR #6](https://github.com/jianwyao01/Rocket.Chat/pull/6)）。

## A. Send：启用 / 禁用原因 / Enter vs 点击 / 编辑保存 vs 新发

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.send.disabled.empty` | 空输入且无附件且非编辑时 Send 不可点 | 打开已订阅房间 → 不打字、不传文件 | `!typing && !isEditing && !hasUploads`；`canSend` | `[读]` ①`MessageComposerAction` `aria-label=Send` `disabled`；无 `secondary`/`info`。②无 REST。③空态不 persist | core | `composer.send` | `MessageBox.tsx:121,517-520` |
| `composer.state.send.disabled.uploading` | 附件仍在 XHR 时 Send 不可点且点击空操作 | 选文件后、chip 仍 `aria-busy` → 点 Send | `isUploading` = 存在 `!url && !error` 的 upload | `[读]` ①Send `disabled`；chip `aria-busy=true` `aria-label=文件名`。②`handleSendMessage` 早退，无 `chat.sendMessage`。③队列仅 session | core | `composer.action.file-upload` | `MessageBox.tsx:182-185,517`；`useFileUpload.ts:36` |
| `composer.state.send.disabled.processing` | mediaConfirm 循环中 textarea 与 Send 都禁 | 有已完成 chip → Send → 确认处理中 | `isProcessingUploads` | `[读]` ①`textarea[name=msg]` `disabled`；Send `disabled`；chip 组 `disabled`。②`POST /v1/rooms.mediaConfirm/:rid/:fileId`。③处理完 chip 清；消息 persist | core | `composer.send` | `MessageBox.tsx:470,517`；`processMessageUploads.ts:149-151` |
| `composer.state.send.disabled.recording` | 录音中 textarea/格式/emoji 禁；Send **不**因录音单独禁 | 点 `data-qa-id=audio-message`（或 video）进入录音 | `isRecording = isRecordingAudio \|\| isRecordingVideo`。Send 仍只看 empty/upload 公式 | `[读]` ①`textarea` `disabled`；emoji/format `disabled`；`role=group` `aria-label=Audio_recorder` 或 `role=dialog` `aria-label=Video_record`。②无 send REST。③录音态不 persist。`[待渲染实测]` 若录音前已有字，Send 是否仍可点 | core+setting | `composer.action.audio-message` | `MessageBox.tsx:305,470,482-493,517` |
| `composer.state.send.disabled.read-only` | 只读房间无 textarea，不能发 | 打开 `roomCoordinator.readOnly` 为真的房间（muted / `room.ro` 且无 `post-readonly`） | 容器先于 MessageBox：`useMessageComposerIsReadOnly` | `[读]` ①`MessageFooterCallout` 文案 `room_is_read_only`；无 `aria-label=Send`。②无 send。③只读属性刷新仍在 | core+permission | `composer.variant.read-only` | `ComposerContainer.tsx:59-60`；`ComposerReadOnly.tsx:26-32` |
| `composer.state.send.disabled.blocked` | 被屏蔽的 DM 无输入 | 打开 DM 且 `subscription.blocked \|\| blocker` | 仅 DM + 有订阅 | `[读]` ①callout `room_is_blocked`；无 Send。②无 REST。③屏蔽关系刷新仍在 | core | `composer.variant.blocked` | `ComposerContainer.tsx:71-72`；`ComposerBlocked.tsx:4-6` |
| `composer.state.send.e2ee.hint` | 加密房密钥未就绪但允许明文：可发，有 hint | 加密房间 + `E2E_Enable` + `E2E_Allow_Unencrypted_Messages` + e2e 状态 ∉ {READY, DISABLED} + 非编辑 + 非 `room.ro` → 输入 → Send | hint 条件 `MessageBoxHint.tsx:22-29`。**Send 表达式不含 e2e** | `[读]` ①hint `E2EE_Composer_Unencrypted_Message`；Send 可点。②`POST /v1/chat.sendMessage` 明文（`shouldConvertSentMessages` 在 !READY 时 false）。③密钥就绪后 hint 消失 | core+setting | `implicit.composer.hint.e2eeUnencrypted` | `MessageBoxHint.tsx:22-43`；`rocketchat.e2e.room.ts:176-191` |
| `composer.state.send.e2ee.server-reject` | 不允许明文时 UI 仍像可发，服务端拒 | 加密房间 + `E2E_Enable` + `!E2E_Allow_Unencrypted_Messages` + 状态非 READY → 输入 → Send | UI 无 e2e disable。服务端 `message.t !== 'e2e'` 抛 `error-not-allowed` | `[读]` ①无 hint；Send 可点；失败 toast。②`POST /v1/chat.sendMessage` 被拒。③消息不 persist | core+setting | `composer.send` | `MessageBox.tsx:517`；`server/.../sendMessage.ts:100-105` |
| `composer.state.send.click` | 点发送钮发出（不受 Enter 偏好） | 非空或有附件或编辑中 → 点 `aria-label=Send` | 同 Send 启用公式；无修饰键检查 | `[读]` ①消息 `role=listitem` 出现；textarea 被 `clear()`。②新发 `POST /v1/chat.sendMessage`；编辑见 A13。③刷新后消息仍在 | core | `composer.send` | `MessageBox.tsx:182-196,514-521` |
| `composer.state.send.enter` | Enter（或 alternative 下修饰+Enter）走同一 send | Preferences `sendOnEnter`=`normal`/`desktop`(桌面) → 焦点 textarea → Enter；或 `alternative`/mobile+desktop → Ctrl/Cmd/Alt/Shift+Enter | `sendOnEnter` 计算 `MessageBox.tsx:124-125`；`isSending` `221-228` | `[读]` ①同 click。②同 `composer.send`。③同 send。偏好在用户设置 persist | core+preference | `composer.send.enter-behavior` | `MessageBox.tsx:124-125,221-233` |
| `composer.state.send.enter.newline` | 和弦不发送时插入换行 | `normal`：Shift+Enter；`alternative`：裸 Enter | 与 A10 互补 | `[读]` ①textarea 多一行 `\n`。②无 REST。③随草稿 | core+preference | `shortcut.composer.newLine` | `MessageBox.tsx:226-230` |
| `composer.state.send.new` | 非编辑发出新消息 | 无 editing mid → Send/Enter | `!chat.currentEditingMessage.getMID()`；`text \|\| hasFiles` | `[读]` ①listitem 新增。②`POST /v1/chat.sendMessage`；带附件先 media 再 confirm。③server persist | core | `composer.send` | `sendMessage.ts:48-51,87-120` |
| `composer.state.send.edit.save` | 编辑态发送走 update 不是 sendMessage | ↑ 或 More→Edit 载入 → 改字 → Send | `mid` 存在且 `text` 非空（或有文件） | `[读]` ①`variant=editing` 与 `Cancel`、hint `Editing_message` 消失；原 listitem 正文变。②`POST /v1/chat.update` `{msgId,roomId,text}`。③刷新后仍是新正文 + edited | core | `composer.send`；`msg.edit` | `sendMessage.ts:44-46`；`processMessageEditing.ts:12-27`；`data.ts:176-192` |
| `composer.state.send.edit.empty-delete` | 编辑中清空再发送走删除而不是 update | 进入编辑 → 清空 textarea → Send | `mid` 且 `!text && !hasFiles` | `[读]` ①该 listitem 消失；编辑态结束。②`requestMessageDeletion` → `POST /v1/chat.delete`。③刷新后消息不在 | core | `composer.edit.cancel` | `sendMessage.ts:128-144` |

本表数据行：**14**。计数见附录验算。

## B. Join / preview-join / code-join

03 `composer.join` 只写 MessageBox 上的 Join。这里按**替换了 MessageBox 还是 MessageBox 内 Join**拆。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.join.preview` | 未订阅预览房：composer 在，Send 换成 Join | 打开公开且无订阅的房间（非只读、无 joinCode）→ 点 `Join` | `!canSend`（无订阅）；容器未抢走 MessageBox | `[读]` ①`MessageComposerButton` 文案 `Join` `loading` 后消失，Send 出现，textarea 解禁。②`POST /v1/rooms.join` `{roomId}`（`data.ts:276-278`）。③刷新后已是订阅者 | core | `composer.join` | `MessageBox.tsx:506-509`；`ComposerMessage.tsx:34-40` |
| `composer.state.join.readonly` | 只读且未订阅：callout + Join，无 textarea | 只读房且 `!isSubscribed` → 点 `Join` | 容器 `isReadOnly` 先于 preview-join | `[读]` ①`room_is_read_only` + `Button` `Join`；加入后仍可能只读（无 textarea）。②`POST /v1/rooms.join` `{roomId}`。③订阅 persist；只读仍在则仍无输入 | core+permission | `composer.variant.read-only` | `ComposerReadOnly.tsx:12-32` |
| `composer.state.join.password` | 需要加入码的预览：密码框 + Join_with_password | 无订阅 + `joinCodeRequired` + 无 `join-without-join-code` → 填密码 → `Join_with_password` | `mustJoinWithCode`；提交 `disabled={!isDirty}` | `[读]` ①`form` `aria-label=Join_with_password`；`PasswordInput`；成功后变正常 composer。②`POST /v1/rooms.join` `{roomId,joinCode}`。③刷新后已订阅 | core+permission | `composer.variant.join-password` | `ComposerContainer.tsx:27-28,67-68`；`ComposerJoinWithPassword.tsx:21-47` |
| `composer.state.join.omni` | 全渠道已开房间、自己未订阅且非当前坐席：Join | live 房间 `open` 且非 hold/inquiry/MAC → `room_is_read_only` + `Join` | `!isSubscribed && !isSameAgent`；关联 **08** | `[读]` ①同只读文案 + `Join`。②`GET /v1/livechat/room.join`。③刷新后成为订阅坐席，出现 `ComposerMessage` | core+omni | 08；`composer.join` | `ComposerOmnichannel.tsx:62-68`；`ComposerOmnichannelJoin.tsx:15-28` |

本表数据行：**4**。计数见附录验算。

## C. File upload 状态

父入口 03：`composer.action.file-upload` `composer.paste.image` `implicit.upload.*` `composer.upload.*`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.upload.button` | 点回形针打开多选系统选择器并入队 | 已订阅可发房 → `data-qa-id=file-upload` `title=Upload_file` → 选文件 | `FileUpload_Enabled`；`!disableBasicActions`（`!canSend \|\| isRecording \|\| isEditing` 则 disabled） | `[读]` ①系统 file picker；确认后 `aria-label=Uploads` 组出现 chip `aria-label=文件名`。②`POST /v1/rooms.media/:rid`（XHR）。③队列 session；发出并 confirm 后刷新仍在 | core+setting | `composer.action.file-upload` | `useFileUploadAction.ts:9-52` |
| `composer.state.upload.drop` | 拖放文件入队 | 从桌面拖进 `.messages-container-main` → overlay 绿 → drop | `FileUpload_Enabled`；未超 MAC；可发/已订阅；非 editing | `[读]` ①`role=dialog` `data-qa=DropTargetOverlay` `Drop_to_upload_file` 出现再关；chips 出现。②同 `rooms.media`。③同 button | core+setting+permission | `implicit.upload.dropFiles` | `useFileUploadDropTarget.ts:72-91`；`DropTargetOverlay.tsx:66-92` |
| `composer.state.upload.drop.disabled` | 无权拖入时 overlay 变红，松手不传 | 只读/未订阅/编辑中/关上传/MAC → dragenter → drop | `!FileUpload_Enabled \|\| MAC` → 文案 `FileUpload_Disabled`；否则 `error-not-allowed` | `[读]` ①同 dialog `color=danger`。②无 upload。③无附件 | core+setting | `implicit.upload.dragDisabledOverlay` | `useFileUploadDropTarget.ts:72-86` |
| `composer.state.upload.paste` | 剪贴板无 text/plain 时粘贴图片入队 | 焦点 textarea → Ctrl/Cmd+V 一张图 | 同 file upload；有 `text/plain` 则走默认粘贴 | `[读]` ①chip 名 `Clipboard - {datetime}.ext`。②`rooms.media`。③同 button | core+setting | `composer.paste.image` | `MessageBox.tsx:351-379` |
| `composer.state.upload.reject.size` | 超 `FileUpload_MaxFileSize` 出错误 chip，不发 XHR | 选/拖一个过大文件 | `maxFileSize > -1 && file.size > maxFileSize`；`size===0` 另条 empty-file | `[读]` ①`MessageComposerFileError` 副题 `Upload_failed`。②无 media POST。③session until Remove | core+setting | `composer.action.file-upload` | `uploads.ts:143-149` |
| `composer.state.upload.reject.type` | MIME 不在白名单/在黑名单 → 错误 chip | 选被拒类型 | `!fileUploadIsValidContentType` | `[读]` ①错误 chip `title` 为类型错误。②无 media POST。③session | core+setting | `composer.action.file-upload` | `uploads.ts:125,152-153` |
| `composer.state.upload.reject.count` | 队列+新选 >10 只 toast，不加 chip | 已有 n 个 chip → 再选使合计 >10 | `MAX_MULTIPLE_UPLOADED_FILES=10` | `[读]` ①toast `You_cant_upload_more_than__count__files`；无新 chip。②无 REST。③旧 chip 仍在 | core | `composer.action.file-upload` | `uploadFiles.ts:17-22`；`lib/constants.ts:2` |
| `composer.state.upload.e2ee.blocked` | 加密房且不允许明文文件且未开加密文件：整批拒 | 加密房间 + `!E2E_Allow_Unencrypted_Messages` + `!E2E_Enable_Encrypt_Files` → 选文件 | `uploadFiles.ts:27-31` 在入队前 return | `[读]` ①toast `You_cant_send_unencrypted_files_in_an_encrypted_room`；无 chip。②无 media。③无 | core+setting | `composer.action.file-upload` | `uploadFiles.ts:27-31` |
| `composer.state.upload.e2ee.encrypt-fail` | 开了加密文件但房间未就绪：该文件失败 | 加密房 + `E2E_Enable_Encrypt_Files` + `!e2eRoom.isReady()` → 选文件 | `!e2eRoom.isReady() \|\| !encryptedFile` | `[读]` ①toast `Error_encrypting_file`。②无 media。③无该文件 chip | core+setting | `composer.action.file-upload` | `uploadFiles.ts:47-54` |
| `composer.state.upload.chip.loading` | 上传中 chip 忙 + 顶栏百分比 | 文件已选、XHR 未完成 | `!upload.url && !upload.error` | `[读]` ①chip `aria-busy=true`；`role=status` Bubble `{n}% Uploading__count__file`。②`POST /v1/rooms.media/:rid`。③完成后变 success chip | core | `implicit.upload.progressBanner` | `MessageComposerGenericFile.tsx:33,78-96`；`UploadProgressIndicator.tsx:61-68` |
| `composer.state.upload.chip.cancel` | 取消进行中的 XHR | loading chip 上点 `aria-label=Cancel` | `isLoading` | `[读]` ①该 chip 与进度消失。②中止 XHR；无 mediaConfirm。③无残留 | core | `composer.upload.cancel` | `MessageComposerGenericFile.tsx:33,55-63` |
| `composer.state.upload.chip.remove` | 去掉已完成或错误 chip | success/error chip → `aria-label=Remove` | `upload.url \|\| upload.error`；`isProcessingUploads` 时整组 disabled | `[读]` ①该 `aria-label=文件名` chip 消失。②无新 REST。③刷新不会回来 | core | `composer.upload.remove` | `MessageComposerGenericFile.tsx:55-63` |
| `composer.state.upload.chip.error` | 失败 chip **没有 Retry**，只能 Remove | 触发 size/type/400/网络失败后看 chip | `upload.error`；`handleOpenFilePreview` 对 error 早退 | `[读]` ①`MessageComposerFileError`；点 chip 不打开 modal；**无 Retry 按钮**。②无重传。③session until Remove | core | `composer.upload.remove` | `MessageComposerGenericFile.tsx:35-37,66-75` |
| `composer.state.upload.chip.edit` | 成功 chip 改文件名/alt | 非 loading 非 error chip → FileUpload modal → `Update` | `!isLoading && !upload.error`；`isDirty` 才可提交 | `[读]` ①modal 标题 `FileUpload`；确认 `Update`；chip `fileTitle` 变。②此时无 REST；发送时带新名 confirm。③未发送刷新丢失 | core | `composer.upload.edit` | `MessageComposerGenericFile.tsx:35-52`；`FileUploadModal.tsx:63-112` |
| `composer.state.upload.multiple` | 一次多选并行上传 | file input `multiple` 选 2–10 个未超限文件 | 合计 ≤10 | `[读]` ①多个 chip；多个进度。②并行 `rooms.media`（`Promise.allSettled`）。③各自独立 | core | `composer.action.file-upload` | `useFileUploadAction.ts:9`；`uploadFiles.ts:82` |
| `composer.state.upload.partial-send` | 部分失败时 Send_anyway 只确认成功的 | 有成功+失败 chip → Send → `Are_you_sure` → `Send_anyway` | `failedUploads.length > 0 && < all` | `[读]` ①`GenericModal` 确认 `Send_anyway` / `Cancel`；确认后失败 chip 被 remove。②成功文件 `POST /v1/rooms.mediaConfirm/:rid/:fileId`。③成功附件 persist | core | `composer.send` | `processMessageUploads.ts:200-215` |
| `composer.state.upload.all-failed` | 全部失败只 Ok，不发送 | 仅错误 chip → Send → Warning `Ok` | `failedUploads.length === filesToUpload.length` | `[读]` ①`GenericModal` `variant=warning` 只有 `Ok`。②无 mediaConfirm。③错误 chip 仍在 | core | `composer.send` | `processMessageUploads.ts:182-198` |

本表数据行：**17**。计数见附录验算。

## D. Audio recording

**锁/上滑锁定：源码无。** `AudioMessageRecorder` / `recorderjs` 无 lock/swipe-lock。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.audio.start` | 开始录音，textarea 换成录音条 | 宽屏 `data-qa-id=audio-message`（或 More→Create new） | `AudioRecorder.isSupported`；`FileUpload_Enabled`；`Message_AudioRecorderEnabled`；MIME 含 `audio/mp3`；`!isMicrophoneDenied`；`!disableBasicActions` | `[读]` ①`role=group` `aria-label=Audio_recorder`；`title=Cancel_recording` / `Finish_recording`；textarea disabled。②无 REST；`UserAction` `notify-room` `user-recording`。③不 persist | core+setting | `composer.action.audio-message` | `useAudioMessageAction.ts:14-61`；`AudioMessageRecorder.tsx:106-126` |
| `composer.state.audio.cancel` | 丢掉录音，不入队 | 录音条 → `Cancel_recording` | `state==='recording'` | `[读]` ①group 消失；textarea 恢复。②`UserAction.stop('recording')`；无 upload。③无文件 | core | `implicit.recording.cancel` | `AudioMessageRecorder.tsx:77-79,116-118` |
| `composer.state.audio.finish` | 完成录音 → 立刻当 mp3 入上传队列 | 录音条 → `Finish_recording` | recording 态 | `[读]` ①group 关；出现 `Audio_record.mp3` chip；短暂 Throbber。②`uploadFiles` → `POST /v1/rooms.media/:rid`。③随之后发送 persist | core | `implicit.recording.finish` | `AudioMessageRecorder.tsx:83-91,125-128` |
| `composer.state.audio.permission-denied` | 麦克风已拒：钮 disabled，点了也不出录音条 | 浏览器拒 mic 后看钮 / 再点 | `isMicrophoneDenied`；title `Microphone_access_not_allowed`。录音条 `return null` | `[读]` ①`data-qa-id=audio-message` disabled；无 `Audio_recorder` group。②无 REST。③权限 persist 在浏览器 | core | `composer.action.audio-message` | `useAudioMessageAction.ts:14-15,61`；`AudioMessageRecorder.tsx:102-104` |
| `composer.state.audio.send` | 录音入队后当附件发出 | finish 后 chip 在 → Send | 同 send+uploads | `[读]` ①chip 消失；消息带音频附件。②`rooms.mediaConfirm` + `chat.sendMessage`。③刷新仍在 | core | `composer.send` | `sendMessage.ts:33-35`；`processMessageUploads.ts` |
| `composer.state.audio.lock.absent` | **没有**录音锁定/上滑锁 | 开始录音后左右滑/上滑 | 全仓库录音组件无 lock UI | `[读]` ①只有 Cancel / Finish；无 lock 控件。②无。③无。负向断言，勿找 WhatsApp 式锁 | core | `composer.action.audio-message` | `AudioMessageRecorder.tsx:116-126` |

本表数据行：**6**。计数见附录验算。

## E. Video recording（与 audio 同矩阵）

**锁：源码无。**

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.video.start` | 打开摄像浮层，点 Record 开始 | `data-qa-id=video-message` → 浮层 → `aria-label=Record` | `Message_VideoRecorderEnabled`；`FileUpload_Enabled`；`MediaRecorder`；camera 未拒；`video/webm` MIME | `[读]` ①`role=dialog` `aria-label=Video_record`；`<video muted autoPlay>`；Record 变 `Stop_Recording`。②`UserAction` `user-recording`。③浮层不 persist | core+setting | `composer.action.video-message` | `useVideoMessageAction.ts:12-40`；`VideoMessageRecorder.tsx:116-128` |
| `composer.state.video.cancel` | 关浮层不入队 | 浮层 → `Cancel`（或开镜失败自动 cancel） | 浮层已开 | `[读]` ①dialog 消失。②`VideoRecorder.stop` + `UserAction.stop`。③无文件 | core | `composer.action.video-message` | `VideoMessageRecorder.tsx:97-113,130-131` |
| `composer.state.video.finish` | Stop 结束录制，Send 才可点 | 录制中 → `Stop_Recording` | `recordingState==='recording'` | `[读]` ①Stop 回到 Record；`Send` 从 `disabled`（`!(cameraStarted && !isRecording)`）变为可点。②无 upload 直到 Send。③不 persist | core | `composer.action.video-message` | `VideoMessageRecorder.tsx:49,64-80,133` |
| `composer.state.video.permission-denied` | 摄像头已拒：钮 disabled，或浮层被关掉 | 拒 camera 后看钮；或打开后 `isPermissionDenied` | title `Camera_access_not_allowed`；hook 会 `setRecordingVideo(false)` | `[读]` ①video 钮 disabled；dialog 不在。②无 REST。③浏览器权限 persist | core | `composer.action.video-message` | `useVideoMessageAction.ts:51-53`；`useMediaActionTitle.ts` |
| `composer.state.video.send` | 浮层 Send 把 webm 入队 | Stop 后 → `Send` | `cameraStarted && !isRecording` | `[读]` ①dialog 关；video chip 出现。②`uploadFiles` → `rooms.media`。③随消息 persist | core | `composer.send` | `VideoMessageRecorder.tsx:84-95,133-135` |
| `composer.state.video.lock.absent` | **没有**视频锁定手势 | 浮层内拖动手势 | 无 lock | `[读]` ①只有 Record/Stop、Cancel、Send。②无。③无 | core | `composer.action.video-message` | `VideoMessageRecorder.tsx:122-136` |

本表数据行：**6**。计数见附录验算。

## F. Formatting：每 mark 的 apply + remove

工具栏注册表 **7** 项：bold / italic / strike / inline-code / multiline-code / link / katex。**无 quote、无 list 按钮**（用户可手打 `>` / `- `，无 wrap/unwrap）。Link 走 modal，**不**走 `wrapSelection` toggle。KaTeX 是外链，03 已有入口，本册不复述。
`wrapSelection`（`createComposerAPI.ts:225-261`）：光标两侧已是起止定界符 → **REMOVE**；否则 **APPLY**。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.fmt.bold.apply` | 选区包成 `*text*` | 选中未加粗文字 → title=`Bold` 或 Ctrl/Cmd+B | toolbar `disabled={isRecording \|\| !canSend}` | `[读]` ①选区变 `*…*`，光标包住内文。②无 REST。③随草稿 | core | `composer.format.bold` | `messageBoxFormatting.ts:35-40`；`createComposerAPI.ts:263-269` |
| `composer.fmt.bold.remove` | 已有 `*` 定界则剥掉 | 选中已被 `*` 包住的内文（光标贴在定界符内）→ 再点 Bold / Ctrl+B | 同 apply；`startPatternFound && endPatternFound` | `[读]` ①`*` 消失，内文保留。②无 REST。③随草稿 | core | `composer.format.bold` | `createComposerAPI.ts:236-260` |
| `composer.fmt.italic.apply` | 选区包成 `_text_` | 选中 → title=`Italic` 或 Ctrl/Cmd+I | 同格式栏 | `[读]` ①`_…_`。②无。③草稿 | core | `composer.format.italic` | `messageBoxFormatting.ts:41-46` |
| `composer.fmt.italic.remove` | 剥掉 `_` | 已包住 → 再点 Italic / Ctrl+I | 同 bold.remove | `[读]` ①`_` 消失。②无。③草稿 | core | `composer.format.italic` | `createComposerAPI.ts:236-260` |
| `composer.fmt.strike.apply` | 选区包成 `~text~` | 选中 → title=`Strikethrough`（无快捷键） | 同格式栏 | `[读]` ①`~…~`。②无。③草稿 | core | `composer.format.strikethrough` | `messageBoxFormatting.ts:47-51` |
| `composer.fmt.strike.remove` | 剥掉 `~` | 已包住 → 再点 Strike | 同 toggle | `[读]` ①`~` 消失。②无。③草稿 | core | `composer.format.strikethrough` | `createComposerAPI.ts:236-260` |
| `composer.fmt.inline-code.apply` | 选区包成行内代码 | 选中 → title=`Inline_code` | 同格式栏 | `[读]` ①`` `…` ``。②无。③草稿 | core | `composer.format.inline-code` | `messageBoxFormatting.ts:52-56` |
| `composer.fmt.inline-code.remove` | 剥掉行内反引号 | 已包住 → 再点 | 同 toggle | `[读]` ①反引号消失。②无。③草稿 | core | `composer.format.inline-code` | `createComposerAPI.ts:236-260` |
| `composer.fmt.multiline-code.apply` | 选区包成围栏代码块 | 选中 → title=`Multi_line_code` | 同格式栏 | `[读]` ①三反引号围栏。②无。③草稿 | core | `composer.format.multiline-code` | `messageBoxFormatting.ts:57-61` |
| `composer.fmt.multiline-code.remove` | 剥掉围栏 | 光标在围栏内再点 | 同 toggle | `[读]` ①围栏消失。②无。③草稿 | core | `composer.format.multiline-code` | `createComposerAPI.ts:236-260` |
| `composer.fmt.link.open` | 打开加链接弹窗（不 toggle） | 点 title=`Link`（可先选文字预填 Text） | 同格式栏 | `[读]` ①`GenericModal` title=`Add_link`；`TextInput` `URL` / `Text`。②无 REST。③关也不改文本直到 Add | core | `composer.format.link` | `messageBoxFormatting.ts:62-88`；`AddLinkComposerActionModal.tsx:28-46` |
| `composer.fmt.link.invalid` | URL 非法时不能 Add | modal 开 → URL 空或 `new URL` 抛错 | `isValidLink`；`confirmDisabled={!isValid}` | `[读]` ①`FieldError` `Invalid_URL` 或 `URL_is_required`；Add disabled。②无。③无插入 | core | `composer.format.link` | `AddLinkComposerActionModal.tsx:61-71` |
| `composer.fmt.link.add` | 插入 `[text](url)`；**没有**对应 remove 钮 | 填合法 URL → `Add` | `formState.isValid` | `[读]` ①modal 关；选区变 markdown 链接。②无 REST。③随草稿。再点 Link 仍开 modal，不剥链接 | core | `composer.format.link` | `AddLinkComposerActionModal.tsx:75-83` |
| `composer.fmt.link.cancel` | 关 modal 不改文本 | modal → Cancel / 关 | 始终可关 | `[读]` ①modal 消失；`composer.focus()`；原文不动。②无。③无 | core | `composer.format.link` | `AddLinkComposerActionModal.tsx:43` |
| `composer.fmt.quote.absent` | 工具栏**没有** quote/blockquote mark | 看格式栏 / overflow `Message_Formatting_toolbox` | `formattingButtons` 7 项无 quote | `[读]` ①无 title=Quote 的 formatter。②无。③手打 `>` 只是普通字符。负向断言 | core | `composer.format.bold` | `messageBoxFormatting.ts:34-106` |
| `composer.fmt.list.absent` | 工具栏**没有** ul/ol mark | 同上找 list/bullet/number | 注册表无 list | `[读]` ①无 lists 钮。②无。③手打 `- `/`1. ` 不经 wrapSelection。负向断言 | core | `composer.format.bold` | `messageBoxFormatting.ts:34-106` |

本表数据行：**16**。计数见附录验算。

## G. Emoji picker 状态

父入口 03 `composer.emoji.picker`。Colon 弹层仍是 03 `composer.popup.emoji-colon`，本册不复述。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.emoji.open` | 打开 picker dialog | toolbar title=`Emoji` | `useEmojis`；`!isRecording && canSend` | `[读]` ①`role=dialog` `aria-label=Emoji_picker`；`role=tablist` 分类。②无 REST。③关后不持久；`localStorage emoji.recent/tone` 仍在 | core+preference | `composer.emoji.picker` | `MessageBox.tsx:164-178,480-485`；`EmojiPicker.tsx:193-245` |
| `composer.state.emoji.search` | 搜索过滤 | dialog 开 → `aria-label=Search` 输入 | `searching=true` 非空 | `[读]` ①`role=tabpanel` 切到 `SearchingResult`。②仅本地 `emoji.list`。③输入不 persist | core | `composer.emoji.picker` | `EmojiPicker.tsx:139-205` |
| `composer.state.emoji.search.empty` | 搜索无结果 | 搜不存在的名 | 过滤后 0 | `[读]` ①`EmojiPickerNotFound` `No_emojis_found`。②无。③无 | core | `composer.emoji.picker` | `SearchingResult.tsx:26-27` |
| `composer.state.emoji.tone` | 改肤色并写入本地 | 点 Skin_tone → 选 tone 0–5 | ToneSelector 始终在 footer | `[读]` ①`IconButton` 预览肤色变；后续有肤色的 emoji 按 tone 渲染。②无 REST。③`localStorage emoji.tone` | core | `composer.emoji.picker` | `ToneSelector.tsx:54-66`；`ToneSelectorWrapper.tsx:10-11` |
| `composer.state.emoji.recent` | 打开时落在 recent 分类 | 先前插入过 emoji → 再打开 | 初始 category `recent`；数据 `emoji.recent` | `[读]` ①`role=tab` recent 选中；空则 `No_emojis_found`。②无。③recent persist localStorage | core | `composer.emoji.picker` | `EmojiPicker.tsx:135-137` |
| `composer.state.emoji.insert` | 点一个 emoji 插入并关闭 | dialog 开 → 点 `data-emoji` 项 | picker 开 | `[读]` ①dialog 关；textarea 插入 unicode/` :name: `。②无 REST。③`addRecentEmoji` → `emoji.recent`/`emoji.frequent`；文本随草稿 | core | `composer.emoji.picker` | `EmojiPicker.tsx:104-132` |
| `composer.state.emoji.pref-off` | 关 useEmojis：钮 disabled，点了也不开 | Preferences 关 Emojis → 回房间 | `!useUserPreference('useEmojis')`；open handler 早退 | `[读]` ①title=`Emoji` disabled；无 dialog。②无。③偏好 server persist | core+preference | `composer.emoji.picker` | `MessageBox.tsx:168-169,482` |

本表数据行：**7**。计数见附录验算。

## H. Mentions popup：@user / @all / @here / 键盘 vs 点击 / 空

父入口 03 `composer.popup.mention`。壳：`role=menu` `name=ComposerBoxPopup` 标题 People。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.popup.mention.open` | 输入 `@` 打开 People 菜单 | textarea 输入 `@` 或 `@ali` | 无额外 permission；条数 `Number_of_users_autocomplete_suggestions` | `[读]` ①`role=menu` `name=ComposerBoxPopup` 标题 People；option `id=popup-item-{id}`。②本地最近消息；不足 5 则 `GET /v1/spotlight?type={"users":true,"mentions":true}`。③popup 关不 persist | core+setting | `composer.popup.mention` | `ComposerPopupProvider.tsx:110-184`；`ComposerBoxPopup.tsx:82-114` |
| `composer.popup.mention.empty` | 过滤后无人 | `@zzzz-no-user` | 本地+spotlight 皆空 | `[读]` ①`Option` `No_results_found`。②spotlight 仍可能已发。③无插入 | core | `composer.popup.mention` | `ComposerBoxPopup.tsx:99` |
| `composer.popup.mention.user.keyboard` | ↑↓ 后 Enter/Tab 插入 @username | popup 开 → 焦点某用户 → Enter 或 Tab | `focused` 存在 | `[读]` ①menu 关；textarea 成 `@username `。②无新 REST（spotlight 可能已发生）。③随草稿 | core | `shortcut.popup.select` | `useComposerBoxPopup.ts:181-190`；`ComposerPopupProvider.tsx:182` |
| `composer.popup.mention.user.click` | 鼠标点 option 插入同一值 | popup → 点用户 option | 同 open | `[读]` ①同 keyboard 插入。②同。③同。触发不同故分行 | core | `composer.popup.mention` | `ComposerBoxPopup.tsx:105` |
| `composer.popup.mention.all.keyboard` | 键盘选系统项 @all | `@` 或 `@all` → 焦点 `_id=all` → Enter/Tab | filter 空或匹配 `all`；`system:true` | `[读]` ①option `@all` + `Notify_all_in_this_room`（无头像）。②无 REST。③插入 `@all ` | core | `composer.popup.mention` | `ComposerPopupProvider.tsx:129-136` |
| `composer.popup.mention.all.click` | 点击 @all | 点 all option | 同 all.keyboard | `[读]` ①同插入 `@all `。②无。③草稿 | core | `composer.popup.mention` | `ComposerBoxPopup.tsx:105` |
| `composer.popup.mention.here.keyboard` | 键盘选 @here | 焦点 `_id=here` → Enter/Tab | filter 空或匹配 `here` | `[读]` ①`@here` + `Notify_active_in_this_room`。②无。③`@here ` | core | `composer.popup.mention` | `ComposerPopupProvider.tsx:139-146` |
| `composer.popup.mention.here.click` | 点击 @here | 点 here option | 同 here.keyboard | `[读]` ①同 `@here `。②无。③草稿 | core | `composer.popup.mention` | `ComposerBoxPopup.tsx:105` |
| `composer.popup.mention.not-in-channel` | spotlight 到不在本房的用户 | `@` 搜仅 spotlight 命中的外人 → 选中 | `ComposerBoxPopupUser` 大号 variant title `Not_in_channel` | `[读]` ①option 带 `Not_in_channel`。②spotlight。③插入 `@username `（是否自动邀请不在本 popup；见 i18n `Add_them` 服务端 hook） | core | `composer.popup.mention` | `ComposerBoxPopupUser.tsx:51-54` |

本表数据行：**9**。计数见附录验算。

## I. Slash commands：palette / execute / invalid / app 扩展面

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.popup.slash.open` | 行首 `/` 打开 Commands palette（只补全不执行） | 行首 `/` 或 `/to` → ↑↓ | 每条 `command.permission`；无权限项被滤掉 | `[读]` ①menu 标题 `Commands`；行 `{cmd}`+params。②仅本地 `slashCommands.commands`。③补全 `/cmd `，popup 关 | core+app | `composer.popup.slash-command` | `ComposerPopupProvider.tsx:327-360` |
| `composer.popup.slash.empty` | 过滤无命令 | `/zzz-no-cmd` | 本地表无匹配 | `[读]` ①`No_results_found`。②无。③无 | core | `composer.popup.slash-command` | `ComposerBoxPopup.tsx:99` |
| `composer.popup.slash.encrypted` | 加密且不允许明文：palette 整组 disabled | 加密房 + `E2E_Enable` + `!E2E_Allow_Unencrypted_Messages` → `/` | config `disabled: encrypted`；项 title `Unavailable_in_encrypted_channels` | `[读]` ①Commands 项 disabled。②无。③不能补全执行 | core+setting | `composer.popup.slash-command` | `ComposerPopupProvider.tsx:101-103,332-343` |
| `composer.state.slash.execute` | 发送 `/cmd params` 真正执行 | 输入已知命令 → Send/Enter | `isSlashCommandAllowed`；`hasAtLeastOnePermission` | `[读]` ①composer `clear()`。②clientOnly 本地 callback；否则 `POST /v1/commands.run` + `POST /v1/statistics.telemetry`。③副作用按命令 persist | core+app | `composer.slash.execute` | `processSlashCommand.ts:64-113`；`MessageBox.tsx:116-118` |
| `composer.state.slash.invalid` | 未知命令且不允许当正文：rocket.cat 临时提示 | `/not-a-cmd` → Send；`Message_AllowUnrecognizedSlashCommand=false` | 解析得 string command | `[读]` ①临时私信 `No_such_command`（rocket.cat）。②无 `commands.run`、无 `chat.sendMessage`。③刷新后 ephemeral 不在 | core+setting | `composer.slash.execute` | `processSlashCommand.ts:55-58` |
| `composer.state.slash.unrecognized-pass` | 未知命令被允许时当普通消息发出 | 同上但 setting **true** | `processSlashCommand` return false → 走 send | `[读]` ①listitem 正文是 `/not-a-cmd …`。②`POST /v1/chat.sendMessage`。③刷新仍在 | core+setting | `composer.slash.execute` | `processSlashCommand.ts:55-61` |
| `composer.state.slash.denied` | 已知命令但无 permission | `/cmd`（自己缺 permission）→ Send | `command.permission` 失败 | `[读]` ①ephemeral `You_do_not_have_permission_to_execute_this_command`。②无 `commands.run`。③不 persist | core+permission | `composer.slash.execute` | `processSlashCommand.ts:66-68` |
| `composer.state.slash.app.commands` | App 经 commands.list 注入同一 palette（扩展面 1） | 启用带 slash 的 app → `/` | `GET /v1/commands.list` → `slashCommands.add`；stream `command/removed\|disabled` 失效 | `[读]` ①Commands 里出现 app 的 `cmd`（无单独 Apps 分区）。②目录 GET；执行仍 `commands.run`（带 `appId` trigger）。③app 仍启用则刷新后仍在表 | app | `composer.popup.slash-command` | `useAppSlashCommands.ts:32-87`；`app/apps/server/bridges/commands.ts:100-120` |
| `composer.popup.slash.preview` | `providesPreview` 命令：横预览后 POST 执行（扩展面 2） | `/cmd ` + 参数（该命令 `providesPreview`）→ 点 preview 或 Enter | `slashCommands.commands[cmd].providesPreview` | `[读]` ①menu 内 `role=listbox`/`role=option`（loading 时 Skeleton×5）。②`GET /v1/commands.preview`；选中 `POST /v1/commands.preview`。③`setText('')`；结果按命令 | core+app | `composer.popup.slash-preview` | `ComposerBoxPopupPreview.tsx:31-76,102-133`；`useComposerBoxPopupQueries.ts:18-23` |

本表数据行：**9**。计数见附录验算。

## J. Canned `!`

**非 omni 房间 composer 没有 `!` popup。** Omni 房间的 `!` 关联 **08**，但仍是房间 composer 可见状态。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.popup.canned.absent-non-omni` | 普通 c/p/d 输入 `!` **不**开 canned 菜单 | 非 live 房间 → textarea `!` | 仅当 `Canned_Responses_Enable && isOmnichannelRoom` 才 `createMessageBoxPopupConfig({trigger:'!'})` | `[读]` ①无 `ComposerBoxPopup` 标题 `Canned_Responses`。②无 `canned-responses.get`。③`!` 只是字符。负向断言 | core | 08 | `ComposerPopupProvider.tsx:364-392` |
| `composer.popup.canned.omni.open` | live 房间 `!` 打开 canned 菜单 | omni 且已进入 `ComposerMessage`（非 hold/inquiry/closed）→ `!` | `Canned_Responses_Enable`；`view-canned-responses`；`triggerAnywhere:true` | `[读]` ①menu 标题 `Canned_Responses`。②`GET /v1/canned-responses.get` + stream `canned-responses`。③popup 关 | EE/omni | 08 | `ComposerPopupProvider.tsx:364-392`；`useCannedResponsesQuery.ts:14-18` |
| `composer.popup.canned.omni.empty` | 快捷码无匹配 | `!zzz` | query 过滤空 | `[读]` ①`No_results_found`。②无新写。③无替换 | EE/omni | 08 | `ComposerBoxPopup.tsx:99` |
| `composer.popup.canned.omni.select` | 选一项用全文替换 `!filter` | ↑↓ Enter/Tab 或点击 | 有 option | `[读]` ①`!…` 换成 canned `text`。②无执行 REST。③随草稿 | EE/omni | 08 | `ComposerPopupProvider.tsx:376-388` |

本表数据行：**4**。计数见附录验算。

## K. Quote bar

引用**进入**来自消息工具栏 Quote（01 `msg.quote`），03 只写了 bar 展示。本册写 bar 上的状态。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.quote.add` | 工具栏 Quote 后 composer 上方出现引用块 | 房间消息 → 悬停 → Quote（01）；或 `?reply=` | `quotedMessages.length>0`；链长 `Message_QuoteChainLimit` | `[读]` ①textarea 上 `QuoteAttachment` 块。②点击无 REST；URL 路径可能 `GET /v1/chat.getMessage`。③仅内存；刷新掉（除非 URL 仍带 `?reply=`） | core | `msg.quote`；`implicit.quote.barDisplay` | `MessageBoxReplies.tsx:16-26`；`createComposerAPI.ts:113-116` |
| `composer.state.quote.dismiss` | 关掉单条引用 chip | 引用块右上 `aria-label=Dismiss_quoted_message` | 该 mid 仍在 quoted 列表 | `[读]` ①该块消失。②无 REST。③session | core | `implicit.quote.dismissOne` | `MessageBoxReply.tsx:44-51` |
| `composer.state.quote.send` | 带着引用发出，bar 乐观清空 | 有 quote → 输入（可空若有附件）→ Send | `composeMessage` 把 quotes 写入 `msg` | `[读]` ①bar 立刻清空；消息带引用附件。②`POST /v1/chat.sendMessage`。③引用在消息上 persist；composer bar 不在 | core | `composer.send` | `sendMessage.ts:96-119` |

本表数据行：**3**。计数见附录验算。

## L. Drafts：persist / restore / discard / 切房 / 刷新

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.draft.persist` | 打字 debounce 写入 localStorage | 房间或线程 composer 输入 | key=`messagebox_{rid}[-{tmid}]`；300ms | `[读]` ①textarea 值变。②无 REST。③同标签刷新可从 local 恢复（在 flush 清掉前） | core | `implicit.draft.persistLocal` | `useDraft.ts:4-33`；`createComposerAPI.ts:42-44,287` |
| `composer.state.draft.flush` | 卸载 composer 时同步服务器并清 local | 输入后切到另一房间 / 关线程（textarea ref=null） | `draft!==serverDraft`；`tmid && !threadExists` 则跳过 | `[读]` ①成功后 local key remove。②`POST /v1/rooms.saveDraft` `{rid,draft,tmid?}`。③他端/刷新从 `subscription.draft` / `threadDrafts[tmid]` 回来 | core | `implicit.draft.flushServer` | `useDraft.ts:36-55`；`MessageBox.tsx:144-146` |
| `composer.state.draft.restore` | 再进房间/线程预填 | A 打字离开 → 再进 A | 优先 server draft，否则 local | `[读]` ①textarea 预填。②无单独 GET（订阅字段）。③server draft 跨刷新仍在 | core | `implicit.draft.restore` | `useDraft.ts:19`；`MessageBox.tsx:135-140` |
| `composer.state.draft.discard` | 发送成功立刻清空本地文本 | 发出新消息或带附件发送 | `composer.clear()` 在 send/upload 成功路径 | `[读]` ①textarea 空。②随后卸载才 `saveDraft` 空串。③刷新不再出现已发正文 | core | `composer.send` | `sendMessage.ts:34,48` |
| `composer.state.draft.room-switch` | 切房：旧房 flush，新房 restore | A 打字 → 点侧栏 B → 再回 A | `ComposerMessage` 按房间挂载；unmount flush | `[读]` ①B 的 textarea 是 B 的草稿；回 A 恢复 A。②A 的 `rooms.saveDraft`。③两边独立 key | core | `implicit.draft.flushServer` | `ComposerMessage.tsx:91`；`useDraft.ts:5` |
| `composer.state.draft.reload` | 整页刷新：server 优先，否则 local | A 打字（未切房、local 已写）→ F5 | `initialValue = serverDraft \|\| localStorage` | `[读]` ①刷新后预填。②若从未 flush 且 local 还在则恢复；若已 flush 则 server。③`[待渲染实测]` 仅 server、无 local 的跨设备时序 | core | `implicit.draft.restore` | `useDraft.ts:19` |

本表数据行：**6**。计数见附录验算。

## M. Typing indicator

**没有**「关闭房间内 typing」的用户偏好。`UI_Use_Real_Name` 只改 activity 里的名字。联邦可用 `Federation_Service_EDU_Process_Typing` 关掉跨服 typing。Embedded 用 CSS 藏指示器。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.typing.start` | 自己非空输入时广播 typing | 非空 composer 按非 Enter/Esc/方向修饰键 | `onTyping` 且 `text.trim()!==''` | `[读]` ①对方 `role=status` 出现 `is_typing`。②`sdk.publish notify-room {rid}/user-activity` `user-typing`。③约 15s 超时，不 persist | core | `implicit.typing.start` | `ComposerMessage.tsx:68-73`；`UserAction.ts:10-18,114+` |
| `composer.state.typing.stop` | 清空或发送后停止 | 清空输入 **或** Send 成功路径先 `action.stop('typing')` | 有过 start | `[读]` ①对方 status 该动作清空。②stop publish。③无残留 | core | `implicit.typing.stop` | `ComposerMessage.tsx:54-56,69-71` |
| `composer.state.typing.multi` | 多人同时 typing 拼文案 | ≥2 人在同一 rid/tmid 输入 | `users.length>1` → `are_typing` | `[读]` ①`role=status` `u1, u2 are_typing`；混有 recording 时 recording 优先。②stream。③ephemeral | core | `implicit.typing.display` | `ComposerUserActionIndicator.tsx:9-14,70-74` |
| `composer.state.typing.truncated` | ≥5 人截成 and others | ≥5 个 username | `maxUsernames=5` | `[读]` ①前 4 名 + `and` `others`。②stream。③ephemeral。`[待渲染实测]` 拼接空格 | core | `implicit.typing.display` | `ComposerUserActionIndicator.tsx:7,70-72` |
| `composer.state.typing.setting-off` | 能关掉指示的只有联邦 EDU / embedded CSS；无账号级开关 | 联邦房关 `Federation_Service_EDU_Process_Typing`；或 embedded 开房间 | 无 `useUserPreference` 藏 typing。联邦 setting；embedded `.users-typing{display:none}` | `[读]` ①联邦：对方无 typing status。embedded：`role=status` 被 CSS 藏。普通房间关不掉。②联邦不发/不收 EDU typing。③设置 persist | core+setting | `implicit.typing.display` | `en.i18n.json` `Federation_Service_EDU_Process_Typing`；`RoomComposer.tsx:16-18`；`UserAction.ts:31-38` |

本表数据行：**5**。计数见附录验算。

## N. Location / WebDAV / discussion / timestamp / apps + 房间内看得见的 omni extras

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.location.prompt` | 定位权限未决：先说明再 Continue | More → Share → `Location` | `MapView_Enabled`；geolocation；`MapView_GMapsAPIKey`；`!federated`；`!disableBasicActions` | `[待渲染实测]` ①`GenericModal` `You_will_be_asked_for_permissions` `Continue`。②无消息 REST。③不 persist | core+setting | `composer.action.share-location` | `useShareLocationAction.tsx:17-31`；`ShareLocationModal.tsx:70-79` |
| `composer.state.location.denied` | 定位拒绝或拿不到坐标 | Continue 后拒 / 无 position | `denied \|\| !positionData` | `[待渲染实测]` ①modal `Cannot_share_your_location` 仅 Ok。②无 `chat.sendMessage`。③无消息 | core | `composer.action.share-location` | `ShareLocationModal.tsx:82-87` |
| `composer.state.location.share` | 预览地图后发出 Point | 允许定位 → `Share` | granted + position | `[待渲染实测]` ①`MapView` + `Share`；发出后 modal 关。②`POST /v1/chat.sendMessage` `location.Point`。③刷新后地图附件仍在 | core+setting | `composer.send` | `ShareLocationModal.tsx:90-93` |
| `composer.state.webdav.add` | 添加 WebDAV 账号 | More → Create new → `Add_Server` → 填表提交 | `Webdav_Integration_Enabled`；项 `disabled=!isSuccess` | `[待渲染实测]` ①`AddWebdavAccountModal`。②Meteor `addWebdavAccount`；列表 `GET /v1/webdav.getMyAccounts`。③账号刷新后仍在 More | core+setting | `composer.action.webdav-add` | `useWebdavActions.tsx:12-33` |
| `composer.state.webdav.pick` | 从已连账户选文件入队 | More → 账户名 → picker 点文件 | query success 且有账户 | `[待渲染实测]` ①`WebdavFilePickerModal`；选中后 chip。②`getWebdavFileList` / `getFileFromWebdav` 再 `rooms.media`。③同 upload | core+setting | `composer.action.webdav-upload` | `useWebdavActions.tsx:35-43`；`WebdavFilePickerModal.tsx:128-147` |
| `composer.state.discussion.open` | 从 composer 打开创建讨论 | More → Create new → `Discussion` | `Discussion_enabled`；`start-discussion` 或 `start-discussion-other-user`；`!federated` | `[待渲染实测]` ①`GenericModal` `Discussion_title`；父房/名/话题/成员/首帖/加密开关。②无直到提交。③modal 不 persist | core+permission+setting | `composer.action.create-discussion` | `useCreateDiscussionAction.tsx:16-31`；`CreateDiscussion.tsx` |
| `composer.state.discussion.submit` | 提交创建并跳进新讨论 | modal 填必填名 → 确认 | 父房加密则首帖 textarea disabled、加密开关 locked | `[待渲染实测]` ①modal 关；导航到新讨论。②`POST /v1/rooms.createDiscussion`。③新房间刷新仍在 | core+permission | `composer.action.create-discussion` | `CreateDiscussion.tsx:53,82,190-205` |
| `composer.state.timestamp.open` | 打开时间戳选择器 | More → Insert → `Timestamp` | disabled 仅 `!canSend \|\| isRecording`（**编辑态仍可用**） | `[待渲染实测]` ①`GenericModal` `Insert_timestamp`；Date/Time/Format/Timezone。②无 REST。③不 persist | core | `composer.action.timestamp` | `useTimestampAction.tsx:8-26`；`TimestampPickerModal.tsx:64-71` |
| `composer.state.timestamp.insert` | 把 markup 插入 composer | 有效日期 → Add | `!isValid` 则 Add disabled | `[读]` ①modal 关；textarea 插入 timestamp markup。②无 REST。③随草稿 | core | `composer.send` | `TimestampPickerModal.tsx:46-52,64` |
| `composer.state.apps.emit` | 点 Apps 段按钮发 UiKit | More → Apps → `{appId}/{actionId}` | `GET` actionButtons `context=messageBoxAction`；`useApplyButtonFilters`；`!disableBasicActions` | `[待渲染实测]` ①运行时 app label；可能再出 UiKit modal。②`emitInteraction` `type=actionButton` `{rid,tmid,actionId}`；目录 `GET /apps/actionButtons`。③按钮随 app 启用 persist | app | `composer.action.apps` | `useMessageboxAppsActionButtons.ts:12-61`；`MessageBoxActionsToolbar.tsx:105-126` |
| `composer.state.apps.timeout` | UiKit 交互超时 toast | 点 app 钮后 app 不响应 | `UiKitTriggerTimeoutError` | `[读]` ①toast `UIKit_Interaction_Timeout`。②interaction 已发。③无本地状态 | app | `composer.action.apps` | `useMessageboxAppsActionButtons.ts:40-44` |
| `composer.state.omni.hold` | 会话挂起：页脚 Resume，无 textarea | live `room.onHold` → `Resume` | 容器在 inquiry/join 之前；关联 **08** | `[读]` ①`chat_on_hold_due_to_inactivity` + `Resume`（pending 时 disabled）。②`POST /v1/livechat/room.resumeOnHold`。③`onHold` 刷新仍在直到恢复 | core+omni | 08 | `ComposerOmnichannel.tsx:44-49`；`ComposerOmnichannelOnHold.tsx:15-22` |
| `composer.state.omni.inquiry` | 队列预览：Take_it（离线/不可用则禁） | 未 `servedBy` 且有 `queuedAt` → `Take_it` | 离线 title `You_cant_take_chats_offline`；不可用 `You_cants_take_chats_unavailable` | `[读]` ①`you_are_in_preview_mode_of_incoming_livechat`；`aria-busy` 加载。②`GET /v1/livechat/inquiries.getOne`；`POST /v1/livechat/inquiries.take`。③接起后变正常 composer | core+omni | 08 | `ComposerOmnichannelInquiry.tsx:42-60` |
| `composer.state.omni.callout` | 未知联系人条：Add_contact / Block / Dismiss | 进入 live 且 `contact.unknown` 且未 dismiss | 在所有 omni 页脚之上；`sessionStorage contact-unknown-callout-{id}` | `[读]` ①`Callout` `role=status`；`Add_contact` `Block`/`Unblock` `Dismiss`。②`GET /v1/omnichannel/contacts.get`。③Dismiss 仅 session；联系人状态 server | core+omni | 08 | `ComposerOmnichannelCallout.tsx:35-58` |

本表数据行：**14**。计数见附录验算。

## O. 加密 / 联邦 / 其余容器约束（房间 composer 上仍看得到）

与 A/B 重叠的只读/屏蔽/Join 不重复。这里是**整页替换 MessageBox**且后果不同的状态。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.constraint.federation.invalid` | 非原生联邦房禁止输入 | 打开 `isRoomFederated && !isRoomNativeFederated` | 容器 `isFederation` + `blocked` | `[读]` ①callout `Federation_Matrix_Federated_Description_invalid_version` + 外链。②无 REST。③房间类型刷新不变 | core | `composer.variant.federation.invalid-version` | `ComposerFederation.tsx:17-18`；`ComposerFederationInvalidVersion.tsx:7-18` |
| `composer.state.constraint.federation.disabled` | 联邦总开关关 | 原生联邦但 `!Federation_Matrix_enabled && !Federation_Service_Enabled` | `useIsFederationEnabled()` 假 | `[读]` ①`Federation_Matrix_Federated_Description_disabled`。②无。③设置 persist | core+setting | `composer.variant.federation.disabled` | `ComposerFederation.tsx:21-22` |
| `composer.state.constraint.federation.premium` | 无 federation 许可 | 联邦已开但 `useHasLicenseModule('federation')` 假 | license 模块 | `[读]` ①`Federation_Matrix_join_public_rooms_is_premium`。②无。③许可未变则仍禁 | core+license | `composer.variant.federation.premium` | `ComposerFederation.tsx:25-26` |
| `composer.state.constraint.airgapped` | 空窗到期只读页脚 | `Cloud_Workspace_AirGapped_Restrictions_Remaining_Days===0` → 任意房间 | `useAirGappedRestriction()[0]` | `[读]` ①`Composer_readonly_airgapped`；无 textarea。②无。③设置/许可 persist | core+license | `composer.variant.air-gapped` | `ComposerContainer.tsx:43-44`；`ComposerAirGappedRestricted.tsx:6-16` |
| `composer.state.constraint.archived` | 归档房无输入 | `room.archived` 或 DM `subscription.archived` | `useMessageComposerIsArchived` | `[读]` ①`Room_archived`。②无。③归档未解则仍如此 | core | `composer.variant.archived` | `ComposerContainer.tsx:63-64`；`ComposerArchived.tsx:8-10` |
| `composer.state.constraint.omni.closed` | 已关闭会话无输入 | live `!room.open` | omni 路由第一分支 | `[读]` ①`This_conversation_is_already_closed`（仍可能有 unknown-contact callout）。②无 send。③`open` persist | core+omni | 08 | `ComposerOmnichannel.tsx:26-32` |
| `composer.state.constraint.omni.mac` | MAC 超限无输入 | live 且 `isRoomOverMacLimit` | 在 hold 之前 | `[读]` ①`Workspace_exceeded_MAC_limit_disclaimer`。②无。③许可/用量 persist | core+license+omni | 08 | `ComposerOmnichannel.tsx:35-40` |
| `composer.state.constraint.omni.dept-nav.absent` | 房间 composer **没有**部门选择 / 会话前进后退 | 打开 live 已接管会话，看页脚 | `ComposerOmnichannel/*` 无 department/navigation 控件。部门在转发等 08 表面 | `[读]` ①页脚只有 `ComposerMessage`（+ callout）；无 dept `<select>`、无 prev/next 会话钮。②无。③负向断言。↑↓ 仍是编辑上/下一条消息 | core+omni | 08 | `ComposerOmnichannel.tsx:71-75`；`MessageBox.tsx:251-276` |

本表数据行：**8**。计数见附录验算。

## P. Thread composer vs room composer

房间：`RoomComposer` `aria-label=Room_composer`。线程：`aria-label=Thread_composer` + `tmid` + 可选 checkbox。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `composer.state.thread.tmid` | 线程里发送带 tmid（房间发送不带） | 顶栏 Threads → 开线程 → 底部输入 → Send | `ChatProvider tmid`；其余同 `canSend` | `[读]` ①`RoomComposer` `aria-label=Thread_composer`；线程列表新 listitem。②`POST /v1/chat.sendMessage` 带 `tmid`。③刷新仍在该线程 | core | `thread.composer.reply` | `ThreadChat.tsx:113-122`；`data.ts:29-31` |
| `composer.state.thread.also-send-on` | 勾选后回复同时出现在频道 | 勾 `Also_send_to_channel` → Send | 偏好 `alsoSendThreadToChannel`：`always` 默认勾；`default` 且 `!tcount` 默认勾 | `[读]` ①checkbox `name=alsoSendThreadToChannel` checked。②发送体 `tshow:true`。③频道刷新可见该回复 | core+preference | `thread.composer.alsoSendToChannel` | `ThreadChat.tsx:29-40,122-134` |
| `composer.state.thread.also-send-off` | 不勾则只在线程 | 去勾（或偏好 `never`）→ Send | 同左，checked=false | `[读]` ①checkbox 未勾。②无 `tshow`。③频道时间线不出现该回复 | core+preference | `thread.composer.alsoSendToChannel` | `ThreadChat.tsx:122-134` |
| `composer.state.thread.escape` | 空内容 Esc 关线程面板（房间无此回调） | 焦点线程 composer 且 trim 空且非编辑 → Escape | `onEscape` → `closeTab`；编辑中 Esc 先取消编辑 | `[读]` ①`rcx-thread-view` 消失。②无 REST。③刷新无 tmid 则不再开 | core | `thread.composer.escapeLeave` | `ThreadChat.tsx:50-52,119`；`MessageBox.tsx:245-248` |
| `composer.state.thread.draft-key` | 线程草稿与房间草稿分 key | 房间打字、线程打字，分别离开再回来 | 房间 `messagebox_{rid}`；线程 `messagebox_{rid}-{tmid}`；server `draft` vs `threadDrafts[tmid]` | `[读]` ①两个 textarea 互不覆盖。②各走 `rooms.saveDraft`（线程带 `tmid`）。③两边独立 persist | core | `implicit.draft.persistLocal` | `useDraft.ts:5,19`；`ThreadChat.tsx:115-116` |

本表数据行：**5**。计数见附录验算。

## [待渲染实测] 汇总清单

UNION：01–11 功能分册 + 05 完备性清单。每条标注 booklet + 相关 id。非空。

### 01 · `01-message-toolbar.md`

1. 工具栏变为可见的精确用户手势（hover / focus-within / 长按 / IntersectionObserver） — booklet 01；id （表面级，影响全部 `msg.*` 入口）
2. 各图标/菜单项 accessible name（title vs aria-label vs 可见文本） — booklet 01；id （全部 `msg.*`）
3. `More` / `AI_Actions` 是 title 还是 aria-label；菜单是 menu 还是 dialog — booklet 01；id `msg.apps.action` `msg.apps.ai`
4. Pin / Delete / Report / Forward / Discussion / WebDAV / Read receipts / Reaction list / CreateDiscussion 模态 role+标题 — booklet 01；id `msg.pin` `msg.delete` `msg.report` `msg.forward` `msg.discussion.start` `msg.webdav.save` `msg.read-receipts` `msg.reaction.list`
5. Quote 引用条、Edit composer、Follow 线程图标的 role+name — booklet 01；id `msg.quote` `msg.edit` `msg.thread.follow`
6. Jump 后时间线高亮节点 role+name — booklet 01；id `msg.jump`
7. Mark unread 后面板房间行如何暴露未读 — booklet 01；id `msg.unread.mark`
8. Translate / View original 后正文容器 name — booklet 01；id `msg.translate` `msg.translate.original`
9. Reply in DM 后 composer 引用预览 — booklet 01；id `msg.reply.dm`
10. `message-mobile` / `direct` 是否仍有隐藏赋值 — booklet 01；id `msg.*` 在表 B.message-mobile / B.direct
11. 顶栏是图标还是 Options kebab — booklet 01；id （进入 pinned/starred/mentions/search/threads 的前缀）
12. 无 marketplace 应用时 Apps / AI 是否完全不出现 — booklet 01；id `msg.apps.action` `msg.apps.ai`
13. E2EE 下 Apps section 的 Unavailable 是否以 menu item 暴露 — booklet 01；id `msg.apps.action`
14. Forward 模态 Copy_Link 与 More Copy_link 的可访问名是否可区分 — booklet 01；id `msg.forward` `msg.permalink.copy`
15. mentions/search 在 data.length===0 时是否没有任何 kebab — booklet 01；id `msg.webdav.save` 于 B.mentions / B.search

### 02 · `02-room-user-nav.md`

1. complementary/dialog 的真实 role+accessible name — booklet 02；id 全部 `room.toolbox.*` `user.card.*` `nav.*`
2. roomToolboxExpanded：lg+ 前 6  vs 窄屏进 Options — booklet 02；id 全部 `room.toolbox.*`
3. Featured 三键与 Options 分段可见顺序 — booklet 02；id `room.toolbox.start-video-call` `room.toolbox.start-voice-call` `room.toolbox.ai-actions` `room.apps.toolbox-inject`
4. 点房间标题 vs 工具栏 info 是否同一 tab — booklet 02；id `room.header.title-open-info`
5. Favorite 星标 filled/outline 与 toast — booklet 02；id `room.header.favorite`
6. Add_topic 仅空主题+可编辑出现 — booklet 02；id `room.header.topic-add`
7. User_card 打开定位与 Close — booklet 02；id `user.card.open`
8. UserCard featured=3 vs UserInfo featured=2 vs 成员行全 kebab — booklet 02；id `user.card.*` `user.action.*`
9. owner/leader/moderator 文案双态与联邦 warning — booklet 02；id `user.action.change-owner` `user.action.change-leader` `user.action.change-moderator`
10. Mute/Remove/Ban/Report 的 danger dialog 标题 — booklet 02；id `user.action.mute` `user.action.remove` `user.action.ban` `user.action.report`
11. Block 仅 1:1 DM 出现 — booklet 02；id `user.action.block`
12. NavBar mobile/tablet 显隐 — booklet 02；id `nav.pages.*` `nav.sort.*` `nav.marketplace.*`
13. Display 与 Group_by Favorites 在 secondarySidebar ON 时消失 — booklet 02；id `nav.sort.display.*` `nav.sort.group.favorites`
14. Create_new 仅 outbound 权限时是否空菜单 — booklet 02；id `nav.create.outbound`
15. AI 搜索 vs classic 搜索 listbox 名称 — booklet 02；id `nav.search.rooms` `nav.search.ai`
16. Manage 齿轮在无权限时整颗不出现 — booklet 02；id `nav.manage.workspace`
17. 状态点颜色与 Presence_broadcast_disabled — booklet 02；id `nav.user.status.*`
18. V2 主栏 tab aria-selected 与副栏 tabpanel — booklet 02；id `sidebar.filter.*`
19. sidebarGroups / sidePanelFilters localStorage 真机刷新 — booklet 02；id `sidebar.group.collapse` `sidebar.sidepanel.unread-toggle`
20. Apps 三面无 app 时整段不渲染 — booklet 02；id `room.apps.toolbox-inject` `room.toolbox.ai-actions` `nav.user.apps-inject`
21. E2EE 设置态工具箱是否只剩 3 键 — booklet 02；id `room.toolbox.channel-settings` `room.toolbox.members-list` `room.toolbox.e2e`
22. Omnichannel QuickActions 不与 toolbox 混淆 — booklet 02；对照 06 `room.quick.*` / 08 `omni.agent.*`
23. nav.user.status.visibility 保存 endpoint — booklet 02；id `nav.user.status.visibility`
24. 视频/语音弹层与 Call_history 行对应 — booklet 02；id `room.toolbox.start-video-call` `nav.voip.history`

### 03 · `03-composer-implicit.md`

1. GenericMenu 最终 role+name — booklet 03；id `composer.format.overflow-dropdown` `composer.action.more-menu` `implicit.roomInfo.kebab.open`
2. EmojiPicker tablist 树 — booklet 03；id `composer.emoji.picker`
3. 运行时 app 按钮可见 label — booklet 03；id `composer.action.apps`
4. CreateDiscussion 表单控件 name — booklet 03；id `composer.action.create-discussion`
5. Share location 逐步 role — booklet 03；id `composer.action.share-location`
6. TimestampPicker spinbutton/select name — booklet 03；id `composer.action.timestamp`
7. 两个 WebDAV modal 的 dialog name — booklet 03；id `composer.action.webdav-add` `composer.action.webdav-upload`
8. 多条 quote 堆叠的 list 结构 — booklet 03；id `implicit.quote.barDisplay`
9. 线程 expand portal 焦点与 backdrop — booklet 03；id `thread.panel.toggleExpand`
10. 选择模式第一个 checkbox 是否自动获焦 — booklet 03；id `implicit.select.toggleMessage`
11. New_messages / Jump_to_recent Bubble accessible name — booklet 03；id `implicit.scroll.newMessagesButton` `implicit.scroll.jumpToRecent`
12. Shift+Esc / Ctrl+Esc 无其它全局 listener — booklet 03；id `shortcut.global.markAllAsRead.documented-unbound`
13. ≥5 人 typing 的 and others 文案 — booklet 03；id `implicit.typing.display`
14. 跨设备仅 server draft 的恢复时序 — booklet 03；id `implicit.draft.flushServer`
15. composer 图片 chip 是否打开 ImageGallery — booklet 03；id （03 不单列 id）
16. federation callout 的 role — booklet 03；id `composer.variant.federation.invalid-version` `composer.variant.federation.disabled` `composer.variant.federation.premium`
17. AnnouncementBanner 自身 role — booklet 03；id `implicit.banner.announcementOpen`
18. 摄像机权限被拒时 toast vs 浮层 — booklet 03；id `composer.action.video-message`
19. DnD overlay dropEffect / z-index — booklet 03；id `implicit.upload.dragEnterOverlay`
20. Add_link dialog name 是否等于 Add_link — booklet 03；id `composer.format.link`

### 04 · `04-routes-and-shell.md`

1. 顶栏 Home / Directory / Marketplace / Manage / 头像菜单在桌面、平板、mobile 的可见性 — booklet 04；id `route.home` `route.directory` `route.marketplace` `route.admin.home` `account.profile`
2. /account /admin /marketplace /omnichannel 的 index replace 落点 — booklet 04；id `account.profile` `route.admin.home` `route.marketplace` `route.omnichannel`
3. Directory 四 tab 权限页 vs 表；external 是否始终隐藏 — booklet 04；id `directory.channels` `directory.users` `directory.teams` `directory.external`
4. 登录壳：forceLogin、匿名读、注册模式、忘记密码链 — booklet 04；id `route.login` `route.register` `route.forgot-password`
5. Setup wizard 三态 — booklet 04；id `route.setup-wizard`
6. 审计三项在无 auditing 许可证时菜单与直达 URL — booklet 04；id `route.audit` `route.audit-log` `route.security-logs`
7. route.search 无 AI 许可 / 未开 preview / 未开设置时的三种 Callout — booklet 04；id `route.search`
8. team.create 缺 create-c/create-p 时 + 菜单是否隐藏 Team — booklet 04；id `team.create`
9. 管理侧栏 22 项无权是否不渲染 — booklet 04；id `route.admin.workspace` … `route.admin.settings`
10. CMS 三页是否有产品内链 — booklet 04；id `route.terms-of-service` `route.privacy-policy` `route.legal-notice`

### 05 · `05-completeness.md`

1. 每个「已入行」views/ 目录的入口在默认工作区是否可点到 — booklet 05；id 见完备性自查记录
2. navigation 在 secondarySidebar 开/关下是否仍只是房间列表 — booklet 05；id 已交 02 `sidebar.*` `nav.*`
3. outlookCalendar 是否仅以房间 tab 出现 — booklet 05；id `room.toolbox.outlook-calendar`；内部见 06 `room.outlook.*`
4. Livechat widget 7 路由可达性（本仓库未跑 widget） — booklet 05 + 08；id `omni.widget.*`（不再 OOS，仍待实测）
5. i18n #9 Register 与 route.register 是否同一按钮文案 — booklet 05；id `route.register`
6. 管理设置 972 add 与 UI 组数 37 的对应 — booklet 05 + 07；id `page.admin.settings.open.*`（组级，字段级仍 OOS）
7. 全渠道 13+7 侧栏缺许可证时是否少 7 项 — booklet 05 + 08；id `omni.manager.*`
8. 市场无权限时是否 404 而非空壳 — booklet 05 + 09；id `route.marketplace` `mkt.explore.open`

### 06 · `06-room-panel-interiors.md`

1. `room.members.action.video-call` outgoing 会议弹层的真实 role+name — booklet 06；id `room.members.action.video-call`
2. `room.members.action.voice-call` voip widget / Call_history 行是否对应本次呼叫 — booklet 06；id `room.members.action.voice-call`
3. `room.search.filter-text` 查询串刷新后是否还在输入框 — booklet 06；id `room.search.filter-text`
4. `room.search.encrypted-callout` 加密房搜索实际命中哪些消息 — booklet 06；id `room.search.encrypted-callout`
5. `room.canned.use-from-list` / `room.canned.detail.use` 插入 composer 后草稿是否刷新仍在 — booklet 06；id `room.canned.use-from-list` `room.canned.detail.use`
6. `room.game.invite` 邀请 modal 提交所用具体 endpoint — booklet 06；id `room.game.invite`
7. Fuselage Select / MultiSelect / GenericMenu 项的 computed role — booklet 06；id （多表）
8. `useSplitRoomActions` 真机前 2 个主按钮是 Hide+Edit 还是 Hide+Leave — booklet 06；id `room.info.kebab`
9. 团队踢人 `RemoveUsersModal` 向导各步 — booklet 06；id `room.members.action.kick`
10. `room.teamChannels.create-new` 弹出的 CreateChannelModal 字段 — booklet 06；id `room.teamChannels.create-new`（字段在 07 `page.create.channel.*`）

### 07 · `07-page-interiors.md`

本册每一表体行至少有一处 `[待渲染实测]`。整页级优先补：

1. 创建模态：校验文案、toast、关闭时机、DM `onSettled` 失败仍关 — booklet 07；id `page.create.*`
2. Profile：头像裁剪、验证信、末位 owner 二次确认文案 — booklet 07；id `page.account.profile.*`
3. Preferences：accordion 默认开合、桌面通知权限浏览器差异 — booklet 07；id `page.account.preferences.*`
4. Security：TOTP QR、E2E Meteor method vs REST — booklet 07；id `page.account.security.*`
5. Directory：500ms debounce、空态、`view-outside-room` 未授权页 — booklet 07；id `page.directory.*`
6. Home：自定义 HTML 卡在无权限时的占位 — booklet 07；id `page.home.custom.*`
7. Admin：各表分页 count、Mailer dry-run、LDAP sync 耗时、Settings 组内字段数（有意不拆）、Reports 只读 JSON — booklet 07；id `page.admin.*`
8. Audit：`window.print()` 打印框、omnichannel 页签许可 — booklet 07；id `page.audit.*`

### 08 · `08-omnichannel-product.md`

1. 缺 `livechat-enterprise` 时 EE 7 侧栏是否消失 — booklet 08；id `omni.manager.reports.open` … `omni.manager.priorities.open`
2. Departments：仅 `view-livechat-departments`、无 `manage-livechat-departments` 时侧栏在、页 NotAuthorizedPage — booklet 08；id `omni.manager.departments.open`
3. Monitors：有许可证无 `manage-livechat-monitors` 时页是否仍开 — booklet 08；id `omni.manager.monitors.open`
4. 坐席 OFF 后顶栏 Queue、侧栏询价、`Take_it` disabled 是否同时发生 — booklet 08；id `omni.agent.status.consequences` `omni.agent.queue.take`
5. 营业时间关时自己点 toggle 是否 toast `error-business-hours-are-closed` — booklet 08；id `omni.agent.status.consequences`
6. Contact Center 经理路径与 `/omnichannel-directory` 是否同一套 tab/筛 — booklet 08；id `omni.manager.current.*` `omni.agent.directory.*`
7. 关单 wrap-up 在「无评论/无标签/无 transcript」时是否退化成简单确认 — booklet 08；id `omni.agent.close`
8. widget 七路由在嵌入脚本下的可达性 — booklet 08；id `omni.widget.*`
9. 外观 Premium 字段在 CE 是否只 disabled 而非隐藏 — booklet 08；id `omni.manager.appearance.save`
10. 优先级侧栏菜单与 Room_Info 下拉是否写同一 `priorityId` — booklet 08；id `omni.agent.sidepanel.priority` `omni.manager.priorities.edit`

### 09 · `09-marketplace-product.md`

1. 两权皆无是否 404（壳）而非空列表 — booklet 09；id `mkt.explore.open`
2. 仅 `access-marketplace` 进 `/marketplace/requested` 是否 NotAuthorizedPage — booklet 09；id `mkt.request.open`
3. 仅 `manage-apps`、无 `access-marketplace` 时 divider 是否消失、Explore 是否仍可进 — booklet 09；id `mkt.explore.open`
4. 已装非管理员行 ⋮ 是否真的没有 Enable/Disable — booklet 09；id `mkt.app.enable` `mkt.app.disable`
5. 更新蓝点与 `semver.lt(version, marketplaceVersion)` 是否一致 — booklet 09；id `mkt.app.update`
6. 私有上传无许可证是 Upgrade 按钮还是限制模态 — booklet 09；id `mkt.installed.upload`
7. Settings tab 在 App 无 settings 时是否整 tab 不渲染 — booklet 09；id `mkt.app.settings`
8. 订阅卸载提示是否先改订阅再 DELETE — booklet 09；id `mkt.app.uninstall`

### 10 · `10-message-timeline.md`

1. User_card / 线程栏 / Export dialog 的精确 role+name — booklet 10；id `tl.identity.*` `tl.select.export.*`
2. `hide-usernames` 时 `tl.identity.display-name` 是否仍可点 — booklet 10；id `tl.identity.display-name`
3. 反应芯片 toggle 后 `mine` 与计数的可访问名 — booklet 10；id `tl.reaction.toggle`
4. 图库 Next/Previous 与左右 chevron class 对调后的实际方向 — booklet 10；id `tl.attachment.gallery.*`
5. 单图 `preview-image` 灯箱与房间图库是否同一 `aria-label=Image_gallery` — booklet 10；id `tl.attachment.lightbox`
6. 音频/视频原生控件的无障碍名 — booklet 10；id `tl.attachment.audio` `tl.attachment.video`
7. `tl.action.link` 在无 register 时的错误 toast 文案 — booklet 10；id `tl.action.link`
8. 选择模式第一个 checkbox 是否自动获焦 — booklet 10；id `tl.select.toggle`（03 已列）
9. 广播 Reply 进入 DM 后引用条 name — booklet 10；id `tl.broadcast.reply`
10. oembed iframe（YouTube 等）内部控件不在 RC i18n — booklet 10；id `tl.oembed.open`
11. `discussion-created` 行在真实数据里是否同时显示讨论名正文 + `message_counter` — booklet 10；id `tl.discussion.open`
12. 联邦时间线除已读勾外是否还有只在运行时出现的 body 控件 — booklet 10；id `tl.*`

### 11 · `11-composer-states.md`

1. 录音前已有字时 Send 是否仍可点 — booklet 11；id `composer.state.send.disabled.recording`
2. Fuselage GenericMenu / FileUpload / ShareLocation / Timestamp / WebDAV / CreateDiscussion / Apps 的最终 dialog role+name — booklet 11；id `composer.state.*` extras
3. EmojiPicker tab/tabpanel 与 tone Options 的精确 name — booklet 11；id `composer.state.emoji.*`
4. `composer.state.typing.truncated` ≥5 人的空格拼接 — booklet 11；id `composer.state.typing.truncated`
5. `composer.state.draft.reload` 仅 server、无 localStorage 的跨设备时序 — booklet 11；id `composer.state.draft.reload`
6. Quote 多条堆叠的 list 结构 — booklet 11；id `composer.state.quote.add`
7. Video 开镜失败：toast vs 浮层谁先消失 — booklet 11；id `composer.state.video.permission-denied`
8. Omni callout `role=status` 与 Block/Unblock 文案 — booklet 11；id `composer.state.omni.callout`
9. 联邦 EDU 关时主 SPA 房间指示器是否仍显示本服用户 — booklet 11；id `composer.state.constraint.federation.*`
10. `composer.popup.mention.not-in-channel` 发送后是否弹出 `Add_them`（服务端 hook，非 popup） — booklet 11；id `composer.popup.mention.not-in-channel`

本清单条数 **135**（01=15，02=24，03=20，04=10，05=8，06=10，07=8，08=10，09=8，10=12，11=10）。

验算：`15+24=39`；`39+20=59`；`59+10=69`；`69+8=77`；`77+10=87`；`87+8=95`；`95+10=105`；`105+8=113`；`113+12=125`；`125+10=135`。

## 完备性自查记录

每个 `apps/meteor/client/views/` 子目录必须有立场：已入行（附 booklet）或 out of scope+原因+量级。禁止沉默目录。
Omnichannel / Marketplace **不再**是「仅侧栏入口 OOS」：08 / 09 已建产品行。Admin settings 仍是 **页/组级**，不是 972 key。

目录枚举命令：

```bash
ls -1 apps/meteor/client/views/
# 27：account admin audit banners cloud composer conference directory e2e home
#     hooks invite mailer marketplace mediaCallHistory modal navigation
#     notAuthorized notFound oauth OAuthTwoFactorAuthentication omnichannel
#     outlookCalendar room root search teams
```

| 目录 | 立场 | 证据命令 |
| --- | --- | --- |
| `account` | 已入行 — 04 `account.*`（整页入口）+ 07 `page.account.*`（控件） | `rg -c '^\| `account\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 9；`rg -c '^\| `page\.account\.[^`*]+\`' docs/qa/pm-feature-atlas/07-page-interiors.md` → 121 |
| `admin` | 已入行 — 04 `route.admin.*`（侧栏+HOME）+ 07 `page.admin.*`（页内控件，**组级** settings） | `rg -c '^\| `route\.admin\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 23；`rg -c '^\| `page\.admin\.[^`*]+\`' docs/qa/pm-feature-atlas/07-page-interiors.md` → 388 |
| `audit` | 已入行 — 04 三路由 + 07 `page.audit.*` | `rg -c '^\| `route\.audit\|^\| `route\.security-logs' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 3；`rg -c '^\| `page\.audit\.[^`*]+\`' docs/qa/pm-feature-atlas/07-page-interiors.md` → 20 |
| `banners` | out of scope — 全页横幅/UiKit banner，非路由目的地。magnitude: `find apps/meteor/client/views/banners -type f \| wc -l` → 5 | 见 05 §1 |
| `cloud` | out of scope — Cloud 公告覆盖层。magnitude: 2 files | `ls apps/meteor/client/views/cloud` |
| `composer` | 已入行 — 03 `composer.*` 入口 + 11 `composer.state.*`/`composer.fmt.*` 状态 | `rg -c '^\| `composer\.' docs/qa/pm-feature-atlas/03-composer-implicit.md`；`rg -c '^\| `composer\.(state\|fmt\|popup)\.' docs/qa/pm-feature-atlas/11-composer-states.md` → 133 |
| `conference` | 已入行 — 04 `route.conference` | `rg -c '^\| `route\.conference' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `directory` | 已入行 — 04 `directory.*` + 07 `page.directory.*` | `rg -c '^\| `directory\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 4；`rg -c '^\| `page\.directory\.[^`*]+\`' docs/qa/pm-feature-atlas/07-page-interiors.md` → 33 |
| `e2e` | 已入行 — 02 `room.toolbox.e2e` + 06 `room.info.e2ee.*`（确认/重置弹层）；无独立 route | `rg -c '^\| room\.info\.e2ee\.' docs/qa/pm-feature-atlas/06-room-panel-interiors.md` → 9 |
| `home` | 已入行 — 04 `route.home` + 07 `page.home.*` | `rg -c '^\| `route\.home' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1；`rg -c '^\| `page\.home\.[^`*]+\`' docs/qa/pm-feature-atlas/07-page-interiors.md` → 14 |
| `hooks` | out of scope — 跨页 hooks，不是用户目的地。magnitude: 10 files | `find apps/meteor/client/views/hooks -type f \| wc -l` |
| `invite` | 已入行 — 04 `route.invite` `route.register-secret-url` | `rg -c '^\| `route\.invite\|^\| `route\.register-secret-url' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 2 |
| `mailer` | 已入行 — 04 `route.mailer-unsubscribe` | `rg -c '^\| `route\.mailer-unsubscribe' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `marketplace` | 已入行 — 04 `route.marketplace`（壳）+ 09 `mkt.*`（列表/每应用）。**不再** sidebar-only OOS | `rg -c '^\| `mkt\.[a-z]+\.[a-z]' docs/qa/pm-feature-atlas/09-marketplace-product.md` → 29（裸 `mkt.` 会把验算 4 条 `mkt.*.*` 算进去 → 33） |
| `mediaCallHistory` | 已入行 — 04 `route.call-history` | `rg -c '^\| `route\.call-history' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `modal` | out of scope — UiKit modal 挂载区。magnitude: 3 files | `ls apps/meteor/client/views/modal` |
| `navigation` | 已入行 — 02 `sidebar.*`/`nav.*` + 06 `sidebar.roomMenu.*` | `rg -c '^\| sidebar\.' docs/qa/pm-feature-atlas/02-room-user-nav.md` → 9；`rg -c '^\| sidebar\.roomMenu\.' docs/qa/pm-feature-atlas/06-room-panel-interiors.md` → 12 |
| `notAuthorized` | out of scope — 内嵌未授权页，非独立目的地。magnitude: 2 files | `ls apps/meteor/client/views/notAuthorized` |
| `notFound` | 已入行 — 04 `route.not-found` | `rg -c '^\| `route\.not-found' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `oauth` | 已入行 — 04 `route.oauth-*` | `rg -c '^\| `route\.oauth-' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 2 |
| `OAuthTwoFactorAuthentication` | 已入行 — 04 `route.2fa` | `rg -c '^\| `route\.2fa' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `omnichannel` | 已入行 — 04 `route.omnichannel`（壳）+ 08 `omni.agent.*`/`omni.manager.*`/`omni.widget.*`。**不再** sidebar-only OOS | `rg -c '^\| `omni\.' docs/qa/pm-feature-atlas/08-omnichannel-product.md` → 136 |
| `outlookCalendar` | 已入行 — 02 `room.toolbox.outlook-calendar` + 06 `room.outlook.*` | `rg -c '^\| room\.outlook\.' docs/qa/pm-feature-atlas/06-room-panel-interiors.md` → 8 |
| `room` | 已入行 — 01 `msg.*` + 02 `room.*`/`user.*` + 03 `implicit.*`/`thread.*`/`composer.*` + 06 面板内部 + 10 `tl.*` + 11 composer 状态 | `find apps/meteor/client/views/room -type f \| wc -l` → 509 |
| `root` | 已入行 — 04 `route.login` `route.setup-wizard` `route.token-login` `route.saml` | 见 04 |
| `search` | 已入行 — 04 `route.search` | `rg -c '^\| `route\.search' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `teams` | 已入行 — 04 `team.create` `directory.teams`；02 `room.toolbox.team-*`；06 `room.info.team.*`/`room.teamChannels.*`；07 `page.create.team.*` | 见各分册 grep |

**27/27 有立场。** 兄弟 views 树（05 §2）更新：`packages/livechat/src/routes` **已入行** — booklet 08 `omni.widget.*`（15 行，7 widget 路由）。`packages/ui-client/src/views` → `route.setup-wizard`；`packages/ui-voip/src/views` → `route.call-history` + 通话控件；`packages/web-ui-registration` → 登录壳 04 行；livechat/ui legacy views 仍 OOS。

## Out of scope

只列**合并后仍在的洞**。全渠道/市场页级控件已由 08/09 吃掉，不再当作「仅入口 OOS」。Admin settings 保持页/组级。

### 管理设置字段级（仍 OOS）

07 写到 `page.admin.settings.open.*`（打开组）+ Save/Cancel/Reset + LDAP/OAuth/SAML/Email 具名危险动作。**不**逐 key。

```bash
rg "this\.add\('" apps/meteor/server/settings --glob '*.ts' | wc -l   # 791
rg "settingsRegistry\.add\(" apps/meteor/server/settings --glob '*.ts' | wc -l   # 18
rg "this\.add\('" apps/meteor/ee/server --glob '*.ts' --glob '!**/tests/**' | wc -l   # 97
rg "settingsRegistry\.add\(" apps/meteor/ee/server --glob '*.ts' --glob '!**/tests/**' | wc -l   # 19
rg "this\.add\('|settingsRegistry\.add\(" apps/meteor/server apps/meteor/ee/server --glob '*.ts' --glob '!**/tests/**' | wc -l   # 972
rg "addGroup\(" apps/meteor/server/settings --glob '*.ts' | wc -l   # 37
```

量级：约 10³ 条 setting 注册（972 次 add）。`page.admin.settings.open.*` = 41 组打开行，不是 972 字段。

### 第三方 App 设置 key（仍 OOS）

09 `mkt.app.settings` / `mkt.app.settings.save` 各一行覆盖「打开这张表单 / 保存」。不枚举每个第三方 App 的 settings schema key。

```bash
find apps/meteor/client/views/marketplace -type f | wc -l   # 195
```

量级：运行时 App 数 × 每 App settings 数组（不固定）。

### 全渠道表单细字段（仍 OOS）

08 覆盖侧栏 13+7 href 的页级动作与 widget 访客动作。仍不枚举：Appearance 每一个输入、部门表单每一个 EE 文本框、联系人每一个自定义字段。

```bash
find apps/meteor/client/views/omnichannel -type f | wc -l   # 480
rg -c "registerOmnichannelRoute\(" apps/meteor/client/views/omnichannel/routes.ts   # 20
```

### 其它剩余洞

| 项 | 命令/数字 | 理由 |
| --- | --- | --- |
| `banners` / `cloud` / `hooks` / `modal` / `notAuthorized` | `find` 5+2+10+3+2 files | 非用户目的地 / 挂载区 |
| EditRoomInfo `encrypted` | 06 边界；JSX 不渲染 | 加密走 toolbox E2EE |
| Apps UiKit contextual bar 运行时块 | `contextualBar/uikit` | 无稳定字段 id |
| `/omnichannel/queue` `/omnichannel/rooms` | `routes.ts` 有 path 类型，无 `registerOmnichannelRoute` | 08 不造行 |
| livechat/ui legacy views | `ls apps/meteor/app/livechat/client/views`；`app/ui/client/views` | 遗留碎片 |
| 时间线只读指示 | 10「验过无点击」 | 无 onClick，不计入功能行 |
| Directory External 页内 | `federationEnabled = false` | 07 只写「不渲染」行 |

## 与现行 atlas 的 id 集合差

先前本分支 `00-blueprint.md`（PR #5）已列出 01–04 的 NEW id（01=26，02=107，03=117，04=64）。
本节 **只列 06–11 相对那份 00 的 NEW id**。禁止用一个虚荣总行数当标题数字。

### 各表行数（命令）

```bash
# 先前 00 已有
python3 - <<'PY'
from pathlib import Path
p=Path('docs/qa/pm-feature-atlas/01-message-toolbar.md')
print('01 msg rows', sum(1 for l in p.read_text().splitlines() if l.startswith('| msg.')))
PY
rg -c '^\| (room|user|nav|sidebar)\.' docs/qa/pm-feature-atlas/02-room-user-nav.md
rg -c '^\| `' docs/qa/pm-feature-atlas/03-composer-implicit.md
rg -c '^\| `route\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '^\| `account\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '^\| `directory\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '^\| `team\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md

# NEW 06–11
rg -c '^\| (room\.|sidebar\.roomMenu\.)' docs/qa/pm-feature-atlas/06-room-panel-interiors.md
rg -c '^\| `page\.[^`*]+\`' docs/qa/pm-feature-atlas/07-page-interiors.md   # 623；裸 page. 含验算汇总 = 664
rg -c '^\| `omni\.agent\.' docs/qa/pm-feature-atlas/08-omnichannel-product.md
rg -c '^\| `omni\.manager\.' docs/qa/pm-feature-atlas/08-omnichannel-product.md
rg -c '^\| `omni\.widget\.' docs/qa/pm-feature-atlas/08-omnichannel-product.md
rg -c '^\| `mkt\.explore\.[a-z]' docs/qa/pm-feature-atlas/09-marketplace-product.md
rg -c '^\| `mkt\.installed\.[a-z]' docs/qa/pm-feature-atlas/09-marketplace-product.md
rg -c '^\| `mkt\.request\.[a-z]' docs/qa/pm-feature-atlas/09-marketplace-product.md
rg -c '^\| `mkt\.app\.[a-z]' docs/qa/pm-feature-atlas/09-marketplace-product.md
rg -c '^\| tl\.' docs/qa/pm-feature-atlas/10-message-timeline.md
rg -c '^\| `composer\.(state|fmt|popup)\.' docs/qa/pm-feature-atlas/11-composer-states.md
```

| 分册 | 表体行 | 稳定 id（去重） | 计数命令 |
| --- | --- | --- | --- |
| 01（已在先前 00） | 193 | 26 | `rg -c '^\| msg\.' 01`（含 B/C 复行）；去重 `sort -u` |
| 02（已在先前 00） | 107 | 107 | `rg -c '^\| (room\|user\|nav\|sidebar)\.' 02` |
| 03（已在先前 00） | 117 | 117 | `rg -c '^\| `' 03` |
| 04（已在先前 00） | 64 | 64 | `route` 50 + `account` 9 + `directory` 4 + `team` 1 |
| **06 NEW** | 306 | 306 | `rg -c '^\| (room\.|sidebar\.roomMenu\.)' 06` |
| **07 NEW** | 623 | 623 | `rg -c '^\| `page\.[^`*]+\`' 07`（裸 `page.` 会把 07 验算表 41 条 `page.*.*` 汇总行算进去 → 664） |
| **08 NEW** | 136 | 136 | `omni.agent` 39 + `omni.manager` 82 + `omni.widget` 15 |
| **09 NEW** | 29 | 29 | `mkt.explore` 5 + `installed` 5 + `request` 1 + `app` 18 |
| **10 NEW** | 72 | 72 | `rg -c '^\| tl\.' 10` |
| **11 NEW** | 133 | 133 | `rg -c '^\| `composer\.(state\|fmt\|popup)\.' 11` |

### NEW id 清单（相对先前 00 的 01–04；仅 06–11）

#### 分册 06

- `room.info.close` — 出处：分册 06 表行「关掉 Room Info 侧栏」；`ContextualbarClose.tsx:9`
- `room.info.kebab` — 出处：分册 06 表行「打开 Room Info 溢出菜单」；`RoomInfo.tsx:69`
- `room.info.action.hide` — 出处：分册 06 表行「从侧栏隐藏本房间」；`useHideRoomAction.tsx:23-88`
- `room.info.action.edit` — 出处：分册 06 表行「进入 EditRoomInfo」；`RoomInfoRouter.tsx:23,35`
- `room.info.action.leave` — 出处：分册 06 表行「离开本房间」；`useRoomLeave.tsx:12-58`
- `room.info.action.move-to-team` — 出处：分册 06 表行「把独立频道/组移进团队」；`useRoomMoveToTeam.tsx:9-38`
- `room.info.action.convert-to-team` — 出处：分册 06 表行「把频道/组转成团队」；`useRoomConvertToTeam.tsx:9-47`
- `room.info.action.delete` — 出处：分册 06 表行「删除房间（团队主房走团队删除弹层）」；`useDeleteRoom.tsx:12-102`
- `room.info.action.enter` — 出处：分册 06 表行「从 Info 进入房间」；`RoomInfoRouter.tsx:13,37-39`
- `room.info.action.enter.unwired` — 出处：分册 06 表行「Enter 在当前房间头路径未接线」；`rg onEnterRoom` 无房间头调用
- `room.info.team.close` — 出处：分册 06 表行「关掉 Team Info」；`TeamsInfo.tsx:50`
- `room.info.team.kebab` — 出处：分册 06 表行「打开 Team Info More」；`useSplitRoomActions.ts:14-27`
- `room.info.team.action.hide` — 出处：分册 06 表行「隐藏团队主房」；`useHideRoomAction.tsx:23-88`
- `room.info.team.action.edit` — 出处：分册 06 表行「打开编辑团队（同一 EditRoomInfo）」；`TeamsInfoWithData.tsx:14,18-25`
- `room.info.team.action.leave` — 出处：分册 06 表行「离开团队」；`useLeaveTeam.tsx:9-44`
- `room.info.team.action.convert-to-channel` — 出处：分册 06 表行「团队改回独立频道」；`useConvertToChannel.tsx:9-48`
- `room.info.team.action.delete` — 出处：分册 06 表行「删除团队（含子房选择）」；`useDeleteRoom.tsx:70-82`
- `room.info.team.view-channels` — 出处：分册 06 表行「从 Team Info 跳到团队频道列表」；`TeamsInfoWithData.tsx:16`
- `room.info.live.close` — 出处：分册 06 表行「关掉 livechat Room Info」；`ChatsContextualBar.tsx:18-21,39-42`
- `room.info.live.edit` — 出处：分册 06 表行「从只读 ChatInfo 进编辑」；`ChatInfo.tsx:174`
- `room.info.live.edit.denied` — 出处：分册 06 表行「无编辑权点 Edit」；`ChatInfo.tsx:70-74`
- `room.info.edit.back` — 出处：分册 06 表行「从编辑回到 Info」；`ContextualbarBack.tsx:9`
- `room.info.edit.close` — 出处：分册 06 表行「从编辑关掉整栏」；`EditRoomInfoWithData.tsx:9-11`
- `room.info.edit.avatar.upload` — 出处：分册 06 表行「上传房间头像」；`EditRoomInfo.tsx:249-253`
- `room.info.edit.avatar.reset` — 出处：分册 06 表行「头像恢复默认」；`RoomAvatarEditor.tsx:74`
- `room.info.field.name` — 出处：分册 06 表行「改房间/团队名」；`EditRoomInfo.tsx:202-213`
- `room.info.field.topic` — 出处：分册 06 表行「改主题」；`useEditRoomPermissions.ts:57`
- `room.info.field.announcement` — 出处：分册 06 表行「改公告」；`EditRoomInfo.tsx:311`
- `room.info.field.description` — 出处：分册 06 表行「改描述」；`EditRoomInfo.tsx:329`
- `room.info.field.type` — 出处：分册 06 表行「公/私切换」；`useEditRoomPermissions.ts:24-29,61`
- `room.info.edit.accordion.advanced` — 出处：分册 06 表行「展开高级设置」；`EditRoomInfo.tsx:234-237`
- `room.info.field.read-only` — 出处：分册 06 表行「只读模式」；`public.ts:28-29`
- `room.info.field.react-when-readonly` — 出处：分册 06 表行「只读时仍可反应」；`useEditRoomPermissions.ts:31,65`
- `room.info.field.archived` — 出处：分册 06 表行「归档/解档」；`useArchiveRoom.ts:9-17`
- `room.info.field.join-code-required` — 出处：分册 06 表行「开关加入密码」；`useEditRoomPermissions.ts:64`
- `room.info.field.join-code` — 出处：分册 06 表行「填写加入密码」；`EditRoomInfo.tsx:174`
- `room.info.field.hide-sys-mes` — 出处：分册 06 表行「隐藏系统消息总开关」；`EditRoomInfo.tsx:175-177`
- `room.info.field.system-messages` — 出处：分册 06 表行「多选要藏的系统消息类型」；`EditRoomInfo.tsx:496-498`
- `room.info.edit.accordion.prune` — 出处：分册 06 表行「展开房间级保留策略」；`EditRoomInfo.tsx:235-236`
- `room.info.field.retention-enabled` — 出处：分册 06 表行「开房间保留」；`EditRoomInfo.tsx:522`
- `room.info.field.retention-override-global` — 出处：分册 06 表行「覆盖全局保留」；`EditRoomInfo.tsx:534`
- `room.info.field.retention-max-age` — 出处：分册 06 表行「保留天数」；`EditRoomInfo.tsx:68-77`
- `room.info.field.retention-exclude-pinned` — 出处：分册 06 表行「保留时排除置顶」；`EditRoomInfo.tsx:569`
- `room.info.field.retention-files-only` — 出处：分册 06 表行「只剪文件」；`EditRoomInfo.tsx:581`
- `room.info.field.retention-ignore-threads` — 出处：分册 06 表行「不剪线程」；`EditRoomInfo.tsx:593`
- `room.info.edit.reset` — 出处：分册 06 表行「丢弃未保存编辑」；`EditRoomInfo.tsx:609`
- `room.info.edit.save` — 出处：分册 06 表行「提交脏字段」；`EditRoomInfo.tsx:150`
- `room.info.live.field.topic` — 出处：分册 06 表行「改会话主题」；`RoomEdit.tsx:59,94-104`
- `room.info.live.field.tags` — 出处：分册 06 表行「改会话标签」；`Tags.tsx`
- `room.info.live.field.sla` — 出处：分册 06 表行「选 SLA」；`useSlaPolicies`
- `room.info.live.field.priority` — 出处：分册 06 表行「选优先级」；`useOmnichannelPriorities`
- `room.info.live.field.custom` — 出处：分册 06 表行「填房间自定义字段」；`useCustomFieldsMetadata`
- `room.info.live.cancel` — 出处：分册 06 表行「取消编辑回只读」；`ChatsContextualBar.tsx:31-33`
- `room.info.live.save` — 出处：分册 06 表行「保存 live 房间信息」；`RoomEdit.tsx:59,104`
- `room.members.close` — 出处：分册 06 表行「关成员栏」；`RoomMembers.tsx:146`
- `room.members.search` — 出处：分册 06 表行「按用户名过滤」；`RoomMembersWithData.tsx:58`
- `room.members.filter-status` — 出处：分册 06 表行「Online / All」；`RoomMembersWithData.tsx:37`
- `room.members.load-more` — 出处：分册 06 表行「滚到底加载下一页」；`InfiniteListAnchor.tsx:19-23`
- `room.members.empty` — 出处：分册 06 表行「过滤后无成员」；`RoomMembers.tsx:190`
- `room.members.error` — 出处：分册 06 表行「列表请求失败」；`RoomMembers.tsx:177`
- `room.members.denied.broadcast` — 出处：分册 06 表行「broadcast 且无权限则整 tab 不出现」；`useMembersListRoomAction.ts:18-21`
- `room.members.denied.federation` — 出处：分册 06 表行「非原生联邦隐藏成员 tab」；`useMembersListRoomAction.ts:15-16,23-25`
- `room.members.invite-link` — 出处：分册 06 表行「打开邀请链接子页」；`RoomMembersWithData.tsx:48-51,135`
- `room.members.invite-link.denied.abac` — 出处：分册 06 表行「ABAC 房邀请钮禁用」；`RoomMembersWithData.tsx:137`
- `room.members.add-users` — 出处：分册 06 表行「打开加用户子页」；`RoomMembersWithData.tsx:64-72,136`
- `room.members.add-users.denied` — 出处：分册 06 表行「无加人权则无 Add/Invite 脚」；`RoomMembersWithData.tsx:135-136`
- `room.members.row.open-user-info` — 出处：分册 06 表行「点成员行开 UserInfo」；`RoomMembersWithData.tsx:78-84`
- `room.members.row.kebab` — 出处：分册 06 表行「打开成员行 More」；`RoomMembersActions.tsx:16-28`
- `room.members.action.direct-message` — 出处：分册 06 表行「对成员开 DM」；`useUserInfoActions.ts:95`
- `room.members.action.video-call` — 出处：分册 06 表行「对成员发起视频」；`useUserInfoActions.ts:96`
- `room.members.action.voice-call` — 出处：分册 06 表行「对成员发起语音」；`useUserInfoActions.ts:97`
- `room.members.action.add-to-room` — 出处：分册 06 表行「把非成员拉进房」；`useUserInfoActions.ts:98`
- `room.members.action.set-owner` — 出处：分册 06 表行「授/撤 owner」；`useUserInfoActions.ts:99`
- `room.members.action.set-owner.federated` — 出处：分册 06 表行「联邦改 owner 先警告」；`useChangeOwnerAction.tsx:104-126`
- `room.members.action.set-leader` — 出处：分册 06 表行「授/撤 leader」；`useUserInfoActions.ts:100`
- `room.members.action.set-moderator` — 出处：分册 06 表行「授/撤 moderator」；`useUserInfoActions.ts:101`
- `room.members.action.set-moderator.federated` — 出处：分册 06 表行「联邦改 mod 先警告」；`useChangeModeratorAction.tsx:101-136`
- `room.members.action.moderation-console` — 出处：分册 06 表行「跳该用户审核台」；`useUserInfoActions.ts:102`
- `room.members.action.ignore` — 出处：分册 06 表行「忽略/取消忽略对端（非自己）」；`useUserInfoActions.ts:103`
- `room.members.action.mute` — 出处：分册 06 表行「禁言/解禁」；`useUserInfoActions.ts:104`
- `room.members.action.block` — 出处：分册 06 表行「1:1 拉黑（频道成员列表不出现）」；`direct.ts:48-50`
- `room.members.action.kick` — 出处：分册 06 表行「踢出/移出团队/撤销邀请」；`useUserInfoActions.ts:106`
- `room.members.action.ban` — 出处：分册 06 表行「封禁」；`useBanUser.tsx:48-58`
- `room.members.action.report` — 出处：分册 06 表行「举报对端」；`ReportUserModal.tsx`
- `room.members.user-info.back` — 出处：分册 06 表行「UserInfo 回到列表」；`ContextualbarBack.tsx:9`
- `room.members.user-info.close` — 出处：分册 06 表行「从 UserInfo 关栏」；`UserInfoWithData.tsx:101`
- `room.members.add.back` — 出处：分册 06 表行「加用户页返回列表」；`AddUsers.tsx:116`
- `room.members.add.picker` — 出处：分册 06 表行「多选要加的人」；`UserAutoCompleteMultiple.tsx:97-122`
- `room.members.add.submit` — 出处：分册 06 表行「提交邀请（非联邦）」；`AddUsers.tsx:44-46,66-68`
- `room.members.add.submit.federated` — 出处：分册 06 表行「联邦加用户（先核 Matrix）」；`useAddMatrixUsers`
- `room.members.add.external-denied` — 出处：分册 06 表行「非联邦房拒外部 Matrix id」；`AddUsers.tsx:24,127-128`
- `room.members.add.unban-confirm` — 出处：分册 06 表行「加被封用户时先解封」；`BannedUsersUnbanModal.tsx:62-71`
- `room.members.invite.back` — 出处：分册 06 表行「邀请页返回」；`InviteUsersWrapper.tsx:24`
- `room.members.invite.copy` — 出处：分册 06 表行「复制邀请 URL」；`useClipboardWithToast.ts:11`
- `room.members.invite.edit` — 出处：分册 06 表行「打开编辑邀请参数」；`InviteLink.tsx:36-39`
- `room.members.invite.expiration` — 出处：分册 06 表行「选过期天数」；`EditInviteLink.tsx:22-30`
- `room.members.invite.max-uses` — 出处：分册 06 表行「选最大使用次数」；`EditInviteLink.tsx:33-42`
- `room.members.invite.generate` — 出处：分册 06 表行「生成新邀请链接」；`InviteUsersWithData`
- `room.files.close` — 出处：分册 06 表行「关文件栏」；`RoomFiles.tsx:73`
- `room.files.search` — 出处：分册 06 表行「按文件名搜」；`useFilesList.ts:28-38`
- `room.files.type-filter` — 出处：分册 06 表行「按类型过滤」；`RoomFilesWithData.tsx:15`
- `room.files.empty` — 出处：分册 06 表行「无文件」；`RoomFiles.tsx:99`
- `room.files.load-more` — 出处：分册 06 表行「滚动加载」；`useFilesList.ts:72-75`
- `room.files.file-row-preview` — 出处：分册 06 表行「打开可预览图片画廊」；`ImageGalleryProvider.tsx:25-34`
- `room.files.file-row-download` — 出处：分册 06 表行「点非预览行下载」；`FileItem.tsx:32-48`
- `room.files.file-menu` — 出处：分册 06 表行「打开单文件 More」；`FileItemMenu.tsx:90`
- `room.files.file-menu-download` — 出处：分册 06 表行「菜单下载」；`FileItemMenu.tsx:50-76`
- `room.files.file-menu-download.denied` — 出处：分册 06 表行「加密无 SW 时 Download 禁用」；`FileItemMenu.tsx:35`
- `room.files.file-menu-delete` — 出处：分册 06 表行「开始删文件」；`useMessageDeletionIsAllowed.ts:7-59`
- `room.files.file-menu-delete.denied` — 出处：分册 06 表行「无权则无 Delete」；`FileItemMenu.tsx:77`
- `room.files.delete.confirm` — 出处：分册 06 表行「确认删除」；`useDeleteFile.tsx:13-30`
- `room.files.delete.cancel` — 出处：分册 06 表行「取消删除」；`useDeleteFile.tsx:27`
- `room.notif.close` — 出处：分册 06 表行「关通知栏（不保存）」；`usePushNotificationsRoomAction.ts:9-14`
- `room.notif.turn-on` — 出处：分册 06 表行「总开关房间通知」；`NotificationPreferencesWithData.tsx:67,77-80`
- `room.notif.mute-group-mentions` — 出处：分册 06 表行「静音 @all/@here」；`NotificationPreferencesWithData.tsx:68`
- `room.notif.show-counter` — 出处：分册 06 表行「未读计数」；`NotificationPreferencesWithData.tsx:69`
- `room.notif.show-mentions` — 出处：分册 06 表行「仅提及计数」；`NotificationPreferencesWithData.tsx:70`
- `room.notif.desktop-section` — 出处：分册 06 表行「展开 Desktop 段」；`NotificationByDevice.tsx:13-24`
- `room.notif.desktop-alert` — 出处：分册 06 表行「Desktop 提醒级别」；`NotificationPreferencesWithData.tsx:71`
- `room.notif.desktop-sound` — 出处：分册 06 表行「Desktop 声音」；`NotificationPreferencesWithData.tsx:72`
- `room.notif.play-sound` — 出处：分册 06 表行「试听声音」；`NotificationPreferencesWithData.tsx:60-62`
- `room.notif.mobile-section` — 出处：分册 06 表行「展开 Mobile 段」；`NotificationByDevice.tsx:13-24`
- `room.notif.mobile-alert` — 出处：分册 06 表行「Mobile 提醒级别」；`NotificationPreferencesWithData.tsx:73`
- `room.notif.email-section` — 出处：分册 06 表行「展开 Email 段」；`NotificationByDevice.tsx:13-24`
- `room.notif.email-alert` — 出处：分册 06 表行「Email 提醒级别」；`NotificationPreferencesWithData.tsx:74`
- `room.notif.reset` — 出处：分册 06 表行「还原未保存」；`NotificationPreferences.tsx:45`
- `room.notif.save` — 出处：分册 06 表行「保存全部通知偏好」；`NotificationPreferencesWithData.tsx:20-24,64-80`
- `room.prune.close` — 出处：分册 06 表行「关剪枝栏（取消）」；`useCleanHistoryRoomAction.ts:14-31`
- `room.prune.newer-date` — 出处：分册 06 表行「Newer than 日期」；`PruneMessagesWithData.tsx:62-64`
- `room.prune.newer-time` — 出处：分册 06 表行「Newer than 时间」；`PruneMessagesDateTimeRow.tsx:20`
- `room.prune.older-date` — 出处：分册 06 表行「Older than 日期」；`PruneMessagesWithData.tsx:66-68`
- `room.prune.older-time` — 出处：分册 06 表行「Older than 时间」；`PruneMessagesDateTimeRow.tsx:20`
- `room.prune.users` — 出处：分册 06 表行「只剪所选用户」；`PruneMessagesWithData.tsx:89`
- `room.prune.inclusive` — 出处：分册 06 表行「含边界时刻」；`PruneMessagesWithData.tsx:83`
- `room.prune.pinned` — 出处：分册 06 表行「不剪置顶」；`PruneMessagesWithData.tsx:85`
- `room.prune.discussion` — 出处：分册 06 表行「不剪讨论」；`PruneMessagesWithData.tsx:87`
- `room.prune.threads` — 出处：分册 06 表行「不剪线程」；`PruneMessagesWithData.tsx:88`
- `room.prune.attached` — 出处：分册 06 表行「只剪文件」；`PruneMessagesWithData.tsx:86`
- `room.prune.submit` — 出处：分册 06 表行「打开确认剪枝」；`PruneMessagesWithData.tsx:123-155`
- `room.prune.submit.disabled` — 出处：分册 06 表行「日期非法禁用 Prune」；`PruneMessagesWithData.tsx:157-167`
- `room.prune.confirm` — 出处：分册 06 表行「确认执行剪枝」；`PruneMessagesWithData.tsx:110-119`
- `room.prune.cancel` — 出处：分册 06 表行「取消确认」；`PruneMessagesWithData.tsx:113`
- `room.prune.result.success` — 出处：分册 06 表行「剪枝成功 toast」；`PruneMessagesWithData.tsx:70-107`
- `room.prune.result.empty` — 出处：分册 06 表行「范围内无东西可剪」；`PruneMessagesWithData.tsx`
- `room.export.close` — 出处：分册 06 表行「关导出栏」；`ExportMessages.tsx:126-128`
- `room.export.method` — 出处：分册 06 表行「选导出方式」；`ExportMessages.tsx:71-77`
- `room.export.method.e2e` — 出处：分册 06 表行「E2E 房锁死 Download」；`ExportMessages.tsx:208`
- `room.export.format` — 出处：分册 06 表行「选输出格式」；`ExportMessages.tsx:80-101`
- `room.export.date-from` — 出处：分册 06 表行「file 方式起始日」；`ExportMessages.tsx:166-167`
- `room.export.date-to` — 出处：分册 06 表行「file 方式结束日」；`ExportMessages.tsx:167`
- `room.export.to-users` — 出处：分册 06 表行「email 收件人（站内）」；`ExportMessages.tsx:173-176`
- `room.export.additional-emails` — 出处：分册 06 表行「站外邮箱」；`ExportMessages.tsx:177`
- `room.export.subject` — 出处：分册 06 表行「邮件主题」；`ExportMessages.tsx:66,178`
- `room.export.messages-validation` — 出处：分册 06 表行「未选消息时挡住提交」；`ExportMessages.tsx:121-133`
- `room.export.reset` — 出处：分册 06 表行「重置表单」；`ExportMessages.tsx:385`
- `room.export.submit.email` — 出处：分册 06 表行「邮件发出所选消息」；`useRoomExportMutation.ts:7-16`
- `room.export.submit.file` — 出处：分册 06 表行「按日期排队文件邮件」；`useRoomExportMutation.ts:7-16`
- `room.export.submit.download-json` — 出处：分册 06 表行「本地下载 JSON」；`useDownloadExportMutation.ts:18-67`
- `room.export.submit.download-pdf` — 出处：分册 06 表行「本地下载 PDF」；`useExportMessagesAsPDFMutation.tsx:192-194`
- `room.threads.close` — 出处：分册 06 表行「关线程列表」；`ThreadList.tsx:124-127`
- `room.threads.filter-search` — 出处：分册 06 表行「搜线程正文」；`useThreadsList.ts:75-81`
- `room.threads.filter-type` — 出处：分册 06 表行「All / Following / Unread」；`ThreadList.tsx:64`
- `room.threads.list-item` — 出处：分册 06 表行「打开线程详情」；`useGoToThread.ts:16-23`
- `room.threads.follow-list` — 出处：分册 06 表行「列表行上关注/取关」；`ThreadMetricsFollow.tsx:29-45`
- `room.threads.follow-detail` — 出处：分册 06 表行「详情头关注/取关」；`useToggleFollowingThreadMutation.ts:25-36`
- `room.threads.expand` — 出处：分册 06 表行「详情加宽/收起」；`Thread.tsx:117-123`
- `room.threads.empty` — 出处：分册 06 表行「无线程」；`ThreadList.tsx:162`
- `room.discussions.close` — 出处：分册 06 表行「关讨论列表」；`DiscussionsList.tsx:66-69`
- `room.discussions.filter-search` — 出处：分册 06 表行「搜讨论」；`useDiscussionsList.ts:39-44`
- `room.discussions.list-item` — 出处：分册 06 表行「跳进讨论房」；`useGoToRoom.ts:19-37`
- `room.discussions.empty` — 出处：分册 06 表行「无讨论」；`DiscussionsList.tsx:96`
- `room.search.mentions.close` — 出处：分册 06 表行「关提及列表」；`MentionsTab.tsx`
- `room.search.mentions.empty` — 出处：分册 06 表行「无提及」；`MentionsTab.tsx:39`
- `room.search.mentions.jump` — 出处：分册 06 表行「跳到原消息」；`MentionsItems.tsx:14`
- `room.search.pinned.close` — 出处：分册 06 表行「关置顶列表」；`PinnedMessagesTab.tsx`
- `room.search.pinned.empty` — 出处：分册 06 表行「无置顶」；`PinnedMessagesTab.tsx:40`
- `room.search.pinned.jump` — 出处：分册 06 表行「跳到置顶消息」；`PinnedItems.tsx:14`
- `room.search.pinned.unpin` — 出处：分册 06 表行「取消置顶」；`useUnpinMessageMutation.ts:17-29`
- `room.search.starred.close` — 出处：分册 06 表行「关星标列表」；`StarredMessagesTab.tsx`
- `room.search.starred.empty` — 出处：分册 06 表行「无星标」；`StarredMessagesTab.tsx:40`
- `room.search.starred.jump` — 出处：分册 06 表行「跳到星标消息」；`StarredItems.tsx:14`
- `room.search.starred.unstar` — 出处：分册 06 表行「取消星标」；`useUnstarMessageMutation.ts:18-29`
- `room.search.close` — 出处：分册 06 表行「关搜索栏」；`MessageSearchTab`
- `room.search.filter-text` — 出处：分册 06 表行「输入搜索」；`useMessageSearchQuery.ts:20-26`
- `room.search.global-toggle` — 出处：分册 06 表行「全局 vs 本房」；`MessageSearchForm.tsx:48,68-72`
- `room.search.empty` — 出处：分册 06 表行「无结果」；`MessageSearchTab.tsx:68`
- `room.search.jump` — 出处：分册 06 表行「从结果跳原消息」；`JumpToMessageAction.tsx:16-22`
- `room.search.encrypted-callout` — 出处：分册 06 表行「E2E 房不能搜密文」；`MessageSearchForm.tsx:74-78`
- `room.teamChannels.close` — 出处：分册 06 表行「关团队频道栏」；`TeamsChannels.tsx:85-88`
- `room.teamChannels.filter-search` — 出处：分册 06 表行「搜频道名」；`useTeamsChannelList.ts:23-29`
- `room.teamChannels.filter-type` — 出处：分册 06 表行「All / Auto-join」；`TeamsChannelsWithData.tsx:27`
- `room.teamChannels.empty` — 出处：分册 06 表行「团队无频道」；`TeamsChannels.tsx:108`
- `room.teamChannels.load-more` — 出处：分册 06 表行「滚动加载」；`TeamsChannels.tsx:71-81`
- `room.teamChannels.list-item` — 出处：分册 06 表行「打开该频道」；`TeamsChannelsWithData.tsx:45-47`
- `room.teamChannels.item-menu` — 出处：分册 06 表行「打开行 More」；`TeamsChannelItem.tsx:38-42`
- `room.teamChannels.toggle-auto-join` — 出处：分册 06 表行「开关自动加入」；`useToggleAutoJoin.ts:13-39`
- `room.teamChannels.remove-from-team` — 出处：分册 06 表行「从团队移除频道」；`useRemoveRoomFromTeam.tsx:16-38`
- `room.teamChannels.delete` — 出处：分册 06 表行「删除该频道」；`useDeleteRoom.tsx:21-40`
- `room.teamChannels.add-existing` — 出处：分册 06 表行「打开「加入已有频道」」；`TeamsChannelsWithData.tsx:18,60`
- `room.teamChannels.add-existing.rooms` — 出处：分册 06 表行「选择要加入的房间」；`RoomsAvailableForTeamsAutoComplete`
- `room.teamChannels.add-existing.submit` — 出处：分册 06 表行「提交加入」；`AddExistingModal.tsx:37-51`
- `room.teamChannels.add-existing.cancel` — 出处：分册 06 表行「取消加入」；`AddExistingModal.tsx:85`
- `room.teamChannels.create-new` — 出处：分册 06 表行「打开新建团队频道」；`TeamsChannelsWithData.tsx:19,61`
- `room.banned.close` — 出处：分册 06 表行「关封禁列表」；`BannedUsers.tsx:36-39`
- `room.banned.empty` — 出处：分册 06 表行「无人被封」；`BannedUsers.tsx:50-52`
- `room.banned.error` — 出处：分册 06 表行「加载失败」；`BannedUsers.tsx:48`
- `room.banned.item-menu` — 出处：分册 06 表行「打开行 More」；`BannedUsersItem.tsx:46-48`
- `room.banned.unban` — 出处：分册 06 表行「解封」；`useUnbanUser.tsx:21-53`
- `room.banned.load-more` — 出处：分册 06 表行「滚动加载」；`useRoomBannedUsers.ts:16-27`
- `room.autotranslate.close` — 出处：分册 06 表行「关自动翻译栏」；`AutoTranslate.tsx:32-34`
- `room.autotranslate.toggle` — 出处：分册 06 表行「开/关本房自动翻译」；`AutoTranslateWithData.tsx:48-65`
- `room.autotranslate.language` — 出处：分册 06 表行「选目标语言」；`AutoTranslateWithData.tsx:34-45`
- `room.autotranslate.e2ee-unavailable` — 出处：分册 06 表行「加密房提示不可用」；`AutoTranslate.tsx:38-51`
- `room.calls.close` — 出处：分册 06 表行「关通话史」；`VideoConfList.tsx:40-42`
- `room.calls.empty` — 出处：分册 06 表行「无历史」；`VideoConfList.tsx:59-64`
- `room.calls.error` — 出处：分册 06 表行「加载失败」；`VideoConfList.tsx:52-57`
- `room.calls.join` — 出处：分册 06 表行「加入未结束会议」；`useVideoConfJoinCall`
- `room.calls.join.ended` — 出处：分册 06 表行「已结束不可加入」；`VideoConfListItem.tsx:92`
- `room.calls.join-discussion` — 出处：分册 06 表行「跳会议讨论房」；`VideoConfListItem.tsx:96-102`
- `room.calls.load-more` — 出处：分册 06 表行「滚动加载」；`VideoConfList.tsx:77`
- `room.canned.close` — 出处：分册 06 表行「关快捷回复栏」；`CannedResponseList.tsx:84-86`
- `room.canned.search` — 出处：分册 06 表行「搜快捷回复」；`CannedResponseList.tsx:92`
- `room.canned.type-filter` — 出处：分册 06 表行「按类型过滤」；`CannedResponseList.tsx:100`
- `room.canned.empty` — 出处：分册 06 表行「无快捷回复」；`CannedResponseList.tsx:105`
- `room.canned.list-item` — 出处：分册 06 表行「打开详情」；`CannedResponse.tsx:50`
- `room.canned.use-from-list` — 出处：分册 06 表行「从列表行使用」；Item onClickUse
- `room.canned.create` — 出处：分册 06 表行「打开创建」；`CannedResponseList.tsx:133`
- `room.canned.detail.back` — 出处：分册 06 表行「详情回列表」；`CannedResponse.tsx:49`
- `room.canned.detail.edit` — 出处：分册 06 表行「编辑该条」；`CannedResponse.tsx:101`
- `room.canned.detail.use` — 出处：分册 06 表行「从详情使用」；`CannedResponse.tsx:102-104`
- `room.contact.close` — 出处：分册 06 表行「关联系人栏」；`ContactInfo.tsx:44-47`
- `room.contact.edit` — 出处：分册 06 表行「进编辑联系人」；`ContactInfo.tsx:35,61-67`
- `room.contact.edit.denied` — 出处：分册 06 表行「无编辑权或有冲突」；`ContactInfo.tsx:61-63`
- `room.contact.see-conflicts` — 出处：分册 06 表行「打开冲突审阅」；`ReviewContactModal`
- `room.contact.tab.details` — 出处：分册 06 表行「切到 Details」；`ContactInfo.tsx:87`
- `room.contact.tab.channels` — 出处：分册 06 表行「切到 Channels」；`ContactInfo.tsx:90`
- `room.contact.tab.history` — 出处：分册 06 表行「切到 History」；`ContactInfo.tsx:93`
- `room.contact.phone.copy` — 出处：分册 06 表行「复制电话」；`useClipboardWithToast`
- `room.contact.phone.outbound` — 出处：分册 06 表行「对该号发外呼」；`ContactInfoOutboundMessageButton`
- `room.contact.email.entry` — 出处：分册 06 表行「展示/点邮箱项」；`ContactInfoDetailsEntry`
- `room.game.close` — 出处：分册 06 表行「关 Game Center」；`GameCenterList.tsx:45-46`
- `room.game.open` — 出处：分册 06 表行「打开某个游戏」；`GameCenterContainer.tsx:32-33`
- `room.game.invite` — 出处：分册 06 表行「邀请好友进游戏」；`GameCenterInvitePlayersModal`
- `room.game.back` — 出处：分册 06 表行「从游戏回列表」；`GameCenter.tsx:23-26`
- `room.game.close-from-container` — 出处：分册 06 表行「从游戏关栏」；`GameCenter.tsx:21`
- `room.game.empty` — 出处：分册 06 表行「无外部组件」；`GameCenterList.tsx:49`
- `room.outlook.close` — 出处：分册 06 表行「关日历栏」；`OutlookEventsList.tsx:49-52`
- `room.outlook.empty` — 出处：分册 06 表行「今日无事件」；`OutlookEventsList.tsx:64-68`
- `room.outlook.error` — 出处：分册 06 表行「加载失败」；`OutlookEventsList.tsx:57-62`
- `room.outlook.item-open` — 出处：分册 06 表行「打开事件详情」；`OutlookCalendarEventModal`
- `room.outlook.join` — 出处：分册 06 表行「加入会议」；`useOutlookOpenCall`
- `room.outlook.calendar-settings` — 出处：分册 06 表行「打开日历设置」；`OutlookEventsList.tsx:88`
- `room.outlook.open-outlook` — 出处：分册 06 表行「外开 Outlook」；`OutlookEventsList.tsx:45,89-93`
- `room.outlook.sync` — 出处：分册 06 表行「同步 / 登录后同步」；`useMutationOutlookCalendarSync`
- `room.info.e2ee.enable.confirm` — 出处：分册 06 表行「确认开启房间加密」；`useE2EERoomAction.ts:73-90`
- `room.info.e2ee.enable.cancel` — 出处：分册 06 表行「取消开启」；`EnableE2EEModal.tsx:21`
- `room.info.e2ee.disable.confirm` — 出处：分册 06 表行「确认关闭加密」；`useE2EERoomAction.ts`
- `room.info.e2ee.disable.cancel` — 出处：分册 06 表行「取消关闭」；`DisableE2EEModal.tsx:23`
- `room.info.e2ee.reset-accordion` — 出处：分册 06 表行「展开重置密钥段」；`DisableE2EEModal.tsx:37`
- `room.info.e2ee.reset-open` — 出处：分册 06 表行「打开重置密钥确认」；`BaseDisableE2EEModal.tsx:23-25`
- `room.info.e2ee.reset.confirm` — 出处：分册 06 表行「确认重置房间密钥」；`useE2EEResetRoomKey.ts:15-31`
- `room.info.e2ee.reset.cancel` — 出处：分册 06 表行「取消重置」；`ResetKeysE2EEModal.tsx:47`
- `room.info.e2ee.federated.disabled` — 出处：分册 06 表行「联邦房 E2EE 钮禁用」；`useE2EERoomAction.ts`
- `room.quick.moveQueue` — 出处：分册 06 表行「打开回队确认」；`useQuickActions.tsx:269,284-285`
- `room.quick.moveQueue.confirm` — 出处：分册 06 表行「确认回队」；`useReturnChatToQueueMutation.ts:11-17`
- `room.quick.moveQueue.cancel` — 出处：分册 06 表行「取消回队」；`ReturnChatQueueModal.tsx:18`
- `room.quick.chatForward` — 出处：分册 06 表行「打开转接表」；`useQuickActions.tsx:286-287`
- `room.quick.chatForward.department` — 出处：分册 06 表行「选目标部门」；`useDepartmentsList`
- `room.quick.chatForward.username` — 出处：分册 06 表行「选目标坐席」；`ForwardChatModal.tsx:57-59`
- `room.quick.chatForward.comment` — 出处：分册 06 表行「转接备注」；`ForwardChatModal.tsx:154`
- `room.quick.chatForward.confirm` — 出处：分册 06 表行「提交转接」；`ForwardChatModal.tsx:52-94`
- `room.quick.chatForward.cancel` — 出处：分册 06 表行「取消转接」；`ForwardChatModal.tsx:104`
- `room.quick.transcript.toggle` — 出处：分册 06 表行「打开 transcript 子菜单」；`QuickActionOptions.tsx:31`
- `room.quick.transcript.email` — 出处：分册 06 表行「打开邮件 transcript 表」；`useQuickActions.tsx:212-228`
- `room.quick.transcript.pdf` — 出处：分册 06 表行「请求 PDF transcript」；`useQuickActions.tsx:93-104,209-210`
- `room.quick.transcript.modal.email` — 出处：分册 06 表行「填 transcript 邮箱」；`TranscriptModal.tsx:81`
- `room.quick.transcript.modal.subject` — 出处：分册 06 表行「填 transcript 主题」；`TranscriptModal.tsx:100`
- `room.quick.transcript.modal.request` — 出处：分册 06 表行「进行中会话请求邮件」；handler `77-90`
- `room.quick.transcript.modal.send` — 出处：分册 06 表行「已关会话发送邮件」；handler `109-118`
- `room.quick.transcript.modal.undo` — 出处：分册 06 表行「撤销待发请求」；handler `123-134`
- `room.quick.onHold` — 出处：分册 06 表行「打开挂起确认」；`useQuickActions.tsx:263-279,296-297`
- `room.quick.onHold.confirm` — 出处：分册 06 表行「确认挂起」；`usePutChatOnHoldMutation.ts:11-17`
- `room.quick.onHold.cancel` — 出处：分册 06 表行「取消挂起」；`useQuickActions.tsx:248-251`
- `room.quick.closeChat` — 出处：分册 06 表行「打开关闭会话」；`useQuickActions.tsx:236-241,294-295`
- `room.quick.closeChat.simple.confirm` — 出处：分册 06 表行「无表单直接关」；`CloseChatModal.tsx:140-169`
- `room.quick.closeChat.simple.cancel` — 出处：分册 06 表行「取消简单关闭」；`CloseChatModal.tsx:258`
- `room.quick.closeChat.form.comment` — 出处：分册 06 表行「关闭评语」；`CloseChatModal.tsx:169`
- `room.quick.closeChat.form.tags` — 出处：分册 06 表行「关闭标签」；`CurrentChatTags.tsx`
- `room.quick.closeChat.form.transcriptPdf` — 出处：分册 06 表行「关闭时出 PDF」；`CloseChatModal.tsx:190`
- `room.quick.closeChat.form.transcriptEmail` — 出处：分册 06 表行「关闭时发电邮」；`CloseChatModal.tsx:198`
- `room.quick.closeChat.form.subject` — 出处：分册 06 表行「关闭电邮主题」；`CloseChatModal.tsx:214`
- `room.quick.closeChat.form.confirm` — 出处：分册 06 表行「提交 wrap-up 关闭」；`CloseChatModal.tsx:90-114`
- `room.quick.closeChat.form.cancel` — 出处：分册 06 表行「取消 wrap-up」；`CloseChatModal.tsx:243`
- `room.quick.resume` — 出处：分册 06 表行「从挂起恢复（composer，非 hook）」；`ComposerOmnichannel.tsx:44-50`
- `sidebar.roomMenu.trigger` — 出处：分册 06 表行「打开房间行 Options」；`RoomMenu.tsx:26`
- `sidebar.roomMenu.hide` — 出处：分册 06 表行「隐藏房间」；`useHideRoomAction.tsx:50,65-88`
- `sidebar.roomMenu.toggleRead` — 出处：分册 06 表行「标已读/未读」；`useToggleReadAction.ts:24-47`
- `sidebar.roomMenu.toggleFavorite` — 出处：分册 06 表行「收藏/取消」；`useToggleFavoriteAction`
- `sidebar.roomMenu.leave` — 出处：分册 06 表行「离开房间」；`useLeaveRoom.tsx:34`
- `sidebar.roomMenu.hide.denied.omni` — 出处：分册 06 表行「live 行无 Hide」；`useRoomMenuActions.ts:55,62`
- `sidebar.roomMenu.leave.denied` — 出处：分册 06 表行「DM/live/cl=false 无 Leave」；`useRoomMenuActions.ts:40-48`
- `sidebar.roomMenu.hideDefaultOptions` — 出处：分册 06 表行「排队项隐藏默认菜单」；`SidebarItemTemplateWithData.tsx:150`
- `sidebar.roomMenu.v2.notifications-toggle` — 出处：分册 06 表行「V2 行开关房间通知」；`useToggleNotificationAction`
- `sidebar.roomMenu.v2.notifications-prefs` — 出处：分册 06 表行「V2 跳通知偏好栏」；V2 `:124-128`
- `sidebar.roomMenu.priority.unprioritized` — 出处：分册 06 表行「清除 live 优先级」；`useOmnichannelPrioritiesMenu.ts:35-41`
- `sidebar.roomMenu.priority.set` — 出处：分册 06 表行「设置 live 优先级」；`useOmnichannelPrioritiesMenu.ts:43-52`

分册 06 NEW id 条数：**306**（`sort -u` 自该分册首次出现的稳定语义 id 列）。

#### 分册 07

- `page.create.channel.name` — 出处：分册 07 表行「填写必填频道名」；`CreateChannelModal.tsx:204-227` `[读]`
- `page.create.channel.name.required` — 出处：分册 07 表行「空名提交时拦下」；`CreateChannelModal.tsx:211-213` `[读]`
- `page.create.channel.name.special-chars` — 出处：分册 07 表行「特殊字符名被客户端拒」；`CreateChannelModal.tsx:144-146,226` `[读]`
- `page.create.channel.name.duplicate` — 出处：分册 07 表行「重名被 rooms.nameExists 拒」；`CreateChannelModal.tsx:91,148-151` `[读]`
- `page.create.channel.topic` — 出处：分册 07 表行「填写可选主题」；`CreateChannelModal.tsx:228-234` `[读]`
- `page.create.channel.members` — 出处：分册 07 表行「添加初始成员」；`CreateChannelModal.tsx:235-247` `[读]`
- `page.create.channel.members.external-rejected` — 出处：分册 07 表行「非联邦房拒绝 @external 成员」；`CreateChannelModal.tsx:71,241-243` `[读]`
- `page.create.channel.private` — 出处：分册 07 表行「开关私有/公开」；`CreateChannelModal.tsx:248-264,129-133` `[读]`
- `page.create.channel.advanced` — 出处：分册 07 表行「展开高级设置手风琴」；`CreateChannelModal.tsx:266-268` `[读]`
- `page.create.channel.federated` — 出处：分册 07 表行「开关矩阵联邦」；`CreateChannelModal.tsx:55-89,272-282` `[读]`
- `page.create.channel.encrypted` — 出处：分册 07 表行「开关频道 E2E」；`CreateChannelModal.tsx:283-293,188` `[读]`
- `page.create.channel.readonly` — 出处：分册 07 表行「开关只读」；`CreateChannelModal.tsx:294-308` `[读]`
- `page.create.channel.broadcast` — 出处：分册 07 表行「开关广播（并连带只读）」；`CreateChannelModal.tsx:309-319,135-137` `[读]`
- `page.create.channel.cancel` — 出处：分册 07 表行「取消不建房」；`CreateChannelModal.tsx:201,326` `[读]`
- `page.create.channel.submit` — 出处：分册 07 表行「提交创建频道」；`CreateChannelModal.tsx:156-186,327-329` `[读]`
- `page.create.channel.submit.permission-denied` — 出处：分册 07 表行「无权时提交失败」；`CreateChannelModal.tsx:183-185` `[读]`
- `page.create.channel.team-parent` — 出处：分册 07 表行「从团队频道列表建房时带上 teamId」；`CreateChannelModal.tsx:38-42,97,167-178` `[读]`
- `page.create.team.name` — 出处：分册 07 表行「填写必填团队名」；`CreateTeamModal.tsx:169-191` `[读]`
- `page.create.team.name.required` — 出处：分册 07 表行「空名提交被拦」；`CreateTeamModal.tsx:176` `[读]`
- `page.create.team.name.special-chars` — 出处：分册 07 表行「特殊字符名被拒」；`CreateTeamModal.tsx:74-76,190` `[读]`
- `page.create.team.name.duplicate` — 出处：分册 07 表行「重名被拒」；`CreateTeamModal.tsx:56,78-81` `[读]`
- `page.create.team.topic` — 出处：分册 07 表行「填写可选主题」；`CreateTeamModal.tsx:192-200` `[读]`
- `page.create.team.members` — 出处：分册 07 表行「添加初始成员」；`CreateTeamModal.tsx:201-210` `[读]`
- `page.create.team.private` — 出处：分册 07 表行「开关私有团队」；`CreateTeamModal.tsx:211-228` `[读]`
- `page.create.team.advanced` — 出处：分册 07 表行「展开高级设置」；`CreateTeamModal.tsx:230-232` `[读]`
- `page.create.team.encrypted` — 出处：分册 07 表行「开关团队 E2E」；`CreateTeamModal.tsx:236-248` `[读]`
- `page.create.team.readonly` — 出处：分册 07 表行「开关只读」；`CreateTeamModal.tsx:249-263` `[读]`
- `page.create.team.broadcast` — 出处：分册 07 表行「开关广播」；`CreateTeamModal.tsx:264-274,104-110` `[读]`
- `page.create.team.cancel` — 出处：分册 07 表行「取消不建团队」；`CreateTeamModal.tsx:162,281` `[读]`
- `page.create.team.submit` — 出处：分册 07 表行「提交创建团队」；`CreateTeamModal.tsx:118-149,282-284` `[读]`
- `page.create.team.submit.permission-denied` — 出处：分册 07 表行「无 create-team 时按钮不可点」；`CreateTeamModal.tsx:54,282` `[读]`
- `page.create.discussion.parent` — 出处：分册 07 表行「选择父房间」；`CreateDiscussion.tsx:120-150` `[读]`
- `page.create.discussion.parent.required` — 出处：分册 07 表行「未选父房被拦」；`CreateDiscussion.tsx:134` `[读]`
- `page.create.discussion.name` — 出处：分册 07 表行「填写讨论名」；`CreateDiscussion.tsx:151-164` `[读]`
- `page.create.discussion.name.required` — 出处：分册 07 表行「空名被拦」；`CreateDiscussion.tsx:157` `[读]`
- `page.create.discussion.topic` — 出处：分册 07 表行「填写可选主题」；`CreateDiscussion.tsx:165-173` `[读]`
- `page.create.discussion.members` — 出处：分册 07 表行「添加讨论成员」；`CreateDiscussion.tsx:174-183` `[读]`
- `page.create.discussion.reply` — 出处：分册 07 表行「填写首条消息」；`CreateDiscussion.tsx:184-198,99` `[读]`
- `page.create.discussion.encrypted` — 出处：分册 07 表行「开关讨论加密」；`CreateDiscussion.tsx:199-209,72-78` `[读]`
- `page.create.discussion.cancel` — 出处：分册 07 表行「取消不建讨论」；`CreateDiscussion.tsx:108-116` `[读]`
- `page.create.discussion.submit` — 出处：分册 07 表行「提交创建讨论」；`CreateDiscussion.tsx:82-103` `[读]`
- `page.create.dm.users` — 出处：分册 07 表行「选择私聊对象（可多人）」；`CreateDirectMessage.tsx:67-96` `[读]`
- `page.create.dm.users.required` — 出处：分册 07 表行「未选用户被拦」；`CreateDirectMessage.tsx:74` `[读]`
- `page.create.dm.users.max` — 出处：分册 07 表行「超过人数上限被拦」；`CreateDirectMessage.tsx:75-78` `[读]`
- `page.create.dm.cancel` — 出处：分册 07 表行「取消不建 DM」；`CreateDirectMessage.tsx:64,101` `[读]`
- `page.create.dm.submit` — 出处：分册 07 表行「提交创建/打开 DM」；`CreateDirectMessage.tsx:30-55,102-104` `[读]`
- `page.create.dm.submit.error` — 出处：分册 07 表行「服务端拒建（含无权）」；`CreateDirectMessage.tsx:45-50` `[读]`
- `page.account.profile.avatar.upload` — 出处：分册 07 表行「上传本地图作头像」；`UserAvatarEditor.tsx:51,121` `useUpdateAvatar.ts` `[读]`
- `page.account.profile.avatar.url` — 出处：分册 07 表行「输入头像 URL」；`UserAvatarEditor.tsx:124-150` `[读]`
- `page.account.profile.avatar.add-url` — 出处：分册 07 表行「用 URL 更新头像预览」；`UserAvatarEditor.tsx:55-74,130-137` `[读]`
- `page.account.profile.avatar.reset` — 出处：分册 07 表行「重置为默认字母头像」；`UserAvatarEditor.tsx:76-79,118-120` `[读]`
- `page.account.profile.avatar.suggest` — 出处：分册 07 表行「选用 OAuth 建议头像」；`UserAvatarEditor.tsx:91-97,122` `[读]`
- `page.account.profile.name` — 出处：分册 07 表行「改显示名」；`AccountProfileForm.tsx:216-230` `[读]`
- `page.account.profile.name.required` — 出处：分册 07 表行「必填名为空被拦」；`AccountProfileForm.tsx:222` `[读]`
- `page.account.profile.username` — 出处：分册 07 表行「改用户名」；`AccountProfileForm.tsx:231-254,108-125` `[读]`
- `page.account.profile.username.invalid` — 出处：分册 07 表行「用户名不合正则」；`AccountProfileForm.tsx:117-119` `[读]`
- `page.account.profile.username.taken` — 出处：分册 07 表行「用户名已被占用」；`AccountProfileForm.tsx:121-124` `[读]`
- `page.account.profile.status-type` — 出处：分册 07 表行「改在线状态点」；`AccountProfileForm.tsx:277-281,177-183` `[读]`
- `page.account.profile.status-text` — 出处：分册 07 表行「改状态文案（可 emoji）」；`AccountProfileForm.tsx:257-290` `[读]`
- `page.account.profile.status-duration` — 出处：分册 07 表行「选择状态自动清除」；`AccountProfileForm.tsx:291-349` `[读]`
- `page.account.profile.status-custom-date` — 出处：分册 07 表行「自定义状态过期日期」；`AccountProfileForm.tsx:315-328` `[读]`
- `page.account.profile.status-custom-time` — 出处：分册 07 表行「自定义状态过期时间」；`AccountProfileForm.tsx:330-345` `[读]`
- `page.account.profile.status-visibility` — 出处：分册 07 表行「选择对谁隐藏状态」；`AccountProfileForm.tsx:350-369,173-175` `[读]`
- `page.account.profile.nickname` — 出处：分册 07 表行「改昵称」；`AccountProfileForm.tsx:371-380` `[读]`
- `page.account.profile.bio` — 出处：分册 07 表行「改个人简介」；`AccountProfileForm.tsx:381-402` `[读]`
- `page.account.profile.email` — 出处：分册 07 表行「改自己的邮箱」；`AccountProfileForm.tsx:403-440` `[读]`
- `page.account.profile.email.invalid` — 出处：分册 07 表行「非法邮箱被拦」；`AccountProfileForm.tsx:417-419` `[读]`
- `page.account.profile.resend-verification` — 出处：分册 07 表行「重发验证邮件」；`AccountProfileForm.tsx:432-436,52,100-106` `[读]`
- `page.account.profile.custom-fields` — 出处：分册 07 表行「填写工作区自定义资料字段」；`AccountProfileForm.tsx:441` `[读]`
- `page.account.profile.cancel` — 出处：分册 07 表行「放弃未保存资料」；`AccountProfilePage.tsx:141-144` `[读]`
- `page.account.profile.save` — 出处：分册 07 表行「保存资料/状态/头像」；`AccountProfileForm.tsx:132-191` `AccountProfilePage.tsx:145-147` `[读]`
- `page.account.profile.logout-others` — 出处：分册 07 表行「登出其他客户端」；`AccountProfilePage.tsx:49-64,128-130` `[读]`
- `page.account.profile.delete` — 出处：分册 07 表行「删除自己的账号」；`AccountProfilePage.tsx:93-114,131-135` `ActionConfirmModal.tsx:39-45` `[读]`
- `page.account.profile.delete.invalid-password` — 出处：分册 07 表行「删号密码错误」；`ActionConfirmModal.tsx:31-34` `AccountProfilePage.tsx:105-107` `[读]`
- `page.account.profile.delete.last-owner` — 出处：分册 07 表行「末位房主删号需二次确认」；`AccountProfilePage.tsx:66-91,99-103` `[读]`
- `page.account.preferences.language` — 出处：分册 07 表行「改界面语言」；`PreferencesLocalizationSection.tsx:18-26` `[读]`
- `page.account.preferences.dont-ask-again` — 出处：分册 07 表行「管理「不再询问」列表」；`PreferencesGlobalSection.tsx:17-32` `AccountPreferencesPage.tsx:61-67` `[读]`
- `page.account.preferences.auto-away` — 出处：分册 07 表行「开关自动离开」；`PreferencesUserPresenceSection.tsx:13-23` `[读]`
- `page.account.preferences.idle-time` — 出处：分册 07 表行「设置空闲秒数」；`PreferencesUserPresenceSection.tsx:24-35` `[读]`
- `page.account.preferences.desktop-permission` — 出处：分册 07 表行「向浏览器要通知权或发测试通知」；`PreferencesNotificationsSection.tsx:99-114` `[读]`
- `page.account.preferences.desktop-require-interaction` — 出处：分册 07 表行「开关桌面通知需交互才消失」；`PreferencesNotificationsSection.tsx:115-125` `[读]`
- `page.account.preferences.desktop-default` — 出处：分册 07 表行「选桌面通知默认范围」；`PreferencesNotificationsSection.tsx:126-135` `[读]`
- `page.account.preferences.desktop-voice` — 出处：分册 07 表行「开关桌面语音来电通知」；`PreferencesNotificationsSection.tsx:136-145` `[读]`
- `page.account.preferences.push-default` — 出处：分册 07 表行「选移动推送默认范围」；`PreferencesNotificationsSection.tsx:146-155` `[读]`
- `page.account.preferences.email-mode` — 出处：分册 07 表行「选邮件通知模式」；`PreferencesNotificationsSection.tsx:156-169` `[读]`
- `page.account.preferences.login-email` — 出处：分册 07 表行「开关登录检测邮件」；`PreferencesNotificationsSection.tsx:170-182` `[读]`
- `page.account.preferences.calendar-notify` — 出处：分册 07 表行「开关日历事件通知」；`PreferencesNotificationsSection.tsx:183-194` `[读]`
- `page.account.preferences.mobile-ringing` — 出处：分册 07 表行「开关移动端响铃」；`PreferencesNotificationsSection.tsx:195-206` `[读]`
- `page.account.preferences.unread-alert` — 出处：分册 07 表行「开关托盘未读提示」；`PreferencesMessagesSection.tsx:37-46` `[读]`
- `page.account.preferences.threads-in-main` — 出处：分册 07 表行「开关线程回复进主频道」；`PreferencesMessagesSection.tsx:47-57` `[读]`
- `page.account.preferences.thread-to-channel` — 出处：分册 07 表行「选「同时发到频道」默认」；`PreferencesMessagesSection.tsx:58-68` `[读]`
- `page.account.preferences.link-clock` — 出处：分册 07 表行「跳到外观页改时间格式」；`PreferencesMessagesSection.tsx:69-74` `[读]`
- `page.account.preferences.use-emojis` — 出处：分册 07 表行「开关使用 emoji」；`PreferencesMessagesSection.tsx:75-84` `[读]`
- `page.account.preferences.ascii-emoji` — 出处：分册 07 表行「开关 ASCII 转 emoji」；`PreferencesMessagesSection.tsx:85-94` `[读]`
- `page.account.preferences.auto-images` — 出处：分册 07 表行「开关自动加载图片」；`PreferencesMessagesSection.tsx:95-104` `[读]`
- `page.account.preferences.mobile-bandwidth` — 出处：分册 07 表行「开关节省移动流量」；`PreferencesMessagesSection.tsx:105-114` `[读]`
- `page.account.preferences.collapse-media` — 出处：分册 07 表行「开关默认折叠嵌入媒体」；`PreferencesMessagesSection.tsx:115-124` `[读]`
- `page.account.preferences.link-usernames` — 出处：分册 07 表行「跳到外观页改是否显示用户名」；`PreferencesMessagesSection.tsx:125-130` `[读]`
- `page.account.preferences.link-roles` — 出处：分册 07 表行「跳到外观页改是否显示角色」；`PreferencesMessagesSection.tsx:131-136` `[读]`
- `page.account.preferences.hide-flextab` — 出处：分册 07 表行「开关隐藏右侧 flextab」；`PreferencesMessagesSection.tsx:137-146` `[读]`
- `page.account.preferences.display-avatars` — 出处：分册 07 表行「开关消息头像」；`PreferencesMessagesSection.tsx:147-156` `[读]`
- `page.account.preferences.send-on-enter` — 出处：分册 07 表行「选 Enter 发送行为」；`PreferencesMessagesSection.tsx:157-164` `[读]`
- `page.account.preferences.highlights` — 出处：分册 07 表行「编辑高亮词列表」；`PreferencesHighlightsSection.tsx:11-21` `AccountPreferencesPage.tsx:50-58` `[读]`
- `page.account.preferences.master-volume` — 出处：分册 07 表行「调主音量」；`PreferencesSoundSection.tsx:25-31` `[读]`
- `page.account.preferences.notification-volume` — 出处：分册 07 表行「调通知音量（并试听）」；`PreferencesSoundSection.tsx:32-53` `[读]`
- `page.account.preferences.ringer-volume` — 出处：分册 07 表行「调来电铃声音量（并试听）」；`PreferencesSoundSection.tsx:54-75` `[读]`
- `page.account.preferences.new-room-sound` — 出处：分册 07 表行「选新房间提示音」；`PreferencesSoundSection.tsx:76-93` `[读]`
- `page.account.preferences.new-message-sound` — 出处：分册 07 表行「选新消息提示音」；`PreferencesSoundSection.tsx:94-113` `[读]`
- `page.account.preferences.mute-focused` — 出处：分册 07 表行「开关静音已聚焦会话」；`PreferencesSoundSection.tsx:114-123` `[读]`
- `page.account.preferences.download-my-data` — 出处：分册 07 表行「申请下载自己的数据（非完整导出）」；`PreferencesMyDataSection.tsx:75-83,16-73` `[读]`
- `page.account.preferences.export-my-data` — 出处：分册 07 表行「申请完整导出自己的数据」；`PreferencesMyDataSection.tsx:76-86` `[读]`
- `page.account.preferences.cancel` — 出处：分册 07 表行「放弃未保存偏好」；`AccountPreferencesPage.tsx:95` `[读]`
- `page.account.preferences.save` — 出处：分册 07 表行「保存所有脏偏好」；`AccountPreferencesPage.tsx:36-70,96-98` `[读]`
- `page.account.security.password` — 出处：分册 07 表行「输入新密码」；`ChangePassword.tsx:62-97` `[读]`
- `page.account.security.password-confirm` — 出处：分册 07 表行「确认新密码」；`ChangePassword.tsx:98-127` `[读]`
- `page.account.security.password.cancel` — 出处：分册 07 表行「清空未保存新密」；`AccountSecurityPage.tsx:84` `[读]`
- `page.account.security.password.save` — 出处：分册 07 表行「提交改密」；`ChangePassword.tsx:43-57` `AccountSecurityPage.tsx:85-87` `[读]`
- `page.account.security.totp.toggle` — 出处：分册 07 表行「开关 TOTP 二次验证」；`TwoFactorTOTP.tsx:31-32,100-106,151-154` `[读]`
- `page.account.security.totp.secret` — 出处：分册 07 表行「复制 TOTP 密钥（替代扫码）」；`TwoFactorTOTP.tsx:156-161` `[读]`
- `page.account.security.totp.verify` — 出处：分册 07 表行「用应用码完成 TOTP 启用」；`TwoFactorTOTP.tsx:111-128,162-170` `[读]`
- `page.account.security.totp.regenerate` — 出处：分册 07 表行「重新生成备份码」；`TwoFactorTOTP.tsx:130-145,173-180` `[读]`
- `page.account.security.email-2fa` — 出处：分册 07 表行「开关邮件二次验证」；`TwoFactorEmail.tsx:18-37,43-47` `[读]`
- `page.account.security.e2e-passphrase` — 出处：分册 07 表行「输入新 E2E 口令」；`ChangePassphrase.tsx:109-161` `[读]`
- `page.account.security.e2e-passphrase-confirm` — 出处：分册 07 表行「确认新 E2E 口令」；`ChangePassphrase.tsx:162-193` `[读]`
- `page.account.security.e2e-enter-current` — 出处：分册 07 表行「先输入当前 E2E 口令才能改」；`ChangePassphrase.tsx:145-159` `[读]`
- `page.account.security.e2e-save` — 出处：分册 07 表行「保存新 E2E 口令」；`ChangePassphrase.tsx:87-97,195-197` `[读]`
- `page.account.security.e2e-reset` — 出处：分册 07 表行「重置 E2E 密钥并登出」；`ResetPassphrase.tsx:6-18` `useResetE2EPasswordMutation.ts:10-17` `[读]`
- `page.account.accessibility.link-statement` — 出处：分册 07 表行「打开无障碍声明外链」；`AccessibilityPage.tsx:100-102` `[读]`
- `page.account.accessibility.link-glossary` — 出处：分册 07 表行「打开简写术语表外链」；`AccessibilityPage.tsx:103-105` `[读]`
- `page.account.accessibility.link-docs` — 出处：分册 07 表行「打开无障碍功能文档」；`AccessibilityPage.tsx:106-108` `[读]`
- `page.account.accessibility.theme.light` — 出处：分册 07 表行「选浅色主题」；`themeItems.ts:9-13` `AccessibilityPage.tsx:113-137` `[读]`
- `page.account.accessibility.theme.dark` — 出处：分册 07 表行「选深色主题」；`themeItems.ts:14-18` `[读]`
- `page.account.accessibility.theme.high-contrast` — 出处：分册 07 表行「选高对比主题」；`themeItems.ts:19-23` `[读]`
- `page.account.accessibility.theme.auto` — 出处：分册 07 表行「选跟随系统主题」；`themeItems.ts:24-28` `[读]`
- `page.account.accessibility.font-size` — 出处：分册 07 表行「改字号」；`AccessibilityPage.tsx:144-150,69-72` `[读]`
- `page.account.accessibility.mentions-symbol` — 出处：分册 07 表行「开关 @ 提及符号」；`AccessibilityPage.tsx:151-168` `[读]`
- `page.account.accessibility.clock-mode` — 出处：分册 07 表行「选消息时间格式」；`AccessibilityPage.tsx:169-178` `[读]`
- `page.account.accessibility.show-usernames` — 出处：分册 07 表行「开关显示作者用户名」；`AccessibilityPage.tsx:179-191` `[读]`
- `page.account.accessibility.show-roles` — 出处：分册 07 表行「开关显示作者角色」；`AccessibilityPage.tsx:192-206` `[读]`
- `page.account.accessibility.cancel` — 出处：分册 07 表行「放弃未保存外观」；`AccessibilityPage.tsx:214` `[读]`
- `page.account.accessibility.save` — 出处：分册 07 表行「保存外观与无障碍」；`AccessibilityPage.tsx:63-78,215-217` `[读]`
- `page.account.feature-preview.empty` — 出处：分册 07 表行「无预览功能时看空态」；`AccountFeaturePreviewPage.tsx:82-87` `[读]`
- `page.account.feature-preview.secondary-sidebar` — 出处：分册 07 表行「开关二级侧栏预览」；`useFeaturePreviewList.ts:22-30` `AccountFeaturePreviewPage.tsx:100-111` `[读]`
- `page.account.feature-preview.ai-search` — 出处：分册 07 表行「开关智能搜索预览」；`useFeaturePreviewList.ts:31-37` `[读]`
- `page.account.feature-preview.cancel` — 出处：分册 07 表行「放弃未保存预览开关」；`AccountFeaturePreviewPage.tsx:130` `[读]`
- `page.account.feature-preview.save` — 出处：分册 07 表行「保存功能预览开关」；`AccountFeaturePreviewPage.tsx:58-68,131-133` `[读]`
- `page.account.integrations.select` — 出处：分册 07 表行「选择要移除的 WebDAV 账号」；`AccountIntegrationsPage.tsx:48-61` `[读]`
- `page.account.integrations.remove` — 出处：分册 07 表行「移除所选 WebDAV 账号」；`AccountIntegrationsPage.tsx:31-42,58-60` `[读]`
- `page.account.tokens.name` — 出处：分册 07 表行「填写新令牌名」；`AddToken.tsx:74-86` `[读]`
- `page.account.tokens.name.required` — 出处：分册 07 表行「空名被拦」；`AddToken.tsx:77` `[读]`
- `page.account.tokens.bypass-2fa` — 出处：分册 07 表行「选令牌是否绕过 2FA」；`AddToken.tsx:34-40,88-93` `[读]`
- `page.account.tokens.add` — 出处：分册 07 表行「生成个人访问令牌」；`AddToken.tsx:42-65,95-97` `[读]`
- `page.account.tokens.regenerate` — 出处：分册 07 表行「重新生成某令牌」；`AccountTokensTable.tsx:66-101` `AccountTokensRow.tsx:31` `[读]`
- `page.account.tokens.remove` — 出处：分册 07 表行「撤销某令牌」；`AccountTokensTable.tsx:103-123` `AccountTokensRow.tsx:32` `[读]`
- `page.account.tokens.pagination` — 出处：分册 07 表行「翻页浏览令牌」；`AccountTokensTable.tsx:41-50,172-180` `[读]`
- `page.account.tokens.empty` — 出处：分册 07 表行「无令牌时空态」；`AccountTokensTable.tsx:183` `[读]`
- `page.account.tokens.retry` — 出处：分册 07 表行「加载失败后重试」；`AccountTokensTable.tsx:125-140` `[读]`
- `page.account.sessions.sort.client` — 出处：分册 07 表行「按客户端排序会话」；`DeviceManagementAccountTable.tsx:42-44` `[读]`
- `page.account.sessions.sort.os` — 出处：分册 07 表行「按操作系统排序」；`DeviceManagementAccountTable.tsx:45-47` `[读]`
- `page.account.sessions.sort.login-at` — 出处：分册 07 表行「按最后登录排序」；`DeviceManagementAccountTable.tsx:48-50` `[读]`
- `page.account.sessions.pagination` — 出处：分册 07 表行「翻页会话」；`DeviceManagementAccountTable.tsx:20,72-77` `[读]`
- `page.account.sessions.logout` — 出处：分册 07 表行「登出某一设备（含当前）」；`DeviceManagementAccountRow.tsx:24,42-44` `[读]`
- `page.account.omnichannel.hide-after-close` — 出处：分册 07 表行「开关关单后隐藏会话」；`PreferencesGeneral.tsx:11-21` `[读]`
- `page.account.omnichannel.transcript-pdf` — 出处：分册 07 表行「开关 PDF transcript」；`PreferencesConversationTranscript.tsx:22-40` `[读]`
- `page.account.omnichannel.transcript-email` — 出处：分册 07 表行「开关邮件 transcript」；`PreferencesConversationTranscript.tsx:41-56` `[读]`
- `page.account.omnichannel.cancel` — 出处：分册 07 表行「放弃未保存坐席偏好」；`OmnichannelPreferencesPage.tsx:64` `[读]`
- `page.account.omnichannel.save` — 出处：分册 07 表行「保存坐席全渠道偏好」；`OmnichannelPreferencesPage.tsx:37-47,65-66` `[读]`
- `page.directory.tab.channels` — 出处：分册 07 表行「切到频道目录」；`DirectoryPage.tsx:43-45,59` `ChannelsTab.tsx:6-13` `[读]`
- `page.directory.tab.users` — 出处：分册 07 表行「切到用户目录」；`DirectoryPage.tsx:46-48,60` `UsersTab.tsx:10-18` `[读]`
- `page.directory.tab.teams` — 出处：分册 07 表行「切到团队目录」；`DirectoryPage.tsx:49-51,61` `TeamsTab.tsx:6-13` `[读]`
- `page.directory.tab.external` — 出处：分册 07 表行「联邦外部用户页签（当前不渲染）」；`DirectoryPage.tsx:17,30-32,52-62` `[读]`
- `page.directory.channels.search` — 出处：分册 07 表行「搜索频道」；`ChannelsTable.tsx:26,101` `useDirectoryQuery.ts` `[读]`
- `page.directory.channels.sort.name` — 出处：分册 07 表行「按名称排序频道」；`ChannelsTable.tsx:37-39` `[读]`
- `page.directory.channels.sort.users` — 出处：分册 07 表行「按人数排序频道」；`ChannelsTable.tsx:40-49` `[读]`
- `page.directory.channels.sort.created` — 出处：分册 07 表行「按创建时间排序」；`ChannelsTable.tsx:50-61` `[读]`
- `page.directory.channels.sort.last-message` — 出处：分册 07 表行「按最后消息排序」；`ChannelsTable.tsx:62-74` `[读]`
- `page.directory.channels.col.belongs-to` — 出处：分册 07 表行「只读「所属团队」列」；`ChannelsTable.tsx:75-78` `[读]`
- `page.directory.channels.pagination` — 出处：分册 07 表行「翻页频道」；`ChannelsTable.tsx:120-128` `[读]`
- `page.directory.channels.row` — 出处：分册 07 表行「点行进入频道/私组」；`ChannelsTable.tsx:90-97` `ChannelsTableRow.tsx:24` `[读]`
- `page.directory.channels.empty` — 出处：分册 07 表行「无匹配频道」；`ChannelsTable.tsx:131` `[读]`
- `page.directory.channels.error` — 出处：分册 07 表行「目录加载失败后重载」；`ChannelsTable.tsx:132-139` `[读]`
- `page.directory.channels.not-authorized` — 出处：分册 07 表行「无 view-c-room 看未授权页」；`ChannelsTab.tsx:6-13` `[读]`
- `page.directory.users.search` — 出处：分册 07 表行「搜索用户」；`UsersTable.tsx:105` `[读]`
- `page.directory.users.sort.name` — 出处：分册 07 表行「按姓名排序用户」；`UsersTable.tsx:42-44` `[读]`
- `page.directory.users.sort.email` — 出处：分册 07 表行「按邮箱排序」；`UsersTable.tsx:45-56` `[读]`
- `page.directory.users.sort.created` — 出处：分册 07 表行「按加入时间排序」；`UsersTable.tsx:69-80` `[读]`
- `page.directory.users.pagination` — 出处：分册 07 表行「翻页用户」；`UsersTable.tsx:131-139` `[读]`
- `page.directory.users.row` — 出处：分册 07 表行「点行打开与该用户的 DM」；`UsersTable.tsx:93-101` `[读]`
- `page.directory.users.empty` — 出处：分册 07 表行「无匹配用户」；`UsersTable.tsx:142` `[读]`
- `page.directory.users.error` — 出处：分册 07 表行「用户目录失败重载」；`UsersTable.tsx:143-150` `[读]`
- `page.directory.users.not-authorized` — 出处：分册 07 表行「缺 outside/d 权限看未授权」；`UsersTab.tsx:11-18` `[读]`
- `page.directory.teams.search` — 出处：分册 07 表行「搜索团队」；`TeamsTable.tsx:26,77` `[读]`
- `page.directory.teams.sort.name` — 出处：分册 07 表行「按名称排序团队」；`TeamsTable.tsx:34-36` `[读]`
- `page.directory.teams.col.channels` — 出处：分册 07 表行「只读频道数（不排序）」；`TeamsTable.tsx:37-39` `[读]`
- `page.directory.teams.sort.created` — 出处：分册 07 表行「按创建时间排序团队」；`TeamsTable.tsx:40-51` `[读]`
- `page.directory.teams.pagination` — 出处：分册 07 表行「翻页团队」；`TeamsTable.tsx:101-109` `[读]`
- `page.directory.teams.row` — 出处：分册 07 表行「点行进入团队主房间」；`TeamsTable.tsx:66-73` `[读]`
- `page.directory.teams.empty` — 出处：分册 07 表行「无匹配团队」；`TeamsTable.tsx:112` `[读]`
- `page.directory.teams.error` — 出处：分册 07 表行「团队目录失败重载」；`TeamsTable.tsx:113-120` `[读]`
- `page.directory.teams.not-authorized` — 出处：分册 07 表行「无 view-c-room 看未授权」；`TeamsTab.tsx:6-13` `[读]`
- `page.home.customize` — 出处：分册 07 表行「从 Home 头进入 Layout 设置」；`HomePageHeader.tsx:10-18` `[读]`
- `page.home.add-users` — 出处：分册 07 表行「从欢迎卡去用户管理」；`AddUsersCard.tsx:11-23` `DefaultHomePage.tsx:18,37` `[读]`
- `page.home.create-channel` — 出处：分册 07 表行「从欢迎卡打开创建频道」；`CreateChannelsCard.tsx:12-21` `DefaultHomePage.tsx:38` `[读]`
- `page.home.open-directory` — 出处：分册 07 表行「从欢迎卡打开目录」；`JoinRoomsCard.tsx:11-22` `DefaultHomePage.tsx:39` `[读]`
- `page.home.mobile.google` — 出处：分册 07 表行「打开 Google Play」；`MobileAppsCard.tsx:21-23` `[读]`
- `page.home.mobile.apple` — 出处：分册 07 表行「打开 App Store」；`MobileAppsCard.tsx:24-26` `[读]`
- `page.home.desktop.windows` — 出处：分册 07 表行「打开 Windows 客户端下载」；`DesktopAppsCard.tsx:22-24` `[读]`
- `page.home.desktop.linux` — 出处：分册 07 表行「打开 Linux 客户端下载」；`DesktopAppsCard.tsx:25-27` `[读]`
- `page.home.desktop.mac` — 出处：分册 07 表行「打开 Mac 客户端下载」；`DesktopAppsCard.tsx:28-30` `[读]`
- `page.home.docs` — 出处：分册 07 表行「打开产品文档」；`DocumentationCard.tsx:20-22` `[读]`
- `page.home.custom.body` — 出处：分册 07 表行「阅读自定义 Home HTML」；`CustomContentCard.tsx:52-99` `HomePage.tsx:6-13` `[读]`
- `page.home.custom.edit-layout` — 出处：分册 07 表行「admin 从自定义卡去改 Layout」；`CustomContentCard.tsx:63-65` `[读]`
- `page.home.custom.visibility` — 出处：分册 07 表行「admin 对工作区显示/隐藏自定义块」；`CustomContentCard.tsx:24-30,66-74` `[读]`
- `page.home.custom.only` — 出处：分册 07 表行「admin 开关「只显示自定义」」；`CustomContentCard.tsx:32-38,75-83` `[读]`
- `page.admin.workspace.download-info` — 出处：分册 07 表行「下载工作区信息 JSON」；WorkspacePage.tsx [读]
- `page.admin.workspace.refresh` — 出处：分册 07 表行「刷新工作区统计」；WorkspaceRoute.tsx [读]
- `page.admin.workspace.register` — 出处：分册 07 表行「打开注册工作区向导」；VersionCard.tsx [读]
- `page.admin.workspace.register.token` — 出处：分册 07 表行「用 token 注册工作区」；RegisterWorkspaceTokenModal.tsx [读]
- `page.admin.workspace.register.intent` — 出处：分册 07 表行「走 Cloud 注册意图/轮询」；RegisterWorkspaceSetupStepTwoModal.tsx [读]
- `page.admin.workspace.sync` — 出处：分册 07 表行「已注册工作区同步 Cloud」；RegisteredWorkspaceModal.tsx [读]
- `page.admin.workspace.update` — 出处：分册 07 表行「打开版本更新外链」；VersionCard.tsx [读]
- `page.admin.workspace.manage-subscription` — 出处：分册 07 表行「从版本卡去订阅页」；VersionCard.tsx [读]
- `page.admin.workspace.instances` — 出处：分册 07 表行「查看部署实例列表」；DeploymentCard.tsx InstancesModal.tsx [读]
- `page.admin.subscription.sync` — 出处：分册 07 表行「同步许可证状态」；SubscriptionPage.tsx useWorkspaceSync [读]
- `page.admin.subscription.checkout` — 出处：分册 07 表行「打开购买/升级结账」；SubscriptionPage.tsx useCheckoutUrl [读]
- `page.admin.subscription.cancel` — 出处：分册 07 表行「取消订阅」；useCancelSubscriptionModal.tsx [读]
- `page.admin.subscription.license-text` — 出处：分册 07 表行「粘贴许可证密钥」；ManageLicenseModal.tsx [读]
- `page.admin.subscription.apply` — 出处：分册 07 表行「应用许可证密钥」；ManageLicenseModal.tsx useValidateLicense [读]
- `page.admin.subscription.upload` — 出处：分册 07 表行「上传许可证文件」；useLicenseFileInput.ts [读]
- `page.admin.subscription.remove` — 出处：分册 07 表行「移除许可证密钥」；useRemoveLicense.ts [读]
- `page.admin.subscription.copy-url` — 出处：分册 07 表行「复制站点 URL / 哈希」；PlanCardLicenseDetails.tsx [读]
- `page.admin.engagement.timezone` — 出处：分册 07 表行「改报表默认时区」；EngagementDashboardPage.tsx [读]
- `page.admin.engagement.tab.users` — 出处：分册 07 表行「切到 Users 分析」；EngagementDashboardPage.tsx [读]
- `page.admin.engagement.tab.messages` — 出处：分册 07 表行「切到 Messages 分析」；EngagementDashboardPage.tsx [读]
- `page.admin.engagement.tab.channels` — 出处：分册 07 表行「切到 Channels 分析」；EngagementDashboardPage.tsx [读]
- `page.admin.engagement.users.new.period` — 出处：分册 07 表行「改新用户图周期」；users/NewUsersSection.tsx [读]
- `page.admin.engagement.users.new.download` — 出处：分册 07 表行「下载新用户图数据」；users/NewUsersSection.tsx [读]
- `page.admin.engagement.users.active.download` — 出处：分册 07 表行「下载活跃用户图数据」；users/ActiveUsersSection.tsx [读]
- `page.admin.engagement.users.tod.period` — 出处：分册 07 表行「改日内时段用户图周期」；users/UsersByTimeOfTheDaySection.tsx [读]
- `page.admin.engagement.users.tod.download` — 出处：分册 07 表行「下载日内时段用户图」；users/UsersByTimeOfTheDaySection.tsx [读]
- `page.admin.engagement.users.busiest.period` — 出处：分册 07 表行「改最忙时段粒度 Hours/Days」；users/BusiestChatTimesSection.tsx [读]
- `page.admin.engagement.users.busiest.prev` — 出处：分册 07 表行「最忙时段上一窗口」；users/ContentForHours.tsx [读]
- `page.admin.engagement.users.busiest.next` — 出处：分册 07 表行「最忙时段下一窗口」；users/ContentForHours.tsx [读]
- `page.admin.engagement.messages.sent.period` — 出处：分册 07 表行「改发送消息图周期」；messages/MessagesSentSection.tsx [读]
- `page.admin.engagement.messages.sent.download` — 出处：分册 07 表行「下载发送消息图」；messages/MessagesSentSection.tsx [读]
- `page.admin.engagement.messages.channel.period` — 出处：分册 07 表行「改热门频道图周期」；messages/MessagesPerChannelSection.tsx [读]
- `page.admin.engagement.messages.channel.download` — 出处：分册 07 表行「下载热门频道图」；messages/MessagesPerChannelSection.tsx [读]
- `page.admin.engagement.channels.period` — 出处：分册 07 表行「改频道总览周期」；channels/ChannelsOverview.tsx [读]
- `page.admin.engagement.channels.download` — 出处：分册 07 表行「下载频道总览」；channels/ChannelsOverview.tsx [读]
- `page.admin.engagement.channels.pagination` — 出处：分册 07 表行「翻页频道总览」；channels/ChannelsOverview.tsx [读]
- `page.admin.moderation.tab.messages` — 出处：分册 07 表行「打开已举报消息」；ModerationConsolePage.tsx [读]
- `page.admin.moderation.tab.users` — 出处：分册 07 表行「打开已举报用户」；ModerationConsolePage.tsx [读]
- `page.admin.moderation.row` — 出处：分册 07 表行「点行打开举报详情」；ModerationConsoleTableRow.tsx [读]
- `page.admin.moderation.see-messages` — 出处：分册 07 表行「菜单查看该用户被举报消息」；ModerationConsoleActions.tsx [读]
- `page.admin.moderation.dismiss-user` — 出处：分册 07 表行「驳回该用户全部举报」；useDismissUserAction.tsx [读]
- `page.admin.moderation.delete-all-messages` — 出处：分册 07 表行「删除该用户全部被举报消息」；useDeleteMessagesAction.tsx [读]
- `page.admin.moderation.deactivate` — 出处：分册 07 表行「停用被举报用户」；useDeactivateUserAction [读]
- `page.admin.moderation.reset-avatar` — 出处：分册 07 表行「重置被举报用户头像」；useResetAvatarAction.tsx [读]
- `page.admin.moderation.dismiss-reports` — 出处：分册 07 表行「驳回单条消息举报」；ContextMessage.tsx [读]
- `page.admin.moderation.goto-message` — 出处：分册 07 表行「跳到原消息」；ContextMessage.tsx [读]
- `page.admin.moderation.delete-message` — 出处：分册 07 表行「删除单条被举报消息」；useDeleteMessage.tsx [读]
- `page.admin.rooms.search` — 出处：分册 07 表行「搜索房间」；RoomsTableFilters.tsx [读]
- `page.admin.rooms.filter.type` — 出处：分册 07 表行「按房间类型过滤」；RoomsTableFilters.tsx [读]
- `page.admin.rooms.sort` — 出处：分册 07 表行「排序房间列」；RoomsTable.tsx [读]
- `page.admin.rooms.pagination` — 出处：分册 07 表行「翻页房间」；RoomsTable.tsx [读]
- `page.admin.rooms.row` — 出处：分册 07 表行「打开房间编辑面板」；RoomsTable.tsx [读]
- `page.admin.rooms.edit.avatar` — 出处：分册 07 表行「改房间头像」；EditRoom.tsx name=roomAvatar [读]
- `page.admin.rooms.edit.name` — 出处：分册 07 表行「改房间名」；EditRoom.tsx name=roomName [读]
- `page.admin.rooms.edit.owner` — 出处：分册 07 表行「查看房主（只读）」；EditRoom.tsx name=roomOwner [读]
- `page.admin.rooms.edit.description` — 出处：分册 07 表行「改房间描述」；EditRoom.tsx name=roomDescription [读]
- `page.admin.rooms.edit.announcement` — 出处：分册 07 表行「改房间公告」；EditRoom.tsx name=roomAnnouncement [读]
- `page.admin.rooms.edit.topic` — 出处：分册 07 表行「改房间主题」；EditRoom.tsx name=roomTopic [读]
- `page.admin.rooms.edit.private` — 出处：分册 07 表行「切换私有/公开」；EditRoom.tsx name=roomType [读]
- `page.admin.rooms.edit.readonly` — 出处：分册 07 表行「切换只读」；EditRoom.tsx name=readOnly [读]
- `page.admin.rooms.edit.react-when-readonly` — 出处：分册 07 表行「只读时仍可反应」；EditRoom.tsx name=reactWhenReadOnly [读]
- `page.admin.rooms.edit.archived` — 出处：分册 07 表行「归档/取消归档」；EditRoom.tsx name=archived [读]
- `page.admin.rooms.edit.default` — 出处：分册 07 表行「设为默认房间」；EditRoom.tsx name=isDefault [读]
- `page.admin.rooms.edit.favorite` — 出处：分册 07 表行「默认收藏」；EditRoom.tsx name=favorite [读]
- `page.admin.rooms.edit.featured` — 出处：分册 07 表行「精选房间」；EditRoom.tsx name=featured [读]
- `page.admin.rooms.edit.reset` — 出处：分册 07 表行「重置未保存房间编辑」；EditRoom.tsx [读]
- `page.admin.rooms.edit.save` — 出处：分册 07 表行「保存房间设置」；EditRoom.tsx [读]
- `page.admin.rooms.edit.delete` — 出处：分册 07 表行「删除房间」；EditRoom.tsx useDeleteRoom [读]
- `page.admin.users.tab.all` — 出处：分册 07 表行「看全部用户」；AdminUsersPage.tsx [读]
- `page.admin.users.tab.pending` — 出处：分册 07 表行「看待处理用户」；AdminUsersPage.tsx [读]
- `page.admin.users.tab.active` — 出处：分册 07 表行「看活跃用户」；AdminUsersPage.tsx [读]
- `page.admin.users.tab.deactivated` — 出处：分册 07 表行「看已停用用户」；AdminUsersPage.tsx [读]
- `page.admin.users.search` — 出处：分册 07 表行「搜索用户」；UsersTableFilters.tsx [读]
- `page.admin.users.filter.role` — 出处：分册 07 表行「按角色过滤用户」；UsersTableFilters.tsx [读]
- `page.admin.users.sort` — 出处：分册 07 表行「排序用户列」；UsersTable.tsx [读]
- `page.admin.users.pagination` — 出处：分册 07 表行「翻页用户」；UsersTable.tsx [读]
- `page.admin.users.invite` — 出处：分册 07 表行「打开邀请面板」；UsersPageHeaderContent.tsx [读]
- `page.admin.users.invite.emails` — 出处：分册 07 表行「填写邀请邮箱列表」；AdminInviteUsers.tsx [读]
- `page.admin.users.invite.send` — 出处：分册 07 表行「发送邀请邮件」；AdminInviteUsers.tsx [读]
- `page.admin.users.invite.setup-smtp` — 出处：分册 07 表行「无 SMTP 时去配邮件」；AdminInviteUsers.tsx [读]
- `page.admin.users.new` — 出处：分册 07 表行「打开新建用户表单」；UsersPageHeaderContent.tsx [读]
- `page.admin.users.seats` — 出处：分册 07 表行「购买更多席位」；UsersPageHeaderContent.tsx SeatsCapUsage [读]
- `page.admin.users.row` — 出处：分册 07 表行「打开用户详情」；UsersTableRow.tsx [读]
- `page.admin.users.form.avatar` — 出处：分册 07 表行「设用户头像」；AdminUserForm.tsx name=avatar [读]
- `page.admin.users.form.email` — 出处：分册 07 表行「填 Email」；AdminUserForm.tsx name=email [读]
- `page.admin.users.form.verified` — 出处：分册 07 表行「标记邮箱已验证」；AdminUserForm.tsx name=verified [读]
- `page.admin.users.form.name` — 出处：分册 07 表行「填 Name」；AdminUserForm.tsx name=name [读]
- `page.admin.users.form.username` — 出处：分册 07 表行「填 Username」；AdminUserForm.tsx name=username [读]
- `page.admin.users.form.voip-extension` — 出处：分册 07 表行「填 Voice_call_extension」；AdminUserForm.tsx name=freeSwitchExtension [读]
- `page.admin.users.form.set-random-pwd` — 出处：分册 07 表行「选随机密码并邮件发送」；AdminUserSetRandomPasswordRadios.tsx [读]
- `page.admin.users.form.set-manual-pwd` — 出处：分册 07 表行「选手动设置密码」；AdminUserSetRandomPasswordRadios.tsx [读]
- `page.admin.users.form.require-change` — 出处：分册 07 表行「要求下次改密」；AdminUserSetRandomPasswordContent.tsx name=requirePasswordChange [读]
- `page.admin.users.form.password` — 出处：分册 07 表行「填 Password」；AdminUserSetRandomPasswordContent.tsx name=password [读]
- `page.admin.users.form.password-confirm` — 出处：分册 07 表行「确认 Password」；AdminUserSetRandomPasswordContent.tsx name=passwordConfirmation [读]
- `page.admin.users.form.roles` — 出处：分册 07 表行「分配 Roles」；AdminUserForm.tsx name=roles [读]
- `page.admin.users.form.join-default` — 出处：分册 07 表行「加入默认频道」；AdminUserForm.tsx name=joinDefaultChannels [读]
- `page.admin.users.form.send-welcome` — 出处：分册 07 表行「发送欢迎邮件」；AdminUserForm.tsx name=sendWelcomeEmail [读]
- `page.admin.users.form.show-additional` — 出处：分册 07 表行「展开/收起附加字段」；AdminUserForm.tsx [读]
- `page.admin.users.form.status-text` — 出处：分册 07 表行「填 StatusMessage」；AdminUserForm.tsx name=statusText [读]
- `page.admin.users.form.bio` — 出处：分册 07 表行「填 Bio」；AdminUserForm.tsx name=bio [读]
- `page.admin.users.form.nickname` — 出处：分册 07 表行「填 Nickname」；AdminUserForm.tsx name=nickname [读]
- `page.admin.users.form.custom-fields` — 出处：分册 07 表行「填自定义字段」；AdminUserForm.tsx name=customFields.* [读]
- `page.admin.users.form.save` — 出处：分册 07 表行「保存用户」；AdminUserForm.tsx [读]
- `page.admin.users.action.dm` — 出处：分册 07 表行「从详情开直连消息」；useAdminUserInfoActions.ts [读]
- `page.admin.users.action.edit` — 出处：分册 07 表行「从详情进入编辑」；useAdminUserInfoActions.ts [读]
- `page.admin.users.action.admin` — 出处：分册 07 表行「授予/撤销管理员」；useChangeAdminStatusAction.ts [读]
- `page.admin.users.action.deactivate` — 出处：分册 07 表行「停用/启用用户」；useChangeUserStatusAction.ts [读]
- `page.admin.users.action.reset-e2e` — 出处：分册 07 表行「重置用户 E2E 密钥」；useResetE2EEKeyAction.tsx [读]
- `page.admin.users.action.reset-totp` — 出处：分册 07 表行「重置用户 TOTP」；useResetTOTPAction.tsx [读]
- `page.admin.users.action.delete` — 出处：分册 07 表行「删除用户」；useDeleteUserAction.tsx [读]
- `page.admin.ai-center.view-options` — 出处：分册 07 表行「无 AI 许可时去看订阅选项」；AICenterOverview.tsx [读]
- `page.admin.ai-center.search` — 出处：分册 07 表行「配置智能搜索」；AICenterOverview.tsx AISettingsSection.tsx section=Intelligent_Search [读]
- `page.admin.ai-center.llm` — 出处：分册 07 表行「管理 LLM 提供方」；AICenterOverview.tsx AISettingsSection.tsx section=AI_LLM_Provider [读]
- `page.admin.ai-center.mcp` — 出处：分册 07 表行「配置 MCP」；AICenterOverview.tsx AISettingsSection.tsx section=MCP [读]
- `page.admin.ai-center.section.save` — 出处：分册 07 表行「保存当前 AI 设置段」；AISettingsSection.tsx [读]
- `page.admin.invites.list` — 出处：分册 07 表行「查看邀请链接表」；InvitesPage.tsx [读]
- `page.admin.invites.remove` — 出处：分册 07 表行「撤销一条邀请」；InviteRow.tsx [读]
- `page.admin.invites.reload` — 出处：分册 07 表行「加载失败后重载邀请表」；InvitesPage.tsx [读]
- `page.admin.user-status.new` — 出处：分册 07 表行「打开新建自定义状态」；CustomUserStatusRoute.tsx [读]
- `page.admin.user-status.presence-service` — 出处：分册 07 表行「去 Presence 服务设置」；CustomUserStatusRoute.tsx [读]
- `page.admin.user-status.row` — 出处：分册 07 表行「打开编辑自定义状态」；CustomUserStatusRoute.tsx [读]
- `page.admin.user-status.name` — 出处：分册 07 表行「填状态 Name」；CustomUserStatusForm.tsx name=name [读]
- `page.admin.user-status.type` — 出处：分册 07 表行「选 Presence 类型」；CustomUserStatusForm.tsx name=statusType [读]
- `page.admin.user-status.cancel` — 出处：分册 07 表行「取消未保存状态」；CustomUserStatusForm.tsx [读]
- `page.admin.user-status.save` — 出处：分册 07 表行「保存自定义状态」；CustomUserStatusForm.tsx [读]
- `page.admin.user-status.delete` — 出处：分册 07 表行「删除自定义状态」；CustomUserStatusForm.tsx [读]
- `page.admin.permissions.tab.permissions` — 出处：分册 07 表行「看权限矩阵」；PermissionsPage.tsx [读]
- `page.admin.permissions.tab.settings` — 出处：分册 07 表行「看设置权限」；PermissionsPage.tsx [读]
- `page.admin.permissions.search` — 出处：分册 07 表行「搜索权限名」；PermissionsTableFilter.tsx [读]
- `page.admin.permissions.toggle` — 出处：分册 07 表行「切换某角色某权限单元格」；RoleCell.tsx PermissionsTable.tsx [读]
- `page.admin.permissions.pagination` — 出处：分册 07 表行「翻页权限矩阵」；PermissionsTable.tsx [读]
- `page.admin.permissions.role.new` — 出处：分册 07 表行「打开新建角色」；PermissionsPage.tsx [读]
- `page.admin.permissions.role.name` — 出处：分册 07 表行「填角色名」；RoleForm.tsx name=name [读]
- `page.admin.permissions.role.description` — 出处：分册 07 表行「填角色描述」；RoleForm.tsx name=description [读]
- `page.admin.permissions.role.scope` — 出处：分册 07 表行「选角色 Scope」；RoleForm.tsx name=scope [读]
- `page.admin.permissions.role.mandatory-2fa` — 出处：分册 07 表行「强制该角色 2FA」；RoleForm.tsx name=mandatory2fa [读]
- `page.admin.permissions.role.save` — 出处：分册 07 表行「保存角色」；EditRolePage.tsx [读]
- `page.admin.permissions.role.delete` — 出处：分册 07 表行「删除角色」；EditRolePage.tsx [读]
- `page.admin.permissions.users-in-role` — 出处：分册 07 表行「打开角色成员」；EditRolePage.tsx [读]
- `page.admin.permissions.users-in-role.room` — 出处：分册 07 表行「按房间筛角色成员」；UsersInRolePage.tsx name=rid [读]
- `page.admin.permissions.users-in-role.users` — 出处：分册 07 表行「选择要加入的用户」；UsersInRolePage.tsx name=users [读]
- `page.admin.permissions.users-in-role.add` — 出处：分册 07 表行「把用户加入角色」；UsersInRolePage.tsx [读]
- `page.admin.permissions.users-in-role.remove` — 出处：分册 07 表行「从角色移除用户」；UsersInRoleTableRow.tsx [读]
- `page.admin.permissions.users-in-role.pagination` — 出处：分册 07 表行「翻页角色成员」；UsersInRolePage.tsx [读]
- `page.admin.abac.sync-ldap` — 出处：分册 07 表行「立即 LDAP 同步（ABAC 头）」；AdminABACPage.tsx [读]
- `page.admin.abac.learn-more` — 出处：分册 07 表行「打开 ABAC 文档」；AdminABACPage.tsx [读]
- `page.admin.abac.tab.settings` — 出处：分册 07 表行「打开 ABAC 设置页签」；AdminABACTabs.tsx [读]
- `page.admin.abac.tab.attributes` — 出处：分册 07 表行「打开房间属性页签」；AdminABACTabs.tsx [读]
- `page.admin.abac.tab.rooms` — 出处：分册 07 表行「打开 ABAC 房间页签」；AdminABACTabs.tsx [读]
- `page.admin.abac.tab.logs` — 出处：分册 07 表行「打开 ABAC 审计日志页签」；AdminABACTabs.tsx [读]
- `page.admin.abac.setting.enabled` — 出处：分册 07 表行「开关 ABAC」；ee/server/settings/abac.ts ABAC_Enabled [读]
- `page.admin.abac.setting.pdp-type` — 出处：分册 07 表行「选 PDP 类型 local/virtru」；ee/server/settings/abac.ts ABAC_PDP_Type [读]
- `page.admin.abac.setting.attribute-store` — 出处：分册 07 表行「选属性存储」；ee/server/settings/abac.ts ABAC_Attribute_Store [读]
- `page.admin.abac.setting.show-in-rooms` — 出处：分册 07 表行「房间内显示属性」；ee/server/settings/abac.ts ABAC_ShowAttributesInRooms [读]
- `page.admin.abac.setting.banners-enabled` — 出处：分册 07 表行「开关分级横幅」；ee/server/settings/abac.ts ABAC_Classification_Banners_Enabled [读]
- `page.admin.abac.setting.banners-config` — 出处：分册 07 表行「编辑分级横幅 JSON」；ee/server/settings/abac.ts ABAC_Classification_Banners_Config [读]
- `page.admin.abac.setting.cache-seconds` — 出处：分册 07 表行「设决策缓存秒数」；ee/server/settings/abac.ts Abac_Cache_Decision_Time_Seconds [读]
- `page.admin.abac.setting.virtru-url` — 出处：分册 07 表行「填 Virtru Base URL」；ee/server/settings/abac.ts ABAC_Virtru_Base_URL [读]
- `page.admin.abac.setting.virtru-client-id` — 出处：分册 07 表行「填 Virtru Client ID」；ee/server/settings/abac.ts ABAC_Virtru_Client_ID [读]
- `page.admin.abac.setting.virtru-secret` — 出处：分册 07 表行「填 Virtru Client Secret」；ee/server/settings/abac.ts ABAC_Virtru_Client_Secret [读]
- `page.admin.abac.setting.virtru-oidc` — 出处：分册 07 表行「填 Virtru OIDC Endpoint」；ee/server/settings/abac.ts ABAC_Virtru_OIDC_Endpoint [读]
- `page.admin.abac.setting.virtru-entity-key` — 出处：分册 07 表行「选默认实体键」；ee/server/settings/abac.ts ABAC_Virtru_Default_Entity_Key [读]
- `page.admin.abac.setting.virtru-namespace` — 出处：分册 07 表行「填属性命名空间」；ee/server/settings/abac.ts ABAC_Virtru_Attribute_Namespace [读]
- `page.admin.abac.setting.virtru-sync` — 出处：分册 07 表行「填同步 cron」；ee/server/settings/abac.ts ABAC_Virtru_Sync_Interval [读]
- `page.admin.abac.setting.test-virtru` — 出处：分册 07 表行「测试 Virtru PDP 连接」；abac.ts ABAC_Virtru_Test_Connection [读]
- `page.admin.abac.setting.save` — 出处：分册 07 表行「保存 ABAC 设置页签」；ABACSettingTab/SettingsPage.tsx [读]
- `page.admin.abac.attr.search` — 出处：分册 07 表行「搜索房间属性」；AttributesPage.tsx [读]
- `page.admin.abac.attr.new` — 出处：分册 07 表行「新建房间属性」；AttributesPage.tsx [读]
- `page.admin.abac.attr.pagination` — 出处：分册 07 表行「翻页房间属性」；AttributesPage.tsx [读]
- `page.admin.abac.attr.name` — 出处：分册 07 表行「填属性 Name」；AttributesForm.tsx name=name [读]
- `page.admin.abac.attr.value` — 出处：分册 07 表行「编辑/添加属性值」；AttributesForm.tsx attributeValues.*.value [读]
- `page.admin.abac.attr.remove-value` — 出处：分册 07 表行「删除某一属性值」；AttributesForm.tsx [读]
- `page.admin.abac.attr.save` — 出处：分册 07 表行「保存房间属性」；AttributesForm.tsx [读]
- `page.admin.abac.attr.delete` — 出处：分册 07 表行「删除整个属性」；useAttributeOptions.tsx [读]
- `page.admin.abac.rooms.search` — 出处：分册 07 表行「搜索 ABAC 房间」；RoomsPage.tsx [读]
- `page.admin.abac.rooms.filter` — 出处：分册 07 表行「按 All/Rooms/Attributes/Values 过滤」；RoomsPage.tsx [读]
- `page.admin.abac.rooms.add` — 出处：分册 07 表行「把房间纳入 ABAC」；RoomsPage.tsx [读]
- `page.admin.abac.rooms.pagination` — 出处：分册 07 表行「翻页 ABAC 房间」；RoomsPage.tsx [读]
- `page.admin.abac.rooms.room` — 出处：分册 07 表行「选择要托管的房间」；RoomForm.tsx name=room [读]
- `page.admin.abac.rooms.attr-key` — 出处：分册 07 表行「为房间选属性键」；RoomFormAttributeField.tsx name=attributes.*.key [读]
- `page.admin.abac.rooms.attr-values` — 出处：分册 07 表行「为房间选属性值」；RoomFormAttributeField.tsx name=attributes.*.values [读]
- `page.admin.abac.rooms.add-attr` — 出处：分册 07 表行「再加一条房间属性」；RoomForm.tsx [读]
- `page.admin.abac.rooms.save` — 出处：分册 07 表行「保存房间 ABAC 映射」；RoomForm.tsx [读]
- `page.admin.abac.rooms.remove` — 出处：分册 07 表行「从 ABAC 移除房间」；useRoomItems.tsx [读]
- `page.admin.devices.search` — 出处：分册 07 表行「搜索设备/用户会话」；DeviceManagementAdminTable.tsx [读]
- `page.admin.devices.sort.client` — 出处：分册 07 表行「按 Client 排序」；DeviceManagementAdminTable.tsx [读]
- `page.admin.devices.sort.os` — 出处：分册 07 表行「按 OS 排序」；DeviceManagementAdminTable.tsx [读]
- `page.admin.devices.sort.user` — 出处：分册 07 表行「按 User 排序」；DeviceManagementAdminTable.tsx [读]
- `page.admin.devices.sort.login` — 出处：分册 07 表行「按 Last_login 排序」；DeviceManagementAdminTable.tsx [读]
- `page.admin.devices.pagination` — 出处：分册 07 表行「翻页设备会话」；DeviceManagementAdminTable.tsx [读]
- `page.admin.devices.row` — 出处：分册 07 表行「打开设备详情」；DeviceManagementAdminRow.tsx [读]
- `page.admin.devices.logout` — 出处：分册 07 表行「登出该设备」；DeviceManagementInfo.tsx [读]
- `page.admin.email-inbox.new` — 出处：分册 07 表行「打开新建收件箱」；EmailInboxPage.tsx [读]
- `page.admin.email-inbox.row` — 出处：分册 07 表行「打开编辑收件箱」；EmailInboxPage.tsx [读]
- `page.admin.email-inbox.active` — 出处：分册 07 表行「开关收件箱启用」；EmailInboxForm.tsx name=active [读]
- `page.admin.email-inbox.name` — 出处：分册 07 表行「填收件箱名」；EmailInboxForm.tsx name=name [读]
- `page.admin.email-inbox.email` — 出处：分册 07 表行「填收件箱邮箱」；EmailInboxForm.tsx name=email [读]
- `page.admin.email-inbox.description` — 出处：分册 07 表行「填描述」；EmailInboxForm.tsx name=description [读]
- `page.admin.email-inbox.sender-info` — 出处：分册 07 表行「填发件人信息」；EmailInboxForm.tsx name=senderInfo [读]
- `page.admin.email-inbox.department` — 出处：分册 07 表行「选部门」；EmailInboxForm.tsx name=department [读]
- `page.admin.email-inbox.smtp-server` — 出处：分册 07 表行「填 SMTP 主机」；EmailInboxForm.tsx name=smtpServer [读]
- `page.admin.email-inbox.smtp-port` — 出处：分册 07 表行「填 SMTP 端口」；EmailInboxForm.tsx name=smtpPort [读]
- `page.admin.email-inbox.smtp-username` — 出处：分册 07 表行「填 SMTP 用户名」；EmailInboxForm.tsx name=smtpUsername [读]
- `page.admin.email-inbox.smtp-password` — 出处：分册 07 表行「填 SMTP 密码」；EmailInboxForm.tsx name=smtpPassword [读]
- `page.admin.email-inbox.smtp-secure` — 出处：分册 07 表行「开关 SMTP TLS」；EmailInboxForm.tsx name=smtpSecure [读]
- `page.admin.email-inbox.imap-server` — 出处：分册 07 表行「填 IMAP 主机」；EmailInboxForm.tsx name=imapServer [读]
- `page.admin.email-inbox.imap-port` — 出处：分册 07 表行「填 IMAP 端口」；EmailInboxForm.tsx name=imapPort [读]
- `page.admin.email-inbox.imap-username` — 出处：分册 07 表行「填 IMAP 用户名」；EmailInboxForm.tsx name=imapUsername [读]
- `page.admin.email-inbox.imap-password` — 出处：分册 07 表行「填 IMAP 密码」；EmailInboxForm.tsx name=imapPassword [读]
- `page.admin.email-inbox.imap-retries` — 出处：分册 07 表行「填 IMAP 重试次数」；EmailInboxForm.tsx name=imapRetries [读]
- `page.admin.email-inbox.imap-secure` — 出处：分册 07 表行「开关 IMAP TLS」；EmailInboxForm.tsx name=imapSecure [读]
- `page.admin.email-inbox.cancel` — 出处：分册 07 表行「取消未保存收件箱」；EmailInboxForm.tsx [读]
- `page.admin.email-inbox.save` — 出处：分册 07 表行「保存收件箱」；EmailInboxForm.tsx [读]
- `page.admin.email-inbox.delete` — 出处：分册 07 表行「删除收件箱」；EmailInboxForm.tsx [读]
- `page.admin.email-inbox.send-test` — 出处：分册 07 表行「发送测试邮件」；SendTestButton.tsx [读]
- `page.admin.mailer.from` — 出处：分册 07 表行「填 From」；MailerPage.tsx name=fromEmail [读]
- `page.admin.mailer.dry-run` — 出处：分册 07 表行「开关 Dry_run」；MailerPage.tsx name=dryRun [读]
- `page.admin.mailer.query` — 出处：分册 07 表行「填用户 Query」；MailerPage.tsx name=query [读]
- `page.admin.mailer.subject` — 出处：分册 07 表行「填 Subject」；MailerPage.tsx name=subject [读]
- `page.admin.mailer.body` — 出处：分册 07 表行「填 Email_body」；MailerPage.tsx name=emailBody [读]
- `page.admin.mailer.cancel` — 出处：分册 07 表行「重置未发送邮件」；MailerPage.tsx [读]
- `page.admin.mailer.send` — 出处：分册 07 表行「发送群发邮件」；MailerPage.tsx [读]
- `page.admin.oauth-apps.new` — 出处：分册 07 表行「打开新建 OAuth App」；OAuthAppsPage.tsx [读]
- `page.admin.oauth-apps.row` — 出处：分册 07 表行「打开编辑 OAuth App」；OAuthAppsTable.tsx [读]
- `page.admin.oauth-apps.active` — 出处：分册 07 表行「开关 Active」；OAuthAddApp.tsx / EditOauthApp.tsx name=active [读]
- `page.admin.oauth-apps.name` — 出处：分册 07 表行「填 Application_Name」；name=name [读]
- `page.admin.oauth-apps.redirect-uri` — 出处：分册 07 表行「填 Redirect_URI」；name=redirectUri [读]
- `page.admin.oauth-apps.cancel` — 出处：分册 07 表行「取消未保存 OAuth App」；OAuthAddApp.tsx EditOauthApp.tsx [读]
- `page.admin.oauth-apps.save` — 出处：分册 07 表行「保存 OAuth App」；OAuthAddApp.tsx EditOauthApp.tsx [读]
- `page.admin.oauth-apps.delete` — 出处：分册 07 表行「删除 OAuth App」；EditOauthApp.tsx [读]
- `page.admin.integrations.new` — 出处：分册 07 表行「打开新建集成」；IntegrationsPage.tsx [读]
- `page.admin.integrations.tab.all` — 出处：分册 07 表行「看全部集成」；IntegrationsPage.tsx [读]
- `page.admin.integrations.tab.incoming` — 出处：分册 07 表行「只看 Incoming」；IntegrationsPage.tsx [读]
- `page.admin.integrations.tab.outgoing` — 出处：分册 07 表行「只看 Outgoing」；IntegrationsPage.tsx [读]
- `page.admin.integrations.tab.zapier` — 出处：分册 07 表行「打开 Zapier 说明页签」；IntegrationsPage.tsx [读]
- `page.admin.integrations.tab.bots` — 出处：分册 07 表行「看 Bots 页签」；IntegrationsPage.tsx [读]
- `page.admin.integrations.search` — 出处：分册 07 表行「搜索集成」；IntegrationsTable.tsx [读]
- `page.admin.integrations.sort` — 出处：分册 07 表行「排序集成列」；IntegrationsTable.tsx [读]
- `page.admin.integrations.pagination` — 出处：分册 07 表行「翻页集成」；IntegrationsTable.tsx [读]
- `page.admin.integrations.row` — 出处：分册 07 表行「打开编辑集成」；IntegrationsTable.tsx [读]
- `page.admin.integrations.incoming.enabled` — 出处：分册 07 表行「开关启用」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.name` — 出处：分册 07 表行「填名称」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.channel` — 出处：分册 07 表行「选投递频道」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.username` — 出处：分册 07 表行「填投递用户名」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.alias` — 出处：分册 07 表行「填别名」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.avatar` — 出处：分册 07 表行「填头像 URL」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.emoji` — 出处：分册 07 表行「填 emoji」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.override-channel` — 出处：分册 07 表行「允许覆盖目标频道」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.script-enabled` — 出处：分册 07 表行「开脚本」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.script-engine` — 出处：分册 07 表行「选脚本引擎」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.script` — 出处：分册 07 表行「编辑脚本」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.copy-url` — 出处：分册 07 表行「复制 Webhook URL」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.copy-token` — 出处：分册 07 表行「复制 Token」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.copy-curl` — 出处：分册 07 表行「复制 Curl 示例」；IncomingWebhookForm.tsx [读]
- `page.admin.integrations.incoming.cancel` — 出处：分册 07 表行「取消 Incoming 未保存」；EditIncomingWebhook.tsx [读]
- `page.admin.integrations.incoming.save` — 出处：分册 07 表行「保存 Incoming webhook」；EditIncomingWebhook.tsx [读]
- `page.admin.integrations.incoming.delete` — 出处：分册 07 表行「删除 Incoming webhook」；EditIncomingWebhook.tsx [读]
- `page.admin.integrations.outgoing.event` — 出处：分册 07 表行「选事件触发器」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.enabled` — 出处：分册 07 表行「开关启用」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.name` — 出处：分册 07 表行「填名称」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.channel` — 出处：分册 07 表行「选频道（条件）」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.trigger-words` — 出处：分册 07 表行「填触发词（条件）」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.target-room` — 出处：分册 07 表行「填目标房间（条件）」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.urls` — 出处：分册 07 表行「填回调 URL」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.impersonate` — 出处：分册 07 表行「开关冒充用户」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.username` — 出处：分册 07 表行「填投递用户名」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.alias` — 出处：分册 07 表行「填别名」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.avatar` — 出处：分册 07 表行「填头像 URL」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.emoji` — 出处：分册 07 表行「填 emoji」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.token` — 出处：分册 07 表行「填/看 Token」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.script-enabled` — 出处：分册 07 表行「开脚本」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.script-engine` — 出处：分册 07 表行「选脚本引擎」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.script` — 出处：分册 07 表行「编辑脚本」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.retry-failed` — 出处：分册 07 表行「开关失败重试」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.retry-count` — 出处：分册 07 表行「填重试次数」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.retry-delay` — 出处：分册 07 表行「填重试延迟」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.trigger-anywhere` — 出处：分册 07 表行「触发词可在任意位置（sendMessage）」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.run-on-edits` — 出处：分册 07 表行「编辑消息也跑（sendMessage）」；OutgoingWebhookForm.tsx [读]
- `page.admin.integrations.outgoing.cancel` — 出处：分册 07 表行「取消 Outgoing 未保存」；EditOutgoingWebhook.tsx [读]
- `page.admin.integrations.outgoing.save` — 出处：分册 07 表行「保存 Outgoing webhook」；EditOutgoingWebhook.tsx [读]
- `page.admin.integrations.outgoing.delete` — 出处：分册 07 表行「删除 Outgoing webhook」；EditOutgoingWebhook.tsx [读]
- `page.admin.integrations.outgoing.history` — 出处：分册 07 表行「打开输出历史」；EditOutgoingWebhook.tsx OutgoingWebhookHistoryPage.tsx [读]
- `page.admin.integrations.outgoing.history.clear` — 出处：分册 07 表行「清空输出历史」；OutgoingWebhookHistoryPage.tsx [读]
- `page.admin.integrations.outgoing.history.replay` — 出处：分册 07 表行「重放一条历史」；HistoryItem.tsx [读]
- `page.admin.integrations.outgoing.history.pagination` — 出处：分册 07 表行「翻页输出历史」；OutgoingWebhookHistoryPage.tsx [读]
- `page.admin.import.new` — 出处：分册 07 表行「开始新导入」；ImportHistoryPage.tsx [读]
- `page.admin.import.download-files` — 出处：分册 07 表行「下载待导入文件」；ImportHistoryPage.tsx [读]
- `page.admin.import.download-avatars` — 出处：分册 07 表行「下载待导入头像」；ImportHistoryPage.tsx [读]
- `page.admin.import.history.row` — 出处：分册 07 表行「查看某次导入进度」；ImportHistoryPage.tsx ImportProgressPage.tsx [读]
- `page.admin.import.type` — 出处：分册 07 表行「选导入器类型」；NewImportPage.tsx [读]
- `page.admin.import.file-type` — 出处：分册 07 表行「选文件来源 upload/url/path」；NewImportPage.tsx [读]
- `page.admin.import.file` — 出处：分册 07 表行「选择本地导入文件」；NewImportPage.tsx [读]
- `page.admin.import.url` — 出处：分册 07 表行「填导入文件 URL」；NewImportPage.tsx [读]
- `page.admin.import.path` — 出处：分册 07 表行「填服务器文件路径」；NewImportPage.tsx [读]
- `page.admin.import.start-upload` — 出处：分册 07 表行「提交导入文件进入准备」；NewImportPage.tsx [读]
- `page.admin.import.prepare.tab.users` — 出处：分册 07 表行「准备页 Users 页签」；PrepareImportPage.tsx [读]
- `page.admin.import.prepare.tab.contacts` — 出处：分册 07 表行「准备页 Contacts 页签」；PrepareImportPage.tsx [读]
- `page.admin.import.prepare.tab.channels` — 出处：分册 07 表行「准备页 Channels 页签」；PrepareImportPage.tsx [读]
- `page.admin.import.prepare.tab.messages` — 出处：分册 07 表行「准备页 Messages 页签」；PrepareImportPage.tsx [读]
- `page.admin.import.prepare.users.select-all` — 出处：分册 07 表行「全选/取消导入用户」；PrepareUsers.tsx [读]
- `page.admin.import.prepare.users.toggle` — 出处：分册 07 表行「勾选单个用户是否导入」；PrepareUsers.tsx [读]
- `page.admin.import.prepare.users.pagination` — 出处：分册 07 表行「翻页准备用户」；PrepareUsers.tsx [读]
- `page.admin.import.prepare.channels.select-all` — 出处：分册 07 表行「全选/取消导入频道」；PrepareChannels.tsx [读]
- `page.admin.import.prepare.channels.toggle` — 出处：分册 07 表行「勾选单个频道是否导入」；PrepareChannels.tsx [读]
- `page.admin.import.prepare.channels.pagination` — 出处：分册 07 表行「翻页准备频道」；PrepareChannels.tsx [读]
- `page.admin.import.prepare.contacts.select-all` — 出处：分册 07 表行「全选/取消导入联系人」；PrepareContacts.tsx [读]
- `page.admin.import.prepare.contacts.toggle` — 出处：分册 07 表行「勾选单个联系人是否导入」；PrepareContacts.tsx [读]
- `page.admin.import.prepare.contacts.pagination` — 出处：分册 07 表行「翻页准备联系人」；PrepareContacts.tsx [读]
- `page.admin.import.prepare.start` — 出处：分册 07 表行「开始导入选中项」；PrepareImportPage.tsx [读]
- `page.admin.import.progress` — 出处：分册 07 表行「观看导入进度（只读）」；ImportProgressPage.tsx [读]
- `page.admin.reports.docs` — 出处：分册 07 表行「打开日志访问变更文档」；AnalyticsReports.tsx [读]
- `page.admin.reports.view-json` — 出处：分册 07 表行「阅读用量统计 JSON（只读）」；AnalyticsReports.tsx ViewLogsPage.tsx [读]
- `page.admin.sounds.search` — 出处：分册 07 表行「搜索自定义声音」；CustomSoundsTable.tsx [读]
- `page.admin.sounds.sort` — 出处：分册 07 表行「排序声音列」；CustomSoundsTable.tsx [读]
- `page.admin.sounds.pagination` — 出处：分册 07 表行「翻页声音」；CustomSoundsTable.tsx [读]
- `page.admin.sounds.new` — 出处：分册 07 表行「打开新建声音」；CustomSoundsPage.tsx [读]
- `page.admin.sounds.row` — 出处：分册 07 表行「打开编辑声音」；CustomSoundsTable.tsx [读]
- `page.admin.sounds.name` — 出处：分册 07 表行「填声音 Name」；AddCustomSound.tsx EditSound.tsx [读]
- `page.admin.sounds.file` — 出处：分册 07 表行「上传声音文件」；AddCustomSound.tsx [读]
- `page.admin.sounds.cancel` — 出处：分册 07 表行「取消未保存声音」；AddCustomSound.tsx [读]
- `page.admin.sounds.save` — 出处：分册 07 表行「保存自定义声音」；AddCustomSound.tsx EditSound.tsx [读]
- `page.admin.sounds.delete` — 出处：分册 07 表行「删除自定义声音」；EditSound.tsx [读]
- `page.admin.emoji.new` — 出处：分册 07 表行「打开新建自定义 emoji」；CustomEmojiRoute.tsx [读]
- `page.admin.emoji.row` — 出处：分册 07 表行「打开编辑 emoji」；CustomEmojiRoute.tsx [读]
- `page.admin.emoji.name` — 出处：分册 07 表行「填 emoji Name」；EditCustomEmoji.tsx [读]
- `page.admin.emoji.aliases` — 出处：分册 07 表行「填 Aliases」；EditCustomEmoji.tsx [读]
- `page.admin.emoji.file` — 出处：分册 07 表行「上传 emoji 图」；EditCustomEmoji.tsx [读]
- `page.admin.emoji.cancel` — 出处：分册 07 表行「取消未保存 emoji」；EditCustomEmoji.tsx [读]
- `page.admin.emoji.save` — 出处：分册 07 表行「保存自定义 emoji」；EditCustomEmoji.tsx [读]
- `page.admin.emoji.delete` — 出处：分册 07 表行「删除自定义 emoji」；EditCustomEmoji.tsx [读]
- `page.admin.feature-preview.allow` — 出处：分册 07 表行「开关允许用户使用功能预览」；AdminFeaturePreviewPage.tsx [读]
- `page.admin.feature-preview.secondary-sidebar` — 出处：分册 07 表行「默认打开二级侧栏预览」；AdminFeaturePreviewPage.tsx useFeaturePreviewList.ts [读]
- `page.admin.feature-preview.ai-search` — 出处：分册 07 表行「默认打开智能搜索预览」；AdminFeaturePreviewPage.tsx [读]
- `page.admin.feature-preview.cancel` — 出处：分册 07 表行「放弃未保存管理端预览」；AdminFeaturePreviewPage.tsx [读]
- `page.admin.feature-preview.save` — 出处：分册 07 表行「保存管理端功能预览默认值」；AdminFeaturePreviewPage.tsx [读]
- `page.admin.settings.search` — 出处：分册 07 表行「搜索设置组卡片」；SettingsPage.tsx [读]
- `page.admin.settings.open.accounts` — 出处：分册 07 表行「打开 Accounts 设置组」；addGroup('Accounts') SettingsGroupCard [读]
- `page.admin.settings.open.analytics` — 出处：分册 07 表行「打开 Analytics 设置组」；addGroup('Analytics') SettingsGroupCard [读]
- `page.admin.settings.open.assets` — 出处：分册 07 表行「打开 Assets 设置组」；addGroup('Assets') SettingsGroupCard [读]
- `page.admin.settings.open.atlassian-crowd` — 出处：分册 07 表行「打开 Atlassian Crowd 设置组」；addGroup('AtlassianCrowd') SettingsGroupCard [读]
- `page.admin.settings.open.bots` — 出处：分册 07 表行「打开 Bots 设置组」；addGroup('Bots') SettingsGroupCard [读]
- `page.admin.settings.open.cas` — 出处：分册 07 表行「打开 CAS 设置组」；addGroup('CAS') SettingsGroupCard [读]
- `page.admin.settings.open.custom-sounds-fs` — 出处：分册 07 表行「打开 Custom Sounds Filesystem 设置组」；addGroup('CustomSoundsFilesystem') SettingsGroupCard [读]
- `page.admin.settings.open.discussion` — 出处：分册 07 表行「打开 Discussion 设置组」；addGroup('Discussion') SettingsGroupCard [读]
- `page.admin.settings.open.email` — 出处：分册 07 表行「打开 Email 设置组」；addGroup('Email') SettingsGroupCard [读]
- `page.admin.settings.open.emoji-custom-fs` — 出处：分册 07 表行「打开 Emoji Custom Filesystem 设置组」；addGroup('EmojiCustomFilesystem') SettingsGroupCard [读]
- `page.admin.settings.open.e2e` — 出处：分册 07 表行「打开 E2E 设置组」；addGroup('End-to-end_encryption') SettingsGroupCard [读]
- `page.admin.settings.open.enterprise` — 出处：分册 07 表行「打开 Enterprise 设置组」；addGroup('Enterprise') SettingsGroupCard [读]
- `page.admin.settings.open.federation` — 出处：分册 07 表行「打开 Federation 设置组」；addGroup('Federation') SettingsGroupCard [读]
- `page.admin.settings.open.fileupload` — 出处：分册 07 表行「打开 File Upload 设置组」；addGroup('FileUpload') SettingsGroupCard [读]
- `page.admin.settings.open.general` — 出处：分册 07 表行「打开 General 设置组」；addGroup('General') SettingsGroupCard [读]
- `page.admin.settings.open.irc` — 出处：分册 07 表行「打开 IRC 设置组」；addGroup('IRC_Federation') SettingsGroupCard [读]
- `page.admin.settings.open.ldap` — 出处：分册 07 表行「打开 LDAP 设置组」；addGroup('LDAP') SettingsGroupCard [读]
- `page.admin.settings.open.layout` — 出处：分册 07 表行「打开 Layout 设置组」；addGroup('Layout') SettingsGroupCard [读]
- `page.admin.settings.open.logs` — 出处：分册 07 表行「打开 Logs 设置组」；addGroup('Logs') SettingsGroupCard [读]
- `page.admin.settings.open.message` — 出处：分册 07 表行「打开 Message 设置组」；addGroup('Message') SettingsGroupCard [读]
- `page.admin.settings.open.meta` — 出处：分册 07 表行「打开 Meta 设置组」；addGroup('Meta') SettingsGroupCard [读]
- `page.admin.settings.open.mobile` — 出处：分册 07 表行「打开 Mobile 设置组」；addGroup('Mobile') SettingsGroupCard [读]
- `page.admin.settings.open.oauth` — 出处：分册 07 表行「打开 OAuth 设置组」；addGroup('OAuth') SettingsGroupCard [读]
- `page.admin.settings.open.omnichannel` — 出处：分册 07 表行「打开 Omnichannel 设置组」；addGroup('Omnichannel') SettingsGroupCard [读]
- `page.admin.settings.open.outlook` — 出处：分册 07 表行「打开 Outlook Calendar 设置组」；addGroup('Outlook_Calendar') SettingsGroupCard [读]
- `page.admin.settings.open.push` — 出处：分册 07 表行「打开 Push 设置组」；addGroup('Push') SettingsGroupCard [读]
- `page.admin.settings.open.rate-limiter` — 出处：分册 07 表行「打开 Rate Limiter 设置组」；addGroup('Rate Limiter') SettingsGroupCard [读]
- `page.admin.settings.open.retention` — 出处：分册 07 表行「打开 Retention Policy 设置组」；addGroup('RetentionPolicy') SettingsGroupCard [读]
- `page.admin.settings.open.saml` — 出处：分册 07 表行「打开 SAML 设置组」；addGroup('SAML') SettingsGroupCard [读]
- `page.admin.settings.open.sms` — 出处：分册 07 表行「打开 SMS 设置组」；addGroup('SMS') SettingsGroupCard [读]
- `page.admin.settings.open.search` — 出处：分册 07 表行「打开 Search 设置组」；addGroup('Search') SettingsGroupCard [读]
- `page.admin.settings.open.setup-wizard` — 出处：分册 07 表行「打开 Setup Wizard 设置组」；addGroup('Setup_Wizard') SettingsGroupCard [读]
- `page.admin.settings.open.slackbridge` — 出处：分册 07 表行「打开 SlackBridge 设置组」；addGroup('SlackBridge') SettingsGroupCard [读]
- `page.admin.settings.open.smarsh` — 出处：分册 07 表行「打开 Smarsh 设置组」；addGroup('Smarsh') SettingsGroupCard [读]
- `page.admin.settings.open.threads` — 出处：分册 07 表行「打开 Threads 设置组」；addGroup('Threads') SettingsGroupCard [读]
- `page.admin.settings.open.troubleshoot` — 出处：分册 07 表行「打开 Troubleshoot 设置组」；addGroup('Troubleshoot') SettingsGroupCard [读]
- `page.admin.settings.open.user-data-download` — 出处：分册 07 表行「打开 User Data Download 设置组」；addGroup('UserDataDownload') SettingsGroupCard [读]
- `page.admin.settings.open.video-conference` — 出处：分册 07 表行「打开 Video Conference 设置组」；addGroup('Video_Conference') SettingsGroupCard [读]
- `page.admin.settings.open.voip` — 出处：分册 07 表行「打开 VoIP 设置组」；addGroup('VoIP_TeamCollab') SettingsGroupCard [读]
- `page.admin.settings.open.webdav` — 出处：分册 07 表行「打开 Webdav 设置组」；addGroup('Webdav Integration') SettingsGroupCard [读]
- `page.admin.settings.open.device-management` — 出处：分册 07 表行「打开 Device Management 设置组」；addGroup('Device_Management') SettingsGroupCard [读]
- `page.admin.settings.save` — 出处：分册 07 表行「保存当前设置组」；SettingsGroupPage.tsx [读]
- `page.admin.settings.cancel` — 出处：分册 07 表行「取消未保存设置」；SettingsGroupPage.tsx [读]
- `page.admin.settings.reset-setting` — 出处：分册 07 表行「重置单个设置为包装默认」；ResetSettingButton.tsx [读]
- `page.admin.settings.ldap.test-connection` — 出处：分册 07 表行「LDAP 测试连接」；LDAPGroupPage.tsx [读]
- `page.admin.settings.ldap.test-search` — 出处：分册 07 表行「LDAP 测试搜索」；LDAPGroupPage.tsx [读]
- `page.admin.settings.ldap.sync-now` — 出处：分册 07 表行「LDAP 立即同步」；LDAPGroupPage.tsx [读]
- `page.admin.settings.oauth.refresh` — 出处：分册 07 表行「刷新 OAuth 服务」；OAuthGroupPage.tsx [读]
- `page.admin.settings.oauth.add-custom` — 出处：分册 07 表行「添加自定义 OAuth」；OAuthGroupPage.tsx [读]
- `page.admin.settings.oauth.remove-custom` — 出处：分册 07 表行「删除自定义 OAuth」；OAuthGroupPage.tsx [读]
- `page.admin.settings.saml.import-metadata` — 出处：分册 07 表行「导入 SAML metadata」；SAMLGroupPage.tsx SamlMetadataModal.tsx [读]
- `page.admin.settings.email.send-test` — 出处：分册 07 表行「给自己发 SMTP 测试信」；server/settings/email.ts MethodActionInput [读]
- `page.account.keyboard.display` — 出处：分册 07 表行「查看键盘快捷键说明（只读）」；`KeyboardShortcutsModal.tsx:17-66,89-132` `[读]`
- `page.audit.messages.tab.rooms` — 出处：分册 07 表行「审计 Rooms 页签」；AuditPage.tsx [读]
- `page.audit.messages.tab.users` — 出处：分册 07 表行「审计 Users 页签」；AuditPage.tsx [读]
- `page.audit.messages.tab.dms` — 出处：分册 07 表行「审计 Direct_Messages 页签」；AuditPage.tsx [读]
- `page.audit.messages.tab.omnichannel` — 出处：分册 07 表行「审计 Omnichannel 页签」；AuditPage.tsx [读]
- `page.audit.messages.msg` — 出处：分册 07 表行「填消息关键词」；AuditForm.tsx name=msg [读]
- `page.audit.messages.daterange` — 出处：分册 07 表行「选审计日期范围」；AuditForm.tsx name=dateRange [读]
- `page.audit.messages.room` — 出处：分册 07 表行「选房间」；tabs/RoomsTab.tsx name=rid [读]
- `page.audit.messages.users` — 出处：分册 07 表行「选用户（Users 页签）」；tabs/UsersTab.tsx name=users [读]
- `page.audit.messages.dm-users` — 出处：分册 07 表行「选 DM 双方（至少 2）」；tabs/DirectTab.tsx name=users [读]
- `page.audit.messages.visitor` — 出处：分册 07 表行「选 Omnichannel 访客」；tabs/OmnichannelTab.tsx name=visitor [读]
- `page.audit.messages.agent` — 出处：分册 07 表行「选 Omnichannel 坐席」；tabs/OmnichannelTab.tsx name=agent [读]
- `page.audit.messages.apply` — 出处：分册 07 表行「执行审计查询」；AuditForm.tsx useAuditMutation.ts [读]
- `page.audit.messages.export-pdf` — 出处：分册 07 表行「导出 PDF」；AuditForm.tsx [读]
- `page.audit.log.daterange` — 出处：分册 07 表行「改审计日志日期」；AuditLogTable.tsx [读]
- `page.audit.security.daterange` — 出处：分册 07 表行「改设置日志日期」；SecurityLogsTable.tsx [读]
- `page.audit.security.setting` — 出处：分册 07 表行「按设置项过滤日志」；SecurityLogsTable.tsx [读]
- `page.audit.security.clear` — 出处：分册 07 表行「清空安全日志过滤」；SecurityLogsTable.tsx [读]
- `page.audit.security.apply` — 出处：分册 07 表行「应用安全日志过滤」；SecurityLogsTable.tsx [读]
- `page.audit.security.row` — 出处：分册 07 表行「打开一条设置变更详情」；SecurityLogsTable.tsx [读]
- `page.audit.security.pagination` — 出处：分册 07 表行「翻页设置日志」；SecurityLogsTable.tsx [读]

分册 07 NEW id 条数：**623**（`sort -u` 自该分册首次出现的稳定语义 id 列）。

#### 分册 08

- `omni.agent.queue.open` — 出处：分册 08 表行「打开坐席工作量表（只读，不是接手 UI）」；`QueueListPage.tsx:11` `startup/routes.tsx:177-183` `[读]`
- `omni.agent.queue.filter` — 出处：分册 08 表行「按接待人/部门/状态筛工作量表」；`QueueListFilter.tsx:53-62` `[读]`
- `omni.agent.queue.take` — 出处：分册 08 表行「从预览态接手排队会话」；`ComposerOmnichannelInquiry.tsx:9-62` `[读]`
- `omni.agent.directory.open` — 出处：分册 08 表行「打开联络中心（Chats/Contacts）」；`OmnichannelDirectoryRouter.tsx:6-13` `routes.ts:158-161` `[读]`
- `omni.agent.directory.chats.search` — 出处：分册 08 表行「按访客/房间名搜会话表」；`ChatsTable.tsx:49-62` `[读]`
- `omni.agent.directory.chats.filter` — 出处：分册 08 表行「打开筛条并 Apply（日期/接待/状态/部门/标签/Units/自定义字段）」；`ChatsFiltersContextualBar.tsx:73-224` `[读]`
- `omni.agent.directory.chats.open` — 出处：分册 08 表行「看历史并进 `/live`」；`ChatsContextualBar.tsx:13-21` `ContactHistoryMessagesList.tsx:146` `[读]`
- `omni.agent.directory.chats.remove` — 出处：分册 08 表行「删除一条已关会话」；`RemoveChatButton.tsx:27-37` `[读]`
- `omni.agent.directory.chats.remove-all-closed` — 出处：分册 08 表行「批量删全部已关会话」；`ChatsTableFilter.tsx:40-53` `[读]`
- `omni.agent.directory.contacts.search` — 出处：分册 08 表行「搜联系人表」；`ContactTable.tsx:32-124` `[读]`
- `omni.agent.directory.contact.new` — 出处：分册 08 表行「新建联系人」；`ContactTable.tsx:45-99` `EditContactInfo.tsx:81-289` `[读]`
- `omni.agent.directory.contact.edit` — 出处：分册 08 表行「改已有联系人」；`ContactItemMenu.tsx:37-43` `[读]`
- `omni.agent.directory.contact.delete` — 出处：分册 08 表行「删除联系人」；`RemoveContactModal.tsx:22-64` `[读]`
- `omni.agent.directory.contact.details` — 出处：分册 08 表行「看联系人 Details/Channels」；`ContactInfo.tsx:46-108` `[读]`
- `omni.agent.directory.contact.history` — 出处：分册 08 表行「按来源筛并钻取历史会话」；`ContactInfoHistory.tsx:28-88` `ContactInfoHistoryMessages.tsx:73-126` `[读]`
- `omni.agent.directory.contact.block` — 出处：分册 08 表行「拉黑/解除联系人频道」；`useBlockChannel.tsx:18-38` `[读]`
- `omni.agent.sidepanel.in-progress` — 出处：分册 08 表行「副栏列出进行中 live 房并点进」；`SidePanelInProgress.tsx:13` `[读]`
- `omni.agent.sidepanel.on-hold` — 出处：分册 08 表行「副栏列出挂起会话」；`SidepanelOnHold.tsx:17-31` `[读]`
- `omni.agent.sidepanel.priority` — 出处：分册 08 表行「从副栏行菜单改优先级」；`useOmnichannelPrioritiesMenu.ts:15-52` `[读]`
- `omni.agent.room.info` — 出处：分册 08 表行「打开会话 Room_Info（含访客 UA）」；`ChatInfo.tsx:93-179` `[读]`
- `omni.agent.room.edit` — 出处：分册 08 表行「保存会话 Topic/Tags/自定义字段/SLA/Priority」；`RoomEdit.tsx:137-170` `[读]`
- `omni.agent.contact.info` — 出处：分册 08 表行「在 live 房打开 Contact_Info」；`useContactProfileRoomAction.ts:8-15` `[读]`
- `omni.agent.contact.edit` — 出处：分册 08 表行「从房间资料改联系人」；`ContactInfo.tsx:61-67` `[读]`
- `omni.agent.canned.list` — 出处：分册 08 表行「打开房间内快捷回复列表并搜/按 Type 筛」；`CannedResponseList.tsx:85-100` `[读]`
- `omni.agent.canned.use` — 出处：分册 08 表行「把一条快捷回复插入 composer」；`Item.tsx:52-59` `WrapCannedResponseList.tsx:58-64` `[读]`
- `omni.agent.canned.create` — 出处：分册 08 表行「坐席创建快捷回复」；`CreateCannedResponseModal.tsx:39-69` `[读]`
- `omni.agent.canned.edit` — 出处：分册 08 表行「坐席改自己可见的快捷回复」；`CannedResponse.tsx:101` `[读]`
- `omni.agent.forward` — 出处：分册 08 表行「将会话转部门或转人」；`useChatForwardQuickAction.ts:10` `ForwardChatModal.tsx:103-149` `[读]`
- `omni.agent.close` — 出处：分册 08 表行「关会话（wrap-up：评论/标签/transcript）」；`CloseChatModal.tsx:66-261` `[读]`
- `omni.agent.hold` — 出处：分册 08 表行「手动挂起会话」；`PlaceChatOnHoldModal.tsx:25-36` `[读]`
- `omni.agent.resume` — 出处：分册 08 表行「从挂起恢复会话」；`ComposerOmnichannelOnHold.tsx:16-22` `[读]`
- `omni.agent.return-queue` — 出处：分册 08 表行「把已接会话退回队列」；`ReturnChatQueueModal.tsx:16-21` `[读]`
- `omni.agent.transcript.email` — 出处：分册 08 表行「单独发邮件 transcript（非关单附带）」；`TranscriptModal.tsx:74-132` `[读]`
- `omni.agent.transcript.pdf` — 出处：分册 08 表行「请求 PDF transcript」；`useTranscriptQuickAction.ts:19-22` `[读]`
- `omni.agent.file.send` — 出处：分册 08 表行「在可写 live composer 发文件」；`ComposerOmnichannel.tsx:71-75` `[读]`
- `omni.agent.join` — 出处：分册 08 表行「加入并非自己接待的开房」；`ComposerOmnichannelJoin.tsx:16-28` `[读]`
- `omni.agent.status.consequences` — 出处：分册 08 表行「顶栏开关接听后的后果与拒绝态（**不重写入口**）」；`useOmnichannelLivechatToggle.ts:8-27` `agent.ts:79-134` `[读]`
- `omni.agent.unknown-contact` — 出处：分册 08 表行「处理未知联系人 callout」；`ComposerOmnichannelCallout.tsx:25-57` `[读]`
- `omni.agent.composer.denied` — 出处：分册 08 表行「六态 composer 谁可写谁拒绝」；`ComposerOmnichannel.tsx:14-76` `[读]`
- `omni.manager.current.open` — 出处：分册 08 表行「打开经理联络中心默认页」；`OmnichannelRouter.tsx:16-24` `routes.ts:158-161` `[读]`
- `omni.manager.current.chats.search` — 出处：分册 08 表行「经理侧搜会话」；`ChatsTable.tsx` `[读]`
- `omni.manager.current.chats.filter` — 出处：分册 08 表行「经理侧 Apply 筛」；`ChatsFiltersContextualBar.tsx` `[读]`
- `omni.manager.current.chats.open` — 出处：分册 08 表行「经理侧打开会话历史」；`ChatsContextualBar.tsx` `[读]`
- `omni.manager.current.chats.remove` — 出处：分册 08 表行「经理删一条已关」；`RemoveChatButton.tsx` `[读]`
- `omni.manager.current.chats.remove-all` — 出处：分册 08 表行「经理批量删已关」；`ChatsTableFilter.tsx:40-53` `[读]`
- `omni.manager.current.contacts.search` — 出处：分册 08 表行「经理侧搜联系人」；`ContactTable.tsx` `[读]`
- `omni.manager.current.contact.new` — 出处：分册 08 表行「经理新建联系人」；`useCreateContact.ts:10` `[读]`
- `omni.manager.current.contact.edit` — 出处：分册 08 表行「经理改联系人」；`useEditContact.ts:10` `[读]`
- `omni.manager.current.contact.delete` — 出处：分册 08 表行「经理删联系人」；`RemoveContactModal.tsx` `[读]`
- `omni.manager.analytics.open` — 出处：分册 08 表行「打开分析页（会话/产能总览+图+坐席表）」；`AnalyticsPage.tsx` `routes.ts:173-176` `[读]`
- `omni.manager.analytics.filter` — 出处：分册 08 表行「改类型/部门/日期/图并重拉」；`AnalyticsPage.tsx:65-72` `[读]`
- `omni.manager.realtime.open` — 出处：分册 08 表行「打开实时监控墙」；`RealTimeMonitoringPage.tsx` `routes.ts:168-171` `[读]`
- `omni.manager.realtime.filter` — 出处：分册 08 表行「改部门或刷新间隔」；`RealTimeMonitoringPage.tsx:47-81` `[读]`
- `omni.manager.managers.open` — 出处：分册 08 表行「打开经理角色表」；`ManagersRoute.tsx` `[读]`
- `omni.manager.managers.search` — 出处：分册 08 表行「搜经理」；`ManagersTable.tsx:49` `[读]`
- `omni.manager.managers.add` — 出处：分册 08 表行「按用户名加经理」；`AddManager.tsx:21` `[读]`
- `omni.manager.managers.remove` — 出处：分册 08 表行「撤经理」；`RemoveManagerButton.tsx:17` `[读]`
- `omni.manager.agents.open` — 出处：分册 08 表行「打开坐席表」；`AgentsPage.tsx` `routes.ts:118-121` `[读]`
- `omni.manager.agents.search` — 出处：分册 08 表行「搜/排序坐席」；`useAgentsQuery.ts:8` `[读]`
- `omni.manager.agents.add` — 出处：分册 08 表行「加坐席」；`AddAgent.tsx:20` `[读]`
- `omni.manager.agents.info` — 出处：分册 08 表行「打开坐席信息栏」；`AgentInfo.tsx:29-64` `[读]`
- `omni.manager.agents.edit` — 出处：分册 08 表行「改坐席接听状态与部门并保存」；`AgentEdit.tsx:79-90` `[读]`
- `omni.manager.agents.remove` — 出处：分册 08 表行「撤坐席」；`useRemoveAgent.tsx:16` `[读]`
- `omni.manager.departments.open` — 出处：分册 08 表行「打开部门 All/Archived」；`DepartmentsPage.tsx:47-53` `[读]`
- `omni.manager.departments.search` — 出处：分册 08 表行「搜/排序部门」；`DepartmentsTable.tsx` `[读]`
- `omni.manager.departments.create` — 出处：分册 08 表行「新建部门（或撞限额 upsell）」；`NewDepartment.tsx:18-26` `EnterpriseDepartmentsModal.tsx:49-65` `[读]`
- `omni.manager.departments.edit` — 出处：分册 08 表行「保存部门（含 Agents 段与 EE 字段）」；`EditDepartment.tsx:82-116,258-354` `[读]`
- `omni.manager.departments.archive` — 出处：分册 08 表行「归档或恢复部门」；`DepartmentItemMenu.tsx:31-47` `[读]`
- `omni.manager.departments.delete` — 出处：分册 08 表行「删除部门」；`RemoveDepartmentModal.tsx:20` `[读]`
- `omni.manager.customfields.open` — 出处：分册 08 表行「打开自定义字段表」；`CustomFieldsPage.tsx` `[读]`
- `omni.manager.customfields.search` — 出处：分册 08 表行「搜字段」；`useCustomFieldsQuery` `[读]`
- `omni.manager.customfields.create` — 出处：分册 08 表行「新建字段」；`EditCustomFields.tsx:78` `[读]`
- `omni.manager.customfields.edit` — 出处：分册 08 表行「改字段」；`EditCustomFieldsWithData.tsx:13` `[读]`
- `omni.manager.customfields.delete` — 出处：分册 08 表行「删字段」；`useRemoveCustomField.tsx:13` `[读]`
- `omni.manager.triggers.open` — 出处：分册 08 表行「打开触发器表」；`TriggersPage.tsx` `[读]`
- `omni.manager.triggers.create` — 出处：分册 08 表行「新建触发器」；`TriggersPage.tsx` `[读]`
- `omni.manager.triggers.edit` — 出处：分册 08 表行「保存触发器（条件/动作/Enabled/Run once）」；`EditTrigger.tsx:81` `[读]`
- `omni.manager.triggers.delete` — 出处：分册 08 表行「删触发器」；`TriggersRow.tsx:15-37` `[读]`
- `omni.manager.triggers.test` — 出处：分册 08 表行「测外部服务 URL」；`ActionExternalServiceUrl.tsx:32-93` `[读]`
- `omni.manager.installation.open` — 出处：分册 08 表行「打开安装说明与 widget 代码」；`Installation.tsx:11-21` `routes.ts:108-111` `[读]`
- `omni.manager.installation.copy` — 出处：分册 08 表行「复制 embed 代码」；`Installation.tsx:35` `[读]`
- `omni.manager.appearance.open` — 出处：分册 08 表行「打开外观手风琴（含 CE 禁用的 Premium 控件）」；`AppearancePageContainer.tsx` `AppearanceForm.tsx:70,84,106,130` `[读]`
- `omni.manager.appearance.save` — 出处：分册 08 表行「保存外观（含访客可否关聊）」；`AppearancePage.tsx:49-71` `[读]`
- `omni.manager.webhooks.open` — 出处：分册 08 表行「打开 webhook 集成表」；`WebhooksPageContainer.tsx` `[读]`
- `omni.manager.webhooks.save` — 出处：分册 08 表行「保存 webhook」；`WebhooksPage.tsx:100-135` `[读]`
- `omni.manager.webhooks.test` — 出处：分册 08 表行「对已存 URL 发测试」；`WebhooksPage.tsx:145-147` `[读]`
- `omni.manager.businesshours.open` — 出处：分册 08 表行「打开营业时间（关则引导去设置）」；`BusinessHoursRouter.tsx:19-26` `[读]`
- `omni.manager.businesshours.create` — 出处：分册 08 表行「新增多条营业时间」；`BusinessHoursMultiplePage.tsx:17-18` `[读]`
- `omni.manager.businesshours.save` — 出处：分册 08 表行「保存时区与开闭时间」；`EditBusinessHours.tsx:43-74` `[读]`
- `omni.manager.businesshours.delete` — 出处：分册 08 表行「删一条（非单 BH）」；`useRemoveBusinessHour.tsx:11` `[读]`
- `omni.manager.security.open` — 出处：分册 08 表行「打开联系人识别设置组」；`SecurityPrivacyPage.tsx:8-15` `[读]`
- `omni.manager.security.save` — 出处：分册 08 表行「保存拦截未知/未验证与校验策略」；`SettingsGroupPage.tsx:63-84` `[读]`
- `omni.manager.reports.open` — 出处：分册 08 表行「打开五张会话分布卡」；`ReportsPage.tsx` `[读]`
- `omni.manager.reports.period` — 出处：分册 08 表行「改报表周期」；`ReportCard.tsx:41-42` `[读]`
- `omni.manager.reports.download` — 出处：分册 08 表行「下载当前卡 CSV」；`ReportCard.tsx:41-42` `[读]`
- `omni.manager.monitors.open` — 出处：分册 08 表行「打开监控员表」；`MonitorsPageContainer.tsx:7-14` `[读]`
- `omni.manager.monitors.add` — 出处：分册 08 表行「加监控员」；`MonitorsTable.tsx:53-89` `[读]`
- `omni.manager.monitors.remove` — 出处：分册 08 表行「撤监控员」；`MonitorsTable.tsx:52-104` `[读]`
- `omni.manager.units.open` — 出处：分册 08 表行「打开业务单元表」；`UnitsPage.tsx` `[读]`
- `omni.manager.units.search` — 出处：分册 08 表行「搜单元」；`UnitsTable.tsx:43` `[读]`
- `omni.manager.units.create` — 出处：分册 08 表行「新建单元」；`UnitEdit.tsx:50-117` `[读]`
- `omni.manager.units.edit` — 出处：分册 08 表行「改单元」；`UnitEdit.tsx:117` `[读]`
- `omni.manager.units.delete` — 出处：分册 08 表行「删单元」；`useRemoveUnit.tsx:13` `[读]`
- `omni.manager.canned.open` — 出处：分册 08 表行「打开经理快捷回复表」；`CannedResponsesPage.tsx` `[读]`
- `omni.manager.canned.search` — 出处：分册 08 表行「搜并按 Sharing/Created_by 筛」；`CannedResponseFilter.tsx:24-45` `[读]`
- `omni.manager.canned.create` — 出处：分册 08 表行「经理创建快捷回复」；`CannedResponseEdit.tsx:41` `[读]`
- `omni.manager.canned.edit` — 出处：分册 08 表行「改快捷回复」；`CannedResponsesTable.tsx:69-73` `[读]`
- `omni.manager.canned.delete` — 出处：分册 08 表行「删快捷回复」；`useRemoveCannedResponse.tsx:15` `[读]`
- `omni.manager.tags.open` — 出处：分册 08 表行「打开标签表」；`TagsPage.tsx` `[读]`
- `omni.manager.tags.search` — 出处：分册 08 表行「搜标签」；`TagsTable.tsx:49` `[读]`
- `omni.manager.tags.create` — 出处：分册 08 表行「新建标签」；`TagEdit.tsx:38-64` `[读]`
- `omni.manager.tags.edit` — 出处：分册 08 表行「改标签」；`TagEdit.tsx:64` `[读]`
- `omni.manager.tags.delete` — 出处：分册 08 表行「删标签」；`useRemoveTag.tsx:11` `[读]`
- `omni.manager.sla.open` — 出处：分册 08 表行「打开 SLA 表」；`SlaPage.tsx` `[读]`
- `omni.manager.sla.search` — 出处：分册 08 表行「搜 SLA」；`SlaTable.tsx:46` `[读]`
- `omni.manager.sla.create` — 出处：分册 08 表行「新建 SLA」；`SlaEdit.tsx:25-76` `[读]`
- `omni.manager.sla.edit` — 出处：分册 08 表行「改 SLA」；`SlaEdit.tsx:25-76` `[读]`
- `omni.manager.sla.delete` — 出处：分册 08 表行「删 SLA」；`RemoveSlaButton.tsx:14` `[读]`
- `omni.manager.priorities.open` — 出处：分册 08 表行「打开优先级表（无新建，只有改名）」；`PrioritiesPage.tsx` `[读]`
- `omni.manager.priorities.edit` — 出处：分册 08 表行「改一条优先级显示名」；`PrioritiesPage.tsx:30-70` `[读]`
- `omni.manager.priorities.reset` — 出处：分册 08 表行「重置全部优先级」；`PrioritiesPage.tsx:31-43` `[读]`
- `omni.widget.start` — 出处：分册 08 表行「开始（或恢复）聊天会话」；`App.tsx:176-184` `routes/Chat/index.tsx:62-107` `[读]`
- `omni.widget.register` — 出处：分册 08 表行「填登记表并开聊」；`Register/index.tsx:75-199` `[读]`
- `omni.widget.send` — 出处：分册 08 表行「发送一条访客消息」；`ChatFooter.tsx:91-107,241-265` `[读]`
- `omni.widget.upload` — 出处：分册 08 表行「上传文件」；`routes/Chat/index.tsx:119-194` `[读]`
- `omni.widget.emoji` — 出处：分册 08 表行「插入 emoji」；`ChatFooter.tsx:249-251` `ChatContent.tsx:83-93` `[读]`
- `omni.widget.close` — 出处：分册 08 表行「访客结束会话」；`ChatFooter.tsx:109-134` `[读]`
- `omni.widget.transcript` — 出处：分册 08 表行「关聊后要邮件副本」；`lib/transcript.ts:7-64` `lib/room.ts:21-24,97-98` `[读]`
- `omni.widget.department` — 出处：分册 08 表行「切换部门」；`SwitchDepartment/index.tsx:56-137` `[读]`
- `omni.widget.offline` — 出处：分册 08 表行「离线留言」；`LeaveMessage/index.tsx:60-181` `[读]`
- `omni.widget.gdpr` — 出处：分册 08 表行「同意数据处理」；`GDPRAgreement/index.tsx:20-45` `[读]`
- `omni.widget.forget` — 出处：分册 08 表行「删除我的访客数据」；`ChatFooter.tsx:136-157` `[读]`
- `omni.widget.finished.new` — 出处：分册 08 表行「结束后再开新聊天」；`ChatFinished/index.tsx:20-36` `[读]`
- `omni.widget.trigger.start` — 出处：分册 08 表行「从主动触发消息开聊」；`TriggerMessage/index.tsx:21-69` `[读]`
- `omni.widget.minimize` — 出处：分册 08 表行「最小化/恢复/弹出」；`Header.tsx:110-134` `ScreenProvider.tsx:130-155` `[读]`
- `omni.widget.sound` — 出处：分册 08 表行「开关通知声」；`Header.tsx:110-120` `ScreenProvider.tsx:122-128` `[读]`

分册 08 NEW id 条数：**136**（`sort -u` 自该分册首次出现的稳定语义 id 列）。

#### 分册 09

- `mkt.explore.open` — 出处：分册 09 表行「打开 Explore 目录列表」；`sidebarItems.tsx:12-17` `AppsRoute.tsx:43-60` `[读]`
- `mkt.explore.search` — 出处：分册 09 表行「在当前 context 搜 App」；`AppsPageContent.tsx:29-30,112-122` `[读]`
- `mkt.explore.filter` — 出处：分册 09 表行「按价格/状态/分类/排序筛」；`AppsPageContent.tsx:41-92` `[读]`
- `mkt.explore.premium` — 出处：分册 09 表行「打开 Premium 列表」；`sidebarItems.tsx:18-23` `[读]`
- `mkt.explore.docs` — 出处：分册 09 表行「打开开发文档外链」；`sidebarItems.tsx:44-50` `[读]`
- `mkt.installed.open` — 出处：分册 09 表行「打开已安装列表」；`sidebarItems.tsx:24-29` `[读]`
- `mkt.installed.private` — 出处：分册 09 表行「打开私有 App 列表」；`sidebarItems.tsx:37-42` `MarketplaceHeader.tsx:49-56` `[读]`
- `mkt.installed.upload` — 出处：分册 09 表行「上传私有 .zip（或无许可时升级）」；`AppInstallPage.tsx:34-63` `MarketplaceHeader.tsx:69-74` `[读]`
- `mkt.installed.unlimited` — 出处：分册 09 表行「打开「无限 App」upsell」；`MarketplaceHeader.tsx:60-67` `[读]`
- `mkt.installed.update-server` — 出处：分册 09 表行「市集版本不受支持时去升级 RC」；`UpdateRocketChatButton.tsx:10` `[读]`
- `mkt.request.open` — 出处：分册 09 表行「打开他人请求安装的 App 列表」；`sidebarItems.tsx:30-36` `[读]`
- `mkt.app.details` — 出处：分册 09 表行「打开某 App 详情（默认 Details tab）」；`AppRow.tsx:21-63` `AppDetailsPage.tsx:110` `[读]`
- `mkt.app.install` — 出处：分册 09 表行「安装免费/已购 App」；`useAppMenu.tsx:353-366` `helpers.ts:90-104` `[读]`
- `mkt.app.subscribe` — 出处：分册 09 表行「订阅 / 试用 / 看定价（付费订阅型）」；`helpers.ts:107-136` `[读]`
- `mkt.app.buy` — 出处：分册 09 表行「一次性购买标价 App」；`helpers.ts:140-153` `[读]`
- `mkt.app.request` — 出处：分册 09 表行「非管理员请求安装」；`helpers.ts:56-67` `useAppMenu.tsx:353-366` `[读]`
- `mkt.app.enable` — 出处：分册 09 表行「启用已装且当前禁用的 App」；`useAppMenu.tsx:369-434` `[读]`
- `mkt.app.disable` — 出处：分册 09 表行「停用已启用 App」；`useAppMenu.tsx:198-211,410-422` `[读]`
- `mkt.app.uninstall` — 出处：分册 09 表行「卸载 App」；`useAppMenu.tsx:224-282,435-446` `[读]`
- `mkt.app.update` — 出处：分册 09 表行「更新到市集较新版本」；`AppRow.tsx:49,78` `useAppMenu.tsx:323-408` `[读]`
- `mkt.app.permissions` — 出处：分册 09 表行「审阅并同意 App 权限（安装/更新门）」；`AppPermissionsReviewModal.tsx:18-31` `[读]`
- `mkt.app.logs` — 出处：分册 09 表行「打开已装 App 的 Logs tab」；`AppDetailsPageTabs.tsx:64-68` `[读]`
- `mkt.app.logs.filter` — 出处：分册 09 表行「筛/刷新/导出日志」；`AppLogsFilter.tsx:63-117` `[读]`
- `mkt.app.settings` — 出处：分册 09 表行「打开该 App 的设置表单（**不**逐字段）」；`AppSettings/AppSettings.tsx:31-44` `[读]`
- `mkt.app.settings.save` — 出处：分册 09 表行「保存该 App 设置脏表单」；`AppDetailsPage.tsx:88-158` `[读]`
- `mkt.app.requests` — 出处：分册 09 表行「看该 App 的安装请求并标已读」；`AppDetailsPageTabs.tsx:44-48` `[读]`
- `mkt.app.security` — 出处：分册 09 表行「看权限/隐私/ToS 说明」；`AppDetailsPageTabs.tsx:49-53` `[读]`
- `mkt.app.releases` — 出处：分册 09 表行「看版本发布说明」；`AppDetailsPageTabs.tsx:54-58` `[读]`
- `mkt.app.instances` — 出处：分册 09 表行「看集群实例状态」；`AppDetailsPageTabs.tsx:69-73` `[读]`

分册 09 NEW id 条数：**29**（`sort -u` 自该分册首次出现的稳定语义 id 列）。

#### 分册 10

- `tl.identity.avatar` — 出处：分册 10 表行「点消息头像打开用户卡」；`RoomMessage.tsx:124-134`；`ThreadMessage.tsx:50-60`
- `tl.identity.display-name` — 出处：分册 10 表行「点消息头显示名打开用户卡」；`MessageHeader.tsx:51-72`
- `tl.foreword.dm-user` — 出处：分册 10 表行「从 DM 时间线顶端对方标签跳到其 DM」；`RoomForewordUsernameList.tsx:14-18`；`RoomForewordUsernameListItem.tsx:17`
- `tl.body.mention.user` — 出处：分册 10 表行「点 @用户提及打开该用户卡」；`UserMentionElement.tsx:15-55`；`GazzodownText.tsx:78-90`
- `tl.body.mention.channel` — 出处：分册 10 表行「点 #频道提及跳进该房间」；`ChannelMentionElement.tsx:14-29`；`GazzodownText.tsx:100-115`
- `tl.body.link.external` — 出处：分册 10 表行「点正文外链在新标签打开」；`LinkSpan.tsx:47-52`
- `tl.body.link.internal` — 出处：分册 10 表行「点正文站内链同标签跳转」；`LinkSpan.tsx:55-58`
- `tl.body.image.markdown` — 出处：分册 10 表行「点 markdown 行内图打开原图」；`ImageElement.tsx:49-56`
- `tl.body.spoiler` — 出处：分册 10 表行「点模糊剧透揭开正文」；`SpoilerSpan.tsx:52-79`
- `tl.body.code.copy` — 出处：分册 10 表行「复制围栏代码块」；`CodeBlock.tsx:76-94`
- `tl.ignored.reveal` — 出处：分册 10 表行「展开被忽略用户的消息正文」；`IgnoredContent.tsx:23-31`
- `tl.reaction.toggle` — 出处：分册 10 表行「点已有 emoji 芯片切换自己的反应」；`Reactions.tsx:29-39`；`Reaction.tsx:38-42`
- `tl.reaction.add` — 出处：分册 10 表行「从消息体「+」打开 picker 再加反应」；`Reactions.tsx:41`；`MessageListProvider.tsx:111-116`
- `tl.reaction.hover-users` — 出处：分册 10 表行「悬停芯片看谁反应了（不是 More→Reactions 模态）」；`Reaction.tsx:45-64`；`ReactionTooltip.tsx:38-96`
- `tl.thread.view` — 出处：分册 10 表行「从主消息「View_thread」打开线程栏」；`ThreadMetrics.tsx:43-52`
- `tl.thread.follow` — 出处：分册 10 表行「从线程 metrics 铃铛跟随/取消跟随」；`ThreadMetricsFollow.tsx:39-45`
- `tl.thread.preview.open` — 出处：分册 10 表行「点主列表线程回复预览进入线程」；`ThreadMessagePreview.tsx:59-81`
- `tl.discussion.open` — 出处：分册 10 表行「从讨论计数/Reply 进入讨论房」；`DiscussionMetrics.tsx:30-32`；`createDiscussion.ts:26-36`
- `tl.broadcast.reply` — 出处：分册 10 表行「广播房点他人消息的 Reply 去 DM 引用」；`BroadcastMetrics.tsx:17-26`
- `tl.attach.collapse` — 出处：分册 10 表行「折叠/展开附件或预览内容」；`CollapsibleContent.tsx:8-10`；`MessageCollapsible.tsx:28`
- `tl.attach.download` — 出处：分册 10 表行「下载附件文件」；`AttachmentDownloadBase.tsx:12-21`
- `tl.attach.image.load` — 出处：分册 10 表行「未自动载图时点「Click_to_load」」；`Load.tsx:22-26`
- `tl.attach.image.retry` — 出处：分册 10 表行「图片加载失败后重试」；`Retry.tsx:21-25`
- `tl.attach.image.lightbox` — 出处：分册 10 表行「点缩略图打开房间图库」；`AttachmentImage.tsx:81-85`；`ImageGalleryProvider.tsx:16-36`
- `tl.gallery.close` — 出处：分册 10 表行「关闭图片图库」；`ImageGallery.tsx:159-167,135,193`
- `tl.gallery.zoom-in` — 出处：分册 10 表行「图库放大」；`ImageGallery.tsx:158`
- `tl.gallery.zoom-out` — 出处：分册 10 表行「图库缩小」；`ImageGallery.tsx:148-156`
- `tl.gallery.resize` — 出处：分册 10 表行「图库恢复 1:1」；`ImageGallery.tsx:137-146`
- `tl.gallery.next` — 出处：分册 10 表行「图库下一张」；`ImageGallery.tsx:169-181,200`
- `tl.gallery.prev` — 出处：分册 10 表行「图库上一张」；`ImageGallery.tsx:176-181`
- `tl.attach.audio.toggle` — 出处：分册 10 表行「播放/暂停音频附件」；`AudioAttachment.tsx:75-80`
- `tl.attach.audio.seek` — 出处：分册 10 表行「拖进度条跳到指定时间」；`AudioAttachment.tsx:81`
- `tl.attach.audio.rate` — 出处：分册 10 表行「循环切换音频倍速」；`AudioAttachment.tsx:82`
- `tl.attach.video.controls` — 出处：分册 10 表行「用原生 video 控件播/暂停/拖动」；`VideoAttachment.tsx:32-34`
- `tl.attach.file.open` — 出处：分册 10 表行「打开通用文件/PDF」；`GenericFileAttachment.tsx:42-72,94-96`
- `tl.quote.jump` — 出处：分册 10 表行「从引用附件跳回原消息」；`AttachmentMessageLink.tsx:11`；`QuoteAttachment.tsx:67`
- `tl.quote.author` — 出处：分册 10 表行「点引用作者名打开 author_link」；`QuoteAttachment.tsx:59-63`
- `tl.quote.time` — 出处：分册 10 表行「点引用时间戳走 message_link」；`QuoteAttachment.tsx:64-66`
- `tl.attach.default.title` — 出处：分册 10 表行「点 Slack 式附件标题外链」；`DefaultAttachment.tsx:58-71`
- `tl.attach.default.author` — 出处：分册 10 表行「点 Slack 式附件作者外链」；`DefaultAttachment.tsx:43-57`
- `tl.attach.action.url` — 出处：分册 10 表行「点废弃 action attachment 的 URL 按钮」；`ActionAttachtment.tsx:22-27`
- `tl.attach.action.msg` — 出处：分册 10 表行「点 action attachment 向 composer/聊天回消息」；`ActionAttachmentButton.tsx:27-40`
- `tl.location.open` — 出处：分册 10 表行「点位置附件打开 Google 地图导航」；`MapViewImage.tsx:13-15`；`MapViewFallback.tsx:15-16`
- `tl.url.collapse` — 出处：分册 10 表行「折叠/展开链接预览」；`UrlPreview.tsx:17-21`；`OEmbedCollapsible.tsx:14-16`
- `tl.url.image.lightbox` — 出处：分册 10 表行「点 headers 图片预览开单图灯箱」；`UrlImagePreview.tsx:11`；`ImageGalleryProvider.tsx:22-23`
- `tl.url.audio` — 出处：分册 10 表行「播放 URL 音频预览」；`UrlAudioPreview.tsx:7`
- `tl.url.video` — 出处：分册 10 表行「播放 URL 视频预览」；`UrlVideoPreview.tsx:4-8`
- `tl.oembed.open` — 出处：分册 10 表行「打开 oembed 标题/封面外链」；`OEmbedPreviewContent.tsx:22-25`；`OEmbedLinkPreview.tsx:10-12`
- `tl.sys.actor` — 出处：分册 10 表行「点系统消息作者名打开用户卡」；`SystemMessage.tsx:65,95-103`
- `tl.e2ee.save-password` — 出处：分册 10 表行「加密房要求先保存 E2EE 密码」；`RoomE2EESetup.tsx:21-40`；`RoomE2EENotAllowed.tsx:41-48`
- `tl.e2ee.enter-password` — 出处：分册 10 表行「输入 E2EE 密码才能看时间线」；`RoomE2EESetup.tsx:29,43-52`
- `tl.e2ee.back-home` — 出处：分册 10 表行「从 E2EE 阻断页回首页」；`RoomE2EENotAllowed.tsx:31-45`
- `tl.e2ee.learn-more` — 出处：分册 10 表行「打开 E2EE 文档外链」；`RoomE2EENotAllowed.tsx:51-53`
- `tl.unread.jump` — 出处：分册 10 表行「点未读条跳到第一条未读」；`UnreadMessagesIndicator.tsx:23-29`；`useUnreadMessages.ts:61-78`
- `tl.unread.mark-read` — 出处：分册 10 表行「关掉未读条并标已读（不跳转）」；`UnreadMessagesIndicator.tsx:25-27`；`useUnreadMessages.ts:80-83`
- `tl.chrome.new-messages` — 出处：分册 10 表行「不在底部时跳到刚到的新消息」；`RoomBody.tsx:187`；`JumpToRecentMessageButton.tsx:46-54`
- `tl.chrome.jump-recent` — 出处：分册 10 表行「从历史夹缝跳回最新页」；`useHasNewMessages.ts:31-35`
- `tl.history.load-older` — 出处：分册 10 表行「向上滚加载更早历史」；`useGetMore.ts:49-62`
- `tl.history.load-newer` — 出处：分册 10 表行「向下滚加载更新历史」；`useGetMore.ts:63-64`
- `tl.select.enter` — 出处：分册 10 表行「进入多选：行上出现 checkbox、工具栏隐藏」；`ExportMessages.tsx:121-128`；`RoomMessage.tsx:136`
- `tl.select.toggle` — 出处：分册 10 表行「勾选/取消单条（含系统行、线程预览）」；`RoomMessage.tsx:91-109,136`；`getCheckboxLabel.tsx:4-12`
- `tl.select.select-all` — 出处：分册 10 表行「全选已加载消息并滚到顶」；`useSelectAllAndScrollToTop.ts:9-11`
- `tl.select.clear` — 出处：分册 10 表行「清除全部勾选（不退出模式）」；`ComposerSelectMessages.tsx:21-22`
- `tl.select.cancel` — 出处：分册 10 表行「关掉导出栏退出选择」；`ExportMessages.tsx:126-127,192`
- `tl.select.export.email` — 出处：分册 10 表行「把已选消息邮件发出」；`useRoomExportMutation.ts:7`
- `tl.select.export.file` — 出处：分册 10 表行「按日期把房间文件邮件发出（不勾选）」；`ExportMessages.tsx:162-169`
- `tl.select.export.download` — 出处：分册 10 表行「下载已选为 JSON 或 PDF」；`useDownloadExportMutation.ts:19`；`useExportMessagesAsPDFMutation.tsx`
- `tl.action.link` — 出处：分册 10 表行「点消息/系统行 actionLinks 按钮」；`MessageActions.tsx:24-36`；`actionLinks.ts:12-36`
- `tl.uikit.block` — 出处：分册 10 表行「点 Apps UiKit 消息块控件」；`UiKitMessageBlock.tsx:15-26`
- `tl.uikit.videoconf.join` — 出处：分册 10 表行「点 videoconf 块加入通话」；`useMessageBlockContextValue.ts:46-50`
- `tl.uikit.videoconf.callback` — 出处：分册 10 表行「点 videoconf 块回拨」；`useMessageBlockContextValue.ts:53-55`
- `tl.uikit.media-call.history` — 出处：分册 10 表行「从媒体通话块打开通话历史」；`useMessageBlockContextValue.ts:58-61`

分册 10 NEW id 条数：**72**（`sort -u` 自该分册首次出现的稳定语义 id 列）。

#### 分册 11

- `composer.state.send.disabled.empty` — 出处：分册 11 表行「空输入且无附件且非编辑时 Send 不可点」；`MessageBox.tsx:121,517-520`
- `composer.state.send.disabled.uploading` — 出处：分册 11 表行「附件仍在 XHR 时 Send 不可点且点击空操作」；`MessageBox.tsx:182-185,517`；`useFileUpload.ts:36`
- `composer.state.send.disabled.processing` — 出处：分册 11 表行「mediaConfirm 循环中 textarea 与 Send 都禁」；`MessageBox.tsx:470,517`；`processMessageUploads.ts:149-151`
- `composer.state.send.disabled.recording` — 出处：分册 11 表行「录音中 textarea/格式/emoji 禁；Send **不**因录音单独禁」；`MessageBox.tsx:305,470,482-493,517`
- `composer.state.send.disabled.read-only` — 出处：分册 11 表行「只读房间无 textarea，不能发」；`ComposerContainer.tsx:59-60`；`ComposerReadOnly.tsx:26-32`
- `composer.state.send.disabled.blocked` — 出处：分册 11 表行「被屏蔽的 DM 无输入」；`ComposerContainer.tsx:71-72`；`ComposerBlocked.tsx:4-6`
- `composer.state.send.e2ee.hint` — 出处：分册 11 表行「加密房密钥未就绪但允许明文：可发，有 hint」；`MessageBoxHint.tsx:22-43`；`rocketchat.e2e.room.ts:176-191`
- `composer.state.send.e2ee.server-reject` — 出处：分册 11 表行「不允许明文时 UI 仍像可发，服务端拒」；`MessageBox.tsx:517`；`server/.../sendMessage.ts:100-105`
- `composer.state.send.click` — 出处：分册 11 表行「点发送钮发出（不受 Enter 偏好）」；`MessageBox.tsx:182-196,514-521`
- `composer.state.send.enter` — 出处：分册 11 表行「Enter（或 alternative 下修饰+Enter）走同一 send」；`MessageBox.tsx:124-125,221-233`
- `composer.state.send.enter.newline` — 出处：分册 11 表行「和弦不发送时插入换行」；`MessageBox.tsx:226-230`
- `composer.state.send.new` — 出处：分册 11 表行「非编辑发出新消息」；`sendMessage.ts:48-51,87-120`
- `composer.state.send.edit.save` — 出处：分册 11 表行「编辑态发送走 update 不是 sendMessage」；`sendMessage.ts:44-46`；`processMessageEditing.ts:12-27`；`data.ts:176-192`
- `composer.state.send.edit.empty-delete` — 出处：分册 11 表行「编辑中清空再发送走删除而不是 update」；`sendMessage.ts:128-144`
- `composer.state.join.preview` — 出处：分册 11 表行「未订阅预览房：composer 在，Send 换成 Join」；`MessageBox.tsx:506-509`；`ComposerMessage.tsx:34-40`
- `composer.state.join.readonly` — 出处：分册 11 表行「只读且未订阅：callout + Join，无 textarea」；`ComposerReadOnly.tsx:12-32`
- `composer.state.join.password` — 出处：分册 11 表行「需要加入码的预览：密码框 + Join_with_password」；`ComposerContainer.tsx:27-28,67-68`；`ComposerJoinWithPassword.tsx:21-47`
- `composer.state.join.omni` — 出处：分册 11 表行「全渠道已开房间、自己未订阅且非当前坐席：Join」；`ComposerOmnichannel.tsx:62-68`；`ComposerOmnichannelJoin.tsx:15-28`
- `composer.state.upload.button` — 出处：分册 11 表行「点回形针打开多选系统选择器并入队」；`useFileUploadAction.ts:9-52`
- `composer.state.upload.drop` — 出处：分册 11 表行「拖放文件入队」；`useFileUploadDropTarget.ts:72-91`；`DropTargetOverlay.tsx:66-92`
- `composer.state.upload.drop.disabled` — 出处：分册 11 表行「无权拖入时 overlay 变红，松手不传」；`useFileUploadDropTarget.ts:72-86`
- `composer.state.upload.paste` — 出处：分册 11 表行「剪贴板无 text/plain 时粘贴图片入队」；`MessageBox.tsx:351-379`
- `composer.state.upload.reject.size` — 出处：分册 11 表行「超 `FileUpload_MaxFileSize` 出错误 chip，不发 XHR」；`uploads.ts:143-149`
- `composer.state.upload.reject.type` — 出处：分册 11 表行「MIME 不在白名单/在黑名单 → 错误 chip」；`uploads.ts:125,152-153`
- `composer.state.upload.reject.count` — 出处：分册 11 表行「队列+新选 >10 只 toast，不加 chip」；`uploadFiles.ts:17-22`；`lib/constants.ts:2`
- `composer.state.upload.e2ee.blocked` — 出处：分册 11 表行「加密房且不允许明文文件且未开加密文件：整批拒」；`uploadFiles.ts:27-31`
- `composer.state.upload.e2ee.encrypt-fail` — 出处：分册 11 表行「开了加密文件但房间未就绪：该文件失败」；`uploadFiles.ts:47-54`
- `composer.state.upload.chip.loading` — 出处：分册 11 表行「上传中 chip 忙 + 顶栏百分比」；`MessageComposerGenericFile.tsx:33,78-96`；`UploadProgressIndicator.tsx:61-68`
- `composer.state.upload.chip.cancel` — 出处：分册 11 表行「取消进行中的 XHR」；`MessageComposerGenericFile.tsx:33,55-63`
- `composer.state.upload.chip.remove` — 出处：分册 11 表行「去掉已完成或错误 chip」；`MessageComposerGenericFile.tsx:55-63`
- `composer.state.upload.chip.error` — 出处：分册 11 表行「失败 chip **没有 Retry**，只能 Remove」；`MessageComposerGenericFile.tsx:35-37,66-75`
- `composer.state.upload.chip.edit` — 出处：分册 11 表行「成功 chip 改文件名/alt」；`MessageComposerGenericFile.tsx:35-52`；`FileUploadModal.tsx:63-112`
- `composer.state.upload.multiple` — 出处：分册 11 表行「一次多选并行上传」；`useFileUploadAction.ts:9`；`uploadFiles.ts:82`
- `composer.state.upload.partial-send` — 出处：分册 11 表行「部分失败时 Send_anyway 只确认成功的」；`processMessageUploads.ts:200-215`
- `composer.state.upload.all-failed` — 出处：分册 11 表行「全部失败只 Ok，不发送」；`processMessageUploads.ts:182-198`
- `composer.state.audio.start` — 出处：分册 11 表行「开始录音，textarea 换成录音条」；`useAudioMessageAction.ts:14-61`；`AudioMessageRecorder.tsx:106-126`
- `composer.state.audio.cancel` — 出处：分册 11 表行「丢掉录音，不入队」；`AudioMessageRecorder.tsx:77-79,116-118`
- `composer.state.audio.finish` — 出处：分册 11 表行「完成录音 → 立刻当 mp3 入上传队列」；`AudioMessageRecorder.tsx:83-91,125-128`
- `composer.state.audio.permission-denied` — 出处：分册 11 表行「麦克风已拒：钮 disabled，点了也不出录音条」；`useAudioMessageAction.ts:14-15,61`；`AudioMessageRecorder.tsx:102-104`
- `composer.state.audio.send` — 出处：分册 11 表行「录音入队后当附件发出」；`sendMessage.ts:33-35`；`processMessageUploads.ts`
- `composer.state.audio.lock.absent` — 出处：分册 11 表行「**没有**录音锁定/上滑锁」；`AudioMessageRecorder.tsx:116-126`
- `composer.state.video.start` — 出处：分册 11 表行「打开摄像浮层，点 Record 开始」；`useVideoMessageAction.ts:12-40`；`VideoMessageRecorder.tsx:116-128`
- `composer.state.video.cancel` — 出处：分册 11 表行「关浮层不入队」；`VideoMessageRecorder.tsx:97-113,130-131`
- `composer.state.video.finish` — 出处：分册 11 表行「Stop 结束录制，Send 才可点」；`VideoMessageRecorder.tsx:49,64-80,133`
- `composer.state.video.permission-denied` — 出处：分册 11 表行「摄像头已拒：钮 disabled，或浮层被关掉」；`useVideoMessageAction.ts:51-53`；`useMediaActionTitle.ts`
- `composer.state.video.send` — 出处：分册 11 表行「浮层 Send 把 webm 入队」；`VideoMessageRecorder.tsx:84-95,133-135`
- `composer.state.video.lock.absent` — 出处：分册 11 表行「**没有**视频锁定手势」；`VideoMessageRecorder.tsx:122-136`
- `composer.fmt.bold.apply` — 出处：分册 11 表行「选区包成 `*text*`」；`messageBoxFormatting.ts:35-40`；`createComposerAPI.ts:263-269`
- `composer.fmt.bold.remove` — 出处：分册 11 表行「已有 `*` 定界则剥掉」；`createComposerAPI.ts:236-260`
- `composer.fmt.italic.apply` — 出处：分册 11 表行「选区包成 `_text_`」；`messageBoxFormatting.ts:41-46`
- `composer.fmt.italic.remove` — 出处：分册 11 表行「剥掉 `_`」；`createComposerAPI.ts:236-260`
- `composer.fmt.strike.apply` — 出处：分册 11 表行「选区包成 `~text~`」；`messageBoxFormatting.ts:47-51`
- `composer.fmt.strike.remove` — 出处：分册 11 表行「剥掉 `~`」；`createComposerAPI.ts:236-260`
- `composer.fmt.inline-code.apply` — 出处：分册 11 表行「选区包成行内代码」；`messageBoxFormatting.ts:52-56`
- `composer.fmt.inline-code.remove` — 出处：分册 11 表行「剥掉行内反引号」；`createComposerAPI.ts:236-260`
- `composer.fmt.multiline-code.apply` — 出处：分册 11 表行「选区包成围栏代码块」；`messageBoxFormatting.ts:57-61`
- `composer.fmt.multiline-code.remove` — 出处：分册 11 表行「剥掉围栏」；`createComposerAPI.ts:236-260`
- `composer.fmt.link.open` — 出处：分册 11 表行「打开加链接弹窗（不 toggle）」；`messageBoxFormatting.ts:62-88`；`AddLinkComposerActionModal.tsx:28-46`
- `composer.fmt.link.invalid` — 出处：分册 11 表行「URL 非法时不能 Add」；`AddLinkComposerActionModal.tsx:61-71`
- `composer.fmt.link.add` — 出处：分册 11 表行「插入 `[text](url)`；**没有**对应 remove 钮」；`AddLinkComposerActionModal.tsx:75-83`
- `composer.fmt.link.cancel` — 出处：分册 11 表行「关 modal 不改文本」；`AddLinkComposerActionModal.tsx:43`
- `composer.fmt.quote.absent` — 出处：分册 11 表行「工具栏**没有** quote/blockquote mark」；`messageBoxFormatting.ts:34-106`
- `composer.fmt.list.absent` — 出处：分册 11 表行「工具栏**没有** ul/ol mark」；`messageBoxFormatting.ts:34-106`
- `composer.state.emoji.open` — 出处：分册 11 表行「打开 picker dialog」；`MessageBox.tsx:164-178,480-485`；`EmojiPicker.tsx:193-245`
- `composer.state.emoji.search` — 出处：分册 11 表行「搜索过滤」；`EmojiPicker.tsx:139-205`
- `composer.state.emoji.search.empty` — 出处：分册 11 表行「搜索无结果」；`SearchingResult.tsx:26-27`
- `composer.state.emoji.tone` — 出处：分册 11 表行「改肤色并写入本地」；`ToneSelector.tsx:54-66`；`ToneSelectorWrapper.tsx:10-11`
- `composer.state.emoji.recent` — 出处：分册 11 表行「打开时落在 recent 分类」；`EmojiPicker.tsx:135-137`
- `composer.state.emoji.insert` — 出处：分册 11 表行「点一个 emoji 插入并关闭」；`EmojiPicker.tsx:104-132`
- `composer.state.emoji.pref-off` — 出处：分册 11 表行「关 useEmojis：钮 disabled，点了也不开」；`MessageBox.tsx:168-169,482`
- `composer.popup.mention.open` — 出处：分册 11 表行「输入 `@` 打开 People 菜单」；`ComposerPopupProvider.tsx:110-184`；`ComposerBoxPopup.tsx:82-114`
- `composer.popup.mention.empty` — 出处：分册 11 表行「过滤后无人」；`ComposerBoxPopup.tsx:99`
- `composer.popup.mention.user.keyboard` — 出处：分册 11 表行「↑↓ 后 Enter/Tab 插入 @username」；`useComposerBoxPopup.ts:181-190`；`ComposerPopupProvider.tsx:182`
- `composer.popup.mention.user.click` — 出处：分册 11 表行「鼠标点 option 插入同一值」；`ComposerBoxPopup.tsx:105`
- `composer.popup.mention.all.keyboard` — 出处：分册 11 表行「键盘选系统项 @all」；`ComposerPopupProvider.tsx:129-136`
- `composer.popup.mention.all.click` — 出处：分册 11 表行「点击 @all」；`ComposerBoxPopup.tsx:105`
- `composer.popup.mention.here.keyboard` — 出处：分册 11 表行「键盘选 @here」；`ComposerPopupProvider.tsx:139-146`
- `composer.popup.mention.here.click` — 出处：分册 11 表行「点击 @here」；`ComposerBoxPopup.tsx:105`
- `composer.popup.mention.not-in-channel` — 出处：分册 11 表行「spotlight 到不在本房的用户」；`ComposerBoxPopupUser.tsx:51-54`
- `composer.popup.slash.open` — 出处：分册 11 表行「行首 `/` 打开 Commands palette（只补全不执行）」；`ComposerPopupProvider.tsx:327-360`
- `composer.popup.slash.empty` — 出处：分册 11 表行「过滤无命令」；`ComposerBoxPopup.tsx:99`
- `composer.popup.slash.encrypted` — 出处：分册 11 表行「加密且不允许明文：palette 整组 disabled」；`ComposerPopupProvider.tsx:101-103,332-343`
- `composer.state.slash.execute` — 出处：分册 11 表行「发送 `/cmd params` 真正执行」；`processSlashCommand.ts:64-113`；`MessageBox.tsx:116-118`
- `composer.state.slash.invalid` — 出处：分册 11 表行「未知命令且不允许当正文：rocket.cat 临时提示」；`processSlashCommand.ts:55-58`
- `composer.state.slash.unrecognized-pass` — 出处：分册 11 表行「未知命令被允许时当普通消息发出」；`processSlashCommand.ts:55-61`
- `composer.state.slash.denied` — 出处：分册 11 表行「已知命令但无 permission」；`processSlashCommand.ts:66-68`
- `composer.state.slash.app.commands` — 出处：分册 11 表行「App 经 commands.list 注入同一 palette（扩展面 1）」；`useAppSlashCommands.ts:32-87`；`app/apps/server/bridges/commands.ts:100-120`
- `composer.popup.slash.preview` — 出处：分册 11 表行「`providesPreview` 命令：横预览后 POST 执行（扩展面 2）」；`ComposerBoxPopupPreview.tsx:31-76,102-133`；`useComposerBoxPopupQueries.ts:18-23`
- `composer.popup.canned.absent-non-omni` — 出处：分册 11 表行「普通 c/p/d 输入 `!` **不**开 canned 菜单」；`ComposerPopupProvider.tsx:364-392`
- `composer.popup.canned.omni.open` — 出处：分册 11 表行「live 房间 `!` 打开 canned 菜单」；`ComposerPopupProvider.tsx:364-392`；`useCannedResponsesQuery.ts:14-18`
- `composer.popup.canned.omni.empty` — 出处：分册 11 表行「快捷码无匹配」；`ComposerBoxPopup.tsx:99`
- `composer.popup.canned.omni.select` — 出处：分册 11 表行「选一项用全文替换 `!filter`」；`ComposerPopupProvider.tsx:376-388`
- `composer.state.quote.add` — 出处：分册 11 表行「工具栏 Quote 后 composer 上方出现引用块」；`MessageBoxReplies.tsx:16-26`；`createComposerAPI.ts:113-116`
- `composer.state.quote.dismiss` — 出处：分册 11 表行「关掉单条引用 chip」；`MessageBoxReply.tsx:44-51`
- `composer.state.quote.send` — 出处：分册 11 表行「带着引用发出，bar 乐观清空」；`sendMessage.ts:96-119`
- `composer.state.draft.persist` — 出处：分册 11 表行「打字 debounce 写入 localStorage」；`useDraft.ts:4-33`；`createComposerAPI.ts:42-44,287`
- `composer.state.draft.flush` — 出处：分册 11 表行「卸载 composer 时同步服务器并清 local」；`useDraft.ts:36-55`；`MessageBox.tsx:144-146`
- `composer.state.draft.restore` — 出处：分册 11 表行「再进房间/线程预填」；`useDraft.ts:19`；`MessageBox.tsx:135-140`
- `composer.state.draft.discard` — 出处：分册 11 表行「发送成功立刻清空本地文本」；`sendMessage.ts:34,48`
- `composer.state.draft.room-switch` — 出处：分册 11 表行「切房：旧房 flush，新房 restore」；`ComposerMessage.tsx:91`；`useDraft.ts:5`
- `composer.state.draft.reload` — 出处：分册 11 表行「整页刷新：server 优先，否则 local」；`useDraft.ts:19`
- `composer.state.typing.start` — 出处：分册 11 表行「自己非空输入时广播 typing」；`ComposerMessage.tsx:68-73`；`UserAction.ts:10-18,114+`
- `composer.state.typing.stop` — 出处：分册 11 表行「清空或发送后停止」；`ComposerMessage.tsx:54-56,69-71`
- `composer.state.typing.multi` — 出处：分册 11 表行「多人同时 typing 拼文案」；`ComposerUserActionIndicator.tsx:9-14,70-74`
- `composer.state.typing.truncated` — 出处：分册 11 表行「≥5 人截成 and others」；`ComposerUserActionIndicator.tsx:7,70-72`
- `composer.state.typing.setting-off` — 出处：分册 11 表行「能关掉指示的只有联邦 EDU / embedded CSS；无账号级开关」；`en.i18n.json` `Federation_Service_EDU_Process_Typing`；`RoomComposer.tsx:16-18`；`UserAction.ts:31-38`
- `composer.state.location.prompt` — 出处：分册 11 表行「定位权限未决：先说明再 Continue」；`useShareLocationAction.tsx:17-31`；`ShareLocationModal.tsx:70-79`
- `composer.state.location.denied` — 出处：分册 11 表行「定位拒绝或拿不到坐标」；`ShareLocationModal.tsx:82-87`
- `composer.state.location.share` — 出处：分册 11 表行「预览地图后发出 Point」；`ShareLocationModal.tsx:90-93`
- `composer.state.webdav.add` — 出处：分册 11 表行「添加 WebDAV 账号」；`useWebdavActions.tsx:12-33`
- `composer.state.webdav.pick` — 出处：分册 11 表行「从已连账户选文件入队」；`useWebdavActions.tsx:35-43`；`WebdavFilePickerModal.tsx:128-147`
- `composer.state.discussion.open` — 出处：分册 11 表行「从 composer 打开创建讨论」；`useCreateDiscussionAction.tsx:16-31`；`CreateDiscussion.tsx`
- `composer.state.discussion.submit` — 出处：分册 11 表行「提交创建并跳进新讨论」；`CreateDiscussion.tsx:53,82,190-205`
- `composer.state.timestamp.open` — 出处：分册 11 表行「打开时间戳选择器」；`useTimestampAction.tsx:8-26`；`TimestampPickerModal.tsx:64-71`
- `composer.state.timestamp.insert` — 出处：分册 11 表行「把 markup 插入 composer」；`TimestampPickerModal.tsx:46-52,64`
- `composer.state.apps.emit` — 出处：分册 11 表行「点 Apps 段按钮发 UiKit」；`useMessageboxAppsActionButtons.ts:12-61`；`MessageBoxActionsToolbar.tsx:105-126`
- `composer.state.apps.timeout` — 出处：分册 11 表行「UiKit 交互超时 toast」；`useMessageboxAppsActionButtons.ts:40-44`
- `composer.state.omni.hold` — 出处：分册 11 表行「会话挂起：页脚 Resume，无 textarea」；`ComposerOmnichannel.tsx:44-49`；`ComposerOmnichannelOnHold.tsx:15-22`
- `composer.state.omni.inquiry` — 出处：分册 11 表行「队列预览：Take_it（离线/不可用则禁）」；`ComposerOmnichannelInquiry.tsx:42-60`
- `composer.state.omni.callout` — 出处：分册 11 表行「未知联系人条：Add_contact / Block / Dismiss」；`ComposerOmnichannelCallout.tsx:35-58`
- `composer.state.constraint.federation.invalid` — 出处：分册 11 表行「非原生联邦房禁止输入」；`ComposerFederation.tsx:17-18`；`ComposerFederationInvalidVersion.tsx:7-18`
- `composer.state.constraint.federation.disabled` — 出处：分册 11 表行「联邦总开关关」；`ComposerFederation.tsx:21-22`
- `composer.state.constraint.federation.premium` — 出处：分册 11 表行「无 federation 许可」；`ComposerFederation.tsx:25-26`
- `composer.state.constraint.airgapped` — 出处：分册 11 表行「空窗到期只读页脚」；`ComposerContainer.tsx:43-44`；`ComposerAirGappedRestricted.tsx:6-16`
- `composer.state.constraint.archived` — 出处：分册 11 表行「归档房无输入」；`ComposerContainer.tsx:63-64`；`ComposerArchived.tsx:8-10`
- `composer.state.constraint.omni.closed` — 出处：分册 11 表行「已关闭会话无输入」；`ComposerOmnichannel.tsx:26-32`
- `composer.state.constraint.omni.mac` — 出处：分册 11 表行「MAC 超限无输入」；`ComposerOmnichannel.tsx:35-40`
- `composer.state.constraint.omni.dept-nav.absent` — 出处：分册 11 表行「房间 composer **没有**部门选择 / 会话前进后退」；`ComposerOmnichannel.tsx:71-75`；`MessageBox.tsx:251-276`
- `composer.state.thread.tmid` — 出处：分册 11 表行「线程里发送带 tmid（房间发送不带）」；`ThreadChat.tsx:113-122`；`data.ts:29-31`
- `composer.state.thread.also-send-on` — 出处：分册 11 表行「勾选后回复同时出现在频道」；`ThreadChat.tsx:29-40,122-134`
- `composer.state.thread.also-send-off` — 出处：分册 11 表行「不勾则只在线程」；`ThreadChat.tsx:122-134`
- `composer.state.thread.escape` — 出处：分册 11 表行「空内容 Esc 关线程面板（房间无此回调）」；`ThreadChat.tsx:50-52,119`；`MessageBox.tsx:245-248`
- `composer.state.thread.draft-key` — 出处：分册 11 表行「线程草稿与房间草稿分 key」；`useDraft.ts:5,19`；`ThreadChat.tsx:115-116`

分册 11 NEW id 条数：**133**（`sort -u` 自该分册首次出现的稳定语义 id 列）。

## 验算

只把**各表行数**相加，证明拼接没有丢表；**不用一个总功能数当标题**。

先前 00（01–04）表体行：`193+107=300`；`300+117=417`；`417+64=481`。稳定 id：`26+107=133`；`133+117=250`；`250+64=314`。

06 表体：`21+26=47`；`47+7=54`；`54+44=98`；`98+14=112`；`112+15=127`；`127+17=144`；`144+15=159`；`159+8=167`；`167+4=171`；`171+17=188`；`188+15=203`；`203+6=209`；`209+4=213`；`213+7=220`；`220+10=230`；`230+10=240`；`240+6=246`；`246+8=254`；`254+9=263`；`263+31=294`；`294+12=306`。去重 id = 306。

07 表体（命名空间）：`17+14=31`；`31+10=41`；`41+6=47`；`47+28=75`；`75+38=113`；`113+14=127`；`127+14=141`；`141+5=146`；`146+2=148`；`148+9=157`；`157+5=162`；`162+5=167`；`167+33=200`；`200+14=214`；`214+9=223`；`223+8=231`；`231+19=250`；`250+11=261`；`261+21=282`；`282+42=324`；`324+5=329`；`329+3=332`；`332+8=340`；`340+18=358`；`358+40=398`；`398+8=406`；`406+23=429`；`429+7=436`；`436+8=444`；`444+55=499`；`499+25=524`；`524+2=526`；`526+10=536`；`536+8=544`；`544+5=549`；`549+53=602`；`602+1=603`；`603+13=616`；`616+1=617`；`617+6=623`。去重 id = 623。

08 表体：`39+53=92`；`92+29=121`；`121+15=136`（坐席 39 + 经理 CE 53 + 经理 EE 29 + widget 15）。去重 id = 136。

09 表体：`5+5=10`；`10+1=11`；`11+18=29`。去重 id = 29。

10 表体：`3+8=11`；`11+3=14`；`14+5=19`；`19+24=43`；`43+5=48`；`48+1=49`；`49+4=53`；`53+6=59`；`59+8=67`；`67+5=72`。去重 id = 72。

11 表体：`14+4=18`；`18+17=35`；`35+6=41`；`41+6=47`；`47+16=63`；`63+7=70`；`70+9=79`；`79+9=88`；`88+4=92`；`92+3=95`；`95+6=101`；`101+5=106`；`106+14=120`；`120+8=128`；`128+5=133`。去重 id = 133。

NEW（06–11）表体行/去重 id 逐步：`306+623=929`；`929+136=1065`；`1065+29=1094`；`1094+72=1166`；`1166+133=1299`。

写入本蓝图的 8 列表体（含 01 B/C 复行）：`481+306=787`；`787+623=1410`；`1410+136=1546`；`1546+29=1575`；`1575+72=1647`；`1647+133=1780`。这只证明没丢表，**不是**对外总功能数。

删除行：0（无）。精确 id 跨册碰撞：0（未改分册文件）。

## i18n 动词反查

样本方法（05 原文，可复跑）：从 `packages/i18n/src/locales/en.i18n.json`（7392 keys）筛「英文 1–4 词且首词 ∈ VERB 集合、key 不含 `.` 且 `_` < 4」得 826 candidates，`random.Random(20260820).sample(cands, 30)`。**同一 30 keys，不重抽。**

对照域：**本蓝图 01–11 全部功能行的「稳定语义 id + 功能一句话 + 完整入口点击序列」UNION**（不含门控/供给/后果）。HIT 必须写出匹配 id。MISS 保持 MISS，不发明行。

| # | key | English | 自动三列命中 | 判定 | 匹配 id | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Report_has_been_sent` | Report has been sent | — | **HIT** | `msg.report`, `user.action.report` | 入口含 `Report`；05 标明附着于 Report 动作 toast（同先前 00） |
| 2 | `Send_anyway` | Send anyway | `composer.state.upload.partial-send` | **HIT** | `composer.state.upload.partial-send` | 11 一句话含 `Send_anyway`（先前 00 MISS → HIT） |
| 3 | `Upload` | Upload | `composer.action.file-upload`, `room.info.edit.avatar.upload`, `page.account.profile.avatar.upload`, `mkt.installed.upload`, `composer.state.upload.button` | **HIT** | `composer.action.file-upload` | 一句话「打开系统文件选择器多选上传」；入口 `file-upload` |
| 4 | `Enable` | Enable | `mkt.app.enable`（入口 `Enable`） | **HIT** | `mkt.app.enable` | 09 市场 App 菜单 Enable（先前 00 因市场 OOS 为 MISS → HIT） |
| 5 | `VideoConf_Enable_Groups` | Enable in private channels | — | **MISS** | — | 设置 id，未出现在 id/一句话/入口 |
| 6 | `Open_in_new_window` | Open in new window | — | **MISS** | — | voip widget 文案，三列无 Open in new window |
| 7 | `Show_mentions` | Show badge for mentions | `room.notif.show-mentions` | **HIT** | `room.notif.show-mentions` | 06 通知偏好开关；入口 `Show_mentions`（先前 MISS → HIT） |
| 8 | `Troubleshoot_Disable_Presence_Broadcast` | Disable Presence Broadcast | — | **MISS** | — | 排障设置，OOS |
| 9 | `Register` | Register | `route.register`, `omni.widget.register`, `page.admin.workspace.register` | **HIT** | `route.register` | 登录壳注册（同先前 00）；08 widget `/register` 是另一表面 |
| 10 | `Start_Date` | Start Date | — | **MISS** | — | 名词日期字段；09 未建 Start_Date 行 |
| 11 | `delete-user` | Delete User | `page.admin.users.action.delete`（一句话「删除用户」，入口 `Delete`） | **HIT** | `page.admin.users.action.delete` | 07 用户管理删除（先前 04 只打开列表 → MISS；现 HIT） |
| 12 | `delete-livechat-contact` | Delete Omnichannel Contact | `omni.agent.directory.contact.delete`（一句话「删除联系人」） | **HIT** | `omni.agent.directory.contact.delete` | 08 已建删联系人行（先前 omni OOS → MISS；现 HIT） |
| 13 | `Markdown_Marked_SmartLists` | Enable Marked Smart Lists | — | **MISS** | — | 设置，OOS |
| 14 | `Select_period` | Select period | `page.admin.engagement.users.new.period` 等 6 行 | **HIT** | `page.admin.engagement.users.new.period` | 07 Engagement 周期控件；入口/一句话含 Select_period（先前 MISS → HIT） |
| 15 | `Save_Mobile_Bandwidth` | Save Mobile Bandwidth | `page.account.preferences.mobile-bandwidth` | **HIT** | `page.account.preferences.mobile-bandwidth` | 07 偏好字段（先前 MISS → HIT） |
| 16 | `Add_users` | Add users | `page.home.add-users`, `room.members.add.*`, `page.admin.permissions.users-in-role.users` | **HIT** | `page.home.add-users` | 07 Home 卡入口含 `Add_users`（先前 MISS → HIT） |
| 17 | `Mute_Focused_Conversations` | Mute Focused Conversations | `page.account.preferences.mute-focused` | **HIT** | `page.account.preferences.mute-focused` | 07 偏好开关（先前 MISS → HIT） |
| 18 | `create-c` | Create Public Channels | `nav.create.channel`, `page.create.channel.*`, `page.home.create-channel` | **HIT** | `nav.create.channel` | 02 入口「打开创建频道模态」；07 展开字段（同先前 00 HIT，现有内部行） |
| 19 | `save-all-canned-responses` | Save All Canned Responses | — | **MISS** | — | 08 有 canned CRUD，三列无「Save All Canned Responses」权限文案；不发明行 |
| 20 | `Teams_Select_a_team` | Select a team | `implicit.roomInfo.action.moveToTeam`, `room.info.action.move-to-team` | **HIT** | `implicit.roomInfo.action.moveToTeam` | 一句话「把频道移进团队」（同先前 00）；06 内部等价行 |
| 21 | `archive-room` | Archive Room | `room.info.field.archived`（一句话「归档/解档」） | **HIT** | `room.info.field.archived` | 06 EditRoomInfo 归档开关（先前无归档动作行 → MISS；现 HIT） |
| 22 | `Troubleshoot_Disable_Notifications` | Disable Notifications | — | **MISS** | — | 排障设置，OOS |
| 23 | `Custom_User_Status_Add` | Add Custom User Status | `page.admin.user-status.new`（入口 `New_custom_status`） | **HIT** | `page.admin.user-status.new` | 07 新建自定义状态（先前 04 只打开列表 → MISS；现 HIT） |
| 24 | `Markdown_Marked_Tables` | Enable Marked Tables | — | **MISS** | — | 设置，OOS |
| 25 | `Send_Test_Email` | Send test email | `page.admin.email-inbox.send-test` | **HIT** | `page.admin.email-inbox.send-test` | 07 一句话「发送测试邮件」；入口含 `Send_Test_Email`（先前 MISS → HIT） |
| 26 | `Join` | Join | `composer.join`, `composer.state.join.*`, `room.calls.join`, `omni.agent.join` | **HIT** | `composer.join` | id/一句话/入口均含 Join（同先前 00；11 拆出预览/只读/口令/omni 态） |
| 27 | `Remove_custom_oauth` | Remove custom OAuth | `page.admin.settings.oauth.remove-custom` | **HIT** | `page.admin.settings.oauth.remove-custom` | 07 OAuth 组危险动作「删除自定义 OAuth」（先前 settings OOS → MISS；现 HIT） |
| 28 | `Moderation_Hide_reports` | Hide reports | — | **MISS** | — | 07 有 `page.admin.moderation.dismiss-reports`（驳回举报），三列无 Hide reports / `Moderation_Hide_reports`；不把 Dismiss 冒充 Hide |
| 29 | `clear_history` | Clear History | `page.admin.integrations.outgoing.history.clear` | **HIT** | `page.admin.integrations.outgoing.history.clear` | 07 入口 `Clear history`（先前 MISS → HIT） |
| 30 | `Add_them` | Add them | — | **MISS** | — | 11 `composer.popup.mention.not-in-channel` 把 `Add_them` 写在后果列（服务端 hook），三列无 Add them；不发明行 |

30 条：HIT 20 / MISS 10。`20+10=30`。

相对先前 00（HIT 6 / MISS 24）新翻成 HIT 的 key：`Send_anyway` `Enable` `Show_mentions` `delete-user` `delete-livechat-contact` `Select_period` `Save_Mobile_Bandwidth` `Add_users` `Mute_Focused_Conversations` `archive-room` `Custom_User_Status_Add` `Send_Test_Email` `Remove_custom_oauth` `clear_history`（14）。原 HIT 6 条仍 HIT。原 MISS 中 10 条仍 MISS。

## 分册冲突 / canonical aliases

精确 id 无跨册碰撞（未改任何分册文件）。下列是**等价用户动作**（同一控件或同一提交）。门控/后果实质不同则两行都留；否则留 canonical，另一条标 alias。

| 关系 | canonical | alias / 对照 | 决议 | 理由 |
| --- | --- | --- | --- | --- |
| 收藏房间星标 | `room.header.favorite`（02） | `implicit.header.toggleFavorite`（03） | alias → 02 | 同一 Header star，同一 `POST /v1/rooms.favorite` |
| 无主题时 Add_topic | `room.header.topic-add`（02） | `implicit.header.addTopicLink`（03） | alias → 02 | 同一 header 链接，落地同一 tab |
| 顶栏创建团队 | `nav.create.team`（02） | `team.create`（04） | alias → 02 | 同一 `Create_new→Team` 模态 |
| Room Info kebab Hide/Edit/Leave/Delete/Move/Convert | `room.info.action.*`（06） | `implicit.roomInfo.action.*`（03） | alias → 06 | 同一 Info kebab；06 是内部深化行 |
| EditRoomInfo Save/Reset/Back | `room.info.edit.save` / `reset` / `back`（06） | `implicit.editRoomInfo.save` / `reset` / `back`（03） | alias → 06 | 同一编辑表单提交 |
| 侧栏行收藏 | `sidebar.roomMenu.toggleFavorite`（06） | `room.header.favorite`（02） | 都留 | 侧栏 kebab vs header star，入口不同 |
| 打开 Home | `nav.pages.home`（02） | `route.home`（04） / `page.home.*`（07） | 都留 | chrome vs 目的地 vs 卡内控件 |
| 打开 Directory | `nav.pages.directory`（02） | `route.directory`（04） / `page.directory.*`（07） | 都留 | chrome vs 落地 vs tab/表内部 |
| 市场 Explore | `nav.marketplace.explore`（02） | `route.marketplace`（04） / `mkt.explore.open`（09） | 都留 | 顶栏 vs 壳 vs 列表内部 |
| 管理 Workspace | `nav.manage.workspace`（02） | `route.admin.home`（04） / `page.admin.workspace.*`（07） | 都留 | 菜单 vs `/admin` 落点 vs 页内按钮 |
| Omnichannel 管理 | `nav.manage.omnichannel`（02） | `route.omnichannel`（04） / `omni.manager.*`（08） | 都留 | 入口 vs 壳 vs 经理页级动作 |
| 审计 Messages/Logs/Security | `nav.audit.*`（02） | `route.audit*`（04） / `page.audit.*`（07） | 都留 | 菜单 vs 路由 vs 页内筛 |
| 账号页 | `nav.user.account.*`（02） | `account.*`（04） / `page.account.*`（07） | 都留 | 菜单 vs 整页 vs 字段 |
| 通话历史 | `nav.voip.history`（02） | `route.call-history`（04） | 都留 | 顶栏钟 vs `/call-history` 页 |
| 登录 | `nav.user.login`（02） | `route.login`（04） | 都留 | 顶栏按钮 vs 登录表单 |
| 快捷键说明 | `nav.user.keyboard`（02） | `shortcut.global.showShortcutsModal`（03） / `page.account.keyboard.display`（07） | 都留 | 用户菜单 vs Shift+? vs 显示面 |
| 线程跟随 | `msg.thread.follow` / `unfollow`（01） | `thread.panel.toggleFollow`（03） / `room.threads.follow-*`（06） / `tl.thread.follow`（10） | 都留 | More / 面板铃 / 列表铃 / 时间线，入口不同 |
| 创建讨论 | `msg.discussion.start`（01） | `composer.action.create-discussion`（03） / `nav.create.discussion`（02） / `page.create.discussion.*`（07） | 都留 | 父消息 / composer / 顶栏 / 模态字段 |
| 创建频道 | `nav.create.channel`（02） | `page.create.channel.*`（07） / `page.home.create-channel`（07） | 都留 | 打开模态 vs 字段 vs Home 卡 |
| 房间搜索 | `room.toolbox.rocket-search`（02） | `nav.search.*` / `route.search` / `room.search.*`（06） | 都留 | 开口 vs 顶栏 vs 面板内部 |
| 视频/语音 | `room.toolbox.start-video-call` 等 | `user.action.video-call` / `nav.voip.call` / `room.members.action.video-call`（06） | 都留 | 房间头 / 用户卡 / 顶栏 / 成员栏 |
| 成员动作 | `user.action.*`（02） | `room.members.action.*`（06） | 都留 | UserCard vs Members 面板，同一 hook 不同入口 |
| QuickActions 关单/转接/挂起 | `room.quick.*`（06） | `omni.agent.close` / `forward` / `hold` / `resume` / `return-queue` / `transcript.*`（08） | 都留 | 06=房间头 QuickActions 内部；08=坐席产品面 |
| 反应 | `msg.reaction.add`（01） | `tl.reaction.toggle` / `tl.reaction.add`（10） | 都留 | 工具栏 vs 消息体芯片，同一 `POST /v1/chat.react` |
| Quote | `msg.quote`（01） | `implicit.quote.barDisplay`（03） / `composer.state.quote.*`（11） | 都留 | 触发 vs 条 vs 状态 |
| Composer 发送 | `composer.send`（03） | `composer.state.send.*`（11） | 都留 | 入口 vs 禁用/Enter/编辑态 |
| Composer Join | `composer.join`（03） | `composer.state.join.*`（11） | 都留 | 入口 vs 预览/只读/口令/omni |
| 格式化 | `composer.format.*`（03） | `composer.fmt.*.apply/remove`（11） | 都留 | 入口 vs apply/remove 态 |
| Mention popup | `composer.popup.mention`（03） | `composer.popup.mention.*`（11） | 都留 | 无后缀入口 vs 键盘/点击/空/外人 |
| Apps 注入 | `msg.apps.*` / `room.apps.toolbox-inject` / `composer.action.apps` / `nav.user.apps-inject` | `composer.state.apps.*` / `mkt.app.*` | 都留 | 注入面 vs 市集安装面 |
| Canned | `room.toolbox.canned-responses`（02） | `room.canned.*`（06） / `omni.agent.canned.*` / `omni.manager.canned.*`（08） / `composer.popup.canned.*`（11） | 都留 | 开口 vs 面板 vs 经理表 vs composer `!` |

回放时：抽到 alias 行，按 canonical 的入口+三件套执行，并记「同源」。抽到「都留」行，按该行自己的入口走（入口层 vs 内部层）。

分册文件未改（无精确 id 需改名）。机械碰撞修复：无。

