import { mount, signal } from "@nlayer/runtime";
import { View, Text, Scroll, Input } from "@nlayer/ui";

function App() {
  // Navigation & Screen state
  const currentScreen = signal<"launcher" | "game" | "settings" | "saves">("launcher");
  
  // ROM Management signals
  const romPath = signal("/sdcard/Download/Grand Theft Auto - Vice City Stories.iso");
  const customPathInput = signal("");
  const isEditingPath = signal(false);
  const romStatus = signal<"ready" | "scanning" | "error">("ready");
  const romSize = signal("4.12 Go");
  const romId = signal("SLUS-21590 (USA v1.02)");
  
  // Boot & Game Engine state
  const bootStep = signal<number>(0);
  const bootMessage = signal<string>("");
  const isBooting = signal<boolean>(false);
  const gamePaused = signal<boolean>(false);
  
  // In-Game HUD state
  const playerHealth = signal<number>(100);
  const playerArmor = signal<number>(100);
  const playerCash = signal<number>(248500);
  const wantedStars = signal<number>(2);
  const gameTime = signal<string>("12:45");
  const locationName = signal<string>("OCEAN BEACH • OCEAN DRIVE");
  const activeWeaponIndex = signal<number>(1);
  const controllerOpacity = signal<number>(85); // 40, 70, 85, 100
  const lastPressedBtn = signal<string>("Aucune");

  // Settings signals
  const hdRemasterEnabled = signal<boolean>(true);
  const antiAliasing = signal<string>("MSAA 4x");
  const fpsTarget = signal<number>(60);
  const hapticFeedback = signal<boolean>(true);
  const widescreenFix = signal<boolean>(true);
  const postFxGlow = signal<boolean>(true);

  // Weapons list for HUD cycling
  const weapons = [
    { name: "POINGS", icon: "👊", ammo: "∞", clip: "" },
    { name: "MICRO SMG (UZI)", icon: "🔫", ammo: "120", clip: "30" },
    { name: "COLT .45", icon: "♦", ammo: "84", clip: "7" },
    { name: "KATANA", icon: "⚔️", ammo: "∞", clip: "" },
    { name: "M4 CARBINE", icon: "💥", ammo: "250", clip: "50" },
    { name: "LANCE-ROQUETTES", icon: "🚀", ammo: "8", clip: "1" }
  ];

  // Quick preset ROM paths
  const presetRoms = [
    { label: "Dossier Téléchargements (USA)", path: "/sdcard/Download/Grand Theft Auto - Vice City Stories.iso", id: "SLUS-21590" },
    { label: "Dossier Téléchargements (EUR)", path: "/sdcard/Download/GTA_Vice_City_Stories_Europe.iso", id: "SLES-54622" },
    { label: "Stockage Émulé (ROMs/PS2)", path: "/storage/emulated/0/ROMs/PS2/vcs.iso", id: "SLUS-21590" },
    { label: "Dossier Racine (vcs.iso)", path: "/sdcard/vcs.iso", id: "SLUS-21590" }
  ];

  // Action feedback handler
  const handleButtonPress = (btnName: string, actionType?: string) => {
    lastPressedBtn.set(btnName);
    if (actionType === "weapon_next") {
      activeWeaponIndex.set((activeWeaponIndex() + 1) % weapons.length);
    } else if (actionType === "weapon_prev") {
      activeWeaponIndex.set((activeWeaponIndex() - 1 + weapons.length) % weapons.length);
    } else if (actionType === "sprint") {
      // Simulate slight health/stamina dynamic
    } else if (actionType === "fire") {
      // Fire action
    }
  };

  // Launch Game with realistic PS2 recompiler boot sequence
  const startRomBootSequence = () => {
    isBooting.set(true);
    bootStep.set(1);
    bootMessage.set("Vérification de l'image disque ISO...");

    setTimeout(() => {
      bootStep.set(2);
      bootMessage.set("Validation exécutable PS2 ELF (SLUS_215.90) & SYSTEM.CNF...");
      
      setTimeout(() => {
        bootStep.set(3);
        bootMessage.set("Initialisation shaders Vulkan & textures HD...");

        setTimeout(() => {
          bootStep.set(4);
          bootMessage.set("Lancement du moteur Leonidas Vice City...");

          setTimeout(() => {
            isBooting.set(false);
            currentScreen.set("game");
          }, 400);
        }, 400);
      }, 400);
    }, 400);
  };

  const getOpacityFloat = () => {
    return controllerOpacity() / 100;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#08050e" }}>
      {/* ============================================================== */}
      {/* TOP NAVIGATION BAR                                             */}
      {/* ============================================================== */}
      {currentScreen() !== "game" && (
        <View
          style={{
            backgroundColor: "#110b1d",
            paddingHorizontal: 18,
            paddingVertical: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottomWidth: 2,
            borderBottomColor: "#ff1493"
          }}
        >
          {/* Logo & Title */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "#ff149322",
                borderWidth: 1.5,
                borderColor: "#ff1493",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10
              }}
            >
              <Text style={{ fontSize: 20 }}>🐊</Text>
            </View>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#ffffff", letterSpacing: 1 }}>
                LEONIDAS <Text style={{ color: "#ff1493" }}>VICE CITY</Text>
              </Text>
              <Text style={{ fontSize: 10, color: "#00f0ff", letterSpacing: 0.5 }}>
                PORTAGE PS2 RECOMPILER • ANDROID
              </Text>
            </View>
          </View>

          {/* Nav Tabs */}
          <View style={{ flexDirection: "row", gap: 6 }}>
            <View
              onPress={() => currentScreen.set("launcher")}
              style={{
                backgroundColor: currentScreen() === "launcher" ? "#ff1493" : "#1e1333",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>🎮 LANCEUR</Text>
            </View>

            <View
              onPress={() => currentScreen.set("settings")}
              style={{
                backgroundColor: currentScreen() === "settings" ? "#ff1493" : "#1e1333",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>⚙️ PARAMÈTRES</Text>
            </View>

            <View
              onPress={() => currentScreen.set("saves")}
              style={{
                backgroundColor: currentScreen() === "saves" ? "#ff1493" : "#1e1333",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>💾 MEMORY CARD</Text>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* SCREEN 1: LAUNCHER & ROM MANAGER                               */}
      {/* ============================================================== */}
      {currentScreen() === "launcher" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          {/* Boot Modal / Loading Overlay */}
          {isBooting() && (
            <View
              style={{
                backgroundColor: "#190d2e",
                borderRadius: 16,
                padding: 24,
                borderWidth: 2,
                borderColor: "#ff1493",
                marginBottom: 20,
                alignItems: "center"
              }}
            >
              <Text style={{ color: "#00f0ff", fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
                LANCEMENT DE LA ROM PS2...
              </Text>
              <View
                style={{
                  width: "100%",
                  height: 8,
                  backgroundColor: "#0b0514",
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 12
                }}
              >
                <View
                  style={{
                    width: `${bootStep() * 25}%`,
                    height: "100%",
                    backgroundColor: "#ff1493"
                  }}
                />
              </View>
              <Text style={{ color: "#ffffff", fontSize: 13, textAlign: "center" }}>
                {bootMessage()}
              </Text>
            </View>
          )}

          {/* Active ROM Card with Sleek Design */}
          <View
            style={{
              backgroundColor: "#130c22",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1.5,
              borderColor: "#2f1b4a",
              marginBottom: 18
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "#ff1493", fontSize: 14, fontWeight: "bold", letterSpacing: 1 }}>
                  DISQUE PS2 SÉLECTIONNÉ
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "#00e67622",
                  borderWidth: 1,
                  borderColor: "#00e676",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4
                }}
              >
                <Text style={{ color: "#00e676", fontSize: 11, fontWeight: "bold" }}>● ISO PRÊTE</Text>
              </View>
            </View>

            {/* ROM Path Display Box */}
            <View
              style={{
                backgroundColor: "#0a0612",
                borderRadius: 10,
                padding: 14,
                borderWidth: 1,
                borderColor: "#211338",
                marginBottom: 14
              }}
            >
              <Text style={{ color: "#8b7eab", fontSize: 11, marginBottom: 4, fontWeight: "bold" }}>
                FICHIER IMAGE ISO :
              </Text>
              <Text style={{ color: "#00f0ff", fontSize: 15, fontWeight: "bold" }}>
                {romPath()}
              </Text>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                <Text style={{ color: "#ffe600", fontSize: 12, fontWeight: "bold" }}>
                  IDENTIFIANT: {romId()}
                </Text>
                <Text style={{ color: "#a59cb8", fontSize: 12 }}>
                  TAILLE: {romSize()}
                </Text>
              </View>
            </View>

            {/* Custom Path Editing Toggle */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <View
                onPress={() => isEditingPath.set(!isEditingPath())}
                style={{
                  backgroundColor: "#201338",
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#3c2266"
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>
                  {isEditingPath() ? "✕ Fermer la saisie" : "✏️ Saisir un autre chemin .iso"}
                </Text>
              </View>
            </View>

            {/* Manual Path Input form if opened */}
            {isEditingPath() && (
              <View
                style={{
                  backgroundColor: "#1a0f30",
                  padding: 14,
                  borderRadius: 10,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: "#ff1493"
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12, marginBottom: 6, fontWeight: "bold" }}>
                  Entrez le chemin complet du fichier .iso sur votre téléphone :
                </Text>
                <Input
                  value={customPathInput()}
                  onChangeText={(val) => customPathInput.set(val)}
                  placeholder="/sdcard/Download/mon_jeu.iso"
                  style={{
                    backgroundColor: "#0b0614",
                    color: "#ffffff",
                    padding: 10,
                    borderRadius: 6,
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: "#3a2260",
                    marginBottom: 10
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
                    backgroundColor: "#ff1493",
                    paddingVertical: 10,
                    borderRadius: 6,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>
                    ✓ CONFIRMER LE CHEMIN ISO
                  </Text>
                </View>
              </View>
            )}

            {/* Quick Pick Presets */}
            <Text style={{ color: "#a59cb8", fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>
              EMPLACEMENTS COURANTS SUR ANDROID :
            </Text>
            <View style={{ gap: 8 }}>
              {presetRoms.map((preset) => (
                <View
                  key={preset.path}
                  onPress={() => {
                    romPath.set(preset.path);
                    romId.set(preset.id);
                  }}
                  style={{
                    backgroundColor: romPath() === preset.path ? "#ff149322" : "#1a102e",
                    borderWidth: 1,
                    borderColor: romPath() === preset.path ? "#ff1493" : "#2a1845",
                    padding: 12,
                    borderRadius: 8,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
                      {preset.label}
                    </Text>
                    <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
                      {preset.path}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: romPath() === preset.path ? "#ff1493" : "#442b6a",
                      backgroundColor: romPath() === preset.path ? "#ff1493" : "transparent",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {romPath() === preset.path && (
                      <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "bold" }}>✓</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Big Neon Boot Button */}
          <View
            onPress={startRomBootSequence}
            style={{
              backgroundColor: "#ff1493",
              borderRadius: 16,
              paddingVertical: 20,
              paddingHorizontal: 24,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#ff69b4"
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "bold", letterSpacing: 2 }}>
              ▶ DÉMARRER VICE CITY STORIES
            </Text>
            <Text style={{ color: "#ffffffcc", fontSize: 12, marginTop: 4, fontWeight: "bold" }}>
              Lancer avec la manette tactile virtuelle et le moteur PS2 HD
            </Text>
          </View>

          {/* Features Highlights Cards */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 30 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#130c22",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#2f1b4a"
              }}
            >
              <Text style={{ color: "#00f0ff", fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>
                🕹️ MANETTE TACTILE
              </Text>
              <Text style={{ color: "#a59cb8", fontSize: 12, lineHeight: 18 }}>
                D-Pad, Stick analogique, gâchettes L1/L2/R1/R2 et touches PlayStation officielles.
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#130c22",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#2f1b4a"
              }}
            >
              <Text style={{ color: "#ff1493", fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>
                ✨ GRAPHISMES HD
              </Text>
              <Text style={{ color: "#a59cb8", fontSize: 12, lineHeight: 18 }}>
                Lissage anti-aliasing MSAA 4x, résolution widescreen 16:9 et fluidité 60 FPS.
              </Text>
            </View>
          </View>
        </Scroll>
      )}

      {/* ============================================================== */}
      {/* SCREEN 2: IN-GAME HUD & PROFESSIONAL VIRTUAL GAMEPAD           */}
      {/* ============================================================== */}
      {currentScreen() === "game" && (
        <View style={{ flex: 1, position: "relative" }}>
          {/* Game Viewport / 3D Canvas Mockup with Vice City Skyline */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#04020a",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {/* 3D Gameplay World Canvas Container */}
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#110821",
                justifyContent: "space-between",
                padding: 12,
                position: "relative"
              }}
            >
              {/* Center Game Scene Aesthetic (Palm trees, ocean, sunset) */}
              <View
                style={{
                  position: "absolute",
                  top: "25%",
                  left: "20%",
                  right: "20%",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Text style={{ color: "#ff1493", fontSize: 32, fontWeight: "bold", letterSpacing: 4, textShadow: "0 0 12px #ff1493" }}>
                  VICE CITY STORIES
                </Text>
                <Text style={{ color: "#00f0ff", fontSize: 13, letterSpacing: 2, marginTop: 4 }}>
                  MOTEUR PS2 HD • 60 FPS • SLUS_215.90 ACTIF
                </Text>
                
                {/* Last input visualizer */}
                <View
                  style={{
                    backgroundColor: "#1c1133cc",
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginTop: 18,
                    borderWidth: 1,
                    borderColor: "#ff1493"
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 13 }}>
                    Action active : <Text style={{ color: "#00f0ff", fontWeight: "bold" }}>{lastPressedBtn()}</Text>
                  </Text>
                </View>
              </View>

              {/* -------------------------------------------------------- */}
              {/* TOP BAR: QUICK CONTROLS & AUTHENTIC GTA HUD              */}
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
                {/* Top-Left: Pause / Menu / Opacity */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View
                    onPress={() => currentScreen.set("launcher")}
                    style={{
                      backgroundColor: "#1e1138dd",
                      borderWidth: 1.5,
                      borderColor: "#ff1493",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 7
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>
                      ⏸ MENU / RETOUR
                    </Text>
                  </View>

                  <View
                    onPress={() => {
                      const next = controllerOpacity() === 85 ? 50 : controllerOpacity() === 50 ? 100 : 85;
                      controllerOpacity.set(next);
                    }}
                    style={{
                      backgroundColor: "#1e1138dd",
                      borderWidth: 1,
                      borderColor: "#00f0ff",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 7
                    }}
                  >
                    <Text style={{ color: "#00f0ff", fontSize: 11, fontWeight: "bold" }}>
                      OPACITÉ: {controllerOpacity()}%
                    </Text>
                  </View>

                  <View
                    onPress={() => handleButtonPress("Changement Caméra")}
                    style={{
                      backgroundColor: "#1e1138dd",
                      borderWidth: 1,
                      borderColor: "#7853b0",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 7
                    }}
                  >
                    <Text style={{ color: "#d2c2f0", fontSize: 11, fontWeight: "bold" }}>
                      📷 CAMÉRA
                    </Text>
                  </View>
                </View>

                {/* Top-Right: AUTHENTIC GTA VICE CITY STORIES HUD */}
                <View
                  style={{
                    backgroundColor: "#0d061bcc",
                    borderRadius: 12,
                    padding: 10,
                    borderWidth: 1.5,
                    borderColor: "#2d1a4d",
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
                      backgroundColor: "#180c2e",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#00f0ff",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative"
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>
                      {weapons[activeWeaponIndex()].icon}
                    </Text>
                    {weapons[activeWeaponIndex()].clip ? (
                      <Text style={{ color: "#00f0ff", fontSize: 10, fontWeight: "bold", position: "absolute", bottom: 2 }}>
                        {weapons[activeWeaponIndex()].clip}-{weapons[activeWeaponIndex()].ammo}
                      </Text>
                    ) : (
                      <Text style={{ color: "#00f0ff", fontSize: 10, fontWeight: "bold", position: "absolute", bottom: 2 }}>
                        {weapons[activeWeaponIndex()].ammo}
                      </Text>
                    )}
                  </View>

                  {/* Health, Armor, Stars, Money, Time */}
                  <View style={{ gap: 4 }}>
                    {/* Time & Money */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", width: 150 }}>
                      <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                        {gameTime()}
                      </Text>
                      <Text style={{ color: "#00e676", fontSize: 15, fontWeight: "bold", letterSpacing: 0.5 }}>
                        ${playerCash().toLocaleString()}
                      </Text>
                    </View>

                    {/* Health Bar (Pink / Crimson) */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: "#ff1493", fontSize: 11, fontWeight: "bold" }}>❤️</Text>
                      <View style={{ width: 120, height: 10, backgroundColor: "#3a0e22", borderRadius: 5, overflow: "hidden" }}>
                        <View style={{ width: `${playerHealth()}%`, height: "100%", backgroundColor: "#ff1493" }} />
                      </View>
                    </View>

                    {/* Armor Bar (Cyan) */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: "#00f0ff", fontSize: 11, fontWeight: "bold" }}>🛡️</Text>
                      <View style={{ width: 120, height: 10, backgroundColor: "#0b2838", borderRadius: 5, overflow: "hidden" }}>
                        <View style={{ width: `${playerArmor()}%`, height: "100%", backgroundColor: "#00f0ff" }} />
                      </View>
                    </View>

                    {/* Wanted Stars (6 Stars) */}
                    <View style={{ flexDirection: "row", gap: 2 }}>
                      {[1, 2, 3, 4, 5, 6].map((star) => (
                        <Text
                          key={star}
                          style={{
                            color: star <= wantedStars() ? "#ffe600" : "#4a3c63",
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
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    backgroundColor: "#0c1524ee",
                    borderWidth: 2.5,
                    borderColor: "#00f0ff",
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden"
                  }}
                >
                  {/* Grid / Roads Representation */}
                  <View style={{ position: "absolute", width: "100%", height: 2, backgroundColor: "#1e375c" }} />
                  <View style={{ position: "absolute", height: "100%", width: 2, backgroundColor: "#1e375c" }} />
                  <View style={{ position: "absolute", width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: "#1e375c" }} />
                  
                  {/* North Indicator */}
                  <Text style={{ position: "absolute", top: 4, color: "#ffffff", fontSize: 10, fontWeight: "bold" }}>N</Text>
                  
                  {/* Player Blip (Pink Arrowhead) */}
                  <View
                    style={{
                      width: 14,
                      height: 14,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#ff1493", fontSize: 16, fontWeight: "bold" }}>▲</Text>
                  </View>

                  {/* Objective Marker (Yellow blip) */}
                  <View
                    style={{
                      position: "absolute",
                      top: 30,
                      right: 28,
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
                    borderColor: "#ff1493"
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 }}>
                    {locationName()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ============================================================ */}
          {/* VIRTUAL CONTROLLER OVERLAY (Ergonomic, Sleek Glassmorphism) */}
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
            {/* LEFT ZONE: L1 / L2, D-PAD, FLOATING ANALOG JOYSTICK        */}
            {/* ---------------------------------------------------------- */}
            <View
              style={{
                width: 240,
                justifyContent: "space-between",
                paddingTop: 50,
                paddingBottom: 10
              }}
            >
              {/* Shoulder Bumper L1 & L2 */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View
                  onPress={() => handleButtonPress("L1 (Visée / Lock)", "fire")}
                  style={{
                    backgroundColor: "#1a102edd",
                    borderWidth: 1.5,
                    borderColor: "#00f0ff",
                    borderRadius: 10,
                    paddingVertical: 11,
                    paddingHorizontal: 18,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#00f0ff", fontSize: 14, fontWeight: "bold" }}>L1</Text>
                  <Text style={{ color: "#a59cb8", fontSize: 8 }}>VISÉE</Text>
                </View>

                <View
                  onPress={() => handleButtonPress("L2 (Arme précédente)", "weapon_prev")}
                  style={{
                    backgroundColor: "#1a102edd",
                    borderWidth: 1.5,
                    borderColor: "#00f0ff",
                    borderRadius: 10,
                    paddingVertical: 11,
                    paddingHorizontal: 18,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#00f0ff", fontSize: 14, fontWeight: "bold" }}>L2</Text>
                  <Text style={{ color: "#a59cb8", fontSize: 8 }}>PRÉC.</Text>
                </View>
              </View>

              {/* D-Pad + Analog Stick Horizontal Cluster */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10 }}>
                {/* D-Pad Cross */}
                <View style={{ alignItems: "center" }}>
                  {/* UP */}
                  <View
                    onPress={() => handleButtonPress("D-PAD HAUT")}
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: "#180c2fdd",
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: "#3d226b",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#00f0ff", fontSize: 18, fontWeight: "bold" }}>▲</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 44, marginVertical: 3 }}>
                    {/* LEFT */}
                    <View
                      onPress={() => handleButtonPress("D-PAD GAUCHE")}
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: "#180c2fdd",
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: "#3d226b",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: "#00f0ff", fontSize: 18, fontWeight: "bold" }}>◀</Text>
                    </View>

                    {/* RIGHT */}
                    <View
                      onPress={() => handleButtonPress("D-PAD DROITE")}
                      style={{
                        width: 44,
                        height: 44,
                        backgroundColor: "#180c2fdd",
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: "#3d226b",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: "#00f0ff", fontSize: 18, fontWeight: "bold" }}>▶</Text>
                    </View>
                  </View>

                  {/* DOWN */}
                  <View
                    onPress={() => handleButtonPress("D-PAD BAS")}
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: "#180c2fdd",
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: "#3d226b",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#00f0ff", fontSize: 18, fontWeight: "bold" }}>▼</Text>
                  </View>
                </View>

                {/* Left Analog Joystick (Floating Base) */}
                <View
                  onPress={() => handleButtonPress("JOYSTICK GAUCHE (Course)")}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: "#110822bb",
                    borderWidth: 2,
                    borderColor: "#00f0ff66",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "#ff1493",
                      borderWidth: 2,
                      borderColor: "#ffffff",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>L3</Text>
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
                  onPress={() => handleButtonPress("SELECT (Vue)")}
                  style={{
                    backgroundColor: "#1a0f30dd",
                    borderRadius: 12,
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "#4d2e82"
                  }}
                >
                  <Text style={{ color: "#c1b2de", fontSize: 11, fontWeight: "bold" }}>SELECT</Text>
                </View>

                <View
                  onPress={() => handleButtonPress("START (Pause / Carte)")}
                  style={{
                    backgroundColor: "#1a0f30dd",
                    borderRadius: 12,
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderWidth: 1,
                    borderColor: "#4d2e82"
                  }}
                >
                  <Text style={{ color: "#c1b2de", fontSize: 11, fontWeight: "bold" }}>START</Text>
                </View>
              </View>
            </View>

            {/* ---------------------------------------------------------- */}
            {/* RIGHT ZONE: R1 / R2, SONY PS BUTTONS, RIGHT STICK          */}
            {/* ---------------------------------------------------------- */}
            <View
              style={{
                width: 240,
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
                    backgroundColor: "#1a102edd",
                    borderWidth: 1.5,
                    borderColor: "#ff1493",
                    borderRadius: 10,
                    paddingVertical: 11,
                    paddingHorizontal: 18,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#ff1493", fontSize: 14, fontWeight: "bold" }}>R2</Text>
                  <Text style={{ color: "#a59cb8", fontSize: 8 }}>SUIV.</Text>
                </View>

                <View
                  onPress={() => handleButtonPress("R1 (Tir / Attaque)", "fire")}
                  style={{
                    backgroundColor: "#1a102edd",
                    borderWidth: 1.5,
                    borderColor: "#ff1493",
                    borderRadius: 10,
                    paddingVertical: 11,
                    paddingHorizontal: 18,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#ff1493", fontSize: 14, fontWeight: "bold" }}>R1</Text>
                  <Text style={{ color: "#a59cb8", fontSize: 8 }}>TIR</Text>
                </View>
              </View>

              {/* Action Cluster + Right Analog Joystick */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10 }}>
                {/* Right Camera Stick */}
                <View
                  onPress={() => handleButtonPress("JOYSTICK DROIT (Caméra)")}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    backgroundColor: "#110822bb",
                    borderWidth: 2,
                    borderColor: "#ff149366",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "#00f0ff",
                      borderWidth: 2,
                      borderColor: "#ffffff",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>R3</Text>
                  </View>
                </View>

                {/* PlayStation Iconic Action Buttons Diamond */}
                <View style={{ alignItems: "center" }}>
                  {/* TRIANGLE (▲ Vert) */}
                  <View
                    onPress={() => handleButtonPress("▲ TRIANGLE (Véhicule)")}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "#180c2fdd",
                      borderWidth: 2,
                      borderColor: "#00e676",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#00e676", fontSize: 22, fontWeight: "bold" }}>▲</Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 50, marginVertical: 3 }}>
                    {/* SQUARE (■ Rose) */}
                    <View
                      onPress={() => handleButtonPress("■ CARRÉ (Saut / Frein)")}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: "#180c2fdd",
                        borderWidth: 2,
                        borderColor: "#ff1493",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: "#ff1493", fontSize: 22, fontWeight: "bold" }}>■</Text>
                    </View>

                    {/* CIRCLE (● Rouge) */}
                    <View
                      onPress={() => handleButtonPress("● ROND (Attaque / Frapper)", "fire")}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: "#180c2fdd",
                        borderWidth: 2,
                        borderColor: "#ff3d00",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: "#ff3d00", fontSize: 22, fontWeight: "bold" }}>●</Text>
                    </View>
                  </View>

                  {/* CROSS (✕ Bleu) */}
                  <View
                    onPress={() => handleButtonPress("✕ CROIX (Sprint / Accélérer)", "sprint")}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: "#180c2fdd",
                      borderWidth: 2,
                      borderColor: "#00f0ff",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#00f0ff", fontSize: 22, fontWeight: "bold" }}>✕</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* SCREEN 3: SETTINGS (GRAPHICS, CONTROLS, AUDIO)                 */}
      {/* ============================================================== */}
      {currentScreen() === "settings" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          <View
            style={{
              backgroundColor: "#130c22",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1.5,
              borderColor: "#2f1b4a",
              marginBottom: 16
            }}
          >
            <Text style={{ color: "#ff1493", fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>
              PARAMÈTRES GRAPHIQUES DU REMASTER
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
                borderBottomColor: "#22133b"
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Lissage Graphique HD (MSAA + Filtrage)
                </Text>
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
                  Supprime le crénelage PS2 tout en préservant la géométrie 3D d'origine
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: hdRemasterEnabled() ? "#00e676" : "#362252",
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
                borderBottomColor: "#22133b"
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Taux de rafraîchissement
                </Text>
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
                  Mode 60 FPS ultra fluide pour smartphones modernes
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: fpsTarget() === 60 ? "#00f0ff" : "#362252",
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
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
                  FOV étendu sans étirement des personnages ni du radar
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: widescreenFix() ? "#00e676" : "#362252",
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

          {/* Controller & Touch Settings */}
          <View
            style={{
              backgroundColor: "#130c22",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1.5,
              borderColor: "#2f1b4a",
              marginBottom: 20
            }}
          >
            <Text style={{ color: "#00f0ff", fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>
              RÉGLAGES MANETTE TACTILE
            </Text>

            {/* Haptic Vibrations */}
            <View
              onPress={() => hapticFeedback.set(!hapticFeedback())}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#22133b"
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Retour Haptique (Vibrations)
                </Text>
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
                  Retour physique vibrant au toucher de chaque bouton virtuel
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: hapticFeedback() ? "#00e676" : "#362252",
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

            {/* Default Opacity Selector */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Transparence par défaut des touches
                </Text>
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
                  Opacité des boutons sur l'écran de jeu
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[50, 70, 85, 100].map((pct) => (
                  <View
                    key={pct}
                    onPress={() => controllerOpacity.set(pct)}
                    style={{
                      backgroundColor: controllerOpacity() === pct ? "#ff1493" : "#22133b",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>{pct}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Scroll>
      )}

      {/* ============================================================== */}
      {/* SCREEN 4: MEMORY CARD (SAVES MANAGER)                          */}
      {/* ============================================================== */}
      {currentScreen() === "saves" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          <View
            style={{
              backgroundColor: "#130c22",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1.5,
              borderColor: "#2f1b4a",
              marginBottom: 16
            }}
          >
            <Text style={{ color: "#ff1493", fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
              CARTE MÉMOIRE PS2 (8 MB)
            </Text>
            <Text style={{ color: "#8c7fa8", fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
              Vos sauvegardes de GTA Vice City Stories sont automatiquement synchronisées
              dans le dossier de l'application Android sous forme de cartes mémoires PS2 standard.
            </Text>

            <View style={{ gap: 10 }}>
              <View
                style={{
                  backgroundColor: "#1a102e",
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#331c54",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View>
                  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
                    SLOT 1 : Carte Mémoire Interne
                  </Text>
                  <Text style={{ color: "#00f0ff", fontSize: 11 }}>
                    vcs_memcard1.bin (Sauvegardes actives)
                  </Text>
                </View>
                <View style={{ backgroundColor: "#00e67622", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: "#00e676", fontSize: 11, fontWeight: "bold" }}>CONNECTÉE</Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: "#1a102e",
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#331c54",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <View>
                  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
                    SLOT 2 : Carte Mémoire Export
                  </Text>
                  <Text style={{ color: "#a59cb8", fontSize: 11 }}>
                    vcs_memcard2.bin (Vide / Sauvegarde externe)
                  </Text>
                </View>
                <View style={{ backgroundColor: "#2b1b42", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: "#a59cb8", fontSize: 11, fontWeight: "bold" }}>LIBRE</Text>
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
