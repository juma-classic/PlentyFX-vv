"use strict";
(self.webpackChunkbot = self.webpackChunkbot || []).push([
  ["297"],
  {
    55600: function (e, t, n) {
      n.r(t), n.d(t, { default: () => tN });
      var l,
        i = n("85893"),
        o = n("67294"),
        a = n("67026"),
        r = n("92198"),
        s = n("89250"),
        c = n("66175"),
        d = n("30453"),
        u = n("37979"),
        h = n("2502"),
        m = n("89471");
      let g = function () {
        let e = (0, s.TH)(),
          t = (0, s.s0)();
        return {
          deleteQueryString: function (n) {
            let l = new URLSearchParams(e.search);
            l.delete(n), t({ search: l.toString() }, { replace: !0 });
          },
          queryString: (function () {
            let t = new URLSearchParams(e.search),
              n = {};
            return (
              t.forEach((e, t) => {
                n[t] = e;
              }),
              n
            );
          })(),
          setQueryString: function (n) {
            !(function (n) {
              let l = new URLSearchParams(e.search);
              Object.entries(n).forEach((e) => {
                let [t, n] = e;
                void 0 === n ? l.delete(t) : l.set(t, n);
              }),
                t({ search: l.toString() }, { replace: !0 });
            })(n);
          },
        };
      };
      function x(e) {
        let { deleteQueryString: t, queryString: n, setQueryString: l } = g(),
          { isDesktop: i } = (0, h.F)(),
          [a, r] = (0, m.Sx)(),
          s = () => {
            if (
              (!n.modal && r.setAll([]),
              (null == e ? void 0 : e.shouldReinitializeModals) !== void 0 &&
                !1 === e.shouldReinitializeModals)
            )
              t("modal");
            else {
              let e = n.modal;
              if (e) {
                let t = e.split(","),
                  n = t.slice(-1)[0];
                r.setAll([]),
                  t.forEach((e) => {
                    r.set(e, !i);
                  }),
                  r.set(n, !0);
              }
            }
          };
        return (
          (0, o.useEffect)(() => {
            s();
          }, []),
          (0, o.useEffect)(() => {
            !(null == n ? void 0 : n.modal) && r.reset();
          }, [null == n ? void 0 : n.modal]),
          (0, m.OR)("popstate", () => {
            s();
          }),
          {
            hideModal: (e) => {
              let i = n.modal;
              if (i) {
                let n = i.split(",");
                if (null == e ? void 0 : e.shouldHideAllModals)
                  a.forEach((e, n) => {
                    r.set(n, !1), t("modal");
                  });
                else if (null == e ? void 0 : e.shouldHidePreviousModals) {
                  if (n.length > 1) {
                    let e = n.shift();
                    n.forEach((e) => {
                      r.set(e, !1);
                    }),
                      (n = [e ?? ""]),
                      l({ modal: e });
                  } else 1 === n.length ? l({ modal: n[0] }) : t("modal");
                } else {
                  let e = n.pop(),
                    i = n.slice(-1)[0];
                  i ? (r.set(e, !1), r.set(i, !0)) : r.set(e, !1),
                    0 === n.length ? t("modal") : l({ modal: n.join(",") });
                }
              }
            },
            isModalOpenFor: (e) => a.get(e) || !1,
            showModal: (e, t) => {
              let o = n.modal;
              if (o) {
                let n = o.split(","),
                  a = n.slice(-1)[0];
                if (a === e) return;
                (null == t ? void 0 : t.shouldStackModals) === !1
                  ? r.set(a, !1)
                  : r.set(a, (null == t ? void 0 : t.shouldStackModals) || !i),
                  r.set(e, !0),
                  n.push(e),
                  l({
                    modal: (null == t ? void 0 : t.shouldClearPreviousModals)
                      ? e
                      : n.join(","),
                  });
              } else r.set(e, !0), l({ modal: e });
            },
          }
        );
      }
      let _ = () => {
        let e = localStorage.getItem("active_tab"),
          t = ["dashboard", "bot_builder", "chart", "tutorial"],
          n = t[Number(e)],
          l = window.location.href.split("#")[0];
        return `${l}#${n}`;
      };
      var v = n("32305"),
        p = n("96223"),
        j = n("3693"),
        b = n("98146"),
        f = n("64410"),
        w = n("918"),
        y = n("50051"),
        C = n("16496"),
        k = n("59001"),
        I = n("57218"),
        N = n("12811"),
        Z = n("28505"),
        S = n("73971"),
        L = n("99243"),
        z = n("63066"),
        E = n("96396"),
        A = n("14249"),
        M = n("45322"),
        F = n("34273"),
        T = n("473");
      let D = [
        {
          code: "EN",
          displayName: "English",
          icon: (0, i.jsx)(v.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(v.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(v.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "AR",
          displayName: "العربية",
          icon: (0, i.jsx)(p.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(p.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(p.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "BN",
          displayName: "বাংলা",
          icon: (0, i.jsx)(j.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(j.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(j.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "DE",
          displayName: "Deutsch",
          icon: (0, i.jsx)(b.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(b.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(b.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "ES",
          displayName: "Espa\xf1ol",
          icon: (0, i.jsx)(f.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(f.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(f.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "FR",
          displayName: "Fran\xe7ais",
          icon: (0, i.jsx)(w.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(w.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(w.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "IT",
          displayName: "Italiano",
          icon: (0, i.jsx)(y.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(y.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(y.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "SW",
          displayName: "Kiswahili",
          icon: (0, i.jsx)(C.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(C.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(C.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "KM",
          displayName: "ខ្មែរ",
          icon: (0, i.jsx)(k.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(k.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(k.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "KO",
          displayName: "한국어",
          icon: (0, i.jsx)(I.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(I.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(I.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "PL",
          displayName: "Polish",
          icon: (0, i.jsx)(N.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(N.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(N.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "PT",
          displayName: "Portugu\xeas",
          icon: (0, i.jsx)(Z.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(Z.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(Z.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "RU",
          displayName: "Русский",
          icon: (0, i.jsx)(S.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(S.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(S.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "SI",
          displayName: "සිංහල",
          icon: (0, i.jsx)(L.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(L.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(L.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "TH",
          displayName: "ไทย",
          icon: (0, i.jsx)(z.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(z.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(z.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "TR",
          displayName: "T\xfcrk\xe7e",
          icon: (0, i.jsx)(E.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(E.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(E.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "UZ",
          displayName: "O'zbek",
          icon: (0, i.jsx)(A.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(A.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(A.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "VI",
          displayName: "Tiếng Việt",
          icon: (0, i.jsx)(M.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(M.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(M.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "ZH_CN",
          displayName: "简体中文",
          icon: (0, i.jsx)(F.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(F.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(F.Z, {
            height: 14.67,
            width: 22,
          }),
        },
        {
          code: "ZH_TW",
          displayName: "繁體中文",
          icon: (0, i.jsx)(T.Z, { height: 24, width: 36 }),
          placeholderIcon: (0, i.jsx)(T.Z, { height: 12, width: 18 }),
          placeholderIconInMobile: (0, i.jsx)(T.Z, {
            height: 14.67,
            width: 22,
          }),
        },
      ];
      var P = n("48059"),
        R = n("44412"),
        O = n("70195"),
        U = n("68669");
      let H = () =>
        (0, U.oR)()
          ? (0, i.jsx)("div", {
              className: "toolbar__section",
              "data-testid": "dt_run_strategy",
              children: (0, i.jsx)(O.Z, { className: "toolbar__animation" }),
            })
          : null;
      var $ = n("96877"),
        V = n("83257"),
        B = n("53261"),
        X = n("21456"),
        q = n("64915");
      let K = (0, $.Pi)(() => {
        let { is_dark_mode_on: e, toggleTheme: t } = (0, V.Z)(),
          { localize: n } = (0, P.T_)();
        return (0, i.jsx)(q.u, {
          as: "button",
          className: "app-footer__icon",
          tooltipContent: n("Change theme"),
          onClick: t,
          children: e
            ? (0, i.jsx)(X.Z, { iconSize: "xs" })
            : (0, i.jsx)(B.Z, { iconSize: "xs" }),
        });
      });
      var W = n("83606");
      let G = () => {
        let { isDesktop: e } = (0, h.F)(),
          t = new Date().getFullYear(),
          n = `\xc2\xa9 ${t} MkoreanWWN`;
        return (0, i.jsx)(q.u, {
          as: "div",
          className: "app-footer__copyright",
          "data-testid": "dt_copyright",
          tooltipContent:
            "All rights reserved. Unauthorized copying, modification, or resale is prohibited.",
          children: (0, i.jsx)(W.x, {
            size: e ? "xs" : "sm",
            color: "less-prominent",
            children: n,
          }),
        });
      };
      var J = n("79655"),
        Y = n("45452"),
        Q = n("12838");
      let ee = () => {
          let e = Q.fV.getValue(Q.sE.configServerURL);
          return e
            ? (0, i.jsxs)(Y.Z, {
                className: "app-footer__endpoint",
                color: "red",
                size: "s",
                children: [
                  "The server",
                  " ",
                  (0, i.jsx)(J.rU, {
                    className: "app-footer__endpoint-text",
                    to: c.xOw.endpoint,
                    children: "endpoint",
                  }),
                  " ",
                  `is: ${e}`,
                ],
              })
            : null;
        },
        et = {
          exit: [
            "exitFullscreen",
            "webkitExitFullscreen",
            "mozCancelFullScreen",
            "msExitFullscreen",
          ],
          request: [
            "requestFullscreen",
            "webkitRequestFullscreen",
            "mozRequestFullScreen",
            "msRequestFullscreen",
          ],
          screenChange: [
            "fullscreenchange",
            "webkitfullscreenchange",
            "mozfullscreenchange",
            "MSFullscreenChange",
          ],
          screenElement: [
            "fullscreenElement",
            "webkitFullscreenElement",
            "mozFullScreenElement",
            "msFullscreenElement",
          ],
        },
        en = () => {
          let [e, t] = (0, o.useState)(!1),
            { exit: n, request: l, screenChange: i, screenElement: a } = et,
            r = (0, o.useCallback)(() => t(a.some((e) => document[e])), [a]);
          return (
            (0, o.useEffect)(
              () => (
                i.forEach((e) => {
                  document.addEventListener(e, r, !1);
                }),
                () => {
                  i.forEach((e) => {
                    document.removeEventListener(e, r, !1);
                  });
                }
              ),
              [r, i]
            ),
            {
              toggleFullScreenMode: (i) => {
                null == i || i.stopPropagation();
                let o = n.find((e) => document[e]),
                  a = l.find((e) => document.documentElement[e]);
                e && o
                  ? document[o]()
                  : a
                  ? document.documentElement[a]()
                  : t(!1);
              },
            }
          );
        };
      var el = n("69914");
      let ei = () => {
          let { toggleFullScreenMode: e } = en(),
            { localize: t } = (0, P.T_)();
          return (0, i.jsx)(q.u, {
            as: "button",
            className: "app-footer__icon",
            onClick: e,
            tooltipContent: t("Full screen"),
            children: (0, i.jsx)(el.Z, { iconSize: "xs" }),
          });
        },
        eo = (e) => {
          let { openLanguageSettingModal: t } = e,
            { currentLang: n, localize: l } = (0, P.T_)(),
            a = (0, o.useMemo)(() => {
              var e;
              return null ===
                (e = D.find((e) => {
                  let { code: t } = e;
                  return t == n;
                })) || void 0 === e
                ? void 0
                : e.placeholderIcon;
            }, [n]);
          return (0, i.jsxs)(q.u, {
            as: "button",
            className: "app-footer__language",
            onClick: t,
            tooltipContent: l("Language"),
            children: [
              a,
              (0, i.jsx)(Y.Z, { size: "xs", weight: "bold", children: n }),
            ],
          });
        },
        ea = () =>
          "undefined" == typeof navigator ||
          "boolean" != typeof navigator.onLine ||
          navigator.onLine,
        er = () => {
          let [e, t] = (0, o.useState)(ea()),
            n = () => t(!0),
            l = () => t(!1);
          return (
            (0, o.useEffect)(
              () => (
                window.addEventListener("online", n),
                window.addEventListener("offline", l),
                () => {
                  window.removeEventListener("online", n),
                    window.removeEventListener("offline", l);
                }
              ),
              []
            ),
            e
          );
        },
        es = () => {
          let [e, t] = (0, o.useState)("online"),
            n = er();
          return (
            (0, o.useEffect)(() => {
              n ? t("online") : t("offline");
            }, [n]),
            e
          );
        },
        ec = () => ({
          blinking: {
            className:
              "app-footer__network-status-online app-footer__network-status-blinking",
            tooltip: (0, P.NC)("Connecting to server"),
          },
          offline: {
            className: "app-footer__network-status-offline",
            tooltip: "Offline",
          },
          online: {
            className: "app-footer__network-status-online",
            tooltip: "Online",
          },
        }),
        ed = () => {
          let e = es(),
            { className: t, tooltip: n } = (0, o.useMemo)(() => ec()[e], [e]);
          return (0, i.jsx)(q.u, {
            as: "div",
            className: "app-footer__icon",
            "data-testid": "dt_network_status",
            tooltipContent: (0, P.NC)("Network status: {{status}}", {
              status: n,
            }),
            children: (0, i.jsx)("div", {
              className: (0, a.Z)("app-footer__network-status", t),
              "data-testid": "dt_circle",
            }),
          });
        };
      var eu = n("30381"),
        eh = n.n(eu),
        em = n("27179");
      let eg = (0, $.Pi)(() => {
          let { isDesktop: e } = (0, h.F)(),
            { common: t } = (0, U.oR)() ?? { common: { server_time: eh()() } };
          return (0, i.jsx)(q.u, {
            as: "div",
            className: "app-footer__icon",
            "data-testid": "dt_server_time",
            tooltipContent: t.server_time.format(em.kT),
            children: (0, i.jsx)(W.x, {
              size: e ? "xs" : "sm",
              children: t.server_time.format(em.Yp),
            }),
          });
        }),
        ex = () => {
          let {
              currentLang: e = "EN",
              localize: t,
              switchLanguage: n,
            } = (0, P.T_)(),
            { hideModal: l, isModalOpenFor: o, showModal: a } = x();
          return (0, i.jsxs)("footer", {
            className: "app-footer",
            children: [
              (0, i.jsx)("div", {
                className: "app-footer__center",
                children: (0, i.jsx)(H, {}),
              }),
              (0, i.jsx)(ei, {}),
              (0, i.jsx)(eo, {
                openLanguageSettingModal: () => a("DesktopLanguagesModal"),
              }),
              (0, i.jsx)("div", { className: "app-footer__vertical-line" }),
              (0, i.jsx)(K, {}),
              (0, i.jsx)("div", { className: "app-footer__vertical-line" }),
              (0, i.jsx)(eg, {}),
              (0, i.jsx)("div", { className: "app-footer__vertical-line" }),
              (0, i.jsx)(ed, {}),
              (0, i.jsx)(ee, {}),
              (0, i.jsx)(G, {}),
              o("DesktopLanguagesModal") &&
                (0, i.jsx)(R.u, {
                  headerTitle: t("Select Language"),
                  isModalOpen: !0,
                  languages: D,
                  onClose: l,
                  onLanguageSwitch: (e) => {
                    n(e),
                      l(),
                      window.location.replace(_()),
                      window.location.reload();
                  },
                  selectedLanguage: e,
                }),
            ],
          });
        };
      var e_ = n("88079");
      let ev = {
          aud: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyAudIcon }))
          ),
          bch: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyBchIcon }))
          ),
          btc: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyBtcIcon }))
          ),
          busd: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyBusdIcon }))
          ),
          dai: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyDaiIcon }))
          ),
          eth: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyEthIcon }))
          ),
          eur: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyEurIcon }))
          ),
          "eur-check": (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyEurIcon }))
          ),
          eurs: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyEursIcon }))
          ),
          eusdt: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyUsdtIcon }))
          ),
          gbp: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyGbpIcon }))
          ),
          idk: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyIdkIcon }))
          ),
          ltc: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyLtcIcon }))
          ),
          pax: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyPaxIcon }))
          ),
          tusd: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyTusdIcon }))
          ),
          tusdt: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyUsdtIcon }))
          ),
          unknown: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyPlaceholderIcon }))
          ),
          usd: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyUsdIcon }))
          ),
          usdc: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyUsdcIcon }))
          ),
          usdk: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyUsdkIcon }))
          ),
          ust: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyUsdtIcon }))
          ),
          virtual: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyDemoIcon }))
          ),
          xrp: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyXrpIcon }))
          ),
          algo: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyAlgoIcon }))
          ),
          avax: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyAvaxIcon }))
          ),
          bat: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyBatIcon }))
          ),
          bnb: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyBnbIcon }))
          ),
          dash: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyDashIcon }))
          ),
          doge: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyDogeIcon }))
          ),
          dot: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyDotIcon }))
          ),
          eos: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyEosIcon }))
          ),
          etc: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyEtcIcon }))
          ),
          fil: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyFilIcon }))
          ),
          iota: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyIotaIcon }))
          ),
          link: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyLinkIcon }))
          ),
          matic: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyMaticIcon }))
          ),
          mkr: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyMkrIcon }))
          ),
          mcd: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyMultiCollateralDaiIcon }))
          ),
          neo: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyNeoIcon }))
          ),
          none: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyNoneIcon }))
          ),
          omg: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyOmgIcon }))
          ),
          p2p: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyP2PIcon }))
          ),
          scd: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencySingleCollateralDaiIcon }))
          ),
          sol: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencySolIcon }))
          ),
          terra: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyTerraIcon }))
          ),
          trx: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyTrxIcon }))
          ),
          uni: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyUniIcon }))
          ),
          xlm: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyXlmIcon }))
          ),
          xmr: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyXmrIcon }))
          ),
          xtz: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyXtzIcon }))
          ),
          zec: (0, o.lazy)(() =>
            n
              .e("609")
              .then(n.bind(n, 19673))
              .then((e) => ({ default: e.CurrencyZecIcon }))
          ),
        },
        ep = {
          ksh: (0, o.lazy)(() =>
            n
              .e("121")
              .then(n.bind(n, 60856))
              .then((e) => ({ default: e.FlagKenyaIcon }))
          ),
        },
        ej = (e) => {
          let { currency: t, isVirtual: n } = e,
            l = null == t ? void 0 : t.toLowerCase();
          if (!n) {
            let e = ep[l];
            if (e)
              return (0, i.jsx)(o.Suspense, {
                fallback: null,
                children: (0, i.jsx)(e, { iconSize: "sm" }),
              });
          }
          let a = n ? ev.virtual : ev[l] || ev.unknown;
          return (0, i.jsx)(o.Suspense, {
            fallback: null,
            children: (0, i.jsx)(a, { iconSize: "sm" }),
          });
        };
      var eb = n("79649"),
        ef = n("76546");
      let ew = (e) => {
        var t, n;
        let { allBalanceData: l } = e,
          { accountList: a, activeLoginid: r } = (0, eb.T)(),
          s = (0, U.oR)(),
          d =
            (null == s
              ? void 0
              : null === (t = s.ui) || void 0 === t
              ? void 0
              : t.is_ksh_currency_enabled) ?? !1,
          u = (0, o.useMemo)(
            () => (null == a ? void 0 : a.find((e) => e.loginid === r)),
            [r, a]
          ),
          h =
            null == l
              ? void 0
              : null === (n = l.accounts) || void 0 === n
              ? void 0
              : n[(null == u ? void 0 : u.loginid) ?? ""];
        return {
          data: (0, o.useMemo)(() => {
            var e;
            let t = (null == h ? void 0 : h.balance) ?? 0,
              n =
                "USD" === String(null == u ? void 0 : u.currency).toUpperCase(),
              l = d && n,
              o = l
                ? `KSH ${(t * ef.z).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : (0, c.oC5)(
                    null == t
                      ? void 0
                      : t.toFixed((0, c.i4S)(null == h ? void 0 : h.currency))
                  ) ?? "0";
            return u
              ? {
                  ...u,
                  balance: o,
                  currency: l ? "" : null == u ? void 0 : u.currency,
                  currencyLabel: (null == u ? void 0 : u.is_virtual)
                    ? (0, P.NC)("Demo")
                    : l
                    ? ""
                    : null == u
                    ? void 0
                    : u.currency,
                  icon: (0, i.jsx)(ej, {
                    currency: l
                      ? "ksh"
                      : null == u
                      ? void 0
                      : null === (e = u.currency) || void 0 === e
                      ? void 0
                      : e.toLowerCase(),
                    isVirtual: !!(null == u ? void 0 : u.is_virtual),
                  }),
                  isVirtual: !!(null == u ? void 0 : u.is_virtual),
                  isActive: (null == u ? void 0 : u.loginid) === r,
                }
              : void 0;
          }, [u, r, l, d]),
        };
      };
      var ey = n("77898"),
        eC = n("16857"),
        ek = n("32767"),
        eI = n("99466"),
        eN = n("42913"),
        eZ = n("54458"),
        eS = n("62269"),
        eL = n("28607"),
        ez = n("56594");
      let eE = {
          default: {
            logo: "/logo.svg",
            social: {
              whatsapp: "https://whatsapp.com/channel/0029VaDbybILo4heuWEGso3B",
              telegram: "https://t.me/mkoreanwwn",
              youtube: "https://www.youtube.com/@mkoreanwwntutorial",
              instagram: "https://www.instagram.com/mkoreanwwnite/",
              tiktok: "https://www.tiktok.com/@mkoreanwwn",
              facebook:
                "https://www.facebook.com/profile.php?id=61559570918487",
            },
          },
        },
        eA = () => {
          var e, t, n;
          let [l, a] = (0, o.useState)(!1),
            {
              logo: r,
              name: s,
              social: d,
            } = eE[window.location.hostname] || eE.default,
            u = (0, U.oR)(),
            h = null == u ? void 0 : u.client,
            m = h
              ? Object.values(h.accounts || {}).find((e) => !e.is_virtual)
              : void 0;
          m &&
            (null === (n = h.all_accounts_balance) ||
              void 0 === n ||
              null === (t = n.accounts) ||
              void 0 === t ||
              null === (e = t[m.loginid]) ||
              void 0 === e ||
              e.balance);
          let g = (null == m ? void 0 : m.currency) ?? "USD";
          return (
            (0, c.O$T)(g),
            (0, i.jsxs)("div", {
              className: "d-apollo-logo",
              children: [
                (0, i.jsxs)("div", {
                  className: "logo-holder",
                  children: [
                    r &&
                      (0, i.jsx)("img", {
                        src: r,
                        alt: "custom Logo",
                        className: "d-apollo-logo__image",
                      }),
                    (0, i.jsx)(Y.Z, {
                      color: "less-prominent",
                      lineHeight: "xs",
                      size: "xs",
                      weight: "bold",
                      align: "center",
                      className: "dc-contract-card-message",
                      children: s,
                    }),
                  ],
                }),
                (0, i.jsx)("button", {
                  className: "d-apollo-logo__icon",
                  onClick: () => a(!0),
                  children: (0, i.jsx)(ek.Kz1, {}),
                }),
                l &&
                  (0, i.jsx)("div", {
                    className: "modal-overlay",
                    onClick: () => a(!1),
                    children: (0, i.jsxs)("div", {
                      className: "modal-content",
                      onClick: (e) => e.stopPropagation(),
                      children: [
                        (0, i.jsx)("h3", { children: "Follow Us" }),
                        (0, i.jsxs)("ul", {
                          children: [
                            d.whatsapp &&
                              (0, i.jsx)("li", {
                                children: (0, i.jsxs)("a", {
                                  href: d.whatsapp,
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                  children: [
                                    (0, i.jsx)(eI.Z, {}),
                                    " WhatsApp Group",
                                  ],
                                }),
                              }),
                            [2, 3, 4, 5, 6].map((e) => {
                              let t = d[`whatsapp${e}`];
                              return t
                                ? (0, i.jsx)(
                                    "li",
                                    {
                                      children: (0, i.jsxs)("a", {
                                        href: t,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        children: [
                                          (0, i.jsx)(eI.Z, {}),
                                          " WhatsApp Group ",
                                          e,
                                        ],
                                      }),
                                    },
                                    `whatsapp${e}`
                                  )
                                : null;
                            }),
                            d.telegram &&
                              (0, i.jsx)("li", {
                                children: (0, i.jsxs)("a", {
                                  href: d.telegram,
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                  children: [(0, i.jsx)(eN.Z, {}), " Telegram"],
                                }),
                              }),
                            d.youtube &&
                              (0, i.jsx)("li", {
                                children: (0, i.jsxs)("a", {
                                  href: d.youtube,
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                  children: [(0, i.jsx)(eZ.Z, {}), " YouTube"],
                                }),
                              }),
                            d.instagram &&
                              (0, i.jsx)("li", {
                                children: (0, i.jsxs)("a", {
                                  href: d.instagram,
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                  children: [
                                    (0, i.jsx)(eS.Z, {}),
                                    " Instagram",
                                  ],
                                }),
                              }),
                            d.tiktok &&
                              (0, i.jsx)("li", {
                                children: (0, i.jsxs)("a", {
                                  href: d.tiktok,
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                  children: [(0, i.jsx)(eL.Z, {}), " TikTok"],
                                }),
                              }),
                            d.facebook &&
                              (0, i.jsx)("li", {
                                children: (0, i.jsxs)("a", {
                                  href: d.facebook,
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                  children: [(0, i.jsx)(ez.Z, {}), " Facebook"],
                                }),
                              }),
                          ],
                        }),
                        (0, i.jsx)("button", {
                          onClick: () => a(!1),
                          children: "Close",
                        }),
                      ],
                    }),
                  }),
              ],
            })
          );
        },
        eM = () => {
          let { isDesktop: e } = (0, h.F)();
          return e ? (0, i.jsx)(eA, {}) : null;
        };
      var eF = n("24561");
      let eT = (e) => {
          let { isMobile: t } = e;
          return (0, i.jsx)(i.Fragment, {
            children: t
              ? (0, i.jsxs)(i.Fragment, {
                  children: [
                    (0, i.jsx)("circle", { cx: "14", cy: "22", r: "13" }),
                    (0, i.jsx)("rect", {
                      height: "7",
                      rx: "4",
                      ry: "4",
                      width: "76",
                      x: "35",
                      y: "19",
                    }),
                    (0, i.jsx)("rect", {
                      height: "32",
                      rx: "4",
                      ry: "4",
                      width: "82",
                      x: "120",
                      y: "6",
                    }),
                  ],
                })
              : (0, i.jsxs)(i.Fragment, {
                  children: [
                    (0, i.jsx)("circle", { cx: "14", cy: "22", r: "12" }),
                    (0, i.jsx)("circle", { cx: "58", cy: "22", r: "12" }),
                    (0, i.jsx)("rect", {
                      height: "7",
                      rx: "4",
                      ry: "4",
                      width: "76",
                      x: "150",
                      y: "20",
                    }),
                    (0, i.jsx)("circle", { cx: "118", cy: "24", r: "13" }),
                    (0, i.jsx)("rect", {
                      height: "30",
                      rx: "4",
                      ry: "4",
                      width: "1",
                      x: "87",
                      y: "8",
                    }),
                    (0, i.jsx)("rect", {
                      height: "32",
                      rx: "4",
                      ry: "4",
                      width: "82",
                      x: "250",
                      y: "8",
                    }),
                  ],
                }),
          });
        },
        eD = (e) => {
          let { isMobile: t, speed: n } = e;
          return (0, i.jsx)(eF.ZP, {
            "data-testid": "dt_accounts_info_loader",
            height: t ? 42 : 46,
            speed: n,
            width: t ? 216 : 350,
            backgroundColor: "var(--general-section-1)",
            foregroundColor: "var(--general-hover)",
            children: (0, i.jsx)(eT, { isMobile: t }),
          });
        };
      var eP = n("30394"),
        eR = n("88199"),
        eO = n("42457"),
        eU = n("33281"),
        eH = n("47342"),
        e$ = n("63387"),
        eV = n.n(e$);
      let eB = (e) => {
        let { width: t, height: n } = e;
        return (0, i.jsx)("div", {
          className: "skeleton",
          style: { width: t, height: n },
        });
      };
      var eX = n("44884"),
        eq = n("37410"),
        eK = n("37528");
      let eW = {
          currency: " ",
          currencyLabel: "Options & Multipliers",
          is_virtual: 1,
          loginid: "",
          is_disabled: !1,
          balance: "",
          icon: (0, i.jsx)(eq.Z, { width: 24, height: 24 }),
          isActive: !1,
          isVirtual: !0,
        },
        eG = (e) => Number(e.replace(/,/g, "")),
        eJ = () =>
          (0, i.jsx)(eK.i, {
            color: "var(--general-section-2)",
            height: "4px",
          }),
        eY = (e) => {
          let { oAuthLogout: t, loginid: n, is_logging_out: l } = e,
            o =
              (null == n ? void 0 : n.includes("CR")) ||
              (null == n ? void 0 : n.includes("MF"));
          return (0, i.jsxs)("div", {
            className: "",
            children: [
              (0, i.jsx)(eH.T.TradersHubLink, {
                href: c.xOw.traders_hub,
                children: (0, P.NC)(
                  "Looking for CFD accounts? Go to Trader's Hub"
                ),
              }),
              (0, i.jsx)(eJ, {}),
              (0, i.jsxs)("div", {
                className: eV()("account-switcher-footer__actions", {
                  "account-switcher-footer__actions--hide-manage-button": !o,
                }),
                children: [
                  o &&
                    (0, i.jsx)(e_.Z, {
                      id: "manage-button",
                      className: "manage-button",
                      onClick: () => location.replace("https://app.deriv.com"),
                      children: (0, i.jsx)(P.Xx, {
                        i18n_default_text: "Manage accounts",
                      }),
                    }),
                  (0, i.jsx)(eH.T.Footer, {
                    children: l
                      ? (0, i.jsx)("div", {
                          className: "deriv-account-switcher__logout--loader",
                          children: (0, i.jsx)(eB, {
                            width: "120px",
                            height: "12px",
                          }),
                        })
                      : (0, i.jsxs)("div", {
                          id: "dt_logout_button",
                          className: "deriv-account-switcher__logout",
                          onClick: t,
                          children: [
                            (0, i.jsx)(Y.Z, {
                              color: "prominent",
                              size: "xs",
                              align: "left",
                              className: "deriv-account-switcher__logout-text",
                              children: (0, P.NC)("Logout"),
                            }),
                            (0, i.jsx)(eX.Z, {
                              iconSize: "xs",
                              fill: "var(--text-general)",
                              className: "icon-general-fill-path",
                            }),
                          ],
                        }),
                  }),
                ],
              }),
            ],
          });
        },
        eQ = (e) => {
          let {
            tabs_labels: t,
            modifiedVRTCRAccountList: n,
            switchAccount: l,
            isVirtual: o,
            activeLoginId: r,
            oAuthLogout: s,
            is_logging_out: c,
          } = e;
          return (0, i.jsxs)(i.Fragment, {
            children: [
              (0, i.jsx)(
                eH.T.AccountsPanel,
                {
                  isOpen: !0,
                  title: (0, P.NC)("Deriv account"),
                  className: "account-switcher-panel",
                  children:
                    n &&
                    n.map((e) =>
                      (0, i.jsx)(
                        "span",
                        {
                          className: (0, a.Z)("account-switcher__item", {
                            "account-switcher__item--disabled": e.is_disabled,
                          }),
                          children: (0, i.jsx)(eH.T.AccountsItem, {
                            account: e,
                            onSelectAccount: () => {
                              !e.is_disabled && l(e.loginid);
                            },
                            onResetBalance:
                              o && r === e.loginid && 1e4 !== eG(e.balance)
                                ? () => {
                                    var e;
                                    null === eR.api_base ||
                                      void 0 === eR.api_base ||
                                      null === (e = eR.api_base.api) ||
                                      void 0 === e ||
                                      e.send({ topup_virtual: 1 });
                                  }
                                : void 0,
                          }),
                        },
                        e.loginid
                      )
                    ),
                },
                t.demo.toLowerCase()
              ),
              (0, i.jsx)(eJ, {}),
              (0, i.jsx)(eY, { loginid: r, oAuthLogout: s, is_logging_out: c }),
            ],
          });
        },
        e0 = (e) => {
          let {
              isVirtual: t,
              tabs_labels: n,
              modifiedMFAccountList: l,
              switchAccount: o,
              is_low_risk_country: r,
            } = e,
            s =
              (null == l ? void 0 : l.length) !== 0 && r
                ? (0, P.NC)("Eu Deriv accounts")
                : (0, P.NC)("Deriv accounts");
          return (0, i.jsx)(
            eH.T.AccountsPanel,
            {
              isOpen: !0,
              title: s,
              className: "account-switcher-panel",
              children: l.map(
                (e) => (
                  (e.currencyLabel = (0, P.NC)("Multipliers")),
                  (0, i.jsx)(
                    "span",
                    {
                      className: (0, a.Z)("account-switcher__item", {
                        "account-switcher__item--disabled": e.is_disabled,
                      }),
                      children: (0, i.jsx)(eH.T.AccountsItem, {
                        account: e,
                        onSelectAccount: () => {
                          !e.is_disabled && o(e.loginid);
                        },
                      }),
                    },
                    e.loginid
                  )
                )
              ),
            },
            t ? n.real.toLowerCase() : n.demo.toLowerCase()
          );
        };
      var e1 = n("11527");
      let e6 = (e) => {
          var t, n;
          let { isVirtual: l, tabs_labels: o, is_low_risk_country: a } = e;
          return a
            ? (0, i.jsx)(
                eH.T.AccountsPanel,
                {
                  isOpen: !0,
                  title: (0, P.NC)("Non-Eu Deriv account"),
                  className: "account-switcher-panel",
                  children: (0, i.jsxs)("div", {
                    className: "account-switcher-panel__no-eu-accounts",
                    children: [
                      (0, i.jsx)(eH.T.AccountsItem, {
                        account: eW,
                        onSelectAccount: () => {},
                      }),
                      (0, i.jsx)(eJ, {}),
                      (0, i.jsx)(e1.z, {
                        id: "add-button",
                        className: "add-button",
                        onClick: () => location.replace(c.xOw.traders_hub),
                        children: (0, i.jsx)(P.Xx, {
                          i18n_default_text: "Add",
                        }),
                      }),
                    ],
                  }),
                },
                l
                  ? null == o
                    ? void 0
                    : null === (n = o.real) || void 0 === n
                    ? void 0
                    : n.toLowerCase()
                  : null == o
                  ? void 0
                  : null === (t = o.demo) || void 0 === t
                  ? void 0
                  : t.toLowerCase()
              )
            : null;
        },
        e2 = (e) => {
          let {
            isVirtual: t,
            tabs_labels: n,
            modifiedCRAccountList: l,
            modifiedMFAccountList: o,
            is_low_risk_country: r,
            switchAccount: s,
          } = e;
          if (!r && l && (null == l ? void 0 : l.length) === 0) return null;
          let c =
            (null == o ? void 0 : o.length) === 0
              ? (0, P.NC)("Deriv accounts")
              : (0, P.NC)("Non-Eu Deriv account");
          return (0, i.jsx)(i.Fragment, {
            children: (0, i.jsx)(
              eH.T.AccountsPanel,
              {
                isOpen: !0,
                title: c,
                className: "account-switcher-panel",
                style: { maxHeight: "220px" },
                children: l.map((e) =>
                  (0, i.jsx)(
                    "span",
                    {
                      className: (0, a.Z)("account-switcher__item", {
                        "account-switcher__item--disabled": e.is_disabled,
                      }),
                      children: (0, i.jsx)(eH.T.AccountsItem, {
                        account: e,
                        onSelectAccount: () => {
                          !e.is_disabled && s(e.loginid);
                        },
                      }),
                    },
                    e.loginid
                  )
                ),
              },
              t
                ? null == n
                  ? void 0
                  : n.real.toLowerCase()
                : n.demo.toLowerCase()
            ),
          });
        },
        e9 = (e) => {
          let {
              modifiedCRAccountList: t,
              modifiedMFAccountList: n,
              switchAccount: l,
              isVirtual: o,
              tabs_labels: a,
              is_low_risk_country: r,
              oAuthLogout: s,
              loginid: c,
              is_logging_out: d,
            } = e,
            u = t && (null == t ? void 0 : t.length) > 0,
            h = n && (null == n ? void 0 : n.length) > 0;
          return (0, i.jsxs)(i.Fragment, {
            children: [
              u
                ? (0, i.jsxs)(i.Fragment, {
                    children: [
                      (0, i.jsx)(e2, {
                        modifiedCRAccountList: t,
                        modifiedMFAccountList: n,
                        switchAccount: l,
                        isVirtual: o,
                        tabs_labels: a,
                        is_low_risk_country: r,
                      }),
                      (0, i.jsx)(eJ, {}),
                    ],
                  })
                : (0, i.jsxs)(i.Fragment, {
                    children: [
                      (0, i.jsx)(e6, {
                        is_low_risk_country: r,
                        isVirtual: o,
                        tabs_labels: a,
                      }),
                      (0, i.jsx)(eJ, {}),
                    ],
                  }),
              h &&
                (0, i.jsxs)(i.Fragment, {
                  children: [
                    (0, i.jsx)(e0, {
                      modifiedMFAccountList: n,
                      switchAccount: l,
                      isVirtual: o,
                      tabs_labels: a,
                      is_low_risk_country: r,
                    }),
                    (0, i.jsx)(eJ, {}),
                  ],
                }),
              (0, i.jsx)(eY, { oAuthLogout: s, loginid: c, is_logging_out: d }),
            ],
          });
        };
      var e3 = n("17481");
      let e7 = (0, o.lazy)(() => n.e("932").then(n.bind(n, 67568))),
        e4 = { demo: (0, P.NC)("Demo"), real: (0, P.NC)("Real") },
        e8 = (e) => {
          var t;
          let {
              isVirtual: n,
              modifiedCRAccountList: l,
              modifiedMFAccountList: a,
              modifiedVRTCRAccountList: r,
              switchAccount: s,
              activeLoginId: c,
              client: u,
            } = e,
            { oAuthLogout: h } = (0, d.q)({
              handleLogout: async () => u.logout(),
              client: u,
            }),
            m = (0, e3.Gz)().includes(
              (null === (t = u.account_settings) || void 0 === t
                ? void 0
                : t.country_code) ?? ""
            ),
            g = !!n;
          return ((0, o.useEffect)(() => {
            var e, t;
            let l =
              null ===
                (e = document.getElementsByClassName(
                  "account-switcher-panel"
                )) || void 0 === e
                ? void 0
                : e[0];
            !n &&
              l &&
              ((l.style.maxHeight = "70vh"),
              null === (t = (0, eO._)(".deriv-accordion__content", l)) ||
                void 0 === t ||
                t.then((e) => {
                  e && (e.style.maxHeight = "70vh");
                }));
          }, [n]),
          g)
            ? (0, i.jsx)(i.Fragment, {
                children: (0, i.jsx)(eQ, {
                  modifiedVRTCRAccountList: r,
                  switchAccount: s,
                  activeLoginId: c,
                  isVirtual: g,
                  tabs_labels: e4,
                  oAuthLogout: h,
                  is_logging_out: u.is_logging_out,
                }),
              })
            : (0, i.jsx)(e9, {
                modifiedCRAccountList: l,
                modifiedMFAccountList: a,
                switchAccount: s,
                isVirtual: g,
                tabs_labels: e4,
                is_low_risk_country: m,
                oAuthLogout: h,
                loginid: c,
                is_logging_out: u.is_logging_out,
              });
        },
        e5 = (0, $.Pi)((e) => {
          var t, n;
          let { activeAccount: l } = e,
            { isDesktop: a } = (0, h.F)(),
            { accountList: r } = (0, eb.T)(),
            { ui: s, run_panel: d, client: u } = (0, U.oR)(),
            { accounts: m } = u,
            {
              toggleAccountsDialog: g,
              is_accounts_switcher_on: x,
              account_switcher_disabled_message: _,
              is_ksh_currency_enabled: v,
              toggleKshCurrency: p,
            } = s,
            { is_stop_button_visible: j } = d,
            b = Object.keys(m).some((e) => "wallet" === m[e].account_category),
            [f, w] = (0, o.useState)(!1),
            y = localStorage.getItem("active_loginid");
          (0, o.useEffect)(() => {
            w("true" === localStorage.getItem("is_api_token_login"));
          }, [r]);
          let C = (0, o.useMemo)(() => {
              let e = r;
              return (
                f &&
                  y &&
                  (e =
                    null == r
                      ? void 0
                      : r.filter(
                          (e) => (null == e ? void 0 : e.loginid) === y
                        )),
                null == e
                  ? void 0
                  : e.map((e) => {
                      var t, n, o, a, r, s, d;
                      let h =
                          (null === (o = u.all_accounts_balance) || void 0 === o
                            ? void 0
                            : null === (n = o.accounts) || void 0 === n
                            ? void 0
                            : null ===
                                (t = n[null == e ? void 0 : e.loginid]) ||
                              void 0 === t
                            ? void 0
                            : t.balance) ?? 0,
                        m =
                          "USD" ===
                          String(null == e ? void 0 : e.currency).toUpperCase(),
                        g = v && m,
                        x = g
                          ? `KSH ${(h * ef.z).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : (0, c.oC5)(
                              (null == h
                                ? void 0
                                : h.toFixed((0, c.i4S)(e.currency))) ?? "0"
                            );
                      return {
                        ...e,
                        balance: x,
                        currency: g ? "" : null == e ? void 0 : e.currency,
                        currencyLabel: (null == e ? void 0 : e.is_virtual)
                          ? e4.demo
                          : g
                          ? ""
                          : (null === (s = u.website_status) || void 0 === s
                              ? void 0
                              : null === (r = s.currencies_config) ||
                                void 0 === r
                              ? void 0
                              : null ===
                                  (a = r[null == e ? void 0 : e.currency]) ||
                                void 0 === a
                              ? void 0
                              : a.name) ?? (null == e ? void 0 : e.currency),
                        icon: (0, i.jsx)(ej, {
                          currency: g
                            ? "ksh"
                            : null == e
                            ? void 0
                            : null === (d = e.currency) || void 0 === d
                            ? void 0
                            : d.toLowerCase(),
                          isVirtual: !!(null == e ? void 0 : e.is_virtual),
                        }),
                        isVirtual: !!(null == e ? void 0 : e.is_virtual),
                        isActive:
                          (null == e ? void 0 : e.loginid) ===
                          (null == l ? void 0 : l.loginid),
                      };
                    })
              );
            }, [
              r,
              null === (t = u.all_accounts_balance) || void 0 === t
                ? void 0
                : t.accounts,
              null === (n = u.website_status) || void 0 === n
                ? void 0
                : n.currencies_config,
              null == l ? void 0 : l.loginid,
              v,
              f,
              y,
            ]),
            k = (0, o.useMemo)(
              () =>
                (null == C
                  ? void 0
                  : C.filter((e) => {
                      var t;
                      return null == e
                        ? void 0
                        : null === (t = e.loginid) || void 0 === t
                        ? void 0
                        : t.includes("CR");
                    })) ?? [],
              [C]
            ),
            I = (0, o.useMemo)(
              () =>
                (null == C
                  ? void 0
                  : C.filter((e) => {
                      var t;
                      return null == e
                        ? void 0
                        : null === (t = e.loginid) || void 0 === t
                        ? void 0
                        : t.includes("MF");
                    })) ?? [],
              [C]
            ),
            N = (0, o.useMemo)(
              () =>
                (null == C
                  ? void 0
                  : C.filter((e) => {
                      var t;
                      return null == e
                        ? void 0
                        : null === (t = e.loginid) || void 0 === t
                        ? void 0
                        : t.includes("VRT");
                    })) ?? [],
              [C]
            ),
            Z = async (e) => {
              if (e.toString() === (null == l ? void 0 : l.loginid)) return;
              let t = (0, c.HAA)(),
                n = JSON.parse(localStorage.getItem(t) ?? "{}")[e];
              if (!n) return;
              localStorage.setItem("authToken", n),
                localStorage.setItem("active_loginid", e.toString()),
                await (null === eR.api_base || void 0 === eR.api_base
                  ? void 0
                  : eR.api_base.init(!0));
              let i = new URLSearchParams(window.location.search),
                o = C.find((t) => t.loginid === e.toString());
              if (!o) return;
              let a = o.is_virtual ? "demo" : o.currency;
              i.set("account", a),
                window.history.pushState(
                  {},
                  "",
                  `${window.location.pathname}?${i.toString()}`
                );
            };
          return (
            l &&
            (b
              ? (0, i.jsx)(o.Suspense, {
                  fallback: (0, i.jsx)(eU.a, {}),
                  children: (0, i.jsx)(e7, {
                    is_dialog_on: x,
                    toggleDialog: g,
                  }),
                })
              : (0, i.jsxs)("div", {
                  className: "account-switcher-wrapper",
                  children: [
                    (0, i.jsxs)("div", {
                      className: "currency-switch-buttons",
                      children: [
                        (0, i.jsx)("button", {
                          className: `currency-switch-btn ${
                            v ? "" : "currency-switch-btn--active"
                          }`,
                          onClick: () => v && p(),
                          children: "USD",
                        }),
                        (0, i.jsx)("button", {
                          className: `currency-switch-btn ${
                            v ? "currency-switch-btn--active" : ""
                          }`,
                          onClick: () => !v && p(),
                          children: "KSH",
                        }),
                      ],
                    }),
                    (0, i.jsx)(eP.Z, {
                      className: "run-panel__info",
                      classNameBubble: "run-panel__info--bubble",
                      alignment: "bottom",
                      message: _,
                      zIndex: "5",
                      children: (0, i.jsxs)(eH.T, {
                        activeAccount: l,
                        isDisabled: j,
                        tabsLabels: e4,
                        modalContentStyle: {
                          content: {
                            top: a ? "30%" : "50%",
                            borderRadius: "10px",
                          },
                        },
                        children: [
                          (0, i.jsx)(eH.T.Tab, {
                            title: e4.real,
                            children: (0, i.jsx)(e8, {
                              modifiedCRAccountList: k,
                              modifiedMFAccountList: I,
                              switchAccount: Z,
                              activeLoginId: null == l ? void 0 : l.loginid,
                              client: u,
                            }),
                          }),
                          (0, i.jsx)(eH.T.Tab, {
                            title: e4.demo,
                            children: (0, i.jsx)(e8, {
                              modifiedVRTCRAccountList: N,
                              switchAccount: Z,
                              isVirtual: !0,
                              activeLoginId: null == l ? void 0 : l.loginid,
                              client: u,
                            }),
                          }),
                        ],
                      }),
                    }),
                  ],
                }))
          );
        });
      var te = n("57801"),
        tt = n("31784"),
        tn = n("87383");
      let tl = (0, $.Pi)((e) => {
        let { is_open: t, onClose: n } = e,
          [l, a] = (0, o.useState)(""),
          [s, d] = (0, o.useState)(!1),
          [u, h] = (0, o.useState)(""),
          m = async () => {
            if (!l.trim()) {
              h((0, P.NC)("Please enter your API token"));
              return;
            }
            d(!0), h("");
            try {
              let n = (0, tn.wL)("116974");
              await new Promise((e, t) => {
                let l = setTimeout(() => {
                  t(Error("Connection timeout"));
                }, 1e4);
                1 === n.connection.readyState
                  ? (clearTimeout(l), e())
                  : (n.connection.addEventListener("open", () => {
                      clearTimeout(l), e();
                    }),
                    n.connection.addEventListener("error", () => {
                      clearTimeout(l), t(Error("Connection failed"));
                    }));
              });
              let { authorize: i, error: o } = await n.authorize(l.trim());
              if (o) {
                h(o.message || (0, P.NC)("Invalid API token")),
                  n.disconnect(),
                  d(!1);
                return;
              }
              if (i) {
                var e, t;
                let o = {},
                  a = {};
                null === (e = i.account_list) ||
                  void 0 === e ||
                  e.forEach((e) => {
                    (o[e.loginid] = l.trim()),
                      (a[e.loginid] = {
                        loginid: e.loginid,
                        token: l.trim(),
                        currency: e.currency || "",
                        is_virtual: e.is_virtual,
                      });
                  }),
                  localStorage.setItem((0, c.HAA)(), JSON.stringify(o)),
                  localStorage.setItem("clientAccounts", JSON.stringify(a)),
                  localStorage.setItem("authToken", l.trim()),
                  localStorage.setItem("active_loginid", i.loginid),
                  localStorage.setItem("is_api_token_login", "true"),
                  localStorage.setItem("api_token_app_id", "116974");
                let s = {};
                null === (t = i.account_list) ||
                  void 0 === t ||
                  t.forEach((e) => {
                    s[e.loginid] = {
                      loginid: e.loginid,
                      token: l.trim(),
                      currency: e.currency || "",
                    };
                  });
                try {
                  r.Z.set("client.accounts", JSON.stringify(s), {
                    expires: 30,
                  }),
                    r.Z.set("active_loginid", i.loginid, { expires: 30 });
                } catch (e) {
                  console.warn("Could not set cookies:", e);
                }
                n.disconnect(), (window.location.href = "/");
              }
            } catch (e) {
              h(
                (null == e ? void 0 : e.message) ||
                  (0, P.NC)("Failed to authenticate. Please check your token.")
              ),
                d(!1);
            }
          };
        return (0, i.jsxs)(tt.Z, {
          className: "api-token-modal",
          is_open: t,
          toggleModal: n,
          title: (0, P.NC)("Login with API Token"),
          width: "440px",
          children: [
            (0, i.jsx)(tt.Z.Body, {
              children: (0, i.jsx)("div", {
                className: "api-token-modal__content",
                children: s
                  ? (0, i.jsxs)("div", {
                      className: "api-token-modal__loading",
                      children: [
                        (0, i.jsx)(Y.Z, {
                          size: "s",
                          align: "center",
                          children: (0, i.jsx)(P.Xx, {
                            i18n_default_text: "Authorizing with API token...",
                          }),
                        }),
                        (0, i.jsx)("div", {
                          className: "api-token-modal__spinner",
                        }),
                      ],
                    })
                  : (0, i.jsxs)(i.Fragment, {
                      children: [
                        (0, i.jsx)(Y.Z, {
                          size: "xs",
                          className: "api-token-modal__description",
                          children: (0, i.jsx)(P.Xx, {
                            i18n_default_text:
                              "Enter your Deriv API token to login. You can create an API token from your Deriv account settings.",
                          }),
                        }),
                        (0, i.jsx)("div", {
                          className: "api-token-modal__input-wrapper",
                          children: (0, i.jsx)(te.Z, {
                            type: "password",
                            label: (0, P.NC)("API Token"),
                            value: l,
                            onChange: (e) => {
                              a(e.target.value), h("");
                            },
                            onKeyDown: (e) => {
                              "Enter" === e.nativeEvent.key && m();
                            },
                            error: u,
                            placeholder: (0, P.NC)("Enter your API token"),
                            disabled: s,
                          }),
                        }),
                        (0, i.jsxs)(Y.Z, {
                          size: "xxs",
                          className: "api-token-modal__hint",
                          children: [
                            (0, i.jsx)(P.Xx, {
                              i18n_default_text: "Get your API token from",
                            }),
                            " ",
                            (0, i.jsx)("a", {
                              href: "https://app.deriv.com/account/api-token",
                              target: "_blank",
                              rel: "noopener noreferrer",
                              className: "api-token-modal__link",
                              children: (0, i.jsx)(P.Xx, {
                                i18n_default_text: "Deriv API Token Settings",
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
              }),
            }),
            (0, i.jsxs)(tt.Z.Footer, {
              children: [
                (0, i.jsx)(e_.Z, {
                  secondary: !0,
                  onClick: n,
                  disabled: s,
                  children: (0, i.jsx)(P.Xx, { i18n_default_text: "Cancel" }),
                }),
                (0, i.jsx)(e_.Z, {
                  primary: !0,
                  onClick: m,
                  is_loading: s,
                  disabled: s || !l.trim(),
                  children: (0, i.jsx)(P.Xx, { i18n_default_text: "Login" }),
                }),
              ],
            }),
          ],
        });
      });
      var ti = n("39523"),
        to = n("38051"),
        ta = n("39590"),
        tr = n("14393"),
        ts = n("34215"),
        tc = n("44741");
      tr.Z,
        (0, P.NC)(
          "A whole new trading experience on a powerful yet easy to use platform."
        ),
        c.xOw.trade,
        tr.Z,
        ts.Z,
        (0, P.NC)("Automated trading at your fingertips. No coding needed."),
        c.xOw.bot,
        ts.Z,
        tc.Z,
        (0, P.NC)(
          "Trade the world\xe2€™s markets with our popular user-friendly platform."
        ),
        c.xOw.smarttrader,
        tc.Z;
      let td = {
          as: "a",
          href: c.xOw.traders_hub,
          icon: (0, i.jsx)(to.Z, { iconSize: "xs" }),
          label: "Trader's Hub",
        },
        tu = [
          {
            as: "a",
            href: `https://mkoreanwwn-dtrader.vercel.app/dtrader/reports?acct1=${localStorage.getItem(
              "active_loginid"
            )}&token1=${localStorage.getItem("authToken")}&cur1=${
              (null ===
                (l = JSON.parse(localStorage.getItem("clientAccounts") || "{}")[
                  localStorage.getItem("active_loginid") || ""
                ]) || void 0 === l
                ? void 0
                : l.currency) || "USD"
            }&lang=EN`,
            icon: (0, i.jsx)(ta.Z, { iconSize: "xs" }),
            label: (0, P.NC)("Reports"),
          },
        ],
        th = (0, $.Pi)(() => {
          let { localize: e } = (0, P.T_)(),
            { isDesktop: t } = (0, h.F)(),
            n = (0, U.oR)();
          if (!n) return null;
          let { is_logged_in: l } = n.client;
          return l && 0 !== tu.length
            ? (0, i.jsx)(i.Fragment, {
                children: t
                  ? tu.map((t) => {
                      let { as: n, href: l, icon: o, label: a } = t;
                      return (0, i.jsx)(
                        ti.s,
                        {
                          as: n,
                          className: "app-header__menu",
                          href: l,
                          leftComponent: o,
                          children: (0, i.jsx)(W.x, { children: e(a) }),
                        },
                        a
                      );
                    })
                  : tu["1"] &&
                    (0, i.jsx)(
                      ti.s,
                      {
                        as: tu["1"].as,
                        className: "flex gap-2 p-5",
                        href: tu["1"].href,
                        leftComponent: tu["1"].icon,
                        children: (0, i.jsx)(W.x, {
                          children: e(tu["1"].label),
                        }),
                      },
                      tu["1"].label
                    ),
              })
            : null;
        });
      th.TradershubLink = () =>
        (0, i.jsx)(
          ti.s,
          {
            as: "a",
            className: "app-header__menu",
            href: td.href,
            leftComponent: td.icon,
            children: (0, i.jsx)(W.x, { children: td.label }),
          },
          td.label
        );
      var tm = n("17934"),
        tg = n("41301"),
        tx = n("68782");
      let t_ = (e) => {
        let { buttonText: t, onClick: n } = e,
          { isDesktop: l } = (0, h.F)();
        return (0, i.jsxs)("button", {
          className: "flex items-center w-full pt-8 p-[3.2rem]",
          onClick: n,
          children: [
            (0, i.jsx)(tx.Z, { iconSize: "xs", fill: "var(--text-general)" }),
            (0, i.jsx)(W.x, {
              className: "ml-[1.6rem]",
              size: l ? "md" : "lg",
              weight: "bold",
              children: t,
            }),
          ],
        });
      };
      var tv = n("68534"),
        tp = n("93217");
      let tj = (e) => {
          let { localize: t } = (0, P.T_)(),
            { is_dark_mode_on: n, toggleTheme: l } = (0, V.Z)(),
            { oAuthLogout: o } = (0, d.q)({
              handleLogout: async () => (null == e ? void 0 : e.logout()),
              client: e,
            });
          return {
            config: [
              [
                {
                  as: "button",
                  label: t("Dark theme"),
                  LeftComponent: tv.Z,
                  RightComponent: (0, i.jsx)(tp.Z, { value: n, onChange: l }),
                },
              ],
              (null == e ? void 0 : e.is_logged_in)
                ? [
                    {
                      as: "button",
                      label: t("Log out"),
                      LeftComponent: eX.Z,
                      onClick: o,
                      removeBorderBottom: !0,
                    },
                  ]
                : [],
            ],
          };
        },
        tb = (0, $.Pi)(() => {
          let { isDesktop: e } = (0, h.F)(),
            { client: t } = (0, U.oR)(),
            n = e ? "sm" : "md",
            { config: l } = tj(t);
          return (0, i.jsx)("div", {
            className: "mobile-menu__content",
            children: (0, i.jsx)("div", {
              className: "mobile-menu__content__items",
              children: l.map((e, t) => {
                let l = e.find((e) => {
                  let { removeBorderBottom: t } = e;
                  return t;
                });
                return (0, i.jsx)(
                  "div",
                  {
                    className: (0, a.Z)(
                      "mobile-menu__content__items--padding",
                      { "mobile-menu__content__items--bottom-border": !l }
                    ),
                    "data-testid": "dt_menu_item",
                    children: e.map((e) => {
                      let {
                          LeftComponent: t,
                          RightComponent: l,
                          as: o,
                          href: r,
                          label: s,
                          onClick: c,
                          target: d,
                        } = e,
                        u = "MkoreanWWN.com" === s;
                      return "a" === o
                        ? (0, i.jsx)(
                            ti.s,
                            {
                              as: "a",
                              className: (0, a.Z)(
                                "mobile-menu__content__items__item",
                                { "mobile-menu__content__items__icons": !u }
                              ),
                              disableHover: !0,
                              href: r,
                              leftComponent: (0, i.jsx)(t, {
                                className:
                                  "mobile-menu__content__items--right-margin",
                                height: 16,
                                width: 16,
                              }),
                              target: d,
                              children: (0, i.jsx)(W.x, {
                                size: n,
                                children: s,
                              }),
                            },
                            s
                          )
                        : (0, i.jsx)(
                            ti.s,
                            {
                              as: "button",
                              className: (0, a.Z)(
                                "mobile-menu__content__items__item",
                                { "mobile-menu__content__items__icons": !u }
                              ),
                              disableHover: !0,
                              leftComponent: (0, i.jsx)(t, {
                                className:
                                  "mobile-menu__content__items--right-margin",
                                iconSize: "xs",
                              }),
                              onClick: c,
                              rightComponent: l,
                              children: (0, i.jsx)(W.x, {
                                size: n,
                                children: s,
                              }),
                            },
                            s
                          );
                    }),
                  },
                  t
                );
              }),
            }),
          });
        }),
        tf = (e) => {
          let { hideLanguageSetting: t, openLanguageSetting: n } = e,
            { currentLang: l, localize: a } = (0, P.T_)(),
            { isDesktop: r } = (0, h.F)(),
            s = (0, o.useMemo)(() => {
              var e;
              return null ===
                (e = D.find((e) => {
                  let { code: t } = e;
                  return t === l;
                })) || void 0 === e
                ? void 0
                : e.placeholderIconInMobile;
            }, [l]);
          return (0, i.jsxs)("div", {
            className: "mobile-menu__header",
            children: [
              (0, i.jsx)(W.x, {
                size: r ? "md" : "lg",
                weight: "bold",
                children: a("Menu"),
              }),
              !t &&
                (0, i.jsxs)("button", {
                  className: "mobile-menu__header__language items-center",
                  onClick: n,
                  children: [
                    s,
                    (0, i.jsx)(W.x, {
                      className: "ml-[0.4rem]",
                      size: r ? "xs" : "sm",
                      weight: "bold",
                      children: l,
                    }),
                  ],
                }),
            ],
          });
        };
      var tw = n("89816");
      let ty = (e) => {
          let { onClick: t } = e;
          return (0, i.jsx)("button", {
            onClick: t,
            children: (0, i.jsx)(tw.Z, {
              iconSize: "xs",
              fill: "var(--text-general)",
            }),
          });
        },
        tC = () => {
          var e, t, n;
          let [l, a] = (0, o.useState)(!1),
            {
              currentLang: r = "EN",
              localize: s,
              switchLanguage: d,
            } = (0, P.T_)(),
            { hideModal: u, isModalOpenFor: m, showModal: g } = x(),
            { isDesktop: v } = (0, h.F)(),
            p = () => a(!1),
            j = !!m("MobileLanguagesDrawer"),
            b = () => {
              window.location.reload();
            },
            f = (0, U.oR)(),
            w = null == f ? void 0 : f.client,
            y = w
              ? Object.values(w.accounts || {}).find((e) => !e.is_virtual)
              : void 0;
          y &&
            (null === (n = w.all_accounts_balance) ||
              void 0 === n ||
              null === (t = n.accounts) ||
              void 0 === t ||
              null === (e = t[y.loginid]) ||
              void 0 === e ||
              e.balance);
          let C = (null == y ? void 0 : y.currency) ?? "USD";
          return ((0, c.O$T)(C), v)
            ? null
            : (0, i.jsxs)("div", {
                className: "mobile-menu",
                children: [
                  (0, i.jsxs)("div", {
                    className: "mobile-menu__toggle",
                    children: [
                      (0, i.jsx)(ty, { onClick: () => a(!0) }),
                      (0, i.jsx)("div", {
                        onClick: () => b(),
                        children: (0, i.jsx)(ek.e8N, {
                          size: 20,
                          style: { color: "#29dfc0" },
                        }),
                      }),
                    ],
                  }),
                  (0, i.jsxs)(tm.d, {
                    isOpen: l,
                    onCloseDrawer: p,
                    width: "29.5rem",
                    children: [
                      (0, i.jsx)(tm.d.Header, {
                        onCloseDrawer: p,
                        children: (0, i.jsx)(tf, {
                          hideLanguageSetting: j,
                          openLanguageSetting: () => g("MobileLanguagesDrawer"),
                        }),
                      }),
                      (0, i.jsx)(tm.d.Content, {
                        children: j
                          ? (0, i.jsxs)(i.Fragment, {
                              children: [
                                (0, i.jsx)("div", {
                                  className: "mobile-menu__back-btn",
                                  children: (0, i.jsx)(t_, {
                                    buttonText: s("Language"),
                                    onClick: u,
                                  }),
                                }),
                                (0, i.jsx)(tg.I, {
                                  isOpen: !0,
                                  languages: D,
                                  onClose: u,
                                  onLanguageSwitch: (e) => {
                                    d(e),
                                      window.location.replace(_()),
                                      window.location.reload();
                                  },
                                  selectedLanguage: r,
                                  wrapperClassName:
                                    "mobile-menu__language-drawer",
                                }),
                              ],
                            })
                          : (0, i.jsx)(tb, {}),
                      }),
                      (0, i.jsxs)(tm.d.Footer, {
                        className: "mobile-menu__footer",
                        children: [(0, i.jsx)(eg, {}), (0, i.jsx)(ed, {})],
                      }),
                    ],
                  }),
                ],
              });
        },
        tk = (0, $.Pi)(() => {
          let { isDesktop: e } = (0, h.F)(),
            { isAuthorizing: t, activeLoginid: n } = (0, eb.T)(),
            { client: l } = (0, U.oR)() ?? {},
            [r, s] = (0, o.useState)(!1),
            { data: m } = ew({
              allBalanceData: null == l ? void 0 : l.all_accounts_balance,
            }),
            { isOAuth2Enabled: g } = (0, d.q)();
          return (0, i.jsxs)(ey.h, {
            className: (0, a.Z)("app-header", {
              "app-header--desktop": e,
              "app-header--mobile": !e,
            }),
            children: [
              (0, i.jsxs)(eC.i, {
                variant: "left",
                children: [
                  (0, i.jsx)(eM, {}),
                  (0, i.jsx)(tC, {}),
                  e && (0, i.jsx)(th, {}),
                ],
              }),
              (0, i.jsx)(eC.i, {
                variant: "right",
                children: t
                  ? (0, i.jsx)(eD, { isLoggedIn: !0, isMobile: !e, speed: 3 })
                  : n
                  ? (0, i.jsx)(i.Fragment, {
                      children: (0, i.jsx)(e5, { activeAccount: m }),
                    })
                  : (0, i.jsxs)("div", {
                      className: "auth-actions",
                      children: [
                        (0, i.jsx)(e_.Z, {
                          primary: !0,
                          onClick: async () => {
                            g
                              ? await (0, u.P6)({
                                  redirectCallbackUri: `${window.location.origin}/callback`,
                                })
                              : window.location.replace((0, c.O2o)());
                          },
                          children: (0, i.jsx)(P.Xx, {
                            i18n_default_text: "Log in",
                          }),
                        }),
                        (0, i.jsx)(e_.Z, {
                          secondary: !0,
                          onClick: () => s(!0),
                          children: (0, i.jsx)(P.Xx, {
                            i18n_default_text: "API Token",
                          }),
                        }),
                        (0, i.jsx)(e_.Z, {
                          primary: !0,
                          onClick: () => {
                            window.open(c.xOw.signup);
                          },
                          children: (0, i.jsx)(P.Xx, {
                            i18n_default_text: "Sign up",
                          }),
                        }),
                        (0, i.jsx)(tl, { is_open: r, onClose: () => s(!1) }),
                      ],
                    }),
              }),
            ],
          });
        }),
        tI = (e) => {
          let { children: t } = e,
            n = localStorage.getItem("theme") ?? "light",
            { ui: l } = (0, U.oR)() ?? { ui: { setDevice: () => {} } },
            { setDevice: a } = l,
            { isDesktop: r, isMobile: s, isTablet: c } = (0, h.F)();
          return (
            (0, o.useEffect)(() => {
              let e = document.querySelector("body");
              e &&
                ("light" === n
                  ? (e.classList.remove("theme--dark"),
                    e.classList.add("theme--light"))
                  : (e.classList.remove("theme--light"),
                    e.classList.add("theme--dark")));
            }, [n]),
            (0, o.useEffect)(() => {
              s ? a("mobile") : c ? a("tablet") : a("desktop");
            }, [r, s, c, a]),
            (0, i.jsx)("div", { className: "main-body", children: t })
          );
        },
        tN = () => {
          let { isDesktop: e } = (0, h.F)(),
            { isOAuth2Enabled: t } = (0, d.q)(),
            n = "/callback" === window.location.pathname,
            l = "true" === r.Z.get("logged_state"),
            m = window.location.pathname.includes("endpoint"),
            g = (0, c.HAA)(),
            x =
              Object.keys(JSON.parse(localStorage.getItem(g) ?? "{}")).length >
              0;
          return (
            (0, o.useEffect)(() => {
              l &&
                !x &&
                t &&
                !m &&
                !n &&
                (0, u.P6)({
                  redirectCallbackUri: `${window.location.origin}/callback`,
                });
            }, [l, x, t, m, n]),
            (0, i.jsxs)("div", {
              className: (0, a.Z)("layout", { responsive: e }),
              children: [
                !n && (0, i.jsx)(tk, {}),
                (0, i.jsx)(tI, { children: (0, i.jsx)(s.j3, {}) }),
                !n && e && (0, i.jsx)(ex, {}),
              ],
            })
          );
        };
    },
    31784: function (e, t, n) {
      n.d(t, { Z: () => x });
      var l = n("85893"),
        i = n("67294"),
        o = n("63387"),
        a = n.n(o),
        r = n("73935"),
        s = n("81262"),
        c = n("1051"),
        d = n("14117"),
        u = n("76298"),
        h = n("29490");
      let m = (e) => {
          let {
              children: t,
              className: n,
              close_icon_color: o,
              elements_to_ignore: s,
              has_close_icon: m = !0,
              has_return_icon: g = !1,
              header: x,
              header_background_color: _,
              height: v,
              id: p,
              is_confirmation_modal: j,
              is_open: b,
              is_risk_warning_visible: f,
              is_title_centered: w,
              is_vertical_bottom: y,
              is_vertical_centered: C,
              is_vertical_top: k,
              onMount: I,
              onReturn: N,
              onUnmount: Z,
              portalId: S = "modal_root",
              renderTitle: L,
              should_close_on_click_outside: z,
              should_header_stick_body: E = !0,
              small: A,
              title: M,
              toggleModal: F,
              width: T,
            } = e,
            D = i.useRef(document.createElement("div")),
            P = S && document.getElementById(S),
            R = i.useRef(P || document.getElementById(S)),
            O = i.useRef(null),
            U = [
              ".dc-datepicker__picker",
              ".dc-mobile-dialog",
              ".dc-dropdown-list",
              ".dc-dropdown__list",
              ".modal_root",
            ],
            H = () => {
              var e;
              return null === (e = R.current) || void 0 === e
                ? void 0
                : e.querySelectorAll(U.join(", ")).length;
            };
          (0, c.t)(
            O,
            () => {
              b && (null == F || F());
            },
            (e) => {
              var t, n;
              let l =
                  null === (t = document.getElementById("popup_root")) ||
                  void 0 === t
                    ? void 0
                    : t.hasChildNodes(),
                i =
                  e.path ??
                  (null === (n = e.composedPath) || void 0 === n
                    ? void 0
                    : n.call(e));
              return (
                z ||
                (m &&
                  !H() &&
                  b &&
                  !l &&
                  !(s && (null == i ? void 0 : i.find((e) => s.includes(e)))))
              );
            }
          ),
            i.useEffect(() => {
              var e, t;
              return (
                D.current.classList.add("dc-modal"),
                null == R ||
                  null === (t = R.current) ||
                  void 0 === t ||
                  null === (e = t.appendChild) ||
                  void 0 === e ||
                  e.call(t, D.current),
                null == I || I(),
                () => {
                  let e = null == R ? void 0 : R.current,
                    t = null == D ? void 0 : D.current;
                  e &&
                    t &&
                    (null == e ? void 0 : e.contains(t)) &&
                    (null == e || e.removeChild(t)),
                    null == Z || Z();
                }
              );
            }, []);
          let $ = i.useCallback(
            (e) => {
              "Escape" === e.key && (null == F || F());
            },
            [F]
          );
          i.useEffect(
            () => (
              window.addEventListener("keydown", $),
              () => window.removeEventListener("keydown", $)
            ),
            [$]
          );
          let V = L ? L() : null;
          return r.createPortal(
            (0, l.jsxs)("div", {
              ref: O,
              id: p,
              className: a()("dc-modal__container", {
                [`dc-modal__container_${n}`]: n,
                "dc-modal__container--risk-message": f,
                "dc-modal__container--small": A,
                "dc-modal__container--is-vertical-centered": C,
                "dc-modal__container--is-vertical-bottom": y,
                "dc-modal__container--is-vertical-top": k,
                "dc-modal__container--is-confirmation-modal": j,
              }),
              style: { height: v || "auto", width: T || "auto" },
              children: [
                !f &&
                  (x || M || V) &&
                  (0, l.jsxs)("div", {
                    className: a()("dc-modal-header", {
                      "dc-modal-header__border-bottom": !E,
                      [`dc-modal-header--${n}`]: n,
                      "dc-modal-header--is-title-centered": w,
                    }),
                    style: { background: _ },
                    children: [
                      V &&
                        (0, l.jsx)(h.Z, {
                          as: "h3",
                          color: "prominent",
                          weight: "bold",
                          styles: { lineHeight: "2.4rem" },
                          className: a()("dc-modal-header__title", {
                            [`dc-modal-header__title--${n}`]: n,
                          }),
                          children: V,
                        }),
                      M &&
                        (0, l.jsxs)(h.Z, {
                          as: "h3",
                          color: "prominent",
                          weight: "bold",
                          styles: { lineHeight: "2.4rem" },
                          className: a()("dc-modal-header__title", {
                            [`dc-modal-header__title--${n}`]: n,
                          }),
                          children: [
                            g &&
                              (0, l.jsx)(d.Z, {
                                onClick: N,
                                className: "dc-modal-header__icon",
                              }),
                            M,
                          ],
                        }),
                      x &&
                        (0, l.jsx)("div", {
                          className: a()("dc-modal-header__section", {
                            [`dc-modal-header__section--${n}`]: n,
                          }),
                          children: x,
                        }),
                      m &&
                        (0, l.jsx)("div", {
                          onClick: F,
                          className: "dc-modal-header__close",
                          role: "button",
                          children: (0, l.jsx)(u.Z, {
                            height: "20px",
                            width: "20px",
                            color: o,
                            "data-testid": "dt_modal_close_icon",
                            fill: "var(--text-general)",
                            className: "icon-general-fill-path",
                          }),
                        }),
                    ],
                  }),
                t,
              ],
            }),
            D.current
          );
        },
        g = (e) => {
          let {
            children: t,
            className: n,
            close_icon_color: i,
            elements_to_ignore: o,
            exit_classname: a,
            has_close_icon: r = !0,
            has_return_icon: c = !1,
            header: d,
            header_background_color: u,
            height: h,
            id: g,
            is_confirmation_modal: x,
            is_open: _,
            is_risk_warning_visible: v,
            is_title_centered: p,
            is_vertical_bottom: j,
            is_vertical_centered: b,
            is_vertical_top: f,
            onEntered: w,
            onExited: y,
            onMount: C,
            onReturn: k,
            onUnmount: I,
            portalId: N = "modal_root",
            renderTitle: Z,
            should_close_on_click_outside: S = !1,
            should_header_stick_body: L = !0,
            small: z,
            title: E,
            transition_timeout: A,
            toggleModal: M,
            width: F,
          } = e;
          return (0, l.jsx)(s.Z, {
            appear: !0,
            in: _,
            timeout: A || 250,
            classNames: {
              appear: "dc-modal__container--enter",
              enter: "dc-modal__container--enter",
              enterDone: "dc-modal__container--enter-done",
              exit: a || "dc-modal__container--exit",
            },
            unmountOnExit: !0,
            onEntered: w,
            onExited: y,
            children: (0, l.jsx)(m, {
              className: n,
              close_icon_color: i,
              should_header_stick_body: L,
              has_return_icon: c,
              header: d,
              header_background_color: u,
              id: g,
              is_open: _,
              is_risk_warning_visible: v,
              is_confirmation_modal: x,
              is_vertical_bottom: j,
              is_vertical_centered: b,
              is_vertical_top: f,
              is_title_centered: p,
              title: E,
              toggleModal: M,
              has_close_icon: r,
              height: h,
              onMount: C,
              onReturn: k,
              onUnmount: I,
              portalId: N,
              renderTitle: Z,
              should_close_on_click_outside: S,
              small: z,
              width: F,
              elements_to_ignore: o,
              children: t,
            }),
          });
        };
      (g.Body = (e) => {
        let { children: t, className: n } = e;
        return (0, l.jsx)("div", {
          className: a()("dc-modal-body", n),
          children: t,
        });
      }),
        (g.Footer = (e) => {
          let {
            children: t,
            className: n,
            has_separator: o,
            is_bypassed: r,
          } = e;
          return r
            ? (0, l.jsx)(i.Fragment, { children: t })
            : (0, l.jsx)("div", {
                "data-testid": "dt_modal_footer",
                className: a()(
                  "dc-modal-footer",
                  { "dc-modal-footer--separator": o },
                  n
                ),
                children: t,
              });
        });
      let x = g;
    },
    86278: function (e, t, n) {
      n.d(t, {
        X: function () {
          return i;
        },
        m: function () {
          return o;
        },
      });
      var l = n(67294);
      let i = (e, t) => {
          let [n, i] = l.useState(!1),
            o = l.useRef(null),
            a = e || o,
            r = () => i(!0),
            s = () => i(!1);
          return (
            l.useEffect(() => {
              let e = a.current;
              if (e)
                return (
                  t
                    ? (e.addEventListener("mouseenter", r),
                      e.addEventListener("mouseleave", s))
                    : (e.addEventListener("mouseover", r),
                      e.addEventListener("mouseout", s)),
                  () => {
                    t
                      ? (e.removeEventListener("mouseenter", r),
                        e.removeEventListener("mouseleave", s))
                      : (e.removeEventListener("mouseover", r),
                        e.removeEventListener("mouseout", s));
                  }
                );
            }, [a, t]),
            [a, n]
          );
        },
        o = () => {
          let [e, t] = l.useState(!1),
            n = l.useCallback(() => t(!0), []),
            i = l.useCallback(() => t(!1), []),
            o = l.useRef(null);
          return [
            l.useCallback(
              (e) => {
                o.current &&
                  (o.current.removeEventListener("mouseover", n),
                  o.current.removeEventListener("mouseout", i)),
                  (o.current = e),
                  o.current &&
                    (o.current.addEventListener("mouseover", n),
                    o.current.addEventListener("mouseout", i));
              },
              [n, i]
            ),
            e,
          ];
        };
    },
  },
]);
