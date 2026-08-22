#!/usr/bin/env python3
"""Round 2 / Vol.8 — deterministic UI-state extractor (freeze e519470).

Closed-set rule: each conditional-render branch = one state.
Replay: python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --count
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[4]
if not (WORKSPACE / "apps" / "meteor").exists():
    WORKSPACE = Path.cwd()

SHA = "e519470d35b6caf5b228d81aef41c86aab3051f4"

EXTS = {".ts", ".tsx", ".js", ".jsx"}
SKIP_DIR = {"node_modules", "dist", ".turbo", "coverage", ".git"}

AND_RE = re.compile(r"&&\s*(?:\(|<)")
TERN_RE = re.compile(r"(?<!\?)\?\s*(?:\(|<)")
IF_LINE_RE = re.compile(r"^(\s*)if\s*\(")
RETURN_JSX_RE = re.compile(r"\breturn\s+(null|\(|<)")
SUSPENSE_RE = re.compile(r"<Suspense\b[^>]*\bfallback\s*=")
COMMENT_LINE_RE = re.compile(r"^\s*(//|/\*|\*| \*)")

IMPORT_RE = re.compile(
    r"""(?:import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?|export\s+(?:type\s+)?\*\s+from\s+|export\s+\{[^}]*\}\s+from\s+)['"]([^'"]+)['"]"""
    r"""|(?:import|require)\(\s*['"]([^'"]+)['"]\s*\)"""
    r"""|lazy\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)"""
)


def rel(p: Path) -> str:
    try:
        return str(p.relative_to(WORKSPACE))
    except ValueError:
        return str(p)


def iter_files(root: Path):
    if not root.exists():
        return
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR]
        for name in filenames:
            p = Path(dirpath) / name
            if p.suffix in EXTS:
                yield p


def target_files() -> list[Path]:
    out: list[Path] = []
    out.extend(iter_files(WORKSPACE / "apps/meteor/client"))
    out.extend(iter_files(WORKSPACE / "apps/meteor/ee/client"))
    for app_root in (WORKSPACE / "apps/meteor/app", WORKSPACE / "apps/meteor/ee/app"):
        if not app_root.exists():
            continue
        for client in app_root.rglob("client"):
            if client.is_dir() and "node_modules" not in client.parts:
                out.extend(iter_files(client))
    pkg = WORKSPACE / "packages"
    if pkg.exists():
        for d in sorted(pkg.iterdir()):
            if d.is_dir() and d.name.startswith("ui-"):
                out.extend(iter_files(d))
    # unique, stable
    seen = set()
    uniq = []
    for p in out:
        rp = rel(p)
        if rp not in seen:
            seen.add(rp)
            uniq.append(p)
    uniq.sort(key=rel)
    return uniq


def file_class(p: Path) -> str:
    n = p.name
    s = str(p)
    if "/server/" in s:
        return "excluded-server"
    if any(x in n for x in (".spec.", ".test.")) or "/__tests__/" in s or "/tests/" in s:
        return "excluded-spec"
    if ".stories." in n or "/stories/" in s:
        return "excluded-stories"
    return "candidate"


SURFACE_RULES = [
    ("apps/meteor/client/views/admin", "admin"),
    ("apps/meteor/client/views/account", "account"),
    ("apps/meteor/client/views/omnichannel", "omni"),
    ("apps/meteor/client/views/marketplace", "marketplace"),
    ("apps/meteor/client/views/room", "room"),
    ("apps/meteor/client/views/root", "root"),
    ("apps/meteor/client/views/teams", "teams"),
    ("apps/meteor/client/views/directory", "directory"),
    ("apps/meteor/client/views/invite", "invite"),
    ("apps/meteor/client/views/setupWizard", "setup"),
    ("apps/meteor/client/views/composer", "composer"),
    ("apps/meteor/client/views/navigation", "nav"),
    ("apps/meteor/client/views/home", "home"),
    ("apps/meteor/client/views/oauth", "oauth"),
    ("apps/meteor/client/views/notFound", "notfound"),
    ("apps/meteor/client/views/search", "search"),
    ("apps/meteor/client/views/conference", "conference"),
    ("apps/meteor/client/views/mailer", "mailer"),
    ("apps/meteor/client/views/e2e", "e2e"),
    ("apps/meteor/client/views/mediaCallHistory", "callhist"),
    ("apps/meteor/client/views/outlookCalendar", "outlook"),
    ("apps/meteor/client/views/audit", "audit"),
    ("apps/meteor/client/navbar", "navbar"),
    ("apps/meteor/client/sidebar", "sidebar"),
    ("apps/meteor/client/components/message", "message"),
    ("apps/meteor/client/components", "comp"),
    ("apps/meteor/client/providers", "provider"),
    ("apps/meteor/client/hooks", "hook"),
    ("apps/meteor/client/lib", "lib"),
    ("apps/meteor/client/startup", "startup"),
    ("apps/meteor/client/portals", "portal"),
    ("apps/meteor/client/contexts", "ctx"),
    ("apps/meteor/client/meteor", "meteor"),
    ("apps/meteor/client/apps", "appsui"),
    ("apps/meteor/client/uikit", "uikit"),
    ("apps/meteor/client/cachedStores", "store"),
    ("apps/meteor/client/stores", "store"),
    ("apps/meteor/client/router", "router"),
    ("apps/meteor/app/livechat", "livechat"),
    ("apps/meteor/app/livechat-enterprise", "omni"),
    ("apps/meteor/app/emoji", "emoji"),
    ("apps/meteor/app/autotranslate", "translate"),
    ("apps/meteor/app/ui-message", "message"),
    ("apps/meteor/app/ui-utils", "uiutils"),
    ("apps/meteor/app/ui/", "ui"),
    ("apps/meteor/app/slashcommand", "slash"),
    ("apps/meteor/app/authorization", "authz"),
    ("apps/meteor/app/reactions", "reaction"),
    ("apps/meteor/app/", "app"),
    ("packages/ui-voip", "voip"),
    ("packages/ui-video-conf", "videoconf"),
    ("packages/ui-composer", "composer"),
    ("packages/ui-client", "uiclient"),
    ("packages/ui-kit", "uikit"),
    ("packages/ui-avatar", "avatar"),
    ("packages/ui-contexts", "uictx"),
]


def surface_of(rp: str) -> str:
    for prefix, name in SURFACE_RULES:
        if prefix in rp:
            return name
    return "other"


def kebab(s: str) -> str:
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", s)
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s or "x"


def clean_ws(s: str, n: int = 90) -> str:
    s = re.sub(r"//.*$", "", s)
    s = re.sub(r"/\*.*?\*/", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    s = s.replace("|", "¦")
    if len(s) > n:
        return s[: n - 1] + "…"
    return s


def extract_cond_before(text: str, idx: int, opener: str = "{") -> str:
    start = text.rfind(opener, max(0, idx - 400), idx)
    if start < 0:
        start = max(0, idx - 120)
    else:
        start += 1
    raw = text[start:idx]
    raw = re.sub(r"[\n\t]", " ", raw)
    return clean_ws(raw, 80)


def extract_render_after(text: str, idx: int) -> str:
    tail = text[idx : idx + 160]
    tail = re.sub(r"[\n\t]", " ", tail)
    return clean_ws(tail, 70)


def looks_comment(line: str) -> bool:
    return bool(COMMENT_LINE_RE.match(line))


def route_hint(rp: str) -> str:
    mapping = [
        ("views/admin/users", "登录 admin → `/admin/users`"),
        ("views/admin/rooms", "登录 admin → `/admin/rooms`"),
        ("views/admin/settings", "登录 admin → `/admin/settings`"),
        ("views/admin/permissions", "登录 admin → `/admin/permissions`"),
        ("views/admin/workspace", "登录 admin → `/admin/workspace`"),
        ("views/admin/subscription", "登录 admin → `/admin/subscription`"),
        ("views/admin/mailer", "登录 admin → `/admin/mailer`"),
        ("views/admin/import", "登录 admin → `/admin/import`"),
        ("views/admin/integrations", "登录 admin → `/admin/integrations`"),
        ("views/admin/invites", "登录 admin → `/admin/invites`"),
        ("views/admin/oauthApps", "登录 admin → `/admin/third-party-login`"),
        ("views/admin/customEmoji", "登录 admin → `/admin/emoji`"),
        ("views/admin/customSounds", "登录 admin → `/admin/sounds`"),
        ("views/admin/customUserStatus", "登录 admin → `/admin/user-status`"),
        ("views/admin/emailInbox", "登录 admin → `/admin/email-inboxes`"),
        ("views/admin/deviceManagement", "登录 admin → `/admin/device-management`"),
        ("views/admin/engagementDashboard", "登录 admin → `/admin/engagement`"),
        ("views/admin/moderation", "登录 admin → `/admin/moderation`"),
        ("views/admin/viewLogs", "登录 admin → `/admin/analytic-reports`"),
        ("views/admin/featurePreview", "登录 admin → `/admin/feature-preview`"),
        ("views/admin/ABAC", "登录 admin + ABAC 许可 → `/admin/ABAC`"),
        ("views/admin/aiCenter", "登录 admin → `/admin/ai-center`"),
        ("views/admin/", "登录 admin → `/admin`"),
        ("views/account/preferences", "登录 → `/account/preferences`"),
        ("views/account/profile", "登录 → `/account/profile`"),
        ("views/account/security", "登录 → `/account/security`"),
        ("views/account/tokens", "登录 → `/account/tokens`"),
        ("views/account/integrations", "登录 → `/account/integrations`"),
        ("views/account/omnichannel", "登录 omni 代理 → `/account/omnichannel`"),
        ("views/account/featurePreview", "登录 → `/account/feature-preview`"),
        ("views/account/accessibility", "登录 → `/account/accessibility-and-appearance`"),
        ("views/account/", "登录 → `/account`"),
        ("views/omnichannel/directory", "登录 omni → `/omnichannel-directory`"),
        ("views/omnichannel/queueList", "登录 omni → `/livechat-queue`"),
        ("views/omnichannel/", "登录 omni 经理 → 顶栏 Omnichannel"),
        ("views/marketplace/", "登录 → `/marketplace`"),
        ("views/directory/", "登录 → `/directory`"),
        ("views/home/", "登录 → `/home`"),
        ("views/invite/", "打开 `/invite/:hash`"),
        ("views/conference/", "打开 `/meet/:rid` 或 `/conference/:id`"),
        ("views/search/", "登录 → `/search`"),
        ("views/mediaCallHistory/", "登录 → `/call-history`"),
        ("views/oauth/", "打开 `/oauth/authorize`"),
        ("views/notFound/", "打开未知路径"),
        ("views/room/", "登录 → 打开任意房间"),
        ("views/composer/", "登录 → 打开可发消息房间 composer"),
        ("views/teams/", "登录 → 打开团队房间工具栏"),
        ("views/root/", "打开 `/` 或 `/home` 主壳"),
        ("views/e2e/", "登录 + 房间 E2EE 开"),
        ("navbar/", "登录后顶栏"),
        ("sidebar/", "登录后侧栏"),
        ("components/message/", "登录 → 打开有消息的房间"),
        ("packages/ui-voip", "登录 + 语音许可 + MediaCallProvider 挂载"),
        ("packages/ui-video-conf", "登录 + 视频会议入口"),
        ("packages/ui-composer", "登录 → 打开可发消息房间"),
        ("packages/ui-client", "被 meteor 客户端宿主挂载"),
        ("packages/ui-kit", "Block Kit / UIKit 表面挂载"),
        ("packages/ui-avatar", "任意展示头像的表面"),
        ("packages/ui-contexts", "被 Provider 树挂载（无独立路由）"),
        ("app/livechat", "Visitor 小部件或 omni 坐席面"),
        ("app/slashcommand", "登录 → composer 输入对应 slash"),
    ]
    for k, v in mapping:
        if k in rp:
            return v
    if rp.startswith("apps/meteor/client/"):
        return "登录后主壳（由 client/main.ts 闭包挂载）"
    if rp.startswith("packages/"):
        return "被宿主 import 后挂载"
    return "按出处文件所在表面进入"


def cond_extra(cond: str) -> str:
    c = cond.lower()
    bits = []
    if any(x in c for x in ("isloading", "ispending", "isFetching", "isinitial")):
        bits.append("等查询 in-flight")
    if any(x in c for x in ("iserror", "error", "iserr")):
        bits.append("让该查询/mutation 失败")
    if any(x in c for x in ("isempty", "length === 0", "length==0", "!data", "!items", "noresults")):
        bits.append("空列表/无数据")
    if "permission" in c or "haspermission" in c:
        bits.append("切换对应权限")
    if "license" in c or "module" in c:
        bits.append("EE license 开/关")
    if "anonymous" in c:
        bits.append("匿名读")
    if any(x in c for x in ("e2e", "encrypted")):
        bits.append("房间加密开")
    if "federat" in c:
        bits.append("联邦房间")
    if any(x in c for x in ("readonly", "archived", "omnichannel", "livechat")):
        bits.append("对应房间类型/只读/归档")
    if "embedded" in c:
        bits.append("embedded layout")
    return ("；" + "；".join(bits)) if bits else ""


def infer_related(cond: str, text_around: str) -> str:
    keys = []
    for m in re.finditer(r"['\"]([A-Za-z][A-Za-z0-9_.-]{2,80})['\"]", cond + " " + text_around):
        k = m.group(1)
        if "_" in k or k.startswith(("view-", "create-", "manage-", "edit-", "delete-", "access-")):
            keys.append(k)
        if k.startswith("Accounts_") or k.startswith("Message_") or k.startswith("Omnichannel_") or k.startswith("Livechat_"):
            keys.append(k)
    # de-dupe keep order
    seen = []
    for k in keys:
        if k not in seen:
            seen.append(k)
    return "；".join(seen[:4]) if seen else "（无）"


def unreachable_reason(cond: str, render: str, product_refs: int, rp: str) -> str | None:
    # Only claim 不可达 when the branch is statically impossible.
    # Incomplete import graphs must not mint false 不可达 (Honesty > leftover=0).
    cl = cond.strip().lower()
    if cl in {"false", "!true"} or re.match(r"^false\b", cl):
        return "条件字面量恒假"
    return None


def scan_file(p: Path) -> list[dict]:
    try:
        text = p.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []
    lines = text.splitlines()
    rp = rel(p)
    surface = surface_of(rp)
    stem = kebab(p.stem)
    states: list[dict] = []

    # JSX && and ternary (line-based so file:line is exact)
    for i, line in enumerate(lines, 1):
        if looks_comment(line):
            continue
        # skip import type lines
        if line.lstrip().startswith("import "):
            continue
        for m in AND_RE.finditer(line):
            cond = extract_cond_before(line, m.start(), opener="{")
            if not cond:
                cond = extract_cond_before(line, m.start(), opener="(")
            render = extract_render_after(line, m.start())
            states.append(
                {
                    "kind": "and-show",
                    "line": i,
                    "cond": cond or "&&",
                    "render": render,
                    "branch": "shown",
                }
            )
            states.append(
                {
                    "kind": "and-hide",
                    "line": i,
                    "cond": f"!({cond})" if cond else "&& 假",
                    "render": "不渲染该节点",
                    "branch": "hidden",
                }
            )
        for m in TERN_RE.finditer(line):
            # skip `? (` used as generic / type — heuristic: must look like JSX ternary
            before = line[: m.start()]
            if before.rstrip().endswith((":", ",", "<", "extends")):
                continue
            if " as " in before[-20:] and "?" not in before[-20:]:
                continue
            cond = extract_cond_before(line, m.start(), opener="{")
            if not cond:
                cond = extract_cond_before(line, m.start(), opener="=")
            render = extract_render_after(line, m.start())
            # then
            states.append(
                {
                    "kind": "tern-then",
                    "line": i,
                    "cond": cond or "?: then",
                    "render": render,
                    "branch": "then",
                }
            )
            # else — try to find ':' after
            else_bit = "else 分支"
            rest = line[m.end() :]
            colon = rest.find(" : ")
            if colon < 0:
                colon = rest.find(":")
            if colon >= 0:
                else_bit = clean_ws(rest[colon + 1 :], 70)
            states.append(
                {
                    "kind": "tern-else",
                    "line": i,
                    "cond": f"!({cond})" if cond else "?: else",
                    "render": else_bit,
                    "branch": "else",
                }
            )
        if SUSPENSE_RE.search(line):
            states.append(
                {
                    "kind": "suspense",
                    "line": i,
                    "cond": "Suspense fallback（子树未 ready）",
                    "render": extract_render_after(line, line.find("fallback")),
                    "branch": "fallback",
                }
            )

    # if-return JSX/null (same line or look-ahead 4)
    early = 0
    for i, line in enumerate(lines):
        if looks_comment(line):
            continue
        m = IF_LINE_RE.match(line)
        if not m:
            # same-line if without start-of-line already handled if indented
            if " if (" not in line and not line.lstrip().startswith("if ("):
                continue
            if not IF_LINE_RE.search(line) and not re.search(r"\bif\s*\(", line):
                continue
        # find return in this or next 5 lines
        window = "\n".join(lines[i : i + 6])
        rm = RETURN_JSX_RE.search(window)
        if not rm:
            continue
        cond_m = re.search(r"if\s*\((.+)\)", line)
        cond = clean_ws(cond_m.group(1), 80) if cond_m else "if"
        # trim dangling {
        cond = cond.rstrip("{ ").strip()
        render = clean_ws(rm.group(0), 70)
        states.append(
            {
                "kind": "if-ret",
                "line": i + 1,
                "cond": cond,
                "render": render,
                "branch": "if",
            }
        )
        early += 1

    # default return after at least one early-return in a tsx component
    if early and p.suffix == ".tsx":
        for j in range(len(lines) - 1, -1, -1):
            if RETURN_JSX_RE.search(lines[j]) and not re.search(r"\bif\s*\(", lines[j]):
                # skip if this return was already captured as if-ret on same line
                already = any(s["line"] == j + 1 and s["kind"] == "if-ret" for s in states)
                if already:
                    continue
                states.append(
                    {
                        "kind": "default",
                        "line": j + 1,
                        "cond": "前述 if 均不成立（default return）",
                        "render": clean_ws(lines[j], 70),
                        "branch": "default",
                    }
                )
                break

    # decorate
    out = []
    for n, s in enumerate(states, 1):
        sid = f"state.{surface}.{stem}.{s['line']}{ {'and-show':'a0','and-hide':'a1','tern-then':'t0','tern-else':'t1','if-ret':'i','default':'d','suspense':'s'}[s['kind']] }"
        out.append({**s, "id": sid, "file": rp, "surface": surface, "n": n})
    return out


def resolve_ts(base: Path, spec: str) -> Path | None:
    if spec.startswith("."):
        cand = (base.parent / spec).resolve()
        options = [
            cand,
            cand.with_suffix(".ts"),
            cand.with_suffix(".tsx"),
            cand.with_suffix(".js"),
            cand / "index.ts",
            cand / "index.tsx",
        ]
        for o in options:
            if o.is_file():
                return o
        return None
    # workspace ui packages
    m = re.match(r"@rocket\.chat/(ui-[a-z0-9-]+)", spec)
    if m:
        pkg = WORKSPACE / "packages" / m.group(1)
        # try package.json exports — fall back to src
        for sub in ("src/index.ts", "src/index.tsx", "index.ts"):
            p = pkg / sub
            if p.is_file():
                return p
    return None


def product_importers(files: list[Path]) -> dict[str, set[str]]:
    """Map relpath -> set of candidate files that import it."""
    importers: dict[str, set[str]] = defaultdict(set)
    for p in files:
        if file_class(p) != "candidate":
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        src = rel(p)
        for m in IMPORT_RE.finditer(text):
            spec = next(g for g in m.groups() if g)
            nxt = resolve_ts(p, spec)
            if nxt is None:
                continue
            importers[rel(nxt)].add(src)
    return importers


def import_closure() -> set[str]:
    """Kept for --count diagnostics; not used to mark 不可达 (resolver is incomplete)."""
    entries = [
        WORKSPACE / "apps/meteor/client/main.ts",
    ]
    seen: set[str] = set()
    stack = [e for e in entries if e.exists()]
    while stack:
        cur = stack.pop()
        rp = rel(cur)
        if rp in seen:
            continue
        seen.add(rp)
        try:
            text = cur.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for m in IMPORT_RE.finditer(text):
            spec = next(g for g in m.groups() if g)
            nxt = resolve_ts(cur, spec)
            if nxt is None:
                continue
            nrp = rel(nxt)
            if not (
                nrp.startswith("apps/meteor/client/")
                or "/client/" in nrp
                or nrp.startswith("packages/ui-")
            ):
                continue
            if file_class(nxt) != "candidate":
                continue
            stack.append(nxt)
    return seen


def classify_all(files: list[Path]) -> dict[str, str]:
    return {rel(p): file_class(p) for p in files}


def build_rows(files: list[Path], closure: set[str]) -> tuple[list[dict], dict[str, str]]:
    classes = classify_all(files)
    refs = product_importers(files)
    rows = []
    per_file_kind: dict[str, str] = {}
    for p in files:
        rp = rel(p)
        cls = classes[rp]
        if cls != "candidate":
            per_file_kind[rp] = cls
            continue
        st = scan_file(p)
        if not st:
            # distinguish tsx linear vs no-jsx
            if p.suffix in {".tsx", ".jsx"}:
                per_file_kind[rp] = "jsx-linear"
            else:
                per_file_kind[rp] = "no-jsx"
            continue
        per_file_kind[rp] = "jsx-branch"
        product_refs = len(refs.get(rp, ()))
        for s in st:
            reason = unreachable_reason(s["cond"], s["render"], product_refs, rp)
            if reason:
                arrival = f"不可达：{reason}"
                honesty = "[不可达]"
            else:
                arrival = route_hint(rp) + cond_extra(s["cond"])
                honesty = "[待渲染实测]"
            rows.append(
                {
                    "id": s["id"],
                    "surface": s["surface"],
                    "cond": s["cond"],
                    "render": s["render"],
                    "arrival": arrival,
                    "honesty": honesty,
                    "related": infer_related(s["cond"], s["render"]),
                    "src": f"{s['file']}:{s['line']}",
                    "kind": s["kind"],
                    "file": s["file"],
                    "line": s["line"],
                }
            )
    # unique ids: if collision, hash suffix
    seen = {}
    for r in rows:
        if r["id"] in seen:
            h = hashlib.sha1(f"{r['src']}:{r['kind']}:{r['cond']}".encode()).hexdigest()[:4]
            r["id"] = r["id"] + h
        seen[r["id"]] = True
    rows.sort(key=lambda r: (r["surface"], r["file"], r["line"], r["kind"]))
    return rows, per_file_kind


def md_escape(s: str) -> str:
    return s.replace("|", "¦").replace("\n", " ")


def emit_count(files, rows, kinds, closure):
    c = Counter(kinds.values())
    print("SHA_EXPECT", SHA)
    print("TARGET_FILES", len(files))
    print("CLASS", dict(c))
    print("CLASS_SUM", sum(c.values()))
    print("STATES", len(rows))
    print("UNIQUE_IDS", len({r["id"] for r in rows}))
    print("HONESTY", dict(Counter(r["honesty"] for r in rows)))
    print("KIND", dict(Counter(r["kind"] for r in rows)))
    print("CLOSURE", len(closure))
    print("MISSING_EE_CLIENT", int(not (WORKSPACE / "apps/meteor/ee/client").exists()))
    print("MISSING_EE_APP", int(not (WORKSPACE / "apps/meteor/ee/app").exists()))


def emit_files(kinds):
    for rp, k in sorted(kinds.items()):
        print(f"{k}\t{rp}")


def emit_markdown_tables(rows: list[dict]) -> str:
    parts = []
    by = defaultdict(list)
    for r in rows:
        by[r["surface"]].append(r)
    order = [
        "root",
        "home",
        "navbar",
        "sidebar",
        "nav",
        "room",
        "message",
        "composer",
        "account",
        "admin",
        "omni",
        "marketplace",
        "directory",
        "teams",
        "invite",
        "setup",
        "e2e",
        "voip",
        "videoconf",
        "callhist",
        "oauth",
        "conference",
        "search",
        "notfound",
        "mailer",
        "outlook",
        "audit",
        "provider",
        "hook",
        "comp",
        "portal",
        "uiclient",
        "uikit",
        "uictx",
        "avatar",
        "livechat",
        "slash",
        "emoji",
        "translate",
        "app",
        "meteor",
        "lib",
        "startup",
        "store",
        "router",
        "ctx",
        "appsui",
        "authz",
        "reaction",
        "ui",
        "uiutils",
        "other",
    ]
    seen = set()
    surfaces = [s for s in order if s in by]
    surfaces += [s for s in sorted(by) if s not in surfaces]
    for s in surfaces:
        chunk = by[s]
        seen.add(s)
        parts.append(f"\n### {s}（{len(chunk)}）\n")
        parts.append("| id | 表面 | 分支条件 | 渲染 | 到达配方 | 诚实 | 关联 | 出处 |\n")
        parts.append("| --- | --- | --- | --- | --- | --- | --- | --- |\n")
        for r in chunk:
            parts.append(
                "| `{id}` | {surface} | {cond} | {render} | {arrival} | {honesty} | {related} | `{src}` |\n".format(
                    id=r["id"],
                    surface=r["surface"],
                    cond=md_escape(r["cond"]),
                    render=md_escape(r["render"]),
                    arrival=md_escape(r["arrival"]),
                    honesty=r["honesty"],
                    related=md_escape(r["related"]),
                    src=r["src"],
                )
            )
    return "".join(parts)


def render_full_md(files, rows, kinds, closure) -> str:
    c = Counter(kinds.values())
    h = Counter(r["honesty"] for r in rows)
    k = Counter(r["kind"] for r in rows)
    by_surf = Counter(r["surface"] for r in rows)
    surf_eq = " + ".join(f"{n}" for _, n in sorted(by_surf.items()))
    class_eq = (
        f"{c.get('jsx-branch', 0)}+{c.get('jsx-linear', 0)}+{c.get('no-jsx', 0)}"
        f"+{c.get('excluded-spec', 0)}+{c.get('excluded-stories', 0)}"
        f"+{c.get('excluded-server', 0)}"
    )
    kind_eq = (
        f"{k.get('and-show', 0)}+{k.get('and-hide', 0)}+{k.get('tern-then', 0)}"
        f"+{k.get('tern-else', 0)}+{k.get('if-ret', 0)}+{k.get('default', 0)}"
        f"+{k.get('suspense', 0)}"
    )
    header = f"""# Round 2 / Vol.8 — UI 状态闭集

冻结树：**仅** `{SHA}`（短 SHA `e519470`）。**不是** `develop`。`file:line` 均相对此 SHA。

## 1. 方法

- 规则：**每个条件渲染分支 = 一个 state**。id = `state.<surface>.<file-stem>.<line><kind>`。
- 目标树（本卷闭集）：
  - `apps/meteor/client/**`
  - `apps/meteor/ee/client/**`（本冻结 **目录不存在**）
  - `apps/meteor/app/**/client/**`
  - `apps/meteor/ee/app/**/client/**`（本冻结 **目录不存在**）
  - `packages/ui-*`：`ui-avatar` `ui-client` `ui-composer` `ui-contexts` `ui-kit` `ui-video-conf` `ui-voip`
- 目标文件：以上树内 `*.{{ts,tsx,js,jsx}}`，排除 `node_modules` / `dist` / `.turbo` / `coverage`。
- 文件分类（每个目标文件恰好一类）：
  - `jsx-branch`：抽出 ≥1 个条件渲染分支
  - `jsx-linear`：`.tsx`/`.jsx` 无抽出分支（直线渲染）
  - `no-jsx`：无 JSX 条件渲染（`.ts` 模块 / 类型 / 纯逻辑）
  - `excluded-spec`：`*.spec.*` / `*.test.*` / `tests/`
  - `excluded-stories`：`*.stories.*` / `stories/`
- 分支抽取（确定性，见 `export-08-states.py`）：
  - JSX `&& (` / `&& <` → **shown + hidden** 两行
  - JSX `? (` / `? <`（排除 `?.` / `??`）→ **then + else** 两行
  - `if (...)` 后 6 行内 `return null` / `return (` / `return <` → **if-ret**
  - 同一文件存在 if-ret 时，最后一个非 if 的 `return` → **default**
  - `<Suspense fallback=` → **suspense**
- 8 列：id / 表面 / 分支条件 / 渲染 / 到达配方或不可达 / 诚实 / 关联 / 出处。
- 诚实：本环境 **Meteor boot 失败** → **STOP live，无假 DOM**。未点击的可达行一律 `[待渲染实测]`。仅字面量恒假才标 `[不可达]`。
- 不扫 `develop`。不发明 DOM。

## 2. 目标树证明（本冻结）

```bash
git rev-parse HEAD
# expect {SHA}

test ! -d apps/meteor/ee/client && echo MISSING_EE_CLIENT
test ! -d apps/meteor/ee/app && echo MISSING_EE_APP
# expect both MISSING_*

ls -1 packages | grep '^ui-'
# expect:
# ui-avatar
# ui-client
# ui-composer
# ui-contexts
# ui-kit
# ui-video-conf
# ui-voip
```

EE 客户端 UI 在本冻结已并入 `apps/meteor/client`（如 omnichannel / ABAC / audit），**没有**独立 `ee/client` 树。`ee/apps/*` 是无 `client/` 的微服务，不在本卷命名 sweep 内。

## 3. 文件闭合

| 类 | 数 |
| --- | ---: |
| jsx-branch | {c.get('jsx-branch', 0)} |
| jsx-linear | {c.get('jsx-linear', 0)} |
| no-jsx | {c.get('no-jsx', 0)} |
| excluded-spec | {c.get('excluded-spec', 0)} |
| excluded-stories | {c.get('excluded-stories', 0)} |
| excluded-server | {c.get('excluded-server', 0)} |
| **TARGET_FILES** | **{len(files)}** |

等式：`{class_eq} = {len(files)}`。

每个目标文件由 `python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --files` 打出 `class<TAB>relpath`。`CLASS_SUM` 必须等于 `TARGET_FILES`。无第三类、无漏文件。

## 4. 状态闭合

| 分支 kind | 数 |
| --- | ---: |
| and-show | {k.get('and-show', 0)} |
| and-hide | {k.get('and-hide', 0)} |
| tern-then | {k.get('tern-then', 0)} |
| tern-else | {k.get('tern-else', 0)} |
| if-ret | {k.get('if-ret', 0)} |
| default | {k.get('default', 0)} |
| suspense | {k.get('suspense', 0)} |
| **STATES** | **{len(rows)}** |

等式：`{kind_eq} = {len(rows)}`。

| 诚实 | 数 |
| --- | ---: |
| [待渲染实测] | {h.get('[待渲染实测]', 0)} |
| [不可达] | {h.get('[不可达]', 0)} |
| [实测] | {h.get('[实测]', 0)} |

`[待渲染实测]+[不可达]+[实测] = {sum(h.values())}`。本卷 `[实测]=0`（boot STOP）。

表面分表行数之和必须等于 STATES：`{surf_eq} = {len(rows)}`。

## 5. Live boot（STOP）

尝试过、失败、停止。**无假 DOM。**

| 步 | 结果 |
| --- | --- |
| Meteor 3.4.1 | 已安装（`~/.meteor`，与 `apps/meteor/.meteor/release` 一致） |
| Mongo 7.0.24 单节点 `rs0` | `127.0.0.1:27017` PRIMARY（`replSetInitiate` ok） |
| Node 22.22.3 + `yarn install` | 完成（peer 警告，非 fatal） |
| `meteor npm run dsv` 第 1 次 | **FAIL** `ENOENT: scandir apps/meteor/packages/rocketchat-i18n/i18n`（symlink → 尚不存在的 `packages/i18n/dist/resources`） |
| `yarn workspace @rocket.chat/tools build` 然后 `@rocket.chat/i18n build` | 成功；symlink 可 `listdir` 68 个 json |
| `meteor npm run dsv` 第 2 次 | **FAIL** Livechat：`cp .../packages/livechat/dist/.` ENOENT；随后 `open 'index.html'` ENOENT。Meteor 解析 stack 崩溃退出 |
| 后续 | **STOP live**。不再为假页面补 dist / 编 DOM |

因此：**STOP live**。表体不写 `[实测]`，不截图，不编造 DOM。可达未点击 = `[待渲染实测]`。

## 6. 闭集表（一行一分支）

数据行 **{len(rows)}**。排序：surface / file / line / kind。
"""
    return header + emit_markdown_tables(rows) + """

## 7. 闭合判据（拒收条件：数字对不上）

在 **`""" + SHA + """`** 上重跑。不要用 develop。

```bash
git rev-parse HEAD
# expect """ + SHA + """

python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --verify
# TARGET_FILES """ + str(len(files)) + """
# CLASS_SUM """ + str(len(files)) + """
# STATES """ + str(len(rows)) + """
# UNIQUE_IDS """ + str(len(rows)) + """
# VERIFY_OK """ + str(len(files)) + " " + str(len(rows)) + """

rg -c '^\\| `state\\.' docs/qa/pm-feature-atlas/round-2/08-states.md
# expect """ + str(len(rows)) + """

rg -o '^\\| `state\\.[^`]+' docs/qa/pm-feature-atlas/round-2/08-states.md | sort | uniq | wc -l
# expect """ + str(len(rows)) + """
```

文件闭合（无漏文件）：

```bash
python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --files | wc -l
# expect """ + str(len(files)) + """

python3 - <<'PY'
from pathlib import Path
import subprocess, sys
sys.path.insert(0, 'docs/qa/pm-feature-atlas/round-2')
import importlib.util
spec = importlib.util.spec_from_file_location('e', 'docs/qa/pm-feature-atlas/round-2/export-08-states.py')
e = importlib.util.module_from_spec(spec); spec.loader.exec_module(e)
files = {e.rel(p) for p in e.target_files()}
listed = {line.split('\\t',1)[1] for line in subprocess.check_output(
    ['python3','docs/qa/pm-feature-atlas/round-2/export-08-states.py','--files'], text=True).splitlines() if '\\t' in line}
print('SYMDIFF', sorted(files ^ listed)[:10], 'len', len(files ^ listed))
print('COUNT', len(files), len(listed))
PY
# expect SYMDIFF [] ; COUNT """ + str(len(files)) + " " + str(len(files)) + """
```

树级 rg（本冻结）：

```bash
# ee/client 不存在
rg --files apps/meteor/ee/client 2>&1 | head
# expect: No such file or directory / 0 files

# 目标树源文件（与 exporter 同一排除）
rg --files -g '*.ts' -g '*.tsx' -g '*.js' -g '*.jsx' \
  -g '!**/node_modules/**' -g '!**/dist/**' \
  apps/meteor/client packages/ui-avatar packages/ui-client \
  packages/ui-composer packages/ui-contexts packages/ui-kit \
  packages/ui-video-conf packages/ui-voip \
  | wc -l
# 只覆盖 packages/ui-* + meteor/client；app/**/client 另计。exporter TARGET_FILES 才是权威并集。
```

`rg` 对 `apps/meteor/app/**/client` 必须用 exporter / `find`，因为该树是多根：

```bash
find apps/meteor/app -type d -name client | wc -l
# expect 30
```

## 8. 排除与非本卷

- 不扫 `develop`，不做 freeze-vs-develop diff（那是 vol 14）。
- 不扫 `apps/meteor/server`、`ee/server`、`ee/apps`（无 client UI）。
- spec/stories 已分类，不抽 state。
- setting/permission 闭集是 vol 6/7；本卷只在「关联」列回指字面量。
- 无 `[实测]` 行。boot 修好后只能把已点击行升级为 `[实测]`，不能把未点击行改成不可达来清零。
"""


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", action="store_true")
    ap.add_argument("--files", action="store_true")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--tables", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--write-md", metavar="PATH")
    args = ap.parse_args(argv)
    files = target_files()
    closure = import_closure()
    rows, kinds = build_rows(files, closure)
    if args.count or args.verify or not any([args.files, args.json, args.tables]):
        emit_count(files, rows, kinds, closure)
    if args.verify:
        assert len(files) == len(kinds), (len(files), len(kinds))
        assert len(rows) == len({r["id"] for r in rows})
        print("VERIFY_OK", len(files), len(rows))
    if args.files:
        emit_files(kinds)
    if args.json:
        json.dump({"rows": rows, "kinds": kinds}, sys.stdout)
    if args.tables:
        sys.stdout.write(emit_markdown_tables(rows))
    if args.write_md:
        Path(args.write_md).write_text(render_full_md(files, rows, kinds, closure), encoding="utf-8")
        print("WROTE", args.write_md)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
