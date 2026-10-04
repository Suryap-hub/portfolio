"""Per-client sliding-window rate limiter (in memory).

Good enough for one backend instance on a free host. If you ever run several
instances, move the counters to Redis (same idea as in the FinTech project).
"""

import threading
import time
from collections import deque


class RateLimiter:
    def __init__(self, limit: int, window_seconds: int = 3600, clock=time.monotonic):
        self.limit = limit
        self.window = window_seconds
        self.clock = clock
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def check(self, key: str) -> tuple[bool, int]:
        """Records a hit for key. Returns (allowed, seconds_until_next_slot)."""
        now = self.clock()
        with self._lock:
            hits = self._hits.setdefault(key, deque())
            while hits and now - hits[0] >= self.window:
                hits.popleft()
            if len(hits) >= self.limit:
                retry_after = int(self.window - (now - hits[0])) + 1
                return False, retry_after
            hits.append(now)
            self._prune(now)
            return True, 0

    def _prune(self, now: float) -> None:
        # Drop idle clients occasionally so memory doesn't grow forever.
        if len(self._hits) < 5000:
            return
        for key in [k for k, v in self._hits.items() if not v or now - v[-1] >= self.window]:
            del self._hits[key]
