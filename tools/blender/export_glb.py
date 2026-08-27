"""
tools/blender/export_glb.py

Blender Python script for headless GLB/GLTF export.
Called by: blender --background scene.blend --python tools/blender/export_glb.py

Usage:
  blender --background scene.blend --python tools/blender/export_glb.py -- --output model.glb --collection Main
"""

import bpy
import sys
import os

def parse_args():
    argv = sys.argv
    if '--' in argv:
        argv = argv[argv.index('--') + 1:]
    else:
        argv = []
    args = {}
    i = 0
    while i < len(argv):
        if argv[i].startswith('--'):
            key = argv[i][2:]
            if i + 1 < len(argv) and not argv[i + 1].startswith('--'):
                args[key] = argv[i + 1]
                i += 2
            else:
                args[key] = True
                i += 1
        else:
            i += 1
    return args

def export_glb(output_path: str, collection_name: str = None):
    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')

    # Optionally select only a specific collection
    if collection_name and collection_name in bpy.data.collections:
        coll = bpy.data.collections[collection_name]
        for obj in coll.objects:
            obj.select_set(True)

    # Export as GLB
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_apply=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
    )
    print(f'EXPORTED_GLB: {output_path}')

def main():
    args = parse_args()
    output = args.get('output', os.path.join(os.path.dirname(bpy.data.filepath), 'output.glb'))
    collection = args.get('collection', None)
    export_glb(output, collection)

if __name__ == '__main__':
    main()
