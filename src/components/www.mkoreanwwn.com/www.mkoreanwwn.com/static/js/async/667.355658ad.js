"use strict";
(self.webpackChunkbot = self.webpackChunkbot || []).push([
  ["667"],
  {
    57801: function (e, t, s) {
      s.d(t, { Z: () => _ });
      var a = s("85893"),
        i = s("67294"),
        n = s("63387"),
        r = s.n(n);
      let o = (e) => {
        let { message: t, className: s, type: i } = e;
        return (0, a.jsx)("div", {
          className: r()("dc-field", s, {
            "dc-field--error": "error" === i,
            "dc-field--warn": "warn" === i,
          }),
          children: t,
        });
      };
      var l = s("45452");
      let c = (e) => {
          let { children: t, has_footer: s } = e;
          return s
            ? (0, a.jsx)("div", { className: "dc-input__wrapper", children: t })
            : (0, a.jsx)(i.Fragment, { children: t });
        },
        d = i.forwardRef((e, t) => {
          let {
              bottom_label: s,
              className: n,
              classNameError: d,
              classNameHint: _,
              classNameWarn: u,
              disabled: p = !1,
              error: h,
              field_className: x,
              has_character_counter: m,
              hint: N,
              initial_character_count: g,
              input_id: j,
              is_relative_hint: v,
              label_className: b,
              label: f,
              leading_icon: S,
              max_characters: E,
              trailing_icon: C,
              warn: R,
              data_testId: w,
              maxLength: T,
              placeholder: I,
              ...Z
            } = e,
            [y, P] = i.useState(0);
          i.useEffect(() => {
            (g || 0 === g) && P(g);
          }, [g]);
          let k = !!m || (!!N && !!v),
            U = f ? "" : I;
          return (0, a.jsxs)(c, {
            has_footer: k,
            children: [
              (0, a.jsxs)("div", {
                className: r()("dc-input", n, {
                  "dc-input--disabled": p,
                  "dc-input--error": h,
                  "dc-input--hint": N,
                  "dc-input--bottom-label-active": s,
                }),
                children: [
                  (0, a.jsxs)("div", {
                    className: r()("dc-input__container", {
                      "dc-input__container--disabled": p,
                      "dc-input__container--error": h,
                    }),
                    children: [
                      S &&
                        i.cloneElement(S, {
                          className: r()(
                            "dc-input__leading-icon",
                            S.props.className
                          ),
                        }),
                      "textarea" === Z.type
                        ? (0, a.jsx)("textarea", {
                            ref: t,
                            "data-testid": w,
                            ...Z,
                            className: r()(
                              "dc-input__field dc-input__textarea",
                              {
                                "dc-input__field--placeholder-visible": !f && I,
                              }
                            ),
                            onChange: (e) => {
                              var t;
                              let s = e.target.value;
                              E && s.length >= E && (s = s.slice(0, E)),
                                P(s.length),
                                (e.target.value = s),
                                null === (t = Z.onChange) ||
                                  void 0 === t ||
                                  t.call(Z, e);
                            },
                            disabled: p,
                            id: j,
                            maxLength: T,
                            placeholder: U,
                          })
                        : (0, a.jsx)("input", {
                            ref: t,
                            "data-testid": w,
                            ...Z,
                            className: r()("dc-input__field", x, {
                              "dc-input__field--placeholder-visible": !f && I,
                            }),
                            onFocus: Z.onFocus,
                            onBlur: Z.onBlur,
                            onChange: Z.onChange,
                            onKeyDown: Z.onKeyDown,
                            onMouseDown: Z.onMouseDown,
                            onMouseUp: Z.onMouseUp,
                            onPaste: Z.onPaste,
                            disabled: p,
                            "data-lpignore": "password" !== Z.type || void 0,
                            id: j,
                            "aria-label": f,
                            maxLength: T,
                            placeholder: U,
                          }),
                      C &&
                        i.cloneElement(C, {
                          className: r()(
                            "dc-input__trailing-icon",
                            C.props.className
                          ),
                        }),
                      f &&
                        (0, a.jsx)("label", {
                          className: r()("dc-input__label", b),
                          htmlFor: Z.id,
                          children: f,
                        }),
                    ],
                  }),
                  (0, a.jsx)("div", {
                    children:
                      !k &&
                      (0, a.jsxs)(i.Fragment, {
                        children: [
                          h &&
                            (0, a.jsx)(o, {
                              className: d,
                              message: h,
                              type: "error",
                            }),
                          R &&
                            (0, a.jsx)(o, {
                              className: u,
                              message: R,
                              type: "warn",
                            }),
                          !h &&
                            N &&
                            !v &&
                            (0, a.jsx)("div", {
                              className: "dc-input__hint",
                              children: (0, a.jsx)(l.Z, {
                                as: "p",
                                color: "less-prominent",
                                size: "xs",
                                className: _,
                                children: N,
                              }),
                            }),
                        ],
                      }),
                  }),
                ],
              }),
              k &&
                (0, a.jsxs)("div", {
                  className: "dc-input__footer",
                  children: [
                    h &&
                      (0, a.jsx)(o, {
                        className: d,
                        message: h,
                        type: "error",
                      }),
                    R &&
                      (0, a.jsx)(o, { className: u, message: R, type: "warn" }),
                    !h &&
                      N &&
                      (0, a.jsx)("div", {
                        className: "dc-input__hint dc-input__hint--relative",
                        children: (0, a.jsx)(l.Z, {
                          color: "less-prominent",
                          "line-height": "m",
                          size: "xs",
                          children: N,
                        }),
                      }),
                    m &&
                      (0, a.jsx)("div", {
                        className: "dc-input__counter",
                        children: (0, a.jsxs)(l.Z, {
                          color: "less-prominent",
                          "line-height": "m",
                          size: "xs",
                          children: [y, E ? `/${E}` : ""],
                        }),
                      }),
                  ],
                }),
              s &&
                !h &&
                (0, a.jsx)("div", {
                  className: "dc-input__bottom-label",
                  children: (0, a.jsx)(l.Z, {
                    size: "xs",
                    color: "less-prominent",
                    children: s,
                  }),
                }),
            ],
          });
        });
      d.displayName = "Input";
      let _ = d;
    },
    30394: function (e, t, s) {
      s.d(t, { Z: () => h });
      var a = s("85893"),
        i = s("67294"),
        n = s("63387"),
        r = s.n(n),
        o = s("82106"),
        l = s("86278"),
        c = s("14244"),
        d = s("26088"),
        _ = s("92868"),
        u = s("2502"),
        p = s("45452");
      let h = (e) => {
        let {
            alignment: t,
            children: s,
            className: n,
            classNameBubble: h,
            classNameTarget: x,
            classNameTargetIcon: m,
            counter: N,
            disable_message_icon: g,
            disable_target_icon: j,
            has_error: v,
            icon: b,
            id: f,
            is_open: S,
            is_bubble_hover_enabled: E,
            margin: C = 0,
            message: R,
            onBubbleClose: w,
            onBubbleOpen: T,
            onClick: I = () => void 0,
            relative_render: Z = !1,
            should_disable_pointer_events: y = !1,
            should_show_cursor: P,
            zIndex: k = "1",
            data_testid: U,
            arrow_styles: A,
          } = e,
          L = i.useRef(),
          [O, G] = i.useState(void 0),
          [M, X] = i.useState(!1),
          { isDesktop: D } = (0, u.F)(),
          [K, F] = (0, l.X)(null, !0),
          [H, z] = (0, l.m)(),
          B = i.useMemo(() => !D && void 0 === S, [D, S]);
        i.useEffect(() => {
          L.current && G(L.current);
        }, [v]),
          i.useEffect(() => {
            !F && B && X(!1);
          }, [F, B]);
        let $ = () => {
            T && T();
          },
          V = () => {
            w && w();
          },
          W = r()(m, b),
          q = F && R && (!B || M);
        return (0, a.jsxs)("div", {
          ref: K,
          className: r()({ "dc-popover__wrapper": Z }),
          onClick: (e) => {
            I(e), B && X(!M);
          },
          "data-testid": "dt_popover_wrapper",
          children: [
            Z &&
              (0, a.jsx)("div", {
                className: "dc-popover__container",
                style: { zIndex: k },
                children: (0, a.jsx)("div", {
                  ref: L,
                  className: "dc-popover__container-relative",
                  "data-testid": "dt_popover_relative_container",
                }),
              }),
            (O || !Z) &&
              (0, a.jsx)(o.Popover, {
                isOpen: S ?? (q || (E && z)),
                positions: [t],
                padding: C + 8,
                containerClassName: r()({
                  "react-tiny-popover-container--disabled-pointer-event": y,
                  "react-tiny-popover-cursor-option": P,
                }),
                ...(Z
                  ? {
                      parentElement: O,
                      contentLocation: (e) => {
                        let { childRect: s, popoverRect: a, nudgedLeft: i } = e,
                          n = document.body.clientWidth,
                          r = s.right + (a.width - s.width / 2),
                          o = 0,
                          l = 0;
                        switch (t) {
                          case "left":
                            (l =
                              -1 *
                              Math.abs((a.height > a.width ? i : a.width) + C)),
                              (o =
                                s.height > a.height
                                  ? (s.height - a.height) / 2
                                  : -(((a.height - s.height) / 2) * 1));
                            break;
                          case "right":
                            (l = a.width + C),
                              (o =
                                s.height > a.height
                                  ? (s.height - a.height) / 2
                                  : -(((a.height - s.height) / 2) * 1));
                            break;
                          case "top":
                            (l = r > n ? -1 * Math.abs(r - n) : 0),
                              (o = -1 * Math.abs(a.height + C));
                            break;
                          case "bottom":
                            (l = r > n ? -1 * Math.abs(r - n) : 0),
                              (o = s.height + C);
                        }
                        return { top: o, left: l };
                      },
                    }
                  : { containerStyle: { zIndex: k } }),
                content: (e) => {
                  let { position: t, childRect: s, popoverRect: i } = e;
                  return (0, a.jsx)(o.ArrowContainer, {
                    position: t,
                    childRect: s,
                    popoverRect: i,
                    arrowColor: v
                      ? "var(--status-danger)"
                      : "var(--general-active)",
                    arrowSize: 5,
                    arrowStyle: Z
                      ? {
                          borderTop: "10px solid transparent",
                          borderLeft: "10px solid transparent",
                          borderRight: `10px solid ${
                            v ? "var(--status-danger)" : "var(--general-active)"
                          }`,
                          transform: "rotate(315deg)",
                          right: "0px",
                          top: "5px",
                          height: "10px",
                          margin: "auto",
                          bottom: "0px",
                        }
                      : { ...A },
                    children: (0, a.jsxs)("div", {
                      id: f,
                      onMouseEnter: $,
                      onMouseLeave: V,
                      className: r()(h, "dc-popover__bubble", {
                        "dc-popover__bubble--error": v,
                      }),
                      ref: H,
                      children: [
                        !g &&
                          "info" === b &&
                          (0, a.jsx)("i", {
                            className: "dc-popover__bubble__icon",
                            children: (0, a.jsx)(c.Z, {}),
                          }),
                        (v &&
                          (0, a.jsx)(p.Z, {
                            size: "xxs",
                            color: "colored-background",
                            children: R,
                          })) ||
                          (0, a.jsx)(p.Z, {
                            lineHeight: "md",
                            size: "xxs",
                            className: "dc-popover__bubble__text",
                            children: R,
                          }),
                      ],
                    }),
                  });
                },
                children: (0, a.jsx)("div", {
                  "data-testid": U,
                  className: r()("dc-popover", n),
                  id: f,
                  children: (0, a.jsxs)("div", {
                    className: r()(x, "dc-popover__target"),
                    children: [
                      !j &&
                        (0, a.jsxs)("i", {
                          className: R
                            ? "dc-popover__target__icon"
                            : "dc-popover__target__icon--disabled",
                          children: [
                            "info" === b && (0, a.jsx)(c.Z, { className: W }),
                            "question" === b &&
                              (0, a.jsx)(_.Z, { className: W }),
                            "dot" === b && (0, a.jsx)(d.Z, { className: W }),
                            "counter" === b &&
                              (0, a.jsx)("span", { className: W, children: N }),
                          ],
                        }),
                      s,
                    ],
                  }),
                }),
              }),
          ],
        });
      };
    },
    70195: function (e, t, s) {
      s.d(t, { Z: () => E });
      var a = s("85893"),
        i = s("67294"),
        n = s("63387"),
        r = s.n(n),
        o = s("96877"),
        l = s("45452"),
        c = s("71766"),
        d = s("54176"),
        _ = s("48059");
      let u = (e) => {
        let { profit: t } = e,
          s = t >= 0;
        return (0, a.jsx)("div", {
          className: r()("db-contract-card__result", {
            "db-contract-card__result--won": s,
            "db-contract-card__result--lost": !s,
          }),
          children: (0, a.jsx)(l.Z, {
            weight: "bold",
            className: "db-contract-card__result-caption",
            children: s
              ? (0, a.jsxs)(i.Fragment, {
                  children: [
                    (0, a.jsx)(_.Xx, { i18n_default_text: "Won" }),
                    (0, a.jsx)(c.Z, {
                      className: "db-contract-card__result-icon",
                      color: "green",
                    }),
                  ],
                })
              : (0, a.jsxs)(i.Fragment, {
                  children: [
                    (0, a.jsx)(_.Xx, { i18n_default_text: "Lost" }),
                    (0, a.jsx)(d.Z, {
                      className: "db-contract-card__result-icon",
                      color: "red",
                    }),
                  ],
                }),
          }),
        });
      };
      var p = s("54798"),
        h = s("80177"),
        x = s("68669"),
        m = s("16854"),
        N = s("91101"),
        g = s("89057"),
        j = s("88079");
      let v = (e) => {
          let { className: t } = e;
          return (0, a.jsxs)("div", {
            className: r()("circular-wrapper", t),
            children: [
              (0, a.jsx)("span", { className: "static-circle" }),
              (0, a.jsx)("span", { className: "dynamic-circle" }),
            ],
          });
        },
        b = Object.freeze({
          NOT_RUNNING: "Bot is not running",
          STARTING: "Bot is starting",
          RUNNING: "Bot running",
          PURCHASE_SENT: "Buying contract",
          PURCHASE_RECEIVED: "Contract bought",
          IS_STOPPING: "Bot is stopping",
          CONTRACT_CLOSED: "Contract closed",
        }),
        f = (e) => {
          let { contract_stage: t } = e;
          switch (t) {
            case h.K.STARTING:
              return (0, a.jsx)(_.Xx, { i18n_default_text: b.STARTING });
            case h.K.RUNNING:
              return (0, a.jsx)(_.Xx, { i18n_default_text: b.RUNNING });
            case h.K.PURCHASE_SENT:
              return (0, a.jsx)(_.Xx, { i18n_default_text: b.PURCHASE_SENT });
            case h.K.PURCHASE_RECEIVED:
              return (0, a.jsx)(_.Xx, {
                i18n_default_text: b.PURCHASE_RECEIVED,
              });
            case h.K.IS_STOPPING:
              return (0, a.jsx)(_.Xx, { i18n_default_text: b.IS_STOPPING });
            case h.K.CONTRACT_CLOSED:
              return (0, a.jsx)(_.Xx, { i18n_default_text: b.CONTRACT_CLOSED });
            case h.K.NOT_RUNNING:
            default:
              return (0, a.jsx)(_.Xx, { i18n_default_text: b.NOT_RUNNING });
          }
        },
        S = (0, o.Pi)((e) => {
          let { className: t, should_show_overlay: s } = e,
            { dashboard: n, run_panel: o, summary_card: l } = (0, x.oR)(),
            { isAutoTrading: c, stopSpeedbot: d } = (0, p.f)(),
            { client: b } = (0, x.oR)(),
            { active_tab: S } = n,
            { is_contract_completed: E, profit: C } = l,
            {
              contract_stage: R,
              is_stop_button_visible: w,
              is_stop_button_disabled: T,
              onRunButtonClick: I,
              onStopBotClick: Z,
              performSelfExclusionCheck: y,
            } = o,
            { account_status: P } = b,
            k = null == P ? void 0 : P.cashier_validation,
            [U, A] = i.useState(!1),
            L =
              null == k
                ? void 0
                : k.includes("WithdrawServiceUnavailableForPA");
          i.useEffect(() => {
            y();
          }, []),
            i.useEffect(() => {
              U &&
                setTimeout(() => {
                  A(!1);
                }, 1e3);
            }, [U]);
          let O = ["", "", ""],
            G = R === h.K.PURCHASE_SENT,
            M = R === h.K.PURCHASE_RECEIVED,
            X = R - (G || M ? 2 : 3);
          if (X >= 0) {
            X < O.length && (O[X] = "active"), E && (X += 1);
            for (let e = 0; e < X - 1; e++) O[e] = "completed";
          }
          let D = T || U,
            K = i.useMemo(
              () =>
                c
                  ? {
                      id: "db-animation__stop-speedbot-button",
                      class: "animation__stop-button",
                      text: (0, a.jsx)(_.Xx, {
                        i18n_default_text: "Stop Speedbot",
                      }),
                      icon: (0, a.jsx)(m.Z, { fill: "#fff" }),
                    }
                  : w
                  ? {
                      id: "db-animation__stop-button",
                      class: "animation__stop-button",
                      text: (0, a.jsx)(_.Xx, { i18n_default_text: "Stop" }),
                      icon: (0, a.jsx)(m.Z, { fill: "#fff" }),
                    }
                  : {
                      id: "db-animation__run-button",
                      class: "animation__run-button",
                      text: (0, a.jsx)(_.Xx, { i18n_default_text: "Run" }),
                      icon: (0, a.jsx)(N.Z, { fill: "#fff" }),
                    },
              [w, c]
            ),
            F = s && E,
            H = ["dashboard", "bot_builder", "charts", "tutorials"],
            z = (e) => H[e];
          return (0, a.jsxs)("div", {
            className: r()("animation__wrapper", t),
            children: [
              (0, a.jsx)(j.Z, {
                is_disabled: D && !L,
                className: K.class,
                id: K.id,
                icon: K.icon,
                onClick: () => {
                  if ((A(!0), c)) {
                    d();
                    return;
                  }
                  if (w) {
                    Z();
                    return;
                  }
                  I(), (0, g.GE)({ subpage_name: z(S) });
                },
                has_effect: !0,
                ...(w || c || !L ? { primary: !0 } : { green: !0 }),
                children: K.text,
              }),
              (0, a.jsxs)("div", {
                className: r()("animation__container", t, {
                  "animation--running": R > 0,
                  "animation--completed": F,
                }),
                children: [
                  F && (0, a.jsx)(u, { profit: C }),
                  (0, a.jsx)("span", {
                    className: "animation__text",
                    children: (0, a.jsx)(f, { contract_stage: R }),
                  }),
                  (0, a.jsxs)("div", {
                    className: "animation__progress",
                    children: [
                      (0, a.jsx)("div", {
                        className: "animation__progress-line",
                        children: (0, a.jsx)("div", {
                          className: `animation__progress-bar animation__progress-${R}`,
                        }),
                      }),
                      O.map((e, t) =>
                        (0, a.jsx)(
                          v,
                          { className: e },
                          `status_class-${e}-${t}`
                        )
                      ),
                    ],
                  }),
                ],
              }),
            ],
          });
        }),
        E = S;
    },
    83257: function (e, t, s) {
      s.d(t, {
        Z: function () {
          return n;
        },
      });
      var a = s(67294),
        i = s(68669);
      let n = () => {
        let { ui: e } = (0, i.oR)() ?? {
            ui: { setDarkMode: () => {}, is_dark_mode_on: !1 },
          },
          { setDarkMode: t, is_dark_mode_on: s } = e;
        return {
          toggleTheme: (0, a.useCallback)(() => {
            let e = document.querySelector("body");
            e &&
              (e.classList.contains("theme--dark")
                ? (localStorage.setItem("theme", "light"),
                  e.classList.remove("theme--dark"),
                  e.classList.add("theme--light"),
                  t(!1))
                : (localStorage.setItem("theme", "dark"),
                  e.classList.remove("theme--light"),
                  e.classList.add("theme--dark"),
                  t(!0)));
          }, [t]),
          is_dark_mode_on: s,
          setDarkMode: t,
        };
      };
    },
  },
]);
