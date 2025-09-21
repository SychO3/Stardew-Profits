# Imports must be at the top
import json
from pathlib import Path


def parse_traveler_data(objects_map: dict, shops_data: dict):
    """Parse Traveler shop to determine explicit prices and random-pool eligibility for seed items.
    Returns:
      - explicit_prices: dict of seed_id(str) -> fixed price(int)
      - in_random_pool: set of seed_id(str) potentially sold via random objects pool (price ~100-1000)
    """
    explicit_prices = {}
    in_random_pool = set()

    traveler = shops_data.get("Traveler") or {}
    items = traveler.get("Items") or []

    # Identify the RandomObjects rule and extract id range if present
    random_min_id, random_max_id = 2, 789  # defaults observed in data
    random_rule_found = False
    for it in items:
        if it.get("Id") == "RandomObjects" and isinstance(it.get("ItemId"), str) and "RANDOM_ITEMS (O)" in it.get("ItemId"):
            # format: "RANDOM_ITEMS (O) 2 789 @requirePrice @isRandomSale"
            parts = it["ItemId"].split()
            try:
                idx = parts.index('(O)') if '(O)' in parts else None
            except ValueError:
                idx = None
            # Simpler parse: numbers typically at positions - need robust fallback
            nums = [p for p in parts if p.isdigit()]
            if len(nums) >= 2:
                random_min_id, random_max_id = int(nums[0]), int(nums[1])
            random_rule_found = True
            break

    # Build explicit price overrides for object ids with fixed Price
    for it in items:
        item_id = it.get("ItemId")
        price = it.get("Price")
        use_obj_price = it.get("UseObjectDataPrice")
        # We care about explicit object entries like "(O)433" with a fixed numeric Price
        if isinstance(item_id, str) and item_id.startswith("(O)") and isinstance(price, (int, float)) and not use_obj_price:
            try:
                oid = item_id.strip()[3:]  # after (O)
                oid_int = int(oid)
            except Exception:
                continue
            # Only consider seeds
            obj = objects_map.get(str(oid_int)) or {}
            if obj.get("Type") == "Seeds":
                explicit_prices[str(oid_int)] = int(price)

    # Determine random-pool eligibility for seeds based on Objects.json fields and id range
    for sid, obj in objects_map.items():
        try:
            oid = int(sid)
        except Exception:
            continue
        if obj.get("Type") != "Seeds":
            continue
        category = obj.get("Category")
        obj_type = obj.get("Type")  # "Seeds"
        # Apply Traveler RandomObjects per-item conditions approximation
        # 1) id in range
        if not (random_min_id <= oid <= random_max_id):
            continue
        # 2) has explicit object category (we approximate by Category being an int and not 0?) and not -999
        if not isinstance(category, int) or category == -999:
            continue
        # 3) not Quest/Minerals/Arch types (Seeds is fine)
        in_random_pool.add(str(oid))

    return explicit_prices, in_random_pool


def parse_other_shops(objects_map: dict, shops_data: dict):
    """Parse non-Pierre/Joja/Traveler shops to determine fixed special locations and prices for seeds.
    Returns: dict seed_id(str) -> { 'shop': shop_name, 'price': int }
    """
    special_map = {}
    exclude = {"SeedShop", "Joja", "Traveler"}
    for shop_name, shop in shops_data.items():
        if shop_name in exclude:
            continue
        # Exclude festival/temporary shops from specialLoc to avoid duplicating core shop availability
        if isinstance(shop_name, str) and shop_name.startswith("Festival_"):
            continue
        if not isinstance(shop, dict):
            continue
        items = shop.get("Items") or []
        for it in items:
            item_id = it.get("ItemId")
            if not isinstance(item_id, str) or not item_id.startswith("(O)"):
                continue
            try:
                oid = int(item_id.strip()[3:])
            except Exception:
                continue
            obj = objects_map.get(str(oid)) or {}
            if obj.get("Type") != "Seeds":
                continue
            price = it.get("Price")
            use_obj_price = bool(it.get("UseObjectDataPrice"))
            resolved = None
            # Island Trader uses TradeItemId instead of numeric price
            if shop_name == "IslandTrade":
                resolved = 0
                special_map[str(oid)] = {"shop": "Island Trader", "price": resolved}
                continue
            if isinstance(price, (int, float)) and price > 0 and not it.get("IgnoreShopPriceModifiers"):
                resolved = int(price)
            elif use_obj_price:
                resolved = int(obj.get("Price", 0))
            else:
                # Heuristic for Sandy (Oasis): seed price is generally 2x Objects price (e.g., Rhubarb 50->100)
                if shop_name == "Sandy":
                    base = obj.get("Price", 0) or 0
                    resolved = int(base * 2)
            if resolved is not None:
                special_map[str(oid)] = {"shop": shop_name, "price": resolved}
    return special_map


def parse_oasis_prices(objects_map: dict, shops_data: dict):
    """Return mapping of seed_id(str) -> price for Oasis (Sandy) shop."""
    prices = {}
    shop = shops_data.get("Sandy") or {}
    items = shop.get("Items") or []
    for it in items:
        item_id = it.get("ItemId")
        price = it.get("Price")
        if not isinstance(item_id, str) or not item_id.startswith("(O)"):
            continue
        try:
            oid = int(item_id.strip()[3:])
        except Exception:
            continue
        obj = objects_map.get(str(oid)) or {}
        if obj.get("Type") != "Seeds":
            continue
        resolved = None
        if isinstance(price, (int, float)) and price > 0:
            resolved = int(price)
        elif it.get("UseObjectDataPrice"):
            resolved = int(obj.get("Price", 0) or 0)
        else:
            base = int(obj.get("Price", 0) or 0)
            if base > 0:
                resolved = int(base * 2)
        if resolved is not None:
            prices[str(oid)] = resolved
    return prices


def parse_island_trader_prices(objects_map: dict, shops_data: dict):
    """Return mapping of seed_id(str) -> derived coin value for Island Trader (barter).
    We convert barter cost into coin value as sum(TradeItemAmount * TradeItem sell price).
    """
    prices = {}
    shop = shops_data.get("IslandTrade") or {}
    items = shop.get("Items") or []
    for it in items:
        item_id = it.get("ItemId")
        trade_item_id = it.get("TradeItemId")
        trade_amount = it.get("TradeItemAmount") or 1
        if not isinstance(item_id, str) or not item_id.startswith("(O)"):
            continue
        try:
            oid = int(item_id.strip()[3:])
        except Exception:
            continue
        seed_obj = objects_map.get(str(oid)) or {}
        if seed_obj.get("Type") != "Seeds":
            continue
        # Compute barter value
        value = 0
        if isinstance(trade_item_id, str):
            try:
                if trade_item_id.startswith("(O)"):
                    tid = int(trade_item_id.strip()[3:])
                elif trade_item_id.startswith("(F)") or trade_item_id.startswith("(H)") or trade_item_id.startswith("(P)") or trade_item_id.startswith("(BC)"):
                    # Non-object barter: skip valuation (leave 0)
                    tid = None
                else:
                    tid = int(trade_item_id)
            except Exception:
                tid = None
            if tid is not None:
                t_obj = objects_map.get(str(tid)) or {}
                t_price = int(t_obj.get("Price", 0) or 0)
                try:
                    amt = int(trade_amount)
                except Exception:
                    amt = 1
                value = t_price * max(1, amt)
        prices[str(oid)] = int(value)
    return prices

def parse_seedshop_prices(objects_map: dict, shops_data: dict):
    """Return mapping of seed_id(str) -> price for Pierre's SeedShop."""
    prices = {}
    shop = shops_data.get("SeedShop") or {}
    items = shop.get("Items") or []
    for it in items:
        item_id = it.get("ItemId")
        price = it.get("Price")
        if not isinstance(item_id, str) or not item_id.startswith("(O)"):
            continue
        try:
            oid = int(item_id.strip()[3:])
        except Exception:
            continue
        obj = objects_map.get(str(oid)) or {}
        if obj.get("Type") != "Seeds":
            continue
        if isinstance(price, (int, float)) and price > 0:
            # Pierre's SeedShop uses its own listed Price when provided
            prices[str(oid)] = int(price)
        else:
            # Fallback: many SeedShop seasonal entries use Price=-1; derive as 2x seed base sell price
            base = int(obj.get("Price", 0) or 0)
            if base > 0:
                prices[str(oid)] = int(base * 2)
    return prices


def parse_joja_prices(objects_map: dict, shops_data: dict):
    """Return mapping of seed_id(str) -> price for Joja Mart."""
    prices = {}
    shop = shops_data.get("Joja") or {}
    items = shop.get("Items") or []
    # Detect NonMemberMarkup (1.25x) at shop level
    joja_multiplier = 1.0
    for pm in (shop.get("PriceModifiers") or []):
        if pm.get("Id") == "NonMemberMarkup" and isinstance(pm.get("Amount"), (int, float)):
            joja_multiplier = float(pm.get("Amount"))
            break
    for it in items:
        item_id = it.get("ItemId")
        price = it.get("Price")
        if not isinstance(item_id, str) or not item_id.startswith("(O)"):
            continue
        try:
            oid = int(item_id.strip()[3:])
        except Exception:
            continue
        obj = objects_map.get(str(oid)) or {}
        if obj.get("Type") != "Seeds":
            continue
        if isinstance(price, (int, float)) and price > 0:
            # Apply shop-level NonMemberMarkup unless item ignores modifiers
            if it.get("IgnoreShopPriceModifiers"):
                prices[str(oid)] = int(price)
            else:
                prices[str(oid)] = int(round(price * joja_multiplier))
        else:
            # Fallback: derive from Pierre price if available (Joja ~ 1.25x Pierre)
            # If Pierre not yet computed here, caller will have its full map; we cannot access it here, so use object base
            base = int((objects_map.get(str(oid)) or {}).get("Price", 0) or 0)
            if base > 0:
                pierre_guess = base * 2
                prices[str(oid)] = int(round(pierre_guess * joja_multiplier))
    return prices


# Resolve data files relative to this script's directory so it works from any CWD
BASE_DIR = Path(__file__).resolve().parent
CROPS_PATH = BASE_DIR / 'Content (unpacked)/Data/Crops.json'
OBJECTS_PATH = BASE_DIR / 'Content (unpacked)/Data/Objects.json'
SHOPS_PATH = BASE_DIR / 'Content (unpacked)/Data/Shops.json'
ZH_OBJECTS_PATH = BASE_DIR / 'Content (unpacked)/Strings/Objects.zh-CN.json'


def load_json(file_path: Path):
    if not file_path.exists():
        raise FileNotFoundError(
            f"Data file not found: {file_path}\n"
            f"Computed from script directory: {BASE_DIR}\n"
            f"Current working directory is: {Path.cwd()}"
        )
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)


print("Loading crops...")
crops = load_json(CROPS_PATH)
objects = load_json(OBJECTS_PATH)
shops = load_json(SHOPS_PATH)
try:
    zh_objects = load_json(ZH_OBJECTS_PATH)
except Exception:
    zh_objects = {}


  # "carrot": {
  #   "name": "胡萝卜", // 名称
  #   "url": "https://zh.stardewvalleywiki.com/胡萝卜", // 维基链接
  #   "img": "carrot.png", // 图片文件名
  #   "seeds": { // 种子信息
  #     "sell": 15,  // 出售价格
  #     "pierre": 0,  // 杂货店(皮埃尔) 价格
  #     "joja": 0,  // Joja超市 价格
  #     "special": 0,  // 特殊商店 价格
  #     "specialLoc": "无法购买",  // 购买地点
  #     "specialUrl": "https://zh.stardewvalleywiki.com/胡萝卜种子" // 种子维基链接
  #   },
  #   "growth": {  // 生长信息
  #     "initial": 3,  // 初始生长天数
  #     "regrow": 0  // 再生天数，0表示不再生
  #   },
  #   "produce": {  // 产出信息
  #     "extra": 0,  // 额外产出数量
  #     "extraPerc": 0,  // 额外产出概率
  #     "price": 35,  // 出售价格
  #     "jarType": "腌菜",  // 罐头类型
  #     "kegType": "果汁"  // 酿酒类型
  #   }
  # },


# Helper: determine processing types prioritizing precise Keg outputs when known
def infer_processing_types(produce_id: str, produce_name: str, category: int):
    # Known Keg exceptions mapping by produce object ID (string) or normalized name
    keg_exceptions_by_id = {
        "304": "Pale Ale",   # Hops -> Pale Ale
        "262": "Beer",       # Wheat -> Beer
        "433": "Coffee",     # Coffee Bean -> Coffee
        "815": "Green Tea",  # Tea Leaves -> Green Tea (Tea Leaves id 815 in 1.6+)
    }
    normalized_name = (produce_name or "").strip().lower()
    keg_exceptions_by_name = {
        "hops": "Pale Ale",
        "wheat": "Beer",
        "coffee bean": "Coffee",
        "tea leaves": "Green Tea",
    }

    keg_type = None
    if produce_id in keg_exceptions_by_id:
        keg_type = keg_exceptions_by_id[produce_id]
    elif normalized_name in keg_exceptions_by_name:
        keg_type = keg_exceptions_by_name[normalized_name]
    else:
        # Fallback by category: Fruit -> Wine, Vegetable -> Juice
        if category == -79:
            keg_type = "Wine"
        elif category == -75:
            keg_type = "Juice"

    # Preserves Jar: Fruit -> Jelly, Vegetable -> Pickles (only when categorically fruit/veg)
    jar_type = None
    if category == -79:
        jar_type = "Jelly"
    elif category == -75:
        jar_type = "Pickles"

    return {
        "jarType": jar_type,
        "kegType": keg_type,
    }


def safe_get(obj_map: dict, key: str, default=None):
    try:
        return obj_map.get(key, default)
    except Exception:
        return default


def infer_dehydrator_type(produce_id: int, produce_name: str, category: int) -> str | None:
    """Infer Dehydrator output type for a given produce, standardized to zh-CN labels.
    Fixed set: "葡萄干" (grape), "果干" (any fruit), "蘑菇干" (edible mushrooms).
    """
    # Grape -> 葡萄干
    try:
        pid = int(produce_id)
    except Exception:
        pid = None
    if pid == 398 or (isinstance(produce_name, str) and produce_name.strip().lower() == "grape"):
        return "葡萄干"

    # Fruit -> 果干
    if category == -79:
        return "果干"

    # Edible mushrooms approximation -> 蘑菇干
    edible_mushroom_ids = {404, 281, 257}  # Common Mushroom, Chanterelle, Morel
    if pid in edible_mushroom_ids:
        return "蘑菇干"

    return None


def localize_processing_types(jar_type: str | None, keg_type: str | None, dehydrator_type: str | None):
    """Convert processing type labels to zh-CN using game localization data when possible.
    Looks up Objects.zh-CN.json keys like '<Key>_Name'.
    For DriedFruit/DriedMushroom, if _Name is not meaningful, try CollectionsTabName keys.
    Falls back to original if not found.
    """
    def tr_one(x: str | None) -> str | None:
        if not x:
            return None
        # Map English label to localization key in Objects.zh-CN.json
        key_map = {
            "Jelly": "Jelly_Name",
            "Pickles": "Pickles_Name",
            "Wine": "Wine_Name",
            "Juice": "Juice_Name",
            "Beer": "Beer_Name",
            "Pale Ale": "PaleAle_Name",
            "Coffee": "Coffee_Name",
            "Green Tea": "GreenTea_Name",
            # Dehydrator English keys if ever encountered (we standardize to zh already)
            "Raisins": "Raisins_Name",
            "Dried Fruit": "DriedFruit_Name",
            "DriedFruit": "DriedFruit_Name",
            "DriedMushroom": "DriedMushrooms_Name",
        }
        alt_key_map = {
            "DriedFruit": "DriedFruit_CollectionsTabName",
            "DriedMushroom": "DriedMushrooms_CollectionsTabName",
        }
        # If already in desired zh set, return directly
        if x in {"果干", "葡萄干", "蘑菇干"}:
            return x
        key = key_map.get(x)
        val = None
        if key and isinstance(globals().get('zh_objects'), dict):
            val = zh_objects.get(key)
        # If value looks missing or placeholder for dried items, try collections tab names
        if (not val or val.strip() == "Dried") and x in alt_key_map and isinstance(globals().get('zh_objects'), dict):
            val = zh_objects.get(alt_key_map[x]) or val
        return val or x

    return tr_one(jar_type), tr_one(keg_type), tr_one(dehydrator_type)

def build_crop_entry(seed_id: str, crop_def: dict, objects_map: dict, traveler_explicit: dict, traveler_random: set, special_shops: dict, pierre_prices: dict, joja_prices: dict):
    # seed item info
    seed_obj = safe_get(objects_map, seed_id, {}) or {}
    seed_price = seed_obj.get("Price", 0)

    # produce item info
    produce_id = crop_def.get("HarvestItemId")
    produce_obj = safe_get(objects_map, produce_id, {}) or {}
    produce_price = produce_obj.get("Price", 0)
    produce_name = produce_obj.get("Name") or produce_obj.get("DisplayName") or str(produce_id)
    produce_category = produce_obj.get("Category")

    # growth
    days_in_phase = crop_def.get("DaysInPhase", []) or []
    initial_days = sum(days_in_phase)
    regrow_days = crop_def.get("RegrowDays", -1)
    regrow = regrow_days if isinstance(regrow_days, int) and regrow_days >= 0 else 0

    # seasons (localized zh-CN, joined by '|')
    seasons_map = {
        "spring": "春季",
        "summer": "夏季",
        "fall": "秋季",
        "winter": "冬季",
    }
    seasons_list = crop_def.get("Seasons", []) or []
    seasons_localized = [seasons_map.get(str(s).lower(), str(s)) for s in seasons_list]
    seasons_str = "|".join(seasons_localized) if seasons_localized else ""

    # greenhouse capability: almost all crops can be planted in greenhouse.
    # If any PlantableLocationRules explicitly deny Greenhouse, honor that.
    greenhouse = True
    rules = crop_def.get("PlantableLocationRules") or []
    try:
        for rule in rules:
            # If a rule targets Greenhouse and denies it
            if str(rule.get("PlantedIn", "")).lower() == "greenhouse" and str(rule.get("Result", "")).lower() == "deny":
                greenhouse = False
                break
    except Exception:
        pass

    # extra produce
    min_stack = crop_def.get("HarvestMinStack", 1) or 1
    # treat base as at least 1, so extra is anything above 1
    extra = max(int(min_stack) - 1, 0)
    extra_chance = float(crop_def.get("ExtraHarvestChance", 0.0) or 0.0)

    # processing types (precise keg outputs when known, else fallback by category)
    processing = infer_processing_types(str(produce_id), produce_name, produce_category) if produce_category is not None else {
        "jarType": None,
        "kegType": None,
    }

    # dehydrator type
    dehydrator_type = infer_dehydrator_type(produce_id, produce_name, produce_category)

    # localization: try to map produce name to zh-CN using Objects.zh-CN.json
    zh_name = None
    if isinstance(produce_name, str) and zh_objects:
        key = f"{''.join(ch for ch in produce_name if ch.isalnum())}_Name"
        zh_name = zh_objects.get(key)

    display_name = zh_name or produce_name

    # image filename heuristic (lowercase, spaces->underscores)
    img_name = None
    if isinstance(produce_name, str):
        base = produce_name.lower()
        safe = ''.join(ch for ch in base if ch.isalnum())
        img_name = safe + '.png'

    # Build entry according to the required structure
    # Wiki URL (Chinese): https://zh.stardewvalleywiki.com/{ChineseName}
    wiki_url = None
    if isinstance(display_name, str) and display_name:
        wiki_url = f"https://zh.stardewvalleywiki.com/{display_name}"

    # Shop prices: prefer actual shop listings; otherwise 0
    pierre_price = pierre_prices.get(seed_id, 0)
    joja_price = joja_prices.get(seed_id, 0)

    # Special shops & Traveler (Travelling Cart)
    special_price = None
    special_loc = None
    special_url = ""
    # Priority: explicit special shop > traveler explicit > traveler random
    if seed_id in special_shops:
        special_price = special_shops[seed_id]["price"]
        special_loc = special_shops[seed_id]["shop"]
    elif seed_id in traveler_explicit:
        special_price = traveler_explicit[seed_id]
        special_loc = "Travelling Cart"
    elif seed_id in traveler_random:
        # Random pool pricing uses the maximum of two rules:
        # - RandomPrice in {100,200,...,1000}
        # - RandomMultipleOfBasePrice in {3x,4x,5x} of the object's base price
        # So the effective range can be represented as:
        #   [ max(100, 3*base), max(1000, 5*base) ]
        try:
            base = int(seed_price) if isinstance(seed_price, (int, float)) else 0
        except Exception:
            base = 0
        min_val = max(100, base * 3)
        max_val = max(1000, base * 5)
        special_price = f"{min_val}-{max_val}"
        special_loc = "Travelling Cart"
    else:
        special_price = 0
        special_loc = "Unpurchasable"
    # localize processing labels to zh-CN
    jar_zh, keg_zh, dehy_zh = localize_processing_types(processing["jarType"], processing["kegType"], dehydrator_type)

    entry = {
        "name": display_name,  # 本地化后的产物名称（若有）
        "url": wiki_url,
        "img": img_name,
        "greenhouse": greenhouse,
        "seasons": seasons_str,
        "seeds": {
            "sell": seed_price,
            "pierre": pierre_price,
            "joja": joja_price,
            # Additional sources per request
            "Oasis": oasis_prices.get(seed_id, 0) if 'oasis_prices' in globals() else 0,
            "Island Trader": island_prices.get(seed_id, 0) if 'island_prices' in globals() else 0,
            "Travelling Cart": (
                traveler_explicit.get(seed_id)
                if seed_id in traveler_explicit
                else (f"{max(100, int(seed_price)*3)}-{max(1000, int(seed_price)*5)}" if seed_id in traveler_random else 0)
            ),
        },
        "growth": {
            "initial": initial_days,
            "regrow": regrow,
        },
        "produce": {
            "extra": extra,
            "extraPerc": extra_chance,
            "price": produce_price,
            "jarType": jar_zh,
            "kegType": keg_zh,
            "dehydratorType": dehy_zh,
        },
    }

    # key by lowercase produce name without spaces
    key_name = (str(produce_name).lower().replace(' ', '')
                if produce_name is not None else str(produce_id))

    return entry, key_name


def generate_all():
    output_dir = BASE_DIR / 'output'
    output_dir.mkdir(parents=True, exist_ok=True)

    combined = {}

    # Parse Traveler data once
    traveler_explicit, traveler_random = parse_traveler_data(objects, shops)
    special_shops = parse_other_shops(objects, shops)
    # Additional special shops
    global oasis_prices, island_prices
    oasis_prices = parse_oasis_prices(objects, shops)
    island_prices = parse_island_trader_prices(objects, shops)
    pierre_prices = parse_seedshop_prices(objects, shops)
    joja_prices = parse_joja_prices(objects, shops)

    # Iterate all crop entries; combine by lowercase produce name
    for seed_id, crop_def in crops.items():
        try:
            entry, key_name = build_crop_entry(seed_id, crop_def, objects, traveler_explicit, traveler_random, special_shops, pierre_prices, joja_prices)

            # Key the combined dict by produce name (lowercase)
            combined[key_name] = entry

        except Exception as e:
            print(f"Failed to build entry for seed {seed_id}: {e}")

    # Add explicit seasonal seeds as standalone entries (spring/summer/fall/winter seeds)
    try:
        def zh(key: str, fallback: str) -> str:
            try:
                return (zh_objects.get(key) or fallback) if isinstance(zh_objects, dict) else fallback
            except Exception:
                return fallback

        def avg_price(ids: list[str]) -> int:
            vals = []
            for pid in ids:
                try:
                    p = int((objects.get(str(pid)) or {}).get('Price', 0) or 0)
                    if p > 0:
                        vals.append(p)
                except Exception:
                    pass
            return int(round(sum(vals) / max(1, len(vals)))) if vals else 0

        def crop_days(seed_key: str) -> tuple[int,int]:
            c = crops.get(seed_key) or {}
            try:
                initial = sum(c.get('DaysInPhase') or [])
            except Exception:
                initial = 0
            regrow_days = c.get('RegrowDays')
            regrow = regrow_days if isinstance(regrow_days, int) and regrow_days >= 0 else 0
            return initial, regrow

        seasonal_specs = [
            {
                'key': 'springseeds',
                'seed_id': '495',
                'display': zh('SpringSeeds_Name', 'Spring Seeds'),
                'img': 'springseeds.png',
                'seasons': '春季',
                'forage_ids': ['16', '18', '20', '22'],  # 野山葵/水仙葵/韭葱/蒲公英
            },
            {
                'key': 'summerseeds',
                'seed_id': '496',
                'display': zh('SummerSeeds_Name', 'Summer Seeds'),
                'img': 'summerseeds.png',
                'seasons': '夏季',
                'forage_ids': ['396', '398', '402'],  # 香味浆果/葡萄/香豌豆
            },
            {
                'key': 'fallseeds',
                'seed_id': '497',
                'display': zh('FallSeeds_Name', 'Fall Seeds'),
                'img': 'fallseeds.png',
                'seasons': '秋季',
                'forage_ids': ['404', '406', '408', '410'],  # 普通蘑菇/野李子/榛子/黑莓
            },
            {
                'key': 'winterseeds',
                'seed_id': '498',
                'display': zh('WinterSeeds_Name', 'Winter Seeds'),
                'img': 'winterseeds.png',
                'seasons': '冬季',
                'forage_ids': ['412', '414', '416', '418'],  # 冬根/水晶果/雪山芋/番红花
            },
        ]

        for spec in seasonal_specs:
            seed_obj = objects.get(spec['seed_id']) or {}
            seed_sell = int(seed_obj.get('Price', 0) or 0)
            initial, regrow = crop_days(spec['seed_id'])
            # Expected raw value as simple average of the season's forage items
            expected_price = avg_price(spec['forage_ids'])
            craft = craft_cost(spec['forage_ids'])
            combined[spec['key']] = {
                'name': spec['display'],
                'url': f"https://zh.stardewvalleywiki.com/{spec['display']}",
                'img': spec['img'],
                'greenhouse': True,
                'seasons': spec['seasons'],
                'seeds': {
                    'sell': seed_sell,
                    'pierre': 0,
                    'joja': 0,
                    'Oasis': 0,
                    'Island Trader': 0,
                    'Travelling Cart': 0,
                    'craft': craft,
                },
                'growth': {
                    'initial': initial,
                    'regrow': regrow,
                },
                'produce': {
                    'extra': 0,
                    'extraPerc': 0.0,
                    'price': expected_price,
                    'jarType': None,
                    'kegType': None,
                    'dehydratorType': None,
                },
                # Mark as wildseed so foraging level/skills apply
                'isWildseed': True,
            }
    except Exception as e:
        print(f"Failed to append seasonal seeds: {e}")

    # Write combined file
    combined_path = output_dir / 'crops_by_seed.json'
    with open(combined_path, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"Wrote combined {len(combined)} crop entries to {combined_path}")


if __name__ == '__main__':
    generate_all()

