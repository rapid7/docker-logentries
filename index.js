#! /usr/bin/env node

var tls = require('tls');
var net = require('net');
var eos = require('end-of-stream');
var through = require('through2');
var minimist = require('minimist');
var factory = require('docker-loghose');

function connect(opts) {
  var stream;
  if (opts.secure) {
    stream = tls.connect(20000, 'api.logentries.com', onSecure);
  } else {
    stream = net.createConnection(10000, 'api.logentries.com');
  }

  function onSecure() {
    // let's just crash if we are not secure
    if (!stram.authorized) throw new Error('secure connection not authorized');
  }

  return stream;
}

function start(opts) {
  var token = opts.token;
  var out;
  var filter = through.obj(function(obj, enc, cb) {
    this.push(token);
    this.push(' ');
    this.push(JSON.stringify(obj));
    this.push('\n');
    cb()
  });
  var loghose = factory(opts);
  loghose.pipe(filter);

  pipe();

  // destroy out if loghose is destroyed
  eos(loghose, function() {
    out.destroy();
  });

  return loghose;

  function pipe() {
    if (out) {
      filter.unpipe(out);
    }

    out = connect(opts);

    filter.pipe(out, { end: false });

    // automatically reconnect on socket failure
    eos(out, pipe);
  }
}

function cli() {
  var argv = minimist(process.argv.slice(2), {
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

  if (!argv.token) {
    console.log('Usage: docker-logentries -t TOKEN [--secure] [--json]');
    process.exit(1);
  }

  start(argv);
}

module.exports = start;

if (require.main === module) {
  cli();
}
