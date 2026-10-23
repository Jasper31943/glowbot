#!/bin/bash
# usage: shot2.sh name map 'js-setup'
cd /workspace/robot-maze
EVAL="(()=>{const S=__world.state(),W=__world.W;$3;__world.cam.init=false;return {m:S.m,x:S.x,y:S.y,zone:S.zone}})()" EVAL_WAIT=1.2 ./cdp.py 390x844m "world.html?new&noassist&at=$2&wait=1" shots/bossmoves/room2_$1.png 2 | grep EVAL
