module.exports = {
    "project": 'rmg-clocats',
    "env": 'dev',
    "hmacSecret": require('./itsNotForPublicGit.json').hmacSecret,
    // "hmacSecret": "default",
    "targetPlatform": require('gbase-html5-sdk').Gbase.GbaseApi.PLATFORM.STDL,
    "targetVersion": "0.0.1",
    "overrideAddress": null
    // "overrideAddress": 'http://localhost:1337'
};