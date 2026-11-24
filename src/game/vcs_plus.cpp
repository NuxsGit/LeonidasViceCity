#include "game/vcs_plus.h"
#include "platform/platform.h"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>

namespace vcs::plus
{
    namespace
    {
        constexpr uint32_t kRamMask = 0x01FFFFFFu;
        constexpr uint32_t kPlayerPed = 0x004E4910u;  // CWorld::Players[0].m_pPed
        constexpr uint32_t kMoney = 0x004E49CCu;      // CPlayerInfo money
        constexpr uint32_t kCamera = 0x006F44D0u;     // TheCamera
        constexpr uint32_t kCarFactor = 0x0048A680u; // float 0.7
        constexpr uint32_t kPedFactor = 0x0048A67Cu; // float 0.4
        constexpr uint32_t kLodScale = 0x004887F8u;  // float 1.0
        constexpr uint32_t kPedVehicle = 0x480u;      // vehicle ptr (0 on foot)
        constexpr uint32_t kPedHealth = 0x4E4u;
        constexpr uint32_t kPedArmour = 0x4E8u;
        constexpr uint32_t kCarVelocity = 0x140u;    // velocity vector (units per 1/50 s)
        constexpr uint32_t kPedPool = 0x00487A94u;

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

        // Ocean Beach Pole Position Strip Club coordinates
        constexpr float kClubExtX = 482.0f;
        constexpr float kClubExtY = -1380.0f;
        constexpr float kClubExtZ = 10.0f;

        constexpr float kClubIntX = -1004.0f;
        constexpr float kClubIntY = -1435.0f;
        constexpr float kClubIntZ = 12.0f;

        constexpr float kVipBoothX = -1008.0f;
        constexpr float kVipBoothY = -1440.0f;
        constexpr float kVipBoothZ = 12.0f;

        // VCS+ Toggles
        bool g_gta6Pop = true;
        bool g_ultraHorizon = true;
        bool g_infiniteSwim = true;
        bool g_bulletTime = false;
        bool g_firstPersonCam = false;
        bool g_inClub = false;
        bool g_privateDance = false;

        float g_danceTimer = 0.0f;
        int g_camAngle = 0;
        float g_nitroCooldown = 0.0f;
        float g_currentSpeedKmh = 0.0f;
        std::string g_hudPrompt;
        std::string g_speedometerStr;

        float dist3D(float x1, float y1, float z1, float x2, float y2, float z2)
        {
            float dx = x1 - x2, dy = y1 - y2, dz = z1 - z2;
            return std::sqrt(dx * dx + dy * dy + dz * dz);
        }
    }

    void init()
    {
        g_gta6Pop = true;
        g_ultraHorizon = true;
        g_infiniteSwim = true;
    }

    bool isPrivateDanceActive() { return g_privateDance; }

    void startPrivateDance(uint8_t *rdram)
    {
        g_privateDance = true;
        g_danceTimer = 0.0f;
        g_camAngle = 0;

        const uint32_t ped = rd32(rdram, kPlayerPed);
        if (ped)
        {
            wrf(rdram, ped + 0x30, kVipBoothX);
            wrf(rdram, ped + 0x34, kVipBoothY);
            wrf(rdram, ped + 0x38, kVipBoothZ);

            int money = static_cast<int>(rd32(rdram, kMoney));
            if (money >= 50)
                wr32(rdram, kMoney, static_cast<uint32_t>(money - 50));

            wrf(rdram, ped + kPedHealth, 100.0f);
            wrf(rdram, ped + kPedArmour, 100.0f);
        }
    }

    void stopPrivateDance(uint8_t *rdram)
    {
        g_privateDance = false;
        g_danceTimer = 0.0f;
    }

    void setGta6Population(bool enable) { g_gta6Pop = enable; }
    bool isGta6PopulationEnabled() { return g_gta6Pop; }

    void setUltraHorizon(bool enable) { g_ultraHorizon = enable; }
    bool isUltraHorizonEnabled() { return g_ultraHorizon; }

    void toggleFirstPersonCam()
    {
        g_firstPersonCam = !g_firstPersonCam;
    }

    void toggleBulletTime(uint8_t *rdram)
    {
        g_bulletTime = !g_bulletTime;
        // CTimer::ms_fTimeStep (0x004CD110u): 1.0f = normal, 0.25f = slow-mo bullet time
        wrf(rdram, 0x004CD110u, g_bulletTime ? 0.25f : 1.0f);
    }

    void toggleNitro(uint8_t *rdram)
    {
        const uint32_t ped = rd32(rdram, kPlayerPed);
        if (!ped) return;
        const uint32_t veh = rd32(rdram, ped + kPedVehicle);
        if (!veh) return;

        // Apply forward rocket boost to car velocity vector
        float vx = rdf(rdram, veh + kCarVelocity);
        float vy = rdf(rdram, veh + kCarVelocity + 4);
        float vz = rdf(rdram, veh + kCarVelocity + 8);

        float speed = std::sqrt(vx * vx + vy * vy);
        if (speed < 0.01f)
        {
            vx = 0.4f;
            vy = 0.4f;
        }
        else
        {
            vx *= 1.45f;
            vy *= 1.45f;
        }

        wrf(rdram, veh + kCarVelocity, vx);
        wrf(rdram, veh + kCarVelocity + 4, vy);
        wrf(rdram, veh + kCarVelocity + 8, vz + 0.02f);
    }

    void spawnBodyguards(uint8_t *rdram)
    {
        const uint32_t ped = rd32(rdram, kPlayerPed);
        if (!ped) return;

        const float px = rdf(rdram, ped + 0x30);
        const float py = rdf(rdram, ped + 0x34);
        const float pz = rdf(rdram, ped + 0x38);

        const uint32_t pool = rd32(rdram, kPedPool);
        if (!pool) return;
        const uint32_t entries = rd32(rdram, pool);
        const int size = static_cast<int>(rd32(rdram, pool + 8));

        // Recruit 2 Vance Crime Family Henchmen
        int spawned = 0;
        for (int i = 1; i < std::min(size, 30) && spawned < 2; ++i)
        {
            const uint32_t guard = entries + i * 0x8D0u;
            if (guard != ped && guard)
            {
                wrf(rdram, guard + 0x30, px + (spawned == 0 ? 1.5f : -1.5f));
                wrf(rdram, guard + 0x34, py - 1.5f);
                wrf(rdram, guard + 0x38, pz);
                // Smart / Hood Outfit
                wr16(rdram, guard + 0x56, spawned == 0 ? 2 : 5);
                // Proofs
                wr32(rdram, guard + 0x484, 0xFFFFFFFFu);
                ++spawned;
            }
        }
    }

    std::string hudSpeedometer() { return g_speedometerStr; }
    std::string hudPrompt() { return g_hudPrompt; }

    void onGameFrame(uint8_t *rdram)
    {
        const uint32_t ped = rd32(rdram, kPlayerPed);
        if (!ped) return;

        // 1. Extreme Population Multipliers (GTA 6 Crowded City +1000%)
        if (g_gta6Pop)
        {
            wrf(rdram, kPedFactor, 4.0f);  // 10x pedestrian factor
            wrf(rdram, kCarFactor, 3.5f);  // 5x car factor
        }

        // 2. Ultra Draw Distance (1000% No-Fog Horizon)
        if (g_ultraHorizon)
        {
            wrf(rdram, kLodScale, 10.0f);
        }

        // 3. Unlimited Swimming (No Drowning & Faster Sprint)
        if (g_infiniteSwim)
        {
            // Set player health & stamina up in water
            wrf(rdram, ped + kPedHealth, std::max(rdf(rdram, ped + kPedHealth), 100.0f));
        }

        // 4. Vehicle Speedometer & Nitro Hotkey Check
        const uint32_t veh = rd32(rdram, ped + kPedVehicle);
        if (veh)
        {
            float vx = rdf(rdram, veh + kCarVelocity);
            float vy = rdf(rdram, veh + kCarVelocity + 4);
            float vz = rdf(rdram, veh + kCarVelocity + 8);
            float speedUnits = std::sqrt(vx * vx + vy * vy + vz * vz);
            g_currentSpeedKmh = speedUnits * 180.0f; // 1 unit/tick approx 50 m/s
            int kmh = static_cast<int>(g_currentSpeedKmh);
            int mph = static_cast<int>(g_currentSpeedKmh * 0.621371f);
            char sBuf[64];
            std::snprintf(sBuf, sizeof(sBuf), "%d km/h  |  %d mph  [NITRO: SHIFT]", kmh, mph);
            g_speedometerStr = sBuf;

            // Shift key triggers Nitro Boost
            if (platform::keyDown(platform::KEY_LEFT_SHIFT) || platform::keyDown(platform::KEY_RIGHT_SHIFT))
            {
                toggleNitro(rdram);
            }

            // Hydraulic Bunny Hop with Spacebar
            if (platform::keyPressed(' ') || platform::keyPressed(platform::KEY_KP_ENTER))
            {
                wrf(rdram, veh + kCarVelocity + 8, vz + 0.15f);
            }
        }
        else
        {
            g_speedometerStr.clear();
        }

        // 5. Bullet Time Hotkey Toggle (Caps Lock)
        if (platform::keyPressed(platform::KEY_LEFT_CONTROL) && platform::keyPressed('B'))
        {
            toggleBulletTime(rdram);
        }

        // 6. Bodyguards Hotkey (Press G on foot)
        if (platform::keyPressed('G') && !veh)
        {
            spawnBodyguards(rdram);
        }

        // 7. Strip Club Doorway Detection (Ocean Beach Pole Position Club)
        const float px = rdf(rdram, ped + 0x30);
        const float py = rdf(rdram, ped + 0x34);
        const float pz = rdf(rdram, ped + 0x38);

        const float distToClubExt = dist3D(px, py, pz, kClubExtX, kClubExtY, kClubExtZ);
        const float distToClubInt = dist3D(px, py, pz, kClubIntX, kClubIntY, kClubIntZ);
        const float distToVip = dist3D(px, py, pz, kVipBoothX, kVipBoothY, kVipBoothZ);

        g_hudPrompt.clear();

        if (!g_inClub && distToClubExt < 4.0f)
        {
            g_hudPrompt = "POLE POSITION CLUB : Entrer dans le Strip Club [Appuyer sur E]";
            if (platform::keyPressed('E'))
            {
                g_inClub = true;
                wrf(rdram, ped + 0x30, kClubIntX);
                wrf(rdram, ped + 0x34, kClubIntY);
                wrf(rdram, ped + 0x38, kClubIntZ);
            }
        }
        else if (g_inClub && distToClubInt < 4.0f)
        {
            g_hudPrompt = "POLE POSITION CLUB : Sortir vers Ocean Beach [Appuyer sur E]";
            if (platform::keyPressed('E'))
            {
                g_inClub = false;
                wrf(rdram, ped + 0x30, kClubExtX + 2.0f);
                wrf(rdram, ped + 0x34, kClubExtY);
                wrf(rdram, ped + 0x38, kClubExtZ);
            }
        }
        else if (g_inClub && distToVip < 4.0f && !g_privateDance)
        {
            g_hudPrompt = "SALON VIP : Payer $50 pour une Danse Privee [Appuyer sur E]";
            if (platform::keyPressed('E'))
            {
                startPrivateDance(rdram);
            }
        }

        // 8. Cinematic VIP Lap Dance Sequence
        if (g_privateDance)
        {
            g_danceTimer += 0.016f;
            g_hudPrompt = "DANSE PRIVEE VIP (VCS+)  -  Satisfaction +100%  -  [Espace pour Quitter]";

            if (platform::keyPressed(' '))
            {
                stopPrivateDance(rdram);
            }

            if (g_danceTimer > 4.0f)
            {
                g_danceTimer = 0.0f;
                g_camAngle = (g_camAngle + 1) % 4;
            }

            float camX = kVipBoothX;
            float camY = kVipBoothY;
            float camZ = kVipBoothZ + 1.2f;

            switch (g_camAngle)
            {
            case 0: camX += 1.8f; camY -= 1.2f; camZ = kVipBoothZ + 0.5f; break;
            case 1: camX += 0.8f; camY += 1.6f; camZ = kVipBoothZ + 1.1f; break;
            case 2: camX -= 1.6f; camY -= 1.0f; camZ = kVipBoothZ + 1.4f; break;
            case 3: camX += 0.2f; camY -= 1.9f; camZ = kVipBoothZ + 1.3f; break;
            }

            wrf(rdram, kCamera + 0x30, camX);
            wrf(rdram, kCamera + 0x34, camY);
            wrf(rdram, kCamera + 0x38, camZ);
        }

        // 9. First-Person Cockpit Camera
        if (g_firstPersonCam && veh)
        {
            wrf(rdram, kCamera + 0x30, px + 0.2f);
            wrf(rdram, kCamera + 0x34, py + 0.1f);
            wrf(rdram, kCamera + 0x38, pz + 0.85f);
        }
    }
}
