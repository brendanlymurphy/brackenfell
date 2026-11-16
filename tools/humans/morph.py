"""Face-morph bookkeeping for gen.py: gives every face vertex the column of the shared viseme table it reads (attribute _vid, exported as _VID),
adds teeth and tongue that follow the jaw. See visemes_table.py and the "face morphs" part of src/49_chars.js."""
import json, os
import bpy, numpy as np
from mathutils import Vector, kdtree

def table(path):
    return json.load(open(path))

def tag_original_index(me):
    a = me.attributes.new('_oidx', 'INT', 'POINT'); a.data.foreach_set('value', list(range(len(me.vertices))))

def assign_body(me, tab):
    rows = {k: i + 1 for i, k in enumerate(tab['idx'])}
    oi = me.attributes['_oidx']; a = me.attributes.new('_vid', 'FLOAT', 'POINT')
    a.data.foreach_set('value', [float(rows.get(oi.data[i].value, 0)) for i in range(len(me.vertices))])

def assign_nearest(obj, body, tab):
    """Eyebrows and lashes: the row of the nearest face vertex of the body."""
    me, bm = obj.data, body.data; va = bm.attributes['_vid']
    pts = [(i, body.matrix_world @ v.co) for i, v in enumerate(bm.vertices) if va.data[i].value > 0]
    kd = kdtree.KDTree(len(pts))
    for j, (i, p) in enumerate(pts): kd.insert(p, i)
    kd.balance(); a = me.attributes.new('_vid', 'FLOAT', 'POINT')
    for i, v in enumerate(me.vertices): a.data[i].value = va.data[kd.find(obj.matrix_world @ v.co)[1]].value

def assign_mouth(obj, tab, upper_sel, slot):
    """Teeth (upper still, lower with the jaw) and tongue: fixed table columns; and the vertex colour that names their colour slot."""
    me = obj.data; a = me.attributes.new('_vid', 'FLOAT', 'POINT')
    ys = sorted((obj.matrix_world @ v.co).z for v in me.vertices); mid = ys[len(ys) // 2]
    for i, v in enumerate(me.vertices):
        if slot == 'tongue': a.data[i].value = float(tab['tongue'])
        else: a.data[i].value = float(tab['upper'] if (obj.matrix_world @ v.co).z > mid else tab['lower'])
    ca = me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
    for i in range(len(me.vertices)): ca.data[i].color = (1, 1, 0, (10 if slot == 'teeth' else 11) / 12.0)
