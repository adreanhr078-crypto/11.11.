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

def collection_objects_recursive(collection):
    objects = list(collection.objects)
    for child in collection.children:
        objects.extend(collection_objects_recursive(child))
    return objects


def export_glb(output_path: str, collection_name: str = None):
    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')

    # Optionally select only a specific collection
    use_selection = False
    if collection_name:
        if collection_name not in bpy.data.collections:
            raise ValueError(f'Collection not found: {collection_name}')
        coll = bpy.data.collections[collection_name]
        for obj in collection_objects_recursive(coll):
            obj.select_set(True)
        use_selection = True

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    export_kwargs = {
        'filepath': output_path,
        'export_format': 'GLB',
        'export_apply': True,
        'export_animations': True,
        'export_cameras': False,
        'export_lights': False,
        'use_selection': use_selection,
    }
    supported = {prop.identifier for prop in bpy.ops.export_scene.gltf.get_rna_type().properties}
    if 'export_animation_mode' in supported:
        export_kwargs['export_animation_mode'] = 'ACTIONS'

    # Export as GLB
    bpy.ops.export_scene.gltf(**export_kwargs)
    print(f'EXPORTED_GLB: {output_path}')

def main():
    args = parse_args()
    output = args.get('output', os.path.join(os.path.dirname(bpy.data.filepath), 'output.glb'))
    collection = args.get('collection', None)
    export_glb(output, collection)

if __name__ == '__main__':
    main()
