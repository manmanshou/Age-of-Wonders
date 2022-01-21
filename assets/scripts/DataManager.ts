
import { _decorator, Component, Node, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

export const GRID_SIZE: number = 48;       //一个格子边长单位
export const AREA_SIZE: number = 4;       //一个区块边的格子数量
export const AREA_GRID_COUNT: number = AREA_SIZE * AREA_SIZE;
export const VIEW_AREA_SIDE: number = 3;   //相机可见范围单边的区域数量
export const VIEW_AREA_COUNT: number = VIEW_AREA_SIDE * VIEW_AREA_SIDE;   //相机可见范围单边的区域数量

export enum DoorDirectionType {
    West, East, North, South
}

export enum FogType {
    None,           //当前视野范围内没有雾
    Explored,       //没有在当前视野范围内，且已探索
    UnExplored,     //没有在当前视野范围内，且未探索
}

export class RoomDoorData {
    public Direction:DoorDirectionType;     //门的方向
    public Pos:Vec2;                        //门的位置
}

export class GridData {
    public Crood:Vec2;                      //所在格子坐标
    
    public Floor:number;                    //地板图素ID，地板图素在最底层
    public FloorOverlay:number;             //地板覆盖物图素ID，覆盖物图素叠在地板图素上
    public Object:number;                   //地上物体图素ID，叠在覆盖物之上
    
    public FogType:number;                  //覆盖雾的类型，雾叠在墙图素之上
    public IsBlock:boolean;                 //是否为阻挡
    public Trigger:number;                  //触发类型
}

//地图房间代表地图一个游戏场景单位，各房间按照规则彼此相连通
export class MapRoomData {
    public Size:Vec2;                      //以格子为单位的尺寸，没有起始坐标是因为起始固定从0，0格子开始
    public DoorsPos:Array<RoomDoorData>;   //门列表，数组长度为0表示是一个封闭的房间
    public Floor:Array<GridData>;
}

export class MapAreaData {
    public Crood: Vec2;                    //格子坐标
    public Grids: GridData[];
}

export class MapData {
    public Size: Vec2;                     //有X方向和Y方向各有多少个区域
    public Areas: MapAreaData[];           //区域
}

export class DataManager {
    public Map: MapData;

    public genMapData() {
        this.Map = new MapData();
        this.Map.Size = new Vec2(1,1);
        this.Map.Areas = new Array(1);
        var area = new MapAreaData();
        area.Crood = new Vec2();
        area.Grids = new Array(AREA_GRID_COUNT);
        for (var i = 0; i < AREA_GRID_COUNT; i++) {
            var grid = new GridData();
            grid.Crood = new Vec2(i % AREA_SIZE + area.Crood.x, Math.floor(i / AREA_SIZE) + area.Crood.y);
            grid.Floor = 38;
            area.Grids[i] = grid;
        }
        this.Map.Areas[0] = area;
    }
}

export const DataMgr:DataManager = new DataManager();
