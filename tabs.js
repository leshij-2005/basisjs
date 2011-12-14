/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * @copyright
 * Copyright (c) 2006-2011 Roman Dvornov.
 *
 * @license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

  (function(){

   /**
    * @namespace Basis.Controls.Tabs
    */

    var namespace = 'Basis.Controls.Tabs';

    // import names

    var Class = Basis.Class;
    var DOM = Basis.DOM;

    var Template = Basis.Html.Template;
    var cssClass = Basis.CSS.cssClass;
    var getter = Function.getter;

    var nsWrappers = DOM.Wrapper;

    //
    //  behaviour handlers
    //

    function baseSelectHandler(child){
      if (this.selection && !this.selection.itemCount)
        child.select();
    }

    function baseUnselectHandler(){
      if (this.selection && !this.selection.itemCount)
      {
        // select first non-disabled child
        var node = this.childNodes.search(false, 'disabled');
        if (node)
          node.select();
      }
    }

    //
    //  Pages Controls prototype
    //

   /**
    * @class
    */
    var AbstractTabsControl = Class(nsWrappers.HtmlControl, {
      className: namespace + '.AbstractTabsControl',

      canHaveChildren: true,
      childClass: nsWrappers.HtmlNode,

      behaviour: {
        childEnabled: baseSelectHandler,
        childDisabled: baseUnselectHandler,
        childNodesModified: baseUnselectHandler
      },

      //
      //  common methods
      //
      item: function(indexOrName){
        var index = isNaN(indexOrName) ? this.indexOf(indexOrName) : parseInt(indexOrName);
        return index.between(0, this.childNodes.length - 1) ? this.childNodes[index] : null;
      },
      indexOf: function(objectOrName){
        // search for object
        if (objectOrName instanceof this.childClass)
          return this.childNodes.indexOf(objectOrName);

        // search by name
        if (this.childNodes.search(objectOrName, 'name'))
          return Array.lastSearchIndex;

        return -1;
      }
    });

    //
    // Tab node
    //

    function tabCaptionFormat(value){ 
      return value == null || value == '' ? '[no title]' : value;
    };

   /**
    * @class
    */
    var Tab = Class(nsWrappers.HtmlContainer, {
      className: namespace + '.Tab',

      canHaveChildren: false,

      behaviour: {
        disable: function(){ 
          this.inherit();

          this.unselect();
          if (this.document)
            this.document.dispatch('childDisabled', this);
        },
        enable: function(){ 
          this.inherit();

          if (this.document)
            this.document.dispatch('childEnabled', this);
        },
        click: function(event){
          if (!this.isDisabled())
            this.select();
        },
        update: function(node, delta){
          this.inherit(node, delta);

          // set new title
          this.titleText.nodeValue = tabCaptionFormat(this.titleGetter(this));
        }
      },

      template: new Template(
        '<div{element|selectedElement} class="Basis-Tab">' +
          '<span class="Basis-Tab-Start"/>' +
          '<span class="Basis-Tab-Content">' +
            '<span{content} class="Basis-Tab-Caption">' +
              '{titleText}' +
            '</span>' +
          '</span>' + 
          '<span class="Basis-Tab-End"/>' +
        '</div>'
      ),

     /**
      * Using to fetch title value.
      * @property {function(node)}
      */
      titleGetter: getter('info.title'),
      
     /**
      * Using for tab default grouping.
      * @property {number}
      */
      groupId: 0,

      init: function(config){
        if (config)
        {
          // add name if exists
          if (config.name != '')
            this.name = config.name;

          // add groupId if exists
          if (config.groupId != '')
            this.groupId = config.groupId;

          if (config.content)
          {
            config = Object.complete({}, config);
            delete config.content;
          }
        }

        // inherit
        this.inherit(config);
      }
    });

    //
    // Tabs control
    //

   /**
    * @class
    */
    var TabsGroupControl = Class(nsWrappers.HtmlGroupControl, {
      childClass: Class(nsWrappers.HtmlPartitionNode, {
        template: new Template(
          '<div{element|content|childNodesElement} class="Basis-TabControl-TabGroup"></div>'
        )
      })
    });

   /**
    * @class
    */
    var TabControl = Class(AbstractTabsControl, {
      className: namespace + '.TabControl',

      childClass: Tab,
      groupControlClass: TabsGroupControl,

      template: new Template(
        '<div{element} class="Basis-TabControl">' +
          '<div class="Basis-TabControl-Start"/>' +
          '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
          '<div class="Basis-TabControl-End"/>' +
        '</div>'
      ),

      init: function(config){
        // create control
        this.inherit(config);

        // add event listners
        this.addEventListener('click', 'click', true);
      }

      /* no custom destructor actions */

    });

    //
    //  Page Node
    //

   /**
    * @class
    */
    var Page = Class(nsWrappers.HtmlContainer, {
      className: namespace + '.Page',

      canHaveChildren: true,

      behaviour: {
        select: function(){
          cssClass(this.element).remove('Basis-Page-Hidden');
          this.inherit();
        },
        unselect: function(){
          cssClass(this.element).add('Basis-Page-Hidden');
          this.inherit();
        }
      },
      
      template: new Template(
        '<div{element} class="Basis-Page Basis-Page-Hidden">' + 
          '<div{content|childNodesElement} class="Basis-Page-Content"/>' +
        '</div>'
      ),

      init: function(config){
        // add name if exists
        if (config && config.name != '')
          this.name = config.name;

        this.inherit(config);
      }
    });

    //
    //  Page Control
    //

   /**
    * @class
    */
    var PageControl = Class(AbstractTabsControl, {
      className: namespace + '.PageControl',

      childClass: Page,
      
      template: new Template(
        '<div{element|content|childNodesElement} class="Basis-PageControl"/>'
      )
    });

    //
    //  TabSheet Node
    //

   /**
    * @class
    */
    var TabSheet = Class(Tab, {
      className: namespace + '.TabSheet',

      canHaveChildren: true,
      childClass: nsWrappers.HtmlNode,

      behaviour: {
        select: function(){
          this.inherit();
          cssClass(this.pageElement).remove('Basis-Page-Hidden');
        },
        unselect: function(){
          this.inherit();
          cssClass(this.pageElement).add('Basis-Page-Hidden');
        }
      },
      
      template: new Template(
        '<div{element|selectedElement} class="Basis-TabSheet">' +
          '<div{tabElement} class="Basis-Tab">' +
            '<span class="Basis-Tab-Start"/>' +
            '<span class="Basis-Tab-Content">' +
              '<span{content} class="Basis-Tab-Caption">' +
                '{titleText}' +
              '</span>' +
            '</span>' + 
            '<span class="Basis-Tab-End"/>' +
          '</div>' +
          '<div{pageElement} class="Basis-Page Basis-Page-Hidden">' +
            '<div{pageContent|childNodesElement} class="Basis-Page-Content"/>' +
          '</div>' +
        '</div>'
      ),

      init: function(config){
        var content;
        if (config && config.content)
        {
          config = Object.complete({}, config);
          content = config.content;
          delete config.content;
        }

        this.inherit(config);

        if (content)
          DOM.insert(this.pageContent, content);
      },
      destroy: function(){
        DOM.remove(this.pageElement);
        this.inherit();
      }
    });

    //
    // AccordionControl
    //

   /**
    * @class
    */
    var AccordionControl = Class(TabControl, {
      className: namespace + '.AccordionControl',

      childClass: TabSheet,
      
      template: new Template(
        '<div{element|content} class="Basis-AccordionControl">' +
          '<div{content|childNodesElement} class="Basis-AccordionControl-Content"/>' +
        '</div>'
      )
    });

    //
    //  TabSheetControl
    //

   /**
    * @class
    */
    var TabSheetControl = Class(TabControl, {
      className: namespace + '.TabSheetControl',

      childClass: TabSheet,
      
      template: new Template(
        '<div{element|content} class="Basis-TabSheetControl">' +
          '<div{tabsElement} class="Basis-TabControl">' +
            '<div class="Basis-TabControl-Start"/>' +
            '<div{content|childNodesElement} class="Basis-TabControl-Content"/>' +
            '<div class="Basis-TabControl-End"/>' +
          '</div>' +
          '<div{pagesElement} class="Basis-PageControl"/>' +
        '</div>'
      ),

      insertBefore: function(newChild, refChild){
        if (newChild = this.inherit(newChild, refChild))
        {
          if (this.pagesElement)
            this.pagesElement.insertBefore(newChild.pageElement, this.nextSibling ? this.nextSibling.pageElement : null)

          return newChild;
        }
      },
      removeChild: function(oldChild){
      	if (oldChild = this.inherit(oldChild))
        {
          if (this.pagesElement)
            oldChild.element.appendChild(oldChild.pageElement);

          return oldChild;
        }
      },
      clear: function(){
        // put pageElement back to TabSheet root element
        this.childNodes.forEach(function(tabsheet){
          tabsheet.element.appendChild(tabsheet.pageElement);
        });

        this.inherit();
      }
    });

    //
    // 
    //

    Basis.namespace(namespace).extend({
      AbstractTabsControl: AbstractTabsControl,

      TabControl: TabControl,
      Tab: Tab,

      PageControl: PageControl,
      Page: Page,
      
      AccordionControl: AccordionControl,
      TabSheetControl: TabSheetControl,
      TabSheet: TabSheet
    });

  })();