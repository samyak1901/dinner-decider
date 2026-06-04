import json
from datetime import date

from sqlalchemy.orm import Session

from backend.services.plan_service import get_week


def _ingredient_items(raw: str | None) -> list[str]:
    """Parse a meal's stored ingredients (JSON string) into display strings."""
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return [raw]
    items = []
    for ing in parsed if isinstance(parsed, list) else [parsed]:
        if isinstance(ing, str):
            items.append(ing.strip())
        elif isinstance(ing, dict):
            # e.g. {"name": "rice", "amount": "1 cup"}
            name = ing.get("name") or " ".join(str(v) for v in ing.values())
            items.append(str(name).strip())
    return [i for i in items if i]


def build_shopping_list(db: Session, start: date, days: int = 7) -> list[dict]:
    """Aggregate + dedupe ingredients across the planned/cooked meals in range.

    Dedupe is case-insensitive; each item records which meals contributed it.
    """
    aggregated: dict[str, dict] = {}
    for day in get_week(db, start, days):
        meal = day["meal"]
        if not meal:
            continue
        for item in _ingredient_items(meal.ingredients):
            key = item.lower()
            entry = aggregated.setdefault(key, {"item": item, "meals": []})
            if meal.name not in entry["meals"]:
                entry["meals"].append(meal.name)

    return sorted(aggregated.values(), key=lambda e: e["item"].lower())
