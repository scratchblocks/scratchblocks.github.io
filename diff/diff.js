
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

function makeSection(big, text) {
  var triangle = el('span', 'disclosure-triangle', '▼');
  var heading = el(big ? 'h2' : 'h3', null, null, [
    triangle,
    document.createTextNode(text),
  ]);
  var section = el('closeable');
  heading.addEventListener('click', function() {
    triangle.classList.toggle('closed');
    section.classList.toggle('closed');
  });
  if (!big) {
    var content = el('content');
    section.appendChild(content);
  }
  return {
    heading: heading,
    triangle: triangle,
    section: section,
    content: content || section,
  };
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
          myself.get(url, 'blob', function(data) {
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
  return "http://assets.scratch.mit.edu/internalapi/asset/" + md5 + "/get/";
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
    changes.innerHTML = '<div class="content hint">Additions highlighted <span class=insert>green</span>, removals highlighted <span class=delete>red</span>.';
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
  var result = [];

  function getSprites(project) {
    var sprites = {};
    sprites['Stage'] = project;
    project.children.forEach(function(child) {
      if (child.objName && child.scripts) {
        sprites[child.objName] = child;
      }
    });
    return sprites;
  }
  var leftSprites = getSprites(left);
  var rightSprites = getSprites(right);

  var spriteNames = Object.keys(leftSprites);
  Object.keys(rightSprites).forEach(function(name) {
    if (spriteNames.indexOf(name) === -1) spriteNames.push(name);
  });

  spriteNames.forEach(function(name) {
    var s = makeSection(true, name);
    var section = s.section;
    result.push(s.heading);
    result.push(s.section);
    var different = false;

    var leftObj = leftSprites[name];
    var rightObj = rightSprites[name];

    if (!leftObj) {
      s.heading.classList.add('insert');
    } else if (!rightObj) {
      s.heading.classList.add('delete');
    } 

    var costumes = compareMedia('costumes', leftObj, rightObj, assets);
    if (costumes) {
      var b = makeSection(false, 'Costumes');
      b.content.appendChild(costumes);
      s.content.appendChild(b.heading);
      s.content.appendChild(b.section);
      different = true;
    }

    var sounds = compareMedia('sounds', leftObj, rightObj, assets);
    if (sounds) {
      var b = makeSection(false, 'Sounds');
      b.content.appendChild(sounds);
      s.content.appendChild(b.heading);
      s.content.appendChild(b.section);
      different = true;
    }

    var blocks = compareScripts(leftObj, rightObj);
    if (blocks) {
      var b = makeSection(false, 'Scripts');
      //b.content.appendChild(blocks);
      s.content.appendChild(b.heading);
      s.content.appendChild(b.section);
      different = true;
    }

    if (!different) {
      s.heading.removeChild(s.triangle);
    }
  });

  return result;
}

function compareMedia(kind, leftChild, rightChild, assets) {
  function dump(child) {
    if (!child || !child[kind]) return [];
    return child[kind].map(function(media) {
      return {
        md5: media.md5 || media.baseLayerMD5,
        name: media.costumeName || media.soundName,
      };
    });
  }

  var leftSeq = dump(leftChild);
  var rightSeq = dump(rightChild);

  var result = el('div', kind);

  var ops = diff(leftSeq, rightSeq);
  if (!ops.length) return;
  if (ops.length === 1 && ops[0].type == 'equal') return;

  ops.forEach(function(op) {
    console.log(op);
    op.range.forEach(function(media) {
      if (kind === 'costumes') {
        var icon = el('img', null);
        icon.src = URL.createObjectURL(assets[media.md5]);
      } else if (kind === 'sounds') {
        var icon = el('div', 'play-button', '▶');
        icon.addEventListener('click', function(event) {
          console.log(assets[media.md5]);
        });
      }
      var link = el('a', null);
      link.href = assetURL(media.md5);
      link.appendChild(icon);

      result.appendChild(el('div', op.type + ' media', null, [
        link,
        el('div', 'name', media.name),
      ]));
    });
  });

  return result;
  //if (result.children) return result;
}

function diff(left, right) {
  var sm = new difflib.SequenceMatcher(left, right);
  // TODO

  var ops = [];
  sm.get_opcodes().forEach(function(opcode) {
    var type = opcode[0],
        lStart = opcode[1],
        lEnd = opcode[2],
        rStart = opcode[3],
        rEnd = opcode[4];
    switch (type) {
      case 'replace':
        ops.push({
          type: 'delete',
          range: left.slice(lStart, lEnd),
        });
        ops.push({
          type: 'insert',
          range: right.slice(rStart, rEnd),
        });
        break;
      case 'delete':
        ops.push({
          type: type,
          range: left.slice(lStart, lEnd),
        });
        break;
      case 'insert':
      case 'equal':
        ops.push({
          type: type,
          range: right.slice(rStart, rEnd),
        });
        break;
    }
  });

  return ops;
}

function compareScripts(leftChild, rightChild) {

  var left = (leftChild.scripts || []).map(function(array) { return array[2]; });
  var right = (rightChild.scripts || []).map(function(array) { return array[2]; });

  //return diffScripts(left, right);
}

function diffScripts(left, right) {
  var pairs = [];
  for (var i=0; i<left.length; i++) {
    var a = left[i];
    for (var j=0; j<right.length; j++) {
      var b = right[j];
      var result = diffSeq(a, b);
      pairs.append({
        score: result.score, 
        left: a,
        right: b,
        result: reuslt,
      });
    }
  }

  // sort lowest score first
  pairs.sort(function(a, b) {
    return a.score - b.score;
  });

  var out = [];
  var left = left.slice();
  var right = right.slice();
  for (var i=0; i<pairs.length; i++) {
    var pair = pairs[i];
    if (left.indexOf(pair.left) === -1) continue;
    if (right.indexOf(pair.right) === -1) continue;
    left.splice(left.indexOf(pair.left), 1);
    right.splice(right.indexOf(pair.right), 1);
    out.push(pair.result);
  }
  return out;
}

function diffSeq(left, right) {
  var matrix = [];
  var lastRow = [];
  for (var i=0; i<left.length; i++) {
    for (var j=0; j<left.length; j++) {
    }
  }

  return op;
}

function diffBlock() {
}




