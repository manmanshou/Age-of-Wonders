
import { _decorator, Node, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

enum MapObjectType {
    Chest1 = 1,     //宝箱1
    Coffin = 2,     //棺材
}


//地图上的动态物体，有时可以交互
export class MapObject {
    public Type: MapObjectType;
    public Node: Node; //节点

    public enterScene(posGrid:Vec2, parentNode:Node) {
        
    }
}

