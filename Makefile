
start:
	http-server -c0 . -p 8001

copy:
	sh -c 'cd ../scratchblocks ; npm run build'
	cp ../scratchblocks/build/scratchblocks.min.js js/scratchblocks-v4-min.js
	cp ../scratchblocks/build/translations.min.js js/translations-v4-min.js
	cp ../scratchblocks/build/translations-all.min.js js/translations-all-v4-min.js

