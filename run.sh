#!/bin/bash

useradd node
chown -R node:node /usr/src 

gosu node:${GID} /usr/src/app/index.js --secure -i 60 -l "$logs" -k "$stats" -e "$events"
