(function (g) {
  var window = this;
  ("use strict");
  var j8Z = function (X, F) {
      return g.he(X, F);
    },
    PSZ = function (X) {
      if (X instanceof g.to) return X;
      if (typeof X.QI == "function") return X.QI(!1);
      if (g.$N(X)) {
        let F = 0;
        const Q = new g.to();
        Q.next = function () {
          for (;;) {
            if (F >= X.length) return g.b3;
            if (F in X) return g.CL(X[F++]);
            F++;
          }
        };
        return Q;
      }
      throw Error("Not implemented");
    },
    L$Z = function (X, F, Q) {
      if (g.$N(X)) g.mS(X, F, Q);
      else
        for (X = PSZ(X); ; ) {
          const { done: n, value: I } = X.next();
          if (n) break;
          F.call(Q, I, void 0, X);
        }
    },
    n6 = function (X) {
      g.QA(
        X,
        "zx",
        Math.floor(Math.random() * 2147483648).toString(36) +
          Math.abs(Math.floor(Math.random() * 2147483648) ^ g.Su()).toString(36)
      );
      return X;
    },
    IL = function (X, F, Q) {
      Array.isArray(Q) || (Q = [String(Q)]);
      g.NB(X.Y, F, Q);
    },
    u3s = function (X, F) {
      const Q = [];
      L$Z(
        F,
        function (n) {
          let I;
          try {
            I = g.i7.prototype.Xf.call(this, n, !0);
          } catch (Z) {
            if (Z == "Storage: Invalid value was encountered") return;
            throw Z;
          }
          I === void 0 ? Q.push(n) : g.hL(I) && Q.push(n);
        },
        X
      );
      return Q;
    },
    dC3 = function (X, F) {
      u3s(X, F).forEach(function (Q) {
        g.i7.prototype.remove.call(this, Q);
      }, X);
    },
    M$H = function (X) {
      if (X.A$) {
        if (X.A$.locationOverrideToken)
          return { locationOverrideToken: X.A$.locationOverrideToken };
        if (X.A$.latitudeE7 != null && X.A$.longitudeE7 != null)
          return { latitudeE7: X.A$.latitudeE7, longitudeE7: X.A$.longitudeE7 };
      }
      return null;
    },
    B5y = function (X, F) {
      g.o3(X, F) || X.push(F);
    },
    Zk = function (X) {
      let F = 0;
      for (const Q in X) F++;
      return F;
    },
    boM = function (X) {
      try {
        return g.go.JSON.parse(X);
      } catch (F) {}
      X = String(X);
      if (
        /^\s*$/.test(X)
          ? 0
          : /^[\],:{}\s\u2028\u2029]*$/.test(
              X.replace(/\\["\\\/bfnrtu]/g, "@")
                .replace(
                  /(?:"[^"\\\n\r\u2028\u2029\x00-\x08\x0a-\x1f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)[\s\u2028\u2029]*(?=:|,|]|}|$)/g,
                  "]"
                )
                .replace(/(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g, "")
            )
      )
        try {
          return eval("(" + X + ")");
        } catch (F) {}
      throw Error("Invalid JSON string: " + X);
    },
    q5 = function (X) {
      if (g.go.JSON)
        try {
          return g.go.JSON.parse(X);
        } catch (F) {}
      return boM(X);
    },
    s8$ = function (X, F, Q, n) {
      const I = new g.da(null);
      X && g.ML(I, X);
      F && g.Bo(I, F);
      Q && g.b2(I, Q);
      n && (I.U = n);
      return I;
    },
    XZs = function (X, F) {
      return new g.ouN(X, F);
    },
    N5 = function (X, F) {
      return Object.prototype.hasOwnProperty.call(X, F);
    },
    F0x = function (X, F) {
      return X === F;
    },
    Ax = function (X, F) {
      this.U = {};
      this.W = [];
      this.RZ = this.size = 0;
      var Q = arguments.length;
      if (Q > 1) {
        if (Q % 2) throw Error("Uneven number of arguments");
        for (var n = 0; n < Q; n += 2) this.set(arguments[n], arguments[n + 1]);
      } else if (X)
        if (X instanceof Ax)
          for (Q = X.Bo(), n = 0; n < Q.length; n++)
            this.set(Q[n], X.get(Q[n]));
        else for (n in X) this.set(n, X[n]);
    },
    RL = function (X) {
      if (X.size != X.W.length) {
        for (var F = 0, Q = 0; F < X.W.length; ) {
          var n = X.W[F];
          N5(X.U, n) && (X.W[Q++] = n);
          F++;
        }
        X.W.length = Q;
      }
      if (X.size != X.W.length) {
        F = {};
        for (n = Q = 0; Q < X.W.length; ) {
          const I = X.W[Q];
          N5(F, I) || ((X.W[n++] = I), (F[I] = 1));
          Q++;
        }
        X.W.length = n;
      }
    },
    Og = function (X) {
      this.name = this.id = "";
      this.clientName = "UNKNOWN_INTERFACE";
      this.app = "";
      this.type = "REMOTE_CONTROL";
      this.ownerObfuscatedGaiaId =
        this.obfuscatedGaiaId =
        this.avatar =
        this.username =
          "";
      this.capabilities = new Set();
      this.compatibleSenderThemes = new Set();
      this.experiments = new Set();
      this.theme = "u";
      new Ax();
      this.model = this.brand = "";
      this.year = 0;
      this.chipset = this.osVersion = this.os = "";
      this.mdxDialServerType = "MDX_DIAL_SERVER_TYPE_UNKNOWN";
      X &&
        ((this.id = X.id || X.name),
        (this.name = X.name),
        (this.clientName = X.clientName
          ? X.clientName.toUpperCase()
          : "UNKNOWN_INTERFACE"),
        (this.app = X.app),
        (this.type = X.type || "REMOTE_CONTROL"),
        (this.username = X.user || ""),
        (this.avatar = X.userAvatarUri || ""),
        (this.obfuscatedGaiaId = X.obfuscatedGaiaId || ""),
        (this.ownerObfuscatedGaiaId = X.ownerObfuscatedGaiaId || ""),
        (this.theme = X.theme || "u"),
        oL3(this, X.capabilities || ""),
        QiZ(this, X.compatibleSenderThemes || ""),
        nLe(this, X.experiments || ""),
        (this.brand = X.brand || ""),
        (this.model = X.model || ""),
        (this.year = X.year || 0),
        (this.os = X.os || ""),
        (this.osVersion = X.osVersion || ""),
        (this.chipset = X.chipset || ""),
        (this.mdxDialServerType =
          X.mdxDialServerType || "MDX_DIAL_SERVER_TYPE_UNKNOWN"),
        (X = X.deviceInfo)) &&
        ((X = JSON.parse(X)),
        (this.brand = X.brand || ""),
        (this.model = X.model || ""),
        (this.year = X.year || 0),
        (this.os = X.os || ""),
        (this.osVersion = X.osVersion || ""),
        (this.chipset = X.chipset || ""),
        (this.clientName = X.clientName
          ? X.clientName.toUpperCase()
          : "UNKNOWN_INTERFACE"),
        (this.mdxDialServerType =
          X.mdxDialServerType || "MDX_DIAL_SERVER_TYPE_UNKNOWN"));
    },
    oL3 = function (X, F) {
      X.capabilities.clear();
      g.JD(F.split(","), g.yu(j8Z, In3)).forEach((Q) => {
        X.capabilities.add(Q);
      });
    },
    QiZ = function (X, F) {
      X.compatibleSenderThemes.clear();
      g.JD(F.split(","), g.yu(j8Z, ZeT)).forEach((Q) => {
        X.compatibleSenderThemes.add(Q);
      });
    },
    nLe = function (X, F) {
      X.experiments.clear();
      F.split(",").forEach((Q) => {
        X.experiments.add(Q);
      });
    },
    W0 = function (X) {
      X = X || {};
      this.name = X.name || "";
      this.id = X.id || X.screenId || "";
      this.token = X.token || X.loungeToken || "";
      this.uuid = X.uuid || X.dialId || "";
      this.idType = X.screenIdType || "normal";
      this.secret = X.screenIdSecret || "";
    },
    VH = function (X, F) {
      return !!F && (X.id == F || X.uuid == F);
    },
    qd3 = function (X) {
      return {
        name: X.name,
        screenId: X.id,
        loungeToken: X.token,
        dialId: X.uuid,
        screenIdType: X.idType,
        screenIdSecret: X.secret,
      };
    },
    NPZ = function (X) {
      return new W0(X);
    },
    AIx = function (X) {
      return Array.isArray(X) ? g.ju(X, NPZ) : [];
    },
    Ug = function (X) {
      return X
        ? `{name:"${X.name}",id:${X.id.substr(0, 6)}..,token:${
            X.token ? ".." + X.token.slice(-6) : "-"
          },uuid:${X.uuid ? ".." + X.uuid.slice(-6) : "-"},idType:${
            X.idType
          },secret:${X.secret ? ".." + X.secret.slice(-6) : "-"}}`
        : "null";
    },
    Eg = function (X) {
      return Array.isArray(X) ? "[" + g.ju(X, Ug).join(",") + "]" : "null";
    },
    gz = function () {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (X) {
          const F = (Math.random() * 16) | 0;
          return (X == "x" ? F : (F & 3) | 8).toString(16);
        }
      );
    },
    Rye = function (X) {
      return g.ju(X, function (F) {
        return { key: F.id, name: F.name };
      });
    },
    v0 = function (X, F) {
      return g.s4(X, function (Q) {
        return Q || F ? (!Q != !F ? !1 : Q.id == F.id) : !0;
      });
    },
    c0 = function (X, F) {
      return g.s4(X, function (Q) {
        return VH(Q, F);
      });
    },
    Oez = function () {
      const X = g.Xi.WW();
      X && dC3(X, X.ZA.QI(!0));
    },
    em = function () {
      const X = g.o9("yt-remote-connected-devices") || [];
      g.$Z(X);
      return X;
    },
    W0h = function (X) {
      if (X.length == 0) return [];
      const F = X[0].indexOf("#"),
        Q = F == -1 ? X[0] : X[0].substring(0, F);
      return g.ju(X, function (n, I) {
        return I == 0 ? n : n.substring(Q.length);
      });
    },
    V2s = function (X) {
      g.Fi("yt-remote-connected-devices", X, 86400);
    },
    p6 = function () {
      if (Ts) return Ts;
      let X = g.o9("yt-remote-device-id");
      X || ((X = gz()), g.Fi("yt-remote-device-id", X, 31536e3));
      const F = em();
      let Q = 1,
        n = X;
      for (; g.o3(F, n); ) Q++, (n = X + "#" + Q);
      return (Ts = n);
    },
    $Y = function () {
      let X = em();
      const F = p6();
      g.nZ() && g.te(X, F);
      X = W0h(X);
      if (X.length == 0)
        try {
          g.NE("remote_sid");
        } catch (Q) {}
      else
        try {
          g.Zu("remote_sid", X.join(","), -1);
        } catch (Q) {}
    },
    UV3 = function () {
      return g.o9("yt-remote-session-browser-channel");
    },
    ELM = function () {
      return g.o9("yt-remote-local-screens") || [];
    },
    gLH = function () {
      g.Fi("yt-remote-lounge-token-expiration", !0, 86400);
    },
    vLy = function (X) {
      X.length > 5 && (X = X.slice(X.length - 5));
      const F = g.ju(ELM(), function (n) {
          return n.loungeToken;
        }),
        Q = g.ju(X, function (n) {
          return n.loungeToken;
        });
      g.BP(Q, function (n) {
        return !g.o3(F, n);
      }) && gLH();
      g.Fi("yt-remote-local-screens", X, 31536e3);
    },
    f6 = function (X) {
      X ||
        (g.QZ("yt-remote-session-screen-id"),
        g.QZ("yt-remote-session-video-id"));
      $Y();
      X = em();
      g.qz(X, p6());
      V2s(X);
    },
    cIS = function () {
      if (!tx) {
        const X = g.jO();
        X && (tx = new g.kd(X));
      }
    },
    eyS = function () {
      cIS();
      return tx ? !!tx.get("yt-remote-use-staging-server") : !1;
    },
    C6 = function (X, F) {
      g.dO[X] = !0;
      const Q = g.L_();
      Q && Q.publish.apply(Q, arguments);
      g.dO[X] = !1;
    },
    zs = function () {
      let X = window.navigator.userAgent.match(/Chrome\/([0-9]+)/);
      return X ? parseInt(X[1], 10) : 0;
    },
    TPV = function (X) {
      return (
        !!document.currentScript &&
        (document.currentScript.src.indexOf("?" + X) != -1 ||
          document.currentScript.src.indexOf("&" + X) != -1)
      );
    },
    pZT = function () {
      return typeof window.__onGCastApiAvailable == "function"
        ? window.__onGCastApiAvailable
        : null;
    },
    lL = function (X) {
      X.length
        ? $Vx(X.shift(), function () {
            lL(X);
          })
        : yH();
    },
    yH = function () {
      let X = pZT();
      X && X(!1, "No cast extension found");
    },
    $Vx = function (X, F, Q) {
      let n = document.createElement("script");
      n.onerror = F;
      Q && (n.onload = Q);
      g.bn(n, g.nV(X));
      (document.head || document.documentElement).appendChild(n);
    },
    fnS = function (X) {
      return "chrome-extension://" + X + "/cast_sender.js";
    },
    t2M = function () {
      const X = zs(),
        F = [];
      if (X > 1) {
        const Q = X - 1;
        F.push("//www.gstatic.com/eureka/clank/" + X + "/cast_sender.js");
        F.push("//www.gstatic.com/eureka/clank/" + Q + "/cast_sender.js");
      }
      return F;
    },
    Sm = function () {
      if (Cpx) {
        var X = 2,
          F = pZT(),
          Q = function () {
            X--;
            X == 0 && F && F(!0);
          };
        window.__onGCastApiAvailable = Q;
        $Vx(
          "//www.gstatic.com/cast/sdk/libs/sender/1.0/cast_framework.js",
          yH,
          Q
        );
      }
    },
    zyh = function () {
      Sm();
      let X = t2M();
      X.push("//www.gstatic.com/eureka/clank/cast_sender.js");
      lL(X);
    },
    yI$ = function () {
      Sm();
      let X = t2M();
      X.push(...lnB.map(fnS));
      X.push("//www.gstatic.com/eureka/clank/cast_sender.js");
      lL(X);
    },
    K6 = function (X, F, Q) {
      g.ZS.call(this);
      this.K = Q != null ? (0, g.la)(X, Q) : X;
      this.lZ = F;
      this.B = (0, g.la)(this.jk, this);
      this.W = !1;
      this.U = 0;
      this.A = this.xJ = null;
      this.Y = [];
    },
    kY = function () {
      this.W = g.Su();
    },
    Sd$ = function () {
      aL || (aL = new kY());
    },
    K0$ = function () {
      aL || (aL = new kY());
    },
    Dk = function () {
      g.qU.call(this, "p");
    },
    YY = function () {
      g.qU.call(this, "o");
    },
    Gs = function () {
      return (kBM = kBM || new g.lm());
    },
    anz = function (X) {
      g.qU.call(this, "serverreachability", X);
    },
    hx = function (X) {
      const F = Gs();
      F.dispatchEvent(new anz(F, X));
    },
    DVz = function (X) {
      g.qU.call(this, "statevent", X);
    },
    iL = function (X) {
      const F = Gs();
      F.dispatchEvent(new DVz(F, X));
    },
    YdT = function (X, F, Q, n) {
      g.qU.call(this, "timingevent", X);
      this.size = F;
      this.rtt = Q;
      this.retries = n;
    },
    rz = function (X, F) {
      if (typeof X !== "function")
        throw Error("Fn must not be null and must be a function");
      return g.go.setTimeout(function () {
        X();
      }, F);
    },
    xY = function () {},
    wz = function (X, F, Q, n) {
      this.A = X;
      this.Y = F;
      this.A$ = Q;
      this.QH = n || 1;
      this.rV = new g.Oo(this);
      this.FX = 45e3;
      this.vS = null;
      this.K = !1;
      this.J = this.Sx = this.G = this.sH = this.HS = this.jx = this.iT = null;
      this.D = [];
      this.W = null;
      this.X = 0;
      this.B = this.Aj = null;
      this.cS = -1;
      this.NS = !1;
      this.CF = 0;
      this.VH = null;
      this.ai = this.XX = this.lT = this.Yb = !1;
      this.U = new GBD();
    },
    GBD = function () {
      this.A = null;
      this.W = "";
      this.U = !1;
    },
    H0 = function (X, F, Q) {
      X.sH = 1;
      X.G = n6(F.clone());
      X.J = Q;
      X.Yb = !0;
      hye(X, null);
    },
    hye = function (X, F) {
      X.HS = Date.now();
      mU(X);
      X.Sx = X.G.clone();
      IL(X.Sx, "t", X.QH);
      X.X = 0;
      const Q = X.A.XX;
      X.U = new GBD();
      X.W = iez(X.A, Q ? F : null, !X.J);
      X.CF > 0 && (X.VH = new g.ce((0, g.la)(X.vt, X, X.W), X.CF));
      X.rV.listen(X.W, "readystatechange", X.fP);
      F = X.vS ? g.jV(X.vS) : {};
      X.J
        ? (X.Aj || (X.Aj = "POST"),
          (F["Content-Type"] = "application/x-www-form-urlencoded"),
          X.W.send(X.Sx, X.Aj, X.J, F))
        : ((X.Aj = "GET"), X.W.send(X.Sx, X.Aj, null, F));
      hx(1);
    },
    xVe = function (X) {
      if (!rIh(X)) return g.iF(X.W);
      const F = g.rc(X.W);
      if (F === "") return "";
      let Q = "";
      const n = F.length,
        I = g.Yj(X.W) == 4;
      if (!X.U.A) {
        if (typeof TextDecoder === "undefined") return Jx(X), jm(X), "";
        X.U.A = new g.go.TextDecoder();
      }
      for (let Z = 0; Z < n; Z++)
        (X.U.U = !0), (Q += X.U.A.decode(F[Z], { stream: !(I && Z == n - 1) }));
      F.length = 0;
      X.U.W += Q;
      X.X = 0;
      return X.U.W;
    },
    rIh = function (X) {
      return X.W ? X.Aj == "GET" && X.sH != 2 && X.A.SY : !1;
    },
    HeV = function (X, F) {
      var Q = X.X,
        n = F.indexOf("\n", Q);
      if (n == -1) return P0;
      Q = Number(F.substring(Q, n));
      if (isNaN(Q)) return wZ3;
      n += 1;
      if (n + Q > F.length) return P0;
      F = F.slice(n, n + Q);
      X.X = n + Q;
      return F;
    },
    mU = function (X) {
      X.jx = Date.now() + X.FX;
      mVy(X, X.FX);
    },
    mVy = function (X, F) {
      if (X.iT != null) throw Error("WatchDog timer not null");
      X.iT = rz((0, g.la)(X.pP, X), F);
    },
    L6 = function (X) {
      X.iT && (g.go.clearTimeout(X.iT), (X.iT = null));
    },
    jm = function (X) {
      X.A.ZP() || X.NS || JID(X.A, X);
    },
    Jx = function (X) {
      L6(X);
      g.nL(X.VH);
      X.VH = null;
      X.rV.removeAll();
      if (X.W) {
        const F = X.W;
        X.W = null;
        F.abort();
        F.dispose();
      }
    },
    oW = function (X, F) {
      try {
        var Q = X.A;
        if (Q.kc != 0 && (Q.W == X || uL(Q.U, X)))
          if (!X.XX && uL(Q.U, X) && Q.kc == 3) {
            try {
              var n = Q.mG.W.parse(F);
            } catch (R) {
              n = null;
            }
            if (Array.isArray(n) && n.length == 3) {
              var I = n;
              if (I[0] == 0)
                a: {
                  if (!Q.G) {
                    if (Q.W)
                      if (Q.W.HS + 3e3 < X.HS) dz(Q), M5(Q);
                      else break a;
                    B0(Q);
                    iL(18);
                  }
                }
              else
                (Q.tD = I[1]),
                  0 < Q.tD - Q.sH &&
                    I[2] < 37500 &&
                    Q.VH &&
                    Q.D == 0 &&
                    !Q.iT &&
                    (Q.iT = rz((0, g.la)(Q.T4, Q), 6e3));
              if (bL(Q.U) <= 1 && Q.cS) {
                try {
                  Q.cS();
                } catch (R) {}
                Q.cS = void 0;
              }
            } else sg(Q, 11);
          } else if (((X.XX || Q.W == X) && dz(Q), !g.ol(F)))
            for (I = Q.mG.W.parse(F), F = 0; F < I.length; F++) {
              let R = I[F];
              const O = R[0];
              if (!(O <= Q.sH))
                if (((Q.sH = O), (R = R[1]), Q.kc == 2))
                  if (R[0] == "c") {
                    Q.Y = R[1];
                    Q.A$ = R[2];
                    const W = R[3];
                    W != null && (Q.KU = W);
                    const V = R[5];
                    V != null &&
                      typeof V === "number" &&
                      V > 0 &&
                      (Q.CF = 1.5 * V);
                    n = Q;
                    const U = X.pf();
                    if (U) {
                      const c = g.wc(U, "X-Client-Wire-Protocol");
                      if (c) {
                        var Z = n.U;
                        !Z.W &&
                          (g.Q5(c, "spdy") ||
                            g.Q5(c, "quic") ||
                            g.Q5(c, "h2")) &&
                          ((Z.Y = Z.B),
                          (Z.W = new Set()),
                          Z.U && (Xq(Z, Z.U), (Z.U = null)));
                      }
                      if (n.Yb) {
                        const C = g.wc(U, "X-HTTP-Session-Id");
                        C && ((n.JP = C), g.QA(n.vS, n.Yb, C));
                      }
                    }
                    Q.kc = 3;
                    Q.B && Q.B.GQ();
                    Q.EA && (Q.MQ = Date.now() - X.HS);
                    n = Q;
                    var q = X;
                    n.J$ = jiV(n, n.XX ? n.A$ : null, n.FJ);
                    if (q.XX) {
                      Pph(n.U, q);
                      var N = q,
                        A = n.CF;
                      A && N.setTimeout(A);
                      N.iT && (L6(N), mU(N));
                      n.W = q;
                    } else L0e(n);
                    Q.A.length > 0 && Fq(Q);
                  } else (R[0] != "stop" && R[0] != "close") || sg(Q, 7);
                else
                  Q.kc == 3 &&
                    (R[0] == "stop" || R[0] == "close"
                      ? R[0] == "stop"
                        ? sg(Q, 7)
                        : Q.disconnect()
                      : R[0] != "noop" && Q.B && Q.B.EW(R),
                    (Q.D = 0));
            }
        hx(4);
      } catch (R) {}
    },
    uSB = function (X) {
      this.B = X || 10;
      g.go.PerformanceNavigationTiming
        ? ((X = g.go.performance.getEntriesByType("navigation")),
          (X =
            X.length > 0 &&
            (X[0].nextHopProtocol == "hq" || X[0].nextHopProtocol == "h2")))
        : (X = !!(
            g.go.chrome &&
            g.go.chrome.loadTimes &&
            g.go.chrome.loadTimes() &&
            g.go.chrome.loadTimes().wasFetchedViaSpdy
          ));
      this.Y = X ? this.B : 1;
      this.W = null;
      this.Y > 1 && (this.W = new Set());
      this.U = null;
      this.A = [];
    },
    dVy = function (X) {
      return X.U ? !0 : X.W ? X.W.size >= X.Y : !1;
    },
    bL = function (X) {
      return X.U ? 1 : X.W ? X.W.size : 0;
    },
    uL = function (X, F) {
      return X.U ? X.U == F : X.W ? X.W.has(F) : !1;
    },
    Xq = function (X, F) {
      X.W ? X.W.add(F) : (X.U = F);
    },
    Pph = function (X, F) {
      X.U && X.U == F ? (X.U = null) : X.W && X.W.has(F) && X.W.delete(F);
    },
    Qc = function (X) {
      if (X.U != null) return X.A.concat(X.U.D);
      if (X.W != null && X.W.size !== 0) {
        let F = X.A;
        for (const Q of X.W.values()) F = F.concat(Q.D);
        return F;
      }
      return g.R3(X.A);
    },
    M2y = function (X, F) {
      const Q = new xY();
      if (g.go.Image) {
        const n = new Image();
        n.onload = g.yu(nC, Q, "TestLoadImage: loaded", !0, F, n);
        n.onerror = g.yu(nC, Q, "TestLoadImage: error", !1, F, n);
        n.onabort = g.yu(nC, Q, "TestLoadImage: abort", !1, F, n);
        n.ontimeout = g.yu(nC, Q, "TestLoadImage: timeout", !1, F, n);
        g.go.setTimeout(function () {
          if (n.ontimeout) n.ontimeout();
        }, 1e4);
        n.src = X;
      } else F(!1);
    },
    BPy = function (X, F) {
      const Q = new xY(),
        n = new AbortController(),
        I = setTimeout(() => {
          n.abort();
          nC(Q, "TestPingServer: timeout", !1, F);
        }, 1e4);
      fetch(X, { signal: n.signal })
        .then((Z) => {
          clearTimeout(I);
          Z.ok
            ? nC(Q, "TestPingServer: ok", !0, F)
            : nC(Q, "TestPingServer: server error", !1, F);
        })
        .catch(() => {
          clearTimeout(I);
          nC(Q, "TestPingServer: error", !1, F);
        });
    },
    nC = function (X, F, Q, n, I) {
      try {
        I &&
          ((I.onload = null),
          (I.onerror = null),
          (I.onabort = null),
          (I.ontimeout = null)),
          n(Q);
      } catch (Z) {}
    },
    be$ = function () {
      this.W = new IW();
    },
    ZE = function (X, F, Q) {
      return Q && Q.YY ? Q.YY[X] || F : F;
    },
    si$ = function (X) {
      this.A = [];
      this.A$ =
        this.J$ =
        this.vS =
        this.FJ =
        this.W =
        this.JP =
        this.Yb =
        this.NS =
        this.X =
        this.lT =
        this.J =
          null;
      this.nN = this.Sx = 0;
      this.Iz = ZE("failFast", !1, X);
      this.VH = this.iT = this.G = this.K = this.B = null;
      this.KC = !0;
      this.tD = this.sH = -1;
      this.QH = this.D = this.HS = 0;
      this.yV = ZE("baseRetryDelayMs", 5e3, X);
      this.dj = ZE("retryDelaySeedMs", 1e4, X);
      this.rK = ZE("forwardChannelMaxRetries", 2, X);
      this.WH = ZE("forwardChannelRequestTimeoutMs", 2e4, X);
      this.Xz = (X && X.rcb) || void 0;
      this.Pr = (X && X.F2S) || void 0;
      this.SY = (X && X.Jc_) || !1;
      this.CF = void 0;
      this.XX = (X && X.KD) || !1;
      this.Y = "";
      this.U = new uSB(X && X.HNS);
      this.wN = Math.min((X && X.Gp_) || 1e3, 1e3);
      this.mG = new be$();
      this.rV = (X && X.C5V) || !1;
      this.jx = (X && X.qeS) || !1;
      this.rV && this.jx && (this.jx = !1);
      this.fN = (X && X.llV) || !1;
      X && X.e8H && (this.KC = !1);
      this.EA = (!this.rV && this.KC && X && X.vkH) || !1;
      this.ul = void 0;
      X && X.HO && X.HO > 0 && (this.ul = X.HO);
      this.cS = void 0;
      this.MQ = 0;
      this.FX = !1;
      this.ai = this.Aj = null;
    },
    M5 = function (X) {
      X.W && (qn(X), X.W.cancel(), (X.W = null));
    },
    XdZ = function (X) {
      M5(X);
      X.G && (g.go.clearTimeout(X.G), (X.G = null));
      dz(X);
      X.U.cancel();
      X.K && (typeof X.K === "number" && g.go.clearTimeout(X.K), (X.K = null));
    },
    Fq = function (X) {
      dVy(X.U) || X.K || ((X.K = !0), g.JX(X.qJ, X), (X.HS = 0));
    },
    ois = function (X, F) {
      if (bL(X.U) >= X.U.Y - (X.K ? 1 : 0)) return !1;
      if (X.K) return (X.A = F.D.concat(X.A)), !0;
      if (X.kc == 1 || X.kc == 2 || X.HS >= (X.Iz ? 0 : X.rK)) return !1;
      X.K = rz((0, g.la)(X.qJ, X, F), Fvs(X, X.HS));
      X.HS++;
      return !0;
    },
    niB = function (X, F) {
      var Q;
      F ? (Q = F.A$) : (Q = X.Sx++);
      const n = X.vS.clone();
      g.QA(n, "SID", X.Y);
      g.QA(n, "RID", Q);
      g.QA(n, "AID", X.sH);
      Nn(X, n);
      X.X && X.J && g.RB(n, X.X, X.J);
      Q = new wz(X, X.Y, Q, X.HS + 1);
      X.X === null && (Q.vS = X.J);
      F && (X.A = F.D.concat(X.A));
      F = Qez(X, Q, X.wN);
      Q.setTimeout(
        Math.round(X.WH * 0.5) + Math.round(X.WH * 0.5 * Math.random())
      );
      Xq(X.U, Q);
      H0(Q, n, F);
    },
    Nn = function (X, F) {
      X.NS &&
        g.zD(X.NS, function (Q, n) {
          g.QA(F, n, Q);
        });
      X.B &&
        g.zD({}, function (Q, n) {
          g.QA(F, n, Q);
        });
    },
    Qez = function (X, F, Q) {
      Q = Math.min(X.A.length, Q);
      const n = X.B ? (0, g.la)(X.B.JF, X.B, X) : null;
      a: {
        var I = X.A;
        let N = -1;
        for (;;) {
          const A = ["count=" + Q];
          N == -1
            ? Q > 0
              ? ((N = I[0].W), A.push("ofs=" + N))
              : (N = 0)
            : A.push("ofs=" + N);
          let R = !0;
          for (let O = 0; O < Q; O++) {
            var Z = I[O].W;
            const W = I[O].map;
            Z -= N;
            if (Z < 0) (N = Math.max(0, I[O].W - 100)), (R = !1);
            else
              try {
                Z = "req" + Z + "_" || "";
                try {
                  var q = W instanceof Map ? W : Object.entries(W);
                  for (const [V, U] of q) {
                    let c = U;
                    g.tD(U) && (c = g.pg(U));
                    A.push(Z + V + "=" + encodeURIComponent(c));
                  }
                } catch (V) {
                  throw (
                    (A.push(Z + "type=" + encodeURIComponent("_badmap")), V)
                  );
                }
              } catch (V) {
                n && n(W);
              }
          }
          if (R) {
            q = A.join("&");
            break a;
          }
        }
        q = void 0;
      }
      X = X.A.splice(0, Q);
      F.D = X;
      return q;
    },
    L0e = function (X) {
      X.W || X.G || ((X.QH = 1), g.JX(X.LU, X), (X.D = 0));
    },
    B0 = function (X) {
      if (X.W || X.G || X.D >= 3) return !1;
      X.QH++;
      X.G = rz((0, g.la)(X.LU, X), Fvs(X, X.D));
      X.D++;
      return !0;
    },
    qn = function (X) {
      X.Aj != null && (g.go.clearTimeout(X.Aj), (X.Aj = null));
    },
    IiD = function (X) {
      X.W = new wz(X, X.Y, "rpc", X.QH);
      X.X === null && (X.W.vS = X.J);
      X.W.CF = 0;
      var F = X.J$.clone();
      g.QA(F, "RID", "rpc");
      g.QA(F, "SID", X.Y);
      g.QA(F, "AID", X.sH);
      g.QA(F, "CI", X.VH ? "0" : "1");
      !X.VH && X.ul && g.QA(F, "TO", X.ul);
      g.QA(F, "TYPE", "xmlhttp");
      Nn(X, F);
      X.X && X.J && g.RB(F, X.X, X.J);
      X.CF && X.W.setTimeout(X.CF);
      var Q = X.W;
      X = X.A$;
      Q.sH = 1;
      Q.G = n6(F.clone());
      Q.J = null;
      Q.Yb = !0;
      hye(Q, X);
    },
    dz = function (X) {
      X.iT != null && (g.go.clearTimeout(X.iT), (X.iT = null));
    },
    JID = function (X, F) {
      var Q = null;
      if (X.W == F) {
        dz(X);
        qn(X);
        X.W = null;
        var n = 2;
      } else if (uL(X.U, F)) (Q = F.D), Pph(X.U, F), (n = 1);
      else return;
      if (X.kc != 0)
        if (F.K)
          if (n == 1) {
            Q = F.J ? F.J.length : 0;
            F = Date.now() - F.HS;
            var I = X.HS;
            n = Gs();
            n.dispatchEvent(new YdT(n, Q, F, I));
            Fq(X);
          } else L0e(X);
        else {
          var Z = F.cS;
          I = F.getLastError();
          if (
            I == 3 ||
            (I == 0 && Z > 0) ||
            !((n == 1 && ois(X, F)) || (n == 2 && B0(X)))
          )
            switch (
              (Q && Q.length > 0 && ((F = X.U), (F.A = F.A.concat(Q))), I)
            ) {
              case 1:
                sg(X, 5);
                break;
              case 4:
                sg(X, 10);
                break;
              case 3:
                sg(X, 6);
                break;
              default:
                sg(X, 2);
            }
        }
    },
    Fvs = function (X, F) {
      let Q = X.yV + Math.floor(Math.random() * X.dj);
      X.isActive() || (Q *= 2);
      return Q * F;
    },
    sg = function (X, F) {
      if (F == 2) {
        var Q = (0, g.la)(X.Gy, X),
          n = X.Pr;
        const I = !n;
        n = new g.da(n || "//www.google.com/images/cleardot.gif");
        (g.go.location && g.go.location.protocol == "http") || g.ML(n, "https");
        n6(n);
        I ? M2y(n.toString(), Q) : BPy(n.toString(), Q);
      } else iL(2);
      X.kc = 0;
      X.B && X.B.Vm(F);
      ZQB(X);
      XdZ(X);
    },
    ZQB = function (X) {
      X.kc = 0;
      X.ai = [];
      if (X.B) {
        const F = Qc(X.U);
        if (F.length != 0 || X.A.length != 0)
          g.OT(X.ai, F),
            g.OT(X.ai, X.A),
            (X.U.A.length = 0),
            g.R3(X.A),
            (X.A.length = 0);
        X.B.Xr();
      }
    },
    qxM = function (X) {
      if (X.kc == 0) return X.ai;
      let F = [];
      g.OT(F, Qc(X.U));
      g.OT(F, X.A);
      return F;
    },
    jiV = function (X, F, Q) {
      var n = g.nX(Q);
      n.W != ""
        ? (F && g.Bo(n, F + "." + n.W), g.b2(n, n.A))
        : ((n = g.go.location),
          (n = s8$(
            n.protocol,
            F ? F + "." + n.hostname : n.hostname,
            +n.port,
            Q
          )));
      F = X.Yb;
      Q = X.JP;
      F && Q && g.QA(n, F, Q);
      g.QA(n, "VER", X.KU);
      Nn(X, n);
      return n;
    },
    iez = function (X, F, Q) {
      if (F && !X.XX)
        throw Error("Can't create secondary domain capable XhrIo object.");
      F = X.SY && !X.Xz ? new g.y6(new g.mC({ N6: Q })) : new g.y6(X.Xz);
      F.X = X.XX;
      return F;
    },
    NQe = function () {},
    AXs = function () {},
    RW = function (X, F) {
      g.lm.call(this);
      this.W = new si$(F);
      this.K = X;
      this.U = (F && F.Ig) || null;
      X = (F && F.De) || null;
      F &&
        F.iNT &&
        (X
          ? (X["X-Client-Protocol"] = "webchannel")
          : (X = { "X-Client-Protocol": "webchannel" }));
      this.W.J = X;
      X = (F && F.HEH) || null;
      F &&
        F.dW &&
        (X
          ? (X["X-WebChannel-Content-Type"] = F.dW)
          : (X = { "X-WebChannel-Content-Type": F.dW }));
      F &&
        F.CL &&
        (X
          ? (X["X-WebChannel-Client-Profile"] = F.CL)
          : (X = { "X-WebChannel-Client-Profile": F.CL }));
      this.W.lT = X;
      (X = F && F.W2H) && !g.ol(X) && (this.W.X = X);
      this.X = (F && F.KD) || !1;
      this.B = (F && F.Bfb) || !1;
      (F = F && F.Wn) &&
        !g.ol(F) &&
        ((this.W.Yb = F),
        g.GD(this.U, F) && ((X = this.U), F in X && delete X[F]));
      this.A = new Ab(this);
    },
    RGV = function (X) {
      Dk.call(this);
      X.__headers__ &&
        ((this.headers = X.__headers__),
        (this.statusCode = X.__status__),
        delete X.__headers__,
        delete X.__status__);
      const F = X.__sm__;
      F
        ? (this.data = (this.W = g.kZ(F)) ? g.my(F, this.W) : F)
        : (this.data = X);
    },
    OQ3 = function (X) {
      YY.call(this);
      this.status = 1;
      this.errorCode = X;
    },
    Ab = function (X) {
      this.W = X;
    },
    OR = function (X, F) {
      this.Y = X;
      this.W = F;
    },
    WT = function (X, F) {
      if (typeof X !== "function")
        throw Error("Fn must not be null and must be a function");
      return g.go.setTimeout(function () {
        X();
      }, F);
    },
    UR = function () {
      Vc.dispatchEvent(new Wv$());
    },
    ER = function (X, F, Q, n) {
      this.W = X;
      this.Y = F;
      this.X = Q;
      this.K = n || 1;
      this.U = 45e3;
      this.A = new g.Oo(this);
      this.B = new g.Q6();
      this.B.setInterval(250);
    },
    UUD = function (X, F, Q) {
      X.mz = 1;
      X.wR = n6(F.clone());
      X.yR = Q;
      X.Yb = !0;
      V5M(X, null);
    },
    gV = function (X, F, Q, n, I) {
      X.mz = 1;
      X.wR = n6(F.clone());
      X.yR = null;
      X.Yb = Q;
      I && (X.jh = !1);
      V5M(X, n);
    },
    V5M = function (X, F) {
      X.y0 = Date.now();
      vT(X);
      X.ST = X.wR.clone();
      IL(X.ST, "t", X.K);
      X.Fb = 0;
      X.E1 = X.W.Zm(X.W.ow() ? F : null);
      X.zE > 0 && (X.MO = new g.ce((0, g.la)(X.Rx, X, X.E1), X.zE));
      X.A.listen(X.E1, "readystatechange", X.ud);
      F = X.xR ? g.jV(X.xR) : {};
      X.yR
        ? ((X.z7 = "POST"),
          (F["Content-Type"] = "application/x-www-form-urlencoded"),
          X.E1.send(X.ST, X.z7, X.yR, F))
        : ((X.z7 = "GET"),
          X.jh && !g.Xu && (F.Connection = "close"),
          X.E1.send(X.ST, X.z7, null, F));
      X.W.XS(1);
    },
    giB = function (X, F) {
      var Q = X.Fb,
        n = F.indexOf("\n", Q);
      if (n == -1) return cT;
      Q = Number(F.substring(Q, n));
      if (isNaN(Q)) return EiH;
      n += 1;
      if (n + Q > F.length) return cT;
      F = F.slice(n, n + Q);
      X.Fb = n + Q;
      return F;
    },
    vT = function (X) {
      X.Fa = Date.now() + X.U;
      vi$(X, X.U);
    },
    vi$ = function (X, F) {
      if (X.Ad != null) throw Error("WatchDog timer not null");
      X.Ad = WT((0, g.la)(X.rL, X), F);
    },
    cX3 = function (X) {
      X.Ad && (g.go.clearTimeout(X.Ad), (X.Ad = null));
    },
    ea = function (X) {
      X.W.ZP() || X.eA || X.W.wX(X);
    },
    Tx = function (X) {
      cX3(X);
      g.nL(X.MO);
      X.MO = null;
      X.B.stop();
      X.A.removeAll();
      if (X.E1) {
        const F = X.E1;
        X.E1 = null;
        F.abort();
        F.dispose();
      }
      X.x_ && (X.x_ = null);
    },
    eGs = function (X, F) {
      try {
        X.W.MJ(X, F), X.W.XS(4);
      } catch (Q) {}
    },
    pdT = function (X, F, Q, n, I) {
      if (n == 0) Q(!1);
      else {
        var Z = I || 0;
        n--;
        TQx(X, F, function (q) {
          q
            ? Q(!0)
            : g.go.setTimeout(function () {
                pdT(X, F, Q, n, Z);
              }, Z);
        });
      }
    },
    TQx = function (X, F, Q) {
      const n = new Image();
      n.onload = function () {
        try {
          pC(n), Q(!0);
        } catch (I) {}
      };
      n.onerror = function () {
        try {
          pC(n), Q(!1);
        } catch (I) {}
      };
      n.onabort = function () {
        try {
          pC(n), Q(!1);
        } catch (I) {}
      };
      n.ontimeout = function () {
        try {
          pC(n), Q(!1);
        } catch (I) {}
      };
      g.go.setTimeout(function () {
        if (n.ontimeout) n.ontimeout();
      }, F);
      n.src = X;
    },
    pC = function (X) {
      X.onload = null;
      X.onerror = null;
      X.onabort = null;
      X.ontimeout = null;
    },
    $Ux = function (X) {
      this.W = X;
      this.U = new IW();
    },
    fis = function (X) {
      const F = $m(X.W, X.Uv, "/mail/images/cleardot.gif");
      n6(F);
      pdT(F.toString(), 5e3, (0, g.la)(X.BF, X), 3, 2e3);
      X.XS(1);
    },
    tb = function (X) {
      var F = X.W.K;
      F != null
        ? (UR(), F ? (UR(), fC(X.W, X, !1)) : (UR(), fC(X.W, X, !0)))
        : ((X.Un = new ER(X)),
          (X.Un.xR = X.Cv),
          (F = X.W),
          (F = $m(F, F.ow() ? X.ZC : null, X.xm)),
          UR(),
          IL(F, "TYPE", "xmlhttp"),
          gV(X.Un, F, !1, X.ZC, !1));
    },
    CC = function (X, F, Q) {
      this.W = 1;
      this.U = [];
      this.A = [];
      this.B = new IW();
      this.J = X || null;
      this.K = F != null ? F : null;
      this.G = Q || !1;
    },
    t5z = function (X, F) {
      this.W = X;
      this.map = F;
      this.context = null;
    },
    Cmz = function (X, F, Q, n) {
      g.qU.call(this, "timingevent", X);
      this.size = F;
      this.rtt = Q;
      this.retries = n;
    },
    zGH = function (X) {
      g.qU.call(this, "serverreachability", X);
    },
    liH = function (X) {
      X.cX(1, 0);
      X.Cc = $m(X, null, X.jc);
      zx(X);
    },
    yXx = function (X) {
      X.e3 && (X.e3.abort(), (X.e3 = null));
      X.Tp && (X.Tp.cancel(), (X.Tp = null));
      X.Vr && (g.go.clearTimeout(X.Vr), (X.Vr = null));
      ld(X);
      X.vQ && (X.vQ.cancel(), (X.vQ = null));
      X.K2 && (g.go.clearTimeout(X.K2), (X.K2 = null));
    },
    yc = function (X, F) {
      if (X.W == 0)
        throw Error("Invalid operation: sending map when state is closed");
      X.U.push(new t5z(X.PX++, F));
      (X.W != 2 && X.W != 3) || zx(X);
    },
    Sxz = function (X) {
      let F = 0;
      X.Tp && F++;
      X.vQ && F++;
      return F;
    },
    zx = function (X) {
      X.vQ || X.K2 || ((X.K2 = WT((0, g.la)(X.Fr, X), 0)), (X.YF = 0));
    },
    kUe = function (X, F) {
      if (X.W == 1) {
        if (!F) {
          X.pX = Math.floor(Math.random() * 1e5);
          F = X.pX++;
          const Q = new ER(X, "", F);
          Q.xR = X.II;
          const n = Sa(X),
            I = X.Cc.clone();
          g.QA(I, "RID", F);
          g.QA(I, "CVER", "1");
          KC(X, I);
          UUD(Q, I, n);
          X.vQ = Q;
          X.W = 2;
        }
      } else X.W == 3 && (F ? Kvs(X, F) : X.U.length == 0 || X.vQ || Kvs(X));
    },
    Kvs = function (X, F) {
      if (F)
        if (X.oZ > 6) {
          X.U = X.A.concat(X.U);
          X.A.length = 0;
          var Q = X.pX - 1;
          F = Sa(X);
        } else (Q = F.X), (F = F.yR);
      else (Q = X.pX++), (F = Sa(X));
      const n = X.Cc.clone();
      g.QA(n, "SID", X.Y);
      g.QA(n, "RID", Q);
      g.QA(n, "AID", X.B$);
      KC(X, n);
      Q = new ER(X, X.Y, Q, X.YF + 1);
      Q.xR = X.II;
      Q.setTimeout(1e4 + Math.round(1e4 * Math.random()));
      X.vQ = Q;
      UUD(Q, n, F);
    },
    KC = function (X, F) {
      X.Pl &&
        (X = X.Pl.xs()) &&
        g.zD(X, function (Q, n) {
          g.QA(F, n, Q);
        });
    },
    Sa = function (X) {
      const F = Math.min(X.U.length, 1e3),
        Q = ["count=" + F];
      let n;
      X.oZ > 6 && F > 0 ? ((n = X.U[0].W), Q.push("ofs=" + n)) : (n = 0);
      for (let I = 0; I < F; I++) {
        let Z = X.U[I].W;
        const q = X.U[I].map;
        Z = X.oZ <= 6 ? I : Z - n;
        try {
          g.zD(q, function (N, A) {
            Q.push("req" + Z + "_" + A + "=" + encodeURIComponent(N));
          });
        } catch (N) {
          Q.push("req" + Z + "_type=" + encodeURIComponent("_badmap"));
        }
      }
      X.A = X.A.concat(X.U.splice(0, F));
      return Q.join("&");
    },
    aix = function (X) {
      X.Tp ||
        X.Vr ||
        ((X.X = 1), (X.Vr = WT((0, g.la)(X.zQ, X), 0)), (X.hd = 0));
    },
    km = function (X) {
      if (X.Tp || X.Vr || X.hd >= 3) return !1;
      X.X++;
      X.Vr = WT((0, g.la)(X.zQ, X), DUe(X, X.hd));
      X.hd++;
      return !0;
    },
    fC = function (X, F, Q) {
      X.bR = X.K == null ? Q : !X.K;
      X.bW = F.XZ;
      X.G || liH(X);
    },
    ld = function (X) {
      X.ji != null && (g.go.clearTimeout(X.ji), (X.ji = null));
    },
    DUe = function (X, F) {
      let Q = 5e3 + Math.floor(Math.random() * 1e4);
      X.isActive() || (Q *= 2);
      return Q * F;
    },
    aW = function (X, F) {
      if (F == 2 || F == 9) {
        var Q = null;
        X.Pl && (Q = null);
        var n = (0, g.la)(X.EK, X);
        Q || ((Q = new g.da("//www.google.com/images/cleardot.gif")), n6(Q));
        TQx(Q.toString(), 1e4, n);
      } else UR();
      Yx$(X, F);
    },
    Yx$ = function (X, F) {
      X.W = 0;
      X.Pl && X.Pl.Zf(F);
      GUh(X);
      yXx(X);
    },
    GUh = function (X) {
      X.W = 0;
      X.bW = -1;
      if (X.Pl)
        if (X.A.length == 0 && X.U.length == 0) X.Pl.pv();
        else {
          const F = g.R3(X.A),
            Q = g.R3(X.U);
          X.A.length = 0;
          X.U.length = 0;
          X.Pl.pv(F, Q);
        }
    },
    $m = function (X, F, Q) {
      let n = g.nX(Q);
      if (n.W != "") F && g.Bo(n, F + "." + n.W), g.b2(n, n.A);
      else {
        const I = window.location;
        n = s8$(I.protocol, F ? F + "." + I.hostname : I.hostname, +I.port, Q);
      }
      X.jA &&
        g.zD(X.jA, function (I, Z) {
          g.QA(n, Z, I);
        });
      g.QA(n, "VER", X.oZ);
      KC(X, n);
      return n;
    },
    hGT = function () {},
    iQZ = function () {
      this.W = [];
      this.U = [];
    },
    rX3 = function (X, F) {
      this.action = X;
      this.params = F || {};
    },
    DE = function (X, F) {
      g.ZS.call(this);
      this.W = new g.b1(this.Is, 0, this);
      g.z(this, this.W);
      this.lZ = 5e3;
      this.retryCount = this.Um = 0;
      if (typeof X === "function") F && (X = (0, g.la)(X, F));
      else if (X && typeof X.handleEvent === "function")
        X = (0, g.la)(X.handleEvent, X);
      else throw Error("Invalid listener argument");
      this.U = X;
    },
    Ym = function (
      X,
      F,
      Q = !1,
      n = () => "",
      I = !1,
      Z = !1,
      q = !1,
      N = () => g.wQ({}),
      A = !1,
      R,
      O
    ) {
      this.XX = X;
      this.HS = F;
      this.X = new g.Kx();
      this.K = O;
      this.U = (this.A = !!R)
        ? R(() => {
            this.s2();
          })
        : new DE(this.s2, this);
      this.W = null;
      this.J = !1;
      this.D = null;
      this.Yb = "";
      this.Aj = this.iT = 0;
      this.Y = [];
      this.cS = Q;
      this.vS = n;
      this.G = Z;
      this.sH = N;
      this.lT = q;
      this.NS = null;
      this.B = g.wQ();
      this.ai = I;
      this.rV = A;
      this.FX = new xUS();
      this.VH = new wdh();
      this.jx = new HQT();
      this.CF = new mUT();
      this.Sx = new JXy();
      this.QH = new jes();
      this.A$ = new PmV();
    },
    Lvx = function (X, F, Q, n, I) {
      Gx(X);
      if (X.W) {
        const Z = g.G("ID_TOKEN"),
          q = X.W.II || {};
        Z
          ? (q["x-youtube-identity-token"] = Z)
          : delete q["x-youtube-identity-token"];
        X.W.II = q;
      }
      n
        ? ((n.getState() != 3 && Sxz(n) == 0) || n.getState(),
          X.W.connect(F, Q, X.HS, n.Y, n.B$))
        : I
        ? X.W.connect(F, Q, X.HS, I.sessionId, I.arrayId)
        : X.W.connect(F, Q, X.HS);
      X.A && !X.U.isActive() && X.U.start();
      X.K && X.K.Cax();
    },
    dU$ = function (X, F) {
      return X.rV ? !Object.values(usy).includes(F) : !1;
    },
    M5z = async function (X) {
      try {
        await id(X);
      } finally {
        var F = X.Y;
        X.Y = [];
        var Q = F;
        F = F.length;
        for (let n = 0; n < F; ++n) yc(X.W, Q[n]);
        rV(X);
        rV(X);
      }
    },
    rV = function (X) {
      X.publish("handlerOpened");
      X.FX.W("BROWSER_CHANNEL");
    },
    Gx = function (X) {
      if (X.W) {
        const F = X.vS(),
          Q = X.W.II || {};
        F
          ? (Q["x-youtube-lounge-xsrf-token"] = F)
          : delete Q["x-youtube-lounge-xsrf-token"];
        X.W.II = Q;
      }
    },
    id = function (X) {
      if (!X.lT) return BQT(X);
      X.NS === null && (X.NS = BQT(X));
      return X.NS;
    },
    BQT = function (X) {
      return g.um(
        X.sH()
          .then((F) => {
            if (X.W) {
              let Q = X.W.II || {};
              F && Object.keys(F).length > 0
                ? (Q = { ...Q, ...F })
                : delete Q.Authorization;
              X.W.II = Q;
            }
          })
          .Qh(() => {}),
        () => {
          X.NS = null;
        }
      );
    },
    xm = function (X) {
      this.scheme = "https";
      this.port = this.domain = "";
      this.W = "/api/lounge";
      this.U = !0;
      X = X || document.location.href;
      const F = Number(g.AZ(X)[4] || null) || "";
      F && (this.port = ":" + F);
      this.domain = g.O1(X) || "";
      X = g.qj();
      X.search("MSIE") >= 0 &&
        ((X = X.match(/MSIE ([\d.]+)/)[1]),
        g.Z6(X, "10.0") < 0 && (this.U = !1));
    },
    wV = function (X, F) {
      let Q = X.W;
      X.U && (Q = X.scheme + "://" + X.domain + X.port + X.W);
      return g.p8(Q + F, {});
    },
    bQz = function (X) {
      g.gQ(X.channel, "m", () => {
        X.K = 3;
        X.A.reset();
        X.G = null;
        X.X = 0;
        for (const F of X.D) X.channel && X.channel.send(F);
        X.D = [];
        X.publish("webChannelOpened");
        X.vS.W("WEB_CHANNEL");
      });
      g.gQ(X.channel, "n", () => {
        X.K = 0;
        X.A.isActive() || X.publish("webChannelClosed");
        const F = X.channel?.Y().A();
        F && (X.D = [...F]);
        X.Aj.W("WEB_CHANNEL");
      });
      g.gQ(X.channel, "p", (F) => {
        const Q = F.data;
        Q[0] === "gracefulReconnect"
          ? (X.A.start(), X.channel && X.channel.close())
          : X.publish("webChannelMessage", new rX3(Q[0], Q[1]));
        X.Xh = F.statusCode;
        X.NS.W("WEB_CHANNEL");
      });
      g.gQ(X.channel, "o", () => {
        X.Xh === 401 || X.A.start();
        X.publish("webChannelError");
        X.Yb.W("WEB_CHANNEL", "");
      });
    },
    HT = function (X) {
      const F = X.HS();
      F
        ? (X.Y["x-youtube-lounge-xsrf-token"] = F)
        : delete X.Y["x-youtube-lounge-xsrf-token"];
    },
    ojT = function (X, F, Q = () => "", n, I) {
      const Z = () => new Ym(wV(X, "/bc"), F, !1, Q, n);
      return g.wi("enable_mdx_web_channel_desktop")
        ? new seh(() => new X8Z(wV(X, "/wc"), F, Q))
        : new FHT(Z, I);
    },
    Zgx = function () {
      var X = Q2e;
      njh();
      m1.push(X);
      IqS();
    },
    Jb = function (X, F) {
      njh();
      const Q = qIT(X, String(F));
      m1.length == 0
        ? Ncx(Q)
        : (IqS(),
          g.mS(m1, function (n) {
            n(Q);
          }));
    },
    PT = function (X) {
      Jb("CP", X);
    },
    njh = function () {
      m1 ||
        ((m1 = g.cP("yt.mdx.remote.debug.handlers_") || []),
        g.vP("yt.mdx.remote.debug.handlers_", m1));
    },
    Ncx = function (X) {
      const F = (LC + 1) % 50;
      LC = F;
      ud[F] = X;
      dV || (dV = F == 49);
    },
    IqS = function () {
      var X = m1;
      if (ud[0]) {
        var F = dV ? LC : -1;
        do {
          F = (F + 1) % 50;
          const Q = ud[F];
          g.mS(X, function (n) {
            n(Q);
          });
        } while (F != LC);
        ud = Array(50);
        LC = -1;
        dV = !1;
      }
    },
    qIT = function (X, F) {
      let Q = (Date.now() - AUZ) / 1e3;
      Q.toFixed && (Q = Q.toFixed(3));
      const n = [];
      n.push("[", Q + "s", "] ");
      n.push("[", "yt.mdx.remote", "] ");
      n.push(X + ": " + F, "\n");
      return n.join("");
    },
    Mn = function (X) {
      g.Xx.call(this);
      this.K = X;
      this.screens = [];
    },
    RND = function (X, F) {
      const Q = X.get(F.uuid) || X.get(F.id);
      if (Q)
        return (
          (X = Q.name),
          (Q.id = F.id || Q.id),
          (Q.name = F.name),
          (Q.token = F.token),
          (Q.uuid = F.uuid || Q.uuid),
          Q.name != X
        );
      X.screens.push(F);
      return !0;
    },
    OgZ = function (X, F) {
      let Q = X.screens.length != F.length;
      X.screens = g.JD(X.screens, function (I) {
        return !!v0(F, I);
      });
      const n = F.length;
      for (let I = 0; I < n; I++) Q = RND(X, F[I]) || Q;
      return Q;
    },
    WHy = function (X, F) {
      const Q = X.screens.length;
      X.screens = g.JD(X.screens, function (n) {
        return !(n || F ? (!n != !F ? 0 : n.id == F.id) : 1);
      });
      return X.screens.length < Q;
    },
    bd = function (X) {
      Mn.call(this, "LocalScreenService");
      this.U = X;
      this.W = NaN;
      BT(this);
      this.info("Initializing with " + Eg(this.screens));
    },
    VYs = function (X) {
      if (X.screens.length) {
        const F = g.ju(X.screens, function (n) {
            return n.id;
          }),
          Q = wV(X.U, "/pairing/get_lounge_token_batch");
        X.U.sendRequest(
          "POST",
          Q,
          { screen_ids: F.join(",") },
          (0, g.la)(X.uB, X),
          (0, g.la)(X.J_, X)
        );
      }
    },
    BT = function (X) {
      if (g.wi("deprecate_pair_servlet_enabled")) return OgZ(X, []);
      var F = AIx(ELM());
      F = g.JD(F, function (Q) {
        return !Q.uuid;
      });
      return OgZ(X, F);
    },
    sR = function (X, F) {
      vLy(g.ju(X.screens, qd3));
      F && gLH();
    },
    Xj = function (X) {
      Jb("OnlineScreenService", X);
    },
    Fj = function (X) {
      isNaN(X.A) || g.iB(X.A);
      X.A = g.Gg((0, g.la)(X.X, X), X.Y > 0 && X.Y < g.Su() ? 2e4 : 1e4);
    },
    ob = function (X, F) {
      a: if (Zk(F) != Zk(X.W)) var Q = !1;
      else {
        Q = g.YZ(F);
        var n = Q.length;
        for (let I = 0; I < n; ++I)
          if (!X.W[Q[I]]) {
            Q = !1;
            break a;
          }
        Q = !0;
      }
      Q ||
        (Xj("Updated online screens: " + g.pg(X.W)),
        (X.W = F),
        X.publish("screenChange"));
      UpH(X);
    },
    Q2 = function (X, F, Q) {
      const n = wV(X.B, "/pairing/get_screen_availability");
      X.B.sendRequest(
        "POST",
        n,
        { lounge_token: F.token },
        (0, g.la)(function (I) {
          I = I.screens || [];
          const Z = I.length;
          for (let q = 0; q < Z; ++q)
            if (I[q].loungeToken == F.token) {
              Q(I[q].status == "online");
              return;
            }
          Q(!1);
        }, X),
        (0, g.la)(function () {
          Q(!1);
        }, X)
      );
    },
    UpH = function (X) {
      X = g.YZ(
        g.ls(X.W, function (F) {
          return F;
        })
      );
      g.$Z(X);
      X.length
        ? g.Fi("yt-remote-online-screen-ids", X.join(","), 60)
        : g.QZ("yt-remote-online-screen-ids");
    },
    EjH = function (X) {
      const F = {};
      g.mS(X.K(), function (Q) {
        Q.token
          ? (F[Q.token] = Q.id)
          : this.Ws("Requesting availability of screen w/o lounge token.");
      });
      return F;
    },
    nq = function (X, F = !1) {
      Mn.call(this, "ScreenService");
      this.Y = X;
      this.X = F;
      this.W = this.U = null;
      this.A = [];
      this.B = {};
      gjh(this);
    },
    cUD = function (X, F, Q, n, I, Z) {
      X.info("getAutomaticScreenByIds " + Q + " / " + F);
      Q || (Q = X.B[F]);
      const q = X.ql();
      let N = Q ? c0(q, Q) : null;
      (Q && (X.X || N)) || (N = c0(q, F));
      if (N) {
        N.uuid = F;
        const A = Ib(X, N);
        Q2(X.W, A, function (R) {
          I(R ? A : null);
        });
      } else
        Q
          ? vjT(
              X,
              Q,
              (0, g.la)(function (A) {
                const R = Ib(
                  this,
                  new W0({
                    name: n,
                    screenId: Q,
                    loungeToken: A,
                    dialId: F || "",
                  })
                );
                Q2(this.W, R, function (O) {
                  I(O ? R : null);
                });
              }, X),
              Z
            )
          : I(null);
    },
    eNB = function (X, F) {
      const Q = X.screens.length;
      for (let n = 0; n < Q; ++n)
        if (X.screens[n].name == F) return X.screens[n];
      return null;
    },
    Tce = function (X, F, Q) {
      Q2(X.W, F, Q);
    },
    vjT = function (X, F, Q, n) {
      X.info("requestLoungeToken_ for " + F);
      const I = {
        postParams: { screen_ids: F },
        method: "POST",
        context: X,
        onSuccess: function (Z, q) {
          Z = (q && q.screens) || [];
          Z[0] && Z[0].screenId == F
            ? Q(Z[0].loungeToken)
            : n(Error("Missing lounge token in token response"));
        },
        onError: function () {
          n(Error("Request screen lounge token failed"));
        },
      };
      g.LV(wV(X.Y, "/pairing/get_lounge_token_batch"), I);
    },
    p8T = function (X) {
      X.screens = X.U.ql();
      var F = X.B;
      const Q = {};
      for (var n in F) Q[F[n]] = n;
      F = X.screens.length;
      for (n = 0; n < F; ++n) {
        const I = X.screens[n];
        I.uuid = Q[I.id] || "";
      }
      X.info("Updated manual screens: " + Eg(X.screens));
    },
    gjh = function (X) {
      ZG(X);
      X.U = new bd(X.Y);
      X.U.subscribe("screenChange", (0, g.la)(X.Dv, X));
      p8T(X);
      X.X || (X.A = AIx(g.o9("yt-remote-automatic-screen-cache") || []));
      ZG(X);
      X.info("Initializing automatic screens: " + Eg(X.A));
      X.W = new $ps(X.Y, (0, g.la)(X.ql, X, !0));
      X.W.subscribe(
        "screenChange",
        (0, g.la)(function () {
          this.publish("onlineScreenChange");
        }, X)
      );
    },
    Ib = function (X, F) {
      var Q = X.get(F.id);
      Q
        ? ((Q.uuid = F.uuid), (F = Q))
        : ((Q = c0(X.A, F.uuid))
            ? ((Q.id = F.id), (Q.token = F.token), (F = Q))
            : X.A.push(F),
          X.X || fqT(X));
      ZG(X);
      X.B[F.uuid] = F.id;
      g.Fi("yt-remote-device-id-map", X.B, 31536e3);
      return F;
    },
    fqT = function (X) {
      X = g.JD(X.A, (F) => F.idType != "shortLived");
      g.Fi("yt-remote-automatic-screen-cache", g.ju(X, qd3));
    },
    ZG = function (X) {
      X.B = g.o9("yt-remote-device-id-map") || {};
    },
    q7 = function (X, F, Q) {
      g.Xx.call(this);
      this.Yb = Q;
      this.Y = X;
      this.U = F;
      this.W = null;
    },
    N7 = function (X, F) {
      X.W = F;
      X.publish("sessionScreen", X.W);
    },
    tYe = function (X, F) {
      X.W && ((X.W.token = F), Ib(X.Y, X.W));
      X.publish("sessionScreen", X.W);
    },
    AQ = function (X, F) {
      Jb(X.Yb, F);
    },
    zND = function (X, F) {
      g.iB(X.iT);
      X.iT = 0;
      F
        ? X.config_.enableCastLoungeToken && F.loungeToken
          ? F.deviceId
            ? (X.W && X.W.uuid == F.deviceId) ||
              (F.loungeTokenRefreshIntervalMs
                ? CFH(
                    X,
                    {
                      name: X.U.friendlyName,
                      screenId: F.screenId,
                      loungeToken: F.loungeToken,
                      dialId: F.deviceId,
                      screenIdType: "shortLived",
                    },
                    F.loungeTokenRefreshIntervalMs
                  )
                : (g.WM(
                    Error(
                      `No loungeTokenRefreshIntervalMs presents in mdxSessionStatusData: ${JSON.stringify(
                        F
                      )}.`
                    )
                  ),
                  Rb(X, F.screenId)))
            : (g.WM(
                Error(
                  `No device id presents in mdxSessionStatusData: ${JSON.stringify(
                    F
                  )}.`
                )
              ),
              Rb(X, F.screenId))
          : Rb(X, F.screenId)
        : X.Tz(Error("Waiting for session status timed out."));
    },
    lqB = function (X) {
      g.iB(X.J);
      X.J = 0;
      g.iB(X.X);
      X.X = 0;
      g.iB(X.iT);
      X.iT = 0;
      g.iB(X.B);
      X.B = 0;
      g.iB(X.G);
      X.G = 0;
    },
    yUD = function (X, F) {
      X.info("sendYoutubeMessage_: " + F + " " + g.pg());
      const Q = {};
      Q.type = F;
      X.A
        ? X.A.sendMessage(
            "urn:x-cast:com.google.youtube.mdx",
            Q,
            () => {},
            (0, g.la)(function () {
              AQ(this, "Failed to send message: " + F + ".");
            }, X)
          )
        : AQ(X, "Sending yt message without session: " + g.pg(Q));
    },
    KHy = function (X) {
      yUD(X, "getLoungeToken");
      g.iB(X.B);
      X.B = g.Gg(() => {
        SIH(X, null);
      }, 3e4);
    },
    O5 = function (X, F) {
      g.iB(X.G);
      X.G = 0;
      F == 0
        ? KHy(X)
        : (X.G = g.Gg(() => {
            KHy(X);
          }, F));
    },
    SIH = function (X, F) {
      g.iB(X.B);
      X.B = 0;
      let Q = null;
      F
        ? F.loungeToken
          ? X.W?.token == F.loungeToken && (Q = "staleLoungeToken")
          : (Q = "missingLoungeToken")
        : (Q = "noLoungeTokenResponse");
      Q
        ? (X.info(
            "Did not receive a new lounge token in onLoungeToken_ with " +
              `data: ${JSON.stringify(F)}, error: ${Q}`
          ),
          O5(X, 3e4))
        : (tYe(X, F.loungeToken), O5(X, F.loungeTokenRefreshIntervalMs));
    },
    Rb = function (X, F) {
      F
        ? (X.info("onConnectedScreenId_: Received screenId: " + F),
          (X.W && X.W.id == F) ||
            X.NS(
              F,
              (Q) => {
                N7(X, Q);
              },
              () => X.Tz(),
              5
            ))
        : X.Tz(Error("Waiting for session status timed out."));
    },
    kdV = function (X, F, Q, n) {
      g.iB(X.X);
      X.X = 0;
      Tce(X.Y, F, (I) => {
        I || n < 0
          ? Q(I)
          : (X.X = g.Gg(() => {
              kdV(X, F, Q, n - 1);
            }, 300));
      });
    },
    CFH = function (X, F, Q) {
      X.info(
        `onConnectedScreenData_: Received screenData: ${JSON.stringify(F)}`
      );
      const n = new W0(F);
      kdV(
        X,
        n,
        (I) => {
          I
            ? (Ib(X.Y, n), N7(X, n), O5(X, Q))
            : (g.WM(
                Error(
                  `CastSession, RemoteScreen from screenData: ${JSON.stringify(
                    F
                  )} is not online.`
                )
              ),
              X.Tz());
        },
        5
      );
    },
    Wj = function (X) {
      return new Promise((F) => {
        X.HS = gz();
        if (X.vS) {
          const Q = new chrome.cast.DialLaunchResponse(!0, aqZ(X));
          F(Q);
          DpD(X);
        } else
          (X.D = () => {
            g.iB(X.iT);
            X.D = () => {};
            X.iT = NaN;
            const Q = new chrome.cast.DialLaunchResponse(!0, aqZ(X));
            F(Q);
            DpD(X);
          }),
            (X.iT = g.Gg(() => {
              X.D();
            }, 100));
      });
    },
    YIh = function (X) {
      g.iB(X.X);
      X.X = 0;
      g.iB(X.G);
      X.G = 0;
      X.B();
      X.B = () => {};
      g.iB(X.iT);
    },
    V2 = function (X) {
      return !(!X.config_.enableDialLoungeToken || !X.A?.getDialAppInfo);
    },
    U5 = function (X, F) {
      X.info(`getDialAppInfoWithTimeout_ ${F}`);
      V2(X) &&
        (g.iB(X.G),
        (X.G = 0),
        F == 0
          ? GdH(X)
          : (X.G = g.Gg(() => {
              GdH(X);
            }, F)));
    },
    DpD = function (X) {
      X.B = X.Y.ox(
        X.HS,
        X.U.label,
        X.U.friendlyName,
        V2(X),
        (F, Q) => {
          X.B = () => {};
          N7(X, F);
          F.idType == "shortLived" && Q > 0 && U5(X, Q);
        },
        (F) => {
          X.B = () => {};
          X.Tz(F);
        }
      );
    },
    aqZ = function (X) {
      var F = {};
      F.pairingCode = X.HS;
      F.theme = X.sH;
      eyS() && (F.env_useStageMdx = 1);
      return g.Tb(F);
    },
    hNB = function (X, F) {
      const Q = X.J.receiver.label,
        n = X.U.friendlyName;
      return new Promise((I) => {
        cUD(
          X.Y,
          Q,
          F,
          n,
          (Z) => {
            Z && Z.token && N7(X, Z);
            I(Z);
          },
          (Z) => {
            AQ(X, "Failed to get DIAL screen: " + Z);
            I(null);
          }
        );
      }).then((I) =>
        I && I.token ? new chrome.cast.DialLaunchResponse(!1) : Wj(X)
      );
    },
    rUs = function (X, F, Q) {
      X.info(
        `initOnConnectedScreenDataPromise_: Received screenData: ${JSON.stringify(
          F
        )}`
      );
      const n = new W0(F);
      return new Promise((I) => {
        igB(
          X,
          n,
          (Z) => {
            Z
              ? (Ib(X.Y, n), N7(X, n), U5(X, Q))
              : g.WM(
                  Error(
                    `DialSession, RemoteScreen from screenData: ${JSON.stringify(
                      F
                    )} is not online.`
                  )
                );
            I(Z);
          },
          5
        );
      }).then((I) => (I ? new chrome.cast.DialLaunchResponse(!1) : Wj(X)));
    },
    igB = function (X, F, Q, n) {
      g.iB(X.X);
      X.X = 0;
      Tce(X.Y, F, (I) => {
        I || n < 0
          ? Q(I)
          : (X.X = g.Gg(() => {
              igB(X, F, Q, n - 1);
            }, 300));
      });
    },
    GdH = function (X) {
      V2(X) &&
        X.A.getDialAppInfo(
          (F) => {
            X.info(`getDialAppInfo dialLaunchData: ${JSON.stringify(F)}`);
            F = F.extraData || {};
            let Q = null;
            F.loungeToken
              ? X.W?.token == F.loungeToken && (Q = "staleLoungeToken")
              : (Q = "missingLoungeToken");
            Q
              ? U5(X, 3e4)
              : (tYe(X, F.loungeToken), U5(X, F.loungeTokenRefreshIntervalMs));
          },
          (F) => {
            X.info(`getDialAppInfo error: ${F}`);
            U5(X, 3e4);
          }
        );
    },
    Q2e = function (X) {
      window.chrome &&
        chrome.cast &&
        chrome.cast.logMessage &&
        chrome.cast.logMessage(X);
    },
    w83 = function (X) {
      const F = X.U.ym();
      let Q = X.W && X.W.U;
      X = g.ju(
        F,
        function (n) {
          Q && VH(n, Q.label) && (Q = null);
          const I = n.uuid ? n.uuid : n.id;
          let Z = xpT(this, n);
          Z
            ? ((Z.label = I), (Z.friendlyName = n.name))
            : ((Z = new chrome.cast.Receiver(I, n.name)),
              (Z.receiverType = chrome.cast.ReceiverType.CUSTOM));
          return Z;
        },
        X
      );
      Q &&
        (Q.receiverType != chrome.cast.ReceiverType.CUSTOM &&
          ((Q = new chrome.cast.Receiver(Q.label, Q.friendlyName)),
          (Q.receiverType = chrome.cast.ReceiverType.CUSTOM)),
        X.push(Q));
      return X;
    },
    E5 = function (X) {
      return X.G || !!X.A.length || !!X.W;
    },
    gh = function (X) {
      Jb("Controller", X);
    },
    vj = function (X, F, Q) {
      F != X.W &&
        (g.nL(X.W),
        (X.W = F)
          ? (Q
              ? X.publish("yt-remote-cast2-receiver-resumed", F.U)
              : X.publish("yt-remote-cast2-receiver-selected", F.U),
            F.subscribe("sessionScreen", (0, g.la)(X.iT, X, F)),
            F.subscribe("sessionFailed", () => HgH(X, F)),
            F.W
              ? X.publish("yt-remote-cast2-session-change", F.W)
              : Q && X.W.K(null))
          : X.publish("yt-remote-cast2-session-change", null));
    },
    xpT = function (X, F) {
      return F
        ? g.s4(
            X.A,
            function (Q) {
              return VH(F, Q.label);
            },
            X
          )
        : null;
    },
    HgH = function (X, F) {
      X.W == F && X.publish("yt-remote-cast2-session-failed");
    },
    u6y = function (X, F, Q, n) {
      n.disableCastApi
        ? cj("Cannot initialize because disabled by Mdx config.")
        : mpS()
        ? JUx(F, n) &&
          (eK(!0),
          window.chrome && chrome.cast && chrome.cast.isAvailable
            ? j2H(X, Q)
            : ((window.__onGCastApiAvailable = function (I, Z) {
                I
                  ? j2H(X, Q)
                  : (Tr("Failed to load cast API: " + Z),
                    pq(!1),
                    eK(!1),
                    g.QZ("yt-remote-cast-available"),
                    g.QZ("yt-remote-cast-receiver"),
                    PFM(),
                    Q(!1));
              }),
              n.loadCastApiSetupScript
                ? g.XI(LH$)
                : window.navigator.userAgent.indexOf("Android") >= 0 &&
                  window.navigator.userAgent.indexOf("Chrome/") >= 0 &&
                  window.navigator.presentation
                ? zs() >= 60 && zyh()
                : !window.chrome ||
                  !window.navigator.presentation ||
                  window.navigator.userAgent.indexOf("Edge") >= 0
                ? yH()
                : zs() >= 89
                ? yI$()
                : (Sm(), lL(lnB.map(fnS)))))
        : cj("Cannot initialize because not running Chrome");
    },
    PFM = function () {
      cj("dispose");
      const X = $P();
      X && X.dispose();
      g.vP("yt.mdx.remote.cloudview.instance_", null);
      dpS(!1);
      g.bw(fq);
      fq.length = 0;
    },
    tQ = function () {
      return !!g.o9("yt-remote-cast-installed");
    },
    MYx = function () {
      const X = g.o9("yt-remote-cast-receiver");
      return X ? X.friendlyName : null;
    },
    Bch = function () {
      cj("clearCurrentReceiver");
      g.QZ("yt-remote-cast-receiver");
    },
    s2T = function () {
      return tQ()
        ? $P()
          ? $P().getCastSession()
          : (Tr("getCastSelector: Cast is not initialized."), null)
        : (Tr("getCastSelector: Cast API is not installed!"), null);
    },
    zr = function () {
      tQ()
        ? $P()
          ? Cq()
            ? (cj("Requesting cast selector."), $P().requestSession())
            : (cj("Wait for cast API to be ready to request the session."),
              fq.push(g.BR("yt-remote-cast2-api-ready", zr)))
          : Tr("requestCastSelector: Cast is not initialized.")
        : Tr("requestCastSelector: Cast API is not installed!");
    },
    l8 = function (X, F) {
      Cq()
        ? $P().setConnectedScreenStatus(X, F)
        : Tr("setConnectedScreenStatus called before ready.");
    },
    mpS = function () {
      var X = g.qj().search(/ (CrMo|Chrome|CriOS)\//) >= 0;
      return g.OW || X;
    },
    XoD = function (X, F) {
      $P().init(X, F);
    },
    JUx = function (X, F) {
      let Q = !1;
      $P() ||
        ((X = new y2(X, F)),
        X.subscribe("yt-remote-cast2-availability-change", function (n) {
          g.Fi("yt-remote-cast-available", n);
          C6("yt-remote-cast2-availability-change", n);
        }),
        X.subscribe("yt-remote-cast2-receiver-selected", function (n) {
          cj("onReceiverSelected: " + n.friendlyName);
          g.Fi("yt-remote-cast-receiver", n);
          C6("yt-remote-cast2-receiver-selected", n);
        }),
        X.subscribe("yt-remote-cast2-receiver-resumed", function (n) {
          cj("onReceiverResumed: " + n.friendlyName);
          g.Fi("yt-remote-cast-receiver", n);
          C6("yt-remote-cast2-receiver-resumed", n);
        }),
        X.subscribe("yt-remote-cast2-session-change", function (n) {
          cj("onSessionChange: " + Ug(n));
          n || g.QZ("yt-remote-cast-receiver");
          C6("yt-remote-cast2-session-change", n);
        }),
        g.vP("yt.mdx.remote.cloudview.instance_", X),
        (Q = !0));
      cj("cloudview.createSingleton_: " + Q);
      return Q;
    },
    $P = function () {
      return g.cP("yt.mdx.remote.cloudview.instance_");
    },
    j2H = function (X, F) {
      pq(!0);
      eK(!1);
      XoD(X, function (Q) {
        Q
          ? (dpS(!0), g.sU("yt-remote-cast2-api-ready"))
          : (Tr("Failed to initialize cast API."),
            pq(!1),
            g.QZ("yt-remote-cast-available"),
            g.QZ("yt-remote-cast-receiver"),
            PFM());
        F(Q);
      });
    },
    cj = function (X) {
      Jb("cloudview", X);
    },
    Tr = function (X) {
      Jb("cloudview", X);
    },
    pq = function (X) {
      cj("setCastInstalled_ " + X);
      g.Fi("yt-remote-cast-installed", X);
    },
    Cq = function () {
      return !!g.cP("yt.mdx.remote.cloudview.apiReady_");
    },
    dpS = function (X) {
      cj("setApiReady_ " + X);
      g.vP("yt.mdx.remote.cloudview.apiReady_", X);
    },
    eK = function (X) {
      g.vP("yt.mdx.remote.cloudview.initializing_", X);
    },
    SK = function (X) {
      this.index = -1;
      this.videoId = this.listId = "";
      this.volume = this.playerState = -1;
      this.muted = !1;
      this.audioTrackId = null;
      this.B = this.K = 0;
      this.trackData = null;
      this.hasNext = this.hasPrevious = !1;
      this.loadedTime = this.A = this.X = this.U = 0;
      this.W = NaN;
      this.Y = !1;
      this.reset(X);
    },
    Kq = function (X) {
      X.audioTrackId = null;
      X.trackData = null;
      X.playerState = -1;
      X.hasPrevious = !1;
      X.hasNext = !1;
      X.K = 0;
      X.B = g.Su();
      X.U = 0;
      X.X = 0;
      X.A = 0;
      X.loadedTime = 0;
      X.W = NaN;
      X.Y = !1;
    },
    kP = function (X) {
      return X.isPlaying() ? (g.Su() - X.B) / 1e3 : 0;
    },
    ab = function (X, F) {
      X.K = F;
      X.B = g.Su();
    },
    DG = function (X) {
      switch (X.playerState) {
        case 1:
        case 1081:
          return (g.Su() - X.B) / 1e3 + X.K;
        case -1e3:
          return 0;
      }
      return X.K;
    },
    FCz = function (X) {
      return X.Y ? X.X + kP(X) : X.X;
    },
    YP = function (X, F, Q) {
      const n = X.videoId;
      X.videoId = F;
      X.index = Q;
      F != n && Kq(X);
    },
    Gr = function (X) {
      const F = {};
      F.index = X.index;
      F.listId = X.listId;
      F.videoId = X.videoId;
      F.playerState = X.playerState;
      F.volume = X.volume;
      F.muted = X.muted;
      F.audioTrackId = X.audioTrackId;
      F.trackData = g.PH(X.trackData);
      F.hasPrevious = X.hasPrevious;
      F.hasNext = X.hasNext;
      F.playerTime = X.K;
      F.playerTimeAt = X.B;
      F.seekableStart = X.U;
      F.seekableEnd = X.X;
      F.duration = X.A;
      F.loadedTime = X.loadedTime;
      F.liveIngestionTime = X.W;
      return F;
    },
    o0e = function (X) {
      g.mS(
        "nowAutoplaying autoplayDismissed remotePlayerChange remoteQueueChange autoplayModeChange autoplayUpNext previousNextChange multiStateLoopEnabled loopModeChange".split(
          " "
        ),
        function (F) {
          this.X.push(this.Y.subscribe(F, g.yu(this.XX, F), this));
        },
        X
      );
    },
    hQ = function (X, F) {
      X.U &&
        (X.U.removeUpdateListener(X.D),
        X.U.removeMediaListener(X.J),
        X.K(null));
      X.U = F;
      X.U &&
        (PT("Setting cast session: " + X.U.sessionId),
        X.U.addUpdateListener(X.D),
        X.U.addMediaListener(X.J),
        X.U.media.length && X.K(X.U.media[0]));
    },
    i8 = function (X) {
      return new SK(X.Y.getPlayerContextData());
    },
    rh = function (X) {
      return X.getState() == 1;
    },
    wh = function (X, F, Q) {
      return (0, g.la)(function (n) {
        this.Ws(
          "Failed to " + F + " with cast v2 channel. Error code: " + n.code
        );
        n.code != chrome.cast.ErrorCode.TIMEOUT &&
          (this.Ws("Retrying " + F + " using MDx browser channel."),
          xP(this, F, Q));
      }, X);
    },
    xP = function (X, F, Q) {
      X.Y.sendMessage(F, Q);
    },
    mp = function (X, F, Q) {
      const n = i8(X);
      ab(n, Q);
      n.playerState != -1e3 && (n.playerState = F);
      Hj(X, n);
    },
    JQ = function (X, F) {
      var Q = X.B;
      Q.W.length + Q.U.length < 50 && X.B.enqueue(F);
    },
    Hj = function (X, F) {
      QyV(X);
      X.Y.setPlayerContextData(Gr(F));
      o0e(X);
    },
    QyV = function (X) {
      g.mS(
        X.X,
        function (F) {
          this.Y.unsubscribeByKey(F);
        },
        X
      );
      X.X.length = 0;
    },
    n0s = function (X) {
      const F = X.W.media,
        Q = X.W.customData;
      if (F && Q) {
        var n = i8(X);
        F.contentId != n.videoId &&
          PT("Cast changing video to: " + F.contentId);
        n.videoId = F.contentId;
        n.playerState = Q.playerState;
        ab(n, X.W.getEstimatedTime());
        Hj(X, n);
      } else PT("No cast media video. Ignoring state update.");
    },
    Itz = function (X) {
      jK("Channel opened");
      X.NS &&
        ((X.NS = !1),
        Pj(X),
        (X.Yb = g.Gg(() => {
          jK("Timing out waiting for a screen.");
          X.X(1);
        }, 15e3)));
    },
    v0h = function (X, F) {
      F = F.message;
      F.params
        ? jK("Received: action=" + F.action + ", params=" + g.pg(F.params))
        : jK("Received: action=" + F.action + " {}");
      switch (F.action) {
        case "loungeStatus":
          F = q5(F.params.devices);
          X.A = g.ju(F, function (n) {
            return new Og(n);
          });
          F = !!g.s4(X.A, function (n) {
            return n.type == "LOUNGE_SCREEN";
          });
          Znz(X, F);
          F = X.Sx("mlm");
          X.publish("multiStateLoopEnabled", F);
          break;
        case "loungeScreenDisconnected":
          g.Nz(X.A, function (n) {
            return n.type == "LOUNGE_SCREEN";
          });
          Znz(X, !1);
          break;
        case "remoteConnected":
          let Q = new Og(q5(F.params.device));
          g.s4(X.A, function (n) {
            return n.equals(Q);
          }) || B5y(X.A, Q);
          break;
        case "remoteDisconnected":
          Q = new Og(q5(F.params.device));
          g.Nz(X.A, function (n) {
            return n.equals(Q);
          });
          break;
        case "gracefulDisconnect":
          break;
        case "playlistModified":
          qjM(X, F, "QUEUE_MODIFIED");
          break;
        case "nowPlaying":
          NaD(X, F);
          break;
        case "onStateChange":
          A2$(X, F);
          break;
        case "onAdStateChange":
          RuB(X, F);
          break;
        case "onVolumeChanged":
          OnB(X, F);
          break;
        case "onSubtitlesTrackChanged":
          WCh(X, F);
          break;
        case "nowAutoplaying":
          Vs3(X, F);
          break;
        case "autoplayDismissed":
          X.publish("autoplayDismissed");
          break;
        case "autoplayUpNext":
          ULZ(X, F);
          break;
        case "onAutoplayModeChanged":
          E0M(X, F);
          break;
        case "onHasPreviousNextChanged":
          g0M(X, F);
          break;
        case "requestAssistedSignIn":
          X.publish("assistedSignInRequested", F.params.authCode);
          break;
        case "onLoopModeChanged":
          X.publish("loopModeChange", F.params.loopMode);
          break;
        default:
          jK("Unrecognized action: " + F.action);
      }
    },
    jK = function (X) {
      Jb("conn", X);
    },
    c2V = function (X) {
      X.K = g.Gg(() => {
        jK("Connecting timeout");
        X.X(1);
      }, 2e4);
    },
    Lq = function (X, F) {
      X.publish("proxyStateChange", F);
    },
    u8 = function (X) {
      g.iB(X.K);
      X.K = NaN;
    },
    dh = function (X) {
      g.iB(X.Aj);
      X.Aj = NaN;
    },
    Pj = function (X) {
      g.iB(X.Yb);
      X.Yb = NaN;
    },
    euZ = function (X) {
      return g.s4(X.A, function (F) {
        return F.type == "LOUNGE_SCREEN";
      });
    },
    M7 = function (X, F, Q) {
      Q
        ? jK("Sending: action=" + F + ", params=" + g.pg(Q))
        : jK("Sending: action=" + F);
      X.U.sendMessage(F, Q);
    },
    Tas = function (X) {
      dh(X);
      X.Aj = g.Gg(() => {
        M7(X, "getNowPlaying");
      }, 2e4);
    },
    poz = function (X) {
      g.iB(X.D);
      X.D = g.Gg(() => {
        X.X(1);
      }, 864e5);
    },
    Znz = function (X, F) {
      var Q = null;
      if (F) {
        const n = euZ(X);
        n &&
          (Q = {
            clientName: n.clientName,
            deviceMake: n.brand,
            deviceModel: n.model,
            osVersion: n.osVersion,
          });
      }
      g.vP("yt.mdx.remote.remoteClient_", Q);
      F && (u8(X), Pj(X));
      Q = X.U.Rk() && isNaN(X.K);
      F == Q
        ? F && (Lq(X, 1), M7(X, "getSubtitlesTrack"))
        : F
        ? (X.VH() && X.W.reset(), Lq(X, 1), M7(X, "getNowPlaying"), poz(X))
        : X.X(1);
    },
    WCh = function (X, F) {
      const Q = F.params.videoId;
      delete F.params.videoId;
      Q == X.W.videoId &&
        (g.w$(F.params) ? (X.W.trackData = null) : (X.W.trackData = F.params),
        X.publish("remotePlayerChange"));
    },
    qjM = function (X, F, Q) {
      const n = F.params.videoId || F.params.video_id,
        I = parseInt(F.params.currentIndex, 10);
      X.W.listId = F.params.listId || X.W.listId;
      YP(X.W, n, I);
      X.publish("remoteQueueChange", Q);
    },
    A2$ = function (X, F) {
      var Q = parseInt(F.params.currentTime || F.params.current_time, 10);
      ab(X.W, isNaN(Q) ? 0 : Q);
      Q = parseInt(F.params.state, 10);
      Q = isNaN(Q) ? -1 : Q;
      Q == -1 && X.W.playerState == -1e3 && (Q = -1e3);
      X.W.playerState = Q;
      Q = Number(F.params.loadedTime);
      X.W.loadedTime = isNaN(Q) ? 0 : Q;
      X.W.j8(Number(F.params.duration));
      Q = X.W;
      var n = Number(F.params.liveIngestionTime);
      Q.W = n;
      Q.Y = isNaN(n) ? !1 : !0;
      Q = X.W;
      n = Number(F.params.seekableStartTime);
      F = Number(F.params.seekableEndTime);
      Q.U = isNaN(n) ? 0 : n;
      Q.X = isNaN(F) ? 0 : F;
      X.W.playerState == 1 ? Tas(X) : dh(X);
      X.publish("remotePlayerChange");
    },
    NaD = function (X, F) {
      F.params = F.params || {};
      qjM(X, F, "NOW_PLAYING_MAY_CHANGE");
      A2$(X, F);
      X.publish("autoplayDismissed");
    },
    RuB = function (X, F) {
      if (X.W.playerState != -1e3) {
        var Q = 1085;
        switch (parseInt(F.params.adState, 10)) {
          case 1:
            Q = 1081;
            break;
          case 2:
            Q = 1084;
            break;
          case 0:
            Q = 1083;
        }
        X.W.playerState = Q;
        F = parseInt(F.params.currentTime, 10);
        ab(X.W, isNaN(F) ? 0 : F);
        X.publish("remotePlayerChange");
      }
    },
    OnB = function (X, F) {
      const Q = F.params.muted == "true";
      X.W.volume = parseInt(F.params.volume, 10);
      X.W.muted = Q;
      X.publish("remotePlayerChange");
    },
    Vs3 = function (X, F) {
      X.G = F.params.videoId;
      X.publish("nowAutoplaying", parseInt(F.params.timeout, 10));
    },
    ULZ = function (X, F) {
      X.G = F.params.videoId || null;
      X.publish("autoplayUpNext", X.G);
    },
    E0M = function (X, F) {
      X.B = F.params.autoplayMode;
      X.publish("autoplayModeChange", X.B);
      X.B == "DISABLED" && X.publish("autoplayDismissed");
    },
    g0M = function (X, F) {
      const Q = F.params.hasNext == "true";
      X.W.hasPrevious = F.params.hasPrevious == "true";
      X.W.hasNext = Q;
      X.publish("previousNextChange");
    },
    C2h = function (X, F) {
      cIS();
      if (!tx || !tx.get("yt-remote-disable-remote-module-for-dev")) {
        F = g.G("MDX_CONFIG") || F;
        Oez();
        $Y();
        Bj ||
          ((Bj = new xm(F ? F.loungeApiHost : void 0)),
          eyS() && (Bj.W = "/api/loungedev"));
        b8 ||
          ((b8 = g.cP("yt.mdx.remote.deferredProxies_") || []),
          g.vP("yt.mdx.remote.deferredProxies_", b8));
        $L3();
        var Q = s5();
        if (!Q) {
          const I = new nq(Bj, F ? F.disableAutomaticScreenCache || !1 : !1);
          g.vP("yt.mdx.remote.screenService_", I);
          Q = s5();
          var n = {};
          F &&
            (n = {
              appId: F.appId,
              disableDial: F.disableDial,
              theme: F.theme,
              loadCastApiSetupScript: F.loadCastApiSetupScript,
              disableCastApi: F.disableCastApi,
              enableDialLoungeToken: F.enableDialLoungeToken,
              enableCastLoungeToken: F.enableCastLoungeToken,
              forceMirroring: F.forceMirroring,
            });
          g.vP(
            "yt.mdx.remote.enableConnectWithInitialState_",
            F ? F.enableConnectWithInitialState || !1 : !1
          );
          u6y(
            X,
            I,
            function (Z) {
              Z
                ? Xe() && l8(Xe(), "YouTube TV")
                : I.subscribe("onlineScreenChange", function () {
                    C6("yt-remote-receiver-availability-change");
                  });
            },
            n
          );
        }
        F &&
          !g.cP("yt.mdx.remote.initialized_") &&
          (g.vP("yt.mdx.remote.initialized_", !0),
          Fe("Initializing: " + g.pg(F)),
          or.push(
            g.BR("yt-remote-cast2-api-ready", function () {
              C6("yt-remote-api-ready");
            })
          ),
          or.push(
            g.BR("yt-remote-cast2-availability-change", function () {
              C6("yt-remote-receiver-availability-change");
            })
          ),
          or.push(
            g.BR("yt-remote-cast2-receiver-selected", function () {
              QR(null);
              C6("yt-remote-auto-connect", "cast-selector-receiver");
            })
          ),
          or.push(
            g.BR("yt-remote-cast2-receiver-resumed", function () {
              C6("yt-remote-receiver-resumed", "cast-selector-receiver");
            })
          ),
          or.push(g.BR("yt-remote-cast2-session-change", ftH)),
          or.push(
            g.BR("yt-remote-connection-change", function (I) {
              I ? l8(Xe(), "YouTube TV") : n2() || (l8(null, null), Bch());
            })
          ),
          or.push(
            g.BR("yt-remote-cast2-session-failed", () => {
              C6("yt-remote-connection-failed");
            })
          ),
          (X = Ir()),
          F.isAuto && (X.id += "#dial"),
          (n = F.capabilities || []),
          n.length > 0 && (X.capabilities = n),
          (X.name = F.device),
          (X.app = F.app),
          (F = F.theme) && (X.theme = F),
          Fe(" -- with channel params: " + g.pg(X)),
          X
            ? (g.Fi("yt-remote-session-app", X.app),
              g.Fi("yt-remote-session-name", X.name))
            : (g.QZ("yt-remote-session-app"), g.QZ("yt-remote-session-name")),
          g.vP("yt.mdx.remote.channelParams_", X),
          Q.start(),
          Xe() || tsx());
      }
    },
    zus = function () {
      var X = s5().U_.$_gos();
      const F = Zg();
      F && qu() && (v0(X, F) || X.push(F));
      return Rye(X);
    },
    Nu = function () {
      let X = ltD();
      !X &&
        tQ() &&
        MYx() &&
        (X = { key: "cast-selector-receiver", name: MYx() });
      return X;
    },
    ltD = function () {
      const X = zus();
      let F = Zg();
      F || (F = n2());
      return g.s4(X, function (Q) {
        return F && VH(F, Q.key) ? !0 : !1;
      });
    },
    Zg = function () {
      const X = Xe();
      if (!X) return null;
      const F = s5().ql();
      return c0(F, X);
    },
    ftH = function (X) {
      Fe("remote.onCastSessionChange_: " + Ug(X));
      if (X) {
        var F = Zg();
        if (F && F.id == X.id) {
          if (
            (l8(F.id, "YouTube TV"), X.idType == "shortLived" && (X = X.token))
          )
            A$ && (A$.token = X), (F = qu()) && F.PA(X);
        } else F && Rr(), OS(X, 1);
      } else qu() && Rr();
    },
    Rr = function () {
      Cq() ? $P().stopSession() : Tr("stopSession called before API ready.");
      const X = qu();
      X && (X.disconnect(1), Wl(null));
    },
    VR = function () {
      const X = qu();
      return !!X && X.getProxyState() != 3;
    },
    Fe = function (X) {
      Jb("remote", X);
    },
    s5 = function () {
      if (!US) {
        const X = g.cP("yt.mdx.remote.screenService_");
        US = X ? new y2D(X) : null;
      }
      return US;
    },
    Xe = function () {
      return g.cP("yt.mdx.remote.currentScreenId_");
    },
    SjV = function (X) {
      g.vP("yt.mdx.remote.currentScreenId_", X);
    },
    KCh = function () {
      return g.cP("yt.mdx.remote.connectData_");
    },
    QR = function (X) {
      g.vP("yt.mdx.remote.connectData_", X);
    },
    qu = function () {
      return g.cP("yt.mdx.remote.connection_");
    },
    Wl = function (X) {
      const F = qu();
      QR(null);
      X || SjV("");
      g.vP("yt.mdx.remote.connection_", X);
      b8 &&
        (g.mS(b8, function (Q) {
          Q(X);
        }),
        (b8.length = 0));
      F && !X
        ? C6("yt-remote-connection-change", !1)
        : !F && X && C6("yt-remote-connection-change", !0);
    },
    n2 = function () {
      const X = g.nZ();
      if (!X) return null;
      var F = s5();
      if (!F) return null;
      F = F.ql();
      return c0(F, X);
    },
    OS = function (X, F) {
      Xe();
      Zg() && Zg();
      if (ES) A$ = X;
      else {
        SjV(X.id);
        var Q = g.cP("yt.mdx.remote.enableConnectWithInitialState_") || !1;
        X = new gb(X, Q);
        X.connect(F, KCh());
        X.subscribe("beforeDisconnect", function (n) {
          C6("yt-remote-before-disconnect", n);
        });
        X.subscribe("beforeDispose", function () {
          qu() && (qu(), Wl(null));
        });
        X.subscribe("browserChannelAuthError", () => {
          const n = Zg();
          n &&
            n.idType == "shortLived" &&
            (Cq()
              ? $P().handleBrowserChannelAuthError()
              : Tr("refreshLoungeToken called before API ready."));
        });
        Wl(X);
      }
    },
    tsx = function () {
      const X = n2();
      X
        ? (Fe("Resume connection to: " + Ug(X)), OS(X, 0))
        : (f6(),
          Bch(),
          Fe("Skipping connecting because no session screen found."));
    },
    $L3 = function () {
      var X = Ir();
      if (g.w$(X)) {
        X = p6();
        var F = g.o9("yt-remote-session-name") || "";
        const Q = g.o9("yt-remote-session-app") || "";
        X = { device: "REMOTE_CONTROL", id: X, name: F, app: Q, mdxVersion: 3 };
        X.authuser = String(g.G("SESSION_INDEX", "0"));
        (F = g.G("DELEGATED_SESSION_ID")) && (X.pageId = String(F));
        g.vP("yt.mdx.remote.channelParams_", X);
      }
    },
    Ir = function () {
      return g.cP("yt.mdx.remote.channelParams_") || {};
    },
    kwT = function (X, F) {
      if (vl(X)) {
        X.IN.unsubscribe("remotePlayerChange", X.B, X);
        const Q = Math.round(F.volume);
        F = !!F.muted;
        const n = i8(X.IN);
        if (Q !== n.volume || F !== n.muted) X.IN.setVolume(Q, F), X.D.start();
        X.IN.subscribe("remotePlayerChange", X.B, X);
      }
    },
    vl = function (X) {
      return i8(X.IN).videoId === cl(X).videoId;
    },
    eI = function (X, F) {
      let Q, n;
      var I = X.N.getPlaylist();
      I?.listId && ((Q = I.index), (n = I.listId.toString()));
      I = cl(X);
      X.IN.playVideo(I.videoId, F, Q, n, I.playerParams, I.D, M$H(I));
      X.Uw(new g.Ou(1));
    },
    T2 = function (X, F) {
      if (vl(X) && !X.K) {
        let Q = null;
        F &&
          ((Q = { style: X.N.getSubtitlesUserSettings() }),
          Object.assign(Q, F));
        X.IN.G(cl(X).videoId, Q);
        X.Y = i8(X.IN).trackData;
      }
    },
    atB = function (X, F) {
      if (F) {
        const Q = X.N.getOption("captions", "tracklist", { qY: 1 });
        Q && Q.length
          ? (X.N.setOption("captions", "track", F), (X.K = !1))
          : (X.N.loadModule("captions"), (X.K = !0));
      } else X.N.setOption("captions", "track", {});
    },
    DLD = function (X) {
      X.G3(0);
      X.U.stop();
      X.Uw(new g.Ou(64));
    },
    cl = function (X) {
      return X.N.getVideoData({ playerType: 1 });
    },
    YjH = function (X) {
      const F = X.player.Z();
      return !F.L("mdx_enable_privacy_disclosure_ui") ||
        X.isLoggedIn() ||
        X.e2 ||
        !X.eb
        ? !1
        : g.sG(F) || g.tm(F);
    },
    GwV = function (X, F, Q) {
      X.yw = Q;
      X.player.publish("presentingplayerstatechange", new g.pG(Q, F));
    },
    p2 = function (X, F, ...Q) {
      X.loaded && X.Js.KB(F, ...Q);
    },
    $_ = function (X) {
      X.Cl &&
        (X.player.removeEventListener("presentingplayerstatechange", X.Cl),
        (X.Cl = null));
    },
    f2 = function (X, F) {
      if (F.key !== X.yY.key)
        if (F.key === X.wm.key) Rr();
        else if ((YjH(X) && huT(X), (X.yY = F), !g.Ja(X.player.Z()))) {
          {
            const Z = X.player.getPlaylistId();
            var Q = X.player.getVideoData({ playerType: 1 });
            const q = Q.videoId;
            if (
              (!Z && !q) ||
              ((X.player.getAppState() === 2 || X.player.getAppState() === 1) &&
                X.player
                  .Z()
                  .L("should_clear_video_data_on_player_cued_unstarted"))
            )
              Q = null;
            else {
              var n = X.player.getPlaylist();
              if (n) {
                var I = [];
                for (let N = 0; N < n.length; N++) I[N] = g.h_(n, N).videoId;
              } else I = [q];
              n = X.player.getCurrentTime(1);
              X = {
                videoIds: I,
                listId: Z,
                videoId: q,
                playerParams: Q.playerParams,
                clickTrackingParams: Q.D,
                index: Math.max(X.player.getPlaylistIndex(), 0),
                currentTime: n === 0 ? void 0 : n,
              };
              (Q = M$H(Q)) && (X.locationInfo = Q);
              Q = X;
            }
          }
          Fe("Connecting to: " + g.pg(F));
          F.key == "cast-selector-receiver"
            ? (QR(Q || null),
              (F = Q || null),
              Cq()
                ? $P().setLaunchParams(F)
                : Tr("setLaunchParams called before ready."))
            : !Q && VR() && Xe() == F.key
            ? C6("yt-remote-connection-change", !0)
            : (Rr(),
              QR(Q || null),
              (Q = s5().ql()),
              (F = c0(Q, F.key)) && OS(F, 1));
        }
    },
    huT = function (X) {
      X.player.getPlayerStateObject().isPlaying()
        ? X.player.pauseVideo()
        : ((X.Cl = (F) => {
            !X.e2 && F.aP(8) && (X.player.pauseVideo(), $_(X));
          }),
          X.player.addEventListener("presentingplayerstatechange", X.Cl));
      X.eb && X.eb.wK();
      qu() || (ES = !0);
    };
  g.Ue.prototype.IT = g.o1(46, function () {
    this.app.Fh().IT();
  });
  g.BK.prototype.IT = g.o1(45, function () {
    this.ZV = null;
  });
  g.Ue.prototype.vy = g.o1(44, function (X) {
    this.app.Fh().vy(X);
  });
  g.BK.prototype.vy = g.o1(43, function (X) {
    this.ZV = X;
  });
  g.Nc.prototype.KZ = g.o1(1, function () {
    return g.b$(this, 3);
  });
  g.Xp.prototype.KZ = g.o1(0, function () {
    return g.b$(this, 11);
  });
  var xUS = class {
      constructor() {
        var X = g.Py();
        this.U = X;
        g.OI(
          X,
          "/client_streamz/youtube/living_room/mdx/channel/opened",
          g.lp("channel_type")
        );
      }
      W(X) {
        g.UI(
          this.U,
          "/client_streamz/youtube/living_room/mdx/channel/opened",
          X
        );
      }
    },
    wdh = class {
      constructor() {
        var X = g.Py();
        this.U = X;
        g.OI(
          X,
          "/client_streamz/youtube/living_room/mdx/channel/closed",
          g.lp("channel_type")
        );
      }
      W(X) {
        g.UI(
          this.U,
          "/client_streamz/youtube/living_room/mdx/channel/closed",
          X
        );
      }
    },
    mUT = class {
      constructor() {
        var X = g.Py();
        this.U = X;
        g.OI(
          X,
          "/client_streamz/youtube/living_room/mdx/channel/message_received",
          g.lp("channel_type")
        );
      }
      W(X) {
        g.UI(
          this.U,
          "/client_streamz/youtube/living_room/mdx/channel/message_received",
          X
        );
      }
    },
    HQT = class {
      constructor() {
        var X = g.Py();
        this.U = X;
        g.OI(X, "/client_streamz/youtube/living_room/mdx/channel/success");
      }
      W() {
        g.UI(this.U, "/client_streamz/youtube/living_room/mdx/channel/success");
      }
    },
    JXy = class {
      constructor() {
        var X = g.Py();
        this.U = X;
        g.OI(
          X,
          "/client_streamz/youtube/living_room/mdx/channel/error",
          g.lp("channel_type"),
          g.lp("error_type")
        );
      }
      W(X, F) {
        g.UI(
          this.U,
          "/client_streamz/youtube/living_room/mdx/channel/error",
          X,
          F
        );
      }
    },
    jes = class {
      constructor() {
        var X = g.Py();
        this.U = X;
        g.OI(
          X,
          "/client_streamz/youtube/living_room/mdx/browser_channel/pending_maps"
        );
      }
      W() {
        g.UI(
          this.U,
          "/client_streamz/youtube/living_room/mdx/browser_channel/pending_maps"
        );
      }
    },
    PmV = class {
      constructor() {
        var X = g.Py();
        this.U = X;
        g.OI(
          X,
          "/client_streamz/youtube/living_room/mdx/browser_channel/undelivered_maps"
        );
      }
      W() {
        g.UI(
          this.U,
          "/client_streamz/youtube/living_room/mdx/browser_channel/undelivered_maps"
        );
      }
    };
  g.t = Ax.prototype;
  g.t.Np = function () {
    RL(this);
    const X = [];
    for (let F = 0; F < this.W.length; F++) X.push(this.U[this.W[F]]);
    return X;
  };
  g.t.Bo = function () {
    RL(this);
    return this.W.concat();
  };
  g.t.has = function (X) {
    return N5(this.U, X);
  };
  g.t.equals = function (X, F) {
    if (this === X) return !0;
    if (this.size != X.size) return !1;
    F = F || F0x;
    RL(this);
    let Q;
    for (let n = 0; (Q = this.W[n]); n++)
      if (!F(this.get(Q), X.get(Q))) return !1;
    return !0;
  };
  g.t.isEmpty = function () {
    return this.size == 0;
  };
  g.t.clear = function () {
    this.U = {};
    this.RZ = this.size = this.W.length = 0;
  };
  g.t.remove = function (X) {
    return this.delete(X);
  };
  g.t.delete = function (X) {
    return N5(this.U, X)
      ? (delete this.U[X],
        --this.size,
        this.RZ++,
        this.W.length > 2 * this.size && RL(this),
        !0)
      : !1;
  };
  g.t.get = function (X, F) {
    return N5(this.U, X) ? this.U[X] : F;
  };
  g.t.set = function (X, F) {
    N5(this.U, X) || ((this.size += 1), this.W.push(X), this.RZ++);
    this.U[X] = F;
  };
  g.t.forEach = function (X, F) {
    const Q = this.Bo();
    for (let n = 0; n < Q.length; n++) {
      const I = Q[n],
        Z = this.get(I);
      X.call(F, Z, I, this);
    }
  };
  g.t.clone = function () {
    return new Ax(this);
  };
  g.t.keys = function () {
    return g.$d(this.QI(!0)).W();
  };
  g.t.values = function () {
    return g.$d(this.QI(!1)).W();
  };
  g.t.entries = function () {
    const X = this;
    return XZs(this.keys(), function (F) {
      return [F, X.get(F)];
    });
  };
  g.t.QI = function (X) {
    RL(this);
    let F = 0;
    const Q = this.RZ,
      n = this,
      I = new g.to();
    I.next = function () {
      if (Q != n.RZ)
        throw Error("The map has changed since the iterator was created");
      if (F >= n.W.length) return g.b3;
      const Z = n.W[F++];
      return g.CL(X ? Z : n.U[Z]);
    };
    return I;
  };
  var In3 = {
      qk: "atp",
      hYS: "ska",
      mSS: "que",
      N1: "mus",
      A$S: "sus",
      q5: "dsp",
      uX_: "seq",
      iG: "mic",
      GL: "dpa",
      OX: "mlm",
      V8: "dsdtr",
      VD: "ntb",
      DQg: "vsp",
      f4: "scn",
      FeT: "rpe",
      K4: "dcn",
      L4: "dcp",
      Jr: "pas",
      Xc: "drq",
      zF: "opf",
      j1: "els",
      y8: "isg",
      lUV: "svq",
      sX: "mvp",
      Ot: "ads",
      KVH: "stcp",
      bFH: "sads",
      qd: "dloc",
      Md: "dcw",
      vg: "asw",
      Nr: "apw",
      KY: "wrc",
      Ajg: "pcw",
      Lt: "ipv",
      So: "ndt",
      QT: "ctops",
      tR: "gsrm",
    },
    ZeT = {
      a9V: "u",
      Je: "cl",
      G$: "k",
      JR: "i",
      h4: "cr",
      dh: "m",
      UU: "g",
      Mg: "up",
    },
    usy = {
      GF: "nowPlaying",
      wh: "onStateChange",
      Mr: "adPlaying",
      Zb: "onAdStateChange",
      Rn: "nowPlayingShorts",
      C6: "onShortsStateChange",
    };
  Og.prototype.equals = function (X) {
    return X ? this.id == X.id : !1;
  };
  var Ts = "",
    tx = null,
    Cpx = TPV("loadCastFramework") || TPV("loadCastApplicationFramework"),
    lnB = [
      "pkedcjkdefgpdelpbcmbmeomcjbeemfm",
      "enhhojjnijigcajfphajepfemndkmdlo",
    ];
  g.a1(K6, g.ZS);
  g.t = K6.prototype;
  g.t.oS = function (X) {
    this.Y = arguments;
    this.W = !1;
    this.xJ ? (this.A = g.Su() + this.lZ) : (this.xJ = g.ng(this.B, this.lZ));
  };
  g.t.stop = function () {
    this.xJ && (g.go.clearTimeout(this.xJ), (this.xJ = null));
    this.A = null;
    this.W = !1;
    this.Y = [];
  };
  g.t.pause = function () {
    ++this.U;
  };
  g.t.resume = function () {
    this.U &&
      (--this.U,
      !this.U && this.W && ((this.W = !1), this.K.apply(null, this.Y)));
  };
  g.t.hj = function () {
    this.stop();
    K6.Td.hj.call(this);
  };
  g.t.jk = function () {
    this.xJ && (g.go.clearTimeout(this.xJ), (this.xJ = null));
    this.A
      ? ((this.xJ = g.ng(this.B, this.A - g.Su())), (this.A = null))
      : this.U
      ? (this.W = !0)
      : ((this.W = !1), this.K.apply(null, this.Y));
  };
  var aL = null;
  kY.prototype.set = function (X) {
    this.W = X;
  };
  kY.prototype.reset = function () {
    this.set(g.Su());
  };
  kY.prototype.get = function () {
    return this.W;
  };
  g.a1(K0$, Sd$);
  var IW = class {
    stringify(X) {
      return g.go.JSON.stringify(X, void 0);
    }
    parse(X) {
      return g.go.JSON.parse(X, void 0);
    }
  };
  g.a1(Dk, g.qU);
  g.a1(YY, g.qU);
  var kBM = null;
  g.a1(anz, g.qU);
  g.a1(DVz, g.qU);
  g.a1(YdT, g.qU);
  xY.prototype.debug = function () {};
  xY.prototype.info = function () {};
  xY.prototype.warning = function () {};
  var wZ3 = {},
    P0 = {};
  g.t = wz.prototype;
  g.t.setTimeout = function (X) {
    this.FX = X;
  };
  g.t.fP = function (X) {
    X = X.target;
    const F = this.VH;
    F && g.Yj(X) == 3 ? F.Y() : this.vt(X);
  };
  g.t.vt = function (X) {
    try {
      if (X == this.W)
        a: {
          const I = g.Yj(this.W),
            Z = this.W.U,
            q = this.W.getStatus();
          if (
            !(I < 3) &&
            (I != 3 || (this.W && (this.U.U || g.iF(this.W) || g.rc(this.W))))
          ) {
            this.NS || I != 4 || Z == 7 || (Z == 8 || q <= 0 ? hx(3) : hx(2));
            L6(this);
            var F = this.W.getStatus();
            this.cS = F;
            var Q = xVe(this);
            if ((this.K = F == 200)) {
              if (this.lT && !this.XX) {
                b: {
                  if (this.W) {
                    const N = g.wc(this.W, "X-HTTP-Initial-Response");
                    if (N && !g.ol(N)) {
                      var n = N;
                      break b;
                    }
                  }
                  n = null;
                }
                if ((X = n)) (this.XX = !0), oW(this, X);
                else {
                  this.K = !1;
                  this.B = 3;
                  iL(12);
                  Jx(this);
                  jm(this);
                  break a;
                }
              }
              if (this.Yb) {
                X = !0;
                let N;
                for (; !this.NS && this.X < Q.length; )
                  if (((N = HeV(this, Q)), N == P0)) {
                    I == 4 && ((this.B = 4), iL(14), (X = !1));
                    break;
                  } else if (N == wZ3) {
                    this.B = 4;
                    iL(15);
                    X = !1;
                    break;
                  } else oW(this, N);
                rIh(this) &&
                  this.X != 0 &&
                  ((this.U.W = this.U.W.slice(this.X)), (this.X = 0));
                I != 4 ||
                  Q.length != 0 ||
                  this.U.U ||
                  ((this.B = 1), iL(16), (X = !1));
                this.K = this.K && X;
                X
                  ? Q.length > 0 &&
                    !this.ai &&
                    ((this.ai = !0), this.A.m5(this))
                  : (Jx(this), jm(this));
              } else oW(this, Q);
              I == 4 && Jx(this);
              this.K &&
                !this.NS &&
                (I == 4 ? JID(this.A, this) : ((this.K = !1), mU(this)));
            } else
              g.xj(this.W),
                F == 400 && Q.indexOf("Unknown SID") > 0
                  ? ((this.B = 3), iL(12))
                  : ((this.B = 0), iL(13)),
                Jx(this),
                jm(this);
          }
        }
    } catch (I) {
    } finally {
    }
  };
  g.t.cancel = function () {
    this.NS = !0;
    Jx(this);
  };
  g.t.pP = function () {
    this.iT = null;
    const X = Date.now();
    X - this.jx >= 0
      ? (this.sH != 2 && (hx(3), iL(17)), Jx(this), (this.B = 2), jm(this))
      : mVy(this, this.jx - X);
  };
  g.t.getLastError = function () {
    return this.B;
  };
  g.t.pf = function () {
    return this.W;
  };
  var inT = class {
    constructor(X, F) {
      this.W = X;
      this.map = F;
      this.context = null;
    }
  };
  uSB.prototype.cancel = function () {
    this.A = Qc(this);
    if (this.U) this.U.cancel(), (this.U = null);
    else if (this.W && this.W.size !== 0) {
      for (const X of this.W.values()) X.cancel();
      this.W.clear();
    }
  };
  g.t = si$.prototype;
  g.t.KU = 8;
  g.t.kc = 1;
  g.t.connect = function (X, F, Q, n) {
    iL(0);
    this.FJ = X;
    this.NS = F || {};
    Q && n !== void 0 && ((this.NS.OSID = Q), (this.NS.OAID = n));
    this.VH = this.KC;
    this.vS = jiV(this, null, this.FJ);
    Fq(this);
  };
  g.t.disconnect = function () {
    XdZ(this);
    if (this.kc == 3) {
      var X = this.Sx++,
        F = this.vS.clone();
      g.QA(F, "SID", this.Y);
      g.QA(F, "RID", X);
      g.QA(F, "TYPE", "terminate");
      Nn(this, F);
      X = new wz(this, this.Y, X);
      X.sH = 2;
      X.G = n6(F.clone());
      F = !1;
      if (g.go.navigator && g.go.navigator.sendBeacon)
        try {
          F = g.go.navigator.sendBeacon(X.G.toString(), "");
        } catch {}
      !F && g.go.Image && ((new Image().src = X.G), (F = !0));
      F || ((X.W = iez(X.A, null)), X.W.send(X.G));
      X.HS = Date.now();
      mU(X);
    }
    ZQB(this);
  };
  g.t.ZP = function () {
    return this.kc == 0;
  };
  g.t.getState = function () {
    return this.kc;
  };
  g.t.qJ = function (X) {
    if (this.K)
      if (((this.K = null), this.kc == 1)) {
        if (!X) {
          this.Sx = Math.floor(Math.random() * 1e5);
          X = this.Sx++;
          const I = new wz(this, "", X);
          let Z = this.J;
          this.lT && (Z ? ((Z = g.jV(Z)), g.us(Z, this.lT)) : (Z = this.lT));
          this.X !== null || this.jx || ((I.vS = Z), (Z = null));
          if (this.rV)
            a: {
              var F = 0;
              for (var Q = 0; Q < this.A.length; Q++) {
                b: {
                  var n = this.A[Q];
                  if (
                    "__data__" in n.map &&
                    ((n = n.map.__data__), typeof n === "string")
                  ) {
                    n = n.length;
                    break b;
                  }
                  n = void 0;
                }
                if (n === void 0) break;
                F += n;
                if (F > 4096) {
                  F = Q;
                  break a;
                }
                if (F === 4096 || Q === this.A.length - 1) {
                  F = Q + 1;
                  break a;
                }
              }
              F = this.wN;
            }
          else F = this.wN;
          F = Qez(this, I, F);
          Q = this.vS.clone();
          g.QA(Q, "RID", X);
          g.QA(Q, "CVER", 22);
          this.Yb && g.QA(Q, "X-HTTP-Session-Id", this.Yb);
          Nn(this, Q);
          Z &&
            (this.jx
              ? (F = "headers=" + g.Zy(g.A9(Z)) + "&" + F)
              : this.X && g.RB(Q, this.X, Z));
          Xq(this.U, I);
          this.fN && g.QA(Q, "TYPE", "init");
          this.rV
            ? (g.QA(Q, "$req", F),
              g.QA(Q, "SID", "null"),
              (I.lT = !0),
              H0(I, Q, null))
            : H0(I, Q, F);
          this.kc = 2;
        }
      } else
        this.kc == 3 &&
          (X ? niB(this, X) : this.A.length == 0 || dVy(this.U) || niB(this));
  };
  g.t.LU = function () {
    this.G = null;
    IiD(this);
    if (this.EA && !(this.FX || this.W == null || this.MQ <= 0)) {
      var X = 4 * this.MQ;
      this.Aj = rz((0, g.la)(this.Vl, this), X);
    }
  };
  g.t.Vl = function () {
    this.Aj &&
      ((this.Aj = null),
      (this.VH = !1),
      (this.FX = !0),
      iL(10),
      M5(this),
      IiD(this));
  };
  g.t.m5 = function (X) {
    this.W == X && this.EA && !this.FX && (qn(this), (this.FX = !0), iL(11));
  };
  g.t.T4 = function () {
    this.iT != null && ((this.iT = null), M5(this), B0(this), iL(19));
  };
  g.t.Gy = function (X) {
    X ? iL(2) : iL(1);
  };
  g.t.isActive = function () {
    return !!this.B && this.B.isActive(this);
  };
  g.t = NQe.prototype;
  g.t.GQ = function () {};
  g.t.EW = function () {};
  g.t.Vm = function () {};
  g.t.Xr = function () {};
  g.t.isActive = function () {
    return !0;
  };
  g.t.JF = function () {};
  g.a1(RW, g.lm);
  RW.prototype.open = function () {
    this.W.B = this.A;
    this.X && (this.W.XX = !0);
    this.W.connect(this.K, this.U || void 0);
  };
  RW.prototype.close = function () {
    this.W.disconnect();
  };
  RW.prototype.send = function (X) {
    var F = this.W;
    if (typeof X === "string") {
      var Q = {};
      Q.__data__ = X;
      X = Q;
    } else this.B && ((Q = {}), (Q.__data__ = g.pg(X)), (X = Q));
    F.A.push(new inT(F.nN++, X));
    F.kc == 3 && Fq(F);
  };
  RW.prototype.hj = function () {
    this.W.B = null;
    delete this.A;
    this.W.disconnect();
    delete this.W;
    RW.Td.hj.call(this);
  };
  g.a1(RGV, Dk);
  g.a1(OQ3, YY);
  g.a1(Ab, NQe);
  Ab.prototype.GQ = function () {
    this.W.dispatchEvent("m");
  };
  Ab.prototype.EW = function (X) {
    this.W.dispatchEvent(new RGV(X));
  };
  Ab.prototype.Vm = function (X) {
    this.W.dispatchEvent(new OQ3(X));
  };
  Ab.prototype.Xr = function () {
    this.W.dispatchEvent("n");
  };
  RW.prototype.Y = function () {
    return new OR(this, this.W);
  };
  OR.prototype.U = function () {
    return bL(this.W.U);
  };
  OR.prototype.A = function () {
    return qxM(this.W).map((X) => {
      var F = this.Y;
      X = X.map;
      "__data__" in X ? ((X = X.__data__), (F = F.B ? boM(X) : X)) : (F = X);
      return F;
    });
  };
  OR.prototype.commit = function (X) {
    this.W.cS = X;
  };
  var Vc = new g.lm(),
    Wv$ = class extends g.qU {
      constructor() {
        super("statevent", Vc);
      }
    };
  g.t = ER.prototype;
  g.t.xR = null;
  g.t.v5 = !1;
  g.t.Ad = null;
  g.t.Fa = null;
  g.t.y0 = null;
  g.t.mz = null;
  g.t.wR = null;
  g.t.ST = null;
  g.t.yR = null;
  g.t.E1 = null;
  g.t.Fb = 0;
  g.t.x_ = null;
  g.t.z7 = null;
  g.t.Ux = null;
  g.t.xl = -1;
  g.t.jh = !0;
  g.t.eA = !1;
  g.t.zE = 0;
  g.t.MO = null;
  var EiH = {},
    cT = {};
  g.t = ER.prototype;
  g.t.setTimeout = function (X) {
    this.U = X;
  };
  g.t.ud = function (X) {
    X = X.target;
    const F = this.MO;
    F && g.Yj(X) == 3 ? F.Y() : this.Rx(X);
  };
  g.t.Rx = function (X) {
    try {
      if (X == this.E1)
        a: {
          const F = g.Yj(this.E1),
            Q = this.E1.U,
            n = this.E1.getStatus();
          if (g.Xu && !g.tC("420+")) {
            if (F < 4) break a;
          } else if (F < 3 || (F == 3 && !g.iF(this.E1))) break a;
          this.eA ||
            F != 4 ||
            Q == 7 ||
            (Q == 8 || n <= 0 ? this.W.XS(3) : this.W.XS(2));
          cX3(this);
          const I = this.E1.getStatus();
          this.xl = I;
          const Z = g.iF(this.E1);
          if ((this.v5 = I == 200)) {
            F == 4 && Tx(this);
            if (this.Yb) {
              for (X = !0; !this.eA && this.Fb < Z.length; ) {
                const q = giB(this, Z);
                if (q == cT) {
                  F == 4 && ((this.Ux = 4), UR(), (X = !1));
                  break;
                } else if (q == EiH) {
                  this.Ux = 4;
                  UR();
                  X = !1;
                  break;
                } else eGs(this, q);
              }
              F == 4 && Z.length == 0 && ((this.Ux = 1), UR(), (X = !1));
              this.v5 = this.v5 && X;
              X || (Tx(this), ea(this));
            } else eGs(this, Z);
            this.v5 &&
              !this.eA &&
              (F == 4 ? this.W.wX(this) : ((this.v5 = !1), vT(this)));
          } else
            (this.Ux = I == 400 && Z.indexOf("Unknown SID") > 0 ? 3 : 0),
              UR(),
              Tx(this),
              ea(this);
        }
    } catch (F) {
    } finally {
    }
  };
  g.t.cancel = function () {
    this.eA = !0;
    Tx(this);
  };
  g.t.rL = function () {
    this.Ad = null;
    const X = Date.now();
    X - this.Fa >= 0
      ? (this.mz != 2 && this.W.XS(3), Tx(this), (this.Ux = 2), UR(), ea(this))
      : vi$(this, this.Fa - X);
  };
  g.t.getLastError = function () {
    return this.Ux;
  };
  g.t = $Ux.prototype;
  g.t.Cv = null;
  g.t.Un = null;
  g.t.bc = !1;
  g.t.xm = null;
  g.t.DY = null;
  g.t.XZ = -1;
  g.t.ZC = null;
  g.t.Uv = null;
  g.t.connect = function (X) {
    this.xm = X;
    X = $m(this.W, null, this.xm);
    UR();
    Date.now();
    const F = this.W.J;
    F != null
      ? ((this.ZC = F[0]),
        (this.Uv = F[1])
          ? ((this.DY = 1), fis(this))
          : ((this.DY = 2), tb(this)))
      : (IL(X, "MODE", "init"),
        (this.Un = new ER(this)),
        (this.Un.xR = this.Cv),
        gV(this.Un, X, !1, null, !0),
        (this.DY = 0));
  };
  g.t.BF = function (X) {
    if (X) (this.DY = 2), tb(this);
    else {
      UR();
      var F = this.W;
      F.bW = F.e3.XZ;
      aW(F, 9);
    }
    X && this.XS(2);
  };
  g.t.Zm = function (X) {
    return this.W.Zm(X);
  };
  g.t.abort = function () {
    this.Un && (this.Un.cancel(), (this.Un = null));
    this.XZ = -1;
  };
  g.t.ZP = function () {
    return !1;
  };
  g.t.MJ = function (X, F) {
    this.XZ = X.xl;
    if (this.DY == 0)
      if (F) {
        try {
          var Q = this.U.parse(F);
        } catch (n) {
          X = this.W;
          X.bW = this.XZ;
          aW(X, 2);
          return;
        }
        this.ZC = Q[0];
        this.Uv = Q[1];
      } else (X = this.W), (X.bW = this.XZ), aW(X, 2);
    else
      this.DY == 2 &&
        (this.bc
          ? (UR(), Date.now())
          : F == "11111"
          ? (UR(),
            (this.bc = !0),
            Date.now(),
            (this.XZ = 200),
            this.Un.cancel(),
            UR(),
            fC(this.W, this, !0))
          : (UR(), Date.now(), (this.bc = !1)));
  };
  g.t.wX = function () {
    this.XZ = this.Un.xl;
    if (this.Un.v5)
      this.DY == 0
        ? this.Uv
          ? ((this.DY = 1), fis(this))
          : ((this.DY = 2), tb(this))
        : this.DY == 2 &&
          (this.bc
            ? (UR(), fC(this.W, this, !0))
            : (UR(), fC(this.W, this, !1)));
    else {
      this.DY == 0 ? UR() : this.DY == 2 && UR();
      var X = this.W;
      this.Un.getLastError();
      X.bW = this.XZ;
      aW(X, 2);
    }
  };
  g.t.ow = function () {
    return this.W.ow();
  };
  g.t.isActive = function () {
    return this.W.isActive();
  };
  g.t.XS = function (X) {
    this.W.XS(X);
  };
  g.t = CC.prototype;
  g.t.II = null;
  g.t.jA = null;
  g.t.vQ = null;
  g.t.Tp = null;
  g.t.jc = null;
  g.t.Cc = null;
  g.t.SM = null;
  g.t.yG = null;
  g.t.pX = 0;
  g.t.PX = 0;
  g.t.Pl = null;
  g.t.K2 = null;
  g.t.Vr = null;
  g.t.ji = null;
  g.t.e3 = null;
  g.t.bR = null;
  g.t.B$ = -1;
  g.t.mA = -1;
  g.t.bW = -1;
  g.t.YF = 0;
  g.t.hd = 0;
  g.t.oZ = 8;
  var r2s = {
    OK: 0,
    xSx: 2,
    cq: 4,
    M1: 5,
    Pl_: 6,
    STOP: 7,
    YV: 8,
    Ra: 9,
    VT: 10,
    GC: 11,
    LY: 12,
  };
  g.a1(Cmz, g.qU);
  g.a1(zGH, g.qU);
  g.t = CC.prototype;
  g.t.connect = function (X, F, Q, n, I) {
    UR();
    this.jc = F;
    this.jA = Q || {};
    n && I !== void 0 && ((this.jA.OSID = n), (this.jA.OAID = I));
    this.G ? (WT((0, g.la)(this.xr, this, X), 100), liH(this)) : this.xr(X);
  };
  g.t.disconnect = function () {
    yXx(this);
    if (this.W == 3) {
      var X = this.pX++;
      const F = this.Cc.clone();
      g.QA(F, "SID", this.Y);
      g.QA(F, "RID", X);
      g.QA(F, "TYPE", "terminate");
      KC(this, F);
      X = new ER(this, this.Y, X);
      X.mz = 2;
      X.wR = n6(F.clone());
      new Image().src = X.wR.toString();
      X.y0 = Date.now();
      vT(X);
    }
    GUh(this);
  };
  g.t.xr = function (X) {
    this.e3 = new $Ux(this);
    this.e3.Cv = this.II;
    this.e3.U = this.B;
    this.e3.connect(X);
  };
  g.t.ZP = function () {
    return this.W == 0;
  };
  g.t.getState = function () {
    return this.W;
  };
  g.t.Fr = function (X) {
    this.K2 = null;
    kUe(this, X);
  };
  g.t.zQ = function () {
    this.Vr = null;
    this.Tp = new ER(this, this.Y, "rpc", this.X);
    this.Tp.xR = this.II;
    this.Tp.zE = 0;
    var X = this.SM.clone();
    g.QA(X, "RID", "rpc");
    g.QA(X, "SID", this.Y);
    g.QA(X, "CI", this.bR ? "0" : "1");
    g.QA(X, "AID", this.B$);
    KC(this, X);
    g.QA(X, "TYPE", "xmlhttp");
    gV(this.Tp, X, !0, this.yG, !1);
  };
  g.t.MJ = function (X, F) {
    if (this.W != 0 && (this.Tp == X || this.vQ == X))
      if (((this.bW = X.xl), this.vQ == X && this.W == 3))
        if (this.oZ > 7) {
          try {
            var Q = this.B.parse(F);
          } catch (n) {
            Q = null;
          }
          if (Array.isArray(Q) && Q.length == 3)
            if (((X = Q), X[0] == 0))
              a: {
                if (!this.Vr) {
                  if (this.Tp)
                    if (this.Tp.y0 + 3e3 < this.vQ.y0)
                      ld(this), this.Tp.cancel(), (this.Tp = null);
                    else break a;
                  km(this);
                  UR();
                }
              }
            else
              (this.mA = X[1]),
                0 < this.mA - this.B$ &&
                  X[2] < 37500 &&
                  this.bR &&
                  this.hd == 0 &&
                  !this.ji &&
                  (this.ji = WT((0, g.la)(this.aS, this), 6e3));
          else aW(this, 11);
        } else F != "y2f%" && aW(this, 11);
      else if ((this.Tp == X && ld(this), !g.ol(F)))
        for (X = this.B.parse(F), F = 0; F < X.length; F++)
          (Q = X[F]),
            (this.B$ = Q[0]),
            (Q = Q[1]),
            this.W == 2
              ? Q[0] == "c"
                ? ((this.Y = Q[1]),
                  (this.yG = Q[2]),
                  (Q = Q[3]),
                  Q != null ? (this.oZ = Q) : (this.oZ = 6),
                  (this.W = 3),
                  this.Pl && this.Pl.wZ(),
                  (this.SM = $m(this, this.ow() ? this.yG : null, this.jc)),
                  aix(this))
                : Q[0] == "stop" && aW(this, 7)
              : this.W == 3 &&
                (Q[0] == "stop"
                  ? aW(this, 7)
                  : Q[0] != "noop" && this.Pl && this.Pl.CU(Q),
                (this.hd = 0));
  };
  g.t.aS = function () {
    this.ji != null &&
      ((this.ji = null), this.Tp.cancel(), (this.Tp = null), km(this), UR());
  };
  g.t.wX = function (X) {
    if (this.Tp == X) {
      ld(this);
      this.Tp = null;
      var F = 2;
    } else if (this.vQ == X) (this.vQ = null), (F = 1);
    else return;
    this.bW = X.xl;
    if (this.W != 0)
      if (X.v5)
        if (F == 1) {
          F = X.yR ? X.yR.length : 0;
          X = Date.now() - X.y0;
          var Q = Vc;
          Q.dispatchEvent(new Cmz(Q, F, X, this.YF));
          zx(this);
          this.Pl && this.Pl.eM(this, this.A);
          this.A.length = 0;
        } else aix(this);
      else {
        Q = X.getLastError();
        var n;
        if (!(n = Q == 3 || Q == 7 || (Q == 0 && this.bW > 0))) {
          if ((n = F == 1))
            this.vQ || this.K2 || this.W == 1 || this.YF >= 2
              ? (n = !1)
              : ((this.K2 = WT(
                  (0, g.la)(this.Fr, this, X),
                  DUe(this, this.YF)
                )),
                this.YF++,
                (n = !0));
          n = !(n || (F == 2 && km(this)));
        }
        if (n)
          switch (Q) {
            case 1:
              aW(this, 5);
              break;
            case 4:
              aW(this, 10);
              break;
            case 3:
              aW(this, 6);
              break;
            case 7:
              aW(this, 12);
              break;
            default:
              aW(this, 2);
          }
      }
  };
  g.t.cX = function (X) {
    if (!g.o3(arguments, this.W))
      throw Error("Unexpected channel state: " + this.W);
  };
  g.t.EK = function (X) {
    X ? UR() : (UR(), Yx$(this, 8));
  };
  g.t.Zm = function (X) {
    if (X) throw Error("Can't create secondary domain capable XhrIo object.");
    X = new g.y6();
    X.X = !1;
    return X;
  };
  g.t.isActive = function () {
    return !!this.Pl && this.Pl.isActive(this);
  };
  g.t.XS = function (X) {
    const F = Vc;
    F.dispatchEvent(new zGH(F, X));
  };
  g.t.ow = function () {
    return !1;
  };
  new K0$();
  g.t = hGT.prototype;
  g.t.wZ = function () {};
  g.t.CU = function () {};
  g.t.eM = function () {};
  g.t.Zf = function () {};
  g.t.pv = function () {};
  g.t.xs = function () {
    return {};
  };
  g.t.isActive = function () {
    return !0;
  };
  g.t = iQZ.prototype;
  g.t.enqueue = function (X) {
    this.U.push(X);
  };
  g.t.isEmpty = function () {
    return this.W.length === 0 && this.U.length === 0;
  };
  g.t.clear = function () {
    this.W = [];
    this.U = [];
  };
  g.t.contains = function (X) {
    return g.o3(this.W, X) || g.o3(this.U, X);
  };
  g.t.remove = function (X) {
    {
      var F = this.W;
      const Q = Array.prototype.lastIndexOf.call(F, X, F.length - 1);
      Q >= 0 ? (g.Zh(F, Q), (F = !0)) : (F = !1);
    }
    return F || g.qz(this.U, X);
  };
  g.t.Np = function () {
    const X = [];
    for (var F = this.W.length - 1; F >= 0; --F) X.push(this.W[F]);
    F = this.U.length;
    for (let Q = 0; Q < F; ++Q) X.push(this.U[Q]);
    return X;
  };
  var xLB = class extends g.qU {
      constructor(X) {
        super("channelMessage");
        this.message = X;
      }
    },
    wo$ = class extends g.qU {
      constructor(X) {
        super("channelError");
        this.error = X;
      }
    };
  g.a1(DE, g.ZS);
  g.t = DE.prototype;
  g.t.Is = function () {
    this.retryCount++;
    this.lZ = Math.min(3e5, this.lZ * 2);
    this.U();
    this.Um && this.start();
  };
  g.t.KZ = function () {
    return this.retryCount;
  };
  g.t.start = function () {
    const X = this.lZ + 15e3 * Math.random();
    this.W.Zl(X);
    this.Um = Date.now() + X;
  };
  g.t.stop = function () {
    this.W.stop();
    this.Um = 0;
  };
  g.t.isActive = function () {
    return this.W.isActive();
  };
  g.t.reset = function () {
    this.W.stop();
    this.retryCount = 0;
    this.lZ = 5e3;
  };
  g.a1(Ym, hGT);
  g.t = Ym.prototype;
  g.t.subscribe = function (X, F, Q) {
    return this.X.subscribe(X, F, Q);
  };
  g.t.unsubscribe = function (X, F, Q) {
    return this.X.unsubscribe(X, F, Q);
  };
  g.t.Jc = function (X) {
    return this.X.Jc(X);
  };
  g.t.publish = function (X, F) {
    return this.X.publish.apply(this.X, arguments);
  };
  g.t.dispose = function () {
    this.J ||
      ((this.J = !0),
      g.nL(this.X),
      this.disconnect(),
      g.nL(this.U),
      (this.U = null),
      (this.vS = () => ""),
      (this.sH = () => g.wQ({})));
  };
  g.t.G_ = function () {
    return this.J;
  };
  g.t.connect = async function (X, F, Q) {
    try {
      this.G && (await this.B);
    } finally {
      if (this.J || (this.W && this.W.getState() == 2 && !this.A)) return;
      this.Yb = "";
      this.A || this.U.stop();
      this.D = X || null;
      this.iT = F || 0;
      const n = this.XX + "/test",
        I = this.XX + "/bind";
      X = new CC(
        Q ? Q.firstTestResults : null,
        Q ? Q.secondTestResults : null,
        this.cS
      );
      const Z = this.W;
      Z && (Z.Pl = null);
      X.Pl = this;
      this.W = X;
      if (this.G)
        return (
          (this.B = id(this).then(() => Lvx(this, n, I, Z, Q))),
          this.B.then(() => {
            this.B = g.wQ();
          })
        );
      Lvx(this, n, I, Z, Q);
    }
  };
  g.t.disconnect = function (X) {
    try {
      this.G && (this.B.cancel(), (this.B = g.wQ()));
    } finally {
      (this.Aj = X || 0),
        this.U && this.U.stop(),
        Gx(this),
        this.W && (this.W.getState() == 3 && kUe(this.W), this.W.disconnect()),
        (this.Aj = 0);
    }
  };
  g.t.sendMessage = async function (X, F) {
    try {
      this.G && (await this.B);
    } finally {
      if (this.J) return;
      const Q = { _sc: X };
      F && g.us(Q, F);
      if (this.U.isActive() || (this.W ? this.W.getState() : 0) == 2)
        this.Y.push(Q);
      else if (this.Rk())
        try {
          this.G && !dU$(this, X) && (await id(this));
        } finally {
          this.Rk() && (dU$(this, X), Gx(this), yc(this.W, Q));
        }
    }
  };
  g.t.wZ = function () {
    this.K &&
      this.U &&
      this.U.KZ() > 0 &&
      (this.K.XsS(this.U.KZ(), this.A, !0), this.K.Vze());
    this.K && this.K.IlH();
    this.A
      ? (this.U.stop(),
        g.nL(this.U),
        (this.U = new DE(this.s2, this)),
        (this.A = !1))
      : this.U.reset();
    this.D = null;
    this.iT = 0;
    if (this.Y.length)
      if (this.G) M5z(this);
      else {
        var X = this.Y;
        this.Y = [];
        var F = X.length;
        for (let Q = 0; Q < F; ++Q) yc(this.W, X[Q]);
        rV(this);
        rV(this);
      }
    else rV(this);
  };
  g.t.Zf = function (X) {
    var F = X == 2 && this.W.bW == 401;
    X == 4 ||
      F ||
      (this.A &&
        !this.U.isActive() &&
        (g.nL(this.U), (this.U = new DE(this.s2, this)), (this.A = !1)),
      this.U.start());
    this.publish("handlerError", X, F);
    F = Object.keys(r2s).find((Q) => r2s[Q] === X);
    this.Sx.W("BROWSER_CHANNEL", F ?? "UNKNOWN");
  };
  g.t.pv = function (X, F) {
    if (!this.U.isActive()) this.publish("handlerClosed");
    else if (F) {
      const Q = F.length;
      for (let n = 0; n < Q; ++n) {
        const I = F[n].map;
        I && this.Y.push(I);
      }
    }
    this.VH.W("BROWSER_CHANNEL");
    X &&
      g.V6(
        this.QH.U,
        "/client_streamz/youtube/living_room/mdx/browser_channel/pending_maps",
        X.length
      );
    F &&
      g.V6(
        this.A$.U,
        "/client_streamz/youtube/living_room/mdx/browser_channel/undelivered_maps",
        F.length
      );
  };
  g.t.eM = function (X, F) {
    F != null && X != null && this.jx.W();
  };
  g.t.xs = function () {
    const X = { v: 2 };
    this.Yb && (X.gsessionid = this.Yb);
    this.iT != 0 && (X.ui = "" + this.iT);
    this.Aj != 0 && (X.ui = "" + this.Aj);
    this.D && g.us(X, this.D);
    return X;
  };
  g.t.CU = function (X) {
    X[0] == "S"
      ? (this.Yb = X[1])
      : X[0] == "gracefulReconnect"
      ? (this.U.start(), this.W.disconnect())
      : this.publish("handlerMessage", new rX3(X[0], X[1]));
    this.CF.W("BROWSER_CHANNEL");
  };
  g.t.Rk = function () {
    return !!this.W && this.W.getState() == 3;
  };
  g.t.PA = function (X) {
    (this.HS.loungeIdToken = X) || this.U.stop();
    if (this.ai && this.W) {
      const F = this.W.II || {};
      X
        ? (F["X-YouTube-LoungeId-Token"] = X)
        : delete F["X-YouTube-LoungeId-Token"];
      this.W.II = F;
    }
  };
  g.t.getDeviceId = function () {
    return this.HS.id;
  };
  g.t.gS = function () {
    return this.U.isActive() ? this.U.Um - Date.now() : NaN;
  };
  g.t.Vz = function () {
    var X = this.U;
    g.so(X.W);
    X.start();
  };
  g.t.s2 = function () {
    this.U.isActive();
    Sxz(this.W) == 0 && this.connect(this.D, this.iT);
  };
  xm.prototype.sendRequest = function (X, F, Q, n, I, Z, q) {
    X = {
      format: Z ? "RAW" : "JSON",
      method: X,
      context: this,
      timeout: 5e3,
      withCredentials: !!q,
      onSuccess: g.yu(this.Y, n, !Z),
      onError: g.yu(this.A, I),
      onTimeout: g.yu(this.B, I),
    };
    Q &&
      ((X.postParams = Q),
      (X.headers = { "Content-Type": "application/x-www-form-urlencoded" }));
    return g.LV(F, X);
  };
  xm.prototype.Y = function (X, F, Q, n) {
    F ? X(n) : X({ text: Q.responseText });
  };
  xm.prototype.A = function (X, F) {
    X(Error("Request error: " + F.status));
  };
  xm.prototype.B = function (X) {
    X(Error("request timed out"));
  };
  var FHT = class extends g.lm {
    constructor(X, F) {
      super();
      this.handler = X();
      this.handler.subscribe("handlerOpened", this.W, this);
      this.handler.subscribe("handlerClosed", this.onClosed, this);
      this.handler.subscribe("handlerError", (Q, n) => {
        this.onError(n);
      });
      this.handler.subscribe("handlerMessage", this.onMessage, this);
      this.U = F;
    }
    connect(X, F, Q) {
      this.handler.connect(X, F, Q);
    }
    disconnect(X) {
      this.handler.disconnect(X);
    }
    Vz() {
      this.handler.Vz();
    }
    getDeviceId() {
      return this.handler.getDeviceId();
    }
    gS() {
      return this.handler.gS();
    }
    Rk() {
      return this.handler.Rk();
    }
    W() {
      this.dispatchEvent("channelOpened");
      var X = this.handler,
        F = this.U;
      g.Fi("yt-remote-session-browser-channel", {
        firstTestResults: [""],
        secondTestResults: !X.W.bR,
        sessionId: X.W.Y,
        arrayId: X.W.B$,
      });
      g.Fi("yt-remote-session-screen-id", F);
      X = em();
      F = p6();
      g.o3(X, F) || X.push(F);
      V2s(X);
      $Y();
    }
    onClosed() {
      this.dispatchEvent("channelClosed");
    }
    onMessage(X) {
      this.dispatchEvent(new xLB(X));
    }
    onError(X) {
      this.dispatchEvent(new wo$(X ? 1 : 0));
    }
    sendMessage(X, F) {
      this.handler.sendMessage(X, F);
    }
    PA(X) {
      this.handler.PA(X);
    }
    dispose() {
      this.handler.dispose();
    }
  };
  var X8Z = class {
    constructor(X, F, Q = () => "") {
      new AXs();
      var n = new g.Kx();
      this.pathPrefix = X;
      this.W = F;
      this.HS = Q;
      this.B = n;
      this.G = null;
      this.J = this.X = 0;
      this.channel = null;
      this.K = 0;
      this.A = new DE(() => {
        this.A.isActive();
        this.channel?.Y().U() === 0 && this.connect(this.G, this.X);
      });
      this.Y = {};
      this.U = {};
      this.iT = !1;
      this.logger = null;
      this.D = [];
      this.Xh = void 0;
      this.vS = new xUS();
      this.Aj = new wdh();
      this.NS = new mUT();
      this.Yb = new JXy();
    }
    connect(X = {}, F = 0) {
      this.K !== 2 &&
        (this.A.stop(),
        (this.G = X),
        (this.X = F),
        HT(this),
        (X = g.G("ID_TOKEN"))
          ? (this.Y["x-youtube-identity-token"] = X)
          : delete this.Y["x-youtube-identity-token"],
        this.W &&
          ((this.U.device = this.W.device),
          (this.U.name = this.W.name),
          (this.U.app = this.W.app),
          (this.U.id = this.W.id),
          this.W.kY && (this.U.mdxVersion = `${this.W.kY}`),
          this.W.theme && (this.U.theme = this.W.theme),
          this.W.capabilities && (this.U.capabilities = this.W.capabilities),
          this.W.SE && (this.U.cst = this.W.SE),
          this.W.authuser && (this.U.authuser = this.W.authuser),
          this.W.pageId && (this.U.pageId = this.W.pageId)),
        this.X !== 0 ? (this.U.ui = `${this.X}`) : delete this.U.ui,
        Object.assign(this.U, this.G),
        (this.channel = new RW(this.pathPrefix, {
          Wn: "gsessionid",
          De: this.Y,
          Ig: this.U,
        })),
        this.channel.open(),
        (this.K = 2),
        bQz(this));
    }
    disconnect(X = 0) {
      this.J = X;
      this.A.stop();
      HT(this);
      this.channel &&
        (this.J !== 0 ? (this.U.ui = `${this.J}`) : delete this.U.ui,
        this.channel.close());
      this.J = 0;
    }
    gS() {
      return this.A.isActive() ? this.A.Um - Date.now() : NaN;
    }
    Vz() {
      var X = this.A;
      g.so(X.W);
      X.start();
    }
    sendMessage(X, F) {
      this.channel && (HT(this), this.channel.send({ _sc: X, ...F }));
    }
    PA(X) {
      X || this.A.stop();
      X
        ? (this.Y["X-YouTube-LoungeId-Token"] = X)
        : delete this.Y["X-YouTube-LoungeId-Token"];
    }
    getDeviceId() {
      return this.W ? this.W.id : "";
    }
    publish(X, ...F) {
      return this.B.publish(X, ...F);
    }
    subscribe(X, F, Q) {
      return this.B.subscribe(X, F, Q);
    }
    unsubscribe(X, F, Q) {
      return this.B.unsubscribe(X, F, Q);
    }
    Jc(X) {
      return this.B.Jc(X);
    }
    dispose() {
      this.iT ||
        ((this.iT = !0),
        g.nL(this.B),
        this.disconnect(),
        g.nL(this.A),
        (this.HS = () => ""));
    }
    G_() {
      return this.iT;
    }
  };
  var seh = class extends g.lm {
    constructor(X) {
      super();
      this.W = X();
      this.W.subscribe("webChannelOpened", this.U, this);
      this.W.subscribe("webChannelClosed", this.onClosed, this);
      this.W.subscribe("webChannelError", this.onError, this);
      this.W.subscribe("webChannelMessage", this.onMessage, this);
    }
    connect(X, F) {
      this.W.connect(X, F);
    }
    disconnect(X) {
      this.W.disconnect(X);
    }
    Vz() {
      this.W.Vz();
    }
    getDeviceId() {
      return this.W.getDeviceId();
    }
    gS() {
      return this.W.gS();
    }
    Rk() {
      return this.W.K === 3;
    }
    U() {
      this.dispatchEvent("channelOpened");
    }
    onClosed() {
      this.dispatchEvent("channelClosed");
    }
    onMessage(X) {
      this.dispatchEvent(new xLB(X));
    }
    onError() {
      this.dispatchEvent(new wo$(this.W.Xh === 401 ? 1 : 0));
    }
    sendMessage(X, F) {
      this.W.sendMessage(X, F);
    }
    PA(X) {
      this.W.PA(X);
    }
    dispose() {
      this.W.dispose();
    }
  };
  var AUZ = Date.now(),
    m1 = null,
    ud = Array(50),
    LC = -1,
    dV = !1;
  g.a1(Mn, g.Xx);
  Mn.prototype.ql = function () {
    return this.screens;
  };
  Mn.prototype.contains = function (X) {
    return !!v0(this.screens, X);
  };
  Mn.prototype.get = function (X) {
    return X ? c0(this.screens, X) : null;
  };
  Mn.prototype.info = function (X) {
    Jb(this.K, X);
  };
  var mLZ = class extends g.Xx {
      constructor(X, F, Q, n, I) {
        super();
        this.Y = X;
        this.D = F;
        this.G = Q;
        this.iT = n;
        this.J = I;
        this.U = 0;
        this.W = null;
        this.xJ = NaN;
      }
      start() {
        !this.W && isNaN(this.xJ) && this.A();
      }
      stop() {
        this.W && (this.W.abort(), (this.W = null));
        isNaN(this.xJ) || (g.iB(this.xJ), (this.xJ = NaN));
      }
      hj() {
        this.stop();
        super.hj();
      }
      A() {
        this.xJ = NaN;
        this.W = g.LV(wV(this.Y, "/pairing/get_screen"), {
          method: "POST",
          postParams: { pairing_code: this.D },
          timeout: 5e3,
          onSuccess: (0, g.la)(this.K, this),
          onError: (0, g.la)(this.B, this),
          onTimeout: (0, g.la)(this.X, this),
        });
      }
      K(X, F) {
        this.W = null;
        X = F.screen || {};
        X.dialId = this.G;
        X.name = this.iT;
        F = -1;
        this.J &&
          X.shortLivedLoungeToken &&
          X.shortLivedLoungeToken.value &&
          X.shortLivedLoungeToken.refreshIntervalMs &&
          ((X.screenIdType = "shortLived"),
          (X.loungeToken = X.shortLivedLoungeToken.value),
          (F = X.shortLivedLoungeToken.refreshIntervalMs));
        this.publish("pairingComplete", new W0(X), F);
      }
      B(X) {
        this.W = null;
        X.status && X.status == 404
          ? this.U >= Hn$.length
            ? this.publish("pairingFailed", Error("DIAL polling timed out"))
            : ((X = Hn$[this.U]),
              (this.xJ = g.Gg((0, g.la)(this.A, this), X)),
              this.U++)
          : this.publish("pairingFailed", Error("Server error " + X.status));
      }
      X() {
        this.W = null;
        this.publish("pairingFailed", Error("Server not responding"));
      }
    },
    Hn$ = [2e3, 2e3, 1e3, 1e3, 1e3, 2e3, 2e3, 5e3, 5e3, 1e4];
  g.a1(bd, Mn);
  g.t = bd.prototype;
  g.t.start = function () {
    BT(this) && this.publish("screenChange");
    !g.o9("yt-remote-lounge-token-expiration") && VYs(this);
    g.iB(this.W);
    this.W = g.Gg((0, g.la)(this.start, this), 1e4);
  };
  g.t.add = function (X, F) {
    BT(this);
    RND(this, X);
    sR(this, !1);
    this.publish("screenChange");
    F(X);
    X.token || VYs(this);
  };
  g.t.remove = function (X, F) {
    let Q = BT(this);
    WHy(this, X) && (sR(this, !1), (Q = !0));
    F(X);
    Q && this.publish("screenChange");
  };
  g.t.Dt = function (X, F, Q, n) {
    let I = BT(this);
    const Z = this.get(X.id);
    Z
      ? (Z.name != F && ((Z.name = F), sR(this, !1), (I = !0)), Q(X))
      : n(Error("no such local screen."));
    I && this.publish("screenChange");
  };
  g.t.hj = function () {
    g.iB(this.W);
    bd.Td.hj.call(this);
  };
  g.t.uB = function (X) {
    BT(this);
    let F = this.screens.length;
    X = (X && X.screens) || [];
    const Q = X.length;
    for (let n = 0; n < Q; ++n) {
      const I = X[n],
        Z = this.get(I.screenId);
      Z && ((Z.token = I.loungeToken), --F);
    }
    sR(this, !F);
    F && Jb(this.K, "Missed " + F + " lounge tokens.");
  };
  g.t.J_ = function (X) {
    Jb(this.K, "Requesting lounge tokens failed: " + X);
  };
  var $ps = class extends g.Xx {
    constructor(X, F) {
      super();
      this.K = F;
      F = (F = g.o9("yt-remote-online-screen-ids") || "") ? F.split(",") : [];
      const Q = {},
        n = this.K(),
        I = n.length;
      for (let Z = 0; Z < I; ++Z) {
        const q = n[Z].id;
        Q[q] = g.o3(F, q);
      }
      this.W = Q;
      this.B = X;
      this.A = this.Y = NaN;
      this.U = null;
      Xj("Initialized with " + g.pg(this.W));
    }
    start() {
      const X = parseInt(g.o9("yt-remote-fast-check-period") || "0", 10);
      (this.Y = g.Su() - 144e5 < X ? 0 : X)
        ? Fj(this)
        : ((this.Y = g.Su() + 3e5),
          g.Fi("yt-remote-fast-check-period", this.Y),
          this.X());
    }
    isEmpty() {
      return g.w$(this.W);
    }
    update() {
      Xj("Updating availability on schedule.");
      const X = this.K(),
        F = g.ls(
          this.W,
          function (Q, n) {
            return Q && !!c0(X, n);
          },
          this
        );
      ob(this, F);
    }
    hj() {
      g.iB(this.A);
      this.A = NaN;
      this.U && (this.U.abort(), (this.U = null));
      super.hj();
    }
    X() {
      g.iB(this.A);
      this.A = NaN;
      this.U && this.U.abort();
      const X = EjH(this);
      if (Zk(X)) {
        var F = wV(this.B, "/pairing/get_screen_availability"),
          Q = { lounge_token: g.YZ(X).join(",") };
        this.U = this.B.sendRequest(
          "POST",
          F,
          Q,
          (0, g.la)(this.J, this, X),
          (0, g.la)(this.G, this)
        );
      } else ob(this, {}), Fj(this);
    }
    J(X, F) {
      this.U = null;
      var Q = g.YZ(EjH(this));
      if (g.fB(Q, g.YZ(X))) {
        F = F.screens || [];
        Q = {};
        var n = F.length;
        for (let I = 0; I < n; ++I)
          Q[X[F[I].loungeToken]] = F[I].status == "online";
        ob(this, Q);
        Fj(this);
      } else this.Ws("Changing Screen set during request."), this.X();
    }
    G(X) {
      this.Ws("Screen availability failed: " + X);
      this.U = null;
      Fj(this);
    }
    Ws(X) {
      Jb("OnlineScreenService", X);
    }
  };
  g.a1(nq, Mn);
  g.t = nq.prototype;
  g.t.start = function () {
    this.U.start();
    this.W.start();
    this.screens.length &&
      (this.publish("screenChange"),
      this.W.isEmpty() || this.publish("onlineScreenChange"));
  };
  g.t.add = function (X, F, Q) {
    this.U.add(X, F, Q);
  };
  g.t.remove = function (X, F, Q) {
    this.U.remove(X, F, Q);
    this.W.update();
  };
  g.t.Dt = function (X, F, Q, n) {
    this.U.contains(X)
      ? this.U.Dt(X, F, Q, n)
      : ((X = "Updating name of unknown screen: " + X.name),
        Jb(this.K, X),
        n(Error(X)));
  };
  g.t.ql = function (X) {
    return X
      ? this.screens
      : g.Ae(
          this.screens,
          g.JD(
            this.A,
            function (F) {
              return !this.contains(F);
            },
            this
          )
        );
  };
  g.t.ym = function () {
    return g.JD(
      this.ql(!0),
      function (X) {
        return !!this.W.W[X.id];
      },
      this
    );
  };
  g.t.ox = function (X, F, Q, n, I, Z) {
    this.info("getDialScreenByPairingCode " + X + " / " + F);
    const q = new mLZ(this.Y, X, F, Q, n);
    q.subscribe("pairingComplete", (N, A) => {
      g.nL(q);
      I(Ib(this, N), A);
    });
    q.subscribe("pairingFailed", (N) => {
      g.nL(q);
      Z(N);
    });
    q.start();
    return (0, g.la)(q.stop, q);
  };
  g.t.Dh = function (X, F, Q, n) {
    g.LV(wV(this.Y, "/pairing/get_screen"), {
      method: "POST",
      postParams: { pairing_code: X },
      timeout: 5e3,
      onSuccess: (0, g.la)(function (I, Z) {
        I = new W0(Z.screen || {});
        if (!I.name || eNB(this, I.name)) {
          a: {
            Z = I.name;
            let q = 2,
              N = F(Z, q);
            for (; eNB(this, N); ) {
              q++;
              if (q > 20) break a;
              N = F(Z, q);
            }
            Z = N;
          }
          I.name = Z;
        }
        Q(Ib(this, I));
      }, this),
      onError: (0, g.la)(function (I) {
        n(Error("pairing request failed: " + I.status));
      }, this),
      onTimeout: (0, g.la)(function () {
        n(Error("pairing request timed out."));
      }, this),
    });
  };
  g.t.hj = function () {
    g.nL(this.U);
    g.nL(this.W);
    nq.Td.hj.call(this);
  };
  g.t.Dv = function () {
    p8T(this);
    this.publish("screenChange");
    this.W.update();
  };
  nq.prototype.dispose = nq.prototype.dispose;
  g.a1(q7, g.Xx);
  g.t = q7.prototype;
  g.t.Tz = function (X) {
    this.G_() ||
      (X && (AQ(this, "" + X), this.publish("sessionFailed")),
      (this.W = null),
      this.publish("sessionScreen", null));
  };
  g.t.info = function (X) {
    Jb(this.Yb, X);
  };
  g.t.jM = function () {
    return null;
  };
  g.t.O5 = function (X) {
    const F = this.U;
    X
      ? ((F.displayStatus = new chrome.cast.ReceiverDisplayStatus(X, [])),
        (F.displayStatus.showStop = !0))
      : (F.displayStatus = null);
    chrome.cast.setReceiverDisplayStatus(
      F,
      (0, g.la)(function () {
        this.info("Updated receiver status for " + F.friendlyName + ": " + X);
      }, this),
      (0, g.la)(function () {
        AQ(this, "Failed to update receiver status for: " + F.friendlyName);
      }, this)
    );
  };
  g.t.hj = function () {
    this.O5("");
    q7.Td.hj.call(this);
  };
  var t$ = class extends q7 {
    constructor(X, F, Q) {
      super(X, F, "CastSession");
      this.config_ = Q;
      this.A = null;
      this.D = (0, g.la)(this.vS, this);
      this.HS = (0, g.la)(this.sH, this);
      this.iT = g.Gg(() => {
        zND(this, null);
      }, 12e4);
      this.G = this.B = this.X = this.J = 0;
    }
    Aj(X) {
      if (this.A) {
        if (this.A == X) return;
        AQ(this, "Overriding cast session with new session object");
        lqB(this);
        this.A.removeUpdateListener(this.D);
        this.A.removeMessageListener(
          "urn:x-cast:com.google.youtube.mdx",
          this.HS
        );
      }
      this.A = X;
      this.A.addUpdateListener(this.D);
      this.A.addMessageListener("urn:x-cast:com.google.youtube.mdx", this.HS);
      yUD(this, "getMdxSessionStatus");
    }
    K(X) {
      this.info("launchWithParams no-op for Cast: " + g.pg(X));
    }
    stop() {
      this.A
        ? this.A.stop(
            (0, g.la)(function () {
              this.Tz();
            }, this),
            (0, g.la)(function () {
              this.Tz(Error("Failed to stop receiver app."));
            }, this)
          )
        : this.Tz(Error("Stopping cast device without session."));
    }
    O5() {}
    hj() {
      this.info("disposeInternal");
      lqB(this);
      this.A &&
        (this.A.removeUpdateListener(this.D),
        this.A.removeMessageListener(
          "urn:x-cast:com.google.youtube.mdx",
          this.HS
        ));
      this.A = null;
      super.hj();
    }
    sH(X, F) {
      if (!this.G_())
        if (F)
          if (((F = q5(F)), g.tD(F)))
            switch (
              ((X = "" + F.type),
              (F = F.data || {}),
              this.info("onYoutubeMessage_: " + X + " " + g.pg(F)),
              X)
            ) {
              case "mdxSessionStatus":
                zND(this, F);
                break;
              case "loungeToken":
                SIH(this, F);
                break;
              default:
                AQ(this, "Unknown youtube message: " + X);
            }
          else AQ(this, "Unable to parse message.");
        else AQ(this, "No data in message.");
    }
    NS(X, F, Q, n) {
      g.iB(this.J);
      this.J = 0;
      cUD(
        this.Y,
        this.U.label,
        X,
        this.U.friendlyName,
        (0, g.la)(function (I) {
          I
            ? F(I)
            : n >= 0
            ? (AQ(
                this,
                "Screen " +
                  X +
                  " appears to be offline. " +
                  n +
                  " retries left."
              ),
              (this.J = g.Gg((0, g.la)(this.NS, this, X, F, Q, n - 1), 300)))
            : Q(Error("Unable to fetch screen."));
        }, this),
        Q
      );
    }
    jM() {
      return this.A;
    }
    vS(X) {
      this.G_() || X || (AQ(this, "Cast session died."), this.Tz());
    }
  };
  var J2T = class extends q7 {
    constructor(X, F, Q, n) {
      super(X, F, "DialSession");
      this.config_ = n;
      this.A = this.J = null;
      this.HS = "";
      this.sH = Q;
      this.vS = null;
      this.D = () => {};
      this.iT = NaN;
      this.NS = (0, g.la)(this.XX, this);
      this.B = () => {};
      this.G = this.X = 0;
    }
    Aj(X) {
      this.A = X;
      this.A.addUpdateListener(this.NS);
    }
    K(X) {
      this.vS = X;
      this.D();
    }
    stop() {
      YIh(this);
      this.A
        ? this.A.stop(
            (0, g.la)(this.Tz, this, null),
            (0, g.la)(this.Tz, this, "Failed to stop DIAL device.")
          )
        : this.Tz();
    }
    hj() {
      YIh(this);
      this.A && this.A.removeUpdateListener(this.NS);
      this.A = null;
      super.hj();
    }
    XX(X) {
      this.G_() ||
        X ||
        (AQ(this, "DIAL session died."),
        this.B(),
        (this.B = () => {}),
        this.Tz());
    }
  };
  var jyD = class extends q7 {
    constructor(X, F) {
      super(X, F, "ManualSession");
      this.A = g.Gg((0, g.la)(this.K, this, null), 150);
    }
    stop() {
      this.Tz();
    }
    Aj() {}
    K() {
      g.iB(this.A);
      this.A = NaN;
      const X = c0(this.Y.ql(), this.U.label);
      X ? N7(this, X) : this.Tz(Error("No such screen"));
    }
    hj() {
      g.iB(this.A);
      this.A = NaN;
      super.hj();
    }
  };
  var y2 = class extends g.Xx {
    constructor(X, F) {
      super();
      this.config_ = F;
      this.U = X;
      this.Aj = F.appId || "233637DE";
      this.Y = F.theme || "cl";
      this.Yb = F.disableCastApi || !1;
      this.X = F.forceMirroring || !1;
      this.W = null;
      this.G = !1;
      this.A = [];
      this.K = (0, g.la)(this.vS, this);
    }
    init(X, F) {
      chrome.cast.timeout.requestSession = 3e4;
      var Q = new chrome.cast.SessionRequest(this.Aj, [
        chrome.cast.Capability.AUDIO_OUT,
      ]);
      g.wi("desktop_enable_cast_connect") && (Q.androidReceiverCompatible = !0);
      this.Yb || (Q.dialRequest = new chrome.cast.DialRequest("YouTube"));
      const n = chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED;
      X =
        X || this.X
          ? chrome.cast.DefaultActionPolicy.CAST_THIS_TAB
          : chrome.cast.DefaultActionPolicy.CREATE_SESSION;
      const I = (0, g.la)(this.sH, this);
      Q = new chrome.cast.ApiConfig(Q, (0, g.la)(this.J, this), I, n, X);
      Q.customDialLaunchCallback = (0, g.la)(this.NS, this);
      chrome.cast.initialize(
        Q,
        (0, g.la)(function () {
          this.G_() ||
            (chrome.cast.addReceiverActionListener(this.K),
            Zgx(),
            this.U.subscribe("onlineScreenChange", (0, g.la)(this.B, this)),
            (this.A = w83(this)),
            chrome.cast.setCustomReceivers(
              this.A,
              () => {},
              (0, g.la)(function (Z) {
                this.Ws("Failed to set initial custom receivers: " + g.pg(Z));
              }, this)
            ),
            this.publish("yt-remote-cast2-availability-change", E5(this)),
            F(!0));
        }, this),
        (0, g.la)(function (Z) {
          this.Ws("Failed to initialize API: " + g.pg(Z));
          F(!1);
        }, this)
      );
    }
    VH(X, F) {
      gh("Setting connected screen ID: " + X + " -> " + F);
      if (this.W) {
        var Q = this.W.W;
        if (!X || (Q && Q.id != X))
          gh("Unsetting old screen status: " + this.W.U.friendlyName),
            vj(this, null);
      }
      if (X && F) {
        if (!this.W) {
          X = c0(this.U.ql(), X);
          if (!X) {
            gh("setConnectedScreenStatus: Unknown screen.");
            return;
          }
          if (X.idType == "shortLived") {
            gh(
              "setConnectedScreenStatus: Screen with id type to be short lived."
            );
            return;
          }
          Q = xpT(this, X);
          Q ||
            (gh("setConnectedScreenStatus: Connected receiver not custom..."),
            (Q = new chrome.cast.Receiver(X.uuid ? X.uuid : X.id, X.name)),
            (Q.receiverType = chrome.cast.ReceiverType.CUSTOM),
            this.A.push(Q),
            chrome.cast.setCustomReceivers(
              this.A,
              () => {},
              (0, g.la)(function (n) {
                this.Ws("Failed to set initial custom receivers: " + g.pg(n));
              }, this)
            ));
          gh(
            "setConnectedScreenStatus: new active receiver: " + Q.friendlyName
          );
          vj(this, new jyD(this.U, Q), !0);
        }
        this.W.O5(F);
      } else gh("setConnectedScreenStatus: no screen.");
    }
    Sx(X) {
      this.G_()
        ? this.Ws("Setting connection data on disposed cast v2")
        : this.W
        ? this.W.K(X)
        : this.Ws("Setting connection data without a session");
    }
    HS() {
      this.G_()
        ? this.Ws("Stopping session on disposed cast v2")
        : this.W
        ? (this.W.stop(), vj(this, null))
        : gh("Stopping non-existing session");
    }
    requestSession() {
      chrome.cast.requestSession(
        (0, g.la)(this.J, this),
        (0, g.la)(this.XX, this)
      );
    }
    hj() {
      this.U.unsubscribe("onlineScreenChange", (0, g.la)(this.B, this));
      window.chrome &&
        chrome.cast &&
        chrome.cast.removeReceiverActionListener(this.K);
      var X = Q2e;
      const F = g.cP("yt.mdx.remote.debug.handlers_");
      g.qz(F || [], X);
      g.nL(this.W);
      super.hj();
    }
    Ws(X) {
      Jb("Controller", X);
    }
    iT(X, F) {
      this.W == X &&
        (F || vj(this, null),
        this.publish("yt-remote-cast2-session-change", F));
    }
    vS(X, F) {
      if (!this.G_())
        if (X)
          switch (
            ((X.friendlyName = chrome.cast.unescape(X.friendlyName)),
            gh(
              "onReceiverAction_ " +
                X.label +
                " / " +
                X.friendlyName +
                "-- " +
                F
            ),
            F)
          ) {
            case chrome.cast.ReceiverAction.CAST:
              if (this.W)
                if (this.W.U.label != X.label)
                  gh(
                    "onReceiverAction_: Stopping active receiver: " +
                      this.W.U.friendlyName
                  ),
                    this.W.stop();
                else {
                  gh("onReceiverAction_: Casting to active receiver.");
                  this.W.W &&
                    this.publish("yt-remote-cast2-session-change", this.W.W);
                  break;
                }
              switch (X.receiverType) {
                case chrome.cast.ReceiverType.CUSTOM:
                  vj(this, new jyD(this.U, X));
                  break;
                case chrome.cast.ReceiverType.DIAL:
                  vj(this, new J2T(this.U, X, this.Y, this.config_));
                  break;
                case chrome.cast.ReceiverType.CAST:
                  vj(this, new t$(this.U, X, this.config_));
                  break;
                default:
                  this.Ws("Unknown receiver type: " + X.receiverType);
              }
              break;
            case chrome.cast.ReceiverAction.STOP:
              this.W && this.W.U.label == X.label
                ? this.W.stop()
                : this.Ws("Stopping receiver w/o session: " + X.friendlyName);
          }
        else this.Ws("onReceiverAction_ called without receiver.");
    }
    NS(X) {
      if (this.G_()) return Promise.reject(Error("disposed"));
      var F = X.receiver;
      F.receiverType != chrome.cast.ReceiverType.DIAL &&
        (this.Ws("Not DIAL receiver: " + F.friendlyName),
        (F.receiverType = chrome.cast.ReceiverType.DIAL));
      var Q = this.W ? this.W.U : null;
      if (!Q || Q.label != F.label)
        return (
          this.Ws(
            "Receiving DIAL launch request for non-clicked DIAL receiver: " +
              F.friendlyName
          ),
          Promise.reject(Error("illegal DIAL launch"))
        );
      if (
        Q &&
        Q.label == F.label &&
        Q.receiverType != chrome.cast.ReceiverType.DIAL
      ) {
        if (this.W.W)
          return (
            gh("Reselecting dial screen."),
            this.publish("yt-remote-cast2-session-change", this.W.W),
            Promise.resolve(new chrome.cast.DialLaunchResponse(!1))
          );
        this.Ws(
          'Changing CAST intent from "' +
            Q.receiverType +
            '" to "dial" for ' +
            F.friendlyName
        );
        vj(this, new J2T(this.U, F, this.Y, this.config_));
      }
      F = this.W;
      F.J = X;
      F.J.appState == chrome.cast.DialAppState.RUNNING
        ? ((X = F.J.extraData || {}),
          (Q = X.screenId || null),
          V2(F) && X.loungeToken
            ? X.loungeTokenRefreshIntervalMs
              ? (X = rUs(
                  F,
                  {
                    name: F.U.friendlyName,
                    screenId: X.screenId,
                    loungeToken: X.loungeToken,
                    dialId: F.J.receiver.label,
                    screenIdType: "shortLived",
                  },
                  X.loungeTokenRefreshIntervalMs
                ))
              : (g.WM(
                  Error(
                    `No loungeTokenRefreshIntervalMs presents in additionalData: ${JSON.stringify(
                      X
                    )}.`
                  )
                ),
                (X = hNB(F, Q)))
            : (X = hNB(F, Q)))
        : (X = Wj(F));
      return X;
    }
    J(X) {
      if (!this.G_() && !this.X) {
        gh("New cast session ID: " + X.sessionId);
        var F = X.receiver;
        if (F.receiverType != chrome.cast.ReceiverType.CUSTOM) {
          if (!this.W)
            if (F.receiverType == chrome.cast.ReceiverType.CAST)
              gh("Got resumed cast session before resumed mdx connection."),
                (F.friendlyName = chrome.cast.unescape(F.friendlyName)),
                vj(this, new t$(this.U, F, this.config_), !0);
            else {
              this.Ws(
                "Got non-cast session without previous mdx receiver event, or mdx resume."
              );
              return;
            }
          var Q = this.W.U,
            n = c0(this.U.ql(), Q.label);
          n &&
            VH(n, F.label) &&
            Q.receiverType != chrome.cast.ReceiverType.CAST &&
            F.receiverType == chrome.cast.ReceiverType.CAST &&
            (gh(
              "onSessionEstablished_: manual to cast session change " +
                F.friendlyName
            ),
            g.nL(this.W),
            (this.W = new t$(this.U, F, this.config_)),
            this.W.subscribe("sessionScreen", (0, g.la)(this.iT, this, this.W)),
            this.W.subscribe("sessionFailed", () => HgH(this, this.W)),
            this.W.K(null));
          this.W.Aj(X);
        }
      }
    }
    D() {
      return this.W ? this.W.jM() : null;
    }
    XX(X) {
      this.G_() ||
        (this.Ws("Failed to estabilish a session: " + g.pg(X)),
        X.code != chrome.cast.ErrorCode.CANCEL && vj(this, null),
        this.publish("yt-remote-cast2-session-failed"));
    }
    sH(X) {
      gh("Receiver availability updated: " + X);
      if (!this.G_()) {
        var F = E5(this);
        this.G = X == chrome.cast.ReceiverAvailability.AVAILABLE;
        E5(this) != F &&
          this.publish("yt-remote-cast2-availability-change", E5(this));
      }
    }
    B() {
      this.G_() ||
        ((this.A = w83(this)),
        gh("Updating custom receivers: " + g.pg(this.A)),
        chrome.cast.setCustomReceivers(
          this.A,
          () => {},
          (0, g.la)(function () {
            this.Ws("Failed to set custom receivers.");
          }, this)
        ),
        this.publish("yt-remote-cast2-availability-change", E5(this)));
    }
  };
  y2.prototype.setLaunchParams = y2.prototype.Sx;
  y2.prototype.setConnectedScreenStatus = y2.prototype.VH;
  y2.prototype.stopSession = y2.prototype.HS;
  y2.prototype.getCastSession = y2.prototype.D;
  y2.prototype.requestSession = y2.prototype.requestSession;
  y2.prototype.init = y2.prototype.init;
  y2.prototype.dispose = y2.prototype.dispose;
  var fq = [],
    LH$ = (0, g.iM)`https://www.gstatic.com/cv/js/sender/v1/cast_sender.js`;
  g.t = SK.prototype;
  g.t.reset = function (X) {
    this.listId = "";
    this.index = -1;
    this.videoId = "";
    Kq(this);
    this.volume = -1;
    this.muted = !1;
    X &&
      ((this.index = X.index),
      (this.listId = X.listId),
      (this.videoId = X.videoId),
      (this.playerState = X.playerState),
      (this.volume = X.volume),
      (this.muted = X.muted),
      (this.audioTrackId = X.audioTrackId),
      (this.trackData = X.trackData),
      (this.hasPrevious = X.hasPrevious),
      (this.hasNext = X.hasNext),
      (this.K = X.playerTime),
      (this.B = X.playerTimeAt),
      (this.U = X.seekableStart),
      (this.X = X.seekableEnd),
      (this.A = X.duration),
      (this.loadedTime = X.loadedTime),
      (this.W = X.liveIngestionTime),
      (this.Y = !isNaN(this.W)));
  };
  g.t.isPlaying = function () {
    return this.playerState == 1;
  };
  g.t.isBuffering = function () {
    return this.playerState == 3;
  };
  g.t.j8 = function (X) {
    this.A = isNaN(X) ? 0 : X;
  };
  g.t.getDuration = function () {
    return this.Y ? this.A + kP(this) : this.A;
  };
  g.t.clone = function () {
    return new SK(Gr(this));
  };
  var P2B = class extends g.Xx {
    constructor() {
      var X = qu();
      super();
      this.A = 0;
      this.Y = X;
      this.X = [];
      this.B = new iQZ();
      this.U = this.W = null;
      this.D = (0, g.la)(this.vS, this);
      this.J = (0, g.la)(this.K, this);
      this.iT = (0, g.la)(this.NS, this);
      this.Yb = (0, g.la)(this.sH, this);
      let F = 0;
      X
        ? ((F = X.getProxyState()),
          F != 3 && (X.subscribe("proxyStateChange", this.Aj, this), o0e(this)))
        : (F = 3);
      F != 0 &&
        g.Gg(() => {
          this.Aj(F);
        }, 0);
      (X = s2T()) && hQ(this, X);
      this.subscribe("yt-remote-cast2-session-change", this.Yb);
    }
    getState() {
      return this.A;
    }
    gS() {
      return this.Y.getReconnectTimeout();
    }
    Vz() {
      this.Y.reconnect();
    }
    play() {
      rh(this)
        ? (this.W
            ? this.W.play(null, g.pv, wh(this, "play"))
            : xP(this, "play"),
          mp(this, 1, DG(i8(this))),
          this.publish("remotePlayerChange"))
        : JQ(this, this.play);
    }
    pause() {
      rh(this)
        ? (this.W
            ? this.W.pause(null, g.pv, wh(this, "pause"))
            : xP(this, "pause"),
          mp(this, 2, DG(i8(this))),
          this.publish("remotePlayerChange"))
        : JQ(this, this.pause);
    }
    seekTo(X) {
      if (rh(this)) {
        if (this.W) {
          const F = i8(this),
            Q = new chrome.cast.media.SeekRequest();
          Q.currentTime = X;
          F.isPlaying() || F.isBuffering()
            ? (Q.resumeState = chrome.cast.media.ResumeState.PLAYBACK_START)
            : (Q.resumeState = chrome.cast.media.ResumeState.PLAYBACK_PAUSE);
          this.W.seek(Q, g.pv, wh(this, "seekTo", { newTime: X }));
        } else xP(this, "seekTo", { newTime: X });
        mp(this, 3, X);
        this.publish("remotePlayerChange");
      } else JQ(this, g.yu(this.seekTo, X));
    }
    stop() {
      if (rh(this)) {
        this.W
          ? this.W.stop(null, g.pv, wh(this, "stopVideo"))
          : xP(this, "stopVideo");
        var X = i8(this);
        X.index = -1;
        X.videoId = "";
        Kq(X);
        Hj(this, X);
        this.publish("remotePlayerChange");
      } else JQ(this, this.stop);
    }
    setVolume(X, F) {
      if (rh(this)) {
        var Q = i8(this);
        if (this.U) {
          if (Q.volume != X) {
            const n = Math.round(X) / 100;
            this.U.setReceiverVolumeLevel(
              n,
              (0, g.la)(function () {
                PT("set receiver volume: " + n);
              }, this),
              (0, g.la)(function () {
                this.Ws("failed to set receiver volume.");
              }, this)
            );
          }
          Q.muted != F &&
            this.U.setReceiverMuted(
              F,
              (0, g.la)(function () {
                PT("set receiver muted: " + F);
              }, this),
              (0, g.la)(function () {
                this.Ws("failed to set receiver muted.");
              }, this)
            );
        } else {
          const n = { volume: X, muted: F };
          Q.volume != -1 && (n.delta = X - Q.volume);
          xP(this, "setVolume", n);
        }
        Q.muted = F;
        Q.volume = X;
        Hj(this, Q);
      } else JQ(this, g.yu(this.setVolume, X, F));
    }
    G(X, F) {
      if (rh(this)) {
        var Q = i8(this);
        X = { videoId: X };
        F &&
          ((Q.trackData = {
            trackName: F.name,
            languageCode: F.languageCode,
            sourceLanguageCode: F.translationLanguage
              ? F.translationLanguage.languageCode
              : "",
            languageName: F.languageName,
            kind: F.kind,
          }),
          (X.style = g.pg(F.style)),
          g.us(X, Q.trackData));
        xP(this, "setSubtitlesTrack", X);
        Hj(this, Q);
      } else JQ(this, g.yu(this.G, X, F));
    }
    setAudioTrack(X, F) {
      rh(this)
        ? ((F = F.getLanguageInfo().getId()),
          xP(this, "setAudioTrack", { videoId: X, audioTrackId: F }),
          (X = i8(this)),
          (X.audioTrackId = F),
          Hj(this, X))
        : JQ(this, g.yu(this.setAudioTrack, X, F));
    }
    playVideo(X, F, Q, n = null, I = null, Z = null, q = null) {
      const N = i8(this),
        A = { videoId: X };
      Q !== void 0 && (A.currentIndex = Q);
      YP(N, X, Q || 0);
      F !== void 0 && (ab(N, F), (A.currentTime = F));
      n && (A.listId = n);
      I && (A.playerParams = I);
      Z && (A.clickTrackingParams = Z);
      q && (A.locationInfo = g.pg(q));
      xP(this, "setPlaylist", A);
      n || Hj(this, N);
    }
    fq(X, F) {
      if (rh(this)) {
        if (X && F) {
          const Q = i8(this);
          YP(Q, X, F);
          Hj(this, Q);
        }
        xP(this, "previous");
      } else JQ(this, g.yu(this.fq, X, F));
    }
    nextVideo(X, F) {
      if (rh(this)) {
        if (X && F) {
          const Q = i8(this);
          YP(Q, X, F);
          Hj(this, Q);
        }
        xP(this, "next");
      } else JQ(this, g.yu(this.nextVideo, X, F));
    }
    RY() {
      if (rh(this)) {
        xP(this, "clearPlaylist");
        var X = i8(this);
        X.reset();
        Hj(this, X);
        this.publish("remotePlayerChange");
      } else JQ(this, this.RY);
    }
    HS() {
      rh(this) ? xP(this, "dismissAutoplay") : JQ(this, this.HS);
    }
    dispose() {
      if (this.A != 3) {
        const X = this.A;
        this.A = 3;
        this.publish("proxyStateChange", X, this.A);
      }
      super.dispose();
    }
    hj() {
      QyV(this);
      this.Y = null;
      this.B.clear();
      hQ(this, null);
      super.hj();
    }
    Aj(X) {
      if ((X != this.A || X == 2) && this.A != 3 && X != 0) {
        var F = this.A;
        this.A = X;
        this.publish("proxyStateChange", F, X);
        if (X == 1)
          for (; !this.B.isEmpty(); )
            (F = X = this.B),
              F.W.length === 0 && ((F.W = F.U), F.W.reverse(), (F.U = [])),
              X.W.pop().apply(this);
        else X == 3 && this.dispose();
      }
    }
    XX(X, F) {
      this.publish(X, F);
    }
    vS(X) {
      if (!X) this.K(null), hQ(this, null);
      else if (this.U.receiver.volume) {
        X = this.U.receiver.volume;
        const F = i8(this),
          Q = Math.round(100 * X.level || 0);
        if (F.volume != Q || F.muted != X.muted)
          PT("Cast volume update: " + X.level + (X.muted ? " muted" : "")),
            (F.volume = Q),
            (F.muted = !!X.muted),
            Hj(this, F);
      }
    }
    K(X) {
      PT("Cast media: " + !!X);
      this.W && this.W.removeUpdateListener(this.iT);
      if ((this.W = X))
        this.W.addUpdateListener(this.iT),
          n0s(this),
          this.publish("remotePlayerChange");
    }
    NS(X) {
      X ? (n0s(this), this.publish("remotePlayerChange")) : this.K(null);
    }
    JM() {
      xP(this, "sendDebugCommand", { debugCommand: "stats4nerds " });
    }
    sH() {
      const X = s2T();
      X && hQ(this, X);
    }
    Ws(X) {
      Jb("CP", X);
    }
  };
  var gb = class extends g.Xx {
    constructor(X, F = !1) {
      var Q = Bj,
        n = Ir();
      super();
      this.K = NaN;
      this.NS = !1;
      this.D = this.iT = this.Aj = this.Yb = NaN;
      this.HS = [];
      this.B = this.G = this.Y = this.W = this.U = null;
      this.CF = Q;
      this.XX = F;
      this.HS.push(
        g.uk(window, "beforeunload", () => {
          this.X(2);
        })
      );
      this.A = [];
      this.W = new SK();
      this.jx = X.id;
      this.sH = X.idType;
      this.U = ojT(this.CF, n, this.vS, this.sH == "shortLived", this.jx);
      this.U.listen("channelOpened", () => {
        Itz(this);
      });
      this.U.listen("channelClosed", () => {
        jK("Channel closed");
        isNaN(this.K) ? f6(!0) : f6();
        this.dispose();
      });
      this.U.listen("channelError", (I) => {
        f6();
        isNaN(this.J())
          ? (I == 1 &&
              this.sH == "shortLived" &&
              this.publish("browserChannelAuthError", I),
            jK(`Channel error: ${I} without reconnection`),
            this.dispose())
          : ((this.NS = !0),
            jK(
              "Channel error: " +
                I +
                " with reconnection in " +
                this.J() +
                " ms"
            ),
            Lq(this, 2));
      });
      this.U.listen("channelMessage", (I) => {
        v0h(this, I);
      });
      this.U.PA(X.token);
      this.subscribe("remoteQueueChange", () => {
        var I = this.W.videoId;
        g.nZ() && g.Fi("yt-remote-session-video-id", I);
      });
    }
    connect(X, F) {
      if (F) {
        var Q = F.listId;
        const n = F.videoId,
          I = F.videoIds,
          Z = F.playerParams,
          q = F.clickTrackingParams,
          N = F.index,
          A = { videoId: n },
          R = F.currentTime,
          O = F.locationInfo;
        F = F.loopMode;
        R !== void 0 && (A.currentTime = R <= 5 ? 0 : R);
        Z && (A.playerParams = Z);
        O && (A.locationInfo = O);
        q && (A.clickTrackingParams = q);
        Q && (A.listId = Q);
        I && I.length > 0 && (A.videoIds = I.join(","));
        N !== void 0 && (A.currentIndex = N);
        this.XX && (A.loopMode = F || "LOOP_MODE_OFF");
        Q && (this.W.listId = Q);
        this.W.videoId = n;
        this.W.index = N || 0;
        this.W.state = 3;
        ab(this.W, R);
        this.B = "UNSUPPORTED";
        Q = this.XX ? "setInitialState" : "setPlaylist";
        jK(`Connecting with ${Q} and params: ${g.pg(A)}`);
        this.U.connect({ method: Q, params: g.pg(A) }, X, UV3());
      } else jK("Connecting without params"), this.U.connect({}, X, UV3());
      c2V(this);
    }
    PA(X) {
      this.U.PA(X);
    }
    dispose() {
      this.G_() ||
        (g.vP("yt.mdx.remote.remoteClient_", null),
        this.publish("beforeDispose"),
        Lq(this, 3));
      super.dispose();
    }
    hj() {
      u8(this);
      dh(this);
      Pj(this);
      g.iB(this.iT);
      this.iT = NaN;
      g.iB(this.D);
      this.D = NaN;
      this.Y = null;
      g.dH(this.HS);
      this.HS.length = 0;
      this.U.dispose();
      super.hj();
      this.B = this.G = this.A = this.W = this.U = null;
    }
    Sx(X) {
      if (!this.A || this.A.length === 0) return !1;
      for (const F of this.A) if (!F.capabilities.has(X)) return !1;
      return !0;
    }
    ai() {
      let X = 3;
      this.G_() ||
        ((X = 0),
        isNaN(this.J()) ? this.U.Rk() && isNaN(this.K) && (X = 1) : (X = 2));
      return X;
    }
    X(X) {
      jK("Disconnecting with " + X);
      g.vP("yt.mdx.remote.remoteClient_", null);
      u8(this);
      this.publish("beforeDisconnect", X);
      X == 1 && f6();
      this.U.disconnect(X);
      this.dispose();
    }
    lT() {
      let X = this.W;
      this.Y && ((X = this.W.clone()), YP(X, this.Y, X.index));
      return Gr(X);
    }
    A$(X) {
      const F = new SK(X);
      F.videoId &&
        F.videoId != this.W.videoId &&
        ((this.Y = F.videoId),
        g.iB(this.iT),
        (this.iT = g.Gg(() => {
          if (this.Y) {
            const n = this.Y;
            this.Y = null;
            this.W.videoId != n && M7(this, "getNowPlaying");
          }
        }, 5e3)));
      const Q = [];
      (this.W.listId == F.listId &&
        this.W.videoId == F.videoId &&
        this.W.index == F.index) ||
        Q.push("remoteQueueChange");
      (this.W.playerState == F.playerState &&
        this.W.volume == F.volume &&
        this.W.muted == F.muted &&
        DG(this.W) == DG(F) &&
        g.pg(this.W.trackData) == g.pg(F.trackData)) ||
        Q.push("remotePlayerChange");
      this.W.reset(X);
      g.mS(
        Q,
        function (n) {
          this.publish(n);
        },
        this
      );
    }
    VH() {
      const X = this.U.getDeviceId(),
        F = g.s4(this.A, function (Q) {
          return Q.type == "REMOTE_CONTROL" && Q.id != X;
        });
      return F ? F.id : "";
    }
    J() {
      return this.U.gS();
    }
    rV() {
      return this.B || "UNSUPPORTED";
    }
    cS() {
      return this.G || "";
    }
    FX() {
      !isNaN(this.J()) && this.U.Vz();
    }
    QH(X, F) {
      M7(this, X, F);
      poz(this);
    }
    vS() {
      var X = g.qE("SAPISID", "") || g.qE("__Secure-1PAPISID") || "",
        F = g.qE("__Secure-3PAPISID", "") || "";
      if (!X && !F) return "";
      X = g.Cz(g.$n(X), 2);
      F = g.Cz(g.$n(F), 2);
      return g.Cz(g.$n(`,${X},${F}`), 2);
    }
  };
  gb.prototype.subscribe = gb.prototype.subscribe;
  gb.prototype.unsubscribeByKey = gb.prototype.Jc;
  gb.prototype.getProxyState = gb.prototype.ai;
  gb.prototype.disconnect = gb.prototype.X;
  gb.prototype.getPlayerContextData = gb.prototype.lT;
  gb.prototype.setPlayerContextData = gb.prototype.A$;
  gb.prototype.getOtherConnectedRemoteId = gb.prototype.VH;
  gb.prototype.getReconnectTimeout = gb.prototype.J;
  gb.prototype.getAutoplayMode = gb.prototype.rV;
  gb.prototype.getAutoplayVideoId = gb.prototype.cS;
  gb.prototype.reconnect = gb.prototype.FX;
  gb.prototype.sendMessage = gb.prototype.QH;
  gb.prototype.getXsrfToken = gb.prototype.vS;
  gb.prototype.isCapabilitySupportedOnConnectedDevices = gb.prototype.Sx;
  var y2D = class extends Mn {
    constructor(X) {
      super("ScreenServiceProxy");
      this.U_ = X;
      this.W = [];
      this.W.push(this.U_.$_s("screenChange", (0, g.la)(this.U, this)));
      this.W.push(this.U_.$_s("onlineScreenChange", (0, g.la)(this.A, this)));
    }
    ql(X) {
      return this.U_.$_gs(X);
    }
    contains(X) {
      return !!this.U_.$_c(X);
    }
    get(X) {
      return this.U_.$_g(X);
    }
    start() {
      this.U_.$_st();
    }
    add(X, F, Q) {
      this.U_.$_a(X, F, Q);
    }
    remove(X, F, Q) {
      this.U_.$_r(X, F, Q);
    }
    Dt(X, F, Q, n) {
      this.U_.$_un(X, F, Q, n);
    }
    hj() {
      const X = this.W.length;
      for (let F = 0; F < X; ++F) this.U_.$_ubk(this.W[F]);
      this.W.length = 0;
      this.U_ = null;
      super.hj();
    }
    U() {
      this.publish("screenChange");
    }
    A() {
      this.publish("onlineScreenChange");
    }
  };
  nq.prototype.$_st = nq.prototype.start;
  nq.prototype.$_gspc = nq.prototype.Dh;
  nq.prototype.$_gsppc = nq.prototype.ox;
  nq.prototype.$_c = nq.prototype.contains;
  nq.prototype.$_g = nq.prototype.get;
  nq.prototype.$_a = nq.prototype.add;
  nq.prototype.$_un = nq.prototype.Dt;
  nq.prototype.$_r = nq.prototype.remove;
  nq.prototype.$_gs = nq.prototype.ql;
  nq.prototype.$_gos = nq.prototype.ym;
  nq.prototype.$_s = nq.prototype.subscribe;
  nq.prototype.$_ubk = nq.prototype.Jc;
  var A$ = null,
    ES = !1,
    Bj = null,
    b8 = null,
    US = null,
    or = [];
  var LCT = class extends g.ZS {
    constructor(X, F, Q) {
      super();
      this.W = X;
      this.N = F;
      this.IN = Q;
      this.events = new g.$W(this);
      this.K = !1;
      this.G = new g.Ou(64);
      this.U = new g.b1(this.vS, 500, this);
      this.A = new g.b1(this.sH, 1e3, this);
      this.iT = new K6(this.jx, 0, this);
      this.Y = {};
      this.D = new g.b1(this.VH, 1e3, this);
      this.J = new g.ce(this.seekTo, 1e3, this);
      this.Sx = this.events.S(this.N, "onVolumeChange", (n) => {
        kwT(this, n);
      });
      g.z(this, this.events);
      this.events.S(F, "onCaptionsTrackListChanged", this.FX);
      this.events.S(F, "captionschanged", this.CF);
      this.events.S(F, "captionssettingschanged", this.XX);
      this.events.S(F, "videoplayerreset", this.X);
      this.events.S(F, "mdxautoplaycancel", () => {
        this.IN.HS();
      });
      F.L("enable_mdx_video_play_directly") &&
        this.events.S(F, "videodatachange", () => {
          YjH(this.W) || vl(this) || eI(this, 0);
        });
      X = this.IN;
      X.G_();
      X.subscribe("proxyStateChange", this.NS, this);
      X.subscribe("remotePlayerChange", this.B, this);
      X.subscribe("remoteQueueChange", this.X, this);
      X.subscribe("previousNextChange", this.Yb, this);
      X.subscribe("nowAutoplaying", this.Aj, this);
      X.subscribe("autoplayDismissed", this.HS, this);
      g.z(this, this.U);
      g.z(this, this.A);
      g.z(this, this.iT);
      g.z(this, this.D);
      g.z(this, this.J);
      this.XX();
      this.X();
      this.B();
    }
    hj() {
      super.hj();
      this.U.stop();
      this.A.stop();
      this.iT.stop();
      const X = this.IN;
      X.unsubscribe("proxyStateChange", this.NS, this);
      X.unsubscribe("remotePlayerChange", this.B, this);
      X.unsubscribe("remoteQueueChange", this.X, this);
      X.unsubscribe("previousNextChange", this.Yb, this);
      X.unsubscribe("nowAutoplaying", this.Aj, this);
      X.unsubscribe("autoplayDismissed", this.HS, this);
      this.IN = this.W = null;
    }
    KB(X, ...F) {
      if (this.IN.A != 2)
        if (vl(this)) {
          if (i8(this.IN).playerState != 1081 || X !== "control_seek")
            switch (X) {
              case "control_toggle_play_pause":
                i8(this.IN).isPlaying() ? this.IN.pause() : this.IN.play();
                break;
              case "control_play":
                this.IN.play();
                break;
              case "control_pause":
                this.IN.pause();
                break;
              case "control_seek":
                this.J.Y(F[0], F[1]);
                break;
              case "control_subtitles_set_track":
                T2(this, F[0]);
                break;
              case "control_set_audio_track":
                this.setAudioTrack(F[0]);
            }
        } else
          switch (X) {
            case "control_toggle_play_pause":
            case "control_play":
            case "control_pause":
              X = this.N.getCurrentTime();
              eI(this, X === 0 ? void 0 : X);
              break;
            case "control_seek":
              eI(this, F[0]);
              break;
            case "control_subtitles_set_track":
              T2(this, F[0]);
              break;
            case "control_set_audio_track":
              this.setAudioTrack(F[0]);
          }
    }
    CF(X) {
      this.iT.oS(X);
    }
    jx(X) {
      this.KB("control_subtitles_set_track", g.w$(X) ? null : X);
    }
    XX() {
      const X = this.N.getOption("captions", "track");
      g.w$(X) || T2(this, X);
    }
    G3(X) {
      this.W.G3(X, this.N.getVideoData().lengthSeconds);
    }
    FX() {
      g.w$(this.Y) || atB(this, this.Y);
      this.K = !1;
    }
    NS(X, F) {
      this.A.stop();
      F === 2 && this.sH();
    }
    B() {
      if (vl(this)) {
        this.U.stop();
        var X = i8(this.IN);
        switch (X.playerState) {
          case 1080:
          case 1081:
          case 1084:
          case 1085:
            this.W.UF = 1;
            break;
          case 1082:
          case 1083:
            this.W.UF = 0;
            break;
          default:
            this.W.UF = -1;
        }
        switch (X.playerState) {
          case 1081:
          case 1:
            this.Uw(new g.Ou(8));
            this.vS();
            break;
          case 1085:
          case 3:
            this.Uw(new g.Ou(9));
            break;
          case 1083:
          case 0:
            this.Uw(new g.Ou(2));
            this.J.stop();
            this.G3(this.N.getVideoData().lengthSeconds);
            break;
          case 1084:
            this.Uw(new g.Ou(4));
            break;
          case 2:
            this.Uw(new g.Ou(4));
            this.G3(DG(X));
            break;
          case -1:
            this.Uw(new g.Ou(64));
            break;
          case -1e3:
            this.Uw(
              new g.Ou(128, {
                errorCode: "mdx.remoteerror",
                errorMessage:
                  "This video is not available for remote playback.",
                hU: 2,
              })
            );
        }
        const Q = i8(this.IN).trackData;
        X = Q;
        var F = this.Y;
        (X || F
          ? X &&
            F &&
            X.trackName == F.trackName &&
            X.languageCode == F.languageCode &&
            X.languageName == F.languageName &&
            X.kind == F.kind
          : 1) || ((this.Y = Q), atB(this, Q));
        X = i8(this.IN);
        X.volume === -1 ||
          (Math.round(this.N.getVolume()) === X.volume &&
            this.N.isMuted() === X.muted) ||
          this.D.isActive() ||
          this.VH();
      } else DLD(this);
    }
    Yb() {
      this.N.publish("mdxpreviousnextchange");
    }
    X() {
      vl(this) || DLD(this);
    }
    Aj(X) {
      isNaN(X) || this.N.publish("mdxnowautoplaying", X);
    }
    HS() {
      this.N.publish("mdxautoplaycanceled");
    }
    setAudioTrack(X) {
      vl(this) && this.IN.setAudioTrack(cl(this).videoId, X);
    }
    seekTo(X, F) {
      i8(this.IN).playerState === -1 ? eI(this, X) : F && this.IN.seekTo(X);
    }
    VH() {
      if (vl(this)) {
        var X = i8(this.IN);
        this.events.Ew(this.Sx);
        X.muted ? this.N.mute() : this.N.unMute();
        this.N.setVolume(X.volume);
        this.Sx = this.events.S(this.N, "onVolumeChange", (F) => {
          kwT(this, F);
        });
      }
    }
    vS() {
      this.U.stop();
      if (!this.IN.G_()) {
        var X = i8(this.IN);
        X.isPlaying() && this.Uw(new g.Ou(8));
        this.G3(DG(X));
        this.U.start();
      }
    }
    sH() {
      this.A.stop();
      this.U.stop();
      const X = this.IN.gS();
      this.IN.A == 2 && !isNaN(X) && this.A.start();
    }
    Uw(X) {
      this.A.stop();
      const F = this.G;
      if (!g.vI(F, X)) {
        const Q = X.W(2);
        Q !== this.G.W(2) && this.N.DJ(Q);
        this.G = X;
        GwV(this.W, F, X);
      }
    }
  };
  var uW$ = class extends g.dB {
    constructor(X, F) {
      super(X);
      this.W = F;
    }
    getCurrentTime() {
      return this.W.getCurrentTime();
    }
    getDuration() {
      return this.W.getDuration();
    }
    Br() {
      return this.W.Br();
    }
    Kb() {
      return this.W.Kb();
    }
    K5() {
      return this.W.K5();
    }
    iJ() {
      return this.W.iJ();
    }
    getPlayerState() {
      return this.W.yw;
    }
    isAtLiveHead() {
      return this.W.isAtLiveHead();
    }
    pauseVideo() {
      p2(this.W, "control_pause");
    }
    async playVideo() {
      p2(this.W, "control_play");
    }
    seekTo(X, F) {
      p2(this.W, "control_seek", X, !F?.Py);
    }
    P1(X) {
      p2(this.W, "control_set_audio_track", X);
      return !0;
    }
  };
  var dLe = class extends g.M {
    constructor() {
      super({
        O: "div",
        V: "ytp-mdx-popup-dialog",
        C: { role: "dialog" },
        j: [
          {
            O: "div",
            V: "ytp-mdx-popup-dialog-inner-content",
            j: [
              { O: "div", V: "ytp-mdx-popup-title", gV: "You're signed out" },
              {
                O: "div",
                V: "ytp-mdx-popup-description",
                gV: "Videos you watch may be added to the TV's watch history and influence TV recommendations. To avoid this, cancel and sign in to YouTube on your computer.",
              },
              {
                O: "div",
                V: "ytp-mdx-privacy-popup-buttons",
                j: [
                  {
                    O: "button",
                    qS: ["ytp-button", "ytp-mdx-privacy-popup-cancel"],
                    gV: "Cancel",
                  },
                  {
                    O: "button",
                    qS: ["ytp-button", "ytp-mdx-privacy-popup-confirm"],
                    gV: "Confirm",
                  },
                ],
              },
            ],
          },
        ],
      });
      this.fade = new g.Pe(this, 250);
      this.cancelButton = this.BS("ytp-mdx-privacy-popup-cancel");
      this.confirmButton = this.BS("ytp-mdx-privacy-popup-confirm");
      g.z(this, this.fade);
      this.S(this.cancelButton, "click", this.W);
      this.S(this.confirmButton, "click", this.U);
    }
    wK() {
      this.fade.show();
    }
    mV() {
      this.fade.hide();
    }
    W() {
      C6("mdx-privacy-popup-cancel");
      this.mV();
    }
    U() {
      C6("mdx-privacy-popup-confirm");
      this.mV();
    }
  };
  var Ms3 = class extends g.M {
    constructor(X) {
      super({
        O: "div",
        V: "ytp-remote",
        j: [
          {
            O: "div",
            V: "ytp-remote-display-status",
            j: [
              { O: "div", V: "ytp-remote-display-status-icon", j: [g.aSW()] },
              {
                O: "div",
                V: "ytp-remote-display-status-text",
                gV: "{{statustext}}",
              },
            ],
          },
        ],
      });
      this.api = X;
      this.fade = new g.Pe(this, 250);
      g.z(this, this.fade);
      this.S(X, "presentingplayerstatechange", this.onStateChange);
      this.My(X.getPlayerStateObject());
    }
    onStateChange(X) {
      this.My(X.state);
    }
    My(X) {
      if (this.api.getPresentingPlayerType() === 3) {
        const F = {
          RECEIVER_NAME: this.api.getOption("remote", "currentReceiver").name,
        };
        X = X.W(128)
          ? g.KI("Error on $RECEIVER_NAME", F)
          : X.isPlaying() || X.isPaused()
          ? g.KI("Playing on $RECEIVER_NAME", F)
          : g.KI("Connected to $RECEIVER_NAME", F);
        this.updateValue("statustext", X);
        this.fade.show();
      } else this.fade.hide();
    }
  };
  var Baz = class extends g.Gp {
    constructor(X, F) {
      super("Play on", 1, X, F);
      this.N = X;
      this.PR = {};
      this.S(X, "onMdxReceiversChange", this.K);
      this.S(X, "presentingplayerstatechange", this.K);
      this.K();
    }
    K() {
      var X = this.N.getOption("remote", "receivers");
      X && X.length > 1 && !this.N.getOption("remote", "quickCast")
        ? ((this.PR = g.CB(X, this.B, this)),
          this.Y(g.ju(X, this.B)),
          (X = this.N.getOption("remote", "currentReceiver")),
          (X = this.B(X)),
          this.options[X] && this.U(X),
          this.enable(!0))
        : this.enable(!1);
    }
    B(X) {
      return X.key;
    }
    A(X) {
      return X === "cast-selector-receiver" ? "Cast..." : this.PR[X].name;
    }
    W(X) {
      super.W(X);
      this.N.setOption("remote", "currentReceiver", this.PR[X]);
      this.HT.mV();
    }
  };
  g.xH(
    "remote",
    class extends g.rB {
      constructor(X) {
        super(X);
        this.wm = { key: gz(), name: "This computer" };
        this.Js = null;
        this.subscriptions = [];
        this.V2 = this.IN = null;
        this.PR = [this.wm];
        this.yY = this.wm;
        this.yw = new g.Ou(64);
        this.oE = 0;
        this.UF = -1;
        this.e2 = !1;
        this.ZV = this.Cl = this.eb = null;
        if (!g.ZC(this.player.Z()) && !g.Ja(this.player.Z())) {
          X = this.player;
          var F = g.en(X);
          F && (F = F.SI()) && ((F = new Baz(X, F)), g.z(this, F));
          F = new Ms3(X);
          g.z(this, F);
          g.aP(X, F.element, 4);
          this.eb = new dLe();
          g.z(this, this.eb);
          g.aP(X, this.eb.element, 4);
          this.e2 = !!n2();
        }
      }
      create() {
        var X = this.player.Z();
        const F = g.Ni(X);
        X = {
          device: "Desktop",
          app: "youtube-desktop",
          loadCastApiSetupScript: X.L("mdx_load_cast_api_bootstrap_script"),
          enableDialLoungeToken: X.L("enable_dial_short_lived_lounge_token"),
          enableCastLoungeToken: X.L("enable_cast_short_lived_lounge_token"),
        };
        C2h(F, X);
        this.subscriptions.push(
          g.BR("yt-remote-before-disconnect", this.XN, this)
        );
        this.subscriptions.push(
          g.BR("yt-remote-connection-change", this.SZ, this)
        );
        this.subscriptions.push(
          g.BR("yt-remote-receiver-availability-change", this.f$, this)
        );
        this.subscriptions.push(g.BR("yt-remote-auto-connect", this.Mz, this));
        this.subscriptions.push(
          g.BR("yt-remote-receiver-resumed", this.Rs, this)
        );
        this.subscriptions.push(
          g.BR("mdx-privacy-popup-confirm", this.VK, this)
        );
        this.subscriptions.push(
          g.BR("mdx-privacy-popup-cancel", this.XA, this)
        );
        this.f$();
      }
      load() {
        this.player.cancelPlayback();
        super.load();
        this.ZV = new uW$(this.player.Z(), this);
        this.player.vy(this.ZV);
        this.Js = new LCT(this, this.player, this.IN);
        var X = (X = KCh()) ? X.currentTime : 0;
        const F = VR() ? new P2B() : null;
        X == 0 && F && (X = DG(i8(F)));
        X !== 0 && this.G3(X);
        GwV(this, this.yw, this.yw);
        this.player.nh(6);
      }
      unload() {
        this.player.publish("mdxautoplaycanceled");
        this.player.IT();
        this.yY = this.wm;
        g.IG(this.Js, this.IN);
        this.IN = this.ZV = this.Js = null;
        super.unload();
        this.player.nh(5);
        $_(this);
      }
      hj() {
        g.bw(this.subscriptions);
        super.hj();
      }
      getAdState() {
        return this.UF;
      }
      hasPrevious() {
        return this.IN ? i8(this.IN).hasPrevious : !1;
      }
      hasNext() {
        return this.IN ? i8(this.IN).hasNext : !1;
      }
      G3(X, F) {
        this.oE = X || 0;
        this.player.publish("progresssync", X, F);
        g.gy(this.player, "onVideoProgress", X || 0);
      }
      getCurrentTime() {
        return this.oE;
      }
      getDuration() {
        return i8(this.IN).getDuration() || 0;
      }
      Br() {
        var X = i8(this.IN);
        return X.Y ? X.W + kP(X) : X.W;
      }
      Kb() {
        return i8(this.IN).loadedTime;
      }
      K5() {
        return FCz(i8(this.IN));
      }
      iJ() {
        var X = i8(this.IN);
        return X.U > 0 ? X.U + kP(X) : X.U;
      }
      getProgressState() {
        const X = i8(this.IN),
          F = this.player.getVideoData();
        return {
          airingStart: 0,
          airingEnd: 0,
          allowSeeking: X.playerState != 1081 && this.player.CE(),
          clipEnd: F.clipEnd,
          clipStart: F.clipStart,
          current: this.getCurrentTime(),
          displayedStart: -1,
          duration: this.getDuration(),
          ingestionTime: this.Br(),
          isAtLiveHead: this.isAtLiveHead(),
          loaded: this.Kb(),
          seekableEnd: this.K5(),
          seekableStart: this.iJ(),
          offset: 0,
          viewerLivestreamJoinMediaTime: 0,
        };
      }
      isAtLiveHead() {
        return FCz(i8(this.IN)) - this.getCurrentTime() <= 1;
      }
      nextVideo() {
        this.IN && this.IN.nextVideo();
      }
      fq() {
        this.IN && this.IN.fq();
      }
      XN(X) {
        X === 1 && (this.V2 = this.IN ? i8(this.IN) : null);
      }
      SZ() {
        var X = VR() ? new P2B() : null;
        if (X) {
          const F = this.yY;
          this.loaded && this.unload();
          this.IN = X;
          this.V2 = null;
          F.key !== this.wm.key && ((this.yY = F), this.load());
        } else
          g.nL(this.IN),
            (this.IN = null),
            this.loaded &&
              (this.unload(),
              (X = this.V2) &&
                X.videoId === this.player.getVideoData().videoId &&
                this.player.cueVideoById(X.videoId, DG(X)));
        this.player.publish(
          "videodatachange",
          "newdata",
          this.player.getVideoData(),
          3
        );
      }
      f$() {
        var X = [this.wm],
          F = X.concat;
        const Q = zus();
        tQ() &&
          g.o9("yt-remote-cast-available") &&
          Q.push({ key: "cast-selector-receiver", name: "Cast..." });
        this.PR = F.call(X, Q);
        X = Nu() || this.wm;
        f2(this, X);
        g.gy(this.player, "onMdxReceiversChange");
      }
      Mz() {
        const X = Nu();
        f2(this, X);
      }
      Rs() {
        this.yY = Nu();
      }
      VK() {
        this.e2 = !0;
        $_(this);
        ES = !1;
        A$ && OS(A$, 1);
        A$ = null;
      }
      XA() {
        this.e2 = !1;
        $_(this);
        f2(this, this.wm);
        this.yY = this.wm;
        ES = !1;
        A$ = null;
        this.player.playVideo();
      }
      QM(X, F) {
        switch (X) {
          case "casting":
            return this.loaded;
          case "receivers":
            return this.PR;
          case "currentReceiver":
            return (
              F && (F.key === "cast-selector-receiver" ? zr() : f2(this, F)),
              this.loaded ? this.yY : this.wm
            );
          case "quickCast":
            return this.PR.length === 2 &&
              this.PR[1].key === "cast-selector-receiver"
              ? (F && zr(), !0)
              : !1;
        }
      }
      JM() {
        this.IN.JM();
      }
      DH() {
        return !1;
      }
      getOptions() {
        return ["casting", "receivers", "currentReceiver", "quickCast"];
      }
      isLoggedIn() {
        return g.G("PLAYER_CONFIG")?.args?.authuser !== void 0
          ? !0
          : !(!g.G("SESSION_INDEX") && !g.G("LOGGED_IN"));
      }
    }
  );
})(_yt_player);
