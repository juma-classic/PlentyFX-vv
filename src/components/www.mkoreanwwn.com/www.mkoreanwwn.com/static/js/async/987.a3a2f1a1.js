"use strict";
(self.webpackChunkbot = self.webpackChunkbot || []).push([
  ["987"],
  {
    23085: function (e, r, t) {
      t.r(r), t.d(r, { default: () => A });
      var l = t("85893"),
        s = t("67294"),
        o = t("96877"),
        n = t("27412"),
        i = t("45697"),
        a = t.n(i),
        d = t("48059"),
        c = t("48766"),
        _ = t("94145"),
        h = t("66163"),
        u = t("31784"),
        m = t("50299"),
        x = t("88079"),
        g = t("45452");
      let p = (e) => {
          let { error_message: r } = e;
          return (0, l.jsxs)("div", {
            className: "unhandled-error",
            children: [
              (0, l.jsx)(m.Z, {
                height: "120px",
                width: "120px",
                fill: "var(--text-general)",
              }),
              (0, l.jsx)(g.Z, {
                className: "da-icon-with-message__text",
                as: "p",
                lineHeight: "xxl",
                align: "center",
                weight: "bold",
                children: (0, l.jsx)(d.Xx, {
                  i18n_default_text: "Sorry for the interruption",
                }),
              }),
              (0, l.jsx)(g.Z, {
                className: "da-icon-with-message__text__desc",
                as: "p",
                size: "xs",
                lineHeight: "xxs",
                align: "center",
                children: r,
              }),
              (0, l.jsx)(x.Z, {
                onClick: () => location.reload(),
                has_effect: !0,
                primary: !0,
                large: !0,
                children: (0, l.jsx)(d.Xx, { i18n_default_text: "Refresh" }),
              }),
            ],
          });
        },
        v = (e) => {
          var r;
          let { messages: t } = e,
            [o, n] = s.useState(!1),
            i =
              null == t
                ? void 0
                : null === (r = t[0]) || void 0 === r
                ? void 0
                : r.toString();
          s.useEffect(() => {
            n(!0);
          }, []);
          let a = () => {
            n(!o);
          };
          return (0, l.jsxs)(u.Z, {
            has_close_icon: !0,
            width: "440px",
            height: "284px",
            is_open: o,
            toggleModal: a,
            children: [
              (0, l.jsx)(c.Z, {
                children: (0, l.jsx)(u.Z.Body, {
                  children: (0, l.jsx)(p, { error_message: i }),
                }),
              }),
              (0, l.jsx)(h.Z, {
                children: (0, l.jsx)(_.Z, {
                  portal_element_id: "modal_root",
                  has_close_icon: !0,
                  visible: o,
                  onClose: a,
                  children: (0, l.jsx)(u.Z.Body, {
                    children: (0, l.jsx)(p, { error_message: i }),
                  }),
                }),
              }),
            ],
          });
        };
      var b = t("63387"),
        j = t.n(b),
        f = t("2502"),
        w = t("11527"),
        y = t("79655");
      let N = (e) => {
          let {
            children: r,
            className: t,
            to: s,
            onClick: o,
            size: n = "medium",
          } = e;
          return (0, l.jsx)(y.rU, {
            className: j()(
              "dc-btn dc-btn--primary",
              t,
              "effect",
              `dc-btn__${n}`
            ),
            to: s ?? "",
            onClick: o,
            children: r,
          });
        },
        Z = (e) => {
          var r;
          let {
              buttonOnClick: t,
              buttonSize: s = "large",
              classNameImage: o,
              header: n,
              image_url: i,
              messages: a,
              redirect_labels: d,
              redirect_urls: _,
              should_clear_error_on_click: u,
              setError: m,
              should_redirect: x = !0,
            } = e,
            p = () => {
              u
                ? (null == m || m(!1, null),
                  window.location.assign("https://app.deriv.com"))
                : null == t || t();
            },
            { isMobile: v } = (0, f.F)();
          return (0, l.jsxs)("div", {
            className: "dc-page-error__container",
            children: [
              !!i &&
                (0, l.jsxs)(l.Fragment, {
                  children: [
                    (0, l.jsx)(c.Z, {
                      children: (0, l.jsx)("img", {
                        className: o,
                        src: i,
                        alt: "404",
                        loading: "lazy",
                        width: "607px",
                        height: "366px",
                      }),
                    }),
                    (0, l.jsx)(h.Z, {
                      children: (0, l.jsx)("img", {
                        className: o,
                        src: i,
                        alt: "404",
                        loading: "lazy",
                        width: "328px",
                        height: "200px",
                      }),
                    }),
                  ],
                }),
              (0, l.jsxs)("div", {
                className: j()("dc-page-error__box", {
                  "dc-page-error__box--left": !!i,
                }),
                children: [
                  (0, l.jsx)(g.Z, {
                    as: "h3",
                    size: v ? "s" : "l",
                    align: "center",
                    weight: "bold",
                    lineHeight: "s",
                    color: "prominent",
                    children: n,
                  }),
                  (0, l.jsx)("div", {
                    className: j()("dc-page-error__message-wrapper", {
                      "dc-page-error__message-wrapper--left": !!i,
                    }),
                    children: (0, l.jsx)(g.Z, {
                      color: "prominent",
                      className: j()("dc-page-error__message", {
                        "dc-page-error__message--left": !!i,
                      }),
                      children: a.map((e, r) =>
                        (null == e ? void 0 : e.has_html)
                          ? (0, l.jsx)(
                              g.Z,
                              {
                                as: "p",
                                size: v ? "xxs" : "s",
                                align: v ? "center" : "left",
                                lineHeight: "x",
                                className: "dc-page-error__message-paragraph",
                                dangerouslySetInnerHTML: {
                                  __html: null == e ? void 0 : e.message,
                                },
                              },
                              r
                            )
                          : (0, l.jsx)(
                              g.Z,
                              {
                                as: "p",
                                size: v ? "xxs" : "s",
                                align: v ? "center" : "left",
                                lineHeight: "x",
                                className: "dc-page-error__message-paragraph",
                                children: e,
                              },
                              r
                            )
                      ),
                    }),
                  }),
                  (0, l.jsxs)("div", {
                    className: "dc-page-error__btn-wrapper",
                    "data-testid": "dc-page-error__btn-wrapper",
                    children: [
                      x &&
                        0 !== d.length &&
                        (null == _
                          ? void 0
                          : null === (r = _.map) || void 0 === r
                          ? void 0
                          : r.call(_, (e, r) =>
                              (0, l.jsx)(
                                N,
                                {
                                  className: "dc-page-error__btn",
                                  onClick: p,
                                  size: s,
                                  children: (0, l.jsx)(g.Z, {
                                    weight: "bold",
                                    size: v ? "xs" : "s",
                                    className:
                                      "dc-page-error__btn-text dc-btn__text",
                                    children: d[r],
                                  }),
                                },
                                r
                              )
                            )),
                      !x &&
                        (0, l.jsx)(w.z, {
                          type: "button",
                          className: "dc-page-error__btn--no-redirect",
                          onClick: p,
                          size: v ? "sm" : "md",
                          children: (0, l.jsx)(g.Z, {
                            weight: "bold",
                            size: v ? "xs" : "s",
                            className: "dc-page-error__btn-text dc-btn__text",
                            children: d[0],
                          }),
                        }),
                    ],
                  }),
                ],
              }),
            ],
          });
        };
      var E = t("63069");
      let k = () =>
          (0, l.jsxs)("div", {
            className: "unhandled-error",
            children: [
              (0, l.jsx)(m.Z, { height: "120px", width: "120px" }),
              (0, l.jsx)(g.Z, {
                className: "da-icon-with-message__text",
                as: "p",
                size: "s",
                color: "general",
                lineHeight: "xxl",
                align: "center",
                weight: "bold",
                children: (0, E.sJ)().header,
              }),
              (0, l.jsx)(g.Z, {
                className: "da-icon-with-message__text__desc",
                as: "p",
                size: "xs",
                color: "general",
                lineHeight: "xxs",
                align: "center",
                children: (0, E.sJ)().description,
              }),
              (0, l.jsx)(x.Z, {
                onClick: () => location.reload(),
                has_effect: !0,
                primary: !0,
                large: !0,
                text: (0, E.sJ)().cta_label,
              }),
            ],
          }),
        C = () => {
          let [e, r] = s.useState(!1);
          s.useEffect(() => {
            r(!0);
          }, []);
          let t = () => {
            r(!e);
          };
          return (0, l.jsxs)(u.Z, {
            has_close_icon: !0,
            width: "440px",
            height: "284px",
            is_open: e,
            toggleModal: t,
            children: [
              (0, l.jsx)(c.Z, {
                children: (0, l.jsx)(u.Z.Body, { children: (0, l.jsx)(k, {}) }),
              }),
              (0, l.jsx)(h.Z, {
                children: (0, l.jsx)(_.Z, {
                  portal_element_id: "modal_root",
                  has_close_icon: !0,
                  visible: e,
                  onClose: t,
                  children: (0, l.jsx)(u.Z.Body, {
                    children: (0, l.jsx)(k, {}),
                  }),
                }),
              }),
            ],
          });
        },
        z = (e) => {
          let { error_header: r, error_messages: t, ...s } = e;
          return r && t
            ? (0, l.jsx)(Z, { header: r, messages: t, ...s })
            : t
            ? (0, l.jsx)(v, { messages: t })
            : (0, l.jsx)(C, {});
        };
      var L = t("66175");
      let H = (e) => {
        let {
          header: r,
          message: t,
          redirect_label: s,
          redirectOnClick: o = null,
          should_clear_error_on_click: n,
          setError: i,
          redirect_to: a = L.xOw.trade,
          should_redirect: c = !0,
        } = e;
        return (0, l.jsx)(z, {
          error_header: r ?? "",
          error_messages: t ? [t, ""] : [],
          redirect_urls: [a],
          redirect_labels: (!s && []) || [s || (0, d.NC)("Refresh")],
          buttonOnClick: o || (() => window.location.reload()),
          should_clear_error_on_click: n,
          setError: i,
          should_redirect: c,
        });
      };
      H.propTypes = {
        header: a().string,
        message: a().oneOfType([a().node, a().string, a().object]),
        redirectOnClick: a().func || a().object,
        redirect_label: a().string,
        setError: a().func,
        should_clear_error_on_click: a().bool,
        should_redirect: a().bool,
        redirect_to: a().string,
        should_show_refresh: a().bool,
      };
      class R extends s.Component {
        constructor(e) {
          super(e),
            (0, n._)(this, "componentDidCatch", (e, r) => {
              window.TrackJS &&
                window.TrackJS.console.log(this.props.root_store),
                this.setState({ hasError: !0, error: e, info: r });
            }),
            (0, n._)(this, "render", () =>
              this.state.hasError
                ? (0, l.jsx)(H, { should_show_refresh: !0 })
                : this.props.children
            ),
            (this.state = { hasError: !1 });
        }
      }
      R.propTypes = {
        root_store: a().object,
        children: a().oneOfType([a().string, a().arrayOf(a().node), a().node]),
      };
      var S = t("97613"),
        O = t("68669"),
        I = t("89606");
      let T = (0, o.Pi)(() => {
        let { client: e, ui: r } = (0, O.oR)(),
          {
            is_trading_experience_incomplete: t,
            content_flag: o,
            is_logged_in: n,
            accounts: i,
            loginid: a,
          } = e,
          { is_trading_assessment_for_new_user_enabled: c } = r,
          _ = (0, s.useMemo)(() => {
            var e;
            return (
              n &&
              (null == i
                ? void 0
                : null === (e = i[a]) || void 0 === e
                ? void 0
                : e.landing_company_name) === "maltainvest" &&
              !c &&
              t &&
              o !== L.DQA.LOW_RISK_CR_EU &&
              o !== L.DQA.LOW_RISK_CR_NON_EU
            );
          }, [n, c, t, o, i, a]);
        return (0, l.jsxs)(u.Z, {
          is_open: _ || !1,
          width: "44rem",
          className: "trade-modal-wrapper",
          children: [
            (0, l.jsxs)(u.Z.Body, {
              children: [
                (0, l.jsx)(I.J, {
                  icon: "ic-currency-eur-check",
                  className: "currency-icon",
                  size: 95,
                }),
                (0, l.jsx)(g.Z, {
                  as: "p",
                  align: "center",
                  weight: "bold",
                  className: "verified-account__text",
                  children: (0, l.jsx)(d.Xx, {
                    i18n_default_text: "Trading Experience Assessment<0/>",
                    components: [(0, l.jsx)("br", {}, 0)],
                  }),
                }),
                (0, l.jsx)(g.Z, {
                  as: "p",
                  size: "xs",
                  align: "center",
                  children: (0, l.jsx)(d.Xx, {
                    i18n_default_text:
                      "As per our regulatory obligations, we are required to assess your trading knowledge and experience.<0/><0/>Please click ‘OK’ to continue",
                    components: [(0, l.jsx)("br", {}, 0)],
                  }),
                }),
              ],
            }),
            (0, l.jsx)(u.Z.Footer, {
              children: (0, l.jsx)(x.Z, {
                type: "button",
                large: !0,
                text: (0, d.NC)("OK"),
                primary: !0,
                onClick: () => {
                  window.location.assign(
                    "https://app.deriv.com/account/trading-assessment"
                  );
                },
              }),
            }),
          ],
        });
      });
      var B = t("88199");
      t("674");
      let $ = (0, s.lazy)(() =>
          Promise.all([
            t.e("361"),
            t.e("867"),
            t.e("252"),
            t.e("615"),
            t.e("667"),
            t.e("573"),
          ]).then(t.bind(t, 96637))
        ),
        P = () =>
          (0, l.jsx)(S.Z, { message: (0, d.NC)("Initializing D-Bot...") }),
        F = (0, o.Pi)(() => {
          var e, r, t, s, o, n, i;
          let { common: a } = (0, O.oR)();
          return a.error
            ? (0, l.jsx)(H, {
                header:
                  null === (e = a.error) || void 0 === e ? void 0 : e.header,
                message:
                  null === (r = a.error) || void 0 === r ? void 0 : r.message,
                redirect_label:
                  null === (t = a.error) || void 0 === t
                    ? void 0
                    : t.redirect_label,
                redirectOnClick:
                  null === (s = a.error) || void 0 === s
                    ? void 0
                    : s.redirectOnClick,
                should_clear_error_on_click:
                  null === (o = a.error) || void 0 === o
                    ? void 0
                    : o.should_clear_error_on_click,
                setError: a.setError,
                redirect_to:
                  null === (n = a.error) || void 0 === n
                    ? void 0
                    : n.redirect_to,
                should_redirect:
                  null === (i = a.error) || void 0 === i
                    ? void 0
                    : i.should_redirect,
              })
            : null;
        }),
        A = () => {
          let e = (0, O.oR)(),
            r = (0, s.useRef)(!1),
            [t, o] = (0, s.useState)(!1);
          return ((0, s.useEffect)(() => {
            (async () => {
              !r.current &&
                (await B.api_base.init(),
                await B.api_base2.customInit(),
                await B.api_base3.customInit(),
                await B.api_base4.customInit(),
                (r.current = !0),
                o(!0));
            })();
          }, []),
          e && t)
            ? (0, l.jsx)(s.Suspense, {
                fallback: (0, l.jsx)(P, {}),
                children: (0, l.jsxs)(R, {
                  root_store: e,
                  children: [
                    (0, l.jsx)(F, {}),
                    (0, l.jsx)($, {}),
                    (0, l.jsx)(T, {}),
                  ],
                }),
              })
            : (0, l.jsx)(P, {});
        };
    },
    48766: function (e, r, t) {
      t.d(r, { Z: () => n });
      var l = t("85893"),
        s = t("67294"),
        o = t("77149");
      let n = (e) => {
        let { children: r } = e;
        return (0, o.nI)() ? (0, l.jsx)(s.Fragment, { children: r }) : null;
      };
    },
    97050: function (e, r, t) {
      t.d(r, { Z: () => n });
      var l = t("85893"),
        s = t("67294"),
        o = t("93581");
      let n = (e) => {
        let {
            children: r,
            className: t,
            is_bypassed: n = !1,
            is_disabled: i = !1,
            id: a,
            height_offset: d,
            max_autoheight_offset: c,
          } = e,
          _ = d ? `calc(100rvh - ${d})` : "calc(100rvh)",
          h = { height: c ? "" : _, maxHeight: c ? `calc(100rvh - ${c})` : "" };
        return (s.useEffect(() => {
          window.dispatchEvent(new Event("resize"));
        }, [d]),
        n)
          ? r
          : (0, l.jsx)(o.default, {
              id: a,
              className: t,
              style: i ? {} : h,
              "data-testid": "dt_div_100_vh",
              children: r,
            });
      };
    },
    94145: function (e, r, t) {
      t.d(r, { Z: () => u });
      var l = t("85893"),
        s = t("67294"),
        o = t("63387"),
        n = t.n(o),
        i = t("73935"),
        a = t("81262"),
        d = t("76298"),
        c = t("97050"),
        _ = t("29490"),
        h = t("43882");
      let u = (e) => {
        let {
            children: r,
            footer: t,
            has_close_icon: o = !0,
            has_full_height: u,
            header_classname: m,
            info_banner: x,
            portal_element_id: g,
            renderTitle: p,
            title: v,
            visible: b,
            wrapper_classname: j,
            learn_more_banner: f,
          } = e,
          w = s.useRef(null),
          [y, N] = s.useState(0);
        s.useLayoutEffect(() => {
          w.current && !y && N(w.current.offsetHeight);
        }, [t, y]);
        let Z = document.getElementById(g),
          E = (e, r) => {
            let t = r.getBoundingClientRect();
            if (t.top + r.clientHeight + 20 > window.innerHeight) {
              let l = (window.innerHeight - r.clientHeight) / 2;
              e.scrollTop += t.top - l;
            }
          };
        return (e.visible
          ? ((document.body.style.overflow = "hidden"),
            Z && (Z.style.overflow = "hidden"))
          : ((document.body.style.overflow = "unset"),
            Z && (Z.style.overflow = "unset")),
        Z)
          ? i.createPortal(
              (0, l.jsx)(a.Z, {
                appear: !0,
                in: b,
                timeout: 250,
                classNames: {
                  enter: "dc-mobile-dialog--enter",
                  enterDone: "dc-mobile-dialog--enter-done",
                  exit: "dc-mobile-dialog--exit",
                },
                unmountOnExit: !0,
                children: (0, l.jsx)("div", {
                  "data-testid": "dt_mobile_dialog",
                  className: "dc-mobile-dialog",
                  onClick: (e) => {
                    let r = e.target;
                    if (
                      ("A" !== r.tagName && e.stopPropagation(),
                      "INPUT" === r.tagName && "number" === r.type)
                    ) {
                      let t = () => E(e.currentTarget, r);
                      window.addEventListener("resize", t, !1),
                        window.setTimeout(() => {
                          window.removeEventListener("resize", t, !1);
                        }, 2e3);
                    }
                  },
                  children: (0, l.jsxs)(c.Z, {
                    className: n()("dc-mobile-dialog__container", {
                      "dc-mobile-dialog__container--has-scroll":
                        e.has_content_scroll,
                      "dc-mobile-dialog__container--has-info-banner": x || f,
                    }),
                    height_offset: e.content_height_offset || "8px",
                    children: [
                      (0, l.jsxs)(h.Z, {
                        is_bypassed: !x && !f,
                        is_scrollbar_hidden: !0,
                        className:
                          x || f
                            ? n()("dc-mobile-dialog__header-wrapper", m)
                            : "",
                        children: [
                          (0, l.jsxs)("div", {
                            className: n()(
                              "dc-mobile-dialog__header",
                              !x && !f && m
                            ),
                            children: [
                              (0, l.jsx)(_.Z, {
                                as: "h2",
                                size: "xs",
                                color: "prominent",
                                weight: "bold",
                                lineHeight: "unset",
                                className: "dc-mobile-dialog__title",
                                children: p ? p() : v,
                              }),
                              o &&
                                (0, l.jsx)("div", {
                                  "data-testid":
                                    "dt_dc_mobile_dialog_close_btn",
                                  className:
                                    "icons dc-btn-close dc-mobile-dialog__close-btn",
                                  onClick: e.onClose,
                                  children: (0, l.jsx)(d.Z, {
                                    className:
                                      "dc-mobile-dialog__close-btn-icon",
                                    height: "20px",
                                    width: "20px",
                                  }),
                                }),
                            ],
                          }),
                          x,
                          f,
                        ],
                      }),
                      (0, l.jsx)("div", {
                        className: n()("dc-mobile-dialog__content", {
                          "dc-mobile-dialog__content--is-full-height": u,
                        }),
                        style: y ? { height: `calc(100% - ${y}px)` } : void 0,
                        children: (0, l.jsx)("div", {
                          className: n()({ [`dc-mobile-dialog__${j}`]: j }),
                          children: r,
                        }),
                      }),
                      t &&
                        (0, l.jsx)("div", {
                          ref: w,
                          className: "dc-mobile-dialog__footer",
                          children: t,
                        }),
                    ],
                  }),
                }),
              }),
              Z
            )
          : null;
      };
    },
    66163: function (e, r, t) {
      t.d(r, { Z: () => n });
      var l = t("85893"),
        s = t("67294"),
        o = t("77149");
      let n = (e) => {
        let { children: r } = e;
        return (0, o.tq)() ? (0, l.jsx)(s.Fragment, { children: r }) : null;
      };
    },
    31784: function (e, r, t) {
      t.d(r, { Z: () => x });
      var l = t("85893"),
        s = t("67294"),
        o = t("63387"),
        n = t.n(o),
        i = t("73935"),
        a = t("81262"),
        d = t("1051"),
        c = t("14117"),
        _ = t("76298"),
        h = t("29490");
      let u = (e) => {
          let {
              children: r,
              className: t,
              close_icon_color: o,
              elements_to_ignore: a,
              has_close_icon: u = !0,
              has_return_icon: m = !1,
              header: x,
              header_background_color: g,
              height: p,
              id: v,
              is_confirmation_modal: b,
              is_open: j,
              is_risk_warning_visible: f,
              is_title_centered: w,
              is_vertical_bottom: y,
              is_vertical_centered: N,
              is_vertical_top: Z,
              onMount: E,
              onReturn: k,
              onUnmount: C,
              portalId: z = "modal_root",
              renderTitle: L,
              should_close_on_click_outside: H,
              should_header_stick_body: R = !0,
              small: S,
              title: O,
              toggleModal: I,
              width: T,
            } = e,
            B = s.useRef(document.createElement("div")),
            $ = z && document.getElementById(z),
            P = s.useRef($ || document.getElementById(z)),
            F = s.useRef(null),
            A = [
              ".dc-datepicker__picker",
              ".dc-mobile-dialog",
              ".dc-dropdown-list",
              ".dc-dropdown__list",
              ".modal_root",
            ],
            D = () => {
              var e;
              return null === (e = P.current) || void 0 === e
                ? void 0
                : e.querySelectorAll(A.join(", ")).length;
            };
          (0, d.t)(
            F,
            () => {
              j && (null == I || I());
            },
            (e) => {
              var r, t;
              let l =
                  null === (r = document.getElementById("popup_root")) ||
                  void 0 === r
                    ? void 0
                    : r.hasChildNodes(),
                s =
                  e.path ??
                  (null === (t = e.composedPath) || void 0 === t
                    ? void 0
                    : t.call(e));
              return (
                H ||
                (u &&
                  !D() &&
                  j &&
                  !l &&
                  !(a && (null == s ? void 0 : s.find((e) => a.includes(e)))))
              );
            }
          ),
            s.useEffect(() => {
              var e, r;
              return (
                B.current.classList.add("dc-modal"),
                null == P ||
                  null === (r = P.current) ||
                  void 0 === r ||
                  null === (e = r.appendChild) ||
                  void 0 === e ||
                  e.call(r, B.current),
                null == E || E(),
                () => {
                  let e = null == P ? void 0 : P.current,
                    r = null == B ? void 0 : B.current;
                  e &&
                    r &&
                    (null == e ? void 0 : e.contains(r)) &&
                    (null == e || e.removeChild(r)),
                    null == C || C();
                }
              );
            }, []);
          let J = s.useCallback(
            (e) => {
              "Escape" === e.key && (null == I || I());
            },
            [I]
          );
          s.useEffect(
            () => (
              window.addEventListener("keydown", J),
              () => window.removeEventListener("keydown", J)
            ),
            [J]
          );
          let M = L ? L() : null;
          return i.createPortal(
            (0, l.jsxs)("div", {
              ref: F,
              id: v,
              className: n()("dc-modal__container", {
                [`dc-modal__container_${t}`]: t,
                "dc-modal__container--risk-message": f,
                "dc-modal__container--small": S,
                "dc-modal__container--is-vertical-centered": N,
                "dc-modal__container--is-vertical-bottom": y,
                "dc-modal__container--is-vertical-top": Z,
                "dc-modal__container--is-confirmation-modal": b,
              }),
              style: { height: p || "auto", width: T || "auto" },
              children: [
                !f &&
                  (x || O || M) &&
                  (0, l.jsxs)("div", {
                    className: n()("dc-modal-header", {
                      "dc-modal-header__border-bottom": !R,
                      [`dc-modal-header--${t}`]: t,
                      "dc-modal-header--is-title-centered": w,
                    }),
                    style: { background: g },
                    children: [
                      M &&
                        (0, l.jsx)(h.Z, {
                          as: "h3",
                          color: "prominent",
                          weight: "bold",
                          styles: { lineHeight: "2.4rem" },
                          className: n()("dc-modal-header__title", {
                            [`dc-modal-header__title--${t}`]: t,
                          }),
                          children: M,
                        }),
                      O &&
                        (0, l.jsxs)(h.Z, {
                          as: "h3",
                          color: "prominent",
                          weight: "bold",
                          styles: { lineHeight: "2.4rem" },
                          className: n()("dc-modal-header__title", {
                            [`dc-modal-header__title--${t}`]: t,
                          }),
                          children: [
                            m &&
                              (0, l.jsx)(c.Z, {
                                onClick: k,
                                className: "dc-modal-header__icon",
                              }),
                            O,
                          ],
                        }),
                      x &&
                        (0, l.jsx)("div", {
                          className: n()("dc-modal-header__section", {
                            [`dc-modal-header__section--${t}`]: t,
                          }),
                          children: x,
                        }),
                      u &&
                        (0, l.jsx)("div", {
                          onClick: I,
                          className: "dc-modal-header__close",
                          role: "button",
                          children: (0, l.jsx)(_.Z, {
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
                r,
              ],
            }),
            B.current
          );
        },
        m = (e) => {
          let {
            children: r,
            className: t,
            close_icon_color: s,
            elements_to_ignore: o,
            exit_classname: n,
            has_close_icon: i = !0,
            has_return_icon: d = !1,
            header: c,
            header_background_color: _,
            height: h,
            id: m,
            is_confirmation_modal: x,
            is_open: g,
            is_risk_warning_visible: p,
            is_title_centered: v,
            is_vertical_bottom: b,
            is_vertical_centered: j,
            is_vertical_top: f,
            onEntered: w,
            onExited: y,
            onMount: N,
            onReturn: Z,
            onUnmount: E,
            portalId: k = "modal_root",
            renderTitle: C,
            should_close_on_click_outside: z = !1,
            should_header_stick_body: L = !0,
            small: H,
            title: R,
            transition_timeout: S,
            toggleModal: O,
            width: I,
          } = e;
          return (0, l.jsx)(a.Z, {
            appear: !0,
            in: g,
            timeout: S || 250,
            classNames: {
              appear: "dc-modal__container--enter",
              enter: "dc-modal__container--enter",
              enterDone: "dc-modal__container--enter-done",
              exit: n || "dc-modal__container--exit",
            },
            unmountOnExit: !0,
            onEntered: w,
            onExited: y,
            children: (0, l.jsx)(u, {
              className: t,
              close_icon_color: s,
              should_header_stick_body: L,
              has_return_icon: d,
              header: c,
              header_background_color: _,
              id: m,
              is_open: g,
              is_risk_warning_visible: p,
              is_confirmation_modal: x,
              is_vertical_bottom: b,
              is_vertical_centered: j,
              is_vertical_top: f,
              is_title_centered: v,
              title: R,
              toggleModal: O,
              has_close_icon: i,
              height: h,
              onMount: N,
              onReturn: Z,
              onUnmount: E,
              portalId: k,
              renderTitle: C,
              should_close_on_click_outside: z,
              small: H,
              width: I,
              elements_to_ignore: o,
              children: r,
            }),
          });
        };
      (m.Body = (e) => {
        let { children: r, className: t } = e;
        return (0, l.jsx)("div", {
          className: n()("dc-modal-body", t),
          children: r,
        });
      }),
        (m.Footer = (e) => {
          let {
            children: r,
            className: t,
            has_separator: o,
            is_bypassed: i,
          } = e;
          return i
            ? (0, l.jsx)(s.Fragment, { children: r })
            : (0, l.jsx)("div", {
                "data-testid": "dt_modal_footer",
                className: n()(
                  "dc-modal-footer",
                  { "dc-modal-footer--separator": o },
                  t
                ),
                children: r,
              });
        });
      let x = m;
    },
    43882: function (e, r, t) {
      t.d(r, { Z: () => l });
      let l = t("40150").Z;
    },
    40150: function (e, r, t) {
      t.d(r, {
        Z: function () {
          return a;
        },
      });
      var l = t(85893),
        s = t(67294),
        o = t(63387),
        n = t.n(o),
        i = t(86278);
      let a = (e) => {
        let {
            autohide: r = !0,
            children: t,
            className: o,
            has_horizontal: a,
            height: d,
            is_bypassed: c,
            is_only_horizontal: _,
            is_only_horizontal_overlay: h,
            is_scrollbar_hidden: u,
            testId: m = "dt_themed_scrollbars",
            onScroll: x,
            refSetter: g = null,
            style: p = {},
            scroll_height: v,
            should_scroll_to_selected: b = !1,
            width: j,
          } = e,
          [f, w] = (0, i.X)(g, !1);
        return (s.useEffect(() => {
          if (b && v) {
            var e;
            null == f ||
              null === (e = f.current) ||
              void 0 === e ||
              e.scrollTo(0, v);
          }
        }, [v, f, b]),
        c)
          ? t
          : (0, l.jsx)("div", {
              "data-testid": m,
              ref: f,
              className: n()("dc-themed-scrollbars", o, {
                "dc-themed-scrollbars__autohide": r,
                "dc-themed-scrollbars__autohide--is-hovered": r && w,
                "dc-themed-scrollbars--has-horizontal": a,
                "dc-themed-scrollbars--only-horizontal": _,
                "dc-themed-scrollbars--only-horizontal-overlay": h,
                "dc-themed-scrollbars--hidden-scrollbar": u,
              }),
              style: { maxHeight: d || "100%", maxWidth: j || "none", ...p },
              onScroll: x,
              children: t,
            });
      };
    },
    86278: function (e, r, t) {
      t.d(r, {
        X: function () {
          return s;
        },
        m: function () {
          return o;
        },
      });
      var l = t(67294);
      let s = (e, r) => {
          let [t, s] = l.useState(!1),
            o = l.useRef(null),
            n = e || o,
            i = () => s(!0),
            a = () => s(!1);
          return (
            l.useEffect(() => {
              let e = n.current;
              if (e)
                return (
                  r
                    ? (e.addEventListener("mouseenter", i),
                      e.addEventListener("mouseleave", a))
                    : (e.addEventListener("mouseover", i),
                      e.addEventListener("mouseout", a)),
                  () => {
                    r
                      ? (e.removeEventListener("mouseenter", i),
                        e.removeEventListener("mouseleave", a))
                      : (e.removeEventListener("mouseover", i),
                        e.removeEventListener("mouseout", a));
                  }
                );
            }, [n, r]),
            [n, t]
          );
        },
        o = () => {
          let [e, r] = l.useState(!1),
            t = l.useCallback(() => r(!0), []),
            s = l.useCallback(() => r(!1), []),
            o = l.useRef(null);
          return [
            l.useCallback(
              (e) => {
                o.current &&
                  (o.current.removeEventListener("mouseover", t),
                  o.current.removeEventListener("mouseout", s)),
                  (o.current = e),
                  o.current &&
                    (o.current.addEventListener("mouseover", t),
                    o.current.addEventListener("mouseout", s));
              },
              [t, s]
            ),
            e,
          ];
        };
    },
  },
]);
