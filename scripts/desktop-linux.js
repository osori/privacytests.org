const fs = require('node:fs');
const { exec, execSync, killProcessAndDescendants } = require('./utils');
const { join } = require('node:path');
const os = require('node:os');
const path = require('node:path');
const child_process = require('node:child_process');

const linuxDefaultBrowserSettings = {
  brave: {
    command: '/usr/bin/brave-browser',
    name: 'Brave Browser',
    nightlyName: 'Brave Browser Nightly',
    privateFlag: 'incognito',
    basedOn: 'chromium',
    update: ['Brave', 'About Brave'],
    updateNightly: ['Brave', 'About Brave']
  },
  chrome: {
    command: '/usr/bin/google-chrome',
    name: 'Google Chrome',
    nightlyName: 'Google Chrome Nightly',
    privateFlag: 'incognito',
    basedOn: 'chromium',
    update: ['Google Chrome', 'About Google Chrome'],
    updateNightly: ['Google Chrome', 'About Google Chrome']
  },
  epiphany: {
    command: '/snap/bin/epiphany',
    name: 'GNOME Web',
    privateFlag: '--incognito-mode',
    basedOn: 'webkit'
  },
  firefox: {
    command: '/snap/bin/firefox',
    env: { MOZ_DISABLE_AUTO_SAFE_MODE: '1' },
    name: 'firefox',
    nightlyName: 'Firefox Nightly',
    privateFlag: 'private-window',
    basedOn: 'firefox',
    update: ['Firefox', 'About Firefox'],
    updateNightly: ['Firefox Nightly', 'About Nightly']
  }
};

const windowsDefaultBrowserSettings = {
  brave: {
    command: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
    name: 'Brave Browser',
    nightlyName: 'Brave Browser Nightly',
    privateFlag: 'incognito',
    basedOn: 'chromium',
    update: ['Brave', 'About Brave'],
    updateNightly: ['Brave', 'About Brave']
  },
  duckduckgo: {
    command: 'C:/Users/arthu_3rura6m/AppData/Local/Microsoft/WindowsApps/DuckDuckGo.exe',
    name: 'DuckDuckGo',
    nightlyName: 'DuckDuckGo Beta',
    privateFlag: 'incognito',
    basedOn: 'chromium',
    update: ['DuckDuckGo', 'About DuckDuckGo'],
    updateNightly: ['DuckDuckGo', 'About DuckDuckGo']
  },
  chrome: {
    command: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    name: 'Google Chrome',
    nightlyName: 'Google Chrome Canary',
    privateFlag: 'incognito',
    basedOn: 'chromium'
  },
  edge: {
    command: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    name: 'Microsoft Edge',
    nightlyName: 'Microsoft Edge Canary',
    privateFlag: 'inprivate',
    basedOn: 'chromium'
  },
  firefox: {
    command: 'C:/Program Files/Mozilla Firefox/firefox.exe',
    name: 'firefox',
    nightlyName: 'Firefox Nightly',
    privateFlag: 'private-window',
    basedOn: 'firefox'
  },
  opera: {
    command: process.env.LOCALAPPDATA ? process.env.LOCALAPPDATA + '/Programs/Opera/launcher.exe' : 'C:/Users/user/AppData/Local/Programs/Opera/launcher.exe',
    name: 'Opera',
    nightlyName: 'Opera Developer',
    privateFlag: 'private',
    basedOn: 'chromium'
  },
  vivaldi: {
    command: process.env.LOCALAPPDATA ? process.env.LOCALAPPDATA + '/Vivaldi/Application/vivaldi.exe' : 'C:/Users/user/AppData/Local/Vivaldi/Application/vivaldi.exe',
    name: 'Vivaldi',
    nightlyName: 'Vivaldi Snapshot',
    privateFlag: 'incognito',
    basedOn: 'chromium'
  }
}

const platform = os.platform();

const standardFlags = {
  chromium: {
    profile: '--user-data-dir=',
    other: [
      '--no-first-run',
      '--no-default-browser-check',
    ],
  },
  firefox: { profile: '--profile '},
  webkit: { profile: '--profile '},
};

let globalProxyUsageEnabled = false;
let globalProxyPort = null;

// Declares a class that represents a browser on Linux.
class DesktopBrowser {
  constructor ({ browser, path, incognito, tor, nightly, appDir }) {
    this._defaults = platform === "win32" ?
      windowsDefaultBrowserSettings[browser] :
      linuxDefaultBrowserSettings[browser];
    this._flags = standardFlags[this._defaults.basedOn];
    this._profilePath = join(process.cwd(), 'profiles', browser);
    fs.mkdirSync(this._profilePath, { recursive: true });
    this._usingProxy = globalProxyUsageEnabled;
    this._pids = new Set();
    this._browser = browser;
    this._incognito = incognito;
    this._tor = tor;
  }

  command () {
    const binary = path.normalize(this._defaults.command);
    const flags = [];
    flags.push(this._flags.profile + this._profilePath);
    for (const flag of this._flags.other) {
      flags.push(flag);
    }
    if (this._incognito) {
      flags.push("--" + this._defaults.privateFlag);
    }
    if (this._tor) {
      flags.push("--" + this._defaults.torFlag);
    }
    if (globalProxyUsageEnabled && this._defaults.basedOn === 'chromium') {
      flags.push(`--proxy-server="http://127.0.0.1:${globalProxyPort}/"`);
    }
    return { binary, flags };
  }

  env () {
    let result = { ...process.env, ...this._defaults.env };
    if (globalProxyUsageEnabled && this._defaults.basedOn === 'firefox') {
      result = { ...result,
                 ...{ "http_proxy": "127.0.0.1",
                      "http_port": globalProxyPort } };
    }
    if (platform === "win32" && globalProxyUsageEnabled) {
      result["http_proxy"] = `http://localhost:${globalProxyPort}`;
    }
    return result;
  }

  async launch (clean = true) {
    const { binary, flags } = this.command();
    const process = child_process.execFile(binary, flags, { env: this.env() });
    this._pids.add(process.pid);
  }

  async version () {
    const { binary } = this.command();
    let versionString = child_process.execFileSync(binary, ["--version"]).toString()
      .replace(/^[^\d]+/, '').trim();
    if (this._browser === 'brave') {
      versionString = versionString.replace(/^\d+\./, '');
    }
    return versionString;
  }

  async openUrl (url) {
    if (this._usingProxy !== globalProxyUsageEnabled) {
      await this.restart();
      this._usingProxy = globalProxyUsageEnabled;
    }
    const { binary, flags } = this.command();
    const extendedFlags = [...flags, url];
    const process = child_process.execFile(binary, extendedFlags, { env: this.env() });
    this._pids.add(process.pid);
  }

  async kill () {
    for (const pid of this._pids) {
      killProcessAndDescendants(pid);
    }
    this._pids.clear();
  }

  async restart () {
    await this.kill();
    await this.launch();
  }

  async update () {
    throw new Error('not implemented');
  }

  static async setGlobalProxyUsageEnabled (enabled, port = null) {
    if (platform === "win32") {
      if (enabled) {
       // execSync(`netsh winhttp set proxy localhost:${port}`);
      } else {
       // execSync(`netsh winhttp reset proxy`);
      }
    } else {
      globalProxyUsageEnabled = enabled;
      globalProxyPort = port;
    }
  }

  static async countActiveVpns () {
    return 0; // Stubbed for Windows
  }
}

module.exports = { DesktopBrowser };
