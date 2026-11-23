package com.leonidas.vicecity;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ImageView;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.documentfile.provider.DocumentFile;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.switchmaterial.SwitchMaterial;

public class MainActivity extends AppCompatActivity {

    private RomManager romManager;
    private TextView tvRomStatus;
    private TextView tvRomPath;
    private MaterialButton btnPlay;
    private MaterialButton btnChooseRom;
    private MaterialButton btnSettings;
    private ImageView ivMascot;

    private SharedPreferences prefs;

    private final ActivityResultLauncher<String[]> openDocumentLauncher =
        registerForActivityResult(new ActivityResultContracts.OpenDocument(), uri -> {
            if (uri != null) {
                try {
                    getContentResolver().takePersistableUriPermission(
                        uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                } catch (Exception ignored) {}

                DocumentFile file = DocumentFile.fromSingleUri(this, uri);
                String name = (file != null && file.getName() != null) ? file.getName() : uri.getLastPathSegment();
                romManager.saveRom(uri.toString(), name);
                updateRomDisplay();
                Toast.makeText(this, "ROM sélectionnée : " + name, Toast.LENGTH_SHORT).show();
            }
        });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        romManager = new RomManager(this);
        prefs = getSharedPreferences("leonidas_prefs", MODE_PRIVATE);

        tvRomStatus = findViewById(R.id.tvRomStatus);
        tvRomPath = findViewById(R.id.tvRomPath);
        btnPlay = findViewById(R.id.btnPlay);
        btnChooseRom = findViewById(R.id.btnChooseRom);
        btnSettings = findViewById(R.id.btnSettings);
        ivMascot = findViewById(R.id.ivMascot);

        updateRomDisplay();

        btnChooseRom.setOnClickListener(v -> pickRom());
        findViewById(R.id.cardRomSelector).setOnClickListener(v -> pickRom());

        btnPlay.setOnClickListener(v -> {
            if (!romManager.hasValidRom()) {
                Toast.makeText(this, "Veuillez d'abord sélectionner une ROM ISO de Vice City Stories !", Toast.LENGTH_LONG).show();
                pickRom();
                return;
            }

            Intent intent = new Intent(this, GameActivity.class);
            intent.putExtra("ROM_PATH", romManager.getRomPath());
            intent.putExtra("HD_REMAKE", prefs.getBoolean("hd_remake", true));
            intent.putExtra("TOUCH_CONTROLLER", prefs.getBoolean("touch_controller", true));
            intent.putExtra("TOUCH_OPACITY", prefs.getInt("touch_opacity", 75) / 100f);
            intent.putExtra("HAPTIC", prefs.getBoolean("touch_haptic", true));
            intent.putExtra("FPS_60", prefs.getBoolean("fps_60", true));
            startActivity(intent);
        });

        btnSettings.setOnClickListener(v -> showSettingsDialog());
    }

    private void pickRom() {
        openDocumentLauncher.launch(new String[]{"*/*", "application/x-iso9660-image", "application/octet-stream"});
    }

    private void updateRomDisplay() {
        if (romManager.hasValidRom()) {
            tvRomStatus.setText(getString(R.string.rom_status_ready, romManager.getRomName()));
            tvRomStatus.setTextColor(getResources().getColor(R.color.neon_cyan));
            tvRomPath.setText(romManager.getRomPath());
            btnPlay.setEnabled(true);
            btnPlay.setAlpha(1.0f);
        } else {
            tvRomStatus.setText(R.string.no_rom_selected);
            tvRomStatus.setTextColor(getResources().getColor(R.color.text_secondary));
            tvRomPath.setText("Touchez ici pour choisir le fichier ISO du jeu");
            btnPlay.setAlpha(0.85f);
        }
    }

    private void showSettingsDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_settings, null);

        SwitchMaterial swHd = dialogView.findViewById(R.id.switchHdRemake);
        SwitchMaterial swTouch = dialogView.findViewById(R.id.switchTouchControls);
        SwitchMaterial sw60 = dialogView.findViewById(R.id.switch60Fps);
        SwitchMaterial swHaptic = dialogView.findViewById(R.id.switchHaptic);
        SeekBar seekOpacity = dialogView.findViewById(R.id.seekOpacity);

        swHd.setChecked(prefs.getBoolean("hd_remake", true));
        swTouch.setChecked(prefs.getBoolean("touch_controller", true));
        sw60.setChecked(prefs.getBoolean("fps_60", true));
        swHaptic.setChecked(prefs.getBoolean("touch_haptic", true));
        seekOpacity.setProgress(prefs.getInt("touch_opacity", 75));

        new AlertDialog.Builder(this)
            .setView(dialogView)
            .setPositiveButton(R.string.close, (d, w) -> {
                prefs.edit()
                    .putBoolean("hd_remake", swHd.isChecked())
                    .putBoolean("touch_controller", swTouch.isChecked())
                    .putBoolean("fps_60", sw60.isChecked())
                    .putBoolean("touch_haptic", swHaptic.isChecked())
                    .putInt("touch_opacity", seekOpacity.getProgress())
                    .apply();
            })
            .show();
    }
}
