module.exports = {
  name: 'basis.dom.wrapper',

  init: function(){
    basis.require('basis.dom');
    basis.require('basis.dom.wrapper');

    var Class = basis.Class;
    var DOM = basis.dom;

    var nsWrappers = basis.dom.wrapper;
    var Node = basis.dom.wrapper.Node;
    Node.extend({
      listen: basis.object.extend({
        parentNode: {},
        childNode: {},
        satellite: {},
        owner: {}
      }, Node.prototype.listen)
    });

    var domHelpers = basis.require('./helpers/dom_wrapper_node.js');
    var checkNode = domHelpers.checkNode;
    var getGroups = domHelpers.getGroups;

    var groupDatasetByGroupMap = {};
    var groupDatasetByGroup10 = new basis.data.Dataset({
      items: basis.array.create(10, function(idx){
        return groupDatasetByGroupMap[idx + 1] = new basis.data.Object({
          data: {
            id: idx + 1,
            title: idx + 1
          }
        });
      })
    });
    var groupDatasetByGroup = new basis.data.Dataset({
      items: basis.array.create(4, function(idx){
        return groupDatasetByGroupMap[idx + 1];
      })
    });


    var testSet = [
      { data: { title: 'node0', value: 0, group: 1 } },
      { data: { title: 'node1', value: 1, group: 2 } },
      { data: { title: 'node2', value: 2, group: 1 } },
      { data: { title: 'node3', value: 3, group: 3 } },
      { data: { title: 'node4', value: 4, group: 4 } },
      { data: { title: 'node5', value: 5, group: 2 } },
      { data: { title: 'node6', value: 6, group: 2 } },
      { data: { title: 'node7', value: 7, group: 1 } },
      { data: { title: 'node8', value: 8, group: 3 } },
      { data: { title: 'node9', value: 9, group: 1 } }
    ].map(function(item){
      item.data.groupObj = groupDatasetByGroupMap[item.data.group];
      return item;
    });

    var convertToNode = basis.getter(basis.fn.$self, testSet);

    function getTestSet(){
      return testSet.map(function(item){
        return {
          data: basis.object.slice(item.data)
        };
      });
    }

    function getDataset(){
      return new basis.data.Dataset({
        items: testSet.map(function(item){
          return new basis.data.Object({
            data: basis.object.slice(item.data)
          });
        })
      });
    }

    function nodeFactory(cfg){
      return new Node(cfg);
    };

    function checkDestroyedObject(object){
      var proto = object.constructor.prototype;
      var properties = [];

      for (var key in object)
      {
        var value = object[key];
        if (key !== 'data' && value !== proto[key] && typeof value == 'object' && value !== null)
          properties.push(key);
      }

      return properties.length
        ? 'properties are not reset in destroyed object: ' + properties.join(', ')
        : false;
    }

    function $values(ar){
      return ar.map(function(node){
        return node.data.value + '(' + node.data.group + ')';
      });
    }
  },

  test: [
    {
      name: 'basic',
      test: [
        {
          name: 'create',
          test: function(){
            var node = new Node();
            this.is(false, checkNode(node));

            var node = new Node({ data: { a: 1, b: 2 } });
            this.is({ a: 1, b: 2 }, node.data);
          }
        },
        {
          name: 'create with childNodes',
          test: function(){
            var testSet = getTestSet();
            var node = new Node({ childNodes: testSet.map(nodeFactory) });
            this.is(false, checkNode(node));
            this.is(testSet.length, node.childNodes.length);
            this.is($values(testSet), $values(node.childNodes));

            var testSet = getTestSet();
            var node = new Node({ childFactory: nodeFactory, childNodes: testSet });
            this.is(false, checkNode(node));
            this.is(testSet.length, node.childNodes.length);
            this.is($values(testSet), $values(node.childNodes));
          }
        },
        {
          name: 'appendChild',
          test: function(){
            var node = new Node();
            var testSet = getTestSet();
            for (var i = 0; i < testSet.length; i++)
              node.appendChild(new Node(testSet[i]));
            this.is(false, checkNode(node));
            this.is(testSet.length, node.childNodes.length);
            this.is($values(testSet), $values(node.childNodes));
          }
        },
        {
          name: 'insertBefore',
          test: function(){
            var testSet = getTestSet();
            var node = new Node();
            for (var i = 0; i < testSet.length; i++)
              node.insertBefore(new Node(testSet[i]));

            this.is(false, checkNode(node));
            this.is(testSet.length, node.childNodes.length);
            this.is($values(testSet), $values(node.childNodes));

            var testSet = getTestSet();
            var node = new Node();
            for (var i = 0; i < testSet.length; i++)
              node.insertBefore(new Node(testSet[i]), node.firstChild);

            this.is(false, checkNode(node));
            this.is(testSet.length, node.childNodes.length);
            this.is($values(testSet).reverse(), $values(node.childNodes));
          }
        },
        {
          name: 'DOM.insert',
          test: function(){
            var testSet = getTestSet();
            var node = new Node();
            DOM.insert(node, testSet.map(nodeFactory));
            this.is(false, checkNode(node));
            this.is(testSet.length, node.childNodes.length);
            this.is($values(testSet), $values(node.childNodes));

            var testSet = getTestSet();
            var node = new Node({ childFactory: nodeFactory });
            DOM.insert(node, testSet);
            this.is(false, checkNode(node));
            this.is(testSet.length, node.childNodes.length);
            this.is($values(testSet), $values(node.childNodes));
          }
        }
      ]
    },
    {
      name: 'Owner',
      test: [
        {
          name: 'drop owner on owner destroy',
          test: function(){
            var owner = new basis.dom.wrapper.Node();
            var node = new basis.dom.wrapper.Node({
              owner: owner
            });

            this.is(false, checkNode(node));
            this.is(false, checkNode(owner));
            this.is(true, node.owner === owner);

            owner.destroy();

            this.is(false, checkNode(node));
            this.is(false, checkNode(owner));
            this.is(null, node.owner);
          }
        }
      ]
    },
    {
      name: 'Satellite',
      test: [
        {
          name: 'switch owner (setSatellite)',
          test: function(){
            var ownerChangedCount = 0;
            var satellite = new basis.dom.wrapper.Node({
              handler: {
                ownerChanged: function(){
                  ownerChangedCount++;
                }
              }
            });
            var node1 = new basis.dom.wrapper.Node({
              satellite: {
                example: satellite
              }
            });
            var node2 = new basis.dom.wrapper.Node();

            this.is(false, checkNode(node1));
            this.is(false, checkNode(node2));
            this.is(false, checkNode(satellite));
            this.is(true, node1.satellite.example === satellite);
            this.is(true, node1.satellite.example.owner === node1);
            this.is(1, ownerChangedCount);

            var warn = basis.dev.warn;
            var warning = false;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node2.setSatellite('somename', node1.satellite.example);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node1));
            this.is(false, checkNode(node2));
            this.is(false, checkNode(satellite));
            this.is(false, warning);
            this.is(2, ownerChangedCount);
            this.is(true, node1.satellite.example === undefined);
            this.is(true, node2.satellite.somename === satellite);
            this.is(true, satellite.owner === node2);
          }
        },
        {
          name: 'switch owner (setOwner)',
          test: function(){
            var ownerChangedCount = 0;
            var satellite = new basis.dom.wrapper.Node({
              handler: {
                ownerChanged: function(){
                  ownerChangedCount++;
                }
              }
            });
            var node1 = new basis.dom.wrapper.Node({
              satellite: {
                example: satellite
              }
            });
            var node2 = new basis.dom.wrapper.Node();

            this.is(false, checkNode(node1));
            this.is(false, checkNode(node2));
            this.is(false, checkNode(satellite));
            this.is(true, node1.satellite.example === satellite);
            this.is(true, node1.satellite.example.owner === node1);
            this.is(1, ownerChangedCount);

            var warn = basis.dev.warn;
            var warning = false;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              satellite.setOwner(node2);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node1));
            this.is(false, checkNode(node2));
            this.is(false, checkNode(satellite));
            this.is(false, warning);
            this.is(2, ownerChangedCount);
            this.is(true, node1.satellite.example === undefined);
            this.is(true, satellite.owner === node2);
          }
        },
        {
          name: 'reset owner',
          test: function(){
            var satellite = new basis.dom.wrapper.Node();
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: satellite
              }
            });

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, satellite.owner === node);
            this.is(true, node.satellite.test === satellite);

            var warn = basis.dev.warn;
            var warning = false;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              satellite.setOwner();
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(false, warning);
            this.is(null, satellite.owner);
            this.is(undefined, node.satellite.test);
          }
        },
        {
          name: 'change satellite name on the same owner should not trigger ownerChanged event',
          test: function(){
            var ownerChangedEventCount = 0;
            var satelliteChangedEventCount = 0;
            var satellite = new basis.dom.wrapper.Node({
              handler: {
                ownerChanged: function(){
                  ownerChangedEventCount++;
                }
              }
            });
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: satellite
              },
              listen: {
                satellite: {
                  // just for add/remove listen
                }
              },
              handler: {
                satelliteChanged: function(){
                  satelliteChangedEventCount++;
                }
              }
            });

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, satellite.owner === node);
            this.is(true, node.satellite.test === satellite);
            this.is(1, satelliteChangedEventCount);
            this.is(1, ownerChangedEventCount);

            node.setSatellite('newName', satellite);
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, satellite.owner === node);
            this.is(undefined, node.satellite.test);
            this.is(true, node.satellite.newName === satellite);
            this.is(3, satelliteChangedEventCount);
            this.is(1, ownerChangedEventCount);
          }
        },
        {
          name: 'destroy satellite on owner destroy',
          test: function(){
            var satellite = new basis.dom.wrapper.Node();
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: satellite
              }
            });

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, satellite.owner === node);
            this.is(true, node.satellite.test === satellite);

            var satelliteDestroyed = false;
            satellite.addHandler({
              destroy: function(){
                satelliteDestroyed = true;
              }
            });

            node.destroy();

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, satelliteDestroyed);
            this.is(null, node.satellite);
            this.is(null, satellite.owner);
          }
        },
        {
          name: 'reset owner for objects that isn\'t a satellite',
          test: function(){
            var nodeDestroyed = false;
            var ownerDestroyed = false;
            var owner = new basis.dom.wrapper.Node({
              handler: {
                destroy: function(){
                  ownerDestroyed = true;
                }
              }
            });
            var node = new basis.dom.wrapper.Node({
              owner: owner,
              handler: {
                destroy: function(){
                  nodeDestroyed = true;
                }
              }
            });

            this.is(false, checkNode(node));
            this.is(false, checkNode(owner));
            this.is(true, node.owner === owner);

            owner.destroy();

            this.is(false, checkNode(node));
            this.is(false, checkNode(owner));
            this.is(false, nodeDestroyed);
            this.is(true, ownerDestroyed);
            this.is(null, node.owner);
          }
        },
        {
          name: 'auto-create satellite (empty config)',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {}
              }
            });

            this.is(false, checkNode(node));
            this.is(true, !!node.satellite.test);
            this.is(true, node.satellite.test instanceof basis.dom.wrapper.AbstractNode);
            this.is(true, node.satellite.test.owner === node);
            this.is(true, 'test' in node.satellite.__auto__);
          }
        },
        {
          name: 'auto-satellite with instance',
          test: function(){
            var satellite = new basis.dom.wrapper.Node();
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  instance: satellite
                }
              }
            });

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(true, node.satellite.test === satellite);
            this.is(true, node.satellite.test.owner === node);
          }
        },
        {
          name: 'auto-create satellite with existsIf',
          test: function(){
            // use existsIf config
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  existsIf: 'data.value'
                }
              }
            });

            // should not exists
            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);

            // should be created
            node.update({ value: true });
            this.is(false, checkNode(node));
            this.is(true, !!node.satellite.test);
            this.is(true, node.satellite.test instanceof basis.dom.wrapper.AbstractNode);
            this.is(true, node.satellite.test.owner === node);

            // should be destroyed
            var satelliteDestroyed = false;
            node.satellite.test.addHandler({
              destroy: function(){
                satelliteDestroyed = true;
              }
            });
            node.update({ value: false });
            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);
            this.is(true, satelliteDestroyed);
          }
        },
        {
          name: 'should be possible don\'t listen event by setting false/null/empty string/array to events setting',
          test: function(){
            // set null
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  events: null,
                  existsIf: 'data.value'
                }
              }
            });

            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);
            this.is(true, !node.handler && !node.handler);
            node.update({ value: true });
            this.is(undefined, node.satellite.test);

            // set false
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  events: false,
                  existsIf: 'data.value'
                }
              }
            });

            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);
            this.is(true, !node.handler);
            node.update({ value: true });
            this.is(undefined, node.satellite.test);

            // set empty string
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  events: '',
                  existsIf: 'data.value'
                }
              }
            });

            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);
            this.is(true, !node.handler);
            node.update({ value: true });
            this.is(undefined, node.satellite.test);

            // set empty array
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  events: [],
                  existsIf: 'data.value'
                }
              }
            });

            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);
            this.is(true, !node.handler);
            node.update({ value: true });
            this.is(undefined, node.satellite.test);
          }
        },
        {
          name: 'auto-create satellite with config',
          test: function(){
            // config as object
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  config: {
                    foo: 'bar'
                  }
                }
              }
            });

            this.is(false, checkNode(node));
            this.is(true, 'test' in node.satellite);
            this.is('bar', node.satellite.test.foo);

            // config as function
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  config: function(owner){
                    return {
                      ownerObjectId: owner.basisObjectId,
                      foo: 'bar'
                    };
                  }
                }
              }
            });

            this.is(false, checkNode(node));
            this.is(true, 'test' in node.satellite);
            this.is('bar', node.satellite.test.foo);
            this.is(node.basisObjectId, node.satellite.test.ownerObjectId);
          }
        },
        {
          name: 'auto-create satellite should be destroyed after satelliteChanged event on owner',
          test: function(){
            // use existsIf config
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  existsIf: 'data.value'
                }
              },
              data: {
                value: true
              }
            });

            // should be created
            this.is(false, checkNode(node));
            this.is(true, 'test' in node.satellite);

            var events = [];
            node.satellite.test.addHandler({
              destroy: function(){
                events.push('destroy');
              }
            });
            node.addHandler({
              satelliteChanged: function(){
                events.push('satelliteChanged');
              }
            });

            node.update({ value: false });
            this.is(false, checkNode(node));
            this.is(false, 'test' in node.satellite);
            this.is(['satelliteChanged', 'destroy'], events);
          }
        },
        {
          name: 'auto-satellite with instance and existsIf',
          test: function(){
            // use existsIf config
            var satelliteDestroyed = false;
            var satellite = new basis.dom.wrapper.Node({
              handler: {
                destroy: function(){
                  satelliteDestroyed = true;
                }
              }
            });
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  existsIf: 'data.value',
                  instance: satellite
                }
              }
            });

            // should not exists
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(false, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(undefined, node.satellite.test);
            this.is(false, satelliteDestroyed);

            // should be created
            node.update({ value: true });
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(true, node.satellite.test === satellite);
            this.is(true, satellite.owner === node);

            // should not be destroyed
            node.update({ value: false });
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(undefined, node.satellite.test);
            this.is(false, satelliteDestroyed);
            this.is(false, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(true, satellite.owner !== node);
          }
        },
        {
          name: 'auto-create satellite with delegate/dataSource',
          test: function(){
            // use existsIf config
            var delegate = new basis.data.Object;
            var dataSource = new basis.data.Dataset;
            var node = new basis.dom.wrapper.Node({
              _delegate: delegate,
              _dataSource: dataSource,
              satellite: {
                test: {
                  instanceOf: basis.dom.wrapper.Node,
                  delegate: '_delegate',
                  dataSource: '_dataSource'
                }
              }
            });

            var satellite = node.satellite.test;

            // should be created
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, satellite.delegate === delegate);
            this.is(true, satellite.dataSource === dataSource);
          }
        },
        {
          name: 'auto-create satellite should be created with delegate/dataSource (set delegate/dataSource before postInit – templateUpdate issue)',
          test: function(){
            // use existsIf config
            var delegate = new basis.data.Object;
            var dataSource = new basis.data.Dataset;
            var delegateSet = false;
            var delegateSetBeforePostInit = false;
            var dataSourceSet = false;
            var dataSourceSetBeforePostInit = false;
            var node = new basis.dom.wrapper.Node({
              _delegate: delegate,
              _dataSource: dataSource,
              satellite: {
                test: {
                  instanceOf: basis.dom.wrapper.Node.subclass({
                    handler: {
                      delegateChanged: function(){
                        delegateSet = true;
                      },
                      dataSourceChanged: function(){
                        dataSourceSet = true;
                      }
                    },
                    postInit: function(){
                      delegateSetBeforePostInit = delegateSet;
                      dataSourceSetBeforePostInit = dataSourceSet;
                      basis.dom.wrapper.Node.prototype.postInit.call(this);
                    }
                  }),
                  delegate: '_delegate',
                  dataSource: '_dataSource'
                }
              }
            });

            var satellite = node.satellite.test;

            // should be created
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, delegateSetBeforePostInit);
            this.is(true, dataSourceSetBeforePostInit);
            this.is(true, satellite.delegate === delegate);
            this.is(true, satellite.dataSource === dataSource);
          }
        },
        {
          name: 'auto-satellite with delegate/dataSource',
          test: function(){
            // use existsIf config
            var delegate = new basis.data.Object;
            var dataSource = new basis.data.Dataset;
            var node = new basis.dom.wrapper.Node({
              _delegate: delegate,
              _dataSource: dataSource,
              satellite: {
                test: {
                  instance: new basis.dom.wrapper.Node(),
                  delegate: '_delegate',
                  dataSource: '_dataSource'
                }
              }
            });

            var satellite = node.satellite.test;

            // should be created
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, satellite.delegate === delegate);
            this.is(true, satellite.dataSource === dataSource);
          }
        },
        {
          name: 'auto-satellite with delegate/dataSource and existsIf',
          test: function(){
            // use existsIf config
            var delegate = new basis.data.Object;
            var dataSource = new basis.data.Dataset;
            var satellite = new basis.dom.wrapper.Node();
            var node = new basis.dom.wrapper.Node({
              _delegate: delegate,
              _dataSource: dataSource,
              satellite: {
                test: {
                  existsIf: 'data.value',
                  instance: satellite,
                  delegate: '_delegate',
                  dataSource: '_dataSource'
                }
              }
            });

            // instance is not linked and delegate/dataSource is not set
            this.is(false, checkNode(node));
            this.is(false, 'test' in node.satellite);
            this.is(true, satellite.owner === null);
            this.is(true, satellite.delegate === null);
            this.is(true, satellite.dataSource === null);

            // set delegate/dataSource when instance in use
            node.update({ value: true });
            this.is(false, checkNode(node));
            this.is(true, 'test' in node.satellite);
            this.is(true, satellite.owner === node);
            this.is(true, satellite.delegate === delegate);
            this.is(true, satellite.dataSource === dataSource);

            // reset delegate/dataSource when instance not in use
            node.update({ value: false });
            this.is(false, checkNode(node));
            this.is(false, 'test' in node.satellite);
            this.is(true, satellite.owner === null);
            this.is(true, satellite.delegate === null);
            this.is(true, satellite.dataSource === null);
          }
        },
        {
          name: 'auto-satellite should unlink from it\'s owner on destroy',
          test: function(){
            // use existsIf config
            var satelliteDestroyed = false;
            var satellite = new basis.dom.wrapper.Node({
              handler: {
                destroy: function(){
                  satelliteDestroyed = true;
                }
              }
            });
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  instance: satellite
                }
              }
            });

            // should not exists
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(true, satellite.owner === node);
            this.is(false, satelliteDestroyed);

            // should unlink from owner
            satellite.destroy();
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(false, 'test' in node.satellite);
            this.is(false, 'test' in node.satellite.__auto__);
            this.is(true, satelliteDestroyed);
            this.is(true, satellite.owner === null);
          }
        },
        {
          name: 'non-used auto-satellite with existsIf should be destroyed on owner destroy',
          test: function(){
            // use existsIf config
            var satelliteDestroyed = false;
            var satellite = new basis.dom.wrapper.Node({
              handler: {
                destroy: function(){
                  satelliteDestroyed = true;
                }
              }
            });
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  existsIf: 'data.value',
                  instance: satellite
                }
              }
            });

            // should not exists
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(false, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(true, satellite.owner === null);
            this.is(false, satelliteDestroyed);

            // should unlink from owner
            satellite.destroy();
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(false, 'test' in node.satellite);
            this.is(false, 'test' in node.satellite.__auto__);
            this.is(true, satelliteDestroyed);
            this.is(true, satellite.owner === null);
          }
        },
        {
          name: 'non-used auto-satellite should be destroyed on owner destroy',
          test: function(){
            // use existsIf config
            var satelliteDestroyed = false;
            var satellite = new basis.dom.wrapper.Node({
              handler: {
                destroy: function(){
                  satelliteDestroyed = true;
                }
              }
            });
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  existsIf: 'data.value',
                  instance: satellite
                }
              }
            });

            // should not exists
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(false, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(true, satellite.owner === null);
            this.is(false, satelliteDestroyed);

            // should unlink from owner
            node.destroy();
            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, satelliteDestroyed);
            this.is(true, satellite.owner === null);
          }
        },
        {
          name: 'auto-create satellite with existsIf and custom events - events as string',
          test: function(){
            // events as string
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  events: 'stateChanged activeChanged',
                  existsIf: 'data.value'
                }
              }
            });

            // should not exists
            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);

            // should not be created (no changes on update event)
            node.update({ value: true });
            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);

            // should be created
            node.setState(basis.data.STATE.READY, '1');
            this.is(false, checkNode(node));
            this.is(true, !!node.satellite.test);
            this.is(true, node.satellite.test instanceof basis.dom.wrapper.AbstractNode);
            this.is(true, node.satellite.test.owner === node);

            // should not be destroyed (no changes on update event)
            var satelliteDestroyed = false;
            node.satellite.test.addHandler({
              destroy: function(){
                satelliteDestroyed = true;
              }
            });
            node.update({ value: false });
            this.is(false, checkNode(node));
            this.is(true, !!node.satellite.test);
            this.is(true, node.satellite.test.owner === node);

            // should be destroyed
            node.setActive(!node.active);
            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);
            this.is(true, satelliteDestroyed);

          }
        },
        {
          name: 'auto-create satellite with existsIf and custom events - events as array',
          test: function(){
            // events as array
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  events: ['stateChanged', 'activeChanged'],
                  existsIf: 'data.value'
                }
              }
            });

            // should not exists
            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);

            // should not be created (no changes on update event)
            node.update({ value: true });
            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);

            // should be created
            node.setState(basis.data.STATE.READY, '1');
            this.is(false, checkNode(node));
            this.is(true, !!node.satellite.test);
            this.is(true, node.satellite.test instanceof basis.dom.wrapper.AbstractNode);
            this.is(true, node.satellite.test.owner === node);

            // should not be destroyed (no changes on update event)
            var satelliteDestroyed = false;
            node.satellite.test.addHandler({
              destroy: function(){
                satelliteDestroyed = true;
              }
            });
            node.update({ value: false });
            this.is(false, checkNode(node));
            this.is(true, !!node.satellite.test);
            this.is(true, node.satellite.test.owner === node);

            // should be destroyed
            node.setActive(!node.active);
            this.is(false, checkNode(node));
            this.is(undefined, node.satellite.test);
            this.is(true, satelliteDestroyed);
          }
        },
        {
          name: 'auto-create satellite can be replaced, auto config should be dropped',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {}
              }
            });

            this.is(false, checkNode(node));
            this.is(true, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);

            var warn = basis.dev.warn;
            var warning = false;
            var satellite = node.satellite.test;
            var satelliteDestroyed = false;
            var newSatellite = new basis.dom.wrapper.AbstractNode;

            satellite.addHandler({
              destroy: function(){
                satelliteDestroyed = true;
              }
            });

            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node.setSatellite('test', newSatellite);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(false, warning); // should not be warning
            this.is(true, satelliteDestroyed);
            this.is(true, node.satellite.test === newSatellite);
            this.is(false, 'test' in node.satellite.__auto__);
          }
        },
        {
          name: 'auto-create satellite can be replaced (not created), auto-config should be dropped',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  existsIf: basis.fn.$false
                }
              }
            });

            this.is(false, checkNode(node));
            this.is(false, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);

            var warn = basis.dev.warn;
            var warning = false;
            var newSatellite = new basis.dom.wrapper.AbstractNode;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node.setSatellite('test', newSatellite);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(newSatellite));
            this.is(false, warning); // should be warning
            this.is(true, node.satellite.test === newSatellite);
            this.is(false, 'test' in node.satellite.__auto__);
          }
        },
        {
          name: 'dynamicaly set auto-create satellite (empty config)',
          test: function(){
            var satelliteChangedEventCount = 0;
            var node = new basis.dom.wrapper.Node({
             handler: {
                satelliteChanged: function(){
                  satelliteChangedEventCount++;
                }
              }
            });

            node.setSatellite('test', {});

            this.is(false, checkNode(node));
            this.is(true, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(true, node.satellite.test instanceof basis.dom.wrapper.AbstractNode);
            this.is(1, satelliteChangedEventCount);

            var satelliteDestroyed = false;
            node.satellite.test.addHandler({
              destroy: function(){
                satelliteDestroyed = true;
              }
            });

            node.setSatellite('test', null);

            this.is(false, checkNode(node));
            this.is(true, satelliteDestroyed);
            this.is(undefined, node.satellite.test);
            this.is(false, 'test' in node.satellite.__auto__);
            this.is(2, satelliteChangedEventCount);
          }
        },
        {
          name: 'dynamicaly set auto-create satellite with existsIf',
          test: function(){
            var satelliteChangedEventCount = 0;
            var node = new basis.dom.wrapper.Node({
             handler: {
                satelliteChanged: function(){
                  satelliteChangedEventCount++;
                }
              }
            });

            node.setSatellite('test', {
              existsIf: 'data.value'
            });

            this.is(false, checkNode(node));
            this.is(false, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(0, satelliteChangedEventCount);

            node.update({
              value: true
            });

            this.is(false, checkNode(node));
            this.is(true, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(true, node.satellite.test instanceof basis.dom.wrapper.AbstractNode);
            this.is(1, satelliteChangedEventCount);

            var satelliteDestroyed = false;
            node.satellite.test.addHandler({
              destroy: function(){
                satelliteDestroyed = true;
              }
            });

            node.update({
              value: false
            });

            this.is(false, checkNode(node));
            this.is(true, satelliteDestroyed);
            this.is(undefined, node.satellite.test);
            this.is(false, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(2, satelliteChangedEventCount);
          }
        },
        {
          name: 'dynamicaly set auto-create satellite and replace by another auto-create satellite',
          test: function(){
            var satelliteChangedEventCount = 0;
            var node = new basis.dom.wrapper.Node({
              handler: {
                satelliteChanged: function(){
                  satelliteChangedEventCount++;
                }
              }
            });

            node.setSatellite('test', {});

            this.is(false, checkNode(node));
            this.is(true, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(1, satelliteChangedEventCount);

            var satellite = node.satellite.test;
            var satelliteDestroyed = false;
            satellite.addHandler({
              destroy: function(){
                satelliteDestroyed = true;
              }
            });

            // satellite.test -> null
            node.setSatellite('test', {
              existsIf: 'data.value'
            });

            this.is(false, checkNode(node));
            this.is(2, satelliteChangedEventCount);
            this.is(false, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(true, node.satellite.test !== satellite);
            this.is(true, satelliteDestroyed);

            // satellite.test -> AbstractNode instance
            node.update({
              value: 1
            });

            this.is(false, checkNode(node));
            this.is(true, 'test' in node.satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(true, node.satellite.test instanceof basis.dom.wrapper.AbstractNode);
          }
        },
        {
          name: 'auto-create satellite can\'t reset owner',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {}
              }
            });

            var warn = basis.dev.warn;
            var warning = false;
            var satellite = node.satellite.test;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              satellite.setOwner();
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, !!warning); // should be warning
            this.is(true, node.satellite.test === satellite);
            this.is(true, satellite.owner === node);
          }
        },
        {
          name: 'auto-satellite can\'t reset owner',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  instance: new basis.dom.wrapper.Node()
                }
              }
            });

            var warn = basis.dev.warn;
            var warning = false;
            var satellite = node.satellite.test;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              satellite.setOwner();
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, !!warning); // should be warning
            this.is(true, node.satellite.test === satellite);
            this.is(true, satellite.owner === node);
          }
        },
        {
          name: 'auto-create satellite can\'t change owner',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {}
              }
            });
            var newOwner = new basis.dom.wrapper.Node();

            var warn = basis.dev.warn;
            var warning = false;
            var satellite = node.satellite.test;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              satellite.setOwner(newOwner);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(false, checkNode(newOwner));
            this.is(true, !!warning); // should be warning
            this.is(true, node.satellite.test === satellite);
            this.is(true, satellite.owner === node);
          }
        },
        {
          name: 'auto-satellite can\'t change owner',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  instance: new basis.dom.wrapper.Node()
                }
              }
            });
            var newOwner = new basis.dom.wrapper.Node();

            var warn = basis.dev.warn;
            var warning = false;
            var satellite = node.satellite.test;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              satellite.setOwner(newOwner);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(newOwner));
            this.is(false, checkNode(satellite));
            this.is(true, !!warning); // should be warning
            this.is(true, node.satellite.test === satellite);
            this.is(true, satellite.owner === node);
          }
        },
        {
          name: 'non-used auto-satellite can\'t change owner',
          test: function(){
            var satellite = new basis.dom.wrapper.Node();
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  existsIf: 'data.value',
                  instance: satellite
                }
              }
            });
            var newOwner = new basis.dom.wrapper.Node();

            var warn = basis.dev.warn;
            var warning = false;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              satellite.setOwner(newOwner);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(newOwner));
            this.is(false, checkNode(satellite));
            this.is(true, !!warning); // should be warning
            this.is(null, satellite.owner);
          }
        },
        {
          name: 'auto-create satellite can\'t moved to another owner',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {}
              }
            });
            var newOwner = new basis.dom.wrapper.Node();

            var warn = basis.dev.warn;
            var warning = false;
            var satellite = node.satellite.test;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              newOwner.setSatellite('name', satellite);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(newOwner));
            this.is(false, checkNode(satellite));
            this.is(true, !!warning); // should be warning
            this.is(true, node.satellite.test === satellite);
            this.is(true, node.satellite.test.owner === node);
          }
        },
        {
          name: 'auto-satellite can\'t moved to another owner',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  instance: new basis.dom.wrapper.Node()
                }
              }
            });
            var newOwner = new basis.dom.wrapper.Node();

            var warn = basis.dev.warn;
            var warning = false;
            var satellite = node.satellite.test;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              newOwner.setSatellite('name', satellite);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(newOwner));
            this.is(false, checkNode(satellite));
            this.is(true, !!warning); // should be warning
            this.is(true, node.satellite.test === satellite);
            this.is(true, satellite.owner === node);
          }
        },
        {
          name: 'auto-create satellite can\'t change name inside owner',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {}
              }
            });

            var warn = basis.dev.warn;
            var warning = false;
            var satellite = node.satellite.test;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node.setSatellite('name', satellite);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, !!warning);
            this.is(true, node.satellite.test === satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(false, node.satellite.name === satellite);
            this.is(false, 'name' in node.satellite.__auto__);
            this.is(true, satellite.owner === node);
          }
        },
        {
          name: 'auto-satellite can\'t change name inside owner',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {
                  instance: new basis.dom.wrapper.Node()
                }
              }
            });

            var warn = basis.dev.warn;
            var warning = false;
            var satellite = node.satellite.test;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node.setSatellite('name', satellite);
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, !!warning);
            this.is(true, node.satellite.test === satellite);
            this.is(true, 'test' in node.satellite.__auto__);
            this.is(false, node.satellite.name === satellite);
            this.is(false, 'name' in node.satellite.__auto__);
            this.is(true, satellite.owner === node);
          }
        },
        {
          name: 'auto-create satellite can\'t be destroyed',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                test: {}
              }
            });

            var warn = basis.dev.warn;
            var warning = false;
            var satellite = node.satellite.test;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              satellite.destroy();
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, checkNode(satellite));
            this.is(true, !!warning); // should be warning
            this.is(true, node.satellite.test === satellite);
            this.is(true, node.satellite.test.owner === node);
          }
        },
        {
          name: 'all satellites should be destroyed with owner',
          test: function(){
            var node = new basis.dom.wrapper.Node({
              satellite: {
                autoCreateSatellite: {},
                autoSatellite: {
                  instance: new basis.dom.wrapper.Node()
                },
                regularSatellite: new basis.dom.wrapper.Node()
              }
            });

            var warn = basis.dev.warn;
            var warning = false;
            var autoCreateSatellite = node.satellite.autoCreateSatellite;
            var autoCreateSatelliteDestroyed = false;
            var autoSatellite = node.satellite.autoSatellite;
            var autoSatelliteDestroyed = false;
            var regularSatellite = node.satellite.autoCreateSatellite;
            var regularSatelliteDestroyed = false;

            autoCreateSatellite.addHandler({
              destroy: function(){
                autoCreateSatelliteDestroyed = true;
              }
            });
            autoSatellite.addHandler({
              destroy: function(){
                autoSatelliteDestroyed = true;
              }
            });
            regularSatellite.addHandler({
              destroy: function(){
                regularSatelliteDestroyed = true;
              }
            });

            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node.destroy();
            } finally {
              basis.dev.warn = warn;
            }

            this.is(false, checkNode(node));
            this.is(false, warning); // no warnings
            this.is(true, autoCreateSatelliteDestroyed);
            this.is(true, autoSatelliteDestroyed);
            this.is(true, regularSatelliteDestroyed);
            this.is(null, node.satellite);
            this.is(null, autoCreateSatellite.owner);
            this.is(null, autoSatellite.owner);
            this.is(null, regularSatellite.owner);
          }
        },
        {
          name: 'instance with existsIf dataSource should not be reset if dataSource is not specified in auto-satellite config',
          test: function(){
            var dataset = new basis.data.Dataset();
            var satellite = new Node({
              dataSource: dataset
            });
            var node = new Node({
              data: {
                value: true
              },
              satellite: {
                foo: {
                  events: 'update',
                  existsIf: 'data.value',
                  instance: satellite
                }
              }
            });

            this.is(true, node.data.value);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.dataSource === dataset);

            node.update({ value: false });
            this.is(false, node.data.value);
            this.is(false, 'foo' in node.satellite);
            this.is(true, satellite.dataSource === dataset);

            node.update({ value: true });
            this.is(true, node.data.value);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.dataSource === dataset);
          }
        },
        {
          name: 'instance with existsIf dataSource should be overrided by auto-satellite config value if specified',
          test: function(){
            var dataset = new basis.data.Dataset();
            var nodeDataset = new basis.data.Dataset();
            var satellite = new Node({
              dataSource: dataset
            });
            var node = new Node({
              data: {
                dataset: nodeDataset
              },
              satellite: {
                foo: {
                  events: 'update',
                  existsIf: 'data.dataset',
                  dataSource: 'data.dataset',
                  instance: satellite
                }
              }
            });

            this.is(true, node.data.dataset === nodeDataset);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.dataSource === nodeDataset);

            node.update({ dataset: null });
            this.is(true, node.data.dataset === null);
            this.is(false, 'foo' in node.satellite);
            this.is(true, satellite.dataSource === null);

            node.update({ dataset: nodeDataset });
            this.is(true, node.data.dataset === nodeDataset);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.dataSource === nodeDataset);
          }
        },
        {
          name: 'instance with existsIf delegate should not be reset if delegate is not specified in auto-satellite config',
          test: function(){
            var object = new basis.data.Object();
            var satellite = new Node({
              delegate: object
            });
            var node = new Node({
              data: {
                value: true
              },
              satellite: {
                foo: {
                  events: 'update',
                  existsIf: 'data.value',
                  instance: satellite
                }
              }
            });

            this.is(true, node.data.value);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.delegate === object);

            node.update({ value: false });
            this.is(false, node.data.value);
            this.is(false, 'foo' in node.satellite);
            this.is(true, satellite.delegate === object);

            node.update({ value: true });
            this.is(true, node.data.value);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.delegate === object);
          }
        },
        {
          name: 'instance with existsIf delegate should be overrided by auto-satellite config value if specified',
          test: function(){
            var object = new basis.data.Object();
            var satellite = new Node({
              delegate: object
            });
            var node = new Node({
              data: {
                value: true
              },
              satellite: {
                foo: {
                  events: 'update',
                  existsIf: 'data.value',
                  delegate: basis.fn.$self,
                  instance: satellite
                }
              }
            });

            this.is(true, node.data.value);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.delegate === node);

            node.update({ value: false });
            this.is(false, node.data.value);
            this.is(false, 'foo' in node.satellite);
            this.is(true, satellite.delegate === null);

            node.update({ value: true });
            this.is(true, node.data.value);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.delegate === node);
          }
        },
        {
          name: 'auto-create satellite should apply autoDelegate when no config.delegate',
          test: function(){
            var delegateChangedCount = 0;
            var object = new basis.data.Object();
            var node = new Node({
              data: {
                value: object
              },
              satellite: {
                foo: {
                  events: 'update',
                  existsIf: 'data.value',
                  instanceOf: Node,
                  config: {
                    autoDelegate: true,
                    handler: {
                      delegateChanged: function(){
                        delegateChangedCount++;
                      }
                    }
                  }
                }
              }
            });

            this.is(true, node.data.value === object);
            this.is(true, 'foo' in node.satellite);
            this.is(true, node.satellite.foo.delegate === node);
            this.is(1, delegateChangedCount);

            node.update({ value: null });
            this.is(null, node.data.value);
            this.is(false, 'foo' in node.satellite);
            this.is(1, delegateChangedCount);

            node.update({ value: object });
            this.is(true, node.data.value === object);
            this.is(true, 'foo' in node.satellite);
            this.is(true, node.satellite.foo.delegate === node);
            this.is(2, delegateChangedCount);
          }
        },
        {
          name: 'auto-create satellite config delegate value should be used even if satellite has autoDelegate',
          test: function(){
            var delegateChangedCount = 0;
            var object = new basis.data.Object();
            var node = new Node({
              data: {
                value: object
              },
              satellite: {
                foo: {
                  events: 'update',
                  existsIf: 'data.value',
                  delegate: 'data.value',
                  instanceOf: Node,
                  config: {
                    autoDelegate: true,
                    handler: {
                      delegateChanged: function(){
                        delegateChangedCount++;
                      }
                    }
                  }
                }
              }
            });

            this.is(true, node.data.value === object);
            this.is(true, 'foo' in node.satellite);
            this.is(true, node.satellite.foo.delegate === object);
            this.is(1, delegateChangedCount);

            node.update({ value: null });
            this.is(null, node.data.value);
            this.is(false, 'foo' in node.satellite);
            this.is(1, delegateChangedCount);

            node.update({ value: object });
            this.is(true, node.data.value === object);
            this.is(true, 'foo' in node.satellite);
            this.is(true, node.satellite.foo.delegate === object);
            this.is(2, delegateChangedCount);
          }
        },
        {
          name: 'auto-satellite should apply autoDelegate when no config.delegate',
          test: function(){
            var delegateChangedCount = 0;
            var object = new basis.data.Object();
            var satellite = new Node({
              autoDelegate: true,
              handler: {
                delegateChanged: function(){
                  delegateChangedCount++;
                }
              }
            });
            var node = new Node({
              data: {
                value: object
              },
              satellite: {
                foo: {
                  events: 'update',
                  existsIf: 'data.value',
                  instance: satellite
                }
              }
            });

            this.is(true, node.data.value === object);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.delegate === node);
            this.is(1, delegateChangedCount);

            node.update({ value: null });
            this.is(null, node.data.value);
            this.is(false, 'foo' in node.satellite);
            this.is(true, satellite.delegate === null);
            this.is(2, delegateChangedCount);

            node.update({ value: object });
            this.is(true, node.data.value === object);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.delegate === node);
            this.is(3, delegateChangedCount);
          }
        },
        {
          name: 'auto-satellite config delegate value should be used even if satellite has autoDelegate',
          test: function(){
            var delegateChangedCount = 0;
            var object = new basis.data.Object();
            var satellite = new Node({
              autoDelegate: true,
              handler: {
                delegateChanged: function(){
                  delegateChangedCount++;
                }
              }
            });
            var node = new Node({
              data: {
                value: object
              },
              satellite: {
                foo: {
                  events: 'update',
                  existsIf: 'data.value',
                  delegate: 'data.value',
                  instance: satellite
                }
              }
            });

            this.is(true, node.data.value === object);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.delegate === object);
            this.is(1, delegateChangedCount);

            node.update({ value: null });
            this.is(null, node.data.value);
            this.is(false, 'foo' in node.satellite);
            this.is(true, satellite.delegate === null);
            this.is(2, delegateChangedCount);

            node.update({ value: object });
            this.is(true, node.data.value === object);
            this.is(true, node.satellite.foo === satellite);
            this.is(true, satellite.delegate === object);
            this.is(3, delegateChangedCount);
          }
        },
        {
          name: 'instances and classes should be able to reset satellite',
          test: function(){
            var MyNode = Node.subclass({
              satellite: {
                foo: Node
              }
            });

            var foo = new MyNode();
            var bar = new MyNode({
              satellite: {
                foo: null
              }
            });

            assert(foo.satellite.foo instanceof Node);

            assert(bar.satellite.foo === undefined);
            assert('foo' in bar.satellite == false);
          }
        }
      ]
    },
    {
      name: 'dataSource',
      test: [
        {
          name: 'dataSource in config',
          test: function(){
            var dataset = getDataset();
            var length = dataset.itemCount;
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: dataset
            });

            this.is(false, checkNode(node));
            this.is(true, length > 0);
            this.is(true, node.dataSource === dataset);
            this.is(length, node.childNodes.length);
            this.is(length, dataset.itemCount);
          }
        },
        {
          name: 'dataSource should be drop on source destroy',
          test: function(){
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: dataset
            });

            this.is(false, checkNode(node));
            this.is(true, node.dataSource === dataset);

            dataset.destroy();

            this.is(false, checkNode(node));
            this.is(true, node.dataSource === null);
          }
        },
        {
          name: 'DatasetWrapper instance as dataSource in config',
          test: function(){
            var dataset = getDataset();
            var length = dataset.itemCount;
            var datasetWrapper = new basis.data.DatasetWrapper({ dataset: dataset });
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: datasetWrapper
            });

            this.is(false, checkNode(node));
            this.is(true, length > 0);
            this.is(true, node.dataSource === dataset);
            this.is(length, node.childNodes.length);
            this.is(length, dataset.itemCount);
          }
        },
        {
          name: 'Value instance as dataSource in config',
          test: function(){
            var dataset = getDataset();
            var length = dataset.itemCount;
            var datasetWrapper = new basis.data.DatasetWrapper({ dataset: dataset });
            var value = new basis.data.Value({ value: datasetWrapper });
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: value
            });

            this.is(false, checkNode(node));
            this.is(true, length > 0);
            this.is(true, node.dataSource === dataset);
            this.is(length, node.childNodes.length);
            this.is(length, dataset.itemCount);
          }
        },
        {
          name: 'dataSource adapter should be removed on destroy',
          test: function(){
            // non-empty dataSource
            var dataset = getDataset();
            var value = new basis.data.Value({ value: dataset });
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: value
            });

            this.is(false, checkNode(node));
            this.is(true, node.dataSource === dataset);
            this.is(true, node.dataSourceAdapter_.source === value);

            node.destroy();

            this.is(null, node.dataSource);
            this.is(null, node.dataSourceAdapter_);

            // empty dataSource
            var value = new basis.data.Value();
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: value
            });

            this.is(false, checkNode(node));
            this.is(true, node.dataSource === null);
            this.is(true, node.dataSourceAdapter_.source === value);

            node.destroy();

            this.is(null, node.dataSource);
            this.is(null, node.dataSourceAdapter_);
          }
        },
        {
          name: 'dataSource adapter shouldn\'t be removed on source destroy',
          test: function(){
            // non-empty dataSource
            var dataset = new basis.data.Dataset({
              handler: {
                destroy: function(){
                  value.set(null);
                }
              }
            });
            var value = new basis.data.Value({ value: dataset });
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: value
            });

            this.is(false, checkNode(node));
            this.is(true, node.dataSource === dataset);
            this.is(true, node.dataSourceAdapter_.source === value);

            dataset.destroy();
            this.is(null, node.dataSource);
            this.is(null, value.value);
            this.is(true, node.dataSourceAdapter_ !== null);
            this.is(true, node.dataSourceAdapter_ !== null && node.dataSourceAdapter_.source === value);
          }
        },
        {
          name: 'if dataSource in config, childNodes should be ignored',
          test: function(){
            var testSet = getTestSet();
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: testSet,
              dataSource: dataset
            });

            this.is(false, checkNode(node));
            this.is(true, node.dataSource === dataset);
            this.is(dataset.itemCount, node.childNodes.length);
          }
        },
        {
          name: 'if dataSource adapter in config, childNodes should be ignored',
          test: function(){
            var testSet = getTestSet();
            var value = new basis.data.Value();
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: testSet,
              dataSource: value
            });

            this.is(false, checkNode(node));
            this.is(true, node.dataSource === null);
            this.is(true, node.dataSourceAdapter_ != null);
            this.is(true, node.firstChild == null);
          }
        },
        {
          name: 'if dataSource set than node modify methods should throw an exception and should not to change childNodes or dataSource',
          test: function(){
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: dataset
            });

            this.is(dataset, node.dataSource);

            var itemCount = dataset.itemCount;

            var exceptionHere = false;
            try {
              node.appendChild(new Node);
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === dataset);
            this.is(itemCount, dataset.itemCount);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);

            var exceptionHere = false;
            try {
              node.insertBefore(new Node);
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === dataset);
            this.is(itemCount, dataset.itemCount);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);

            var exceptionHere = false;
            try {
              node.removeChild(node.firstChild);
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === dataset);
            this.is(itemCount, dataset.itemCount);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);

            var exceptionHere = false;
            try {
              node.replaceChild(new Node, node.firstChild);
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === dataset);
            this.is(itemCount, dataset.itemCount);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);
          }
        },
        {
          name: 'node modify methods should throw an exception and should not to change childNodes or dataSource if dataSource adapter used',
          test: function(){
            var value = new basis.data.Value();
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: value
            });

            this.is(true, node.dataSource === null);
            this.is(true, node.dataSourceAdapter_ !== null);
            this.is(true, node.dataSourceAdapter_.source === value);

            var exceptionHere = false;
            try {
              node.appendChild(new Node);
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === null);
            this.is(true, node.dataSourceAdapter_ !== null);
            this.is(true, node.dataSourceAdapter_.source === value);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);

            var exceptionHere = false;
            try {
              node.insertBefore(new Node);
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === null);
            this.is(true, node.dataSourceAdapter_ !== null);
            this.is(true, node.dataSourceAdapter_.source === value);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);

            var exceptionHere = false;
            try {
              node.removeChild(node.firstChild);
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === null);
            this.is(true, node.dataSourceAdapter_ !== null);
            this.is(true, node.dataSourceAdapter_.source === value);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);

            var exceptionHere = false;
            try {
              node.replaceChild(new Node, node.firstChild);
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === null);
            this.is(true, node.dataSourceAdapter_ !== null);
            this.is(true, node.dataSourceAdapter_.source === value);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);
          }
        },
        {
          name: 'clear with dataSource',
          test: function(){
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: dataset
            });

            var itemCount = dataset.itemCount;

            this.is(dataset, node.dataSource);

            var exceptionHere = false;
            try {
              node.clear();
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === dataset);
            this.is(itemCount, dataset.itemCount);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);

            // no exception if dataSource is empty
            dataset.clear();
            var exceptionHere = false;
            try {
              node.clear();
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === dataset);
            this.is(0, dataset.itemCount);
            this.is(false, checkNode(node));
            this.is(false, exceptionHere);
          }
        },
        {
          name: 'setChildNodes with dataSource',
          test: function(){
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: dataset
            });

            var itemCount = dataset.itemCount;
            this.is(dataset, node.dataSource);

            var exceptionHere = false;
            try {
              node.setChildNodes([new Node]);
            } catch(e){
              exceptionHere = true;
            }
            this.is(dataset, node.dataSource);
            this.is(itemCount, dataset.itemCount);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);
          }
        },
        {
          name: 'setChildNodes with no dataSource but with dataSource adapter',
          test: function(){
            var value = new basis.data.Value;
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: value
            });

            this.is(true, node.dataSource === null);
            this.is(true, node.dataSourceAdapter_ !== null);
            this.is(true, node.dataSourceAdapter_.source === value);

            var exceptionHere = false;
            try {
              node.setChildNodes([new Node]);
            } catch(e){
              exceptionHere = true;
            }
            this.is(true, node.dataSource === null);
            this.is(true, node.dataSourceAdapter_ !== null);
            this.is(true, node.dataSourceAdapter_.source === value);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);
          }
        },
        {
          name: 'insertBefore(node/config) should throw exception if child with delegate->dataSource.item already exists',
          test: function(){
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: dataset
            });

            var itemCount = dataset.itemCount;
            this.is(dataset, node.dataSource);
            this.is(true, itemCount > 0);

            var exceptionHere = false;
            try {
              node.insertBefore(dataset.pick());
            } catch(e){
              exceptionHere = true;
            }
            this.is(dataset, node.dataSource);
            this.is(itemCount, dataset.itemCount);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);

            var exceptionHere = false;
            try {
              node.insertBefore({ delegate: dataset.pick() });
            } catch(e){
              exceptionHere = true;
            }
            this.is(dataset, node.dataSource);
            this.is(itemCount, dataset.itemCount);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);

            var exceptionHere = false;
            try {
              node.insertBefore(new Node({ delegate: dataset.pick() }));
            } catch(e){
              exceptionHere = true;
            }
            this.is(dataset, node.dataSource);
            this.is(itemCount, dataset.itemCount);
            this.is(false, checkNode(node));
            this.is(true, exceptionHere);
          }
        },
        {
          name: 'set/reset/set dataSource',
          test: function(){
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory
            });

            node.setDataSource(dataset);
            this.is(false, checkNode(node));
            this.is(dataset, node.dataSource);
            this.is(dataset.itemCount, node.childNodes.length);

            node.setDataSource();
            this.is(false, checkNode(node));
            this.is(null, node.dataSource);
            this.is(0, node.childNodes.length);

            node.setDataSource(dataset);
            this.is(false, checkNode(node));
            this.is(dataset, node.dataSource);
            this.is(dataset.itemCount, node.childNodes.length);
          }
        },
        {
          name: 'set/reset/set DatasetWrapper instance as dataSource',
          test: function(){
            var dataset = getDataset();
            var datasetWrapper = new basis.data.DatasetWrapper({ dataset: dataset });
            var node = new Node({
              childFactory: nodeFactory
            });

            node.setDataSource(datasetWrapper);
            this.is(false, checkNode(node));
            this.is(dataset, node.dataSource);
            this.is(dataset.itemCount, node.childNodes.length);

            node.setDataSource();
            this.is(false, checkNode(node));
            this.is(null, node.dataSource);
            this.is(0, node.childNodes.length);

            node.setDataSource(datasetWrapper);
            this.is(false, checkNode(node));
            this.is(dataset, node.dataSource);
            this.is(dataset.itemCount, node.childNodes.length);

            datasetWrapper.setDataset();
            this.is(false, checkNode(node));
            this.is(null, node.dataSource);
            this.is(0, node.childNodes.length);
          }
        },
        {
          name: 'set/reset/set Value instance as dataSource',
          test: function(){
            var dataset = getDataset();
            var datasetWrapper = new basis.data.DatasetWrapper({ dataset: dataset });
            var value = new basis.data.Value({ value: datasetWrapper });
            var node = new Node({
              childFactory: nodeFactory
            });

            node.setDataSource(value);
            this.is(false, checkNode(node));
            this.is(dataset, node.dataSource);
            this.is(dataset.itemCount, node.childNodes.length);

            node.setDataSource();
            this.is(false, checkNode(node));
            this.is(null, node.dataSource);
            this.is(0, node.childNodes.length);

            node.setDataSource(value);
            this.is(false, checkNode(node));
            this.is(dataset, node.dataSource);
            this.is(dataset.itemCount, node.childNodes.length);

            value.set();
            this.is(false, checkNode(node));
            this.is(null, node.dataSource);
            this.is(0, node.childNodes.length);
          }
        },
        {
          name: 'dynamic test for Value/DatasetWrapper as dataSource',
          test: function(){
            var dataset = new basis.data.Dataset();
            var anotherDataset = new basis.data.Dataset();
            var selectedDataset = new basis.data.Value({ value: dataset });
            var node = new basis.dom.wrapper.Node({
              dataSource: selectedDataset
            });

            this.is(true, node.dataSource === dataset);  // true
            this.is(true, node.dataSourceAdapter_.source === selectedDataset);  // true

            selectedDataset.set(null);

            this.is(true, node.dataSource === null);  // true
            this.is(true, node.dataSourceAdapter_.source === selectedDataset);  // true

            selectedDataset.set(new basis.data.DatasetWrapper({ dataset: anotherDataset }));

            this.is(true, node.dataSource === anotherDataset);  // true
            this.is(true, node.dataSourceAdapter_.source === selectedDataset);  // true

            selectedDataset.value.setDataset(null);

            this.is(true, node.dataSource === null);  // true
            this.is(true, node.dataSourceAdapter_.source === selectedDataset);  // true
          }
        },
        {
          name: 'set/reset dataSource/childNodes',
          test: function(){
            var testSet = getTestSet();
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: testSet
            });
            this.is(false, checkNode(node));
            this.is(testSet.length, node.childNodes.length);

            node.setDataSource(dataset);
            this.is(false, checkNode(node));
            this.is(dataset, node.dataSource);
            this.is(dataset.itemCount, node.childNodes.length);

            node.setDataSource();
            this.is(false, checkNode(node));
            this.is(null, node.dataSource);
            this.is(0, node.childNodes.length);

            node.setChildNodes(testSet);
            this.is(false, checkNode(node));
            this.is(testSet.length, node.childNodes.length);

            node.setDataSource(dataset);
            this.is(false, checkNode(node));
            this.is(dataset, node.dataSource);
            this.is(dataset.itemCount, node.childNodes.length);

          }
        },
        {
          name: 'set dataSource and destroy dataSource',
          test: function(){
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: dataset
            });

            var itemCount = dataset.itemCount;

            this.is(dataset, node.dataSource);
            this.is(true, itemCount > 0);
            this.is(false, checkNode(node));

            dataset.destroy();

            this.is(null, node.dataSource);
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'destroy node with dataSource',
          test: function(){
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: dataset
            });

            var target = dataset.pick();
            var targetNode = basis.array.search(node.childNodes, target, 'root');

            node.destroy();

            var hasHandler = false;
            var cursor = target;
            while (cursor = cursor.handler)
            {
              if (cursor.context == targetNode)
                hasHandler = true;
            }

            this.is(true, !targetNode.delegate);
            this.is(false, hasHandler);
          }
        },
        {
          name: 'clear dataSource',
          test: function(){
            var dataset = getDataset();
            var node = new Node({
              childFactory: nodeFactory,
              dataSource: dataset
            });

            var target = dataset.pick();
            var targetNode = basis.array.search(node.childNodes, target, 'root');

            dataset.clear();

            var hasHandler = false;
            var cursor = target;
            while (cursor = cursor.handler)
            {
              if (cursor.context == targetNode)
                hasHandler = true;
            }

            this.is(true, !targetNode.delegate);
            this.is(false, hasHandler);
          }
        },
        {
          name: 'dataSource via Value.factory and subscription on node destroy',
          test: function(){
            var dataset = new basis.data.Dataset;
            var node = new Node({
              active: true,
              dataSource: basis.data.Value.factory(function(){
                return dataset;
              })
            });

            assert(dataset.subscriberCount == 1);
            assert(node.dataSource === dataset);

            var warn = basis.dev.warn;
            var warning = false;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node.destroy();
            } finally {
              basis.dev.warn = warn;
            }

            assert(warning === false);
          }
        },
        {
          name: 'dataSource via Value.factory and subscription on node destroy',
          test: function(){
            var dataset = new basis.data.Dataset;
            var node = new Node({
              active: true,
              dataSource: dataset
            });

            assert(dataset.subscriberCount == 1);
            assert(node.dataSource === dataset);

            var warn = basis.dev.warn;
            var warning = false;
            try {
              basis.dev.warn = function(message){
                warning = message;
              };

              node.destroy();
            } finally {
              basis.dev.warn = warn;
            }

            assert(warning === false);
          }
        }
      ]
    },
    {
      name: 'grouping',
      test: [
        {
          name: 'grouping in config',
          test: function(){
            var testSet = getTestSet();
            var node = new Node({
              childFactory: nodeFactory,
              grouping: 'data.group'
            });

            for (var i = 0; i < testSet.length; i++)
              node.appendChild(testSet[i]);

            this.is(false, checkNode(node));
            this.is($values(basis.array.sortAsObject(testSet, 'data.group')), $values(node.childNodes));

            // =======================================
            var testSet = getTestSet();
            var node = new Node({
              childFactory: nodeFactory,
              grouping: {
                rule: 'data.group',
                sorting: basis.getter('data.id'),
                sortingDesc: true
              }
            });

            for (var i = 0; i < testSet.length; i++)
              node.appendChild(testSet[i]);

            this.is(false, checkNode(node));
            this.is($values([4, 3, 8, 1, 5, 6, 0, 2, 7, 9].map(convertToNode)), $values(node.childNodes));

            // ======================================
            var testSet = getTestSet();
            var node = new Node({
              childFactory: nodeFactory,
              sorting: basis.getter('data.value'),
              sortingDesc: true,
              grouping: {
                rule: 'data.group',
                sorting: basis.getter('data.id'),
                sortingDesc: true
              },
              childNodes: testSet
            });

            this.is(false, checkNode(node));
            this.is($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));
          }
        },
        {
          name: 'update PartitionNode',
          test: function(){
            // ======================================
            var testSet = getTestSet();
            var node = new Node({
              childFactory: nodeFactory,
              sorting: basis.getter('data.value'),
              sortingDesc: true,
              grouping: {
                rule: 'data.group',
                sorting: basis.getter('data.title', String),
                sortingDesc: true
              },
              childNodes: testSet
            });

            this.is(false, checkNode(node));
            this.is($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

            var groups = getGroups(node);
            for (var i = 0; i < groups.length; i++)
              groups[i].update({ title: 'group' + groups[i].data.title });

            this.is(false, checkNode(node));
            this.is($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

            groups[0].update({ title: '-1' });
            this.is(false, checkNode(node));
            this.is($values([8, 3, 6, 5, 1, 9, 7, 2, 0, 4].map(convertToNode)), $values(node.childNodes));

            groups[1].update({ title: '-2' });
            this.is(false, checkNode(node));
            this.is($values([6, 5, 1, 9, 7, 2, 0, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

            groups[2].update({ title: '-3' });
            this.is(false, checkNode(node));
            this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

            groups[3].update({ title: '-4' });
            this.is(false, checkNode(node));
            this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));
          }
        },
        {
          name: 'update PartitionNode with delegate',
          test: function(){
            var groupNodes = {};
            for (var i = 1; i <= 4; i++)
              groupNodes[i] = new Node({
                data: {
                  title: i
                }
              });

            // ======================================
            var node = new Node({
              childFactory: nodeFactory,
              sorting: basis.getter('data.value'),
              sortingDesc: true,
              grouping: {
                rule: basis.getter('data.group', groupNodes),
                sorting: basis.getter('data.title'),
                sortingDesc: true
              },
              childNodes: testSet//.filter(basis.getter('data.group >= 3'))
            });

            this.is(false, checkNode(node));
            this.is(4, getGroups(node).length);
            this.is($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

            var groups = getGroups(node);
            /*for (var i = 0; i < groups.length; i++)
              groups[i].update({ title: 'group' + i });*/

            groups[0].update({ title: -4 });
            this.is(false, checkNode(node));
            this.is($values([8, 3, 6, 5, 1, 9, 7, 2, 0, 4].map(convertToNode)), $values(node.childNodes));

            groups[1].update({ title: -3 });
            this.is(false, checkNode(node));
            this.is($values([6, 5, 1, 9, 7, 2, 0, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

            groups[2].update({ title: -2 });
            this.is(false, checkNode(node));
            this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

            groups[3].update({ title: -1 });
            this.is(false, checkNode(node));
            this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

          }
        },
        {
          name: 'setGrouping after create and update PartitionNode with delegate',
          test: function(){

            var groupNodes = {};
            for (var i = 1; i <= 4; i++)
              groupNodes[i] = new Node({
                data: {
                  title: i
                }
              });


            var node = new Node({
              childFactory: nodeFactory,
              sorting: basis.getter('data.value'),
              sortingDesc: true,
              childNodes: testSet//.filter(basis.getter('data.group >= 3'))
            });

            this.is(false, checkNode(node));

            node.setGrouping({
              rule: basis.getter('data.group', groupNodes),
              sorting: basis.getter('data.title'),
              sortingDesc: true
            });

            this.is(false, checkNode(node));
            this.is(4, getGroups(node).length);
            this.is($values([4, 8, 3, 6, 5, 1, 9, 7, 2, 0].map(convertToNode)), $values(node.childNodes));

            var groups = getGroups(node);
            /*for (var i = 0; i < groups.length; i++)
              groups[i].update({ title: 'group' + i });*/

            groups[0].update({ title: -4 });
            this.is(false, checkNode(node));
            this.is($values([8, 3, 6, 5, 1, 9, 7, 2, 0, 4].map(convertToNode)), $values(node.childNodes));

            groups[1].update({ title: -3 });
            this.is(false, checkNode(node));
            this.is($values([6, 5, 1, 9, 7, 2, 0, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

            groups[2].update({ title: -2 });
            this.is(false, checkNode(node));
            this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));

            groups[3].update({ title: -1 });
            this.is(false, checkNode(node));
            this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));
          }
        },
        {
          name: 'setGrouping after create and update PartitionNode with delegate & subscription',
          test: function(){

            var GroupDelegateClass = Class(Node, {
              emit_subscribersChanged: function(){
                Node.prototype.emit_subscribersChanged.call(this);
                if (this.subscriberCount)
                  this.update({ title: this.data.title_ });
              }
            });

            var groupNodes = {};
            for (var i = 1; i <= 4; i++)
              groupNodes[i] = new GroupDelegateClass({
                data: {
                  title_: -i,
                  title: i
                }
              });


            var node = new Node({
              childFactory: nodeFactory,
              sorting: basis.getter('data.value'),
              sortingDesc: true,
              groupingClass: {
                childClass: {
                  active: true
                }
              },
              childNodes: testSet//.filter(basis.getter('data.group >= 3'))
            });

            this.is(false, checkNode(node));

            node.setGrouping({
              rule: basis.getter('data.group', groupNodes),
              sorting: basis.getter('data.title'),
              sortingDesc: true
            });

            this.is(false, checkNode(node));
            this.is(4, getGroups(node).length);
            this.is($values([9, 7, 2, 0, 6, 5, 1, 8, 3, 4].map(convertToNode)), $values(node.childNodes));
          }
        },
        {
          name: 'grouping change events (issue #8)',
          test: function(){
            // preparation
            var events;
            var node = new Node({
              grouping: {},
              handler: {
                '*': function(e){
                  if (events && e.type == 'groupingChanged')
                    events.push(e);
                }
              }
            });

            // test
            events = [];
            node.setGrouping({});
            this.is(1, events.length);
          }
        }
      ]
    },
    {
      name: 'selection',
      test: [
        {
          name: 'destroy child with own selection',
          test: function(){
            var parent = new Node({
              selection: true,
              childNodes: [new Node({ selected: true }), new Node, new Node]
            });

            this.is(true, parent.firstChild.selected);
            this.is(true, parent.selection.pick() != null);

            var child = new Node({
              selection: true,
              childNodes: [new Node({ selected: true }), new Node, new Node]
            });

            this.is(true, child.firstChild.selected);
            this.is(true, parent.firstChild.selected);

            parent.appendChild(child);
            child.destroy();

            this.is(true, parent.firstChild.selected);
            this.is(true, parent.selection.itemCount > 0);
          }
        },
        {
          name: 'destroy selected child with own selection',
          test: function(){
            var parent = new Node({
              selection: true,
              childNodes: [new Node, new Node, new Node]
            });

            var child = new Node({
              selection: true,
              selected: true,
              childNodes: [new Node({ selected: true }), new Node, new Node]
            });

            parent.appendChild(child);

            this.is(true, child.firstChild.selected);
            this.is(true, parent.lastChild.selected);

            child.destroy();

            this.is(true, parent.selection.itemCount == 0);
          }
        }
      ]
    },
    {
      name: 'Dynamic test',
      test: [
        {
          name: 'set sorting',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet()
            });

            this.is(false, checkNode(node));

            node.setSorting(basis.getter('data.value'));
            this.is(false, checkNode(node));

            var order = basis.array.from(node.childNodes);
            node.setSorting(basis.getter('data.value * -1'), true);
            this.is(false, checkNode(node));
            this.is(order, node.childNodes);

            node.setSorting();
            this.is(false, checkNode(node));

            node.setSorting(basis.getter('data.value'), true);
            this.is(false, checkNode(node));

            var order = basis.array.from(node.childNodes);
            for (var i = 0; i < order.length; i++)
              order[i].update({ value: -order[i].data.value });
            this.is(false, checkNode(node));
            this.is(order.reverse(), node.childNodes);
          },
        },
        {
          name: 'set sorting #2',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              sorting: basis.getter('data.value'),
              childNodes: getTestSet()
            });
            this.is(false, checkNode(node));

            var node = new Node({
              childFactory: nodeFactory,
              sorting: basis.getter('data.value'),
              sortingDesc: true,
              childNodes: getTestSet()
            });
            this.is(false, checkNode(node));

            var node = new Node({
              childFactory: nodeFactory,
              sorting: basis.getter('data.value'),
              sortingDesc: true
            });
            this.is(false, checkNode(node));
            node.setChildNodes(getTestSet());
            this.is(false, checkNode(node));
            node.clear();
            this.is(false, checkNode(node));
            node.setChildNodes(getTestSet());
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'set grouping',
          test: [
            {
              name: 'set/remove, change grouping',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: getTestSet()
                });
                this.is(false, checkNode(node));

                node.setGrouping(basis.getter('data.group'));
                this.is(false, checkNode(node));
                this.is(4, getGroups(node).length);

                // change grouping
                node.setGrouping(basis.getter('data.value'));
                this.is(false, checkNode(node));
                this.is(10, getGroups(node).length);

                // drop grouping
                var order = basis.array.from(node.childNodes);
                node.setGrouping();
                this.is(false, checkNode(node));
                this.is(null, node.grouping);
                this.is(order, node.childNodes);

                node.setGrouping({
                  rule: 'data.value',
                  sorting: basis.getter('data.title')
                });
                this.is(false, checkNode(node));

                var order = basis.array.from(node.childNodes);
                // nothing changed
                node.grouping.setSorting(node.grouping.sorting);
                this.is(false, checkNode(node));
                this.is(order, node.childNodes);
                // reverse order
                node.grouping.setSorting(node.grouping.sorting, true);
                this.is(false, checkNode(node));
                this.is($values(order).reverse(), $values(node.childNodes));
              }
            },
            {
              name: 'set/remove grouping via setOwner',
              test: function(){
                var groupingDestroyed = false;
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: getTestSet(),
                  grouping: {
                    autoDestroyWithNoOwner: false,
                    handler: {
                      destroy: function(){
                        groupingDestroyed = true;
                      }
                    }
                  }
                });
                var grouping = node.grouping;

                this.is(false, checkNode(node));
                this.is(false, checkNode(grouping));
                this.is(true, basis.Class.isClass(node.groupingClass));
                this.is(true, grouping instanceof node.groupingClass);
                this.is(true, grouping.owner === node);

                grouping.setOwner();
                this.is(false, checkNode(node));
                this.is(false, checkNode(grouping));
                this.is(false, groupingDestroyed);
                this.is(true, node.grouping === null);
              }
            },
            {
              name: 'set grouping and clear childNodes',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  grouping: {
                    rule: 'data.value'
                  }
                });
                this.is(false, checkNode(node));

                node.setChildNodes(getTestSet());
                this.is(false, checkNode(node));

                node.clear();
                this.is(false, checkNode(node));

                node.setChildNodes(getTestSet());
                this.is(false, checkNode(node));
              }
            },
            {
              name: 'create with grouping and destroy grouping',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  grouping: {
                    rule: 'data.value'
                  }
                });

                var grouping = node.grouping;
                grouping.destroy();
                this.is(true, node.grouping === null);
                this.is(false, checkNode(node));
                this.is(false, checkDestroyedObject(grouping));
              }
            },
            {
              name: 'set grouping and destroy grouping',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory
                });

                node.setGrouping('data.value');
                this.is(true, node.grouping !== null);

                var grouping = node.grouping;
                grouping.destroy();
                this.is(true, node.grouping === null);
                this.is(false, checkNode(node));
                this.is(false, checkDestroyedObject(grouping));
              }
            }
          ]
        },
        {
          name: 'nesting grouping',
          test: [
            {
              name: 'create with nested grouping, decrease deep step by step, and increase back step by step',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  grouping: {
                    rule: 'data.value',
                    grouping: {
                      rule: 'data.id % 4',
                      grouping: basis.getter('data.id % 2')
                    }
                  },
                  childNodes: getTestSet()
                });
                this.is(false, checkNode(node));

                node.grouping.grouping.setGrouping();
                this.is(false, checkNode(node));

                node.grouping.setGrouping();
                this.is(false, checkNode(node));

                node.setGrouping();
                this.is(false, checkNode(node));

                node.setGrouping('data.value');
                this.is(false, checkNode(node));

                node.grouping.setGrouping('data.id % 4');
                this.is(false, checkNode(node));

                node.grouping.grouping.setGrouping('data.id % 2');
                this.is(false, checkNode(node));
              }
            },
            {
              name: 'set childs for node with nested grouping',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  grouping: {
                    rule: 'data.value',
                    grouping: {
                      rule: 'data.id % 4',
                      grouping: basis.getter('data.id % 2')
                    }
                  }
                });

                node.setChildNodes(getTestSet());
                this.is(false, checkNode(node));

                node.clear();
                this.is(false, checkNode(node));

                node.setChildNodes(getTestSet());
                this.is(false, checkNode(node));

                node.setGrouping();
                this.is(false, checkNode(node));
              }
            },
            {
              name: 'increase deep of nested grouping step by step and reset',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: getTestSet()
                });
                this.is(false, checkNode(node));

                node.setGrouping('data.value');
                this.is(false, checkNode(node));

                node.grouping.setGrouping('data.id % 4');
                this.is(false, checkNode(node));

                node.grouping.grouping.setGrouping('data.id % 2');
                this.is(false, checkNode(node));

                node.setGrouping();
                this.is(false, checkNode(node));
              }
            },
            {
              name: 'replace nested grouping by other',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: getTestSet()
                });
                node.setGrouping({
                  rule: 'data.value',
                  grouping: {
                    rule: 'data.id % 4',
                    grouping: basis.getter('data.id % 2')
                  }
                });
                this.is(false, checkNode(node));

                node.setGrouping('data.value');
                this.is(true, node.grouping !== null);

                node.setGrouping({
                  rule: 'data.value',
                  grouping: {
                    rule: 'data.id % 4',
                    grouping: basis.getter('data.id % 2')
                  }
                });
                this.is(false, checkNode(node));

                node.setGrouping();
                this.is(false, checkNode(node));
              }
            }
          ]
        },
        {
          name: 'mixing sorting & grouping',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet()
            });

            node.setGrouping(basis.getter('data.group'));
            this.is(false, checkNode(node));

            node.setSorting(basis.getter('data.value'));
            this.is(false, checkNode(node));

            node.setGrouping({
              rule: 'data.group',
              sorting: basis.getter('data.id'),
              sortingDesc: true
            });
            this.is(false, checkNode(node));

            node.setGrouping();
            this.is(false, checkNode(node));

            node.setSorting(basis.getter('data.group'), true);
            this.is(false, checkNode(node));

            node.setGrouping(basis.getter('data.group'));
            this.is(false, checkNode(node));

            var order = basis.array.from(node.childNodes);
            node.setSorting();
            this.is(false, checkNode(node));
            node.setGrouping();
            this.is(false, checkNode(node));
            this.is(order, node.childNodes);
          }
        },
        {
          name: 'mixing sorting & grouping, wrong order on child group changing (issue #1)',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet(),
              sorting: 'data.value',
              grouping: 'data.group'
            });

            var child = node.firstChild;
            var orginalGroupId = child.data.group;

            child.update({ group: orginalGroupId + 1 });
            this.is(false, checkNode(node));

            child.update({ group: orginalGroupId });
            this.is(false, checkNode(node));

            ///////

            var node = new Node({
              childFactory: nodeFactory,
              sorting: 'data.value',
              grouping: {
                rule: 'data.group',
                sorting: 'data.id'
              },
              childNodes: [
                { data: { value: 2, group: 1 } },
                { data: { value: 3, group: 1 } },
                { data: { value: 3, group: 2 } },
                { data: { value: 4, group: 2 } },
                { data: { value: 1, group: 3 } },
                { data: { value: 4, group: 3 } },
                { data: { value: 5, group: 3 } },
                { data: { value: 1, group: 4 } }
              ]
            });

            var child = node.firstChild;

            child.update({ group: 2 });
            this.is(1, node.childNodes.indexOf(child));
            this.is(false, checkNode(node));

            child.update({ group: 3 });
            this.is(4, node.childNodes.indexOf(child));
            this.is(false, checkNode(node));

            child.update({ group: 4 });
            this.is(7, node.childNodes.indexOf(child));
            this.is(false, checkNode(node));

            child.update({ group: 5 });
            this.is(7, node.childNodes.indexOf(child));
            this.is(false, checkNode(node));

            child.update({ group: 1 });
            this.is(0, node.childNodes.indexOf(child));
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'mixed sorting & grouping, wrong order on moving last child inside the group (issue #2)',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              childNodes: getTestSet(),
              sorting: 'data.value',
              grouping: 'data.group'
            });
            this.is(false, checkNode(node));

            node.lastChild.update({ value: 0 });
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'partition manipulations',
          test: function(){
            var node = new Node({
              childFactory: nodeFactory,
              grouping: {
                rule: 'data.group'
              },
              childNodes: getTestSet()
            });
            this.is(false, checkNode(node));

            node.grouping.appendChild(node.grouping.firstChild);
            this.is(false, checkNode(node));
            node.grouping.appendChild(node.grouping.firstChild);
            this.is(false, checkNode(node));
            node.grouping.appendChild(node.grouping.firstChild);
            this.is(false, checkNode(node));
            node.grouping.appendChild(node.grouping.firstChild);
            this.is(false, checkNode(node));

            node.grouping.insertBefore(node.grouping.lastChild, node.grouping.firstChild);
            this.is(false, checkNode(node));
            node.grouping.insertBefore(node.grouping.lastChild, node.grouping.firstChild);
            this.is(false, checkNode(node));
            node.grouping.insertBefore(node.grouping.lastChild, node.grouping.firstChild);
            this.is(false, checkNode(node));
            node.grouping.insertBefore(node.grouping.lastChild, node.grouping.firstChild);
            this.is(false, checkNode(node));

            node.grouping.insertBefore(node.grouping.childNodes[1], node.grouping.childNodes[2]);
            this.is(false, checkNode(node));
            node.grouping.insertBefore(node.grouping.childNodes[1], node.grouping.childNodes[3]);
            this.is(false, checkNode(node));
            node.grouping.insertBefore(node.grouping.childNodes[1], node.grouping.childNodes[0]);
            this.is(false, checkNode(node));
            node.grouping.insertBefore(node.grouping.childNodes[2], node.grouping.childNodes[3]);
            this.is(false, checkNode(node));
            node.grouping.insertBefore(node.grouping.childNodes[3], node.grouping.childNodes[2]);
            this.is(false, checkNode(node));
            node.grouping.insertBefore(node.grouping.childNodes[3], node.grouping.childNodes[1]);
            this.is(false, checkNode(node));
          }
        },
        {
          name: 'grouping & dataSource',
          test: [
            {
              name: 'childNodes + group dataset',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: getTestSet()
                });

                node.setGrouping({
                  rule: 'data.groupObj',
                  dataSource: groupDatasetByGroup
                });
                this.is(false, checkNode(node));

                node.setGrouping();
                this.is(false, checkNode(node));

                node.setGrouping({
                  rule: 'data.groupObj',
                  dataSource: groupDatasetByGroup
                });
                this.is(false, checkNode(node));

                node.grouping.setDataSource();
                this.is(false, checkNode(node));
              }
            },
            {
              name: 'childNodes + group dataset #2',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: getTestSet(),
                  grouping: {
                    rule: 'data.groupObj'
                  }
                });
                this.is(false, checkNode(node));

                node.grouping.setDataSource(groupDatasetByGroup);
                this.is(false, checkNode(node));

                node.setGrouping();
                this.is(false, checkNode(node));

              }
            },
            {
              name: 'childNodes + empty group dataset + fill/clear the dataset',
              test: function(){
                var groupDataSource = new basis.data.Dataset();
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: getTestSet(),
                  grouping: {
                    rule: 'data.groupObj',
                    dataSource: groupDataSource
                  }
                });
                this.is(false, checkNode(node));

                groupDataSource.add(groupDatasetByGroup.getItems());
                this.is(false, checkNode(node));

                groupDataSource.clear();
                this.is(false, checkNode(node));
              }
            },
            {
              name: 'childNodes + empty group dataset + fill/clear the dataset + destroy dataset',
              test: function(){
                var groupDataSource = new basis.data.Dataset();
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: getTestSet(),
                  grouping: {
                    rule: 'data.groupObj',
                    dataSource: groupDataSource
                  }
                });
                this.is(false, checkNode(node));

                groupDataSource.add(groupDatasetByGroup.getItems());
                this.is(false, checkNode(node));

                groupDataSource.destroy();
                this.is(null, node.grouping.dataSource);
                this.is(4, node.grouping.childNodes.length);
                this.is(false, checkNode(node));

                var dataset2 = new basis.data.Dataset({ items: groupDatasetByGroup.getItems() });
                var itemCount = dataset2.itemCount;
                this.is(true, itemCount > 0);

                node.grouping.setDataSource(dataset2);
                this.is(dataset2, node.grouping.dataSource);
                this.is(itemCount, dataset2.itemCount);
                this.is(false, checkNode(node));

                node.clear();
                this.is(dataset2, node.grouping.dataSource);
                this.is(itemCount, dataset2.itemCount);
                this.is(0, node.childNodes.length);
                this.is(false, checkNode(node));
              }
            },
            {
              name: 'childNodes + group dataset 10',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: getTestSet()
                });

                node.setGrouping({
                  rule: 'data.groupObj',
                  dataSource: groupDatasetByGroup10
                });
                this.is(false, checkNode(node));

                node.setGrouping();
                this.is(false, checkNode(node));

                node.setGrouping({
                  rule: 'data.groupObj',
                  dataSource: groupDatasetByGroup10
                });
                this.is(false, checkNode(node));

                node.grouping.setDataSource();
                this.is(false, checkNode(node));

              }
            },
            {
              name: 'group dataset + child nodes on init',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: getTestSet(),
                  grouping: {
                    rule: 'data.groupObj',
                    dataSource: groupDatasetByGroup
                  }
                });
                this.is(false, checkNode(node));

                node.setGrouping();
                this.is(false, checkNode(node));

              }
            },
            {
              name: 'group dataset + child nodes after init',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  grouping: {
                    rule: 'data.groupObj',
                    dataSource: groupDatasetByGroup
                  }
                });
                this.is(false, checkNode(node));

                node.setChildNodes(getTestSet());
                this.is(false, checkNode(node));

                node.setChildNodes();
                this.is(false, checkNode(node));
              }
            },
            {
              name: 'set grouping and remove grouping with nullGroup',
              test: function(){
                var node = new Node({
                  childFactory: nodeFactory,
                  childNodes: basis.array.create(10, basis.fn.$self),
                  grouping: {
                    rule: 'data.value',
                    dataSource: new basis.data.Dataset(),
                    autoDestroyWithNoOwner: false
                  }
                });
                var grouping = node.grouping;

                this.is(false, checkNode(node));
                this.is(false, checkNode(grouping));
                this.is(10, node.childNodes.length);
                this.is(10, grouping.nullGroup.nodes.length);

                node.setGrouping();
                this.is(false, checkNode(node));
                this.is(false, checkNode(grouping));
                this.is(10, node.childNodes.length);
                this.is(0, grouping.nullGroup.nodes.length);
              }
            }
          ]
        }
      ]
    }
  ]
};
