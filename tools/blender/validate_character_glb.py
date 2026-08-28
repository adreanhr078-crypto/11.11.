"""Re-import and validate a production-bound 11.11 character GLB."""

import argparse
import os
import sys

import bpy


REQUIRED_BONES = {
    "root",
    "hips",
    "spine_01",
    "spine_02",
    "neck",
    "head",
    "upper_arm.L",
    "lower_arm.L",
    "hand.L",
    "upper_arm.R",
    "lower_arm.R",
    "hand.R",
    "thigh.L",
    "shin.L",
    "foot.L",
    "toe.L",
    "thigh.R",
    "shin.R",
    "foot.R",
    "toe.R",
}
DEFAULT_REQUIRED_CLIPS = ("IDLE", "WALK", "RUN", "INTERACT")


def script_args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def parse_args():
    parser = argparse.ArgumentParser(description="Validate 11.11 character GLB")
    parser.add_argument("--input", required=True)
    parser.add_argument("--identifier", required=True)
    parser.add_argument("--max-meshes", type=int, default=32)
    parser.add_argument("--max-materials", type=int, default=16)
    parser.add_argument("--max-triangles", type=int, default=80000)
    parser.add_argument("--max-bones", type=int, default=128)
    parser.add_argument("--required-clips", default=",".join(DEFAULT_REQUIRED_CLIPS))
    return parser.parse_args(script_args())


def mesh_triangles(mesh_object):
    mesh_object.data.calc_loop_triangles()
    return len(mesh_object.data.loop_triangles)


def main():
    args = parse_args()
    source = os.path.abspath(args.input)
    if not os.path.isfile(source):
        raise FileNotFoundError(source)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=source)

    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if len(armatures) != 1:
        raise RuntimeError(f"Expected one armature, found {len(armatures)}")
    if not meshes:
        raise RuntimeError("Character has no meshes")
    if len(meshes) > args.max_meshes:
        raise RuntimeError(f"Mesh count {len(meshes)} exceeds {args.max_meshes}")

    bone_names = set(armatures[0].data.bones.keys())
    missing = sorted(REQUIRED_BONES - bone_names)
    if missing:
        raise RuntimeError(f"Missing required bones: {missing}")
    if len(bone_names) > args.max_bones:
        raise RuntimeError(f"Bone count {len(bone_names)} exceeds {args.max_bones}")

    compact_id = args.identifier.replace("-", "").upper()
    tattoo_meshes = [
        obj for obj in meshes
        if "SKINTATTOO" in obj.name.upper()
        and compact_id in obj.name.replace("-", "").upper()
    ]
    if not tattoo_meshes:
        raise RuntimeError(
            f"Missing direct-skin identifier tattoo mesh for {args.identifier}; "
            "the mark may not be baked into clothing or authoritative state"
        )

    material_names = {
        slot.material.name
        for mesh in meshes
        for slot in mesh.material_slots
        if slot.material
    }
    if len(material_names) > args.max_materials:
        raise RuntimeError(f"Material count {len(material_names)} exceeds {args.max_materials}")

    triangle_count = sum(mesh_triangles(mesh) for mesh in meshes)
    if triangle_count > args.max_triangles:
        raise RuntimeError(f"Triangle count {triangle_count} exceeds {args.max_triangles}")

    action_names = {action.name.upper() for action in bpy.data.actions}
    required_clips = [name.strip().upper() for name in args.required_clips.split(",") if name.strip()]
    for clip in required_clips:
        if not any(clip in action_name for action_name in action_names):
            raise RuntimeError(f"Missing runtime animation: {clip}")

    print(f"CHARACTER_GLB_VALID={source}")
    print(f"CHARACTER_IDENTIFIER_VALID={args.identifier}")
    print(f"CHARACTER_MESH_COUNT={len(meshes)}")
    print(f"CHARACTER_MATERIAL_COUNT={len(material_names)}")
    print(f"CHARACTER_TRIANGLE_COUNT={triangle_count}")
    print(f"CHARACTER_BONE_COUNT={len(bone_names)}")
    print(f"CHARACTER_ANIMATION_COUNT={len(action_names)}")


if __name__ == "__main__":
    main()
