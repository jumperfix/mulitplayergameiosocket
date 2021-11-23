const players = {};
const stateMachinesarr = {};
const playerObject = {};
const hitboxes = {};
//const hitboxteam1 = {};
//const hitboxteam2 = {};
//const playerObjectteam1 = {};
//const playerObjectteam2 = {};

const config = {
  type: Phaser.HEADLESS,
  parent: 'phaser-example',
  width: 1080,//1024,//256,
  height: 720,//768,
  autoFocus: false,
  physics: {
      default: 'matter',
      matter:{
        gravity: {y: 0.1},
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

  this.matter.world.setBounds(0, 0, 1080, 720);
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

    //var stateMachineplayer2 = new StateMachine('idle', {
    //      idle: new IdleState(),
    //      move: new MoveState(),
    //      //attack: new AttackState(),
    //      //hurt: new HurtState(),
    //      //swing: new SwingState(),
    //      //dash: new DashState(),
    //  }, [self, self.npc,self.npc.input]);
    //  var stateMachineplayer3 = new StateMachine('idle', {
    //        idle: new IdleState(),
    //        move: new MoveState(),
    //        //attack: new AttackState(),
    //        //hurt: new HurtState(),
    //        //swing: new SwingState(),
    //        //dash: new DashState(),
    //    }, [self, self.npc,self.npc.input]);
  //stateMachinesarr[1] = stateMachineplayer2;
  //stateMachinesarr[2] = stateMachineplayer3;
  //stateMachinesarr[1].step();
  //var testmachine = stateMachinesarr[1];
  //testmachine.step();

  //stateMachinesarr.forEach(function (e) {
  //  e.step();
  //});
  //this.background = this.add.tileSprite(0,0,config.width,config.height, "background");
  //this.background.setOrigin(0,0);

  io.on('connection', function (socket) {
    console.log('a user connected');
    // create a new player and add it to our players object
    players[socket.id] = {
      //rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      //team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue',
      input: {
        left: false,
        right: false,
        up: false,
        space: false
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
          attack: new AttackState(),
          hurt: new HurtState(),
          //swing: new SwingState(),
          //dash: new DashState(),
        }, [self, players[socket.id],playerObject[socket.id]]);
    // send the players object to the new player
    socket.emit('currentPlayers', players);
    // update all other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);
    // send the star object to the new player
    //socket.emit('starLocation', { x: self.star.x, y: self.star.y });
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
    //self.stateMachineplayer1 = new StateMachine('idle', {
    //      idle: new IdleState(),
    //      move: new MoveState(),
    //      //attack: new AttackState(),
    //      //hurt: new HurtState(),
    //      //swing: new SwingState(),
    //      //dash: new DashState(),
    //  }, [self, player,players[player.playerId].input]);
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
    //this.groundtile = this.matter.add.rectangle(0,618,2*config.width,50,{ isStatic: true});
    //this.platforms.add(groundtile);

    var woodplatform1 = this.add.tileSprite(0,400,10*50,50, "woodblock");
    this.woodplatform1 = this.matter.add.gameObject(woodplatform1,{ isStatic: true, label:"woodplatform1"});
    this.platforms.add(this.woodplatform1);
    //this.woodplatform1 = this.matter.add.rectangle(0,400,10*50,50,{ isStatic: true});
    //this.platforms.add(this.woodplatform1);

    var woodplatform2 = this.add.tileSprite(400,200,5*50,50, "woodblock");
    this.woodplatform2 = this.matter.add.gameObject(woodplatform2,{ isStatic: true , label:"woodplatform2"});
    this.platforms.add(this.woodplatform2);
    //this.woodplatform2 = this.matter.add.rectangle(400,200,5*50,50,{ isStatic: true});
    //this.platforms.add(this.woodplatform2);


    //set Collisions
    this.ground.setCollisionCategory(this.staticCategory);
    this.woodplatform1.setCollisionCategory(this.staticCategory);
    this.woodplatform2.setCollisionCategory(this.staticCategory);

    //this.player1.setCollisionCategory(this.heroCategory);
    //this.player2.setCollisionCategory(this.heroCategory);
    //this.player1.setCollidesWith([this.staticCategory]);
    //this.player2.setCollidesWith([this.staticCategory]);

    //this.player1hb.setCollisionCategory(this.staticCategory);
    //this.player2hb.setCollisionCategory(this.staticCategory);

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
    //const input = players[player.playerId].input;
    //if (input.left) {
      //player.setVelocityX(-5);
    //} else if (input.right) {
      //player.setVelocityX(5);
      //console.log('input right');
    //} else {
      //player.setVelocityX(0);
    //}
    //if (input.up) {
      //this.physics.velocityFromRotation(player.rotation + 1.5, 200, player.body.acceleration);
      //player.setVelocityY(-5);
    //}
    //if (input.space) {
      //this.physics.velocityFromRotation(player.rotation + 1.5, 200, player.body.acceleration);
      //console.log('attack!');
      //input.space = false;
    //} //else {
      //player.setVelocityX(0);
    //}
    players[player.playerId].x = player.x;
    players[player.playerId].y = player.y;
    stateMachinesarr[player.playerId].step();
    //players[player.playerId].rotation = player.rotation;
  });
  //this.physics.world.wrap(this.players, 5);
  //this.stateMachineplayer1.step();

  //stateMachinesarr[1].step();
  //stateMachinesarr[1].step();
  io.emit('playerUpdates', players);

}
  function addPlayer(self, playerInfo) {
    //self.matterCollision.removeOnCollideStart({
    //  objectA: [playerObject],
    //  objectB: [hitboxes],
    //  callback: onCollide
    //});
  //const player = self.matter.add.sprite(playerInfo.x, playerInfo.y, 'player1').setScale(1).setFixedRotation();
  playerObject[playerInfo.playerId] = self.matter.add.sprite(playerInfo.x, playerInfo.y, 'player1').setScale(1).setFixedRotation().setFriction(0);
  playerObject[playerInfo.playerId].setCollisionCategory(self.heroCategory);
  playerObject[playerInfo.playerId].setCollidesWith(self.staticCategory);
  playerObject[playerInfo.playerId].canJump = true;

  hitboxes[playerInfo.playerId] = self.matter.add.sprite(-10, -10, "woodblock", null, {isStatic: true});
  //hitboxes[playerInfo.playerId] = self.matter.add.sprite(300, 300, "woodblock");
  //hitboxes[playerInfo.playerId] = self.matter.add.sprite(-10, -10, "woodblock");
  hitboxes[playerInfo.playerId].setCollisionCategory(this.staticCategory);
  //self.matterCollision.addOnCollideStart({
  //  objectA: playerObject,
  //  objectB: hitboxes,
  //  callback: eventData => {
  //    console.log("collision detected");
      //if(eventData.gameObjectA.team === 1 && eventData.gameObjectB.team === 2){
      //  console.log("get punched");
      //  stateMachinesarr[eventData.gameObjectA.playerId].transition('hurt');
      //  eventData.gameObjectA.setVelocityX(5);
      //}
      //else if(eventData.gameObjectA.team === 2 && eventData.gameObjectB.team === 1){
      //  console.log("get punched");
      //  stateMachinesarr[eventData.gameObjectA.playerId].transition('hurt');
      //  eventData.gameObjectA.setVelocityX(5);
      //}
  //  }
  //});

  //var hitbox = self.add.tileSprite(400,200,5*50,50, "woodblock");
  //hitboxes[playerInfo.playerId] = self.matter.add.gameObject(hitbox,{ isStatic: true , label:"hitbox"});
  self.matterCollision.addOnCollideStart({
      objectA: playerObject[playerInfo.playerId],
      objectB: [self.woodplatform1, self.woodplatform2, self.ground],
      callback: eventData => {
        playerObject[playerInfo.playerId].canJump = true;
        // eventData.gameObjectB will be the specific enemy that was hit!
      }
    });
  //self.matterCollision.addOnCollideStart({
  //    objectA: playerObject[playerInfo.playerId],
  //    objectB: [self.woodplatform1, self.woodplatform2, self.ground],
  //    callback: eventData => {
  //      playerObject[playerInfo.playerId].canJump = true;
  //      // eventData.gameObjectB will be the specific enemy that was hit!
  //    }
  //  });
  //player.setDrag(100);
  //player.setAngularDrag(100);
  //player.setMaxVelocity(200);
  //player.playerId = playerInfo.playerId;
  playerObject[playerInfo.playerId].playerId = playerInfo.playerId;
  //self.players.add(player);
  self.players.add(playerObject[playerInfo.playerId]);
  if(self.teamselector%2 === 0){
    //hitboxteam1[playerInfo.playerId] = self.matter.add.sprite(-10, -10, "invis", null, {isStatic: true});
    //hitboxteam1[playerInfo.playerId].setCollisionCategory(this.staticCategory);
    //playerObjectteam1[playerInfo.playerId] = playerObject[playerInfo.playerId];
    playerInfo.team = 1;
    //hitboxes[playerInfo.playerId].team = 1;
    playerObject[playerInfo.playerId].team = 1;
    self.matterCollision.addOnCollideStart({
      objectA: hitboxes[playerInfo.playerId],
      callback: eventData => {
        const { bodyB, gameObjectB } = eventData;
        if(gameObjectB.team === 2){
          console.log("Player touched something.");
          stateMachinesarr[gameObjectB.playerId].transition('hurt');
          if(gameObjectB.x > playerObject[playerInfo.playerId].x){
          gameObjectB.setVelocityX(5);
          }
          else{
            gameObjectB.setVelocityX(-5);
          }
        }
      }
    });
  }
  else{
    //hitboxteam2[playerInfo.playerId] = self.matter.add.sprite(-10, -10, "invis", null, {isStatic: true});
    //hitboxteam2[playerInfo.playerId].setCollisionCategory(this.staticCategory);
    //playerObjectteam2[playerInfo.playerId] = playerObject[playerInfo.playerId];
    playerInfo.team = 2;
    //hitboxes[playerInfo.playerId].team = 2;
    playerObject[playerInfo.playerId].team = 2;
    self.matterCollision.addOnCollideStart({
      objectA: hitboxes[playerInfo.playerId],
      callback: eventData => {
        const { bodyB, gameObjectB } = eventData;
        if(gameObjectB.team === 1){
          console.log("Player touched something.");
          stateMachinesarr[gameObjectB.playerId].transition('hurt');
          if(gameObjectB.x > playerObject[playerInfo.playerId].x){
          gameObjectB.setVelocityX(5);
          }
          else{
            gameObjectB.setVelocityX(-5);
          }
        }
      }
    });
  }
  self.teamselector = self.teamselector + 1;
  //stateMachinesarr[player.playerId] = new StateMachine('idle', {
  //      idle: new IdleState(),
  //      move: new MoveState(),
  //      //attack: new AttackState(),
  //      //hurt: new HurtState(),
  //      //swing: new SwingState(),
  //      //dash: new DashState(),
  //    }, [self, self.npc,self.npc.input]);

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
  if (hero.input.left || hero.input.right || hero.input.up) {
    this.stateMachine.transition('move');
    return;
  }
  if (hero.input.space) {
    this.stateMachine.transition('attack');
    return;
  }
}
}

class MoveState extends State {
enter(scene, hero, heroObject) {
  console.log("Enter Move State");
  hero.state = 'move';

}
execute(scene, hero, heroObject) {
  //const {left, right, up, down, space} = keys;
  //console.log("execute movestate");

  // Transition to idle if not pressing movement keys
  if (!(hero.input.left || hero.input.right || hero.input.up)) {
    this.stateMachine.transition('idle');
    return;
  }
  if (hero.input.space) {
    this.stateMachine.transition('attack');
    return;
  }
  //if (space.isDown) {
  //  this.stateMachine.transition('attack');
  //  return;
  //}
  //if (up.isDown && hero.canJump==true) {
  if (hero.input.up) {
      hero.state = 'jump';
      if(heroObject.canJump==true) {
        heroObject.canJump = false;
          //if(hero.label === 'schoolgirl'){
          //hero.anims.play(`player1_jump_anim`, true);
          //}
          //else if(hero.label === 'warrior'){
          //  hero.anims.play(`warrior_jump_anim`, true);
          //}

          heroObject.setVelocityY(-5);
          heroObject.setVelocityX(0);
      }
  }

  if (hero.input.left) {
    hero.xflipped = true;
    heroObject.setVelocityX(-5);
    heroObject.flipX = true;
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
    heroObject.setVelocityX(5);
    heroObject.flipX = false;
    //hero.flipX = false;

    //if(hero.label === 'schoolgirl'){
    //  hero.anims.play(`player1_run_anim`, true);
    //}
    //else if(hero.label === 'warrior'){
    //  hero.anims.play(`warrior_run_anim`, true);
    //}
  }



}
}

class HurtState extends State {

enter(scene, hero, heroObject) {
  console.log("Enter Hurt State");
  hitboxes[hero.playerId].setCollisionCategory(null);
  hero.state = 'hurt';
  //hitbox.setCollisionCategory(null);
  //if(hero.label === 'schoolgirl'){
  //  hero.anims.play(`player1_death_anim`, true);
  //}
  //else if(hero.label === 'warrior'){
  //  hero.anims.play(`warrior_death_anim`, true);
  //}
  scene.time.addEvent({
    delay: 500,
    callback: ()=>{
      console.log('Leave Hurt State');
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




const game = new Phaser.Game(config);
window.gameLoaded();
