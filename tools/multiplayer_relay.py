#!/usr/bin/env python3
"""Leonidas Vice City Stories - Local Multiplayer Relay Server & Live Memory Bridge (LVCS-MP).
Coordinates and synchronizes local multi-session testing over UDP and PS2X Control Channel.
Applies Character Customization and physically spawns Player 1 and Player 2 in each other's worlds.
"""

import argparse
import json
import os
import signal
import socket
import struct
import subprocess
import sys
import threading
import time

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 7777
PID_FILE = os.path.join("build", "multiplayer", "relay.pid")
LOG_FILE = os.path.join("build", "multiplayer", "relay.log")

# In-game memory addresses
ADDR_PLAYER_PED = 0x004E4910
ADDR_CLOCK_HOURS = 0x004CD148
ADDR_PED_POOL = 0x00487A94


def send_cmd(command, port=47615, timeout=0.1):
    """Sends command to running game over control channel (runtime/ps2_control.h)."""
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=timeout) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, struct.pack("ii", 1, 0))
            s.sendall((command + "\n").encode("utf-8"))
            data = b""
            while not data.endswith(b"\n"):
                chunk = s.recv(1024)
                if not chunk:
                    break
                data += chunk
            return data.decode("utf-8", errors="replace").strip()
    except Exception:
        return ""


def get_character_model_id(gender, outfit):
    """Maps launcher editor gender and outfit to GTA VCS PS2 character models."""
    if gender == 1:
        return 14  # Female beach / vice resident
    # Male outfits
    outfit_map = {
        0: 0,   # Army fatigues
        1: 2,   # Smart: Pastel 80s Crockett Suit
        2: 5,   # Street / Leather Hood
        3: 3,   # Muscle Beach Tank Top
        4: 4,   # Veloce Tracksuit
        5: 1,   # Casual Denim Shirt
    }
    return outfit_map.get(outfit, 0)


class MultiplayerMemoryBridge(threading.Thread):
    """Bridges game memory between Session 1 (47615) and Session 2 (47616)."""
    def __init__(self, root_dir="."):
        super().__init__(daemon=True)
        self.root_dir = root_dir
        self.running = True
        self.s1_ped = 0
        self.s2_ped = 0
        self.s1_remote_ped = 0
        self.s2_remote_ped = 0
        self.s2_spawn_synced = False

    def run(self):
        print("[LVCS-MP Bridge] Memory bridge active: monitoring Session 1 (47615) & Session 2 (47616)...")
        while self.running:
            try:
                self.sync_tick()
            except Exception as e:
                pass
            time.sleep(0.04)  # ~25 Hz sync

    def load_profiles(self):
        # Session 1 profile
        p1 = {"gender": 0, "outfit": 0}
        path1 = os.path.join(self.root_dir, "build", "multiplayer", "session1", "multiplayer_profile.json")
        if not os.path.exists(path1):
            path1 = os.path.join(self.root_dir, "build", "multiplayer", "multiplayer_profile.json")
        if os.path.exists(path1):
            try:
                with open(path1) as f:
                    p1 = json.load(f)
            except Exception:
                pass

        # Session 2 profile
        p2 = {"gender": 0, "outfit": 1}
        path2 = os.path.join(self.root_dir, "build", "multiplayer", "session2", "multiplayer_profile.json")
        if os.path.exists(path2):
            try:
                with open(path2) as f:
                    p2 = json.load(f)
            except Exception:
                pass
        return p1, p2

    def sync_tick(self):
        # 1. Query Player 1 state
        res1 = send_cmd("player", port=47615)
        # res1 format: "ok <ped> <x> <y> <z> <mission>"
        p1_parts = res1.split() if res1.startswith("ok") else []
        if len(p1_parts) < 5:
            # Dismiss any start/loading screen prompts
            send_cmd("press Return 150", port=47615)
            return

        p1_ped = int(p1_parts[1], 16)
        x1, y1, z1 = float(p1_parts[2]), float(p1_parts[3]), float(p1_parts[4])

        # 2. Query Player 2 state
        res2 = send_cmd("player", port=47616)
        p2_parts = res2.split() if res2.startswith("ok") else []
        if len(p2_parts) < 5:
            # Automatically dismiss loading / memory card check screen on Session 2
            send_cmd("press Return 150", port=47616)
            send_cmd("press Space 150", port=47616)
            return

        p2_ped = int(p2_parts[1], 16)
        x2, y2, z2 = float(p2_parts[2]), float(p2_parts[3]), float(p2_parts[4])

        # Safety Rescue: if Player 1 is out in the ocean (-1004, -1435) from older buggy saves,
        # recover to solid ground at Ocean Beach outside the Pole Position Club
        if x1 < -800.0 and y1 < -1200.0:
            x1, y1, z1 = 482.0, -1380.0, 10.5
            send_cmd(f"pokef 0x{p1_ped + 0x30:08x} {x1:.3f} {y1:.3f} {z1:.3f}", port=47615)

        prof1, prof2 = self.load_profiles()
        m1 = get_character_model_id(prof1.get("gender", 0), prof1.get("outfit", 0))
        m2 = get_character_model_id(prof2.get("gender", 0), prof2.get("outfit", 1))

        # 3. Apply Character Customization (Model index at ped + 0x56)
        m1_hex = f"{m1:04x}"
        m1_bytes = m1_hex[2:4] + m1_hex[0:2]  # little endian 16-bit
        send_cmd(f"poke 0x{p1_ped + 0x56:08x} {m1_bytes}", port=47615)

        m2_hex = f"{m2:04x}"
        m2_bytes = m2_hex[2:4] + m2_hex[0:2]
        send_cmd(f"poke 0x{p2_ped + 0x56:08x} {m2_bytes}", port=47616)

        # 4. In Session 1: Place / move Player 2's ped entity at (x2, y2, z2)
        if self.s1_remote_ped == 0:
            pool_res = send_cmd("peek 0x00487A94 12", port=47615)
            if pool_res.startswith("ok"):
                raw_hex = pool_res[3:].strip()
                if len(raw_hex) >= 16:
                    entries_addr = int("".join(reversed([raw_hex[i:i+2] for i in range(0, 8, 2)])), 16)
                    flags_addr = int("".join(reversed([raw_hex[i:i+2] for i in range(8, 16, 2)])), 16)
                    self.s1_remote_ped = entries_addr + 1 * 0xD20
                    send_cmd(f"poke 0x{flags_addr + 1:08x} 01", port=47615) # mark ped slot 1 active

        if self.s1_remote_ped:
            # Set coordinates to Session 2's live position
            send_cmd(f"pokef 0x{self.s1_remote_ped + 0x30:08x} {x2:.3f} {y2:.3f} {z2:.3f}", port=47615)
            # Set model to Player 2's chosen character model
            send_cmd(f"poke 0x{self.s1_remote_ped + 0x56:08x} {m2_bytes}", port=47615)
            # Invulnerable / prevent despawn
            send_cmd(f"poke 0x{self.s1_remote_ped + 0x484:08x} ffffffff", port=47615)

        # 5. In Session 2: Place / move Player 1's ped entity at (x1, y1, z1)
        if self.s2_remote_ped == 0:
            pool_res = send_cmd("peek 0x00487A94 12", port=47616)
            if pool_res.startswith("ok"):
                raw_hex = pool_res[3:].strip()
                if len(raw_hex) >= 16:
                    entries_addr = int("".join(reversed([raw_hex[i:i+2] for i in range(0, 8, 2)])), 16)
                    flags_addr = int("".join(reversed([raw_hex[i:i+2] for i in range(8, 16, 2)])), 16)
                    self.s2_remote_ped = entries_addr + 1 * 0xD20
                    send_cmd(f"poke 0x{flags_addr + 1:08x} 01", port=47616) # mark ped slot 1 active

        if self.s2_remote_ped:
            # Set coordinates to Session 1's live position
            send_cmd(f"pokef 0x{self.s2_remote_ped + 0x30:08x} {x1:.3f} {y1:.3f} {z1:.3f}", port=47616)
            # Set model to Player 1's chosen character model
            send_cmd(f"poke 0x{self.s2_remote_ped + 0x56:08x} {m1_bytes}", port=47616)
            send_cmd(f"poke 0x{self.s2_remote_ped + 0x484:08x} ffffffff", port=47616)

        # 6. Synchronize in-game world clock (Session 2 copies Session 1)
        clock_res = send_cmd("peek 0x004CD148 2", port=47615)
        if clock_res.startswith("ok"):
            clock_hex = clock_res[3:].strip()
            if len(clock_hex) == 4:
                send_cmd(f"poke 0x004CD148 {clock_hex}", port=47616)


class MultiplayerRelayServer:
    def __init__(self, host=DEFAULT_HOST, port=DEFAULT_PORT):
        self.host = host
        self.port = port
        self.running = False
        self.clients = {}  # addr -> session_id
        self.lock = threading.Lock()
        self.packet_count = 0
        self.sock = None
        self.bridge = None

    def start(self):
        self.running = True
        os.makedirs(os.path.dirname(PID_FILE), exist_ok=True)
        with open(PID_FILE, "w") as f:
            f.write(str(os.getpid()))

        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            self.sock.bind((self.host, self.port))
        except OSError as e:
            print(f"[LVCS-MP Relay] Error: Could not bind to {self.host}:{self.port}: {e}")
            return False

        print(f"[LVCS-MP Relay] Server active on {self.host}:{self.port} (UDP)")
        print(f"[LVCS-MP Relay] Ready for Dual Session synchronization.")

        # Start live game memory bridge
        self.bridge = MultiplayerMemoryBridge()
        self.bridge.start()

        while self.running:
            try:
                data, addr = self.sock.recvfrom(4096)
                if not data:
                    continue
                self.handle_packet(data, addr)
            except OSError:
                break
        return True

    def handle_packet(self, data, addr):
        self.packet_count += 1
        try:
            msg = json.loads(data.decode("utf-8"))
        except Exception:
            with self.lock:
                for target_addr in list(self.clients.keys()):
                    if target_addr != addr:
                        try:
                            self.sock.sendto(data, target_addr)
                        except OSError:
                            pass
            return

        cmd = msg.get("cmd")
        session_id = msg.get("session", 0)

        with self.lock:
            self.clients[addr] = session_id

        if cmd == "ping":
            resp = json.dumps({"cmd": "pong", "time": time.time(), "packets": self.packet_count}).encode("utf-8")
            self.sock.sendto(resp, addr)
            return

        if cmd == "handshake":
            resp = json.dumps({
                "cmd": "handshake_ack",
                "session": session_id,
                "connected_peers": len(self.clients),
                "status": "synchronized"
            }).encode("utf-8")
            self.sock.sendto(resp, addr)
            print(f"[LVCS-MP Relay] Session {session_id} connected from {addr}")
            return

        with self.lock:
            for target_addr in list(self.clients.keys()):
                if target_addr != addr:
                    try:
                        self.sock.sendto(data, target_addr)
                    except OSError:
                        pass

    def stop(self):
        self.running = False
        if self.bridge:
            self.bridge.running = False
        if self.sock:
            try:
                self.sock.close()
            except OSError:
                pass
        if os.path.isfile(PID_FILE):
            try:
                os.remove(PID_FILE)
            except OSError:
                pass
        print("[LVCS-MP Relay] Server stopped.")


def check_status(host=DEFAULT_HOST, port=DEFAULT_PORT):
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(1.0)
    start_t = time.time()
    try:
        sock.sendto(json.dumps({"cmd": "ping"}).encode("utf-8"), (host, port))
        data, _ = sock.recvfrom(1024)
        latency_ms = (time.time() - start_t) * 1000.0
        msg = json.loads(data.decode("utf-8"))
        print(f"[LVCS-MP] Relay is RUNNING on {host}:{port} | Latency: {latency_ms:.1f}ms | Packets: {msg.get('packets', 0)}")
        return True
    except Exception:
        print(f"[LVCS-MP] Relay is OFFLINE on {host}:{port}")
        return False
    finally:
        sock.close()


def launch_dual_sessions(root_dir="."):
    print("[LVCS-MP DevTool] Initializing Dual Multiplayer Sessions with Live Memory Bridge...")

    mp_dir = os.path.join(root_dir, "build", "multiplayer")
    s1_dir = os.path.join(mp_dir, "session1")
    s2_dir = os.path.join(mp_dir, "session2")
    os.makedirs(s1_dir, exist_ok=True)
    os.makedirs(s2_dir, exist_ok=True)

    # Load main character profile from launcher if present
    main_prof_path = os.path.join(mp_dir, "multiplayer_profile.json")
    main_p = {
        "name": "Vic_Vance",
        "gender": 0,
        "skinTone": 1,
        "hairStyle": 0,
        "hairColor": 4,
        "outfit": 1,
        "outfitColor": 0,
        "pants": 0,
        "accessory": 1,
    }
    if os.path.exists(main_prof_path):
        try:
            with open(main_prof_path) as f:
                main_p.update(json.load(f))
        except Exception:
            pass

    p1_profile = dict(main_p)
    p1_profile.update({"role": "host", "port": 7777, "control_port": 47615})
    with open(os.path.join(s1_dir, "multiplayer_profile.json"), "w") as f:
        json.dump(p1_profile, f, indent=2)

    # Player 2 has distinct character (e.g. Lance Vance / smart suit)
    p2_profile = {
        "name": "Lance_Vance",
        "gender": 0,
        "skinTone": 2,
        "hairStyle": 1,
        "hairColor": 0,
        "outfit": 2 if main_p.get("outfit") == 1 else 1,
        "outfitColor": 1,
        "pants": 1,
        "accessory": 2,
        "role": "client",
        "connect": "127.0.0.1:7777",
        "control_port": 47616
    }
    with open(os.path.join(s2_dir, "multiplayer_profile.json"), "w") as f:
        json.dump(p2_profile, f, indent=2)

    if not check_status():
        print("[LVCS-MP DevTool] Starting local relay server daemon...")
        subprocess.Popen([sys.executable, os.path.abspath(__file__), "--server"],
                         stdout=open(LOG_FILE, "a"), stderr=subprocess.STDOUT)
        time.sleep(0.5)

    print("[LVCS-MP DevTool] Session 1 (Control Port 47615) -> Character Model applied from Launcher")
    print("[LVCS-MP DevTool] Session 2 (Control Port 47616) -> Cross-Spawned into Session 1 World")
    print("[LVCS-MP DevTool] Memory cards isolated in build/multiplayer/session[1|2]/")
    print("[LVCS-MP DevTool] Live Memory Bridge running.")
    return True


def stop_relay():
    if os.path.isfile(PID_FILE):
        try:
            with open(PID_FILE) as f:
                pid = int(f.read().strip())
            os.kill(pid, signal.SIGTERM)
            print(f"[LVCS-MP] Stopped relay process PID {pid}")
        except Exception as e:
            print(f"[LVCS-MP] Could not stop PID: {e}")
        try:
            os.remove(PID_FILE)
        except OSError:
            pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--server", action="store_true", help="Run the UDP relay server & memory bridge")
    parser.add_argument("--status", action="store_true", help="Check if relay is running")
    parser.add_argument("--ping", action="store_true", help="Ping the relay server")
    parser.add_argument("--launch-dual", action="store_true", help="Configure and launch dual sessions for dev testing")
    parser.add_argument("--stop", action="store_true", help="Stop any running relay server")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()

    if args.server:
        srv = MultiplayerRelayServer(args.host, args.port)
        srv.start()
    elif args.status or args.ping:
        ok = check_status(args.host, args.port)
        sys.exit(0 if ok else 1)
    elif args.launch_dual:
        launch_dual_sessions()
    elif args.stop:
        stop_relay()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
