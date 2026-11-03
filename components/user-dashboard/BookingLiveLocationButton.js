"use client";

import { useRouter } from "next/navigation";
import styles from "./UserDashboardNewUI.module.css";

export default function BookingLiveLocationButton({ bookingId }) {
  const router = useRouter();
  return (
    <div className={styles.liveLocation}>
      <button type="button" className={styles.retryButton}
        onClick={() => router.push(`/user/bookings/${bookingId}/live-location`)}>
        Show live location
      </button>
    </div>
  );
}
