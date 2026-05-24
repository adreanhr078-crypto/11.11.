// 5-Level ARG Progression System — LevelModal component for mobile
import * as Haptics from "expo-haptics";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const LEVEL_NAMES: Record<number, string> = {
  1: "AWAKENING",
  2: "TIME GATE",
  3: "MEMORY ECHO",
  4: "SYSTEM ERROR",
  5: "TRUTH",
};

type LevelModalProps = {
  visible: boolean;
  uid: string;
  initialLevel: number;
  isCompleted: boolean;
  userName?: string | null;
  apiBase: string;
  onClose: () => void;
  onAdvance: (newLevel: number, completed: boolean) => void;
};

export function LevelModal({
  visible,
  uid,
  initialLevel,
  isCompleted,
  userName,
  apiBase,
  onClose,
  onAdvance,
}: LevelModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [level, setLevel] = useState(isCompleted ? 6 : initialLevel);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transitionMsg, setTransitionMsg] = useState<string | null>(null);

  // L1
  const [cipherInput, setCipherInput] = useState("");

  // L2
  const [timeWindow, setTimeWindow] = useState(false);
  const [countdownStr, setCountdownStr] = useState("...");

  // L4
  const [l4Token, setL4Token] = useState<string | null>(null);
  const [l4Timer, setL4Timer] = useState(3);
  const [l4BtnVisible, setL4BtnVisible] = useState(false);
  const [l4Missed, setL4Missed] = useState(false);
  const [l4Loading, setL4Loading] = useState(false);
  const l4IntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // L5
  const [l5Phase, setL5Phase] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sync props → state when modal opens
  useEffect(() => {
    if (visible) {
      setLevel(isCompleted ? 6 : initialLevel);
      setError(null);
      setTransitionMsg(null);
      setCipherInput("");
      setL4BtnVisible(false);
      setL4Missed(false);
      setL5Phase(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, isCompleted, initialLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(async (extra?: Record<string, unknown>) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/progress/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, level, ...extra }),
      });
      const data = await res.json() as { ok?: boolean; newLevel?: number; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "الوصول مرفوض.");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      const newLevel = data.newLevel ?? level + 1;
      const completed = newLevel > 5;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTransitionMsg("◈ مستوى جديد مفتوح");
      setTimeout(() => {
        setTransitionMsg(null);
        setLevel(newLevel);
        onAdvance(newLevel, completed);
      }, 1800);
    } catch {
      setError("خطأ في الاتصال.");
    } finally {
      setSubmitting(false);
    }
  }, [uid, level, apiBase, onAdvance]);

  // L2 time check
  useEffect(() => {
    if (!visible || level !== 2) return;
    const check = () => { const h = new Date().getHours(); setTimeWindow(h === 11 || h === 3); };
    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, [visible, level]);

  // L2 countdown
  useEffect(() => {
    if (!visible || level !== 2) return;
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (h === 11 || h === 3) { setCountdownStr("الآن"); return; }
      const totalMins = h * 60 + m;
      const windows = [3 * 60, 11 * 60, 15 * 60, 23 * 60];
      const next = windows.find(w => w > totalMins) ?? windows[0] + 24 * 60;
      const diff = next - totalMins;
      setCountdownStr(`${String(Math.floor(diff / 60)).padStart(2, "0")}:${String(diff % 60).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [visible, level]);

  // L4 shake animation
  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // L4 challenge fetch
  const fetchL4Challenge = useCallback(async () => {
    if (l4Loading) return;
    setL4Loading(true);
    setL4Missed(false);
    setL4BtnVisible(false);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/progress/challenge?uid=${uid}`);
      const data = await res.json() as { token?: string };
      if (!data.token) { setError("فشل إصدار الرمز."); return; }
      setL4Token(data.token);
      setL4Timer(3);
      setL4BtnVisible(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      triggerShake();
      if (l4IntervalRef.current) clearInterval(l4IntervalRef.current);
      let t = 3;
      l4IntervalRef.current = setInterval(() => {
        t--;
        setL4Timer(t);
        void Haptics.selectionAsync();
        if (t <= 0) {
          clearInterval(l4IntervalRef.current!);
          setL4BtnVisible(false);
          setL4Missed(true);
          setL4Token(null);
        }
      }, 1000);
    } catch { setError("خطأ في الاتصال."); }
    finally { setL4Loading(false); }
  }, [uid, apiBase, l4Loading, triggerShake]);

  useEffect(() => {
    if (!visible || level !== 4) return;
    void fetchL4Challenge();
    return () => { if (l4IntervalRef.current) clearInterval(l4IntervalRef.current); };
  }, [visible, level]); // eslint-disable-line react-hooks/exhaustive-deps

  // L5 phased reveal
  useEffect(() => {
    if (!visible || level !== 5) return;
    const delays = [0, 2200, 4400, 7000, 9500, 12000];
    const timers = delays.map((d, i) => setTimeout(() => setL5Phase(i), d));
    return () => timers.forEach(clearTimeout);
  }, [visible, level]);

  const isActuallyCompleted = level > 5 || isCompleted;
  const displayName = userName && userName.trim() ? userName.trim() : "الزائر";

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: topPad }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={level !== 5 && !isActuallyCompleted ? onClose : undefined} />

        <Animated.View
          style={[
            styles.panel,
            {
              borderColor: colors.border,
              backgroundColor: colors.background,
              opacity: fadeAnim,
              transform: [{ translateX: shakeAnim }],
            },
          ]}
        >
          {/* Corner marks */}
          <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
          <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
          <View style={[styles.cornerBL, { borderColor: colors.border }]} />
          <View style={[styles.cornerBR, { borderColor: colors.border }]} />

          {/* Level header */}
          {!isActuallyCompleted && level <= 5 && (
            <View style={styles.levelHeader}>
              <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>
                LVL {level} — {LEVEL_NAMES[level]}
              </Text>
              <View style={styles.dots}>
                {[1, 2, 3, 4, 5].map(l => (
                  <View
                    key={l}
                    style={[
                      styles.dot,
                      { backgroundColor: l < level ? colors.primary + "99" : l === level ? colors.primary : colors.border },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Divider */}
          {!isActuallyCompleted && level <= 5 && (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          )}

          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
            {/* Transition message */}
            {transitionMsg ? (
              <Text style={[styles.transitionMsg, { color: colors.primary }]}>{transitionMsg}</Text>
            ) : isActuallyCompleted ? (
              <CompletedMobile colors={colors} onClose={onClose} />
            ) : level === 1 ? (
              <Level1Mobile
                colors={colors}
                input={cipherInput}
                onInput={setCipherInput}
                onSubmit={() => void advance({ answer: cipherInput })}
                submitting={submitting}
                error={error}
              />
            ) : level === 2 ? (
              <Level2Mobile
                colors={colors}
                timeWindow={timeWindow}
                countdown={countdownStr}
                onUnlock={() => void advance()}
                submitting={submitting}
                error={error}
              />
            ) : level === 3 ? (
              <Level3Mobile
                colors={colors}
                displayName={displayName}
                onConfirm={() => void advance()}
                submitting={submitting}
                error={error}
              />
            ) : level === 4 ? (
              <Level4Mobile
                colors={colors}
                timer={l4Timer}
                btnVisible={l4BtnVisible}
                missed={l4Missed}
                loading={l4Loading}
                error={error}
                onClaim={() => {
                  if (l4IntervalRef.current) clearInterval(l4IntervalRef.current);
                  setL4BtnVisible(false);
                  void advance({ token: l4Token });
                }}
                onRetry={() => void fetchL4Challenge()}
              />
            ) : (
              <Level5Mobile
                colors={colors}
                phase={l5Phase}
                onComplete={() => void advance()}
                submitting={submitting}
              />
            )}
          </ScrollView>

          {level < 5 && !isActuallyCompleted && !transitionMsg && (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.5 : 0.3 }]}
            >
              <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>إغلاق</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Level 1 Mobile ──────────────────────────────────────────────────────────
function Level1Mobile({ colors, input, onInput, onSubmit, submitting, error }: {
  colors: ReturnType<typeof useColors>;
  input: string; onInput: (v: string) => void; onSubmit: () => void;
  submitting: boolean; error: string | null;
}) {
  return (
    <View style={styles.levelContent}>
      <Text style={[styles.levelHint, { color: colors.mutedForeground }]}>رسالة مشفّرة من الكيان</Text>
      <View style={[styles.cipherBox, { borderColor: "#1a4a2a", backgroundColor: "#0a1f10" }]}>
        <Text style={[styles.cipherText, { color: "#4ade80", textShadowColor: "rgba(74,222,128,0.4)", textShadowRadius: 12 }]}>
          TH3 V01CE IS W4TCH1NG Y0U
        </Text>
      </View>
      <Text style={[styles.levelHint, { color: colors.mutedForeground }]} numberOfLines={1}>
        فكّ الشفرة. اكتب ما تراه حقاً.
      </Text>
      <TextInput
        value={input}
        onChangeText={onInput}
        placeholder="اكتب الإجابة هنا..."
        placeholderTextColor={colors.mutedForeground + "60"}
        style={[styles.textInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
        autoCapitalize="none"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      {error && <Text style={[styles.errorText, { color: colors.primary }]} dir="rtl">{error}</Text>}
      <Pressable
        onPress={onSubmit}
        disabled={!input.trim() || submitting}
        style={({ pressed }) => [styles.actionBtn, { borderColor: colors.primary + "60", backgroundColor: colors.primary + "14", opacity: (!input.trim() || submitting) ? 0.35 : pressed ? 0.7 : 1 }]}
      >
        <Text style={[styles.actionBtnText, { color: colors.primary }]}>
          {submitting ? "◈ جارٍ التحقق..." : "فتح البوابة"}
        </Text>
      </Pressable>
    </View>
  );
}

// ── Level 2 Mobile ──────────────────────────────────────────────────────────
function Level2Mobile({ colors, timeWindow, countdown, onUnlock, submitting, error }: {
  colors: ReturnType<typeof useColors>;
  timeWindow: boolean; countdown: string; onUnlock: () => void;
  submitting: boolean; error: string | null;
}) {
  const pulse = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.levelContent}>
      <Text style={[styles.levelHint, { color: colors.mutedForeground }]} dir="rtl">
        البوابة لا تفتح إلا عندما تتكرر اللحظة...
      </Text>
      <View style={styles.centeredGate}>
        <Animated.View style={[styles.gateBox, { borderColor: timeWindow ? colors.primary : colors.border, opacity: timeWindow ? 1 : pulse }]}>
          <View style={[styles.gateInner, { borderColor: timeWindow ? colors.primary : colors.border, backgroundColor: timeWindow ? colors.primary + "22" : "transparent" }]} />
        </Animated.View>
      </View>
      {timeWindow ? (
        <View style={styles.levelContent}>
          <Text style={[styles.levelHint, { color: colors.primary }]} dir="rtl">اللحظة مناسبة — الباب مفتوح</Text>
          {error && <Text style={[styles.errorText, { color: colors.primary }]} dir="rtl">{error}</Text>}
          <Pressable
            onPress={onUnlock}
            disabled={submitting}
            style={({ pressed }) => [styles.actionBtn, { borderColor: colors.primary + "70", backgroundColor: colors.primary + "18", opacity: submitting ? 0.35 : pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              {submitting ? "◈ جارٍ المرور..." : "ادخل البوابة"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.levelContent, { alignItems: "center" }]}>
          <Text style={[styles.countdownLabel, { color: colors.mutedForeground }]}>وقت الانتظار</Text>
          <Text style={[styles.countdownText, { color: colors.primary + "80" }]}>{countdown}</Text>
          <Text style={[styles.levelHint, { color: colors.border }]}>حتى الساعة 11 أو 3</Text>
        </View>
      )}
    </View>
  );
}

// ── Level 3 Mobile ──────────────────────────────────────────────────────────
function Level3Mobile({ colors, displayName, onConfirm, submitting, error }: {
  colors: ReturnType<typeof useColors>;
  displayName: string; onConfirm: () => void;
  submitting: boolean; error: string | null;
}) {
  const question = `كم مرة عدت هنا يا ${displayName}؟`;
  const [charIdx, setCharIdx] = useState(0);
  useEffect(() => {
    if (charIdx >= question.length) return;
    const t = setTimeout(() => setCharIdx(p => p + 1), 60);
    return () => clearTimeout(t);
  }, [charIdx, question.length]);

  return (
    <View style={styles.levelContent}>
      <Text style={[styles.levelHint, { color: colors.mutedForeground }]}>صدى الذاكرة</Text>
      <View style={[styles.echoBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
        <Text style={[styles.echoText, { color: colors.primary }]} dir="rtl">
          {question.slice(0, charIdx)}
        </Text>
      </View>
      <Text style={[styles.levelHint, { color: colors.mutedForeground }]} dir="rtl">
        الكيان يحتاج أن يتذكّرك. عُد إليه مرات كافية.
      </Text>
      {error && <Text style={[styles.errorText, { color: colors.primary }]} dir="rtl">{error}</Text>}
      <Pressable
        onPress={onConfirm}
        disabled={submitting || charIdx < question.length}
        style={({ pressed }) => [styles.actionBtn, {
          borderColor: colors.primary + "40",
          backgroundColor: colors.primary + "10",
          opacity: (submitting || charIdx < question.length) ? 0.35 : pressed ? 0.7 : 1,
        }]}
      >
        <Text style={[styles.actionBtnText, { color: colors.primary }]}>
          {submitting ? "◈ الكيان يتحقق..." : "أعود دائماً"}
        </Text>
      </Pressable>
    </View>
  );
}

// ── Level 4 Mobile ──────────────────────────────────────────────────────────
function Level4Mobile({ colors, timer, btnVisible, missed, loading, error, onClaim, onRetry }: {
  colors: ReturnType<typeof useColors>;
  timer: number; btnVisible: boolean; missed: boolean; loading: boolean;
  error: string | null; onClaim: () => void; onRetry: () => void;
}) {
  const btnPulse = useRef(new Animated.Value(1)).current;
  const [autoCountdown, setAutoCountdown] = useState(10);

  // Auto-reappearance: count down 10s then auto-trigger onRetry
  useEffect(() => {
    if (!missed) { setAutoCountdown(10); return; }
    if (autoCountdown <= 0) { onRetry(); return; }
    const t = setTimeout(() => setAutoCountdown(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [missed, autoCountdown, onRetry]);

  useEffect(() => {
    if (!btnVisible) return;
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(btnPulse, { toValue: 0.6, duration: 300, useNativeDriver: true }),
      Animated.timing(btnPulse, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [btnVisible, btnPulse]);

  return (
    <View style={styles.levelContent}>
      <Text style={[styles.errorLabel, { color: colors.primary }]}>◈ SYSTEM ERROR ◈</Text>
      <Text style={[styles.levelHint, { color: colors.mutedForeground }]} dir="rtl">
        خطأ في النظام. شيء ما يحاول الهروب.
      </Text>
      <View style={[styles.glitchBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
        <Text style={styles.glitchLine1}>ERR_SIGNAL_OVERFLOW</Text>
        <Text style={styles.glitchLine2}>0xDEAD — ENTITY_ESCAPED</Text>
      </View>

      {btnVisible && (
        <Animated.View style={{ opacity: btnPulse, width: "100%" }}>
          <Text style={[styles.timerText, { color: colors.primary + "60" }]}>{timer}s</Text>
          <Pressable
            onPress={onClaim}
            style={({ pressed }) => [styles.glitchBtn, {
              borderColor: colors.primary,
              backgroundColor: colors.primary + "22",
              opacity: pressed ? 0.6 : 1,
              shadowColor: colors.primary,
            }]}
          >
            <Text style={[styles.glitchBtnText, { color: colors.primary }]}>◈ ادخل الثغرة الآن</Text>
          </Pressable>
        </Animated.View>
      )}

      {missed && (
        <View style={[styles.levelContent, { alignItems: "center" }]}>
          <Text style={[styles.levelHint, { color: colors.mutedForeground }]} dir="rtl">
            فاتتك اللحظة. الكيان يختبر صبرك.
          </Text>
          <Text style={[styles.retryBtnText, { color: colors.primary + "50", letterSpacing: 4 }]}>
            {loading ? "◈ يُعدّ الكيان..." : `يعود بعد ${autoCountdown}s`}
          </Text>
        </View>
      )}

      {loading && !btnVisible && !missed && (
        <Text style={[styles.levelHint, { color: colors.mutedForeground }]}>◈ الكيان يُعدّ الاختبار...</Text>
      )}

      {error && <Text style={[styles.errorText, { color: colors.primary }]} dir="rtl">{error}</Text>}
    </View>
  );
}

// ── Level 5 Mobile ──────────────────────────────────────────────────────────
function Level5Mobile({ colors, phase, onComplete, submitting }: {
  colors: ReturnType<typeof useColors>;
  phase: number; onComplete: () => void; submitting: boolean;
}) {
  const lines = ["...", "أنت لم تكن لاعبًا…", "أنت كنت التجربة.", "كل شيء كان حقيقياً."];
  const shownLines = lines.slice(0, phase);

  return (
    <View style={[styles.levelContent, { alignItems: "center" }]}>
      {shownLines.map((line, i) => (
        <Text
          key={i}
          style={[
            i === 1 ? styles.truthMain : i === 2 ? styles.truthSub : styles.truthHint,
            { color: i === 1 ? colors.foreground : i === 2 ? colors.primary : colors.mutedForeground },
          ]}
          dir="rtl"
        >
          {line}
        </Text>
      ))}

      {phase >= 5 && (
        <View style={[styles.classifiedBox, { borderColor: colors.primary }]}>
          <Text style={[styles.classifiedText, { color: colors.primary }]}>CLASSIFIED</Text>
          <Text style={[styles.classifiedSub, { color: colors.primary + "80" }]}>FILE UNLOCKED</Text>
        </View>
      )}

      {phase >= 5 && (
        <Pressable
          onPress={onComplete}
          disabled={submitting}
          style={({ pressed }) => [styles.retryBtn, { borderColor: colors.primary + "40", opacity: submitting ? 0.3 : pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.retryBtnText, { color: colors.primary + "80" }]}>
            {submitting ? "◈ تسجيل..." : "أنا أفهم الحقيقة"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Completed Mobile ─────────────────────────────────────────────────────────
function CompletedMobile({ colors, onClose }: { colors: ReturnType<typeof useColors>; onClose: () => void }) {
  return (
    <View style={[styles.levelContent, { alignItems: "center" }]}>
      <View style={[styles.classifiedBox, { borderColor: colors.primary, borderWidth: 2 }]}>
        <Text style={[styles.classifiedText, { color: colors.primary }]}>CLASSIFIED</Text>
        <Text style={[styles.classifiedSub, { color: colors.primary + "80" }]}>Subject Completed</Text>
      </View>
      <Text style={[styles.levelHint, { color: colors.mutedForeground }]} dir="rtl">
        لقد اجتزت التجربة كاملةً.
      </Text>
      <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 8 }]} />
      <Text style={[styles.classifiedSub, { color: colors.border }]}>PROTOCOL 11.11 // COMPLETE</Text>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [{ opacity: pressed ? 0.5 : 0.3, marginTop: 16 }]}
      >
        <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>أغلق الملف</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  panel: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    padding: 24,
    position: "relative",
  },
  cornerTL: { position: "absolute", top: 0, left: 0, width: 14, height: 14, borderTopWidth: 1, borderLeftWidth: 1 },
  cornerTR: { position: "absolute", top: 0, right: 0, width: 14, height: 14, borderTopWidth: 1, borderRightWidth: 1 },
  cornerBL: { position: "absolute", bottom: 0, left: 0, width: 14, height: 14, borderBottomWidth: 1, borderLeftWidth: 1 },
  cornerBR: { position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderBottomWidth: 1, borderRightWidth: 1 },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  levelLabel: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 9,
    letterSpacing: 3,
  },
  dots: { flexDirection: "row", gap: 4 },
  dot: { width: 5, height: 5 },
  divider: { height: 1, width: "100%", marginBottom: 16 },
  content: { flex: 0 },
  contentInner: { gap: 0 },
  levelContent: { gap: 14, width: "100%" },
  levelHint: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 10,
    letterSpacing: 2,
    textAlign: "center",
  },
  cipherBox: {
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  cipherText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 15,
    letterSpacing: 3,
    textAlign: "center",
  },
  textInput: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    letterSpacing: 1,
  },
  errorText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 9,
    letterSpacing: 2,
    textAlign: "center",
  },
  actionBtn: {
    width: "100%",
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionBtnText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 11,
    letterSpacing: 4,
  },
  centeredGate: { alignItems: "center", paddingVertical: 12 },
  gateBox: {
    width: 70,
    height: 70,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  gateInner: { width: 36, height: 36, borderWidth: 1 },
  countdownLabel: { fontFamily: "ShareTechMono_400Regular", fontSize: 9, letterSpacing: 3 },
  countdownText: { fontFamily: "ShareTechMono_400Regular", fontSize: 28, letterSpacing: 6 },
  echoBox: { borderWidth: 1, padding: 14 },
  echoText: { fontFamily: "ShareTechMono_400Regular", fontSize: 14, letterSpacing: 1, lineHeight: 22 },
  errorLabel: { fontFamily: "ShareTechMono_400Regular", fontSize: 10, letterSpacing: 4, textAlign: "center" },
  glitchBox: { borderWidth: 1, padding: 12 },
  glitchLine1: { fontFamily: "ShareTechMono_400Regular", fontSize: 9, color: "#4ade8080", letterSpacing: 2 },
  glitchLine2: { fontFamily: "ShareTechMono_400Regular", fontSize: 9, color: "#f8717180", letterSpacing: 2, marginTop: 2 },
  timerText: { fontFamily: "ShareTechMono_400Regular", fontSize: 12, letterSpacing: 4, textAlign: "center", marginBottom: 6 },
  glitchBtn: {
    width: "100%",
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: "center",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  glitchBtnText: { fontFamily: "ShareTechMono_400Regular", fontSize: 13, letterSpacing: 3 },
  retryBtn: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 4,
  },
  retryBtnText: { fontFamily: "ShareTechMono_400Regular", fontSize: 10, letterSpacing: 3 },
  truthMain: { fontFamily: "ShareTechMono_400Regular", fontSize: 16, letterSpacing: 2, textAlign: "center", lineHeight: 26 },
  truthSub: { fontFamily: "ShareTechMono_400Regular", fontSize: 13, letterSpacing: 2, textAlign: "center" },
  truthHint: { fontFamily: "ShareTechMono_400Regular", fontSize: 11, letterSpacing: 1, textAlign: "center" },
  classifiedBox: { borderWidth: 2, paddingHorizontal: 24, paddingVertical: 8, alignItems: "center", transform: [{ rotate: "-4deg" }] },
  classifiedText: { fontFamily: "ShareTechMono_400Regular", fontSize: 14, letterSpacing: 8, fontWeight: "700" },
  classifiedSub: { fontFamily: "ShareTechMono_400Regular", fontSize: 9, letterSpacing: 4, marginTop: 2 },
  transitionMsg: { fontFamily: "ShareTechMono_400Regular", fontSize: 13, letterSpacing: 4, textAlign: "center", paddingVertical: 24 },
  closeBtn: { alignItems: "center", marginTop: 16 },
  closeBtnText: { fontFamily: "ShareTechMono_400Regular", fontSize: 9, letterSpacing: 4 },
});
