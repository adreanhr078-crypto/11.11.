import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TypingIndicator } from "@/components/TypingIndicator";
import { useColors } from "@/hooks/useColors";
import { buildDeviceContext, type Persona } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let _counter = 0;
function uid(): string {
  _counter++;
  return `m-${Date.now()}-${_counter}-${Math.random().toString(36).slice(2, 7)}`;
}

const PERSONAS: Persona[] = ["entity", "narrator", "observer", "voice"];
const PERSONA_LABELS: Record<Persona, string> = {
  entity: "الكيان",
  narrator: "الراوي",
  observer: "المراقب",
  voice: "الصوت",
};

function getApiBaseUrl(): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (domain) return `https://${domain}`;
  return "";
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [persona, setPersona] = useState<Persona>("entity");
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    const currentMessages = [...messages];
    const userMsg: Message = { id: uid(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setShowTyping(true);

    await Haptics.selectionAsync();

    const chatHistory = [
      ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: text },
    ];

    let fullContent = "";
    let assistantAdded = false;

    try {
      const base = getApiBaseUrl();
      const response = await fetch(`${base}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          messages: chatHistory,
          persona,
          deviceContext: buildDeviceContext(),
        }),
      });

      if (!response.ok) throw new Error("Failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data) as { content?: string; done?: boolean };
            if (parsed.content) {
              fullContent += parsed.content;
              if (!assistantAdded) {
                setShowTyping(false);
                setMessages((prev) => [
                  ...prev,
                  { id: uid(), role: "assistant", content: fullContent },
                ]);
                assistantAdded = true;
              } else {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullContent,
                  };
                  return updated;
                });
              }
            }
          } catch {}
        }
      }
    } catch {
      setShowTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: "..." },
      ]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
      inputRef.current?.focus();
    }
  }, [input, isStreaming, messages, persona]);

  const reversedMessages = [...messages].reverse();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.primary }]}>
          الكيان 11.11
        </Text>
        <View style={styles.personaRow}>
          {PERSONAS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPersona(p)}
              style={({ pressed }) => [
                styles.personaBtn,
                {
                  borderColor: p === persona ? colors.primary : colors.border,
                  backgroundColor:
                    p === persona ? `${colors.primary}22` : "transparent",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.personaBtnText,
                  {
                    color: p === persona ? colors.primary : colors.mutedForeground,
                  },
                ]}
              >
                {PERSONA_LABELS[p]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              ابدأ الحديث مع الكيان.
            </Text>
            <Text style={[styles.emptyHint, { color: colors.border }]}>
              يراقبك منذ وصولك.
            </Text>
          </View>
        ) : (
          <FlatList
            data={reversedMessages}
            keyExtractor={(item) => item.id}
            inverted={messages.length > 0}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!!messages.length}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.role === "user"
                    ? [styles.userBubble, { backgroundColor: colors.muted }]
                    : [
                        styles.assistantBubble,
                        { borderColor: colors.border },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    {
                      color:
                        item.role === "user"
                          ? colors.foreground
                          : colors.primary,
                    },
                  ]}
                >
                  {item.content}
                </Text>
              </View>
            )}
          />
        )}

        <View
          style={[
            styles.inputRow,
            {
              paddingBottom: botPad + 8,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.muted,
                color: colors.foreground,
                borderColor: colors.border,
                fontFamily: "ShareTechMono_400Regular",
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="اكتب رسالة..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor:
                  !input.trim() || isStreaming
                    ? colors.muted
                    : colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={handleSend}
            disabled={!input.trim() || isStreaming}
          >
            <Ionicons
              name="send"
              size={18}
              color={!input.trim() || isStreaming ? colors.mutedForeground : colors.primaryForeground}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerTitle: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 18,
    letterSpacing: 2,
    textAlign: "center",
  },
  personaRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  personaBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  personaBtnText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 10,
    letterSpacing: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 14,
    letterSpacing: 1,
  },
  emptyHint: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 11,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  userBubble: {
    alignSelf: "flex-end",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderLeftWidth: 2,
    backgroundColor: "transparent",
  },
  bubbleText: {
    fontFamily: "ShareTechMono_400Regular",
    fontSize: 13,
    lineHeight: 20,
    writingDirection: "rtl",
  },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    textAlign: "right",
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
