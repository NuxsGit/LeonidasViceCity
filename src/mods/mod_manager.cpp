// Leonidas ViceCityStories (LVCS) - Modding Engine Implementation
#include "mods/mod_manager.h"

#include <algorithm>
#include <cctype>
#include <cstring>
#include <fstream>
#include <iostream>
#include <sstream>

namespace vcs::mods
{
    namespace
    {
        // Simple JSON-like key-value extractor for mod.json to keep it standalone
        std::string extractJsonString(const std::string &content, const std::string &key)
        {
            const std::string pattern = "\"" + key + "\"";
            size_t pos = content.find(pattern);
            if (pos == std::string::npos)
                return "";
            pos = content.find(':', pos + pattern.size());
            if (pos == std::string::npos)
                return "";
            size_t start = content.find('\"', pos + 1);
            if (start == std::string::npos)
                return "";
            size_t end = content.find('\"', start + 1);
            if (end == std::string::npos)
                return "";
            return content.substr(start + 1, end - start - 1);
        }

        int extractJsonInt(const std::string &content, const std::string &key, int fallback)
        {
            const std::string pattern = "\"" + key + "\"";
            size_t pos = content.find(pattern);
            if (pos == std::string::npos)
                return fallback;
            pos = content.find(':', pos + pattern.size());
            if (pos == std::string::npos)
                return fallback;
            size_t start = content.find_first_of("-0123456789", pos + 1);
            if (start == std::string::npos)
                return fallback;
            size_t end = content.find_first_not_of("0123456789", start + (content[start] == '-' ? 1 : 0));
            try
            {
                return std::stoi(content.substr(start, end - start));
            }
            catch (...)
            {
                return fallback;
            }
        }

        bool extractJsonBool(const std::string &content, const std::string &key, bool fallback)
        {
            const std::string pattern = "\"" + key + "\"";
            size_t pos = content.find(pattern);
            if (pos == std::string::npos)
                return fallback;
            pos = content.find(':', pos + pattern.size());
            if (pos == std::string::npos)
                return fallback;
            std::string sub = content.substr(pos + 1, 10);
            for (char &c : sub)
                c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
            if (sub.find("true") != std::string::npos)
                return true;
            if (sub.find("false") != std::string::npos)
                return false;
            return fallback;
        }

        std::filesystem::path discoverModsFolder(const std::filesystem::path &custom)
        {
            if (!custom.empty() && std::filesystem::exists(custom))
                return custom;

            // Search relative paths
            const std::filesystem::path candidates[] = {
                std::filesystem::current_path() / "mods",
                std::filesystem::current_path() / ".." / "mods",
                std::filesystem::path("mods"),
            };

            for (const auto &cand : candidates)
            {
                std::error_code ec;
                if (std::filesystem::exists(cand, ec) && std::filesystem::is_directory(cand, ec))
                    return std::filesystem::canonical(cand, ec);
            }

            // Create mods directory if none exists
            std::error_code ec;
            std::filesystem::path defaultPath = std::filesystem::current_path() / "mods";
            std::filesystem::create_directories(defaultPath, ec);
            return defaultPath;
        }
    }

    ModManager &ModManager::instance()
    {
        static ModManager s_instance;
        return s_instance;
    }

    std::string ModManager::normalizePath(std::string_view path)
    {
        while (!path.empty() && (path.front() == ' ' || path.front() == '/' || path.front() == '\\'))
            path.remove_prefix(1);

        // Strip cdrom0: prefix if present
        constexpr std::string_view kCdromPrefix = "cdrom0:";
        if (path.size() >= kCdromPrefix.size())
        {
            bool match = true;
            for (size_t i = 0; i < kCdromPrefix.size(); ++i)
            {
                if (std::tolower(static_cast<unsigned char>(path[i])) != kCdromPrefix[i])
                {
                    match = false;
                    break;
                }
            }
            if (match)
            {
                path.remove_prefix(kCdromPrefix.size());
                while (!path.empty() && (path.front() == '/' || path.front() == '\\'))
                    path.remove_prefix(1);
            }
        }

        std::string result;
        result.reserve(path.size());
        for (char c : path)
        {
            if (c == '\\')
                result.push_back('/');
            else
                result.push_back(static_cast<char>(std::toupper(static_cast<unsigned char>(c))));
        }

        // Strip trailing version suffix e.g. ";1"
        if (result.size() >= 2 && result[result.size() - 2] == ';' && result.back() == '1')
            result.resize(result.size() - 2);

        return result;
    }

    void ModManager::initialize(const std::filesystem::path &customModsPath)
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_modsDirectory = discoverModsFolder(customModsPath);
        std::cout << "[LVCS-Mods] Mod manager initialized with directory: " << m_modsDirectory << std::endl;
        refresh();
    }

    void ModManager::refresh()
    {
        m_mods.clear();
        m_vfsFiles.clear();
        m_vfsByLba.clear();
        m_vfsDirs.clear();
        m_nextSyntheticLba = kSyntheticLsnBase;

        scanDirectory(m_modsDirectory);
        loadConfig();

        // Sort mods by priority (higher priority first)
        std::stable_sort(m_mods.begin(), m_mods.end(), [](const ModInfo &a, const ModInfo &b) {
            return a.priority > b.priority;
        });

        rebuildVfsIndex();
        std::cout << "[LVCS-Mods] Discovered " << m_mods.size() << " mods ("
                  << m_vfsFiles.size() << " virtual files indexed)" << std::endl;
    }

    void ModManager::scanDirectory(const std::filesystem::path &dir)
    {
        std::error_code ec;
        if (!std::filesystem::exists(dir, ec) || !std::filesystem::is_directory(dir, ec))
            return;

        for (const auto &entry : std::filesystem::directory_iterator(dir, ec))
        {
            if (!entry.is_directory(ec))
                continue;

            loadModManifest(entry.path());
        }
    }

    void ModManager::loadModManifest(const std::filesystem::path &modDir)
    {
        ModInfo info;
        info.rootPath = modDir;
        info.id = modDir.filename().string();
        info.name = info.id;
        info.enabled = true;
        info.priority = 50;

        const std::filesystem::path manifestPath = modDir / "mod.json";
        if (std::filesystem::exists(manifestPath))
        {
            std::ifstream file(manifestPath);
            if (file.is_open())
            {
                std::stringstream buffer;
                buffer << file.rdbuf();
                const std::string content = buffer.str();

                std::string id = extractJsonString(content, "id");
                if (!id.empty())
                    info.id = id;

                std::string name = extractJsonString(content, "name");
                if (!name.empty())
                    info.name = name;

                info.version = extractJsonString(content, "version");
                info.author = extractJsonString(content, "author");
                info.description = extractJsonString(content, "description");
                info.category = extractJsonString(content, "category");
                if (info.category.empty())
                    info.category = "General";

                info.enabled = extractJsonBool(content, "enabled", true);
                info.priority = extractJsonInt(content, "priority", 50);
            }
        }
        else
        {
            // Humanize folder name if no manifest
            std::string humanName = info.id;
            std::replace(humanName.begin(), humanName.end(), '_', ' ');
            std::replace(humanName.begin(), humanName.end(), '-', ' ');
            info.name = humanName;
        }

        m_mods.push_back(std::move(info));
    }

    void ModManager::rebuildVfsIndex()
    {
        m_vfsFiles.clear();
        m_vfsByLba.clear();
        m_vfsDirs.clear();
        m_nextSyntheticLba = kSyntheticLsnBase;

        // Traverse mods in priority order
        for (const auto &mod : m_mods)
        {
            if (!mod.enabled)
                continue;

            // Check if mod has "cdrom0" or "files" subfolder
            std::filesystem::path searchRoot = mod.rootPath;
            if (std::filesystem::exists(mod.rootPath / "cdrom0"))
                searchRoot = mod.rootPath / "cdrom0";
            else if (std::filesystem::exists(mod.rootPath / "files"))
                searchRoot = mod.rootPath / "files";

            indexHostDirectory(mod.id, searchRoot, "");
        }
    }

    void ModManager::indexHostDirectory(const std::string &modId, const std::filesystem::path &dir, const std::string &prefix)
    {
        std::error_code ec;
        for (const auto &entry : std::filesystem::directory_iterator(dir, ec))
        {
            const std::string filename = entry.path().filename().string();
            // Skip manifest and auxiliary files
            if (filename == "mod.json" || filename == "README.md" || filename == "preview.png" ||
                filename.rfind(".", 0) == 0)
            {
                continue;
            }

            const std::string relPath = prefix.empty() ? filename : (prefix + "/" + filename);
            const std::string normKey = normalizePath(relPath);

            if (entry.is_directory(ec))
            {
                // Register directory in VFS
                const std::string parentDir = prefix.empty() ? "" : normalizePath(prefix);
                m_vfsDirs[parentDir].push_back(VirtualDirEntry{
                    filename,
                    0,
                    0,
                    true,
                    modId
                });

                indexHostDirectory(modId, entry.path(), relPath);
            }
            else if (entry.is_regular_file(ec))
            {
                // If a higher priority mod already provided this file, skip
                if (m_vfsFiles.find(normKey) != m_vfsFiles.end())
                    continue;

                const uint64_t fileSize = entry.file_size(ec);
                const uint32_t sectors = static_cast<uint32_t>((fileSize + kSectorSize - 1) / kSectorSize);
                const uint32_t lsn = m_nextSyntheticLba;
                m_nextSyntheticLba += std::max(sectors, 1u);

                VirtualFile vf;
                vf.normalizedPath = normKey;
                vf.hostPath = entry.path();
                vf.lsn = lsn;
                vf.size = static_cast<uint32_t>(fileSize);
                vf.isDirectory = false;
                vf.modId = modId;

                m_vfsFiles[normKey] = vf;
                m_vfsByLba[lsn] = vf;

                const std::string parentDir = prefix.empty() ? "" : normalizePath(prefix);
                m_vfsDirs[parentDir].push_back(VirtualDirEntry{
                    filename,
                    lsn,
                    vf.size,
                    false,
                    modId
                });
            }
        }
    }

    const ModInfo *ModManager::findMod(std::string_view id) const
    {
        for (const auto &mod : m_mods)
        {
            if (mod.id == id)
                return &mod;
        }
        return nullptr;
    }

    bool ModManager::setModEnabled(std::string_view id, bool enabled)
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        for (auto &mod : m_mods)
        {
            if (mod.id == id)
            {
                if (mod.enabled != enabled)
                {
                    mod.enabled = enabled;
                    rebuildVfsIndex();
                    saveConfig();
                    return true;
                }
                return false;
            }
        }
        return false;
    }

    bool ModManager::isModEnabled(std::string_view id) const
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        const ModInfo *m = findMod(id);
        return m ? m->enabled : false;
    }

    void ModManager::applyHdRemakePreset(bool enable)
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        m_hdRemakeActive = enable;
        for (auto &mod : m_mods)
        {
            // Enable visual, graphical, and QoL mods
            if (mod.category == "Visuals" || mod.category == "UI" || mod.category == "Gameplay")
                mod.enabled = enable;
        }
        rebuildVfsIndex();
        saveConfig();
    }

    bool ModManager::findFile(std::string_view ps2Path, uint32_t &outLba, uint32_t &outSize, bool &outIsDir) const
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        const std::string norm = normalizePath(ps2Path);
        const auto it = m_vfsFiles.find(norm);
        if (it != m_vfsFiles.end())
        {
            outLba = it->second.lsn;
            outSize = it->second.size;
            outIsDir = it->second.isDirectory;
            return true;
        }
        return false;
    }

    bool ModManager::readBytes(uint64_t offset, size_t byteCount, void *destination) const
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        const uint32_t sector = static_cast<uint32_t>(offset / kSectorSize);
        if (sector < kSyntheticLsnBase)
            return false;

        // Locate file by sector LBA range
        for (const auto &[baseLsn, vf] : m_vfsByLba)
        {
            const uint32_t sectors = (vf.size + kSectorSize - 1) / kSectorSize;
            if (sector >= baseLsn && sector < baseLsn + sectors)
            {
                const uint64_t fileOffset = offset - (static_cast<uint64_t>(baseLsn) * kSectorSize);
                if (fileOffset >= vf.size)
                {
                    std::memset(destination, 0, byteCount);
                    return true;
                }

                std::ifstream stream(vf.hostPath, std::ios::binary);
                if (!stream.is_open())
                    return false;

                stream.seekg(static_cast<std::streamoff>(fileOffset));
                const size_t toRead = std::min<size_t>(byteCount, vf.size - static_cast<size_t>(fileOffset));
                stream.read(reinterpret_cast<char *>(destination), static_cast<std::streamsize>(toRead));

                if (toRead < byteCount)
                    std::memset(reinterpret_cast<uint8_t *>(destination) + toRead, 0, byteCount - toRead);

                return true;
            }
        }

        return false;
    }

    bool ModManager::listDirectory(std::string_view ps2Path, std::vector<VirtualDirEntry> &out) const
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        const std::string norm = normalizePath(ps2Path);
        const auto it = m_vfsDirs.find(norm);
        if (it != m_vfsDirs.end())
        {
            out = it->second;
            return true;
        }
        return false;
    }

    void ModManager::loadConfig()
    {
        const std::filesystem::path cfgPath = m_modsDirectory / "mods_config.json";
        if (!std::filesystem::exists(cfgPath))
            return;

        std::ifstream file(cfgPath);
        if (!file.is_open())
            return;

        std::stringstream buffer;
        buffer << file.rdbuf();
        const std::string content = buffer.str();

        m_hdRemakeActive = extractJsonBool(content, "hd_remake_active", true);

        for (auto &mod : m_mods)
        {
            mod.enabled = extractJsonBool(content, mod.id, mod.enabled);
        }
    }

    void ModManager::saveConfig()
    {
        std::error_code ec;
        std::filesystem::create_directories(m_modsDirectory, ec);
        const std::filesystem::path cfgPath = m_modsDirectory / "mods_config.json";

        std::ofstream file(cfgPath, std::ios::trunc);
        if (!file.is_open())
            return;

        file << "{\n";
        file << "  \"hd_remake_active\": " << (m_hdRemakeActive ? "true" : "false") << ",\n";
        file << "  \"mods\": {\n";
        for (size_t i = 0; i < m_mods.size(); ++i)
        {
            file << "    \"" << m_mods[i].id << "\": " << (m_mods[i].enabled ? "true" : "false");
            if (i + 1 < m_mods.size())
                file << ",";
            file << "\n";
        }
        file << "  }\n";
        file << "}\n";
    }
}
