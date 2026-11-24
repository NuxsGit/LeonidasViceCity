#pragma once

#include <cstdint>
#include <string>

namespace vcs::multiplayer
{
    // Initializes the local UDP client socket and reads environment (LVCS_MP_SESSION, LVCS_MP_ROLE, etc.)
    void init();

    // Called on every game frame boundary from markFrameKick in vcs_overrides.cpp
    void onGameFrame(uint8_t *rdram);

    // Checks if this game process was launched in multiplayer mode
    bool isActive();

    // Returns current multiplayer status text
    std::string status();

    // Shuts down networking
    void shutdown();
}
