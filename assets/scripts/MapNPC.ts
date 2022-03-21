
import { _decorator, Component, Node, Vec2, Sprite, UITransform, Vec3 } from 'cc';
import { GRID_SIZE, HALF_GRID_SIZE } from './MapGenerator';
import { ResManager } from './ResManager';
const { ccclass, property } = _decorator;

export class NPCData {
    Name:string;
    IsFriendly:boolean;
    Health:number = 1;
    Scale:number = 1;
    InitPos:Vec2;       //初始在房间中的位置
}

//地图上的非玩家生物
export class MapNPC {
    ID:number;
    Data:NPCData;
    Node:Node;
    PosGrid:Vec2;

    constructor(id:number, data:NPCData, posGrid:Vec2, parentNode:Node) {
        this.ID = id;
        this.Data = data;
        var node = new Node(this.Data.Name);
        node.parent = parentNode;
        this.Node = node;
        var spr = node.addComponent(Sprite);
        spr.spriteFrame = ResManager.Instance.getNPCSpr(this.Data.Name);
        var trans = this.Node.getComponent(UITransform);
        trans.setContentSize(GRID_SIZE * this.Data.Scale, GRID_SIZE * this.Data.Scale);
        var targetPos = new Vec3(posGrid.x * GRID_SIZE + HALF_GRID_SIZE, posGrid.y * GRID_SIZE + HALF_GRID_SIZE, 0);
        this.PosGrid = posGrid;
        this.Node.position = targetPos;
    }
}

