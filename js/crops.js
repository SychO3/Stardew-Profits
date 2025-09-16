/*
 * All data gathered from a modified version of polarstoat/stardew-crop-data
 */

// Crop List
var crops = {
  "carrot": {
    "name": "胡萝卜",
    "url": "https://stardewvalleywiki.com/Carrot",
    "img": "carrot.png",
    "seeds": {
      "sell": 15,
      "pierre": 0,
      "joja": 0,
      "special": 0,
      "specialLoc": "无法购买",
      "specialUrl": "https://stardewvalleywiki.com/Carrot_Seeds"
    },
    "growth": {
      "initial": 3,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 35,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "summersquash": {
    "name": "金皮西葫芦",
    "url": "https://stardewvalleywiki.com/Summer_Squash",
    "img": "summersquash.png",
    "seeds": {
      "sell": 20,
      "pierre": 0,
      "joja": 0,
      "special": 0,
      "specialLoc": "无法购买",
      "specialUrl": "https://stardewvalleywiki.com/Summer_Squash_Seeds"
    },
    "growth": {
      "initial": 6,
      "regrow": 3
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 45,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "broccoli": {
    "name": "西蓝花",
    "url": "https://stardewvalleywiki.com/Broccoli",
    "img": "broccoli.png",
    "seeds": {
      "sell": 40,
      "pierre": 0,
      "joja": 0,
      "special": 0,
      "specialLoc": "无法购买",
      "specialUrl": "https://stardewvalleywiki.com/Broccoli_Seeds"
    },
    "growth": {
      "initial": 8,
      "regrow": 4
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 70,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "powdermelon": {
    "name": "霜瓜",
    "url": "https://stardewvalleywiki.com/Powdermelon",
    "img": "powdermelon.png",
    "seeds": {
      "sell": 20,
      "pierre": 0,
      "joja": 0,
      "special": 0,
      "specialLoc": "无法购买",
      "specialUrl": "https://stardewvalleywiki.com/Powdermelon_Seeds"
    },
    "growth": {
      "initial": 7,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 70,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "amaranth": {
    "name": "苋菜",
    "url": "http://stardewvalleywiki.com/Amaranth",
    "img": "amaranth.png",
    "seeds": {
      "sell": 35,
      "pierre": 70,
      "joja": 87,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 7,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 150,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "grape": {
    "name": "葡萄",
    "url": "http://stardewvalleywiki.com/Grape",
    "img": "grape.png",
    "seeds": {
      "sell": 30,
      "pierre": 60,
      "joja": 75,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 10,
      "regrow": 3
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 80,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "葡萄干"
    }
  },
  "hops": {
    "name": "啤酒花",
    "url": "http://stardewvalleywiki.com/Hops",
    "img": "hops.png",
    "seeds": {
      "sell": 30,
      "pierre": 60,
      "joja": 75,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 11,
      "regrow": 1
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 25,
      "keg": 300,
      "jarType": "腌菜",
      "kegType": "淡啤酒"
    }
  },
  "pineapple": {
    "name": "菠萝",
    "url": "http://stardewvalleywiki.com/Pineapple",
    "img": "pineapple.png",
    "seeds": {
      "sell": 240,
      "pierre": 0,
      "joja": 0,
      "special": 400,
      "specialLoc": "岛上商人",
      "specialUrl": "http://stardewvalleywiki.com/Island_Trader"
    },
    "growth": {
      "initial": 14,
      "regrow": 7
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 300,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "sweetgemberry": {
    "name": "宝石甜莓",
    "url": "http://stardewvalleywiki.com/Sweet_Gem_Berry",
    "img": "sweetgemberry.png",
    "seeds": {
      "sell": 200,
      "pierre": 0,
      "joja": 0,
      "special": 1000,
      "specialLoc": "流动商人",
      "specialUrl": "http://stardewvalleywiki.com/Travelling_Cart"
    },
    "growth": {
      "initial": 24,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 3000
    }
  },
  "tealeaves": {
    "name": "茶叶",
    "url": "http://stardewvalleywiki.com/Tea_Leaves",
    "img": "tealeaves.png",
    "seeds": {
      "sell": 0,
      "pierre": 0,
      "joja": 0,
      "special": 2500,
      "specialLoc": "流动商人",
      "specialUrl": "http://stardewvalleywiki.com/Travelling_Cart"
    },
    "growth": {
      "initial": 20,
      "regrow": 1
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 50,
      "keg": 100,
      "jarType": "腌菜",
      "kegType": "茶"
    }
  },
  "fairyrose": {
    "name": "仙女玫瑰",
    "url": "http://stardewvalleywiki.com/Fairy_Rose",
    "img": "fairyrose.png",
    "seeds": {
      "sell": 100,
      "pierre": 200,
      "joja": 250,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 12,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 290
    }
  },
  "tulip": {
    "name": "郁金香",
    "url": "http://stardewvalleywiki.com/Tulip",
    "img": "tulip.png",
    "seeds": {
      "sell": 10,
      "pierre": 20,
      "joja": 25,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 6,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 30
    }
  },
  "bluejazz": {
    "name": "蓝爵",
    "url": "http://stardewvalleywiki.com/Blue_Jazz",
    "img": "bluejazz.png",
    "seeds": {
      "sell": 15,
      "pierre": 30,
      "joja": 37,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 7,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 50
    }
  },
  "sunflower": {
    "name": "向日葵",
    "url": "http://stardewvalleywiki.com/Sunflower",
    "img": "sunflower.png",
    "seeds": {
      "sell": 20,
      "pierre": 200,
      "joja": 125,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 8,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 80
    }
  },
  "coffeebean": {
    "name": "咖啡豆",
    "url": "http://stardewvalleywiki.com/Coffee_Bean",
    "img": "coffeebean.png",
    "seeds": {
      "sell": 0,
      "pierre": 0,
      "joja": 0,
      "special": 2500,
      "specialLoc": "流动商人",
      "specialUrl": "http://stardewvalleywiki.com/Travelling_Cart"
    },
    "growth": {
      "initial": 10,
      "regrow": 2
    },
    "produce": {
      "extra": 3,
      "extraPerc": 1,
      "price": 15,
      "keg": 150 / 5,
      "kegType": "咖啡"
    }
  },
  "poppy": {
    "name": "虞美人",
    "url": "http://stardewvalleywiki.com/Poppy",
    "img": "poppy.png",
    "seeds": {
      "sell": 50,
      "pierre": 100,
      "joja": 125,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 7,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 140
    }
  },
  "summerspangle": {
    "name": "夏季亮片花",
    "url": "http://stardewvalleywiki.com/Summer_Spangle",
    "img": "summerspangle.png",
    "seeds": {
      "sell": 25,
      "pierre": 50,
      "joja": 62,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 8,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 90
    }
  },
  "parsnip": {
    "name": "防风草",
    "url": "http://stardewvalleywiki.com/Parsnip",
    "img": "parsnip.png",
    "seeds": {
      "sell": 10,
      "pierre": 20,
      "joja": 25,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 4,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 35,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "greenbean": {
    "name": "青豆",
    "url": "http://stardewvalleywiki.com/Green_Bean",
    "img": "greenbean.png",
    "seeds": {
      "sell": 30,
      "pierre": 60,
      "joja": 75,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 10,
      "regrow": 3
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 40,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "cauliflower": {
    "name": "花椰菜",
    "url": "http://stardewvalleywiki.com/Cauliflower",
    "img": "cauliflower.png",
    "seeds": {
      "sell": 40,
      "pierre": 80,
      "joja": 100,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 12,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 175,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "potato": {
    "name": "土豆",
    "url": "http://stardewvalleywiki.com/Potato",
    "img": "potato.png",
    "seeds": {
      "sell": 25,
      "pierre": 50,
      "joja": 62,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 6,
      "regrow": 0
    },
    "produce": {
      "extra": 1,
      "extraPerc": 0.25, // technically (0.2^1) + (0.2^2) + (0.2^3) ...
      "price": 80,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "garlic": {
    "name": "大蒜",
    "url": "http://stardewvalleywiki.com/Garlic",
    "img": "garlic.png",
    "seeds": {
      "sell": 20,
      "pierre": 40,
      "joja": 0,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 4,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 60,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "taroroot": {
    "name": "芋头",
    "url": "http://stardewvalleywiki.com/Taro_Root",
    "img": "taroroot.png",
    "seeds": {
      "sell": 20,
      "pierre": 0,
      "joja": 0,
      "special": 24,
      "specialLoc": "岛上商人",
      "specialUrl": "http://stardewvalleywiki.com/Island_Trader"
    },
    "growth": {
      "initial": 10,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 100,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "kale": {
    "name": "羽衣甘蓝",
    "url": "http://stardewvalleywiki.com/Kale",
    "img": "kale.png",
    "seeds": {
      "sell": 35,
      "pierre": 70,
      "joja": 87,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 6,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 110,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "unmilledrice": {
    "name": "未碾米",
    "url": "http://stardewvalleywiki.com/Unmilled_Rice",
    "img": "unmilledrice.png",
    "seeds": {
      "sell": 20,
      "pierre": 40,
      "joja": 0,
      "special": 1000,
      "specialLoc": "流动商人",
      "specialUrl": "http://stardewvalleywiki.com/Travelling_Cart"
    },
    "growth": {
      "initial": 8,
      "regrow": 0
    },
    "produce": {
      "extra": 1,
      "extraPerc": 0.11,
      "price": 30,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "rhubarb": {
    "name": "大黄",
    "url": "http://stardewvalleywiki.com/Rhubarb",
    "img": "rhubarb.png",
    "seeds": {
      "sell": 50,
      "pierre": 0,
      "joja": 0,
      "special": 100,
      "specialLoc": "绿洲",
      "specialUrl": "http://stardewvalleywiki.com/Oasis"
    },
    "growth": {
      "initial": 13,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 220,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "melon": {
    "name": "甜瓜",
    "url": "http://stardewvalleywiki.com/Melon",
    "img": "melon.png",
    "seeds": {
      "sell": 40,
      "pierre": 80,
      "joja": 100,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 12,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 250,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "tomato": {
    "name": "番茄",
    "url": "http://stardewvalleywiki.com/Tomato",
    "img": "tomato.png",
    "seeds": {
      "sell": 25,
      "pierre": 50,
      "joja": 62,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 11,
      "regrow": 4
    },
    "produce": {
      "extra": 1,
      "extraPerc": 0.05,
      "price": 60,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "blueberry": {
    "name": "蓝莓",
    "url": "http://stardewvalleywiki.com/Blueberry",
    "img": "blueberry.png",
    "seeds": {
      "sell": 40,
      "pierre": 80,
      "joja": 0,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 13,
      "regrow": 4
    },
    "produce": {
      "extra": 2,
      "extraPerc": 1,
      "price": 50,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "hotpepper": {
    "name": "辣椒",
    "url": "http://stardewvalleywiki.com/Hot_Pepper",
    "img": "hotpepper.png",
    "seeds": {
      "sell": 20,
      "pierre": 40,
      "joja": 50,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 5,
      "regrow": 3
    },
    "produce": {
      "extra": 1,
      "extraPerc": 0.03,
      "price": 40,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "wheat": {
    "name": "小麦",
    "url": "http://stardewvalleywiki.com/Wheat",
    "img": "wheat.png",
    "seeds": {
      "sell": 5,
      "pierre": 10,
      "joja": 12,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 4,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 25,
      "keg": 200,
      "jarType": "腌菜",
      "kegType": "啤酒"
    }
  },
  "radish": {
    "name": "萝卜",
    "url": "http://stardewvalleywiki.com/Radish",
    "img": "radish.png",
    "seeds": {
      "sell": 20,
      "pierre": 40,
      "joja": 50,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 6,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 90,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "redcabbage": {
    "name": "红叶卷心菜",
    "url": "http://stardewvalleywiki.com/Red_Cabbage",
    "img": "redcabbage.png",
    "seeds": {
      "sell": 50,
      "pierre": 100,
      "joja": 0,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 9,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 260,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "starfruit": {
    "name": "杨桃",
    "url": "http://stardewvalleywiki.com/Starfruit",
    "img": "starfruit.png",
    "seeds": {
      "sell": 200,
      "pierre": 0,
      "joja": 0,
      "special": 400,
      "specialLoc": "绿洲",
      "specialUrl": "http://stardewvalleywiki.com/Oasis"
    },
    "growth": {
      "initial": 13,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 750,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "corn": {
    "name": "玉米",
    "url": "http://stardewvalleywiki.com/Corn",
    "img": "corn.png",
    "seeds": {
      "sell": 75,
      "pierre": 150,
      "joja": 187,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 14,
      "regrow": 4
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 50,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "eggplant": {
    "name": "茄子",
    "url": "http://stardewvalleywiki.com/Eggplant",
    "img": "eggplant.png",
    "seeds": {
      "sell": 10,
      "pierre": 20,
      "joja": 25,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 5,
      "regrow": 5
    },
    "produce": {
      "extra": 1,
      "extraPerc": 0.002,
      "price": 60,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "artichoke": {
    "name": "洋蓟",
    "url": "http://stardewvalleywiki.com/Artichoke",
    "img": "artichoke.png",
    "seeds": {
      "sell": 15,
      "pierre": 30,
      "joja": 0,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 8,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 160,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "pumpkin": {
    "name": "南瓜",
    "url": "http://stardewvalleywiki.com/Pumpkin",
    "img": "pumpkin.png",
    "seeds": {
      "sell": 50,
      "pierre": 100,
      "joja": 125,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 13,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 320,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "bokchoy": {
    "name": "小白菜",
    "url": "http://stardewvalleywiki.com/Bok_Choy",
    "img": "bokchoy.png",
    "seeds": {
      "sell": 25,
      "pierre": 50,
      "joja": 62,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 4,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 80,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "yam": {
    "name": "山药",
    "url": "http://stardewvalleywiki.com/Yam",
    "img": "yam.png",
    "seeds": {
      "sell": 30,
      "pierre": 60,
      "joja": 75,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 10,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 160,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "cranberries": {
    "name": "蔓越莓",
    "url": "http://stardewvalleywiki.com/Cranberries",
    "img": "cranberries.png",
    "seeds": {
      "sell": 60,
      "pierre": 240,
      "joja": 300,
      "special": 0,
      "specialLoc": "",
      "specialUrl": ""
    },
    "growth": {
      "initial": 7,
      "regrow": 5
    },
    "produce": {
      "extra": 1,
      "extraPerc": 1,
      "price": 75,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "beet": {
    "name": "甜菜",
    "url": "http://stardewvalleywiki.com/Beet",
    "img": "beet.png",
    "seeds": {
      "sell": 10,
      "pierre": 0,
      "joja": 0,
      "special": 20,
      "specialLoc": "绿洲",
      "specialUrl": "http://stardewvalleywiki.com/Oasis"
    },
    "growth": {
      "initial": 6,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 100,
      "jarType": "腌菜",
      "kegType": "果汁"
    }
  },
  "ancientfruit": {
    "name": "远古水果",
    "url": "http://stardewvalleywiki.com/Ancient_Fruit",
    "img": "ancientfruit.png",
    "seeds": {
      "sell": 30,
      "pierre": 0,
      "joja": 0,
      "special": 0,
      "specialLoc": "无法购买",
      "specialUrl": "https://stardewvalleywiki.com/Ancient_Seeds"
    },
    "growth": {
      "initial": 28,
      "regrow": 7
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 550,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "cactusfruit": {
    "name": "仙人掌果",
    "url": "http://stardewvalleywiki.com/Cactus_Fruit",
    "img": "cactusfruit.png",
    "seeds": {
      "sell": 0,
      "pierre": 0,
      "joja": 0,
      "special": 150,
      "specialLoc": "绿洲",
      "specialUrl": "http://stardewvalleywiki.com/Oasis"
    },
    "growth": {
      "initial": 12,
      "regrow": 3
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      "price": 75,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "strawberry": {
    "name": "草莓",
    "url": "http://stardewvalleywiki.com/Strawberry",
    "img": "strawberry.png",
    "seeds": {
      "sell": 0,
      "pierre": 0,
      "joja": 0,
      "special": 100,
      "specialLoc": "彩蛋节",
      "specialUrl": "http://stardewvalleywiki.com/Egg_Festival"
    },
    "growth": {
      "initial": 8,
      "regrow": 4
    },
    "produce": {
      "extra": 1,
      "extraPerc": 0.02,
      "price": 120,
      "jarType": "果酱",
      "kegType": "葡萄酒",
      "dehydratorType": "干果"
    }
  },
  "springseeds": {
    "name": "春季种子",
    "url": "http://stardewvalleywiki.com/Spring_Seeds",
    "img": "springseeds.png",
    "seeds": {
      "sell": 0,
      "pierre": 0,
      "joja": 0,
      "special": 1000,
      "specialLoc": "流动商人",
      "specialUrl": "http://stardewvalleywiki.com/Travelling_Cart"
    },
    "growth": {
      "initial": 7,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      // (Wild Horseradish + Daffodil + Leek + Dandelion) / 4
      "price": (50 + 30 + 60 + 40) / 4
    },
    "isWildseed": true
  },
  "summerseeds": {
    "name": "夏季种子",
    "url": "http://stardewvalleywiki.com/Summer_Seeds",
    "img": "summerseeds.png",
    "seeds": {
      "sell": 0,
      "pierre": 0,
      "joja": 0,
      "special": 1000,
      "specialLoc": "流动商人",
      "specialUrl": "http://stardewvalleywiki.com/Travelling_Cart"
    },
    "growth": {
      "initial": 7,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      // (Spice Berry + Grape + Sweet Pea) / 3
      "price": (80 + 80 + 50) / 3,
      "jarType": "果酱",
      "kegType": "葡萄酒"
    },
    "isWildseed": true
  },
  "fallseeds": {
    "name": "秋季种子",
    "url": "http://stardewvalleywiki.com/Fall_Seeds",
    "img": "fallseeds.png",
    "seeds": {
      "sell": 0,
      "pierre": 0,
      "joja": 0,
      "special": 1000,
      "specialLoc": "流动商人",
      "specialUrl": "http://stardewvalleywiki.com/Travelling_Cart"
    },
    "growth": {
      "initial": 7,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      // (Blackberry + Common Mushroom + Hazelnut + Wild Plum) / 4
      "price": (20 + 40 + 90 + 80) / 4,
      "jarType": "果酱",
      "kegType": "葡萄酒"
    },
    "isWildseed": true
  },
  "winterseeds": {
    "name": "冬季种子",
    "url": "http://stardewvalleywiki.com/Winter_Seeds",
    "img": "winterseeds.png",
    "seeds": {
      "sell": 0,
      "pierre": 0,
      "joja": 0,
      "special": 1000,
      "specialLoc": "流动商人",
      "specialUrl": "http://stardewvalleywiki.com/Travelling_Cart"
    },
    "growth": {
      "initial": 7,
      "regrow": 0
    },
    "produce": {
      "extra": 0,
      "extraPerc": 0,
      // (Crocus + Crystal Fruit + Snow Yam + Winter Root) / 4
      "price": (60 + 150 + 100 + 70) / 4,
      "jarType": "果酱",
      "kegType": "葡萄酒"
    },
    "isWildseed": true
  }
};
