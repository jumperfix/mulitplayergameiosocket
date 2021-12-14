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
  //Background
  this.load.image("background","assets/images/castlebackground.png",{
      frameWidth: 1080,
      frameHeight: 720
  });

  //schoolgirl
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


  //champSoc
  this.load.spritesheet("champsoc_idle","assets/spritesheets/Idle.png",{
      frameWidth: 17,
      frameHeight: 34,
      spacing: 25
    });
    this.load.spritesheet("champsoc_run","assets/spritesheets/run.png",{
      frameWidth: 19,
      frameHeight: 36,
      spacing: 25
    });
    this.load.spritesheet("champsoc_jump","assets/spritesheets/JumpAni.png",{
      frameWidth: 21,
      frameHeight: 33,
      spacing: 25
    });
    this.load.spritesheet("champsoc_punch_hor","assets/spritesheets/Punch.png",{
      frameWidth: 37,
      frameHeight: 34,
      spacing: 25
    });
    this.load.spritesheet("champsoc_punch_up","assets/spritesheets/Punchup_cropped.png",{
      frameWidth: 19,
      frameHeight: 42,
      spacing: 56
    });
    this.load.spritesheet("champsoc_punch_down","assets/spritesheets/PunchDown_cropped.png",{
      frameWidth: 29,
      frameHeight: 39,
      spacing: 50
    });
    this.load.spritesheet("champsoc_smash_hor","assets/spritesheets/Slap_cropped2.png",{
      frameWidth: 41,
      frameHeight: 34,
      spacing: 25
    });
    this.load.spritesheet("champsoc_smash_down","assets/spritesheets/SmashDown_cropped.png",{
      frameWidth: 30,
      frameHeight: 34,
      spacing: 51
    });
    this.load.spritesheet("champsoc_smash_up","assets/spritesheets/rage.png",{
      frameWidth: 40,
      frameHeight: 39,
      spacing: 25
    });
    this.load.spritesheet("champsoc_hit","assets/spritesheets/hit.png",{
      frameWidth: 36,
      frameHeight: 36,
      spacing: 25
    });

  //environment
  this.load.spritesheet("groundblock","assets/images/groundblock.png",{
      frameWidth: 50,
      frameHeight: 50
    });

    this.load.spritesheet("woodblock","assets/images/woodblock.png",{
      frameWidth: 50,
      frameHeight: 50
    });

    //explosion
    this.load.spritesheet("explosion","assets/spritesheets/explosion.png",{
      frameWidth: 16,
      frameHeight: 16
    });
}

function create() {
  //schoolgirl animations
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

    //champSoc animations
    this.anims.create({
      key: "champsoc_idle_anim",
      frames: this.anims.generateFrameNumbers("champsoc_idle"),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "champsoc_run_anim",
      frames: this.anims.generateFrameNumbers("champsoc_run"),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "champsoc_jump_anim",
      frames: this.anims.generateFrameNumbers("champsoc_jump"),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "champsoc_punch_hor_anim",
      frames: this.anims.generateFrameNumbers("champsoc_punch_hor"),
      frameRate: 15,
      repeat: 0
    });
    this.anims.create({
      key: "champsoc_punch_up_anim",
      frames: this.anims.generateFrameNumbers("champsoc_punch_up"),
      frameRate: 15,
      repeat: 0
    });
    this.anims.create({
      key: "champsoc_punch_down_anim",
      frames: this.anims.generateFrameNumbers("champsoc_punch_down"),
      frameRate: 15,
      repeat: 0
    });
    this.anims.create({
      key: "champsoc_smash_hor_anim",
      frames: this.anims.generateFrameNumbers("champsoc_smash_hor"),
      frameRate: 15,
      repeat: 0
    });
    this.anims.create({
      key: "champsoc_smash_down_anim",
      frames: this.anims.generateFrameNumbers("champsoc_smash_down"),
      frameRate: 10,
      repeat: 0
    });
    this.anims.create({
      key: "champsoc_smash_up_anim",
      frames: this.anims.generateFrameNumbers("champsoc_smash_up"),
      frameRate: 15,
      repeat: 0
    });
    this.anims.create({
      key: "champsoc_hit_anim",
      frames: this.anims.generateFrameNumbers("champsoc_hit"),
      frameRate: 10,
      repeat: 0
    });

    //explosion animation
    this.anims.create({
      key: "explosion_anim",
      frames: this.anims.generateFrameNumbers("explosion"),
      frameRate: 20,
      repeat: 0,
      hideOnComplete: true
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
        displayPlayers(self, players[id], 'champsoc_idle','champsoc_idle_anim');
      } else {
        displayPlayers(self, players[id], 'champsoc_idle','champsoc_idle_anim');
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    displayPlayers(self, playerInfo, 'champsoc_idle','champsoc_idle_anim');
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
          //player.setOrigin(0.5, 0.5);
          player.setPosition(players[id].x, players[id].y);
          player.flipX = players[id].xflipped;
          if (player.oldstate !== players[id].state)
          {
            if (players[id].state === 'idle')
            {
              player.play("champsoc_idle_anim");
              player.alpha = 1.0;
              player.oldstate = 'idle';
              player.setOrigin(0.5, 0.5);
            }

            else if (players[id].state === 'move') {
              player.play("champsoc_run_anim");
              player.alpha = 1.0;
              player.oldstate = 'move';
              player.setOrigin(0.5, 0.5);

            }
            else if (players[id].state === 'jump') {
              player.play("champsoc_jump_anim");
              player.alpha = 1.0;
              player.oldstate = 'jump';
              player.setOrigin(0.5, 0.5);
            }
            else if (players[id].state === 'hurt') {
              player.play("champsoc_hit_anim");
              player.oldstate = 'hurt';
              player.setOrigin(0.5, 0.5);
            }
            else if (players[id].state === 'dodge_move') {
              player.setOrigin(0.5, 0.5);
              player.play("champsoc_run_anim");
              player.alpha = 0.5;
              player.oldstate = 'dodge_move';
            }
            else if (players[id].state === 'dodge_jump') {
              player.setOrigin(0.5, 0.5);
              player.play("champsoc_jump_anim");
              player.alpha = 0.5;
              player.oldstate = 'dodge_jump';
            }
            else if (players[id].state === 'dodge_idle') {
              player.setOrigin(0.5, 0.5);
              player.play("champsoc_idle_anim");
              player.alpha = 0.5;
              player.oldstate = 'dodge_idle';
            }
            else if (players[id].state === 'horattack_right') {
              player.setOrigin(0.3, 0.5);
              player.play("champsoc_punch_hor_anim");
              player.once('animationcomplete', () => {
                player.setOrigin(0.5, 0.5);
              });
              player.oldstate = 'horattack_right';
            }
            else if (players[id].state === 'horattack_left') {
              player.setOrigin(0.7, 0.5);
              player.play("champsoc_punch_hor_anim");
              player.once('animationcomplete', () => {
                player.setOrigin(0.5, 0.5);
              });
              player.oldstate = 'horattack_left';
            }
            else if (players[id].state === 'attack_up') {
              player.setOrigin(0.5, 0.6);
              player.play("champsoc_punch_up_anim");
              player.once('animationcomplete', () => {
                player.setOrigin(0.5, 0.5);
              });
              player.oldstate = 'attack_up';
            }
            else if (players[id].state === 'attack_down') {
              player.setOrigin(0.5, 0.3);
              player.play("champsoc_punch_down_anim");
              player.once('animationcomplete', () => {
                player.setOrigin(0.5, 0.5);
              });
              player.oldstate = 'attack_down';
            }
            else if (players[id].state === 'horsmash_right') {
              player.setOrigin(0.3, 0.5);
              player.play("champsoc_smash_hor_anim");
              player.once('animationcomplete', () => {
                player.setOrigin(0.5, 0.5);
              });
              player.oldstate = 'horsmash_right';
            }
            else if (players[id].state === 'horsmash_left') {
              player.setOrigin(0.7, 0.5);
              player.play("champsoc_smash_hor_anim");
              player.once('animationcomplete', () => {
                player.setOrigin(0.5, 0.5);
              });
              player.oldstate = 'horsmash_left';
            }
            else if (players[id].state === 'smash_up') {
              player.setOrigin(0.5, 0.6);
              player.play("champsoc_smash_up_anim");
              player.once('animationcomplete', () => {
                player.setOrigin(0.5, 0.5);
              });
              player.oldstate = 'smash_up';
            }
            else if (players[id].state === 'smash_down') {
              player.setOrigin(0.5, 0.5);
              player.play("champsoc_smash_down_anim");
              player.once('animationcomplete', () => {
                player.setOrigin(0.5, 0.5);
              });
              player.oldstate = 'smash_down';
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

  this.socket.on('resetPlayer', function (explosion) {
    //const explosion = self.add.sprite(explosion_x, explosion_y, explosion).setScale(2);
    var explosion_sprite = self.add.sprite(explosion.x, explosion.y, explosion).setScale(10);
    explosion_sprite.play("explosion_anim");

  });
  //this.socket.on('starLocation', function (starLocation) {
  //  if (!self.star) {
  //    self.star = self.add.image(starLocation.x, starLocation.y, 'star');
  //  } else {
  //    self.star.setPosition(starLocation.x, starLocation.y);
  //  }
  //});
  this.keysplayer = this.input.keyboard.addKeys({ 'left': Phaser.Input.Keyboard.KeyCodes.LEFT, 'right': Phaser.Input.Keyboard.KeyCodes.RIGHT,'up': Phaser.Input.Keyboard.KeyCodes.UP, 'down': Phaser.Input.Keyboard.KeyCodes.DOWN,'space': Phaser.Input.Keyboard.KeyCodes.V, 'smash': Phaser.Input.Keyboard.KeyCodes.B, 'dodge': Phaser.Input.Keyboard.KeyCodes.C });

  this.cursors = this.input.keyboard.createCursorKeys();
  this.leftKeyPressed = false;
  this.rightKeyPressed = false;
  this.upKeyPressed = false;
  this.downKeyPressed = false;
  this.spaceKeyPressed = false;
  this.smashKeyPressed = false;
  this.dodgeKeyPressed = false;

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
  const smash = this.smashKeyPressed;
  const dodge = this.dodgeKeyPressed;
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
  } else if (this.keysplayer.down.isDown) {
    this.downKeyPressed = true;
  }
  else {
    this.upKeyPressed = false;
    this.downKeyPressed = false;
  }
  if (this.keysplayer.space.isDown) {
    this.spaceKeyPressed = true;
  } else {
    this.spaceKeyPressed = false;
  }
  if (this.keysplayer.smash.isDown) {
    this.smashKeyPressed = true;
  } else {
    this.smashKeyPressed = false;
  }
  if (this.keysplayer.dodge.isDown) {
    this.dodgeKeyPressed = true;
  } else {
    this.dodgeKeyPressed = false;
  }
  if (left !== this.leftKeyPressed || right !== this.rightKeyPressed || up !== this.upKeyPressed || down !== this.downKeyPressed || space !== this.spaceKeyPressed || smash !== this.smashKeyPressed || dodge !== this.dodgeKeyPressed) {
    this.socket.emit('playerInput', { left: this.leftKeyPressed , right: this.rightKeyPressed, up: this.upKeyPressed, down: this.downKeyPressed, space: this.spaceKeyPressed, smash:this.smashKeyPressed, dodge:this.dodgeKeyPressed});
  }
}

function displayPlayers(self, playerInfo, sprite, sprite_anim) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setScale(2); //.setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  player.oldstate = 'idle';
  player.play(sprite_anim);
  if (playerInfo.team === 1) player.setTint(0x7777ff);
  else player.setTint(0xff7777);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}
