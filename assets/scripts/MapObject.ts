
import { _decorator, Node, Vec2, Sprite, UITransform, Vec3 } from 'cc';
import { GameMap } from './GameMap';
import { GRID_SIZE, HALF_GRID_SIZE } from './MapGenerator';
import { ResManager } from './ResManager';
const { ccclass, property } = _decorator;

enum MapObjectType {
    Chest1 = 1,     //宝箱1
    Coffin = 2,     //棺材
}

export class MapObjectData {
    public Type: MapObjectType;
    public State: number;

    constructor(t:MapObjectType, state:number) {
        this.Type = t;
        this.State = state;
    }
}


//地图上的动态物体，有时可以交互
export class MapObject {
    public ID: number;
    public Data: MapObjectData;
    public Node: Node; //节点
    public PosGrid:Vec2;

    constructor(id:number, data:MapObjectData) {
        this.Data = data;
        this.ID = id;
    }

    private createNode(parentNode:Node, posGrid:Vec2) {
        var node = new Node(this.Data.Type.toString());
        node.parent = parentNode;
        var spr = node.addComponent(Sprite);
        spr.spriteFrame = ResManager.Instance.getMapObjectSpr(this.Data.Type, this.Data.State);
        var trans = node.addComponent(UITransform);
        trans.setContentSize(GRID_SIZE / 1.5, GRID_SIZE / 1.5);
        node.position = new Vec3(posGrid.x * GRID_SIZE + HALF_GRID_SIZE, posGrid.y * GRID_SIZE + HALF_GRID_SIZE, 0);
        this.Node = node;
        this.PosGrid = posGrid;
    }

    public onInit() {

    }

    public onPick() {
        return false;
    }

    public static createChest(id:number, parentNode:Node, posGrid:Vec2) {
        var obj = new MapChest(id);
        obj.createNode(parentNode, posGrid);
        obj.onInit();
        return obj;
    }
}

export class MapChest extends MapObject {
    constructor(id:number) {
        var data = new MapObjectData(MapObjectType.Chest1, 0);
        super(id, data);
    }

    public onInit() {
        GameMap.Instance.addBlock(this.PosGrid);
    }

    public onPick() {
        if (this.Data.State != 0) {
            return false;
        }
        this.Data.State = 1;
        var spr = this.Node.getComponent(Sprite);
        spr.spriteFrame = ResManager.Instance.getMapObjectSpr(this.Data.Type, this.Data.State);
        var trans = this.Node.getComponent(UITransform);
        trans.setAnchorPoint(0, 0);
        trans.setContentSize(GRID_SIZE, GRID_SIZE);
        return true;
    }
}

