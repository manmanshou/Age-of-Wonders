
import { _decorator, Component, Node, random, Vec2 } from 'cc';
import { Random } from './Random';

const { ccclass, property } = _decorator;

//房间通往外部的通路所在房间的哪个方向
export enum RoomWayLocation {
    West, East, North, South, Num,
}

const ROOM_SIGN_IDX:number = RoomWayLocation.Num;

export class PrimGenerator {
    public static Gen(rowCount:number, colCount:number) {
        var mazeData = new Array(rowCount);
        for (var i = 0; i < rowCount; i++) {
            mazeData[i] = new Array(colCount);
            for (var j = 0; j < colCount; j++) {
                mazeData[i][j] = new Array<number>(RoomWayLocation.Num + 1);
                for (var k = 0; k < mazeData[i][j].length; k++) {
                    mazeData[i][j][k] = 0;
                }
            }
        }

        var startRow = Random.randomRangeInt(0, rowCount);
        var startCol = Random.randomRangeInt(0, colCount);
        var waitProcRooms = new Array<Vec2>(); 
        waitProcRooms.push(new Vec2(startRow, startCol));
        var check = new Array<RoomWayLocation>(RoomWayLocation.Num);
        while (waitProcRooms.length > 0) {
            var i = Random.randomRangeInt(0, waitProcRooms.length);
            var r = waitProcRooms[i].x;
            var c = waitProcRooms[i].y;

            mazeData[r][c][ROOM_SIGN_IDX] = 1; //该房间被访问

            var lastIdx = waitProcRooms.length - 1;
            waitProcRooms[i] = waitProcRooms[lastIdx];
            waitProcRooms.length--;

            //西边
            if (c > 0) {
                if (mazeData[r][c - 1][ROOM_SIGN_IDX] == 1) {
                    check.push(RoomWayLocation.West);
                } else if (mazeData[r][c - 1][ROOM_SIGN_IDX] == 0) {
                    waitProcRooms.push(new Vec2(r, c - 1));
                    mazeData[r][c - 1][ROOM_SIGN_IDX] = 2;
                }
            }

            //北边
            if (r < rowCount - 1) {
                if (mazeData[r + 1][c][ROOM_SIGN_IDX] == 1) {
                    check.push(RoomWayLocation.North);
                } else if (mazeData[r + 1][c][ROOM_SIGN_IDX] == 0) {
                    waitProcRooms.push(new Vec2(r + 1, c));
                    mazeData[r + 1][c][ROOM_SIGN_IDX] = 2;
                }
            }

            //东边
            if (c < colCount - 1) {
                if (mazeData[r][c + 1][ROOM_SIGN_IDX] == 1) {
                    check.push(RoomWayLocation.East);
                } else if (mazeData[r][c + 1][ROOM_SIGN_IDX] == 0) {
                    waitProcRooms.push(new Vec2(r, c + 1));
                    mazeData[r][c + 1][ROOM_SIGN_IDX] = 2;
                }
            }

            //南边
            if (r > 0) {
                if (mazeData[r - 1][c][ROOM_SIGN_IDX] == 1) {
                    check.push(RoomWayLocation.South);
                } else if (mazeData[r - 1][c][ROOM_SIGN_IDX] == 0) {
                    waitProcRooms.push(new Vec2(r - 1, c));
                    mazeData[r - 1][c][ROOM_SIGN_IDX] = 2;
                }
            }

            if (check.length > 0) {
                var move_dir = check[Random.randomRangeInt(0, check.length)];
                if (move_dir == RoomWayLocation.West) {
                    mazeData[r][c][RoomWayLocation.West] = 1;
                    mazeData[r][c - 1][RoomWayLocation.East] = 1;
                }
                else if (move_dir == RoomWayLocation.East){
                    mazeData[r][c][RoomWayLocation.East] = 1;
                    mazeData[r][c + 1][RoomWayLocation.West] = 1;
                }
                else if (move_dir == RoomWayLocation.North){
                    mazeData[r][c][RoomWayLocation.North] = 1;
                    mazeData[r + 1][c][RoomWayLocation.South] = 1;
                }
                else if (move_dir == RoomWayLocation.South){
                    mazeData[r][c][RoomWayLocation.South] = 1;
                    mazeData[r - 1][c][RoomWayLocation.North] = 1;
                }
            }

            check.length = 0;
        }

        return mazeData;
    }
}

