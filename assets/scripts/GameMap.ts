
import { _decorator, Component, Node, Vec2, Vec3, Rect, debug, Button, Camera, color, Color, Sprite, UITransform, SpriteFrame, instantiate, Canvas, Game, game, resources, Event, EventTouch, math, view } from 'cc';
import { DataManager } from './DataManager';
import { AREA_GRID_COUNT, AREA_SIZE_X, AREA_SIZE_Y, GridData, GRID_SIZE, MapAreaData, MapData, MapGenerator, VIEW_AREA_COUNT } from './MapGenerator';
import { Player } from './Player';
import { Random } from './Random';
import { ResManager } from './ResManager';
const { ccclass, property } = _decorator;

class MapGrid {
    private _sprFloor:Node;     
    private _sprOverlay:Node;
    private _sprObject:Node;
    private _sprFog:Node;
    private _data:GridData;
    private _parent:Node;

    createNode(crood:Vec2, frameId:number) {
        var sprFrame = ResManager.Instance.WorldAssets[frameId];
        var node = new Node(sprFrame.name);
        node.parent = this._parent;
        node.position = new Vec3(crood.x * GRID_SIZE, crood.y * GRID_SIZE, 0);
        var spr = node.addComponent(Sprite);
        spr.spriteFrame = sprFrame;
        var trans = node.addComponent(UITransform);
        trans.setAnchorPoint(0, 0);
        trans.setContentSize(GRID_SIZE, GRID_SIZE);
        return node;
    }

    constructor(data:GridData, parent:Node) {
        if (data == null)
            return;
        this._data = data;
        this._parent = parent;
        if (this._sprFloor == null && data.Floor > 0) {
            this._sprFloor = this.createNode(data.Crood, data.Floor - 1);
        }
        if (this._sprObject == null && data.Object > 0) {
            this._sprObject = this.createNode(data.Crood, data.Object - 1);
        }
    }
}

//用来表示地图的区域，便于分区域加载
class MapArea {
    private _grids: MapGrid[];
    private _data: MapAreaData;
    private _self: Node;

    public getData() {
        return this._data;
    }

    load (data:MapAreaData, parent:Node) {
        if (data == null) {
            console.log("load area null");
            return;
        }
        console.log("load area" + data.AreaCrood.toString());
        this._data = data;
        this._grids = new Array(AREA_GRID_COUNT);
        this._self = new Node(this._data.AreaCrood.toString());
        this._self.parent = parent;
        for (var i = 0; i < AREA_GRID_COUNT; i++) {
            this._grids[i] = new MapGrid(data.Grids[i], this._self);
        }
    }

    unload () {
        if (this._self != null) {
            this._self.destroy();
            this._self = null;
        }
        this._data = null;
        this._grids = null;
    }
}
 
@ccclass('GameMap')
export class GameMap {
    public _data:MapData;
    //当前视野范围里的区块
    private _viewAreas = new Array<MapArea>(VIEW_AREA_COUNT);
    private _currentArea = new Vec2();
    private _touchStartPos = new Vec2();

    camera:Camera = null; //场景相机

    sceneRoot:Node = null; //场景信息的根节点
    areaRoot:Node = null;
    charRoot:Node = null;

    uiNode:Node = null; //用来挂接UI消息

    private static _instance:GameMap;
    public static get Instance() {
        if (GameMap._instance == null) {
            GameMap._instance = new GameMap();
        }
        return GameMap._instance;
    }

    public init(rootScene:Node, sprNode:Node, camera:Camera) {
        this.sceneRoot = rootScene;
        this.areaRoot = new Node("Areas");
        this.areaRoot.parent = rootScene;
        this.charRoot = new Node("Char");
        this.charRoot.parent = rootScene;
        this.camera = camera;
        this.uiNode = sprNode;
        this._data = DataManager.MapData;
        var gameMap = this;
        ResManager.Instance.loadWorldAssets("style01", function () {
            ResManager.Instance.loadHeroAssets(function () {
                gameMap.onLoadAssetFinish();
            });
        });
    }

    onLoadAssetFinish() {
        //资源加载完毕后允许相机移动
        this.uiNode.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.uiNode.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.uiNode.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        this.checkLoadFromCamera(true);

        //玩家插入到场景
        this.playerEnter();
    }

    //根据相机当前位置计算要加载和卸载的地图
    checkLoadFromCamera(isForceLoad:boolean) {
        var cameraPos = this.camera.node.position;
        var centerAreaX = Math.floor(cameraPos.x / (AREA_SIZE_X * GRID_SIZE));
        var centerAreaY = Math.floor(cameraPos.y / (AREA_SIZE_Y * GRID_SIZE));
        math.clamp(centerAreaX, 0, this._data.Size.x - 1);
        math.clamp(centerAreaY, 0, this._data.Size.y - 1);
        if (!isForceLoad && this._currentArea.x == centerAreaX && this._currentArea.y == centerAreaY) {
            return;
        }
        //获得需要加载的区块
        var needLoadAreas = new Array<Vec2>();
        for (var y = centerAreaY - 1; y <= centerAreaY + 1; y++) {
            for (var x = centerAreaX - 1; x <= centerAreaX + 1; x++) {
                if (x < 0 || x >= this._data.Size.x || y < 0 || y >= this._data.Size.y) {
                    continue;
                }
                needLoadAreas.push(new Vec2(x, y));
            }
        }
        //卸载不属于加载列表的当前区块
        for (var i = 0; i < this._viewAreas.length; i++) {
            var viewArea = this._viewAreas[i];
            if (viewArea != null) {
                var areaData = viewArea.getData();
                var isFound = false;
                if (areaData != null) {
                    for (var j = 0; j < needLoadAreas.length; j++) {
                        if (areaData.AreaCrood.strictEquals(needLoadAreas[j])) {
                            isFound = true;
                            break; 
                        }
                    }    
                }
                if (!isFound) {
                    viewArea.unload();
                    this._viewAreas[i] = null;
                }
            }
        }
        //加载未加载的区块
        for (var i = 0; i < needLoadAreas.length; i++) {
            var loadArea = needLoadAreas[i];
            var isFound = false;
            for (var j = 0; j < this._viewAreas.length; j++) {
                var viewArea = this._viewAreas[j];
                if (viewArea != null) {
                    var data = viewArea.getData();
                    if (viewArea != null && data!= null && loadArea.strictEquals(data.AreaCrood)) {
                        isFound = true;
                        break;
                    }    
                }
            }
            //找到一个空块进行加载
            if (!isFound) {
                for (var j = 0; j < this._viewAreas.length; j++) {
                    var viewArea = this._viewAreas[j];
                    if (viewArea == null) { 
                        viewArea = new MapArea();
                        const idx = loadArea.x + loadArea.y * this._data.Size.x;
                        viewArea.load(this._data.Areas[idx], this.areaRoot);
                        this._viewAreas[j] = viewArea;
                        break;
                    }
                }
            }
        }

        this._currentArea.x = centerAreaX;
        this._currentArea.y = centerAreaY;
    }

    onTouchStart(event:EventTouch) {
        this._touchStartPos = event.getLocation();
    }

    onTouchMove(event:EventTouch) {
        var diff = new Vec2(0, 0);
        var pt = event.getLocation();
        Vec2.subtract(diff, pt, this._touchStartPos);
        var speed = 20;
        diff.multiplyScalar(game.deltaTime * speed);
        var cameraPos = this.camera.node.position;
        //限制相机的位置
        var posX = cameraPos.x - diff.x;
        var posY = cameraPos.y - diff.y;
        var posZ = cameraPos.z;
        if (posX < 0 || posX >= this._data.Size.x * AREA_SIZE_X * GRID_SIZE) posX = cameraPos.x;
        if (posY < 0 || posY >= this._data.Size.y * AREA_SIZE_Y * GRID_SIZE) posY = cameraPos.y;
        this.camera.node.position = new Vec3(posX, posY, posZ);
        this._touchStartPos = pt;

        this.checkLoadFromCamera(false);
    }

    onTouchEnd(event:EventTouch) {
        this._touchStartPos = null;
    }


    playerEnter() {
        var player = new Player(DataManager.PlayerData);
        var randRoom = this._data.Rooms[Random.randomRangeInt(0, this._data.Rooms.length)];
        var enterPos = new Vec2();
        enterPos.add(randRoom.StartGrid);
        enterPos.add(randRoom.EnterPos);
        player.enterScene(enterPos, this.charRoot);
    }
}
