#!/usr/bin/env python3
import argparse
from pathlib import Path
import numpy as np

def split_frames(frames_path, out_dir, start=0, pad=6, overwrite=False, limit=None):
    frames_path = Path(frames_path)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Load without pulling all data into RAM
    arr = np.load(frames_path, mmap_mode="r")

    if arr.ndim not in (3, 4):
        raise ValueError(f"Expected (N,H,W,3) or (N,H,W); got shape {arr.shape}")

    n_total = arr.shape[0]
    n = n_total if limit is None else min(limit, n_total)

    written = 0
    for i in range(n):
        frame = arr[i]  # (H,W,3) uint8 in your dataset
        out_path = out_dir / f"frame_{start + i:0{pad}d}.npy"
        if out_path.exists() and not overwrite:
            raise FileExistsError(f"{out_path} exists (use --overwrite to replace).")
        np.save(out_path, frame, allow_pickle=False)
        written += 1

    print(f"Wrote {written} frames to {out_dir} (from {frames_path})")

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Split frames.npy into per-frame .npy files.")
    p.add_argument("frames_path", help="Path to frames.npy")
    p.add_argument("out_dir", help="Output directory for per-frame .npy files")
    p.add_argument("--start", type=int, default=0, help="Starting index (default: 0)")
    p.add_argument("--pad", type=int, default=6, help="Zero padding (default: 6 => 000000)")
    p.add_argument("--overwrite", action="store_true", help="Allow overwriting existing files")
    p.add_argument("--limit", type=int, default=None, help="Only write first N frames")
    args = p.parse_args()

    split_frames(args.frames_path, args.out_dir, args.start, args.pad, args.overwrite, args.limit)
