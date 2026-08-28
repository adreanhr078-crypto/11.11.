"""Create a tiny, non-Canon Blender scene for deterministic pipeline testing."""

import argparse
import math
import os
import sys

import bpy
from mathutils import Vector


def script_args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def parse_args():
    parser = argparse.ArgumentParser(description="Create 11.11 media pipeline smoke scene")
    parser.add_argument("--output", required=True)
    return parser.parse_args(script_args())


def point_camera(camera, target):
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


def material(name, base_color, metallic, roughness, emission=None):
    item = bpy.data.materials.new(name)
    item.diffuse_color = (*base_color, 1.0)
    if item.node_tree is None:
        item.use_nodes = True
    node = item.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*base_color, 1.0)
    node.inputs["Metallic"].default_value = metallic
    node.inputs["Roughness"].default_value = roughness
    if emission:
        emission_input = node.inputs.get("Emission Color") or node.inputs.get("Emission")
        if emission_input:
            emission_input.default_value = (*emission, 1.0)
        strength = node.inputs.get("Emission Strength")
        if strength:
            strength.default_value = 1.8
    return item


def main():
    args = parse_args()
    output = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(output), exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    engines = {item.identifier for item in scene.bl_rna.properties["render"].fixed_type.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in engines else "BLENDER_WORKBENCH"
    scene.render.resolution_x = 320
    scene.render.resolution_y = 180
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new("PipelineSmokeWorld")
    scene.world.color = (0.003, 0.004, 0.008)
    scene.frame_start = 1
    scene.frame_end = 12
    scene.render.fps = 12

    crimson = material("SignalCrimson", (0.42, 0.006, 0.025), 0.65, 0.2, (0.9, 0.01, 0.03))
    obsidian = material("Obsidian", (0.006, 0.008, 0.014), 0.8, 0.26)

    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, 1.0), scale=(0.72, 0.72, 0.72))
    focus = bpy.context.object
    focus.name = "PipelineSmokeMesh"
    focus.data.materials.append(crimson)
    bevel = focus.modifiers.new("ProductionBevel", "BEVEL")
    bevel.width = 0.08
    bevel.segments = 3
    focus.rotation_euler.z = -0.18
    focus.keyframe_insert(data_path="rotation_euler", frame=1)
    focus.rotation_euler.z = 0.22
    focus.location.z = 1.12
    focus.keyframe_insert(data_path="rotation_euler", frame=12)
    focus.keyframe_insert(data_path="location", frame=12)
    if focus.animation_data and focus.animation_data.action:
        focus.animation_data.action.name = "Idle"

    bpy.ops.mesh.primitive_plane_add(size=12, location=(0.0, 0.0, 0.0))
    floor = bpy.context.object
    floor.name = "PipelineSmokeFloor"
    floor.data.materials.append(obsidian)

    bpy.ops.object.light_add(type="AREA", location=(2.5, -2.0, 4.5))
    key = bpy.context.object
    key.name = "CrimsonKey"
    key.data.energy = 700
    key.data.color = (1.0, 0.015, 0.04)
    key.data.shape = "DISK"
    key.data.size = 3.0

    bpy.ops.object.light_add(type="AREA", location=(-3.0, 1.0, 3.0))
    rim = bpy.context.object
    rim.name = "CyanRim"
    rim.data.energy = 450
    rim.data.color = (0.02, 0.55, 0.75)
    rim.data.size = 2.5

    bpy.ops.object.camera_add(location=(4.2, -6.2, 3.7))
    camera = bpy.context.object
    camera.name = "PipelineSmokeCamera"
    camera.data.lens = 52
    point_camera(camera, (0.0, 0.0, 0.85))
    scene.camera = camera

    scene.render.filepath = os.path.join(os.path.dirname(output), "frames", "frame_")
    bpy.ops.wm.save_as_mainfile(filepath=output)
    print(f"SMOKE_BLEND_CREATED={output}")


if __name__ == "__main__":
    main()
