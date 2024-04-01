const promises = [];

const worker = new Worker("qrperfect.worker.mjs", { type: "module" });
worker.addEventListener("message", (event) => {
	const p = promises.shift();
	if (!p)
		console.error("spurious message received from QR Code worker");
	else if (event.data.error)
		p.reject(event.data.error);
	else
		p.resolve(event.data.result);
});

export default function QRCode(text, opts) {
	if (opts === undefined && typeof text == "object") opts = text, text = undefined;
	const p = {
		minVersion: 1,
		maxVersion: 40,
		minECLevel: 'L',
		allowedECIs: -1,
	};
	Object.defineProperty(this, "_private", { value: p });
	this.text = text;
	if (opts) {
		if (opts.minVersion > opts.maxVersion) throw new RangeError("minVersion must not exceed maxVersion");
		for (const opt in opts) if (opt in this) this[opt] = opts[opt];
	}
}
Object.defineProperties(QRCode.prototype, Object.getOwnPropertyDescriptors({
	get minVersion() {
		return this._private.minVersion;
	},
	set minVersion(v) {
		if (!(v >= 1 && v <= 40)) throw new RangeError("minVersion must be between 1 and 40");
		const p = this._private;
		if ((p.minVersion = v) > p.maxVersion) p.maxVersion = v;
	},
	get maxVersion() {
		return this._private.maxVersion;
	},
	set maxVersion(v) {
		if (!(v >= 1 && v <= 40)) throw new RangeError("maxVersion must be between 1 and 40");
		const p = this._private;
		if ((p.maxVersion = v) < p.minVersion) p.minVersion = v;
	},
	get minECLevel() {
		return this._private.minECLevel;
	},
	set minECLevel(l) {
		if (!['L', 'M', 'Q', 'H'].includes(l)) throw new RangeError("minECLevel must be L, M, Q, or H");
		this._private.minECLevel = l;
	},
	get allowedECIs() {
		return this._private.allowedECIs;
	},
	set allowedECIs(e) {
		if (e !== (e | 0)) throw new RangeError("allowedECIs must be an integer (bitmask)");
		this._private.allowedECIs = e;
	},
	createImageBitmap() {
		return new Promise((resolve, reject) => {
			try {
				worker.postMessage({
					minVersion: this.minVersion,
					maxVersion: this.maxVersion,
					minECLevel: this.minECLevel,
					allowedECIs: this.allowedECIs,
					text: this.text,
				});
				promises.push({ resolve, reject });
			}
			catch (e) {
				reject(e);
			}
		});
	},
	async createCanvas(doc, moduleSize) {
		if (typeof doc == "number" && moduleSize === undefined) moduleSize = doc, doc = undefined;
		moduleSize ||= 8;
		const r = await this.createImageBitmap(), bitmap = r.bitmap;
		delete r.bitmap;
		const canvas = r.canvas = (doc || document).createElement("canvas");
		canvas.width = bitmap.width, canvas.height = bitmap.height;
		if (moduleSize != 1) {
			canvas.style.width = canvas.width * moduleSize + "px";
			canvas.style.height = canvas.height * moduleSize + "px";
		}
		canvas.style.backgroundColor = "white";
		canvas.style.imageRendering = "pixelated";
		// canvas.getContext("bitmaprenderer").transferFromImageBitmap(bitmap);
		canvas.getContext("2d").drawImage(bitmap, 0, 0);
		bitmap.close();
		return r;
	},
}));
