const got = require('got')

exports.currentuser = async (store) => {
  console.log(store)
  try {
    const resp = await got(`${store.url}/api/currentuser`, {
      headers: {
        'X-Api-Key': store.key
      },
      timeout: 500,
      retry: 0,
    })

    return resp.body
  } catch(error) {
    console.error('Error connecting', error.response.body)

    return error.response.statusCode
  }

}

exports.job = async (store) => {
  try {
    const resp = await got(`${store.url}/api/job`, {
      headers: {
        'X-Api-Key': store.key
      },
      timeout: 1500,
      retry: 0,
    })
    
    return resp.body
  } catch(error) {
    console.error('Error connecting', error.response.body)

    return error.response.statusCode
  }
}

exports.serverInfo = async (store) => {
  try {
    const resp = await got(`${store.url}/api/version`, {
      headers: {
        'X-Api-Key': store.key
      },
      timeout: 1500,
      retry: 0,
    })
    
    return resp.body
  } catch(error) {
    console.error('Error connecting', error.response.body)

    return error.response.statusCode
  }  
}

exports.connect = async () => {

  const resp = await got(`${process.env.OCTOPRINT_URL}/api/job`, {
    headers: {
      'X-Api-Key': process.env.OCTOPRINT_KEY
    }
  })

  return resp.body

}