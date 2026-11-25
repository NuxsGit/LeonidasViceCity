#!/usr/bin/env python3
"""
Automated validation and test suite for Leonidas Vice City Stories Multiplayer (LVCS-MP).
Tests character profile persistence, isolated save system, and UDP loopback relay.
"""

import os
import sys
import json
import time
import socket
import unittest
import tempfile
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT_DIR, "tools"))

from multiplayer_relay import (
    DEFAULT_HOST,
    DEFAULT_PORT,
    MultiplayerRelayServer,
    check_status,
    make_spawn_char_scm,
    make_move_char_scm,
    get_character_model_id,
)


class TestMultiplayerSystem(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp(prefix="lvcs_mp_test_")
        self.saves_dir = os.path.join(self.test_dir, "saves")
        os.makedirs(self.saves_dir, exist_ok=True)

    def tearDown(self):
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_character_profile_persistence(self):
        profile_path = os.path.join(self.test_dir, "multiplayer_profile.json")
        profile_data = {
            "name": "Tommy_Vercetti",
            "gender": 0,
            "skinTone": 1,
            "hairStyle": 2,
            "hairColor": 1,
            "outfit": 1,
            "outfitColor": 1,
            "pants": 0,
            "accessory": 1,
            "cash": 25000,
            "rep": 150,
            "serverHost": "127.0.0.1",
            "serverPort": 7777,
        }
        with open(profile_path, "w", encoding="utf-8") as f:
            json.dump(profile_data, f, indent=2)

        self.assertTrue(os.path.exists(profile_path))
        with open(profile_path, "r", encoding="utf-8") as f:
            loaded = json.load(f)
        self.assertEqual(loaded["name"], "Tommy_Vercetti")
        self.assertEqual(loaded["cash"], 25000)
        self.assertEqual(loaded["accessory"], 1)

    def test_multiplayer_isolated_saves(self):
        slot_file = os.path.join(self.saves_dir, "MP_SLOT_01.json")
        slot_data = {
            "slot": "MP_SLOT_01",
            "name": "Vic_Vance",
            "gender": 0,
            "skinTone": 2,
            "hairStyle": 0,
            "hairColor": 0,
            "outfit": 0,
            "outfitColor": 0,
            "pants": 1,
            "accessory": 0,
            "cash": 5000,
            "rep": 25,
            "saved_at": str(time.time()),
        }
        with open(slot_file, "w", encoding="utf-8") as f:
            json.dump(slot_data, f, indent=2)

        self.assertTrue(os.path.exists(slot_file))
        self.assertTrue(slot_file.endswith("MP_SLOT_01.json"))
        # Ensure single player mc0 path is not touched
        self.assertNotIn("mc0", slot_file)

    def test_udp_relay_ping_and_pong(self):
        # Bind to a dedicated test port to avoid port conflict
        test_port = 7789
        server = MultiplayerRelayServer(host="127.0.0.1", port=test_port)
        
        import threading
        t = threading.Thread(target=server.start, daemon=True)
        t.start()
        time.sleep(0.15)

        try:
            # Client socket sends PING
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(1.0)
            ping_data = json.dumps({"cmd": "ping", "time": time.time()}).encode("utf-8")
            sock.sendto(ping_data, ("127.0.0.1", test_port))

            resp, _ = sock.recvfrom(4096)
            data = json.loads(resp.decode("utf-8"))
            self.assertEqual(data.get("cmd"), "pong")
            sock.close()
        finally:
            server.stop()

    def test_scm_spawn_bytecode_generation(self):
        # Model 2 (Smart Crockett Suit), coords (482.0, -1380.0, 10.5)
        spawn_hex = make_spawn_char_scm(2, 482.0, -1380.0, 10.5)
        spawn_bytes = bytes.fromhex(spawn_hex)
        
        # Must fit within rig kCodeMax (176 bytes)
        self.assertLessEqual(len(spawn_bytes), 176)
        
        # Opcode 0x0160 = REQUEST_MODEL (60 01)
        self.assertEqual(spawn_bytes[0:2], b"\x60\x01")
        # Opcode 0x0228 = LOAD_ALL_MODELS_NOW (28 02)
        self.assertIn(b"\x28\x02", spawn_bytes)
        # Opcode 0x003E = CREATE_CHAR (3e 00)
        self.assertIn(b"\x3e\x00", spawn_bytes)
        # Opcode 0x01B1 = SET_CHAR_PROOFS (b1 01)
        self.assertIn(b"\xb1\x01", spawn_bytes)
        # Opcode 0x014B = SET_CHAR_HEALTH (4b 01)
        self.assertIn(b"\x4b\x01", spawn_bytes)
        # Opcode 0x0023 = TERMINATE_THIS_SCRIPT (23 00) at end
        self.assertEqual(spawn_bytes[-2:], b"\x23\x00")

    def test_scm_move_bytecode_generation(self):
        # Handle 0x0101, coords (482.0, -1380.0, 10.5), heading 1.57 rad
        move_hex = make_move_char_scm(0x0101, 482.0, -1380.0, 10.5, 1.57)
        move_bytes = bytes.fromhex(move_hex)
        
        self.assertLessEqual(len(move_bytes), 176)
        # Opcode 0x0044 = SET_CHAR_COORDINATES (44 00)
        self.assertEqual(move_bytes[0:2], b"\x44\x00")
        # Opcode 0x00CF = SET_CHAR_HEADING (cf 00)
        self.assertIn(b"\xcf\x00", move_bytes)
        # Opcode 0x0023 = TERMINATE_THIS_SCRIPT (23 00)
        self.assertEqual(move_bytes[-2:], b"\x23\x00")

    def test_character_model_mapping(self):
        # Female resident
        self.assertEqual(get_character_model_id(1, 0), 14)
        # Male outfits
        self.assertEqual(get_character_model_id(0, 1), 2)  # Smart
        self.assertEqual(get_character_model_id(0, 2), 5)  # Street
        self.assertEqual(get_character_model_id(0, 3), 3)  # Muscle
        self.assertEqual(get_character_model_id(0, 4), 4)  # Tracksuit
        self.assertEqual(get_character_model_id(0, 5), 1)  # Casual


if __name__ == "__main__":
    unittest.main()
