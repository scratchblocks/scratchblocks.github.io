VERSION=v$(shell jq < ../scratchblocks/package.json .version -r)

start:
	http-server -c0 . -p 8001

copy:
	sh -c 'cd ../scratchblocks ; npm run build'
	cp ../scratchblocks/build/scratchblocks.min.js js/scratchblocks-$(VERSION)-min.js
	cp ../scratchblocks/build/scratchblocks.min.js.map js/scratchblocks-$(VERSION)-min.js.map
	cp ../scratchblocks/build/translations.js js/translations-$(VERSION).js
	cp ../scratchblocks/build/translations-all.js js/translations-all-$(VERSION).js

