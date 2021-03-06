
  basis.require('basis.dom.computedStyle');


 /**
  * @namespace basis.layout
  */

  var namespace = this.path;


  //
  // import names
  //

  var document = global.document;
  var documentElement = document.documentElement;
  var computedStyle = basis.dom.computedStyle.get;


  //
  // Main part
  //

  function getOffsetParent(node){
    var offsetParent = node.offsetParent || documentElement;

    while (offsetParent && offsetParent !== documentElement && computedStyle(offsetParent, 'position') == 'static')
      offsetParent = offsetParent.offsetParent;

    return offsetParent || documentElement;
  }

  function getPageOffset(){
    var top = 0;
    var left = 0;

    if (document.compatMode == 'CSS1Compat')
    {
      top = global.pageYOffset || documentElement.scrollTop;
      left = global.pageXOffset || documentElement.scrollLeft;
    }
    else
    {
      // IE6 and lower
      var body = document.body;
      if (element !== body)
      {
        top = body.scrollTop - body.clientTop;
        left = body.scrollLeft - body.clientLeft;
      }
    }

    return {
      x: left,
      y: top
    };
  }

  function getTopLeftPoint(element){
    var left = 0;
    var top = 0;

    if (element && element.getBoundingClientRect)
    {
      var box = element.getBoundingClientRect();
      var offset = getPageOffset();

      top = box.top + offset.y;
      left = box.left + offset.x;
    }

    return {
      top: top,
      left: left
    };
  }

  function getBoundingRect(element, relElement){
    var top = 0;
    var left = 0;
    var right = 0;
    var bottom = 0;

    if (element && element.getBoundingClientRect)
    {
      var rect = element.getBoundingClientRect();
      var offset;

      // coords relative of relElement
      if (relElement && relElement.getBoundingClientRect)
      {
        var relRect = relElement.getBoundingClientRect();
        offset = {
          x: -relRect.left,
          y: -relRect.top
        };
      }
      else
      {
        offset = getPageOffset();
      }

      top = rect.top + offset.y;
      left = rect.left + offset.x;
      right = rect.right + offset.x;
      bottom = rect.bottom + offset.y;
    }

    return {
      top: top,
      left: left,
      right: right,
      bottom: bottom,
      width: right - left,
      height: bottom - top
    };
  }

  function getViewportRect(element){
    var point = getTopLeftPoint(element);
    var top = point.top + element.clientTop;
    var left = point.left + element.clientLeft;
    var width = element.clientWidth;
    var height = element.clientHeight;

    return {
      top: top,
      left: left,
      bottom: top + height,
      right: left + width,
      width: width,
      height: height
    };
  }


  //
  // export names
  //

  module.exports = {
    getOffsetParent: getOffsetParent,
    getTopLeftPoint: getTopLeftPoint,
    getBoundingRect: getBoundingRect,
    getViewportRect: getViewportRect
  };
