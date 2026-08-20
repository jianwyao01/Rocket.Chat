# 分册 04 — 路由注册目的地与壳层页面

本文件只收录 **路由注册面上、用户可感知的目的地**。不实现产品功能。未开浏览器；凡界面可见性、点击是否生效、侧栏是否替换，一律标 `[待渲染实测]`。从源码读到的路径、权限、设置、URL 标 `[读]`。

**本册不做：** 消息工具条、房间 toolbox / contextual bar、用户卡片、composer、隐式房间交互（进房、订阅、已读）。顶栏（navbar）控件本身交其他分册；**仅当路由本身就是功能、否则会漏** 才写行。

**本册不做展开：** 管理后台设置字段、全渠道坐席控制台内部页、市场 App 详情/安装页。这些只保留侧栏/顶栏入口一行，细节见 `05-completeness.md` Out of scope。

**现行 atlas：** `baseline: empty`（本仓库 `docs/qa/pm-feature-atlas/` 此前无分册；`rg`/`find` 无既有 feature-atlas 文件）。

**id 命名空间：** `route.*`、`account.*`、`directory.*`、`team.*`。

## 列约定

| 列 | 含义 |
|---|---|
| 稳定语义 id | 本册唯一；不复用他册未证实的 id |
| 功能一句话 | 用户能完成的一件事 |
| 完整入口点击序列 | 从可见控件到目的地；可复放 |
| 门控 | 权限 / 设置 / 许可证；未验证的标 `[待渲染实测]` |
| 触发后果三件套 | `界面 / 导航 / 持久化` |
| 供给 | `core` 或 `EE:<module>` |
| 关联 | 本册已知 id；不假装他册已有行 |
| 出处 | `path:line` + `[读]` |

空行、占位行、未读源码的臆造入口禁止。

---

## 1. 登录 / 注册 / 向导

`/login` 路由本身立刻 `navigate('/home')`（`apps/meteor/client/startup/routes.tsx:136-142` `[读]`）。用户看见的登录页是 `MainLayout` → `AuthenticationCheck` 在无用户时渲染的 `LoginPage`，不是 `/login` 这个 URL。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `route.login` | 未登录用户打开登录表单并用账号密码（或登录服务）进入工作区 | ① 未登录访问需认证页（默认落到 `LoginPage`）② 或匿名可读时点顶栏 `Login`（`setForceLogin(true)`）③ 表单填用户名/邮箱+密码 → 提交 | 无用户；`Accounts_ShowFormLogin` 控制表单区；`Accounts_AllowAnonymousRead` 为真且未 `forceLogin` 时先不挡内容 `[读]` | 界面: 登录表单 `[待渲染实测]` ／ 导航: URL 仍常是 `/home` 而非 `/login` `[读]` ／ 持久化: 成功则建立会话；失败 toast/字段错误 `[待渲染实测]` | core | `route.register` `route.forgot-password` | `AuthenticationCheck.tsx:20-41` `LoginPage.tsx` `LoginForm.tsx:59-251` `NavBarItemLoginPage.tsx:8-16` `[读]` |
| `route.register` | 在登录壳内切到「创建账号」并提交注册 | 登录页页脚 `New here?` → `Create an account`（`setLoginRoute('register')`） | `Accounts_RegistrationForm`：`Public` 才走公开注册；`Secret URL` 时公开入口显示禁用页；`Disabled` 禁用 `[读]` | 界面: 注册表单或禁用说明 `[待渲染实测]` ／ 导航: 仍无独立 Meteor path，是登录壳内状态 `[读]` ／ 持久化: 成功则建用户+会话 `[待渲染实测]` | core | `route.login` `route.register-secret-url` | `LoginForm.tsx:242-246` `RegisterSecretPageRouter.tsx:21-50` `[读]` |
| `route.forgot-password` | 在登录壳内申请密码重置邮件 | 登录页密码字段下 `Forgot your password?` | `Accounts_PasswordReset`（默认 true）为假则链不渲染 `[读]` | 界面: 重置密码邮箱表单 `[待渲染实测]` ／ 导航: 登录壳内 `reset-password` 状态 `[读]` ／ 持久化: 发重置邮件，不立刻改密 `[待渲染实测]` | core | `route.reset-password` `route.login` | `LoginForm.tsx:88,219-229` `RegistrationPageRouter.tsx:36-41` `[读]` |
| `route.reset-password` | 用邮件里的 token 打开重置页并设置新密码 | 打开邮件链接 `/reset-password/:token` → 提交新密码 | 公开路由；token 无效时的 UI `[待渲染实测]` | 界面: `ResetPasswordPage` `[待渲染实测]` ／ 导航: `/reset-password/:token` `[读]` ／ 持久化: 更新密码并通常转入登录 `[待渲染实测]` | core | `route.forgot-password` | `startup/routes.tsx:230-233` `@rocket.chat/web-ui-registration` `[读]` |
| `route.setup-wizard` | 首次部署向导（组织/管理员） | 无用户且 `Show_Setup_Wizard==='pending'`，或 admin 且 `==='in_progress'` 时自动跳 `/setup-wizard`；完成后不可再进 | `Show_Setup_Wizard` ∈ {pending,in_progress,completed}；完成后/非 admin 被锁回 `/home` `[读]` | 界面: `SetupWizardRoute` 分步页（不经 `MainLayout`）`[待渲染实测]` ／ 导航: `/setup-wizard/:step?` `[读]` ／ 持久化: 写工作区设置并把向导标完成 `[待渲染实测]` | core | `route.login` `route.home` | `startup/routes.tsx:215-218` `useRedirectToSetupWizard.ts:4-16` `packages/ui-client/.../useRouteLock.ts` `[读]` |
| `route.token-login` | 用一次性 login token 静默登录 | 打开 `/login-token/:token`（邮件/外链） | 公开；token 失败则 `navigate('/')` `[读]` | 界面: 无自有 UI（`return null`）`[读]` ／ 导航: 成功后 `/` `[读]` ／ 持久化: 建立会话 `[待渲染实测]` | core | `route.login` | `startup/routes.tsx:225-228` `LoginTokenRoute.tsx:4-15` `[读]` |

---

## 2. 已登录壳层目的地

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `route.home` | 打开工作区 Home（欢迎卡或自定义首页） | 桌面顶栏 Home 图标；或平板 `Pages` 堆叠菜单 → Home；登录后无 `defaultRoom` 时 `/` 也会落到 `/home` | 顶栏按钮：`Layout_Show_Home_Button`；页体：`Layout_Custom_Body_Only` 为真则只渲染自定义 Home `[读]` | 界面: 欢迎文案+卡片（加用户/建频道/目录/客户端/文档）或自定义 HTML `[待渲染实测]` ／ 导航: `/home` `[读]` ／ 持久化: 打开本身不写库 `[读]` | core | `route.directory` `directory.channels` | `startup/routes.tsx:149-156` `NavBarItemHomePage.tsx:8-22` `HomePage.tsx:6-13` `DefaultHomePage.tsx:16-48` `IndexRoute.tsx:12-28` `[读]` |
| `route.directory` | 打开目录页（再按默认 tab 纠正 URL） | 桌面顶栏 Directory 图标；或 Home 卡 `Open directory`；或直达 `/directory` | 页本身无权限门；无 tab / `external` 且联邦关则 replace 到 `Accounts_Directory_DefaultView`（默认 `users`）`[读]` | 界面: 标题 Directory + 四个潜在 tab `[待渲染实测]` ／ 导航: `/directory` → `/directory/{defaultTab}` `[读]` ／ 持久化: 无 `[读]` | core | `directory.users` `directory.channels` `directory.teams` | `startup/routes.tsx:158-165` `NavBarItemDirectoryPage.tsx:10-24` `DirectoryPage.tsx:13-35` `JoinRoomsCard.tsx:11-22` `[读]` |
| `route.search` | 打开智能搜索结果页（跨房间来源+可选 AI 摘要） | 顶栏搜索（feature preview `aiSearch`）→ `View all results` → `/search?q=…` | 许可 `AI_LICENSE_MODULE` + preview `aiSearch` + 设置 `AI_Intelligent_Search_Enabled`；缺许可/开关时页上仍有 upsell/警告 `[读]` | 界面: `Intelligent_Search` 页、来源列表、可选生成答案 `[待渲染实测]` ／ 导航: `/search?q=` `[读]` ／ 持久化: 查询不写库；生成答案走 AI `[待渲染实测]` | EE:AI 许可模块（无许可仍能打开页看 upsell） | — | `startup/routes.tsx:259-266` `SearchPage.tsx:15-22,68-161` `[读]` |
| `route.call-history` | 打开语音通话历史页 | 顶栏 VoIP 组时钟图标 `Call_history`；行点击进 `/call-history/details/:id` | 顶栏组：`useMediaCallAction()` 为空则整组不渲染（EE `teams-voip` + 语音权限）`[读]`；路由始终注册 | 界面: 通话历史表；详情 contextual bar `[待渲染实测]` ／ 导航: `/call-history/:tab?/:historyId?` `[读]` ／ 持久化: `GET /v1/call-history.list` 只读 `[读]` | EE:teams-voip（入口）；路由 core 注册 | — | `startup/routes.tsx:250-257` `NavBarVoipGroup.tsx:10-23` `CallHistoryPage.tsx` `[读]` |
| `route.not-found` | 未匹配路径显示 404 | 访问未注册 path（`*`） | 无 | 界面: `NotFoundPage` `[待渲染实测]` ／ 导航: 任意未匹配 URL `[读]` ／ 持久化: 无 `[读]` | core | — | `startup/routes.tsx:268-271` `[读]` |

`/`（`index`）只做跳转：未登录 → `/home`；已登录有 `user.defaultRoom` → 该房间路由，否则 `/home`。**不单列**，避免空壳行。声明了但未 `defineRoutes` 的 `/meet/:rid` 见边界。

---

## 3. `directory.*`

`federationEnabled` 在源码写死 `false`（`DirectoryPage.tsx:17` `[读]`），External 页签当前不可见。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `directory.channels` | 在目录里浏览/搜索频道并点进房间 | `route.directory` → 点 `Channels` 页签 → 表格行 | tab：`view-c-room`，否则 `NotAuthorizedPage` `[读]` | 界面: 频道表；无权限则未授权页 `[待渲染实测]` ／ 导航: `/directory/channels` `[读]` ／ 持久化: `GET /v1/directory` 只读；行点击进 `/channel/:name` 或 `/group/:name`（进房交房间分册）`[待渲染实测]` | core | `route.directory` | `DirectoryPage.tsx:43-59` `ChannelsTab.tsx:6-13` `[读]` |
| `directory.users` | 在目录里浏览/搜索用户并开 DM | `route.directory` → 点 `Users` 页签 → 表格行 | `view-outside-room` **且** `view-d-room`；邮箱列另需 `view-full-other-user-info` `[读]` | 界面: 用户表 `[待渲染实测]` ／ 导航: `/directory/users` `[读]` ／ 持久化: 只读列表；行点击走 `direct` 房间（交房间分册）`[待渲染实测]` | core | `route.directory` | `DirectoryPage.tsx:46-60` `UsersTab.tsx:10-18` `[读]` |
| `directory.teams` | 在目录里浏览/搜索团队并打开团队主房间 | `route.directory` → 点 `Teams` 页签 → 表格行 | `view-c-room` `[读]` | 界面: 团队表 `[待渲染实测]` ／ 导航: `/directory/teams` `[读]` ／ 持久化: 只读；行点击进团队主房间 `channel`/`group`（交房间分册）`[待渲染实测]` | core | `route.directory` `team.create` | `DirectoryPage.tsx:49-61` `TeamsTab.tsx:6-13` `[读]` |
| `directory.external` | 联邦「外部用户」目录页签 | 源码在 `federationEnabled===true` 时才渲染页签；**当前写死 false** | 与 `directory.users` 相同权限，外加联邦开关 `[读]` | 界面: 当前不渲染页签 `[读]` ／ 导航: 若 tab=external 会被 replace 回默认 tab `[读]` ／ 持久化: 无 `[读]` | core（联邦旧实现已移除） | `directory.users` | `DirectoryPage.tsx:17,30-32,52-62` `[读]` |

---

## 4. `account.*`

`/account`（`account-index`）replace 到 `/account/profile`（`AccountRouter.tsx:16-24` `[读]`）。侧栏由 `AccountSidebar` 经 portal 替换房间列表 `[读]`。顶栏用户菜单只直达 Profile / Preferences / Accessibility /（条件）Feature preview。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `account.profile` | 打开并编辑自己的资料（名/用户名/邮箱/头像；可登出其他端、删号） | 顶栏头像 → `Profile`（`/account`→profile）；或账号侧栏 `Profile` | 侧栏：`Accounts_AllowUserProfileChange`（peek 默认 true）；删号：`Accounts_AllowDeleteOwnAccount` `[读]` | 界面: Profile 页+账号侧栏 `[待渲染实测]` ／ 导航: `/account/profile` `[读]` ／ 持久化: 保存写用户文档；登出其他端/删号有确认框 `[待渲染实测]` | core | `account.security` | `account/routes.tsx:57-59` `sidebarItems.tsx:13-17` `useAccountItems.tsx:14-47` `AccountProfilePage.tsx:25+` `[读]` |
| `account.preferences` | 打开并保存个人偏好（通知/声音/消息/本地化/高亮/在线；可选导出「我的数据」） | 顶栏头像 → `Preferences`；或账号侧栏 `Preferences` | 侧栏无门控；「我的数据」：`UserData_EnableDownload` `[读]` | 界面: 手风琴分区+Save `[待渲染实测]` ／ 导航: `/account/preferences` `[读]` ／ 持久化: Save → `POST /v1/users.setPreferences`；打开不写 `[读]` | core | `account.accessibility-and-appearance` | `account/routes.tsx:52-54` `sidebarItems.tsx:19-22` `AccountPreferencesPage.tsx:20-69` `[读]` |
| `account.security` | 打开安全页：改密 / TOTP / 邮件 2FA / E2E 口令 | 账号侧栏 `Security`（用户菜单无此项） | 侧栏 OR：`Accounts_TwoFactorAuthentication_Enabled`（默认 true）\| `E2E_Enable`（默认 false）\| `Accounts_AllowPasswordChange`（默认 true）；分区再按对应设置裁剪 `[读]` | 界面: Security 手风琴 `[待渲染实测]` ／ 导航: `/account/security` `[读]` ／ 持久化: 改密/启用 2FA/E2E 各走对应 API `[待渲染实测]` | core | `account.profile` | `account/routes.tsx:62-64` `sidebarItems.tsx:24-31` `AccountSecurityPage.tsx:15-41` `[读]` |
| `account.integrations` | 查看并移除已关联的 WebDAV 账号 | 账号侧栏 `Integrations` | `Webdav_Integration_Enabled`（默认 false，侧栏 peek）`[读]` | 界面: 选择 WebDAV 账号并 Remove `[待渲染实测]` ／ 导航: `/account/integrations` `[读]` ／ 持久化: 删除 WebDAV 集成记录 `[待渲染实测]` | core | — | `account/routes.tsx:67-69` `sidebarItems.tsx:33-37` `AccountIntegrationsPage.tsx:14+` `[读]` |
| `account.tokens` | 创建/撤销个人访问令牌 | 账号侧栏 `Personal_Access_Tokens` | 权限 `create-personal-access-tokens` `[读]` | 界面: PAT 表 `[待渲染实测]` ／ 导航: `/account/tokens` `[读]` ／ 持久化: 创建/撤销 token `[待渲染实测]` | core | — | `account/routes.tsx:72-74` `sidebarItems.tsx:39-43` `AccountTokensPage.tsx:6-16` `[读]` |
| `account.omnichannel` | 保存坐席侧全渠道偏好（关单后隐藏会话、PDF/邮件 transcript） | 账号侧栏 `Omnichannel` | `send-omnichannel-chat-transcript` OR `request-pdf-transcript` `[读]` | 界面: Omnichannel 偏好页 `[待渲染实测]` ／ 导航: `/account/omnichannel` `[读]` ／ 持久化: Save → `POST /v1/users.setPreferences` `[读]` | core（transcript 能力常随全渠道） | `route.omnichannel` | `account/routes.tsx:77-79` `sidebarItems.tsx:45-49` `OmnichannelPreferencesPage.tsx:14-37` `[读]` |
| `account.feature-preview` | 开关实验功能（如 secondary sidebar、aiSearch） | 顶栏头像 → `Feature_preview`（有未读徽标时）；或账号侧栏 | `Accounts_AllowFeaturePreview` 且 `defaultFeaturesPreview.length>0` `[读]` | 界面: 功能预览开关列表 `[待渲染实测]` ／ 导航: `/account/feature-preview` `[读]` ／ 持久化: `POST /v1/users.setPreferences`；打开时若有 unseen 会记已读 `[读]` | core | `route.search` `route.admin.feature-preview` | `account/routes.tsx:82-84` `sidebarItems.tsx:51-56` `useAccountItems.tsx:20-60` `AccountFeaturePreviewPage.tsx:28-40` `[读]` |
| `account.accessibility-and-appearance` | 改主题、字号、时间格式、是否显示角色 | 顶栏头像 → `Accessibility_and_Appearance`；或账号侧栏 | 侧栏无门控；角色显示受 `UI_DisplayRoles` `[读]` | 界面: 无障碍与外观页 `[待渲染实测]` ／ 导航: `/account/accessibility-and-appearance` `[读]` ／ 持久化: Save → `users.setPreferences`；字号会写 style 元素 `[待渲染实测]` | core | `account.preferences` | `account/routes.tsx:87-89` `sidebarItems.tsx:58-61` `AccessibilityPage.tsx:30-37` `[读]` |
| `account.manage-devices` | 查看并登出自己的登录设备/会话 | 账号侧栏 `Manage_Devices`（许可证开启后才注册） | EE 模块 `device-management`（`onToggledFeature` 注册路由+侧栏）`[读]` | 界面: 设备表 `[待渲染实测]` ／ 导航: `/account/manage-devices` `[读]` ／ 持久化: 登出所选会话 `[待渲染实测]` | EE:device-management | `route.admin.device-management` | `startup/deviceManagement.ts:15-32` `DeviceManagementAccountPage.tsx:6-16` `[读]` |

---

## 5. `team.*`

**没有** `/teams` 路由。团队主房间复用 `channel`/`group`。团队信息/频道/离开/删除/转频道是房间 toolbox，交其他分册。本册只写：目录浏览（上表 `directory.teams`）以及 **否则会漏的创建团队**（顶栏 `+` 菜单，无独立 route）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `team.create` | 用顶栏「新建」打开创建团队模态并建出团队主房间 | 顶栏 `+`（Create new）→ `Team` → 填名称等 → 提交 | 菜单项：`create-team` **且** (`create-c` OR `create-p`)；提交按钮再检 `create-team` `[读]` | 界面: `CreateTeamModal` `[待渲染实测]` ／ 导航: 成功后进入新团队主房间 URL（`channel`/`group`）`[待渲染实测]` ／ 持久化: 创建 team + 主房间 `[待渲染实测]` | core | `directory.teams` | `useCreateNewItems.ts:13-76` `CreateTeamModal.tsx:54,118+` `[读]` |

---

## 6. 管理后台 — HOME + 侧栏项（不展开字段）

顶栏 `Manage`（齿轮）→ `Workspace` 进 `/admin`。`admin-index` 会 replace 到侧栏里 **第一个 `permissionGranted()` 为真的项**，否则 `/admin/workspace`（`AdministrationRouter.tsx:31-46` `[读]`）。侧栏头是 i18n `Administration`，**没有**单独的 Home 导航项。

`ADMIN_PERMISSIONS`（25 项）任一为真才出现 Workspace 菜单项（`useAdministrationMenu.ts:5-38` `[读]`）。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `route.admin.home` | 打开管理后台壳并落到第一个有权侧栏页 | 顶栏 `Manage` → `Workspace` | `useAtLeastOnePermission(ADMIN_PERMISSIONS)` `[读]` | 界面: 管理侧栏+默认页 `[待渲染实测]` ／ 导航: `/admin` → 第一有权 href（常 `/admin/info`）`[读]` ／ 持久化: 无 `[读]` | core | `route.admin.workspace` | `useAdministrationMenu.ts:33-44` `AdministrationRouter.tsx:31-46` `admin/routes.tsx:118-122` `[读]` |
| `route.admin.workspace` | 打开工作区统计/信息页 | `route.admin.home` 或管理侧栏 `Workspace` | `view-statistics`；侧栏 href 是 `/admin/info`（deprecated fallback），另有 `/admin/workspace` `[读]` | 界面: Workspace 页 `[待渲染实测]` ／ 导航: `/admin/info` 或 `/admin/workspace` `[读]` ／ 持久化: 只读统计 `[待渲染实测]` | core | `route.admin.home` | `sidebarItems.ts:12-17` `admin/routes.tsx:129-137` `[读]` |
| `route.admin.subscription` | 打开订阅/Cloud 页 | 管理侧栏 `Subscription` | `manage-cloud` `[读]` | 界面: Subscription 页 `[待渲染实测]` ／ 导航: `/admin/subscription` `[读]` ／ 持久化: 以页内操作为准，本行只覆盖打开 `[待渲染实测]` | core | — | `sidebarItems.ts:18-23` `admin/routes.tsx:244-246` `[读]` |
| `route.admin.engagement` | 打开参与度仪表盘 | 管理侧栏 `Engagement` | 侧栏 `view-engagement-dashboard`；缺 EE 模块 `engagement-dashboard` 时路由层 upsell `[读]` | 界面: Engagement 或 upsell `[待渲染实测]` ／ 导航: `/admin/engagement/users`（侧栏）`[读]` ／ 持久化: 只读 `[待渲染实测]` | EE:engagement-dashboard（完整数据） | — | `sidebarItems.ts:24-29` `admin/routes.tsx:234-236` `[读]` |
| `route.admin.moderation` | 打开内容审核控制台 | 管理侧栏 `Moderation`（标 Beta） | `view-moderation-console` `[读]` | 界面: Moderation 页 `[待渲染实测]` ／ 导航: `/admin/moderation` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | — | `sidebarItems.ts:30-36` `admin/routes.tsx:229-231` `[读]` |
| `route.admin.rooms` | 打开房间管理列表 | 管理侧栏 `Rooms` | `view-room-administration` `[读]` | 界面: 房间管理 `[待渲染实测]` ／ 导航: `/admin/rooms` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | — | `sidebarItems.ts:37-42` `admin/routes.tsx:194-196` `[读]` |
| `route.admin.users` | 打开用户管理列表 | 管理侧栏 `Users` | `view-user-administration` `[读]` | 界面: 用户管理 `[待渲染实测]` ／ 导航: `/admin/users` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | `account.profile` | `sidebarItems.ts:43-48` `admin/routes.tsx:189-191` `[读]` |
| `route.admin.ai-center` | 打开 AI Center | 管理侧栏 `AI_Center`（标 Beta） | 侧栏：`view-privileged-setting` OR `edit-privileged-setting` OR `manage-selected-settings`；页内另检 AI 许可 `[读]` | 界面: AI Center 或许可提示 `[待渲染实测]` ／ 导航: `/admin/ai-center` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | EE:AI（页内） | `route.search` | `sidebarItems.ts:49-56` `admin/routes.tsx:199-201` `[读]` |
| `route.admin.invites` | 打开邀请链接管理 | 管理侧栏 `Invites` | `create-invite-links` `[读]` | 界面: Invites 页 `[待渲染实测]` ／ 导航: `/admin/invites` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | `route.invite` | `sidebarItems.ts:57-62` `admin/routes.tsx:204-206` `[读]` |
| `route.admin.user-status` | 打开自定义用户状态 | 管理侧栏 `User_Status` | `manage-user-status` `[读]` | 界面: 自定义状态列表 `[待渲染实测]` ／ 导航: `/admin/user-status` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | — | `sidebarItems.ts:63-68` `admin/routes.tsx:179-181` `[读]` |
| `route.admin.permissions` | 打开权限/角色页 | 管理侧栏 `Permissions` | `access-permissions` OR `access-setting-permissions` `[读]` | 界面: 权限矩阵 `[待渲染实测]` ／ 导航: `/admin/permissions` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core（自定义角色另要 EE `custom-roles`） | — | `sidebarItems.ts:69-74` `admin/routes.tsx:214-216` `[读]` |
| `route.admin.abac` | 打开 ABAC 管理 | 管理侧栏 `ABAC` | `abac-management` 且（`manage-abac-admin-settings` OR `manage-abac-admin-room-attributes` OR `manage-abac-admin-rooms` OR `view-abac-admin-audit`）；路由要 EE `abac` `[读]` | 界面: ABAC 页或未授权 `[待渲染实测]` ／ 导航: `/admin/ABAC` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | EE:abac | — | `sidebarItems.ts:75-87` `admin/routes.tsx:254-256` `[读]` |
| `route.admin.device-management` | 打开全工作区设备管理 | 管理侧栏 `Device_Management` | 侧栏 `view-device-management`；缺模块时 upsell `[读]` | 界面: 设备管理或 upsell `[待渲染实测]` ／ 导航: `/admin/device-management` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | EE:device-management | `account.manage-devices` | `sidebarItems.ts:88-93` `admin/routes.tsx:239-241` `[读]` |
| `route.admin.email-inboxes` | 打开 Email Inbox 管理 | 管理侧栏 `Email_Inboxes`（标 Alpha） | `manage-email-inbox` `[读]` | 界面: Email Inboxes `[待渲染实测]` ／ 导航: `/admin/email-inboxes` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | — | `sidebarItems.ts:94-100` `admin/routes.tsx:219-221` `[读]` |
| `route.admin.mailer` | 打开工作区群发邮件 | 管理侧栏 `Mailer` | `access-mailer`（`hasAllPermission`）`[读]` | 界面: Mailer 页 `[待渲染实测]` ／ 导航: `/admin/mailer` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | `route.mailer-unsubscribe` | `sidebarItems.ts:101-106` `admin/routes.tsx:164-166` `[读]` |
| `route.admin.third-party-login` | 打开第三方 OAuth 应用管理 | 管理侧栏 `Third_party_login` | `manage-oauth-apps` `[读]` | 界面: OAuth apps `[待渲染实测]` ／ 导航: `/admin/third-party-login` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | `route.oauth-authorize` | `sidebarItems.ts:107-112` `admin/routes.tsx:169-171` `[读]` |
| `route.admin.integrations` | 打开传入/传出集成 | 管理侧栏 `Integrations` | `manage-outgoing-integrations` OR `manage-own-outgoing-integrations` OR `manage-incoming-integrations` OR `manage-own-incoming-integrations` `[读]` | 界面: Integrations `[待渲染实测]` ／ 导航: `/admin/integrations` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | `account.integrations` | `sidebarItems.ts:113-124` `admin/routes.tsx:174-176` `[读]` |
| `route.admin.import` | 打开导入历史/向导入口 | 管理侧栏 `Import` | `run-import` `[读]` | 界面: Import 历史（子路由 new/prepare/progress 不展开）`[待渲染实测]` ／ 导航: `/admin/import` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | — | `sidebarItems.ts:125-130` `admin/routes.tsx:140-161` `[读]` |
| `route.admin.reports` | 打开日志/分析报告 | 管理侧栏 `Reports` | `view-logs` `[读]` | 界面: View logs / analytic reports `[待渲染实测]` ／ 导航: `/admin/analytic-reports` `[读]` ／ 持久化: 只读 `[待渲染实测]` | core | — | `sidebarItems.ts:131-136` `admin/routes.tsx:209-211` `[读]` |
| `route.admin.sounds` | 打开自定义声音 | 管理侧栏 `Sounds` | `manage-sounds` `[读]` | 界面: Custom sounds `[待渲染实测]` ／ 导航: `/admin/sounds` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | — | `sidebarItems.ts:137-142` `admin/routes.tsx:124-126` `[读]` |
| `route.admin.emoji` | 打开自定义 emoji | 管理侧栏 `Emoji` | `manage-emoji` `[读]` | 界面: Custom emoji `[待渲染实测]` ／ 导航: `/admin/emoji` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | — | `sidebarItems.ts:143-148` `admin/routes.tsx:184-186` `[读]` |
| `route.admin.feature-preview` | 打开工作区级功能预览 | 管理侧栏 `Feature_preview` | 侧栏：`defaultFeaturesPreview.length>0`；路由另要 `manage-cloud` `[读]` | 界面: Admin feature preview `[待渲染实测]` ／ 导航: `/admin/feature-preview` `[读]` ／ 持久化: 本行只覆盖打开 `[待渲染实测]` | core | `account.feature-preview` | `sidebarItems.ts:149-154` `admin/routes.tsx:249-251` `[读]` |
| `route.admin.settings` | 打开设置组列表（**不**逐字段） | 管理侧栏 `Settings` | `view-privileged-setting` OR `edit-privileged-setting` OR `manage-selected-settings` `[读]` | 界面: 设置组索引 `[待渲染实测]` ／ 导航: `/admin/settings/:group?` `[读]` ／ 持久化: 本行只覆盖打开组列表；字段级见 05 Out of scope `[读]` | core | — | `sidebarItems.ts:155-161` `admin/routes.tsx:224-226` `[读]` |

`registerAdminRoute` 共 26 条（含 import 的 new/prepare/progress 与 `/info` fallback）。本表侧栏项 22 + HOME 1；import 子步、房间/用户 CRUD 不展开。

---

## 7. 市场 / 全渠道 / 审计 — 仅入口

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `route.marketplace` | 打开市场壳（默认 Explore 列表） | 顶栏 Marketplace 菜单 → `Explore`；或直达 `/marketplace`（`context=all` 会 replace 到 explore/list） | `access-marketplace` OR `manage-apps`；无权限渲染 `NotFoundPage`；顶栏项桌面非 mobile `[读]` | 界面: 市场侧栏+Explore 列表 `[待渲染实测]` ／ 导航: `/marketplace` → `/marketplace/explore/list` `[读]` ／ 持久化: 打开只读；App 安装页不展开 `[读]` | core | — | `marketplace/routes.tsx:18-26` `MarketplaceRouter.tsx:12-32` `useMarketPlaceMenu.tsx:10-55` `NavBarPagesGroup.tsx:16-29` `[读]` |
| `route.omnichannel` | 打开全渠道管理壳（默认当前会话/联系中心） | 顶栏 `Manage` → `Omnichannel` | 菜单：`view-livechat-manager`；index replace 到 `omnichannel-current-chats` `[读]` | 界面: 全渠道侧栏+默认 Current `[待渲染实测]` ／ 导航: `/omnichannel` → `/omnichannel/current` `[读]` ／ 持久化: 打开本身不写库 `[读]` | core（EE 侧栏项另挂 `livechat-enterprise`，不展开） | `account.omnichannel` | `useAdministrationMenu.ts:38-48` `OmnichannelRouter.tsx:16-24` `omnichannel/routes.ts:102-106` `[读]` |
| `route.audit` | 打开消息审计页（Rooms/Users/DMs/Omnichannel tabs） | 顶栏 `Manage` → Audit 段 `Messages` | EE 模块 `auditing` 才 `defineRoutes`；页 `can-audit`；菜单同样要许可+许可证 `[读]` | 界面: Audit 页 `[待渲染实测]` ／ 导航: `/audit/:tab?` `[读]` ／ 持久化: 查询审计日志，本行只覆盖打开 `[待渲染实测]` | EE:auditing | `route.audit-log` `route.security-logs` | `startup/audit.tsx:43-55` `useAuditMenu.ts:11-20` `[读]` |
| `route.audit-log` | 打开审计操作日志 | 顶栏 `Manage` → Audit → `Logs` | EE `auditing` + `can-audit-log` `[读]` | 界面: Audit log 页 `[待渲染实测]` ／ 导航: `/audit-log` `[读]` ／ 持久化: 只读 `[待渲染实测]` | EE:auditing | `route.audit` | `startup/audit.tsx:57-66` `useAuditMenu.ts:22-26` `[读]` |
| `route.security-logs` | 打开安全日志 | 顶栏 `Manage` → Audit → `Security_logs` | EE `auditing` + `can-audit` `[读]` | 界面: Security logs 页 `[待渲染实测]` ／ 导航: `/security-logs` `[读]` ／ 持久化: 只读 `[待渲染实测]` | EE:auditing | `route.audit` | `startup/audit.tsx:68-80` `useAuditMenu.ts:28-32` `[读]` |

全渠道坐席 **Contact Center**（`/omnichannel-directory`）与 **Queue**（`/livechat-queue`）是已注册路由，但属于坐席控制台，**本册不写行**，见 05。

---

## 8. 外链 / 协议 / OAuth / 会议

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
| `route.invite` | 用邀请 hash 校验并登录/入房 | 打开 `/invite/:hash` | 公开；校验失败显示过期文案；已登录则 `useInviteTokenMutation` 入房 `[读]` | 界面: 有效则 `LoginPage`，无效则 Hero 错误 `[待渲染实测]` ／ 导航: `/invite/:hash` `[读]` ／ 持久化: 已登录则加入房间 `[待渲染实测]` | core | `route.login` `route.admin.invites` | `startup/routes.tsx:205-208` `InvitePage.tsx:12-47` `[读]` |
| `route.register-secret-url` | 用秘密注册 URL 打开注册 | 打开 `/register/:hash` | 已登录立刻去 `/home`；注册模式须为 Secret URL `[读]` | 界面: `RegistrationPageRouter` `secret-register` `[待渲染实测]` ／ 导航: `/register/:hash` `[读]` ／ 持久化: 注册成功建用户 `[待渲染实测]` | core | `route.register` | `startup/routes.tsx:200-203` `SecretURLPage.tsx:5-19` `[读]` |
| `route.conference` | 打开会议落地页（允许访客） | 打开 `/conference/:id?callUrl=…` | `AuthenticationCheck guest`；缺 `callUrl` 的失败 UI `[待渲染实测]` | 界面: `ConferencePage` 或错误 `[待渲染实测]` ／ 导航: `/conference/:id` `[读]` ／ 持久化: 不在本行展开入会信令 `[待渲染实测]` | core | — | `startup/routes.tsx:210-213` `ConferenceRoute.tsx:4-8` `[读]` |
| `route.mailer-unsubscribe` | 邮件一键退订工作区群发 | 打开 `/mailer/unsubscribe/:_id/:createdAt` | 公开；参数齐全即 POST `[读]` | 界面: 成功/失败 Callout `[待渲染实测]` ／ 导航: 该 path `[读]` ／ 持久化: `POST /v1/mailer.unsubscribe` `[读]` | core | `route.admin.mailer` | `startup/routes.tsx:220-223` `MailerUnsubscriptionPage.tsx:8-46` `[读]` |
| `route.terms-of-service` | 打开服务条款 CMS 页 | 直达 `/terms-of-service`（注册/页脚链 `[待渲染实测]`） | 公开 | 界面: `CMSPage` `Layout_Terms_of_Service` `[待渲染实测]` ／ 导航: `/terms-of-service` `[读]` ／ 持久化: 无 `[读]` | core | `route.privacy-policy` `route.legal-notice` | `startup/routes.tsx:186-188` `[读]` |
| `route.privacy-policy` | 打开隐私政策 CMS 页 | 直达 `/privacy-policy` | 公开 | 界面: `CMSPage` `Layout_Privacy_Policy` `[待渲染实测]` ／ 导航: `/privacy-policy` `[读]` ／ 持久化: 无 `[读]` | core | `route.terms-of-service` | `startup/routes.tsx:191-193` `[读]` |
| `route.legal-notice` | 打开法律声明 CMS 页 | 直达 `/legal-notice` | 公开 | 界面: `CMSPage` `Layout_Legal_Notice` `[待渲染实测]` ／ 导航: `/legal-notice` `[读]` ／ 持久化: 无 `[读]` | core | `route.terms-of-service` | `startup/routes.tsx:196-198` `[读]` |
| `route.oauth-authorize` | 第三方应用 OAuth 授权同意 | 外站重定向 `/oauth/authorize?client_id=&redirect_uri=` | 未登录先登录壳；已登录拉 OAuth app 后同意/拒绝 `[读]` | 界面: 授权表或登录 `[待渲染实测]` ／ 导航: `/oauth/authorize` `[读]` ／ 持久化: 授权码回跳 client `[待渲染实测]` | core | `route.admin.third-party-login` | `startup/routes.tsx:235-238` `OAuthAuthorizationPage.tsx:10-31` `[读]` |
| `route.oauth-error` | 显示 OAuth 错误页 | 失败回跳 `/oauth/error/:error` | 公开 | 界面: 错误页 `[待渲染实测]` ／ 导航: `/oauth/error/:error` `[读]` ／ 持久化: 无 `[读]` | core | `route.oauth-authorize` | `startup/routes.tsx:240-243` `[读]` |
| `route.saml` | SAML IdP 回调后登录 | IdP 重定向 `/saml/:token` | 公开；`Meteor.loginWithSamlToken`；可能再跟邀请 `[读]` | 界面: 短暂加载后进工作区 `[待渲染实测]` ／ 导航: `/saml/:token` `[读]` ／ 持久化: 建立会话 `[待渲染实测]` | core | `route.login` `route.invite` | `startup/routes.tsx:245-248` `SAMLLoginRoute.tsx` `[读]` |
| `route.2fa` | OAuth/现代登录流的 2FA 挑战 | 登录流送到 `/2fa/:method/:challengeId` | 公开挑战页 | 界面: 2FA 挑战 `[待渲染实测]` ／ 导航: `/2fa/:method/:challengeId` `[读]` ／ 持久化: 验证通过完成登录 `[待渲染实测]` | core | `route.login` `account.security` | `startup/routes.tsx:144-147` `OAuthTwoFactorAuthenticationRouter.tsx` `[读]` |

---

## 验算

### 行数（按命名空间，**无总计**）

在本文件统计（写入后用同一命令复核）：

```bash
# 表体 id 单元格：第二列以 ` 开头的稳定 id
rg -c '`route\.[a-z0-9.-]+`' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '`account\.[a-z0-9.-]+`' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '`directory\.[a-z0-9.-]+`' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '`team\.[a-z0-9.-]+`' docs/qa/pm-feature-atlas/04-routes-and-shell.md
```

**表体行（只计 `| \`id\` |` 行，不含叙述里的反引号）：**

```bash
rg -c '^\| `route\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '^\| `account\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '^\| `directory\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
rg -c '^\| `team\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
```

预期（写作时）：

| 命令 | 预期 |
|---|---|
| `^\| \`route\.` | 50（含 `route.admin.*` 23 + 其他 `route.*` 27） |
| `^\| \`account\.` | 9 |
| `^\| \`directory\.` | 4 |
| `^\| \`team\.` | 1 |

拆开 `route.admin`：

```bash
rg -c '^\| `route\.admin\.' docs/qa/pm-feature-atlas/04-routes-and-shell.md
# 预期 23 = home + 22 sidebar
rg -c 'i18nLabel:' apps/meteor/client/views/admin/sidebarItems.ts
# 实测 22
```

### 源码侧对照（命令+数字）

```bash
rg -n "id: '" apps/meteor/client/startup/routes.tsx | wc -l
# 23  （含 index/login/omnichannel-directory/livechat-queue/meet未注册除外的已注册 id）

rg -c "registerAccountRoute\(" apps/meteor/client/views/account/routes.tsx \
  apps/meteor/client/startup/deviceManagement.ts
# 9

rg -c "registerAdminRoute\(" apps/meteor/client/views/admin/routes.tsx
# 26  （含 import 子路由与 /info fallback；本册侧栏不一一展开子路由）

rg -c "registerMarketplaceRoute\(" apps/meteor/client/views/marketplace/routes.tsx
# 1

rg -c "registerOmnichannelRoute\(" apps/meteor/client/views/omnichannel/routes.ts
# 20

rg -n "id: '" apps/meteor/client/startup/audit.tsx
# 3：audit-home, audit-log, security-logs

rg -c "i18nLabel:" apps/meteor/client/views/account/sidebarItems.tsx
# 8  + device-management 动态 1 = 9 account 行
```

`startup/routes.tsx` 的 23 个 id 处置：`home/directory/search/call-history/2fa/terms/privacy/legal/register-secret/invite/conference/setup-wizard/mailer-unsubscribe/tokenLogin/resetPassword/oauth/authorize/oauth/error/saml/not-found` 已入行；`login` URL 并入 `route.login`（说明它只重定向）；`index` 不入行（纯跳转）；`omnichannel-directory`、`livechat-queue` 明确 OOS；`meet` 仅类型声明、未注册。

### 空行检查

每条表体行的「功能一句话 / 入口 / 门控 / 三件套 / 供给 / 出处」均非空。`directory.external` 不是空行：写明当前不渲染。

---

## [待渲染实测] 汇总

本册 **所有表体行** 至少有一处 `[待渲染实测]`（未跑 UI）。优先待测：

1. 顶栏 Home / Directory / Marketplace / Manage / 头像菜单在桌面、平板、mobile 的可见性与点击。
2. `/account`、`/admin`、`/marketplace`、`/omnichannel` 的 index replace 落点是否随权限变化。
3. Directory 四 tab 的权限页 vs 表；`external` 是否始终隐藏。
4. 登录壳：`forceLogin`、匿名读、注册模式、忘记密码链。
5. Setup wizard 三态（pending / in_progress / completed）。
6. 审计三项在无 `auditing` 许可证时菜单与直达 URL。
7. `route.search` 在无 AI 许可 / 未开 preview / 未开设置时的三种 Callout。
8. `team.create` 在缺 `create-c`/`create-p` 时 `+` 菜单是否隐藏 Team。
9. 管理侧栏 22 项：无权是否不渲染、有权是否进对页。
10. CMS 三页是否有产品内链，或仅直达 URL。

---

## 计数证据（ls / rg）

```text
$ ls -1 apps/meteor/client/views/directory/tabs
channels
teams
users

$ ls -1 apps/meteor/client/views/account
accessibility  AccountRouter.tsx  AccountSidebar.tsx  deviceManagement
featurePreview  index.ts  integrations  omnichannel  preferences
profile  routes.tsx  security  sidebarItems.tsx  tokens

$ rg -c "i18nLabel:" apps/meteor/client/views/admin/sidebarItems.ts
22

$ rg -c "i18nLabel:" apps/meteor/client/views/marketplace/sidebarItems.tsx
8

$ rg -c "i18nLabel:" apps/meteor/client/views/omnichannel/sidebarItems.tsx
13

$ rg -c "i18nLabel:" apps/meteor/app/livechat-enterprise/client/views/livechatSideNavItems.ts
7
```

---

## id 列表

**route.*** `route.login` `route.register` `route.forgot-password` `route.reset-password` `route.setup-wizard` `route.token-login` `route.home` `route.directory` `route.search` `route.call-history` `route.not-found` `route.admin.home` `route.admin.workspace` `route.admin.subscription` `route.admin.engagement` `route.admin.moderation` `route.admin.rooms` `route.admin.users` `route.admin.ai-center` `route.admin.invites` `route.admin.user-status` `route.admin.permissions` `route.admin.abac` `route.admin.device-management` `route.admin.email-inboxes` `route.admin.mailer` `route.admin.third-party-login` `route.admin.integrations` `route.admin.import` `route.admin.reports` `route.admin.sounds` `route.admin.emoji` `route.admin.feature-preview` `route.admin.settings` `route.marketplace` `route.omnichannel` `route.audit` `route.audit-log` `route.security-logs` `route.invite` `route.register-secret-url` `route.conference` `route.mailer-unsubscribe` `route.terms-of-service` `route.privacy-policy` `route.legal-notice` `route.oauth-authorize` `route.oauth-error` `route.saml` `route.2fa`

**account.*** `account.profile` `account.preferences` `account.security` `account.integrations` `account.tokens` `account.omnichannel` `account.feature-preview` `account.accessibility-and-appearance` `account.manage-devices`

**directory.*** `directory.channels` `directory.users` `directory.teams` `directory.external`

**team.*** `team.create`

---

## 边界

| 表面 | 本册立场 |
|---|---|
| `/` index | 纯跳转，不入行 |
| `/login` URL | 立即去 `/home`；能力记在 `route.login` |
| `/meet/:rid` | `IRouterPaths` 有声明，`defineRoutes` **无** 注册 — 不入行 |
| 房间 `channel`/`group`/`direct`/`live` | 隐式房间，交其他分册 |
| 团队 info/channels/leave/delete/convert | room toolbox，交其他分册 |
| `/omnichannel-directory`、`/livechat-queue` | 坐席控制台，OOS（05） |
| 市场 Explore/Installed/Requested/Private/App 详情 | 只留 `route.marketplace`；其余 OOS（05） |
| 全渠道 13+7 侧栏子页 | 只留 `route.omnichannel`；其余 OOS（05） |
| 管理设置字段、import 子步、用户/房间 CRUD | 只留侧栏打开行；字段 OOS（05） |
| 顶栏 Sort / 历史前进后退 / 在线状态 | navbar 他册 |
| Livechat 访客 widget（`packages/livechat`） | 非 Meteor SPA 目的地，OOS（05） |

---

## 与现行 atlas

`baseline: empty`。本册不引用他册 id 为「已存在」。合并时：消息工具条 / 房间 toolbox / 用户卡片 / composer+隐式房间 / navbar 控件 由对应分册补齐；本册只保证 **路由目的地** 可复放。
