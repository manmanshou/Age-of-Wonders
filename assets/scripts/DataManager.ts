
import { _decorator, Node, Vec2 } from 'cc';
import { MapData, MapGenerator } from './MapGenerator';
import { PlayerData } from './Player';

export class DataManager {
    private static _instance:DataManager;
    public static get Instance() {
        if (DataManager._instance == null) {
            DataManager._instance = new DataManager();
        }
        return DataManager._instance;
    }

    public MapData: MapData;

    public PlayerData: PlayerData;

    public newMap() {
        console.log("generate new map...");
        this.MapData = MapGenerator.genMap(new Vec2(3,3), 12, 811);
    }

    public newPlayer() {
        this.PlayerData = PlayerData.New();
    }
}
