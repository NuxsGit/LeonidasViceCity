package com.leonidas.vicecity;

import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

public class GameActivity extends AppCompatActivity implements SurfaceHolder.Callback {

    static {
        System.loadLibrary("leonidas_native");
    }

    private SurfaceView gameSurface;
    private TouchControllerView touchController;
    private String romPath;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Keep screen on and hide system bars
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemUI();

        setContentView(R.layout.activity_game);

        gameSurface = findViewById(R.id.gameSurface);
        touchController = findViewById(R.id.touchController);

        gameSurface.getHolder().addCallback(this);

        Intent intent = getIntent();
        romPath = intent.getStringExtra("ROM_PATH");
        boolean hdRemake = intent.getBooleanExtra("HD_REMAKE", true);
        boolean showTouch = intent.getBooleanExtra("TOUCH_CONTROLLER", true);
        float touchOpacity = intent.getFloatExtra("TOUCH_OPACITY", 0.75f);
        boolean haptic = intent.getBooleanExtra("HAPTIC", true);

        touchController.setVisibility(showTouch ? View.VISIBLE : View.GONE);
        touchController.setControllerOpacity(touchOpacity);
        touchController.setHapticEnabled(haptic);

        // Configure graphics
        nativeSetGraphicsSettings(hdRemake ? 4 : 1, hdRemake ? 4 : 1, hdRemake);

        // Pass ROM descriptor or path
        if (romPath != null && romPath.startsWith("content://")) {
            try {
                AssetFileDescriptor afd = getContentResolver().openAssetFileDescriptor(Uri.parse(romPath), "r");
                if (afd != null) {
                    int fd = afd.getParcelFileDescriptor().detachFd();
                    nativeSetRomFd(fd);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else if (romPath != null) {
            nativeSetRomPath(romPath);
        }
    }

    private void hideSystemUI() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
            );
        }
    }

    @Override
    public void surfaceCreated(@NonNull SurfaceHolder holder) {
        nativeSetSurface(holder.getSurface());
        nativeStartEngine();
    }

    @Override
    public void surfaceChanged(@NonNull SurfaceHolder holder, int format, int width, int height) {
        nativeResizeSurface(width, height);
    }

    @Override
    public void surfaceDestroyed(@NonNull SurfaceHolder holder) {
        nativePauseEngine();
        nativeSetSurface(null);
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUI();
        nativeResumeEngine();
    }

    @Override
    protected void onPause() {
        super.onPause();
        nativePauseEngine();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        nativeStopEngine();
    }

    // Native C++ JNI Methods
    public static native void nativeSetRomPath(String path);
    public static native void nativeSetRomFd(int fd);
    public static native void nativeSetGraphicsSettings(int scale, int msaa, boolean postfx);
    public static native void nativeSetSurface(Surface surface);
    public static native void nativeResizeSurface(int width, int height);
    public static native void nativeStartEngine();
    public static native void nativeResumeEngine();
    public static native void nativePauseEngine();
    public static native void nativeStopEngine();
}
