<!DOCTYPE html>
<meta charset="utf-8">
<meta name=viewport content="width=device-width, initial-scale=1">
<title>scratchblocks homepage</title>

<meta name=description content="Use scratchblocks to write pictures of Scratch scripts in forum posts.">

<link rel=stylesheet href="//fonts.googleapis.com/css?family=Noto+Sans:400,700">
<link rel=stylesheet href="/lib/codemirror-custom.css">
<link rel=stylesheet href="/style.css">

<!---------------------------------------------------------------------------->

<h1>
  <div id=title>
    <a href="/">scratchblocks</a>
    <span class=author>v3.5 • by <a href="//tjvr.org">blob8108</a></span>
  </div>
  <span>
    <a target="_blank" href="http://wiki.scratch.mit.edu/wiki/Block_Plugin/Syntax">help</a>
    <a href="http://github.com/tjvr/scratchblocks">github</a>
    <a href="/translator/" id="translate-link"><b>translate</b></a>
    <a href="/generator/"><b>generate</b></a>
    <a href="/v3.1/" id="version-link">previous</a>
  </span>
</h1>

<div id="side">
<div>
  <select id="choose-style">
    <option value="scratch2">Scratch 2.0
    <option value="scratch3" selected>Scratch 3.0
  </select>

  <select id="choose-lang">
    <option value="">Select language…
  </select>

  <small id=lang-status></small>

</div>

<div id="editor"></div>
</div>

<pre id="preview" class="blocks"></pre>

<a id="export-svg" class="export-link" download="scratchblocks.svg">Export SVG</a>
<a id="export-png" class="export-link" download="scratchblocks.png">Export PNG</a>

<!---------------------------------------------------------------------------->

<script src="/js/scratchblocks-v3.5-min.js"></script>
<script src="/js/translations-all-v3.5.js" charset="utf8"></script>
<script src=/lib/codemirror-compressed.js></script>

<script>
var editor = document.getElementById('editor');
var exportSVGLink = document.getElementById('export-svg');
var exportPNGLink = document.getElementById('export-png');

var obj = {
  style: 'scratch3',
};
extractHash();

var codeMirror = CodeMirror(editor, {
  value: obj.script || "",
  //mode: "scratch",

  indentUnit: 4,
  tabSize: 4,
  indentWithTabs: true,

  lineNumbers: false,

  autofocus: true,

  cursorHeight: 1,

  placeholder: '. . .',

  // viewportMargin: 'Infinity',
});
codeMirror.setCursor(codeMirror.getValue().length);

// Debounces a function, pulled out of Underscore.js
function debounce(func, wait, immediate) {
  var timeout, result;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) result = func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) result = func.apply(context, args);
    return result;
  };
};
codeMirror.on("change", debounce(function() {
  obj.script = codeMirror.getValue();
  objUpdated();
}, 250, false));

var onResize = function() {
  codeMirror.setSize(editor.clientWidth, editor.clientHeight)
};
window.addEventListener('resize', onResize);
onResize();


var chooseLang = document.getElementById('choose-lang');

var languageCodes = Object.keys(scratchblocks.allLanguages)
languageCodes.sort()
languageCodes.forEach(function(code) {
  if (code === "en") return
  var option = document.createElement("option")
  option.value = code

  var language = scratchblocks.allLanguages[code]
  option.textContent = language.name && language.altName ? language.name + " — " + language.altName : language.name || language.altName || code
  chooseLang.appendChild(option)
})

var langStatus = document.getElementById('lang-status')

chooseLang.addEventListener('change', function(e) {
  if (obj.lang === chooseLang.value) return
  obj.lang = chooseLang.value;
  objUpdated();
});


var chooseStyle = document.getElementById('choose-style');

chooseStyle.addEventListener('change', function(e) {
  if (obj.style === chooseStyle.value) return
  obj.style = chooseStyle.value;
  objUpdated();
});



/* Extract hash from location. Returns true if changed */
function extractHash() {
  var newObj = decodeHash();
  if (!newObj || !newObj.script) {
    newObj = {
      script: "",
      lang: obj.lang,
    };
  }

  newObj.style = newObj.style || obj.style || 'scratch3'

  if (newObj.lang !== obj.lang || newObj.script !== obj.script) {
    obj = newObj;
    return true;
  }
  return false;
}

function decodeHash() {
  var hash = location.href.split('#')[1];
  if (!hash) return;

  if (!/^\?/.test(hash)) {
    return {
      script: decodeURIComponent(hash),
    };
  } else {
    var newObj = {};
    parts = hash.slice(1).split('&');
    parts.forEach(function(part) {
      var match = /^(.*)=(.*)$/.exec(part);
      if (!match) return;
      var key = decodeURIComponent(match[1]);
      var value = decodeURIComponent(match[2]);
      if (key === "lang" || key === "script" || key === "style") {
        newObj[key] = value;
      }
    });
    return newObj;
  }
}

function setHash(hash) {
  if (history && history.replaceState) {
    history.replaceState("", "", hash);
  } else {
    location.hash = hash;
  }
}

function objUpdated() {
  // set hash
  if (obj.lang || obj.style) {
    var hash = '#?'
    if (obj.style) hash += 'style=' + encodeURIComponent(obj.style) + '&'
    if (obj.lang) hash += 'lang=' + encodeURIComponent(obj.lang) + '&'
    hash += 'script='+encodeURIComponent(obj.script)
    setHash(hash)
  } else if (obj.style) {
    setHash('#?lang=' + encodeURIComponent(obj.lang) + '&script='+encodeURIComponent(obj.script));
  } else if (obj.lang) {
    setHash('#?lang=' + encodeURIComponent(obj.lang) + '&script='+encodeURIComponent(obj.script));
  } else if (obj.script) {
    setHash('#'+encodeURIComponent(obj.script));
  } else {
    if (!(location.hash == '' || location.hash == '#')) {
      setHash('#');
    }
  }

  // render code
  var doc = window.doc = scratchblocks.parse(obj.script, {
    languages: obj.lang ? ['en', obj.lang] : ['en'],
  });
  var docView = scratchblocks.newView(doc, {
    style: obj.style,
  })
  var svg = docView.render()
  preview.innerHTML = "";
  preview.appendChild(svg);
  if (obj.style === 'scratch3') {
    svg.style.transform = 'scale(0.675)';
    svg.style.transformOrigin = '0 0';
  }

  exportSVGLink.href = "";
  exportPNGLink.href = "";

  // add export link
  setTimeout(function() {
    exportSVGLink.href = docView.exportSVG();

    docView.exportPNG(function(pngDataURL) {
      exportPNGLink.href = pngDataURL;
    }, 3);
  }, 0);

  // include code in scratchblocks links
  document.getElementById('translate-link').href = "/translator/" + '#'+encodeURIComponent(obj.script);
  document.getElementById('version-link').href = "/v3.1/" + '#?lang=' + encodeURIComponent(obj.lang) + '&script=' + encodeURIComponent(obj.script);

  // update language dropdown
  var lang = scratchblocks.allLanguages[obj.lang]
  langStatus.textContent = lang ? lang.percentTranslated + "%" : "";
  if (Object.keys(lang.aliases).length === 0) {
    var link = document.createElement("a")
    link.href = "https://github.com/scratchblocks/scratchblocks/edit/master/locales-src/extra_aliases.js"
    link.textContent = "requires aliases"
    langStatus.textContent += ", "
    langStatus.appendChild(link)
  }
}

setInterval(function() {
  if (extractHash()) {
    updatedFromHash();
  }
}, 200);

function updatedFromHash() {
  objUpdated();
  codeMirror.setValue(obj.script);
  chooseLang.value = obj.lang || "";
  chooseStyle.value = obj.style || "";
}

updatedFromHash();

</script>
<script>
  !function(g,s,q,r,d){r=g[r]=g[r]||function(){(r.q=r.q||[]).push(
  arguments)};d=s.createElement(q);q=s.getElementsByTagName(q)[0];
  d.src='//d1l6p2sc9645hc.cloudfront.net/tracker.js';q.parentNode.
  insertBefore(d,q)}(window,document,'script','_gs');

  _gs('GSN-349113-Y');
</script>

