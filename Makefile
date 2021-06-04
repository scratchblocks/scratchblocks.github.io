
start:
	http-server -c0 . -p 8001

copy:
	sh -c 'cd ../scratchblocks ; npm run build'
	cp ../scratchblocks/build/scratchblocks.min.js js/scratchblocks-v3.5.1-min.js
	cp ../scratchblocks/build/scratchblocks.min.js.map js/scratchblocks-v3.5.1-min.js.map
	cp ../scratchblocks/build/translations.js js/translations-v3.5.1.js
	cp ../scratchblocks/build/translations-all.js js/translations-all-v3.5.1.js

