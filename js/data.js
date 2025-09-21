// Options used to draw the graph.
var options = {
	"produce": 0,
    "equipment": 0,
    "sellRaw": false,
    "sellExcess": false,
    "aging": 0,
	"planted": 1,
    "maxSeedMoney": 0,
	"days": 28,
	"fertilizer": 2,
	"level": 0,
	"season": 4,
	"buySeed": false,
    "replant": false,
    "nextyear": false,
	"buyFert": false,
	"average": 0,
    "roiSymmetric": true,
    "roiCostMode": 0,
    "sortMode": 0,
    "fertilizer": 2,
    "fertilizerSource": 0,
	"seeds": {
		"pierre": true,
		"joja": true,
		"special": true
	},
	"skills": {
		"till": false,
		"agri": false,
		"arti": false,
        "gatherer": false,
        "botanist": false
	},
	"foodIndex": 0,
	"foodLevel": 0,
	"extra": false,
	"disableLinks": false
};

// Different fertilizers with their stats.
var fertilizers = [
	{
		"name": "无",
		"ratio": 0,
		"growth": 1,
		"cost": 0
	},
	{
		"name": "初级肥料",
		"ratio": 1,
		"growth": 1,
		"cost": 100
	},
	{
		"name": "高级肥料",
		"ratio": 2,
		"growth": 1,
		"cost": 150
	},
	{
		"name": "生长激素",
		"ratio": 0,
		"growth": 0.9,
		"cost": 100
	},
	{
		"name": "高级生长激素",
		"ratio": 0,
		"growth": 0.75,
		"cost": 150,
		"alternate_cost": 80
	},
	{
		"name": "顶级肥料",
		"ratio": 3,
		"growth": 1,
		"cost": 0
	},
	{
		"name": "顶级生长激素",
		"ratio": 0,
		"growth": 0.67,
		"cost": 0
	}
];

// Different seasons with predefined crops.
var seasons = [
	{
		"name": "春季",
		"duration": 28,
		"crops": [
			crops.coffeebean,
			crops.strawberry,
			crops.rhubarb,
			crops.potato,
			crops.cauliflower,
			crops.greenbean,
			crops.tealeaves,
			crops.kale,
			crops.unmilledrice,
			crops.garlic,
			crops.parsnip,
			crops.bluejazz,
			crops.tulip,
			crops.ancientfruit,
			crops.springseeds,
			crops.carrot
		]
	},
	{
		"name": "夏季",
		"duration": 28,
		"crops": [
			crops.pineapple,
			crops.blueberry,
			crops.starfruit,
			crops.redcabbage,
			crops.hops,
			crops.melon,
			crops.hotpepper,
			crops.tealeaves,
			crops.tomato,
			crops.radish,
			crops.summerspangle,
			crops.poppy,
			crops.wheat,
			crops.corn,
			crops.coffeebean,
			crops.sunflower,
			crops.ancientfruit,
			crops.taroroot,
			crops.summerseeds,
			crops.summersquash
		]
	},
	{
		"name": "秋季",
		"duration": 28,
		"crops": [
			crops.sweetgemberry,
			crops.cranberries,
			crops.pumpkin,
			crops.grape,
			crops.artichoke,
			crops.beet,
			crops.eggplant,
			crops.amaranth,
			crops.yam,
			crops.tealeaves,
			crops.fairyrose,
			crops.bokchoy,
			crops.sunflower,
			crops.wheat,
			crops.corn,
			crops.ancientfruit,
			crops.fallseeds,
			crops.broccoli
		]
	},
	{
		"name": "冬季",
		"duration": 28,
		"crops": [
			crops.winterseeds,
			crops.powdermelon
		]
	},
	{
		"name": "温室",
		"duration": 112,
		"crops": [
			crops.pineapple,
			crops.coffeebean,
			crops.strawberry,
			crops.rhubarb,
			crops.potato,
			crops.cauliflower,
			crops.greenbean,
			crops.kale,
			crops.unmilledrice,
			crops.garlic,
			crops.parsnip,
			crops.bluejazz,
			crops.tulip,
			crops.blueberry,
			crops.starfruit,
			crops.redcabbage,
			crops.hops,
			crops.melon,
			crops.hotpepper,
			crops.tomato,
			crops.radish,
			crops.summerspangle,
			crops.poppy,
			crops.wheat,
			crops.corn,
			crops.sweetgemberry,
			crops.cranberries,
			crops.pumpkin,
			crops.grape,
			crops.tealeaves,
			crops.artichoke,
			crops.beet,
			crops.eggplant,
			crops.amaranth,
			crops.yam,
			crops.fairyrose,
			crops.bokchoy,
			crops.sunflower,
			crops.ancientfruit,
			crops.cactusfruit,
			crops.taroroot,
			crops.carrot,
			crops.summersquash,
			crops.broccoli,
			crops.powdermelon
		]
	}
];
