import argparse
import math
import os
import sys

import bpy


FPS = 24
END_FRAME = 840
SHOT_RANGES = ((1, 144), (145, 312), (313, END_FRAME))


def script_args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def parse_args():
    parser = argparse.ArgumentParser(description="Build the Echo experiment prologue animatic")
    parser.add_argument("--reference-dir", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--preview-dir")
    return parser.parse_args(script_args())


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.materials, bpy.data.cameras, bpy.data.curves):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def make_emission_material(name, color, strength=4.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = color
    emission.inputs["Strength"].default_value = strength
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return material


def make_image_material(name, image_path):
    image = bpy.data.images.load(image_path, check_existing=True)
    image.pack()
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    texture.interpolation = "Linear"
    emission.inputs["Strength"].default_value = 1.0
    links.new(texture.outputs["Color"], emission.inputs["Color"])
    links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return material


def add_plane(name, material, z=0.0):
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0.0, 0.0, z))
    plane = bpy.context.object
    plane.name = name
    plane.scale = (8.0, 4.5, 1.0)
    plane.data.materials.append(material)
    return plane


def key_visibility(obj, visible_start, visible_end):
    obj.hide_render = True
    obj.keyframe_insert(data_path="hide_render", frame=max(1, visible_start - 1))
    obj.hide_render = False
    obj.keyframe_insert(data_path="hide_render", frame=visible_start)
    obj.hide_render = False
    obj.keyframe_insert(data_path="hide_render", frame=visible_end)
    if visible_end < END_FRAME:
        obj.hide_render = True
        obj.keyframe_insert(data_path="hide_render", frame=visible_end + 1)


def add_letterbox(material):
    for name, y in (("LetterboxTop", 4.28), ("LetterboxBottom", -4.28)):
        bpy.ops.mesh.primitive_cube_add(location=(0.0, y, 0.45), scale=(8.5, 0.28, 0.02))
        bar = bpy.context.object
        bar.name = name
        bar.data.materials.append(material)


def add_scan_line(material):
    bpy.ops.mesh.primitive_cube_add(location=(0.0, 3.2, 0.35), scale=(7.0, 0.006, 0.01))
    scan = bpy.context.object
    scan.name = "TattooScanLine"
    scan.data.materials.append(material)
    key_visibility(scan, 160, 292)
    scan.location.y = 3.0
    scan.keyframe_insert(data_path="location", frame=160)
    scan.location.y = -3.0
    scan.keyframe_insert(data_path="location", frame=292)


def add_activation_rings(material):
    for index, radius in enumerate((1.65, 2.35, 3.05)):
        bpy.ops.mesh.primitive_torus_add(
            major_radius=radius,
            minor_radius=0.012,
            major_segments=96,
            minor_segments=8,
            location=(0.0, -0.8, 0.32 + index * 0.01),
        )
        ring = bpy.context.object
        ring.name = f"ActivationRing{index + 1:02d}"
        ring.data.materials.append(material)
        key_visibility(ring, 313, END_FRAME)
        ring.scale = (0.15, 0.04, 0.15)
        ring.keyframe_insert(data_path="scale", frame=313 + index * 18)
        ring.scale = (1.0, 0.23, 1.0)
        ring.keyframe_insert(data_path="scale", frame=410 + index * 24)


def add_camera():
    camera_data = bpy.data.cameras.new("PrologueCamera")
    camera = bpy.data.objects.new("PrologueCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0.0, 0.0, 10.0)
    camera.rotation_euler = (0.0, 0.0, 0.0)
    camera_data.type = "ORTHO"
    bpy.context.scene.camera = camera

    for start, end, start_scale, end_scale in (
        (1, 144, 16.0, 14.8),
        (145, 312, 13.3, 12.3),
        (313, END_FRAME, 16.0, 14.4),
    ):
        camera_data.ortho_scale = start_scale
        camera_data.keyframe_insert(data_path="ortho_scale", frame=start)
        camera_data.ortho_scale = end_scale
        camera_data.keyframe_insert(data_path="ortho_scale", frame=end)

    camera.location.x = -0.20
    camera.keyframe_insert(data_path="location", frame=1)
    camera.location.x = 0.22
    camera.keyframe_insert(data_path="location", frame=144)
    camera.location.x = 0.28
    camera.keyframe_insert(data_path="location", frame=145)
    camera.location.x = -0.15
    camera.keyframe_insert(data_path="location", frame=312)
    camera.location.x = 0.0
    camera.keyframe_insert(data_path="location", frame=313)
    camera.location.x = 0.12
    camera.keyframe_insert(data_path="location", frame=END_FRAME)


def configure_scene():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = END_FRAME
    scene.render.fps = FPS
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.film_transparent = False
    scene.world.color = (0.001, 0.001, 0.002)
    scene.render.use_file_extension = True
    scene.view_settings.look = "AgX - Medium High Contrast"

    scene.timeline_markers.new("ENTRY", frame=1)
    scene.timeline_markers.new("YUKI_WITNESS", frame=145)
    scene.timeline_markers.new("EX_011_SKIN_TATTOO", frame=205)
    scene.timeline_markers.new("ACTIVATION", frame=313)
    scene.timeline_markers.new("TRANSITION_TO_PUZZLE_1", frame=END_FRAME)


def render_previews(preview_dir):
    if not preview_dir:
        return
    preview_dir = os.path.abspath(preview_dir)
    os.makedirs(preview_dir, exist_ok=True)
    scene = bpy.context.scene
    for label, frame in (("entry", 72), ("tattoo", 228), ("activation", 552)):
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(preview_dir, f"proof-{label}-v1.png")
        bpy.ops.render.render(write_still=True)
        print(f"PROOF_FRAME_OK={scene.render.filepath}")


def main():
    args = parse_args()
    reference_dir = os.path.abspath(args.reference_dir)
    output = os.path.abspath(args.output)
    image_paths = (
        os.path.join(reference_dir, "keyframe-01-entry-v1.png"),
        os.path.join(reference_dir, "keyframe-02-tattoo-scan-v1.png"),
        os.path.join(reference_dir, "keyframe-03-activation-v1.png"),
    )
    for image_path in image_paths:
        if not os.path.isfile(image_path):
            raise FileNotFoundError(image_path)

    reset_scene()
    configure_scene()
    add_camera()

    for index, (image_path, frame_range) in enumerate(zip(image_paths, SHOT_RANGES), start=1):
        material = make_image_material(f"KeyframeMaterial{index:02d}", image_path)
        plane = add_plane(f"KeyframePlane{index:02d}", material, z=index * 0.01)
        key_visibility(plane, *frame_range)

    black = make_emission_material("Obsidian", (0.0, 0.0, 0.0, 1.0), 0.0)
    crimson = make_emission_material("SignalCrimson", (1.0, 0.012, 0.035, 1.0), 2.5)
    add_letterbox(black)
    add_scan_line(crimson)
    add_activation_rings(crimson)

    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=output)
    print(f"PROLOGUE_BLEND_OK={output}")
    render_previews(args.preview_dir)


if __name__ == "__main__":
    main()
