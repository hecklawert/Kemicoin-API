const fetch = require('node-fetch');

let config;

async function setConfig(urlScc){
  try{
    const res = fetch(urlScc)
      .then(res => res.json())
      .then(json  => {
        return json
      });
    config = await res
  }catch(e){
    console.log(e)
    exit()
  }
}

function getConfig(){
  return config
}

module.exports = {
  setConfig,
  getConfig
}