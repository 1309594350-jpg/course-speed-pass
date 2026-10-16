#!/usr/bin/env python3
"""Copy the bundled local course-automation sandbox into an empty directory."""

from __future__ import annotations

import argparse
import shutil
import stat
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_ROOT = SKILL_ROOT / "assets" / "course-demo-template"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a local simulated course automation lab.",
    )
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Absolute path to a new or empty output directory.",
    )
    return parser.parse_args()


def validate_destination(destination: Path) -> None:
    if not destination.is_absolute():
        raise SystemExit("--output must be an absolute path")

    resolved = destination.resolve()
    forbidden = {Path("/"), Path.home().resolve(), SKILL_ROOT.resolve(), TEMPLATE_ROOT.resolve()}
    if resolved in forbidden:
        raise SystemExit(f"Refusing unsafe output directory: {resolved}")

    if destination.exists() and any(destination.iterdir()):
        raise SystemExit(f"Output directory is not empty: {destination}")


def make_launchers_executable(destination: Path) -> None:
    for name in ("启动演示.command", "运行自动化测试.command"):
        path = destination / name
        path.chmod(path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def main() -> None:
    args = parse_args()
    destination = args.output.expanduser()
    validate_destination(destination)

    destination.mkdir(parents=True, exist_ok=True)
    shutil.copytree(TEMPLATE_ROOT, destination, dirs_exist_ok=True)
    make_launchers_executable(destination)

    print(f"Course speed pass demo created at: {destination}")
    print(f"Launch: {destination / '启动演示.command'}")
    print(f"Test:   {destination / '运行自动化测试.command'}")


if __name__ == "__main__":
    main()
