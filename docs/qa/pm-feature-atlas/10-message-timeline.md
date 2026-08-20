# 10 — 消息时间线正文（timeline body）

- 仓库：`https://github.com/jianwyao01/Rocket.Chat`（fork of RocketChat/Rocket.Chat）
- 调查分支：`cursor/pm-atlas-merge-blueprint-d43d` @ `d00d4c2e67`（基线 `develop` `e10bd504b9`）
- **不改产品代码。** 本分册只覆盖用户盯着的聊天时间线 **消息体 / 行内 chrome**，不是悬停工具栏（01），也不是 composer（03）。
- 诚实标记：`[读]` = 源码推断；`[待渲染实测]` = 未在真实 RC Web 客户端核对 role+name / 时序 / 可见性。
- 列约定：`触发后果三件套` = (1) DOM 出现/消失的元素 role+name (2) endpoint/method (3) 刷新后仍在什么。
- 本分册命名空间：`tl.*`（timeline）。一行 = 一个用户可感知交互。
- 工具栏 More 项（`msg.pin` / `msg.star` / `msg.reaction.list` / `msg.read-receipts` 等）**不重做**，只在「关联」列指向 01。正文上的同效果入口单独建 `tl.*`。
- 03 已登记的未读条 / 选择底栏 / 新消息 Bubble，本分册仍建 `tl.*`（时间线表面），并 **关联** `implicit.*`。

## 方法

挂载树（VERIFY）：

| 问题 | 结论 | 出处 |
| --- | --- | --- |
| 列表角色 | `VList` `role=list` `aria-label=Message_list` | `MessageList.tsx:258-265` |
| 普通消息 | `RoomMessage` `role=listitem` `aria-roledescription=message` | `RoomMessage.tsx:103-108` |
| 系统消息 | `MessageTypes.isSystemMessage` → `SystemMessage` `aria-roledescription=system_message` | `MessageList.tsx:297`；`SystemMessage.tsx:79-81` |
| 线程预览 | `isThreadMessage` 另挂 `ThreadMessagePreview` `role=link` `aria-roledescription=thread_message_preview`（主列表 **不**再渲染该条 `RoomMessage`） | `MessageList.tsx:298,84-96`；`ThreadMessagePreview.tsx:76-78` |
| 工具栏 | `MessageToolbarHolder` 仅非 `private`、非 `e2e==='pending'`、非选择模式；本分册不登记其按钮 | `RoomMessage.tsx:147` |
| 线程面板 | `ThreadMessage` 同身份点击；无选择 checkbox | `ThreadMessage.tsx:34-74` |

入口前缀约定（可回放）：

- `房间时间线` = 打开已订阅房间 → `role=list` `aria-label=Message_list`。
- `消息行` = 该列表中目标 `role=listitem`（普通消息 `aria-roledescription=message`）。
- `系统行` = `role=listitem` `aria-roledescription=system_message` `data-system-message-type=<t>`。
- `线程预览行` = 主列表里带 `tmid` 的回复预览 `role=link`。
- `悬停工具栏` / `More` = 01 前缀；本分册入口序列 **不**再写 More 菜单项。

系统消息类型（`packages/message-types`）：已注册且 `system:true` 的类型 **共用同一 `SystemMessage` 壳**——可点的只有作者名（开用户卡）、可选附件、可选 `actionLinks`。正文 `MessageTypes.text` **无 onClick**。动作不因 `t` 不同而分叉，故 **不按 uj/ul/au… 拆 id**。客户端 **未** 注册 `discussion-created`：`MessageTypes.isSystemMessage` 为假，服务端 `saveSystemMessage('discussion-created', …)` 的行走 `RoomMessage` + `DiscussionMetrics`（`createDiscussion.ts:33`；`MessageTypes.ts:25-27`）。`videoconf` 注册为 `system:false`，走普通消息 + UiKit 块。

---

## 表 A. 身份 / 头像 / 显示名

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.identity.avatar | 点消息头像打开用户卡 | `房间时间线→非 sequential 消息行→左侧 MessageAvatar` | `!sequential && message.u.username && !selecting && showUserAvatar`（偏好 `displayAvatars`）`RoomMessage.tsx:124`。选择模式头像换成 checkbox。系统行头像 **不可点**（无 onClick）`SystemMessage.tsx:90`。线程预览头像 **不可点** `ThreadMessagePreview.tsx:117-121`。[读] | (1) 出现 User_card [待渲染实测] dialog name。(2) `GET /v1/users.info`（`user.card.open`）。(3) 卡片是 popover，刷新关闭。[读] | `message.u.username`；`displayAvatars`；`sequential`；`selecting` | user.card.open | `RoomMessage.tsx:124-134`；`ThreadMessage.tsx:50-60` |
| tl.identity.display-name | 点消息头显示名打开用户卡 | `房间时间线→非 sequential 消息行→MessageNameContainer`（`aria-label=displayName`，`id={mid}-displayName`） | `!sequential` 才渲染 `MessageHeader` `RoomMessage.tsx:140`。`useButtonPattern` + `openUserCard` `MessageHeader.tsx:38,53-58`。偏好 `hideUsernames` 只给列表加 class `hide-usernames`，header 仍挂载 [待渲染实测] 点空白名是否仍开卡。 | (1) 同 User_card。(2) 同 `GET /v1/users.info`。(3) 刷新关闭。[读] | `message.u`；`UI_Use_Real_Name`；`hideUsernames`；`useUserDisplayName` | user.card.open；tl.identity.avatar | `MessageHeader.tsx:51-72` |
| tl.foreword.dm-user | 从 DM 时间线顶端对方标签跳到其 DM | `房间时间线滚到顶（无更早历史）→RoomForeword→对方 Tag` | 仅 `isDirectMessageRoom` 且 `usernames` 去掉自己后非空；`hasMorePreviousMessages===false` 才渲染 Foreword `MessageList.tsx:284-290` `RoomForeword.tsx:14-26`。公开频道只显示只读文案 `Start_of_conversation`。 | (1) 导航到 `href=router.getRoomRoute('d',{name})` [待渲染实测] Tag role。(2) 路由无独立 REST；`GET /v1/users.info` 填显示名 `RoomForewordUsernameListItem.tsx:13`。(3) 刷新落在该 DM。[读] | `room.usernames` `room.t`；当前 `user.username` | user.card.open；user.action.direct-message | `RoomForewordUsernameList.tsx:14-18`；`RoomForewordUsernameListItem.tsx:17` |

**A 计数**：3。`ls` `RoomMessage.tsx` + `MessageHeader.tsx` + `RoomForeword*.tsx`。

---

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

**B 计数**：8。`ls` gazzodown mentions/link/spoiler/code + `IgnoredContent.tsx`。

---

## 表 C. 反应条（消息体，非工具栏）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.reaction.toggle | 点已有 emoji 芯片切换自己的反应 | `消息行→反应条→aria-label=React_with__reaction__ 的芯片` | `message.reactions` 至少 1 个 key `RoomMessageContent.tsx:107`。mutation 要求已登录 `useToggleReactionMutation.ts:19-20`。**无** omnichannel 门（与工具栏 `msg.reaction.add` 不同）。自己已反应则 `mine` 样式。 | (1) 该芯片 `mine`/计数变化或整芯片消失 [待渲染实测] toolbar role+name。(2) `POST /v1/chat.react` `{messageId, reaction}` `useToggleReactionMutation.ts:15,23`。(3) 刷新后 `message.reactions` 仍反映 toggl 结果。[读] | `message._id` `reactions`；`uid`；endpoint `POST /v1/chat.react` | msg.reaction.add | `Reactions.tsx:29-39`；`Reaction.tsx:38-42` |
| tl.reaction.add | 从消息体「+」打开 picker 再加反应 | `消息行→反应条→title=Add_Reaction` | 反应条已渲染（已有 reactions）；`uid` 才真正打开 picker `MessageListProvider.tsx:111-116`。未登录 `useOpenEmojiPicker` 为空函数。 | (1) emoji picker 出现；选后芯片出现/计数+1 [待渲染实测] picker role。(2) `POST /v1/chat.react` `{messageId, reaction: emoji}` `:115`。(3) 刷新后该 emoji 仍在 `reactions`。[读] | 同 tl.reaction.toggle；`chat.emojiPicker` | msg.reaction.add | `Reactions.tsx:41`；`MessageListProvider.tsx:111-116` |
| tl.reaction.hover-users | 悬停芯片看谁反应了（不是 More→Reactions 模态） | `消息行→反应条→把指针停在芯片上`（mouseenter，不是 click） | 芯片存在。`showRealName` 且还有他人反应时 `GET /v1/chat.getMessage` 取 `reactions[].names` `ReactionTooltip.tsx:48-72`。仅自己反应则不请求。 | (1) tooltip 文案 `You_reacted_with` / `You_and_users_Reacted_with` / `Users_reacted_with` / `*_and_more_*` [待渲染实测] tooltip role；**不会**出现 `Users_reacted` 模态。(2) 需要真名时 `GET /v1/chat.getMessage` `{msgId}`。(3) tooltip 随 mouseleave 关；无持久状态。[读] | `message.reactions`；`UI_Use_Real_Name` | msg.reaction.list | `Reaction.tsx:45-64`；`ReactionTooltip.tsx:38-96` |

**C 计数**：3。芯片 **click=toggle**，**hover=名单**；与 `msg.reaction.list`（More→Reactions 模态、无 HTTP）不是同一入口。

---

## 表 D. 线程 / 讨论 / 广播

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.thread.view | 从主消息「View_thread」打开线程栏 | `房间时间线→线程主消息（isThreadMainMessage）→MessageMetricsReply 文案 View_thread` | `chat` 存在且 `isThreadMainMessage` `RoomMessageContent.tsx:109`。`__count__replies` / `__count__replies__date__` 标签 **不可点** `ThreadMetrics.tsx:55-61`。 | (1) URL `tab=thread` `context=mid`；线程 contextual bar 出现 [待渲染实测] 栏 name。(2) 无 REST；`router.navigate` `useGoToThread.ts:16-23`。(3) 刷新若 URL 仍含 tab/context 则栏仍在。[读] | `message.tcount` `tlm` `replies`；`Threads_enabled`（主消息字段仍在） | msg.thread.reply | `ThreadMetrics.tsx:43-52` |
| tl.thread.follow | 从线程 metrics 铃铛跟随/取消跟随 | `线程主消息→title=Following 或 Not_following 的铃铛` | 线程 metrics 已渲染。铃铛旁未读 badge 看 `unread`/`mention`/`all`（来自 `subscription.tunread*`）。 | (1) title 在 Following↔Not_following 间切换；toast 错时才出 [待渲染实测] 成功无 toast。(2) follow `POST /v1/chat.followMessage` `{mid}`；unfollow `POST /v1/chat.unfollowMessage` `{mid}` `useToggleFollowingThreadMutation.ts:19-31`。(3) 刷新后 `replies` 含/不含自己。[读] | `message.replies` `_id` `rid`；`uid` | msg.thread.follow；msg.thread.unfollow | `ThreadMetricsFollow.tsx:39-45` |
| tl.thread.preview.open | 点主列表线程回复预览进入线程 | `房间时间线→线程预览行 role=link` | `isThreadMessage` 且 `!isSelecting`。非 sequential：跳到父消息；sequential：跳到本回复 `ThreadMessagePreview.tsx:61-67`。选择模式改为勾选。 | (1) 同线程栏；search 可带 `?msg=`。(2) 无 REST；`useGoToThread`。父消息 `useParentMessage` 可能 `GET /v1/chat.getMessage`。(3) URL 保留则刷新仍在线程。[读] | `message.tmid` `_id` `rid` | msg.thread.reply；msg.jump | `ThreadMessagePreview.tsx:59-81` |
| tl.discussion.open | 从讨论计数/Reply 进入讨论房 | `房间时间线→带 drid 的消息→MessageMetricsReply 文案 message_counter 或 Reply` | `isDiscussionMessage` = `!!message.drid` `IMessage.ts:328`。含服务端 `t=discussion-created`（客户端未当系统消息）。`No_messages_yet` 时钟标签 **不可点** `DiscussionMetrics.tsx:33-36`。 | (1) 进入讨论房间 [待渲染实测] Reply 按钮 role。(2) 已订阅则路由；否则 `GET /v1/rooms.info` `useGoToRoom.ts:22-34`。(3) 刷新落在讨论房。[读] | `message.drid` `dcount` `dlm` | msg.discussion.start | `DiscussionMetrics.tsx:30-32`；`createDiscussion.ts:26-36` |
| tl.broadcast.reply | 广播房点他人消息的 Reply 去 DM 引用 | `广播房间时间线→他人消息行→MessageMetricsReply 文案 Reply` | `subscription.broadcast` 且 `message.u._id !== uid` 且作者有 username `RoomMessageContent.tsx:134`。自己的消息 **无** 此钮。 | (1) 路由到与作者的 DM，composer 带 `?reply=mid` [待渲染实测] 引用条。(2) 点击无 REST；`roomCoordinator.openRouteLink('d',{name:username},{reply})` `replyBroadcast.ts:9-16`。(3) 刷新若 URL 仍含 reply 则引用仍在。[读] | `subscription.broadcast`；`message.u.username` `_id` | msg.reply.dm；msg.quote | `BroadcastMetrics.tsx:17-26` |

**D 计数**：5。参与者头像 `ThreadMetricsParticipants` **不可点**。

---

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

**E 计数**：24。

---

## 表 F. URL unfurl / oembed

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.url.collapse | 折叠/展开链接预览 | `消息行→文案 Link_Preview 旁 title=Collapse/Uncollapse` | `API_Embed`（`apiEmbedEnabled`）且 `message.urls` 能抽出 preview `RoomMessageContent.tsx:94` `MessageListProvider.tsx:46`。headers 预览初始折叠当 `!autoLoadEmbedMedia` `UrlPreview.tsx:12`。oembed 走 `MessageCollapsible`。 | (1) 预览主体消失/出现。(2) 无 REST（meta 已在消息上）。(3) 刷新按 autoLoad 重算。[读] | `API_Embed`；`message.urls`；autoLoadEmbedMedia | tl.attach.collapse | `UrlPreview.tsx:17-21`；`OEmbedCollapsible.tsx:14-16` |
| tl.url.image.lightbox | 点 headers 图片预览开单图灯箱 | `消息行→Link_Preview 展开→img.preview-image` | headers content-type `image/*` `UrlPreviews.tsx:57-58`。 | (1) 单图 `ImageGallery`（`setSingleImageUrl`）[待渲染实测] 与房间图库是否同一 dialog name。(2) 无 `rooms.images`。(3) 关后不持久。[读] | `urls[].headers.contentType` | tl.attach.image.lightbox | `UrlImagePreview.tsx:11`；`ImageGalleryProvider.tsx:22-23` |
| tl.url.audio | 播放 URL 音频预览 | `消息行→Link_Preview 展开→AudioPlayer` | headers `audio/*`。 | (1) 原生/Fuselage 播放器 [待渲染实测] name。(2) GET 该 URL。(3) 不持久。[读] | `urls[].url` | tl.attach.audio.toggle | `UrlAudioPreview.tsx:7` |
| tl.url.video | 播放 URL 视频预览 | `消息行→Link_Preview 展开→video[controls]` | headers `video/*`。 | (1) 原生 video 控件。(2) GET 该 URL。(3) 不持久。[读] | 同左 | tl.attach.video.controls | `UrlVideoPreview.tsx:4-8` |
| tl.oembed.open | 打开 oembed 标题/封面外链 | `消息行→oembed 标题 MessageGenericPreviewTitle` 或封面 `ExternalLink` | `urls[].meta` 能 `normalizeMeta` 且 `isValidPreviewMeta`。type `rich`/`video` 还嵌入净化后的 iframe `OEmbedHtmlPreview.tsx:21`。type `photo` 封面图 **无** click handler `OEmbedImagePreview.tsx:8`。 | (1) 新标签打开 `meta` url；或 iframe 内交互 [待渲染实测] iframe 可访问名。(2) 无 RC endpoint。(3) 无。[读] | `urls[].meta` | tl.body.link.external | `OEmbedPreviewContent.tsx:22-25`；`OEmbedLinkPreview.tsx:10-12` |

**F 计数**：5。正文 **无**「忽略此预览」控件（全 `client` 无 ignore-preview / API_EmbedDisabled 入口）。

---

## 表 G. 系统消息（共享动作）

已注册 `system:true` 类型（动作相同，不拆 id）：`uj` `ul` `r` `au` `ui` `uir` `added-user-to-team` `ru` `removed-user-from-team` `ult` `user-converted-to-team` `user-converted-to-channel` `user-removed-room-from-team` `user-deleted-room-from-team` `user-added-room-to-team` `ujt` `ut` `wm` `rm` `user-muted` `user-unmuted` `user-banned` `user-unbanned` `subscription-role-added` `subscription-role-removed` `room-archived` `room-unarchived` `room-removed-read-only` `room-set-read-only` `room-allowed-reacting` `room-disallowed-reacting` `room_changed_privacy` `room_changed_topic` `room_changed_avatar` `room_changed_announcement` `room_changed_description` `message_pinned` `abac-removed-user-from-room`；E2EE：`room_e2e_enabled` `room_e2e_disabled` `message_pinned_e2e`；omnichannel：`omnichannel_placed_chat_on_hold` `omnichannel_on_hold_chat_resumed` `omnichannel_priority_change_history` `omnichannel_sla_change_history`；livechat：`livechat-started` `livechat-close` `livechat_video_call` `livechat_navigation_history` `livechat_transfer_history` `livechat_transfer_history_fallback` `livechat_transcript_history`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.sys.actor | 点系统消息作者名打开用户卡 | `系统行→MessageNameContainer（显示名，可带 @username）` | 所有已注册系统类型共用。`!isSelecting`。头像 **不可点** `SystemMessage.tsx:90`。正文 `aria-roledescription=system_message_body` **不可点**。 | (1) User_card。(2) `GET /v1/users.info`。(3) 刷新关闭。[读] | `message.u`；`message.t` | user.card.open；tl.identity.display-name | `SystemMessage.tsx:65,95-103` |

**G 计数**：1。`message_pinned` 若带 attachments，走表 E（同一 Attachments 树）。`actionLinks` 走 `tl.action.link`。

---

## 表 H. E2EE 占位（替换整条时间线或单条正文）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.e2ee.save-password | 加密房要求先保存 E2EE 密码 | `打开加密房且 e2eeState===SAVE_PASSWORD→StatesAction 文案 Save_E2EE_password` | `RoomE2EESetup` 替换 `RoomBody` `RoomE2EESetup.tsx:31-40`。需 `STORAGE_KEYS.E2EE_RANDOM_PASSWORD`。 | (1) 时间线不出现；States 标题 `__roomName__is_encrypted`；点后保存密码模态 [待渲染实测] modal name。(2) 本地 `e2e.openSaveE2EEPasswordModal`；无 chat REST。(3) 存完刷新进时间线。[读] | E2EE state；`room.name` | room.toolbox.e2e | `RoomE2EESetup.tsx:21-40`；`RoomE2EENotAllowed.tsx:41-48` |
| tl.e2ee.enter-password | 输入 E2EE 密码才能看时间线 | `打开加密房且 e2eeState===ENTER_PASSWORD→StatesAction 文案 Enter_your_E2E_password` | `RoomE2EESetup.tsx:43-52`。 | (1) 时间线不出现；点后解码私钥流 [待渲染实测]。(2) `e2e.decodePrivateKeyFlow`。(3) 成功后刷新可见消息。[读] | E2EE state | tl.e2ee.save-password | `RoomE2EESetup.tsx:29,43-52` |
| tl.e2ee.back-home | 从 E2EE 阻断页回首页 | `SAVE_PASSWORD 或 ENTER_PASSWORD 页→role=link 文案 Back_to_home` | 仅 `action` 有值时渲染（WAITING_KEYS **无**此钮）`RoomE2EENotAllowed.tsx:41-45`。 | (1) 导航 `/home`。(2) 无 REST。(3) 刷新在 home。[读] | — | route 见 04 | `RoomE2EENotAllowed.tsx:31-45` |
| tl.e2ee.learn-more | 打开 E2EE 文档外链 | `任一 E2EE States 页→StatesLink 文案 Learn_more_about_E2EE` | 三态都渲染（含 WAITING_KEYS）。 | (1) 新标签 `links.go.e2eeGuide`。(2) 无 RC endpoint。(3) 无。[读] | docs URL | tl.e2ee.enter-password | `RoomE2EENotAllowed.tsx:51-53` |

**H 计数**：4。单条 `e2e==='pending'` 只显示只读文案 `E2E_message_encrypted_placeholder`（`aria-roledescription=message_body`），**无点击**，见「验过无点击」。`WAITING_KEYS` 替换时间线但 **无** 主按钮，仅 Learn_more。源码 **无**「decrypt failed」消息体占位。

---

## 表 I. 时间线 chrome（未读 / 新消息 / 历史）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.unread.jump | 点未读条跳到第一条未读 | `房间时间线上方 Bubble 文案 unread_messages_counter（icon=arrow-up）→点气泡本体` | `unread.count>0` 且已订阅 `RoomBody.tsx:177-182`。 | (1) 条消失；列表滚到该消息；URL `?msg=` `jumpToUnread` [待渲染实测] 高亮 name。(2) `readStateManager.markAsRead()`（订阅已读）。(3) 刷新后未读计数按 server ls。[读] | `subscription.ls`；`RoomHistoryManager.firstUnread` | implicit.unread.jumpToFirst；msg.jump | `UnreadMessagesIndicator.tsx:23-29`；`useUnreadMessages.ts:61-78` |
| tl.unread.mark-read | 关掉未读条并标已读（不跳转） | `未读 Bubble→dismiss title/aria-label=Mark_as_read` | 同左。 | (1) 条消失，不改 `?msg=`。(2) `markAsRead()`。(3) 刷新无未读条。[读] | 同左 | implicit.unread.markAllRead | `UnreadMessagesIndicator.tsx:25-27`；`useUnreadMessages.ts:80-83` |
| tl.chrome.new-messages | 不在底部时跳到刚到的新消息 | `列表未贴底且他人发来新消息→底部 Bubble 文案 New_messages` | `hasNewMessages && !atBottom`；自己的消息会直接贴底 `useHasNewMessages.ts:50-62`。 | (1) Bubble 淡出；列表贴底；composer focus。(2) 无 REST。(3) 状态不持久。[读] | streamNewMessage | implicit.scroll.newMessagesButton | `RoomBody.tsx:187`；`JumpToRecentMessageButton.tsx:46-54` |
| tl.chrome.jump-recent | 从历史夹缝跳回最新页 | `hasMoreNextMessages（从中间 ?msg= 跳入）→底部 Bubble 文案 Jump_to_recent_messages` | `RoomHistoryManager.hasMoreNext` `RoomBody.tsx:188-191`。 | (1) Bubble 淡出；历史 clear 后贴底。(2) `RoomHistoryManager.getMoreIfIsEmpty(rid)`。(3) 最新页刷新可见。[读] | hasMoreNext | implicit.scroll.jumpToRecent | `useHasNewMessages.ts:31-35` |
| tl.history.load-older | 向上滚加载更早历史 | `房间时间线→滚轮/触控/PageUp 等到顶部约 1/3` | `hasMorePreviousMessages`；须先有用户滚动交互（observer 不自动连拉）`useGetMore.ts:49-50,68-74`。无独立点击控件。列表顶 `load-more` 仅 loading 指示。 | (1) 更早 `listitem` 出现；可能 `LoadingMessagesIndicator`。(2) `RoomHistoryManager.getMore`。(3) 刷新重拉。[读] | RoomHistoryManager | implicit.scroll.loadPrevious；shortcut.history.loadMore | `useGetMore.ts:49-62` |
| tl.history.load-newer | 向下滚加载更新历史 | `已跳到中间历史→滚到底` | `hasMoreNext` `useGetMore.ts:63-64`。 | (1) 更新 listitem 出现。(2) `RoomHistoryManager.getMoreNext`。(3) 刷新重拉。[读] | hasMoreNext | shortcut.history.loadMore | `useGetMore.ts:63-64` |

**I 计数**：6。日期分隔 `Bubble` / `Unread_Messages` divider / 浮动 `BubbleDate` **不可点**（`MessageListItem.tsx:64-70`；`BubbleDate.tsx:17-19`；03 已记）。

---

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

**J 计数**：8。时间线 **没有** 批量 pin/star/delete；唯一批量动作是导出栏这三套。

---

## 表 K. 消息内按钮 / UiKit

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| tl.action.link | 点消息/系统行 actionLinks 按钮 | `消息行或系统行→Button data-method-id` 文案 `t(i18nLabel)` 或 `label` | `message.actionLinks.length`。embedded 只 `fireGlobalEvent('click-action-link')`。非 embedded 需 `actionLinks.actions` 已 `register`；**develop 客户端 0 处 register**，点击会 `error-invalid-actionlink` [读]。 | (1) 已注册则跑 handler；未注册抛错 toast [待渲染实测]。(2) 视 handler；embedded 无 REST。(3) 视 handler。[读] | `actionLinks[]` `method_id` | tl.uikit.block | `MessageActions.tsx:24-36`；`actionLinks.ts:12-36` |
| tl.uikit.block | 点 Apps UiKit 消息块控件 | `消息行→blocks 内按钮/选择` | `message.blocks` `RoomMessageContent.tsx:90-91`。默认 `emitInteraction`。 | (1) app 自绘 UiKit 更新/模态 [待渲染实测] 运行时 name。(2) `POST /apps/ui.interaction/${appId}` `{type:'blockAction', actionId, payload:{blockId,value}, container:{type:'message',id:mid}, rid, mid}` `useMessageBlockContextValue.ts:64-77`。(3) 视 app。[读] | `message.blocks`；appId | msg.apps.action | `UiKitMessageBlock.tsx:15-26` |
| tl.uikit.videoconf.join | 点 videoconf 块加入通话 | `videoconf 消息→块内 join` | `appId==='videoconf-core'` 且 `actionId==='join'`。calling/ringing 时 no-op `useMessageBlockContextValue.ts:28-30,46-50`。 | (1) 加入会议 UI [待渲染实测]。(2) `joinCall(blockId)`（非 apps interaction）。(3) 会议记录见 Calls。[读] | videoconf-core | room.toolbox.start-video-call | `useMessageBlockContextValue.ts:46-50` |
| tl.uikit.videoconf.callback | 点 videoconf 块回拨 | `videoconf 消息→块内 callBack` | `actionId==='callBack'`。 | (1) outgoing 弹层 [待渲染实测]。(2) capabilities + `dispatchPopup({rid:blockId})`。(3) 同通话。[读] | videoconf-core | room.toolbox.start-video-call | `useMessageBlockContextValue.ts:53-55` |
| tl.uikit.media-call.history | 从媒体通话块打开通话历史 | `消息行→块内 open-history` | `appId==='media-call-core'` `actionId==='open-history'`。 | (1) toolbox tab `media-call-history` `context=blockId` [待渲染实测]。(2) 无该点击的 REST。(3) URL tab 刷新可重开。[读] | media-call-core | room.toolbox.start-voice-call | `useMessageBlockContextValue.ts:58-61` |

**K 计数**：5。仓库 **无** 独立 Poll 时间线组件；投票/表单若存在，走 `message.blocks` → `tl.uikit.block`。

---

## 布局差（改动作，不单列空点击）

| 现象 | 对动作的影响 | 出处 |
| --- | --- | --- |
| `sequential`（同作者、间隔 &lt; `Message_GroupingPeriod` 秒、非新的一天、非系统、非 `groupable===false`） | **去掉** `tl.identity.avatar` / `tl.identity.display-name`；左侧只留只读 `StatusIndicators`。时间戳仍在非 sequential 的 header。**没有**「点分组展开用户名」的控件。 | `isMessageSequential.ts:7-35`；`RoomMessage.tsx:124,137-140` |
| `data-own`（`message.u._id===uid`） | 广播 `tl.broadcast.reply` **不出现**。提及自己 `variant=critical`。只读勾 `ReadReceiptIndicator` 仍可出现。 | `RoomMessage.tsx:119`；`RoomMessageContent.tsx:134` |
| 偏好 `displayAvatars=false` | 头像不渲染，无 `tl.identity.avatar`；线程 metrics 参与者改数字。 | `MessageList.tsx:210`；`ThreadMetricsParticipants.tsx:18-29` |
| 偏好 `hideUsernames` | 列表 class `hide-usernames`；header 仍挂 [待渲染实测] 名是否可点。 | `RoomBody.tsx:199-203` |
| 联邦房间 | 同一套 body 组件。已读勾：`Message_Read_Receipt_Enabled && (!federated \|\| Federation_Service_EDU_Process_Receipt)` `MessageListProvider.tsx:41-44`。工具栏差见 01。 | `MessageListProvider.tsx:41-44` |
| Omnichannel / livechat | 同一 `RoomMessage`。**多**系统 `t`（动作仍是 `tl.sys.actor`）。正文反应芯片 **无** livechat 门（工具栏 `msg.reaction.add` 有）。 | `RoomMessageContent.tsx:107`；01 `ReactionMessageAction` |
| 自己 vs 他人 | 除广播 Reply、提及颜色外，正文控件不因 own 再分叉。 | — |
| 线程面板 vs 主列表 | 面板用 `ThreadMessage`（头像/名可点）；主列表线程回复只显示预览行。 | `ThreadMessage.tsx` vs `ThreadMessagePreview.tsx` |

---

## 验过无点击（MUST 项已核对）

这些是用户能看见、但源码 **没有** onClick / button 的时间线元素。不计入功能行。

| 元素 | i18n / aria | 结论 | 关联 | 出处 |
| --- | --- | --- | --- | --- |
| 编辑指示 | `title=Message_has_been_edited_at` / `Message_has_been_edited_by_at`（他人代编 danger 色） | 只读 | msg.edit | `StatusIndicators.tsx:32-44` |
| 钉选指示 | `title=Message_has_been_pinned` | 只读 | msg.pin | `StatusIndicators.tsx:46` |
| 星标指示 | `title=Message_has_been_starred` | 只读 | msg.star | `StatusIndicators.tsx:50` |
| 已读勾 | `role=status` `aria-label=Message_sent` 或 `Message_viewed`；`id={mid}-read-status` | 只读；详情走工具栏 | msg.read-receipts | `ReadReceiptIndicator.tsx:14-23` |
| 翻译/跟随/邮件/钥匙 | `Translated` / `Following` / `Message_sent_by_email` / key 无 title | 只读 | msg.translate；msg.thread.follow | `StatusIndicators.tsx:27-48` |
| 私信条 | `Only_you_can_see_this_message` | 只读；且隐藏工具栏 | — | `MessageHeader.tsx:77` |
| 线程「N replies」 | `__count__replies` / `__count__replies__date__` `title=Last_message__date__` | 只读；可点的是 View_thread | tl.thread.view | `ThreadMetrics.tsx:55-61` |
| 讨论时钟 | `No_messages_yet` 或相对时间 | 只读 | tl.discussion.open | `DiscussionMetrics.tsx:33-36` |
| 日期分隔 / 未读 divider / BubbleDate | `Unread_Messages`；日期 Bubble | 只读 | — | `MessageListItem.tsx:64-70`；`BubbleDate.tsx:17-19` |
| sequential 空位 | 无用户名/头像 | **无**点击展开 | tl.identity.* | `RoomMessage.tsx:124,140` |
| E2EE pending 正文 | `E2E_message_encrypted_placeholder` | 只读；工具栏也隐藏 | tl.e2ee.* | `RoomMessageContent.tsx:54-57`；`RoomMessage.tsx:147` |
| E2EE WAITING_KEYS | `Check_back_later` / `__roomName__encryption_keys_need_to_be_updated` | 无主按钮 | tl.e2ee.learn-more | `RoomE2EESetup.tsx:55-62` |
| decrypt failed | — | **消息体不存在** 该占位 | — | 全 `client/components/message` 无匹配 |
| @all / @here | `Mentions_all_room_members` / `Mentions_online_room_members` | 高亮不可点 | — | `UserMentionElement.tsx:24-37` |
| oembed photo 封面 | 封面图 | 无 onClick | tl.oembed.open | `OEmbedImagePreview.tsx:8` |
| URL ignore | — | **不存在** | — | — |
| 独立 Poll 组件 | — | **不存在**（用 UiKit） | tl.uikit.block | — |

---

## 边界

- 悬停工具栏 / More / AI_Actions：01（`msg.*`）。
- Composer、草稿、拖放上传、录音条：03。
- Room toolbox 打开 Export：02 `room.toolbox.export-messages`（本分册只记进入后的时间线后果）。
- User card 内动作：02 `user.*`。
- 路由壳：04。
- Marketplace 每个 app 的具体块标签：只留 `tl.uikit.block`。
- `actionLinks.register` 的具体 livechat/jitsi handler：客户端 0 注册，不发明。

---

## 待渲染实测

1. User_card / 线程栏 / Export dialog 的精确 role+name（Fuselage）。
2. `hide-usernames` 时 `tl.identity.display-name` 是否仍可点。
3. 反应芯片 toggle 后 `mine` 与计数的可访问名。
4. 图库 Next/Previous 与左右 chevron class 对调后的实际方向。
5. 单图 `preview-image` 灯箱与房间图库是否同一 `aria-label=Image_gallery`。
6. 音频/视频原生控件的无障碍名。
7. `tl.action.link` 在无 register 时的错误 toast 文案。
8. 选择模式第一个 checkbox 是否自动获焦（03 已列，本分册复用）。
9. 广播 Reply 进入 DM 后引用条 name。
10. oembed iframe（YouTube 等）内部控件不在 RC i18n。
11. `discussion-created` 行在真实数据里是否同时显示讨论名正文 + `message_counter`。
12. 联邦时间线除已读勾外是否还有只在运行时出现的 body 控件。

---

## 验算

各表功能行（`rg -c '^\| tl\.'` 分段，或按下式手算）：

| 节 | 行 | 式 |
| --- | --- | --- |
| A 身份 | 3 | avatar + displayName + foreword |
| B 正文 | 8 | mention2 + link2 + image + spoiler + copy + ignored |
| C 反应 | 3 | toggle + add + hover |
| D 线程/讨论/广播 | 5 | view + follow + preview + discussion + broadcast |
| E 附件 | 24 | collapse+download+load+retry+lightbox + gallery6 + audio3 + video + file + quote3 + default2 + action2 + location |
| F URL | 5 | collapse + image + audio + video + oembed.open |
| G 系统 | 1 | actor |
| H E2EE | 4 | save + enter + back-home + learn-more |
| I chrome | 6 | unread2 + new + jump-recent + load-older + load-newer |
| J 选择 | 8 | enter+toggle+all+clear+cancel + export3 |
| K 块 | 5 | action.link + uikit + vc.join + vc.callback + media-history |

验算：`3+8=11`；`11+3=14`；`14+5=19`；`19+24=43`；`43+5=48`；`48+1=49`；`49+4=53`；`53+6=59`；`59+8=67`；`67+5=72`。

命令：`rg -c '^\| tl\.' docs/qa/pm-feature-atlas/10-message-timeline.md` → **72**。去重：`rg -o '^\| tl\.[a-z0-9.-]+' docs/qa/pm-feature-atlas/10-message-timeline.md | sort -u | wc -l` → **72**。

---

## 与现行 atlas

本分册 **新增** 72 个 `tl.*`。与 01–04 **无 id 字符串碰撞**（`msg.*` / `room.*` `user.*` / `composer.*` `implicit.*` / `route.*`）。

等价动作（关联，不合并）：

- `tl.reaction.toggle` / `tl.reaction.add` ↔ `msg.reaction.add`（同一 `POST /v1/chat.react`）
- `tl.reaction.hover-users` ≠ `msg.reaction.list`（tooltip vs 模态）
- `tl.thread.view` / `tl.thread.preview.open` ↔ `msg.thread.reply`
- `tl.thread.follow` ↔ `msg.thread.follow` / `msg.thread.unfollow`
- `tl.broadcast.reply` ↔ `msg.reply.dm`
- `tl.quote.jump` ↔ `msg.jump`
- `tl.unread.*` / `tl.chrome.*` / `tl.history.*` / `tl.select.*` ↔ 03 `implicit.*`
- `tl.identity.*` / `tl.body.mention.user` / `tl.sys.actor` ↔ `user.card.open`
- 钉/星/已读勾 **无** body 点击 ↔ `msg.pin` / `msg.star` / `msg.read-receipts`
