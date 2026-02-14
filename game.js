// 辉光特效类
const Glow = function () {
  this.init = function (name, color, radius, alpha, fadeFrames, direction) {
    this.name = name || 'glow';
    this.color = color || 'rgba(255,255,128,1)';
    this.radius = radius || 24;
    this.alpha = alpha || 0.7;
    this.fadeFrames = fadeFrames || 20;
    this.frame = 0;
    this.direction = direction || 0; // 0:全向, 1:前, -1:后
    this.visible = true;
    this.x = 0;
    this.y = 0;
    this.rot = 0;
    this.parent = null;
  };

  this.run = function (delta) {
    if (!this.visible) return;
    this.frame++;
    if (this.frame > this.fadeFrames) {
      this.visible = false;
    }
    this.draw();
  };

  this.draw = function () {
    if (!this.visible) return;
    var ctx = (this.parent ? this.parent.context : this.context) || this.context;
    ctx.save();
    // 位置和旋转
    if (this.parent) {
      ctx.translate(this.parent.x, this.parent.y);
      ctx.rotate((this.parent.rot - 90) * Math.PI / 180);
    } else {
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rot - 90) * Math.PI / 180);
    }
    // 方向偏移（x轴）
    let offset = 0;
    let rx = this.radius, ry = this.radius;
    let semiDir = 0; // 半圆朝向
    if (this.direction === 1) { // 前向
      offset = 6;
      rx = this.radius * 1.2;
      ry = this.radius * 0.6;
      semiDir = 0; // 半圆朝右
    }
    if (this.direction === -1) { // 后向
      offset = -6;
      rx = this.radius * 1.5 * (0.3 + 1 * Math.random()); // 0.3-1.3倍随机倍率
      ry = this.radius * 0.6 + 0.1 * Math.random(); // 短轴
      semiDir = Math.PI; // 半圆朝左
    }
    ctx.translate(offset, 0);
    // 渐变色
    var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, this.color.replace(/\d?\.?\d+\)$/g, this.alpha + ")"));
    grad.addColorStop(1, this.color.replace(/\d?\.?\d+\)$/g, "0)"));
    ctx.globalAlpha = this.alpha * (1 - this.frame / this.fadeFrames);
    if (this.direction === 0) {
      // 重生辉光始终为圆形
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    } else {
      // 底层大椭圆（更大更淡）
      ctx.save();
      ctx.globalAlpha *= 0.28;
      ctx.scale(1.25, (ry / rx) * 1.1);
      ctx.beginPath();
      ctx.ellipse(rx * Math.cos(semiDir), 0, rx * 0.95, rx * 0.7, 0, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
      // 主辉光（拉伸椭圆）
      ctx.save();
      ctx.scale(1, ry / rx);
      ctx.beginPath();
      ctx.ellipse(rx * Math.cos(semiDir), 0, rx * 0.7, rx * 0.5, 0, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };
};
// 游戏配置
const GameConfig = {
  width: (typeof window !== 'undefined' ? window.innerWidth : 1600),      // 窗体宽（默认全屏）
  height: (typeof window !== 'undefined' ? window.innerHeight : 960),      // 窗体高（默认全屏）
  startLives: 6,    // 初始生命值
  startAsteroids: 6, // 初始陨石数量

  bulletSpeed: 17,   // 子弹速度
  playerMaxBullets: 10, // 同时存在的玩家子弹最大值
  playerBulletCooldown: 3, // 玩家机炮发射间隔（帧）
  playerBulletBurstCount: 3, // 玩家机炮每轮连发数
  playerBulletBurstShotInterval: 0, // 玩家机炮连发内间隔（帧）
  bulletLifetime: 50, // 子弹寿命（帧数）
  playerMissileCooldown: 50, // 玩家导弹发射间隔（帧）
  playerMaxSpeed: 8, // 玩家最大速度
  playerAccel: 0.5, // 玩家推进加速度
  playerBrakeAccel: 0.15, // 玩家刹车加速度
  playerRotSpeed: 7, // 玩家旋转速度
  missileSpeed: 24,  // 导弹速度
  missileLifetime: 35, // 导弹寿命（帧数）
  missileTrackingRange: 170, // 导弹追踪范围
  missileTurnRate: 12, // 导弹转向速度
  missileExplosionRadius: 65, // 导弹爆炸半径

  ufoMissileInterval: 80, // UFO导弹发射间隔（帧）

  fighterFirstSpawnDelay: 11000, // 敌机首次生成延迟(ms)
  fighterSpawnInterval: 10000,   // 敌机生成基础间隔(ms)
  fighterMaxSpeed: 8, // 敌机最大速度
  fighterAccel: 0.5, // 敌机常规加速度
  fighterAvoidAccel: 0.6, // 敌机躲避加速度
  fighterIdleAccel: 0.35, // 敌机无目标加速度
  fighterTurnSpeed: 6, // 敌机旋转速度
  fighterAsteroidShootRange: 300, // 敌机射击陨石距离阈值

  enemyBulletSpeed: 16, // 敌机机炮子弹速度
  enemyBulletLifetime: 45, // 敌机机炮子弹寿命（帧数）
  enemyBulletBurstCount: 5, // 敌机机炮每轮连发数
  enemyBulletBurstShotInterval: 6, // 敌机机炮连发内间隔（帧）
  enemyBulletBurstPause: 24, // 敌机机炮两轮连发间隔（帧）
  enemyMissileCooldown: 99, // 敌机导弹发射间隔（帧）
  enemyMissileSpawnCooldown: 33, // 敌机生成后首发导弹间隔（帧）
  enemyMissileSpeed: 20, // 敌机导弹速度
  enemyMissileLifetime: 30, // 敌机导弹寿命（帧数）
  enemyMissileTrackingRange: 240, // 敌机导弹追踪范围
  enemyMissileTurnRate: 3, // 敌机导弹转向速度（更小）
  enemyMissileExplosionRadius: 40, // 敌机导弹爆炸半径（更小）

  lightColor: '#fff', // 黑暗模式主色/亮色模式底色
  darkColor: '#000' // 黑暗模式底色/亮色模式主色
};

// 输入映射到游戏动作
const KEY_CODES = {
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
  78: 'darkmode',    // N键黑暗模式
  80: 'pause',      // P键暂停
  81: 'missile',    // Q键导弹
  85: 'playerui'   // U键开关速度/子弹UI
}

// 记录动作按下状态
const KEY_STATUS = {};
for (const code in KEY_CODES) {
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
const GRID_SIZE = 60;

// 2x3 变换矩阵工具
const Matrix = function (rows, columns) {
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
const Sprite = function () {
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
      this.context.strokeStyle = Game.primaryColor;
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
    this.context.strokeStyle = Game.primaryColor;
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
const Ship = function () {
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
  this.bulletBurstShotsLeft = 0;
  this.bulletBurstGapCounter = 0;
  this.missileCooldown = 0;
  this.thrustPlaying = false;

  this.postMove = this.wrapPostMove;

  this.collidesWith = ["asteroid", "ufo", "fighter", "fighterbullet", "fightermissile"];

  this.fireBullet = function () {
    const spread = 3; // 每颗子弹发射时添加±x°随机角度误差
    for (var i = 0; i < this.bullets.length; i++) {
      if (!this.bullets[i].visible) {
        SFX.laser();
        var bullet = this.bullets[i];
        var error = (Math.random() * 2 - 1) * spread * (Math.PI / 180); // 生成±spread范围内的随机误差，转换为弧度
        var rad = ((this.rot - 90) * Math.PI) / 180 + error;
        var vectorx = Math.cos(rad);
        var vectory = Math.sin(rad);
        bullet.x = this.x + vectorx * 4;
        bullet.y = this.y + vectory * 4;
        bullet.vel.x = GameConfig.bulletSpeed * vectorx + this.vel.x;
        bullet.vel.y = GameConfig.bulletSpeed * vectory + this.vel.y;
        bullet.visible = true;
        // 添加前向辉光
        var glow = new Glow();
        glow.init('fire_glow', 'rgba(255,255,180,1)', 18, 0.55, 12, 1);
        glow.parent = this;
        Game.sprites.push(glow);
        break;
      }
    }
  };

  this.stopThrust = function () {
    var thrustAudio = SFX.thrust();
    try {
      thrustAudio.pause();
      thrustAudio.currentTime = 0;
      thrustAudio.loop = false;
    } catch (e) { }
    this.thrustPlaying = false;
  };

  // 读取输入并转为旋转、推进和射击
  this.preMove = function (delta) {
    // 旋转控制
    if (KEY_STATUS.left) {
      this.vel.rot = -GameConfig.playerRotSpeed;
    } else if (KEY_STATUS.right) {
      this.vel.rot = GameConfig.playerRotSpeed;
    } else {
      this.vel.rot = 0;
    }

    // 停止停止推进音效
    if (!KEY_STATUS.up) {
      this.stopThrust();
      this.thrustColorTimer = 0;
    }

    // 前进推进
    if (KEY_STATUS.up) {
      // 推进辉光颜色渐变
      this.thrustColorTimer += delta;
      var t = Math.min(this.thrustColorTimer / 60, 1); // 2秒内从0到1
      // 橙红到蓝色插值
      function lerp(a, b, t) { return a + (b - a) * t; }
      var r = Math.round(lerp(255, 128, t));
      var g = Math.round(lerp(120, 200, t));
      var b = Math.round(lerp(40, 255, t));
      var color = 'rgba(' + r + ',' + g + ',' + b + ',1)';
      this.children.exhaust.visible = Math.random() > 0.2;
      if (this.children.exhaust.visible) {
        var glow = new Glow();
        glow.init('thrust_glow', color, 16, 0.45, 10, -1);
        glow.parent = this;
        Game.sprites.push(glow);
      }
      // 随机时间点开始播放推进音效
      if (!this.thrustPlaying && !SFX.muted) {
        var thrustAudio = SFX.thrust();
        try {
          thrustAudio.loop = true;
          thrustAudio.currentTime = Math.random() * thrustAudio.duration;
          var playPromise = thrustAudio.play();
          if (playPromise !== undefined) {
            playPromise.catch(function () { });
          }
        } catch (e) { }
        this.thrustPlaying = true;
      }
      var rad = ((this.rot - 90) * Math.PI) / 180;
      this.acc.x = GameConfig.playerAccel * Math.cos(rad);
      this.acc.y = GameConfig.playerAccel * Math.sin(rad);
    } else if (KEY_STATUS.down) {
      // 逆向刹车（弱于推进）
      var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
      if (speed > 0) {
        var brakeAccel = GameConfig.playerBrakeAccel;
        this.acc.x = -brakeAccel * (this.vel.x / speed);
        this.acc.y = -brakeAccel * (this.vel.y / speed);
      } else {
        this.acc.x = 0;
        this.acc.y = 0;
      }
      this.children.exhaust.visible = false;
    } else {
      this.acc.x = 0;
      this.acc.y = 0;
      this.children.exhaust.visible = false;
    }

    // 射速限制
    if (this.bulletCounter > 0) {
      this.bulletCounter -= delta;
    }
    if (this.bulletBurstGapCounter > 0) {
      this.bulletBurstGapCounter -= delta;
    }

    // 机炮连发
    if (KEY_STATUS.space && this.bulletBurstShotsLeft <= 0 && this.bulletCounter <= 0) {
      this.bulletCounter = GameConfig.playerBulletCooldown;
      this.bulletBurstShotsLeft = GameConfig.playerBulletBurstCount;
      this.bulletBurstGapCounter = 0;
    }

    if (this.bulletBurstShotsLeft > 0 && this.bulletBurstGapCounter <= 0) {
      this.fireBullet();
      this.bulletBurstShotsLeft--;
      this.bulletBurstGapCounter = GameConfig.playerBulletBurstShotInterval;
    }

    // 导弹冷却
    if (this.missileCooldown > 0) {
      this.missileCooldown -= delta;
    }
    // 发射导弹
    if (KEY_STATUS.missile || KEY_STATUS.space) {
      if (this.missileCooldown <= 0) {
        this.missileCooldown = GameConfig.playerMissileCooldown;
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
    if (Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y) > GameConfig.playerMaxSpeed) {
      this.vel.x *= 0.95;
      this.vel.y *= 0.95;
    }
  };

  this.collision = function (other) {
    if (!this.visible) return;
    SFX.explosion();
    Game.explosionAt(other.x, other.y);

    var lostWholeLife = Game.consumeLifeSegment();

    // 前两次扣血：不死亡，只施加较大反向冲击
    if (!lostWholeLife) {
      var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
      var dirX = 0;
      var dirY = 0;

      if (speed > 1) {  // 如果速度较快，与当前速度反向冲击
        dirX = -this.vel.x / speed;
        dirY = -this.vel.y / speed;
      } else if (other && typeof other.x === 'number' && typeof other.y === 'number') {  // 如果速度较慢，朝碰撞源反方向冲击
        var awayX = this.x - other.x;
        var awayY = this.y - other.y;
        var awayLen = Math.sqrt(awayX * awayX + awayY * awayY);
        if (awayLen > 0.001) {
          dirX = awayX / awayLen;
          dirY = awayY / awayLen;
        } else {
          var randRad = Math.random() * Math.PI * 2;
          dirX = Math.cos(randRad);
          dirY = Math.sin(randRad);
        }
      } else {  // 否则随机一个方向
        var randomRad = Math.random() * Math.PI * 2;
        dirX = Math.cos(randomRad);
        dirY = Math.sin(randomRad);
      }

      var accelKick = 1 + Math.random() * 0.6;
      var velocityKick = 6 + Math.random() * 3;
      this.acc.x = dirX * accelKick;
      this.acc.y = dirY * accelKick;
      this.vel.x += dirX * velocityKick;
      this.vel.y += dirY * velocityKick;
      this.vel.rot += (Math.random() * 2 - 1) * 4;
      return;
    }

    Game.FSM.state = 'player_died';
    this.visible = false;
    this.stopThrust();  // 真死时强制停止推进音效
    SFX.boom();
    var glow = new Glow();
    glow.init('die_glow', 'rgba(255, 198, 128, 1)', 100, 0.3, 240, 0);
    glow.parent = Game.ship;
    Game.sprites.push(glow);

    if (this.currentNode) {
      this.currentNode.leave(this);
      this.currentNode = null;
    }

    for (var i = 0; i < Game.sprites.length; i++) {
      if (Game.sprites[i].name === 'fighterbullet' ||
        Game.sprites[i].name === 'fightermissile') {
        Game.sprites[i].visible = false;
      }
    }
  };

};
Ship.prototype = new Sprite();

// UFO：左右屏外生成，调整上下移动，朝玩家开火
const UFO = function () {
  this.init("ufo",
    [-20, 0,
    -12, -4,
      12, -4,
      20, 0,
      12, 4,
    -12, 4,
    -20, 0,
      20, 0]);

  this.children.top = new Sprite();
  this.children.top.init("ufo_top",
    [-8, -4,
    -6, -6,
      6, -6,
      8, -4]);
  this.children.top.visible = true;

  this.children.bottom = new Sprite();
  this.children.bottom.init("ufo_top",
    [8, 4,
      6, 6,
      -6, 6,
      -8, 4]);
  this.children.bottom.visible = true;

  this.collidesWith = ["asteroid", "ship", "bullet", "missile"];

  this.bridgesH = false;

  this.missiles = [];
  this.missileCounter = 0;

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

  // 预创建导弹复用
  this.setup = function () {
    this.newPosition();
    for (var i = 0; i < 2; i++) {
      var missile = new FighterMissile();
      this.missiles.push(missile);
      Game.sprites.push(missile);
    }
  };

  // 根据附近密度调整上下移动，并发射导弹
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

    // 发射导弹（只追踪玩家）
    this.missileCounter -= delta;
    if (this.missileCounter <= 0) {
      this.missileCounter = GameConfig.ufoMissileInterval; // 间隔可调整
      if (!Game.ship.visible) {
        return;
      }
      for (var i = 0; i < this.missiles.length; i++) {
        if (!this.missiles[i].visible) {
          var missile = this.missiles[i];
          var dx = Game.ship.x - this.x;
          var dy = Game.ship.y - this.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) dist = 1;
          var vectorx = dx / dist;
          var vectory = dy / dist;
          missile.x = this.x;
          missile.y = this.y;
          missile.vel.x = missile.speed * vectorx;
          missile.vel.y = missile.speed * vectory;
          missile.rot = Math.atan2(vectory, vectorx) * 180 / Math.PI + 90;
          missile.visible = true;
          missile.time = 0;
          missile.target = Game.ship;
          SFX.laser();
          break;
        }
      }
    }
  };

  UFO.prototype.collision = function (other) {
    // if (!this.visible) return;
    if (other.name == "bullet" || other.name == "missile") Game.score += 200;
    // ufo被击败时的爆炸效果，辉光固定在爆炸点
    var glow = new Glow();
    glow.init('die_glow', 'rgba(255, 198, 128, 1)', 70, 0.3, 200, 0);
    glow.x = other.x;
    glow.y = other.y;
    glow.rot = 0;
    glow.parent = null;
    Game.sprites.push(glow);
    SFX.boom();
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
UFO.prototype = new Sprite();

// 玩家子弹
const Bullet = function () {
  this.init("bullet", [0, 0]);
  this.time = 0;
  this.bridgesH = false;
  this.bridgesV = false;
  this.postMove = this.wrapPostMove;

  this.configureTransform = function () { };
  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.lineWidth = 2;
      this.context.strokeStyle = Game.primaryColor;
      this.context.beginPath();
      this.context.moveTo(this.x - 1, this.y - 1);
      this.context.lineTo(this.x + 1, this.y + 1);
      this.context.moveTo(this.x + 1, this.y - 1);
      this.context.lineTo(this.x - 1, this.y + 1);
      this.context.stroke();
      this.context.restore();
    }
  };
  // 子弹失效以限制数量
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
    if (this.currentNode && typeof this.currentNode.leave === 'function') {
      this.currentNode.leave(this);
    }
    this.currentNode = null;
  };
  this.transformedPoints = function (other) {
    return [this.x, this.y];
  };

};
Bullet.prototype = new Sprite();

// 敌对战机机炮子弹
const FighterBullet = function () {
  this.init("fighterbullet");

  this.preMove = function (delta) {
    if (this.visible) {
      this.time += delta;
    }
    if (this.time > GameConfig.enemyBulletLifetime) {
      this.visible = false;
      this.time = 0;
    }
  };

  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.lineWidth = 2;
      this.context.strokeStyle = Game.primaryColor;
      this.context.beginPath();
      this.context.moveTo(this.x - 1, this.y - 1);
      this.context.lineTo(this.x + 1, this.y + 1);
      this.context.moveTo(this.x + 1, this.y - 1);
      this.context.lineTo(this.x - 1, this.y + 1);
      this.context.stroke();
      this.context.restore();
    }
  };
};
FighterBullet.prototype = new Bullet();

// 追踪导弹：自动追踪最近目标，飞行一段距离后爆炸（范围伤害）
const Missile = function () {
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
      this.context.strokeStyle = Game.primaryColor;
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

    // 仅当从未锁定目标时，先找最近的敌机或ufo
    if (!this.target) {
      var nearestEnemyDist = Infinity;
      for (var i = 0; i < Game.sprites.length; i++) {
        var enemy = Game.sprites[i];
        if (!enemy.visible || (enemy.name !== "fighter" && enemy.name !== "ufo")) continue;
        var ex = enemy.x - this.x;
        var ey = enemy.y - this.y;

        var dot = this.vel.x * ex + this.vel.y * ey;
        if (dot <= 0) continue;

        var edist = Math.sqrt(ex * ex + ey * ey);
        if (edist < nearestEnemyDist) {
          nearestEnemyDist = edist;
          this.target = enemy;
        }
      }
    }

    // 若没有敌机可锁定，再找陨石
    if (!this.target) {
      var nearestDist = Infinity;
      for (var i = 0; i < Game.sprites.length; i++) {
        var s = Game.sprites[i];
        if (!s.visible || s.name !== "asteroid") continue;
        var dx = s.x - this.x;
        var dy = s.y - this.y;

        // 在前方约-80到80度扇形范围内寻找目标
        // 利用点积与叉积限制搜索角度
        var dot = this.vel.x * dx + this.vel.y * dy;
        var cross = this.vel.x * dy - this.vel.y * dx;
        if (dot <= 0 || Math.abs(cross) > dot * 5.7) continue;  // tan(70°)=2.747，tan(80°)=5.671，tan(85°)=11.43

        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          this.target = s;
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
    var explosionRadius = GameConfig.missileExplosionRadius;
    var myX = this.x;
    var myY = this.y;
    for (var i = 0; i < Game.sprites.length; i++) {
      var s = Game.sprites[i];
      if (!s.visible || s === directHit) continue;
      if (
        s.name === "asteroid" || s.name === "ufo" ||
        s.name === "fighter" || s.name === "fightermissile" || s.name === "fighterbullet"
      ) {
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
    Game.missileExplosionAt(myX, myY, explosionRadius);
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

// 敌对战机导弹：追踪玩家，爆炸半径更小，转向力度更小
const FighterMissile = function () {
  this.init("fightermissile",
    [-2, 3,
      0, -5,
      2, 3]);
  this.time = 0;
  this.bridgesH = false;
  this.bridgesV = false;
  this.postMove = this.wrapPostMove;
  this.maxFlightTime = GameConfig.enemyMissileLifetime;
  this.collidesWith = [];
  this.speed = GameConfig.enemyMissileSpeed;
  this.target = null;

  this.configureTransform = function () { };

  this.draw = function () {
    if (this.visible) {
      this.context.save();
      this.context.translate(this.x, this.y);
      var rad = (this.rot * Math.PI) / 180;
      this.context.rotate(rad);
      this.context.lineWidth = 1.5;
      this.context.strokeStyle = Game.primaryColor;
      this.context.beginPath();
      this.context.moveTo(-2, 3);
      this.context.lineTo(0, -5);
      this.context.lineTo(2, 3);
      this.context.closePath();
      this.context.stroke();
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

    if (!Game.ship.visible) {
      return;
    }

    this.target = Game.ship;
    var dx = this.target.x - this.x;
    var dy = this.target.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > GameConfig.enemyMissileTrackingRange) {
      return;
    }

    if (dist > 0) {
      var dirX = dx / dist;
      var dirY = dy / dist;
      var turnFactor = GameConfig.enemyMissileTurnRate;
      this.vel.x += dirX * turnFactor * delta;
      this.vel.y += dirY * turnFactor * delta;

      var currentSpeed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
      if (currentSpeed > 0) {
        this.vel.x = (this.vel.x / currentSpeed) * this.speed;
        this.vel.y = (this.vel.y / currentSpeed) * this.speed;
      }
    }

    var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
    if (speed > 0.1) {
      this.rot = (Math.atan2(this.vel.y, this.vel.x) * 180 / Math.PI) + 90;
    }
  };

  this.explode = function () {
    if (!this.visible) return;
    this.visible = false;
    if (this.currentNode) {
      this.currentNode.leave(this);
      this.currentNode = null;
    }

    var explosionRadius = GameConfig.enemyMissileExplosionRadius;
    var myX = this.x;
    var myY = this.y;
    for (var i = 0; i < Game.sprites.length; i++) {
      var s = Game.sprites[i];
      if (!s.visible) continue;
      if (s.name === "ship" || s.name === "asteroid" || s.name === "missile") {
        var dx = s.x - myX;
        var dy = s.y - myY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < explosionRadius) {
          var proxy = { name: "fightermissile", x: s.x, y: s.y };
          s.collision(proxy);
        }
      }
    }
    SFX.explosion();
    Game.missileExplosionAt(myX, myY, explosionRadius);
    this.time = 0;
  };

  this.collision = function () {
    this.explode();
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
FighterMissile.prototype = new Sprite();

// 敌对战机
const Fighter = function () {
  this.init("fighter",
    [-5, 4,
      0, -12,
      5, 4]);

  this.children.leftWing = new Sprite();
  this.children.leftWing.init("fighter_leftwing",
    [-11, -8,
    -8, -8,
    -8, 8,
    -11, 8]);
  this.children.leftWing.visible = true;

  this.children.rightWing = new Sprite();
  this.children.rightWing.init("fighter_rightwing",
    [11, -8,
      8, -8,
      8, 8,
      11, 8]);
  this.children.rightWing.visible = true;

  this.children.cockpit = new Sprite();
  this.children.cockpit.init("fighter_cockpit",
    [-3, -2,
      0, -5,
      3, -2,
      0, 2]);
  this.children.cockpit.visible = true;

  this.postMove = this.wrapPostMove;
  this.collidesWith = ["asteroid", "ship", "bullet", "missile"];

  this.bullets = [];
  this.missiles = [];
  this.bulletBurstShotsLeft = 0;
  this.bulletBurstGapCounter = 0;
  this.bulletBurstPauseCounter = 0;
  this.missileCooldown = 0;

  this.setup = function () {
    for (var i = 0; i < 6; i++) {
      var bullet = new FighterBullet();
      this.bullets.push(bullet);
      Game.sprites.push(bullet);
    }
    for (var j = 0; j < 3; j++) {
      var missile = new FighterMissile();
      this.missiles.push(missile);
      Game.sprites.push(missile);
    }
  };

  this.spawn = function (isBoot) {
    var edge = Math.floor(Math.random() * 4);
    if (isBoot) {
      this.x = Game.canvasWidth / 2;
      this.y = Game.canvasHeight / 2;
    } else if (edge === 0) {
      this.x = 20;
      this.y = Math.random() * Game.canvasHeight;
    } else if (edge === 1) {
      this.x = Game.canvasWidth - 20;
      this.y = Math.random() * Game.canvasHeight;
    } else if (edge === 2) {
      this.x = Math.random() * Game.canvasWidth;
      this.y = 20;
    } else {
      this.x = Math.random() * Game.canvasWidth;
      this.y = Game.canvasHeight - 20;
    }
    this.rot = Math.random() * 360;
    this.vel.x = 0;
    this.vel.y = 0;
    this.vel.rot = 0;
    this.acc.x = 0;
    this.acc.y = 0;
    this.bulletBurstShotsLeft = 0;
    this.bulletBurstGapCounter = 0;
    this.bulletBurstPauseCounter = 0;
    this.missileCooldown = GameConfig.enemyMissileSpawnCooldown;
    this.visible = true;
  };

  // 寻找前方一定范围内最近的小行星，作为避障目标
  this.findPathAsteroid = function () {
    var nearest = null;
    var nearestDist = Infinity;
    var forwardX = Math.cos((this.rot - 90) * Math.PI / 180);
    var forwardY = Math.sin((this.rot - 90) * Math.PI / 180);
    for (var i = 0; i < Game.sprites.length; i++) {
      var s = Game.sprites[i];
      if (!s.visible || s.name !== "asteroid") continue;
      var dx = s.x - this.x;
      var dy = s.y - this.y;
      var dot = dx * forwardX + dy * forwardY;
      if (dot <= 0 || dot > 190) continue;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = s;
      }
    }
    return {
      asteroid: nearest,
      distance: nearestDist
    };
  };

  this.normalizeAngle = function (deg) {
    while (deg > 180) deg -= 360;
    while (deg < -180) deg += 360;
    return deg;
  };

  this.fireBullet = function () {
    for (var i = 0; i < this.bullets.length; i++) {
      const spread = 3; // 射击误差范围，单位为度
      if (!this.bullets[i].visible) {
        var bullet = this.bullets[i];
        var error = (Math.random() * 2 - 1) * spread * (Math.PI / 180); // 生成±spread范围内的随机误差，转换为弧度
        var rad = ((this.rot - 90) * Math.PI) / 180 + error;
        var vectorx = Math.cos(rad);
        var vectory = Math.sin(rad);
        bullet.x = this.x + vectorx * 4;
        bullet.y = this.y + vectory * 4;
        bullet.vel.x = GameConfig.enemyBulletSpeed * vectorx + this.vel.x;
        bullet.vel.y = GameConfig.enemyBulletSpeed * vectory + this.vel.y;
        bullet.visible = true;
        SFX.laser();
        break;
      }
    }
  };

  this.fireMissile = function () {
    for (var i = 0; i < this.missiles.length; i++) {
      if (!this.missiles[i].visible) {
        var missile = this.missiles[i];
        var rad = ((this.rot - 90) * Math.PI) / 180;
        var vectorx = Math.cos(rad);
        var vectory = Math.sin(rad);
        missile.x = this.x + vectorx * 4;
        missile.y = this.y + vectory * 4;
        missile.vel.x = missile.speed * vectorx;
        missile.vel.y = missile.speed * vectory;
        missile.rot = this.rot;
        missile.visible = true;
        missile.time = 0;
        missile.target = null;
        SFX.laser();
        break;
      }
    }
  };

  this.preMove = function (delta) {
    if (!this.visible) return;

    var hasShip = Game.ship.visible;
    var toShipX = hasShip ? Game.ship.x - this.x : 0;
    var toShipY = hasShip ? Game.ship.y - this.y : 0;
    var shipDist = Math.sqrt(toShipX * toShipX + toShipY * toShipY);
    var shipAngle = hasShip ? (Math.atan2(toShipY, toShipX) * 180 / Math.PI) + 90 : this.rot;

    var obstacleInfo = this.findPathAsteroid();
    var obstacle = obstacleInfo.asteroid;
    var avoidMode = false;

    // 检查前方区域陨石密度
    var forwardX = Math.cos((this.rot - 90) * Math.PI / 180);
    var forwardY = Math.sin((this.rot - 90) * Math.PI / 180);
    var asteroidCount = 0;
    for (var i = 0; i < Game.sprites.length; i++) {
      var s = Game.sprites[i];
      if (!s.visible || s.name !== "asteroid") continue;
      var dx = s.x - this.x;
      var dy = s.y - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      // 前方一定距离内
      var dot = dx * forwardX + dy * forwardY;
      if (dot > 0 && dist < 300) asteroidCount++;
    }
    // 高密度提前避开
    if (asteroidCount >= 3) avoidMode = true;
    // 或单个陨石距离很近
    if (obstacle && obstacleInfo.distance < 150) avoidMode = true;

    var targetAngle = shipAngle;
    if (avoidMode && obstacle) {
      var dx = obstacle.x - this.x;
      var dy = obstacle.y - this.y;
      var cross = dx * forwardY - dy * forwardX;
      targetAngle = (Math.atan2(dy, dx) * 180 / Math.PI) + (cross > 0 ? 180 : 0);
    }

    var angleDiff = this.normalizeAngle(targetAngle - this.rot);
    if (angleDiff > 4) {
      this.vel.rot = GameConfig.fighterTurnSpeed;
    } else if (angleDiff < -4) {
      this.vel.rot = -GameConfig.fighterTurnSpeed;
    } else {
      this.vel.rot = 0;
    }

    var accelStrength = avoidMode ? GameConfig.fighterAvoidAccel : GameConfig.fighterAccel;
    if (!hasShip) {
      accelStrength = GameConfig.fighterIdleAccel;
    }
    var rad = ((this.rot - 90) * Math.PI) / 180;
    this.acc.x = accelStrength * Math.cos(rad);
    this.acc.y = accelStrength * Math.sin(rad);

    var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
    if (speed > GameConfig.fighterMaxSpeed) {
      this.vel.x *= 0.95;
      this.vel.y *= 0.95;
    }

    if (this.bulletBurstGapCounter > 0) {
      this.bulletBurstGapCounter -= delta;
    }
    if (this.bulletBurstPauseCounter > 0) {
      this.bulletBurstPauseCounter -= delta;
    }

    var canShootShip = hasShip && shipDist < 640 && Math.abs(this.normalizeAngle(shipAngle - this.rot)) < 36;
    var canShootAsteroid = obstacle && obstacleInfo.distance < GameConfig.fighterAsteroidShootRange && Math.abs(angleDiff) < 60;

    // 如果当前没有子弹在连射中，且间隔已到，并且有合适的目标，则开始新一轮连射
    if (this.bulletBurstShotsLeft <= 0 && this.bulletBurstPauseCounter <= 0 && (canShootShip || canShootAsteroid)) {
      this.bulletBurstShotsLeft = GameConfig.enemyBulletBurstCount;
      this.bulletBurstGapCounter = 0;
    }

    if (this.bulletBurstShotsLeft > 0 && this.bulletBurstGapCounter <= 0) {
      this.fireBullet();
      this.bulletBurstShotsLeft--;
      this.bulletBurstGapCounter = GameConfig.enemyBulletBurstShotInterval;
      if (this.bulletBurstShotsLeft <= 0) {
        this.bulletBurstPauseCounter = GameConfig.enemyBulletBurstPause;
      }
    }

    if (this.missileCooldown > 0) {
      this.missileCooldown -= delta;
    }
    // 攻击玩家或陨石时都能发射导弹
    if (
      this.missileCooldown <= 0 &&
      (
        (hasShip && shipDist < 520 && Math.abs(this.normalizeAngle(shipAngle - this.rot)) < 42)
        || canShootAsteroid
      )
    ) {
      this.missileCooldown = GameConfig.enemyMissileCooldown;
      this.fireMissile();
    }
  };

  this.collision = function (other) {
    // if (!this.visible) return;
    if (other.name === "bullet" || other.name === "missile") Game.score += 260;
    // 敌机被击败时的爆炸效果，辉光固定在爆炸点
    var glow = new Glow();
    glow.init('die_glow', 'rgba(255, 198, 128, 1)', 70, 0.3, 200, 0);
    glow.x = this.x;
    glow.y = this.y;
    glow.rot = 0;
    glow.parent = null;
    Game.sprites.push(glow);
    SFX.boom();
    Game.explosionAt(this.x, this.y);
    this.visible = false;

    if (this.currentNode) {
      this.currentNode.leave(this);
      this.currentNode = null;
    }
    // Game.nextFighterTime = Date.now() + 6000 + (Math.random() * 4000);
  };
};
Fighter.prototype = new Sprite();

// 小行星可分裂并计分
const Asteroid = function () {
  var Shapes = [
    // 原有的形状
    [-10, 0, -5, 7, -3, 4, 1, 10, 5, 4, 10, 0, 5, -6, 2, -10, -4, -10, -4, -5],

    // 狭长碎片型 - 像断裂的矛头，左右跨度大
    [-12, 2, -6, 9, -2, 5, 4, 12, 11, 3, 13, -4, 5, -7, 2, -11, -3, -6, -9, -5],

    // 厚重钝角型 - 整体比较方正宽大，凹陷较浅，像一块未完全碎裂的巨石，给人“血量很高”的感觉
    [-11, 3, -7, 10, 0, 6, 7, 10, 12, 4, 10, -5, 6, -3, 2, -11, -5, -9, -8, -3],

    // 深度残缺型 - 有一两个极其夸张的深凹陷，模拟被其他陨石撞击后缺了一大块的样子
    [-10, 5, -5, 12, -1, 5, 5, 10, 11, 6, 13, -3, 6, 0, 5, -9, -2, -11, -6, -5],

    // 锋利燧石型 - 右侧极度尖锐，整体呈现不规则的箭头状，适合作为高速飞行的陨石
    [-11, 2, -6, 8, -2, 4, 3, 11, 7, 5, 12, 0, 7, -6, 1, -11, -4, -8, -9, -3]
  ];
  var shape = Shapes[Math.floor(Math.random() * Shapes.length)];
  this.init("asteroid", shape);

  this.visible = true;
  this.scale = 6;
  this.postMove = this.wrapPostMove;
  this.spawnTime = Date.now();

  this.collidesWith = [
    "ship", "bullet", "missile", "ufo", "fighter", "fighterbullet", "fightermissile"
  ];

  // 命中时分裂、计分并爆炸
  this.collision = function (other) {
    // 新生成的小行星对导弹爆炸的范围伤害有短暂无敌时间（防止被连环炸死）
    if (other.name == "missile" && Date.now() - this.spawnTime < 100) return;

    SFX.explosion();
    if (other.name == "bullet" || other.name == "missile" || other.name == "ship") Game.score += 120 / this.scale;
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
const Explosion = function () {
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
      this.context.strokeStyle = Game.primaryColor;
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
const MissileExplosion = function (explosionRadius) {
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
      this.context.strokeStyle = Game.primaryColor;
      // 粒子线段
      this.context.beginPath();
      for (var i = 0; i < this.lines.length; i++) {
        var line = this.lines[i];
        this.context.moveTo(line[0], line[1]);
        this.context.lineTo(line[2], line[3]);
      }
      this.context.stroke();
      // 扩散环渐变
      var alpha = Math.max(0, 1 - (this.scale - 1) / 13);
      this.context.beginPath();
      this.context.globalAlpha = alpha;
      this.context.arc(0, 0, explosionRadius / this.scale, 0, 2 * Math.PI);
      this.context.stroke();
      this.context.globalAlpha = 1;
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
const GridNode = function () {
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
  color: 'green',
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
    this.context.fillStyle = Game.primaryColor;
    this.context.fill();

    this.context.restore();
  },

  context: null,
  face: null
};

// 音效系统（兼容处理）
const SFX = {
  laser: new Audio('assets/audio/laser.mp3'),
  explosion: new Audio('assets/audio/explosion.mp3'),
  thrust: new Audio('assets/audio/thrust.mp3'),
  boom: new Audio('assets/audio/boom.mp3'),
  muted: false
};

// 为每个音效添加播放方法封装
for (const key in SFX) {
  if (key === 'muted') continue;
  (function (name) {
    var audio = SFX[name];
    // 覆盖为函数调用形式如 SFX.laser()
    SFX[name] = function () {
      if (!SFX.muted) {
        try {
          if (audio.currentTime > 0) audio.currentTime = 0;
          audio.play();
        } catch (e) { }
      }
      return audio;
    };
  })(key);
}

// 全局游戏状态与规则
const Game = {
  score: 0,
  totalAsteroids: 5,
  lives: 0,
  lifeSegmentDamage: 0, // 当前最左生命已消耗的 1/3 段数（0~2）

  canvasWidth: 800,
  canvasHeight: 600,
  primaryColor: GameConfig.lightColor,
  secondaryColor: GameConfig.darkColor,

  sprites: [],
  ship: null,
  ufo: null,
  fighter: null,

  nextUFOTime: null,
  nextFighterTime: null,


  // 在空区域生成一波小行星
  spawnAsteroids: function (count) {
    if (!count) count = this.totalAsteroids;
    var makeGiant = true; // 生成一个大型陨石
    for (var i = 0; i < count; i++) {
      var roid = new Asteroid();
      if (makeGiant) {
        roid.scale = 10;
        makeGiant = false;
      }
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
  missileExplosionAt: function (x, y, radius) {
    var splosion = new MissileExplosion(radius);
    splosion.x = x;
    splosion.y = y;
    splosion.visible = true;
    Game.sprites.push(splosion);
  },

  // 每次受击仅消耗 1/3 条命，累计 3 次才扣 1 条完整生命
  consumeLifeSegment: function () {
    this.lifeSegmentDamage++;
    if (this.lifeSegmentDamage >= 3) {
      this.lifeSegmentDamage = 0;
      this.lives--;
      return true;
    }
    return false;
  },

  // 游戏流程的简单状态机
  FSM: {
    // 初始化，实际上直接进入waiting状态
    boot: function () {
      Game.spawnAsteroids(7);
      Game.fighter.spawn(true);
      this.state = 'waiting';
    },
    // 标题等待状态
    waiting: function () {
      Text.renderText('Press Space to Start', 36, Game.canvasWidth / 2 - 270, Game.canvasHeight / 2);
      if (!Game.fighter.visible) {
        Game.fighter.spawn(); // waiting 阶段敌机死后自动重生，用于展示
      }
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
          Game.sprites[i].name == 'ufo' ||
          Game.sprites[i].name == 'missile' ||
          Game.sprites[i].name == 'fighter' ||
          Game.sprites[i].name == 'fighterbullet' ||
          Game.sprites[i].name == 'fightermissile') {
          Game.sprites[i].visible = false;
        }
      }

      Game.score = 0;
      Game.lives = GameConfig.startLives;
      Game.lifeSegmentDamage = 0;
      Game.totalAsteroids = GameConfig.startAsteroids;
      Game.spawnAsteroids();

      Game.nextUFOTime = Date.now() + 10000 + (10000 * Math.random());
      Game.nextFighterTime = Date.now() + GameConfig.fighterFirstSpawnDelay + (0.5 * GameConfig.fighterFirstSpawnDelay * Math.random());

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
        // 添加重生辉光，否则玩家容易失焦
        var glow = new Glow();
        glow.init('respawn_glow', 'rgba(255,255,128,1)', 200, 0.3, 240, 0);
        glow.parent = Game.ship;
        Game.sprites.push(glow);
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
      if (!Game.ufo.visible &&
        Date.now() > Game.nextUFOTime) {
        Game.ufo.visible = true;
        Game.nextUFOTime = Date.now() + (15000 * Math.random());
      }

      if (!Game.fighter.visible &&
        Game.nextFighterTime != null &&
        Date.now() > Game.nextFighterTime) {
        Game.fighter.spawn();
        Game.nextFighterTime = Date.now() + GameConfig.fighterSpawnInterval + (0.5 * GameConfig.fighterSpawnInterval * Math.random());
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
      if (Game.lives <= 0) {
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
// 监听 DOMContentLoaded 事件，确保在 HTML 元素加载完成后再执行初始化代码
window.addEventListener('DOMContentLoaded', function () {
  // 检测用户系统/浏览器偏好决定配色方案
  function setDarkModeByPreference() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      Game.primaryColor = GameConfig.lightColor;
      Game.secondaryColor = GameConfig.darkColor;
      document.body.classList.add('dark-mode');
    } else {
      Game.primaryColor = GameConfig.darkColor;
      Game.secondaryColor = GameConfig.lightColor;
      document.body.classList.remove('dark-mode');
    }
  }
  setDarkModeByPreference();
  if (window.matchMedia) { // 监听系统/浏览器主题变化，动态切换配色
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setDarkModeByPreference);
  }

  const canvas = document.getElementById('canvas');
  const container = document.querySelector('.container');
  // 动态自适应尺寸
  function setCanvasSize(w, h) {
    canvas.width = w;
    canvas.height = h;
    GameConfig.width = w;
    GameConfig.height = h;
    Game.canvasWidth = w;
    Game.canvasHeight = h;
  }

  function resize() {
    // 以窗口为基准，保持16:9或原始比例
    var w = window.innerWidth;
    var h = window.innerHeight;
    setCanvasSize(w, h);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }

  window.addEventListener('resize', resize);
  resize();

  var context = canvas.getContext("2d");
  Text.context = context;
  Glow.prototype.context = context;
  Text.face = vector_battle;

  // 构建碰撞分区网格
  const gridWidth = Math.round(Game.canvasWidth / GRID_SIZE);
  const gridHeight = Math.round(Game.canvasHeight / GRID_SIZE);
  const grid = new Array(gridWidth);
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

  const sprites = [];
  Game.sprites = sprites;

  // 共享渲染上下文与矩阵
  Sprite.prototype.context = context;
  Sprite.prototype.grid = grid;
  Sprite.prototype.matrix = new Matrix(2, 3);

  const ship = new Ship();

  ship.x = Game.canvasWidth / 2;
  ship.y = Game.canvasHeight / 2;

  sprites.push(ship);

  ship.bullets = [];
  for (let i = 0; i < GameConfig.playerMaxBullets; i++) {
    const bull = new Bullet();
    ship.bullets.push(bull);
    sprites.push(bull);
  }

  ship.missiles = [];
  for (let i = 0; i < 5; i++) {
    const miss = new Missile();
    ship.missiles.push(miss);
    sprites.push(miss);
  }
  Game.ship = ship;

  const ufo = new UFO();
  ufo.setup();
  sprites.push(ufo);
  Game.ufo = ufo;

  const fighter = new Fighter();
  fighter.setup();
  sprites.push(fighter);
  Game.fighter = fighter;

  const extraDude = new Ship();
  extraDude.scale = 0.6;
  extraDude.visible = true;
  extraDude.preMove = null;
  extraDude.children = [];

  var i, j = 0;

  let paused = false;
  let showFramerate = false;
  let showPlayerUi = true;
  let avgFramerate = 0;
  let frameCount = 0;
  let elapsedCounter = 0;

  let lastFrame = Date.now();
  let thisFrame;
  let elapsed;
  let delta;

  const canvasNode = canvas;

  // requestAnimationFrame 兼容层（setTimeout 兜底）
  // 来源：
  // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
  const requestAnimFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) { window.setTimeout(callback, 1000 / 60); };

  // 主渲染/更新循环
  const mainLoop = function () {
    // 根据模式设置底色
    context.fillStyle = Game.secondaryColor;
    context.fillRect(0, 0, Game.canvasWidth, Game.canvasHeight);
    context.clearRect(0, 0, Game.canvasWidth, Game.canvasHeight);

    Game.FSM.execute();

    if (container) {
      var panelVisible = paused || Game.FSM.state === 'waiting' || Game.FSM.state === 'boot';
      container.classList.toggle('show-panels', panelVisible);
    }

    // 更新右侧面板状态显示
    function setStatus(id, value) {
      var el = document.getElementById(id);
      if (el) el.textContent = value;
    }
    setStatus('status-darkmode', document.body.classList.contains('dark-mode') ? '开' : '关');
    setStatus('status-mute', SFX && SFX.muted ? '开' : '关');
    setStatus('status-framerate', showFramerate ? '开' : '关');
    setStatus('status-grid', KEY_STATUS.grid ? '开' : '关');
    setStatus('status-playerui', showPlayerUi ? '开' : '关');

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

    if (paused) { // 仅渲染，不刷新位置
      delta = 0;
      console.warn('仅渲染');
    }
    else {
      thisFrame = Date.now();
      elapsed = thisFrame - lastFrame;
      lastFrame = thisFrame;
      delta = elapsed / 30;
      // console.log('正常更新位置，delta:', delta);
    }
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

      // 最左生命图标按 1/3、2/3 逐步从下往上涂黑
      if (i === Game.lives - 1 && Game.lifeSegmentDamage > 0) {
        var triBottom = 4;
        var triTop = -12;
        var triHeight = triBottom - triTop;
        var fillStartY = triBottom - (Game.lifeSegmentDamage / 3) * triHeight;

        context.save();
        context.beginPath();
        context.moveTo(-5, 4);
        context.lineTo(0, -12);
        context.lineTo(5, 4);
        context.closePath();
        context.clip();
        context.fillStyle = Game.primaryColor;
        context.fillRect(-6, fillStartY, 12, triBottom - fillStartY);
        context.restore();
      }

      context.restore();
    }

    // 帧率显示（F 切换，左上角）
    if (showFramerate) {
      context.save();
      context.fillStyle = Game.primaryColor;
      var fpsText = '' + avgFramerate;
      Text.renderText(fpsText, 22, (10 * fpsText.length), 42);
      context.restore();
    }

    // 速度/子弹UI（J 切换）
    if (showPlayerUi) {
      var currentSpeed = 0;
      if (Game.ship && Game.ship.visible) {
        currentSpeed = Math.sqrt(Game.ship.vel.x * Game.ship.vel.x + Game.ship.vel.y * Game.ship.vel.y);
      }

      var speedInt = Math.round(currentSpeed);

      context.save();
      context.fillStyle = Game.primaryColor;
      Text.renderText('' + speedInt, 20, 10, Game.canvasHeight - 20);

      var availableBullets = 0;
      if (Game.ship && Game.ship.bullets) {
        for (var bi = 0; bi < Game.ship.bullets.length; bi++) {
          if (!Game.ship.bullets[bi].visible) {
            availableBullets++;
          }
        }
      }
      var bulletUiText = availableBullets + '/' + GameConfig.playerMaxBullets;
      Text.renderText(bulletUiText, 20, Game.canvasWidth - (14 * bulletUiText.length) - 8, Game.canvasHeight - 20);

      var barMaxHeight = Math.floor(Game.canvasHeight / 4);
      var barWidth = 4;
      var speedFullScale = 12;

      if (speedInt > 0) {
        var speedBarHeight = Math.min(barMaxHeight, Math.round((currentSpeed / speedFullScale) * barMaxHeight));
        if (speedBarHeight > 0) {
          context.fillRect(0, Game.canvasHeight - speedBarHeight, barWidth, speedBarHeight);
        }
      }

      context.restore();
    }

    // 暂停显示与循环控制
    if (paused) {
      Text.renderText('PAUSED', 72, Game.canvasWidth / 2 - 160, 120);
    } else {
      // 计算平均帧率
      frameCount++;
      elapsedCounter += elapsed;
      if (elapsedCounter > 1000) {
        elapsedCounter -= 1000;
        avgFramerate = frameCount;
        frameCount = 0;
      }
      // 继续下一帧
      requestAnimFrame(mainLoop);
    }
  };

  mainLoop();

  // 使用 keyup 防止按住按键反复触发切换
  window.addEventListener('keyup', function (e) {
    var mutedBeforePause;
    switch (KEY_CODES[e.keyCode]) {
      case 'pause': // 暂停
        if (Game.FSM.state === 'waiting') break; // 标题界面不允许暂停
        paused = !paused;
        if (paused) {
          mutedBeforePause = SFX.muted;
          // ship.stopThrust(); // 停止thrust音效
          // 暂停时彻底停止所有音效播放
          this.thrustPlaying = false;
          for (const key in SFX) {
            if (typeof SFX[key] === 'function') {
              const audio = SFX[key]();
              if (audio && typeof audio.pause === 'function') {
                audio.pause();
                audio.currentTime = 0;
              }
            }
          }
        } else {  // 继续运行
          SFX.muted = mutedBeforePause; // 恢复暂停前的静音状态
          lastFrame = Date.now();
          mainLoop();
        }
        break;
      case 'framerate': // 显示帧率
        showFramerate = !showFramerate;
        break;
      case 'playerui': // 速度/子弹UI
        showPlayerUi = !showPlayerUi;
        break;
      case 'mute': // 静音
        SFX.muted = !SFX.muted;
        break;
      case 'darkmode': // 暗黑模式
        if (Game.primaryColor === GameConfig.darkColor) {
          Game.primaryColor = GameConfig.lightColor;
          Game.secondaryColor = GameConfig.darkColor;
          document.body.classList.add('dark-mode');
        } else {
          Game.primaryColor = GameConfig.darkColor;
          Game.secondaryColor = GameConfig.lightColor;
          document.body.classList.remove('dark-mode');
        }
        if (paused) mainLoop(); // 如果暂停时切换黑白，立即重新仅渲染
        break;
    }
  });
});

// vim: fdl=0
