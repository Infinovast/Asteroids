// 游戏配置
var GameConfig = {
  width: 1280,      // 窗体宽 1.6x 800
  height: 960,      // 窗体高 1.6x 600
  startLives: 6,    // 初始生命值
  startAsteroids: 6, // 初始陨石数量

  bulletSpeed: 17,   // 子弹速度
  bulletLifetime: 40, // 子弹寿命（帧数）
  alienBulletLifetime: 55, // 外星子弹寿命（帧数）
  missileSpeed: 25,  // 导弹速度
  missileLifetime: 25, // 导弹寿命（帧数）
  missileTrackingRange: 150, // 导弹追踪范围
  missileTurnRate: 13 // 导弹转向速度
};

// 输入映射到游戏动作
var KEY_CODES = {
  27: 'pause',      // Esc键暂停
  32: 'space',      // Space键射击
  37: 'left',       // 左键左旋转
  38: 'up',         // 上键推进
  39: 'right',      // 右键右旋转
  40: 'down',       // 下键刹车
  65: 'left',       // A键左旋转
  68: 'right',      // D键右旋转
  83: 'down',       // S键刹车
  87: 'up',         // W键推进
  70: 'framerate',  // F键切换帧率显示（调试）
  71: 'grid',       // G键按住显示网格（调试）
  77: 'mute',       // M键静音
  80: 'pause',      // P键暂停
  81: 'missile',    // Q键导弹
  90: 'missile'     // Z键导弹
}

// 记录动作按下状态
var KEY_STATUS = {};
for (var code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}

// 监听按键状态用于实时控制
window.addEventListener('keydown', function (e) {
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = true;
  }
});
window.addEventListener('keyup', function (e) {
  if (KEY_CODES[e.keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[e.keyCode]] = false;
  }
});

// 空间网格尺寸，用于碰撞分区
GRID_SIZE = 60;

// 2x3 变换矩阵工具
Matrix = function (rows, columns) {
  var i, j;
  this.data = new Array(rows);
  for (i = 0; i < rows; i++) {
    this.data[i] = new Array(columns);
  }

  this.configure = function (rot, scale, transx, transy) {
    var rad = (rot * Math.PI) / 180;
    var sin = Math.sin(rad) * scale;
    var cos = Math.cos(rad) * scale;
    this.set(cos, -sin, transx,
      sin, cos, transy);
  };

  this.set = function () {
    var k = 0;
    for (i = 0; i < rows; i++) {
      for (j = 0; j < columns; j++) {
        this.data[i][j] = arguments[k];
        k++;
      }
    }
  }

  this.multiply = function () {
    var vector = new Array(rows);
    for (i = 0; i < rows; i++) {
      vector[i] = 0;
      for (j = 0; j < columns; j++) {
        vector[i] += this.data[i][j] * arguments[j];
      }
    }
    return vector;
  };
};

// 精灵基类：变换、移动、碰撞
Sprite = function () {
  this.init = function (name, points) {
    this.name = name;
    this.points = points;

    this.vel = {
      x: 0,
      y: 0,
      rot: 0
    };

    this.acc = {
      x: 0,
      y: 0,
      rot: 0
    };
  };

  this.children = {};

  this.visible = false;
  this.reap = false;
  this.bridgesH = true;
  this.bridgesV = true;

  this.collidesWith = [];

  this.x = 0;
  this.y = 0;
  this.rot = 0;
  this.scale = 1;

  this.currentNode = null;
  this.nextSprite = null;

  this.preMove = null;
  this.postMove = null;

  // 单次更新+绘制并做碰撞检测
  this.run = function (delta) {

    this.move(delta);
    this.updateGrid();

    this.context.save();
    this.configureTransform();
    this.draw();

    var canidates = this.findCollisionCanidates();

    this.matrix.configure(this.rot, this.scale, this.x, this.y);
    this.checkCollisionsAgainst(canidates);

    this.context.restore();

    // 边缘穿越时绘制/检测镜像
    if (this.bridgesH && this.currentNode && this.currentNode.dupe.horizontal) {
      this.x += this.currentNode.dupe.horizontal;
      this.context.save();
      this.configureTransform();
      this.draw();
      this.checkCollisionsAgainst(canidates);
      this.context.restore();
      if (this.currentNode) {
        this.x -= this.currentNode.dupe.horizontal;
      }
    }
    if (this.bridgesV && this.currentNode && this.currentNode.dupe.vertical) {
      this.y += this.currentNode.dupe.vertical;
      this.context.save();
      this.configureTransform();
      this.draw();
      this.checkCollisionsAgainst(canidates);
      this.context.restore();
      if (this.currentNode) {
        this.y -= this.currentNode.dupe.vertical;
      }
    }
    if (this.bridgesH && this.bridgesV &&
      this.currentNode &&
      this.currentNode.dupe.vertical &&
      this.currentNode.dupe.horizontal) {
      this.x += this.currentNode.dupe.horizontal;
      this.y += this.currentNode.dupe.vertical;
      this.context.save();
      this.configureTransform();
      this.draw();
      this.checkCollisionsAgainst(canidates);
      this.context.restore();
      if (this.currentNode) {
        this.x -= this.currentNode.dupe.horizontal;
        this.y -= this.currentNode.dupe.vertical;
      }
    }
  };
  // 应用加速度、速度与旋转
  this.move = function (delta) {
    if (!this.visible) return;
    this.transPoints = null; // 清空缓存点

    if (typeof this.preMove === 'function') {
      this.preMove(delta);
    }

    this.vel.x += this.acc.x * delta;
    this.vel.y += this.acc.y * delta;
    this.x += this.vel.x * delta;
    this.y += this.vel.y * delta;
    this.rot += this.vel.rot * delta;
    if (this.rot > 360) {
      this.rot -= 360;
    } else if (this.rot < 0) {
      this.rot += 360;
    }

    if (typeof this.postMove === 'function') {
      this.postMove(delta);
    }
  };
  // 更新网格位置用于粗略碰撞
  this.updateGrid = function () {
    if (!this.visible) return;
    var gridx = Math.floor(this.x / GRID_SIZE);
    var gridy = Math.floor(this.y / GRID_SIZE);
    gridx = (gridx >= this.grid.length) ? 0 : gridx;
    gridy = (gridy >= this.grid[0].length) ? 0 : gridy;
    gridx = (gridx < 0) ? this.grid.length - 1 : gridx;
    gridy = (gridy < 0) ? this.grid[0].length - 1 : gridy;
    var newNode = this.grid[gridx][gridy];
    if (newNode != this.currentNode) {
      if (this.currentNode) {
        this.currentNode.leave(this);
      }
      newNode.enter(this);
      this.currentNode = newNode;
    }

    // 可选网格调试显示
    if (KEY_STATUS.grid && this.currentNode) {
      this.context.lineWidth = 3.0;
      this.context.strokeStyle = 'green';
      this.context.strokeRect(gridx * GRID_SIZE + 2, gridy * GRID_SIZE + 2, GRID_SIZE - 4, GRID_SIZE - 4);
      this.context.strokeStyle = 'black';
      this.context.lineWidth = 1.0;
    }
  };
  this.configureTransform = function () {
    if (!this.visible) return;

    var rad = (this.rot * Math.PI) / 180;

    this.context.translate(this.x, this.y);
    this.context.rotate(rad);
    this.context.scale(this.scale, this.scale);
  };
  this.draw = function () {
    if (!this.visible) return;

    this.context.lineWidth = 1.0 / this.scale;

    for (child in this.children) {
      this.children[child].draw();
    }

    this.context.beginPath();

    this.context.moveTo(this.points[0], this.points[1]);
    for (var i = 1; i < this.points.length / 2; i++) {
      var xi = i * 2;
      var yi = xi + 1;
      this.context.lineTo(this.points[xi], this.points[yi]);
    }

    this.context.closePath();
    this.context.stroke();
  };
  // 只检查邻近格子减少碰撞
  this.findCollisionCanidates = function () {
    if (!this.visible || !this.currentNode) return [];
    var cn = this.currentNode;
    var canidates = [];
    if (cn.nextSprite) canidates.push(cn.nextSprite);
    if (cn.north.nextSprite) canidates.push(cn.north.nextSprite);
    if (cn.south.nextSprite) canidates.push(cn.south.nextSprite);
    if (cn.east.nextSprite) canidates.push(cn.east.nextSprite);
    if (cn.west.nextSprite) canidates.push(cn.west.nextSprite);
    if (cn.north.east.nextSprite) canidates.push(cn.north.east.nextSprite);
    if (cn.north.west.nextSprite) canidates.push(cn.north.west.nextSprite);
    if (cn.south.east.nextSprite) canidates.push(cn.south.east.nextSprite);
    if (cn.south.west.nextSprite) canidates.push(cn.south.west.nextSprite);
    return canidates
  };
  this.checkCollisionsAgainst = function (canidates) {
    for (var i = 0; i < canidates.length; i++) {
      var ref = canidates[i];
      do {
        this.checkCollision(ref);
        ref = ref.nextSprite;
      } while (ref)
    }
  };
  // 细碰撞：点在多边形内测试
  this.checkCollision = function (other) {
    if (!other.visible ||
      this == other ||
      this.collidesWith.indexOf(other.name) == -1) return;
    var trans = other.transformedPoints();
    var px, py;
    var count = trans.length / 2;
    for (var i = 0; i < count; i++) {
      px = trans[i * 2];
      py = trans[i * 2 + 1];
      var isHit = false;
      if (typeof this.context.isPointInPath === 'function') {
        isHit = this.context.isPointInPath(px, py);
      } else {
        isHit = this.pointInPolygon(px, py);
      }
      if (isHit) {
        other.collision(this);
        this.collision(other);
        return;
      }
    }
  };
  this.pointInPolygon = function (x, y) {
    var points = this.transformedPoints();
    var j = 2;
    var y0, y1;
    var oddNodes = false;
    for (var i = 0; i < points.length; i += 2) {
      y0 = points[i + 1];
      y1 = points[j + 1];
      if ((y0 < y && y1 >= y) ||
        (y1 < y && y0 >= y)) {
        if (points[i] + (y - y0) / (y1 - y0) * (points[j] - points[i]) < x) {
          oddNodes = !oddNodes;
        }
      }
      j += 2
      if (j == points.length) j = 0;
    }
    return oddNodes;
  };
  this.collision = function () {
  };
  this.die = function () {
    this.visible = false;
    this.reap = true;
    if (this.currentNode) {
      this.currentNode.leave(this);
      this.currentNode = null;
    }
  };
  this.transformedPoints = function () {
    if (this.transPoints) return this.transPoints;
    var trans = new Array(this.points.length);
    this.matrix.configure(this.rot, this.scale, this.x, this.y);
    for (var i = 0; i < this.points.length / 2; i++) {
      var xi = i * 2;
      var yi = xi + 1;
      var pts = this.matrix.multiply(this.points[xi], this.points[yi], 1);
      trans[xi] = pts[0];
      trans[yi] = pts[1];
    }
    this.transPoints = trans; // 缓存变换后的点
    return trans;
  };
  this.isClear = function () {
    if (this.collidesWith.length == 0) return true;
    var cn = this.currentNode;
    if (cn == null) {
      var gridx = Math.floor(this.x / GRID_SIZE);
      var gridy = Math.floor(this.y / GRID_SIZE);
      gridx = (gridx >= this.grid.length) ? 0 : gridx;
      gridy = (gridy >= this.grid[0].length) ? 0 : gridy;
      cn = this.grid[gridx][gridy];
    }
    return (cn.isEmpty(this.collidesWith) &&
      cn.north.isEmpty(this.collidesWith) &&
      cn.south.isEmpty(this.collidesWith) &&
      cn.east.isEmpty(this.collidesWith) &&
      cn.west.isEmpty(this.collidesWith) &&
      cn.north.east.isEmpty(this.collidesWith) &&
      cn.north.west.isEmpty(this.collidesWith) &&
      cn.south.east.isEmpty(this.collidesWith) &&
      cn.south.west.isEmpty(this.collidesWith));
  };
  // 屏幕穿越处理
  this.wrapPostMove = function () {
    if (this.x > Game.canvasWidth) {
      this.x = 0;
    } else if (this.x < 0) {
      this.x = Game.canvasWidth;
    }
    if (this.y > Game.canvasHeight) {
      this.y = 0;
    } else if (this.y < 0) {
      this.y = Game.canvasHeight;
    }
  };

};

// 玩家飞船：推进、旋转、射击
Ship = function () {
  this.init("ship",
    [-5, 4,
      0, -12,
      5, 4]);

  this.children.exhaust = new Sprite();
  this.children.exhaust.init("exhaust",
    [-3, 6,
      0, 11,
      3, 6]);

  this.bulletCounter = 0;
  this.missileCooldown = 0;
  this.thrustPlaying = false;

  this.postMove = this.wrapPostMove;

  this.collidesWith = ["asteroid", "bigalien", "alienbullet"];

  // 读取输入并转为旋转、推进和射击
  this.preMove = function (delta) {
    // 旋转控制
    if (KEY_STATUS.left) {
      this.vel.rot = -6;
    } else if (KEY_STATUS.right) {
      this.vel.rot = 6;
    } else {
      this.vel.rot = 0;
    }

    // 前进推进
    if (KEY_STATUS.up) {
      // 随机时间点开始播放推进音效
      if (!this.thrustPlaying && !SFX.muted) {
        var thrustAudio = SFX.thrust();
        try {
          thrustAudio.loop = true;
          if (thrustAudio.duration > 0) {
            thrustAudio.currentTime = Math.random() * thrustAudio.duration;
          }
          var playPromise = thrustAudio.play();
          if (playPromise !== undefined) {
            playPromise.catch(function () { });
          }
        } catch (e) { }
        this.thrustPlaying = true;
      }
      var rad = ((this.rot - 90) * Math.PI) / 180;
      this.acc.x = 0.5 * Math.cos(rad);
      this.acc.y = 0.5 * Math.sin(rad);
      this.children.exhaust.visible = Math.random() > 0.1;
      // 逆向刹车（弱于推进）
    }
    else if (KEY_STATUS.down) {
      // 停止推进音效
      if (this.thrustPlaying) {
        var thrustStopAudio = SFX.thrust();
        try {
          thrustStopAudio.pause();
          thrustStopAudio.currentTime = 0;
          thrustStopAudio.loop = false;
        } catch (e) { }
        this.thrustPlaying = false;
      }
      var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
      if (speed > 0) {
        var brakeAccel = 0.1;
        this.acc.x = -brakeAccel * (this.vel.x / speed);
        this.acc.y = -brakeAccel * (this.vel.y / speed);
      } else {
        this.acc.x = 0;
        this.acc.y = 0;
      }
      this.children.exhaust.visible = false;
    }
    else {
      // 停止推进音效
      if (this.thrustPlaying) {
        var thrustStopAudio = SFX.thrust();
        try {
          thrustStopAudio.pause();
          thrustStopAudio.currentTime = 0;
          thrustStopAudio.loop = false;
        } catch (e) { }
        this.thrustPlaying = false;
      }
      this.acc.x = 0;
      this.acc.y = 0;
      this.children.exhaust.visible = false;
    }

    // 射速限制
    if (this.bulletCounter > 0) {
      this.bulletCounter -= delta;
    }
    // 子弹从机头生成
    if (KEY_STATUS.space) {
      if (this.bulletCounter <= 0) {
        this.bulletCounter = 10;
        for (var i = 0; i < this.bullets.length; i++) {
          if (!this.bullets[i].visible) {
            SFX.laser();
            var bullet = this.bullets[i];
            var rad = ((this.rot - 90) * Math.PI) / 180;
            var vectorx = Math.cos(rad);
            var vectory = Math.sin(rad);
            // 移到机头位置
            bullet.x = this.x + vectorx * 4;
            bullet.y = this.y + vectory * 4;
            bullet.vel.x = GameConfig.bulletSpeed * vectorx + this.vel.x;
            bullet.vel.y = GameConfig.bulletSpeed * vectory + this.vel.y;
            bullet.visible = true;
            break;
          }
        }
      }
    }

    // 导弹冷却
    if (this.missileCooldown > 0) {
      this.missileCooldown -= delta;
    }
    // Z键发射导弹
    if (KEY_STATUS.missile) {
      if (this.missileCooldown <= 0) {
        this.missileCooldown = 33; // ~1秒冷却
        for (var i = 0; i < this.missiles.length; i++) {
          if (!this.missiles[i].visible) {
            SFX.laser();
            var missile = this.missiles[i];
            var rad = ((this.rot - 90) * Math.PI) / 180;
            var vectorx = Math.cos(rad);
            var vectory = Math.sin(rad);
            missile.x = this.x + vectorx * 4;
            missile.y = this.y + vectory * 4;

            // 设定恒定初速
            // 使用导弹自身的 speed 属性
            var launchSpeed = missile.speed;
            missile.vel.x = launchSpeed * vectorx;
            missile.vel.y = launchSpeed * vectory;

            missile.rot = this.rot;
            missile.visible = true;
            missile.time = 0;
            missile.target = null;
            missile.stopTracking = false;
            missile.hasEnteredRange = false;
            break;
          }
        }
      }
    }

    // 限制最高速度
    if (Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y) > 8) {
      this.vel.x *= 0.95;
      this.vel.y *= 0.95;
    }
  };

  this.collision = function (other) {
    SFX.explosion();
    Game.explosionAt(other.x, other.y);
    Game.FSM.state = 'player_died';
    this.visible = false;
    this.currentNode.leave(this);
    this.currentNode = null;
    for (var i = 0; i < Game.sprites.length; i++) {
      if (Game.sprites[i].name === 'alienbullet') {
        Game.sprites[i].visible = false;
      }
    }
    Game.lives--;
  };

};
Ship.prototype = new Sprite();

// 大型 UFO：简单 AI 移动与射击
BigAlien = function () {
  this.init("bigalien",
    [-20, 0,
    -12, -4,
      12, -4,
      20, 0,
      12, 4,
    -12, 4,
    -20, 0,
      20, 0]);

  this.children.top = new Sprite();
  this.children.top.init("bigalien_top",
    [-8, -4,
    -6, -6,
      6, -6,
      8, -4]);
  this.children.top.visible = true;

  this.children.bottom = new Sprite();
  this.children.bottom.init("bigalien_top",
    [8, 4,
      6, 6,
      -6, 6,
      -8, 4]);
  this.children.bottom.visible = true;

  this.collidesWith = ["asteroid", "ship", "bullet", "missile"];

  this.bridgesH = false;

  this.bullets = [];
  this.bulletCounter = 0;

  // 从左右屏外生成
  this.newPosition = function () {
    if (Math.random() < 0.5) {
      this.x = -20;
      this.vel.x = 1.5;
    } else {
      this.x = Game.canvasWidth + 20;
      this.vel.x = -1.5;
    }
    this.y = Math.random() * Game.canvasHeight;
  };

  // 预创建子弹复用
  this.setup = function () {
    this.newPosition();

    for (var i = 0; i < 3; i++) {
      var bull = new AlienBullet();
      this.bullets.push(bull);
      Game.sprites.push(bull);
    }
  };

  // 根据附近密度调整上下移动
  this.preMove = function (delta) {
    var cn = this.currentNode;
    if (cn == null) return;

    var topCount = 0;
    if (cn.north.nextSprite) topCount++;
    if (cn.north.east.nextSprite) topCount++;
    if (cn.north.west.nextSprite) topCount++;

    var bottomCount = 0;
    if (cn.south.nextSprite) bottomCount++;
    if (cn.south.east.nextSprite) bottomCount++;
    if (cn.south.west.nextSprite) bottomCount++;

    if (topCount > bottomCount) {
      this.vel.y = 1;
    } else if (topCount < bottomCount) {
      this.vel.y = -1;
    } else if (Math.random() < 0.01) {
      this.vel.y = -this.vel.y;
    }

    // 偶尔朝玩家开火
    this.bulletCounter -= delta;
    if (this.bulletCounter <= 0) {
      this.bulletCounter = 22;
      if (!Game.ship.visible) {
        return;
      }
      for (var i = 0; i < this.bullets.length; i++) {
        if (!this.bullets[i].visible) {
          bullet = this.bullets[i];
          var dx = Game.ship.x - this.x;
          var dy = Game.ship.y - this.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0 || !Game.ship.visible) {
            dist = 1;
          }
          var vectorx = dx / dist;
          var vectory = dy / dist;
          bullet.x = this.x;
          bullet.y = this.y;
          bullet.vel.x = 6 * vectorx;
          bullet.vel.y = 6 * vectory;
          bullet.visible = true;
          SFX.laser();
          break;
        }
      }
    }

  };

  BigAlien.prototype.collision = function (other) {
    if (other.name == "bullet" || other.name == "missile") Game.score += 200;
    SFX.explosion();
    Game.explosionAt(other.x, other.y);
    this.visible = false;
    this.newPosition();
  };

  this.postMove = function () {
    if (this.y > Game.canvasHeight) {
      this.y = 0;
    } else if (this.y < 0) {
      this.y = Game.canvasHeight;
    }

    if ((this.vel.x > 0 && this.x > Game.canvasWidth + 20) ||
      (this.vel.x < 0 && this.x < -20)) {
      // 超出屏幕后重新生成
      this.visible = false;
      this.newPosition();
    }
  }
};
BigAlien.prototype = new Sprite();

// 玩家子弹：短生命周期
Bullet = function () {
  this.init("bullet", [0, 0]);
  this.time = 0;
  this.bridgesH = false;
  this.bridgesV = false;
  this.postMove = this.wrapPostMove;
  // 小行星可主动检测子弹
  //this.collidesWith = ["asteroid"];

  this.configureTransform = function () { };
  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.moveTo(this.x - 1, this.y - 1);
      this.context.lineTo(this.x + 1, this.y + 1);
      this.context.moveTo(this.x + 1, this.y - 1);
      this.context.lineTo(this.x - 1, this.y + 1);
      this.context.stroke();
      this.context.restore();
    }
  };
  // 子弹快速失效以限制数量
  this.preMove = function (delta) {
    if (this.visible) {
      this.time += delta;
    }
    if (this.time > GameConfig.bulletLifetime) {
      this.visible = false;
      this.time = 0;
    }
  };
  this.collision = function (other) {
    this.time = 0;
    this.visible = false;
    this.currentNode.leave(this);
    this.currentNode = null;
  };
  this.transformedPoints = function (other) {
    return [this.x, this.y];
  };

};
Bullet.prototype = new Sprite();

// 外星子弹复用子弹寿命逻辑
AlienBullet = function () {
  this.init("alienbullet");

  this.preMove = function (delta) {
    if (this.visible) {
      this.time += delta;
    }
    if (this.time > GameConfig.alienBulletLifetime) {
      this.visible = false;
      this.time = 0;
    }
  };

  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.lineWidth = 2;
      this.context.beginPath();
      this.context.moveTo(this.x, this.y);
      this.context.lineTo(this.x - this.vel.x, this.y - this.vel.y);
      this.context.stroke();
      this.context.restore();
    }
  };
};
AlienBullet.prototype = new Bullet();

// 追踪导弹：自动追踪最近目标，飞行一段距离后爆炸（范围伤害）
Missile = function () {
  this.init("missile",
    [-2, 3,
      0, -5,
      2, 3]);
  this.time = 0;
  this.bridgesH = false;
  this.bridgesV = false;
  this.postMove = this.wrapPostMove;
  this.maxFlightTime = GameConfig.missileLifetime; // 飞行时间
  this.collidesWith = [];
  this.speed = GameConfig.missileSpeed;
  this.target = null;
  this.hasEnteredRange = false;

  this.configureTransform = function () { };

  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.translate(this.x, this.y);
      var rad = (this.rot * Math.PI) / 180;
      this.context.rotate(rad);
      this.context.lineWidth = 1.5;
      this.context.beginPath();
      this.context.moveTo(-2, 3);
      this.context.lineTo(0, -5);
      this.context.lineTo(2, 3);
      this.context.closePath();
      this.context.stroke();
      // 尾焰
      if (Math.random() > 0.3) {
        this.context.beginPath();
        this.context.moveTo(-1, 3);
        this.context.lineTo(0, 6 + Math.random() * 3);
        this.context.lineTo(1, 3);
        this.context.stroke();
      }
      this.context.restore();
    }
  };

  this.preMove = function (delta) {
    if (!this.visible) return;
    this.time += delta;
    if (this.time > this.maxFlightTime) {
      this.explode();
      return;
    }

    if (this.stopTracking) return;

    // 如果已锁定目标但目标消失
    if (this.target && !this.target.visible) {
      if (this.hasEnteredRange) {
        this.stopTracking = true;
        this.target = null;
        return;
      }
      this.target = null;
    }

    // 仅当从未锁定目标时，寻找最近目标
    if (!this.target) {
      var nearestDist = Infinity;
      for (var i = 0; i < Game.sprites.length; i++) {
        var s = Game.sprites[i];
        if (!s.visible) continue;
        if (s.name === "asteroid" || s.name === "bigalien") {
          var dx = s.x - this.x;
          var dy = s.y - this.y;

          // 扩大到前方约-80到80度范围内寻找目标
          // 利用点积与叉积限制搜索角度
          var dot = this.vel.x * dx + this.vel.y * dy;
          var cross = this.vel.x * dy - this.vel.y * dx;
          if (dot <= 0 || Math.abs(cross) > dot * 2.747) continue;

          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < nearestDist) {
            nearestDist = dist;
            this.target = s;
          }
        }
      }
    }

    // 追踪逻辑：恒定速率转向
    if (this.target) {
      var dx = this.target.x - this.x;
      var dy = this.target.y - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      // 首次进入追踪范围后才允许停止追踪
      if (dist < GameConfig.missileTrackingRange) {
        this.hasEnteredRange = true;
      } else if (this.hasEnteredRange) {
        this.stopTracking = true;
        this.target = null;
        return;
      } else {
        return;
      }

      if (dist > 0) {
        // 归一化目标方向
        var dirX = dx / dist;
        var dirY = dy / dist;

        // 转向力度
        var turnFactor = GameConfig.missileTurnRate;

        // 修改速度向量方向
        this.vel.x += dirX * turnFactor * delta;
        this.vel.y += dirY * turnFactor * delta;

        // 重新归一化并恢复恒定速率
        var currentSpeed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
        if (currentSpeed > 0) {
          this.vel.x = (this.vel.x / currentSpeed) * this.speed;
          this.vel.y = (this.vel.y / currentSpeed) * this.speed;
        }
      }
    }

    // 朝速度方向旋转
    var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
    if (speed > 0.1) {
      this.rot = (Math.atan2(this.vel.y, this.vel.x) * 180 / Math.PI) + 90;
    }
  };

  this.explode = function (directHit) {
    if (!this.visible) return;
    this.visible = false;
    if (this.currentNode) {
      this.currentNode.leave(this);
      this.currentNode = null;
    }
    // 范围伤害
    var explosionRadius = 70;
    var myX = this.x;
    var myY = this.y;
    for (var i = 0; i < Game.sprites.length; i++) {
      var s = Game.sprites[i];
      if (!s.visible || s === directHit) continue;
      if (s.name === "asteroid" || s.name === "bigalien") {
        var dx = s.x - myX;
        var dy = s.y - myY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < explosionRadius) {
          var proxy = { name: "missile", x: s.x, y: s.y };
          s.collision(proxy);
        }
      }
    }
    SFX.explosion();
    Game.missileExplosionAt(myX, myY);
    this.time = 0;
  };

  this.collision = function (other) {
    this.explode(other);
  };

  this.transformedPoints = function () {
    var rad = (this.rot * Math.PI) / 180;
    var cos = Math.cos(rad);
    var sin = Math.sin(rad);
    var pts = [[-2, 3], [0, -5], [2, 3]];
    var result = [];
    for (var i = 0; i < pts.length; i++) {
      result.push(this.x + pts[i][0] * cos - pts[i][1] * sin);
      result.push(this.y + pts[i][0] * sin + pts[i][1] * cos);
    }
    return result;
  };
};
Missile.prototype = new Sprite();

// 小行星可分裂并计分
Asteroid = function () {
  this.init("asteroid",
    [-10, 0,
    -5, 7,
    -3, 4,
      1, 10,
      5, 4,
      10, 0,
      5, -6,
      2, -10,
    -4, -10,
    -4, -5]);

  this.visible = true;
  this.scale = 6;
  this.postMove = this.wrapPostMove;
  this.spawnTime = Date.now();

  this.collidesWith = ["ship", "bullet", "bigalien", "alienbullet", "missile"];

  // 命中时分裂、计分并爆炸
  this.collision = function (other) {
    // 新生成的小行星对导弹爆炸的范围伤害有短暂无敌时间（防止被连环炸死）
    if (other.name == "missile" && Date.now() - this.spawnTime < 100) return;

    SFX.explosion();
    if (other.name == "bullet" || other.name == "missile") Game.score += 120 / this.scale;
    this.scale /= 3;
    if (this.scale > 0.5) {
      // 分裂成碎片
      for (var i = 0; i < 3; i++) {
        var roid = new Asteroid();
        roid.x = this.x;
        roid.y = this.y;
        roid.rot = this.rot;
        roid.scale = this.scale;
        roid.vel = { x: this.vel.x, y: this.vel.y, rot: this.vel.rot };
        roid.acc = { x: this.acc.x, y: this.acc.y, rot: this.acc.rot };
        roid.points = this.points.slice();
        roid.vel.x = Math.random() * 6 - 3;
        roid.vel.y = Math.random() * 6 - 3;
        if (Math.random() > 0.5) {
          roid.points.reverse();
        }
        roid.vel.rot = Math.random() * 2 - 1;
        roid.move(roid.scale * 3); // 给碎片一点初速度
        Game.sprites.push(roid);
      }
    }
    Game.explosionAt(other.x, other.y);
    this.die();
  };
};
Asteroid.prototype = new Sprite();

// 线段爆炸，靠缩放消失
Explosion = function () {
  this.init("explosion");

  this.bridgesH = false;
  this.bridgesV = false;

  this.lines = [];
  for (var i = 0; i < 5; i++) {
    var rad = 2 * Math.PI * Math.random();
    var x = Math.cos(rad);
    var y = Math.sin(rad);
    this.lines.push([x, y, x * 2, y * 2]);
  }

  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.lineWidth = 1.0 / this.scale;
      this.context.beginPath();
      for (var i = 0; i < 5; i++) {
        var line = this.lines[i];
        this.context.moveTo(line[0], line[1]);
        this.context.lineTo(line[2], line[3]);
      }
      this.context.stroke();
      this.context.restore();
    }
  };

  this.preMove = function (delta) {
    if (this.visible) {
      this.scale += delta;
    }
    if (this.scale > 8) {
      this.die();
    }
  };
};
Explosion.prototype = new Sprite();

// 导弹爆炸特效：更多粒子线段 + 扩散环
MissileExplosion = function () {
  this.init("missileexplosion");

  this.bridgesH = false;
  this.bridgesV = false;

  this.lines = [];
  for (var i = 0; i < 12; i++) {
    var rad = 2 * Math.PI * Math.random();
    var speed = 0.5 + Math.random() * 1.5;
    var x = Math.cos(rad) * speed;
    var y = Math.sin(rad) * speed;
    this.lines.push([x, y, x * 2, y * 2]);
  }

  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.lineWidth = 1.0 / this.scale;
      // 粒子线段
      this.context.beginPath();
      for (var i = 0; i < this.lines.length; i++) {
        var line = this.lines[i];
        this.context.moveTo(line[0], line[1]);
        this.context.lineTo(line[2], line[3]);
      }
      this.context.stroke();
      // 扩散环
      this.context.beginPath();
      this.context.arc(0, 0, 5, 0, 2 * Math.PI);
      this.context.stroke();
      this.context.restore();
    }
  };

  this.preMove = function (delta) {
    if (this.visible) {
      this.scale += delta * 1.5;
    }
    if (this.scale > 14) {
      this.die();
    }
  };
};
MissileExplosion.prototype = new Sprite();

// 网格节点，用于粗略碰撞
GridNode = function () {
  this.north = null;
  this.south = null;
  this.east = null;
  this.west = null;

  this.nextSprite = null;

  this.dupe = {
    horizontal: null,
    vertical: null
  };

  this.enter = function (sprite) {
    sprite.nextSprite = this.nextSprite;
    this.nextSprite = sprite;
  };

  this.leave = function (sprite) {
    var ref = this;
    while (ref && (ref.nextSprite != sprite)) {
      ref = ref.nextSprite;
    }
    if (ref) {
      ref.nextSprite = sprite.nextSprite;
      sprite.nextSprite = null;
    }
  };

  this.eachSprite = function (sprite, callback) {
    var ref = this;
    while (ref.nextSprite) {
      ref = ref.nextSprite;
      callback.call(sprite, ref);
    }
  };

  this.isEmpty = function (collidables) {
    var empty = true;
    var ref = this;
    while (ref.nextSprite) {
      ref = ref.nextSprite;
      empty = !ref.visible || collidables.indexOf(ref.name) == -1
      if (!empty) break;
    }
    return empty;
  };
};

// 矢量字体渲染（来自 typeface-0.14.js）
// http://typeface.neocracy.org
Text = {
  renderGlyph: function (ctx, face, char) {

    var glyph = face.glyphs[char];

    if (glyph.o) {

      var outline;
      if (glyph.cached_outline) {
        outline = glyph.cached_outline;
      } else {
        outline = glyph.o.split(' ');
        glyph.cached_outline = outline;
      }

      var outlineLength = outline.length;
      for (var i = 0; i < outlineLength;) {

        var action = outline[i++];

        switch (action) {
          case 'm':
            ctx.moveTo(outline[i++], outline[i++]);
            break;
          case 'l':
            ctx.lineTo(outline[i++], outline[i++]);
            break;

          case 'q':
            var cpx = outline[i++];
            var cpy = outline[i++];
            ctx.quadraticCurveTo(outline[i++], outline[i++], cpx, cpy);
            break;

          case 'b':
            var x = outline[i++];
            var y = outline[i++];
            ctx.bezierCurveTo(outline[i++], outline[i++], outline[i++], outline[i++], x, y);
            break;
        }
      }
    }
    if (glyph.ha) {
      ctx.translate(glyph.ha, 0);
    }
  },

  renderText: function (text, size, x, y) {
    this.context.save();

    this.context.translate(x, y);

    var pixels = size * 72 / (this.face.resolution * 100);
    this.context.scale(pixels, -1 * pixels);
    this.context.beginPath();
    var chars = text.split('');
    var charsLength = chars.length;
    for (var i = 0; i < charsLength; i++) {
      this.renderGlyph(this.context, this.face, chars[i]);
    }
    this.context.fill();

    this.context.restore();
  },

  context: null,
  face: null
};

// 音效系统（兼容处理）
SFX = {
  laser: new Audio('assets/audio/laser.mp3'),
  explosion: new Audio('assets/audio/explosion.mp3'),
  thrust: new Audio('assets/audio/thrust.mp3'),
  muted: false
};

// 为每个音效添加播放方法封装
for (var key in SFX) {
  if (key === 'muted') continue;
  (function (name) {
    var audio = SFX[name];
    var originalPlay = audio.play;
    // 覆盖为函数调用形式 SFX.laser()
    SFX[name] = function () {
      if (!SFX.muted) {
        try {
          if (audio.currentTime > 0) {
            audio.currentTime = 0;
          }
          // 忽略自动播放策略阻挡等错误
          var promise = audio.play();
          if (promise !== undefined) {
            promise.catch(function (error) { });
          }
        } catch (e) { }
      }
      return audio;
    };
  })(key);
}

// 全局游戏状态与规则
Game = {
  score: 0,
  totalAsteroids: 5,
  lives: 0,

  canvasWidth: 800,
  canvasHeight: 600,

  sprites: [],
  ship: null,
  bigAlien: null,

  nextBigAlienTime: null,


  // 在空区域生成一波小行星
  spawnAsteroids: function (count) {
    if (!count) count = this.totalAsteroids;
    for (var i = 0; i < count; i++) {
      var roid = new Asteroid();
      roid.x = Math.random() * this.canvasWidth;
      roid.y = Math.random() * this.canvasHeight;
      while (!roid.isClear()) {
        roid.x = Math.random() * this.canvasWidth;
        roid.y = Math.random() * this.canvasHeight;
      }
      roid.vel.x = Math.random() * 4 - 2;
      roid.vel.y = Math.random() * 4 - 2;
      if (Math.random() > 0.5) {
        roid.points.reverse();
      }
      roid.vel.rot = Math.random() * 2 - 1;
      Game.sprites.push(roid);
    }
  },

  // 在指定位置生成爆炸效果
  explosionAt: function (x, y) {
    var splosion = new Explosion();
    splosion.x = x;
    splosion.y = y;
    splosion.visible = true;
    Game.sprites.push(splosion);
  },

  // 在指定位置生成导弹爆炸效果（更大范围）
  missileExplosionAt: function (x, y) {
    var splosion = new MissileExplosion();
    splosion.x = x;
    splosion.y = y;
    splosion.visible = true;
    Game.sprites.push(splosion);
  },

  // 游戏流程的简单状态机
  FSM: {
    boot: function () {
      Game.spawnAsteroids(8); // 增加背景小行星数量
      this.state = 'waiting';
    },
    // 标题等待状态
    waiting: function () {
      Text.renderText('Press Space to Start', 36, Game.canvasWidth / 2 - 270, Game.canvasHeight / 2);
      if (KEY_STATUS.space) {
        KEY_STATUS.space = false; // 防止起手就开火
        this.state = 'start';
      }
    },
    // 重置世界并开始新局
    start: function () {
      for (var i = 0; i < Game.sprites.length; i++) {
        if (Game.sprites[i].name == 'asteroid') {
          Game.sprites[i].die();
        } else if (Game.sprites[i].name == 'bullet' ||
          Game.sprites[i].name == 'bigalien' ||
          Game.sprites[i].name == 'missile') {
          Game.sprites[i].visible = false;
        }
      }

      Game.score = 0;
      Game.lives = GameConfig.startLives;
      Game.totalAsteroids = GameConfig.startAsteroids;
      Game.spawnAsteroids();

      Game.nextBigAlienTime = Date.now() + 30000 + (30000 * Math.random());

      this.state = 'spawn_ship';
    },
    // 在安全区域生成玩家
    spawn_ship: function () {
      Game.ship.x = Game.canvasWidth / 2;
      Game.ship.y = Game.canvasHeight / 2;
      if (Game.ship.isClear()) {
        Game.ship.rot = 0;
        Game.ship.vel.x = 0;
        Game.ship.vel.y = 0;
        Game.ship.visible = true;
        this.state = 'run';
      }
    },
    // 主要游戏状态
    run: function () {
      for (var i = 0; i < Game.sprites.length; i++) {
        if (Game.sprites[i].name == 'asteroid') {
          break;
        }
      }
      if (i == Game.sprites.length) {
        this.state = 'new_level';
      }
      if (!Game.bigAlien.visible &&
        Date.now() > Game.nextBigAlienTime) {
        Game.bigAlien.visible = true;
        Game.nextBigAlienTime = Date.now() + (30000 * Math.random());
      }
    },
    // 波次间提升难度
    new_level: function () {
      if (this.timer == null) {
        this.timer = Date.now();
      }
      // 等待一秒再生成更多小行星
      if (Date.now() - this.timer > 1000) {
        this.timer = null;
        Game.totalAsteroids++;
        if (Game.totalAsteroids > 12) Game.totalAsteroids = 12;
        Game.spawnAsteroids();
        this.state = 'run';
      }
    },
    // 短暂停后重生或结束
    player_died: function () {
      if (Game.lives < 0) {
        this.state = 'end_game';
      } else {
        if (this.timer == null) {
          this.timer = Date.now();
        }
        // 等待一秒后重生
        if (Date.now() - this.timer > 1000) {
          this.timer = null;
          this.state = 'spawn_ship';
        }
      }
    },
    // 显示结束并回到标题
    end_game: function () {
      Text.renderText('GAME OVER', 50, Game.canvasWidth / 2 - 160, Game.canvasHeight / 2 + 10);
      if (this.timer == null) {
        this.timer = Date.now();
      }
      // 等 3 秒回到等待状态
      if (Date.now() - this.timer > 3000) {
        this.timer = null;
        this.state = 'waiting';
      }

    },

    execute: function () {
      this[this.state]();
    },
    state: 'boot'
  }

};


// 初始化画布、网格、精灵和主循环
window.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('canvas');
  // 应用配置尺寸
  canvas.width = GameConfig.width;
  canvas.height = GameConfig.height;

  Game.canvasWidth = canvas.width;
  Game.canvasHeight = canvas.height;

  // 窗口自适应缩放逻辑
  var resize = function () {
    var scale = Math.min(window.innerWidth / GameConfig.width, window.innerHeight / GameConfig.height);
    // 保持至少 1 像素
    scale = Math.max(scale, 0.001);

    canvas.style.width = (GameConfig.width * scale) + 'px';
    canvas.style.height = (GameConfig.height * scale) + 'px';
  };

  window.addEventListener('resize', resize);
  resize();

  var context = canvas.getContext("2d");

  Text.context = context;
  Text.face = vector_battle;

  // 构建碰撞分区网格
  var gridWidth = Math.round(Game.canvasWidth / GRID_SIZE);
  var gridHeight = Math.round(Game.canvasHeight / GRID_SIZE);
  var grid = new Array(gridWidth);
  for (var i = 0; i < gridWidth; i++) {
    grid[i] = new Array(gridHeight);
    for (var j = 0; j < gridHeight; j++) {
      grid[i][j] = new GridNode();
    }
  }

  // 链接邻居用于 8 向与穿越
  for (var i = 0; i < gridWidth; i++) {
    for (var j = 0; j < gridHeight; j++) {
      var node = grid[i][j];
      node.north = grid[i][(j == 0) ? gridHeight - 1 : j - 1];
      node.south = grid[i][(j == gridHeight - 1) ? 0 : j + 1];
      node.west = grid[(i == 0) ? gridWidth - 1 : i - 1][j];
      node.east = grid[(i == gridWidth - 1) ? 0 : i + 1][j];
    }
  }

  // 设置边缘镜像偏移
  for (var i = 0; i < gridWidth; i++) {
    grid[i][0].dupe.vertical = Game.canvasHeight;
    grid[i][gridHeight - 1].dupe.vertical = -Game.canvasHeight;
  }

  for (var j = 0; j < gridHeight; j++) {
    grid[0][j].dupe.horizontal = Game.canvasWidth;
    grid[gridWidth - 1][j].dupe.horizontal = -Game.canvasWidth;
  }

  var sprites = [];
  Game.sprites = sprites;

  // 共享渲染上下文与矩阵
  Sprite.prototype.context = context;
  Sprite.prototype.grid = grid;
  Sprite.prototype.matrix = new Matrix(2, 3);

  var ship = new Ship();

  ship.x = Game.canvasWidth / 2;
  ship.y = Game.canvasHeight / 2;

  sprites.push(ship);

  ship.bullets = [];
  for (var i = 0; i < 10; i++) {
    var bull = new Bullet();
    ship.bullets.push(bull);
    sprites.push(bull);
  }

  ship.missiles = [];
  for (var i = 0; i < 5; i++) {
    var miss = new Missile();
    ship.missiles.push(miss);
    sprites.push(miss);
  }
  Game.ship = ship;

  var bigAlien = new BigAlien();
  bigAlien.setup();
  sprites.push(bigAlien);
  Game.bigAlien = bigAlien;

  var extraDude = new Ship();
  extraDude.scale = 0.6;
  extraDude.visible = true;
  extraDude.preMove = null;
  extraDude.children = [];

  var i, j = 0;

  var paused = false;
  var showFramerate = false;
  var avgFramerate = 0;
  var frameCount = 0;
  var elapsedCounter = 0;

  var lastFrame = Date.now();
  var thisFrame;
  var elapsed;
  var delta;

  var canvasNode = canvas;

  // requestAnimationFrame 兼容层（setTimeout 兜底）
  // 来源：
  // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function (/* function */ callback, /* DOMElement */ element) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  // 主渲染/更新循环
  var mainLoop = function () {
    context.clearRect(0, 0, Game.canvasWidth, Game.canvasHeight);

    Game.FSM.execute();

    // 可选网格调试层
    if (KEY_STATUS.g) {
      context.beginPath();
      for (var i = 0; i < gridWidth; i++) {
        context.moveTo(i * GRID_SIZE, 0);
        context.lineTo(i * GRID_SIZE, Game.canvasHeight);
      }
      for (var j = 0; j < gridHeight; j++) {
        context.moveTo(0, j * GRID_SIZE);
        context.lineTo(Game.canvasWidth, j * GRID_SIZE);
      }
      context.closePath();
      context.stroke();
    }

    thisFrame = Date.now();
    elapsed = thisFrame - lastFrame;
    lastFrame = thisFrame;
    delta = elapsed / 30;

    for (i = 0; i < sprites.length; i++) {

      sprites[i].run(delta);

      if (sprites[i].reap) {
        sprites[i].reap = false;
        sprites.splice(i, 1);
        i--;
      }
    }

    // 分数显示
    var score_text = '' + Game.score;
    Text.renderText(score_text, 18, Game.canvasWidth - 14 * score_text.length, 20);

    // 剩余生命显示
    for (i = 0; i < Game.lives; i++) {
      context.save();
      extraDude.x = Game.canvasWidth - (8 * (i + 1));
      extraDude.y = 32;
      extraDude.configureTransform();
      extraDude.draw();
      context.restore();
    }

    // 帧率显示（F 切换）
    if (showFramerate) {
      context.save();
      context.fillStyle = '#000000';
      Text.renderText('' + avgFramerate, 24, Game.canvasWidth - 38, Game.canvasHeight - 20);
      context.restore();
    }

    frameCount++;
    elapsedCounter += elapsed;
    if (elapsedCounter > 1000) {
      elapsedCounter -= 1000;
      avgFramerate = frameCount;
      frameCount = 0;
    }

    // 暂停显示与循环控制
    if (paused) {
      Text.renderText('PAUSED', 72, Game.canvasWidth / 2 - 160, 120);
    } else {
      requestAnimFrame(mainLoop, canvasNode);
    }
  };

  mainLoop();

  // 使用 keyup 防止按住按键反复触发切换
  window.addEventListener('keyup', function (e) {
    switch (KEY_CODES[e.keyCode]) {
      case 'framerate': // 显示帧率
        showFramerate = !showFramerate;
        break;
      case 'pause': // 暂停
        paused = !paused;
        if (!paused) {
          // 继续运行
          lastFrame = Date.now();
          mainLoop();
        }
        break;
      case 'mute': // 静音
        SFX.muted = !SFX.muted;
        break;
    }
  });
});

// vim: fdl=0
