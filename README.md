# QRPerfect
### Optimal QR Code generator for international texts

QRPerfect is a client-side JavaScript/ES6 module for generating optimally compact QR Codes of international texts utilizing a mix of coded character sets. Of course, it also produces optimal QR Codes of plain US-ASCII text. It fully complies with the ISO/IEC 18004:2015 standard except that Micro QR Codes and the FNC1 and Structured Append modes are not supported. QRPerfect uses Dijkstra's algorithm to find the optimally compact segmentation of the input text, switching segment modes and Extended Channel Interpretations (ECIs) as necessary to achieve the densest possible encoding. The encoding executes asynchronously in a Web Worker, and the finished QR Code is transferred to the main browser context as an `ImageBitmap` that can be rendered to a HTML5 Canvas element.

**⇉ [CLICK HERE TO TRY A DEMO](https://whitslack.github.io/qrperfect/demo.html) ⇇**

### Example usage

```javascript
import QRCode from "./qrperfect.mjs";

addEventListener("DOMContentLoaded", () => {
    new QRCode("HELLO WORLD!").createCanvas()
        .then(({ canvas }) => document.body.appendChild(canvas));
});
```

----

## `QRCode` constructor

The `QRCode` constructor can constrain various parameters of the encoding:

```javascript
const text = "";
const options = {
    minVersion: 1,
    maxVersion: 40,
    minECLevel: 'L',
    allowedECIs: -1,
};
new QRCode(text, options);
```

* **`text`:** The string to encode. Optionally, the discrete `text` argument can be omitted and can instead be specified inside the `options` argument with a key of `text`.
* **`minVersion`:** The minimum allowable QR Code version to produce. Must be between 1 and 40 and less than or equal to `maxVersion`. Defaults to 1.
* **`maxVersion`:** The maximum allowable QR Code version to produce. Must be between 1 and 40 and greater than or equal to `minVersion`. Defaults to 40.
* **`minECLevel`:** The minimum allowable error correction level to use. Must be `'L'`, `'M'`, `'Q'`, or `'H'`, representing an error correction capacity of approximately 7%, 15%, 25%, or 30%, respectively. Defaults to `'L'`.
* **`allowedECIs`:** A bitmask of the allowable Extended Channel Interpretations, in which the bit positions correspond to the standard ECI designator indices. The default is -1, which allows all supported ECIs. If, for reasons of greater compatibility with non-compliant decoders, you wish to ensure that no ECI designators appear in your QR Codes, you can set this parameter to `1 << 3`, which will constrain the encoder to ECI 3 (Latin-1), which is the initial/implied ECI.

    The ECIs supported by QRPerfect are:
    | ECI designator | Bit value | Character encoding |
    |:----:|:----:|:----:|
    | \000003 | `1 << 3` | ISO/IEC 8859-1 (Latin-1) |
    | \000004 | `1 << 4` | ISO/IEC 8859-2 (Latin-2) |
    | \000005 | `1 << 5` | ISO/IEC 8859-3 (Latin-3) |
    | \000006 | `1 << 6` | ISO/IEC 8859-4 (Latin-4) |
    | \000007 | `1 << 7` | ISO/IEC 8859-5 (Latin/Cyrillic) |
    | \000008 | `1 << 8` | ISO/IEC 8859-6 (Latin/Arabic) |
    | \000009 | `1 << 9` | ISO/IEC 8859-7 (Latin/Greek) |
    | \000010 | `1 << 10` | ISO/IEC 8859-8 (Latin/Hebrew) |
    | \000011 | `1 << 11` | ISO/IEC 8859-9 (Latin-5) |
    | \000012 | `1 << 12` | ISO/IEC 8859-10 (Latin-6) |
    | \000013 | `1 << 13` | ISO/IEC 8859-11 (Latin/Thai) |
    | \000015 | `1 << 15` | ISO/IEC 8859-13 (Latin-7) |
    | \000016 | `1 << 16` | ISO/IEC 8859-14 (Latin-8) |
    | \000017 | `1 << 17` | ISO/IEC 8859-15 (Latin-9) |
    | \000018 | `1 << 18` | ISO/IEC 8859-16 (Latin-10) |
    | \000020 | `1 << 20` | Shift JIS |
    | \000021 | `1 << 21` | Windows-1250 |
    | \000022 | `1 << 22` | Windows-1251 (Cyrillic) |
    | \000023 | `1 << 23` | Windows-1252 |
    | \000024 | `1 << 24` | Windows-1256 (Arabic) |
    | \000026 | `1 << 26` | UTF-8 |
    | \000028 | `1 << 28` | Big5 |
    | \000029 | `1 << 29` | GB/T 2312 |
    | \000030 | `1 << 30` | KS X 1001 (Korean) |
    | \000031 | `1 << 31` | GBK |

The above parameters can also be changed on the `QRCode` instance after construction.

## `QRCode.prototype.createImageBitmap()`

`createImageBitmap()` asynchronously generates a QR Code according to the configured parameters and eventually resolves to an `ImageBitmap` containing the produced QR Code with one pixel representing each module.

```javascript
const qrCode = new QRCode(/*options*/);
const { bitmap } = await qrCode.createImageBitmap();
```

## `QRCode.prototype.createCanvas()`

`createCanvas()` is a convenience method that asynchronously delegates to `createImageBitmap()` and eventually resolves to a new `HTMLCanvasElement` that renders the produced `ImageBitmap` with a scaling factor.

```javascript
const qrCode = new QRCode(/*options*/);
const { canvas } = await qrCode.createCanvas(doc, moduleSize);
```

* **`doc`:** The `HTMLDocument` in which to create the `HTMLCanvasElement`. Defaults to the global `document` object.
* **`moduleSize`:** The scale factor at which to render the QR Code. Each module is rendered as a square having this many pixels on a side. Defaults to 8.

You may specify neither, either, or both arguments, but if you specify both, they must be in the order shown.
