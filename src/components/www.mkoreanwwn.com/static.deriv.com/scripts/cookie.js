// marketing-utils@2.1.2/dist/cookie.js
window.marketingTrackingSent = !1;
var J = (o, i) => {
    if (i == null) return "";
    let r = typeof i == "string" ? i : String(i);
    if (r.startsWith("{") || r.startsWith("["))
      try {
        return JSON.parse(r), r;
      } catch (n) {
        console.error(`Invalid JSON in cookie ${o}:`, n);
      }
    return r.replace(/[<>'"]/g, "");
  },
  I = () => {
    let o = location.hostname;
    return (
      ["deriv.com", "deriv.ae", "binary.sx"].find((l) => o.includes(l)) ?? o
    );
  },
  c = (o) => {
    if (!o) return null;
    try {
      let i = encodeURIComponent(o),
        r = document.cookie.split(";");
      for (let l of r) {
        if (((l = l.trim()), l.startsWith(i + "="))) {
          let n = l.substring(i.length + 1);
          return decodeURIComponent(n);
        }
        if (l.startsWith(o + "=")) {
          let n = l.substring(o.length + 1),
            f;
          try {
            f = decodeURIComponent(n);
          } catch {
            f = n;
          }
          return f;
        }
      }
      return null;
    } catch (i) {
      return console.error("Failed to get cookie:", i), null;
    }
  };
function W() {
  let o = { original: {}, sanitized: {} };
  (window.marketingCookieLogs = []), (window.marketingCookies = {});
  let i = new URLSearchParams(window.location.search),
    r = {},
    l = null,
    n = !0,
    f = !1,
    d =
      i.has("t") || i.has("affiliate_token") || i.has("sidc") || i.has("sidi"),
    u = i.has("sidi"),
    h = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "utm_ad_id",
      "utm_click_id",
      "utm_adgroup_id",
      "utm_campaign_id",
      "utm_msclk_id",
      "utm_fbcl_id",
      "utm_ttclid",
      "utm_sccid",
      ["msclkid", "utm_msclk_id"],
      ["fbclid", "utm_fbcl_id"],
      ["ttclid", "utm_ttclid"],
      ["ScCid", "utm_sccid"],
    ],
    _ = (e, t) => {
      let a;
      try {
        a = new Date().toISOString();
      } catch {
        a = new Date(Date.now()).toISOString();
      }
      window.marketingCookieLogs.push({ timestamp: a, action: e, details: t });
    },
    g = (e, t, a = {}) => {
      let s = J(e, t),
        k = {
          ...{
            expires: 365,
            domain: I(),
            path: "/",
            sameSite: "None",
            secure: !0,
          },
          ...a,
        },
        L = "";
      if (k.expires) {
        let w = new Date();
        typeof k.expires == "number"
          ? w.setTime(w.getTime() + k.expires * 24 * 60 * 60 * 1e3)
          : k.expires instanceof Date && w.setTime(k.expires.getTime()),
          (L = `; expires=${w.toUTCString()}`);
      }
      let $ = `${encodeURIComponent(e)}=${encodeURIComponent(s)}${L}`;
      k.domain && ($ += `; domain=${k.domain}`),
        k.path && ($ += `; path=${k.path}`),
        k.sameSite && ($ += `; SameSite=${k.sameSite}`),
        k.secure && ($ += "; Secure");
      let R = !1;
      try {
        document.cookie = $;
        let w = c(e);
        (R = w === s),
          R ||
            console.warn(
              `Cookie verification failed for ${e}. Expected: ${s}, Got: ${w}`
            );
      } catch (w) {
        console.error("Failed to set cookie:", w);
      }
      return (
        (window.marketingCookies[e] = t),
        (o.original[e] = t),
        (o.sanitized[e] = s),
        R
      );
    },
    p = (e) => {
      let t = c(e),
        a = new Date(0).toUTCString(),
        s = I();
      try {
        (document.cookie = `${encodeURIComponent(
          e
        )}=; expires=${a}; domain=${s}; path=/; SameSite=None; Secure`),
          (document.cookie = `${encodeURIComponent(
            e
          )}=; expires=${a}; path=/; SameSite=None; Secure`),
          (document.cookie = `${encodeURIComponent(
            e
          )}=; expires=${a}; domain=${s}; path=/`),
          (document.cookie = `${encodeURIComponent(e)}=; expires=${a}; path=/`);
      } catch (E) {
        console.error("Failed to erase cookie:", E);
      }
      delete window.marketingCookies[e],
        delete o.original[e],
        delete o.sanitized[e];
    },
    F = () =>
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ),
    m = (e) => {
      if (e instanceof Date && !isNaN(e.getTime())) {
        let t = e.getUTCFullYear(),
          a = String(e.getUTCMonth() + 1).padStart(2, "0"),
          s = String(e.getUTCDate()).padStart(2, "0");
        return `${t}-${a}-${s}`;
      }
      return "";
    },
    x = (e, t) => {
      let a = e.utm_source && e.utm_source !== "null";
      return !!(
        (!t && a) ||
        ["utm_source", "utm_medium", "utm_campaign"].every((k) => e[k])
      );
    },
    v = (e) => {
      if (e == null) return "";
      if (typeof e == "string") return e;
      try {
        return JSON.stringify(e);
      } catch (t) {
        return console.warn("Failed to stringify cookie value:", t), String(e);
      }
    },
    C = () => {
      let e = {};
      return (
        Object.entries(window.marketingCookies).forEach(([t, a]) => {
          e[t] = v(a);
        }),
        e
      );
    },
    q = () => {
      try {
        document.cookie = "deriv_test_cookie=1; SameSite=None; Secure";
        let e = document.cookie.includes("deriv_test_cookie="),
          t = {
            status: e ? "enabled" : "disabled",
            browser: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              vendor: navigator.vendor,
            },
            cookieConfig: { sameSite: "None", secure: !0, domain: I() },
            cookieSettings: {
              thirdPartyCookies: e ? "supported" : "blocked",
              cookieEnabled: navigator.cookieEnabled,
              doNotTrack: navigator.doNotTrack || window.doNotTrack,
            },
            storage: {
              localStorage: (() => {
                try {
                  return (
                    localStorage.setItem("test", "test"),
                    localStorage.removeItem("test"),
                    "supported"
                  );
                } catch {
                  return "blocked";
                }
              })(),
              sessionStorage: (() => {
                try {
                  return (
                    sessionStorage.setItem("test", "test"),
                    sessionStorage.removeItem("test"),
                    "supported"
                  );
                } catch {
                  return "blocked";
                }
              })(),
            },
          };
        return (
          e ||
            console.warn(
              "\u26A0\uFE0F Cookies not stored - possibly ITP or blocked."
            ),
          JSON.stringify(t)
        );
      } catch (e) {
        return (
          console.warn("\u274C Cookie setting failed:", e),
          `error: ${e.message || e.toString()}`
        );
      }
    },
    V = (e = 150, t = 1e3) => {
      let s =
        window.Analytics?.trackEvent instanceof Function
          ? window.Analytics.trackEvent
          : window.Analytics?.Analytics?.trackEvent instanceof Function
          ? window.Analytics.Analytics.trackEvent
          : null;
      s
        ? setTimeout(() => {
            console.warn("Marketing cookies has been handled"),
              s("debug_marketing_cookies", {
                marketing_cookies: C(),
                cookie_status: q(),
              });
          }, 1e3)
        : e > 0
        ? setTimeout(() => V(e - 1, t), t)
        : console.warn("trackEvent not available after waiting.");
    },
    A = (e) => {
      [
        "utm_data",
        "affiliate_tracking",
        "affiliate_data",
        "affiliate_token_type",
        "signup_device",
        "date_first_contact",
        "gclid",
        "campaign_channel",
      ].forEach((a) => p(a)),
        (window.marketingCookies = {}),
        (o.original = {}),
        (o.sanitized = {}),
        console.error("\u{1F6A8} AFFILIATE LINK ERROR:", e),
        _("affiliate_validation", { error: e, action: "cookies_cleaned" });
    },
    D = c("utm_data"),
    S = {};
  if (D)
    try {
      S = JSON.parse(D);
    } catch {
      try {
        S = JSON.parse(decodeURIComponent(D));
      } catch (t) {
        console.error("Failed to parse utm_data cookie:", t), (S = {});
      }
    }
  if (S?.utm_medium === "affiliate" && !d) {
    let e = c("affiliate_data"),
      t = c("affiliate_tracking"),
      a = !1;
    if ((t && (a = !0), !a && e))
      try {
        let s = JSON.parse(e);
        a = !!(s.affiliate_token || s.affiliate_tracking);
      } catch {
        a = !1;
      }
    if (!a)
      return (
        A(
          "Existing utm_medium=affiliate but missing affiliate parameters and no valid affiliate cookies"
        ),
        o
      );
  }
  let y = {};
  !S?.utm_source &&
    !i.toString() &&
    (y = { utm_source: document.referrer || "null" }),
    h.forEach((e) => {
      if (Array.isArray(e)) {
        let [t, a] = e;
        if (i.has(t)) {
          let s = i.get(t).substring(0, 200);
          y[a] = s;
        }
      } else if (i.has(e)) {
        let t = i.get(e).substring(0, 100);
        y[e] = t;
      }
    });
  let O = {};
  if (
    ([
      "gclid",
      "wbraid",
      "gbraid",
      "ttclid",
      "msclkid",
      ["ScCid", "scclid"],
    ].forEach((e) => {
      if (Array.isArray(e)) {
        let [t, a] = e;
        if (i.has(t)) {
          let s = i.get(t).substring(0, 200);
          O[a] = s;
        }
      } else if (i.has(e)) {
        let t = i.get(e).substring(0, 100);
        O[e] = t;
      }
    }),
    Object.keys(O).length > 0 &&
      (c("stp_data") && p("stp_data"), g("stp_data", JSON.stringify(O))),
    y.utm_medium === "affiliate" && !d)
  )
    return (
      A(
        "New utm_medium=affiliate but missing affiliate parameters (t, affiliate_token, or sidc)"
      ),
      o
    );
  let B = x(y, S),
    M = location.origin + location.pathname;
  if (
    (B
      ? (p("affiliate_tracking"),
        p("affiliate_data"),
        p("affiliate_token_type"),
        p("utm_data"),
        g("utm_data", JSON.stringify(y)),
        g("landing_page_url", M),
        (f = !0),
        (r = y))
      : ((n = !1),
        (r = { ...S, ...y }),
        Object.keys(y).length > 0 &&
          (g("utm_data", JSON.stringify(r)), g("landing_page_url", M))),
    _("affiliate_tracking", {
      action: "started",
      hasAffiliateParams: d,
      searchParams: {
        t: i.get("t"),
        affiliate_token: i.get("affiliate_token"),
        sidc: i.get("sidc"),
        sidi: i.get("sidi"),
      },
      overwrite_happened: f,
    }),
    d)
  ) {
    let e =
      i.get("t") || i.get("affiliate_token") || i.get("sidc") || i.get("sidi");
    _("affiliate_tracking", {
      action: "affiliate_params_found",
      affiliateValue: e,
      source: i.has("t")
        ? "t"
        : i.has("affiliate_token")
        ? "affiliate_token"
        : "sidc",
    }),
      p("affiliate_tracking"),
      g("affiliate_tracking", e),
      g("affiliate_token_type", u ? "partner" : "client"),
      (l = e),
      _("affiliate_tracking", {
        action: "affiliate_set",
        affiliateValue: e,
        cookie_verification: c("affiliate_tracking"),
      });
  } else
    _("affiliate_tracking", {
      action: "no_affiliate_params",
      existing_affiliate_cookie: c("affiliate_tracking"),
    });
  _("affiliate_tracking", {
    action: "completed",
    final_affiliate_tracking: l,
    final_cookie_value: c("affiliate_tracking"),
  });
  let z = c("signup_device") || "{}",
    b = {};
  try {
    b = JSON.parse(z);
  } catch {
    try {
      b = JSON.parse(
        decodeURI(z).replaceAll("%2C", ",").replaceAll("%3A", ":")
      );
    } catch (t) {
      console.error("Failed to parse signup_device cookie:", t), (b = {});
    }
  }
  if (b.signup_device)
    (o.original.signup_device = b.signup_device),
      (o.sanitized.signup_device = b.signup_device);
  else {
    let t = { signup_device: F() ? "mobile" : "desktop" };
    g("signup_device", JSON.stringify(t));
  }
  let P = c("date_first_contact") || "{}",
    T = {};
  try {
    T = JSON.parse(P);
  } catch {
    try {
      T = JSON.parse(
        decodeURI(P).replaceAll("%2C", ",").replaceAll("%3A", ":")
      );
    } catch (t) {
      console.error("Failed to parse date_first_contact cookie:", t), (T = {});
    }
  }
  if (T.date_first_contact)
    (o.original.date_first_contact = T.date_first_contact),
      (o.sanitized.date_first_contact = T.date_first_contact);
  else {
    let e = Math.floor(Date.now() / 1e3),
      t = { date_first_contact: m(new Date(e * 1e3)) };
    g("date_first_contact", JSON.stringify(t));
  }
  let G = i.get("gclid"),
    H = i.get("gclid_url"),
    K = G || H || "";
  K && (p("gclid"), g("gclid", K));
  let j = i.get("ca");
  if (
    (j && (p("campaign_channel"), g("campaign_channel", j)),
    _("affiliate_data", {
      action: "started",
      hasAffiliateParams: d,
      affiliate_tracking: l,
      utm_data_cookie: c("utm_data"),
    }),
    d)
  ) {
    let e = { affiliate_token: l, ...r };
    _("affiliate_data", {
      action: "creating_combined_data",
      combined_affiliate_data: e,
      utm_data: r,
      affiliate_tracking: l,
    }),
      p("affiliate_data"),
      g("affiliate_data", JSON.stringify(e)),
      _("affiliate_data", {
        action: "affiliate_data_set",
        cookie_verification: c("affiliate_data"),
      });
  } else
    _("affiliate_data", {
      action: "no_affiliate_params_skipping_affiliate_data",
    });
  let N = r.utm_medium || S?.utm_medium;
  if (
    (_("affiliate_validation", {
      action: "final_validation_check",
      current_utm_medium: N,
      hasAffiliateParams: d,
      utm_data: r,
      current_utm_data: S,
      affiliate_tracking_cookie: c("affiliate_tracking"),
      utm_data_cookie: c("utm_data"),
      affiliate_data_cookie: c("affiliate_data"),
    }),
    N === "affiliate" && !d)
  ) {
    let e = c("affiliate_data"),
      t = c("affiliate_tracking"),
      a = !1;
    if ((t && (a = !0), !a && e))
      try {
        let s = JSON.parse(e);
        a = !!(s.affiliate_token || s.affiliate_tracking);
      } catch {
        a = !1;
      }
    a
      ? _("affiliate_validation", {
          action: "validation_passed_with_existing_token",
          current_utm_medium: N,
          hasAffiliateParams: d,
          has_valid_affiliate_token: a,
          existing_affiliate_tracking: t,
          existing_affiliate_data: e,
        })
      : (_("affiliate_validation", {
          action: "validation_failed_cleaning_cookies",
          reason:
            "utm_medium=affiliate but missing affiliate parameters and no valid affiliate cookies",
          current_utm_medium: N,
          hasAffiliateParams: d,
          has_valid_affiliate_token: a,
          existing_affiliate_tracking: t,
          existing_affiliate_data: e,
        }),
        A(
          "utm_medium=affiliate but missing affiliate parameters and no valid affiliate cookies"
        ));
  } else
    _("affiliate_validation", {
      action: "validation_passed",
      current_utm_medium: N,
      hasAffiliateParams: d,
    });
  return (
    [
      "utm_data",
      "affiliate_tracking",
      "affiliate_data",
      "affiliate_token_type",
      "signup_device",
      "date_first_contact",
      "gclid",
      "campaign_channel",
    ].forEach((e) => {
      let t = c(e);
      t !== null &&
        !o.original[e] &&
        ((o.original[e] = t),
        (o.sanitized[e] = J(e, t)),
        (window.marketingCookies[e] = t));
    }),
    window.marketingTrackingSent || (V(), (window.marketingTrackingSent = !0)),
    o
  );
}
W();
U();
window.getMarketingCookies = () => W();
function U() {
  let o = (h, _, g = {}) => {
      let p = J(h, _),
        m = {
          ...{
            expires: 365,
            domain: I(),
            path: "/",
            sameSite: "None",
            secure: !0,
          },
          ...g,
        },
        x = "";
      if (m.expires) {
        let C = new Date();
        typeof m.expires == "number"
          ? C.setTime(C.getTime() + m.expires * 24 * 60 * 60 * 1e3)
          : m.expires instanceof Date && C.setTime(m.expires.getTime()),
          (x = `; expires=${C.toUTCString()}`);
      }
      let v = `${encodeURIComponent(h)}=${encodeURIComponent(p)}${x}`;
      m.domain && (v += `; domain=${m.domain}`),
        m.path && (v += `; path=${m.path}`),
        m.sameSite && (v += `; SameSite=${m.sameSite}`),
        m.secure && (v += "; Secure");
      try {
        return (document.cookie = v), !0;
      } catch {
        return !1;
      }
    },
    i = c("stp_data"),
    r = {};
  if (i)
    try {
      r = JSON.parse(i);
    } catch (h) {
      console.warn(
        "Failed to parse existing stp_data cookie, starting fresh:",
        h
      ),
        (r = {});
    }
  let l = c("_fbc"),
    n = c("_fbp"),
    f = c("_ga");
  l && (r.fbc = l), n && (r.fbp = n), f && (r._ga = f);
  let d = location.hostname.includes("deriv.ae")
      ? "_ga_F3QTR4CDHR"
      : "_ga_R0D2Z1965W",
    u = c(d);
  u && ((r._ga_measurement_id = d), (r._ga_measurement_value = u)),
    o("stp_data", JSON.stringify(r));
}
window.addStpCookieData = U;
var Q = () => {
  let o = {},
    i = (n, f = null) => {
      let d = c(n);
      if (!d) return null;
      try {
        let u = JSON.parse(d);
        return !u || (typeof u == "object" && Object.keys(u).length === 0)
          ? null
          : f
          ? u[f] || null
          : u;
      } catch (u) {
        return console.error(`Failed to parse ${n} cookie:`, u), null;
      }
    },
    r = (n) => c(n) || null,
    l = [
      { cookieName: "utm_data", resultKey: "utm_data", parser: i },
      {
        cookieName: "date_first_contact",
        resultKey: "date_first_contact",
        parser: i,
        property: "date_first_contact",
      },
      {
        cookieName: "signup_device",
        resultKey: "signup_device",
        parser: i,
        property: "signup_device",
      },
      {
        cookieName: "landing_page_url",
        resultKey: "landing_page_url",
        parser: r,
      },
      {
        cookieName: "campaign_channel",
        resultKey: "campaign_channel",
        parser: r,
      },
    ];
  l &&
    Array.isArray(l) &&
    l.forEach(({ cookieName: n, resultKey: f, parser: d, property: u }) => {
      try {
        let h = u ? d(n, u) : d(n);
        h !== null && (o[f] = h);
      } catch (h) {
        console.error(`Error processing cookie ${n}:`, h);
      }
    });
  try {
    let n = i("affiliate_data", "affiliate_token");
    n && (o.affiliate_data = { token: n });
  } catch (n) {
    console.error("Error processing affiliate_data:", n);
  }
  try {
    U();
    let n = i("stp_data");
    n && (o.marketing_analytics_data = n);
  } catch (n) {
    console.error("Error processing stp_data:", n);
  }
  return o;
};
window.getMarketingCookiesPayloadData = Q;
//# sourceMappingURL=cookie.js.map
