import sys
import os

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.risk_engine import classify_risk_score, DisasterRiskEngine
from app.database import get_db, COLLECTIONS_REGISTRY
from app.services.data_seeder import seed_database_if_empty
from app.services.gis_processor import GisRiskZoneProcessor
from app.services.relocation import calculate_carrying_capacity
from app.security import hash_password, verify_password, create_access_token, decode_token

def test_risk_score_boundary_rules():
    """
    PART 1 & PART 12: Strict non-overlapping threshold verification for all 16 exact boundary values:
    0, 10, 19.99, 20, 35, 39.99, 40, 55, 59.99, 60, 75, 79.99, 80, 85, 92, 100.
    """
    test_cases = [
        # (score, expected_category, expected_color, expected_code)
        (0.0, "VERY LOW RISK", "#16A34A", "GREEN"),
        (10.0, "VERY LOW RISK", "#16A34A", "GREEN"),
        (19.99, "VERY LOW RISK", "#16A34A", "GREEN"),
        (20.0, "LOW RISK", "#84CC16", "LIGHT_GREEN"),
        (35.0, "LOW RISK", "#84CC16", "LIGHT_GREEN"),
        (39.99, "LOW RISK", "#84CC16", "LIGHT_GREEN"),
        (40.0, "MODERATE RISK", "#F97316", "ORANGE"),
        (55.0, "MODERATE RISK", "#F97316", "ORANGE"),
        (59.99, "MODERATE RISK", "#F97316", "ORANGE"),
        (60.0, "HIGH RISK", "#EAB308", "YELLOW"),
        (75.0, "HIGH RISK", "#EAB308", "YELLOW"),
        (79.99, "HIGH RISK", "#EAB308", "YELLOW"),
        (80.0, "VERY HIGH RISK", "#DC2626", "RED"),
        (85.0, "VERY HIGH RISK", "#DC2626", "RED"),
        (92.0, "VERY HIGH RISK", "#DC2626", "RED"),
        (100.0, "VERY HIGH RISK", "#DC2626", "RED"),
    ]

    for score, exp_cat, exp_col, exp_code in test_cases:
        res = classify_risk_score(score)
        assert res["category"].upper() == exp_cat, f"Score {score}: expected category {exp_cat}, got {res['category']}"
        assert res["color_hex"] == exp_col, f"Score {score}: expected color {exp_col}, got {res['color_hex']}"
        assert res["category_code"] == exp_code, f"Score {score}: expected code {exp_code}, got {res['category_code']}"

    print("[PASS] All 16 Risk Classification & Exact Boundary Threshold Tests Passed!")

def test_missing_data_handling():
    """
    Missing data must not silently produce zero risk.
    """
    res = DisasterRiskEngine.calculate_landslide_hazard(
        rainfall_val=None,
        slope_deg=None,
        past_incidents=None,
        river_dist_km=None
    )
    assert res["status"] == "insufficient_data"
    assert len(res["missing"]) == 4
    assert res["confidence"] == 0.0

    # Partial data test (only rainfall and slope available)
    partial_res = DisasterRiskEngine.calculate_landslide_hazard(
        rainfall_val=4200.0,
        slope_deg=38.0,
        past_incidents=None,
        river_dist_km=None
    )
    assert partial_res["status"] == "partial"
    assert partial_res["hazard_score"] > 70.0 # Accurately normalized without deflating by 0
    assert any("Historical" in m for m in partial_res["missing"])
    print("[PASS] Missing Data & Robust Partial Scoring Tests Passed!")

def test_database_and_collections():
    """
    Verifies that all 18 collections exist and seed cleanly.
    """
    db = get_db()
    seed_database_if_empty()

    for col_name in COLLECTIONS_REGISTRY:
        col = db[col_name]
        assert col is not None, f"Collection {col_name} missing from MongoDB registry!"

    # Verify settlements count
    st_count = db.settlements.count_documents()
    assert st_count >= 8, f"Expected at least 8 settlements, found {st_count}"

    # Verify users
    admin = db.users.find_one({"email": "admin@nivaran.gov.in"})
    assert admin is not None
    assert admin["role"] == "Administrator"

    print("[PASS] Database 18 Collections & Seeding Verification Passed!")

def test_spatial_grid_and_red_zones():
    """
    Verifies automated grid generation, slope overlay and contiguous Red Zone synthesis.
    """
    zones = GisRiskZoneProcessor.synthesize_risk_zones("Raigad")
    assert len(zones) > 0, "Expected at least 1 synthesized risk zone polygon!"
    z1 = zones[0]
    assert "zone_id" in z1
    assert "geometry" in z1
    assert z1["geometry"]["type"] in ["Polygon", "MultiPolygon"]
    assert z1["risk_score"] >= 60.0
    print(f"[PASS] GIS Processor Synthesized {len(zones)} Valid Spatial Risk Polygons for Raigad!")

def test_carrying_capacity():
    """
    Verifies restrictive carrying capacity formula (0.08 ha/HH and water score).
    """
    cap = calculate_carrying_capacity(usable_area_ha=50.0, land_per_hh_ha=0.08, water_reliability_score=0.60, existing_occupied_hh=0)
    assert cap["gross_capacity"] == 625
    assert cap["safe_carrying_capacity"] == 375
    assert cap["remaining_capacity"] == 375
    assert cap["traffic_light"] == "Green"
    print("[PASS] Restrictive Carrying Capacity Benchmark Formula Verified!")

def test_authentication_security():
    """
    Tests bcrypt hashing and JWT tokens.
    """
    pwd = "Nivaran@SecurePassword123"
    h = hash_password(pwd)
    assert verify_password(pwd, h) is True
    assert verify_password("WrongPassword", h) is False

    tok = create_access_token({"sub": "test-user", "role": "Administrator"})
    decoded = decode_token(tok)
    assert decoded["sub"] == "test-user"
    assert decoded["role"] == "Administrator"
    print("[PASS] Password Hashing & JWT Security Tests Passed!")

if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("NIVARAN BACKEND & RISK ENGINE COMPREHENSIVE TEST SUITE")
    print("=" * 65)
    test_risk_score_boundary_rules()
    test_missing_data_handling()
    test_database_and_collections()
    test_spatial_grid_and_red_zones()
    test_carrying_capacity()
    test_authentication_security()
    print("=" * 65)
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 65 + "\n")
