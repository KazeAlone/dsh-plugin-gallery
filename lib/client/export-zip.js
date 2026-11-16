/** Small ZIP STORE writer for UTF-8 text exports; no runtime dependency. */
export function textZip(files) {
    const encoder = new TextEncoder(), local = [], central = [];
    let offset = 0, centralSize = 0;
    const entries = Object.entries(files);
    if (entries.length > 65535)
        throw new Error('Too many export files');
    for (const [path, text] of entries) {
        if (!path || path.startsWith('/') || path.includes('\\') || path.split('/').some(p => p === '..' || p === '.' || !p) || path.includes(':'))
            throw new Error('Unsafe export path');
        const name = encoder.encode(path), data = encoder.encode(text);
        if (name.length > 65535 || offset + data.length > 0xffffffff)
            throw new Error('Export too large');
        let crc = 0xffffffff;
        for (const byte of data) {
            crc ^= byte;
            for (let bit = 0; bit < 8; bit++)
                crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
        }
        crc = (crc ^ 0xffffffff) >>> 0;
        const header = new Uint8Array(30 + name.length), view = new DataView(header.buffer);
        view.setUint32(0, 0x04034b50, true);
        view.setUint16(4, 20, true);
        view.setUint16(6, 0x800, true);
        view.setUint16(12, 33, true); // DOS date 1980-01-01; deterministic output
        view.setUint32(14, crc, true);
        view.setUint32(18, data.length, true);
        view.setUint32(22, data.length, true);
        view.setUint16(26, name.length, true);
        header.set(name, 30);
        const record = new Uint8Array(46 + name.length), cv = new DataView(record.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0x800, true);
        cv.setUint16(14, 33, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, data.length, true);
        cv.setUint32(24, data.length, true);
        cv.setUint16(28, name.length, true);
        cv.setUint32(42, offset, true);
        record.set(name, 46);
        local.push(header, data);
        central.push(record);
        offset += header.length + data.length;
        centralSize += record.length;
    }
    const end = new Uint8Array(22), ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    const result = new Uint8Array(offset + centralSize + end.length);
    let cursor = 0;
    for (const part of [...local, ...central, end]) {
        result.set(part, cursor);
        cursor += part.length;
    }
    return result;
}
export function downloadTextZip(name, files) {
    const url = URL.createObjectURL(new Blob([textZip(files)], { type: 'application/zip' }));
    const anchor = document.createElement('a');
    try {
        anchor.href = url;
        anchor.download = `${name}-opencode.zip`;
        document.body.append(anchor);
        anchor.click();
    }
    finally {
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
