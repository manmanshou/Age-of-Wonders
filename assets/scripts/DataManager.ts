
import { _decorator, Component, Node, Vec2, math } from 'cc';
import { PrimGenerator } from './PrimGenerator';
const { ccclass, property } = _decorator;

export const GRID_SIZE: number = 48;       //一个格子边长单位
export const AREA_SIZE: number = 4;       //一个区块边的格子数量
export const AREA_GRID_COUNT: number = AREA_SIZE * AREA_SIZE;
export const VIEW_AREA_SIDE: number = 3;   //相机可见范围单边的区域数量
export const VIEW_AREA_COUNT: number = VIEW_AREA_SIDE * VIEW_AREA_SIDE;   //相机可见范围单边的区域数量

enum WorldSprDefine {
    None,
    Pillar1,            //柱子
    PillarCrack1,       //破碎的柱子
    PillarCrack2,       //更加破碎的柱子
    Floor1,             //普通地板
    Floor2,             //地板带装饰
    FloorCrack1,        //破碎的地板
    Floor3,             //地板带装饰
    UpStair,            //向上的楼梯
    DownStair,          //向下的楼梯
    IndepWall,          //独立的墙，不连接任何其他墙
    
    Wall_E,             //连接东边的墙
    Wall_EW,            //连接东西的墙
    Wall_W,             //连接西边的墙
    Wall_S,             //连接南边的墙
    Wall_SN,            //连接南北的墙
    Wall_N,             //连接北边的墙
    Wall_ES,            //连接东南的转角墙
    Wall_SW,            //连接西南的转角墙
    Wall_EN,            //连接东北的转角墙
    Wall_WN,            //连接西北的转角墙
    Wall_ESWN,          //东南西北全连接的墙
    Wall_ESW,           //连接东南西的墙
    Wall_SWN,           //连接南西北的墙
    Wall_ESN,           //连接东南北的墙
    Wall_EWN,           //连接东西北的墙
    Wall_SN_Crack,      //连接南北的破碎墙
    Wall_EW_Crack,      //连接东西的破碎墙
}

export enum FogType {
    None,           //当前视野范围内没有雾
    Explored,       //没有在当前视野范围内，且已探索
    UnExplored,     //没有在当前视野范围内，且未探索
}

export class GridData {
    public Crood:Vec2;                      //所在格子坐标
    
    public Floor:number;                    //地板图素ID，地板图素在最底层
    public FloorOverlay:number;             //地板覆盖物图素ID，覆盖物图素叠在地板图素上
    public Object:number;                   //地上物体图素ID，叠在覆盖物之上
    
    public FogType:FogType;                 //覆盖雾的类型，雾叠在墙图素之上
    public IsBlock:boolean;                 //是否为阻挡
    public Trigger:number;                  //触发类型
}

//房间通往外部的通路所在房间的哪个方向
export enum RoomWayLocation {
    West, East, North, South, Num,
}

export class RoomWay {
    public Pos:Vec2;
    public Location:RoomWayLocation;
}

//地图房间代表地图一个预设的游戏空间
export class Room {
    public Size:Vec2;                       //以格子为单位的尺寸，没有起始坐标是因为起始固定从0，0格子开始
    public Ways:RoomWay[];                  //通道所在方位列表
    public Grids:Array<GridData>;           //所有房间的格子预设数据
    public SpaceCount:number;               //没有阻挡的格子数量，代表活动空间数量
    public IsNature:boolean;                //是否是自然风格
    public IsIndoor:boolean;                //是否是室内风格
}

export class MapAreaData {
    public Crood: Vec2;                    //格子坐标
    public Grids: GridData[];
}

export class MapData {
    public IsIndoor: boolean;              //是否为室内
    public Size: Vec2;                     //有X方向和Y方向各有多少个区域
    public Areas: MapAreaData[];           //区域
}

export class DataManager {
    public Map: MapData;

    public genTestMap() {
        this.Map = new MapData();
        this.Map.Size = new Vec2(1,1);
        this.Map.Areas = new Array(1);
        var area = new MapAreaData();
        area.Crood = new Vec2();
        area.Grids = new Array(AREA_GRID_COUNT);
        for (var i = 0; i < AREA_GRID_COUNT; i++) {
            var grid = new GridData();
            grid.Crood = new Vec2(i % AREA_SIZE + area.Crood.x, Math.floor(i / AREA_SIZE) + area.Crood.y);
            grid.Floor = 4;
            area.Grids[i] = grid;
        }
        this.Map.Areas[0] = area;
    }

    public genMap(sizeOfRoom:Vec2) {
        this.Map = new MapData();
        this.Map.Size = new Vec2(1,1);
        this.Map.IsIndoor = true;
        //Prim算法生成房间之间连通关系
        var mazData = PrimGenerator.Gen(sizeOfRoom.y, sizeOfRoom.x);
        //生成若干个房间
        var rooms = new Array<Room>();
        for (var y = 0; y < sizeOfRoom.y - 1; y++) {
            for (var x = 0; x < sizeOfRoom.x - 1; x++) {
                var xCount = math.randomRange(5, 10);
                var yCount = math.randomRange(5, 10);
                var wayLocations = new Array<RoomWayLocation>();
                if (mazData[x][y][RoomWayLocation.East] == 1) {
                    wayLocations.push(RoomWayLocation.East);
                }
                if (mazData[x][y][RoomWayLocation.West] == 1) {
                    wayLocations.push(RoomWayLocation.West);
                }
                if (mazData[x][y][RoomWayLocation.North] == 1) {
                    wayLocations.push(RoomWayLocation.North);
                }
                if (mazData[x][y][RoomWayLocation.South] == 1) {
                    wayLocations.push(RoomWayLocation.South);
                }
                var room = this.genRoom(new Vec2(xCount, yCount), wayLocations, this.Map.IsIndoor, false);
                rooms.push(room);
            }
        }
        //把各个房间放入地图中并生成通道把他们连起来
    }

    //自然风格的随机阻挡的房间
    private genNatureRoom(room:Room) {
        var size = room.Size;
        //随机填充
        for (var y = 0; y < size.y; y++) {
            for (var x = 0; x < size.x; x++) {
                var grid = room.Grids[y * size.x + x];
                var size = room.Size;
                if (x == 0 || x == size.x - 1 || y == 0 || y == size.y - 1) {
                    grid.IsBlock = true;
                }else {
                    var isBlock = math.randomRange(0, 100) < 50;
                    grid.IsBlock = isBlock;
                }
            }
        }
        //平滑
        for (var smooth = 0; smooth < 5; smooth++) {
            for (var y = 0; y < size.y; y++) {
                for (var x = 0; x < size.x; x++) {
                    var wallCount = 0;
                    for (var neighourY = y - 1; neighourY < y + 1; neighourY++) {
                        for (var neighourX = x - 1; neighourX < x + 1; neighourX++) {
                            
                        }
                    }
                }
            }
        }
    }

    //地下城风格，规则的房间
    private genDungeonRoom(room:Room) {
        var size = room.Size;
        for (var y = 0; y < size.y; y++) {
            for (var x = 0; x < size.x; x++) {
                var grid = room.Grids[y * size.x + x];
                if (x == 0 || x == size.x - 1 || y == 0 || y == size.y - 1) {
                    grid.IsBlock = true;
                    if (x == 0 && y == 0) {
                        grid.Object = WorldSprDefine.Wall_EN;
                    }else if (x == 0 && y == size.y - 1) {
                        grid.Object = WorldSprDefine.Wall_ES;
                    }else if (x == size.x - 1 && y == 0) {
                        grid.Object = WorldSprDefine.Wall_WN;
                    }else if (x == size.x - 1 && y == size.y - 1) {
                        grid.Object = WorldSprDefine.Wall_SW;
                    }else if (x == 0 || x == size.x - 1) {
                        grid.Object = WorldSprDefine.Wall_SN;
                    }else if (y == 0 || y == size.y - 1) {
                        grid.Object = WorldSprDefine.Wall_EW;
                    }
                }else {
                    grid.IsBlock = false;
                    grid.Floor = WorldSprDefine.Floor1;
                }
            }
        }

        //处理通路
        for (var i = 0; i < room.Ways.length; i++) {
            var location = room.Ways[i].Location;
            var wayPos: Vec2;
            if (location == RoomWayLocation.East) {
                wayPos = new Vec2(size.x - 1, math.randomRange(1, size.y - 1));
            } else if (location == RoomWayLocation.North) {
                wayPos = new Vec2(math.randomRange(1, size.x - 1), size.y - 1);
            } else if (location == RoomWayLocation.South) {
                wayPos = new Vec2(math.randomRange(1, size.x - 1), 0);
            } else {
                wayPos = new Vec2(0, math.randomRange(1, size.y - 1));
            }
            room.Ways[i].Pos = wayPos;
            var grid = room.Grids[wayPos.x + wayPos.y * size.x];
            grid.IsBlock = false;
            grid.Object = WorldSprDefine.None;
            grid.Floor = WorldSprDefine.Floor1;
        }
    }

    //生成房间
    private genRoom(size:Vec2, wayLocation:RoomWayLocation[], isIndoor:boolean, isNature:boolean) {
        //初始化
        var room = new Room();
        room.Size = size.clone();
        room.Grids = new Array<GridData>();
        room.IsNature = isNature;
        room.IsIndoor = isIndoor;
        room.Ways = new Array<RoomWay>();
        for (var i = 0; i < wayLocation.length; i++) {
            var way = new RoomWay();
            way.Location = wayLocation[i];
        }
        for (var y = 0; y < size.y; y++) {
            for (var x = 0; x < size.x; x++) {
                var grid = new GridData();
                grid.Crood = new Vec2(x, y); //内部格子坐标
                grid.FogType = FogType.UnExplored;
                grid.IsBlock = true;
                room.Grids.push(grid);
            }
        }

        if (isNature) { 
            this.genNatureRoom(room);
        }else { 
            this.genDungeonRoom(room);
        }

        return room;
    }
}

export const DataMgr:DataManager = new DataManager();
