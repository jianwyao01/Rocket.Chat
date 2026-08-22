#!/usr/bin/env python3
"""Round 2 / Vol.8 — JSX-only conditional-render extractor (freeze e519470).

Each surviving conditional RENDER branch = one state.
Replay: python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --verify
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

KIND_SUFFIX = {
    "and-show": "a0",
    "and-hide": "a1",
    "tern-then": "t0",
    "tern-else": "t1",
    "if-ret": "i",
    "default": "d",
    "suspense": "s",
}

JSX_TAG_RE = re.compile(r"</?([A-Za-z][A-Za-z0-9.]*)")
IDENT_RE = re.compile(r"[A-Za-z_$][\w$]*")
# assignment = but not == / === / != / !== / <= / >= / =>
ASSIGN_EQ_RE = re.compile(r"(?<![!<>=])=(?![=])")


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
    seen: set[str] = set()
    uniq: list[Path] = []
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


def line_of(text: str, idx: int) -> int:
    return text.count("\n", 0, idx) + 1


# ----- lexer helpers (skip strings / comments / regex) -----

def skip_ws_comments(text: str, i: int) -> int:
    n = len(text)
    while i < n:
        c = text[i]
        if c in " \t\r\n":
            i += 1
            continue
        if text.startswith("//", i):
            nl = text.find("\n", i)
            i = n if nl < 0 else nl + 1
            continue
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = n if end < 0 else end + 2
            continue
        break
    return i


def skip_string(text: str, i: int) -> int:
    q = text[i]
    i += 1
    n = len(text)
    if q == "`":
        while i < n:
            if text[i] == "\\":
                i += 2
                continue
            if text[i] == "`":
                return i + 1
            if text[i] == "$" and i + 1 < n and text[i + 1] == "{":
                i = skip_balanced(text, i + 1, "{", "}")
                continue
            i += 1
        return i
    while i < n:
        if text[i] == "\\":
            i += 2
            continue
        if text[i] == q:
            return i + 1
        if text[i] == "\n" and q != "`":
            return i
        i += 1
    return i


def skip_regex(text: str, i: int) -> int:
    """i points at opening / of a regex literal."""
    i += 1
    n = len(text)
    while i < n:
        if text[i] == "\\":
            i += 2
            continue
        if text[i] == "\n":
            return i
        if text[i] == "/":
            i += 1
            while i < n and text[i].isalpha():
                i += 1
            return i
        if text[i] == "[":
            i += 1
            while i < n and text[i] != "]":
                if text[i] == "\\":
                    i += 2
                    continue
                i += 1
            i += 1
            continue
        i += 1
    return i


_REGEX_PREV = set("=!([{,;:?&|~^%<>\n\t ")


def prev_code(text: str, i: int) -> str:
    j = i - 1
    while j >= 0 and text[j] in " \t":
        j -= 1
    return text[j] if j >= 0 else "\n"


def looks_regex_start(text: str, i: int) -> bool:
    if text[i] != "/":
        return False
    if text.startswith("//", i) or text.startswith("/*", i):
        return False
    p = prev_code(text, i)
    if p in _REGEX_PREV:
        return True
    # keyword before /
    k = i - 1
    while k >= 0 and text[k] in " \t":
        k -= 1
    end = k + 1
    while k >= 0 and (text[k].isalnum() or text[k] == "_"):
        k -= 1
    word = text[k + 1 : end]
    return word in {"return", "case", "throw", "typeof", "void", "delete", "new", "in", "of", "await"}


def skip_balanced(text: str, i: int, open_ch: str, close_ch: str) -> int:
    """i at opening delimiter; return index after matching close. Strings/comments skipped."""
    assert text[i] == open_ch
    depth = 0
    n = len(text)
    while i < n:
        c = text[i]
        if c in "'\"`":
            i = skip_string(text, i)
            continue
        if text.startswith("//", i):
            nl = text.find("\n", i)
            i = n if nl < 0 else nl + 1
            continue
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = n if end < 0 else end + 2
            continue
        if c == "/" and looks_regex_start(text, i):
            i = skip_regex(text, i)
            continue
        if c == open_ch:
            depth += 1
            i += 1
            continue
        if c == close_ch:
            depth -= 1
            i += 1
            if depth == 0:
                return i
            continue
        i += 1
    return i


def iter_code_indexes(text: str):
    """Yield indexes of code characters (not string/comment/regex)."""
    i = 0
    n = len(text)
    while i < n:
        c = text[i]
        if c in "'\"`":
            i = skip_string(text, i)
            continue
        if text.startswith("//", i):
            nl = text.find("\n", i)
            i = n if nl < 0 else nl + 1
            continue
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = n if end < 0 else end + 2
            continue
        if c == "/" and looks_regex_start(text, i):
            i = skip_regex(text, i)
            continue
        yield i
        i += 1


def is_jsx_ident(name: str) -> bool:
    if not name:
        return False
    if name[0].isupper():
        return True
    # intrinsic tags used as JSX after && (
    return name in {
        "div",
        "span",
        "p",
        "a",
        "img",
        "ul",
        "ol",
        "li",
        "button",
        "form",
        "input",
        "label",
        "table",
        "thead",
        "tbody",
        "tr",
        "td",
        "th",
        "section",
        "header",
        "footer",
        "nav",
        "main",
        "aside",
        "h1",
        "h2",
        "h3",
        "h4",
        "svg",
        "path",
        "iframe",
        "video",
        "audio",
        "canvas",
        "style",
    }


def jsx_start_at(text: str, i: int) -> tuple[bool, int, str]:
    """If text[i:] (after skip) opens JSX, return (True, tag_index, tag_name)."""
    i = skip_ws_comments(text, i)
    n = len(text)
    if i >= n:
        return False, i, ""
    if text[i] == "<":
        nxt = text[i + 1] if i + 1 < n else ""
        if nxt == ">":
            return True, i, "<>"
        if nxt == "/":
            return False, i, ""
        if nxt.isalpha() or nxt in "!>":
            m = JSX_TAG_RE.match(text, i)
            name = m.group(1) if m else "<>"
            return True, i, name
        return False, i, ""
    if text[i] == "{":
        j = skip_ws_comments(text, i + 1)
        if j < n and text[j] == "<":
            ok, _, name = jsx_start_at(text, j)
            return ok, i, name
        return False, i, ""
    m = IDENT_RE.match(text, i)
    if m and is_jsx_ident(m.group(0)):
        name = m.group(0)
        j = m.end()
        # compound Foo.Bar (member component) — stop if next member is lowercase (property)
        while True:
            k = skip_ws_comments(text, j)
            if k < n and text[k] == ".":
                k2 = skip_ws_comments(text, k + 1)
                m2 = IDENT_RE.match(text, k2)
                if not m2:
                    break
                if not m2.group(0)[0].isupper():
                    return False, i, ""  # Foo.permission / Notification.requestPermission
                name = name + "." + m2.group(0)
                j = m2.end()
                continue
            break
        j = skip_ws_comments(text, j)
        # JSX: <Foo />, Foo(), Foo, Foo}
        if j >= n or text[j] in "({,;)}":
            return True, i, name
        if text[j] == "<":  # Foo<Props> or invalid
            return True, i, name
    return False, i, ""


JS_CALLS = frozenset(
    {
        "Boolean",
        "Array",
        "String",
        "Number",
        "Object",
        "Map",
        "Set",
        "Date",
        "JSON",
        "Promise",
        "Math",
        "Symbol",
        "BigInt",
        "Function",
        "RegExp",
        "Error",
        "Reflect",
        "Proxy",
        "Intl",
    }
)
FORBIDDEN_RENDER = frozenset({"Boolean", "Array", "String", "Number", "Object", "ROOM_INTIAL_VALUE"})


def operand_is_jsx(text: str, after_op: int) -> tuple[bool, str]:
    """A': after && / ? must be `<` or `(` whose next non-ws token is `<` / `{<`. No bare uppercase ident."""
    i = skip_ws_comments(text, after_op)
    n = len(text)
    if i >= n:
        return False, ""
    if text[i] == "<":
        ok, _, name = jsx_start_at(text, i)
        if ok and name.split(".")[0] not in JS_CALLS:
            return True, name
        return False, ""
    if text[i] == "(":
        j = skip_ws_comments(text, i + 1)
        if j < n and text[j] == ")":
            return False, ""
        if j < n and text[j] == "<":
            ok, _, name = jsx_start_at(text, j)
            return (True, name) if ok and name.split(".")[0] not in JS_CALLS else (False, "")
        if j < n and text[j] == "{":
            k = skip_ws_comments(text, j + 1)
            if k < n and text[k] == "<":
                ok, _, name = jsx_start_at(text, k)
                return (True, name) if ok and name.split(".")[0] not in JS_CALLS else (False, "")
        return False, ""
    return False, ""


def jsx_name_from_array_map(text: str, start: int) -> str:
    """`Array(n).fill(...).map(() => <Tag/>)` → Tag. Never render=`Array`."""
    i = skip_ws_comments(text, start)
    if not text.startswith("Array", i):
        return ""
    nxt = i + 5
    if nxt < len(text) and (text[nxt].isalnum() or text[nxt] == "_"):
        return ""
    j = skip_ws_comments(text, nxt)
    if j >= len(text) or text[j] != "(":
        return ""
    j = skip_balanced(text, j, "(", ")")
    map_open: int | None = None
    while True:
        k = skip_ws_comments(text, j)
        if k >= len(text) or text[k] != ".":
            break
        k2 = skip_ws_comments(text, k + 1)
        m = IDENT_RE.match(text, k2)
        if not m:
            break
        p = skip_ws_comments(text, m.end())
        if p >= len(text) or text[p] != "(":
            break
        if m.group(0) == "map":
            map_open = p
            break
        j = skip_balanced(text, p, "(", ")")
    if map_open is None:
        return ""
    inner_end = skip_balanced(text, map_open, "(", ")") - 1
    idx = map_open + 1
    while idx < inner_end:
        idx = skip_ws_comments(text, idx)
        if idx >= inner_end:
            break
        if text[idx] == "<":
            ok, _, name = jsx_start_at(text, idx)
            if ok and name and name.split(".")[0] not in JS_CALLS:
                return name
        idx += 1
    return ""


def inside_mutation_fn(text: str, idx: int, bodies: list[tuple[int, int]]) -> bool:
    """C'' nested: JSX inside mutationFn / useMutation is not a product UI branch."""
    for s, _e in _containing_bodies(bodies, idx):
        prefix = text[max(0, s - 160) : s]
        if re.search(r"\bmutationFn\s*:", prefix) or re.search(r"\buseMutation\s*\(", prefix):
            return True
    return False


def extract_jsx_name_from(text: str, start: int) -> str:
    ok, name = operand_is_jsx(text, start)
    if ok and name:
        if name == "<>":
            # peek first real child tag inside fragment
            i = skip_ws_comments(text, start)
            if i < len(text) and text[i] == "(":
                i = skip_ws_comments(text, i + 1)
            if i < len(text) and text[i] == "<" and i + 1 < len(text) and text[i + 1] == ">":
                inner = skip_ws_comments(text, i + 2)
                ok2, _, name2 = jsx_start_at(text, inner)
                if ok2 and name2:
                    return name2
        return name
    i = skip_ws_comments(text, start)
    if i < len(text) and text.startswith("null", i) and not (i + 4 < len(text) and (text[i + 4].isalnum() or text[i + 4] == "_")):
        return "null"
    return "?"


def clean_expr(s: str, n: int = 100) -> str:
    s = re.sub(r"//.*?$", "", s, flags=re.M)
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"^(return|const|let|var)\s+", "", s)
    # E': leftover from JSX `=>` / `{expr &&` / `> {`
    s = re.sub(r"^[>{}\s]+", "", s)
    s = s.strip(" \t{}")
    s = s.replace("|", "¦")
    if len(s) > n:
        return s[: n - 1] + "…"
    return s


def expr_before(text: str, op_idx: int) -> str:
    """Boolean expression immediately left of && or ? (JSX operand)."""
    i = op_idx
    depth_paren = 0
    depth_brack = 0
    depth_brace = 0
    start = 0
    # walk back over code
    j = op_idx - 1
    # collect region
    while j >= 0:
        c = text[j]
        # skip strings backward crudely: if quote, jump to previous matching is hard;
        # stop at structural boundaries instead.
        if c == ")":
            depth_paren += 1
        elif c == "(":
            if depth_paren == 0:
                start = j + 1
                break
            depth_paren -= 1
        elif c == "]":
            depth_brack += 1
        elif c == "[":
            if depth_brack == 0:
                start = j + 1
                break
            depth_brack -= 1
        elif c == "}":
            depth_brace += 1
        elif c == "{":
            if depth_brace == 0:
                start = j + 1
                break
            depth_brace -= 1
        elif depth_paren == 0 and depth_brack == 0 and depth_brace == 0:
            if c in ";,\n":
                start = j + 1
                break
            if c == ":" and (j == 0 or text[j - 1] not in "?:="):
                # object field `description: expr && <X/>`
                start = j + 1
                break
            if c == "=" and not (j > 0 and text[j - 1] in "!<>=:") and not (j + 1 < len(text) and text[j + 1] == "="):
                # `=>` arrow: start after `>` so cond is not `> roomList[index]`
                if j + 1 < len(text) and text[j + 1] == ">":
                    start = j + 2
                else:
                    start = j + 1
                break
        j -= 1
    else:
        start = 0
    raw = text[start:op_idx]
    # drop a leading `return`
    raw = re.sub(r"^\s*return\b", "", raw)
    return clean_expr(raw)


def classify_return(text: str, ret_idx: int) -> str:
    """Classify a `return` at ret_idx: null | jsx | object | other."""
    if not text.startswith("return", ret_idx):
        return "other"
    if ret_idx > 0 and (text[ret_idx - 1].isalnum() or text[ret_idx - 1] in "_$"):
        return "other"
    i = skip_ws_comments(text, ret_idx + 6)
    n = len(text)
    if i >= n:
        return "other"
    if text.startswith("null", i) and (i + 4 >= n or not (text[i + 4].isalnum() or text[i + 4] == "_")):
        return "null"
    if text[i] == "<":
        ok, _, _ = jsx_start_at(text, i)
        return "jsx" if ok else "other"
    if text[i] == "(":
        j = skip_ws_comments(text, i + 1)
        if j < n and text[j] == ")":
            return "other"  # () =>
        ok, _ = operand_is_jsx(text, i + 1)
        return "jsx" if ok else "other"
    if text[i] == "{":
        j = skip_ws_comments(text, i + 1)
        if j < n and text[j] == "<":
            return "jsx"
        return "object"
    return "other"


def is_ui_return(text: str, ret_idx: int) -> tuple[bool, str]:
    """Rule B/C: return null / return < / return ( that opens JSX. Never return () => / { / false / value."""
    if not text.startswith("return", ret_idx):
        return False, ""
    if ret_idx > 0 and (text[ret_idx - 1].isalnum() or text[ret_idx - 1] in "_$"):
        return False, ""
    i = skip_ws_comments(text, ret_idx + 6)
    n = len(text)
    if i >= n:
        return False, ""
    if text.startswith("null", i) and (i + 4 >= n or not (text[i + 4].isalnum() or text[i + 4] == "_")):
        return True, "null"
    if text[i] == "<":
        ok, _, name = jsx_start_at(text, i)
        return (True, name or "<") if ok else (False, "")
    if text[i] == "(":
        j = skip_ws_comments(text, i + 1)
        if j < n and text[j] == ")":
            return False, ""  # () =>
        ok, name = operand_is_jsx(text, i + 1)
        if ok:
            return True, name
        # `return (` + JSX tag after comments/newlines already handled.
        # Bare `return (` of a non-JSX value: reject (Rule B: never return value).
        return False, ""
    return False, ""


CONTROL_BEFORE_PAREN = frozenset({"if", "for", "while", "switch", "catch", "with"})


def _match_open_paren(text: str, close_idx: int, code: set[int]) -> int | None:
    depth = 0
    i = close_idx
    while i >= 0:
        if i in code:
            c = text[i]
            if c == ")":
                depth += 1
            elif c == "(":
                depth -= 1
                if depth == 0:
                    return i
        i -= 1
    return None


def _ident_before(text: str, idx: int) -> str:
    """Identifier immediately left of idx (skipping ws/comments backward)."""
    j = idx - 1
    while j >= 0 and text[j] in " \t\r\n":
        j -= 1
    if j >= 1 and text[j] == "/" and text[j - 1] == "*":
        k = text.rfind("/*", 0, j - 1)
        j = k - 1 if k >= 0 else -1
        while j >= 0 and text[j] in " \t\r\n":
            j -= 1
    end = j + 1
    while j >= 0 and (text[j].isalnum() or text[j] in "_$"):
        j -= 1
    return text[j + 1 : end]


def find_function_bodies(text: str) -> list[tuple[int, int]]:
    """`{` … `}` spans that are function/arrow/method bodies (not if/for/class)."""
    n = len(text)
    code = set(iter_code_indexes(text))
    starts: set[int] = set()

    def add_body(brace: int) -> None:
        if brace < n and text[brace] == "{":
            starts.add(brace)

    for i in find_ops(text, "=>"):
        j = skip_ws_comments(text, i + 2)
        if j < n and text[j] == "{":
            add_body(j)

    for i in find_keyword(text, "function"):
        j = skip_ws_comments(text, i + 8)
        if j < n and text[j] == "*":
            j = skip_ws_comments(text, j + 1)
        if j < n and (text[j].isalpha() or text[j] in "_$"):
            m = IDENT_RE.match(text, j)
            if m:
                j = skip_ws_comments(text, m.end())
        if j < n and text[j] == "<":
            j = skip_ws_comments(text, skip_balanced(text, j, "<", ">"))
        if j >= n or text[j] != "(":
            continue
        after = skip_balanced(text, j, "(", ")")
        k = skip_ws_comments(text, after)
        if k < n and text[k] == "{":
            add_body(k)
            continue
        if k < n and text[k] == ":":
            body = _body_after_return_type(text, k + 1, code)
            if body is not None:
                add_body(body)

    # method / shorthand: `name(...) {` but not if/for/while/switch/catch
    i = 0
    while True:
        i = text.find(")", i)
        if i < 0:
            break
        if i in code:
            j = skip_ws_comments(text, i + 1)
            if j < n and text[j] == "{" and j not in starts:
                open_p = _match_open_paren(text, i, code)
                if open_p is not None:
                    kw = _ident_before(text, open_p)
                    if kw not in CONTROL_BEFORE_PAREN:
                        add_body(j)
        i += 1

    bodies: list[tuple[int, int]] = []
    for b in sorted(starts):
        bodies.append((b, skip_balanced(text, b, "{", "}")))
    return bodies


def _body_after_return_type(text: str, start: int, code: set[int]) -> int | None:
    """After `function f():`, find the `{` that opens the body (not a type literal)."""
    n = len(text)
    depth_p = depth_b = depth_a = depth_c = 0
    i = start
    while i < n:
        if i not in code:
            i += 1
            continue
        c = text[i]
        if c == "(":
            depth_p += 1
        elif c == ")":
            depth_p -= 1
        elif c == "[":
            depth_b += 1
        elif c == "]":
            depth_b -= 1
        elif c == "<":
            depth_a += 1
        elif c == ">":
            depth_a -= 1
        elif c == "{" and depth_p == 0 and depth_b == 0 and depth_a <= 0 and depth_c == 0:
            end = skip_balanced(text, i, "{", "}")
            j = skip_ws_comments(text, end)
            if j < n and text[j] in "|&[":
                i = j
                continue
            if j < n and text[j] == "{":
                return j
            return i
        elif c == "{":
            depth_c += 1
        elif c == "}":
            depth_c -= 1
        i += 1
    return None


def _containing_bodies(bodies: list[tuple[int, int]], idx: int) -> list[tuple[int, int]]:
    return [se for se in bodies if se[0] <= idx < se[1]]


def innermost_body(bodies: list[tuple[int, int]], idx: int) -> tuple[int, int] | None:
    c = _containing_bodies(bodies, idx)
    if not c:
        return None
    return min(c, key=lambda se: se[1] - se[0])


def outermost_body(bodies: list[tuple[int, int]], idx: int) -> tuple[int, int] | None:
    c = _containing_bodies(bodies, idx)
    if not c:
        return None
    return max(c, key=lambda se: se[1] - se[0])


def own_returns(text: str, body: tuple[int, int], bodies: list[tuple[int, int]]) -> list[int]:
    s, e = body
    out = []
    for i in find_keyword(text, "return"):
        if s < i < e and innermost_body(bodies, i) == body:
            out.append(i)
    return out


def is_jsx_render_fn(text: str, body: tuple[int, int], bodies: list[tuple[int, int]]) -> bool:
    """C'': function is a JSX render tree iff it has a JSX-opening return and no `return {` config/icon-props."""
    kinds = [classify_return(text, i) for i in own_returns(text, body, bodies)]
    return ("jsx" in kinds) and ("object" not in kinds)


def find_keyword(text: str, word: str):
    i = 0
    n = len(text)
    code = set(iter_code_indexes(text))
    while True:
        i = text.find(word, i)
        if i < 0:
            return
        if i in code:
            prev = text[i - 1] if i else " "
            nxt = text[i + len(word)] if i + len(word) < n else " "
            if not (prev.isalnum() or prev in "_$") and not (nxt.isalnum() or nxt in "_$"):
                yield i
        i += 1


def find_ops(text: str, op: str):
    code = set(iter_code_indexes(text))
    i = 0
    n = len(text)
    while True:
        i = text.find(op, i)
        if i < 0:
            return
        if i in code:
            yield i
        i += 1


# ----- scan -----

def scan_and_tern(text: str, is_tsx: bool) -> list[dict]:
    if not is_tsx:
        return []
    states: list[dict] = []
    code = set(iter_code_indexes(text))
    n = len(text)
    bodies = find_function_bodies(text)

    # AND
    for i in find_ops(text, "&&"):
        if inside_mutation_fn(text, i, bodies):
            continue
        after = i + 2
        ok, name = operand_is_jsx(text, after)
        if not ok:
            name = jsx_name_from_array_map(text, after)
            if not name:
                continue
        if name in FORBIDDEN_RENDER:
            continue
        cond = expr_before(text, i)
        if not cond:
            continue
        render = name if name else extract_jsx_name_from(text, after)
        if render in FORBIDDEN_RENDER:
            continue
        ln = line_of(text, i)
        states.append({"kind": "and-show", "line": ln, "cond": cond, "render": render, "branch": "shown", "idx": i})
        states.append(
            {
                "kind": "and-hide",
                "line": ln,
                "cond": f"!({cond})",
                "render": "null",
                "branch": "hidden",
                "idx": i,
            }
        )

    # TERN: `?` not `?.` / `??` / `?:` (optional prop)
    i = 0
    while True:
        i = text.find("?", i)
        if i < 0:
            break
        if i not in code:
            i += 1
            continue
        prev = text[i - 1] if i else ""
        if prev == "?":  # second char of `??`
            i += 1
            continue
        nxt = text[i + 1] if i + 1 < n else ""
        if nxt in "?.:" :  # ?.  ??  ?:
            i += 1
            continue
        if inside_mutation_fn(text, i, bodies):
            i += 1
            continue
        after = i + 1
        ok, name = operand_is_jsx(text, after)
        if not ok:
            i += 1
            continue
        cond = expr_before(text, i)
        if not cond:
            i += 1
            continue
        then_name = extract_jsx_name_from(text, after)
        if then_name in FORBIDDEN_RENDER:
            i += 1
            continue
        colon = _find_tern_colon(text, after, code)
        if colon is None:
            i += 1
            continue
        else_ok, else_name = operand_is_jsx(text, colon + 1)
        e = skip_ws_comments(text, colon + 1)
        is_null = text.startswith("null", e) and (e + 4 >= n or not (text[e + 4].isalnum() or text[e + 4] == "_"))
        if is_null:
            else_ok = True
            else_name = "null"
        elif else_ok:
            else_name = extract_jsx_name_from(text, colon + 1)
        else:
            # A': both branches must be JSX or null. Data constants are not terns.
            i += 1
            continue
        if else_name in FORBIDDEN_RENDER:
            i += 1
            continue
        ln = line_of(text, i)
        states.append({"kind": "tern-then", "line": ln, "cond": cond, "render": then_name, "branch": "then", "idx": i})
        states.append(
            {
                "kind": "tern-else",
                "line": ln,
                "cond": f"!({cond})",
                "render": else_name,
                "branch": "else",
                "idx": i,
            }
        )
        i += 1
    return states


def _find_tern_colon(text: str, start: int, code: set[int]) -> int | None:
    depth_p = depth_b = depth_c = depth_a = 0
    i = start
    n = len(text)
    while i < n:
        if i not in code:
            i += 1
            continue
        c = text[i]
        if c == "(":
            depth_p += 1
        elif c == ")":
            depth_p -= 1
            if depth_p < 0:
                return None
        elif c == "[":
            depth_b += 1
        elif c == "]":
            depth_b -= 1
        elif c == "{":
            depth_c += 1
        elif c == "}":
            depth_c -= 1
            if depth_c < 0:
                return None
        elif c == "<":
            # treat as generic/jsx open; do not track strictly
            pass
        elif c == "?" and depth_p == 0 and depth_b == 0 and depth_c == 0:
            nxt = text[i + 1] if i + 1 < n else ""
            if nxt not in "?.:":
                depth_a += 1
        elif c == ":" and depth_p == 0 and depth_b == 0 and depth_c == 0:
            if depth_a == 0:
                return i
            depth_a -= 1
        i += 1
    return None


def scan_if_ret(text: str) -> list[dict]:
    """C'': if-ret only inside a .tsx function that itself (and its outermost) is JSX-render."""
    bodies = find_function_bodies(text)
    render_ok = {body: is_jsx_render_fn(text, body, bodies) for body in bodies}
    states: list[dict] = []
    for i in find_keyword(text, "if"):
        j = skip_ws_comments(text, i + 2)
        if j >= len(text) or text[j] != "(":
            continue
        end_cond = skip_balanced(text, j, "(", ")")
        cond = clean_expr(text[j + 1 : end_cond - 1])
        body = skip_ws_comments(text, end_cond)
        # if (...) return …
        # if (...) { return … }
        candidates: list[int] = []
        if body < len(text) and text.startswith("return", body):
            candidates.append(body)
        elif body < len(text) and text[body] == "{":
            inner = skip_ws_comments(text, body + 1)
            if inner < len(text) and text.startswith("return", inner):
                candidates.append(inner)
        for ret in candidates:
            ok, name = is_ui_return(text, ret)
            if not ok:
                continue
            inner = innermost_body(bodies, ret)
            outer = outermost_body(bodies, ret)
            if inner is None or outer is None:
                continue
            # same function must open JSX; mixed `return {` config/icon-props → 0
            if not render_ok.get(inner):
                continue
            # hook/template nested in a data function (outer is not a JSX tree) → 0
            if inner != outer and not render_ok.get(outer):
                continue
            if not render_ok.get(outer):
                continue
            states.append(
                {
                    "kind": "if-ret",
                    "line": line_of(text, i),
                    "cond": cond,
                    "render": name,
                    "branch": "if",
                    "idx": i,
                    "ret_idx": ret,
                    "fn": inner,
                }
            )
    return states


def scan_default(text: str, if_rets: list[dict]) -> list[dict]:
    """Default is per-function, and only for C'' JSX-render functions that already have if-ret."""
    if not if_rets:
        return []
    bodies = find_function_bodies(text)
    by_fn: dict[tuple[int, int], list[dict]] = defaultdict(list)
    for s in if_rets:
        fn = s.get("fn") or innermost_body(bodies, s.get("ret_idx", s["idx"]))
        if fn is not None:
            by_fn[fn].append(s)
    out: list[dict] = []
    for fn, frs in by_fn.items():
        if not is_jsx_render_fn(text, fn, bodies):
            continue
        if_ret_idxs = {s.get("ret_idx") for s in frs}
        ui_returns: list[tuple[int, str]] = []
        for i in own_returns(text, fn, bodies):
            ok, name = is_ui_return(text, i)
            if ok:
                ui_returns.append((i, name))
        for idx, name in reversed(ui_returns):
            if idx in if_ret_idxs:
                continue
            out.append(
                {
                    "kind": "default",
                    "line": line_of(text, idx),
                    "cond": "前述 if-ret 均不成立（default return）",
                    "render": name,
                    "branch": "default",
                    "idx": idx,
                    "fn": fn,
                }
            )
            break
    return out


def scan_suspense(text: str, is_tsx: bool) -> list[dict]:
    if not is_tsx:
        return []
    states = []
    for m in re.finditer(r"<Suspense\b[^>]*\bfallback\s*=\s*\{?", text):
        # extract fallback child
        after = m.end()
        name = extract_jsx_name_from(text, after)
        if name in {"", "?"}:
            # fallback={ <PageLoading /> } or fallback={<PageLoading />}
            name = extract_jsx_name_from(text, after)
        if name in {"", "?"}:
            fb = re.search(r"fallback\s*=\s*\{?\s*<([A-Za-z][\w.]*)", text[m.start() : m.start() + 200])
            name = fb.group(1) if fb else "fallback"
        states.append(
            {
                "kind": "suspense",
                "line": line_of(text, m.start()),
                "cond": "Suspense fallback（子树未 ready）",
                "render": name,
                "branch": "fallback",
                "idx": m.start(),
            }
        )
    return states


def scan_file(p: Path) -> list[dict]:
    try:
        text = p.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []
    rp = rel(p)
    surface = surface_of(rp)
    stem = kebab(p.stem)
    is_tsx = p.suffix in {".tsx", ".jsx"}
    # B': .ts / .js extract ZERO rows. return null in a hook/lib is not a render branch.
    if not is_tsx:
        return []
    states: list[dict] = []
    states.extend(scan_and_tern(text, True))
    if_rets = scan_if_ret(text)
    states.extend(if_rets)
    states.extend(scan_default(text, if_rets))
    states.extend(scan_suspense(text, True))

    out = []
    for s in states:
        sid = f"state.{surface}.{stem}.{s['line']}{KIND_SUFFIX[s['kind']]}"
        out.append({**s, "id": sid, "file": rp, "surface": surface})
    return out


# ----- rest of pipeline (classification / md) -----

IMPORT_RE = re.compile(
    r"""(?:import\s+(?:type\s+)?(?:[^'"\n]+?\s+from\s+)?|export\s+(?:type\s+)?\*\s+from\s+|export\s+\{[^}]*\}\s+from\s+)['"]([^'"]+)['"]"""
    r"""|(?:import|require)\(\s*['"]([^'"]+)['"]\s*\)"""
)


def resolve_ts(base: Path, spec: str) -> Path | None:
    if spec.startswith("."):
        cand = (base.parent / spec).resolve()
        for o in (
            cand,
            cand.with_suffix(".ts"),
            cand.with_suffix(".tsx"),
            cand.with_suffix(".js"),
            cand / "index.ts",
            cand / "index.tsx",
        ):
            if o.is_file():
                return o
        return None
    m = re.match(r"@rocket\.chat/(ui-[a-z0-9-]+)", spec)
    if m:
        pkg = WORKSPACE / "packages" / m.group(1)
        for sub in ("src/index.ts", "src/index.tsx", "index.ts"):
            p = pkg / sub
            if p.is_file():
                return p
    return None


def import_closure() -> set[str]:
    entries = [WORKSPACE / "apps/meteor/client/main.ts"]
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
            if not (nrp.startswith("apps/meteor/client/") or "/client/" in nrp or nrp.startswith("packages/ui-")):
                continue
            if file_class(nxt) != "candidate":
                continue
            stack.append(nxt)
    return seen


def classify_all(files: list[Path]) -> dict[str, str]:
    return {rel(p): file_class(p) for p in files}


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
        ("app/slashcommand", "偶然 slash 命令面"),
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
    if any(x in c for x in ("isloading", "ispending", "isfetching", "isinitial")):
        bits.append("等查询 in-flight")
    if any(x in c for x in ("iserror", "error", "iserr")):
        bits.append("让该查询/mutation 失败")
    if any(x in c for x in ("isempty", "length === 0", "length==0", "!data", "!items", "noresults")):
        bits.append("空列表/无数据")
    if "permission" in c or "haspermission" in c:
        bits.append("切换对应权限")
    if "license" in c:
        bits.append("EE license 开/关")
    if "anonymous" in c:
        bits.append("匿名读")
    if any(x in c for x in ("e2e", "encrypted")):
        bits.append("房间加密开")
    if "federat" in c:
        bits.append("联邦房间")
    if any(x in c for x in ("readonly", "archived")):
        bits.append("只读/归档房")
    if "embedded" in c:
        bits.append("embedded layout")
    return ("；" + "；".join(bits)) if bits else ""


def infer_related(cond: str, text_around: str) -> str:
    keys = []
    for m in re.finditer(r"['\"]([A-Za-z][A-Za-z0-9_.-]{2,80})['\"]", cond + " " + text_around):
        k = m.group(1)
        if "_" in k or k.startswith(("view-", "create-", "manage-", "edit-", "delete-", "access-")):
            keys.append(k)
        if k.startswith(("Accounts_", "Message_", "Omnichannel_", "Livechat_")):
            keys.append(k)
    seen: list[str] = []
    for k in keys:
        if k not in seen:
            seen.append(k)
    return "；".join(seen[:4]) if seen else "（无）"


def unreachable_reason(cond: str) -> str | None:
    cl = cond.strip().lower()
    if cl in {"false", "!true"} or re.match(r"^false\b", cl):
        return "条件字面量恒假"
    return None


def build_rows(files: list[Path], closure: set[str]) -> tuple[list[dict], dict[str, str]]:
    classes = classify_all(files)
    rows: list[dict] = []
    per_file_kind: dict[str, str] = {}
    for p in files:
        rp = rel(p)
        cls = classes[rp]
        if cls != "candidate":
            per_file_kind[rp] = cls
            continue
        st = scan_file(p)
        if not st:
            per_file_kind[rp] = "jsx-linear" if p.suffix in {".tsx", ".jsx"} else "no-jsx"
            continue
        per_file_kind[rp] = "jsx-branch"
        for s in st:
            reason = unreachable_reason(s["cond"])
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
    seen: dict[str, bool] = {}
    for r in rows:
        if r["id"] in seen:
            h = hashlib.sha1(f"{r['src']}:{r['kind']}:{r['cond']}".encode()).hexdigest()[:4]
            r["id"] = r["id"] + h
        seen[r["id"]] = True
    rows.sort(key=lambda r: (r["surface"], r["file"], r["line"], r["kind"]))
    return rows, per_file_kind


def md_escape(s: str) -> str:
    return s.replace("|", "¦").replace("\n", " ")


LIVE_OVERLAY = Path(__file__).with_name("live-08-states.json")


def apply_live_overlay(rows: list[dict]) -> None:
    """Tag overlay only. Does not add/remove/reorder extracted states."""
    if not LIVE_OVERLAY.exists():
        return
    data = json.loads(LIVE_OVERLAY.read_text(encoding="utf-8"))
    promoted = data.get("promoted") or []
    by_id: dict[str, dict] = {}
    for item in promoted:
        sid = item.get("id")
        if not sid:
            raise SystemExit("LIVE_OVERLAY_MISSING_ID")
        if item.get("honesty") != "[实测]":
            raise SystemExit("LIVE_OVERLAY_BAD_HONESTY " + str(sid))
        by_id[sid] = item
    known = {r["id"] for r in rows}
    unknown = sorted(set(by_id) - known)
    if unknown:
        raise SystemExit("LIVE_UNKNOWN_IDS " + " ".join(unknown[:12]))
    for r in rows:
        ov = by_id.get(r["id"])
        if not ov:
            continue
        r["honesty"] = "[实测]"
        if ov.get("arrival"):
            r["arrival"] = ov["arrival"]


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


SURFACE_ORDER = [
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


def emit_markdown_tables(rows: list[dict]) -> str:
    parts: list[str] = []
    by: dict[str, list] = defaultdict(list)
    for r in rows:
        by[r["surface"]].append(r)
    surfaces = [s for s in SURFACE_ORDER if s in by]
    surfaces += [s for s in sorted(by) if s not in surfaces]
    for s in surfaces:
        chunk = by[s]
        parts.append(f"\n### {s}（{len(chunk)}）\n\n")
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
    """Assemble markdown from a clean template. No f-string over prose that contains braces."""
    c = Counter(kinds.values())
    h = Counter(r["honesty"] for r in rows)
    knd = Counter(r["kind"] for r in rows)
    by_surf = Counter(r["surface"] for r in rows)
    surf_bits = " + ".join(str(n) for _, n in sorted(by_surf.items()))
    class_eq = "{jb}+{jl}+{nj}+{sp}+{st}+{sv}".format(
        jb=c.get("jsx-branch", 0),
        jl=c.get("jsx-linear", 0),
        nj=c.get("no-jsx", 0),
        sp=c.get("excluded-spec", 0),
        st=c.get("excluded-stories", 0),
        sv=c.get("excluded-server", 0),
    )
    kind_eq = "{a0}+{a1}+{t0}+{t1}+{i}+{d}+{s}".format(
        a0=knd.get("and-show", 0),
        a1=knd.get("and-hide", 0),
        t0=knd.get("tern-then", 0),
        t1=knd.get("tern-else", 0),
        i=knd.get("if-ret", 0),
        d=knd.get("default", 0),
        s=knd.get("suspense", 0),
    )
    nfiles = len(files)
    nstates = len(rows)
    tokens = {
        "SHA": SHA,
        "NFILES": str(nfiles),
        "NSTATES": str(nstates),
        "JB": str(c.get("jsx-branch", 0)),
        "JL": str(c.get("jsx-linear", 0)),
        "NJ": str(c.get("no-jsx", 0)),
        "SP": str(c.get("excluded-spec", 0)),
        "ST": str(c.get("excluded-stories", 0)),
        "SV": str(c.get("excluded-server", 0)),
        "CLASS_EQ": class_eq,
        "A0": str(knd.get("and-show", 0)),
        "A1": str(knd.get("and-hide", 0)),
        "T0": str(knd.get("tern-then", 0)),
        "T1": str(knd.get("tern-else", 0)),
        "IR": str(knd.get("if-ret", 0)),
        "DF": str(knd.get("default", 0)),
        "SU": str(knd.get("suspense", 0)),
        "KIND_EQ": kind_eq,
        "H_PEND": str(h.get("[待渲染实测]", 0)),
        "H_UNR": str(h.get("[不可达]", 0)),
        "H_LIVE": str(h.get("[实测]", 0)),
        "H_SUM": str(sum(h.values())),
        "SURF_EQ": surf_bits,
    }
    header = """# Round 2 / Vol.8 — UI 状态闭集

冻结树：**仅** `@@SHA@@`（短 SHA `e519470`）。**不是** `develop`。`file:line` 均相对此 SHA。

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
# expect @@SHA@@

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
| jsx-branch | @@JB@@ |
| jsx-linear | @@JL@@ |
| no-jsx | @@NJ@@ |
| excluded-spec | @@SP@@ |
| excluded-stories | @@ST@@ |
| excluded-server | @@SV@@ |
| **TARGET_FILES** | **@@NFILES@@** |

等式：`@@CLASS_EQ@@ = @@NFILES@@`。

每个目标文件由 `python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --files` 打出 `class<TAB>relpath`。`CLASS_SUM` 必须等于 `TARGET_FILES`。无第三类、无漏文件。

## 4. 状态闭合（不是功能总数）

下表是 **分支 kind 计数**，不要加总成功能数。

| 分支 kind | 数 |
| --- | ---: |
| and-show | @@A0@@ |
| and-hide | @@A1@@ |
| tern-then | @@T0@@ |
| tern-else | @@T1@@ |
| if-ret | @@IR@@ |
| default | @@DF@@ |
| suspense | @@SU@@ |
| **STATES** | **@@NSTATES@@** |

kind 等式（只核行数）：`@@KIND_EQ@@ = @@NSTATES@@`。

| 诚实 | 数 |
| --- | ---: |
| [待渲染实测] | @@H_PEND@@ |
| [不可达] | @@H_UNR@@ |
| [实测] | @@H_LIVE@@ |

`[待渲染实测]+[不可达]+[实测] = @@H_SUM@@`。本卷只晋级已截图分支，**不是** live-closed。

表面分表行数之和必须等于 STATES：`@@SURF_EQ@@ = @@NSTATES@@`。

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

Walk 并截图：login、account security / profile / preferences、home、`#general`（header / composer / message / toolbox）、channel info、members、directory channels / users / teams、Create channel / team / DM / discussion 弹层、account security 2FA（TOTP / Email）展开。

未打开因而不晋级：toolbox More 菜单内层项、Create 弹层内 FieldError / broadcast hint、DM 弹层无 errors.users（0 行）、TOTP QR / backup codes（未开启）、E2EE accordion、Video/Voice call chrome、Game Center、Outlook、VoIP 组、Apps inject、federation External、SAML。

截图目录：`docs/qa/pm-feature-atlas/round-2/shots/`。标签回写：同目录 `live-08-states.json` 只改诚实列，不改抽取器、不改 4221 行集。未点击可达行仍 `[待渲染实测]`。不要用 `[不可达]` 清零。本卷 **不是** live-closed。

## 6. 闭集表（一行一分支）

数据行 **@@NSTATES@@**。排序：surface / file / line / kind。
"""
    for key, val in tokens.items():
        header = header.replace("@@" + key + "@@", val)

    footer = """
## 7. 闭合判据（拒收条件：数字对不上）

在冻结提交上重跑。不要用 develop。

```bash
git rev-parse HEAD
# expect @@SHA@@

python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --verify
# TARGET_FILES @@NFILES@@
# CLASS_SUM @@NFILES@@
# STATES @@NSTATES@@
# UNIQUE_IDS @@NSTATES@@
# VERIFY_OK @@NFILES@@ @@NSTATES@@

rg -c '^\\| `state\\.' docs/qa/pm-feature-atlas/round-2/08-states.md
# expect @@NSTATES@@

rg -o '^\\| `state\\.[^`]+' docs/qa/pm-feature-atlas/round-2/08-states.md | sort | uniq | wc -l
# expect @@NSTATES@@
```

文件闭合（无漏文件）：

```bash
python3 docs/qa/pm-feature-atlas/round-2/export-08-states.py --files | wc -l
# expect @@NFILES@@

python3 - <<'PY'
import importlib.util, subprocess
spec = importlib.util.spec_from_file_location('e', 'docs/qa/pm-feature-atlas/round-2/export-08-states.py')
e = importlib.util.module_from_spec(spec)
spec.loader.exec_module(e)
files = {e.rel(p) for p in e.target_files()}
listed = {
    line.split('\\t', 1)[1]
    for line in subprocess.check_output(
        ['python3', 'docs/qa/pm-feature-atlas/round-2/export-08-states.py', '--files'],
        text=True,
    ).splitlines()
    if '\\t' in line
}
print('SYMDIFF', sorted(files ^ listed)[:10], 'len', len(files ^ listed))
print('COUNT', len(files), len(listed))
PY
# expect SYMDIFF [] ; COUNT @@NFILES@@ @@NFILES@@
```

泄漏点必须缺席：

```bash
rg -n 'useSearchItems\\.ts:156|useSearchItems\\.ts:21|useAISearchRooms\\.ts:34|useFingerprintChange\\.tsx:65|useQuickActions\\.tsx:268|useQuickActions\\.tsx:279|useQuickActions\\.tsx:289|useQuickActions\\.tsx:295|useRoomList\\.ts:81|useRoomList\\.ts:167' \\
  docs/qa/pm-feature-atlas/round-2/08-states.md
# expect 0 matches

# 表体不得出现 .ts:line（§1 提到 exporter 路径除外）
rg '^\\| `state\\.' docs/qa/pm-feature-atlas/round-2/08-states.md | rg '\\.ts:[0-9]+' || true
# expect 0 matches

# 条件列不得残留 JSX 的 leading >
rg '^\\| `state\\.' docs/qa/pm-feature-atlas/round-2/08-states.md | rg '\\| > ' || true
# expect 0 matches

# C''：toolbar/config hook 不得进表
rg '^\\| `state\\.' docs/qa/pm-feature-atlas/round-2/08-states.md | rg 'useNewDiscussionMessageAction|usePinMessageAction|useReadReceiptsDetailsAction|useReportMessageAction|useShowMessageReactionsAction|useWebDAVMessageAction|useAvatarTemplate|useRoomIcon|useShowSettingAlerts|useRoomLeave|useExportMessagesAsPDFMutation' || true
# expect 0 matches

# A'：render 不得是 JS 内置 / 数据常量
rg '^\\| `state\\.' docs/qa/pm-feature-atlas/round-2/08-states.md | rg '\\| (Boolean\\|Array\\|String\\|Number\\|Object\\|ROOM_INTIAL_VALUE) \\|' || true
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
"""
    for key, val in tokens.items():
        footer = footer.replace("@@" + key + "@@", val)
    return header + emit_markdown_tables(rows) + footer


LEAK_SITES = [
    "useSearchItems.ts:156",
    "useSearchItems.ts:21",
    "useAISearchRooms.ts:34",
    "useFingerprintChange.tsx:65",
    "useQuickActions.tsx:268",
    "useQuickActions.tsx:279",
    "useQuickActions.tsx:289",
    "useQuickActions.tsx:295",
    "useRoomList.ts:81",
    "useRoomList.ts:167",
]

TS_JUNK = (
    "minimongo/Cursor.ts",
    "minimongo/LocalCollection.ts",
    "minimongo/common.ts",
    "lib/e2ee/rocketchat.e2e.ts",
    "lib/getPageMeta.ts",
    "hooks/useFormatMemorySize.ts",
    "ClassificationBanner/lib/engine.ts",
    "StepsLinkedList.ts",
    "useCopyAction.ts",
    "useDeleteMessageAction.ts",
    "useEditMessageAction.ts",
    "useFollowMessageAction.ts",
    "useMarkAsUnreadMessageAction.ts",
    "useReplyInDMAction.ts",
    "useStarMessageAction.ts",
    "useTranslateAction.ts",
    "useUnFollowMessageAction.ts",
    "useUnpinMessageAction.ts",
    "useUnstarMessageAction.ts",
    "useViewOriginalTranslationAction.ts",
    "useLoadSurroundingMessages.ts",
    "useTryToJumpToMessage.ts",
    "useTryToJumpToThreadMessage.ts",
    "useAudioStream.ts",
    "useMediaSessionInstance.ts",
    "useScreenShareStreams.ts",
    "DraggableCore.ts",
    "useOmnichannelPrioritiesConfig.ts",
    "useLicenseLimitsByBehavior.ts",
    "useCurrentModal.ts",
    "SurfaceRenderer.ts",
    "renderLayoutBlock.ts",
)

TSX_JUNK = (
    "useNewDiscussionMessageAction.tsx",
    "usePinMessageAction.tsx",
    "useReadReceiptsDetailsAction.tsx",
    "useReportMessageAction.tsx",
    "useShowMessageReactionsAction.tsx",
    "useWebDAVMessageAction.tsx",
    "useAvatarTemplate.tsx",
    "useRoomIcon.tsx",
    "useShowSettingAlerts.tsx",
    "useRoomLeave.tsx",
    "useExportMessagesAsPDFMutation.tsx",
)

KEEP_JSX = (
    "ContentForDays.tsx",
    "AdminUserForm.tsx",
    "AdminUserInfoActions.tsx",
    "normalizeThreadMessage.tsx",
)

KEEP_SITES = (
    "useQuickActions.tsx:237",
    "useSortModeItems.tsx:32",
    "useSortModeItems.tsx:40",
    "AdminUserForm.tsx:199",
    "AdminUserInfoActions.tsx:33",
    "normalizeThreadMessage.tsx",
    "ContentForDays.tsx:60",
    "useMarketPlaceMenu.tsx:43",
    "useMarketPlaceMenu.tsx:44",
    "useStatusItems.tsx:110",
    "useStatusItems.tsx:111",
    "useThreadRoomAction.tsx:60",
    "useAppMenu.tsx:361",
    "useUserStatusTooltip.tsx:13",
    "AppDetailsPageHeader.tsx:48",
    "AppDetailsPageTabs.tsx:59",
)


def assert_no_leaks(rows: list[dict]) -> None:
    bad = [r["src"] for r in rows if any(site in r["src"] for site in LEAK_SITES)]
    if bad:
        raise SystemExit("LEAK_SITES_PRESENT " + " ".join(sorted(set(bad))))
    ts_rows = [r["src"] for r in rows if re.search(r"\.ts:\d+$", r["src"])]
    if ts_rows:
        raise SystemExit("TS_ROWS_PRESENT " + " ".join(ts_rows[:12]))
    junk = [r["src"] for r in rows if any(name in r["file"] for name in TS_JUNK)]
    if junk:
        raise SystemExit("TS_JUNK_PRESENT " + " ".join(sorted(set(junk))[:12]))
    gt = [f"{r['src']} cond={r['cond']!r}" for r in rows if r["cond"].lstrip().startswith(">")]
    if gt:
        raise SystemExit("LEADING_GT_COND " + " ; ".join(gt[:8]))
    tsx_junk = [r["src"] for r in rows if any(name in r["file"] for name in TSX_JUNK)]
    if tsx_junk:
        raise SystemExit("TSX_JUNK_PRESENT " + " ".join(sorted(set(tsx_junk))[:12]))
    missing_keep = [name for name in KEEP_JSX if not any(name in r["file"] for r in rows)]
    if missing_keep:
        raise SystemExit("KEEP_JSX_MISSING " + " ".join(missing_keep))
    missing_sites = [site for site in KEEP_SITES if not any(site in r["src"] or site in r["file"] for r in rows)]
    if missing_sites:
        raise SystemExit("KEEP_SITES_MISSING " + " ".join(missing_sites))
    forbidden = [f"{r['src']} render={r['render']}" for r in rows if r["render"] in FORBIDDEN_RENDER]
    if forbidden:
        raise SystemExit("FORBIDDEN_RENDER " + " ; ".join(forbidden[:12]))
    if not any(r["render"] == "BundleChips" and "AppDetailsPageHeader.tsx" in r["file"] for r in rows):
        raise SystemExit("KEEP_JSX_MISSING BundleChips@AppDetailsPageHeader")
    if not any(r["render"] == "TabsItem" and "AppDetailsPageTabs.tsx" in r["file"] for r in rows):
        raise SystemExit("KEEP_JSX_MISSING TabsItem@AppDetailsPageTabs")


def sample_and_show(rows: list[dict], n: int = 20) -> None:
    shows = [r for r in rows if r["kind"] == "and-show"]
    print("AND_SHOW_SAMPLE", min(n, len(shows)), "of", len(shows))
    for r in shows[:n]:
        print(f"  {r['src']}  cond={r['cond'][:60]!r}  render={r['render']!r}")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", action="store_true")
    ap.add_argument("--files", action="store_true")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--tables", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--sample-and", action="store_true")
    ap.add_argument("--write-md", metavar="PATH")
    args = ap.parse_args(argv)
    files = target_files()
    closure = import_closure()
    rows, kinds = build_rows(files, closure)
    apply_live_overlay(rows)
    if args.count or args.verify or args.write_md or not any([args.files, args.json, args.tables, args.sample_and]):
        emit_count(files, rows, kinds, closure)
    if args.verify:
        assert len(files) == len(kinds), (len(files), len(kinds))
        assert len(rows) == len({r["id"] for r in rows})
        assert_no_leaks(rows)
        print("VERIFY_OK", len(files), len(rows))
    if args.files:
        emit_files(kinds)
    if args.json:
        json.dump({"rows": rows, "kinds": kinds}, sys.stdout)
    if args.tables:
        sys.stdout.write(emit_markdown_tables(rows))
    if args.sample_and:
        sample_and_show(rows)
    if args.write_md:
        Path(args.write_md).write_text(render_full_md(files, rows, kinds, closure), encoding="utf-8")
        print("WROTE", args.write_md)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
