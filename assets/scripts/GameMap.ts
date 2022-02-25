
import { _decorator, Component, Node, Vec2, Vec3, Rect, debug, Button, Camera, color, Color, Sprite, UITransform, SpriteFrame, instantiate, Canvas, Game, game, resources, Event, EventTouch, math, view } from 'cc';
import { DataManager } from './DataManager';
import { AREA_GRID_COUNT, AREA_SIZE_X, AREA_SIZE_Y, FogType, GridData, GRID_SIZE, MapAreaData, MapData, MapGenerator, VIEW_AREA_COUNT, WorldSprDefine } from './MapGenerator';
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
    private _area:MapArea;

    createNode(frameId:number) {
        var crood = this._data.Crood;
        var sprFrame = ResManager.Instance.WorldAssets[frameId];
        var node = new Node(sprFrame.name);
        node.position = new Vec3(crood.x * GRID_SIZE, crood.y * GRID_SIZE, 0);
        var spr = node.addComponent(Sprite);
        spr.spriteFrame = sprFrame;
        var trans = node.addComponent(UITransform);
        trans.setAnchorPoint(0, 0);
        trans.setContentSize(GRID_SIZE, GRID_SIZE);
        return node;
    }

    public refreshNode() {
        if (this._data.FogType == FogType.UnExplored) {
            if (this._sprFloor != null) {
                this._sprFloor.destroy();
                this._sprFloor = null;
            }
            if (this._sprObject != null) {
                this._sprObject.destroy();
                this._sprObject = null;
            }
            if (this._sprFog != null) {
                this._sprFog.destroy();
                this._sprFog = null;
            }
        }else {
            if (this._sprFloor == null && this._data.Floor > 0) {
                this._sprFloor = this.createNode(this._data.Floor);
                this._sprFloor.parent = this._area.LowRoot;
            }
            if (this._sprObject == null && this._data.Object > 0) {
                this._sprObject = this.createNode(this._data.Object);
                this._sprObject.parent = this._area.MidRoot;
            }
            if (this._data.FogType == FogType.Explored) {
                if (this._sprFog == null) {
                    this._sprFog = this.createNode(WorldSprDefine.Fog);
                    this._sprFog.parent = this._area.TopRoot;
                }
                this._sprFog.getComponent(Sprite).color = new Color(255,255,255,150);
            }else if (this._data.FogType == FogType.None) {
                if (this._sprFog != null) {
                    this._sprFog.destroy();
                    this._sprFog = null;
                }
            }
        }
    }

    constructor(data:GridData, area:MapArea) {
        if (data == null)
            return;
        this._data = data;
        this._area = area;
        this.refreshNode();
    }
}

//用来表示地图的区域，便于分区域加载
class MapArea {
    private _grids: MapGrid[];
    private _data: MapAreaData;
    
    public LowRoot: Node;
    public MidRoot: Node;
    public TopRoot: Node;

    constructor (data:MapAreaData) {
        if (data == null) {
            console.log("load area null");
            return;
        }
        this._data = data;
        this._grids = new Array(AREA_GRID_COUNT);
        var areaName = this._data.AreaCrood.toString();
        console.log("load area" + areaName);
        this.LowRoot = new Node(areaName);
        this.LowRoot.parent = GameMap.Instance.SceneLowRoot;
        this.MidRoot = new Node(areaName);
        this.MidRoot.parent = GameMap.Instance.SceneMidRoot;
        this.TopRoot = new Node(areaName);
        this.TopRoot.parent = GameMap.Instance.SceneTopRoot;
        for (var i = 0; i < AREA_GRID_COUNT; i++) {
            this._grids[i] = new MapGrid(data.Grids[i], this);
        }
    }
    
    public getData() {
        return this._data;
    }

    public getID() {
        return this._data.ID;
    }

    public refreshNode(posGrid:Vec2) {
        var x = posGrid.x - this._data.GridCrood.x;
        var y = posGrid.y - this._data.GridCrood.y;
        var idx = x + y * AREA_SIZE_X;
        this._grids[idx].refreshNode();
    }
    
    unload () {
        if (this.LowRoot != null) {
            this.LowRoot.destroy();
            this.LowRoot = null;
        }
        if (this.MidRoot != null) {
            this.MidRoot.destroy();
            this.MidRoot = null;
        }
        if (this.TopRoot != null) {
            this.TopRoot.destroy();
            this.TopRoot = null;
        }
        this._data = null;
        this._grids = null;
    }
}
 
@ccclass('GameMap')
export class GameMap {
    public Data:MapData;
    //当前视野范围里的区块
    private _viewAreas = new Array<MapArea>(VIEW_AREA_COUNT);
    private _currentArea = new Vec2();
    private _touchStartPos = new Vec2();

    public Camera:Camera;      //场景相机
    
    private _sceneRoot:Node;     //场景信息的根节点
    public SceneLowRoot:Node;  //场景最低层
    public SceneMidRoot:Node;  //场景中间层
    public SceneTopRoot:Node;  //场景最高层
    public CharRoot:Node;      //角色层

    public Player:Player;       //角色

    private uiNode:Node;        //用来挂接UI消息

    private _init:boolean = false;

    private static _instance:GameMap;
    public static get Instance() {
        if (GameMap._instance == null) {
            GameMap._instance = new GameMap();
        }
        return GameMap._instance;
    }

    public init(rootScene:Node, uiNode:Node, camera:Camera) {
        this._sceneRoot = rootScene;
        this.SceneLowRoot = new Node("Low");
        this.SceneLowRoot.parent = rootScene;
        this.SceneMidRoot = new Node("Mid");
        this.SceneMidRoot.parent = rootScene;
        this.CharRoot = new Node("Char");
        this.CharRoot.parent = rootScene;
        this.SceneTopRoot = new Node("Top");
        this.SceneTopRoot.parent = rootScene;
        this.Camera = camera;
        this.uiNode = uiNode;
        this.Data = DataManager.Instance.MapData;
        var gameMap = this;
        ResManager.Instance.loadWorldAssets("style01", function () {
            ResManager.Instance.loadHeroAssets(function () {
                gameMap.onLoadAssetFinish();
                gameMap._init = true;
            });
        });
    }

    public onUpdate(deltaTime: number) {
        if (this._init) {
            this.Player.setCameraToCurHero();
        }
    }

    //设置相机的物理位置
    public setCameraPos(pos:Vec2) {
        this.Camera.node.position = new Vec3(pos.x, pos.y, this.Camera.node.position.z);
        this.checkLoadFromCamera(false);
    }

    //是否能在起始点看到终点格子
    public canSee(startPos:Vec2, endPos:Vec2) {
        var diffX = endPos.x - startPos.x;
        var diffY = endPos.y - startPos.y;
        var absX = Math.abs(diffX);
        var absY = Math.abs(diffY);
        var stepX = 0; var stepY = 0;
        if (absX > absY) {
            if (absX == 0) {
                return true;
            }
            stepX = diffX / absX;
            stepY = diffY / absX;
            var x = startPos.x + stepX
            var y = startPos.y + stepY;
            for (var i = 0; i < absX - 1; i++) {
                if (this.Data.isBlock(x, Math.floor(y))) {
                    return false;
                }
                x += stepX;
                y += stepY;
            }
        }else{
            if (absY == 0) {
                return true;
            }
            stepX = diffX / absY;
            stepY = diffY / absY;
            var x = startPos.x + stepX
            var y = startPos.y + stepY;
            for (var i = 0; i < absY - 1; i++) {
                if (this.Data.isBlock(Math.floor(x), y)) {
                    return false;
                }
                x += stepX;
                y += stepY;
            }
        }
        return true;
    }

    gridEnterRange(posGrid:Vec2) {
        //修改map数据
        var areaX = Math.floor(posGrid.x / AREA_SIZE_X);
        var areaY = Math.floor(posGrid.y / AREA_SIZE_Y);
        math.clamp(areaX, 0, this.Data.Size.x - 1);
        math.clamp(areaY, 0, this.Data.Size.y - 1);
        var areaID = areaX + areaY * this.Data.Size.x;
        var areaData = this.Data.Areas[areaID];
        areaData.enterHeroView(posGrid.x, posGrid.y);
        //如果在当前显示的区域内则刷新
        for (var i = 0; i < this._viewAreas.length; i++) {
            var area = this._viewAreas[i];
            if (area!= null && area.getID() == areaID) {
                area.refreshNode(posGrid);
            }
        }
    }

    gridLeaveRange(posGrid:Vec2) {
        //修改map数据
        var areaX = Math.floor(posGrid.x / AREA_SIZE_X);
        var areaY = Math.floor(posGrid.y / AREA_SIZE_Y);
        math.clamp(areaX, 0, this.Data.Size.x - 1);
        math.clamp(areaY, 0, this.Data.Size.y - 1);
        var areaID = areaX + areaY * this.Data.Size.x;
        var areaData = this.Data.Areas[areaID];
        areaData.leaveHeroView(posGrid.x, posGrid.y);
        //如果在当前显示的区域内则刷新
        for (var i = 0; i < this._viewAreas.length; i++) {
            var area = this._viewAreas[i];
            if (area!= null && area.getID() == areaID) {
                area.refreshNode(posGrid);
            }
        }
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
    public checkLoadFromCamera(isForceLoad:boolean) {
        var cameraPos = this.Camera.node.position;
        var centerAreaX = Math.floor(cameraPos.x / (AREA_SIZE_X * GRID_SIZE));
        var centerAreaY = Math.floor(cameraPos.y / (AREA_SIZE_Y * GRID_SIZE));
        math.clamp(centerAreaX, 0, this.Data.Size.x - 1);
        math.clamp(centerAreaY, 0, this.Data.Size.y - 1);
        if (!isForceLoad && this._currentArea.x == centerAreaX && this._currentArea.y == centerAreaY) {
            return;
        }
        //获得需要加载的区块
        var needLoadAreas = new Array<Vec2>();
        for (var y = centerAreaY - 1; y <= centerAreaY + 1; y++) {
            for (var x = centerAreaX - 1; x <= centerAreaX + 1; x++) {
                if (x < 0 || x >= this.Data.Size.x || y < 0 || y >= this.Data.Size.y) {
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
                        const idx = loadArea.x + loadArea.y * this.Data.Size.x;
                        viewArea = new MapArea(this.Data.Areas[idx]);
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
        var cameraPos = this.Camera.node.position;
        //限制相机的位置
        var posX = cameraPos.x - diff.x;
        var posY = cameraPos.y - diff.y;
        var posZ = cameraPos.z;
        if (posX < 0 || posX >= this.Data.Size.x * AREA_SIZE_X * GRID_SIZE) posX = cameraPos.x;
        if (posY < 0 || posY >= this.Data.Size.y * AREA_SIZE_Y * GRID_SIZE) posY = cameraPos.y;
        this.Camera.node.position = new Vec3(posX, posY, posZ);
        this._touchStartPos = pt;

        this.checkLoadFromCamera(false);
    }

    onTouchEnd(event:EventTouch) {
        this._touchStartPos = null;
    }

    playerEnter() {
        var player = new Player(DataManager.Instance.PlayerData);
        var randRoom = this.Data.Rooms[Random.randomRangeInt(0, this.Data.Rooms.length)];
        var enterPos = new Vec2();
        enterPos.add(randRoom.StartGrid);
        enterPos.add(randRoom.EnterPos);
        player.enterScene(enterPos, this.CharRoot);
        this.Player = player;
    }
}
