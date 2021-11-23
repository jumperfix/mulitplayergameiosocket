var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1080,
  height: 720,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};
var game = new Phaser.Game(config);
function preload() {
  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');



  this.load.image('star', 'assets/star_gold.png');
  this.load.image("background","assets/images/castlebackground.png",{
      frameWidth: 1080,
      frameHeight: 720
  });
  this.load.spritesheet("player1","assets/spritesheets/sprites-idle.png",{
      frameWidth: 30,
      frameHeight: 48,
      spacing: 18
  });
  this.load.spritesheet("player1_jump","assets/spritesheets/sprites-jump.png",{
      frameWidth: 30,
      frameHeight: 48,
      spacing: 18
    });
  this.load.spritesheet("player1_run","assets/spritesheets/sprites-run.png",{
      frameWidth: 30,
      frameHeight: 48,
      spacing: 18
    });
  this.load.spritesheet("player1_attack","assets/spritesheets/sprites-attack.png",{
      frameWidth: 32,
      frameHeight: 48,
      spacing: 16
    });
  this.load.spritesheet("player1_death","assets/spritesheets/sprites-death.png",{
      frameWidth: 48,
      frameHeight: 48
    });

  this.load.spritesheet("groundblock","assets/images/groundblock.png",{
      frameWidth: 50,
      frameHeight: 50
    });

    this.load.spritesheet("woodblock","assets/images/woodblock.png",{
      frameWidth: 50,
      frameHeight: 50
    });
}

function create() {
  this.anims.create({
      key: "player1_idle_anim",
      frames: this.anims.generateFrameNumbers("player1"),
      frameRate: 5,
      repeat: -1
    });
  this.anims.create({
      key: "player1_jump_anim",
      frames: this.anims.generateFrameNumbers("player1_jump"),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "player1_run_anim",
      frames: this.anims.generateFrameNumbers("player1_run"),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
       key: "player1_attack_anim",
       frames: this.anims.generateFrameNumbers("player1_attack"),
       frameRate: 10,
       repeat: 0
     });

    this.anims.create({
      key: "player1_death_anim",
      frames: this.anims.generateFrameNumbers("player1_death"),
      frameRate: 5,
      repeat: 0
    });




  var self = this;

  this.background = this.add.tileSprite(0,0,config.width,config.height, "background");
  this.background.setOrigin(0,0);

  this.socket = io();
  this.players = this.add.group();
  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        displayPlayers(self, players[id], 'player1');
      } else {
        displayPlayers(self, players[id], 'player1');
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    displayPlayers(self, playerInfo, 'otherPlayer');
  });

  this.socket.on('disconnect', function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  });

  this.socket.on('playerUpdates', function (players) {
    Object.keys(players).forEach(function (id) {
      self.players.getChildren().forEach(function (player) {
        if (players[id].playerId === player.playerId) {
          //player.setRotation(players[id].rotation);
          player.setPosition(players[id].x, players[id].y);
          player.flipX = players[id].xflipped;
          if (player.oldstate !== players[id].state)
          {
            if (players[id].state === 'idle')
            {
              player.play("player1_idle_anim");
              player.oldstate = 'idle';
            }

            else if (players[id].state === 'move') {
              player.play("player1_run_anim");
              player.oldstate = 'move';

            }
            else if (players[id].state === 'jump') {
              player.play("player1_jump_anim");
              player.oldstate = 'jump';
            }
            else if (players[id].state === 'hurt') {
              player.play("player1_death_anim");
              player.oldstate = 'hurt';
            }
            else if (players[id].state === 'attack') {
              player.play("player1_attack_anim");
              player.oldstate = 'attack';
            }
          }
        }
      });
    });
  });

  this.socket.on('updateScore', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });
  //this.socket.on('starLocation', function (starLocation) {
  //  if (!self.star) {
  //    self.star = self.add.image(starLocation.x, starLocation.y, 'star');
  //  } else {
  //    self.star.setPosition(starLocation.x, starLocation.y);
  //  }
  //});
  this.keysplayer = this.input.keyboard.addKeys({ 'left': Phaser.Input.Keyboard.KeyCodes.LEFT, 'right': Phaser.Input.Keyboard.KeyCodes.RIGHT,'up': Phaser.Input.Keyboard.KeyCodes.UP, 'down': Phaser.Input.Keyboard.KeyCodes.DOWN,'space': Phaser.Input.Keyboard.KeyCodes.SPACE });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
  this.downKeyPressed = false;
  this.spaceKeyPressed = false;

  //set environment
    this.platforms = this.add.group();

    var groundtile = this.add.tileSprite(0,618,2*config.width,50, "groundblock");
    this.platforms.add(groundtile);


    var woodplatform1 = this.add.tileSprite(0,400,10*50,50, "woodblock");
    this.platforms.add(woodplatform1);

    var woodplatform2 = this.add.tileSprite(400,200,5*50,50, "woodblock");
    this.platforms.add(woodplatform2);

}

function update() {

  const left = this.leftKeyPressed;
  const right = this.rightKeyPressed;
  const up = this.upKeyPressed;
  const down = this.downKeyPressed;
  const space = this.spaceKeyPressed;
  if (this.keysplayer.left.isDown) {
    this.leftKeyPressed = true;
  } else if (this.keysplayer.right.isDown) {
    this.rightKeyPressed = true;
  } else {
    this.leftKeyPressed = false;
    this.rightKeyPressed = false;
  }
  if (this.keysplayer.up.isDown) {
    this.upKeyPressed = true;
  } else {
    this.upKeyPressed = false;
  }
  if (this.keysplayer.space.isDown) {
    this.spaceKeyPressed = true;
  } else {
    this.spaceKeyPressed = false;
  }
  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || space !== this.spaceKeyPressed) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed, space: this.spaceKeyPressed });
  }
}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite); //.setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  player.oldstate = 'idle';
  player.play("player1_idle_anim");
  if (playerInfo.team === 1) player.setTint(0x0000ff);
  else player.setTint(0xff0000);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}
