module.exports = {
  name: 'basis.data.Object',

  init: function(){
    basis.require('basis.event');
    basis.require('basis.data');

    var nsData = basis.data;
    var DataObject = nsData.Object;

    (function(){
      var proto = basis.data.Object.prototype;
      var eventsMap = {};
      var seed = 1;
      var eventTypeFilter = function(event){
        return event.type == this;
      };

      proto.debug_emit = function(event){
        if (!this.testEventId_)
        {
          this.testEventId_ = seed++;
          eventsMap[this.testEventId_] = [];
        }

        eventsMap[this.testEventId_].push(event);
      };

      window.getEvents = function(object, type){
        var events = eventsMap[object.testEventId_];

        if (events && type)
          events = events.filter(eventTypeFilter, type);

        return events;
      };

      window.eventCount = function(object, type){
        var events = getEvents(object, type);

        return events ? events.length : 0;
      };

      window.getLastEvent = function(object, type){
        var events = getEvents(object, type);

        return events && events[events.length - 1];
      };
    })();

    function checkObject(object){

      if (object.delegate)
      {
        var chain = [];
        var cursor = object;
        while (cursor.delegate && cursor.delegate !== cursor)
        {
          cursor = cursor.delegate;
          chain.unshift(cursor);
        }

        var target = null;
        var root = chain[0];

        for (var i = 0, chainObject; chainObject = chain[i]; i++)
        {
          if (chainObject === chainObject.target)
            target = chainObject.target;

          if (chainObject.data !== object.data)
            return 'Data are not equal in chain (' + (i + 1) + ')';

          if (chainObject.state !== object.state)
            return 'States are not equal in chain (' + (i + 1) + ')';

          if (chainObject.root !== root)
            return 'Wrong root reference in chain (' + (i + 1) + ')';

          if (chainObject.target !== target)
            return 'Wrong target referece in chain (' + (i + 1) + ')';
        }

        if (object.root !== root)
          return 'Wrong root reference';
      }
      else
      {
        if (object.root !== object)
          return 'root must point to it self';
        if (object.target !== null)
          return 'target must point to it self';
      }

      return false;
    }
  },

  test: [
    {
      name: 'construct',
      test: [
        {
          name: 'simple create',
          test: function(){
            var objectA = new DataObject;
            this.is({}, objectA.data);
            this.is(0, eventCount(objectA));

            var objectB = new DataObject({ data: { a: 1, b: 2 } });
            this.is({ a: 1, b: 2 }, objectB.data);
            this.is(0, eventCount(objectB));
            this.is(0, eventCount(objectB));
          }
        },
        {
          name: 'create with delegate',
          test: function(){
            var objectA = new DataObject({ data: { a: 1, b: 2 } });
            var objectB = new DataObject({ data: { a: 3, b: 4 }, delegate: objectA });
            this.is({ a: 1, b: 2 }, objectA.data);
            this.is({ a: 1, b: 2 }, objectB.data);
            this.is(true, objectA.data === objectB.data);
            this.is(true, objectA.state === objectB.state);
            this.is(0, eventCount(objectA));
            this.is(0, eventCount(objectB, 'update'));
            this.is(1, eventCount(objectB, 'delegateChanged'));

            this.is(false, checkObject(objectA));
            this.is(false, checkObject(objectB));

            objectB.setDelegate();
            this.is({ a: 1, b: 2 }, objectB.data);
            this.is(0, eventCount(objectB, 'update'));
            this.is(false, checkObject(objectA));
            this.is(false, checkObject(objectB));
          }
        }
      ]
    },
    {
      name: 'delegate subsystem',
      test: [
        {
          name: 'set delegate',
          test: [
            {
              name: 'set delegate #1',
              test: function(){
                var a = new DataObject({ data: { a: 1, b: 2 } });
                var b = new DataObject({ data: { b: 2, c: 3 } });

                this.is(0, eventCount(b, 'update'));

                b.setDelegate(a);
                this.is(1, eventCount(b, 'update'));
                this.is({ a: undefined, c: 3 }, getLastEvent(b, 'update').args[0]);
              }
            },
            {
              name: 'set delegate #2',
              test: function(){
                var objectA = new DataObject({ data: { a: 1, b: 2, c: 3 } });
                var objectB = new DataObject({ data: { a: 1, b: 2, c: 3 } });
                var objectC = new DataObject({ data: { x: 1, y: 2, z: 3 } });

                objectA.setDelegate(objectB); // no update event
                this.is({ a: 1, b: 2, c: 3 }, objectA.data);
                this.is(0, eventCount(objectA, 'update'));
                this.is(0, eventCount(objectB, 'update'));

                objectA.setDelegate(objectC);
                this.is({ x: 1, y: 2, z: 3 }, objectA.data);
                this.is(1, eventCount(objectA, 'update'));
                this.is({ a: 1, b: 2, c: 3, x: undefined, y: undefined, z: undefined }, getLastEvent(objectA, 'update').args[0]);

                objectA.setDelegate(objectB);
                this.is({ a: 1, b: 2, c: 3 }, objectA.data);
                this.is(2, eventCount(objectA, 'update'));
                this.is({ a: undefined, b: undefined, c: undefined, x: 1, y: 2, z: 3 }, getLastEvent(objectA, 'update').args[0]);

                objectA.setDelegate();
                this.is({ a: 1, b: 2, c: 3 }, objectA.data);
                //this.is(3, objectA.history_.last());
                this.is(2, eventCount(objectA, 'update'));
              }
            },
            {
              name: 'set delegate #3',
              test: function(){
                var objectA = new DataObject({ data: { a: 1, b: 2, c: 3 } });
                var objectB = new DataObject({ data: { a: 1, b: 2, c: 3 } });
                var objectC = new DataObject({ data: { x: 1, y: 2, z: 3 } });
                // data tested in previous test, see above

                objectA.setDelegate(objectB);
                this.is(true, objectA.delegate === objectB);
                this.is({ a: 1, b: 2, c: 3 }, objectA.data);
                this.is(0, eventCount(objectA, 'update'));
                this.is(1, eventCount(objectA, 'delegateChanged'));
                this.is(false, checkObject(objectA));
                this.is(false, checkObject(objectB));

                objectB.setDelegate(objectC);
                this.is(true, objectB.delegate === objectC);
                this.is({ x: 1, y: 2, z: 3 }, objectA.data);
                this.is(1, eventCount(objectA, 'update'));
                this.is({ a: 1, b: 2, c: 3, x: undefined, y: undefined, z: undefined }, getLastEvent(objectA, 'update').args[0]);
                this.is(1, eventCount(objectA, 'delegateChanged'));
                this.is(false, checkObject(objectA));
                this.is(false, checkObject(objectB));
                this.is(false, checkObject(objectC));

                objectB.setDelegate();
                this.is(true, objectB.delegate == null);
                this.is({ x: 1, y: 2, z: 3 }, objectA.data);
                this.is(true, objectB.data !== objectC.data);
                this.is(1, eventCount(objectA, 'update'));
                this.is(1, eventCount(objectA, 'delegateChanged'));
                this.is(2, eventCount(objectB, 'delegateChanged'));
                this.is(false, checkObject(objectA));
                this.is(false, checkObject(objectB));
                this.is(false, checkObject(objectC));

                objectA.setDelegate();
                this.is(true, objectA.delegate == null);
                this.is({ x: 1, y: 2, z: 3 }, objectA.data);
                this.is(1, eventCount(objectA, 'update'));
                this.is(2, eventCount(objectA, 'delegateChanged'));
                this.is(false, checkObject(objectA));
                this.is(false, checkObject(objectB));
              }
            },
            {
              name: 'set delegate #4',
              test: function(){
                var objectB = new DataObject({ data: { a: 1, b: 2, c: 3 } });
                var objectC = new DataObject({ data: { x: 1, y: 2, z: 3 } });
                // data tested in previous test, see above

                objectB.setDelegate(objectC);
                this.is(true, objectB.delegate === objectC);
                this.is({ x: 1, y: 2, z: 3 }, objectB.data);
                this.is(1, eventCount(objectB, 'update'));
                this.is({ a: 1, b: 2, c: 3, x: undefined, y: undefined, z: undefined }, getLastEvent(objectB, 'update').args[0]);
                this.is(1, eventCount(objectB, 'delegateChanged'));

                objectB.setDelegate('not a delegate');
                this.is(true, objectB.delegate === null);
                this.is({ x: 1, y: 2, z: 3 }, objectB.data);
                this.is(1, eventCount(objectB, 'update'));
                this.is(2, eventCount(objectB, 'delegateChanged'));

                objectB.setDelegate('not a delegate #2');
                this.is(true, objectB.delegate === null);
                this.is({ x: 1, y: 2, z: 3 }, objectB.data);
                this.is(1, eventCount(objectB, 'update'));
                this.is(2, eventCount(objectB, 'delegateChanged'));

                objectB.setDelegate(objectC);
                this.is(true, objectB.delegate === objectC);
                this.is({ x: 1, y: 2, z: 3 }, objectB.data);
                this.is(1, eventCount(objectB, 'update'));
                this.is(3, eventCount(objectB, 'delegateChanged'));
              }
            },
            {
              name: 'destroy',
              test: function(){
                var destroyCatched = 0;
                var a = new basis.data.Object({ target: true });
                var b = new basis.data.Object({
                  delegate: a,
                  listen: {
                    delegate: {
                      destroy: function(){
                        destroyCatched++;
                      }
                    }
                  }
                });
                var c = new basis.data.Object({
                  delegate: b,
                  listen: {
                    root: {
                      destroy: function(){
                        destroyCatched++;
                      }
                    },
                    target: {
                      destroy: function(){
                        destroyCatched++;
                      }
                    }
                  }
                });

                a.setState(basis.data.STATE.READY, 'ok');
                this.is(String(basis.data.STATE.READY), String(c.state));
                this.is('ok', c.state.data);
                this.is(true, c.delegate === b);
                this.is(true, c.target === a);
                this.is(true, c.root === a);

                a.destroy();
                this.is(String(basis.data.STATE.READY), String(c.state));
                this.is('ok', c.state.data);
                this.is(null, c.target);
                this.is(true, c.root === b);
                this.is(null, b.delegate);
                this.is(3, destroyCatched);
              }
            }
          ]
        },
        {
          name: 'sets with no data',
          test: function(){
            var objectA = new DataObject;
            var objectB = new DataObject;

            this.is(0, eventCount(objectA, 'update')); // should be no update events

            objectA.setDelegate(objectB); // no update event
            this.is(true, objectA.delegate === objectB);
            this.is(true, objectA.data === objectB.data);
            this.is({}, objectA.data);

            this.is(0, eventCount(objectA, 'update')); // should be no update events

            objectA.setDelegate(); // no update event
            this.is(true, objectA.delegate === null);
            this.is(true, objectA.data !== objectB.data);
            this.is({}, objectA.data);

            this.is(0, eventCount(objectA, 'update')); // should be no update events
          }
        },
        {
          name: 'set as delegate connected objects',
          test: function(){
            var objectA = new DataObject;
            var objectB = new DataObject;
            var objectC = new DataObject;

            objectA.setDelegate(objectB);
            this.is(true, objectA.delegate === objectB);

            objectB.setDelegate(objectC);
            this.is(true, objectB.delegate === objectC);

            objectC.setDelegate(objectA); // should be ignored
            this.is(true, objectC.delegate === null);
            this.is(true, basis.data.isConnected(objectC, objectA));

            objectA.setDelegate(objectC);
            this.is(true, objectA.delegate === objectC);
            this.is(true, basis.data.isConnected(objectC, objectA));
            this.is(true, basis.data.isConnected(objectC, objectB));
            this.is(false, basis.data.isConnected(objectB, objectA));
            this.is(false, basis.data.isConnected(objectB, objectC));
          }
        },
        {
          name: 'delegate drop should not affect other storing delegates (issue #12)',
          test: function(){
            var a = new DataObject;
            var b = new DataObject;
            var c = new DataObject;

            a.setDelegate(c);
            b.setDelegate(c);
            var delegates = c.debug_delegates();
            assert(delegates.length == 2);
            assert(basis.array.has(delegates, a) == true);
            assert(basis.array.has(delegates, b) == true);

            a.setDelegate();
            var delegates = c.debug_delegates();
            assert(delegates.length == 1);
            assert(basis.array.has(delegates, a) == false);
            assert(basis.array.has(delegates, b) == true);
          }
        },
        {
          name: 'delegates added on update should recieve just one update event',
          test: function(){
            var delegateEventCount = 0;
            var object = new DataObject({
              handler: {
                update: function(){
                  delegate.setDelegate(this);
                }
              }
            });
            var delegate = new DataObject({
              handler: {
                update: function(){
                  delegateEventCount++;
                }
              }
            });

            this.is(0, delegateEventCount);

            object.update({ foo: 1 });

            this.is(1, delegateEventCount);
          }
        },
        {
          name: 'delegates removed on update should not recieve update event',
          test: function(){
            var delegateEventCount = 0;
            var object = new DataObject({
              handler: {
                update: function(){
                  delegate.setDelegate();
                }
              }
            });
            var delegate = new DataObject({
              delegate: object,
              handler: {
                update: function(){
                  delegateEventCount++;
                }
              }
            });

            this.is(0, delegateEventCount);

            object.update({ foo: 1 });

            this.is(0, delegateEventCount);
          }
        },
        {
          name: 'delegates added on stateChanged should recieve just one stateChanged event',
          test: function(){
            var delegateEventCount = 0;
            var object = new DataObject({
              state: basis.data.STATE.UNDEFINED,
              handler: {
                stateChanged: function(){
                  delegate.setDelegate(this);
                }
              }
            });
            var delegate = new DataObject({
              state: basis.data.STATE.UNDEFINED,
              handler: {
                stateChanged: function(){
                  delegateEventCount++;
                }
              }
            });

            this.is(0, delegateEventCount);

            object.setState(basis.data.STATE.READY);

            this.is(1, delegateEventCount);
          }
        },
        {
          name: 'delegates removed on stateChanged should not recieve stateChanged event',
          test: function(){
            var delegateEventCount = 0;
            var object = new DataObject({
              state: basis.data.STATE.UNDEFINED,
              handler: {
                stateChanged: function(){
                  delegate.setDelegate();
                }
              }
            });
            var delegate = new DataObject({
              state: basis.data.STATE.UNDEFINED,
              delegate: object,
              handler: {
                stateChanged: function(){
                  delegateEventCount++;
                }
              }
            });

            this.is(0, delegateEventCount);

            object.setState(basis.data.STATE.READY);

            this.is(0, delegateEventCount);
          }
        }
      ]
    },
    {
      name: 'subscription subsystem',
      test: [
        {
          name: '(delegate) during creation',
          test: function(){
            var objectA = new DataObject;
            new DataObject({
              delegate: objectA,
              active: true,
              subscribeTo: nsData.SUBSCRIPTION.DELEGATE
            });

            this.is(1, objectA.subscriberCount);
            this.is(1, eventCount(objectA, 'subscribersChanged'));
          }
        },
        {
          name: '(delegate) switch on/off via active',
          test: function(){
            var objectA = new DataObject;
            var objectB = new DataObject({
              active: false,
              subscribeTo: nsData.SUBSCRIPTION.DELEGATE
            });

            this.is(0, objectA.subscriberCount);
            this.is(0, eventCount(objectA, 'subscribersChanged'));

            objectB.setDelegate(objectA);

            this.is(0, objectA.subscriberCount);
            this.is(0, eventCount(objectA, 'subscribersChanged'));

            // switch on
            objectB.setActive(true);

            this.is(1, objectA.subscriberCount);
            this.is(1, eventCount(objectA, 'subscribersChanged'));

            // nothing changed
            objectB.setActive(true);

            this.is(1, objectA.subscriberCount);
            this.is(1, eventCount(objectA, 'subscribersChanged'));

            // switch off
            objectB.setActive(false);

            this.is(0, objectA.subscriberCount);
            this.is(2, eventCount(objectA, 'subscribersChanged'));
          }
        },
        {
          name: '(delegate) switch on/off via subscribeTo',
          test: function(){
            var objectA = new DataObject;
            var objectB = new DataObject({
              active: true,
              subscribeTo: nsData.SUBSCRIPTION.NONE
            });

            this.is(0, objectA.subscriberCount);
            this.is(0, eventCount(objectA, 'subscribersChanged'));

            objectB.setDelegate(objectA);

            this.is(0, objectA.subscriberCount);
            this.is(0, eventCount(objectA, 'subscribersChanged'));

            // switch on
            objectB.setSubscription(nsData.SUBSCRIPTION.DELEGATE);

            this.is(1, objectA.subscriberCount);
            this.is(1, eventCount(objectA, 'subscribersChanged'));

            // nothing changed
            objectB.setSubscription(nsData.SUBSCRIPTION.DELEGATE);

            this.is(1, objectA.subscriberCount);
            this.is(1, eventCount(objectA, 'subscribersChanged'));

            // switch off
            objectB.setSubscription(nsData.SUBSCRIPTION.NONE);

            this.is(0, objectA.subscriberCount);
            this.is(2, eventCount(objectA, 'subscribersChanged'));
          }
        },
        {
          name: '(delegate) unsubscribe on destroy',
          test: function(){
            var objectA = new DataObject;
            var objectB = new DataObject({
              active: true,
              subscribeTo: nsData.SUBSCRIPTION.DELEGATE,
              delegate: objectA
            });

            this.is(1, objectA.subscriberCount);
            this.is(1, eventCount(objectA, 'subscribersChanged'));

            objectB.destroy();

            this.is(0, objectA.subscriberCount);
            this.is(2, eventCount(objectA, 'subscribersChanged'));
          }
        }
      ]
    }
  ]
};
