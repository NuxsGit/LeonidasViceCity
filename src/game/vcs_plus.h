#pragma once

#include <cstdint>
#include <string>

namespace vcs::plus
{
    // Initializes VCS+ Mod systems
    void init();

    // Called on every game frame kick from markFrameKick in vcs_overrides.cpp
    void onGameFrame(uint8_t *rdram);

    // Activates or toggles Pole Position Club VIP Lap Dance
    void startPrivateDance(uint8_t *rdram);
    void stopPrivateDance(uint8_t *rdram);
    bool isPrivateDanceActive();

    // Sets extreme population (+1000% GTA 6 crowded city mode)
    void setGta6Population(bool enable);
    bool isGta6PopulationEnabled();

    // Sets ultra draw distance / map expansion (1000% no-fog horizon)
    void setUltraHorizon(bool enable);
    bool isUltraHorizonEnabled();

    // Get current status notification string for HUD
    std::string hudPrompt();
}
