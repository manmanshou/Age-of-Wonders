
import { _decorator, Node, Vec2, Sprite, UITransform, Vec3 } from 'cc';
import { GRID_SIZE } from './MapGenerator';
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

    createNode(parentNode:Node, posGrid:Vec2) {
        var node = new Node(this.Data.Type.toString());
        node.parent = parentNode;
        var spr = node.addComponent(Sprite);
        spr.spriteFrame = ResManager.Instance.getMapObjectSpr(this.Data.Type, this.Data.State);
        var trans = node.addComponent(UITransform);
        trans.setAnchorPoint(0, 0);
        trans.setContentSize(GRID_SIZE, GRID_SIZE);
        node.position = new Vec3(posGrid.x * GRID_SIZE, posGrid.y * GRID_SIZE, 0);
        this.Node = node;
    }

    public static createChest(id:number, parentNode:Node, posGrid:Vec2) {
        var data = new MapObjectData(MapObjectType.Chest1, 0);
        var obj = new MapObject(id, data);
        obj.createNode(parentNode, posGrid);
        return obj;
    }
}

