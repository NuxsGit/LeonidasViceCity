#!/usr/bin/env python3
"""Leonidas Vice City Stories - Local Multiplayer Relay Server & Dual Session Tool (LVCS-MP).
Coordinates and synchronizes local multi-session testing (Host & Client) over UDP/TCP loopback.
"""

import argparse
import json
import os
import signal
import socket
import subprocess
import sys
import threading
import time

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 7777
PID_FILE = os.path.join("build", "multiplayer", "relay.pid")
LOG_FILE = os.path.join("build", "multiplayer", "relay.log")


class MultiplayerRelayServer:
    def __init__(self, host=DEFAULT_HOST, port=DEFAULT_PORT):
        self.host = host
        self.port = port
        self.running = False
        self.clients = {}  # addr -> session_id
        self.lock = threading.Lock()
        self.packet_count = 0
        self.sock = None

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
            # Raw binary game state packet relay
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

        # Broadcast state / sync packets to all other connected peers
        with self.lock:
            for target_addr in list(self.clients.keys()):
                if target_addr != addr:
                    try:
                        self.sock.sendto(data, target_addr)
                    except OSError:
                        pass

    def stop(self):
        self.running = False
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
    print("[LVCS-MP DevTool] Initializing Dual Multiplayer Sessions...")

    mp_dir = os.path.join(root_dir, "build", "multiplayer")
    s1_dir = os.path.join(mp_dir, "session1")
    s2_dir = os.path.join(mp_dir, "session2")
    os.makedirs(s1_dir, exist_ok=True)
    os.makedirs(s2_dir, exist_ok=True)

    # Player 1 Profile (Host)
    p1_profile = {
        "name": "Vic_Vance",
        "gender": 0,
        "skinTone": 1,
        "hairStyle": 0,
        "hairColor": 4,
        "outfit": 0,
        "outfitColor": 0,
        "pants": 0,
        "accessory": 1,
        "cash": 5000,
        "rep": 100,
        "role": "host",
        "port": 7777
    }
    with open(os.path.join(s1_dir, "multiplayer_profile.json"), "w") as f:
        json.dump(p1_profile, f, indent=2)

    # Player 2 Profile (Client)
    p2_profile = {
        "name": "Lance_Vance",
        "gender": 0,
        "skinTone": 2,
        "hairStyle": 1,
        "hairColor": 0,
        "outfit": 1,
        "outfitColor": 1,
        "pants": 1,
        "accessory": 2,
        "cash": 4500,
        "rep": 90,
        "role": "client",
        "connect": "127.0.0.1:7777"
    }
    with open(os.path.join(s2_dir, "multiplayer_profile.json"), "w") as f:
        json.dump(p2_profile, f, indent=2)

    # Check or start local relay
    if not check_status():
        print("[LVCS-MP DevTool] Starting local relay server daemon...")
        subprocess.Popen([sys.executable, os.path.abspath(__file__), "--server"],
                         stdout=open(LOG_FILE, "a"), stderr=subprocess.STDOUT)
        time.sleep(0.5)

    print("[LVCS-MP DevTool] Session 1 (Host: Vic_Vance) configured -> Port 7777")
    print("[LVCS-MP DevTool] Session 2 (Client: Lance_Vance) configured -> Connect 127.0.0.1:7777")
    print("[LVCS-MP DevTool] Memory cards isolated in build/multiplayer/session[1|2]/")
    print("[LVCS-MP DevTool] Ready for live network testing.")
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
    parser.add_argument("--server", action="store_true", help="Run the UDP relay server")
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
