/*!
 * Basis javascript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2012 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  basis.require('basis.event');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.ui');


 /**
  * This namespace contains {basis.ui.tree.Tree} control class and it's
  * child nodes classes. There are two base child classes for tree
  * {basis.ui.tree.Node} and {basis.ui.tree.Folder}.
  *
  * The main difference between this classes is that
  * {basis.ui.tree.Node} has abstact {basis.ui.tree.Node#expand}
  * and {basis.ui.tree.Node#collapse} methods and can't be
  * collapsed/expanded, but {basis.ui.tree.Folder} can.
  *
  * Also this namespace has two additional classes for child nodes grouping
  * {basis.ui.tree.GroupingNode} and
  * {basis.ui.tree.PartitionNode}.
  *
  * Most part of component logic implemented in {basis.dom.wrapper} namespace,
  * and this one just contains templates and collapse/expand implementation.
  *
  * @see ./test/speed-tree.html
  * @see ./demo/data/entity.html
  *
  * @namespace basis.ui.tree
  */

  var namespace = this.path;


  //
  // import names
  //

  var Class = basis.Class;
  var DOM = basis.dom;
  var Event = basis.dom.event;

  var getter = Function.getter;
  var createEvent = basis.event.create;

  var UIContainer = basis.ui.Container;
  var UIPartitionNode = basis.ui.PartitionNode;
  var UIGroupingNode = basis.ui.GroupingNode;


  //
  // main part
  //

  function expand(node){
    if (typeof node.expand == 'function')
      node.expand();
  }

  function collapse(node){
    if (typeof node.collapse == 'function')
      node.collapse();
  }

  var ExpandCollapseMixin = {
   /**
    * Expand all descendant nodes.
    */
    expandAll: function(){
      DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, expand);
    },

   /**
    * Collapse all descendant nodes.
    */
    collapseAll: function(){
      DOM.axis(this, DOM.AXIS_DESCENDANT_OR_SELF, collapse);
    },

    expand: Function(),
    collapse: Function(),
    toggle: Function()
  };

 /**
  * Here is an example for tree recursive childFactory
  */
  /*function treeChildFactory(config){
    if (config.childNodes)
      return new Folder(Object.complete({ childFactory: this.childFactory }, config));
    else
      return new Node(config);
  }*/

 /**
  * @class
  */
  var PartitionNode = Class(UIPartitionNode, {
    className: namespace + '.PartitionNode',

    template: resource('templates/tree/PartitionNode.tmpl')
  });

 /**
  * @class
  */
  var GroupingNode = Class(UIGroupingNode, {
    className: namespace + '.GroupingNode',

    childClass: PartitionNode
  });

 /**
  * Base child class for {basis.ui.tree.Tree}
  * @class
  */
  var Node = Class(UIContainer, ExpandCollapseMixin, {
    className: namespace + '.Node',

   /**
    * @inheritDoc
    */
    childClass: null,

   /**
    * @inheritDoc
    */
    childFactory: null,

    event_collapse: createEvent('collapse'),
    event_expand: createEvent('expand'),

   /**
    * Template for node element. 
    * @type {basis.template.Template}
    * @private
    */
    template: resource('templates/tree/Node.tmpl'),

    binding: {
      title: 'data:title || "[no title]"',
      collapsed: {
        events: 'expand collapse',
        getter: function(node){
          return node.collapsed ? 'collapsed' : '';
        }
      }
    },

   /**
    * @inheritDoc
    */
    action: {
      select: function(event){
        if (!this.isDisabled())
          this.select(Event(event).ctrlKey);
      },
      toggle: function(event){
        this.toggle();
      }
    }
  });

 /**
  * Base child class for {basis.ui.tree.Tree} that can has children.
  * @class
  * @extends {basis.ui.tree.Node}
  */
  var Folder = Class(Node, {
    className: namespace + '.Folder',

   /**
    * @inheritDoc
    */
    childClass: Node,

   /**
    * @inheritDoc
    */
    groupingClass: GroupingNode,

   /**
    * Template for node element. 
    * @type {basis.template.Template}
    * @private
    */
    template: resource('templates/tree/Folder.tmpl'),

   /**
    * @type {boolean}
    */
    collapsable: true,

   /**
    * @type {boolean}
    */
    collapsed: false,

   /**
    * @param {Object} config
    * @config {boolean} collapsable
    * @config {boolean} collapsed
    * @constructor
    */
    init: function(config){
      // inherit
      Node.prototype.init.call(this, config);

      if (this.collapsed && this.collapsable)
        this.event_collapse();
    },

   /**
    * Makes child nodes visible.
    * @return {boolean} Returns true if node was expanded.
    */
    expand: function(){
      if (this.collapsed)
      {
        this.collapsed = false;
        this.event_expand();

        return true;
      }
    },

   /**
    * Makes child nodes invisible.
    * @return {boolean} Returns true if node was collpased.
    */
    collapse: function(){
      if (!this.collapsed && this.collapsable)
      {
        this.collapsed = true;
        this.event_collapse();

        return true;
      }
    },

   /**
    * Inverts node collapsed state. If node was collapsed expand it, otherwise collapse it.
    */
    toggle: function(){
      this.collapsed ? this.expand() : this.collapse();
    }
  });

 /**
  * @class
  */
  var Tree = Class(UIContainer, ExpandCollapseMixin, {
    className: namespace + '.Tree',

   /**
    * @inheritDoc
    */
    selection: true,

   /**
    * Template for node element. 
    * @type {basis.template.Template}
    * @private
    */
    template: resource('templates/tree/Tree.tmpl'),

   /**
    * @inheritDoc
    */
    childClass: Node,

   /**
    * @inheritDoc
    */
    groupingClass: GroupingNode
  });


  //
  // export names
  //

  module.exports = {
    Tree: Tree,
    Node: Node,
    Folder: Folder,
    GroupingNode: GroupingNode,
    PartitionNode: PartitionNode
  };
