#!/usr/bin/env python3
"""
Assertive concurrency test

This script will:
 - GET /api/providers and pick the first provider
 - For each iteration:
    - construct a unique slot (30-minute steps)
    - fire `concurrency` parallel POST /api/appointments requests targeting the same slot
    - measure per-request latencies
    - verify exactly 1 success (201) and the rest are conflicts (409 or 422)
 - Print per-iteration and aggregate metrics and exit with non-zero on assertion failure.

Usage:
  python3 backend/tests/concurrency_assertive_test.py --iter 5 --concurrency 10

Requirements:
  pip install httpx

Notes:
 - The test creates unique patient emails per request to avoid patient-duplication unique-index failures.
 - Ensure the backend is running at http://localhost:8000 and that the DB has the uniqueness indexes applied.
"""

import asyncio
import time
import uuid
import statistics
import sys
from datetime import datetime, timedelta

import httpx

API_BASE = "http://localhost:8000/api"

async def do_post(client: httpx.AsyncClient, payload: dict):
    start = time.monotonic()
    try:
        r = await client.post(f"{API_BASE}/appointments", json=payload, timeout=20.0)
        status = r.status_code
        body = r.text
    except Exception as e:
        status = None
        body = str(e)
    latency = (time.monotonic() - start) * 1000.0
    return status, body, latency

async def run_iteration(client: httpx.AsyncClient, provider_id: str, iteration_index: int, concurrency: int):
    # Build a unique slot for this iteration (base 10:00 2days from now + 30min * i)
    dt = datetime.now() + timedelta(days=2)
    base_slot = dt.replace(hour=10, minute=0, second=0, microsecond=0)
    slot_dt = base_slot + timedelta(minutes=30 * iteration_index)
    ts_ms = int(slot_dt.timestamp() * 1000)
    slot_id = f"slot-{provider_id}-{ts_ms}"

    tasks = []
    for j in range(concurrency):
        # Unique patient email per request to avoid unique-email collisions
        unique = uuid.uuid4().hex[:8]
        payload = {
            "provider_id": provider_id,
            "slot_id": slot_id,
            "patient": {
                # Keep names letters-only to satisfy validators in models.py
                "first_name": "Concurrent",
                "last_name": "Tester",
                "email": f"concurrent+{ts_ms}_{unique}@example.com",
                "phone": "555-000-0000",
            },
            "reason": "Assertive concurrency test"
        }
        tasks.append(do_post(client, payload))

    results = await asyncio.gather(*tasks, return_exceptions=False)

    # Analyze results
    statuses = [r[0] for r in results]
    latencies = [r[2] for r in results]
    success_count = sum(1 for s in statuses if s in (200, 201))
    conflict_count = sum(1 for s in statuses if s in (409, 422))
    other_count = sum(1 for s in statuses if s not in (200, 201, 409, 422))

    return {
        "slot_id": slot_id,
        "success_count": success_count,
        "conflict_count": conflict_count,
        "other_count": other_count,
        "statuses": statuses,
        "latencies": latencies,
        "slot_time": slot_dt.isoformat() + "Z",
    }

async def main(iterations: int = 5, concurrency: int = 10):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{API_BASE}/providers")
        r.raise_for_status()
        providers = r.json()
        if not providers:
            print("No providers returned from API; aborting")
            return 2
        provider_id = providers[1]["id"]
        print("Using provider:", provider_id)

        total_success = 0
        total_conflict = 0
        total_other = 0
        all_latencies = []

        for i in range(iterations):
            print(f"\nIteration {i+1}/{iterations}")
            out = await run_iteration(client, provider_id, i, concurrency)
            s = out["success_count"]
            c = out["conflict_count"]
            o = out["other_count"]
            lat = out["latencies"]
            print(f" slot={out['slot_id']} time={out['slot_time']}")
            print(f"  successes={s}  conflicts={c}  other={o}")
            if lat:
                print(f"  latency ms: min={min(lat):.1f} median={statistics.median(lat):.1f} max={max(lat):.1f}")
            total_success += s
            total_conflict += c
            total_other += o
            all_latencies.extend(lat)

            # Assert exactly one success per slot
            if s != 1:
                print("\nASSERTION FAILED: expected exactly 1 success per slot")
                print("Statuses:", out["statuses"])
                return 1
            if c != (concurrency - 1):
                print("\nASSERTION FAILED: expected conflicts == concurrency - 1")
                print("Statuses:", out["statuses"])
                return 1

        # Summary
        print("\nAggregate summary:")
        print(f"  total_successes: {total_success}")
        print(f"  total_conflicts: {total_conflict}")
        print(f"  total_other: {total_other}")
        if all_latencies:
            print(f"  latency ms overall: min={min(all_latencies):.1f} median={statistics.median(all_latencies):.1f} max={max(all_latencies):.1f}")

    print("\nAll assertions passed.")
    return 0

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--iter', type=int, default=5, help='Number of iterations (distinct slots)')
    p.add_argument('--concurrency', type=int, default=10, help='Concurrent requests per slot')
    args = p.parse_args()
    code = asyncio.run(main(args.iter, args.concurrency))
    sys.exit(code)
