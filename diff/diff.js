
function isArray(o) {
  return typeof o === 'object' && o.constructor === Array
}

function isOp(s) {
  return typeof s === 'string' && /^[ ~+-]$/.test(s)
}

function isStack(obj) {
  return obj === null // empty stack
      || (isArray(obj) && isArray(obj[0]))
}

function el(tagName, className, textContent, children) {
  if (className === undefined) { className = tagName; tagName = 'div'; }
  var el = document.createElement(tagName);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  (children || []).forEach(function(child) {
    el.appendChild(child);
  });
  return el;
}

function makeSection(title, small) {
  var triangle = el('span', 'disclosure-triangle', '▼');
  var heading = el(small ? 'h3' : 'h2', null, null, [
    triangle,
    document.createTextNode(title),
  ]);
  var section = el('closeable');
  heading.addEventListener('click', function() {
    triangle.classList.toggle('closed');
    section.classList.toggle('closed');
  });
  return {
    heading: heading,
    triangle: triangle,
    section: section,
    //content: section,
  };
}

function makeSubSection(title) {
  var s = makeSection(title, true)
  var content = el('content');
  s.section.appendChild(content);
  s.content = s.section
  return s
}

var compareButton = document.getElementById('compare-button');

function checkEnterKey(event) {
  if (event.keyCode === 13) {
    go();

    if (event.target === compareButton) {
      compareButton.classList.add('pressed');
      window.setTimeout(function() {
        compareButton.classList.remove('pressed');
      }, 200);
    }
  }
}
compareButton.addEventListener('keydown', checkEnterKey);
compareButton.addEventListener('click', go);

var Task = function(size) {
  this.size = size | 0;
  this.frac = 0.0;
};

var Input = function(el) {
  this.el = el;
  this.input = el.querySelector('input');
  this.progressBar = el.querySelector('.progress');

  this.input.addEventListener('keydown', checkEnterKey);

  var myself = this;
  this.input.addEventListener('input', function(event) {
    myself.fixValue();
    updateHash();
  });

  this.tasks = [];
};

Input.prototype.getValue = function() {
  return this.input.value.replace(/[^0-9]+/g, '');
};

Input.prototype.fixValue = function() {
  var selStart = this.selectionStart;
  var selEnd = this.selectionEnd;
  this.setValue(this.getValue());
  this.selectionStart = selStart;
  this.selectionEnd = selEnd;
};

Input.prototype.setValue = function(value) {
  value = value.replace(/[^0-9]+/g, '');
  var newValue = "scratch.mit.edu/projects/" + value;
  if (this.input.value !== newValue) this.input.value = newValue;
}

Input.prototype.setProgress = function(frac) {
  var fullWidth = this.input.offsetWidth;
  var actualFrac = (frac * 0.95) + 0.05;
  this.progressBar.style.width = (actualFrac * fullWidth) + 'px';
};

Input.prototype.updateProgress = function(frac) {
  var totalSize = 0;
  var totalComplete = 0.0;
  this.tasks.forEach(function(task) {
    totalSize += task.size;
    totalComplete += task.size * task.frac;
  });
  var frac = totalComplete / totalSize;
  this.setProgress(frac);
};

Input.prototype.get = function(url, type, cb) {
  var xhr = new XMLHttpRequest();

  var task = new Task(5000); // arbitrary number, 'cos we don't know any better
  this.tasks.push(task);
  var myself = this;
  xhr.addEventListener('progress', function(event) {
    if (event.lengthComputable) {
      task.frac = event.loaded / event.total;
      task.size = event.total;
      myself.updateProgress();
    }
  });
  this.updateProgress();

  xhr.addEventListener('load', function(event) {
    task.frac = 1.0;
    myself.updateProgress();
    cb(xhr.response);
  });

  var failed = function(event) {
    console.log(event);
    myself.error();
    cb(null);
  };
  xhr.addEventListener('error', failed);
  xhr.addEventListener('abort', failed);

  xhr.open('GET', url, true);
  xhr.responseType = type;
  xhr.send();
};

Input.prototype.error = function() {
  this.el.classList.add('error');
};

Input.prototype.fetch = function(cb) {
  this.el.classList.remove('error');
  this.tasks = [];

  this.fixValue();
  this.input.blur();
  this.setProgress(0.05);
  this.progressBar.classList.remove('animated');
  window.setTimeout(function() {
    myself.progressBar.classList.add('on');
    myself.progressBar.classList.add('animated');
  }, 10);
  var id = this.getValue();
  var url = "http://projects.scratch.mit.edu/internalapi/project/" + id + "/get/";

  var myself = this;
  this.get(url, '', function(data) {
    if (!data) {
      cb(null, {});
      return;
    }
    try {
      var project = JSON.parse(data);
    } catch (e) {
      myself.error();
      cb(null, {});
      return;
    }
    var assets = [];
    var remaining = [];
    project.children.concat([project]).forEach(function(obj) {
      if (obj.costumes) {
        obj.costumes.forEach(function(costume) {
          var md5 = costume.baseLayerMD5;
          var url = assetURL(md5);
          var type = /svg/.test(md5) ? 'text' : 'blob'
          myself.get(url, type, function(data) {
            assets[md5] = data;
            var index = remaining.indexOf(md5);
            remaining.splice(index, 1);
            if (!remaining.length) {
              window.setInterval(function() {
                myself.progressBar.classList.remove('on');
              }, 500);
              cb(project, assets);
            }
          });
          remaining.push(md5);
        });
      }
    });
  });
};

function assetURL(md5) {
  return "http://cdn.assets.scratch.mit.edu/internalapi/asset/" + md5 + "/get/";
}

var leftInput = new Input(document.getElementById('left'));
var rightInput = new Input(document.getElementById('right'));
var changes = document.getElementById('changes');

function updateHash() {
  window.location.hash = leftInput.getValue() + '+' + rightInput.getValue();
}
function readHash() {
  var hash = window.location.hash;
  if (hash) {
    var parts = hash.split('+');
    if (parts.length == 2) {
      leftInput.setValue(parts[0]);
      rightInput.setValue(parts[1]);
    }
  }
  updateHash();
}
readHash();
if (leftInput.getValue() && rightInput.getValue()) go();
window.setInterval(readHash, 500);

function go(event) {
  compareButton.blur();

  changes.innerHTML = '';
  var status = el('div', 'content', 'Fetching…');
  changes.appendChild(status);

  fetchBoth(function(left, right, assets) {
    status.textContent = 'Comparing…'

    if (left === null || right === null) {
      status.textContent = 'Whoops! Something went wrong.';
      status.classList.add('error');
      return;
    }

    // DEBUG
    window.left = left;
    window.right = right;

    var result = compare(left, right, assets);
    changes.innerHTML = '<div class="content hint">removals highlighted <span class=delete>red</span>; additions highlighted <span class=insert>green</span>';
    result.forEach(function(r) {
      changes.appendChild(r);
    });

    var footer = el('div', 'footer');
    footer.innerHTML = 'Uses <a href="//github.com/cemerick/jsdifflib">jsdifflib</a>';
    changes.appendChild(footer);
    scratchblocks.renderMatching('.blocks');
  });
}

function fetchBoth(cb) {
  var left;
  var right;
  var bothAssets = {};
  leftInput.fetch(function(project, assets) {
    left = project;
    Object.keys(assets).forEach(function(md5) {
      bothAssets[md5] = assets[md5];
    });
    if (right !== undefined) cb(left, right, bothAssets);
  });
  rightInput.fetch(function(project, assets) {
    right = project;
    Object.keys(assets).forEach(function(md5) {
      bothAssets[md5] = assets[md5];
    });
    if (left !== undefined) cb(left, right, bothAssets);
  });
};

function compare(left, right, assets) {
  var out = []

  // Use scratch-diff to, um, do the diff.
  var diff = scratch_diff(left, right)

  diff.forEach(sprite => {
    let [op, info] = sprite

    // TODO scratch-diff: Stage has no name
    // TODO scratch-diff: handle rename
    var s = makeSection(info.name);
    let section
    out.push(s.heading)
    out.push(section = s.section)

    if (op === ' ') {
      s.heading.removeChild(s.triangle);
      return
    }

    if (op !== '~') {
      var insert = op === '+'
      s.heading.classList.add(insert ? 'insert' : 'delete')
      //section.appendChild(el('p', 'content', insert ? '(new sprite)' : '(sprite deleted)'))
      s.heading.removeChild(s.triangle);
      return
    }

    if (info.costumes) {
      var b = renderCostumes(info.costumes, assets)
      section.appendChild(b.heading)
      section.appendChild(b.section)
    }

    if (info.sounds) {
      var b = renderSounds(info.sounds, assets)
      section.appendChild(b.heading)
      section.appendChild(b.section)
    }

    if (info.scripts) {
      var b = renderScripts(info.scripts)
      section.appendChild(b.heading);
      section.appendChild(b.section);
    }
  })

  return out;
}

function renderCostumes(diff, assets) {
  return renderMedia({
    title: 'Costumes',
    kind: 'costumes',
    diff: diff,
    render(info) {
      var icon = el('img', null)
      icon.src = /svg/.test(info.md5) ? 'data:image/svg+xml;utf8,' + assets[info.md5] : URL.createObjectURL(assets[info.md5])
      return icon
    },
  })
}

function renderSounds(diff, assets) {
  return renderMedia({
    title: 'Sounds',
    kind: 'sounds',
    diff: diff,
    render(info) {
      var audio = el('audio', null)
      audio.src = assetURL(info.md5)
      audio.controls = true
      return audio
    },
  })
}

function getKeyRecursive(which) {
  return function getKey(obj) {
    if (typeof obj !== 'object') {
      return obj
    }

    if (obj[which]) {
      return obj[which]
    }

    if (isArray(obj)) {
      if (isArray(obj[0]) && isOp(obj[0][0])) {
        let out = []
        obj.forEach(item => {
          let [op, value] = item
          if (op === '+' && which === '__old') return
          if (op === '-' && which === '__new') return
          out.push(getKey(value))
        })
        return out
      }
      return obj.map(x => getKey(x))
    }

    var old = {}
    for (var key in obj) {
      old[key] = getKey(obj[key])
    }
    return old
  }
}
let getOld = getKeyRecursive('__old')
let getNew = getKeyRecursive('__new')


function renderMedia(props) {
  var b = makeSubSection(props.title)
  var result = el('div', props.kind)
  b.content.appendChild(result)

  function append(op, info) {
    var icon = props.render(info)

    var link = el('a', null);
    link.href = assetURL(info.md5)
    link.appendChild(icon);

    result.appendChild(el('div', op + ' media', null, [
      link,
      el('div', 'name', info.name),
    ]));
  }

  function skip() {
    result.appendChild(el('div', 'media unchanged', null))
  }

  props.diff.forEach(media => {
    let [op, info] = media
    // TODO group ~'s
    if (op === '~') {
      append('delete', getOld(info))
      append('insert', getNew(info))
    } else if (op === ' ') {
      // TODO render unchanged images?
      skip()
    } else {
      append(op === '+' ? 'insert' : 'delete', info)
    }
  })

  return b
}

function annotate(o, y, draw) {
  switch (o.constructor) {
    case scratchblocks.Block:
      if (o.op) {
        draw(o, y)
      }
      o.children.forEach(child => {
        if (child.constructor === scratchblocks.Script) {
          if (isNaN(child.y)) throw 'ohno'
          annotate(child, y + child.y, draw)
        }
      })
      break
    case scratchblocks.Script:
      // TODO highlight?
      if (isNaN(o.y)) throw 'ohno'
      y += o.y
      o.blocks.forEach(block => {
        annotate(block, y, draw)
        y += block.height
      })
      break
    case scratchblocks.Document:
      o.scripts.forEach(script => annotate(script, 0, draw))
      break
  }
}

let SVG = {
  el(name, props) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (name === 'svg') {
      // explicit set namespace, see https://github.com/jindw/xmldom/issues/97
      el.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      el.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    }
    return SVG.setProps(el, props);
  },
  directProps: {
    textContent: true,
  },
  setProps(el, props) {
    for (var key in props) {
      var value = '' + props[key];
      if (SVG.directProps[key]) {
        el[key] = value;
      } else if (props[key] !== null && props.hasOwnProperty(key)) {
        el.setAttribute(key, value);
      }
    }
    return el;
  },
  rect(w, h, props) {
    return SVG.el('rect', Object.assign({}, props, {
      x: 0,
      y: 0,
      width: w,
      height: h,
    }));
  },
  move(dx, dy, el) {
    SVG.setProps(el, {
      transform: ['translate(', dx, ' ', dy, ')'].join(''),
    });
    return el;
  },
}

function makeBlock(op, json) {
  let lang = scratchblocks.allLanguages.en
  let block = scratchblocks.Block.fromJSON(lang, json)
  block.op = op
  // TODO might need to remove stacks here.
  return block
}

function makeScript(op, json) {
  let lang = scratchblocks.allLanguages.en
  let script = scratchblocks.Script.fromJSON(lang, json)
  script.op = op
  return script
}

function scratchblocksFromDiff(diff) {

  function fromBlock(block, push) {
    // straight-up replace? selector changed?
    if (block.__old || block[0][0] !== ' ') {
      push(makeBlock('-', getOld(block)))
      push(makeBlock('+', getNew(block)))
      return
    }

    var children = block.map(item => item[1])
    var hasStacks = children.some(isStack)
    var stackAdjust = block.some(item => {
      return (item[0] === '+' || item[0] === '-') && isStack(item[1])
    })

    // TODO using isStack on ops does not work!
    var argsModified = block.some(item => {
      return !isStack(item[1]) && item[0] !== ' '
    })
    var args = block.filter(item => !isStack(item[1]))

    if (hasStacks) {
      if (stackAdjust) {
        // TODO panic
        throw 'oh no'
      }

      var stacks = []
      block.forEach(item => {
        let [op, script] = item
        if (isStack(script)) {
          stacks.push(op === ' ' ? makeScript(null, script) : fromScript(script))
        }
      }) 

      if (argsModified) {
        // pop the stacks first.
        push(makeBlock('-', getOld(args)))
        b = makeBlock('+first', getNew(args))
      } else {
        b = makeBlock(null, getNew(args))
      }
      for (var i=0; i<b.children.length; i++) {
        if (b.children[i].isScript) {
          b.children[i] = stacks.shift()
        }
      }
      push(b)

    } else {
      push(makeBlock('-', getOld(block)))
      push(makeBlock('+', getNew(block)))
    }
  }

  function fromScript(script) {
    if (!(isArray(script) && isArray(script[0]) && isOp(script[0][0]))) throw new Error('not a script')
    let blocks = []

    if (script.__old) {
      throw 'todo'
      // getOld(script).forEach() {
      // }
    }

    script.forEach(item => {
      let [op, block] = item
      if (op === '~') {
        fromBlock(block, x => blocks.push(x))
      } else {
        blocks.push(makeBlock(op, block))
      }
    })

    return new scratchblocks.Script(blocks)
  }

  return new scratchblocks.Document([fromScript(diff)])
}

function renderScripts(diff) {
  var b = makeSubSection('Scripts')
  var result = el('div', 'scripts')
  b.content.appendChild(result)

  diff.forEach(item => {
    let [op, script] = item
    if (op === ' ') return

    // add/remove entire scripts
    if (op === '+' || op === '-') {
      // TODO
      return
    }

    // script modified
    console.log(script)
    var doc = scratchblocksFromDiff(script)
    doc.render(svg => {
      let w = doc.width

      annotate(doc, 0, (block, y) => {
        let op = block.op
        if (!op || op === ' ') return

        let h = /first/.test(op) ? 30 : block.height // TODO 30 is a hack
        let class_ = op[0] === '+' ? 'insert' : op[0] === '-' ? 'delete' : 'unknown'

        var below = SVG.move(0, y, SVG.rect(w, h, {
          class: class_ + ' below',
        }))
        svg.insertBefore(below, svg.children[1])

        var above = SVG.move(0, y, SVG.rect(w, h, {
          class: class_ + ' above',
        }))
        svg.appendChild(above)
      })

      b.content.appendChild(svg)
    })
  })

  return b
}

