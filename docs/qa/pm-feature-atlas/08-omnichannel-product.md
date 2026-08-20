# 分册 08 — Omnichannel 产品交互（坐席 / 经理 / 访客 widget）

本文件把全渠道当成**产品**写，不是侧栏登记。04 只留了 `route.omnichannel`；02 只留了顶栏入口 `nav.omnichannel.queue` `nav.omnichannel.contact` `nav.omnichannel.agent-toggle` 与 filter/toolbox 开口。本册展开用户可感知控件。不改产品代码。未挂真实 UI；源码推断标 `[读]`，界面可见性标 `[待渲染实测]`。

**id 命名空间：** `omni.agent.*` `omni.manager.*` `omni.widget.*`。

**列约定（八列，与 00/01 契约一致）：**

| 列 | 含义 |
|---|---|
| 稳定语义 id | 本册唯一 |
| 功能一句话 | 用户能完成的一件事 |
| 完整入口点击序列 | 从可见控件到动作；可复放 |
| 门控 | 权限 / 设置 / 许可证，带 `file:line` |
| 触发后果三件套 | (1) DOM role+name 出现/消失 (2) endpoint (3) 刷新后仍在什么 |
| 供给 | **READ** 的设置/权限/路由参数/接口/上下文；许可证只写在门控 |
| 关联 | 已知 atlas id；不假装未入库的行 |
| 出处 | `path:line` + `[读]` |

禁止空行、占位行、未读源码的臆造入口。第三方 App 字段、Workspace Settings.json 972 字段不在本册。`nav.omnichannel.agent-toggle` **不重写入口行**，只展开后果与拒绝态。

---

## 0. 侧栏 / 路由枚举（先于表体）

调查日 2026-08-20，工作区 `apps/meteor`。

```bash
rg -c "i18nLabel:" apps/meteor/client/views/omnichannel/sidebarItems.tsx
# 13

rg -c "i18nLabel:" apps/meteor/app/livechat-enterprise/client/views/livechatSideNavItems.ts
# 7

rg -c "registerOmnichannelRoute\(" apps/meteor/client/views/omnichannel/routes.ts
# 20

find apps/meteor/client/views/omnichannel -type f | wc -l
# 480

ls -1 packages/livechat/src/routes
# Chat  ChatFinished  GDPRAgreement  LeaveMessage  Register  SwitchDepartment  TriggerMessage
```

CE 侧栏 13（`sidebarItems.tsx`，每项 `href` + `i18nLabel` + `permissionGranted`）：

| # | href | i18nLabel | 权限 |
|---|---|---|---|
| 1 | `/omnichannel/current` | `Contact_Center` | `view-omnichannel-contact-center` `:14` |
| 2 | `/omnichannel/analytics` | `Analytics` | `view-livechat-analytics` `:20` |
| 3 | `/omnichannel/realtime-monitoring` | `Real_Time_Monitoring` | `view-livechat-real-time-monitoring` `:26` |
| 4 | `/omnichannel/managers` | `Managers` | `manage-livechat-managers` `:32` |
| 5 | `/omnichannel/agents` | `Agents` | `manage-livechat-agents` `:38` |
| 6 | `/omnichannel/departments` | `Departments` | `view-livechat-departments` `:44`（路由更严，见下） |
| 7 | `/omnichannel/customfields` | `Custom_Fields` | `view-livechat-customfields` `:50` |
| 8 | `/omnichannel/triggers` | `Livechat_Triggers` | `view-livechat-triggers` `:56` |
| 9 | `/omnichannel/installation` | `Livechat_Installation` | `view-livechat-installation` `:62` |
| 10 | `/omnichannel/appearance` | `Livechat_Appearance` | `view-livechat-appearance` `:68` |
| 11 | `/omnichannel/webhooks` | `Webhooks` | `view-livechat-webhooks` `:74` |
| 12 | `/omnichannel/businessHours` | `Business_Hours` | `view-livechat-business-hours` `:80` |
| 13 | `/omnichannel/security-privacy` | `Security_and_privacy` | `view-privileged-setting` OR `edit-privileged-setting` OR `manage-selected-settings` `:86` |

EE 侧栏 7（`livechatSideNavItems.ts`；缺 `livechat-enterprise` 时这 7 项不应出现，`[待渲染实测]`）：

| # | href | i18nLabel | 权限 |
|---|---|---|---|
| 14 | `/omnichannel/reports` | `Reports` | `view-livechat-reports` `:8` |
| 15 | `/omnichannel/monitors` | `Livechat_Monitors` | `manage-livechat-monitors` `:15` |
| 16 | `/omnichannel/units` | `Units` | `manage-livechat-units` `:22` |
| 17 | `/omnichannel/canned-responses` | `Canned_Responses` | `manage-livechat-canned-responses` `:29` |
| 18 | `/omnichannel/tags` | `Tags` | `manage-livechat-tags` `:36` |
| 19 | `/omnichannel/sla-policies` | `SLA_Policies` | `manage-livechat-sla` `:43` |
| 20 | `/omnichannel/priorities` | `Priorities` | `manage-livechat-priorities` `:50` |

坐席独立路由（非管理侧栏）：`/omnichannel-directory`、`/livechat-queue`（`startup/routes.tsx:168-183`）。`/omnichannel/current` 与 `/omnichannel-directory` **共用** `OmnichannelDirectoryRouter`。index `/omnichannel` replace 到 `omnichannel-current-chats`（`OmnichannelRouter.tsx:16-24`）。

全局门：工作区可见 `view-l-room` + `Livechat_enabled`（`OmnichannelProvider.tsx:45-58`）。MAC 超限 `useShouldPreventAction('monthlyActiveContacts')`。

---

## 1. 坐席工作台 `omni.agent.*`

入口前缀：`顶栏右→Omnichannel`（组：`useOmnichannelEnabled`）；V2 `主侧栏顶 tablist Omnichannel_filters`；live 房间 `/live/:id`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
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

坐席表 **39** 行。

---

## 2. 经理控制台 `omni.manager.*`

入口前缀：`顶栏 Manage→Omnichannel`（菜单 `view-livechat-manager`，04 `route.omnichannel`）→ 侧栏项。13 个 CE href **均有页级 CRUD/筛/存**；EE 7 项同样。Departments 侧栏 `view-livechat-departments` 但路由 `manage-livechat-departments`（`DepartmentsRoute.tsx:7`）。

### 2.1 Contact_Center `/omnichannel/current`

与 `/omnichannel-directory` 同组件。入口序列用经理侧栏。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
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

**诚实：** 本页**没有**经理关单按钮；关单走 live 房 `omni.agent.close`。

### 2.2 Analytics `/omnichannel/analytics`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.analytics.open` | 打开分析页（会话/产能总览+图+坐席表） | 侧栏 `Analytics` | 侧栏 `view-livechat-analytics` `sidebarItems.tsx:20`；**路由不再检** | (1) `Type`/`Departments`/`Start`/`End`/`Chart` `[待渲染实测]`。(2) `GET /v1/livechat/analytics/overview` `Overview.tsx:32`；图 `.../dashboards/charts-data` `InterchangeableChart.tsx:58`；坐席 `.../agent-overview` `AgentOverview.tsx:36`。(3) 只读。[读] | `departmentId` `start` `end` `onlyMyDepartments` | `omni.manager.realtime.open` | `AnalyticsPage.tsx` `routes.ts:173-176` `[读]` |
| `omni.manager.analytics.filter` | 改类型/部门/日期/图并重拉 | `Type`=`Conversations`/`Productivity`；`Departments`；日期或 `Date_range_presets`；`Chart` | 同 open | (1) 卡片/图重绘 `[待渲染实测]`。(2) 同上 GET 带新参。(3) 客户端状态，刷新回默认。[读] | 预设 Today/Yesterday 等 `DateRangePicker.tsx:72-144` | `omni.manager.analytics.open` | `AnalyticsPage.tsx:65-72` `[读]` |

### 2.3 Real_Time_Monitoring `/omnichannel/realtime-monitoring`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.realtime.open` | 打开实时监控墙 | 侧栏 `Real_Time_Monitoring` | `view-livechat-real-time-monitoring` `sidebarItems.tsx:26` | (1) 多图+数字 `[待渲染实测]`。(2) 轮询：`.../conversation-totalizers` `.../charts/chats` `.../chats-per-agent` `.../chats-totalizers` `.../charts/agents-status` `.../chats-per-department` `.../agents-productivity-totalizers` `.../charts/timings` `.../productivity-totalizers`。(3) 只读快照。[读] | `departmentId` | `omni.manager.analytics.open` | `RealTimeMonitoringPage.tsx` `routes.ts:168-171` `[读]` |
| `omni.manager.realtime.filter` | 改部门或刷新间隔 | `Departments`（`All`）或 `Update_every`（5/10/30/60 秒或分） | 同 open | (1) 间隔后图刷新 `[待渲染实测]`。(2) invalidate `omnichannelQueryKeys.analytics.all` `:35-37`。(3) 间隔不落库。[读] | interval | `omni.manager.realtime.open` | `RealTimeMonitoringPage.tsx:47-81` `[读]` |

### 2.4 Managers `/omnichannel/managers`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.managers.open` | 打开经理角色表 | 侧栏 `Managers` | `manage-livechat-managers` `sidebarItems.tsx:32` `ManagersRoute.tsx:10-13` | (1) 表+`Add_manager` `[待渲染实测]`。(2) `GET /v1/livechat/users/manager` `ManagersTable.tsx:49`。(3) URL `/omnichannel/managers`。[读] | 分页 | `omni.manager.agents.open` | `ManagersRoute.tsx` `[读]` |
| `omni.manager.managers.search` | 搜经理 | `Search` / 列头 Name Username Email | 同 open | (1) 行过滤 `[待渲染实测]`。(2) GET 带 text/sort。(3) 不写库。[读] | text | `omni.manager.managers.open` | `ManagersTable.tsx:49` `[读]` |
| `omni.manager.managers.add` | 按用户名加经理 | `Username` → `Add_manager` | 同 open | (1) 新行；toast `Manager_added` `[待渲染实测]`。(2) `POST /v1/livechat/users/manager` `AddManager.tsx:21`。(3) 刷新仍在。[读] | username | `omni.manager.managers.remove` | `AddManager.tsx:21` `[读]` |
| `omni.manager.managers.remove` | 撤经理 | 行 `Remove` → `Delete` | 同 open | (1) 行消失；toast `Manager_removed` `[待渲染实测]`。(2) `DELETE /v1/livechat/users/manager/:_id` `RemoveManagerButton.tsx:17`。(3) 刷新后不在。[读] | `_id` | `omni.manager.managers.add` | `RemoveManagerButton.tsx:17` `[读]` |

### 2.5 Agents `/omnichannel/agents`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.agents.open` | 打开坐席表 | 侧栏 `Agents` | `manage-livechat-agents` `sidebarItems.tsx:38` `AgentsPage.tsx:13-21` | (1) 表+`Add_agent` `[待渲染实测]`。(2) `GET /v1/livechat/users/agent` `useAgentsQuery.ts:8`。(3) `/omnichannel/agents`。[读] | — | `omni.manager.managers.open` | `AgentsPage.tsx` `routes.ts:118-121` `[读]` |
| `omni.manager.agents.search` | 搜/排序坐席 | `Search`；列 Name/Username/Email/`Livechat_status` | 同 open | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text/sort | `omni.manager.agents.open` | `useAgentsQuery.ts:8` `[读]` |
| `omni.manager.agents.add` | 加坐席 | `Username` → `Add_agent` | 同 open | (1) toast `Agent_added` `[待渲染实测]`。(2) `POST /v1/livechat/users/agent` `AddAgent.tsx:20`。(3) 刷新仍在。[读] | username | `omni.manager.agents.remove` | `AddAgent.tsx:20` `[读]` |
| `omni.manager.agents.info` | 打开坐席信息栏 | 行点击 | 同 open | (1) complementary info `[待渲染实测]`。(2) `GET /v1/livechat/users/agent/:_id` `AgentInfo.tsx:29`。(3) URL `/omnichannel/agents/info/{id}`。[读] | id | `omni.manager.agents.edit` | `AgentInfo.tsx:29-64` `[读]` |
| `omni.manager.agents.edit` | 改坐席接听状态与部门并保存 | info → `Edit` → `Status`（Available/Not_Available）+ `Departments` → `Save`（`Reset` 回滚表单） | 同 open；改他人状态服务端 `manage-livechat-agents` `agent.ts:113` | (1) toast `Success`；栏可关 `[待渲染实测]`。(2) `POST /v1/livechat/agent.status` + `POST /v1/livechat/agents.saveInfo` `AgentEdit.tsx:79-90`。(3) 刷新后状态/部门仍在。[读] | departments；`statusLivechat` | `omni.agent.status.consequences` | `AgentEdit.tsx:79-90` `[读]` |
| `omni.manager.agents.remove` | 撤坐席 | 行或 info `Remove` → `Delete` | 同 open | (1) toast `Agent_removed` `[待渲染实测]`。(2) `DELETE /v1/livechat/users/agent/:_id` `useRemoveAgent.tsx:16`。(3) 刷新后不在。[读] | `_id` | `omni.manager.agents.add` | `useRemoveAgent.tsx:16` `[读]` |

### 2.6 Departments `/omnichannel/departments`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.departments.open` | 打开部门 All/Archived | 侧栏 `Departments` | 侧栏 `view-livechat-departments` `:44`；**页** `manage-livechat-departments` `DepartmentsRoute.tsx:7-10` | (1) tab `All`/`Archived` `[待渲染实测]`。(2) `GET /v1/livechat/department` 或 `.../departments/archived` `DepartmentsTable.tsx:24-39`。(3) URL。[读] | tab | — | `DepartmentsPage.tsx:47-53` `[读]` |
| `omni.manager.departments.search` | 搜/排序部门 | `Search`；列 Name/Description/Num_Agents/Enabled/Show_on_registration | 同页权 | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text | `omni.manager.departments.open` | `DepartmentsTable.tsx` `[读]` |
| `omni.manager.departments.create` | 新建部门（或撞限额 upsell） | `Create_department` | 先 `GET /v1/livechat/department/isDepartmentCreationAvailable` `NewDepartment.tsx:18`；false → `EnterpriseDepartmentsModal`（`Premium_capability`/`Upgrade`） | (1) 新表单或 upsell `[待渲染实测]`。(2) 可用则随后 POST 见 edit。(3) 限额是许可证态。[读] | 部门数限额 | `omni.manager.departments.edit` | `NewDepartment.tsx:18-26` `EnterpriseDepartmentsModal.tsx:49-65` `[读]` |
| `omni.manager.departments.edit` | 保存部门（含 Agents 段与 EE 字段） | 行 `Options`→`Edit` 或 new 表单 → `Enabled`/Name/Email/… + Agents 加减 → `Save` | 同页权；`Unit` 要 `manage-livechat-units` + **`livechat-enterprise`** `EditDepartment.tsx:63-64,348-354`；EE 字段 Max chats / waiting queue / forward / BH | (1) toast `Saved` 回列表 `[待渲染实测]`。(2) `POST /v1/livechat/department` 或 `PUT /v1/livechat/department/:_id`；坐席 `POST .../department/:_id/agents` `:82-116`；加坐席预取 `GET /v1/livechat/users/agent/:_id`。(3) 刷新后仍在。[读] | agents count/order | `omni.manager.units.edit` | `EditDepartment.tsx:82-116,258-354` `[读]` |
| `omni.manager.departments.archive` | 归档或恢复部门 | 行菜单 `Archive`/`Unarchive` | 同页权 | (1) 进 Archived 或回 All；toast `[待渲染实测]`。(2) `POST /v1/livechat/department/:_id/archive` 或 `.../unarchive` `DepartmentItemMenu.tsx:11-47`。(3) 刷新后 tab 归属变。[读] | `_id` | `omni.manager.departments.open` | `DepartmentItemMenu.tsx:31-47` `[读]` |
| `omni.manager.departments.delete` | 删除部门 | 菜单 `Delete` → 确认 | 设置 `Omnichannel_enable_department_removal` 否则 tooltip `Department_Removal_Disabled` `DepartmentItemMenu.tsx:28,85-86` | (1) 行消失 `[待渲染实测]`。(2) `DELETE /v1/livechat/department/:_id` `RemoveDepartmentModal.tsx:20`。(3) 刷新后不在。[读] | `_id` | `omni.manager.departments.archive` | `RemoveDepartmentModal.tsx:20` `[读]` |

### 2.7 Custom_Fields `/omnichannel/customfields`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.customfields.open` | 打开自定义字段表 | 侧栏 `Custom_Fields` | `view-livechat-customfields` `sidebarItems.tsx:50` `CustomFieldsRoute.tsx:7-10` | (1) 表+`Create_custom_field` `[待渲染实测]`。(2) 列表 query。(3) URL。[读] | — | — | `CustomFieldsPage.tsx` `[读]` |
| `omni.manager.customfields.search` | 搜字段 | `Search` | 同 open | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text | `omni.manager.customfields.open` | `useCustomFieldsQuery` `[读]` |
| `omni.manager.customfields.create` | 新建字段 | `Create_custom_field` → 填 Field/Label/Scope/Visible/Searchable/Validation → `Save` | 同 open | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/custom-fields.save` `EditCustomFields.tsx:78`。(3) 刷新仍在。[读] | scope visitor/room | `omni.manager.customfields.edit` | `EditCustomFields.tsx:78` `[读]` |
| `omni.manager.customfields.edit` | 改字段 | 行 → 改 → `Save` | 同 open；预取 `GET /v1/livechat/custom-fields/:_id` `EditCustomFieldsWithData.tsx:13` | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/custom-fields.save` `EditCustomFields.tsx:78`。(3) 刷新仍在。[读] | `_id` | `omni.manager.customfields.create` | `EditCustomFieldsWithData.tsx:13` `[读]` |
| `omni.manager.customfields.delete` | 删字段 | 行 `Remove` 或编辑 `Delete` | 同 open | (1) toast `Custom_Field_Removed` `[待渲染实测]`。(2) `POST /v1/livechat/custom-fields.delete` `useRemoveCustomField.tsx:13`。(3) 刷新后不在。[读] | `_id` | `omni.manager.customfields.edit` | `useRemoveCustomField.tsx:13` `[读]` |

### 2.8 Livechat_Triggers `/omnichannel/triggers`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.triggers.open` | 打开触发器表 | 侧栏 `Livechat_Triggers` | `view-livechat-triggers` `sidebarItems.tsx:56` `TriggersRoute.tsx:7-10` | (1) 表+`Create_trigger` `[待渲染实测]`。(2) 列表 GET。(3) URL。[读] | — | `omni.widget.trigger.start` | `TriggersPage.tsx` `[读]` |
| `omni.manager.triggers.create` | 新建触发器 | `Create_trigger` | `view-livechat-triggers` `TriggersRoute.tsx:7-10` | (1) 进 `/triggers/new` 空表单 `[待渲染实测]`。(2) 打开无写库；保存走 edit 的 `POST /v1/livechat/triggers`。(3) 未保存则刷新回列表。[读] | — | `omni.manager.triggers.edit` | `TriggersPage.tsx` `[读]` |
| `omni.manager.triggers.edit` | 保存触发器（条件/动作/Enabled/Run once） | 行或 new → `Enabled` `Run_only_once_for_each_visitor` `Condition` `Action`（`Send_a_message` / `Send_a_message_external_service`）→ `Save` | 同 open；外部服务动作无 **`livechat-enterprise`** 则 disabled+`Premium` `ActionForm.tsx:43,54,97` | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/triggers` `EditTrigger.tsx:81`；预取 `GET /v1/livechat/triggers/:_id`。(3) 刷新仍在。[读] | condition/action | `omni.manager.triggers.test` | `EditTrigger.tsx:81` `[读]` |
| `omni.manager.triggers.delete` | 删触发器 | 行 `Remove` → `Delete` | 同 open | (1) toast `Trigger_removed` `[待渲染实测]`。(2) `DELETE /v1/livechat/triggers/:_id` `TriggersRow.tsx:15,37`。(3) 刷新后不在。[读] | `_id` | `omni.manager.triggers.edit` | `TriggersRow.tsx:15-37` `[读]` |
| `omni.manager.triggers.test` | 测外部服务 URL | 动作=外部服务 → `Send_Test` | 同 edit + EE 动作可用 | (1) 测试结果 toast `[待渲染实测]`。(2) `POST /v1/livechat/triggers/external-service/test` `ActionExternalServiceUrl.tsx:32,93`。(3) 不改触发器文档。[读] | URL | `omni.manager.triggers.edit` | `ActionExternalServiceUrl.tsx:32-93` `[读]` |

### 2.9 Livechat_Installation `/omnichannel/installation`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.installation.open` | 打开安装说明与 widget 代码 | 侧栏 `Livechat_Installation` | `view-livechat-installation` `sidebarItems.tsx:62`；路由无再检 | (1) 代码块 `[待渲染实测]`。(2) 无 REST（拼 `Site_Url`）。(3) 只读。[读] | `Site_Url` | `omni.widget.start` | `Installation.tsx:11-21` `routes.ts:108-111` `[读]` |
| `omni.manager.installation.copy` | 复制 embed 代码 | 页内 `Copy`（成功 `Copied`） | 同 open | (1) 剪贴板；按钮名变 `Copied` `[待渲染实测]`。(2) 无 HTTP。(3) 服务端无变化。[读] | snippet | `omni.manager.installation.open` | `Installation.tsx:35` `[读]` |

### 2.10 Livechat_Appearance `/omnichannel/appearance`

页级保存整表，**不**逐字段拆行（对照 05 设置 OOS）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.appearance.open` | 打开外观手风琴（含 CE 禁用的 Premium 控件） | 侧栏 `Livechat_Appearance` | `view-livechat-appearance` `AppearancePageContainer.tsx:24-27` | (1) 段 `General` `Livechat_online` `Livechat_offline` `Livechat_registration_form` `Conversation_finished`；无 EE 时 `Livechat_hide_watermark`/`Livechat_background`/`Livechat_widget_position_on_the_screen`/`Livechat_hide_system_messages` disabled+`Premium` `[待渲染实测]`。(2) `GET /v1/livechat/appearance` `:15-20`。(3) 只读直到 Save。[读] | 许可证 **`livechat-enterprise`** `AppearanceForm.tsx:26` | `omni.widget.start` | `AppearancePageContainer.tsx` `AppearanceForm.tsx:70,84,106,130` `[读]` |
| `omni.manager.appearance.save` | 保存外观（含访客可否关聊） | 改字段（如 `Omnichannel_allow_visitors_to_close_conversation`）→ `Save_changes`；`Cancel` 重置 | 同 open；Premium 字段无许可证改不了 | (1) toast `Settings_updated` `[待渲染实测]`。(2) `POST /v1/livechat/appearance` `AppearancePage.tsx:49`。(3) 刷新后 widget 用新外观。[读] | 表单整包 | `omni.widget.close` | `AppearancePage.tsx:49-71` `[读]` |

### 2.11 Webhooks `/omnichannel/webhooks`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.webhooks.open` | 打开 webhook 集成表 | 侧栏 `Webhooks` | `view-livechat-webhooks` `WebhooksPageContainer.tsx:32-35` | (1) `Webhook_URL` `Secret_token` `Send_request_on` `Http_timeout` `[待渲染实测]`。(2) `GET /v1/livechat/integrations.settings` `:21-28`。(3) 只读直到 Save。[读] | 8 个事件布尔 | — | `WebhooksPageContainer.tsx` `[读]` |
| `omni.manager.webhooks.save` | 保存 webhook | 改 URL/token/事件/超时 → `Save`；`Reset` 回表单 | 同 open | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/omnichannel/integrations` `WebhooksPage.tsx:100,123-135`。(3) 刷新后仍在。[读] | URL/token/events | `omni.manager.webhooks.test` | `WebhooksPage.tsx:100-135` `[读]` |
| `omni.manager.webhooks.test` | 对已存 URL 发测试 | `Send_Test`（`Sending`） | 同 open；须已有 URL | (1) toast `It_works` 或错 `[待渲染实测]`。(2) `POST /v1/livechat/webhook.test` `:101,145-147`。(3) 不改设置。[读] | 已存 URL | `omni.manager.webhooks.save` | `WebhooksPage.tsx:145-147` `[读]` |

### 2.12 Business_Hours `/omnichannel/businessHours`

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.businesshours.open` | 打开营业时间（关则引导去设置） | 侧栏 `Business_Hours` | 侧栏 `view-livechat-business-hours` `:80`；设置 `Livechat_enable_business_hours` 假 → `BusinessHoursDisabledPage` + `Enable_business_hours` 链到 `/admin/settings/Omnichannel` `BusinessHoursRouter.tsx:25-26`；单 BH 自动 `/businessHours/edit/default` `:19-22` | (1) 表或禁用页或单条编辑 `[待渲染实测]`。(2) 多 BH：`GET /v1/livechat/business-hours` `BusinessHoursTable.tsx:37`。(3) URL。[读] | 单/多模式 | `omni.agent.status.consequences` | `BusinessHoursRouter.tsx:19-26` `[读]` |
| `omni.manager.businesshours.create` | 新增多条营业时间 | 多 BH 列表 `New` | 多 BH 模式 | (1) `/businessHours/new` 表单 `[待渲染实测]`。(2) 保存见 save。(3) —。[读] | — | `omni.manager.businesshours.save` | `BusinessHoursMultiplePage.tsx:17-18` `[读]` |
| `omni.manager.businesshours.save` | 保存时区与开闭时间 | 编辑 `Timezone` `Open_days_of_the_week` `Open` `Close` → `Save` | 同 open 且功能开启；预取 `GET /v1/livechat/business-hour` `EditBusinessHoursWithData.tsx:16` | (1) toast `Business_hours_updated` `[待渲染实测]`。(2) `POST /v1/livechat/business-hours.save` `EditBusinessHours.tsx:43,74`。(3) 刷新后仍在；影响坐席能否 ON。[读] | days/hours | `omni.agent.status.consequences` | `EditBusinessHours.tsx:43-74` `[读]` |
| `omni.manager.businesshours.delete` | 删一条（非单 BH） | 表 `Remove` 或编辑 `Delete` | 非 single 模式 | (1) 行消失 `[待渲染实测]`。(2) `POST /v1/livechat/business-hours.remove` `useRemoveBusinessHour.tsx:11`。(3) 刷新后不在。[读] | `_id` | `omni.manager.businesshours.create` | `useRemoveBusinessHour.tsx:11` `[读]` |

### 2.13 Security_and_privacy `/omnichannel/security-privacy`

页级保存 Contact_identification 组（不是 972 字段展开）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.security.open` | 打开联系人识别设置组 | 侧栏 `Security_and_privacy` | `view-privileged-setting` OR `edit-privileged-setting` OR `manage-selected-settings` `sidebarItems.tsx:86` `SecurityPrivacyPage.tsx:11-15`；设置定义挂 EE `livechat-enterprise`+`contact-id-verification` `ee/server/settings/contact-verification.ts:34-35` | (1) 组 `Contact_identification` 或 `NotAuthorizedPage` `[待渲染实测]`。(2) 设置 GET。(3) URL。[读] | 三设置 id | `omni.agent.unknown-contact` | `SecurityPrivacyPage.tsx:8-15` `[读]` |
| `omni.manager.security.save` | 保存拦截未知/未验证与校验策略 | 改 `Livechat_Block_Unknown_Contacts` / `Livechat_Block_Unverified_Contacts` / `Livechat_Require_Contact_Verification`（`Never`/`Once`/`On_All_Contacts`）→ Save | 同 open + 能编辑设置 | (1) toast `Settings_updated` `[待渲染实测]`。(2) `POST /v1/settings` 批量 `SettingsProvider.tsx:105,139`。(3) 刷新后策略仍在。[读] | 三 key | `omni.manager.security.open` | `SettingsGroupPage.tsx:63-84` `[读]` |

### 2.14 Reports `/omnichannel/reports`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.reports.open` | 打开五张会话分布卡 | 侧栏 `Reports` | `view-livechat-reports` **且** **`livechat-enterprise`** `ReportsPage.tsx:15-19` `livechatSideNavItems.ts:8` 否则 `NotAuthorizedPage` | (1) 卡 Status/Channels/Departments/Tags/Agents `[待渲染实测]`。(2) `GET .../conversations-by-status` `-source` `-department` `-tags` `-agent`。(3) 只读。[读] | period | `omni.manager.analytics.open` | `ReportsPage.tsx` `[读]` |
| `omni.manager.reports.period` | 改报表周期 | 任一卡 PeriodSelector（today / this week / last 15 days / this month / last 6 months / this year） | 同 open | (1) 图/表变；空则 `No_data_available_for_the_selected_period`；错则 `Retry` `[待渲染实测]`。(2) 同上 GET+period。(3) 不落库。[读] | `constants.ts:44` | `omni.manager.reports.open` | `ReportCard.tsx:41-42` `[读]` |
| `omni.manager.reports.download` | 下载当前卡 CSV | 卡 → Download CSV | 同 open | (1) 文件下载 `[待渲染实测]`。(2) 同卡数据经 `useDefaultDownload`。(3) 服务端报表不变。[读] | 当前 period | `omni.manager.reports.period` | `ReportCard.tsx:41-42` `[读]` |

### 2.15 Livechat_Monitors `/omnichannel/monitors`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.monitors.open` | 打开监控员表 | 侧栏 `Livechat_Monitors` | 侧栏 `manage-livechat-monitors` `:15`；容器只检 **`livechat-enterprise`** `MonitorsPageContainer.tsx:7-14`（**不再检权限**） | (1) 表或 `NotAuthorizedPage` `[待渲染实测]`。(2) `GET /v1/livechat/monitors` `MonitorsTable.tsx:50`。(3) URL。[读] | — | `omni.manager.units.edit` | `MonitorsPageContainer.tsx:7-14` `[读]` |
| `omni.manager.monitors.add` | 加监控员 | `Username` → `Add_monitor` | 同 open | (1) toast `Monitor_added` `[待渲染实测]`。(2) `POST /v1/livechat/monitors.create` `MonitorsTable.tsx:53,89`。(3) 刷新仍在。[读] | username | `omni.manager.monitors.remove` | `MonitorsTable.tsx:53-89` `[读]` |
| `omni.manager.monitors.remove` | 撤监控员 | `Remove` → `Delete` | 同 open | (1) toast `Monitor_removed` `[待渲染实测]`。(2) `POST /v1/livechat/monitors.delete` `:52,104`。(3) 刷新后不在。[读] | `_id` | `omni.manager.monitors.add` | `MonitorsTable.tsx:52-104` `[读]` |

### 2.16 Units `/omnichannel/units`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.units.open` | 打开业务单元表 | 侧栏 `Units` | `manage-livechat-units` + **`livechat-enterprise`** `UnitsRoute.tsx:8-12` `livechatSideNavItems.ts:22` | (1) 表+`Create_unit` `[待渲染实测]`。(2) `GET /v1/livechat/units` `UnitsTable.tsx:43`。(3) URL。[读] | — | `omni.manager.departments.edit` | `UnitsPage.tsx` `[读]` |
| `omni.manager.units.search` | 搜单元 | `Search` | 同 open | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text | `omni.manager.units.open` | `UnitsTable.tsx:43` `[读]` |
| `omni.manager.units.create` | 新建单元 | `Create_unit` → 填 Name/Visibility/Departments/Monitors → `Save` | 同 open | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/units` `UnitEdit.tsx:50,117`。(3) 刷新仍在。[读] | depts/monitors | `omni.manager.units.edit` | `UnitEdit.tsx:50-117` `[读]` |
| `omni.manager.units.edit` | 改单元 | 行 → 改 → `Save` | 同 open；预取 unit+monitors+departments `UnitEditWithData.tsx:14-16` | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/units/:id`。(3) 刷新仍在。[读] | id | `omni.manager.monitors.open` | `UnitEdit.tsx:117` `[读]` |
| `omni.manager.units.delete` | 删单元 | 行 `Remove` 或编辑 `Delete` | 同 open | (1) toast `Unit_removed` `[待渲染实测]`。(2) `DELETE /v1/livechat/units/:id` `useRemoveUnit.tsx:13`。(3) 刷新后不在。[读] | id | `omni.manager.units.create` | `useRemoveUnit.tsx:13` `[读]` |

### 2.17 Canned_Responses `/omnichannel/canned-responses`（EE 侧栏）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.canned.open` | 打开经理快捷回复表 | 侧栏 `Canned_Responses` | `manage-livechat-canned-responses` `CannedResponsesRoute.tsx:7-10` `livechatSideNavItems.ts:29`（路由**不**检 `canned-responses` 模块） | (1) 表+`Create_canned_response` `[待渲染实测]`。(2) `GET /v1/canned-responses` `CannedResponsesTable.tsx:59`。(3) URL。[读] | — | `omni.agent.canned.list` | `CannedResponsesPage.tsx` `[读]` |
| `omni.manager.canned.search` | 搜并按 Sharing/Created_by 筛 | `Search`；`Sharing`=`All`/`Private`/`Public`/`Department`；`Created_by` | 同 open；部门监控员不可进行全局行 `CannedResponsesTable.tsx:69-73` | (1) 行变 `[待渲染实测]`。(2) GET `scope`/`createdBy`。(3) 不写库。[读] | filters | `omni.manager.canned.open` | `CannedResponseFilter.tsx:24-45` `[读]` |
| `omni.manager.canned.create` | 经理创建快捷回复 | `Create_canned_response` → Shortcut/Message/Sharing/Department/Tags → `Save` | 同 open | (1) toast `[待渲染实测]`。(2) `POST /v1/canned-responses` `CannedResponseEdit.tsx:41`。(3) 刷新仍在。[读] | scope | `omni.agent.canned.create` | `CannedResponseEdit.tsx:41` `[读]` |
| `omni.manager.canned.edit` | 改快捷回复 | 行 → 改 → `Save` | 同 open + 预取 GET `/:_id` | (1) toast `[待渲染实测]`。(2) `POST /v1/canned-responses` `CannedResponseEdit.tsx:41`。(3) 刷新后正文仍在。[读] | `_id` | `omni.manager.canned.create` | `CannedResponsesTable.tsx:69-73` `[读]` |
| `omni.manager.canned.delete` | 删快捷回复 | 行 `Remove` 或编辑 `Delete` | 同 open | (1) toast `Canned_Response_Removed` `[待渲染实测]`。(2) `DELETE /v1/canned-responses/:_id` `useRemoveCannedResponse.tsx:15`。(3) 刷新后不在。[读] | `_id` | `omni.manager.canned.edit` | `useRemoveCannedResponse.tsx:15` `[读]` |

### 2.18 Tags `/omnichannel/tags`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.tags.open` | 打开标签表 | 侧栏 `Tags` | `manage-livechat-tags` `TagsRoute.tsx:7-10` `livechatSideNavItems.ts:36` | (1) 表+`Create_tag` `[待渲染实测]`。(2) `GET /v1/livechat/tags` `TagsTable.tsx:49`。(3) URL。[读] | — | `omni.agent.room.edit` `omni.agent.close` | `TagsPage.tsx` `[读]` |
| `omni.manager.tags.search` | 搜标签 | `Search` | 同 open | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text | `omni.manager.tags.open` | `TagsTable.tsx:49` `[读]` |
| `omni.manager.tags.create` | 新建标签 | `Create_tag` → Name/Description/Departments → `Save` | 同 open | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/tags.save` `TagEdit.tsx:38,64`。(3) 刷新仍在。[读] | depts | `omni.manager.tags.edit` | `TagEdit.tsx:38-64` `[读]` |
| `omni.manager.tags.edit` | 改标签 | 行 → 改 → `Save` | 同 open；预取 `GET /v1/livechat/tags/:tagId` | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/tags.save` `TagEdit.tsx:38,64`。(3) 刷新仍在。[读] | tagId | `omni.manager.tags.create` | `TagEdit.tsx:64` `[读]` |
| `omni.manager.tags.delete` | 删标签 | 行 `Remove` 或编辑 `Delete` | 同 open | (1) toast `Tag_removed` `[待渲染实测]`。(2) `POST /v1/livechat/tags.delete` `useRemoveTag.tsx:11`。(3) 刷新后不在。[读] | tagId | `omni.manager.tags.create` | `useRemoveTag.tsx:11` `[读]` |

### 2.19 SLA_Policies `/omnichannel/sla-policies`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.sla.open` | 打开 SLA 表 | 侧栏 `SLA_Policies` | `manage-livechat-sla` `SlaRoute.tsx:7-10` `livechatSideNavItems.ts:43` | (1) 表+`Create_SLA_policy` `[待渲染实测]`。(2) `GET /v1/livechat/sla` `SlaTable.tsx:46`。(3) URL。[读] | — | `omni.agent.room.edit` | `SlaPage.tsx` `[读]` |
| `omni.manager.sla.search` | 搜 SLA | `Search` | 同 open | (1) 行变 `[待渲染实测]`。(2) GET。(3) 不写库。[读] | text | `omni.manager.sla.open` | `SlaTable.tsx:46` `[读]` |
| `omni.manager.sla.create` | 新建 SLA | `Create_SLA_policy` → Name/Description/Estimated wait time → `Save` | 同 open | (1) toast `Saved` `[待渲染实测]`。(2) `POST /v1/livechat/sla` `SlaEdit.tsx:25-26,76`。(3) 刷新仍在。[读] | wait time | `omni.manager.sla.edit` | `SlaEdit.tsx:25-76` `[读]` |
| `omni.manager.sla.edit` | 改 SLA | 行 → 改 → `Save`/`Reset` | 同 open；预取 `GET /v1/livechat/sla/:slaId` `SlaEditWithData.tsx:15` | (1) toast `Saved` `[待渲染实测]`。(2) `PUT /v1/livechat/sla/:slaId`。(3) 刷新仍在。[读] | slaId | `omni.manager.sla.create` | `SlaEdit.tsx:25-76` `[读]` |
| `omni.manager.sla.delete` | 删 SLA | 行 `Remove` | 同 open | (1) toast `SLA_removed` `[待渲染实测]`。(2) `DELETE /v1/livechat/sla/:slaId` `RemoveSlaButton.tsx:14`。(3) 刷新后不在。[读] | slaId | `omni.manager.sla.create` | `RemoveSlaButton.tsx:14` `[读]` |

### 2.20 Priorities `/omnichannel/priorities`（EE）

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `omni.manager.priorities.open` | 打开优先级表（无新建，只有改名） | 侧栏 `Priorities` | `manage-livechat-priorities` `PrioritiesRoute.tsx:7-12` `livechatSideNavItems.ts:50` | (1) 表 Icon/Name；脏时出现 `Reset` `[待渲染实测]`。(2) `GET /v1/livechat/priorities` `useOmnichannelPriorities`。(3) URL。[读] | — | `omni.agent.sidepanel.priority` | `PrioritiesPage.tsx` `[读]` |
| `omni.manager.priorities.edit` | 改一条优先级显示名 | 行 → 栏填 `Name` → `Save`（`Reset` 回该条默认） | 同 open | (1) toast `Priority_saved` `[待渲染实测]`。(2) `PUT /v1/livechat/priorities/:priorityId`（可选 `{reset:true}`）`PrioritiesPage.tsx:30,70`。(3) 刷新后名称仍在。[读] | priorityId | `omni.manager.priorities.reset` | `PrioritiesPage.tsx:30-70` `[读]` |
| `omni.manager.priorities.reset` | 重置全部优先级 | 列表 `Reset` → `Reset_priorities` 确认 | 同 open 且有脏数据 | (1) toast `Priorities_restored` `[待渲染实测]`。(2) `POST /v1/livechat/priorities.reset` `PrioritiesPage.tsx:31,43`。(3) 刷新后回出厂名。[读] | — | `omni.manager.priorities.edit` | `PrioritiesPage.tsx:31-43` `[读]` |

经理表合计：**82** 行（§2.1–2.20）。

---

## 3. 访客 widget `omni.widget.*`

独立 bundle：`packages/livechat`（`webpack.config.ts` → `dist/livechat/`）。挂载 `packages/livechat/src/entry.ts` → `components/App/App.tsx:176-184` 七条路由。主 SPA 不走这些 path。i18n：`packages/livechat/src/i18n/en.json`（嵌套 `translation`）。访客可感知动作**全部入行**。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
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

widget 表 **15** 行。另：排队文案 `please_wait_for_the_next_available_agent` 为自动 alert，不单列按钮。视频块 i18n 有 `join_call` 但 **无现行 UI 绑定**，不造行。

---

## [待渲染实测]

1. 缺 `livechat-enterprise` 时 EE 7 侧栏是否消失（05 已点名）。
2. Departments：仅有 `view-livechat-departments`、无 `manage-livechat-departments` 时侧栏在、页 `NotAuthorizedPage`。
3. Monitors：有许可证无 `manage-livechat-monitors` 时页是否仍开（容器不检权限）。
4. 坐席 OFF 后顶栏 Queue、侧栏询价、`Take_it` disabled 三件是否同时发生。
5. 营业时间关时自己点 toggle 是否 toast `error-business-hours-are-closed`。
6. Contact Center 经理路径与 `/omnichannel-directory` 是否同一套 tab/筛。
7. 关单 wrap-up 在「无评论/无标签/无 transcript」时是否退化成简单确认。
8. widget 七路由在嵌入脚本下的可达性（本仓库未跑 widget）。
9. 外观 Premium 字段在 CE 是否只 disabled 而非隐藏。
10. 优先级侧栏菜单与 Room_Info 下拉是否写同一 `priorityId`。

---

## 计数证据

```bash
rg -c "i18nLabel:" apps/meteor/client/views/omnichannel/sidebarItems.tsx          # 13
rg -c "i18nLabel:" apps/meteor/app/livechat-enterprise/client/views/livechatSideNavItems.ts  # 7
rg -c "registerOmnichannelRoute\(" apps/meteor/client/views/omnichannel/routes.ts # 20
find apps/meteor/client/views/omnichannel -type f | wc -l                         # 480
ls -1 packages/livechat/src/routes | wc -l                                       # 7

rg -c '^\| `omni\.agent\.' docs/qa/pm-feature-atlas/08-omnichannel-product.md
rg -c '^\| `omni\.manager\.' docs/qa/pm-feature-atlas/08-omnichannel-product.md
rg -c '^\| `omni\.widget\.' docs/qa/pm-feature-atlas/08-omnichannel-product.md
```

CE 13 href 均有 open + 至少一项页级动作（search/save/copy/filter/CRUD）。EE 7 同样。

---

## 验算

| 块 | 行数 | 算法 |
|---|---|---|
| 坐席 `omni.agent.*` | 39 | queue 3 + directory 13 + sidepanel 3 + room/contact 4 + canned 4 + 头栏动作 7 + file/join/status/unknown/composer 5 = 39 |
| 经理 CE | 53 | current 10 + analytics 2 + realtime 2 + managers 4 + agents 6 + departments 6 + customfields 5 + triggers 5 + installation 2 + appearance 2 + webhooks 3 + businesshours 4 + security 2 = 53 |
| 经理 EE | 29 | reports 3 + monitors 3 + units 5 + canned 5 + tags 5 + sla 5 + priorities 3 = 29 |
| 经理合计 | 82 | 53+29 |
| widget | 15 | 上表 |
| **本册表体** | **136** | 39+82+15 |

侧栏覆盖：CE 13/13，EE 7/7。坐席必选项：take / transfer / close / hold / resume / return-queue / canned CRUD / queue / directory 均有行。widget 在树内 7 路由均有访客动作。

---

## id 列表

**omni.agent.***（39）：`omni.agent.queue.open` `omni.agent.queue.filter` `omni.agent.queue.take` `omni.agent.directory.open` `omni.agent.directory.chats.search` `omni.agent.directory.chats.filter` `omni.agent.directory.chats.open` `omni.agent.directory.chats.remove` `omni.agent.directory.chats.remove-all-closed` `omni.agent.directory.contacts.search` `omni.agent.directory.contact.new` `omni.agent.directory.contact.edit` `omni.agent.directory.contact.delete` `omni.agent.directory.contact.details` `omni.agent.directory.contact.history` `omni.agent.directory.contact.block` `omni.agent.sidepanel.in-progress` `omni.agent.sidepanel.on-hold` `omni.agent.sidepanel.priority` `omni.agent.room.info` `omni.agent.room.edit` `omni.agent.contact.info` `omni.agent.contact.edit` `omni.agent.canned.list` `omni.agent.canned.use` `omni.agent.canned.create` `omni.agent.canned.edit` `omni.agent.forward` `omni.agent.close` `omni.agent.hold` `omni.agent.resume` `omni.agent.return-queue` `omni.agent.transcript.email` `omni.agent.transcript.pdf` `omni.agent.file.send` `omni.agent.join` `omni.agent.status.consequences` `omni.agent.unknown-contact` `omni.agent.composer.denied`

**omni.manager.***（82）：`omni.manager.current.open` `omni.manager.current.chats.search` `omni.manager.current.chats.filter` `omni.manager.current.chats.open` `omni.manager.current.chats.remove` `omni.manager.current.chats.remove-all` `omni.manager.current.contacts.search` `omni.manager.current.contact.new` `omni.manager.current.contact.edit` `omni.manager.current.contact.delete` `omni.manager.analytics.open` `omni.manager.analytics.filter` `omni.manager.realtime.open` `omni.manager.realtime.filter` `omni.manager.managers.open` `omni.manager.managers.search` `omni.manager.managers.add` `omni.manager.managers.remove` `omni.manager.agents.open` `omni.manager.agents.search` `omni.manager.agents.add` `omni.manager.agents.info` `omni.manager.agents.edit` `omni.manager.agents.remove` `omni.manager.departments.open` `omni.manager.departments.search` `omni.manager.departments.create` `omni.manager.departments.edit` `omni.manager.departments.archive` `omni.manager.departments.delete` `omni.manager.customfields.open` `omni.manager.customfields.search` `omni.manager.customfields.create` `omni.manager.customfields.edit` `omni.manager.customfields.delete` `omni.manager.triggers.open` `omni.manager.triggers.create` `omni.manager.triggers.edit` `omni.manager.triggers.delete` `omni.manager.triggers.test` `omni.manager.installation.open` `omni.manager.installation.copy` `omni.manager.appearance.open` `omni.manager.appearance.save` `omni.manager.webhooks.open` `omni.manager.webhooks.save` `omni.manager.webhooks.test` `omni.manager.businesshours.open` `omni.manager.businesshours.create` `omni.manager.businesshours.save` `omni.manager.businesshours.delete` `omni.manager.security.open` `omni.manager.security.save` `omni.manager.reports.open` `omni.manager.reports.period` `omni.manager.reports.download` `omni.manager.monitors.open` `omni.manager.monitors.add` `omni.manager.monitors.remove` `omni.manager.units.open` `omni.manager.units.search` `omni.manager.units.create` `omni.manager.units.edit` `omni.manager.units.delete` `omni.manager.canned.open` `omni.manager.canned.search` `omni.manager.canned.create` `omni.manager.canned.edit` `omni.manager.canned.delete` `omni.manager.tags.open` `omni.manager.tags.search` `omni.manager.tags.create` `omni.manager.tags.edit` `omni.manager.tags.delete` `omni.manager.sla.open` `omni.manager.sla.search` `omni.manager.sla.create` `omni.manager.sla.edit` `omni.manager.sla.delete` `omni.manager.priorities.open` `omni.manager.priorities.edit` `omni.manager.priorities.reset`

**omni.widget.***（15）：`omni.widget.start` `omni.widget.register` `omni.widget.send` `omni.widget.upload` `omni.widget.emoji` `omni.widget.close` `omni.widget.transcript` `omni.widget.department` `omni.widget.offline` `omni.widget.gdpr` `omni.widget.forget` `omni.widget.finished.new` `omni.widget.trigger.start` `omni.widget.minimize` `omni.widget.sound`

---

## 边界

- 不重写 `nav.omnichannel.agent-toggle` / `nav.omnichannel.queue` / `nav.omnichannel.contact` / `sidebar.filter.*` / `room.toolbox.canned-responses` / `room.toolbox.contact-profile` / `route.omnichannel` / `account.omnichannel` 的入口行；本册只展开后果或页内控件。
- 不枚举 Appearance 每一个输入、部门表单每一个 EE 文本框、联系人每一个自定义字段。
- 不写第三方渠道 App 专有设置键。
- 不写 Workspace Settings 972 `add`（05 OOS）。
- `/omnichannel/queue` 与 `/omnichannel/rooms` 在 `routes.ts` 有 path 类型，**无** `registerOmnichannelRoute`，不造行。
- 经理联络中心无关单；关单只在 live 房。
- widget 是独立 bundle，仍入册因为在树内且访客可感知。

---

## atlas diff（相对先前「仅侧栏入口」）

| 先前 id | 本册 |
|---|---|
| `route.omnichannel`（04，只开壳） | **保留**；NEW 82 条 `omni.manager.*` 覆盖 13+7 href 的页级动作 |
| `nav.omnichannel.queue` / `contact` / `agent-toggle`（02） | **保留入口**；NEW `omni.agent.queue.*` `directory.*` `status.consequences` |
| `sidebar.filter.in-progress\|queue\|on-hold`（02） | **保留 tab**；NEW 副栏点进 + priority + take |
| `room.toolbox.canned-responses` / `contact-profile`（02） | **保留开口**；NEW canned Use/CRUD、contact edit/history/block |
| Livechat widget（05 OOS，7 routes） | **NEW** 15 条 `omni.widget.*` |
| EE 7 侧栏（05 明确未展开） | **NEW** reports/monitors/units/canned/tags/sla/priorities |

全部 `omni.*` 相对现行 atlas 为 **NEW**。机械碰撞：与 `msg.*` `room.*` `user.*` `nav.*` `sidebar.*` `composer.*` `route.*` `account.*` `directory.*` `team.*` 前缀不交。
