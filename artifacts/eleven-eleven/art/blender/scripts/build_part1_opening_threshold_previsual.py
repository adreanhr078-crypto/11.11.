"""Build a source-controlled Blender previsual for the approved Part 1 opening.

This is an environment-and-camera proof only. Its figures are deliberately
featureless placeholders so this file cannot silently become the final Echo,
Yuki, Zero, or researcher asset. It has no readable in-world UI or dialogue.
"""

import argparse
import math
import os
import sys

import bpy


FPS = 24
END_FRAME = 288


def script_args():
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def parse_args():
    parser = argparse.ArgumentParser(
        description="Build the Part 1 opening-threshold Blender previsual"
    )
    parser.add_argument("--output", required=True)
    parser.add_argument("--preview-dir")
    return parser.parse_args(script_args())


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.materials, bpy.data.cameras, bpy.data.lights, bpy.data.curves):
        for block in list(collection):
            if block.users == 0:
                collection.remove(block)


def pbr_material(name, color, metallic=0.0, roughness=0.5, emission=None):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        emission_color, strength = emission
        emission_socket = bsdf.inputs.get("Emission Color") or bsdf.inputs.get("Emission")
        strength_socket = bsdf.inputs.get("Emission Strength")
        if emission_socket:
            emission_socket.default_value = emission_color
        if strength_socket:
            strength_socket.default_value = strength
    return material


def glass_material(name):
    material = pbr_material(name, (0.04, 0.035, 0.08, 1.0), metallic=0.15, roughness=0.12)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    transmission = bsdf.inputs.get("Transmission Weight") or bsdf.inputs.get("Transmission")
    if transmission:
        transmission.default_value = 0.35
    alpha = bsdf.inputs.get("Alpha")
    if alpha:
        alpha.default_value = 0.26
    material.surface_render_method = "DITHERED"
    return material


def add_cube(name, location, scale, material, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("SoftEdges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    obj.data.materials.append(material)
    return obj


def add_cylinder(name, location, radius, depth, material, vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def add_torus(name, location, radius, material, minor=0.07):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=radius,
        minor_radius=minor,
        major_segments=64,
        minor_segments=12,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    return obj


def add_area(name, location, rotation, color, power, size):
    data = bpy.data.lights.new(name, "AREA")
    data.color = color
    data.energy = power
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    return obj


def add_point(name, location, color, power, radius):
    data = bpy.data.lights.new(name, "POINT")
    data.color = color
    data.energy = power
    data.shadow_soft_size = radius
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    return obj


def point_camera_at(obj, target):
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_placeholder_figure(name, location, scale, material, pose="standing"):
    # A blocked silhouette for composition only. Never export this as a character.
    torso = add_cube(f"{name}_torso", (location[0], location[1], location[2] + 2.1 * scale),
                     (0.38 * scale, 0.22 * scale, 0.72 * scale), material, 0.10 * scale)
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=24,
        ring_count=12,
        radius=0.32 * scale,
        location=(location[0], location[1], location[2] + 3.15 * scale),
    )
    head = bpy.context.object
    head.name = f"{name}_head_placeholder"
    head.data.materials.append(material)

    for side in (-1, 1):
        arm = add_cube(
            f"{name}_arm_{side}",
            (location[0] + side * 0.55 * scale, location[1], location[2] + 2.15 * scale),
            (0.13 * scale, 0.15 * scale, 0.68 * scale), material, 0.08 * scale,
        )
        arm.rotation_euler[1] = side * 0.12
        for leg_side in (-1, 1):
            leg = add_cube(
                f"{name}_leg_{leg_side}",
                (location[0] + leg_side * 0.20 * scale, location[1], location[2] + 0.75 * scale),
                (0.17 * scale, 0.18 * scale, 0.75 * scale), material, 0.08 * scale,
            )
            leg.rotation_euler[1] = leg_side * 0.03
    if pose == "seated":
        torso.rotation_euler[0] = math.radians(12)
        for suffix in ("leg_-1", "leg_1"):
            bpy.data.objects[f"{name}_{suffix}"].rotation_euler[0] = math.radians(72)
    return torso


def add_cable(name, start, end, material):
    curve_data = bpy.data.curves.new(name, "CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = 0.035
    curve_data.bevel_resolution = 3
    spline = curve_data.splines.new("BEZIER")
    spline.bezier_points.add(2)
    midpoint = ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2, max(start[2], end[2]) + 0.6)
    for point, co in zip(spline.bezier_points, (start, midpoint, end)):
        point.co = co
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    curve_data.materials.append(material)
    return obj


def configure_scene():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = END_FRAME
    scene.render.fps = FPS
    # Blender 5.2 exposes the Eevee engine as BLENDER_EEVEE.
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.film_transparent = False
    scene.render.use_file_extension = True
    scene.world.color = (0.002, 0.003, 0.009)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.image_settings.color_mode = "RGB"
    scene.timeline_markers.new("LABORATORY_THRESHOLD", frame=1)
    scene.timeline_markers.new("CONTAINMENT_PULSE", frame=120)
    scene.timeline_markers.new("FRACTURE_HANDOFF", frame=216)
    scene.timeline_markers.new("MISSION_CONTROL_HANDOFF", frame=END_FRAME)


def create_environment():
    obsidian = pbr_material("ObsidianSteel", (0.008, 0.011, 0.025, 1.0), metallic=0.82, roughness=0.25)
    floor = pbr_material("WetObsidianFloor", (0.012, 0.013, 0.032, 1.0), metallic=0.66, roughness=0.12)
    matte = pbr_material("MatteFigurePlaceholder", (0.012, 0.010, 0.022, 1.0), metallic=0.15, roughness=0.72)
    violet = pbr_material("VioletSignal", (0.045, 0.004, 0.09, 1.0), metallic=0.10, roughness=0.35,
                          emission=((0.28, 0.01, 1.0, 1.0), 7.0))
    crimson = pbr_material("CrimsonWarning", (0.14, 0.003, 0.008, 1.0), metallic=0.10, roughness=0.35,
                           emission=((1.0, 0.005, 0.02, 1.0), 3.0))
    glass = glass_material("ContainmentGlass")

    add_cube("WetFloor", (0, 0, -0.12), (13.5, 13.5, 0.12), floor, 0.06)
    add_cube("BackWall", (0, 8.2, 4.8), (13.5, 0.28, 4.8), obsidian, 0.08)
    add_cube("LeftWall", (-13.2, 0, 4.8), (0.28, 8.5, 4.8), obsidian, 0.08)
    add_cube("RightWall", (13.2, 0, 4.8), (0.28, 8.5, 4.8), obsidian, 0.08)

    # Background panels are arranged as geometry, never readable screen text.
    for x in (-10.5, -7.5, 7.5, 10.5):
        for z in (1.4, 4.2, 7.0):
            panel = add_cube(f"WallPanel_{x}_{z}", (x, 7.84, z), (1.15, 0.08, 1.0), obsidian, 0.04)
            panel.rotation_euler[2] = math.radians(1.8 if x < 0 else -1.8)
            strip = add_cube(f"PanelStrip_{x}_{z}", (x, 7.70, z + 0.58), (0.76, 0.02, 0.025), violet)

    # Central containment volume, inspired by Part 1's laboratory threshold.
    add_cylinder("ContainmentGlass", (0, 1.2, 3.2), 2.35, 6.4, glass, 64)
    for z in (0.2, 6.2):
        add_torus(f"ContainmentRing_{z}", (0, 1.2, z), 2.42, obsidian, 0.16)
        add_torus(f"SignalRing_{z}", (0, 1.2, z + (0.18 if z < 1 else -0.18)), 2.20, violet, 0.035)
    for index in range(8):
        angle = (math.tau / 8) * index
        x = math.cos(angle) * 2.22
        y = 1.2 + math.sin(angle) * 2.22
        add_cube(f"ContainmentStrut_{index}", (x, y, 3.2), (0.045, 0.045, 3.0), obsidian, 0.02)

    add_placeholder_figure("SubjectPlaceholder", (0, 1.2, 0.15), 1.0, matte, "standing")
    add_placeholder_figure("ObserverPlaceholder", (5.8, -0.4, 0.15), 0.9, matte, "standing")
    add_cube("ObserverConsole", (5.35, 0.55, 1.0), (1.8, 0.72, 0.32), obsidian, 0.12)
    add_cube("ObserverConsoleSignal", (5.35, -0.10, 1.40), (1.42, 0.03, 0.14), violet, 0.02)

    for side in (-1, 1):
        for index, y in enumerate((-3.0, 1.2, 5.0)):
            x = side * 8.7
            add_cylinder(f"ArchivePod_{side}_{index}", (x, y, 2.75), 0.92, 5.25, glass, 40)
            add_torus(f"ArchivePodRing_{side}_{index}", (x, y, 0.28), 0.98, obsidian, 0.11)
            add_torus(f"ArchivePodSignal_{side}_{index}", (x, y, 0.42), 0.84, violet, 0.028)
            add_placeholder_figure(f"PodSilhouette_{side}_{index}", (x, y, 0.25), 0.48, matte, "standing")

    for index, start in enumerate(((-9.4, -4.2, 0.3), (-7.8, 5.0, 0.3), (9.4, -3.7, 0.3), (7.9, 5.1, 0.3))):
        add_cable(f"Cable_{index}", start, (0, 1.2, 0.35), obsidian)

    # Two color-separated light clues: violet phenomenon and scarce crimson danger.
    overhead = add_area("VioletOverhead", (0, 0.4, 9.0), (0.0, 0.0, 0.0), (0.43, 0.15, 1.0), 1200, 5.0)
    overhead.data.energy = 420
    overhead.data.keyframe_insert(data_path="energy", frame=1)
    overhead.data.energy = 1250
    overhead.data.keyframe_insert(data_path="energy", frame=120)
    overhead.data.energy = 540
    overhead.data.keyframe_insert(data_path="energy", frame=END_FRAME)
    add_area("ColdBacklight", (0, 7.3, 5.8), (math.radians(90), 0, math.pi), (0.12, 0.35, 1.0), 850, 7.0)
    add_point("SignalAccent", (-5.6, 2.0, 3.2), (1.0, 0.008, 0.02), 210, 1.2)
    add_point("GlassAccent", (3.0, -2.4, 2.1), (0.34, 0.03, 1.0), 360, 1.4)

    # A dim crimson emitter is visual only and contains no warning text.
    add_cube("CrimsonSignalAccent", (-5.6, 6.95, 3.1), (0.14, 0.04, 0.32), crimson, 0.04)


def create_camera_path():
    camera_data = bpy.data.cameras.new("OpeningThresholdCamera")
    camera_data.lens = 47
    camera = bpy.data.objects.new("OpeningThresholdCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    target = bpy.data.objects.new("CameraFocus", None)
    bpy.context.collection.objects.link(target)
    constraint = camera.constraints.new(type="TRACK_TO")
    constraint.target = target
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"

    keyframes = (
        (1, (10.5, -14.5, 6.0), (0.0, 1.0, 3.0)),
        (120, (8.4, -10.4, 5.0), (0.0, 1.15, 3.1)),
        (216, (5.7, -7.6, 4.0), (0.0, 1.2, 3.25)),
        (END_FRAME, (3.8, -6.4, 3.5), (0.0, 1.2, 3.3)),
    )
    for frame, location, focus in keyframes:
        camera.location = location
        camera.keyframe_insert(data_path="location", frame=frame)
        target.location = focus
        target.keyframe_insert(data_path="location", frame=frame)
    # The default keyframe interpolation is Bezier. Avoid reaching into the
    # version-specific Action channel API just to restate that default.
    return camera


def render_previews(preview_dir):
    if not preview_dir:
        return
    output_dir = os.path.abspath(preview_dir)
    os.makedirs(output_dir, exist_ok=True)
    scene = bpy.context.scene
    for label, frame in (("arrival", 48), ("pulse", 144), ("handoff", 240)):
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(output_dir, f"part1-opening-threshold-{label}-v1.png")
        bpy.ops.render.render(write_still=True)
        print(f"PREVIEW_FRAME_OK={scene.render.filepath}")


def main():
    args = parse_args()
    reset_scene()
    configure_scene()
    create_environment()
    create_camera_path()
    output = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=output)
    print(f"PART1_OPENING_BLEND_OK={output}")
    render_previews(args.preview_dir)


if __name__ == "__main__":
    main()
