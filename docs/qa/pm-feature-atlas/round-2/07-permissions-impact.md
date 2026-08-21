# Round 2 / Vol.7 — 客户端权限影响闭集

## 1. 方法

- 冻结树：**仅** `e519470d35b6caf5b228d81aef41c86aab3051f4`（`e519470d35`）。不是 `develop`。`file:line` 均相对此 SHA。
- 闭集定义：Web **客户端**在本树上会拿去 `queryPermission` / `hasPermission*` 的 **权限键**（静态字面量 + 本树能唯一展开的模板）。一行一键。id = `perm.<key>`。
- 客户端树：`apps/meteor/client/**`、`apps/meteor/ee/client/**`、`apps/meteor/app/**/client/**`、`apps/meteor/ee/app/**/client/**`、`packages/ui-client/**`。排除 `server/`、`*.spec.*`、`*.stories.*`、`tests/`、`*.snap`。
- API（已核 hunch）：`usePermission` / `usePermissionWithScopedRoles` / `useAtLeastOnePermission` / `useAllPermissions` / `hasPermission` / `hasAllPermission` / `hasAtLeastOnePermission`；另含 `PermissionGuard permission=`、slash-command `permission:`（`ComposerPopupProvider` + `processSlashCommand` 消费）。
- 模板展开（仅本树出现）：`` delete-${room.t|type} `` → `delete-c|p|d`；`` delete-team-${c?channel:group} `` → `delete-team-channel|group`。三元 `leave-c`/`leave-p` 已是字面量。
- **排除**：注释掉的 `usePermission('leave-team')`（`useLeaveTeam.tsx:25`）；`useRestrictedRoles` guest 白名单（登记不是检查）；i18n `mention-all`；Incoming webhook 帮助文案 `message-impersonate`；Apps-Engine `useApplyButtonFilters` 运行时键（开放集）；`manage-selected-settings` 背后的单条设置 id（开放集）。
- fixtures：`apps/meteor/server/lib/authorization/constant/permissions.ts` + EE `canned-responses/permissions.ts` / `omnichannel/permissions.ts` / `audit/startup.ts` / `abac/index.ts` + `autotranslate/permissions.ts`。默认角色取 `_id` 最后一次赋值。
- 诚实标记：每行 `[读]`。本环境无已登录 RC Web，故无 `[活]`。
- 8 列：稳定语义 id / 权限键 / 功能一句话 / 默认角色 / 隐藏或禁用的 UI / 效果 / 关联 / 出处。

## 2. Hunch 核验

| hunch | 本树结论 | 计数（排除 server/spec/stories/tests） |
| --- | --- | --- |
| `usePermission` | **成立**（含 `usePermissionWithScopedRoles`） | files=155；lines=370 |
| `useAtLeastOnePermission` | **成立** | files=14；lines=29 |
| `hasPermission` | **成立**（另有 `hasAllPermission` / `hasAtLeastOnePermission`） | files=34；lines=104 |
| `permission-` | **不成立**（0 个 RC 权限键） | client 1 行 = `DeviceProvider.tsx:96` react-query key `permission-status`；另 apps-engine 注释 2 行 |

## 3. 闭集表（一轮一键）

数据行 **148**。排序：权限键字典序。

| 稳定语义 id | 权限键 | 功能一句话 | 默认角色 | 隐藏/禁用的 UI | 效果 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `perm.abac-management` | `abac-management` | 打开 Admin→ABAC 页 | admin | Admin 侧栏 ABAC；直达 /admin/ABAC 整页 | hide+NotAuthorizedPage | manage-abac-admin-*；view-abac-admin-audit | `apps/meteor/client/views/admin/ABAC/AdminABACRoute.tsx:19` [读] |
| `perm.access-federation` | `access-federation` | 创建频道时启用联邦 | admin, user, federated-external | CreateChannelModal 联邦开关/提示 | hide/disable 联邦字段 | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:87` [读] |
| `perm.access-mailer` | `access-mailer` | 打开 Admin→Mailer | admin | Admin 侧栏 Mailer；/admin/mailer | hide+NotAuthorizedPage | ADMIN_PERMISSIONS | `apps/meteor/client/views/admin/mailer/MailerRoute.tsx:7` [读] |
| `perm.access-marketplace` | `access-marketplace` | 打开 Marketplace 浏览 | admin, user | 顶栏 Marketplace；Marketplace 侧栏多项；/marketplace | hide+NotAuthorizedPage | manage-apps（OR） | `apps/meteor/client/views/marketplace/MarketplaceRouter.tsx:15` [读] |
| `perm.access-permissions` | `access-permissions` | 打开权限矩阵（角色/权限表） | admin | Admin 侧栏 Permissions；PermissionsRouter 权限 tab | hide+NotAuthorizedPage | access-setting-permissions（OR 进页；AND 看权限 tab） | `apps/meteor/client/views/admin/permissions/PermissionsRouter.tsx:10` [读] |
| `perm.access-setting-permissions` | `access-setting-permissions` | 打开设置级权限表 | admin | Admin 侧栏 Permissions；PermissionsRouter 设置权限 tab | hide+NotAuthorizedPage | access-permissions | `apps/meteor/client/views/admin/permissions/PermissionsRouter.tsx:11` [读] |
| `perm.add-user-to-any-c-room` | `add-user-to-any-c-room` | 向未加入的公开频道加人 | admin | 房间成员栏 Add_users；UserInfo 加人 | hide Add | add-user-to-joined-room（OR）；p 房走 add-user-to-any-p-room | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersWithData.tsx:64` [读] |
| `perm.add-user-to-any-p-room` | `add-user-to-any-p-room` | 向未加入的私有组加人 | （空：无人默认拥有） | 私有房间成员栏 Add_users；UserInfo 加人 | hide Add | add-user-to-joined-room（OR）；fixtures 默认角色为空 | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersWithData.tsx:64` [读] |
| `perm.add-user-to-joined-room` | `add-user-to-joined-room` | 向已加入房间加人；/invite /invite-all | admin, owner, moderator | 成员栏 Add；slash /invite /invite-all | hide Add；slash-hidden | add-user-to-any-*-room（OR） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersWithData.tsx:64` [读] |
| `perm.allow-external-voice-calls` | `allow-external-voice-calls` | 拨打外部语音 | admin, user | MediaCallProvider 整棵语音 UI（与 internal OR） | hide 语音能力 | allow-internal-voice-calls；license teams-voip | `apps/meteor/client/providers/MediaCallProvider.tsx:11` [读] |
| `perm.allow-internal-voice-calls` | `allow-internal-voice-calls` | 拨打内部语音 | admin, user | MediaCallProvider 整棵语音 UI（与 external OR） | hide 语音能力 | allow-external-voice-calls；license teams-voip | `apps/meteor/client/providers/MediaCallProvider.tsx:10` [读] |
| `perm.archive-room` | `archive-room` | 归档房间 | admin, owner | 房间信息 Edit 归档控件（与 unarchive OR） | hide 归档 | unarchive-room | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/useEditRoomPermissions.ts:33` [读] |
| `perm.assign-admin-role` | `assign-admin-role` | 把用户设/撤为 admin | admin | Admin→Users 用户菜单 Make_admin | hide 菜单项 | （无） | `apps/meteor/client/views/admin/users/hooks/useChangeAdminStatusAction.ts:18` [读] |
| `perm.auto-translate` | `auto-translate` | 房间自动翻译与消息 Translate | admin | 房间工具 Auto-Translate；消息 More→Translate/View_original；autotranslate 订阅 | hide 工具/菜单 | （无） | `apps/meteor/client/hooks/roomActions/useAutotranslateRoomAction.ts:8` [读] |
| `perm.ban-user` | `ban-user` | 封禁用户；/ban /unban；Banned 栏 | admin, owner, moderator | UserInfo Ban；房间工具 Banned_Users；slash /ban /unban | hide 按钮/栏；slash-hidden | （无） | `apps/meteor/client/hooks/roomActions/useBannedUsersRoomAction.ts:12` [读] |
| `perm.bulk-register-user` | `bulk-register-user` | 批量导入用户 | admin | Admin→Users 顶栏 Bulk 按钮 | hide 按钮 | create-user | `apps/meteor/client/views/admin/users/UsersPageHeaderContent.tsx:19` [读] |
| `perm.bypass-time-limit-edit-and-delete` | `bypass-time-limit-edit-and-delete` | 绕过编辑/删除时限 | bot, app | 消息 Edit/Delete 与文件删除时限判断 | 无此权则超时隐藏 Edit/Delete | edit-message；delete-message；delete-own-message；force-delete-message | `apps/meteor/client/components/message/toolbar/useEditMessageAction.ts:18` [读] |
| `perm.call-management` | `call-management` | 房间视频会议入口 | admin, owner, moderator, user | 房间工具 Videoconf；UserInfo 视频呼叫 | hide 图标 | post-readonly（只读房另需） | `apps/meteor/client/hooks/roomActions/useVideoCallRoomAction.ts:26` [读] |
| `perm.can-audit` | `can-audit` | 打开审计消息/安全日志 | admin, auditor | 顶栏 Audit 菜单；/audit 路由 PermissionGuard | hide 菜单+NotAuthorized | can-audit-log；license audit | `apps/meteor/client/startup/audit.tsx:51` [读] |
| `perm.can-audit-log` | `can-audit-log` | 打开审计日志 | admin, auditor-log | 顶栏 Audit logs；/audit-log PermissionGuard | hide 菜单+NotAuthorized | can-audit；license audit | `apps/meteor/client/startup/audit.tsx:62` [读] |
| `perm.clean-channel-history` | `clean-channel-history` | 清理房间历史 | admin | 房间工具 Prune_Messages | hide 工具 | （无） | `apps/meteor/client/hooks/roomActions/useCleanHistoryRoomAction.ts:14` [读] |
| `perm.close-livechat-room` | `close-livechat-room` | 关闭自己的 Livechat 会话 | livechat-manager, livechat-monitor, livechat-agent, admin | Omnichannel 顶栏 Close_chat | hide Close（他人会话还需 close-others） | close-others-livechat-room（OR） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:274` [读] |
| `perm.close-others-livechat-room` | `close-others-livechat-room` | 关闭他人 Livechat 会话 | livechat-manager, livechat-monitor, admin | Omnichannel 顶栏 Close_chat（非自己的房） | hide Close | close-livechat-room（OR） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:275` [读] |
| `perm.create-c` | `create-c` | 创建公开频道 | admin, user, federated-external, bot, app | 顶栏 Create→Channel；Home CreateChannelsCard；改房类型 c；Create 菜单 | hide 入口/锁死类型 | create-p；create-team-channel | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useCreateNewItems.ts:21` [读] |
| `perm.create-d` | `create-d` | 创建/打开 DM | admin, user, federated-external, bot, app | 顶栏 Create→Direct；消息 Reply_in_DM；Admin 用户 Direct；useGoToDirectMessage；/open | hide 入口 | CREATE_ROOM；view-d-room | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useCreateNewItems.ts:23` [读] |
| `perm.create-invite-links` | `create-invite-links` | 管理邀请链接 | admin, owner, moderator | Admin 侧栏 Invites；成员栏 Invite_Link；/admin/invites | hide+NotAuthorizedPage | ADMIN_PERMISSIONS | `apps/meteor/client/views/admin/invites/InvitesRoute.tsx:7` [读] |
| `perm.create-p` | `create-p` | 创建私有组 | admin, user, federated-external, bot, app | 顶栏 Create→Channel 私有；Home 卡片；改房类型 p | hide 入口/锁死类型 | create-c；create-team-group | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useCreateNewItems.ts:21` [读] |
| `perm.create-personal-access-tokens` | `create-personal-access-tokens` | 账户 Personal Access Tokens | admin, user | Account 侧栏 Tokens；/account/tokens | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/account/tokens/AccountTokensRoute.tsx:7` [读] |
| `perm.create-team` | `create-team` | 创建团队；频道转团队 | admin, user | CreateTeamModal；房间信息 Convert_to_team；Create 菜单 Team | hide 入口 | CREATE_TEAM_PERMISSIONS | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateTeamModal.tsx:54` [读] |
| `perm.create-team-channel` | `create-team-channel` | 在团队内建公开频道 | admin, owner, moderator | 团队频道栏 Create；useCreateChannelTypePermission 锁类型 c | hide Create / 锁死类型 | create-team-group（OR） | `apps/meteor/client/hooks/useCreateChannelTypePermission.ts:19` [读] |
| `perm.create-team-group` | `create-team-group` | 在团队内建私有组 | admin, owner, moderator | 团队频道栏 Create；锁类型 p | hide Create / 锁死类型 | create-team-channel（OR） | `apps/meteor/client/hooks/useCreateChannelTypePermission.ts:20` [读] |
| `perm.create-user` | `create-user` | 创建单个用户 | admin | Admin→Users 顶栏 New_user | hide 按钮 | bulk-register-user | `apps/meteor/client/views/admin/users/UsersPageHeaderContent.tsx:18` [读] |
| `perm.delete-c` | `delete-c` | 删除公开频道 | admin, owner | 房间工具 Delete；团队频道项删除 | hide Delete | delete-team-channel（团队频道另需） | `apps/meteor/client/views/hooks/roomActions/useDeleteRoom.tsx:27` [读] |
| `perm.delete-d` | `delete-d` | 删除 DM | admin | 房间工具 Delete（t=d） | hide Delete | （无） | `apps/meteor/client/views/hooks/roomActions/useDeleteRoom.tsx:27` [读] |
| `perm.delete-livechat-contact` | `delete-livechat-contact` | 删除联系人 | livechat-manager, admin | 联系人行菜单 Delete | hide 菜单项 | update-livechat-contact | `apps/meteor/client/views/omnichannel/directory/contacts/ContactItemMenu.tsx:23` [读] |
| `perm.delete-message` | `delete-message` | 删除任意消息/文件 | admin, owner, moderator | 消息 More→Delete；文件栏删除 | hide Delete | delete-own-message；force-delete-message；bypass-time-limit-edit-and-delete | `apps/meteor/client/lib/chats/data.ts:216` [读] |
| `perm.delete-own-message` | `delete-own-message` | 删除自己的消息/文件 | admin, user, federated-external | 消息 More→Delete（作者）；文件栏 | hide Delete | delete-message；force-delete-message | `apps/meteor/client/lib/chats/data.ts:217` [读] |
| `perm.delete-p` | `delete-p` | 删除私有组 | admin, owner | 房间工具 Delete；团队频道项 | hide Delete | delete-team-group | `apps/meteor/client/views/hooks/roomActions/useDeleteRoom.tsx:27` [读] |
| `perm.delete-team-channel` | `delete-team-channel` | 删除团队内公开频道 | admin, owner, moderator | useDeleteRoom / TeamsChannelItem 删除 | hide Delete | delete-c | `apps/meteor/client/views/hooks/roomActions/useDeleteRoom.tsx:28` [读] |
| `perm.delete-team-group` | `delete-team-group` | 删除团队内私有组 | admin, owner, moderator | useDeleteRoom / TeamsChannelItem 删除 | hide Delete | delete-p | `apps/meteor/client/views/hooks/roomActions/useDeleteRoom.tsx:28` [读] |
| `perm.delete-user` | `delete-user` | 删除用户 | admin | Admin→Users 用户菜单 Delete | hide 菜单项 | （无） | `apps/meteor/client/views/admin/users/hooks/useDeleteUserAction.tsx:23` [读] |
| `perm.edit-livechat-room-customfields` | `edit-livechat-room-customfields` | 编辑 Livechat 自定义字段 | livechat-manager, livechat-monitor, livechat-agent, admin | EditContactInfo / RoomEdit / ReviewContactModal 字段 | hide 字段（与 view OR） | view-livechat-room-customfields | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:77` [读] |
| `perm.edit-message` | `edit-message` | 编辑他人消息 | admin, owner, moderator | 消息 More→Edit（非作者） | hide Edit | bypass-time-limit-edit-and-delete；Message_AllowEditing | `apps/meteor/client/components/message/toolbar/useEditMessageAction.ts:16` [读] |
| `perm.edit-omnichannel-contact` | `edit-omnichannel-contact` | 编辑联系人资料（详情栏） | livechat-manager, livechat-agent, admin | ContactInfo 编辑按钮 | hide 编辑 | update-livechat-contact（目录行菜单） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:35` [读] |
| `perm.edit-other-user-active-status` | `edit-other-user-active-status` | 启用/停用用户 | admin | Admin→Users Activate/Deactivate | hide 菜单项 | （无） | `apps/meteor/client/views/admin/users/hooks/useChangeUserStatusAction.ts:13` [读] |
| `perm.edit-other-user-e2ee` | `edit-other-user-e2ee` | 重置他人 E2EE 密钥 | admin | Admin→Users Reset_E2EE | hide 菜单项 | （无） | `apps/meteor/client/views/admin/users/hooks/useResetE2EEKeyAction.tsx:12` [读] |
| `perm.edit-other-user-info` | `edit-other-user-info` | 编辑他人资料 | admin | Admin→Users Edit | hide 菜单项 | （无） | `apps/meteor/client/views/admin/users/hooks/useAdminUserInfoActions.ts:91` [读] |
| `perm.edit-other-user-totp` | `edit-other-user-totp` | 重置他人 TOTP | admin | Admin→Users Reset_TOTP | hide 菜单项 | （无） | `apps/meteor/client/views/admin/users/hooks/useResetTOTPAction.tsx:12` [读] |
| `perm.edit-privileged-setting` | `edit-privileged-setting` | 读写私有设置；改订阅牌面 | admin | SettingsProvider 私有设置集；Admin Settings/AI/Security-privacy；PlanCard 编辑 | 无三权之一则只见公开设置；路由 NotAuthorized | view-privileged-setting；manage-selected-settings（OR） | `apps/meteor/client/providers/SettingsProvider.tsx:24` [读] |
| `perm.edit-room` | `edit-room` | 编辑房间信息；E2EE 开关辅权 | admin, owner, moderator | 房间信息 Edit；E2EE 工具需本权+toggle | hide Edit / E2EE | toggle-room-e2e-encryption | `apps/meteor/client/views/room/contextualBar/Info/hooks/useCanEditRoom.ts:12` [读] |
| `perm.edit-room-retention-policy` | `edit-room-retention-policy` | 编辑房间保留策略字段 | admin | EditRoomInfo 保留策略控件 | hide 字段 | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/useEditRoomPermissions.ts:32` [读] |
| `perm.edit-team-channel` | `edit-team-channel` | 编辑团队/团队频道；自动加入 | admin, owner, moderator | TeamsInfo 编辑；频道项菜单；ToggleAutoJoin；ConvertToChannel | hide 编辑/菜单 | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfoWithData.tsx:14` [读] |
| `perm.export-messages-as-pdf` | `export-messages-as-pdf` | 导出消息为 PDF | admin, user | ExportMessages 格式选项 PDF | hide/disable PDF 选项 | mail-messages（先打开导出栏） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:42` [读] |
| `perm.force-delete-message` | `force-delete-message` | 强制删除（绕过设置/时限/所有权） | admin, owner | canDeleteMessage / 文件删除 | 无此权则走普通删除门 | delete-message；delete-own-message | `apps/meteor/client/lib/chats/data.ts:206` [读] |
| `perm.join-without-join-code` | `join-without-join-code` | 无加入码进入需码频道 | admin, bot, app | Composer 免去 ComposerJoinWithPassword | 无此权且无订阅则显示加入码 composer | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:27` [读] |
| `perm.leave-c` | `leave-c` | 离开公开频道 | admin, user, federated-external, bot, anonymous, app | 房间列表菜单 Leave；房间信息 Leave | hide Leave | leave-p | `apps/meteor/client/hooks/useRoomMenuActions.ts:36` [读] |
| `perm.leave-p` | `leave-p` | 离开私有组 | admin, user, federated-external, bot, anonymous, app | 房间列表菜单 Leave；房间信息 Leave | hide Leave | leave-c | `apps/meteor/client/hooks/useRoomMenuActions.ts:37` [读] |
| `perm.mail-messages` | `mail-messages` | 打开导出消息栏 | admin | 房间工具 Export_Messages | hide 工具 | export-messages-as-pdf | `apps/meteor/client/hooks/roomActions/useExportMessagesRoomAction.ts:11` [读] |
| `perm.manage-abac-admin-room-attributes` | `manage-abac-admin-room-attributes` | ABAC 房间属性 tab | admin | Admin→ABAC room-attributes tab；侧栏 ABAC（OR 四权之一） | hide tab | abac-management（AND） | `apps/meteor/client/views/admin/ABAC/hooks/useABACTabPermissions.ts:10` [读] |
| `perm.manage-abac-admin-rooms` | `manage-abac-admin-rooms` | ABAC 房间 tab | admin | Admin→ABAC rooms tab | hide tab | abac-management（AND） | `apps/meteor/client/views/admin/ABAC/hooks/useABACTabPermissions.ts:11` [读] |
| `perm.manage-abac-admin-settings` | `manage-abac-admin-settings` | ABAC 设置 tab | admin | Admin→ABAC settings tab | hide tab | abac-management（AND） | `apps/meteor/client/views/admin/ABAC/hooks/useABACTabPermissions.ts:9` [读] |
| `perm.manage-apps` | `manage-apps` | 安装/管理应用 | admin | Marketplace 管理动作/Private/Requests；AppsRoute 管理面；orchestrator | hide 管理 UI（浏览仍可用 access-marketplace） | access-marketplace（OR 进 Marketplace） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:20` [读] |
| `perm.manage-cloud` | `manage-cloud` | 订阅/注册/Feature preview | admin | Admin Subscription；Workspace 注册状态；FeaturePreviewRoute；侧栏 Subscription | hide+NotAuthorizedPage | ADMIN_PERMISSIONS | `apps/meteor/client/views/admin/subscription/SubscriptionRoute.tsx:8` [读] |
| `perm.manage-email-inbox` | `manage-email-inbox` | Email Inboxes | admin | Admin 侧栏 Email_Inboxes；/admin/email-inboxes | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxRoute.tsx:7` [读] |
| `perm.manage-emoji` | `manage-emoji` | 自定义 Emoji | admin | Admin Emoji；EmojiPicker 管理入口 | hide+NotAuthorizedPage；picker 无管理钮 | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmojiRoute.tsx:25` [读] |
| `perm.manage-incoming-integrations` | `manage-incoming-integrations` | 管理全部 Incoming webhook | admin | Admin Integrations 页（四权 OR） | hide+NotAuthorizedPage | manage-own-incoming-integrations；outgoing 一对 | `apps/meteor/client/views/admin/integrations/IntegrationsRoute.tsx:14` [读] |
| `perm.manage-livechat-agents` | `manage-livechat-agents` | Omni Agents 页 | livechat-manager, livechat-monitor, admin | Omni 侧栏 Agents；/omnichannel/agents | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsPage.tsx:13` [读] |
| `perm.manage-livechat-canned-responses` | `manage-livechat-canned-responses` | 管理端 Canned Responses 页 | admin, livechat-manager, livechat-monitor | EE Omni 侧栏 Canned；CannedResponsesRoute | hide+NotAuthorizedPage | save-canned-responses（房间内编辑） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesRoute.tsx:7` [读] |
| `perm.manage-livechat-departments` | `manage-livechat-departments` | 部门编辑页 | livechat-manager, livechat-monitor, admin | DepartmentsRoute（侧栏用 view-livechat-departments） | NotAuthorizedPage | view-livechat-departments | `apps/meteor/client/views/omnichannel/departments/DepartmentsRoute.tsx:7` [读] |
| `perm.manage-livechat-managers` | `manage-livechat-managers` | Omni Managers 页 | livechat-manager, admin | Omni 侧栏 Managers；ManagersRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersRoute.tsx:10` [读] |
| `perm.manage-livechat-monitors` | `manage-livechat-monitors` | Omni Monitors 页 | admin, livechat-manager | EE livechat 侧栏 Monitors | hide 侧栏项 | （无） | `apps/meteor/app/livechat-enterprise/client/views/livechatSideNavItems.ts:15` [读] |
| `perm.manage-livechat-priorities` | `manage-livechat-priorities` | 优先级页 | admin, livechat-manager | EE 侧栏 Priorities；PrioritiesRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesRoute.tsx:7` [读] |
| `perm.manage-livechat-sla` | `manage-livechat-sla` | SLA 页 | admin, livechat-manager | EE 侧栏 SLA；SlaRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaRoute.tsx:7` [读] |
| `perm.manage-livechat-tags` | `manage-livechat-tags` | 标签页 | admin, livechat-manager | EE 侧栏 Tags；TagsRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/omnichannel/tags/TagsRoute.tsx:7` [读] |
| `perm.manage-livechat-units` | `manage-livechat-units` | Units 页；部门表 Units 字段 | admin, livechat-manager | EE 侧栏 Units；EditDepartment Units | hide+NotAuthorizedPage；hide 字段 | （无） | `apps/meteor/client/views/omnichannel/units/UnitsRoute.tsx:8` [读] |
| `perm.manage-oauth-apps` | `manage-oauth-apps` | 第三方登录 OAuth apps | admin | Admin Third_party_login；OAuthAppsRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsRoute.tsx:7` [读] |
| `perm.manage-outgoing-integrations` | `manage-outgoing-integrations` | 管理全部 Outgoing webhook | admin | Admin Integrations（四权 OR） | hide+NotAuthorizedPage | manage-own-outgoing-integrations | `apps/meteor/client/views/admin/integrations/IntegrationsRoute.tsx:14` [读] |
| `perm.manage-own-incoming-integrations` | `manage-own-incoming-integrations` | 管理自己的 Incoming | admin | Admin Integrations（四权 OR） | hide+NotAuthorizedPage | manage-incoming-integrations | `apps/meteor/client/views/admin/integrations/IntegrationsRoute.tsx:14` [读] |
| `perm.manage-own-outgoing-integrations` | `manage-own-outgoing-integrations` | 管理自己的 Outgoing | admin | Admin Integrations（四权 OR） | hide+NotAuthorizedPage | manage-outgoing-integrations | `apps/meteor/client/views/admin/integrations/IntegrationsRoute.tsx:14` [读] |
| `perm.manage-selected-settings` | `manage-selected-settings` | 管理被授权的单条设置 | admin | SettingsProvider 私有集；Admin Settings/AI | 无三权之一则只见公开设置 | view-privileged-setting；edit-privileged-setting（OR）。单条设置 id 为开放集 | `apps/meteor/client/providers/SettingsProvider.tsx:24` [读] |
| `perm.manage-sounds` | `manage-sounds` | 自定义声音 | admin | Admin Sounds；CustomSoundsRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsRoute.tsx:7` [读] |
| `perm.manage-user-status` | `manage-user-status` | 自定义用户状态 | admin | Admin User_Status；CustomUserStatusRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:26` [读] |
| `perm.move-room-to-team` | `move-room-to-team` | 把已有房间加入团队 | admin, owner, moderator | 团队频道栏 Add_existing | hide 按钮 | create-team-channel；create-team-group | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannelsWithData.tsx:18` [读] |
| `perm.mute-user` | `mute-user` | 禁言/解除禁言 | admin, owner, moderator | UserInfo Mute/Unmute | hide 菜单项 | post-readonly（只读房判断对方能否发） | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useMuteUserAction.tsx:44` [读] |
| `perm.outbound.can-assign-any-agent` | `outbound.can-assign-any-agent` | 外呼向导指定任意坐席 | admin, livechat-manager, livechat-monitor | OutboundMessageWizard RepliesForm 坐席列表 | 限制可选坐席 | outbound.can-assign-self-only；outbound.send-messages | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/RepliesForm.tsx:50` [读] |
| `perm.outbound.can-assign-queues` | `outbound.can-assign-queues` | 外呼向导指定任意队列 | admin, livechat-manager | RepliesForm 部门/队列 | 限制可选队列 | outbound.send-messages | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/RepliesForm.tsx:48` [读] |
| `perm.outbound.can-assign-self-only` | `outbound.can-assign-self-only` | 外呼只能指定自己 | livechat-agent | RepliesForm 坐席（仅自己） | 限制可选坐席 | outbound.can-assign-any-agent | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/RepliesForm.tsx:49` [读] |
| `perm.outbound.send-messages` | `outbound.send-messages` | 打开发送外呼消息向导 | admin, livechat-manager, livechat-monitor, livechat-agent | OutboundMessageWizard / access hook / providers list | hide/NotAuthorized 向导 | outbound.can-assign-* | `apps/meteor/client/views/omnichannel/components/outboundMessage/hooks/useOutboundMessageAccess.ts:10` [读] |
| `perm.pin-message` | `pin-message` | 钉选/取消钉选消息 | owner, moderator, admin | 消息 More→Pin/Unpin | hide 菜单项 | Message_AllowPinning | `apps/meteor/client/components/message/toolbar/usePinMessageAction.tsx:16` [读] |
| `perm.post-readonly` | `post-readonly` | 只读房仍可发言/反应/开会 | admin, owner, moderator | composer 只读替换；Reaction；Videoconf；文件拖放；UserInfo mute 判断 | 无此权则 composer 只读/隐藏反应 | set-readonly | `apps/meteor/client/views/room/composer/hooks/useMessageComposerIsReadOnly.ts:11` [读] |
| `perm.preview-c-room` | `preview-c-room` | 未加入即可预览公开频道时间线 | admin, user, federated-external, anonymous | RoomBody 消息列表；useOpenRoom 预览路径 | 无此权且未订阅则不渲染时间线/拒开房 | Accounts_AllowAnonymousRead（OR） | `apps/meteor/client/views/room/body/RoomBody.tsx:66` [读] |
| `perm.remove-closed-livechat-room` | `remove-closed-livechat-room` | 删除单条已关闭会话 | livechat-manager, admin | Chats 表行删除 | hide 删除钮 | remove-closed-livechat-rooms | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:37` [读] |
| `perm.remove-closed-livechat-rooms` | `remove-closed-livechat-rooms` | 清空全部已关闭会话 | livechat-manager, livechat-monitor, admin | Chats 过滤栏 Remove_all | hide 按钮 | remove-closed-livechat-room | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableFilter.tsx:20` [读] |
| `perm.remove-team-channel` | `remove-team-channel` | 从团队移除房间 | admin, owner, moderator | 团队频道项 Remove；useRemoveRoomFromTeam | hide 菜单项 | （无） | `apps/meteor/client/views/teams/contextualBar/channels/hooks/useRemoveRoomFromTeam.tsx:12` [读] |
| `perm.remove-user` | `remove-user` | 从房间移除成员；/kick | admin, owner, moderator | UserInfo Remove；slash /kick | hide 菜单；slash-hidden | （无） | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useRemoveUserAction.tsx:45` [读] |
| `perm.request-pdf-transcript` | `request-pdf-transcript` | 发送 PDF 会话记录 | admin, livechat-manager, livechat-monitor, livechat-agent | QuickActions TranscriptPDF；CloseChatModal；Account Omni 偏好 | hide 选项 | send-omnichannel-chat-transcript；license livechat-enterprise | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:273` [读] |
| `perm.run-import` | `run-import` | 数据导入 | admin | Admin Import；ImportRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/import/ImportRoute.tsx:14` [读] |
| `perm.save-all-canned-responses` | `save-all-canned-responses` | 以 manager 范围保存全部 canned | livechat-manager, admin | CannedResponsesTable 视为 manager | 改变可编辑范围（非整页隐藏） | save-canned-responses；view-all-canned-responses | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:34` [读] |
| `perm.save-canned-responses` | `save-canned-responses` | 创建/保存 canned | livechat-agent, livechat-monitor, livechat-manager, admin | 房间 canned 创建；useCanEditCannedResponse | hide 创建/编辑 | save-department-canned-responses（OR 创建） | `apps/meteor/client/views/omnichannel/cannedResponses/hooks/useCanCreateCannedResponse.ts:4` [读] |
| `perm.save-department-canned-responses` | `save-department-canned-responses` | monitor 保存部门 canned | livechat-monitor | Canned 表/表单部门范围；创建权 OR | hide 部门范围/创建 | save-canned-responses | `apps/meteor/client/views/omnichannel/cannedResponses/hooks/useCanCreateCannedResponse.ts:5` [读] |
| `perm.save-others-livechat-room-info` | `save-others-livechat-room-info` | 编辑他人负责的 Livechat 房信息 | livechat-manager, livechat-monitor, admin | ChatInfo 编辑（非订阅且非本坐席时） | 无则 toast Not_authorized | （无；本坐席/订阅可绕过） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:61` [读] |
| `perm.send-omnichannel-chat-transcript` | `send-omnichannel-chat-transcript` | 发送邮件会话记录 | livechat-manager, admin | QuickActions TranscriptEmail；CloseChatModal；Account Omni 偏好 | hide 选项 | request-pdf-transcript | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:271` [读] |
| `perm.set-leader` | `set-leader` | 设/撤房间 leader | admin, owner | UserInfo Set_as_leader | hide 菜单项 | set-owner；set-moderator | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useChangeLeaderAction.ts:29` [读] |
| `perm.set-moderator` | `set-moderator` | 设/撤房间 moderator | admin, owner | UserInfo Set_as_moderator | hide 菜单项 | set-owner；set-leader | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useChangeModeratorAction.tsx:55` [读] |
| `perm.set-owner` | `set-owner` | 设/撤房间 owner | admin, owner | UserInfo Set_as_owner | hide 菜单项 | set-moderator；set-leader | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useChangeOwnerAction.tsx:54` [读] |
| `perm.set-react-when-readonly` | `set-react-when-readonly` | 只读房允许反应开关 | admin, owner | EditRoomInfo React_when_read_only | hide 字段 | set-readonly | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/useEditRoomPermissions.ts:31` [读] |
| `perm.set-readonly` | `set-readonly` | 房间只读开关；创建时只读 | admin, owner | EditRoomInfo Read_only；CreateChannel/TeamModal 只读（scoped owner） | hide 字段 | post-readonly；set-react-when-readonly | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/useEditRoomPermissions.ts:30` [读] |
| `perm.start-discussion` | `start-discussion` | 从自己的消息/composer 开讨论 | admin, user, federated-external, guest, app | 消息 More→Discussion；composer 讨论；Create 菜单 | hide 入口 | start-discussion-other-user（他人消息） | `apps/meteor/client/components/message/toolbar/useNewDiscussionMessageAction.tsx:17` [读] |
| `perm.start-discussion-other-user` | `start-discussion-other-user` | 从他人消息开讨论 | admin, user, federated-external, owner, app | 消息 More→Discussion（他人）；Create 菜单 OR | hide 入口 | start-discussion | `apps/meteor/client/components/message/toolbar/useNewDiscussionMessageAction.tsx:18` [读] |
| `perm.toggle-room-e2e-encryption` | `toggle-room-e2e-encryption` | 开关房间 E2EE | owner, admin | 房间工具 E2EE（另需 edit-room） | hide 工具 | edit-room | `apps/meteor/client/hooks/roomActions/useE2EERoomAction.ts:24` [读] |
| `perm.transfer-livechat-guest` | `transfer-livechat-guest` | 转接访客 | livechat-manager, livechat-monitor, admin | QuickActions ChatForward | hide Forward | （无） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:270` [读] |
| `perm.unarchive-room` | `unarchive-room` | 取消归档 | admin | EditRoomInfo 归档控件（与 archive OR） | hide 控件 | archive-room | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/useEditRoomPermissions.ts:33` [读] |
| `perm.update-livechat-contact` | `update-livechat-contact` | 目录行编辑联系人 | livechat-manager, livechat-monitor, livechat-agent, admin | ContactItemMenu Edit | hide 菜单项 | edit-omnichannel-contact（详情栏） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactItemMenu.tsx:22` [读] |
| `perm.view-abac-admin-audit` | `view-abac-admin-audit` | ABAC 审计日志 tab | admin | Admin→ABAC logs tab | hide tab | abac-management（AND） | `apps/meteor/client/views/admin/ABAC/hooks/useABACTabPermissions.ts:12` [读] |
| `perm.view-all-canned-responses` | `view-all-canned-responses` | 查看/编辑全部 canned 范围 | livechat-manager, admin | Canned 表单 manager 范围；useCanEditCannedResponse | 扩大可见/可编辑范围 | save-all-canned-responses | `apps/meteor/client/views/omnichannel/cannedResponses/hooks/useCanEditCannedResponse.ts:5` [读] |
| `perm.view-all-team-channels` | `view-all-team-channels` | 移出成员时列出其全部团队频道 | admin, owner | RemoveUsersModal 房间列表步 | 无则跳过列表步/看不到房间 | （无） | `apps/meteor/client/views/teams/contextualBar/members/RemoveUsersModal/BaseRemoveUsersModal.tsx:38` [读] |
| `perm.view-broadcast-member-list` | `view-broadcast-member-list` | 广播房查看成员列表 | admin, owner, moderator | 房间工具 Members（广播房） | hide Members | （无；非广播房不查此权） | `apps/meteor/client/hooks/roomActions/useMembersListRoomAction.ts:13` [读] |
| `perm.view-c-room` | `view-c-room` | Directory 频道/团队 tab；/join /open | admin, user, federated-external, bot, app, anonymous | Directory Channels/Teams；slash /join /open | NotAuthorized tab；slash-hidden | view-d-room；view-joined-room | `apps/meteor/client/views/directory/tabs/channels/ChannelsTab.tsx:7` [读] |
| `perm.view-canned-responses` | `view-canned-responses` | 房间 canned 列表查询 | livechat-agent, livechat-monitor, livechat-manager, admin | useCannedResponsesQuery（composer canned） | 不拉列表→composer 无 canned | manage-livechat-canned-responses | `apps/meteor/client/views/room/providers/hooks/useCannedResponsesQuery.ts:15` [读] |
| `perm.view-d-room` | `view-d-room` | Directory 用户 tab（与 view-outside-room AND）；/open | admin, user, federated-external, bot, app, guest | Directory UsersTab；slash /open | NotAuthorizedPage；slash-hidden | view-outside-room（AND） | `apps/meteor/client/views/directory/tabs/users/UsersTab.tsx:12` [读] |
| `perm.view-device-management` | `view-device-management` | 设备管理 | admin | Admin Device_Management；DeviceManagementAdminRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminRoute.tsx:20` [读] |
| `perm.view-engagement-dashboard` | `view-engagement-dashboard` | 参与度仪表盘 | admin | Admin Engagement；EngagementDashboardRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardRoute.tsx:25` [读] |
| `perm.view-federation-data` | `view-federation-data` | 仅作为 Administration 菜单 OR 之一 | admin | 顶栏 Manage→Workspace 出现条件之一（无独立联邦页门） | 无此权且无其他 ADMIN_PERMISSIONS 则整菜单 hide | ADMIN_PERMISSIONS 其余 25 项 | `apps/meteor/client/navbar/NavBarSettingsToolbar/hooks/useAdministrationMenu.ts:14` [读] |
| `perm.view-full-other-user-info` | `view-full-other-user-info` | Directory 用户表更多列 | admin | UsersTable 额外列 | hide 列 | view-outside-room；view-d-room | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:34` [读] |
| `perm.view-joined-room` | `view-joined-room` | /open 命令 OR 之一 | guest, bot, app, anonymous | slash /open 出现 | slash-hidden（仍需数组内任一项） | view-c-room；view-d-room；create-d | `apps/meteor/app/slashcommands-open/client/client.ts:48` [读] |
| `perm.view-l-room` | `view-l-room` | Omnichannel 房间/过滤器/联系人 tab | livechat-manager, livechat-monitor, livechat-agent, admin | OmnichannelProvider；侧栏 Omni 过滤；Contact/Chats tab | hide Omni 能力/tab | view-livechat-queue | `apps/meteor/client/providers/OmnichannelProvider.tsx:57` [读] |
| `perm.view-livechat-analytics` | `view-livechat-analytics` | Omni Analytics 页 | livechat-manager, livechat-monitor, admin | Omni 侧栏 Analytics | hide 侧栏项 | （无） | `apps/meteor/client/views/omnichannel/sidebarItems.tsx:20` [读] |
| `perm.view-livechat-appearance` | `view-livechat-appearance` | 外观页 | livechat-manager, admin | Omni 侧栏 Appearance；AppearancePageContainer | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/omnichannel/appearance/AppearancePageContainer.tsx:24` [读] |
| `perm.view-livechat-business-hours` | `view-livechat-business-hours` | 营业时间页 | livechat-manager, livechat-monitor, admin | Omni 侧栏 Business_Hours | hide 侧栏项 | （无） | `apps/meteor/client/views/omnichannel/sidebarItems.tsx:80` [读] |
| `perm.view-livechat-customfields` | `view-livechat-customfields` | 自定义字段管理页 | livechat-manager, admin | Omni 侧栏 Custom_Fields；CustomFieldsRoute | hide+NotAuthorizedPage | view-livechat-room-customfields（会话内字段） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsRoute.tsx:7` [读] |
| `perm.view-livechat-departments` | `view-livechat-departments` | 部门侧栏入口 | livechat-manager, livechat-monitor, admin | Omni 侧栏 Departments（编辑页另要 manage-livechat-departments） | hide 侧栏项 | manage-livechat-departments | `apps/meteor/client/views/omnichannel/sidebarItems.tsx:44` [读] |
| `perm.view-livechat-installation` | `view-livechat-installation` | 安装代码页 | livechat-manager, admin | Omni 侧栏 Installation | hide 侧栏项 | （无） | `apps/meteor/client/views/omnichannel/sidebarItems.tsx:62` [读] |
| `perm.view-livechat-manager` | `view-livechat-manager` | 顶栏 Manage→Omnichannel | livechat-manager, livechat-monitor, admin | Administration 菜单 Omnichannel 项 | hide 菜单项 | （无；不等于各 Omni 子页权） | `apps/meteor/client/navbar/NavBarSettingsToolbar/hooks/useAdministrationMenu.ts:38` [读] |
| `perm.view-livechat-queue` | `view-livechat-queue` | 排队队列 | livechat-manager, livechat-monitor, livechat-agent, admin | 侧栏 Omni Queue 过滤；SidePanelQueue；OmnichannelProvider | hide Queue | view-l-room | `apps/meteor/client/views/navigation/sidebar/RoomList/OmnichannelFilters.tsx:11` [读] |
| `perm.view-livechat-real-time-monitoring` | `view-livechat-real-time-monitoring` | 实时监控页 | livechat-manager, livechat-monitor, admin | Omni 侧栏 Real_Time_Monitoring | hide 侧栏项 | （无） | `apps/meteor/client/views/omnichannel/sidebarItems.tsx:26` [读] |
| `perm.view-livechat-reports` | `view-livechat-reports` | 报表页 | admin, livechat-manager, livechat-monitor | EE 侧栏 Reports；ReportsPage | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/omnichannel/reports/ReportsPage.tsx:15` [读] |
| `perm.view-livechat-room-customfields` | `view-livechat-room-customfields` | 查看会话/联系人自定义字段 | livechat-manager, livechat-monitor, livechat-agent, admin | Chats 过滤；ContactInfo；Edit 表单（与 edit OR） | hide 字段/过滤 | edit-livechat-room-customfields | `apps/meteor/client/views/omnichannel/directory/chats/ChatsFiltersContextualBar.tsx:33` [读] |
| `perm.view-livechat-rooms` | `view-livechat-rooms` | 查看全部 Livechat 房间（过滤/查询） | livechat-manager, livechat-monitor, admin | ChatsFilters / useChatsQuery 全局过滤 | 缩小查询范围（非整页） | view-omnichannel-contact-center | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/useChatsQuery.ts:28` [读] |
| `perm.view-livechat-triggers` | `view-livechat-triggers` | 触发器页 | livechat-manager, admin | Omni 侧栏 Triggers；TriggersRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersRoute.tsx:7` [读] |
| `perm.view-livechat-webhooks` | `view-livechat-webhooks` | Webhooks 页 | livechat-manager, admin | Omni 侧栏 Webhooks；WebhooksPageContainer | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/omnichannel/webhooks/WebhooksPageContainer.tsx:32` [读] |
| `perm.view-logs` | `view-logs` | 日志/Reports | admin | Admin Analytic-reports / ViewLogsRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/viewLogs/ViewLogsRoute.tsx:7` [读] |
| `perm.view-moderation-console` | `view-moderation-console` | 审核控制台 | admin | Admin Moderation；UserInfo 跳转审核；ModerationConsoleRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleRoute.tsx:12` [读] |
| `perm.view-omnichannel-contact-center` | `view-omnichannel-contact-center` | 联系人中心/目录 | livechat-manager, livechat-agent, livechat-monitor, admin | Omni 侧栏 Contact_Center；OmnichannelDirectoryRouter | hide+NotAuthorizedPage | view-l-room（tab 内） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryRouter.tsx:7` [读] |
| `perm.view-outside-room` | `view-outside-room` | Directory 用户 tab（与 view-d-room AND） | admin, owner, moderator, user, federated-external | UsersTab | NotAuthorizedPage | view-d-room（AND） | `apps/meteor/client/views/directory/tabs/users/UsersTab.tsx:11` [读] |
| `perm.view-privileged-setting` | `view-privileged-setting` | 读私有设置 | admin | SettingsProvider；Admin Settings/AI/Omni security-privacy | 无三权之一则只见公开设置 | edit-privileged-setting；manage-selected-settings（OR） | `apps/meteor/client/providers/SettingsProvider.tsx:24` [读] |
| `perm.view-room-administration` | `view-room-administration` | Admin 房间列表 | admin | Admin Rooms；RoomsRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/rooms/RoomsRoute.tsx:7` [读] |
| `perm.view-statistics` | `view-statistics` | Workspace 信息页 | admin | Admin Workspace；WorkspaceRoute | hide+NotAuthorizedPage | （无） | `apps/meteor/client/views/admin/workspace/WorkspaceRoute.tsx:15` [读] |
| `perm.view-user-administration` | `view-user-administration` | Admin 用户列表；Home 加用户卡 | admin | Admin Users；AdminUsersRoute；Home AddUsersCard | hide+NotAuthorizedPage；hide 卡 | （无） | `apps/meteor/client/views/admin/users/AdminUsersRoute.tsx:7` [读] |

本表数据行：**148**。计数：`rg -c '^\| perm\.'` 对本文件；见闭合判据。

## 4. 非闭集（必须写明，避免误扩）

- **Apps 按钮**：`useApplyButtonFilters.ts:67-68` 对 `button.when.hasAllPermissions` / `hasOnePermission` 做运行时检查。键来自 `/apps/actionButtons`，本树无静态闭集。
- **单条设置权限**：`manage-selected-settings` 打开后，每条 setting 可另有自己的 permission id。客户端不枚举这些 id。
- **`leave-team`**：`useLeaveTeam.tsx:25` 注释，**不**入闭集。
- **仅服务端检查**的 fixtures 键（客户端零引用）不入本册。例：`mention-all` / `mention-here` / `mobile-upload-file` / `view-p-room`（仅 guest 白名单）/ `manage-moderation-actions` / `on-hold-livechat-room`（QuickActions 用 setting+role，不查此键）等。

## 闭合判据

Reviewer 在 **`e519470d35b6caf5b228d81aef41c86aab3051f4`** 上重跑。命令与期望如下。

```bash
# 0. 钉死树
git rev-parse HEAD
# 期望：e519470d35b6caf5b228d81aef41c86aab3051f4

# 1. 本册存在
ls docs/qa/pm-feature-atlas/round-2/07-permissions-impact.md

# 2. 表行 = 唯一 id = 148
rg -c '^\| `perm\.' docs/qa/pm-feature-atlas/round-2/07-permissions-impact.md
rg -o '^\| `perm\.[^`]+`' docs/qa/pm-feature-atlas/round-2/07-permissions-impact.md | sort | uniq | wc -l
# 期望：148 与 148

# 3. Hunch 文件数（与 §2 一致）
rg -l --glob '!**/server/**' --glob '!**/*.spec.*' --glob '!**/*.stories.*' --glob '!**/tests/**' --glob '!**/*.snap' \
  --glob '*.ts' --glob '*.tsx' --glob '*.js' \
  'usePermission' apps/meteor/client apps/meteor/ee/client apps/meteor/app apps/meteor/ee/app \
  packages/ui-client packages/ui-contexts packages/ui-voip | wc -l
# 期望：155

rg -l --glob '!**/server/**' --glob '!**/*.spec.*' --glob '!**/*.stories.*' --glob '!**/tests/**' --glob '!**/*.snap' \
  --glob '*.ts' --glob '*.tsx' --glob '*.js' \
  'useAtLeastOnePermission' apps/meteor/client apps/meteor/ee/client apps/meteor/app apps/meteor/ee/app \
  packages/ui-client packages/ui-contexts | wc -l
# 期望：14

rg -l --glob '!**/server/**' --glob '!**/*.spec.*' --glob '!**/*.stories.*' --glob '!**/tests/**' --glob '!**/*.snap' \
  --glob '*.ts' --glob '*.tsx' --glob '*.js' \
  'hasPermission' apps/meteor/client apps/meteor/ee/client apps/meteor/app apps/meteor/ee/app \
  packages/ui-client packages/ui-contexts | wc -l
# 期望：34

rg -n --glob '!**/server/**' --glob '!**/*.spec.*' --glob '!**/*.stories.*' --glob '!**/tests/**' \
  --glob '*.ts' --glob '*.tsx' 'permission-' apps/meteor/client apps/meteor/ee/client apps/meteor/app packages
# 期望：DeviceProvider.tsx:96 + AppPermissions.ts 注释 2 行；0 个 RC 权限键

# 4. 抽键验算（直接参数 + 传入 API 的具名数组；跳过 // 注释）
python3 - <<'PY'
import re, pathlib
ROOT=pathlib.Path('.')
API=re.compile(r'(?:usePermission(?:WithScopedRoles)?|useAtLeastOnePermission|useAllPermissions|hasPermission|hasAllPermission|hasAtLeastOnePermission)\s*\(')
STR=re.compile(r"['\"]([a-z][a-z0-9._-]*?)['\"]")
KEY=re.compile(r'^[a-z][a-z0-9]+(?:[-.][a-z0-9]+)+$')
ARR=re.compile(r'(?:const|let)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\[([^\]]+)\]')
TPL={'delete-${':['delete-c','delete-p','delete-d'],'delete-team-${':['delete-team-channel','delete-team-group']}
roots=['apps/meteor/client','apps/meteor/ee/client','apps/meteor/app','apps/meteor/ee/app','packages/ui-client']
skip=('.spec.ts','.spec.tsx','.stories.ts','.stories.tsx','.snap')
keys=set()
for root in roots:
    p=ROOT/root
    if not p.exists():
        continue
    for f in p.rglob('*'):
        if not f.is_file() or f.suffix not in {'.ts','.tsx','.js'} or str(f).endswith(skip):
            continue
        if 'server' in f.parts or 'tests' in f.parts: continue
        if ('/app/' in str(f) or '/ee/app/' in str(f)) and '/client/' not in str(f): continue
        t=f.read_text(errors='replace')
        named={n:[s for s in STR.findall(b) if KEY.fullmatch(s)] for n,b in ARR.findall(t)}
        for m in API.finditer(t):
            line=t.rfind('\n',0,m.start())
            if t[line+1:m.start()].lstrip().startswith('//'): continue
            arg=t[m.end():m.end()+800]
            head=arg.split(')')[0] if ')' in arg else arg
            for s in STR.findall(head):
                if KEY.fullmatch(s): keys.add(s)
            ident=head.strip().split(',')[0].strip()
            if ident in named: keys.update(named[ident])
            for pref,exp in TPL.items():
                if pref in arg: keys.update(exp)
        if 'slashCommands.add' in t or '/slashcommands' in str(f):
            for sm in re.finditer(r"permission\s*:\s*(?:\[([^\]]+)\]|['\"]([a-z0-9._-]+)['\"])", t):
                body=sm.group(1) or sm.group(2)
                for s in STR.findall(body) if sm.group(1) else [body]:
                    if KEY.fullmatch(s): keys.add(s)
        for gm in re.finditer(r"PermissionGuard\s+permission=['\"]([a-z0-9._-]+)['\"]", t):
            keys.add(gm.group(1))
print('COUNT', len(keys))
doc=(ROOT/'docs/qa/pm-feature-atlas/round-2/07-permissions-impact.md').read_text()
table=set(re.findall(r'^\| `perm\.([^`]+)`', doc, re.M))
print('TABLE', len(table), 'SYMDIFF', sorted(keys^table))
PY
# 期望：COUNT 148；TABLE 148；SYMDIFF []
```

### 验算

| 量 | 期望 | 本册 |
| --- | --- | --- |
| `git rev-parse HEAD` | `e519470d35b6caf5b228d81aef41c86aab3051f4` | 写作时已钉 |
| 表数据行（§闭合判据 #2 的 `rg -c`） | 148 | 148 |
| 唯一 `perm.*` id | 148 | 148 |
| 抽键闭集 | 148 | 148（不含注释 `leave-team`） |
| `usePermission` files | 155 | 155 |
| `useAtLeastOnePermission` files | 14 | 14 |
| `hasPermission` files | 34 | 34 |
| `permission-` → RC 键 | 0 | 0 |
| 表内 fixtures 无 / 空 | 1 空（`add-user-to-any-p-room`） | 已标 |
| `[读]` 行 | 每数据行 | 每行出处列 |

148 = 148 = 148。Hunch 计数与抽键一致。

