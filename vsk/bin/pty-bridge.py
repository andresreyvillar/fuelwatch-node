#!/usr/bin/env python3
"""PTY bridge for `vsk dashboard`: runs a shell inside a real pseudo-terminal.

stdin  -> keystrokes for the shell
stdout <- everything the terminal prints
fd 3   -> control channel, one JSON object per line: {"cols": 120, "rows": 40}

Standard library only, so the kit needs no native Node module.
"""
import fcntl
import json
import os
import pty
import select
import signal
import struct
import sys
import termios


def set_size(fd: int, cols: int, rows: int) -> None:
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))


def main() -> int:
    cwd, shell = sys.argv[1], sys.argv[2]
    args = sys.argv[3:] or [shell, "-l"]
    cols, rows = int(os.environ.get("VSK_COLS", "120")), int(os.environ.get("VSK_ROWS", "36"))
    pid, master = pty.fork()
    if pid == 0:
        os.chdir(cwd)
        env = dict(os.environ, TERM="xterm-256color", COLORTERM="truecolor")
        env.pop("VSK_COLS", None)
        env.pop("VSK_ROWS", None)
        os.execvpe(args[0], args, env)
    set_size(master, cols, rows)
    os.kill(pid, signal.SIGWINCH)
    control = 3
    pending = b""
    inputs = [0, master, control]
    while True:
        try:
            ready, _, _ = select.select(inputs, [], [], 0.5)
        except InterruptedError:
            continue
        if master in ready:
            try:
                data = os.read(master, 65536)
            except OSError:
                break
            if not data:
                break
            os.write(1, data)
        if 0 in ready:
            data = os.read(0, 65536)
            if not data:
                inputs.remove(0)
            else:
                os.write(master, data)
        if control in ready:
            chunk = os.read(control, 4096)
            if not chunk:
                inputs.remove(control)
                continue
            pending += chunk
            while b"\n" in pending:
                line, pending = pending.split(b"\n", 1)
                try:
                    msg = json.loads(line)
                    set_size(master, int(msg["cols"]), int(msg["rows"]))
                    os.kill(pid, signal.SIGWINCH)
                except (ValueError, KeyError, OSError):
                    pass
        done, status = os.waitpid(pid, os.WNOHANG)
        if done:
            return os.waitstatus_to_exitcode(status)
    _, status = os.waitpid(pid, 0)
    return os.waitstatus_to_exitcode(status)


if __name__ == "__main__":
    sys.exit(main())
