"""Build deterministic rigged production blockouts for Echo and Yuki.

This is a modular rig and silhouette foundation, not the final hero mesh.
Run with Blender 5.2 LTS in background mode.
"""

import argparse
import math
import os
import sys

import bpy
from mathutils import Vector


REQUIRED_BONES = (
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
)


def script_args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def parse_args():
    parser = argparse.ArgumentParser(description="Build Echo and Yuki rig foundation")
    parser.add_argument("--output", required=True)
    parser.add_argument("--preview-dir")
    return parser.parse_args(script_args())


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.armatures,
        bpy.data.actions,
        bpy.data.cameras,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.meshes,
    ):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def move_to_collection(obj, collection):
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)


def principled_material(name, color, metallic=0.0, roughness=0.45, emission=None, emission_strength=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return material


def apply_rotation_scale(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.select_set(False)


def add_bevel(obj, width=0.015, segments=2):
    modifier = obj.modifiers.new("SurfaceBevel", "BEVEL")
    modifier.width = width
    modifier.segments = segments


def bind_rigid(obj, armature, bone_name):
    group = obj.vertex_groups.new(name=bone_name)
    group.add(range(len(obj.data.vertices)), 1.0, "REPLACE")
    modifier = obj.modifiers.new("CharacterRig", "ARMATURE")
    modifier.object = armature


def add_uv_part(name, collection, armature, bone_name, location, scale, material, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    apply_rotation_scale(obj)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    bind_rigid(obj, armature, bone_name)
    move_to_collection(obj, collection)
    return obj


def add_box_part(name, collection, armature, bone_name, location, scale, material, bevel=0.015):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    apply_rotation_scale(obj)
    obj.data.materials.append(material)
    add_bevel(obj, bevel)
    bind_rigid(obj, armature, bone_name)
    move_to_collection(obj, collection)
    return obj


def add_segment(name, collection, armature, bone_name, start, end, radius, material, vertices=20):
    start_v = Vector(start)
    end_v = Vector(end)
    delta = end_v - start_v
    midpoint = (start_v + end_v) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=delta.length, location=midpoint)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0.0, 0.0, 1.0)).rotation_difference(delta.normalized())
    obj.rotation_mode = "XYZ"
    apply_rotation_scale(obj)
    obj.data.materials.append(material)
    add_bevel(obj, radius * 0.28, 3)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    bind_rigid(obj, armature, bone_name)
    move_to_collection(obj, collection)
    return obj


def add_tuft(name, collection, armature, base, tip, radius, material):
    base_v = Vector(base)
    tip_v = Vector(tip)
    delta = tip_v - base_v
    midpoint = (base_v + tip_v) * 0.5
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=radius, radius2=0.006, depth=delta.length, location=midpoint)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0.0, 0.0, 1.0)).rotation_difference(delta.normalized())
    obj.rotation_mode = "XYZ"
    apply_rotation_scale(obj)
    obj.data.materials.append(material)
    add_bevel(obj, 0.006, 2)
    bind_rigid(obj, armature, "head")
    move_to_collection(obj, collection)
    return obj


def create_armature(name, collection):
    data = bpy.data.armatures.new(f"{name}_DATA")
    armature = bpy.data.objects.new(name, data)
    collection.objects.link(armature)
    armature.show_in_front = True

    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    definitions = {
        "root": ((0.0, 0.0, 0.0), (0.0, 0.0, 0.15), None, False),
        "hips": ((0.0, 0.0, 0.88), (0.0, 0.0, 1.04), "root", False),
        "spine_01": ((0.0, 0.0, 1.04), (0.0, 0.0, 1.25), "hips", True),
        "spine_02": ((0.0, 0.0, 1.25), (0.0, 0.0, 1.47), "spine_01", True),
        "neck": ((0.0, 0.0, 1.47), (0.0, 0.0, 1.57), "spine_02", True),
        "head": ((0.0, 0.0, 1.57), (0.0, 0.0, 1.80), "neck", True),
        "upper_arm.L": ((0.03, 0.0, 1.43), (0.36, 0.0, 1.34), "spine_02", False),
        "lower_arm.L": ((0.36, 0.0, 1.34), (0.65, 0.0, 1.26), "upper_arm.L", True),
        "hand.L": ((0.65, 0.0, 1.26), (0.77, 0.0, 1.23), "lower_arm.L", True),
        "upper_arm.R": ((-0.03, 0.0, 1.43), (-0.36, 0.0, 1.34), "spine_02", False),
        "lower_arm.R": ((-0.36, 0.0, 1.34), (-0.65, 0.0, 1.26), "upper_arm.R", True),
        "hand.R": ((-0.65, 0.0, 1.26), (-0.77, 0.0, 1.23), "lower_arm.R", True),
        "thigh.L": ((0.105, 0.0, 0.96), (0.12, 0.0, 0.55), "hips", False),
        "shin.L": ((0.12, 0.0, 0.55), (0.12, 0.0, 0.14), "thigh.L", True),
        "foot.L": ((0.12, 0.0, 0.14), (0.12, -0.17, 0.07), "shin.L", True),
        "toe.L": ((0.12, -0.17, 0.07), (0.12, -0.29, 0.07), "foot.L", True),
        "thigh.R": ((-0.105, 0.0, 0.96), (-0.12, 0.0, 0.55), "hips", False),
        "shin.R": ((-0.12, 0.0, 0.55), (-0.12, 0.0, 0.14), "thigh.R", True),
        "foot.R": ((-0.12, 0.0, 0.14), (-0.12, -0.17, 0.07), "shin.R", True),
        "toe.R": ((-0.12, -0.17, 0.07), (-0.12, -0.29, 0.07), "foot.R", True),
    }
    for bone_name, (head, tail, parent_name, connected) in definitions.items():
        bone = data.edit_bones.new(bone_name)
        bone.head = head
        bone.tail = tail
        if parent_name:
            bone.parent = data.edit_bones[parent_name]
            bone.use_connect = connected
        bone.use_deform = bone_name != "root"

    bpy.ops.object.mode_set(mode="OBJECT")
    armature.select_set(False)
    return armature


def create_tattoo(name, text, collection, armature, location, color_material):
    curve = bpy.data.curves.new(f"{name}_CURVE", "FONT")
    curve.body = text
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = 0.029
    curve.extrude = 0.0012
    curve.bevel_depth = 0.0006
    tattoo = bpy.data.objects.new(name, curve)
    collection.objects.link(tattoo)
    tattoo.location = location
    tattoo.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    tattoo.data.materials.append(color_material)
    bpy.context.view_layer.objects.active = tattoo
    tattoo.select_set(True)
    bpy.ops.object.convert(target="MESH")
    tattoo.select_set(False)
    world = tattoo.matrix_world.copy()
    tattoo.parent = armature
    tattoo.parent_type = "BONE"
    tattoo.parent_bone = "neck"
    tattoo.matrix_world = world
    return tattoo


def create_actions(armature, prefix):
    def reset_pose():
        for pose_bone in armature.pose.bones:
            pose_bone.rotation_mode = "XYZ"
            pose_bone.rotation_euler = (0.0, 0.0, 0.0)
            pose_bone.location = (0.0, 0.0, 0.0)

    def action(name, frames):
        reset_pose()
        animation = bpy.data.actions.new(f"{prefix}_{name}")
        animation.use_fake_user = True
        armature.animation_data_create()
        armature.animation_data.action = animation
        for frame, edits in frames:
            for bone_name, channel, value in edits:
                bone = armature.pose.bones[bone_name]
                setattr(bone, channel, value)
                bone.keyframe_insert(data_path=channel, frame=frame, group=bone_name)
        return animation

    action(
        "IDLE",
        (
            (1, (("spine_02", "rotation_euler", (0.0, 0.0, 0.0)), ("hips", "location", (0.0, 0.0, 0.0)))),
            (36, (("spine_02", "rotation_euler", (math.radians(1.6), 0.0, 0.0)), ("hips", "location", (0.0, 0.0, 0.008)))),
            (72, (("spine_02", "rotation_euler", (0.0, 0.0, 0.0)), ("hips", "location", (0.0, 0.0, 0.0)))),
        ),
    )
    action(
        "LOOK",
        (
            (1, (("head", "rotation_euler", (0.0, 0.0, 0.0)),)),
            (24, (("head", "rotation_euler", (math.radians(-4.0), math.radians(8.0), math.radians(-5.0))),)),
            (48, (("head", "rotation_euler", (0.0, 0.0, 0.0)),)),
        ),
    )
    action(
        "POINT_HELP",
        (
            (1, (("upper_arm.L", "rotation_euler", (0.0, 0.0, 0.0)), ("lower_arm.L", "rotation_euler", (0.0, 0.0, 0.0)))),
            (36, (("upper_arm.L", "rotation_euler", (math.radians(-18.0), math.radians(-8.0), math.radians(28.0))), ("lower_arm.L", "rotation_euler", (0.0, math.radians(-12.0), math.radians(-38.0))), ("head", "rotation_euler", (0.0, math.radians(5.0), 0.0)))),
            (72, (("upper_arm.L", "rotation_euler", (0.0, 0.0, 0.0)), ("lower_arm.L", "rotation_euler", (0.0, 0.0, 0.0)), ("head", "rotation_euler", (0.0, 0.0, 0.0)))),
        ),
    )
    action(
        "CELEBRATE",
        (
            (1, (("upper_arm.L", "rotation_euler", (0.0, 0.0, 0.0)), ("upper_arm.R", "rotation_euler", (0.0, 0.0, 0.0)))),
            (30, (("upper_arm.L", "rotation_euler", (math.radians(-8.0), 0.0, math.radians(48.0))), ("upper_arm.R", "rotation_euler", (math.radians(-8.0), 0.0, math.radians(-48.0))), ("spine_02", "rotation_euler", (math.radians(-5.0), 0.0, 0.0)))),
            (54, (("upper_arm.L", "rotation_euler", (math.radians(-2.0), 0.0, math.radians(32.0))), ("upper_arm.R", "rotation_euler", (math.radians(-2.0), 0.0, math.radians(-32.0))), ("spine_02", "rotation_euler", (0.0, 0.0, 0.0)))),
            (72, (("upper_arm.L", "rotation_euler", (0.0, 0.0, 0.0)), ("upper_arm.R", "rotation_euler", (0.0, 0.0, 0.0)))),
        ),
    )
    armature.animation_data.action = None
    reset_pose()


def add_hair(collection, armature, prefix, center, material, short=False):
    shell_scale = (0.176, 0.154, 0.18 if short else 0.19)
    add_uv_part(f"{prefix}_HairShell", collection, armature, "head", center, shell_scale, material)
    count = 18 if short else 22
    for index in range(count):
        angle = (math.tau * index / count) + (0.16 if index % 2 else 0.0)
        radial = 0.115 + 0.02 * (index % 3)
        base = (
            center[0] + math.cos(angle) * radial,
            center[1] + math.sin(angle) * radial * 0.78,
            center[2] + 0.04 + 0.03 * math.sin(angle * 2.0),
        )
        length = 0.15 + 0.035 * (index % 4)
        tip = (
            base[0] + math.cos(angle) * length * 0.55,
            base[1] + math.sin(angle) * length * 0.42,
            base[2] - length * (0.35 if math.sin(angle) < 0.3 else 0.1),
        )
        add_tuft(f"{prefix}_HairTuft_{index:02d}", collection, armature, base, tip, 0.045, material)


def create_character(config):
    collection = bpy.data.collections.new(config["collection"])
    bpy.context.scene.collection.children.link(collection)
    root = bpy.data.objects.new(config["root"], None)
    collection.objects.link(root)
    armature = create_armature(config["rig"], collection)
    armature.parent = root

    mats = {
        "skin": principled_material(f'{config["prefix"]}_Skin', config["skin"], roughness=0.5),
        "hair": principled_material(f'{config["prefix"]}_Hair', config["hair"], metallic=0.08, roughness=0.3),
        "under": principled_material(f'{config["prefix"]}_UnderSuit', config["under"], metallic=0.18, roughness=0.36),
        "outer": principled_material(f'{config["prefix"]}_Outerwear', config["outer"], metallic=0.1, roughness=0.42),
        "boot": principled_material(f'{config["prefix"]}_Boots', config["boot"], metallic=0.4, roughness=0.24),
        "accent": principled_material(f'{config["prefix"]}_Accent', config["accent"], metallic=0.2, roughness=0.2, emission=config["accent"], emission_strength=2.2),
        "eye_a": principled_material(f'{config["prefix"]}_EyeA', config["eye_a"], roughness=0.16, emission=config["eye_a"], emission_strength=1.4),
        "eye_b": principled_material(f'{config["prefix"]}_EyeB', config["eye_b"], roughness=0.16, emission=config["eye_b"], emission_strength=1.4),
    }

    parts = []
    parts.append(add_uv_part(f'{config["prefix"]}_Head', collection, armature, "head", (0.0, -0.005, 1.69), (0.158, 0.145, 0.205), mats["skin"], 32, 24))
    parts.append(add_segment(f'{config["prefix"]}_Neck', collection, armature, "neck", (0.0, 0.0, 1.46), (0.0, 0.0, 1.59), 0.058, mats["skin"], 24))
    parts.append(add_uv_part(f'{config["prefix"]}_Torso', collection, armature, "spine_02", (0.0, 0.0, 1.27), (0.235, 0.13, 0.245), mats["under"]))
    parts.append(add_uv_part(f'{config["prefix"]}_Pelvis', collection, armature, "hips", (0.0, 0.0, 0.99), (0.19, 0.12, 0.16), mats["under"]))

    for side, sign in (("L", 1.0), ("R", -1.0)):
        parts.append(add_segment(f'{config["prefix"]}_UpperArm_{side}', collection, armature, f"upper_arm.{side}", (0.12 * sign, 0.0, 1.41), (0.36 * sign, 0.0, 1.34), 0.066, mats["outer"]))
        parts.append(add_segment(f'{config["prefix"]}_LowerArm_{side}', collection, armature, f"lower_arm.{side}", (0.36 * sign, 0.0, 1.34), (0.65 * sign, 0.0, 1.26), 0.055, mats["under"]))
        parts.append(add_uv_part(f'{config["prefix"]}_Hand_{side}', collection, armature, f"hand.{side}", (0.705 * sign, -0.006, 1.245), (0.075, 0.035, 0.06), mats["skin"]))
        parts.append(add_segment(f'{config["prefix"]}_Thigh_{side}', collection, armature, f"thigh.{side}", (0.105 * sign, 0.0, 0.93), (0.12 * sign, 0.0, 0.55), 0.085, mats["under"]))
        parts.append(add_segment(f'{config["prefix"]}_Shin_{side}', collection, armature, f"shin.{side}", (0.12 * sign, 0.0, 0.54), (0.12 * sign, 0.0, 0.16), 0.071, mats["under"]))
        parts.append(add_box_part(f'{config["prefix"]}_Boot_{side}', collection, armature, f"foot.{side}", (0.12 * sign, -0.065, 0.10), (0.085, 0.145, 0.08), mats["boot"], 0.025))

    add_hair(collection, armature, config["prefix"], (0.0, 0.005, 1.76), mats["hair"], short=config["short_hair"])
    add_uv_part(f'{config["prefix"]}_Eye_Left', collection, armature, "head", (-0.055, -0.139, 1.70), (0.034, 0.010, 0.020), mats["eye_a"], 20, 12)
    add_uv_part(f'{config["prefix"]}_Eye_Right', collection, armature, "head", (0.055, -0.139, 1.70), (0.034, 0.010, 0.020), mats["eye_b"], 20, 12)

    if config["hero"]:
        add_uv_part(f'{config["prefix"]}_CoatCore', collection, armature, "spine_02", (0.0, 0.006, 1.27), (0.255, 0.145, 0.255), mats["outer"])
        for side, sign in (("L", 1.0), ("R", -1.0)):
            add_box_part(f'{config["prefix"]}_CoatFront_{side}', collection, armature, "hips", (0.105 * sign, -0.115, 0.64), (0.09, 0.028, 0.37), mats["outer"], 0.018)
            add_box_part(f'{config["prefix"]}_CoatBack_{side}', collection, armature, "hips", (0.105 * sign, 0.105, 0.64), (0.09, 0.025, 0.37), mats["outer"], 0.018)
            add_segment(f'{config["prefix"]}_CrimsonChannel_{side}', collection, armature, "hips", (0.14 * sign, -0.146, 0.94), (0.14 * sign, -0.146, 0.34), 0.008, mats["accent"], 10)
    else:
        add_uv_part(f'{config["prefix"]}_JacketCore', collection, armature, "spine_02", (0.0, 0.008, 1.28), (0.258, 0.147, 0.245), mats["outer"])
        add_box_part(f'{config["prefix"]}_JacketHem', collection, armature, "hips", (0.0, 0.0, 1.02), (0.205, 0.135, 0.11), mats["outer"], 0.025)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.13, minor_radius=0.035, major_segments=24, minor_segments=10, location=(0.0, 0.055, 1.48), rotation=(math.radians(75.0), 0.0, 0.0))
        hood = bpy.context.object
        hood.name = f'{config["prefix"]}_Hood'
        hood.data.materials.append(mats["outer"])
        bind_rigid(hood, armature, "spine_02")
        move_to_collection(hood, collection)

    create_tattoo(
        f'{config["prefix"]}_SkinTattoo_{config["identifier"].replace("-", "")}',
        config["identifier"],
        collection,
        armature,
        config["tattoo_location"],
        mats["accent"],
    )
    create_actions(armature, config["identifier"].replace("-", ""))

    for obj in collection.objects:
        if obj not in (root, armature) and obj.parent is None:
            world = obj.matrix_world.copy()
            obj.parent = root
            obj.matrix_world = world

    root["character_id"] = config["identifier"]
    root["role"] = "main-transforming-protagonist" if config["hero"] else "supporting-character"
    root["asset_status"] = "rigged-production-blockout"
    armature["required_bones"] = ",".join(REQUIRED_BONES)
    return collection, root, armature


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def configure_proof_stage():
    stage = bpy.data.collections.new("PROOF_STAGE")
    bpy.context.scene.collection.children.link(stage)
    floor_mat = principled_material("ProofFloor", (0.008, 0.009, 0.013, 1.0), metallic=0.45, roughness=0.28)
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0.0, 0.0, 0.0))
    floor = bpy.context.object
    floor.name = "ProofFloor"
    floor.data.materials.append(floor_mat)
    move_to_collection(floor, stage)

    camera_data = bpy.data.cameras.new("ProofCamera")
    camera = bpy.data.objects.new("ProofCamera", camera_data)
    stage.objects.link(camera)
    camera.location = (0.0, -5.6, 1.15)
    camera_data.lens = 72
    look_at(camera, (0.0, 0.0, 0.95))
    bpy.context.scene.camera = camera

    for name, location, energy, color, size in (
        ("Key", (-2.8, -3.4, 4.3), 1150.0, (1.0, 0.82, 0.76), 3.0),
        ("Fill", (3.0, -2.4, 2.6), 850.0, (0.34, 0.72, 1.0), 2.5),
        ("Rim", (0.0, 2.0, 3.6), 1250.0, (1.0, 0.04, 0.08), 2.2),
    ):
        light_data = bpy.data.lights.new(name, "AREA")
        light_data.energy = energy
        light_data.color = color
        light_data.shape = "DISK"
        light_data.size = size
        light = bpy.data.objects.new(name, light_data)
        light.location = location
        look_at(light, (0.0, 0.0, 1.0))
        stage.objects.link(light)
    return stage


def configure_scene():
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 72
    scene.render.fps = 24
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.002, 0.003, 0.006, 1.0)
    background.inputs["Strength"].default_value = 0.18


def render_proofs(preview_dir, echo_collection, echo_root, yuki_collection, yuki_root):
    if not preview_dir:
        return
    os.makedirs(preview_dir, exist_ok=True)
    scene = bpy.context.scene

    def render(name):
        scene.render.filepath = os.path.join(preview_dir, name)
        bpy.ops.render.render(write_still=True)
        print(f"CHARACTER_PROOF_OK={scene.render.filepath}")

    yuki_collection.hide_render = True
    echo_root.location = (0.0, 0.0, 0.0)
    echo_root.rotation_euler = (0.0, 0.0, 0.0)
    render("echo-ex011-front-v1.png")
    echo_root.rotation_euler.z = math.radians(90.0)
    render("echo-ex011-side-v1.png")

    echo_collection.hide_render = True
    yuki_collection.hide_render = False
    echo_root.rotation_euler.z = 0.0
    render("yuki-ex012-front-v1.png")

    echo_collection.hide_render = False
    echo_root.location.x = -0.48
    yuki_root.location.x = 0.48
    render("echo-yuki-duo-v1.png")

    echo_root.location = (0.0, 0.0, 0.0)
    yuki_root.location = (0.0, 0.0, 0.0)
    echo_root.rotation_euler = (0.0, 0.0, 0.0)
    yuki_root.rotation_euler = (0.0, 0.0, 0.0)
    echo_collection.hide_render = False
    yuki_collection.hide_render = False


def main():
    args = parse_args()
    output = os.path.abspath(args.output)
    preview_dir = os.path.abspath(args.preview_dir) if args.preview_dir else None
    reset_scene()
    configure_scene()

    echo = {
        "collection": "CHAR_ECHO_EX011",
        "root": "Echo_EX011_ROOT",
        "rig": "Echo_EX011_RIG",
        "prefix": "Echo_EX011",
        "identifier": "EX-011",
        "hero": True,
        "short_hair": False,
        "skin": (0.56, 0.34, 0.29, 1.0),
        "hair": (0.006, 0.008, 0.014, 1.0),
        "under": (0.012, 0.016, 0.024, 1.0),
        "outer": (0.018, 0.022, 0.032, 1.0),
        "boot": (0.01, 0.012, 0.018, 1.0),
        "accent": (0.95, 0.008, 0.025, 1.0),
        "eye_a": (1.0, 0.006, 0.018, 1.0),
        "eye_b": (0.0, 0.65, 0.9, 1.0),
        "tattoo_location": (-0.035, -0.061, 1.525),
    }
    yuki = {
        "collection": "CHAR_YUKI_EX012",
        "root": "Yuki_EX012_ROOT",
        "rig": "Yuki_EX012_RIG",
        "prefix": "Yuki_EX012",
        "identifier": "EX-012",
        "hero": False,
        "short_hair": True,
        "skin": (0.66, 0.45, 0.40, 1.0),
        "hair": (0.82, 0.84, 0.88, 1.0),
        "under": (0.028, 0.03, 0.045, 1.0),
        "outer": (0.62, 0.65, 0.70, 1.0),
        "boot": (0.08, 0.09, 0.12, 1.0),
        "accent": (0.34, 0.14, 0.88, 1.0),
        "eye_a": (0.42, 0.18, 0.82, 1.0),
        "eye_b": (0.42, 0.18, 0.82, 1.0),
        "tattoo_location": (0.035, -0.061, 1.525),
    }

    echo_collection, echo_root, echo_rig = create_character(echo)
    yuki_collection, yuki_root, yuki_rig = create_character(yuki)
    configure_proof_stage()

    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=output)
    render_proofs(preview_dir, echo_collection, echo_root, yuki_collection, yuki_root)
    bpy.ops.wm.save_as_mainfile(filepath=output)

    for rig in (echo_rig, yuki_rig):
        missing = sorted(set(REQUIRED_BONES) - set(rig.data.bones.keys()))
        if missing:
            raise RuntimeError(f"Missing bones in {rig.name}: {missing}")
    print(f"CHARACTER_RIG_FOUNDATION_OK={output}")
    print("CHARACTER_IDENTITY_OK=ECHO_BLACK_HAIRED_MAIN_TRANSFORMING_PROTAGONIST")
    print("CHARACTER_IDENTITY_OK=YUKI_WHITE_HAIRED_SUPPORTING_CHARACTER")


if __name__ == "__main__":
    main()
