const players = {};
const stateMachinesarr = {};
const playerObject = {};
const hitboxes = {};


const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 1080,//1024,//256,
  height: 720,//768,
  autoFocus: false,
  physics: {
      default: 'matter',
      matter:{
        gravity: {y: 0.5},
        //gravity: {y: 0},
        debug: true
      }
    },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  plugins: {
      scene: [
        {
          plugin: PhaserMatterCollisionPlugin.default, // The plugin class
          key: "matterCollision", // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
          mapping: "matterCollision" // Where to store in the Scene, e.g. scene.matterCollision

          // Note! If you are including the library via the CDN script tag, the plugin
          // line should be:
          // plugin: PhaserMatterCollisionPlugin.default
        }
      ]
    }
};

function preload() {
  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('star', 'assets/star_gold.png');
  this.load.spritesheet("player1","assets/spritesheets/sprites-idle.png",{
      frameWidth: 30,
      frameHeight: 48,
      spacing: 18
    });
    this.load.spritesheet("champsoc_idle","assets/spritesheets/Idle.png",{
      frameWidth: 17,
      frameHeight: 34,
      spacing: 25
    });






    this.load.spritesheet("groundblock","assets/images/groundblock.png",{
      frameWidth: 50,
      frameHeight: 50
    });

    this.load.spritesheet("woodblock","assets/images/woodblock.png",{
      frameWidth: 50,
      frameHeight: 50
    });

    this.load.spritesheet("invis","assets/spritesheets/invis.png",{
      frameWidth: 43,
      frameHeight: 12
    });


}
function create() {
  this.teamselector = 0;

  this.hb1Category = this.matter.world.nextCategory();
  this.hb2Category = this.matter.world.nextCategory();

  //this.matter.world.setBounds(0, 0, 1080, 720);
  const self = this;
  this.players = this.add.group();
  this.npc = this.matter.add.sprite(100, 100, 'player1').setScale(1).setFixedRotation();
  this.npc.input = {
    left: false,
    right: false,
    up: false,
    space: false
  };

  this.stateMachineplayer1 = new StateMachine('idle', {
        idle: new IdleState(),
        move: new MoveState(),
        attack: new AttackState(),
        hurt: new HurtState(),
        //swing: new SwingState(),
        //dash: new DashState(),
    }, [self, self.npc,self.npc.input]);

  io.on('connection', function (socket) {
    console.log('a user connected');
    // create a new player and add it to our players object
    players[socket.id] = {
      //rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      input: {
        left: false,
        right: false,
        up: false,
        down: false,
        space: false,
        smash: false,
        dodge: false
      },
      state: 'idle',
      xflipped: false,
      team:0
    };
    // add player to server
    addPlayer(self, players[socket.id]);

    stateMachinesarr[socket.id] = new StateMachine('idle', {
          idle: new IdleState(),
          move: new MoveState(),
          attack_hor: new AttackHorState(),
          attack_up: new AttackUpState(),
          attack_down: new AttackDownState(),
          smash_hor: new SmashHorState(),
          smash_up: new SmashUpState(),
          smash_down: new SmashDownState(),
          hurt: new HurtState(),
          dodge: new DodgeState(),
          respawn: new RespawnState()
        }, [self, players[socket.id],playerObject[socket.id]]);
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);
    // send the current scores
    socket.emit('updateScore', self.scores);
    socket.on('disconnect', function () {
      console.log('user disconnected');
      // remove player from server
      removePlayer(self, socket.id);
      // remove this player from our players object
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit('disconnect', socket.id);
    });
    // when a player moves, update the player data
    socket.on('playerInput', function (inputData) {
      handlePlayerInput(self, socket.id, inputData);
    });
  });




  this.scores = {
    blue: 0,
    red: 0
  };
  //set collision categories
  this.staticCategory = this.matter.world.nextCategory();
  this.heroCategory = this.matter.world.nextCategory();

  //set environment
    this.platforms = this.add.group();

    var groundtile = this.add.tileSprite(0,618,2*config.width,50, "groundblock");
    this.ground = this.matter.add.gameObject(groundtile,{ isStatic: true,label:"ground"});
    this.platforms.add(this.ground);

    var woodplatform1 = this.add.tileSprite(0,400,10*50,50, "woodblock");
    this.woodplatform1 = this.matter.add.gameObject(woodplatform1,{ isStatic: true, label:"woodplatform1"});
    this.platforms.add(this.woodplatform1);

    var woodplatform2 = this.add.tileSprite(400,200,5*50,50, "woodblock");
    this.woodplatform2 = this.matter.add.gameObject(woodplatform2,{ isStatic: true , label:"woodplatform2"});
    this.platforms.add(this.woodplatform2);


    //set Collisions
    this.ground.setCollisionCategory(this.staticCategory);
    this.woodplatform1.setCollisionCategory(this.staticCategory);
    this.woodplatform2.setCollisionCategory(this.staticCategory);
    //this.matterCollision.addOnCollideStart({
    //    objectA: this.npc,
    //    objectB: [this.woodplatform1, this.woodplatform2, this.ground],
    //    callback: eventData => {
    //      this.npc.canJump = true;
    //      // eventData.gameObjectB will be the specific enemy that was hit!
    //    }
    //  });

    //this.matterCollision.addOnCollideStart({
    //  objectA: [playerObject],
    //  objectB: [hitboxes],
    //  callback: eventData => {
    //    console.log("collision detected");
    //    if(eventData.gameObjectA.team === 1 && eventData.gameObjectB.team === 2){
    //      console.log("get punched");
    //      stateMachinesarr[eventData.gameObjectA.playerId].transition('hurt');
    //      eventData.gameObjectA.setVelocityX(5);
    //    }
    //    else if(eventData.gameObjectA.team === 2 && eventData.gameObjectB.team === 1){
    //      console.log("get punched");
    //      stateMachinesarr[eventData.gameObjectA.playerId].transition('hurt');
    //      eventData.gameObjectA.setVelocityX(5);
    //    }
        //eventData.gameObjectA
        //stateMachinesarr[eventData.gameObjectA.playerId].transition('hurt');
        //console.log("get punched");
        //this.stateMachineplayer2.transition('hurt');
        //if(this.player2.x > this.player1.x){
        //  this.player2.setVelocityX(5);
        //}
        //else{
        //  this.player2.setVelocityX(-5);
        //}
        // eventData.gameObjectB will be the specific enemy that was hit!
    //  }
    //});


}
function update() {

  this.players.getChildren().forEach((player) => {
    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;

    stateMachinesarr[player.playerId].step();

    if(player.x>1400 || player.x < -400){
      //if(playerObject[player.playerId].lifes <= 0){
      //  player.destroy();
      //}
      resetPlayer(this.scores, players[player.playerId]);
      //this.time.addEvent({
      //  delay: 1000,
      //  callback: ()=>{
      //   playerObject[player.playerId].active = true;
      //  },
      //  loop: false
      //});
    }
    else if (player.y>1000 || player.y < -400) {
      //if(playerObject[player.playerId].lifes <= 0){
      //  player.destroy();
      //}
      resetPlayer(this.scores, players[player.playerId]);
      //this.time.addEvent({
      //  delay: 1000,
      //  callback: ()=>{
      //   playerObject[player.playerId].active = true;
      //  },
      //  loop: false
      //});
    }
  });
  io.emit('playerUpdates', players);

}
  function resetPlayer(score, playerInfo){
    if(playerObject[playerInfo.playerId].x>1400)
    {
      var explosion_x = 1000;
      if(playerObject[playerInfo.playerId].y>720)
      {
        var explosion_y = 670;
      }
      else if (playerObject[playerInfo.playerId].y<0) {
        var explosion_y = 0;
      }
      else{
        var explosion_y = playerObject[playerInfo.playerId].y;
      }
    }
    else if (playerObject[playerInfo.playerId].x < -400) {
      var explosion_x = 0;
      if(playerObject[playerInfo.playerId].y>720)
      {
        var explosion_y = 670;
      }
      else if (playerObject[playerInfo.playerId].y<0) {
        var explosion_y = 0;
      }
      else{
        var explosion_y = playerObject[playerInfo.playerId].y;
      }
    }
    else if (playerObject[playerInfo.playerId].y > 1000) {
      var explosion_y = 670;
      if(playerObject[playerInfo.playerId].x>1080)
      {
        var explosion_x = 1020;
      }
      else if (playerObject[playerInfo.playerId].y<0) {
        var explosion_x = 0;
      }
      else{
        var explosion_x = playerObject[playerInfo.playerId].x;
      }
    }
    else{
      var explosion_y = 0;
      if(playerObject[playerInfo.playerId].x>1080)
      {
        var explosion_x = 1020;
      }
      else if (playerObject[playerInfo.playerId].x<0) {
        var explosion_x = 0;
      }
      else{
        var explosion_x = playerObject[playerInfo.playerId].x;
      }
    }
    var explosion_info = {
      x: explosion_x,
      y: explosion_y
    }
    io.emit('resetPlayer', explosion_info);
    if(playerInfo.team === 1){
      score.red = score.red +1;
    }
    else{
      score.blue = score.blue +1;
    }
    io.emit('updateScore', score);

    playerObject[playerInfo.playerId].lifes = playerObject[playerInfo.playerId].lifes - 1;
    playerObject[playerInfo.playerId].x = Math.floor(Math.random() * 700) + 50;
    playerObject[playerInfo.playerId].y = Math.floor(Math.random() * 100) + 100;
    stateMachinesarr[playerInfo.playerId].transition('respawn');
    //playerInfo.state = 'respawn';
    //if(playerObject[playerInfo.playerId].lifes >0){
    //}
    //else{
    //  delete players[playerInfo.playerId];
    //  delete playerObject[playerInfo.playerId]
    //}
    //self.time.addEvent({
    //  delay: 1000,
    //  callback: ()=>{
    //    playerObject[playerInfo.playerId].active = true;
    //  },
    //  loop: false
    //});

  }

  function addPlayer(self, playerInfo) {
    //self.matterCollision.removeOnCollideStart({
    //  objectA: [playerObject],
    //  objectB: [hitboxes],
    //  callback: onCollide
    //});
  playerObject[playerInfo.playerId] = self.matter.add.sprite(playerInfo.x, playerInfo.y, 'champsoc_idle').setScale(2).setFixedRotation().setFriction(0);
  playerObject[playerInfo.playerId].setCollisionCategory(self.heroCategory);
  playerObject[playerInfo.playerId].setCollidesWith(self.staticCategory);
  playerObject[playerInfo.playerId].canJump = 1;
  playerObject[playerInfo.playerId].dmg = 0;
  playerObject[playerInfo.playerId].active = true;
  playerObject[playerInfo.playerId].inAir = true;
  playerObject[playerInfo.playerId].canDodge = true;
  playerObject[playerInfo.playerId].jumpCD = false;
  playerObject[playerInfo.playerId].lifes = 3;

  hitboxes[playerInfo.playerId] = self.matter.add.sprite(-10, -10, "woodblock", null, {isStatic: true});
  hitboxes[playerInfo.playerId].setCollisionCategory(this.staticCategory);

  self.matterCollision.addOnCollideActive({
      objectA: playerObject[playerInfo.playerId],
      objectB: [self.woodplatform1, self.woodplatform2, self.ground],
      callback: eventData => {
        playerObject[playerInfo.playerId].canJump = 1;
        playerObject[playerInfo.playerId].inAir = false;
        playerObject[playerInfo.playerId].jumpCD = false;
        // eventData.gameObjectB will be the specific enemy that was hit!
      }
    });
    self.matterCollision.addOnCollideEnd({
        objectA: playerObject[playerInfo.playerId],
        objectB: [self.woodplatform1, self.woodplatform2, self.ground],
        callback: eventData => {
          playerObject[playerInfo.playerId].inAir = true;
          playerObject[playerInfo.playerId].jumpCD = false;
          // eventData.gameObjectB will be the specific enemy that was hit!
        }
      });
  //player.setDrag(100);
  //player.setMaxVelocity(200);
  playerObject[playerInfo.playerId].playerId = playerInfo.playerId;
  self.players.add(playerObject[playerInfo.playerId]);
  if(self.teamselector%2 === 0){
    playerInfo.team = 1;
    playerObject[playerInfo.playerId].team = 1;
    self.matterCollision.addOnCollideStart({
      objectA: hitboxes[playerInfo.playerId],
      callback: eventData => {
        const { bodyB, gameObjectB } = eventData;
        if(gameObjectB.team === 2){
          if(hitboxes[playerInfo.playerId].state === "attack_left"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 2;
            gameObjectB.setVelocityX(-3-0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "attack_right"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 2;
            gameObjectB.setVelocityX(3+0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "attack_up"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 2;
            gameObjectB.setVelocityY(-3-0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "attack_down"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 2;
            gameObjectB.setVelocityY(3+0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "smash_right"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 10;
            gameObjectB.setVelocityX(4+0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "smash_left"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 10;
            gameObjectB.setVelocityX(-4-0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "smash_up"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 10;
            gameObjectB.setVelocityY(-4-0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "smash_down"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 10;
            gameObjectB.setVelocityY(4+0.05*gameObjectB.dmg);
          }

        }
      }
    });
  }
  else{
    playerInfo.team = 2;
    playerObject[playerInfo.playerId].team = 2;
    self.matterCollision.addOnCollideStart({
      objectA: hitboxes[playerInfo.playerId],
      callback: eventData => {
        const { bodyB, gameObjectB } = eventData;
        if(gameObjectB.team === 1){
          if(hitboxes[playerInfo.playerId].state === "attack_left"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 2;
            gameObjectB.setVelocityX(-3-0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "attack_right"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 2;
            gameObjectB.setVelocityX(3+0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "attack_up"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 2;
            gameObjectB.setVelocityY(-3-0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "attack_down"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 2;
            gameObjectB.setVelocityY(3+0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "smash_right"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 10;
            gameObjectB.setVelocityX(4+0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "smash_left"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 10;
            gameObjectB.setVelocityX(-4-0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "smash_up"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 10;
            gameObjectB.setVelocityY(-4-0.05*gameObjectB.dmg);
          }
          if(hitboxes[playerInfo.playerId].state === "smash_down"){
            console.log("Player touched something.");
            stateMachinesarr[gameObjectB.playerId].transition('hurt');
            gameObjectB.dmg = gameObjectB.dmg + 10;
            gameObjectB.setVelocityY(4+0.05*gameObjectB.dmg);
          }
        }
      }
    });
  }
  self.teamselector = self.teamselector + 1;
}

function removePlayer(self, playerId) {
    self.players.getChildren().forEach((player) => {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
}

function handlePlayerInput(self, playerId, input) {
  self.players.getChildren().forEach((player) => {
    if (playerId === player.playerId) {
      players[player.playerId].input = input;
    }
  });
}

function randomPosition(max) {
  return Math.floor(Math.random() * max) + 50;
}







class State {
  enter() {

  }

  execute() {

  }
}

class StateMachine {
  constructor(initialState, possibleStates, stateArgs=[]) {
    this.initialState = initialState;
    this.possibleStates = possibleStates;
    this.stateArgs = stateArgs;
    this.state = null;

    // State instances get access to the state machine via this.stateMachine.
    for (const state of Object.values(this.possibleStates)) {
      state.stateMachine = this;
    }
  }

  step() {
    // On the first step, the state is null and we need to initialize the first state.
    if (this.state === null) {
      this.state = this.initialState;
      this.possibleStates[this.state].enter(...this.stateArgs);
    }

    // Run the current state's execute
    this.possibleStates[this.state].execute(...this.stateArgs);
  }

  transition(newState, ...enterArgs) {
    this.state = newState;
    this.possibleStates[this.state].enter(...this.stateArgs, ...enterArgs);
  }
}

class IdleState extends State {
enter(scene, hero, heroObject) {
  console.log("Enter Idle State");
  hero.state = 'idle';
  heroObject.setVelocityX(0);
  //hero.setVelocityX(0);

  //if(hero.label === 'schoolgirl'){
    //hero.anims.play(`player1_idle_anim`, true);
  //}
  //else if(hero.label === 'warrior'){
  //  hero.anims.play(`warrior_idle_anim`, true);
  //}
}

execute(scene, hero, heroObject) {
  //console.log(input.up);
  //const {left, right, up, down, space} = keys;

  //if(hero.label === 'schoolgirl'){
    //hero.anims.play(`player1_idle_anim`, true);
  //}
  //else if(hero.label === 'warrior'){
  //  hero.anims.play(`warrior_idle_anim`, true);
  //}
  // Transition to move if pressing a movement key
  if (hero.input.space && hero.input.left || hero.input.space && hero.input.right) {
    this.stateMachine.transition('attack_hor');
    return;
  }
  if (hero.input.space && hero.input.up) {
    this.stateMachine.transition('attack_up');
    return;
  }
  if (hero.input.space && hero.input.down) {
    this.stateMachine.transition('attack_down');
    return;
  }
  if(heroObject.canJump>0){
  if (hero.input.smash && hero.input.left || hero.input.smash && hero.input.right) {
    this.stateMachine.transition('smash_hor');
    return;
  }
  if (hero.input.smash && hero.input.up) {
    this.stateMachine.transition('smash_up');
    return;
  }
  if (hero.input.smash && hero.input.down) {
    this.stateMachine.transition('smash_down');
    return;
  }
  }

  if (hero.input.left || hero.input.right || hero.input.up) {
    this.stateMachine.transition('move');
    return;
  }
  if (hero.input.left && hero.input.dodge && heroObject.canDodge || hero.input.right && hero.input.dodge && heroObject.canDodge || hero.input.up && hero.input.dodge && heroObject.canDodge || hero.input.down && hero.input.dodge && heroObject.canDodge) {
    this.stateMachine.transition('dodge');
    return;
  }
}
}

class MoveState extends State {
enter(scene, hero, heroObject) {
  console.log("Enter Move State");
  //hero.state = 'move';

}
execute(scene, hero, heroObject) {
  //const {left, right, up, down, space} = keys;
  //console.log("execute movestate");

  // Transition to idle if not pressing movement keys
  if (!(hero.input.left || hero.input.right || hero.input.up)) {
    this.stateMachine.transition('idle');
    return;
  }
  if (hero.input.space && hero.input.left || hero.input.space && hero.input.right) {
    this.stateMachine.transition('attack_hor');
    return;
  }
  if (hero.input.space && hero.input.up) {
    this.stateMachine.transition('attack_up');
    return;
  }
  if (hero.input.space && hero.input.down) {
    this.stateMachine.transition('attack_down');
    return;
  }
  if(heroObject.canJump>0)
  {
  if (hero.input.smash && hero.input.left || hero.input.smash && hero.input.right) {
    this.stateMachine.transition('smash_hor');
    return;
  }
  if (hero.input.smash && hero.input.up) {
    this.stateMachine.transition('smash_up');
    return;
  }
  if (hero.input.smash && hero.input.down) {
    this.stateMachine.transition('smash_down');
    return;
  }
  }
  //if (space.isDown) {
  //  this.stateMachine.transition('attack');
  //  return;
  //}
  //if (up.isDown && hero.canJump==true) {
  if (hero.input.up && heroObject.canJump > 0.5) {
      if(heroObject.jumpCD === 'false'){
        heroObject.canJump = heroObject.canJump - 0.4;
      }
      heroObject.jumpCD = 'true';
      scene.time.addEvent({
        delay: 200,
        callback: ()=>{
          heroObject.jumpCD = 'false';
        },
        loop: false
      });
      hero.state = 'jump';
          //if(hero.label === 'schoolgirl'){
          //hero.anims.play(`player1_jump_anim`, true);
          //}
          //else if(hero.label === 'warrior'){
          //  hero.anims.play(`warrior_jump_anim`, true);
          //}

      heroObject.setVelocityY(-10);
      heroObject.setVelocityX(0);

  }

  if (hero.input.left) {
    hero.xflipped = true;
    heroObject.setVelocityX(-10);
    heroObject.flipX = true;
    if(heroObject.inAir){
      hero.state = 'jump';
    }
    else {
      hero.state = 'move';
    }
    //hero.flipX = true;

    //if(hero.label === 'schoolgirl'){
      //hero.anims.play(`player1_run_anim`, true);
    //}
    //else if(hero.label === 'warrior'){
    //  hero.anims.play(`warrior_run_anim`, true);
    //}
  }
  else if (hero.input.right) {
    hero.xflipped = false;
    heroObject.setVelocityX(10);
    heroObject.flipX = false;
    if(heroObject.inAir){
      hero.state = 'jump';
    }
    else {
      hero.state = 'move';
    }
    //hero.flipX = false;

    //if(hero.label === 'schoolgirl'){
    //  hero.anims.play(`player1_run_anim`, true);
    //}
    //else if(hero.label === 'warrior'){
    //  hero.anims.play(`warrior_run_anim`, true);
    //}
  }

  if (hero.input.left && hero.input.dodge && heroObject.canDodge|| hero.input.right && hero.input.dodge && heroObject.canDodge || hero.input.up && hero.input.dodge && heroObject.canDodge || hero.input.down && hero.input.dodge && heroObject.canDodge) {
    this.stateMachine.transition('dodge');
    return;
  }



}
}

class RespawnState extends State {
enter(scene, hero, heroObject) {
  if(heroObject.lifes >0){
    console.log("Enter Respawn State");
    heroObject.active = false;
    heroObject.canJump = 1;
    //heroObject.jumpCD = 'false';
    scene.time.addEvent({
      delay: 1000,
      callback: ()=>{
        console.log('Leave Respawn State');
        heroObject.active = true;
        if (hero.input.left || hero.input.right || hero.input.up) {
          this.stateMachine.transition('move');
          return;
        }
        else{
          this.stateMachine.transition('idle');
        }
      },
      loop: false
    });
  }
  else{
    console.log("Game Over Son");
    var Id = hero.playerId;
    // remove player from server
    removePlayer(scene, Id);
    // remove this player from our players object
    delete players[Id];
    delete stateMachinesarr[Id];
    delete playerObject[Id];
    delete hitboxes[Id];
    // emit a message to all players to remove this player
    io.emit('disconnect', Id);
    return;
  }
}
execute(scene, hero, heroObject) {
  // Transition to idle if not pressing movement keys
  if (!(hero.input.left || hero.input.right || hero.input.up)) {
    hero.state = 'dodge_idle';
  }

  if (hero.input.up && heroObject.canJump > 0.5) {
      if(heroObject.jumpCD === 'false'){
        heroObject.canJump = heroObject.canJump - 0.4;
      }
      heroObject.jumpCD = 'true';
      scene.time.addEvent({
        delay: 200,
        callback: ()=>{
          heroObject.jumpCD = 'false';
        },
        loop: false
      });
      hero.state = 'dodge_jump';
      heroObject.setVelocityY(-10);
      heroObject.setVelocityX(0);

  }
  if (hero.input.left) {
    hero.xflipped = true;
    heroObject.setVelocityX(-10);
    heroObject.flipX = true;
    if(heroObject.inAir){
      hero.state = 'dodge_jump';
    }
    else {
      hero.state = 'dodge_move';
    }
  }
  else if (hero.input.right) {
    hero.xflipped = false;
    heroObject.setVelocityX(10);
    heroObject.flipX = false;
    if(heroObject.inAir){
      hero.state = 'dodge_jump';
    }
    else {
      hero.state = 'dodge_move';
    }

  }
}
}


class HurtState extends State {

enter(scene, hero, heroObject) {
  console.log("Enter Hurt State");
  hitboxes[hero.playerId].setCollisionCategory(null);
  hero.state = 'hurt';
  heroObject.setBounce(1+0.001*heroObject.dmg);
  heroObject.active = false;
  //hitbox.setCollisionCategory(null);
  //if(hero.label === 'schoolgirl'){
  //  hero.anims.play(`player1_death_anim`, true);
  //}
  //else if(hero.label === 'warrior'){
  //  hero.anims.play(`warrior_death_anim`, true);
  //}
  scene.time.addEvent({
    delay: 400+5*heroObject.dmg,
    callback: ()=>{
      heroObject.active = true;
    },
    loop: false
  })

  scene.time.addEvent({
    delay: 400+5*heroObject.dmg,
    callback: ()=>{
      console.log('Leave Hurt State');
      heroObject.setBounce(0);
      if (hero.input.left || hero.input.right || hero.input.up) {
        this.stateMachine.transition('move');
        return;
      }
      else{
        this.stateMachine.transition('idle');
      }
    },
    loop: false
  });
  //heroObject.once('animationcomplete', () => {
  //    console.log('Leave Hurt State');
  //    this.stateMachine.transition('idle');
  //});

}

execute(scene, hero, heroObject) {


}
}

class DodgeState extends State {

enter(scene, hero, heroObject) {
  console.log("Enter Dodge State");
  hitboxes[hero.playerId].setCollisionCategory(null);
  heroObject.canDodge = false;

  if (hero.input.up) {
      hero.state = 'dodge_jump';

      heroObject.setVelocityY(-12);
      heroObject.setVelocityX(0);

  }

  if (hero.input.left) {
    hero.xflipped = true;
    heroObject.setVelocityX(-20);
    heroObject.flipX = true;
    if(heroObject.inAir){
      hero.state = 'dodge_jump';
    }
    else {
      hero.state = 'dodge_move';
    }
  }
  else if (hero.input.right) {
    hero.xflipped = false;
    heroObject.setVelocityX(20);
    heroObject.flipX = false;
    if(heroObject.inAir){
      hero.state = 'dodge_jump';
    }
    else {
      hero.state = 'dodge_move';
    }
  }
  else if (hero.input.down) {
    hero.xflipped = false;
    heroObject.setVelocityY(10);
    heroObject.flipX = false;
    if(heroObject.inAir){
      hero.state = 'dodge_jump';
    }
    else {
      hero.state = 'dodge_idle';
    }
  }

  scene.time.addEvent({
    delay: 1000,
    callback: ()=>{
      heroObject.canDodge = true;
    },
    loop: false
  })
  scene.time.addEvent({
    delay: 100,
    callback: ()=>{
      console.log('Leave Dodge State');
      heroObject.setVelocityX(0);
      heroObject.setVelocityY(0);
      heroObject.active = true;
      if (hero.input.left || hero.input.right || hero.input.up) {
        this.stateMachine.transition('move');
        return;
      }
      else{
        this.stateMachine.transition('idle');
      }
    },
    loop: false
  });

}

execute(scene, hero, heroObject) {


}
}


class AttackState extends State {

enter(scene, hero, heroObject) {
    hero.input.space = false;
    console.log("Enter Attack State");
    heroObject.setVelocityY(0);
    heroObject.setVelocityX(0);
    heroObject.body.ignoreGravity = true;
    hero.state = 'attack';
    this.schoolgirl_attack(scene, hero, heroObject);
    //if(hero.label === 'schoolgirl'){
    //  hero.anims.play(`player1_attack_anim`, true);
    //  this.schoolgirl_attack(scene,hero,category,hitbox);
    //}
    //else if(hero.label === 'warrior'){
    //  hero.anims.play(`warrior_attack_anim`, true);
    //  this.warrior_attack(scene,hero,category,hitbox);
    //}
    scene.time.addEvent({
      delay: 500,
      callback: ()=>{
        heroObject.body.ignoreGravity = false;
        if (hero.input.left || hero.input.right || hero.input.up) {
          this.stateMachine.transition('move');
          return;
        }
        else{
          this.stateMachine.transition('idle');
        }
        console.log("finished attack");
      },
      loop: false
    });
    //heroObject.once('animationcomplete', () => {
    //  hero.body.ignoreGravity = false;
    //  if (left.isDown || right.isDown || up.isDown) {
    //    this.stateMachine.transition('move');
    //    return;
    //  }
    //  else{
    //    this.stateMachine.transition('idle');
    //  }
    //  console.log("finished");
    //});
}

execute(scene, hero, heroObject) {

}

schoolgirl_attack(scene, hero, heroObject){
  if(heroObject.flipX == true){
    //var newBody =   scene.matter.bodies.rectangle(heroObject.x-10,heroObject.y+1,22,10,{isStatic: true,isSensor: true});
    var newBody =   scene.matter.bodies.rectangle(heroObject.x,heroObject.y,50,50,{isStatic: true,isSensor: true});

  }
  else{
    //var newBody =   scene.matter.bodies.rectangle(heroObject.x+10,heroObject.y+1,22,10,{isStatic: true,isSensor: true});
    var newBody =   scene.matter.bodies.rectangle(heroObject.x,heroObject.y,50,50,{isStatic: true,isSensor: true});
  }
  hitboxes[hero.playerId].setExistingBody(newBody, true);
  hitboxes[hero.playerId].setCollisionCategory(scene.staticCategory);
  if(heroObject.flipX == true){
    var tween = scene.tweens.add({
      targets: hitboxes[hero.playerId],
      x: heroObject.x-20,
      ease: 'Power1',
      duration: 100,
      repeat:0,
      onComplete: function(){
        hitboxes[hero.playerId].setCollisionCategory(null);
      },
      callbackScope: this
    });
  }
  else{
    var tween = scene.tweens.add({
      targets: hitboxes[hero.playerId],
      x: heroObject.x+20,
      ease: 'Power1',
      duration: 100,
      repeat:0,
      onComplete: function(){
        hitboxes[hero.playerId].setCollisionCategory(null);
      },
      callbackScope: this
    });
  }
}

}



class AttackHorState extends State {

enter(scene, hero, heroObject) {
    hero.input.space = false;
    //heroObject.canJump = 0;
    console.log("Enter Horizontal Attack State");
    //heroObject.setVelocityY(0);
    //heroObject.setVelocityX(0);
    //heroObject.body.ignoreGravity = true;
    //hero.state = 'horattack';
    this.hasan_attack_hor(scene, hero, heroObject);
    //if(hero.label === 'schoolgirl'){
    //  hero.anims.play(`player1_attack_anim`, true);
    //  this.schoolgirl_attack(scene,hero,category,hitbox);
    //}
    //else if(hero.label === 'warrior'){
    //  hero.anims.play(`warrior_attack_anim`, true);
    //  this.warrior_attack(scene,hero,category,hitbox);
    //}
    scene.time.addEvent({
      delay: 350,
      callback: ()=>{
        heroObject.body.ignoreGravity = false;
        if (hero.input.left || hero.input.right || hero.input.up) {
          this.stateMachine.transition('move');
          return;
        }
        else{
          this.stateMachine.transition('idle');
        }
        console.log("finished attack");
      },
      loop: false
    });
}

execute(scene, hero, heroObject) {

}

hasan_attack_hor(scene, hero, heroObject){
  if(hero.input.right){
    hero.xflipped = false;
    heroObject.flipX = false;
    hitboxes[hero.playerId].state = "attack_right";
    hero.state = 'horattack_right';
    //var newBody =   scene.matter.bodies.rectangle(heroObject.x-10,heroObject.y+1,22,10,{isStatic: true,isSensor: true});
    var newBody =   scene.matter.bodies.rectangle(heroObject.x+10,heroObject.y+1,22,10,{isStatic: true,isSensor: true});
  }
  else{
    hero.xflipped = true;
    heroObject.flipX = true;
    hitboxes[hero.playerId].state = "attack_left";
    hero.state = 'horattack_left';
    var newBody =  scene.matter.bodies.rectangle(heroObject.x-10,heroObject.y+1,22,10,{isStatic: true,isSensor: true});
  }
  hitboxes[hero.playerId].setExistingBody(newBody, true);
  hitboxes[hero.playerId].setCollisionCategory(scene.staticCategory);
  if(heroObject.flipX == true){
    var tween = scene.tweens.add({
      targets: hitboxes[hero.playerId],
      x: heroObject.x-20,
      ease: 'Power1',
      duration: 350,
      repeat:0,
      onComplete: function(){
        hitboxes[hero.playerId].setCollisionCategory(null);
      },
      callbackScope: this
    });
  }
  else{
    var tween = scene.tweens.add({
      targets: hitboxes[hero.playerId],
      x: heroObject.x+20,
      ease: 'Power1',
      duration: 350,
      repeat:0,
      onComplete: function(){
        hitboxes[hero.playerId].setCollisionCategory(null);
      },
      callbackScope: this
    });
  }
}

}

class AttackUpState extends State {

enter(scene, hero, heroObject) {
    hero.input.space = false;
    console.log("Enter Up Attack State");
    //heroObject.canJump = 0;
    //heroObject.setVelocityY(0);
    //heroObject.setVelocityX(0);
    //heroObject.body.ignoreGravity = true;
    hero.state = 'attack_up';
    this.hasan_attack_up(scene, hero, heroObject);
    //if(hero.label === 'schoolgirl'){
    //  hero.anims.play(`player1_attack_anim`, true);
    //  this.schoolgirl_attack(scene,hero,category,hitbox);
    //}
    //else if(hero.label === 'warrior'){
    //  hero.anims.play(`warrior_attack_anim`, true);
    //  this.warrior_attack(scene,hero,category,hitbox);
    //}
    scene.time.addEvent({
      delay: 350,
      callback: ()=>{
        heroObject.body.ignoreGravity = false;
        if (hero.input.left || hero.input.right || hero.input.up) {
          this.stateMachine.transition('move');
          return;
        }
        else{
          this.stateMachine.transition('idle');
        }
        console.log("finished attack");
      },
      loop: false
    });
}

execute(scene, hero, heroObject) {

}

hasan_attack_up(scene, hero, heroObject){
  hitboxes[hero.playerId].state = "attack_up";
  var newBody =   scene.matter.bodies.rectangle(heroObject.x,heroObject.y-5,15,22,{isStatic: true,isSensor: true});
  hitboxes[hero.playerId].setExistingBody(newBody, true);
  hitboxes[hero.playerId].setCollisionCategory(scene.staticCategory);
  var tween = scene.tweens.add({
    targets: hitboxes[hero.playerId],
    y: heroObject.y-35,
    ease: 'Power1',
    duration: 350,
    repeat:0,
    onComplete: function(){
      hitboxes[hero.playerId].setCollisionCategory(null);
    },
    callbackScope: this
  });

}

}


class AttackDownState extends State {

enter(scene, hero, heroObject) {
    hero.input.space = false;
    console.log("Enter Down Attack State");
    //heroObject.canJump = 0;
    //heroObject.setVelocityY(0);
    //heroObject.setVelocityX(0);
    //heroObject.body.ignoreGravity = true;
    hero.state = 'attack_down';
    this.hasan_attack_down(scene, hero, heroObject);
    //if(hero.label === 'schoolgirl'){
    //  hero.anims.play(`player1_attack_anim`, true);
    //  this.schoolgirl_attack(scene,hero,category,hitbox);
    //}
    //else if(hero.label === 'warrior'){
    //  hero.anims.play(`warrior_attack_anim`, true);
    //  this.warrior_attack(scene,hero,category,hitbox);
    //}
    scene.time.addEvent({
      delay: 350,
      callback: ()=>{
        heroObject.body.ignoreGravity = false;
        console.log("finished attack");
        if (hero.input.left || hero.input.right || hero.input.up) {
          this.stateMachine.transition('move');
          return;
        }
        else{
          this.stateMachine.transition('idle');
        }
      },
      loop: false
    });
}

execute(scene, hero, heroObject) {

}

hasan_attack_down(scene, hero, heroObject){
  hitboxes[hero.playerId].state = "attack_down";
  if(heroObject.flipX){
    var newBody =   scene.matter.bodies.rectangle(heroObject.x-8,heroObject.y+5,15,22,{isStatic: true,isSensor: true});
  }
  else {
    var newBody =   scene.matter.bodies.rectangle(heroObject.x+8,heroObject.y+5,15,22,{isStatic: true,isSensor: true});
  }
  hitboxes[hero.playerId].setExistingBody(newBody, true);
  hitboxes[hero.playerId].setCollisionCategory(scene.staticCategory);
  var tween = scene.tweens.add({
    targets: hitboxes[hero.playerId],
    y: heroObject.y+30,
    ease: 'Power1',
    duration: 350,
    repeat:0,
    onComplete: function(){
      hitboxes[hero.playerId].setCollisionCategory(null);
    },
    callbackScope: this
  });

}

}


class SmashHorState extends State {

enter(scene, hero, heroObject) {
    hero.input.smash = false;
    heroObject.canJump = 0;
    console.log("Enter Horizontal Smash State");
    heroObject.setVelocityY(0);
    heroObject.setVelocityX(0);
    heroObject.body.ignoreGravity = true;
    //hero.state = 'horattack';
    this.hasan_smash_hor(scene, hero, heroObject);
    //if(hero.label === 'schoolgirl'){
    //  hero.anims.play(`player1_attack_anim`, true);
    //  this.schoolgirl_attack(scene,hero,category,hitbox);
    //}
    //else if(hero.label === 'warrior'){
    //  hero.anims.play(`warrior_attack_anim`, true);
    //  this.warrior_attack(scene,hero,category,hitbox);
    //}
    scene.time.addEvent({
      delay: 350,
      callback: ()=>{
        heroObject.body.ignoreGravity = false;
        if (hero.input.left || hero.input.right || hero.input.up) {
          this.stateMachine.transition('move');
          return;
        }
        else{
          this.stateMachine.transition('idle');
        }
        console.log("finished attack");
      },
      loop: false
    });
}

execute(scene, hero, heroObject) {

}

hasan_smash_hor(scene, hero, heroObject){
  if(hero.input.right){
    hero.xflipped = false;
    heroObject.flipX = false;
    hitboxes[hero.playerId].state = "smash_right";
    hero.state = 'horsmash_right';
    scene.time.addEvent({
              delay: 200,
                callback: ()=>{
                  var newBody =   scene.matter.bodies.polygon(heroObject.x+40,heroObject.y,3,40,{isStatic: true,isSensor: true});
                  hitboxes[hero.playerId].setExistingBody(newBody, true);
                  hitboxes[hero.playerId].setCollisionCategory(scene.staticCategory);
                  scene.time.addEvent({
                    delay: 100,
                      callback: ()=>{
                        hitboxes[hero.playerId].setCollisionCategory(null);
                      },
                      loop: false
                  });
                },
                loop: false
    });
  }
  else{
    hero.xflipped = true;
    heroObject.flipX = true;
    hitboxes[hero.playerId].state = "attack_left";
    hero.state = 'horsmash_left';
    scene.time.addEvent({
              delay: 200,
                callback: ()=>{
                  var newBody =  scene.matter.bodies.rectangle(heroObject.x-40,heroObject.y,3,40,{isStatic: true,isSensor: true});
                  hitboxes[hero.playerId].setExistingBody(newBody, true);
                  hitboxes[hero.playerId].setAngle(180);
                  hitboxes[hero.playerId].setCollisionCategory(scene.staticCategory);
                  scene.time.addEvent({
                    delay: 100,
                      callback: ()=>{
                        hitboxes[hero.playerId].setCollisionCategory(null);
                      },
                      loop: false
                  });
                },
                loop: false
    });
  }
  scene.time.addEvent({
            delay: 200,
              callback: ()=>{

              },
              loop: false
  });

}

}

class SmashUpState extends State {

enter(scene, hero, heroObject) {
    hero.input.space = false;
    console.log("Enter Up Smash State");
    heroObject.canJump = 0;
    heroObject.setVelocityY(0);
    heroObject.setVelocityX(0);
    heroObject.body.ignoreGravity = true;
    hero.state = 'smash_up';
    this.hasan_smash_up(scene, hero, heroObject);
    //if(hero.label === 'schoolgirl'){
    //  hero.anims.play(`player1_attack_anim`, true);
    //  this.schoolgirl_attack(scene,hero,category,hitbox);
    //}
    //else if(hero.label === 'warrior'){
    //  hero.anims.play(`warrior_attack_anim`, true);
    //  this.warrior_attack(scene,hero,category,hitbox);
    //}
    scene.time.addEvent({
      delay: 350,
      callback: ()=>{
        heroObject.body.ignoreGravity = false;
        if (hero.input.left || hero.input.right || hero.input.up) {
          this.stateMachine.transition('move');
          return;
        }
        else{
          this.stateMachine.transition('idle');
        }
        console.log("finished attack");
      },
      loop: false
    });
}

execute(scene, hero, heroObject) {

}

hasan_smash_up(scene, hero, heroObject){
  hitboxes[hero.playerId].state = "smash_up";
  if(heroObject.flipX){
    var newBody =   scene.matter.bodies.rectangle(heroObject.x+5,heroObject.y,20,35,{isStatic: true,isSensor: true});
  }
  else {
    var newBody =   scene.matter.bodies.rectangle(heroObject.x-5,heroObject.y,20,35,{isStatic: true,isSensor: true});
  }
  hitboxes[hero.playerId].setExistingBody(newBody, true);
  hitboxes[hero.playerId].setCollisionCategory(scene.staticCategory);
  var tween = scene.tweens.add({
    targets: hitboxes[hero.playerId],
    y: heroObject.y-40,
    ease: 'Power1',
    duration: 200,
    repeat:0,
    onComplete: function(){
      hitboxes[hero.playerId].setCollisionCategory(null);
    },
    callbackScope: this
  });

}

}

class SmashDownState extends State {

enter(scene, hero, heroObject) {
    hero.input.space = false;
    console.log("Enter Down Smash State");
    //heroObject.canJump = 0;
    heroObject.setVelocityY(0);
    heroObject.setVelocityX(0);
    heroObject.body.ignoreGravity = true;
    hero.state = 'smash_down';
    this.hasan_smash_down(scene, hero, heroObject);
    //if(hero.label === 'schoolgirl'){
    //  hero.anims.play(`player1_attack_anim`, true);
    //  this.schoolgirl_attack(scene,hero,category,hitbox);
    //}
    //else if(hero.label === 'warrior'){
    //  hero.anims.play(`warrior_attack_anim`, true);
    //  this.warrior_attack(scene,hero,category,hitbox);
    //}
    scene.time.addEvent({
      delay: 350,
      callback: ()=>{
        heroObject.setVelocityY(0);
        heroObject.setVelocityX(0);
        heroObject.body.ignoreGravity = false;
        console.log("finished attack");
        if (hero.input.left || hero.input.right || hero.input.up) {
          this.stateMachine.transition('move');
          return;
        }
        else{
          this.stateMachine.transition('idle');
        }
      },
      loop: false
    });
}

execute(scene, hero, heroObject) {

}

hasan_smash_down(scene, hero, heroObject){
  hitboxes[hero.playerId].state = "smash_down";
  if(heroObject.flipX){
    var newBody =   scene.matter.bodies.rectangle(heroObject.x-10,heroObject.y,55,30,{isStatic: false,isSensor: true});
  }
  else {
    var newBody =   scene.matter.bodies.rectangle(heroObject.x+10,heroObject.y,55,30,{isStatic: false,isSensor: true});
  }
  hitboxes[hero.playerId].setExistingBody(newBody, true);
  hitboxes[hero.playerId].setCollisionCategory(scene.staticCategory);
  var hbconstraint = scene.matter.add.constraint(hitboxes[hero.playerId], heroObject, 2, 0.9);

  scene.time.addEvent({
          delay: 350,
          callback: ()=>{
            hitboxes[hero.playerId].setCollisionCategory(null);
            scene.matter.world.removeConstraint(hbconstraint);
          },
          loop: false
        })
        heroObject.setVelocityY(15);
        hitboxes[hero.playerId].setVelocityY(15);

}

}


const game = new Phaser.Game(config);
window.gameLoaded();
