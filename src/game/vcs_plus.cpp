#include "game/vcs_plus.h"

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

        // Coordinates: Pole Position Club (Ocean Beach Strip Club)
        constexpr float kClubExtX = 482.0f;
        constexpr float kClubExtY = -1380.0f;
        constexpr float kClubExtZ = 10.0f;

        constexpr float kClubIntX = -1004.0f;
        constexpr float kClubIntY = -1435.0f;
        constexpr float kClubIntZ = 12.0f;

        constexpr float kVipBoothX = -1008.0f;
        constexpr float kVipBoothY = -1440.0f;
        constexpr float kVipBoothZ = 12.0f;

        bool g_gta6Pop = true;       // +1000% population mode
        bool g_ultraHorizon = true;  // 1000% draw distance mode
        bool g_inClub = false;
        bool g_privateDance = false;
        float g_danceTimer = 0.0f;
        int g_camAngle = 0;
        std::string g_hudPrompt;

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
    }

    bool isPrivateDanceActive()
    {
        return g_privateDance;
    }

    void startPrivateDance(uint8_t *rdram)
    {
        g_privateDance = true;
        g_danceTimer = 0.0f;
        g_camAngle = 0;

        const uint32_t ped = rd32(rdram, kPlayerPed);
        if (ped)
        {
            // Position player comfortably in VIP booth
            wrf(rdram, ped + 0x30, kVipBoothX);
            wrf(rdram, ped + 0x34, kVipBoothY);
            wrf(rdram, ped + 0x38, kVipBoothZ);

            // Deduct $50 dance fee
            int money = static_cast<int>(rd32(rdram, kMoney));
            if (money >= 50)
                wr32(rdram, kMoney, static_cast<uint32_t>(money - 50));

            // Max out health and armour (VIP Satisfaction)
            wrf(rdram, ped + 0x4E4, 100.0f);
            wrf(rdram, ped + 0x4E8, 100.0f);
        }
    }

    void stopPrivateDance(uint8_t *rdram)
    {
        g_privateDance = false;
        g_danceTimer = 0.0f;
    }

    void setGta6Population(bool enable)
    {
        g_gta6Pop = enable;
    }

    bool isGta6PopulationEnabled()
    {
        return g_gta6Pop;
    }

    void setUltraHorizon(bool enable)
    {
        g_ultraHorizon = enable;
    }

    bool isUltraHorizonEnabled()
    {
        return g_ultraHorizon;
    }

    std::string hudPrompt()
    {
        return g_hudPrompt;
    }

    void onGameFrame(uint8_t *rdram)
    {
        const uint32_t ped = rd32(rdram, kPlayerPed);
        if (!ped)
            return;

        // 1. Extreme Population Multipliers (GTA 6 Crowded City +1000%)
        if (g_gta6Pop)
        {
            // Ped factor: default 0.4 -> x10 = 4.0
            wrf(rdram, kPedFactor, 4.0f);
            // Car factor: default 0.7 -> x5 = 3.5
            wrf(rdram, kCarFactor, 3.5f);
        }

        // 2. Ultra Draw Distance (1000% No-Fog Horizon)
        if (g_ultraHorizon)
        {
            wrf(rdram, kLodScale, 10.0f);
        }

        const float px = rdf(rdram, ped + 0x30);
        const float py = rdf(rdram, ped + 0x34);
        const float pz = rdf(rdram, ped + 0x38);

        // 3. Strip Club Doorway Detection (Ocean Beach Pole Position Club)
        const float distToClubExt = dist3D(px, py, pz, kClubExtX, kClubExtY, kClubExtZ);
        const float distToClubInt = dist3D(px, py, pz, kClubIntX, kClubIntY, kClubIntZ);
        const float distToVip = dist3D(px, py, pz, kVipBoothX, kVipBoothY, kVipBoothZ);

        g_hudPrompt.clear();

        if (!g_inClub && distToClubExt < 4.0f)
        {
            g_hudPrompt = "POLE POSITION CLUB : Entrer dans le Strip Club [Appuyer sur E ou F5]";
        }
        else if (g_inClub && distToClubInt < 4.0f)
        {
            g_hudPrompt = "POLE POSITION CLUB : Sortir vers Ocean Beach [Appuyer sur E ou F5]";
        }
        else if (g_inClub && distToVip < 4.0f && !g_privateDance)
        {
            g_hudPrompt = "SALON VIP : Payer $50 pour une Danse Privee [Appuyer sur E ou F5]";
        }

        // 4. Cinematic VIP Lap Dance Sequence
        if (g_privateDance)
        {
            g_danceTimer += 0.016f;
            g_hudPrompt = "DANSE PRIVEE VIP (VCS+)  -  Satisfaction +100%  -  [Espace / B pour Quitter]";

            // Cycle camera angles every 4 seconds
            if (g_danceTimer > 4.0f)
            {
                g_danceTimer = 0.0f;
                g_camAngle = (g_camAngle + 1) % 4;
            }

            // Cinematic camera offsets around VIP booth
            float camX = kVipBoothX;
            float camY = kVipBoothY;
            float camZ = kVipBoothZ + 1.2f;

            switch (g_camAngle)
            {
            case 0: // Low angle upward cinematic view
                camX += 1.8f;
                camY -= 1.2f;
                camZ = kVipBoothZ + 0.5f;
                break;
            case 1: // Close-up frontal view with neon glow
                camX += 0.8f;
                camY += 1.6f;
                camZ = kVipBoothZ + 1.1f;
                break;
            case 2: // Dynamic side orbit
                camX -= 1.6f;
                camY -= 1.0f;
                camZ = kVipBoothZ + 1.4f;
                break;
            case 3: // Over-the-shoulder POV angle
                camX += 0.2f;
                camY -= 1.9f;
                camZ = kVipBoothZ + 1.3f;
                break;
            }

            wrf(rdram, kCamera + 0x30, camX);
            wrf(rdram, kCamera + 0x34, camY);
            wrf(rdram, kCamera + 0x38, camZ);
        }
    }
}
