// Leonidas Vice City Stories - Android Native Runtime Bridge
// Connects Android on-screen touch gamepad and touchscreen input to PS2Pad.

#if defined(__ANDROID__)

#include <android/log.h>
#include <atomic>
#include <cstdint>

#define LOG_TAG "ps2x_android"

namespace vcs::android
{
    struct TouchPadState
    {
        uint32_t buttons = 0;
        float leftX = 0.0f;
        float leftY = 0.0f;
        float rightX = 0.0f;
        float rightY = 0.0f;
    };

    static std::atomic<TouchPadState> s_state{};

    void setPadState(uint32_t buttons, float lx, float ly, float rx, float ry)
    {
        TouchPadState st{buttons, lx, ly, rx, ry};
        s_state.store(st, std::memory_order_relaxed);
    }

    TouchPadState getPadState()
    {
        return s_state.load(std::memory_order_relaxed);
    }
}

extern "C" void getAndroidPadState(uint32_t &buttons, float &alx, float &aly, float &arx, float &ary)
{
    auto st = vcs::android::getPadState();
    buttons = st.buttons;
    alx = st.leftX;
    aly = st.leftY;
    arx = st.rightX;
    ary = st.rightY;
}

#endif // __ANDROID__
