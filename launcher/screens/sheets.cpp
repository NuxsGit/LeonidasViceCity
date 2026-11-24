// Sheets: Saves, Settings, Help and the build folder slide in from the right over a dimmed window, on a spring.
// Escape, the scrim or the title bar's button close them.
#include "shell.h"

#include "model/os.h"
#include "model/system.h"
#include "platform/platform.h"

namespace screens
{
    using namespace render;
    using core::alphaOf;
    using core::mix;
    using core::withAlpha;
    using core::rgb;
    using ui::ButtonStyle;

    namespace
    {
        void section(Rect r, float &y, std::string_view title)
        {
            ui::eyebrow(r.x, y, theme::kFaint, title);
            y += px(24);
        }

        void text(Rect r, float &y, std::string_view t, Color c = theme::kDim)
        {
            y += ui::paragraph(kFontBody, px(theme::kBody), {r.x, y, r.w, 0}, c, t) + px(8);
        }

        bool action(Rect r, float &y, std::string_view label, ButtonStyle style, char32_t icon = 0, bool enabled = true)
        {
            const bool clicked = ui::button(label, {r.x, y, ui::buttonWidth(label, icon), px(38)}, style, icon, enabled);
            y += px(48);
            return clicked;
        }

        void divider(Rect r, float &y)
        {
            y += px(10);
            rect({r.x, y, r.w, 1}, theme::ink(0.06f));
            y += px(22);
        }

        float saves(App &app, Rect r)
        {
            float y = r.y;
            if (!shell.backupsAsked && !app.busy())
            {
                shell.backupsAsked = true;
                app.startBackupList();
            }
            section(r, y, "MEMORY CARD");
            text(r, y, "Your saves are kept apart from the game, so updates and rebuilds never touch them.");
            y += row({r.x, y, r.w, 0}, "Folder", launcher::pathText(app.savesFolder()));
            y += px(6);
            const float w1 = ui::buttonWidth("Back up now", theme::icon::kSave);
            if (ui::button("Back up now", {r.x, y, w1, px(38)}, ButtonStyle::Primary, theme::icon::kSave, !app.busy()))
            {
                app.startBackup();
                shell.backupsAsked = false; // the list again afterwards
            }
            if (ui::button("Open the folder", {r.x + w1 + px(8), y, ui::buttonWidth("Open the folder", theme::icon::kFolder), px(38)},
                           ButtonStyle::Ghost, theme::icon::kFolder))
                launcher::openFolder(app.savesFolder());
            y += px(48);
            divider(r, y);

            section(r, y, "BACKUPS");
            if (app.busy() && (app.task->kind == "backup_list" || app.task->kind == "backup"))
            {
                ui::spinner(r.x + px(9), y + px(11), px(7), theme::kDim, px(1.8f));
                ui::label(kFontBody, px(theme::kBody), {r.x + px(26), y, r.w, px(22)}, theme::kDim, "Loading...");
                y += px(34);
            }
            else if (!app.backups.size())
                text(r, y, "None yet. A backup is a zip of the card, with the order the game needs.", theme::kFaint);
            else
                for (size_t i = 0; i < app.backups.size(); ++i)
                {
                    const launcher::Json &b = app.backups[i];
                    const std::string name = b["name"].str();
                    const Rect item{r.x - px(10), y, r.w + px(20), px(56)};
                    ui::pushId(int(i));
                    const bool over = ui::mouseOver(item);
                    rect(item, theme::ink(over ? 0.035f : 0.0f), px(10));
                    drawIcon(kFontIcons, px(15), item.x + px(26), item.cy(), theme::kPink, theme::icon::kSave);
                    ui::label(kFontSemibold, px(theme::kBody), {item.x + px(48), item.y + px(8), item.w - px(170), px(22)}, theme::kText, name);
                    ui::label(kFontBody, px(theme::kSmall), {item.x + px(48), item.y + px(29), item.w - px(170), px(20)}, theme::kFaint, b["saves"].str());
                    const float bw = ui::buttonWidth("Restore", theme::icon::kUndo);
                    if (ui::button("Restore", {item.right() - bw - px(10), item.y + px(10), bw, px(36)}, ButtonStyle::Ghost, theme::icon::kUndo,
                                   !app.busy() && !app.gameRunning))
                    {
                        shell.restoreName = name;
                        openDialog(Dialog::Restore);
                    }
                    ui::popId();
                    y += item.h + px(4);
                }
            if (app.gameRunning)
                text(r, y, "Quit the game to restore a backup.", theme::kAmber);
            y += px(4);
            if (action(r, y, "Open the backups folder", ButtonStyle::Ghost, theme::icon::kFolder))
                launcher::openFolder(app.savesFolder() / "backups");
            return y;
        }

        float settings(App &app, Rect r)
        {
            float y = r.y;
            bool changed = false;
            section(r, y, "WHEN THE GAME STARTS");
            const char *values[] = {"minimize", "close", "stay"};
            const char *titles[] = {"Minimize the launcher", "Close the launcher", "Keep the launcher open"};
            const char *details[] = {"It comes back when the game ends", "", ""};
            for (int i = 0; i < 3; ++i)
            {
                const float h = details[i][0] ? px(56) : px(44);
                if (ui::choiceRow(values[i], {r.x - px(10), y, r.w + px(20), h}, titles[i], details[i], app.settings.afterLaunch == values[i]))
                {
                    app.settings.afterLaunch = values[i];
                    changed = true;
                }
                y += h + px(2);
            }
            divider(r, y);

            section(r, y, "UPDATES");
            if (!app.canUpdate())
            {
                // a Linux clone (an AppImage updates itself): git
                y += row({r.x, y, r.w, 0}, "This version", app.sourceVersion);
                text(r, y, "Update this folder with git pull, then build again (Update the build on Home).", theme::kFaint);
            }
            else if (!app.updatedTo.empty())
            {
                // updated, the restart put off ("Later"): this window is still the old launcher
                const std::string tag = "VERSION " + app.updatedTo + " INSTALLED";
                ui::pill({r.x, y, ui::pillWidth(tag), px(22)}, tag, theme::kTeal);
                y += px(34);
                text(r, y, "Restart the launcher to use the new version, then update the build.", theme::kFaint);
                if (action(r, y, "Restart", ButtonStyle::Primary, theme::icon::kRefresh))
                    restartLauncher(app);
            }
            else if (app.updateInfo["newer"].boolean())
            {
                const std::string tag = "VERSION " + app.updateInfo["latest"].str() + " AVAILABLE";
                ui::pill({r.x, y, ui::pillWidth(tag), px(22)}, tag, theme::kPink);
                y += px(34);
                const float w1 = ui::buttonWidth("Update now", theme::icon::kDownload);
                if (ui::button("Update now", {r.x, y, w1, px(38)}, ButtonStyle::Primary, theme::icon::kDownload, !app.busy() && !app.gameRunning))
                {
                    shell.sheet = Sheet::None;
                    app.startUpdate();
                }
                if (ui::button("What's new", {r.x + w1 + px(8), y, ui::buttonWidth("What's new", theme::icon::kOpen), px(38)}, ButtonStyle::Ghost, theme::icon::kOpen))
                    launcher::openUrl(app.updateInfo["url"].str());
                y += px(52);
            }
            else
                y += row({r.x, y, r.w, 0}, "This version", app.sourceVersion);
            if (app.canUpdate())
            {
                const Rect line{r.x, y, r.w, px(30)};
                ui::label(kFontBody, px(theme::kBody), {line.x, line.y, line.w - px(60), line.h}, theme::kText, "Check for a new release at start");
                changed |= ui::toggle("#check-updates", {line.right() - px(44), line.y, px(44), line.h}, app.settings.checkUpdates);
                y += px(34);
            }
            if (app.canUpdate())
            {
                text(r, y, "One request to GitHub; nothing about you or your PC is sent.", theme::kFaint);
                if (action(r, y, app.busy() && app.task->kind == "update_check" ? "Checking..." : "Check now", ButtonStyle::Secondary, theme::icon::kSync, !app.busy()))
                    app.startUpdateCheck(false);
            }
            divider(r, y);

            section(r, y, "APPEARANCE");
            {
                static const char *themes[] = {"system", "light", "dark"};
                int selected = 0;
                for (int i = 0; i < 3; ++i)
                    if (app.settings.theme == themes[i])
                        selected = i;
                if (ui::segmented("#theme", {r.x, y, std::min(r.w, px(340)), px(38)}, {"System", "Light", "Dark"}, selected))
                {
                    app.settings.theme = themes[selected];
                    changed = true;
                }
                y += px(48);
                text(r, y, selected == 0 ? std::string(launcher::os::kWindows ? "Follows Windows' app mode, now " : "Follows the desktop's style, now ") + (platform::window.darkMode ? "dark." : "light.")
                                         : std::string("Always ") + (selected == 1 ? "light." : "dark."),
                     theme::kFaint);
            }
            divider(r, y);

            section(r, y, "THIS LAUNCHER");
            {
                const Rect line{r.x, y, r.w, px(30)};
                ui::label(kFontBody, px(theme::kBody), {line.x, line.y, line.w - px(60), line.h}, theme::kText, "Reduce motion");
                bool reduce = reduceMotion(app);
                if (ui::toggle("#reduce-motion", {line.right() - px(44), line.y, px(44), line.h}, reduce))
                {
                    app.settings.reduceMotion = reduce;
                    changed = true;
                }
                y += px(34);
                text(r, y, "Everything moves at once instead of animating, and Home's scene stands still.", theme::kFaint);
            }
            if (action(r, y, "Add a shortcut to the desktop", ButtonStyle::Secondary, theme::icon::kLink))
            {
                std::string error;
                toast(app.shortcut(error) ? "Shortcut \"GTA Vice City Stories\" added to the desktop" : "No shortcut: " + error,
                      error.empty() ? 0 : theme::kRed);
            }
            text(r, y, "The game's own settings - graphics, widescreen, controls, sound - are in the game: press F2 while playing.", theme::kFaint);
            if (changed)
                app.saveSettings();
            return y;
        }

        float help(App &app, Rect r)
        {
            float y = r.y;
            section(r, y, "REPORT A PROBLEM");
            text(r, y, "Makes a zip of the build's and the game's logs and what this PC has - no game files, no saves - to attach to your bug report.");
            if (action(r, y, "Make a report", ButtonStyle::Primary, theme::icon::kBug, !app.busy()))
            {
                shell.sheet = Sheet::None;
                app.startReport();
            }
            divider(r, y);
            section(r, y, "FILES");
            struct File
            {
                const char *label;
                std::filesystem::path path;
            };
            const File files[] = {{"The game's last log", app.build / "run" / "launcher_game.log"},
                                  {"Build log", app.build / "build.log"},
                                  {"README", app.root / "README.md"}};
            for (const File &f : files)
            {
                std::error_code ec;
                if (ui::button(f.label, {r.x - px(4), y, r.w + px(8), px(36)}, ButtonStyle::Ghost, theme::icon::kDocument,
                               std::filesystem::is_regular_file(f.path, ec)))
                    launcher::openFile(f.path);
                y += px(40);
            }
            divider(r, y);
            section(r, y, "KEYBOARD");
            const char *keys[][2] = {{"Enter", "The highlighted action (Play, Build...)"},
                                     {"Esc", "Close a sheet or a dialog"},
                                     {"F1", "This help"},
                                     {"Ctrl+L", "The log of a running task"},
                                     {"Tab", "Move between controls"}};
            for (const auto &k : keys)
            {
                const float kw = measure(kFontSemibold, px(12), k[0]) + px(16);
                rectEx({r.x, y + px(3), kw, px(22)}, theme::kSurfaceHi, theme::kSurfaceHi, px(5), theme::ink(0.10f), ui::hairline());
                ui::label(kFontSemibold, px(12), {r.x, y + px(3), kw, px(22)}, theme::kText, k[0], ui::Align::Centre);
                ui::label(kFontBody, px(theme::kSmall), {r.x + px(84), y, r.w - px(84), px(28)}, theme::kDim, k[1]);
                y += px(32);
            }
            divider(r, y);
            section(r, y, "ABOUT");
            y += row({r.x, y, r.w, 0}, "Version", app.sourceVersion);
            y += row({r.x, y, r.w, 0}, "Folder", launcher::pathText(app.root));
            y += row({r.x, y, r.w, 0}, "Python", app.pythonText);
            y += px(6);
            text(r, y, "Unofficial. Grand Theft Auto is property of Rockstar Games / Take-Two Interactive; this port contains no game code or data.", theme::kFaint);
            return y;
        }

        float folder(App &, Rect r)
        {
            float y = r.y;
            drawFolderBody(r, y);
            return y;
        }

        float mods(App &app, Rect r)
        {
            float y = r.y;
            section(r, y, "LVCS HD REMAKE");
            text(r, y, "Enable or tune integrated visual enhancements, modern PC controls, and custom mods.");

            // Master HD Remake Switch
            {
                const float cardH = px(64);
                const Rect card{r.x, y, r.w, cardH};
                rectEx(card, theme::kBase, mix(theme::kBase, theme::kPink, 0.15f), px(theme::kRadiusSmall), theme::ink(0.08f), ui::hairline());
                drawText(kFontSemibold, px(theme::kBody), card.x + px(14), card.y + px(14), theme::kText, "LVCS HD Remake Engine");
                ui::label(kFontBody, px(theme::kSmall), {card.x + px(14), card.y + px(36), card.w - px(70), px(20)}, theme::kDim, "Activates 4K textures, 80s neon shaders & ultra detail");

                bool active = app.hdRemakePreset;
                const Rect toggleR{card.right() - px(46), card.y + (cardH - px(26)) * 0.5f, px(38), px(26)};
                if (ui::toggle("#hd-remake-master-toggle", toggleR, active, true))
                {
                    app.applyHdRemakePreset(active);
                }
                y += cardH + px(12);
            }

            divider(r, y);

            const std::string modsTitle = "INSTALLED MODS (" + std::to_string(app.mods.size()) + ")";
            section(r, y, modsTitle.c_str());
            if (app.mods.empty())
            {
                text(r, y, "No mods detected. Click 'Open Mods Folder' below to add mods.", theme::kFaint);
                y += px(10);
            }
            else
            {
                for (size_t i = 0; i < app.mods.size(); ++i)
                {
                    auto &m = app.mods[i];
                    const float cardH = px(74);
                    const Rect card{r.x, y, r.w, cardH};
                    rectEx(card, theme::kBase, mix(theme::kBase, theme::kNight, 0.4f), px(theme::kRadiusSmall), theme::ink(0.05f), ui::hairline());

                    // Mod Category Pill (aligned before switch)
                    const std::string tag = m.category;
                    const float pw = ui::pillWidth(tag);
                    const Color tagCol = m.category == "Visuals" ? theme::kPink : m.category == "UI" ? theme::kTeal : m.category == "Controls" ? theme::kAmber : theme::kPinkHi;
                    const float pillX = card.right() - pw - px(56);
                    ui::pill({pillX, card.y + px(14), pw, px(18)}, tag, tagCol);

                    // Mod Title (clipped cleanly so it never touches the pill)
                    ui::label(kFontSemibold, px(theme::kBody), {card.x + px(14), card.y + px(12), pillX - card.x - px(20), px(22)}, theme::kText, m.name);

                    // Mod Description (limited width so it never touches the toggle)
                    ui::label(kFontBody, px(theme::kSmall), {card.x + px(14), card.y + px(38), card.w - px(70), px(24)}, theme::kDim, m.description);

                    // Mod Toggle
                    bool enabled = m.enabled;
                    const std::string toggleId = "#mod-toggle-" + m.id;
                    const Rect toggleR{card.right() - px(46), card.y + (cardH - px(26)) * 0.5f, px(38), px(26)};
                    if (ui::toggle(toggleId, toggleR, enabled, true))
                    {
                        app.setModEnabled(m.id, enabled);
                    }

                    y += cardH + px(10);
                }
            }

            divider(r, y);

            section(r, y, "ACTIONS");
            if (action(r, y, "Open Mods Folder", ButtonStyle::Secondary, theme::icon::kFolder))
            {
                app.openModsFolder();
            }
            if (action(r, y, "Reload Mods", ButtonStyle::Secondary, theme::icon::kRefresh))
            {
                app.refreshMods();
            }

            return y;
        }

        float multiplayer(App &app, Rect r)
        {
            float y = r.y;
            // 1. Navigation Tabs: [ Personnage ] [ Sauvegardes MP ] [ Outil Dev (2 Sessions) ]
            const float tabW = (r.w - px(16)) / 3.0f;
            const float tabH = px(32);
            if (ui::button("Personnage", {r.x, y, tabW, tabH}, shell.mpTab == 0 ? ButtonStyle::Primary : ButtonStyle::Ghost, theme::icon::kSettings))
                shell.mpTab = 0;
            if (ui::button("Sauvegardes MP", {r.x + tabW + px(8), y, tabW, tabH}, shell.mpTab == 1 ? ButtonStyle::Primary : ButtonStyle::Ghost, theme::icon::kSave))
                shell.mpTab = 1;
            if (ui::button("Outil Dev", {r.x + (tabW + px(8)) * 2.0f, y, tabW, tabH}, shell.mpTab == 2 ? ButtonStyle::Primary : ButtonStyle::Ghost, theme::icon::kCode))
                shell.mpTab = 2;
            y += tabH + px(16);

            auto &c = app.mpCharacter;

            if (shell.mpTab == 0) // Character Editor
            {
                section(r, y, "APER\xC3\x87U EN DIRECT DU PERSONNAGE");

                // Character Preview Card
                const float prevH = px(150);
                const Rect prevCard{r.x, y, r.w, prevH};
                rectEx(prevCard, theme::kBase, mix(theme::kBase, theme::kPink, 0.12f), px(theme::kRadius), theme::ink(0.08f), ui::hairline());

                // Draw Character Portrait
                const float pCx = prevCard.x + px(65);
                const float pCy = prevCard.y + prevH * 0.5f;
                // Synthwave glow backdrop ring
                circle(pCx, pCy, px(42), withAlpha(theme::kPink, 0.35f));
                circle(pCx, pCy, px(38), theme::kNight);

                // Colors lookup tables
                static const Color kSkins[] = {rgb(0xFFDFC4), rgb(0xE0AC69), rgb(0xC68642), rgb(0x8D5524)};
                static const Color kHairs[] = {rgb(0x181210), rgb(0x4E2F1D), rgb(0xE6BF83), rgb(0xBA4D32), rgb(0xED1E79), rgb(0x29ABE2), rgb(0xD4D8DD)};
                static const Color kTopColors[] = {rgb(0xF48FB1), rgb(0x4DD0E1), rgb(0xFFFFFF), rgb(0x212121), rgb(0x9C27B0), rgb(0xFFD54F)};

                const Color skinC = kSkins[std::clamp(c.skinTone, 0, 3)];
                const Color hairC = kHairs[std::clamp(c.hairColor, 0, 6)];
                const Color topC = kTopColors[std::clamp(c.outfitColor, 0, 5)];

                // Torso / Outfit
                const float torsoW = (c.gender == 0) ? px(38) : px(32);
                const float torsoH = px(36);
                rect({pCx - torsoW * 0.5f, pCy + px(8), torsoW, torsoH}, topC, px(4));
                // Neck
                rect({pCx - px(6), pCy - px(2), px(12), px(12)}, skinC, px(2));
                // Head
                circle(pCx, pCy - px(10), px(18), skinC);

                // Hair Drawing
                if (c.gender == 0) // Male Hair Styles
                {
                    if (c.hairStyle == 0) // Pompadour
                    {
                        rect({pCx - px(18), pCy - px(30), px(36), px(14)}, hairC, px(6));
                        circle(pCx + px(2), pCy - px(28), px(10), hairC);
                    }
                    else if (c.hairStyle == 1) // Miami Fade / Short
                    {
                        rect({pCx - px(17), pCy - px(26), px(34), px(10)}, hairC, px(4));
                    }
                    else if (c.hairStyle == 2) // Afro
                    {
                        circle(pCx, pCy - px(16), px(25), hairC);
                        circle(pCx, pCy - px(10), px(18), skinC);
                    }
                    else if (c.hairStyle == 3) // Slicked back
                    {
                        rect({pCx - px(18), pCy - px(28), px(36), px(11)}, hairC, px(5));
                        line(pCx - px(14), pCy - px(26), pCx + px(14), pCy - px(26), px(2), withAlpha(rgb(0xFFFFFF), 0.25f));
                    }
                    else if (c.hairStyle == 4) // Crew cut
                    {
                        rect({pCx - px(16), pCy - px(24), px(32), px(7)}, hairC, px(3));
                    }
                }
                else // Female Hair Styles
                {
                    if (c.hairStyle == 0) // High Ponytail
                    {
                        rect({pCx - px(18), pCy - px(28), px(36), px(12)}, hairC, px(5));
                        circle(pCx + px(18), pCy - px(16), px(10), hairC);
                    }
                    else if (c.hairStyle == 1) // Retro 80s Bob
                    {
                        rect({pCx - px(22), pCy - px(28), px(44), px(24)}, hairC, px(8));
                        circle(pCx, pCy - px(10), px(17), skinC);
                    }
                    else if (c.hairStyle == 2) // Wavy Medium
                    {
                        rect({pCx - px(21), pCy - px(28), px(42), px(28)}, hairC, px(6));
                        circle(pCx, pCy - px(10), px(17), skinC);
                    }
                    else if (c.hairStyle == 3) // Volume Perm
                    {
                        circle(pCx, pCy - px(14), px(27), hairC);
                        circle(pCx, pCy - px(10), px(17), skinC);
                    }
                    else // Long Straight
                    {
                        rect({pCx - px(20), pCy - px(28), px(40), px(34)}, hairC, px(4));
                        circle(pCx, pCy - px(10), px(17), skinC);
                    }
                }

                // Eyes
                circle(pCx - px(6), pCy - px(9), px(2), rgb(0x222222));
                circle(pCx + px(6), pCy - px(9), px(2), rgb(0x222222));

                // Accessories
                if (c.accessory == 1) // Aviator Sunglasses
                {
                    rect({pCx - px(12), pCy - px(13), px(11), px(8)}, rgb(0x0A0512), px(2));
                    rect({pCx + px(1), pCy - px(13), px(11), px(8)}, rgb(0x0A0512), px(2));
                    line(pCx - px(1), pCy - px(10), pCx + px(1), pCy - px(10), px(1.5f), rgb(0x0A0512));
                    line(pCx + px(3), pCy - px(11), pCx + px(9), pCy - px(7), px(1.2f), rgb(0x29ABE2));
                }
                else if (c.accessory == 2) // Gold Chain
                {
                    line(pCx - px(8), pCy + px(8), pCx, pCy + px(16), px(2), rgb(0xFCEE21));
                    line(pCx + px(8), pCy + px(8), pCx, pCy + px(16), px(2), rgb(0xFCEE21));
                    circle(pCx, pCy + px(17), px(3), rgb(0xFCEE21));
                }
                else if (c.accessory == 3) // Bandana
                {
                    rect({pCx - px(17), pCy - px(19), px(34), px(5)}, theme::kPink, px(2));
                }
                else if (c.accessory == 4) // Driving Gloves
                {
                    rect({pCx - torsoW * 0.5f - px(4), pCy + px(24), px(5), px(8)}, rgb(0x331100), px(2));
                    rect({pCx + torsoW * 0.5f - px(1), pCy + px(24), px(5), px(8)}, rgb(0x331100), px(2));
                }

                // Info lines next to preview
                const float tx = prevCard.x + px(130);
                float ty = prevCard.y + px(18);
                drawText(kFontSemibold, px(18), tx, ty + metrics(kFontSemibold, px(18)).ascent, theme::kText, c.name);
                ty += px(24);
                ui::label(kFontBody, px(theme::kSmall), {tx, ty, prevCard.w - px(140), px(20)}, theme::kPink,
                          (c.gender == 0 ? "Homme (Male)" : "Femme (Female)") + std::string("  \xC2\xB7  Vice City Operator"));
                ty += px(22);
                ui::label(kFontBody, px(theme::kSmall), {tx, ty, prevCard.w - px(140), px(20)}, theme::kDim,
                          "Solde MP : $" + std::to_string(c.cash) + "  \xC2\xB7  Reputation : " + std::to_string(c.rep) + " RP");
                ty += px(22);
                ui::label(kFontBody, px(theme::kSmall), {tx, ty, prevCard.w - px(140), px(20)}, theme::kTeal,
                          "Relais Multijoueur : " + c.serverHost + ":" + std::to_string(c.serverPort));

                y += prevH + px(20);

                // --- CONTROLS SECTION ---
                divider(r, y);
                section(r, y, "PERSONNALISATION DU PERSONNAGE");

                // 1. Sexe / Genre
                ui::label(kFontBody, px(theme::kSmall), {r.x, y, px(120), px(32)}, theme::kDim, "Genre / Sexe");
                const float gW = (r.w - px(130)) * 0.5f;
                if (ui::button("Homme (Male)", {r.x + px(120), y, gW, px(32)}, c.gender == 0 ? ButtonStyle::Primary : ButtonStyle::Ghost))
                    c.gender = 0;
                if (ui::button("Femme (Female)", {r.x + px(124) + gW, y, gW, px(32)}, c.gender == 1 ? ButtonStyle::Primary : ButtonStyle::Ghost))
                    c.gender = 1;
                y += px(40);

                // 2. Couleur de Peau
                ui::label(kFontBody, px(theme::kSmall), {r.x, y, px(120), px(32)}, theme::kDim, "Teint de peau");
                const char *skinNames[] = {"Clair", "Bronz\xC3\xA9", "M\xC3\xA9tis", "\xC3\x89""b\xC3\xA8ne"};
                const float skW = (r.w - px(140)) / 4.0f;
                for (int s = 0; s < 4; ++s)
                {
                    if (ui::button(skinNames[s], {r.x + px(120) + s * (skW + px(4)), y, skW, px(32)},
                                   c.skinTone == s ? ButtonStyle::Primary : ButtonStyle::Ghost))
                    {
                        c.skinTone = s;
                    }
                }
                y += px(40);

                // 3. Coupe de Cheveux
                static const char *kMaleHair[] = {"Pompadour 80s", "D\xC3\xA9grad\xC3\xA9 Miami", "Afro Volumineux", "Gomin\xC3\xA9s Arri\xC3\xA8re", "Coupe Fade", "Cr\xC3\xA2ne Ras\xC3\xA9"};
                static const char *kFemHair[] = {"Queue de Cheval", "Carr\xC3\xA9 R\xC3\xA9tro 80s", "Ondul\xC3\xA9 Mi-Long", "Permanente Volume", "Cheveux Lisses", "Nattes Miami"};
                const char *curHair = (c.gender == 0) ? kMaleHair[std::clamp(c.hairStyle, 0, 5)] : kFemHair[std::clamp(c.hairStyle, 0, 5)];

                ui::label(kFontBody, px(theme::kSmall), {r.x, y, px(120), px(32)}, theme::kDim, "Cheveux");
                if (ui::button("<", {r.x + px(120), y, px(34), px(32)}, ButtonStyle::Ghost))
                {
                    c.hairStyle = (c.hairStyle + 5) % 6;
                }
                const float hairFieldW = r.w - px(120) - px(76);
                ui::label(kFontSemibold, px(theme::kSmall), {r.x + px(158), y, hairFieldW, px(32)}, theme::kText, curHair);
                if (ui::button(">", {r.x + px(162) + hairFieldW, y, px(34), px(32)}, ButtonStyle::Ghost))
                {
                    c.hairStyle = (c.hairStyle + 1) % 6;
                }
                y += px(40);

                // 4. Couleur des Cheveux
                ui::label(kFontBody, px(theme::kSmall), {r.x, y, px(120), px(32)}, theme::kDim, "Teinte Cheveux");
                static const char *kHairColNames[] = {"Noir", "Brun", "Blond", "Roux", "Rose", "Cyan", "Argent"};
                const float hcW = (r.w - px(148)) / 7.0f;
                for (int h = 0; h < 7; ++h)
                {
                    if (ui::button(kHairColNames[h], {r.x + px(120) + h * (hcW + px(4)), y, hcW, px(32)},
                                   c.hairColor == h ? ButtonStyle::Primary : ButtonStyle::Ghost))
                    {
                        c.hairColor = h;
                    }
                }
                y += px(40);

                // 5. Tenue / Haut
                static const char *kOutfits[] = {"Chemise Hawa\xC3\xAF""enne", "Costume Pastel 80s", "Blouson Cuir R\xC3\xA9tro", "D\xC3\xA9""bardeur Muscle", "Surv\xC3\xAAtement Veloce", "Veste Denim Vintage"};
                ui::label(kFontBody, px(theme::kSmall), {r.x, y, px(120), px(32)}, theme::kDim, "Haut / Tenue");
                if (ui::button("<", {r.x + px(120), y, px(34), px(32)}, ButtonStyle::Ghost))
                {
                    c.outfit = (c.outfit + 5) % 6;
                }
                const float outFieldW = r.w - px(120) - px(76);
                ui::label(kFontSemibold, px(theme::kSmall), {r.x + px(158), y, outFieldW, px(32)}, theme::kText, kOutfits[std::clamp(c.outfit, 0, 5)]);
                if (ui::button(">", {r.x + px(162) + outFieldW, y, px(34), px(32)}, ButtonStyle::Ghost))
                {
                    c.outfit = (c.outfit + 1) % 6;
                }
                y += px(40);

                // 6. Couleur du Haut
                ui::label(kFontBody, px(theme::kSmall), {r.x, y, px(120), px(32)}, theme::kDim, "Couleur Haut");
                static const char *kTopColNames[] = {"Rose", "Cyan", "Blanc", "Noir", "Pourpre", "Or"};
                const float tcW = (r.w - px(144)) / 6.0f;
                for (int t = 0; t < 6; ++t)
                {
                    if (ui::button(kTopColNames[t], {r.x + px(120) + t * (tcW + px(4)), y, tcW, px(32)},
                                   c.outfitColor == t ? ButtonStyle::Primary : ButtonStyle::Ghost))
                    {
                        c.outfitColor = t;
                    }
                }
                y += px(40);

                // 7. Bas / Pantalon
                static const char *kPants[] = {"Pantalon Lin Blanc", "Jean D\xC3\xA9lav\xC3\xA9 80s", "Bermuda Ocean Beach", "Pantalon Cuir Noir"};
                ui::label(kFontBody, px(theme::kSmall), {r.x, y, px(120), px(32)}, theme::kDim, "Bas / Pantalon");
                if (ui::button("<", {r.x + px(120), y, px(34), px(32)}, ButtonStyle::Ghost))
                {
                    c.pants = (c.pants + 3) % 4;
                }
                ui::label(kFontSemibold, px(theme::kSmall), {r.x + px(158), y, outFieldW, px(32)}, theme::kText, kPants[std::clamp(c.pants, 0, 3)]);
                if (ui::button(">", {r.x + px(162) + outFieldW, y, px(34), px(32)}, ButtonStyle::Ghost))
                {
                    c.pants = (c.pants + 1) % 4;
                }
                y += px(40);

                // 8. Accessoire
                static const char *kAccs[] = {"Aucun", "Lunettes Aviator R\xC3\xA9tro", "Cha\xC3\xAEne en Or Massif", "Bandana Synthwave", "Gants de Conduite"};
                ui::label(kFontBody, px(theme::kSmall), {r.x, y, px(120), px(32)}, theme::kDim, "Accessoire");
                if (ui::button("<", {r.x + px(120), y, px(34), px(32)}, ButtonStyle::Ghost))
                {
                    c.accessory = (c.accessory + 4) % 5;
                }
                ui::label(kFontSemibold, px(theme::kSmall), {r.x + px(158), y, outFieldW, px(32)}, theme::kText, kAccs[std::clamp(c.accessory, 0, 4)]);
                if (ui::button(">", {r.x + px(162) + outFieldW, y, px(34), px(32)}, ButtonStyle::Ghost))
                {
                    c.accessory = (c.accessory + 1) % 5;
                }
                y += px(48);

                // Save button
                const float sBtnW = ui::buttonWidth("Sauvegarder le Personnage", theme::icon::kSave);
                if (ui::button("Sauvegarder le Personnage", {r.x, y, sBtnW, px(38)}, ButtonStyle::Primary, theme::icon::kSave))
                {
                    app.saveMultiplayerProfile();
                    toast("Personnage multijoueur enregistre !");
                }
                y += px(48);
            }
            else if (shell.mpTab == 1) // Multiplayer Saves
            {
                section(r, y, "SAUVEGARDES MULTIJOUEUR D\xC3\x89""DI\xC3\x89""ES");
                text(r, y, "Les sauvegardes multijoueur sont stock\xC3\xA9""es s\xC3\xA9par\xC3\xA9ment dans build/multiplayer/saves/ et ne modifient jamais les sauvegardes solo (mc0/).");

                y += row({r.x, y, r.w, 0}, "Emplacement", launcher::pathText(app.build / "multiplayer" / "saves"));
                y += row({r.x, y, r.w, 0}, "Slot Actif", app.currentMpSave, theme::kPink);
                y += px(12);

                for (const auto &slot : app.mpSaves)
                {
                    const float sCardH = px(62);
                    const Rect sCard{r.x, y, r.w, sCardH};
                    const bool isCur = (slot == app.currentMpSave);
                    rectEx(sCard, theme::kBase, isCur ? mix(theme::kBase, theme::kPink, 0.15f) : theme::kBase,
                           px(theme::kRadiusSmall), isCur ? theme::kPink : theme::ink(0.08f), ui::hairline());

                    drawIcon(kFontIcons, px(16), sCard.x + px(22), sCard.cy(), isCur ? theme::kPink : theme::kDim, theme::icon::kSave);
                    drawText(kFontSemibold, px(theme::kBody), sCard.x + px(44), sCard.y + px(12), theme::kText, slot);
                    ui::label(kFontBody, px(theme::kSmall), {sCard.x + px(44), sCard.y + px(34), sCard.w - px(200), px(20)},
                              theme::kDim, "Profil : " + c.name + "  \xC2\xB7  $" + std::to_string(c.cash) + "  \xC2\xB7  " + std::to_string(c.rep) + " RP");

                    // Slot action buttons
                    const float lBtnW = px(82);
                    const float svBtnW = px(96);
                    if (ui::button("Charger", {sCard.right() - lBtnW - svBtnW - px(16), sCard.y + px(14), lBtnW, px(32)}, ButtonStyle::Ghost))
                    {
                        app.loadMultiplayerSlot(slot);
                        toast("Slot multijoueur " + slot + " charge !");
                    }
                    if (ui::button("Sauvegarder", {sCard.right() - svBtnW - px(12), sCard.y + px(14), svBtnW, px(32)},
                                   isCur ? ButtonStyle::Primary : ButtonStyle::Secondary))
                    {
                        app.saveMultiplayerSlot(slot);
                        toast("Profil sauvegarde dans " + slot + " !");
                    }
                    y += sCardH + px(10);
                }

                y += px(12);
                const float nBtnW = ui::buttonWidth("Nouveau Slot MP", theme::icon::kRepair);
                if (ui::button("Nouveau Slot MP", {r.x, y, nBtnW, px(38)}, ButtonStyle::Secondary, theme::icon::kRepair))
                {
                    std::string newSlot = "MP_SLOT_0" + std::to_string(app.mpSaves.size() + 1);
                    app.saveMultiplayerSlot(newSlot);
                    toast("Nouveau slot cree : " + newSlot);
                }
                y += px(48);
            }
            else if (shell.mpTab == 2) // Dev Tool Dual Sessions
            {
                section(r, y, "OUTIL D\xC3\x89VELOPPEUR : DOUBLE SESSION MULTIJOUEUR");
                text(r, y, "Permet de tester instantan\xC3\xA9ment le mode multijoueur en local sur ce PC en lan\xC3\xA7""ant 2 sessions de jeu distinctes synchronis\xC3\xA9""es via le relais local (127.0.0.1:7777).");

                // Dev Tool Highlight Card
                const float dCardH = px(120);
                const Rect dCard{r.x, y, r.w, dCardH};
                rectEx(dCard, theme::kBase, mix(theme::kBase, theme::kTeal, 0.12f), px(theme::kRadius), theme::kTeal, ui::hairline());

                drawText(kFontSemibold, px(16), dCard.x + px(16), dCard.y + px(14), theme::kText, "Double Instance de Test Local");
                ui::label(kFontBody, px(theme::kSmall), {dCard.x + px(16), dCard.y + px(38), dCard.w - px(32), px(38)}, theme::kDim,
                          "Session 1 (H\xC3\xB4te / Port 7777, \xC3\x89""cran Gauche)  +  Session 2 (Client 2, \xC3\x89""cran Droit).\nSauvegardes et cartes m\xC3\xA9moires isol\xC3\xA9""es dans build/multiplayer/session1 & session2.");

                ui::label(kFontSemibold, px(theme::kSmall), {dCard.x + px(16), dCard.bottom() - px(28), dCard.w - px(32), px(20)},
                          app.mpDualRunning ? theme::kTeal : theme::kPink, "Statut : " + app.mpStatusText);

                y += dCardH + px(16);

                // Action Buttons for Dual Session
                const float bLaunchW = ui::buttonWidth("Lancer 2 Sessions (Host & Client)", theme::icon::kPlay);
                if (ui::button("Lancer 2 Sessions (Host & Client)", {r.x, y, bLaunchW, px(42)}, ButtonStyle::Primary, theme::icon::kPlay, !app.busy()))
                {
                    std::string err;
                    if (!app.startMultiplayerDualSession(err))
                    {
                        toast("Erreur lors du lancement des 2 sessions : " + err, theme::kRed);
                    }
                    else
                    {
                        toast("2 sessions multijoueur lancees avec succes !", theme::kTeal);
                    }
                }
                y += px(50);

                const float bStopW = ui::buttonWidth("Arreter les Sessions de Test", theme::icon::kClose);
                if (ui::button("Arreter les Sessions de Test", {r.x, y, bStopW, px(36)}, ButtonStyle::Secondary, theme::icon::kClose))
                {
                    app.stopMultiplayerDualSession();
                    toast("Sessions de test arretees.");
                }

                const float bPingW = ui::buttonWidth("Tester Relais (Ping 7777)", theme::icon::kSync);
                if (ui::button("Tester Relais (Ping 7777)", {r.x + bStopW + px(10), y, bPingW, px(36)}, ButtonStyle::Ghost, theme::icon::kSync))
                {
                    std::string msg;
                    app.testMultiplayerRelay(msg);
                    toast(msg, theme::kTeal);
                }
                y += px(48);

                divider(r, y);
                section(r, y, "ARCHITECTURE TECHNIQUE");
                y += row({r.x, y, r.w, 0}, "Protocole", "UDP Loopback Relay + TCP Handshake");
                y += row({r.x, y, r.w, 0}, "Port Local", "127.0.0.1:7777 (Low-Latency <1ms)");
                y += row({r.x, y, r.w, 0}, "Isolations", "build/multiplayer/session1/ & session2/");
                y += row({r.x, y, r.w, 0}, "Outil Relais", "tools/multiplayer_relay.py");
                y += px(10);
            }

            return y;
        }
    }

    void drawSheets(Rect window)
    {
        App &app = *shell.app;
        if (shell.sheet != Sheet::None)
            shell.sheetShown = shell.sheet;
        ui::Widget &w = ui::widget(ui::id("#sheet"));
        if (w.fresh)
            shell.sheetSpring.snap(0);
        ui::spring(shell.sheetSpring, shell.sheet != Sheet::None ? 1.0f : 0.0f, 340, 0.88f);
        const float open = shell.sheetSpring.value;
        if (open <= 0.002f && shell.sheet == Sheet::None)
        {
            shell.sheetShown = Sheet::None;
            return;
        }
        Rect area = window;
        core::cutTop(area, px(theme::kTitleBar));
        const Layer previous = setLayer(Layer::Overlay);
        ui::beginLayer(kLayerSheet, shell.sheet != Sheet::None);

        // the scrim: clicking it closes the sheet
        rect(area, withAlpha(theme::kScrim, alphaOf(theme::kScrim) * core::clamp01(open)));
        const ui::Interaction scrim = ui::interact(ui::id("#scrim"), area, false);
        if (scrim.clicked)
            shell.sheet = Sheet::None;

        const float width = std::min(px(540), area.w * 0.94f);
        const Rect panel{area.right() - width * open, area.y, width, area.h};
        ui::blockInput(panel);
        shadow(panel.offset(-px(6), 0), theme::shade(0.8f * core::clamp01(open)), px(24), 0);
        rectEx(panel, theme::kBase, mix(theme::kBase, theme::kNight, 0.5f), {px(14), 0, 0, 0}, theme::ink(0.06f), ui::hairline());

        const char *title = "";
        const char *subtitle = "";
        switch (shell.sheetShown)
        {
        case Sheet::Saves: title = "Saves"; subtitle = "Back up and restore your memory card."; break;
        case Sheet::Settings: title = "Settings"; subtitle = "The launcher's own options. The game's are in the game (F2)."; break;
        case Sheet::Help: title = "Help"; subtitle = "When something goes wrong, the logs say why."; break;
        case Sheet::Folder: title = "Build folder"; subtitle = "Where the game is built."; break;
        case Sheet::Mods: title = "Mods & HD Remake"; subtitle = "Integrated mods, HD textures, and visual remake enhancements."; break;
        case Sheet::Multiplayer: title = "Multiplayer & Character Editor"; subtitle = "Customize your character, manage multiplayer saves, and test dual sessions."; break;
        default: break;
        }
        Rect inner = panel.inset(px(32), 0);
        float y = panel.y + px(26);
        drawText(kFontSemibold, px(24), inner.x, y + metrics(kFontSemibold, px(24)).ascent, theme::kText, title);
        if (ui::iconButton("#closesheet", theme::icon::kClose, {panel.right() - px(56), y - px(2), px(34), px(34)}, "Close (Esc)", true, px(12)))
            shell.sheet = Sheet::None;
        y += px(38);
        ui::label(kFontBody, px(theme::kSmall), {inner.x, y, inner.w, px(20)}, theme::kDim, subtitle);
        y += px(36);

        const Rect view{panel.x, y, panel.w, panel.bottom() - y};
        const ui::Id scroll = ui::id("#sheet-scroll", int(shell.sheetShown));
        ui::beginScroll(scroll, view);
        const Rect content{inner.x, y + px(4), inner.w, 0};
        // the content follows a beat behind the panel
        render::pushOffset(std::round((1 - core::clamp01(open)) * px(40)), 0);
        float bottom = y;
        switch (shell.sheetShown)
        {
        case Sheet::Saves: bottom = saves(app, content); break;
        case Sheet::Settings: bottom = settings(app, content); break;
        case Sheet::Help: bottom = help(app, content); break;
        case Sheet::Folder: bottom = folder(app, content); break;
        case Sheet::Mods: bottom = mods(app, content); break;
        case Sheet::Multiplayer: bottom = multiplayer(app, content); break;
        default: break;
        }
        render::popOffset();
        ui::endScroll(scroll, bottom + px(24));
        ui::endLayer();
        setLayer(previous);
    }
}
