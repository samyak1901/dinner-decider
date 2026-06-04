import pytest

from backend.agent.runner import _extract_json


def test_plain_json_array():
    assert _extract_json('[{"name": "Tacos"}]') == [{"name": "Tacos"}]


def test_markdown_fenced_json():
    text = 'Here you go:\n```json\n[{"name": "Pho"}]\n```\nEnjoy!'
    assert _extract_json(text) == [{"name": "Pho"}]


def test_fenced_without_language():
    text = '```\n[{"name": "Curry"}]\n```'
    assert _extract_json(text) == [{"name": "Curry"}]


def test_array_embedded_in_prose():
    text = 'The meals are [{"name": "Ramen"}] for tonight.'
    assert _extract_json(text) == [{"name": "Ramen"}]


def test_garbage_raises():
    with pytest.raises(ValueError):
        _extract_json("I could not generate any meals today, sorry.")
