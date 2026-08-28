import argparse
import os
import sys

import bpy


def script_args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


parser = argparse.ArgumentParser(description="Export an optimized 11.11 GLB")
parser.add_argument("--output", required=True)
parser.add_argument("--collection")
args = parser.parse_args(script_args())

output = os.path.abspath(args.output)
os.makedirs(os.path.dirname(output), exist_ok=True)

if args.collection:
    collection = bpy.data.collections.get(args.collection)
    if collection is None:
        raise RuntimeError(f"Collection not found: {args.collection}")
    bpy.ops.object.select_all(action="DESELECT")
    for item in collection.all_objects:
        item.select_set(True)

bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
bpy.ops.export_scene.gltf(
    filepath=output,
    export_format="GLB",
    use_selection=bool(args.collection),
    export_apply=True,
    export_animations=True,
    export_cameras=False,
    export_lights=False,
)
print(f"GLB_EXPORT_OK={output}")
