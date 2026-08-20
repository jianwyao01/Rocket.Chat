# 分册 09 — Marketplace 产品交互

本文件把市场当成**产品**写，不是侧栏登记。04 只留 `route.marketplace`；02 只留顶栏 `nav.marketplace.explore` `nav.marketplace.installed` `nav.marketplace.requested`。本册展开列表、每应用动作、以及 `manage-apps` vs `access-marketplace` 的分叉。不改产品代码。未挂真实 UI；源码推断标 `[读]`，界面可见性标 `[待渲染实测]`。

**id 命名空间：** `mkt.explore.*` `mkt.installed.*` `mkt.app.*` `mkt.request.*`。Premium / Private / Documentation 挂在前两族下（用户指定的四前缀，不另开命名空间）。

**列约定（八列）：**

| 列 | 含义 |
|---|---|
| 稳定语义 id | 本册唯一 |
| 功能一句话 | 用户能完成的一件事 |
| 完整入口点击序列 | 从可见控件到动作 |
| 门控 | 权限 / 许可证，带 `file:line` |
| 触发后果三件套 | (1) DOM role+name (2) endpoint (3) 刷新后仍在什么 |
| 供给 | **READ** 的权限/路由参数/接口/上下文；许可证只在门控 |
| 关联 | 已知 atlas id |
| 出处 | `path:line` + `[读]` |

禁止空行。第三方 App 的每一个设置键 **不** 拆行（只留「打开并保存该 App 的 settings 表单」）。Workspace Settings 972 字段不在本册。

**没有 Updates 侧栏项。** 更新出现在：行蓝点、菜单 `Update`、详情主按钮。`UpdateRocketChatButton` 是升级 **Rocket.Chat 本体**（市集版本不受支持时），不是 App Updates 页。

---

## 0. 侧栏 / 路由枚举（先于表体）

```bash
rg -c "i18nLabel:" apps/meteor/client/views/marketplace/sidebarItems.tsx
# 8   （6 个可点项含 Documentation + 2 divider）

rg -c "registerMarketplaceRoute\(" apps/meteor/client/views/marketplace/routes.tsx
# 1

find apps/meteor/client/views/marketplace -type f | wc -l
# 195
```

可点侧栏 6（`sidebarItems.tsx`）：

| # | href | i18nLabel | 权限 |
|---|---|---|---|
| 1 | `/marketplace/explore` | `Explore` | `access-marketplace` OR `manage-apps` `:16` |
| 2 | `/marketplace/premium` | `Premium` | 同上 `:22` |
| 3 | `/marketplace/installed` | `Installed` | 同上 `:28` |
| 4 | `/marketplace/requested` | `Requested`（+ badge） | **仅 `manage-apps`** `:35` |
| 5 | `/marketplace/private` | `Private_Apps` | `access-marketplace` OR `manage-apps` `:41` |
| 6 | `links.go.appsDocumentation` | `Documentation` | 同上；`externalUrl: true` `:44-50` |

两条 divider 的 `permissionGranted` 只看 `access-marketplace`（`:43` `:51`）——**仅有 `manage-apps`、没有 `access-marketplace` 的管理员看不到分隔线**（cosmetic）。

壳：`MarketplaceRouter.tsx:15,30-32` 两权皆无 → `NotFoundPage`。`context=all` replace 到 `explore/list` `:22-23`。`AppsRoute.tsx:43-51`：explore/premium/installed/private 要 `access-marketplace` **或** `manage-apps`；**requested 与 `page=install` 只要 `manage-apps`**，否则 `NotAuthorizedPage`。

`isAdminUser = usePermission('manage-apps')`（`AppsRoute.tsx:20`）。市集目录 `GET /apps/marketplace?isAdminUser=`（`useApps.ts:134-136` `orchestrator.ts:59-62`）。

---

## 1. 列表与侧栏 `mkt.explore.*` `mkt.installed.*` `mkt.request.*`

入口前缀：`顶栏左→Marketplace`（桌面非 mobile，`NavBarPagesGroup.tsx:16-29`）或已在市场侧栏。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
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

列表块 **11** 行。六个可点侧栏项均有行（Explore/Premium/Installed/Requested/Private/Documentation）。

---

## 2. 每应用 `mkt.app.*`

主按钮文案由 `appButtonProps` 决定：非管理员只有 `Request`/`Requested`；管理员为 `Install` / `Update` / `Subscribe` / `See_Pricing` / `Try_now` / `Buy`（`helpers.ts:13-17,56-163`）。菜单装配 `useAppMenu.tsx:336-447`。

| 稳定语义 id | 功能一句话 | 完整入口点击序列 | 门控 | 触发后果三件套 | 供给 | 关联 | 出处 |
|---|---|---|---|---|---|---|---|
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

每应用 **18** 行。主按钮 `See_Pricing`/`Try_now` 并入 `mkt.app.subscribe`（同一 purchase 枝，只是 label）。

---

## 3. `manage-apps` vs `access-marketplace`（分叉台账）

不是功能行，是门控对照。表体行已把分叉写进「门控」列。

| 表面 | 仅 `access-marketplace` | `manage-apps` | 出处 |
|---|---|---|---|
| 进壳 | 可以 | 可以 | `MarketplaceRouter.tsx:15,30-32`（皆无 → 404） |
| Explore/Premium/Installed/Private | 可以 | 可以 | `AppsRoute.tsx:43-48` |
| Requested 侧栏+页+`/install` | **否** → 隐 / `NotAuthorizedPage` | 可以 | `sidebarItems.tsx:35` `AppsRoute.tsx:51` |
| 分隔线 | 可见 | **不可见**（divider 只看 access-marketplace） | `sidebarItems.tsx:43,51` |
| 行菜单已装动作 | 空（已装 ⋮ 对非管理员不给突变） | Install/Update/Enable/Disable/Uninstall/Logs/Subscription | `useAppMenu.tsx:336-447` `AppMenu.tsx:34-44` |
| 未装主按钮 | `Request`/`Requested` | `Install`/`Buy`/`Subscribe`/… | `helpers.ts:56-163` |
| Details tabs | Details +（可见时）Security + Releases | + Requests + Settings + Logs + Instances | `AppDetailsPageTabs.tsx:41-73` |
| Save settings | **无 footer** | 有 | `AppDetailsPage.tsx:154-157` |
| 头：Upload / Unlimited / Upgrade / Update RC | 隐 | 可见 | `MarketplaceHeader.tsx:60-76` |
| 市集 API `isAdminUser` | false | true | `useApps.ts:134-136` |
| Request badge query | disabled | enabled | `useAppRequestStats.ts:15` |

---

## [待渲染实测]

1. 两权皆无是否 **404**（壳）而非空列表（05 已点名）。
2. 仅 `access-marketplace` 进 `/marketplace/requested` 是否 `NotAuthorizedPage`。
3. 仅 `manage-apps`、无 `access-marketplace` 时 divider 是否消失、Explore 是否仍可进。
4. 已装非管理员行 ⋮ 是否真的没有 Enable/Disable。
5. 更新蓝点与 `semver.lt(version, marketplaceVersion)` 是否一致。
6. 私有上传无许可证是 Upgrade 按钮还是限制模态。
7. Settings tab 在 App 无 settings 时是否整 tab 不渲染。
8. 订阅卸载提示是否先改订阅再 `DELETE`。

---

## 计数证据

```bash
rg -c "i18nLabel:" apps/meteor/client/views/marketplace/sidebarItems.tsx   # 8
rg -c "registerMarketplaceRoute\(" apps/meteor/client/views/marketplace/routes.tsx  # 1
find apps/meteor/client/views/marketplace -type f | wc -l                  # 195

# 功能行（排除验算表 `mkt.explore.*` 这种星号行）
rg -c '^\| `mkt\.explore\.[a-z]' docs/qa/pm-feature-atlas/09-marketplace-product.md   # 5
rg -c '^\| `mkt\.installed\.[a-z]' docs/qa/pm-feature-atlas/09-marketplace-product.md # 5
rg -c '^\| `mkt\.request\.[a-z]' docs/qa/pm-feature-atlas/09-marketplace-product.md   # 1
rg -c '^\| `mkt\.app\.[a-z]' docs/qa/pm-feature-atlas/09-marketplace-product.md       # 18
# 5+5+1+18=29
```

---

## 验算

| 块 | 行数 | 算法 |
|---|---|---|
| `mkt.explore.*` | 5 | open + search + filter + premium + docs |
| `mkt.installed.*` | 5 | open + private + upload + unlimited + update-server |
| `mkt.request.*` | 1 | open（请求审阅在 `mkt.app.requests`） |
| `mkt.app.*` | 18 | details + install + subscribe + buy + request + enable + disable + uninstall + update + permissions + logs + logs.filter + settings + settings.save + requests + security + releases + instances |
| **本册表体** | **29** | 5+5+1+18 |

侧栏 6/6 可点项均有行。必选项：Explore / Installed / Requested / install / enable / disable / uninstall / settings（打开+保存）均有。无 hollow Updates 页（源码无此 href）。

---

## id 列表

**mkt.explore.***：`mkt.explore.open` `mkt.explore.search` `mkt.explore.filter` `mkt.explore.premium` `mkt.explore.docs`

**mkt.installed.***：`mkt.installed.open` `mkt.installed.private` `mkt.installed.upload` `mkt.installed.unlimited` `mkt.installed.update-server`

**mkt.request.***：`mkt.request.open`

**mkt.app.***：`mkt.app.details` `mkt.app.install` `mkt.app.subscribe` `mkt.app.buy` `mkt.app.request` `mkt.app.enable` `mkt.app.disable` `mkt.app.uninstall` `mkt.app.update` `mkt.app.permissions` `mkt.app.logs` `mkt.app.logs.filter` `mkt.app.settings` `mkt.app.settings.save` `mkt.app.requests` `mkt.app.security` `mkt.app.releases` `mkt.app.instances`

---

## 边界

- 不枚举每个第三方 App 的设置 key（`mkt.app.settings` 一行覆盖「打开这张表单」）。
- 不写 972 条 Workspace Settings。
- 不把 `Most_recent_updated` 排序伪造成 Updates 侧栏。
- `msg.apps.action` / `nav.user.apps-inject` 是 Apps-Engine 注入，不是市集安装面。
- Documentation 是外链，不是 App 详情。

---

## atlas diff（相对先前「仅入口」）

| 先前 id | 本册 |
|---|---|
| `route.marketplace`（04，只开壳） | **保留**；NEW 29 条列表+每应用动作 |
| `nav.marketplace.explore\|installed\|requested`（02） | **保留顶栏入口**；NEW 页内搜筛、Private/Premium/Docs、install/enable/disable/uninstall/settings |
| 05 OOS：Explore/Premium/Installed/Requested/Private/详情 tabs/安装权限更新模态 | **本册吃掉**（195 files 量级仍在，但用户可感知控件已建行） |

全部 `mkt.*` 相对现行 atlas 为 **NEW**。与 `omni.*` `route.*` `nav.marketplace.*` 前缀不交；`nav.marketplace.*` 只做入口关联。
