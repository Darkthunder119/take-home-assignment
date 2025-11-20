#!/usr/bin/env python3
"""
Concurrency test script: attempts to double-book the same slot concurrently.

Usage:
  python backend/scripts/concurrency_test.py --iter 5

Requirements:
  pip install httpx

What it does:
  - GET /api/providers and picks the first provider
  - For N iterations:
      - constructs a slot id for tomorrow at 10:00 (local time)
      - fires two concurrent POST /api/appointments with the same payload
      - prints each response status/body snippet
  - Prints a summary of successes, conflicts, and other errors

Note: ensure your backend is running at http://localhost:8000 before running.
"""

import asyncio
import httpx
from datetime import datetime, timedelta

API_BASE = "http://localhost:8000/api"

async def book(client: httpx.AsyncClient, payload: dict):
    try:
        r = await client.post(f"{API_BASE}/appointments", json=payload, timeout=10.0)
        return r.status_code, r.text
    except Exception as e:
        return e

async def run_once(client: httpx.AsyncClient, provider_id: str, iteration_index: int = 0):
    # choose slot tomorrow at 10:00 local time and offset by iteration
    # so each iteration targets a distinct timeslot (prevents reuse across
    # iterations). We add `iteration_index` minutes to the base time.
    dt = datetime.now() + timedelta(days=1)
    base_slot = dt.replace(hour=10, minute=0, second=0, microsecond=0)
    # advance by 30 minutes per iteration so each iteration targets a
    # distinct half-hour slot
    slot_dt = base_slot + timedelta(minutes=30 * iteration_index)
    ts_ms = int(slot_dt.timestamp() * 1000)
    slot_id = f"slot-{provider_id}-{ts_ms}"

    # ensure unique patient/email per attempt to avoid patient-duplication collisions
    payload = {
        "provider_id": provider_id,
        "slot_id": slot_id,
        "patient": {
            "first_name": "Concurrent",
            "last_name": "Tester",
            "email": f"concurrent+{ts_ms}@example.com",
            "phone": "555-000-0000",
        },
        "reason": "Concurrency test"
    }

    tasks = [book(client, payload) for _ in range(2)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return slot_id, results

async def main(iterations: int = 5):
    async with httpx.AsyncClient() as client:
        # fetch providers
        r = await client.get(f"{API_BASE}/providers")
        r.raise_for_status()
        providers = r.json()
        if not providers:
            print("No providers returned from API; aborting")
            return
        provider_id = providers[2]["id"]
        print("Using provider:", provider_id)

        success = 0
        conflict = 0
        other = 0

        for i in range(iterations):
            slot_id, results = await run_once(client, provider_id, i)
            print(f"\nIteration {i+1} — slot {slot_id}")
            for idx, res in enumerate(results):
                if isinstance(res, Exception):
                    print(f"  task {idx}: Exception: {res}")
                    other += 1
                else:
                    status, body = res
                    body_snip = body[:300].replace('\n', ' ')
                    print(f"  task {idx}: status={status}, body={body_snip}")
                    if status in (200, 201):
                        success += 1
                    elif status in (409, 422):
                        conflict += 1
                    else:
                        other += 1
            await asyncio.sleep(0.2)

        print("\nSummary:")
        print("  successes:", success)
        print("  conflicts (expected for one of concurrent requests):", conflict)
        print("  other errors:", other)

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('--iter', type=int, default=5, help='Number of iterations')
    args = p.parse_args()
    asyncio.run(main(args.iter))
