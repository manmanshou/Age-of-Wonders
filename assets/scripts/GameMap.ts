
import { _decorator, Component, Node, Vec2, Vec3, Rect, debug, Button, Camera, color, Color, Sprite, UITransform, SpriteFrame, instantiate, Canvas, Game, game, resources, Event, EventTouch, math, view } from 'cc';
import { DataManager } from './DataManager';
import { AREA_GRID_COUNT, AREA_SIZE_X, AREA_SIZE_Y, FogType, GridData, GRID_SIZE, MapAreaData, MapData, MapGenerator, VIEW_AREA_COUNT, WorldSprDefine } from './MapGenerator';
import { MapChest, MapObject, MapObjectData, MapObjectType } from './MapObject';
import { MapPath } from './MapPath';
import { JPS, JPSCheckTag, JPSNode } from './PathFind/JPS';
import { Player } from './Player';
import { Random } from './Random';
import { ResManager } from './ResManager';
import { ContextMenuPanel } from './UI/ContextMenuPanel';
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
        var trans = node.getComponent(UITransform);
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

//???????????????????????????????????????????????????
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
    //??????????????????????????????
    private _viewAreas = new Array<MapArea>(VIEW_AREA_COUNT);
    private _currentArea = new Vec2();
    private _touchStartPos = new Vec2();

    public Camera:Camera;      //????????????
    public UICamera:Camera;    //UI??????
    
    private _sceneRoot:Node;   //????????????????????????
    public SceneLowRoot:Node;  //???????????????
    public SceneMidRoot:Node;  //???????????????
    public SceneTopRoot:Node;  //???????????????
    public CharRoot:Node;      //?????????

    public Player:Player;      //???????????????????????????????????????????????????

    public Objects:Map<number, MapObject>;  //????????????

    private uiNode:Node;        //????????????UI??????

    private selectNode:Node;    //??????????????????

    private _init:boolean = false;

    private _jpsNodes:Array<JPSNode<any>>; //??????????????????????????????????????????????????????

    private _jpsPathFinder:JPS<JPSNode<any>, any>;

    private _mapPath:MapPath;

    private _inMoving:boolean;

    private static _instance:GameMap;
    public static get Instance() {
        if (GameMap._instance == null) {
            GameMap._instance = new GameMap();
        }
        return GameMap._instance;
    }

    private _idGen:number = 1;

    public init(rootScene:Node, uiNode:Node, camera:Camera, uiCamera:Camera) {
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
        this.UICamera = uiCamera;
        this.uiNode = uiCamera.node.parent;
        this.Data = DataManager.Instance.MapData;
        this.Objects = new Map<number, MapObject>();
        //???????????????????????????????????????????????????
        this._jpsPathFinder = new JPS();
        this._jpsNodes = new Array();
        var gridCountX = this.Data.Size.x * AREA_SIZE_X;
        for (var i = 0; i < this.Data.StaticBlocks.length; i++) {
            var jpsNode = new JPSNode<any>();
            jpsNode.corde = new Vec2(Math.floor(i % gridCountX), Math.floor(i / gridCountX));
            jpsNode.myIndex = i;
            if (this.Data.StaticBlocks[i]) {
                jpsNode.myTag = new JPSCheckTag(1);
            }else {
                jpsNode.myTag = new JPSCheckTag(0);
            }
            this._jpsNodes.push(jpsNode);
        }
        var gameMap = this;
        ResManager.Instance.loadWorldAssets("style01", function () {
            ResManager.Instance.loadBaseAssets(function () {
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

    //???????????????????????????
    public setCameraPos(pos:Vec2) {
        this.Camera.node.position = new Vec3(pos.x, pos.y, this.Camera.node.position.z);
        this.checkLoadFromCamera(false);
    }

    public hasBlock(pos:Vec2) {
        var idx = pos.x + pos.y * this.Data.Size.x * AREA_SIZE_X;
        return !this._jpsNodes[idx].myTag.isGood();
    }

    public addBlock(pos:Vec2) {
        var idx = pos.x + pos.y * this.Data.Size.x * AREA_SIZE_X;
        this._jpsNodes[idx].myTag.tag++;
    }

    public removeBlock(pos:Vec2) {
        var idx = pos.x + pos.y * this.Data.Size.x * AREA_SIZE_X;
        this._jpsNodes[idx].myTag.tag--;
    }

    public getMapObject(pos:Vec2) {
        for (var v of this.Objects.values()) {
            if (v.PosGrid.strictEquals(pos)) {
                return v;
            }
        }
        return null;
    }

    public setSelect(pos:Vec2, isShow:boolean) {
        if (this.selectNode == undefined) {
            var node = new Node("Select");
            var spr = node.addComponent(Sprite);
            spr.spriteFrame = ResManager.Instance.getUISpr("grid");
            var trans = node.getComponent(UITransform);
            trans.setAnchorPoint(0, 0);
            trans.setContentSize(GRID_SIZE, GRID_SIZE);
            node.parent = this.SceneTopRoot;
            node.position = new Vec3(pos.x * GRID_SIZE, pos.y * GRID_SIZE, 0);
            this.selectNode = node;
        }else {
            this.selectNode.position = new Vec3(pos.x * GRID_SIZE, pos.y * GRID_SIZE, 0);
        }
        this.selectNode.active = isShow;
    }

    private generateID() {
        return this._idGen++;
    }

    //?????????????????????????????????????????????
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
                if (this.Data.isStaticBlock(x, Math.floor(y))) {
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
                if (this.Data.isStaticBlock(Math.floor(x), y)) {
                    return false;
                }
                x += stepX;
                y += stepY;
            }
        }
        return true;
    }

    public gridEnterRange(posGrid:Vec2) {
        //??????map??????
        var areaX = Math.floor(posGrid.x / AREA_SIZE_X);
        var areaY = Math.floor(posGrid.y / AREA_SIZE_Y);
        math.clamp(areaX, 0, this.Data.Size.x - 1);
        math.clamp(areaY, 0, this.Data.Size.y - 1);
        var areaID = areaX + areaY * this.Data.Size.x;
        var areaData = this.Data.Areas[areaID];
        areaData.enterHeroView(posGrid.x, posGrid.y);
        //??????????????????????????????????????????
        for (var i = 0; i < this._viewAreas.length; i++) {
            var area = this._viewAreas[i];
            if (area!= null && area.getID() == areaID) {
                area.refreshNode(posGrid);
            }
        }
    }

    public gridLeaveRange(posGrid:Vec2) {
        //??????map??????
        var areaX = Math.floor(posGrid.x / AREA_SIZE_X);
        var areaY = Math.floor(posGrid.y / AREA_SIZE_Y);
        math.clamp(areaX, 0, this.Data.Size.x - 1);
        math.clamp(areaY, 0, this.Data.Size.y - 1);
        var areaID = areaX + areaY * this.Data.Size.x;
        var areaData = this.Data.Areas[areaID];
        areaData.leaveHeroView(posGrid.x, posGrid.y);
        //??????????????????????????????????????????
        for (var i = 0; i < this._viewAreas.length; i++) {
            var area = this._viewAreas[i];
            if (area!= null && area.getID() == areaID) {
                area.refreshNode(posGrid);
            }
        }
    }

    private onLoadAssetFinish() {
        //???????????????????????????????????????
        this.uiNode.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.uiNode.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.uiNode.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        this.checkLoadFromCamera(true);

        //?????????????????????
        this.playerEnter();
    }

    //?????????????????????????????????????????????????????????
    private checkLoadFromCamera(isForceLoad:boolean) {
        var cameraPos = this.Camera.node.position;
        var centerAreaX = Math.floor(cameraPos.x / (AREA_SIZE_X * GRID_SIZE));
        var centerAreaY = Math.floor(cameraPos.y / (AREA_SIZE_Y * GRID_SIZE));
        math.clamp(centerAreaX, 0, this.Data.Size.x - 1);
        math.clamp(centerAreaY, 0, this.Data.Size.y - 1);
        if (!isForceLoad && this._currentArea.x == centerAreaX && this._currentArea.y == centerAreaY) {
            return;
        }
        //???????????????????????????
        var needLoadAreas = new Array<Vec2>();
        for (var y = centerAreaY - 1; y <= centerAreaY + 1; y++) {
            for (var x = centerAreaX - 1; x <= centerAreaX + 1; x++) {
                if (x < 0 || x >= this.Data.Size.x || y < 0 || y >= this.Data.Size.y) {
                    continue;
                }
                needLoadAreas.push(new Vec2(x, y));
            }
        }
        //??????????????????????????????????????????
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
        //????????????????????????
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
            //??????????????????????????????
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

    public gridPosToUIWorldPos(gridPos:Vec2):Vec3 {
        const canvasPos = new Vec2(800, 450);
        var gridWorldPos = new Vec3(gridPos.x * GRID_SIZE + canvasPos.x + GRID_SIZE / 2, gridPos.y * GRID_SIZE + canvasPos.y + GRID_SIZE / 2, 0);
        var gridScreenPos = new Vec3();
        this.Camera.worldToScreen(gridWorldPos, gridScreenPos);
        var uiWorldPos = new Vec3();
        this.UICamera.screenToWorld(gridScreenPos, uiWorldPos);
        uiWorldPos.z = 0;
        return uiWorldPos;
    }

    public screenPosToGridPos(screenPos2:Vec2) {
        const canvasPos = new Vec2(800, 450);
        var screenPos3 = new Vec3(screenPos2.x, screenPos2.y, 0);
        var worldPos = new Vec3();
        this.Camera.screenToWorld(screenPos3, worldPos);
        var gridX = Math.floor((worldPos.x - canvasPos.x) / GRID_SIZE);
        var gridY = Math.floor((worldPos.y - canvasPos.y) / GRID_SIZE);
        return new Vec2(gridX, gridY);
    }

    private onTouchStart(event:EventTouch) {
        this._touchStartPos = event.getLocation(); //?????????????????????????????????
        var gridPos = this.screenPosToGridPos(this._touchStartPos);
        this.setSelect(Vec2.ZERO, false);

        var grid = this.Data.getGrid(gridPos.x, gridPos.y);
        if (grid == undefined) {
            return;
        }
        if (grid.FogType == FogType.UnExplored) {
            return;
        }
        var obj = this.getMapObject(gridPos);
        if (obj != undefined) {
            ContextMenuPanel.Instance.show(gridPos, false, true);
            this.setSelect(gridPos, true);
        }else if (!grid.IsBlock) {
            if (this._inMoving) {
                return;
            }
            var path = this.findPath(this.Player.CurHero.PosGrid, gridPos);
            if (path && path.length > 0) {
                ContextMenuPanel.Instance.show(gridPos, true, false);
                if (this._mapPath != undefined) {
                    this._mapPath.destory();
                }
                this._mapPath = new MapPath(path);
            }else{
                console.log("can not found path" + this.Player.CurHero.PosGrid, gridPos);
            }
        }
    }

    public startMove() {
        if (this._inMoving) {
            return;
        }
        if (this._mapPath == undefined) {
            return;
        }
        this._inMoving = true;
        var gameMap = this;
        this.Player.CurHero.movePath(this._mapPath, function() {
            gameMap._inMoving = false;
            gameMap._mapPath.destory();
            gameMap._mapPath = null;
        });
    }

    private findPath(posStart:Vec2, posEnd:Vec2) {
        var startNodeIdx = posStart.x + posStart.y * this.Data.Size.x * AREA_SIZE_X;
        var startNode = this._jpsNodes[startNodeIdx];
        var endNodeIdx = posEnd.x + posEnd.y * this.Data.Size.x * AREA_SIZE_X;
        var endNode = this._jpsNodes[endNodeIdx];
        return this._jpsPathFinder.findPath(startNode, endNode, this._jpsNodes, this.Data.Size.x * AREA_SIZE_X, this.Data.Size.y * AREA_SIZE_Y);
    }

    private onTouchMove(event:EventTouch) {
        var diff = new Vec2(0, 0);
        var pt = event.getLocation();
        Vec2.subtract(diff, pt, this._touchStartPos);
        var speed = 20;
        diff.multiplyScalar(game.deltaTime * speed);
        var cameraPos = this.Camera.node.position;
        //?????????????????????
        var posX = cameraPos.x - diff.x;
        var posY = cameraPos.y - diff.y;
        var posZ = cameraPos.z;
        if (posX < 0 || posX >= this.Data.Size.x * AREA_SIZE_X * GRID_SIZE) posX = cameraPos.x;
        if (posY < 0 || posY >= this.Data.Size.y * AREA_SIZE_Y * GRID_SIZE) posY = cameraPos.y;
        this.Camera.node.position = new Vec3(posX, posY, posZ);
        this._touchStartPos = pt;

        this.checkLoadFromCamera(false);
    }

    private onTouchEnd(event:EventTouch) {
        this._touchStartPos = null;
    }

    private playerEnter() {
        var player = new Player(DataManager.Instance.PlayerData);
        var randRoom = this.Data.Rooms[Random.randomRangeInt(0, this.Data.Rooms.length)];
        var enterPos = new Vec2();
        enterPos.add(randRoom.StartGrid);
        enterPos.add(randRoom.EnterPos);
        player.enterScene(enterPos, this.CharRoot);
        this.Player = player;

        var id = this.generateID();
        var data = new MapObjectData();
        data.State = 0;
        data.Type = MapObjectType.Chest1;
        var chest = new MapChest(id, data, this.SceneMidRoot, enterPos)
        this.Objects.set(id, chest);
    }
}
