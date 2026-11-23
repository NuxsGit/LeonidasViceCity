// The title bar the launcher draws itself (the window has no Windows frame): the name, the sheets (Saves, Settings,
// Help) and the window's buttons. It tells the platform where the caption is, so dragging, double-click, snapping
// and the system menu stay Windows' own. macOS: its own traffic lights stay (top left), so none are drawn here.
#include "shell.h"

#include "platform/platform.h"

namespace screens
{
    using namespace render;
    using core::mix;
    using core::withAlpha;
    using core::rgb;
    using ui::label;

    namespace
    {
        void logo(float cx, float cy, float r)
        {
            // Macca the neon pink alligator mascot - transparent background (sans fond)
            const Color kSkin = rgb(0xED1E79);      // Neon pink skin
            const Color kShade = rgb(0xB51458);     // Deep pink shadow
            const Color kGlasses = rgb(0x0A0512);   // Dark synthwave sunglasses
            const Color kCyanGlint = rgb(0x29ABE2); // Vice City cyan glint
            const Color kWhite = rgb(0xFFFFFF);     // White glint / teeth

            const float s = r / 8.0f; // Scale relative to base 8px radius

            // 1. Alligator head and snout (facing right, strictly transparent background)
            // Head / cheek
            rect({cx - 7.0f * s, cy - 6.0f * s, 10.0f * s, 12.0f * s}, kSkin, 4.0f * s);
            // Snout extending right
            rect({cx - 2.0f * s, cy - 2.0f * s, 10.5f * s, 6.0f * s}, kSkin, 2.5f * s);
            // Lower jaw
            rect({cx - 1.0f * s, cy + 3.0f * s, 7.5f * s, 3.5f * s}, kShade, 1.5f * s);

            // 2. White teeth / cheeky grin
            rect({cx + 1.0f * s, cy + 2.0f * s, 4.5f * s, 1.6f * s}, kWhite, 0.8f * s);

            // 3. Crocodile nostril bump
            rect({cx + 6.2f * s, cy - 3.2f * s, 2.2f * s, 2.0f * s}, kSkin, 1.0f * s);

            // 4. Iconic synthwave black sunglasses
            // Left lens
            rect({cx - 4.5f * s, cy - 4.5f * s, 4.2f * s, 4.2f * s}, kGlasses, 1.0f * s);
            // Right angled lens over snout
            rect({cx + 0.2f * s, cy - 4.0f * s, 5.0f * s, 4.4f * s}, kGlasses, 1.2f * s);
            // Sunglasses bridge
            line(cx - 1.0f * s, cy - 2.5f * s, cx + 1.0f * s, cy - 2.5f * s, 1.5f * s, kGlasses);

            // 5. Sunglasses specular reflection glints
            line(cx + 1.2f * s, cy - 3.2f * s, cx + 3.2f * s, cy - 1.2f * s, 1.2f * s, kCyanGlint);
            line(cx + 2.2f * s, cy - 3.5f * s, cx + 3.6f * s, cy - 2.1f * s, 0.8f * s, kWhite);
        }

        bool windowButton(std::string_view idLabel, char32_t icon, Rect r, bool close)
        {
            const ui::Interaction in = ui::interact(ui::id(idLabel), r, false);
            const float hover = in.w->hover;
            if (close)
                rect(r, withAlpha(rgb(0xC42B1C), hover * (1.0f - 0.25f * in.w->press)));
            else
                rect(r, theme::ink(0.07f * hover + 0.05f * in.w->press));
            const Color c = close ? mix(theme::kDim, rgb(0xFFFFFF), hover) : mix(theme::kDim, theme::kText, hover);
            drawIcon(kFontIcons, px(10), r.cx(), r.cy(), platform::window.focused ? c : theme::kFaint, icon);
            return in.clicked;
        }

        bool navButton(std::string_view text, char32_t icon, Rect r, bool active, bool dot, std::vector<Rect> &hits)
        {
            hits.push_back(r);
            const ui::Interaction in = ui::interact(ui::id(text), r, true);
            ui::Widget &w = *in.w;
            if (w.fresh)
                w.t = active ? 1.0f : 0.0f;
            ui::animate(w.t, active ? 1.0f : 0.0f, 16);
            const Rect pillRect = r.inset(0, px(7));
            rect(pillRect, theme::ink(0.06f * w.hover + 0.09f * w.t), px(8));
            const Color c = mix(mix(theme::kDim, theme::kText, w.hover), theme::kText, w.t);
            drawIcon(kFontIcons, px(13), r.x + px(19), r.cy(), c, icon);
            label(kFontBody, px(theme::kSmall), {r.x + px(32), r.y, r.w - px(38), r.h}, c, text);
            if (dot)
            {
                circle(r.x + px(25), r.cy() - px(6), px(3.5f), theme::kNight);
                circle(r.x + px(25), r.cy() - px(6), px(2.5f), theme::kPink);
            }
            if (w.focus > 0.01f)
                outline(pillRect.inset(-px(2)), withAlpha(theme::kPink, w.focus * 0.85f), px(2), px(9));
            return in.clicked;
        }
    }

    float drawTitleBar(Rect window)
    {
        App &app = *shell.app;
        const float h = px(theme::kTitleBar);
        Rect bar{window.x, window.y, window.w, h};
        ui::beginLayer(kLayerSheet, false); // usable under a sheet, not under a dialog
        struct EndLayer
        {
            ~EndLayer() { ui::endLayer(); }
        } endLayer;
        // a hairline under it once something scrolls or a sheet covers the content
        rect({bar.x, bar.bottom() - 1, bar.w, 1}, theme::ink(0.04f));

        const bool focused = platform::window.focused;
        Rect left = bar;
#if defined(__APPLE__)
        // macOS keeps its own window buttons (the traffic lights, top left over our title bar, centred on it by
        // platform_macos.mm's placeWindowButtons: 15 pt in, the last one ending at 69 pt): room for them
        core::cutLeft(left, px(86));
#else
        core::cutLeft(left, px(16));
#endif
        logo(left.x + px(9), bar.cy(), px(8));
        core::cutLeft(left, px(28));
        const float nameW = measure(kFontSemibold, px(12.5f), "Leonidas ViceCityStories");
        label(kFontSemibold, px(12.5f), {left.x, bar.y, nameW + px(2), h}, focused ? theme::kText : theme::kDim, "Leonidas ViceCityStories");
        label(kFontBody, px(12.5f), {left.x + nameW + px(8), bar.y, px(200), h}, theme::kFaint,
              "PC port  \xC2\xB7  " + app.sourceVersion);

        std::vector<Rect> hits;
        Rect right = bar;
#if defined(__APPLE__)
        const Rect maxR{};
        core::cutRight(right, px(10));
#else
        const float bw = px(46);
        const Rect closeR = core::cutRight(right, bw), maxR = core::cutRight(right, bw), minR = core::cutRight(right, bw);
        hits.push_back(closeR);
        hits.push_back(minR);
        if (windowButton("#close", theme::icon::kClose, closeR, true))
            requestQuit(app);
        if (windowButton("#max", platform::window.maximized ? theme::icon::kRestore : theme::icon::kMaximize, maxR, false))
            platform::toggleMaximize();
        if (windowButton("#min", theme::icon::kMinimize, minR, false))
            platform::minimize();
        core::cutRight(right, px(10));
        rect({right.right(), bar.y + px(14), 1, h - px(28)}, theme::ink(0.08f));
        core::cutRight(right, px(10));
#endif

        struct Nav
        {
            const char *text;
            char32_t icon;
            Sheet sheet;
        };
        const Nav navs[] = {{"Help", theme::icon::kHelp, Sheet::Help},
                            {"Settings", theme::icon::kSettings, Sheet::Settings},
                            {"Mods", theme::icon::kRepair, Sheet::Mods},
                            {"Saves", theme::icon::kSave, Sheet::Saves}};
        for (const Nav &n : navs)
        {
            const float w = measure(kFontBody, px(theme::kSmall), n.text) + px(46);
            const Rect r = core::cutRight(right, w);
            const bool dot = n.sheet == Sheet::Settings && app.updateInfo["newer"].boolean();
            if (navButton(n.text, n.icon, r, shell.sheet == n.sheet, dot, hits))
                openSheet(shell.sheet == n.sheet ? Sheet::None : n.sheet);
            core::cutRight(right, px(4));
        }

        platform::Chrome chrome;
        chrome.caption = bar;
        chrome.maximizeButton = maxR;
        chrome.buttons = hits;
        platform::setChrome(chrome);
        return h;
    }
}
