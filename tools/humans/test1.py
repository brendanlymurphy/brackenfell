import sys, os; sys.path.insert(0, os.path.dirname(__file__))
import bpy, mh_common as C
C.boot()
Human = C.svc('humanservice', 'HumanService'); Asset = C.svc('assetservice', 'AssetService'); Target = C.svc('targetservice', 'TargetService')
Export = C.svc('exportservice', 'ExportService'); Obj = C.svc('objectservice', 'ObjectService')
md = Target.get_default_macro_info_dict(); print(md)
md['gender'] = 1.0; md['age'] = 0.6; md['muscle'] = 0.6; md['weight'] = 0.55
bm = Human.create_human(macro_detail_dict=md, feet_on_ground=True, scale=0.1)
print('basemesh', bm.name, len(bm.data.vertices))
skin = Asset.find_asset_absolute_path('middleage_caucasian_male.mhmat', asset_subdir='skins'); print('skin', skin)
Human.set_character_skin(skin, bm, skin_type='GAMEENGINE')
Human.add_builtin_rig(bm, 'game_engine')
for sub, f, t in [('eyes', 'low-poly.mhclo', 'Eyes'), ('eyebrows', 'eyebrow006.mhclo', 'Eyebrows'), ('eyelashes', 'eyelashes01.mhclo', 'Eyelashes'), ('hair', 'short02.mhclo', 'Hair'),
                  ('clothes', 'rehmanpolanski_viking_tunic.mhclo', 'Clothes'), ('clothes', 'rehmanpolanski_viking_pants.mhclo', 'Clothes'), ('clothes', 'rehmanpolanski_viking_boots.mhclo', 'Clothes')]:
    p = Asset.find_asset_absolute_path(f, asset_subdir=sub)
    print(t, f, p)
    if p: Human.add_mhclo_asset(p, bm, asset_type=t, material_type='GAMEENGINE')
for o in bpy.data.objects: print(o.type, o.name, len(o.data.vertices) if o.type == 'MESH' else '', [m.type for m in o.modifiers] if o.type == 'MESH' else '')
arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
print('bones', len(arm.data.bones), [b.name for b in arm.data.bones][:60])
bpy.ops.wm.save_as_mainfile(filepath=sys.argv[-1])
