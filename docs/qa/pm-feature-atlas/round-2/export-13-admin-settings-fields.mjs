#!/usr/bin/env node
/**
 * Mechanical exporter for Round 2 / Volume 13 — admin settings-registry fields.
 *
 * Run on frozen commit e519470d35b6caf5b228d81aef41c86aab3051f4 only.
 * Reviewer re-runs this file; do not use develop line numbers.
 *
 * Usage (repo root):
 *   node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --count
 *   node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --json > /tmp/13-fields.json
 *   node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --client-read
 *   node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --markdown
 *   node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --verify
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const SKIP_FILE_RE =
	/(?:^|\/)(?:tests|node_modules|\.meteor)(?:\/)|(?:\.tests\.ts$|\.spec\.ts$|\.spec\.tsx$)/;

const SKIP_BASENAMES = new Set([
	'SettingsRegistry.ts',
	'CachedSettings.ts',
	'Middleware.ts',
	'applyMiddlewares.ts',
	'cached.ts',
	'raw.ts',
	'checkSettingValueBonds.ts',
	'definitions.ts',
	'startup.ts',
]);

/** Settings index.ts only wraps add/addGroup — not a field site. */
const SKIP_PATHS = new Set(['apps/meteor/server/settings/index.ts']);

export function lineOf(src, index) {
	return src.slice(0, index).split('\n').length;
}

function isIdent(c) {
	return /[A-Za-z0-9_$]/.test(c);
}

/**
 * Scan source with string/comment awareness. Returns {args, end} where end is
 * the index after the matching ')'. start is the index of '('.
 */
export function scanCall(src, start) {
	if (src[start] !== '(') throw new Error(`scanCall expected '(' at ${start}`);
	let i = start + 1;
	const args = [];
	let cur = '';
	let paren = 1;
	let brace = 0;
	let bracket = 0;
	let mode = 'code'; // code | sq | dq | tmpl | line | block
	let tmplExpr = 0;

	const flush = () => {
		args.push(cur.trim());
		cur = '';
	};

	while (i < src.length && paren > 0) {
		const c = src[i];
		const n = src[i + 1];

		if (mode === 'line') {
			cur += c;
			if (c === '\n') mode = 'code';
			i += 1;
			continue;
		}
		if (mode === 'block') {
			cur += c;
			if (c === '*' && n === '/') {
				cur += n;
				i += 2;
				mode = 'code';
				continue;
			}
			i += 1;
			continue;
		}
		if (mode === 'sq') {
			cur += c;
			if (c === '\\') {
				cur += src[i + 1] ?? '';
				i += 2;
				continue;
			}
			if (c === "'") mode = 'code';
			i += 1;
			continue;
		}
		if (mode === 'dq') {
			cur += c;
			if (c === '\\') {
				cur += src[i + 1] ?? '';
				i += 2;
				continue;
			}
			if (c === '"') mode = 'code';
			i += 1;
			continue;
		}
		if (mode === 'tmpl') {
			cur += c;
			if (c === '\\') {
				cur += src[i + 1] ?? '';
				i += 2;
				continue;
			}
			if (c === '$' && n === '{') {
				cur += n;
				i += 2;
				tmplExpr += 1;
				continue;
			}
			if (tmplExpr > 0) {
				if (c === '{') tmplExpr += 1;
				else if (c === '}') tmplExpr -= 1;
				i += 1;
				continue;
			}
			if (c === '`') mode = 'code';
			i += 1;
			continue;
		}

		// code
		if (c === '/' && n === '/') {
			cur += c + n;
			i += 2;
			mode = 'line';
			continue;
		}
		if (c === '/' && n === '*') {
			cur += c + n;
			i += 2;
			mode = 'block';
			continue;
		}
		if (c === "'") {
			cur += c;
			i += 1;
			mode = 'sq';
			continue;
		}
		if (c === '"') {
			cur += c;
			i += 1;
			mode = 'dq';
			continue;
		}
		if (c === '`') {
			cur += c;
			i += 1;
			mode = 'tmpl';
			continue;
		}

		if (c === '(') paren += 1;
		else if (c === ')') {
			paren -= 1;
			if (paren === 0) {
				flush();
				i += 1;
				break;
			}
		} else if (c === '{') brace += 1;
		else if (c === '}') brace -= 1;
		else if (c === '[') bracket += 1;
		else if (c === ']') bracket -= 1;

		if (c === ',' && paren === 1 && brace === 0 && bracket === 0) {
			flush();
			i += 1;
			continue;
		}

		cur += c;
		i += 1;
	}

	return { args, end: i };
}

function findMatchingBrace(src, openIdx) {
	if (src[openIdx] !== '{') return -1;
	const { end } = scanCall(src.slice(0, openIdx) + '(' + src.slice(openIdx + 1), openIdx);
	// scanCall treated '(' as open; we swapped '{'→'(' only at openIdx.
	// Easier dedicated walk:
	let i = openIdx + 1;
	let depth = 1;
	let mode = 'code';
	let tmplExpr = 0;
	while (i < src.length && depth > 0) {
		const c = src[i];
		const n = src[i + 1];
		if (mode === 'line') {
			if (c === '\n') mode = 'code';
			i += 1;
			continue;
		}
		if (mode === 'block') {
			if (c === '*' && n === '/') {
				i += 2;
				mode = 'code';
				continue;
			}
			i += 1;
			continue;
		}
		if (mode === 'sq' || mode === 'dq') {
			if (c === '\\') {
				i += 2;
				continue;
			}
			if ((mode === 'sq' && c === "'") || (mode === 'dq' && c === '"')) mode = 'code';
			i += 1;
			continue;
		}
		if (mode === 'tmpl') {
			if (c === '\\') {
				i += 2;
				continue;
			}
			if (c === '$' && n === '{') {
				i += 2;
				tmplExpr += 1;
				continue;
			}
			if (tmplExpr > 0) {
				if (c === '{') tmplExpr += 1;
				else if (c === '}') tmplExpr -= 1;
				i += 1;
				continue;
			}
			if (c === '`') mode = 'code';
			i += 1;
			continue;
		}
		if (c === '/' && n === '/') {
			i += 2;
			mode = 'line';
			continue;
		}
		if (c === '/' && n === '*') {
			i += 2;
			mode = 'block';
			continue;
		}
		if (c === "'") {
			mode = 'sq';
			i += 1;
			continue;
		}
		if (c === '"') {
			mode = 'dq';
			i += 1;
			continue;
		}
		if (c === '`') {
			mode = 'tmpl';
			i += 1;
			continue;
		}
		if (c === '{') depth += 1;
		else if (c === '}') depth -= 1;
		i += 1;
	}
	return i - 1;
}

function firstNonWs(src, i) {
	while (i < src.length && /\s/.test(src[i])) i += 1;
	return i;
}

function parseStringish(expr) {
	const t = expr.trim();
	const m1 = t.match(/^(['"])([\s\S]*)\1$/);
	if (m1) return { kind: 'lit', value: m1[2] };
	const m2 = t.match(/^`([\s\S]*)`$/);
	if (m2) {
		if (m2[1].includes('${')) return { kind: 'tmpl', value: t };
		return { kind: 'lit', value: m2[1] };
	}
	return { kind: 'expr', value: t };
}

function collapseWs(s) {
	return s.replace(/\s+/g, ' ').trim();
}

export function parseObjectProps(objSrc) {
	const t = objSrc.trim();
	if (!t.startsWith('{')) return {};
	const innerStart = 0;
	// Use scan of top-level props
	const src = t;
	const open = src.indexOf('{');
	const close = findMatchingBrace(src, open);
	const inner = src.slice(open + 1, close);
	const props = {};
	let i = 0;
	while (i < inner.length) {
		i = firstNonWs(inner, i);
		if (i >= inner.length) break;
		if (inner.startsWith('//', i)) {
			const nl = inner.indexOf('\n', i);
			i = nl === -1 ? inner.length : nl + 1;
			continue;
		}
		if (inner.startsWith('/*', i)) {
			const end = inner.indexOf('*/', i);
			i = end === -1 ? inner.length : end + 2;
			continue;
		}
		if (inner[i] === ',' || inner[i] === ';') {
			i += 1;
			continue;
		}
		const keyMatch = inner.slice(i).match(/^([A-Za-z_$][\w$]*|['"][^'"]+['"])\s*:/);
		if (!keyMatch) {
			i += 1;
			continue;
		}
		const rawKey = keyMatch[1];
		const key = rawKey.replace(/^['"]|['"]$/g, '');
		i += keyMatch[0].length;
		i = firstNonWs(inner, i);
		// value until top-level comma
		const fake = '(' + inner.slice(i);
		const scanned = scanCall(fake, 0);
		// scanCall splits by comma at paren=1. We only want the first "arg" as the value,
		// but a value may contain commas inside braces. The fake '(' makes the whole rest
		// one call; first comma at depth 1 ends the value.
		let value = scanned.args[0] ?? '';
		// If scanCall consumed until ')', the rest of inner after this value+comma
		const consumed = (() => {
			// reconstruct: we need how many chars of inner were the value
			// scanned.end is relative to fake, which is '(' + inner.slice(i)
			// scanned.end points after ')'. That's not right for comma-separated props.
			return null;
		})();
		void consumed;
		// Manual: from i, read until comma at depth 0
		let j = i;
		let paren = 0;
		let brace = 0;
		let bracket = 0;
		let mode = 'code';
		let tmplExpr = 0;
		while (j < inner.length) {
			const c = inner[j];
			const n = inner[j + 1];
			if (mode === 'line') {
				if (c === '\n') mode = 'code';
				j += 1;
				continue;
			}
			if (mode === 'block') {
				if (c === '*' && n === '/') {
					j += 2;
					mode = 'code';
					continue;
				}
				j += 1;
				continue;
			}
			if (mode === 'sq' || mode === 'dq') {
				if (c === '\\') {
					j += 2;
					continue;
				}
				if ((mode === 'sq' && c === "'") || (mode === 'dq' && c === '"')) mode = 'code';
				j += 1;
				continue;
			}
			if (mode === 'tmpl') {
				if (c === '\\') {
					j += 2;
					continue;
				}
				if (c === '$' && n === '{') {
					j += 2;
					tmplExpr += 1;
					continue;
				}
				if (tmplExpr > 0) {
					if (c === '{') tmplExpr += 1;
					else if (c === '}') tmplExpr -= 1;
					j += 1;
					continue;
				}
				if (c === '`') mode = 'code';
				j += 1;
				continue;
			}
			if (c === '/' && n === '/') {
				j += 2;
				mode = 'line';
				continue;
			}
			if (c === '/' && n === '*') {
				j += 2;
				mode = 'block';
				continue;
			}
			if (c === "'") {
				mode = 'sq';
				j += 1;
				continue;
			}
			if (c === '"') {
				mode = 'dq';
				j += 1;
				continue;
			}
			if (c === '`') {
				mode = 'tmpl';
				j += 1;
				continue;
			}
			if (c === '(') paren += 1;
			else if (c === ')') paren -= 1;
			else if (c === '{') brace += 1;
			else if (c === '}') brace -= 1;
			else if (c === '[') bracket += 1;
			else if (c === ']') bracket -= 1;
			else if (c === ',' && paren === 0 && brace === 0 && bracket === 0) break;
			j += 1;
		}
		value = inner.slice(i, j).trim();
		props[key] = value;
		i = j + 1;
	}
	return props;
}

function evalStringProp(raw, constMap) {
	if (raw == null) return undefined;
	const parsed = parseStringish(raw);
	if (parsed.kind === 'lit') return parsed.value;
	if (parsed.kind === 'tmpl') return parsed.value;
	if (constMap && constMap.has(parsed.value)) return constMap.get(parsed.value);
	return parsed.value;
}

function evalPublic(raw) {
	if (raw == null) return 'no';
	const t = raw.trim();
	if (t === 'true') return 'yes';
	if (t === 'false') return 'no';
	return t;
}

function fileConstStringMap(src) {
	const map = new Map();
	const re = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(['"])([^'"]*)\2/g;
	let m;
	while ((m = re.exec(src))) {
		map.set(m[1], m[3]);
	}
	return map;
}

function findCallStarts(src, re) {
	const out = [];
	let m;
	const r = new RegExp(re, 'g');
	while ((m = r.exec(src))) {
		out.push({ index: m.index, match: m[0] });
	}
	return out;
}

export function callbackBodyRange(src, callStartParen) {
	const { end } = scanCall(src, callStartParen);
	const callInner = src.slice(callStartParen, end);
	const fn = callInner.search(/function(?:\s+[A-Za-z_$][\w$]*)?\s*\([^)]*\)\s*\{/);
	if (fn !== -1) {
		const absFn = callStartParen + fn;
		const brace = src.indexOf('{', absFn);
		const close = findMatchingBrace(src, brace);
		if (brace >= 0 && close >= brace) return { start: brace, end: close };
	}
	const arrow = callInner.search(/=>\s*\{/);
	if (arrow !== -1) {
		const abs = callStartParen + arrow;
		const brace = src.indexOf('{', abs);
		const close = findMatchingBrace(src, brace);
		if (brace >= 0 && close >= brace) return { start: brace, end: close };
	}
	return null;
}

export function collectScopes(src) {
	const scopes = [];
	const addGroupRe = /(?:settingsRegistry|this)\.addGroup\s*\(/g;
	let m;
	while ((m = addGroupRe.exec(src))) {
		const paren = m.index + m[0].length - 1;
		const { args } = scanCall(src, paren);
		const name = evalStringProp(args[0], null);
		const body = callbackBodyRange(src, paren);
		if (body && name) {
			scopes.push({ kind: 'group', value: name, start: body.start, end: body.end });
		}
	}
	const sectionRe = /this\.section\s*\(/g;
	while ((m = sectionRe.exec(src))) {
		const paren = m.index + m[0].length - 1;
		const { args } = scanCall(src, paren);
		const name = evalStringProp(args[0], null);
		const body = callbackBodyRange(src, paren);
		if (body && name) {
			scopes.push({ kind: 'section', value: name, start: body.start, end: body.end });
		}
	}
	const withRe = /this\.with\s*\(/g;
	while ((m = withRe.exec(src))) {
		const paren = m.index + m[0].length - 1;
		const { args } = scanCall(src, paren);
		const props = parseObjectProps(args[0] || '');
		const body = callbackBodyRange(src, paren);
		if (body) {
			scopes.push({ kind: 'with', value: props, start: body.start, end: body.end });
		}
	}
	return scopes;
}

function scopesAt(scopes, pos) {
	return scopes.filter((s) => pos >= s.start && pos <= s.end);
}

function resolveGroupSection(scopes, pos, optProps, constMap) {
	const enc = scopesAt(scopes, pos);
	let group;
	let section;
	let withPublic;
	for (const s of enc) {
		if (s.kind === 'group') group = s.value;
		if (s.kind === 'section') section = s.value;
		if (s.kind === 'with') {
			if (s.value.group) group = evalStringProp(s.value.group, constMap);
			if (s.value.section) section = evalStringProp(s.value.section, constMap);
			if (s.value.public) withPublic = s.value.public;
		}
	}
	if (optProps.group) group = evalStringProp(optProps.group, constMap);
	if (optProps.section) section = evalStringProp(optProps.section, constMap);
	return { group: group || '', section: section || '', withPublic };
}

function shouldSkipFile(rel) {
	if (SKIP_FILE_RE.test(rel)) return true;
	if (SKIP_PATHS.has(rel)) return true;
	if (SKIP_BASENAMES.has(path.basename(rel))) return true;
	return false;
}

function walkFiles(dir, acc = []) {
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return acc;
	}
	for (const e of entries) {
		const full = path.join(dir, e.name);
		const rel = path.relative(ROOT, full).replaceAll('\\', '/');
		if (e.isDirectory()) {
			if (e.name === 'node_modules' || e.name === '.git' || e.name === 'tests' || e.name === 'dist') continue;
			walkFiles(full, acc);
			continue;
		}
		if (!e.isFile()) continue;
		if (!/\.(ts|tsx|js|mjs)$/.test(e.name)) continue;
		if (shouldSkipFile(rel)) continue;
		acc.push(rel);
	}
	return acc;
}

function extractAddSites(rel) {
	const abs = path.join(ROOT, rel);
	const src = fs.readFileSync(abs, 'utf8');
	if (!/\b(?:settingsRegistry|this(?:\._settings)?)\.add\s*\(/.test(src) && !/\bsettings\.add\s*\(/.test(src)) {
		return [];
	}
	const constMap = fileConstStringMap(src);
	const scopes = collectScopes(src);
	const rows = [];

	const addRe = /(?:await\s+)?(?:settingsRegistry|this(?:\._settings)?)\.add\s*\(/g;
	let m;
	while ((m = addRe.exec(src))) {
		const token = m[0];
		if (token.includes('addGroup')) continue;
		const paren = m.index + token.length - 1;
		const { args } = scanCall(src, paren);
		const line = lineOf(src, m.index);

		// SettingsRegistry method definition: async add(_id, value, { ...
		if (rel.endsWith('SettingsRegistry.ts')) continue;

		const keyParsed = parseStringish(args[0] || '');
		const keyExpr = args[0] || '';

		// Forwarding / internals
		if (/^setting\.id$/.test(keyExpr.trim()) || /^id$/.test(keyExpr.trim()) || keyExpr.trim() === '_id') {
			continue;
		}

		const isSearchProviderLocal = token.includes('_settings.add');
		let type;
		let defaultSrc;
		let optSrc;
		if (isSearchProviderLocal) {
			// (key, type, default, options)
			type = evalStringProp(args[1], constMap) || 'string';
			defaultSrc = collapseWs(args[2] || '');
			optSrc = args[3] || '{}';
		} else {
			defaultSrc = collapseWs(args[1] || '');
			optSrc = args[2] || '{}';
		}

		const optProps = parseObjectProps(optSrc || '{}');
		if (!isSearchProviderLocal) {
			type = evalStringProp(optProps.type, constMap) || 'string';
		}
		let { group, section, withPublic } = resolveGroupSection(scopes, m.index, optProps, constMap);
		const publicRaw = optProps.public ?? withPublic;
		const pub = evalPublic(publicRaw);

		let key;
		if (keyParsed.kind === 'lit') key = keyParsed.value;
		else if (keyParsed.kind === 'tmpl') key = keyParsed.value;
		else key = keyExpr.trim();

		if (isSearchProviderLocal) {
			const ctor = src.match(/super\(\s*(['"])([^'"]+)\1\s*\)/);
			const base = ctor ? ctor[2] : 'UNKNOWN';
			if (keyParsed.kind === 'lit') key = `Search.${base}.${keyParsed.value}`;
			else key = `Search.${base}.${key}`;
			// Registered under addGroup('Search') + section(provider.i18nLabel)
			if (!group) group = 'Search';
			if (!section) {
				const label = src.match(/get i18nLabel\(\)\s*\{\s*return\s+(['"])([^'"]+)\1/);
				if (label) section = label[2];
			}
		}

		// Factory: Assets_${asset} / add(key, …) — expanded from the assets object below
		if (key === '`Assets_${asset}`' || key.includes('Assets_${asset}') || (rel.endsWith('lib/media/assets/assets.ts') && keyExpr.trim() === 'key')) {
			continue;
		}

		rows.push({
			key,
			type,
			default: defaultSrc,
			group,
			section,
			file: rel,
			line,
			public: pub,
			kind: isSearchProviderLocal ? 'search-provider' : keyParsed.kind === 'tmpl' || keyParsed.kind === 'expr' ? 'template' : 'static',
		});
	}

	// Legacy settings.add(id, type, default, options) — only SearchProvider uses this via _settings
	// already handled.

	// Expand RocketChat assets object
	if (rel.endsWith('lib/media/assets/assets.ts')) {
		const assetsBlock = src.match(/const assets:[\s\S]*?=\s*\{/);
		if (assetsBlock) {
			const open = src.indexOf('{', assetsBlock.index + assetsBlock[0].length - 1);
			const close = findMatchingBrace(src, open);
			const body = src.slice(open + 1, close);
			const keyRe = /^\s*([A-Za-z_][\w]*)\s*:/gm;
			let km;
			while ((km = keyRe.exec(body))) {
				const assetKey = km[1];
				if (
					[
						'label',
						'defaultUrl',
						'constraints',
						'wizard',
						'settingOptions',
						'type',
						'extensions',
						'width',
						'height',
						'step',
						'order',
						'section',
						'group',
						'invalidValue',
						'enableQuery',
						'enterprise',
						'modules',
						'sorter',
					].includes(assetKey)
				) {
					continue;
				}
				const keyOffset = km[0].search(/[A-Za-z_]/);
				const absLine = lineOf(src, open + 1 + km.index + keyOffset);
				const afterKey = body.slice(km.index + km[0].length);
				const braceRel = afterKey.indexOf('{');
				let group = 'Assets';
				let section = '';
				let defaultSrc = '{ defaultUrl: undefined }';
				if (braceRel !== -1) {
					const eOpen = open + 1 + km.index + km[0].length + braceRel;
					const eClose = findMatchingBrace(src, eOpen);
					const entry = src.slice(eOpen, eClose + 1);
					const du = entry.match(/defaultUrl:\s*(['"])([^'"]*)\1/);
					if (du) defaultSrc = `{ defaultUrl: '${du[2]}' }`;
					const so = entry.match(/settingOptions\s*:\s*\{/);
					if (so) {
						const soOpen = entry.indexOf('{', so.index + so[0].length - 1);
						const soClose = findMatchingBrace(entry, soOpen);
						const soProps = parseObjectProps(entry.slice(soOpen, soClose + 1));
						if (soProps.group) group = evalStringProp(soProps.group, constMap) || group;
						if (soProps.section) section = evalStringProp(soProps.section, constMap) || '';
					}
				}
				rows.push({
					key: `Assets_${assetKey}`,
					type: 'asset',
					default: defaultSrc,
					group,
					section,
					file: rel,
					line: absLine,
					public: 'yes',
					kind: 'asset-expand',
				});
			}
		}
	}

	return rows;
}

export function collectFieldRows() {
	const roots = ['apps/meteor/server', 'apps/meteor/ee/server'];
	const files = [];
	for (const r of roots) walkFiles(path.join(ROOT, r), files);
	const rows = [];
	for (const rel of files) {
		rows.push(...extractAddSites(rel));
	}
	// stable sort: file, line, key
	rows.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.key.localeCompare(b.key));
	return rows;
}

const CLIENT_READ_RE =
	/\b(?:useSetting|useSettingStructure|useSettingSetValue|settings\.peek|settings\.observe|settings\.get)\s*\(\s*(['"`])([^'"`\n]+)\1/g;

const CLIENT_READ_ROOTS = [
	'apps/meteor/client',
	'apps/meteor/ee/client',
	'apps/meteor/ee/app',
	'apps/meteor/app',
	'packages',
];

function shouldSkipClientFile(rel) {
	if (SKIP_FILE_RE.test(rel)) return true;
	if (rel.includes('/node_modules/')) return true;
	if (/\.(spec|test|tests)\./.test(rel)) return true;
	if (rel.includes('/storybook-config/')) return true;
	if (rel.includes('/jest-presets/')) return true;
	return false;
}

export function collectClientReads() {
	const files = [];
	for (const r of CLIENT_READ_ROOTS) {
		const abs = path.join(ROOT, r);
		if (fs.existsSync(abs)) walkFiles(abs, files);
	}
	const hits = new Map(); // key -> [{file,line,api}]
	for (const rel of files) {
		if (shouldSkipClientFile(rel)) continue;
		const abs = path.join(ROOT, rel);
		let src;
		try {
			src = fs.readFileSync(abs, 'utf8');
		} catch {
			continue;
		}
		if (!/(?:useSetting|useSettingStructure|useSettingSetValue|settings\.(?:peek|observe|get))\s*\(/.test(src)) continue;
		CLIENT_READ_RE.lastIndex = 0;
		let m;
		while ((m = CLIENT_READ_RE.exec(src))) {
			const key = m[2];
			if (!key || key === '*' || key.includes('${')) continue;
			const api = m[0].replace(/\s*\(\s*['"`].*/, '');
			const line = lineOf(src, m.index);
			if (!hits.has(key)) hits.set(key, []);
			hits.get(key).push({ file: rel, line, api });
		}
	}
	return hits;
}

function findVol6Path() {
	const dir = path.join(ROOT, 'docs/qa/pm-feature-atlas/round-2');
	if (!fs.existsSync(dir)) return null;
	const names = fs.readdirSync(dir).filter((n) => /^06-.*\.md$/.test(n));
	if (names.length === 0) return null;
	return path.join('docs/qa/pm-feature-atlas/round-2', names.sort()[0]);
}

function keysFromVol6(vol6Rel) {
	if (!vol6Rel) return null;
	const src = fs.readFileSync(path.join(ROOT, vol6Rel), 'utf8');
	const keys = new Set();
	// table cells that look like setting ids
	const re = /`([A-Za-z][A-Za-z0-9_.-]*[A-Za-z0-9])`/g;
	let m;
	while ((m = re.exec(src))) {
		if (m[1].includes('.')) {
			// Search.Provider etc. are valid; skip obviously non-setting prose
		}
		keys.add(m[1]);
	}
	// also bare table first-column keys
	for (const line of src.split('\n')) {
		const t = line.match(/^\|\s*`?([A-Za-z][A-Za-z0-9_.-]{2,})`?\s*\|/);
		if (t) keys.add(t[1]);
	}
	return keys;
}

function mdEscapeCell(s) {
	return String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function groupSection(row) {
	if (row.group && row.section) return `${row.group} / ${row.section}`;
	if (row.group) return row.group;
	if (row.section) return `— / ${row.section}`;
	return '—';
}

function templateMatches(templateKey, concrete) {
	if (templateKey === concrete) return true;
	const t = templateKey.replace(/^`|`$/g, '');
	if (!t.includes('${')) return false;
	const parts = [];
	let last = 0;
	const re = /\$\{[^}]+\}/g;
	let m;
	while ((m = re.exec(t))) {
		parts.push(t.slice(last, m.index).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
		parts.push('[A-Za-z0-9_-]+');
		last = m.index + m[0].length;
	}
	parts.push(t.slice(last).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
	try {
		return new RegExp(`^${parts.join('')}$`).test(concrete);
	} catch {
		return false;
	}
}

function rowMatchesKey(row, key) {
	if (row.key === key) return true;
	if (row.kind === 'template' && templateMatches(row.key, key)) return true;
	return false;
}

function verifyAgainstRg(rows) {
	// Count raw add( sites the same way the exporter walks files.
	const files = [];
	for (const r of ['apps/meteor/server', 'apps/meteor/ee/server']) walkFiles(path.join(ROOT, r), files);
	let raw = 0;
	const missed = [];
	const covered = new Set(rows.map((r) => `${r.file}:${r.line}`));
	for (const rel of files) {
		const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
		const re = /(?:await\s+)?(?:settingsRegistry|this(?:\._settings)?)\.add\s*\(/g;
		let m;
		while ((m = re.exec(src))) {
			if (m[0].includes('addGroup')) continue;
			raw += 1;
			const line = lineOf(src, m.index);
			const loc = `${rel}:${line}`;
			if (!covered.has(loc)) {
				const snippet = src.slice(m.index, m.index + 80).replace(/\s+/g, ' ');
				missed.push({ loc, snippet });
			}
		}
	}
	return { rawAddCalls: raw, exportedRows: rows.length, uncoveredAddSites: missed };
}

function printCount(rows, clientReads) {
	const staticRows = rows.filter((r) => r.kind === 'static' || r.kind === 'search-provider' || r.kind === 'asset-expand');
	const tmplRows = rows.filter((r) => r.kind === 'template');
	const publicYes = rows.filter((r) => r.public === 'yes');
	let sha = '';
	try {
		sha = fs.readFileSync(path.join(ROOT, '.git/HEAD'), 'utf8').trim();
		if (sha.startsWith('ref:')) {
			const ref = sha.slice(5).trim();
			sha = fs.readFileSync(path.join(ROOT, '.git', ref), 'utf8').trim();
		}
	} catch {
		sha = '(unknown)';
	}
	console.log(`commit\t${sha}`);
	console.log(`fields.total\t${rows.length}`);
	console.log(`fields.static_or_expanded\t${staticRows.length}`);
	console.log(`fields.template\t${tmplRows.length}`);
	console.log(`fields.public_yes\t${publicYes.length}`);
	console.log(`client_read.keys\t${clientReads.size}`);
}

function printClientRead(clientReads) {
	const keys = [...clientReads.keys()].sort();
	console.log(`client_read.keys\t${keys.length}`);
	for (const k of keys) {
		const sites = clientReads.get(k);
		const shown = sites
			.slice(0, 3)
			.map((s) => `${s.file}:${s.line}`)
			.join(', ');
		console.log(`${k}\t${sites.length}\t${shown}`);
	}
}

function buildMarkdown(rows, clientReads, vol6Rel, vol6Keys, verify) {
	const publicYes = rows.filter((r) => r.public === 'yes').length;
	const tmpl = rows.filter((r) => r.kind === 'template').length;
	const staticN = rows.length - tmpl;

	const vol13Keys = rows.map((r) => r.key);
	const vol13Set = new Set(vol13Keys);

	const clientKeys = [...clientReads.keys()].sort();
	const clientIn13 = [];
	const clientNotIn13 = [];
	for (const k of clientKeys) {
		if (rows.some((r) => rowMatchesKey(r, k))) clientIn13.push(k);
		else clientNotIn13.push(k);
	}

	const in13NotClient = [];
	for (const r of rows) {
		const hit =
			clientReads.has(r.key) ||
			[...clientReads.keys()].some((k) => rowMatchesKey(r, k));
		if (!hit) in13NotClient.push(r.key);
	}

	// SHOULD be client-read = keys the product client actually reads (literal useSetting/peek/observe/get/structure/setValue)
	const should = clientKeys;

	const shouldButNotPublic = [];
	for (const k of should) {
		const matching = rows.filter((r) => rowMatchesKey(r, k));
		if (matching.length === 0) continue;
		if (matching.every((r) => r.public !== 'yes')) shouldButNotPublic.push(k);
	}

	const publicButNoClientRead = rows
		.filter((r) => r.public === 'yes' && !clientReads.has(r.key) && ![...clientReads.keys()].some((k) => rowMatchesKey(r, k)))
		.map((r) => r.key);

	let vol6Section;
	if (!vol6Rel) {
		vol6Section = `本分支 **没有** \`docs/qa/pm-feature-atlas/round-2/06-*.md\`。对账改用本卷脚本现场 grep 的 client-read 集合（见 CLOSURE），不发明 vol 6 行。`;
	} else {
		const v6only = [...vol6Keys].filter((k) => !vol13Set.has(k) && !rows.some((r) => rowMatchesKey(r, k))).sort();
		const in13NotV6 = rows.filter((r) => !vol6Keys.has(r.key) && ![...vol6Keys].some((k) => rowMatchesKey(r, k))).map((r) => r.key);
		vol6Section = [
			`vol 6 文件：\`${vol6Rel}\``,
			``,
			`vol 6 抽到的疑似 key 数：${vol6Keys.size}（反引号 token + 表首列；可能含非 setting 噪声，以 client-read grep 为准）`,
			``,
			`### vol 6 有、13 对不上`,
			``,
			v6only.length ? v6only.map((k) => `- \`${k}\``).join('\n') : '（空）',
			``,
			`### 13 有、vol 6 抽不到（只列 key；完整字段见表）`,
			``,
			`共 ${in13NotV6.length}。`,
			'',
			in13NotV6.map((k) => `- \`${k}\``).join('\n'),
		].join('\n');
	}

	const lines = [];
	lines.push('# Round 2 / Volume 13 — Admin settings field complete set');
	lines.push('');
	lines.push('Frozen commit: `e519470d35b6caf5b228d81aef41c86aab3051f4`（短 SHA `e519470d35`）。**不要用 develop 行号。**');
	lines.push('');
	lines.push('Admin settings 是 registry：本卷机械导出 **本提交** 上每一处 `settingsRegistry.add` / `this.add`（`addGroup` 回调内）/ SearchProvider `_settings.add` / Assets 对象展开字段。`addGroup` 本身是 type=`group` 的分组节点，不是字段，不入表。测试与 `SettingsRegistry` 实现、`server/settings/index.ts` 中间件包装排除。');
	lines.push('');
	lines.push('## 方法');
	lines.push('');
	lines.push('- 解析器：`docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs`（字符串/注释/括号感知，跟踪 `addGroup` / `this.section` / `this.with`）。');
	lines.push('- `type` 缺省按 `SettingsRegistry.add` → `string`（`getSettingDefaults` / `add` 默认）。');
	lines.push('- `public` 缺省按 `getSettingDefaults` → `false`（表内 `no`）。`this.with({ public })` 会下传到回调内的 `add`。');
	lines.push('- 动态工厂保持源码 key：`Accounts_OAuth_Custom-${name}-…`、`SAML_Custom_${name}_…`、migration `v300` 的 `Accounts_OAuth_Custom-${serviceName}-merge_users_distinct_services`。SAML 启动只实例化 `addSettings(\'Default\')`（`apps/meteor/server/lib/saml/startup.ts`）；EE SAML 在 `addSettings` 事件上再挂一层。');
	lines.push('- Assets：`addAssetToSetting` 对 `assets` 对象每个 key 注册 `Assets_${key}`（`public: true`, `type: asset`）。表内按对象 key 展开，行号是该 key 在 `assets` 字面量上的行。');
	lines.push('- Search：`DefaultProvider._settings.add` 的 registry id 为 `Search.defaultProvider.<key>`（`Setting.id`）。`SearchProviderService` 里对 `setting.id` 的转发 `this.add` 不另计一行。`Search.Provider` 仍计。');
	lines.push('- 默认值保留源码表达式（空白压缩），不求值 `process.env` / `crypto` / `Random`。');
	lines.push('');
	lines.push('## 完整字段表');
	lines.push('');
	lines.push('| key | type | default | group/section | package file:line | public? |');
	lines.push('| --- | --- | --- | --- | --- | --- |');
	for (const r of rows) {
		lines.push(
			`| ${mdEscapeCell(r.key)} | ${mdEscapeCell(r.type)} | ${mdEscapeCell(r.default)} | ${mdEscapeCell(groupSection(r))} | \`${r.file}:${r.line}\` | ${mdEscapeCell(r.public)} |`,
		);
	}
	lines.push('');
	lines.push(`本表数据行：**${rows.length}**（static/expanded ${staticN} + template ${tmpl}；public=yes ${publicYes}）。计数命令见 CLOSURE，禁止把这个数字当成「功能数」。`);
	lines.push('');
	lines.push('## 对账 — vol 6 client-read');
	lines.push('');
	lines.push(vol6Section);
	lines.push('');
	lines.push('### 本卷现场 grep 的 client-read 集合');
	lines.push('');
	lines.push('API：`useSetting` / `useSettingStructure` / `useSettingSetValue` / `settings.peek` / `settings.observe` / `settings.get`，第一参为字符串字面量。范围：`apps/meteor/client`、`apps/meteor/ee/client`、`apps/meteor/ee/app`、`apps/meteor/app`、`packages/`。排除 `*.spec.*` / `*.tests.*` / `tests/`。动态第一参（如 `useSetting(page)`）不进集合。Admin 设置编辑器通过 `useSettings()` 拉全表的，不是逐 key 读取，不进本集合。');
	lines.push('');
	lines.push(`client-read 去重 key：**${clientKeys.length}**。`);
	lines.push('');
	lines.push('#### SHOULD be client-read（client 源码字面量读取 → 应出现在 vol 6 的 expected client-read set）');
	lines.push('');
	lines.push(should.map((k) => `- \`${k}\``).join('\n') || '（空）');
	lines.push('');
	lines.push(`其中能对上 13（含模板）：**${clientIn13.length}**；13 对不上：**${clientNotIn13.length}**。`);
	lines.push('');
	if (clientNotIn13.length) {
		lines.push('##### client-read 有、13 注册表对不上');
		lines.push('');
		lines.push(clientNotIn13.map((k) => `- \`${k}\``).join('\n'));
		lines.push('');
		lines.push(
			'说明：`SAML_Custom_Default*` / `Accounts_OAuth_Custom-*` 对模板行算「对上」。剩下的：`Chatops_Username` 在 `useSetting` / `settings.get` 有读，但本提交没有任何 `settingsRegistry.add`；`PageSize` 是 `MessageSearchTab.tsx` 字面量，registry id 实为 `Search.defaultProvider.PageSize`（SearchProvider `Setting.id`）。',
		);
		lines.push('');
	}
	lines.push('##### client-read 且匹配行全部 public≠yes（应 client-read 但 registry 未标 public）');
	lines.push('');
	lines.push(shouldButNotPublic.length ? shouldButNotPublic.map((k) => `- \`${k}\``).join('\n') : '（空）');
	lines.push('');
	lines.push('#### 13 有、client-read 无');
	lines.push('');
	lines.push(`共 **${in13NotClient.length}**（含仅服务端/仅管理后台编辑、以及尚未被 client 字面量引用的 public=yes）。`);
	lines.push('');
	lines.push(in13NotClient.map((k) => `- \`${k}\``).join('\n'));
	lines.push('');
	lines.push('#### public=yes 但本卷 client-read grep 未击中');
	lines.push('');
	lines.push(`共 **${publicButNoClientRead.length}**（仍会经 PublicSettings 下发；只是本提交 client 源码没有字面量读）。`);
	lines.push('');
	lines.push(publicButNoClientRead.map((k) => `- \`${k}\``).join('\n') || '（空）');
	lines.push('');
	lines.push('## CLOSURE');
	lines.push('');
	lines.push('评审员在 **`e519470d35b6caf5b228d81aef41c86aab3051f4`** 复跑，不要切 develop 对行号。');
	lines.push('');
	lines.push('```bash');
	lines.push('git rev-parse HEAD');
	lines.push('# expect e519470d35b6caf5b228d81aef41c86aab3051f4');
	lines.push('');
	lines.push('node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --count');
	lines.push('node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --verify');
	lines.push('node docs/qa/pm-feature-atlas/round-2/export-13-admin-settings-fields.mjs --client-read | wc -l');
	lines.push('');
	lines.push('# raw add( 调用点（实现/测试已由脚本 skip；rg 仍会打到 SettingsRegistry 定义）');
	lines.push("rg -n --glob '!**/tests/**' --glob '!**/*.tests.ts' --glob '!**/*.spec.ts' \\");
	lines.push("  -e 'settingsRegistry\\.add\\(' -e 'this\\.add\\(' -e '_settings\\.add\\(' \\");
	lines.push('  apps/meteor/server apps/meteor/ee/server');
	lines.push('');
	lines.push('# 字段表数据行（不含表头/分隔行）');
	lines.push(
		'python3 -c "from pathlib import Path; t=Path(\'docs/qa/pm-feature-atlas/round-2/13-admin-settings-fields.md\').read_text().splitlines(); print(sum(1 for l in t if l.startswith(\'| \') and not l.startswith(\'| key\') and not l.startswith(\'| ---\')))"',
	);
	lines.push('');
	lines.push('# client-read 字面量（与脚本同一批 API；人工抽查）');
	lines.push("rg -n --glob '!**/tests/**' --glob '!**/*.{spec,test,tests}.*' \\");
	lines.push("  -e 'useSetting\\(' -e 'useSettingStructure\\(' -e 'useSettingSetValue\\(' \\");
	lines.push("  -e 'settings\\.peek\\(' -e 'settings\\.observe\\(' -e 'settings\\.get\\(' \\");
	lines.push('  apps/meteor/client apps/meteor/ee/client packages');
	lines.push('```');
	lines.push('');
	lines.push('本环境导出计数（脚本 `--count` / `--verify`）：');
	lines.push('');
	lines.push('```');
	lines.push(`fields.total\t${rows.length}`);
	lines.push(`fields.static_or_expanded\t${staticN}`);
	lines.push(`fields.template\t${tmpl}`);
	lines.push(`fields.public_yes\t${publicYes}`);
	lines.push(`client_read.keys\t${clientKeys.length}`);
	lines.push(`verify.rawAddCalls\t${verify.rawAddCalls}`);
	lines.push(`verify.exportedRows\t${verify.exportedRows}`);
	lines.push(`verify.uncoveredAddSites\t${verify.uncoveredAddSites.length}`);
	if (verify.uncoveredAddSites.length) {
		for (const u of verify.uncoveredAddSites) {
			lines.push(`uncovered\t${u.loc}\t${u.snippet}`);
		}
	}
	lines.push('```');
	lines.push('');
	lines.push('`verify.rawAddCalls` 含 `addAssetToSetting` 的工厂 `add(`、`SearchProviderService` 的 `this.add(setting.id)`、以及被 skip 的实现文件若未被路径过滤。`fields.total` 是字段行（Assets 展开多行、转发/实现 skip）。两数不必相等；`--verify` 的 `uncoveredAddSites` 应只剩工厂/转发。');
	lines.push('');
	return lines.join('\n');
}

function isMain() {
	const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
	return import.meta.url === `file://${entry}`;
}

if (isMain()) {
	const args = process.argv.slice(2);
	const rows = collectFieldRows();
	const clientReads = collectClientReads();

	if (args.includes('--count')) {
		printCount(rows, clientReads);
		process.exit(0);
	}
	if (args.includes('--json')) {
		console.log(JSON.stringify({ fields: rows, clientReadKeys: [...clientReads.keys()].sort() }, null, 2));
		process.exit(0);
	}
	if (args.includes('--client-read')) {
		printClientRead(clientReads);
		process.exit(0);
	}
	if (args.includes('--verify')) {
		const v = verifyAgainstRg(rows);
		console.log(JSON.stringify(v, null, 2));
		process.exit(v.uncoveredAddSites.length > 8 ? 1 : 0);
	}
	if (args.includes('--markdown') || args.length === 0) {
		const vol6Rel = findVol6Path();
		const vol6Keys = vol6Rel ? keysFromVol6(vol6Rel) : null;
		const verify = verifyAgainstRg(rows);
		process.stdout.write(buildMarkdown(rows, clientReads, vol6Rel, vol6Keys, verify));
	}
}
