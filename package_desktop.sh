#!/bin/sh
#neu create distrib
npm run build

rm -rf distrib/app/
mkdir -p distrib/app/
cp -r build/* distrib/app/

#git clone https://github.com/hschneider/neutralino-build-scripts.git --depth 1
sh -c "cd distrib; ./build-win.sh"
cp distrib/dist/win_x64/WebOfSongs.exe .
sh -c "cd distrib; ./build-linux.sh"
sh -c "cd Neu-AppImage/;npm run-script test -- --exe ../distrib/dist/linux_x64/WebOfSongs/webofsongs-linux_x64 --res ../distrib/dist/linux_x64/WebOfSongs/resources.neu --program-name WebOfSongs --description \"Organize your Spotify songs into a mindmap-like web.\" --icon ../distrib/app/logo512.png --categories "Audio" --arch "x86_64" --out-dir .."
