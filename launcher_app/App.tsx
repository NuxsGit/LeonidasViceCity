import { mount, signal } from "@nlayer/runtime";
import { View, Text, Scroll, Input } from "@nlayer/ui";

function App() {
  // Navigation & Screens (Home, Recompiler, Settings, Saves, Game)
  const currentScreen = signal<"home" | "recompiler" | "settings" | "saves" | "game">("home");

  // ROM & Disc Image Management
  const romPath = signal("/sdcard/Download/Grand Theft Auto - Vice City Stories.iso");
  const customPathInput = signal("");
  const isEditingPath = signal(false);
  const romSize = signal("4.12 Go");
  const romId = signal("SLUS-21590 (USA v1.02)");
  const discMounted = signal(true);

  // Embedded On-Device AOT Recompiler State
  const recompileProgress = signal<number>(0);
  const recompileStage = signal<string>("Prêt pour compilation AOT");
  const isRecompiling = signal<boolean>(false);
  const isRecompiled = signal<boolean>(false);
  const recompiledFunctions = signal<number>(11218);
  const recompiledVu1 = signal<number>(24);
  const cacheStatus = signal<string>("Valide (recomp_cache.bin · 3.8 Mo)");

  // Recompiler Live Terminal Logs
  const recompilerLogs = signal<string[]>([
    "[système] Recompilateur statique AOT ARM64 initialisé",
    "[iso] Image montée : SLUS_215.90 (Secteurs LBA: 2 108 432)",
    "[mips] Table d'adresses EE : 0x00100000 -> 0x003A0000",
    "[neon] Traducteur SIMD vectoriel sse2neon prêt (128-bit)",
    "[status] Prêt pour recompilation autonome sur l'appareil"
  ]);

  // TouchPort HUD & Game State
  const inGameMenuOpen = signal<boolean>(false);
  const playerHealth = signal<number>(100);
  const playerArmor = signal<number>(100);
  const playerCash = signal<number>(248500);
  const wantedStars = signal<number>(2);
  const gameTime = signal<string>("12:45");
  const locationName = signal<string>("OCEAN BEACH • OCEAN DRIVE");
  const activeWeaponIndex = signal<number>(1);
  const lastPressedBtn = signal<string>("Prêt");

  // TouchPort HUD Controls Configuration
  const controllerOpacity = signal<number>(75);
  const autoSprintEnabled = signal<boolean>(true);
  const floatingJoyEnabled = signal<boolean>(true);
  const buttonScale = signal<"Normal" | "Large">("Normal");
  const hapticFeedback = signal<boolean>(true);

  // Graphics & Engine Settings
  const hdRemasterEnabled = signal<boolean>(true);
  const antiAliasing = signal<string>("MSAA 4x");
  const fpsTarget = signal<number>(60);
  const widescreenFix = signal<boolean>(true);

  // Weapons list
  const weapons = [
    { name: "POINGS", icon: "👊", ammo: "∞", clip: "" },
    { name: "MICRO SMG (UZI)", icon: "🔫", ammo: "120", clip: "30" },
    { name: "COLT .45", icon: "♦", ammo: "84", clip: "7" },
    { name: "KATANA", icon: "⚔️", ammo: "∞", clip: "" },
    { name: "M4 CARBINE", icon: "💥", ammo: "250", clip: "50" },
    { name: "LANCE-ROQUETTES", icon: "🚀", ammo: "8", clip: "1" }
  ];

  // Preset ROMs
  const presetRoms = [
    { label: "Dossier Téléchargements (USA)", path: "/sdcard/Download/Grand Theft Auto - Vice City Stories.iso", id: "SLUS-21590" },
    { label: "Dossier Téléchargements (EUR)", path: "/sdcard/Download/GTA_Vice_City_Stories_Europe.iso", id: "SLES-54622" },
    { label: "Stockage Émulé (ROMs/PS2)", path: "/storage/emulated/0/ROMs/PS2/vcs.iso", id: "SLUS-21590" },
    { label: "Dossier Racine (vcs.iso)", path: "/sdcard/vcs.iso", id: "SLUS-21590" }
  ];

  // Run On-Device Recompilation Sequence
  const triggerOnDeviceRecompile = (thenLaunch = true) => {
    isRecompiling.set(true);
    recompileProgress.set(5);
    recompileStage.set("Phase 1/5 : Analyse du système ISO & extraction de SLUS_215.90...");
    
    const logs = [...recompilerLogs()];
    logs.push("[recompile] Début du pipeline AOT embarqué");
    logs.push("[recompile] Extraction de SYSTEM.CNF & ELF binaire");
    recompilerLogs.set(logs);

    setTimeout(() => {
      recompileProgress.set(28);
      recompileStage.set("Phase 2/5 : Validation en-tête ELF32 MIPS R5900 (Emotion Engine)...");
      const l2 = [...recompilerLogs()];
      l2.push("[mips] ELF32 valide (Machine=0x0008 MIPS, Entry=0x00100008)");
      l2.push("[mips] Segments détectés: .text (2.4 Mo), .rodata (480 Ko), .vutext (180 Ko)");
      recompilerLogs.set(l2);

      setTimeout(() => {
        recompileProgress.set(58);
        recompileStage.set("Phase 3/5 : Décodage statique des 11 218 fonctions du jeu...");
        const l3 = [...recompilerLogs()];
        l3.push("[aot] 11 218 fonctions Emotion Engine traduites en blocs C++ natifs");
        l3.push("[aot] Optimisation des sauts directs et des tables de branchement");
        recompilerLogs.set(l3);

        setTimeout(() => {
          recompileProgress.set(82);
          recompileStage.set("Phase 4/5 : Recompilation vectorielle VU1 (24 microprogrammes)...");
          const l4 = [...recompilerLogs()];
          l4.push("[vu1] 24 microprogrammes MPG traduits en vecteurs ARM NEON (128-bit)");
          l4.push("[neon] Précision flottante SSE2NEON_PRECISE activée");
          recompilerLogs.set(l4);

          setTimeout(() => {
            recompileProgress.set(100);
            recompileStage.set("Phase 5/5 : Recompilation terminée ! Cache AOT généré.");
            isRecompiled.set(true);
            isRecompiling.set(false);
            const l5 = [...recompilerLogs()];
            l5.push("[cache] Cache d'exécution écrit : recomp_cache.bin (3.8 Mo)");
            l5.push("[succès] Moteur Leonidas prêt pour exécution à 60 FPS !");
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

  const handleButtonPress = (btnName: string, actionType?: string) => {
    lastPressedBtn.set(btnName);
    if (actionType === "weapon_next") {
      activeWeaponIndex.set((activeWeaponIndex() + 1) % weapons.length);
    } else if (actionType === "weapon_prev") {
      activeWeaponIndex.set((activeWeaponIndex() - 1 + weapons.length) % weapons.length);
    } else if (actionType === "sprint") {
      lastPressedBtn.set("✕ SPRINT ACTIF");
    } else if (actionType === "aim_drag") {
      lastPressedBtn.set("DRAG-TO-AIM (Visée / Caméra)");
    }
  };

  const btnDiameter = () => (buttonScale() === "Large" ? 56 : 48);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0c" }}>
      {/* ============================================================== */}
      {/* TOP DESKTOP-STYLE TITLEBAR                                     */}
      {/* ============================================================== */}
      {currentScreen() !== "game" && (
        <View
          style={{
            backgroundColor: "#101014",
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottomWidth: 1.5,
            borderBottomColor: "#ed1e7933"
          }}
        >
          {/* Macca Avatar & Brand */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#ed1e7922",
                borderWidth: 1.5,
                borderColor: "#ed1e79",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10
              }}
            >
              <Text style={{ fontSize: 20 }}>🐊</Text>
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#ffffff", letterSpacing: 1 }}>
                LEONIDAS <Text style={{ color: "#ed1e79" }}>VICE CITY</Text>
              </Text>
              <Text style={{ fontSize: 9, color: "#29abe2", letterSpacing: 0.5, fontWeight: "bold" }}>
                RECOMPILATEUR STATIQUE ARM64 EMBARQUÉ
              </Text>
            </View>
          </View>

          {/* Desktop Navigation Tabs */}
          <View style={{ flexDirection: "row", gap: 6 }}>
            <View
              onPress={() => currentScreen.set("home")}
              style={{
                backgroundColor: currentScreen() === "home" ? "#ed1e79" : "#17171c",
                paddingHorizontal: 11,
                paddingVertical: 6,
                borderRadius: 7
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>🏠 ACCUEIL</Text>
            </View>

            <View
              onPress={() => currentScreen.set("recompiler")}
              style={{
                backgroundColor: currentScreen() === "recompiler" ? "#ed1e79" : "#17171c",
                paddingHorizontal: 11,
                paddingVertical: 6,
                borderRadius: 7
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>⚡ RECOMPILATEUR</Text>
            </View>

            <View
              onPress={() => currentScreen.set("settings")}
              style={{
                backgroundColor: currentScreen() === "settings" ? "#ed1e79" : "#17171c",
                paddingHorizontal: 11,
                paddingVertical: 6,
                borderRadius: 7
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>⚙️ PARAMÈTRES</Text>
            </View>

            <View
              onPress={() => currentScreen.set("saves")}
              style={{
                backgroundColor: currentScreen() === "saves" ? "#ed1e79" : "#17171c",
                paddingHorizontal: 11,
                paddingVertical: 6,
                borderRadius: 7
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>💾 SAUVEGARDES</Text>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* SCREEN 1: DESKTOP HOME SCREEN WITH VICE CITY DUSK BACKDROP     */}
      {/* ============================================================== */}
      {currentScreen() === "home" && (
        <Scroll style={{ flex: 1 }}>
          {/* ---------------------------------------------------------- */}
          {/* VICE CITY AT DUSK SYNTHWAVE BACKDROP                       */}
          {/* ---------------------------------------------------------- */}
          <View
            style={{
              height: 240,
              backgroundColor: "#150a1a",
              position: "relative",
              overflow: "hidden",
              justifyContent: "flex-end",
              paddingHorizontal: 20,
              paddingBottom: 20,
              borderBottomWidth: 2,
              borderBottomColor: "#421235"
            }}
          >
            {/* Dusk Sun (Striped Neon Horizon) */}
            <View
              style={{
                position: "absolute",
                bottom: -20,
                right: "15%",
                width: 170,
                height: 170,
                borderRadius: 85,
                backgroundColor: "#f7931e",
                alignItems: "center",
                justifyContent: "center",
                shadow: "0 0 40px #ed1e79",
                opacity: 0.95
              }}
            >
              {/* Laser Horizon Stripes across Sun */}
              <View style={{ position: "absolute", top: 35, width: "100%", height: 3, backgroundColor: "#150a1a" }} />
              <View style={{ position: "absolute", top: 60, width: "100%", height: 5, backgroundColor: "#150a1a" }} />
              <View style={{ position: "absolute", top: 90, width: "100%", height: 7, backgroundColor: "#150a1a" }} />
              <View style={{ position: "absolute", top: 125, width: "100%", height: 9, backgroundColor: "#150a1a" }} />
            </View>

            {/* Ocean Beach Art Deco Skyline Silhouettes */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 70,
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 5,
                paddingHorizontal: 10,
                opacity: 0.85
              }}
            >
              <View style={{ width: 35, height: 42, backgroundColor: "#0c060e", borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
              <View style={{ width: 28, height: 60, backgroundColor: "#0c060e", borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              <View style={{ width: 44, height: 48, backgroundColor: "#0c060e" }} />
              <View style={{ width: 22, height: 68, backgroundColor: "#0c060e", alignItems: "center" }}>
                <View style={{ width: 2, height: 12, backgroundColor: "#ff9ec8" }} />
              </View>
              <View style={{ width: 38, height: 38, backgroundColor: "#0c060e" }} />
              <View style={{ width: 32, height: 54, backgroundColor: "#0c060e" }} />
              <View style={{ width: 46, height: 40, backgroundColor: "#0c060e" }} />
              <View style={{ width: 26, height: 62, backgroundColor: "#0c060e" }} />
              <View style={{ width: 40, height: 45, backgroundColor: "#0c060e" }} />
            </View>

            {/* Palm Trees & Beach Motif */}
            <View style={{ position: "absolute", bottom: 0, left: 16, opacity: 0.9 }}>
              <Text style={{ fontSize: 44 }}>🌴</Text>
            </View>

            {/* Desktop Hero Title */}
            <View style={{ zIndex: 10 }}>
              <Text style={{ color: "#ed1e79", fontSize: 11, fontWeight: "bold", letterSpacing: 2 }}>
                LEONIDAS VICE CITY STORIES
              </Text>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 34,
                  fontWeight: "bold",
                  letterSpacing: 2,
                  marginTop: 2,
                  textShadow: "0 0 16px #ed1e79"
                }}
              >
                Vice City Stories
              </Text>
              <Text style={{ color: "#ada6ac", fontSize: 12, marginTop: 4 }}>
                Portage Mobile HD Remake · Recompilateur PS2 AOT Embarqué · Modding VFS
              </Text>
            </View>
          </View>

          {/* ---------------------------------------------------------- */}
          {/* RECOMPILATION OVERLAY OR HERO BUTTON                       */}
          {/* ---------------------------------------------------------- */}
          <View style={{ padding: 18 }}>
            {/* Live Recompilation Modal if active */}
            {isRecompiling() ? (
              <View
                style={{
                  backgroundColor: "#160b29",
                  borderRadius: 14,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: "#ed1e79",
                  marginBottom: 18
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Text style={{ color: "#29abe2", fontSize: 14, fontWeight: "bold" }}>
                    ⚡ RECOMPILATEUR AUTONOME EN COURS...
                  </Text>
                  <Text style={{ color: "#ed1e79", fontSize: 16, fontWeight: "bold" }}>
                    {recompileProgress()}%
                  </Text>
                </View>

                {/* Progress Bar */}
                <View
                  style={{
                    width: "100%",
                    height: 8,
                    backgroundColor: "#0a0414",
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 10
                  }}
                >
                  <View
                    style={{
                      width: `${recompileProgress()}%`,
                      height: "100%",
                      backgroundColor: "#ed1e79"
                    }}
                  />
                </View>
                <Text style={{ color: "#ffffff", fontSize: 12, textAlign: "center", marginBottom: 12 }}>
                  {recompileStage()}
                </Text>

                {/* Live Console Output */}
                <View
                  style={{
                    backgroundColor: "#08040f",
                    borderRadius: 8,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: "#201138"
                  }}
                >
                  {recompilerLogs().slice(-3).map((log, i) => (
                    <Text key={i} style={{ color: "#29abe2", fontSize: 10, fontFamily: "monospace" }}>
                      {log}
                    </Text>
                  ))}
                </View>
              </View>
            ) : (
              /* Big Desktop-Style Primary Hero Button */
              <View
                onPress={() => triggerOnDeviceRecompile(true)}
                style={{
                  backgroundColor: "#ed1e79",
                  borderRadius: 14,
                  paddingVertical: 18,
                  paddingHorizontal: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  borderWidth: 1.5,
                  borderColor: "#ff4c9d",
                  shadow: "0 0 24px #ed1e7966"
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "bold", letterSpacing: 2 }}>
                  ▶ {isRecompiled() ? "LANCER VICE CITY STORIES" : "RECOMPILER L'ISO ET JOUER"}
                </Text>
                <Text style={{ color: "#ffffffcc", fontSize: 11, marginTop: 4, fontWeight: "bold" }}>
                  {isRecompiled()
                    ? "Cache AOT compilé et prêt • Rendu Vulkan 60 FPS"
                    : "Recompilation statique MIPS R5900 directement sur ce téléphone"}
                </Text>
              </View>
            )}

            {/* -------------------------------------------------------- */}
            {/* THREE DESKTOP-STYLE QUIET TRANSLUCENT GLASS CARDS        */}
            {/* -------------------------------------------------------- */}
            <View style={{ gap: 12 }}>
              {/* Card 1: Disc Image (ISO / ROM) */}
              <View
                onPress={() => isEditingPath.set(!isEditingPath())}
                style={{
                  backgroundColor: "#17171c",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#2a2a33",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#ed1e7922",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>💿</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#f8f4f6", fontSize: 14, fontWeight: "bold" }}>
                      Image Disque PS2 (ISO)
                    </Text>
                    <Text style={{ color: "#29abe2", fontSize: 12, marginTop: 2 }}>
                      {romId()} · {romSize()}
                    </Text>
                    <Text style={{ color: "#726b71", fontSize: 10, marginTop: 2 }}>
                      {romPath()}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: "#12211e",
                    borderWidth: 1,
                    borderColor: "#00e676",
                    borderRadius: 14,
                    paddingHorizontal: 8,
                    paddingVertical: 3
                  }}
                >
                  <Text style={{ color: "#00e676", fontSize: 10, fontWeight: "bold" }}>✓ MONTÉE</Text>
                </View>
              </View>

              {/* ISO Selection Presets & Path Editor if toggled */}
              {isEditingPath() && (
                <View
                  style={{
                    backgroundColor: "#101014",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#ed1e79"
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>
                    Sélectionnez une image disque ou saisissez son chemin :
                  </Text>
                  <Input
                    value={customPathInput()}
                    onChangeText={(val) => customPathInput.set(val)}
                    placeholder="/sdcard/Download/mon_jeu.iso"
                    style={{
                      backgroundColor: "#17171c",
                      color: "#ffffff",
                      padding: 10,
                      borderRadius: 6,
                      fontSize: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: "#2a2a33"
                    }}
                  />
                  <View
                    onPress={() => {
                      if (customPathInput().trim()) {
                        romPath.set(customPathInput().trim());
                        isEditingPath.set(false);
                      }
                    }}
                    style={{
                      backgroundColor: "#ed1e79",
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignItems: "center",
                      marginBottom: 10
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>CONFIRMER LE CHEMIN</Text>
                  </View>

                  <Text style={{ color: "#ada6ac", fontSize: 11, fontWeight: "bold", marginBottom: 6 }}>
                    Emplacements prédéfinis :
                  </Text>
                  <View style={{ gap: 6 }}>
                    {presetRoms.map((preset) => (
                      <View
                        key={preset.path}
                        onPress={() => {
                          romPath.set(preset.path);
                          romId.set(preset.id);
                          isEditingPath.set(false);
                        }}
                        style={{
                          backgroundColor: romPath() === preset.path ? "#ed1e7922" : "#17171c",
                          padding: 10,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: romPath() === preset.path ? "#ed1e79" : "#2a2a33"
                        }}
                      >
                        <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>{preset.label}</Text>
                        <Text style={{ color: "#726b71", fontSize: 10 }}>{preset.path}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Card 2: Embedded ARM64 AOT Recompiler */}
              <View
                onPress={() => currentScreen.set("recompiler")}
                style={{
                  backgroundColor: "#17171c",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#2a2a33",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#29abe222",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>⚡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#f8f4f6", fontSize: 14, fontWeight: "bold" }}>
                      Recompilateur Statique AOT ARM64
                    </Text>
                    <Text style={{ color: "#29abe2", fontSize: 12, marginTop: 2 }}>
                      11 218 fonctions EE · 24 microprogrammes VU1 NEON
                    </Text>
                    <Text style={{ color: "#726b71", fontSize: 10, marginTop: 2 }}>
                      {isRecompiled() ? "Cache actif · Démarrage instantané" : "Prêt pour compilation autonome sur l'appareil"}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: "#17171c",
                    borderWidth: 1,
                    borderColor: "#ed1e79",
                    borderRadius: 14,
                    paddingHorizontal: 8,
                    paddingVertical: 3
                  }}
                >
                  <Text style={{ color: "#ed1e79", fontSize: 10, fontWeight: "bold" }}>GÉRER ›</Text>
                </View>
              </View>

              {/* Card 3: TouchPort Controls & Remaster */}
              <View
                onPress={() => currentScreen.set("settings")}
                style={{
                  backgroundColor: "#17171c",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#2a2a33",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 10 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "#f7931e22",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>🕹️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#f8f4f6", fontSize: 14, fontWeight: "bold" }}>
                      HUD Mobile TouchPort & Moteur 60 FPS
                    </Text>
                    <Text style={{ color: "#f7931e", fontSize: 12, marginTop: 2 }}>
                      Joystick Flottant · Drag-to-Aim · Auto-Sprint
                    </Text>
                    <Text style={{ color: "#726b71", fontSize: 10, marginTop: 2 }}>
                      Rendu MSAA 4x · Widescreen 20:9 natif
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: "#17171c",
                    borderWidth: 1,
                    borderColor: "#29abe2",
                    borderRadius: 14,
                    paddingHorizontal: 8,
                    paddingVertical: 3
                  }}
                >
                  <Text style={{ color: "#29abe2", fontSize: 10, fontWeight: "bold" }}>CONFIGURER ›</Text>
                </View>
              </View>
            </View>
          </View>
        </Scroll>
      )}

      {/* ============================================================== */}
      {/* SCREEN 2: DEDICATED EMBEDDED RECOMPILER DASHBOARD              */}
      {/* ============================================================== */}
      {currentScreen() === "recompiler" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          {/* Dashboard Header */}
          <View
            style={{
              backgroundColor: "#17171c",
              borderRadius: 14,
              padding: 18,
              borderWidth: 1.5,
              borderColor: "#2a2a33",
              marginBottom: 16
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <Text style={{ color: "#ed1e79", fontSize: 16, fontWeight: "bold" }}>
                ⚡ MOTEUR DE RECOMPILATION EMBARQUÉ
              </Text>
              <View
                style={{
                  backgroundColor: isRecompiled() ? "#12211e" : "#26131a",
                  borderWidth: 1,
                  borderColor: isRecompiled() ? "#00e676" : "#ed1e79",
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 3
                }}
              >
                <Text style={{ color: isRecompiled() ? "#00e676" : "#ed1e79", fontSize: 10, fontWeight: "bold" }}>
                  {isRecompiled() ? "CACHE COMPIILÉ" : "NON COMPILÉ"}
                </Text>
              </View>
            </View>

            <Text style={{ color: "#ada6ac", fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
              Ce recompilateur statique embarqué extrait le binaire MIPS Emotion Engine de votre ISO
              et génère directement les blocs d'instructions vectoriels ARM NEON sans avoir besoin d'un PC.
            </Text>

            {/* Technical Stats Grid */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1, backgroundColor: "#101014", padding: 12, borderRadius: 8 }}>
                <Text style={{ color: "#726b71", fontSize: 10, fontWeight: "bold" }}>FONCTIONS EE</Text>
                <Text style={{ color: "#29abe2", fontSize: 18, fontWeight: "bold", marginTop: 2 }}>
                  {recompiledFunctions().toLocaleString()}
                </Text>
                <Text style={{ color: "#726b71", fontSize: 9 }}>MIPS R5900</Text>
              </View>

              <View style={{ flex: 1, backgroundColor: "#101014", padding: 12, borderRadius: 8 }}>
                <Text style={{ color: "#726b71", fontSize: 10, fontWeight: "bold" }}>MICROCODES VU1</Text>
                <Text style={{ color: "#f7931e", fontSize: 18, fontWeight: "bold", marginTop: 2 }}>
                  {recompiledVu1()}
                </Text>
                <Text style={{ color: "#726b71", fontSize: 9 }}>Vecteurs NEON</Text>
              </View>

              <View style={{ flex: 1, backgroundColor: "#101014", padding: 12, borderRadius: 8 }}>
                <Text style={{ color: "#726b71", fontSize: 10, fontWeight: "bold" }}>ARCH VIBE</Text>
                <Text style={{ color: "#00e676", fontSize: 18, fontWeight: "bold", marginTop: 2 }}>
                  AArch64
                </Text>
                <Text style={{ color: "#726b71", fontSize: 9 }}>SIMD Natif</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View
                onPress={() => triggerOnDeviceRecompile(false)}
                style={{
                  flex: 2,
                  backgroundColor: "#ed1e79",
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center"
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>
                  ⚡ FORCER LA RECOMPILATION
                </Text>
              </View>

              <View
                onPress={() => {
                  isRecompiled.set(false);
                  const l = [...recompilerLogs()];
                  l.push("[cache] Cache AOT réinitialisé");
                  recompilerLogs.set(l);
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#2a1645",
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center"
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>
                  🗑️ VIDER
                </Text>
              </View>
            </View>
          </View>

          {/* Terminal Logs Output */}
          <View
            style={{
              backgroundColor: "#08040f",
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: "#201138"
            }}
          >
            <Text style={{ color: "#ada6ac", fontSize: 11, fontWeight: "bold", marginBottom: 8 }}>
              JOURNAL DU RECOMPILATEUR STATIQUE (MIPS / NEON) :
            </Text>
            {recompilerLogs().map((log, index) => (
              <Text
                key={index}
                style={{
                  color: log.includes("[succès]") ? "#00e676" : log.includes("[recompile]") ? "#ed1e79" : "#29abe2",
                  fontSize: 11,
                  fontFamily: "monospace",
                  lineHeight: 16
                }}
              >
                {log}
              </Text>
            ))}
          </View>
        </Scroll>
      )}

      {/* ============================================================== */}
      {/* SCREEN 3: IN-GAME HUD WITH TOUCHPORT CONTROLLER               */}
      {/* ============================================================== */}
      {currentScreen() === "game" && (
        <View style={{ flex: 1, position: "relative" }}>
          {/* 3D Gameplay World Canvas Container */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#04020a",
              justifyContent: "space-between",
              padding: 12,
              position: "relative"
            }}
          >
            {/* Center Game Scene Aesthetic (Vice City Horizon) */}
            <View
              style={{
                position: "absolute",
                top: "22%",
                left: "20%",
                right: "20%",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Text style={{ color: "#ed1e79", fontSize: 32, fontWeight: "bold", letterSpacing: 4, textShadow: "0 0 12px #ed1e79" }}>
                VICE CITY STORIES
              </Text>
              <Text style={{ color: "#29abe2", fontSize: 13, letterSpacing: 2, marginTop: 4 }}>
                RECOMPILATEUR ARM64 AOT • 60 FPS • {locationName()}
              </Text>
              
              {/* Dynamic feedback indicator */}
              <View
                style={{
                  backgroundColor: "#180e2ccc",
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginTop: 18,
                  borderWidth: 1,
                  borderColor: "#ed1e79"
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 13 }}>
                  Contrôle actif : <Text style={{ color: "#29abe2", fontWeight: "bold" }}>{lastPressedBtn()}</Text>
                </Text>
              </View>
            </View>

            {/* -------------------------------------------------------- */}
            {/* TOP BAR: TOUCHPORT QUICK TOGGLES & AUTHENTIC GTA HUD     */}
            {/* -------------------------------------------------------- */}
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                zIndex: 10
              }}
            >
              {/* Top-Left: TouchPort Controls (Menu, Opacity, Settings Gear ⚙️) */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  onPress={() => currentScreen.set("home")}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderWidth: 1.5,
                    borderColor: "#ed1e79",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 7
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>
                    ⏸ PAUSE
                  </Text>
                </View>

                {/* TouchPort Gear Button (⚙️) for HUD customization */}
                <View
                  onPress={() => inGameMenuOpen.set(!inGameMenuOpen())}
                  style={{
                    backgroundColor: inGameMenuOpen() ? "#ed1e79" : "#160b2bdd",
                    borderWidth: 1,
                    borderColor: inGameMenuOpen() ? "#ffffff" : "#29abe2",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 7
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>
                    ⚙️ HUD
                  </Text>
                </View>

                {/* Opacity quick cycler */}
                <View
                  onPress={() => {
                    const next = controllerOpacity() === 75 ? 50 : controllerOpacity() === 50 ? 100 : 75;
                    controllerOpacity.set(next);
                  }}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderWidth: 1,
                    borderColor: "#3b2066",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 7
                  }}
                >
                  <Text style={{ color: "#29abe2", fontSize: 11, fontWeight: "bold" }}>
                    {controllerOpacity()}%
                  </Text>
                </View>
              </View>

              {/* Top-Right: AUTHENTIC GTA VICE CITY STORIES HUD */}
              <View
                style={{
                  backgroundColor: "#0a0414dd",
                  borderRadius: 12,
                  padding: 10,
                  borderWidth: 1.5,
                  borderColor: "#2a154a",
                  flexDirection: "row",
                  gap: 14,
                  alignItems: "center"
                }}
              >
                {/* Weapon Box with Ammo Display */}
                <View
                  onPress={() => handleButtonPress("Changement Arme", "weapon_next")}
                  style={{
                    width: 64,
                    height: 52,
                    backgroundColor: "#140826",
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: "#29abe2",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative"
                  }}
                >
                  <Text style={{ fontSize: 22 }}>
                    {weapons[activeWeaponIndex()].icon}
                  </Text>
                  {weapons[activeWeaponIndex()].clip ? (
                    <Text style={{ color: "#29abe2", fontSize: 10, fontWeight: "bold", position: "absolute", bottom: 2 }}>
                      {weapons[activeWeaponIndex()].clip}-{weapons[activeWeaponIndex()].ammo}
                    </Text>
                  ) : (
                    <Text style={{ color: "#29abe2", fontSize: 10, fontWeight: "bold", position: "absolute", bottom: 2 }}>
                      {weapons[activeWeaponIndex()].ammo}
                    </Text>
                  )}
                </View>

                {/* Health, Armor, Stars, Money, Time */}
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", width: 145 }}>
                    <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                      {gameTime()}
                    </Text>
                    <Text style={{ color: "#00e676", fontSize: 15, fontWeight: "bold" }}>
                      ${playerCash().toLocaleString()}
                    </Text>
                  </View>

                  {/* Health Bar */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "#ed1e79", fontSize: 11 }}>❤️</Text>
                    <View style={{ width: 115, height: 10, backgroundColor: "#3a0e22", borderRadius: 5, overflow: "hidden" }}>
                      <View style={{ width: `${playerHealth()}%`, height: "100%", backgroundColor: "#ed1e79" }} />
                    </View>
                  </View>

                  {/* Armor Bar */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "#29abe2", fontSize: 11 }}>🛡️</Text>
                    <View style={{ width: 115, height: 10, backgroundColor: "#0b2838", borderRadius: 5, overflow: "hidden" }}>
                      <View style={{ width: `${playerArmor()}%`, height: "100%", backgroundColor: "#29abe2" }} />
                    </View>
                  </View>

                  {/* Wanted Stars */}
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {[1, 2, 3, 4, 5, 6].map((star) => (
                      <Text
                        key={star}
                        style={{
                          color: star <= wantedStars() ? "#ffe600" : "#3c2a54",
                          fontSize: 13,
                          fontWeight: "bold"
                        }}
                      >
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* In-Game TouchPort HUD Settings Popup */}
            {inGameMenuOpen() && (
              <View
                style={{
                  position: "absolute",
                  top: 60,
                  left: 12,
                  width: 320,
                  backgroundColor: "#130a24f0",
                  borderRadius: 14,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: "#ed1e79",
                  zIndex: 20
                }}
              >
                <Text style={{ color: "#ed1e79", fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>
                  ⚙️ CONFIGURATION DU HUD TOUCHPORT
                </Text>

                {/* Auto-sprint toggle */}
                <View
                  onPress={() => autoSprintEnabled.set(!autoSprintEnabled())}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12 }}>Auto-Sprint au Joystick</Text>
                  <Text style={{ color: autoSprintEnabled() ? "#00e676" : "#888", fontSize: 12, fontWeight: "bold" }}>
                    {autoSprintEnabled() ? "OUI" : "NON"}
                  </Text>
                </View>

                {/* Floating Joystick toggle */}
                <View
                  onPress={() => floatingJoyEnabled.set(!floatingJoyEnabled())}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12 }}>Joystick Flottant</Text>
                  <Text style={{ color: floatingJoyEnabled() ? "#00e676" : "#888", fontSize: 12, fontWeight: "bold" }}>
                    {floatingJoyEnabled() ? "OUI" : "FIXE"}
                  </Text>
                </View>

                {/* Button scale toggle */}
                <View
                  onPress={() => buttonScale.set(buttonScale() === "Normal" ? "Large" : "Normal")}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12 }}>Taille des Boutons</Text>
                  <Text style={{ color: "#29abe2", fontSize: 12, fontWeight: "bold" }}>
                    {buttonScale()}
                  </Text>
                </View>

                {/* Close Button */}
                <View
                  onPress={() => inGameMenuOpen.set(false)}
                  style={{
                    backgroundColor: "#ed1e79",
                    paddingVertical: 8,
                    borderRadius: 6,
                    alignItems: "center",
                    marginTop: 10
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>FERMER</Text>
                </View>
              </View>
            )}

            {/* -------------------------------------------------------- */}
            {/* BOTTOM-LEFT: AUTHENTIC RADAR MINIMAP                     */}
            {/* -------------------------------------------------------- */}
            <View
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                alignItems: "flex-start",
                zIndex: 10
              }}
            >
              {/* Circular Radar Disk */}
              <View
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 52,
                  backgroundColor: "#0a1322ee",
                  borderWidth: 2,
                  borderColor: "#29abe2",
                  position: "relative",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden"
                }}
              >
                <View style={{ position: "absolute", width: "100%", height: 2, backgroundColor: "#182c4a" }} />
                <View style={{ position: "absolute", height: "100%", width: 2, backgroundColor: "#182c4a" }} />
                <View style={{ position: "absolute", width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: "#182c4a" }} />
                <Text style={{ position: "absolute", top: 4, color: "#ffffff", fontSize: 10, fontWeight: "bold" }}>N</Text>
                
                {/* Player Blip */}
                <View style={{ width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#ed1e79", fontSize: 16, fontWeight: "bold" }}>▲</Text>
                </View>

                {/* Objective Marker */}
                <View
                  style={{
                    position: "absolute",
                    top: 28,
                    right: 26,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#ffe600"
                  }}
                />
              </View>

              {/* Location banner */}
              <View
                style={{
                  backgroundColor: "#0d061bcc",
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  marginTop: 6,
                  borderWidth: 1,
                  borderColor: "#ed1e79"
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "bold" }}>
                  {locationName()}
                </Text>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* TOUCHPORT VIRTUAL CONTROLLER OVERLAY                         */}
          {/* ============================================================ */}
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
            {/* ---------------------------------------------------------- */}
            {/* LEFT ZONE: L1 / L2, D-PAD, TOUCHPORT FLOATING JOYSTICK     */}
            {/* ---------------------------------------------------------- */}
            <View
              style={{
                width: 250,
                justifyContent: "space-between",
                paddingTop: 50,
                paddingBottom: 10
              }}
            >
              {/* Shoulder Bumper L1 & L2 */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View
                  onPress={() => handleButtonPress("L1 (Visée Lock-on)", "aim_drag")}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderWidth: 1.5,
                    borderColor: "#29abe2",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#29abe2", fontSize: 13, fontWeight: "bold" }}>L1</Text>
                  <Text style={{ color: "#a59cb8", fontSize: 8 }}>VISÉE</Text>
                </View>

                <View
                  onPress={() => handleButtonPress("L2 (Arme précédente)", "weapon_prev")}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderWidth: 1.5,
                    borderColor: "#29abe2",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#29abe2", fontSize: 13, fontWeight: "bold" }}>L2</Text>
                  <Text style={{ color: "#a59cb8", fontSize: 8 }}>PRÉC.</Text>
                </View>
              </View>

              {/* D-Pad + TouchPort Floating Analog Stick */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
                {/* D-Pad Cross */}
                <View style={{ alignItems: "center" }}>
                  <View
                    onPress={() => handleButtonPress("D-PAD HAUT")}
                    style={{
                      width: 42,
                      height: 42,
                      backgroundColor: "#140926dd",
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: "#371d5c",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#29abe2", fontSize: 17, fontWeight: "bold" }}>▲</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 42, marginVertical: 3 }}>
                    <View
                      onPress={() => handleButtonPress("D-PAD GAUCHE")}
                      style={{
                        width: 42,
                        height: 42,
                        backgroundColor: "#140926dd",
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: "#371d5c",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: "#29abe2", fontSize: 17, fontWeight: "bold" }}>◀</Text>
                    </View>

                    <View
                      onPress={() => handleButtonPress("D-PAD DROITE")}
                      style={{
                        width: 42,
                        height: 42,
                        backgroundColor: "#140926dd",
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: "#371d5c",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: "#29abe2", fontSize: 17, fontWeight: "bold" }}>▶</Text>
                    </View>
                  </View>

                  <View
                    onPress={() => handleButtonPress("D-PAD BAS")}
                    style={{
                      width: 42,
                      height: 42,
                      backgroundColor: "#140926dd",
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: "#371d5c",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#29abe2", fontSize: 17, fontWeight: "bold" }}>▼</Text>
                  </View>
                </View>

                {/* TouchPort Style Floating Analog Joystick */}
                <View
                  onPress={() => handleButtonPress("JOYSTICK GAUCHE (Course/Déplacement)", autoSprintEnabled() ? "sprint" : undefined)}
                  style={{
                    width: 98,
                    height: 98,
                    borderRadius: 49,
                    backgroundColor: "#100720bb",
                    borderWidth: 2,
                    borderColor: "#29abe266",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: "#ed1e79",
                      borderWidth: 2,
                      borderColor: "#ffffff",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>L3</Text>
                    {autoSprintEnabled() && (
                      <Text style={{ color: "#ffe600", fontSize: 8, fontWeight: "bold" }}>RUN</Text>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* ---------------------------------------------------------- */}
            {/* CENTER: SELECT & START BUTTONS                             */}
            {/* ---------------------------------------------------------- */}
            <View style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View
                  onPress={() => handleButtonPress("SELECT (Vue Caméra)")}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderRadius: 12,
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "#442475"
                  }}
                >
                  <Text style={{ color: "#bfaee3", fontSize: 11, fontWeight: "bold" }}>SELECT</Text>
                </View>

                <View
                  onPress={() => handleButtonPress("START (Pause / Carte)")}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderRadius: 12,
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "#442475"
                  }}
                >
                  <Text style={{ color: "#bfaee3", fontSize: 11, fontWeight: "bold" }}>START</Text>
                </View>
              </View>
            </View>

            {/* ---------------------------------------------------------- */}
            {/* RIGHT ZONE: R1 / R2, SONY PS BUTTONS, TOUCHPORT DRAG-AIM   */}
            {/* ---------------------------------------------------------- */}
            <View
              style={{
                width: 250,
                alignItems: "flex-end",
                justifyContent: "space-between",
                paddingTop: 50,
                paddingBottom: 10
              }}
            >
              {/* Shoulder Bumper R1 & R2 */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View
                  onPress={() => handleButtonPress("R2 (Arme suivante)", "weapon_next")}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderWidth: 1.5,
                    borderColor: "#ed1e79",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#ed1e79", fontSize: 13, fontWeight: "bold" }}>R2</Text>
                  <Text style={{ color: "#a59cb8", fontSize: 8 }}>SUIV.</Text>
                </View>

                <View
                  onPress={() => handleButtonPress("R1 (Tir / Attaque)", "fire")}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderWidth: 1.5,
                    borderColor: "#ed1e79",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#ed1e79", fontSize: 13, fontWeight: "bold" }}>R1</Text>
                  <Text style={{ color: "#a59cb8", fontSize: 8 }}>TIR</Text>
                </View>
              </View>

              {/* Action Cluster + Drag-to-Aim / Right Stick */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
                {/* TouchPort Drag-to-Aim / Camera Stick */}
                <View
                  onPress={() => handleButtonPress("DRAG-TO-AIM (Caméra libre)", "aim_drag")}
                  style={{
                    width: 98,
                    height: 98,
                    borderRadius: 49,
                    backgroundColor: "#100720bb",
                    borderWidth: 2,
                    borderColor: "#ed1e7966",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: "#29abe2",
                      borderWidth: 2,
                      borderColor: "#ffffff",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>R3</Text>
                    <Text style={{ color: "#000000", fontSize: 8, fontWeight: "bold" }}>AIM</Text>
                  </View>
                </View>

                {/* PlayStation Action Buttons Diamond */}
                <View style={{ alignItems: "center" }}>
                  {/* TRIANGLE (▲ Vert) */}
                  <View
                    onPress={() => handleButtonPress("▲ TRIANGLE (Véhicule)")}
                    style={{
                      width: btnDiameter(),
                      height: btnDiameter(),
                      borderRadius: btnDiameter() / 2,
                      backgroundColor: "#140926dd",
                      borderWidth: 2,
                      borderColor: "#00e676",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#00e676", fontSize: 21, fontWeight: "bold" }}>▲</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: btnDiameter(), marginVertical: 3 }}>
                    {/* SQUARE (■ Rose) */}
                    <View
                      onPress={() => handleButtonPress("■ CARRÉ (Frein / Saut)")}
                      style={{
                        width: btnDiameter(),
                        height: btnDiameter(),
                        borderRadius: btnDiameter() / 2,
                        backgroundColor: "#140926dd",
                        borderWidth: 2,
                        borderColor: "#ed1e79",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: "#ed1e79", fontSize: 21, fontWeight: "bold" }}>■</Text>
                    </View>

                    {/* CIRCLE (● Rouge) */}
                    <View
                      onPress={() => handleButtonPress("● ROND (Attaque / Tir)", "fire")}
                      style={{
                        width: btnDiameter(),
                        height: btnDiameter(),
                        borderRadius: btnDiameter() / 2,
                        backgroundColor: "#140926dd",
                        borderWidth: 2,
                        borderColor: "#ff3d00",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: "#ff3d00", fontSize: 21, fontWeight: "bold" }}>●</Text>
                    </View>
                  </View>

                  {/* CROSS (✕ Bleu) */}
                  <View
                    onPress={() => handleButtonPress("✕ CROIX (Sprint / Accélérer)", "sprint")}
                    style={{
                      width: btnDiameter(),
                      height: btnDiameter(),
                      borderRadius: btnDiameter() / 2,
                      backgroundColor: "#140926dd",
                      borderWidth: 2,
                      borderColor: "#29abe2",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#29abe2", fontSize: 21, fontWeight: "bold" }}>✕</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* SCREEN 4: SETTINGS (GRAPHICS, RECOMPILER, CONTROLS)            */}
      {/* ============================================================== */}
      {currentScreen() === "settings" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          <View
            style={{
              backgroundColor: "#17171c",
              borderRadius: 14,
              padding: 18,
              borderWidth: 1.5,
              borderColor: "#2a2a33",
              marginBottom: 16
            }}
          >
            <Text style={{ color: "#ed1e79", fontSize: 16, fontWeight: "bold", marginBottom: 14 }}>
              PARAMÈTRES GRAPHIQUES & MOTEUR NOUVELLE GÉNÉRATION
            </Text>

            {/* HD Remaster Toggle */}
            <View
              onPress={() => hdRemasterEnabled.set(!hdRemasterEnabled())}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#201138"
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Moteur Recompilateur HD (MSAA + Filtrage)
                </Text>
                <Text style={{ color: "#ada6ac", fontSize: 11 }}>
                  Anti-aliasing MSAA 4x natif sur GPU Vulkan / Adreno / Mali
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: hdRemasterEnabled() ? "#00e676" : "#2f1b47",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12
                }}
              >
                <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>
                  {hdRemasterEnabled() ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </Text>
              </View>
            </View>

            {/* 60 FPS Target */}
            <View
              onPress={() => fpsTarget.set(fpsTarget() === 60 ? 30 : 60)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#201138"
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Taux de rafraîchissement
                </Text>
                <Text style={{ color: "#ada6ac", fontSize: 11 }}>
                  Mode 60 FPS ultra fluide sur processeurs ARM Snapdragon / Dimensity
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: fpsTarget() === 60 ? "#29abe2" : "#2f1b47",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12
                }}
              >
                <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>
                  {fpsTarget()} FPS
                </Text>
              </View>
            </View>

            {/* Widescreen Fix */}
            <View
              onPress={() => widescreenFix.set(!widescreenFix())}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Format Plein Écran Large (16:9 / 20:9)
                </Text>
                <Text style={{ color: "#ada6ac", fontSize: 11 }}>
                  FOV étendu sans étirement des personnages ni du radar
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: widescreenFix() ? "#00e676" : "#2f1b47",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12
                }}
              >
                <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>
                  {widescreenFix() ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </Text>
              </View>
            </View>
          </View>

          {/* TouchPort Configuration */}
          <View
            style={{
              backgroundColor: "#17171c",
              borderRadius: 14,
              padding: 18,
              borderWidth: 1.5,
              borderColor: "#2a2a33",
              marginBottom: 20
            }}
          >
            <Text style={{ color: "#29abe2", fontSize: 16, fontWeight: "bold", marginBottom: 14 }}>
              OPTIONS DE LA MANETTE TACTILE TOUCHPORT
            </Text>

            {/* Auto-sprint toggle */}
            <View
              onPress={() => autoSprintEnabled.set(!autoSprintEnabled())}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#201138"
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Auto-Sprint (Course Automatique)
                </Text>
                <Text style={{ color: "#ada6ac", fontSize: 11 }}>
                  Maintient la touche sprint lorsque le joystick est poussé à plus de 80%
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: autoSprintEnabled() ? "#00e676" : "#2f1b47",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12
                }}
              >
                <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>
                  {autoSprintEnabled() ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </Text>
              </View>
            </View>

            {/* Floating Joystick toggle */}
            <View
              onPress={() => floatingJoyEnabled.set(!floatingJoyEnabled())}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#201138"
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Joystick Flottant Dynamique
                </Text>
                <Text style={{ color: "#ada6ac", fontSize: 11 }}>
                  Le joystick apparaît directement sous le pouce gauche à l'écran
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: floatingJoyEnabled() ? "#00e676" : "#2f1b47",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12
                }}
              >
                <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>
                  {floatingJoyEnabled() ? "FLOTTANT" : "FIXE"}
                </Text>
              </View>
            </View>

            {/* Haptic Vibrations */}
            <View
              onPress={() => hapticFeedback.set(!hapticFeedback())}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Retour Haptique Vibrant
                </Text>
                <Text style={{ color: "#ada6ac", fontSize: 11 }}>
                  Vibre à chaque appui sur les boutons virtuels
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: hapticFeedback() ? "#00e676" : "#2f1b47",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12
                }}
              >
                <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>
                  {hapticFeedback() ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </Text>
              </View>
            </View>
          </View>
        </Scroll>
      )}

      {/* ============================================================== */}
      {/* SCREEN 5: SAVES & MEMORY CARD                                  */}
      {/* ============================================================== */}
      {currentScreen() === "saves" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          <View
            style={{
              backgroundColor: "#17171c",
              borderRadius: 14,
              padding: 18,
              borderWidth: 1.5,
              borderColor: "#2a2a33",
              marginBottom: 16
            }}
          >
            <Text style={{ color: "#ed1e79", fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
              CARTES MÉMOIRES PS2 (8 MB)
            </Text>
            <Text style={{ color: "#ada6ac", fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
              Vos sauvegardes sont automatiquement synchronisées dans le stockage applicatif Android
              au format binaire standard PlayStation 2.
            </Text>

            <View style={{ gap: 10 }}>
              <View
                style={{
                  backgroundColor: "#101014",
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#2a2a33",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View>
                  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
                    SLOT 1 : Carte Mémoire Interne
                  </Text>
                  <Text style={{ color: "#29abe2", fontSize: 11 }}>
                    vcs_memcard1.bin (Sauvegardes actives)
                  </Text>
                </View>
                <View style={{ backgroundColor: "#12211e", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: "#00e676", fontSize: 10, fontWeight: "bold" }}>CONNECTÉE</Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: "#101014",
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#2a2a33",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View>
                  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
                    SLOT 2 : Carte Mémoire Export
                  </Text>
                  <Text style={{ color: "#726b71", fontSize: 11 }}>
                    vcs_memcard2.bin (Vide / Sauvegarde externe)
                  </Text>
                </View>
                <View style={{ backgroundColor: "#20152e", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: "#ada6ac", fontSize: 10, fontWeight: "bold" }}>LIBRE</Text>
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
