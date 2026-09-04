"""Build the Part 1 anime opening animatic as a packed Blender source.

This file is a review prototype, not a runtime cinematic and not a Canon state
transition. It uses approved/user-supplied anime plates, keeps all readable UI
outside the render, and contains no audio, dialogue, text objects, characters,
environment geometry, puzzle authority, rewards, or progression state.

The visible image is always a full-frame anime plate. The only mesh objects are
flat internal carriers for packed images; no blocked geometry or engineering
silhouettes can appear in the render.
"""

from __future__ import annotations

import argparse
import math
import os
import sys
from dataclasses import dataclass

import bpy


FPS = 24
WIDTH = 1920
HEIGHT = 1080
END_FRAME = 960
PLANE_WIDTH = 19.2
PLANE_HEIGHT = 10.8


@dataclass(frozen=True)
class Shot:
    slug: str
    filename: str
    start: int
    end: int
    fade_in: int
    fade_out: int
    camera_start: tuple[float, float, float]
    camera_end: tuple[float, float, float]
    pulse_frames: tuple[tuple[int, float], ...] = ()
    jitter_frames: tuple[tuple[int, float, float, float], ...] = ()
    saturation_keys: tuple[tuple[int, float], ...] = ()
    value_keys: tuple[tuple[int, float], ...] = ()


SHOTS = (
    Shot(
        slug="warm_school_breath",
        filename="shot-00-warm-school-breath-v1.webp",
        start=1,
        end=144,
        fade_in=24,
        fade_out=0,
        camera_start=(-0.24, 0.02, 19.60),
        camera_end=(0.18, 0.08, 18.20),
        saturation_keys=((1, 1.06), (104, 1.02), (126, 0.42), (144, 0.30)),
        value_keys=((1, 0.98), (104, 0.98), (126, 0.78), (144, 0.68)),
    ),
    Shot(
        slug="watch_threshold",
        filename="shot-01-watch-threshold-v1.webp",
        start=145,
        end=216,
        fade_in=0,
        fade_out=0,
        camera_start=(-0.10, 0.03, 19.40),
        camera_end=(0.14, -0.04, 17.80),
    ),
    Shot(
        slug="containment_observer",
        filename="shot-02-containment-observer-v1.webp",
        start=217,
        end=432,
        fade_in=0,
        fade_out=0,
        camera_start=(-0.24, -0.02, 19.30),
        camera_end=(0.23, 0.10, 17.40),
        pulse_frames=((288, 18.90), (360, 18.20), (420, 17.50)),
    ),
    Shot(
        slug="neural_droplet_insert",
        filename="shot-03-neural-droplet-insert-v1.webp",
        start=433,
        end=528,
        fade_in=0,
        fade_out=0,
        camera_start=(-0.08, 0.02, 19.40),
        camera_end=(0.14, -0.06, 17.60),
    ),
    Shot(
        slug="witness_through_glass",
        filename="shot-04-witness-through-glass-v1.webp",
        start=529,
        end=600,
        fade_in=0,
        fade_out=0,
        camera_start=(0.10, 0.02, 19.40),
        camera_end=(-0.10, -0.04, 18.20),
    ),
    Shot(
        slug="reflection_fracture",
        filename="shot-05-reflection-fracture-v1.webp",
        start=601,
        end=768,
        fade_in=0,
        fade_out=0,
        camera_start=(0.14, 0.02, 19.40),
        camera_end=(-0.16, 0.08, 17.60),
        jitter_frames=(
            (625, 0.030, -0.012, 19.00),
            (629, -0.018, 0.008, 18.95),
            (684, -0.024, 0.014, 18.20),
            (688, 0.012, -0.006, 18.15),
            (741, 0.026, 0.010, 17.75),
            (746, 0.000, 0.000, 17.70),
        ),
    ),
    Shot(
        slug="signal_closeup",
        filename="shot-06-signal-closeup-v1.webp",
        start=769,
        end=960,
        fade_in=0,
        fade_out=26,
        camera_start=(0.04, -0.02, 19.40),
        camera_end=(-0.03, 0.12, 17.20),
        pulse_frames=((817, 18.90), (865, 18.60), (913, 17.50)),
    ),
)


def script_args() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the Part 1 anime opening animatic")
    parser.add_argument("--reference-dir", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--preview-dir")
    return parser.parse_args(script_args())


def reset_file() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def configure_scene() -> bpy.types.Scene:
    scene = bpy.context.scene
    scene.name = "Part1OpeningAnimeAnimatic"
    scene.frame_start = 1
    scene.frame_end = END_FRAME
    scene.render.fps = FPS
    scene.render.fps_base = 1.0
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = WIDTH
    scene.render.resolution_y = HEIGHT
    scene.render.resolution_percentage = 100
    scene.render.pixel_aspect_x = 1.0
    scene.render.pixel_aspect_y = 1.0
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 72
    scene.render.film_transparent = False
    scene.render.use_file_extension = True
    if scene.world is None:
        scene.world = bpy.data.worlds.new("AnimaticBlackWorld")
    scene.world.color = (0.0, 0.0, 0.0)
    scene.view_settings.look = "AgX - Medium High Contrast"

    scene["asset_status"] = "review-animatic-not-runtime-registered"
    scene["canon_reference"] = "owner-approved-part-1-manhwa"
    scene["visual_treatment"] = "packed-anime-plates-no-visible-blockout-geometry"
    scene["contains_readable_ui"] = False
    scene["contains_audio"] = False
    scene["duration_seconds"] = END_FRAME / FPS
    scene["delivery_fps"] = FPS

    marker_names = (
        ("WARM_MEMORY", 1),
        ("SIGNAL_INTERRUPT", 145),
        ("CONTAINMENT", 217),
        ("NEURAL_DROPLET_INSERT", 433),
        ("WITNESS_THROUGH_GLASS", 529),
        ("IDENTITY_FRACTURE", 601),
        ("SIGNAL_REACHES_VIEWER", 769),
        ("MISSION_CONTROL_HANDOFF", END_FRAME),
    )
    for name, frame in marker_names:
        scene.timeline_markers.new(name, frame=frame)
    return scene


def make_camera(scene: bpy.types.Scene) -> bpy.types.Object:
    data = bpy.data.cameras.new("AnimeAnimaticCamera")
    data.type = "ORTHO"
    data.ortho_scale = SHOTS[0].camera_start[2]
    camera = bpy.data.objects.new("AnimeAnimaticCamera", data)
    bpy.context.collection.objects.link(camera)
    camera.location = (SHOTS[0].camera_start[0], SHOTS[0].camera_start[1], 10.0)
    camera.rotation_euler = (0.0, 0.0, 0.0)
    scene.camera = camera

    for shot in SHOTS:
        x0, y0, ortho0 = shot.camera_start
        x1, y1, ortho1 = shot.camera_end
        camera.location = (x0, y0, 10.0)
        camera.keyframe_insert(data_path="location", frame=shot.start)
        data.ortho_scale = ortho0
        data.keyframe_insert(data_path="ortho_scale", frame=shot.start)

        for frame, pulse_ortho in shot.pulse_frames:
            progress = (frame - shot.start) / max(1, shot.end - shot.start)
            camera.location = (
                x0 + ((x1 - x0) * progress),
                y0 + ((y1 - y0) * progress),
                10.0,
            )
            camera.keyframe_insert(data_path="location", frame=frame)
            data.ortho_scale = pulse_ortho
            data.keyframe_insert(data_path="ortho_scale", frame=frame)

        for frame, offset_x, offset_y, jitter_ortho in shot.jitter_frames:
            progress = (frame - shot.start) / max(1, shot.end - shot.start)
            camera.location = (
                x0 + ((x1 - x0) * progress) + offset_x,
                y0 + ((y1 - y0) * progress) + offset_y,
                10.0,
            )
            camera.keyframe_insert(data_path="location", frame=frame)
            data.ortho_scale = jitter_ortho
            data.keyframe_insert(data_path="ortho_scale", frame=frame)

        camera.location = (x1, y1, 10.0)
        camera.keyframe_insert(data_path="location", frame=shot.end)
        data.ortho_scale = ortho1
        data.keyframe_insert(data_path="ortho_scale", frame=shot.end)
    return camera


def load_and_pack_image(filepath: str) -> bpy.types.Image:
    image = bpy.data.images.load(filepath, check_existing=True)
    if tuple(image.size) != (WIDTH, HEIGHT):
        raise RuntimeError(
            f"Expected {WIDTH}x{HEIGHT} plate, got {tuple(image.size)}: {filepath}"
        )
    image.colorspace_settings.name = "sRGB"
    image.alpha_mode = "STRAIGHT"
    image.pack()
    return image


def create_plate_material(
    shot: Shot, image: bpy.types.Image
) -> tuple[bpy.types.Material, bpy.types.NodeSocket, bpy.types.NodeSocket, bpy.types.NodeSocket]:
    material = bpy.data.materials.new(f"MAT_{shot.slug}")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()

    texture = nodes.new("ShaderNodeTexImage")
    texture.name = f"PACKED_{shot.slug}"
    texture.image = image
    texture.interpolation = "Linear"
    texture.extension = "CLIP"

    grade = nodes.new("ShaderNodeHueSaturation")
    grade.name = f"GRADE_{shot.slug}"
    grade.inputs["Hue"].default_value = 0.5
    grade.inputs["Saturation"].default_value = 1.04 if shot.slug != "warm_school_breath" else 1.06
    grade.inputs["Value"].default_value = 0.98
    grade.inputs["Fac"].default_value = 1.0

    emission = nodes.new("ShaderNodeEmission")
    emission.name = f"FADE_{shot.slug}"
    emission.inputs["Strength"].default_value = 0.0

    output = nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(texture.outputs["Color"], grade.inputs["Color"])
    material.node_tree.links.new(grade.outputs["Color"], emission.inputs["Color"])
    material.node_tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return (
        material,
        emission.inputs["Strength"],
        grade.inputs["Saturation"],
        grade.inputs["Value"],
    )


def keyframe_visibility(obj: bpy.types.Object, start: int, end: int) -> None:
    if start > 1:
        obj.hide_render = True
        obj.keyframe_insert(data_path="hide_render", frame=start - 1)
    obj.hide_render = False
    obj.keyframe_insert(data_path="hide_render", frame=start)
    obj.hide_render = False
    obj.keyframe_insert(data_path="hide_render", frame=end)
    if end < END_FRAME:
        obj.hide_render = True
        obj.keyframe_insert(data_path="hide_render", frame=end + 1)


def keyframe_fade(strength: bpy.types.NodeSocket, shot: Shot) -> None:
    # Most editorial transitions are deliberate match/hard cuts. Repeated
    # dips to black make an animatic feel like a slideshow, so only a shot
    # with an explicit non-zero fade receives a luminance ramp.
    keys: list[tuple[int, float]] = []
    if shot.fade_in > 0:
        keys.extend(((shot.start, 0.0), (shot.start + shot.fade_in, 1.0)))
    else:
        keys.append((shot.start, 1.0))

    sustain_start = min(shot.end, shot.start + max(shot.fade_in, 0) + 1)
    sustain_end = max(sustain_start, shot.end - max(shot.fade_out, 0) - 1)
    keys.extend(((sustain_start, 1.0), (sustain_end, 1.0)))

    if shot.fade_out > 0:
        keys.extend(((shot.end - shot.fade_out, 1.0), (shot.end, 0.0)))
    else:
        keys.append((shot.end, 1.0))

    for frame, value in keys:
        strength.default_value = value
        strength.keyframe_insert(data_path="default_value", frame=frame)


def keyframe_grade(
    saturation: bpy.types.NodeSocket, value: bpy.types.NodeSocket, shot: Shot
) -> None:
    for frame, amount in shot.saturation_keys:
        saturation.default_value = amount
        saturation.keyframe_insert(data_path="default_value", frame=frame)
    for frame, amount in shot.value_keys:
        value.default_value = amount
        value.keyframe_insert(data_path="default_value", frame=frame)


def create_plate(scene: bpy.types.Scene, reference_dir: str, shot: Shot, index: int) -> None:
    filepath = os.path.join(reference_dir, shot.filename)
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Missing required anime plate: {filepath}")
    image = load_and_pack_image(filepath)
    material, strength, saturation, value = create_plate_material(shot, image)

    bpy.ops.mesh.primitive_plane_add(size=2.0, location=(0.0, 0.0, index * 0.002))
    plate = bpy.context.object
    plate.name = f"ANIME_PLATE_{index:02d}_{shot.slug}"
    plate.scale = (PLANE_WIDTH / 2.0, PLANE_HEIGHT / 2.0, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    plate.data.materials.append(material)
    plate["source_filename"] = shot.filename
    plate["visible_start_frame"] = shot.start
    plate["visible_end_frame"] = shot.end
    keyframe_visibility(plate, shot.start, shot.end)
    keyframe_fade(strength, shot)
    keyframe_grade(saturation, value, shot)


def render_previews(scene: bpy.types.Scene, preview_dir: str | None) -> None:
    if not preview_dir:
        return
    output_dir = os.path.abspath(preview_dir)
    os.makedirs(output_dir, exist_ok=True)
    previews = (
        ("warm-memory", 72),
        ("watch-threshold", 180),
        ("containment-push", 324),
        ("neural-droplet", 480),
        ("witness-through-glass", 564),
        ("fracture-dispersion", 684),
        ("signal-closeup", 864),
        ("handoff-black", 960),
    )
    for label, frame in previews:
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(output_dir, f"part1-opening-anime-{label}-v1.png")
        bpy.ops.render.render(write_still=True)
        print(f"ANIME_PREVIEW_FRAME_OK={scene.render.filepath}")


def main() -> None:
    args = parse_args()
    reset_file()
    scene = configure_scene()
    make_camera(scene)
    reference_dir = os.path.abspath(args.reference_dir)
    for index, shot in enumerate(SHOTS):
        create_plate(scene, reference_dir, shot, index)
    output = os.path.abspath(args.output)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    scene.frame_set(1)
    bpy.ops.file.pack_all()
    packed_reference_count = sum(
        1 for image in bpy.data.images if image.packed_file is not None
    )
    if packed_reference_count != len(SHOTS):
        raise RuntimeError(
            f"Expected {len(SHOTS)} packed references, got {packed_reference_count}"
        )
    bpy.ops.wm.save_as_mainfile(filepath=output)
    print(f"PART1_OPENING_ANIME_BLEND_OK={output}")
    print(f"PACKED_REFERENCE_COUNT={packed_reference_count}")
    print(f"FRAME_RANGE=1-{END_FRAME}@{FPS}")
    render_previews(scene, args.preview_dir)


if __name__ == "__main__":
    main()
