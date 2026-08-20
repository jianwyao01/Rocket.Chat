# PM 功能测试蓝图（合并）

## 1. 方法

- 调查基线：默认分支 `develop` @ `e10bd504b9e4576d6f862393caa277e695d249ed`（短 SHA `e10bd504b9`）。
- 源 PR / 分册（文档-only，未改产品代码）：
  1. [PR #2](https://github.com/jianwyao01/Rocket.Chat/pull/2) `cursor/pm-feature-atlas-message-toolbar-a47b` → `01-message-toolbar.md`
  2. [PR #1](https://github.com/jianwyao01/Rocket.Chat/pull/1) `cursor/pm-atlas-room-user-nav-05d4` → `02-room-user-nav.md`
  3. [PR #4](https://github.com/jianwyao01/Rocket.Chat/pull/4) `cursor/composer-implicit-atlas-78b9` → `03-composer-implicit.md`
  4. [PR #3](https://github.com/jianwyao01/Rocket.Chat/pull/3) `cursor/pm-feature-atlas-routes-6cc1` → `04-routes-and-shell.md` + `05-completeness.md`
- 诚实标记：`[读]` = 源码推断；`[待渲染实测]` = 未在真实 RC Web 客户端核对。本蓝图不发明分册没有的入口或后果。
- 分册原文完整保留在 `01`–`05`。本文件拼接 01–04 的每一张 **8 列功能行表**；04 的「供给 / 触发后果三件套」在本文件内按契约改写（见下），不回写分册。
- **机械 id 碰撞**：跨分册精确 id 集合交集为空（`msg.*` / `room.*` `user.*` `nav.*` `sidebar.*` / `composer.*` `implicit.*` `thread.*` `shortcut.*` / `route.*` `account.*` `directory.*` `team.*`）。未改任何分册文件。等价动作见文末「分册冲突」。
- 04 契约改写（不发明事实）：
  - 触发后果三件套 = (1) DOM 出现/消失的元素 role+name (2) endpoint (3) 刷新后仍在什么。分册只写了「界面/导航/持久化」时：界面→(1)，能抽出的 `GET`/`POST`→(2)，否则 (2) 标 `[待渲染实测]`，持久化→(3)。
  - 供给 = **READ** 的设置/权限/路由参数/接口/上下文，不是 `core` vs `EE:module`。许可证留在门控（若原供给写了 `EE:x` 而门控没有，则补进门控）。
- 删行规则：入口序列与观察（一句话）都空才删。本合并 **删除 0 行**。
- 回放：从本文件任一功能行表随机抽 10 行，按「完整入口点击序列」走，核「触发后果三件套」。

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

## [待渲染实测] 汇总清单

UNION：四个功能分册 + 05 完备性清单。每条标注 booklet + 相关 id（能对上才写 id）。非空。

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
22. Omnichannel QuickActions 不与 toolbox 混淆 — booklet 02；id （02 未列入；对照 03 边界）
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
3. outlookCalendar 是否仅以房间 tab 出现 — booklet 05；id `room.toolbox.outlook-calendar`
4. Livechat widget 7 路由可达性（本仓库未跑 widget） — booklet 05；id OOS
5. i18n #9 Register 与 route.register 是否同一按钮文案 — booklet 05；id `route.register`
6. 管理设置 972 add 与 UI 组数 37 的对应 — booklet 05；id OOS 字段级
7. 全渠道 13+7 侧栏缺许可证时是否少 7 项 — booklet 05；id `route.omnichannel` 入口级
8. 市场无权限时是否 404 而非空壳 — booklet 05；id `route.marketplace`

本清单条数 **77**（01=15，02=24，03=20，04=10，05=8；`15+24=39`，`39+20=59`，`59+10=69`，`69+8=77`）。

## 完备性自查记录

每个 `apps/meteor/client/views/` 子目录必须有立场：已入行 N（附该分册表的 grep）/ 已交其他分册 / out of scope+原因+量级。禁止沉默目录。

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
| `account` | 已入行 9（04 `account.*`） | `rg -c '^\| `account\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 9；本蓝图同分册表 |
| `admin` | 已入行 23（04 `route.admin.*`，不展开字段） | `rg -c '^\| `route\.admin\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 23 |
| `audit` | 已入行 3 | `rg -c '^\| `route\.audit\|^\| `route\.security-logs' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 3 |
| `banners` | out of scope — 全页横幅/UiKit banner，非路由目的地。magnitude: `find apps/meteor/client/views/banners -type f \| wc -l` → 5 | 见 05 §1 |
| `cloud` | out of scope — Cloud 公告覆盖层。magnitude: 2 files | `ls apps/meteor/client/views/cloud` |
| `composer` | 已入行（03 A1–A5 / B 录音） | `rg -c '^\| `composer\.' docs/qa/pm-feature-atlas/03-composer-implicit.md` |
| `conference` | 已入行 1 | `rg -c '^\| `route\.conference' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `directory` | 已入行 5（`route.directory` + 4 tab） | `rg -c '^\| `route\.directory\|^\| `directory\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 5 |
| `e2e` | 已交其他分册 — 02 `room.toolbox.e2e`；03 `composer.variant.*` / hint；无独立 route | `ls apps/meteor/client/views/e2e` |
| `home` | 已入行 1 | `rg -c '^\| `route\.home' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `hooks` | out of scope — 跨页 hooks，不是用户目的地。magnitude: 10 files | `find apps/meteor/client/views/hooks -type f \| wc -l` |
| `invite` | 已入行 2 | `rg -c '^\| `route\.invite\|^\| `route\.register-secret-url' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 2 |
| `mailer` | 已入行 1 | `rg -c '^\| `route\.mailer-unsubscribe' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `marketplace` | 已入行 1（仅入口）；其余 OOS | `rg -c '^\| `route\.marketplace' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `mediaCallHistory` | 已入行 1 | `rg -c '^\| `route\.call-history' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `modal` | out of scope — UiKit modal 挂载区。magnitude: 3 files | `ls apps/meteor/client/views/modal` |
| `navigation` | 已入行（02 `sidebar.*` + 部分 `nav.*`） | `rg -c '^\| sidebar\.' docs/qa/pm-feature-atlas/02-room-user-nav.md` → 9 |
| `notAuthorized` | out of scope — 内嵌未授权页，非独立目的地。magnitude: 2 files | `ls apps/meteor/client/views/notAuthorized` |
| `notFound` | 已入行 1 | `rg -c '^\| `route\.not-found' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `oauth` | 已入行 2 | `rg -c '^\| `route\.oauth-' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 2 |
| `OAuthTwoFactorAuthentication` | 已入行 1 | `rg -c '^\| `route\.2fa' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `omnichannel` | 已入行 1（仅管理入口）；坐席/侧栏子页 OOS | `rg -c '^\| `route\.omnichannel' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `outlookCalendar` | 已入行 1（02 toolbox） | `rg -c '^\| room\.toolbox\.outlook-calendar' docs/qa/pm-feature-atlas/02-room-user-nav.md` → 1 |
| `room` | 已入行（01 全部 `msg.*` + 02 `room.*`/`user.*` + 03 `implicit.*`/`thread.*`/`composer.*`） | 见各分册表 grep；`find apps/meteor/client/views/room -type f \| wc -l` → 509 |
| `root` | 已入行（04 `route.login` `route.setup-wizard` `route.token-login` `route.saml`） | `rg -c '^\| `route\.login\|^\| `route\.setup-wizard\|^\| `route\.token-login\|^\| `route\.saml' docs/qa/pm-feature-atlas/04-routes-and-shell.md` |
| `search` | 已入行 1 | `rg -c '^\| `route\.search' docs/qa/pm-feature-atlas/04-routes-and-shell.md` → 1 |
| `teams` | 已入行（04 `team.create` `directory.teams`；02 `room.toolbox.team-*`；03 `implicit.roomInfo.action.moveToTeam`/`convertToTeam`） | `rg -c '^\| `team\.create\|^\| `directory\.teams' docs/qa/pm-feature-atlas/04-routes-and-shell.md` |

**27/27 有立场。** 兄弟 views 树（05 §2）立场不变：`packages/ui-client/src/views` → `route.setup-wizard`；`packages/ui-voip/src/views` → `route.call-history` + 已交通话控件；`packages/livechat/src/routes` OOS（7 widget 路由）；`packages/web-ui-registration` → 登录壳 04 行；livechat/ui legacy views OOS。

## Out of scope

摘自 05，三条必选项带命令+量级。

### 管理设置字段级

04 只写 `route.admin.settings`（打开组列表）。

```bash
rg "this\.add\('" apps/meteor/server/settings --glob '*.ts' | wc -l   # 791
rg "settingsRegistry\.add\(" apps/meteor/server/settings --glob '*.ts' | wc -l   # 18
rg "this\.add\('" apps/meteor/ee/server --glob '*.ts' --glob '!**/tests/**' | wc -l   # 97
rg "settingsRegistry\.add\(" apps/meteor/ee/server --glob '*.ts' --glob '!**/tests/**' | wc -l   # 19
rg "this\.add\('|settingsRegistry\.add\(" apps/meteor/server apps/meteor/ee/server --glob '*.ts' --glob '!**/tests/**' | wc -l   # 972
rg "addGroup\(" apps/meteor/server/settings --glob '*.ts' | wc -l   # 37
```

量级：约 10³ 条 setting 注册（972 次 add）。不逐字段建行。

### 全渠道（超出侧栏入口）

```bash
find apps/meteor/client/views/omnichannel -type f | wc -l   # 480
rg -c "registerOmnichannelRoute\(" apps/meteor/client/views/omnichannel/routes.ts   # 20
rg -c "i18nLabel:" apps/meteor/client/views/omnichannel/sidebarItems.tsx   # 13
rg -c "i18nLabel:" apps/meteor/app/livechat-enterprise/client/views/livechatSideNavItems.ts   # 7
```

排除：管理侧栏 13 + EE 7 + `/omnichannel-directory` + `/livechat-queue` + 房间类型 `live`。04 只留 `route.omnichannel`。

### 市场（超出入口）

```bash
find apps/meteor/client/views/marketplace -type f | wc -l   # 195
rg -c "i18nLabel:" apps/meteor/client/views/marketplace/sidebarItems.tsx   # 8
```

排除：Explore / Premium / Installed / Requested / Private / Documentation / App 详情。04 只留 `route.marketplace`。02 另有顶栏菜单三项（入口级）。

## 与现行 atlas 的 id 集合差

检索（写入本批 atlas 之前）：

```bash
git ls-files develop -- docs | rg -i 'atlas|feature-map|pm-feature' || true
find docs -iname '*atlas*'   # 在 develop 上为 0
rg -n -i 'atlas|feature-map|pm-feature' docs --glob '*.md'   # develop 上为空
```

**baseline: empty**。下列全部为 NEW id（按分册分组，每条带出处）。禁止用一个虚荣总行数当标题数字。

### 各表行数（命令）

```bash
# 01 各节 | msg. 行（含 B/C 重复装配行）
python3 - <<'PY'
from pathlib import Path
p=Path('docs/qa/pm-feature-atlas/01-message-toolbar.md')
print(sum(1 for l in p.read_text().splitlines() if l.startswith('| msg.')))
PY
# 02
rg -c '^\| (room|user|nav|sidebar)\.' docs/qa/pm-feature-atlas/02-room-user-nav.md
# 03
rg -c '^\| `' docs/qa/pm-feature-atlas/03-composer-implicit.md
# 04
rg -c '^\| `route\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '^\| `account\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '^\| `directory\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '^\| `team\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
```

| 分册 | 表 | 表体行 | 稳定 id（去重） | 计数命令 |
| --- | --- | --- | --- | --- |
| 01 | 表 A | 26 | 26 | `rg '^\| msg\.' 01` 截到表 A 节 |
| 01 | B.message | 25 | —（复用 A） | 本节 `\| msg.` |
| 01 | B.message-mobile | 26 | — | 本节 |
| 01 | B.threads | 24 | — | 本节 |
| 01 | B.videoconf | 15 | — | 本节 |
| 01 | B.videoconf-threads | 14 | — | 本节 |
| 01 | B.pinned | 5 | — | 本节 |
| 01 | B.direct | 4 | — | 本节 |
| 01 | B.starred | 8 | — | 本节 |
| 01 | B.mentions | 2 | — | 本节 |
| 01 | B.federated | 16 | — | 本节 |
| 01 | B.search | 2 | — | 本节 |
| 01 | C1 出处 | 26 | —（与 A 一对一） | 本节 |
| 01 | 分册表体行合计 | 193 | 26 | 上表相加；`sort -u` id |
| 02 | A Room toolbox | 30 | 30 | `rg -c '^\| room\.toolbox\.' 02` + `room.apps` |
| 02 | B header chrome | 3 | 3 | `rg -c '^\| room\.header\.' 02` |
| 02 | C user | 16 | 16 | `rg -c '^\| user\.' 02` |
| 02 | D navbar | 49 | 49 | `rg -c '^\| nav\.' 02` |
| 02 | E sidebar | 9 | 9 | `rg -c '^\| sidebar\.' 02` |
| 02 | 分册表体行合计 | 107 | 107 | `30+3+16+49+9` |
| 03 | A1 发送与输入 | 6 | 6 | 本节 `\| \`` |
| 03 | A2 格式化 | 8 | 8 | 本节 |
| 03 | A3 弹层 | 6 | 6 | 本节 |
| 03 | A4 动作/附件 | 15 | 15 | 本节 |
| 03 | A5 变体 | 10 | 10 | 本节 |
| 03 | B1 Room Info | 10 | 10 | 本节 |
| 03 | B2 Drafts | 3 | 3 | 本节 |
| 03 | B3 DnD | 3 | 3 | 本节 |
| 03 | B4 预览 | 3 | 3 | 本节 |
| 03 | B5 Typing | 3 | 3 | 本节 |
| 03 | B6 Quote | 3 | 3 | 本节 |
| 03 | B7 Thread | 10 | 10 | 本节 |
| 03 | B8 Header | 3 | 3 | 本节 |
| 03 | B9 Unread | 2 | 2 | 本节 |
| 03 | B10 Shortcuts | 18 | 18 | 本节 |
| 03 | B11 Selection | 4 | 4 | 本节 |
| 03 | B12 额外隐式 | 10 | 10 | 本节 |
| 03 | 分册表体行合计 | 117 | 117 | `45+72` |
| 04 | 登录/注册/向导 | 6 | 6 | 本节 |
| 04 | 已登录壳层 | 5 | 5 | 本节 |
| 04 | directory.* | 4 | 4 | `rg -c '^\| `directory\.' 04` |
| 04 | account.* | 9 | 9 | `rg -c '^\| `account\.' 04` |
| 04 | team.* | 1 | 1 | `rg -c '^\| `team\.' 04` |
| 04 | admin 侧栏+HOME | 23 | 23 | `rg -c '^\| `route\.admin\.' 04` |
| 04 | 市场/全渠道/审计入口 | 5 | 5 | 本节 |
| 04 | 外链/协议 | 11 | 11 | 本节 |
| 04 | 分册表体行合计 | 64 | 64 | `50+9+4+1`（route 50 含 admin 23） |

### NEW id 清单（baseline empty → 全部新建）

#### 分册 01

- `msg.reaction.add` — 出处：分册 01 表行「给消息添加或取消一个 emoji 回应」；`ReactionMessageAction.tsx:25-86`
- `msg.quote` — 出处：分册 01 表行「把该消息作为引用插入当前 composer」；`QuoteMessageAction.tsx:20-54`
- `msg.thread.reply` — 出处：分册 01 表行「在该消息下打开/进入讨论串并回复」；`ReplyInThreadMessageAction.tsx:20-57`
- `msg.forward` — 出处：分册 01 表行「把消息转发到其他房间或复制 permalink」；`ForwardMessageAction.tsx:16-52`
- `msg.jump` — 出处：分册 01 表行「从列表/侧栏跳回房间时间线该消息」；`JumpToMessageAction.tsx:12-24`；装配：`PinnedItems.tsx:14` `StarredItems.tsx:14` `MentionsItems.tsx:14` `SearchItems.tsx:14` `ThreadsItems.tsx:20` `MobileItems.tsx:22` `VideoconfThreadsItems.tsx:16` `DirectItems.tsx:12`
- `msg.webdav.save` — 出处：分册 01 表行「把消息附件存到已配置的 WebDAV」；`useWebDAVMessageAction.tsx:9-43`
- `msg.discussion.start` — 出处：分册 01 表行「以该消息为父消息创建讨论」；`useNewDiscussionMessageAction.tsx:8-69`
- `msg.pin` — 出处：分册 01 表行「将消息钉在房间钉选列表」；`usePinMessageAction.tsx:9-39`
- `msg.unpin` — 出处：分册 01 表行「取消钉选」；`useUnpinMessageAction.ts:8-32`
- `msg.star` — 出处：分册 01 表行「为自己收藏该消息」；`useStarMessageAction.ts:8-33`
- `msg.unstar` — 出处：分册 01 表行「取消自己的收藏」；`useUnstarMessageAction.ts:8-33`
- `msg.permalink.copy` — 出处：分册 01 表行「复制指向该消息的 permalink」；`usePermalinkAction.ts:10-50`；调用点 `MessageToolbarActionMenu.tsx:53-64`
- `msg.thread.follow` — 出处：分册 01 表行「跟随该线程以便收到回复通知」；`useFollowMessageAction.ts:10-61`
- `msg.thread.unfollow` — 出处：分册 01 表行「取消跟随该线程」；`useUnFollowMessageAction.ts:10-62`
- `msg.unread.mark` — 出处：分册 01 表行「从该条开始把房间标为未读并离开」；`useMarkAsUnreadMessageAction.ts:8-41`
- `msg.translate` — 出处：分册 01 表行「请求/展示自动翻译译文」；`useTranslateAction.ts:11-68`
- `msg.translate.original` — 出处：分册 01 表行「从译文切回原文」；`useViewOriginalTranslationAction.ts:11-68`
- `msg.reply.dm` — 出处：分册 01 表行「打开与作者的 DM 并引用该消息」；`useReplyInDMAction.ts:12-88`
- `msg.copy.text` — 出处：分册 01 表行「把消息文本复制到剪贴板」；`useCopyAction.ts:14-38`
- `msg.edit` — 出处：分册 01 表行「把消息载入 composer 编辑并保存」；`useEditMessageAction.ts:9-57`
- `msg.delete` — 出处：分册 01 表行「删除消息（确认后不可恢复）」；`useDeleteMessageAction.ts:10-53`
- `msg.report` — 出处：分册 01 表行「向管理员举报他人消息」；`useReportMessageAction.tsx:15-52`
- `msg.reaction.list` — 出处：分册 01 表行「查看谁对哪些 emoji 做了回应」；`useShowMessageReactionsAction.tsx:7-32`
- `msg.read-receipts` — 出处：分册 01 表行「查看谁已读该消息」；`useReadReceiptsDetailsAction.tsx:8-36`
- `msg.apps.action` — 出处：分册 01 表行「Apps-Engine `messageAction`（非 AI）注入 More→Apps」；`useMessageActionAppsActionButtons.ts:25-77`；装配 `MessageToolbarActionMenu.tsx:87,98`
- `msg.apps.ai` — 出处：分册 01 表行「Apps-Engine `messageAction` 且 `category==='ai'` 」；`MessageToolbarStarsActionMenu.tsx:21-80`；`useMessageActionAppsActionButtons.ts:25`

分册 01 NEW id 条数：**26**（`sort -u` 自该分册首次出现的稳定语义 id 列）。

#### 分册 02

- `room.toolbox.channel-settings` — 出处：分册 02 表行「打开频道/私有组房间信息侧栏」；`ui.ts:40`
- `room.toolbox.team-info` — 出处：分册 02 表行「打开团队信息侧栏」；`ui.ts:41`
- `room.toolbox.user-info-group` — 出处：分册 02 表行「打开多人 DM 成员列表」；`ui.ts:42`
- `room.toolbox.user-info` — 出处：分册 02 表行「打开 1:1 DM 对方资料侧栏」；`ui.ts:43`
- `room.toolbox.thread` — 出处：分册 02 表行「打开房间线程列表侧栏」；`ui.ts:44`
- `room.toolbox.autotranslate` — 出处：分册 02 表行「打开自动翻译设置侧栏」；`ui.ts:45`
- `room.toolbox.calls` — 出处：分册 02 表行「打开视频会议历史侧栏」；`ui.ts:46`
- `room.toolbox.canned-responses` — 出处：分册 02 表行「打开 Omnichannel 快捷回复侧栏」；`ui.ts:47`
- `room.toolbox.clean-history` — 出处：分册 02 表行「打开清理历史（剪枝）侧栏」；`ui.ts:48`
- `room.toolbox.contact-profile` — 出处：分册 02 表行「打开 livechat 联系人资料」；`ui.ts:49`
- `room.toolbox.discussions` — 出处：分册 02 表行「打开讨论列表侧栏」；`ui.ts:50`
- `room.toolbox.e2e` — 出处：分册 02 表行「开关房间端到端加密（弹窗，无 tab）」；`ui.ts:51`
- `room.toolbox.export-messages` — 出处：分册 02 表行「打开导出消息侧栏」；`ui.ts:52`
- `room.toolbox.game-center` — 出处：分册 02 表行「打开 Game Center 侧栏」；`ui.ts:53`
- `room.toolbox.banned-users` — 出处：分册 02 表行「打开房间封禁用户列表」；`ui.ts:54`
- `room.toolbox.members-list` — 出处：分册 02 表行「打开频道/组/团队成员列表」；`ui.ts:55`
- `room.toolbox.mentions` — 出处：分册 02 表行「打开本房间提及消息列表」；`ui.ts:56`
- `room.toolbox.omnichannel-external-frame` — 出处：分册 02 表行「打开 Omnichannel 外部 iframe 侧栏」；`ui.ts:57`
- `room.toolbox.outlook-calendar` — 出处：分册 02 表行「打开 Outlook 日历事件侧栏」；`ui.ts:58`
- `room.toolbox.pinned-messages` — 出处：分册 02 表行「打开置顶消息列表」；`ui.ts:59`
- `room.toolbox.push-notifications` — 出处：分册 02 表行「打开本房间通知偏好」；`ui.ts:60`
- `room.toolbox.rocket-search` — 出处：分册 02 表行「打开房间内消息搜索侧栏」；`ui.ts:61`
- `room.toolbox.room-info` — 出处：分册 02 表行「打开 livechat 会话信息」；`ui.ts:62`
- `room.toolbox.starred-messages` — 出处：分册 02 表行「打开星标消息列表」；`ui.ts:63`
- `room.toolbox.team-channels` — 出处：分册 02 表行「打开团队频道列表」；`ui.ts:64`
- `room.toolbox.uploaded-files-list` — 出处：分册 02 表行「打开房间文件列表」；`ui.ts:65`
- `room.toolbox.ai-actions` — 出处：分册 02 表行「Apps-Engine AI 类房间动作聚合菜单（featured）」；`ui.ts:66`
- `room.toolbox.start-video-call` — 出处：分册 02 表行「从房间头发起视频会议（featured，无 tab）」；`ui.ts:67`
- `room.toolbox.start-voice-call` — 出处：分册 02 表行「从 1:1 DM 头发起/结束语音（featured，无 tab）」；`ui.ts:68`
- `room.apps.toolbox-inject` — 出处：分册 02 表行「Apps-Engine 向房间工具箱注入非 AI `roomAction` 按钮」；`useAppsRoomActions.ts:14`
- `room.header.title-open-info` — 出处：分册 02 表行「点房间标题打开对应 info tab」；`RoomHeader.tsx:45`
- `room.header.favorite` — 出处：分册 02 表行「星标/取消星标当前房间」；`RoomHeader.tsx:46`
- `room.header.topic-add` — 出处：分册 02 表行「无主题且可编辑时点「添加主题」进编辑」；`RoomHeader.tsx:50`
- `user.card.open` — 出处：分册 02 表行「打开用户资料气泡卡片」；`UserCardWithData.tsx:25`
- `user.card.see-full-profile` — 出处：分册 02 表行「从卡片进入完整 UserInfo 侧栏」；`UserCard.tsx:95-96`
- `user.action.direct-message` — 出处：分册 02 表行「对目标用户开/跳转 DM」；`useUserInfoActions.ts:95`
- `user.action.video-call` — 出处：分册 02 表行「从资料面对该用户发起视频」；`useUserInfoActions.ts:96`
- `user.action.voice-call` — 出处：分册 02 表行「从资料面对该用户发起语音」；`useUserInfoActions.ts:97`
- `user.action.add-to-room` — 出处：分册 02 表行「把非成员加进当前房间」；`useUserInfoActions.ts:98`
- `user.action.change-owner` — 出处：分册 02 表行「授予/撤销房间 owner」；`useUserInfoActions.ts:99`
- `user.action.change-leader` — 出处：分册 02 表行「授予/撤销房间 leader」；`useUserInfoActions.ts:100`
- `user.action.change-moderator` — 出处：分册 02 表行「授予/撤销房间 moderator」；`useUserInfoActions.ts:101`
- `user.action.moderation-console` — 出处：分册 02 表行「跳到该用户的审核控制台」；`useUserInfoActions.ts:102`
- `user.action.ignore` — 出处：分册 02 表行「忽略/取消忽略该成员消息」；`useUserInfoActions.ts:103`
- `user.action.mute` — 出处：分册 02 表行「禁言/解除禁言该成员」；`useUserInfoActions.ts:104`
- `user.action.block` — 出处：分册 02 表行「1:1 DM 拉黑/取消拉黑」；`useUserInfoActions.ts:105`
- `user.action.remove` — 出处：分册 02 表行「踢出房间/团队或撤销邀请」；`useUserInfoActions.ts:106`
- `user.action.ban` — 出处：分册 02 表行「从房间封禁用户」；`useUserInfoActions.ts:107`
- `user.action.report` — 出处：分册 02 表行「举报用户」；`useUserInfoActions.ts:108`
- `nav.sidebar.toggle` — 出处：分册 02 表行「折叠/展开主侧栏」；`NavBarPagesSection.tsx:12-16`
- `nav.pages.home` — 出处：分册 02 表行「打开 Home 并 toggle 侧栏」；`NavBarPagesGroup.tsx:25`
- `nav.pages.directory` — 出处：分册 02 表行「打开人员/频道/团队目录」；`NavBarPagesGroup.tsx:26`
- `nav.pages.stack` — 出处：分册 02 表行「tablet 把 Home+Directory 收进 Pages 菜单」；`NavBarPagesGroup.tsx:22`
- `nav.marketplace.explore` — 出处：分册 02 表行「进入 Marketplace 浏览」；`NavBarItemMarketPlaceMenu.tsx:20`
- `nav.marketplace.installed` — 出处：分册 02 表行「进入已安装应用列表」；`useMarketPlaceMenu.tsx:27`
- `nav.marketplace.requested` — 出处：分册 02 表行「进入待审批应用」；`useMarketPlaceMenu.tsx:35`
- `nav.sort.display.extended` — 出处：分册 02 表行「侧栏扩展行高」；`useViewModeItems.tsx:29`
- `nav.sort.display.medium` — 出处：分册 02 表行「侧栏中等行高」；`useViewModeItems.tsx:36`
- `nav.sort.display.condensed` — 出处：分册 02 表行「侧栏紧凑行高」；`useViewModeItems.tsx:43`
- `nav.sort.display.avatars` — 出处：分册 02 表行「开关侧栏头像」；`useViewModeItems.tsx:50`
- `nav.sort.by.activity` — 出处：分册 02 表行「房间列表按活跃度排」；`useSortModeItems.tsx:27`
- `nav.sort.by.name` — 出处：分册 02 表行「房间列表按名称排」；`useSortModeItems.tsx:35`
- `nav.sort.group.unread` — 出处：分册 02 表行「侧栏按未读分组」；`useGroupingListItems.tsx:26`
- `nav.sort.group.favorites` — 出处：分册 02 表行「侧栏按收藏分组」；`useGroupingListItems.tsx:33`
- `nav.sort.group.types` — 出处：分册 02 表行「侧栏按房间类型分组」；`useGroupingListItems.tsx:40`
- `nav.create.dm` — 出处：分册 02 表行「打开创建私聊模态」；`useCreateNewItems.ts:50`
- `nav.create.discussion` — 出处：分册 02 表行「打开创建讨论模态」；`useCreateNewItems.ts:58`
- `nav.create.channel` — 出处：分册 02 表行「打开创建频道模态」；`useCreateNewItems.ts:34`
- `nav.create.team` — 出处：分册 02 表行「打开创建团队模态」；`useCreateNewItems.ts:42`
- `nav.create.outbound` — 出处：分册 02 表行「打开外呼消息向导」；`useCreateNewItems.ts:66`
- `nav.search.rooms` — 出处：分册 02 表行「顶栏搜索房间/用户并跳转」；`NavBarNavigation.tsx:20`
- `nav.search.ai` — 出处：分册 02 表行「AI 增强顶栏搜索」；`NavBarNavigation.tsx:22-24`
- `nav.history.back` — 出处：分册 02 表行「路由后退」；`NavBarNavigation.tsx:30`
- `nav.history.forward` — 出处：分册 02 表行「路由前进」；`NavBarNavigation.tsx:31`
- `nav.manage.workspace` — 出处：分册 02 表行「进入管理后台」；`useAdministrationMenu.ts:41`
- `nav.manage.omnichannel` — 出处：分册 02 表行「进入 Omnichannel 管理」；`useAdministrationMenu.ts:46`
- `nav.audit.messages` — 出处：分册 02 表行「打开消息审计」；`useAuditMenu.ts:17`
- `nav.audit.logs` — 出处：分册 02 表行「打开审计日志」；`useAuditMenu.ts:23`
- `nav.audit.security` — 出处：分册 02 表行「打开安全日志」；`useAuditMenu.ts:29`
- `nav.user.status.online` — 出处：分册 02 表行「把在线状态设为 online」；`useUserMenu.tsx:46-48`
- `nav.user.status.away` — 出处：分册 02 表行「把在线状态设为 away」；`useUserMenu.tsx:46-48`
- `nav.user.status.busy` — 出处：分册 02 表行「把在线状态设为 busy」；`useUserMenu.tsx:46-48`
- `nav.user.status.offline` — 出处：分册 02 表行「把在线状态设为不可见/offline」；`useUserMenu.tsx:46-48`
- `nav.user.status.custom-edit` — 出处：分册 02 表行「编辑自定义状态文案」；`useStatusItems.tsx:54`
- `nav.user.status.visibility` — 出处：分册 02 表行「配置状态对谁可见」；`useStatusItems.tsx`
- `nav.user.account.profile` — 出处：分册 02 表行「打开我的资料」；`useAccountItems.tsx:43`
- `nav.user.account.preferences` — 出处：分册 02 表行「打开偏好设置」；`useAccountItems.tsx:49`
- `nav.user.account.accessibility` — 出处：分册 02 表行「打开无障碍与外观」；`useAccountItems.tsx:55`
- `nav.user.account.feature-preview` — 出处：分册 02 表行「打开功能预览（secondarySidebar/aiSearch）」；`useAccountItems.tsx:28`
- `nav.user.keyboard` — 出处：分册 02 表行「打开键盘快捷键说明」；`useUserMenu.tsx:54`
- `nav.user.apps-inject` — 出处：分册 02 表行「Apps-Engine 注入用户下拉动作」；`useUserMenu.tsx:18,56`
- `nav.user.logout` — 出处：分册 02 表行「退出登录」；`useUserMenu.tsx:58`
- `nav.user.login` — 出处：分册 02 表行「未登录时强制登录」；`NavBarItemLoginPage.tsx:13`
- `nav.voip.call` — 出处：分册 02 表行「顶栏发起语音通话」；`NavBarVoipGroup.tsx:21`
- `nav.voip.history` — 出处：分册 02 表行「打开通话记录页」；`NavBarVoipGroup.tsx:22`
- `nav.omnichannel.queue` — 出处：分册 02 表行「打开 livechat 队列」；`useOmnichannelQueueAction.ts:18`
- `nav.omnichannel.contact` — 出处：分册 02 表行「打开联络中心目录」；`useOmnichannelContactAction.ts:13`
- `nav.omnichannel.agent-toggle` — 出处：分册 02 表行「开关自己接听 livechat」；`useOmnichannelLivechatToggle.ts:11`
- `sidebar.filter.all` — 出处：分册 02 表行「V2 主栏切到全部会话」；`TeamCollabFilters.tsx:15`
- `sidebar.filter.favorites` — 出处：分册 02 表行「V2 主栏切到收藏」；`TeamCollabFilters.tsx:16`
- `sidebar.filter.discussions` — 出处：分册 02 表行「V2 主栏切到讨论」；`TeamCollabFilters.tsx:17`
- `sidebar.filter.in-progress` — 出处：分册 02 表行「V2 主栏切到进行中 livechat」；`OmnichannelFilters.tsx:20`
- `sidebar.filter.queue` — 出处：分册 02 表行「V2 主栏切到排队」；`OmnichannelFilters.tsx:21`
- `sidebar.filter.on-hold` — 出处：分册 02 表行「V2 主栏切到挂起」；`OmnichannelFilters.tsx:22`
- `sidebar.group.collapse` — 出处：分册 02 表行「折叠/展开侧栏分组头」；`useCollapsedGroups.ts:6`
- `sidebar.sidepanel.unread-toggle` — 出处：分册 02 表行「副栏只看未读」；`SidePanelInternal.tsx:51`
- `sidebar.sidepanel.back` — 出处：分册 02 表行「tablet 关闭副栏」；`SidePanelInternal.tsx:44`

分册 02 NEW id 条数：**107**（`sort -u` 自该分册首次出现的稳定语义 id 列）。

#### 分册 03

- `composer.send` — 出处：分册 03 表行「把当前输入（文本/附件/引用/编辑）发出去」；`MessageBox.tsx:182-196,514-521`；`sendMessage.ts:63-151`
- `composer.send.enter-behavior` — 出处：分册 03 表行「按用户偏好决定 Enter 发送还是换行」；`MessageBox.tsx:123-125,221-233`
- `composer.edit.cancel` — 出处：分册 03 表行「退出正在编辑的消息」；`MessageBox.tsx:198-214,456-461,513`
- `composer.join` — 出处：分册 03 表行「未订阅时用 Join 先加入再发」；`ComposerMessage.tsx:34-41`；`MessageBox.tsx:338-340,506-509`
- `composer.keyboard.auto-wrap` — 出处：分册 03 表行「选中文字再敲配对符，自动包一层」；`wrapSelection.ts:25-65`；`MessageBox.tsx:399-410`
- `composer.slash.execute` — 出处：分册 03 表行「发送 `/cmd params` 执行斜杠命令」；`processSlashCommand.ts:46-114`
- `composer.format.bold` — 出处：分册 03 表行「把选区包成 `*text*`」；`messageBoxFormatting.ts:35-40`
- `composer.format.italic` — 出处：分册 03 表行「把选区包成 `_text_`」；`messageBoxFormatting.ts:41-46`
- `composer.format.strikethrough` — 出处：分册 03 表行「把选区包成 `~text~`」；`messageBoxFormatting.ts:47-51`
- `composer.format.inline-code` — 出处：分册 03 表行「把选区包成行内代码」；`messageBoxFormatting.ts:52-56`
- `composer.format.multiline-code` — 出处：分册 03 表行「把选区包成代码块」；`messageBoxFormatting.ts:57-61`
- `composer.format.link` — 出处：分册 03 表行「打开加链接弹窗，插入 `[text](url)`」；`messageBoxFormatting.ts:62-88`；`AddLinkComposerActionModal.tsx:39-46`
- `composer.format.katex` — 出处：分册 03 表行「打开 KaTeX 函数帮助外链」；`messageBoxFormatting.ts:89-105`；`MessageBoxFormattingToolbar.tsx:56-58`
- `composer.format.overflow-dropdown` — 出处：分册 03 表行「窄屏把除首项外的格式收入下拉」；`FormattingToolbarDropdown.tsx`；`MessageBoxFormattingToolbar.tsx:20-37`
- `composer.popup.mention` — 出处：分册 03 表行「`@` 补全最近发言者 / @all / @here / spotlight 用户」；`ComposerPopupProvider.tsx:110-184`；`ComposerBoxPopup.tsx:82-114`
- `composer.popup.channel` — 出处：分册 03 表行「`#` 补全自己订过的 c/p 频道」；`ComposerPopupProvider.tsx:185-215`
- `composer.popup.emoji-colon` — 出处：分册 03 表行「`:name` 内联 emoji 建议」；`ComposerPopupProvider.tsx:216-273`
- `composer.popup.emoji-plus` — 出处：分册 03 表行「`+:` 插入大表情前缀」；`ComposerPopupProvider.tsx:274-325`
- `composer.popup.slash-command` — 出处：分册 03 表行「`/` 打开斜杠命令 palette」；`ComposerPopupProvider.tsx:327-363`
- `composer.popup.slash-preview` — 出处：分册 03 表行「带 preview 的命令横向预览并执行」；`ComposerBoxPopupPreview.tsx:31-76,106-133`；`ComposerPopupProvider.tsx:393-410`
- `composer.emoji.picker` — 出处：分册 03 表行「打开 emoji 选择器并插入」；`MessageBox.tsx:164-178,480-485`
- `composer.action.audio-message` — 出处：分册 03 表行「开始录音，完成后当 mp3 附件」；`useAudioMessageAction.ts:13-64`；`AudioMessageRecorder.tsx:106-126`
- `composer.action.video-message` — 出处：分册 03 表行「打开视频录制浮层」；`useVideoMessageAction.ts:11-62`；`VideoMessageRecorder.tsx:116-136`
- `composer.action.file-upload` — 出处：分册 03 表行「打开系统文件选择器多选上传」；`useFileUploadAction.ts:11-52`；`uploads.ts:157`
- `composer.paste.image` — 出处：分册 03 表行「粘贴剪贴板图片当附件」；`MessageBox.tsx:342-379`
- `composer.action.create-discussion` — 出处：分册 03 表行「从 composer 打开创建讨论弹窗」；`useCreateDiscussionAction.tsx:8-34`
- `composer.action.share-location` — 出处：分册 03 表行「分享当前位置为 geo 消息」；`useShareLocationAction.tsx:9-33`；`ShareLocationModal.tsx:36-52`
- `composer.action.timestamp` — 出处：分册 03 表行「插入时间戳 markup」；`useTimestampAction.tsx:8-27`
- `composer.action.webdav-add` — 出处：分册 03 表行「添加 WebDAV 服务器账号」；`useWebdavActions.tsx:11-34`
- `composer.action.webdav-upload` — 出处：分册 03 表行「从已连 WebDAV 选文件上传」；`useWebdavActions.tsx:22-43`
- `composer.action.more-menu` — 出处：分册 03 表行「打开 + 更多操作菜单」；`MessageBoxActionsToolbar.tsx:151-163`
- `composer.action.apps` — 出处：分册 03 表行「运行 Apps Engine 注册的 messageBox 按钮」；`useMessageboxAppsActionButtons.ts:12-61`
- `composer.upload.remove` — 出处：分册 03 表行「去掉待发送附件 chip」；`MessageComposerGenericFile.tsx:55-64`
- `composer.upload.cancel` — 出处：分册 03 表行「取消进行中的上传」；`MessageComposerGenericFile.tsx:55-63`
- `composer.upload.edit` — 出处：分册 03 表行「改附件文件名 / alt」；`MessageComposerGenericFile.tsx:35-52`；`FileUploadModal.tsx:63-112`
- `composer.variant.air-gapped` — 出处：分册 03 表行「空窗限制时只读页脚，无输入框」；`ComposerAirGappedRestricted.tsx:6-16`
- `composer.variant.anonymous.sign-in` — 出处：分册 03 表行「未登录点「登录后发言」」；`ComposerAnonymous.tsx:42-44`
- `composer.variant.anonymous.join` — 出处：分册 03 表行「以匿名用户开始说话」；`ComposerAnonymous.tsx:21-37,45-48`
- `composer.variant.read-only` — 出处：分册 03 表行「只读房间页脚；未订阅可 Join」；`ComposerReadOnly.tsx:9-34`
- `composer.variant.archived` — 出处：分册 03 表行「归档房间不能输入」；`ComposerArchived.tsx:8-10`；`useMessageComposerIsArchived.ts:3-4`
- `composer.variant.join-password` — 出处：分册 03 表行「用加入码加入加密加入的房间」；`ComposerJoinWithPassword.tsx:13-47`
- `composer.variant.blocked` — 出处：分册 03 表行「被对方或自己屏蔽的 DM 不能输入」；`ComposerBlocked.tsx:4-7`
- `composer.variant.federation.invalid-version` — 出处：分册 03 表行「非原生联邦房间禁止发送」；`ComposerFederationInvalidVersion.tsx:7-18`
- `composer.variant.federation.disabled` — 出处：分册 03 表行「联邦总开关关闭时不能发」；`ComposerFederationDisabled.tsx:7`
- `composer.variant.federation.premium` — 出处：分册 03 表行「无 federation 许可模块时不能加入/发」；`ComposerFederationJoinRoomDisabled.tsx:7`
- `implicit.roomInfo.kebab.open` — 出处：分册 03 表行「打开 Room Info 溢出菜单」；`RoomInfo.tsx:68-75`
- `implicit.roomInfo.action.edit` — 出处：分册 03 表行「从 Info 进入编辑表单」；`RoomInfoRouter.tsx:26-36`
- `implicit.roomInfo.action.hide` — 出处：分册 03 表行「隐藏房间（关订阅）」；`useHideRoomAction.tsx:23-39,65-88`
- `implicit.roomInfo.action.leave` — 出处：分册 03 表行「离开房间」；`useRoomLeave.tsx:17-56`
- `implicit.roomInfo.action.delete` — 出处：分册 03 表行「删除房间」；`useDeleteRoom.tsx:21-99`；`useRoomActions.ts:88-97`
- `implicit.roomInfo.action.moveToTeam` — 出处：分册 03 表行「把频道移进团队」；`useRoomMoveToTeam.tsx:15-36`
- `implicit.roomInfo.action.convertToTeam` — 出处：分册 03 表行「把频道转成团队」；`useRoomConvertToTeam.tsx:14-44`
- `implicit.editRoomInfo.save` — 出处：分册 03 表行「保存房间设置」；`EditRoomInfo.tsx:150-199,612-614`
- `implicit.editRoomInfo.reset` — 出处：分册 03 表行「把编辑表单打回默认值」；`EditRoomInfo.tsx:609-610`
- `implicit.editRoomInfo.back` — 出处：分册 03 表行「从编辑返回 Info」；`RoomInfoRouter.tsx:26-27`
- `implicit.draft.persistLocal` — 出处：分册 03 表行「输入时写入 localStorage 草稿」；`useDraft.ts:4-33`
- `implicit.draft.flushServer` — 出处：分册 03 表行「卸载 composer 时把草稿同步到服务器」；`useDraft.ts:36-55`；`MessageBox.tsx:144-146`
- `implicit.draft.restore` — 出处：分册 03 表行「打开房间/线程时预填草稿」；`useDraft.ts:19-20`
- `implicit.upload.dragEnterOverlay` — 出处：分册 03 表行「拖入文件时盖一层 drop overlay」；`DropTargetOverlay.tsx:66-92`
- `implicit.upload.dropFiles` — 出处：分册 03 表行「放下文件开始上传」；`useFileUploadDropTarget.ts:47-68`；`DropTargetOverlay.tsx:35-59`
- `implicit.upload.dragDisabledOverlay` — 出处：分册 03 表行「无权限拖入时显示拒绝原因」；`useFileUploadDropTarget.ts:72-86`
- `implicit.upload.composerChipPreview` — 出处：分册 03 表行「点 chip 打开发送前预览/改名」；`MessageComposerGenericFile.tsx:35-52`
- `implicit.upload.modalConfirm` — 出处：分册 03 表行「在预览里确认新文件名/alt」；`FileUploadModal.tsx:39-117`
- `implicit.upload.progressBanner` — 出处：分册 03 表行「房间顶显示上传百分比」；`UploadProgressIndicator.tsx:61-68`
- `implicit.typing.start` — 出处：分册 03 表行「自己输入时向房间广播 typing」；`ComposerMessage.tsx:68-73`
- `implicit.typing.stop` — 出处：分册 03 表行「停止广播 typing」；`ComposerMessage.tsx:54-56,69-71`
- `implicit.typing.display` — 出处：分册 03 表行「显示他人 typing/recording/uploading/playing」；`ComposerUserActionIndicator.tsx:57-76`
- `implicit.quote.barDisplay` — 出处：分册 03 表行「在 composer 上方显示引用预览」；`MessageBoxReplies.tsx:16-26`；`MessageBox.tsx:427`
- `implicit.quote.dismissOne` — 出处：分册 03 表行「关掉单条引用」；`MessageBoxReply.tsx:44-51`
- `implicit.quote.fromUrl` — 出处：分册 03 表行「URL `?reply={mid}` 自动挂引用」；`useQuoteMessageByUrl.ts:15-27`
- `thread.panel.openFromList` — 出处：分册 03 表行「从线程列表打开某条线程面板」；`ThreadList.tsx:115-118`
- `thread.panel.backToList` — 出处：分册 03 表行「从线程面板回到列表」；`Thread.tsx:64-66`
- `thread.panel.close` — 出处：分册 03 表行「关掉线程面板」；`Thread.tsx:82-84`
- `thread.panel.toggleExpand` — 出处：分册 03 表行「展开/折叠线程面板」；`Thread.tsx:68-70,86-88,117-122`
- `thread.panel.toggleFollow` — 出处：分册 03 表行「关注/取关该线程」；`useToggleFollowingThreadMutation.ts:19-31`
- `thread.composer.reply` — 出处：分册 03 表行「在线程 composer 回复」；`ThreadChat.tsx:113-137`
- `thread.composer.alsoSendToChannel` — 出处：分册 03 表行「勾选后回复同时出现在频道」；`ThreadChat.tsx:124-135`
- `thread.composer.escapeLeave` — 出处：分册 03 表行「空内容 Esc 离开线程面板」；`ThreadChat.tsx:50-52`
- `thread.readOnNewMessage` — 出处：分册 03 表行「线程内新回复自动标已读」；`ThreadChat.tsx:65-75`
- `thread.list.filter` — 出处：分册 03 表行「搜索/筛选线程列表」；`ThreadList.tsx:46-72,129+`
- `implicit.header.toggleFavorite` — 出处：分册 03 表行「收藏/取消收藏房间」；`Favorite.tsx:16-39`；`useToggleFavoriteMutation.ts:14-19`
- `implicit.header.addTopicLink` — 出处：分册 03 表行「无主题时从 header 去加主题」；`RoomTopic.tsx:28-33`
- `implicit.header.parentRoomBack` — 出处：分册 03 表行「从讨论回到父房间」；`ParentDiscussion.tsx:28-32`
- `implicit.unread.jumpToFirst` — 出处：分册 03 表行「跳到第一条未读」；`UnreadMessagesIndicator.tsx:23-30`
- `implicit.unread.markAllRead` — 出处：分册 03 表行「把未读条关掉并标已读」；`UnreadMessagesIndicator.tsx:25-27`；`useUnreadMessages.ts:80-83`
- `shortcut.composer.send` — 出处：分册 03 表行「按发送和弦发出消息」；`MessageBox.tsx:221-233`
- `shortcut.composer.newLine` — 出处：分册 03 表行「插入换行而不发送」；`MessageBox.tsx:224-230`
- `shortcut.composer.escape` — 出处：分册 03 表行「Esc 退出编辑或空内容回调」；`MessageBox.tsx:245-248`
- `shortcut.composer.prevMessage` — 出处：分册 03 表行「光标在行首时 ↑ 编辑上一条自己的消息」；`MessageBox.tsx:251-260`
- `shortcut.composer.nextMessage` — 出处：分册 03 表行「光标在文末时 ↓ 下一条可编辑」；`MessageBox.tsx:266-276`
- `shortcut.composer.formatBold` — 出处：分册 03 表行「Ctrl/Cmd+B 加粗」；`messageBoxFormatting.ts:39`
- `shortcut.composer.formatItalic` — 出处：分册 03 表行「Ctrl/Cmd+I 斜体」；`messageBoxFormatting.ts:45`
- `shortcut.composer.focusOnType` — 出处：分册 03 表行「在非输入控件敲可打印键时拉回 composer」；`useMessageBoxAutoFocus.ts:13-36`
- `shortcut.popup.navigateUp` — 出处：分册 03 表行「补全弹层上移焦点」；`useComposerBoxPopup.ts:192-209`
- `shortcut.popup.navigateDown` — 出处：分册 03 表行「补全弹层下移焦点」；`useComposerBoxPopup.ts:211-228`
- `shortcut.popup.select` — 出处：分册 03 表行「Enter/Tab 选中当前补全项」；`useComposerBoxPopup.ts:181-190`
- `shortcut.popup.dismiss` — 出处：分册 03 表行「Esc 关掉补全弹层」；`useComposerBoxPopup.ts:164-170`
- `shortcut.messageList.tabToHeader` — 出处：分册 03 表行「消息 listitem 上 Shift+Tab 回 header」；`useMessageListNavigation.ts:40-47`
- `shortcut.messageList.tabToComposer` — 出处：分册 03 表行「线程/系统消息上 Tab 到 textarea」；`useMessageListNavigation.ts:48-55`
- `shortcut.messageList.arrowNavigate` — 出处：分册 03 表行「消息之间上下键移动焦点」；`useMessageListNavigation.ts:58-67`
- `shortcut.history.loadMore` — 出处：分册 03 表行「滚到顶/底或 PageUp 等加载更多历史」；`useGetMore.ts:24-65`
- `shortcut.global.showShortcutsModal` — 出处：分册 03 表行「Shift+? 打开快捷键说明」；`useKeyboardShortcutsHotkey.tsx:24-42`；`KeyboardShortcutsModal.tsx:94`
- `shortcut.global.markAllAsRead.documented-unbound` — 出处：分册 03 表行「帮助里写了标全已读，client 无绑定」；`KeyboardShortcutsModal.tsx:32-34`
- `implicit.select.composerReplace` — 出处：分册 03 表行「选择模式用计数条替换输入框」；`ComposerContainer.tsx:75-77`；`ComposerSelectMessages.tsx:15-28`
- `implicit.select.toggleMessage` — 出处：分册 03 表行「勾选/取消单条消息」；`RoomMessage.tsx:82-136`
- `implicit.select.clear` — 出处：分册 03 表行「清除全部选择」；`SelectedMessagesContext.tsx:71-75`
- `implicit.select.selectAll` — 出处：分册 03 表行「全选当前已加载并滚到顶」；`useSelectAllAndScrollToTop.ts:9-11`
- `implicit.scroll.newMessagesButton` — 出处：分册 03 表行「不在底部时跳到新消息」；`JumpToRecentMessageButton.tsx:41-55`
- `implicit.scroll.jumpToRecent` — 出处：分册 03 表行「正在看历史时跳回最新」；`useHasNewMessages.ts:31-35`
- `implicit.scroll.loadPrevious` — 出处：分册 03 表行「向上滚加载更早历史」；`useGetMore.ts:49-62`
- `implicit.banner.announcementOpen` — 出处：分册 03 表行「打开房间公告全文」；`RoomAnnouncement.tsx:18-60`
- `implicit.banner.retentionWarning` — 出处：分册 03 表行「展示保留策略将删消息的警告」；`RetentionPolicyWarning.tsx:15-20`
- `implicit.recording.cancel` — 出处：分册 03 表行「取消正在进行的语音录制」；`AudioMessageRecorder.tsx:77-79,116-118`
- `implicit.recording.finish` — 出处：分册 03 表行「完成录音并进入附件队列」；`AudioMessageRecorder.tsx:83-91`
- `implicit.composer.hint.editing` — 出处：分册 03 表行「编辑态显示铅笔提示」；`MessageBoxHint.tsx:31-54`
- `implicit.composer.hint.e2eeUnencrypted` — 出处：分册 03 表行「E2EE 房间密钥未就绪时提示将发明文」；`MessageBoxHint.tsx:22-43`
- `implicit.layout.closeFlexTabOnClick` — 出处：分册 03 表行「点消息区关闭侧栏」；`RoomBody.tsx:59,126-154`

分册 03 NEW id 条数：**117**（`sort -u` 自该分册首次出现的稳定语义 id 列）。

#### 分册 04

- `route.login` — 出处：分册 04 表行「未登录用户打开登录表单并用账号密码（或登录服务）进入工作区」；`AuthenticationCheck.tsx:20-41` `LoginPage.tsx` `LoginForm.tsx:59-251` `NavBarItemLoginPage.tsx:8-16` `[读]`
- `route.register` — 出处：分册 04 表行「在登录壳内切到「创建账号」并提交注册」；`LoginForm.tsx:242-246` `RegisterSecretPageRouter.tsx:21-50` `[读]`
- `route.forgot-password` — 出处：分册 04 表行「在登录壳内申请密码重置邮件」；`LoginForm.tsx:88,219-229` `RegistrationPageRouter.tsx:36-41` `[读]`
- `route.reset-password` — 出处：分册 04 表行「用邮件里的 token 打开重置页并设置新密码」；`startup/routes.tsx:230-233` `@rocket.chat/web-ui-registration` `[读]`
- `route.setup-wizard` — 出处：分册 04 表行「首次部署向导（组织/管理员）」；`startup/routes.tsx:215-218` `useRedirectToSetupWizard.ts:4-16` `packages/ui-client/.../useRouteLock.ts` `[读]`
- `route.token-login` — 出处：分册 04 表行「用一次性 login token 静默登录」；`startup/routes.tsx:225-228` `LoginTokenRoute.tsx:4-15` `[读]`
- `route.home` — 出处：分册 04 表行「打开工作区 Home（欢迎卡或自定义首页）」；`startup/routes.tsx:149-156` `NavBarItemHomePage.tsx:8-22` `HomePage.tsx:6-13` `DefaultHomePage.tsx:16-48` `IndexRoute.tsx:12-28` `[读]`
- `route.directory` — 出处：分册 04 表行「打开目录页（再按默认 tab 纠正 URL）」；`startup/routes.tsx:158-165` `NavBarItemDirectoryPage.tsx:10-24` `DirectoryPage.tsx:13-35` `JoinRoomsCard.tsx:11-22` `[读]`
- `route.search` — 出处：分册 04 表行「打开智能搜索结果页（跨房间来源+可选 AI 摘要）」；`startup/routes.tsx:259-266` `SearchPage.tsx:15-22,68-161` `[读]`
- `route.call-history` — 出处：分册 04 表行「打开语音通话历史页」；`startup/routes.tsx:250-257` `NavBarVoipGroup.tsx:10-23` `CallHistoryPage.tsx` `[读]`
- `route.not-found` — 出处：分册 04 表行「未匹配路径显示 404」；`startup/routes.tsx:268-271` `[读]`
- `directory.channels` — 出处：分册 04 表行「在目录里浏览/搜索频道并点进房间」；`DirectoryPage.tsx:43-59` `ChannelsTab.tsx:6-13` `[读]`
- `directory.users` — 出处：分册 04 表行「在目录里浏览/搜索用户并开 DM」；`DirectoryPage.tsx:46-60` `UsersTab.tsx:10-18` `[读]`
- `directory.teams` — 出处：分册 04 表行「在目录里浏览/搜索团队并打开团队主房间」；`DirectoryPage.tsx:49-61` `TeamsTab.tsx:6-13` `[读]`
- `directory.external` — 出处：分册 04 表行「联邦「外部用户」目录页签」；`DirectoryPage.tsx:17,30-32,52-62` `[读]`
- `account.profile` — 出处：分册 04 表行「打开并编辑自己的资料（名/用户名/邮箱/头像；可登出其他端、删号）」；`account/routes.tsx:57-59` `sidebarItems.tsx:13-17` `useAccountItems.tsx:14-47` `AccountProfilePage.tsx:25+` `[读]`
- `account.preferences` — 出处：分册 04 表行「打开并保存个人偏好（通知/声音/消息/本地化/高亮/在线；可选导出「我的数据」）」；`account/routes.tsx:52-54` `sidebarItems.tsx:19-22` `AccountPreferencesPage.tsx:20-69` `[读]`
- `account.security` — 出处：分册 04 表行「打开安全页：改密 / TOTP / 邮件 2FA / E2E 口令」；`account/routes.tsx:62-64` `sidebarItems.tsx:24-31` `AccountSecurityPage.tsx:15-41` `[读]`
- `account.integrations` — 出处：分册 04 表行「查看并移除已关联的 WebDAV 账号」；`account/routes.tsx:67-69` `sidebarItems.tsx:33-37` `AccountIntegrationsPage.tsx:14+` `[读]`
- `account.tokens` — 出处：分册 04 表行「创建/撤销个人访问令牌」；`account/routes.tsx:72-74` `sidebarItems.tsx:39-43` `AccountTokensPage.tsx:6-16` `[读]`
- `account.omnichannel` — 出处：分册 04 表行「保存坐席侧全渠道偏好（关单后隐藏会话、PDF/邮件 transcript）」；`account/routes.tsx:77-79` `sidebarItems.tsx:45-49` `OmnichannelPreferencesPage.tsx:14-37` `[读]`
- `account.feature-preview` — 出处：分册 04 表行「开关实验功能（如 secondary sidebar、aiSearch）」；`account/routes.tsx:82-84` `sidebarItems.tsx:51-56` `useAccountItems.tsx:20-60` `AccountFeaturePreviewPage.tsx:28-40` `[读]`
- `account.accessibility-and-appearance` — 出处：分册 04 表行「改主题、字号、时间格式、是否显示角色」；`account/routes.tsx:87-89` `sidebarItems.tsx:58-61` `AccessibilityPage.tsx:30-37` `[读]`
- `account.manage-devices` — 出处：分册 04 表行「查看并登出自己的登录设备/会话」；`startup/deviceManagement.ts:15-32` `DeviceManagementAccountPage.tsx:6-16` `[读]`
- `team.create` — 出处：分册 04 表行「用顶栏「新建」打开创建团队模态并建出团队主房间」；`useCreateNewItems.ts:13-76` `CreateTeamModal.tsx:54,118+` `[读]`
- `route.admin.home` — 出处：分册 04 表行「打开管理后台壳并落到第一个有权侧栏页」；`useAdministrationMenu.ts:33-44` `AdministrationRouter.tsx:31-46` `admin/routes.tsx:118-122` `[读]`
- `route.admin.workspace` — 出处：分册 04 表行「打开工作区统计/信息页」；`sidebarItems.ts:12-17` `admin/routes.tsx:129-137` `[读]`
- `route.admin.subscription` — 出处：分册 04 表行「打开订阅/Cloud 页」；`sidebarItems.ts:18-23` `admin/routes.tsx:244-246` `[读]`
- `route.admin.engagement` — 出处：分册 04 表行「打开参与度仪表盘」；`sidebarItems.ts:24-29` `admin/routes.tsx:234-236` `[读]`
- `route.admin.moderation` — 出处：分册 04 表行「打开内容审核控制台」；`sidebarItems.ts:30-36` `admin/routes.tsx:229-231` `[读]`
- `route.admin.rooms` — 出处：分册 04 表行「打开房间管理列表」；`sidebarItems.ts:37-42` `admin/routes.tsx:194-196` `[读]`
- `route.admin.users` — 出处：分册 04 表行「打开用户管理列表」；`sidebarItems.ts:43-48` `admin/routes.tsx:189-191` `[读]`
- `route.admin.ai-center` — 出处：分册 04 表行「打开 AI Center」；`sidebarItems.ts:49-56` `admin/routes.tsx:199-201` `[读]`
- `route.admin.invites` — 出处：分册 04 表行「打开邀请链接管理」；`sidebarItems.ts:57-62` `admin/routes.tsx:204-206` `[读]`
- `route.admin.user-status` — 出处：分册 04 表行「打开自定义用户状态」；`sidebarItems.ts:63-68` `admin/routes.tsx:179-181` `[读]`
- `route.admin.permissions` — 出处：分册 04 表行「打开权限/角色页」；`sidebarItems.ts:69-74` `admin/routes.tsx:214-216` `[读]`
- `route.admin.abac` — 出处：分册 04 表行「打开 ABAC 管理」；`sidebarItems.ts:75-87` `admin/routes.tsx:254-256` `[读]`
- `route.admin.device-management` — 出处：分册 04 表行「打开全工作区设备管理」；`sidebarItems.ts:88-93` `admin/routes.tsx:239-241` `[读]`
- `route.admin.email-inboxes` — 出处：分册 04 表行「打开 Email Inbox 管理」；`sidebarItems.ts:94-100` `admin/routes.tsx:219-221` `[读]`
- `route.admin.mailer` — 出处：分册 04 表行「打开工作区群发邮件」；`sidebarItems.ts:101-106` `admin/routes.tsx:164-166` `[读]`
- `route.admin.third-party-login` — 出处：分册 04 表行「打开第三方 OAuth 应用管理」；`sidebarItems.ts:107-112` `admin/routes.tsx:169-171` `[读]`
- `route.admin.integrations` — 出处：分册 04 表行「打开传入/传出集成」；`sidebarItems.ts:113-124` `admin/routes.tsx:174-176` `[读]`
- `route.admin.import` — 出处：分册 04 表行「打开导入历史/向导入口」；`sidebarItems.ts:125-130` `admin/routes.tsx:140-161` `[读]`
- `route.admin.reports` — 出处：分册 04 表行「打开日志/分析报告」；`sidebarItems.ts:131-136` `admin/routes.tsx:209-211` `[读]`
- `route.admin.sounds` — 出处：分册 04 表行「打开自定义声音」；`sidebarItems.ts:137-142` `admin/routes.tsx:124-126` `[读]`
- `route.admin.emoji` — 出处：分册 04 表行「打开自定义 emoji」；`sidebarItems.ts:143-148` `admin/routes.tsx:184-186` `[读]`
- `route.admin.feature-preview` — 出处：分册 04 表行「打开工作区级功能预览」；`sidebarItems.ts:149-154` `admin/routes.tsx:249-251` `[读]`
- `route.admin.settings` — 出处：分册 04 表行「打开设置组列表（**不**逐字段）」；`sidebarItems.ts:155-161` `admin/routes.tsx:224-226` `[读]`
- `route.marketplace` — 出处：分册 04 表行「打开市场壳（默认 Explore 列表）」；`marketplace/routes.tsx:18-26` `MarketplaceRouter.tsx:12-32` `useMarketPlaceMenu.tsx:10-55` `NavBarPagesGroup.tsx:16-29` `[读]`
- `route.omnichannel` — 出处：分册 04 表行「打开全渠道管理壳（默认当前会话/联系中心）」；`useAdministrationMenu.ts:38-48` `OmnichannelRouter.tsx:16-24` `omnichannel/routes.ts:102-106` `[读]`
- `route.audit` — 出处：分册 04 表行「打开消息审计页（Rooms/Users/DMs/Omnichannel tabs）」；`startup/audit.tsx:43-55` `useAuditMenu.ts:11-20` `[读]`
- `route.audit-log` — 出处：分册 04 表行「打开审计操作日志」；`startup/audit.tsx:57-66` `useAuditMenu.ts:22-26` `[读]`
- `route.security-logs` — 出处：分册 04 表行「打开安全日志」；`startup/audit.tsx:68-80` `useAuditMenu.ts:28-32` `[读]`
- `route.invite` — 出处：分册 04 表行「用邀请 hash 校验并登录/入房」；`startup/routes.tsx:205-208` `InvitePage.tsx:12-47` `[读]`
- `route.register-secret-url` — 出处：分册 04 表行「用秘密注册 URL 打开注册」；`startup/routes.tsx:200-203` `SecretURLPage.tsx:5-19` `[读]`
- `route.conference` — 出处：分册 04 表行「打开会议落地页（允许访客）」；`startup/routes.tsx:210-213` `ConferenceRoute.tsx:4-8` `[读]`
- `route.mailer-unsubscribe` — 出处：分册 04 表行「邮件一键退订工作区群发」；`startup/routes.tsx:220-223` `MailerUnsubscriptionPage.tsx:8-46` `[读]`
- `route.terms-of-service` — 出处：分册 04 表行「打开服务条款 CMS 页」；`startup/routes.tsx:186-188` `[读]`
- `route.privacy-policy` — 出处：分册 04 表行「打开隐私政策 CMS 页」；`startup/routes.tsx:191-193` `[读]`
- `route.legal-notice` — 出处：分册 04 表行「打开法律声明 CMS 页」；`startup/routes.tsx:196-198` `[读]`
- `route.oauth-authorize` — 出处：分册 04 表行「第三方应用 OAuth 授权同意」；`startup/routes.tsx:235-238` `OAuthAuthorizationPage.tsx:10-31` `[读]`
- `route.oauth-error` — 出处：分册 04 表行「显示 OAuth 错误页」；`startup/routes.tsx:240-243` `[读]`
- `route.saml` — 出处：分册 04 表行「SAML IdP 回调后登录」；`startup/routes.tsx:245-248` `SAMLLoginRoute.tsx` `[读]`
- `route.2fa` — 出处：分册 04 表行「OAuth/现代登录流的 2FA 挑战」；`startup/routes.tsx:144-147` `OAuthTwoFactorAuthenticationRouter.tsx` `[读]`

分册 04 NEW id 条数：**64**（`sort -u` 自该分册首次出现的稳定语义 id 列）。

## 验算

只把**各表行数**相加，证明拼接没有丢表；**不用一个总功能数当标题**。

01 表体行：`26+25=51`；`51+26=77`；`77+24=101`；`101+15=116`；`116+14=130`；`130+5=135`；`135+4=139`；`139+8=147`；`147+2=149`；`149+16=165`；`165+2=167`；`167+26=193`。

01 稳定 id：表 A 手算 `5 图标 + 19 More 内置 + 2 Apps = 26`。与 C1 一对一。

02 表体行：`30+3=33`；`33+16=49`；`49+49=98`；`98+9=107`。D 分项 `4+3+9+5+4+5+6+4+4+5=49`。

03 表体行：A `6+8+6+15+10=45`；B `10+3+3+3+3+3+10+3+2+18+4+10=72`；`45+72=117`。

04 表体行：`6+5=11`；`11+4=15`；`15+9=24`；`24+1=25`；`25+23=48`；`48+5=53`；`53+11=64`。其中 `route.*` `6+5+23+5+11=50`；`50+9+4+1=64`。

本蓝图拼接：01 表体 193 + 02 表体 107 + 03 表体 117 + 04 表体 64。逐步：`193+107=300`；`300+117=417`；`417+64=481` 行写入 8 列表（含 01 B/C 重复装配行）。

稳定 id（去重，按分册）：01=26，02=107，03=117，04=64。逐步：`26+107=133`；`133+117=250`；`250+64=314`。这只是验算「没有丢掉分册 id」，**不是**对外宣称的「总功能数」。

删除行：0（无）。

## i18n 动词反查

样本方法（05 原文，可复跑）：从 `packages/i18n/src/locales/en.i18n.json`（7392 keys）筛「英文 1–4 词且首词 ∈ VERB 集合、key 不含 `.` 且 `_` < 4」得 826 candidates，`random.Random(20260820).sample(cands, 30)`。

对照域：**本蓝图全部功能行的「稳定语义 id + 功能一句话 + 完整入口点击序列」UNION**（不含门控/供给/后果，避免用设置字段冒充动作行）。HIT 必须写出匹配 id。MISS 保持 MISS，不发明行。

| # | key | English | 自动三列命中 | 判定 | 匹配 id | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Report_has_been_sent` | Report has been sent | — | **HIT** | `msg.report`, `user.action.report` | 入口含 `Report`；05 标明附着于 Report 动作 toast |
| 2 | `Send_anyway` | Send anyway | — | **MISS** | — | 三列 UNION 无 Send anyway / 上传确认 anyway |
| 3 | `Upload` | Upload | `room.toolbox.uploaded-files-list`, `composer.action.file-upload`, `composer.action.webdav-upload`, `composer.upload.remove`, `composer.upload.cancel`, `composer.upload.edit` | **HIT** | `composer.action.file-upload` | 一句话「打开系统文件选择器多选上传」；入口 `file-upload` |
| 4 | `Enable` | Enable | `room.toolbox.e2e`, `composer.variant.federation.disabled`, `directory.external` | **MISS** | — | Enable 作为市场 App 菜单是 OOS；三列无独立 Enable 行 |
| 5 | `VideoConf_Enable_Groups` | Enable in private channels | — | **MISS** | — | 设置 id，未出现在 id/一句话/入口 |
| 6 | `Open_in_new_window` | Open in new window | — | **MISS** | — | voip widget 文案，三列无 Open in new window |
| 7 | `Show_mentions` | Show badge for mentions | — | **MISS** | — | `room.toolbox.mentions` 是提及列表不是 badge；通知偏好行未写 Show_mentions |
| 8 | `Troubleshoot_Disable_Presence_Broadcast` | Disable Presence Broadcast | — | **MISS** | — | 排障设置，OOS |
| 9 | `Register` | Register | `route.register`, `route.register-secret-url` | **HIT** | `route.register` | id `route.register`；入口 `Create an account` 对应 05 登录壳 |
| 10 | `Start_Date` | Start Date | — | **MISS** | — | 名词日期字段，市场 OOS |
| 11 | `delete-user` | Delete User | — | **MISS** | — | `route.admin.users` 只打开列表，三列无 Delete User |
| 12 | `delete-livechat-contact` | Delete Omnichannel Contact | — | **MISS** | — | omnichannel OOS |
| 13 | `Markdown_Marked_SmartLists` | Enable Marked Smart Lists | — | **MISS** | — | 设置，OOS |
| 14 | `Select_period` | Select period | — | **MISS** | — | Engagement 页内控件，04 只打开页 |
| 15 | `Save_Mobile_Bandwidth` | Save Mobile Bandwidth | — | **MISS** | — | `account.preferences` 只到整页，三列无该字段 |
| 16 | `Add_users` | Add users | — | **MISS** | — | `route.home` 一句话/入口未写 Add users（加用户只在 04 界面叙述里，不计入对照域） |
| 17 | `Mute_Focused_Conversations` | Mute Focused Conversations | — | **MISS** | — | 偏好字段，三列无 |
| 18 | `create-c` | Create Public Channels | — | **HIT** | `nav.create.channel` | 一句话「打开创建频道模态」；入口 `Create_new→Channel` 对应 Create Public Channels |
| 19 | `save-all-canned-responses` | Save All Canned Responses | — | **MISS** | — | omnichannel OOS；`room.toolbox.canned-responses` 只打开侧栏 |
| 20 | `Teams_Select_a_team` | Select a team | — | **HIT** | `implicit.roomInfo.action.moveToTeam` | 一句话「把频道移进团队」；入口 `Teams_move_channel_to_team` |
| 21 | `archive-room` | Archive Room | — | **MISS** | — | 无「归档房间」动作行；`implicit.editRoomInfo.save` 未在三列写 Archive |
| 22 | `Troubleshoot_Disable_Notifications` | Disable Notifications | — | **MISS** | — | 排障设置，OOS |
| 23 | `Custom_User_Status_Add` | Add Custom User Status | — | **MISS** | — | `route.admin.user-status` 只打开列表 |
| 24 | `Markdown_Marked_Tables` | Enable Marked Tables | — | **MISS** | — | 设置，OOS |
| 25 | `Send_Test_Email` | Send test email | — | **MISS** | — | `route.admin.email-inboxes` 只打开页 |
| 26 | `Join` | Join | `composer.join`, `composer.variant.anonymous.join`, `composer.variant.read-only`, `composer.variant.join-password` | **HIT** | `composer.join` | id/一句话/入口均含 Join |
| 27 | `Remove_custom_oauth` | Remove custom OAuth | — | **MISS** | — | admin settings OOS |
| 28 | `Moderation_Hide_reports` | Hide reports | — | **MISS** | — | `route.admin.moderation` 只打开页 |
| 29 | `clear_history` | Clear History | — | **MISS** | — | integrations 历史页内动作；`room.toolbox.clean-history` 是剪枝不是 clear_history |
| 30 | `Add_them` | Add them | — | **MISS** | — | 提及不在房用户，三列无 Add them |

30 条：HIT 6 / MISS 24。`6+24=30`。

## 分册冲突

精确 id 无跨册碰撞。下列是**等价用户动作**（同一控件或同一提交）。门控/后果实质不同则两行都留；否则留 canonical，另一条标 alias。

| 关系 | canonical | alias / 对照 | 决议 | 理由 |
| --- | --- | --- | --- | --- |
| 收藏房间星标 | `room.header.favorite`（02） | `implicit.header.toggleFavorite`（03） | alias → 02 | 同一 Header star，同一 `POST /v1/rooms.favorite` |
| 无主题时 Add_topic | `room.header.topic-add`（02） | `implicit.header.addTopicLink`（03） | alias → 02 | 同一 header 链接，落地同一 tab |
| 顶栏创建团队 | `nav.create.team`（02） | `team.create`（04） | alias → 02 | 同一 `Create_new→Team` 模态；04 为防漏而重写 |
| 打开 Home | `nav.pages.home`（02） | `route.home`（04） | 都留 | 02=控件+sidebar toggle；04=目的地/自定义 Home |
| 打开 Directory | `nav.pages.directory`（02） | `route.directory`（04） | 都留 | chrome vs 落地 + 默认 tab |
| 市场 Explore | `nav.marketplace.explore`（02） | `route.marketplace`（04） | 都留 | 02 拆 Installed/Requested；04 只写壳 |
| 管理 Workspace | `nav.manage.workspace`（02） | `route.admin.home`（04） | 都留 | 菜单项 vs `/admin` replace 落点 |
| Omnichannel 管理 | `nav.manage.omnichannel`（02） | `route.omnichannel`（04） | 都留 | 同上 |
| 审计 Messages/Logs/Security | `nav.audit.*`（02） | `route.audit` `route.audit-log` `route.security-logs`（04） | 都留 | 菜单 vs 路由注册 |
| 账号 Profile/Preferences/A11y/Preview | `nav.user.account.*`（02） | `account.*`（04） | 都留 | 02 无 Security/Tokens/Integrations/Devices/Omnichannel 页 |
| 通话历史 | `nav.voip.history`（02） | `route.call-history`（04） | 都留 | 顶栏钟 vs `/call-history` 页 |
| 登录 | `nav.user.login`（02） | `route.login`（04） | 都留 | 顶栏按钮 vs 登录表单/会话 |
| 快捷键说明 | `nav.user.keyboard`（02） | `shortcut.global.showShortcutsModal`（03） | 都留 | 用户菜单 vs Shift+? |
| 线程跟随 | `msg.thread.follow` / `unfollow`（01） | `thread.panel.toggleFollow`（03） | 都留 | More 菜单 vs 面板铃铛，入口不同 |
| 创建讨论 | `msg.discussion.start`（01） | `composer.action.create-discussion`（03） / `nav.create.discussion`（02） | 都留 | 父消息 / composer More / 顶栏 + |
| 房间搜索 | `room.toolbox.rocket-search`（02） | `nav.search.rooms` / `nav.search.ai` / `route.search` | 都留 | 房间 tab vs 顶栏 vs AI 结果页 |
| 视频/语音 | `room.toolbox.start-video-call` 等 | `user.action.video-call` / `nav.voip.call` | 都留 | 房间头 / 用户卡 / 顶栏，门控不完全相同 |
| Apps 注入 | `msg.apps.*` / `room.apps.toolbox-inject` / `composer.action.apps` / `nav.user.apps-inject` | — | 都留 | `messageAction` / `roomAction` / `messageBoxAction` / `userDropdownAction` |
| Quote | `msg.quote`（01） | `implicit.quote.barDisplay`（03） | 都留 | 01 是触发；03 是 composer 条 |

回放时：抽到 alias 行，按 canonical 的入口+三件套执行，并记「同源」。

分册文件未改（无精确 id 需改名）。

