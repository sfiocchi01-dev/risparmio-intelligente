"""Generate original PNG PWA icons with the Python standard library (no dependencies)."""
import pathlib, struct, zlib
ROOT = pathlib.Path(__file__).resolve().parents[1] / "icons"

def make(size, maskable=False):
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            X, Y = x / size * 128, y / size * 128
            if maskable:
                X, Y = (X-64)/.78+64, (Y-64)/.78+64
            color = (101,80,223)
            def ellipse(cx,cy,rx,ry):
                return ((X-cx)/rx)**2+((Y-cy)/ry)**2<=1
            if (35<=X<=46 or 80<=X<=91) and 85<=Y<=106:
                color=(208,193,252)
            if 86<=X<=102 and 27<=Y<=50: color=(233,226,255)
            if ellipse(64,66,43,31): color=(196,180,245)
            if ellipse(53,54,20,7): color=(222,212,250)
            if 98<=X<=117 and 61<=Y<=80: color=(233,226,255)
            if ellipse(87,56,3,3): color=(48,36,80)
            if ellipse(104,70,2,2) or ellipse(111,70,2,2) or (52<=X<=77 and 39<=Y<=43):
                color=(101,80,223)
            row.extend(color)
        rows.append(b'\x00'+bytes(row))
    def chunk(name,data):
        return struct.pack('>I',len(data))+name+data+struct.pack('>I',zlib.crc32(name+data)&0xffffffff)
    data=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows)))+chunk(b'IEND',b'')
    (ROOT / (f'icon-maskable.png' if maskable else f'icon-{size}.png')).write_bytes(data)
make(192)
make(512)
make(512,True)
