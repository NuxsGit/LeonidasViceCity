#pragma once

#include <cstdint>
#include <string>

namespace vcs::plus
{
    // Initializes VCS+ Community Mod systems
    void init();

    // Called on every game frame kick from markFrameKick in vcs_overrides.cpp
    void onGameFrame(uint8_t *rdram);

    // Feature Toggles & Controls
    void toggleNitro(uint8_t *rdram);
    void toggleBulletTime(uint8_t *rdram);
    void toggleFirstPersonCam();
    void spawnBodyguards(uint8_t *rdram);

    // Pole Position Strip Club & VIP Lap Dance
    void startPrivateDance(uint8_t *rdram);
    void stopPrivateDance(uint8_t *rdram);
    bool isPrivateDanceActive();

    // Extreme Population & Draw Distance
    void setGta6Population(bool enable);
    bool isGta6PopulationEnabled();
    void setUltraHorizon(bool enable);
    bool isUltraHorizonEnabled();

    // Get current HUD speedometer and prompt strings
    std::string hudSpeedometer();
    std::string hudPrompt();
}
