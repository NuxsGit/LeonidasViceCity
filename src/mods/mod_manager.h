// LeonidasViceCity - Modding Engine and Virtual File System (VFS)
// Manages mod discovery, priority, file interception (cdrom0: overrides),
// and HD Remake enhancements.
#pragma once

#include <cstddef>
#include <cstdint>
#include <filesystem>
#include <memory>
#include <mutex>
#include <string>
#include <string_view>
#include <unordered_map>
#include <vector>

namespace vcs::mods
{
    // A single mod's descriptor and configuration
    struct ModInfo
    {
        std::string id;
        std::string name;
        std::string version;
        std::string author;
        std::string description;
        std::string category = "General"; // Visuals, Gameplay, UI, Audio, Total Conversion
        std::filesystem::path rootPath;
        bool enabled = true;
        int priority = 50; // Higher values take precedence
        std::vector<std::string> tags;
    };

    // Directory entry when listing files in a virtual directory
    struct VirtualDirEntry
    {
        std::string name;
        uint32_t lsn = 0;
        uint32_t sizeBytes = 0;
        bool isDirectory = false;
        std::string modId;
    };

    class ModManager
    {
    public:
        // Sector number offset reserved for synthetic mod files (far above any real PS2 DVD sector count)
        static constexpr uint32_t kSyntheticLsnBase = 0x40000000u;
        static constexpr uint32_t kSectorSize = 2048u;

        static ModManager &instance();

        // Initialize and scan for mods in default locations:
        // 1. <repo_or_exe>/mods
        // 2. <user_data>/mods
        void initialize(const std::filesystem::path &customModsPath = {});

        // Reload all mods and rebuild the VFS index
        void refresh();

        // Mod access and management
        const std::vector<ModInfo> &mods() const { return m_mods; }
        const ModInfo *findMod(std::string_view id) const;
        bool setModEnabled(std::string_view id, bool enabled);
        bool isModEnabled(std::string_view id) const;

        // One-Click HD Remake Preset toggle
        void applyHdRemakePreset(bool enable);
        bool isHdRemakeActive() const { return m_hdRemakeActive; }

        // Virtual File System (VFS) interception:
        // Replaces any file on cdrom0: with a modded replacement if present.
        bool findFile(std::string_view ps2Path, uint32_t &outLba, uint32_t &outSize, bool &outIsDir) const;

        // Direct byte reading for synthetic (modded) sectors.
        // Returns true if the byte range was satisfied by a mod.
        bool readBytes(uint64_t offset, size_t byteCount, void *destination) const;

        // Directory listing merging ISO entries and mod files
        bool listDirectory(std::string_view ps2Path, std::vector<VirtualDirEntry> &out) const;

        // Query whether an LBA is synthetic (originates from a mod)
        bool isSyntheticLba(uint32_t lba) const
        {
            return lba >= kSyntheticLsnBase;
        }

        // Get the active mods root path
        const std::filesystem::path &modsPath() const { return m_modsDirectory; }

        // Save and load mod enable states to config file (mods.json or vcs.ini)
        void loadConfig();
        void saveConfig();

        // Normalize PS2 disc path into standard key (e.g. "cdrom0:\MODELS\GTA3PS2.IMG;1" -> "MODELS/GTA3PS2.IMG")
        static std::string normalizePath(std::string_view path);

    private:
        ModManager() = default;
        ~ModManager() = default;
        ModManager(const ModManager &) = delete;
        ModManager &operator=(const ModManager &) = delete;

        struct VirtualFile
        {
            std::string normalizedPath;
            std::filesystem::path hostPath;
            uint32_t lsn = 0;
            uint32_t size = 0;
            bool isDirectory = false;
            std::string modId;
        };

        void scanDirectory(const std::filesystem::path &dir);
        void loadModManifest(const std::filesystem::path &modDir);
        void rebuildVfsIndex();
        void indexHostDirectory(const std::string &modId, const std::filesystem::path &dir, const std::string &prefix);

        mutable std::mutex m_mutex;
        std::filesystem::path m_modsDirectory;
        std::vector<ModInfo> m_mods;
        bool m_hdRemakeActive = true;

        // VFS index: key is normalized path, e.g. "MODELS/GTA3PS2.IMG"
        std::unordered_map<std::string, VirtualFile> m_vfsFiles;
        // Key is synthetic LBA
        std::unordered_map<uint32_t, VirtualFile> m_vfsByLba;
        // Key is directory normalized path -> child entries
        std::unordered_map<std::string, std::vector<VirtualDirEntry>> m_vfsDirs;

        uint32_t m_nextSyntheticLba = kSyntheticLsnBase;
    };
}
