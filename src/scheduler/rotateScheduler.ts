import cron from "node-cron";
import { rotateJwtKey } from "../utils/rotateJwtKeys";

// Rotate every 2 days at 00:00
export function scheduleKeyRotation() {
    cron.schedule("0 0 */2 * *", async () => {
        console.log("⏳ Rotating JWT key...");
        await rotateJwtKey();
    });
}
