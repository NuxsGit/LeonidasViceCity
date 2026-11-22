// Leonidas ViceCityStories (LVCS) - High Definition Texture Replacement System
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
    struct HdTextureInfo
    {
        std::string name;
        uint32_t hash = 0;
        uint32_t width = 0;
        uint32_t height = 0;
        uint32_t channels = 4;
        std::filesystem::path hostPath;
    };

    class HdTextureManager
    {
    public:
        static HdTextureManager &instance();

        void initialize(const std::filesystem::path &modsPath);
        void refresh();

        bool isEnabled() const { return m_enabled; }
        void setEnabled(bool enable) { m_enabled = enable; }

        // Look up by raster name or content hash
        const HdTextureInfo *findByName(std::string_view name) const;
        const HdTextureInfo *findByHash(uint32_t hash) const;

        // Texture count
        size_t textureCount() const { return m_byName.size() + m_byHash.size(); }

        // Dump textures (for texture mod creators)
        void setDumpMode(bool enable) { m_dumpMode = enable; }
        bool isDumpMode() const { return m_dumpMode; }

    private:
        HdTextureManager() = default;
        ~HdTextureManager() = default;

        void scanTexturesInDir(const std::filesystem::path &dir);

        mutable std::mutex m_mutex;
        bool m_enabled = true;
        bool m_dumpMode = false;
        std::filesystem::path m_baseDir;

        std::unordered_map<std::string, HdTextureInfo> m_byName;
        std::unordered_map<uint32_t, HdTextureInfo> m_byHash;
    };
}
