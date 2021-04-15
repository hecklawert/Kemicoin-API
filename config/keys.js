const scc = require('../config/config-service')

module.exports = {
		getMongoUri: () => {return `mongodb://${scc.getConfig().mongodb[0].user}:${scc.getConfig().mongodb[0].password}@${scc.getConfig().mongodb[0].endpoint}:27017/${scc.getConfig().mongodb[0].database}`},
    getS3Config: () => {return scc.getConfig().s3[0]},
		secret: "mysecret",
}