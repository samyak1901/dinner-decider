from tests.conftest import PASSCODE, make_suggestion, make_user


def test_protected_routes_require_auth(client):
    assert client.get("/api/users").status_code == 401
    assert client.get("/api/suggestions/today").status_code == 401
    assert client.get("/api/history").status_code == 401


def test_login_rejects_bad_passcode(client):
    assert client.post("/api/auth/login", json={"passcode": "wrong"}).status_code == 401


def test_vote_requires_selected_member(auth_client, db):
    suggestion = make_suggestion(db, 1)
    # Logged in but no member selected yet -> 409
    resp = auth_client.post(
        "/api/votes", json={"daily_suggestion_id": suggestion.id}
    )
    assert resp.status_code == 409


def test_vote_uses_session_identity_not_body(auth_client, db):
    suggestion = make_suggestion(db, 1)
    user = make_user(db, "Alex")
    auth_client.post("/api/auth/select-user", json={"user_id": user.id})

    # Body cannot smuggle a different user_id; identity is the session's.
    resp = auth_client.post(
        "/api/votes",
        json={"daily_suggestion_id": suggestion.id, "user_id": 9999},
    )
    assert resp.status_code == 200
    assert resp.json()["user_id"] == user.id


def test_vote_unknown_suggestion_404(auth_client, db):
    user = make_user(db, "Alex")
    auth_client.post("/api/auth/select-user", json={"user_id": user.id})
    resp = auth_client.post("/api/votes", json={"daily_suggestion_id": 4242})
    assert resp.status_code == 404


def test_rating_out_of_bounds_rejected(auth_client, db):
    # 422 from schema validation (rating must be 1..5)
    resp = auth_client.post("/api/history/2026-01-01/rate", json={"rating": 9})
    assert resp.status_code == 422


def test_full_flow_vote_then_today_reflects_it(client, db):
    s1 = make_suggestion(db, 1, cuisine="Mexican")
    make_suggestion(db, 2, cuisine="Thai")
    user = make_user(db, "Alex")

    client.post("/api/auth/login", json={"passcode": PASSCODE})
    client.post("/api/auth/select-user", json={"user_id": user.id})
    client.post("/api/votes", json={"daily_suggestion_id": s1.id})

    today = client.get("/api/suggestions/today").json()
    assert today["user_vote_id"] == s1.id
    voted_slot = next(s for s in today["suggestions"] if s["id"] == s1.id)
    assert voted_slot["vote_count"] == 1
    assert "Alex" in voted_slot["voters"]
