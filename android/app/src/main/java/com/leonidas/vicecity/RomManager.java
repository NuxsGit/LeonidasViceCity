package com.leonidas.vicecity;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import androidx.documentfile.provider.DocumentFile;
import java.io.File;

public class RomManager {
    private static final String PREFS_NAME = "leonidas_prefs";
    private static final String KEY_ROM_PATH = "rom_path";
    private static final String KEY_ROM_NAME = "rom_name";

    private final Context context;
    private final SharedPreferences prefs;

    public RomManager(Context context) {
        this.context = context.getApplicationContext();
        this.prefs = this.context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public void saveRom(String path, String displayName) {
        prefs.edit()
            .putString(KEY_ROM_PATH, path)
            .putString(KEY_ROM_NAME, displayName)
            .apply();
    }

    public String getRomPath() {
        return prefs.getString(KEY_ROM_PATH, null);
    }

    public String getRomName() {
        return prefs.getString(KEY_ROM_NAME, "Aucune ROM sélectionnée");
    }

    public boolean hasValidRom() {
        String path = getRomPath();
        if (path == null || path.isEmpty()) return false;
        if (path.startsWith("content://")) {
            try {
                DocumentFile file = DocumentFile.fromSingleUri(context, Uri.parse(path));
                return file != null && file.exists() && file.length() > 100 * 1024 * 1024; // > 100MB
            } catch (Exception e) {
                return false;
            }
        }
        File f = new File(path);
        return f.exists() && f.isFile() && f.length() > 100 * 1024 * 1024;
    }
}
