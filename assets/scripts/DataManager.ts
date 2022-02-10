
import { _decorator, Component, Node, Vec2, math, size } from 'cc';
import { PrimGenerator, RoomWayLocation } from './PrimGenerator';
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
    public Crood:Vec2;                      //所在格子绝对坐标
    
    public Floor:number;                    //地板图素ID，地板图素在最底层
    public FloorOverlay:number;             //地板覆盖物图素ID，覆盖物图素叠在地板图素上
    public Object:number;                   //地上物体图素ID，叠在覆盖物之上
    
    public FogType:FogType;                 //覆盖雾的类型，雾叠在墙图素之上
    public IsBlock:boolean;                 //是否为阻挡
    public Trigger:number;                  //触发类型
}

export class RoomWay {
    public Pos:Vec2;
    public Location:RoomWayLocation;
}

//地图房间代表地图一个预设的游戏空间
export class Room {
    public StartGrid:Vec2;                  //起始格子坐标
    public Size:Vec2;                       //以格子为单位的尺寸
    public Ways:RoomWay[];                  //通道所在方位列表
    public Grids:Array<GridData>;           //所有房间的格子预设数据
    public SpaceCount:number;               //没有阻挡的格子数量，代表活动空间数量
    public IsNature:boolean;                //是否是自然风格
    public IsIndoor:boolean;                //是否是室内风格

    public isBlock(x:number, y:number) {
        if (x < 0 || x >= this.Size.x || y < 0 || y >= this.Size.y) {
            return true;
        }
        return this.Grids[y * this.Size.x + x].IsBlock;
    }
}

export class MapAreaData {
    public AreaCrood: Vec2;                 //区域坐标
    public GridCrood: Vec2;                 //格子坐标
    public Grids: GridData[];               //格子数据

    constructor(areaCrood:Vec2) {
        this.AreaCrood = areaCrood;
        this.GridCrood = new Vec2(areaCrood.x * AREA_SIZE, areaCrood.y * AREA_SIZE);
        this.Grids = new Array<GridData>(AREA_GRID_COUNT);
    }

    public fillRoomGrids(room:Room) {
        //console.log("fill room", room, "Area", this.AreaCrood);
        var xStart = this.GridCrood.x > room.StartGrid.x ? this.GridCrood.x : room.StartGrid.x;
        var yStart = this.GridCrood.y > room.StartGrid.y ? this.GridCrood.y : room.StartGrid.y;
        var xEnd = (this.GridCrood.x + AREA_SIZE) < (room.StartGrid.x + room.Size.x) ? (this.GridCrood.x + AREA_SIZE) : (room.StartGrid.x + room.Size.x);
        var yEnd = (this.GridCrood.y + AREA_SIZE) < (room.StartGrid.y + room.Size.y) ? (this.GridCrood.y + AREA_SIZE) : (room.StartGrid.y + room.Size.y);
        for (var y = yStart; y < yEnd; y++) {
            var areaY = y - this.GridCrood.y;
            var roomY = y - room.StartGrid.y;
            for (var x = xStart; x < xEnd; x++) {
                var areaX = x - this.GridCrood.x;
                var roomX = x - room.StartGrid.x;
                this.Grids[areaY * AREA_SIZE + areaX] = room.Grids[roomY * room.Size.x + roomX];
            }
        }
    }
}

export class MapData {
    public IsIndoor: boolean;              //是否为室内
    public Size: Vec2;                     //有X方向和Y方向各有多少个区域
    public Areas: MapAreaData[];           //区域
}

export class DataManager {
    public Map: MapData;

    public genMap(sizeOfRoom:Vec2) {
        this.Map = new MapData();
        this.Map.IsIndoor = true;
        //Prim算法生成房间之间连通关系
        var mazData = PrimGenerator.Gen(sizeOfRoom.y, sizeOfRoom.x);
        //生成若干个房间
        var xMax = 0; //x方向上最大的格子数
        var yMax = 0; //y方向上最大的格子数
        var rooms = new Array<Room>();
        for (var y = 0; y < sizeOfRoom.y; y++) {
            var colX = 0;
            var colY = 0;
            for (var x = 0; x < sizeOfRoom.x; x++) {
                var xCount = math.randomRangeInt(5, 10);
                var yCount = math.randomRangeInt(5, 10);
                if (yCount > colY) {
                    colY = yCount;
                }
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
                var room = this.genRoom(new Vec2(colX, yMax), new Vec2(xCount, yCount), wayLocations, this.Map.IsIndoor, true);
                rooms.push(room);
                colX += xCount;
            }
            if (colX > xMax) {
                xMax = colX;
            }
            yMax += colY;
        }
        
        // rooms.forEach(room => {
        //     console.log("room", room.Size, room.StartGrid, room.Grids);
        // });

        //把各个房间放入地图区块中
        this.Map.Size = new Vec2(Math.ceil(xMax / AREA_SIZE), Math.ceil(yMax / AREA_SIZE));
        this.Map.Areas = new Array<MapAreaData>();
        for (var y = 0; y < this.Map.Size.y; y++) {
            for (var x = 0; x < this.Map.Size.x; x++) {
                var area = new MapAreaData(new Vec2(x, y));
                //遍历房间查找相交的房间并填充
                rooms.forEach(room => {
                    if (!((room.StartGrid.x > area.GridCrood.x + AREA_SIZE) || (room.StartGrid.y > area.GridCrood.y + AREA_SIZE) 
                    || (area.GridCrood.x > room.StartGrid.x + room.Size.x) || (area.GridCrood.y > room.StartGrid.y + room.Size.y))) {
                        area.fillRoomGrids(room);
                    }
                });
                this.Map.Areas.push(area);
            }
        }
        //console.log("map gen complete, size=", this.Map.Size, xMax, yMax);
    }

    //生成房间
    private genRoom(start:Vec2, size:Vec2, wayLocation:RoomWayLocation[], isIndoor:boolean, isNature:boolean) {
        //初始化
        var room = new Room();
        room.StartGrid = start;
        room.Size = size;
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
                grid.Crood = new Vec2(x + room.StartGrid.x, y + room.StartGrid.y);
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
                    var isBlock = math.randomRangeInt(0, 100) < 50;
                    grid.IsBlock = isBlock;
                }
            }
        }
        //平滑
        for (var smooth = 0; smooth < 1; smooth++) {
            for (var y = 0; y < size.y; y++) {
                for (var x = 0; x < size.x; x++) {
                    var wallCount = 0;
                    for (var neighourY = y - 1; neighourY <= y + 1; neighourY++) {
                        for (var neighourX = x - 1; neighourX <= x + 1; neighourX++) {
                            if (neighourX >= 0 && neighourX < size.x && neighourY >= 0 && neighourY < size.y) {
                                if (neighourX != x || neighourY != y) {
                                    wallCount += (room.Grids[neighourY * size.x + neighourX].IsBlock ? 1 : 0);
                                }
                            }else {
                                wallCount++;
                            }
                        }
                    }
                    var grid = room.Grids[y * size.x + x];
                    if (wallCount > 4) {
                        grid.IsBlock = true;
                    }else {
                        grid.IsBlock = false;
                    }
                }
            }
        }
        //铺设图素
        for (var y = 0; y < size.y; y++) {
            for (var x = 0; x < size.x; x++) {
                var grid = room.Grids[y * size.x + x];
                var isSelfBlock = grid.IsBlock;
                var isNorthBlock = room.isBlock(x, y + 1);
                var isSourthBlock = room.isBlock(x, y - 1);
                var isWestBlock = room.isBlock(x - 1, y);
                var isEastBlock = room.isBlock(x + 1, y);
                if (isSelfBlock) {
                    if (isNorthBlock && isSourthBlock && isWestBlock && isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_ESWN;
                    }else if (isNorthBlock && !isSourthBlock && !isWestBlock && !isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_N;
                    }else if (!isNorthBlock && isSourthBlock && !isWestBlock && !isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_S;
                    }else if (!isNorthBlock && !isSourthBlock && isWestBlock && !isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_W;
                    }else if (!isNorthBlock && !isSourthBlock && !isWestBlock && isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_E;
                    }else if (isNorthBlock && isSourthBlock && !isWestBlock && !isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_SN;
                    }else if (isNorthBlock && !isSourthBlock && isWestBlock && !isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_WN;
                    }else if (isNorthBlock && !isSourthBlock && !isWestBlock && isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_EN;
                    }else if (!isNorthBlock && isSourthBlock && isWestBlock && !isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_SW;
                    }else if (!isNorthBlock && isSourthBlock && !isWestBlock && isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_ES;
                    }else if (!isNorthBlock && !isSourthBlock && isWestBlock && isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_EW;
                    }else if (isNorthBlock && isSourthBlock && isWestBlock && !isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_SWN;
                    }else if (!isNorthBlock && isSourthBlock && isWestBlock && isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_ESW;
                    }else if (isNorthBlock && !isSourthBlock && isWestBlock && isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_EWN;
                    }else if (isNorthBlock && isSourthBlock && !isWestBlock && isEastBlock) {
                        grid.Object = WorldSprDefine.Wall_ESN;
                    }else{
                        grid.Object = WorldSprDefine.IndepWall;
                    }
                }else{
                    grid.Floor = WorldSprDefine.Floor1;
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
                wayPos = new Vec2(size.x - 1, math.randomRangeInt(1, size.y - 1));
            } else if (location == RoomWayLocation.North) {
                wayPos = new Vec2(math.randomRangeInt(1, size.x - 1), size.y - 1);
            } else if (location == RoomWayLocation.South) {
                wayPos = new Vec2(math.randomRangeInt(1, size.x - 1), 0);
            } else {
                wayPos = new Vec2(0, math.randomRangeInt(1, size.y - 1));
            }
            room.Ways[i].Pos = wayPos;
            var grid = room.Grids[wayPos.x + wayPos.y * size.x];
            grid.IsBlock = false;
            grid.Object = WorldSprDefine.None;
            grid.Floor = WorldSprDefine.Floor1;
        }
    }

}

export const DataMgr:DataManager = new DataManager();
