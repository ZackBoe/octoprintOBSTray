const http = require('http');
const Store = require('electron-store')
const store = new Store()
const octoprint = require('./octoprint')
const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
dayjs.extend(duration)

console.log(`Overlay server running on port ${store.get('octoprint.overlay.port') || '1337' }`);
let html = `<html><head><title>OctoPrint Overlay</title>
<meta http-equiv="refresh" content="${store.get('octoprint.refresh' || 30)}">
<style>
body {
  background: transparent;
  margin: 0;
  padding: 0;
  font-size: 5rem;
  /* -webkit-text-stroke: 2px white; */
  font-weight: bold;
  font-family: "SFMono-Regular", "Cascadia Mono", Consolas, "Liberation Mono", Menlo, Courier, monospace;
}
progress {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 100%;
  height: 50%;
  margin: 0;
  padding: 0;
  border: 0;
}

.progress_details {
  display: flex;
  width: 100%;
  margin-top: 1rem;
  justify-content: space-between;
}
</style></head><body>`


http.createServer(async (req, res) => {
  console.log(req.url)

  job = await octoprint.job(store.get('octoprint'))
  job = JSON.parse(job)


  switch (req.url.replace('?json', '')) {
    case '/':
    case '/help':
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(`Hi!<br><a href="/job">Job Info</a><br><a href="/filename">Filename</a><br>
      <a href="/progress">Progress</a><br><a href="/progressBar">Progress Bar</a><br><a href="/time">Print Time</a><br><a href="/timeLeft">Print Time Left</a><br><br>
      You can get a JSON response for any url (excluding /help and /progressBar) by appending <code>?json</code> to the URL.<br><br>
      Updates might be hanging around at <a href="https://github.com/zackboe/octoprintOBSTray">GitHub</a>`)
      response = ''
      break;
    case '/job':
      responseJSON = job
      response = `State: ${job.state}\nFilename: ${job?.job?.file.name}\nProgress: ${Math.round(job?.progress?.completion)}%\nPrint Time: ${Math.round(job?.progress?.printTime/60)}\nPrint Time Left: ${Math.round(job?.progress?.printTimeLeft/60)}`
      break;
    case '/filename':
      responseJSON = {filename: job?.job?.file?.name, clean: job?.job?.file?.name.split('.gcode')[0]}
      response = job?.job?.file?.name.split('.gcode')[0]
      break;
    case '/progress':
      responseJSON = {progress: job?.progress?.completion, clean: Math.round(job?.progress?.completion)}
      response = Math.round(job?.progress?.completion)+'%'
      break;
    case '/progressBar': 
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(`${html}
        <progress max="100" value="${Math.round(job?.progress?.completion)}">${Math.round(job?.progress?.completion)}%</progress>
        <div class="progress_details">
          <span>${dayjs.duration(job?.progress?.printTime, 'seconds').format('HH:mm')}</span>
          <span>${Math.round(job?.progress?.completion)}%</span>
          <span>${dayjs.duration(job?.progress?.printTimeLeft, 'seconds').format('HH:mm')}</span>
        </div>`)
      response = ''
      break;
    case '/time':
      responseJSON = {printTime: job?.progress?.printTime}
      response = dayjs.duration(job?.progress?.printTime, 'seconds').format('HH:mm')
      break;
    case '/timeLeft':
      responseJSON = {printTimeLeft: job?.progress?.printTimeLeft}
      response = dayjs.duration(job?.progress?.printTimeLeft, 'seconds').format('HH:mm')
      break;
    default:
      response = ''
      res.writeHead(302, {'Location': `http://localhost:${store.get('octoprint.overlay.port') || '1337' }/help`});
      break;
  }

  if(!response) res.end()
  else {
    if(req.url.indexOf('?json') > -1) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(responseJSON))
    }
    else res.end(html+response+'</body></html>')
  }


    // let json_response = {
    // status : 200 , 
    // message : 'succssful' , 
    // result : [ 'sunday' , 'monday' , 'tuesday' , 'wednesday' ] , 
    // code : 2000
  // }
  // res.end( JSON.stringify(json_response) ); 
}).listen(store.get('octoprint.overlay.port') || 1337);
