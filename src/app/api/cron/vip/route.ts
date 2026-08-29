import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { sendLikhaEmail } from "@/lib/email";

export async function GET(request: Request) {
  try {
    /*
     * Protect the cron endpoint.
     */
    const authHeader = request.headers.get(
      "authorization",
    );

    const cronSecret = process.env.CRON_SECRET;

    if (
      !cronSecret ||
      authHeader !== `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (
      !supabaseUrl ||
      !supabaseSecretKey
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase server credentials are not configured.",
        },
        { status: 500 },
      );
    }

    const adminSupabase =
      createSupabaseAdmin(
        supabaseUrl,
        supabaseSecretKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        },
      );

    const now = new Date();

    /*
     * --------------------------------------------------
     * 1. SEND 7-DAY VIP REMINDERS
     * --------------------------------------------------
     *
     * We use a small window around 7 days so the reminder
     * is not missed if the cron runs slightly late.
     */

    const reminderStart = new Date(now);
    reminderStart.setDate(
      reminderStart.getDate() + 6,
    );

    const reminderEnd = new Date(now);
    reminderEnd.setDate(
      reminderEnd.getDate() + 8,
    );

    const {
      data: reminderPayments,
      error: reminderError,
    } = await adminSupabase
      .from("vip_payments")
      .select(
        `
          id,
          user_id,
          vip_expires_at,
          reminder_sent_at
        `,
      )
      .eq("status", "paid")
      .is("reminder_sent_at", null)
      .gte(
        "vip_expires_at",
        reminderStart.toISOString(),
      )
      .lt(
        "vip_expires_at",
        reminderEnd.toISOString(),
      );

    if (reminderError) {
      console.error(
        "VIP reminder lookup error:",
        reminderError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load VIP reminders.",
        },
        { status: 500 },
      );
    }

    let remindersSent = 0;

    for (
      const payment of reminderPayments ?? []
    ) {
      try {
        const {
          data: authUser,
          error: authUserError,
        } =
          await adminSupabase.auth.admin.getUserById(
            payment.user_id,
          );

        if (
          authUserError ||
          !authUser.user?.email
        ) {
          console.error(
            "Unable to get VIP user email:",
            payment.user_id,
            authUserError,
          );

          continue;
        }

        const expiresAt =
          new Date(payment.vip_expires_at);

        const formattedExpiry =
          expiresAt.toLocaleDateString(
            "en-PH",
            {
              month: "long",
              day: "numeric",
              year: "numeric",
            },
          );

        await sendLikhaEmail({
          to: authUser.user.email,
          subject:
            "Your LIKHA VIP membership expires soon",
          html: `
            <div style="margin:0;padding:0;background:#f5f0e6;font-family:Arial,sans-serif;color:#173d32;">
              <div style="max-width:620px;margin:0 auto;padding:40px 20px;">
                <div style="overflow:hidden;border:1px solid rgba(23,61,50,.12);border-radius:18px;background:#fbf8f1;">

                  <div style="background:#173d32;padding:30px 36px;">
                    <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:8px;color:#f5f0e6;">
                      LIKHA
                    </div>
                  </div>

                  <div style="padding:42px 36px 38px;">

                

                    <h1 style="margin:18px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.2;font-weight:400;color:#173d32;">
                      Your VIP membership is ending soon.
                    </h1>

                    <p style="margin:26px 0 0;font-size:15px;line-height:1.8;color:#6f817b;">
                      Paalala lang na ang iyong LIKHA VIP membership ay mag-e-expire sa
                      <strong>${formattedExpiry}</strong>.
                    </p>

                    <p style="margin:18px 0 0;font-size:15px;line-height:1.8;color:#6f817b;">
                      Kung gusto mong ipagpatuloy ang iyong VIP benefits, maaari kang mag-renew bago ito mag-expire.
                    </p>

                    <div style="margin-top:30px;">
                      <a
                      href="https://likha.gimenodesignsolutions.asia/vip"
                        style="display:inline-block;border-radius:9px;background:#b76449;padding:14px 22px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;"
                      >
                        View VIP
                      </a>
                    </div>

                    <div style="margin-top:40px;padding-top:26px;border-top:1px solid rgba(23,61,50,.10);">
                      <p style="margin:0;font-size:13px;line-height:1.8;color:#82918c;">
                        Walang automatic na charge. Mag-e-expire lang ang VIP membership kung hindi ito mare-renew.
                      </p>
                    </div>

                  </div>
                </div>

                <div style="padding:22px 20px;text-align:center;font-size:11px;line-height:1.8;color:#98a39f;">
                  This is an automated LIKHA membership email.
                </div>
              </div>
            </div>
          `,
        });

        await adminSupabase
          .from("vip_payments")
          .update({
            reminder_sent_at:
              now.toISOString(),
          })
          .eq("id", payment.id);

        remindersSent++;
      } catch (error) {
        console.error(
          "VIP reminder email failed:",
          payment.user_id,
          error,
        );
      }
    }

    /*
     * --------------------------------------------------
     * 2. EXPIRE VIP MEMBERSHIPS
     * --------------------------------------------------
     */

    const {
      data: expiredProfiles,
      error: expiredError,
    } = await adminSupabase
      .from("profiles")
      .select(
        `
          id,
          account_tier,
          vip_expires_at
        `,
      )
      .eq("account_tier", "vip")
      .not("vip_expires_at", "is", null)
      .lte(
        "vip_expires_at",
        now.toISOString(),
      );

    if (expiredError) {
      console.error(
        "VIP expiration lookup error:",
        expiredError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to load expired VIP memberships.",
        },
        { status: 500 },
      );
    }

    let expiredCount = 0;
    let expirationEmailsSent = 0;

    for (
      const profile of expiredProfiles ?? []
    ) {
      try {
        const {
          data: authUser,
          error: authUserError,
        } =
          await adminSupabase.auth.admin.getUserById(
            profile.id,
          );

        if (
          authUserError ||
          !authUser.user?.email
        ) {
          console.error(
            "Unable to get expired VIP email:",
            profile.id,
            authUserError,
          );

          continue;
        }

        /*
         * Remove VIP access.
         */
        const {
          error: profileUpdateError,
        } = await adminSupabase
          .from("profiles")
          .update({
            account_tier: "standard",
          })
          .eq("id", profile.id)
          .eq("account_tier", "vip");

        if (profileUpdateError) {
          console.error(
            "VIP expiration update error:",
            profile.id,
            profileUpdateError,
          );

          continue;
        }

        expiredCount++;

        /*
         * Find the latest expired paid VIP payment.
         */
        const {
          data: latestPayment,
        } = await adminSupabase
          .from("vip_payments")
          .select(
            `
              id,
              expiration_email_sent_at
            `,
          )
          .eq("user_id", profile.id)
          .eq("status", "paid")
          .order(
            "vip_expires_at",
            {
              ascending: false,
            },
          )
          .limit(1)
          .maybeSingle();

        /*
         * Send expiration email only once.
         */
        if (
          latestPayment &&
          !latestPayment.expiration_email_sent_at
        ) {
          await sendLikhaEmail({
            to: authUser.user.email,
            subject:
              "Your LIKHA VIP membership has expired",
            html: `
              <div style="margin:0;padding:0;background:#f5f0e6;font-family:Arial,sans-serif;color:#173d32;">
                <div style="max-width:620px;margin:0 auto;padding:40px 20px;">
                  <div style="overflow:hidden;border:1px solid rgba(23,61,50,.12);border-radius:18px;background:#fbf8f1;">

                    <div style="background:#173d32;padding:30px 36px;">
                      <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:8px;color:#f5f0e6;">
                        LIKHA
                      </div>
                    </div>

                    <div style="padding:42px 36px 38px;">



                      <h1 style="margin:18px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.2;font-weight:400;color:#173d32;">
                        Your VIP membership has expired.
                      </h1>

                      <p style="margin:26px 0 0;font-size:15px;line-height:1.8;color:#6f817b;">
                        Nag-expire na ang iyong LIKHA VIP membership.
                      </p>

                      <p style="margin:18px 0 0;font-size:15px;line-height:1.8;color:#6f817b;">
                        Ibinalik na ang iyong account sa Standard membership. Kung gusto mong bumalik sa VIP, maaari kang mag-renew anumang oras.
                      </p>

                      <div style="margin-top:30px;">
                        <a
                        href="https://likha.gimenodesignsolutions.asia/vip"
                          style="display:inline-block;border-radius:9px;background:#b76449;padding:14px 22px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;"
                        >
                          Renew VIP
                        </a>
                      </div>

                      <div style="margin-top:40px;padding-top:26px;border-top:1px solid rgba(23,61,50,.10);">
                        <p style="margin:0;font-size:13px;line-height:1.8;color:#82918c;">
                          Walang automatic na charge. Walang payment na kukunin mula sa account mo nang wala kang bagong checkout.
                        </p>
                      </div>

                    </div>
                  </div>

                  <div style="padding:22px 20px;text-align:center;font-size:11px;line-height:1.8;color:#98a39f;">
                    This is an automated LIKHA membership email.
                  </div>
                </div>
              </div>
            `,
          });

          await adminSupabase
            .from("vip_payments")
            .update({
              expiration_email_sent_at:
                now.toISOString(),
            })
            .eq(
              "id",
              latestPayment.id,
            );

          expirationEmailsSent++;
        }
      } catch (error) {
        console.error(
          "VIP expiration processing failed:",
          profile.id,
          error,
        );
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent,
      expiredCount,
      expirationEmailsSent,
    });
  } catch (error) {
    console.error(
      "VIP cron error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unexpected VIP cron error.",
      },
      { status: 500 },
    );
  }
}