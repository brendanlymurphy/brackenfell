"""Minimal glTF (.gltf + .bin) reader for the tree tools: nodes with baked transforms, primitives as numpy arrays."""
import json, os, numpy as np
CT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8, 5122: np.int16, 5120: np.int8}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
class Gltf:
    def __init__(self, path):
        self.dir = os.path.dirname(path); self.j = json.load(open(path)); self.bufs = [np.memmap(os.path.join(self.dir, b['uri']), dtype=np.uint8, mode='r') for b in self.j['buffers']]
    def acc(self, i):
        a = self.j['accessors'][i]; bv = self.j['bufferViews'][a['bufferView']]; off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        dt = np.dtype(CT[a['componentType']]); n = NC[a['type']]; stride = bv.get('byteStride', 0) or dt.itemsize * n
        raw = self.bufs[bv['buffer']]
        if stride == dt.itemsize * n: arr = np.frombuffer(raw, dtype=dt, count=a['count'] * n, offset=off)
        else: arr = np.lib.stride_tricks.as_strided(np.frombuffer(raw, dtype=dt, count=1, offset=off), shape=(a['count'], n), strides=(stride, dt.itemsize)).reshape(-1)
        arr = arr.reshape(-1, n) if n > 1 else arr
        if a.get('normalized'): arr = arr.astype(np.float32) / (np.iinfo(dt).max)
        return arr
    def node_matrix(self, n):
        if 'matrix' in n: return np.array(n['matrix'], np.float64).reshape(4, 4).T
        M = np.eye(4)
        if 'scale' in n: M = M @ np.diag(list(n['scale']) + [1.0])
        if 'rotation' in n:
            x, y, z, w = n['rotation']; R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 0], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 0], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y), 0], [0, 0, 0, 1]]); M = R @ M
        if 'translation' in n: T = np.eye(4); T[:3, 3] = n['translation']; M = T @ M
        return M
    def meshes(self, sel=None):
        """yields (node name, material name, positions Nx3 world, normals, uvs, indices Tx3) for every root-level mesh primitive"""
        for ni in self.j['scenes'][self.j.get('scene', 0)]['nodes']:
            n = self.j['nodes'][ni]
            if 'mesh' not in n or (sel and sel not in n.get('name', '')): continue
            M = self.node_matrix(n); R = np.linalg.inv(M[:3, :3]).T
            for p in self.j['meshes'][n['mesh']]['primitives']:
                P = self.acc(p['attributes']['POSITION']).astype(np.float64) @ M[:3, :3].T + M[:3, 3]
                N = self.acc(p['attributes']['NORMAL']).astype(np.float64) @ R.T if 'NORMAL' in p['attributes'] else None
                UV = self.acc(p['attributes']['TEXCOORD_0']).astype(np.float64) if 'TEXCOORD_0' in p['attributes'] else None
                I = self.acc(p['indices']).astype(np.int64).reshape(-1, 3) if 'indices' in p else np.arange(len(P)).reshape(-1, 3)
                mat = self.j['materials'][p['material']]
                yield n['name'], mat, P.astype(np.float32), None if N is None else N.astype(np.float32), None if UV is None else UV.astype(np.float32), I
