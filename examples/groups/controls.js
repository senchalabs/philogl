function initControls(options) {
  var currentGroup = $('current-group'),
      scale = $('scale'),
      rotate = $('rotate'),
      aura = $('aura'),
      offset = $('offset'),
      hyperbole = $('hyperbole'),
      descriptions = $$('#group-descriptions > div'),
      descriptionContainer = $1('.options-body.details'),
      buttonChange = $1('button.pattern-change'),
      buttonSave = $1('button.pattern-save');

  //initCodeEditor(buttonChange, buttonSave);

  currentGroup.addEventListener('change', function() {
    options.currentGroupIndex = this.selectedIndex;
    setGroupDescription(this.selectedIndex);
  }, false);

  scale.addEventListener('change', function() {
    options.scale = +this.value;
  }, false);

  rotate.addEventListener('change', function() {
    options.rotate = +this.value * Math.PI / 180;
  }, false);

  aura.addEventListener('change', function() {
    options.radialFactor = +this.value;
  }, false);

  offset.addEventListener('change', function() {
    options.offset = +this.value;
  }, false);

  hyperbole.addEventListener('change', function() {
    options.hyperbole = +this.value;
  }, false);

  //set first group description
  setGroupDescription(options.currentGroupIndex);

  function setGroupDescription(index) {
    var node = descriptionContainer.firstChild;
    if (node) {
      node.parentNode.removeChild(node);
    }
    node = descriptions[index].cloneNode(true);
    descriptionContainer.appendChild(node);
  }
}

function initCodeEditor(buttonChange) {
  var editor = CodeMirror(document.body, {
    mode: 'javascript',
    value: 'function canvasRender(some, arguments) { \nreturn something; \n}',
    lineNumbers: true,
    matchBrackets: true,
    indentWithTabs: true,
    tabSize: 4,
    indentUnit: 4,
    onChange: function () {
      console.log('change!', arguments);
    }
  }),
  wrapper = editor.getWrapperElement(),
  style = wrapper.style;

  style.visibility = 'visible';
  style.width = '500px';
  style.height = '300px';
  // style.display = 'none';

  buttonChange.addEventListener('click', function() {

  }, false);
}
