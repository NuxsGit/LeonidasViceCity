#include "game/vcs_multiplayer.h"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

#if defined(_WIN32)
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <arpa/inet.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
#endif

namespace vcs::multiplayer
{
    namespace
    {
        constexpr uint32_t kRamMask = 0x01FFFFFFu;
        constexpr uint32_t kPlayerPed = 0x004E4910u;  // CWorld::Players[0].m_pPed
        constexpr uint32_t kClockHours = 0x004CD148u; // CClock: hours, minutes (bytes)
        constexpr uint32_t kPedPool = 0x00487A94u;    // -> CPool {entries, flags, size}

        inline uint32_t rd32(const uint8_t *ram, uint32_t a)
        {
            uint32_t v = 0;
            std::memcpy(&v, ram + (a & kRamMask), 4);
            return v;
        }

        inline void wr32(uint8_t *ram, uint32_t a, uint32_t v)
        {
            std::memcpy(ram + (a & kRamMask), &v, 4);
        }

        inline uint16_t rd16(const uint8_t *ram, uint32_t a)
        {
            uint16_t v = 0;
            std::memcpy(&v, ram + (a & kRamMask), 2);
            return v;
        }

        inline void wr16(uint8_t *ram, uint32_t a, uint16_t v)
        {
            std::memcpy(ram + (a & kRamMask), &v, 2);
        }

        inline float rdf(const uint8_t *ram, uint32_t a)
        {
            float v = 0.0f;
            std::memcpy(&v, ram + (a & kRamMask), 4);
            return v;
        }

        inline void wrf(uint8_t *ram, uint32_t a, float v)
        {
            std::memcpy(ram + (a & kRamMask), &v, 4);
        }

        struct PlayerState
        {
            int sessionId = 0;
            std::string name;
            float x = 0.0f, y = 0.0f, z = 0.0f;
            float heading = 0.0f;
            float health = 100.0f;
            float armour = 100.0f;
            int model = 0;
            uint8_t clockHour = 12;
            uint8_t clockMinute = 0;
            uint32_t lastUpdateMs = 0;
        };

        bool g_initialized = false;
        bool g_active = false;
        int g_mySession = 1;
        bool g_isHost = true;
        std::string g_myName = "Player";
        std::string g_targetHost = "127.0.0.1";
        int g_targetPort = 7777;

        // Custom character profile
        int g_gender = 0;
        int g_outfit = 0;
        int g_skinTone = 0;
        int g_hairStyle = 0;
        int g_hairColor = 0;
        int g_pants = 0;
        int g_accessory = 0;

        // Socket
#if defined(_WIN32)
        SOCKET g_sock = INVALID_SOCKET;
#else
        int g_sock = -1;
#endif
        sockaddr_in g_relayAddr{};

        // Remote peer state
        PlayerState g_remotePlayer;
        uint32_t g_remotePedAddr = 0;
        uint32_t g_frameCount = 0;

        uint16_t getCharacterModelId(int gender, int outfit)
        {
            if (gender == 1) // Female
            {
                // Female ped model (Beach girl / Vice City resident)
                return 14;
            }
            // Male: Victor Vance outfit models in VCS PS2
            switch (outfit)
            {
            case 1: return 2; // Smart: Pastel Crockett 80s Suit
            case 2: return 5; // Street / Leather Hood
            case 3: return 3; // Muscle Tank Top (Trailer)
            case 4: return 4; // Veloce Tracksuit
            case 5: return 1; // Casual Denim Shirt
            default: return 0; // Default Army Fatigues
            }
        }

        void loadProfile()
        {
            namespace fs = std::filesystem;
            std::vector<fs::path> paths = {
                fs::current_path() / "multiplayer_profile.json",
                fs::current_path() / "multiplayer" / "multiplayer_profile.json",
                fs::current_path() / "build" / "multiplayer" / "multiplayer_profile.json",
                fs::current_path() / "build" / "multiplayer" / (std::string("session") + std::to_string(g_mySession)) / "multiplayer_profile.json"
            };

            for (const auto &p : paths)
            {
                std::error_code ec;
                if (!fs::exists(p, ec))
                    continue;

                std::ifstream f(p);
                if (!f.is_open())
                    continue;

                std::string line;
                while (std::getline(f, line))
                {
                    auto getInt = [&](const std::string &key) -> int {
                        size_t pos = line.find("\"" + key + "\"");
                        if (pos == std::string::npos) return -1;
                        size_t col = line.find(":", pos);
                        if (col == std::string::npos) return -1;
                        return std::atoi(line.substr(col + 1).c_str());
                    };
                    auto getStr = [&](const std::string &key) -> std::string {
                        size_t pos = line.find("\"" + key + "\"");
                        if (pos == std::string::npos) return "";
                        size_t first = line.find("\"", pos + key.size() + 2);
                        if (first == std::string::npos) return "";
                        size_t second = line.find("\"", first + 1);
                        if (second == std::string::npos) return "";
                        return line.substr(first + 1, second - first - 1);
                    };

                    int v = getInt("gender");
                    if (v >= 0) g_gender = v;
                    v = getInt("outfit");
                    if (v >= 0) g_outfit = v;
                    v = getInt("skinTone");
                    if (v >= 0) g_skinTone = v;
                    v = getInt("hairStyle");
                    if (v >= 0) g_hairStyle = v;
                    v = getInt("hairColor");
                    if (v >= 0) g_hairColor = v;
                    v = getInt("pants");
                    if (v >= 0) g_pants = v;
                    v = getInt("accessory");
                    if (v >= 0) g_accessory = v;
                    std::string s = getStr("name");
                    if (!s.empty()) g_myName = s;
                }
                break;
            }
        }
    }

    void init()
    {
        if (g_initialized)
            return;
        g_initialized = true;

        const char *envSession = std::getenv("LVCS_MP_SESSION");
        const char *envRole = std::getenv("LVCS_MP_ROLE");
        const char *envPort = std::getenv("LVCS_MP_PORT");
        const char *envConnect = std::getenv("LVCS_MP_CONNECT");
        const char *envName = std::getenv("LVCS_MP_NAME");

        if (!envSession && !envRole && !envConnect)
        {
            // Single player mode: multiplayer disabled
            g_active = false;
            return;
        }

        g_active = true;
        if (envSession) g_mySession = std::atoi(envSession);
        if (envRole && std::string(envRole) == "client") g_isHost = false;
        if (envPort) g_targetPort = std::atoi(envPort);
        if (envName) g_myName = envName;

        if (envConnect)
        {
            std::string c = envConnect;
            size_t col = c.find(":");
            if (col != std::string::npos)
            {
                g_targetHost = c.substr(0, col);
                g_targetPort = std::atoi(c.substr(col + 1).c_str());
            }
            else
            {
                g_targetHost = c;
            }
        }

        loadProfile();

#if defined(_WIN32)
        WSADATA wsaData;
        WSAStartup(MAKEWORD(2, 2), &wsaData);
        g_sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
        if (g_sock != INVALID_SOCKET)
        {
            u_long mode = 1; // non-blocking
            ioctlsocket(g_sock, FIONBIO, &mode);
        }
#else
        g_sock = socket(AF_INET, SOCK_DGRAM, 0);
        if (g_sock >= 0)
        {
            int flags = fcntl(g_sock, F_GETFL, 0);
            fcntl(g_sock, F_SETFL, flags | O_NONBLOCK);
        }
#endif

        std::memset(&g_relayAddr, 0, sizeof(g_relayAddr));
        g_relayAddr.sin_family = AF_INET;
        g_relayAddr.sin_port = htons(static_cast<uint16_t>(g_targetPort));
        inet_pton(AF_INET, g_targetHost.c_str(), &g_relayAddr.sin_addr);

        std::fprintf(stderr, "[LVCS-MP] Initialized Session %d (%s) -> Relay %s:%d\n",
                     g_mySession, g_isHost ? "Host" : "Client", g_targetHost.c_str(), g_targetPort);
    }

    bool isActive()
    {
        return g_active;
    }

    std::string status()
    {
        if (!g_active) return "Single Player";
        return std::string("Multiplayer Active (Session ") + std::to_string(g_mySession) + ")";
    }

    void onGameFrame(uint8_t *rdram)
    {
        if (!g_active)
        {
            if (!g_initialized)
                init();
            if (!g_active)
                return;
        }

        ++g_frameCount;
        const uint32_t ped = rd32(rdram, kPlayerPed);
        if (!ped)
            return;

        // 1. Apply Local Character Customization (Model & Outfit from Launcher Profile)
        const uint16_t desiredModel = getCharacterModelId(g_gender, g_outfit);
        const uint16_t currentModel = rd16(rdram, ped + 0x56);
        if (currentModel != desiredModel)
        {
            wr16(rdram, ped + 0x56, desiredModel);
        }

        // 2. Read Local Player Coordinates and Clock
        const float myX = rdf(rdram, ped + 0x30);
        const float myY = rdf(rdram, ped + 0x34);
        const float myZ = rdf(rdram, ped + 0x38);
        const float myHealth = rdf(rdram, ped + 0x4E4);
        const float myArmour = rdf(rdram, ped + 0x4E8);
        const uint8_t myHour = rdram[kClockHours & kRamMask];
        const uint8_t myMinute = rdram[(kClockHours + 1) & kRamMask];

        // 3. Network Send (every 2 frames for smooth 60fps / 120fps sync)
        if (g_frameCount % 2 == 0
#if defined(_WIN32)
            && g_sock != INVALID_SOCKET
#else
            && g_sock >= 0
#endif
        )
        {
            char packet[256];
            int len = std::snprintf(packet, sizeof(packet),
                                    "{\"session\":%d,\"name\":\"%s\",\"x\":%.2f,\"y\":%.2f,\"z\":%.2f,\"model\":%d,\"hp\":%.1f,\"arm\":%.1f,\"hr\":%d,\"min\":%d}",
                                    g_mySession, g_myName.c_str(), myX, myY, myZ, desiredModel, myHealth, myArmour, myHour, myMinute);
            sendto(g_sock, packet, len, 0, reinterpret_cast<const sockaddr *>(&g_relayAddr), sizeof(g_relayAddr));
        }

        // 4. Network Receive (Non-blocking loopback UDP)
        char recvBuf[512];
        for (;;)
        {
            int n = recvfrom(g_sock, recvBuf, sizeof(recvBuf) - 1, 0, nullptr, nullptr);
            if (n <= 0)
                break;
            recvBuf[n] = '\0';

            // Simple fast JSON parse
            std::string msg(recvBuf);
            auto parseNum = [&](const std::string &key, float defVal) -> float {
                size_t pos = msg.find("\"" + key + "\":");
                if (pos == std::string::npos) return defVal;
                return std::strtof(msg.c_str() + pos + key.size() + 3, nullptr);
            };

            int remoteSession = static_cast<int>(parseNum("session", 0));
            if (remoteSession == 0 || remoteSession == g_mySession)
                continue; // ignore our own broadcast loopback

            g_remotePlayer.sessionId = remoteSession;
            g_remotePlayer.x = parseNum("x", g_remotePlayer.x);
            g_remotePlayer.y = parseNum("y", g_remotePlayer.y);
            g_remotePlayer.z = parseNum("z", g_remotePlayer.z);
            g_remotePlayer.model = static_cast<int>(parseNum("model", g_remotePlayer.model));
            g_remotePlayer.health = parseNum("hp", 100.0f);
            g_remotePlayer.armour = parseNum("arm", 0.0f);

            int remoteHour = static_cast<int>(parseNum("hr", -1));
            int remoteMin = static_cast<int>(parseNum("min", -1));

            // Host rules the clock: Client synchronizes its world clock to Host
            if (!g_isHost && remoteHour >= 0 && remoteMin >= 0)
            {
                rdram[kClockHours & kRamMask] = static_cast<uint8_t>(remoteHour);
                rdram[(kClockHours + 1) & kRamMask] = static_cast<uint8_t>(remoteMin);
            }
        }

        // 5. Remote Player 2 Ped Synchronization
        // When remote player position is available, find or maintain the remote player ped entity in this world
        if (g_remotePlayer.sessionId != 0 && (std::abs(g_remotePlayer.x) > 0.1f || std::abs(g_remotePlayer.y) > 0.1f))
        {
            // Search or allocate remote ped from the Ped Pool if not set
            if (g_remotePedAddr == 0)
            {
                const uint32_t pool = rd32(rdram, kPedPool);
                if (pool)
                {
                    const uint32_t entries = rd32(rdram, pool);
                    const uint32_t flags = rd32(rdram, pool + 4);
                    const int size = static_cast<int>(rd32(rdram, pool + 8));
                    // Look for an entry that is not the local player
                    for (int i = 1; i < std::min(size, 40); ++i)
                    {
                        const uint32_t candidate = entries + i * 0x8D0u;
                        if (candidate != ped && candidate)
                        {
                            g_remotePedAddr = candidate;
                            // Set model
                            wr16(rdram, g_remotePedAddr + 0x56, static_cast<uint16_t>(g_remotePlayer.model ? g_remotePlayer.model : 1));
                            // Proofs against death/despawn
                            wr32(rdram, g_remotePedAddr + 0x484, 0xFFFFFFFFu);
                            break;
                        }
                    }
                }
            }

            // Sync remote ped coordinates to remote player's live position
            if (g_remotePedAddr != 0)
            {
                wrf(rdram, g_remotePedAddr + 0x30, g_remotePlayer.x);
                wrf(rdram, g_remotePedAddr + 0x34, g_remotePlayer.y);
                wrf(rdram, g_remotePedAddr + 0x38, g_remotePlayer.z);
                if (g_remotePlayer.model > 0)
                {
                    wr16(rdram, g_remotePedAddr + 0x56, static_cast<uint16_t>(g_remotePlayer.model));
                }
            }
        }
    }

    void shutdown()
    {
#if defined(_WIN32)
        if (g_sock != INVALID_SOCKET)
        {
            closesocket(g_sock);
            g_sock = INVALID_SOCKET;
        }
        WSACleanup();
#else
        if (g_sock >= 0)
        {
            close(g_sock);
            g_sock = -1;
        }
#endif
        g_active = false;
        g_initialized = false;
    }
}
