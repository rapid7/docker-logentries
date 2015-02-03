
var tls = require('tls');
var net = require('net');
var eos = require('end-of-stream');
var through = require('through2');
var argv = require('minimist')(process.argv.slice(2), {
  boolean: ['json'],
  alias: {
    'token': 't',
    'secure': 's',
    'json': 'j'
  },
  default: {
    json: false
  }
});
var token = argv.token;
var filter = through.obj(function(obj, enc, cb) {
  this.push(token);
  this.push(' ');
  this.push(JSON.stringify(obj));
  this.push('\n');
  cb()
});
var out;

if (!token) {
  console.log('Usage: docker-logentries -t TOKEN [--secure] [--json]')
  process.exit(1)
}

var loghose = require('docker-loghose')({ json: argv.json }).pipe(filter);

return start()

function connect(){
  var stream;
  if (argv.secure) {
    stream = tls.connect(20000, 'api.logentries.com', onSecure)
  } else {
    stream = net.createConnection(10000, 'api.logentries.com')
  }

  function onSecure(){
    // let's just crash if we are not secure
    if (!stram.authorized) throw new Error('secure connection not authorized');
  }

  return stream;
}

function start() {
  if (out) {
    loghose.unpipe(out);
  }

  out = connect();

  loghose.pipe(out, { end: false });

  // automatically reconnect on socket failure
  eos(out, start);
}
