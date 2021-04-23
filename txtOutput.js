const { app } = require('electron')
const Store = require('electron-store')
const fs = require('fs')
const path = require('path')
const store = new Store()
const octoprint = require('./octoprint')
const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
dayjs.extend(duration)

let txtDir = path.join(app.getPath('userData'), 'txtOutput')
monitorJob()
let monitorInterval = setInterval(monitorJob, store.get('octoprint.refresh' || 30)*1000)

console.log('txtOutput: running')

async function monitorJob() {

  currentJob = await octoprint.job(store.get('octoprint'))
  job = JSON.parse(currentJob)
  if(job.state) {

    console.log('txtOutput: writing files')

    fs.writeFile(path.join(txtDir, 'state.txt'), job.state || '', (err) => {
      if(err) console.error('Error writing state file', err)
    })

    fs.writeFile(path.join(txtDir, 'filename.txt'), job?.job?.file?.name.split('.gcode')[0] || '', (err) => {
      if(err) console.error('Error writing filename file', err)
    })
    
    fs.writeFile(path.join(txtDir, 'time.txt'), dayjs.duration(job?.progress?.printTime, 'seconds').format('HH:mm'), (err) => {
      if(err) console.error('Error writing state file', err)
    })

    fs.writeFile(path.join(txtDir, 'timeLeft.txt'), dayjs.duration(job?.progress?.printTimeLeft, 'seconds').format('HH:mm'), (err) => {
      if(err) console.error('Error writing state file', err)
    })

    fs.writeFile(path.join(txtDir, 'progress.txt'), Math.round(job?.progress?.completion)+'%' || '', (err) => {
      if(err) console.error('Error writing state file', err)
    })

  }

}
