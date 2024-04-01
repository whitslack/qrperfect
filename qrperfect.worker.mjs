function* codePoints(s) {
	for (let i = 0, n = s.length; i < n; ++i) {
		const p = s.codePointAt(i);
		yield p;
		i += !!(p >> 16);
	}
}

function ceil6(v) {
	const m = v % 6;
	return m ? v - m + 6 : v;
}

function matrixDim(v) {
	return 17 + v * 4;
}

function capacity(v) { // ISO/IEC 18004:2015 Table 1
	const a = matrixDim(v), n = (v / 7 | 0) + 2;
	return (a * a - (192 + (a - 16) * 2 + (v > 1 ? (n * n - 3) * 25 - (n - 2) * 10 : 0)) - (v < 7 ? 31 : 67)) / 8 | 0;
}

const Mode = { // ISO/IEC 18004:2015 Table 2
	ECI:7, Numeric:1, Alphanumeric:2, Byte:4, Kanji:8, Terminator:0
};

function charCountWidth(v, m) { // ISO/IEC 18004:2015 Table 3
	switch (m) {
		case Mode.Numeric:
			return v < 10 ? 10 : v < 27 ? 12 : 14;
		case Mode.Alphanumeric:
			return v < 10 ? 9 : v < 27 ? 11 : 13;
		case Mode.Byte:
			return v < 10 ? 8 : 16;
		case Mode.Kanji:
			return v < 10 ? 8 : v < 27 ? 10 : 12;
	}
}

const eci = new Map();

function SingleByteECI(label, id, ranges) {
	this.label = label;
	this.id = id;
	this.ranges = ranges;
}
Object.defineProperties(SingleByteECI.prototype, Object.getOwnPropertyDescriptors({
	load() {
		if ("map" in this) return this.map;
		console.time(this.label);
		try {
			const d = new TextDecoder(this.id), m = new Map();
			const s = this.ranges || [[0, 0x7F], [0xA0, 0xFF]];
			let n = 0, j = 0;
			for (let [u, e] of s) n += e - u + 1;
			const a = new Uint8Array(n);
			for (let [u, e] of s) while (u <= e) a[j++] = u++;
			j = 0;
			for (const p of codePoints(d.decode(a))) {
				if (p != 0xFFFD) m.set(p, a[j]);
				++j;
			}
			if (j != n) throw new Error("failed to initialize " + l + " ECI");
			return this.map = m;
		}
		catch (e) {
			console.warn(e);
			return this.map = null;
		}
		finally {
			console.timeEnd(this.label);
		}
	},
	canEncode(s) {
		for (let i = codePoints(s), p, d; { value: p, done: d } = i.next(), !d;)
			if (p >> 7) {
				const m = this.load();
				if (!m) return false;
				do if (!m.has(p)) return false; while ({ value: p, done: d } = i.next(), !d);
			}
		return true;
	},
	byteCount(s) {
		var n = 0;
		for (const p of codePoints(s)) ++n;
		return n;
	},
	encodeSegment(s, b) {
		const m = this.load();
		b.pushSegmentHeader(Mode.Byte, this.byteCount(s));
		for (const p of codePoints(s)) b.push(m.get(p), 8);
	},
}));
for (let [e, l, i, s] of [[3, "Latin-1", "iso-8859-1"], [4, "Latin-2", "iso-8859-2"], [5, "Latin-3", "iso-8859-3"], [6, "Latin-4", "iso-8859-4"], [7, "Cyrillic", "iso-8859-5"], [8, "Arabic", "iso-8859-6"], [9, "Greek", "iso-8859-7"], [10, "Hebrew", "iso-8859-8"], [11, "Latin-5", "iso-8859-9"], [12, "Latin-6", "iso-8859-10"], [13, "Thai", "iso-8859-11"], [15, "Latin-7", "iso-8859-13"], [16, "Latin-8", "iso-8859-14"], [17, "Latin-9", "iso-8859-15"], [18, "Latin-10", "iso-8859-16"], [21, "Windows-1250", "windows-1250", [[0, 255]]], [22, "Windows-1251", "windows-1251", [[0, 255]]], [23, "Windows-1252", "windows-1252", [[0, 255]]], [24, "Windows-1256", "windows-1256", [[0, 255]]]])
	eci.set(e, new SingleByteECI(l, i, s));

function MultiByteECI(label, id, singleByteRanges, doubleByteRanges) {
	this.label = label;
	this.id = id;
	this.singleByteRanges = singleByteRanges;
	this.doubleByteRanges = doubleByteRanges;
}
Object.defineProperties(MultiByteECI.prototype, Object.getOwnPropertyDescriptors({
	load() {
		if ("map" in this) return this.map;
		console.time(this.label);
		try {
			const d = new TextDecoder(this.id), m = new Map();
			const s = this.singleByteRanges || [[0, 0x7F]], p = this.doubleByteRanges || [[[[0xA1, 0xFE]], [[0xA1, 0xFE]]]];
			let n = 0, j = 0;
			for (const [us, vs] of p) for (const [u, e] of us) for (const [v, f] of vs) n += (e - u + 1) * (f - v + 1);
			let a = new Uint8Array(n *= 3);
			for (const [us, vs] of p) for (const [u, e] of us) for (const [v, f] of vs)
				for (let w = u; w <= e; ++w) for (let x = v; x <= f; ++x) a[j++] = w, a[j++] = x, ++j;
			j = 0;
			for (const p of codePoints(d.decode(a))) {
				if (!p) j += 3;
				else if (p != 0xFFFD) m.set(p, a[j] << 8 | a[j + 1]);
			}
			if (j == n) {
				n = 0, j = 0;
				for (let [u, e] of s) n += e - u + 1;
				a = new Uint8Array(n);
				for (let [u, e] of s) while (u <= e) a[j++] = u++;
				j = 0;
				for (const p of codePoints(d.decode(a))) {
					if (p != 0xFFFD) m.set(p, a[j]);
					++j;
				}
				if (j == n) return this.map = m;
			}
			throw new Error("failed to initialize " + l + " ECI");
		}
		catch (e) {
			console.warn(e);
			return this.map = undefined;
		}
		finally {
			console.timeEnd(this.label);
		}
	},
	canEncode(s) {
		for (let i = codePoints(s), p, d; { value: p, done: d } = i.next(), !d;)
			if (p >> 7) {
				const m = this.load();
				if (!m) return false;
				do if (!m.has(p)) return false; while ({ value: p, done: d } = i.next(), !d);
				break;
			}
		return true;
	},
	byteCount(s) {
		var n = 0;
		for (let i = codePoints(s), p, d; { value: p, done: d } = i.next(), !d; ++n)
			if (p >> 7) {
				const m = this.load();
				do n += 1 + !!(m.get(p) >> 8); while ({ value: p, done: d } = i.next(), !d);
				break;
			}
		return n;
	},
	encodeSegment(s, b) {
		const m = this.load();
		b.pushSegmentHeader(Mode.Byte, this.byteCount(s));
		for (const p of codePoints(s)) {
			const u = m.get(p);
			b.push(u, 1 + !!(u >> 8) << 3);
		}
	},
}));
for (let [e, l, i, s, p] of [[20, "Shift JIS", "shift_jis", [[0, 0x7F], [0xA1, 0xDF]], [[[[0x81, 0x9F], [0xE0, 0xEF]], [[0x40, 0x7E], [0x80, 0xFC]]]]], [28, "Big5", "big5", 0, [[[[0xA1, 0xFE]], [[0x40, 0x7E], [0xA1, 0xFE]]]]], [29, "GB 2312", "gb_2312", 0, [[[[0xA1, 0xA9], [0xB0, 0xF7]], [[0xA1, 0xFE]]]]], [30, "Korean", "euc-kr"], [31, "GBK", "gbk", 0, [[[[0x81, 0xA9], [0xB0, 0xF7]], [[0xA1, 0xFE]]], [[[0x81, 0xA0], [0xA8, 0xFE]], [[0x40, 0x7E], [0x80, 0xA0]]]]]])
	eci.set(e, new MultiByteECI(l, i, s, p));

eci.set(26, {
	label: "UTF-8",
	canEncode(s) {
		for (const p of codePoints(s)) if (p >= 0xD800 && p <= 0xDFFF) return false;
		return true;
	},
	byteCount(s) {
		var n = 0;
		for (const p of codePoints(s)) n += 1 + !!(p >> 7) + !!(p >> 11) + !!(p >> 16);
		return n;
	},
	encodeSegment(s, b) {
		const e = new TextEncoder().encode(s);
		b.pushSegmentHeader(Mode.Byte, e.length);
		for (const u of e) b.push(u, 8);
	},
});

const modes = new Map();

modes.set(Mode.Numeric, {
	label: "Numeric",
	canEncode(s) {
		for (const p of codePoints(s)) if (!(p >= 0x30 && p <= 0x39)) return false;
		return true;
	},
	cost(s) {
		return s.length * 20; // 3⅓ bits per digit
	},
	encodeSegment(s, b) {
		const n = s.length;
		b.pushSegmentHeader(Mode.Numeric, n);
		for (var i = 0; i + 3 <= n; i += 3) b.push(parseInt(s.slice(i, i + 3), 10), 10);
		switch (n - i) {
			case 2: b.push(parseInt(s.slice(i), 10), 7); break;
			case 1: b.push(parseInt(s.slice(i), 10), 4); break;
		}
	},
});

(() => {
	const m = new Map();
	let i = 0;
	for(const p of codePoints("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:")) // ISO/IEC 18004:2015 Table 5
		m.set(p, i++);
	modes.set(Mode.Alphanumeric, {
		label: "Alphanumeric",
		canEncode(s) {
			for (const p of codePoints(s)) if (!m.has(p)) return false;
			return true;
		},
		cost(s) {
			return s.length * 33; // 5½ bits per character
		},
		encodeSegment(s, b) {
			const n = s.length;
			b.pushSegmentHeader(Mode.Alphanumeric, n);
			for (let i = codePoints(s), p, q, d; { value: p, done: d } = i.next(), !d;) {
				if ({ value: q, done: d } = i.next(), d) {
					b.push(m.get(p), 6);
					break;
				}
				b.push(m.get(p) * 45 + m.get(q), 11);
			}
		},
	});
})();

modes.set(Mode.Byte, {
	label: "Byte",
	canEncode(s, e) {
		return eci.get(e).canEncode(s);
	},
	cost(s, e) {
		return eci.get(e).byteCount(s) * 48; // 8 bits per code unit
	},
	encodeSegment(s, b) {
		eci.get(b.eci).encodeSegment(s, b);
	},
});

(() => {
	const d = new TextDecoder("shift-jis"), m = new Map();
	const a = new Uint8Array((0x9F - 0x81 + 1 + 0xEB - 0xE0 + 1) * (0xFC - 0x40 + 1) * 3);
	let j = 0;
	for (let [u, e] of [[0x81, 0x9F], [0xE0, 0xEB]]) for (; u <= e; ++u)
		for (let v = 0x40; v <= 0xFC; ++v) a[j++] = u, a[j++] = v, ++j;
	j = 0;
	for (const p of codePoints(d.decode(a)))
		if (!p) j += 3;
		else if (p != 0xFFFD) {
			let k = a[j] << 8 | a[j + 1];
			k -= (k < 0xE040 ? 0x8140 : 0xE040);
			m.set(p, (k >> 8) * 0xC0 + (k & 0xFF));
		}
	modes.set(Mode.Kanji, {
		label: "Kanji",
		canEncode(s) {
			for (const p of codePoints(s)) if (!m.has(p)) return false;
			return true;
		},
		cost(s) {
			return s.length * 78; // 13 bits per character; there are no kanji outside the BMP
		},
		encodeSegment(s, b) {
			b.pushSegmentHeader(Mode.Kanji, s.length);
			for (const p of codePoints(s)) b.push(m.get(p), 13);
		},
	});
})();

const capacities = [ // ISO/IEC 18004:2015 Table 7
	null, [19,16,13,9], [34,28,22,16], [55,44,34,26], [80,64,48,36], [108,86,62,46], [136,108,76,60], [156,124,88,66], [194,154,110,86], [232,182,132,100], [274,216,154,122], [324,254,180,140], [370,290,206,158], [428,334,244,180], [461,365,261,197], [523,415,295,223], [589,453,325,253], [647,507,367,283], [721,563,397,313], [795,627,445,341], [861,669,485,385], [932,714,512,406], [1006,782,568,442], [1094,860,614,464], [1174,914,664,514], [1276,1000,718,538], [1370,1062,754,596], [1468,1128,808,628], [1531,1193,871,661], [1631,1267,911,701], [1735,1373,985,745], [1843,1455,1033,793], [1955,1541,1115,845], [2071,1631,1171,901], [2191,1725,1231,961], [2306,1812,1286,986], [2434,1914,1354,1054], [2566,1992,1426,1096], [2702,2102,1502,1142], [2812,2216,1582,1222], [2956,2334,1666,1276]
];

const ECLevel = { // ISO/IEC 18004:2015 Table 8
	L:0, M:1, Q:2, H:3
};

function ecParams(v, l) { // ISO/IEC 18004:2015 Table 9
	const p = ecParams.cache[v + l];
	if (p) return p;
	const w = capacity(v), e = w - capacities[v][ECLevel[l]];
	var n, c, k, m;
	if (c = ecParams.errata[v + l])
		m = w % c, n = (w - m) / c - m, k = c - e / (n + m);
	else
		for (let cmk = 31; --cmk;) {
			const npm = e / cmk;
			if (npm == (npm | 0) && (c = (w - (m = w % npm)) / npm) == (c | 0)) {
				n = npm - m, k = c - cmk;
				break;
			}
		}
	return ecParams.cache[v + l] = m ? [[n, c, k], [m, c + 1, k + 1]] : [[n, c, k]];
}
ecParams.cache = {};
ecParams.errata = { // Table 9 specifies some sub-optimal parameters :(
	"5Q":33, "7M":49, "7Q":32, "10L":86, "14M":64, "15M":65, "15H":36, "19M":70, "30M":75, "38M":74
};

const masks = [ // ISO/IEC 18004:2015 Table 10
	(x, y) => !((x + y) & 1),
	(x, y) => !(y & 1),
	(x, y) => !(x % 3),
	(x, y) => !((x + y) % 3),
	(x, y) => !((x - x % 3) / 3 + (y >> 1) & 1),
	(x, y) => !((x * y & 1) + x * y % 3),
	(x, y) => !((x * y & 1) + x * y % 3 & 1),
	(x, y) => !((x + y & 1) + x * y % 3 & 1)
];

function applyMask(z, m, f) {
	for (let y = 0, i = 0; y < z; ++y)
		for (let x = 0; x < z; ++x)
			m[i++] ^= f(x, y);
}

const N1 = 3, N2 = 3, N3 = 40, N4 = 10;
function score(z, m) { // ISO/IEC 18004:2015 Table 11
	var s = 0, d = 0;
	// adjacent modules in row/column in same color
	for (let y = 0, i = 0; y < z; ++y) {
		let v = m[i++], c = -4;
		for (let x = 1; x < z; ++x)
			if (m[i++] == v) ++c;
			else {
				if (c >= 0) s += N1 + c;
				v ^= 1, c = -4;
			}
		if (c >= 0) s += N1 + c;
	}
	for (let x = 0, i = 0; x < z; i = ++x) {
		let v = m[i], c = -4;
		for (let y = 1; d += v, y < z; ++y)
			if (m[i += z] == v) ++c;
			else {
				if (c >= 0) s += N1 + c;
				v ^= 1, c = -4;
			}
		if (c >= 0) s += N1 + c;
	}
	// proportion of dark modules in entire symbol
	s += N4 * (Math.abs(d / (z * z) - 0.5) / 0.05 | 0);
	// block of modules in same color
	for (let y = 0, i = 0; y < z - 1; ++y, ++i)
		for (let x = 0; x < z - 1; ++x, ++i) {
			let v = m[i];
			if (m[i + 1] == v && m[i + z] == v && m[i + z + 1] == v) s += N2;
		}
	// 1:1:3:1:1 ratio pattern in row, preceded or followed by light area 4 modules wide
	for (let y = 0, i = 0; y < z; ++y)
		for (let x = 0, b = 1; x < z; ++x) {
			let t = (b = b << 1 | m[i++]) & 0x1FFFFFF;
			if (t == 0x1C7FC7 || t == 0x1C7FC70 || (t &= 0x3FFFF) == 0x33F3 || t == 0x33F30 || (t &= 0x7FF) == 0x5D || t == 0x5D0)
				s += N3;
		}
	for (let x = 0, i = 0; x < z; i = ++x)
		for (let y = 0, b = 1; y < z; ++y, i += z) {
			let t = (b = b << 1 | m[i]) & 0x1FFFFFF;
			if (t == 0x1C7FC7 || t == 0x1C7FC70 || (t &= 0x3FFFF) == 0x33F3 || t == 0x33F30 || (t &= 0x7FF) == 0x5D || t == 0x5D0)
				s += N3;
		}
	return s;
}

function ecLevelIndicator(l) { // ISO/IEC 18004:2015 Table 12
	return ECLevel[l] ^ 1;
}

const exp = new Uint8Array(256), log = new Uint8Array(256);
for (let i = 0, p = 1; i < 256; ++i) {
	log[exp[i] = p] = i;
	if ((p <<= 1) & 256) p ^= 0x11d;
}

function generator(o) { // ISO/IEC 18004:2015 Table A.1
	const gen = generator.cache;
	var g = gen[o - 1];
	if (!g) for (var i = gen.length, g = gen[i - 1]; i < o; ++i) {
		const h = new Uint8Array(i + 1);
		for (let j = 0, a; j < i; ++j) h[j] = (a = g[j] + i) + (a >> 8); h[i] = i;
		for (let j = 1; j <= i; ++j) h[j] = log[exp[h[j]] ^ exp[g[j - 1]]];
		gen.push(g = h);
	}
	return g;
}
generator.cache = [];

const formatInfos = [ // ISO/IEC 18004:2015 Table C.1
	0x5412, 0x5125, 0x5E7C, 0x5B4B, 0x45F9, 0x40CE, 0x4F97, 0x4AA0, 0x77C4, 0x72F3, 0x7DAA, 0x789D, 0x662F, 0x6318, 0x6C41, 0x6976, 0x1689, 0x13BE, 0x1CE7, 0x19D0, 0x0762, 0x0255, 0x0D0C, 0x083B, 0x355F, 0x3068, 0x3F31, 0x3A06, 0x24B4, 0x2183, 0x2EDA, 0x2BED
];

function drawFormatInfo(z, m, l, i) {
	var b = i < 0 ? 0x7FFF : formatInfos[ecLevelIndicator(l) << 3 | i];
	for (var i = 0, j = 8, k = 9 * z; i < 8; j += z << (++i == 6)) m[--k] = m[j] = b & 1, b >>= 1;
	m[k = (z - 8) * z + 8] = 1; // "Dark Module"
	for (j -= z; i < 15; ++i) m[k += z] = m[j -= 1 << (i == 9)] = b & 1, b >>= 1;
}

const versionInfos = [ // ISO/IEC 18004:2015 Table D.1
	0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6, 0x0C762, 0x0D847, 0x0E60D, 0x0F928, 0x10B78, 0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683, 0x168C9, 0x177EC, 0x18EC4, 0x191E1, 0x1AFAB, 0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, 0x1F250, 0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B, 0x2542E, 0x26A64, 0x27541, 0x28C69
];

function* alignmentCoords(v) { // ISO/IEC 18004:2015 Table E.1
	if (v > 1) {
		var n = (v / 7 | 0) + 1, s = Math.round((v + 1) * 4 / n); s += s & 1;
		for (let c = 10 + v * 4; n--; c -= s) yield c;
		yield 6;
	}
}

function drawNonData(z, m, v, l, i) {
	var f = 0, g = z - 1, h = g * z;
	for (let b of i < 0 ? [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF] : [0xFE, 0x82, 0xBA, 0xBA, 0xBA, 0x82, 0xFE, 0]) {
		for (let x = 8; --x >= 0;) m[h + x] = m[g - x] = m[f + x] = b & 1, b >>= 1; // finders & separators
		f += z, g += z, h -= z;
	}
	for (f = 6 * z + 8, g = 8 * z + 6, h = z - 16; h > 0; ++f, g += z) m[g] = m[f] = h-- & 1 || i < 0; // timing patterns
	drawFormatInfo(z, m, l, i);
	if (v >= 7) {
		let b = i < 0 ? 0x3FFFF : versionInfos[v - 7];
		for (let g = 0, i = z - 11, j = i * z; g < 6; ++g, i += z - 3, j += 1 - 3 * z) // version info
			for (let h = 0; h < 3; ++h, ++i, j += z)
				m[i] = m[j] = b & 1, b >>= 1;
	}
	for (const a of alignmentCoords(v))
		for (const b of alignmentCoords(v))
			if (a == 6 ? b != 6 && b != z - 7 : b != 6 || a != z - 7) {
				f = (a - 2) * z + b - 2;
				for (let b of i < 0 ? [0x1F, 0x1F, 0x1F, 0x1F, 0x1F] : [0x1F, 0x11, 0x15, 0x11, 0x1F]) {
					for (let x = 5; --x >= 0;) m[f + x] = b & 1, b >>= 1; // alignment patterns
					f += z;
				}
			}
}

function Builder(v, l) {
	this.data = new Uint8Array(capacities[this.version = v][ECLevel[this.ecLevel = l]]);
	this.length = 0;
	this.eci = 3; // default to Latin-1
}
Object.defineProperties(Builder.prototype, Object.getOwnPropertyDescriptors({
	push(v, n) {
		var l = this.length;
		const d = this.data;
		if (l + n > d.length << 3) throw new RangeError("capacity exhausted");
		while (n) {
			const p = l & 7;
			let s = 8 - p;
			if (s > n) s = n;
			d[l >> 3] |= (v >> (n -= s) & (1 << s) - 1) << 8 - p - s;
			l += s;
		}
		this.length = l;
	},
	pushSegmentHeader(mode, count) {
		const n = charCountWidth(this.version, mode);
		if (!(count >= 0 && count < 1 << n)) throw new RangeError("illegal character count");
		this.push(mode, 4);
		this.push(count, n);
	},
	pushECI(e) {
		if (!eci.has(e)) throw new RangeError("unimplemented ECI");
		this.push(Mode.ECI, 4);
		if (!(e >> 7)) this.push(e, 8);
		else if (!(e >> 14)) this.push(e | 0x8000, 16);
		else this.push(e | 0xC00000, 24);
		this.eci = e;
	},
	pushTerminator() {
		this.push(Mode.Terminator, Math.min(4, (this.data.length << 3) - this.length));
	},
	padOut() {
		var l = this.length + 7 >> 3;
		const d = this.data, c = d.length;
		while (l < c) {
			d[l++] = 0xEC;
			if (l < c) d[l++] = 0x11;
		}
		this.length = c << 3;
	},
	*[Symbol.iterator]() {
		const p = ecParams(this.version, this.ecLevel), d = this.data;
		for (let w = 0, x = 0;; w = x) {
			for (var [n, c, k] of p)
				for (let b = 0; b < n; ++b, w += k)
					if (x < k) {
						const v = d[w];
						for (let s = 8; s > 0;)
							yield v >> --s & 1;
					}
			if (++x == k) break;
		}
		var w = 0, x = 0;
		const e = new Uint8Array(capacity(this.version) - d.length);
		for (const [n, c, k] of p) {
			const o = c - k, g = generator(o), r = new Uint8Array(c);
			for (let b = 0; b < n; ++b) {
				r.fill(0, k).set(d.subarray(w, w += k));
				for (let j = 0; j < k; ++j)
					if (r[j]) for (let l = 0, q = log[r[j]], a; l < o;)
						r[j + ++l] ^= exp[(a = g[o - l] + q) + (a >> 8) & 255];
				e.set(r.subarray(k), x), x += o;
			}
		}
		for (let w = 0, x = 0;; w = x) {
			for (var [n, c, k] of p) {
				var o = c - k;
				for (let b = 0; b < n; ++b, w += o)
					if (x < o) {
						const v = e[w];
						for (let s = 8; s > 0;)
							yield v >> --s & 1;
					}
			}
			if (++x == o) break;
		}
	},
}));

/*
function heapify(a, cmp) {
	for (var n = a.length - 2 >> 1; n >= 0; --n) {
		for (var v = a[n], i = n, j; (j = (i << 1) + 1) < a.length; i = j) {
			if (j + 1 < a.length && cmp(a[j + 1], a[j]) < 0) ++j;
			if (cmp(v, a[j]) < 0) break;
			(a[i] = a[j]).h = i;
		}
		(a[i] = v).h = i;
	}
}
*/

function heapRaise(a, cmp, v, i) {
	for (let j; i && cmp(v, a[j = i - 1 >> 1]) < 0; i = j) (a[i] = a[j]).h = i;
	(a[i] = v).h = i;
}

/*
function heapPush(a, cmp, v) {
	heapRaise(a, cmp, v, a.length);
}
*/

function heapSink(a, cmp, v, i) {
	for (let j; (j = (i << 1) + 1) < a.length; i = j) {
		if (j + 1 < a.length && cmp(a[j + 1], a[j]) < 0) ++j;
		if (cmp(v, a[j]) < 0) break;
		(a[i] = a[j]).h = i;
	}
	(a[i] = v).h = i;
}

function heapPop(a, cmp) {
	const r = a[0], v = a.pop();
	if (a.length) heapSink(a, cmp, v, 0);
	if (r) delete r.h;
	return r;
}

function makeSegments(opts) {
	const a = [...opts.text], n = a.length;
	var u = opts.minVersion, b = opts.allowedECIs;
	for (const [e, eo] of eci)
		if ((1 << e & 0x1E7BFF8 & b) && eo.canEncode(opts.text)) {
			b = 1 << e;
			break;
		}
	for (var v of [9, 26, 40]) {
		if (u > opts.maxVersion) break;
		if (v >= u) {
			let l = opts.minECLevel;
			const cap = capacities[Math.min(v, opts.maxVersion)][ECLevel[l]] * 48;
			const nodes = new Array(n), unvisited = [{ k: 0, e: 3, c: 0 }], cmp = (x, y) => x.c != y.c ? x.c - y.c : x.e - y.e;
			while (unvisited.length) {
				const node = heapPop(unvisited, cmp), { k, m, e, c } = node;
				if (k == n) {
					for (v = u; c > capacities[v][ECLevel[l]] * 48; ++v);
					for (u of ['M', 'Q', 'H']) { // upgrade EC level if possible without enlarging
						if (c > capacities[v][ECLevel[u]] * 48) break;
						l = u;
					}
					const segments = [];
					if (n) {
						nodes[n - 1] = nodes[n - 1].reduce((x, y) => y.c < x.c ? y : x);
						for (let i = n - 1, node = nodes[i]; --i >= 0;) node = nodes[i] = node.p;
						let i = 0, { m, e } = nodes[0];
						for (let j = 1; j < n; ++j) {
							const { m: mj, e: ej } = nodes[j];
							if (mj != m || ej != e) {
								segments.push([a.slice(i, j).join(""), m, e]);
								i = j, m = mj, e = ej;
							}
						}
						segments.push([a.slice(i, n).join(""), m, e]);
					}
					return { version: v, ecLevel: l, segments };
				}
				if (c >= cap) continue;
				let successors = nodes[k];
				if (!successors) {
					nodes[k] = successors = [];
					for (const ep of eci.keys())
						for (const [mp, mo] of modes.entries())
							if ((1 << ep & b) && mo.canEncode(a[k], ep)) {
								const node = { k: k + 1, m: mp, e: ep, c: Infinity, i: mo.cost(a[k], ep), h: unvisited.length };
								unvisited.push(node);
								successors.push(node);
							}
					if (!successors.length) throw new RangeError("unencodable data for QR Code");
				}
				for (const successor of successors) {
					if ("h" in successor) {
						let cp = c;
						if (successor.m != m || successor.e != e)
							cp = ceil6(cp) + ((successor.e != e) * 12 + 4 + charCountWidth(v, successor.m)) * 6;
						cp += successor.i;
						if (cp < successor.c) {
							successor.c = cp, successor.p = node;
							heapRaise(unvisited, cmp, successor, successor.h);
						}
					}
				}
			}
			u = v + 1;
		}
	}
	throw new RangeError("too much data for QR Code");
}

async function createImageBitmap(opts) {
	const { version: v, ecLevel: l, segments } = makeSegments(opts), b = new Builder(v, l), debug = [];
	for (const [s, m, e] of segments) {
		if (e != b.eci) {
			const n = b.length;
			b.pushECI(e);
			debug.push("ECI:" + e + "(" + eci.get(e).label + ")(" + (b.length - n) + " bits)");
		}
		const mo = modes.get(m), n = b.length;
		mo.encodeSegment(s, b);
		debug.push(mo.label + ":\"" + s + "\"(" + (b.length - n) + " bits)");
	}
	const n = b.length;
	b.pushTerminator();
	b.padOut();
	const z = matrixDim(v), m = new Uint8Array(z * z);
	drawNonData(z, m, v, l, -1);
	var dx = -1, dy = -1, x = z - 1, y = z - 1;
	for (const a of b)
		for (;;) {
			let i = y * z + x;
			x += dx;
			if ((dx = -dx) < 0 && ((y += dy) < 0 || y == z)) {
				y += (dy = -dy);
				if ((x -= 2) == 6) --x;
			}
			if (!m[i]) {
				m[i] = a;
				break;
			}
		}
	var bestScore, bestMask;
	for (let i = 0; i < 8; ++i) {
		applyMask(z, m, masks[i]);
		drawNonData(z, m, v, l, i);
		let s = score(z, m);
		if (!bestScore || s < bestScore) bestScore = s, bestMask = i;
		applyMask(z, m, masks[i]);
	}
	applyMask(z, m, masks[bestMask]);
	drawNonData(z, m, v, l, bestMask);
	const data = new ImageData(z, z), d = data.data;
	for (let i = 0, o = 0; i < m.length; ++i, ++o) d[o += 3] = m[i] * 255;
	const bitmap = await self.createImageBitmap(data, -4, -4, z + 8, z + 8);
	return { bitmap, version: v, ecLevel: l, dataLen: n, mask: bestMask, segments: debug };
}

addEventListener("message", (event) => {
	try {
		createImageBitmap(event.data).then((result) => {
			postMessage({ result }, [result.bitmap]);
		}, (error) => postMessage({ error }));
	}
	catch (error) {
		postMessage({ error });
	}
});
