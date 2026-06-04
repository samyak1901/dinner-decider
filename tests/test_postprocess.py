from backend.agent.postprocess import (
    enforce_dietary_safety,
    seed_meals,
    validate_meals,
)
from backend.models import User


# --- validation ---

def test_drops_meal_without_name():
    out = validate_meals([{"cuisine": "Thai"}, {"name": "Pad Thai"}])
    assert [m["name"] for m in out] == ["Pad Thai"]


def test_clamps_absurd_time_to_none():
    out = validate_meals([{"name": "Slow Roast", "estimated_time_minutes": 99999}])
    assert out[0]["estimated_time_minutes"] is None


def test_coerces_non_list_ingredients():
    out = validate_meals([{"name": "X", "ingredients": "not a list"}])
    assert out[0]["ingredients"] == []


def test_parses_nested_veg_alternative():
    out = validate_meals([
        {"name": "Beef Tacos", "is_vegetarian": False,
         "veg_alternative": {"name": "Bean Tacos", "is_vegetarian": True}}
    ])
    assert out[0]["veg_alternative"]["name"] == "Bean Tacos"


def test_skips_non_dict_items():
    assert validate_meals(["garbage", 42, {"name": "OK"}]) == validate_meals([{"name": "OK"}])


# --- dietary safety ---

def _meals():
    return [
        {"name": "Veg Curry", "is_vegetarian": True, "ingredients": ["lentils"]},
        {"name": "Beef Stew", "is_vegetarian": False, "ingredients": ["beef"]},
        {"name": "Chicken Pie", "is_vegetarian": False, "ingredients": ["chicken"],
         "veg_alternative": {"name": "Veg Pie", "is_vegetarian": True, "ingredients": ["mushroom"]}},
    ]


def test_veg_member_drops_nonveg_without_alternative():
    users = [User(name="V", is_vegetarian=True)]
    kept = {m["name"] for m in enforce_dietary_safety(_meals(), users)}
    assert "Beef Stew" not in kept       # no veg option -> dropped
    assert "Veg Curry" in kept
    assert "Chicken Pie" in kept          # has veg alternative -> kept


def test_no_veg_member_keeps_everything():
    users = [User(name="O", is_vegetarian=False)]
    assert len(enforce_dietary_safety(_meals(), users)) == 3


def test_allergen_drops_matching_meal():
    users = [User(name="A", is_vegetarian=False, dietary_restrictions="allergic to peanuts")]
    meals = [
        {"name": "Pad Thai", "is_vegetarian": True, "ingredients": ["peanut butter", "noodles"]},
        {"name": "Plain Rice", "is_vegetarian": True, "ingredients": ["rice"]},
    ]
    kept = {m["name"] for m in enforce_dietary_safety(meals, users)}
    assert kept == {"Plain Rice"}


def test_allergen_in_veg_alternative_is_removed():
    users = [User(name="A", is_vegetarian=False, dietary_restrictions="no shellfish")]
    meals = [{
        "name": "Steak", "is_vegetarian": False, "ingredients": ["beef"],
        "veg_alternative": {"name": "Shrimp Bowl", "is_vegetarian": True, "ingredients": ["shrimp", "shellfish stock"]},
    }]
    # No veg member, so the suggestion stays but its allergen-laden alt is removed.
    out = enforce_dietary_safety(meals, users)
    assert len(out) == 1
    assert out[0]["veg_alternative"] is None


def test_seed_menu_is_valid_and_vegetarian():
    seeds = seed_meals()
    assert len(seeds) == 3
    assert all(m["is_vegetarian"] for m in seeds)
