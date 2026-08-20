# 消息工具栏 / 消息动作 — PM 功能测试图集

默认分支：`develop`（`origin/HEAD -> origin/develop`）。本分册只覆盖消息工具栏与 `MessageActionContext` 动作。行为标 `[读]` 表示由源码推断；标 `[待渲染实测]` 表示未在真实 RC Web 客户端核对可访问名、模态 vs 工具条、或可见性触发。

## 方法

- 客户端动作联合类型在 `apps/meteor/app/ui-utils/client/lib/MessageAction.ts:6-17`，**11** 个字面量：`message` | `threads` | `message-mobile` | `pinned` | `direct` | `starred` | `mentions` | `federated` | `videoconf` | `search` | `videoconf-threads`。用户预估 11，与 union **一致**。
- Apps-Engine 侧枚举只有 **4** 个：`message` | `message-mobile` | `threads` | `starred`（`packages/apps-engine/src/definition/ui/IUIActionButtonDescriptor.ts:15-20`）。未声明 `when.messageActionContext` 的 app 按钮只匹配这 4 个。
- 仓库中 **没有** 名为 `useMessageAction` 的聚合 hook。注册面是：`toolbar/items/*Items.tsx` 装配图标，`use*Action*` 注册 More 菜单，`useMessageActionAppsActionButtons` 注入 Apps。
- `getMessageContext`（`MessageToolbar.tsx:24-41`）在未显式传入 context 时按序：`isVideoConfMessage` → `videoconf`；`isRoomFederated` → `federated`；`isThreadMessage`（`!!tmid`）→ `threads`；否则 `message`。
- 显式赋值（`rg context='(pinned|starred|mentions|search|direct|message-mobile)' apps/meteor/client --glob '*.tsx'`）：`pinned` / `starred` / `mentions` / `search`。**`direct` 与 `message-mobile` 在 develop 上无调用方**，但仍有 `*Items` 与菜单 `context` 数组，按「已注册但未挂入口」收录。
- 工具栏挂载：`MessageToolbarHolder` 用 IntersectionObserver（`useIsVisible`）在视口相交时挂载；`visible={isToolbarMenuOpen}` 在 More/AI 打开时保持。用户可见触发（悬停 / 聚焦 / 移动长按）**未渲染实测**。
- 工具栏整体隐藏：`RoomMessage.tsx:147` `message.private` 或 `e2e === 'pending'` 或多选；`ThreadMessage.tsx:74` 仅 `message.private`。
- `useLayoutHiddenActions().messageToolbox` 默认 `[]`（`LayoutContext.ts:79`），可按内部 `id` 隐藏单项。
- Timestamp picker 位于 `toolbar/items/actions/Timestamp/`，但只被 **composer** `useTimestampAction` 引用，本分册不收录。

入口前缀约定（可回放）：

- `房间消息` = 打开任意已订阅房间 → 消息列表中目标消息。
- `悬停工具栏` = 将指针移到该消息行，直到 `role=toolbar` `aria-label` 为 i18n `Message_actions` 的工具栏出现（[待渲染实测] 精确触发）。
- `More` = 工具栏按钮 `title`/`aria-label` 为 i18n `More`（`GenericMenu title={t('More')}`，`MessageToolbarActionMenu.tsx:146`）。
- `顶栏` = 房间 Header `RoomToolbox`：图标或（折叠时）`Options` kebab（`RoomToolbox.tsx:54`）。

---

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
| msg.unpin | 取消钉选 | `房间消息（已钉选）→悬停工具栏→More→Unpin`；`顶栏 Pinned_Messages→悬停→More→Unpin`；`threads / videoconf / videoconf-threads` 同样；`direct` 已注册无入口。[待渲染实测] `message-mobile`。无确认模态（与 pin 不同）。[读] | `Message_AllowPinning`；`pin-message`；非 omnichannel；`message.pinned`；`subscription` `useUnpinMessageAction.tsx:12-18`。hidden id `unpin-message`。 | (1) toast `Message_has_been_unpinned`；钉选指示消失；Pinned 列表该项消失 [待渲染实测]。(2) `POST /v1/chat.unPinMessage` `{messageId}` `useUnpinMessageMutation.ts:11`。(3) 刷新后 `pinned:false`，钉选列表无此项。[读] | 同 msg.pin，要求 `message.pinned===true` | msg.pin；msg.jump | `useUnpinMessageAction.ts:8-32` |
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

表 A 行数：**26**（手算见 验算）。

---

## 表 B. 按 MessageActionContext 可出现的 id

只计「该 context 的 `*Items` 图标 + More 中 `!context \|\| context.includes(ctx)` 的 hook + 默认 Apps-Engine 四值能进来的注入」。门控失败时运行时仍可能为 0 项。

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

行数 **25**。

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

行数 **26**。

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

行数 **24**（无 msg.thread.reply 图标、无 msg.discussion.start）。

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

行数 **15**。默认 Apps-Engine 枚举 **不含** `videoconf`，不把 apps 两行算进本表。

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

行数 **14**。无 discussion / edit / copy / unread / translate / reply.dm / thread.reply 图标。

### 表 B.pinned

装配：`PinnedItems.tsx`。赋值：`PinnedMessagesTab.tsx:41` → `MessageListTab` → `RoomMessage context='pinned'`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.jump | 见 A | `顶栏 Pinned_Messages（或 Options→Pinned_Messages）→悬停→Jump_to_message` | `Message_AllowPinning` 控制侧栏本身 `usePinnedMessagesRoomAction.ts:14`；联邦侧栏 disabled。jump 图标 none+`PinnedItems.tsx:14` | 见表 A | 见表 A | 见表 A | `PinnedItems.tsx:14` id `jump-to-pin-message` |
| msg.webdav.save | 见 A | `钉选列表消息（有 file）→More→Save_To_Webdav` | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |
| msg.unpin | 见 A | `钉选列表→悬停→More→Unpin` | 见表 A（此处 `message.pinned` 应为 true） | 见表 A | 见表 A | 见表 A | `useUnpinMessageAction.ts:26` |
| msg.pin | 见 A | 已注册 context 含 `pinned`，但 `message.pinned` 为真时 hook 返回 null，**钉选列表运行时不应出现** [读] | 见表 A | 见表 A | 见表 A | 见表 A | `usePinMessageAction.tsx:33` |
| msg.permalink.copy | 见 A | `钉选列表→More→Copy_link`（id `permalink-pinned`） | 见表 A | 见表 A | 见表 A | 见表 A | `MessageToolbarActionMenu.tsx:54` |

行数 **5**。Apps-Engine 枚举无 `pinned`。

### 表 B.direct

装配：`DirectItems.tsx`。**develop 无 `context='direct'` 调用方。** pin/unpin 的 context 数组含 `direct`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.jump | 见 A | `[待渲染实测] 无现行赋值；Items 在 subscription 存在时渲染 Jump（内部 id 却是 jump-to-pin-message）` | `DirectItems.tsx:12` `!!subscription` | 见表 A | 见表 A | 见表 A | `DirectItems.tsx:12` |
| msg.webdav.save | 见 A | `[待渲染实测] More→Save_To_Webdav` | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |
| msg.unpin | 见 A | `[待渲染实测] More→Unpin` | 见表 A | 见表 A | 见表 A | 见表 A | `useUnpinMessageAction.ts:26` |
| msg.pin | 见 A | `[待渲染实测] More→Pin` | 见表 A | 见表 A | 见表 A | 见表 A | `usePinMessageAction.tsx:33` |

行数 **4**。permalink 主/star/pinned 均不含 `direct`。

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

行数 **8**。

### 表 B.mentions

装配：`MentionsItems.tsx`。赋值：`MentionsTab.tsx:40`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.jump | 见 A | `顶栏 Mentions（或 Options→Mentions；仅 channel/group/team，`useMentionsRoomAction.ts:10`）→悬停→Jump_to_message` | none+`MentionsItems.tsx:14` | 见表 A | 见表 A | 见表 A | `MentionsItems.tsx:14` |
| msg.webdav.save | 见 A | `Mentions 列表有 file→More→Save_To_Webdav`；否则 More 不出现 | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |

行数 **2**。

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

行数 **16**。无 pin/unpin/forward/discussion/unread/translate。Apps 枚举无 `federated`。

### 表 B.search

装配：`SearchItems.tsx`。赋值：`MessageSearchTab.tsx:102`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| msg.jump | 见 A | `顶栏 Search_Messages（或 Options→Search_Messages）→输入关键词→悬停结果→Jump_to_message` | none+`SearchItems.tsx:14` | 见表 A | 见表 A | 见表 A | `SearchItems.tsx:14` |
| msg.webdav.save | 见 A | `搜索结果有 file→More→Save_To_Webdav`；否则无 More | 见表 A | 见表 A | 见表 A | 见表 A | 无 context 过滤 |

行数 **2**。

---

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

行数 **26**（与表 A 一一对应）。

### 表 C2. `*Items.tsx` 图标装配（只计 JSX 动作组件）

命令：`rg -n "<[A-Z][A-Za-z]+Action" apps/meteor/client/components/message/toolbar/items/*Items.tsx`

| 文件 | 行数 | 装配的动作组件 |
| --- | --- | --- |
| `DefaultItems.tsx` | 4 | Reaction, Quote, ReplyInThread, Forward |
| `MobileItems.tsx` | 5 | Reaction, Quote, ReplyInThread, Forward, Jump |
| `ThreadsItems.tsx` | 4 | Reaction, Quote, Forward, Jump |
| `VideoconfItems.tsx` | 2 | Reaction, ReplyInThread |
| `VideoconfThreadsItems.tsx` | 2 | Reaction, Jump |
| `PinnedItems.tsx` | 1 | Jump (`jump-to-pin-message`) |
| `DirectItems.tsx` | 1 | Jump (`jump-to-pin-message`，且需 subscription） |
| `StarredItems.tsx` | 1 | Jump (`jump-to-star-message`) |
| `MentionsItems.tsx` | 1 | Jump |
| `FederatedItems.tsx` | 3 | Reaction, Quote, ReplyInThread |
| `SearchItems.tsx` | 1 | Jump |

---

## [待渲染实测] 汇总

1. 工具栏变为可见的精确用户手势（CSS hover vs focus-within vs 移动长按 vs 仅 IntersectionObserver 挂载）。`MessageToolbarHolder.tsx:19-22` + fuselage `MessageToolbarWrapper`。
2. 各图标/菜单项在 en 与当前 locale 下的 **accessible name**（`title` vs `aria-label` vs 可见文本）。本表用 i18n key 代替。
3. `More` / `AI_Actions` 是 `IconButton` 的 `title` 还是 `aria-label`；菜单弹出是 `menu` 还是 dialog。
4. Pin / Delete / Report / Forward / Discussion / WebDAV / Read receipts / Reaction list / CreateDiscussion 的模态 role 与标题的最终可访问名。
5. Quote 后 composer 引用条、Edit 后 composer editing 态、Follow 后线程图标的 role+name。
6. Jump 后时间线高亮节点的 role+name。
7. Mark unread 后面板房间行如何暴露未读。
8. Translate / View original 切换后正文容器 name。
9. Reply in DM 后 composer 引用预览。
10. `message-mobile`、`direct` 在真实 Web/移动壳是否仍有隐藏赋值（本仓库 grep 无）。
11. 顶栏是图标还是 `Options` kebab（取决于 `roomToolboxExpanded` 与前 6 个可见位，`useRoomToolboxActions.ts:18`）。
12. Apps / AI 菜单在无 marketplace 应用的干净工作区是否完全不出现。
13. E2EE 下 Apps section 的 `Unavailable` 是否以 menu item 暴露。
14. Forward 模态 `Copy_Link` 与 More `Copy_link` 的可访问名是否可区分。
15. `GenericMenu` 在 `data.length===0` 时 mentions/search 是否真的没有任何 kebab。

---

## 计数证据

### 命令

```bash
# 默认分支
git rev-parse --abbrev-ref HEAD
# → develop
git symbolic-ref refs/remotes/origin/HEAD
# → refs/remotes/origin/develop

# 11 个客户端 context
rg -n "export type MessageActionContext" -A 12 apps/meteor/app/ui-utils/client/lib/MessageAction.ts

# 4 个 Apps-Engine context
rg -n "export enum MessageActionContext" -A 6 packages/apps-engine/src/definition/ui/IUIActionButtonDescriptor.ts

# 11 个 itemsByContext 键
rg -n "itemsByContext" -A 16 apps/meteor/client/components/message/toolbar/MessageToolbar.tsx

# 11 个 *Items 装配文件
ls -1 apps/meteor/client/components/message/toolbar/items/*Items.tsx | wc -l
# → 11

# 图标动作组件（含 1 个 spec；Timestamp 属 composer，不计入本分册）
ls -1 apps/meteor/client/components/message/toolbar/items/actions/*.tsx
# → ForwardMessageAction.spec.tsx ForwardMessageAction.tsx JumpToMessageAction.tsx
#    QuoteMessageAction.tsx ReactionMessageAction.tsx ReplyInThreadMessageAction.tsx
#    （Timestamp/ 目录只被 composer useTimestampAction 引用）

# use*Action 注册文件（排除 spec）
ls -1 apps/meteor/client/components/message/toolbar/use*.ts \
      apps/meteor/client/components/message/toolbar/use*.tsx | rg -v spec
# → 20 个文件（19 个内置 hook + useMessageActionAppsActionButtons）

# *Items 内 JSX 动作组件
rg -n "<[A-Z][A-Za-z]+Action" apps/meteor/client/components/message/toolbar/items/*Items.tsx

# More 菜单 hook 调用（含 3 次 permalink）
rg -n "use[A-Za-z]+Action|useCopyAction|useWebDAV|usePermalink|useTranslate|useViewOriginal" \
  apps/meteor/client/components/message/toolbar/MessageToolbarActionMenu.tsx

# 显式 context 赋值（direct / message-mobile 不在结果中）
rg -n "context='(pinned|starred|mentions|search|direct|message-mobile)'" \
  apps/meteor/client --glob '*.tsx'
# → MentionsTab.tsx:40 mentions
#    MessageSearchTab.tsx:102 search
#    StarredMessagesTab.tsx:41 starred
#    PinnedMessagesTab.tsx:41 pinned

# 现行 atlas
git ls-files | rg -i 'atlas|feature-map|pm-feature'
# → 仅 atlassian-crowd-patched.d.ts 文件名误伤；docs/ 下无既有 atlas
rg -n -i 'atlas|feature-map|pm-feature' docs --glob '*.md'
# → 空（本文件写入前）
```

### 各表行数（禁止只报一个总合计）

| 表 | 行数 | 计数命令 |
| --- | --- | --- |
| A 跨 context 稳定 id | 26 | `rg -c '^\| msg\.' docs/qa/pm-feature-atlas/01-message-toolbar.md` 后按节切分；或对本节 `awk` 见表下验算 |
| B.message | 25 | 本节 `\| msg.` 行 |
| B.message-mobile | 26 | 本节 `\| msg.` 行 |
| B.threads | 24 | 本节 `\| msg.` 行 |
| B.videoconf | 15 | 本节 `\| msg.` 行 |
| B.videoconf-threads | 14 | 本节 `\| msg.` 行 |
| B.pinned | 5 | 本节 `\| msg.` 行 |
| B.direct | 4 | 本节 `\| msg.` 行 |
| B.starred | 8 | 本节 `\| msg.` 行 |
| B.mentions | 2 | 本节 `\| msg.` 行 |
| B.federated | 16 | 本节 `\| msg.` 行 |
| B.search | 2 | 本节 `\| msg.` 行 |
| C1 出处文件 | 26 | 本节 `\| msg.` 行 |
| C2 *Items 装配 | 11 文件 / 25 个 JSX 挂载 | `rg -n "<[A-Z][A-Za-z]+Action" ...*Items.tsx` 按文件 |

C2 算术：`4+5+4+2+2+1+1+1+1+3+1 = 25`（挂载次数，不是稳定 id）。

---

## 验算

手算表 A：图标 5（reaction, quote, thread.reply, forward, jump）+ More 内置 19（webdav, discussion, unpin, pin, star, unstar, permalink, follow, unfollow, unread, translate, original, reply.dm, copy, edit, delete, report, reaction.list, read-receipts）+ Apps 注入 2 = `5+19+2 = 26`。

手算表 B（可出现 id，含默认 Apps 四值）：

- message：图标 4 + 菜单 19 + apps 2 = `4+19+2 = 25`
- message-mobile：图标 5 + 菜单 19 + apps 2 = `5+19+2 = 26`
- threads：图标 4 + 菜单 18（无 discussion）+ apps 2 = `4+18+2 = 24`
- videoconf：图标 2 + 菜单 13（webdav, discussion, unpin, pin, star, unstar, permalink, follow, unfollow, delete, report, reaction.list, read-receipts）+ apps 0 = `2+13 = 15`
- videoconf-threads：图标 2 + 菜单 12（上列去掉 discussion）+ apps 0 = `2+12 = 14`
- pinned：图标 1 + 菜单 4（webdav, unpin, pin-registered, permalink-pinned）+ apps 0 = `1+4 = 5`
- direct：图标 1 + 菜单 3（webdav, unpin, pin）+ apps 0 = `1+3 = 4`
- starred：图标 1 + 菜单 5（webdav, star-registered, unstar, permalink-star, read-receipts）+ apps 2 = `1+5+2 = 8`
- mentions：图标 1 + 菜单 1（webdav）= `2`
- federated：图标 3 + 菜单 13（webdav, star, unstar, permalink, follow, unfollow, reply.dm, copy, edit, delete, report, reaction.list, read-receipts）+ apps 0 = `3+13 = 16`
- search：图标 1 + 菜单 1（webdav）= `2`

表 C1：`26` 与表 A 相同（一对一出处）。

表 C2：`4+5=9`；`9+4=13`；`13+2=15`；`15+2=17`；`17+1=18`；`18+1=19`；`19+1=20`；`20+1=21`；`21+3=24`；`24+1=25`。

客户端 context union：`message threads message-mobile pinned direct starred mentions federated videoconf search videoconf-threads` = **11**。`itemsByContext` 键 = **11**。`*Items.tsx` 文件 = **11**。三者对齐。

---

## 本分册 id 列表

1. `msg.reaction.add`
2. `msg.quote`
3. `msg.thread.reply`
4. `msg.forward`
5. `msg.jump`
6. `msg.webdav.save`
7. `msg.discussion.start`
8. `msg.pin`
9. `msg.unpin`
10. `msg.star`
11. `msg.unstar`
12. `msg.permalink.copy`
13. `msg.thread.follow`
14. `msg.thread.unfollow`
15. `msg.unread.mark`
16. `msg.translate`
17. `msg.translate.original`
18. `msg.reply.dm`
19. `msg.copy.text`
20. `msg.edit`
21. `msg.delete`
22. `msg.report`
23. `msg.reaction.list`
24. `msg.read-receipts`
25. `msg.apps.action`
26. `msg.apps.ai`

未拆分（内部 id 不同但用户后果相同）：`jump-to-message` / `jump-to-pin-message` / `jump-to-star-message` → `msg.jump`；`permalink` / `permalink-star` / `permalink-pinned` → `msg.permalink.copy`。

---

## 边界

本分册 **不填** 下列表面（即使消息工具栏入口会路过顶栏图标）：

- room toolbox 本身的房间级动作（搜索/钉选/收藏/提及/线程 tab 的打开只作为到达消息工具栏的前缀）
- user card、sidebar、composer（含 Timestamp picker、发送、附件、斜杠命令）
- navbar、Room Info kebab、drafts、drag-drop、键盘快捷键
- views / admin / omnichannel 专有工具条（含 moderation `MessageToolbarItem`）
- marketplace 每个具体 app 的按钮（只保留 `msg.apps.action` / `msg.apps.ai` 注入面）
- 消息体上已有反应的点击切换（非工具栏；同一 `POST /v1/chat.react` 但不在 toolbar items）

`direct` 与 `message-mobile` 已登记但 **无现行 Web 赋值**，不发明可回放路径。

---

## 与现行 atlas

`git ls-files | rg -i 'atlas|feature-map|pm-feature'` 与 `rg -n -i 'atlas|feature-map|pm-feature' docs --glob '*.md'` 在写入本文件前均为空（文件名误伤：`apps/meteor/definition/externals/atlassian-crowd-patched.d.ts`）。

baseline: empty

本分册新增 id（全部，各附出处）：

- `msg.reaction.add` — `ReactionMessageAction.tsx:25`
- `msg.quote` — `QuoteMessageAction.tsx:20`
- `msg.thread.reply` — `ReplyInThreadMessageAction.tsx:20`
- `msg.forward` — `ForwardMessageAction.tsx:16`
- `msg.jump` — `JumpToMessageAction.tsx:12`
- `msg.webdav.save` — `useWebDAVMessageAction.tsx:9`
- `msg.discussion.start` — `useNewDiscussionMessageAction.tsx:8`
- `msg.pin` — `usePinMessageAction.tsx:9`
- `msg.unpin` — `useUnpinMessageAction.ts:8`
- `msg.star` — `useStarMessageAction.ts:8`
- `msg.unstar` — `useUnstarMessageAction.ts:8`
- `msg.permalink.copy` — `usePermalinkAction.ts:10`
- `msg.thread.follow` — `useFollowMessageAction.ts:10`
- `msg.thread.unfollow` — `useUnFollowMessageAction.ts:10`
- `msg.unread.mark` — `useMarkAsUnreadMessageAction.ts:8`
- `msg.translate` — `useTranslateAction.ts:11`
- `msg.translate.original` — `useViewOriginalTranslationAction.ts:11`
- `msg.reply.dm` — `useReplyInDMAction.ts:12`
- `msg.copy.text` — `useCopyAction.ts:14`
- `msg.edit` — `useEditMessageAction.ts:9`
- `msg.delete` — `useDeleteMessageAction.ts:10`
- `msg.report` — `useReportMessageAction.tsx:15`
- `msg.reaction.list` — `useShowMessageReactionsAction.tsx:7`
- `msg.read-receipts` — `useReadReceiptsDetailsAction.tsx:8`
- `msg.apps.action` — `useMessageActionAppsActionButtons.ts:25`
- `msg.apps.ai` — `MessageToolbarStarsActionMenu.tsx:22`
