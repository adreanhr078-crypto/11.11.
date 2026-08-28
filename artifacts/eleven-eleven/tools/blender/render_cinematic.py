import argparse
import os
import sys

import bpy


def script_args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


parser = argparse.ArgumentParser(description="Render an 11.11 cinematic PNG sequence")
parser.add_argument("--output-dir", required=True)
parser.add_argument("--start", required=True, type=int)
parser.add_argument("--end", required=True, type=int)
parser.add_argument("--fps", required=True, type=int)
args = parser.parse_args(script_args())

if args.start < 1 or args.end < args.start:
    raise ValueError("Invalid cinematic frame range")

output_dir = os.path.abspath(args.output_dir)
os.makedirs(output_dir, exist_ok=True)

scene = bpy.context.scene
scene.frame_start = args.start
scene.frame_end = args.end
scene.render.fps = args.fps
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.filepath = os.path.join(output_dir, "frame_")
bpy.ops.render.render(animation=True)
print(f"CINEMATIC_RENDER_OK={output_dir}")
