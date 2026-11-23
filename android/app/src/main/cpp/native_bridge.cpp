// Leonidas Vice City Stories - Android JNI Bridge
// Connects Android Touch Gamepad Controller and Activity lifecycle to the PS2 native recompiler.

#include <jni.h>
#include <android/log.h>
#include <android/native_window.h>
#include <android/native_window_jni.h>

#include <atomic>
#include <string>
#include <cstdlib>

#define LOG_TAG "LeonidasNative"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace
{
    std::string g_romPath;
    int g_romFd = -1;
    ANativeWindow *g_nativeWindow = nullptr;
    std::atomic<bool> g_engineRunning{false};
    std::atomic<bool> g_enginePaused{false};

    // Gamepad controller state
    struct PadState
    {
        uint32_t buttons = 0;
        float leftX = 0.0f;
        float leftY = 0.0f;
        float rightX = 0.0f;
        float rightY = 0.0f;
    };
    std::atomic<PadState> g_padState{};

    // Graphics settings
    int g_scale = 4;
    int g_msaa = 4;
    bool g_postFx = true;
}

extern "C" {

JNIEXPORT void JNICALL
Java_com_leonidas_vicecity_TouchControllerView_nativeSendPadState(
    JNIEnv *, jclass, jint buttons, jfloat lx, jfloat ly, jfloat rx, jfloat ry)
{
    PadState state;
    state.buttons = static_cast<uint32_t>(buttons);
    state.leftX = lx;
    state.leftY = ly;
    state.rightX = rx;
    state.rightY = ry;
    g_padState.store(state, std::memory_order_relaxed);
}

JNIEXPORT void JNICALL
Java_com_leonidas_vicecity_GameActivity_nativeSetRomPath(
    JNIEnv *env, jclass, jstring path)
{
    if (path != nullptr)
    {
        const char *nativePath = env->GetStringUTFChars(path, nullptr);
        g_romPath = nativePath ? nativePath : "";
        env->ReleaseStringUTFChars(path, nativePath);
        LOGI("ROM Path configured: %s", g_romPath.c_str());
    }
}

JNIEXPORT void JNICALL
Java_com_leonidas_vicecity_GameActivity_nativeSetRomFd(
    JNIEnv *, jclass, jint fd)
{
    g_romFd = fd;
    LOGI("ROM File Descriptor configured: %d", g_romFd);
}

JNIEXPORT void JNICALL
Java_com_leonidas_vicecity_GameActivity_nativeSetGraphicsSettings(
    JNIEnv *, jclass, jint scale, jint msaa, jboolean postfx)
{
    g_scale = scale;
    g_msaa = msaa;
    g_postFx = postfx;

    setenv("PS2X_HW_SCALE", std::to_string(scale).c_str(), 1);
    setenv("PS2X_HW_MSAA", std::to_string(msaa).c_str(), 1);
    setenv("PS2X_HW_ANISO", "16", 1);
    setenv("LEONIDAS_POSTFX", postfx ? "1" : "0", 1);

    LOGI("Configured graphics: scale=%d, msaa=%d, postfx=%d", scale, msaa, postfx ? 1 : 0);
}

JNIEXPORT void JNICALL
Java_com_leonidas_vicecity_GameActivity_nativeSetSurface(
    JNIEnv *env, jclass, jobject surface)
{
    if (g_nativeWindow != nullptr)
    {
        ANativeWindow_release(g_nativeWindow);
        g_nativeWindow = nullptr;
    }

    if (surface != nullptr)
    {
        g_nativeWindow = ANativeWindow_fromSurface(env, surface);
        LOGI("Native ANativeWindow initialized: %p", g_nativeWindow);
    }
}

JNIEXPORT void JNICALL
Java_com_leonidas_vicecity_GameActivity_nativeResizeSurface(
    JNIEnv *, jclass, jint width, jint height)
{
    LOGI("Surface resized: %dx%d", width, height);
}

JNIEXPORT void JNICALL
Java_com_leonidas_vicecity_GameActivity_nativeStartEngine(
    JNIEnv *, jclass)
{
    LOGI("Starting Leonidas PS2 Engine on Android...");
    g_engineRunning.store(true);
    g_enginePaused.store(false);
}

JNIEXPORT void JNICALL
Java_com_leonidas_vicecity_GameActivity_nativeResumeEngine(
    JNIEnv *, jclass)
{
    LOGI("Resuming Leonidas Engine...");
    g_enginePaused.store(false);
}

JNIEXPORT void JNICALL
Java_com_leonidas_vicecity_GameActivity_nativePauseEngine(
    JNIEnv *, jclass)
{
    LOGI("Pausing Leonidas Engine...");
    g_enginePaused.store(true);
}

JNIEXPORT void JNICALL
Java_com_leonidas_vicecity_GameActivity_nativeStopEngine(
    JNIEnv *, jclass)
{
    LOGI("Stopping Leonidas Engine...");
    g_engineRunning.store(false);
    if (g_nativeWindow != nullptr)
    {
        ANativeWindow_release(g_nativeWindow);
        g_nativeWindow = nullptr;
    }
}

} // extern "C"
