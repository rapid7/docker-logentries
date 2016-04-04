# docker-logentries

Forward all your logs to [Logentries](https://logentries.com), like a breeze.

![logentries dashboard](https://raw.githubusercontent.com/nearform/docker-logentries/master/dashboard.png)

See the Logentries community pack at [http://revelops.com/community/packs/docker/](http://revelops.com/community/packs/docker/).

## Usage as a Container

The simplest way to forward all your container's log to Logentries is to
run this repository as a container, with:

```sh
docker run -v /var/run/docker.sock:/var/run/docker.sock logentries/docker-logentries -t <TOKEN> -j -a host=`uname -n`
```

You can also use different tokens for logging, stats and events:
```sh
docker run -v /var/run/docker.sock:/var/run/docker.sock logentries/docker-logentries -l <LOGSTOKEN> -k <STATSTOKEN> -e <EVENTSTOKEN> -j -a host=`uname -n`
```

You can pass the `--no-stats` flag if you do not want stats to be
published to Logentries every second. You __need this flag for Docker
version < 1.5__.

You can pass the `--no-logs` flag if you do not want logs to be published to Logentries.

You can pass the `--no-dockerEvents` flag if you do not want events to be
published to Logentries.

The `-i/--statsinterval <STATSINTERVAL>` downsamples the logs sent to Logentries. It collects samples and averages them before sending to Logentries.

If you don't use `-a` a default ``host=`uname -n` `` value will be added.

You can also filter the containers for which the logs/stats are
forwarded with:

* `--matchByName REGEXP`: forward logs/stats only for the containers whose name matches the given REGEXP.
* `--matchByImage REGEXP`: forward logs/stats only for the containers whose image matches the given REGEXP.
* `--skipByName REGEXP`: do not forward logs/stats for the containers whose name matches the given REGEXP.
* `--skipByImage REGEXP`: do not forward logs/stats for the containers whose image matches the given REGEXP.

You can pass the `--containersTokensFilepath` flag if you want different containers logs
to be published to different log sets.
The configuration file needs to respect the following format:
```json
{
    "repoName1": "logentries_token",
    "repoName2": "logentries_token"
}
```

### Running container in a restricted environment.
Some environments(such as Google Compute Engine) does not allow to access the docker socket without special privileges. You will get EACCES(`Error: read EACCES`) error if you try to run the container.
To run the container in such environments add --privileged to the `docker run` command.

Example:
```sh
docker run --privileged -v /var/run/docker.sock:/var/run/docker.sock logentries/docker-logentries -t <TOKEN> -j -a host=`uname -n`
```

## Usage as a CLI

1. `npm install docker-logentries -g`
2. `docker-logentries -t TOKEN -a host=\`uname -n\``
3. ..there is no step 3

You can also pass the `-j` switch if you log in JSON format, like
[bunyan](http://npm.im/bunyan).

You can pass the `--no-stats` flag if you do not want stats to be
published to Logentries every second.

You can pass the `--no-logs` flag if you do not want logs to be published to Logentries.

You can pass the `--no-dockerEvents` flag if you do not want events to be
published to Logentries.

The `-a/--add` flag allows to add fixed values to the data being
published. This follows the format 'name=value'.

The `-i/--statsinterval` downsamples the logs sent to Logentries. It collects samples and averages them before sending to Logentries.

You can also filter the containers for which the logs/stats are
forwarded with:

* `--matchByName REGEXP`: forward logs/stats only for the containers whose name matches the given REGEXP.
* `--matchByImage REGEXP`: forward logs/stats only for the containers whose image matches the given REGEXP.
* `--skipByName REGEXP`: do not forward logs/stats for the containers whose name matches the given REGEXP.
* `--skipByImage REGEXP`: do not forward logs/stats for the containers whose image matches the given REGEXP.

## Embedded usage

Install it with: `npm install docker-logentries --save`

Then, in your JS file:

```
var logentries = require('docker-logentries')({
  json: false, // or true to parse lines as JSON
  secure: false, // or true to connect securely
  token: process.env.TOKEN, // logentries TOKEN
  newline: true, // Split on newline delimited entries
  stats: true, // disable stats if false
  add: null, // an object whose properties will be added

  // the following options limit the containers being matched
  // so we can avoid catching logs for unwanted containers
  matchByName: /hello/, // optional
  matchByImage: /matteocollina/, //optional
  skipByName: /.*pasteur.*/, //optional
  skipByImage: /.*dockerfile.*/ //optional
})

// logentries is the source stream with all the
// log lines

setTimeout(function() {
  logentries.destroy()
}, 5000)
```

## Building a docker repo from this repository

First clone this repository, then:

```bash
docker build -t logentries .
docker run -v /var/run/docker.sock:/var/run/docker.sock logentries -t <TOKEN> -j -a host=`uname -n`
```

## How it works

This module wraps four [Docker
APIs](https://docs.docker.com/reference/api/docker_remote_api_v1.17/):

* `POST /containers/{id}/attach`, to fetch the logs
* `GET /containers/{id}/stats`, to fetch the stats of the container
* `GET /containers/json`, to detect the containers that are running when
  this module starts
* `GET /events`, to detect new containers that will start after the
  module has started

This module wraps
[docker-loghose](https://github.com/mcollina/docker-loghose) and
[docker-stats](https://github.com/pelger/docker-stats) to fetch the logs
and the stats as a never ending stream of data.

All the originating requests are wrapped in a
[never-ending-stream](https://github.com/mcollina/never-ending-stream).

## License

MIT
