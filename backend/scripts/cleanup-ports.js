/**
 * Local dev safeguard: cleans up zombie processes holding port 5000/5001.
 * Fail-soft design: catches all exceptions and exits 0 so it never blocks startup.
 */
try {
  const kill = require("kill-port");
  Promise.allSettled([kill(5000), kill(5001)])
    .catch(() => {})
    .finally(() => {
      process.exit(0);
    });
} catch (err) {
  // Fail-soft if kill-port is missing or unsupported in environment
  process.exit(0);
}
