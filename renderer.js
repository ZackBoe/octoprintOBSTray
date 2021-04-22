const {ipcRenderer} = require('electron')
const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
dayjs.extend(duration)


let settingsFields = {
  octoprintURL: document.querySelector('[name="settings-octoprint_url"]'),
  octoprintKey: document.querySelector('[name="settings-octoprint_key"]'),
  octoprintRefresh: document.querySelector('[name="settings-octoprint_refresh"]'),
  overlayEnable: document.querySelector('[name="settings-overlay_enable"]'),
  overlayPort: document.querySelector('[name="settings-overlay_port"]'),
}

function setSettings(store) {
  if(store.url) settingsFields.octoprintURL.value = store.url
  if(store.key) settingsFields.octoprintKey.value = store.key
  if(store.refresh) settingsFields.octoprintRefresh.value = store.refresh
  if(store.overlay.enabled) settingsFields.overlayEnable.checked = store.overlay.enabled
  if(store.overlay.port) settingsFields.overlayPort.value = store.overlay.port
}

function saveSettings() {
  console.log('save')
  console.log(settingsFields.overlayEnable.checked)
  ipcRenderer.send('settings-save', {
    octoprintURL: settingsFields.octoprintURL.value,
    octoprintKey: settingsFields.octoprintKey.value,
    octoprintRefresh: settingsFields.octoprintRefresh.value,
    overlayEnable: settingsFields.overlayEnable.checked,
    overlayPort: settingsFields.overlayPort.value,
  })
}

function flash(type, msg) {
  const field = document.querySelector('#flash')
  field.classList = type || ''
  field.innerText = msg || ''
}

for (const [key,field] of Object.entries(settingsFields)) {
  field.addEventListener('change', () => saveSettings() )
}

ipcRenderer.send('settings-init')

ipcRenderer.on('settings-init', (e, arg) => {
  console.log('Settings init reply:', arg)
  setSettings(arg)
})

ipcRenderer.on('version-info', (e, arg) => {
  let versions = JSON.parse(arg)
  console.log(versions)
  document.querySelector('#version_octoprinttray').innerText = versions.octoprintTray
  document.querySelector('#version_electron').innerText = versions.electronVersion
  document.querySelector('#version_chromium').innerText = versions.chromeVersion
  document.querySelector('#version_octoprintserver').innerText = versions.octoprintServer
})

const testConnection = document.querySelector('#test-connection')
testConnection.addEventListener('click', () => {
  flash()
  saveSettings()
  ipcRenderer.send('test-connection')
})

ipcRenderer.on('test-connection', (e, arg) => {
  console.log('connection test', arg)
  let test = JSON.parse(arg)
  if(test && test.name) flash('success', `Connected as ${test.name}`)
  else if(test && test.groups && test.name == null) flash('error', `Error connecting: invalid key`)
  else flash('error', `Error connecting: ${arg}`)
})

ipcRenderer.on('job', (e, job) => {
  console.log('job', job)
  document.querySelector('main').innerHTML = `<ul>
  <li>Status: ${job.state}</li>
  <li>Filename: ${job.job.file.name.split('.gcode')[0]}</li>
  <li>Progress: ${Math.round(job?.progress?.completion)}%</li>
  <li>Print Time: ${dayjs.duration(job?.progress?.printTime, 'seconds').format('HH:mm:ss')}</li>
  <li>Print Time Left: ${dayjs.duration(job?.progress?.printTimeLeft, 'seconds').format('HH:mm:ss')}</li>
  </ul>
  <progress style="width: 100%;" max="100" value="${Math.round(job?.progress?.completion)}">${Math.round(job?.progress?.completion)}%</progress>`
})

const btnMinimize = document.querySelector('#btn-minimize')
btnMinimize.addEventListener('click', () => {
  saveSettings()
  window.close()
})

const btnExit = document.querySelector('#btn-exit')
btnExit.addEventListener('click', () => {
  window.close()
  ipcRenderer.send('exit')
})

const openOctoprint = document.querySelector('#open-octoprint')
openOctoprint.addEventListener('click', () => {
  ipcRenderer.send('open', 'octoprint')
})

const openOverlay = document.querySelector('#open-overlay')
openOverlay.addEventListener('click', () => {
  ipcRenderer.send('open', 'overlay')
})

const openGithub = document.querySelector('#open-github')
openGithub.addEventListener('click', () => {
  ipcRenderer.send('open', 'github')
})
