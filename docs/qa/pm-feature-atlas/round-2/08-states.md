# Round 2 / Vol.8 — UI 状态闭集

冻结树：**仅** `e519470d35b6caf5b228d81aef41c86aab3051f4`（短 SHA `e519470`）。**不是** `develop`。`file:line` 均相对此 SHA。

本卷是 **条件渲染分支** 库存，不是功能清单。不要把 kind 数加总成「功能总数」。

## 1. 方法

规则：**每个条件渲染分支 = 一个 state**。id = `state.<surface>.<file-stem>.<line><kind>`。

目标树（本卷闭集）：

- `apps/meteor/client/**`
- `apps/meteor/ee/client/**`（本冻结目录不存在）
- `apps/meteor/app/**/client/**`
- `apps/meteor/ee/app/**/client/**`（本冻结目录不存在）
- `packages/ui-*`：`ui-avatar`、`ui-client`、`ui-composer`、`ui-contexts`、`ui-kit`、`ui-video-conf`、`ui-voip`

目标文件：以上树内 `.ts` / `.tsx` / `.js` / `.jsx`，排除 `node_modules`、`dist`、`.turbo`、`coverage`。

文件分类（每个目标文件恰好一类）：

| 类 | 含义 |
| --- | --- |
| `jsx-branch` | 抽出 ≥1 个条件渲染分支 |
| `jsx-linear` | `.tsx` / `.jsx` 无抽出分支（直线渲染） |
| `no-jsx` | 无 JSX 条件渲染。**所有 `.ts` / `.js` 候选文件都落在此类**（抽 0 行；hook/lib 的 `return null` 不是渲染分支） |
| `excluded-spec` | `*.spec.*` / `*.test.*` / `tests/` |
| `excluded-stories` | `*.stories.*` / `stories/` |

分支抽取（确定性，见同目录 `export-08-states.py`）：

| kind | 规则 |
| --- | --- |
| and-show / and-hide | **A'**：仅 `.tsx` / `.jsx`。`&&` 后（跳过空白/注释）必须是 `<`，或 `(` 且下一非空白是 `<` / `{<`。**不把裸大写 ident 当 JSX**。`Boolean(` / `Array(` / `String(` / `Number(` / `Object(` 永不作 and-show。`cond && Array(n).map(() => <Tag/>)` 的 render 写 map 内 JSX 子节点（如 `Skeleton`），cond 仍是 `&&` 左侧。`mutationFn` / `useMutation` 内 0 行。配对 shown+hidden。 |
| tern-then / tern-else | **A'**：两边都必须是 JSX 或 `null`。`cond ? <` 或 `cond ? (` 打开 JSX。数据常量（如 `ROOM_INTIAL_VALUE`）不是分支。跳过 `?.` / `??`。配对 then+else。 |
| if-ret | **仅 `.tsx` / `.jsx`（C''）**。`if (...)` 后紧跟或块首条 `return null` / `return <` / `return (` 且该 `(` 打开 JSX。**同一函数**还必须另有至少一处打开 JSX 的 return；若该函数所有非 null return 都是对象 / config / callback / 原始值（含 `return {` 图标或菜单配置），抽 0 行。嵌套函数还要求最外层函数也是 JSX-render（hook 里的 template / `.map` 不算）。永不收 `return () =>`、`return {`、`return false`、`return value` 作为 if-ret 本身。`.ts` 抽 0 行。 |
| default | **仅 `.tsx` / `.jsx`（C''）**，且**同一函数**已有 if-ret。该函数最后一个非 if-ret 的 UI return 是 `return null` / `return <` / `return (`（JSX）。永不收 `return () =>` 或裸 `return;`。 |
| suspense | JSX `<Suspense fallback=`。 |

8 列：id / 表面 / 分支条件 / 渲染 / 到达配方或不可达 / 诚实 / 关联 / 出处。

渲染列写 **子节点名**（组件/标签/`null`），不写 `&&` / `return (` 操作符。条件列只写布尔表达式，不含 `return` / `const x =`，并剥掉 JSX 残留的前导 `>` / `{`。`.ts` 文件抽 **0** 行。

诚实：Meteor `dsv` 200 后，只把已截图且对照源码确认的渲染分支标 `[实测]`。未点击可达行一律 `[待渲染实测]`。仅字面量恒假才标 `[不可达]`。不扫 develop。不发明 DOM。本卷 **不是** live-closed。

## 2. 目标树证明（本冻结）

下面命令在冻结树上复跑。命令本身放在围栏里，不掺进 §1 正文。

```bash
git rev-parse HEAD
# expect e519470d35b6caf5b228d81aef41c86aab3051f4

test ! -d apps/meteor/ee/client && echo MISSING_EE_CLIENT
test ! -d apps/meteor/ee/app && echo MISSING_EE_APP
# expect both MISSING_*

ls -1 packages | grep '^ui-'
# expect: ui-avatar ui-client ui-composer ui-contexts ui-kit ui-video-conf ui-voip
```

EE 客户端 UI 在本冻结已并入 `apps/meteor/client`（omnichannel / ABAC / audit 等），没有独立 `ee/client` 树。`ee/apps/*` 是无 `client/` 的微服务，不在本卷命名 sweep 内。

## 3. 文件闭合

| 类 | 数 |
| --- | ---: |
| jsx-branch | 849 |
| jsx-linear | 955 |
| no-jsx | 1490 |
| excluded-spec | 341 |
| excluded-stories | 182 |
| excluded-server | 0 |
| **TARGET_FILES** | **3817** |

等式：`849+955+1490+341+182+0 = 3817`。

每个目标文件由 `python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --files` 打出 `class<TAB>relpath`。`CLASS_SUM` 必须等于 `TARGET_FILES`。无第三类、无漏文件。

## 4. 状态闭合（不是功能总数）

下表是 **分支 kind 计数**，不要加总成功能数。

| 分支 kind | 数 |
| --- | ---: |
| and-show | 1518 |
| and-hide | 1518 |
| tern-then | 146 |
| tern-else | 146 |
| if-ret | 524 |
| default | 346 |
| suspense | 23 |
| **STATES** | **4221** |

kind 等式（只核行数）：`1518+1518+146+146+524+346+23 = 4221`。

| 诚实 | 数 |
| --- | ---: |
| [待渲染实测] | 4114 |
| [不可达] | 0 |
| [实测] | 107 |

`[待渲染实测]+[不可达]+[实测] = 4221`。本卷只晋级已截图分支，**不是** live-closed。

表面分表行数之和必须等于 STATES：`129 + 1067 + 12 + 80 + 2 + 17 + 184 + 35 + 4 + 82 + 4 + 13 + 4 + 5 + 4 + 6 + 222 + 252 + 75 + 102 + 8 + 794 + 17 + 24 + 4 + 4 + 689 + 39 + 34 + 63 + 64 + 71 + 8 + 103 = 4221`。

## 5. Live boot（部分实测，未闭合）

旧 STOP（livechat `dist` ENOENT）已作废。本环境跳过 docker compose，按已验证路径起服。**无假 DOM。**

| 步 | 结果 |
| --- | --- |
| Meteor 3.4.1 | 已安装（与 `apps/meteor/.meteor/release` 一致） |
| Mongo 8.0.12 tarball 单节点 rs0 | `127.0.0.1:27017` PRIMARY |
| Node 22.22.3 + yarn + deno 2.3.1 | 已就绪 |
| i18n / livechat dist | 已构建 |
| `apps/meteor && meteor npm run dsv` | `http://127.0.0.1:3000` 与 `/api/info` 200 |
| 登录 | `rocketchat.internal.admin.test` 成功 |
| 产品 merge-base | `e519470` |

Walk 并截图：login、account security / profile / preferences、home、`#general`（header / composer / message）、channel info、members、directory channels / users / teams。

未打开因而不晋级：message toolbox 内层按钮、Create channel/team/dm/discussion 弹层、E2EE accordion、Video/Voice call chrome、Game Center、Outlook、VoIP 组、Apps inject、federation External、SAML。

截图目录：`docs/qa/pm-feature-atlas/round-2/shots/`。标签回写：同目录 `live-08-states.json` 只改诚实列，不改抽取器、不改 4221 行集。未点击可达行仍 `[待渲染实测]`。不要用 `[不可达]` 清零。本卷 **不是** live-closed。

## 6. 闭集表（一行一分支）

数据行 **4221**。排序：surface / file / line / kind。

### root（39）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.root.app-layout.92s` | root | Suspense fallback（子树未 ready） | PageLoading | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/AppLayout.tsx:92` |
| `state.root.app-root.38s` | root | Suspense fallback（子树未 ready） | PageLoading | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/AppRoot.tsx:38` |
| `state.root.authentication-check.25i` | root | user | LoggedInArea | 打开 `/` 或 `/home` 主壳；shot:home.png；登录后主壳 LoggedInArea | [实测] | （无） | `apps/meteor/client/views/root/MainLayout/AuthenticationCheck.tsx:25` |
| `state.root.authentication-check.33i` | root | !forceLogin && guest | RegistrationRoute | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/AuthenticationCheck.tsx:33` |
| `state.root.authentication-check.37i` | root | !forceLogin && allowAnonymousRead | UsernameCheck | 打开 `/` 或 `/home` 主壳；匿名读 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/AuthenticationCheck.tsx:37` |
| `state.root.authentication-check.41d` | root | 前述 if-ret 均不成立（default return） | LoginPage | 打开 `/` 或 `/home` 主壳；shot:login.png；Meteor.logout 后 LoginPage | [实测] | （无） | `apps/meteor/client/views/root/MainLayout/AuthenticationCheck.tsx:41` |
| `state.root.embedded-preload.85i` | root | !ready ¦¦ (shouldFetch && isLoading) | PageLoading | 打开 `/` 或 `/home` 主壳；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/EmbeddedPreload.tsx:85` |
| `state.root.embedded-preload.89d` | root | 前述 if-ret 均不成立（default return） | <> | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/EmbeddedPreload.tsx:89` |
| `state.root.layout-with-sidebar.59a1` | root | !(!embeddedLayout) | null | 打开 `/` 或 `/home` 主壳；embedded layout | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/LayoutWithSidebar.tsx:59` |
| `state.root.layout-with-sidebar.59a0` | root | !embeddedLayout | NavBar | 打开 `/` 或 `/home` 主壳；embedded layout；shot:home.png；非 embedded → NavBar | [实测] | （无） | `apps/meteor/client/views/root/MainLayout/LayoutWithSidebar.tsx:59` |
| `state.root.layout-with-sidebar.66a1` | root | !(!removeSidenav) | null | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/LayoutWithSidebar.tsx:66` |
| `state.root.layout-with-sidebar.66a0` | root | !removeSidenav | FeaturePreview | 打开 `/` 或 `/home` 主壳；shot:home.png；非 embedded → FeaturePreview/Sidebar | [实测] | （无） | `apps/meteor/client/views/root/MainLayout/LayoutWithSidebar.tsx:66` |
| `state.root.login-page.26i` | root | iframeLoginUrl | iframe | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/LoginPage.tsx:26` |
| `state.root.login-page.30d` | root | 前述 if-ret 均不成立（default return） | <> | 打开 `/` 或 `/home` 主壳；shot:login.png；非 iframe 登录壳 → RegistrationRoute | [实测] | （无） | `apps/meteor/client/views/root/MainLayout/LoginPage.tsx:30` |
| `state.root.login-page.32a1` | root | !(showForcedLogoutBanner) | null | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/LoginPage.tsx:32` |
| `state.root.login-page.32a0` | root | showForcedLogoutBanner | LoggedOutBanner | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/LoginPage.tsx:32` |
| `state.root.main-layout.19i` | root | isEmbeddedLayout | EmbeddedPreload | 打开 `/` 或 `/home` 主壳；embedded layout | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/MainLayout.tsx:19` |
| `state.root.main-layout.23s` | root | Suspense fallback（子树未 ready） | null | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/MainLayout.tsx:23` |
| `state.root.main-layout.29d` | root | 前述 if-ret 均不成立（default return） | Preload | 打开 `/` 或 `/home` 主壳；shot:home.png；非 embedded → Preload | [实测] | （无） | `apps/meteor/client/views/root/MainLayout/MainLayout.tsx:29` |
| `state.root.main-layout.32s` | root | Suspense fallback（子树未 ready） | null | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/MainLayout.tsx:32` |
| `state.root.main-layout-style-tags.13a1` | root | !(theme === 'dark') | null | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/MainLayoutStyleTags.tsx:13` |
| `state.root.main-layout-style-tags.13a0` | root | theme === 'dark' | PaletteStyleTag | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/MainLayoutStyleTags.tsx:13` |
| `state.root.password-change-check.16i` | root | requirePasswordChange | ResetPasswordPage | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/PasswordChangeCheck.tsx:16` |
| `state.root.password-change-check.20d` | root | 前述 if-ret 均不成立（default return） | TwoFactorAuthSetupCheck | 打开 `/` 或 `/home` 主壳；shot:home.png；已登录且不要求改密 | [实测] | （无） | `apps/meteor/client/views/root/MainLayout/PasswordChangeCheck.tsx:20` |
| `state.root.preload.18i` | root | !ready | PageLoading | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/Preload.tsx:18` |
| `state.root.preload.22d` | root | 前述 if-ret 均不成立（default return） | <> | 打开 `/` 或 `/home` 主壳；shot:home.png；subscriptions ready | [实测] | （无） | `apps/meteor/client/views/root/MainLayout/Preload.tsx:22` |
| `state.root.register-username.97t1` | root | !(!hideLogo && customLogo) | <> | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/RegisterUsername.tsx:97` |
| `state.root.register-username.97t0` | root | !hideLogo && customLogo | Box | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/RegisterUsername.tsx:97` |
| `state.root.register-username.105a1` | root | !(!isLoading) | null | 打开 `/` 或 `/home` 主壳；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/RegisterUsername.tsx:105` |
| `state.root.register-username.105a0` | root | !isLoading | FieldGroup | 打开 `/` 或 `/home` 主壳；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/RegisterUsername.tsx:105` |
| `state.root.register-username.115a1` | root | !(errors.username) | null | 打开 `/` 或 `/home` 主壳；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/RegisterUsername.tsx:115` |
| `state.root.register-username.115a0` | root | errors.username | FieldError | 打开 `/` 或 `/home` 主壳；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/RegisterUsername.tsx:115` |
| `state.root.two-factor-auth-setup-check.18i` | root | require2faSetup | Box | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/TwoFactorAuthSetupCheck.tsx:18` |
| `state.root.two-factor-auth-setup-check.28d` | root | 前述 if-ret 均不成立（default return） | LayoutWithSidebar | 打开 `/` 或 `/home` 主壳；shot:home.png；不强制 2FA 安装 → LayoutWithSidebar | [实测] | （无） | `apps/meteor/client/views/root/MainLayout/TwoFactorAuthSetupCheck.tsx:28` |
| `state.root.username-check.33i` | root | isLoading | HomeSkeleton | 打开 `/` 或 `/home` 主壳；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/UsernameCheck.tsx:33` |
| `state.root.username-check.37i` | root | shouldRegisterUsername | RegisterUsername | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/MainLayout/UsernameCheck.tsx:37` |
| `state.root.username-check.41d` | root | 前述 if-ret 均不成立（default return） | PasswordChangeCheck | 打开 `/` 或 `/home` 主壳；shot:home.png；已有 username → PasswordChangeCheck | [实测] | （无） | `apps/meteor/client/views/root/MainLayout/UsernameCheck.tsx:41` |
| `state.root.outermost-error-boundary.43i` | root | BugsnagErrorBoundary | BugsnagErrorBoundary | 打开 `/` 或 `/home` 主壳；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/root/OutermostErrorBoundary.tsx:43` |
| `state.root.outermost-error-boundary.47d` | root | 前述 if-ret 均不成立（default return） | ErrorBoundary | 打开 `/` 或 `/home` 主壳 | [待渲染实测] | （无） | `apps/meteor/client/views/root/OutermostErrorBoundary.tsx:47` |

### home（13）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.home.default-home-page.37a1` | home | !(canAddUsers) | null | 登录 → `/home` | [待渲染实测] | （无） | `apps/meteor/client/views/home/DefaultHomePage.tsx:37` |
| `state.home.default-home-page.37a0` | home | canAddUsers | AddUsersCard | 登录 → `/home`；shot:home.png；Add users 卡 | [实测] | （无） | `apps/meteor/client/views/home/DefaultHomePage.tsx:37` |
| `state.home.default-home-page.38a1` | home | !(canCreateChannel) | null | 登录 → `/home` | [待渲染实测] | （无） | `apps/meteor/client/views/home/DefaultHomePage.tsx:38` |
| `state.home.default-home-page.38a0` | home | canCreateChannel | CreateChannelsCard | 登录 → `/home`；shot:home.png；Create channels 卡 | [实测] | （无） | `apps/meteor/client/views/home/DefaultHomePage.tsx:38` |
| `state.home.default-home-page.43a1` | home | !((isAdmin ¦¦ (isCustomContentVisible && !isCustomContentBodyEmpty))) | null | 登录 → `/home` | [待渲染实测] | （无） | `apps/meteor/client/views/home/DefaultHomePage.tsx:43` |
| `state.home.default-home-page.43a0` | home | (isAdmin ¦¦ (isCustomContentVisible && !isCustomContentBodyEmpty)) | CustomContentCard | 登录 → `/home`；shot:home.png；Custom content 卡（admin） | [实测] | （无） | `apps/meteor/client/views/home/DefaultHomePage.tsx:43` |
| `state.home.home-page.9i` | home | customOnly | CustomHomePage | 登录 → `/home` | [待渲染实测] | （无） | `apps/meteor/client/views/home/HomePage.tsx:9` |
| `state.home.home-page.13d` | home | 前述 if-ret 均不成立（default return） | DefaultHomePage | 登录 → `/home`；shot:home.png；/home DefaultHomePage | [实测] | （无） | `apps/meteor/client/views/home/HomePage.tsx:13` |
| `state.home.home-page-header.15a1` | home | !(canEditLayout) | null | 登录 → `/home` | [待渲染实测] | （无） | `apps/meteor/client/views/home/HomePageHeader.tsx:15` |
| `state.home.home-page-header.15a0` | home | canEditLayout | Button | 登录 → `/home`；shot:home.png；Customize 按钮 | [实测] | （无） | `apps/meteor/client/views/home/HomePageHeader.tsx:15` |
| `state.home.custom-content-card.52i` | home | isAdmin | Card | 登录 → `/home`；shot:home.png；admin Custom content Card | [实测] | （无） | `apps/meteor/client/views/home/cards/CustomContentCard.tsx:52` |
| `state.home.custom-content-card.89i` | home | !willNotShowCustomContent && !isCustomContentOnly | Card | 登录 → `/home` | [待渲染实测] | （无） | `apps/meteor/client/views/home/cards/CustomContentCard.tsx:89` |
| `state.home.custom-content-card.98d` | home | 前述 if-ret 均不成立（default return） | CustomHomepageContent | 登录 → `/home` | [待渲染实测] | （无） | `apps/meteor/client/views/home/cards/CustomContentCard.tsx:98` |

### navbar（102）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.navbar.nav-bar.13a1` | navbar | !(!navbar.searchExpanded) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBar.tsx:13` |
| `state.navbar.nav-bar.13a0` | navbar | !navbar.searchExpanded | NavBarPagesSection | 登录后顶栏；shot:home.png；search 未展开 → NavBarPagesSection | [实测] | （无） | `apps/meteor/client/navbar/NavBar.tsx:13` |
| `state.navbar.nav-bar.15a1` | navbar | !(!navbar.searchExpanded) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBar.tsx:15` |
| `state.navbar.nav-bar.15a0` | navbar | !navbar.searchExpanded | NavBarControlsSection | 登录后顶栏；shot:home.png；search 未展开 → NavBarControlsSection | [实测] | （无） | `apps/meteor/client/navbar/NavBar.tsx:15` |
| `state.navbar.nav-bar-controls-menu.31i` | navbar | sections.length === 0 | null | 登录后顶栏；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsMenu.tsx:31` |
| `state.navbar.nav-bar-controls-menu.35d` | navbar | 前述 if-ret 均不成立（default return） | GenericMenu | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsMenu.tsx:35` |
| `state.navbar.nav-bar-controls-section.20i` | navbar | isMobile | NavBarSection | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:20` |
| `state.navbar.nav-bar-controls-section.23a1` | navbar | !((showOmnichannel ¦¦ callAction)) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:23` |
| `state.navbar.nav-bar-controls-section.23a0` | navbar | (showOmnichannel ¦¦ callAction) | NavBarControlsWithData | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:23` |
| `state.navbar.nav-bar-controls-section.26t1` | navbar | !(user) | NavBarItemLoginPage | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:26` |
| `state.navbar.nav-bar-controls-section.26t0` | navbar | user | UserMenu | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:26` |
| `state.navbar.nav-bar-controls-section.32d` | navbar | 前述 if-ret 均不成立（default return） | NavBarSection | 登录后顶栏；shot:home.png；桌面 → NavBarSection | [实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:32` |
| `state.navbar.nav-bar-controls-section.34a1` | navbar | !(callAction) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:34` |
| `state.navbar.nav-bar-controls-section.34a0` | navbar | callAction | NavBarVoipGroup | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:34` |
| `state.navbar.nav-bar-controls-section.35a1` | navbar | !(showOmnichannel) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:35` |
| `state.navbar.nav-bar-controls-section.35a0` | navbar | showOmnichannel | NavBarOmnichannelGroup | 登录后顶栏；shot:home.png；Omnichannel 组（Contact Center / 接听） | [实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:35` |
| `state.navbar.nav-bar-controls-section.38t1` | navbar | !(user) | NavBarItemLoginPage | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:38` |
| `state.navbar.nav-bar-controls-section.38t0` | navbar | user | UserMenu | 登录后顶栏；shot:home.png；已登录 UserMenu | [实测] | （无） | `apps/meteor/client/navbar/NavBarControls/NavBarControlsSection.tsx:38` |
| `state.navbar.nav-bar-navigation.27a1` | navbar | !(!isMobile) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarNavigation.tsx:27` |
| `state.navbar.nav-bar-navigation.27a0` | navbar | !isMobile | Box | 登录后顶栏；shot:home.png；非 mobile 历史导航 | [实测] | （无） | `apps/meteor/client/navbar/NavBarNavigation.tsx:27` |
| `state.navbar.nav-bar-item-omnichannel-queue.11i` | navbar | !isEnabled | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarOmnichannelGroup/NavBarItemOmnichannelQueue.tsx:11` |
| `state.navbar.nav-bar-item-omnichannel-queue.15d` | navbar | 前述 if-ret 均不成立（default return） | NavBarItem | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarOmnichannelGroup/NavBarItemOmnichannelQueue.tsx:15` |
| `state.navbar.nav-bar-item-home-page.20t1` | navbar | !(showHome) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/NavBarItemHomePage.tsx:20` |
| `state.navbar.nav-bar-item-home-page.20t0` | navbar | showHome | NavBarItem | 登录后顶栏；shot:home.png；Home 按钮 | [实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/NavBarItemHomePage.tsx:20` |
| `state.navbar.nav-bar-pages-group.22a1` | navbar | !(isTablet) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/NavBarPagesGroup.tsx:22` |
| `state.navbar.nav-bar-pages-group.22a0` | navbar | isTablet | NavBarPagesStackMenu | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/NavBarPagesGroup.tsx:22` |
| `state.navbar.nav-bar-pages-group.23a1` | navbar | !(!isTablet) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/NavBarPagesGroup.tsx:23` |
| `state.navbar.nav-bar-pages-group.23a0` | navbar | !isTablet | <> | 登录后顶栏；shot:home.png；非 tablet 展开 Pages | [实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/NavBarPagesGroup.tsx:23` |
| `state.navbar.nav-bar-pages-group.29a1` | navbar | !(showMarketplace && !isMobile) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/NavBarPagesGroup.tsx:29` |
| `state.navbar.nav-bar-pages-group.29a0` | navbar | showMarketplace && !isMobile | NavBarItemMarketPlaceMenu | 登录后顶栏；shot:home.png；Marketplace 菜单 | [实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/NavBarPagesGroup.tsx:29` |
| `state.navbar.nav-bar-pages-group.30a1` | navbar | !(!isMobile) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/NavBarPagesGroup.tsx:30` |
| `state.navbar.nav-bar-pages-group.30a0` | navbar | !isMobile | NavBarItemSort | 登录后顶栏；shot:home.png；Display/Sort | [实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/NavBarPagesGroup.tsx:30` |
| `state.navbar.create-channel-modal.225a1` | navbar | !(errors.name) | null | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:225` |
| `state.navbar.create-channel-modal.225a0` | navbar | errors.name | FieldError | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:225` |
| `state.navbar.create-channel-modal.226a1` | navbar | !(!allowSpecialNames) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:226` |
| `state.navbar.create-channel-modal.226a0` | navbar | !allowSpecialNames | FieldHint | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:226` |
| `state.navbar.create-channel-modal.246a1` | navbar | !(errors.members) | null | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:246` |
| `state.navbar.create-channel-modal.246a0` | navbar | errors.members | FieldError | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:246` |
| `state.navbar.create-channel-modal.318a1` | navbar | !(broadcast) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:318` |
| `state.navbar.create-channel-modal.318a0` | navbar | broadcast | FieldHint | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateChannelModal.tsx:318` |
| `state.navbar.create-direct-message.94a1` | navbar | !(errors.users) | null | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateDirectMessage.tsx:94` |
| `state.navbar.create-direct-message.94a0` | navbar | errors.users | FieldError | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateDirectMessage.tsx:94` |
| `state.navbar.create-team-modal.189a1` | navbar | !(errors?.name) | null | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateTeamModal.tsx:189` |
| `state.navbar.create-team-modal.189a0` | navbar | errors?.name | FieldError | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateTeamModal.tsx:189` |
| `state.navbar.create-team-modal.190a1` | navbar | !(!allowSpecialNames) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateTeamModal.tsx:190` |
| `state.navbar.create-team-modal.190a0` | navbar | !allowSpecialNames | FieldHint | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateTeamModal.tsx:190` |
| `state.navbar.create-team-modal.273a1` | navbar | !(broadcast) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateTeamModal.tsx:273` |
| `state.navbar.create-team-modal.273a0` | navbar | broadcast | FieldHint | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/actions/CreateTeamModal.tsx:273` |
| `state.navbar.use-market-place-menu.43a1` | navbar | !(appRequestStats.isLoading) | null | 登录后顶栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useMarketPlaceMenu.tsx:43` |
| `state.navbar.use-market-place-menu.43a0` | navbar | appRequestStats.isLoading | Skeleton | 登录后顶栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useMarketPlaceMenu.tsx:43` |
| `state.navbar.use-market-place-menu.44a1` | navbar | !(appRequestStats.isSuccess && appRequestStats.data.totalUnseen > 0) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useMarketPlaceMenu.tsx:44` |
| `state.navbar.use-market-place-menu.44a0` | navbar | appRequestStats.isSuccess && appRequestStats.data.totalUnseen > 0 | Badge | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useMarketPlaceMenu.tsx:44` |
| `state.navbar.use-sort-mode-items.32a1` | navbar | !(sidebarSortBy === 'activity' && isOmnichannelEnabled) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useSortModeItems.tsx:32` |
| `state.navbar.use-sort-mode-items.32a0` | navbar | sidebarSortBy === 'activity' && isOmnichannelEnabled | OmnichannelSortingDisclaimer | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useSortModeItems.tsx:32` |
| `state.navbar.use-sort-mode-items.40a1` | navbar | !(sidebarSortBy === 'alphabetical' && isOmnichannelEnabled) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useSortModeItems.tsx:40` |
| `state.navbar.use-sort-mode-items.40a0` | navbar | sidebarSortBy === 'alphabetical' && isOmnichannelEnabled | OmnichannelSortingDisclaimer | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesGroup/hooks/useSortModeItems.tsx:40` |
| `state.navbar.nav-bar-pages-section.12a1` | navbar | !(sidebar.shouldToggle) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesSection.tsx:12` |
| `state.navbar.nav-bar-pages-section.12a0` | navbar | sidebar.shouldToggle | <> | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarPagesSection.tsx:12` |
| `state.navbar.nav-bar-aisearch.112t1` | navbar | !(aiSearchActive) | NavBarSearchListBox | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarAISearch.tsx:112` |
| `state.navbar.nav-bar-aisearch.112t0` | navbar | aiSearchActive | NavBarAISearchListBox | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarAISearch.tsx:112` |
| `state.navbar.nav-bar-search.93t1` | navbar | !(isDirty) | Icon | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearch.tsx:93` |
| `state.navbar.nav-bar-search.93t0` | navbar | isDirty | IconButton | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearch.tsx:93` |
| `state.navbar.nav-bar-search.100a1` | navbar | !(state.isOpen) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearch.tsx:100` |
| `state.navbar.nav-bar-search.100a0` | navbar | state.isOpen | NavBarSearchListBox | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearch.tsx:100` |
| `state.navbar.nav-bar-search-filter-suggestions.58i` | navbar | !filterSuggestionGroups.length | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchFilterSuggestions.tsx:58` |
| `state.navbar.nav-bar-search-filter-suggestions.62d` | navbar | 前述 if-ret 均不成立（default return） | <> | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchFilterSuggestions.tsx:62` |
| `state.navbar.nav-bar-search-input-addon.28a1` | navbar | !(appliedFilterChips.length > 0) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchInputAddon.tsx:28` |
| `state.navbar.nav-bar-search-input-addon.28a0` | navbar | appliedFilterChips.length > 0 | Box | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchInputAddon.tsx:28` |
| `state.navbar.nav-bar-search-input-addon.48t1` | navbar | !(hasSearchText) | Icon | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchInputAddon.tsx:48` |
| `state.navbar.nav-bar-search-input-addon.48t0` | navbar | hasSearchText | IconButton | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchInputAddon.tsx:48` |
| `state.navbar.nav-bar-search-intelligent-section.24i` | navbar | !items.length | null | 登录后顶栏；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchIntelligentSection.tsx:24` |
| `state.navbar.nav-bar-search-intelligent-section.34d` | navbar | 前述 if-ret 均不成立（default return） | Box | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchIntelligentSection.tsx:34` |
| `state.navbar.nav-bar-search-item.19a1` | navbar | !(avatar) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchItem.tsx:19` |
| `state.navbar.nav-bar-search-item.19a0` | navbar | avatar | SidebarV2ItemAvatarWrapper | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchItem.tsx:19` |
| `state.navbar.nav-bar-search-listbox.56a1` | navbar | !(items.length === 0 && !isLoading) | null | 登录后顶栏；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchListbox.tsx:56` |
| `state.navbar.nav-bar-search-listbox.56a0` | navbar | items.length === 0 && !isLoading | NavBarSearchNoResults | 登录后顶栏；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchListbox.tsx:56` |
| `state.navbar.nav-bar-search-listbox.57a1` | navbar | !(items.length > 0) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchListbox.tsx:57` |
| `state.navbar.nav-bar-search-listbox.57a0` | navbar | items.length > 0 | Box | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchListbox.tsx:57` |
| `state.navbar.nav-bar-search-room-section.34a1` | navbar | !(itemCount === 0 && !isLoading && !isFetching) | null | 登录后顶栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchRoomSection.tsx:34` |
| `state.navbar.nav-bar-search-room-section.34a0` | navbar | itemCount === 0 && !isLoading && !isFetching | NavBarAISearchNoResults | 登录后顶栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchRoomSection.tsx:34` |
| `state.navbar.nav-bar-search-room-section.35a1` | navbar | !(rooms.length > 0) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchRoomSection.tsx:35` |
| `state.navbar.nav-bar-search-room-section.35a0` | navbar | rooms.length > 0 | Box | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchRoomSection.tsx:35` |
| `state.navbar.nav-bar-search-row.16i` | navbar | room.t === 'd' && !room.u | NavBarSearchUserRow | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchRow.tsx:16` |
| `state.navbar.nav-bar-search-row.20d` | navbar | 前述 if-ret 均不成立（default return） | NavBarSearchItemWithData | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSearch/NavBarSearchRow.tsx:20` |
| `state.navbar.nav-bar-item-administration-menu.24i` | navbar | sections.length === 0 | null | 登录后顶栏；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/NavBarItemAdministrationMenu.tsx:24` |
| `state.navbar.nav-bar-item-administration-menu.28d` | navbar | 前述 if-ret 均不成立（default return） | GenericMenu | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/NavBarItemAdministrationMenu.tsx:28` |
| `state.navbar.edit-status-modal.129a1` | navbar | !(errors.statusText) | null | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/EditStatusModal.tsx:129` |
| `state.navbar.edit-status-modal.129a0` | navbar | errors.statusText | FieldError | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/EditStatusModal.tsx:129` |
| `state.navbar.edit-status-modal.152a1` | navbar | !(statusDuration === 'custom') | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/EditStatusModal.tsx:152` |
| `state.navbar.edit-status-modal.152a0` | navbar | statusDuration === 'custom' | Box | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/EditStatusModal.tsx:152` |
| `state.navbar.edit-status-modal.185a1` | navbar | !(errors.statusDuration) | null | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/EditStatusModal.tsx:185` |
| `state.navbar.edit-status-modal.185a0` | navbar | errors.statusDuration | FieldError | 登录后顶栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/EditStatusModal.tsx:185` |
| `state.navbar.keyboard-shortcuts-modal.106a1` | navbar | !(comboIndex > 0) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/KeyboardShortcutsModal.tsx:106` |
| `state.navbar.keyboard-shortcuts-modal.106a0` | navbar | comboIndex > 0 | Box | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/KeyboardShortcutsModal.tsx:106` |
| `state.navbar.keyboard-shortcuts-modal.114a1` | navbar | !(tokenIndex > 0) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/KeyboardShortcutsModal.tsx:114` |
| `state.navbar.keyboard-shortcuts-modal.114a0` | navbar | tokenIndex > 0 | Box | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/KeyboardShortcutsModal.tsx:114` |
| `state.navbar.use-status-items.110a1` | navbar | !(contentValue) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/hooks/useStatusItems.tsx:110` |
| `state.navbar.use-status-items.110a0` | navbar | contentValue | MarkdownText | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/hooks/useStatusItems.tsx:110` |
| `state.navbar.use-status-items.111a1` | navbar | !(customStatusExpiration) | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/hooks/useStatusItems.tsx:111` |
| `state.navbar.use-status-items.111a0` | navbar | customStatusExpiration | Box | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarSettingsToolbar/UserMenu/hooks/useStatusItems.tsx:111` |
| `state.navbar.nav-bar-voip-group.15i` | navbar | !callAction | null | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarVoipGroup/NavBarVoipGroup.tsx:15` |
| `state.navbar.nav-bar-voip-group.19d` | navbar | 前述 if-ret 均不成立（default return） | NavBarGroup | 登录后顶栏 | [待渲染实测] | （无） | `apps/meteor/client/navbar/NavBarVoipGroup/NavBarVoipGroup.tsx:19` |

### sidebar（63）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.sidebar.condensed.27a1` | sidebar | !(avatar) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Condensed.tsx:27` |
| `state.sidebar.condensed.27a0` | sidebar | avatar | SidebarV2ItemAvatarWrapper | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Condensed.tsx:27` |
| `state.sidebar.condensed.33a1` | sidebar | !(menu) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Condensed.tsx:33` |
| `state.sidebar.condensed.33a0` | sidebar | menu | SidebarV2ItemMenu | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Condensed.tsx:33` |
| `state.sidebar.extended.57a1` | sidebar | !(avatar) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Extended.tsx:57` |
| `state.sidebar.extended.57a0` | sidebar | avatar | SidebarV2ItemAvatarWrapper | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Extended.tsx:57` |
| `state.sidebar.extended.62a1` | sidebar | !(time) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Extended.tsx:62` |
| `state.sidebar.extended.62a0` | sidebar | time | SidebarV2ItemTimestamp | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Extended.tsx:62` |
| `state.sidebar.extended.69a1` | sidebar | !(menu) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Extended.tsx:69` |
| `state.sidebar.extended.69a0` | sidebar | menu | SidebarV2ItemMenu | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Extended.tsx:69` |
| `state.sidebar.medium.32a1` | sidebar | !(menu) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/Item/Medium.tsx:32` |
| `state.sidebar.medium.32a0` | sidebar | menu | SidebarV2ItemMenu | 登录后侧栏；shot:room-general.png；medium 视图 kebab 菜单 | [实测] | （无） | `apps/meteor/client/sidebar/Item/Medium.tsx:32` |
| `state.sidebar.room-list.67a1` | sidebar | !(roomList[index]) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/RoomList/RoomList.tsx:67` |
| `state.sidebar.room-list.67a0` | sidebar | roomList[index] | RoomListRow | 登录后侧栏；shot:room-general.png；#general RoomListRow | [实测] | （无） | `apps/meteor/client/sidebar/RoomList/RoomList.tsx:67` |
| `state.sidebar.sidebar-item-template-with-data.101a1` | sidebar | !(videoConfActions) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/RoomList/SidebarItemTemplateWithData.tsx:101` |
| `state.sidebar.sidebar-item-template-with-data.101a0` | sidebar | videoConfActions | SidebarV2Actions | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/RoomList/SidebarItemTemplateWithData.tsx:101` |
| `state.sidebar.sidebar-item-template-with-data.114t1` | sidebar | !(message) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/RoomList/SidebarItemTemplateWithData.tsx:114` |
| `state.sidebar.sidebar-item-template-with-data.114t0` | sidebar | message | span | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/RoomList/SidebarItemTemplateWithData.tsx:114` |
| `state.sidebar.sidebar-item-template-with-data.136a1` | sidebar | !(AvatarTemplate) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/RoomList/SidebarItemTemplateWithData.tsx:136` |
| `state.sidebar.sidebar-item-template-with-data.136a0` | sidebar | AvatarTemplate | AvatarTemplate | 登录后侧栏；shot:room-general.png；频道头像 | [实测] | （无） | `apps/meteor/client/sidebar/RoomList/SidebarItemTemplateWithData.tsx:136` |
| `state.sidebar.sidebar-portal.11i` | sidebar | !sidebarRoot | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/SidebarPortal.tsx:11` |
| `state.sidebar.sidebar-portal.15d` | sidebar | 前述 if-ret 均不成立（default return） | <> | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/SidebarPortal.tsx:15` |
| `state.sidebar.sidebar-region.105a1` | sidebar | !(sidebar.shouldToggle) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/SidebarRegion.tsx:105` |
| `state.sidebar.sidebar-region.105a0` | sidebar | sidebar.shouldToggle | Box | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/SidebarRegion.tsx:105` |
| `state.sidebar.sidebar-item-badges.19a1` | sidebar | !(showUnread) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/badges/SidebarItemBadges.tsx:19` |
| `state.sidebar.sidebar-item-badges.19a0` | sidebar | showUnread | UnreadBadge | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/badges/SidebarItemBadges.tsx:19` |
| `state.sidebar.sidebar-item-badges.20a1` | sidebar | !(isOmnichannelRoom(room)) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/badges/SidebarItemBadges.tsx:20` |
| `state.sidebar.sidebar-item-badges.20a0` | sidebar | isOmnichannelRoom(room) | OmnichannelBadges | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/badges/SidebarItemBadges.tsx:20` |
| `state.sidebar.sidebar-item-badges.21a1` | sidebar | !(isInviteSubscription(room)) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/badges/SidebarItemBadges.tsx:21` |
| `state.sidebar.sidebar-item-badges.21a0` | sidebar | isInviteSubscription(room) | InvitationBadge | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/badges/SidebarItemBadges.tsx:21` |
| `state.sidebar.sidebar-footer-watermark.14i` | sidebar | response.isLoading ¦¦ response.isError | null | 登录后侧栏；等查询 in-flight；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/footer/SidebarFooterWatermark.tsx:14` |
| `state.sidebar.sidebar-footer-watermark.18i` | sidebar | licenseName.isError ¦¦ licenseName.isLoading | null | 登录后侧栏；等查询 in-flight；让该查询/mutation 失败；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/footer/SidebarFooterWatermark.tsx:18` |
| `state.sidebar.sidebar-footer-watermark.24i` | sidebar | license?.activeModules.includes('hide-watermark') && !license.trial | null | 登录后侧栏；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/footer/SidebarFooterWatermark.tsx:24` |
| `state.sidebar.sidebar-footer-watermark.28d` | sidebar | 前述 if-ret 均不成立（default return） | FooterContent | 登录后侧栏；shot:room-general.png；Powered by Rocket.Chat Community | [实测] | （无） | `apps/meteor/client/sidebar/footer/SidebarFooterWatermark.tsx:28` |
| `state.sidebar.federated-room-list.57i` | sidebar | isPending | Throbber | 登录后侧栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomList.tsx:57` |
| `state.sidebar.federated-room-list.62d` | sidebar | 前述 if-ret 均不成立（default return） | Box | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomList.tsx:62` |
| `state.sidebar.federated-room-list.71t1` | sidebar | !(isFetchingNextPage) | null | 登录后侧栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomList.tsx:71` |
| `state.sidebar.federated-room-list.71t0` | sidebar | isFetchingNextPage | Throbber | 登录后侧栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomList.tsx:71` |
| `state.sidebar.federated-room-list-item.32a1` | sidebar | !(canJoin) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomListItem.tsx:32` |
| `state.sidebar.federated-room-list-item.32a0` | sidebar | canJoin | Button | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomListItem.tsx:32` |
| `state.sidebar.federated-room-list-item.39a1` | sidebar | !(!canJoin) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomListItem.tsx:39` |
| `state.sidebar.federated-room-list-item.39a0` | sidebar | !canJoin | Box | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomListItem.tsx:39` |
| `state.sidebar.federated-room-list-item.46a1` | sidebar | !(topic) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomListItem.tsx:46` |
| `state.sidebar.federated-room-list-item.46a0` | sidebar | topic | Box | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/FederatedRoomListItem.tsx:46` |
| `state.sidebar.matrix-federation-manage-server-modal.105a1` | sidebar | !(isError && errorKey) | null | 登录后侧栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationManageServerModal.tsx:105` |
| `state.sidebar.matrix-federation-manage-server-modal.105a0` | sidebar | isError && errorKey | FieldError | 登录后侧栏；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationManageServerModal.tsx:105` |
| `state.sidebar.matrix-federation-manage-server-modal.109a1` | sidebar | !(!isLoadingServerList && data?.servers) | null | 登录后侧栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationManageServerModal.tsx:109` |
| `state.sidebar.matrix-federation-manage-server-modal.109a0` | sidebar | !isLoadingServerList && data?.servers | MatrixFederationRemoveServerList | 登录后侧栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationManageServerModal.tsx:109` |
| `state.sidebar.matrix-federation-remove-server-list.49a1` | sidebar | !(!isDefault) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationRemoveServerList.tsx:49` |
| `state.sidebar.matrix-federation-remove-server-list.49a0` | sidebar | !isDefault | Icon | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationRemoveServerList.tsx:49` |
| `state.sidebar.matrix-federation-search.23a1` | sidebar | !(isLoading) | null | 登录后侧栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationSearch.tsx:23` |
| `state.sidebar.matrix-federation-search.23a0` | sidebar | isLoading | <> | 登录后侧栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationSearch.tsx:23` |
| `state.sidebar.matrix-federation-search.31a1` | sidebar | !(!isLoading && data?.servers) | null | 登录后侧栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationSearch.tsx:31` |
| `state.sidebar.matrix-federation-search.31a0` | sidebar | !isLoading && data?.servers | MatrixFederationSearchModalContent | 登录后侧栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/sidebar/header/MatrixFederationSearch/MatrixFederationSearch.tsx:31` |
| `state.sidebar.air-gapped-restriction-warning.7i` | sidebar | isRestricted | Trans | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/sections/AirGappedRestrictionBanner/AirGappedRestrictionWarning.tsx:7` |
| `state.sidebar.air-gapped-restriction-warning.18d` | sidebar | 前述 if-ret 均不成立（default return） | Trans | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/sections/AirGappedRestrictionBanner/AirGappedRestrictionWarning.tsx:18` |
| `state.sidebar.banner-section.15i` | sidebar | (isWarning ¦¦ isRestricted) && isAdmin | AirGappedRestrictionBanner | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/sections/BannerSection.tsx:15` |
| `state.sidebar.banner-section.19i` | sidebar | presenceDisabled && !bannerDismissed | StatusDisabledBanner | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/sections/BannerSection.tsx:19` |
| `state.sidebar.banner-section.23d` | sidebar | 前述 if-ret 均不成立（default return） | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/sections/BannerSection.tsx:23` |
| `state.sidebar.now-playing-section.25i` | sidebar | !track | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/sections/NowPlayingSection.tsx:25` |
| `state.sidebar.now-playing-section.39d` | sidebar | 前述 if-ret 均不成立（default return） | SidebarCard | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/sections/NowPlayingSection.tsx:39` |
| `state.sidebar.now-playing-section.59a1` | sidebar | !(track.username) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/sections/NowPlayingSection.tsx:59` |
| `state.sidebar.now-playing-section.59a0` | sidebar | track.username | UserAvatar | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/sidebar/sections/NowPlayingSection.tsx:59` |

### nav（75）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.nav.navigation-region.93a1` | nav | !(showSideBar) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/NavigationRegion.tsx:93` |
| `state.nav.navigation-region.93a0` | nav | showSideBar | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/NavigationRegion.tsx:93` |
| `state.nav.navigation-region.100a1` | nav | !(displaySidePanel) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/NavigationRegion.tsx:100` |
| `state.nav.navigation-region.100a0` | nav | displaySidePanel | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/NavigationRegion.tsx:100` |
| `state.nav.navigation-region.108a1` | nav | !(isTablet) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/NavigationRegion.tsx:108` |
| `state.nav.navigation-region.108a0` | nav | isTablet | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/NavigationRegion.tsx:108` |
| `state.nav.omnichannel-filters.13i` | nav | !hasAccess | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/OmnichannelFilters.tsx:13` |
| `state.nav.omnichannel-filters.17d` | nav | 前述 if-ret 均不成立（default return） | <> | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/OmnichannelFilters.tsx:17` |
| `state.nav.omnichannel-filters.21a1` | nav | !(canViewOmnichannelQueue) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/OmnichannelFilters.tsx:21` |
| `state.nav.omnichannel-filters.21a0` | nav | canViewOmnichannelQueue | RoomListFiltersItem | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/OmnichannelFilters.tsx:21` |
| `state.nav.room-list-filters.15a1` | nav | !(showOmnichannel) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/RoomListFilters.tsx:15` |
| `state.nav.room-list-filters.15a0` | nav | showOmnichannel | OmnichannelFilters | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/RoomListFilters.tsx:15` |
| `state.nav.room-list-filters-item.45a1` | nav | !(showUnread) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/RoomListFiltersItem.tsx:45` |
| `state.nav.room-list-filters-item.45a0` | nav | showUnread | RoomListFiltersItemBadge | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/RoomListFiltersItem.tsx:45` |
| `state.nav.sidebar-item.36a1` | nav | !(menu) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/SidebarItem.tsx:36` |
| `state.nav.sidebar-item.36a0` | nav | menu | SidebarV2ItemMenu | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/SidebarItem.tsx:36` |
| `state.nav.sidebar-item-with-data.52a1` | nav | !(videoConfActions) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/SidebarItemWithData.tsx:52` |
| `state.nav.sidebar-item-with-data.52a0` | nav | videoConfActions | SidebarV2Actions | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/SidebarItemWithData.tsx:52` |
| `state.nav.team-collab-filters.17a1` | nav | !(isDiscussionEnabled) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/TeamCollabFilters.tsx:17` |
| `state.nav.team-collab-filters.17a0` | nav | isDiscussionEnabled | RoomListFiltersItem | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/RoomList/TeamCollabFilters.tsx:17` |
| `state.nav.sidebar-item-badges.18a1` | nav | !(showUnread) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/badges/SidebarItemBadges.tsx:18` |
| `state.nav.sidebar-item-badges.18a0` | nav | showUnread | UnreadBadge | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/badges/SidebarItemBadges.tsx:18` |
| `state.nav.sidebar-item-badges.19a1` | nav | !(isInviteSubscription(room)) | null | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/badges/SidebarItemBadges.tsx:19` |
| `state.nav.sidebar-item-badges.19a0` | nav | isInviteSubscription(room) | InvitationBadge | 登录后侧栏 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidebar/badges/SidebarItemBadges.tsx:19` |
| `state.nav.side-panel-internal.44a1` | nav | !(isTablet) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidePanelInternal.tsx:44` |
| `state.nav.side-panel-internal.44a0` | nav | isTablet | IconButton | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidePanelInternal.tsx:44` |
| `state.nav.side-panel-internal.55a1` | nav | !(rooms && rooms.length === 0) | null | 登录后主壳（由 client/main.ts 闭包挂载）；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidePanelInternal.tsx:55` |
| `state.nav.side-panel-internal.55a0` | nav | rooms && rooms.length === 0 | SidePanelNoResults | 登录后主壳（由 client/main.ts 闭包挂载）；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidePanelInternal.tsx:55` |
| `state.nav.side-panel-router.24t1` | nav | !(parentRid) | SidePanelAll | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidePanelRouter.tsx:24` |
| `state.nav.side-panel-router.24t0` | nav | parentRid | SidePanelRooms | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidePanelRouter.tsx:24` |
| `state.nav.room-side-panel-item.73t1` | nav | !(message) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/RoomSidePanelItem.tsx:73` |
| `state.nav.room-side-panel-item.73t0` | nav | message | span | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/RoomSidePanelItem.tsx:73` |
| `state.nav.room-side-panel-item.74a1` | nav | !(!isRoomFilter && parentRoomId) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/RoomSidePanelItem.tsx:74` |
| `state.nav.room-side-panel-item.74a0` | nav | !isRoomFilter && parentRoomId | SidePanelParent | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/RoomSidePanelItem.tsx:74` |
| `state.nav.room-side-panel-item-badges.19a1` | nav | !(isOmnichannelRoom(room)) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/RoomSidePanelItemBadges.tsx:19` |
| `state.nav.room-side-panel-item-badges.19a0` | nav | isOmnichannelRoom(room) | SidePanelOmnichannelBadges | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/RoomSidePanelItemBadges.tsx:19` |
| `state.nav.room-side-panel-item-badges.20a1` | nav | !(showUnread) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/RoomSidePanelItemBadges.tsx:20` |
| `state.nav.room-side-panel-item-badges.20a0` | nav | showUnread | UnreadBadge | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/RoomSidePanelItemBadges.tsx:20` |
| `state.nav.room-side-panel-item-badges.21a1` | nav | !(isInviteSubscription(room)) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/RoomSidePanelItemBadges.tsx:21` |
| `state.nav.room-side-panel-item-badges.21a0` | nav | isInviteSubscription(room) | InvitationBadge | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/RoomSidePanelItemBadges.tsx:21` |
| `state.nav.side-panel-parent.10i` | nav | room.prid | SidePanelParentRoom | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelParent.tsx:10` |
| `state.nav.side-panel-parent.14a1` | nav | !(room.teamId && !room.teamMain) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelParent.tsx:14` |
| `state.nav.side-panel-parent.14a0` | nav | room.teamId && !room.teamMain | SidePanelParentTeam | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelParent.tsx:14` |
| `state.nav.side-panel-parent-room.16a1` | nav | !(icon) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelParentRoom/SidePanelParentRoom.tsx:16` |
| `state.nav.side-panel-parent-room.16a0` | nav | icon | SidePanelTagIcon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelParentRoom/SidePanelParentRoom.tsx:16` |
| `state.nav.side-panel-parent-room-with-data.10i` | nav | !subscription | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelParentRoom/SidePanelParentRoomWithData.tsx:10` |
| `state.nav.side-panel-parent-room-with-data.14d` | nav | 前述 if-ret 均不成立（default return） | SidePanelParentRoom | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelParentRoom/SidePanelParentRoomWithData.tsx:14` |
| `state.nav.side-panel-parent-team.12i` | nav | teamInfoError ¦¦ !shouldDisplayTeam | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelParentTeam.tsx:12` |
| `state.nav.side-panel-parent-team.16d` | nav | 前述 if-ret 均不成立（default return） | SidePanelTag | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelParentTeam.tsx:16` |
| `state.nav.side-panel-tag-icon.6t1` | nav | !(icon) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelTagIcon.tsx:6` |
| `state.nav.side-panel-tag-icon.6t0` | nav | icon | Icon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidePanelTagIcon.tsx:6` |
| `state.nav.sidepanel-item.69a1` | nav | !(avatar) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidepanelItem.tsx:69` |
| `state.nav.sidepanel-item.69a0` | nav | avatar | SidebarV2ItemAvatarWrapper | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidepanelItem.tsx:69` |
| `state.nav.sidepanel-item.72a1` | nav | !(time) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidepanelItem.tsx:72` |
| `state.nav.sidepanel-item.72a0` | nav | time | SidebarV2ItemTimestamp | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidepanelItem.tsx:72` |
| `state.nav.sidepanel-item.79a1` | nav | !(menu) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidepanelItem.tsx:79` |
| `state.nav.sidepanel-item.79a0` | nav | menu | SidebarV2ItemMenu | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/SidepanelItem/SidepanelItem.tsx:79` |
| `state.nav.inquire-side-panel-item.36a1` | nav | !(isOmnichannelRoom(room)) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/InquireSidePanelItem.tsx:36` |
| `state.nav.inquire-side-panel-item.36a0` | nav | isOmnichannelRoom(room) | SidePanelOmnichannelBadges | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/InquireSidePanelItem.tsx:36` |
| `state.nav.inquire-side-panel-item.61a1` | nav | !(room.source) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/InquireSidePanelItem.tsx:61` |
| `state.nav.inquire-side-panel-item.61a0` | nav | room.source | SidebarItemIcon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/InquireSidePanelItem.tsx:61` |
| `state.nav.inquire-side-panel-item.70t1` | nav | !(message) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/InquireSidePanelItem.tsx:70` |
| `state.nav.inquire-side-panel-item.70t0` | nav | message | span | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/InquireSidePanelItem.tsx:70` |
| `state.nav.side-panel-omnichannel-badges.14t1` | nav | !(isPriorityEnabled) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/SidePanelOmnichannelBadges/SidePanelOmnichannelBadges.tsx:14` |
| `state.nav.side-panel-omnichannel-badges.14t0` | nav | isPriorityEnabled | SidePanelPriorityTag | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/SidePanelOmnichannelBadges/SidePanelOmnichannelBadges.tsx:14` |
| `state.nav.side-panel-priority-tag.11i` | nav | !prioritiesConfig?.iconName | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/SidePanelOmnichannelBadges/SidePanelPriorityTag.tsx:11` |
| `state.nav.side-panel-priority-tag.15d` | nav | 前述 if-ret 均不成立（default return） | Tag | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/SidePanelOmnichannelBadges/SidePanelPriorityTag.tsx:15` |
| `state.nav.side-panel-queue.21i` | nav | !canViewOmnichannelQueue | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/tabs/SidePanelQueue.tsx:21` |
| `state.nav.side-panel-queue.25d` | nav | 前述 if-ret 均不成立（default return） | SidePanelInquiry | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/tabs/SidePanelQueue.tsx:25` |
| `state.nav.sidepanel-on-hold.20i` | nav | !hasEEModule | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/tabs/SidepanelOnHold.tsx:20` |
| `state.nav.sidepanel-on-hold.24d` | nav | 前述 if-ret 均不成立（default return） | SidePanel | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/omnichannel/tabs/SidepanelOnHold.tsx:24` |
| `state.nav.side-panel-discussions.19i` | nav | !isDiscussionEnabled | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/tabs/SidePanelDiscussions.tsx:19` |
| `state.nav.side-panel-discussions.23d` | nav | 前述 if-ret 均不成立（default return） | SidePanel | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/tabs/SidePanelDiscussions.tsx:23` |
| `state.nav.side-panel-rooms.15i` | nav | !subscription | SidePanelAll | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/tabs/SidePanelRooms.tsx:15` |
| `state.nav.side-panel-rooms.24d` | nav | 前述 if-ret 均不成立（default return） | SidePanelChannels | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/navigation/sidepanel/tabs/SidePanelRooms.tsx:24` |

### room（689）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.room.bubble-date.16a1` | room | !(bubbleDate) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/BubbleDate/BubbleDate.tsx:16` |
| `state.room.bubble-date.16a0` | room | bubbleDate | Bubble | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/BubbleDate/BubbleDate.tsx:16` |
| `state.room.classification-banner.27i` | room | !banner | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/ClassificationBanner/ClassificationBanner.tsx:27` |
| `state.room.classification-banner.31d` | room | 前述 if-ret 均不成立（default return） | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/ClassificationBanner/ClassificationBanner.tsx:31` |
| `state.room.room-e2-eenot-allowed.41a1` | room | !(action) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/E2EESetup/RoomE2EENotAllowed.tsx:41` |
| `state.room.room-e2-eenot-allowed.41a0` | room | action | StatesActions | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/E2EESetup/RoomE2EENotAllowed.tsx:41` |
| `state.room.room-e2-eesetup.31i` | room | e2eeState === 'SAVE_PASSWORD' | RoomE2EENotAllowed | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | SAVE_PASSWORD | `apps/meteor/client/views/room/E2EESetup/RoomE2EESetup.tsx:31` |
| `state.room.room-e2-eesetup.43i` | room | e2eeState === 'ENTER_PASSWORD' | RoomE2EENotAllowed | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | ENTER_PASSWORD | `apps/meteor/client/views/room/E2EESetup/RoomE2EESetup.tsx:43` |
| `state.room.room-e2-eesetup.55i` | room | e2eRoomState === 'WAITING_KEYS' | RoomE2EENotAllowed | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | WAITING_KEYS | `apps/meteor/client/views/room/E2EESetup/RoomE2EESetup.tsx:55` |
| `state.room.room-e2-eesetup.65d` | room | 前述 if-ret 均不成立（default return） | RoomBody | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/E2EESetup/RoomE2EESetup.tsx:65` |
| `state.room.federated-room-origin-server.12i` | room | !originServerName | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/FederatedRoomOriginServer.tsx:12` |
| `state.room.federated-room-origin-server.15d` | room | 前述 if-ret 均不成立（default return） | HeaderTag | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/FederatedRoomOriginServer.tsx:15` |
| `state.room.header.22i` | room | isEmbedded && !showTopNavbarEmbeddedLayout | null | 登录 → 打开任意房间；embedded layout | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Header.tsx:22` |
| `state.room.header.26i` | room | subscription && isInviteSubscription(subscription) | RoomInviteHeader | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Header.tsx:26` |
| `state.room.header.30i` | room | room.t === 'l' | OmnichannelRoomHeader | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Header.tsx:30` |
| `state.room.header.34i` | room | shouldDisplayE2EESetup | RoomHeaderE2EESetup | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Header.tsx:34` |
| `state.room.header.38d` | room | 前述 if-ret 均不成立（default return） | RoomHeader | 登录 → 打开任意房间；shot:room-general.png；普通频道 RoomHeader | [实测] | （无） | `apps/meteor/client/views/room/Header/Header.tsx:38` |
| `state.room.header-icon-with-room.14i` | room | isOmnichannelRoom(room) | OmnichannelRoomIcon | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/HeaderIconWithRoom.tsx:14` |
| `state.room.header-icon-with-room.18d` | room | 前述 if-ret 均不成立（default return） | HeaderIcon | 登录 → 打开任意房间；shot:room-general.png；频道 HeaderIcon | [实测] | （无） | `apps/meteor/client/views/room/Header/HeaderIconWithRoom.tsx:18` |
| `state.room.omnichannel-room-header.23a1` | room | !((previousRouteName === 'omnichannel-directory' ¦¦ previousRouteName === 'omnichannel-current-chats')) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Omnichannel/OmnichannelRoomHeader.tsx:23` |
| `state.room.omnichannel-room-header.23a0` | room | (previousRouteName === 'omnichannel-directory' ¦¦ previousRouteName === 'omnichannel-current-chats') | HeaderToolbar | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Omnichannel/OmnichannelRoomHeader.tsx:23` |
| `state.room.quick-action-options.32a1` | room | !(isVisible) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/QuickActionOptions.tsx:32` |
| `state.room.quick-action-options.32a0` | room | isVisible | Dropdown | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/QuickActionOptions.tsx:32` |
| `state.room.quick-actions.34i` | room | options | QuickActionOptions | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/QuickActions.tsx:34` |
| `state.room.quick-actions.38d` | room | 前述 if-ret 均不成立（default return） | HeaderToolbarAction | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/QuickActions.tsx:38` |
| `state.room.quick-actions.40a1` | room | !(quickActions.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/QuickActions.tsx:40` |
| `state.room.quick-actions.40a0` | room | quickActions.length > 0 | HeaderToolbarDivider | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/QuickActions.tsx:40` |
| `state.room.use-quick-actions.237t1` | room | !(room.departmentId) | CloseChatModal | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:237` |
| `state.room.use-quick-actions.237t0` | room | room.departmentId | CloseChatModalData | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/Omnichannel/QuickActions/hooks/useQuickActions.tsx:237` |
| `state.room.parent-discussion-route.20i` | room | subscription | ParentDiscussion | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentDiscussion/ParentDiscussionRoute.tsx:20` |
| `state.room.parent-discussion-route.24d` | room | 前述 if-ret 均不成立（default return） | ParentDiscussionWithData | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentDiscussion/ParentDiscussionRoute.tsx:24` |
| `state.room.parent-discussion-with-data.11i` | room | isError ¦¦ !data?.room | null | 登录 → 打开任意房间；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentDiscussion/ParentDiscussionWithData.tsx:11` |
| `state.room.parent-discussion-with-data.15d` | room | 前述 if-ret 均不成立（default return） | ParentDiscussion | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentDiscussion/ParentDiscussionWithData.tsx:15` |
| `state.room.parent-room.9i` | room | room.prid | ParentDiscussion | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentRoom.tsx:9` |
| `state.room.parent-room.13i` | room | room.teamId && !room.teamMain | ParentTeam | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentRoom.tsx:13` |
| `state.room.parent-room.17d` | room | 前述 if-ret 均不成立（default return） | null | 登录 → 打开任意房间；shot:room-general.png；无 parent/team 芯片 | [实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentRoom.tsx:17` |
| `state.room.parent-room-button.7i` | room | loading | Skeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentRoomButton.tsx:7` |
| `state.room.parent-room-button.11d` | room | 前述 if-ret 均不成立（default return） | IconButton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentRoomButton.tsx:11` |
| `state.room.parent-team.54i` | room | teamInfoError ¦¦ !shouldDisplayTeam | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentTeam.tsx:54` |
| `state.room.parent-team.58d` | room | 前述 if-ret 均不成立（default return） | ParentRoomButton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/ParentRoom/ParentTeam.tsx:58` |
| `state.room.room-header.47a1` | room | !(isRoomFederated(room)) | null | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomHeader.tsx:47` |
| `state.room.room-header.47a0` | room | isRoomFederated(room) | FederatedRoomOriginServer | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomHeader.tsx:47` |
| `state.room.room-header.56a1` | room | !(slots.toolbox?.hidden !== true) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomHeader.tsx:56` |
| `state.room.room-header.56a0` | room | slots.toolbox?.hidden !== true | Suspense | 登录 → 打开任意房间；shot:room-general.png；房间 toolbox 可见 | [实测] | （无） | `apps/meteor/client/views/room/Header/RoomHeader.tsx:56` |
| `state.room.room-header.57s` | room | Suspense fallback（子树未 ready） | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomHeader.tsx:57` |
| `state.room.room-header-e2-eesetup.14i` | room | e2eeState === 'SAVE_PASSWORD' ¦¦ e2eeState === 'ENTER_PASSWORD' ¦¦ e2eRoomState === 'WAITING_KEYS' | RoomHeader | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | SAVE_PASSWORD；ENTER_PASSWORD；WAITING_KEYS | `apps/meteor/client/views/room/Header/RoomHeaderE2EESetup.tsx:14` |
| `state.room.room-header-e2-eesetup.27d` | room | 前述 if-ret 均不成立（default return） | RoomHeader | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomHeaderE2EESetup.tsx:27` |
| `state.room.room-member-status.18i` | room | !presence?.statusText && !presence?.statusExpiresAt | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomMemberStatus.tsx:18` |
| `state.room.room-member-status.22d` | room | 前述 if-ret 均不成立（default return） | MarkdownText | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomMemberStatus.tsx:22` |
| `state.room.room-toolbox.52a1` | room | !(featuredActions.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomToolbox/RoomToolbox.tsx:52` |
| `state.room.room-toolbox.52a0` | room | featuredActions.length > 0 | HeaderToolbarDivider | 登录 → 打开任意房间；shot:room-general.png；featured 动作后 Divider（Video call） | [实测] | （无） | `apps/meteor/client/views/room/Header/RoomToolbox/RoomToolbox.tsx:52` |
| `state.room.room-toolbox.54a1` | room | !(showKebabMenu) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomToolbox/RoomToolbox.tsx:54` |
| `state.room.room-toolbox.54a0` | room | showKebabMenu | GenericMenu | 登录 → 打开任意房间；shot:room-general.png；Options kebab | [实测] | （无） | `apps/meteor/client/views/room/Header/RoomToolbox/RoomToolbox.tsx:54` |
| `state.room.room-topic.24i` | room | !topic && !canEditTopic | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomTopic.tsx:24` |
| `state.room.room-topic.28i` | room | !topic && canEditTopic | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomTopic.tsx:28` |
| `state.room.room-topic.36d` | room | 前述 if-ret 均不成立（default return） | MarkdownText | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/RoomTopic.tsx:36` |
| `state.room.encrypted.12t1` | room | !(e2eEnabled && room?.encrypted) | null | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/icons/Encrypted.tsx:12` |
| `state.room.encrypted.12t0` | room | e2eEnabled && room?.encrypted | HeaderState | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/icons/Encrypted.tsx:12` |
| `state.room.favorite.29i` | room | !subscribed ¦¦ !isFavoritesEnabled | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/icons/Favorite.tsx:29` |
| `state.room.favorite.33d` | room | 前述 if-ret 均不成立（default return） | HeaderState | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/icons/Favorite.tsx:33` |
| `state.room.translate.15t1` | room | !(autoTranslateEnabled && autoTranslate && autoTranslateLanguage) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/icons/Translate.tsx:15` |
| `state.room.translate.15t0` | room | autoTranslateEnabled && autoTranslate && autoTranslateLanguage | HeaderState | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Header/icons/Translate.tsx:15` |
| `state.room.image-gallery-data.15i` | room | isPending | ImageGalleryLoading | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/ImageGallery/ImageGalleryData.tsx:15` |
| `state.room.image-gallery-data.19i` | room | isError | ImageGalleryError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/ImageGallery/ImageGalleryData.tsx:19` |
| `state.room.image-gallery-data.23d` | room | 前述 if-ret 均不成立（default return） | ImageGallery | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/ImageGallery/ImageGalleryData.tsx:23` |
| `state.room.member-list-router.28i` | room | isMembersList && !username | RoomMembers | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MemberListRouter.tsx:28` |
| `state.room.member-list-router.32d` | room | 前述 if-ret 均不成立（default return） | UserInfo | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MemberListRouter.tsx:32` |
| `state.room.message-list.282t1` | room | !(canPreview) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageList.tsx:282` |
| `state.room.message-list.282t0` | room | canPreview | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageList.tsx:282` |
| `state.room.message-list.284t1` | room | !(hasMorePreviousMessages) | li | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageList.tsx:284` |
| `state.room.message-list.284t0` | room | hasMorePreviousMessages | li | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageList.tsx:284` |
| `state.room.message-list.285t1` | room | !(isLoadingMoreMessages) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageList.tsx:285` |
| `state.room.message-list.285t0` | room | isLoadingMoreMessages | LoadingMessagesIndicator | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageList.tsx:285` |
| `state.room.message-list.289t1` | room | !(retentionPolicy?.isActive) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageList.tsx:289` |
| `state.room.message-list.289t0` | room | retentionPolicy?.isActive | RetentionPolicyWarning | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageList.tsx:289` |
| `state.room.message-list.319t1` | room | !(isLoadingMoreMessages) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageList.tsx:319` |
| `state.room.message-list.319t0` | room | isLoadingMoreMessages | LoadingMessagesIndicator | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageList.tsx:319` |
| `state.room.message-list-item.49a1` | room | !(showDivider) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageListItem.tsx:49` |
| `state.room.message-list-item.49a0` | room | showDivider | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageListItem.tsx:49` |
| `state.room.message-list-item.65a1` | room | !(newDay) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageListItem.tsx:65` |
| `state.room.message-list-item.65a0` | room | newDay | Bubble | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageListItem.tsx:65` |
| `state.room.message-list-item.73a1` | room | !(visible) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageListItem.tsx:73` |
| `state.room.message-list-item.73a0` | room | visible | RoomMessage | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageListItem.tsx:73` |
| `state.room.message-list-item.84a1` | room | !(isThreadMessage(message)) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageListItem.tsx:84` |
| `state.room.message-list-item.84a0` | room | isThreadMessage(message) | div | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageListItem.tsx:84` |
| `state.room.message-list-item.97a1` | room | !(system) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageListItem.tsx:97` |
| `state.room.message-list-item.97a0` | room | system | SystemMessage | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/MessageList/MessageListItem.tsx:97` |
| `state.room.room.42i` | room | subscription && isInviteSubscription(subscription) | FocusScope | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Room.tsx:42` |
| `state.room.room.50d` | room | 前述 if-ret 均不成立（default return） | ChatProvider | 登录 → 打开任意房间；shot:room-general.png；ChatProvider | [实测] | （无） | `apps/meteor/client/views/room/Room.tsx:50` |
| `state.room.room.61t1` | room | !(shouldDisplayE2EESetup) | MediaCallRoom | 登录 → 打开任意房间；房间加密开；shot:room-general.png；非 E2EE setup → MediaCallRoom/RoomBody | [实测] | （无） | `apps/meteor/client/views/room/Room.tsx:61` |
| `state.room.room.61t0` | room | shouldDisplayE2EESetup | RoomE2EESetup | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Room.tsx:61` |
| `state.room.room.70a1` | room | !(toolbox.tab?.tabComponent) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Room.tsx:70` |
| `state.room.room.70a0` | room | toolbox.tab?.tabComponent | ErrorBoundary | 登录 → 打开任意房间；shot:room-channel-settings.png；打开 channel-settings / members 面板 | [实测] | （无） | `apps/meteor/client/views/room/Room.tsx:70` |
| `state.room.room.73s` | room | Suspense fallback（子树未 ready） | ContextualbarSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Room.tsx:73` |
| `state.room.room.77a1` | room | !(contextualBarView) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Room.tsx:77` |
| `state.room.room.77a0` | room | contextualBarView | ErrorBoundary | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Room.tsx:77` |
| `state.room.room.81s` | room | Suspense fallback（子树未 ready） | ContextualbarSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/Room.tsx:81` |
| `state.room.room-announcement.57t1` | room | !(announcement) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomAnnouncement/RoomAnnouncement.tsx:57` |
| `state.room.room-announcement.57t0` | room | announcement | AnnouncementBanner | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomAnnouncement/RoomAnnouncement.tsx:57` |
| `state.room.room-opener.33s` | room | Suspense fallback（子树未 ready） | RoomSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpener.tsx:33` |
| `state.room.room-opener.34a1` | room | !(isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpener.tsx:34` |
| `state.room.room-opener.34a0` | room | isLoading | RoomSkeleton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpener.tsx:34` |
| `state.room.room-opener.35a1` | room | !(isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpener.tsx:35` |
| `state.room.room-opener.35a0` | room | isSuccess | RoomProvider | 登录 → 打开任意房间；shot:room-general.png；房间查询成功 RoomProvider | [实测] | （无） | `apps/meteor/client/views/room/RoomOpener.tsx:35` |
| `state.room.room-opener.42i` | room | error instanceof OldUrlRoomError | RoomSkeleton | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpener.tsx:42` |
| `state.room.room-opener.46i` | room | error instanceof RoomNotFoundError | RoomNotFound | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpener.tsx:46` |
| `state.room.room-opener.50i` | room | error instanceof NotSubscribedToRoomError | NotSubscribedRoom | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpener.tsx:50` |
| `state.room.room-opener.54i` | room | error instanceof NotAuthorizedError | NotAuthorizedPage | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpener.tsx:54` |
| `state.room.room-opener.58d` | room | 前述 if-ret 均不成立（default return） | RoomLayout | 登录 → 打开任意房间；shot:room-general.png；RoomLayout | [实测] | （无） | `apps/meteor/client/views/room/RoomOpener.tsx:58` |
| `state.room.room-opener-embedded.54s` | room | Suspense fallback（子树未 ready） | RoomSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:54` |
| `state.room.room-opener-embedded.55a1` | room | !(isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:55` |
| `state.room.room-opener-embedded.55a0` | room | isLoading | RoomSkeleton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:55` |
| `state.room.room-opener-embedded.56a1` | room | !(isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:56` |
| `state.room.room-opener-embedded.56a0` | room | isSuccess | RoomProvider | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:56` |
| `state.room.room-opener-embedded.63i` | room | error instanceof OldUrlRoomError | RoomSkeleton | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:63` |
| `state.room.room-opener-embedded.67i` | room | error instanceof RoomNotFoundError | RoomNotFound | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:67` |
| `state.room.room-opener-embedded.71i` | room | error instanceof NotSubscribedToRoomError | NotSubscribedRoom | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:71` |
| `state.room.room-opener-embedded.75i` | room | error instanceof NotAuthorizedError | NotAuthorizedPage | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:75` |
| `state.room.room-opener-embedded.79d` | room | 前述 if-ret 均不成立（default return） | RoomLayout | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomOpenerEmbedded.tsx:79` |
| `state.room.room-route.30i` | room | isEmbeddedLayout | RoomOpenerEmbedded | 登录 → 打开任意房间；embedded layout | [待渲染实测] | （无） | `apps/meteor/client/views/room/RoomRoute.tsx:30` |
| `state.room.room-route.34d` | room | 前述 if-ret 均不成立（default return） | RoomOpener | 登录 → 打开任意房间；shot:room-general.png；/channel/general RoomOpener | [实测] | （无） | `apps/meteor/client/views/room/RoomRoute.tsx:34` |
| `state.room.share-location-modal.70i` | room | permissionLoading ¦¦ permissionState === 'prompt' | GenericModal | 登录 → 打开任意房间；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/room/ShareLocation/ShareLocationModal.tsx:70` |
| `state.room.share-location-modal.82i` | room | permissionState === 'denied' ¦¦ !positionData | GenericModal | 登录 → 打开任意房间；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/room/ShareLocation/ShareLocationModal.tsx:82` |
| `state.room.share-location-modal.90d` | room | 前述 if-ret 均不成立（default return） | GenericModal | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/ShareLocation/ShareLocationModal.tsx:90` |
| `state.room.user-card-with-data.62a1` | room | !(utcOffset && Number.isInteger(utcOffset)) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/UserCard/UserCardWithData.tsx:62` |
| `state.room.user-card-with-data.62a0` | room | utcOffset && Number.isInteger(utcOffset) | LocalTime | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/UserCard/UserCardWithData.tsx:62` |
| `state.room.user-card-with-data.63a1` | room | !(_id) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/UserCard/UserCardWithData.tsx:63` |
| `state.room.user-card-with-data.63a0` | room | _id | ReactiveUserStatus | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/UserCard/UserCardWithData.tsx:63` |
| `state.room.user-card-with-data.64a1` | room | !(_id) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/UserCard/UserCardWithData.tsx:64` |
| `state.room.user-card-with-data.64a0` | room | _id | ReactiveUserStatusText | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/UserCard/UserCardWithData.tsx:64` |
| `state.room.user-card-with-data.84i` | room | !menuOptions?.length | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/UserCard/UserCardWithData.tsx:84` |
| `state.room.user-card-with-data.88d` | room | 前述 if-ret 均不成立（default return） | GenericMenu | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/UserCard/UserCardWithData.tsx:88` |
| `state.room.user-card-with-data.99i` | room | isLoading | UserCardSkeleton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/UserCard/UserCardWithData.tsx:99` |
| `state.room.user-card-with-data.103d` | room | 前述 if-ret 均不成立（default return） | UserCard | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/UserCard/UserCardWithData.tsx:103` |
| `state.room.drop-target-overlay.62i` | room | !visible | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/DropTargetOverlay.tsx:62` |
| `state.room.drop-target-overlay.66d` | room | 前述 if-ret 均不成立（default return） | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/DropTargetOverlay.tsx:66` |
| `state.room.room-body.163a1` | room | !(!isLayoutEmbedded && room.announcement) | null | 登录 → 打开任意房间；embedded layout | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomBody.tsx:163` |
| `state.room.room-body.163a0` | room | !isLayoutEmbedded && room.announcement | RoomAnnouncement | 登录 → 打开任意房间；embedded layout | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomBody.tsx:163` |
| `state.room.room-body.175a1` | room | !(isUploading) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomBody.tsx:175` |
| `state.room.room-body.175a0` | room | isUploading | UploadProgressIndicator | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomBody.tsx:175` |
| `state.room.room-body.176a1` | room | !(Boolean(unread)) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomBody.tsx:176` |
| `state.room.room-body.176a0` | room | Boolean(unread) | UnreadMessagesIndicator | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomBody.tsx:176` |
| `state.room.room-body.192t1` | room | !(!canPreview) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomBody.tsx:192` |
| `state.room.room-body.192t0` | room | !canPreview | div | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomBody.tsx:192` |
| `state.room.room-foreword.14i` | room | !isDirectMessageRoom(room) | Box | 登录 → 打开任意房间；shot:room-general.png；频道 Start of conversation | [实测] | （无） | `apps/meteor/client/views/room/body/RoomForeword/RoomForeword.tsx:14` |
| `state.room.room-foreword.24i` | room | !usernames ¦¦ usernames.length < 1 | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomForeword/RoomForeword.tsx:24` |
| `state.room.room-foreword.28d` | room | 前述 if-ret 均不成立（default return） | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomForeword/RoomForeword.tsx:28` |
| `state.room.room-foreword-username-list-item.18a1` | room | !(isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomForeword/RoomForewordUsernameListItem.tsx:18` |
| `state.room.room-foreword-username-list-item.18a0` | room | isLoading | Skeleton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomForeword/RoomForewordUsernameListItem.tsx:18` |
| `state.room.room-invite-body.40a1` | room | !(infoLink) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomInviteBody.tsx:40` |
| `state.room.room-invite-body.40a0` | room | infoLink | StatesLink | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/RoomInviteBody.tsx:40` |
| `state.room.upload-progress-indicator.61i` | room | count === 0 | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/UploadProgress/UploadProgressIndicator.tsx:61` |
| `state.room.upload-progress-indicator.65d` | room | 前述 if-ret 均不成立（default return） | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/body/UploadProgress/UploadProgressIndicator.tsx:65` |
| `state.room.composer-anonymous.45a1` | room | !(isAnonymousWriteEnabled) | null | 登录 → 打开任意房间；匿名读 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerAnonymous.tsx:45` |
| `state.room.composer-anonymous.45a0` | room | isAnonymousWriteEnabled | Button | 登录 → 打开任意房间；匿名读 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerAnonymous.tsx:45` |
| `state.room.composer-box-popup.92a1` | room | !(title) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopup.tsx:92` |
| `state.room.composer-box-popup.92a0` | room | title | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopup.tsx:92` |
| `state.room.composer-box-popup.99a1` | room | !(!isLoading && itemsFlat.length === 0) | null | 登录 → 打开任意房间；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopup.tsx:99` |
| `state.room.composer-box-popup.99a0` | room | !isLoading && itemsFlat.length === 0 | Option | 登录 → 打开任意房间；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopup.tsx:99` |
| `state.room.composer-box-popup.100a1` | room | !(isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopup.tsx:100` |
| `state.room.composer-box-popup.100a0` | room | isLoading | OptionSkeleton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopup.tsx:100` |
| `state.room.composer-box-popup-preview.102i` | room | suspended | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:102` |
| `state.room.composer-box-popup-preview.106d` | room | 前述 if-ret 均不成立（default return） | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:106` |
| `state.room.composer-box-popup-preview.109a1` | room | !(title) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:109` |
| `state.room.composer-box-popup-preview.109a0` | room | title | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:109` |
| `state.room.composer-box-popup-preview.116a1` | room | !(isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:116` |
| `state.room.composer-box-popup-preview.116a0` | room | isLoading | Skeleton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:116` |
| `state.room.composer-box-popup-preview.137a1` | room | !(item.type === 'image') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:137` |
| `state.room.composer-box-popup-preview.137a0` | room | item.type === 'image' | img | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:137` |
| `state.room.composer-box-popup-preview.138a1` | room | !(item.type === 'audio') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:138` |
| `state.room.composer-box-popup-preview.138a0` | room | item.type === 'audio' | audio | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:138` |
| `state.room.composer-box-popup-preview.145a1` | room | !(item.type === 'video') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:145` |
| `state.room.composer-box-popup-preview.145a0` | room | item.type === 'video' | video | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:145` |
| `state.room.composer-box-popup-preview.152a1` | room | !(item.type === 'text') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:152` |
| `state.room.composer-box-popup-preview.152a0` | room | item.type === 'text' | Option | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:152` |
| `state.room.composer-box-popup-preview.153a1` | room | !(item.type === 'other') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:153` |
| `state.room.composer-box-popup-preview.153a0` | room | item.type === 'other' | code | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupPreview.tsx:153` |
| `state.room.composer-box-popup-user.30a1` | room | !(!system) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupUser.tsx:30` |
| `state.room.composer-box-popup-user.30a0` | room | !system | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupUser.tsx:30` |
| `state.room.composer-box-popup-user.40a1` | room | !(nickname) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupUser.tsx:40` |
| `state.room.composer-box-popup-user.40a0` | room | nickname | span | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupUser.tsx:40` |
| `state.room.composer-box-popup-user.45a1` | room | !(system) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupUser.tsx:45` |
| `state.room.composer-box-popup-user.45a0` | room | system | OptionContent | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupUser.tsx:45` |
| `state.room.composer-box-popup-user.51a1` | room | !(outside && variant === 'large') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupUser.tsx:51` |
| `state.room.composer-box-popup-user.51a0` | room | outside && variant === 'large' | OptionColumn | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupUser.tsx:51` |
| `state.room.composer-box-popup-user.57a1` | room | !(suggestion && variant === 'large') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupUser.tsx:57` |
| `state.room.composer-box-popup-user.57a0` | room | suggestion && variant === 'large' | OptionColumn | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerBoxPopupUser.tsx:57` |
| `state.room.composer-container.43i` | room | isAirGappedRestricted | ComposerAirGappedRestricted | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:43` |
| `state.room.composer-container.47i` | room | isOmnichannel | ComposerOmnichannel | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:47` |
| `state.room.composer-container.51i` | room | isFederation | ComposerFederation | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:51` |
| `state.room.composer-container.55i` | room | isAnonymous | ComposerAnonymous | 登录 → 打开任意房间；匿名读 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:55` |
| `state.room.composer-container.59i` | room | isReadOnly | ComposerReadOnly | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:59` |
| `state.room.composer-container.63i` | room | isArchived | ComposerArchived | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:63` |
| `state.room.composer-container.67i` | room | mustJoinWithCode | ComposerJoinWithPassword | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:67` |
| `state.room.composer-container.71i` | room | isBlockedOrBlocker | ComposerBlocked | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:71` |
| `state.room.composer-container.75i` | room | isSelectingMessages | ComposerSelectMessages | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:75` |
| `state.room.composer-container.79d` | room | 前述 if-ret 均不成立（default return） | <> | 登录 → 打开任意房间；shot:room-general.png；可写 Composer 默认 | [实测] | （无） | `apps/meteor/client/views/room/composer/ComposerContainer.tsx:79` |
| `state.room.composer-federation.17i` | room | blocked | ComposerFederationInvalidVersion | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerFederation/ComposerFederation.tsx:17` |
| `state.room.composer-federation.21i` | room | !federationEnabled | ComposerFederationDisabled | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerFederation/ComposerFederation.tsx:21` |
| `state.room.composer-federation.25i` | room | !federationModuleEnabled | ComposerFederationJoinRoomDisabled | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerFederation/ComposerFederation.tsx:25` |
| `state.room.composer-federation.29d` | room | 前述 if-ret 均不成立（default return） | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerFederation/ComposerFederation.tsx:29` |
| `state.room.composer-message.87i` | room | !publicationReady | ComposerSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerMessage.tsx:87` |
| `state.room.composer-message.91d` | room | 前述 if-ret 均不成立（default return） | MessageBox | 登录 → 打开任意房间；shot:room-general.png；MessageBox | [实测] | （无） | `apps/meteor/client/views/room/composer/ComposerMessage.tsx:91` |
| `state.room.composer-omnichannel.26i` | room | !open | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannel.tsx:26` |
| `state.room.composer-omnichannel.35i` | room | isRoomOverMacLimit | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannel.tsx:35` |
| `state.room.composer-omnichannel.44i` | room | onHold | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannel.tsx:44` |
| `state.room.composer-omnichannel.53i` | room | isInquired | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannel.tsx:53` |
| `state.room.composer-omnichannel.62i` | room | !isSubscribed && !isSameAgent | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannel.tsx:62` |
| `state.room.composer-omnichannel.71d` | room | 前述 if-ret 均不成立（default return） | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannel.tsx:71` |
| `state.room.composer-omnichannel-callout.35i` | room | dismissed ¦¦ !data?.contact?.unknown | null | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannelCallout.tsx:35` |
| `state.room.composer-omnichannel-callout.39d` | room | 前述 if-ret 均不成立（default return） | Callout | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerOmnichannel/ComposerOmnichannelCallout.tsx:39` |
| `state.room.composer-read-only.28a1` | room | !(!isSubscribed) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerReadOnly.tsx:28` |
| `state.room.composer-read-only.28a0` | room | !isSubscribed | Button | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/ComposerReadOnly.tsx:28` |
| `state.room.message-box.429a1` | room | !(chat.composer?.quotedMessages) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:429` |
| `state.room.message-box.429a0` | room | chat.composer?.quotedMessages | MessageBoxReplies | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:429` |
| `state.room.message-box.430a1` | room | !(shouldPopupPreview && popup.option) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:430` |
| `state.room.message-box.430a0` | room | shouldPopupPreview && popup.option | ComposerBoxPopup | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:430` |
| `state.room.message-box.445a1` | room | !(popup.option?.preview) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:445` |
| `state.room.message-box.445a0` | room | popup.option?.preview | ComposerBoxPopupPreview | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:445` |
| `state.room.message-box.464a1` | room | !(isRecordingVideo) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:464` |
| `state.room.message-box.464a0` | room | isRecordingVideo | VideoMessageRecorder | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:464` |
| `state.room.message-box.466a1` | room | !(isRecordingAudio) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:466` |
| `state.room.message-box.466a0` | room | isRecordingAudio | AudioMessageRecorder | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:466` |
| `state.room.message-box.489a1` | room | !(chat.composer && formatters.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:489` |
| `state.room.message-box.489a0` | room | chat.composer && formatters.length > 0 | MessageBoxFormattingToolbar | 登录 → 打开任意房间；shot:room-general.png；格式化工具条 | [实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:489` |
| `state.room.message-box.508a1` | room | !(!canSend) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:508` |
| `state.room.message-box.508a0` | room | !canSend | MessageComposerButton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:508` |
| `state.room.message-box.513a1` | room | !(canSend) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:513` |
| `state.room.message-box.513a0` | room | canSend | <> | 登录 → 打开任意房间；shot:room-general.png；canSend 发送区 | [实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:513` |
| `state.room.message-box.515a1` | room | !(isEditing) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:515` |
| `state.room.message-box.515a0` | room | isEditing | MessageComposerButton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBox.tsx:515` |
| `state.room.message-box-formatting-toolbar.26a1` | room | !('icon' in featuredFormatter) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBoxFormattingToolbar/MessageBoxFormattingToolbar.tsx:26` |
| `state.room.message-box-formatting-toolbar.26a0` | room | 'icon' in featuredFormatter | MessageComposerAction | 登录 → 打开任意房间；shot:room-general.png；带 icon 的 featured formatter（Emoji/Bold…） | [实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBoxFormattingToolbar/MessageBoxFormattingToolbar.tsx:26` |
| `state.room.message-box-formatting-toolbar.44t1` | room | !('icon' in formatter) | span | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBoxFormattingToolbar/MessageBoxFormattingToolbar.tsx:44` |
| `state.room.message-box-formatting-toolbar.44t0` | room | 'icon' in formatter | MessageComposerAction | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBoxFormattingToolbar/MessageBoxFormattingToolbar.tsx:44` |
| `state.room.message-box-hint.31i` | room | !isEditing && !isUnencryptedHintVisible && !isReadOnly | null | 登录 → 打开任意房间；房间加密开；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBoxHint.tsx:31` |
| `state.room.message-box-hint.48d` | room | 前述 if-ret 均不成立（default return） | MessageComposerHint | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBoxHint.tsx:48` |
| `state.room.message-box-replies.16i` | room | !replies.length | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBoxReplies.tsx:16` |
| `state.room.message-box-replies.20d` | room | 前述 if-ret 均不成立（default return） | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageBoxReplies.tsx:20` |
| `state.room.message-composer-file-item.20i` | room | shouldPreview | MessageComposerImageFileItem | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageComposerFileItem.tsx:20` |
| `state.room.message-composer-file-item.24d` | room | 前述 if-ret 均不成立（default return） | MessageComposerGenericFile | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageComposerFileItem.tsx:24` |
| `state.room.message-composer-files.23i` | room | !uploadsStore ¦¦ !hasUploads | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageComposerFiles.tsx:23` |
| `state.room.message-composer-files.27d` | room | 前述 if-ret 均不成立（default return） | MessageComposerFileGroup | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageComposerFiles.tsx:27` |
| `state.room.message-composer-generic-file.60t1` | room | !(isLoading && !isActive) | IconButton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageComposerGenericFile.tsx:60` |
| `state.room.message-composer-generic-file.60t0` | room | isLoading && !isActive | MessageComposerFileLoader | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageComposerGenericFile.tsx:60` |
| `state.room.message-composer-generic-file.66i` | room | upload.error | MessageComposerFileError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageComposerGenericFile.tsx:66` |
| `state.room.message-composer-generic-file.78d` | room | 前述 if-ret 均不成立（default return） | MessageComposerFile | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/composer/messageBox/MessageComposerGenericFile.tsx:78` |
| `state.room.auto-translate.34a1` | room | !(handleClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/AutoTranslate/AutoTranslate.tsx:34` |
| `state.room.auto-translate.34a0` | room | handleClose | ContextualbarClose | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/AutoTranslate/AutoTranslate.tsx:34` |
| `state.room.auto-translate.38a1` | room | !(room.encrypted) | null | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/AutoTranslate/AutoTranslate.tsx:38` |
| `state.room.auto-translate.38a0` | room | room.encrypted | Callout | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/AutoTranslate/AutoTranslate.tsx:38` |
| `state.room.banned-users.42a1` | room | !(loading) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsers.tsx:42` |
| `state.room.banned-users.42a0` | room | loading | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsers.tsx:42` |
| `state.room.banned-users.48a1` | room | !(error) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsers.tsx:48` |
| `state.room.banned-users.48a0` | room | error | ContextualbarEmptyContent | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsers.tsx:48` |
| `state.room.banned-users.50a1` | room | !(!loading && !error && bannedUsers.length === 0) | null | 登录 → 打开任意房间；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsers.tsx:50` |
| `state.room.banned-users.50a0` | room | !loading && !error && bannedUsers.length === 0 | ContextualbarEmptyContent | 登录 → 打开任意房间；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsers.tsx:50` |
| `state.room.banned-users.54a1` | room | !(!loading && !error && bannedUsers.length > 0) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsers.tsx:54` |
| `state.room.banned-users.54a0` | room | !loading && !error && bannedUsers.length > 0 | Box | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsers.tsx:54` |
| `state.room.banned-users-item.42t1` | room | !(federated) | ReactiveUserStatus | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsersItem.tsx:42` |
| `state.room.banned-users-item.42t0` | room | federated | Icon | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsersItem.tsx:42` |
| `state.room.banned-users-item.44a1` | room | !(displayUsername) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsersItem.tsx:44` |
| `state.room.banned-users-item.44a0` | room | displayUsername | OptionDescription | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/BannedUsers/BannedUsersItem.tsx:44` |
| `state.room.discussions-list.84a1` | room | !(isPending) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsList.tsx:84` |
| `state.room.discussions-list.84a0` | room | isPending | Box | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsList.tsx:84` |
| `state.room.discussions-list.89a1` | room | !(error instanceof Error) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsList.tsx:89` |
| `state.room.discussions-list.89a0` | room | error instanceof Error | Callout | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsList.tsx:89` |
| `state.room.discussions-list.94a1` | room | !(isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsList.tsx:94` |
| `state.room.discussions-list.94a0` | room | isSuccess | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsList.tsx:94` |
| `state.room.discussions-list.96a1` | room | !(discussions.length === 0) | null | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsList.tsx:96` |
| `state.room.discussions-list.96a0` | room | discussions.length === 0 | ContextualbarEmptyContent | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsList.tsx:96` |
| `state.room.discussions-list.97a1` | room | !(discussions.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsList.tsx:97` |
| `state.room.discussions-list.97a0` | room | discussions.length > 0 | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsList.tsx:97` |
| `state.room.discussions-list-context-bar.35i` | room | !userId | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsListContextBar.tsx:35` |
| `state.room.discussions-list-context-bar.39d` | room | 前述 if-ret 均不成立（default return） | DiscussionsList | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/DiscussionsListContextBar.tsx:39` |
| `state.room.discussions-list-item.64a1` | room | !(!dcount) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/components/DiscussionsListItem.tsx:64` |
| `state.room.discussions-list-item.64a0` | room | !dcount | MessageMetricsItem | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/components/DiscussionsListItem.tsx:64` |
| `state.room.discussions-list-item.69a1` | room | !(!!dcount) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/components/DiscussionsListItem.tsx:69` |
| `state.room.discussions-list-item.69a0` | room | !!dcount | MessageMetricsItem | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/components/DiscussionsListItem.tsx:69` |
| `state.room.discussions-list-item.75a1` | room | !(!!dcount) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/components/DiscussionsListItem.tsx:75` |
| `state.room.discussions-list-item.75a0` | room | !!dcount | MessageMetricsItem | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Discussions/components/DiscussionsListItem.tsx:75` |
| `state.room.export-messages.245a1` | room | !(type === 'file') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:245` |
| `state.room.export-messages.245a0` | room | type === 'file' | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:245` |
| `state.room.export-messages.269a1` | room | !(type === 'email') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:269` |
| `state.room.export-messages.269a0` | room | type === 'email' | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:269` |
| `state.room.export-messages.303a1` | room | !(errors?.toUsers) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:303` |
| `state.room.export-messages.303a0` | room | errors?.toUsers | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:303` |
| `state.room.export-messages.349a1` | room | !(errors?.additionalEmails) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:349` |
| `state.room.export-messages.349a0` | room | errors?.additionalEmails | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:349` |
| `state.room.export-messages.363a1` | room | !(type !== 'file') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:363` |
| `state.room.export-messages.363a0` | room | type !== 'file' | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:363` |
| `state.room.export-messages.371a1` | room | !(errors.messagesCount) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:371` |
| `state.room.export-messages.371a0` | room | errors.messagesCount | Field | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/ExportMessages/ExportMessages.tsx:371` |
| `state.room.channel-to-team-modal.21i` | room | step === CHANNEL_TO_TEAM_STEPS.CONFIRMATION && teamId | ChannelToTeamConfirmation | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/ChannelToTeamModal/ChannelToTeamModal.tsx:21` |
| `state.room.channel-to-team-modal.31d` | room | 前述 if-ret 均不成立（default return） | ChannelToTeamSelection | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/ChannelToTeamModal/ChannelToTeamModal.tsx:31` |
| `state.room.edit-room-info.242a1` | room | !(onClickBack) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:242` |
| `state.room.edit-room-info.242a0` | room | onClickBack | ContextualbarBack | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:242` |
| `state.room.edit-room-info.244a1` | room | !(onClickClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:244` |
| `state.room.edit-room-info.244a0` | room | onClickClose | ContextualbarClose | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:244` |
| `state.room.edit-room-info.280a1` | room | !(errors.roomName) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:280` |
| `state.room.edit-room-info.280a0` | room | errors.roomName | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:280` |
| `state.room.edit-room-info.282a1` | room | !(canViewTopic) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:282` |
| `state.room.edit-room-info.282a0` | room | canViewTopic | Field | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:282` |
| `state.room.edit-room-info.299a1` | room | !(canViewAnnouncement) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:299` |
| `state.room.edit-room-info.299a0` | room | canViewAnnouncement | Field | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:299` |
| `state.room.edit-room-info.321a1` | room | !(canViewDescription) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:321` |
| `state.room.edit-room-info.321a0` | room | canViewDescription | Field | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:321` |
| `state.room.edit-room-info.335a1` | room | !(canViewType) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:335` |
| `state.room.edit-room-info.335a0` | room | canViewType | Field | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:335` |
| `state.room.edit-room-info.364a1` | room | !(showAccordion) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:364` |
| `state.room.edit-room-info.364a0` | room | showAccordion | Accordion | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:364` |
| `state.room.edit-room-info.366a1` | room | !(showAdvancedSettings) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:366` |
| `state.room.edit-room-info.366a0` | room | showAdvancedSettings | AccordionItem | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:366` |
| `state.room.edit-room-info.372a1` | room | !(canViewReadOnly) | null | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:372` |
| `state.room.edit-room-info.372a0` | room | canViewReadOnly | Field | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:372` |
| `state.room.edit-room-info.395a1` | room | !(readOnly) | null | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:395` |
| `state.room.edit-room-info.395a0` | room | readOnly | Field | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:395` |
| `state.room.edit-room-info.420a1` | room | !(canViewArchived) | null | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:420` |
| `state.room.edit-room-info.420a0` | room | canViewArchived | Field | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:420` |
| `state.room.edit-room-info.438a1` | room | !(archived) | null | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:438` |
| `state.room.edit-room-info.438a0` | room | archived | FieldRow | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:438` |
| `state.room.edit-room-info.445a1` | room | !(canViewJoinCode) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:445` |
| `state.room.edit-room-info.445a0` | room | canViewJoinCode | Field | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:445` |
| `state.room.edit-room-info.457a1` | room | !(joinCodeRequired) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:457` |
| `state.room.edit-room-info.457a0` | room | joinCodeRequired | FieldRow | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:457` |
| `state.room.edit-room-info.470a1` | room | !(canViewHideSysMes) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:470` |
| `state.room.edit-room-info.470a0` | room | canViewHideSysMes | Field | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:470` |
| `state.room.edit-room-info.502a1` | room | !(showRetentionPolicy) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:502` |
| `state.room.edit-room-info.502a0` | room | showRetentionPolicy | AccordionItem | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:502` |
| `state.room.edit-room-info.529a1` | room | !(retentionOverrideGlobal) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:529` |
| `state.room.edit-room-info.529a0` | room | retentionOverrideGlobal | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/EditRoomInfo/EditRoomInfo.tsx:529` |
| `state.room.room-info-abacsection.25i` | room | !abacEnabled ¦¦ !showAttributesInRoom ¦¦ !room.abacAttributes?.length | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/ABAC/RoomInfoABACSection.tsx:25` |
| `state.room.room-info-abacsection.29d` | room | 前述 if-ret 均不成立（default return） | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/ABAC/RoomInfoABACSection.tsx:29` |
| `state.room.room-info.55t1` | room | !(onClickBack) | ContextualbarIcon | 登录 → 打开任意房间；shot:room-channel-settings.png；无 Back → ContextualbarIcon | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:55` |
| `state.room.room-info.55t0` | room | onClickBack | ContextualbarBack | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:55` |
| `state.room.room-info.57a1` | room | !(onClickClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:57` |
| `state.room.room-info.57a0` | room | onClickClose | ContextualbarClose | 登录 → 打开任意房间；shot:room-channel-settings.png；Channel info Close | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:57` |
| `state.room.room-info.68a1` | room | !(menu) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:68` |
| `state.room.room-info.68a0` | room | menu | GenericMenu | 登录 → 打开任意房间；shot:room-channel-settings.png；More GenericMenu | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:68` |
| `state.room.room-info.79a1` | room | !(archived) | null | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:79` |
| `state.room.room-info.79a0` | room | archived | InfoPanelSection | 登录 → 打开任意房间；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:79` |
| `state.room.room-info.87a1` | room | !(roomTitle) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:87` |
| `state.room.room-info.87a0` | room | roomTitle | InfoPanelSection | 登录 → 打开任意房间；shot:room-channel-settings.png；标题 #general | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:87` |
| `state.room.room-info.94a1` | room | !(broadcast) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:94` |
| `state.room.room-info.94a0` | room | broadcast | InfoPanelField | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:94` |
| `state.room.room-info.102a1` | room | !(description && description !== '') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:102` |
| `state.room.room-info.102a0` | room | description && description !== '' | InfoPanelField | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:102` |
| `state.room.room-info.111a1` | room | !(announcement && announcement !== '') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:111` |
| `state.room.room-info.111a0` | room | announcement && announcement !== '' | InfoPanelField | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:111` |
| `state.room.room-info.120a1` | room | !(topic && topic !== '') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:120` |
| `state.room.room-info.120a0` | room | topic && topic !== '' | InfoPanelField | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:120` |
| `state.room.room-info.129a1` | room | !(retentionPolicy?.isActive) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:129` |
| `state.room.room-info.129a0` | room | retentionPolicy?.isActive | RetentionPolicyCallout | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfo/RoomInfo.tsx:129` |
| `state.room.room-info-router.26i` | room | isEditing | EditRoomInfoWithData | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfoRouter.tsx:26` |
| `state.room.room-info-router.30d` | room | 前述 if-ret 均不成立（default return） | RoomInfo | 登录 → 打开任意房间；shot:room-channel-settings.png；Channel info 只读 | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/Info/RoomInfoRouter.tsx:30` |
| `state.room.message-list-tab.57a1` | room | !(queryResult.isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:57` |
| `state.room.message-list-tab.57a0` | room | queryResult.isLoading | Box | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:57` |
| `state.room.message-list-tab.62a1` | room | !(queryResult.isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:62` |
| `state.room.message-list-tab.62a0` | room | queryResult.isSuccess | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:62` |
| `state.room.message-list-tab.64a1` | room | !(queryResult.data.length === 0) | null | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:64` |
| `state.room.message-list-tab.64a0` | room | queryResult.data.length === 0 | ContextualbarEmptyContent | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:64` |
| `state.room.message-list-tab.66a1` | room | !(queryResult.data.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:66` |
| `state.room.message-list-tab.66a0` | room | queryResult.data.length > 0 | MessageListErrorBoundary | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:66` |
| `state.room.message-list-tab.88a1` | room | !(newDay) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:88` |
| `state.room.message-list-tab.88a0` | room | newDay | MessageDivider | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:88` |
| `state.room.message-list-tab.90t1` | room | !(system) | RoomMessage | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:90` |
| `state.room.message-list-tab.90t0` | room | system | SystemMessage | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageListTab.tsx:90` |
| `state.room.message-search-tab.56a1` | room | !(providerQuery.data) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:56` |
| `state.room.message-search-tab.56a0` | room | providerQuery.data | ContextualbarSection | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:56` |
| `state.room.message-search-tab.63a1` | room | !(providerQuery.isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:63` |
| `state.room.message-search-tab.63a0` | room | providerQuery.isSuccess | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:63` |
| `state.room.message-search-tab.65a1` | room | !(searchText && isPending) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:65` |
| `state.room.message-search-tab.65a0` | room | searchText && isPending | Throbber | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:65` |
| `state.room.message-search-tab.66a1` | room | !(isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:66` |
| `state.room.message-search-tab.66a0` | room | isSuccess | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:66` |
| `state.room.message-search-tab.68a1` | room | !(messageSearchData.length === 0) | null | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:68` |
| `state.room.message-search-tab.68a0` | room | messageSearchData.length === 0 | ContextualbarEmptyContent | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:68` |
| `state.room.message-search-tab.69a1` | room | !(messageSearchData.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:69` |
| `state.room.message-search-tab.69a0` | room | messageSearchData.length > 0 | MessageListErrorBoundary | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:69` |
| `state.room.message-search-tab.91a1` | room | !(newDay) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:91` |
| `state.room.message-search-tab.91a0` | room | newDay | MessageDivider | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:91` |
| `state.room.message-search-tab.93t1` | room | !(system) | RoomMessage | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:93` |
| `state.room.message-search-tab.93t0` | room | system | SystemMessage | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:93` |
| `state.room.message-search-tab.123a1` | room | !(providerQuery.isError) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:123` |
| `state.room.message-search-tab.123a0` | room | providerQuery.isError | Callout | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx:123` |
| `state.room.message-search-form.64a1` | room | !(provider.description) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/components/MessageSearchForm.tsx:64` |
| `state.room.message-search-form.64a0` | room | provider.description | FieldHint | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/components/MessageSearchForm.tsx:64` |
| `state.room.message-search-form.68a1` | room | !(globalSearchEnabled) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/components/MessageSearchForm.tsx:68` |
| `state.room.message-search-form.68a0` | room | globalSearchEnabled | Field | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/components/MessageSearchForm.tsx:68` |
| `state.room.message-search-form.74a1` | room | !(room.encrypted) | null | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/components/MessageSearchForm.tsx:74` |
| `state.room.message-search-form.74a0` | room | room.encrypted | Callout | 登录 → 打开任意房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/MessageSearchTab/components/MessageSearchForm.tsx:74` |
| `state.room.notification-preferences.38a1` | room | !(handleClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/NotificationPreferences/NotificationPreferences.tsx:38` |
| `state.room.notification-preferences.38a0` | room | handleClose | ContextualbarClose | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/NotificationPreferences/NotificationPreferences.tsx:38` |
| `state.room.notification-preferences-form.46a1` | room | !(!showCounter) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/NotificationPreferences/NotificationPreferencesForm.tsx:46` |
| `state.room.notification-preferences-form.46a0` | room | !showCounter | Controller | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/NotificationPreferences/NotificationPreferencesForm.tsx:46` |
| `state.room.notification-toggle.21a1` | room | !(description) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/NotificationPreferences/components/NotificationToggle.tsx:21` |
| `state.room.notification-toggle.21a0` | room | description | FieldDescription | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/NotificationPreferences/components/NotificationToggle.tsx:21` |
| `state.room.prune-messages.41a1` | room | !(onClickClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/PruneMessages/PruneMessages.tsx:41` |
| `state.room.prune-messages.41a0` | room | onClickClose | ContextualbarClose | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/PruneMessages/PruneMessages.tsx:41` |
| `state.room.prune-messages.106a1` | room | !(callOutText && !validateText) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/PruneMessages/PruneMessages.tsx:106` |
| `state.room.prune-messages.106a0` | room | callOutText && !validateText | Callout | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/PruneMessages/PruneMessages.tsx:106` |
| `state.room.prune-messages.107a1` | room | !(validateText) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/PruneMessages/PruneMessages.tsx:107` |
| `state.room.prune-messages.107a0` | room | validateText | Callout | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/PruneMessages/PruneMessages.tsx:107` |
| `state.room.room-files.74a1` | room | !(onClickClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/RoomFiles.tsx:74` |
| `state.room.room-files.74a0` | room | onClickClose | ContextualbarClose | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/RoomFiles.tsx:74` |
| `state.room.room-files.92a1` | room | !(isPending) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/RoomFiles.tsx:92` |
| `state.room.room-files.92a0` | room | isPending | Box | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/RoomFiles.tsx:92` |
| `state.room.room-files.97a1` | room | !(isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/RoomFiles.tsx:97` |
| `state.room.room-files.97a0` | room | isSuccess | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/RoomFiles.tsx:97` |
| `state.room.room-files.99a1` | room | !(filesItems.length === 0) | null | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/RoomFiles.tsx:99` |
| `state.room.room-files.99a0` | room | filesItems.length === 0 | ContextualbarEmptyContent | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/RoomFiles.tsx:99` |
| `state.room.room-files.100a1` | room | !(filesItems.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/RoomFiles.tsx:100` |
| `state.room.room-files.100a0` | room | filesItems.length > 0 | VirtualizedScrollbars | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/RoomFiles.tsx:100` |
| `state.room.file-item.29t1` | room | !(shouldDisplayPreview) | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/FileItem.tsx:29` |
| `state.room.file-item.29t0` | room | shouldDisplayPreview | ImageItem | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/FileItem.tsx:29` |
| `state.room.file-item.54a1` | room | !(user?.username) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/FileItem.tsx:54` |
| `state.room.file-item.54a0` | room | user?.username | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/FileItem.tsx:54` |
| `state.room.image-item.24a1` | room | !(url) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/ImageItem.tsx:24` |
| `state.room.image-item.24a0` | room | url | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/ImageItem.tsx:24` |
| `state.room.image-item.30a1` | room | !(name) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/ImageItem.tsx:30` |
| `state.room.image-item.30a0` | room | name | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/ImageItem.tsx:30` |
| `state.room.image-item.35a1` | room | !(username) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/ImageItem.tsx:35` |
| `state.room.image-item.35a0` | room | username | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomFiles/components/ImageItem.tsx:35` |
| `state.room.add-matrix-users-modal.103a1` | room | !(bannedError) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddMatrixUsers/AddMatrixUsersModal.tsx:103` |
| `state.room.add-matrix-users-modal.103a0` | room | bannedError | Box | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddMatrixUsers/AddMatrixUsersModal.tsx:103` |
| `state.room.add-matrix-users-modal.108a1` | room | !(error) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddMatrixUsers/AddMatrixUsersModal.tsx:108` |
| `state.room.add-matrix-users-modal.108a0` | room | error | Box | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddMatrixUsers/AddMatrixUsersModal.tsx:108` |
| `state.room.add-matrix-users-modal.115a1` | room | !(bannedError) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddMatrixUsers/AddMatrixUsersModal.tsx:115` |
| `state.room.add-matrix-users-modal.115a0` | room | bannedError | ModalFooterAnnotation | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddMatrixUsers/AddMatrixUsersModal.tsx:115` |
| `state.room.add-users.116a1` | room | !(onClickBack) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddUsers.tsx:116` |
| `state.room.add-users.116a0` | room | onClickBack | ContextualbarBack | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddUsers.tsx:116` |
| `state.room.add-users.118a1` | room | !(closeTab) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddUsers.tsx:118` |
| `state.room.add-users.118a0` | room | closeTab | ContextualbarClose | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddUsers.tsx:118` |
| `state.room.add-users.139a1` | room | !(errors.users) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddUsers.tsx:139` |
| `state.room.add-users.139a0` | room | errors.users | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddUsers.tsx:139` |
| `state.room.add-users.150a1` | room | !(!isFederationBlocked) | null | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddUsers.tsx:150` |
| `state.room.add-users.150a0` | room | !isFederationBlocked | Button | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/AddUsers.tsx:150` |
| `state.room.banned-users-unban-modal.53a1` | room | !(error) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/BannedUsersUnbanModal.tsx:53` |
| `state.room.banned-users-unban-modal.53a0` | room | error | Box | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/AddUsers/BannedUsersUnbanModal.tsx:53` |
| `state.room.invite-link.25a1` | room | !(!linkText) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteLink.tsx:25` |
| `state.room.invite-link.25a0` | room | !linkText | InputBoxSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteLink.tsx:25` |
| `state.room.invite-link.26a1` | room | !(linkText) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteLink.tsx:26` |
| `state.room.invite-link.26a0` | room | linkText | UrlInput | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteLink.tsx:26` |
| `state.room.invite-link.30a1` | room | !(captionText) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteLink.tsx:30` |
| `state.room.invite-link.30a0` | room | captionText | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteLink.tsx:30` |
| `state.room.invite-link.36a1` | room | !(onClickEdit) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteLink.tsx:36` |
| `state.room.invite-link.36a0` | room | onClickEdit | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteLink.tsx:36` |
| `state.room.invite-users-with-data.93i` | room | isError | InviteUsersError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteUsersWithData.tsx:93` |
| `state.room.invite-users-with-data.97i` | room | isLoading | InviteUsersLoading | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteUsersWithData.tsx:97` |
| `state.room.invite-users-with-data.101i` | room | isEditing | InviteUsersEdit | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteUsersWithData.tsx:101` |
| `state.room.invite-users-with-data.112i` | room | isSuccess | InviteUsers | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteUsersWithData.tsx:112` |
| `state.room.invite-users-with-data.124d` | room | 前述 if-ret 均不成立（default return） | InviteUsersError | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/InviteUsers/InviteUsersWithData.tsx:124` |
| `state.room.room-members.147a1` | room | !(onClickClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:147` |
| `state.room.room-members.147a0` | room | onClickClose | ContextualbarClose | 登录 → 打开任意房间；shot:room-members.png；Members Close | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:147` |
| `state.room.room-members.170a1` | room | !(isPending) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:170` |
| `state.room.room-members.170a0` | room | isPending | Box | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:170` |
| `state.room.room-members.175a1` | room | !(error) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:175` |
| `state.room.room-members.175a0` | room | error | Box | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:175` |
| `state.room.room-members.180a1` | room | !(isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:180` |
| `state.room.room-members.180a0` | room | isSuccess | <> | 登录 → 打开任意房间；shot:room-members.png；成员查询成功 | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:180` |
| `state.room.room-members.182a1` | room | !(members.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:182` |
| `state.room.room-members.182a0` | room | members.length > 0 | Box | 登录 → 打开任意房间；shot:room-members.png；1 个成员 | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:182` |
| `state.room.room-members.190a1` | room | !(members.length <= 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:190` |
| `state.room.room-members.190a0` | room | members.length <= 0 | ContextualbarEmptyContent | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:190` |
| `state.room.room-members.191a1` | room | !(members.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:191` |
| `state.room.room-members.191a0` | room | members.length > 0 | VirtualizedScrollbars | 登录 → 打开任意房间；shot:room-members.png；成员 Virtualized 列表 | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:191` |
| `state.room.room-members.216a1` | room | !(!isDirect && (onClickInvite ¦¦ onClickAdd)) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:216` |
| `state.room.room-members.216a0` | room | !isDirect && (onClickInvite ¦¦ onClickAdd) | ContextualbarFooter | 登录 → 打开任意房间；shot:room-members.png；Invite/Add footer | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:216` |
| `state.room.room-members.219a1` | room | !(onClickInvite) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:219` |
| `state.room.room-members.219a0` | room | onClickInvite | Button | 登录 → 打开任意房间；shot:room-members.png；Invite Link | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:219` |
| `state.room.room-members.231a1` | room | !(onClickAdd) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:231` |
| `state.room.room-members.231a0` | room | onClickAdd | Button | 登录 → 打开任意房间；shot:room-members.png；Add | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembers.tsx:231` |
| `state.room.room-members-actions.25i` | room | !menuOptions | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersActions.tsx:25` |
| `state.room.room-members-actions.28d` | room | 前述 if-ret 均不成立（default return） | GenericMenu | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersActions.tsx:28` |
| `state.room.room-members-item.95t1` | room | !(federated) | ReactiveUserStatus | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersItem.tsx:95` |
| `state.room.room-members-item.95t0` | room | federated | Icon | 登录 → 打开任意房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersItem.tsx:95` |
| `state.room.room-members-item.97a1` | room | !(displayUsername) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersItem.tsx:97` |
| `state.room.room-members-item.97a0` | room | displayUsername | OptionDescription | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersItem.tsx:97` |
| `state.room.room-members-item.99a1` | room | !(subscription?.status === 'INVITED') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersItem.tsx:99` |
| `state.room.room-members-item.99a0` | room | subscription?.status === 'INVITED' | OptionColumn | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersItem.tsx:99` |
| `state.room.room-members-item.105t1` | room | !(showButton) | IconButton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersItem.tsx:105` |
| `state.room.room-members-item.105t0` | room | showButton | UserActions | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersItem.tsx:105` |
| `state.room.room-members-row.20i` | room | !user?._id | RoomMembersItem.Skeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersRow.tsx:20` |
| `state.room.room-members-row.24d` | room | 前述 if-ret 均不成立（default return） | RoomMembersItem | 登录 → 打开任意房间；shot:room-members.png；admin 成员行 | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersRow.tsx:24` |
| `state.room.room-members-with-data.98i` | room | state.tab === ROOM_MEMBERS_TABS.INFO && state.user?.id | UserInfoWithData | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersWithData.tsx:98` |
| `state.room.room-members-with-data.110i` | room | state.tab === ROOM_MEMBERS_TABS.INVITE | InviteUsers | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersWithData.tsx:110` |
| `state.room.room-members-with-data.114i` | room | state.tab === ROOM_MEMBERS_TABS.ADD | AddUsers | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersWithData.tsx:114` |
| `state.room.room-members-with-data.118d` | room | 前述 if-ret 均不成立（default return） | RoomMembers | 登录 → 打开任意房间；shot:room-members.png；Members 列表默认 | [实测] | （无） | `apps/meteor/client/views/room/contextualBar/RoomMembers/RoomMembersWithData.tsx:118` |
| `state.room.thread.113a1` | room | !(mainMessageQueryResult.isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:113` |
| `state.room.thread.113a0` | room | mainMessageQueryResult.isLoading | Skeleton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:113` |
| `state.room.thread.114a1` | room | !(mainMessageQueryResult.isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:114` |
| `state.room.thread.114a0` | room | mainMessageQueryResult.isSuccess | ThreadTitle | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:114` |
| `state.room.thread.117a1` | room | !(canExpand) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:117` |
| `state.room.thread.117a0` | room | canExpand | ContextualbarAction | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:117` |
| `state.room.thread.134a1` | room | !(mainMessageQueryResult.isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:134` |
| `state.room.thread.134a0` | room | mainMessageQueryResult.isLoading | ThreadSkeleton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:134` |
| `state.room.thread.135a1` | room | !(mainMessageQueryResult.isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:135` |
| `state.room.thread.135a0` | room | mainMessageQueryResult.isSuccess | ChatProvider | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Thread.tsx:135` |
| `state.room.thread-list.150a1` | room | !(isPending) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/ThreadList.tsx:150` |
| `state.room.thread-list.150a0` | room | isPending | Box | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/ThreadList.tsx:150` |
| `state.room.thread-list.155a1` | room | !(error) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/ThreadList.tsx:155` |
| `state.room.thread-list.155a0` | room | error | Callout | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/ThreadList.tsx:155` |
| `state.room.thread-list.160a1` | room | !(isSuccess) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/ThreadList.tsx:160` |
| `state.room.thread-list.160a0` | room | isSuccess | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/ThreadList.tsx:160` |
| `state.room.thread-list.162a1` | room | !(items.length === 0) | null | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/ThreadList.tsx:162` |
| `state.room.thread-list.162a0` | room | items.length === 0 | ContextualbarEmptyContent | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/ThreadList.tsx:162` |
| `state.room.thread-list.163a1` | room | !(items.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/ThreadList.tsx:163` |
| `state.room.thread-list.163a0` | room | items.length > 0 | VirtualizedScrollbars | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/ThreadList.tsx:163` |
| `state.room.threads.9i` | room | tmid | Thread | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Threads.tsx:9` |
| `state.room.threads.13d` | room | 前述 if-ret 均不成立（default return） | ThreadList | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/Threads.tsx:13` |
| `state.room.thread-list-message.75a1` | room | !(hasDraft) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadListMessage.tsx:75` |
| `state.room.thread-list-message.75a0` | room | hasDraft | MessageStatusIndicatorItem | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadListMessage.tsx:75` |
| `state.room.thread-list-message.82a1` | room | !(unread) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadListMessage.tsx:82` |
| `state.room.thread-list-message.82a0` | room | unread | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadListMessage.tsx:82` |
| `state.room.thread-list-metrics.26a1` | room | !(participants?.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadListMetrics.tsx:26` |
| `state.room.thread-list-metrics.26a0` | room | participants?.length > 0 | ThreadMetricsParticipants | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadListMetrics.tsx:26` |
| `state.room.thread-list-metrics.29t1` | room | !(isSmall) | MessageMetricsItemLabel | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadListMetrics.tsx:29` |
| `state.room.thread-list-metrics.29t0` | room | isSmall | MessageMetricsItemLabel | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadListMetrics.tsx:29` |
| `state.room.thread-message-item.39a1` | room | !(showDivider) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageItem.tsx:39` |
| `state.room.thread-message-item.39a0` | room | showDivider | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageItem.tsx:39` |
| `state.room.thread-message-item.52a1` | room | !(newDay) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageItem.tsx:52` |
| `state.room.thread-message-item.52a0` | room | newDay | Bubble | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageItem.tsx:52` |
| `state.room.thread-message-item.60t1` | room | !(system) | ThreadMessage | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageItem.tsx:60` |
| `state.room.thread-message-item.60t0` | room | system | SystemMessage | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageItem.tsx:60` |
| `state.room.thread-message-list.410t1` | room | !(loading) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:410` |
| `state.room.thread-message-list.410t0` | room | loading | li | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:410` |
| `state.room.thread-message-list.415t1` | room | !(!loading && hasPreviousPage) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:415` |
| `state.room.thread-message-list.415t0` | room | !loading && hasPreviousPage | li | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:415` |
| `state.room.thread-message-list.416t1` | room | !(isFetchingPreviousPage) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:416` |
| `state.room.thread-message-list.416t0` | room | isFetchingPreviousPage | LoadingMessagesIndicator | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:416` |
| `state.room.thread-message-list.440t1` | room | !(!loading && hasNextPage) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:440` |
| `state.room.thread-message-list.440t0` | room | !loading && hasNextPage | li | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:440` |
| `state.room.thread-message-list.442t1` | room | !(isFetchingNextPage) | InfiniteListAnchor | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:442` |
| `state.room.thread-message-list.442t0` | room | isFetchingNextPage | LoadingMessagesIndicator | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx:442` |
| `state.room.report-user-modal.66a1` | room | !(errors.reasonForReport) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/ReportUserModal.tsx:66` |
| `state.room.report-user-modal.66a0` | room | errors.reasonForReport | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/ReportUserModal.tsx:66` |
| `state.room.user-info-actions.44i` | room | !menuOptions?.length | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoActions.tsx:44` |
| `state.room.user-info-actions.48d` | room | 前述 if-ret 均不成立（default return） | GenericMenu | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoActions.tsx:48` |
| `state.room.user-info-actions.68i` | room | isPending | Skeleton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoActions.tsx:68` |
| `state.room.user-info-actions.71d` | room | 前述 if-ret 均不成立（default return） | ButtonGroup | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoActions.tsx:71` |
| `state.room.user-info-with-data.98a1` | room | !(onClickBack) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:98` |
| `state.room.user-info-with-data.98a0` | room | onClickBack | ContextualbarBack | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:98` |
| `state.room.user-info-with-data.99a1` | room | !(!onClickBack) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:99` |
| `state.room.user-info-with-data.99a0` | room | !onClickBack | ContextualbarIcon | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:99` |
| `state.room.user-info-with-data.101a1` | room | !(onClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:101` |
| `state.room.user-info-with-data.101a0` | room | onClose | ContextualbarClose | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:101` |
| `state.room.user-info-with-data.104a1` | room | !(isPending) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:104` |
| `state.room.user-info-with-data.104a0` | room | isPending | ContextualbarContent | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:104` |
| `state.room.user-info-with-data.110a1` | room | !(isError && !user) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:110` |
| `state.room.user-info-with-data.110a0` | room | isError && !user | ContextualbarContent | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:110` |
| `state.room.user-info-with-data.116a1` | room | !(!isPending && user) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:116` |
| `state.room.user-info-with-data.116a0` | room | !isPending && user | UserInfo | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/UserInfo/UserInfoWithData.tsx:116` |
| `state.room.video-conf-config-modal.76a1` | room | !(onConfirm && isAdmin) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfConfigModal.tsx:76` |
| `state.room.video-conf-config-modal.76a0` | room | onConfirm && isAdmin | Button | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfConfigModal.tsx:76` |
| `state.room.video-conf-list.45a1` | room | !(loading) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.tsx:45` |
| `state.room.video-conf-list.45a0` | room | loading | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.tsx:45` |
| `state.room.video-conf-list.50a1` | room | !((total === 0 ¦¦ error)) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.tsx:50` |
| `state.room.video-conf-list.50a0` | room | (total === 0 ¦¦ error) | Box | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.tsx:50` |
| `state.room.video-conf-list.52a1` | room | !(error) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.tsx:52` |
| `state.room.video-conf-list.52a0` | room | error | States | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.tsx:52` |
| `state.room.video-conf-list.59a1` | room | !(!loading && total === 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.tsx:59` |
| `state.room.video-conf-list.59a0` | room | !loading && total === 0 | ContextualbarEmptyContent | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.tsx:59` |
| `state.room.video-conf-list.69a1` | room | !(videoConfs.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.tsx:69` |
| `state.room.video-conf-list.69a0` | room | videoConfs.length > 0 | VirtualizedScrollbars | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfList.tsx:69` |
| `state.room.video-conf-list-item.82a1` | room | !(username) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfListItem.tsx:82` |
| `state.room.video-conf-list-item.82a0` | room | username | UserAvatar | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfListItem.tsx:82` |
| `state.room.video-conf-list-item.95a1` | room | !(discussionRid) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfListItem.tsx:95` |
| `state.room.video-conf-list-item.95a0` | room | discussionRid | IconButton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfListItem.tsx:95` |
| `state.room.video-conf-list-item.105a1` | room | !(joinedUsers.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfListItem.tsx:105` |
| `state.room.video-conf-list-item.105a0` | room | joinedUsers.length > 0 | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfListItem.tsx:105` |
| `state.room.video-conf-list-item.111a1` | room | !(index + 1 <= VIDEOCONF_STACK_MAX_USERS) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfListItem.tsx:111` |
| `state.room.video-conf-list-item.111a0` | room | index + 1 <= VIDEOCONF_STACK_MAX_USERS | UserAvatar | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfListItem.tsx:111` |
| `state.room.video-conf-list-item.129a1` | room | !(joinedUsers.length === 0 && !endedAt) | null | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfListItem.tsx:129` |
| `state.room.video-conf-list-item.129a0` | room | joinedUsers.length === 0 && !endedAt | Box | 登录 → 打开任意房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfList/VideoConfListItem.tsx:129` |
| `state.room.incoming-popup.57a1` | room | !(isPending) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:57` |
| `state.room.incoming-popup.57a0` | room | isPending | Skeleton | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:57` |
| `state.room.incoming-popup.58a1` | room | !(isSuccess && (showMic ¦¦ showCam)) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:58` |
| `state.room.incoming-popup.58a0` | room | isSuccess && (showMic ¦¦ showCam) | VideoConfPopupControllers | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:58` |
| `state.room.incoming-popup.60a1` | room | !(showCam) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:60` |
| `state.room.incoming-popup.60a0` | room | showCam | VideoConfController | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:60` |
| `state.room.incoming-popup.68a1` | room | !(showMic) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:68` |
| `state.room.incoming-popup.68a0` | room | showMic | VideoConfController | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:68` |
| `state.room.incoming-popup.87a1` | room | !(onClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:87` |
| `state.room.incoming-popup.87a0` | room | onClose | VideoConfButton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/IncomingPopup.tsx:87` |
| `state.room.outgoing-popup.41a1` | room | !((showCam ¦¦ showMic)) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/OutgoingPopup.tsx:41` |
| `state.room.outgoing-popup.41a0` | room | (showCam ¦¦ showMic) | VideoConfPopupControllers | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/OutgoingPopup.tsx:41` |
| `state.room.outgoing-popup.43a1` | room | !(showCam) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/OutgoingPopup.tsx:43` |
| `state.room.outgoing-popup.43a0` | room | showCam | VideoConfController | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/OutgoingPopup.tsx:43` |
| `state.room.outgoing-popup.51a1` | room | !(showMic) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/OutgoingPopup.tsx:51` |
| `state.room.outgoing-popup.51a0` | room | showMic | VideoConfController | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/OutgoingPopup.tsx:51` |
| `state.room.outgoing-popup.67a1` | room | !(onClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/OutgoingPopup.tsx:67` |
| `state.room.outgoing-popup.67a0` | room | onClose | VideoConfButton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/OutgoingPopup.tsx:67` |
| `state.room.start-call-popup.74a1` | room | !((showCam ¦¦ showMic)) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/StartCallPopup.tsx:74` |
| `state.room.start-call-popup.74a0` | room | (showCam ¦¦ showMic) | VideoConfPopupControllers | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/StartCallPopup.tsx:74` |
| `state.room.start-call-popup.76a1` | room | !(showCam) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/StartCallPopup.tsx:76` |
| `state.room.start-call-popup.76a0` | room | showCam | VideoConfController | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/StartCallPopup.tsx:76` |
| `state.room.start-call-popup.84a1` | room | !(showMic) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/StartCallPopup.tsx:84` |
| `state.room.start-call-popup.84a0` | room | showMic | VideoConfController | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/StartCallPopup.tsx:84` |
| `state.room.timed-video-conf-popup.42i` | room | !room | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/TimedVideoConfPopup.tsx:42` |
| `state.room.timed-video-conf-popup.68i` | room | isReceiving | IncomingPopup | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/TimedVideoConfPopup.tsx:68` |
| `state.room.timed-video-conf-popup.72i` | room | isCalling | OutgoingPopup | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/TimedVideoConfPopup.tsx:72` |
| `state.room.timed-video-conf-popup.76d` | room | 前述 if-ret 均不成立（default return） | StartCallPopup | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/TimedVideoConfPopup.tsx:76` |
| `state.room.video-conf-popup-room-info.19i` | room | isDirectMessageRoom(room) | VideoConfPopupInfo | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/VideoConfPopupRoomInfo.tsx:19` |
| `state.room.video-conf-popup-room-info.24t1` | room | !(isMultipleDirectMessageRoom(room)) | ReactiveUserStatus | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/VideoConfPopupRoomInfo.tsx:24` |
| `state.room.video-conf-popup-room-info.24t0` | room | isMultipleDirectMessageRoom(room) | RoomIcon | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/VideoConfPopupRoomInfo.tsx:24` |
| `state.room.video-conf-popup-room-info.32d` | room | 前述 if-ret 均不成立（default return） | VideoConfPopupInfo | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopup/VideoConfPopupRoomInfo.tsx:32` |
| `state.room.video-conf-popups.50a1` | room | !((children ¦¦ popups?.length > 0)) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopups.tsx:50` |
| `state.room.video-conf-popups.50a0` | room | (children ¦¦ popups?.length > 0) | VideoConfPopupPortal | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopups.tsx:50` |
| `state.room.video-conf-popups.54s` | room | Suspense fallback（子树未 ready） | VideoConfPopupSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/VideoConference/VideoConfPopups/VideoConfPopups.tsx:54` |
| `state.room.ui-kit-contextual-bar.99a1` | room | !(handleClose) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/uikit/UiKitContextualBar.tsx:99` |
| `state.room.ui-kit-contextual-bar.99a0` | room | handleClose | ContextualbarClose | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/uikit/UiKitContextualBar.tsx:99` |
| `state.room.ui-kit-contextual-bar.108a1` | room | !(view.close) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/uikit/UiKitContextualBar.tsx:108` |
| `state.room.ui-kit-contextual-bar.108a0` | room | view.close | Button | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/uikit/UiKitContextualBar.tsx:108` |
| `state.room.ui-kit-contextual-bar.114a1` | room | !(view.submit) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/uikit/UiKitContextualBar.tsx:114` |
| `state.room.ui-kit-contextual-bar.114a0` | room | view.submit | Button | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/contextualBar/uikit/UiKitContextualBar.tsx:114` |
| `state.room.room-layout.63s` | room | Suspense fallback（子树未 ready） | HeaderSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/layout/RoomLayout.tsx:63` |
| `state.room.room-layout.67s` | room | Suspense fallback（子树未 ready） | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/layout/RoomLayout.tsx:67` |
| `state.room.room-layout.69a1` | room | !(footer) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/layout/RoomLayout.tsx:69` |
| `state.room.room-layout.69a0` | room | footer | Suspense | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/layout/RoomLayout.tsx:69` |
| `state.room.room-layout.69s` | room | Suspense fallback（子树未 ready） | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/layout/RoomLayout.tsx:69` |
| `state.room.room-layout.71a1` | room | !(aside) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/layout/RoomLayout.tsx:71` |
| `state.room.room-layout.71a0` | room | aside | Suspense | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/layout/RoomLayout.tsx:71` |
| `state.room.room-layout.71s` | room | Suspense fallback（子树未 ready） | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/layout/RoomLayout.tsx:71` |
| `state.room.base-disable-e2-eemodal.27i` | room | step === STEPS.RESET_ROOM_KEY && canResetRoomKey | ResetKeysE2EEModal | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/E2EEModals/BaseDisableE2EEModal.tsx:27` |
| `state.room.base-disable-e2-eemodal.31d` | room | 前述 if-ret 均不成立（default return） | DisableE2EEModal | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/E2EEModals/BaseDisableE2EEModal.tsx:31` |
| `state.room.disable-e2-eemodal.31a1` | room | !(canResetRoomKey) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/E2EEModals/DisableE2EEModal.tsx:31` |
| `state.room.disable-e2-eemodal.31a0` | room | canResetRoomKey | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/E2EEModals/DisableE2EEModal.tsx:31` |
| `state.room.file-preview.48i` | room | shouldShowMediaPreview(file, fileType) | MediaPreview | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/FilePreview.tsx:48` |
| `state.room.file-preview.52d` | room | 前述 if-ret 均不成立（default return） | GenericPreview | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/FilePreview.tsx:52` |
| `state.room.file-upload-modal.92a1` | room | !(errors.name) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/FileUploadModal.tsx:92` |
| `state.room.file-upload-modal.92a0` | room | errors.name | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/FileUploadModal.tsx:92` |
| `state.room.file-upload-modal.94a1` | room | !(isImage) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/FileUploadModal.tsx:94` |
| `state.room.file-upload-modal.94a0` | room | isImage | Field | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/FileUploadModal.tsx:94` |
| `state.room.image-preview.23i` | room | error | GenericPreview | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/ImagePreview.tsx:23` |
| `state.room.image-preview.27d` | room | 前述 if-ret 均不成立（default return） | <> | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/ImagePreview.tsx:27` |
| `state.room.image-preview.29a1` | room | !(loading) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/ImagePreview.tsx:29` |
| `state.room.image-preview.29a0` | room | loading | PreviewSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/ImagePreview.tsx:29` |
| `state.room.media-preview.21i` | room | !loaded | PreviewSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/MediaPreview.tsx:21` |
| `state.room.media-preview.25i` | room | typeof url !== 'string' | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/MediaPreview.tsx:25` |
| `state.room.media-preview.34i` | room | fileType === FilePreviewType.IMAGE | ImagePreview | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/MediaPreview.tsx:34` |
| `state.room.media-preview.38i` | room | fileType === FilePreviewType.VIDEO | Box | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/MediaPreview.tsx:38` |
| `state.room.media-preview.47i` | room | fileType === FilePreviewType.AUDIO | AudioPlayer | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/FileUploadModal/MediaPreview.tsx:47` |
| `state.room.forward-message-modal.118a1` | room | !(!rooms.length) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/ForwardMessageModal/ForwardMessageModal.tsx:118` |
| `state.room.forward-message-modal.118a0` | room | !rooms.length | FieldHint | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/ForwardMessageModal/ForwardMessageModal.tsx:118` |
| `state.room.read-receipts-modal.49i` | room | readReceiptsResult.isLoading ¦¦ readReceiptsResult.isError | GenericModalSkeleton | 登录 → 打开任意房间；等查询 in-flight；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/ReadReceiptsModal/ReadReceiptsModal.tsx:49` |
| `state.room.read-receipts-modal.55d` | room | 前述 if-ret 均不成立（default return） | GenericModal | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/ReadReceiptsModal/ReadReceiptsModal.tsx:55` |
| `state.room.read-receipts-modal.58a1` | room | !(readReceipts && readReceipts.length > 0) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/ReadReceiptsModal/ReadReceiptsModal.tsx:58` |
| `state.room.read-receipts-modal.58a0` | room | readReceipts && readReceipts.length > 0 | div | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/ReadReceiptsModal/ReadReceiptsModal.tsx:58` |
| `state.room.report-message-modal.63t1` | room | !(message.md) | MarkdownText | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/ReportMessageModal/ReportMessageModal.tsx:63` |
| `state.room.report-message-modal.63t0` | room | message.md | MessageContentBody | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/ReportMessageModal/ReportMessageModal.tsx:63` |
| `state.room.report-message-modal.86a1` | room | !(errors.description) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/ReportMessageModal/ReportMessageModal.tsx:86` |
| `state.room.report-message-modal.86a0` | room | errors.description | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/modals/ReportMessageModal/ReportMessageModal.tsx:86` |
| `state.room.room-provider.111t1` | room | !(!room && !subscritionFromLocal) | RoomSkeleton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/providers/RoomProvider.tsx:111` |
| `state.room.room-provider.111t0` | room | !room && !subscritionFromLocal | RoomNotFound | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/providers/RoomProvider.tsx:111` |
| `state.room.user-card-provider.70a1` | room | !(state.isOpen && userCardData) | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/providers/UserCardProvider.tsx:70` |
| `state.room.user-card-provider.70a0` | room | state.isOpen && userCardData | Suspense | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/providers/UserCardProvider.tsx:70` |
| `state.room.user-card-provider.71s` | room | Suspense fallback（子树未 ready） | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/providers/UserCardProvider.tsx:71` |
| `state.room.add-webdav-account-modal.80a1` | room | !(errors.serverURL) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/AddWebdavAccountModal.tsx:80` |
| `state.room.add-webdav-account-modal.80a0` | room | errors.serverURL | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/AddWebdavAccountModal.tsx:80` |
| `state.room.add-webdav-account-modal.90a1` | room | !(errors.username) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/AddWebdavAccountModal.tsx:90` |
| `state.room.add-webdav-account-modal.90a0` | room | errors.username | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/AddWebdavAccountModal.tsx:90` |
| `state.room.add-webdav-account-modal.100a1` | room | !(errors.password) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/AddWebdavAccountModal.tsx:100` |
| `state.room.add-webdav-account-modal.100a0` | room | errors.password | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/AddWebdavAccountModal.tsx:100` |
| `state.room.save-to-webdav-modal.102a1` | room | !(isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/SaveToWebdavModal.tsx:102` |
| `state.room.save-to-webdav-modal.102a0` | room | isLoading | Box | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/SaveToWebdavModal.tsx:102` |
| `state.room.save-to-webdav-modal.107a1` | room | !(!isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/SaveToWebdavModal.tsx:107` |
| `state.room.save-to-webdav-modal.107a0` | room | !isLoading | FieldGroup | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/SaveToWebdavModal.tsx:107` |
| `state.room.save-to-webdav-modal.121a1` | room | !(errors.accountId) | null | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/SaveToWebdavModal.tsx:121` |
| `state.room.save-to-webdav-modal.121a0` | room | errors.accountId | FieldError | 登录 → 打开任意房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/SaveToWebdavModal.tsx:121` |
| `state.room.webdav-file-picker-grid.25a1` | room | !(isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerGrid/WebdavFilePickerGrid.tsx:25` |
| `state.room.webdav-file-picker-grid.25a0` | room | isLoading | WebdavFilePickerGridItem | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerGrid/WebdavFilePickerGrid.tsx:25` |
| `state.room.webdav-file-picker-grid.44a1` | room | !(!isLoading && webdavNodes?.length === 0) | null | 登录 → 打开任意房间；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerGrid/WebdavFilePickerGrid.tsx:44` |
| `state.room.webdav-file-picker-grid.44a0` | room | !isLoading && webdavNodes?.length === 0 | GenericNoResults | 登录 → 打开任意房间；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerGrid/WebdavFilePickerGrid.tsx:44` |
| `state.room.webdav-file-picker-modal.183a1` | room | !(typeView === 'list') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:183` |
| `state.room.webdav-file-picker-modal.183a0` | room | typeView === 'list' | IconButton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:183` |
| `state.room.webdav-file-picker-modal.184a1` | room | !(typeView === 'grid') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:184` |
| `state.room.webdav-file-picker-modal.184a0` | room | typeView === 'grid' | IconButton | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:184` |
| `state.room.webdav-file-picker-modal.189a1` | room | !(typeView === 'grid') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:189` |
| `state.room.webdav-file-picker-modal.189a0` | room | typeView === 'grid' | Select | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:189` |
| `state.room.webdav-file-picker-modal.194a1` | room | !(typeView === 'list') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:194` |
| `state.room.webdav-file-picker-modal.194a0` | room | typeView === 'list' | WebdavFilePickerTable | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:194` |
| `state.room.webdav-file-picker-modal.204a1` | room | !(typeView === 'grid') | null | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:204` |
| `state.room.webdav-file-picker-modal.204a0` | room | typeView === 'grid' | WebdavFilePickerGrid | 登录 → 打开任意房间 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerModal.tsx:204` |
| `state.room.webdav-file-picker-table.34a1` | room | !((isLoading ¦¦ webdavNodes?.length > 0)) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerTable.tsx:34` |
| `state.room.webdav-file-picker-table.34a0` | room | (isLoading ¦¦ webdavNodes?.length > 0) | GenericTable | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerTable.tsx:34` |
| `state.room.webdav-file-picker-table.61a1` | room | !(isLoading) | null | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerTable.tsx:61` |
| `state.room.webdav-file-picker-table.61a0` | room | isLoading | GenericTableLoadingRow | 登录 → 打开任意房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerTable.tsx:61` |
| `state.room.webdav-file-picker-table.87a1` | room | !(!isLoading && webdavNodes?.length === 0) | null | 登录 → 打开任意房间；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerTable.tsx:87` |
| `state.room.webdav-file-picker-table.87a0` | room | !isLoading && webdavNodes?.length === 0 | GenericNoResults | 登录 → 打开任意房间；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/room/webdav/WebdavFilePickerModal/WebdavFilePickerTable.tsx:87` |

### message（252）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.message.message-collapsible.27a1` | message | !(size) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageCollapsible.tsx:27` |
| `state.message.message-collapsible.27a0` | message | size | AttachmentSize | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageCollapsible.tsx:27` |
| `state.message.message-collapsible.29a1` | message | !(hasDownload && link) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageCollapsible.tsx:29` |
| `state.message.message-collapsible.29a0` | message | hasDownload && link | AttachmentDownload | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageCollapsible.tsx:29` |
| `state.message.message-content-body.21s` | message | Suspense fallback（子树未 ready） | Skeleton | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageContentBody.tsx:21` |
| `state.message.message-header.66a1` | message | !(showUsername) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageHeader.tsx:66` |
| `state.message.message-header.66a0` | message | showUsername | <> | 登录 → 打开有消息的房间；shot:room-general.png；用户名 | [实测] | （无） | `apps/meteor/client/components/message/MessageHeader.tsx:66` |
| `state.message.message-header.73a1` | message | !(shouldShowRolesList) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageHeader.tsx:73` |
| `state.message.message-header.73a0` | message | shouldShowRolesList | MessageRoles | 登录 → 打开有消息的房间；shot:room-general.png；Admin 角色 | [实测] | （无） | `apps/meteor/client/components/message/MessageHeader.tsx:73` |
| `state.message.message-header.77a1` | message | !(message.private) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageHeader.tsx:77` |
| `state.message.message-header.77a0` | message | message.private | MessageStatusPrivateIndicator | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageHeader.tsx:77` |
| `state.message.message-toolbar-holder.41a1` | message | !(showToolbar && depsQueryResult.isSuccess && depsQueryResult.data.room) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageToolbarHolder.tsx:41` |
| `state.message.message-toolbar-holder.41a0` | message | showToolbar && depsQueryResult.isSuccess && depsQueryResult.data.room | Suspense | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageToolbarHolder.tsx:41` |
| `state.message.message-toolbar-holder.42s` | message | Suspense fallback（子树未 ready） | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/MessageToolbarHolder.tsx:42` |
| `state.message.status-indicators.27a1` | message | !(translated) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:27` |
| `state.message.status-indicators.27a0` | message | translated | MessageStatusIndicatorItem | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:27` |
| `state.message.status-indicators.29a1` | message | !(following) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:29` |
| `state.message.status-indicators.29a0` | message | following | MessageStatusIndicatorItem | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:29` |
| `state.message.status-indicators.31a1` | message | !(message.sentByEmail) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:31` |
| `state.message.status-indicators.31a0` | message | message.sentByEmail | MessageStatusIndicatorItem | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:31` |
| `state.message.status-indicators.32a1` | message | !(isEditedMessage(message)) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:32` |
| `state.message.status-indicators.32a0` | message | isEditedMessage(message) | MessageStatusIndicatorItem | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:32` |
| `state.message.status-indicators.46a1` | message | !(message.pinned) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:46` |
| `state.message.status-indicators.46a0` | message | message.pinned | MessageStatusIndicatorItem | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:46` |
| `state.message.status-indicators.48a1` | message | !(isEncryptedMessage) | null | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:48` |
| `state.message.status-indicators.48a0` | message | isEncryptedMessage | MessageStatusIndicatorItem | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:48` |
| `state.message.status-indicators.50a1` | message | !(starred) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:50` |
| `state.message.status-indicators.50a0` | message | starred | MessageStatusIndicatorItem | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/StatusIndicators.tsx:50` |
| `state.message.location.12i` | message | !latitude ¦¦ !longitude | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/Location.tsx:12` |
| `state.message.location.16d` | message | 前述 if-ret 均不成立（default return） | MapView | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/Location.tsx:16` |
| `state.message.thread-metrics.54a1` | message | !(participants?.length > 0) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetrics.tsx:54` |
| `state.message.thread-metrics.54a0` | message | participants?.length > 0 | ThreadMetricsParticipants | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetrics.tsx:54` |
| `state.message.thread-metrics.57t1` | message | !(isSmall) | MessageMetricsItemLabel | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetrics.tsx:57` |
| `state.message.thread-metrics.57t0` | message | isSmall | MessageMetricsItemLabel | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetrics.tsx:57` |
| `state.message.thread-metrics-participants.25a1` | message | !(hideAvatar) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetricsParticipants.tsx:25` |
| `state.message.thread-metrics-participants.25a0` | message | hideAvatar | <> | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetricsParticipants.tsx:25` |
| `state.message.thread-metrics-participants.31a1` | message | !(!hideAvatar) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetricsParticipants.tsx:31` |
| `state.message.thread-metrics-participants.31a0` | message | !hideAvatar | <> | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetricsParticipants.tsx:31` |
| `state.message.thread-metrics-participants.40a1` | message | !(participantsLabel) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetricsParticipants.tsx:40` |
| `state.message.thread-metrics-participants.40a0` | message | participantsLabel | MessageMetricsItemLabel | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetricsParticipants.tsx:40` |
| `state.message.thread-metrics-unread-badge.32i` | message | !result | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetricsUnreadBadge.tsx:32` |
| `state.message.thread-metrics-unread-badge.36d` | message | 前述 if-ret 均不成立（default return） | Badge | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/ThreadMetricsUnreadBadge.tsx:36` |
| `state.message.url-previews.116i` | message | isMetaPreview(data, type) | MessageBlock | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/UrlPreviews.tsx:116` |
| `state.message.url-previews.123d` | message | 前述 if-ret 均不成立（default return） | MessageBlock | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/UrlPreviews.tsx:123` |
| `state.message.attachments-item.17i` | message | isFileAttachment(attachment) | FileAttachment | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/AttachmentsItem.tsx:17` |
| `state.message.attachments-item.21i` | message | isQuoteAttachment(attachment) | QuoteAttachment | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/AttachmentsItem.tsx:21` |
| `state.message.attachments-item.25d` | message | 前述 if-ret 均不成立（default return） | DefaultAttachment | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/AttachmentsItem.tsx:25` |
| `state.message.default-attachment.37a1` | message | !(attachment.pretext) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:37` |
| `state.message.default-attachment.37a0` | message | attachment.pretext | AttachmentText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:37` |
| `state.message.default-attachment.43a1` | message | !(attachment.author_name) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:43` |
| `state.message.default-attachment.43a0` | message | attachment.author_name | AttachmentAuthor | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:43` |
| `state.message.default-attachment.45a1` | message | !(attachment.author_icon) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:45` |
| `state.message.default-attachment.45a0` | message | attachment.author_icon | AttachmentAuthorAvatar | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:45` |
| `state.message.default-attachment.58a1` | message | !(attachment.title) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:58` |
| `state.message.default-attachment.58a0` | message | attachment.title | AttachmentRow | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:58` |
| `state.message.default-attachment.73a1` | message | !(!collapsed) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:73` |
| `state.message.default-attachment.73a0` | message | !collapsed | <> | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:73` |
| `state.message.default-attachment.75a1` | message | !(attachment.text) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:75` |
| `state.message.default-attachment.75a0` | message | attachment.text | AttachmentText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:75` |
| `state.message.default-attachment.79a1` | message | !(attachment.fields) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:79` |
| `state.message.default-attachment.79a0` | message | attachment.fields | FieldsAttachment | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:79` |
| `state.message.default-attachment.90t1` | message | !(title) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:90` |
| `state.message.default-attachment.90t0` | message | title | MarkdownText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:90` |
| `state.message.default-attachment.93t1` | message | !(value) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:93` |
| `state.message.default-attachment.93t0` | message | value | MarkdownText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:93` |
| `state.message.default-attachment.100a1` | message | !(attachment.image_url) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:100` |
| `state.message.default-attachment.100a0` | message | attachment.image_url | AttachmentImage | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:100` |
| `state.message.default-attachment.104a1` | message | !(isActionAttachment(attachment)) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:104` |
| `state.message.default-attachment.104a0` | message | isActionAttachment(attachment) | ActionAttachment | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:104` |
| `state.message.default-attachment.108a1` | message | !(attachment.thumb_url) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:108` |
| `state.message.default-attachment.108a0` | message | attachment.thumb_url | AttachmentThumb | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/DefaultAttachment.tsx:108` |
| `state.message.file-attachment.14i` | message | isFileImageAttachment(attachment) | ImageAttachment | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/FileAttachment.tsx:14` |
| `state.message.file-attachment.18i` | message | isFileAudioAttachment(attachment) | AudioAttachment | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/FileAttachment.tsx:18` |
| `state.message.file-attachment.22i` | message | isFileVideoAttachment(attachment) | VideoAttachment | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/FileAttachment.tsx:22` |
| `state.message.file-attachment.26d` | message | 前述 if-ret 均不成立（default return） | GenericFileAttachment | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/FileAttachment.tsx:26` |
| `state.message.quote-attachment.57a1` | message | !(displayAvatarPreference) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/QuoteAttachment.tsx:57` |
| `state.message.quote-attachment.57a0` | message | displayAvatarPreference | AttachmentAuthorAvatar | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/QuoteAttachment.tsx:57` |
| `state.message.quote-attachment.63a1` | message | !(attachment.ts) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/QuoteAttachment.tsx:63` |
| `state.message.quote-attachment.63a0` | message | attachment.ts | AttachmentAuthorTimestamp | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/QuoteAttachment.tsx:63` |
| `state.message.quote-attachment.66a1` | message | !(attachment.message_link) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/QuoteAttachment.tsx:66` |
| `state.message.quote-attachment.66a0` | message | attachment.message_link | AttachmentMessageLink | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/QuoteAttachment.tsx:66` |
| `state.message.quote-attachment.68a1` | message | !(attachment.attachments) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/QuoteAttachment.tsx:68` |
| `state.message.quote-attachment.68a0` | message | attachment.attachments | AttachmentInner | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/QuoteAttachment.tsx:68` |
| `state.message.action-attachtment.22i` | message | url | Button | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/default/ActionAttachtment.tsx:22` |
| `state.message.action-attachtment.29d` | message | 前述 if-ret 均不成立（default return） | ActionAttachmentButton | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/default/ActionAttachtment.tsx:29` |
| `state.message.fields-attachment.17t1` | message | !(field.short) | Field | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/default/FieldsAttachment.tsx:17` |
| `state.message.fields-attachment.17t0` | message | field.short | ShortField | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/default/FieldsAttachment.tsx:17` |
| `state.message.audio-attachment.61t1` | message | !(descriptionMd) | MarkdownText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/file/AudioAttachment.tsx:61` |
| `state.message.audio-attachment.61t0` | message | descriptionMd | MessageContentBody | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/file/AudioAttachment.tsx:61` |
| `state.message.generic-file-attachment.88t1` | message | !(descriptionMd) | MarkdownText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/file/GenericFileAttachment.tsx:88` |
| `state.message.generic-file-attachment.88t0` | message | descriptionMd | MessageContentBody | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/file/GenericFileAttachment.tsx:88` |
| `state.message.generic-file-attachment.97a1` | message | !(size) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/file/GenericFileAttachment.tsx:97` |
| `state.message.generic-file-attachment.97a0` | message | size | MessageGenericPreviewDescription | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/file/GenericFileAttachment.tsx:97` |
| `state.message.image-attachment.32t1` | message | !(descriptionMd) | MarkdownText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/file/ImageAttachment.tsx:32` |
| `state.message.image-attachment.32t0` | message | descriptionMd | MessageContentBody | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/file/ImageAttachment.tsx:32` |
| `state.message.video-attachment.29t1` | message | !(descriptionMd) | MarkdownText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/file/VideoAttachment.tsx:29` |
| `state.message.video-attachment.29t0` | message | descriptionMd | MessageContentBody | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/file/VideoAttachment.tsx:29` |
| `state.message.attachment-author-timestamp.7t1` | message | !(href) | Box | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/structure/AttachmentAuthorTimestamp.tsx:7` |
| `state.message.attachment-author-timestamp.7t0` | message | href | Box | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/structure/AttachmentAuthorTimestamp.tsx:7` |
| `state.message.attachment-download.12i` | message | isEncrypted | AttachmentEncryptedDownload | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/structure/AttachmentDownload.tsx:12` |
| `state.message.attachment-download.16d` | message | 前述 if-ret 均不成立（default return） | AttachmentDownloadBase | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/structure/AttachmentDownload.tsx:16` |
| `state.message.attachment-image.58i` | message | !loadImage | Load | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/structure/AttachmentImage.tsx:58` |
| `state.message.attachment-image.62i` | message | error | Retry | 登录 → 打开有消息的房间；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/structure/AttachmentImage.tsx:62` |
| `state.message.attachment-image.66d` | message | 前述 if-ret 均不成立（default return） | Box | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/attachments/structure/AttachmentImage.tsx:66` |
| `state.message.map-view.24i` | message | !imageUrl | MapViewFallback | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/location/MapView.tsx:24` |
| `state.message.map-view.28d` | message | 前述 if-ret 均不成立（default return） | MapViewImage | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/location/MapView.tsx:28` |
| `state.message.reaction-tooltip.78i` | message | isLoading | <> | 登录 → 打开有消息的房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/reactions/ReactionTooltip.tsx:78` |
| `state.message.reaction-tooltip.83a1` | message | !(usernames.length > 5) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/reactions/ReactionTooltip.tsx:83` |
| `state.message.reaction-tooltip.83a0` | message | usernames.length > 5 | Skeleton | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/reactions/ReactionTooltip.tsx:83` |
| `state.message.reaction-tooltip.84a1` | message | !(usernames.length > 8) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/reactions/ReactionTooltip.tsx:84` |
| `state.message.reaction-tooltip.84a0` | message | usernames.length > 8 | Skeleton | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/reactions/ReactionTooltip.tsx:84` |
| `state.message.reaction-tooltip.89d` | message | 前述 if-ret 均不成立（default return） | MarkdownText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/reactions/ReactionTooltip.tsx:89` |
| `state.message.oembed-html-preview.21a1` | message | !(dangerous) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedHtmlPreview.tsx:21` |
| `state.message.oembed-html-preview.21a0` | message | dangerous | Box | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedHtmlPreview.tsx:21` |
| `state.message.oembed-image-preview.8a1` | message | !(image?.url) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedImagePreview.tsx:8` |
| `state.message.oembed-image-preview.8a0` | message | image?.url | MessageGenericPreviewCoverImage | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedImagePreview.tsx:8` |
| `state.message.oembed-link-preview.9a1` | message | !(image?.url && url) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedLinkPreview.tsx:9` |
| `state.message.oembed-link-preview.9a0` | message | image?.url && url | ExternalLink | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedLinkPreview.tsx:9` |
| `state.message.oembed-preview-content.22a1` | message | !(title) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:22` |
| `state.message.oembed-preview-content.22a0` | message | title | MessageGenericPreviewTitle | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:22` |
| `state.message.oembed-preview-content.27a1` | message | !(description) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:27` |
| `state.message.oembed-preview-content.27a0` | message | description | MessageGenericPreviewDescription | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:27` |
| `state.message.oembed-preview-content.28a1` | message | !((showSiteName ¦¦ showAuthorName)) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:28` |
| `state.message.oembed-preview-content.28a0` | message | (showSiteName ¦¦ showAuthorName) | MessageGenericPreviewFooter | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:28` |
| `state.message.oembed-preview-content.31a1` | message | !(showSiteName) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:31` |
| `state.message.oembed-preview-content.31a0` | message | showSiteName | MarkdownText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:31` |
| `state.message.oembed-preview-content.32a1` | message | !(showFooterSeparator) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:32` |
| `state.message.oembed-preview-content.32a0` | message | showFooterSeparator | Box | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:32` |
| `state.message.oembed-preview-content.33a1` | message | !(showAuthorName) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:33` |
| `state.message.oembed-preview-content.33a0` | message | showAuthorName | MarkdownText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/OEmbedPreviewContent.tsx:33` |
| `state.message.url-preview.20a1` | message | !(!collapsed) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/UrlPreview.tsx:20` |
| `state.message.url-preview.20a0` | message | !collapsed | UrlPreviewResolver | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/content/urlPreviews/UrlPreview.tsx:20` |
| `state.message.message-roles.17a1` | message | !(isBot) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/header/MessageRoles.tsx:17` |
| `state.message.message-roles.17a0` | message | isBot | MessageRole | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/header/MessageRoles.tsx:17` |
| `state.message.message-toolbar-action-menu.92i` | message | data.length === 0 | null | 登录 → 打开有消息的房间；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/MessageToolbarActionMenu.tsx:92` |
| `state.message.message-toolbar-action-menu.146d` | message | 前述 if-ret 均不成立（default return） | GenericMenu | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/MessageToolbarActionMenu.tsx:146` |
| `state.message.message-toolbar-item.17i` | message | hiddenActions.includes(id) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/MessageToolbarItem.tsx:17` |
| `state.message.message-toolbar-item.21d` | message | 前述 if-ret 均不成立（default return） | FuselageMessageToolbarItem | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/MessageToolbarItem.tsx:21` |
| `state.message.message-toolbar-stars-action-menu.26i` | message | !starsAction.data?.length | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/MessageToolbarStarsActionMenu.tsx:26` |
| `state.message.message-toolbar-stars-action-menu.71d` | message | 前述 if-ret 均不成立（default return） | GenericMenu | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/MessageToolbarStarsActionMenu.tsx:71` |
| `state.message.direct-items.12a1` | message | !(!!subscription) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/items/DirectItems.tsx:12` |
| `state.message.direct-items.12a0` | message | !!subscription | JumpToMessageAction | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/items/DirectItems.tsx:12` |
| `state.message.quote-message-action.30i` | message | isFederationBlocked | null | 登录 → 打开有消息的房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/items/actions/QuoteMessageAction.tsx:30` |
| `state.message.quote-message-action.34i` | message | !chat ¦¦ !subscription | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/items/actions/QuoteMessageAction.tsx:34` |
| `state.message.quote-message-action.38d` | message | 前述 if-ret 均不成立（default return） | MessageToolbarItem | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/items/actions/QuoteMessageAction.tsx:38` |
| `state.message.reaction-message-action.57i` | message | !enabled | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/items/actions/ReactionMessageAction.tsx:57` |
| `state.message.reaction-message-action.69d` | message | 前述 if-ret 均不成立（default return） | <> | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/items/actions/ReactionMessageAction.tsx:69` |
| `state.message.reply-in-thread-message-action.25i` | message | !threadsEnabled ¦¦ isOmnichannelRoom(room) ¦¦ !subscription | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/items/actions/ReplyInThreadMessageAction.tsx:25` |
| `state.message.reply-in-thread-message-action.31i` | message | isFederationBlocked | null | 登录 → 打开有消息的房间；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/items/actions/ReplyInThreadMessageAction.tsx:31` |
| `state.message.reply-in-thread-message-action.35d` | message | 前述 if-ret 均不成立（default return） | MessageToolbarItem | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/toolbar/items/actions/ReplyInThreadMessageAction.tsx:35` |
| `state.message.room-message.124a1` | message | !(!sequential && message.u.username && !selecting && showUserAvatar) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:124` |
| `state.message.room-message.124a0` | message | !sequential && message.u.username && !selecting && showUserAvatar | MessageAvatar | 登录 → 打开有消息的房间；shot:room-general.png；消息头像 | [实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:124` |
| `state.message.room-message.136a1` | message | !(selecting) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:136` |
| `state.message.room-message.136a0` | message | selecting | CheckBox | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:136` |
| `state.message.room-message.137a1` | message | !(sequential) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:137` |
| `state.message.room-message.137a0` | message | sequential | StatusIndicators | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:137` |
| `state.message.room-message.140a1` | message | !(!sequential) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:140` |
| `state.message.room-message.140a0` | message | !sequential | MessageHeader | 登录 → 打开有消息的房间；shot:room-general.png；非 sequential MessageHeader | [实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:140` |
| `state.message.room-message.141t1` | message | !(ignored) | RoomMessageContent | 登录 → 打开有消息的房间；shot:room-general.png；非 ignored → RoomMessageContent | [实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:141` |
| `state.message.room-message.141t0` | message | ignored | IgnoredContent | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:141` |
| `state.message.room-message.147a1` | message | !(!message.private && message?.e2e !== 'pending' && !selecting) | null | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:147` |
| `state.message.room-message.147a0` | message | !message.private && message?.e2e !== 'pending' && !selecting | MessageToolbarHolder | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/RoomMessage.tsx:147` |
| `state.message.system-message.90a1` | message | !(!isSelecting && showUserAvatar) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:90` |
| `state.message.system-message.90a0` | message | !isSelecting && showUserAvatar | UserAvatar | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:90` |
| `state.message.system-message.91a1` | message | !(isSelecting) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:91` |
| `state.message.system-message.91a0` | message | isSelecting | CheckBox | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:91` |
| `state.message.system-message.97a1` | message | !(showUsername) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:97` |
| `state.message.system-message.97a0` | message | showUsername | <> | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:97` |
| `state.message.system-message.104a1` | message | !(messageType) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:104` |
| `state.message.system-message.104a0` | message | messageType | MessageSystemBody | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:104` |
| `state.message.system-message.111a1` | message | !(message.attachments) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:111` |
| `state.message.system-message.111a0` | message | message.attachments | MessageSystemBlock | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:111` |
| `state.message.system-message.116a1` | message | !(message.actionLinks?.length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:116` |
| `state.message.system-message.116a0` | message | message.actionLinks?.length | MessageActions | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/SystemMessage.tsx:116` |
| `state.message.thread-message.50a1` | message | !(!sequential && message.u.username && showUserAvatar) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessage.tsx:50` |
| `state.message.thread-message.50a0` | message | !sequential && message.u.username && showUserAvatar | MessageAvatar | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessage.tsx:50` |
| `state.message.thread-message.62a1` | message | !(sequential) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessage.tsx:62` |
| `state.message.thread-message.62a0` | message | sequential | StatusIndicators | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessage.tsx:62` |
| `state.message.thread-message.66a1` | message | !(!sequential) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessage.tsx:66` |
| `state.message.thread-message.66a0` | message | !sequential | MessageHeader | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessage.tsx:66` |
| `state.message.thread-message.68t1` | message | !(ignored) | ThreadMessageContent | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessage.tsx:68` |
| `state.message.thread-message.68t0` | message | ignored | IgnoredContent | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessage.tsx:68` |
| `state.message.thread-message.74a1` | message | !(!message.private) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessage.tsx:74` |
| `state.message.thread-message.74a0` | message | !message.private | MessageToolbarHolder | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessage.tsx:74` |
| `state.message.thread-message-preview.85a1` | message | !(!sequential) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:85` |
| `state.message.thread-message-preview.85a0` | message | !sequential | ThreadMessageRow | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:85` |
| `state.message.thread-message-preview.92a1` | message | !(parentMessage.isSuccess && !messageType) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:92` |
| `state.message.thread-message-preview.92a0` | message | parentMessage.isSuccess && !messageType | <> | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:92` |
| `state.message.thread-message-preview.99a1` | message | !(translated) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:99` |
| `state.message.thread-message-preview.99a0` | message | translated | <> | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:99` |
| `state.message.thread-message-preview.108a1` | message | !(parentMessage.isLoading) | null | 登录 → 打开有消息的房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:108` |
| `state.message.thread-message-preview.108a0` | message | parentMessage.isLoading | Skeleton | 登录 → 打开有消息的房间；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:108` |
| `state.message.thread-message-preview.116a1` | message | !(!isSelecting && showUserAvatar) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:116` |
| `state.message.thread-message-preview.116a0` | message | !isSelecting && showUserAvatar | MessageAvatar | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:116` |
| `state.message.thread-message-preview.123a1` | message | !(isSelecting) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:123` |
| `state.message.thread-message-preview.123a0` | message | isSelecting | CheckBox | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:123` |
| `state.message.thread-message-preview.132a1` | message | !(translated) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:132` |
| `state.message.thread-message-preview.132a0` | message | translated | <> | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/ThreadMessagePreview.tsx:132` |
| `state.message.room-message-content.54a1` | message | !(isMessageEncrypted) | null | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:54` |
| `state.message.room-message-content.54a0` | message | isMessageEncrypted | MessageBody | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:54` |
| `state.message.room-message-content.60a1` | message | !(!!quotes?.length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:60` |
| `state.message.room-message-content.60a0` | message | !!quotes?.length | Attachments | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:60` |
| `state.message.room-message-content.67a1` | message | !(!normalizedMessage.blocks?.length && !!normalizedMessage.md?.length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:67` |
| `state.message.room-message-content.67a0` | message | !normalizedMessage.blocks?.length && !!normalizedMessage.md?.length | <> | 登录 → 打开有消息的房间；shot:room-general.png；markdown 正文 | [实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:67` |
| `state.message.room-message-content.69a1` | message | !((!encrypted ¦¦ normalizedMessage.e2e === 'done')) | null | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:69` |
| `state.message.room-message-content.69a0` | message | (!encrypted ¦¦ normalizedMessage.e2e === 'done') | MessageContentBody | 登录 → 打开有消息的房间；房间加密开；shot:room-general.png；MessageContentBody | [实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:69` |
| `state.message.room-message-content.82a1` | message | !(!!attachments) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:82` |
| `state.message.room-message-content.82a0` | message | !!attachments | Attachments | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:82` |
| `state.message.room-message-content.90a1` | message | !(normalizedMessage.blocks) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:90` |
| `state.message.room-message-content.90a0` | message | normalizedMessage.blocks | UiKitMessageBlock | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:90` |
| `state.message.room-message-content.94a1` | message | !(oembedEnabled && !!normalizedMessage.urls?.length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:94` |
| `state.message.room-message-content.94a0` | message | oembedEnabled && !!normalizedMessage.urls?.length | UrlPreviews | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:94` |
| `state.message.room-message-content.96a1` | message | !(normalizedMessage.actionLinks?.length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:96` |
| `state.message.room-message-content.96a0` | message | normalizedMessage.actionLinks?.length | MessageActions | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:96` |
| `state.message.room-message-content.107a1` | message | !(normalizedMessage.reactions && Object.keys(normalizedMessage.reactions).length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:107` |
| `state.message.room-message-content.107a0` | message | normalizedMessage.reactions && Object.keys(normalizedMessage.reactions).length | Reactions | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:107` |
| `state.message.room-message-content.109a1` | message | !(chat && isThreadMainMessage(normalizedMessage)) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:109` |
| `state.message.room-message-content.109a0` | message | chat && isThreadMainMessage(normalizedMessage) | ThreadMetrics | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:109` |
| `state.message.room-message-content.123a1` | message | !(isDiscussionMessage(normalizedMessage)) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:123` |
| `state.message.room-message-content.123a0` | message | isDiscussionMessage(normalizedMessage) | DiscussionMetrics | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:123` |
| `state.message.room-message-content.132a1` | message | !(normalizedMessage.location) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:132` |
| `state.message.room-message-content.132a0` | message | normalizedMessage.location | Location | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:132` |
| `state.message.room-message-content.134a1` | message | !(broadcast && !!messageUser.username && normalizedMessage.u._id !== uid) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:134` |
| `state.message.room-message-content.134a0` | message | broadcast && !!messageUser.username && normalizedMessage.u._id !== uid | BroadcastMetrics | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:134` |
| `state.message.room-message-content.138a1` | message | !(readReceiptEnabled) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:138` |
| `state.message.room-message-content.138a0` | message | readReceiptEnabled | ReadReceiptIndicator | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/room/RoomMessageContent.tsx:138` |
| `state.message.thread-message-content.48a1` | message | !(isMessageEncrypted) | null | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:48` |
| `state.message.thread-message-content.48a0` | message | isMessageEncrypted | MessageBody | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:48` |
| `state.message.thread-message-content.54a1` | message | !(!!quotes?.length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:54` |
| `state.message.thread-message-content.54a0` | message | !!quotes?.length | Attachments | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:54` |
| `state.message.thread-message-content.61a1` | message | !(!normalizedMessage.blocks?.length && !!normalizedMessage.md?.length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:61` |
| `state.message.thread-message-content.61a0` | message | !normalizedMessage.blocks?.length && !!normalizedMessage.md?.length | <> | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:61` |
| `state.message.thread-message-content.63a1` | message | !((!encrypted ¦¦ normalizedMessage.e2e === 'done')) | null | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:63` |
| `state.message.thread-message-content.63a0` | message | (!encrypted ¦¦ normalizedMessage.e2e === 'done') | MessageContentBody | 登录 → 打开有消息的房间；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:63` |
| `state.message.thread-message-content.74a1` | message | !(normalizedMessage.blocks) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:74` |
| `state.message.thread-message-content.74a0` | message | normalizedMessage.blocks | UiKitMessageBlock | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:74` |
| `state.message.thread-message-content.78a1` | message | !(!!attachments) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:78` |
| `state.message.thread-message-content.78a0` | message | !!attachments | Attachments | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:78` |
| `state.message.thread-message-content.86a1` | message | !(oembedEnabled && !!normalizedMessage.urls?.length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:86` |
| `state.message.thread-message-content.86a0` | message | oembedEnabled && !!normalizedMessage.urls?.length | UrlPreviews | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:86` |
| `state.message.thread-message-content.88a1` | message | !(normalizedMessage.actionLinks?.length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:88` |
| `state.message.thread-message-content.88a0` | message | normalizedMessage.actionLinks?.length | MessageActions | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:88` |
| `state.message.thread-message-content.99a1` | message | !(normalizedMessage.reactions && Object.keys(normalizedMessage.reactions).length) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:99` |
| `state.message.thread-message-content.99a0` | message | normalizedMessage.reactions && Object.keys(normalizedMessage.reactions).length | Reactions | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:99` |
| `state.message.thread-message-content.101a1` | message | !(normalizedMessage.location) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:101` |
| `state.message.thread-message-content.101a0` | message | normalizedMessage.location | Location | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:101` |
| `state.message.thread-message-content.103a1` | message | !(broadcast && !!messageUser.username && normalizedMessage.u._id !== uid) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:103` |
| `state.message.thread-message-content.103a0` | message | broadcast && !!messageUser.username && normalizedMessage.u._id !== uid | BroadcastMetrics | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:103` |
| `state.message.thread-message-content.107a1` | message | !(readReceiptEnabled) | null | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:107` |
| `state.message.thread-message-content.107a0` | message | readReceiptEnabled | ReadReceiptIndicator | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/thread/ThreadMessageContent.tsx:107` |
| `state.message.thread-message-preview-body.32t1` | message | !(mdTokens?.length) | <> | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/threadPreview/ThreadMessagePreviewBody.tsx:32` |
| `state.message.thread-message-preview-body.32t0` | message | mdTokens?.length | GazzodownText | 登录 → 打开有消息的房间 | [待渲染实测] | （无） | `apps/meteor/client/components/message/variants/threadPreview/ThreadMessagePreviewBody.tsx:32` |

### composer（35）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.composer.audio-message-recorder.102i` | composer | isMicrophoneDenied | null | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/AudioMessageRecorder/AudioMessageRecorder.tsx:102` |
| `state.composer.audio-message-recorder.106d` | composer | 前述 if-ret 均不成立（default return） | Box | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/AudioMessageRecorder/AudioMessageRecorder.tsx:106` |
| `state.composer.audio-message-recorder.116a1` | composer | !(state === 'recording') | null | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/AudioMessageRecorder/AudioMessageRecorder.tsx:116` |
| `state.composer.audio-message-recorder.116a0` | composer | state === 'recording' | <> | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/AudioMessageRecorder/AudioMessageRecorder.tsx:116` |
| `state.composer.audio-message-recorder.128a1` | composer | !(state === 'loading') | null | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/AudioMessageRecorder/AudioMessageRecorder.tsx:128` |
| `state.composer.audio-message-recorder.128a0` | composer | state === 'loading' | Throbber | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/AudioMessageRecorder/AudioMessageRecorder.tsx:128` |
| `state.composer.emoji-category-row.31i` | composer | isRowDivider(item) | <> | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiCategoryRow.tsx:31` |
| `state.composer.emoji-category-row.41i` | composer | isLoadMore(item) | EmojiPickerLoadMore | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiCategoryRow.tsx:41` |
| `state.composer.emoji-category-row.45d` | composer | 前述 if-ret 均不成立（default return） | EmojiPickerCategoryWrapper | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiCategoryRow.tsx:45` |
| `state.composer.emoji-category-row.47a1` | composer | !(item.length === 0) | null | 登录 → 打开可发消息房间 composer；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiCategoryRow.tsx:47` |
| `state.composer.emoji-category-row.47a0` | composer | item.length === 0 | EmojiPickerNotFound | 登录 → 打开可发消息房间 composer；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiCategoryRow.tsx:47` |
| `state.composer.emoji-element.24i` | composer | !image | null | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiElement.tsx:24` |
| `state.composer.emoji-element.30d` | composer | 前述 if-ret 均不成立（default return） | IconButton | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiElement.tsx:30` |
| `state.composer.emoji-picker.219a1` | composer | !(searching) | null | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiPicker.tsx:219` |
| `state.composer.emoji-picker.219a0` | composer | searching | SearchingResult | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiPicker.tsx:219` |
| `state.composer.emoji-picker.220a1` | composer | !(!searching) | null | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiPicker.tsx:220` |
| `state.composer.emoji-picker.220a0` | composer | !searching | CategoriesResult | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiPicker.tsx:220` |
| `state.composer.emoji-picker.233a1` | composer | !(emojiToPreview) | null | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiPicker.tsx:233` |
| `state.composer.emoji-picker.233a0` | composer | emojiToPreview | EmojiPickerPreview | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiPicker.tsx:233` |
| `state.composer.emoji-picker.234a1` | composer | !(canManageEmoji && emojiToPreview === null) | null | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiPicker.tsx:234` |
| `state.composer.emoji-picker.234a0` | composer | canManageEmoji && emojiToPreview === null | Button | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/EmojiPicker.tsx:234` |
| `state.composer.searching-result.26i` | composer | searchResults.length === 0 | EmojiPickerNotFound | 登录 → 打开可发消息房间 composer；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/SearchingResult.tsx:26` |
| `state.composer.searching-result.30d` | composer | 前述 if-ret 均不成立（default return） | VirtualizedScrollbars | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/EmojiPicker/SearchingResult.tsx:30` |
| `state.composer.video-message-recorder.126a1` | composer | !(time) | null | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/VideoMessageRecorder/VideoMessageRecorder.tsx:126` |
| `state.composer.video-message-recorder.126a0` | composer | time | span | 登录 → 打开可发消息房间 composer | [待渲染实测] | （无） | `apps/meteor/client/views/composer/VideoMessageRecorder/VideoMessageRecorder.tsx:126` |
| `state.composer.message-composer-file.87t1` | composer | !(showPreview) | FilePreviewIcon | 登录 → 打开可发消息房间 | [待渲染实测] | （无） | `packages/ui-composer/src/MessageComposer/MessageComposerFile/MessageComposerFile.tsx:87` |
| `state.composer.message-composer-file.87t0` | composer | showPreview | Box | 登录 → 打开可发消息房间 | [待渲染实测] | （无） | `packages/ui-composer/src/MessageComposer/MessageComposerFile/MessageComposerFile.tsx:87` |
| `state.composer.message-composer-file.89t1` | composer | !(previewUrl) | Skeleton | 登录 → 打开可发消息房间 | [待渲染实测] | （无） | `packages/ui-composer/src/MessageComposer/MessageComposerFile/MessageComposerFile.tsx:89` |
| `state.composer.message-composer-file.89t0` | composer | previewUrl | Avatar | 登录 → 打开可发消息房间 | [待渲染实测] | （无） | `packages/ui-composer/src/MessageComposer/MessageComposerFile/MessageComposerFile.tsx:89` |
| `state.composer.message-composer-file.106a1` | composer | !(!disabled) | null | 登录 → 打开可发消息房间 | [待渲染实测] | （无） | `packages/ui-composer/src/MessageComposer/MessageComposerFile/MessageComposerFile.tsx:106` |
| `state.composer.message-composer-file.106a0` | composer | !disabled | Box | 登录 → 打开可发消息房间 | [待渲染实测] | （无） | `packages/ui-composer/src/MessageComposer/MessageComposerFile/MessageComposerFile.tsx:106` |
| `state.composer.message-composer-hint.14a1` | composer | !(helperText) | null | 登录 → 打开可发消息房间 | [待渲染实测] | （无） | `packages/ui-composer/src/MessageComposer/MessageComposerHint.tsx:14` |
| `state.composer.message-composer-hint.14a0` | composer | helperText | Box | 登录 → 打开可发消息房间 | [待渲染实测] | （无） | `packages/ui-composer/src/MessageComposer/MessageComposerHint.tsx:14` |
| `state.composer.message-composer-input-expandable.31a1` | composer | !(dimensions.blockSize > 100) | null | 登录 → 打开可发消息房间 | [待渲染实测] | （无） | `packages/ui-composer/src/MessageComposer/MessageComposerInputExpandable.tsx:31` |
| `state.composer.message-composer-input-expandable.31a0` | composer | dimensions.blockSize > 100 | Box | 登录 → 打开可发消息房间 | [待渲染实测] | （无） | `packages/ui-composer/src/MessageComposer/MessageComposerInputExpandable.tsx:31` |

### account（129）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.account.account-router.28t1` | account | !(children) | PageSkeleton | 登录 → `/account` | [待渲染实测] | （无） | `apps/meteor/client/views/account/AccountRouter.tsx:28` |
| `state.account.account-router.28t0` | account | children | Suspense | 登录 → `/account`；shot:account-profile.png；Account children + SidebarPortal | [实测] | （无） | `apps/meteor/client/views/account/AccountRouter.tsx:28` |
| `state.account.account-router.30s` | account | Suspense fallback（子树未 ready） | PageSkeleton | 登录 → `/account` | [待渲染实测] | （无） | `apps/meteor/client/views/account/AccountRouter.tsx:30` |
| `state.account.accessibility-page.192a1` | account | !(displayRolesEnabled) | null | 登录 → `/account/accessibility-and-appearance` | [待渲染实测] | （无） | `apps/meteor/client/views/account/accessibility/AccessibilityPage.tsx:192` |
| `state.account.accessibility-page.192a0` | account | displayRolesEnabled | Field | 登录 → `/account/accessibility-and-appearance` | [待渲染实测] | （无） | `apps/meteor/client/views/account/accessibility/AccessibilityPage.tsx:192` |
| `state.account.device-management-account-row.31a1` | account | !(deviceName) | null | 登录 → `/account` | [待渲染实测] | （无） | `apps/meteor/client/views/account/deviceManagement/DeviceManagementAccountTable/DeviceManagementAccountRow.tsx:31` |
| `state.account.device-management-account-row.31a0` | account | deviceName | Box | 登录 → `/account` | [待渲染实测] | （无） | `apps/meteor/client/views/account/deviceManagement/DeviceManagementAccountTable/DeviceManagementAccountRow.tsx:31` |
| `state.account.device-management-account-row.41a1` | account | !(mediaQuery) | null | 登录 → `/account` | [待渲染实测] | （无） | `apps/meteor/client/views/account/deviceManagement/DeviceManagementAccountTable/DeviceManagementAccountRow.tsx:41` |
| `state.account.device-management-account-row.41a0` | account | mediaQuery | GenericTableCell | 登录 → `/account` | [待渲染实测] | （无） | `apps/meteor/client/views/account/deviceManagement/DeviceManagementAccountTable/DeviceManagementAccountRow.tsx:41` |
| `state.account.device-management-account-table.51a1` | account | !(mediaQuery) | null | 登录 → `/account` | [待渲染实测] | （无） | `apps/meteor/client/views/account/deviceManagement/DeviceManagementAccountTable/DeviceManagementAccountTable.tsx:51` |
| `state.account.device-management-account-table.51a0` | account | mediaQuery | GenericTableHeaderCell | 登录 → `/account` | [待渲染实测] | （无） | `apps/meteor/client/views/account/deviceManagement/DeviceManagementAccountTable/DeviceManagementAccountTable.tsx:51` |
| `state.account.account-feature-preview-page.82a1` | account | !(featuresPreview.length === 0) | null | 登录 → `/account/feature-preview`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/account/featurePreview/AccountFeaturePreviewPage.tsx:82` |
| `state.account.account-feature-preview-page.82a0` | account | featuresPreview.length === 0 | States | 登录 → `/account/feature-preview`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/account/featurePreview/AccountFeaturePreviewPage.tsx:82` |
| `state.account.account-feature-preview-page.88a1` | account | !(featuresPreview.length > 0) | null | 登录 → `/account/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/account/featurePreview/AccountFeaturePreviewPage.tsx:88` |
| `state.account.account-feature-preview-page.88a0` | account | featuresPreview.length > 0 | <> | 登录 → `/account/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/account/featurePreview/AccountFeaturePreviewPage.tsx:88` |
| `state.account.account-feature-preview-page.113a1` | account | !(feature.description) | null | 登录 → `/account/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/account/featurePreview/AccountFeaturePreviewPage.tsx:113` |
| `state.account.account-feature-preview-page.113a0` | account | feature.description | FieldHint | 登录 → `/account/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/account/featurePreview/AccountFeaturePreviewPage.tsx:113` |
| `state.account.account-feature-preview-page.115a1` | account | !(feature.imageUrl) | null | 登录 → `/account/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/account/featurePreview/AccountFeaturePreviewPage.tsx:115` |
| `state.account.account-feature-preview-page.115a0` | account | feature.imageUrl | Box | 登录 → `/account/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/account/featurePreview/AccountFeaturePreviewPage.tsx:115` |
| `state.account.account-integrations-page.62a1` | account | !(errors?.accountSelected) | null | 登录 → `/account/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/integrations/AccountIntegrationsPage.tsx:62` |
| `state.account.account-integrations-page.62a0` | account | errors?.accountSelected | FieldError | 登录 → `/account/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/integrations/AccountIntegrationsPage.tsx:62` |
| `state.account.account-integrations-route.9i` | account | !webdavEnabled | NotAuthorizedPage | 登录 → `/account/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/account/integrations/AccountIntegrationsRoute.tsx:9` |
| `state.account.account-integrations-route.13d` | account | 前述 if-ret 均不成立（default return） | AccountIntegrationsPage | 登录 → `/account/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/account/integrations/AccountIntegrationsRoute.tsx:13` |
| `state.account.preferences-conversation-transcript.26a1` | account | !(!hasLicense) | null | 登录 omni 代理 → `/account/omnichannel`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/account/omnichannel/PreferencesConversationTranscript.tsx:26` |
| `state.account.preferences-conversation-transcript.26a0` | account | !hasLicense | Tag | 登录 omni 代理 → `/account/omnichannel`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/account/omnichannel/PreferencesConversationTranscript.tsx:26` |
| `state.account.preferences-conversation-transcript.31a1` | account | !(!canSendTranscriptPDF && hasLicense) | null | 登录 omni 代理 → `/account/omnichannel`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/account/omnichannel/PreferencesConversationTranscript.tsx:31` |
| `state.account.preferences-conversation-transcript.31a0` | account | !canSendTranscriptPDF && hasLicense | Tag | 登录 omni 代理 → `/account/omnichannel`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/account/omnichannel/PreferencesConversationTranscript.tsx:31` |
| `state.account.preferences-conversation-transcript.45a1` | account | !(!canSendTranscriptEmailPermission) | null | 登录 omni 代理 → `/account/omnichannel`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/account/omnichannel/PreferencesConversationTranscript.tsx:45` |
| `state.account.preferences-conversation-transcript.45a0` | account | !canSendTranscriptEmailPermission | Tag | 登录 omni 代理 → `/account/omnichannel`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/account/omnichannel/PreferencesConversationTranscript.tsx:45` |
| `state.account.account-preferences-page.88a1` | account | !(dataDownloadEnabled) | null | 登录 → `/account/preferences` | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/AccountPreferencesPage.tsx:88` |
| `state.account.account-preferences-page.88a0` | account | dataDownloadEnabled | PreferencesMyDataSection | 登录 → `/account/preferences`；shot:account-preferences.png；My Data 手风琴 | [实测] | （无） | `apps/meteor/client/views/account/preferences/AccountPreferencesPage.tsx:88` |
| `state.account.my-data-modal.32a1` | account | !(text) | null | 登录 → `/account/preferences` | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/MyDataModal.tsx:32` |
| `state.account.my-data-modal.32a0` | account | text | ModalContent | 登录 → `/account/preferences` | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/MyDataModal.tsx:32` |
| `state.account.preferences-notifications-section.103a1` | account | !(notificationsPermission === 'granted') | null | 登录 → `/account/preferences`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:103` |
| `state.account.preferences-notifications-section.103a0` | account | notificationsPermission === 'granted' | Button | 登录 → `/account/preferences`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:103` |
| `state.account.preferences-notifications-section.108a1` | account | !(notificationsPermission !== 'denied' && notificationsPermission !== 'granted') | null | 登录 → `/account/preferences`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:108` |
| `state.account.preferences-notifications-section.108a0` | account | notificationsPermission !== 'denied' && notificationsPermission !== 'granted' | Button | 登录 → `/account/preferences`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:108` |
| `state.account.preferences-notifications-section.170a1` | account | !(showNewLoginEmailPreference) | null | 登录 → `/account/preferences` | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:170` |
| `state.account.preferences-notifications-section.170a0` | account | showNewLoginEmailPreference | Field | 登录 → `/account/preferences` | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:170` |
| `state.account.preferences-notifications-section.183a1` | account | !(showCalendarPreference) | null | 登录 → `/account/preferences` | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:183` |
| `state.account.preferences-notifications-section.183a0` | account | showCalendarPreference | Field | 登录 → `/account/preferences` | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:183` |
| `state.account.preferences-notifications-section.195a1` | account | !(showMobileRinging) | null | 登录 → `/account/preferences` | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:195` |
| `state.account.preferences-notifications-section.195a0` | account | showMobileRinging | Field | 登录 → `/account/preferences` | [待渲染实测] | （无） | `apps/meteor/client/views/account/preferences/PreferencesNotificationsSection.tsx:195` |
| `state.account.account-profile-form.219a1` | account | !(errors.name) | null | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:219` |
| `state.account.account-profile-form.219a0` | account | errors.name | FieldError | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:219` |
| `state.account.account-profile-form.220a1` | account | !(!allowRealNameChange) | null | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:220` |
| `state.account.account-profile-form.220a0` | account | !allowRealNameChange | FieldHint | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:220` |
| `state.account.account-profile-form.243a1` | account | !(errors.username) | null | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:243` |
| `state.account.account-profile-form.243a0` | account | errors.username | FieldError | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:243` |
| `state.account.account-profile-form.244a1` | account | !(!canChangeUsername) | null | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:244` |
| `state.account.account-profile-form.244a0` | account | !canChangeUsername | FieldHint | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:244` |
| `state.account.account-profile-form.278a1` | account | !(errors.statusText) | null | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:278` |
| `state.account.account-profile-form.278a0` | account | errors.statusText | FieldError | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:278` |
| `state.account.account-profile-form.279a1` | account | !(!allowUserStatusMessageChange) | null | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:279` |
| `state.account.account-profile-form.279a0` | account | !allowUserStatusMessageChange | FieldHint | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:279` |
| `state.account.account-profile-form.280a1` | account | !(allowUserStatusMessageChange) | null | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:280` |
| `state.account.account-profile-form.280a0` | account | allowUserStatusMessageChange | FieldHint | 登录 → `/account/profile`；shot:account-profile.png；You can use emoji FieldHint | [实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:280` |
| `state.account.account-profile-form.303a1` | account | !(statusDuration === 'custom') | null | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:303` |
| `state.account.account-profile-form.303a0` | account | statusDuration === 'custom' | Box | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:303` |
| `state.account.account-profile-form.338a1` | account | !(errors.statusDuration) | null | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:338` |
| `state.account.account-profile-form.338a0` | account | errors.statusDuration | FieldError | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:338` |
| `state.account.account-profile-form.372a1` | account | !(errors.bio) | null | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:372` |
| `state.account.account-profile-form.372a0` | account | errors.bio | FieldError | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:372` |
| `state.account.account-profile-form.403a1` | account | !(!isUserVerified) | null | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:403` |
| `state.account.account-profile-form.403a0` | account | !isUserVerified | Button | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:403` |
| `state.account.account-profile-form.409a1` | account | !(errors.email) | null | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:409` |
| `state.account.account-profile-form.409a0` | account | errors.email | FieldError | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:409` |
| `state.account.account-profile-form.410a1` | account | !(!allowEmailChange) | null | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:410` |
| `state.account.account-profile-form.410a0` | account | !allowEmailChange | FieldHint | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:410` |
| `state.account.account-profile-form.412a1` | account | !(customFieldsMetadata) | null | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:412` |
| `state.account.account-profile-form.412a0` | account | customFieldsMetadata | CustomFieldsForm | 登录 → `/account/profile`；shot:account-profile.png；Custom Fields 组 | [实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileForm.tsx:412` |
| `state.account.account-profile-page.131a1` | account | !(allowDeleteOwnAccount) | null | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfilePage.tsx:131` |
| `state.account.account-profile-page.131a0` | account | allowDeleteOwnAccount | Button | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfilePage.tsx:131` |
| `state.account.account-profile-route.9i` | account | !canViewProfile | NotAuthorizedPage | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileRoute.tsx:9` |
| `state.account.account-profile-route.13d` | account | 前述 if-ret 均不成立（default return） | AccountProfilePage | 登录 → `/account/profile`；shot:account-profile.png；/account/profile | [实测] | （无） | `apps/meteor/client/views/account/profile/AccountProfileRoute.tsx:13` |
| `state.account.action-confirm-modal.57t1` | account | !(isPassword) | TextInput | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/ActionConfirmModal.tsx:57` |
| `state.account.action-confirm-modal.57t0` | account | isPassword | PasswordInput | 登录 → `/account/profile` | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/ActionConfirmModal.tsx:57` |
| `state.account.action-confirm-modal.80a1` | account | !(errors.credential) | null | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/ActionConfirmModal.tsx:80` |
| `state.account.action-confirm-modal.80a0` | account | errors.credential | FieldError | 登录 → `/account/profile`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/profile/ActionConfirmModal.tsx:80` |
| `state.account.account-security-page.48a1` | account | !(allowPasswordChange) | null | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:48` |
| `state.account.account-security-page.48a0` | account | allowPasswordChange | FormProvider | 登录 → `/account/security`；shot:account-security.png；允许改密 → Password 表单 | [实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:48` |
| `state.account.account-security-page.58a1` | account | !((twoFactorTOTP ¦¦ showEmailTwoFactor) && twoFactorEnabled) | null | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:58` |
| `state.account.account-security-page.58a0` | account | (twoFactorTOTP ¦¦ showEmailTwoFactor) && twoFactorEnabled | AccordionItem | 登录 → `/account/security`；shot:account-security.png；2FA AccordionItem | [实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:58` |
| `state.account.account-security-page.60a1` | account | !(require2faSetup) | null | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:60` |
| `state.account.account-security-page.60a0` | account | require2faSetup | Callout | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:60` |
| `state.account.account-security-page.65a1` | account | !(twoFactorTOTP) | null | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:65` |
| `state.account.account-security-page.65a0` | account | twoFactorTOTP | TwoFactorTOTP | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:65` |
| `state.account.account-security-page.66a1` | account | !(showEmailTwoFactor) | null | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:66` |
| `state.account.account-security-page.66a0` | account | showEmailTwoFactor | TwoFactorEmail | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:66` |
| `state.account.account-security-page.69a1` | account | !(e2eEnabled) | null | 登录 → `/account/security`；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:69` |
| `state.account.account-security-page.69a0` | account | e2eEnabled | AccordionItem | 登录 → `/account/security`；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityPage.tsx:69` |
| `state.account.account-security-route.13i` | account | !canViewSecurity | NotAuthorizedPage | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityRoute.tsx:13` |
| `state.account.account-security-route.17d` | account | 前述 if-ret 均不成立（default return） | AccountSecurityPage | 登录 → `/account/security`；shot:account-security.png；/account/security | [实测] | （无） | `apps/meteor/client/views/account/security/AccountSecurityRoute.tsx:17` |
| `state.account.change-passphrase.137a1` | account | !(errors.passphrase) | null | 登录 → `/account/security`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassphrase.tsx:137` |
| `state.account.change-passphrase.137a0` | account | errors.passphrase | FieldError | 登录 → `/account/security`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassphrase.tsx:137` |
| `state.account.change-passphrase.142t1` | account | !(keysExist) | FieldHint | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassphrase.tsx:142` |
| `state.account.change-passphrase.142t0` | account | keysExist | PasswordVerifierList | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassphrase.tsx:142` |
| `state.account.change-passphrase.162a1` | account | !(valid) | null | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassphrase.tsx:162` |
| `state.account.change-passphrase.162a0` | account | valid | Field | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassphrase.tsx:162` |
| `state.account.change-passphrase.187a1` | account | !(errors.confirmationPassphrase) | null | 登录 → `/account/security`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassphrase.tsx:187` |
| `state.account.change-passphrase.187a0` | account | errors.confirmationPassphrase | FieldError | 登录 → `/account/security`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassphrase.tsx:187` |
| `state.account.change-password.90a1` | account | !(!allowPasswordChange) | null | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassword.tsx:90` |
| `state.account.change-password.90a0` | account | !allowPasswordChange | FieldHint | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassword.tsx:90` |
| `state.account.change-password.91a1` | account | !(errors?.password) | null | 登录 → `/account/security`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassword.tsx:91` |
| `state.account.change-password.91a0` | account | errors?.password | FieldError | 登录 → `/account/security`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassword.tsx:91` |
| `state.account.change-password.96a1` | account | !(allowPasswordChange) | null | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassword.tsx:96` |
| `state.account.change-password.96a0` | account | allowPasswordChange | PasswordVerifier | 登录 → `/account/security`；shot:account-security.png；PasswordVerifier 规则列表 | [实测] | （无） | `apps/meteor/client/views/account/security/ChangePassword.tsx:96` |
| `state.account.change-password.122a1` | account | !(errors.confirmationPassword) | null | 登录 → `/account/security`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassword.tsx:122` |
| `state.account.change-password.122a0` | account | errors.confirmationPassword | FieldError | 登录 → `/account/security`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/ChangePassword.tsx:122` |
| `state.account.two-factor-totp.156a1` | account | !(!totpEnabled && registeringTotp) | null | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:156` |
| `state.account.two-factor-totp.156a0` | account | !totpEnabled && registeringTotp | <> | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:156` |
| `state.account.two-factor-totp.173a1` | account | !(totpEnabled) | null | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:173` |
| `state.account.two-factor-totp.173a0` | account | totpEnabled | <> | 登录 → `/account/security` | [待渲染实测] | （无） | `apps/meteor/client/views/account/security/TwoFactorTOTP.tsx:173` |
| `state.account.account-tokens-route.9i` | account | !canCreateTokens | NotAuthorizedPage | 登录 → `/account/tokens` | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensRoute.tsx:9` |
| `state.account.account-tokens-route.13d` | account | 前述 if-ret 均不成立（default return） | AccountTokensPage | 登录 → `/account/tokens` | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensRoute.tsx:13` |
| `state.account.account-tokens-row.26a1` | account | !(isMedium) | null | 登录 → `/account/tokens` | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensRow.tsx:26` |
| `state.account.account-tokens-row.26a0` | account | isMedium | GenericTableCell | 登录 → `/account/tokens` | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensRow.tsx:26` |
| `state.account.account-tokens-table.58a1` | account | !(isMedium) | null | 登录 → `/account/tokens` | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:58` |
| `state.account.account-tokens-table.58a0` | account | isMedium | GenericTableHeaderCell | 登录 → `/account/tokens` | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:58` |
| `state.account.account-tokens-table.125i` | account | isError | Box | 登录 → `/account/tokens`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:125` |
| `state.account.account-tokens-table.143d` | account | 前述 if-ret 均不成立（default return） | <> | 登录 → `/account/tokens` | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:143` |
| `state.account.account-tokens-table.146a1` | account | !(isPending) | null | 登录 → `/account/tokens`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:146` |
| `state.account.account-tokens-table.146a0` | account | isPending | GenericTable | 登录 → `/account/tokens`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:146` |
| `state.account.account-tokens-table.154a1` | account | !(filteredTokens && filteredTokens?.length > 0 && isSuccess) | null | 登录 → `/account/tokens` | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:154` |
| `state.account.account-tokens-table.154a0` | account | filteredTokens && filteredTokens?.length > 0 && isSuccess | <> | 登录 → `/account/tokens` | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:154` |
| `state.account.account-tokens-table.183a1` | account | !(isSuccess && filteredTokens?.length === 0) | null | 登录 → `/account/tokens`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:183` |
| `state.account.account-tokens-table.183a0` | account | isSuccess && filteredTokens?.length === 0 | GenericNoResults | 登录 → `/account/tokens`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AccountTokensTable.tsx:183` |
| `state.account.add-token.99a1` | account | !(errors?.name) | null | 登录 → `/account/tokens`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AddToken.tsx:99` |
| `state.account.add-token.99a0` | account | errors?.name | FieldError | 登录 → `/account/tokens`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/account/tokens/AccountTokensTable/AddToken.tsx:99` |

### admin（1067）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.admin.attributes-contextual-bar-with-data.21i` | admin | isLoading ¦¦ isFetching | ContextualbarSkeletonBody | 登录 admin + ABAC 许可 → `/admin/ABAC`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesContextualBarWithData.tsx:21` |
| `state.admin.attributes-contextual-bar-with-data.25d` | admin | 前述 if-ret 均不成立（default return） | AttributesContextualBar | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesContextualBarWithData.tsx:25` |
| `state.admin.attributes-form.110a1` | admin | !(errors.name) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:110` |
| `state.admin.attributes-form.110a0` | admin | errors.name | FieldError | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:110` |
| `state.admin.attributes-form.135a1` | admin | !(index !== 0) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:135` |
| `state.admin.attributes-form.135a0` | admin | index !== 0 | IconButton | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:135` |
| `state.admin.attributes-form.145a1` | admin | !(errors.lockedAttributes?.[index]?.value) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:145` |
| `state.admin.attributes-form.145a0` | admin | errors.lockedAttributes?.[index]?.value | FieldError | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:145` |
| `state.admin.attributes-form.150a1` | admin | !(showDisclaimer.includes(index)) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:150` |
| `state.admin.attributes-form.150a0` | admin | showDisclaimer.includes(index) | FieldError | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:150` |
| `state.admin.attributes-form.186a1` | admin | !((index !== 0 ¦¦ lockedAttributesFields.length > 0)) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:186` |
| `state.admin.attributes-form.186a0` | admin | (index !== 0 ¦¦ lockedAttributesFields.length > 0) | IconButton | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:186` |
| `state.admin.attributes-form.190a1` | admin | !(errors.attributeValues?.[index]?.value) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:190` |
| `state.admin.attributes-form.190a0` | admin | errors.attributeValues?.[index]?.value | FieldError | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesForm.tsx:190` |
| `state.admin.attributes-page.73t1` | admin | !((!data ¦¦ data.attributes?.length === 0) && !isLoading) | GenericTable | 登录 admin + ABAC 许可 → `/admin/ABAC`；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesPage.tsx:73` |
| `state.admin.attributes-page.73t0` | admin | (!data ¦¦ data.attributes?.length === 0) && !isLoading | Box | 登录 admin + ABAC 许可 → `/admin/ABAC`；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACAttributesTab/AttributesPage.tsx:73` |
| `state.admin.logs-page.164t1` | admin | !((!data ¦¦ data.events?.length === 0) && !isLoading) | GenericTable | 登录 admin + ABAC 许可 → `/admin/ABAC`；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACLogsTab/LogsPage.tsx:164` |
| `state.admin.logs-page.164t0` | admin | (!data ¦¦ data.events?.length === 0) && !isLoading | Box | 登录 admin + ABAC 许可 → `/admin/ABAC`；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACLogsTab/LogsPage.tsx:164` |
| `state.admin.logs-page.181i` | admin | !eventInfo | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACLogsTab/LogsPage.tsx:181` |
| `state.admin.logs-page.184d` | admin | 前述 if-ret 均不成立（default return） | GenericTableRow | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACLogsTab/LogsPage.tsx:184` |
| `state.admin.logs-page.187a1` | admin | !(eventInfo.userAvatar) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACLogsTab/LogsPage.tsx:187` |
| `state.admin.logs-page.187a0` | admin | eventInfo.userAvatar | Box | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACLogsTab/LogsPage.tsx:187` |
| `state.admin.room-form.84t1` | admin | !(roomInfo) | Controller | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomForm.tsx:84` |
| `state.admin.room-form.84t0` | admin | roomInfo | RoomFormAutocompleteDummy | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomForm.tsx:84` |
| `state.admin.room-form.108a1` | admin | !(errors.room) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomForm.tsx:108` |
| `state.admin.room-form.108a0` | admin | errors.room | FieldError | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomForm.tsx:108` |
| `state.admin.room-form.114a1` | admin | !(redacted) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomForm.tsx:114` |
| `state.admin.room-form.114a0` | admin | redacted | Box | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomForm.tsx:114` |
| `state.admin.room-form-attribute-field.89a1` | admin | !(keyFieldState.error) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAttributeField.tsx:89` |
| `state.admin.room-form-attribute-field.89a0` | admin | keyFieldState.error | FieldError | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAttributeField.tsx:89` |
| `state.admin.room-form-attribute-field.109a1` | admin | !(valuesFieldState.error) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAttributeField.tsx:109` |
| `state.admin.room-form-attribute-field.109a0` | admin | valuesFieldState.error | FieldError | 登录 admin + ABAC 许可 → `/admin/ABAC`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAttributeField.tsx:109` |
| `state.admin.room-form-attribute-field.114a1` | admin | !(index !== 0) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAttributeField.tsx:114` |
| `state.admin.room-form-attribute-field.114a0` | admin | index !== 0 | Button | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAttributeField.tsx:114` |
| `state.admin.room-form-attribute-fields.20i` | admin | isLoading ¦¦ !attributeList | InputBoxSkeleton | 登录 admin + ABAC 许可 → `/admin/ABAC`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAttributeFields.tsx:20` |
| `state.admin.room-form-attribute-fields.24d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAttributeFields.tsx:24` |
| `state.admin.room-form-attribute-fields.26a1` | admin | !(isExternalAttributeStore) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAttributeFields.tsx:26` |
| `state.admin.room-form-attribute-fields.26a0` | admin | isExternalAttributeStore | Box | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomFormAttributeFields.tsx:26` |
| `state.admin.rooms-contextual-bar-with-data.21i` | admin | isLoading ¦¦ isFetching | ContextualbarSkeletonBody | 登录 admin + ABAC 许可 → `/admin/ABAC`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomsContextualBarWithData.tsx:21` |
| `state.admin.rooms-contextual-bar-with-data.27d` | admin | 前述 if-ret 均不成立（default return） | RoomsContextualBar | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomsContextualBarWithData.tsx:27` |
| `state.admin.rooms-page.97t1` | admin | !((!data ¦¦ data.rooms?.length === 0) && !isLoading) | GenericTable | 登录 admin + ABAC 许可 → `/admin/ABAC`；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomsPage.tsx:97` |
| `state.admin.rooms-page.97t0` | admin | (!data ¦¦ data.rooms?.length === 0) && !isLoading | Box | 登录 admin + ABAC 许可 → `/admin/ABAC`；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACRoomsTab/RoomsPage.tsx:97` |
| `state.admin.abac-enabled-toggle.73i` | admin | !setting | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACSettingTab/AbacEnabledToggle.tsx:73` |
| `state.admin.abac-enabled-toggle.77i` | admin | hasABAC === 'loading' | SettingSkeleton | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACSettingTab/AbacEnabledToggle.tsx:77` |
| `state.admin.abac-enabled-toggle.81d` | admin | 前述 if-ret 均不成立（default return） | MemoizedSetting | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACSettingTab/AbacEnabledToggle.tsx:81` |
| `state.admin.setting-field.108a1` | admin | !(alert) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACSettingTab/SettingField.tsx:108` |
| `state.admin.setting-field.108a0` | admin | alert | span | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACSettingTab/SettingField.tsx:108` |
| `state.admin.settings-page.21a1` | admin | !(pdpType !== 'local') | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACSettingTab/SettingsPage.tsx:21` |
| `state.admin.settings-page.21a0` | admin | pdpType !== 'local' | SettingField | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACSettingTab/SettingsPage.tsx:21` |
| `state.admin.settings-page.25a1` | admin | !(pdpType === 'local') | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACSettingTab/SettingsPage.tsx:25` |
| `state.admin.settings-page.25a0` | admin | pdpType === 'local' | Callout | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/ABACSettingTab/SettingsPage.tsx:25` |
| `state.admin.admin-abacpage.71a1` | admin | !(shouldShowWarning) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:71` |
| `state.admin.admin-abacpage.71a0` | admin | shouldShowWarning | Box | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:71` |
| `state.admin.admin-abacpage.89a1` | admin | !(tab === 'settings' && tabPermissions.settings) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:89` |
| `state.admin.admin-abacpage.89a0` | admin | tab === 'settings' && tabPermissions.settings | SettingsPage | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:89` |
| `state.admin.admin-abacpage.90a1` | admin | !(tab === 'room-attributes' && tabPermissions['room-attributes']) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:90` |
| `state.admin.admin-abacpage.90a0` | admin | tab === 'room-attributes' && tabPermissions['room-attributes'] | AttributesPage | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:90` |
| `state.admin.admin-abacpage.91a1` | admin | !(tab === 'rooms' && tabPermissions.rooms) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:91` |
| `state.admin.admin-abacpage.91a0` | admin | tab === 'rooms' && tabPermissions.rooms | RoomsPage | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:91` |
| `state.admin.admin-abacpage.92a1` | admin | !(tab === 'logs' && tabPermissions.logs) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:92` |
| `state.admin.admin-abacpage.92a0` | admin | tab === 'logs' && tabPermissions.logs | LogsPage | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:92` |
| `state.admin.admin-abacpage.95a1` | admin | !(isABACAvailable === true && tab !== undefined && context !== undefined) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:95` |
| `state.admin.admin-abacpage.95a0` | admin | isABACAvailable === true && tab !== undefined && context !== undefined | ContextualbarDialog | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:95` |
| `state.admin.admin-abacpage.97a1` | admin | !(tab === 'room-attributes' && tabPermissions['room-attributes']) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:97` |
| `state.admin.admin-abacpage.97a0` | admin | tab === 'room-attributes' && tabPermissions['room-attributes'] | <> | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:97` |
| `state.admin.admin-abacpage.99a1` | admin | !(context === 'new') | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:99` |
| `state.admin.admin-abacpage.99a0` | admin | context === 'new' | AttributesContextualBar | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:99` |
| `state.admin.admin-abacpage.100a1` | admin | !(context === 'edit' && _id) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:100` |
| `state.admin.admin-abacpage.100a0` | admin | context === 'edit' && _id | AttributesContextualBarWithData | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:100` |
| `state.admin.admin-abacpage.103a1` | admin | !(tab === 'rooms' && tabPermissions.rooms) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:103` |
| `state.admin.admin-abacpage.103a0` | admin | tab === 'rooms' && tabPermissions.rooms | <> | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:103` |
| `state.admin.admin-abacpage.105a1` | admin | !(context === 'new') | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:105` |
| `state.admin.admin-abacpage.105a0` | admin | context === 'new' | RoomsContextualBar | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:105` |
| `state.admin.admin-abacpage.106a1` | admin | !(context === 'edit' && _id) | null | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:106` |
| `state.admin.admin-abacpage.106a0` | admin | context === 'edit' && _id | RoomsContextualBarWithData | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACPage.tsx:106` |
| `state.admin.admin-abacroute.57i` | admin | isModalOpen | PageSkeleton | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACRoute.tsx:57` |
| `state.admin.admin-abacroute.61i` | admin | !canViewABACPage ¦¦ !firstAllowedTab ¦¦ (ABACEnabledSetting === undefined && !hasABAC) | NotAuthorizedPage | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACRoute.tsx:61` |
| `state.admin.admin-abacroute.65d` | admin | 前述 if-ret 均不成立（default return） | SettingsProvider | 登录 admin + ABAC 许可 → `/admin/ABAC` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACRoute.tsx:65` |
| `state.admin.admin-abactabs.22a1` | admin | !(tabPermissions.settings) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACTabs.tsx:22` |
| `state.admin.admin-abactabs.22a0` | admin | tabPermissions.settings | TabsItem | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACTabs.tsx:22` |
| `state.admin.admin-abactabs.27a1` | admin | !(tabPermissions['room-attributes'] && !isExternalStore) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACTabs.tsx:27` |
| `state.admin.admin-abactabs.27a0` | admin | tabPermissions['room-attributes'] && !isExternalStore | TabsItem | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACTabs.tsx:27` |
| `state.admin.admin-abactabs.32a1` | admin | !(tabPermissions.rooms) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACTabs.tsx:32` |
| `state.admin.admin-abactabs.32a0` | admin | tabPermissions.rooms | TabsItem | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACTabs.tsx:32` |
| `state.admin.admin-abactabs.37a1` | admin | !(tabPermissions.logs) | null | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACTabs.tsx:37` |
| `state.admin.admin-abactabs.37a0` | admin | tabPermissions.logs | TabsItem | 登录 admin + ABAC 许可 → `/admin/ABAC`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/ABAC/AdminABACTabs.tsx:37` |
| `state.admin.administration-router.52s` | admin | Suspense fallback（子树未 ready） | PageSkeleton | 登录 admin → `/admin` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/AdministrationRouter.tsx:52` |
| `state.admin.aicenter-capability-card.22a1` | admin | !(status) | null | 登录 admin → `/admin/ai-center` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/aiCenter/AICenterCapabilityCard.tsx:22` |
| `state.admin.aicenter-capability-card.22a0` | admin | status | Box | 登录 admin → `/admin/ai-center` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/aiCenter/AICenterCapabilityCard.tsx:22` |
| `state.admin.aicenter-overview.21i` | admin | isPending | PageSkeleton | 登录 admin → `/admin/ai-center`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/aiCenter/AICenterOverview.tsx:21` |
| `state.admin.aicenter-overview.35d` | admin | 前述 if-ret 均不成立（default return） | Page | 登录 admin → `/admin/ai-center` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/aiCenter/AICenterOverview.tsx:35` |
| `state.admin.aicenter-overview.40a1` | admin | !(hasAILicense === false) | null | 登录 admin → `/admin/ai-center`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/aiCenter/AICenterOverview.tsx:40` |
| `state.admin.aicenter-overview.40a0` | admin | hasAILicense === false | Callout | 登录 admin → `/admin/ai-center`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/aiCenter/AICenterOverview.tsx:40` |
| `state.admin.aicenter-route.12i` | admin | !hasPermission | NotAuthorizedPage | 登录 admin → `/admin/ai-center`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/aiCenter/AICenterRoute.tsx:12` |
| `state.admin.aicenter-route.16i` | admin | section === 'search' | AISettingsSection | 登录 admin → `/admin/ai-center` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/aiCenter/AICenterRoute.tsx:16` |
| `state.admin.aicenter-route.20i` | admin | section === 'llm-providers' | AISettingsSection | 登录 admin → `/admin/ai-center` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/aiCenter/AICenterRoute.tsx:20` |
| `state.admin.aicenter-route.24d` | admin | 前述 if-ret 均不成立（default return） | AICenterOverview | 登录 admin → `/admin/ai-center` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/aiCenter/AICenterRoute.tsx:24` |
| `state.admin.add-custom-emoji.92a1` | admin | !(errors.name) | null | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/AddCustomEmoji.tsx:92` |
| `state.admin.add-custom-emoji.92a0` | admin | errors.name | FieldError | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/AddCustomEmoji.tsx:92` |
| `state.admin.add-custom-emoji.99a1` | admin | !(errors.aliases) | null | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/AddCustomEmoji.tsx:99` |
| `state.admin.add-custom-emoji.99a0` | admin | errors.aliases | FieldError | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/AddCustomEmoji.tsx:99` |
| `state.admin.add-custom-emoji.106a1` | admin | !(errors.emoji) | null | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/AddCustomEmoji.tsx:106` |
| `state.admin.add-custom-emoji.106a0` | admin | errors.emoji | FieldError | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/AddCustomEmoji.tsx:106` |
| `state.admin.add-custom-emoji.107a1` | admin | !(newEmojiPreview) | null | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/AddCustomEmoji.tsx:107` |
| `state.admin.add-custom-emoji.107a0` | admin | newEmojiPreview | Box | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/AddCustomEmoji.tsx:107` |
| `state.admin.custom-emoji.72a1` | admin | !(isLoading) | null | 登录 admin → `/admin/emoji`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmoji.tsx:72` |
| `state.admin.custom-emoji.72a0` | admin | isLoading | GenericTable | 登录 admin → `/admin/emoji`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmoji.tsx:72` |
| `state.admin.custom-emoji.80a1` | admin | !(isSuccess && data && data.emojis.length > 0) | null | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmoji.tsx:80` |
| `state.admin.custom-emoji.80a0` | admin | isSuccess && data && data.emojis.length > 0 | <> | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmoji.tsx:80` |
| `state.admin.custom-emoji.117a1` | admin | !(isSuccess && data && data.emojis.length === 0) | null | 登录 admin → `/admin/emoji`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmoji.tsx:117` |
| `state.admin.custom-emoji.117a0` | admin | isSuccess && data && data.emojis.length === 0 | GenericNoResults | 登录 admin → `/admin/emoji`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmoji.tsx:117` |
| `state.admin.custom-emoji.118a1` | admin | !(isError) | null | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmoji.tsx:118` |
| `state.admin.custom-emoji.118a0` | admin | isError | States | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmoji.tsx:118` |
| `state.admin.custom-emoji-route.48i` | admin | !canManageEmoji | NotAuthorizedPage | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmojiRoute.tsx:48` |
| `state.admin.custom-emoji-route.52d` | admin | 前述 if-ret 均不成立（default return） | Page | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmojiRoute.tsx:52` |
| `state.admin.custom-emoji-route.64a1` | admin | !(context) | null | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmojiRoute.tsx:64` |
| `state.admin.custom-emoji-route.64a0` | admin | context | ContextualbarDialog | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmojiRoute.tsx:64` |
| `state.admin.custom-emoji-route.73a1` | admin | !(context === 'edit' && id) | null | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmojiRoute.tsx:73` |
| `state.admin.custom-emoji-route.73a0` | admin | context === 'edit' && id | EditCustomEmojiWithData | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmojiRoute.tsx:73` |
| `state.admin.custom-emoji-route.74a1` | admin | !(context === 'new') | null | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmojiRoute.tsx:74` |
| `state.admin.custom-emoji-route.74a0` | admin | context === 'new' | AddCustomEmoji | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/CustomEmojiRoute.tsx:74` |
| `state.admin.edit-custom-emoji.161a1` | admin | !(errors.name) | null | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/EditCustomEmoji.tsx:161` |
| `state.admin.edit-custom-emoji.161a0` | admin | errors.name | FieldError | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/EditCustomEmoji.tsx:161` |
| `state.admin.edit-custom-emoji.168a1` | admin | !(errors.aliases) | null | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/EditCustomEmoji.tsx:168` |
| `state.admin.edit-custom-emoji.168a0` | admin | errors.aliases | FieldError | 登录 admin → `/admin/emoji`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/EditCustomEmoji.tsx:168` |
| `state.admin.edit-custom-emoji.175a1` | admin | !(newEmojiPreview) | null | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/EditCustomEmoji.tsx:175` |
| `state.admin.edit-custom-emoji.175a0` | admin | newEmojiPreview | Box | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/EditCustomEmoji.tsx:175` |
| `state.admin.edit-custom-emoji-with-data.31i` | admin | isPending | FormSkeleton | 登录 admin → `/admin/emoji`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/EditCustomEmojiWithData.tsx:31` |
| `state.admin.edit-custom-emoji-with-data.35i` | admin | error ¦¦ !data ¦¦ !data.emojis ¦¦ data.emojis.update.length < 1 | Callout | 登录 admin → `/admin/emoji`；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/EditCustomEmojiWithData.tsx:35` |
| `state.admin.edit-custom-emoji-with-data.44d` | admin | 前述 if-ret 均不成立（default return） | EditCustomEmoji | 登录 admin → `/admin/emoji` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customEmoji/EditCustomEmojiWithData.tsx:44` |
| `state.admin.custom-sounds-page.61a1` | admin | !(context) | null | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsPage.tsx:61` |
| `state.admin.custom-sounds-page.61a0` | admin | context | ContextualbarDialog | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsPage.tsx:61` |
| `state.admin.custom-sounds-page.70a1` | admin | !(context === 'edit') | null | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsPage.tsx:70` |
| `state.admin.custom-sounds-page.70a0` | admin | context === 'edit' | EditCustomSound | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsPage.tsx:70` |
| `state.admin.custom-sounds-page.71a1` | admin | !(context === 'new') | null | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsPage.tsx:71` |
| `state.admin.custom-sounds-page.71a0` | admin | context === 'new' | AddCustomSound | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsPage.tsx:71` |
| `state.admin.custom-sounds-route.9i` | admin | !canManageCustomSounds | NotAuthorizedPage | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsRoute.tsx:9` |
| `state.admin.custom-sounds-route.13d` | admin | 前述 if-ret 均不成立（default return） | CustomSoundsPage | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsRoute.tsx:13` |
| `state.admin.custom-sounds-table.69a1` | admin | !(isLoading) | null | 登录 admin → `/admin/sounds`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsTable/CustomSoundsTable.tsx:69` |
| `state.admin.custom-sounds-table.69a0` | admin | isLoading | GenericTable | 登录 admin → `/admin/sounds`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsTable/CustomSoundsTable.tsx:69` |
| `state.admin.custom-sounds-table.77a1` | admin | !(isSuccess && data?.sounds.length > 0) | null | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsTable/CustomSoundsTable.tsx:77` |
| `state.admin.custom-sounds-table.77a0` | admin | isSuccess && data?.sounds.length > 0 | <> | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsTable/CustomSoundsTable.tsx:77` |
| `state.admin.custom-sounds-table.98a1` | admin | !(isSuccess && data?.sounds.length === 0) | null | 登录 admin → `/admin/sounds`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsTable/CustomSoundsTable.tsx:98` |
| `state.admin.custom-sounds-table.98a0` | admin | isSuccess && data?.sounds.length === 0 | GenericNoResults | 登录 admin → `/admin/sounds`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsTable/CustomSoundsTable.tsx:98` |
| `state.admin.custom-sounds-table.99a1` | admin | !(isError) | null | 登录 admin → `/admin/sounds`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsTable/CustomSoundsTable.tsx:99` |
| `state.admin.custom-sounds-table.99a0` | admin | isError | States | 登录 admin → `/admin/sounds`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/CustomSoundsTable/CustomSoundsTable.tsx:99` |
| `state.admin.edit-custom-sound.30i` | admin | isLoading | FormSkeleton | 登录 admin → `/admin/sounds`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/EditCustomSound.tsx:30` |
| `state.admin.edit-custom-sound.34i` | admin | !data | ContextualbarEmptyContent | 登录 admin → `/admin/sounds`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/EditCustomSound.tsx:34` |
| `state.admin.edit-custom-sound.42d` | admin | 前述 if-ret 均不成立（default return） | EditSound | 登录 admin → `/admin/sounds` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customSounds/EditCustomSound.tsx:42` |
| `state.admin.custom-user-active-connections.11i` | admin | result.isPending ¦¦ result.isError | GenericResourceUsageSkeleton | 登录 admin → `/admin/user-status`；等查询 in-flight；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserActiveConnections.tsx:11` |
| `state.admin.custom-user-active-connections.17d` | admin | 前述 if-ret 均不成立（default return） | GenericResourceUsage | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserActiveConnections.tsx:17` |
| `state.admin.custom-user-status-disabled-modal.8t1` | admin | !(isAdmin) | GenericModal | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusDisabledModal.tsx:8` |
| `state.admin.custom-user-status-disabled-modal.8t0` | admin | isAdmin | GenericModal | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusDisabledModal.tsx:8` |
| `state.admin.custom-user-status-form.106a1` | admin | !(errors.name) | null | 登录 admin → `/admin/user-status`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusForm.tsx:106` |
| `state.admin.custom-user-status-form.106a0` | admin | errors.name | FieldError | 登录 admin → `/admin/user-status`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusForm.tsx:106` |
| `state.admin.custom-user-status-form.118a1` | admin | !(errors.statusType) | null | 登录 admin → `/admin/user-status`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusForm.tsx:118` |
| `state.admin.custom-user-status-form.118a0` | admin | errors.statusType | FieldError | 登录 admin → `/admin/user-status`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusForm.tsx:118` |
| `state.admin.custom-user-status-form.129a1` | admin | !(_id) | null | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusForm.tsx:129` |
| `state.admin.custom-user-status-form.129a0` | admin | _id | Box | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusForm.tsx:129` |
| `state.admin.custom-user-status-form-with-data.37i` | admin | !_id | CustomUserStatusForm | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusFormWithData.tsx:37` |
| `state.admin.custom-user-status-form-with-data.41i` | admin | isPending | FormSkeleton | 登录 admin → `/admin/user-status`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusFormWithData.tsx:41` |
| `state.admin.custom-user-status-form-with-data.45i` | admin | error ¦¦ !data ¦¦ data.count < 1 | Box | 登录 admin → `/admin/user-status`；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusFormWithData.tsx:45` |
| `state.admin.custom-user-status-form-with-data.53d` | admin | 前述 if-ret 均不成立（default return） | CustomUserStatusForm | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusFormWithData.tsx:53` |
| `state.admin.custom-user-status-route.59i` | admin | !canManageUserStatus | NotAuthorizedPage | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:59` |
| `state.admin.custom-user-status-route.63d` | admin | 前述 if-ret 均不成立（default return） | Page | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:63` |
| `state.admin.custom-user-status-route.67a1` | admin | !(!license?.isEnterprise) | null | 登录 admin → `/admin/user-status`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:67` |
| `state.admin.custom-user-status-route.67a0` | admin | !license?.isEnterprise | CustomUserActiveConnections | 登录 admin → `/admin/user-status`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:67` |
| `state.admin.custom-user-status-route.77a1` | admin | !(context) | null | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:77` |
| `state.admin.custom-user-status-route.77a0` | admin | context | ContextualbarDialog | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:77` |
| `state.admin.custom-user-status-route.87a1` | admin | !(context === 'presence-service') | null | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:87` |
| `state.admin.custom-user-status-route.87a0` | admin | context === 'presence-service' | CustomUserStatusService | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:87` |
| `state.admin.custom-user-status-route.88a1` | admin | !((context === 'new' ¦¦ context === 'edit')) | null | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:88` |
| `state.admin.custom-user-status-route.88a0` | admin | (context === 'new' ¦¦ context === 'edit') | CustomUserStatusFormWithData | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusRoute.tsx:88` |
| `state.admin.custom-user-status-service.33i` | admin | result.isPending ¦¦ disablePresenceService.isPending ¦¦ licenseIsLoading | Box | 登录 admin → `/admin/user-status`；等查询 in-flight；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:33` |
| `state.admin.custom-user-status-service.44i` | admin | result.isError ¦¦ disablePresenceService.isError | Box | 登录 admin → `/admin/user-status`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:44` |
| `state.admin.custom-user-status-service.58d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:58` |
| `state.admin.custom-user-status-service.74a1` | admin | !(!license?.isEnterprise) | null | 登录 admin → `/admin/user-status`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:74` |
| `state.admin.custom-user-status-service.74a0` | admin | !license?.isEnterprise | ProgressBar | 登录 admin → `/admin/user-status`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:74` |
| `state.admin.custom-user-status-service.75a1` | admin | !(presenceDisabled) | null | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:75` |
| `state.admin.custom-user-status-service.75a0` | admin | presenceDisabled | Margins | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:75` |
| `state.admin.custom-user-status-service.84t1` | admin | !(license?.isEnterprise) | Box | 登录 admin → `/admin/user-status`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:84` |
| `state.admin.custom-user-status-service.84t0` | admin | license?.isEnterprise | Box | 登录 admin → `/admin/user-status`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:84` |
| `state.admin.custom-user-status-service.111a1` | admin | !(!license?.isEnterprise) | null | 登录 admin → `/admin/user-status`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:111` |
| `state.admin.custom-user-status-service.111a0` | admin | !license?.isEnterprise | ContextualbarFooter | 登录 admin → `/admin/user-status`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusService.tsx:111` |
| `state.admin.custom-user-status-table.66i` | admin | !data | null | 登录 admin → `/admin/user-status`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:66` |
| `state.admin.custom-user-status-table.70d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:70` |
| `state.admin.custom-user-status-table.73a1` | admin | !(data.length === 0) | null | 登录 admin → `/admin/user-status`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:73` |
| `state.admin.custom-user-status-table.73a0` | admin | data.length === 0 | GenericNoResult | 登录 admin → `/admin/user-status`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:73` |
| `state.admin.custom-user-status-table.74a1` | admin | !(data && data.length > 0) | null | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:74` |
| `state.admin.custom-user-status-table.74a0` | admin | data && data.length > 0 | <> | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:74` |
| `state.admin.custom-user-status-table.92a1` | admin | !(isLoading) | null | 登录 admin → `/admin/user-status`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:92` |
| `state.admin.custom-user-status-table.92a0` | admin | isLoading | GenericTableLoadingTable | 登录 admin → `/admin/user-status`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:92` |
| `state.admin.custom-user-status-table.96a1` | admin | !(isFetched) | null | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:96` |
| `state.admin.custom-user-status-table.96a0` | admin | isFetched | Pagination | 登录 admin → `/admin/user-status` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/customUserStatus/CustomUserStatusTable/CustomUserStatusTable.tsx:96` |
| `state.admin.device-management-admin-page.22a1` | admin | !(context === 'info' && deviceId) | null | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminPage.tsx:22` |
| `state.admin.device-management-admin-page.22a0` | admin | context === 'info' && deviceId | ContextualbarDialog | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminPage.tsx:22` |
| `state.admin.device-management-admin-route.41i` | admin | isModalOpen ¦¦ isPending | PageSkeleton | 登录 admin → `/admin/device-management`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminRoute.tsx:41` |
| `state.admin.device-management-admin-route.45i` | admin | !canViewDeviceManagement ¦¦ !hasDeviceManagement | NotAuthorizedPage | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminRoute.tsx:45` |
| `state.admin.device-management-admin-route.49d` | admin | 前述 if-ret 均不成立（default return） | DeviceManagementAdminPage | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminRoute.tsx:49` |
| `state.admin.device-management-admin-row.73a1` | admin | !(deviceName) | null | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminRow.tsx:73` |
| `state.admin.device-management-admin-row.73a0` | admin | deviceName | Box | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminRow.tsx:73` |
| `state.admin.device-management-admin-row.79a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminRow.tsx:79` |
| `state.admin.device-management-admin-row.79a0` | admin | mediaQuery | GenericTableCell | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminRow.tsx:79` |
| `state.admin.device-management-admin-row.80a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminRow.tsx:80` |
| `state.admin.device-management-admin-row.80a0` | admin | mediaQuery | GenericTableCell | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminRow.tsx:80` |
| `state.admin.device-management-admin-row.81a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminRow.tsx:81` |
| `state.admin.device-management-admin-row.81a0` | admin | mediaQuery | GenericTableCell | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminRow.tsx:81` |
| `state.admin.device-management-admin-table.64a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminTable.tsx:64` |
| `state.admin.device-management-admin-table.64a0` | admin | mediaQuery | GenericTableHeaderCell | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminTable.tsx:64` |
| `state.admin.device-management-admin-table.69a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminTable.tsx:69` |
| `state.admin.device-management-admin-table.69a0` | admin | mediaQuery | GenericTableHeaderCell | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminTable.tsx:69` |
| `state.admin.device-management-admin-table.70a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminTable.tsx:70` |
| `state.admin.device-management-admin-table.70a0` | admin | mediaQuery | GenericTableHeaderCell | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementAdminTable/DeviceManagementAdminTable.tsx:70` |
| `state.admin.device-management-info.60a1` | admin | !(username) | null | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementInfo/DeviceManagementInfo.tsx:60` |
| `state.admin.device-management-info.60a0` | admin | username | InfoPanelField | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementInfo/DeviceManagementInfo.tsx:60` |
| `state.admin.device-management-info.68a1` | admin | !(name) | null | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementInfo/DeviceManagementInfo.tsx:68` |
| `state.admin.device-management-info.68a0` | admin | name | Box | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementInfo/DeviceManagementInfo.tsx:68` |
| `state.admin.device-management-info-with-data.38i` | admin | isPending | ContextualbarSkeletonBody | 登录 admin → `/admin/device-management`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementInfo/DeviceManagementInfoWithData.tsx:38` |
| `state.admin.device-management-info-with-data.42i` | admin | isError | <> | 登录 admin → `/admin/device-management`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementInfo/DeviceManagementInfoWithData.tsx:42` |
| `state.admin.device-management-info-with-data.63d` | admin | 前述 if-ret 均不成立（default return） | DeviceManagementInfo | 登录 admin → `/admin/device-management` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/deviceManagement/DeviceManagementInfo/DeviceManagementInfoWithData.tsx:63` |
| `state.admin.email-inbox-form.252a1` | admin | !(errors.name) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:252` |
| `state.admin.email-inbox-form.252a0` | admin | errors.name | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:252` |
| `state.admin.email-inbox-form.282a1` | admin | !(errors.email) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:282` |
| `state.admin.email-inbox-form.282a0` | admin | errors.email | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:282` |
| `state.admin.email-inbox-form.354a1` | admin | !(errors.smtpServer) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:354` |
| `state.admin.email-inbox-form.354a0` | admin | errors.smtpServer | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:354` |
| `state.admin.email-inbox-form.381a1` | admin | !(errors.smtpPort) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:381` |
| `state.admin.email-inbox-form.381a0` | admin | errors.smtpPort | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:381` |
| `state.admin.email-inbox-form.408a1` | admin | !(errors.smtpUsername) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:408` |
| `state.admin.email-inbox-form.408a0` | admin | errors.smtpUsername | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:408` |
| `state.admin.email-inbox-form.435a1` | admin | !(errors.smtpPassword) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:435` |
| `state.admin.email-inbox-form.435a0` | admin | errors.smtpPassword | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:435` |
| `state.admin.email-inbox-form.476a1` | admin | !(errors.imapServer) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:476` |
| `state.admin.email-inbox-form.476a0` | admin | errors.imapServer | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:476` |
| `state.admin.email-inbox-form.503a1` | admin | !(errors.imapPort) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:503` |
| `state.admin.email-inbox-form.503a0` | admin | errors.imapPort | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:503` |
| `state.admin.email-inbox-form.530a1` | admin | !(errors.imapUsername) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:530` |
| `state.admin.email-inbox-form.530a0` | admin | errors.imapUsername | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:530` |
| `state.admin.email-inbox-form.557a1` | admin | !(errors.imapPassword) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:557` |
| `state.admin.email-inbox-form.557a0` | admin | errors.imapPassword | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:557` |
| `state.admin.email-inbox-form.584a1` | admin | !(errors.imapRetries) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:584` |
| `state.admin.email-inbox-form.584a0` | admin | errors.imapRetries | FieldError | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:584` |
| `state.admin.email-inbox-form.614a1` | admin | !(inboxData?._id) | null | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:614` |
| `state.admin.email-inbox-form.614a0` | admin | inboxData?._id | Button | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxForm.tsx:614` |
| `state.admin.email-inbox-form-with-data.19i` | admin | isPending | FormSkeleton | 登录 admin → `/admin/email-inboxes`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxFormWithData.tsx:19` |
| `state.admin.email-inbox-form-with-data.23i` | admin | error ¦¦ !data | States | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxFormWithData.tsx:23` |
| `state.admin.email-inbox-form-with-data.32d` | admin | 前述 if-ret 均不成立（default return） | EmailInboxForm | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxFormWithData.tsx:32` |
| `state.admin.email-inbox-page.21a1` | admin | !(!context) | null | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxPage.tsx:21` |
| `state.admin.email-inbox-page.21a0` | admin | !context | Button | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxPage.tsx:21` |
| `state.admin.email-inbox-page.28a1` | admin | !(!context) | null | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxPage.tsx:28` |
| `state.admin.email-inbox-page.28a0` | admin | !context | EmailInboxTable | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxPage.tsx:28` |
| `state.admin.email-inbox-page.29a1` | admin | !(context === 'new') | null | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxPage.tsx:29` |
| `state.admin.email-inbox-page.29a0` | admin | context === 'new' | EmailInboxForm | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxPage.tsx:29` |
| `state.admin.email-inbox-page.30a1` | admin | !(context === 'edit' && id) | null | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxPage.tsx:30` |
| `state.admin.email-inbox-page.30a0` | admin | context === 'edit' && id | EmailInboxFormWithData | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxPage.tsx:30` |
| `state.admin.email-inbox-route.9i` | admin | !canViewEmailInbox | NotAuthorizedPage | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxRoute.tsx:9` |
| `state.admin.email-inbox-route.13d` | admin | 前述 if-ret 均不成立（default return） | EmailInboxPage | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxRoute.tsx:13` |
| `state.admin.email-inbox-table.67a1` | admin | !(result.isPending) | null | 登录 admin → `/admin/email-inboxes`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxTable.tsx:67` |
| `state.admin.email-inbox-table.67a0` | admin | result.isPending | GenericTable | 登录 admin → `/admin/email-inboxes`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxTable.tsx:67` |
| `state.admin.email-inbox-table.75a1` | admin | !(result.isSuccess && result.data.emailInboxes.length > 0) | null | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxTable.tsx:75` |
| `state.admin.email-inbox-table.75a0` | admin | result.isSuccess && result.data.emailInboxes.length > 0 | <> | 登录 admin → `/admin/email-inboxes` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxTable.tsx:75` |
| `state.admin.email-inbox-table.109a1` | admin | !(result.isSuccess && result.data.emailInboxes.length === 0) | null | 登录 admin → `/admin/email-inboxes`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxTable.tsx:109` |
| `state.admin.email-inbox-table.109a0` | admin | result.isSuccess && result.data.emailInboxes.length === 0 | GenericNoResults | 登录 admin → `/admin/email-inboxes`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxTable.tsx:109` |
| `state.admin.email-inbox-table.110a1` | admin | !(result.isError) | null | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxTable.tsx:110` |
| `state.admin.email-inbox-table.110a0` | admin | result.isError | States | 登录 admin → `/admin/email-inboxes`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/emailInbox/EmailInboxTable.tsx:110` |
| `state.admin.engagement-dashboard-card.14a1` | admin | !(title) | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardCard.tsx:14` |
| `state.admin.engagement-dashboard-card.14a0` | admin | title | CardTitle | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardCard.tsx:14` |
| `state.admin.engagement-dashboard-card-filter.10a1` | admin | !(children) | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardCardFilter.tsx:10` |
| `state.admin.engagement-dashboard-card-filter.10a0` | admin | children | FlexItem | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardCardFilter.tsx:10` |
| `state.admin.engagement-dashboard-page.57a1` | admin | !(tab === 'users') | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardPage.tsx:57` |
| `state.admin.engagement-dashboard-page.57a0` | admin | tab === 'users' | UsersTab | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardPage.tsx:57` |
| `state.admin.engagement-dashboard-page.58a1` | admin | !(tab === 'messages') | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardPage.tsx:58` |
| `state.admin.engagement-dashboard-page.58a0` | admin | tab === 'messages' | MessagesTab | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardPage.tsx:58` |
| `state.admin.engagement-dashboard-page.59a1` | admin | !(tab === 'channels') | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardPage.tsx:59` |
| `state.admin.engagement-dashboard-page.59a0` | admin | tab === 'channels' | ChannelsTab | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardPage.tsx:59` |
| `state.admin.engagement-dashboard-route.68i` | admin | isModalOpen ¦¦ isPending | PageSkeleton | 登录 admin → `/admin/engagement`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardRoute.tsx:68` |
| `state.admin.engagement-dashboard-route.72i` | admin | !canViewEngagementDashboard ¦¦ !hasEngagementDashboard | NotAuthorizedPage | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardRoute.tsx:72` |
| `state.admin.engagement-dashboard-route.80d` | admin | 前述 if-ret 均不成立（default return） | EngagementDashboardPage | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/EngagementDashboardRoute.tsx:80` |
| `state.admin.channels-overview.62a1` | admin | !(channels && !channels.length) | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/channels/ChannelsOverview.tsx:62` |
| `state.admin.channels-overview.62a0` | admin | channels && !channels.length | Tile | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/channels/ChannelsOverview.tsx:62` |
| `state.admin.channels-overview.67a1` | admin | !((!channels ¦¦ channels.length)) | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/channels/ChannelsOverview.tsx:67` |
| `state.admin.channels-overview.67a0` | admin | (!channels ¦¦ channels.length) | Table | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/channels/ChannelsOverview.tsx:67` |
| `state.admin.channels-overview.84a1` | admin | !(t === 'd') | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/channels/ChannelsOverview.tsx:84` |
| `state.admin.channels-overview.84a147e2` | admin | !(t === 'p') | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/channels/ChannelsOverview.tsx:84` |
| `state.admin.channels-overview.84a1616b` | admin | !(t === 'c') | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/channels/ChannelsOverview.tsx:84` |
| `state.admin.channels-overview.84a0` | admin | t === 'd' | Icon | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/channels/ChannelsOverview.tsx:84` |
| `state.admin.channels-overview.84a000f1` | admin | t === 'p' | Icon | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/channels/ChannelsOverview.tsx:84` |
| `state.admin.channels-overview.84a0e649` | admin | t === 'c' | Icon | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/channels/ChannelsOverview.tsx:84` |
| `state.admin.messages-per-channel-section.176a1` | admin | !(table && !table.length) | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesPerChannelSection.tsx:176` |
| `state.admin.messages-per-channel-section.176a0` | admin | table && !table.length | Tile | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesPerChannelSection.tsx:176` |
| `state.admin.messages-per-channel-section.181a1` | admin | !((!table ¦¦ !!table.length)) | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesPerChannelSection.tsx:181` |
| `state.admin.messages-per-channel-section.181a0` | admin | (!table ¦¦ !!table.length) | Table | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesPerChannelSection.tsx:181` |
| `state.admin.messages-per-channel-section.196a1` | admin | !(t === 'd') | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesPerChannelSection.tsx:196` |
| `state.admin.messages-per-channel-section.196a0` | admin | t === 'd' | Icon | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesPerChannelSection.tsx:196` |
| `state.admin.messages-per-channel-section.197a1` | admin | !(t === 'p') | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesPerChannelSection.tsx:197` |
| `state.admin.messages-per-channel-section.197a0` | admin | t === 'p' | Icon | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesPerChannelSection.tsx:197` |
| `state.admin.messages-per-channel-section.198a1` | admin | !(t === 'c') | null | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesPerChannelSection.tsx:198` |
| `state.admin.messages-per-channel-section.198a0` | admin | t === 'c' | Icon | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesPerChannelSection.tsx:198` |
| `state.admin.messages-sent-section.81t1` | admin | !(values) | Box | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesSentSection.tsx:81` |
| `state.admin.messages-sent-section.81t0` | admin | values | Box | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/messages/MessagesSentSection.tsx:81` |
| `state.admin.active-users-section.157t1` | admin | !(data) | Skeleton | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/users/ActiveUsersSection.tsx:157` |
| `state.admin.active-users-section.157t0` | admin | data | Box | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/users/ActiveUsersSection.tsx:157` |
| `state.admin.content-for-days.60t1` | admin | !(data) | Skeleton | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/users/ContentForDays.tsx:60` |
| `state.admin.content-for-days.60t0` | admin | data | Box | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/users/ContentForDays.tsx:60` |
| `state.admin.new-users-section.81t1` | admin | !(values) | Box | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/users/NewUsersSection.tsx:81` |
| `state.admin.new-users-section.81t0` | admin | values | Box | 登录 admin → `/admin/engagement` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/users/NewUsersSection.tsx:81` |
| `state.admin.users-by-time-of-the-day-section.111t1` | admin | !(!isPending && values && dates) | Skeleton | 登录 admin → `/admin/engagement`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/users/UsersByTimeOfTheDaySection.tsx:111` |
| `state.admin.users-by-time-of-the-day-section.111t0` | admin | !isPending && values && dates | Box | 登录 admin → `/admin/engagement`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/engagementDashboard/users/UsersByTimeOfTheDaySection.tsx:111` |
| `state.admin.admin-feature-preview-page.69i` | admin | !allowFeaturePreviewSetting | SettingsGroupPageSkeleton | 登录 admin → `/admin/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/featurePreview/AdminFeaturePreviewPage.tsx:69` |
| `state.admin.admin-feature-preview-page.74d` | admin | 前述 if-ret 均不成立（default return） | Page | 登录 admin → `/admin/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/featurePreview/AdminFeaturePreviewPage.tsx:74` |
| `state.admin.admin-feature-preview-page.104a1` | admin | !(feature.description) | null | 登录 admin → `/admin/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/featurePreview/AdminFeaturePreviewPage.tsx:104` |
| `state.admin.admin-feature-preview-page.104a0` | admin | feature.description | FieldHint | 登录 admin → `/admin/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/featurePreview/AdminFeaturePreviewPage.tsx:104` |
| `state.admin.admin-feature-preview-page.106a1` | admin | !(feature.imageUrl) | null | 登录 admin → `/admin/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/featurePreview/AdminFeaturePreviewPage.tsx:106` |
| `state.admin.admin-feature-preview-page.106a0` | admin | feature.imageUrl | Box | 登录 admin → `/admin/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/featurePreview/AdminFeaturePreviewPage.tsx:106` |
| `state.admin.admin-feature-preview-route.12i` | admin | !canViewFeaturesPreview | NotAuthorizedPage | 登录 admin → `/admin/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/featurePreview/AdminFeaturePreviewRoute.tsx:12` |
| `state.admin.admin-feature-preview-route.16d` | admin | 前述 if-ret 均不成立（default return） | SettingsProvider | 登录 admin → `/admin/feature-preview` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/featurePreview/AdminFeaturePreviewRoute.tsx:16` |
| `state.admin.import-history-page.113a1` | admin | !(hasAnySuccessfulImport) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:113` |
| `state.admin.import-history-page.113a0` | admin | hasAnySuccessfulImport | Button | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:113` |
| `state.admin.import-history-page.122a1` | admin | !(hasAnySuccessfulImport) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:122` |
| `state.admin.import-history-page.122a0` | admin | hasAnySuccessfulImport | Button | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:122` |
| `state.admin.import-history-page.143a1` | admin | !(!small) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:143` |
| `state.admin.import-history-page.143a0` | admin | !small | <> | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:143` |
| `state.admin.import-history-page.157a1` | admin | !(!small) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:157` |
| `state.admin.import-history-page.157a0` | admin | !small | TableRow | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:157` |
| `state.admin.import-history-page.178a1` | admin | !(isLoading) | null | 登录 admin → `/admin/import`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:178` |
| `state.admin.import-history-page.178a0` | admin | isLoading | <> | 登录 admin → `/admin/import`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:178` |
| `state.admin.import-history-page.186a1` | admin | !(currentOperation.isSuccess && currentOperation.data.valid) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:186` |
| `state.admin.import-history-page.186a0` | admin | currentOperation.isSuccess && currentOperation.data.valid | ImportOperationSummary | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:186` |
| `state.admin.import-history-page.189a1` | admin | !(currentOperation.isSuccess && latestOperations.isSuccess) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:189` |
| `state.admin.import-history-page.189a0` | admin | currentOperation.isSuccess && latestOperations.isSuccess | <> | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportHistoryPage.tsx:189` |
| `state.admin.import-operation-summary.101a1` | admin | !(!small) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportOperationSummary.tsx:101` |
| `state.admin.import-operation-summary.101a0` | admin | !small | <> | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportOperationSummary.tsx:101` |
| `state.admin.import-operation-summary-skeleton.16a1` | admin | !(!small) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportOperationSummarySkeleton.tsx:16` |
| `state.admin.import-operation-summary-skeleton.16a0` | admin | !small | <> | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportOperationSummarySkeleton.tsx:16` |
| `state.admin.import-progress-page.164a1` | admin | !(currentOperation.isLoading) | null | 登录 admin → `/admin/import`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportProgressPage.tsx:164` |
| `state.admin.import-progress-page.164a0` | admin | currentOperation.isLoading | Throbber | 登录 admin → `/admin/import`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportProgressPage.tsx:164` |
| `state.admin.import-progress-page.165a1` | admin | !(progress.fetchStatus !== 'idle' && progress.isLoading) | null | 登录 admin → `/admin/import`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportProgressPage.tsx:165` |
| `state.admin.import-progress-page.165a0` | admin | progress.fetchStatus !== 'idle' && progress.isLoading | Throbber | 登录 admin → `/admin/import`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportProgressPage.tsx:165` |
| `state.admin.import-progress-page.167a1` | admin | !((currentOperation.isError ¦¦ progress.isError)) | null | 登录 admin → `/admin/import`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportProgressPage.tsx:167` |
| `state.admin.import-progress-page.167a0` | admin | (currentOperation.isError ¦¦ progress.isError) | Box | 登录 admin → `/admin/import`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportProgressPage.tsx:167` |
| `state.admin.import-progress-page.168a1` | admin | !(progress.isSuccess) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportProgressPage.tsx:168` |
| `state.admin.import-progress-page.168a0` | admin | progress.isSuccess | <> | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportProgressPage.tsx:168` |
| `state.admin.import-route.16i` | admin | !canRunImport | NotAuthorizedPage | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportRoute.tsx:16` |
| `state.admin.import-route.20i` | admin | page === 'history' | ImportHistoryPage | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportRoute.tsx:20` |
| `state.admin.import-route.24i` | admin | page === 'new' | NewImportPage | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportRoute.tsx:24` |
| `state.admin.import-route.28i` | admin | page === 'prepare' | PrepareImportPage | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportRoute.tsx:28` |
| `state.admin.import-route.32i` | admin | page === 'progress' | ImportProgressPage | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportRoute.tsx:32` |
| `state.admin.import-route.36d` | admin | 前述 if-ret 均不成立（default return） | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/ImportRoute.tsx:36` |
| `state.admin.new-import-page.208a1` | admin | !(importer) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:208` |
| `state.admin.new-import-page.208a0` | admin | importer | Button | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:208` |
| `state.admin.new-import-page.238a1` | admin | !(importer) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:238` |
| `state.admin.new-import-page.238a0` | admin | importer | FieldHint | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:238` |
| `state.admin.new-import-page.246a1` | admin | !(importer) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:246` |
| `state.admin.new-import-page.246a0` | admin | importer | Field | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:246` |
| `state.admin.new-import-page.267a1` | admin | !(importer) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:267` |
| `state.admin.new-import-page.267a0` | admin | importer | <> | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:267` |
| `state.admin.new-import-page.269a1` | admin | !(fileType === 'upload') | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:269` |
| `state.admin.new-import-page.269a0` | admin | fileType === 'upload' | <> | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:269` |
| `state.admin.new-import-page.271t1` | admin | !(maxFileSize > 0) | Callout | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:271` |
| `state.admin.new-import-page.271t0` | admin | maxFileSize > 0 | Callout | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:271` |
| `state.admin.new-import-page.289a1` | admin | !(files?.length > 0) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:289` |
| `state.admin.new-import-page.289a0` | admin | files?.length > 0 | FieldRow | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:289` |
| `state.admin.new-import-page.301a1` | admin | !(fileType === 'url') | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:301` |
| `state.admin.new-import-page.301a0` | admin | fileType === 'url' | Field | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:301` |
| `state.admin.new-import-page.311a1` | admin | !(fileType === 'path') | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:311` |
| `state.admin.new-import-page.311a0` | admin | fileType === 'path' | Field | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/NewImportPage.tsx:311` |
| `state.admin.prepare-channels.26i` | admin | !channels.length | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareChannels.tsx:26` |
| `state.admin.prepare-channels.30d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareChannels.tsx:30` |
| `state.admin.prepare-channels.76a1` | admin | !(channel.is_archived) | null | 登录 admin → `/admin/import`；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareChannels.tsx:76` |
| `state.admin.prepare-channels.76a0` | admin | channel.is_archived | Tag | 登录 admin → `/admin/import`；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareChannels.tsx:76` |
| `state.admin.prepare-import-page.209a1` | admin | !(!isPreparing) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:209` |
| `state.admin.prepare-import-page.209a0` | admin | !isPreparing | Tabs | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:209` |
| `state.admin.prepare-import-page.227a1` | admin | !(isPreparing) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:227` |
| `state.admin.prepare-import-page.227a0` | admin | isPreparing | <> | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:227` |
| `state.admin.prepare-import-page.229t1` | admin | !(progressRate) | Throbber | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:229` |
| `state.admin.prepare-import-page.229t0` | admin | progressRate | Box | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:229` |
| `state.admin.prepare-import-page.241a1` | admin | !(!isPreparing && tab === 'users') | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:241` |
| `state.admin.prepare-import-page.241a0` | admin | !isPreparing && tab === 'users' | PrepareUsers | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:241` |
| `state.admin.prepare-import-page.242a1` | admin | !(!isPreparing && tab === 'contacts') | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:242` |
| `state.admin.prepare-import-page.242a0` | admin | !isPreparing && tab === 'contacts' | PrepareContacts | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:242` |
| `state.admin.prepare-import-page.245a1` | admin | !(!isPreparing && tab === 'channels') | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:245` |
| `state.admin.prepare-import-page.245a0` | admin | !isPreparing && tab === 'channels' | PrepareChannels | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareImportPage.tsx:245` |
| `state.admin.prepare-users.72a1` | admin | !(user.is_deleted) | null | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareUsers.tsx:72` |
| `state.admin.prepare-users.72a0` | admin | user.is_deleted | Tag | 登录 admin → `/admin/import` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/import/PrepareUsers.tsx:72` |
| `state.admin.edit-integrations-page.9i` | admin | type === 'outgoing' | EditOutgoingWebhook | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/EditIntegrationsPage.tsx:9` |
| `state.admin.edit-integrations-page.13d` | admin | 前述 if-ret 均不成立（default return） | EditIncomingWebhook | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/EditIntegrationsPage.tsx:13` |
| `state.admin.edit-integrations-page-with-data.23i` | admin | isPending | Box | 登录 admin → `/admin/integrations`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/EditIntegrationsPageWithData.tsx:23` |
| `state.admin.edit-integrations-page-with-data.36i` | admin | isError | Box | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/EditIntegrationsPageWithData.tsx:36` |
| `state.admin.edit-integrations-page-with-data.40i` | admin | data?.integration.type === 'webhook-outgoing' | EditOutgoingWebhook | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/EditIntegrationsPageWithData.tsx:40` |
| `state.admin.edit-integrations-page-with-data.44d` | admin | 前述 if-ret 均不成立（default return） | EditIncomingWebhook | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/EditIntegrationsPageWithData.tsx:44` |
| `state.admin.integration-row.28a1` | admin | !(!isMobile) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationRow.tsx:28` |
| `state.admin.integration-row.28a0` | admin | !isMobile | GenericTableCell | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationRow.tsx:28` |
| `state.admin.integrations-page.47a1` | admin | !(context === 'zapier') | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsPage.tsx:47` |
| `state.admin.integrations-page.47a0` | admin | context === 'zapier' | NewZapier | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsPage.tsx:47` |
| `state.admin.integrations-page.48a1` | admin | !(context === 'bots') | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsPage.tsx:48` |
| `state.admin.integrations-page.48a0` | admin | context === 'bots' | NewBot | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsPage.tsx:48` |
| `state.admin.integrations-page.49a1` | admin | !(showTable) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsPage.tsx:49` |
| `state.admin.integrations-page.49a0` | admin | showTable | IntegrationsTable | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsPage.tsx:49` |
| `state.admin.integrations-route.26i` | admin | !canViewIntegrationsPage | NotAuthorizedPage | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsRoute.tsx:26` |
| `state.admin.integrations-route.30i` | admin | context === 'new' | EditIntegrationsPage | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsRoute.tsx:30` |
| `state.admin.integrations-route.34i` | admin | context === 'edit' && integrationId | EditIntegrationsPageWithData | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsRoute.tsx:34` |
| `state.admin.integrations-route.38i` | admin | context === 'history' | OutgoingWebhookHistoryPage | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsRoute.tsx:38` |
| `state.admin.integrations-route.42d` | admin | 前述 if-ret 均不成立（default return） | IntegrationsPage | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsRoute.tsx:42` |
| `state.admin.integrations-table.86a1` | admin | !(!isMobile) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:86` |
| `state.admin.integrations-table.86a0` | admin | !isMobile | GenericTableHeaderCell | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:86` |
| `state.admin.integrations-table.106a1` | admin | !(isLoading) | null | 登录 admin → `/admin/integrations`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:106` |
| `state.admin.integrations-table.106a0` | admin | isLoading | GenericTable | 登录 admin → `/admin/integrations`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:106` |
| `state.admin.integrations-table.114a1` | admin | !(isSuccess && data && data.integrations.length > 0) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:114` |
| `state.admin.integrations-table.114a0` | admin | isSuccess && data && data.integrations.length > 0 | <> | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:114` |
| `state.admin.integrations-table.136a1` | admin | !(isSuccess && data && data.integrations.length === 0) | null | 登录 admin → `/admin/integrations`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:136` |
| `state.admin.integrations-table.136a0` | admin | isSuccess && data && data.integrations.length === 0 | GenericNoResults | 登录 admin → `/admin/integrations`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:136` |
| `state.admin.integrations-table.137a1` | admin | !(isError) | null | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:137` |
| `state.admin.integrations-table.137a0` | admin | isError | States | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/IntegrationsTable.tsx:137` |
| `state.admin.new-zapier.47i` | admin | oauthAppQuery.isLoading | PageLoading | 登录 admin → `/admin/integrations`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/NewZapier.tsx:47` |
| `state.admin.new-zapier.51d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/NewZapier.tsx:51` |
| `state.admin.new-zapier.62a1` | admin | !(zapierAvailable) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/NewZapier.tsx:62` |
| `state.admin.new-zapier.62a0` | admin | zapierAvailable | <> | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/NewZapier.tsx:62` |
| `state.admin.new-zapier.64a1` | admin | !(!script) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/NewZapier.tsx:64` |
| `state.admin.new-zapier.64a0` | admin | !script | Box | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/NewZapier.tsx:64` |
| `state.admin.edit-incoming-webhook.98a1` | admin | !(webhookData?._id) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/incoming/EditIncomingWebhook.tsx:98` |
| `state.admin.edit-incoming-webhook.98a0` | admin | webhookData?._id | Button | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/incoming/EditIncomingWebhook.tsx:98` |
| `state.admin.edit-incoming-webhook.105a1` | admin | !(!webhookData?._id) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/incoming/EditIncomingWebhook.tsx:105` |
| `state.admin.edit-incoming-webhook.105a0` | admin | !webhookData?._id | Tabs | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/incoming/EditIncomingWebhook.tsx:105` |
| `state.admin.incoming-webhook-form.124a1` | admin | !(webhookData?._id) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/incoming/IncomingWebhookForm.tsx:124` |
| `state.admin.incoming-webhook-form.124a0` | admin | webhookData?._id | Field | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/incoming/IncomingWebhookForm.tsx:124` |
| `state.admin.incoming-webhook-form.189a1` | admin | !(errors?.channel) | null | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/incoming/IncomingWebhookForm.tsx:189` |
| `state.admin.incoming-webhook-form.189a0` | admin | errors?.channel | FieldError | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/incoming/IncomingWebhookForm.tsx:189` |
| `state.admin.incoming-webhook-form.220a1` | admin | !(errors?.username) | null | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/incoming/IncomingWebhookForm.tsx:220` |
| `state.admin.incoming-webhook-form.220a0` | admin | errors?.username | FieldError | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/incoming/IncomingWebhookForm.tsx:220` |
| `state.admin.edit-outgoing-webhook.131a1` | admin | !(webhookData?._id) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/EditOutgoingWebhook.tsx:131` |
| `state.admin.edit-outgoing-webhook.131a0` | admin | webhookData?._id | Button | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/EditOutgoingWebhook.tsx:131` |
| `state.admin.edit-outgoing-webhook.134a1` | admin | !(webhookData?._id) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/EditOutgoingWebhook.tsx:134` |
| `state.admin.edit-outgoing-webhook.134a0` | admin | webhookData?._id | Button | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/EditOutgoingWebhook.tsx:134` |
| `state.admin.edit-outgoing-webhook.141a1` | admin | !(!webhookData?._id) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/EditOutgoingWebhook.tsx:141` |
| `state.admin.edit-outgoing-webhook.141a0` | admin | !webhookData?._id | Tabs | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/EditOutgoingWebhook.tsx:141` |
| `state.admin.outgoing-webhook-form.158a1` | admin | !(showChannel) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:158` |
| `state.admin.outgoing-webhook-form.158a0` | admin | showChannel | Field | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:158` |
| `state.admin.outgoing-webhook-form.184a1` | admin | !(showTriggerWords) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:184` |
| `state.admin.outgoing-webhook-form.184a0` | admin | showTriggerWords | Field | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:184` |
| `state.admin.outgoing-webhook-form.206a1` | admin | !(showTargetRoom) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:206` |
| `state.admin.outgoing-webhook-form.206a0` | admin | showTargetRoom | Field | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:206` |
| `state.admin.outgoing-webhook-form.246a1` | admin | !(errors?.urls) | null | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:246` |
| `state.admin.outgoing-webhook-form.246a0` | admin | errors?.urls | FieldError | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:246` |
| `state.admin.outgoing-webhook-form.285a1` | admin | !(errors?.username) | null | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:285` |
| `state.admin.outgoing-webhook-form.285a0` | admin | errors?.username | FieldError | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:285` |
| `state.admin.outgoing-webhook-form.377a1` | admin | !(errors?.token) | null | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:377` |
| `state.admin.outgoing-webhook-form.377a0` | admin | errors?.token | FieldError | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:377` |
| `state.admin.outgoing-webhook-form.485a1` | admin | !(event === 'sendMessage') | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:485` |
| `state.admin.outgoing-webhook-form.485a0` | admin | event === 'sendMessage' | FieldGroup | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/OutgoingWebhookForm.tsx:485` |
| `state.admin.history-content.12i` | admin | isLoading | Box | 登录 admin → `/admin/integrations`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryContent.tsx:12` |
| `state.admin.history-content.25i` | admin | data.length < 1 | Box | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryContent.tsx:25` |
| `state.admin.history-content.29d` | admin | 前述 if-ret 均不成立（default return） | Box | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryContent.tsx:29` |
| `state.admin.history-item.111a1` | admin | !(dataSentToTrigger) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:111` |
| `state.admin.history-item.111a0` | admin | dataSentToTrigger | Field | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:111` |
| `state.admin.history-item.123a1` | admin | !(prepareSentMessage) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:123` |
| `state.admin.history-item.123a0` | admin | prepareSentMessage | Field | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:123` |
| `state.admin.history-item.135a1` | admin | !(processSentMessage) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:135` |
| `state.admin.history-item.135a0` | admin | processSentMessage | Field | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:135` |
| `state.admin.history-item.147a1` | admin | !(url) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:147` |
| `state.admin.history-item.147a0` | admin | url | Field | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:147` |
| `state.admin.history-item.157a1` | admin | !(httpCallData) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:157` |
| `state.admin.history-item.157a0` | admin | httpCallData | Field | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:157` |
| `state.admin.history-item.169a1` | admin | !(httpError) | null | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:169` |
| `state.admin.history-item.169a0` | admin | httpError | Field | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:169` |
| `state.admin.history-item.181a1` | admin | !(httpResult) | null | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:181` |
| `state.admin.history-item.181a0` | admin | httpResult | Field | 登录 admin → `/admin/integrations` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:181` |
| `state.admin.history-item.193a1` | admin | !(errorStack) | null | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:193` |
| `state.admin.history-item.193a0` | admin | errorStack | Field | 登录 admin → `/admin/integrations`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/integrations/outgoing/history/HistoryItem.tsx:193` |
| `state.admin.invite-row.72a1` | admin | !(notSmall) | null | 登录 admin → `/admin/invites` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InviteRow.tsx:72` |
| `state.admin.invite-row.72a0` | admin | notSmall | <> | 登录 admin → `/admin/invites` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InviteRow.tsx:72` |
| `state.admin.invites-page.75a1` | admin | !(notSmall) | null | 登录 admin → `/admin/invites` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:75` |
| `state.admin.invites-page.75a0` | admin | notSmall | <> | 登录 admin → `/admin/invites` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:75` |
| `state.admin.invites-page.94a1` | admin | !(isLoading) | null | 登录 admin → `/admin/invites`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:94` |
| `state.admin.invites-page.94a0` | admin | isLoading | GenericTable | 登录 admin → `/admin/invites`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:94` |
| `state.admin.invites-page.102a1` | admin | !(isSuccess && data && data.length > 0) | null | 登录 admin → `/admin/invites` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:102` |
| `state.admin.invites-page.102a0` | admin | isSuccess && data && data.length > 0 | GenericTable | 登录 admin → `/admin/invites` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:102` |
| `state.admin.invites-page.106a1` | admin | !(isLoading) | null | 登录 admin → `/admin/invites`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:106` |
| `state.admin.invites-page.106a0` | admin | isLoading | GenericTableLoadingTable | 登录 admin → `/admin/invites`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:106` |
| `state.admin.invites-page.113a1` | admin | !(isSuccess && data?.length === 0) | null | 登录 admin → `/admin/invites`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:113` |
| `state.admin.invites-page.113a0` | admin | isSuccess && data?.length === 0 | GenericNoResults | 登录 admin → `/admin/invites`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:113` |
| `state.admin.invites-page.114a1` | admin | !(isError) | null | 登录 admin → `/admin/invites`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:114` |
| `state.admin.invites-page.114a0` | admin | isError | States | 登录 admin → `/admin/invites`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesPage.tsx:114` |
| `state.admin.invites-route.9i` | admin | !canCreateInviteLinks | NotAuthorizedPage | 登录 admin → `/admin/invites` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesRoute.tsx:9` |
| `state.admin.invites-route.13d` | admin | 前述 if-ret 均不成立（default return） | InvitesPage | 登录 admin → `/admin/invites` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/invites/InvitesRoute.tsx:13` |
| `state.admin.mailer-page.96a1` | admin | !(errors.fromEmail) | null | 登录 admin → `/admin/mailer`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/mailer/MailerPage.tsx:96` |
| `state.admin.mailer-page.96a0` | admin | errors.fromEmail | FieldError | 登录 admin → `/admin/mailer`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/mailer/MailerPage.tsx:96` |
| `state.admin.mailer-page.128a1` | admin | !(errors.query) | null | 登录 admin → `/admin/mailer`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/mailer/MailerPage.tsx:128` |
| `state.admin.mailer-page.128a0` | admin | errors.query | FieldError | 登录 admin → `/admin/mailer`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/mailer/MailerPage.tsx:128` |
| `state.admin.mailer-page.149a1` | admin | !(errors.subject) | null | 登录 admin → `/admin/mailer`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/mailer/MailerPage.tsx:149` |
| `state.admin.mailer-page.149a0` | admin | errors.subject | FieldError | 登录 admin → `/admin/mailer`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/mailer/MailerPage.tsx:149` |
| `state.admin.mailer-page.173a1` | admin | !(errors.emailBody) | null | 登录 admin → `/admin/mailer`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/mailer/MailerPage.tsx:173` |
| `state.admin.mailer-page.173a0` | admin | errors.emailBody | FieldError | 登录 admin → `/admin/mailer`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/mailer/MailerPage.tsx:173` |
| `state.admin.mailer-route.9i` | admin | !canAccessMailer | NotAuthorizedPage | 登录 admin → `/admin/mailer` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/mailer/MailerRoute.tsx:9` |
| `state.admin.mailer-route.13d` | admin | 前述 if-ret 均不成立（default return） | MailerPage | 登录 admin → `/admin/mailer` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/mailer/MailerRoute.tsx:13` |
| `state.admin.message-report-info.33i` | admin | isLoadingReportsByMessage | Box | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/MessageReportInfo.tsx:33` |
| `state.admin.message-report-info.41i` | admin | isErrorReportsByMessage | Box | 登录 admin → `/admin/moderation`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/MessageReportInfo.tsx:41` |
| `state.admin.message-report-info.51d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/MessageReportInfo.tsx:51` |
| `state.admin.message-report-info.53a1` | admin | !(isSuccessReportsByMessage && reportsByMessage?.reports) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/MessageReportInfo.tsx:53` |
| `state.admin.message-report-info.53a0` | admin | isSuccessReportsByMessage && reportsByMessage?.reports | Box | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/MessageReportInfo.tsx:53` |
| `state.admin.mod-console-report-details.40a1` | admin | !(tab === 'messages') | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModConsoleReportDetails.tsx:40` |
| `state.admin.mod-console-report-details.40a0` | admin | tab === 'messages' | UserMessages | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModConsoleReportDetails.tsx:40` |
| `state.admin.mod-console-report-details.41a1` | admin | !(tab === 'users') | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModConsoleReportDetails.tsx:41` |
| `state.admin.mod-console-report-details.41a0` | admin | tab === 'users' | UserReportInfo | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModConsoleReportDetails.tsx:41` |
| `state.admin.moderation-console-page.54a1` | admin | !(tab === 'messages') | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsolePage.tsx:54` |
| `state.admin.moderation-console-page.54a0` | admin | tab === 'messages' | ModerationConsoleTable | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsolePage.tsx:54` |
| `state.admin.moderation-console-page.55a1` | admin | !(tab === 'users') | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsolePage.tsx:55` |
| `state.admin.moderation-console-page.55a0` | admin | tab === 'users' | ModConsoleUsersTable | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsolePage.tsx:55` |
| `state.admin.moderation-console-page.58a1` | admin | !(context === 'info' && id) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsolePage.tsx:58` |
| `state.admin.moderation-console-page.58a0` | admin | context === 'info' && id | ModConsoleReportDetails | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsolePage.tsx:58` |
| `state.admin.moderation-console-route.28i` | admin | !canViewModerationConsole | NotAuthorizedPage | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleRoute.tsx:28` |
| `state.admin.moderation-console-route.42d` | admin | 前述 if-ret 均不成立（default return） | ModerationConsolePage | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleRoute.tsx:42` |
| `state.admin.moderation-console-table.105a1` | admin | !(isLoading) | null | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleTable.tsx:105` |
| `state.admin.moderation-console-table.105a0` | admin | isLoading | GenericTable | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleTable.tsx:105` |
| `state.admin.moderation-console-table.108a1` | admin | !(isLoading) | null | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleTable.tsx:108` |
| `state.admin.moderation-console-table.108a0` | admin | isLoading | GenericTableLoadingTable | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleTable.tsx:108` |
| `state.admin.moderation-console-table.111a1` | admin | !(isSuccess && data.reports.length > 0) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleTable.tsx:111` |
| `state.admin.moderation-console-table.111a0` | admin | isSuccess && data.reports.length > 0 | <> | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleTable.tsx:111` |
| `state.admin.moderation-console-table.137a1` | admin | !(isSuccess && data.reports.length === 0) | null | 登录 admin → `/admin/moderation`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleTable.tsx:137` |
| `state.admin.moderation-console-table.137a0` | admin | isSuccess && data.reports.length === 0 | GenericNoResults | 登录 admin → `/admin/moderation`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/ModerationConsoleTable.tsx:137` |
| `state.admin.user-messages.42a1` | admin | !(isLoading) | null | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:42` |
| `state.admin.user-messages.42a0` | admin | isLoading | Message | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:42` |
| `state.admin.user-messages.43a1` | admin | !(isSuccess) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:43` |
| `state.admin.user-messages.43a0` | admin | isSuccess | Box | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:43` |
| `state.admin.user-messages.45a1` | admin | !(report.messages.length > 0) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:45` |
| `state.admin.user-messages.45a0` | admin | report.messages.length > 0 | Callout | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:45` |
| `state.admin.user-messages.50a1` | admin | !(!report.user) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:50` |
| `state.admin.user-messages.50a0` | admin | !report.user | Callout | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:50` |
| `state.admin.user-messages.70a1` | admin | !(isSuccess && report.messages.length === 0) | null | 登录 admin → `/admin/moderation`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:70` |
| `state.admin.user-messages.70a0` | admin | isSuccess && report.messages.length === 0 | GenericNoResults | 登录 admin → `/admin/moderation`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:70` |
| `state.admin.user-messages.71a1` | admin | !(isError) | null | 登录 admin → `/admin/moderation`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:71` |
| `state.admin.user-messages.71a0` | admin | isError | Box | 登录 admin → `/admin/moderation`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:71` |
| `state.admin.user-messages.81a1` | admin | !(isSuccess && report.messages.length > 0) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:81` |
| `state.admin.user-messages.81a0` | admin | isSuccess && report.messages.length > 0 | ContextualbarFooter | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserMessages.tsx:81` |
| `state.admin.mod-console-users-table.105a1` | admin | !(isLoading) | null | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:105` |
| `state.admin.mod-console-users-table.105a0` | admin | isLoading | GenericTable | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:105` |
| `state.admin.mod-console-users-table.108a1` | admin | !(isLoading) | null | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:108` |
| `state.admin.mod-console-users-table.108a0` | admin | isLoading | GenericTableLoadingTable | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:108` |
| `state.admin.mod-console-users-table.111a1` | admin | !(isSuccess && data.reports.length > 0) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:111` |
| `state.admin.mod-console-users-table.111a0` | admin | isSuccess && data.reports.length > 0 | <> | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:111` |
| `state.admin.mod-console-users-table.137a1` | admin | !(isSuccess && data.reports.length === 0) | null | 登录 admin → `/admin/moderation`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:137` |
| `state.admin.mod-console-users-table.137a0` | admin | isSuccess && data.reports.length === 0 | GenericNoResults | 登录 admin → `/admin/moderation`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:137` |
| `state.admin.mod-console-users-table.138a1` | admin | !(isError) | null | 登录 admin → `/admin/moderation`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:138` |
| `state.admin.mod-console-users-table.138a0` | admin | isError | States | 登录 admin → `/admin/moderation`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/ModConsoleUsersTable.tsx:138` |
| `state.admin.user-report-info.48i` | admin | !report?.user | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:48` |
| `state.admin.user-report-info.54d` | admin | 前述 if-ret 均不成立（default return） | UserColumn | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:54` |
| `state.admin.user-report-info.64i` | admin | isError | Box | 登录 admin → `/admin/moderation`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:64` |
| `state.admin.user-report-info.76i` | admin | isLoading | FormSkeleton | 登录 admin → `/admin/moderation`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:76` |
| `state.admin.user-report-info.80d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:80` |
| `state.admin.user-report-info.83a1` | admin | !(isSuccess && report.reports.length > 0) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:83` |
| `state.admin.user-report-info.83a0` | admin | isSuccess && report.reports.length > 0 | <> | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:83` |
| `state.admin.user-report-info.85t1` | admin | !(report.user) | Callout | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:85` |
| `state.admin.user-report-info.85t0` | admin | report.user | FieldGroup | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:85` |
| `state.admin.user-report-info.115a1` | admin | !(isSuccess && report.reports.length === 0) | null | 登录 admin → `/admin/moderation`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:115` |
| `state.admin.user-report-info.115a0` | admin | isSuccess && report.reports.length === 0 | GenericNoResults | 登录 admin → `/admin/moderation`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:115` |
| `state.admin.user-report-info.117a1` | admin | !(isSuccess && report.reports.length > 0) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:117` |
| `state.admin.user-report-info.117a0` | admin | isSuccess && report.reports.length > 0 | ContextualbarFooter | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/UserReports/UserReportInfo.tsx:117` |
| `state.admin.context-message.78a1` | admin | !(useRealName) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx:78` |
| `state.admin.context-message.78a0` | admin | useRealName | MessageUsername | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx:78` |
| `state.admin.context-message.86a1` | admin | !(!!quotes?.length) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx:86` |
| `state.admin.context-message.86a0` | admin | !!quotes?.length | Attachments | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx:86` |
| `state.admin.context-message.89a1` | admin | !((!isEncryptedMessage ¦¦ message.e2e === 'done')) | null | 登录 admin → `/admin/moderation`；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx:89` |
| `state.admin.context-message.89a0` | admin | (!isEncryptedMessage ¦¦ message.e2e === 'done') | MessageContentBody | 登录 admin → `/admin/moderation`；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx:89` |
| `state.admin.context-message.98a1` | admin | !(!!attachments) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx:98` |
| `state.admin.context-message.98a0` | admin | !!attachments | Attachments | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx:98` |
| `state.admin.context-message.99a1` | admin | !(message.blocks) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx:99` |
| `state.admin.context-message.99a0` | admin | message.blocks | UiKitMessageBlock | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/ContextMessage.tsx:99` |
| `state.admin.user-column.17a1` | admin | !(username) | null | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/UserColumn.tsx:17` |
| `state.admin.user-column.17a0` | admin | username | Box | 登录 admin → `/admin/moderation` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/moderation/helpers/UserColumn.tsx:17` |
| `state.admin.edit-oauth-app.127a1` | admin | !(errors?.name) | null | 登录 admin → `/admin/third-party-login`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/EditOauthApp.tsx:127` |
| `state.admin.edit-oauth-app.127a0` | admin | errors?.name | FieldError | 登录 admin → `/admin/third-party-login`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/EditOauthApp.tsx:127` |
| `state.admin.edit-oauth-app.135a1` | admin | !(errors?.redirectUri) | null | 登录 admin → `/admin/third-party-login`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/EditOauthApp.tsx:135` |
| `state.admin.edit-oauth-app.135a0` | admin | errors?.redirectUri | FieldError | 登录 admin → `/admin/third-party-login`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/EditOauthApp.tsx:135` |
| `state.admin.edit-oauth-app-with-data.32i` | admin | isPending | FormSkeleton | 登录 admin → `/admin/third-party-login`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/EditOauthAppWithData.tsx:32` |
| `state.admin.edit-oauth-app-with-data.36i` | admin | error ¦¦ !data ¦¦ !_id | Box | 登录 admin → `/admin/third-party-login`；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/EditOauthAppWithData.tsx:36` |
| `state.admin.edit-oauth-app-with-data.44d` | admin | 前述 if-ret 均不成立（default return） | EditOauthApp | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/EditOauthAppWithData.tsx:44` |
| `state.admin.oauth-add-app.77a1` | admin | !(errors?.name) | null | 登录 admin → `/admin/third-party-login`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAddApp.tsx:77` |
| `state.admin.oauth-add-app.77a0` | admin | errors?.name | FieldError | 登录 admin → `/admin/third-party-login`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAddApp.tsx:77` |
| `state.admin.oauth-add-app.85a1` | admin | !(errors?.redirectUri) | null | 登录 admin → `/admin/third-party-login`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAddApp.tsx:85` |
| `state.admin.oauth-add-app.85a0` | admin | errors?.redirectUri | FieldError | 登录 admin → `/admin/third-party-login`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAddApp.tsx:85` |
| `state.admin.oauth-apps-page.20a1` | admin | !(!context) | null | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsPage.tsx:20` |
| `state.admin.oauth-apps-page.20a0` | admin | !context | ButtonGroup | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsPage.tsx:20` |
| `state.admin.oauth-apps-page.29a1` | admin | !(!context) | null | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsPage.tsx:29` |
| `state.admin.oauth-apps-page.29a0` | admin | !context | OAuthAppsTable | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsPage.tsx:29` |
| `state.admin.oauth-apps-page.30a1` | admin | !(id && context === 'edit') | null | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsPage.tsx:30` |
| `state.admin.oauth-apps-page.30a0` | admin | id && context === 'edit' | EditOauthAppWithData | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsPage.tsx:30` |
| `state.admin.oauth-apps-page.31a1` | admin | !(context === 'new') | null | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsPage.tsx:31` |
| `state.admin.oauth-apps-page.31a0` | admin | context === 'new' | OAuthAddApp | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsPage.tsx:31` |
| `state.admin.oauth-apps-route.9i` | admin | !canAccessOAuthApps | NotAuthorizedPage | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsRoute.tsx:9` |
| `state.admin.oauth-apps-route.13d` | admin | 前述 if-ret 均不成立（default return） | OAuthAppsPage | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsRoute.tsx:13` |
| `state.admin.oauth-apps-table.54a1` | admin | !(isLoading) | null | 登录 admin → `/admin/third-party-login`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsTable.tsx:54` |
| `state.admin.oauth-apps-table.54a0` | admin | isLoading | GenericTable | 登录 admin → `/admin/third-party-login`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsTable.tsx:54` |
| `state.admin.oauth-apps-table.62a1` | admin | !(isSuccess && data?.oauthApps.length === 0) | null | 登录 admin → `/admin/third-party-login`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsTable.tsx:62` |
| `state.admin.oauth-apps-table.62a0` | admin | isSuccess && data?.oauthApps.length === 0 | GenericNoResults | 登录 admin → `/admin/third-party-login`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsTable.tsx:62` |
| `state.admin.oauth-apps-table.63a1` | admin | !(isSuccess && data?.oauthApps.length > 0) | null | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsTable.tsx:63` |
| `state.admin.oauth-apps-table.63a0` | admin | isSuccess && data?.oauthApps.length > 0 | GenericTable | 登录 admin → `/admin/third-party-login` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/oauthApps/OAuthAppsTable.tsx:63` |
| `state.admin.edit-role-page.116a1` | admin | !(!role?.protected && role?._id) | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/EditRolePage.tsx:116` |
| `state.admin.edit-role-page.116a0` | admin | !role?.protected && role?._id | Button | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/EditRolePage.tsx:116` |
| `state.admin.edit-role-page.121a1` | admin | !(role?._id) | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/EditRolePage.tsx:121` |
| `state.admin.edit-role-page.121a0` | admin | role?._id | Button | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/EditRolePage.tsx:121` |
| `state.admin.edit-role-page-with-data.20i` | admin | !role && context === 'edit' | Callout | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/EditRolePageWithData.tsx:20` |
| `state.admin.edit-role-page-with-data.24i` | admin | isPending | PageSkeleton | 登录 admin → `/admin/permissions`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/EditRolePageWithData.tsx:24` |
| `state.admin.edit-role-page-with-data.28i` | admin | isError | GenericError | 登录 admin → `/admin/permissions`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/EditRolePageWithData.tsx:28` |
| `state.admin.edit-role-page-with-data.32d` | admin | 前述 if-ret 均不成立（default return） | EditRolePage | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/EditRolePageWithData.tsx:32` |
| `state.admin.permissions-context-bar.36a1` | admin | !(context) | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsContextBar.tsx:36` |
| `state.admin.permissions-context-bar.36a0` | admin | context | ContextualbarDialog | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsContextBar.tsx:36` |
| `state.admin.permissions-router.19i` | admin | !canViewPermission && !canViewSettingPermission | NotAuthorizedPage | 登录 admin → `/admin/permissions`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsRouter.tsx:19` |
| `state.admin.permissions-router.23i` | admin | context === 'users-in-role' | UsersInRole | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsRouter.tsx:23` |
| `state.admin.permissions-router.27d` | admin | 前述 if-ret 均不成立（default return） | PermissionsPage | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsRouter.tsx:27` |
| `state.admin.permissions-table.81a1` | admin | !(permissions?.length === 0) | null | 登录 admin → `/admin/permissions`；空列表/无数据；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsTable/PermissionsTable.tsx:81` |
| `state.admin.permissions-table.81a0` | admin | permissions?.length === 0 | GenericNoResults | 登录 admin → `/admin/permissions`；空列表/无数据；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsTable/PermissionsTable.tsx:81` |
| `state.admin.permissions-table.82a1` | admin | !(permissions?.length > 0) | null | 登录 admin → `/admin/permissions`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsTable/PermissionsTable.tsx:82` |
| `state.admin.permissions-table.82a0` | admin | permissions?.length > 0 | <> | 登录 admin → `/admin/permissions`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsTable/PermissionsTable.tsx:82` |
| `state.admin.role-cell.61a1` | admin | !(!loading) | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsTable/RoleCell.tsx:61` |
| `state.admin.role-cell.61a0` | admin | !loading | Box | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsTable/RoleCell.tsx:61` |
| `state.admin.role-cell.66a1` | admin | !(loading) | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsTable/RoleCell.tsx:66` |
| `state.admin.role-cell.66a0` | admin | loading | Throbber | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/PermissionsTable/RoleCell.tsx:66` |
| `state.admin.role-form.43a1` | admin | !(errors?.name) | null | 登录 admin → `/admin/permissions`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/RoleForm.tsx:43` |
| `state.admin.role-form.43a0` | admin | errors?.name | FieldError | 登录 admin → `/admin/permissions`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/RoleForm.tsx:43` |
| `state.admin.users-in-role-page.93a1` | admin | !(role.scope !== 'Users') | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:93` |
| `state.admin.users-in-role-page.93a0` | admin | role.scope !== 'Users' | Field | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:93` |
| `state.admin.users-in-role-page.115a1` | admin | !(errors.rid) | null | 登录 admin → `/admin/permissions`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:115` |
| `state.admin.users-in-role-page.115a0` | admin | errors.rid | FieldError | 登录 admin → `/admin/permissions`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:115` |
| `state.admin.users-in-role-page.145a1` | admin | !(errors.users) | null | 登录 admin → `/admin/permissions`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:145` |
| `state.admin.users-in-role-page.145a0` | admin | errors.users | FieldRow | 登录 admin → `/admin/permissions`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:145` |
| `state.admin.users-in-role-page.156a1` | admin | !((role.scope === 'Users' ¦¦ rid)) | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:156` |
| `state.admin.users-in-role-page.156a0` | admin | (role.scope === 'Users' ¦¦ rid) | UsersInRoleTable | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:156` |
| `state.admin.users-in-role-page.168a1` | admin | !(role.scope !== 'Users' && !rid) | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:168` |
| `state.admin.users-in-role-page.168a0` | admin | role.scope !== 'Users' && !rid | Callout | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePage.tsx:168` |
| `state.admin.users-in-role-page-with-data.10i` | admin | !role | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePageWithData.tsx:10` |
| `state.admin.users-in-role-page-with-data.14d` | admin | 前述 if-ret 均不成立（default return） | UsersInRolePage | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRolePageWithData.tsx:14` |
| `state.admin.users-in-role-table.42a1` | admin | !(isLoading) | null | 登录 admin → `/admin/permissions`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTable.tsx:42` |
| `state.admin.users-in-role-table.42a0` | admin | isLoading | GenericTable | 登录 admin → `/admin/permissions`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTable.tsx:42` |
| `state.admin.users-in-role-table.50a1` | admin | !(isSuccess && users?.length > 0) | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTable.tsx:50` |
| `state.admin.users-in-role-table.50a0` | admin | isSuccess && users?.length > 0 | <> | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTable.tsx:50` |
| `state.admin.users-in-role-table.71a1` | admin | !(isSuccess && users?.length === 0) | null | 登录 admin → `/admin/permissions`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTable.tsx:71` |
| `state.admin.users-in-role-table.71a0` | admin | isSuccess && users?.length === 0 | GenericNoResults | 登录 admin → `/admin/permissions`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTable.tsx:71` |
| `state.admin.users-in-role-table.72a1` | admin | !(isError) | null | 登录 admin → `/admin/permissions`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTable.tsx:72` |
| `state.admin.users-in-role-table.72a0` | admin | isError | GenericError | 登录 admin → `/admin/permissions`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTable.tsx:72` |
| `state.admin.users-in-role-table-row.34a1` | admin | !(name) | null | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTableRow.tsx:34` |
| `state.admin.users-in-role-table-row.34a0` | admin | name | Box | 登录 admin → `/admin/permissions` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/permissions/UsersInRole/UsersInRoleTable/UsersInRoleTableRow.tsx:34` |
| `state.admin.edit-room.143a1` | admin | !(room.t !== 'd') | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:143` |
| `state.admin.edit-room.143a0` | admin | room.t !== 'd' | Box | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:143` |
| `state.admin.edit-room.175a1` | admin | !(errors?.roomName) | null | 登录 admin → `/admin/rooms`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:175` |
| `state.admin.edit-room.175a0` | admin | errors?.roomName | FieldError | 登录 admin → `/admin/rooms`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:175` |
| `state.admin.edit-room.181a1` | admin | !(room.t !== 'd') | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:181` |
| `state.admin.edit-room.181a0` | admin | room.t !== 'd' | <> | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:181` |
| `state.admin.edit-room.183a1` | admin | !(room.u) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:183` |
| `state.admin.edit-room.183a0` | admin | room.u | Field | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:183` |
| `state.admin.edit-room.191a1` | admin | !(canViewDescription) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:191` |
| `state.admin.edit-room.191a0` | admin | canViewDescription | Field | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:191` |
| `state.admin.edit-room.205a1` | admin | !(canViewAnnouncement) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:205` |
| `state.admin.edit-room.205a0` | admin | canViewAnnouncement | Field | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:205` |
| `state.admin.edit-room.219a1` | admin | !(canViewTopic) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:219` |
| `state.admin.edit-room.219a0` | admin | canViewTopic | Field | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:219` |
| `state.admin.edit-room.231a1` | admin | !(canViewType) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:231` |
| `state.admin.edit-room.231a0` | admin | canViewType | Field | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:231` |
| `state.admin.edit-room.253a1` | admin | !(canViewReadOnly) | null | 登录 admin → `/admin/rooms`；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:253` |
| `state.admin.edit-room.253a0` | admin | canViewReadOnly | Field | 登录 admin → `/admin/rooms`；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:253` |
| `state.admin.edit-room.274a1` | admin | !(canViewReactWhenReadOnly && readOnly) | null | 登录 admin → `/admin/rooms`；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:274` |
| `state.admin.edit-room.274a0` | admin | canViewReactWhenReadOnly && readOnly | Field | 登录 admin → `/admin/rooms`；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:274` |
| `state.admin.edit-room.294a1` | admin | !(canViewArchived) | null | 登录 admin → `/admin/rooms`；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:294` |
| `state.admin.edit-room.294a0` | admin | canViewArchived | Field | 登录 admin → `/admin/rooms`；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoom.tsx:294` |
| `state.admin.edit-room-with-data.27i` | admin | isPending | ContextualbarSkeletonBody | 登录 admin → `/admin/rooms`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoomWithData.tsx:27` |
| `state.admin.edit-room-with-data.40t1` | admin | !(data) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoomWithData.tsx:40` |
| `state.admin.edit-room-with-data.40t0` | admin | data | ContextualbarHeader | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/EditRoomWithData.tsx:40` |
| `state.admin.room-row.75a1` | admin | !(icon) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomRow.tsx:75` |
| `state.admin.room-row.75a0` | admin | icon | Icon | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomRow.tsx:75` |
| `state.admin.room-row.88a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomRow.tsx:88` |
| `state.admin.room-row.88a0` | admin | mediaQuery | GenericTableCell | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomRow.tsx:88` |
| `state.admin.room-row.89a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomRow.tsx:89` |
| `state.admin.room-row.89a0` | admin | mediaQuery | GenericTableCell | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomRow.tsx:89` |
| `state.admin.room-row.90a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomRow.tsx:90` |
| `state.admin.room-row.90a0` | admin | mediaQuery | GenericTableCell | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomRow.tsx:90` |
| `state.admin.room-row.91a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomRow.tsx:91` |
| `state.admin.room-row.91a0` | admin | mediaQuery | GenericTableCell | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomRow.tsx:91` |
| `state.admin.rooms-page.27a1` | admin | !(context) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsPage.tsx:27` |
| `state.admin.rooms-page.27a0` | admin | context | ContextualbarDialog | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsPage.tsx:27` |
| `state.admin.rooms-route.9i` | admin | !canViewRoomAdministration | NotAuthorizedPage | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsRoute.tsx:9` |
| `state.admin.rooms-route.13d` | admin | 前述 if-ret 均不成立（default return） | RoomsPage | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsRoute.tsx:13` |
| `state.admin.rooms-table.98a1` | admin | !(mediaQuery) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:98` |
| `state.admin.rooms-table.98a0` | admin | mediaQuery | <> | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:98` |
| `state.admin.rooms-table.141a1` | admin | !(isLoading) | null | 登录 admin → `/admin/rooms`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:141` |
| `state.admin.rooms-table.141a0` | admin | isLoading | GenericTable | 登录 admin → `/admin/rooms`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:141` |
| `state.admin.rooms-table.149a1` | admin | !(isSuccess && data.rooms.length === 0) | null | 登录 admin → `/admin/rooms`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:149` |
| `state.admin.rooms-table.149a0` | admin | isSuccess && data.rooms.length === 0 | GenericNoResults | 登录 admin → `/admin/rooms`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:149` |
| `state.admin.rooms-table.150a1` | admin | !(isSuccess && data.rooms.length > 0) | null | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:150` |
| `state.admin.rooms-table.150a0` | admin | isSuccess && data.rooms.length > 0 | <> | 登录 admin → `/admin/rooms` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:150` |
| `state.admin.rooms-table.167a1` | admin | !(isError) | null | 登录 admin → `/admin/rooms`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:167` |
| `state.admin.rooms-table.167a0` | admin | isError | States | 登录 admin → `/admin/rooms`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/rooms/RoomsTable.tsx:167` |
| `state.admin.memoized-setting.86i` | admin | invisible | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/MemoizedSetting.tsx:86` |
| `state.admin.memoized-setting.92d` | admin | 前述 if-ret 均不成立（default return） | Field | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/MemoizedSetting.tsx:92` |
| `state.admin.memoized-setting.104a1` | admin | !(callout) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/MemoizedSetting.tsx:104` |
| `state.admin.memoized-setting.104a0` | admin | callout | Margins | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/MemoizedSetting.tsx:104` |
| `state.admin.setting.121a1` | admin | !(alert) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/Setting.tsx:121` |
| `state.admin.setting.121a0` | admin | alert | Trans | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/Setting.tsx:121` |
| `state.admin.action-input-base.35a1` | admin | !(sectionChanged) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ActionInputBase.tsx:35` |
| `state.admin.action-input-base.35a0` | admin | sectionChanged | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ActionInputBase.tsx:35` |
| `state.admin.action-input-base.36a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ActionInputBase.tsx:36` |
| `state.admin.action-input-base.36a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ActionInputBase.tsx:36` |
| `state.admin.action-setting-input.17i` | admin | isActionSettingWithEndpoint(value) | EndpointActionInput | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ActionSettingInput.tsx:17` |
| `state.admin.action-setting-input.21d` | admin | 前述 if-ret 均不成立（default return） | MethodActionInput | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ActionSettingInput.tsx:21` |
| `state.admin.asset-setting-input.102t1` | admin | !(value?.url) | div | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/AssetSettingInput.tsx:102` |
| `state.admin.asset-setting-input.102t0` | admin | value?.url | div | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/AssetSettingInput.tsx:102` |
| `state.admin.asset-setting-input.115t1` | admin | !(value?.url) | Box | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/AssetSettingInput.tsx:115` |
| `state.admin.asset-setting-input.115t0` | admin | value?.url | Button | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/AssetSettingInput.tsx:115` |
| `state.admin.asset-setting-input.128a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/AssetSettingInput.tsx:128` |
| `state.admin.asset-setting-input.128a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/AssetSettingInput.tsx:128` |
| `state.admin.boolean-setting-input.33a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/BooleanSettingInput.tsx:33` |
| `state.admin.boolean-setting-input.33a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/BooleanSettingInput.tsx:33` |
| `state.admin.boolean-setting-input.37a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/BooleanSettingInput.tsx:37` |
| `state.admin.boolean-setting-input.37a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/BooleanSettingInput.tsx:37` |
| `state.admin.code-mirror-box.46a1` | admin | !(error) | null | 登录 admin → `/admin/settings`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/CodeMirror/CodeMirrorBox.tsx:46` |
| `state.admin.code-mirror-box.46a0` | admin | error | FieldError | 登录 admin → `/admin/settings`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/CodeMirror/CodeMirrorBox.tsx:46` |
| `state.admin.code-mirror-box.77a1` | admin | !(error) | null | 登录 admin → `/admin/settings`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/CodeMirror/CodeMirrorBox.tsx:77` |
| `state.admin.code-mirror-box.77a0` | admin | error | FieldError | 登录 admin → `/admin/settings`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/CodeMirror/CodeMirrorBox.tsx:77` |
| `state.admin.code-setting-input.45a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/CodeSettingInput.tsx:45` |
| `state.admin.code-setting-input.45a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/CodeSettingInput.tsx:45` |
| `state.admin.code-setting-input.47a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/CodeSettingInput.tsx:47` |
| `state.admin.code-setting-input.47a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/CodeSettingInput.tsx:47` |
| `state.admin.color-setting-input.56a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ColorSettingInput.tsx:56` |
| `state.admin.color-setting-input.56a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ColorSettingInput.tsx:56` |
| `state.admin.color-setting-input.62a1` | admin | !(editor === 'color') | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ColorSettingInput.tsx:62` |
| `state.admin.color-setting-input.62a0` | admin | editor === 'color' | InputBox | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ColorSettingInput.tsx:62` |
| `state.admin.color-setting-input.74a1` | admin | !(editor === 'expression') | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ColorSettingInput.tsx:74` |
| `state.admin.color-setting-input.74a0` | admin | editor === 'expression' | TextInput | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ColorSettingInput.tsx:74` |
| `state.admin.color-setting-input.100a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ColorSettingInput.tsx:100` |
| `state.admin.color-setting-input.100a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/ColorSettingInput.tsx:100` |
| `state.admin.font-setting-input.35a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/FontSettingInput.tsx:35` |
| `state.admin.font-setting-input.35a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/FontSettingInput.tsx:35` |
| `state.admin.font-setting-input.48a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/FontSettingInput.tsx:48` |
| `state.admin.font-setting-input.48a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/FontSettingInput.tsx:48` |
| `state.admin.generic-setting-input.35a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/GenericSettingInput.tsx:35` |
| `state.admin.generic-setting-input.35a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/GenericSettingInput.tsx:35` |
| `state.admin.generic-setting-input.48a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/GenericSettingInput.tsx:48` |
| `state.admin.generic-setting-input.48a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/GenericSettingInput.tsx:48` |
| `state.admin.int-setting-input.35a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/IntSettingInput.tsx:35` |
| `state.admin.int-setting-input.35a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/IntSettingInput.tsx:35` |
| `state.admin.int-setting-input.49a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/IntSettingInput.tsx:49` |
| `state.admin.int-setting-input.49a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/IntSettingInput.tsx:49` |
| `state.admin.language-setting-input.35a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/LanguageSettingInput.tsx:35` |
| `state.admin.language-setting-input.35a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/LanguageSettingInput.tsx:35` |
| `state.admin.language-setting-input.49a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/LanguageSettingInput.tsx:49` |
| `state.admin.language-setting-input.49a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/LanguageSettingInput.tsx:49` |
| `state.admin.lookup-setting-input.48a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/LookupSettingInput.tsx:48` |
| `state.admin.lookup-setting-input.48a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/LookupSettingInput.tsx:48` |
| `state.admin.lookup-setting-input.62a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/LookupSettingInput.tsx:62` |
| `state.admin.lookup-setting-input.62a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/LookupSettingInput.tsx:62` |
| `state.admin.multi-select-setting-input.41a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/MultiSelectSettingInput.tsx:41` |
| `state.admin.multi-select-setting-input.41a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/MultiSelectSettingInput.tsx:41` |
| `state.admin.multi-select-setting-input.57a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/MultiSelectSettingInput.tsx:57` |
| `state.admin.multi-select-setting-input.57a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/MultiSelectSettingInput.tsx:57` |
| `state.admin.password-setting-input.33a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/PasswordSettingInput.tsx:33` |
| `state.admin.password-setting-input.33a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/PasswordSettingInput.tsx:33` |
| `state.admin.password-setting-input.46a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/PasswordSettingInput.tsx:46` |
| `state.admin.password-setting-input.46a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/PasswordSettingInput.tsx:46` |
| `state.admin.range-setting-input.32a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RangeSettingInput.tsx:32` |
| `state.admin.range-setting-input.32a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RangeSettingInput.tsx:32` |
| `state.admin.range-setting-input.34a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RangeSettingInput.tsx:34` |
| `state.admin.range-setting-input.34a0` | admin | hint | FieldRow | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RangeSettingInput.tsx:34` |
| `state.admin.relative-url-setting-input.36a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RelativeUrlSettingInput.tsx:36` |
| `state.admin.relative-url-setting-input.36a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RelativeUrlSettingInput.tsx:36` |
| `state.admin.relative-url-setting-input.49a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RelativeUrlSettingInput.tsx:49` |
| `state.admin.relative-url-setting-input.49a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RelativeUrlSettingInput.tsx:49` |
| `state.admin.room-pick-setting-input.38a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RoomPickSettingInput.tsx:38` |
| `state.admin.room-pick-setting-input.38a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RoomPickSettingInput.tsx:38` |
| `state.admin.room-pick-setting-input.49a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RoomPickSettingInput.tsx:49` |
| `state.admin.room-pick-setting-input.49a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/RoomPickSettingInput.tsx:49` |
| `state.admin.select-setting-input.39a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/SelectSettingInput.tsx:39` |
| `state.admin.select-setting-input.39a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/SelectSettingInput.tsx:39` |
| `state.admin.select-setting-input.53a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/SelectSettingInput.tsx:53` |
| `state.admin.select-setting-input.53a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/SelectSettingInput.tsx:53` |
| `state.admin.select-timezone-setting-input.36a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/SelectTimezoneSettingInput.tsx:36` |
| `state.admin.select-timezone-setting-input.36a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/SelectTimezoneSettingInput.tsx:36` |
| `state.admin.select-timezone-setting-input.50a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/SelectTimezoneSettingInput.tsx:50` |
| `state.admin.select-timezone-setting-input.50a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/SelectTimezoneSettingInput.tsx:50` |
| `state.admin.string-setting-input.40a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/StringSettingInput.tsx:40` |
| `state.admin.string-setting-input.40a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/StringSettingInput.tsx:40` |
| `state.admin.string-setting-input.43t1` | admin | !(multiline) | TextInput | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/StringSettingInput.tsx:43` |
| `state.admin.string-setting-input.43t0` | admin | multiline | TextAreaInput | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/StringSettingInput.tsx:43` |
| `state.admin.string-setting-input.70a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/StringSettingInput.tsx:70` |
| `state.admin.string-setting-input.70a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/StringSettingInput.tsx:70` |
| `state.admin.timespan-setting-input.91a1` | admin | !(hasResetButton) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/TimespanSettingInput.tsx:91` |
| `state.admin.timespan-setting-input.91a0` | admin | hasResetButton | ResetSettingButton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/TimespanSettingInput.tsx:91` |
| `state.admin.timespan-setting-input.108a1` | admin | !(hint) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/TimespanSettingInput.tsx:108` |
| `state.admin.timespan-setting-input.108a0` | admin | hint | FieldHint | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/Setting/inputs/TimespanSettingInput.tsx:108` |
| `state.admin.settings-group-card.35a1` | admin | !(description && i18n.exists(description)) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupCard.tsx:35` |
| `state.admin.settings-group-card.35a0` | admin | description && i18n.exists(description) | MarkdownText | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupCard.tsx:35` |
| `state.admin.settings-group-page.134i` | admin | !_id | Page | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupPage/SettingsGroupPage.tsx:134` |
| `state.admin.settings-group-page.140d` | admin | 前述 if-ret 均不成立（default return） | Page | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupPage/SettingsGroupPage.tsx:140` |
| `state.admin.settings-group-page.151a1` | admin | !(i18nDescription && isTranslationKey(i18nDescription) && i18n.exists(i18nDescription)) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupPage/SettingsGroupPage.tsx:151` |
| `state.admin.settings-group-page.151a0` | admin | i18nDescription && isTranslationKey(i18nDescription) && i18n.exists(i18nDescription) | Box | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupPage/SettingsGroupPage.tsx:151` |
| `state.admin.settings-group-page.163a1` | admin | !(changedEditableSettings.length > 0) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupPage/SettingsGroupPage.tsx:163` |
| `state.admin.settings-group-page.163a0` | admin | changedEditableSettings.length > 0 | Button | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupPage/SettingsGroupPage.tsx:163` |
| `state.admin.settings-group-selector.18i` | admin | !group | SettingsGroupPageSkeleton | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupSelector/SettingsGroupSelector.tsx:18` |
| `state.admin.settings-group-selector.22i` | admin | groupId === 'OAuth' | OAuthGroupPage | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupSelector/SettingsGroupSelector.tsx:22` |
| `state.admin.settings-group-selector.26i` | admin | groupId === 'LDAP' | LDAPGroupPage | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupSelector/SettingsGroupSelector.tsx:26` |
| `state.admin.settings-group-selector.30i` | admin | groupId === 'Assets' | BaseGroupPage | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupSelector/SettingsGroupSelector.tsx:30` |
| `state.admin.settings-group-selector.34i` | admin | groupId === 'Enterprise' | EnterpriseGroupPage | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupSelector/SettingsGroupSelector.tsx:34` |
| `state.admin.settings-group-selector.38d` | admin | 前述 if-ret 均不成立（default return） | BaseGroupPage | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsGroupSelector/SettingsGroupSelector.tsx:38` |
| `state.admin.settings-page.49a1` | admin | !(!groups.length) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsPage.tsx:49` |
| `state.admin.settings-page.49a0` | admin | !groups.length | GenericNoResults | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsPage.tsx:49` |
| `state.admin.settings-route.13i` | admin | !hasPermission | NotAuthorizedPage | 登录 admin → `/admin/settings`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsRoute.tsx:13` |
| `state.admin.settings-route.17i` | admin | !groupId | SettingsPage | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsRoute.tsx:17` |
| `state.admin.settings-route.21d` | admin | 前述 if-ret 均不成立（default return） | EditableSettingsProvider | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsRoute.tsx:21` |
| `state.admin.settings-section.80a1` | admin | !(help) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsSection/SettingsSection.tsx:80` |
| `state.admin.settings-section.80a0` | admin | help | Box | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsSection/SettingsSection.tsx:80` |
| `state.admin.settings-section.87a1` | admin | !(isSetting(setting)) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsSection/SettingsSection.tsx:87` |
| `state.admin.settings-section.87a0` | admin | isSetting(setting) | Setting | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsSection/SettingsSection.tsx:87` |
| `state.admin.settings-section.92a1` | admin | !(hasReset && canReset) | null | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsSection/SettingsSection.tsx:92` |
| `state.admin.settings-section.92a0` | admin | hasReset && canReset | Button | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/SettingsSection/SettingsSection.tsx:92` |
| `state.admin.base-group-page.18i` | admin | tabs.length > 1 | TabbedGroupPage | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/groups/BaseGroupPage.tsx:18` |
| `state.admin.base-group-page.24d` | admin | 前述 if-ret 均不成立（default return） | GenericGroupPage | 登录 admin → `/admin/settings` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/groups/BaseGroupPage.tsx:24` |
| `state.admin.create-oauth-modal.51a1` | admin | !(errors.customOAuthName) | null | 登录 admin → `/admin/settings`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/groups/OAuthGroupPage/CreateOAuthModal.tsx:51` |
| `state.admin.create-oauth-modal.51a0` | admin | errors.customOAuthName | FieldError | 登录 admin → `/admin/settings`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/settings/groups/OAuthGroupPage/CreateOAuthModal.tsx:51` |
| `state.admin.subscription-callout-limits.16i` | admin | !licenseLimits | null | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionCalloutLimits.tsx:16` |
| `state.admin.subscription-callout-limits.24d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionCalloutLimits.tsx:24` |
| `state.admin.subscription-callout-limits.26a1` | admin | !(start_fair_policy) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionCalloutLimits.tsx:26` |
| `state.admin.subscription-callout-limits.26a0` | admin | start_fair_policy | Callout | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionCalloutLimits.tsx:26` |
| `state.admin.subscription-callout-limits.48a1` | admin | !(prevent_action) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionCalloutLimits.tsx:48` |
| `state.admin.subscription-callout-limits.48a0` | admin | prevent_action | Callout | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionCalloutLimits.tsx:48` |
| `state.admin.subscription-callout-limits.70a1` | admin | !(disable_modules) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionCalloutLimits.tsx:70` |
| `state.admin.subscription-callout-limits.70a0` | admin | disable_modules | Callout | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionCalloutLimits.tsx:70` |
| `state.admin.subscription-callout-limits.92a1` | admin | !(invalidate_license) | null | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionCalloutLimits.tsx:92` |
| `state.admin.subscription-callout-limits.92a0` | admin | invalidate_license | Callout | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionCalloutLimits.tsx:92` |
| `state.admin.subscription-page.110a1` | admin | !(canViewRegistrationStatus) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:110` |
| `state.admin.subscription-page.110a0` | admin | canViewRegistrationStatus | Button | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:110` |
| `state.admin.subscription-page.120a1` | admin | !(cloudSyncAnnouncement) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:120` |
| `state.admin.subscription-page.120a0` | admin | cloudSyncAnnouncement | PageBlockWithBorder | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:120` |
| `state.admin.subscription-page.126a1` | admin | !((showSubscriptionCallout ¦¦ syncLicenseUpdate.isPending)) | null | 登录 admin → `/admin/subscription`；等查询 in-flight；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:126` |
| `state.admin.subscription-page.126a0` | admin | (showSubscriptionCallout ¦¦ syncLicenseUpdate.isPending) | Callout | 登录 admin → `/admin/subscription`；等查询 in-flight；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:126` |
| `state.admin.subscription-page.132a1` | admin | !(isLicenseLoading) | null | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:132` |
| `state.admin.subscription-page.132a0` | admin | isLicenseLoading | SubscriptionPageSkeleton | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:132` |
| `state.admin.subscription-page.133a1` | admin | !(!isLicenseLoading) | null | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:133` |
| `state.admin.subscription-page.133a0` | admin | !isLicenseLoading | <> | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:133` |
| `state.admin.subscription-page.135a1` | admin | !(showLicense) | null | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:135` |
| `state.admin.subscription-page.135a0` | admin | showLicense | Accordion | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:135` |
| `state.admin.subscription-page.152a1` | admin | !(seatsLimit.value !== undefined) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:152` |
| `state.admin.subscription-page.152a0` | admin | seatsLimit.value !== undefined | GridItem | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:152` |
| `state.admin.subscription-page.154t1` | admin | !(seatsLimit.max !== Infinity) | CountSeatsCard | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:154` |
| `state.admin.subscription-page.154t0` | admin | seatsLimit.max !== Infinity | SeatsCard | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:154` |
| `state.admin.subscription-page.162a1` | admin | !(macLimit.value !== undefined) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:162` |
| `state.admin.subscription-page.162a0` | admin | macLimit.value !== undefined | GridItem | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:162` |
| `state.admin.subscription-page.164t1` | admin | !(macLimit.max !== Infinity) | CountMACCard | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:164` |
| `state.admin.subscription-page.164t0` | admin | macLimit.max !== Infinity | MACCard | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:164` |
| `state.admin.subscription-page.172a1` | admin | !(!license) | null | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:172` |
| `state.admin.subscription-page.172a0` | admin | !license | <> | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:172` |
| `state.admin.subscription-page.174a1` | admin | !(limits?.marketplaceApps !== undefined) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:174` |
| `state.admin.subscription-page.174a0` | admin | limits?.marketplaceApps !== undefined | GridItem | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:174` |
| `state.admin.subscription-page.190a1` | admin | !(Boolean(licensesData?.license?.information.cancellable)) | null | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:190` |
| `state.admin.subscription-page.190a0` | admin | Boolean(licensesData?.license?.information.cancellable) | Button | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionPage.tsx:190` |
| `state.admin.subscription-route.10i` | admin | !canViewSubscription | NotAuthorizedPage | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionRoute.tsx:10` |
| `state.admin.subscription-route.14d` | admin | 前述 if-ret 均不成立（default return） | SubscriptionPage | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/SubscriptionRoute.tsx:14` |
| `state.admin.feature-usage-card.24a1` | admin | !(infoText) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/FeatureUsageCard.tsx:24` |
| `state.admin.feature-usage-card.24a0` | admin | infoText | InfoTextIconModal | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/FeatureUsageCard.tsx:24` |
| `state.admin.feature-usage-card.27a1` | admin | !(upgradeButton) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/FeatureUsageCard.tsx:27` |
| `state.admin.feature-usage-card.27a0` | admin | upgradeButton | CardControls | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/FeatureUsageCard.tsx:27` |
| `state.admin.upgrade-to-get-more.38i` | admin | upgradeModules?.length === 0 | ButtonGroup | 登录 admin → `/admin/subscription`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/UpgradeToGetMore.tsx:38` |
| `state.admin.upgrade-to-get-more.46d` | admin | 前述 if-ret 均不成立（default return） | Box | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/UpgradeToGetMore.tsx:46` |
| `state.admin.usage-pie-graph.100a1` | admin | !(label) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/UsagePieGraph.tsx:100` |
| `state.admin.usage-pie-graph.100a0` | admin | label | Box | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/UsagePieGraph.tsx:100` |
| `state.admin.active-sessions-card.34i` | admin | result.isPending ¦¦ result.isError | FeatureUsageCard | 登录 admin → `/admin/subscription`；等查询 in-flight；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/ActiveSessionsCard.tsx:34` |
| `state.admin.active-sessions-card.46d` | admin | 前述 if-ret 均不成立（default return） | FeatureUsageCard | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/ActiveSessionsCard.tsx:46` |
| `state.admin.active-sessions-peak-card.35i` | admin | isLoading ¦¦ maxMonthlyPeakConnections === undefined | FeatureUsageCard | 登录 admin → `/admin/subscription`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/ActiveSessionsPeakCard.tsx:35` |
| `state.admin.active-sessions-peak-card.45d` | admin | 前述 if-ret 均不成立（default return） | FeatureUsageCard | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/ActiveSessionsPeakCard.tsx:45` |
| `state.admin.apps-usage-card.25i` | admin | !privateAppsLimit ¦¦ !marketplaceAppsLimit | FeatureUsageCard | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/AppsUsageCard/AppsUsageCard.tsx:25` |
| `state.admin.apps-usage-card.63d` | admin | 前述 if-ret 均不成立（default return） | FeatureUsageCard | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/AppsUsageCard/AppsUsageCard.tsx:63` |
| `state.admin.features-card.76a1` | admin | !(infoText) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/FeaturesCard.tsx:76` |
| `state.admin.features-card.76a0` | admin | infoText | InfoTextIconModal | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/FeaturesCard.tsx:76` |
| `state.admin.plan-card.19i` | admin | !license | PlanCardCommunity | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard.tsx:19` |
| `state.admin.plan-card.23t1` | admin | !(isTrial) | PlanCardPremium | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard.tsx:23` |
| `state.admin.plan-card.23t0` | admin | isTrial | PlanCardTrial | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard.tsx:23` |
| `state.admin.license-status.13i` | admin | isValidating | Callout | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/LicenseStatus.tsx:13` |
| `state.admin.license-status.21i` | admin | isValid | Callout | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/LicenseStatus.tsx:21` |
| `state.admin.license-status.29d` | admin | 前述 if-ret 均不成立（default return） | Callout | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/LicenseStatus.tsx:29` |
| `state.admin.manage-license-modal.93i` | admin | isConfirmingRemoval | GenericModal | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx:93` |
| `state.admin.manage-license-modal.113d` | admin | 前述 if-ret 均不成立（default return） | GenericModal | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx:113` |
| `state.admin.manage-license-modal.139a1` | admin | !(selectedFile) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx:139` |
| `state.admin.manage-license-modal.139a0` | admin | selectedFile | LicenseFilePreview | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx:139` |
| `state.admin.manage-license-modal.166a1` | admin | !(isCurrentLicense) | null | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx:166` |
| `state.admin.manage-license-modal.166a0` | admin | isCurrentLicense | Button | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx:166` |
| `state.admin.manage-license-modal.172a1` | admin | !(showStatus) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx:172` |
| `state.admin.manage-license-modal.172a0` | admin | showStatus | Box | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/ManageLicenseModal/ManageLicenseModal.tsx:172` |
| `state.admin.plan-card-license-details.28i` | admin | !hasPermission | null | 登录 admin → `/admin/subscription`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardLicenseDetails.tsx:28` |
| `state.admin.plan-card-license-details.32d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardLicenseDetails.tsx:32` |
| `state.admin.plan-card-license-details.38t1` | admin | !(hasCopiedSiteURL) | IconButton | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardLicenseDetails.tsx:38` |
| `state.admin.plan-card-license-details.38t0` | admin | hasCopiedSiteURL | IconButton | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardLicenseDetails.tsx:38` |
| `state.admin.plan-card-license-details.51t1` | admin | !(hasCopiedHashed) | IconButton | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardLicenseDetails.tsx:51` |
| `state.admin.plan-card-license-details.51t0` | admin | hasCopiedHashed | IconButton | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardLicenseDetails.tsx:51` |
| `state.admin.plan-card-premium.35a1` | admin | !(licenseLimits?.activeUsers.max === Infinity) | null | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardPremium.tsx:35` |
| `state.admin.plan-card-premium.35a0` | admin | licenseLimits?.activeUsers.max === Infinity | Box | 登录 admin → `/admin/subscription`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardPremium.tsx:35` |
| `state.admin.plan-card-premium.41a1` | admin | !(visualExpiration) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardPremium.tsx:41` |
| `state.admin.plan-card-premium.41a0` | admin | visualExpiration | Box | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardPremium.tsx:41` |
| `state.admin.plan-card-premium.55t1` | admin | !(!isLoading) | Skeleton | 登录 admin → `/admin/subscription`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardPremium.tsx:55` |
| `state.admin.plan-card-premium.55t0` | admin | !isLoading | Box | 登录 admin → `/admin/subscription`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardPremium.tsx:55` |
| `state.admin.plan-card-trial.27a1` | admin | !(visualExpiration) | null | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardTrial.tsx:27` |
| `state.admin.plan-card-trial.27a0` | admin | visualExpiration | CardRow | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardTrial.tsx:27` |
| `state.admin.plan-card-trial.37t1` | admin | !(isSalesAssisted) | Trans | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardTrial.tsx:37` |
| `state.admin.plan-card-trial.37t0` | admin | isSalesAssisted | Trans | 登录 admin → `/admin/subscription` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/subscription/components/cards/PlanCard/PlanCardTrial.tsx:37` |
| `state.admin.admin-invite-users.35i` | admin | isLoading | ContextualbarContent | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminInviteUsers.tsx:35` |
| `state.admin.admin-invite-users.43i` | admin | !data?.isSMTPConfigured | ContextualbarScrollableContent | 登录 admin → `/admin/users`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminInviteUsers.tsx:43` |
| `state.admin.admin-invite-users.59d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminInviteUsers.tsx:59` |
| `state.admin.admin-user-form.199i` | admin | !context | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:199` |
| `state.admin.admin-user-form.203d` | admin | 前述 if-ret 均不成立（default return） | <> | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:203` |
| `state.admin.admin-user-form.207a1` | admin | !(!isNewUserPage) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:207` |
| `state.admin.admin-user-form.207a0` | admin | !isNewUserPage | Field | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:207` |
| `state.admin.admin-user-form.224a1` | admin | !(isNewUserPage) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:224` |
| `state.admin.admin-user-form.224a0` | admin | isNewUserPage | Box | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:224` |
| `state.admin.admin-user-form.247a1` | admin | !(errors?.email) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:247` |
| `state.admin.admin-user-form.247a0` | admin | errors?.email | FieldError | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:247` |
| `state.admin.admin-user-form.252t1` | admin | !(isLoadingSmtpStatus) | FieldRow | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:252` |
| `state.admin.admin-user-form.252t0` | admin | isLoadingSmtpStatus | Skeleton | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:252` |
| `state.admin.admin-user-form.282a1` | admin | !(isVerificationNeeded && !isSmtpEnabled) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:282` |
| `state.admin.admin-user-form.282a0` | admin | isVerificationNeeded && !isSmtpEnabled | FieldHint | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:282` |
| `state.admin.admin-user-form.293a1` | admin | !(!isVerificationNeeded) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:293` |
| `state.admin.admin-user-form.293a0` | admin | !isVerificationNeeded | FieldHint | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:293` |
| `state.admin.admin-user-form.326a1` | admin | !(errors?.name) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:326` |
| `state.admin.admin-user-form.326a0` | admin | errors?.name | FieldError | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:326` |
| `state.admin.admin-user-form.351a1` | admin | !(errors?.username) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:351` |
| `state.admin.admin-user-form.351a0` | admin | errors?.username | FieldError | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:351` |
| `state.admin.admin-user-form.357a1` | admin | !(showVoipExtension) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:357` |
| `state.admin.admin-user-form.357a0` | admin | showVoipExtension | Field | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:357` |
| `state.admin.admin-user-form.370t1` | admin | !(isLoadingSmtpStatus) | FieldLabel | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:370` |
| `state.admin.admin-user-form.370t0` | admin | isLoadingSmtpStatus | PasswordFieldSkeleton | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:370` |
| `state.admin.admin-user-form.384a1` | admin | !(!setRandomPassword) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:384` |
| `state.admin.admin-user-form.384a0` | admin | !setRandomPassword | AdminUserSetRandomPasswordContent | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:384` |
| `state.admin.admin-user-form.400a1` | admin | !(roleError) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:400` |
| `state.admin.admin-user-form.400a0` | admin | roleError | Callout | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:400` |
| `state.admin.admin-user-form.401a1` | admin | !(!roleError) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:401` |
| `state.admin.admin-user-form.401a0` | admin | !roleError | Controller | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:401` |
| `state.admin.admin-user-form.419a1` | admin | !(errors?.roles) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:419` |
| `state.admin.admin-user-form.419a0` | admin | errors?.roles | FieldError | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:419` |
| `state.admin.admin-user-form.421a1` | admin | !(isNewUserPage) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:421` |
| `state.admin.admin-user-form.421a0` | admin | isNewUserPage | Field | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:421` |
| `state.admin.admin-user-form.438t1` | admin | !(isLoadingSmtpStatus) | Box | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:438` |
| `state.admin.admin-user-form.438t0` | admin | isLoadingSmtpStatus | Skeleton | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:438` |
| `state.admin.admin-user-form.463a1` | admin | !(!isSmtpEnabled) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:463` |
| `state.admin.admin-user-form.463a0` | admin | !isSmtpEnabled | FieldHint | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:463` |
| `state.admin.admin-user-form.498a1` | admin | !(errors?.statusText) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:498` |
| `state.admin.admin-user-form.498a0` | admin | errors?.statusText | FieldError | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:498` |
| `state.admin.admin-user-form.525a1` | admin | !(errors?.bio) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:525` |
| `state.admin.admin-user-form.525a0` | admin | errors?.bio | FieldError | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:525` |
| `state.admin.admin-user-form.537a1` | admin | !(!!customFieldsMetadata.length) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:537` |
| `state.admin.admin-user-form.537a0` | admin | !!customFieldsMetadata.length | <> | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:537` |
| `state.admin.admin-user-form.550a1` | admin | !(showCustomFields) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:550` |
| `state.admin.admin-user-form.550a0` | admin | showCustomFields | CustomFieldsForm | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserForm.tsx:550` |
| `state.admin.admin-user-form-with-data.27i` | admin | isPending | Box | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserFormWithData.tsx:27` |
| `state.admin.admin-user-form-with-data.35i` | admin | isError | Callout | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserFormWithData.tsx:35` |
| `state.admin.admin-user-form-with-data.43i` | admin | data?.user && !!data.user.federated | Callout | 登录 admin → `/admin/users`；空列表/无数据；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserFormWithData.tsx:43` |
| `state.admin.admin-user-form-with-data.51d` | admin | 前述 if-ret 均不成立（default return） | AdminUserForm | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserFormWithData.tsx:51` |
| `state.admin.admin-user-info-actions.33i` | admin | !menuOptions | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserInfoActions.tsx:33` |
| `state.admin.admin-user-info-actions.37d` | admin | 前述 if-ret 均不成立（default return） | GenericMenu | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserInfoActions.tsx:37` |
| `state.admin.admin-user-info-with-data.101i` | admin | isPending | ContextualbarContent | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserInfoWithData.tsx:101` |
| `state.admin.admin-user-info-with-data.109i` | admin | error ¦¦ !user ¦¦ !data?.user | ContextualbarContent | 登录 admin → `/admin/users`；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserInfoWithData.tsx:109` |
| `state.admin.admin-user-info-with-data.117d` | admin | 前述 if-ret 均不成立（default return） | UserInfo | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserInfoWithData.tsx:117` |
| `state.admin.admin-user-set-random-password-content.83a1` | admin | !(errors?.password) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserSetRandomPasswordContent.tsx:83` |
| `state.admin.admin-user-set-random-password-content.83a0` | admin | errors?.password | FieldError | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserSetRandomPasswordContent.tsx:83` |
| `state.admin.admin-user-set-random-password-content.88a1` | admin | !(requiresPasswordConfirmation) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserSetRandomPasswordContent.tsx:88` |
| `state.admin.admin-user-set-random-password-content.88a0` | admin | requiresPasswordConfirmation | FieldRow | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserSetRandomPasswordContent.tsx:88` |
| `state.admin.admin-user-set-random-password-content.112a1` | admin | !(errors?.passwordConfirmation) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserSetRandomPasswordContent.tsx:112` |
| `state.admin.admin-user-set-random-password-content.112a0` | admin | errors?.passwordConfirmation | FieldError | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserSetRandomPasswordContent.tsx:112` |
| `state.admin.admin-user-set-random-password-radios.58a1` | admin | !(!isSmtpEnabled) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserSetRandomPasswordRadios.tsx:58` |
| `state.admin.admin-user-set-random-password-radios.58a0` | admin | !isSmtpEnabled | FieldHint | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUserSetRandomPasswordRadios.tsx:58` |
| `state.admin.admin-users-page.119a1` | admin | !(preventAction?.includes('activeUsers')) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:119` |
| `state.admin.admin-users-page.119a0` | admin | preventAction?.includes('activeUsers') | Callout | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:119` |
| `state.admin.admin-users-page.146a1` | admin | !(pendingUsersCount.isLoading) | null | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:146` |
| `state.admin.admin-users-page.146a0` | admin | pendingUsersCount.isLoading | Skeleton | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:146` |
| `state.admin.admin-users-page.173a1` | admin | !(context) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:173` |
| `state.admin.admin-users-page.173a0` | admin | context | ContextualbarDialog | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:173` |
| `state.admin.admin-users-page.176a1` | admin | !(['new', 'created', 'upgrade'].includes(context)) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:176` |
| `state.admin.admin-users-page.176a0` | admin | ['new', 'created', 'upgrade'].includes(context) | ContextualbarIcon | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:176` |
| `state.admin.admin-users-page.185a1` | admin | !(context === 'info' && id) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:185` |
| `state.admin.admin-users-page.185a0` | admin | context === 'info' && id | AdminUserInfoWithData | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:185` |
| `state.admin.admin-users-page.186a1` | admin | !(context === 'edit' && id) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:186` |
| `state.admin.admin-users-page.186a0` | admin | context === 'edit' && id | AdminUserFormWithData | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:186` |
| `state.admin.admin-users-page.189a1` | admin | !(!isRoutePrevented && context === 'new') | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:189` |
| `state.admin.admin-users-page.189a0` | admin | !isRoutePrevented && context === 'new' | AdminUserForm | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:189` |
| `state.admin.admin-users-page.192a1` | admin | !(!isRoutePrevented && context === 'created' && id) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:192` |
| `state.admin.admin-users-page.192a0` | admin | !isRoutePrevented && context === 'created' && id | AdminUserCreated | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:192` |
| `state.admin.admin-users-page.193a1` | admin | !(!isRoutePrevented && context === 'invite') | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:193` |
| `state.admin.admin-users-page.193a0` | admin | !isRoutePrevented && context === 'invite' | AdminInviteUsers | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:193` |
| `state.admin.admin-users-page.194a1` | admin | !(isRoutePrevented) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:194` |
| `state.admin.admin-users-page.194a0` | admin | isRoutePrevented | AdminUserUpgrade | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersPage.tsx:194` |
| `state.admin.admin-users-route.9i` | admin | !canViewUserAdministration | NotAuthorizedPage | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersRoute.tsx:9` |
| `state.admin.admin-users-route.13d` | admin | 前述 if-ret 均不成立（default return） | AdminUsersPage | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/AdminUsersRoute.tsx:13` |
| `state.admin.users-page-header-content.34a1` | admin | !(seatsCap && seatsCap.maxActiveUsers < Number.POSITIVE_INFINITY) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersPageHeaderContent.tsx:34` |
| `state.admin.users-page-header-content.34a0` | admin | seatsCap && seatsCap.maxActiveUsers < Number.POSITIVE_INFINITY | Margins | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersPageHeaderContent.tsx:34` |
| `state.admin.users-page-header-content.40a1` | admin | !(canBulkCreateUser) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersPageHeaderContent.tsx:40` |
| `state.admin.users-page-header-content.40a0` | admin | canBulkCreateUser | Button | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersPageHeaderContent.tsx:40` |
| `state.admin.users-page-header-content.46a1` | admin | !(canCreateUser) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersPageHeaderContent.tsx:46` |
| `state.admin.users-page-header-content.46a0` | admin | canCreateUser | Button | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersPageHeaderContent.tsx:46` |
| `state.admin.users-page-header-content.52a1` | admin | !(isSeatsCapExceeded) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersPageHeaderContent.tsx:52` |
| `state.admin.users-page-header-content.52a0` | admin | isSeatsCapExceeded | Button | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersPageHeaderContent.tsx:52` |
| `state.admin.users-table.106a1` | admin | !(!isLaptop) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:106` |
| `state.admin.users-table.106a0` | admin | !isLaptop | GenericTableHeaderCell | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:106` |
| `state.admin.users-table.117a1` | admin | !(!isLaptop) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:117` |
| `state.admin.users-table.117a0` | admin | !isLaptop | GenericTableHeaderCell | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:117` |
| `state.admin.users-table.118a1` | admin | !(tab === 'all' && !isMobile) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:118` |
| `state.admin.users-table.118a0` | admin | tab === 'all' && !isMobile | GenericTableHeaderCell | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:118` |
| `state.admin.users-table.129a1` | admin | !(tab === 'pending' && !isMobile) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:129` |
| `state.admin.users-table.129a0` | admin | tab === 'pending' && !isMobile | GenericTableHeaderCell | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:129` |
| `state.admin.users-table.140a1` | admin | !(tab === 'all' && showVoipExtension) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:140` |
| `state.admin.users-table.140a0` | admin | tab === 'all' && showVoipExtension | GenericTableHeaderCell | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:140` |
| `state.admin.users-table.162a1` | admin | !(isLoading) | null | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:162` |
| `state.admin.users-table.162a0` | admin | isLoading | GenericTable | 登录 admin → `/admin/users`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:162` |
| `state.admin.users-table.170a1` | admin | !(isError) | null | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:170` |
| `state.admin.users-table.170a0` | admin | isError | GenericNoResults | 登录 admin → `/admin/users`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:170` |
| `state.admin.users-table.174a1` | admin | !(isSuccess && users.length === 0) | null | 登录 admin → `/admin/users`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:174` |
| `state.admin.users-table.174a0` | admin | isSuccess && users.length === 0 | GenericNoResults | 登录 admin → `/admin/users`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:174` |
| `state.admin.users-table.182a1` | admin | !(isSuccess && users.length > 0) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:182` |
| `state.admin.users-table.182a0` | admin | isSuccess && users.length > 0 | <> | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTable.tsx:182` |
| `state.admin.users-table-row.134a1` | admin | !(username) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:134` |
| `state.admin.users-table-row.134a0` | admin | username | UserAvatar | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:134` |
| `state.admin.users-table-row.152a1` | admin | !(!isLaptop) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:152` |
| `state.admin.users-table-row.152a0` | admin | !isLaptop | GenericTableCell | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:152` |
| `state.admin.users-table-row.154a1` | admin | !(!isLaptop) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:154` |
| `state.admin.users-table-row.154a0` | admin | !isLaptop | GenericTableCell | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:154` |
| `state.admin.users-table-row.156a1` | admin | !(tab === 'all' && !isMobile) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:156` |
| `state.admin.users-table-row.156a0` | admin | tab === 'all' && !isMobile | GenericTableCell | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:156` |
| `state.admin.users-table-row.162a1` | admin | !(tab === 'pending' && !isMobile) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:162` |
| `state.admin.users-table-row.162a0` | admin | tab === 'pending' && !isMobile | GenericTableCell | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:162` |
| `state.admin.users-table-row.170a1` | admin | !(tab === 'all' && showVoipExtension) | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:170` |
| `state.admin.users-table-row.170a0` | admin | tab === 'all' && showVoipExtension | GenericTableCell | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:170` |
| `state.admin.users-table-row.182a1` | admin | !(tab === 'pending') | null | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:182` |
| `state.admin.users-table-row.182a0` | admin | tab === 'pending' | <> | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:182` |
| `state.admin.users-table-row.184t1` | admin | !(active) | Button | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:184` |
| `state.admin.users-table-row.184t0` | admin | active | Button | 登录 admin → `/admin/users` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/users/UsersTable/UsersTableRow.tsx:184` |
| `state.admin.analytics-reports.40a1` | admin | !(isSuccess) | null | 登录 admin → `/admin/analytic-reports` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/viewLogs/AnalyticsReports.tsx:40` |
| `state.admin.analytics-reports.40a0` | admin | isSuccess | pre | 登录 admin → `/admin/analytic-reports` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/viewLogs/AnalyticsReports.tsx:40` |
| `state.admin.view-logs-route.9i` | admin | !canViewLogs | NotAuthorizedPage | 登录 admin → `/admin/analytic-reports` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/viewLogs/ViewLogsRoute.tsx:9` |
| `state.admin.view-logs-route.13d` | admin | 前述 if-ret 均不成立（default return） | ViewLogsPage | 登录 admin → `/admin/analytic-reports` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/viewLogs/ViewLogsRoute.tsx:13` |
| `state.admin.deployment-card.46a1` | admin | !(workspaceUrl) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/DeploymentCard.tsx:46` |
| `state.admin.deployment-card.46a0` | admin | workspaceUrl | WorkspaceCardSection | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/DeploymentCard.tsx:46` |
| `state.admin.deployment-card.52a1` | admin | !(hashedWorkspaceUrl) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/DeploymentCard.tsx:52` |
| `state.admin.deployment-card.52a0` | admin | hashedWorkspaceUrl | WorkspaceCardSection | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/DeploymentCard.tsx:52` |
| `state.admin.deployment-card.63a1` | admin | !(cloudWorkspaceId) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/DeploymentCard.tsx:63` |
| `state.admin.deployment-card.63a0` | admin | cloudWorkspaceId | WorkspaceCardSection | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/DeploymentCard.tsx:63` |
| `state.admin.deployment-card.70a1` | admin | !(appsEngineVersion) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/DeploymentCard.tsx:70` |
| `state.admin.deployment-card.70a0` | admin | appsEngineVersion | WorkspaceCardSection | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/DeploymentCard.tsx:70` |
| `state.admin.deployment-card.101a1` | admin | !(!!instances.length) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/DeploymentCard.tsx:101` |
| `state.admin.deployment-card.101a0` | admin | !!instances.length | CardControls | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/DeploymentCard.tsx:101` |
| `state.admin.description-list.12a1` | admin | !(title) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/components/InstancesModal/DescriptionList.tsx:12` |
| `state.admin.description-list.12a0` | admin | title | Box | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/DeploymentCard/components/InstancesModal/DescriptionList.tsx:12` |
| `state.admin.version-card.182i` | admin | isPending && !licenseData | Card | 登录 admin → `/admin/workspace`；等查询 in-flight；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/VersionCard.tsx:182` |
| `state.admin.version-card.190d` | admin | 前述 if-ret 均不成立（default return） | Card | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/VersionCard.tsx:190` |
| `state.admin.version-card.195a1` | admin | !(!isAirgapped && versions) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/VersionCard.tsx:195` |
| `state.admin.version-card.195a0` | admin | !isAirgapped && versions | VersionTag | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/VersionCard.tsx:195` |
| `state.admin.version-card.207a1` | admin | !(actionButton) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/VersionCard.tsx:207` |
| `state.admin.version-card.207a0` | admin | actionButton | CardControls | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/VersionCard.tsx:207` |
| `state.admin.version-tag.13i` | admin | versionStatus === 'outdated' | Tag | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/components/VersionTag.tsx:13` |
| `state.admin.version-tag.21i` | admin | versionStatus === 'latest' | Tag | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/components/VersionTag.tsx:21` |
| `state.admin.version-tag.29d` | admin | 前述 if-ret 均不成立（default return） | Tag | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/components/VersionTag.tsx:29` |
| `state.admin.register-workspace-setup-modal.45t1` | admin | !(step === 1) | RegisterWorkspaceSetupStepTwoModal | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceSetupModal/RegisterWorkspaceSetupModal.tsx:45` |
| `state.admin.register-workspace-setup-modal.45t0` | admin | step === 1 | RegisterWorkspaceSetupStepOneModal | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceSetupModal/RegisterWorkspaceSetupModal.tsx:45` |
| `state.admin.register-workspace-token-modal.98a1` | admin | !(error) | null | 登录 admin → `/admin/workspace`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceTokenModal.tsx:98` |
| `state.admin.register-workspace-token-modal.98a0` | admin | error | FieldError | 登录 admin → `/admin/workspace`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/VersionCard/modals/RegisterWorkspaceTokenModal.tsx:98` |
| `state.admin.workspace-page.42a1` | admin | !(canViewStatistics) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/WorkspacePage.tsx:42` |
| `state.admin.workspace-page.42a0` | admin | canViewStatistics | ButtonGroup | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/WorkspacePage.tsx:42` |
| `state.admin.workspace-page.54a1` | admin | !(warningMultipleInstances) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/WorkspacePage.tsx:54` |
| `state.admin.workspace-page.54a0` | admin | warningMultipleInstances | Callout | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/WorkspacePage.tsx:54` |
| `state.admin.workspace-route.20i` | admin | !canViewStatistics | NotAuthorizedPage | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/WorkspaceRoute.tsx:20` |
| `state.admin.workspace-route.24i` | admin | serverInfoQuery.isPending ¦¦ instancesQuery.isPending ¦¦ statisticsQuery.isPending | PageSkeleton | 登录 admin → `/admin/workspace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/WorkspaceRoute.tsx:24` |
| `state.admin.workspace-route.37i` | admin | serverInfoQuery.isError ¦¦ instancesQuery.isError ¦¦ statisticsQuery.isError | Page | 登录 admin → `/admin/workspace`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/WorkspaceRoute.tsx:37` |
| `state.admin.workspace-route.54d` | admin | 前述 if-ret 均不成立（default return） | WorkspacePage | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/WorkspaceRoute.tsx:54` |
| `state.admin.workspace-card-text-separator.16a1` | admin | !(icon) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/components/WorkspaceCardTextSeparator.tsx:16` |
| `state.admin.workspace-card-text-separator.16a0` | admin | icon | Icon | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/components/WorkspaceCardTextSeparator.tsx:16` |
| `state.admin.workspace-card-text-separator.17a1` | admin | !(status) | null | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/components/WorkspaceCardTextSeparator.tsx:17` |
| `state.admin.workspace-card-text-separator.17a0` | admin | status | Box | 登录 admin → `/admin/workspace` | [待渲染实测] | （无） | `apps/meteor/client/views/admin/workspace/components/WorkspaceCardTextSeparator.tsx:17` |

### omni（794）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.omni.external-frame-container.40i` | omni | !externalFrameUrl | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/ExternalFrameContainer.tsx:40` |
| `state.omni.external-frame-container.44d` | omni | 前述 if-ret 均不成立（default return） | div | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/ExternalFrameContainer.tsx:44` |
| `state.omni.omnichannel-router.28i` | omni | !children | PageSkeleton | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/OmnichannelRouter.tsx:28` |
| `state.omni.omnichannel-router.32d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/OmnichannelRouter.tsx:32` |
| `state.omni.omnichannel-router.34s` | omni | Suspense fallback（子树未 ready） | PageSkeleton | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/OmnichannelRouter.tsx:34` |
| `state.omni.business-hours-multiple.25i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/BusinessHoursMultiple.tsx:25` |
| `state.omni.business-hours-multiple.29d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/BusinessHoursMultiple.tsx:29` |
| `state.omni.business-hours-multiple.53a1` | omni | !(errors?.name) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/BusinessHoursMultiple.tsx:53` |
| `state.omni.business-hours-multiple.53a0` | omni | errors?.name | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/BusinessHoursMultiple.tsx:53` |
| `state.omni.contact-manager-input.12i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/ContactManagerInput.tsx:12` |
| `state.omni.contact-manager-input.24d` | omni | 前述 if-ret 均不成立（default return） | AutoCompleteAgent | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/ContactManagerInput.tsx:24` |
| `state.omni.current-chat-tags.16i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/CurrentChatTags.tsx:16` |
| `state.omni.current-chat-tags.20d` | omni | 前述 if-ret 均不成立（default return） | AutoCompleteTagsMultiple | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/CurrentChatTags.tsx:20` |
| `state.omni.custom-fields-additional-form.46i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/CustomFieldsAdditionalForm.tsx:46` |
| `state.omni.custom-fields-additional-form.50d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/CustomFieldsAdditionalForm.tsx:50` |
| `state.omni.custom-fields-additional-form.95a1` | omni | !(errors.options) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/CustomFieldsAdditionalForm.tsx:95` |
| `state.omni.custom-fields-additional-form.95a0` | omni | errors.options | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/CustomFieldsAdditionalForm.tsx:95` |
| `state.omni.department-business-hours.21i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/DepartmentBusinessHours.tsx:21` |
| `state.omni.department-business-hours.25d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/DepartmentBusinessHours.tsx:25` |
| `state.omni.ee-number-input.11i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/EeNumberInput.tsx:11` |
| `state.omni.ee-number-input.15d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/EeNumberInput.tsx:15` |
| `state.omni.ee-text-area-input.11i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/EeTextAreaInput.tsx:11` |
| `state.omni.ee-text-area-input.15d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/EeTextAreaInput.tsx:15` |
| `state.omni.ee-text-input.11i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/EeTextInput.tsx:11` |
| `state.omni.ee-text-input.15d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/EeTextInput.tsx:15` |
| `state.omni.max-chats-per-agent.18i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/MaxChatsPerAgent.tsx:18` |
| `state.omni.max-chats-per-agent.22d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/MaxChatsPerAgent.tsx:22` |
| `state.omni.max-chats-per-agent-display.10i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/MaxChatsPerAgentDisplay.tsx:10` |
| `state.omni.max-chats-per-agent-display.14d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/MaxChatsPerAgentDisplay.tsx:14` |
| `state.omni.priorities-select.50i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/PrioritiesSelect.tsx:50` |
| `state.omni.priorities-select.54d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/PrioritiesSelect.tsx:54` |
| `state.omni.sla-policies-select.20i` | omni | !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/SlaPoliciesSelect.tsx:20` |
| `state.omni.sla-policies-select.24d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/additionalForms/SlaPoliciesSelect.tsx:24` |
| `state.omni.agent-edit.116a1` | omni | !(username) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentEdit.tsx:116` |
| `state.omni.agent-edit.116a0` | omni | username | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentEdit.tsx:116` |
| `state.omni.agent-edit.172a1` | omni | !(MaxChatsPerAgent) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentEdit.tsx:172` |
| `state.omni.agent-edit.172a0` | omni | MaxChatsPerAgent | MaxChatsPerAgent | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentEdit.tsx:172` |
| `state.omni.agent-edit-with-data.35i` | omni | isPending ¦¦ agentDepartmentsLoading ¦¦ !agentDepartments | ContextualbarSkeletonBody | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentEditWithData.tsx:35` |
| `state.omni.agent-edit-with-data.39i` | omni | error ¦¦ agentsDepartmentsError ¦¦ !data?.user | Box | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentEditWithData.tsx:39` |
| `state.omni.agent-edit-with-data.43d` | omni | 前述 if-ret 均不成立（default return） | AgentEdit | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentEditWithData.tsx:43` |
| `state.omni.agent-info.38i` | omni | isPending | ContextualbarSkeletonBody | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:38` |
| `state.omni.agent-info.42i` | omni | isError | Box | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:42` |
| `state.omni.agent-info.48d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:48` |
| `state.omni.agent-info.55a1` | omni | !(username) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:55` |
| `state.omni.agent-info.55a0` | omni | username | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:55` |
| `state.omni.agent-info.74a1` | omni | !(statusLivechat) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:74` |
| `state.omni.agent-info.74a0` | omni | statusLivechat | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:74` |
| `state.omni.agent-info.80a1` | omni | !(MaxChatsPerAgentDisplay) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:80` |
| `state.omni.agent-info.80a0` | omni | MaxChatsPerAgentDisplay | MaxChatsPerAgentDisplay | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentInfo.tsx:80` |
| `state.omni.agents-page.20i` | omni | !canViewAgents | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsPage.tsx:20` |
| `state.omni.agents-page.24d` | omni | 前述 if-ret 均不成立（default return） | Page | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsPage.tsx:24` |
| `state.omni.agents-page.32a1` | omni | !(context) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsPage.tsx:32` |
| `state.omni.agents-page.32a0` | omni | context | ContextualbarDialog | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsPage.tsx:32` |
| `state.omni.agents-page.34a1` | omni | !(id && context === 'edit') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsPage.tsx:34` |
| `state.omni.agents-page.34a0` | omni | id && context === 'edit' | AgentEditWithData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsPage.tsx:34` |
| `state.omni.agents-page.35a1` | omni | !(id && context === 'info') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsPage.tsx:35` |
| `state.omni.agents-page.35a0` | omni | id && context === 'info' | AgentInfo | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsPage.tsx:35` |
| `state.omni.agents-table.58a1` | omni | !(mediaQuery) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:58` |
| `state.omni.agents-table.58a0` | omni | mediaQuery | GenericTableHeaderCell | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:58` |
| `state.omni.agents-table.76a1` | omni | !(((isSuccess && data?.users.length > 0) ¦¦ queryHasChanged)) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:76` |
| `state.omni.agents-table.76a0` | omni | ((isSuccess && data?.users.length > 0) ¦¦ queryHasChanged) | FilterByText | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:76` |
| `state.omni.agents-table.79a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:79` |
| `state.omni.agents-table.79a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:79` |
| `state.omni.agents-table.87a1` | omni | !(isSuccess && data?.users.length === 0 && queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:87` |
| `state.omni.agents-table.87a0` | omni | isSuccess && data?.users.length === 0 && queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:87` |
| `state.omni.agents-table.88a1` | omni | !(isSuccess && data.users.length === 0 && !queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:88` |
| `state.omni.agents-table.88a0` | omni | isSuccess && data.users.length === 0 && !queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:88` |
| `state.omni.agents-table.97a1` | omni | !(isSuccess && data?.users.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:97` |
| `state.omni.agents-table.97a0` | omni | isSuccess && data?.users.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:97` |
| `state.omni.agents-table.116a1` | omni | !(isError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:116` |
| `state.omni.agents-table.116a0` | omni | isError | GenericError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTable.tsx:116` |
| `state.omni.agents-table-row.32a1` | omni | !(username) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTableRow.tsx:32` |
| `state.omni.agents-table-row.32a0` | omni | username | UserAvatar | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTableRow.tsx:32` |
| `state.omni.agents-table-row.38a1` | omni | !(!mediaQuery && name) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTableRow.tsx:38` |
| `state.omni.agents-table-row.38a0` | omni | !mediaQuery && name | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTableRow.tsx:38` |
| `state.omni.agents-table-row.47a1` | omni | !(mediaQuery) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTableRow.tsx:47` |
| `state.omni.agents-table-row.47a0` | omni | mediaQuery | GenericTableCell | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/agents/AgentsTable/AgentsTableRow.tsx:47` |
| `state.omni.appearance-field-label.17i` | omni | !shouldDisableEnterprise | FieldLabel | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/appearance/AppearanceFieldLabel.tsx:17` |
| `state.omni.appearance-field-label.21d` | omni | 前述 if-ret 均不成立（default return） | FieldLabel | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/appearance/AppearanceFieldLabel.tsx:21` |
| `state.omni.appearance-page-container.26i` | omni | !canViewAppearance | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/appearance/AppearancePageContainer.tsx:26` |
| `state.omni.appearance-page-container.30i` | omni | isPending | PageSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/appearance/AppearancePageContainer.tsx:30` |
| `state.omni.appearance-page-container.34i` | omni | isError | Page | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/appearance/AppearancePageContainer.tsx:34` |
| `state.omni.appearance-page-container.45d` | omni | 前述 if-ret 均不成立（default return） | AppearancePage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/appearance/AppearancePageContainer.tsx:45` |
| `state.omni.business-hours-disabled-page.22a1` | omni | !(isAdmin) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursDisabledPage.tsx:22` |
| `state.omni.business-hours-disabled-page.22a0` | omni | isAdmin | StatesActions | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursDisabledPage.tsx:22` |
| `state.omni.business-hours-form.64a1` | omni | !(type === 'custom') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursForm.tsx:64` |
| `state.omni.business-hours-form.64a0` | omni | type === 'custom' | BusinessHoursMultiple | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursForm.tsx:64` |
| `state.omni.business-hours-router.25i` | omni | !businessHoursEnabled | BusinessHoursDisabledPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursRouter.tsx:25` |
| `state.omni.business-hours-router.30t1` | omni | !(type) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursRouter.tsx:30` |
| `state.omni.business-hours-router.30t0` | omni | type | EditBusinessHoursWithData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursRouter.tsx:30` |
| `state.omni.business-hours-router.33i` | omni | context === 'new' | EditBusinessHours | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursRouter.tsx:33` |
| `state.omni.business-hours-router.37d` | omni | 前述 if-ret 均不成立（default return） | BusinessHoursMultiplePage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursRouter.tsx:37` |
| `state.omni.business-hours-row.36a1` | omni | !(name) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursRow.tsx:36` |
| `state.omni.business-hours-row.36a0` | omni | name | IconButton | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursRow.tsx:36` |
| `state.omni.business-hours-table.57a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursTable.tsx:57` |
| `state.omni.business-hours-table.57a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursTable.tsx:57` |
| `state.omni.business-hours-table.65a1` | omni | !(isSuccess && data?.businessHours.length === 0) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursTable.tsx:65` |
| `state.omni.business-hours-table.65a0` | omni | isSuccess && data?.businessHours.length === 0 | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursTable.tsx:65` |
| `state.omni.business-hours-table.66a1` | omni | !(isSuccess && data?.businessHours.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursTable.tsx:66` |
| `state.omni.business-hours-table.66a0` | omni | isSuccess && data?.businessHours.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursTable.tsx:66` |
| `state.omni.business-hours-table.85a1` | omni | !(isError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursTable.tsx:85` |
| `state.omni.business-hours-table.85a0` | omni | isError | States | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/BusinessHoursTable.tsx:85` |
| `state.omni.edit-business-hours.87a1` | omni | !(!isSingleBH) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHours.tsx:87` |
| `state.omni.edit-business-hours.87a0` | omni | !isSingleBH | Button | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHours.tsx:87` |
| `state.omni.edit-business-hours.88a1` | omni | !(type === 'custom' && businessHourData?._id) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHours.tsx:88` |
| `state.omni.edit-business-hours.88a0` | omni | type === 'custom' && businessHourData?._id | Button | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHours.tsx:88` |
| `state.omni.edit-business-hours-with-data.24i` | omni | isPending | PageSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHoursWithData.tsx:24` |
| `state.omni.edit-business-hours-with-data.28i` | omni | isError | Page | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHoursWithData.tsx:28` |
| `state.omni.edit-business-hours-with-data.47d` | omni | 前述 if-ret 均不成立（default return） | EditBusinessHours | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/businessHours/EditBusinessHoursWithData.tsx:47` |
| `state.omni.canned-response-form.59a1` | omni | !(errors?.shortcut) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:59` |
| `state.omni.canned-response-form.59a0` | omni | errors?.shortcut | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:59` |
| `state.omni.canned-response-form.68a1` | omni | !(text !== '') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:68` |
| `state.omni.canned-response-form.68a0` | omni | text !== '' | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:68` |
| `state.omni.canned-response-form.74t1` | omni | !(preview) | Controller | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:74` |
| `state.omni.canned-response-form.74t0` | omni | preview | CannedResponsesComposerPreview | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:74` |
| `state.omni.canned-response-form.95a1` | omni | !(errors?.text) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:95` |
| `state.omni.canned-response-form.95a0` | omni | errors?.text | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:95` |
| `state.omni.canned-response-form.104a1` | omni | !((hasManagerPermission ¦¦ hasMonitorPermission)) | null | 登录 omni 经理 → 顶栏 Omnichannel；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:104` |
| `state.omni.canned-response-form.104a0` | omni | (hasManagerPermission ¦¦ hasMonitorPermission) | <> | 登录 omni 经理 → 顶栏 Omnichannel；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:104` |
| `state.omni.canned-response-form.164a1` | omni | !(scope === 'department') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:164` |
| `state.omni.canned-response-form.164a0` | omni | scope === 'department' | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:164` |
| `state.omni.canned-response-form.189a1` | omni | !(errors?.departmentId) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:189` |
| `state.omni.canned-response-form.189a0` | omni | errors?.departmentId | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/components/CannedResponseForm.tsx:189` |
| `state.omni.canned-response.49a1` | omni | !(onClickBack) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponse.tsx:49` |
| `state.omni.canned-response.49a0` | omni | onClickBack | ContextualbarAction | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponse.tsx:49` |
| `state.omni.canned-response.51a1` | omni | !(onClose) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponse.tsx:51` |
| `state.omni.canned-response.51a0` | omni | onClose | ContextualbarClose | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponse.tsx:51` |
| `state.omni.canned-response.101a1` | omni | !(allowEdit) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponse.tsx:101` |
| `state.omni.canned-response.101a0` | omni | allowEdit | Button | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponse.tsx:101` |
| `state.omni.canned-response-list.69i` | omni | cannedItem | WrapCannedResponse | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponseList.tsx:69` |
| `state.omni.canned-response-list.82d` | omni | 前述 if-ret 均不成立（default return） | ContextualbarDialog | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponseList.tsx:82` |
| `state.omni.canned-response-list.105a1` | omni | !(itemCount === 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponseList.tsx:105` |
| `state.omni.canned-response-list.105a0` | omni | itemCount === 0 | ContextualbarEmptyContent | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponseList.tsx:105` |
| `state.omni.canned-response-list.106a1` | omni | !(itemCount > 0 && cannedItems.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponseList.tsx:106` |
| `state.omni.canned-response-list.106a0` | omni | itemCount > 0 && cannedItems.length > 0 | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponseList.tsx:106` |
| `state.omni.canned-response-list.130a1` | omni | !(canCreateCannedResponse) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponseList.tsx:130` |
| `state.omni.canned-response-list.130a0` | omni | canCreateCannedResponse | ContextualbarFooter | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/CannedResponseList.tsx:130` |
| `state.omni.item.67a1` | omni | !(data.tags && data.tags.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/Item.tsx:67` |
| `state.omni.item.67a0` | omni | data.tags && data.tags.length > 0 | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/contextualBar/CannedResponse/Item.tsx:67` |
| `state.omni.canned-response-edit.81a1` | omni | !(cannedResponseData?._id) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEdit.tsx:81` |
| `state.omni.canned-response-edit.81a0` | omni | cannedResponseData?._id | ButtonGroup | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEdit.tsx:81` |
| `state.omni.canned-response-edit-with-data.25i` | omni | isPending | FormSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithData.tsx:25` |
| `state.omni.canned-response-edit-with-data.29i` | omni | isError | Callout | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithData.tsx:29` |
| `state.omni.canned-response-edit-with-data.37i` | omni | data?.cannedResponse?.scope === 'department' | CannedResponseEditWithDepartmentData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithData.tsx:37` |
| `state.omni.canned-response-edit-with-data.41d` | omni | 前述 if-ret 均不成立（default return） | CannedResponseEdit | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithData.tsx:41` |
| `state.omni.canned-response-edit-with-department-data.36i` | omni | isPending | FormSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithDepartmentData.tsx:36` |
| `state.omni.canned-response-edit-with-department-data.40i` | omni | isError | Callout | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithDepartmentData.tsx:40` |
| `state.omni.canned-response-edit-with-department-data.48d` | omni | 前述 if-ret 均不成立（default return） | CannedResponseEdit | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponseEditWithDepartmentData.tsx:48` |
| `state.omni.canned-responses-page.17i` | omni | context === 'edit' && id | CannedResponseEditWithData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesPage.tsx:17` |
| `state.omni.canned-responses-page.21i` | omni | context === 'new' | CannedResponseEdit | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesPage.tsx:21` |
| `state.omni.canned-responses-page.25d` | omni | 前述 if-ret 均不成立（default return） | Page | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesPage.tsx:25` |
| `state.omni.canned-responses-route.9i` | omni | !canViewCannedResponses | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesRoute.tsx:9` |
| `state.omni.canned-responses-route.13d` | omni | 前述 if-ret 均不成立（default return） | CannedResponsesPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesRoute.tsx:13` |
| `state.omni.canned-responses-table.119a1` | omni | !(((isSuccess && data?.cannedResponses.length > 0) ¦¦ queryHasChanged)) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:119` |
| `state.omni.canned-responses-table.119a0` | omni | ((isSuccess && data?.cannedResponses.length > 0) ¦¦ queryHasChanged) | CannedResponseFilter | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:119` |
| `state.omni.canned-responses-table.129a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:129` |
| `state.omni.canned-responses-table.129a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:129` |
| `state.omni.canned-responses-table.137a1` | omni | !(isSuccess && data?.cannedResponses.length === 0 && queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:137` |
| `state.omni.canned-responses-table.137a0` | omni | isSuccess && data?.cannedResponses.length === 0 && queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:137` |
| `state.omni.canned-responses-table.138a1` | omni | !(isSuccess && data?.cannedResponses.length === 0 && !queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:138` |
| `state.omni.canned-responses-table.138a0` | omni | isSuccess && data?.cannedResponses.length === 0 && !queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:138` |
| `state.omni.canned-responses-table.149a1` | omni | !(isSuccess && data?.cannedResponses.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:149` |
| `state.omni.canned-responses-table.149a0` | omni | isSuccess && data?.cannedResponses.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:149` |
| `state.omni.canned-responses-table.172a1` | omni | !(!(scope === 'global' && isMonitor && !isManager)) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:172` |
| `state.omni.canned-responses-table.172a0` | omni | !(scope === 'global' && isMonitor && !isManager) | RemoveCannedResponseButton | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/cannedResponses/modals/CannedResponsesTable.tsx:172` |
| `state.omni.agent-info-details.29a1` | omni | !(shortName) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/AgentInfoDetails.tsx:29` |
| `state.omni.agent-info-details.29a0` | omni | shortName | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/AgentInfoDetails.tsx:29` |
| `state.omni.auto-complete-department-multiple.70i` | omni | withCheckbox | CheckOption | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/AutoCompleteDepartmentMultiple.tsx:70` |
| `state.omni.auto-complete-department-multiple.80d` | omni | 前述 if-ret 均不成立（default return） | Option | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/AutoCompleteDepartmentMultiple.tsx:80` |
| `state.omni.custom-field.22i` | omni | isPending | FormSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/CustomField.tsx:22` |
| `state.omni.custom-field.26i` | omni | isError ¦¦ !data?.customField | Box | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/CustomField.tsx:26` |
| `state.omni.custom-field.32i` | omni | !label | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/CustomField.tsx:32` |
| `state.omni.custom-field.36d` | omni | 前述 if-ret 均不成立（default return） | InfoPanelField | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/CustomField.tsx:36` |
| `state.omni.omnichannel-badges.13i` | omni | !isOmnichannelRoom(room) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/OmnichannelBadges/OmnichannelBadges.tsx:13` |
| `state.omni.omnichannel-badges.17d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/OmnichannelBadges/OmnichannelBadges.tsx:17` |
| `state.omni.omnichannel-badges.19t1` | omni | !(isPriorityEnabled) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/OmnichannelBadges/OmnichannelBadges.tsx:19` |
| `state.omni.omnichannel-badges.19t0` | omni | isPriorityEnabled | PriorityIcon | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/OmnichannelBadges/OmnichannelBadges.tsx:19` |
| `state.omni.omnichannel-sorting-disclaimer.27i` | omni | !type | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/OmnichannelSortingDisclaimer.tsx:27` |
| `state.omni.omnichannel-sorting-disclaimer.31d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/OmnichannelSortingDisclaimer.tsx:31` |
| `state.omni.room-activity-icon.15t1` | omni | !(isRoomOverMacLimit) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/RoomActivityIcon.tsx:15` |
| `state.omni.room-activity-icon.15t0` | omni | isRoomOverMacLimit | Icon | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/RoomActivityIcon.tsx:15` |
| `state.omni.tags.64i` | omni | isLoading | FormSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/Tags.tsx:64` |
| `state.omni.tags.68d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/Tags.tsx:68` |
| `state.omni.tags.74t1` | omni | !(tagsResult?.tags?.length) | FieldRow | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/Tags.tsx:74` |
| `state.omni.tags.74t0` | omni | tagsResult?.tags?.length | FieldRow | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/Tags.tsx:74` |
| `state.omni.tags.104a1` | omni | !(customTags.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/Tags.tsx:104` |
| `state.omni.tags.104a0` | omni | customTags.length > 0 | FieldRow | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/Tags.tsx:104` |
| `state.omni.auto-complete-outbound-provider.52t1` | omni | !(lastChat) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/AutoCompleteOutboundProvider.tsx:52` |
| `state.omni.auto-complete-outbound-provider.52t0` | omni | lastChat | OptionDescription | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/AutoCompleteOutboundProvider.tsx:52` |
| `state.omni.outbound-message-preview.99t1` | omni | !(template) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessagePreview/OutboundMessagePreview.tsx:99` |
| `state.omni.outbound-message-preview.99t0` | omni | template | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessagePreview/OutboundMessagePreview.tsx:99` |
| `state.omni.outbound-message-wizard.151i` | omni | !isOmnichannelEnabled | OutboundMessageWizardErrorState | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/OutboundMessageWizard.tsx:151` |
| `state.omni.outbound-message-wizard.155i` | omni | !hasOutboundPermission | OutboundMessageWizardErrorState | 登录 omni 经理 → 顶栏 Omnichannel；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/OutboundMessageWizard.tsx:155` |
| `state.omni.outbound-message-wizard.161i` | omni | isLoadingModule ¦¦ isLoadingProviders | OutboubdMessageWizardSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/OutboundMessageWizard.tsx:161` |
| `state.omni.outbound-message-wizard.165i` | omni | isErrorProviders | OutboundMessageWizardErrorState | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/OutboundMessageWizard.tsx:165` |
| `state.omni.outbound-message-wizard.169d` | omni | 前述 if-ret 均不成立（default return） | ErrorBoundary | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/OutboundMessageWizard.tsx:169` |
| `state.omni.outbound-message-wizard-error-state.17t1` | omni | !(onRetry) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/components/OutboundMessageWizardErrorState.tsx:17` |
| `state.omni.outbound-message-wizard-error-state.17t0` | omni | onRetry | StatesActions | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/components/OutboundMessageWizardErrorState.tsx:17` |
| `state.omni.message-form.90t1` | omni | !(template) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/MessageForm/MessageForm.tsx:90` |
| `state.omni.message-form.90t0` | omni | template | TemplatePreviewForm | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/MessageForm/MessageForm.tsx:90` |
| `state.omni.template-field.69a1` | omni | !(templateFieldError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/MessageForm/components/TemplateField.tsx:69` |
| `state.omni.template-field.69a0` | omni | templateFieldError | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/MessageForm/components/TemplateField.tsx:69` |
| `state.omni.template-placeholder-field.52t1` | omni | !(error) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/MessageForm/components/TemplatePlaceholderField.tsx:52` |
| `state.omni.template-placeholder-field.52t0` | omni | error | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/MessageForm/components/TemplatePlaceholderField.tsx:52` |
| `state.omni.channel-field.77a1` | omni | !(providerFieldError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ChannelField.tsx:77` |
| `state.omni.channel-field.77a0` | omni | providerFieldError | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ChannelField.tsx:77` |
| `state.omni.channel-field.80a1` | omni | !(isError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ChannelField.tsx:80` |
| `state.omni.channel-field.80a0` | omni | isError | RetryButton | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ChannelField.tsx:80` |
| `state.omni.channel-field.83a1` | omni | !(providerLastChat) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ChannelField.tsx:83` |
| `state.omni.channel-field.83a0` | omni | providerLastChat | FieldHint | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ChannelField.tsx:83` |
| `state.omni.contact-field.49t1` | omni | !(phones?.length) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ContactField.tsx:49` |
| `state.omni.contact-field.49t0` | omni | phones?.length | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ContactField.tsx:49` |
| `state.omni.contact-field.75a1` | omni | !(contactFieldError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ContactField.tsx:75` |
| `state.omni.contact-field.75a0` | omni | contactFieldError | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ContactField.tsx:75` |
| `state.omni.contact-field.78a1` | omni | !(isError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ContactField.tsx:78` |
| `state.omni.contact-field.78a0` | omni | isError | RetryButton | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/ContactField.tsx:78` |
| `state.omni.recipient-field.57a1` | omni | !(recipientFieldError?.type === 'required') | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/RecipientField.tsx:57` |
| `state.omni.recipient-field.57a0` | omni | recipientFieldError?.type === 'required' | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/RecipientField.tsx:57` |
| `state.omni.recipient-field.62a1` | omni | !(recipientFieldError?.type === 'noPhoneNumber') | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/RecipientField.tsx:62` |
| `state.omni.recipient-field.62a0` | omni | recipientFieldError?.type === 'noPhoneNumber' | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/RecipientField.tsx:62` |
| `state.omni.sender-field.57a1` | omni | !(senderFieldError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/SenderField.tsx:57` |
| `state.omni.sender-field.57a0` | omni | senderFieldError | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RecipientForm/components/SenderField.tsx:57` |
| `state.omni.agent-field.54a1` | omni | !(agentFieldError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/components/AgentField.tsx:54` |
| `state.omni.agent-field.54a0` | omni | agentFieldError | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/components/AgentField.tsx:54` |
| `state.omni.department-field.72a1` | omni | !(departmentFieldError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/components/DepartmentField.tsx:72` |
| `state.omni.department-field.72a0` | omni | departmentFieldError | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/components/DepartmentField.tsx:72` |
| `state.omni.department-field.75a1` | omni | !(isError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/components/DepartmentField.tsx:75` |
| `state.omni.department-field.75a0` | omni | isError | RetryButton | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/components/OutboundMessageWizard/forms/RepliesForm/components/DepartmentField.tsx:75` |
| `state.omni.outbound-message-modal.65t1` | omni | !(isClosing) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/modals/OutboundMessageModal/OutboundMessageModal.tsx:65` |
| `state.omni.outbound-message-modal.65t0` | omni | isClosing | OutboundMessageCloseConfirmationModal | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/components/outboundMessage/modals/OutboundMessageModal/OutboundMessageModal.tsx:65` |
| `state.omni.contact-history-message.53i` | omni | message.t === 'livechat-close' | MessageSystem | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:53` |
| `state.omni.contact-history-message.57a1` | omni | !(showUserAvatar) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:57` |
| `state.omni.contact-history-message.57a0` | omni | showUserAvatar | UserAvatar | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:57` |
| `state.omni.contact-history-message.82d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:82` |
| `state.omni.contact-history-message.84a1` | omni | !(isNewDay) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:84` |
| `state.omni.contact-history-message.84a0` | omni | isNewDay | MessageDivider | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:84` |
| `state.omni.contact-history-message.93a1` | omni | !(!sequential && message.u.username && showUserAvatar) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:93` |
| `state.omni.contact-history-message.93a0` | omni | !sequential && message.u.username && showUserAvatar | UserAvatar | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:93` |
| `state.omni.contact-history-message.104a1` | omni | !(sequential) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:104` |
| `state.omni.contact-history-message.104a0` | omni | sequential | StatusIndicators | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:104` |
| `state.omni.contact-history-message.107a1` | omni | !(!sequential) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:107` |
| `state.omni.contact-history-message.107a0` | omni | !sequential | MessageHeaderTemplate | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:107` |
| `state.omni.contact-history-message.119a1` | omni | !(!!quotes?.length) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:119` |
| `state.omni.contact-history-message.119a0` | omni | !!quotes?.length | Attachments | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:119` |
| `state.omni.contact-history-message.121t1` | omni | !(message.md) | MessageBody | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:121` |
| `state.omni.contact-history-message.121t0` | omni | message.md | MessageContentBody | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:121` |
| `state.omni.contact-history-message.128a1` | omni | !(message.blocks) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:128` |
| `state.omni.contact-history-message.128a0` | omni | message.blocks | UiKitMessageBlock | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:128` |
| `state.omni.contact-history-message.129a1` | omni | !(!!attachments) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:129` |
| `state.omni.contact-history-message.129a0` | omni | !!attachments | Attachments | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx:129` |
| `state.omni.contact-history-messages-list.103a1` | omni | !(isPending) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx:103` |
| `state.omni.contact-history-messages-list.103a0` | omni | isPending | Box | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx:103` |
| `state.omni.contact-history-messages-list.108a1` | omni | !(error) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx:108` |
| `state.omni.contact-history-messages-list.108a0` | omni | error | States | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx:108` |
| `state.omni.contact-history-messages-list.115a1` | omni | !(isSuccess && totalItemCount === 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx:115` |
| `state.omni.contact-history-messages-list.115a0` | omni | isSuccess && totalItemCount === 0 | ContextualbarEmptyContent | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx:115` |
| `state.omni.contact-history-messages-list.117a1` | omni | !(!error && totalItemCount > 0 && messages.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx:117` |
| `state.omni.contact-history-messages-list.117a0` | omni | !error && totalItemCount > 0 && messages.length > 0 | VirtualizedScrollbars | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx:117` |
| `state.omni.contact-history-messages-list.143a1` | omni | !(onOpenRoom) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx:143` |
| `state.omni.contact-history-messages-list.143a0` | omni | onOpenRoom | ContextualbarFooter | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessagesList.tsx:143` |
| `state.omni.contact-info.50a1` | omni | !(name) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:50` |
| `state.omni.contact-info.50a0` | omni | name | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:50` |
| `state.omni.contact-info.58a1` | omni | !(lastChat) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:58` |
| `state.omni.contact-info.58a0` | omni | lastChat | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:58` |
| `state.omni.contact-info.70a1` | omni | !(hasConflicts) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:70` |
| `state.omni.contact-info.70a0` | omni | hasConflicts | Callout | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:70` |
| `state.omni.contact-info.97a1` | omni | !(context === 'details') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:97` |
| `state.omni.contact-info.97a0` | omni | context === 'details' | ContactInfoDetails | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:97` |
| `state.omni.contact-info.107a1` | omni | !(context === 'channels') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:107` |
| `state.omni.contact-info.107a0` | omni | context === 'channels' | ContactInfoChannels | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:107` |
| `state.omni.contact-info.108a1` | omni | !(context === 'history') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:108` |
| `state.omni.contact-info.108a0` | omni | context === 'history' | ContactInfoHistory | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfo.tsx:108` |
| `state.omni.contact-info-with-data.23i` | omni | isPending | ContextualbarSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfoWithData.tsx:23` |
| `state.omni.contact-info-with-data.27i` | omni | isError ¦¦ !data?.contact | ContactInfoError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfoWithData.tsx:27` |
| `state.omni.contact-info-with-data.31d` | omni | 前述 if-ret 均不成立（default return） | ContactInfo | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ContactInfoWithData.tsx:31` |
| `state.omni.review-contact-modal.83i` | omni | isContactManagerField && !hasLicense | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ReviewContactModal.tsx:83` |
| `state.omni.review-contact-modal.87d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ReviewContactModal.tsx:87` |
| `state.omni.review-contact-modal.114a1` | omni | !(errors?.[name]) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ReviewContactModal.tsx:114` |
| `state.omni.review-contact-modal.114a0` | omni | errors?.[name] | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfo/ReviewContactModal.tsx:114` |
| `state.omni.contact-info-router.17i` | omni | !room.contactId | ContactInfoError | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfoRouter.tsx:17` |
| `state.omni.contact-info-router.21i` | omni | context === 'edit' && room.contactId | EditContactInfoWithData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfoRouter.tsx:21` |
| `state.omni.contact-info-router.25d` | omni | 前述 if-ret 均不成立（default return） | ContactInfo | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/ContactInfoRouter.tsx:25` |
| `state.omni.edit-contact-info.196i` | omni | isLoadingCustomFields | ContextualbarSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:196` |
| `state.omni.edit-contact-info.200d` | omni | 前述 if-ret 均不成立（default return） | ContextualbarDialog | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:200` |
| `state.omni.edit-contact-info.218a1` | omni | !(errors.name) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:218` |
| `state.omni.edit-contact-info.218a0` | omni | errors.name | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:218` |
| `state.omni.edit-contact-info.236a1` | omni | !(errors.emails?.[index]?.address) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:236` |
| `state.omni.edit-contact-info.236a0` | omni | errors.emails?.[index]?.address | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:236` |
| `state.omni.edit-contact-info.262a1` | omni | !(errors.phones?.[index]?.phoneNumber) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:262` |
| `state.omni.edit-contact-info.262a0` | omni | errors.phones?.[index]?.phoneNumber | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:262` |
| `state.omni.edit-contact-info.285a1` | omni | !(canViewCustomFields) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:285` |
| `state.omni.edit-contact-info.285a0` | omni | canViewCustomFields | CustomFieldsForm | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfo.tsx:285` |
| `state.omni.edit-contact-info-with-data.21i` | omni | isPending | ContextualbarSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfoWithData.tsx:21` |
| `state.omni.edit-contact-info-with-data.25i` | omni | isError | ContactInfoError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfoWithData.tsx:25` |
| `state.omni.edit-contact-info-with-data.29d` | omni | 前述 if-ret 均不成立（default return） | EditContactInfo | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/EditContactInfoWithData.tsx:29` |
| `state.omni.contact-info-channels.29i` | omni | isPending | ContextualbarContent | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannels.tsx:29` |
| `state.omni.contact-info-channels.39i` | omni | isError | ContextualbarContent | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannels.tsx:39` |
| `state.omni.contact-info-channels.50d` | omni | 前述 if-ret 均不成立（default return） | ContextualbarContent | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannels.tsx:50` |
| `state.omni.contact-info-channels.52a1` | omni | !(data.channels?.length === 0) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannels.tsx:52` |
| `state.omni.contact-info-channels.52a0` | omni | data.channels?.length === 0 | ContextualbarEmptyContent | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannels.tsx:52` |
| `state.omni.contact-info-channels.55a1` | omni | !(data.channels && data.channels.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannels.tsx:55` |
| `state.omni.contact-info-channels.55a0` | omni | data.channels && data.channels.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannels.tsx:55` |
| `state.omni.contact-info-channels-item.98a1` | omni | !(details) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannelsItem.tsx:98` |
| `state.omni.contact-info-channels-item.98a0` | omni | details | OmnichannelRoomIcon | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannelsItem.tsx:98` |
| `state.omni.contact-info-channels-item.99a1` | omni | !(details) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannelsItem.tsx:99` |
| `state.omni.contact-info-channels-item.99a0` | omni | details | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannelsItem.tsx:99` |
| `state.omni.contact-info-channels-item.104a1` | omni | !(lastChat) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannelsItem.tsx:104` |
| `state.omni.contact-info-channels-item.104a0` | omni | lastChat | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannelsItem.tsx:104` |
| `state.omni.contact-info-channels-item.112a1` | omni | !(showButton) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannelsItem.tsx:112` |
| `state.omni.contact-info-channels-item.112a0` | omni | showButton | GenericMenu | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoChannels/ContactInfoChannelsItem.tsx:112` |
| `state.omni.contact-info-details.30t1` | omni | !(emails?.length) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoDetails.tsx:30` |
| `state.omni.contact-info-details.30t0` | omni | emails?.length | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoDetails.tsx:30` |
| `state.omni.contact-info-details.41t1` | omni | !(phones?.length) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoDetails.tsx:41` |
| `state.omni.contact-info-details.41t0` | omni | phones?.length | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoDetails.tsx:41` |
| `state.omni.contact-info-details.52t1` | omni | !(contactManager) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoDetails.tsx:52` |
| `state.omni.contact-info-details.52t0` | omni | contactManager | ContactManagerInfo | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoDetails.tsx:52` |
| `state.omni.contact-info-details.55a1` | omni | !(createdAt) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoDetails.tsx:55` |
| `state.omni.contact-info-details.55a0` | omni | createdAt | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoDetails.tsx:55` |
| `state.omni.contact-info-details.62a1` | omni | !(customFieldEntries.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoDetails.tsx:62` |
| `state.omni.contact-info-details.62a0` | omni | customFieldEntries.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoDetails.tsx:62` |
| `state.omni.contact-info-outbound-message-button.19i` | omni | !canSendOutboundMessage | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoOutboundMessageButton.tsx:19` |
| `state.omni.contact-info-outbound-message-button.23d` | omni | 前述 if-ret 均不成立（default return） | IconButton | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactInfoOutboundMessageButton.tsx:23` |
| `state.omni.contact-manager-info.20i` | omni | isError | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactManagerInfo.tsx:20` |
| `state.omni.contact-manager-info.24d` | omni | 前述 if-ret 均不成立（default return） | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactManagerInfo.tsx:24` |
| `state.omni.contact-manager-info.27a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactManagerInfo.tsx:27` |
| `state.omni.contact-manager-info.27a0` | omni | isLoading | Skeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactManagerInfo.tsx:27` |
| `state.omni.contact-manager-info.28a1` | omni | !(isSuccess) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactManagerInfo.tsx:28` |
| `state.omni.contact-manager-info.28a0` | omni | isSuccess | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactManagerInfo.tsx:28` |
| `state.omni.contact-manager-info.30a1` | omni | !(data.user.username) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactManagerInfo.tsx:30` |
| `state.omni.contact-manager-info.30a0` | omni | data.user.username | UserAvatar | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoDetails/ContactManagerInfo.tsx:30` |
| `state.omni.contact-info-history.93a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistory.tsx:93` |
| `state.omni.contact-info-history.93a0` | omni | isLoading | Box | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistory.tsx:93` |
| `state.omni.contact-info-history.98a1` | omni | !(isError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistory.tsx:98` |
| `state.omni.contact-info-history.98a0` | omni | isError | States | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistory.tsx:98` |
| `state.omni.contact-info-history.104a1` | omni | !(data?.history.length === 0) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistory.tsx:104` |
| `state.omni.contact-info-history.104a0` | omni | data?.history.length === 0 | ContextualbarEmptyContent | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistory.tsx:104` |
| `state.omni.contact-info-history.107a1` | omni | !(!isError && data?.history && data.history.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistory.tsx:107` |
| `state.omni.contact-info-history.107a0` | omni | !isError && data?.history && data.history.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistory.tsx:107` |
| `state.omni.contact-info-history-item.64a1` | omni | !(source) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryItem.tsx:64` |
| `state.omni.contact-info-history-item.64a0` | omni | source | OmnichannelRoomIcon | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryItem.tsx:64` |
| `state.omni.contact-info-history-item.65a1` | omni | !(source) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryItem.tsx:65` |
| `state.omni.contact-info-history-item.65a0` | omni | source | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryItem.tsx:65` |
| `state.omni.contact-info-history-item.70a1` | omni | !(lastMessage) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryItem.tsx:70` |
| `state.omni.contact-info-history-item.70a0` | omni | lastMessage | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryItem.tsx:70` |
| `state.omni.contact-info-history-item.77t1` | omni | !(hasLicense && verified) | IconButton | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryItem.tsx:77` |
| `state.omni.contact-info-history-item.77t0` | omni | hasLicense && verified | Icon | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryItem.tsx:77` |
| `state.omni.contact-info-history-item.89a1` | omni | !(lastMessage?.msg.trim()) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryItem.tsx:89` |
| `state.omni.contact-info-history-item.89a0` | omni | lastMessage?.msg.trim() | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryItem.tsx:89` |
| `state.omni.contact-info-history-messages.83a1` | omni | !(isPending) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx:83` |
| `state.omni.contact-info-history-messages.83a0` | omni | isPending | Box | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx:83` |
| `state.omni.contact-info-history-messages.88a1` | omni | !(error) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx:88` |
| `state.omni.contact-info-history-messages.88a0` | omni | error | States | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx:88` |
| `state.omni.contact-info-history-messages.95a1` | omni | !(isSuccess && totalItemCount === 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx:95` |
| `state.omni.contact-info-history-messages.95a0` | omni | isSuccess && totalItemCount === 0 | ContextualbarEmptyContent | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx:95` |
| `state.omni.contact-info-history-messages.97a1` | omni | !(!error && totalItemCount > 0 && messages.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx:97` |
| `state.omni.contact-info-history-messages.97a0` | omni | !error && totalItemCount > 0 && messages.length > 0 | VirtualizedScrollbars | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx:97` |
| `state.omni.contact-info-history-messages.123a1` | omni | !(onOpenRoom) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx:123` |
| `state.omni.contact-info-history-messages.123a0` | omni | onOpenRoom | ContextualbarFooter | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryMessages.tsx:123` |
| `state.omni.contact-info-history-router.14i` | omni | chatId | ContactInfoHistoryMessages | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryRouter.tsx:14` |
| `state.omni.contact-info-history-router.20d` | omni | 前述 if-ret 均不成立（default return） | ContactInfoHistory | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/contactInfo/tabs/ContactInfoHistory/ContactInfoHistoryRouter.tsx:20` |
| `state.omni.custom-fields-page.30a1` | omni | !(context) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsPage.tsx:30` |
| `state.omni.custom-fields-page.30a0` | omni | context | ContextualbarDialog | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsPage.tsx:30` |
| `state.omni.custom-fields-page.32a1` | omni | !(context === 'edit' && id) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsPage.tsx:32` |
| `state.omni.custom-fields-page.32a0` | omni | context === 'edit' && id | EditCustomFieldsWithData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsPage.tsx:32` |
| `state.omni.custom-fields-page.33a1` | omni | !(context === 'new') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsPage.tsx:33` |
| `state.omni.custom-fields-page.33a0` | omni | context === 'new' | EditCustomFields | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsPage.tsx:33` |
| `state.omni.custom-fields-route.9i` | omni | !canViewCustomFields | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsRoute.tsx:9` |
| `state.omni.custom-fields-route.13d` | omni | 前述 if-ret 均不成立（default return） | CustomFieldsPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsRoute.tsx:13` |
| `state.omni.custom-fields-table.81a1` | omni | !(((isSuccess && data?.customFields.length > 0) ¦¦ queryHasChanged)) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsTable.tsx:81` |
| `state.omni.custom-fields-table.81a0` | omni | ((isSuccess && data?.customFields.length > 0) ¦¦ queryHasChanged) | FilterByText | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsTable.tsx:81` |
| `state.omni.custom-fields-table.84a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsTable.tsx:84` |
| `state.omni.custom-fields-table.84a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsTable.tsx:84` |
| `state.omni.custom-fields-table.92a1` | omni | !(isSuccess && data.customFields.length === 0 && queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsTable.tsx:92` |
| `state.omni.custom-fields-table.92a0` | omni | isSuccess && data.customFields.length === 0 && queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsTable.tsx:92` |
| `state.omni.custom-fields-table.93a1` | omni | !(isSuccess && data.customFields.length === 0 && !queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsTable.tsx:93` |
| `state.omni.custom-fields-table.93a0` | omni | isSuccess && data.customFields.length === 0 && !queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsTable.tsx:93` |
| `state.omni.custom-fields-table.105a1` | omni | !(isSuccess && data.customFields.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsTable.tsx:105` |
| `state.omni.custom-fields-table.105a0` | omni | isSuccess && data.customFields.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/CustomFieldsTable.tsx:105` |
| `state.omni.edit-custom-fields.153a1` | omni | !(errors?.field) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFields.tsx:153` |
| `state.omni.edit-custom-fields.153a0` | omni | errors?.field | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFields.tsx:153` |
| `state.omni.edit-custom-fields.179a1` | omni | !(errors?.label) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFields.tsx:179` |
| `state.omni.edit-custom-fields.179a0` | omni | errors?.label | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFields.tsx:179` |
| `state.omni.edit-custom-fields.221a1` | omni | !(CustomFieldsAdditionalForm) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFields.tsx:221` |
| `state.omni.edit-custom-fields.221a0` | omni | CustomFieldsAdditionalForm | CustomFieldsAdditionalForm | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFields.tsx:221` |
| `state.omni.edit-custom-fields.233a1` | omni | !(customFieldData?._id) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFields.tsx:233` |
| `state.omni.edit-custom-fields.233a0` | omni | customFieldData?._id | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFields.tsx:233` |
| `state.omni.edit-custom-fields-with-data.20i` | omni | isPending | ContextualbarSkeletonBody | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFieldsWithData.tsx:20` |
| `state.omni.edit-custom-fields-with-data.24i` | omni | isError | Callout | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFieldsWithData.tsx:24` |
| `state.omni.edit-custom-fields-with-data.28d` | omni | 前述 if-ret 均不成立（default return） | EditCustomFields | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/customFields/EditCustomFieldsWithData.tsx:28` |
| `state.omni.agent-avatar.19a1` | omni | !(!mediaQuery && name) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentAgentsTable/AgentAvatar.tsx:19` |
| `state.omni.agent-avatar.19a0` | omni | !mediaQuery && name | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentAgentsTable/AgentAvatar.tsx:19` |
| `state.omni.department-tags.43a1` | omni | !(tags?.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentTags.tsx:43` |
| `state.omni.department-tags.43a0` | omni | tags?.length > 0 | FieldRow | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentTags.tsx:43` |
| `state.omni.departments-page.33i` | omni | context === 'new' | NewDepartment | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsPage.tsx:33` |
| `state.omni.departments-page.37i` | omni | context === 'edit' | EditDepartmentWithData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsPage.tsx:37` |
| `state.omni.departments-page.41d` | omni | 前述 if-ret 均不成立（default return） | Page | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsPage.tsx:41` |
| `state.omni.departments-route.9i` | omni | !canViewDepartments | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsRoute.tsx:9` |
| `state.omni.departments-route.13d` | omni | 前述 if-ret 均不成立（default return） | DepartmentsPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsRoute.tsx:13` |
| `state.omni.departments-table.101a1` | omni | !(((isSuccess && data?.departments.length > 0) ¦¦ queryHasChanged)) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentsTable.tsx:101` |
| `state.omni.departments-table.101a0` | omni | ((isSuccess && data?.departments.length > 0) ¦¦ queryHasChanged) | FilterByText | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentsTable.tsx:101` |
| `state.omni.departments-table.104a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentsTable.tsx:104` |
| `state.omni.departments-table.104a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentsTable.tsx:104` |
| `state.omni.departments-table.112a1` | omni | !(isSuccess && data?.departments.length === 0 && (queryHasChanged ¦¦ archived)) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentsTable.tsx:112` |
| `state.omni.departments-table.112a0` | omni | isSuccess && data?.departments.length === 0 && (queryHasChanged ¦¦ archived) | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentsTable.tsx:112` |
| `state.omni.departments-table.113a1` | omni | !(isSuccess && data?.departments.length === 0 && !queryHasChanged && !archived) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentsTable.tsx:113` |
| `state.omni.departments-table.113a0` | omni | isSuccess && data?.departments.length === 0 && !queryHasChanged && !archived | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentsTable.tsx:113` |
| `state.omni.departments-table.124a1` | omni | !(isSuccess && data?.departments.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentsTable.tsx:124` |
| `state.omni.departments-table.124a0` | omni | isSuccess && data?.departments.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/DepartmentsTable/DepartmentsTable.tsx:124` |
| `state.omni.edit-department.179a1` | omni | !(errors.name) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:179` |
| `state.omni.edit-department.179a0` | omni | errors.name | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:179` |
| `state.omni.edit-department.214a1` | omni | !(errors.email) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:214` |
| `state.omni.edit-department.214a0` | omni | errors.email | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:214` |
| `state.omni.edit-department.249a1` | omni | !(hasLicense) | null | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:249` |
| `state.omni.edit-department.249a0` | omni | hasLicense | <> | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:249` |
| `state.omni.edit-department.372a1` | omni | !(errors.unit) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:372` |
| `state.omni.edit-department.372a0` | omni | errors.unit | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:372` |
| `state.omni.edit-department.402a1` | omni | !(errors.chatClosingTags) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:402` |
| `state.omni.edit-department.402a0` | omni | errors.chatClosingTags | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartment.tsx:402` |
| `state.omni.edit-department-with-allowed-forward-data.27i` | omni | isLoading | FormSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithAllowedForwardData.tsx:27` |
| `state.omni.edit-department-with-allowed-forward-data.31i` | omni | isError | Box | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithAllowedForwardData.tsx:31` |
| `state.omni.edit-department-with-allowed-forward-data.35d` | omni | 前述 if-ret 均不成立（default return） | EditDepartment | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithAllowedForwardData.tsx:35` |
| `state.omni.edit-department-with-data.26i` | omni | isLoading | FormSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithData.tsx:26` |
| `state.omni.edit-department-with-data.30i` | omni | isError ¦¦ (id && !data?.department) | Box | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithData.tsx:30` |
| `state.omni.edit-department-with-data.34i` | omni | data?.department?.archived === true | Box | 登录 omni 经理 → 顶栏 Omnichannel；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithData.tsx:34` |
| `state.omni.edit-department-with-data.38d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithData.tsx:38` |
| `state.omni.edit-department-with-data.40t1` | omni | !(data?.department?.departmentsAllowedToForward && data.department.departmentsAllowedToForward.length…) | EditDepartment | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithData.tsx:40` |
| `state.omni.edit-department-with-data.40t0` | omni | data?.department?.departmentsAllowedToForward && data.department.departmentsAllowedToForward.length… | EditDepartmentWithAllowedForwardData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/EditDepartmentWithData.tsx:40` |
| `state.omni.new-department.30i` | omni | isError | Callout | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/NewDepartment.tsx:30` |
| `state.omni.new-department.34i` | omni | !data ¦¦ isPending ¦¦ !data.isDepartmentCreationAvailable | PageSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/NewDepartment.tsx:34` |
| `state.omni.new-department.38d` | omni | 前述 if-ret 均不成立（default return） | EditDepartment | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/departments/NewDepartment.tsx:38` |
| `state.omni.chats-contextual-bar.16i` | omni | context === 'filters' | ChatsFiltersContextualBar | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/ChatsContextualBar.tsx:16` |
| `state.omni.chats-contextual-bar.20i` | omni | context === 'info' && id | ContactHistoryMessagesList | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/ChatsContextualBar.tsx:20` |
| `state.omni.chats-contextual-bar.24d` | omni | 前述 if-ret 均不成立（default return） | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/ChatsContextualBar.tsx:24` |
| `state.omni.contact-contextual-bar.24i` | omni | context === 'edit' && contactId | EditContactInfoWithData | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/ContactContextualBar.tsx:24` |
| `state.omni.contact-contextual-bar.28i` | omni | context === 'new' && !contactId | EditContactInfo | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/ContactContextualBar.tsx:28` |
| `state.omni.contact-contextual-bar.32i` | omni | !contactId | ContactInfoError | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/ContactContextualBar.tsx:32` |
| `state.omni.contact-contextual-bar.36d` | omni | 前述 if-ret 均不成立（default return） | ContactInfo | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/ContactContextualBar.tsx:36` |
| `state.omni.omnichannel-directory-page.46a1` | omni | !(isWorkspaceOverMacLimit) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryPage.tsx:46` |
| `state.omni.omnichannel-directory-page.46a0` | omni | isWorkspaceOverMacLimit | Box | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryPage.tsx:46` |
| `state.omni.omnichannel-directory-page.53a1` | omni | !(tab === 'chats') | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryPage.tsx:53` |
| `state.omni.omnichannel-directory-page.53a0` | omni | tab === 'chats' | ChatsTab | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryPage.tsx:53` |
| `state.omni.omnichannel-directory-page.54a1` | omni | !(tab === 'contacts') | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryPage.tsx:54` |
| `state.omni.omnichannel-directory-page.54a0` | omni | tab === 'contacts' | ContactTab | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryPage.tsx:54` |
| `state.omni.omnichannel-directory-page.57a1` | omni | !(context) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryPage.tsx:57` |
| `state.omni.omnichannel-directory-page.57a0` | omni | context | ContextualBarRouter | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryPage.tsx:57` |
| `state.omni.omnichannel-directory-router.9i` | omni | !canViewDirectory | NotAuthorizedPage | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryRouter.tsx:9` |
| `state.omni.omnichannel-directory-router.13d` | omni | 前述 if-ret 均不成立（default return） | OmnichannelDirectoryPage | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/OmnichannelDirectoryRouter.tsx:13` |
| `state.omni.chat-info.95a1` | omni | !(source) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:95` |
| `state.omni.chat-info.95a0` | omni | source | SourceField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:95` |
| `state.omni.chat-info.96a1` | omni | !(room && v) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:96` |
| `state.omni.chat-info.96a0` | omni | room && v | ContactField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:96` |
| `state.omni.chat-info.97a1` | omni | !(visitorId) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:97` |
| `state.omni.chat-info.97a0` | omni | visitorId | VisitorClientInfo | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:97` |
| `state.omni.chat-info.98a1` | omni | !(servedBy) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:98` |
| `state.omni.chat-info.98a0` | omni | servedBy | AgentField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:98` |
| `state.omni.chat-info.99a1` | omni | !(departmentId) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:99` |
| `state.omni.chat-info.99a0` | omni | departmentId | DepartmentField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:99` |
| `state.omni.chat-info.100a1` | omni | !(tags && tags.length > 0) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:100` |
| `state.omni.chat-info.100a0` | omni | tags && tags.length > 0 | InfoPanelField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:100` |
| `state.omni.chat-info.116a1` | omni | !(topic) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:116` |
| `state.omni.chat-info.116a0` | omni | topic | InfoPanelField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:116` |
| `state.omni.chat-info.124a1` | omni | !(queueStartedAt) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:124` |
| `state.omni.chat-info.124a0` | omni | queueStartedAt | InfoPanelField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:124` |
| `state.omni.chat-info.130a1` | omni | !(closedAt && ts) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:130` |
| `state.omni.chat-info.130a0` | omni | closedAt && ts | InfoPanelField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:130` |
| `state.omni.chat-info.136a1` | omni | !(ts) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:136` |
| `state.omni.chat-info.136a0` | omni | ts | InfoPanelField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:136` |
| `state.omni.chat-info.142a1` | omni | !(closedAt) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:142` |
| `state.omni.chat-info.142a0` | omni | closedAt | InfoPanelField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:142` |
| `state.omni.chat-info.148a1` | omni | !(servedBy?.ts) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:148` |
| `state.omni.chat-info.148a0` | omni | servedBy?.ts | InfoPanelField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:148` |
| `state.omni.chat-info.154a1` | omni | !(metrics?.response?.avg && formatDuration(metrics.response.avg)) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:154` |
| `state.omni.chat-info.154a0` | omni | metrics?.response?.avg && formatDuration(metrics.response.avg) | InfoPanelField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:154` |
| `state.omni.chat-info.160a1` | omni | !(!waitingResponse && responseBy?.lastMessageTs) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:160` |
| `state.omni.chat-info.160a0` | omni | !waitingResponse && responseBy?.lastMessageTs | InfoPanelField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:160` |
| `state.omni.chat-info.168a1` | omni | !(slaId) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:168` |
| `state.omni.chat-info.168a0` | omni | slaId | SlaField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:168` |
| `state.omni.chat-info.169a1` | omni | !(priorityId) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:169` |
| `state.omni.chat-info.169a0` | omni | priorityId | PriorityField | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatInfo.tsx:169` |
| `state.omni.chats-contextual-bar.44t1` | omni | !(context === 'edit') | ChatInfo | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatsContextualBar.tsx:44` |
| `state.omni.chats-contextual-bar.44t0` | omni | context === 'edit' | RoomEdit | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/ChatsContextualBar.tsx:44` |
| `state.omni.department-field.20a1` | omni | !(isLoading) | null | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/DepartmentField.tsx:20` |
| `state.omni.department-field.20a0` | omni | isLoading | Skeleton | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/DepartmentField.tsx:20` |
| `state.omni.department-field.21a1` | omni | !(isError) | null | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/DepartmentField.tsx:21` |
| `state.omni.department-field.21a0` | omni | isError | Box | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/DepartmentField.tsx:21` |
| `state.omni.department-field.22a1` | omni | !(!isLoading && !isError) | null | 登录 omni → `/omnichannel-directory`；等查询 in-flight；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/DepartmentField.tsx:22` |
| `state.omni.department-field.22a0` | omni | !isLoading && !isError | Info | 登录 omni → `/omnichannel-directory`；等查询 in-flight；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/DepartmentField.tsx:22` |
| `state.omni.room-edit.122i` | omni | isCustomFieldsLoading ¦¦ isSlaPoliciesLoading ¦¦ isPrioritiesLoading | ContextualbarContent | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEdit.tsx:122` |
| `state.omni.room-edit.130d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEdit.tsx:130` |
| `state.omni.room-edit.133a1` | omni | !(canViewCustomFields && customFieldsMetadata) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEdit.tsx:133` |
| `state.omni.room-edit.133a0` | omni | canViewCustomFields && customFieldsMetadata | CustomFieldsForm | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEdit.tsx:133` |
| `state.omni.room-edit.148a1` | omni | !(SlaPoliciesSelect && !!slaPolicies?.length) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEdit.tsx:148` |
| `state.omni.room-edit.148a0` | omni | SlaPoliciesSelect && !!slaPolicies?.length | SlaPoliciesSelect | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEdit.tsx:148` |
| `state.omni.room-edit.152a1` | omni | !(PrioritiesSelect && !!priorities?.length) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEdit.tsx:152` |
| `state.omni.room-edit.152a0` | omni | PrioritiesSelect && !!priorities?.length | PrioritiesSelect | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEdit.tsx:152` |
| `state.omni.room-edit-with-data.24i` | omni | isRoomLoading ¦¦ isVisitorLoading | FormSkeleton | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEditWithData.tsx:24` |
| `state.omni.room-edit-with-data.28i` | omni | isRoomError ¦¦ !room | Box | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEditWithData.tsx:28` |
| `state.omni.room-edit-with-data.32i` | omni | isVisitorError ¦¦ !visitor | Box | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEditWithData.tsx:32` |
| `state.omni.room-edit-with-data.36d` | omni | 前述 if-ret 均不成立（default return） | RoomEdit | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/RoomEdit/RoomEditWithData.tsx:36` |
| `state.omni.visitor-client-info.31i` | omni | isPending | FormSkeleton | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:31` |
| `state.omni.visitor-client-info.35i` | omni | isError ¦¦ !visitor.userAgent | null | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:35` |
| `state.omni.visitor-client-info.48d` | omni | 前述 if-ret 均不成立（default return） | <> | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:48` |
| `state.omni.visitor-client-info.50a1` | omni | !(clientData.os) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:50` |
| `state.omni.visitor-client-info.50a0` | omni | clientData.os | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:50` |
| `state.omni.visitor-client-info.56a1` | omni | !(clientData.browser) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:56` |
| `state.omni.visitor-client-info.56a0` | omni | clientData.browser | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:56` |
| `state.omni.visitor-client-info.62a1` | omni | !(clientData.host) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:62` |
| `state.omni.visitor-client-info.62a0` | omni | clientData.host | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:62` |
| `state.omni.visitor-client-info.68a1` | omni | !(clientData.ip) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:68` |
| `state.omni.visitor-client-info.68a0` | omni | clientData.ip | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatInfo/VisitorClientInfo.tsx:68` |
| `state.omni.chats-filters-contextual-bar.101a1` | omni | !(canViewLivechatRooms) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsFiltersContextualBar.tsx:101` |
| `state.omni.chats-filters-contextual-bar.101a0` | omni | canViewLivechatRooms | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsFiltersContextualBar.tsx:101` |
| `state.omni.chats-filters-contextual-bar.161a1` | omni | !(isEnterprise) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsFiltersContextualBar.tsx:161` |
| `state.omni.chats-filters-contextual-bar.161a0` | omni | isEnterprise | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsFiltersContextualBar.tsx:161` |
| `state.omni.chats-filters-contextual-bar.179i` | omni | customField.type === 'select' | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsFiltersContextualBar.tsx:179` |
| `state.omni.chats-filters-contextual-bar.203d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsFiltersContextualBar.tsx:203` |
| `state.omni.chats-tab.9i` | omni | hasAccess | ChatsTable | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTab.tsx:9` |
| `state.omni.chats-tab.13d` | omni | 前述 if-ret 均不成立（default return） | NotAuthorizedPage | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTab.tsx:13` |
| `state.omni.chats-table.52a1` | omni | !(isPriorityEnabled) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:52` |
| `state.omni.chats-table.52a0` | omni | isPriorityEnabled | GenericTableHeaderCell | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:52` |
| `state.omni.chats-table.66a1` | omni | !(canRemoveClosedChats) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:66` |
| `state.omni.chats-table.66a0` | omni | canRemoveClosedChats | GenericTableHeaderCell | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:66` |
| `state.omni.chats-table.73a1` | omni | !(isLoading) | null | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:73` |
| `state.omni.chats-table.73a0` | omni | isLoading | GenericTable | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:73` |
| `state.omni.chats-table.81a1` | omni | !(isSuccess && data?.rooms.length === 0 && queryHasChanged) | null | 登录 omni → `/omnichannel-directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:81` |
| `state.omni.chats-table.81a0` | omni | isSuccess && data?.rooms.length === 0 && queryHasChanged | GenericNoResults | 登录 omni → `/omnichannel-directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:81` |
| `state.omni.chats-table.82a1` | omni | !(isSuccess && data?.rooms.length === 0 && !queryHasChanged) | null | 登录 omni → `/omnichannel-directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:82` |
| `state.omni.chats-table.82a0` | omni | isSuccess && data?.rooms.length === 0 && !queryHasChanged | GenericNoResults | 登录 omni → `/omnichannel-directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:82` |
| `state.omni.chats-table.91a1` | omni | !(isSuccess && data?.rooms.length > 0) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:91` |
| `state.omni.chats-table.91a0` | omni | isSuccess && data?.rooms.length > 0 | <> | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:91` |
| `state.omni.chats-table.108a1` | omni | !(isError) | null | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:108` |
| `state.omni.chats-table.108a0` | omni | isError | States | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTable.tsx:108` |
| `state.omni.chats-table-filter.74a1` | omni | !(menuItems.length > 0) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableFilter.tsx:74` |
| `state.omni.chats-table-filter.74a0` | omni | menuItems.length > 0 | GenericMenu | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableFilter.tsx:74` |
| `state.omni.chats-table-filter.78i` | omni | !label | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableFilter.tsx:78` |
| `state.omni.chats-table-filter.82d` | omni | 前述 if-ret 均不成立（default return） | Chip | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableFilter.tsx:82` |
| `state.omni.chats-table-row.67a1` | omni | !(tags) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:67` |
| `state.omni.chats-table-row.67a0` | omni | tags | Box | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:67` |
| `state.omni.chats-table-row.80a1` | omni | !(isPriorityEnabled) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:80` |
| `state.omni.chats-table-row.80a0` | omni | isPriorityEnabled | GenericTableCell | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:80` |
| `state.omni.chats-table-row.107a1` | omni | !(lm) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:107` |
| `state.omni.chats-table-row.107a0` | omni | lm | Box | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:107` |
| `state.omni.chats-table-row.120a1` | omni | !(canRemoveClosedChats) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:120` |
| `state.omni.chats-table-row.120a1d60a` | omni | !(!open) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:120` |
| `state.omni.chats-table-row.120a0` | omni | canRemoveClosedChats | GenericTableCell | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:120` |
| `state.omni.chats-table-row.120a07b25` | omni | !open | RemoveChatButton | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/chats/ChatsTable/ChatsTableRow.tsx:120` |
| `state.omni.agent-field.28i` | omni | isLoading | FormSkeleton | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/AgentField.tsx:28` |
| `state.omni.agent-field.38d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/AgentField.tsx:38` |
| `state.omni.contact-field.32i` | omni | isPending | FormSkeleton | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/ContactField.tsx:32` |
| `state.omni.contact-field.36i` | omni | isError ¦¦ !data?.visitor | Box | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/ContactField.tsx:36` |
| `state.omni.contact-field.48d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/ContactField.tsx:48` |
| `state.omni.priority-field.18i` | omni | isLoading | FormSkeleton | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/PriorityField.tsx:18` |
| `state.omni.priority-field.22i` | omni | isError ¦¦ !data | Box | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/PriorityField.tsx:22` |
| `state.omni.priority-field.27d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/PriorityField.tsx:27` |
| `state.omni.sla-field.20i` | omni | isLoading | FormSkeleton | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/SlaField.tsx:20` |
| `state.omni.sla-field.24i` | omni | isError ¦¦ !data | Box | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/SlaField.tsx:24` |
| `state.omni.sla-field.29d` | omni | 前述 if-ret 均不成立（default return） | Field | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/components/SlaField.tsx:29` |
| `state.omni.contact-tab.9i` | omni | hasAccess | ContactTable | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTab.tsx:9` |
| `state.omni.contact-tab.13d` | omni | 前述 if-ret 均不成立（default return） | NotAuthorizedPage | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTab.tsx:13` |
| `state.omni.contact-table.95a1` | omni | !(((isSuccess && data?.contacts.length > 0) ¦¦ queryHasChanged)) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:95` |
| `state.omni.contact-table.95a0` | omni | ((isSuccess && data?.contacts.length > 0) ¦¦ queryHasChanged) | FilterByText | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:95` |
| `state.omni.contact-table.102a1` | omni | !(isLoading) | null | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:102` |
| `state.omni.contact-table.102a0` | omni | isLoading | GenericTable | 登录 omni → `/omnichannel-directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:102` |
| `state.omni.contact-table.110a1` | omni | !(isSuccess && data?.contacts.length === 0 && queryHasChanged) | null | 登录 omni → `/omnichannel-directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:110` |
| `state.omni.contact-table.110a0` | omni | isSuccess && data?.contacts.length === 0 && queryHasChanged | GenericNoResults | 登录 omni → `/omnichannel-directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:110` |
| `state.omni.contact-table.111a1` | omni | !(isSuccess && data?.contacts.length === 0 && !queryHasChanged) | null | 登录 omni → `/omnichannel-directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:111` |
| `state.omni.contact-table.111a0` | omni | isSuccess && data?.contacts.length === 0 && !queryHasChanged | GenericNoResults | 登录 omni → `/omnichannel-directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:111` |
| `state.omni.contact-table.122a1` | omni | !(isSuccess && data?.contacts.length > 0) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:122` |
| `state.omni.contact-table.122a0` | omni | isSuccess && data?.contacts.length > 0 | <> | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:122` |
| `state.omni.contact-table.139a1` | omni | !(isError) | null | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:139` |
| `state.omni.contact-table.139a0` | omni | isError | Box | 登录 omni → `/omnichannel-directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTable.tsx:139` |
| `state.omni.contact-table-row.59a1` | omni | !(latestChannel?.details) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTableRow.tsx:59` |
| `state.omni.contact-table-row.59a0` | omni | latestChannel?.details | Box | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTableRow.tsx:59` |
| `state.omni.contact-table-row.70a1` | omni | !(lastChat) | null | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTableRow.tsx:70` |
| `state.omni.contact-table-row.70a0` | omni | lastChat | Box | 登录 omni → `/omnichannel-directory` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/directory/contacts/ContactTableRow.tsx:70` |
| `state.omni.managers-route.12i` | omni | !canViewManagers | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersRoute.tsx:12` |
| `state.omni.managers-route.16d` | omni | 前述 if-ret 均不成立（default return） | Page | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersRoute.tsx:16` |
| `state.omni.managers-table.84a1` | omni | !(((isSuccess && data?.users.length > 0) ¦¦ queryHasChanged)) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:84` |
| `state.omni.managers-table.84a0` | omni | ((isSuccess && data?.users.length > 0) ¦¦ queryHasChanged) | FilterByText | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:84` |
| `state.omni.managers-table.87a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:87` |
| `state.omni.managers-table.87a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:87` |
| `state.omni.managers-table.95a1` | omni | !(isSuccess && data.users.length === 0) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:95` |
| `state.omni.managers-table.95a0` | omni | isSuccess && data.users.length === 0 | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:95` |
| `state.omni.managers-table.104a1` | omni | !(isSuccess && data.users.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:104` |
| `state.omni.managers-table.104a0` | omni | isSuccess && data.users.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:104` |
| `state.omni.managers-table.146a1` | omni | !(isError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:146` |
| `state.omni.managers-table.146a0` | omni | isError | GenericError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/managers/ManagersTable.tsx:146` |
| `state.omni.close-chat-modal.153i` | omni | commentRequired ¦¦ tagRequired ¦¦ canSendTranscript | Modal | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:153` |
| `state.omni.close-chat-modal.184a1` | omni | !(canSendTranscript) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:184` |
| `state.omni.close-chat-modal.184a0` | omni | canSendTranscript | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:184` |
| `state.omni.close-chat-modal.190a1` | omni | !(canSendTranscriptPDF) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:190` |
| `state.omni.close-chat-modal.190a0` | omni | canSendTranscriptPDF | Field | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:190` |
| `state.omni.close-chat-modal.198a1` | omni | !(canSendTranscriptEmail) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:198` |
| `state.omni.close-chat-modal.198a0` | omni | canSendTranscriptEmail | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:198` |
| `state.omni.close-chat-modal.206a1` | omni | !(transcriptEmail) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:206` |
| `state.omni.close-chat-modal.206a0` | omni | transcriptEmail | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:206` |
| `state.omni.close-chat-modal.253d` | omni | 前述 if-ret 均不成立（default return） | GenericModal | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModal.tsx:253` |
| `state.omni.close-chat-modal-data.29i` | omni | isPending | FormSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModalData.tsx:29` |
| `state.omni.close-chat-modal-data.33d` | omni | 前述 if-ret 均不成立（default return） | CloseChatModal | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/CloseChatModalData.tsx:33` |
| `state.omni.transcript-modal.78a1` | omni | !(!!transcriptRequest) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:78` |
| `state.omni.transcript-modal.78a0` | omni | !!transcriptRequest | p | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:78` |
| `state.omni.transcript-modal.98a1` | omni | !(errors.email) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:98` |
| `state.omni.transcript-modal.98a0` | omni | errors.email | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:98` |
| `state.omni.transcript-modal.112a1` | omni | !(errors.subject) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:112` |
| `state.omni.transcript-modal.112a0` | omni | errors.subject | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:112` |
| `state.omni.transcript-modal.119a1` | omni | !(roomOpen && transcriptRequest) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:119` |
| `state.omni.transcript-modal.119a0` | omni | roomOpen && transcriptRequest | Button | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:119` |
| `state.omni.transcript-modal.124a1` | omni | !(roomOpen && !transcriptRequest) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:124` |
| `state.omni.transcript-modal.124a0` | omni | roomOpen && !transcriptRequest | Button | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:124` |
| `state.omni.transcript-modal.129a1` | omni | !(!roomOpen) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:129` |
| `state.omni.transcript-modal.129a0` | omni | !roomOpen | Button | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/modals/TranscriptModal.tsx:129` |
| `state.omni.monitors-page-container.9i` | omni | isPending | PageSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsPageContainer.tsx:9` |
| `state.omni.monitors-page-container.13i` | omni | !hasLicense | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsPageContainer.tsx:13` |
| `state.omni.monitors-page-container.17d` | omni | 前述 if-ret 均不成立（default return） | MonitorsPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsPageContainer.tsx:17` |
| `state.omni.monitors-table.144a1` | omni | !(((isSuccess && data?.monitors.length > 0) ¦¦ queryHasChanged)) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:144` |
| `state.omni.monitors-table.144a0` | omni | ((isSuccess && data?.monitors.length > 0) ¦¦ queryHasChanged) | FilterByText | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:144` |
| `state.omni.monitors-table.147a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:147` |
| `state.omni.monitors-table.147a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:147` |
| `state.omni.monitors-table.155a1` | omni | !(isSuccess && data.monitors.length === 0 && queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:155` |
| `state.omni.monitors-table.155a0` | omni | isSuccess && data.monitors.length === 0 && queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:155` |
| `state.omni.monitors-table.156a1` | omni | !(isSuccess && data.monitors.length === 0 && !queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:156` |
| `state.omni.monitors-table.156a0` | omni | isSuccess && data.monitors.length === 0 && !queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:156` |
| `state.omni.monitors-table.165a1` | omni | !(isSuccess && data.monitors.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:165` |
| `state.omni.monitors-table.165a0` | omni | isSuccess && data.monitors.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:165` |
| `state.omni.monitors-table.193a1` | omni | !(isError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:193` |
| `state.omni.monitors-table.193a0` | omni | isError | States | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/monitors/MonitorsTable.tsx:193` |
| `state.omni.priorities-page.97a1` | omni | !(context === 'edit') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesPage.tsx:97` |
| `state.omni.priorities-page.97a0` | omni | context === 'edit' | PriorityList | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesPage.tsx:97` |
| `state.omni.priorities-route.11i` | omni | !canViewPriorities | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesRoute.tsx:11` |
| `state.omni.priorities-route.15d` | omni | 前述 if-ret 均不成立（default return） | PrioritiesPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesRoute.tsx:15` |
| `state.omni.priorities-table.34a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesTable.tsx:34` |
| `state.omni.priorities-table.34a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesTable.tsx:34` |
| `state.omni.priorities-table.42a1` | omni | !(priorities?.length === 0) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesTable.tsx:42` |
| `state.omni.priorities-table.42a0` | omni | priorities?.length === 0 | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesTable.tsx:42` |
| `state.omni.priorities-table.43a1` | omni | !(priorities && priorities?.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesTable.tsx:43` |
| `state.omni.priorities-table.43a0` | omni | priorities && priorities?.length > 0 | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PrioritiesTable.tsx:43` |
| `state.omni.priority-edit-form.95a1` | omni | !(errors.name) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PriorityEditForm.tsx:95` |
| `state.omni.priority-edit-form.95a0` | omni | errors.name | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PriorityEditForm.tsx:95` |
| `state.omni.priority-edit-form-with-data.17i` | omni | isLoading | FormSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PriorityEditFormWithData.tsx:17` |
| `state.omni.priority-edit-form-with-data.21i` | omni | isError ¦¦ !data | Callout | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PriorityEditFormWithData.tsx:21` |
| `state.omni.priority-edit-form-with-data.29d` | omni | 前述 if-ret 均不成立（default return） | PriorityEditForm | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PriorityEditFormWithData.tsx:29` |
| `state.omni.priority-icon.15i` | omni | !prioritiesConfig | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PriorityIcon.tsx:15` |
| `state.omni.priority-icon.19d` | omni | 前述 if-ret 均不成立（default return） | Icon | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/priorities/PriorityIcon.tsx:19` |
| `state.omni.queue-list-table.42a1` | omni | !(mediaQuery) | null | 登录 omni → `/livechat-queue` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/queueList/QueueListTable.tsx:42` |
| `state.omni.queue-list-table.42a0` | omni | mediaQuery | GenericTableHeaderCell | 登录 omni → `/livechat-queue` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/queueList/QueueListTable.tsx:42` |
| `state.omni.queue-list-table.119a1` | omni | !(isLoading) | null | 登录 omni → `/livechat-queue`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/queueList/QueueListTable.tsx:119` |
| `state.omni.queue-list-table.119a0` | omni | isLoading | GenericTable | 登录 omni → `/livechat-queue`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/queueList/QueueListTable.tsx:119` |
| `state.omni.queue-list-table.127a1` | omni | !(isSuccess && data?.queue.length === 0) | null | 登录 omni → `/livechat-queue`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/queueList/QueueListTable.tsx:127` |
| `state.omni.queue-list-table.127a0` | omni | isSuccess && data?.queue.length === 0 | GenericNoResults | 登录 omni → `/livechat-queue`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/queueList/QueueListTable.tsx:127` |
| `state.omni.queue-list-table.128a1` | omni | !(isSuccess && data?.queue.length > 0) | null | 登录 omni → `/livechat-queue` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/queueList/QueueListTable.tsx:128` |
| `state.omni.queue-list-table.128a0` | omni | isSuccess && data?.queue.length > 0 | <> | 登录 omni → `/livechat-queue` | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/queueList/QueueListTable.tsx:128` |
| `state.omni.reports-page.18i` | omni | !hasPermission ¦¦ !isEnterprise | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/ReportsPage.tsx:18` |
| `state.omni.reports-page.22d` | omni | 前述 if-ret 均不成立（default return） | Page | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/ReportsPage.tsx:22` |
| `state.omni.bar-chart.52i` | omni | width >= labelSkipWidth | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/components/BarChart.tsx:52` |
| `state.omni.bar-chart.56d` | omni | 前述 if-ret 均不成立（default return） | text | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/components/BarChart.tsx:56` |
| `state.omni.bar-chart.74i` | omni | height >= labelSkipHeight | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/components/BarChart.tsx:74` |
| `state.omni.bar-chart.78d` | omni | 前述 if-ret 均不成立（default return） | text | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/components/BarChart.tsx:78` |
| `state.omni.report-card-content.16i` | omni | isPending | ReportCardLoadingState | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/components/ReportCardContent.tsx:16` |
| `state.omni.report-card-content.19i` | omni | isError | ReportCardErrorState | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/components/ReportCardContent.tsx:19` |
| `state.omni.report-card-content.22i` | omni | !isDataFound | ReportCardEmptyState | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/components/ReportCardContent.tsx:22` |
| `state.omni.report-card-empty-state.17a1` | omni | !(subtitle) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/components/ReportCardEmptyState.tsx:17` |
| `state.omni.report-card-empty-state.17a0` | omni | subtitle | StatesSubtitle | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/reports/components/ReportCardEmptyState.tsx:17` |
| `state.omni.security-privacy-page.14i` | omni | !hasPermission | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/securityPrivacy/SecurityPrivacyPage.tsx:14` |
| `state.omni.security-privacy-page.18d` | omni | 前述 if-ret 均不成立（default return） | GenericGroupPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/securityPrivacy/SecurityPrivacyPage.tsx:18` |
| `state.omni.sla-edit.104a1` | omni | !(errors.name) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEdit.tsx:104` |
| `state.omni.sla-edit.104a0` | omni | errors.name | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEdit.tsx:104` |
| `state.omni.sla-edit.131a1` | omni | !(errors.dueTimeInMinutes) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEdit.tsx:131` |
| `state.omni.sla-edit.131a0` | omni | errors.dueTimeInMinutes | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEdit.tsx:131` |
| `state.omni.sla-edit.140a1` | omni | !(!isNew) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEdit.tsx:140` |
| `state.omni.sla-edit.140a0` | omni | !isNew | Button | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEdit.tsx:140` |
| `state.omni.sla-edit-with-data.22i` | omni | isPending | FormSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEditWithData.tsx:22` |
| `state.omni.sla-edit-with-data.26i` | omni | isError ¦¦ !data | Callout | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEditWithData.tsx:26` |
| `state.omni.sla-edit-with-data.34d` | omni | 前述 if-ret 均不成立（default return） | SlaEdit | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaEditWithData.tsx:34` |
| `state.omni.sla-page.54a1` | omni | !(context) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaPage.tsx:54` |
| `state.omni.sla-page.54a0` | omni | context | ContextualbarDialog | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaPage.tsx:54` |
| `state.omni.sla-page.63a1` | omni | !(context === 'edit' && id) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaPage.tsx:63` |
| `state.omni.sla-page.63a0` | omni | context === 'edit' && id | SlaEditWithData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaPage.tsx:63` |
| `state.omni.sla-page.64a1` | omni | !(context === 'new') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaPage.tsx:64` |
| `state.omni.sla-page.64a0` | omni | context === 'new' | SlaNew | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaPage.tsx:64` |
| `state.omni.sla-route.9i` | omni | !canViewSlas | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaRoute.tsx:9` |
| `state.omni.sla-route.13d` | omni | 前述 if-ret 均不成立（default return） | SlaPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaRoute.tsx:13` |
| `state.omni.sla-table.93a1` | omni | !(((isSuccess && data?.sla.length > 0) ¦¦ queryHasChanged)) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaTable.tsx:93` |
| `state.omni.sla-table.93a0` | omni | ((isSuccess && data?.sla.length > 0) ¦¦ queryHasChanged) | FilterByText | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaTable.tsx:93` |
| `state.omni.sla-table.96a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaTable.tsx:96` |
| `state.omni.sla-table.96a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaTable.tsx:96` |
| `state.omni.sla-table.104a1` | omni | !(isSuccess && data?.sla.length === 0 && queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaTable.tsx:104` |
| `state.omni.sla-table.104a0` | omni | isSuccess && data?.sla.length === 0 && queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaTable.tsx:104` |
| `state.omni.sla-table.105a1` | omni | !(isSuccess && data?.sla.length === 0 && !queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaTable.tsx:105` |
| `state.omni.sla-table.105a0` | omni | isSuccess && data?.sla.length === 0 && !queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaTable.tsx:105` |
| `state.omni.sla-table.116a1` | omni | !(isSuccess && data?.sla.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaTable.tsx:116` |
| `state.omni.sla-table.116a0` | omni | isSuccess && data?.sla.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/slaPolicies/SlaTable.tsx:116` |
| `state.omni.tag-edit.104a1` | omni | !(errors?.name) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEdit.tsx:104` |
| `state.omni.tag-edit.104a0` | omni | errors?.name | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEdit.tsx:104` |
| `state.omni.tag-edit.138a1` | omni | !(_id) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEdit.tsx:138` |
| `state.omni.tag-edit.138a0` | omni | _id | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEdit.tsx:138` |
| `state.omni.tag-edit-with-data.21i` | omni | isPending | ContextualbarSkeletonBody | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEditWithData.tsx:21` |
| `state.omni.tag-edit-with-data.25i` | omni | isError | Callout | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEditWithData.tsx:25` |
| `state.omni.tag-edit-with-data.33i` | omni | data?.departments && data.departments.length > 0 | TagEditWithDepartmentData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEditWithData.tsx:33` |
| `state.omni.tag-edit-with-data.37d` | omni | 前述 if-ret 均不成立（default return） | TagEdit | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEditWithData.tsx:37` |
| `state.omni.tag-edit-with-department-data.19i` | omni | isPending | ContextualbarSkeletonBody | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEditWithDepartmentData.tsx:19` |
| `state.omni.tag-edit-with-department-data.23i` | omni | isError | Callout | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEditWithDepartmentData.tsx:23` |
| `state.omni.tag-edit-with-department-data.31d` | omni | 前述 if-ret 均不成立（default return） | TagEdit | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagEditWithDepartmentData.tsx:31` |
| `state.omni.tags-page.30a1` | omni | !(context) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsPage.tsx:30` |
| `state.omni.tags-page.30a0` | omni | context | ContextualbarDialog | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsPage.tsx:30` |
| `state.omni.tags-page.32a1` | omni | !(context === 'edit' && id) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsPage.tsx:32` |
| `state.omni.tags-page.32a0` | omni | context === 'edit' && id | TagEditWithData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsPage.tsx:32` |
| `state.omni.tags-page.33a1` | omni | !(context === 'new') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsPage.tsx:33` |
| `state.omni.tags-page.33a0` | omni | context === 'new' | TagEdit | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsPage.tsx:33` |
| `state.omni.tags-route.9i` | omni | !canViewTags | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsRoute.tsx:9` |
| `state.omni.tags-route.13d` | omni | 前述 if-ret 均不成立（default return） | TagsPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsRoute.tsx:13` |
| `state.omni.tags-table.79a1` | omni | !(((isSuccess && data?.tags.length > 0) ¦¦ queryHasChanged)) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsTable.tsx:79` |
| `state.omni.tags-table.79a0` | omni | ((isSuccess && data?.tags.length > 0) ¦¦ queryHasChanged) | FilterByText | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsTable.tsx:79` |
| `state.omni.tags-table.82a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsTable.tsx:82` |
| `state.omni.tags-table.82a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsTable.tsx:82` |
| `state.omni.tags-table.90a1` | omni | !(isSuccess && data?.tags.length === 0 && queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsTable.tsx:90` |
| `state.omni.tags-table.90a0` | omni | isSuccess && data?.tags.length === 0 && queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsTable.tsx:90` |
| `state.omni.tags-table.91a1` | omni | !(isSuccess && data?.tags.length === 0 && !queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsTable.tsx:91` |
| `state.omni.tags-table.91a0` | omni | isSuccess && data?.tags.length === 0 && !queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsTable.tsx:91` |
| `state.omni.tags-table.102a1` | omni | !(isSuccess && data?.tags.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsTable.tsx:102` |
| `state.omni.tags-table.102a0` | omni | isSuccess && data?.tags.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/tags/TagsTable.tsx:102` |
| `state.omni.condition-form.55a1` | omni | !(conditionValuePlaceholder) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/ConditionForm.tsx:55` |
| `state.omni.condition-form.55a0` | omni | conditionValuePlaceholder | FieldRow | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/ConditionForm.tsx:55` |
| `state.omni.condition-form.61i` | omni | conditionName === 'time-on-site' | NumberInput | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/ConditionForm.tsx:61` |
| `state.omni.condition-form.65d` | omni | 前述 if-ret 均不成立（default return） | TextInput | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/ConditionForm.tsx:65` |
| `state.omni.edit-trigger.187a1` | omni | !(errors?.name) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/EditTrigger.tsx:187` |
| `state.omni.edit-trigger.187a0` | omni | errors?.name | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/EditTrigger.tsx:187` |
| `state.omni.edit-trigger-with-data.19i` | omni | isPending | ContextualbarSkeletonBody | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/EditTriggerWithData.tsx:19` |
| `state.omni.edit-trigger-with-data.23i` | omni | isError | Callout | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/EditTriggerWithData.tsx:23` |
| `state.omni.edit-trigger-with-data.27d` | omni | 前述 if-ret 均不成立（default return） | EditTrigger | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/EditTriggerWithData.tsx:27` |
| `state.omni.triggers-page.28a1` | omni | !(context) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersPage.tsx:28` |
| `state.omni.triggers-page.28a0` | omni | context | ContextualbarDialog | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersPage.tsx:28` |
| `state.omni.triggers-page.30a1` | omni | !(context === 'edit' && id) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersPage.tsx:30` |
| `state.omni.triggers-page.30a0` | omni | context === 'edit' && id | EditTriggerWithData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersPage.tsx:30` |
| `state.omni.triggers-page.31a1` | omni | !(context === 'new') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersPage.tsx:31` |
| `state.omni.triggers-page.31a0` | omni | context === 'new' | EditTrigger | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersPage.tsx:31` |
| `state.omni.triggers-route.9i` | omni | !canViewTriggers | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersRoute.tsx:9` |
| `state.omni.triggers-route.13d` | omni | 前述 if-ret 均不成立（default return） | TriggersPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersRoute.tsx:13` |
| `state.omni.triggers-table.52a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:52` |
| `state.omni.triggers-table.52a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:52` |
| `state.omni.triggers-table.60a1` | omni | !(isSuccess && data.triggers.length === 0 && queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:60` |
| `state.omni.triggers-table.60a0` | omni | isSuccess && data.triggers.length === 0 && queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:60` |
| `state.omni.triggers-table.61a1` | omni | !(isSuccess && data.triggers.length === 0 && !queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:61` |
| `state.omni.triggers-table.61a0` | omni | isSuccess && data.triggers.length === 0 && !queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:61` |
| `state.omni.triggers-table.72a1` | omni | !(isSuccess && data.triggers.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:72` |
| `state.omni.triggers-table.72a0` | omni | isSuccess && data.triggers.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:72` |
| `state.omni.triggers-table.93a1` | omni | !(isError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:93` |
| `state.omni.triggers-table.93a0` | omni | isError | GenericError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/TriggersTable.tsx:93` |
| `state.omni.action-external-service-url.83a1` | omni | !(serviceUrlError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/ActionExternalServiceUrl.tsx:83` |
| `state.omni.action-external-service-url.83a0` | omni | serviceUrlError | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/ActionExternalServiceUrl.tsx:83` |
| `state.omni.action-form.106a1` | omni | !(actionHint) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/ActionForm.tsx:106` |
| `state.omni.action-form.106a0` | omni | actionHint | FieldHint | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/ActionForm.tsx:106` |
| `state.omni.action-sender.46a1` | omni | !(senderNameFieldValue === 'custom') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/ActionSender.tsx:46` |
| `state.omni.action-sender.46a0` | omni | senderNameFieldValue === 'custom' | FieldRow | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/ActionSender.tsx:46` |
| `state.omni.external-service-action-form.66a1` | omni | !(timeoutError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/ExternalServiceActionForm.tsx:66` |
| `state.omni.external-service-action-form.66a0` | omni | timeoutError | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/ExternalServiceActionForm.tsx:66` |
| `state.omni.external-service-action-form.98a1` | omni | !(fallbackMessageError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/ExternalServiceActionForm.tsx:98` |
| `state.omni.external-service-action-form.98a0` | omni | fallbackMessageError | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/ExternalServiceActionForm.tsx:98` |
| `state.omni.send-message-action-form.50a1` | omni | !(messageError) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/SendMessageActionForm.tsx:50` |
| `state.omni.send-message-action-form.50a0` | omni | messageError | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/triggers/actions/SendMessageActionForm.tsx:50` |
| `state.omni.unit-edit.165a1` | omni | !(errors?.name) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:165` |
| `state.omni.unit-edit.165a0` | omni | errors?.name | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:165` |
| `state.omni.unit-edit.194a1` | omni | !(errors?.visibility) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:194` |
| `state.omni.unit-edit.194a0` | omni | errors?.visibility | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:194` |
| `state.omni.unit-edit.226a1` | omni | !(errors?.departments) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:226` |
| `state.omni.unit-edit.226a0` | omni | errors?.departments | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:226` |
| `state.omni.unit-edit.256a1` | omni | !(errors?.monitors) | null | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:256` |
| `state.omni.unit-edit.256a0` | omni | errors?.monitors | FieldError | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:256` |
| `state.omni.unit-edit.272a1` | omni | !(_id) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:272` |
| `state.omni.unit-edit.272a0` | omni | _id | Box | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEdit.tsx:272` |
| `state.omni.unit-edit-with-data.48i` | omni | isLoading ¦¦ unitMonitorsLoading ¦¦ unitDepartmentsLoading | ContextualbarSkeletonBody | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEditWithData.tsx:48` |
| `state.omni.unit-edit-with-data.52i` | omni | isError ¦¦ unitMonitorsError ¦¦ unitDepartmentsError | Callout | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEditWithData.tsx:52` |
| `state.omni.unit-edit-with-data.60d` | omni | 前述 if-ret 均不成立（default return） | UnitEdit | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitEditWithData.tsx:60` |
| `state.omni.units-page.33a1` | omni | !(context) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsPage.tsx:33` |
| `state.omni.units-page.33a0` | omni | context | ContextualbarDialog | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsPage.tsx:33` |
| `state.omni.units-page.35a1` | omni | !(context === 'edit' && id) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsPage.tsx:35` |
| `state.omni.units-page.35a0` | omni | context === 'edit' && id | UnitEditWithData | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsPage.tsx:35` |
| `state.omni.units-page.36a1` | omni | !(context === 'new') | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsPage.tsx:36` |
| `state.omni.units-page.36a0` | omni | context === 'new' | UnitEdit | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsPage.tsx:36` |
| `state.omni.units-route.11i` | omni | !(isEnterprise && canViewUnits) | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsRoute.tsx:11` |
| `state.omni.units-route.15d` | omni | 前述 if-ret 均不成立（default return） | UnitsPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsRoute.tsx:15` |
| `state.omni.units-table.74a1` | omni | !(((isSuccess && data?.units.length > 0) ¦¦ queryHasChanged)) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsTable.tsx:74` |
| `state.omni.units-table.74a0` | omni | ((isSuccess && data?.units.length > 0) ¦¦ queryHasChanged) | FilterByText | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsTable.tsx:74` |
| `state.omni.units-table.77a1` | omni | !(isLoading) | null | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsTable.tsx:77` |
| `state.omni.units-table.77a0` | omni | isLoading | GenericTable | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsTable.tsx:77` |
| `state.omni.units-table.85a1` | omni | !(isSuccess && data.units.length === 0 && queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsTable.tsx:85` |
| `state.omni.units-table.85a0` | omni | isSuccess && data.units.length === 0 && queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsTable.tsx:85` |
| `state.omni.units-table.86a1` | omni | !(isSuccess && data.units.length === 0 && !queryHasChanged) | null | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsTable.tsx:86` |
| `state.omni.units-table.86a0` | omni | isSuccess && data.units.length === 0 && !queryHasChanged | GenericNoResults | 登录 omni 经理 → 顶栏 Omnichannel；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsTable.tsx:86` |
| `state.omni.units-table.97a1` | omni | !(isSuccess && data?.units.length > 0) | null | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsTable.tsx:97` |
| `state.omni.units-table.97a0` | omni | isSuccess && data?.units.length > 0 | <> | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/units/UnitsTable.tsx:97` |
| `state.omni.webhooks-page-container.34i` | omni | !canViewLivechatWebhooks | NotAuthorizedPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/webhooks/WebhooksPageContainer.tsx:34` |
| `state.omni.webhooks-page-container.38i` | omni | isPending | PageSkeleton | 登录 omni 经理 → 顶栏 Omnichannel；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/webhooks/WebhooksPageContainer.tsx:38` |
| `state.omni.webhooks-page-container.42i` | omni | !data?.success ¦¦ !data?.settings ¦¦ isError | Page | 登录 omni 经理 → 顶栏 Omnichannel；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/webhooks/WebhooksPageContainer.tsx:42` |
| `state.omni.webhooks-page-container.53d` | omni | 前述 if-ret 均不成立（default return） | WebhooksPage | 登录 omni 经理 → 顶栏 Omnichannel | [待渲染实测] | （无） | `apps/meteor/client/views/omnichannel/webhooks/WebhooksPageContainer.tsx:53` |

### marketplace（222）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.marketplace.app-details-page.113a1` | marketplace | !(!appData) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:113` |
| `state.marketplace.app-details-page.113a0` | marketplace | !appData | AppDetailsPageLoading | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:113` |
| `state.marketplace.app-details-page.114a1` | marketplace | !(appData) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:114` |
| `state.marketplace.app-details-page.114a0` | marketplace | appData | <> | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:114` |
| `state.marketplace.app-details-page.125a1` | marketplace | !(Boolean(!tab ¦¦ tab === 'details')) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:125` |
| `state.marketplace.app-details-page.125a0` | marketplace | Boolean(!tab ¦¦ tab === 'details') | AppDetails | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:125` |
| `state.marketplace.app-details-page.126a1` | marketplace | !(tab === 'requests') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:126` |
| `state.marketplace.app-details-page.126a0` | marketplace | tab === 'requests' | AppRequests | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:126` |
| `state.marketplace.app-details-page.127a1` | marketplace | !(tab === 'security' && isSecurityVisible) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:127` |
| `state.marketplace.app-details-page.127a0` | marketplace | tab === 'security' && isSecurityVisible | AppSecurity | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:127` |
| `state.marketplace.app-details-page.135a1` | marketplace | !(tab === 'releases') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:135` |
| `state.marketplace.app-details-page.135a0` | marketplace | tab === 'releases' | AppReleases | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:135` |
| `state.marketplace.app-details-page.136a1` | marketplace | !(Boolean(tab === 'settings' && settings && Object.values(settings).length)) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:136` |
| `state.marketplace.app-details-page.136a0` | marketplace | Boolean(tab === 'settings' && settings && Object.values(settings).length) | FormProvider | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:136` |
| `state.marketplace.app-details-page.141a1` | marketplace | !((tab === 'logs' ¦¦ tab === 'logs-filter')) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:141` |
| `state.marketplace.app-details-page.141a0` | marketplace | (tab === 'logs' ¦¦ tab === 'logs-filter') | FormProvider | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:141` |
| `state.marketplace.app-details-page.146a1` | marketplace | !(tab === 'instances') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:146` |
| `state.marketplace.app-details-page.146a0` | marketplace | tab === 'instances' | AppInstances | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:146` |
| `state.marketplace.app-details-page.154a1` | marketplace | !(installed && isAdminUser) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:154` |
| `state.marketplace.app-details-page.154a0` | marketplace | installed && isAdminUser | Button | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:154` |
| `state.marketplace.app-details-page.162a1` | marketplace | !(compactMode && contextualBar === 'filter-logs') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:162` |
| `state.marketplace.app-details-page.162a0` | marketplace | compactMode && contextualBar === 'filter-logs' | FormProvider | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPage.tsx:162` |
| `state.marketplace.app-details-page-header.48a1` | marketplace | !(bundledIn && Boolean(bundledIn.length)) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageHeader.tsx:48` |
| `state.marketplace.app-details-page-header.48a0` | marketplace | bundledIn && Boolean(bundledIn.length) | BundleChips | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageHeader.tsx:48` |
| `state.marketplace.app-details-page-header.51a1` | marketplace | !(shortDescription) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageHeader.tsx:51` |
| `state.marketplace.app-details-page-header.51a0` | marketplace | shortDescription | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageHeader.tsx:51` |
| `state.marketplace.app-details-page-header.59a1` | marketplace | !((installed ¦¦ isSubscribed)) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageHeader.tsx:59` |
| `state.marketplace.app-details-page-header.59a0` | marketplace | (installed ¦¦ isSubscribed) | AppMenu | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageHeader.tsx:59` |
| `state.marketplace.app-details-page-header.67a1` | marketplace | !(lastUpdated) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageHeader.tsx:67` |
| `state.marketplace.app-details-page-header.67a0` | marketplace | lastUpdated | <> | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageHeader.tsx:67` |
| `state.marketplace.app-details-page-header.80a1` | marketplace | !(versionIncompatible) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageHeader.tsx:80` |
| `state.marketplace.app-details-page-header.80a0` | marketplace | versionIncompatible | <> | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageHeader.tsx:80` |
| `state.marketplace.app-details-page-tabs.44a1` | marketplace | !(isAdminUser && context !== 'private') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:44` |
| `state.marketplace.app-details-page-tabs.44a0` | marketplace | isAdminUser && context !== 'private' | TabsItem | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:44` |
| `state.marketplace.app-details-page-tabs.49a1` | marketplace | !(isSecurityVisible) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:49` |
| `state.marketplace.app-details-page-tabs.49a0` | marketplace | isSecurityVisible | TabsItem | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:49` |
| `state.marketplace.app-details-page-tabs.54a1` | marketplace | !(context !== 'private') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:54` |
| `state.marketplace.app-details-page-tabs.54a0` | marketplace | context !== 'private' | TabsItem | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:54` |
| `state.marketplace.app-details-page-tabs.59a1` | marketplace | !(installed && Boolean(settings && Object.values(settings).length) && isAdminUser) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:59` |
| `state.marketplace.app-details-page-tabs.59a0` | marketplace | installed && Boolean(settings && Object.values(settings).length) && isAdminUser | TabsItem | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:59` |
| `state.marketplace.app-details-page-tabs.64a1` | marketplace | !(installed && isAdminUser) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:64` |
| `state.marketplace.app-details-page-tabs.64a0` | marketplace | installed && isAdminUser | TabsItem | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:64` |
| `state.marketplace.app-details-page-tabs.69a1` | marketplace | !(hasCluster && installed && isAdminUser) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:69` |
| `state.marketplace.app-details-page-tabs.69a0` | marketplace | hasCluster && installed && isAdminUser | TabsItem | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/AppDetailsPageTabs.tsx:69` |
| `state.marketplace.app-details.50a1` | marketplace | !(appAddon && !workspaceHasAddon) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppDetails/AppDetails.tsx:50` |
| `state.marketplace.app-details.50a0` | marketplace | appAddon && !workspaceHasAddon | Callout | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppDetails/AppDetails.tsx:50` |
| `state.marketplace.app-details.64a1` | marketplace | !(app.licenseValidation) | null | 登录 → `/marketplace`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppDetails/AppDetails.tsx:64` |
| `state.marketplace.app-details.64a0` | marketplace | app.licenseValidation | <> | 登录 → `/marketplace`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppDetails/AppDetails.tsx:64` |
| `state.marketplace.app-details.82a1` | marketplace | !(isCarouselVisible) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppDetails/AppDetails.tsx:82` |
| `state.marketplace.app-details.82a0` | marketplace | isCarouselVisible | ScreenshotCarouselAnchor | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppDetails/AppDetails.tsx:82` |
| `state.marketplace.app-details.137t1` | marketplace | !(apis?.length) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppDetails/AppDetails.tsx:137` |
| `state.marketplace.app-details.137t0` | marketplace | apis?.length | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppDetails/AppDetails.tsx:137` |
| `state.marketplace.app-instances.52a1` | marketplace | !(isLoading) | null | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx:52` |
| `state.marketplace.app-instances.52a0` | marketplace | isLoading | AccordionLoading | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx:52` |
| `state.marketplace.app-instances.53a1` | marketplace | !(isError) | null | 登录 → `/marketplace`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx:53` |
| `state.marketplace.app-instances.53a0` | marketplace | isError | Box | 登录 → `/marketplace`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx:53` |
| `state.marketplace.app-instances.58a1` | marketplace | !(isSuccess && data.clusterStatus && data.clusterStatus.length > 0) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx:58` |
| `state.marketplace.app-instances.58a0` | marketplace | isSuccess && data.clusterStatus && data.clusterStatus.length > 0 | CustomScrollbars | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx:58` |
| `state.marketplace.app-instances.96a1` | marketplace | !(isSuccess && (!data.clusterStatus ¦¦ data.clusterStatus.length === 0)) | null | 登录 → `/marketplace`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx:96` |
| `state.marketplace.app-instances.96a0` | marketplace | isSuccess && (!data.clusterStatus ¦¦ data.clusterStatus.length === 0) | CustomScrollbars | 登录 → `/marketplace`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppInstances/AppInstances.tsx:96` |
| `state.marketplace.app-logs.112a1` | marketplace | !(isFetching) | null | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogs.tsx:112` |
| `state.marketplace.app-logs.112a0` | marketplace | isFetching | AccordionLoading | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogs.tsx:112` |
| `state.marketplace.app-logs.113a1` | marketplace | !(isError) | null | 登录 → `/marketplace`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogs.tsx:113` |
| `state.marketplace.app-logs.113a0` | marketplace | isError | GenericError | 登录 → `/marketplace`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogs.tsx:113` |
| `state.marketplace.app-logs.114a1` | marketplace | !(!isFetching && isSuccess && data?.logs?.length === 0) | null | 登录 → `/marketplace`；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogs.tsx:114` |
| `state.marketplace.app-logs.114a0` | marketplace | !isFetching && isSuccess && data?.logs?.length === 0 | GenericNoResults | 登录 → `/marketplace`；等查询 in-flight；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogs.tsx:114` |
| `state.marketplace.app-logs.115a1` | marketplace | !(!isFetching && isSuccess && data?.logs?.length > 0) | null | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogs.tsx:115` |
| `state.marketplace.app-logs.115a0` | marketplace | !isFetching && isSuccess && data?.logs?.length > 0 | CustomScrollbars | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogs.tsx:115` |
| `state.marketplace.app-logs-item.51a1` | marketplace | !(props.instanceId) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogsItem.tsx:51` |
| `state.marketplace.app-logs-item.51a0` | marketplace | props.instanceId | AppsLogItemField | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogsItem.tsx:51` |
| `state.marketplace.app-logs-item.52a1` | marketplace | !(props.totalTime !== undefined) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogsItem.tsx:52` |
| `state.marketplace.app-logs-item.52a0` | marketplace | props.totalTime !== undefined | AppsLogItemField | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogsItem.tsx:52` |
| `state.marketplace.app-logs-item.53a1` | marketplace | !(props.startTime) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogsItem.tsx:53` |
| `state.marketplace.app-logs-item.53a0` | marketplace | props.startTime | AppsLogItemField | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogsItem.tsx:53` |
| `state.marketplace.app-logs-item.54a1` | marketplace | !(props.method) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogsItem.tsx:54` |
| `state.marketplace.app-logs-item.54a0` | marketplace | props.method | AppsLogItemField | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/AppLogsItem.tsx:54` |
| `state.marketplace.app-logs-filter.72a1` | marketplace | !(!compactMode) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:72` |
| `state.marketplace.app-logs-filter.72a0` | marketplace | !compactMode | <> | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:72` |
| `state.marketplace.app-logs-filter.123a1` | marketplace | !(compactMode) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:123` |
| `state.marketplace.app-logs-filter.123a0` | marketplace | compactMode | <> | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/AppLogsFilter.tsx:123` |
| `state.marketplace.event-filter-select.21i` | marketplace | isPending | InputBoxSkeleton | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/EventFilterSelect.tsx:21` |
| `state.marketplace.event-filter-select.25d` | marketplace | 前述 if-ret 均不成立（default return） | Select | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/EventFilterSelect.tsx:25` |
| `state.marketplace.instance-filter-select.21i` | marketplace | isPending | InputBoxSkeleton | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/InstanceFilterSelect.tsx:21` |
| `state.marketplace.instance-filter-select.25d` | marketplace | 前述 if-ret 均不成立（default return） | Select | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppLogs/Filters/InstanceFilterSelect.tsx:25` |
| `state.marketplace.app-releases.34a1` | marketplace | !(isLoading) | null | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppReleases/AppReleases.tsx:34` |
| `state.marketplace.app-releases.34a0` | marketplace | isLoading | AccordionLoading | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppReleases/AppReleases.tsx:34` |
| `state.marketplace.app-releases.35a1` | marketplace | !(isFetched) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppReleases/AppReleases.tsx:35` |
| `state.marketplace.app-releases.35a0` | marketplace | isFetched | <> | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppReleases/AppReleases.tsx:35` |
| `state.marketplace.app-releases-item.38t1` | marketplace | !(release.detailedChangelog?.rendered) | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppReleases/AppReleasesItem.tsx:38` |
| `state.marketplace.app-releases-item.38t0` | marketplace | release.detailedChangelog?.rendered | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppReleases/AppReleasesItem.tsx:38` |
| `state.marketplace.app-request-item.23a1` | marketplace | !(!seen && isAdminUser) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequestItem.tsx:23` |
| `state.marketplace.app-request-item.23a0` | marketplace | !seen && isAdminUser | Badge | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequestItem.tsx:23` |
| `state.marketplace.app-request-item.25a1` | marketplace | !(username) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequestItem.tsx:25` |
| `state.marketplace.app-request-item.25a0` | marketplace | username | UserAvatar | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequestItem.tsx:25` |
| `state.marketplace.app-requests.58i` | marketplace | isLoading | Box | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequests.tsx:58` |
| `state.marketplace.app-requests.66d` | marketplace | 前述 if-ret 均不成立（default return） | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequests.tsx:66` |
| `state.marketplace.app-requests.87a1` | marketplace | !(isSuccess && paginatedAppRequests.data?.length) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequests.tsx:87` |
| `state.marketplace.app-requests.87a0` | marketplace | isSuccess && paginatedAppRequests.data?.length | Pagination | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppRequests/AppRequests.tsx:87` |
| `state.marketplace.app-security.39a1` | marketplace | !(tosLink) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppSecurity/AppSecurity.tsx:39` |
| `state.marketplace.app-security.39a0` | marketplace | tosLink | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppSecurity/AppSecurity.tsx:39` |
| `state.marketplace.app-security.44a1` | marketplace | !(privacyLink) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppSecurity/AppSecurity.tsx:44` |
| `state.marketplace.app-security.44a0` | marketplace | privacyLink | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppSecurity/AppSecurity.tsx:44` |
| `state.marketplace.app-setting.16a1` | marketplace | !(i18nDescription) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppSettings/AppSetting.tsx:16` |
| `state.marketplace.app-setting.16a0` | marketplace | i18nDescription | MarkdownText | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppSettings/AppSetting.tsx:16` |
| `state.marketplace.app-status.140a1` | marketplace | !(button && isAppDetailsPage && (!installed ¦¦ canUpdate)) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppStatus/AppStatus.tsx:140` |
| `state.marketplace.app-status.140a0` | marketplace | button && isAppDetailsPage && (!installed ¦¦ canUpdate) | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppStatus/AppStatus.tsx:140` |
| `state.marketplace.app-status.161a1` | marketplace | !(shouldShowPriceDisplay && !installed) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppStatus/AppStatus.tsx:161` |
| `state.marketplace.app-status.161a0` | marketplace | shouldShowPriceDisplay && !installed | AppStatusPriceDisplay | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppStatus/AppStatus.tsx:161` |
| `state.marketplace.app-status.171a1` | marketplace | !(status.icon) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppStatus/AppStatus.tsx:171` |
| `state.marketplace.app-status.171a0` | marketplace | status.icon | Icon | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppStatus/AppStatus.tsx:171` |
| `state.marketplace.app-status-price-display.27a1` | marketplace | !(showType) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppStatus/AppStatusPriceDisplay.tsx:27` |
| `state.marketplace.app-status-price-display.27a0` | marketplace | showType | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppDetailsPage/tabs/AppStatus/AppStatusPriceDisplay.tsx:27` |
| `state.marketplace.app-menu.25i` | marketplace | isLoading | Skeleton | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppMenu.tsx:25` |
| `state.marketplace.app-menu.29i` | marketplace | !isAdminUser && app?.installed && sections.length === 0 | null | 登录 → `/marketplace`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppMenu.tsx:29` |
| `state.marketplace.app-menu.33d` | marketplace | 前述 if-ret 均不成立（default return） | Menu | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppMenu.tsx:33` |
| `state.marketplace.addon-chip.12i` | marketplace | !app.addon | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AddonChip.tsx:12` |
| `state.marketplace.addon-chip.16d` | marketplace | 前述 if-ret 均不成立（default return） | Tag | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AddonChip.tsx:16` |
| `state.marketplace.addon-required-modal.41a1` | marketplace | !(['install', 'update'].includes(actionType)) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AddonRequiredModal.tsx:41` |
| `state.marketplace.addon-required-modal.41a0` | marketplace | ['install', 'update'].includes(actionType) | Button | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AddonRequiredModal.tsx:41` |
| `state.marketplace.app-row.71a1` | marketplace | !(Boolean(bundledIn?.length)) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AppRow.tsx:71` |
| `state.marketplace.app-row.71a0` | marketplace | Boolean(bundledIn?.length) | BundleChips | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AppRow.tsx:71` |
| `state.marketplace.app-row.74a1` | marketplace | !(shortDescription) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AppRow.tsx:74` |
| `state.marketplace.app-row.74a0` | marketplace | shortDescription | CardBody | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AppRow.tsx:74` |
| `state.marketplace.app-row.78a1` | marketplace | !(canUpdate) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AppRow.tsx:78` |
| `state.marketplace.app-row.78a0` | marketplace | canUpdate | Badge | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AppRow.tsx:78` |
| `state.marketplace.apps-list.15a1` | marketplace | !(title) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AppsList.tsx:15` |
| `state.marketplace.apps-list.15a0` | marketplace | title | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsList/AppsList.tsx:15` |
| `state.marketplace.apps-filters.61a1` | marketplace | !(!isPrivateAppsPage) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsFilters.tsx:61` |
| `state.marketplace.apps-filters.61a0` | marketplace | !isPrivateAppsPage | RadioDropDown | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsFilters.tsx:61` |
| `state.marketplace.apps-filters.65a1` | marketplace | !(!isPrivateAppsPage) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsFilters.tsx:65` |
| `state.marketplace.apps-filters.65a0` | marketplace | !isPrivateAppsPage | CategoryDropDown | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsFilters.tsx:65` |
| `state.marketplace.apps-page-content.165i` | marketplace | isPending | <> | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:165` |
| `state.marketplace.apps-page-content.212t1` | marketplace | !(unsupportedVersion) | AppsPageConnectionError | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:212` |
| `state.marketplace.apps-page-content.212t0` | marketplace | unsupportedVersion | UnsupportedEmptyState | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:212` |
| `state.marketplace.apps-page-content.217d` | marketplace | 前述 if-ret 均不成立（default return） | <> | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:217` |
| `state.marketplace.apps-page-content.235a1` | marketplace | !(context === 'requested' && data.count === 0) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:235` |
| `state.marketplace.apps-page-content.235a0` | marketplace | context === 'requested' && data.count === 0 | NoAppRequestsEmptyState | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:235` |
| `state.marketplace.apps-page-content.236a1` | marketplace | !((isMarketplace ¦¦ isPremium) && data.count === 0) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:236` |
| `state.marketplace.apps-page-content.236a0` | marketplace | (isMarketplace ¦¦ isPremium) && data.count === 0 | NoMarketplaceOrInstalledAppMatchesEmptyState | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:236` |
| `state.marketplace.apps-page-content.239a1` | marketplace | !(context === 'installed' && data.totalAppsLength !== 0 && data.count === 0) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:239` |
| `state.marketplace.apps-page-content.239a0` | marketplace | context === 'installed' && data.totalAppsLength !== 0 && data.count === 0 | NoInstalledAppMatchesEmptyState | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:239` |
| `state.marketplace.apps-page-content.242a1` | marketplace | !(context === 'private' && !isMarketplace && data.totalAppsLength === 0) | null | 登录 → `/marketplace`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:242` |
| `state.marketplace.apps-page-content.242a0` | marketplace | context === 'private' && !isMarketplace && data.totalAppsLength === 0 | PrivateEmptyState | 登录 → `/marketplace`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:242` |
| `state.marketplace.apps-page-content.243a1` | marketplace | !(context !== 'private' && !isMarketplace && data.totalAppsLength === 0) | null | 登录 → `/marketplace`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:243` |
| `state.marketplace.apps-page-content.243a0` | marketplace | context !== 'private' && !isMarketplace && data.totalAppsLength === 0 | NoInstalledAppsEmptyState | 登录 → `/marketplace`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContent.tsx:243` |
| `state.marketplace.apps-page-content-body.48a1` | marketplace | !(isMarketplace && !isFiltered) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContentBody.tsx:48` |
| `state.marketplace.apps-page-content-body.48a0` | marketplace | isMarketplace && !isFiltered | FeaturedAppsSections | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContentBody.tsx:48` |
| `state.marketplace.apps-page-content-body.52a1` | marketplace | !(Boolean(appsResult?.count)) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContentBody.tsx:52` |
| `state.marketplace.apps-page-content-body.52a0` | marketplace | Boolean(appsResult?.count) | Pagination | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/AppsPageContentBody.tsx:52` |
| `state.marketplace.featured-apps-sections.17i` | marketplace | featuredApps.isSuccess | <> | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/FeaturedAppsSections.tsx:17` |
| `state.marketplace.featured-apps-sections.32d` | marketplace | 前述 if-ret 均不成立（default return） | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/FeaturedAppsSections.tsx:32` |
| `state.marketplace.no-installed-app-matches-empty-state.28a1` | marketplace | !(shouldShowSearchText) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/NoInstalledAppMatchesEmptyState.tsx:28` |
| `state.marketplace.no-installed-app-matches-empty-state.28a0` | marketplace | shouldShowSearchText | StatesSubtitle | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/NoInstalledAppMatchesEmptyState.tsx:28` |
| `state.marketplace.no-marketplace-or-installed-app-matches-empty-state.27a1` | marketplace | !(shouldShowSearchText) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/NoMarketplaceOrInstalledAppMatchesEmptyState.tsx:27` |
| `state.marketplace.no-marketplace-or-installed-app-matches-empty-state.27a0` | marketplace | shouldShowSearchText | StatesSubtitle | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/NoMarketplaceOrInstalledAppMatchesEmptyState.tsx:27` |
| `state.marketplace.private-empty-state.10t1` | marketplace | !(privateAppsEnabled) | PrivateEmptyStateUpgrade | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/PrivateEmptyState.tsx:10` |
| `state.marketplace.private-empty-state.10t0` | marketplace | privateAppsEnabled | PrivateEmptyStateDefault | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/PrivateEmptyState.tsx:10` |
| `state.marketplace.private-empty-state-upgrade.21a1` | marketplace | !(isAdmin) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/PrivateEmptyStateUpgrade.tsx:21` |
| `state.marketplace.private-empty-state-upgrade.21a0` | marketplace | isAdmin | UpgradeButton | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/PrivateEmptyStateUpgrade.tsx:21` |
| `state.marketplace.private-empty-state-upgrade.26a1` | marketplace | !(!isAdmin) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/PrivateEmptyStateUpgrade.tsx:26` |
| `state.marketplace.private-empty-state-upgrade.26a0` | marketplace | !isAdmin | Button | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/PrivateEmptyStateUpgrade.tsx:26` |
| `state.marketplace.unsupported-empty-state.25a1` | marketplace | !(isAdmin) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/UnsupportedEmptyState.tsx:25` |
| `state.marketplace.unsupported-empty-state.25a0` | marketplace | isAdmin | UpdateRocketChatButton | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsPage/UnsupportedEmptyState.tsx:25` |
| `state.marketplace.apps-route.43i` | marketplace | (context === 'explore' ¦¦ context === 'installed' ¦¦ context === 'private' ¦¦ context === 'premium'… | NotAuthorizedPage | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:43` |
| `state.marketplace.apps-route.51i` | marketplace | (context === 'requested' ¦¦ page === 'install') && !isAdminUser | NotAuthorizedPage | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:51` |
| `state.marketplace.apps-route.53i` | marketplace | isLoading | PageSkeleton | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:53` |
| `state.marketplace.apps-route.57d` | marketplace | 前述 if-ret 均不成立（default return） | AppsProvider | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:57` |
| `state.marketplace.apps-route.60a1` | marketplace | !(page === 'list') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:60` |
| `state.marketplace.apps-route.60a0` | marketplace | page === 'list' | AppsPage | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:60` |
| `state.marketplace.apps-route.61a1` | marketplace | !(id && page === 'info') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:61` |
| `state.marketplace.apps-route.61a0` | marketplace | id && page === 'info' | AppDetailsPage | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:61` |
| `state.marketplace.apps-route.62a1` | marketplace | !(page === 'install') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:62` |
| `state.marketplace.apps-route.62a0` | marketplace | page === 'install' | AppInstallPage | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/AppsRoute.tsx:62` |
| `state.marketplace.marketplace-router.30i` | marketplace | !canAccessMarketplace | NotFoundPage | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/MarketplaceRouter.tsx:30` |
| `state.marketplace.marketplace-router.34t1` | marketplace | !(children) | PageSkeleton | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/MarketplaceRouter.tsx:34` |
| `state.marketplace.marketplace-router.34t0` | marketplace | children | Suspense | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/MarketplaceRouter.tsx:34` |
| `state.marketplace.marketplace-router.36s` | marketplace | Suspense fallback（子树未 ready） | PageSkeleton | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/MarketplaceRouter.tsx:36` |
| `state.marketplace.app-permissions-list.43i` | marketplace | appPermissions?.length | <> | 登录 → `/marketplace`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/AppPermissionsList.tsx:43` |
| `state.marketplace.app-permissions-list.49a1` | marketplace | !(permission.required) | null | 登录 → `/marketplace`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/AppPermissionsList.tsx:49` |
| `state.marketplace.app-permissions-list.49a0` | marketplace | permission.required | Box | 登录 → `/marketplace`；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/AppPermissionsList.tsx:49` |
| `state.marketplace.app-permissions-list.60d` | marketplace | 前述 if-ret 均不成立（default return） | <> | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/AppPermissionsList.tsx:60` |
| `state.marketplace.banner-enterprise-trial-ended.22a1` | marketplace | !(showTrialBanner) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/BannerEnterpriseTrialEnded.tsx:22` |
| `state.marketplace.banner-enterprise-trial-ended.22a0` | marketplace | showTrialBanner | Banner | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/BannerEnterpriseTrialEnded.tsx:22` |
| `state.marketplace.category-drop-down.43a1` | marketplace | !(collapsed) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/CategoryFilter/CategoryDropDown.tsx:43` |
| `state.marketplace.category-drop-down.43a0` | marketplace | collapsed | DropDownListWrapper | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/CategoryFilter/CategoryDropDown.tsx:43` |
| `state.marketplace.category-drop-down-anchor.40a1` | marketplace | !(selectedCategoriesCount > 0) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/CategoryFilter/CategoryDropDownAnchor.tsx:40` |
| `state.marketplace.category-drop-down-anchor.40a0` | marketplace | selectedCategoriesCount > 0 | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/CategoryFilter/CategoryDropDownAnchor.tsx:40` |
| `state.marketplace.category-drop-down-list.11a1` | marketplace | !(category.label) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/CategoryFilter/CategoryDropDownList.tsx:11` |
| `state.marketplace.category-drop-down-list.11a0` | marketplace | category.label | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/CategoryFilter/CategoryDropDownList.tsx:11` |
| `state.marketplace.tag-list.11i` | marketplace | !categories.length | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/CategoryFilter/TagList.tsx:11` |
| `state.marketplace.tag-list.15d` | marketplace | 前述 if-ret 均不成立（default return） | ButtonGroup | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/CategoryFilter/TagList.tsx:15` |
| `state.marketplace.marketplace-header.41i` | marketplace | result.isError | null | 登录 → `/marketplace`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:41` |
| `state.marketplace.marketplace-header.45d` | marketplace | 前述 if-ret 均不成立（default return） | PageHeader | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:45` |
| `state.marketplace.marketplace-header.47a1` | marketplace | !(result.isLoading) | null | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:47` |
| `state.marketplace.marketplace-header.47a0` | marketplace | result.isLoading | GenericResourceUsageSkeleton | 登录 → `/marketplace`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:47` |
| `state.marketplace.marketplace-header.49a1` | marketplace | !(!unsupportedVersion && result.isSuccess && !result.data.hasUnlimitedApps) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:49` |
| `state.marketplace.marketplace-header.49a0` | marketplace | !unsupportedVersion && result.isSuccess && !result.data.hasUnlimitedApps | Margins | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:49` |
| `state.marketplace.marketplace-header.60a1` | marketplace | !(!unsupportedVersion && isAdmin && result.isSuccess && !result.data.hasUnlimitedApps && context !== …) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:60` |
| `state.marketplace.marketplace-header.60a0` | marketplace | !unsupportedVersion && isAdmin && result.isSuccess && !result.data.hasUnlimitedApps && context !== … | Button | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:60` |
| `state.marketplace.marketplace-header.69a1` | marketplace | !(isAdmin && context === 'private') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:69` |
| `state.marketplace.marketplace-header.69a0` | marketplace | isAdmin && context === 'private' | Button | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:69` |
| `state.marketplace.marketplace-header.71a1` | marketplace | !(isAdmin && result.isSuccess && !privateAppsEnabled && context === 'private') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:71` |
| `state.marketplace.marketplace-header.71a0` | marketplace | isAdmin && result.isSuccess && !privateAppsEnabled && context === 'private' | UpgradeButton | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:71` |
| `state.marketplace.marketplace-header.76a1` | marketplace | !(unsupportedVersion && isAdmin && context !== 'private') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:76` |
| `state.marketplace.marketplace-header.76a0` | marketplace | unsupportedVersion && isAdmin && context !== 'private' | UpdateRocketChatButton | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceHeader.tsx:76` |
| `state.marketplace.marketplace-request-badge.9t1` | marketplace | !(requestStatsResult.fetchStatus !== 'idle') | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceRequestBadge.tsx:9` |
| `state.marketplace.marketplace-request-badge.9t0` | marketplace | requestStatsResult.fetchStatus !== 'idle' | Skeleton | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceRequestBadge.tsx:9` |
| `state.marketplace.marketplace-request-badge.11i` | marketplace | requestStatsResult.isError | null | 登录 → `/marketplace`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceRequestBadge.tsx:11` |
| `state.marketplace.marketplace-request-badge.13i` | marketplace | !requestStatsResult.data.totalUnseen | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceRequestBadge.tsx:13` |
| `state.marketplace.marketplace-request-badge.17d` | marketplace | 前述 if-ret 均不成立（default return） | Badge | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/MarketplaceRequestBadge.tsx:17` |
| `state.marketplace.radio-button-list.7a1` | marketplace | !(group.label) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/RadioButtonList.tsx:7` |
| `state.marketplace.radio-button-list.7a0` | marketplace | group.label | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/RadioButtonList.tsx:7` |
| `state.marketplace.radio-drop-down.34a1` | marketplace | !(collapsed) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/RadioDropDown/RadioDropDown.tsx:34` |
| `state.marketplace.radio-drop-down.34a0` | marketplace | collapsed | DropDownListWrapper | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/RadioDropDown/RadioDropDown.tsx:34` |
| `state.marketplace.screenshot-carousel.39a1` | marketplace | !(isCurrentImageOnScreen) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/ScreenshotCarousel.tsx:39` |
| `state.marketplace.screenshot-carousel.39a0` | marketplace | isCurrentImageOnScreen | Box | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/ScreenshotCarousel.tsx:39` |
| `state.marketplace.screenshot-carousel.58a1` | marketplace | !(!isFirstSlide) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/ScreenshotCarousel.tsx:58` |
| `state.marketplace.screenshot-carousel.58a0` | marketplace | !isFirstSlide | IconButton | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/ScreenshotCarousel.tsx:58` |
| `state.marketplace.screenshot-carousel.69a1` | marketplace | !(!isLastSlide) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/ScreenshotCarousel.tsx:69` |
| `state.marketplace.screenshot-carousel.69a0` | marketplace | !isLastSlide | IconButton | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/components/ScreenshotCarousel.tsx:69` |
| `state.marketplace.use-app-menu.361a1` | marketplace | !(isAdminUser) | null | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/hooks/useAppMenu.tsx:361` |
| `state.marketplace.use-app-menu.361a0` | marketplace | isAdminUser | Icon | 登录 → `/marketplace` | [待渲染实测] | （无） | `apps/meteor/client/views/marketplace/hooks/useAppMenu.tsx:361` |

### directory（82）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.directory.directory-page.52a1` | directory | !(federationEnabled) | null | 登录 → `/directory`；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/DirectoryPage.tsx:52` |
| `state.directory.directory-page.52a0` | directory | federationEnabled | TabsItem | 登录 → `/directory`；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/DirectoryPage.tsx:52` |
| `state.directory.directory-page.59a1` | directory | !(tab === 'channels') | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/DirectoryPage.tsx:59` |
| `state.directory.directory-page.59a0` | directory | tab === 'channels' | ChannelsTab | 登录 → `/directory`；shot:directory-channels.png；Channels tab | [实测] | （无） | `apps/meteor/client/views/directory/DirectoryPage.tsx:59` |
| `state.directory.directory-page.60a1` | directory | !(tab === 'users') | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/DirectoryPage.tsx:60` |
| `state.directory.directory-page.60a0` | directory | tab === 'users' | UsersTab | 登录 → `/directory`；shot:directory-users.png；Users tab | [实测] | （无） | `apps/meteor/client/views/directory/DirectoryPage.tsx:60` |
| `state.directory.directory-page.61a1` | directory | !(tab === 'teams') | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/DirectoryPage.tsx:61` |
| `state.directory.directory-page.61a0` | directory | tab === 'teams' | TeamsTab | 登录 → `/directory`；shot:directory-teams.png；Teams tab | [实测] | （无） | `apps/meteor/client/views/directory/DirectoryPage.tsx:61` |
| `state.directory.directory-page.62a1` | directory | !(federationEnabled && tab === 'external') | null | 登录 → `/directory`；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/DirectoryPage.tsx:62` |
| `state.directory.directory-page.62a0` | directory | federationEnabled && tab === 'external' | UsersTab | 登录 → `/directory`；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/DirectoryPage.tsx:62` |
| `state.directory.room-tags.15a1` | directory | !(room.default) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/RoomTags.tsx:15` |
| `state.directory.room-tags.15a0` | directory | room.default | Tag | 登录 → `/directory`；shot:directory-channels.png；default Tag | [实测] | （无） | `apps/meteor/client/views/directory/RoomTags.tsx:15` |
| `state.directory.room-tags.16a1` | directory | !(room.featured) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/RoomTags.tsx:16` |
| `state.directory.room-tags.16a0` | directory | room.featured | Tag | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/RoomTags.tsx:16` |
| `state.directory.channels-tab.9i` | directory | canViewPublicRooms | ChannelsTable | 登录 → `/directory`；shot:directory-channels.png；ChannelsTable | [实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTab.tsx:9` |
| `state.directory.channels-tab.13d` | directory | 前述 if-ret 均不成立（default return） | NotAuthorizedPage | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTab.tsx:13` |
| `state.directory.channels-table.50a1` | directory | !(mediaQuery) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:50` |
| `state.directory.channels-table.50a0` | directory | mediaQuery | GenericTableHeaderCell | 登录 → `/directory`；shot:directory-channels.png；宽屏表头 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:50` |
| `state.directory.channels-table.62a1` | directory | !(mediaQuery) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:62` |
| `state.directory.channels-table.62a0` | directory | mediaQuery | GenericTableHeaderCell | 登录 → `/directory`；shot:directory-channels.png；宽屏表头 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:62` |
| `state.directory.channels-table.74a1` | directory | !(mediaQuery) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:74` |
| `state.directory.channels-table.74a0` | directory | mediaQuery | GenericTableHeaderCell | 登录 → `/directory`；shot:directory-channels.png；宽屏表头 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:74` |
| `state.directory.channels-table.102a1` | directory | !(isLoading) | null | 登录 → `/directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:102` |
| `state.directory.channels-table.102a0` | directory | isLoading | GenericTable | 登录 → `/directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:102` |
| `state.directory.channels-table.110a1` | directory | !(data?.result && data.result.length > 0 && isFetched) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:110` |
| `state.directory.channels-table.110a0` | directory | data?.result && data.result.length > 0 && isFetched | <> | 登录 → `/directory`；shot:directory-channels.png；general 行 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:110` |
| `state.directory.channels-table.131a1` | directory | !(isFetched && data?.result.length === 0) | null | 登录 → `/directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:131` |
| `state.directory.channels-table.131a0` | directory | isFetched && data?.result.length === 0 | GenericNoResults | 登录 → `/directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:131` |
| `state.directory.channels-table.132a1` | directory | !(isError) | null | 登录 → `/directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:132` |
| `state.directory.channels-table.132a0` | directory | isError | States | 登录 → `/directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTable.tsx:132` |
| `state.directory.channels-table-row.27a1` | directory | !(avatarUrl) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTableRow.tsx:27` |
| `state.directory.channels-table-row.27a0` | directory | avatarUrl | Avatar | 登录 → `/directory`；shot:directory-channels.png；general 头像 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTableRow.tsx:27` |
| `state.directory.channels-table-row.36a1` | directory | !(topic) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTableRow.tsx:36` |
| `state.directory.channels-table-row.36a0` | directory | topic | MarkdownText | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTableRow.tsx:36` |
| `state.directory.channels-table-row.43a1` | directory | !(mediaQuery && ts) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTableRow.tsx:43` |
| `state.directory.channels-table-row.43a0` | directory | mediaQuery && ts | GenericTableCell | 登录 → `/directory`；shot:directory-channels.png；Created at 单元格 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTableRow.tsx:43` |
| `state.directory.channels-table-row.48a1` | directory | !(mediaQuery) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTableRow.tsx:48` |
| `state.directory.channels-table-row.48a0` | directory | mediaQuery | GenericTableCell | 登录 → `/directory`；shot:directory-channels.png；Last Message 单元格 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTableRow.tsx:48` |
| `state.directory.channels-table-row.53a1` | directory | !(mediaQuery) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTableRow.tsx:53` |
| `state.directory.channels-table-row.53a0` | directory | mediaQuery | GenericTableCell | 登录 → `/directory`；shot:directory-channels.png；Belongs To 单元格 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/channels/ChannelsTable/ChannelsTableRow.tsx:53` |
| `state.directory.teams-tab.9i` | directory | canViewPublicRooms | TeamsTable | 登录 → `/directory`；shot:directory-teams.png；TeamsTable | [实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTab.tsx:9` |
| `state.directory.teams-tab.13d` | directory | 前述 if-ret 均不成立（default return） | NotAuthorizedPage | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTab.tsx:13` |
| `state.directory.teams-table.40a1` | directory | !(mediaQuery) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:40` |
| `state.directory.teams-table.40a0` | directory | mediaQuery | GenericTableHeaderCell | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:40` |
| `state.directory.teams-table.78a1` | directory | !(isLoading) | null | 登录 → `/directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:78` |
| `state.directory.teams-table.78a0` | directory | isLoading | GenericTable | 登录 → `/directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:78` |
| `state.directory.teams-table.86a1` | directory | !(data?.result && data.result.length > 0 && isFetched) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:86` |
| `state.directory.teams-table.86a0` | directory | data?.result && data.result.length > 0 && isFetched | <> | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:86` |
| `state.directory.teams-table.112a1` | directory | !(isFetched && data?.result.length === 0) | null | 登录 → `/directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:112` |
| `state.directory.teams-table.112a0` | directory | isFetched && data?.result.length === 0 | GenericNoResults | 登录 → `/directory`；空列表/无数据；shot:directory-teams.png；No results found | [实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:112` |
| `state.directory.teams-table.113a1` | directory | !(isError) | null | 登录 → `/directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:113` |
| `state.directory.teams-table.113a0` | directory | isError | States | 登录 → `/directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTable.tsx:113` |
| `state.directory.teams-table-row.27a1` | directory | !(avatarUrl) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTableRow.tsx:27` |
| `state.directory.teams-table-row.27a0` | directory | avatarUrl | Avatar | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTableRow.tsx:27` |
| `state.directory.teams-table-row.36a1` | directory | !(topic) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTableRow.tsx:36` |
| `state.directory.teams-table-row.36a0` | directory | topic | MarkdownText | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTableRow.tsx:36` |
| `state.directory.teams-table-row.43a1` | directory | !(mediaQuery && ts) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTableRow.tsx:43` |
| `state.directory.teams-table-row.43a0` | directory | mediaQuery && ts | GenericTableCell | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/teams/TeamsTable/TeamsTableRow.tsx:43` |
| `state.directory.users-tab.14i` | directory | canViewOutsideRoom && canViewDM | UsersTable | 登录 → `/directory`；shot:directory-users.png；UsersTable | [实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTab.tsx:14` |
| `state.directory.users-tab.18d` | directory | 前述 if-ret 均不成立（default return） | NotAuthorizedPage | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTab.tsx:18` |
| `state.directory.users-table.45a1` | directory | !(mediaQuery && canViewFullOtherUserInfo) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:45` |
| `state.directory.users-table.45a0` | directory | mediaQuery && canViewFullOtherUserInfo | GenericTableHeaderCell | 登录 → `/directory`；shot:directory-users.png；Email 列（full info） | [实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:45` |
| `state.directory.users-table.57a1` | directory | !(federation) | null | 登录 → `/directory`；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:57` |
| `state.directory.users-table.57a0` | directory | federation | GenericTableHeaderCell | 登录 → `/directory`；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:57` |
| `state.directory.users-table.69a1` | directory | !(mediaQuery) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:69` |
| `state.directory.users-table.69a0` | directory | mediaQuery | GenericTableHeaderCell | 登录 → `/directory`；shot:directory-users.png；宽屏用户表头 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:69` |
| `state.directory.users-table.106a1` | directory | !(isLoading) | null | 登录 → `/directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:106` |
| `state.directory.users-table.106a0` | directory | isLoading | GenericTable | 登录 → `/directory`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:106` |
| `state.directory.users-table.114a1` | directory | !(data?.result && data.result.length > 0 && isFetched) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:114` |
| `state.directory.users-table.114a0` | directory | data?.result && data.result.length > 0 && isFetched | <> | 登录 → `/directory`；shot:directory-users.png；admin 用户行 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:114` |
| `state.directory.users-table.142a1` | directory | !(isFetched && data?.result.length === 0) | null | 登录 → `/directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:142` |
| `state.directory.users-table.142a0` | directory | isFetched && data?.result.length === 0 | GenericNoResults | 登录 → `/directory`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:142` |
| `state.directory.users-table.143a1` | directory | !(isError) | null | 登录 → `/directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:143` |
| `state.directory.users-table.143a0` | directory | isError | States | 登录 → `/directory`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTable.tsx:143` |
| `state.directory.users-table-row.32a1` | directory | !(username) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTableRow.tsx:32` |
| `state.directory.users-table-row.32a0` | directory | username | UserAvatar | 登录 → `/directory`；shot:directory-users.png；用户头像 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTableRow.tsx:32` |
| `state.directory.users-table-row.49a1` | directory | !(mediaQuery && canViewFullOtherUserInfo) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTableRow.tsx:49` |
| `state.directory.users-table-row.49a0` | directory | mediaQuery && canViewFullOtherUserInfo | GenericTableCell | 登录 → `/directory`；shot:directory-users.png；Email 单元格 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTableRow.tsx:49` |
| `state.directory.users-table-row.52a1` | directory | !(federation) | null | 登录 → `/directory`；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTableRow.tsx:52` |
| `state.directory.users-table-row.52a0` | directory | federation | GenericTableCell | 登录 → `/directory`；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTableRow.tsx:52` |
| `state.directory.users-table-row.53a1` | directory | !(mediaQuery) | null | 登录 → `/directory` | [待渲染实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTableRow.tsx:53` |
| `state.directory.users-table-row.53a0` | directory | mediaQuery | GenericTableCell | 登录 → `/directory`；shot:directory-users.png；宽屏用户单元格 | [实测] | （无） | `apps/meteor/client/views/directory/tabs/users/UsersTable/UsersTableRow.tsx:53` |

### teams（64）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.teams.channel-desertion-table-row.30a1` | teams | !(isLastOwner) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/ChannelDesertionTable/ChannelDesertionTableRow.tsx:30` |
| `state.teams.channel-desertion-table-row.30a0` | teams | isLastOwner | Icon | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/ChannelDesertionTable/ChannelDesertionTableRow.tsx:30` |
| `state.teams.teams-channel-item.51i` | teams | !room | OptionSkeleton | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannelItem.tsx:51` |
| `state.teams.teams-channel-item.55d` | teams | 前述 if-ret 均不成立（default return） | Option | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannelItem.tsx:55` |
| `state.teams.teams-channel-item.60t1` | teams | !(room.t === 'c') | Icon | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannelItem.tsx:60` |
| `state.teams.teams-channel-item.60t0` | teams | room.t === 'c' | Icon | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannelItem.tsx:60` |
| `state.teams.teams-channel-item.73a1` | teams | !((canRemoveTeamChannel ¦¦ canEditTeamChannel ¦¦ canDelete)) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannelItem.tsx:73` |
| `state.teams.teams-channel-item.73a0` | teams | (canRemoveTeamChannel ¦¦ canEditTeamChannel ¦¦ canDelete) | OptionMenu | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannelItem.tsx:73` |
| `state.teams.teams-channel-item.75t1` | teams | !(showButton) | IconButton | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannelItem.tsx:75` |
| `state.teams.teams-channel-item.75t0` | teams | showButton | TeamsChannelItemMenu | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannelItem.tsx:75` |
| `state.teams.teams-channels.88a1` | teams | !(onClickClose) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:88` |
| `state.teams.teams-channels.88a0` | teams | onClickClose | ContextualbarClose | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:88` |
| `state.teams.teams-channels.103a1` | teams | !(loading) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:103` |
| `state.teams.teams-channels.103a0` | teams | loading | Box | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:103` |
| `state.teams.teams-channels.108a1` | teams | !(!loading && channels.length === 0) | null | 登录 → 打开团队房间工具栏；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:108` |
| `state.teams.teams-channels.108a0` | teams | !loading && channels.length === 0 | ContextualbarEmptyContent | 登录 → 打开团队房间工具栏；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:108` |
| `state.teams.teams-channels.109a1` | teams | !(!loading && channels.length > 0) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:109` |
| `state.teams.teams-channels.109a0` | teams | !loading && channels.length > 0 | <> | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:109` |
| `state.teams.teams-channels.136a1` | teams | !((onClickAddExisting ¦¦ onClickCreateNew)) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:136` |
| `state.teams.teams-channels.136a0` | teams | (onClickAddExisting ¦¦ onClickCreateNew) | ContextualbarFooter | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:136` |
| `state.teams.teams-channels.139a1` | teams | !(onClickAddExisting) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:139` |
| `state.teams.teams-channels.139a0` | teams | onClickAddExisting | Button | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:139` |
| `state.teams.teams-channels.144a1` | teams | !(onClickCreateNew) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:144` |
| `state.teams.teams-channels.144a0` | teams | onClickCreateNew | Button | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/channels/TeamsChannels.tsx:144` |
| `state.teams.base-convert-to-channel-modal.53i` | teams | step === STEPS.CONFIRM_CONVERT | SecondStep | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/ConvertToChannelModal/BaseConvertToChannelModal.tsx:53` |
| `state.teams.base-convert-to-channel-modal.65d` | teams | 前述 if-ret 均不成立（default return） | FirstStep | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/ConvertToChannelModal/BaseConvertToChannelModal.tsx:65` |
| `state.teams.convert-to-channel-modal.24i` | teams | isPending | GenericModalSkeleton | 登录 → 打开团队房间工具栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/ConvertToChannelModal/ConvertToChannelModal.tsx:24` |
| `state.teams.convert-to-channel-modal.28d` | teams | 前述 if-ret 均不成立（default return） | BaseConvertToChannelModal | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/ConvertToChannelModal/ConvertToChannelModal.tsx:28` |
| `state.teams.delete-team-confirmation.30a1` | teams | !(!!Object.values(deletedRooms).length) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/DeleteTeam/DeleteTeamConfirmation.tsx:30` |
| `state.teams.delete-team-confirmation.30a0` | teams | !!Object.values(deletedRooms).length | <> | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/DeleteTeam/DeleteTeamConfirmation.tsx:30` |
| `state.teams.delete-team-confirmation.38a1` | teams | !(!!Object.values(keptRooms).length) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/DeleteTeam/DeleteTeamConfirmation.tsx:38` |
| `state.teams.delete-team-confirmation.38a0` | teams | !!Object.values(keptRooms).length | <> | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/DeleteTeam/DeleteTeamConfirmation.tsx:38` |
| `state.teams.delete-team-modal.47i` | teams | step === STEPS.CONFIRM_DELETE | DeleteTeamConfirmation | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/DeleteTeam/DeleteTeamModal.tsx:47` |
| `state.teams.delete-team-modal.59d` | teams | 前述 if-ret 均不成立（default return） | DeleteTeamChannels | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/DeleteTeam/DeleteTeamModal.tsx:59` |
| `state.teams.delete-team-modal-with-rooms.23i` | teams | isLoading | GenericModalSkeleton | 登录 → 打开团队房间工具栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/DeleteTeam/DeleteTeamModalWithRooms.tsx:23` |
| `state.teams.delete-team-modal-with-rooms.26d` | teams | 前述 if-ret 均不成立（default return） | DeleteTeamModal | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/DeleteTeam/DeleteTeamModalWithRooms.tsx:26` |
| `state.teams.leave-team-modal.49i` | teams | step === LEAVE_TEAM_STEPS.CONFIRM_LEAVE | LeaveTeamModalConfirmation | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/LeaveTeam/LeaveTeamModal/LeaveTeamModal.tsx:49` |
| `state.teams.leave-team-modal.60d` | teams | 前述 if-ret 均不成立（default return） | LeaveTeamModalChannels | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/LeaveTeam/LeaveTeamModal/LeaveTeamModal.tsx:60` |
| `state.teams.leave-team-with-data.27i` | teams | isLoading | GenericModalSkeleton | 登录 → 打开团队房间工具栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/LeaveTeam/LeaveTeamWithData.tsx:27` |
| `state.teams.leave-team-with-data.31d` | teams | 前述 if-ret 均不成立（default return） | LeaveTeamModal | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/LeaveTeam/LeaveTeamWithData.tsx:31` |
| `state.teams.teams-info.51a1` | teams | !(onClickClose) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:51` |
| `state.teams.teams-info.51a0` | teams | onClickClose | ContextualbarClose | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:51` |
| `state.teams.teams-info.64a1` | teams | !(menu) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:64` |
| `state.teams.teams-info.64a0` | teams | menu | GenericMenu | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:64` |
| `state.teams.teams-info.77a1` | teams | !(room.archived) | null | 登录 → 打开团队房间工具栏；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:77` |
| `state.teams.teams-info.77a0` | teams | room.archived | Box | 登录 → 打开团队房间工具栏；只读/归档房 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:77` |
| `state.teams.teams-info.89a1` | teams | !(room.broadcast) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:89` |
| `state.teams.teams-info.89a0` | teams | room.broadcast | InfoPanelField | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:89` |
| `state.teams.teams-info.97a1` | teams | !(room.description) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:97` |
| `state.teams.teams-info.97a0` | teams | room.description | InfoPanelField | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:97` |
| `state.teams.teams-info.106a1` | teams | !(room.announcement) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:106` |
| `state.teams.teams-info.106a0` | teams | room.announcement | InfoPanelField | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:106` |
| `state.teams.teams-info.115a1` | teams | !(room.topic) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:115` |
| `state.teams.teams-info.115a0` | teams | room.topic | InfoPanelField | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:115` |
| `state.teams.teams-info.124a1` | teams | !(onClickViewChannels) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:124` |
| `state.teams.teams-info.124a0` | teams | onClickViewChannels | InfoPanelField | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:124` |
| `state.teams.teams-info.135a1` | teams | !(retentionPolicy?.isActive) | null | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:135` |
| `state.teams.teams-info.135a0` | teams | retentionPolicy?.isActive | RetentionPolicyCallout | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfo.tsx:135` |
| `state.teams.teams-info-with-data.18i` | teams | editing | EditChannelWithData | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfoWithData.tsx:18` |
| `state.teams.teams-info-with-data.22d` | teams | 前述 if-ret 均不成立（default return） | TeamsInfo | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/info/TeamsInfoWithData.tsx:22` |
| `state.teams.base-remove-users-modal.59i` | teams | step === STEPS.CONFIRM_DELETE ¦¦ !canViewUserRooms | RemoveUsersSecondStep | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/members/RemoveUsersModal/BaseRemoveUsersModal.tsx:59` |
| `state.teams.base-remove-users-modal.72d` | teams | 前述 if-ret 均不成立（default return） | RemoveUsersFirstStep | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/members/RemoveUsersModal/BaseRemoveUsersModal.tsx:72` |
| `state.teams.remove-users-modal.30i` | teams | isPending | GenericModalSkeleton | 登录 → 打开团队房间工具栏；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/members/RemoveUsersModal/RemoveUsersModal.tsx:30` |
| `state.teams.remove-users-modal.34d` | teams | 前述 if-ret 均不成立（default return） | BaseRemoveUsersModal | 登录 → 打开团队房间工具栏 | [待渲染实测] | （无） | `apps/meteor/client/views/teams/contextualBar/members/RemoveUsersModal/RemoveUsersModal.tsx:34` |

### invite（5）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.invite.invite-page.35i` | invite | validateInvite.isPending | PageLoading | 打开 `/invite/:hash`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/invite/InvitePage.tsx:35` |
| `state.invite.invite-page.39i` | invite | validateInvite.isSuccess && validateInvite.data | LoginPage | 打开 `/invite/:hash` | [待渲染实测] | （无） | `apps/meteor/client/views/invite/InvitePage.tsx:39` |
| `state.invite.invite-page.43d` | invite | 前述 if-ret 均不成立（default return） | HeroLayout | 打开 `/invite/:hash` | [待渲染实测] | （无） | `apps/meteor/client/views/invite/InvitePage.tsx:43` |
| `state.invite.secret-urlpage.15i` | invite | uid | null | 打开 `/invite/:hash` | [待渲染实测] | （无） | `apps/meteor/client/views/invite/SecretURLPage.tsx:15` |
| `state.invite.secret-urlpage.19d` | invite | 前述 if-ret 均不成立（default return） | RegistrationPageRouter | 打开 `/invite/:hash` | [待渲染实测] | （无） | `apps/meteor/client/views/invite/SecretURLPage.tsx:19` |

### e2e（4）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.e2e.enter-e2-epassword-modal.55i` | e2e | confirmResetPassword | GenericModal | 登录 + 房间 E2EE 开 | [待渲染实测] | （无） | `apps/meteor/client/views/e2e/EnterE2EPasswordModal/EnterE2EPasswordModal.tsx:55` |
| `state.e2e.enter-e2-epassword-modal.71d` | e2e | 前述 if-ret 均不成立（default return） | GenericModal | 登录 + 房间 E2EE 开 | [待渲染实测] | （无） | `apps/meteor/client/views/e2e/EnterE2EPasswordModal/EnterE2EPasswordModal.tsx:71` |
| `state.e2e.enter-e2-epassword-modal.102a1` | e2e | !(errors.password) | null | 登录 + 房间 E2EE 开；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/e2e/EnterE2EPasswordModal/EnterE2EPasswordModal.tsx:102` |
| `state.e2e.enter-e2-epassword-modal.102a0` | e2e | errors.password | FieldError | 登录 + 房间 E2EE 开；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/e2e/EnterE2EPasswordModal/EnterE2EPasswordModal.tsx:102` |

### voip（103）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.voip.call-history-external-user.16a1` | voip | !(showIcon) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/CallHistoryExternalUser.tsx:16` |
| `state.voip.call-history-external-user.16a0` | voip | showIcon | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/CallHistoryExternalUser.tsx:16` |
| `state.voip.call-history-internal-user.27t1` | voip | !(avatarUrl) | Icon | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/CallHistoryInternalUser.tsx:27` |
| `state.voip.call-history-internal-user.27t0` | voip | avatarUrl | Avatar | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/CallHistoryInternalUser.tsx:27` |
| `state.voip.call-history-user.11i` | voip | isCallHistoryInternalContact(contact) | CallHistoryInternalUser | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/CallHistoryUser.tsx:11` |
| `state.voip.call-history-user.15i` | voip | isCallHistoryExternalContact(contact) | CallHistoryExternalUser | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/CallHistoryUser.tsx:15` |
| `state.voip.call-history-user.19d` | voip | 前述 if-ret 均不成立（default return） | CallHistoryUnknownUser | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/CallHistoryUser.tsx:19` |
| `state.voip.card-list-container.13i` | voip | focusedCard | CardListPinned | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/CardListContainer.tsx:13` |
| `state.voip.card-list-container.20d` | voip | 前述 if-ret 均不成立（default return） | CardList | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/CardListContainer.tsx:20` |
| `state.voip.peer-card.26t1` | voip | !(avatarUrl) | Icon | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/PeerCard/PeerCard.tsx:26` |
| `state.voip.peer-card.26t0` | voip | avatarUrl | Avatar | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/PeerCard/PeerCard.tsx:26` |
| `state.voip.peer-card-slot.15a1` | voip | !(muted) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/PeerCard/PeerCardSlot.tsx:15` |
| `state.voip.peer-card-slot.15a0` | voip | muted | Icon | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/PeerCard/PeerCardSlot.tsx:15` |
| `state.voip.peer-card-slot.16a1` | voip | !(held) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/PeerCard/PeerCardSlot.tsx:16` |
| `state.voip.peer-card-slot.16a0` | voip | held | Icon | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/PeerCard/PeerCardSlot.tsx:16` |
| `state.voip.stream-card.46a1` | voip | !(onClickFocusStream) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/StreamCard/StreamCard.tsx:46` |
| `state.voip.stream-card.46a0` | voip | onClickFocusStream | StreamCardPin | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/StreamCard/StreamCard.tsx:46` |
| `state.voip.stream-card.47a1` | voip | !(own && onClickStopSharing) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/StreamCard/StreamCard.tsx:47` |
| `state.voip.stream-card.47a0` | voip | own && onClickStopSharing | StreamCardStopSharingButton | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/StreamCard/StreamCard.tsx:47` |
| `state.voip.stream-card.48a1` | voip | !(onClickOpenInRoom) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/StreamCard/StreamCard.tsx:48` |
| `state.voip.stream-card.48a0` | voip | onClickOpenInRoom | StreamCardOpenInRoomButton | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Cards/StreamCard/StreamCard.tsx:48` |
| `state.voip.peer-autocomplete.45i` | voip | isFirstPeerAutocompleteOption(value) | Option | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerAutocomplete.tsx:45` |
| `state.voip.peer-autocomplete.49d` | voip | 前述 if-ret 均不成立（default return） | Option | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerAutocomplete.tsx:49` |
| `state.voip.peer-autocomplete.66a1` | voip | !(error) | null | 登录 + 语音许可 + MediaCallProvider 挂载；让该查询/mutation 失败 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerAutocomplete.tsx:66` |
| `state.voip.peer-autocomplete.66a0` | voip | error | FieldError | 登录 + 语音许可 + MediaCallProvider 挂载；让该查询/mutation 失败 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerAutocomplete.tsx:66` |
| `state.voip.internal-user.26t1` | voip | !(avatarUrl) | Icon | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/InternalUser.tsx:26` |
| `state.voip.internal-user.26t0` | voip | avatarUrl | Avatar | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/InternalUser.tsx:26` |
| `state.voip.internal-user.30a1` | voip | !(status) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/InternalUser.tsx:30` |
| `state.voip.internal-user.30a0` | voip | status | StatusBullet | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/InternalUser.tsx:30` |
| `state.voip.internal-user.33a1` | voip | !(remoteMuted) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/InternalUser.tsx:33` |
| `state.voip.internal-user.33a0` | voip | remoteMuted | Icon | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/InternalUser.tsx:33` |
| `state.voip.internal-user.35a1` | voip | !(callerId) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/InternalUser.tsx:35` |
| `state.voip.internal-user.35a0` | voip | callerId | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/InternalUser.tsx:35` |
| `state.voip.internal-user.41a1` | voip | !(!callerId && remoteStatusText) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/InternalUser.tsx:41` |
| `state.voip.internal-user.41a0` | voip | !callerId && remoteStatusText | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/InternalUser.tsx:41` |
| `state.voip.peer-info.8i` | voip | 'displayName' in props | InternalUser | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/PeerInfo.tsx:8` |
| `state.voip.peer-info.11d` | voip | 前述 if-ret 均不成立（default return） | PhoneNumber | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/PeerInfo/PeerInfo.tsx:11` |
| `state.voip.widget-handle.24i` | voip | !draggableContext | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Widget/WidgetHandle.tsx:24` |
| `state.voip.widget-handle.28d` | voip | 前述 if-ret 均不成立（default return） | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Widget/WidgetHandle.tsx:28` |
| `state.voip.widget-info.16i` | voip | !slots?.length | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Widget/WidgetInfo.tsx:16` |
| `state.voip.widget-info.19d` | voip | 前述 if-ret 均不成立（default return） | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Widget/WidgetInfo.tsx:19` |
| `state.voip.widget-info.36a1` | voip | !(slot.icon) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Widget/WidgetInfo.tsx:36` |
| `state.voip.widget-info.36a0` | voip | slot.icon | Icon | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/components/Widget/WidgetInfo.tsx:36` |
| `state.voip.media-call-provider.17a1` | voip | !(enabled) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/providers/MediaCallProvider.tsx:17` |
| `state.voip.media-call-provider.17a0` | voip | enabled | <> | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/providers/MediaCallProvider.tsx:17` |
| `state.voip.call-history-actions.59a1` | voip | !(items.length > 0) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/CallHistoryContextualbar/CallHistoryActions.tsx:59` |
| `state.voip.call-history-actions.59a0` | voip | items.length > 0 | GenericMenu | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/CallHistoryContextualbar/CallHistoryActions.tsx:59` |
| `state.voip.call-history-contextualbar.85a1` | voip | !(isCallHistoryInternalContact(contact) && contact.voiceCallExtension) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/CallHistoryContextualbar/CallHistoryContextualbar.tsx:85` |
| `state.voip.call-history-contextualbar.85a0` | voip | isCallHistoryInternalContact(contact) && contact.voiceCallExtension | InfoPanelSection | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/CallHistoryContextualbar/CallHistoryContextualbar.tsx:85` |
| `state.voip.call-history-contextualbar.95a1` | voip | !(isCallHistoryInternalContact(contact) && directMessage) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/CallHistoryContextualbar/CallHistoryContextualbar.tsx:95` |
| `state.voip.call-history-contextualbar.95a0` | voip | isCallHistoryInternalContact(contact) && directMessage | Button | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/CallHistoryContextualbar/CallHistoryContextualbar.tsx:95` |
| `state.voip.call-history-contextualbar.101a1` | voip | !(voiceCall) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/CallHistoryContextualbar/CallHistoryContextualbar.tsx:101` |
| `state.voip.call-history-contextualbar.101a0` | voip | voiceCall | Button | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/CallHistoryContextualbar/CallHistoryContextualbar.tsx:101` |
| `state.voip.media-call-card-list.35i` | voip | !peerInfo ¦¦ 'number' in peerInfo | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallCardList.tsx:35` |
| `state.voip.media-call-card-list.39t1` | voip | !(remoteScreen?.active) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallCardList.tsx:39` |
| `state.voip.media-call-card-list.39t0` | voip | remoteScreen?.active | StreamCard | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallCardList.tsx:39` |
| `state.voip.media-call-card-list.54t1` | voip | !(localScreen?.active) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallCardList.tsx:54` |
| `state.voip.media-call-card-list.54t0` | voip | localScreen?.active | StreamCard | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallCardList.tsx:54` |
| `state.voip.media-call-card-list.77d` | voip | 前述 if-ret 均不成立（default return） | CardListSection | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallCardList.tsx:77` |
| `state.voip.call-history-table-status.63a1` | voip | !(durationText) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallHistoryTable/CallHistoryTableStatus.tsx:63` |
| `state.voip.call-history-table-status.63a0` | voip | durationText | <> | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallHistoryTable/CallHistoryTableStatus.tsx:63` |
| `state.voip.media-call-popout.42i` | voip | !container | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallPopout.tsx:42` |
| `state.voip.media-call-popout.46d` | voip | 前述 if-ret 均不成立（default return） | MediaCallPopoutWindow | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallPopout.tsx:46` |
| `state.voip.media-call-popout-view.43i` | voip | !peerInfo ¦¦ 'number' in peerInfo | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallPopoutView.tsx:43` |
| `state.voip.media-call-popout-view.47d` | voip | 前述 if-ret 均不成立（default return） | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallPopoutView.tsx:47` |
| `state.voip.media-call-popout-view.70a1` | voip | !(fullscreenEnabled) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallPopoutView.tsx:70` |
| `state.voip.media-call-popout-view.70a0` | voip | fullscreenEnabled | ToggleButton | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallPopoutView.tsx:70` |
| `state.voip.media-call-room-activity.45a1` | voip | !(showChat) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallRoomSection/MediaCallRoomActivity.tsx:45` |
| `state.voip.media-call-room-activity.45a0` | voip | showChat | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallRoomSection/MediaCallRoomActivity.tsx:45` |
| `state.voip.media-call-room-section.72i` | voip | !peerInfo ¦¦ 'number' in peerInfo | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallRoomSection/MediaCallRoomSection.tsx:72` |
| `state.voip.media-call-room-section.76d` | voip | 前述 if-ret 均不成立（default return） | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallRoomSection/MediaCallRoomSection.tsx:76` |
| `state.voip.media-call-room-section.88t1` | voip | !(isPopout) | MediaCallCardList | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallRoomSection/MediaCallRoomSection.tsx:88` |
| `state.voip.media-call-room-section.88t0` | voip | isPopout | PopoutDockPrompt | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallRoomSection/MediaCallRoomSection.tsx:88` |
| `state.voip.incoming-call-transfer.23a1` | voip | !(transferredBy) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/IncomingCallTransfer.tsx:23` |
| `state.voip.incoming-call-transfer.23a0` | voip | transferredBy | WidgetInfo | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/IncomingCallTransfer.tsx:23` |
| `state.voip.media-call-widget.16i` | voip | hidden ¦¦ !currentViews.has('widget') ¦¦ !widgetVisible | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/MediaCallWidget.tsx:16` |
| `state.voip.media-call-widget.20d` | voip | 前述 if-ret 均不成立（default return） | WidgetDraggableProvider | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/MediaCallWidget.tsx:20` |
| `state.voip.media-call-widget-view-router.12i` | voip | supportedFeatures.includes('screen-share') | OngoingCallWithScreen | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/MediaCallWidgetViewRouter.tsx:12` |
| `state.voip.media-call-widget-view-router.17i` | voip | transferredBy | IncomingCallTransfer | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/MediaCallWidgetViewRouter.tsx:17` |
| `state.voip.media-call-widget-view-router.22i` | voip | transferredBy | OutgoingCallTransfer | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/MediaCallWidgetViewRouter.tsx:22` |
| `state.voip.media-call-widget-view-router.28d` | voip | 前述 if-ret 均不成立（default return） | NewCall | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/MediaCallWidgetViewRouter.tsx:28` |
| `state.voip.new-call.35a1` | voip | !(targetPeer) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/NewCall.tsx:35` |
| `state.voip.new-call.35a0` | voip | targetPeer | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/NewCall.tsx:35` |
| `state.voip.ongoing-call.49a1` | voip | !(onClickDirectMessage) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:49` |
| `state.voip.ongoing-call.49a0` | voip | onClickDirectMessage | ActionButton | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:49` |
| `state.voip.ongoing-call.59t1` | voip | !(open) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:59` |
| `state.voip.ongoing-call.59t0` | voip | open | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCall.tsx:59` |
| `state.voip.ongoing-call-with-screen.63a1` | voip | !(onClickDirectMessage) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:63` |
| `state.voip.ongoing-call-with-screen.63a0` | voip | onClickDirectMessage | ActionButton | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:63` |
| `state.voip.ongoing-call-with-screen.84a1` | voip | !(isPopout) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:84` |
| `state.voip.ongoing-call-with-screen.84a0` | voip | isPopout | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:84` |
| `state.voip.ongoing-call-with-screen.89a1` | voip | !(localScreen?.active) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:89` |
| `state.voip.ongoing-call-with-screen.89a0` | voip | localScreen?.active | WidgetInfo | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:89` |
| `state.voip.ongoing-call-with-screen.95a1` | voip | !(!isPopout) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:95` |
| `state.voip.ongoing-call-with-screen.95a0` | voip | !isPopout | <> | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:95` |
| `state.voip.ongoing-call-with-screen.97a1` | voip | !(remoteScreen?.active) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:97` |
| `state.voip.ongoing-call-with-screen.97a0` | voip | remoteScreen?.active | StreamCard | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:97` |
| `state.voip.ongoing-call-with-screen.104a1` | voip | !(localScreen?.active) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:104` |
| `state.voip.ongoing-call-with-screen.104a0` | voip | localScreen?.active | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OngoingCallWithScreen.tsx:104` |
| `state.voip.outgoing-call-transfer.27a1` | voip | !(transferredBy) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OutgoingCallTransfer.tsx:27` |
| `state.voip.outgoing-call-transfer.27a0` | voip | transferredBy | WidgetInfo | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/MediaCallWidget/OutgoingCallTransfer.tsx:27` |
| `state.voip.transfer-modal.69a1` | voip | !(peer) | null | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/TransferModal.tsx:69` |
| `state.voip.transfer-modal.69a0` | voip | peer | Box | 登录 + 语音许可 + MediaCallProvider 挂载 | [待渲染实测] | （无） | `packages/ui-voip/src/views/TransferModal.tsx:69` |

### videoconf（8）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.videoconf.video-conf-message-user-stack.20a1` | videoconf | !(displayAvatars) | null | 登录 + 视频会议入口 | [待渲染实测] | （无） | `packages/ui-video-conf/src/VideoConfMessage/VideoConfMessageUserStack.tsx:20` |
| `state.videoconf.video-conf-message-user-stack.20a0` | videoconf | displayAvatars | Box | 登录 + 视频会议入口 | [待渲染实测] | （无） | `packages/ui-video-conf/src/VideoConfMessage/VideoConfMessageUserStack.tsx:20` |
| `state.videoconf.video-conf-message-user-stack.34a1` | videoconf | !(!displayAvatars) | null | 登录 + 视频会议入口 | [待渲染实测] | （无） | `packages/ui-video-conf/src/VideoConfMessage/VideoConfMessageUserStack.tsx:34` |
| `state.videoconf.video-conf-message-user-stack.34a0` | videoconf | !displayAvatars | Icon | 登录 + 视频会议入口 | [待渲染实测] | （无） | `packages/ui-video-conf/src/VideoConfMessage/VideoConfMessageUserStack.tsx:34` |
| `state.videoconf.video-conf-popup-info.13a1` | videoconf | !((icon ¦¦ children)) | null | 登录 + 视频会议入口 | [待渲染实测] | （无） | `packages/ui-video-conf/src/VideoConfPopup/VideoConfPopupInfo.tsx:13` |
| `state.videoconf.video-conf-popup-info.13a0` | videoconf | (icon ¦¦ children) | Box | 登录 + 视频会议入口 | [待渲染实测] | （无） | `packages/ui-video-conf/src/VideoConfPopup/VideoConfPopupInfo.tsx:13` |
| `state.videoconf.video-conf-popup-title.11a1` | videoconf | !(counter) | null | 登录 + 视频会议入口 | [待渲染实测] | （无） | `packages/ui-video-conf/src/VideoConfPopup/VideoConfPopupTitle.tsx:11` |
| `state.videoconf.video-conf-popup-title.11a0` | videoconf | counter | Throbber | 登录 + 视频会议入口 | [待渲染实测] | （无） | `packages/ui-video-conf/src/VideoConfPopup/VideoConfPopupTitle.tsx:11` |

### callhist（17）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.callhist.call-history-page.161i` | callhist | tab?.openTab === 'user-info' | UserInfoWithData | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:161` |
| `state.callhist.call-history-page.164i` | callhist | tab?.openTab === 'details' && historyId | MediaCallHistoryContextualbar | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:164` |
| `state.callhist.call-history-page.167d` | callhist | 前述 if-ret 均不成立（default return） | null | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:167` |
| `state.callhist.call-history-page.174i` | callhist | isPending | CallHistoryPageLayout | 登录 → `/call-history`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:174` |
| `state.callhist.call-history-page.188i` | callhist | error | CallHistoryPageLayout | 登录 → `/call-history`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:188` |
| `state.callhist.call-history-page.202d` | callhist | 前述 if-ret 均不成立（default return） | CallHistoryPageLayout | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:202` |
| `state.callhist.call-history-page.204a1` | callhist | !(tableData.length === 0) | null | 登录 → `/call-history`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:204` |
| `state.callhist.call-history-page.204a0` | callhist | tableData.length === 0 | GenericNoResults | 登录 → `/call-history`；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:204` |
| `state.callhist.call-history-page.205a1` | callhist | !(tableData && tableData.length > 0) | null | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:205` |
| `state.callhist.call-history-page.205a0` | callhist | tableData && tableData.length > 0 | MediaCallHistoryTable | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:205` |
| `state.callhist.call-history-page.208i` | callhist | isCallHistoryUnknownContact(item.contact) | CallHistoryRowUnknownUser | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:208` |
| `state.callhist.call-history-page.211i` | callhist | isCallHistoryInternalContact(item.contact) | CallHistoryRowInternalUser | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:211` |
| `state.callhist.call-history-page.224d` | callhist | 前述 if-ret 均不成立（default return） | CallHistoryRowExternalUser | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/CallHistoryPage.tsx:224` |
| `state.callhist.media-call-history-contextualbar.53i` | callhist | isPending | ContextualbarSkeleton | 登录 → `/call-history`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/MediaCallHistoryContextualbar.tsx:53` |
| `state.callhist.media-call-history-contextualbar.57i` | callhist | isSuccess && isInternalCallHistoryItem(data) | MediaCallHistoryInternal | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/MediaCallHistoryContextualbar.tsx:57` |
| `state.callhist.media-call-history-contextualbar.69i` | callhist | isSuccess && isExternalCallHistoryItem(data) | MediaCallHistoryExternal | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/MediaCallHistoryContextualbar.tsx:69` |
| `state.callhist.media-call-history-contextualbar.73d` | callhist | 前述 if-ret 均不成立（default return） | ContextualbarDialog | 登录 → `/call-history` | [待渲染实测] | （无） | `apps/meteor/client/views/mediaCallHistory/MediaCallHistoryContextualbar.tsx:73` |

### oauth（8）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.oauth.oauth-authorization-page.19i` | oauth | !user | RegistrationPageRouter | 打开 `/oauth/authorize` | [待渲染实测] | （无） | `apps/meteor/client/views/oauth/OAuthAuthorizationPage.tsx:19` |
| `state.oauth.oauth-authorization-page.23i` | oauth | oauthAppQuery.isPending | PageLoading | 打开 `/oauth/authorize`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/oauth/OAuthAuthorizationPage.tsx:23` |
| `state.oauth.oauth-authorization-page.27i` | oauth | oauthAppQuery.isError | ErrorPage | 打开 `/oauth/authorize`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/oauth/OAuthAuthorizationPage.tsx:27` |
| `state.oauth.oauth-authorization-page.31d` | oauth | 前述 if-ret 均不成立（default return） | AuthorizationFormPage | 打开 `/oauth/authorize` | [待渲染实测] | （无） | `apps/meteor/client/views/oauth/OAuthAuthorizationPage.tsx:31` |
| `state.oauth.current-user-display.40a1` | oauth | !(utcOffset && Number.isInteger(utcOffset)) | null | 打开 `/oauth/authorize` | [待渲染实测] | （无） | `apps/meteor/client/views/oauth/components/CurrentUserDisplay.tsx:40` |
| `state.oauth.current-user-display.40a0` | oauth | utcOffset && Number.isInteger(utcOffset) | LocalTime | 打开 `/oauth/authorize` | [待渲染实测] | （无） | `apps/meteor/client/views/oauth/components/CurrentUserDisplay.tsx:40` |
| `state.oauth.current-user-display.41t1` | oauth | !(bio) | <> | 打开 `/oauth/authorize` | [待渲染实测] | （无） | `apps/meteor/client/views/oauth/components/CurrentUserDisplay.tsx:41` |
| `state.oauth.current-user-display.41t0` | oauth | bio | UserCardInfo | 打开 `/oauth/authorize` | [待渲染实测] | （无） | `apps/meteor/client/views/oauth/components/CurrentUserDisplay.tsx:41` |

### conference（4）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.conference.conference-page.37i` | conference | !callUrl | ConferencePageError | 打开 `/meet/:rid` 或 `/conference/:id` | [待渲染实测] | （无） | `apps/meteor/client/views/conference/ConferencePage.tsx:37` |
| `state.conference.conference-page.41d` | conference | 前述 if-ret 均不成立（default return） | PageLoading | 打开 `/meet/:rid` 或 `/conference/:id` | [待渲染实测] | （无） | `apps/meteor/client/views/conference/ConferencePage.tsx:41` |
| `state.conference.conference-page-error.18a1` | conference | !(!user) | null | 打开 `/meet/:rid` 或 `/conference/:id` | [待渲染实测] | （无） | `apps/meteor/client/views/conference/ConferencePageError.tsx:18` |
| `state.conference.conference-page-error.18a0` | conference | !user | StatesActions | 打开 `/meet/:rid` 或 `/conference/:id` | [待渲染实测] | （无） | `apps/meteor/client/views/conference/ConferencePageError.tsx:18` |

### search（34）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.search.search-answer-panel.59a1` | search | !(provider) | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchAnswerPanel.tsx:59` |
| `state.search.search-answer-panel.59a0` | search | provider | Box | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchAnswerPanel.tsx:59` |
| `state.search.search-page.73t1` | search | !(debouncedQuery) | Box | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:73` |
| `state.search.search-page.73t0` | search | debouncedQuery | Box | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:73` |
| `state.search.search-page.93a1` | search | !(hasIntelligentSearchLicense === false) | null | 登录 → `/search`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:93` |
| `state.search.search-page.93a0` | search | hasIntelligentSearchLicense === false | Callout | 登录 → `/search`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:93` |
| `state.search.search-page.98a1` | search | !(hasIntelligentSearchLicense && !aiSearchFeatureEnabled) | null | 登录 → `/search`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:98` |
| `state.search.search-page.98a0` | search | hasIntelligentSearchLicense && !aiSearchFeatureEnabled | Callout | 登录 → `/search`；EE license 开/关 | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:98` |
| `state.search.search-page.103a1` | search | !(canUseAISearch && !intelligentSearchEnabled) | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:103` |
| `state.search.search-page.103a0` | search | canUseAISearch && !intelligentSearchEnabled | Callout | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:103` |
| `state.search.search-page.108a1` | search | !(canUseAISearch && intelligentSearchEnabled && meta && !meta.intelligentSearchConfigured) | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:108` |
| `state.search.search-page.108a0` | search | canUseAISearch && intelligentSearchEnabled && meta && !meta.intelligentSearchConfigured | Callout | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:108` |
| `state.search.search-page.113a1` | search | !(searchError) | null | 登录 → `/search`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:113` |
| `state.search.search-page.113a0` | search | searchError | Callout | 登录 → `/search`；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:113` |
| `state.search.search-page.118a1` | search | !(debouncedQuery) | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:118` |
| `state.search.search-page.118a0` | search | debouncedQuery | SearchAnswerPanel | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:118` |
| `state.search.search-page.133a1` | search | !(hasMoreResults) | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:133` |
| `state.search.search-page.133a0` | search | hasMoreResults | Button | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:133` |
| `state.search.search-page.139a1` | search | !(!debouncedQuery) | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:139` |
| `state.search.search-page.139a0` | search | !debouncedQuery | Box | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:139` |
| `state.search.search-page.144a1` | search | !(isLoading) | null | 登录 → `/search`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:144` |
| `state.search.search-page.144a0` | search | isLoading | Box | 登录 → `/search`；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:144` |
| `state.search.search-page.149a1` | search | !(debouncedQuery && !isLoading && !searchError && intelligent.length === 0) | null | 登录 → `/search`；等查询 in-flight；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:149` |
| `state.search.search-page.149a0` | search | debouncedQuery && !isLoading && !searchError && intelligent.length === 0 | Box | 登录 → `/search`；等查询 in-flight；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchPage.tsx:149` |
| `state.search.search-source-result.98a1` | search | !(item.u?.username) | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchSourceResult.tsx:98` |
| `state.search.search-source-result.98a0` | search | item.u?.username | <> | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchSourceResult.tsx:98` |
| `state.search.search-source-result.104a1` | search | !(roomLabel) | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchSourceResult.tsx:104` |
| `state.search.search-source-result.104a0` | search | roomLabel | MessageRole | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchSourceResult.tsx:104` |
| `state.search.search-source-result.112a1` | search | !(messageTime) | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchSourceResult.tsx:112` |
| `state.search.search-source-result.112a0` | search | messageTime | MessageTimestamp | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchSourceResult.tsx:112` |
| `state.search.search-source-result.123a1` | search | !(typeof relevanceScore === 'number') | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchSourceResult.tsx:123` |
| `state.search.search-source-result.123a0` | search | typeof relevanceScore === 'number' | MessageContainerFixed | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchSourceResult.tsx:123` |
| `state.search.search-source-result.129a1` | search | !(href) | null | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchSourceResult.tsx:129` |
| `state.search.search-source-result.129a0` | search | href | Box | 登录 → `/search` | [待渲染实测] | （无） | `apps/meteor/client/views/search/SearchSourceResult.tsx:129` |

### mailer（6）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.mailer.mailer-unsubscription-page.41a1` | mailer | !((isIdle ¦¦ isPending)) | null | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/mailer/MailerUnsubscriptionPage.tsx:41` |
| `state.mailer.mailer-unsubscription-page.41a0` | mailer | (isIdle ¦¦ isPending) | Throbber | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/mailer/MailerUnsubscriptionPage.tsx:41` |
| `state.mailer.mailer-unsubscription-page.42a1` | mailer | !(isError) | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/mailer/MailerUnsubscriptionPage.tsx:42` |
| `state.mailer.mailer-unsubscription-page.42a0` | mailer | isError | Callout | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/mailer/MailerUnsubscriptionPage.tsx:42` |
| `state.mailer.mailer-unsubscription-page.43a1` | mailer | !(isSuccess) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/mailer/MailerUnsubscriptionPage.tsx:43` |
| `state.mailer.mailer-unsubscription-page.43a0` | mailer | isSuccess | Callout | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/mailer/MailerUnsubscriptionPage.tsx:43` |

### outlook（24）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.outlook.outlook-calendar-event-modal.35i` | outlook | isLoading | GenericModalSkeleton | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookCalendarEventModal.tsx:35` |
| `state.outlook.outlook-calendar-event-modal.39d` | outlook | 前述 if-ret 均不成立（default return） | GenericModal | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookCalendarEventModal.tsx:39` |
| `state.outlook.outlook-event-item.61a1` | outlook | !(meetingUrl) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventItem.tsx:61` |
| `state.outlook.outlook-event-item.61a0` | outlook | meetingUrl | Button | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventItem.tsx:61` |
| `state.outlook.outlook-events-list.56a1` | outlook | !(calendarListResult.isPending) | null | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:56` |
| `state.outlook.outlook-events-list.56a0` | outlook | calendarListResult.isPending | Throbber | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:56` |
| `state.outlook.outlook-events-list.57a1` | outlook | !(calendarListResult.isError) | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:57` |
| `state.outlook.outlook-events-list.57a0` | outlook | calendarListResult.isError | States | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:57` |
| `state.outlook.outlook-events-list.64a1` | outlook | !(!calendarListResult.isPending && total === 0) | null | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:64` |
| `state.outlook.outlook-events-list.64a0` | outlook | !calendarListResult.isPending && total === 0 | States | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:64` |
| `state.outlook.outlook-events-list.70a1` | outlook | !(calendarListResult.isSuccess && calendarListResult.data.length > 0) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:70` |
| `state.outlook.outlook-events-list.70a0` | outlook | calendarListResult.isSuccess && calendarListResult.data.length > 0 | VirtualizedScrollbars | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:70` |
| `state.outlook.outlook-events-list.88a1` | outlook | !(authEnabled) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:88` |
| `state.outlook.outlook-events-list.88a0` | outlook | authEnabled | Button | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:88` |
| `state.outlook.outlook-events-list.89a1` | outlook | !(outlookUrl) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:89` |
| `state.outlook.outlook-events-list.89a0` | outlook | outlookUrl | Button | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:89` |
| `state.outlook.outlook-events-list.95a1` | outlook | !(hasOutlookMethods) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:95` |
| `state.outlook.outlook-events-list.95a0` | outlook | hasOutlookMethods | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsList/OutlookEventsList.tsx:95` |
| `state.outlook.outlook-events-route.18i` | outlook | calendarRoute === CALENDAR_ROUTES.SETTINGS | OutlookSettingsList | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsRoute.tsx:18` |
| `state.outlook.outlook-events-route.22d` | outlook | 前述 if-ret 均不成立（default return） | OutlookEventsList | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookEventsRoute.tsx:22` |
| `state.outlook.outlook-setting-item.42a1` | outlook | !(id === 'authentication') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookSettingsList/OutlookSettingItem.tsx:42` |
| `state.outlook.outlook-setting-item.42a0` | outlook | id === 'authentication' | Button | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookSettingsList/OutlookSettingItem.tsx:42` |
| `state.outlook.outlook-setting-item.47a1` | outlook | !(id !== 'authentication') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookSettingsList/OutlookSettingItem.tsx:47` |
| `state.outlook.outlook-setting-item.47a0` | outlook | id !== 'authentication' | Button | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/outlookCalendar/OutlookSettingsList/OutlookSettingItem.tsx:47` |

### audit（80）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.audit.audit-page.40t1` | audit | !(selectedRoom?.encrypted && type === '') | null | 登录后主壳（由 client/main.ts 闭包挂载）；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/AuditPage.tsx:40` |
| `state.audit.audit-page.40t0` | audit | selectedRoom?.encrypted && type === '' | Callout | 登录后主壳（由 client/main.ts 闭包挂载）；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/AuditPage.tsx:40` |
| `state.audit.audit-page.46a1` | audit | !(auditMutation.isPending) | null | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/audit/AuditPage.tsx:46` |
| `state.audit.audit-page.46a0` | audit | auditMutation.isPending | ListSkeleton | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/audit/AuditPage.tsx:46` |
| `state.audit.audit-page.47a1` | audit | !(auditMutation.isError) | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/AuditPage.tsx:47` |
| `state.audit.audit-page.47a0` | audit | auditMutation.isError | States | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/AuditPage.tsx:47` |
| `state.audit.audit-page.54a1` | audit | !(auditMutation.isSuccess) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/AuditPage.tsx:54` |
| `state.audit.audit-page.54a0` | audit | auditMutation.isSuccess | AuditResult | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/AuditPage.tsx:54` |
| `state.audit.app-info-field.35a1` | audit | !(isLoading) | null | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AppInfoField.tsx:35` |
| `state.audit.app-info-field.35a0` | audit | isLoading | Skeleton | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AppInfoField.tsx:35` |
| `state.audit.audit-filters-display.22t1` | audit | !(startDate && endDate) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditFiltersDisplay.tsx:22` |
| `state.audit.audit-filters-display.22t0` | audit | startDate && endDate | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditFiltersDisplay.tsx:22` |
| `state.audit.audit-form.53a1` | audit | !(dateRangeFieldState.error?.type === 'required') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:53` |
| `state.audit.audit-form.53a0` | audit | dateRangeFieldState.error?.type === 'required' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:53` |
| `state.audit.audit-form.54a1` | audit | !(dateRangeFieldState.error?.type === 'validate') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:54` |
| `state.audit.audit-form.54a0` | audit | dateRangeFieldState.error?.type === 'validate' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:54` |
| `state.audit.audit-form.59a1` | audit | !(type === '') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:59` |
| `state.audit.audit-form.59a0` | audit | type === '' | RoomsTab | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:59` |
| `state.audit.audit-form.60a1` | audit | !(type === 'u') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:60` |
| `state.audit.audit-form.60a0` | audit | type === 'u' | UsersTab | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:60` |
| `state.audit.audit-form.61a1` | audit | !(type === 'd') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:61` |
| `state.audit.audit-form.61a0` | audit | type === 'd' | DirectTab | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:61` |
| `state.audit.audit-form.62a1` | audit | !(type === 'l') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:62` |
| `state.audit.audit-form.62a0` | audit | type === 'l' | OmnichannelTab | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditForm.tsx:62` |
| `state.audit.audit-log-entry.30a1` | audit | !(username) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditLogEntry.tsx:30` |
| `state.audit.audit-log-entry.30a0` | audit | username | UserAvatar | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditLogEntry.tsx:30` |
| `state.audit.audit-log-entry.36a1` | audit | !(name) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditLogEntry.tsx:36` |
| `state.audit.audit-log-entry.36a0` | audit | name | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditLogEntry.tsx:36` |
| `state.audit.audit-log-table.71a1` | audit | !(isLoading) | null | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditLogTable.tsx:71` |
| `state.audit.audit-log-table.71a0` | audit | isLoading | GenericTable | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditLogTable.tsx:71` |
| `state.audit.audit-log-table.79a1` | audit | !(isSuccess && data.length === 0) | null | 登录后主壳（由 client/main.ts 闭包挂载）；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditLogTable.tsx:79` |
| `state.audit.audit-log-table.79a0` | audit | isSuccess && data.length === 0 | GenericNoResults | 登录后主壳（由 client/main.ts 闭包挂载）；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditLogTable.tsx:79` |
| `state.audit.audit-log-table.80a1` | audit | !(isSuccess && data.length > 0) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditLogTable.tsx:80` |
| `state.audit.audit-log-table.80a0` | audit | isSuccess && data.length > 0 | GenericTable | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditLogTable.tsx:80` |
| `state.audit.audit-message-list.28a1` | audit | !(newDay) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditMessageList.tsx:28` |
| `state.audit.audit-message-list.28a0` | audit | newDay | MessageDivider | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditMessageList.tsx:28` |
| `state.audit.audit-message-list.30a1` | audit | !(!system) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditMessageList.tsx:30` |
| `state.audit.audit-message-list.30a0` | audit | !system | RoomMessage | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditMessageList.tsx:30` |
| `state.audit.audit-message-list.42a1` | audit | !(system) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditMessageList.tsx:42` |
| `state.audit.audit-message-list.42a0` | audit | system | SystemMessage | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditMessageList.tsx:42` |
| `state.audit.audit-result.13i` | audit | messages.length === 0 | GenericNoResults | 登录后主壳（由 client/main.ts 闭包挂载）；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditResult.tsx:13` |
| `state.audit.audit-result.17d` | audit | 前述 if-ret 均不成立（default return） | div | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/AuditResult.tsx:17` |
| `state.audit.security-log-display-modal.32a1` | audit | !(actor.type === 'user') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogDisplayModal.tsx:32` |
| `state.audit.security-log-display-modal.32a0` | audit | actor.type === 'user' | AuditModalField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogDisplayModal.tsx:32` |
| `state.audit.security-log-display-modal.36a1` | audit | !(actor.type === 'user') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogDisplayModal.tsx:36` |
| `state.audit.security-log-display-modal.36a0` | audit | actor.type === 'user' | UserAvatar | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogDisplayModal.tsx:36` |
| `state.audit.security-log-display-modal.51a1` | audit | !(actor.type === 'app') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogDisplayModal.tsx:51` |
| `state.audit.security-log-display-modal.51a0` | audit | actor.type === 'app' | AppInfoField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogDisplayModal.tsx:51` |
| `state.audit.security-log-display-modal.53a1` | audit | !(actor.type === 'system') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogDisplayModal.tsx:53` |
| `state.audit.security-log-display-modal.53a0` | audit | actor.type === 'system' | <> | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogDisplayModal.tsx:53` |
| `state.audit.security-logs-table.129a1` | audit | !(isLoading) | null | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:129` |
| `state.audit.security-logs-table.129a0` | audit | isLoading | GenericTable | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:129` |
| `state.audit.security-logs-table.143a1` | audit | !(isSuccess && data.total === 0) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:143` |
| `state.audit.security-logs-table.143a0` | audit | isSuccess && data.total === 0 | GenericNoResults | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:143` |
| `state.audit.security-logs-table.151a1` | audit | !(isSuccess && data.total > 0) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:151` |
| `state.audit.security-logs-table.151a0` | audit | isSuccess && data.total > 0 | GenericTable | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:151` |
| `state.audit.security-logs-table.184a1` | audit | !(item.actor.type === 'user') | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:184` |
| `state.audit.security-logs-table.184a0` | audit | item.actor.type === 'user' | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/SecurityLogsTable.tsx:184` |
| `state.audit.direct-tab.40a1` | audit | !(usersFieldState.error?.type === 'required') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/DirectTab.tsx:40` |
| `state.audit.direct-tab.40a0` | audit | usersFieldState.error?.type === 'required' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/DirectTab.tsx:40` |
| `state.audit.direct-tab.41a1` | audit | !(usersFieldState.error?.type === 'validate') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/DirectTab.tsx:41` |
| `state.audit.direct-tab.41a0` | audit | usersFieldState.error?.type === 'validate' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/DirectTab.tsx:41` |
| `state.audit.omnichannel-tab.40a1` | audit | !(visitorFieldState.error?.type === 'required') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/OmnichannelTab.tsx:40` |
| `state.audit.omnichannel-tab.40a0` | audit | visitorFieldState.error?.type === 'required' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/OmnichannelTab.tsx:40` |
| `state.audit.omnichannel-tab.41a1` | audit | !(visitorFieldState.error?.type === 'validate') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/OmnichannelTab.tsx:41` |
| `state.audit.omnichannel-tab.41a0` | audit | visitorFieldState.error?.type === 'validate' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/OmnichannelTab.tsx:41` |
| `state.audit.omnichannel-tab.59a1` | audit | !(agentFieldState.error?.type === 'required') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/OmnichannelTab.tsx:59` |
| `state.audit.omnichannel-tab.59a0` | audit | agentFieldState.error?.type === 'required' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/OmnichannelTab.tsx:59` |
| `state.audit.omnichannel-tab.60a1` | audit | !(agentFieldState.error?.type === 'validate') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/OmnichannelTab.tsx:60` |
| `state.audit.omnichannel-tab.60a0` | audit | agentFieldState.error?.type === 'validate' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/OmnichannelTab.tsx:60` |
| `state.audit.rooms-tab.33t1` | audit | !(encrypted) | null | 登录后主壳（由 client/main.ts 闭包挂载）；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/RoomsTab.tsx:33` |
| `state.audit.rooms-tab.33t0` | audit | encrypted | Icon | 登录后主壳（由 client/main.ts 闭包挂载）；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/RoomsTab.tsx:33` |
| `state.audit.rooms-tab.37a1` | audit | !(ridFieldState.error?.type === 'required') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/RoomsTab.tsx:37` |
| `state.audit.rooms-tab.37a0` | audit | ridFieldState.error?.type === 'required' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/RoomsTab.tsx:37` |
| `state.audit.rooms-tab.38a1` | audit | !(ridFieldState.error?.type === 'validate') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/RoomsTab.tsx:38` |
| `state.audit.rooms-tab.38a0` | audit | ridFieldState.error?.type === 'validate' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/RoomsTab.tsx:38` |
| `state.audit.users-tab.40a1` | audit | !(usersFieldState.error?.type === 'required') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/UsersTab.tsx:40` |
| `state.audit.users-tab.40a0` | audit | usersFieldState.error?.type === 'required' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/UsersTab.tsx:40` |
| `state.audit.users-tab.41a1` | audit | !(usersFieldState.error?.type === 'validate') | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/UsersTab.tsx:41` |
| `state.audit.users-tab.41a0` | audit | usersFieldState.error?.type === 'validate' | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/views/audit/components/tabs/UsersTab.tsx:41` |

### provider（4）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.provider.image-gallery-provider.45a1` | provider | !(!!singleImageUrl) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/providers/ImageGalleryProvider.tsx:45` |
| `state.provider.image-gallery-provider.45a0` | provider | !!singleImageUrl | ImageGallery | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/providers/ImageGalleryProvider.tsx:45` |
| `state.provider.image-gallery-provider.48a1` | provider | !(!!imageId) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/providers/ImageGalleryProvider.tsx:48` |
| `state.provider.image-gallery-provider.48a0` | provider | !!imageId | ImageGalleryData | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/providers/ImageGalleryProvider.tsx:48` |

### hook（4）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.hook.use-thread-room-action.60a1` | hook | !(!!unread) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/hooks/roomActions/useThreadRoomAction.tsx:60` |
| `state.hook.use-thread-room-action.60a0` | hook | !!unread | HeaderToolbarActionBadge | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/hooks/roomActions/useThreadRoomAction.tsx:60` |
| `state.hook.use-user-status-tooltip.13i` | hook | !presence | Skeleton | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/hooks/useUserStatusTooltip.tsx:13` |
| `state.hook.use-user-status-tooltip.17d` | hook | 前述 if-ret 均不成立（default return） | UserStatusText | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/hooks/useUserStatusTooltip.tsx:17` |

### comp（184）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.comp.action-manager-busy-state.27i` | comp | busy | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ActionManagerBusyState.tsx:27` |
| `state.comp.action-manager-busy-state.50d` | comp | 前述 if-ret 均不成立（default return） | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ActionManagerBusyState.tsx:50` |
| `state.comp.confirm-owner-change-modal.26i` | comp | shouldChangeOwner.length === 1 | Trans | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ConfirmOwnerChangeModal.tsx:26` |
| `state.comp.confirm-owner-change-modal.35i` | comp | shouldChangeOwner.length <= 5 | Trans | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ConfirmOwnerChangeModal.tsx:35` |
| `state.comp.confirm-owner-change-modal.44d` | comp | 前述 if-ret 均不成立（default return） | Trans | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ConfirmOwnerChangeModal.tsx:44` |
| `state.comp.confirm-owner-change-modal.58i` | comp | shouldBeRemoved.length === 1 | Trans | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ConfirmOwnerChangeModal.tsx:58` |
| `state.comp.confirm-owner-change-modal.67i` | comp | shouldBeRemoved.length <= 5 | Trans | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ConfirmOwnerChangeModal.tsx:67` |
| `state.comp.confirm-owner-change-modal.76d` | comp | 前述 if-ret 均不成立（default return） | Trans | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ConfirmOwnerChangeModal.tsx:76` |
| `state.comp.confirm-owner-change-modal.83a1` | comp | !(shouldChangeOwner) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ConfirmOwnerChangeModal.tsx:83` |
| `state.comp.confirm-owner-change-modal.83a0` | comp | shouldChangeOwner | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ConfirmOwnerChangeModal.tsx:83` |
| `state.comp.confirm-owner-change-modal.84a1` | comp | !(shouldBeRemoved) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ConfirmOwnerChangeModal.tsx:84` |
| `state.comp.confirm-owner-change-modal.84a0` | comp | shouldBeRemoved | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ConfirmOwnerChangeModal.tsx:84` |
| `state.comp.create-discussion.123a1` | comp | !(defaultParentRoom) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:123` |
| `state.comp.create-discussion.123a0` | comp | defaultParentRoom | Controller | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:123` |
| `state.comp.create-discussion.130a1` | comp | !(!defaultParentRoom) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:130` |
| `state.comp.create-discussion.130a0` | comp | !defaultParentRoom | Controller | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:130` |
| `state.comp.create-discussion.143t1` | comp | !(encrypted) | null | 登录后主壳（由 client/main.ts 闭包挂载）；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:143` |
| `state.comp.create-discussion.143t0` | comp | encrypted | Icon | 登录后主壳（由 client/main.ts 闭包挂载）；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:143` |
| `state.comp.create-discussion.149a1` | comp | !(errors.parentRoom) | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:149` |
| `state.comp.create-discussion.149a0` | comp | errors.parentRoom | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:149` |
| `state.comp.create-discussion.163a1` | comp | !(errors.name) | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:163` |
| `state.comp.create-discussion.163a0` | comp | errors.name | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:163` |
| `state.comp.create-discussion.193t1` | comp | !(encrypted) | FieldHint | 登录后主壳（由 client/main.ts 闭包挂载）；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:193` |
| `state.comp.create-discussion.193t0` | comp | encrypted | FieldHint | 登录后主壳（由 client/main.ts 闭包挂载）；房间加密开 | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/CreateDiscussion.tsx:193` |
| `state.comp.default-parent-room-field.32i` | comp | isPending | Skeleton | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/DefaultParentRoomField.tsx:32` |
| `state.comp.default-parent-room-field.36i` | comp | !data?.room ¦¦ isError | Callout | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/DefaultParentRoomField.tsx:36` |
| `state.comp.default-parent-room-field.40d` | comp | 前述 if-ret 均不成立（default return） | TextInput | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/CreateDiscussion/DefaultParentRoomField.tsx:40` |
| `state.comp.filter-by-text.38a1` | comp | !(children) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/FilterByText.tsx:38` |
| `state.comp.filter-by-text.38a0` | comp | children | Margins | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/FilterByText.tsx:38` |
| `state.comp.fingerprint-change-modal-confirmation.27t1` | comp | !(newWorkspace) | Trans | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/FingerprintChangeModalConfirmation.tsx:27` |
| `state.comp.fingerprint-change-modal-confirmation.27t0` | comp | newWorkspace | Trans | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/FingerprintChangeModalConfirmation.tsx:27` |
| `state.comp.generic-card.26a1` | comp | !(icon) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericCard/GenericCard.tsx:26` |
| `state.comp.generic-card.26a0` | comp | icon | FramedIcon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericCard/GenericCard.tsx:26` |
| `state.comp.generic-card.30a1` | comp | !(buttons) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericCard/GenericCard.tsx:30` |
| `state.comp.generic-card.30a0` | comp | buttons | CardControls | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericCard/GenericCard.tsx:30` |
| `state.comp.generic-error.20a1` | comp | !(buttonAction) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericError/GenericError.tsx:20` |
| `state.comp.generic-error.20a0` | comp | buttonAction | StatesActions | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericError/GenericError.tsx:20` |
| `state.comp.generic-no-results.29a1` | comp | !(icon) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericNoResults/GenericNoResults.tsx:29` |
| `state.comp.generic-no-results.29a0` | comp | icon | StatesIcon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericNoResults/GenericNoResults.tsx:29` |
| `state.comp.generic-no-results.31a1` | comp | !(description) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericNoResults/GenericNoResults.tsx:31` |
| `state.comp.generic-no-results.31a0` | comp | description | StatesSubtitle | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericNoResults/GenericNoResults.tsx:31` |
| `state.comp.generic-no-results.32a1` | comp | !(buttonTitle && buttonAction) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericNoResults/GenericNoResults.tsx:32` |
| `state.comp.generic-no-results.32a0` | comp | buttonTitle && buttonAction | StatesActions | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericNoResults/GenericNoResults.tsx:32` |
| `state.comp.generic-no-results.37a1` | comp | !(linkText && linkHref) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericNoResults/GenericNoResults.tsx:37` |
| `state.comp.generic-no-results.37a0` | comp | linkText && linkHref | StatesLink | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericNoResults/GenericNoResults.tsx:37` |
| `state.comp.generic-resource-usage.43a1` | comp | !(subTitle) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericResourceUsage/GenericResourceUsage.tsx:43` |
| `state.comp.generic-resource-usage.43a0` | comp | subTitle | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericResourceUsage/GenericResourceUsage.tsx:43` |
| `state.comp.generic-upsell-modal.40a1` | comp | !(subtitle) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericUpsellModal/GenericUpsellModal.tsx:40` |
| `state.comp.generic-upsell-modal.40a0` | comp | subtitle | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericUpsellModal/GenericUpsellModal.tsx:40` |
| `state.comp.generic-upsell-modal.45a1` | comp | !(description) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericUpsellModal/GenericUpsellModal.tsx:45` |
| `state.comp.generic-upsell-modal.45a0` | comp | description | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/GenericUpsellModal/GenericUpsellModal.tsx:45` |
| `state.comp.image-gallery.137a1` | comp | !(zoomScale !== 1) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ImageGallery/ImageGallery.tsx:137` |
| `state.comp.image-gallery.137a0` | comp | zoomScale !== 1 | IconButton | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/ImageGallery/ImageGallery.tsx:137` |
| `state.comp.markdown-text.20i` | comp | content && content.length > getMarkdownParserLimit() | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/MarkdownText.tsx:20` |
| `state.comp.markdown-text.27d` | comp | 前述 if-ret 均不成立（default return） | MarkdownTextInner | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/MarkdownText.tsx:27` |
| `state.comp.markdown-text-inner.202t1` | comp | !(__html) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/MarkdownTextInner.tsx:202` |
| `state.comp.markdown-text-inner.202t0` | comp | __html | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/MarkdownTextInner.tsx:202` |
| `state.comp.room-auto-complete-multiple.41i` | comp | result.isPending | Skeleton | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/components/RoomAutoCompleteMultiple/RoomAutoCompleteMultiple.tsx:41` |
| `state.comp.room-auto-complete-multiple.45d` | comp | 前述 if-ret 均不成立（default return） | AutoComplete | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/RoomAutoCompleteMultiple/RoomAutoCompleteMultiple.tsx:45` |
| `state.comp.omnichannel-app-source-room-icon.18i` | comp | !value | Icon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/RoomIcon/OmnichannelRoomIcon/OmnichannelAppSourceRoomIcon.tsx:18` |
| `state.comp.omnichannel-app-source-room-icon.22d` | comp | 前述 if-ret 均不成立（default return） | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/RoomIcon/OmnichannelRoomIcon/OmnichannelAppSourceRoomIcon.tsx:22` |
| `state.comp.omnichannel-room-icon.28i` | comp | isOmnichannelSourceFromApp(source) | OmnichannelAppSourceRoomIcon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/RoomIcon/OmnichannelRoomIcon/OmnichannelRoomIcon.tsx:28` |
| `state.comp.omnichannel-room-icon.32d` | comp | 前述 if-ret 均不成立（default return） | OmnichannelCoreSourceRoomIcon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/RoomIcon/OmnichannelRoomIcon/OmnichannelRoomIcon.tsx:32` |
| `state.comp.room-icon.23i` | comp | isIncomingCall | Icon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/RoomIcon/RoomIcon.tsx:23` |
| `state.comp.room-icon.27i` | comp | isOmnichannelRoom(room) | OmnichannelRoomIcon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/RoomIcon/RoomIcon.tsx:27` |
| `state.comp.room-icon.35i` | comp | !iconPropsOrReactNode | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/RoomIcon/RoomIcon.tsx:35` |
| `state.comp.room-icon.39d` | comp | 前述 if-ret 均不成立（default return） | Icon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/RoomIcon/RoomIcon.tsx:39` |
| `state.comp.header.16a1` | comp | !((title ¦¦ onClose)) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/Header.tsx:16` |
| `state.comp.header.16a0` | comp | (title ¦¦ onClose) | Box | 登录后主壳（由 client/main.ts 闭包挂载）；shot:account-security.png；Account 侧栏标题区 | [实测] | （无） | `apps/meteor/client/components/Sidebar/Header.tsx:16` |
| `state.comp.header.18a1` | comp | !(title) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/Header.tsx:18` |
| `state.comp.header.18a0` | comp | title | Box | 登录后主壳（由 client/main.ts 闭包挂载）；shot:account-security.png；Account 标题 | [实测] | （无） | `apps/meteor/client/components/Sidebar/Header.tsx:18` |
| `state.comp.header.23a1` | comp | !(onClose) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/Header.tsx:23` |
| `state.comp.header.23a0` | comp | onClose | IconButton | 登录后主壳（由 client/main.ts 闭包挂载）；shot:account-security.png；Account Close | [实测] | （无） | `apps/meteor/client/components/Sidebar/Header.tsx:23` |
| `state.comp.list-item.25a1` | comp | !(icon) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/ListItem.tsx:25` |
| `state.comp.list-item.25a0` | comp | icon | OptionIcon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/ListItem.tsx:25` |
| `state.comp.list-item.26a1` | comp | !(gap) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/ListItem.tsx:26` |
| `state.comp.list-item.26a0` | comp | gap | OptionColumn | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/ListItem.tsx:26` |
| `state.comp.list-item.28a1` | comp | !(input) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/ListItem.tsx:28` |
| `state.comp.list-item.28a0` | comp | input | OptionInput | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/ListItem.tsx:28` |
| `state.comp.list-item.29a1` | comp | !(children) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/ListItem.tsx:29` |
| `state.comp.list-item.29a0` | comp | children | OptionColumn | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/ListItem.tsx:29` |
| `state.comp.sidebar-items-assembler.21t1` | comp | !(isSidebarItem(props)) | Divider | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/SidebarItemsAssembler.tsx:21` |
| `state.comp.sidebar-items-assembler.21t0` | comp | isSidebarItem(props) | SidebarNavigationItem | 登录后主壳（由 client/main.ts 闭包挂载）；shot:account-security.png；Account 导航项 | [实测] | （无） | `apps/meteor/client/components/Sidebar/SidebarItemsAssembler.tsx:21` |
| `state.comp.sidebar-navigation-item.33i` | comp | permissionGranted === false ¦¦ (typeof permissionGranted === 'function' && !permissionGranted()) | null | 登录后主壳（由 client/main.ts 闭包挂载）；切换对应权限 | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/SidebarNavigationItem.tsx:33` |
| `state.comp.sidebar-navigation-item.37d` | comp | 前述 if-ret 均不成立（default return） | SidebarGenericItem | 登录后主壳（由 client/main.ts 闭包挂载）；shot:account-security.png；Profile/Preferences/Security 等项 | [实测] | （无） | `apps/meteor/client/components/Sidebar/SidebarNavigationItem.tsx:37` |
| `state.comp.sidebar-navigation-item.39a1` | comp | !(icon) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/SidebarNavigationItem.tsx:39` |
| `state.comp.sidebar-navigation-item.39a0` | comp | icon | Icon | 登录后主壳（由 client/main.ts 闭包挂载）；shot:account-security.png；导航项图标 | [实测] | （无） | `apps/meteor/client/components/Sidebar/SidebarNavigationItem.tsx:39` |
| `state.comp.sidebar-navigation-item.50a1` | comp | !(tag) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/SidebarNavigationItem.tsx:50` |
| `state.comp.sidebar-navigation-item.50a0` | comp | tag | Tag | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/SidebarNavigationItem.tsx:50` |
| `state.comp.sidebar-navigation-item.52t1` | comp | !(Badge) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/SidebarNavigationItem.tsx:52` |
| `state.comp.sidebar-navigation-item.52t0` | comp | Badge | Badge | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/Sidebar/SidebarNavigationItem.tsx:52` |
| `state.comp.sidebar-toggler-button.19a1` | comp | !(badge) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/SidebarToggler/SidebarTogglerButton.tsx:19` |
| `state.comp.sidebar-toggler-button.19a0` | comp | badge | SidebarTogglerBadge | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/SidebarToggler/SidebarTogglerButton.tsx:19` |
| `state.comp.two-factor-email-modal.122a1` | comp | !(errors.code) | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/TwoFactorModal/TwoFactorEmailModal.tsx:122` |
| `state.comp.two-factor-email-modal.122a0` | comp | errors.code | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/TwoFactorModal/TwoFactorEmailModal.tsx:122` |
| `state.comp.two-factor-modal.34i` | comp | props.method === Method.TOTP | TwoFactorTotp | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/TwoFactorModal/TwoFactorModal.tsx:34` |
| `state.comp.two-factor-modal.38i` | comp | props.method === Method.EMAIL | TwoFactorEmail | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/TwoFactorModal/TwoFactorModal.tsx:38` |
| `state.comp.two-factor-modal.44i` | comp | props.method === Method.PASSWORD | TwoFactorPassword | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/TwoFactorModal/TwoFactorModal.tsx:44` |
| `state.comp.two-factor-password-modal.89a1` | comp | !(errors.password) | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/TwoFactorModal/TwoFactorPasswordModal.tsx:89` |
| `state.comp.two-factor-password-modal.89a0` | comp | errors.password | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/TwoFactorModal/TwoFactorPasswordModal.tsx:89` |
| `state.comp.two-factor-totp-modal.94a1` | comp | !(errors.code) | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/TwoFactorModal/TwoFactorTotpModal.tsx:94` |
| `state.comp.two-factor-totp-modal.94a0` | comp | errors.code | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/TwoFactorModal/TwoFactorTotpModal.tsx:94` |
| `state.comp.user-auto-complete-multiple-option.29a1` | comp | !(!_federated) | null | 登录后主壳（由 client/main.ts 闭包挂载）；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/components/UserAutoCompleteMultiple/UserAutoCompleteMultipleOption.tsx:29` |
| `state.comp.user-auto-complete-multiple-option.29a0` | comp | !_federated | OptionDescription | 登录后主壳（由 client/main.ts 闭包挂载）；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/components/UserAutoCompleteMultiple/UserAutoCompleteMultipleOption.tsx:29` |
| `state.comp.user-avatar-chip.16t1` | comp | !(federated) | UserAvatar | 登录后主壳（由 client/main.ts 闭包挂载）；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/components/UserAutoCompleteMultiple/UserAvatarChip.tsx:16` |
| `state.comp.user-avatar-chip.16t0` | comp | federated | Icon | 登录后主壳（由 client/main.ts 闭包挂载）；联邦房间 | [待渲染实测] | （无） | `apps/meteor/client/components/UserAutoCompleteMultiple/UserAvatarChip.tsx:16` |
| `state.comp.user-card.54a1` | comp | !(username) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:54` |
| `state.comp.user-card.54a0` | comp | username | UserAvatar | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:54` |
| `state.comp.user-card.62a1` | comp | !(nickname) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:62` |
| `state.comp.user-card.62a0` | comp | nickname | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:62` |
| `state.comp.user-card.77a1` | comp | !(customStatus) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:77` |
| `state.comp.user-card.77a0` | comp | customStatus | UserCardInfo | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:77` |
| `state.comp.user-card.88a1` | comp | !(bio) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:88` |
| `state.comp.user-card.88a0` | comp | bio | UserCardInfo | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:88` |
| `state.comp.user-card.93a1` | comp | !(onOpenUserInfo && !isLayoutEmbedded) | null | 登录后主壳（由 client/main.ts 闭包挂载）；embedded layout | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:93` |
| `state.comp.user-card.93a0` | comp | onOpenUserInfo && !isLayoutEmbedded | div | 登录后主壳（由 client/main.ts 闭包挂载）；embedded layout | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:93` |
| `state.comp.user-card.101a1` | comp | !(onClose) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:101` |
| `state.comp.user-card.101a0` | comp | onClose | IconButton | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserCard/UserCard.tsx:101` |
| `state.comp.user-info.92a1` | comp | !(username) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:92` |
| `state.comp.user-info.92a0` | comp | username | InfoPanelAvatar | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:92` |
| `state.comp.user-info.98a1` | comp | !(actions) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:98` |
| `state.comp.user-info.98a0` | comp | actions | InfoPanelActionGroup | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:98` |
| `state.comp.user-info.101a1` | comp | !(userDisplayName) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:101` |
| `state.comp.user-info.101a0` | comp | userDisplayName | InfoPanelTitle | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:101` |
| `state.comp.user-info.103a1` | comp | !(customStatus) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:103` |
| `state.comp.user-info.103a0` | comp | customStatus | InfoPanelText | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:103` |
| `state.comp.user-info.107a1` | comp | !(reason) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:107` |
| `state.comp.user-info.107a0` | comp | reason | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:107` |
| `state.comp.user-info.114a1` | comp | !(nickname) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:114` |
| `state.comp.user-info.114a0` | comp | nickname | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:114` |
| `state.comp.user-info.121a1` | comp | !(roles?.length !== 0) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:121` |
| `state.comp.user-info.121a0` | comp | roles?.length !== 0 | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:121` |
| `state.comp.user-info.128a1` | comp | !(username && username !== name) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:128` |
| `state.comp.user-info.128a0` | comp | username && username !== name | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:128` |
| `state.comp.user-info.139a1` | comp | !(utcOffset && Number.isInteger(utcOffset)) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:139` |
| `state.comp.user-info.139a0` | comp | utcOffset && Number.isInteger(utcOffset) | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:139` |
| `state.comp.user-info.148a1` | comp | !(bio) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:148` |
| `state.comp.user-info.148a0` | comp | bio | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:148` |
| `state.comp.user-info.157a1` | comp | !(Number.isInteger(utcOffset) && canViewAllInfo) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:157` |
| `state.comp.user-info.157a0` | comp | Number.isInteger(utcOffset) && canViewAllInfo | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:157` |
| `state.comp.user-info.164a1` | comp | !(phone) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:164` |
| `state.comp.user-info.164a0` | comp | phone | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:164` |
| `state.comp.user-info.175a1` | comp | !(email) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:175` |
| `state.comp.user-info.175a0` | comp | email | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:175` |
| `state.comp.user-info.189a1` | comp | !(freeSwitchExtension) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:189` |
| `state.comp.user-info.189a0` | comp | freeSwitchExtension | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:189` |
| `state.comp.user-info.196a1` | comp | !(abacAttributes && abacAttributes.length > 0) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:196` |
| `state.comp.user-info.196a0` | comp | abacAttributes && abacAttributes.length > 0 | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:196` |
| `state.comp.user-info.204a1` | comp | !(customField?.value) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:204` |
| `state.comp.user-info.204a0` | comp | customField?.value | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:204` |
| `state.comp.user-info.214a1` | comp | !(invitationDate) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:214` |
| `state.comp.user-info.214a0` | comp | invitationDate | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:214` |
| `state.comp.user-info.221a1` | comp | !(createdAt) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:221` |
| `state.comp.user-info.221a0` | comp | createdAt | InfoPanelField | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfo.tsx:221` |
| `state.comp.user-info-action.10i` | comp | !label && icon && title | IconButton | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfoAction.tsx:10` |
| `state.comp.user-info-action.14d` | comp | 前述 if-ret 均不成立（default return） | Button | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserInfo/UserInfoAction.tsx:14` |
| `state.comp.user-status-text.30i` | comp | !headline && !expirationText | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserStatusText/UserStatusText.tsx:30` |
| `state.comp.user-status-text.34d` | comp | 前述 if-ret 均不成立（default return） | <> | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserStatusText/UserStatusText.tsx:34` |
| `state.comp.user-status-text.36a1` | comp | !(headline) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserStatusText/UserStatusText.tsx:36` |
| `state.comp.user-status-text.36a0` | comp | headline | MarkdownText | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserStatusText/UserStatusText.tsx:36` |
| `state.comp.user-status-text.37a1` | comp | !(expirationText) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserStatusText/UserStatusText.tsx:37` |
| `state.comp.user-status-text.37a0` | comp | expirationText | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/UserStatusText/UserStatusText.tsx:37` |
| `state.comp.user-avatar-editor.152a1` | comp | !(avatarUrlError) | null | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/avatar/UserAvatarEditor/UserAvatarEditor.tsx:152` |
| `state.comp.user-avatar-editor.152a0` | comp | avatarUrlError | FieldError | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/avatar/UserAvatarEditor/UserAvatarEditor.tsx:152` |
| `state.comp.user-avatar-suggestions.21a1` | comp | !(suggestion.blob) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/avatar/UserAvatarEditor/UserAvatarSuggestions.tsx:21` |
| `state.comp.user-avatar-suggestions.21a0` | comp | suggestion.blob | Button | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/avatar/UserAvatarEditor/UserAvatarSuggestions.tsx:21` |
| `state.comp.connection-status-bar.39i` | comp | connected | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/connectionStatus/ConnectionStatusBar.tsx:39` |
| `state.comp.connection-status-bar.43d` | comp | 前述 if-ret 均不成立（default return） | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/connectionStatus/ConnectionStatusBar.tsx:43` |
| `state.comp.connection-status-bar.59a1` | comp | !(['waiting', 'failed', 'offline'].includes(status)) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/connectionStatus/ConnectionStatusBar.tsx:59` |
| `state.comp.connection-status-bar.59a0` | comp | ['waiting', 'failed', 'offline'].includes(status) | span | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/connectionStatus/ConnectionStatusBar.tsx:59` |
| `state.comp.growth.12i` | comp | children === 0 | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/dataView/Growth.tsx:12` |
| `state.comp.growth.16d` | comp | 前述 if-ret 均不成立（default return） | Box | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/dataView/Growth.tsx:16` |
| `state.comp.growth.18t1` | comp | !(children < 0) | PositiveGrowthSymbol | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/dataView/Growth.tsx:18` |
| `state.comp.growth.18t0` | comp | children < 0 | NegativeGrowthSymbol | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/dataView/Growth.tsx:18` |
| `state.comp.device-management-table.41i` | comp | isError | Box | 登录后主壳（由 client/main.ts 闭包挂载）；让该查询/mutation 失败 | [待渲染实测] | （无） | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:41` |
| `state.comp.device-management-table.57d` | comp | 前述 if-ret 均不成立（default return） | <> | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:57` |
| `state.comp.device-management-table.59a1` | comp | !(data?.sessions.length === 0 && isSuccess) | null | 登录后主壳（由 client/main.ts 闭包挂载）；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:59` |
| `state.comp.device-management-table.59a0` | comp | data?.sessions.length === 0 && isSuccess | GenericNoResults | 登录后主壳（由 client/main.ts 闭包挂载）；空列表/无数据 | [待渲染实测] | （无） | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:59` |
| `state.comp.device-management-table.61a1` | comp | !(data?.sessions && data.sessions.length > 0 && headers) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:61` |
| `state.comp.device-management-table.61a0` | comp | data?.sessions && data.sessions.length > 0 && headers | GenericTableHeader | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:61` |
| `state.comp.device-management-table.63a1` | comp | !(isPending) | null | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:63` |
| `state.comp.device-management-table.63a0` | comp | isPending | GenericTableLoadingTable | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:63` |
| `state.comp.device-management-table.67a1` | comp | !(isSuccess) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:67` |
| `state.comp.device-management-table.67a0` | comp | isSuccess | Pagination | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/components/deviceManagement/DeviceManagementTable/DeviceManagementTable.tsx:67` |

### portal（4）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.portal.sidebar-portal.11i` | portal | !sidebarRoot | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/portals/SidebarPortal/SidebarPortal.tsx:11` |
| `state.portal.sidebar-portal.15d` | portal | 前述 if-ret 均不成立（default return） | <> | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/portals/SidebarPortal/SidebarPortal.tsx:15` |
| `state.portal.sidebar-portal-v2.23i` | portal | !sidebarRoot | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/portals/SidebarPortal/SidebarPortalV2.tsx:23` |
| `state.portal.sidebar-portal-v2.27d` | portal | 前述 if-ret 均不成立（default return） | <> | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/portals/SidebarPortal/SidebarPortalV2.tsx:27` |

### uiclient（71）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.uiclient.custom-fields-form.69i` | uiclient | !Component | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/CustomFieldsForm.tsx:69` |
| `state.uiclient.custom-fields-form.73d` | uiclient | 前述 if-ret 均不成立（default return） | Controller | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/CustomFieldsForm.tsx:73` |
| `state.uiclient.custom-fields-form.95t1` | uiclient | !(errorMessage) | null | 被 meteor 客户端宿主挂载；让该查询/mutation 失败 | [待渲染实测] | （无） | `packages/ui-client/src/components/CustomFieldsForm.tsx:95` |
| `state.uiclient.custom-fields-form.95t0` | uiclient | errorMessage | FieldError | 被 meteor 客户端宿主挂载；让该查询/mutation 失败 | [待渲染实测] | （无） | `packages/ui-client/src/components/CustomFieldsForm.tsx:95` |
| `state.uiclient.feature-preview.22s` | uiclient | Suspense fallback（子树未 ready） | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/FeaturePreview/FeaturePreview.tsx:22` |
| `state.uiclient.feature-preview-badge.10i` | uiclient | !unseenFeatures | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/FeaturePreview/FeaturePreviewBadge.tsx:10` |
| `state.uiclient.feature-preview-badge.14d` | uiclient | 前述 if-ret 均不成立（default return） | Badge | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/FeaturePreview/FeaturePreviewBadge.tsx:14` |
| `state.uiclient.generic-menu.62a1` | uiclient | !(sections) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenu.tsx:62` |
| `state.uiclient.generic-menu.62a0` | uiclient | sections | Menu | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenu.tsx:62` |
| `state.uiclient.generic-menu.87a1` | uiclient | !(items) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenu.tsx:87` |
| `state.uiclient.generic-menu.87a0` | uiclient | items | Menu | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenu.tsx:87` |
| `state.uiclient.generic-menu-item.21a1` | uiclient | !(gap) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenuItem.tsx:21` |
| `state.uiclient.generic-menu-item.21a0` | uiclient | gap | MenuItemColumn | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenuItem.tsx:21` |
| `state.uiclient.generic-menu-item.22a1` | uiclient | !(icon) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenuItem.tsx:22` |
| `state.uiclient.generic-menu-item.22a0` | uiclient | icon | MenuItemIcon | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenuItem.tsx:22` |
| `state.uiclient.generic-menu-item.23a1` | uiclient | !(status) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenuItem.tsx:23` |
| `state.uiclient.generic-menu-item.23a0` | uiclient | status | MenuItemColumn | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenuItem.tsx:23` |
| `state.uiclient.generic-menu-item.24a1` | uiclient | !(content) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenuItem.tsx:24` |
| `state.uiclient.generic-menu-item.24a0` | uiclient | content | MenuItemContent | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenuItem.tsx:24` |
| `state.uiclient.generic-menu-item.25a1` | uiclient | !(addon) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenuItem.tsx:25` |
| `state.uiclient.generic-menu-item.25a0` | uiclient | addon | MenuItemInput | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericMenu/GenericMenuItem.tsx:25` |
| `state.uiclient.generic-table-header-cell.27a1` | uiclient | !(sort) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericTable/GenericTableHeaderCell.tsx:27` |
| `state.uiclient.generic-table-header-cell.27a0` | uiclient | sort | SortIcon | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/GenericTable/GenericTableHeaderCell.tsx:27` |
| `state.uiclient.header-icon.8a1` | uiclient | !(icon) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Header/HeaderIcon.tsx:8` |
| `state.uiclient.header-icon.8a0` | uiclient | icon | Box | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Header/HeaderIcon.tsx:8` |
| `state.uiclient.header-state.15t1` | uiclient | !(props.onClick) | Icon | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Header/HeaderState.tsx:15` |
| `state.uiclient.header-state.15t0` | uiclient | props.onClick | IconButton | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Header/HeaderState.tsx:15` |
| `state.uiclient.header-tag-icon.14t1` | uiclient | !(isValidElement<any>(icon)) | Icon | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Header/HeaderTag/HeaderTagIcon.tsx:14` |
| `state.uiclient.header-tag-icon.14t0` | uiclient | isValidElement<any>(icon) | Box | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Header/HeaderTag/HeaderTagIcon.tsx:14` |
| `state.uiclient.info-panel-label.9a1` | uiclient | !(title) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/InfoPanel/InfoPanelLabel.tsx:9` |
| `state.uiclient.info-panel-label.9a0` | uiclient | title | Icon | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/InfoPanel/InfoPanelLabel.tsx:9` |
| `state.uiclient.generic-modal.65i` | uiclient | icon === null ¦¦ iconMap[variant] === undefined | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:65` |
| `state.uiclient.generic-modal.69i` | uiclient | icon === undefined | ModalIcon | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:69` |
| `state.uiclient.generic-modal.73i` | uiclient | typeof icon === 'string' | ModalIcon | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:73` |
| `state.uiclient.generic-modal.141a1` | uiclient | !(tagline) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:141` |
| `state.uiclient.generic-modal.141a0` | uiclient | tagline | ModalTagline | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:141` |
| `state.uiclient.generic-modal.144a1` | uiclient | !(onClose) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:144` |
| `state.uiclient.generic-modal.144a0` | uiclient | onClose | ModalClose | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:144` |
| `state.uiclient.generic-modal.149a1` | uiclient | !(annotation && !dontAskAgain) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:149` |
| `state.uiclient.generic-modal.149a0` | uiclient | annotation && !dontAskAgain | ModalFooterAnnotation | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:149` |
| `state.uiclient.generic-modal.151a1` | uiclient | !(onCancel) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:151` |
| `state.uiclient.generic-modal.151a0` | uiclient | onCancel | Button | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:151` |
| `state.uiclient.generic-modal.156a1` | uiclient | !(wrapperFunction) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:156` |
| `state.uiclient.generic-modal.156a0` | uiclient | wrapperFunction | Button | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:156` |
| `state.uiclient.generic-modal.161a1` | uiclient | !(!wrapperFunction && onConfirm) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:161` |
| `state.uiclient.generic-modal.161a0` | uiclient | !wrapperFunction && onConfirm | Button | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/GenericModal/GenericModal.tsx:161` |
| `state.uiclient.modal-region.17i` | uiclient | !currentModal | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/ModalRegion.tsx:17` |
| `state.uiclient.modal-region.21d` | uiclient | 前述 if-ret 均不成立（default return） | ModalPortal | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/ModalRegion.tsx:21` |
| `state.uiclient.modal-region.24s` | uiclient | Suspense fallback（子树未 ready） | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Modal/ModalRegion.tsx:24` |
| `state.uiclient.multi-select-custom.116a1` | uiclient | !(collapsed) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/MultiSelectCustom/MultiSelectCustom.tsx:116` |
| `state.uiclient.multi-select-custom.116a0` | uiclient | collapsed | MultiSelectCustomListWrapper | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/MultiSelectCustom/MultiSelectCustom.tsx:116` |
| `state.uiclient.multi-select-custom-list.50a1` | uiclient | !(searchBarText) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/MultiSelectCustom/MultiSelectCustomList.tsx:50` |
| `state.uiclient.multi-select-custom-list.50a0` | uiclient | searchBarText | Box | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/MultiSelectCustom/MultiSelectCustomList.tsx:50` |
| `state.uiclient.multi-select-custom-list.64t1` | uiclient | !(option.isGroupTitle ¦¦ !option.hasOwnProperty('checked')) | Option | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/MultiSelectCustom/MultiSelectCustomList.tsx:64` |
| `state.uiclient.multi-select-custom-list.64t0` | uiclient | option.isGroupTitle ¦¦ !option.hasOwnProperty('checked') | Box | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/MultiSelectCustom/MultiSelectCustomList.tsx:64` |
| `state.uiclient.multi-select-custom-list.70a1` | uiclient | !(option.icon) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/MultiSelectCustom/MultiSelectCustomList.tsx:70` |
| `state.uiclient.multi-select-custom-list.70a0` | uiclient | option.icon | OptionIcon | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/MultiSelectCustom/MultiSelectCustomList.tsx:70` |
| `state.uiclient.page-header-no-shadow.34t1` | uiclient | !(sidebar.shouldToggle && isEmbedded) | null | 被 meteor 客户端宿主挂载；embedded layout | [待渲染实测] | （无） | `packages/ui-client/src/components/Page/PageHeaderNoShadow.tsx:34` |
| `state.uiclient.page-header-no-shadow.34t0` | uiclient | sidebar.shouldToggle && isEmbedded | HeaderToolbar | 被 meteor 客户端宿主挂载；embedded layout | [待渲染实测] | （无） | `packages/ui-client/src/components/Page/PageHeaderNoShadow.tsx:34` |
| `state.uiclient.page-header-no-shadow.39a1` | uiclient | !(onClickBack) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Page/PageHeaderNoShadow.tsx:39` |
| `state.uiclient.page-header-no-shadow.39a0` | uiclient | onClickBack | IconButton | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Page/PageHeaderNoShadow.tsx:39` |
| `state.uiclient.password-verifier-list.18i` | uiclient | !validations?.length | span | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/PasswordVerifier/PasswordVerifierList.tsx:18` |
| `state.uiclient.password-verifier-list.22d` | uiclient | 前述 if-ret 均不成立（default return） | <> | 被 meteor 客户端宿主挂载；shot:account-security.png；Password must have 列表 | [实测] | （无） | `packages/ui-client/src/components/PasswordVerifier/PasswordVerifierList.tsx:22` |
| `state.uiclient.sidebar-toggler-button.18a1` | uiclient | !(badge) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/SidebarToggler/SidebarTogglerButton.tsx:18` |
| `state.uiclient.sidebar-toggler-button.18a0` | uiclient | badge | SidebarTogglerBadge | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/SidebarToggler/SidebarTogglerButton.tsx:18` |
| `state.uiclient.wizard-actions.11t1` | uiclient | !(annotation) | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Wizard/WizardActions.tsx:11` |
| `state.uiclient.wizard-actions.11t0` | uiclient | annotation | Box | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/components/Wizard/WizardActions.tsx:11` |
| `state.uiclient.setup-wizard-route.16i` | uiclient | locked | null | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/views/setupWizard/SetupWizardRoute.tsx:16` |
| `state.uiclient.setup-wizard-route.20d` | uiclient | 前述 if-ret 均不成立（default return） | SetupWizardProvider | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/views/setupWizard/SetupWizardRoute.tsx:20` |
| `state.uiclient.register-server-step.79t1` | uiclient | !(serverOption === SERVER_OPTIONS.OFFLINE) | RegisterServerPage | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/views/setupWizard/steps/RegisterServerStep.tsx:79` |
| `state.uiclient.register-server-step.79t0` | uiclient | serverOption === SERVER_OPTIONS.OFFLINE | RegisterOfflinePage | 被 meteor 客户端宿主挂载 | [待渲染实测] | （无） | `packages/ui-client/src/views/setupWizard/steps/RegisterServerStep.tsx:79` |

### avatar（2）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.avatar.base-avatar.23i` | avatar | unloaded && url === prevUrl | Skeleton | 任意展示头像的表面 | [待渲染实测] | （无） | `packages/ui-avatar/src/components/BaseAvatar.tsx:23` |
| `state.avatar.base-avatar.27d` | avatar | 前述 if-ret 均不成立（default return） | Avatar | 任意展示头像的表面 | [待渲染实测] | （无） | `packages/ui-avatar/src/components/BaseAvatar.tsx:27` |

### lib（4）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.lib.normalize-thread-message.34i` | lib | !tokens | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/lib/normalizeThreadMessage.tsx:34` |
| `state.lib.normalize-thread-message.48i` | lib | attachment?.description | <> | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/lib/normalizeThreadMessage.tsx:48` |
| `state.lib.normalize-thread-message.52i` | lib | attachment?.title | <> | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/lib/normalizeThreadMessage.tsx:52` |
| `state.lib.normalize-thread-message.61d` | lib | 前述 if-ret 均不成立（default return） | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/lib/normalizeThreadMessage.tsx:61` |

### appsui（12）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.appsui.game-center.28i` | appsui | !openedGame | GameCenterList | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenter.tsx:28` |
| `state.appsui.game-center.40d` | appsui | 前述 if-ret 均不成立（default return） | GameCenterContainer | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenter.tsx:40` |
| `state.appsui.game-center-container.26a1` | appsui | !(handleBack) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenterContainer.tsx:26` |
| `state.appsui.game-center-container.26a0` | appsui | handleBack | ContextualbarBack | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenterContainer.tsx:26` |
| `state.appsui.game-center-container.30a1` | appsui | !(handleClose) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenterContainer.tsx:30` |
| `state.appsui.game-center-container.30a0` | appsui | handleClose | ContextualbarClose | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenterContainer.tsx:30` |
| `state.appsui.game-center-list.38i` | appsui | isLoading | ContextualbarSkeleton | 登录后主壳（由 client/main.ts 闭包挂载）；等查询 in-flight | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenterList.tsx:38` |
| `state.appsui.game-center-list.42d` | appsui | 前述 if-ret 均不成立（default return） | ContextualbarDialog | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenterList.tsx:42` |
| `state.appsui.game-center-list.46a1` | appsui | !(handleClose) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenterList.tsx:46` |
| `state.appsui.game-center-list.46a0` | appsui | handleClose | ContextualbarClose | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenterList.tsx:46` |
| `state.appsui.game-center-list.49a1` | appsui | !(games) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenterList.tsx:49` |
| `state.appsui.game-center-list.49a0` | appsui | games | div | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/apps/gameCenter/GameCenterList.tsx:49` |

### other（17）

| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `state.other.banner-region.14i` | other | !payload | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/banners/BannerRegion.tsx:14` |
| `state.other.banner-region.18i` | other | banners.isLegacyPayload(payload) | LegacyBanner | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/banners/BannerRegion.tsx:18` |
| `state.other.banner-region.22d` | other | 前述 if-ret 均不成立（default return） | UiKitBanner | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/banners/BannerRegion.tsx:22` |
| `state.other.legacy-banner.54a1` | other | !(html) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/banners/LegacyBanner.tsx:54` |
| `state.other.legacy-banner.54a0` | other | html | div | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/banners/LegacyBanner.tsx:54` |
| `state.other.ui-kit-banner.27i` | other | view.icon | Icon | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/banners/UiKitBanner.tsx:27` |
| `state.other.ui-kit-banner.31d` | other | 前述 if-ret 均不成立（default return） | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/banners/UiKitBanner.tsx:31` |
| `state.other.ui-kit-banner.55i` | other | view.title && typeof view.title !== 'string' | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/banners/UiKitBanner.tsx:55` |
| `state.other.ui-kit-banner.58d` | other | 前述 if-ret 均不成立（default return） | Banner | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/banners/UiKitBanner.tsx:58` |
| `state.other.cloud-announcements-region.49i` | other | !isSuccess | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/cloud/CloudAnnouncementsRegion.tsx:49` |
| `state.other.cloud-announcements-region.53d` | other | 前述 if-ret 均不成立（default return） | <> | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/cloud/CloudAnnouncementsRegion.tsx:53` |
| `state.other.modal-block.180t1` | other | !(view.showIcon) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/modal/uikit/ModalBlock.tsx:180` |
| `state.other.modal-block.180t0` | other | view.showIcon | ModalThumb | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/modal/uikit/ModalBlock.tsx:180` |
| `state.other.modal-block.191a1` | other | !(view.close) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/modal/uikit/ModalBlock.tsx:191` |
| `state.other.modal-block.191a0` | other | view.close | Button | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/modal/uikit/ModalBlock.tsx:191` |
| `state.other.modal-block.196a1` | other | !(view.submit) | null | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/modal/uikit/ModalBlock.tsx:196` |
| `state.other.modal-block.196a0` | other | view.submit | Button | 登录后主壳（由 client/main.ts 闭包挂载） | [待渲染实测] | （无） | `apps/meteor/client/views/modal/uikit/ModalBlock.tsx:196` |

## 7. 闭合判据（拒收条件：数字对不上）

在冻结提交上重跑。不要用 develop。

```bash
git rev-parse HEAD
# expect e519470d35b6caf5b228d81aef41c86aab3051f4

python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --verify
# TARGET_FILES 3817
# CLASS_SUM 3817
# STATES 4221
# UNIQUE_IDS 4221
# VERIFY_OK 3817 4221

rg -c '^\| `state\.' docs/qa/pm-feature-atlas/round-2/08-states.md
# expect 4221

rg -o '^\| `state\.[^`]+' docs/qa/pm-feature-atlas/round-2/08-states.md | sort | uniq | wc -l
# expect 4221
```

文件闭合（无漏文件）：

```bash
python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --files | wc -l
# expect 3817

python3 - <<'PY'
import importlib.util, subprocess
spec = importlib.util.spec_from_file_location('e', 'docs/qa/pm-feature-atlas/round-2/export-08-states.py')
e = importlib.util.module_from_spec(spec)
spec.loader.exec_module(e)
files = {e.rel(p) for p in e.target_files()}
listed = {
    line.split('\t', 1)[1]
    for line in subprocess.check_output(
        ['python3', 'docs/qa/pm-feature-atlas/round-2/export-08-states.py', '--files'],
        text=True,
    ).splitlines()
    if '\t' in line
}
print('SYMDIFF', sorted(files ^ listed)[:10], 'len', len(files ^ listed))
print('COUNT', len(files), len(listed))
PY
# expect SYMDIFF [] ; COUNT 3817 3817
```

泄漏点必须缺席：

```bash
rg -n 'useSearchItems\.ts:156|useSearchItems\.ts:21|useAISearchRooms\.ts:34|useFingerprintChange\.tsx:65|useQuickActions\.tsx:268|useQuickActions\.tsx:279|useQuickActions\.tsx:289|useQuickActions\.tsx:295|useRoomList\.ts:81|useRoomList\.ts:167' \
  docs/qa/pm-feature-atlas/round-2/08-states.md
# expect 0 matches

# 表体不得出现 .ts:line（§1 提到 exporter 路径除外）
rg '^\| `state\.' docs/qa/pm-feature-atlas/round-2/08-states.md | rg '\.ts:[0-9]+' || true
# expect 0 matches

# 条件列不得残留 JSX 的 leading >
rg '^\| `state\.' docs/qa/pm-feature-atlas/round-2/08-states.md | rg '\| > ' || true
# expect 0 matches

# C''：toolbar/config hook 不得进表
rg '^\| `state\.' docs/qa/pm-feature-atlas/round-2/08-states.md | rg 'useNewDiscussionMessageAction|usePinMessageAction|useReadReceiptsDetailsAction|useReportMessageAction|useShowMessageReactionsAction|useWebDAVMessageAction|useAvatarTemplate|useRoomIcon|useShowSettingAlerts|useRoomLeave|useExportMessagesAsPDFMutation' || true
# expect 0 matches

# A'：render 不得是 JS 内置 / 数据常量
rg '^\| `state\.' docs/qa/pm-feature-atlas/round-2/08-states.md | rg '\| (Boolean\|Array\|String\|Number\|Object\|ROOM_INTIAL_VALUE) \|' || true
# expect 0 matches
```

树级证明：

```bash
rg --files apps/meteor/ee/client 2>&1 | head
# expect: No such file or directory / 0 files

find apps/meteor/app -type d -name client | wc -l
# expect 30
```

## 8. 排除与非本卷

- 不扫 develop，不做 freeze-vs-develop diff（那是 vol 14）。
- 不扫 `apps/meteor/server`、`ee/server`、`ee/apps`（无 client UI）。
- spec/stories 已分类，不抽 state。
- setting/permission 闭集是 vol 6/7；本卷只在「关联」列回指字面量。
- 只能把已截图行升级为 `[实测]`，不能把未点击行改成不可达来清零。本卷不是 live-closed。
- 本卷没有功能总数。
