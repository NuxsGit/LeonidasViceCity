package com.leonidas.vicecity;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;

public class TouchControllerView extends View {

    // PS2 Controller bitmask constants matching ps2_pad
    public static final int BTN_SELECT   = 1 << 0;
    public static final int BTN_L3       = 1 << 1;
    public static final int BTN_R3       = 1 << 2;
    public static final int BTN_START    = 1 << 3;
    public static final int BTN_DPAD_UP  = 1 << 4;
    public static final int BTN_DPAD_R   = 1 << 5;
    public static final int BTN_DPAD_DN  = 1 << 6;
    public static final int BTN_DPAD_L   = 1 << 7;
    public static final int BTN_L2       = 1 << 8;
    public static final int BTN_R2       = 1 << 9;
    public static final int BTN_L1       = 1 << 10;
    public static final int BTN_R1       = 1 << 11;
    public static final int BTN_TRIANGLE = 1 << 12;
    public static final int BTN_CIRCLE   = 1 << 13;
    public static final int BTN_CROSS    = 1 << 14;
    public static final int BTN_SQUARE   = 1 << 15;

    private int activeButtons = 0;
    private float stickX = 0f, stickY = 0f;
    private float rightStickX = 0f, rightStickY = 0f;

    private boolean hapticEnabled = true;
    private float controllerOpacity = 0.75f;

    private final Paint paintNormal = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint paintPressed = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint paintBorder = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint paintText = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint paintGlow = new Paint(Paint.ANTI_ALIAS_FLAG);

    private Vibrator vibrator;

    // Layout elements
    private float stickCenterX = 0f, stickCenterY = 0f, stickRadius = 120f;
    private float stickThumbX = 0f, stickThumbY = 0f, thumbRadius = 55f;
    private int stickPointerId = -1;

    // Action buttons (Cross, Circle, Square, Triangle)
    private final RectF btnCross = new RectF();
    private final RectF btnCircle = new RectF();
    private final RectF btnSquare = new RectF();
    private final RectF btnTriangle = new RectF();

    // Shoulders
    private final RectF btnL1 = new RectF();
    private final RectF btnR1 = new RectF();
    private final RectF btnL2 = new RectF();
    private final RectF btnR2 = new RectF();

    // D-Pad
    private final RectF dpadUp = new RectF();
    private final RectF dpadDown = new RectF();
    private final RectF dpadLeft = new RectF();
    private final RectF dpadRight = new RectF();

    // System
    private final RectF btnStart = new RectF();
    private final RectF btnSelect = new RectF();

    public TouchControllerView(Context context) {
        super(context);
        init();
    }

    public TouchControllerView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);

        paintNormal.setColor(Color.argb(100, 20, 10, 26));
        paintNormal.setStyle(Paint.Style.FILL);

        paintPressed.setColor(Color.argb(180, 237, 30, 121)); // Neon Pink
        paintPressed.setStyle(Paint.Style.FILL);

        paintBorder.setColor(Color.argb(160, 41, 171, 226)); // Vice Cyan
        paintBorder.setStyle(Paint.Style.STROKE);
        paintBorder.setStrokeWidth(3.5f);

        paintText.setColor(Color.WHITE);
        paintText.setTextAlign(Paint.Align.CENTER);
        paintText.setTextSize(32f);
        paintText.setFakeBoldText(true);

        paintGlow.setColor(Color.argb(60, 237, 30, 121));
        paintGlow.setStyle(Paint.Style.STROKE);
        paintGlow.setStrokeWidth(6f);
    }

    public void setControllerOpacity(float opacity) {
        this.controllerOpacity = Math.max(0.1f, Math.min(1.0f, opacity));
        setAlpha(this.controllerOpacity);
        invalidate();
    }

    public void setHapticEnabled(boolean enabled) {
        this.hapticEnabled = enabled;
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);

        float density = getResources().getDisplayMetrics().density;
        float btnSize = 58f * density;
        float pad = 24f * density;

        // Virtual Left Analog Stick
        stickCenterX = pad + stickRadius + 10f * density;
        stickCenterY = h - pad - stickRadius - 10f * density;
        stickThumbX = stickCenterX;
        stickThumbY = stickCenterY;

        // D-Pad placed above or beside stick
        float dpadCenterY = stickCenterY - stickRadius - 60f * density;
        float dpadCenterX = stickCenterX;
        float dSize = 42f * density;
        dpadUp.set(dpadCenterX - dSize / 2, dpadCenterY - dSize * 1.3f, dpadCenterX + dSize / 2, dpadCenterY - dSize * 0.3f);
        dpadDown.set(dpadCenterX - dSize / 2, dpadCenterY + dSize * 0.3f, dpadCenterX + dSize / 2, dpadCenterY + dSize * 1.3f);
        dpadLeft.set(dpadCenterX - dSize * 1.3f, dpadCenterY - dSize / 2, dpadCenterX - dSize * 0.3f, dpadCenterY + dSize / 2);
        dpadRight.set(dpadCenterX + dSize * 0.3f, dpadCenterY - dSize / 2, dpadCenterX + dSize * 1.3f, dpadCenterY + dSize / 2);

        // Right Action Cluster (Cross, Circle, Square, Triangle)
        float clusterCenterX = w - pad - btnSize * 1.5f;
        float clusterCenterY = h - pad - btnSize * 1.5f;
        float spread = btnSize * 1.15f;

        btnCross.set(clusterCenterX - btnSize / 2, clusterCenterY + spread - btnSize / 2,
                     clusterCenterX + btnSize / 2, clusterCenterY + spread + btnSize / 2);
        btnTriangle.set(clusterCenterX - btnSize / 2, clusterCenterY - spread - btnSize / 2,
                        clusterCenterX + btnSize / 2, clusterCenterY - spread + btnSize / 2);
        btnSquare.set(clusterCenterX - spread - btnSize / 2, clusterCenterY - btnSize / 2,
                      clusterCenterX - spread + btnSize / 2, clusterCenterY + btnSize / 2);
        btnCircle.set(clusterCenterX + spread - btnSize / 2, clusterCenterY - btnSize / 2,
                      clusterCenterX + spread + btnSize / 2, clusterCenterY + btnSize / 2);

        // Shoulders
        float shW = 75f * density, shH = 42f * density;
        btnL1.set(pad, pad + 10f * density, pad + shW, pad + 10f * density + shH);
        btnL2.set(pad, pad + 60f * density, pad + shW, pad + 60f * density + shH);

        btnR1.set(w - pad - shW, pad + 10f * density, w - pad, pad + 10f * density + shH);
        btnR2.set(w - pad - shW, pad + 60f * density, w - pad, pad + 60f * density + shH);

        // Start & Select
        float sysW = 60f * density, sysH = 32f * density;
        btnSelect.set(w * 0.38f - sysW / 2, h - pad - sysH, w * 0.38f + sysW / 2, h - pad);
        btnStart.set(w * 0.62f - sysW / 2, h - pad - sysH, w * 0.62f + sysW / 2, h - pad);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        // 1. Left Analog Stick Base & Thumb
        canvas.drawCircle(stickCenterX, stickCenterY, stickRadius, paintNormal);
        canvas.drawCircle(stickCenterX, stickCenterY, stickRadius, paintBorder);
        canvas.drawCircle(stickThumbX, stickThumbY, thumbRadius,
                          (stickPointerId != -1) ? paintPressed : paintNormal);
        canvas.drawCircle(stickThumbX, stickThumbY, thumbRadius, paintBorder);

        // 2. D-Pad
        drawButton(canvas, dpadUp, "▲", (activeButtons & BTN_DPAD_UP) != 0);
        drawButton(canvas, dpadDown, "▼", (activeButtons & BTN_DPAD_DN) != 0);
        drawButton(canvas, dpadLeft, "◀", (activeButtons & BTN_DPAD_L) != 0);
        drawButton(canvas, dpadRight, "▶", (activeButtons & BTN_DPAD_R) != 0);

        // 3. Action Buttons
        drawCircleButton(canvas, btnCross, "✕", (activeButtons & BTN_CROSS) != 0, Color.rgb(41, 171, 226));
        drawCircleButton(canvas, btnCircle, "○", (activeButtons & BTN_CIRCLE) != 0, Color.rgb(237, 30, 121));
        drawCircleButton(canvas, btnSquare, "□", (activeButtons & BTN_SQUARE) != 0, Color.rgb(252, 238, 33));
        drawCircleButton(canvas, btnTriangle, "△", (activeButtons & BTN_TRIANGLE) != 0, Color.rgb(46, 204, 113));

        // 4. Shoulders
        drawRoundedButton(canvas, btnL1, "L1", (activeButtons & BTN_L1) != 0);
        drawRoundedButton(canvas, btnL2, "L2", (activeButtons & BTN_L2) != 0);
        drawRoundedButton(canvas, btnR1, "R1", (activeButtons & BTN_R1) != 0);
        drawRoundedButton(canvas, btnR2, "R2", (activeButtons & BTN_R2) != 0);

        // 5. System
        drawRoundedButton(canvas, btnSelect, "SELECT", (activeButtons & BTN_SELECT) != 0);
        drawRoundedButton(canvas, btnStart, "START", (activeButtons & BTN_START) != 0);
    }

    private void drawButton(Canvas canvas, RectF r, String label, boolean pressed) {
        canvas.drawRoundRect(r, 12f, 12f, pressed ? paintPressed : paintNormal);
        canvas.drawRoundRect(r, 12f, 12f, paintBorder);
        canvas.drawText(label, r.centerX(), r.centerY() + 10f, paintText);
    }

    private void drawCircleButton(Canvas canvas, RectF r, String label, boolean pressed, int colorGlint) {
        paintBorder.setColor(pressed ? colorGlint : Color.argb(160, 41, 171, 226));
        canvas.drawCircle(r.centerX(), r.centerY(), r.width() / 2f, pressed ? paintPressed : paintNormal);
        canvas.drawCircle(r.centerX(), r.centerY(), r.width() / 2f, paintBorder);
        canvas.drawText(label, r.centerX(), r.centerY() + 11f, paintText);
    }

    private void drawRoundedButton(Canvas canvas, RectF r, String label, boolean pressed) {
        canvas.drawRoundRect(r, 14f, 14f, pressed ? paintPressed : paintNormal);
        canvas.drawRoundRect(r, 14f, 14f, paintBorder);
        paintText.setTextSize(24f);
        canvas.drawText(label, r.centerX(), r.centerY() + 8f, paintText);
        paintText.setTextSize(32f);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        int action = event.getActionMasked();
        int pointerIndex = event.getActionIndex();
        int pointerId = event.getPointerId(pointerIndex);

        int prevButtons = activeButtons;
        activeButtons = 0;

        int pointerCount = event.getPointerCount();
        for (int p = 0; p < pointerCount; ++p) {
            int id = event.getPointerId(p);
            float x = event.getX(p);
            float y = event.getY(p);

            // Handle virtual analog stick
            if (id == stickPointerId) {
                if (action == MotionEvent.ACTION_UP || (action == MotionEvent.ACTION_POINTER_UP && p == pointerIndex)) {
                    stickPointerId = -1;
                    stickThumbX = stickCenterX;
                    stickThumbY = stickCenterY;
                    stickX = 0f;
                    stickY = 0f;
                } else {
                    updateStick(x, y);
                }
                continue;
            }

            // Check if touch starts on stick
            if (stickPointerId == -1 && Math.hypot(x - stickCenterX, y - stickCenterY) <= stickRadius * 1.3f) {
                if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_POINTER_DOWN) {
                    stickPointerId = id;
                    updateStick(x, y);
                    vibrate();
                    continue;
                }
            }

            // Check action buttons
            if (btnCross.contains(x, y)) activeButtons |= BTN_CROSS;
            if (btnCircle.contains(x, y)) activeButtons |= BTN_CIRCLE;
            if (btnSquare.contains(x, y)) activeButtons |= BTN_SQUARE;
            if (btnTriangle.contains(x, y)) activeButtons |= BTN_TRIANGLE;

            // Check D-Pad
            if (dpadUp.contains(x, y)) activeButtons |= BTN_DPAD_UP;
            if (dpadDown.contains(x, y)) activeButtons |= BTN_DPAD_DN;
            if (dpadLeft.contains(x, y)) activeButtons |= BTN_DPAD_L;
            if (dpadRight.contains(x, y)) activeButtons |= BTN_DPAD_R;

            // Check Shoulders
            if (btnL1.contains(x, y)) activeButtons |= BTN_L1;
            if (btnL2.contains(x, y)) activeButtons |= BTN_L2;
            if (btnR1.contains(x, y)) activeButtons |= BTN_R1;
            if (btnR2.contains(x, y)) activeButtons |= BTN_R2;

            // System
            if (btnStart.contains(x, y)) activeButtons |= BTN_START;
            if (btnSelect.contains(x, y)) activeButtons |= BTN_SELECT;
        }

        // Trigger vibration if newly pressed buttons
        if ((activeButtons & ~prevButtons) != 0) {
            vibrate();
        }

        // Send state to native runtime
        nativeSendPadState(activeButtons, stickX, stickY, rightStickX, rightStickY);

        invalidate();
        return true;
    }

    private void updateStick(float x, float y) {
        float dx = x - stickCenterX;
        float dy = y - stickCenterY;
        float dist = (float) Math.hypot(dx, dy);
        float maxDist = stickRadius * 0.85f;

        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        stickThumbX = stickCenterX + dx;
        stickThumbY = stickCenterY + dy;

        stickX = dx / maxDist;
        stickY = dy / maxDist;

        // Apply deadzone
        if (Math.abs(stickX) < 0.12f) stickX = 0f;
        if (Math.abs(stickY) < 0.12f) stickY = 0f;
    }

    private void vibrate() {
        if (!hapticEnabled || vibrator == null || !vibrator.hasVibrator()) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK));
            } else {
                vibrator.vibrate(25);
            }
        } catch (Exception ignored) {}
    }

    // JNI Native methods implemented in native_bridge.cpp
    public static native void nativeSendPadState(int buttons, float lx, float ly, float rx, float ry);
}
