// Prepare variables.
var cropList;

var svgWidth = 1080;
var svgMinWidth = 300;
var svgHeight = 480;

var width = svgWidth - 48;
var height = (svgHeight - 56) / 2;
var barPadding = 4;
var paddingLeft = 8;
var GREENHOUSE_INDEX = 4;
var seasonNamesByIndex = ["春季", "夏季", "秋季", "冬季"];
var seasonCropCache = {};
var cropKeyOrder = Object.keys(crops);
var barWidth = width / Math.max(getSeasonCropKeys(GREENHOUSE_INDEX).length, 1) - barPadding;
var miniBar = 8;
// Leave space for the Y-axis ticks and line
var barOffsetX = 35;
var barOffsetY = 40;
var graphDescription = "收益";

// Prepare web elements.
var svg = d3.select("div.graph")
	.append("svg")
	.attr("width", svgWidth)
	.attr("height", svgHeight)
	.style("background-color", "#333333")
	.style("border-radius", "8px");

var tooltip = d3.select("body")
	.append("div")
	.style("position", "absolute")
	.style("z-index", 10)
	.style("visibility", "hidden")
	.style("background", "rgb(0, 0, 0)")
	.style("background", "rgba(0, 0, 0, 0.75)")
	.style("padding", "8px")
	.style("border-radius", "8px")
	.style("border", "2px solid black");

var gAxis = svg.append("g");
var gTitle = svg.append("g");
var gProfit = svg.append("g");
var gSeedLoss = svg.append("g");
var gFertLoss = svg.append("g");
var gIcons = svg.append("g");
var gTooltips = svg.append("g");

var axisY;
var barsProfit;
var barsSeed;
var barsFert;
var imgIcons;
var barsTooltips;
var options;
var MAX_INT = Number.MAX_SAFE_INTEGER || Number.MAX_VALUE;

// Known forage-only items when crops.js doesn't mark `isWildseed`.
// Do NOT edit crops.js (auto-generated); infer here by crop key.
var FORAGING_KEYS = {
    'wildhorseradish': true,
    'spiceberry': true,
    'commonmushroom': true,
    'winterroot': true,
    // Some farms don't include these, but keep for safety:
    'daffodil': true,
    'leek': true,
    'dandelion': true,
    'wildplum': true,
    'hazelnut': true,
    'blackberry': true,
    'crocus': true,
    'snowyam': true,
    'crystalfruit': true,
    'sweetpea': true
};

// Format ticks: show thousands as k (e.g., -2k, -1.5k, 0, 500, 1k)
function formatK(n) {
    var sign = n < 0 ? '-' : '';
    var v = Math.abs(n);
    if (v >= 1000) {
        var k = v / 1000;
        return sign + (Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)) + 'k';
    }
    return sign + d3.format(',')(v);
}

function pickCurrencyStep(maxAbs) {
    var steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000, 20000];
    var maxTicks = 11; // keep it readable
    var step = steps[0];
    for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        var count = Math.floor(maxAbs / s) * 2 + 1; // symmetric ticks
        if (count <= maxTicks) { step = s; break; }
    }
    return step;
}

function makeAdaptiveTicks(ax) {
    var dom = ax.domain();
    var maxAbs = Math.max(Math.abs(dom[0]), Math.abs(dom[1]));
    var step = pickCurrencyStep(maxAbs);
    var limit = Math.ceil(maxAbs / step) * step;
    if (limit === 0) limit = step; // ensure at least one positive/negative tick
    var ticks = [];
    for (var t = -limit; t <= limit; t += step) ticks.push(t);
    return ticks;
}

function pickPercentStep(maxAbs) {
    var steps = [5, 10, 20, 25, 50, 100, 200];
    var maxTicks = 13;
    var step = steps[0];
    for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        var count = Math.floor(maxAbs / s) * 2 + 1;
        if (count <= maxTicks) { step = s; break; }
    }
    return step;
}

function makePercentTicks(ax) {
    var dom = ax.domain();
    var maxAbs = Math.max(Math.abs(dom[0]), Math.abs(dom[1]));
    var step = pickPercentStep(maxAbs);
    var limit = Math.max(step, Math.ceil(maxAbs / step) * step);
    var ticks = [];
    for (var t = -limit; t <= limit; t += step) ticks.push(t);
    return ticks;
}

function getCropSeasonTokens(crop) {
	if (!crop)
		return [];
	if (crop._seasonTokens)
		return crop._seasonTokens;
	var tokens = [];
	if (typeof crop.seasons === 'string' && crop.seasons.length > 0) {
		var rawTokens = crop.seasons.split('|');
		for (var i = 0; i < rawTokens.length; i++) {
			var token = rawTokens[i].trim();
			if (token.length > 0)
				tokens.push(token);
		}
	}
	crop._seasonTokens = tokens;
	return tokens;
}

function cropMatchesSeasonIndex(crop, seasonIndex) {
	if (!crop)
		return false;
	if (seasonIndex === GREENHOUSE_INDEX)
		return !!crop.greenhouse;
	if (seasonIndex < 0 || seasonIndex >= seasonNamesByIndex.length)
		return false;
	var seasonName = seasonNamesByIndex[seasonIndex];
	var tokens = getCropSeasonTokens(crop);
	for (var i = 0; i < tokens.length; i++) {
		if (tokens[i] === seasonName)
			return true;
	}
	return false;
}

function getSeasonCropKeys(seasonIndex) {
	if (seasonCropCache.hasOwnProperty(seasonIndex))
		return seasonCropCache[seasonIndex];
	var result = [];
	for (var i = 0; i < cropKeyOrder.length; i++) {
		var key = cropKeyOrder[i];
		var crop = crops[key];
		if (cropMatchesSeasonIndex(crop, seasonIndex))
			result.push(key);
	}
	seasonCropCache[seasonIndex] = result;
	return result;
}

function updateBarWidthFromCropList() {
    // Keep bar width aligned to greenhouse spacing for stability
    var greenhouseCount = Math.max(getSeasonCropKeys(GREENHOUSE_INDEX).length, 1);
    barWidth = width / greenhouseCount - barPadding;
    if (barWidth < 1)
        barWidth = 1;
}

/*
 * Formats a specified number, adding separators for thousands.
 * @param num The number to format.
 * @return Formatted string.
 */
function formatNumber(num) {
    num = num.toFixed(2) + '';
    x = num.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

/*
 * Calculates the maximum number of harvests for a crop, given the current options.
 * @param crop The crop object to calculate.
 * @return Number of harvests for the specified crop.
 */
function harvests(crop) {
	var fertilizer = fertilizers[options.fertilizer];
	// Tea blooms every day for the last 7 days of a season
	var isTea = crop.name == "茶叶";

	// if the crop is NOT cross season, remove 28 extra days for each extra season
	var remainingDays = options.days - 28;
	if (options.crossSeason && options.season != GREENHOUSE_INDEX) {
		var nextSeasonIndex = options.season + 1;
		if (nextSeasonIndex >= seasonNamesByIndex.length)
			nextSeasonIndex = 0;
		if (cropMatchesSeasonIndex(crop, nextSeasonIndex)) {
			remainingDays += 28;
		}
	}
	else {
		remainingDays = options.days;
	}

	// console.log("=== " + crop.name + " ===");

	var harvests = 0;
	var day = 1;

	if (options.skills.agri)
		day += Math.floor(crop.growth.initial * (fertilizer.growth - 0.1));
	else
		day += Math.floor(crop.growth.initial * fertilizer.growth);

	if (day <= remainingDays && (!isTea || ((day-1) % 28 + 1) > 21))
		harvests++;

	while (day <= remainingDays) {
		if (crop.growth.regrow > 0) {
			// console.log("Harvest on day: " + day);
			day += crop.growth.regrow;
		}
		else {
			// console.log("Harvest on day: " + day);
			if (options.skills.agri)
				day += Math.floor(crop.growth.initial * (fertilizer.growth - 0.1));
			else
				day += Math.floor(crop.growth.initial * fertilizer.growth);
		}

		if (day <= remainingDays && (!isTea || ((day-1) % 28 + 1) > 21))
			harvests++;
	}

	// console.log("Harvests: " + harvests);
	return harvests;
}

/*
 * Calculates the minimum cost of a single packet of seeds.
 * @param crop The crop object, containing all the crop data.
 * @return The minimum cost of a packet of seeds, taking options into account.
 */
function minSeedCost(crop) {
	var minSeedCost = Infinity;

	// Helper to consider a numeric price candidate
	function consider(price) {
		if (typeof price === 'number' && price > 0 && price < minSeedCost) {
			minSeedCost = price;
		}
	}

	// Helper: consider a value that may be a number or a range string like "100-1000"
	function considerMaybeRange(value) {
		if (typeof value === 'string' && value.includes('-')) {
			var parts = value.split('-');
			var low = parseInt(parts[0], 10);
			var high = parseInt(parts[1], 10);
			if (!isNaN(low) && !isNaN(high) && high > 0) {
				var lo = Math.max(1, low);
				var hi = Math.max(lo, high);
				// Random integer in [lo, hi]
				var rnd = Math.floor(Math.random() * (hi - lo + 1)) + lo;
				consider(rnd);
				return;
			}
		}
		consider(value);
	}

	// Pierre and Joja (if present)
	if (crop.seeds && options.seeds.pierre) consider(crop.seeds.pierre);
	if (crop.seeds && options.seeds.joja) consider(crop.seeds.joja);

	// Special sources: Oasis, Island Trader, Travelling Cart
	if (crop.seeds && options.seeds.special) {
		considerMaybeRange(crop.seeds["Oasis"]);
		considerMaybeRange(crop.seeds["Island Trader"]);
		considerMaybeRange(crop.seeds["Travelling Cart"]);
	}
	    if (minSeedCost == Infinity)
	        minSeedCost = 0;
		
		return minSeedCost;
}

/*
 * Calculates the number of crops planted.
 * @param crop The crop object, containing all the crop data.
 * @return The number of crops planted, taking the desired number planted and the max seed money into account.
 */
function planted(crop) {
	if (options.buySeed && options.maxSeedMoney !== 0) {
		return Math.min(options.planted, Math.floor(options.maxSeedMoney / minSeedCost(crop)));
	} else {
		return options.planted;
	}
}

/*
 * Calculates the ratios of different crop ratings based on fertilizer level and player farming level
 * Math is from Crop.harvest(...) game logic
 *
 * @param fertilizer The level of the fertilizer (none:0, basic:1, quality:2, deluxe:3)
 * @param level The total farming skill level of the player
 * @return Object containing ratios of iridium, gold, silver, and unrated crops liklihood
 */
function levelRatio(fertilizer, level, isWildseed) {
	var ratio = {};

    if (isWildseed) {
		// All wild crops are iridium if botanist is selected
		if  (options.skills.botanist)
        	ratio.ratioI = 1;
		else
			ratio.ratioI = 0;
		// Gold foraging is at a rate of foraging level/30 (and not iridium)
		ratio.ratioG = level/30.0*(1-ratio.ratioI);
		// Silver is at a rate of foraging level/15 (and not gold or iridium)
		ratio.ratioS = level/15.0*(1-ratio.ratioG-ratio.ratioI);
		// Normal is the remaining rate
		ratio.ratioN = 1-ratio.ratioS-ratio.ratioG-ratio.ratioI;
	}
    else
	{
		// Iridium is available on deluxe fertilizer at 1/2 gold ratio
    	ratio.ratioI = fertilizer >= 3 ? (0.2*(level/10.0)+0.2*fertilizer*((level+2)/12.0)+0.01)/2 : 0;
		// Calculate gold times probability of not iridium
		ratio.ratioG = (0.2*(level/10.0)+0.2*fertilizer*((level+2)/12.0)+0.01)*(1.0-ratio.ratioI);
		// Probability of silver capped at .75, times probability of not gold/iridium
		ratio.ratioS = Math.max(0,Math.min(0.75,ratio.ratioG*2.0)*(1.0-ratio.ratioG-ratio.ratioI));
		// Probability of not the other ratings
		ratio.ratioN = Math.max(0, 1.0 - ratio.ratioS - ratio.ratioG - ratio.ratioI);
	}
	return ratio;
}

/*
 * Calculates the keg modifier for the crop.
 * @param crop The crop object, containing all the crop data.
 * @return The keg modifier.
 */
function getKegModifier(crop) {
	if (options.skills.arti) {
		result = crop.produce.kegType == "葡萄酒" ? 4.2 : 3.15;
	}
	else {
		result = crop.produce.kegType == "葡萄酒" ? 3 : 2.25;
	}
	
    return result;
}

/*
 * Calculates the cask modifier for the crop.
 * @param crop The crop object, containing all the crop data.
 * @return The cask modifier.
 */
function getCaskModifier() {
    // Official cask (木桶) aging multipliers; do NOT include Artisan here
    switch (options.aging) {
        case 1: return 1.25; // 银星
        case 2: return 1.5;  // 金星
        case 3: return 2.0;  // 铱星
        default: return 1;   // 不陈酿
    }
}

function canAgeKegType(kegType) {
    // Only Wine, Beer, Pale Ale, Mead can be aged in casks
    if (!kegType) return false;
    return kegType === '葡萄酒' || kegType === '啤酒' || kegType === '淡啤酒' || kegType === '蜂蜜酒'
        || kegType === 'Wine' || kegType === 'Beer' || kegType === 'Pale Ale' || kegType === 'Mead';
}

/*
 * Calculates the dehydrator modifier for 5 crops.
 * @param crop The crop object, containing all the crop data.
 * @return The dehydrator modifier.
 */
function getDehydratorModifier(crop) {
    if (!crop || !crop.produce || !crop.produce.dehydratorType)
        return 0;

    var t = crop.produce.dehydratorType;
    // Normalize known localized names to a common category
    var isDriedFruit = (
        t === "Dried Fruit" ||
        t === "果干" ||
        t === "葡萄干" // 葡萄干（raisin）也按果干公式计算
    );

    if (isDriedFruit) {
        // Base formula scales with raw price; artisan gives higher coefficient and extra flat bonus
        return options.skills.arti ? (10.5 * crop.produce.price + 35) : (7.5 * crop.produce.price + 25);
    }

    // Fallback: if a new type appears, fall back to price‑scaled formula
    return options.skills.arti ? (10.5 * crop.produce.price + 35) : (7.5 * crop.produce.price + 25);
}

/*
 * Calculates the profit for a specified crop.
 * @param crop The crop object, containing all the crop data.
 * @return The total profit.
 */
function profit(crop) {
    profitData = {}
	var num_planted = planted(crop);
	//var total_harvests = crop.harvests * num_planted;
	var fertilizer = fertilizers[options.fertilizer];
	var produce = options.produce;
	var isTea = crop.name == "茶叶";
	var isCoffee = crop.name == "咖啡豆";

    var useLevel = options.level;
    if (crop.isWildseed)
        useLevel = options.foragingLevel;

	var {ratioN, ratioS, ratioG, ratioI} = levelRatio(fertilizer.ratio, useLevel+options.foodLevel, crop.isWildseed);
        
	if (isTea) ratioN = 1, ratioS = ratioG = ratioI = 0;
	var netIncome = 0;
	var netExpenses = 0;
	var totalProfit = 0;
	var totalReturnOnInvestment = 0;
	var averageReturnOnInvestment = 0;
	
	//Skip keg/jar calculations for ineligible crops (where corp.produce.jar or crop.produce.keg = 0)
	
	var userawproduce = false;

	switch(produce) {
		case 1: 
			if(crop.produce.jarType == null) userawproduce = true;
			break;
		case 2:
			if(crop.produce.kegType == null) userawproduce = true;
			break;	
		case 4:
			if(crop.produce.dehydratorType == null) userawproduce = true;
			break;
	}
	
    var total_harvest = num_planted * 1.0 + num_planted * crop.produce.extraPerc * crop.produce.extra;
	var forSeeds = 0;
	if (options.replant && !isTea) {
		if (isCoffee && options.nextyear) {
			forSeeds = num_planted;
		} 
		else if (crop.growth.regrow > 0 && options.nextyear) {
			forSeeds = num_planted * 0.5;
		} 
		else if (crop.growth.regrow == 0) {
			forSeeds = num_planted * crop.harvests * 0.5;
			if(!options.nextyear && forSeeds >= 1) 
				forSeeds -= num_planted * 0.5;
		}
	}
	
	var total_crops = total_harvest * crop.harvests;
	
	// console.log("Calculating raw produce value for: " + crop.name);
	// Determine income
	if (produce != 3 || userawproduce) {
        if (userawproduce && !options.sellRaw) {
            netIncome = 0;
        }
        else {
            var countN = total_crops * ratioN;
            var countS = total_crops * ratioS;
            var countG = total_crops * ratioG;
            var countI = total_crops * ratioI;
            var tempSeeds = forSeeds;
            if (options.replant) {
                if (countN - tempSeeds < 0) {
                    tempSeeds -= countN;
                    countN = 0;
                }
                else {
                    countN -= tempSeeds;
                    tempSeeds = 0;
                }
                if (countS - tempSeeds < 0) {
                    tempSeeds -= countS;
                    countS = 0;
                }
                else {
                    countS -= tempSeeds;
                    tempSeeds = 0;
                }
                if (countG - tempSeeds < 0) {
                    tempSeeds -= countG;
                    countG = 0;
                }
                else {
                    countG -= tempSeeds;
                    tempSeeds = 0;
                }
                if (countI - tempSeeds < 0) {
                    tempSeeds -= countI;
                    countI = 0;
                }
                else {
                    countI -= tempSeeds;
                    tempSeeds = 0;
                }
            }

            if (produce == 0 || userawproduce) {
                netIncome += crop.produce.price * countN;
                netIncome += Math.trunc(crop.produce.price * 1.25) * countS;
                netIncome += Math.trunc(crop.produce.price * 1.5) * countG;
                netIncome += crop.produce.price * 2 * countI;

                if (options.skills.till && !crop.isWildseed) {
                    netIncome *= 1.1;
                    // console.log("Profit (After skills): " + profit);
                }

                profitData.quantitySold  = Math.floor(total_crops - forSeeds);
            }
            else if (produce == 1 || produce == 2 || produce == 4) {

                var usableCrops = 0;
                if (produce != 4 || options.byHarvest) {
                    usableCrops = Math.floor(total_harvest);
                    if (options.replant && !isTea && crop.growth.regrow == 0)
                        usableCrops -= num_planted * 0.5;
                    usableCrops = Math.max(0, usableCrops);
                }
                else {
                    usableCrops = Math.floor(total_crops - forSeeds);
                    usableCrops = Math.max(0, usableCrops);
                }

                var itemsMade = 0;
                var cropsLeft = 0;
                if (produce == 1 || produce == 2) {
                    itemsMade = usableCrops;
                }
                else if (produce == 4) {
                    if (options.byHarvest) {
                        // Accumulate leftovers across harvests; respect equipment cap per harvest
                        var perHarvest = usableCrops; // already per-harvest usable amount
                        var carry = 0;
                        var batches = 0;
                        for (var h = 0; h < crop.harvests; h++) {
                            var available = carry + perHarvest;
                            var canMake = Math.floor(available / 5);
                            if (options.equipment > 0) {
                                canMake = Math.min(canMake, options.equipment);
                            }
                            batches += canMake;
                            available -= canMake * 5;
                            carry = available; // leftovers roll to next harvest
                        }
                        itemsMade = batches;
                        cropsLeft = carry;
                    } else {
                        // Aggregate whole-season processing
                        cropsLeft = Math.floor(usableCrops % 5);
                        itemsMade = Math.floor(usableCrops / 5);
                    }
                }
                if (options.nextyear && options.byHarvest) {
                    if (produce == 4) {
                        var itemsMadeNew = Math.max(0, Math.round((itemsMade * 5 - num_planted * 0.5) / 5));
                        cropsLeft += (itemsMade - itemsMadeNew) * 5;
                        itemsMade = itemsMadeNew;
                    }
                }

                if (options.equipment > 0) {
                    if (produce == 1 || produce == 2) {
                        cropsLeft += Math.max(0, itemsMade - options.equipment) * crop.harvests;
                        itemsMade = Math.min(options.equipment, itemsMade) * crop.harvests;
                    }
                    if (produce == 4 && !options.byHarvest) {
                        cropsLeft += Math.max(0, itemsMade - options.equipment) * 5;
                        itemsMade = Math.min(options.equipment, itemsMade);
                    }
                }
                else {
                    if (produce == 1 || produce == 2) {
                        itemsMade *= crop.harvests;
                    }
                }

                if (options.nextyear) {
                    if (produce == 1 || produce == 2) {
                        cropsLeft += num_planted * 0.5;
                        itemsMade = Math.max(0, itemsMade - num_planted * 0.5);
                    }
                }

                var cropPrice = 0;
                if (options.sellExcess)
                    cropPrice = options.skills.till ? crop.produce.price * 1.1 : crop.produce.price;
                netIncome += cropsLeft * cropPrice;

                var kegModifier = getKegModifier(crop);
                var caskModifier = canAgeKegType(crop.produce.kegType) ? getCaskModifier() : 1;
                var dehydratorModifier = getDehydratorModifier(crop);
                if (options.produce == 1) {
                    netIncome += itemsMade * (crop.produce.jar != null ? crop.produce.jar : options.skills.arti ? (crop.produce.price * 2 + 50) * 1.4 : crop.produce.price * 2 + 50);
                }
                else if (options.produce == 2) {
                    netIncome += itemsMade * (crop.produce.keg != null ? crop.produce.keg * caskModifier : crop.produce.price * kegModifier * caskModifier);
                }
                else if (options.produce == 4) {
                    netIncome += crop.produce.dehydratorType != null ? itemsMade * dehydratorModifier : 0;
                }
        
                profitData.quantitySold = itemsMade;
                profitData.excessProduce = cropsLeft;
            }
        }
		
	}
    else if (produce == 3) {
        var items = total_crops - forSeeds;
        netIncome += 2 * items * crop.seeds.sell;
		profitData.quantitySold = Math.floor(2 * items);
    }

	// Determine expenses
	if (options.buySeed) {
		netExpenses += crop.seedLoss;
		// console.log("Profit (After seeds): " + profit);
	}

	if (options.buyFert) {
		netExpenses += crop.fertLoss;
		// console.log("Profit (After fertilizer): " + profit);
	}

    // Determine total profit (with current buy options)
    totalProfit = netIncome + netExpenses;

    // ROI should be meaningful even未勾选“购买成本”，因此按种子+肥料的理论成本计算
    var roiExpenses = seedLoss(crop) + fertLoss(crop); // 两者均为负值（支出）
    if (roiExpenses != 0) {
        totalReturnOnInvestment = 100 * ((netIncome + roiExpenses) / -roiExpenses);
        if (crop.growth.regrow == 0) {
            averageReturnOnInvestment = (totalReturnOnInvestment / crop.growth.initial);
        }
        else {
            averageReturnOnInvestment = (totalReturnOnInvestment / options.days);
        }
    } else {
        totalReturnOnInvestment = 0;
        averageReturnOnInvestment = 0;
    }

	profitData.totalReturnOnInvestment = totalReturnOnInvestment;
	profitData.averageReturnOnInvestment = averageReturnOnInvestment;
	profitData.netExpenses = netExpenses;
    profitData.profit = totalProfit;
    profitData.ratioN = ratioN;
    profitData.ratioS = ratioS;
    profitData.ratioG = ratioG;
    profitData.ratioI = ratioI;

	// console.log("Profit: " + profit);
	return profitData;
}

/*
 * Calculates the loss to profit when seeds are bought.
 * @param crop The crop object, containing all the crop data.
 * @return The total loss.
 */
function seedLoss(crop) {
	var harvests = crop.harvests;

    var loss = -minSeedCost(crop);

	if (crop.growth.regrow == 0 && harvests > 0 && !options.replant)
		loss = loss * harvests;

	return loss * planted(crop);
}

/*
 * Calculates the loss to profit when fertilizer is bought.
 *
 * Note that harvesting does not destroy fertilizer, so this is
 * independent of the number of harvests.
 *
 * @param crop The crop object, containing all the crop data.
 * @return The total loss.
 */
function fertLoss(crop) {
	var loss;
	if(options.fertilizer == 4 && options.fertilizerSource == 1)
		loss = -fertilizers[options.fertilizer].alternate_cost;
	else
		loss = -fertilizers[options.fertilizer].cost;
	return loss * planted(crop);
}

/*
 * Converts any value to the average per day value.
 * @param value The value to convert.
 * @return Value per day.
 */
function perDay(value) {
	return value / options.days;
}

/*
 * Performs filtering on a season's crop list, saving the new list to the cropList array.
 */
function fetchCrops() {
	cropList = [];

	var seasonCropKeys = getSeasonCropKeys(options.season);

	for (var i = 0; i < seasonCropKeys.length; i++) {
		var cropKey = seasonCropKeys[i];
		var crop = crops[cropKey];
		// Skip undefined or malformed entries
		if (!crop || !crop.seeds) continue;

		var hasPierre = options.seeds.pierre && crop.seeds.pierre && crop.seeds.pierre != 0;
		var hasJoja = options.seeds.joja && crop.seeds.joja && crop.seeds.joja != 0;
		var hasSpecial = false;
		if (options.seeds.special) {
			var oasis = crop.seeds["Oasis"];
			var trader = crop.seeds["Island Trader"];
			var cart = crop.seeds["Travelling Cart"];
			hasSpecial = (typeof oasis === 'number' && oasis != 0)
				|| (typeof trader === 'number' && trader != 0)
				|| (typeof cart === 'number' && cart != 0)
				|| (typeof cart === 'string' && cart.length > 0);
		}

        if (hasPierre || hasJoja || hasSpecial) {
            var c = JSON.parse(JSON.stringify(crop));
            // Infer wildseed flag if missing, based on known foraging items.
            if (c.isWildseed !== true && FORAGING_KEYS[cropKey] === true) {
                c.isWildseed = true;
            }
            cropList.push(c);
        }
	}

	updateBarWidthFromCropList();
}

/*
 * Calculates all profits and losses for all crops in the cropList array.
 */
function valueCrops() {
	for (var i = 0; i < cropList.length; i++) {
        if (cropList[i].isWildseed && options.skills.gatherer) {
            cropList[i].produce.extra += 1;
            cropList[i].produce.extraPerc += 0.2;
        }
		cropList[i].planted = planted(cropList[i]);
		cropList[i].harvests = harvests(cropList[i]);
		cropList[i].seedLoss = seedLoss(cropList[i]);
		cropList[i].fertLoss = fertLoss(cropList[i]);
		cropList[i].profitData = profit(cropList[i]);
        cropList[i].profit = cropList[i].profitData.profit;
		cropList[i].totalReturnOnInvestment = cropList[i].profitData.totalReturnOnInvestment;
		cropList[i].averageReturnOnInvestment = cropList[i].profitData.averageReturnOnInvestment;
		cropList[i].netExpenses = cropList[i].profitData.netExpenses;
		cropList[i].averageProfit = perDay(cropList[i].profit);
		cropList[i].averageSeedLoss = perDay(cropList[i].seedLoss);
		cropList[i].averageFertLoss = perDay(cropList[i].fertLoss);

		if (options.average == 1) {
			cropList[i].drawProfit = cropList[i].averageProfit;
			cropList[i].drawSeedLoss = cropList[i].averageSeedLoss;
			cropList[i].drawFertLoss = cropList[i].averageFertLoss;
			graphDescription = "日收益"
		}
        else if ((options.average == 2) ){
            cropList[i].drawProfit = cropList[i].totalReturnOnInvestment;
            // Convert losses to percent of investment (negative percent)
            var roiDen = -(cropList[i].seedLoss + cropList[i].fertLoss);
            if (roiDen > 0) {
                var seedShare = Math.max(0, -cropList[i].seedLoss) / roiDen;
                var fertShare = Math.max(0, -cropList[i].fertLoss) / roiDen;
                cropList[i].drawSeedLoss = -seedShare * 100;
                cropList[i].drawFertLoss = -fertShare * 100;
            } else {
                cropList[i].drawSeedLoss = 0;
                cropList[i].drawFertLoss = 0;
            }
            graphDescription = "总投资回报率";
        }
        else if (options.average == 3) {
            var roiDiv = (cropList[i].growth.regrow == 0) ? cropList[i].growth.initial : options.days;
            roiDiv = Math.max(1, roiDiv);
            cropList[i].drawProfit = cropList[i].averageReturnOnInvestment;
            var roiDen = -(cropList[i].seedLoss + cropList[i].fertLoss);
            if (roiDen > 0) {
                var seedShare = Math.max(0, -cropList[i].seedLoss) / roiDen;
                var fertShare = Math.max(0, -cropList[i].fertLoss) / roiDen;
                cropList[i].drawSeedLoss = -(seedShare * 100) / roiDiv;
                cropList[i].drawFertLoss = -(fertShare * 100) / roiDiv;
            } else {
                cropList[i].drawSeedLoss = 0;
                cropList[i].drawFertLoss = 0;
            }
            graphDescription = "每日投资回报率";
        }
		else {
			cropList[i].drawProfit = cropList[i].profit;
			cropList[i].drawSeedLoss = cropList[i].seedLoss;
			cropList[i].drawFertLoss = cropList[i].fertLoss;
			graphDescription = "总收益";
		}
	}
}

/*
 * Sorts the cropList array, so that the most profitable crop is the first one.
 */
function sortCrops() {
	var swapped;
    do {
        swapped = false;
        for (var i = 0; i < cropList.length - 1; i++) {
            if (cropList[i].drawProfit < cropList[i + 1].drawProfit) {
                var temp = cropList[i];
                cropList[i] = cropList[i + 1];
                cropList[i + 1] = temp;
                swapped = true;
            }
        }
    } while (swapped);


	// console.log("==== SORTED ====");
	for (var i = 0; i < cropList.length; i++) {
		// console.log(cropList[i].drawProfit.toFixed(2) + "  " + cropList[i].name);
	}
}

/*
 * Updates the X D3 scale.
 * @return The new scale.
 */
function updateScaleX() {
    // Space positions based on the full greenhouse crop count to keep spacing stable
    return d3.scaleBand()
        .domain(d3.range(getSeasonCropKeys(GREENHOUSE_INDEX).length))
        .rangeRound([0, width]).paddingInner(0).paddingOuter(0);
}

/*
 * Updates the Y D3 scale.
 * @return The new scale.
 */
function updateScaleY() {
    var isROI = (options.average == 2 || options.average == 3);
    if (isROI) {
        // Positive half-scale must cover both ROI and abs(negative loss %) magnitudes
        var maxROI = 0;
        var maxLossMag = 0;
        for (var i = 0; i < cropList.length; i++) {
            var d = cropList[i];
            if (d.drawProfit > maxROI) maxROI = d.drawProfit; // ROI in %
            var lossMag = Math.max(Math.abs(d.drawSeedLoss || 0), Math.abs(d.drawFertLoss || 0));
            if (lossMag > maxLossMag) maxLossMag = lossMag;
        }
        var maxAbs = Math.max(maxROI, maxLossMag);
        var step = pickPercentStep(maxAbs);
        var top = Math.max(step, Math.ceil(maxAbs / step) * step);
        return d3.scaleLinear()
            .domain([0, top])
            .range([height, 0]);
    } else {
        var maxAbs = 0;
        for (var i = 0; i < cropList.length; i++) {
            var d = cropList[i];
            var pos = d.drawProfit >= 0 ? d.drawProfit : 0;
            var worst = d.drawProfit;
            if (options.buySeed && d.drawSeedLoss < worst) worst = d.drawSeedLoss;
            if (options.buyFert && d.drawFertLoss < worst) worst = d.drawFertLoss;
            var negMag = worst < 0 ? -worst : 0;
            var m = Math.max(pos, negMag);
            if (m > maxAbs) maxAbs = m;
        }
        var step = pickCurrencyStep(maxAbs);
        var top = Math.max(step, Math.ceil(maxAbs / step) * step);
        return d3.scaleLinear()
            .domain([0, top])
            .range([height, 0]);
    }
}

/*
 * Updates the axis D3 scale.
 * @return The new scale.
 */
function updateScaleAxis() {
    var isROI = (options.average == 2 || options.average == 3);
    var maxAbs = 0;
    if (isROI) {
        // Consider both ROI (green/red) and negative cost percentages (yellow)
        var minVal = 0, maxVal = 0;
        for (var i = 0; i < cropList.length; i++) {
            var d = cropList[i];
            var vals = [d.drawProfit];
            if (options.buySeed) vals.push(d.drawSeedLoss || 0);
            if (options.buyFert) vals.push(d.drawFertLoss || 0);
            for (var j = 0; j < vals.length; j++) {
                var v = vals[j];
                if (v < minVal) minVal = v;
                if (v > maxVal) maxVal = v;
            }
        }
        var maxAbs = Math.max(Math.abs(minVal), Math.abs(maxVal));
        var step = pickPercentStep(maxAbs);
        var minLimit = Math.floor(minVal / step) * step;
        var maxLimit = Math.ceil(maxVal / step) * step;
        if (minLimit === maxLimit) maxLimit = minLimit + step;
        return d3.scaleLinear()
            .domain([minLimit, maxLimit])
            .range([height*2, 0]);
    } else {
        for (var i = 0; i < cropList.length; i++) {
            var d = cropList[i];
            var pos = d.drawProfit >= 0 ? d.drawProfit : 0;
            var worst = d.drawProfit;
            if (options.buySeed && d.drawSeedLoss < worst) worst = d.drawSeedLoss;
            if (options.buyFert && d.drawFertLoss < worst) worst = d.drawFertLoss;
            var negMag = worst < 0 ? -worst : 0;
            var m = Math.max(pos, negMag);
            if (m > maxAbs) maxAbs = m;
        }
        var step = pickCurrencyStep(maxAbs);
        var limit = Math.max(step, Math.ceil(maxAbs / step) * step);
        return d3.scaleLinear()
            .domain([-limit, limit])
            .range([height*2, 0]);
    }
}

/*
 * Renders the graph.
 * This is called only when opening for the first time or when changing seasons/seeds.
 */
function renderGraph() {

	updateBarWidthFromCropList();

	var x = updateScaleX();
	var y = updateScaleY();
	var ax = updateScaleAxis();

    var width = barOffsetX + barPadding * 2 + (barWidth + barPadding) * cropList.length + paddingLeft;
    if (width < svgMinWidth)
        width = svgMinWidth;
	svg.attr("width", width).style("padding-top", "12px");
	d3.select(".graph").attr("width", width);

        var isROI = (options.average == 2 || options.average == 3);
        var yAxis = d3.axisLeft(ax)
                .tickValues(isROI ? makePercentTicks(ax) : makeAdaptiveTicks(ax))
                .tickFormat(isROI ? function(d){ return d + '%'; } : formatK);

	axisY = gAxis.attr("class", "axis")
		.call(yAxis)
		.attr("transform", "translate(48, " + barOffsetY + ")");

    title = gTitle.attr("class", "Title")
        .append("text")
        .attr("class", "axis")
        .attr("x", 72)
        .attr("y", 12)
        .style("text-anchor", "start")
        .text(graphDescription);

	barsProfit = gProfit.selectAll("rect")
		.data(cropList)
		.enter()
		.append("rect")
			.attr("x", function(d, i) {
				if (d.drawProfit < 0 && options.buySeed && options.buyFert)
					return x(i) + barOffsetX + (barWidth / miniBar) * 2;
				else if (d.drawProfit < 0 && !options.buySeed && options.buyFert)
					return x(i) + barOffsetX + barWidth / miniBar;
				else if (d.drawProfit < 0 && options.buySeed && !options.buyFert)
					return x(i) + barOffsetX + barWidth / miniBar;
				else
					return x(i) + barOffsetX;
			})
			.attr("y", function(d) {
				if (d.drawProfit >= 0)
					return y(d.drawProfit) + barOffsetY;
				else
					return height + barOffsetY;
			})
			.attr("height", function(d) {
				if (d.drawProfit >= 0)
					return height - y(d.drawProfit);
				else
					return height - y(-d.drawProfit);
			})
			.attr("width", function(d) {
				if (d.drawProfit < 0 && options.buySeed && options.buyFert)
					return barWidth - (barWidth / miniBar) * 2;
				else if (d.drawProfit < 0 && !options.buySeed && options.buyFert)
					return barWidth - barWidth / miniBar;
				else if (d.drawProfit < 0 && options.buySeed && !options.buyFert)
					return barWidth - barWidth / miniBar;
				else
					return barWidth;
			})
 			.attr("fill", function (d) {
 				if (d.drawProfit >= 0)
 					return "lime";
 				else
 					return "red";
 			});

    barsSeed = gSeedLoss.selectAll("rect")
        .data(cropList)
        .enter()
        .append("rect")
            .attr("x", function(d, i) { return x(i) + barOffsetX; })
            .attr("y", height + barOffsetY)
            .attr("height", function(d) {
                if (options.buySeed)
                    return height - y(-d.drawSeedLoss);
                else
                    return 0;
            })
            .attr("width", barWidth / miniBar)
            .attr("fill", "orange");

    barsFert = gFertLoss.selectAll("rect")
        .data(cropList)
        .enter()
        .append("rect")
            .attr("x", function(d, i) {
                if (options.buySeed)
                    return x(i) + barOffsetX + barWidth / miniBar;
                else
                    return x(i) + barOffsetX;
            })
            .attr("y", height + barOffsetY)
            .attr("height", function(d) {
                if (options.buyFert)
                    return height - y(-d.drawFertLoss);
                else
                    return 0;
            })
            .attr("width", barWidth / miniBar)
            .attr("fill", "brown");

    imgIcons = gIcons.selectAll("image")
        .data(cropList)
        .enter()
        .append("image")
            .attr("x", function(d, i) { return x(i) + barOffsetX; })
            .attr("y", function(d) {
                var baseY = (d.drawProfit >= 0) ? y(d.drawProfit) : height;
                var yPos = baseY + barOffsetY - barWidth - barPadding;
                var minY = barOffsetY + 2; // top margin so icons are not clipped
                return Math.max(yPos, minY);
            })
            .attr('width', barWidth)
            .attr('height', barWidth)
            .attr("href", function(d) { return "img/" + d.img; });

	barsTooltips = gTooltips.selectAll("rect")
		.data(cropList)
		.enter()
		.append("rect")
			.attr("x", function(d, i) { return x(i) + barOffsetX - barPadding/2; })
            .attr("y", function(d) {
                var baseY = (d.drawProfit >= 0) ? y(d.drawProfit) : height;
                var yPos = baseY + barOffsetY - barWidth - barPadding;
                var minY = barOffsetY + 2;
                return Math.max(yPos, minY);
            })
            .attr("height", function(d) {
                var topHeight = 0;

                if (d.drawProfit >= 0)
                    topHeight = height + barWidth + barPadding - y(d.drawProfit);
                else
                    topHeight = barWidth + barPadding;

                var lossArray = [0];
                var isROI = (options.average == 2 || options.average == 3);
                if (!isROI) {
                    if (options.buySeed)
                        lossArray.push(d.drawSeedLoss);
                    if (options.buyFert)
                        lossArray.push(d.drawFertLoss);
                }
                if (d.drawProfit < 0)
                    lossArray.push(d.drawProfit);

				var swapped;
			    do {
			        swapped = false;
			        for (var i = 0; i < lossArray.length - 1; i++) {
			            if (lossArray[i] > lossArray[i + 1]) {
			                var temp = lossArray[i];
			                lossArray[i] = lossArray[i + 1];
			                lossArray[i + 1] = temp;
			                swapped = true;
			            }
			        }
			    } while (swapped);

			    return topHeight + (height - y(-lossArray[0]));
			})
			.attr("width", barWidth + barPadding)
 			.attr("opacity", "0")
 			.attr("cursor", "pointer")
			.on("mouseover", function(event, d) {
				tooltip.selectAll("*").remove();
				tooltip.style("visibility", "visible");

				tooltip.append("h3").attr("class", "tooltipTitle").text(d.name);

				var tooltipTable = tooltip.append("table")
					.attr("class", "tooltipTable")
					.attr("cellspacing", 0);
				var tooltipTr;


				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("总收益：");
				if (d.profit > 0)
					tooltipTr.append("td").attr("class", "tooltipTdRightPos").text("+" + formatNumber(d.profit))
						.append("div").attr("class", "gold");
				else
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.profit))
						.append("div").attr("class", "gold");

				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("日收益：");
				if (d.averageProfit > 0)
					tooltipTr.append("td").attr("class", "tooltipTdRightPos").text("+" + formatNumber(d.averageProfit))
						.append("div").attr("class", "gold");
				else
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.averageProfit))
						.append("div").attr("class", "gold");

				if (options.buySeed || options.buyFert) {
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("总回报率：");
				if (d.totalReturnOnInvestment > 0)
					tooltipTr.append("td").attr("class", "tooltipTdRightPos").text("+" + formatNumber(d.totalReturnOnInvestment) + "%");
				else
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.totalReturnOnInvestment) + "%");

				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("日回报率：");
				if (d.averageReturnOnInvestment > 0)
					tooltipTr.append("td").attr("class", "tooltipTdRightPos").text("+" + formatNumber(d.averageReturnOnInvestment) + "%");
				else
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.averageReturnOnInvestment) + "%");
				}

				if (options.buySeed) {
					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("种子总成本：");
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.seedLoss))
						.append("div").attr("class", "gold");

					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeft").text("种子每日成本：");
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.averageSeedLoss))
						.append("div").attr("class", "gold");
				}

				if (options.buyFert) {
					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("肥料总成本：");
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.fertLoss))
						.append("div").attr("class", "gold");

					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeft").text("肥料每日成本：");
					tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(formatNumber(d.averageFertLoss))
						.append("div").attr("class", "gold");
				}


				//Ineligible crops are sold raw.
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("出售形式：");
				switch (options.produce) {
					case 0: 
						tooltipTr.append("td").attr("class", "tooltipTdRight").text("原物出售"); 
						
						tooltipTr = tooltipTable.append("tr");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text("售出数量：");

						if(d.profitData.quantitySold > 0 ){
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.quantitySold);
						}
						else
							tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(d.profitData.quantitySold);
						break;
					case 1:
						if (d.produce.jarType != null){
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.jarType);
							tooltipTr = tooltipTable.append("tr");
							tooltipTr.append("td").attr("class", "tooltipTdRight").text("售出数量：");

                            if(d.profitData.quantitySold > 0 ){
                                tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.quantitySold);
                                tooltipTr = tooltipTable.append("tr");
                                tooltipTr.append("td").attr("class", "tooltipTdRight").text("剩余原料：");
                                tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.excessProduce);
                            }
                            else
                                tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(d.profitData.quantitySold);
						}
						else if (options.sellRaw) {
                            tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text("原物出售");
							tooltipTr = tooltipTable.append("tr");
							tooltipTr.append("td").attr("class", "tooltipTdRight").text("售出数量：");
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.quantitySold);
						}
                        else
							tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text("无");
						break;
					case 2:
						if (d.produce.kegType != null){
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.kegType);
							tooltipTr = tooltipTable.append("tr");
							tooltipTr.append("td").attr("class", "tooltipTdRight").text("售出数量：");

                            if(d.profitData.quantitySold > 0 ){
                                tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.quantitySold);
                                tooltipTr = tooltipTable.append("tr");
                                tooltipTr.append("td").attr("class", "tooltipTdRight").text("剩余原料：");
                                tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.excessProduce);
                            }
                            else
                                tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(d.profitData.quantitySold);
						}
                        else if (options.sellRaw) {
                            tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text("原物出售");
							tooltipTr = tooltipTable.append("tr");
							tooltipTr.append("td").attr("class", "tooltipTdRight").text("售出数量：");
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.quantitySold);
						}
						else
							tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text("无");
						break;
					case 3: 
						tooltipTr.append("td").attr("class", "tooltipTdRight").text("种子"); 
						tooltipTr = tooltipTable.append("tr");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text("售出数量：");

						if(d.profitData.quantitySold > 0 ){
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.quantitySold);
						}
						else
							tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(d.profitData.quantitySold);
						break;
					case 4:
						if (d.produce.dehydratorType != null){
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.dehydratorType);
							tooltipTr = tooltipTable.append("tr");
							tooltipTr.append("td").attr("class", "tooltipTdRight").text("售出数量：");

							if(d.profitData.quantitySold > 0 ){
								tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.quantitySold);
								tooltipTr = tooltipTable.append("tr");
								tooltipTr.append("td").attr("class", "tooltipTdRight").text("剩余原料：");
								tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.excessProduce);
							}
							else
								tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text(d.profitData.quantitySold);
							
						}
						else if (options.sellRaw){
							tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text("原物出售");
							tooltipTr = tooltipTable.append("tr");
							tooltipTr.append("td").attr("class", "tooltipTdRight").text("售出数量：");
							tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.profitData.quantitySold);
						}
						else
							tooltipTr.append("td").attr("class", "tooltipTdRightNeg").text("无");
						break;
				}
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("持续天数：");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(options.days + " 天");
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("种植数量：");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.planted);
				tooltipTr = tooltipTable.append("tr");
				tooltipTr.append("td").attr("class", "tooltipTdLeft").text("收获次数：");
				tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.harvests);

				if (options.extra) {
                    var fertilizer = fertilizers[options.fertilizer];
                    var kegModifier = getKegModifier(d);
                    var caskModifier = canAgeKegType(d.produce.kegType) ? getCaskModifier() : 1;
					var kegPrice = d.produce.keg != null ? d.produce.keg * caskModifier : d.produce.price * kegModifier * caskModifier;
                    var dehydratorModifierByCrop = d.produce.dehydratorType != null ? getDehydratorModifier(d): 0;
                    var seedPrice = d.seeds.sell;
                    var initialGrow = 0;
                    if (options.skills.agri)
                        initialGrow += Math.floor(d.growth.initial * (fertilizer.growth - 0.1));
                    else
                        initialGrow += Math.floor(d.growth.initial * fertilizer.growth);

					tooltip.append("h3").attr("class", "tooltipTitleExtra").text("作物信息");
					tooltipTable = tooltip.append("table")
						.attr("class", "tooltipTable")
						.attr("cellspacing", 0);

                    if (!(d.isWildseed && options.skills.botanist)) {
    					tooltipTr = tooltipTable.append("tr");
    					tooltipTr.append("td").attr("class", "tooltipTdLeft").text("售价（普通）：");
    					tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.price)
    						.append("div").attr("class", "gold");
                        tooltipTr.append("td").attr("class", "tooltipTdRight").text("(" + (d.profitData.ratioN*100).toFixed(0) + "%)");
                    }
					if (d.name != "茶叶") {
                        if (!(d.isWildseed && options.skills.botanist)) {
    						tooltipTr = tooltipTable.append("tr");
    						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("售价（银星）：");
    						tooltipTr.append("td").attr("class", "tooltipTdRight").text(Math.trunc(d.produce.price * 1.25))
    							.append("div").attr("class", "gold");
                            tooltipTr.append("td").attr("class", "tooltipTdRight").text("(" + (d.profitData.ratioS*100).toFixed(0) + "%)");
    						tooltipTr = tooltipTable.append("tr");
    						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("售价（金星）：");
    						tooltipTr.append("td").attr("class", "tooltipTdRight").text(Math.trunc(d.produce.price * 1.5))
    							.append("div").attr("class", "gold");
                            tooltipTr.append("td").attr("class", "tooltipTdRight").text("(" + (d.profitData.ratioG*100).toFixed(0) + "%)");
                        }
                        if ((!d.isWildseed && fertilizers[options.fertilizer].ratio >= 3) || (d.isWildseed && options.skills.botanist)) {
    						tooltipTr = tooltipTable.append("tr");
    						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("售价（铱星）：");
    						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.price * 2)
    							.append("div").attr("class", "gold");
                            tooltipTr.append("td").attr("class", "tooltipTdRight").text("(" + (d.profitData.ratioI*100).toFixed(0) + "%)");
                        }
					}
					tooltipTr = tooltipTable.append("tr");
					if (d.produce.jarType) {
						tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("售价（" + d.produce.jarType + "）：");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.price * 2 + 50)
						.append("div").attr("class", "gold");
					}
					else {
						tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("售价（罐头瓶）：");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text("无");
					}
					tooltipTr = tooltipTable.append("tr");
					if (d.produce.kegType) {
						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("售价（" + d.produce.kegType + "）：");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(Math.round(kegPrice))
						.append("div").attr("class", "gold");
					}
					else {
						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("售价（酒桶）：");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text("无");
					}
					tooltipTr = tooltipTable.append("tr");
					if (d.produce.dehydratorType) {
						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("售价（" + d.produce.dehydratorType + "）：");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(dehydratorModifierByCrop)
						.append("div").attr("class", "gold");
					}
					else {
						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("售价（烘干机）：");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text("无");
					}
                    tooltipTr = tooltipTable.append("tr");
                    tooltipTr.append("td").attr("class", "tooltipTdLeft").text("售价（种子）：");
                    tooltipTr.append("td").attr("class", "tooltipTdRight").text(seedPrice)
                    .append("div").attr("class", "gold");


					var first = true;
					if (d.seeds.pierre > 0) {
						tooltipTr = tooltipTable.append("tr");
						tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("种子（皮埃尔）：");
						first = false;
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.seeds.pierre)
						.append("div").attr("class", "gold");
					}
					if (d.seeds.joja > 0) {
						tooltipTr = tooltipTable.append("tr");
						if (first) {
							tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("种子（Joja）：");
							first = false;
						}
						else
							tooltipTr.append("td").attr("class", "tooltipTdLeft").text("种子（Joja）：");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.seeds.joja)
						.append("div").attr("class", "gold");
					}
					if (d.seeds.special > 0) {
						tooltipTr = tooltipTable.append("tr");
						if (first) {
							tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("种子（特殊）：");
							first = false;
						}
						else
							tooltipTr.append("td").attr("class", "tooltipTdLeft").text("种子（特殊）：");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.seeds.special)
						.append("div").attr("class", "gold");
						tooltipTr = tooltipTable.append("tr");
						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.seeds.specialLoc);
					}

					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeftSpace").text("初次生长：");
					tooltipTr.append("td").attr("class", "tooltipTdRight").text(initialGrow + " 天");
					tooltipTr = tooltipTable.append("tr");
					tooltipTr.append("td").attr("class", "tooltipTdLeft").text("再生周期：");
					if (d.growth.regrow > 0)
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.growth.regrow + " 天");
					else
						tooltipTr.append("td").attr("class", "tooltipTdRight").text("不适用");
					if (d.produce.extra > 0) {
						tooltipTr = tooltipTable.append("tr");
						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("额外产物：");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text(d.produce.extra);
						tooltipTr = tooltipTable.append("tr");
						tooltipTr.append("td").attr("class", "tooltipTdLeft").text("额外概率：");
						tooltipTr.append("td").attr("class", "tooltipTdRight").text((d.produce.extraPerc * 100) + "%");
					}



				}
			})
			.on("mousemove", function(event) {
				tooltip.style("top", (event.pageY - 16) + "px").style("left",(event.pageX + 20) + "px");
			})
			.on("mouseout", function() { tooltip.style("visibility", "hidden"); })
			.on("click", function(event, d) { 
				if(!options.disableLinks) {
					var w = window.open(d.url, "_blank", "noopener,noreferrer");
					if (w) { try { w.opener = null; } catch (e) {} }
				}
			});

	// Keep axis and title drawn above bars and icons
	gAxis.raise();
	gTitle.raise();
	gTooltips.raise();

}

/*
 * Updates the already rendered graph, showing animations.
 */
function updateGraph() {
	updateBarWidthFromCropList();
	var x = updateScaleX();
	var y = updateScaleY();
	var ax = updateScaleAxis();

        var isROI = (options.average == 2 || options.average == 3);
        var yAxis = d3.axisLeft(ax)
                .tickValues(isROI ? makePercentTicks(ax) : makeAdaptiveTicks(ax))
                .tickFormat(isROI ? function(d){ return d + '%'; } : formatK);

	axisY.transition()
		.call(yAxis);

    title = gTitle.attr("class", "Title")
    .append("text")
    .attr("class", "axis")
    .attr("x", 12)
    .attr("y", 12)
    .style("text-anchor", "start")
    .text(graphDescription);

	barsProfit.data(cropList)
		.transition()
			.attr("x", function(d, i) {
				if (d.drawProfit < 0 && options.buySeed && options.buyFert)
					return x(i) + barOffsetX + (barWidth / miniBar) * 2;
				else if (d.drawProfit < 0 && !options.buySeed && options.buyFert)
					return x(i) + barOffsetX + barWidth / miniBar;
				else if (d.drawProfit < 0 && options.buySeed && !options.buyFert)
					return x(i) + barOffsetX + barWidth / miniBar;
				else
					return x(i) + barOffsetX;
			})
			.attr("y", function(d) {
				if (d.drawProfit >= 0)
					return y(d.drawProfit) + barOffsetY;
				else
					return height + barOffsetY;
			})
			.attr("height", function(d) {
				if (d.drawProfit >= 0)
					return height - y(d.drawProfit);
				else
					return height - y(-d.drawProfit);
			})
			.attr("width", function(d) {
				if (d.drawProfit < 0 && options.buySeed && options.buyFert)
					return barWidth - (barWidth / miniBar) * 2;
				else if (d.drawProfit < 0 && !options.buySeed && options.buyFert)
					return barWidth - barWidth / miniBar;
				else if (d.drawProfit < 0 && options.buySeed && !options.buyFert)
					return barWidth - barWidth / miniBar;
				else
					return barWidth;
			})
 			.attr("fill", function (d) {
 				if (d.drawProfit >= 0)
 					return "lime";
 				else
 					return "red";
 			});

    barsSeed.data(cropList)
        .transition()
            .attr("x", function(d, i) { return x(i) + barOffsetX; })
            .attr("y", height + barOffsetY)
            .attr("height", function(d) {
                if (options.buySeed)
                    return height - y(-d.drawSeedLoss);
                else
                    return 0;
            })
            .attr("width", barWidth / miniBar)
            .attr("fill", "orange");

    barsFert.data(cropList)
        .transition()
            .attr("x", function(d, i) {
                if (options.buySeed)
                    return x(i) + barOffsetX + barWidth / miniBar;
                else
                    return x(i) + barOffsetX;
            })
            .attr("y", height + barOffsetY)
            .attr("height", function(d) {
                if (options.buyFert)
                    return height - y(-d.drawFertLoss);
                else
                    return 0;
            })
            .attr("width", barWidth / miniBar)
            .attr("fill", "brown");

 	imgIcons.data(cropList)
		.transition()
			.attr("x", function(d, i) { return x(i) + barOffsetX; })
			.attr("y", function(d) {
				if (d.drawProfit >= 0)
					return y(d.drawProfit) + barOffsetY - barWidth - barPadding;
				else
					return height + barOffsetY - barWidth - barPadding;
			})
		    .attr('width', barWidth)
		    .attr('height', barWidth)
		    .attr("href", function(d) { return "img/" + d.img; });

	barsTooltips.data(cropList)
		.transition()
			.attr("x", function(d, i) { return x(i) + barOffsetX - barPadding/2; })
			.attr("y", function(d) {
				if (d.drawProfit >= 0)
					return y(d.drawProfit) + barOffsetY - barWidth - barPadding;
				else
					return height + barOffsetY - barWidth - barPadding;
			})
			.attr("height", function(d) {
				var topHeight = 0;

				if (d.drawProfit >= 0)
					topHeight = height + barWidth + barPadding - y(d.drawProfit);
				else
					topHeight = barWidth + barPadding;

                var lossArray = [0];
                if (options.buySeed)
                    lossArray.push(d.drawSeedLoss);
                if (options.buyFert)
                    lossArray.push(d.drawFertLoss);
				if (d.drawProfit < 0)
					lossArray.push(d.drawProfit);

				var swapped;
			    do {
			        swapped = false;
			        for (var i = 0; i < lossArray.length - 1; i++) {
			            if (lossArray[i] > lossArray[i + 1]) {
			                var temp = lossArray[i];
			                lossArray[i] = lossArray[i + 1];
			                lossArray[i + 1] = temp;
			                swapped = true;
			            }
			        }
			    } while (swapped);

			    return topHeight + (height - y(-lossArray[0]));
			})
			.attr("width", barWidth + barPadding);

	// Ensure axis and title remain above bars after updates
	gAxis.raise();
	gTitle.raise();
	gTooltips.raise();
}

function updateSeasonNames() {
    if (options.crossSeason) {
        document.getElementById('season_0').innerHTML = "春夏";
        document.getElementById('season_1').innerHTML = "夏秋";
        document.getElementById('season_2').innerHTML = "秋冬";
        document.getElementById('season_3').innerHTML = "冬春";
    }
    else {
        document.getElementById('season_0').innerHTML = "春季";
        document.getElementById('season_1').innerHTML = "夏季";
        document.getElementById('season_2').innerHTML = "秋季";
        document.getElementById('season_3').innerHTML = "冬季";
    }
}

/*
 * Updates all options and data, based on the options set in the HTML.
 * After that, filters, values and sorts all the crops again.
 */
function updateData() {

    options.season = parseInt(document.getElementById('select_season').value);
    const isGreenhouse = options.season == 4;

	options.produce = parseInt(document.getElementById('select_produce').value);

	var tr_equipmentID = document.getElementById('tr_equipment');
	var tr_check_sellRawID = document.getElementById('tr_check_sellRaw');
	var tr_check_sellExcessID = document.getElementById('tr_check_sellExcess');
	var tr_check_byHarvestID = document.getElementById('tr_check_byHarvest');
	var tr_select_agingID = document.getElementById('tr_select_aging');

    if (options.produce == 0 || options.produce == 3) {
		tr_equipmentID.classList.add('hidden');
		tr_check_sellRawID.classList.add('hidden');
		tr_check_sellExcessID.classList.add('hidden');
		tr_check_byHarvestID.classList.add('hidden');
		tr_select_agingID.classList.add('hidden');
    }
	else if (options.produce == 1 || options.produce == 2) {
		tr_equipmentID.classList.remove('hidden');
		tr_check_sellRawID.classList.remove('hidden');
		tr_check_sellExcessID.classList.remove('hidden');
		tr_check_byHarvestID.classList.add('hidden');
		if(options.produce == 2){
			tr_select_agingID.classList.remove('hidden');
		} else {
			tr_select_agingID.classList.add('hidden');
		}
	}
    else {		
		tr_equipmentID.classList.remove('hidden');
		tr_check_sellRawID.classList.remove('hidden');
		tr_check_sellExcessID.classList.remove('hidden');
		tr_check_byHarvestID.classList.remove('hidden');
		tr_select_agingID.classList.add('hidden');
    }
    options.sellRaw 	= document.getElementById('check_sellRaw').checked;	
    options.sellExcess 	= document.getElementById('check_sellExcess').checked;
    options.byHarvest 	= document.getElementById('check_byHarvest').checked;

    if (options.produce == 0 || options.produce == 3) {
        document.getElementById('equipment').disabled = true;
        document.getElementById('equipment').style.cursor = "default";
    }
    else {
        document.getElementById('equipment').disabled = false;
        document.getElementById('equipment').style.cursor = "text";
    }
    if (document.getElementById('equipment').value < 0)
        document.getElementById('equipment').value = 0;
    options.equipment = parseInt(document.getElementById('equipment').value);

    if (options.produce == 2) {
        document.getElementById('select_aging').disabled = false;
        document.getElementById('select_aging').style.cursor = "pointer";
    }
    else {
        document.getElementById('select_aging').disabled = true;
        document.getElementById('select_aging').style.cursor = "default";
        document.getElementById('select_aging').value = 0;
    }
    options.aging = parseInt(document.getElementById('select_aging').value);

	if (document.getElementById('max_seed_money').value < 0)
		document.getElementById('max_seed_money').value = '0';
	options.maxSeedMoney = parseInt(document.getElementById('max_seed_money').value);
	if (isNaN(options.maxSeedMoney)) {
		options.maxSeedMoney = 0;
	}

	options.average = parseInt(document.getElementById('select_profit_display').value);
    
    options.crossSeason = document.getElementById('cross_season').checked;

    if (!isGreenhouse) {
        document.getElementById('number_days').disabled = true;
        document.getElementById('cross_season').disabled = false;
        document.getElementById('cross_season').style.cursor = "pointer";
        document.getElementById('current_day').disabled = false;
        document.getElementById('current_day').style.cursor = "text";

        if (document.getElementById('current_day').value <= 0)
            document.getElementById('current_day').value = 1;
        if (options.crossSeason) {
            document.getElementById('number_days').value = 56;
            if (document.getElementById('current_day').value > 56)
                document.getElementById('current_day').value = 56;
            options.days = 57 - document.getElementById('current_day').value;
        }
        else {
            document.getElementById('number_days').value = 28;
            if (document.getElementById('current_day').value > 28)
                  document.getElementById('current_day').value = 28;
            options.days = 29 - document.getElementById('current_day').value;
        }
    } else {
        document.getElementById('number_days').disabled = false;
        document.getElementById('cross_season').disabled = true;
        document.getElementById('cross_season').style.cursor = "default";
        document.getElementById('current_day').disabled = true;
        document.getElementById('current_day').style.cursor = "default";
        
        document.getElementById('current_day').value = 1;

        if (document.getElementById('number_days').value > 100000)
            document.getElementById('number_days').value = 100000;
        options.days = document.getElementById('number_days').value;
    }

	options.seeds.pierre = document.getElementById('check_seedsPierre').checked;
	options.seeds.joja = document.getElementById('check_seedsJoja').checked;
	options.seeds.special = document.getElementById('check_seedsSpecial').checked;

	options.buySeed = document.getElementById('check_buySeed').checked;

    options.replant = document.getElementById('check_replant').checked;

    if (!options.replant || isGreenhouse) {
        document.getElementById('check_nextyear').disabled = true;
        document.getElementById('check_nextyear').style.cursor = "default";
        document.getElementById('check_nextyear').checked = false;
    }
    else {
        document.getElementById('check_nextyear').disabled = false;
        document.getElementById('check_nextyear').style.cursor = "pointer";
    }
    options.nextyear = document.getElementById('check_nextyear').checked;

    if (document.getElementById('number_planted').value <= 0)
        document.getElementById('number_planted').value = 1;
    if (options.replant && parseInt(document.getElementById('number_planted').value) % 2 == 1)
        document.getElementById('number_planted').value = parseInt(document.getElementById('number_planted').value) + 1;

    options.planted = document.getElementById('number_planted').value;

	options.fertilizer = parseInt(document.getElementById('select_fertilizer').value);

	options.buyFert = document.getElementById('check_buyFert').checked;
	
	options.fertilizerSource = parseInt(document.getElementById('speed_gro_source').value);

	if (document.getElementById('farming_level').value <= 0)
		document.getElementById('farming_level').value = 0;
	if (document.getElementById('farming_level').value > 13)
		document.getElementById('farming_level').value = 13;
	options.level = parseInt(document.getElementById('farming_level').value);

	if (options.level >= 5) {
		document.getElementById('check_skillsTill').disabled = false;
		document.getElementById('check_skillsTill').style.cursor = "pointer";
		options.skills.till = document.getElementById('check_skillsTill').checked;
	}
	else {
		document.getElementById('check_skillsTill').disabled = true;
		document.getElementById('check_skillsTill').style.cursor = "default";
		document.getElementById('check_skillsTill').checked = false;
	}

	if (options.level >= 10 && options.skills.till) {
		document.getElementById('select_skills').disabled = false;
		document.getElementById('select_skills').style.cursor = "pointer";
	}
	else {
		document.getElementById('select_skills').disabled = true;
		document.getElementById('select_skills').style.cursor = "default";
		document.getElementById('select_skills').value = 0;
	}
	if (document.getElementById('select_skills').value == 1) {
		options.skills.agri = true;
		options.skills.arti = false;
	}
	else if (document.getElementById('select_skills').value == 2) {
		options.skills.agri = false;
		options.skills.arti = true;
	}
	else {
		options.skills.agri = false;
		options.skills.arti = false;
	}

    if (document.getElementById('foraging_level').value <= 0)
        document.getElementById('foraging_level').value = 0;
    if (document.getElementById('foraging_level').value > 13)
        document.getElementById('foraging_level').value = 13;
    options.foragingLevel = parseInt(document.getElementById('foraging_level').value);

    if (options.foragingLevel >= 5) {
        document.getElementById('check_skillsGatherer').disabled = false;
        document.getElementById('check_skillsGatherer').style.cursor = "pointer";
    }
    else {
        document.getElementById('check_skillsGatherer').disabled = true;
        document.getElementById('check_skillsGatherer').style.cursor = "default";
        document.getElementById('check_skillsGatherer').checked = false;
    }
    options.skills.gatherer = document.getElementById('check_skillsGatherer').checked;

    if (options.foragingLevel >= 10 && options.skills.gatherer) {
        document.getElementById('check_skillsBotanist').disabled = false;
        document.getElementById('check_skillsBotanist').style.cursor = "pointer";
    }
    else {
        document.getElementById('check_skillsBotanist').disabled = true;
        document.getElementById('check_skillsBotanist').style.cursor = "default";
        document.getElementById('check_skillsBotanist').checked = false;
    }
    options.skills.botanist = document.getElementById('check_skillsBotanist').checked;

	options.foodIndex = document.getElementById('select_food').value;
	options.foodLevel = parseInt(document.getElementById('select_food').options[options.foodIndex].value);
	if (options.buyFert && options.fertilizer == 4)
		document.getElementById('speed_gro_source').disabled = false;
	else
		document.getElementById('speed_gro_source').disabled = true;

	options.extra = document.getElementById('check_extra').checked;
	options.disableLinks = document.getElementById('disable_links').checked;

    updateSeasonNames();

	// Persist the options object into the URL hash.
	window.location.hash = encodeURIComponent(serialize(options));

	fetchCrops();
	valueCrops();
	sortCrops();
}

/*
 * Called once on startup to draw the UI.
 */
function initial() {
	optionsLoad();
	updateData();
	renderGraph();
}

/*
 * Called on every option change to animate the graph.
 */
function refresh() {
	updateData();
	gTitle.selectAll("*").remove();
	updateGraph();
}

/*
 * Parse out and validate the options from the URL hash.
 */
function optionsLoad() {
	if (!window.location.hash) return;

	options = deserialize(window.location.hash.slice(1));

	function validBoolean(q) {
		return q == 1;
	}

	function validIntRange(min, max, num) {
		return num < min ? min : num > max ? max : parseInt(num, 10);
	}

	options.season = validIntRange(0, 4, options.season);
	document.getElementById('select_season').value = options.season;

	options.produce = validIntRange(0, 4, options.produce);
	document.getElementById('select_produce').value = options.produce;

    options.equipment = validIntRange(0, MAX_INT, options.equipment);
    document.getElementById('equipment').value = options.equipment;

    options.sellRaw = validBoolean(options.sellRaw);
    document.getElementById('check_sellRaw').checked = options.sellRaw;

    options.sellExcess = validBoolean(options.sellExcess);
    document.getElementById('check_sellExcess').checked = options.sellExcess;

    options.byHarvest = validBoolean(options.byHarvest);
    document.getElementById('check_byHarvest').checked = options.byHarvest;

    options.aging = validIntRange(0, 3, options.aging);
    document.getElementById('select_aging').value = options.aging;

	options.planted = validIntRange(1, MAX_INT, options.planted);
	document.getElementById('number_planted').value = options.planted;

    options.maxSeedMoney = validIntRange(0, MAX_INT, options.maxSeedMoney);
    document.getElementById('max_seed_money').value = options.maxSeedMoney;

	options.average = validIntRange(0,3,options.average);
	document.getElementById('select_profit_display').checked = options.average;

    options.crossSeason = validBoolean(options.crossSeason);
    document.getElementById('cross_season').checked = options.crossSeason;

    var daysMax = 0;
    if (options.crossSeason)
        daysMax = options.season === 4 ? MAX_INT : 56;
    else
        daysMax = options.season === 4 ? MAX_INT : 28;

    options.days = validIntRange(1, daysMax, options.days);
    if (options.season === 4) {
        document.getElementById('number_days').value = options.days;
    } 
    else {
        if (options.crossSeason) {
            document.getElementById('number_days').value = 56;
            document.getElementById('current_day').value = 57 - options.days;
        }
        else {
            document.getElementById('number_days').value = 28;
            document.getElementById('current_day').value = 29 - options.days;
        }
    }

	options.seeds.pierre = validBoolean(options.seeds.pierre);
	document.getElementById('check_seedsPierre').checked = options.seeds.pierre;

	options.seeds.joja = validBoolean(options.seeds.joja);
	document.getElementById('check_seedsJoja').checked = options.seeds.joja;

	options.seeds.special = validBoolean(options.seeds.special);
	document.getElementById('check_seedsSpecial').checked = options.seeds.special;

	options.buySeed = validBoolean(options.buySeed);
	document.getElementById('check_buySeed').checked = options.buySeed;

    options.replant = validBoolean(options.replant);
    document.getElementById('check_replant').checked = options.replant;

    options.nextyear = validBoolean(options.nextyear);
    document.getElementById('check_nextyear').checked = options.nextyear;

	options.fertilizer = validIntRange(0, 6, options.fertilizer);
	document.getElementById('select_fertilizer').value = options.fertilizer;

    options.fertilizerSource = validIntRange(0, 1, options.fertilizerSource);
    document.getElementById('speed_gro_source').value = options.fertilizerSource;

	options.buyFert = validBoolean(options.buyFert);
	document.getElementById('check_buyFert').checked = options.buyFert;

	options.level = validIntRange(0, 13, options.level);
	document.getElementById('farming_level').value = options.level;

	options.skills.till = validBoolean(options.skills.till);
	document.getElementById('check_skillsTill').checked = options.skills.till;

	options.skills.agri = validBoolean(options.skills.agri);
	options.skills.arti = validBoolean(options.skills.arti);
	const binaryFlags = options.skills.agri + options.skills.arti * 2;
	document.getElementById('select_skills').value = binaryFlags;

    options.foragingLevel = validIntRange(0, 13, options.foragingLevel);
    document.getElementById('foraging_level').value = options.foragingLevel;

    options.skills.gatherer = validBoolean(options.skills.gatherer);
    document.getElementById('check_skillsGatherer').checked = options.skills.gatherer;

    options.skills.botanist = validBoolean(options.skills.botanist);
    document.getElementById('check_skillsBotanist').checked = options.skills.botanist;

	options.foodIndex = validIntRange(0, 6, options.foodIndex);
	document.getElementById('select_food').value = options.foodIndex;

	options.extra = validBoolean(options.extra);
	document.getElementById('check_extra').checked = options.extra;

	options.disableLinks = validBoolean(options.disableLinks);
	document.getElementById('disable_links').checked = options.disableLinks;

    updateSeasonNames();
}

function deserialize(str) {
    var json = `(${str})`
        .replace(/_/g, ' ')
        .replace(/-/g, ',')
        .replace(/\(/g, '{')
        .replace(/\)/g, '}')
        .replace(/([a-z]+)/gi, '"$1":')
        .replace(/"(true|false)":/gi, '$1');

    //console.log(json);

	return JSON.parse(json);
}

function serialize(obj) {

	return Object.keys(obj)
		.reduce((acc, key) => {
			return /^(?:true|false|\d+)$/i.test('' + obj[key])
				? `${acc}-${key}_${obj[key]}`
				: `${acc}-${key}_(${serialize(obj[key])})`;
		}, '')
		.slice(1);
}

/*
 * Called when changing season/seeds, to redraw the graph.
 */
function rebuild() {
	gAxis.selectAll("*").remove();
	gProfit.selectAll("*").remove();
	gSeedLoss.selectAll("*").remove();
	gFertLoss.selectAll("*").remove();
	gIcons.selectAll("*").remove();
	gTooltips.selectAll("*").remove();
	gTitle.selectAll("*").remove();

	updateData();
	renderGraph();
}

document.addEventListener('DOMContentLoaded', initial);
document.addEventListener('click', function (event) {
	if (event.target.id === 'reset') window.location = 'index.html';
});
