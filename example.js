
var logentries = require('./')({
  json: false, // or true to parse lines as JSON
  secure: false, // or true to connect securely
  token: process.env.TOKEN,
  statsinterval: 5 // collect 5 logs, average them and send result to Logentries
});

// logentries is the source stream with all the
// log lines

/*
setTimeout(function() {
  logentries.destroy()
}, 1000);
*/
