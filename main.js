const {app, BrowserWindow} = require('electron')
const {autoUpdater} = require('electron-updater')
const ipcMain = require('electron').ipcMain;
const path = require('path')
const url = require('url')
const schedule = require('node-schedule');
autoUpdater.logger = require("electron-log")
autoUpdater.logger.transports.file.level = "info"
let restartTime
const isDev = require('electron-is-dev');
let win

function createWindow() {
    win = new BrowserWindow({
        name: "12ReTech",
        frame: false,
        icon: path.join(__dirname, 'assets', 'icons', 'win', 'icon.ico')
    })

    win.setFullScreen(true);
    win.setMenu(null);
    // load the dist folder from Angular
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true
    }));
    win.focus();

    // Open the DevTools optionally:
   if (isDev) {
        win.webContents.openDevTools()
   }
    win.on('closed', () => {
        win = null
    })
    return win;
}

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

if (isSecondInstance) {
    app.quit()
}


ipcMain.on('restart', function (event, arg) {
    schedule.scheduleJob(arg, function () {
        app.relaunch()
        app.exit(0)
        app.quit()
    });
});

ipcMain.on('restart-now', function (event, arg) {
    app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])})
    app.exit(0)
    app.quit();
});
if (!isDev) {
    autoUpdater.on('checking-for-update', (info) => {
        win.webContents.on('did-finish-load', () => {
            win.webContents.send('log-message', 'checking-for-update', 'checking for app update on app start');
        });
    });

    autoUpdater.on('update-available', (info) => {
        win.webContents.send('log-message', 'update-available', 'New app version '+ info.version +' is available , release date '+info.releaseDate);
    });

    autoUpdater.on('update-not-available', (info) => {
        win.webContents.send('log-message', 'update-not-available',  'Update for version ' +info.version+ ' is not available (latest version: '+info.version+')');
    });

    autoUpdater.on('error', (err) => {
        win.webContents.send('log-message', 'update-error', 'Error in auto-updater. '+err);
    })

    autoUpdater.on('update-downloaded', (info) => {
        var silentUpdateInstall = true,
            forceUpdatedAppRun = true;
        win.webContents.send('log-message', 'update-downloaded', 'New app version '+ info.version +' has been downloaded , release date '+info.releaseDate);
        setTimeout(function(){
            autoUpdater.quitAndInstall(silentUpdateInstall, forceUpdatedAppRun);
        }, 15000);
    });
}

app.on('ready', function () {
    autoUpdater.autoDownload = true;
    createWindow();
   if (!isDev) {
        autoUpdater.checkForUpdates();
   }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})