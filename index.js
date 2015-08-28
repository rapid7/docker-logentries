#! /usr/bin/env node

'use strict';

var tls = require('tls');
var net = require('net');
var eos = require('end-of-stream');
var through = require('through2');
var minimist = require('minimist');
var allContainers = require('docker-allcontainers');
var statsFactory = require('docker-stats');
var logFactory = require('docker-loghose');
var eventsFactory = require('docker-event-log');
var os = require('os');

function connect(opts) {
  var stream;
  if (opts.secure) {
    stream = tls.connect(443, 'data.logentries.com', onSecure);
  } else {
    stream = net.createConnection(80, 'data.logentries.com');
  }

  function onSecure() {
    // let's just crash if we are not secure
    if (!stream.authorized) throw new Error('secure connection not authorized');
  }

  return stream;
}


function start(opts) {
  var logsToken = opts.logstoken || opts.token;
  var statsToken = opts.statstoken || opts.token;
  var eventsToken = opts.eventstoken || opts.token;
  var out;
  var noRestart = function() {};

  var filter = through.obj(function(obj, enc, cb) {
    addAll(opts.add, obj);
    var token = '';

    if (obj.line) {
      token = logsToken;
    }
    else if (obj.type) {
      token = eventsToken;
    }
    else if (obj.stats) {
      token = statsToken;
    }

    if (token) {
      this.push(token);
      this.push(' ');
      this.push(JSON.stringify(obj));
      this.push('\n');
    }

    cb()
  });

  var events = allContainers(opts);
  var loghose;
  var stats;
  var dockerEvents;
  var streamsOpened = 0;

  opts.events = events;

  if (opts.logs !== false && logsToken) {
    loghose = logFactory(opts);
    loghose.pipe(filter);
    streamsOpened++;
  }

  if (opts.stats !== false && statsToken) {
    stats = statsFactory(opts);
    stats.pipe(filter);
    streamsOpened++;
  }

  if (opts.dockerEvents !== false && eventsToken) {
    dockerEvents = eventsFactory(opts);
    dockerEvents.pipe(filter);
    streamsOpened++;
  }

  if (!stats && !loghose && !dockerEvents) {
    throw new Error('you should enable at least one of stats, logs or dockerEvents');
  }

  pipe();

  // destroy out if all streams are destroyed
  loghose && eos(loghose, function() {
    streamsOpened--;
    streamClosed(streamsOpened);
  });
  stats && eos(stats, function() {
    streamsOpened--;
    streamClosed(streamsOpened);
  });
  dockerEvents && eos(dockerEvents, function() {
    streamsOpened--;
    streamClosed(streamsOpened);
  });

  return loghose;

  function addAll(proto, obj) {
    if (!proto) { return; }

    var key;
    for (key in proto) {
      if (proto.hasOwnProperty(key)) {
        obj[key] = proto[key];
      }
    }
  }

  function pipe() {
    if (out) {
      filter.unpipe(out);
    }

    out = connect(opts);

    filter.pipe(out, { end: false });

    // automatically reconnect on socket failure
    noRestart = eos(out, pipe);
  }

  function streamClosed(streamsOpened) {
    if (streamsOpened <= 0) {
      noRestart()
      out.destroy();
    }
  }
}

function cli() {
  var argv = minimist(process.argv.slice(2), {
    boolean: ['json', 'secure', 'stats', 'logs', 'dockerEvents'],
    string: ['token', 'logstoken', 'statstoken', 'eventstoken'],
    alias: {
      'token': 't',
      'logstoken': 'l',
      'newline': 'n',
      'statstoken': 'k',
      'eventstoken': 'e',
      'secure': 's',
      'json': 'j',
      'statsinterval': 'i',
      'add': 'a'
    },
    default: {
      json: false,
      newline: true,
      stats: true,
      logs: true,
      dockerEvents: true,
      statsinterval: 30,
      add: [ 'host=' + os.hostname() ],
      token: process.env.LOGENTRIES_TOKEN,
      logstoken: process.env.LOGENTRIES_LOGSTOKEN || process.env.LOGENTRIES_TOKEN,
      statstoken: process.env.LOGENTRIES_STATSTOKEN || process.env.LOGENTRIES_TOKEN,
      eventstoken: process.env.LOGENTRIES_EVENTSTOKEN || process.env.LOGENTRIES_TOKEN
    }
  });

  if (argv.help || !(argv.token || argv.logstoken || argv.statstoken || argv.eventstoken)) {
    console.log('Usage: docker-logentries [-l LOGSTOKEN] [-k STATSTOKEN] [-e EVENTSTOKEN]\n' +
                '                         [-t TOKEN] [--secure] [--json]\n' +
                '                         [--no-newline] [--no-stats] [--no-logs] [--no-dockerEvents]\n' +
                '                         [-i STATSINTERVAL] [-a KEY=VALUE]\n' +
                '                         [--matchByImage REGEXP] [--matchByName REGEXP]\n' +
                '                         [--skipByImage REGEXP] [--skipByName REGEXP]\n' +
                '                         [--help]');

    process.exit(1);
  }

  if (argv.add && !Array.isArray(argv.add)) {
    argv.add = [argv.add];
  }

  argv.add = argv.add.reduce(function(acc, arg) {
    arg = arg.split('=');
    acc[arg[0]] = arg[1];
    return acc
  }, {});

  start(argv);
}

module.exports = start;

if (require.main === module) {
  cli();
}
