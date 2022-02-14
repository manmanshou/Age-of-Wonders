
import { _decorator, Component, Node, Vec2, size } from 'cc';
import { PrimGenerator, RoomWayLocation } from './PrimGenerator';
import { Random } from './Random';
const { ccclass, property } = _decorator;

export const GRID_SIZE: number = 48;        //一个格子边长单位
export const AREA_SIZE_X: number = 10;       //一个区块边的格子数量
export const AREA_SIZE_Y: number = 6;       //一个区块边的格子数量
export const AREA_GRID_COUNT: number = AREA_SIZE_X * AREA_SIZE_Y;
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

    constructor(crood:Vec2) {
        this.Crood = crood; //绝对格子坐标
        this.FogType = FogType.UnExplored;
        this.IsBlock = true;
    }
}

export class RoomWay {
    public Pos:Vec2;                        //房间通道位置
    public Location:RoomWayLocation;        //通道所在方位
}

//地图房间代表地图一个预设的游戏空间
export class Room {
    public StartGrid:Vec2;                  //起始格子坐标
    public Size:Vec2;                       //以格子为单位的尺寸
    public Connect:Array<number>;           //是否与周围房间相连
    public WayOut:Array<RoomWay>;           //出口列表
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

    public getWay(location:RoomWayLocation) {
        for (var i = 0; i < this.WayOut.length; i++) {
            if (this.WayOut[i].Location == location) {
                return this.WayOut[i];
            }
        }
        return null;
    }
}

export class MapAreaData {
    public AreaCrood: Vec2;                 //区域坐标
    public GridCrood: Vec2;                 //格子坐标
    public Grids: GridData[];               //格子数据

    constructor(areaCrood:Vec2) {
        this.AreaCrood = areaCrood;
        this.GridCrood = new Vec2(areaCrood.x * AREA_SIZE_X, areaCrood.y * AREA_SIZE_Y);
        this.Grids = new Array<GridData>(AREA_GRID_COUNT);
    }

    public fillRoomGrids(room:Room) {
        var xStart = this.GridCrood.x > room.StartGrid.x ? this.GridCrood.x : room.StartGrid.x;
        var yStart = this.GridCrood.y > room.StartGrid.y ? this.GridCrood.y : room.StartGrid.y;
        var xEnd = (this.GridCrood.x + AREA_SIZE_X) < (room.StartGrid.x + room.Size.x) ? (this.GridCrood.x + AREA_SIZE_X) : (room.StartGrid.x + room.Size.x);
        var yEnd = (this.GridCrood.y + AREA_SIZE_Y) < (room.StartGrid.y + room.Size.y) ? (this.GridCrood.y + AREA_SIZE_Y) : (room.StartGrid.y + room.Size.y);
        for (var y = yStart; y < yEnd; y++) {
            var areaY = y - this.GridCrood.y;
            var roomY = y - room.StartGrid.y;
            for (var x = xStart; x < xEnd; x++) {
                var areaX = x - this.GridCrood.x;
                var roomX = x - room.StartGrid.x;
                this.Grids[areaY * AREA_SIZE_X + areaX] = room.Grids[roomY * room.Size.x + roomX];
            }
        }
    }

    public isInArea(x:number, y:number) {
        if (x < this.GridCrood.x || x >= this.GridCrood.x + AREA_SIZE_X || y < this.GridCrood.y || y >= this.GridCrood.y) {
            return false;
        }
        return true;
    }

    public isBlock(x:number, y:number) {
        x -= this.GridCrood.x;
        y -= this.GridCrood.y;
        var grid = this.Grids[y * AREA_SIZE_X + x];
        if (grid == undefined) {
            return true;
        }
        return grid.IsBlock;
    }

    public removeBlock(x:number, y:number) {
        x -= this.GridCrood.x;
        y -= this.GridCrood.y;
        var grid = this.Grids[y * AREA_SIZE_X + x];
        if (grid == undefined) {
            grid = new GridData(new Vec2(x + this.GridCrood.x, y + this.GridCrood.y));
            this.Grids[y * AREA_SIZE_X + x] = grid;
        }
        grid.IsBlock = false;
    }

    public initGridsSprite(map:MapData) {
        for (var _y = 0; _y < AREA_SIZE_X; _y++) {
            for (var _x = 0; _x < AREA_SIZE_X; _x++) {
                var grid = this.Grids[_y * AREA_SIZE_X + _x];
                if (grid == undefined) {
                    grid = new GridData(new Vec2(_x + this.GridCrood.x, _y + this.GridCrood.y));
                    this.Grids[_y * AREA_SIZE_X + _x] = grid;
                }
                var isSelfBlock = grid.IsBlock;
                var x = grid.Crood.x; var y = grid.Crood.y + 1;
                var isNorthBlock = this.isInArea(x, y) ? this.isBlock(x, y) : map.isBlock(x, y);
                x = grid.Crood.x; y = grid.Crood.y - 1;
                var isSourthBlock = this.isInArea(x, y) ? this.isBlock(x, y) : map.isBlock(x, y);
                x = grid.Crood.x - 1; y = grid.Crood.y;
                var isWestBlock = this.isInArea(x, y) ? this.isBlock(x, y) : map.isBlock(x, y);
                x = grid.Crood.x + 1; y = grid.Crood.y;
                var isEastBlock = this.isInArea(x, y) ? this.isBlock(x, y) : map.isBlock(x, y);
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
}

export class MapData {
    public IsIndoor: boolean;              //是否为室内
    public Size: Vec2;                     //有X方向和Y方向各有多少个区域
    public Areas: MapAreaData[];           //区域
    public RoomConn: Array<Array<Array<number>>>;   //房间连通关系
    public Rooms: Array<Room>;
    public RandSeed:number;

    public isBlock(x:number, y:number) {
        if (x < 0 || y < 0) {
            return true;
        }
        var areaX = Math.floor(x / AREA_SIZE_X);
        var areaY = Math.floor(y / AREA_SIZE_Y);
        if (areaX < 0 || areaX >= this.Size.x || areaY < 0 || areaY >= this.Size.y) {
            return true;
        }
        var area = this.Areas[areaY * this.Size.x + areaX];
        return area.isBlock(x, y);
    }

    public removeBlock(x:number, y:number) {
        if (x < 0 || y < 0) {
            return true;
        }
        var areaX = Math.floor(x / AREA_SIZE_X);
        var areaY = Math.floor(y / AREA_SIZE_Y);
        if (areaX < 0 || areaX >= this.Size.x || areaY < 0 || areaY >= this.Size.y) {
            return true;
        }
        var area = this.Areas[areaY * this.Size.x + areaX];
        area.removeBlock(x, y);
    }
}

export class MapGenerator {

    public static genMap(countOfRoom:Vec2, roomMaxSize:number, randSeed:number) {
        var mapData = new MapData();
        mapData.IsIndoor = true;
        mapData.RandSeed = randSeed;
        Random.seed(mapData.RandSeed);

        //Prim算法生成房间之间连通关系
        mapData.RoomConn = PrimGenerator.Gen(countOfRoom.y, countOfRoom.x);
        
        var roomMinSize = Math.floor(roomMaxSize / 2) + 1;
        var roomMaxSizeWithSpace = roomMaxSize + 2;
        //生成若干个房间
        mapData.Rooms = new Array<Room>();
        for (var y = 0; y < countOfRoom.y; y++) {
            for (var x = 0; x < countOfRoom.x; x++) {
                var xCount = Random.randomRangeInt(roomMinSize, roomMaxSize);
                var yCount = Random.randomRangeInt(roomMinSize, roomMaxSize);
                var startX = x * roomMaxSizeWithSpace + Random.randomRangeInt(1, roomMaxSize - xCount); //随机摆放，至少留出一行空间便于连接
                var startY = y * roomMaxSizeWithSpace + Random.randomRangeInt(1, roomMaxSize - yCount);
                var crood = new Vec2(startX, startY);
                var size = new Vec2(xCount, yCount);
                var room = MapGenerator.genRoom(crood, size, mapData.RoomConn[y][x], mapData.IsIndoor, false);
                mapData.Rooms.push(room);
            }
        }

        //把各个房间放入地图区块中
        mapData.Size = new Vec2(Math.ceil(countOfRoom.x * roomMaxSizeWithSpace / AREA_SIZE_X), Math.ceil(countOfRoom.y * roomMaxSizeWithSpace / AREA_SIZE_Y));
        mapData.Areas = new Array<MapAreaData>();
        for (var y = 0; y < mapData.Size.y; y++) {
            for (var x = 0; x < mapData.Size.x; x++) {
                var area = new MapAreaData(new Vec2(x, y));
                //遍历房间查找相交的房间并填充
                mapData.Rooms.forEach(room => {
                    if (!((room.StartGrid.x > area.GridCrood.x + AREA_SIZE_X) || (room.StartGrid.y > area.GridCrood.y + AREA_SIZE_Y) 
                    || (area.GridCrood.x > room.StartGrid.x + room.Size.x) || (area.GridCrood.y > room.StartGrid.y + room.Size.y))) {
                        area.fillRoomGrids(room);
                    }
                });
                mapData.Areas.push(area);
            }
        }

        //按照连通关系，连通各个房间
        var allConns = new Map<string, Array<RoomWay>>();
        for (var i = 0; i < mapData.Rooms.length; i++) {
            var room = mapData.Rooms[i];
            for (var loc = 0; loc < room.Connect.length - 1; loc++) {
                if (room.Connect[loc] == 1) {
                    var connRoomIdx = -1;
                    var connLoc;
                    if (loc == RoomWayLocation.East) {
                        connRoomIdx = i + 1;
                        connLoc = RoomWayLocation.West;
                    }else if (loc == RoomWayLocation.West) {
                        connRoomIdx = i - 1;
                        connLoc = RoomWayLocation.East;
                    }else if (loc == RoomWayLocation.North) {
                        connRoomIdx = i + countOfRoom.x;
                        connLoc = RoomWayLocation.South;
                    }else if (loc == RoomWayLocation.South) {
                        connRoomIdx = i - countOfRoom.x;
                        connLoc = RoomWayLocation.North;
                    }
                    if (connRoomIdx >= 0 && connRoomIdx < mapData.Rooms.length) {
                        var key = (i < connRoomIdx) ? i + "-" + connRoomIdx : connRoomIdx + "-" + i;
                        if (!allConns.has(key)) {
                            var way1 = mapData.Rooms[connRoomIdx].getWay(connLoc);
                            var way2 = room.getWay(loc);
                            var arr = [way1, way2];
                            allConns.set(key, arr);                            
                        }
                    }
                }
            }
        }
        
        allConns.forEach((value, key) => {
            var way1 = value[0];
            var way2 = value[1];
            var startX = (way1.Pos.x > way2.Pos.x) ? way2.Pos.x : way1.Pos.x;
            var endX = (way1.Pos.x > way2.Pos.x) ? way1.Pos.x : way2.Pos.x; 
            if (startX > endX) startX = endX;
            var midX = Random.randomRangeInt(startX + 1, endX - 1);
            if (midX < 0) midX = startX + 1;
            var startY = (way1.Pos.y > way2.Pos.y) ? way2.Pos.y: way1.Pos.y;
            var endY = (way1.Pos.y > way2.Pos.y) ? way1.Pos.y : way2.Pos.y;
            if (startY > endY) startY = endY;
            var midY = Random.randomRangeInt(startY + 1, endY - 1);
            if (midY < 0) midY = startY + 1;
            var notNeedFlip = (startX == way1.Pos.x && startY == way1.Pos.y || startX == way2.Pos.x && startY == way2.Pos.y);
            if (way1.Location == RoomWayLocation.East || way1.Location == RoomWayLocation.West) {
                for (var x = startX + 1; x <= midX; x++) {
                    if (notNeedFlip) {
                        mapData.removeBlock(x, startY);
                    }else{
                        mapData.removeBlock(x, endY);
                    } 
                }
                for (var y = startY + 1; y <= endY; y++) {
                    mapData.removeBlock(midX, y);
                }
                for (var x = midX; x <= endX - 1; x++) {
                    if (notNeedFlip) {
                        mapData.removeBlock(x, endY);
                    }else{
                        mapData.removeBlock(x, startY);
                    }
                }
            }else{
                for (var y = startY + 1; y <= midY; y++) {
                    if (notNeedFlip) {
                        mapData.removeBlock(startX, y);
                    }
                    else {
                        mapData.removeBlock(endX, y);    
                    }
                }
                for (var x = startX + 1; x <= endX; x++) {
                    mapData.removeBlock(x, midY);
                }
                for (var y = midY; y <= endY - 1; y++) {
                    if (notNeedFlip) {
                        mapData.removeBlock(endX, y);
                    }
                    else {
                        mapData.removeBlock(startX, y);  
                    }
                }
            }
        });

        //铺设基础图素（墙和空地的地板）
        mapData.Areas.forEach(area => {
            area.initGridsSprite(mapData);
        });

        return mapData;
    }

    //生成房间
    private static genRoom(start:Vec2, size:Vec2, conn:Array<number>, isIndoor:boolean, isNature:boolean) {
        //初始化
        var room = new Room();
        room.StartGrid = start;
        room.Size = size;
        room.Connect = conn;
        room.Grids = new Array<GridData>();
        room.IsNature = isNature;
        room.IsIndoor = isIndoor;
        for (var y = 0; y < size.y; y++) {
            for (var x = 0; x < size.x; x++) {
                var grid = new GridData(new Vec2(x + room.StartGrid.x, y + room.StartGrid.y));
                room.Grids.push(grid);
            }
        }

        if (isNature) { 
            MapGenerator.genNatureRoom(room);
        }else { 
            MapGenerator.genDungeonRoom(room);
        }

        //根据连接关系在四面墙的位置上生成通道
        room.WayOut = new Array();
        if (conn[RoomWayLocation.West] == 1) {
            var y = Random.randomRangeInt(1, size.y - 1);
            var way = new RoomWay();
            way.Location = RoomWayLocation.West;
            way.Pos = new Vec2(room.StartGrid.x, room.StartGrid.y + y);
            room.WayOut.push(way);
            for (var x = 0; x < size.x; x++) {
                var grid = room.Grids[y * size.x + x];
                if (grid.IsBlock) {
                    grid.IsBlock = false;
                }else{
                    break;
                }
            }
        }
        if (conn[RoomWayLocation.East] == 1) {
            var y = Random.randomRangeInt(1, size.y - 1);
            var way = new RoomWay();
            way.Location = RoomWayLocation.East;
            way.Pos = new Vec2(room.StartGrid.x + size.x - 1, room.StartGrid.y + y);
            room.WayOut.push(way);
            for (var x = size.x - 1; x >= 0; x--) {
                var grid = room.Grids[y * size.x + x];
                if (grid.IsBlock) {
                    grid.IsBlock = false;
                }else{
                    break;
                }
            }
        }
        if (conn[RoomWayLocation.North] == 1) {
            var x = Random.randomRangeInt(1, size.x - 1);
            var way = new RoomWay();
            way.Location = RoomWayLocation.North;
            way.Pos = new Vec2(room.StartGrid.x + x, room.StartGrid.y + size.y - 1);
            room.WayOut.push(way);
            for (var y = size.y - 1; y >= 0; y--) {
                var grid = room.Grids[y * size.x + x];
                if (grid.IsBlock) {
                    grid.IsBlock = false;
                }else{
                    break;
                }
            }
        }
        if (conn[RoomWayLocation.South] == 1) {
            var x = Random.randomRangeInt(1, size.x - 1);
            var way = new RoomWay();
            way.Location = RoomWayLocation.South;
            way.Pos = new Vec2(room.StartGrid.x + x, room.StartGrid.y);
            room.WayOut.push(way);
            for (var y = 0; y < size.y; y++) {
                var grid = room.Grids[y * size.x + x];
                if (grid.IsBlock) {
                    grid.IsBlock = false;
                }else{
                    break;
                }
            }
        }
        return room;
    }

    //自然风格的随机阻挡的房间
    private static genNatureRoom(room:Room) {
        var size = room.Size;
        //随机填充
        for (var y = 0; y < size.y; y++) {
            for (var x = 0; x < size.x; x++) {
                var grid = room.Grids[y * size.x + x];
                var size = room.Size;
                if (x == 0 || x == size.x - 1 || y == 0 || y == size.y - 1) {
                    grid.IsBlock = true;
                }else {
                    var isBlock = Random.randomRangeInt(0, 100) < 50;
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
                    if (wallCount > 5) {
                        grid.IsBlock = true;
                    }else {
                        if (!(x == 0 || x == size.x - 1 || y == 0 || y == size.y - 1)) { //外围墙壁不要挖掉
                            grid.IsBlock = false;
                        }
                    }
                }
            }
        }
    }

    //地下城风格，规则的房间
    private static genDungeonRoom(room:Room) {
        var size = room.Size;
        for (var y = 0; y < size.y; y++) {
            for (var x = 0; x < size.x; x++) {
                var grid = room.Grids[y * size.x + x];
                if (x == 0 || x == size.x - 1 || y == 0 || y == size.y - 1) {
                    grid.IsBlock = true;
                }else {
                    grid.IsBlock = false;
                }
            }
        }
    }
}

