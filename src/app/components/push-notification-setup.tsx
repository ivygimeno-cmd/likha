"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(
  base64String: string,
) {
  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4,
    );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) =>
      char.charCodeAt(0),
    ),
  );
}

export default function PushNotificationSetup() {
  const [status, setStatus] = useState<
    "checking" | "idle" | "loading" | "success" | "error"
  >("checking");

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkExistingSubscription() {
      try {
        if (
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          !("Notification" in window)
        ) {
          setStatus("error");
          setMessage(
            "Hindi supported ng browser na ito ang notifications.",
          );
          return;
        }

        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
          );

        await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        if (subscription) {
          setStatus("success");
          return;
        }

        setStatus("idle");
      } catch (error) {
        console.error(
          "Push notification check failed:",
          error,
        );

        setStatus("idle");
      }
    }

    void checkExistingSubscription();
  }, []);

  async function enableNotifications() {
    setStatus("loading");
    setMessage(
      "Ikinokonekta ang device mo...",
    );

    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        throw new Error(
          "Hindi supported ng browser na ito ang push notifications.",
        );
      }

      if (!VAPID_PUBLIC_KEY) {
        throw new Error(
          "Missing VAPID public key. Kailangan nating i-configure ang environment variable.",
        );
      }

      const registration =
        await navigator.serviceWorker.register(
          "/sw.js",
        );

      await navigator.serviceWorker.ready;

      let permission =
        Notification.permission;

      if (permission === "default") {
        permission =
          await Notification.requestPermission();
      }

      if (permission !== "granted") {
        throw new Error(
          "Hindi pinayagan ang notifications. Piliin ang Allow sa Chrome.",
        );
      }

      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(
              VAPID_PUBLIC_KEY,
            ),
        }));

      const response = await fetch(
        "/api/notifications/push/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            subscription,
          }),
        },
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ??
            "Hindi na-save ang device subscription.",
        );
      }

      setStatus("success");
      setMessage("");
    } catch (error) {
      console.error(
        "Push notification setup failed:",
        error,
      );

      setStatus("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Hindi nakakonekta ang device.",
      );
    }
  }

  // Kapag connected na ang device,
  // completely hide the notification setup.
  if (status === "checking" || status === "success") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-4 shadow-xl">
      <p className="font-semibold text-[#173d32]">
        LIKHA Notifications
      </p>

      <p className="mt-1 text-sm leading-5 text-[#173d32]/60">
        I-enable ang notifications para
        makatanggap ka ng VIP Support alerts
        sa phone mo.
      </p>

      {message && (
        <p
          className={`mt-3 text-xs ${
            status === "error"
              ? "text-[#b76449]"
              : "text-[#173d32]/60"
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={enableNotifications}
        disabled={status === "loading"}
        className="mt-4 w-full rounded-xl bg-[#173d32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#245646] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading"
          ? "Kinokonekta..."
          : "I-enable ang Notifications"}
      </button>
    </div>
  );
}