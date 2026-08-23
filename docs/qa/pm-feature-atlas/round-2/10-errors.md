# Round 2 / Vol.10 — 用户可见错误路径闭集

## 1. 方法

- 冻结树：**仅** `e519470d35b6caf5b228d81aef41c86aab3051f4`（`e519470d35`）。不是 `develop`。`file:line` 均相对此 SHA。
- 闭集定义：Web **客户端**上，用户能看见的失败反馈。一行一调用点/一处 isError UI。id = `err.<通道>.<文件茎>.<行>`。
  - **toast / toast-dyn**：`dispatchToastMessage(` / `dispatchToastBar(` / `useToastMessageDispatch` 别名（`dispatchToast`、`dispatch`）且 `type: 'error'`，或 `type` 为运行时变量（可能为 error）。
  - **qmeta**：`useQuery`/`useMutation` meta 的 `apiErrorToastMessage` / `errorToastMessage`（经 `ToastMessagesProvider` queryCache.onError）。
  - **inline**：`isError` / `is*Error` 条件后渲染 States / GenericError / GenericNoResults / Callout / RetryButton / `*Error` 组件 / `*_not_found` 文案。
- 客户端树：`apps/meteor/client`、`ee/client`、`app/**/client`、`ee/app/**/client`、`packages/{ui-client,ui-contexts,ui-voip,ui-video-conf,web-ui-registration,fuselage-ui-kit,gazzodown}`。排除 `server/`、`*.spec.*`、`*.test.*`、`*.stories.*`、`tests/`。
- **排除**：`packages/livechat` 访客小部件（另一客户端；本树 0 处 `dispatchToastMessage`/`ToastMessages`）；toast **成功/info/warning**；仅 `console.*` 的 catch；`isError` 只用来 `return null`/隐藏水印/Community 标签（非错误 UI）；类型别名里的 `type: 'error'`（`toast.ts`、voip `requestToast` 类型）；`ToastMessagesProvider` / `QueryClientProviderMock` 的实现本身。
- 诚实标记：默认 `[读]`。`[实测]` 只在本机触发并截到用户可见 toast / qmeta / inline 文案 + 恢复时升级。catch 只调 `getErrorMessage`、DOM 无 toast 的仍是 `[读]`。不盖「不可达」来缩小 leftover。**本卷未 live-closed。**
- 8 列：稳定语义 id / 触发 / 用户看见 / 恢复 / 通道 / 表面 / 键或种类 / 出处。

## 2. Hunch 核验

| hunch | 本树结论 | 计数（排除 server/spec/stories/tests） |
| --- | --- | --- |
| `dispatchToastMessage` / `useToastMessageDispatch` / `useToastBarDispatch` | **成立** | files=275 |
| `ToastMessages*` | **成立**（基础设施 5 文件 + MeteorProvider 挂载） | files=5：`apps/meteor/client/providers/MeteorProvider.tsx`；`apps/meteor/client/providers/ToastMessagesProvider.tsx`；`packages/ui-contexts/src/ToastMessagesContext.ts`；`packages/ui-contexts/src/hooks/useToastMessageDispatch.ts`；`packages/ui-contexts/src/index.ts` |
| `type: 'error'` 字面量 | **成立**（含类型别名） | files=241 |
| `dispatchToastMessage(` / `dispatchToastBar(` 调用 | **成立** | files=267；calls=537；types={'error': 295, 'success': 221, 'info': 13, 'warning': 3, 'dynamic': 4, 'unknown': 1} |
| `apiErrorToastMessage` / `errorToastMessage` | **成立** | files=15（含 provider/mock；表内 qmeta=14） |
| 用户可见 `isError` UI | **成立**（114 文件含标识符；表内只收渲染错误 UI 的） | isError files=114；inline rows=78 |
| 用户可见 `catch` | **部分成立**（多数 catch 只转 toast，已计入 toast 行；无独立 UI 的 catch 不另开行） | catch files=239 |
| `packages/livechat` Toast | **不成立** | hits=0 |

走访文件 **3339**。表体数据行 **390** = toast 298 + qmeta 14 + inline 78。

Live（2026-08-23，同一冻结，boot 已通）：**11 `[实测]` + 379 `[读]` = 390**。未把任何一行盖成不可达。Volume 10 **未** live-closed。

## 3. 闭集表（一行一路径）

排序：表面 → 通道 → 文件 → 行。通道：`toast` 固定 error；`toast-dyn` 运行时 type；`qmeta` query meta；`inline` isError UI。

### 3.account（23）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.i.AccountTokensTable.125` | 打开/加载 handleRemove 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`We_Could_not_retrive_any_data` 「We couldn't retrive any data」；`Retry` 「Retry」 | 点 Retry / Reload_page / refetch | `inline` | `account` | Something_went_wrong, We_Could_not_retrive_any_data, Retry | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:125` [读] |
| `err.t.AccessibilityPage.68` | set Preferences Action — mutation/query onError; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/accessibility/AccessibilityPage.tsx:68` [读] |
| `err.t.AccountFeaturePreviewPage.64` | features To Be Saved — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/featurePreview/AccountFeaturePreviewPage.tsx:64` [读] |
| `err.t.AccountIntegrationsPage.36` | remove Mutation — mutation/query onError; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/integrations/AccountIntegrationsPage.tsx:36` [读] |
| `err.t.AccountPreferencesPage.43` | set Preferences Action — mutation/query onError; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/preferences/AccountPreferencesPage.tsx:43` [读] |
| `err.t.PreferencesMyDataSection.69` | text — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/preferences/PreferencesMyDataSection.tsx:69` [读] |
| `err.t.AccountProfileForm.93` | mutate Confirmation Email — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:93` [读] |
| `err.t.AccountProfileForm.180` | status Dirty — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:180` [读] |
| `err.t.AccountProfilePage.61` | handle Logout Other Locations — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/profile/AccountProfilePage.tsx:61` [读] |
| `err.t.AccountProfilePage.75` | handle Confirm — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/profile/AccountProfilePage.tsx:75` [读] |
| `err.t.AccountProfilePage.109` | handle Confirm — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/profile/AccountProfilePage.tsx:109` [读] |
| `err.t.ChangePassphrase.95` | handle Save — catch; 提交/保存; mutate | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/security/ChangePassphrase.tsx:95` [读] |
| `err.t.ChangePassword.55` | handle Save — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/security/ChangePassword.tsx:55` [读] |
| `err.t.TwoFactorTOTP.68` | result — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:68` [读] |
| `err.t.TwoFactorTOTP.84` | on Disable — catch | error toast：`Invalid_two_factor_code` 「Invalid two factor code」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `account` | Invalid_two_factor_code | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:84` [读] |
| `err.t.TwoFactorTOTP.91` | on Disable — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:91` [读] |
| `err.t.TwoFactorTOTP.122` | result — catch | error toast：`Invalid_two_factor_code` 「Invalid two factor code」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `account` | Invalid_two_factor_code | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:122` [读] |
| `err.t.TwoFactorTOTP.124` | result — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:124` [读] |
| `err.t.TwoFactorTOTP.138` | on Regenerate — catch | error toast：`Invalid_two_factor_code` 「Invalid two factor code」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `account` | Invalid_two_factor_code | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:138` [读] |
| `err.t.TwoFactorTOTP.140` | on Regenerate — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:140` [读] |
| `err.t.AccountTokensTable.84` | handle Regenerate — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:84` [读] |
| `err.t.AccountTokensTable.112` | handle Remove — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:112` [读] |
| `err.t.AddToken.61` | handle Dismiss Modal — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `account` | api | `apps/meteor/client/views/account/tokens/AccountTokensTable/AddToken.tsx:61` [读] |

### 3.admin（100）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.i.CustomEmoji.118` | 打开/加载 getEmojiList 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Something_went_wrong, Reload_page | `apps/meteor/client/views/admin/customEmoji/CustomEmoji.tsx:118` [读] |
| `err.i.CustomSoundsTable.99` | 打开/加载 headers 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Something_went_wrong, Reload_page | `apps/meteor/client/views/admin/customSounds/CustomSoundsTable/CustomSoundsTable.tsx:99` [读] |
| `err.i.CustomUserStatusService.44` | 打开/加载 disablePresenceService 时 query isError | States 错误空态：`Unable_to_load_active_connections` 「Unable to load active connections」；`Retry` 「Retry」；`Service_status` 「Service status」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Unable_to_load_active_connections, Retry, Service_status, Active_connections | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:44` [读] |
| `err.i.DeviceManagementInfoWithData.42` | 打开/加载 getSessionInfo 时 query isError | States 错误空态：`Device_Info` 「Device Info」；`Something_went_wrong` 「Something went wrong」；`We_Could_not_retrive_any_data` 「We couldn't retrive any data」 | 离开该页或刷新后重试 | `inline` | `admin` | Device_Info, Something_went_wrong, We_Could_not_retrive_any_data | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementInfo/DeviceManagementInfoWithData.tsx:42` [读] |
| `err.i.EmailInboxTable.110` | 打开/加载 headers 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Something_went_wrong, Reload_page | `apps/meteor/client/views/admin/emailInbox/EmailInboxTable.tsx:110` [读] |
| `err.i.ImportProgressPage.167` | 打开/加载 progress 时 query isError | 行内错误文案：`Failed_To_Load_Import_Data` 「Failed to load import data」 | 离开该页或刷新后重试 | `inline` | `admin` | Failed_To_Load_Import_Data | `apps/meteor/client/views/admin/import/ImportProgressPage.tsx:167` [读] |
| `err.i.EditIntegrationsPageWithData.36` | 直达 `/admin/integrations/edit/incoming/not-a-real-id` | 行内文案：「Oops, page not found」 | 离开 Integrations 列表 | `inline` | `admin` | Oops_page_not_found | `apps/meteor/client/views/admin/integrations/EditIntegrationsPageWithData.tsx:36` [实测] `shots/vol10/06-integration-not-found.webp` + `-recover.webp` |
| `err.i.IntegrationsTable.137` | 打开/加载 headers 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Something_went_wrong, Reload_page | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:137` [读] |
| `err.i.InvitesPage.114` | 打开/加载 headers 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Something_went_wrong, Reload_page | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:114` [读] |
| `err.i.UserMessages.71` | 打开/加载 handleChange 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Something_went_wrong, Reload_page | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:71` [读] |
| `err.i.ModConsoleUsersTable.138` | 打开/加载 headers 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Something_went_wrong, Reload_page | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:138` [读] |
| `err.i.UserReportInfo.64` | 打开/加载 userEmails 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」；`Roles` 「Roles」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Something_went_wrong, Reload_page, Roles | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:64` [读] |
| `err.i.EditRolePageWithData.28` | 打开/加载 context 时 query isError | 整页/区块 GenericError | 离开该页或刷新后重试 | `inline` | `admin` | ui | `apps/meteor/client/views/admin/permissions/EditRolePageWithData.tsx:28` [读] |
| `err.i.UsersInRoleTable.72` | 打开/加载 headers 时 query isError | 整页/区块 GenericError | 点 Retry / Reload_page / refetch | `inline` | `admin` | ui | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTable.tsx:72` [读] |
| `err.i.RoomsTable.167` | 打开/加载 headers 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Something_went_wrong, Reload_page | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:167` [读] |
| `err.i.AdminUserFormWithData.35` | 直达 `/admin/users/edit/not-a-real-uid-vol10` | Edit User 栏 Callout：「User not found」（本种子未见 federated 分支） | 离开到 `/admin/users`；Callout 随栏关闭 | `inline` | `admin` | User_not_found, Edit_Federated_User_Not_Allowed | `apps/meteor/client/views/admin/users/AdminUserFormWithData.tsx:35` [实测] `shots/vol10/05-user-not-found.webp` + `-recover.webp` |
| `err.i.UsersTable.170` | 打开/加载 headers 时 query isError | GenericNoResults 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」；`Users_Table_Generic_No_users` 「No {{status}} users」 | 点 Retry / Reload_page / refetch | `inline` | `admin` | Something_went_wrong, Reload_page, Users_Table_Generic_No_users | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:170` [读] |
| `err.i.AnalyticsReports.41` | 打开/加载 AnalyticsReports 时 query isError | 行内错误文案：`Something_went_wrong_try_again_later` 「Something went wrong, try again later.」 | 离开该页或刷新后重试 | `inline` | `admin` | Something_went_wrong_try_again_later | `apps/meteor/client/views/admin/viewLogs/AnalyticsReports.tsx:41` [读] |
| `err.i.WorkspaceRoute.37` | 打开/加载 handleClickDownloadInfo 时 query isError | Callout danger：`Workspace` 「Workspace」；`Refresh` 「Refresh」；`Error_loading_pages` 「Error loading pages」 | 离开该页或刷新后重试 | `inline` | `admin` | Workspace, Refresh, Error_loading_pages | `apps/meteor/client/views/admin/workspace/WorkspaceRoute.tsx:37` [读] |
| `err.q.CustomUserStatusTable.58` | getCustomUserStatus — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | api | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:58` [读] |
| `err.q.ImportHistoryPage.33` | currentOperation — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `errorToastMessage`：`Failed_To_Load_Import_Operation` 「Failed to load import operation」 | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | Failed_To_Load_Import_Operation | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:33` [读] |
| `err.q.ImportHistoryPage.44` | operations — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `errorToastMessage`：`Failed_To_Load_Import_History` 「Failed to load import history」 | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | Failed_To_Load_Import_History | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:44` [读] |
| `err.q.InvitesPage.35` | invites — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | api | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:35` [读] |
| `err.q.MessageReportInfo.29` | reports — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | api | `apps/meteor/client/views/admin/moderation/MessageReportInfo.tsx:29` [读] |
| `err.q.ModerationConsoleTable.61` | getReports — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | api | `apps/meteor/client/views/admin/moderation/ModerationConsoleTable.tsx:61` [读] |
| `err.q.UserMessages.31` | messages — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | api | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:31` [读] |
| `err.q.EditOauthAppWithData.24` | oauthApps — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | api | `apps/meteor/client/views/admin/oauthApps/EditOauthAppWithData.tsx:24` [读] |
| `err.q.EditRoomWithData.23` | rooms — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | api | `apps/meteor/client/views/admin/rooms/EditRoomWithData.tsx:23` [读] |
| `err.q.AdminUserInfoWithData.41` | usersInfo — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | api | `apps/meteor/client/views/admin/users/AdminUserInfoWithData.tsx:41` [读] |
| `err.q.useFilteredUsers.58` | usersListQueryResult — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `admin` | api | `apps/meteor/client/views/admin/users/hooks/useFilteredUsers.ts:58` [读] |
| `err.t.AttributesContextualBar.75` | payload — mutation/query onError | error toast：`ABAC_Invalid_attribute` 「Invalid characters in attribute name or values」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `admin` | ABAC_Invalid_attribute | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesContextualBar.tsx:75` [读] |
| `err.t.AttributesContextualBar.77` | payload — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesContextualBar.tsx:77` [读] |
| `err.t.RoomsContextualBar.64` | payload — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomsContextualBar.tsx:64` [读] |
| `err.t.useAttributeOptions.44` | delete Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/ABAC/hooks/useAttributeOptions.tsx:44` [读] |
| `err.t.AddCustomSound.54` | handle Change File 失败 | error toast：`File_exceeds_allowed_size_of_bytes` 「File size exceeds upload limit of {{size}}.」 | 关闭 toast；重试同一动作 | `toast` | `admin` | File_exceeds_allowed_size_of_bytes | `apps/meteor/client/views/admin/customSounds/AddCustomSound.tsx:54` [读] |
| `err.t.AddCustomSound.66` | first Invalid Field — 提交/保存 | error toast：`Required_field` 「{{field}} required」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `admin` | Required_field | `apps/meteor/client/views/admin/customSounds/AddCustomSound.tsx:66` [读] |
| `err.t.EditSound.60` | first Invalid Field — 提交/保存 | error toast：`Required_field` 「{{field}} required」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `admin` | Required_field | `apps/meteor/client/views/admin/customSounds/EditSound.tsx:60` [读] |
| `err.t.EditSound.82` | handle Delete — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/customSounds/EditSound.tsx:82` [读] |
| `err.t.EditSound.105` | handle Cancel 失败 | error toast：`File_exceeds_allowed_size_of_bytes` 「File size exceeds upload limit of {{size}}.」 | 关闭 toast；重试同一动作 | `toast` | `admin` | File_exceeds_allowed_size_of_bytes | `apps/meteor/client/views/admin/customSounds/EditSound.tsx:105` [读] |
| `err.t.CustomUserStatusForm.59` | handle Save — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusForm.tsx:59` [读] |
| `err.t.CustomUserStatusForm.77` | handle Delete — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusForm.tsx:77` [读] |
| `err.t.EmailInboxForm.103` | delete Inbox — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:103` [读] |
| `err.t.EmailInboxForm.170` | payload — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:170` [读] |
| `err.t.SendTestButton.26` | handle On Click — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/emailInbox/SendTestButton.tsx:26` [读] |
| `err.t.AdminFeaturePreviewPage.56` | features To Be Saved — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/featurePreview/AdminFeaturePreviewPage.tsx:56` [读] |
| `err.t.ImportHistoryPage.62` | download Pending Files Result — mutation/query onError | error toast：`Failed_To_Download_Files` 「Failed to download files」 | 关闭 toast；重试同一动作 | `toast` | `admin` | Failed_To_Download_Files | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:62` [读] |
| `err.t.ImportHistoryPage.85` | download Pending Avatars Result — mutation/query onError | error toast：`Failed_To_Download_Files` 「Failed to download files」 | 关闭 toast；重试同一动作 | `toast` | `admin` | Failed_To_Download_Files | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:85` [读] |
| `err.t.useErrorHandler.10` | use Error Handler 失败 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/import/useErrorHandler.ts:10` [读] |
| `err.t.useCreateIntegration.20` | create Integration — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/integrations/hooks/useCreateIntegration.ts:20` [读] |
| `err.t.useDeleteIntegration.20` | create Integration — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/integrations/hooks/useDeleteIntegration.ts:20` [读] |
| `err.t.useUpdateIntegration.18` | update Integration — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/integrations/hooks/useUpdateIntegration.ts:18` [读] |
| `err.t.OutgoingWebhookHistoryPage.60` | handle Clear History — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/integrations/outgoing/history/OutgoingWebhookHistoryPage.tsx:60` [读] |
| `err.t.InvitesPage.47` | confirm Remove — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:47` [读] |
| `err.t.MailerPage.57` | send Mail Action — mutation/query onError; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/mailer/MailerPage.tsx:57` [读] |
| `err.t.ModerationConsolePage.30` | permalink — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/moderation/ModerationConsolePage.tsx:30` [读] |
| `err.t.useDeactivateUserAction.24` | handle Deactivate User — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/moderation/hooks/useDeactivateUserAction.tsx:24` [读] |
| `err.t.useDeactivateUserAction.34` | handle Delete Messages — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/moderation/hooks/useDeactivateUserAction.tsx:34` [读] |
| `err.t.useDeactivateUserAction.44` | handle Dismiss User Reports — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/moderation/hooks/useDeactivateUserAction.tsx:44` [读] |
| `err.t.useDeleteMessage.17` | handle Delete Messages — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/moderation/hooks/useDeleteMessage.tsx:17` [读] |
| `err.t.useDeleteMessage.28` | handle Dismiss Message — mutation/query onError; mutate | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/moderation/hooks/useDeleteMessage.tsx:28` [读] |
| `err.t.useDeleteMessagesAction.19` | handle Delete Messages — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/moderation/hooks/useDeleteMessagesAction.tsx:19` [读] |
| `err.t.useDismissMessageAction.17` | handle Dismiss Message — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/moderation/hooks/useDismissMessageAction.tsx:17` [读] |
| `err.t.useDismissUserAction.24` | handle Dismiss User — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/moderation/hooks/useDismissUserAction.tsx:24` [读] |
| `err.t.useResetAvatarAction.18` | handle Reset Avatar — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/moderation/hooks/useResetAvatarAction.tsx:18` [读] |
| `err.t.EditOauthApp.71` | delete App — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/oauthApps/EditOauthApp.tsx:71` [读] |
| `err.t.EditOauthApp.81` | on Delete Confirm — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/oauthApps/EditOauthApp.tsx:81` [读] |
| `err.t.OAuthAddApp.50` | close — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/oauthApps/OAuthAddApp.tsx:50` [读] |
| `err.t.EditRolePage.63` | handle Save — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/permissions/EditRolePage.tsx:63` [读] |
| `err.t.EditRolePage.80` | delete Role Action — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/permissions/EditRolePage.tsx:80` [读] |
| `err.t.UsersInRolePage.57` | handle Add — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:57` [读] |
| `err.t.useRemoveUserFromRole.38` | remove — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/permissions/UsersInRole/hooks/useRemoveUserFromRole.tsx:38` [读] |
| `err.t.useChangeRole.25` | use Change Role — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/permissions/hooks/useChangeRole.ts:25` [读] |
| `err.t.EditRoom.116` | data — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:116` [读] |
| `err.t.ActionInputBase.24` | params — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/settings/Setting/inputs/ActionInputBase.tsx:24` [读] |
| `err.t.AssetSettingInput.43` | file Data — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/settings/Setting/inputs/AssetSettingInput.tsx:43` [读] |
| `err.t.AssetSettingInput.52` | handle Delete Button Click — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/settings/Setting/inputs/AssetSettingInput.tsx:52` [读] |
| `err.t.SettingsGroupPage.86` | changes — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/settings/SettingsGroupPage/SettingsGroupPage.tsx:86` [读] |
| `err.t.LDAPGroupPage.48` | handle Test Connection Button Click — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/settings/groups/LDAPGroupPage.tsx:48` [读] |
| `err.t.LDAPGroupPage.65` | confirm Search — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/settings/groups/LDAPGroupPage.tsx:65` [读] |
| `err.t.LDAPGroupPage.99` | confirm Search — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/settings/groups/LDAPGroupPage.tsx:99` [读] |
| `err.t.OAuthGroupPage.47` | handle Refresh OAuth Services Button Click — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/settings/groups/OAuthGroupPage/OAuthGroupPage.tsx:47` [读] |
| `err.t.OAuthGroupPage.57` | on Confirm — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/settings/groups/OAuthGroupPage/OAuthGroupPage.tsx:57` [读] |
| `err.t.OAuthGroupPage.78` | handle Confirm — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/settings/groups/OAuthGroupPage/OAuthGroupPage.tsx:78` [读] |
| `err.t.ManageLicenseModal.78` | handle Apply — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx:78` [读] |
| `err.t.ManageLicenseModal.89` | handle Remove — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx:89` [读] |
| `err.t.useRemoveLicense.24` | remove License — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/subscription/hooks/useRemoveLicense.ts:24` [读] |
| `err.t.useWorkspaceSync.19` | cloud Sync — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/subscription/hooks/useWorkspaceSync.ts:19` [读] |
| `err.t.AdminUserForm.150` | handle Update User — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:150` [读] |
| `err.t.AdminUserForm.169` | handle Create User — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:169` [读] |
| `err.t.useChangeAdminStatusAction.32` | change Admin Status — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/users/hooks/useChangeAdminStatusAction.ts:32` [读] |
| `err.t.useConfirmOwnerChanges.37` | handle Confirm — 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/users/hooks/useConfirmOwnerChanges.tsx:37` [读] |
| `err.t.useResetE2EEKeyAction.20` | reset E2EEKey — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/users/hooks/useResetE2EEKeyAction.tsx:20` [读] |
| `err.t.useResetTOTPAction.21` | reset TOTP — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/users/hooks/useResetTOTPAction.tsx:21` [读] |
| `err.t.useSendInvitationEmailMutation.27` | result — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/users/hooks/useSendInvitationEmailMutation.ts:27` [读] |
| `err.t.useSendWelcomeEmailMutation.19` | send Welcome Email 失败 | error toast：`Welcome_email_failed` 「Failed to resend welcome email」 | 关闭 toast；重试同一动作 | `toast` | `admin` | Welcome_email_failed | `apps/meteor/client/views/admin/users/hooks/useSendWelcomeEmailMutation.ts:19` [读] |
| `err.t.useSendWelcomeEmailMutation.27` | send Welcome Email — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/users/hooks/useSendWelcomeEmailMutation.ts:27` [读] |
| `err.t.RegisterWorkspaceSetupStepOneModal.68` | handle Register Workspace — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceSetupModal/RegisterWorkspaceSetupStepOneModal.tsx:68` [读] |
| `err.t.RegisterWorkspaceSetupStepTwoModal.49` | handle Resend Registration Email — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceSetupModal/RegisterWorkspaceSetupStepTwoModal.tsx:49` [读] |
| `err.t.RegisterWorkspaceTokenModal.62` | handle Connect Button Click — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `admin` | api | `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceTokenModal.tsx:62` [读] |
| `err.t.RegisteredWorkspaceModal.48` | message — catch | error toast：动态 message | 关闭 toast；重试同一动作 | `toast` | `admin` | dynamic | `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisteredWorkspaceModal.tsx:48` [读] |

### 3.audit（2）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.i.AuditPage.47` | 打开/加载 auditMutation 时 query isError | States 错误空态：`Error` 「Error」 | 离开该页或刷新后重试 | `inline` | `audit` | Error | `apps/meteor/client/views/audit/AuditPage.tsx:47` [读] |
| `err.q.AuditLogTable.49` | getAudits — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `audit` | api | `apps/meteor/client/views/audit/components/AuditLogTable.tsx:49` [读] |

### 3.auth（6）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.t.overrideLoginMethod.44` | override Login Method 失败 | error toast：`totp-max-attempts` 「Maximum OTP failed attempts reached. A new code will be generated.」 | 关闭 toast；重试同一动作 | `toast` | `auth` | totp-max-attempts | `apps/meteor/client/lib/2fa/overrideLoginMethod.ts:44` [读] |
| `err.t.overrideLoginMethod.49` | override Login Method 失败 | error toast：`Invalid_two_factor_code` 「Invalid two factor code」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `auth` | Invalid_two_factor_code | `apps/meteor/client/lib/2fa/overrideLoginMethod.ts:49` [读] |
| `err.t.overrideLoginMethod.91` | callback — catch | error toast：`Invalid_two_factor_code` 「Invalid two factor code」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `auth` | Invalid_two_factor_code | `apps/meteor/client/lib/2fa/overrideLoginMethod.ts:91` [读] |
| `err.t.process2faReturn.161` | actual Code 失败 | error toast：`Two-factor_authentication_cancelled` 「Two-factor authentication cancelled」 | 关闭 toast；稍后重试同一动作 | `toast` | `auth` | Two-factor_authentication_cancelled | `apps/meteor/client/lib/2fa/process2faReturn.ts:161` [读] |
| `err.t.OAuthTwoFactorAuthenticationRouter.65` | on Confirm — catch | error toast：`Maximum_number_of_attempts_reached_please_try_again_later` 「Maximum number of attempts reached. Please try again later.」 | 关闭 toast；重试同一动作 | `toast` | `auth` | Maximum_number_of_attempts_reached_please_try_again_later | `apps/meteor/client/views/OAuthTwoFactorAuthentication/OAuthTwoFactorAuthenticationRouter.tsx:65` [读] |
| `err.t.OAuthTwoFactorAuthenticationRouter.71` | on Confirm — catch | error toast：`Challenge_expired_please_try_again_later` 「Challenge expired. Please try again later.」 | 关闭 toast；重试同一动作 | `toast` | `auth` | Challenge_expired_please_try_again_later | `apps/meteor/client/views/OAuthTwoFactorAuthentication/OAuthTwoFactorAuthenticationRouter.tsx:71` [读] |

### 3.directory（3）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.i.ChannelsTable.132` | 打开/加载 onClick 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `directory` | Something_went_wrong, Reload_page | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:132` [读] |
| `err.i.TeamsTable.113` | 打开/加载 onClick 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `directory` | Something_went_wrong, Reload_page | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:113` [读] |
| `err.i.UsersTable.143` | 打开/加载 handleClick 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `directory` | Something_went_wrong, Reload_page | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:143` [读] |

### 3.e2ee（1）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.t.EnterE2EPasswordModal.44` | handle Validate Password — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `e2ee` | api | `apps/meteor/client/views/e2e/EnterE2EPasswordModal/EnterE2EPasswordModal.tsx:44` [读] |

### 3.gazzodown（1）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.t.CodeBlock.81` | handle Copy — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `gazzodown` | Failed_to_copy | `packages/gazzodown/src/code/CodeBlock.tsx:81` [读] |

### 3.invite（3）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.t.useInviteTokenMutation.18` | get Invite Room 失败 | error toast：`Failed_to_activate_invite_token` 「Failed to activate invite token」 | 关闭 toast；重试同一动作 | `toast` | `invite` | Failed_to_activate_invite_token | `apps/meteor/client/views/invite/hooks/useInviteTokenMutation.ts:18` [读] |
| `err.t.useInviteTokenMutation.31` | 已登录访问 `/invite/not-a-real-token-vol10`（`useInviteToken` onError） | error toast：「Failed to activate invite token」 | 关闭 toast；落在 `/home` | `toast` | `invite` | Failed_to_activate_invite_token | `apps/meteor/client/views/invite/hooks/useInviteTokenMutation.ts:31` [实测] `shots/vol10/01-invite-invalid.webp` + `-recover.webp` |
| `err.t.useValidateInviteQuery.42` | 访问 `/invite/not-a-real-token-vol10`（validateInviteToken catch） | error toast：「Failed to validate invite token」 | 关闭 toast；落在 `/home` | `toast` | `invite` | Failed_to_validate_invite_token | `apps/meteor/client/views/invite/hooks/useValidateInviteQuery.ts:42` [实测] `shots/vol10/01-invite-invalid.webp` + `-recover.webp` |

### 3.marketplace（12）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.i.AppInstances.30` | 打开/加载 getStatusColor 时 query isError | 行内错误文案：`App_not_found` 「App not found」 | 离开该页或刷新后重试 | `inline` | `marketplace` | App_not_found | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx:30` [读] |
| `err.i.AppInstances.53` | 打开/加载 handleSelectLogs 时 query isError | 行内错误文案：`App_not_found` 「App not found」；`Workspace_instance` 「Workspace instance」；`Status` 「Status」 | 离开该页或刷新后重试 | `inline` | `marketplace` | App_not_found, Workspace_instance, Status | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx:53` [读] |
| `err.i.AppLogs.113` | 打开/加载 parsedError 时 query isError | 整页/区块 GenericError | 离开该页或刷新后重试 | `inline` | `marketplace` | ui | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogs.tsx:113` [读] |
| `err.i.AppsPageContent.189` | 打开/加载 toggleInitialSortOption 时 query isError | Marketplace 连接失败 / UnsupportedEmptyState | 离开该页或刷新后重试 | `inline` | `marketplace` | ui | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:189` [读] |
| `err.q.AppReleases.27` | getVersions — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `apiErrorToastMessage` → `getErrorMessage(error)` | 关闭 toast；刷新或重进该页 | `qmeta` | `marketplace` | api | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppReleases/AppReleases.tsx:27` [读] |
| `err.t.handleAPIError.14` | handle APIError 失败 | error toast：运行时 `TranslationKey`（voip requestToast 等） | 关闭 toast；重试同一动作 | `toast` | `marketplace` | dynamic | `apps/meteor/client/views/marketplace/helpers/handleAPIError.ts:14` [读] |
| `err.t.handleAPIError.17` | handle APIError 失败 | error toast：`Apps_Error_${error}` 或 Marketplace 原文 | 关闭 toast；重试同一动作 | `toast` | `marketplace` | dynamic | `apps/meteor/client/views/marketplace/helpers/handleAPIError.ts:17` [读] |
| `err.t.handleInstallError.18` | handle Install Error 失败 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `marketplace` | api | `apps/meteor/client/views/marketplace/helpers/handleInstallError.ts:18` [读] |
| `err.t.handleInstallError.48` | handle Install Error 失败 | error toast：动态 message | 关闭 toast；重试同一动作 | `toast` | `marketplace` | dynamic | `apps/meteor/client/views/marketplace/helpers/handleInstallError.ts:48` [读] |
| `err.t.warnAppInstall.9` | warn App Install 失败 | error toast：动态 message | 关闭 toast；重试同一动作 | `toast` | `marketplace` | dynamic | `apps/meteor/client/views/marketplace/helpers/warnAppInstall.ts:9` [读] |
| `err.t.warnEnableDisableApp.9` | warn Enable Disable App 失败 | error toast：动态 message | 关闭 toast；重试同一动作 | `toast` | `marketplace` | dynamic | `apps/meteor/client/views/marketplace/helpers/warnEnableDisableApp.ts:9` [读] |
| `err.t.warnStatusChange.9` | warn Status Change 失败 | error toast：动态 message | 关闭 toast；重试同一动作 | `toast` | `marketplace` | dynamic | `apps/meteor/client/views/marketplace/helpers/warnStatusChange.ts:9` [读] |

### 3.message（10）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.t.ThreadMetricsFollow.25` | toggle Following Thread Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `message` | api | `apps/meteor/client/components/message/content/ThreadMetricsFollow.tsx:25` [读] |
| `err.t.ActionAttachmentButton.22` | perform Action Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `message` | api | `apps/meteor/client/components/message/content/attachments/default/ActionAttachmentButton.tsx:22` [读] |
| `err.t.GenericFileAttachment.70` | url — catch | error toast：`FileUpload_Error_Trying_To_Open_File` 「Error trying to open file」 | 关闭 toast；重试同一动作 | `toast` | `message` | FileUpload_Error_Trying_To_Open_File | `apps/meteor/client/components/message/content/attachments/file/GenericFileAttachment.tsx:70` [读] |
| `err.t.useMarkAsUnreadMutation.30` | unread Messages — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `message` | api | `apps/meteor/client/components/message/hooks/useMarkAsUnreadMutation.ts:30` [读] |
| `err.t.usePinMessageMutation.25` | query Client — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `message` | api | `apps/meteor/client/components/message/hooks/usePinMessageMutation.ts:25` [读] |
| `err.t.useStarMessageMutation.26` | star Message — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `message` | api | `apps/meteor/client/components/message/hooks/useStarMessageMutation.ts:26` [读] |
| `err.t.useUnpinMessageMutation.25` | query Client — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `message` | api | `apps/meteor/client/components/message/hooks/useUnpinMessageMutation.ts:25` [读] |
| `err.t.useUnstarMessageMutation.26` | unstar Message — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `message` | api | `apps/meteor/client/components/message/hooks/useUnstarMessageMutation.ts:26` [读] |
| `err.t.useMessageActionAppsActionButtons.57` | data — catch | error toast：`UIKit_Interaction_Timeout` 「App has failed to respond. Please try again or contact your admin」 | 关闭 toast；稍后重试同一动作 | `toast` | `message` | UIKit_Interaction_Timeout | `apps/meteor/client/components/message/toolbar/useMessageActionAppsActionButtons.ts:57` [读] |
| `err.t.usePermalinkAction.43` | permalink — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `message` | api | `apps/meteor/client/components/message/toolbar/usePermalinkAction.ts:43` [读] |

### 3.nav（6）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.t.CreateChannelModal.184` | params — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `nav` | api | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:184` [读] |
| `err.t.CreateDirectMessage.46` | mutate Direct Message — mutation/query onError; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `nav` | api | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateDirectMessage.tsx:46` [读] |
| `err.t.CreateTeamModal.147` | params — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `nav` | api | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateTeamModal.tsx:147` [读] |
| `err.t.EditStatusModal.83` | expires At — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `nav` | api | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/EditStatusModal.tsx:83` [读] |
| `err.t.FederatedRoomList.53` | set Modal — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `nav` | api | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomList.tsx:53` [读] |
| `err.t.MatrixFederationManageServerModal.71` | error Key — mutation/query onError; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `nav` | api | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationManageServerModal.tsx:71` [读] |

### 3.omnichannel（90）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.i.AgentInfo.42` | 打开/加载 handleDelete 时 query isError | 行内错误文案：`User_not_found` 「User not found」；`User_Info` 「User Info」；`Edit` 「Edit」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | User_not_found, User_Info, Edit, Edit, Edit, Remove, Remove, Remove | `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:42` [读] |
| `err.i.AgentsTable.116` | 打开/加载 headers 时 query isError | 整页/区块 GenericError | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | ui | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:116` [读] |
| `err.i.AppearancePageContainer.34` | 打开/加载 canViewAppearance 时 query isError | Callout danger：`Edit_Custom_Field` 「Edit Custom Field」；`Error` 「Error」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Edit_Custom_Field, Error | `apps/meteor/client/views/omnichannel/appearance/AppearancePageContainer.tsx:34` [读] |
| `err.i.BusinessHoursTable.85` | 打开/加载 headers 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | Something_went_wrong, Reload_page | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursTable.tsx:85` [读] |
| `err.i.EditBusinessHoursWithData.28` | 打开/加载 getBusinessHour 时 query isError | States 错误空态：`Business_Hours` 「Business Hours」；`Back` 「Back」；`Something_went_wrong` 「Something went wrong」 | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | Business_Hours, Back, Something_went_wrong, Reload_page | `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHoursWithData.tsx:28` [读] |
| `err.i.CannedResponseEditWithData.29` | 打开/加载 handleDelete 时 query isError | Callout danger：`Not_Available` 「Not Available」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Not_Available | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithData.tsx:29` [读] |
| `err.i.CannedResponseEditWithDepartmentData.40` | 打开/加载 getDepartment 时 query isError | Callout danger：`Not_Available` 「Not Available」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Not_Available | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithDepartmentData.tsx:40` [读] |
| `err.i.CustomField.26` | 打开/加载 getCustomField 时 query isError | 行内错误文案：`Custom_Field_Not_Found` 「Custom Field not found」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Custom_Field_Not_Found | `apps/meteor/client/views/omnichannel/components/CustomField.tsx:26` [读] |
| `err.i.ChannelField.80` | 打开/加载 providerLastChat 时 query isError | 字段校验 + Retry：`Last_contact__time__` 「Last contact {{time}}」 | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | Last_contact__time__ | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ChannelField.tsx:80` [读] |
| `err.i.ContactField.78` | 打开/加载 phoneList 时 query isError | 字段校验 + Retry | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | ui | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ContactField.tsx:78` [读] |
| `err.i.DepartmentField.75` | 打开/加载 handleDepartmentChange 时 query isError | 字段校验 + Retry：`Outbound_message_department_hint` 「Assign replies to a department.」 | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | Outbound_message_department_hint | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/components/DepartmentField.tsx:75` [读] |
| `err.i.ContactInfoWithData.27` | 打开/加载 getContact 时 query isError | ContactInfoError 栏 | 离开该页或刷新后重试 | `inline` | `omnichannel` | ui | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfoWithData.tsx:27` [读] |
| `err.i.EditContactInfoWithData.25` | 打开/加载 getContactEndpoint 时 query isError | ContactInfoError 栏 | 离开该页或刷新后重试 | `inline` | `omnichannel` | ui | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfoWithData.tsx:25` [读] |
| `err.i.ContactInfoChannels.39` | 打开/加载 getContactChannels 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`No_channels_yet` 「No channels yet」；`No_channels_yet_description` 「Channels associated to this contact will appear here.」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Something_went_wrong, No_channels_yet, No_channels_yet_description, Last_contacts | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannels.tsx:39` [读] |
| `err.i.ContactInfoHistory.98` | 打开/加载 hasSourceType 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`No_history_yet` 「No history yet」；`No_history_yet_description` 「The entire message history with this contact will appear here.」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Something_went_wrong, No_history_yet, No_history_yet_description, Showing_current_of_total | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistory.tsx:98` [读] |
| `err.i.EditCustomFieldsWithData.24` | 打开/加载 getCustomFieldById 时 query isError | Callout danger：`Error` 「Error」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Error | `apps/meteor/client/views/omnichannel/customFields/EditCustomFieldsWithData.tsx:24` [读] |
| `err.i.EditDepartmentWithAllowedForwardData.31` | 打开/加载 getDepartmentListByIds 时 query isError | 行内错误文案：`Not_Available` 「Not Available」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Not_Available | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithAllowedForwardData.tsx:31` [读] |
| `err.i.EditDepartmentWithData.30` | 直达 `/omnichannel/departments/edit/not-a-real-dept` | 行内文案：「Department not found」（本种子未见 archived 分支） | 离开 Departments | `inline` | `omnichannel` | Department_not_found, Department_archived | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithData.tsx:30` [实测] `shots/vol10/07-department-not-found.webp` + `-recover.webp` |
| `err.i.NewDepartment.30` | 打开/加载 getDepartmentCreationAvailable 时 query isError | Callout danger：`Unavailable` 「Unavailable」；`New_Department` 「New Department」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Unavailable, New_Department | `apps/meteor/client/views/omnichannel/departments/NewDepartment.tsx:30` [读] |
| `err.i.DepartmentField.21` | 打开/加载 DepartmentField 时 query isError | 行内错误文案：`Something_went_wrong` 「Something went wrong」；`Department_not_found` 「Department not found」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Something_went_wrong, Department_not_found | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/DepartmentField.tsx:21` [读] |
| `err.i.DepartmentField.22` | 打开/加载 DepartmentField 时 query isError | 行内错误文案：`Department_not_found` 「Department not found」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Department_not_found | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/DepartmentField.tsx:22` [读] |
| `err.i.RoomEditWithData.19` | 打开/加载 RoomEditWithData 时 query isError | 行内错误文案：`Room_not_found` 「Room not found」；`Visitor_not_found` 「Visitor not found」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Room_not_found, Visitor_not_found | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEditWithData.tsx:19` [读] |
| `err.i.ChatsTable.108` | 打开/加载 headers 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | Something_went_wrong, Reload_page | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:108` [读] |
| `err.i.ContactField.36` | 打开/加载 getVisitorInfo 时 query isError | 行内错误文案：`Contact_not_found` 「Contact not found」；`Contact` 「Contact」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Contact_not_found, Contact | `apps/meteor/client/views/omnichannel/directory/components/ContactField.tsx:36` [读] |
| `err.i.PriorityField.22` | 打开/加载 PriorityField 时 query isError | 行内错误文案：`Custom_Field_Not_Found` 「Custom Field not found」；`Priority` 「Priority」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Custom_Field_Not_Found, Priority | `apps/meteor/client/views/omnichannel/directory/components/PriorityField.tsx:22` [读] |
| `err.i.SlaField.24` | 打开/加载 slaFieldId 时 query isError | 行内错误文案：`Custom_Field_Not_Found` 「Custom Field not found」；`SLA_Policy` 「SLA Policy」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Custom_Field_Not_Found, SLA_Policy | `apps/meteor/client/views/omnichannel/directory/components/SlaField.tsx:24` [读] |
| `err.i.ContactTable.139` | 打开/加载 headers 时 query isError | States 错误空态：`Connection_error` 「Connection error」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | Connection_error, Reload_page | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:139` [读] |
| `err.i.ManagersTable.146` | 打开/加载 headers 时 query isError | 整页/区块 GenericError | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | ui | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:146` [读] |
| `err.i.MonitorsTable.193` | 打开/加载 headers 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`Reload_page` 「Reload Page」 | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | Something_went_wrong, Reload_page | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:193` [读] |
| `err.i.PriorityEditFormWithData.21` | 打开/加载 PriorityEditFormWithData 时 query isError | Callout danger：`Not_Available` 「Not Available」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Not_Available | `apps/meteor/client/views/omnichannel/priorities/PriorityEditFormWithData.tsx:21` [读] |
| `err.i.ReportCardContent.19` | 打开/加载 ReportCardContent 时 query isError | ReportCardErrorState（可 Retry） | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | ui | `apps/meteor/client/views/omnichannel/reports/components/ReportCardContent.tsx:19` [读] |
| `err.i.SlaEditWithData.26` | 打开/加载 getSLA 时 query isError | Callout danger：`Not_Available` 「Not Available」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Not_Available | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEditWithData.tsx:26` [读] |
| `err.i.TagEditWithData.25` | 打开/加载 getTagById 时 query isError | Callout danger：`Not_Available` 「Not Available」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Not_Available | `apps/meteor/client/views/omnichannel/tags/TagEditWithData.tsx:25` [读] |
| `err.i.TagEditWithDepartmentData.23` | 打开/加载 getDepartmentsById 时 query isError | Callout danger：`Not_Available` 「Not Available」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Not_Available | `apps/meteor/client/views/omnichannel/tags/TagEditWithDepartmentData.tsx:23` [读] |
| `err.i.EditTriggerWithData.23` | 打开/加载 getTriggersById 时 query isError | Callout danger：`Error` 「Error」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Error | `apps/meteor/client/views/omnichannel/triggers/EditTriggerWithData.tsx:23` [读] |
| `err.i.TriggersTable.93` | 打开/加载 headers 时 query isError | 整页/区块 GenericError | 点 Retry / Reload_page / refetch | `inline` | `omnichannel` | ui | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:93` [读] |
| `err.i.UnitEditWithData.52` | 打开/加载 removeUnit 时 query isError | Callout danger：`Not_Available` 「Not Available」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Not_Available | `apps/meteor/client/views/omnichannel/units/UnitEditWithData.tsx:52` [读] |
| `err.i.WebhooksPageContainer.42` | 打开/加载 canViewLivechatWebhooks 时 query isError | Callout danger：`Webhooks` 「Webhooks」；`Error` 「Error」 | 离开该页或刷新后重试 | `inline` | `omnichannel` | Webhooks, Error | `apps/meteor/client/views/omnichannel/webhooks/WebhooksPageContainer.tsx:42` [读] |
| `err.t.queueManager.162` | unobserve Inquiry Count — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/app/livechat/client/lib/stream/queueManager.ts:162` [读] |
| `err.t.useOmnichannelLivechatToggle.18` | handle Available Status Change — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/navbar/NavBarOmnichannelGroup/hooks/useOmnichannelLivechatToggle.ts:18` [读] |
| `err.t.OmnichannelPreferencesPage.45` | handle Save — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/account/omnichannel/OmnichannelPreferencesPage.tsx:45` [读] |
| `err.t.AgentEdit.96` | handle Save — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/agents/AgentEdit.tsx:96` [读] |
| `err.t.useRemoveAgent.27` | on Delete Agent — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/agents/hooks/useRemoveAgent.tsx:27` [读] |
| `err.t.InterchangeableChart.100` | result — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/analytics/InterchangeableChart.tsx:100` [读] |
| `err.t.AppearancePage.73` | mapped Appearance — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/appearance/AppearancePage.tsx:73` [读] |
| `err.t.EditBusinessHours.77` | payload — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHours.tsx:77` [读] |
| `err.t.useRemoveBusinessHour.23` | on Delete Business Hour — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/businessHours/useRemoveBusinessHour.tsx:23` [读] |
| `err.t.CannedResponseEdit.68` | handle Save — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEdit.tsx:68` [读] |
| `err.t.CannedResponsesTable.70` | on Row Click 失败 | error toast：`Not_authorized` 「Not authorized」 | 关闭 toast；检查权限/房间设置后再试 | `toast` | `omnichannel` | Not_authorized | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:70` [读] |
| `err.t.CreateCannedResponseModal.56` | handle Create — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CreateCannedResponse/CreateCannedResponseModal.tsx:56` [读] |
| `err.t.useRemoveCannedResponse.27` | handle Delete — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/cannedResponses/modals/useRemoveCannedResponse.tsx:27` [读] |
| `err.t.Tags.51` | handle Tag Text Submit 失败 | error toast：`Enter_a_tag` 「Enter a tag」 | 关闭 toast；重试同一动作 | `toast` | `omnichannel` | Enter_a_tag | `apps/meteor/client/views/omnichannel/components/Tags.tsx:51` [读] |
| `err.t.Tags.57` | handle Tag Text Submit 失败 | error toast：`Tag_already_exists` 「Tag already exists」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `omnichannel` | Tag_already_exists | `apps/meteor/client/views/omnichannel/components/Tags.tsx:57` [读] |
| `err.t.OutboundMessageWizard.133` | payload — catch; mutate | error toast：`Outbound_message_not_sent` 「Outbound message not sent.」 | 关闭 toast；重试同一动作 | `toast` | `omnichannel` | Outbound_message_not_sent | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/OutboundMessageWizard.tsx:133` [读] |
| `err.t.MessageForm.76` | submit — 提交/保存 | error toast：`Something_went_wrong` 「Something went wrong」 | 关闭 toast；重试同一动作 | `toast` | `omnichannel` | Something_went_wrong | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/MessageForm/MessageForm.tsx:76` [读] |
| `err.t.RecipientForm.182` | submit — catch; 提交/保存 | error toast：`Something_went_wrong` 「Something went wrong」 | 关闭 toast；重试同一动作 | `toast` | `omnichannel` | Something_went_wrong | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/RecipientForm.tsx:182` [读] |
| `err.t.RepliesForm.114` | updated Department — catch; 提交/保存 | error toast：`Something_went_wrong` 「Something went wrong」 | 关闭 toast；重试同一动作 | `toast` | `omnichannel` | Something_went_wrong | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/RepliesForm.tsx:114` [读] |
| `err.t.useCreateContact.23` | handle Navigate — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/contactInfo/hooks/useCreateContact.ts:23` [读] |
| `err.t.useEditContact.23` | handle Navigate — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/contactInfo/hooks/useEditContact.ts:23` [读] |
| `err.t.useReviewContact.23` | handle Navigate — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/contactInfo/hooks/useReviewContact.ts:23` [读] |
| `err.t.useBlockChannel.27` | handle Unblock — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/useBlockChannel.tsx:27` [读] |
| `err.t.useBlockChannel.42` | block Action — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/useBlockChannel.tsx:42` [读] |
| `err.t.EditCustomFields.97` | handle Save — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/customFields/EditCustomFields.tsx:97` [读] |
| `err.t.useRemoveCustomField.25` | on Delete Agent — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/customFields/useRemoveCustomField.tsx:25` [读] |
| `err.t.AddAgent.41` | handle Save — 提交/保存 | error toast：`This_agent_was_already_selected` 「This agent was already selected」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `omnichannel` | This_agent_was_already_selected | `apps/meteor/client/views/omnichannel/departments/DepartmentAgentsTable/AddAgent.tsx:41` [读] |
| `err.t.DepartmentItemMenu.54` | handle Toggle Archive — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentItemMenu.tsx:54` [读] |
| `err.t.RemoveDepartmentModal.32` | on Submit — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/RemoveDepartmentModal.tsx:32` [读] |
| `err.t.EditDepartment.118` | agent List Payload — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:118` [读] |
| `err.t.ChatInfo.73` | has Edit Access 失败 | error toast：`Not_authorized` 「Not authorized」 | 关闭 toast；检查权限/房间设置后再试 | `toast` | `omnichannel` | Not_authorized | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:73` [读] |
| `err.t.RoomEdit.112` | room Data — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEdit.tsx:112` [读] |
| `err.t.ChatsTableFilter.31` | on Delete All — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableFilter.tsx:31` [读] |
| `err.t.RemoveChatButton.29` | on Delete Agent — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/RemoveChatButton.tsx:29` [读] |
| `err.t.RemoveContactModal.48` | remove Contact Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/directory/contacts/RemoveContactModal.tsx:48` [读] |
| `err.t.useOmnichannelPrioritiesMenu.31` | handle Priority Change — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/hooks/useOmnichannelPrioritiesMenu.ts:31` [读] |
| `err.t.RemoveManagerButton.36` | on Delete Manager — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/managers/RemoveManagerButton.tsx:36` [读] |
| `err.t.CloseChatModal.146` | cannot Send Transcript Email 失败 | error toast：`Customer_without_registered_email` 「The customer does not have a registered email address」 | 关闭 toast；重试同一动作 | `toast` | `omnichannel` | Customer_without_registered_email | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:146` [读] |
| `err.t.ForwardChatModal.91` | handle Forward Chat — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/modals/ForwardChatModal.tsx:91` [读] |
| `err.t.MonitorsTable.92` | add Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:92` [读] |
| `err.t.MonitorsTable.106` | on Delete Monitor — mutation/query onError; catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:106` [读] |
| `err.t.PrioritiesPage.52` | on Reset — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/priorities/PrioritiesPage.tsx:52` [读] |
| `err.t.RemoveSlaButton.25` | on Delete Agent — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/slaPolicies/RemoveSlaButton.tsx:25` [读] |
| `err.t.SlaEdit.80` | payload — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEdit.tsx:80` [读] |
| `err.t.TagEdit.70` | departments Id — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/tags/TagEdit.tsx:70` [读] |
| `err.t.useRemoveTag.25` | handle Delete — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/tags/useRemoveTag.tsx:25` [读] |
| `err.t.EditTrigger.120` | save Trigger Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/triggers/EditTrigger.tsx:120` [读] |
| `err.t.TriggersRow.41` | on Delete Trigger — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/triggers/TriggersRow.tsx:41` [读] |
| `err.t.UnitEdit.123` | payload — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:123` [读] |
| `err.t.useRemoveUnit.25` | on Delete Agent — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/units/useRemoveUnit.tsx:25` [读] |
| `err.t.WebhooksPage.140` | handle Save — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/webhooks/WebhooksPage.tsx:140` [读] |
| `err.t.WebhooksPage.147` | test Webhook — mutation/query onError; catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `omnichannel` | api | `apps/meteor/client/views/omnichannel/webhooks/WebhooksPage.tsx:147` [读] |

### 3.registration（5）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.t.SetupWizardProvider.98` | register Admin User — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `registration` | api | `packages/ui-client/src/views/setupWizard/providers/SetupWizardProvider.tsx:98` [读] |
| `err.t.SetupWizardProvider.185` | query Client — catch | error toast：`Cloud_register_error` 「There has been an error trying to process your request. Please try again later.」 | 关闭 toast；重试同一动作 | `toast` | `registration` | Cloud_register_error | `packages/ui-client/src/views/setupWizard/providers/SetupWizardProvider.tsx:185` [读] |
| `err.t.CloudAccountConfirmation.38` | get Confirmation — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `registration` | api | `packages/ui-client/src/views/setupWizard/steps/CloudAccountConfirmation.tsx:38` [读] |
| `err.t.RegisterServerStep.68` | get Workspace Register Data — mutation/query onError | error toast：`Cloud_register_error` 「There has been an error trying to process your request. Please try again later.」 | 关闭 toast；重试同一动作 | `toast` | `registration` | Cloud_register_error | `packages/ui-client/src/views/setupWizard/steps/RegisterServerStep.tsx:68` [读] |
| `err.t.RegisterForm.116` | handle Register 失败 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `registration` | api | `packages/web-ui-registration/src/RegisterForm.tsx:116` [读] |

### 3.room（60）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.i.ImageGalleryData.19` | 打开/加载 ImageGalleryData 时 query isError | ImageGalleryError | 离开该页或刷新后重试 | `inline` | `room` | ui | `apps/meteor/client/views/room/ImageGallery/ImageGalleryData.tsx:19` [读] |
| `err.i.RoomOpener.40` | 直达 `/channel/not-a-real-room-vol10`（`useOpenRoom` isError → `RoomNotFoundError`） | NotFoundState：「Room not found」；「The room does not exist or you may not have access permission」；Homepage | 点 Homepage → `/home` | `inline` | `room` | Room_not_found, Room_not_exist_or_not_permission | `apps/meteor/client/views/room/RoomOpener.tsx:40` [实测] `shots/vol10/11-room-not-found.webp` + `-recover.webp` |
| `err.i.RoomOpenerEmbedded.61` | 打开/加载 rid 时 query isError | States 错误空态：`core.Error` | 离开该页或刷新后重试 | `inline` | `room` | core.Error | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:61` [读] |
| `err.i.MessageSearchTab.123` | 打开/加载 all 时 query isError | Callout danger：`Search_current_provider_not_active` 「Current Search Provider is not active」 | 离开该页或刷新后重试 | `inline` | `room` | Search_current_provider_not_active | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:123` [读] |
| `err.i.InviteUsersWithData.93` | 打开/加载 handleGenerateLink 时 query isError | InviteUsersError 栏 | 离开该页或刷新后重试 | `inline` | `room` | ui | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteUsersWithData.tsx:93` [读] |
| `err.i.UserInfoWithData.110` | 直达 `/channel/general/members-list/not-a-real-user-vol10` | User Info 栏 Callout：「User not found」 | 关栏 → `#general` | `inline` | `room` | User_not_found | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:110` [实测] `shots/vol10/12-room-user-not-found.webp` + `-recover.webp` |
| `err.q.useMessageSearchQuery.30` | result — react-query 失败（ToastMessagesProvider.onError） | error toast：query meta `errorToastMessage`：`Search_message_search_failed` 「Search request failed」 | 关闭 toast；刷新或重进该页 | `qmeta` | `room` | Search_message_search_failed | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/hooks/useMessageSearchQuery.ts:30` [读] |
| `err.t.VideoMessageRecorder.106` | handle Cancel 失败 | error toast：`Browser_does_not_support_recording_video` 「Your browser does not support recording video」 | 关闭 toast；重试同一动作 | `toast` | `room` | Browser_does_not_support_recording_video | `apps/meteor/client/views/composer/VideoMessageRecorder/VideoMessageRecorder.tsx:106` [读] |
| `err.t.useQuickActions.87` | handle Request Transcript — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:87` [读] |
| `err.t.useQuickActions.103` | handle Send Transcript PDF — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:103` [读] |
| `err.t.useQuickActions.115` | handle Send Transcript — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:115` [读] |
| `err.t.useQuickActions.132` | handle Discard Transcript — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:132` [读] |
| `err.t.useQuickActions.166` | handle Close — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:166` [读] |
| `err.t.useQuickActions.178` | return Chat To Queue Mutation — mutation/query onError; catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:178` [读] |
| `err.t.useQuickActions.190` | put Chat On Hold Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:190` [读] |
| `err.t.useQuickActions.216` | visitor Email 失败 | error toast：`Customer_without_registered_email` 「The customer does not have a registered email address」 | 关闭 toast；重试同一动作 | `toast` | `room` | Customer_without_registered_email | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:216` [读] |
| `err.t.ShareLocationModal.54` | on Confirm — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/ShareLocation/ShareLocationModal.tsx:54` [读] |
| `err.t.ComposerAnonymous.31` | result — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/composer/ComposerAnonymous.tsx:31` [读] |
| `err.t.ComposerJoinWithPassword.29` | 普通用户直达 `/channel/vol10-secret`（`joinCodeRequired`），预览栏填错误口令并 Join | error toast：「Invalid code [error-code-invalid]」；口令框红框 | 关 toast；仍停在预览，未入房；回 `/home` | `toast` | `room` | error-code-invalid | `apps/meteor/client/views/room/composer/ComposerJoinWithPassword.tsx:29` [实测] `shots/vol10/22-join-wrong-password.webp` + `-recover.webp` |
| `err.t.ComposerMessage.38` | composer Props — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/composer/ComposerMessage.tsx:38` [读] |
| `err.t.ComposerMessage.65` | new Message Sent — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/composer/ComposerMessage.tsx:65` [读] |
| `err.t.ComposerOmnichannelInquiry.37` | handle Take Inquiry — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannelInquiry.tsx:37` [读] |
| `err.t.ComposerOmnichannelJoin.24` | join — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannelJoin.tsx:24` [读] |
| `err.t.useResumeChatOnHoldMutation.29` | query Client — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/composer/ComposerOmnichannel/hooks/useResumeChatOnHoldMutation.ts:29` [读] |
| `err.t.ComposerReadOnly.21` | join — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/composer/ComposerReadOnly.tsx:21` [读] |
| `err.t.useDownloadExportMutation.63` | file Data — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/ExportMessages/useDownloadExportMutation.ts:63` [读] |
| `err.t.useExportMessagesAsPDFMutation.190` | link — mutation/query onError; catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/ExportMessages/useExportMessagesAsPDFMutation.tsx:190` [读] |
| `err.t.useRoomExportMutation.19` | rooms Export — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/ExportMessages/useRoomExportMutation.ts:19` [读] |
| `err.t.EditRoomInfo.193` | data — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:193` [读] |
| `err.t.useRoomConvertToTeam.27` | on Confirm — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/Info/hooks/actions/useRoomConvertToTeam.tsx:27` [读] |
| `err.t.useRoomLeave.40` | leave Action — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/Info/hooks/actions/useRoomLeave.tsx:40` [读] |
| `err.t.useRoomMoveToTeam.29` | on Confirm — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/Info/hooks/actions/useRoomMoveToTeam.tsx:29` [读] |
| `err.t.PruneMessagesWithData.104` | limit — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/PruneMessages/PruneMessagesWithData.tsx:104` [读] |
| `err.t.useDeleteFile.20` | on Confirm — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/RoomFiles/hooks/useDeleteFile.tsx:20` [读] |
| `err.t.useAddMatrixUsers.38` | matrix Ids Verification Response — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddMatrixUsers/useAddMatrixUsers.tsx:38` [读] |
| `err.t.AddUsers.107` | users To Unban — 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddUsers.tsx:107` [读] |
| `err.t.Thread.56` | toggle Following Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:56` [读] |
| `err.t.useBanUser.39` | room Name — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useBanUser.tsx:39` [读] |
| `err.t.useGoToRoom.36` | get Room Info — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useGoToRoom.ts:36` [读] |
| `err.t.useToggleFavoriteMutation.41` | query Client — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useToggleFavoriteMutation.ts:41` [读] |
| `err.t.useUnbanUser.37` | room Name — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useUnbanUser.tsx:37` [读] |
| `err.t.useAddUserAction.81` | users — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useAddUserAction.ts:81` [读] |
| `err.t.useBlockUserAction.41` | toggle Block User Action — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useBlockUserAction.ts:41` [读] |
| `err.t.useChangeLeaderAction.52` | toggle Owner Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useChangeLeaderAction.ts:52` [读] |
| `err.t.useChangeModeratorAction.85` | toggle Moderator — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useChangeModeratorAction.tsx:85` [读] |
| `err.t.useChangeOwnerAction.84` | toggle Owner Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useChangeOwnerAction.tsx:84` [读] |
| `err.t.useIgnoreUserAction.42` | ignore User Action — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useIgnoreUserAction.ts:42` [读] |
| `err.t.useMuteUserAction.85` | on Confirm — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useMuteUserAction.tsx:85` [读] |
| `err.t.useReportUser.29` | report User Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useReportUser.tsx:29` [读] |
| `err.t.DeleteMessageConfirmModal.46` | delete Message Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/modals/DeleteMessageConfirmModal/DeleteMessageConfirmModal.tsx:46` [读] |
| `err.t.ResetKeysE2EEModal.31` | handle Reset Room Key — mutation/query onError | error toast：`E2E_reset_encryption_keys_error` 「Encryption keys reset failed」 | 关闭 toast；重试同一动作 | `toast` | `room` | E2E_reset_encryption_keys_error | `apps/meteor/client/views/room/modals/E2EEModals/ResetKeysE2EEModal.tsx:31` [读] |
| `err.t.ForwardMessageModal.65` | send Payload — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/modals/ForwardMessageModal/ForwardMessageModal.tsx:65` [读] |
| `err.t.ReadReceiptsModal.44` | read Receipts Result 失败 | error toast：动态 message | 关闭 toast；重试同一动作 | `toast` | `room` | dynamic | `apps/meteor/client/views/room/modals/ReadReceiptsModal/ReadReceiptsModal.tsx:44` [读] |
| `err.t.ReportMessageModal.48` | handle Report Message — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/modals/ReportMessageModal/ReportMessageModal.tsx:48` [读] |
| `err.t.useAppsRoomActions.43` | room — catch | error toast：`UIKit_Interaction_Timeout` 「App has failed to respond. Please try again or contact your admin」 | 关闭 toast；稍后重试同一动作 | `toast` | `room` | UIKit_Interaction_Timeout | `apps/meteor/client/views/room/providers/hooks/useAppsRoomActions.ts:43` [读] |
| `err.t.AddWebdavAccountModal.51` | handle Add Webdav Account — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/webdav/AddWebdavAccountModal.tsx:51` [读] |
| `err.t.SaveToWebdavModal.85` | response — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/webdav/SaveToWebdavModal.tsx:85` [读] |
| `err.t.WebdavFilePickerModal.83` | handle Get Webdav File List — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:83` [读] |
| `err.t.WebdavFilePickerModal.135` | upload File — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:135` [读] |
| `err.t.WebdavFilePickerModal.149` | file — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `room` | api | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:149` [读] |

### 3.shell（60）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.i.DefaultParentRoomField.36` | 打开/加载 roomsInfoEndpoint 时 query isError | Callout danger：`Error` 「Error」 | 离开该页或刷新后重试 | `inline` | `shell` | Error | `apps/meteor/client/components/CreateDiscussion/DefaultParentRoomField.tsx:36` [读] |
| `err.i.DeviceManagementTable.41` | 打开/加载 DeviceManagementTable 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`We_Could_not_retrive_any_data` 「We couldn't retrive any data」；`Retry` 「Retry」 | 点 Retry / Reload_page / refetch | `inline` | `shell` | Something_went_wrong, We_Could_not_retrive_any_data, Retry, Devices | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:41` [读] |
| `err.i.MailerUnsubscriptionPage.42` | 打开/加载 MailerUnsubscriptionPage 时 query isError | Callout danger：`You_have_successfully_unsubscribed` 「You have successfully unsubscribed from our Mailling List.」 | 离开该页或刷新后重试 | `inline` | `shell` | You_have_successfully_unsubscribed | `apps/meteor/client/views/mailer/MailerUnsubscriptionPage.tsx:42` [读] |
| `err.i.OAuthAuthorizationPage.27` | 打开/加载 oauthAppQuery 时 query isError | ErrorPage：getErrorMessage | 离开该页或刷新后重试 | `inline` | `shell` | ui | `apps/meteor/client/views/oauth/OAuthAuthorizationPage.tsx:27` [读] |
| `err.i.OutlookEventsList.32` | 打开/加载 hasOutlookMethods 时 query isError | States 错误空态：`Outlook_calendar` 「Outlook calendar」 | 离开该页或刷新后重试 | `inline` | `shell` | Outlook_calendar | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:32` [读] |
| `err.i.OutlookEventsList.57` | 打开/加载 outlookUrl 时 query isError | States 错误空态：`Something_went_wrong` 「Something went wrong」；`No_history` 「No history」 | 离开该页或刷新后重试 | `inline` | `shell` | Something_went_wrong, No_history | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:57` [读] |
| `err.t.sendMessage.21` | message Already Exists 失败 | error toast：`Message_Already_Sent` 「This message has already been sent and is being processed by the server」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `shell` | Message_Already_Sent | `apps/meteor/app/lib/client/methods/sendMessage.ts:21` [读] |
| `err.t.status.17` | Status — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/app/slashcommands-status/client/status.ts:17` [读] |
| `err.t.topic.18` | Topic — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/app/slashcommands-topic/client/topic.ts:18` [读] |
| `err.t.ActionManager.124` | timeout Promise — catch | error toast：`UIKit_Interaction_Timeout` 「App has failed to respond. Please try again or contact your admin」 | 关闭 toast；稍后重试同一动作 | `toast` | `shell` | UIKit_Interaction_Timeout | `apps/meteor/app/ui-message/client/ActionManager.ts:124` [读] |
| `err.t.orchestrator.42` | is Error Object 失败 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/apps/orchestrator.ts:42` [读] |
| `err.t.TwoFactorEmailModal.67` | on Click Resend Code — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | error-email-send-failed | `apps/meteor/client/components/TwoFactorModal/TwoFactorEmailModal.tsx:67` [读] |
| `err.t.RoomAvatarEditor.35` | reader 失败 | error toast：`Avatar_format_invalid` 「Invalid Format. Only image type is allowed」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `shell` | Avatar_format_invalid | `apps/meteor/client/components/avatar/RoomAvatarEditor.tsx:35` [读] |
| `err.t.UserAvatarEditor.45` | data URL — catch | error toast：`Avatar_format_invalid` 「Invalid Format. Only image type is allowed」 | 关闭 toast；按文案改正输入后再提交 | `toast` | `shell` | Avatar_format_invalid | `apps/meteor/client/components/avatar/UserAvatarEditor/UserAvatarEditor.tsx:45` [读] |
| `err.t.DownloadDataButton.44` | handle Click — catch; 点击 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/components/dashboards/DownloadDataButton.tsx:44` [读] |
| `err.t.useLeaveRoom.45` | leave — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/menuActions/useLeaveRoom.tsx:45` [读] |
| `err.t.useToggleFavoriteAction.13` | handle Toggle Favorite — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/menuActions/useToggleFavoriteAction.ts:13` [读] |
| `err.t.useToggleNotificationsAction.25` | handle Toggle Notification — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/menuActions/useToggleNotificationsAction.ts:25` [读] |
| `err.t.useToggleReadAction.45` | handle Toggle Read — catch; mutate | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/menuActions/useToggleReadAction.ts:45` [读] |
| `err.t.useAppsRoomStarActions.63` | filtered Actions — catch; 点击 | error toast：`UIKit_Interaction_Timeout` 「App has failed to respond. Please try again or contact your admin」 | 关闭 toast；稍后重试同一动作 | `toast` | `shell` | UIKit_Interaction_Timeout | `apps/meteor/client/hooks/roomActions/useAppsRoomStarActions.tsx:63` [读] |
| `err.t.useClipboardWithToast.12` | use Clipboard With Toast 失败 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/useClipboardWithToast.ts:12` [读] |
| `err.t.useDeviceLogout.40` | is Contextual Bar Open — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/useDeviceLogout.tsx:40` [读] |
| `err.t.useEndpointMutation.35` | send Data — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/useEndpointMutation.ts:35` [读] |
| `err.t.useEndpointUploadMutation.35` | result — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/useEndpointUploadMutation.ts:35` [读] |
| `err.t.useHideRoomAction.56` | hide Room — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/useHideRoomAction.tsx:56` [读] |
| `err.t.useJoinRoom.31` | join Channel — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/useJoinRoom.ts:31` [读] |
| `err.t.useLdapSync.22` | handle Sync Now — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/hooks/useLdapSync.tsx:22` [读] |
| `err.t.useLdapSync.30` | handle Sync Now — catch | error toast：`Connection_failed` 「LDAP Connection Failed」 | 关闭 toast；重试同一动作 | `toast` | `shell` | Connection_failed | `apps/meteor/client/hooks/useLdapSync.tsx:30` [读] |
| `err.t.useMessageboxAppsActionButtons.41` | data — catch | error toast：`UIKit_Interaction_Timeout` 「App has failed to respond. Please try again or contact your admin」 | 关闭 toast；稍后重试同一动作 | `toast` | `shell` | UIKit_Interaction_Timeout | `apps/meteor/client/hooks/useMessageboxAppsActionButtons.ts:41` [读] |
| `err.t.useUserDropdownAppsActionButtons.39` | data — catch; 点击 | error toast：`UIKit_Interaction_Timeout` 「App has failed to respond. Please try again or contact your admin」 | 关闭 toast；稍后重试同一动作 | `toast` | `shell` | UIKit_Interaction_Timeout | `apps/meteor/client/hooks/useUserDropdownAppsActionButtons.ts:39` [读] |
| `err.t.processMessageEditing.29` | mid — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/lib/chats/flows/processMessageEditing.ts:29` [读] |
| `err.t.processMessageUploads.155` | composed Message — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/lib/chats/flows/processMessageUploads.ts:155` [读] |
| `err.t.processSetReaction.31` | last Message — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/lib/chats/flows/processSetReaction.ts:31` [读] |
| `err.t.processTooLongMessage.20` | `#general` 发送 ≥81 字（本种子 `Message_MaxAllowedSize=80` 且关闭转附件） | error toast：「Message too long」 | 关闭 toast；超长稿仍留在 composer | `toast` | `shell` | Message_too_long | `apps/meteor/client/lib/chats/flows/processTooLongMessage.ts:20` [实测] `shots/vol10/02-message-too-long.webp` + `-recover.webp` |
| `err.t.requestMessageDeletion.11` | 本种子 `Message_AllowDeleting=false`；`vol10user` 对己消息无 Delete 菜单，Edit 后清空 composer 再发送 | error toast：「This message cannot be deleted anymore」；编辑态仍在、原文被 reset 回 composer | 关 toast；Esc 取消编辑 | `toast` | `shell` | Message_deleting_blocked | `apps/meteor/client/lib/chats/flows/requestMessageDeletion.ts:11` [实测] `shots/vol10/23-delete-blocked.webp` + `-recover.webp` |
| `err.t.sendMessage.76` | send Message — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/lib/chats/flows/sendMessage.ts:76` [读] |
| `err.t.sendMessage.123` | original Message — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/lib/chats/flows/sendMessage.ts:123` [读] |
| `err.t.sendMessage.146` | original Message — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/lib/chats/flows/sendMessage.ts:146` [读] |
| `err.t.uploadFiles.19` | `#general` composer 一次附上 11 个文件（上限 10） | error toast：「You can't upload more than 10 files at once.」 | 关 toast；composer 仍空 | `toast` | `shell` | You_cant_upload_more_than__count__files | `apps/meteor/client/lib/chats/flows/uploadFiles.ts:19` [实测] `shots/vol10/25-upload-11-toast.webp` + `-recover.webp` |
| `err.t.uploadFiles.28` | room 失败 | error toast：`You_cant_send_unencrypted_files_in_an_encrypted_room` | 关闭 toast；按文案改正输入后再提交 | `toast` | `shell` | You_cant_send_unencrypted_files_in_an_encrypted_room | `apps/meteor/client/lib/chats/flows/uploadFiles.ts:28` [读] |
| `err.t.uploadFiles.50` | encrypted File 失败 | error toast：`Error_encrypting_file` 「Error while encrypting file」 | 关闭 toast；重试同一动作 | `toast` | `shell` | Error_encrypting_file | `apps/meteor/client/lib/chats/flows/uploadFiles.ts:50` [读] |
| `err.t.callWithErrorHandling.13` | call With Error Handling — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/lib/utils/callWithErrorHandling.ts:13` [读] |
| `err.t.accounts.83` | storage Backend — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/meteor/startup/accounts.ts:83` [读] |
| `err.t.QueryClientProviderMock.27` | query Cache Instance — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/stories/contexts/QueryClientProviderMock.tsx:27` [读] |
| `err.t.QueryClientProviderMock.29` | query Cache Instance — mutation/query onError | error toast：动态 message | 关闭 toast；重试同一动作 | `toast` | `shell` | dynamic | `apps/meteor/client/stories/contexts/QueryClientProviderMock.tsx:29` [读] |
| `err.t.UiKitBanner.50` | handle Close — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/banners/UiKitBanner.tsx:50` [读] |
| `err.t.useDismissUserBannerMutation.12` | dismiss Banner — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/banners/hooks/useDismissUserBannerMutation.ts:12` [读] |
| `err.t.CustomContentCard.28` | handle Change Custom Content Visibility — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/home/cards/CustomContentCard.tsx:28` [读] |
| `err.t.CustomContentCard.36` | handle Only Show Custom Content — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/home/cards/CustomContentCard.tsx:36` [读] |
| `err.t.useArchiveRoom.16` | handle Archive — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/hooks/roomActions/useArchiveRoom.ts:16` [读] |
| `err.t.useDeleteRoom.43` | delete Room Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/hooks/roomActions/useDeleteRoom.tsx:43` [读] |
| `err.t.useDeleteRoom.62` | delete Team Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/hooks/roomActions/useDeleteRoom.tsx:62` [读] |
| `err.t.useResetE2EPasswordMutation.20` | reset E2e Key — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/hooks/useResetE2EPasswordMutation.ts:20` [读] |
| `err.t.MailerUnsubscriptionPage.19` | mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/mailer/MailerUnsubscriptionPage.tsx:19` [读] |
| `err.t.OutlookSettingsList.36` | handle Notify Calendar Events — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/outlookCalendar/OutlookSettingsList/OutlookSettingsList.tsx:36` [读] |
| `err.t.useOutlookCalendarList.49` | sync Mutation — mutation/query onError; mutate | error toast：`Outlook_Sync_Failed` 「Failed to load outlook events.」 | 关闭 toast；重试同一动作 | `toast` | `shell` | Outlook_Sync_Failed | `apps/meteor/client/views/outlookCalendar/hooks/useOutlookCalendarList.ts:49` [读] |
| `err.t.RegisterUsername.90` | register Username Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/root/MainLayout/RegisterUsername.tsx:90` [读] |
| `err.t.SAMLLoginRoute.17` | router 失败 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/root/SAMLLoginRoute.tsx:17` [读] |
| `err.t.useRootUrlChange.33` | set Site Url — mutation/query onError | error toast：`Something_went_wrong` 「Something went wrong」 | 关闭 toast；重试同一动作 | `toast` | `shell` | Something_went_wrong | `apps/meteor/client/views/root/hooks/loggedIn/useRootUrlChange.tsx:33` [读] |
| `err.t.useEscapeKeyStroke.14` | clear Unread All Messages Mutation — mutation/query onError | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `shell` | api | `apps/meteor/client/views/root/hooks/useEscapeKeyStroke.ts:14` [读] |

### 3.teams（4）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.t.AddExistingModal.56` | handle Add Channels — catch; 提交/保存 | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `teams` | api | `apps/meteor/client/views/teams/contextualBar/channels/AddExistingModal/AddExistingModal.tsx:56` [读] |
| `err.t.useRemoveRoomFromTeam.24` | on Confirm Action 失败 | error toast：`Room_has_been_removed` 「Room has been removed」 | 关闭 toast；重试同一动作 | `toast` | `teams` | Room_has_been_removed | `apps/meteor/client/views/teams/contextualBar/channels/hooks/useRemoveRoomFromTeam.tsx:24` [读] |
| `err.t.useRemoveRoomFromTeam.27` | on Confirm Action — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `teams` | api | `apps/meteor/client/views/teams/contextualBar/channels/hooks/useRemoveRoomFromTeam.tsx:27` [读] |
| `err.t.useToggleAutoJoin.41` | message — catch | error toast：`getErrorMessage(error)`（API `reason`/`error`/`message`，经 `t()`） | 关闭 toast；按 API 文案修正后重试同一动作 | `toast` | `teams` | api | `apps/meteor/client/views/teams/contextualBar/channels/hooks/useToggleAutoJoin.ts:41` [读] |

### 3.videoconf（1）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.t.VideoConfProvider.35` | message — 视频会议 error 事件 | error toast：动态 message | 关闭 toast；重试同一动作 | `toast` | `videoconf` | dynamic | `apps/meteor/client/providers/VideoConfProvider.tsx:35` [读] |

### 3.voip（3）

| 稳定语义 id | 触发 | 用户看见 | 恢复 | 通道 | 表面 | 键/种类 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `err.t.useFullscreenToggle.57` | toggle Fullscreen — catch | error toast：`Fullscreen_failed_to_switch_not_allowed` 「Switching to fullscreen was not allowed, please check your browser settings.」 | 关闭 toast；重试同一动作 | `toast` | `voip` | Fullscreen_failed_to_switch_not_allowed | `packages/ui-voip/src/views/useFullscreenToggle.ts:57` [读] |
| `err.t.usePopoutWindow.125` | result — catch | error toast：`Failed_to_open_call_window` 「Failed to open call window」 | 关闭 toast；重试同一动作 | `toast` | `voip` | Failed_to_open_call_window | `packages/ui-voip/src/views/usePopoutWindow.ts:125` [读] |
| `err.td.useMediaSessionInstance.319` | unsub Notification 失败 | error toast：运行时 `TranslationKey`（voip requestToast 等） | 关闭 toast；重试同一动作 | `toast-dyn` | `voip` | dynamic | `packages/ui-voip/src/providers/useMediaSessionInstance.ts:319` [读] |

本表数据行：**390**。

## 4. 非闭集（必须写明，避免误扩）

- **成功/info/warning toast**：`dispatchToastMessage({ type: 'success'|'info'|'warning' })` 不是错误路径。
- **仅 console / 内部状态的 catch**：例如 E2EE 密钥状态机内部 `catch` 若不 toast、不渲染 States，不入表。
- **`isError` 隐藏而非报错**：`PlanTag.tsx`、`SidebarFooterWatermark.tsx`、`useLicenseLimitsByBehavior.ts` 在 isError 时 `return null` / 不贴 Community 标签。
- **基础设施实现**：`toast.ts`（payload 类型）、`ToastMessagesProvider`（订阅 + queryCache.onError 转发）、`useToastMessageDispatch`、`ToastMessagesContext`。用户看见的是调用点，不是这几处。
- **`packages/livechat`**：访客 widget，0 Toast API。
- **server-only 抛错**：未到客户端渲染的 REST/Meteor 错误不入本册（用户只在客户端看到 toast/States 时才算）。
- **Apps 运行时错误文案**：`handleAPIError` 的 `Apps_Error_${error}` 是开放后缀，本行只记调用点。

## 5. Boot（2026-08-22 第二轮，已通）

跳过 docker compose（overlayfs）。与 Volume 5 同一路径：

```
Mongo 8.0.12 tarball ubuntu2404 + rs0 127.0.0.1:27017
nvm 22.22.3；Meteor 3.4.1；deno 2.3.1
yarn install；turbo build --filter=@rocket.chat/meteor... --filter=!@rocket.chat/meteor（60/60，i18n resources=68）
MONGO_URL='mongodb://127.0.0.1:27017/rocketchat?replicaSet=rs0&directConnection=true&retryWrites=false'
ROOT_URL=http://127.0.0.1:3000 OVERWRITE_SETTING_Show_Setup_Wizard=completed TEST_MODE=true
cd apps/meteor && meteor npm run dsv
```

横幅：`Rocket.Chat 8.8.0-develop` / Node 22.22.1 / Mongo 8.0.12 / Site URL `http://127.0.0.1:3000` / **Commit Hash `b1f15b2f27`**（本 docs 分支 HEAD）。产品 merge-base 仍是 **`e519470d35`**。

`curl /` → **200**。`POST /api/v1/login` `rocketchat.internal.admin.test` / `rocketchat.internal.admin.test` → **success**。

上一轮「无 meteor / 无 mongo / STOP」作废。

## 7. Live 等式（未关闭）

**11 + 379 = 390**。`[实测]` 只这 11 行（截图在 `shots/vol10/`）。下面不是表体，不计入 `rg '^\| \`err\.'`：

1. `err.t.useValidateInviteQuery.42` — Failed to validate invite token — 关 toast；`/home`
2. `err.t.useInviteTokenMutation.31` — Failed to activate invite token — 关 toast；`/home`
3. `err.t.processTooLongMessage.20` — Message too long — 关 toast；超长稿仍在 composer
4. `err.i.AdminUserFormWithData.35` — User not found — 离开 Edit User 栏
5. `err.i.EditIntegrationsPageWithData.36` — Oops, page not found — 离开 Integrations
6. `err.i.EditDepartmentWithData.30` — Department not found — 离开 Departments
7. `err.i.RoomOpener.40` — Room not found / The room does not exist or you may not have access permission — Homepage → `/home`
8. `err.i.UserInfoWithData.110` — User not found（#general User Info 栏）— 关栏
9. `err.t.ComposerJoinWithPassword.29` — Invalid code [error-code-invalid] — 关 toast；仍预览
10. `err.t.requestMessageDeletion.11` — This message cannot be deleted anymore — 关 toast；Esc 取消编辑
11. `err.t.uploadFiles.19` — You can't upload more than 10 files at once. — 关 toast

本种子走过但 **不升**（DOM 对不上该行，不盖不可达）：

- `err.i.MessageSearchTab.123`：`/channel/general/rocket-search` 显示 **No results found**，Search Provider 在本种子是活的，没有 Callout。
- `err.t.CreateChannelModal.184`：重名 `general` 是字段红字 **The channel '#general' already exists.**，不是 catch toast。
- 登录错密 / 假邮箱：登录卡字段红字 **User not found or incorrect password**（`20-login-wrong.webp`、`20b-login-invalid-email.webp`）。`LoginForm` 不在 390 闭集，不发明行。
- `err.t.RegisterForm.116`：空表是 **Name/Email/Username/Password required**；占用邮箱是字段/浮层 **The email entered is invalid** + 密码复杂度（`21-register-empty.webp`、`21-register-taken.webp`）。不是 `error-too-many-requests` toast。
- 管理员删 `vol10-seed-delete-me`（当时未关删除）：确认框 **Are you sure?**，不是 blocked toast（`08-delete-confirm-modal.webp`）。本轮关 `Message_AllowDeleting` 后已用 `vol10user` 升 `.11`。
- 跳转 `/channel/general?msg=not-a-real-message-vol10`：房间照常打开，无 toast / 无 inline（`24-jump-missing-msg-miss.webp`）。`useTryToJumpToMessage` 无 error UI；`Message_not_found` 是 warning toast 且不在本册。
- `err.t.usePermalinkAction.43`：未走 copy-link catch（跳缺失消息不是该调用点）。
- `err.t.useInviteTokenMutation.18`（onSuccess 且无 `room.name`）：本种子走的是 onError `.31`，没截到 `.18`。
- `err.i.AgentInfo.42`：`/omnichannel/agents/info/not-a-real-agent-vol10` 是 **Application Error / The application GUI just crashed.**，不是 `User_not_found`（`13-agent-not-found-miss.webp`）。
- `err.i.AppInstances.53`：`/marketplace/explore/info/…/instances` 停在 App Info skeleton，没有「App not found」（`14-app-not-found-miss.webp`）。
- `err.i.EditRolePageWithData.28`：假 role 走的是 line 20 Callout **Invalid role**，不是 line 28 `GenericError`（`15-role-not-found.webp`）。
- `err.i.OAuthAuthorizationPage.27`：`/oauth/authorize` 与假 `client_id` 都被服务端重定向到 `/oauth/error/404` 的 `OAuthErrorPage`（「Error」/「Invalid OAuth client」）。该页不在 390 闭集，不是 AuthorizationPage isError（`16-oauth-error.webp`、`18-oauth-authorize.webp`）。
- composer 超小体积上传（当时 `FileUpload_MaxFileSize=10`）：卡片红字 **Upload failed**，没有 toast，不升 `processMessageUploads` / `uploadFiles.28/.50`（`17-upload-fail-inline.webp`）。11 文件上限 toast 已升 `.19`。
- `Avatar_format_invalid`：`.txt` 走 `isValidImageFormat` 只 `resolve(false)`，一般不抛 toast。
- 2FA：`TEST_MODE` 短路，本轮没做成。

Volume 10 **未** live-closed。不发明功能总数。

## 6. 目标文件分类（证明已扫）

走访 **3339** 个客户端文件。下面两个清单覆盖全部 toast API 文件与全部 `isError` 文件，每一行必须落在一个类。`miss_toast=0` `miss_iserr=0`（必须 0）。

toast API 275 = error-row 240 + success-info-warning-only 31 + infra 4.

isError 114 = inline-row 84 + hide-only 11 + type-or-default 3 + pass-through 1 + type-guard 1 + no-error-ui 14.

### 6.1 toast API 文件

| 文件 | 分类 |
| --- | --- |
| `apps/meteor/app/lib/client/methods/sendMessage.ts` | `error-row` |
| `apps/meteor/app/livechat/client/lib/stream/queueManager.ts` | `error-row` |
| `apps/meteor/app/slashcommands-status/client/status.ts` | `error-row` |
| `apps/meteor/app/slashcommands-topic/client/topic.ts` | `error-row` |
| `apps/meteor/app/ui-message/client/ActionManager.ts` | `error-row` |
| `apps/meteor/client/apps/orchestrator.ts` | `error-row` |
| `apps/meteor/client/components/TwoFactorModal/TwoFactorEmailModal.tsx` | `error-row` |
| `apps/meteor/client/components/avatar/RoomAvatarEditor.tsx` | `error-row` |
| `apps/meteor/client/components/avatar/UserAvatarEditor/UserAvatarEditor.tsx` | `error-row` |
| `apps/meteor/client/components/dashboards/DownloadDataButton.tsx` | `error-row` |
| `apps/meteor/client/components/message/content/ThreadMetricsFollow.tsx` | `error-row` |
| `apps/meteor/client/components/message/content/attachments/default/ActionAttachmentButton.tsx` | `error-row` |
| `apps/meteor/client/components/message/content/attachments/file/GenericFileAttachment.tsx` | `error-row` |
| `apps/meteor/client/components/message/hooks/useMarkAsUnreadMutation.ts` | `error-row` |
| `apps/meteor/client/components/message/hooks/usePinMessageMutation.ts` | `error-row` |
| `apps/meteor/client/components/message/hooks/useStarMessageMutation.ts` | `error-row` |
| `apps/meteor/client/components/message/hooks/useUnpinMessageMutation.ts` | `error-row` |
| `apps/meteor/client/components/message/hooks/useUnstarMessageMutation.ts` | `error-row` |
| `apps/meteor/client/components/message/toolbar/useCopyAction.ts` | `success-info-warning-only` |
| `apps/meteor/client/components/message/toolbar/useFollowMessageAction.ts` | `success-info-warning-only` |
| `apps/meteor/client/components/message/toolbar/useMessageActionAppsActionButtons.ts` | `error-row` |
| `apps/meteor/client/components/message/toolbar/usePermalinkAction.ts` | `error-row` |
| `apps/meteor/client/components/message/toolbar/useUnFollowMessageAction.ts` | `success-info-warning-only` |
| `apps/meteor/client/hooks/menuActions/useLeaveRoom.tsx` | `error-row` |
| `apps/meteor/client/hooks/menuActions/useToggleFavoriteAction.ts` | `error-row` |
| `apps/meteor/client/hooks/menuActions/useToggleNotificationsAction.ts` | `error-row` |
| `apps/meteor/client/hooks/menuActions/useToggleReadAction.ts` | `error-row` |
| `apps/meteor/client/hooks/roomActions/useAppsRoomStarActions.tsx` | `error-row` |
| `apps/meteor/client/hooks/roomActions/useE2EERoomAction.ts` | `success-info-warning-only` |
| `apps/meteor/client/hooks/useClipboardWithToast.ts` | `error-row` |
| `apps/meteor/client/hooks/useDeviceLogout.tsx` | `error-row` |
| `apps/meteor/client/hooks/useEndpointMutation.ts` | `error-row` |
| `apps/meteor/client/hooks/useEndpointUploadMutation.ts` | `error-row` |
| `apps/meteor/client/hooks/useFormSubmitWithDirtyCheck.ts` | `success-info-warning-only` |
| `apps/meteor/client/hooks/useHideRoomAction.tsx` | `error-row` |
| `apps/meteor/client/hooks/useJoinRoom.ts` | `error-row` |
| `apps/meteor/client/hooks/useLdapSync.tsx` | `error-row` |
| `apps/meteor/client/hooks/useMessageboxAppsActionButtons.ts` | `error-row` |
| `apps/meteor/client/hooks/useUpdateAvatar.ts` | `success-info-warning-only` |
| `apps/meteor/client/hooks/useUserDropdownAppsActionButtons.ts` | `error-row` |
| `apps/meteor/client/lib/2fa/overrideLoginMethod.ts` | `error-row` |
| `apps/meteor/client/lib/2fa/process2faReturn.ts` | `error-row` |
| `apps/meteor/client/lib/chats/flows/processMessageEditing.ts` | `error-row` |
| `apps/meteor/client/lib/chats/flows/processMessageUploads.ts` | `error-row` |
| `apps/meteor/client/lib/chats/flows/processSetReaction.ts` | `error-row` |
| `apps/meteor/client/lib/chats/flows/processTooLongMessage.ts` | `error-row` |
| `apps/meteor/client/lib/chats/flows/requestMessageDeletion.ts` | `error-row` |
| `apps/meteor/client/lib/chats/flows/sendMessage.ts` | `error-row` |
| `apps/meteor/client/lib/chats/flows/uploadFiles.ts` | `error-row` |
| `apps/meteor/client/lib/e2ee/rocketchat.e2e.ts` | `success-info-warning-only` |
| `apps/meteor/client/lib/toast.ts` | `infra` |
| `apps/meteor/client/lib/utils/callWithErrorHandling.ts` | `error-row` |
| `apps/meteor/client/meteor/startup/accounts.ts` | `error-row` |
| `apps/meteor/client/navbar/NavBarOmnichannelGroup/hooks/useOmnichannelLivechatToggle.ts` | `error-row` |
| `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx` | `error-row` |
| `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateDirectMessage.tsx` | `error-row` |
| `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateTeamModal.tsx` | `error-row` |
| `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/EditStatusModal.tsx` | `error-row` |
| `apps/meteor/client/providers/ToastMessagesProvider.tsx` | `infra` |
| `apps/meteor/client/providers/UserProvider/hooks/useEmailVerificationWarning.ts` | `success-info-warning-only` |
| `apps/meteor/client/providers/VideoConfProvider.tsx` | `error-row` |
| `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomList.tsx` | `error-row` |
| `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationManageServerModal.tsx` | `error-row` |
| `apps/meteor/client/stories/contexts/QueryClientProviderMock.tsx` | `error-row` |
| `apps/meteor/client/views/OAuthTwoFactorAuthentication/OAuthTwoFactorAuthenticationRouter.tsx` | `error-row` |
| `apps/meteor/client/views/account/accessibility/AccessibilityPage.tsx` | `error-row` |
| `apps/meteor/client/views/account/featurePreview/AccountFeaturePreviewPage.tsx` | `error-row` |
| `apps/meteor/client/views/account/integrations/AccountIntegrationsPage.tsx` | `error-row` |
| `apps/meteor/client/views/account/omnichannel/OmnichannelPreferencesPage.tsx` | `error-row` |
| `apps/meteor/client/views/account/preferences/AccountPreferencesPage.tsx` | `error-row` |
| `apps/meteor/client/views/account/preferences/PreferencesMyDataSection.tsx` | `error-row` |
| `apps/meteor/client/views/account/profile/AccountProfileForm.tsx` | `error-row` |
| `apps/meteor/client/views/account/profile/AccountProfilePage.tsx` | `error-row` |
| `apps/meteor/client/views/account/security/ChangePassphrase.tsx` | `error-row` |
| `apps/meteor/client/views/account/security/ChangePassword.tsx` | `error-row` |
| `apps/meteor/client/views/account/security/TwoFactorEmail.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx` | `error-row` |
| `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx` | `error-row` |
| `apps/meteor/client/views/account/tokens/AccountTokensTable/AddToken.tsx` | `error-row` |
| `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesContextualBar.tsx` | `error-row` |
| `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/DeleteRoomModal.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomsContextualBar.tsx` | `error-row` |
| `apps/meteor/client/views/admin/ABAC/hooks/useAttributeOptions.tsx` | `error-row` |
| `apps/meteor/client/views/admin/customEmoji/AddCustomEmoji.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/admin/customEmoji/EditCustomEmoji.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/admin/customSounds/AddCustomSound.tsx` | `error-row` |
| `apps/meteor/client/views/admin/customSounds/EditSound.tsx` | `error-row` |
| `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusForm.tsx` | `error-row` |
| `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx` | `error-row` |
| `apps/meteor/client/views/admin/emailInbox/SendTestButton.tsx` | `error-row` |
| `apps/meteor/client/views/admin/featurePreview/AdminFeaturePreviewPage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/import/ImportProgressPage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/import/NewImportPage.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/admin/import/useErrorHandler.ts` | `error-row` |
| `apps/meteor/client/views/admin/integrations/hooks/useCreateIntegration.ts` | `error-row` |
| `apps/meteor/client/views/admin/integrations/hooks/useDeleteIntegration.ts` | `error-row` |
| `apps/meteor/client/views/admin/integrations/hooks/useUpdateIntegration.ts` | `error-row` |
| `apps/meteor/client/views/admin/integrations/outgoing/history/OutgoingWebhookHistoryPage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/invites/InvitesPage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/mailer/MailerPage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/moderation/ModerationConsolePage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/moderation/hooks/useDeactivateUserAction.tsx` | `error-row` |
| `apps/meteor/client/views/admin/moderation/hooks/useDeleteMessage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/moderation/hooks/useDeleteMessagesAction.tsx` | `error-row` |
| `apps/meteor/client/views/admin/moderation/hooks/useDismissMessageAction.tsx` | `error-row` |
| `apps/meteor/client/views/admin/moderation/hooks/useDismissUserAction.tsx` | `error-row` |
| `apps/meteor/client/views/admin/moderation/hooks/useResetAvatarAction.tsx` | `error-row` |
| `apps/meteor/client/views/admin/oauthApps/EditOauthApp.tsx` | `error-row` |
| `apps/meteor/client/views/admin/oauthApps/OAuthAddApp.tsx` | `error-row` |
| `apps/meteor/client/views/admin/permissions/EditRolePage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/permissions/UsersInRole/hooks/useRemoveUserFromRole.tsx` | `error-row` |
| `apps/meteor/client/views/admin/permissions/hooks/useChangeRole.ts` | `error-row` |
| `apps/meteor/client/views/admin/rooms/EditRoom.tsx` | `error-row` |
| `apps/meteor/client/views/admin/settings/Setting/inputs/ActionInputBase.tsx` | `error-row` |
| `apps/meteor/client/views/admin/settings/Setting/inputs/AssetSettingInput.tsx` | `error-row` |
| `apps/meteor/client/views/admin/settings/SettingsGroupPage/SettingsGroupPage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/settings/groups/LDAPGroupPage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/settings/groups/OAuthGroupPage/OAuthGroupPage.tsx` | `error-row` |
| `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx` | `error-row` |
| `apps/meteor/client/views/admin/subscription/hooks/useRemoveLicense.ts` | `error-row` |
| `apps/meteor/client/views/admin/subscription/hooks/useWorkspaceSync.ts` | `error-row` |
| `apps/meteor/client/views/admin/users/AdminUserForm.tsx` | `error-row` |
| `apps/meteor/client/views/admin/users/hooks/useChangeAdminStatusAction.ts` | `error-row` |
| `apps/meteor/client/views/admin/users/hooks/useChangeUserStatusAction.ts` | `success-info-warning-only` |
| `apps/meteor/client/views/admin/users/hooks/useConfirmOwnerChanges.tsx` | `error-row` |
| `apps/meteor/client/views/admin/users/hooks/useDeleteUserAction.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/admin/users/hooks/useResetE2EEKeyAction.tsx` | `error-row` |
| `apps/meteor/client/views/admin/users/hooks/useResetTOTPAction.tsx` | `error-row` |
| `apps/meteor/client/views/admin/users/hooks/useSendInvitationEmailMutation.ts` | `error-row` |
| `apps/meteor/client/views/admin/users/hooks/useSendWelcomeEmailMutation.ts` | `error-row` |
| `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceSetupModal/RegisterWorkspaceSetupStepOneModal.tsx` | `error-row` |
| `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceSetupModal/RegisterWorkspaceSetupStepTwoModal.tsx` | `error-row` |
| `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceTokenModal.tsx` | `error-row` |
| `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisteredWorkspaceModal.tsx` | `error-row` |
| `apps/meteor/client/views/banners/UiKitBanner.tsx` | `error-row` |
| `apps/meteor/client/views/banners/hooks/useDismissUserBannerMutation.ts` | `error-row` |
| `apps/meteor/client/views/composer/VideoMessageRecorder/VideoMessageRecorder.tsx` | `error-row` |
| `apps/meteor/client/views/e2e/EnterE2EPasswordModal/EnterE2EPasswordModal.tsx` | `error-row` |
| `apps/meteor/client/views/home/cards/CustomContentCard.tsx` | `error-row` |
| `apps/meteor/client/views/hooks/roomActions/useArchiveRoom.ts` | `error-row` |
| `apps/meteor/client/views/hooks/roomActions/useDeleteRoom.tsx` | `error-row` |
| `apps/meteor/client/views/hooks/useResetE2EPasswordMutation.ts` | `error-row` |
| `apps/meteor/client/views/invite/hooks/useInviteTokenMutation.ts` | `error-row` |
| `apps/meteor/client/views/invite/hooks/useValidateInviteQuery.ts` | `error-row` |
| `apps/meteor/client/views/mailer/MailerUnsubscriptionPage.tsx` | `error-row` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/marketplace/helpers/handleAPIError.ts` | `error-row` |
| `apps/meteor/client/views/marketplace/helpers/handleInstallError.ts` | `error-row` |
| `apps/meteor/client/views/marketplace/helpers/warnAppInstall.ts` | `error-row` |
| `apps/meteor/client/views/marketplace/helpers/warnEnableDisableApp.ts` | `error-row` |
| `apps/meteor/client/views/marketplace/helpers/warnStatusChange.ts` | `error-row` |
| `apps/meteor/client/views/marketplace/hooks/useAppInstallationHandler.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/marketplace/hooks/useAppMenu.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/omnichannel/agents/AgentEdit.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/agents/AgentsTable/AddAgent.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/omnichannel/agents/hooks/useRemoveAgent.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/analytics/InterchangeableChart.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/appearance/AppearancePage.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHours.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/businessHours/useRemoveBusinessHour.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEdit.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/cannedResponses/modals/CreateCannedResponse/CreateCannedResponseModal.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/cannedResponses/modals/useRemoveCannedResponse.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/components/Tags.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/OutboundMessageWizard.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/MessageForm/MessageForm.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/RecipientForm.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/RepliesForm.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/contactInfo/hooks/useCreateContact.ts` | `error-row` |
| `apps/meteor/client/views/omnichannel/contactInfo/hooks/useEditContact.ts` | `error-row` |
| `apps/meteor/client/views/omnichannel/contactInfo/hooks/useReviewContact.ts` | `error-row` |
| `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/useBlockChannel.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/customFields/EditCustomFields.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/customFields/useRemoveCustomField.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/departments/DepartmentAgentsTable/AddAgent.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/departments/DepartmentAgentsTable/RemoveAgentButton.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentItemMenu.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/RemoveDepartmentModal.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEdit.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableFilter.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/RemoveChatButton.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/directory/contacts/RemoveContactModal.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/hooks/useOmnichannelPrioritiesMenu.ts` | `error-row` |
| `apps/meteor/client/views/omnichannel/managers/AddManager.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/omnichannel/managers/RemoveManagerButton.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/modals/ForwardChatModal.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/priorities/PrioritiesPage.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/slaPolicies/RemoveSlaButton.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/slaPolicies/SlaEdit.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/tags/TagEdit.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/tags/useRemoveTag.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/triggers/EditTrigger.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/triggers/TriggersRow.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/units/useRemoveUnit.tsx` | `error-row` |
| `apps/meteor/client/views/omnichannel/webhooks/WebhooksPage.tsx` | `error-row` |
| `apps/meteor/client/views/outlookCalendar/OutlookSettingsList/OutlookSettingsList.tsx` | `error-row` |
| `apps/meteor/client/views/outlookCalendar/hooks/useOutlookAuthentication.ts` | `success-info-warning-only` |
| `apps/meteor/client/views/outlookCalendar/hooks/useOutlookCalendarList.ts` | `error-row` |
| `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx` | `error-row` |
| `apps/meteor/client/views/room/ShareLocation/ShareLocationModal.tsx` | `error-row` |
| `apps/meteor/client/views/room/body/hooks/useGoToHomeOnRemoved.ts` | `success-info-warning-only` |
| `apps/meteor/client/views/room/composer/ComposerAnonymous.tsx` | `error-row` |
| `apps/meteor/client/views/room/composer/ComposerJoinWithPassword.tsx` | `error-row` |
| `apps/meteor/client/views/room/composer/ComposerMessage.tsx` | `error-row` |
| `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannelInquiry.tsx` | `error-row` |
| `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannelJoin.tsx` | `error-row` |
| `apps/meteor/client/views/room/composer/ComposerOmnichannel/hooks/useResumeChatOnHoldMutation.ts` | `error-row` |
| `apps/meteor/client/views/room/composer/ComposerReadOnly.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/AutoTranslate/AutoTranslateWithData.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/room/contextualBar/ExportMessages/useDownloadExportMutation.ts` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/ExportMessages/useExportMessagesAsPDFMutation.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/ExportMessages/useRoomExportMutation.ts` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/Info/hooks/actions/useRoomConvertToTeam.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/Info/hooks/actions/useRoomLeave.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/Info/hooks/actions/useRoomMoveToTeam.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/NotificationPreferences/NotificationPreferencesWithData.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/room/contextualBar/PruneMessages/PruneMessagesWithData.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/RoomFiles/hooks/useDeleteFile.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddMatrixUsers/useAddMatrixUsers.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddUsers.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteUsersWithData.tsx` | `error-row` |
| `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx` | `error-row` |
| `apps/meteor/client/views/room/hooks/useBanUser.tsx` | `error-row` |
| `apps/meteor/client/views/room/hooks/useGoToRoom.ts` | `error-row` |
| `apps/meteor/client/views/room/hooks/useToggleFavoriteMutation.ts` | `error-row` |
| `apps/meteor/client/views/room/hooks/useUnbanUser.tsx` | `error-row` |
| `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useAddUserAction.ts` | `error-row` |
| `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useBlockUserAction.ts` | `error-row` |
| `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useChangeLeaderAction.ts` | `error-row` |
| `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useChangeModeratorAction.tsx` | `error-row` |
| `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useChangeOwnerAction.tsx` | `error-row` |
| `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useIgnoreUserAction.ts` | `error-row` |
| `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useMuteUserAction.tsx` | `error-row` |
| `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useRemoveUserAction.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/room/hooks/useUserInfoActions/actions/useReportUser.tsx` | `error-row` |
| `apps/meteor/client/views/room/modals/DeleteMessageConfirmModal/DeleteMessageConfirmModal.tsx` | `error-row` |
| `apps/meteor/client/views/room/modals/E2EEModals/ResetKeysE2EEModal.tsx` | `error-row` |
| `apps/meteor/client/views/room/modals/ForwardMessageModal/ForwardMessageModal.tsx` | `error-row` |
| `apps/meteor/client/views/room/modals/ReadReceiptsModal/ReadReceiptsModal.tsx` | `error-row` |
| `apps/meteor/client/views/room/modals/ReportMessageModal/ReportMessageModal.tsx` | `error-row` |
| `apps/meteor/client/views/room/providers/hooks/useAppsRoomActions.ts` | `error-row` |
| `apps/meteor/client/views/room/webdav/AddWebdavAccountModal.tsx` | `error-row` |
| `apps/meteor/client/views/room/webdav/SaveToWebdavModal.tsx` | `error-row` |
| `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx` | `error-row` |
| `apps/meteor/client/views/root/MainLayout/RegisterUsername.tsx` | `error-row` |
| `apps/meteor/client/views/root/SAMLLoginRoute.tsx` | `error-row` |
| `apps/meteor/client/views/root/hooks/loggedIn/useFingerprintChange.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/root/hooks/loggedIn/useRootUrlChange.tsx` | `error-row` |
| `apps/meteor/client/views/root/hooks/useAutoupdate.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/root/hooks/useEscapeKeyStroke.ts` | `error-row` |
| `apps/meteor/client/views/teams/contextualBar/channels/AddExistingModal/AddExistingModal.tsx` | `error-row` |
| `apps/meteor/client/views/teams/contextualBar/channels/hooks/useRemoveRoomFromTeam.tsx` | `error-row` |
| `apps/meteor/client/views/teams/contextualBar/channels/hooks/useToggleAutoJoin.ts` | `error-row` |
| `apps/meteor/client/views/teams/contextualBar/info/useConvertToChannel.tsx` | `success-info-warning-only` |
| `apps/meteor/client/views/teams/contextualBar/info/useLeaveTeam.tsx` | `success-info-warning-only` |
| `packages/gazzodown/src/code/CodeBlock.tsx` | `error-row` |
| `packages/ui-client/src/views/setupWizard/providers/SetupWizardProvider.tsx` | `error-row` |
| `packages/ui-client/src/views/setupWizard/steps/CloudAccountConfirmation.tsx` | `error-row` |
| `packages/ui-client/src/views/setupWizard/steps/RegisterServerStep.tsx` | `error-row` |
| `packages/ui-contexts/src/hooks/useToastMessageDispatch.ts` | `infra` |
| `packages/ui-contexts/src/index.ts` | `infra` |
| `packages/ui-voip/src/providers/MediaCallViewProvider.tsx` | `success-info-warning-only` |
| `packages/ui-voip/src/providers/useMediaSessionInstance.ts` | `error-row` |
| `packages/ui-voip/src/views/useFullscreenToggle.ts` | `error-row` |
| `packages/ui-voip/src/views/usePopoutWindow.ts` | `error-row` |
| `packages/web-ui-registration/src/RegisterForm.tsx` | `error-row` |

### 6.2 isError 文件

| 文件 | 分类 |
| --- | --- |
| `apps/meteor/client/components/CreateDiscussion/DefaultParentRoomField.tsx` | `inline-row` |
| `apps/meteor/client/components/PlanTag.tsx` | `hide-only` |
| `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx` | `inline-row` |
| `apps/meteor/client/contexts/OmnichannelContext.ts` | `type-or-default` |
| `apps/meteor/client/hooks/useLicenseLimitsByBehavior.ts` | `hide-only` |
| `apps/meteor/client/providers/OmnichannelProvider.tsx` | `type-or-default` |
| `apps/meteor/client/sidebar/footer/SidebarFooterWatermark.tsx` | `hide-only` |
| `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationManageServerModal.tsx` | `inline-row` |
| `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/customEmoji/CustomEmoji.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/customSounds/CustomSoundsTable/CustomSoundsTable.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/customUserStatus/CustomUserActiveConnections.tsx` | `no-error-ui` |
| `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/deviceManagement/DeviceManagementInfo/DeviceManagementInfoWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/emailInbox/EmailInboxTable.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardCardErrorBoundary.tsx` | `type-guard` |
| `apps/meteor/client/views/admin/import/ImportProgressPage.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/integrations/EditIntegrationsPageWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/integrations/NewZapier.tsx` | `no-error-ui` |
| `apps/meteor/client/views/admin/invites/InvitesPage.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/moderation/MessageReportInfo.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/moderation/UserMessages.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/permissions/EditRolePageWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTable.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/rooms/RoomsTable.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/subscription/components/cards/ActiveSessionsCard.tsx` | `no-error-ui` |
| `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/users/AdminUserFormWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/users/AdminUsersPage.tsx` | `pass-through` |
| `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/viewLogs/AnalyticsReports.tsx` | `inline-row` |
| `apps/meteor/client/views/admin/workspace/WorkspaceRoute.tsx` | `inline-row` |
| `apps/meteor/client/views/audit/AuditPage.tsx` | `inline-row` |
| `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx` | `inline-row` |
| `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx` | `inline-row` |
| `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx` | `inline-row` |
| `apps/meteor/client/views/mailer/MailerUnsubscriptionPage.tsx` | `inline-row` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx` | `inline-row` |
| `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogs.tsx` | `inline-row` |
| `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx` | `inline-row` |
| `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx` | `hide-only` |
| `apps/meteor/client/views/marketplace/components/MarketplaceRequestBadge.tsx` | `hide-only` |
| `apps/meteor/client/views/marketplace/hooks/useApps.ts` | `no-error-ui` |
| `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/useParentTeamData.ts` | `no-error-ui` |
| `apps/meteor/client/views/oauth/OAuthAuthorizationPage.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/appearance/AppearancePageContainer.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursTable.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHoursWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithDepartmentData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/components/CustomField.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/OutboundMessageWizard.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/RecipientForm.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ChannelField.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ContactField.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/RepliesForm.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/components/DepartmentField.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfoWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfoWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/contactInfo/hooks/useValidCustomFields.ts` | `hide-only` |
| `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannels.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactManagerInfo.tsx` | `hide-only` |
| `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistory.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/customFields/EditCustomFieldsWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithAllowedForwardData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/departments/NewDepartment.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/DepartmentField.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEditWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx` | `hide-only` |
| `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/directory/components/ContactField.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/directory/components/PriorityField.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/directory/components/SlaField.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/priorities/PriorityEditFormWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/reports/components/ReportCard.tsx` | `type-or-default` |
| `apps/meteor/client/views/omnichannel/reports/components/ReportCardContent.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/reports/hooks/useAgentsSection.ts` | `no-error-ui` |
| `apps/meteor/client/views/omnichannel/reports/hooks/useChannelsSection.ts` | `no-error-ui` |
| `apps/meteor/client/views/omnichannel/reports/hooks/useDepartmentsSection.ts` | `no-error-ui` |
| `apps/meteor/client/views/omnichannel/reports/hooks/useStatusSection.ts` | `no-error-ui` |
| `apps/meteor/client/views/omnichannel/reports/hooks/useTagsSection.ts` | `no-error-ui` |
| `apps/meteor/client/views/omnichannel/slaPolicies/SlaEditWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/tags/TagEditWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/tags/TagEditWithDepartmentData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/triggers/EditTriggerWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/units/UnitEditWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/omnichannel/webhooks/WebhooksPageContainer.tsx` | `inline-row` |
| `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx` | `inline-row` |
| `apps/meteor/client/views/outlookCalendar/hooks/useOutlookAuthentication.ts` | `no-error-ui` |
| `apps/meteor/client/views/room/Header/ParentRoom/ParentDiscussion/ParentDiscussionWithData.tsx` | `hide-only` |
| `apps/meteor/client/views/room/Header/ParentRoom/ParentTeam.tsx` | `hide-only` |
| `apps/meteor/client/views/room/ImageGallery/ImageGalleryData.tsx` | `inline-row` |
| `apps/meteor/client/views/room/RoomOpener.tsx` | `inline-row` |
| `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx` | `inline-row` |
| `apps/meteor/client/views/room/body/RoomForeword/RoomForewordUsernameListItem.tsx` | `no-error-ui` |
| `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx` | `inline-row` |
| `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteUsersWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx` | `inline-row` |
| `apps/meteor/client/views/room/modals/ReadReceiptsModal/ReadReceiptsModal.tsx` | `inline-row` |
| `apps/meteor/client/views/root/MainLayout/EmbeddedPreload.tsx` | `hide-only` |
| `apps/meteor/client/views/root/hooks/loggedIn/useCustomEmoji.ts` | `no-error-ui` |
| `packages/fuselage-ui-kit/src/blocks/VideoConferenceBlock/VideoConferenceBlock.tsx` | `no-error-ui` |
| `packages/ui-client/src/views/setupWizard/steps/RegisterServerStep.tsx` | `inline-row` |

### 6.3 ToastMessages 文件

- `apps/meteor/client/providers/MeteorProvider.tsx` — infra
- `apps/meteor/client/providers/ToastMessagesProvider.tsx` — infra
- `packages/ui-contexts/src/ToastMessagesContext.ts` — infra
- `packages/ui-contexts/src/hooks/useToastMessageDispatch.ts` — infra
- `packages/ui-contexts/src/index.ts` — infra


## 闭合判据

Reviewer 在 **`e519470d35b6caf5b228d81aef41c86aab3051f4`** 上重跑。本分支 = 该冻结提交 + 本册 1 个 docs commit。

```bash
# 0. 钉死树（三方 diff 只有这一份 markdown）
git rev-parse HEAD
# 若在本 PR 分支：merge-base 仍是 e519470d35b6caf5b228d81aef41c86aab3051f4
git merge-base HEAD e519470d35b6caf5b228d81aef41c86aab3051f4

# 1. 本册存在
ls docs/qa/pm-feature-atlas/round-2/10-errors.md

# 2. 表行 = 唯一 id
rg -c '^\| `err\.' docs/qa/pm-feature-atlas/round-2/10-errors.md
rg -o '^\| `err\.[^`]+' docs/qa/pm-feature-atlas/round-2/10-errors.md | sort | uniq | wc -l
# expect 390 and 390

# 3. 目标文件已扫（与表内出处文件对账）
python3 - <<'PY'

import os, re
from pathlib import Path
ROOT = Path('.')
TREES = [
    "apps/meteor/client","apps/meteor/ee/client","apps/meteor/app","apps/meteor/ee/app",
    "packages/ui-client","packages/ui-contexts","packages/ui-voip","packages/ui-video-conf",
    "packages/web-ui-registration","packages/fuselage-ui-kit","packages/gazzodown",
]
SKIP_PARTS = {"node_modules","tests","dist",".meteor"}
SKIP_NAME = (".spec.",".test.",".stories.")
EXT = {".ts",".tsx",".js",".jsx"}

def skip(p: Path) -> bool:
    if any(x in p.parts for x in SKIP_PARTS): return True
    if any(s in p.name for s in SKIP_NAME): return True
    rel = str(p).replace('\\','/')
    if '/server/' in rel: return True
    if rel.startswith('apps/meteor/app/') or rel.startswith('apps/meteor/ee/app/'):
        if '/client/' not in rel and '/client.' not in rel: return True
    return False

files=[]
toast_api=set(); toastmsg=set()
for tree in TREES:
    base = ROOT/tree
    if not base.exists(): continue
    for dp, dns, fns in os.walk(base):
        dns[:] = [d for d in dns if d not in SKIP_PARTS]
        for fn in fns:
            p = Path(dp)/fn
            if p.suffix not in EXT or skip(p): continue
            files.append(p)
            txt = p.read_text(encoding='utf-8', errors='replace')
            if re.search(r'\b(dispatchToastMessage|useToastMessageDispatch|useToastBarDispatch)\b', txt):
                toast_api.add(str(p))
            if re.search(r'\bToastMessages(Context|Provider|InnerProvider)?\b', txt):
                toastmsg.add(str(p))
md = Path('docs/qa/pm-feature-atlas/round-2/10-errors.md').read_text()
ids = re.findall(r'^\| `(err\.[^`]+)`', md, re.M)
doc_files = set(re.findall(r'`((?:apps|packages)/[^`]+\.[a-z]+):\d+`', md))
print('WALK', len(files))
print('TOAST_API', len(toast_api))
print('TOASTMSG', len(toastmsg))
print('ROWS', len(ids))
print('UNIQ', len(set(ids)))
# toast-api files that contain a real dispatch call should appear in doc if they have error payloads;
# prove scan coverage: every toast_api file is either listed in §2 or appears as 出处 or is infra/success-only.
infra = {
    'apps/meteor/client/lib/toast.ts',
    'apps/meteor/client/providers/ToastMessagesProvider.tsx',
    'apps/meteor/client/providers/MeteorProvider.tsx',
    'packages/ui-contexts/src/ToastMessagesContext.ts',
    'packages/ui-contexts/src/hooks/useToastMessageDispatch.ts',
    'packages/ui-contexts/src/index.ts',
}
print('DOC_FILES', len(doc_files))
print('TOAST_API_IN_DOC', len(toast_api & doc_files))
print('TOAST_API_NOT_IN_DOC', len(toast_api - doc_files - infra))
# §6 classification must cover every scanned toast_api / isError file
sec6 = re.search(r'### 6\.1 toast API 文件\n\n(.*?)\n### 6\.2', md, re.S)
sec7 = re.search(r'### 6\.2 isError 文件\n\n(.*?)\n### 6\.3', md, re.S)
def parse_class(block):
    return {m.group(1): m.group(2) for m in re.finditer(r'\| `([^`]+)` \| `([^`]+)` \|', block or '')}
c6 = parse_class(sec6.group(1) if sec6 else '')
c7 = parse_class(sec7.group(1) if sec7 else '')
print('CLASS6', len(c6), 'SYMDIFF_TOAST_API', sorted(toast_api.symmetric_difference(c6)))
iserror=set()
for p in files:
    txt=p.read_text(encoding='utf-8', errors='replace')
    if re.search(r'\bisError\b', txt):
        iserror.add(str(p))
print('ISERROR', len(iserror), 'CLASS7', len(c7), 'SYMDIFF_ISERROR', sorted(iserror.symmetric_difference(c7)))
print('TOASTMSG_LIST', sorted(toastmsg))
PY
```

期望：`WALK 3339` / `TOAST_API 275` / `TOASTMSG 5` / `ROWS 390` / `UNIQ 390` / `CLASS6 275` / `SYMDIFF_TOAST_API []` / `ISERROR 114` / `CLASS7 114` / `SYMDIFF_ISERROR []`。

```bash
rg -c '\[实测\]' docs/qa/pm-feature-atlas/round-2/10-errors.md
# 表体 11 行 + 正文提及；表体用：
rg -c '^\| `err\.[^`]+` .*\[实测\]' docs/qa/pm-feature-atlas/round-2/10-errors.md
# expect 11
```

闭集等式：**298 + 14 + 78 = 390**。
Live 等式：**11 `[实测]` + 379 `[读]` = 390**。Volume 10 未 live-closed。
toast API 分类等式见 §6。
