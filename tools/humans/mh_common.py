"""Shared set-up for the MakeHuman (MPFB2) scripts: enables the add-on inside headless Blender and exposes its services."""
import bpy, sys, importlib
def boot():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try: bpy.ops.preferences.addon_enable(module='bl_ext.user_default.mpfb')
    except Exception as e: print('enable', e)
def svc(mod, key):
    for name in list(sys.modules):
        if name.endswith('mpfb.services.' + mod): return getattr(importlib.import_module(name), key)
    raise ValueError(mod)
