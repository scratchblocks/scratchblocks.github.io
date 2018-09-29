
version='v3.2'

start:
	http-server -c0 . 

copy:
	sh -c 'cd ../scratchblocks ; npm run build'
	cp ../scratchblocks/build/scratchblocks.min.js js/scratchblocks-v3.2-min.js
	cp ../scratchblocks/build/translations.min.js js/translations-v3.2-min.js
	cp ../scratchblocks/build/translations-all.min.js js/translations-all-v3.2-min.js

