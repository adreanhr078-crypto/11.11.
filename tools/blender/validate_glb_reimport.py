"""Re-import a GLB in Blender and reject broken scene data."""

import argparse
import math
import os
import sys

import bpy


def script_args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def parse_args():
    parser = argparse.ArgumentParser(description="Re-import and validate a GLB in Blender")
    parser.add_argument("--input", required=True)
    return parser.parse_args(script_args())


def finite_vector(values):
    return all(math.isfinite(value) for value in values)


def main():
    args = parse_args()
    source = os.path.abspath(args.input)
    if not os.path.isfile(source):
        raise FileNotFoundError(source)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=source)

    meshes = [item for item in bpy.context.scene.objects if item.type == "MESH"]
    if not meshes:
        raise RuntimeError("GLB re-import produced no meshes")

    for item in bpy.context.scene.objects:
        if not finite_vector(item.location) or not finite_vector(item.rotation_euler) or not finite_vector(item.scale):
            raise RuntimeError(f"Non-finite transform on {item.name}")
    for mesh in meshes:
        if not mesh.data.vertices:
            raise RuntimeError(f"Empty mesh after re-import: {mesh.name}")

    print(f"GLB_REIMPORT_VALID={source}")
    print(f"GLB_REIMPORT_MESHES={len(meshes)}")
    print(f"GLB_REIMPORT_ACTIONS={len(bpy.data.actions)}")


if __name__ == "__main__":
    main()
