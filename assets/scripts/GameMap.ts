
import { _decorator, Component, Node, Vec2, Vec3, Rect, debug, Button, Camera, color, Color, Sprite, UITransform, SpriteFrame, instantiate, Canvas, Game, game, resources, Event, EventTouch } from 'cc';
import { AREA_GRID_COUNT, AREA_SIZE, DataManager, DataMgr, GridData, GRID_SIZE, MapAreaData, MapRoomData, VIEW_AREA_COUNT } from './DataManager';
const { ccclass, property } = _decorator;

class MapGrid {
    private _sprFloor:Node;     
    private _sprOverlay:Node;
    private _sprWall:Node;
    private _sprFog:Node;
    private _data:GridData;
    private _parent:Node;

    createNode(crood:Vec2, frameId:number) {
        var sprFrame = GameMap.Instance.WorldAssets[frameId];
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
        this._data = data;
        this._parent = parent;
        if (this._sprFloor == null && data.Floor > 0) {
            this._sprFloor = this.createNode(data.Crood, data.Floor - 1);
        }
    }
}

//用来表示地图的区域，便于分区域加载
class MapArea {
    private _grids: MapGrid[];
    private _data: MapAreaData;
    private _self: Node;

    load (data:MapAreaData, parent:Node) {
        this._grids = new Array(AREA_GRID_COUNT);
        this._data = data;
        this._self = new Node(this._data.Crood.toString());
        this._self.parent = parent;
        for (var i = 0; i < AREA_GRID_COUNT; i++) {
            this._grids[i] = new MapGrid(data.Grids[i], this._self);
        }
    }

    unload () {
        this._self.destroy();
        this._data = null;
        this._grids = null;
    }
}
 
@ccclass('GameMap')
export class GameMap extends Component {
    //当前视野范围里的区块
    private _viewAreas: MapArea[] = new Array(VIEW_AREA_COUNT);

    private _touchStartPos:Vec2;

    public WorldAssets:SpriteFrame[];

    public static Instance:GameMap; 

    @property({type:Camera})
    camera:Camera = null;

    @property({type:Node})
    sceneRoot:Node = null;

    start () {

        GameMap.Instance = this;

        DataMgr.genMapData();

        console.log("start...");
        for (var i = 0; i < VIEW_AREA_COUNT; i++) {
            this._viewAreas[i] = new MapArea();
        }
        
        resources.loadDir("scene/spriteFrame/world/style01", SpriteFrame, function (err, assets) {
            GameMap.Instance.onLoadAssetFinish(assets);
        });
    }

    onLoadAssetFinish(assets) {
        this.WorldAssets = assets;
        
        //资源加载完毕后允许相机移动
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        this.checkLoadFromCamera();
    }

    //根据相机当前位置计算要加载和卸载的地图
    checkLoadFromCamera() {

    }

    onTouchStart(event:EventTouch) {
        this._touchStartPos = event.getLocation();
        console.log(this._touchStartPos);
    }

    onTouchMove(event:EventTouch) {
        var diff = new Vec2(0, 0);
        var pt = event.getLocation();
        Vec2.subtract(diff, pt, this._touchStartPos);
        var speed = 20;
        diff.multiplyScalar(game.deltaTime * speed);
        this.camera.node.position = this.camera.node.position.add(new Vec3(diff.x, diff.y, 0));
        this._touchStartPos = pt;
    }

    onTouchEnd(event:EventTouch) {
        this._touchStartPos = null;
    }

    //生成一个地图块
    generateMapBlock (size: Rect, entrance: Vec2, exit: Vec2) 
    {

    }

    OnClick(btn: Button) {
        console.log("on click");
    }
}
