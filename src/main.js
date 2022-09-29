import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';

import {third_person_camera} from './third-person-camera.js';
import {entity_manager} from './entity-manager.js';
import {player_entity} from './player-entity.js'
import {entity} from './entity.js';
import {gltf_component} from './gltf-component.js';
import {health_component} from './health-component.js';
import {player_input} from './player-input.js';
import {npc_entity} from './npc-entity.js';
import {math} from './math.js';
import {spatial_hash_grid} from './spatial-hash-grid.js';
import {ui_controller} from './ui-controller.js';
import {health_bar} from './health-bar.js';
import {level_up_component} from './level-up-component.js';
import {spatial_grid_controller} from './spatial-grid-controller.js';
import {inventory_controller} from './inventory-controller.js';
import {equip_weapon_component} from './equip-weapon-component.js';
import {attack_controller} from './attacker-controller.js';

class HackNSlashDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.gammaFactor = 2.2;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this._threejs.domElement.id = 'threejs';

    document.getElementById('container').appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 10000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(25, 10, 25);

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xFFFFFF);
    this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-10, 500, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 1000.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    

    this._sun = light;

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './resources/arid_ft.jpg',
        './resources/arid_bk.jpg',
        './resources/arid_up.jpg',
        './resources/arid_dn.jpg',
        './resources/arid_rt.jpg',
        './resources/arid_lf.jpg',
    ]);
    this._scene.background = texture;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500, 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0x1e601c,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    this._entityManager = new entity_manager.EntityManager();
    this._grid = new spatial_hash_grid.SpatialHashGrid(
        [[-1000, -1000], [1000, 1000]], [100, 100]);

    this._LoadControllers();
    this._LoadPlayer();
    this._LoadClouds();

    this.totalTime_ = 0.0;

    this._previousRAF = null;
    this._RAF();
  }

  _LoadControllers() {
    const ui = new entity.Entity();
    ui.AddComponent(new ui_controller.UIController());
    this._entityManager.Add(ui, 'ui');
  }

  

  _LoadClouds() {
    for (let i = 0; i < 20; ++i) {
      const index = math.rand_int(1, 3);
    const pos = new THREE.Vector3(
        (Math.random() * 2.0 - 1.0) * 500,
        100,
        (Math.random() * 2.0 - 1.0) * 500);

      const e = new entity.Entity();
      e.AddComponent(new gltf_component.StaticModelComponent({
        scene: this._scene,
        resourcePath: './resources/nature2/GLTF/',
        resourceName: 'Cloud' + index + '.glb',
        position: pos,
        scale: Math.random() * 5 + 10,
        emissive: new THREE.Color(0x808080),
      }));
      e.SetPosition(pos);
      this._entityManager.Add(e);
      e.SetActive(false);
    }
  }


  _LoadPlayer() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    };

    const levelUpSpawner = new entity.Entity();
    levelUpSpawner.AddComponent(new level_up_component.LevelUpComponentSpawner({
        camera: this._camera,
        scene: this._scene,
    }));
    this._entityManager.Add(levelUpSpawner, 'level-up-spawner');

    const axe = new entity.Entity();
    axe.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Axe',
          scale: 0.25,
          icon: 'war-axe-64.png',
        },
    }));
    this._entityManager.Add(axe);

    const axe2 = new entity.Entity();
    axe2.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Axe2',
          scale: 2.0,
          icon: 'war-axe-64.png',
        },
    }));
    this._entityManager.Add(axe2);
    

    const axe3 = new entity.Entity();
    axe3.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Axe3',
          scale: 2.0,
          icon: 'war-axe-64.png',
        },
    }));
    this._entityManager.Add(axe3);

    const axe4 = new entity.Entity();
    axe4.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Axe4',
          scale: 2.0,
          icon: 'war-axe-64.png',
        },
    }));
    this._entityManager.Add(axe4);

    const hammer = new entity.Entity();
    hammer.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Hammer_Double',
          scale: 0.25,
          icon: 'hammer-weapon.png',
        },
    }));
    this._entityManager.Add(hammer);

    const hammer2 = new entity.Entity();
    hammer2.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Hammer_Double2',
          scale: 1.25,
          icon: 'hammer-weapon.png',
        },
    }));
    this._entityManager.Add(hammer2);

    const hammer3 = new entity.Entity();
    hammer3.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Hammer_Double3',
          scale: 0.25,
          icon: 'hammer-weapon.png',
        },
    }));
    this._entityManager.Add(hammer3);

    const hammer4 = new entity.Entity();
    hammer4.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Hammer_Double4',
          scale: 1.25,
          icon: 'hammer-weapon.png',
        },
    }));
    this._entityManager.Add(hammer4);

    const sword = new entity.Entity();
    sword.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Sword',
          scale: 0.25,
          icon: 'pointy-sword-64.png',
        },
    }));
    this._entityManager.Add(sword);

    const sword2 = new entity.Entity();
    sword2.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Sword2',
          scale: 2.0,
          icon: 'pointy-sword-64.png',
        },
    }));
    this._entityManager.Add(sword2);

    const sword3 = new entity.Entity();
    sword3.AddComponent(new inventory_controller.InventoryItem({
        type: 'weapon',
        damage: 3,
        renderParams: {
          name: 'Sword3',
          scale: 2.0,
          icon: 'pointy-sword-64.png',
        },
    }));
    this._entityManager.Add(sword3);

    const player = new entity.Entity();
    player.AddComponent(new player_input.BasicCharacterControllerInput(params));
    player.AddComponent(new player_entity.BasicCharacterController(params));
    player.AddComponent(
      new equip_weapon_component.EquipWeapon({anchor: 'RightHandIndex1'}));
      player.AddComponent(
        new equip_weapon_component.EquipWeapon({anchor: 'LeftHandIndex1'}));
    player.AddComponent(new inventory_controller.InventoryController(params));
    player.AddComponent(new health_component.HealthComponent({
        updateUI: true,
        health: 100,
        maxHealth: 100,
        strength: 50,
        wisdomness: 5,
        benchpress: 20,
        curl: 100,
        experience: 0,
        level: 1,
    }));
    player.AddComponent(
        new spatial_grid_controller.SpatialGridController({grid: this._grid}));
    player.AddComponent(new attack_controller.AttackController({timing: 0.7}));
    this._entityManager.Add(player, 'player');

    player.Broadcast({
        topic: 'inventory.add',
        value: axe.Name,
        added: false,
    });

    player.Broadcast({
      topic: 'inventory.add',
      value: axe2.Name,
      added: false,
  });

    player.Broadcast({
      topic: 'inventory.add',
      value: axe3.Name,
      added: false,
  });

    player.Broadcast({
      topic: 'inventory.add',
      value: axe4.Name,
      added: false,
  });

    player.Broadcast({
      topic: 'inventory.add',
      value: hammer.Name,
      added: false,
  });

    player.Broadcast({
      topic: 'inventory.add',
      value: hammer2.Name,
      added: false,
  });

    player.Broadcast({
      topic: 'inventory.add',
      value: hammer3.Name,
      added: false,
  });

    player.Broadcast({
      topic: 'inventory.add',
      value: hammer4.Name,
      added: false,
  });

    player.Broadcast({
        topic: 'inventory.add',
        value: sword.Name,
        added: false,
    });

    player.Broadcast({
      topic: 'inventory.add',
      value: sword2.Name,
      added: false,
  });

    player.Broadcast({
      topic: 'inventory.add',
      value: sword3.Name,
      added: false,
  });

    player.Broadcast({
        topic: 'inventory.equip',
        value: sword.Name,
        added: false,
    });

    const camera = new entity.Entity();
    camera.AddComponent(
        new third_person_camera.ThirdPersonCamera({
            camera: this._camera,
            target: this._entityManager.Get('player')}));
    this._entityManager.Add(camera, 'player-camera');

    for (let i = 0; i < 3; ++i) {
      const monsters = [
        {
          resourceName: 'Ghost.fbx',
          resourceTexture: 'Ghost_Texture.png',
        },
        {
          resourceName: 'Alien.fbx',
          resourceTexture: 'Alien_Texture.png',
        },
        {
          resourceName: 'Skull.fbx',
          resourceTexture: 'Skull_Texture.png',
        },
        // {
        //   resourceName: 'GreenDemon.fbx',
        //   resourceTexture: 'GreenDemon_Texture.png',
        // },
        // {
        //   resourceName: 'Cyclops.fbx',
        //   resourceTexture: 'Cyclops_Texture.png',
        // },
        // {
        //   resourceName: 'Cactus.fbx',
        //   resourceTexture: 'Cactus_Texture.png',
        // },
      ];
      const m = monsters[i];
      // math.rand_int(0, monsters.length - 1)

      const npc = new entity.Entity();
      npc.AddComponent(new npc_entity.NPCController({
          camera: this._camera,
          scene: this._scene,
          resourceName: m.resourceName,
          resourceTexture: m.resourceTexture,
      }));
      npc.AddComponent(
          new health_component.HealthComponent({
              health: 50,
              maxHealth: 50,
              strength: 2,
              wisdomness: 2,
              benchpress: 3,
              curl: 1,
              experience: 0,
              level: 1,
              camera: this._camera,
              scene: this._scene,
          }));
      npc.AddComponent(
          new spatial_grid_controller.SpatialGridController({grid: this._grid}));
      npc.AddComponent(new health_bar.HealthBar({
          parent: this._scene,
          camera: this._camera,
      }));
      npc.AddComponent(new attack_controller.AttackController({timing: 0.35}));
      npc.SetPosition(new THREE.Vector3(
          (Math.random() * 2 - 1) * 100,
          0,
          (Math.random() * 2 - 1) * 100));
      this._entityManager.Add(npc);
    }
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

    this._entityManager.Update(timeElapsedS);
  }
}


let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new HackNSlashDemo();
});
