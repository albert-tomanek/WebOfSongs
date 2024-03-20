#!/bin/sh
#neu create distrib
npm run build

rm -rf distrib/app/
mkdir -p distrib/app/
cp -r build/* distrib/app/

#git clone https://github.com/hschneider/neutralino-build-scripts.git --depth 1
sh -c "cd distrib; ../neutralino-build-scripts/build-win.sh"
sh -c "cd Neu-AppImage/;npm run-script test -- --exe ../distrib/dist/webofsongs/webofsongs-linux_x64 --res ../distrib/dist/webofsongs/resources.neu --program-name WebOfSongs --description \"Organize your Spotify songs into a mindmap-like web.\" --icon ../distrib/app/logo512.png --categories "Audio" --arch "x86_64" --out-dir .."