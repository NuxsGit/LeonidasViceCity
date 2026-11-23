import { mount, signal } from "@nlayer/runtime";
import { View, Text, Scroll, Input } from "@nlayer/ui";

function App() {
  const currentTab = signal<"launcher" | "game" | "settings" | "about">("launcher");
  const romPath = signal("/sdcard/Download/vcs.iso");
  const isEditingRom = signal(false);
  const tempRomPath = signal("/sdcard/Download/vcs.iso");
  
  // Settings signals
  const hdLissage = signal(true);
  const fps60 = signal(true);
  const hapticEnabled = signal(true);
  const touchOpacity = signal(80);
  const resolutionScale = signal("2x HD");
  
  // Game input signals
  const lastAction = signal("Prêt");
  const isPlaying = signal(false);

  const setAction = (name: string) => {
    lastAction.set(name);
  };

  const currentOpacityValue = () => {
    return (touchOpacity() / 100);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0c0814" }}>
      {/* Top Header */}
      <View
        style={{
          backgroundColor: "#160f26",
          paddingHorizontal: 20,
          paddingVertical: 14,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottomWidth: 2,
          borderBottomColor: "#ff2a8d"
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#ff2a8d", letterSpacing: 1.5 }}>
            LEONIDAS{" "}
            <Text style={{ color: "#00f0ff" }}>VICE CITY</Text>
          </Text>
          <View
            style={{
              backgroundColor: "#2e1c4e",
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 3,
              marginLeft: 12
            }}
          >
            <Text style={{ color: "#ffe600", fontSize: 11, fontWeight: "bold" }}>v0.4.5</Text>
          </View>
        </View>

        {currentTab() !== "game" && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View
              onPress={() => currentTab.set("launcher")}
              style={{
                backgroundColor: currentTab() === "launcher" ? "#ff2a8d" : "#24183a",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>LANCEUR</Text>
            </View>
            <View
              onPress={() => currentTab.set("settings")}
              style={{
                backgroundColor: currentTab() === "settings" ? "#ff2a8d" : "#24183a",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>PARAMÈTRES</Text>
            </View>
            <View
              onPress={() => currentTab.set("about")}
              style={{
                backgroundColor: currentTab() === "about" ? "#ff2a8d" : "#24183a",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>À PROPOS</Text>
            </View>
          </View>
        )}

        {currentTab() === "game" && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              onPress={() => {
                const next = touchOpacity() === 80 ? 50 : touchOpacity() === 50 ? 100 : 80;
                touchOpacity.set(next);
              }}
              style={{
                backgroundColor: "#24183a",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: "#00f0ff"
              }}
            >
              <Text style={{ color: "#00f0ff", fontSize: 11, fontWeight: "bold" }}>
                OPACITÉ: {touchOpacity()}%
              </Text>
            </View>
            <View
              onPress={() => currentTab.set("launcher")}
              style={{
                backgroundColor: "#ff2a8d",
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 8
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
                ⏸ PAUSE / MENU
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Main Content Area */}
      {currentTab() === "launcher" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          {/* Hero Banner */}
          <View
            style={{
              backgroundColor: "#1b122c",
              borderRadius: 14,
              padding: 20,
              borderWidth: 1,
              borderColor: "#3a255c",
              marginBottom: 16
            }}
          >
            <Text style={{ color: "#00f0ff", fontSize: 13, fontWeight: "bold", marginBottom: 4 }}>
              PORTAGE ANDROID OFFICIEL • MOTEUR REMAKE HD
            </Text>
            <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
              Grand Theft Auto: Vice City Stories
            </Text>
            <Text style={{ color: "#a59cb8", fontSize: 14, lineHeight: 20 }}>
              Retrouvez Vic Vance et l'ambiance des années 80 dans une version optimisée pour Android
              avec lissage graphique haute résolution, manette tactile dynamique et support manette physique.
            </Text>
          </View>

          {/* ROM Selector Card */}
          <View
            style={{
              backgroundColor: "#1b122c",
              borderRadius: 14,
              padding: 18,
              borderWidth: 1,
              borderColor: "#3a255c",
              marginBottom: 16
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold" }}>
                DISQUE DU JEU (ROM PS2)
              </Text>
              <View
                style={{
                  backgroundColor: romPath() ? "#00e67622" : "#ff2a8d22",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: romPath() ? "#00e676" : "#ff2a8d"
                }}
              >
                <Text style={{ color: romPath() ? "#00e676" : "#ff2a8d", fontSize: 11, fontWeight: "bold" }}>
                  {romPath() ? "● ROM PRÊTE" : "● EN ATTENTE"}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#0f0a1a",
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: "#2d1c47",
                marginBottom: 12
              }}
            >
              <Text style={{ color: "#a59cb8", fontSize: 11, marginBottom: 2 }}>CHEMIN DU FICHIER :</Text>
              <Text style={{ color: "#00f0ff", fontSize: 14, fontWeight: "bold" }}>
                {romPath()}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              <View
                onPress={() => romPath.set("/sdcard/Download/vcs.iso")}
                style={{
                  backgroundColor: "#2a1c42",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12 }}>📁 Dossier Téléchargements (vcs.iso)</Text>
              </View>
              <View
                onPress={() => romPath.set("/sdcard/Download/GTAVCS.iso")}
                style={{
                  backgroundColor: "#2a1c42",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12 }}>📁 GTAVCS.iso</Text>
              </View>
              <View
                onPress={() => romPath.set("/sdcard/VCS/game.iso")}
                style={{
                  backgroundColor: "#2a1c42",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 12 }}>📁 Dossier VCS (game.iso)</Text>
              </View>
            </View>
          </View>

          {/* Launch Play Button */}
          <View
            onPress={() => {
              isPlaying.set(true);
              currentTab.set("game");
            }}
            style={{
              backgroundColor: "#ff2a8d",
              borderRadius: 14,
              paddingVertical: 18,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "bold", letterSpacing: 1.5 }}>
              ▶ LANCER LE JEU
            </Text>
            <Text style={{ color: "#ffffffcc", fontSize: 12, marginTop: 4 }}>
              Activer l'écran de jeu et la manette tactile virtuelle
            </Text>
          </View>

          {/* Quick Info Grid */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#1b122c",
                padding: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#3a255c"
              }}
            >
              <Text style={{ color: "#00f0ff", fontSize: 13, fontWeight: "bold", marginBottom: 2 }}>
                🕹️ MANETTE TACTILE
              </Text>
              <Text style={{ color: "#a59cb8", fontSize: 12 }}>
                D-Pad, Stick analogique, Touches d'action PS2 et gâchettes L/R.
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#1b122c",
                padding: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#3a255c"
              }}
            >
              <Text style={{ color: "#ff2a8d", fontSize: 13, fontWeight: "bold", marginBottom: 2 }}>
                ✨ RENDU HD
              </Text>
              <Text style={{ color: "#a59cb8", fontSize: 12 }}>
                Anti-aliasing MSAA, textures nettes et fluidité 60 FPS activés.
              </Text>
            </View>
          </View>
        </Scroll>
      )}

      {/* In-Game Mode with Touch Gamepad */}
      {currentTab() === "game" && (
        <View style={{ flex: 1, position: "relative" }}>
          {/* Game Viewport / Canvas background */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#050308",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {/* Simulated Vice City Horizon / Ocean Beach Graphic */}
            <View
              style={{
                width: "90%",
                height: "80%",
                backgroundColor: "#120a1f",
                borderRadius: 16,
                borderWidth: 2,
                borderColor: "#ff2a8d44",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16
              }}
            >
              {/* Game HUD */}
              <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <View style={{ width: 100, height: 12, backgroundColor: "#3a1c28", borderRadius: 6, overflow: "hidden" }}>
                    <View style={{ width: "85%", height: "100%", backgroundColor: "#ff2a8d" }} />
                  </View>
                  <View style={{ width: 80, height: 12, backgroundColor: "#1c2a38", borderRadius: 6, overflow: "hidden" }}>
                    <View style={{ width: "100%", height: "100%", backgroundColor: "#00f0ff" }} />
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 16 }}>
                  <Text style={{ color: "#ffe600", fontSize: 16, fontWeight: "bold" }}>$125,480</Text>
                  <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold" }}>12:45</Text>
                  <Text style={{ color: "#ffe600", fontSize: 16, fontWeight: "bold" }}>★★☆☆☆☆</Text>
                </View>
              </View>

              {/* Game Title Display in Viewport */}
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: "#ff2a8d", fontSize: 26, fontWeight: "bold", letterSpacing: 2 }}>
                  VICE CITY STORIES
                </Text>
                <Text style={{ color: "#00f0ff", fontSize: 14, marginTop: 4 }}>
                  MOTEUR PS2 HD • {resolutionScale()} • 60 FPS
                </Text>
                <View
                  style={{
                    backgroundColor: "#2e1c4e",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginTop: 12
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 12 }}>
                    Entrée active : <Text style={{ color: "#ffe600", fontWeight: "bold" }}>{lastAction()}</Text>
                  </Text>
                </View>
              </View>

              {/* Status footer */}
              <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#a59cb8", fontSize: 11 }}>ROM: {romPath().split("/").pop()}</Text>
                <Text style={{ color: "#00e676", fontSize: 11, fontWeight: "bold" }}>MOTEUR NUXS/LEONIDAS CONNECTÉ</Text>
              </View>
            </View>
          </View>

          {/* Virtual Touch Controller Overlay */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 16,
              pointerEvents: "box-none"
            }}
          >
            {/* Left Controller Side: L1, L2, D-Pad, Left Stick */}
            <View style={{ width: 220, justifyContent: "space-between" }}>
              {/* Shoulder Buttons L1 / L2 */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View
                  onPress={() => setAction("L1 (Visée / Verrouillage)")}
                  style={{
                    backgroundColor: "#24183a",
                    borderWidth: 1,
                    borderColor: "#00f0ff",
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 16
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>L1</Text>
                </View>
                <View
                  onPress={() => setAction("L2 (Arme Précédente)")}
                  style={{
                    backgroundColor: "#24183a",
                    borderWidth: 1,
                    borderColor: "#00f0ff",
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 16
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>L2</Text>
                </View>
              </View>

              {/* D-Pad Cross */}
              <View style={{ alignItems: "center", justifyContent: "center", marginVertical: 12 }}>
                {/* UP */}
                <View
                  onPress={() => setAction("D-PAD HAUT")}
                  style={{
                    backgroundColor: "#24183a",
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#583c82"
                  }}
                >
                  <Text style={{ color: "#00f0ff", fontSize: 18, fontWeight: "bold" }}>▲</Text>
                </View>

                {/* LEFT / RIGHT */}
                <View style={{ flexDirection: "row", gap: 44, marginVertical: 4 }}>
                  <View
                    onPress={() => setAction("D-PAD GAUCHE")}
                    style={{
                      backgroundColor: "#24183a",
                      width: 44,
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#583c82"
                    }}
                  >
                    <Text style={{ color: "#00f0ff", fontSize: 18, fontWeight: "bold" }}>◀</Text>
                  </View>
                  <View
                    onPress={() => setAction("D-PAD DROITE")}
                    style={{
                      backgroundColor: "#24183a",
                      width: 44,
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#583c82"
                    }}
                  >
                    <Text style={{ color: "#00f0ff", fontSize: 18, fontWeight: "bold" }}>▶</Text>
                  </View>
                </View>

                {/* DOWN */}
                <View
                  onPress={() => setAction("D-PAD BAS")}
                  style={{
                    backgroundColor: "#24183a",
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#583c82"
                  }}
                >
                  <Text style={{ color: "#00f0ff", fontSize: 18, fontWeight: "bold" }}>▼</Text>
                </View>
              </View>

              {/* Left Analog Stick */}
              <View
                onPress={() => setAction("STICK ANALOGIQUE (Déplacement)")}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: "#24183a88",
                  borderWidth: 2,
                  borderColor: "#00f0ff88",
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "center"
                }}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: "#ff2a8d",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "bold" }}>L3</Text>
                </View>
              </View>
            </View>

            {/* Center Area: SELECT & START */}
            <View style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 16 }}>
              <View style={{ flexDirection: "row", gap: 18 }}>
                <View
                  onPress={() => setAction("SELECT")}
                  style={{
                    backgroundColor: "#24183a",
                    borderRadius: 14,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: "#583c82"
                  }}
                >
                  <Text style={{ color: "#a59cb8", fontSize: 11, fontWeight: "bold" }}>SELECT</Text>
                </View>
                <View
                  onPress={() => setAction("START (Pause)")}
                  style={{
                    backgroundColor: "#24183a",
                    borderRadius: 14,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderWidth: 1,
                    borderColor: "#583c82"
                  }}
                >
                  <Text style={{ color: "#a59cb8", fontSize: 11, fontWeight: "bold" }}>START</Text>
                </View>
              </View>
            </View>

            {/* Right Controller Side: R1, R2, PS Action Buttons (Triangle, Square, Circle, Cross) */}
            <View style={{ width: 220, justifyContent: "space-between", alignItems: "flex-end" }}>
              {/* Shoulder Buttons R1 / R2 */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View
                  onPress={() => setAction("R2 (Arme Suivante)")}
                  style={{
                    backgroundColor: "#24183a",
                    borderWidth: 1,
                    borderColor: "#ff2a8d",
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 16
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>R2</Text>
                </View>
                <View
                  onPress={() => setAction("R1 (Tir / Verrouillage)")}
                  style={{
                    backgroundColor: "#24183a",
                    borderWidth: 1,
                    borderColor: "#ff2a8d",
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 16
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>R1</Text>
                </View>
              </View>

              {/* PlayStation Action Buttons Diamond */}
              <View style={{ alignItems: "center", justifyContent: "center", marginVertical: 12, marginRight: 10 }}>
                {/* TRIANGLE (▲) */}
                <View
                  onPress={() => setAction("▲ TRIANGLE (Entrer/Sortir Véhicule)")}
                  style={{
                    backgroundColor: "#24183a",
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#00e676"
                  }}
                >
                  <Text style={{ color: "#00e676", fontSize: 20, fontWeight: "bold" }}>▲</Text>
                </View>

                {/* SQUARE (■) & CIRCLE (●) */}
                <View style={{ flexDirection: "row", gap: 50, marginVertical: 4 }}>
                  <View
                    onPress={() => setAction("■ CARRÉ (Saut / Frein)")}
                    style={{
                      backgroundColor: "#24183a",
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "#ff2a8d"
                    }}
                  >
                    <Text style={{ color: "#ff2a8d", fontSize: 20, fontWeight: "bold" }}>■</Text>
                  </View>
                  <View
                    onPress={() => setAction("● ROND (Attaque / Tir)")}
                    style={{
                      backgroundColor: "#24183a",
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "#ff3d00"
                    }}
                  >
                    <Text style={{ color: "#ff3d00", fontSize: 22, fontWeight: "bold" }}>●</Text>
                  </View>
                </View>

                {/* CROSS (✕) */}
                <View
                  onPress={() => setAction("✕ CROIX (Sprint / Accélération)")}
                  style={{
                    backgroundColor: "#24183a",
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#00f0ff"
                  }}
                >
                  <Text style={{ color: "#00f0ff", fontSize: 20, fontWeight: "bold" }}>✕</Text>
                </View>
              </View>

              {/* Right Camera / Look Analog Stick */}
              <View
                onPress={() => setAction("STICK DROIT (Caméra)")}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: "#24183a88",
                  borderWidth: 2,
                  borderColor: "#ff2a8d88",
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "center"
                }}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: "#00f0ff",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text style={{ color: "#000000", fontSize: 10, fontWeight: "bold" }}>R3</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Settings Screen */}
      {currentTab() === "settings" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          <View
            style={{
              backgroundColor: "#1b122c",
              borderRadius: 14,
              padding: 20,
              borderWidth: 1,
              borderColor: "#3a255c",
              marginBottom: 16
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
              PARAMÈTRES GRAPHIQUES & MOTEUR
            </Text>

            {/* HD Remaster Toggle */}
            <View
              onPress={() => hdLissage.set(!hdLissage())}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#2a1c42"
              }}
            >
              <View>
                <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold" }}>
                  Lissage Visuel HD (MSAA + Post-processing)
                </Text>
                <Text style={{ color: "#a59cb8", fontSize: 12 }}>
                  Élimine la pixellisation PS2 sans altérer la géométrie 3D
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: hdLissage() ? "#00e676" : "#443460",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 14
                }}
              >
                <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>
                  {hdLissage() ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </Text>
              </View>
            </View>

            {/* 60 FPS Toggle */}
            <View
              onPress={() => fps60.set(!fps60())}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#2a1c42"
              }}
            >
              <View>
                <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold" }}>
                  Mode Fluidité 60 FPS
                </Text>
                <Text style={{ color: "#a59cb8", fontSize: 12 }}>
                  Débloque la vitesse de rafraîchissement native
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: fps60() ? "#00e676" : "#443460",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 14
                }}
              >
                <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>
                  {fps60() ? "60 FPS" : "30 FPS"}
                </Text>
              </View>
            </View>

            {/* Resolution scale */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12
              }}
            >
              <View>
                <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold" }}>
                  Résolution Interne
                </Text>
                <Text style={{ color: "#a59cb8", fontSize: 12 }}>
                  Échelle de rendu du moteur
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {["1x Native", "2x HD", "3x FHD"].map((res) => (
                  <View
                    onPress={() => resolutionScale.set(res)}
                    style={{
                      backgroundColor: resolutionScale() === res ? "#ff2a8d" : "#2a1c42",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>{res}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Controller Settings */}
          <View
            style={{
              backgroundColor: "#1b122c",
              borderRadius: 14,
              padding: 20,
              borderWidth: 1,
              borderColor: "#3a255c",
              marginBottom: 20
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
              PARAMÈTRES DE LA MANETTE TACTILE
            </Text>

            <View
              onPress={() => hapticEnabled.set(!hapticEnabled())}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#2a1c42"
              }}
            >
              <View>
                <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold" }}>
                  Retour Haptique Vibrant
                </Text>
                <Text style={{ color: "#a59cb8", fontSize: 12 }}>
                  Vibre à chaque appui sur les boutons virtuels
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: hapticEnabled() ? "#00e676" : "#443460",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 14
                }}
              >
                <Text style={{ color: "#000000", fontSize: 11, fontWeight: "bold" }}>
                  {hapticEnabled() ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12
              }}
            >
              <View>
                <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold" }}>
                  Opacité par défaut
                </Text>
                <Text style={{ color: "#a59cb8", fontSize: 12 }}>
                  Transparence des boutons en jeu
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {[50, 75, 100].map((val) => (
                  <View
                    onPress={() => touchOpacity.set(val)}
                    style={{
                      backgroundColor: touchOpacity() === val ? "#ff2a8d" : "#2a1c42",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>{val}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Scroll>
      )}

      {/* About Screen */}
      {currentTab() === "about" && (
        <Scroll style={{ flex: 1, padding: 18 }}>
          <View
            style={{
              backgroundColor: "#1b122c",
              borderRadius: 14,
              padding: 22,
              borderWidth: 1,
              borderColor: "#3a255c",
              marginBottom: 16
            }}
          >
            <Text style={{ color: "#ff2a8d", fontSize: 20, fontWeight: "bold", marginBottom: 6 }}>
              LEONIDAS VICE CITY STORIES
            </Text>
            <Text style={{ color: "#00f0ff", fontSize: 13, fontWeight: "bold", marginBottom: 14 }}>
              VERSION 0.4.5 (ANDROID STABLE)
            </Text>
            <Text style={{ color: "#a59cb8", fontSize: 14, lineHeight: 22, marginBottom: 16 }}>
              Ce projet apporte un portage haute performance du classique PlayStation 2
              sur plateformes modernes (Windows, Linux, Android) grâce à la recompilation statique
              et à un moteur de rendu graphique modernisé.
            </Text>

            <View style={{ backgroundColor: "#0f0a1a", padding: 14, borderRadius: 10, marginBottom: 14 }}>
              <Text style={{ color: "#ffe600", fontSize: 12, fontWeight: "bold", marginBottom: 4 }}>
                🐊 MASCOTTE MACCA
              </Text>
              <Text style={{ color: "#a59cb8", fontSize: 12 }}>
                Intégration du logo officiel Macca transparent dans le launcher et les icônes de bureau.
              </Text>
            </View>

            <View style={{ backgroundColor: "#0f0a1a", padding: 14, borderRadius: 10 }}>
              <Text style={{ color: "#00e676", fontSize: 12, fontWeight: "bold", marginBottom: 4 }}>
                ⚖️ MENTIONS LÉGALES & ROMS
              </Text>
              <Text style={{ color: "#a59cb8", fontSize: 12 }}>
                L'application n'inclut aucune ressource propriétaire de Rockstar Games ni de Sony.
                L'utilisateur fournit sa propre image disque ISO légalement acquise.
              </Text>
            </View>
          </View>
        </Scroll>
      )}
    </View>
  );
}

mount(App);
