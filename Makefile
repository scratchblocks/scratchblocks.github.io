
all : test

test: 
	cp ../scratchblocks/src/scratchblocks.js js/scratchblocks-v3.1.1-min.js

copy :
	sh -c 'cd ../scratchblocks ; make clean all'
	cp ../scratchblocks/build/scratchblocks-v3.1.1-*.js js/scratchblocks-v3.1-min.js
	cp ../scratchblocks/build/translations-all-v3.1.1-*.js js/translations-all-v3.1-min.js
	cp ../scratchblocks/build/translations-v3.1.1-*.js js/translations-v3.1-min.js
	cp ../scratchblocks/build/scratchblocks-v3.1.1-*.js js/scratchblocks-v3-min.js
	cp ../scratchblocks/build/translations-all-v3.1.1-*.js js/translations-all-v3-min.js
	cp ../scratchblocks/build/translations-v3.1.1-*.js js/translations-v3-min.js

