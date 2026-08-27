"""
tools/blender/render_cinematic.py

Blender Python script for headless cinematic PNG sequence export.
Called by: blender --background scene.blend --python tools/blender/render_cinematic.py

Usage:
  blender --background scene.blend --python tools/blender/render_cinematic.py -- --output-dir ./frames --start 1 --end 120 --fps 24
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

def render_frames(output_dir: str, start: int, end: int, fps: int):
    scene = bpy.context.scene
    scene.render.image_settings.file_format = 'PNG'
    scene.render.fps = fps
    scene.frame_start = start
    scene.frame_end = end

    os.makedirs(output_dir, exist_ok=True)
    scene.render.filepath = os.path.join(output_dir, 'frame_')

    bpy.ops.render.render(animation=True)
    print(f'RENDERED_FRAMES: {start}-{end} @ {fps}fps -> {output_dir}')

def main():
    args = parse_args()
    output_dir = args.get('output-dir', os.path.join(os.path.dirname(bpy.data.filepath), 'frames'))
    start = int(args.get('start', 1))
    end = int(args.get('end', 120))
    fps = int(args.get('fps', 24))
    render_frames(output_dir, start, end, fps)

if __name__ == '__main__':
    main()
