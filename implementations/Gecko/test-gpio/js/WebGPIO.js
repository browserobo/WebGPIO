'use strict';

navigator.requestGPIOAccess = function() {
  return new Promise(function(resolve, reject) {
    if (!navigator.mozGpio) {
      navigator.mozGpio = new Object();
      navigator.mozGpio.export = function(portno) {
      };
      navigator.mozGpio.unexport = function(portno) {
      };
      navigator.mozGpio.setValue = function(portno, value) {
        console.log('setValue(' + portno + ',' + value + ')');
      };
      navigator.mozGpio.getValue = function(portno) {
        return portno;
      };
      navigator.mozGpio.setDirection = function(portno, direction) {
        console.log('setDirection(' + portno + ',' + direction + ')');
      };
      navigator.mozGpio.getDirection = function() {
        return 'out'
      };
    }

    var gpioAccess = new GPIOAccess()
    resolve(gpioAccess);
  });
}

function GPIOAccess() {
  this.init();
}

GPIOAccess.prototype = {
  init: function() {
    this.ports = new Map();

    navigator.mozGpio.export(198);
    /* XXX: workaround */
    var start = new Date();
    while(new Date() - start < 1000);

    navigator.mozGpio.export(199);

    this.ports.set(198 - 0, new GPIOPort(198));
    this.ports.set(199 - 0, new GPIOPort(199));
    console.log('size=' + this.ports.size);
  }
};

function GPIOPort(portNumber) {
  this.init(portNumber);
}

GPIOPort.prototype = {
  init: function(portNumber) {
    this.portNumber = portNumber;
    this.direction = 'out';
  },

  setDirection: function(direction) {
    return new Promise(function(resolve, reject) {
      if (direction === 'in' || direction === 'out') {
        this.direction = direction;
        navigator.mozGpio.setDirection(this.portNumber, direction === 'out');
        resolve();
      } else {
        reject({'message':'invalid direction'});
      }
    }.bind(this));
  },

  isInput: function() {
    return this.direction === 'in';
  },

  read: function() {
    return new Promise(function(resolve, reject) {
      if (this.isInput()) {
        resolve(navigator.mozGpio.getValue(this.portNumber));
      } else {
        reject({'message':'invalid direction'});
      }
    }.bind(this));
  },

  write: function(value) {
    return new Promise(function(resolve, reject) {
      if (this.isInput()) {
        reject({'message':'invalid direction'});
      } else {
        navigator.mozGpio.setValue(this.portNumber, value);
        resolve(value);
      }
    }.bind(this));
  }
};

window.addEventListener('load', function (){
  navigator.requestGPIOAccess().then(
    function(gpioAccess) {
      var portno_select = document.getElementById('portno_select');
      var direction_select = document.getElementById('direction_select');
      var ports = gpioAccess.ports;

      var keyIterator = ports.keys();
      while (true) {
        var key = keyIterator.next();
        if (key.done)
          break;
        var option = document.createElement('option');
        option.value = key.value;
        option.text = key.value;
        portno_select.appendChild(option);
        //console.log(key.value);
      }
      portno_select.addEventListener('change', function (){
        var port = ports.get(portno_select.options[portno_select.selectedIndex].value - 0);
        direction_select.selectedIndex = port.isInput() ? 1 : 0;
      });

      var valueIterator = ports.values();
      console.log(valueIterator.next());

      ports.forEach(function(value, key, map) {
        console.log(key);
      });

      direction_select.addEventListener('change', function (){
        var port = ports.get(portno_select.options[portno_select.selectedIndex].value - 0);
        var _dir = direction_select.options[direction_select.selectedIndex].value;
        if (_dir == 'in') {
          if (port.isInput())
            return;
        } else {
          if (!port.isInput())
            return;
        }
        port.setDirection(_dir).then(
          function() { console.log('setDirection:' + _dir); },
          function(error) { console.log(error.message); }
        );
      });

      var gpioReadButton = document.getElementById('gpioReadButton');
      gpioReadButton.addEventListener('click', function (){
        var port = ports.get(portno_select.options[portno_select.selectedIndex].value - 0);
        port.read().then(
          function(value) {
            console.log('read ' + value + ' from port ' + port.portNumber);
            var message = document.getElementById('message').innerHTML = value;
          },
          function(error) { console.log(error.message); }
        );
      });

      var gpioOnButton = document.getElementById('gpioOnButton');
      gpioOnButton.addEventListener('click', function (){
        var port = ports.get(portno_select.options[portno_select.selectedIndex].value - 0);
        port.write(1).then(
          function(value) { console.log('write ' + value + ' to port ' + port.portNumber); },
          function(error) { console.log(error.message); }
        );
      });

      var gpioOffButton = document.getElementById('gpioOffButton');
      gpioOffButton.addEventListener('click', function (){
        var port = ports.get(portno_select.options[portno_select.selectedIndex].value - 0);
        port.write(0).then(
          function(value) { console.log('write ' + value + ' to port ' + port.portNumber); },
          function(error) { console.log(error.message); }
        );
      });
    },
    function(error) {
      console.log(error.message);
    }
  );
});
