const octoprint = require('./octoprint')
const path = require('path')
const { app, BrowserWindow, Menu, Tray, nativeImage, shell, ipcMain } = require('electron')
const {electronVersion, chromeVersion} = require('electron-util');
const Store = require('electron-store')

try {
	require('electron-reloader')(module);
} catch {}

let mainWindow;
let tray;
let isQuitting;
let job;
let monitorInterval;
const icons = {
  orange: nativeImage.createFromPath(path.join(__dirname, 'images/icon-orange.png')),
  red: nativeImage.createFromPath(path.join(__dirname, 'images/icon-red.png')),
  blue: nativeImage.createFromPath(path.join(__dirname, 'images/icon-blue.png')),
  green: nativeImage.createFromPath(path.join(__dirname, 'images/icon-green.png')),
}

const store = new Store()

const instanceLock = app.requestSingleInstanceLock()
if(!instanceLock) app.quit()

app.whenReady().then(() => {

  tray = new Tray(icons.red)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Octoprint', click: () => shell.openExternal(store.get('octoprint.url')) },
    { type: 'separator' },
    { label: 'Show UI', click: () => mainWindow.show() },
    { label: 'Exit', click: () => {
      isQuitting = true
      app.quit()
    }}
  ])

  tray.setToolTip('Octoprint: ')
  tray.setContextMenu(contextMenu)


  mainWindow =  new BrowserWindow({
    maximizable: false,
    frame: false,
    x: 320,
    y: 450,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadFile('index.html')
  console.log(store.get('octoprint'))

  if(store.get('octoprint.overlay.enabled')) {
    require('./overlay')
  }

  starMonitoring()

  mainWindow.on('minimize', (e) => {
    e.preventDefault()
    mainWindow.hide()
  })

    mainWindow.on('close', (e) => {
    if(!isQuitting) e.preventDefault()
    mainWindow.hide()
  })

  ipcMain.on('exit', async () => {
    isQuitting = true
    app.quit()
  })

  ipcMain.on('open', async(e, args) => {
    if(args === 'github') shell.openExternal('https://github.com/zackboe/octoprintOBSTray')
    else if (args === 'octoprint') shell.openExternal(store.get('octoprint.url'))
    else if (args === 'overlay') shell.openExternal(`http://localhost:${store.get('octoprint.overlay.port') || '1337'}`)
  })

  ipcMain.on('settings-init', async (e, arg) => {
    console.log('got settings init request from render')
    e.reply('settings-init', store.get('octoprint'))
    connectionTest = await octoprint.currentuser(store.get('octoprint'))
    octoVersion = await octoprint.serverInfo(store.get('octoprint'))
    e.reply('test-connection', connectionTest)
    e.reply('version-info', JSON.stringify({
      octoprintTray: app.getVersion(),
      electronVersion: electronVersion,
      chromeVersion: chromeVersion,
      octoprintServer: JSON.parse(octoVersion).server || 'Couldn\'t connect'
    }))
  })

  ipcMain.on('settings-save', (e, arg) => {
    console.log('Saving:', arg)
    store.set('octoprint.url', arg.octoprintURL || '')
    store.set('octoprint.key', arg.octoprintKey || '')
    store.set('octoprint.overlay.enabled', arg.overlayEnable)
    store.set('octoprint.overlay.port', arg.overlayPort || 1337)
  })

  ipcMain.on('test-connection', async (e, arg) => {
    connectionTest = await octoprint.currentuser(store.get('octoprint'))
    octoVersion = await octoprint.serverInfo(store.get('octoprint'))
    e.reply('test-connection', connectionTest)
    e.reply('version-info', JSON.stringify({
      octoprintTray: app.getVersion(),
      electronVersion: electronVersion,
      chromeVersion: chromeVersion,
      octoprintServer: JSON.parse(octoVersion).server || '??'
    }))
    if(connectionTest?.groups && connectionTest?.name) {
      starMonitoring()
    }
  })

})

async function starMonitoring() {

  connectionTest = await octoprint.currentuser(store.get('octoprint'))
  connectionTest = JSON.parse(connectionTest)
  if(connectionTest?.groups && connectionTest?.name) {
    console.log('connected!')
    tray.setImage(icons.orange)
    
    monitorJob()
    monitorInterval = setInterval(monitorJob, 5000)
  } 
  else console.error('what', connectionTest)
}

async function monitorJob() {

  currentJob = await octoprint.job(store.get('octoprint'))
  job = JSON.parse(currentJob)
  if(job.state) {
    tray.setToolTip(`Connected to Octoprint: ${job.state}`)
    mainWindow.webContents.send('job', job)
    if(['Offline', 'Cancelling', 'Error'].indexOf(job.state) > -1) tray.setImage(icons.orange)
    else if(['Operational', 'Pausing', 'Paused'].indexOf(job.state) > -1) tray.setImage(icons.blue)
    else if(job.state === 'Printing') tray.setImage(icons.green)
  } else {
    tray.setToolTip(`Not connected to Octoprint`)
    tray.setImage(icons.red)
    clearInterval(monitorInterval)
  }

}
