#!/usr/bin/env python3
"""Update a release folder or git clone to the newest version on GitHub.

    python tools/update.py check [--channel stable|nightly|auto]
    python tools/update.py apply [--channel stable|nightly|auto] [--zip FILE] [--appimage FILE]
    python3 tools/update.py install --from DIR --to FOLDER

apply replaces the release's files with the new release's, removes obsolete files listed in RELEASE.json,
and preserves everything else: build/ (vcs.ini, launcher settings, build output), generated/, discs, and mods.
For git clones, check compares local HEAD against origin, and apply pulls updates via git pull.
"""
import argparse
import datetime
import filecmp
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dmg  # noqa: E402
import toolchain as tc  # noqa: E402

RELEASE_JSON = os.path.join(tc.ROOT, "RELEASE.json")
UPDATE_DIR = os.path.join(tc.BUILD, "update")
KEEP = ("build/", "generated/")  # never replaced or removed
DEFAULT_REPO = "NuxsGit/LeonidasViceCity"
ASSET_SUFFIX = "-windows.zip" if tc.IS_WINDOWS else "-macos-arm64.dmg" if tc.IS_MACOS else "-x86_64.AppImage"


def this_release():
    try:
        with open(RELEASE_JSON, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def version_key(v):
    return [int(x) for x in re.findall(r"\d+", v)] or [0]


def get_channel(requested=None, mine=None):
    if requested and requested not in ("auto", "default"):
        return requested.lower()
    env = os.environ.get("VCS_UPDATE_CHANNEL")
    if env and env.strip():
        return env.strip().lower()
    ini_ch = tc.ini_value(tc.GAME_INI, "channel") or tc.ini_value(tc.GAME_INI, "update_channel") or \
             tc.ini_value(tc.ROOT_INI, "channel") or tc.ini_value(tc.ROOT_INI, "update_channel")
    if ini_ch:
        return ini_ch.strip().lower()
    if mine:
        v = (mine.get("version") or "").lower()
        if "nightly" in v or "dev" in v:
            return "nightly"
    return "auto"


def get_github_token():
    """Look for a GitHub Personal Access Token or OAuth token for API requests."""
    for var in ("GH_TOKEN", "GITHUB_TOKEN", "VCS_GITHUB_TOKEN"):
        val = os.environ.get(var)
        if val and val.strip():
            return val.strip()
    ini_tok = tc.ini_value(tc.GAME_INI, "github_token") or tc.ini_value(tc.GAME_INI, "token") or \
              tc.ini_value(tc.ROOT_INI, "github_token") or tc.ini_value(tc.ROOT_INI, "token")
    if ini_tok and ini_tok.strip():
        return ini_tok.strip()
    try:
        res = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True, timeout=5)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    try:
        res = subprocess.run(["git", "config", "--get", "github.token"], capture_output=True, text=True, timeout=5)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    try:
        proc = subprocess.run(["git", "credential", "fill"],
                              input="protocol=https\nhost=github.com\n",
                              capture_output=True, text=True, timeout=5)
        if proc.returncode == 0:
            for line in proc.stdout.splitlines():
                if line.startswith("password="):
                    pwd = line.split("=", 1)[1].strip()
                    if pwd:
                        return pwd
    except (OSError, subprocess.SubprocessError):
        pass
    return None


class AuthRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Strip Authorization header when redirected to Amazon S3 / Azure / release-assets."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        new_req = super().redirect_request(req, fp, code, msg, headers, newurl)
        if new_req:
            orig_host = urllib.parse.urlparse(req.full_url).netloc
            new_host = urllib.parse.urlparse(newurl).netloc
            if orig_host != new_host:
                new_req.headers = {k: v for k, v in new_req.headers.items() if k.lower() != "authorization"}
        return new_req


def fetch_github_api(url, token=None):
    if token is None:
        token = get_github_token()
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "LVCS-update",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    }
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        if e.code == 403:
            msg = "GitHub API rate limit exceeded (60 req/hr). Set GH_TOKEN or github_token in vcs.ini."
            print("[update] " + msg)
            tc.fail(msg, "network")
        tc.fail("GitHub answered %d" % e.code, "network")
    except (OSError, ValueError) as e:
        tc.fail("could not reach GitHub: %s" % e, "network")
    return None


def find_asset(data):
    if not data or not isinstance(data, dict):
        return "", "", "", "", ""
    assets = {a["name"]: a for a in data.get("assets", []) if isinstance(a, dict) and "name" in a}
    matched = []
    if tc.IS_WINDOWS:
        matched = [n for n in assets if n.endswith("-windows.zip")] or \
                  [n for n in assets if n.endswith(".zip") and any(k in n.lower() for k in ("windows", "win64", "win32", "win"))] or \
                  [n for n in assets if n.endswith(".zip")]
    elif tc.IS_MACOS:
        matched = [n for n in assets if n.endswith("-macos-arm64.dmg")] or \
                  [n for n in assets if n.endswith(".dmg")] or \
                  [n for n in assets if n.endswith(".zip") and any(k in n.lower() for k in ("macos", "darwin"))]
    else:  # Linux
        matched = [n for n in assets if n.endswith("-x86_64.AppImage")] or \
                  [n for n in assets if n.endswith(".AppImage")]
    asset_name = matched[0] if matched else ""
    asset_info = assets.get(asset_name, {})
    asset_url = asset_info.get("browser_download_url", "")
    asset_api_url = asset_info.get("url", "")
    sha256_info = assets.get(asset_name + ".sha256", {})
    sha256_url = sha256_info.get("browser_download_url", "")
    sha256_api_url = sha256_info.get("url", "")
    return asset_name, asset_url, asset_api_url, sha256_url, sha256_api_url


def parse_release_data(data):
    if not data or not isinstance(data, dict):
        return None
    asset_name, asset_url, asset_api_url, sha256_url, sha256_api_url = find_asset(data)
    ver = re.sub(r"^v", "", data.get("tag_name", ""))
    return {
        "version": ver,
        "tag_name": data.get("tag_name", ""),
        "name": data.get("name", ""),
        "url": data.get("html_url", ""),
        "prerelease": data.get("prerelease", False),
        "published_at": data.get("published_at", ""),
        "target_commitish": data.get("target_commitish", ""),
        "zip": asset_url,
        "zip_api": asset_api_url,
        "asset_name": asset_name,
        "sha256": sha256_url,
        "sha256_api": sha256_api_url,
    }


def latest(repo, channel="auto"):
    repo = repo or DEFAULT_REPO
    token = get_github_token()
    all_rel = fetch_github_api("https://api.github.com/repos/%s/releases" % repo, token=token)

    if all_rel is None:
        repo_data = fetch_github_api("https://api.github.com/repos/%s" % repo, token=token)
        if repo_data is None:
            if not token:
                msg = ("Cannot access github.com/%s (404 Not Found). "
                       "If this repository is private, set GH_TOKEN or github_token in vcs.ini, "
                       "or authenticate with 'gh auth login'." % repo)
            else:
                msg = ("Cannot access github.com/%s (404 Not Found with provided token). "
                       "Check repository permissions or token validity." % repo)
            return {"error": msg, "version": ""}
        all_rel = []

    if channel == "nightly":
        for r in all_rel:
            if r.get("tag_name") == "nightly" or r.get("prerelease"):
                parsed = parse_release_data(r)
                if parsed and parsed.get("zip"):
                    return parsed
        data = fetch_github_api("https://api.github.com/repos/%s/releases/tags/nightly" % repo, token=token)
        return parse_release_data(data)

    if channel == "stable":
        for r in all_rel:
            if not r.get("prerelease") and r.get("tag_name") != "nightly":
                parsed = parse_release_data(r)
                if parsed and parsed.get("zip"):
                    return parsed
        data = fetch_github_api("https://api.github.com/repos/%s/releases/latest" % repo, token=token)
        return parse_release_data(data)

    # auto channel: prefer newest stable with valid platform asset
    for r in all_rel:
        if not r.get("prerelease") and r.get("tag_name") != "nightly":
            parsed = parse_release_data(r)
            if parsed and parsed.get("zip"):
                return parsed

    # fall back to any release with valid platform asset
    for r in all_rel:
        parsed = parse_release_data(r)
        if parsed and parsed.get("zip"):
            return parsed

    data = fetch_github_api("https://api.github.com/repos/%s/releases/latest" % repo, token=token)
    if not data:
        data = fetch_github_api("https://api.github.com/repos/%s/releases/tags/nightly" % repo, token=token)
    return parse_release_data(data)


def is_newer(found, mine):
    if not found or not found.get("version"):
        return False
    if not mine:
        return True

    found_ver = found.get("version", "")
    mine_ver = mine.get("version", "")

    f_key = version_key(found_ver)
    m_key = version_key(mine_ver)
    if f_key != [0] and m_key != [0]:
        if f_key > m_key:
            return True
        if f_key < m_key:
            return False

    if "nightly" in found_ver.lower() or "nightly" in mine_ver.lower() or found.get("prerelease"):
        mine_commit = (mine.get("commit") or "").strip()
        found_commit = (found.get("target_commitish") or "").strip()
        if mine_commit and found_commit and len(mine_commit) >= 7 and len(found_commit) >= 7:
            if not found_commit.startswith(mine_commit[:7]) and not mine_commit.startswith(found_commit[:7]):
                return True
        mine_built = mine.get("built_at") or ""
        found_pub = found.get("published_at") or ""
        if mine_built and found_pub and found_pub > mine_built:
            return True
        if found_ver.lower() == "nightly" and mine_ver.lower() != "nightly":
            return True

    return False


def check_git():
    git_dir = os.path.join(tc.ROOT, ".git")
    if not os.path.isdir(git_dir):
        msg = "No RELEASE.json: not a release folder."
        print("[update] " + msg)
        tc.event(result="ok", newer=False, message=msg)
        return
    try:
        branch = subprocess.run(["git", "-C", tc.ROOT, "rev-parse", "--abbrev-ref", "HEAD"],
                                capture_output=True, text=True, check=True).stdout.strip()
        head = subprocess.run(["git", "-C", tc.ROOT, "rev-parse", "HEAD"],
                              capture_output=True, text=True, check=True).stdout.strip()
        # Find upstream tracking branch or origin/<branch> or origin/main
        target_ref = ""
        u_res = subprocess.run(["git", "-C", tc.ROOT, "rev-parse", "--abbrev-ref", "@{u}"],
                               capture_output=True, text=True)
        if u_res.returncode == 0 and u_res.stdout.strip():
            target_ref = u_res.stdout.strip()
            subprocess.run(["git", "-C", tc.ROOT, "fetch", "--quiet"], capture_output=True)
        else:
            fetch = subprocess.run(["git", "-C", tc.ROOT, "fetch", "origin", branch, "--quiet"],
                                   capture_output=True, text=True)
            if fetch.returncode == 0:
                target_ref = "origin/" + branch
            else:
                subprocess.run(["git", "-C", tc.ROOT, "fetch", "origin", "main", "--quiet"], capture_output=True)
                target_ref = "origin/main"

        if target_ref:
            rem_res = subprocess.run(["git", "-C", tc.ROOT, "rev-parse", target_ref],
                                     capture_output=True, text=True)
            if rem_res.returncode == 0:
                remote = rem_res.stdout.strip()
                if head != remote:
                    behind = subprocess.run(["git", "-C", tc.ROOT, "rev-list", "--count", "HEAD.." + target_ref],
                                            capture_output=True, text=True)
                    count = int(behind.stdout.strip()) if behind.returncode == 0 and behind.stdout.strip().isdigit() else 0
                    if count > 0:
                        msg = "Git update available: %d commit(s) behind %s (%s -> %s)." % (
                            count, target_ref, head[:8], remote[:8])
                        print("[update] " + msg)
                        tc.event(result="ok", newer=True, current=head[:8], latest=remote[:8],
                                 message=msg, is_git=True)
                        return
                msg = "You are up to date with %s (commit %s)." % (target_ref, head[:8])
                print("[update] " + msg)
                tc.event(result="ok", newer=False, current=head[:8], latest=head[:8],
                         message=msg, is_git=True)
                return
    except (subprocess.CalledProcessError, OSError):
        pass
    msg = "This is a git clone: run 'git pull' to update, then rebuild with python tools/build.py"
    print("[update] " + msg)
    tc.event(result="ok", newer=False, message=msg, is_git=True)


def apply_git():
    tc.stage("apply", "Pulling latest changes from git")
    try:
        res = subprocess.run(["git", "-C", tc.ROOT, "pull", "--ff-only"],
                             capture_output=True, text=True)
        if res.returncode != 0:
            res = subprocess.run(["git", "-C", tc.ROOT, "pull"],
                                 capture_output=True, text=True)
        if res.returncode != 0:
            tc.fail("git pull failed:\n" + res.stderr, "git_error")
        head = subprocess.run(["git", "-C", tc.ROOT, "rev-parse", "HEAD"],
                              capture_output=True, text=True, check=True).stdout.strip()
        print("[update] git pull succeeded (commit %s). Build the game again (the launcher, or python tools/build.py)."
              % head[:8])
        tc.event(result="ok", version=head[:8], restart=True)
    except (subprocess.CalledProcessError, OSError) as e:
        tc.fail("git update failed: %s" % e, "git_error")


def check(channel="auto"):
    mine = this_release()
    if not mine:
        check_git()
        return
    repo = mine.get("repository") or DEFAULT_REPO
    active_channel = get_channel(channel, mine)
    found = latest(repo, active_channel)
    if not found or not found.get("version"):
        if found and found.get("error"):
            message = found["error"]
        else:
            message = "No release published yet on github.com/%s (channel: %s)." % (repo, active_channel)
        print("[update] " + message)
        tc.event(result="ok", newer=False, message=message)
        return
    newer = is_newer(found, mine)
    print("[update] this: %s, newest: %s (%s)%s" % (
        mine["version"], found["version"], active_channel, " - an update is available" if newer else ""))
    tc.event(result="ok", newer=newer, current=mine["version"], latest=found["version"], url=found["url"],
             zip=found["zip"], channel=active_channel,
             message="" if newer else "You have the latest %s release (%s)." % (active_channel, mine["version"]))


def set_aside(path):
    old = path + ".old"
    if os.path.exists(old):
        os.remove(old)
    os.replace(path, old)


def put(z, name, target):
    os.makedirs(os.path.dirname(target), exist_ok=True)
    for attempt in range(5):
        try:
            with z.open(name) as src, open(target, "wb") as dst:
                shutil.copyfileobj(src, dst)
            return
        except PermissionError:
            if attempt == 0:
                try:
                    set_aside(target)
                    continue
                except OSError:
                    pass
            if attempt == 4:
                raise
            time.sleep(0.5 * (attempt + 1))


def remove_set_aside():
    for d in (tc.ROOT, os.path.join(tc.ROOT, "python")):
        if os.path.isdir(d):
            for f in os.listdir(d):
                if f.endswith(".old"):
                    try:
                        os.remove(os.path.join(d, f))
                    except OSError:
                        pass


def download_stream(url, out, token=None, is_asset_api=False):
    tc.stage("download", "Downloading the new release")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    opener = urllib.request.build_opener(AuthRedirectHandler())

    headers = {
        "User-Agent": "LVCS-update",
    }
    if is_asset_api:
        headers["Accept"] = "application/octet-stream"
    if token:
        headers["Authorization"] = "Bearer " + token

    req = urllib.request.Request(url, headers=headers)
    with opener.open(req, timeout=60) as r, open(out + ".part", "wb") as f:
        total = int(r.headers.get("Content-Length") or 0)
        done = 0
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
            done += len(chunk)
            tc.event(progress=done >> 20, total=total >> 20, eta=None, note="MB")
    os.replace(out + ".part", out)


def download(url, out):
    download_stream(url, out)


def verified_download(found, out):
    token = get_github_token()
    downloaded = False
    if token and found.get("zip_api"):
        try:
            download_stream(found["zip_api"], out, token=token, is_asset_api=True)
            downloaded = True
        except urllib.error.HTTPError as e:
            if e.code not in (401, 403, 404) or not found.get("zip"):
                tc.fail("could not download release asset: %s" % e, "network")
    if not downloaded:
        download_stream(found["zip"], out, token=None, is_asset_api=False)

    sha_url = found.get("sha256_api") if (token and found.get("sha256_api")) else found.get("sha256")
    if sha_url:
        try:
            opener = urllib.request.build_opener(AuthRedirectHandler())
            headers = {"User-Agent": "LVCS-update"}
            if token and sha_url == found.get("sha256_api"):
                headers["Accept"] = "application/octet-stream"
                headers["Authorization"] = "Bearer " + token
            req = urllib.request.Request(sha_url, headers=headers)
            with opener.open(req, timeout=30) as r:
                want = r.read().decode("utf-8", errors="replace").split()[0].lower()
            got = hashlib.sha256(open(out, "rb").read()).hexdigest()
            if got != want:
                os.remove(out)
                tc.fail("the download's checksum doesn't match: try again", "network")
        except (OSError, ValueError):
            pass


def apply_appimage(mine, appimage_path=None, channel="auto"):
    target = os.environ.get("APPIMAGE", "")
    if not target or not os.path.isfile(target):
        tc.fail("not started from an AppImage ($APPIMAGE isn't set): a git clone updates with git pull", "git_checkout")
    new = target + ".new"
    if appimage_path:
        shutil.copyfile(appimage_path, new)
        version = "the new release (%s)" % os.path.basename(appimage_path)
    else:
        active_channel = get_channel(channel, mine)
        found = latest(mine.get("repository", DEFAULT_REPO), active_channel)
        if not found or not found["zip"]:
            tc.fail("no AppImage found in the newest release on GitHub", "network")
        if not is_newer(found, mine):
            print("[update] already the newest (%s)" % mine["version"])
            tc.event(result="ok", version=mine["version"])
            return
        verified_download(found, new)
        version = found["version"]
    tc.stage("apply", "Putting the new release in place")
    with open(new, "rb") as f:
        head = f.read(16)
    if head[:4] != b"\x7fELF" or head[8:11] != b"AI\x02":
        os.remove(new)
        tc.fail("not an AppImage: " + (appimage_path or new), "error")
    os.chmod(new, 0o755)
    os.replace(new, target)
    print("[update] %s -> %s: %s. Start the launcher again; it puts the new files in place, then build the game again."
          % (mine["version"], version, target))
    tc.event(result="ok", version=version, restart=True)


def apply_app(mine, zip_path=None, channel="auto"):
    bundle = os.environ.get("VCS_APP_BUNDLE", "")
    if not bundle or not os.path.isdir(bundle):
        tc.fail("VCS_APP_BUNDLE isn't set (the launcher sets it): start the update from the launcher", "error")
    version = ""
    if not zip_path:
        active_channel = get_channel(channel, mine)
        found = latest(mine.get("repository", DEFAULT_REPO), active_channel)
        if not found or not found["zip"]:
            tc.fail("no release disk image found on GitHub", "network")
        if not is_newer(found, mine):
            print("[update] already the newest (%s)" % mine["version"])
            tc.event(result="ok", version=mine["version"])
            return
        zip_name = found.get("asset_name") or found["zip"].rsplit("/", 1)[1]
        zip_path = os.path.join(UPDATE_DIR, zip_name)
        verified_download(found, zip_path)
        version = found["version"]
    tc.stage("apply", "Putting the new release in place")
    unpacked = os.path.join(UPDATE_DIR, "app")
    shutil.rmtree(unpacked, ignore_errors=True)
    os.makedirs(unpacked)
    with open(zip_path, "rb") as f:
        is_zip = f.read(4) == b"PK\x03\x04"
    if is_zip:
        if subprocess.run(["/usr/bin/ditto", "-x", "-k", zip_path, unpacked]).returncode != 0:
            tc.fail("could not unzip " + zip_path, "error")
    else:
        try:
            with dmg.attached(zip_path) as mount:
                app = dmg.find_app(mount)
                if not app or subprocess.run(["/usr/bin/ditto", app,
                                              os.path.join(unpacked, "VCSLauncher.app")]).returncode != 0:
                    tc.fail("no VCSLauncher.app could be copied from " + zip_path, "error")
        except RuntimeError as e:
            tc.fail("could not open the disk image %s: %s" % (zip_path, e), "error")
    new = dmg.find_app(unpacked)
    release = os.path.join(new, "Contents", "Resources", "release", "RELEASE.json")
    if not os.path.isfile(release):
        tc.fail("not a macOS release (no VCSLauncher.app with its files): " + zip_path, "error")
    with open(release, encoding="utf-8") as f:
        version = version or json.load(f).get("version", "?")
    old = bundle.rstrip("/") + ".old"
    shutil.rmtree(old, ignore_errors=True)
    try:
        os.rename(bundle, old)
        shutil.move(new, bundle)
    except OSError as e:
        if os.path.isdir(old) and not os.path.isdir(bundle):
            os.rename(old, bundle)
        tc.fail("could not replace %s (%s): move it to a folder you can write to (Applications), or download the new "
                "release yourself" % (bundle, e), "update_incomplete")
    shutil.rmtree(old, ignore_errors=True)
    shutil.rmtree(unpacked, ignore_errors=True)
    print("[update] %s -> %s: %s. Start the launcher again; it puts the new files in place, then build the game again."
          % (mine["version"], version, bundle))
    tc.event(result="ok", version=version, restart=True)


def install(source, target):
    new = None
    try:
        with open(os.path.join(source, "RELEASE.json"), encoding="utf-8") as f:
            new = json.load(f)
    except (OSError, ValueError):
        tc.fail("not a release's files (no RELEASE.json): " + source, "install_failed")
    try:
        with open(os.path.join(target, "RELEASE.json"), encoding="utf-8") as f:
            old = json.load(f)
    except (OSError, ValueError):
        old = {}
    tc.stage("install", "Putting the game's files in place" if not old else
             "Putting version %s's files in place" % new.get("version", "?"))
    names = [n for n in new.get("files", []) if n != "RELEASE.json" and not n.startswith(KEEP)]
    written = 0
    for i, rel in enumerate(names):
        src = os.path.join(source, *rel.split("/"))
        dst = os.path.join(target, *rel.split("/"))
        if not os.path.abspath(dst).startswith(os.path.abspath(target) + os.sep) or not os.path.isfile(src):
            continue
        if os.path.isfile(dst) and os.path.getsize(dst) == os.path.getsize(src) and filecmp.cmp(src, dst, shallow=False):
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        tmp = dst + ".new"
        shutil.copyfile(src, tmp)
        shutil.copymode(src, tmp)
        os.replace(tmp, dst)
        written += 1
        if i % 200 == 0:
            tc.event(progress=i, total=len(names), eta=None, note="files")
    gone = sorted(set(old.get("files", [])) - set(new.get("files", [])))
    removed = 0
    for rel in gone:
        if rel.startswith(KEEP):
            continue
        path = os.path.join(target, *rel.split("/"))
        if os.path.isfile(path):
            os.remove(path)
            removed += 1
    shutil.copyfile(os.path.join(source, "RELEASE.json"), os.path.join(target, "RELEASE.json"))
    print("[update] %s: %d files written, %d already current, %d removed (%s)"
          % (new.get("version", "?"), written, len(names) - written, removed, target))
    tc.event(result="ok", version=new.get("version", ""), written=written, removed=removed)


def apply(zip_path=None, appimage_path=None, channel="auto"):
    mine = this_release()
    if not mine:
        if os.path.isdir(os.path.join(tc.ROOT, ".git")):
            apply_git()
            return
        tc.fail("not a release folder (no RELEASE.json): a git clone updates with git pull", "git_checkout")
    if tc.IS_MACOS:
        apply_app(mine, zip_path, channel)
        return
    if not tc.IS_WINDOWS:
        apply_appimage(mine, appimage_path, channel)
        return
    if not zip_path:
        active_channel = get_channel(channel, mine)
        found = latest(mine.get("repository", DEFAULT_REPO), active_channel)
        if not found or not found["zip"]:
            tc.fail("no release zip found on GitHub", "network")
        if not is_newer(found, mine):
            print("[update] already the newest (%s)" % mine["version"])
            tc.event(result="ok", version=mine["version"])
            return
        zip_name = found.get("asset_name") or found["zip"].rsplit("/", 1)[1]
        zip_path = os.path.join(UPDATE_DIR, zip_name)
        verified_download(found, zip_path)
    tc.stage("apply", "Putting the new release in place")
    failed = []
    with zipfile.ZipFile(zip_path) as z:
        top = {n.split("/", 1)[0] for n in z.namelist()}
        if len(top) != 1:
            tc.fail("not a release zip (one folder expected): " + zip_path, "error")
        prefix = top.pop() + "/"
        new = json.loads(z.read(prefix + "RELEASE.json"))
        names = [n for n in z.namelist() if not n.endswith("/")]
        last = [prefix + "VERSION", prefix + "RELEASE.json"]
        for i, n in enumerate([n for n in names if n not in last] + [n for n in last if n in names]):
            rel = n[len(prefix):]
            if not rel or rel.startswith(KEEP):
                continue
            if rel in ("VERSION", "RELEASE.json") and failed:
                continue
            target = os.path.join(tc.ROOT, *rel.split("/"))
            if not os.path.abspath(target).startswith(os.path.abspath(tc.ROOT) + os.sep):
                continue
            try:
                put(z, n, target)
            except OSError as e:
                print("[update] could not write %s: %s" % (rel, e))
                failed.append((rel, e))
            if i % 200 == 0:
                tc.event(progress=i, total=len(names), eta=None, note="files")
    if failed:
        locked = [rel for rel, e in failed if isinstance(e, PermissionError)]
        tc.fail("%d of the new release's files could not be written (%s%s)%s. The folder is still the old release: "
                "close the game and anything else using the folder, then update again - or extract the new release's "
                "zip into a new folder." % (
                    len(failed), ", ".join(rel for rel, _ in failed[:3]), ", ..." if len(failed) > 3 else "",
                    "; in use by another program - often an antivirus or a cloud-synced folder" if locked else ""),
                "update_incomplete")
    gone = sorted(set(mine.get("files", [])) - set(new.get("files", [])))
    for rel in gone:
        if rel.startswith(KEEP):
            continue
        path = os.path.join(tc.ROOT, *rel.split("/"))
        if os.path.isfile(path):
            try:
                os.remove(path)
            except PermissionError:
                try:
                    set_aside(path)
                except OSError as e:
                    print("[update] could not remove %s: %s" % (rel, e))
    print("[update] %s -> %s (%d files, %d removed). Build the game again (the launcher, or python tools/build.py "
          "--recompile-if-needed)." % (mine["version"], new["version"], len(names), len(gone)))
    tc.event(result="ok", version=new["version"], restart=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("check")
    p.add_argument("--channel", choices=("stable", "nightly", "auto"), default="auto",
                   help="release channel to check (stable, nightly, or auto)")
    p = sub.add_parser("apply")
    p.add_argument("--channel", choices=("stable", "nightly", "auto"), default="auto",
                   help="release channel to apply from (stable, nightly, or auto)")
    p.add_argument("--zip", help="a release zip (macOS: its .dmg) to apply instead of downloading the newest")
    p.add_argument("--appimage", help="Linux: an AppImage to put in place instead of downloading the newest")
    p = sub.add_parser("install")
    p.add_argument("--from", dest="source", required=True, help="the release's files (an AppImage's)")
    p.add_argument("--to", dest="target", required=True, help="the install folder")
    a = ap.parse_args()
    if a.cmd == "install":
        install(a.source, a.target)
        return
    remove_set_aside()
    if a.cmd == "check":
        check(a.channel)
    else:
        apply(a.zip, a.appimage, a.channel)


if __name__ == "__main__":
    main()
