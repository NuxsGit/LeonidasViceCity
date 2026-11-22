// Leonidas ViceCityStories (LVCS) - High Definition Texture Replacement System Implementation
#include "mods/hd_textures.h"

#include <algorithm>
#include <cctype>
#include <iostream>

namespace vcs::mods
{
    namespace
    {
        std::string normalizeTexName(std::string_view name)
        {
            std::string res;
            res.reserve(name.size());
            for (char c : name)
            {
                if (c != '\"' && c != '\'')
                    res.push_back(static_cast<char>(std::tolower(static_cast<unsigned char>(c))));
            }
            return res;
        }

        uint32_t parseHexHash(std::string_view s)
        {
            if (s.rfind("0x", 0) == 0 || s.rfind("0X", 0) == 0)
                s.remove_prefix(2);
            try
            {
                return static_cast<uint32_t>(std::stoul(std::string(s), nullptr, 16));
            }
            catch (...)
            {
                return 0;
            }
        }
    }

    HdTextureManager &HdTextureManager::instance()
    {
        static HdTextureManager s_instance;
        return s_instance;
    }

    void HdTextureManager::initialize(const std::filesystem::path &modsPath)
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_baseDir = modsPath;
        refresh();
    }

    void HdTextureManager::refresh()
    {
        m_byName.clear();
        m_byHash.clear();

        std::error_code ec;
        if (!std::filesystem::exists(m_baseDir, ec))
            return;

        // Scan subdirectories for "textures" folders
        for (const auto &entry : std::filesystem::directory_iterator(m_baseDir, ec))
        {
            if (!entry.is_directory(ec))
                continue;

            const std::filesystem::path texDir = entry.path() / "textures";
            if (std::filesystem::exists(texDir, ec) && std::filesystem::is_directory(texDir, ec))
            {
                scanTexturesInDir(texDir);
            }
        }

        const std::filesystem::path globalTex = m_baseDir / "textures";
        if (std::filesystem::exists(globalTex, ec))
            scanTexturesInDir(globalTex);

        std::cout << "[LVCS-HD] Indexed " << textureCount() << " replacement HD textures." << std::endl;
    }

    void HdTextureManager::scanTexturesInDir(const std::filesystem::path &dir)
    {
        std::error_code ec;
        for (const auto &entry : std::filesystem::recursive_directory_iterator(dir, ec))
        {
            if (!entry.is_regular_file(ec))
                continue;

            const std::string ext = entry.path().extension().string();
            if (ext != ".png" && ext != ".dds" && ext != ".jpg" && ext != ".tga")
                continue;

            const std::string stem = entry.path().stem().string();
            HdTextureInfo info;
            info.hostPath = entry.path();
            info.name = normalizeTexName(stem);

            // Check if stem is a hex hash (e.g. "0a3f8c12" or "0x0a3f8c12")
            if (stem.size() >= 8 && std::all_of(stem.begin(), stem.end(), [](char c) {
                    return std::isxdigit(static_cast<unsigned char>(c)) || c == 'x' || c == 'X';
                }))
            {
                info.hash = parseHexHash(stem);
                if (info.hash != 0)
                    m_byHash[info.hash] = info;
            }

            m_byName[info.name] = info;
        }
    }

    const HdTextureInfo *HdTextureManager::findByName(std::string_view name) const
    {
        if (!m_enabled)
            return nullptr;
        std::lock_guard<std::mutex> lock(m_mutex);
        const auto it = m_byName.find(normalizeTexName(name));
        return it != m_byName.end() ? &it->second : nullptr;
    }

    const HdTextureInfo *HdTextureManager::findByHash(uint32_t hash) const
    {
        if (!m_enabled || hash == 0)
            return nullptr;
        std::lock_guard<std::mutex> lock(m_mutex);
        const auto it = m_byHash.find(hash);
        return it != m_byHash.end() ? &it->second : nullptr;
    }
}
