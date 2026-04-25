from __future__ import annotations

import os
import signal
import subprocess
import sys
from pathlib import Path


APP_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = APP_DIR.parent


def spawn_process(command: list[str], cwd: Path) -> subprocess.Popen:
    return subprocess.Popen(command, cwd=str(cwd))


def terminate_process(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return

    try:
        if os.name == "nt":
            process.send_signal(signal.CTRL_BREAK_EVENT)
        else:
            process.terminate()
        process.wait(timeout=5)
    except Exception:
        process.kill()


def main() -> int:
    backend_command = [sys.executable, "app.py"]
    frontend_command = ["npx", "expo", "start"]

    backend = spawn_process(backend_command, PROJECT_DIR / "backend")
    frontend = None

    try:
        frontend = spawn_process(frontend_command, APP_DIR)
        frontend.wait()
        return frontend.returncode or 0
    except KeyboardInterrupt:
        return 0
    finally:
        if frontend is not None:
            terminate_process(frontend)
        terminate_process(backend)


if __name__ == "__main__":
    raise SystemExit(main())
