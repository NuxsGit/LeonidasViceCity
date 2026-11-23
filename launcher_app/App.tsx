import { mount, signal } from "@nlayer/runtime";
import { View, Text, Scroll, Input } from "@nlayer/ui";

function App() {
  // Navigation & Screen state
  const currentScreen = signal<"launcher" | "game" | "settings" | "saves">("launcher");
  
  // ROM Management signals
  const romPath = signal("/sdcard/Download/Grand Theft Auto - Vice City Stories.iso");
  const customPathInput = signal("");
  const isEditingPath = signal(false);
  const romSize = signal("4.12 Go");
  const romId = signal("SLUS-21590 (USA v1.02)");
  
  // Boot & Game Engine state
  const bootStep = signal<number>(0);
  const bootMessage = signal<string>("");
  const isBooting = signal<boolean>(false);
  const inGameMenuOpen = signal<boolean>(false);
  
  // In-Game HUD state
  const playerHealth = signal<number>(100);
  const playerArmor = signal<number>(100);
  const playerCash = signal<number>(248500);
  const wantedStars = signal<number>(2);
  const gameTime = signal<string>("12:45");
  const locationName = signal<string>("OCEAN BEACH • OCEAN DRIVE");
  const activeWeaponIndex = signal<number>(1);
  const lastPressedBtn = signal<string>("Prêt");

  // TouchPort HUD configuration signals
  const controllerOpacity = signal<number>(75); // 35, 55, 75, 100
  const autoSprintEnabled = signal<boolean>(true);
  const floatingJoyEnabled = signal<boolean>(true);
  const dragAimSensitivity = signal<string>("Moyenne");
  const buttonScale = signal<"Normal" | "Large">("Normal");
  const hapticFeedback = signal<boolean>(true);

  // Settings signals
  const hdRemasterEnabled = signal<boolean>(true);
  const antiAliasing = signal<string>("MSAA 4x");
  const fpsTarget = signal<number>(60);
  const widescreenFix = signal<boolean>(true);

  // Virtual Joystick dynamic state (TouchPort style)
  const joyKnobX = signal<number>(0);
  const joyKnobY = signal<number>(0);
  const joyActive = signal<boolean>(false);

  // Aim drag state (TouchPort style)
  const aimDeltaX = signal<number>(0);
  const aimDeltaY = signal<number>(0);

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

  // TouchPort Action feedback handler
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

  // Launch Game with realistic PS2 recompiler boot sequence
  const startRomBootSequence = () => {
    isBooting.set(true);
    bootStep.set(1);
    bootMessage.set("Montage de l'image disque ISO (vcs::IsoImage::openFd)...");

    setTimeout(() => {
      bootStep.set(2);
      bootMessage.set("Vérification exécutable MIPS ELF (SLUS_215.90) & SYSTEM.CNF...");
      
      setTimeout(() => {
        bootStep.set(3);
        bootMessage.set("Recompilateur ARM64 actif • Initialisation Shaders & Textures HD...");

        setTimeout(() => {
          bootStep.set(4);
          bootMessage.set("Moteur PS2 Recompiler démarré à 60 FPS !");

          setTimeout(() => {
            isBooting.set(false);
            currentScreen.set("game");
          }, 350);
        }, 350);
      }, 350);
    }, 350);
  };

  const btnDiameter = () => (buttonScale() === "Large" ? 56 : 48);

  return (
    <View style={{ flex: 1, backgroundColor: "#06040b" }}>
      {/* ============================================================== */}
      {/* TOP NAVIGATION BAR                                             */}
      {/* ============================================================== */}
      {currentScreen() !== "game" && (
        <View
          style={{
            backgroundColor: "#0f091c",
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
                RECOMPILATEUR ARM64 ANDROID • HUD TOUCHPORT
              </Text>
            </View>
          </View>

          {/* Nav Tabs */}
          <View style={{ flexDirection: "row", gap: 6 }}>
            <View
              onPress={() => currentScreen.set("launcher")}
              style={{
                backgroundColor: currentScreen() === "launcher" ? "#ff1493" : "#1a102e",
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
                backgroundColor: currentScreen() === "settings" ? "#ff1493" : "#1a102e",
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
                backgroundColor: currentScreen() === "saves" ? "#ff1493" : "#1a102e",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "bold" }}>💾 SAUVEGARDES</Text>
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
                backgroundColor: "#160b29",
                borderRadius: 16,
                padding: 24,
                borderWidth: 2,
                borderColor: "#ff1493",
                marginBottom: 20,
                alignItems: "center"
              }}
            >
              <Text style={{ color: "#00f0ff", fontSize: 17, fontWeight: "bold", marginBottom: 12 }}>
                RECOMPILATEUR ARM64 ANDROID
              </Text>
              <View
                style={{
                  width: "100%",
                  height: 8,
                  backgroundColor: "#0a0414",
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

          {/* Active ROM Card */}
          <View
            style={{
              backgroundColor: "#120a1f",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1.5,
              borderColor: "#2a1645",
              marginBottom: 18
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "#ff1493", fontSize: 14, fontWeight: "bold", letterSpacing: 1 }}>
                  IMAGE DISQUE PS2 (.ISO)
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
                backgroundColor: "#08040f",
                borderRadius: 10,
                padding: 14,
                borderWidth: 1,
                borderColor: "#1d0f33",
                marginBottom: 14
              }}
            >
              <Text style={{ color: "#8173a1", fontSize: 11, marginBottom: 4, fontWeight: "bold" }}>
                FICHIER SÉLECTIONNÉ :
              </Text>
              <Text style={{ color: "#00f0ff", fontSize: 15, fontWeight: "bold" }}>
                {romPath()}
              </Text>
              <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
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
                  backgroundColor: "#1c1033",
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#361e5c"
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
              DOSSIERS STANDARDS ANDROID :
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
                    backgroundColor: romPath() === preset.path ? "#ff149322" : "#170c2a",
                    borderWidth: 1,
                    borderColor: romPath() === preset.path ? "#ff1493" : "#24133d",
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
                      borderColor: romPath() === preset.path ? "#ff1493" : "#3d2263",
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
              Lancer avec la manette tactile TouchPort et le recompilateur ARM64
            </Text>
          </View>

          {/* TouchPort Architecture Info */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 30 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#120a1f",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#2a1645"
              }}
            >
              <Text style={{ color: "#00f0ff", fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>
                🕹️ HUD TOUCHPORT
              </Text>
              <Text style={{ color: "#a59cb8", fontSize: 12, lineHeight: 18 }}>
                Floating joystick, drag-to-aim sur l'écran droit, auto-sprint et boutons configurables.
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#120a1f",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#2a1645"
              }}
            >
              <Text style={{ color: "#ff1493", fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>
                ⚡ RECOMPILATEUR ARM64
              </Text>
              <Text style={{ color: "#a59cb8", fontSize: 12, lineHeight: 18 }}>
                Exécution native NEON ARM64 sans émulation lente, 60 FPS natif et rendu Vulkan.
              </Text>
            </View>
          </View>
        </Scroll>
      )}

      {/* ============================================================== */}
      {/* SCREEN 2: IN-GAME HUD & TOUCHPORT VIRTUAL CONTROLLER           */}
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
              <Text style={{ color: "#ff1493", fontSize: 32, fontWeight: "bold", letterSpacing: 4, textShadow: "0 0 12px #ff1493" }}>
                VICE CITY STORIES
              </Text>
              <Text style={{ color: "#00f0ff", fontSize: 13, letterSpacing: 2, marginTop: 4 }}>
                RECOMPILATEUR ARM64 • 60 FPS • {locationName()}
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
                  borderColor: "#ff1493"
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 13 }}>
                  Contrôle actif : <Text style={{ color: "#00f0ff", fontWeight: "bold" }}>{lastPressedBtn()}</Text>
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
                  onPress={() => currentScreen.set("launcher")}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderWidth: 1.5,
                    borderColor: "#ff1493",
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
                    backgroundColor: inGameMenuOpen() ? "#ff1493" : "#160b2bdd",
                    borderWidth: 1,
                    borderColor: inGameMenuOpen() ? "#ffffff" : "#00f0ff",
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
                  <Text style={{ color: "#00f0ff", fontSize: 11, fontWeight: "bold" }}>
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
                    <Text style={{ color: "#ff1493", fontSize: 11 }}>❤️</Text>
                    <View style={{ width: 115, height: 10, backgroundColor: "#3a0e22", borderRadius: 5, overflow: "hidden" }}>
                      <View style={{ width: `${playerHealth()}%`, height: "100%", backgroundColor: "#ff1493" }} />
                    </View>
                  </View>

                  {/* Armor Bar */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ color: "#00f0ff", fontSize: 11 }}>🛡️</Text>
                    <View style={{ width: 115, height: 10, backgroundColor: "#0b2838", borderRadius: 5, overflow: "hidden" }}>
                      <View style={{ width: `${playerArmor()}%`, height: "100%", backgroundColor: "#00f0ff" }} />
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
                  borderColor: "#ff1493",
                  zIndex: 20
                }}
              >
                <Text style={{ color: "#ff1493", fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>
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
                  <Text style={{ color: "#00f0ff", fontSize: 12, fontWeight: "bold" }}>
                    {buttonScale()}
                  </Text>
                </View>

                {/* Close Button */}
                <View
                  onPress={() => inGameMenuOpen.set(false)}
                  style={{
                    backgroundColor: "#ff1493",
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
                  borderColor: "#00f0ff",
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
                  <Text style={{ color: "#ff1493", fontSize: 16, fontWeight: "bold" }}>▲</Text>
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
                  borderColor: "#ff1493"
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
                    borderColor: "#00f0ff",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#00f0ff", fontSize: 13, fontWeight: "bold" }}>L1</Text>
                  <Text style={{ color: "#a59cb8", fontSize: 8 }}>VISÉE</Text>
                </View>

                <View
                  onPress={() => handleButtonPress("L2 (Arme précédente)", "weapon_prev")}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderWidth: 1.5,
                    borderColor: "#00f0ff",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#00f0ff", fontSize: 13, fontWeight: "bold" }}>L2</Text>
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
                    <Text style={{ color: "#00f0ff", fontSize: 17, fontWeight: "bold" }}>▲</Text>
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
                      <Text style={{ color: "#00f0ff", fontSize: 17, fontWeight: "bold" }}>◀</Text>
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
                      <Text style={{ color: "#00f0ff", fontSize: 17, fontWeight: "bold" }}>▶</Text>
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
                    <Text style={{ color: "#00f0ff", fontSize: 17, fontWeight: "bold" }}>▼</Text>
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
                    borderColor: "#00f0ff66",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: "#ff1493",
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
                    borderColor: "#ff1493",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#ff1493", fontSize: 13, fontWeight: "bold" }}>R2</Text>
                  <Text style={{ color: "#a59cb8", fontSize: 8 }}>SUIV.</Text>
                </View>

                <View
                  onPress={() => handleButtonPress("R1 (Tir / Attaque)", "fire")}
                  style={{
                    backgroundColor: "#160b2bdd",
                    borderWidth: 1.5,
                    borderColor: "#ff1493",
                    borderRadius: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    alignItems: "center"
                  }}
                >
                  <Text style={{ color: "#ff1493", fontSize: 13, fontWeight: "bold" }}>R1</Text>
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
                    borderColor: "#ff149366",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: "#00f0ff",
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
                        borderColor: "#ff1493",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Text style={{ color: "#ff1493", fontSize: 21, fontWeight: "bold" }}>■</Text>
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
                      borderColor: "#00f0ff",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ color: "#00f0ff", fontSize: 21, fontWeight: "bold" }}>✕</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* SCREEN 3: SETTINGS (GRAPHICS, RECOMPILER, CONTROLS)            */}
      {/* ============================================================== */}
      {currentScreen() === "settings" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          <View
            style={{
              backgroundColor: "#120a1f",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1.5,
              borderColor: "#2a1645",
              marginBottom: 16
            }}
          >
            <Text style={{ color: "#ff1493", fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>
              PARAMÈTRES GRAPHIQUES & RECOMPILATEUR ARM64
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
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
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
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
                  Mode 60 FPS ultra fluide sur processeurs ARM Snapdragon / Dimensity
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: fpsTarget() === 60 ? "#00f0ff" : "#2f1b47",
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
              backgroundColor: "#120a1f",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1.5,
              borderColor: "#2a1645",
              marginBottom: 20
            }}
          >
            <Text style={{ color: "#00f0ff", fontSize: 16, fontWeight: "bold", marginBottom: 16 }}>
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
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
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
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
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
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#201138"
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                  Retour Haptique Vibrant
                </Text>
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
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
                  Transparence des boutons
                </Text>
                <Text style={{ color: "#8c7fa8", fontSize: 11 }}>
                  Opacité générale des commandes sur l'écran
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[35, 55, 75, 100].map((pct) => (
                  <View
                    key={pct}
                    onPress={() => controllerOpacity.set(pct)}
                    style={{
                      backgroundColor: controllerOpacity() === pct ? "#ff1493" : "#1c1033",
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
              backgroundColor: "#120a1f",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1.5,
              borderColor: "#2a1645",
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
                  backgroundColor: "#170c2a",
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#2d1650",
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
                  backgroundColor: "#170c2a",
                  padding: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#2d1650",
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
