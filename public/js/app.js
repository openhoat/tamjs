$(function () {
  var socket;

  function StringBuffer() {
    this.buffer = [];
  }

  StringBuffer.prototype.append = function append(string) {
    this.buffer.push(string);
    return this;
  };
  StringBuffer.prototype.toString = function toString() {
    return this.buffer.join('');
  };

  function truncateTweets() {
    var maxTweets = $('#maxTweets').val();
    while ($('#tweets > ul > li').length > maxTweets) {
      $('#tweets > ul > li:last').remove();
    }
  }

  function notify(title, msg) {
    if (title) {
      $('#notifyContainer .title').text(title);
    }
    $('#notifyContainer .message').text(msg);
    $('#notifyContainer > .alert').show();
    window.setTimeout(function () {
      $('#notifyContainer > .alert').hide();
    }, 2000);
  }

  function init() {
    $('#notifyContainer .close').click(function () {
      $('#notifyContainer > .alert').hide();
    });
    $('#criteriaForm').submit(function () {
      socket.emit('criteria', {
        place:$('#place').val(),
        distance:$('#distance').val(),
        keywords:$('#keywords').val()
      });
      socket.emit('tweetStream', false);
      notify('Info', 'Change done.');
      return false;
    });
    $('#streamingSwitch').on('switch-change', function (e, data) {
      var active = data.value;
      if (active) {
        $('#tweets > ul').empty();
        socket.emit('tweetStream', true);
        notify('Info', 'Waiting for new tweets...');
      } else {
        socket.emit('tweetStream', false);
        notify('Info', 'Tweets streaming stopped.');
      }
    });
    $('#maxTweets').change(function () {
      truncateTweets();
      return false;
    });
    $('#mapLink').click(function () {
      var url = 'https://maps.google.com/maps';
      url += '?q=loc:';
      url += $('#latitude').text();
      url += '+';
      url += $('#longitude').text();
      window.open(url, 'Google Map');
    });
  }

  function initTracking() {
    var watchId = null;
    if (!navigator.geolocation) {
      $('#trackingControlGroup').hide();
      socket.emit('location');
      return false;
    }
    $('#trackingSwitch').on('switch-change', function (e, data) {
      var fields = $('#critertiaFields input, #critertiaFields button')
        , active = data.value;
      if (active) {
        fields.attr('disabled', 'disabled');
        watchId = navigator.geolocation.watchPosition(function (position) {
          socket.emit('location', {
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
          });
        }, function (error) {
          socket.emit('location');
        }, {enableHighAccuracy:true, maximumAge:30000, timeout:27000});
      } else {
        fields.removeAttr('disabled', 'disabled');
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
      }
    });
    navigator.geolocation.getCurrentPosition(function (position) {
      socket.emit('location', {
        latitude:position.coords.latitude,
        longitude:position.coords.longitude
      });
    }, function (error) {
      socket.emit('location');
    });
    return true;
  }

  function initSocket() {
    socket = io.connect(window.location.origin);

    socket.on('transport', function (transport) {
      console.log('web sockets transport mode :', transport);
    });

    socket.on('client', function (client) {
      $('#latitude').text(client.location.latitude || '');
      $('#longitude').text(client.location.longitude || '');
      $('#number').text(client.address.number || '');
      $('#street').text(client.address.street || '');
      $('#city').text(client.address.city || '');
      $('#region').text(client.address.region || '');
      $('#country').text(client.address.country || '');
      $('#place').val((client.location.latitude + ',' + client.location.longitude) || '');
    });

    socket.on('tweet', function (tweet) {
      var buffer = new StringBuffer()
        , content
        , noTweets = $('#tweets > ul > li').length;
      buffer.append('<li>');
      buffer.append('<div class="image">');
      buffer.append('<img src="');
      buffer.append(tweet.user.image);
      buffer.append('">');
      buffer.append('</div>');
      buffer.append('<div class="content">');
      buffer.append('<div class="header">');
      buffer.append('<span class="account">@');
      buffer.append(tweet.user.account);
      buffer.append('</span>');
      buffer.append(' ');
      buffer.append('<span class="name">');
      buffer.append(tweet.user.name);
      buffer.append('</span>');
      buffer.append(' ');
      buffer.append('<div class="created">');
      buffer.append(tweet.created);
      buffer.append('</div>');
      buffer.append('</div>');
      buffer.append('<p class="text">');
      buffer.append(tweet.text);
      buffer.append('</p>');
      buffer.append('</div>');
      buffer.append('<div class="location clear">');
      buffer.append(tweet.user.location);
      buffer.append('</div>');
      buffer.append('</li>');
      content = buffer.toString();
      if (noTweets) {
        $(content).insertBefore('#tweets > ul > li:first-child');
      } else {
        $('#tweets > ul').append(content);
      }
      truncateTweets();
    });
  }

  init();
  initTracking();
  initSocket();
});