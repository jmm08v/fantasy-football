"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { MonoLabel } from "@/components/primitives/MonoLabel";
import { PillButton } from "@/components/primitives/PillButton";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";
import { enrollPin, isValidPin, PIN_LENGTH, verifyPin } from "@/lib/dashAuth";

/**
 * Identity check standing in front of an official run.
 *
 * The keypad is drawn rather than delegated to an `<input inputmode="numeric">`
 * for the same reason the game has thumb pads: a phone keyboard covers half
 * the screen when it opens, shifts the layout under the player, and on iOS
 * drags the whole page around as it animates. Four digits do not justify any
 * of that.
 *
 * A wrong PIN costs nothing — attempts are only spent once a run actually
 * starts, so fumbling the entry can never burn one.
 */
export function PinGate({
  player,
  headshot,
  mode,
  attemptsLeft,
  onVerified,
  onCancel,
}: {
  player: string;
  headshot: string;
  /** "set" on a player's first official run, "enter" every time after. */
  mode: "set" | "enter";
  attemptsLeft: number;
  onVerified: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const complete = isValidPin(pin);

  const pressDigit = useCallback((d: string) => {
    setError(null);
    setPin((p) => (p.length >= PIN_LENGTH ? p : p + d));
  }, []);

  async function submit() {
    if (!complete || busy) return;
    setBusy(true);
    try {
      const ok =
        mode === "set" ? await enrollPin(player, pin) : await verifyPin(player, pin);
      if (ok) {
        onVerified();
        return;
      }
      setError("That is not the PIN on file for this player.");
      setPin("");
    } catch {
      // crypto.subtle needs a secure context; a plain-http host would land
      // here rather than failing silently.
      setError("Could not check the PIN on this connection.");
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="bg-turf/95 absolute inset-0 z-30 flex flex-col overflow-y-auto backdrop-blur-sm"
      style={{
        paddingLeft: "var(--frame-inset)",
        paddingRight: "var(--frame-inset)",
        paddingTop: "calc(var(--frame-inset) + 52px)",
        paddingBottom: "var(--frame-bottom)",
      }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-y-5">
        <div className="flex flex-col items-center gap-y-3">
          <MonoLabel className="opacity-50">
            {mode === "set" ? "SET YOUR PIN" : "VERIFY IT'S YOU"}
          </MonoLabel>

          <div className="border-chalk/25 flex items-center gap-x-2 rounded-full border py-1.5 pr-4 pl-1.5">
            <Image
              src={asset(headshot)}
              alt=""
              width={28}
              height={28}
              className="bg-chalk/15 h-7 w-7 rounded-full object-cover"
            />
            <span className="type-hud">{player.toUpperCase()}</span>
          </div>

          <p className="type-body max-w-[30ch] text-center opacity-60">
            {mode === "set"
              ? "Use the last four digits of your phone number. You will enter it before every official run."
              : "Enter the last four digits of your phone number to start an official run."}
          </p>
        </div>

        {/* Filled slots rather than a text field: no caret, no keyboard, and
            the length is legible at a glance. */}
        <div className="flex justify-center gap-x-3">
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-14 w-11 rounded-2xl border transition-colors duration-150",
                error
                  ? "border-flag"
                  : i < pin.length
                    ? "border-volt bg-volt/10"
                    : "border-chalk/25",
                "flex items-center justify-center",
              )}
            >
              <span
                className={cn(
                  "font-[family-name:var(--font-hud)] text-2xl",
                  error ? "text-flag" : "text-volt",
                )}
              >
                {i < pin.length ? "•" : ""}
              </span>
            </div>
          ))}
        </div>

        <div className="flex min-h-[18px] justify-center">
          {error && <MonoLabel className="text-flag text-center">{error}</MonoLabel>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <Key key={d} onPress={() => pressDigit(d)}>
              {d}
            </Key>
          ))}
          <Key
            onPress={() => {
              setPin("");
              setError(null);
            }}
            muted
          >
            CLR
          </Key>
          <Key onPress={() => pressDigit("0")}>0</Key>
          <Key
            onPress={() => {
              setError(null);
              setPin((p) => p.slice(0, -1));
            }}
            muted
          >
            DEL
          </Key>
        </div>

        <div className="flex flex-col items-center gap-y-3">
          <p className="type-body max-w-[36ch] text-center opacity-60">
            This spends {attemptsLeft === 1 ? "your last attempt" : "one of your two attempts"} the
            moment the run starts. Quitting or reloading does not give it back,
            and whatever the clock says is what posts.
          </p>
          <div className="flex gap-x-2">
            <PillButton onClick={submit}>
              {busy ? "Checking…" : "Run it"}
            </PillButton>
            <PillButton variant="outline" onClick={onCancel}>
              Back
            </PillButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Key({
  children,
  onPress,
  muted = false,
}: {
  children: React.ReactNode;
  onPress: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "h-14 rounded-2xl border transition-colors duration-100 lg:h-16",
        "active:bg-volt active:border-volt active:text-turf",
        muted
          ? "border-chalk/20 text-chalk/50 type-hud"
          : "border-chalk/25 text-chalk font-[family-name:var(--font-hud)] text-2xl",
      )}
      // `manipulation` drops the double-tap-zoom wait without disabling
      // scrolling, which a four-key entry has no reason to block.
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      {children}
    </button>
  );
}
