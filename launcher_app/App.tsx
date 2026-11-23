import { mount, signal } from "@nlayer/runtime";
import { View, Text, Scroll, Input } from "@nlayer/ui";

// Theme constants matching launcher/ui/theme.h exactly
const THEME = {
  night: "#0A0A0C",
  base: "#101014",
  surface: "#17171C",
  surfaceHi: "#1F1F26",
  surfaceTop: "#2A2A33",
  text: "#F8F4F6",
  dim: "#ADA6AC",
  faint: "#726B71",
  pink: "#ED1E79",       // Leonidas Mascot Hot Pink
  pinkHi: "#FF4C9D",     // Neon Pink highlight
  teal: "#29ABE2",       // Leonidas Electric Cyan
  amber: "#F7931E",      // Leonidas Sunset Gold
  red: "#F26868",
  green: "#00E676",
  border: "rgba(255, 255, 255, 0.08)",
  borderHi: "rgba(237, 30, 121, 0.35)",
  sky: "#150A1A",
  horizon: "#421235",
  skyline: "#0C060E"
};

function App() {
  // Navigation & Screens (home, mods, recompiler, settings, saves, game)
  const currentScreen = signal<"home" | "mods" | "recompiler" | "settings" | "saves" | "game">("home");
  const modFilter = signal<string>("ALL");

  // Disc & ISO Management
  const romPath = signal("/sdcard/Download/Grand Theft Auto - Vice City Stories.iso");
  const romId = signal("SLUS-21590 (USA v1.02)");
  const romSize = signal("4.12 GB");
  const isEditingPath = signal(false);
  const customPathInput = signal("");

  // Integrated Mods Registry (12 Mods)
  const masterHdRemake = signal(true);
  const modsList = signal([
    { id: "hd_remake_essentials", name: "Vice City HD Remake Essentials", category: "Visuals", enabled: true, desc: "Crystal clear timecycle, deep neon sunset lighting, high resolution particles and extended draw distance." },
    { id: "neon_vice_postfx", name: "Neon Vice PostFX & Color Grading", category: "Visuals", enabled: true, desc: "Cinematic synthwave 80s color saturation and vibrant sunset horizon bloom." },
    { id: "hd_hud_and_ui", name: "High-Definition HUD & Crisp Radar", category: "UI", enabled: true, desc: "Clean vector HUD elements, sharp minimap blips and widescreen radar alignment." },
    { id: "modern_pc_controls", name: "Modern PC Controls & Mouse Aim", category: "Controls", enabled: true, desc: "True WASD camera steering, raw mouse aim sensitivity and customizable keybinds." },
    { id: "extreme_city_life", name: "Extreme City Life & Traffic Density", category: "Gameplay", enabled: true, desc: "Quadrupled pedestrian population and realistic Miami vehicle traffic flow." },
    { id: "universal_gamepad", name: "Universal Gamepad Auto-Configuration", category: "Controls", enabled: true, desc: "Instant plug-and-play SDL mapping for DualShock, Xbox, Switch and generic controllers." },
    { id: "vcs_hd_remake_ultrawide", name: "Ultrawide 21:9 & 32:9 FOV Correction", category: "Visuals", enabled: true, desc: "Geometric aspect ratio fix eliminating horizontal character and HUD stretching." },
    { id: "modern_hd_handling", name: "Modern HD Vehicle Handling & Physics", category: "Gameplay", enabled: true, desc: "Responsive steering curves, reduced understeer, tuned suspension, and calibrated motorcycle & boat physics." },
    { id: "60fps_physics_and_timing", name: "60 FPS Physics & Timing Normalization", category: "Gameplay", enabled: true, desc: "Sub-frame delta time compensation, stabilized surface friction and smooth camera interpolation." },
    { id: "tactical_weapons_overhaul", name: "Tactical Weapons Overhaul & Ballistics", category: "Gameplay", enabled: true, desc: "Calibrated bullet velocities, authentic weapon ranges, damage falloff and tight mouse-aim gunplay." },
    { id: "extended_draw_distance", name: "Extended Draw Distance & Horizon LODs", category: "Visuals", enabled: true, desc: "Pushes far clipping plane to 3,200m, rendering distant islands across the bay with atmospheric horizon fog." },
    { id: "retro_synthwave_radio_enhancer", name: "Retro Synthwave Radio & Audio Dynamics", category: "Audio", enabled: true, desc: "Dynamic range acoustic profile with warm 80s analog curves for Flash FM, Wave 103 and VRock." }
  ]);

  // On-Device Static AOT Recompiler State
  const isRecompiling = signal(false);
  const isRecompiled = signal(false);
  const recompileProgress = signal(0);
  const recompileStage = signal("Ready for on-device AOT recompilation");
  const compiledFunctions = signal(11218);
  const compiledMicrocodes = signal(24);
  const cacheStatus = signal("Valid (recomp_cache.bin)");

  // Recompiler Real-time Diagnostics Logs
  const recompilerLogs = signal<string[]>([
    "[system] Initializing static AOT ARM64 recompiler runtime",
    "[iso] Disc mounted: SLUS_215.90 (LBA sectors: 2,108,432)",
    "[mips] EE address space mapped: 0x00100000 -> 0x003A0000",
    "[neon] SIMD vector translator sse2neon active (128-bit)",
    "[vfs] Virtual File System: 12 active mods mounted into cdrom0: overrides",
    "[status] Ready to compile Emotion Engine executable"
  ]);

  // Game Engine & TouchPort HUD State
  const inGameMenuOpen = signal(false);
  const playerHealth = signal(100);
  const playerArmor = signal(100);
  const playerCash = signal(248500);
  const wantedStars = signal(2);
  const gameTime = signal("12:45");
  const locationName = signal("OCEAN BEACH · OCEAN DRIVE");
  const activeWeaponIndex = signal(1);
  const lastControlAction = signal("Ready");

  // TouchPort HUD Configuration
  const controllerOpacity = signal(75);
  const autoSprintEnabled = signal(true);
  const floatingJoyEnabled = signal(true);
  const buttonScale = signal<"Normal" | "Large">("Normal");
  const hapticFeedback = signal(true);

  // Graphics & Engine Settings
  const hdRemasterEnabled = signal(true);
  const antiAliasing = signal("MSAA 4x");
  const fpsTarget = signal(60);
  const widescreenFix = signal(true);

  // Weapons list
  const weapons = [
    { name: "FISTS", type: "MELEE", ammo: "INFINITE", clip: "" },
    { name: "MICRO SMG", type: "SUB-MACHINE", ammo: "120", clip: "30" },
    { name: "PISTOL .45", type: "HANDGUN", ammo: "84", clip: "7" },
    { name: "KATANA", type: "MELEE", ammo: "INFINITE", clip: "" },
    { name: "M4 CARBINE", type: "RIFLE", ammo: "250", clip: "50" },
    { name: "ROCKET LAUNCHER", type: "HEAVY", ammo: "8", clip: "1" }
  ];

  // Standard ROM locations
  const presetRoms = [
    { label: "Download Directory (USA)", path: "/sdcard/Download/Grand Theft Auto - Vice City Stories.iso", id: "SLUS-21590" },
    { label: "Download Directory (EUR)", path: "/sdcard/Download/GTA_Vice_City_Stories_Europe.iso", id: "SLES-54622" },
    { label: "Emulated ROMs (PS2)", path: "/storage/emulated/0/ROMs/PS2/vcs.iso", id: "SLUS-21590" },
    { label: "Internal Storage Root", path: "/sdcard/vcs.iso", id: "SLUS-21590" }
  ];

  // Toggle Mod
  const toggleMod = (id: string) => {
    const list = modsList().map((m) => {
      if (m.id === id) {
        return { ...m, enabled: !m.enabled };
      }
      return m;
    });
    modsList.set(list);
  };

  // Toggle Master HD Remake Switch
  const toggleMasterHd = () => {
    const next = !masterHdRemake();
    masterHdRemake.set(next);
    const list = modsList().map((m) => {
      if (m.category === "Visuals" || m.category === "UI" || m.category === "Gameplay") {
        return { ...m, enabled: next };
      }
      return m;
    });
    modsList.set(list);
  };

  const activeModsCount = () => modsList().filter((m) => m.enabled).length;

  const filteredMods = () => {
    if (modFilter() === "ALL") return modsList();
    return modsList().filter((m) => m.category.toUpperCase() === modFilter());
  };

  // Execute Static AOT Recompilation Pipeline
  const runRecompilationPipeline = (thenLaunch = true) => {
    isRecompiling.set(true);
    recompileProgress.set(8);
    recompileStage.set("Phase 1/5: Parsing ISO volume descriptor and mounting VFS overrides...");

    const l1 = [...recompilerLogs()];
    l1.push("[recompile] Started static AOT recompilation pipeline");
    l1.push("[vfs] Applying Virtual File System overrides for 12 active mods");
    recompilerLogs.set(l1);

    setTimeout(() => {
      recompileProgress.set(32);
      recompileStage.set("Phase 2/5: Validating ELF32 MIPS R5900 Emotion Engine executable...");
      const l2 = [...recompilerLogs()];
      l2.push("[mips] ELF32 header verified (Machine=0x0008, Entry=0x00100008)");
      l2.push("[mips] Identified segments: .text (2,412 KB), .rodata (488 KB), .vutext (184 KB)");
      recompilerLogs.set(l2);

      setTimeout(() => {
        recompileProgress.set(64);
        recompileStage.set("Phase 3/5: Recompiling 11,218 MIPS Emotion Engine functions...");
        const l3 = [...recompilerLogs()];
        l3.push("[aot] Emitted 11,218 native ARM64 function execution blocks");
        l3.push("[aot] Branch prediction tables and direct register bindings resolved");
        recompilerLogs.set(l3);

        setTimeout(() => {
          recompileProgress.set(88);
          recompileStage.set("Phase 4/5: Translating 24 VU1 vector microprograms to ARM NEON...");
          const l4 = [...recompilerLogs()];
          l4.push("[vu1] Translated 24 MPG microprograms to 128-bit NEON vector operations");
          l4.push("[neon] Floating-point precision flags SSE2NEON_PRECISE enabled");
          recompilerLogs.set(l4);

          setTimeout(() => {
            recompileProgress.set(100);
            recompileStage.set("Phase 5/5: Compilation complete. Binary cache stored.");
            isRecompiled.set(true);
            isRecompiling.set(false);
            const l5 = [...recompilerLogs()];
            l5.push("[cache] Execution cache committed: recomp_cache.bin (3.8 MB)");
            l5.push("[status] Native Leonidas runtime ready for 60 FPS execution");
            recompilerLogs.set(l5);

            if (thenLaunch) {
              setTimeout(() => {
                currentScreen.set("game");
              }, 400);
            }
          }, 350);
        }, 350);
      }, 350);
    }, 350);
  };

  const handleAction = (name: string, type?: string) => {
    lastControlAction.set(name);
    if (type === "weapon_next") {
      activeWeaponIndex.set((activeWeaponIndex() + 1) % weapons.length);
    } else if (type === "weapon_prev") {
      activeWeaponIndex.set((activeWeaponIndex() - 1 + weapons.length) % weapons.length);
    }
  };

  const btnDiameter = () => (buttonScale() === "Large" ? 54 : 46);

  return (
    <View style={{ flex: 1, backgroundColor: THEME.night }}>
      {/* ============================================================== */}
      {/* DESKTOP-STYLE APP TITLE BAR                                    */}
      {/* ============================================================== */}
      {currentScreen() !== "game" && (
        <View
          style={{
            height: 48,
            backgroundColor: THEME.base,
            paddingHorizontal: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottomWidth: 1,
            borderBottomColor: THEME.border
          }}
        >
          {/* Brand & Alligator Monogram */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "rgba(237, 30, 121, 0.15)",
                borderWidth: 1.5,
                borderColor: THEME.pink,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10
              }}
            >
              <Text style={{ color: THEME.pink, fontSize: 13, fontWeight: "bold" }}>M</Text>
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: THEME.text, letterSpacing: 1.5 }}>
                LEONIDAS <Text style={{ color: THEME.pink }}>VICE CITY STORIES</Text>
              </Text>
            </View>
          </View>

          {/* Desktop Navigation Tabs (No emojis) */}
          <View style={{ flexDirection: "row", gap: 6 }}>
            <View
              onPress={() => currentScreen.set("home")}
              style={{
                backgroundColor: currentScreen() === "home" ? THEME.pink : THEME.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6
              }}
            >
              <Text style={{ color: THEME.text, fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 }}>HOME</Text>
            </View>

            <View
              onPress={() => currentScreen.set("mods")}
              style={{
                backgroundColor: currentScreen() === "mods" ? THEME.pink : THEME.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6
              }}
            >
              <Text style={{ color: THEME.text, fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 }}>MODS ({activeModsCount()})</Text>
            </View>

            <View
              onPress={() => currentScreen.set("recompiler")}
              style={{
                backgroundColor: currentScreen() === "recompiler" ? THEME.pink : THEME.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6
              }}
            >
              <Text style={{ color: THEME.text, fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 }}>RECOMPILER</Text>
            </View>

            <View
              onPress={() => currentScreen.set("settings")}
              style={{
                backgroundColor: currentScreen() === "settings" ? THEME.pink : THEME.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6
              }}
            >
              <Text style={{ color: THEME.text, fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 }}>SETTINGS</Text>
            </View>

            <View
              onPress={() => currentScreen.set("saves")}
              style={{
                backgroundColor: currentScreen() === "saves" ? THEME.pink : THEME.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6
              }}
            >
              <Text style={{ color: THEME.text, fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 }}>SAVES</Text>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* SCREEN 1: HOME (VICE CITY AT DUSK BACKDROP)                   */}
      {/* ============================================================== */}
      {currentScreen() === "home" && (
        <Scroll style={{ flex: 1 }}>
          {/* Synthwave Sunset Backdrop */}
          <View
            style={{
              height: 240,
              backgroundColor: THEME.sky,
              position: "relative",
              overflow: "hidden",
              justifyContent: "flex-end",
              paddingHorizontal: 22,
              paddingBottom: 22,
              borderBottomWidth: 1,
              borderBottomColor: THEME.horizon
            }}
          >
            {/* Striped Laser Sun sinking into the horizon */}
            <View
              style={{
                position: "absolute",
                bottom: -25,
                right: "12%",
                width: 170,
                height: 170,
                borderRadius: 85,
                backgroundColor: THEME.amber,
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.95
              }}
            >
              <View style={{ position: "absolute", top: 35, width: "100%", height: 3, backgroundColor: THEME.sky }} />
              <View style={{ position: "absolute", top: 60, width: "100%", height: 5, backgroundColor: THEME.sky }} />
              <View style={{ position: "absolute", top: 90, width: "100%", height: 7, backgroundColor: THEME.sky }} />
              <View style={{ position: "absolute", top: 125, width: "100%", height: 9, backgroundColor: THEME.sky }} />
            </View>

            {/* Ocean Beach Art Deco Skyline Silhouettes */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 65,
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 5,
                paddingHorizontal: 12,
                opacity: 0.9
              }}
            >
              <View style={{ width: 34, height: 42, backgroundColor: THEME.skyline, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
              <View style={{ width: 26, height: 58, backgroundColor: THEME.skyline, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              <View style={{ width: 44, height: 46, backgroundColor: THEME.skyline }} />
              <View style={{ width: 20, height: 65, backgroundColor: THEME.skyline, alignItems: "center" }}>
                <View style={{ width: 2, height: 10, backgroundColor: THEME.pinkHi }} />
              </View>
              <View style={{ width: 38, height: 36, backgroundColor: THEME.skyline }} />
              <View style={{ width: 30, height: 52, backgroundColor: THEME.skyline }} />
              <View style={{ width: 46, height: 40, backgroundColor: THEME.skyline }} />
              <View style={{ width: 28, height: 60, backgroundColor: THEME.skyline }} />
              <View style={{ width: 40, height: 44, backgroundColor: THEME.skyline }} />
            </View>

            {/* Hero Brand Title matching launcher/screens/home.cpp */}
            <View style={{ zIndex: 10 }}>
              <Text style={{ color: THEME.pink, fontSize: 11, fontWeight: "bold", letterSpacing: 2 }}>
                LEONIDAS VICE CITY STORIES
              </Text>
              <Text
                style={{
                  color: THEME.text,
                  fontSize: 34,
                  fontWeight: "bold",
                  letterSpacing: 1.5,
                  marginTop: 2
                }}
              >
                Vice City Stories
              </Text>
              <Text style={{ color: THEME.dim, fontSize: 12, marginTop: 4, letterSpacing: 0.3 }}>
                Portage PC HD Remake · Modding VFS · Recompilation PS2 AOT
              </Text>
            </View>
          </View>

          {/* Main Action & Diagnostics Container */}
          <View style={{ padding: 18 }}>
            {/* Live Progress Card when compiling */}
            {isRecompiling() ? (
              <View
                style={{
                  backgroundColor: THEME.surface,
                  borderRadius: 10,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: THEME.borderHi,
                  marginBottom: 16
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ color: THEME.teal, fontSize: 12, fontWeight: "bold", letterSpacing: 1 }}>
                    ON-DEVICE AOT RECOMPILATION
                  </Text>
                  <Text style={{ color: THEME.pink, fontSize: 14, fontWeight: "bold" }}>
                    {recompileProgress()}%
                  </Text>
                </View>

                {/* Progress Track */}
                <View
                  style={{
                    width: "100%",
                    height: 6,
                    backgroundColor: THEME.night,
                    borderRadius: 3,
                    overflow: "hidden",
                    marginBottom: 10
                  }}
                >
                  <View
                    style={{
                      width: `${recompileProgress()}%`,
                      height: "100%",
                      backgroundColor: THEME.pink
                    }}
                  />
                </View>

                <Text style={{ color: THEME.text, fontSize: 12, textAlign: "center", marginBottom: 10 }}>
                  {recompileStage()}
                </Text>

                {/* Console Log Window */}
                <View
                  style={{
                    backgroundColor: THEME.night,
                    borderRadius: 6,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: THEME.border
                  }}
                >
                  {recompilerLogs().slice(-3).map((line, idx) => (
                    <Text key={idx} style={{ color: THEME.dim, fontSize: 10, fontFamily: "monospace" }}>
                      {line}
                    </Text>
                  ))}
                </View>
              </View>
            ) : (
              /* Big Hero Primary Button */
              <View
                onPress={() => runRecompilationPipeline(true)}
                style={{
                  backgroundColor: THEME.pink,
                  borderRadius: 12,
                  paddingVertical: 18,
                  paddingHorizontal: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                  borderWidth: 1,
                  borderColor: THEME.pinkHi
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 19, fontWeight: "bold", letterSpacing: 2 }}>
                  {isRecompiled() ? "PLAY GAME" : "RECOMPILE & PLAY"}
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 11, marginTop: 4 }}>
                  {isRecompiled()
                    ? `12 mods active · Static execution cache ready · 60 FPS`
                    : "Direct Emotion Engine MIPS R5900 translation with VFS mods mounted"}
                </Text>
              </View>
            )}

            {/* Quiet Glass Cards matching launcher/screens/home.cpp */}
            <View style={{ gap: 10 }}>
              {/* Card 1: Disc / ISO */}
              <View
                onPress={() => isEditingPath.set(!isEditingPath())}
                style={{
                  backgroundColor: THEME.surface,
                  borderRadius: 10,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: THEME.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: THEME.faint, fontSize: 10, fontWeight: "bold", letterSpacing: 1 }}>
                    DISC IMAGE
                  </Text>
                  <Text style={{ color: THEME.text, fontSize: 14, fontWeight: "bold", marginTop: 2 }}>
                    Grand Theft Auto: Vice City Stories
                  </Text>
                  <Text style={{ color: THEME.dim, fontSize: 11, marginTop: 2 }}>
                    {romId()} · {romSize()} · Valid ISO 9660
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "rgba(0, 230, 118, 0.12)",
                    borderWidth: 1,
                    borderColor: THEME.green,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 3
                  }}
                >
                  <Text style={{ color: THEME.green, fontSize: 10, fontWeight: "bold" }}>MOUNTED</Text>
                </View>
              </View>

              {/* Card 2: Mods & HD Remake (PC Launcher Sheet Link) */}
              <View
                onPress={() => currentScreen.set("mods")}
                style={{
                  backgroundColor: THEME.surface,
                  borderRadius: 10,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: THEME.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: THEME.faint, fontSize: 10, fontWeight: "bold", letterSpacing: 1 }}>
                    MODS & HD REMAKE
                  </Text>
                  <Text style={{ color: THEME.text, fontSize: 14, fontWeight: "bold", marginTop: 2 }}>
                    Integrated Modding Engine (VFS)
                  </Text>
                  <Text style={{ color: THEME.dim, fontSize: 11, marginTop: 2 }}>
                    {activeModsCount()} active of 12 installed · {masterHdRemake() ? "HD Remake active" : "Custom"}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "rgba(237, 30, 121, 0.12)",
                    borderWidth: 1,
                    borderColor: THEME.pink,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 3
                  }}
                >
                  <Text style={{ color: THEME.pink, fontSize: 10, fontWeight: "bold" }}>MANAGE ›</Text>
                </View>
              </View>

              {/* Card 3: Recompiler Engine */}
              <View
                onPress={() => currentScreen.set("recompiler")}
                style={{
                  backgroundColor: THEME.surface,
                  borderRadius: 10,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: THEME.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: THEME.faint, fontSize: 10, fontWeight: "bold", letterSpacing: 1 }}>
                    STATIC AOT RECOMPILER
                  </Text>
                  <Text style={{ color: THEME.text, fontSize: 14, fontWeight: "bold", marginTop: 2 }}>
                    ARM64 AArch64 Engine
                  </Text>
                  <Text style={{ color: THEME.dim, fontSize: 11, marginTop: 2 }}>
                    11,218 EE functions · 24 VU1 microprograms · NEON SIMD
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: isRecompiled() ? "rgba(0, 230, 118, 0.12)" : "rgba(237, 30, 121, 0.12)",
                    borderWidth: 1,
                    borderColor: isRecompiled() ? THEME.green : THEME.pink,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 3
                  }}
                >
                  <Text style={{ color: isRecompiled() ? THEME.green : THEME.pink, fontSize: 10, fontWeight: "bold" }}>
                    {isRecompiled() ? "COMPILED" : "STANDBY"}
                  </Text>
                </View>
              </View>

              {/* Card 4: TouchPort Mobile HUD */}
              <View
                onPress={() => currentScreen.set("settings")}
                style={{
                  backgroundColor: THEME.surface,
                  borderRadius: 10,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: THEME.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: THEME.faint, fontSize: 10, fontWeight: "bold", letterSpacing: 1 }}>
                    TOUCHPORT CONTROLS & HUD
                  </Text>
                  <Text style={{ color: THEME.text, fontSize: 14, fontWeight: "bold", marginTop: 2 }}>
                    Responsive Gamepad
                  </Text>
                  <Text style={{ color: THEME.dim, fontSize: 11, marginTop: 2 }}>
                    Dynamic floating stick · Drag-to-aim · Auto-sprint
                  </Text>
                </View>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: THEME.teal,
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 3
                  }}
                >
                  <Text style={{ color: THEME.teal, fontSize: 10, fontWeight: "bold" }}>CONFIG</Text>
                </View>
              </View>
            </View>
          </View>
        </Scroll>
      )}

      {/* ============================================================== */}
      {/* SCREEN 2: MODS & HD REMAKE MANAGER (PC LAUNCHER DRAWER)        */}
      {/* ============================================================== */}
      {currentScreen() === "mods" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          {/* Master Switch Card matching launcher/screens/sheets.cpp */}
          <View
            onPress={toggleMasterHd}
            style={{
              backgroundColor: THEME.surface,
              borderRadius: 10,
              padding: 16,
              borderWidth: 1,
              borderColor: masterHdRemake() ? THEME.pink : THEME.border,
              marginBottom: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: THEME.text, fontSize: 15, fontWeight: "bold" }}>
                LVCS HD Remake Engine
              </Text>
              <Text style={{ color: THEME.dim, fontSize: 11, marginTop: 2 }}>
                Activates 4K textures, 80s neon shaders, extended draw distance, modern physics and full audio overhaul.
              </Text>
            </View>
            <View
              style={{
                backgroundColor: masterHdRemake() ? THEME.pink : THEME.base,
                borderWidth: 1,
                borderColor: masterHdRemake() ? THEME.pinkHi : THEME.border,
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 6
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "bold" }}>
                {masterHdRemake() ? "ACTIVE" : "OFF"}
              </Text>
            </View>
          </View>

          {/* Category Filter Pills */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {["ALL", "VISUALS", "GAMEPLAY", "CONTROLS", "UI", "AUDIO"].map((cat) => (
              <View
                key={cat}
                onPress={() => modFilter.set(cat)}
                style={{
                  backgroundColor: modFilter() === cat ? THEME.pink : THEME.surface,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: modFilter() === cat ? THEME.pinkHi : THEME.border
                }}
              >
                <Text style={{ color: THEME.text, fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 }}>
                  {cat}
                </Text>
              </View>
            ))}
          </View>

          {/* Installed Mods List */}
          <View style={{ gap: 8, marginBottom: 18 }}>
            {filteredMods().map((m) => (
              <View
                key={m.id}
                onPress={() => toggleMod(m.id)}
                style={{
                  backgroundColor: THEME.surface,
                  borderRadius: 8,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: m.enabled ? THEME.borderHi : THEME.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <Text style={{ color: THEME.text, fontSize: 13, fontWeight: "bold" }}>
                      {m.name}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "rgba(41, 171, 226, 0.15)",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4
                      }}
                    >
                      <Text style={{ color: THEME.teal, fontSize: 9, fontWeight: "bold" }}>
                        {m.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: THEME.dim, fontSize: 11, lineHeight: 16 }}>
                    {m.desc}
                  </Text>
                </View>

                {/* Mod Toggle Indicator */}
                <View
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: m.enabled ? THEME.pink : THEME.night,
                    borderWidth: 1,
                    borderColor: m.enabled ? THEME.pinkHi : THEME.border,
                    alignItems: m.enabled ? "flex-end" : "flex-start",
                    justifyContent: "center",
                    paddingHorizontal: 2
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: "#FFFFFF"
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </Scroll>
      )}

      {/* ============================================================== */}
      {/* SCREEN 3: RECOMPILER DASHBOARD & DIAGNOSTICS                  */}
      {/* ============================================================== */}
      {currentScreen() === "recompiler" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          <View
            style={{
              backgroundColor: THEME.surface,
              borderRadius: 10,
              padding: 18,
              borderWidth: 1,
              borderColor: THEME.border,
              marginBottom: 16
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ color: THEME.pink, fontSize: 15, fontWeight: "bold", letterSpacing: 1 }}>
                ON-DEVICE STATIC AOT RECOMPILER
              </Text>
              <Text style={{ color: isRecompiled() ? THEME.green : THEME.pink, fontSize: 11, fontWeight: "bold" }}>
                {isRecompiled() ? "ACTIVE CACHE" : "UNCOMPILED"}
              </Text>
            </View>

            <Text style={{ color: THEME.dim, fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
              The on-device static recompiler decodes the PS2 MIPS R5900 Emotion Engine executable
              directly from the disc image, producing native ARM64 instructions and NEON vector routines.
            </Text>

            {/* Technical Parameters */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1, backgroundColor: THEME.base, padding: 10, borderRadius: 6 }}>
                <Text style={{ color: THEME.faint, fontSize: 9, fontWeight: "bold" }}>EE FUNCTIONS</Text>
                <Text style={{ color: THEME.teal, fontSize: 16, fontWeight: "bold", marginTop: 2 }}>
                  {compiledFunctions().toLocaleString()}
                </Text>
                <Text style={{ color: THEME.faint, fontSize: 9 }}>MIPS R5900</Text>
              </View>

              <View style={{ flex: 1, backgroundColor: THEME.base, padding: 10, borderRadius: 6 }}>
                <Text style={{ color: THEME.faint, fontSize: 9, fontWeight: "bold" }}>VU1 MICROCODES</Text>
                <Text style={{ color: THEME.amber, fontSize: 16, fontWeight: "bold", marginTop: 2 }}>
                  {compiledMicrocodes()}
                </Text>
                <Text style={{ color: THEME.faint, fontSize: 9 }}>NEON SIMD</Text>
              </View>

              <View style={{ flex: 1, backgroundColor: THEME.base, padding: 10, borderRadius: 6 }}>
                <Text style={{ color: THEME.faint, fontSize: 9, fontWeight: "bold" }}>TARGET ARCH</Text>
                <Text style={{ color: THEME.green, fontSize: 16, fontWeight: "bold", marginTop: 2 }}>
                  AArch64
                </Text>
                <Text style={{ color: THEME.faint, fontSize: 9 }}>ARMv8-A</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View
                onPress={() => runRecompilationPipeline(false)}
                style={{
                  flex: 2,
                  backgroundColor: THEME.pink,
                  paddingVertical: 10,
                  borderRadius: 6,
                  alignItems: "center"
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "bold", letterSpacing: 1 }}>
                  FORCE RECOMPILATION
                </Text>
              </View>

              <View
                onPress={() => {
                  isRecompiled.set(false);
                  const l = [...recompilerLogs()];
                  l.push("[cache] Execution cache cleared");
                  recompilerLogs.set(l);
                }}
                style={{
                  flex: 1,
                  backgroundColor: THEME.surfaceHi,
                  paddingVertical: 10,
                  borderRadius: 6,
                  alignItems: "center"
                }}
              >
                <Text style={{ color: THEME.dim, fontSize: 11, fontWeight: "bold" }}>
                  CLEAR CACHE
                </Text>
              </View>
            </View>
          </View>

          {/* Diagnostic Console Logs */}
          <View
            style={{
              backgroundColor: THEME.night,
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: THEME.border
            }}
          >
            <Text style={{ color: THEME.faint, fontSize: 10, fontWeight: "bold", marginBottom: 8, letterSpacing: 1 }}>
              DIAGNOSTIC LOG TAIL:
            </Text>
            {recompilerLogs().map((line, i) => (
              <Text
                key={i}
                style={{
                  color: line.includes("[status]") ? THEME.green : line.includes("[recompile]") ? THEME.pink : THEME.dim,
                  fontSize: 10,
                  fontFamily: "monospace",
                  lineHeight: 16
                }}
              >
                {line}
              </Text>
            ))}
          </View>
        </Scroll>
      )}

      {/* ============================================================== */}
      {/* SCREEN 4: GAMEPLAY VIEW & TOUCHPORT HUD                        */}
      {/* ============================================================== */}
      {currentScreen() === "game" && (
        <View style={{ flex: 1, position: "relative" }}>
          {/* 3D World Canvas View */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#030206",
              justifyContent: "space-between",
              padding: 14,
              position: "relative"
            }}
          >
            {/* Center World Marker */}
            <View
              style={{
                position: "absolute",
                top: "24%",
                left: "20%",
                right: "20%",
                alignItems: "center"
              }}
            >
              <Text style={{ color: THEME.pink, fontSize: 26, fontWeight: "bold", letterSpacing: 4 }}>
                VICE CITY STORIES
              </Text>
              <Text style={{ color: THEME.teal, fontSize: 11, letterSpacing: 1.5, marginTop: 4 }}>
                ARM64 AOT RECOMPILER · 60 FPS · {locationName()}
              </Text>
              
              <View
                style={{
                  backgroundColor: "rgba(16, 16, 20, 0.8)",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  marginTop: 14,
                  borderWidth: 1,
                  borderColor: THEME.border
                }}
              >
                <Text style={{ color: THEME.dim, fontSize: 11 }}>
                  Input: <Text style={{ color: THEME.teal, fontWeight: "bold" }}>{lastControlAction()}</Text>
                </Text>
              </View>
            </View>

            {/* TOP BAR: GAME CONTROLS & AUTHENTIC GTA HUD */}
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                zIndex: 10
              }}
            >
              {/* Left System Controls (Pause, HUD Menu, Opacity) */}
              <View style={{ flexDirection: "row", gap: 6 }}>
                <View
                  onPress={() => currentScreen.set("home")}
                  style={{
                    backgroundColor: "rgba(16, 16, 20, 0.85)",
                    borderWidth: 1,
                    borderColor: THEME.pink,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "bold" }}>PAUSE</Text>
                </View>

                <View
                  onPress={() => inGameMenuOpen.set(!inGameMenuOpen())}
                  style={{
                    backgroundColor: inGameMenuOpen() ? THEME.pink : "rgba(16, 16, 20, 0.85)",
                    borderWidth: 1,
                    borderColor: inGameMenuOpen() ? "#FFFFFF" : THEME.border,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "bold" }}>HUD</Text>
                </View>

                <View
                  onPress={() => {
                    const next = controllerOpacity() === 75 ? 50 : controllerOpacity() === 50 ? 100 : 75;
                    controllerOpacity.set(next);
                  }}
                  style={{
                    backgroundColor: "rgba(16, 16, 20, 0.85)",
                    borderWidth: 1,
                    borderColor: THEME.border,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6
                  }}
                >
                  <Text style={{ color: THEME.teal, fontSize: 11, fontWeight: "bold" }}>{controllerOpacity()}%</Text>
                </View>
              </View>

              {/* Top-Right: Authentic GTA Vice City Status Box */}
              <View
                style={{
                  backgroundColor: "rgba(10, 10, 14, 0.85)",
                  borderRadius: 8,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: THEME.border,
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "center"
                }}
              >
                {/* Weapon Display */}
                <View
                  onPress={() => handleAction("Weapon Next", "weapon_next")}
                  style={{
                    width: 70,
                    height: 48,
                    backgroundColor: THEME.base,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: THEME.teal,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 4
                  }}
                >
                  <Text style={{ color: THEME.text, fontSize: 9, fontWeight: "bold", textAlign: "center" }}>
                    {weapons[activeWeaponIndex()].name}
                  </Text>
                  <Text style={{ color: THEME.teal, fontSize: 10, fontWeight: "bold", marginTop: 2 }}>
                    {weapons[activeWeaponIndex()].clip ? `${weapons[activeWeaponIndex()].clip}-${weapons[activeWeaponIndex()].ammo}` : weapons[activeWeaponIndex()].ammo}
                  </Text>
                </View>

                {/* Health, Armor, Cash, Stars */}
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", width: 130 }}>
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "bold" }}>{gameTime()}</Text>
                    <Text style={{ color: THEME.green, fontSize: 13, fontWeight: "bold" }}>${playerCash().toLocaleString()}</Text>
                  </View>

                  {/* Health Bar */}
                  <View style={{ width: 130, height: 8, backgroundColor: "rgba(237, 30, 121, 0.25)", borderRadius: 4, overflow: "hidden" }}>
                    <View style={{ width: `${playerHealth()}%`, height: "100%", backgroundColor: THEME.pink }} />
                  </View>

                  {/* Armor Bar */}
                  <View style={{ width: 130, height: 8, backgroundColor: "rgba(41, 171, 226, 0.25)", borderRadius: 4, overflow: "hidden" }}>
                    <View style={{ width: `${playerArmor()}%`, height: "100%", backgroundColor: THEME.teal }} />
                  </View>

                  {/* Wanted Stars */}
                  <View style={{ flexDirection: "row", gap: 3 }}>
                    {[1, 2, 3, 4, 5, 6].map((star) => (
                      <Text key={star} style={{ color: star <= wantedStars() ? THEME.amber : THEME.surfaceTop, fontSize: 11, fontWeight: "bold" }}>
                        *
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* In-Game HUD Settings Modal */}
            {inGameMenuOpen() && (
              <View
                style={{
                  position: "absolute",
                  top: 54,
                  left: 14,
                  width: 280,
                  backgroundColor: "rgba(16, 16, 20, 0.95)",
                  borderRadius: 10,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: THEME.borderHi,
                  zIndex: 20
                }}
              >
                <Text style={{ color: THEME.pink, fontSize: 12, fontWeight: "bold", letterSpacing: 1, marginBottom: 10 }}>
                  TOUCHPORT HUD CONFIG
                </Text>

                <View
                  onPress={() => autoSprintEnabled.set(!autoSprintEnabled())}
                  style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}
                >
                  <Text style={{ color: THEME.text, fontSize: 11 }}>Auto-Sprint (Joystick)</Text>
                  <Text style={{ color: autoSprintEnabled() ? THEME.green : THEME.faint, fontSize: 11, fontWeight: "bold" }}>
                    {autoSprintEnabled() ? "ON" : "OFF"}
                  </Text>
                </View>

                <View
                  onPress={() => floatingJoyEnabled.set(!floatingJoyEnabled())}
                  style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}
                >
                  <Text style={{ color: THEME.text, fontSize: 11 }}>Floating Joystick</Text>
                  <Text style={{ color: floatingJoyEnabled() ? THEME.green : THEME.faint, fontSize: 11, fontWeight: "bold" }}>
                    {floatingJoyEnabled() ? "ON" : "FIXED"}
                  </Text>
                </View>

                <View
                  onPress={() => buttonScale.set(buttonScale() === "Normal" ? "Large" : "Normal")}
                  style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}
                >
                  <Text style={{ color: THEME.text, fontSize: 11 }}>Button Scale</Text>
                  <Text style={{ color: THEME.teal, fontSize: 11, fontWeight: "bold" }}>{buttonScale()}</Text>
                </View>

                <View
                  onPress={() => inGameMenuOpen.set(false)}
                  style={{
                    backgroundColor: THEME.pink,
                    paddingVertical: 6,
                    borderRadius: 4,
                    alignItems: "center",
                    marginTop: 8
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}>CLOSE</Text>
                </View>
              </View>
            )}

            {/* Bottom-Left: GTA Minimap Radar */}
            <View style={{ position: "absolute", bottom: 14, left: 14, zIndex: 10 }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: "rgba(10, 10, 14, 0.85)",
                  borderWidth: 1.5,
                  borderColor: THEME.teal,
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}
              >
                <View style={{ position: "absolute", width: "100%", height: 1, backgroundColor: "rgba(41, 171, 226, 0.25)" }} />
                <View style={{ position: "absolute", height: "100%", width: 1, backgroundColor: "rgba(41, 171, 226, 0.25)" }} />
                <Text style={{ position: "absolute", top: 4, color: THEME.text, fontSize: 9, fontWeight: "bold" }}>N</Text>
                <Text style={{ color: THEME.pink, fontSize: 13, fontWeight: "bold" }}>^</Text>
                <View style={{ position: "absolute", top: 26, right: 26, width: 6, height: 6, backgroundColor: THEME.amber }} />
              </View>

              <View
                style={{
                  backgroundColor: "rgba(16, 16, 20, 0.85)",
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  marginTop: 4,
                  borderWidth: 1,
                  borderColor: THEME.border
                }}
              >
                <Text style={{ color: THEME.dim, fontSize: 9, fontWeight: "bold" }}>{locationName()}</Text>
              </View>
            </View>
          </View>

          {/* TOUCHPORT VIRTUAL CONTROLLER OVERLAY */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 12,
              pointerEvents: "box-none"
            }}
          >
            {/* Left Controls (L1, L2, D-PAD, Floating Stick) */}
            <View style={{ width: 240, justifyContent: "space-between", paddingTop: 46, paddingBottom: 10 }}>
              {/* L1 & L2 */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  onPress={() => handleAction("L1 (Lock-on)")}
                  style={{
                    backgroundColor: "rgba(23, 23, 28, 0.85)",
                    borderWidth: 1,
                    borderColor: THEME.teal,
                    borderRadius: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: THEME.teal, fontSize: 11, fontWeight: "bold" }}>L1</Text>
                </View>

                <View
                  onPress={() => handleAction("L2 (Prev Weapon)", "weapon_prev")}
                  style={{
                    backgroundColor: "rgba(23, 23, 28, 0.85)",
                    borderWidth: 1,
                    borderColor: THEME.teal,
                    borderRadius: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: THEME.teal, fontSize: 11, fontWeight: "bold" }}>L2</Text>
                </View>
              </View>

              {/* D-Pad & Floating Stick */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
                {/* D-Pad */}
                <View style={{ alignItems: "center" }}>
                  <View
                    onPress={() => handleAction("D-PAD UP")}
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: "rgba(23, 23, 28, 0.85)",
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: THEME.border,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: THEME.teal, fontSize: 14, fontWeight: "bold" }}>^</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 36, marginVertical: 2 }}>
                    <View
                      onPress={() => handleAction("D-PAD LEFT")}
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: "rgba(23, 23, 28, 0.85)",
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: THEME.border,
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: THEME.teal, fontSize: 14, fontWeight: "bold" }}>&lt;</Text>
                    </View>

                    <View
                      onPress={() => handleAction("D-PAD RIGHT")}
                      style={{
                        width: 36,
                        height: 36,
                        backgroundColor: "rgba(23, 23, 28, 0.85)",
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: THEME.border,
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: THEME.teal, fontSize: 14, fontWeight: "bold" }}>&gt;</Text>
                    </View>
                  </View>

                  <View
                    onPress={() => handleAction("D-PAD DOWN")}
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: "rgba(23, 23, 28, 0.85)",
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: THEME.border,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: THEME.teal, fontSize: 14, fontWeight: "bold" }}>v</Text>
                  </View>
                </View>

                {/* Floating Stick */}
                <View
                  onPress={() => handleAction("JOYSTICK LEFT")}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 45,
                    backgroundColor: "rgba(16, 16, 20, 0.75)",
                    borderWidth: 1.5,
                    borderColor: "rgba(41, 171, 226, 0.35)",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: THEME.pink,
                      borderWidth: 1.5,
                      borderColor: "#FFFFFF",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "bold" }}>L3</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Center Buttons (Select / Start) */}
            <View style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 10 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View
                  onPress={() => handleAction("SELECT")}
                  style={{
                    backgroundColor: "rgba(23, 23, 28, 0.85)",
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: THEME.border
                  }}
                >
                  <Text style={{ color: THEME.dim, fontSize: 10, fontWeight: "bold" }}>SELECT</Text>
                </View>

                <View
                  onPress={() => handleAction("START")}
                  style={{
                    backgroundColor: "rgba(23, 23, 28, 0.85)",
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: THEME.border
                  }}
                >
                  <Text style={{ color: THEME.dim, fontSize: 10, fontWeight: "bold" }}>START</Text>
                </View>
              </View>
            </View>

            {/* Right Controls (R1, R2, Drag-to-Aim, Action Diamond) */}
            <View style={{ width: 240, alignItems: "flex-end", justifyContent: "space-between", paddingTop: 46, paddingBottom: 10 }}>
              {/* R1 & R2 */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  onPress={() => handleAction("R2 (Next Weapon)", "weapon_next")}
                  style={{
                    backgroundColor: "rgba(23, 23, 28, 0.85)",
                    borderWidth: 1,
                    borderColor: THEME.pink,
                    borderRadius: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: THEME.pink, fontSize: 11, fontWeight: "bold" }}>R2</Text>
                </View>

                <View
                  onPress={() => handleAction("R1 (Fire / Attack)")}
                  style={{
                    backgroundColor: "rgba(23, 23, 28, 0.85)",
                    borderWidth: 1,
                    borderColor: THEME.pink,
                    borderRadius: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: THEME.pink, fontSize: 11, fontWeight: "bold" }}>R1</Text>
                </View>
              </View>

              {/* Action Diamond & Drag-to-Aim */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
                {/* TouchPort Drag-to-Aim */}
                <View
                  onPress={() => handleAction("DRAG-TO-AIM")}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 45,
                    backgroundColor: "rgba(16, 16, 20, 0.75)",
                    borderWidth: 1.5,
                    borderColor: "rgba(237, 30, 121, 0.35)",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: THEME.teal,
                      borderWidth: 1.5,
                      borderColor: "#FFFFFF",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#000000", fontSize: 10, fontWeight: "bold" }}>AIM</Text>
                  </View>
                </View>

                {/* PS Action Buttons Diamond (Clean geometric glyphs, no emojis) */}
                <View style={{ alignItems: "center" }}>
                  {/* Triangle */}
                  <View
                    onPress={() => handleAction("TRIANGLE (Enter/Exit)")}
                    style={{
                      width: btnDiameter(),
                      height: btnDiameter(),
                      borderRadius: btnDiameter() / 2,
                      backgroundColor: "rgba(23, 23, 28, 0.85)",
                      borderWidth: 1.5,
                      borderColor: THEME.green,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: THEME.green, fontSize: 15, fontWeight: "bold" }}>/_\</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: btnDiameter(), marginVertical: 2 }}>
                    {/* Square */}
                    <View
                      onPress={() => handleAction("SQUARE (Jump / Brake)")}
                      style={{
                        width: btnDiameter(),
                        height: btnDiameter(),
                        borderRadius: btnDiameter() / 2,
                        backgroundColor: "rgba(23, 23, 28, 0.85)",
                        borderWidth: 1.5,
                        borderColor: THEME.pink,
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: THEME.pink, fontSize: 13, fontWeight: "bold" }}>[ ]</Text>
                    </View>

                    {/* Circle */}
                    <View
                      onPress={() => handleAction("CIRCLE (Attack / Fire)")}
                      style={{
                        width: btnDiameter(),
                        height: btnDiameter(),
                        borderRadius: btnDiameter() / 2,
                        backgroundColor: "rgba(23, 23, 28, 0.85)",
                        borderWidth: 1.5,
                        borderColor: THEME.red,
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: THEME.red, fontSize: 15, fontWeight: "bold" }}>O</Text>
                    </View>
                  </View>

                  {/* Cross */}
                  <View
                    onPress={() => handleAction("CROSS (Sprint / Accelerate)")}
                    style={{
                      width: btnDiameter(),
                      height: btnDiameter(),
                      borderRadius: btnDiameter() / 2,
                      backgroundColor: "rgba(23, 23, 28, 0.85)",
                      borderWidth: 1.5,
                      borderColor: THEME.teal,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: THEME.teal, fontSize: 15, fontWeight: "bold" }}>X</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* SCREEN 5: SETTINGS & GRAPHICS CONFIGURATION                    */}
      {/* ============================================================== */}
      {currentScreen() === "settings" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          <View
            style={{
              backgroundColor: THEME.surface,
              borderRadius: 10,
              padding: 16,
              borderWidth: 1,
              borderColor: THEME.border,
              marginBottom: 14
            }}
          >
            <Text style={{ color: THEME.pink, fontSize: 13, fontWeight: "bold", letterSpacing: 1, marginBottom: 12 }}>
              GRAPHICS & DISPLAY CONFIGURATION
            </Text>

            {/* HD Remaster */}
            <View
              onPress={() => hdRemasterEnabled.set(!hdRemasterEnabled())}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: THEME.border }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: THEME.text, fontSize: 13, fontWeight: "bold" }}>HD Remaster Post-Processing</Text>
                <Text style={{ color: THEME.faint, fontSize: 10 }}>MSAA 4x anti-aliasing on Vulkan GPU</Text>
              </View>
              <View style={{ backgroundColor: hdRemasterEnabled() ? "rgba(0, 230, 118, 0.15)" : THEME.base, borderWidth: 1, borderColor: hdRemasterEnabled() ? THEME.green : THEME.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: hdRemasterEnabled() ? THEME.green : THEME.faint, fontSize: 10, fontWeight: "bold" }}>
                  {hdRemasterEnabled() ? "ENABLED" : "DISABLED"}
                </Text>
              </View>
            </View>

            {/* Framerate Target */}
            <View
              onPress={() => fpsTarget.set(fpsTarget() === 60 ? 30 : 60)}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: THEME.border }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: THEME.text, fontSize: 13, fontWeight: "bold" }}>Target Framerate</Text>
                <Text style={{ color: THEME.faint, fontSize: 10 }}>60 FPS native render mode on ARM64</Text>
              </View>
              <View style={{ backgroundColor: "rgba(41, 171, 226, 0.15)", borderWidth: 1, borderColor: THEME.teal, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: THEME.teal, fontSize: 10, fontWeight: "bold" }}>{fpsTarget()} FPS</Text>
              </View>
            </View>

            {/* Widescreen */}
            <View
              onPress={() => widescreenFix.set(!widescreenFix())}
              style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: THEME.text, fontSize: 13, fontWeight: "bold" }}>Widescreen Ratio</Text>
                <Text style={{ color: THEME.faint, fontSize: 10 }}>Native 16:9 / 20:9 viewport scaling</Text>
              </View>
              <View style={{ backgroundColor: widescreenFix() ? "rgba(0, 230, 118, 0.15)" : THEME.base, borderWidth: 1, borderColor: widescreenFix() ? THEME.green : THEME.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: widescreenFix() ? THEME.green : THEME.faint, fontSize: 10, fontWeight: "bold" }}>
                  {widescreenFix() ? "ENABLED" : "DISABLED"}
                </Text>
              </View>
            </View>
          </View>
        </Scroll>
      )}

      {/* ============================================================== */}
      {/* SCREEN 6: SAVES & MEMORY CARD                                  */}
      {/* ============================================================== */}
      {currentScreen() === "saves" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          <View
            style={{
              backgroundColor: THEME.surface,
              borderRadius: 10,
              padding: 16,
              borderWidth: 1,
              borderColor: THEME.border,
              marginBottom: 14
            }}
          >
            <Text style={{ color: THEME.pink, fontSize: 13, fontWeight: "bold", letterSpacing: 1, marginBottom: 8 }}>
              MEMORY CARD (PS2 8 MB)
            </Text>
            <Text style={{ color: THEME.dim, fontSize: 11, lineHeight: 16, marginBottom: 14 }}>
              Game saves are stored in standard PlayStation 2 memory card format (.bin)
              within the app internal storage sandbox.
            </Text>

            <View style={{ gap: 8 }}>
              <View
                style={{
                  backgroundColor: THEME.base,
                  padding: 12,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: THEME.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View>
                  <Text style={{ color: THEME.text, fontSize: 12, fontWeight: "bold" }}>Slot 1: Internal Memory Card</Text>
                  <Text style={{ color: THEME.teal, fontSize: 10, marginTop: 2 }}>vcs_memcard1.bin (Active saves)</Text>
                </View>
                <View style={{ backgroundColor: "rgba(0, 230, 118, 0.15)", borderWidth: 1, borderColor: THEME.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: THEME.green, fontSize: 9, fontWeight: "bold" }}>CONNECTED</Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: THEME.base,
                  padding: 12,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: THEME.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View>
                  <Text style={{ color: THEME.text, fontSize: 12, fontWeight: "bold" }}>Slot 2: Secondary Memory Card</Text>
                  <Text style={{ color: THEME.faint, fontSize: 10, marginTop: 2 }}>vcs_memcard2.bin (Backup / Export)</Text>
                </View>
                <View style={{ backgroundColor: THEME.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ color: THEME.faint, fontSize: 9, fontWeight: "bold" }}>EMPTY</Text>
                </View>
              </View>
            </View>
          </View>
        </Scroll>
      )}
    </View>
  );
}

mount(App);
