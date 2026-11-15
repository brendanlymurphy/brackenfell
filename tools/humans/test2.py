import sys, os; sys.path.insert(0, os.path.dirname(__file__))
import bpy, mh_common as C
bpy.ops.wm.open_mainfile(filepath=sys.argv[-2])
try: bpy.ops.preferences.addon_enable(module='bl_ext.user_default.mpfb')
except Exception as e: print(e)
Export = C.svc('exportservice', 'ExportService'); Obj = C.svc('objectservice', 'ObjectService')
bm = bpy.data.objects['Human']
for o in bpy.data.objects:
    if o.type == 'MESH':
        for m in list(o.modifiers):
            if m.type == 'SUBSURF': o.modifiers.remove(m)
Export.bake_modifiers_remove_helpers(bm, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=True)
tot = 0
for o in bpy.data.objects:
    if o.type == 'MESH':
        o.data.calc_loop_triangles(); n = len(o.data.loop_triangles); tot += n
        print(o.name, 'verts', len(o.data.vertices), 'tris', n, 'mods', [m.type for m in o.modifiers], 'mats', [m.name for m in o.data.materials], 'vgroups', len(o.vertex_groups))
print('total tris', tot)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=sys.argv[-1], export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_yup=True, export_apply=False)
print('exported', os.path.getsize(sys.argv[-1]))
